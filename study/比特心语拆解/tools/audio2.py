"""Audio: onsets + loudness + energy above 16.5 kHz (BGM is band-limited ~16k, so that band isolates added SFX).
usage: audio2.py in.mp4 out.json"""
import sys, json, subprocess, numpy as np
from scipy import signal
from scipy.ndimage import median_filter

src, out = sys.argv[1], sys.argv[2]
SR = 44100
a = np.frombuffer(subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", src, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                                 capture_output=True).stdout, np.float32)
HOP, NF = 512, 4096
f, t, Z = signal.stft(a, SR, nperseg=NF, noverlap=NF - HOP, boundary=None)
mag = np.abs(Z); fa = SR / HOP
lm = np.log1p(mag * 10)
fl = np.concatenate([[0], np.maximum(0, np.diff(lm, axis=1)).sum(0)])
fs = fl - median_filter(fl, size=int(fa))
pk, _ = signal.find_peaks(fs, height=np.percentile(fs, 96), distance=int(fa * 0.1))
ons = []
for q in pk:
    sp = mag[:, q:q + int(fa * 0.12)].mean(1)
    ons.append(dict(t=round(q / fa, 3), s=round(float(fs[q]), 1), cen=int((sp * f).sum() / (sp.sum() + 1e-9)),
                    hf=round(float(sp[f > 16500].sum() / (sp.sum() + 1e-9)), 5)))
step = int(fa / 4)  # 0.25 s bins
def bins(x): return x[: len(x) // step * step].reshape(-1, step).mean(1)
rms = bins((mag ** 2).sum(0))
hi = bins(mag[f > 16500].sum(0))
json.dump(dict(onsets=ons, rms_db=[round(float(10 * np.log10(x + 1e-9)), 1) for x in rms],
               hi16k=[round(float(x), 4) for x in hi]), open(out, "w"))
print(out, len(ons))
