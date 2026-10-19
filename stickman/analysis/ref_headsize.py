"""量头的大小，换算站立身高 H（之后所有长度都除以 H）。只对空心圆环头（橙色角色）准；黄色实心头请在 ref_grid.py 的网格图上手量。

做法：把人形的孔洞填上，减掉原图 = 圆环里面的洞；最大的洞就是头。线宽 = 距离变换最大值 × 2。
用法：python3 ref_headsize.py 视频 秒 [orange|yellow]
"""
import sys, numpy as np
from scipy import ndimage
from ref_common import read_frame, mask, HEAD_RATIO

src, t = sys.argv[1], float(sys.argv[2]); color = sys.argv[3] if len(sys.argv) > 3 else 'orange'
m = mask(read_frame(src, t), color)
holes = ndimage.binary_fill_holes(m) & ~m
lab, n = ndimage.label(holes)
if not n: raise SystemExit('没找到圆环头（实心头请手量）')
k = np.argmax(ndimage.sum(holes, lab, range(1, n + 1))) + 1
ys, xs = np.nonzero(lab == k)
lw = ndimage.distance_transform_edt(m).max() * 2
inner = (xs.max() - xs.min() + ys.max() - ys.min()) / 2; outer = inner + lw
print(f'头内径 {inner:.0f}px 外径 {outer:.0f}px 线宽 {lw:.0f}px 头中心 ({xs.mean():.0f},{ys.mean():.0f}) '
      f'→ H≈{outer / HEAD_RATIO[color]:.0f}px（按头 = {HEAD_RATIO[color]}H；最好再找一帧站直的人量 头顶到脚底 核对）')
