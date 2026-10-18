"""动作条：把一段视频里的火柴人逐帧裁出来拼成一张图，用来逐帧看动作（参考片和我们的成片用同一个工具，才能公平对比）

用法：python3 ref_strip.py 视频 起点秒 终点秒 输出.png [--fps 原生] [--color yellow] [--cols 12] [--cell 220] [--mode union|follow]
  mode=union  整段用同一个裁切框（人在框里怎么移动看得出来，适合镜头不动的段落）
  mode=follow 每帧以人为中心裁同样大小（看姿势，适合镜头在动或人在大范围移动）
每格左上角写帧号和秒数。只读视频、只输出拼图。
"""
import sys, argparse, subprocess, json
import numpy as np
from PIL import Image, ImageDraw

COL = {'yellow': lambda r, g, b: (r > 190) & (g > 140) & (g < 235) & (b < 100),
       'orange': lambda r, g, b: (r > 200) & (g > 70) & (g < 150) & (b < 60)}

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('t0', type=float); ap.add_argument('t1', type=float); ap.add_argument('out')
ap.add_argument('--fps', type=float, default=0); ap.add_argument('--color', default='yellow')
ap.add_argument('--cols', type=int, default=12); ap.add_argument('--cell', type=int, default=220)
ap.add_argument('--mode', default='union'); ap.add_argument('--pad', type=float, default=0.25)
a = ap.parse_args()

info = json.loads(subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'json', a.src], capture_output=True, text=True).stdout)
n, d = info['streams'][0]['r_frame_rate'].split('/'); nat = float(n) / float(d)
fps = a.fps or nat
W, H = 960, 540
vf = f'fps={fps},scale={W}:{H}'
raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(a.t0), '-t', str(a.t1 - a.t0), '-i', a.src, '-vf', vf, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3)
boxes = []
for f in fr:
    r, g, b = (f[..., i].astype(int) for i in range(3))
    ys, xs = np.nonzero(COL[a.color](r, g, b))
    boxes.append(None if len(ys) < 20 else (np.percentile(xs, 1), np.percentile(ys, 1), np.percentile(xs, 99), np.percentile(ys, 99)))
ok = [b for b in boxes if b]
if not ok: sys.exit('画面里没找到这个颜色的角色')
hs = np.median([b[3] - b[1] for b in ok])
if a.mode == 'union':
    x0, y0 = min(b[0] for b in ok), min(b[1] for b in ok); x1, y1 = max(b[2] for b in ok), max(b[3] for b in ok)
    s = max(x1 - x0, y1 - y0) * (1 + a.pad); cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    crops = [(cx - s / 2, cy - s / 2, s)] * len(fr)
else:
    s = hs * (1.6 + a.pad); crops = []; last = ok[0]
    for b in boxes:
        last = b or last; crops.append(((last[0] + last[2]) / 2 - s / 2, (last[1] + last[3]) / 2 - s / 2, s))
C = a.cell; rows = (len(fr) + a.cols - 1) // a.cols
sheet = Image.new('RGB', (C * a.cols, C * rows), (40, 40, 40)); dr = ImageDraw.Draw(sheet)
for i, (f, (x, y, s)) in enumerate(zip(fr, crops)):
    im = Image.fromarray(f).crop((int(x), int(y), int(x + s), int(y + s))).resize((C - 2, C - 2))
    px, py = (i % a.cols) * C, (i // a.cols) * C
    sheet.paste(im, (px + 1, py + 1))
    dr.text((px + 4, py + 3), f'{i} {a.t0 + i / fps:.2f}', fill=(255, 255, 0))
sheet.save(a.out)
print(f'{a.out}: {len(fr)} 帧 @ {fps:.2f}fps，角色身高中位数 {hs:.0f}px（960 宽画面里）')
