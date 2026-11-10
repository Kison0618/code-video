#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
把配音对齐到文案，生成 timing/timing.json 和 src/timing.js（画面只读这个文件，不写死秒数）。

用法（在 tongyigeren/ 目录下）：
    python tools/align.py 配音.wav                 # 语音识别 + 对齐（需要 pip install faster-whisper pypinyin）
    python tools/align.py --asr 已有识别结果.json   # 跳过识别，只做对齐
    python tools/align.py 配音.wav --tail 19       # 最后一句说完以后，片尾留多少秒（默认 19）

识别结果 json 的格式：[{"words": [[开始秒, 结束秒, "字或词"], ...]}, ...]
对齐按拼音比较，同音错字（桅杆 / 围杆）不影响；识别漏掉的字按前后时间插值。
脚本结束时会列出“对不上的句子”，那几句要人工听一下。
"""
import sys, os, json, re, difflib, argparse, subprocess, tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUNCT = re.compile(r'[\s，。、？！“”‘’：；,.?!:;"\'{}《》（）()·…—\-]')
DIG = '零一二三四五六七八九'


def num2cn(s):
    n = int(s)
    if n == 0:
        return '零'
    if n >= 100000:
        return ''.join(DIG[int(c)] for c in s)
    out, units = '', ['', '十', '百', '千', '万']
    ds = [int(c) for c in str(n)]
    L = len(ds)
    zero = False
    for i, d in enumerate(ds):
        u = L - 1 - i
        if d == 0:
            zero = True
            continue
        if zero and out:
            out += '零'
        zero = False
        if not (d == 1 and u == 1 and not out):
            out += '两' if (d == 2 and u >= 2 and not out) else DIG[d]
        out += units[u]
    return out


def to_py(chars):
    try:
        from pypinyin import lazy_pinyin
        return [lazy_pinyin(c)[0] for c in chars]
    except ImportError:
        return list(chars)


def run_asr(audio, model):
    import numpy as np
    from faster_whisper import WhisperModel
    wav = audio
    tmp = None
    if not audio.lower().endswith('.wav') or True:
        tmp = tempfile.NamedTemporaryFile(suffix='.wav', delete=False).name
        subprocess.run([os.environ.get('FFMPEG', 'ffmpeg'), '-v', 'error', '-y', '-i', audio, '-ac', '1', '-ar', '16000', '-c:a', 'pcm_s16le', tmp], check=True)
        wav = tmp
    import wave
    w = wave.open(wav)
    a = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768.0
    dur = len(a) / 16000.0
    m = WhisperModel(model, device='cpu', compute_type='int8')
    segs, _ = m.transcribe(a, language='zh', word_timestamps=True, vad_filter=True,
                           initial_prompt='以下是普通话的句子，使用简体中文。')
    out = [{'start': s.start, 'end': s.end, 'text': s.text,
            'words': [[round(x.start, 3), round(x.end, 3), x.word] for x in (s.words or [])]} for s in segs]
    if tmp:
        os.unlink(tmp)
    return out, dur


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('audio', nargs='?')
    ap.add_argument('--asr')
    ap.add_argument('--model', default='large-v3-turbo')
    ap.add_argument('--tail', type=float, default=19.0)
    ap.add_argument('--duration', type=float)
    ap.add_argument('--name', default=None, help='写进 timing 的音频文件名（预览页用它找音频）')
    a = ap.parse_args()

    lines = json.load(open(os.path.join(ROOT, 'timing', 'lines.json'), encoding='utf-8'))['lines']
    dur = a.duration
    if a.asr:
        asr = json.load(open(a.asr, encoding='utf-8'))
    else:
        if not a.audio:
            ap.error('要给配音文件，或用 --asr 给识别结果')
        asr, dur = run_asr(a.audio, a.model)
        json.dump(asr, open(os.path.join(ROOT, 'timing', 'asr_last.json'), 'w', encoding='utf-8'), ensure_ascii=False)

    # 识别结果 → 逐字时间
    bc, bs, be = [], [], []
    for seg in asr:
        for st, en, w in seg['words']:
            w = re.sub(r'\d+', lambda m: num2cn(m.group(0)), w)
            w = PUNCT.sub('', w)
            if not w:
                continue
            n = len(w)
            st = max(st, en - 0.42 * n)          # 词首带了一段静音时，往后收
            for k, ch in enumerate(w):
                bc.append(ch)
                bs.append(st + (en - st) * k / n)
                be.append(st + (en - st) * (k + 1) / n)

    # 文案 → 逐字
    ac, owner = [], []
    for li, L in enumerate(lines):
        s = PUNCT.sub('', L['text'])
        L['_plain'] = s
        for k, ch in enumerate(s):
            ac.append(ch)
            owner.append((li, k))

    sm = difflib.SequenceMatcher(None, to_py(ac), to_py(bc), autojunk=False)
    ts = [None] * len(ac)
    te = [None] * len(ac)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            ts[blk.a + k] = bs[blk.b + k]
            te[blk.a + k] = be[blk.b + k]
    matched = [x is not None for x in ts]

    # 没对上的字：前后插值
    known = [i for i, x in enumerate(ts) if x is not None]
    if not known:
        sys.exit('一个字都没对上，检查音频和文案')
    for i in range(len(ac)):
        if ts[i] is not None:
            continue
        p = max([k for k in known if k < i], default=None)
        q = min([k for k in known if k > i], default=None)
        if p is None:
            ts[i] = max(0.0, ts[q] - 0.2 * (q - i)); te[i] = ts[i] + 0.2
        elif q is None:
            ts[i] = te[p] + 0.2 * (i - p - 1); te[i] = ts[i] + 0.2
        else:
            f = (i - p) / (q - p)
            ts[i] = te[p] + (ts[q] - te[p]) * (f - 1 / (q - p)) if q - p > 1 else te[p]
            ts[i] = te[p] + (ts[q] - te[p]) * ((i - p - 1) / max(1, q - p - 1)) * 0.999
            te[i] = min(ts[q], ts[i] + 0.25)
    for i in range(1, len(ts)):                   # 保证时间不倒退
        if ts[i] < ts[i - 1]:
            ts[i] = ts[i - 1]
        if te[i] < ts[i]:
            te[i] = ts[i] + 0.05

    out = {}
    bad = []
    for li, L in enumerate(lines):
        idx = [i for i, o in enumerate(owner) if o[0] == li]
        ok = sum(1 for i in idx if matched[i]) / len(idx)
        if ok < 0.6:
            bad.append((L['id'], L['text'], round(ok, 2)))
        out[L['id']] = {'s': round(ts[idx[0]], 3), 'e': round(te[idx[-1]], 3),
                        'c': [round(ts[i], 3) for i in idx]}
    last = out[lines[-1]['id']]['e']
    total = round(last + a.tail, 2)
    name = a.name or (os.path.basename(a.audio) if a.audio else None)
    res = {'audio': name, 'audio_duration': dur, 'total': total, 'lines': out}
    json.dump(res, open(os.path.join(ROOT, 'timing', 'timing.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    js = ('// 由 tools/align.py 生成，不要手改。换配音后重新跑一遍 align.py 即可，画面会自动跟着走。\n'
          'window.LINES = ' + json.dumps([{k: v for k, v in L.items() if not k.startswith('_')} for L in lines], ensure_ascii=False) + ';\n'
          'window.TIMING = ' + json.dumps(res, ensure_ascii=False) + ';\n')
    open(os.path.join(ROOT, 'src', 'timing.js'), 'w', encoding='utf-8').write(js)
    print(f'对齐完成：{len(lines)} 句，最后一句结束于 {last:.2f}s，全片 {total}s')
    if bad:
        print('下面这些句子对上的字不到六成，时间是插值出来的，请人工听一下：')
        for b in bad:
            print('  ', b)


if __name__ == '__main__':
    main()
