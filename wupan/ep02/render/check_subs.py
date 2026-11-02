# 字幕核对：用成片音频做一遍识别（Paraformer 字级时间戳），和画面字幕的起止比较
#   python check_subs.py <成片.mp4 或 wav> [--fix]
# 输出 out/_字幕核对.md：每块字幕的 画面起止 / 识别起止 / 偏差；列出起止偏差 > 0.25 秒的块
# --fix：把偏差超标的块写进 ../voice/full/caps_fix.json（timeline.js 读它覆盖那几块的起止），再重新渲染核对，直到清零
import sys, os, re, json, difflib, subprocess
import numpy as np, librosa, sherpa_onnx

HERE = os.path.dirname(os.path.abspath(__file__))
FF = r"F:\AI\For AI to use\codex2\AI-Coding-SuperVideos\.venv\Scripts\ffmpeg.exe"
M = r"C:\peiyin\asr-models\sherpa-onnx-paraformer-zh-2023-09-14"
TH = 0.25
src = sys.argv[1]; fix = '--fix' in sys.argv

caps = json.loads(subprocess.check_output(['node', '-e', "const TL=require('./src/timeline');console.log(JSON.stringify(TL.CAPS.map(c=>({id:c.id,k:c.k,s:c.s,t0:c.t0,t1:c.t1}))))"], cwd=HERE).decode('utf8').strip().splitlines()[-1])

wav = os.path.join(HERE, '.render-tmp', '_asr.wav')
subprocess.run([FF, '-y', '-v', 'error', '-i', src, '-vn', '-ac', '1', '-ar', '16000', wav], check=True)
sr = 16000; y, _ = librosa.load(wav, sr=sr); dur = len(y) / sr
rec = sherpa_onnx.OfflineRecognizer.from_paraformer(paraformer=M + r"\model.int8.onnx", tokens=M + r"\tokens.txt", num_threads=4)
db = 20 * np.log10(librosa.feature.rms(y=y, frame_length=640, hop_length=160)[0] + 1e-9); v = db > db.max() - 40
cuts, i = [0.0], 0
while i < len(v):
    if not v[i]:
        j = i
        while j < len(v) and not v[j]: j += 1
        g = (i + j) / 2 * 0.01
        if (j - i) * 0.01 >= 0.18 and g - cuts[-1] >= 5: cuts.append(g)
        i = j
    else: i += 1
cuts.append(dur); toks = []
for a, b in zip(cuts, cuts[1:]):
    st = rec.create_stream(); st.accept_waveform(sr, y[int(a * sr):int(b * sr)]); rec.decode_stream(st)
    toks += [(t, a + ts) for t, ts in zip(st.result.tokens, st.result.timestamps) if re.match(r'[\u4e00-\u9fff]', t)]

# 参考：所有字幕块的汉字，记下每个字属于哪一块
ref, owner = [], []
for n, c in enumerate(caps):
    for ch in c['s']:
        if '\u4e00' <= ch <= '\u9fff': ref.append(ch); owner.append(n)
hyp = [t for t, _ in toks]
sm = difflib.SequenceMatcher(None, ref, hyp, autojunk=False)
t_of = [None] * len(ref)
for a, b, n in sm.get_matching_blocks():
    for q in range(n): t_of[a + q] = toks[b + q][1]

rows, bad, fixes = [], [], {}
for n, c in enumerate(caps):
    idx = [q for q in range(len(ref)) if owner[q] == n]
    got = [(q, t_of[q]) for q in idx if t_of[q] is not None]
    if len(got) < max(2, len(idx) * 0.5) or got[0][0] != idx[0] and got[-1][0] != idx[-1]:
        rows.append((c, None, None, None, None, f'识别只对上 {len(got)}/{len(idx)} 字，跳过')); continue
    # 首字 / 末字没对上：用对上的字按字数外推
    per = (got[-1][1] - got[0][1]) / max(1, got[-1][0] - got[0][0]) if len(got) > 1 else 0.18
    a0 = got[0][1] - (got[0][0] - idx[0]) * per
    a1 = got[-1][1] + (idx[-1] - got[-1][0]) * per + 0.22
    d0, d1 = c['t0'] - a0, c['t1'] - a1
    note = ''
    if re.match(r'[A-Za-z]', c['s']): a0, d0, note = c['t0'], 0.0, '首字是英文，起点不比'
    if abs(d0) > TH or abs(d1) > TH:
        bad.append(n); note = (note + ' 超标').strip()
        fixes[f"{c['id']}#{c['k']}"] = {'t0': round(a0, 2), 't1': round(a1, 2), 's': c['s']}
    rows.append((c, a0, a1, d0, d1, note))

out = os.path.join(HERE, 'out', '_字幕核对.md')
with open(out, 'w', encoding='utf8') as f:
    f.write(f'# 字幕核对（{os.path.basename(src)}，阈值 {TH} 秒）\n\n共 {len(caps)} 块，超标 {len(bad)} 块。偏差 = 画面字幕时刻 − 识别时刻（末字时刻 + 0.22 秒当作字幕应结束的时刻）。\n\n')
    f.write('| 句 | 字幕 | 画面起 | 识别起 | 起偏差 | 画面止 | 识别止 | 止偏差 | 备注 |\n|---|---|---|---|---|---|---|---|---|\n')
    for c, a0, a1, d0, d1, note in rows:
        if a0 is None: f.write(f"| {c['id']} | {c['s']} | {c['t0']:.2f} | – | – | {c['t1']:.2f} | – | – | {note} |\n")
        else: f.write(f"| {c['id']} | {c['s']} | {c['t0']:.2f} | {a0:.2f} | {d0:+.2f} | {c['t1']:.2f} | {a1:.2f} | {d1:+.2f} | {note} |\n")
print(f'{len(caps)} 块，超标 {len(bad)} 块 → {out}')
for n in bad:
    c, a0, a1, d0, d1, _ = rows[n]
    print(f"  {c['id']} {c['s']}  起 {d0:+.2f}  止 {d1:+.2f}")
if fix:
    fp = os.path.join(HERE, '..', 'voice', 'v7', 'caps_fix.json')
    old = json.load(open(fp, encoding='utf8')) if os.path.exists(fp) else {}
    old.update(fixes)
    json.dump(old, open(fp, 'w', encoding='utf8'), ensure_ascii=False, indent=1)
    print('写入', fp, len(old), '条')
os.remove(wav)
