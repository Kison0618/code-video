"""Residual (SFX-only) spectrogram with narration starts (green), big-text reveals (cyan), BGM sections (white/red).
usage: sfxplot.py vN t0 t1 out.png"""
import sys, json, wave, numpy as np
from scipy import signal
from PIL import Image, ImageDraw, ImageFont
import os
S = os.environ.get("WORK", "work/")  # 中间结果目录（an/、sfx/）
v, t0, t1, out = sys.argv[1], float(sys.argv[2]), float(sys.argv[3]), sys.argv[4]
w = wave.open(f"{S}sfx/{v}.wav"); sr = w.getframerate()
a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32)[int(t0 * sr):int(t1 * sr)]
f, t, Z = signal.stft(a, sr, nperseg=2048, noverlap=2048 - 160)
m = 20 * np.log10(np.abs(Z) + 1e-3)
# log-frequency resample 40 Hz..14 kHz to 360 rows
rows = np.geomspace(40, 14000, 360)[::-1]
img = np.stack([m[np.searchsorted(f, r)] for r in rows])
img = np.clip((img - (img.max() - 75)) / 75, 0, 1)
Wd = 2400
img = np.array(Image.fromarray((img * 255).astype(np.uint8)).resize((Wd, 360)))
rgb = np.stack([img, (img ** 1.0 * 0.55).astype(np.uint8), (img * 0.15).astype(np.uint8)], -1)
canvas = Image.new("RGB", (Wd, 360 + 300), (0, 0, 0)); canvas.paste(Image.fromarray(rgb), (0, 0))
d = ImageDraw.Draw(canvas)
font = ImageFont.truetype("/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc", 15)
X = lambda tt: (tt - t0) / (t1 - t0) * Wd
for k in range(int(t0) // 1, int(t1) + 1):
    if k % 5 == 0: d.line([(X(k), 360), (X(k), 372)], fill=(150, 150, 150)); d.text((X(k) + 2, 362), f"{k}s", fill=(150, 150, 150), font=font)
for sec, c in [(10.67, (255, 80, 80)), (17.05, (255, 255, 255)), (76.57, (255, 80, 80)), (87.2, (255, 80, 80)), (93.57, (255, 255, 255))]:
    if t0 <= sec <= t1: d.line([(X(sec), 0), (X(sec), 360)], fill=c, width=2)
L = json.load(open(f"{S}an/L_{v}.json"))
row = 0
for s in L["sub"]:
    if not (t0 <= s["start"] <= t1) or len(s["n"]) < 7 or not (s["y"] > 860 or 80 < s["y"] < 140): continue
    x = X(s["start"]); d.line([(x, 0), (x, 360)], fill=(60, 220, 90), width=1)
    d.text((x + 2, 380 + (row % 8) * 18), s["text"][:16], fill=(60, 220, 90), font=font); row += 1
for s in L["big"]:
    if not (t0 <= s["start"] <= t1) or s["h"] < 90: continue
    x = X(s["start"]); d.line([(x, 0), (x, 360)], fill=(80, 200, 255), width=2)
    d.text((x + 2, 530 + (row % 6) * 18), "[大]" + s["text"][:10], fill=(80, 200, 255), font=font); row += 1
canvas.save(out)
