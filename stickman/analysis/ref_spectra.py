# 从原片量出每类声音的"频谱包络"（48 个对数频带的平均能量，dB），存成 audio/ref_spectra.json
# audio/sfx.py 用它给合成音补上原片那种宽频的"质感"（只存测量数字，不存原片音频）
# 用法：python ref_spectra.py <火柴人VS编程.mp4>
import sys, os, json, subprocess
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
BANDS = np.geomspace(40, 18000, 49)          # 48 个频带的边界
raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', sys.argv[1], '-t', '100', '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
y = np.frombuffer(raw, np.float32).astype(np.float64)
T = json.load(open(os.path.join(HERE, 'ref_times.json'), encoding='utf-8'))['events']

def band_db(x):
    n = 1 << 15
    P = np.abs(np.fft.rfft(x * np.hanning(len(x)), n)) ** 2; f = np.fft.rfftfreq(n, 1 / SR)
    return np.array([10 * np.log10(P[(f >= a) & (f < b)].mean() + 1e-20) for a, b in zip(BANDS[:-1], BANDS[1:])])

def dur_cen(x):
    # 长度 = 掉到峰值下 30 dB 的时刻；重心 = 功率谱的加权平均频率
    w = np.lib.stride_tricks.sliding_window_view(np.pad(x, (0, 256)), 256)[::64]
    db = 20 * np.log10(np.sqrt((w ** 2).mean(1)) + 1e-12); ip = int(np.argmax(db))
    below = np.where(db[ip:] < db[ip] - 30)[0]
    P = np.abs(np.fft.rfft(x * np.hanning(len(x)), 1 << 15)) ** 2; f = np.fft.rfftfreq(1 << 15, 1 / SR)
    return (ip + (below[0] if len(below) else len(db) - ip)) * 64 / SR, float((f * P).sum() / P.sum())

out = {'bands_hz': [round(float(v), 1) for v in BANDS], 'spectra': {}}
for k, (times, d) in T.items():
    curves, durs, cens = [], [], []
    for t in times:
        seg = y[int((t - 0.01) * SR): int((t + d + 0.05) * SR)]
        e = np.abs(seg); i = max(0, int(np.argmax(e > e.max() * 0.1)) - int(0.002 * SR))
        x = seg[i: i + int(d * SR)]
        curves.append(band_db(x)); du, ce = dur_cen(x); durs.append(du); cens.append(ce)
    c = 10 * np.log10(np.mean([10 ** (v / 10) for v in curves], 0))
    out['spectra'][k] = [round(float(v - c.max()), 1) for v in c]
    out.setdefault('scalars', {})[k] = {'dur': round(float(np.median(durs)), 3), 'centroid': int(np.median(cens))}
json.dump(out, open(os.path.join(HERE, '..', 'audio', 'ref_spectra.json'), 'w'), indent=0)
print('写入 audio/ref_spectra.json：', ', '.join(out['spectra']))
