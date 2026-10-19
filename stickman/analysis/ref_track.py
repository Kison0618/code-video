"""逐帧跟踪：一段原片按原生帧率逐帧裁出人，出三样东西
  名字_strip.png  逐帧条：统一裁切框（位移看得出来），每格标 帧号 / 秒 / 与上一帧的差异 d（红框 = d<0.02，即这一帧没有新画）
  名字_onion.png  洋葱皮：所有帧叠在一张图上，颜色从蓝到红表示先后，白点是每帧的重心——看弧线和间距
  名字.csv        每帧 i,t,area,x0,y0,x1,y1,cx,cy,diff（像素）

d（相邻两帧人形的差异 = 异或像素 / 并集像素）是判断节奏最有用的数：
  动作段一拍一时每帧 0.5–0.95；一拍二时 0 和非 0 交替；定格时连续 0.00；衰减落定时逐帧减小。

用法：python3 ref_track.py 视频 起点秒 终点秒 输出名 [--color orange|yellow] [--cols 10] [--cell 200]
        [--box x0,y0,x1,y1（0–1 的比例）] [--follow 宽（每帧以人为中心裁这么宽，镜头在动或人跑远时用）] [--step 1]
"""
import argparse, numpy as np
from PIL import Image, ImageDraw
from ref_common import read_frames, mask, font

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('t0', type=float); ap.add_argument('t1', type=float); ap.add_argument('name')
ap.add_argument('--color', default='orange'); ap.add_argument('--cols', type=int, default=10); ap.add_argument('--cell', type=int, default=200)
ap.add_argument('--box', default=''); ap.add_argument('--step', type=int, default=1); ap.add_argument('--pad', type=float, default=0.15)
ap.add_argument('--follow', type=int, default=0)
a = ap.parse_args()

fr, fps = read_frames(a.src, a.t0, a.t1)
H, W = fr.shape[1:3]
ms = [mask(f, a.color) for f in fr]
rows, prev = [], None
for i, m in enumerate(ms):
    ys, xs = np.nonzero(m)
    if len(xs) < 30: rows.append(None); prev = m; continue
    diff = 0.0 if prev is None else float((m ^ prev).sum()) / max(1, (m | prev).sum())
    rows.append(dict(i=i, t=a.t0 + i / fps, area=len(xs), x0=xs.min(), y0=ys.min(), x1=xs.max(), y1=ys.max(), cx=xs.mean(), cy=ys.mean(), diff=diff))
    prev = m
ok = [r for r in rows if r]
if not ok: raise SystemExit('这段里没找到这个颜色的角色（试试 --color yellow）')
if a.box:
    bx = [float(v) for v in a.box.split(',')]; X0, Y0, X1, Y1 = int(bx[0] * W), int(bx[1] * H), int(bx[2] * W), int(bx[3] * H)
else:
    X0 = min(r['x0'] for r in ok); Y0 = min(r['y0'] for r in ok); X1 = max(r['x1'] for r in ok); Y1 = max(r['y1'] for r in ok)
    pw = (X1 - X0) * a.pad + 20; ph = (Y1 - Y0) * a.pad + 20
    X0 = max(0, int(X0 - pw)); X1 = min(W, int(X1 + pw)); Y0 = max(0, int(Y0 - ph)); Y1 = min(H, int(Y1 + ph))
bw, bh = X1 - X0, Y1 - Y0
cw = a.cell; ch = int(cw * bh / bw)
if ch > cw * 1.6: ch = int(cw * 1.6); cw = int(ch * bw / bh)
idx = list(range(0, len(fr), a.step)); cols = a.cols; nr = (len(idx) + cols - 1) // cols
f12 = font(12)
im = Image.new('RGB', (cols * cw, nr * ch), (30, 30, 30)); dr = ImageDraw.Draw(im)
for k, i in enumerate(idx):
    x, y = (k % cols) * cw, (k // cols) * ch
    r = rows[i]
    if a.follow and r:
        fw = a.follow; fh = int(fw * ch / cw); ccx = int((r['x0'] + r['x1']) / 2); ccy = int((r['y0'] + r['y1']) / 2)
        fx0 = min(max(0, ccx - fw // 2), W - fw); fy0 = min(max(0, ccy - fh // 2), H - fh)
        im.paste(Image.fromarray(fr[i][fy0:fy0 + fh, fx0:fx0 + fw]).resize((cw, ch)), (x, y))
    else:
        im.paste(Image.fromarray(fr[i][Y0:Y1, X0:X1]).resize((cw, ch)), (x, y))
    held = r is not None and r['diff'] < 0.02
    dr.rectangle([x, y, x + cw - 1, y + ch - 1], outline=(255, 0, 0) if held else (80, 80, 80))
    dr.text((x + 3, y + 2), f"#{i} {a.t0 + i / fps:.2f}s", fill=(0, 255, 0), font=f12)
    dr.text((x + 3, y + 15), f"d{r['diff']:.2f}" if r else 'd--', fill=(255, 80, 80) if held else (255, 255, 0), font=f12)
im.save(a.name + '_strip.png')

on = np.zeros((bh, bw, 3), np.float32); N = len(ms)
for i, m in enumerate(ms):
    on[m[Y0:Y1, X0:X1]] = np.array([255 * i / max(1, N - 1), 80, 255 * (1 - i / max(1, N - 1))], np.float32)
oi = Image.fromarray(on.astype(np.uint8)); od = ImageDraw.Draw(oi); f2 = font(max(12, bw // 60))
for r in ok:
    od.ellipse([r['cx'] - X0 - 3, r['cy'] - Y0 - 3, r['cx'] - X0 + 3, r['cy'] - Y0 + 3], fill=(255, 255, 255))
    if r['i'] % 2 == 0: od.text((r['cx'] - X0 + 5, r['cy'] - Y0 - 8), str(r['i']), fill=(255, 255, 255), font=f2)
sc = min(1.0, 1400 / bw); oi.resize((int(bw * sc), int(bh * sc))).save(a.name + '_onion.png')

with open(a.name + '.csv', 'w') as f:
    f.write('i,t,area,x0,y0,x1,y1,cx,cy,diff\n')
    for r in ok: f.write(f"{r['i']},{r['t']:.3f},{r['area']},{r['x0']},{r['y0']},{r['x1']},{r['y1']},{r['cx']:.1f},{r['cy']:.1f},{r['diff']:.3f}\n")
print('fps', round(fps, 3), 'frames', len(fr), 'box', (X0, Y0, X1, Y1), 'held', sum(1 for r in ok if r['diff'] < 0.02))
print('d', ' '.join(f"{r['diff']:.2f}" for r in ok))
