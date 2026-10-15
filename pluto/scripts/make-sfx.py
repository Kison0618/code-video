#!/usr/bin/env python3
"""程序化合成全片音效 → public/sfx/*.mp3（只依赖 numpy + ffmpeg）。
改参数后重新运行：python3 scripts/make-sfx.py"""
import os, subprocess, tempfile, wave
import numpy as np

SR = 48000
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
rng = np.random.default_rng(7)

def t_(sec): return np.arange(int(SR * sec)) / SR

def pink(n):
    w = rng.standard_normal(n)
    f = np.fft.rfft(w); k = np.arange(len(f)); k[0] = 1
    f /= np.sqrt(k)
    x = np.fft.irfft(f, n); return x / (np.abs(x).max() + 1e-9)

def svf(x, fc, q=0.7, mode='bp'):
    """时变状态变量滤波器；fc 可为标量或逐样本数组"""
    fc = np.broadcast_to(np.asarray(fc, float), x.shape)
    f = 2 * np.sin(np.pi * np.clip(fc, 20, SR / 6) / SR)
    d = 1 / q
    lo = bp = 0.0
    out = np.empty_like(x)
    for i in range(len(x)):
        hi = x[i] - lo - d * bp
        bp += f[i] * hi
        lo += f[i] * bp
        out[i] = bp if mode == 'bp' else lo if mode == 'lp' else hi
    return out

def lp1(x, fc):
    a = np.exp(-2 * np.pi * fc / SR); y = np.empty_like(x); s = 0.0
    for i in range(len(x)): s = (1 - a) * x[i] + a * s; y[i] = s
    return y

def env(n, a, d, shape=4.0):
    """a 秒起音、d 秒指数衰减"""
    t = np.arange(n) / SR
    e = np.where(t < a, (t / max(a, 1e-4)) ** 1.5, np.exp(-(t - a) / max(d, 1e-4) * shape / 4))
    return e

def fades(x, fi=0.005, fo=0.05):
    n = len(x); i = int(fi * SR); o = int(fo * SR)
    if i: x[:i] *= np.linspace(0, 1, i)[:, None] if x.ndim == 2 else np.linspace(0, 1, i)
    if o: x[-o:] *= np.linspace(1, 0, o)[:, None] if x.ndim == 2 else np.linspace(1, 0, o)
    return x

def pan(x, p):
    """p ∈ [-1,1]，可逐样本"""
    p = np.broadcast_to(np.asarray(p, float), x.shape)
    a = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(a), x * np.sin(a)], 1)

def reverb(st, sec=2.2, wet=0.35, damp=3000):
    n = int(sec * SR)
    tt = np.arange(n) / SR
    irs = []
    for _ in range(2):
        ir = rng.standard_normal(n) * np.exp(-tt * 6.9 / sec)
        ir = lp1(ir, damp); ir[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        irs.append(ir / np.sqrt((ir ** 2).sum()))
    L = len(st) + n
    out = np.zeros((L, 2))
    for c in range(2):
        F = np.fft.rfft(st[:, c], L) * np.fft.rfft(irs[c], L)
        out[:, c] = np.fft.irfft(F, L)
    dry = np.zeros((L, 2)); dry[: len(st)] = st
    return dry * (1 - wet) + out * wet * 3

def save(name, st, peak_db=-1.0, trim=True):
    if st.ndim == 1: st = pan(st, 0)
    if trim:  # 去掉尾部静音
        a = np.abs(st).max(1); idx = np.where(a > 10 ** (-70 / 20) * a.max())[0]
        st = st[: idx[-1] + 1 if len(idx) else len(st)]
    st = fades(st.copy(), 0.0005, 0.03)
    st = st / (np.abs(st).max() + 1e-9) * 10 ** (peak_db / 20)
    pcm = (st * 32767).astype('<i2')
    with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
        with wave.open(tmp.name, 'wb') as w:
            w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp.name, '-c:a', 'libmp3lame', '-b:a', '192k',
                        os.path.join(OUT, name + '.mp3')], check=True)
    os.unlink(tmp.name)
    print(f'{name}.mp3  {len(st) / SR:.2f}s')

def sweep_env(t, pts):
    xs, ys = zip(*pts); return np.interp(t, xs, ys)

# ---------------------------------------------------------------- 转场呼啸
def whoosh(dur=1.5, peak=0.6, lo=250, hi=4200, panr=(-0.8, 0.8), name='whoosh', bright=1.0):
    t = t_(dur); n = len(t)
    fc = sweep_env(t, [(0, lo), (peak, hi * bright), (dur, lo * 1.5)])
    x = svf(pink(n), fc, q=1.4)
    x += 0.5 * svf(rng.standard_normal(n), fc * 1.8, q=3.0) * bright
    a = sweep_env(t, [(0, 0), (peak * 0.55, 0.25), (peak, 1), (peak + 0.35, 0.25), (dur, 0)]) ** 1.6
    x *= a
    st = pan(x, np.interp(t, [0, dur], panr))
    save(name, reverb(st, 1.6, 0.3))

