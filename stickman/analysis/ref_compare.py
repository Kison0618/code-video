"""原片 vs 我们：同一个动作逐帧并排（上一行原片，下一行我们），按身高 H 缩放到一样大、以第 0 帧对齐（地面和重心），
看姿势、位移、节奏差在哪里。每格标 d（和上一帧的差异）和重心位移（H）；终端再打印一张数字对照表。

用法：python3 ref_compare.py 视频 原片第0帧秒 帧数 原片身高H像素 序列目录 输出.png [--color orange] [--cell 200] [--labels 'f0 架势|f1 …']
  序列目录可以写多个，逗号分开，每个可以带名字：'实测版=out/seq_a,估计版=out/seq_b'（每个一行，方便看改之前 / 之后）
  原片第0帧秒：ffmpeg 取到的是时间 ≥ 这个值的第一帧（可以先用 ref_track.py 找）；身高用 ref_headsize.py 量
  我们的序列：render/src/tools/move_seq.js 渲出来的目录（里面有 meta.json）
  视频写 - ：没有原片，只把我们的几个版本并排（自己设计的动作，改之前 / 之后对比）
"""
import argparse, glob, json, os, numpy as np
from PIL import Image, ImageDraw
from ref_common import read_frames, mask, font

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('t0', type=float); ap.add_argument('n', type=int); ap.add_argument('Href', type=float)
ap.add_argument('seq'); ap.add_argument('out'); ap.add_argument('--color', default='orange'); ap.add_argument('--cell', type=int, default=200)
ap.add_argument('--labels', default='')
a = ap.parse_args()

NOREF = a.src == '-'
if NOREF: ref, fps = [], 0.0
else:
    fr, fps = read_frames(a.src, a.t0, a.t0 + (a.n + 1) / 23.0)
    ref = [fr[i] for i in range(min(a.n, len(fr)))]
seqs = []
for k, item in enumerate(a.seq.split(',')):
    name, d = item.split('=', 1) if '=' in item else ('我们' if k == 0 else f'我们{k + 1}', item)
    meta = json.load(open(os.path.join(d, 'meta.json')))
    seqs.append((name, meta, [np.array(Image.open(p).convert('RGB')) for p in sorted(glob.glob(os.path.join(d, '[0-9]*.png')))[:a.n]]))
N = min(([] if NOREF else [len(ref)]) + [len(s[2]) for s in seqs])

def track(frames, color, Hpx):
    ms = [mask(f, color) for f in frames]
    ys, xs = np.nonzero(ms[0]); ax, ay = xs.mean(), ys.max()           # 第 0 帧：重心 x、最低点（脚底 = 地面）
    rows, prev = [], None
    for m in ms:
        ys, xs = np.nonzero(m)
        d = 0.0 if prev is None else float((m ^ prev).sum()) / max(1, (m | prev).sum()); prev = m
        rows.append(dict(d=d, dx=(xs.mean() - ax) / Hpx, dy=0, cx=xs.mean(), cy=ys.mean(), box=(xs.min(), ys.min(), xs.max(), ys.max())))
    cy0 = rows[0]['cy']
    for r in rows: r['dy'] = (r['cy'] - cy0) / Hpx
    return ms, rows, (ax, ay)

lines = []
if not NOREF:
    mR, rR, aR = track(ref, a.color, a.Href); lines.append(('原片', ref, rR, aR, a.Href))
for name, meta, fr_ in seqs:
    _, r_, a_ = track(fr_, 'yellow', meta['H']); lines.append((name, fr_, r_, a_, meta['H']))
# 共同的裁切范围（单位 H，相对锚点）：两边所有帧的外框取并集
def ext(rows, anc, Hpx):
    return [min((r['box'][0] - anc[0]) / Hpx for r in rows), min((r['box'][1] - anc[1]) / Hpx for r in rows),
            max((r['box'][2] - anc[0]) / Hpx for r in rows), max((r['box'][3] - anc[1]) / Hpx for r in rows)]
es = [ext(l[2][:N], l[3], l[4]) for l in lines]
L, T = min(e[0] for e in es) - 0.1, min(e[1] for e in es) - 0.1
R, B = max(e[2] for e in es) + 0.1, max(e[3] for e in es) + 0.12
cw = a.cell; ch = int(cw * (B - T) / (R - L)); cap = 34; head = 26
labels = a.labels.split('|') if a.labels else [f'f{i}' for i in range(N)]
im = Image.new('RGB', (N * cw + 70, head + len(lines) * (ch + cap)), (24, 24, 24)); dr = ImageDraw.Draw(im)
fC, fM = font(15, True), font(12, True)
for row, l in enumerate(lines): dr.text((4, head + row * (ch + cap) + ch // 2 - 8), l[0], fill=(255, 200, 120) if l[0] == '原片' else (255, 230, 0), font=fC)
def crop(f, anc, Hpx):
    x0, y0 = int(anc[0] + L * Hpx), int(anc[1] + T * Hpx); x1, y1 = int(anc[0] + R * Hpx), int(anc[1] + B * Hpx)
    Hh, Ww = f.shape[:2]; pad = np.zeros((y1 - y0, x1 - x0, 3), np.uint8)
    sx0, sy0, sx1, sy1 = max(0, x0), max(0, y0), min(Ww, x1), min(Hh, y1)
    if sx1 > sx0 and sy1 > sy0: pad[sy0 - y0:sy1 - y0, sx0 - x0:sx1 - x0] = f[sy0:sy1, sx0:sx1]
    return Image.fromarray(pad).resize((cw, ch))
for i in range(N):
    X = 70 + i * cw
    dr.text((X + 4, 4), labels[i] if i < len(labels) else f'f{i}', fill=(255, 255, 255), font=fC)
    for row, (_, frames, rows, anc, Hpx) in enumerate(lines):
        Y = head + row * (ch + cap)
        im.paste(crop(frames[i], anc, Hpx), (X, Y))
        gy = Y + int((0 - T) / (B - T) * ch); dr.line([X, gy, X + cw, gy], fill=(70, 70, 70))     # 第 0 帧的地面
        gx = X + int((0 - L) / (R - L) * cw); dr.line([gx, Y, gx, Y + ch], fill=(50, 50, 90))      # 第 0 帧的重心
        r = rows[i]; held = i > 0 and r['d'] < 0.02
        dr.rectangle([X, Y, X + cw - 1, Y + ch - 1], outline=(255, 0, 0) if held else (70, 70, 70))
        dr.text((X + 4, Y + ch + 2), f"d{r['d']:.2f} 重心{r['dx']:+.2f},{-r['dy']:+.2f}H", fill=(220, 220, 220), font=fM)
im.save(a.out)
print(f'{a.out} {im.size}' + ('' if NOREF else f'  原片 fps {fps:.3f}，H={a.Href:.0f}px'))
print('帧 | ' + ' | '.join(f'{l[0]} d 重心[前,上]H' for l in lines))
for i in range(N):
    print(f'{labels[i] if i < len(labels) else i} | ' + ' | '.join(f'{l[2][i]["d"]:.2f} [{l[2][i]["dx"]:+.2f},{-l[2][i]["dy"]:+.2f}]' for l in lines))
