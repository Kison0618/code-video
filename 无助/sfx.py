"""无助 · 音效轨

全部音效用代码合成，不需要素材文件。时间点和 demo.html 的画面一一对应。

用法（在 无助/ 目录下）：
    python sfx.py               # 生成 sfx.wav（只有音效），以及 mix.wav（音效 + bgm_full.wav）
    python sfx.py --check       # 只把每种音效合成一遍，检查脚本能不能跑，不写文件
    python sfx.py --solo 93.57  # 只导出某个时刻前后 4 秒的音效，方便试听 → solo.wav

依赖：numpy。
bgm_full.wav 用 README 里的 ffmpeg 命令先拼好。
"""
import sys
import wave
import numpy as np

SR = 48000
DUR = 159.75
rng = np.random.default_rng(7)


# ---------------------------------------------------------------- 基础零件
def t_(dur):
    return np.arange(int(dur * SR)) / SR


def env(dur, a=0.005, d=0.3):
    """快起、指数衰减的包络。"""
    t = t_(dur)
    return np.minimum(1, t / max(a, 1e-4)) * np.exp(-t / d)


def bell(dur, peak=0.5):
    """先升后降的包络（呼啸声用）。"""
    t = t_(dur) / dur
    return np.sin(np.pi * np.clip(t, 0, 1)) ** 2 if peak == 0.5 else np.where(t < peak, t / peak, (1 - t) / (1 - peak)) ** 2