# ---------------------------------------------------------------- 低频撞击
def impact(name='impact', sub=(95, 32), dur=3.5, body=1.0, tail=2.8):
    t = t_(dur); n = len(t)
    f = sub[1] + (sub[0] - sub[1]) * np.exp(-t * 7)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) * np.exp(-t * 1.6)
    x += 0.5 * np.tanh(3 * np.sin(ph * 2)) * np.exp(-t * 6) * body
    nz = svf(rng.standard_normal(n), 1800, 0.8, 'lp') * np.exp(-t * 35)
    x += 0.9 * nz
    crack = svf(rng.standard_normal(n), 5000, 2.0) * np.exp(-t * 60)
    x += 0.35 * crack
    st = pan(np.tanh(1.4 * x), 0)
    save(name, reverb(st, tail, 0.33, 2200))

# ---------------------------------------------------------------- 上扬
def riser(name='riser', dur=2.6):
    t = t_(dur); n = len(t); u = t / dur
    fc = 250 * (24 ** u ** 1.6)
    x = svf(pink(n), fc, 2.0)
    f0 = 180 * 4 ** u ** 1.3 * (1 + 0.01 * np.sin(2 * np.pi * 6 * t))
    ph = 2 * np.pi * np.cumsum(f0) / SR
    tone = sum(np.sin(ph * k * (1 + 0.003 * k)) / k for k in (1, 2, 3, 5))
    x = x + 0.35 * tone
    x *= u ** 2.2
    st = pan(x, 0.5 * np.sin(2 * np.pi * 0.7 * t))
    save(name, reverb(st, 1.8, 0.35), trim=False)

# ---------------------------------------------------------------- 闪光颗粒
def shimmer(name='shimmer', dur=3.0, base=1046.5, count=26, spread=0.8):
    t = t_(dur); n = len(t)
    scale = [1, 9 / 8, 5 / 4, 3 / 2, 5 / 3, 2, 9 / 4, 5 / 2, 3, 10 / 3, 4]
    st = np.zeros((n, 2))
    for k in range(count):
        f = base * scale[rng.integers(len(scale))] * (1 + rng.normal(0, 0.002))
        t0 = rng.uniform(0, spread) * (k / count) ** 0.6
        i0 = int(t0 * SR); m = n - i0
        tt = np.arange(m) / SR
        s = (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 9)) * np.exp(-tt * rng.uniform(2.5, 5))
        s *= np.minimum(1, tt / 0.004) * rng.uniform(0.4, 1)
        st[i0:] += pan(s, rng.uniform(-0.8, 0.8))
    save(name, reverb(st, 2.8, 0.5, 6000))

# ---------------------------------------------------------------- UI 提示音
def blip(name='blip', f=1500, dur=0.35, harm=2.0, decay=28):
    t = t_(dur)
    x = (np.sin(2 * np.pi * f * t) + 0.35 * np.sin(2 * np.pi * f * harm * t)) * np.exp(-t * decay) * np.minimum(1, t / 0.002)
    save(name, reverb(pan(x, 0), 0.8, 0.22, 7000))

def lock(name='lock'):
    n = int(0.7 * SR); x = np.zeros(n)
    for k, (t0, f) in enumerate([(0, 1760), (0.09, 2637)]):
        tt = np.arange(n - int(t0 * SR)) / SR
        x[int(t0 * SR):] += np.sign(np.sin(2 * np.pi * f * tt)) * 0.25 * np.exp(-tt * 40) * (tt < 0.07)
        x[int(t0 * SR):] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 25)
    save(name, reverb(pan(lp1(x, 9000), 0), 0.9, 0.25, 7000))

