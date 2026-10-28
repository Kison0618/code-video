# 第一集音效：全部代码合成，事件时间读 audio/events.json（由 audio/cues.js 从 render/src/timeline.js 导出，与画面同源）
# 乐器 / 基础音效函数整段沿用 theory/audio/sfx_music.py；新增的是纸张拼贴世界用到的轻、短、干净的几类
# 用法：python audio/sfx.py [audio/events.json]   → audio/sfx.wav（48 kHz 立体声，未调总音量，mix.js 里 -5 dB）
import json, math, sys, wave, os
import numpy as np
from scipy.signal import fftconvolve, butter, sosfilt

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
D = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'events.json'), encoding='utf8'))
M, EV = D['marks'], D['ev']
DUR = M['DUR']
L = int(DUR * SR) + SR
sfx = np.zeros((2, L))
rng = np.random.default_rng(20261027)

def hz(m): return 440 * 2 ** ((m - 69) / 12)
def tt_(d): return np.arange(int(d * SR)) / SR
def add(buf, sig, at, gain=1.0, pan=0.0):
    i = int(round(at * SR))
    if i < 0: sig = sig[..., -i:]; i = 0
    n = min(sig.shape[-1], L - i)
    if n <= 0: return
    if sig.ndim == 2: buf[:, i:i + n] += sig[:, :n] * gain; return
    g = gain * 1.414
    buf[0, i:i + n] += sig[:n] * g * math.sqrt((1 - pan) / 2); buf[1, i:i + n] += sig[:n] * g * math.sqrt((1 + pan) / 2)
def lp(x, fc, order=2): return sosfilt(butter(order, fc, 'low', fs=SR, output='sos'), x)
def hp(x, fc, order=2): return sosfilt(butter(order, fc, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def mx(*xs):
    n = max(len(x) for x in xs); o = np.zeros(n)
    for x in xs: o[:len(x)] += x
    return o
def at_(out, s, t, g=1.0):                    # 把 s 叠进 out 的 t 秒处
    i = int(t * SR); n = min(len(s), len(out) - i)
    if n > 0 and i >= 0: out[i:i + n] += s[:n] * g
def norm(x): return x / (np.abs(x).max() + 1e-9)
def noise(d): return rng.standard_normal(int(d * SR))
def env_ar(d, a, r):                          # 线性起音 + 指数尾
    tt = tt_(d); return np.clip(tt / max(a, 1e-4), 0, 1) * np.exp(-np.maximum(0, tt - a) / r)
def hann(d): tt = tt_(d); return np.sin(np.pi * tt / d) ** 2

# ---------------- 乐器（theory 原样） ----------------
def ping(f, dur=1.6, bright=1.0, dec=3.2):
    tt = tt_(dur)
    s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * dec) + .35 * bright * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * dec * 2.2) + .12 * bright * np.sin(2 * np.pi * f * 5.4 * tt) * np.exp(-tt * dec * 3.7)
    return s * np.clip(tt / .004, 0, 1)
def bell(f, dur=4):
    tt = tt_(dur); parts = [(1, 1, 1.2), (2.0, .5, 1.8), (2.76, .35, 2.4), (5.4, .2, 3.5), (8.9, .1, 5)]
    return sum(a * np.sin(2 * np.pi * f * p * tt + p) * np.exp(-tt * d) for p, a, d in parts) * np.clip(tt / .003, 0, 1)
def metal(f0, dur=1.6, dec=4.0, parts=(1, 2.32, 4.25, 6.63, 9.38)):
    tt = tt_(dur); s = sum(np.sin(2 * np.pi * f0 * p * tt + p) * np.exp(-tt * dec * (1 + .5 * k)) / (1 + k) for k, p in enumerate(parts))
    return s * np.clip(tt / .002, 0, 1)
def thump(f0=95, f1=40, dur=2.6, noise_amt=.25):
    tt = tt_(dur); f = f1 + (f0 - f1) * np.exp(-tt * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.5) * np.clip(tt / .003, 0, 1)
    return s + lp(rng.standard_normal(len(tt)) * np.exp(-tt * 18) * noise_amt, 1500)
def whoosh(dur, rise=True, lo=300, hi=5000):
    tt = tt_(dur); n = rng.standard_normal(len(tt)); out = np.zeros(len(tt)); seg = 2048
    for s0 in range(0, len(tt), seg):
        u = s0 / len(tt); u = u if rise else 1 - u; fc = lo * (hi / lo) ** u
        blk = n[s0:s0 + seg]; B = np.fft.rfft(blk); fb = np.fft.rfftfreq(len(blk), 1 / SR)
        B *= np.exp(-((np.log(fb + 1) - np.log(fc)) ** 2) / .5); out[s0:s0 + seg] = np.fft.irfft(B, len(blk))
    e = (tt / dur) ** 2.2 if rise else np.exp(-tt / dur * 4)
    return norm(out) * e
