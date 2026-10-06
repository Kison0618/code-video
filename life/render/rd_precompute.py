# 预计算图灵斑纹（Gray–Scott 反应扩散）。初始"种子"就是向日葵的种子位置。
# 输出 cache/rd.bin：每帧 GW*GH 个 uint8（v 浓度），30 帧/秒
import numpy as np, sys, math
GW, GH, SCALE = 480, 270, 4
T0, T1, FPS = 197.5, 226.5, 30
def params(t):
    # 先长出斑点（会分裂的 mitosis 区），再过渡到条纹/迷宫
    u = min(1, max(0, (t - 207.5) / 4.0)); u = u * u * (3 - 2 * u)
    F = 0.030 + (0.040 - 0.030) * u
    k = 0.062 + (0.060 - 0.062) * u
    return F, k
def steps_per_frame(t):
    return 15
U = np.ones((GH, GW), np.float32); V = np.zeros((GH, GW), np.float32)
# 向日葵种子（与 s3_form.js 中相同的公式）
R, N, alpha = 400.0, 1000, 137.50776405 * math.pi / 180
c = R / math.sqrt(N)
yy, xx = np.mgrid[0:GH, 0:GW]
for j in range(0, N, 3):
    r = c * math.sqrt(N - j + 0.5); th = j * alpha
    x = (960 + r * math.cos(th)) / SCALE; y = (500 + r * math.sin(th)) / SCALE
    m = (xx - x) ** 2 + (yy - y) ** 2 < 1.5 ** 2
    V[m] = 0.5; U[m] = 0.5
rng = np.random.default_rng(3)
Du, Dv = 1.0, 0.5
def lap(Z):
    a = np.roll(Z, 1, 0) + np.roll(Z, -1, 0) + np.roll(Z, 1, 1) + np.roll(Z, -1, 1)
    dg = np.roll(np.roll(Z, 1, 0), 1, 1) + np.roll(np.roll(Z, 1, 0), -1, 1) + np.roll(np.roll(Z, -1, 0), 1, 1) + np.roll(np.roll(Z, -1, 0), -1, 1)
    return 0.2 * a + 0.05 * dg - Z
nframes = int((T1 - T0) * FPS) + 1
out = np.zeros((nframes, GH, GW), np.uint8)
for f in range(nframes):
    t = T0 + f / FPS
    F, k = params(t)
    for _ in range(steps_per_frame(t) * 2):  # 30fps 存储，每帧 = 两个 60fps 帧的步数
        uvv = U * V * V
        U += Du * lap(U) - uvv + F * (1 - U)
        V += Dv * lap(V) + uvv - (F + k) * V
    out[f] = np.clip(V / 0.45 * 255, 0, 255).astype(np.uint8)
    if f % 60 == 0: print(f"{t:.1f}s  vmax={V.max():.3f} cover={(V>0.2).mean():.2f}", flush=True)
out.tofile('cache/rd.bin')
print('frames', nframes)