# ---------------------------------------------------------------- 打字 / 数据 / 计数
def clicks(name, dur, rate, kind):
    n = int(dur * SR); x = np.zeros((n, 2)); tt = 0.03
    while tt < dur - 0.05:
        i = int(tt * SR); m = int(0.04 * SR); k = np.arange(m) / SR
        if kind == 'type':
            s = svf(rng.standard_normal(m), rng.uniform(2500, 4500), 1.5) * np.exp(-k * 160)
            s += 0.4 * np.sin(2 * np.pi * rng.uniform(180, 260) * k) * np.exp(-k * 90)
            p = rng.uniform(-0.3, 0.3); g = rng.uniform(0.5, 1)
        elif kind == 'tick':
            f = rng.uniform(2600, 3400)
            s = np.sin(2 * np.pi * f * k) * np.exp(-k * 260) + 0.5 * svf(rng.standard_normal(m), 6000, 2) * np.exp(-k * 400)
            p = rng.uniform(-0.15, 0.15); g = rng.uniform(0.6, 1)
        else:  # data：随机电子短音
            ln = rng.uniform(0.02, 0.07); m = int(ln * SR); k = np.arange(m) / SR
            f = rng.choice([880, 1175, 1318, 1568, 1760, 2093, 2349, 2637, 3136]) * rng.choice([1, 1, 0.5, 2])
            s = np.sign(np.sin(2 * np.pi * f * k)) * 0.5 + np.sin(2 * np.pi * f * k)
            s *= np.minimum(1, k / 0.002) * np.minimum(1, (ln - k) / 0.004)
            p = rng.uniform(-0.9, 0.9); g = rng.uniform(0.25, 0.8)
        e = min(n, i + m); x[i:e] += pan(s[: e - i] * g, p)
        tt += rng.exponential(1 / rate) * 0.6 + 0.4 / rate
    save(name, reverb(x, 0.6, 0.15, 8000), trim=False)

# ---------------------------------------------------------------- 扫描
def scan(name='scan', dur=3.2):
    t = t_(dur); n = len(t); u = t / dur
    f = 300 + 1500 * u
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = (np.sin(ph) + 0.4 * np.sin(ph * 1.5)) * (0.55 + 0.45 * np.sin(2 * np.pi * 14 * t))
    x += 0.6 * svf(pink(n), f * 2, 6)
    x *= np.sin(np.pi * u) ** 0.8
    save(name, reverb(pan(x * 0.6, np.interp(u, [0, 1], [-0.5, 0.5])), 1.2, 0.3), trim=False)

# ---------------------------------------------------------------- 故障
def glitch(name='glitch', dur=0.7):
    n = int(dur * SR); x = np.zeros(n); i = 0
    while i < n:
        m = int(rng.uniform(0.015, 0.07) * SR); k = np.arange(m) / SR
        typ = rng.integers(3)
        if typ == 0: s = np.sign(np.sin(2 * np.pi * rng.uniform(80, 1400) * k))
        elif typ == 1:
            s = rng.standard_normal(m); hold = int(rng.integers(8, 60)); s = np.repeat(s[::hold], hold)[:m]
        else: s = np.zeros(m)
        s = np.round(s * 4) / 4
        x[i:i + m] = s[: n - i] * rng.uniform(0.4, 1); i += m
    st = pan(x, 0) ; st[:, 0] = np.roll(st[:, 0], 90)
    save(name, reverb(st * 0.8, 0.5, 0.15))

def deny(name='deny'):
    t = t_(0.9)
    f = np.where(t < 0.14, 330, 247)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.tanh(3 * (np.sin(ph) + 0.5 * np.sin(ph * 2.01))) * np.exp(-np.maximum(0, t - 0.14) * 7) * (t < 0.6)
    x += 0.8 * np.sin(2 * np.pi * 55 * t) * np.exp(-t * 8)
    save(name, reverb(pan(lp1(x, 4000), 0), 1.0, 0.25))

# ---------------------------------------------------------------- 心跳 / 和声 / 嗡鸣
def heartbeat(name='heartbeat'):
    t = t_(1.2); x = np.zeros(len(t))
    for t0, g in ((0, 1), (0.26, 0.7)):
        tt = np.maximum(0, t - t0)
        f = 48 + 40 * np.exp(-tt * 30)
        x += g * np.sin(2 * np.pi * np.cumsum(f * (t >= t0)) / SR) * np.exp(-tt * 14) * (t >= t0)
    x = np.tanh(2 * x)
    save(name, reverb(pan(x, 0), 1.5, 0.25, 1200))

def chime(name='chime', notes=(1318.5, 1975.5), gap=0.12):
    t = t_(2.6); x = np.zeros(len(t))
    for j, f in enumerate(notes):
        tt = np.maximum(0, t - j * gap); on = t >= j * gap
        for k, (r, a, d) in enumerate([(1, 1, 2.2), (2.0, 0.4, 4), (3.01, 0.25, 6), (4.2, 0.12, 9)]):
            x += on * a * np.sin(2 * np.pi * f * r * tt) * np.exp(-tt * d) * np.minimum(1, tt / 0.003)
    save(name, reverb(pan(x, 0.1), 2.4, 0.42, 7000))

