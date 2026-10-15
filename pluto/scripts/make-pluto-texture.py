#!/usr/bin/env python3
"""
程序化生成冥王星球面贴图（参考新视野号 2015 年接近时的经典视角），
输出 src/assets/plutoTexture.ts（内嵌 base64 webp），供 <Pluto/> 组件使用。

用法： pip install numpy opencv-python-headless pillow && python3 scripts/make-pluto-texture.py
"""
import base64, io, os
import numpy as np
import cv2
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
rng = np.random.default_rng(1930)

# ---------- 圆盘像素 → 球面坐标（正交投影） ----------
N = 1024
lat0, lon0 = np.radians(35.0), 163.0
ys, xs = np.mgrid[0:N, 0:N].astype(np.float32)
X = (xs + 0.5) / N * 2 - 1
Y = -((ys + 0.5) / N * 2 - 1)
rho = np.sqrt(X * X + Y * Y)
rc = np.clip(rho, 1e-6, 1.0)
c = np.arcsin(rc)
LATr = np.arcsin(np.clip(np.cos(c) * np.sin(lat0) + Y * np.sin(c) * np.cos(lat0) / rc, -1, 1))
LON = (lon0 + np.degrees(np.arctan2(X * np.sin(c), rc * np.cos(c) * np.cos(lat0) - Y * np.sin(c) * np.sin(lat0)))) % 360
LAT = np.degrees(LATr)
# 3D 单位向量（用于无接缝的 3D 噪声）
P = np.stack([np.cos(LATr) * np.cos(np.radians(LON)), np.cos(LATr) * np.sin(np.radians(LON)), np.sin(LATr)], -1).astype(np.float32)

LAT_N = 48
_lattice = [np.random.default_rng(100 + i).random((LAT_N, LAT_N, LAT_N)).astype(np.float32) for i in range(8)]


def vnoise3(freq, seed):
    g = _lattice[seed % 8]
    q = (P * freq + 7.3 * seed) % LAT_N
    i0 = np.floor(q).astype(np.int32)
    f = q - i0
    f = f * f * (3 - 2 * f)
    i1 = (i0 + 1) % LAT_N
    out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                ix = i1[..., 0] if dx else i0[..., 0]
                iy = i1[..., 1] if dy else i0[..., 1]
                iz = i1[..., 2] if dz else i0[..., 2]
                w = (f[..., 0] if dx else 1 - f[..., 0]) * (f[..., 1] if dy else 1 - f[..., 1]) * (f[..., 2] if dz else 1 - f[..., 2])
                out = out + w * g[ix, iy, iz]
    return out


def noise(freq, octaves=5, persist=0.55, seed=0):
    out = 0
    amp, tot = 1.0, 0.0
    for o in range(octaves):
        out = out + amp * vnoise3(freq * 2 ** o, seed * 13 + o)
        tot += amp
        amp *= persist
    out = out / tot
    return (out - out.mean()) / (out.std() + 1e-6)