def crack(dur=.9):
    tt = tt_(dur); n = np.tanh(lp(rng.standard_normal(len(tt)), 6000) * 3)
    f = 900 * np.exp(-tt * 5) + 90
    return (n * np.exp(-tt * 9) * .7 + np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.exp(-tt * 4) * .5) * np.clip(tt / .002, 0, 1)
def tick(f=1800, dur=.06, harsh=0.0):
    tt = tt_(dur); s = np.sin(2 * np.pi * f * tt) * np.exp(-tt * 70)
    if harsh: s = np.tanh(s * (1 + 6 * harsh)) + harsh * hp(rng.standard_normal(len(tt)), 3000) * np.exp(-tt * 120) * .5
    return s
def shimmer(dur, f0=2000, f1=6000, dens=60):
    out = np.zeros(int(dur * SR))
    for _ in range(int(dur * dens)):
        at = rng.uniform(0, dur); s = ping(rng.uniform(f0, f1), .4, .2, 9)
        i = int(at * SR); n = min(len(s), len(out) - i); out[i:i + n] += s[:n] * rng.uniform(.3, 1) * (1 - at / dur) ** .5
    return out
def pluck(f, dur=1.5, damp=.996):   # Karplus–Strong
    n = int(SR / f); buf = rng.uniform(-1, 1, n); out = np.zeros(int(dur * SR))
    for i in range(len(out)):
        out[i] = buf[i % n]; buf[i % n] = damp * .5 * (buf[i % n] + buf[(i + 1) % n])
    return out
def glide(f0, f1, dur, shape=np.sin):
    tt = tt_(dur); f = f0 * (f1 / f0) ** (tt / dur); return shape(2 * np.pi * np.cumsum(f) / SR)

# ---------------- 纸张世界的小零件（新增） ----------------
def paper(d, lo=1200, hi=7000, grain=0.0):    # 纸面摩擦：带通噪声，grain>0 时加颗粒感
    n = bp(noise(d), lo, hi)
    if grain: n *= 1 + grain * np.interp(tt_(d), np.linspace(0, d, int(d * 60) + 2), rng.uniform(-1, 1, int(d * 60) + 2))
    return n
def slide(d=.34):                              # 纸片滑入：很轻的 whoosh，先快后慢
    tt = tt_(d); e = np.clip(tt / (d * .35), 0, 1) ** 1.5 * np.exp(-np.maximum(0, tt - d * .35) / (d * .25))
    return norm(mx(paper(d, 900, 6000, .4) * e, whoosh(d, False, 500, 4000) * .5)) * .7
def scrape(d, lo, hi, rate=0):                 # 刮擦（尺子 / 托盘）：低通的粗噪声 + 摩擦颤动
    tt = tt_(d); n = bp(noise(d), lo, hi)
    if rate: n *= 1 + .5 * np.sin(2 * np.pi * rate * tt + rng.uniform(0, 6))
    return n * np.sin(np.pi * np.clip(tt / d, 0, 1)) ** .8
def wood(f=520, d=.12):                        # 木块：短、钝
    tt = tt_(d); return (np.sin(2 * np.pi * f * tt) + .4 * np.sin(2 * np.pi * f * 2.3 * tt)) * np.exp(-tt * 45) * np.clip(tt / .001, 0, 1)
def softpluck(f, d=.45):                       # 气泡弹出：软 pluck（KS 弦低通）+ 一点气声
    s = lp(pluck(f, d, .993), 2600) * np.exp(-tt_(d) * 5)
    return norm(mx(s, ping(f * 2, .12, .1, 30) * .25, lp(noise(.03), 1800) * np.exp(-tt_(.03) * 120) * .2)) * .8
def stroke(d):                                 # 铅笔一笔：高频沙沙，颗粒 + 起落
    tt = tt_(d); g = np.interp(tt, np.linspace(0, d, 12), rng.uniform(.4, 1, 12))
    return hp(bp(noise(d), 2500, 9000), 1800) * g * np.sin(np.pi * tt / d) ** .6

