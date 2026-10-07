# 分析 teeth，输出 analysis/teeth.json（渲染器只读这个文件）
# 内容：精确节拍网格（周期与相位）、60 帧/秒的频段包络、高频与中频起音点
# 用法：python analysis/analyze.py assets/Never.m4a analysis/never.json
import sys, json, subprocess
import numpy as np
import librosa

src, out = sys.argv[1], sys.argv[2]
SR = 22050
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', src, '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
y = np.frombuffer(pcm, np.float32).copy()
dur = len(y) / SR

# —— 节拍网格：让低频起音最集中地落在拍点上的周期与相位 ——
HOP_G = 128
Sg = np.abs(librosa.stft(y, n_fft=1024, hop_length=HOP_G))
fg = librosa.fft_frequencies(sr=SR, n_fft=1024)
low = librosa.onset.onset_strength(S=librosa.amplitude_to_db(Sg[(fg >= 30) & (fg < 150)], ref=np.max), sr=SR, hop_length=HOP_G)
low /= low.max() + 1e-9
frg = SR / HOP_G
def score(P, ph):
    ks = np.arange(0, (dur - ph) / P)
    idx = np.round((ph + ks * P) * frg).astype(int)
    idx = idx[(idx >= 1) & (idx < len(low) - 1)]
    return (low[idx] + 0.5 * low[idx - 1] + 0.5 * low[idx + 1]).mean()
best = max((score(P, ph), P, ph) for P in np.arange(0.35, 0.75, 0.0002) for ph in np.arange(0, P, 0.004))
_, P, ph = best
for _ in range(2):
    _, P, ph = max((score(p, q), p, q) for p in np.arange(P - 0.0002, P + 0.0002, 0.000005)
                   for q in np.arange(ph - 0.006, ph + 0.006, 0.0005))
print(f'BPM {60 / P:.4f}  beat {P:.6f}s  first beat {ph:.4f}s')

# —— 频段包络（0..255，60 帧/秒）——
HOP = 256
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=HOP))
f = librosa.fft_frequencies(sr=SR, n_fft=2048)
ta = np.arange(S.shape[1]) * HOP / SR
FPS = 60
tv = np.arange(0, dur, 1 / FPS)
def norm(e):
    lo, hi = np.percentile(e, 5), np.percentile(e, 99.5)
    return np.clip((e - lo) / (hi - lo), 0, 1)
def band(lo, hi):
    return norm(librosa.amplitude_to_db(S[(f >= lo) & (f < hi)].mean(0), ref=np.max))
bands = {'sub': band(25, 90), 'low': band(90, 250), 'mid': band(250, 2000), 'high': band(2000, 6000), 'air': band(6000, 11000)}
rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=HOP)[0]
bands['rms'] = norm(librosa.amplitude_to_db(rms, ref=np.max))
env = {k: np.round(np.interp(tv, ta, v) * 255).astype(int).tolist() for k, v in bands.items()}

# —— 32 段对数频谱（给频谱环用，0..255，30 帧/秒）——
mel = librosa.feature.melspectrogram(S=S ** 2, sr=SR, n_mels=32, fmin=30, fmax=11000)
mel = norm(librosa.power_to_db(mel, ref=np.max).T.reshape(-1)).reshape(-1, 32)
ts = np.arange(0, dur, 1 / 30)
spec = np.round(np.array([np.interp(ts, ta, mel[:, i]) for i in range(32)]).T * 255).astype(int).tolist()

# —— 起音点（时间, 强度）：高频（镲、拍手）与中频（旋律）——
def onsets(lo, hi, delta):
    o = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[(f >= lo) & (f < hi)], ref=np.max), sr=SR, hop_length=HOP)
    o = o / (o.max() + 1e-9)
    pk = librosa.onset.onset_detect(onset_envelope=o, sr=SR, hop_length=HOP, delta=delta, wait=4, units='frames')
    return [[round(float(ta[i]), 4), round(float(o[i]), 3)] for i in pk if i < len(ta)]

# —— 每一拍的鼓点强度（0..1）与鼓点相对网格的平均偏移 ——
def onset_band(lo, hi):
    o = librosa.onset.onset_strength(S=librosa.amplitude_to_db(Sg[(fg >= lo) & (fg < hi)], ref=np.max), sr=SR, hop_length=HOP_G)
    return o / (o.max() + 1e-9)
kick_o, clap_o = low, onset_band(1200, 5000)
nbeats = int((dur - ph) / P)
def per_beat(o, frac=0.0):
    out = []
    for k in range(nbeats):
        i = int(round((ph + (k + frac) * P) * frg))
        out.append(round(float(o[max(0, i - 2):i + 3].max()) if i < len(o) - 3 else 0.0, 3))
    return out
offs = np.arange(-0.06, 0.03, 0.002)
best_off = offs[int(np.argmax([np.mean([kick_o[int(round((ph + k * P + d) * frg))] for k in range(nbeats - 2)]) for d in offs]))]
print(f'kick offset vs grid {best_off * 1000:+.0f} ms')

json.dump({
    'kick': per_beat(kick_o), 'clap': per_beat(clap_o), 'kick_half': per_beat(kick_o, 0.5), 'clap_half': per_beat(clap_o, 0.5),
    'hit_offset': round(float(best_off), 4),
    'duration': round(dur, 4), 'fps': FPS, 'bpm': round(60 / P, 4), 'beat': round(float(P), 6), 'phase': round(float(ph), 4),
    'env': env, 'spec30': spec,
    'hi_onsets': onsets(2000, 11000, 0.12), 'mid_onsets': onsets(250, 2000, 0.12),
}, open(out, 'w'), separators=(',', ':'))
print('written', out)
