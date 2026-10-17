"""从原片里逐帧提取火柴人的骨架关键点（不用任何模型，纯图像处理）

做法：按角色颜色抠出火柴人 → 距离变换找头（最粗的地方就是头，半径 = 0.115H）→ 去掉头
→ 细化成一像素宽的骨架 → 从脖子出发沿骨架走：离脖子远的两个端点是脚、近的是手，
两只脚的路径分开的地方是胯。输出每帧 头/脖子/胯/双手/双脚 的坐标（像素，以及以身高 H 归一的相对胯坐标）。

用法：python3 ref_pose.py 帧目录 输出.json [--color yellow] [--overlay 叠图目录]
只读本地帧图片，不保存原片内容，输出只有数字。
"""
import sys, json, os, argparse
import numpy as np
from scipy import ndimage as ndi
from PIL import Image, ImageDraw

COL = {'yellow': lambda r, g, b: (r > 190) & (g > 140) & (g < 235) & (b < 100),
       'orange': lambda r, g, b: (r > 200) & (g > 70) & (g < 150) & (b < 60)}

def thin(img):
    """Zhang-Suen 细化"""
    img = img.copy().astype(np.uint8)
    changed = True
    while changed:
        changed = False
        for step in (0, 1):
            P = np.pad(img, 1)
            p2, p3, p4, p5 = P[:-2, 1:-1], P[:-2, 2:], P[1:-1, 2:], P[2:, 2:]
            p6, p7, p8, p9 = P[2:, 1:-1], P[2:, :-2], P[1:-1, :-2], P[:-2, :-2]
            nb = [p2, p3, p4, p5, p6, p7, p8, p9]
            B = sum(n.astype(int) for n in nb)
            seq = nb + [p2]
            A = sum(((seq[i] == 0) & (seq[i + 1] == 1)).astype(int) for i in range(8))
            if step == 0: c = (p2 * p4 * p6 == 0) & (p4 * p6 * p8 == 0)
            else: c = (p2 * p4 * p8 == 0) & (p2 * p6 * p8 == 0)
            m = (img == 1) & (B >= 2) & (B <= 6) & (A == 1) & c
            if m.any(): img[m] = 0; changed = True
    return img

def geodesic(sk, start):
    """骨架上的 BFS：返回每个骨架像素到 start 的步数和前驱"""
    h, w = sk.shape
    dist = np.full(sk.shape, -1, int); prev = {}
    from collections import deque
    q = deque([start]); dist[start] = 0
    while q:
        y, x = q.popleft()
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                ny, nx = y + dy, x + dx
                if (dy or dx) and 0 <= ny < h and 0 <= nx < w and sk[ny, nx] and dist[ny, nx] < 0:
                    dist[ny, nx] = dist[y, x] + (1.414 if dy and dx else 1); prev[(ny, nx)] = (y, x); q.append((ny, nx))
    return dist, prev

def path(prev, end):
    p = [end]
    while p[-1] in prev: p.append(prev[p[-1]])
    return p[::-1]

def analyze(fn, color):
    im = np.asarray(Image.open(fn).convert('RGB')).astype(int)
    m = COL[color](im[..., 0], im[..., 1], im[..., 2])
    lab, n = ndi.label(m)
    if n == 0: return None
    sizes = ndi.sum(m, lab, range(1, n + 1)); k = int(np.argmax(sizes)) + 1
    fig = lab == k
    if sizes[k - 1] < 150: return None
    dt = ndi.distance_transform_edt(fig)
    hy, hx = np.unravel_index(np.argmax(dt), dt.shape); r = float(dt[hy, hx])
    H = r / 0.115
    yy, xx = np.mgrid[:fig.shape[0], :fig.shape[1]]
    body = fig & ((yy - hy) ** 2 + (xx - hx) ** 2 > (r * 1.06) ** 2)
    sk = thin(body)
    pts = np.argwhere(sk)
    if len(pts) < 10: return None
    d2 = (pts[:, 0] - hy) ** 2 + (pts[:, 1] - hx) ** 2
    neck = tuple(pts[np.argmin(d2)])
    dist, prev = geodesic(sk, neck)
    # 端点：8 邻域里只有 1 个骨架像素
    P = np.pad(sk, 1); nbc = sum(np.roll(np.roll(P, dy, 0), dx, 1) for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)[1:-1, 1:-1]
    ends = [tuple(p) for p in np.argwhere((sk == 1) & (nbc == 1)) if dist[tuple(p)] > 0.12 * H]
    if len(ends) < 2: return None
    ends.sort(key=lambda p: -dist[p])
    feet = ends[:2]; hands = ends[2:4]
    if len(feet) < 2: return None
    pa, pb = path(prev, feet[0]), path(prev, feet[1])
    i = 0
    while i < min(len(pa), len(pb)) and pa[i] == pb[i]: i += 1
    hip = pa[max(0, i - 1)]
    out = {'H': H, 'head': [float(hx), float(hy)], 'neck': [int(neck[1]), int(neck[0])], 'hip': [int(hip[1]), int(hip[0])],
           'feet': [[int(f[1]), int(f[0])] for f in feet], 'hands': [[int(h[1]), int(h[0])] for h in hands],
           'leg_geo': [float(dist[f] - dist[hip]) / H for f in feet]}
    return out, fig, sk

if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('dir'); ap.add_argument('out'); ap.add_argument('--color', default='yellow'); ap.add_argument('--overlay')
    a = ap.parse_args()
    res = []
    for f in sorted(os.listdir(a.dir)):
        if not f.endswith('.png'): continue
        r = analyze(os.path.join(a.dir, f), a.color)
        res.append({'frame': f, **(r[0] if r else {})})
        if a.overlay and r:
            os.makedirs(a.overlay, exist_ok=True)
            o, fig, sk = r
            img = Image.fromarray((np.stack([fig * 90, fig * 70, fig * 0], -1) + np.stack([sk * 255] * 3, -1)).clip(0, 255).astype(np.uint8))
            d = ImageDraw.Draw(img)
            for name, c in (('head', 'red'), ('neck', 'cyan'), ('hip', 'magenta')):
                x, y = o[name]; d.ellipse([x - 4, y - 4, x + 4, y + 4], outline=c, width=2)
            for x, y in o['feet']: d.rectangle([x - 4, y - 4, x + 4, y + 4], outline='lime', width=2)
            for x, y in o['hands']: d.rectangle([x - 3, y - 3, x + 3, y + 3], outline='blue', width=2)
            img.save(os.path.join(a.overlay, f))
    json.dump(res, open(a.out, 'w'), indent=0)
    print(len(res), 'frames,', sum(1 for r in res if 'H' in r), 'with pose')