def band(x, lo, hi):
    """用 FFT 做带通。"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X[(f < lo) | (f > hi)] = 0
    return np.fft.irfft(X, len(x))


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def lowpass_sweep(x, f0, f1):
    """截止频率从 f0 滑到 f1 的一阶低通（上扬音用）。"""
    n = len(x)
    fc = np.geomspace(f0, f1, n)
    a = np.exp(-2 * np.pi * fc / SR)
    y = np.empty(n)
    acc = 0.0
    for i in range(n):
        acc = a[i] * acc + (1 - a[i]) * x[i]
        y[i] = acc
    return y


def sweep(f0, f1, dur):
    f = np.geomspace(f0, f1, int(dur * SR))
    return np.sin(2 * np.pi * np.cumsum(f) / SR)


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


# ---------------------------------------------------------------- 音效
def boom(dur=2.2):
    """大字砸下 / 落点：100 Hz 以下的一记低音。"""
    body = sweep(70, 34, dur) * env(dur, 0.004, 0.55)
    sub = np.sin(2 * np.pi * 42 * t_(dur)) * env(dur, 0.01, 0.9) * 0.6
    thump = band(noise(dur), 30, 180) * env(dur, 0.001, 0.08) * 0.8
    return norm(body + sub + thump)


def riser(dur=2.0):
    """落点之前的上扬音：噪声越来越亮，最后一刻收住。"""
    n = noise(dur)
    y = lowpass_sweep(n, 200, 9000) * np.linspace(0, 1, len(n)) ** 2
    tone = sweep(220, 880, dur) * np.linspace(0, 1, len(n)) ** 3 * 0.25
    y = y + tone
    y[-int(0.03 * SR):] *= np.linspace(1, 0, int(0.03 * SR))
    return norm(y)


def shimmer(dur=2.5):
    """片名亮起时的一层细亮的余韵。"""
    t = t_(dur)
    y = sum(np.sin(2 * np.pi * f * t + p) for f, p in [(1760, 0), (2217, 1), (2637, 2), (3520, 3)])
    return norm(y * env(dur, 0.05, 0.8) * (1 + 0.3 * np.sin(2 * np.pi * 6 * t)))


def ding(f=1320, dur=1.4):
    """“有用”的那一声：钟一样的几个泛音。"""
    t = t_(dur)
    y = (np.sin(2 * np.pi * f * t) * np.exp(-t / 0.5)
         + 0.5 * np.sin(2 * np.pi * f * 2.76 * t) * np.exp(-t / 0.18)
         + 0.25 * np.sin(2 * np.pi * f * 5.4 * t) * np.exp(-t / 0.07))
    return norm(y * np.minimum(1, t / 0.002))


def tick(f=2600, dur=0.06):
    t = t_(dur)
    return norm(np.sin(2 * np.pi * f * t) * np.exp(-t / 0.012) + band(noise(dur), 2000, 7000) * np.exp(-t / 0.006) * 0.4)


def pop(dur=0.09):
    """气泡、标签冒出来。"""
    return norm(sweep(380, 950, dur) * env(dur, 0.003, 0.03))


def whoosh(dur=0.7, lo=300, hi=3500):
    return norm(band(noise(dur), lo, hi) * bell(dur, 0.6))


def send():
    """邮件发出去：一小声呼啸 + 一声轻响。"""
    w = whoosh(0.35, 600, 5000)
    d = ding(1568, 0.8) * 0.5
    y = np.zeros(int(0.35 * SR) + len(d))
    y[:len(w)] += w
    y[int(0.28 * SR):int(0.28 * SR) + len(d)] += d
    return norm(y)


def click(dur=0.05):
    """按下面板。"""
    t = t_(dur)
    return norm(band(noise(dur), 800, 4000) * np.exp(-t / 0.006) + np.sin(2 * np.pi * 180 * t) * np.exp(-t / 0.015))


def buzz(dur=1.0):
    """电：低频嗡嗡声，夹着噼啪。"""
    t = t_(dur)
    hum = sum(np.sin(2 * np.pi * 100 * k * t) / k for k in range(1, 9))
    hum *= 0.6 + 0.4 * np.sin(2 * np.pi * 7 * t) ** 2
    crackle = band(noise(dur), 2500, 9000) * (rng.random(len(t)) > 0.996) * 6
    return norm((hum + crackle) * bell(dur, 0.15))


def thud(dur=0.5):
    """趴下。"""
    t = t_(dur)
    return norm(np.sin(2 * np.pi * 85 * t) * np.exp(-t / 0.09) + band(noise(dur), 60, 400) * np.exp(-t / 0.05) * 0.6)


def shatter(dur=1.6):
    """箱子的墙被炸开：一阵碎响。"""
    y = band(noise(dur), 1500, 9000) * env(dur, 0.002, 0.25)
    for _ in range(40):
        s = int(rng.uniform(0, 0.6) * SR)
        g = ding(rng.uniform(2200, 6000), 0.35) * rng.uniform(0.1, 0.35)
        y[s:s + len(g)] += g[:len(y) - s]
    return norm(y)


def scribble(dur=0.35):
    """打勾：笔在纸上划一下。"""
    t = t_(dur)
    return norm(band(noise(dur), 1800, 6000) * (0.5 + 0.5 * np.sin(2 * np.pi * 16 * t)) * bell(dur, 0.3))


def step(dur=0.12):
    t = t_(dur)
    return norm(band(noise(dur), 80, 900) * np.exp(-t / 0.03))


def drone(dur):
    """安静段落里一条持续的细音（2.4 kHz 附近）。"""
    t = t_(dur)
    y = np.sin(2 * np.pi * (2400 + 6 * np.sin(2 * np.pi * 0.3 * t)) * t) + 0.4 * np.sin(2 * np.pi * 3600 * t)
    fade = np.minimum(1, np.minimum(t / 1.5, (dur - t) / 1.5))
    return norm(y * np.clip(fade, 0, 1))


# ---------------------------------------------------------------- 时间轴
# (秒, 音效, 音量 dB, 声像 -1 左 … 1 右)
PENTA = [1047, 1175, 1319, 1568, 1760, 2093, 2349, 2637]
CUES = [
    # —— 冷开场：邮箱
    (1.68, send(), -14, 0.1),
    *[(3.4 + i * 0.33, tick(1900), -30, 0.3) for i in range(7)],          # DAY 1 → DAY 7
    (14.9, riser(2.15), -16, 0),                                         # 落进片名
    # —— 17.05 片名
    (17.05, boom(), -8, 0),
    (17.05, shimmer(), -22, 0),
    # —— 箱子
    (25.0, thud(), -24, -0.2),
    (27.8, whoosh(1.2, 300, 2500), -26, 0.3),                             # 跳过去的那道弧
    *[(30.1 + i * 0.62, buzz(0.5), -24, -0.2) for i in range(4)],         # 地板一下一下地带电
    (35.2, pop(), -28, -0.2),                                             # 问号
    # —— 三只狗
    (39.6, buzz(1.4), -26, 0),
    (40.5, click(), -20, 0),
    (40.6, ding(1568, 0.8), -26, 0),                                      # 电停了
    (42.6, buzz(4.8), -28, 0),
    *[(t, click(), -22, 0) for t in (43.1, 43.9, 44.7)],                  # 怎么推都没用
    (47.8, whoosh(0.8, 200, 1500), -28, 0),                               # 栏杆升起
    (50.1, whoosh(1.1), -22, -0.3), (50.5, whoosh(1.1), -24, 0.3),         # 一号、三号跳过去
    (52.4, thud(), -20, 0),                                               # 二号趴下
    (57.2, riser(1.8), -24, 0),
    (59.0, boom(), -10, 0),                                               # 大字：做什么，都没用
    # —— 人也一样：那些话
    (70.5, pop(), -22, -0.3), (73.0, pop(), -22, 0.3),
    *[(75.3 + i * 0.09, pop(), -28 + i * 0.6, (-1) ** i * 0.5) for i in range(12)],
    # —— 降下来：一条细音
    (76.6, drone(10.6), -38, 0),
    (84.5, whoosh(1.6, 200, 1200), -26, 0),                               # 那些话变成墙
    (91.4, riser(2.15), -16, 0),
    # —— 93.57 翻转
    (93.57, boom(), -8, 0),
    (93.57, shatter(), -18, 0),
    # —— 有用
    (104.9, ding(1319), -16, 0),
    *[(110.85 + i * 0.28, ding(PENTA[i % len(PENTA)], 0.9), -24, 0) for i in range(7)],
    (115.0, whoosh(1.4, 200, 1800), -24, 0),
    (117.4, whoosh(1.1), -22, 0.2),
    (118.0, ding(2093), -18, 0.3),                                        # 它自己跳过去了
    # —— 便利店
    (124.2, pop(), -24, -0.3), (126.5, pop(), -24, 0.3),
    # —— 本子
    (131.8, scribble(0.5), -26, 0),                                       # 划掉最难的那道
    *[(t, scribble(), -24, 0) for t in (133.4, 134.3, 134.9)],
    *[(t, step(), -28, -0.6 + 0.08 * i) for i, t in enumerate(142.2 + k * 0.09 for k in range(16))],
    (144.2, riser(0.4), -26, 0),
    (144.58, boom(), -10, 0),                                             # 大字：放弃是天生的
    (148.0, ding(1047, 1.8), -24, 0),                                     # 邮箱重新亮起来
    (150.75, send(), -14, 0.1),
    (156.1, boom(3.0), -18, 0),                                           # 片尾
    (156.1, shimmer(3.5), -26, 0),
]
# 右上角“有用”计数每加一，就“叮”一声，音一次比一次高
USE_AT = [127.0, 133.6, 134.5, 135.1, 136.0, 142.7, 143.5, 150.9]
CUES += [(t, ding(PENTA[i]), -18, 0.5) for i, t in enumerate(USE_AT)]


# ---------------------------------------------------------------- 混音
def place(track, at, clip, db, pan):
    g = 10 ** (db / 20)
    s = int(at * SR)
    e = min(len(track), s + len(clip))
    if e <= s:
        return
    c = clip[:e - s] * g
    track[s:e, 0] += c * np.sqrt((1 - pan) / 2)
    track[s:e, 1] += c * np.sqrt((1 + pan) / 2)


def read_wav(path):
    with wave.open(path, 'rb') as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    x = x.reshape(-1, ch)
    if ch == 1:
        x = np.repeat(x, 2, axis=1)
    if sr != SR:   # 简单重采样
        idx = np.arange(int(len(x) * SR / sr)) * sr / SR
        x = np.stack([np.interp(idx, np.arange(len(x)), x[:, c]) for c in range(2)], axis=1)
    return x


def write_wav(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())


def main():
    if '--check' in sys.argv:
        print(f'{len(CUES)} 个音效都合成好了，脚本没问题。')
        return
    track = np.zeros((int(DUR * SR), 2))
    for at, clip, db, pan in CUES:
        place(track, at, clip, db, pan)
    if '--solo' in sys.argv:
        c = float(sys.argv[sys.argv.index('--solo') + 1])
        a, b = int(max(0, c - 4) * SR), int((c + 4) * SR)
        write_wav('solo.wav', track[a:b])
        print('写好了 solo.wav')
        return
    write_wav('sfx.wav', track)
    print('写好了 sfx.wav')
    try:
        bgm = read_wav('bgm_full.wav')
    except FileNotFoundError:
        print('没找到 bgm_full.wav，跳过混音。先按 README 拼好 BGM。')
        return
    n = len(track)
    bgm = np.pad(bgm, ((0, max(0, n - len(bgm))), (0, 0)))[:n]
    mix = bgm * 0.9 + track
    fade = int(1.45 * SR)
    mix[-fade:] *= np.linspace(1, 0, fade)[:, None]
    mix = mix / max(1, np.max(np.abs(mix)) / 0.97)
    write_wav('mix.wav', mix)
    print('写好了 mix.wav（BGM + 音效）')


if __name__ == '__main__':
    main()
