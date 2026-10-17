# 参考视频的声音拆解：响度、起音密度（音效有多密）、频谱亮度、静音段
# 用法：python sfx_profile.py a.wav [b.wav ...] > profile.json
import json, sys
import numpy as np
import librosa

def profile(path):
    y, sr = librosa.load(path, sr=22050, mono=True)
    hop = 512
    rms = librosa.feature.rms(y=y, hop_length=hop)[0]
    db = librosa.amplitude_to_db(rms, ref=1.0)
    onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop)
    onsets = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr, hop_length=hop, units='time', backtrack=False)
    cent = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=hop)[0]
    flat = librosa.feature.spectral_flatness(y=y, hop_length=hop)[0]
    t = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=hop)
    dur = len(y) / sr
    # 每 10 秒一格：起音数、平均响度、亮度
    bins = []
    for a in np.arange(0, dur, 10.0):
        m = (t >= a) & (t < a + 10)
        n = int(((onsets >= a) & (onsets < a + 10)).sum())
        bins.append({'t': round(float(a)), 'onsets': n, 'db': round(float(db[m].mean()), 1),
                     'centroid': int(cent[m].mean()), 'flat': round(float(flat[m].mean()), 3)})
    silent = db < -50
    # 静音段（≥0.4 秒）
    gaps, s = [], None
    for i, v in enumerate(silent):
        if v and s is None: s = i
        if (not v or i == len(silent) - 1) and s is not None:
            if t[i] - t[s] >= 0.4: gaps.append([round(float(t[s]), 2), round(float(t[i]), 2)])
            s = None
    # 有没有持续的音乐：看谐波能量占比（HPSS）
    H, P = librosa.effects.hpss(y)
    hr = float(np.sum(H ** 2) / (np.sum(H ** 2) + np.sum(P ** 2) + 1e-9))
    tempo = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)[0]
    return {'file': path, 'dur': round(dur, 1), 'onsets_per_min': round(len(onsets) / dur * 60, 1),
            'mean_db': round(float(db.mean()), 1), 'harmonic_ratio': round(hr, 3),
            'tempo_guess': round(float(np.atleast_1d(tempo)[0]), 1), 'silent_gaps': len(gaps),
            'silent_total_s': round(sum(b - a for a, b in gaps), 1), 'bins': bins,
            'onsets': [round(float(o), 2) for o in onsets]}

print(json.dumps([profile(p) for p in sys.argv[1:]], ensure_ascii=False))
