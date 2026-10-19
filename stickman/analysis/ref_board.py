"""关键帧展板：从原片挑几帧，用同一个裁切框（或跟着人裁）排成一张图，每格写两行说明。学完一个动作就出一张，放进 研究/动作逐帧/。

用法：python3 ref_board.py 视频 裁切 输出.png 标题 '秒|第一行说明\\n第二行' ... [--cols 4] [--cell 360] [--color orange|yellow]
  裁切 = x0,y0,x1,y1（像素，镜头固定时用，位移看得出来）或 宽,高（每格以人为中心裁这么大，镜头在动时用）
  说明里的 \\n 是字面的反斜杠 n（shell 里直接写 '\\n' 或 "\\n"）
"""
import sys, numpy as np
from PIL import Image, ImageDraw
from ref_common import read_frame, mask, font

args = sys.argv[1:]; cols, cell, color = 4, 360, 'orange'
for opt in ('--cols', '--cell', '--color'):
    if opt in args:
        i = args.index(opt); v = args[i + 1]; del args[i:i + 2]
        if opt == '--cols': cols = int(v)
        elif opt == '--cell': cell = int(v)
        else: color = v
src, box, out, title = args[:4]; items = args[4:]
bb = list(map(int, box.split(','))); follow = len(bb) == 2
x0, y0, x1, y1 = (0, 0, bb[0], bb[1]) if follow else bb
f1, f2 = font(17, True), font(22, True)
cw = cell; ch = int(cell * (y1 - y0) / (x1 - x0)); cap = 48
nrow = (len(items) + cols - 1) // cols
im = Image.new('RGB', (cols * cw, nrow * (ch + cap) + 40), (24, 24, 24)); d = ImageDraw.Draw(im)
d.text((10, 6), title, fill=(255, 255, 255), font=f2)
for k, it in enumerate(items):
    t, lab = it.split('|', 1)
    full = read_frame(src, float(t)); FH, FW = full.shape[:2]
    if follow:
        ys, xs = np.nonzero(mask(full, color))
        cx, cy = ((xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2) if len(xs) else (FW // 2, FH // 2)
        fx = min(max(0, cx - bb[0] // 2), FW - bb[0]); fy = min(max(0, cy - bb[1] // 2), FH - bb[1])
        fr = full[fy:fy + bb[1], fx:fx + bb[0]]
    else:
        fr = full[y0:y1, x0:x1]
    X = (k % cols) * cw; Y = 40 + (k // cols) * (ch + cap)
    im.paste(Image.fromarray(fr).resize((cw, ch)), (X, Y))
    d.rectangle([X, Y, X + cw - 1, Y + ch + cap - 1], outline=(70, 70, 70))
    for j, line in enumerate(lab.split('\\n')[:2]):
        d.text((X + 6, Y + ch + 2 + j * 22), line, fill=(255, 230, 120) if j == 0 else (200, 200, 200), font=f1)
im.save(out); print(out, im.size)
