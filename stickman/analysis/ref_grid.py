"""单帧加像素坐标网格，用来手量关节位置（胯、肩、手、脚）。量完换算成"相对胯、以身高 H 为单位"写进招式库（analysis/fight_moves.json）。

用法：python3 ref_grid.py 视频 秒 x0 y0 x1 y1 输出.png [网格间距px=50] [放大倍数=1.5]
"""
import sys
from PIL import Image, ImageDraw
from ref_common import read_frame, font

src, t = sys.argv[1], float(sys.argv[2]); x0, y0, x1, y1 = map(int, sys.argv[3:7]); out = sys.argv[7]
g = int(sys.argv[8]) if len(sys.argv) > 8 else 50; s = float(sys.argv[9]) if len(sys.argv) > 9 else 1.5
f = read_frame(src, t)[y0:y1, x0:x1]
im = Image.fromarray(f).resize((int((x1 - x0) * s), int((y1 - y0) * s))); d = ImageDraw.Draw(im); ft = font(11)
for x in range((x0 // g + 1) * g, x1, g):
    X = (x - x0) * s; d.line([X, 0, X, im.height], fill=(60, 60, 140) if x % (g * 2) else (90, 90, 200)); d.text((X + 2, 2), str(x), fill=(150, 150, 255), font=ft)
for y in range((y0 // g + 1) * g, y1, g):
    Y = (y - y0) * s; d.line([0, Y, im.width, Y], fill=(60, 60, 140) if y % (g * 2) else (90, 90, 200)); d.text((2, Y + 2), str(y), fill=(150, 150, 255), font=ft)
d.text((im.width - 90, im.height - 14), f"t={t:.3f}", fill=(0, 255, 0), font=ft)
im.save(out); print(out, im.size)