# ---------------- 音效表 ----------------
def fx(e):
    k, d = e['k'], e.get('d', 1.0)
    if k == 'slide': return slide()
    if k == 'chiphum':                         # 芯片通电：短嗡，往上一扬就收
        tt = tt_(d + .15); f = 90 * (2.2 ** np.clip(tt / d, 0, 1))
        hum = np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR)) * (1 + .25 * np.sin(2 * np.pi * 50 * tt))
        e_ = np.clip(tt / d, 0, 1) ** 1.2 * np.clip((d + .15 - tt) / .15, 0, 1)
        return lp(hum, 1800) * e_ * .55 + hp(noise(d + .15), 4000) * e_ ** 3 * .08
    if k == 'ping':
        return ping(e.get('f', 1320), 1.6, .25, 3.5) * .6 if e.get('soft') else ping(e.get('f', 1320), 2.2, .8, 2.4) * .8
    if k == 'swish': return np.concatenate([whoosh(.18, True, 800, 7000), whoosh(.22, False, 800, 7000)]) * .7
    if k == 'watch':                           # 秒表“嗒”：一下机械按键（双瞬态）
        return mx(tick(3000, .03, .7) * .6, np.concatenate([np.zeros(int(.018 * SR)), tick(1900, .04, .4) * .5]), wood(900, .06) * .3)
    if k == 'ruler': return mx(scrape(.55, 600, 3500, 30) * .5, slide(.5) * .4)
    if k == 'wrong':                           # ✓ 翻成 ✗：低闷的“嗡”
        tt = tt_(.55); s = (np.sin(2 * np.pi * 98 * tt) + .5 * np.sin(2 * np.pi * 147 * tt + 1) + .25 * np.sin(2 * np.pi * 104 * tt))
        return lp(s, 600) * np.clip(tt / .015, 0, 1) * np.exp(-tt * 5) * .7
    if k == 'zoom': return mx(whoosh(d, True, 200, 5000) * .7, glide(220, 660, d) * (tt_(d) / d) ** 2.5 * .08) * np.clip((d - tt_(d)) / .08, 0, 1)
    if k == 'soil':                            # 泥土氛围：低通棕噪声，极轻，首尾 1.5 秒渐变
        tt = tt_(d); n = np.cumsum(noise(d)); n = hp(n - np.convolve(n, np.ones(4800) / 4800, 'same'), 40)
        n = lp(norm(n), 420, 4) + .04 * lp(bp(noise(d), 1500, 4000), 3000) * (np.interp(tt, np.linspace(0, d, int(d * 3)), rng.uniform(0, 1, int(d * 3))) > .85)
        return norm(n) * np.clip(tt / 1.5, 0, 1) * np.clip((d - tt) / 1.5, 0, 1) * .5
    if k == 'bubble': return softpluck(e.get('f', 660))
    if k == 'boing':                           # 滑稽的上滑音（带颤音）
        tt = tt_(.5); f = 260 * (3.2 ** (tt / .5)) * (1 + .03 * np.sin(2 * np.pi * 9 * tt))
        return lp(np.tanh(1.5 * np.sin(2 * np.pi * np.cumsum(f) / SR)), 2500) * np.clip(tt / .01, 0, 1) * np.clip((.5 - tt) / .15, 0, 1) * .5
    if k == 'toss': return np.concatenate([whoosh(.25, True, 400, 5000), whoosh(.4, False, 400, 5000)]) * .7
    if k == 'land': return mx(thump(170, 80, .35, .3) * .6, lp(noise(.08), 2500) * np.exp(-tt_(.08) * 60) * .4)
    if k == 'tick': return tick(e.get('f', 2400), .05) * .7
    if k == 'fly': return mx(whoosh(d * .45, True, 300, 5500), np.concatenate([np.zeros(int(d * .45 * SR)), whoosh(d * .55, False, 300, 5500)])) * .65
    if k == 'pop': return mx(ping(e.get('f', 1100), .25, .3, 18) * .6, tick(700, .04) * .5)
    if k == 'tape':                            # 胶带拉开：撕拉声（带通噪声 + 急促颗粒，尾部渐弱）
        d = .55; tt = tt_(d); gr = (rng.uniform(0, 1, len(tt)) < .02) * rng.uniform(.3, 1, len(tt))
        body = bp(noise(d), 1500, 7000) * (1 + .7 * np.sin(2 * np.pi * 38 * tt)) + hp(gr, 2000) * 3
        return norm(body) * np.clip(tt / .03, 0, 1) * np.exp(-tt * 3.5) * .6
    if k == 'alarm':                           # 警示灯脉冲：柔和的两音下滑（不刺耳）
        tt = tt_(.42); f = np.where(tt < .21, 880, 698)
        s = lp(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * .5 + np.sin(2 * np.pi * np.cumsum(f) / SR) * .5, 1800)
        return s * np.clip(tt / .02, 0, 1) * np.clip((.42 - tt) / .08, 0, 1) * .45
    if k == 'thump': return mx(thump(95, 40, 1.2, .35) * .9, lp(paper(.06, 400, 5000), 4000) * np.exp(-tt_(.06) * 60) * .5)
    if k == 'phone':                           # 老式电话铃：两声短促的铃（20 Hz 击锤颤动）
        out = np.zeros(int(1.2 * SR))
        for s0 in (0, .5):
            tt = tt_(.38); b = metal(2100, .38, 3, (1, 1.48, 2.6, 3.9)) + metal(2380, .38, 3, (1, 1.5, 2.7))
            at_(out, b * (.55 + .45 * (np.sin(2 * np.pi * 20 * tt) > 0)) * np.clip((.38 - tt) / .06, 0, 1), s0)
        return lp(out, 6000) * .45
    if k == 'dull': return mx(wood(330, .18) * .8, lp(noise(.05), 900) * np.exp(-tt_(.05) * 80) * .3)
    if k == 'tray':                            # 托盘滑动：低沉刮擦，最后轻轻一顿
        return np.concatenate([mx(scrape(d, 200, 1600, 18) * .6, lp(noise(d), 300) * hann(d) * .4), wood(260, .14) * .4])
    if k == 'flutter':                         # 纸片飘落：忽大忽小的纸面沙沙
        tt = tt_(d); am = np.abs(np.sin(2 * np.pi * 5.5 * tt + 2 * np.sin(2 * np.pi * 1.3 * tt))) ** 2
        return paper(d, 1000, 6000) * am * hann(d) ** .5 * .5
    if k == 'pencil':                          # 逐笔写字：每个字一笔沙沙
        ts, st = e['ts'], e['step']; out = np.zeros(int((ts[-1] + st + .3) * SR))
        for t0 in ts:
            n = rng.integers(1, 3)
            for j in range(n):
                dd = st * rng.uniform(.3, .55); at_(out, stroke(dd), t0 + j * st * .45, rng.uniform(.6, 1))
        return out * .5
    if k == 'redpen':                          # 红笔划掉：短促的“刷”
        tt = tt_(.28); return bp(noise(.28), 1200, 6000) * np.clip(tt / .05, 0, 1) * np.exp(-np.maximum(0, tt - .05) * 14) * .8
    if k == 'stamp': return mx(thump(140, 60, .8, .6) * .9, hp(crack(.25), 800) * .4)
    if k == 'shimmer': return shimmer(d, 3000, 8000, 34) * .6
    if k == 'clack':                           # 翻牌数字：塑料片打下来
        return mx(tick(1300, .05, .8) * .6, lp(noise(.03), 3500) * np.exp(-tt_(.03) * 150) * .5, wood(700, .06) * .4)
    if k == 'coin':
        s = np.zeros(int(1.2 * SR)); a = metal(2650, 1.1, 6); b = metal(3950, 1.1, 5)
        s[:len(a)] += a; o = int(.07 * SR); s[o:o + len(b)] += b[:len(s) - o]; return s * .5
    if k == 'shrink': return mx(whoosh(d, False, 600, 6000) * .6, glide(700, 240, d) * np.exp(-tt_(d) * 3) * .1)
    if k == 'star': return ping(hz(e['f']), 1.2, .35, 3.8) * .6
    if k == 'click': return mx(tick(3200, .02, .5) * .6, tick(1400, .03) * .4)
    if k == 'wobble':                          # 问号晃动：轻颤的软音
        tt = tt_(.6); f = 420 * (1 + .06 * np.sin(2 * np.pi * 7 * tt))
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.clip(tt / .03, 0, 1) * np.exp(-tt * 4.5) * .35
    if k == 'sticky': return mx(lp(noise(.05), 2500) * np.exp(-tt_(.05) * 70) * .5, thump(200, 110, .2, .1) * .4, np.concatenate([np.zeros(int(.04 * SR)), paper(.12, 1500, 6000) * np.exp(-tt_(.12) * 30) * .3]))
    if k == 'patter':                          # 碎步：雨点一样的轻 tick
        out = np.zeros(int((d + .2) * SR))
        for _ in range(int(d * 34)):
            t0 = rng.uniform(0, d); at_(out, tick(rng.uniform(2600, 4200), .02) * rng.uniform(.2, .6) * math.sin(math.pi * t0 / d) ** .5, t0)
        return out
    if k == 'roll':                            # 数字滚动：密集 tick，逐渐减速
        out = np.zeros(int((d + .2) * SR)); tc = 0.0
        while tc < d:
            at_(out, tick(rng.uniform(2800, 3400), .015) * .5, tc); u = tc / d; tc += .028 + .2 * u ** 2.2
        return out
    if k == 'creak':                           # 天平摇摆：木头吱呀两下
        out = np.zeros(int((d + .3) * SR)); half = d / 2
        for j, f0 in enumerate((150, 125)):
            tt = tt_(half); jit = 1 + .08 * np.interp(tt, np.linspace(0, half, 30), rng.standard_normal(30))
            f = f0 * (1 + .25 * np.sin(np.pi * tt / half)) * jit
            s = bp(np.tanh(3 * np.sin(2 * np.pi * np.cumsum(f) / SR)), 300, 2500) * hann(half)
            at_(out, s, j * half)
        return out * .35
    if k == 'clunk': return mx(thump(130, 60, .7, .35) * .8, wood(420, .12) * .6)
    if k == 'impact':                          # 金句：低沉有分量，不炸
        return mx(thump(70, 32, 2.2, .3) * .9, whoosh(1.2, False, 120, 1500) * .2, lp(bell(196, 2.2), 1200) * .12)
    if k == 'error':
        tt = tt_(.32); sq = np.sign(np.sin(2 * np.pi * 220 * tt)) * .5 + np.sign(np.sin(2 * np.pi * 233 * tt)) * .5
        return lp(sq, 2500) * np.exp(-tt * 6) * .35
    if k == 'drop':                            # 纸片掉下来落桌
        f = fx({'k': 'flutter', 'd': .45}); return mx(f * .7, np.concatenate([np.zeros(int(.42 * SR)), mx(thump(180, 90, .3, .25) * .5, lp(noise(.05), 3000) * np.exp(-tt_(.05) * 70) * .4)]))
    if k == 'tension':                         # 提线绷紧：一根弦被慢慢拉高
        tt = tt_(d); f = 196 * (1.5 ** (tt / d))
        s = sum(np.sin(2 * np.pi * np.cumsum(f * k_) / SR) / k_ ** 1.3 for k_ in range(1, 7)) * (1 + .004 * np.sin(2 * np.pi * 5 * tt))
        return lp(s, 2400) * np.clip(tt / (d * .6), 0, 1) ** 1.5 * np.clip((d - tt) / .25, 0, 1) * .3
    if k == 'count':                           # 1 → n：逐个 tick，越来越快
        n = e.get('n', 25); out = np.zeros(int((d + .2) * SR))
        u = np.linspace(0, 1, n) ** 0.62          # 前慢后快
        for j, x in enumerate(u): at_(out, tick(2000 + 40 * j, .035, .2) * (.45 + .25 * j / n), x * d)
        return out
    if k == 'deal':                            # 一排卡片落下：一串纸片“啪”
        out = np.zeros(int((d + .3) * SR)); n = 10
        for j in range(n): at_(out, mx(lp(noise(.04), 4000) * np.exp(-tt_(.04) * 90), thump(240, 140, .12, .05) * .4) * rng.uniform(.5, .8), j * d / n)
        return out * .7
    if k == 'snap':
        tt = tt_(.35); return mx(hp(rng.standard_normal(len(tt)), 2000) * np.exp(-tt * 40) * .6, pluck(rng.uniform(180, 260), .35, .985) * .5)
    if k == 'bell': return bell(e.get('f', 784), 3.2) * .5
    raise ValueError(k)

for e in EV:
    add(sfx, fx(e), e['t'], e.get('g', 1.0), e.get('pan', 0.0))

# ---------------- 空间感 + 输出（theory 原样：1.6 秒小房间，18% 湿） ----------------
def reverb(x, sec=2.2, wet=.22):
    n = int(sec * SR); ir = rng.standard_normal((2, n)) * np.exp(-np.arange(n) / SR * 3.2)
    ir[:, :int(.01 * SR)] *= np.linspace(0, 1, int(.01 * SR)); ir /= np.sqrt((ir ** 2).sum(axis=1, keepdims=True))
    return x * (1 - wet) + np.stack([fftconvolve(x[c], ir[c])[:x.shape[1]] for c in range(2)]) * wet
sfx = reverb(sfx, 1.6, .18)
sig = sfx[:, :int(round(DUR * SR))]
pk = float(np.abs(sig).max())
if pk > .98: sig = sig / pk * .98
w = wave.open(os.path.join(HERE, 'sfx.wav'), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((sig.T * 32767).astype(np.int16).tobytes()); w.close()
print(f'sfx.wav  {len(EV)} 个事件  {sig.shape[1] / SR:.2f}s  peak {pk:.3f}')
