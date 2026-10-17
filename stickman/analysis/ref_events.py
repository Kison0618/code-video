# 参考视频的音效逐个拆解：把每一个声音事件切出来，量它的长度、起音、亮度、噪声度、音高、响度
# 用法：python ref_events.py <音频.wav> <起始秒> <结束秒> <输出.json>
# 输出每个事件的特征，供 sfx 设计对照、也供 pick_samples.py 从素材库里自动挑声音
import json, sys
import numpy as np
import librosa

path, t0, t1, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
y, sr = librosa.load(path, sr=48000, mono=True, offset=t0, duration=t1 - t0)
hop = 128
env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop, lag=1, max_size=3)
on = librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=hop, units='samples', backtrack=True, delta=0.08, wait=4)
rms_hop = 64
rms = librosa.feature.rms(y=y, frame_length=256, hop_length=rms_hop)[0]
db = 20 * np.log10(rms + 1e-9)

def feats(seg):
    n = len(seg)
    S = np.abs(np.fft.rfft(seg * np.hanning(n), n=max(2048, 1 << int(np.ceil(np.log2(n))))))
    f = np.fft.rfftfreq(max(2048, 1 << int(np.ceil(np.log2(n)))), 1 / sr)
    P = S ** 2 + 1e-18
    cen = float((f * P).sum() / P.sum())
    cum = np.cumsum(P) / P.sum()
    roll85 = float(f[np.searchsorted(cum, 0.85)]); roll15 = float(f[np.searchsorted(cum, 0.15)])
    flat = float(np.exp(np.mean(np.log(P))) / np.mean(P))
    bands = {}
    for name, lo, hi in [('sub', 20, 120), ('low', 120, 500), ('mid', 500, 2000), ('hi', 2000, 6000), ('air', 6000, 16000)]:
        m = (f >= lo) & (f < hi); bands[name] = float(P[m].sum() / P.sum())
    peak_f = float(f[np.argmax(P * (f > 60))])
    return cen, roll15, roll85, flat, bands, peak_f

events = []
for k, s in enumerate(on):
    e_next = on[k + 1] if k + 1 < len(on) else len(y)
    i0 = s // rms_hop
    i1 = min(len(db), e_next // rms_hop + 1)
    if i1 - i0 < 3: continue
    w = db[i0:i1]
    pk = int(np.argmax(w)); peak = float(w[pk])
    if peak < -50: continue
    # 衰减到峰值以下 30 dB 的时刻 = 事件长度（不超过下一个事件）
    below = np.where(w[pk:] < peak - 30)[0]
    dur_i = pk + (below[0] if len(below) else len(w) - pk)
    dur = dur_i * rms_hop / sr
    attack = pk * rms_hop / sr
    seg = y[s: s + max(256, dur_i * rms_hop)]
    cen, r15, r85, flat, bands, pf = feats(seg)
    f0 = None
    if flat < 0.05 and len(seg) > 2048:
        try:
            ff, vf, _ = librosa.pyin(seg, fmin=60, fmax=2000, sr=sr, frame_length=2048)
            ff = ff[vf] if vf is not None else []
            if len(ff): f0 = float(np.nanmedian(ff))
        except Exception: pass
    # 衰减速度：峰值后每秒掉多少 dB（线性拟合）
    tail = w[pk: dur_i + 1]
    decay = float(-np.polyfit(np.arange(len(tail)) * rms_hop / sr, tail, 1)[0]) if len(tail) > 3 else None
    events.append({'t': round(t0 + s / sr, 3), 'peak_db': round(peak, 1), 'dur': round(dur, 3), 'attack': round(attack, 4),
                   'decay_db_s': round(decay, 0) if decay else None, 'centroid': int(cen), 'roll15': int(r15), 'roll85': int(r85),
                   'flatness': round(flat, 4), 'peak_hz': int(pf), 'f0': round(f0, 1) if f0 else None,
                   'bands': {k2: round(v, 3) for k2, v in bands.items()}})
json.dump(events, open(out, 'w'), ensure_ascii=False, indent=0)
print(len(events), 'events ->', out)
