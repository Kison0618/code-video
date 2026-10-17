"""Isolate the SFX layer: video audio minus the aligned BGM (magnitude spectral subtraction, per-window best offset).
usage: sfx_isolate.py video.mp4 bgm.m4a out_prefix
writes <out>.wav (residual, resynthesized with video phase), <out>.json (events)"""
import sys, json, subprocess, numpy as np, wave
from scipy import signal

vid, bgm, out = sys.argv[1:4]
SR = 32000
def load(p): return np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", p, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                                 capture_output=True).stdout, np.float32).copy()
v, b = load(vid), load(bgm)
NF, HOP = 2048, 256
fa = SR / HOP
_, _, V = signal.stft(v, SR, nperseg=NF, noverlap=NF - HOP)
f, _, B = signal.stft(b, SR, nperseg=NF, noverlap=NF - HOP)
Vm, Bm = np.abs(V), np.abs(B)
lv, lb = np.log1p(Vm[:400] * 50), np.log1p(Bm[:400] * 50)  # < ~6 kHz for matching
W = int(fa * 2)  # 2 s windows
R = np.zeros_like(Vm)
offs = []
prev_off = 0
for s in range(0, Vm.shape[1], W):
    a = lv[:, s:s + W]
    if a.shape[1] < 8: break
    # candidate offsets: identity-ish near previous, then global search
    best = (-1e9, 0)
    cands = list(range(max(0, prev_off - 40), min(lb.shape[1] - a.shape[1], prev_off + 40))) + list(range(0, lb.shape[1] - a.shape[1], 16))
    an = (a - a.mean()) / (a.std() + 1e-9)
    for o in cands:
        bb = lb[:, s - s + o:o + a.shape[1]]
        if bb.shape[1] != a.shape[1]: continue
        sc = (an * (bb - bb.mean()) / (bb.std() + 1e-9)).mean()
        if sc > best[0]: best = (sc, o)
    sc, o = best
    if o % 16 == 0:  # refine around global hit
        for oo in range(max(0, o - 20), min(lb.shape[1] - a.shape[1], o + 20)):
            bb = lb[:, oo:oo + a.shape[1]]
            s2 = (an * (bb - bb.mean()) / (bb.std() + 1e-9)).mean()
            if s2 > sc: sc, o = s2, oo
    prev_off = o + a.shape[1]
    bm = Bm[:, o:o + a.shape[1]]; vm = Vm[:, s:s + a.shape[1]]
    if sc > 0.5:
        g = np.median((vm[:400] + 1e-6) / (bm[:400] + 1e-6), axis=0).clip(0, 3)  # per-frame gain (ducking)
        g = np.median(g)
        R[:, s:s + a.shape[1]] = np.maximum(0, vm - 1.6 * g * bm)
    else:
        R[:, s:s + a.shape[1]] = vm  # no BGM match (silence / pure sfx section)
    offs.append(dict(t=round(s / fa, 2), bgm_t=round(o / fa, 2), sim=round(float(sc), 2)))
_, r = signal.istft(R * np.exp(1j * np.angle(V)), SR, nperseg=NF, noverlap=NF - HOP)
r = (r / (np.abs(r).max() + 1e-9) * 0.9 * 32767).astype(np.int16)
w = wave.open(out + ".wav", "wb"); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(r.tobytes()); w.close()
# events on residual
e = R.sum(0); es = signal.savgol_filter(e, 9, 2)
thr = np.percentile(es, 75) * 2.5
pk, pr = signal.find_peaks(es, height=thr, distance=int(fa * 0.15), prominence=thr * 0.5)
ev = []
for q in pk:
    sp = R[:, q:q + int(fa * 0.1)].mean(1)
    seg = es[q:q + int(fa * 4)]
    dur = int(np.argmax(seg < es[q] * 0.15)) if (seg < es[q] * 0.15).any() else len(seg)
    # onset slope: how fast it rose (frames from 15% to peak)
    pre = es[max(0, q - int(fa * 3)):q + 1][::-1]
    rise = int(np.argmax(pre < es[q] * 0.15)) if (pre < es[q] * 0.15).any() else len(pre)
    lo = float(sp[f < 200].sum() / (sp.sum() + 1e-9)); hi = float(sp[f > 5000].sum() / (sp.sum() + 1e-9))
    ev.append(dict(t=round(q / fa, 2), amp=round(float(es[q]), 1), rise=round(rise / fa, 2), dur=round(dur / fa, 2),
                   cen=int((sp * f).sum() / (sp.sum() + 1e-9)), lo=round(lo, 2), hi=round(hi, 2)))
json.dump(dict(offsets=offs, events=ev), open(out + ".json", "w"))
print(out, "events", len(ev), "matched windows", sum(o["sim"] > 0.5 for o in offs), "/", len(offs))
