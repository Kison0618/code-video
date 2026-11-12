#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配音剪辑：剪掉重读、统一停顿。只做剪辑，不做降噪和响度（那一步见 HANDOFF.md 第 2 节）。

用法（在 tongyigeren/ 目录下）：
    python tools/voice_edit.py <原始录音.m4a> <输出.wav>
    python tools/voice_edit.py <原始录音.m4a> <输出.wav> --asr 已有识别结果.json   # 跳过识别

CUTS 里是 Track-23_20261112-215333.m4a 的两处重读（原始录音里的秒数）。换了录音要重新找。
需要：ffmpeg、numpy、faster-whisper、pypinyin
"""
import sys, os, json, argparse, subprocess, tempfile
import numpy as np
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import align

CUTS = [(94.6, 110.45, '“两千年前……那艘船”第一遍（读到一半停了，有杂音），保留第二遍'),
        (188.95, 200.45, '“你记得的每一件往事……机会也最多”第一遍（“最多”读成了别的），保留第二遍')]
ROOM_TONE = (108.8, 110.3)              # 用来铺在停顿里的一段房间底噪（原始录音里的秒数）
LONG = {'a2': 1.0, 'b8': 1.5, 'b12': .8, 'd5': .8, 'd8': 1.5, 'e2': .9, 'e3': .9, 'f13': 1.0, 'g3': 2.6, 'g4': .9, 'g7': 1.0, 'h3': 1.0,
        'h18': 1.3, 'i1': 1.0, 'i3': .9, 'i4': 1.2, 'i8': 1.0, 'i9': .7, 'i10': 1.6, 'j3': 1.0, 'j5': .9}   # 这些句子后面停得长一点
SAME_CH, NEW_CH, IN_LINE = .6, 1.25, (.14, .38)
SR = 48000


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('audio'); ap.add_argument('out'); ap.add_argument('--asr')
    a_ = ap.parse_args()
    raw = subprocess.run([os.environ.get('FFMPEG', 'ffmpeg'), '-v', 'error', '-i', a_.audio, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    a = np.frombuffer(raw, dtype=np.float32).copy()
    asr = json.load(open(a_.asr, encoding='utf-8')) if a_.asr else align.run_asr(a_.audio, 'large-v3-turbo')[0]
    # 1) 找说话段：10ms 一帧，响度高于 -46 dBFS 算有声
    hop = 480; fr = len(a) // hop
    db = np.array([20 * np.log10(np.sqrt((a[i * hop:(i + 1) * hop] ** 2).mean()) + 1e-9) for i in range(fr)])
    chunks, i = [], 0
    while i < fr:
        if db[i] > -46:
            j = i
            while j < fr and db[j] > -46: j += 1
            chunks.append([i * hop / SR, j * hop / SR]); i = j
        else: i += 1
    mg = []
    for c in chunks:
        if mg and c[0] - mg[-1][1] < .16: mg[-1][1] = c[1]
        else: mg.append(c)
    keep = [[max(0, c[0] - .05), c[1] + .07] for c in mg if c[1] - c[0] > .06]
    keep = [c for c in keep if not any(c[0] < b and c[1] > x for x, b, _ in CUTS)]
    # 2) 句子边界：去掉重读部分的词，再对齐文案
    for seg in asr: seg['words'] = [w for w in seg['words'] if not any(x <= w[0] < b for x, b, _ in CUTS)]
    tmp = tempfile.NamedTemporaryFile('w', suffix='.json', delete=False, encoding='utf-8'); json.dump(asr, tmp, ensure_ascii=False); tmp.close()
    T, L = align_lines(tmp.name); os.unlink(tmp.name)
    ends = [(T[l['id']]['e'], k) for k, l in enumerate(L)]

    def target(g0, g1):
        best = None
        for e, k in ends:
            if g0 - .35 <= e <= g1 + .1 and k + 1 < len(L) and T[L[k + 1]['id']]['s'] >= g1 - .35: best = k
        if best is None: return min(max(g1 - g0, IN_LINE[0]), IN_LINE[1])
        l, n = L[best], L[best + 1]
        return LONG.get(l['id'], SAME_CH if l['ch'] == n['ch'] else NEW_CH)
    # 3) 拼接：停顿里铺房间底噪，接缝 12ms 淡入淡出
    quiet = a[int(ROOM_TONE[0] * SR):int(ROOM_TONE[1] * SR)]
    tone = lambda n: np.resize(quiet, n) * .9
    fade = int(.012 * SR); out = [tone(int(.5 * SR))]
    for k, c in enumerate(keep):
        seg = a[int(c[0] * SR):int(c[1] * SR)].copy(); seg[:fade] *= np.linspace(0, 1, fade); seg[-fade:] *= np.linspace(1, 0, fade)
        out.append(seg)
        if k + 1 < len(keep): out.append(tone(int(target(c[1], keep[k + 1][0]) * SR)))
    y = np.concatenate(out + [tone(SR)]).astype(np.float32)
    subprocess.run([os.environ.get('FFMPEG', 'ffmpeg'), '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', '-', '-c:a', 'pcm_f32le', a_.out], input=y.tobytes(), check=True)
    print('原长 %.1fs → 剪后 %.1fs，%d 个说话段' % (len(a) / SR, len(y) / SR, len(keep)))
    for x, b, why in CUTS: print('  剪掉 %.2f–%.2f：%s' % (x, b, why))


def align_lines(asr_path):
    """借 align.py 的对齐逻辑拿到每句在原始录音里的起止时间（不改动仓库里的 timing 文件）。"""
    lines = json.load(open(os.path.join(ROOT, 'timing', 'lines.json'), encoding='utf-8'))['lines']
    bak = {f: open(os.path.join(ROOT, f), 'rb').read() for f in ('timing/timing.json', 'src/timing.js')}
    try:
        subprocess.run([sys.executable, os.path.join(ROOT, 'tools', 'align.py'), '--asr', asr_path, '--duration', '1', '--name', 'x'], check=True, capture_output=True)
        T = json.load(open(os.path.join(ROOT, 'timing', 'timing.json'), encoding='utf-8'))['lines']
    finally:
        for f, b in bak.items(): open(os.path.join(ROOT, f), 'wb').write(b)
    return T, lines


if __name__ == '__main__':
    main()