def drone(name='drone', dur=9.0, root=55.0):
    t = t_(dur); n = len(t); st = np.zeros((n, 2))
    for k, (r, a) in enumerate([(1, 1), (1.5, 0.5), (2, 0.6), (3, 0.25), (4, 0.15), (6, 0.08)]):
        for det, p in ((-0.18, -0.6), (0.18, 0.6)):
            f = root * r + det * r
            st += pan(a * np.sin(2 * np.pi * f * t + rng.uniform(0, 6.28)) * (0.75 + 0.25 * np.sin(2 * np.pi * (0.07 + 0.03 * k) * t)), p)
    air = svf(pink(n), 900 + 500 * np.sin(2 * np.pi * 0.1 * t), 2.5)
    st += pan(air * 0.5, 0.3 * np.sin(2 * np.pi * 0.05 * t))
    st *= np.minimum(1, t / 2.0)[:, None] * np.minimum(1, (dur - t) / 2.5)[:, None]
    save(name, reverb(st, 3.0, 0.4, 1800), trim=False)

def swell(name='swell', dur=2.2):
    """反向镲片式吸气，结尾即重拍"""
    t = t_(dur); n = len(t)
    x = svf(rng.standard_normal(n), 7000, 0.9, 'hp') * np.exp(-(dur - t) * 3.2)
    x += 0.4 * svf(pink(n), 1200 + 3000 * (t / dur) ** 2, 1.5) * (t / dur) ** 3
    save(name, pan(x, 0), trim=False)

def ping(name='ping', f=1250):
    t = t_(0.6)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 10) * np.minimum(1, t / 0.003)
    x += 0.2 * np.sin(2 * np.pi * f * 1.5 * t) * np.exp(-t * 20)
    st = pan(x, 0)
    # 回声
    out = np.zeros((len(st) + int(1.6 * SR), 2))
    for k in range(5):
        d = int(k * 0.32 * SR); out[d:d + len(st)] += st * (0.55 ** k) * np.array([1, 0.6] if k % 2 else [0.6, 1])
    save(name, reverb(out, 2.0, 0.4, 5000))

def warp(name='warp', dur=6.0):
    t = t_(dur); n = len(t); u = t / dur
    x = svf(pink(n), 300 + 2500 * u ** 1.5 + 400 * np.sin(2 * np.pi * 0.6 * t), 1.2)
    f = 90 + 260 * u ** 2
    ph = 2 * np.pi * np.cumsum(f) / SR
    x += 0.3 * (np.sin(ph) + 0.5 * np.sin(ph * 2.02) + 0.3 * np.sin(ph * 3.01))
    x *= np.minimum(1, t / 1.2) * np.minimum(1, (dur - t) / 1.0)
    d = (0.003 + 0.002 * np.sin(2 * np.pi * 0.3 * t)) * SR  # 镶边
    idx = np.clip(np.arange(n) - d.astype(int), 0, n - 1)
    st = np.stack([x + 0.7 * x[idx], x - 0.7 * x[idx]], 1)
    save(name, reverb(st, 1.8, 0.3), trim=False)

def shutter(name='shutter'):
    n = int(0.25 * SR); k = np.arange(n) / SR; x = np.zeros(n)
    for t0, g in ((0, 1), (0.045, 0.6)):
        i = int(t0 * SR); m = n - i; kk = k[:m]
        x[i:] += g * (svf(rng.standard_normal(m), 3200, 2.5) * np.exp(-kk * 120) + 0.6 * np.sin(2 * np.pi * 420 * kk) * np.exp(-kk * 80))
    save(name, reverb(pan(x, 0), 0.5, 0.2, 6000))

def bead(name='bead'):
    """珠子落定的清脆小音"""
    t = t_(0.5)
    x = np.sin(2 * np.pi * 2200 * t) * np.exp(-t * 30) + 0.5 * np.sin(2 * np.pi * 3300 * t) * np.exp(-t * 45)
    save(name, reverb(pan(x, 0), 0.7, 0.3, 8000))

if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    whoosh(); whoosh(name='whoosh2', lo=180, hi=2600, panr=(0.8, -0.8), bright=0.8)
    whoosh(name='whoosh_fast', dur=0.8, peak=0.32, hi=5200, panr=(-0.4, 0.4))
    impact(); impact(name='impact_soft', sub=(70, 40), body=0.4, tail=2.0)
    impact(name='boom', sub=(120, 28), dur=5.5, body=1.3, tail=4.5)
    riser(); swell(); shimmer(); shimmer(name='sparkle', dur=1.6, base=2093, count=10, spread=0.25)
    blip(); blip(name='blip_lo', f=760, harm=3.0, decay=22); lock(); bead()
    clicks('typing', 4.0, 15, 'type'); clicks('ticks', 4.0, 22, 'tick'); clicks('data', 5.0, 26, 'data')
    scan(); glitch(); deny(); heartbeat(); chime(); drone(); ping(); warp(); shutter()
