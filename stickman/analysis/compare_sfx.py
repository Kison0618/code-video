# 合成音效 vs 原片：同一套量法对比每一类声音
# 用法：python compare_sfx.py <火柴人VS编程.mp4> [输出图.png]
# 对每一类：从原片里取几处已确认的同类声音（时间点见 REFS，均对照过画面），和 audio/sfx.py 合成的同类声音逐项比较：
#   峰值 dB、长度（掉到峰值下 30 dB）、频谱重心、主频、10 ms 一格的主频走向，以及两个相似度：
#   谱形相似度 = 平均 log-mel 频谱的相关系数；包络相似度 = 前 300 ms 的 dB 包络的相关系数（都是 1 最好）。
import sys, os, subprocess, json
import numpy as np
import librosa
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'audio'))
import sfx

SR = 48000
src = sys.argv[1]
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-t', '100', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
REF_AUDIO = np.frombuffer(raw, np.float32).astype(np.float64)

# 原片里每类声音的时间点（秒）和截取长度：见 ref_times.json（都对照画面确认过）
TIMES = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'ref_times.json'), encoding='utf-8'))['events']
GENS = {'blink_on': lambda: sfx.s_blink(True), 'blink_off': lambda: sfx.s_blink(False), 'key': lambda: sfx.s_key(), 'run': lambda: sfx.s_run(), 'output': lambda: sfx.s_output(), 'touch': lambda: sfx.s_touch(), 'error': lambda: sfx.s_error(), 'touch2': lambda: sfx.s_touch2(), 'select': lambda: sfx.s_select(), 'step': lambda: sfx.s_step(), 'body': lambda: sfx.s_body(), 'laptop': lambda: sfx.s_laptop()}
REFS = {k: (TIMES[k][0], TIMES[k][1], GENS[k]) for k in GENS}

def onset_align(x, d):
    # 从截取窗口里找真正的起点（第一个超过峰值 -20 dB 的位置），两边按同样方式对齐
    e = np.abs(x); thr = e.max() * 0.1
    i = int(np.argmax(e > thr)); i = max(0, i - int(0.002 * SR))
    return x[i: i + int(d * SR)]

def feats(x, d):
    x = sfx.pad(x, int(d * SR))[: int(d * SR)]
    pk = sfx.peak_db(x)
    w = np.lib.stride_tricks.sliding_window_view(sfx.pad(x, 256), 256)[::64]
    db = 20 * np.log10(np.sqrt((w ** 2).mean(1)) + 1e-12)
    ip = int(np.argmax(db)); below = np.where(db[ip:] < db[ip] - 30)[0]
    dur = (ip + (below[0] if len(below) else len(db) - ip)) * 64 / SR
    S = np.abs(np.fft.rfft(x * np.hanning(len(x)), 1 << 15)); f = np.fft.rfftfreq(1 << 15, 1 / SR); P = S ** 2 + 1e-18
    cen = (f * P).sum() / P.sum(); dom = f[np.argmax(P * (f > 50))]
    mel = librosa.power_to_db(librosa.feature.melspectrogram(y=x, sr=SR, n_fft=2048, hop_length=240, n_mels=64, fmax=16000)).mean(1)
    env = np.interp(np.arange(0, min(d, 0.3), 0.005), np.arange(len(db)) * 64 / SR, db)
    St = np.abs(librosa.stft(x, n_fft=2048, hop_length=480, center=False)); ft = librosa.fft_frequencies(sr=SR, n_fft=2048)
    m = (ft > 150) & (ft < 8000)
    track = [int(ft[m][np.argmax(St[m, k])]) for k in range(St.shape[1])][:12]
    return dict(peak=pk, dur=dur, cen=cen, dom=dom, mel=mel, env=env, track=track)

def corr(a, b):
    n = min(len(a), len(b)); a, b = a[:n] - a[:n].mean(), b[:n] - b[:n].mean()
    return float((a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-12))

rows = []
print(f"{'类型':10s} {'':4s} {'峰值dB':>7s} {'长度ms':>7s} {'重心Hz':>7s} {'主频Hz':>7s}  谱形  包络   主频走向（每 10 ms）")
for name, (times, d, gen) in REFS.items():
    rf = [feats(onset_align(REF_AUDIO[int((t - 0.01) * SR): int((t + d + 0.05) * SR)], d), d) for t in times]
    sf = [feats(onset_align(gen(), d), d) for _ in range(4)]
    avg = lambda L, k: float(np.median([r[k] for r in L]))
    rmel = np.mean([r['mel'] for r in rf], 0); smel = np.mean([s['mel'] for s in sf], 0)
    renv = np.mean([r['env'] for r in rf], 0); senv = np.mean([s['env'] for s in sf], 0)
    cm, ce = corr(rmel, smel), corr(renv, senv)
    for lab, L in (('原片', rf), ('合成', sf)):
        print(f"{name:10s} {lab:4s} {avg(L,'peak'):7.1f} {avg(L,'dur')*1000:7.0f} {avg(L,'cen'):7.0f} {avg(L,'dom'):7.0f}  " +
              (f"{cm:.2f}  {ce:.2f}  " if lab == '合成' else ' ' * 12) + ' '.join(map(str, L[0]['track'])))
    rows.append((name, rmel, smel, renv, senv, cm, ce))
print('\n平均谱形相似度 %.2f，平均包络相似度 %.2f' % (np.mean([r[5] for r in rows]), np.mean([r[6] for r in rows])))

if len(sys.argv) > 2:
    from PIL import Image, ImageDraw
    W, Hh = 360, 200
    sheet = Image.new('RGB', (W * 4, Hh * ((len(rows) + 1) // 2)), (12, 12, 12))
    for k, (name, rmel, smel, renv, senv, cm, ce) in enumerate(rows):
        ox, oy = (k % 2) * W * 2, (k // 2) * Hh
        for j, (a, b, lab) in enumerate(((rmel, smel, f'{name} 谱形 {cm:.2f}'), (renv, senv, f'{name} 包络 {ce:.2f}'))):
            im = Image.new('RGB', (W, Hh), (12, 12, 12)); dr = ImageDraw.Draw(im)
            lo, hi = min(a.min(), b.min()), max(a.max(), b.max())
            for arr, col in ((a, (255, 200, 0)), (b, (80, 200, 255))):
                pts = [(int(i / (len(arr) - 1) * (W - 10)) + 5, int(Hh - 15 - (v - lo) / (hi - lo + 1e-9) * (Hh - 35))) for i, v in enumerate(arr)]
                dr.line(pts, fill=col, width=2)
            dr.text((6, 4), lab + '  黄=原片 蓝=合成', fill=(230, 230, 230))
            sheet.paste(im, (ox + j * W, oy))
    sheet.save(sys.argv[2]); print('图 →', sys.argv[2])
