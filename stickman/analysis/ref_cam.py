"""估镜头：逐帧找场景里不动的白色东西（算式、地面线、方块……）的外框，外框整体平移 = 镜头平移，外框变大 = 镜头推近。
看撞击时的震屏（上下抖 1–2 帧）、跟拍时镜头的缓出缓入。

用法：python3 ref_cam.py 视频 起点秒 终点秒 [只看画面的 y0 y1 比例，默认 0.08 0.95]
输出每帧 i:x最小-x最大/y最小-y最大（像素，-1 表示这一帧没有白色东西）
"""
import sys, numpy as np
from ref_common import read_frames

src, t0, t1 = sys.argv[1], float(sys.argv[2]), float(sys.argv[3])
ya, yb = (float(sys.argv[4]), float(sys.argv[5])) if len(sys.argv) > 5 else (0.08, 0.95)
fr, fps = read_frames(src, t0, t1); H = fr.shape[1]; Y0, Y1 = int(ya * H), int(yb * H)
out = []
for i, f in enumerate(fr):
    ys, xs = np.nonzero(f[Y0:Y1].min(-1) > 200)
    out.append(f"{i}:{xs.min()}-{xs.max()}/{ys.min() + Y0}-{ys.max() + Y0}" if len(xs) else f"{i}:-1")
print(f'fps {fps:.3f}'); print(' '.join(out))
