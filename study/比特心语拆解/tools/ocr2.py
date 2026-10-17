"""Fast text timeline: 2 fps, half-res full-frame OCR only when the frame changes.
usage: ocr2.py in.mp4 out.json  ->  [{t, items:[{text,x,y,h}]}]  (x/y/h in 1080p pixels)"""
import sys, json, subprocess, numpy as np
from rapidocr_onnxruntime import RapidOCR

src, out = sys.argv[1], sys.argv[2]
W, H, FPS = 960, 540, 2
ocr = RapidOCR()
p = subprocess.Popen(["ffmpeg", "-nostdin", "-v", "error", "-i", src, "-vf", f"fps={FPS},scale={W}:{H}",
                      "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], stdout=subprocess.PIPE)
res, prev, last, i = [], None, [], 0
while True:
    b = p.stdout.read(W * H * 3)
    if len(b) < W * H * 3: break
    f = np.frombuffer(b, np.uint8).reshape(H, W, 3)
    g = f.mean(2)[::4, ::4]
    if prev is None or np.abs(g - prev).mean() > 0.8:
        r, _ = ocr(f)
        last = []
        for box, txt, c in (r or []):
            if float(c) < 0.6: continue
            ys = [q[1] for q in box]; xs = [q[0] for q in box]
            if max(ys) < 60 and min(xs) < 190: continue  # channel watermark
            last.append(dict(text=txt, x=round(np.mean(xs) * 2), y=round(np.mean(ys) * 2), h=round((max(ys) - min(ys)) * 2)))
        prev = g
    res.append(dict(t=i / FPS, items=last))
    i += 1
json.dump(res, open(out, "w"), ensure_ascii=False)
print(out, len(res))