def smooth(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


warpA = noise(2.2, 4, seed=1) * 3.0
warpB = noise(2.2, 4, seed=2) * 3.0
broad = noise(0.9, 3, seed=3)
mid = noise(3.5, 5, seed=4)
fine = noise(14, 4, seed=5)

WL = LON + warpA * 1.4
WT = LAT + warpB


def dlonw(l0):
    return (WL - l0 + 540) % 360 - 180


# ---------- 基础反照率 ----------
col = np.ones((N, N, 3), np.float32) * np.array([194, 158, 124], np.float32)
col *= (1 + 0.08 * broad + 0.07 * mid + 0.035 * fine)[..., None]
polar = smooth(50, 72, WT)
col = col * (1 - polar[..., None] * 0.5) + np.array([212, 196, 164]) * polar[..., None] * 0.5
midband = smooth(28, 42, WT) * (1 - smooth(50, 62, WT))
col *= (1 - 0.12 * midband * (0.7 + 0.3 * mid))[..., None]
cap = smooth(80, 89, WT)
col = col * (1 - cap[..., None] * 0.25) + np.array([168, 150, 128]) * cap[..., None] * 0.25

# ---------- 克苏鲁区（暗红褐，赤道，鲸鱼形，头部贴近心形西南） ----------
x = dlonw(100)
u = (x + 80) / 145
half_h = 5 + 15 * np.clip(u, 0, 1) ** 0.9
cy = -6 + 5 * np.sin(u * 3.0)
cth = smooth(0, 1, (half_h - np.abs(WT - cy)) / 5) * smooth(0, 0.1, u) * (1 - smooth(0.96, 1.04, u))
cth = np.clip(cth * np.clip(0.88 + 0.22 * mid, 0, 1), 0, 1)
dark = np.array([70, 36, 25], np.float32) * (1 + 0.14 * fine)[..., None]
col = col * (1 - cth[..., None] * 0.92) + dark * cth[..., None] * 0.92

# ---------- 汤博区（心） ----------
# 心形隐函数（局部切平面坐标），边界加噪声；左瓣=斯普特尼克平原（光滑明亮），右瓣=东汤博区（斑驳）
HC_LON, HC_LAT, HS = 183.0, 18.0, 27.0
HL = LON + warpA * 0.35
HT = LAT + warpB * 0.3
hu = ((HL - HC_LON + 540) % 360 - 180) * np.cos(np.radians(HC_LAT)) / HS
hv = (HT - HC_LAT) / HS
ang = np.radians(-14)
ru = hu * np.cos(ang) - hv * np.sin(ang)
rv = hu * np.sin(ang) + hv * np.cos(ang)
# Inigo Quilez 的心形 SDF（尖端在 (0,0)，两瓣在上）
qx = np.abs(ru) * 0.56
qy = rv * 0.56 + 0.56
d_lobe = np.sqrt((qx - 0.25) ** 2 + (qy - 0.75) ** 2) - np.sqrt(2.0) / 4.0
t = np.maximum(qx + qy, 0) * 0.5
d_tip = np.sqrt(np.minimum(qx ** 2 + (qy - 1.0) ** 2, (qx - t) ** 2 + (qy - t) ** 2)) * np.sign(qx - qy)
hd = np.where(qy + qx > 1.0, d_lobe, d_tip)
hf = hd
hd_n = hd + 0.016 * mid + 0.008 * fine + np.where(ru > 0, 0.02 * mid, 0)
soft = np.where(ru > 0, 0.03, 0.008)
heart_in = 1 - smooth(-soft, soft, hd_n)
left = 1 - smooth(-0.12, 0.12, ru + 0.05 * mid)
sput = heart_in * left
east = heart_in * (1 - left)
heart_mask = np.clip(heart_in, 0, 1)

bright = np.array([246, 239, 228], np.float32) * (1 + 0.01 * fine)[..., None]
col = col * (1 - sput[..., None] * 0.95) + bright * sput[..., None] * 0.95
eb = east * np.clip(0.86 + 0.16 * mid + 0.06 * fine, 0, 1)
col = col * (1 - eb[..., None] * 0.88) + np.array([238, 226, 210]) * eb[..., None] * 0.88

# 斯普特尼克平原上的对流多边形（非常细微）
pts = np.stack([rng.uniform(150, 190, 80), rng.uniform(-14, 44, 80)], -1)
d1 = np.full(LON.shape, 1e9, np.float32)
d2 = np.full(LON.shape, 1e9, np.float32)
coslat = np.cos(np.radians(LAT))
for px_, py_ in pts:
    d = ((((LON - px_ + 540) % 360) - 180) * coslat) ** 2 + (LAT - py_) ** 2
    m = d < d1
    d2 = np.where(m, d1, np.minimum(d2, d))
    d1 = np.where(m, d, d1)
edge = 1 - smooth(0.0, 0.6, np.sqrt(d2) - np.sqrt(d1))
col *= (1 - 0.045 * edge * sput * (1 - smooth(-0.12, -0.01, hf)))[..., None]

# 心形东南的“指虎”暗斑
for l0, t0, r in [(224, -8, 5.0), (235, -5, 4.6), (246, -3, 4.2), (257, -2, 3.4), (267, 0, 2.8)]:
    d = np.sqrt((dlonw(l0) / r) ** 2 + ((WT - t0) / (r * 0.7)) ** 2)
    m = 1 - smooth(0.7, 1.15, d)
    col = col * (1 - m[..., None] * 0.8) + np.array([86, 46, 31]) * m[..., None] * 0.8

# 平原西侧的山脉（略暗、粗糙）
mtn = (1 - smooth(0, 5, np.abs(dlonw(148) + 0.35 * (WT - 15)))) * smooth(-10, 0, WT) * (1 - smooth(28, 42, WT))
col *= (1 - 0.16 * mtn * np.clip(0.5 + fine, 0, 1.5))[..., None]

disk = np.clip(col, 0, 255)
hm = heart_mask.astype(np.float32)
valid = rho <= 1.0

# 光照：近满相，光源略偏左上；Minnaert 临边昏暗
Z = np.sqrt(np.clip(1 - rho * rho, 0, 1))
Ldir = np.array([-0.32, 0.30, 0.90])
Ldir /= np.linalg.norm(Ldir)
mu0 = np.clip(X * Ldir[0] + Y * Ldir[1] + Z * Ldir[2], 0, 1)
mu = Z
k = 0.72
shade = (mu0 ** k) * (np.clip(mu, 1e-3, 1) ** (k - 1))
shade = np.clip(shade, 0, 1.25) * 0.98 + 0.02
disk = disk * shade[..., None]
disk = np.clip(disk, 0, 255)

# 抗锯齿圆边
alpha = np.clip((1.0 - rho) * N / 2 + 0.5, 0, 1)
rgba = np.dstack([disk, alpha * 255]).astype(np.uint8)


def webp(arr, mode, q=90):
    im = Image.fromarray(arr, mode)
    buf = io.BytesIO()
    im.save(buf, 'WEBP', quality=q, method=6)
    return buf.getvalue()


disk_bytes = webp(rgba, 'RGBA', 88)
Image.fromarray(rgba, 'RGBA').save('/tmp/pluto_disk.png')

# 心形发光遮罩（白色 + alpha）
hmask = (np.clip(hm * mu0 ** 0.5, 0, 1) * alpha)
hmask = cv2.resize(hmask, (256, 256), interpolation=cv2.INTER_AREA)
hm_rgba = np.dstack([np.full((256, 256, 3), 255, np.uint8), (hmask * 255).astype(np.uint8)])
heart_bytes = webp(hm_rgba, 'RGBA', 85)

# 像素化采样用的小网格（64×64 RGBA）
G = 64
small = cv2.resize(np.dstack([disk, alpha * 255]).astype(np.float32), (G, G), interpolation=cv2.INTER_AREA)
grid = np.clip(small, 0, 255).astype(np.uint8).tobytes()

b64 = lambda b: base64.b64encode(b).decode()
out = os.path.join(ROOT, 'src', 'assets', 'plutoTexture.ts')
with open(out, 'w') as f:
    f.write('// 自动生成：scripts/make-pluto-texture.py —— 请勿手动编辑\n')
    f.write(f"export const PLUTO_DISK = 'data:image/webp;base64,{b64(disk_bytes)}';\n")
    f.write(f"export const PLUTO_HEART = 'data:image/webp;base64,{b64(heart_bytes)}';\n")
    f.write(f'export const PLUTO_GRID_SIZE = {G};\n')
    f.write(f"export const PLUTO_GRID = '{b64(grid)}';\n")
print('disk', len(disk_bytes) // 1024, 'KB; heart', len(heart_bytes) // 1024, 'KB; grid', len(grid) // 1024, 'KB')


# =====================================================================
# 月球 & 卡戎（同一套投影/噪声/光照，512px）
# =====================================================================
def set_view(lat_deg, lon_deg, n):
    global N, X, Y, rho, LAT, LON, P
    N = n
    la0 = np.radians(lat_deg)
    yy, xx = np.mgrid[0:n, 0:n].astype(np.float32)
    X = (xx + 0.5) / n * 2 - 1
    Y = -((yy + 0.5) / n * 2 - 1)
    rho = np.sqrt(X * X + Y * Y)
    rc_ = np.clip(rho, 1e-6, 1.0)
    c_ = np.arcsin(rc_)
    latr = np.arcsin(np.clip(np.cos(c_) * np.sin(la0) + Y * np.sin(c_) * np.cos(la0) / rc_, -1, 1))
    LON = (lon_deg + np.degrees(np.arctan2(X * np.sin(c_), rc_ * np.cos(c_) * np.cos(la0) - Y * np.sin(c_) * np.sin(la0)))) % 360
    LAT = np.degrees(latr)
    P = np.stack([np.cos(latr) * np.cos(np.radians(LON)), np.cos(latr) * np.sin(np.radians(LON)), np.sin(latr)], -1).astype(np.float32)


def finish(col, k=0.72):
    Zs = np.sqrt(np.clip(1 - rho * rho, 0, 1))
    m0 = np.clip(X * Ldir[0] + Y * Ldir[1] + Zs * Ldir[2], 0, 1)
    sh = np.clip((m0 ** k) * (np.clip(Zs, 1e-3, 1) ** (k - 1)), 0, 1.25) * 0.98 + 0.02
    out = np.clip(col * sh[..., None], 0, 255)
    al = np.clip((1.0 - rho) * N / 2 + 0.5, 0, 1)
    return np.dstack([out, al * 255]).astype(np.uint8)


def blob(lon_c, lat_c, rx, ry, wl, wt, soft=0.25):
    dl = ((wl - lon_c + 540) % 360 - 180) * np.cos(np.radians(lat_c))
    d = np.sqrt((dl / rx) ** 2 + ((wt - lat_c) / ry) ** 2)
    return 1 - smooth(1 - soft, 1 + soft, d)


# ---- 月球（正面） ----
set_view(4, 0, 512)
wa = noise(2.5, 4, seed=21) * 4
wb = noise(2.5, 4, seed=22) * 4
ml, mt = LON + wa, LAT + wb
m_mid = noise(4, 5, seed=23)
m_fine = noise(20, 4, seed=24)
col = np.ones((N, N, 3), np.float32) * 178 * (1 + 0.06 * m_mid + 0.05 * m_fine)[..., None]
maria = np.zeros((N, N), np.float32)
for lc, tc, rx, ry in [(-16, 33, 15, 13), (17, 27, 9, 9), (30, 8, 11, 9), (59, 17, 7, 6), (51, -7, 7, 9), (-17, -20, 10, 9),
                       (-55, 15, 16, 26), (-40, -3, 12, 12), (-39, -24, 6, 6), (5, 56, 32, 4.5), (-5, 2, 7, 6), (35, -16, 7, 6)]:
    maria = np.maximum(maria, blob(lc, tc, rx, ry, ml, mt, soft=0.5))
maria *= np.clip(0.85 + 0.2 * m_mid, 0, 1)
col = col * (1 - maria[..., None] * 0.42)
# 第谷环形山 + 辐射纹
tdl = ((LON - (-11) + 540) % 360 - 180) * np.cos(np.radians(-43))
tdt = LAT + 43
tr = np.sqrt(tdl ** 2 + tdt ** 2)
ang_t = np.arctan2(tdt, tdl)
rays = (np.cos(ang_t * 7 + 1.3 + 0.6 * m_mid) * 0.5 + 0.5) ** 3 * np.exp(-tr / 40) * (1 - maria * 0.7)
col *= (1 + 0.1 * rays + 0.3 * np.exp(-(tr / 2.2) ** 2))[..., None]
moon_rgba = finish(col * np.array([1.0, 1.0, 0.985]), k=0.62)

# ---- 卡戎（北极“魔多斑”） ----
set_view(35, 0, 512)
wa = noise(2.2, 4, seed=31) * 5
wb = noise(2.2, 4, seed=32) * 5
cl, ct = LON + wa, LAT + wb
c_mid = noise(4, 5, seed=33)
c_fine = noise(18, 4, seed=34)
col = np.ones((N, N, 3), np.float32) * np.array([156, 152, 147], np.float32) * (1 + 0.07 * c_mid + 0.05 * c_fine)[..., None]
# 南部 Vulcan 平原：更平滑、稍亮
south = 1 - smooth(-6, 8, ct)
col = col * (1 + 0.06 * south)[..., None]
# 赤道附近的峡谷带（暗线）
for t0, w in [(8, 4.0), (14, 2.5)]:
    can = 1 - smooth(0, w, np.abs(ct - t0 - 3 * np.sin(np.radians(LON) * 2)))
    col *= (1 - 0.08 * can * np.clip(0.6 + 0.5 * c_mid, 0, 1))[..., None]
mordor = smooth(50, 74, ct + 4 * c_mid)
col = col * (1 - mordor[..., None] * 0.7) + np.array([118, 74, 58]) * mordor[..., None] * 0.7
charon_rgba = finish(col, k=0.7)

moon_bytes = webp(moon_rgba, 'RGBA', 86)
charon_bytes = webp(charon_rgba, 'RGBA', 86)
Image.fromarray(moon_rgba, 'RGBA').save('/tmp/moon_disk.png')
Image.fromarray(charon_rgba, 'RGBA').save('/tmp/charon_disk.png')
with open(out, 'a') as f:
    f.write(f"export const MOON_DISK = 'data:image/webp;base64,{b64(moon_bytes)}';\n")
    f.write(f"export const CHARON_DISK = 'data:image/webp;base64,{b64(charon_bytes)}';\n")
print('moon', len(moon_bytes) // 1024, 'KB; charon', len(charon_bytes) // 1024, 'KB')
