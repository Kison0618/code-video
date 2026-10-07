# 《生命之美》配乐与音效：全部由代码合成，与画面共用 render/cache/timeline.json
# 用法：python synth.py <timeline.json> <输出.wav>
# 依赖：numpy、scipy
import json, sys, math
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
TL = json.load(open(sys.argv[1], encoding='utf-8'))
OUT = sys.argv[2]
DUR = TL['DURATION']
N = int(DUR * SR) + SR * 4
rng = np.random.default_rng(2026)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def zeros(): return np.zeros(N, np.float32)
def place(buf, t, sig, gain=1.0):
    i = int(t * SR)
    if i >= N: return
    j = min(N, i + len(sig))
    buf[i:j] += (sig[: j - i] * gain).astype(np.float32)
def lp(x, f, order=2): return sosfilt(butter(order, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, order=2): return sosfilt(butter(order, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, order=2): return sosfilt(butter(order, [lo, hi], 'band', fs=SR, output='sos'), x)
def tt(d): return np.arange(int(d * SR)) / SR

# 各声部（单声道，最后再做立体声与混响）
pad, arp, bells, heart, hits, risers, water, lowfx = (zeros() for _ in range(8))

# ———————————— 乐器 ————————————
def env_adsr(n, a, r, sus=1.0):
    e = np.ones(n, np.float32) * sus
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, sus, na)
    if nr < n: e[-nr:] *= np.linspace(1, 0, nr)
    return e

def pad_note(m, dur, a=2.5, r=3.0, bright=0.5):
    """柔和的合成弦乐：三个略微走音的声部，泛音按 1/n^p 衰减"""
    x = tt(dur + r)
    f = mtof(m)
    y = np.zeros_like(x)
    p = 1.9 - bright
    for det in (-0.07, 0.0, 0.08):
        ff = f * 2 ** (det / 12)
        ph = rng.random() * 6.28
        vib = 0.0025 * np.sin(2 * np.pi * (0.18 + rng.random() * 0.1) * x)
        for h in range(1, 12):
            if ff * h > 5000: break
            y += np.sin(2 * np.pi * ff * h * x * (1 + vib) + ph * h) / h ** p
    y /= 3
    return y * env_adsr(len(x), a, r)

def pluck(m, dur=1.6, bright=0.6):
    """拨弦：衰减很快的泛音叠加"""
    x = tt(dur)
    f = mtof(m)
    y = np.zeros_like(x)
    for h in range(1, 9):
        if f * h > 7000: break
        y += np.sin(2 * np.pi * f * h * x) * np.exp(-x * (2.2 + h * (1.6 - bright))) / h
    y *= np.minimum(1, x / 0.004)
    return y

def bell(m, dur=3.0, ratio=3.5, idx=2.2, decay=1.4):
    """FM 铃音：调制指数随时间衰减，音色从亮到暖"""
    x = tt(dur)
    f = mtof(m)
    I = idx * np.exp(-x * 3.0)
    y = np.sin(2 * np.pi * f * x + I * np.sin(2 * np.pi * f * ratio * x))
    y += 0.25 * np.sin(2 * np.pi * f * 2 * x) * np.exp(-x * 4)
    return y * np.exp(-x * decay) * np.minimum(1, x / 0.003)

def thump(f0=58, f1=38, dur=0.45, decay=9.0):
    x = tt(dur)
    f = f1 + (f0 - f1) * np.exp(-x * 18)
    ph = 2 * np.pi * np.cumsum(f) / SR
    y = np.sin(ph) * np.exp(-x * decay)
    # 二、三次泛音（约 80–170 Hz）：手机和笔记本扬声器放不出 40 Hz，靠它们让心跳"听得见"
    body = (0.45 * np.sin(2 * ph) + 0.22 * np.sin(3 * ph)) * np.exp(-x * decay * 1.5)
    click = lp(rng.standard_normal(len(x)) * np.exp(-x * 120), 1200)
    return 0.85 * y + body + 0.3 * click

def boom(strength=1.0):
    x = tt(3.5)
    f = 30 + 55 * np.exp(-x * 5)
    y = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.6)
    body = np.sin(2 * np.pi * 110 * x) * np.exp(-x * 14) * 0.35
    nz = lp(rng.standard_normal(len(x)), 320) * np.exp(-x * 4.5) * 0.6
    tail = lp(rng.standard_normal(len(x)), 1800) * np.exp(-x * 2.2) * 0.12
    return (y + body + nz + tail) * strength

def riser(dur):
    """蓄力：几条带通噪声按时间交叉淡化，中心频率逐渐升高（最高约 4.5 kHz，避免刺耳）"""
    x = tt(dur)
    u = x / dur
    nz = rng.standard_normal(len(x))
    centers = [220, 420, 800, 1500, 2600, 4500]
    target = np.log(220) + (np.log(4500) - np.log(220)) * u ** 1.6
    out = np.zeros_like(x)
    for c in centers:
        w = np.exp(-((target - np.log(c)) / 0.45) ** 2)
        out += bp(nz, c * 0.75, c * 1.3) * w
    tone = np.sin(2 * np.pi * np.cumsum(110 * 2 ** (2 * u)) / SR) * 0.35
    return (out * 0.6 + tone) * u ** 2.2

# ———————————— 和声进行 ————————————
D = 50  # D3
CH = {
    'Dm9': [50, 53, 57, 64], 'Bbmaj7': [46, 50, 53, 57], 'F': [53, 57, 60, 65], 'C': [48, 52, 55, 62],
    'Dmaj9': [50, 54, 57, 61, 64], 'Dmaj': [50, 54, 57, 62, 66], 'Bm7': [47, 50, 54, 57], 'Gmaj7': [43, 47, 50, 54],
    'A': [45, 49, 52, 57], 'Fadd9': [53, 57, 60, 67], 'Gmaj7#11': [43, 47, 50, 54, 61], 'Dm': [50, 53, 57, 62],
}
def cycle(names, t0, t1, step):
    out, t, i = [], t0, 0
    while t < t1 - 0.01:
        d = min(step, t1 - t)
        out.append((t, d, names[i % len(names)])); t += d; i += 1
    return out
SECTIONS = []  # (起点, 时长, 和弦名, 音量)
def sec(lst, vol): SECTIONS.extend((a, b, c, vol) for a, b, c in lst)
sec([(0.5, 23.0, 'Dm9')], 0.55)
sec([(23.5, 11.0, 'Dmaj9')], 0.8)
sec(cycle(['Dm9', 'Bbmaj7', 'F', 'C'], 34.5, 87.0, 4.0), 0.6)
sec([(87.0, 10.0, 'Dmaj')], 0.85)
sec(cycle(['Dm9', 'Bbmaj7', 'F', 'C'], 97.0, 143.5, 4.0), 0.6)
sec([(151.0, 6.5, 'Fadd9'), (157.5, 6.0, 'Dmaj9')], 0.8)
sec(cycle(['Dmaj9', 'Bm7', 'Gmaj7', 'A'], 163.5, 200.0, 4.0), 0.55)
sec(cycle(['Dm', 'Bbmaj7'], 200.0, 214.5, 7.25), 0.6)
sec(cycle(['Bbmaj7', 'F'], 214.5, 226.0, 5.75), 0.55)
sec(cycle(['Dmaj9', 'Gmaj7#11'], 226.0, 258.0, 8.0), 0.6)
sec([(258.0, 8.0, 'Bm7')], 0.45)
sec(cycle(['Dm9', 'F', 'C', 'Bbmaj7'], 266.0, 301.0, 4.375), 0.6)
sec(cycle(['Bbmaj7', 'C', 'Dm9', 'F', 'C'], 301.0, 315.0, 2.8), 0.75)
sec([(315.0, 3.5, 'Bbmaj7'), (318.5, 3.5, 'C')], 0.85)
sec([(322.0, 8.0, 'Dmaj'), (330.0, 8.0, 'Dmaj9')], 1.0)
sec([(344.0, 8.5, 'Dmaj9')], 0.9)
for a, d, name, vol in SECTIONS:
    for m in CH[name]:
        place(pad, a, pad_note(m, d, a=1.6 if d > 3 else 0.8, r=2.5), vol * 0.07)
    place(pad, a, pad_note(CH[name][0] - 12, d, a=2.0, r=2.5, bright=0.2), vol * 0.06)
# 第 322 秒的高潮再加一层高八度
for m in CH['Dmaj']:
    place(pad, 322.0, pad_note(m + 12, 8.0, a=0.4, r=4.0, bright=0.7), 0.035)
# "还没写的下一段"：开放五度，悬而未决
for m in (62, 69, 74):
    place(pad, 338.0, pad_note(m, 6.0, a=1.5, r=2.5, bright=0.3), 0.05)
# "第一页"：冻结，只剩一个纯音
place(pad, 143.6, np.sin(2 * np.pi * mtof(69) * tt(7.6)) * env_adsr(int(7.6 * SR), 1.0, 1.2), 0.05)

# ———————————— 琶音（时间的脉搏）————————————
def chord_at(t):
    for a, d, name, vol in SECTIONS:
        if a <= t < a + d: return CH[name], vol
    return None, 0
ARP_RANGES = [(34.5, 86.5, 0.5), (97.0, 143.0, 0.25), (226.0, 257.5, 0.5), (266.0, 300.5, 0.5), (301.0, 321.8, 0.25)]
for a, b, step in ARP_RANGES:
    k = 0
    t = a
    while t < b:
        ch, vol = chord_at(t)
        if ch:
            notes = [n + 12 for n in ch] + [ch[1] + 24]
            pat = [0, 2, 1, 3, 2, 4, 1, 2]
            m = notes[pat[k % len(pat)] % len(notes)]
            g = 0.05 * vol * (1.0 if step >= 0.5 else 0.7)
            if a == 301.0: g *= 0.6 + 0.8 * (t - a) / (b - a)   # 高潮前逐渐加强
            place(arp, t, pluck(m, 1.4 if step >= 0.5 else 0.7), g)
        t += step; k += 1

# ———————————— 画面事件 → 音效 ————————————
PENTA = [62, 65, 67, 69, 72, 74, 77, 79, 81, 84]  # D 小调五声
for e in TL['EVENTS']:
    t, ty = e['t'], e['type']
    if ty == 'gen':   place(bells, t, bell(PENTA[min(9, e['g'] + 1)], 2.5, ratio=2.0, idx=1.2), 0.12)
    elif ty == 'mark': place(bells, t, bell(PENTA[[2, 3, 5, 7][int((t - 64) // 1.7) % 4]], 3.5, ratio=3.5, idx=1.6), 0.14)
    elif ty == 'out':  place(lowfx, t, pluck(rng.choice([45, 50, 53]), 1.0, bright=0.2), 0.06)
    elif ty == 'letter': place(bells, t, bell([69, 72, 74, 77][int(round((t - 104.6) / 0.7)) % 4], 3.0, ratio=2.0, idx=1.0), 0.13)
    elif ty == 'error':
        place(bells, t, bell(76, 3.5, ratio=1.41, idx=3.0), 0.14); place(bells, t, bell(77, 3.5, ratio=1.41, idx=3.0), 0.11)
    elif ty == 'mut':  place(bells, t, bell(int(rng.choice(PENTA[4:])), 1.2, ratio=3.0, idx=1.0, decay=3.0), 0.05)
    elif ty == 'bloom': place(bells, t, bell([65, 69, 72][int(round((t - 151.2) / 0.5)) % 3] + 12, 4.0, ratio=2.0, idx=1.4, decay=0.9), 0.13)
    elif ty == 'seed':
        i = int(round((t - 165.4) / (5.6 / 13)))
        place(bells, t, bell(PENTA[(i * 3) % 10], 2.2, ratio=2.0, idx=0.9, decay=1.6), 0.1)
    elif ty == 'seedfast': place(bells, t, pluck(PENTA[int(rng.integers(3, 10))] + 12, 0.6, bright=0.8), 0.035)
    elif ty == 'twist':
        for m in (56, 57, 63): place(pad, t, pad_note(m, 6.0, a=1.2, r=1.0, bright=0.6), 0.05)
    elif ty == 'untwist': place(bells, t, bell(74, 4.0, ratio=2.0, idx=1.2, decay=0.8), 0.13)
    elif ty == 'spiral':
        base = [62, 66, 69, 73, 76, 78, 81, 85] if t < 194 else [64, 69, 71, 74, 78, 81, 83, 86]
        for k, m in enumerate(base): place(bells, t + k * 0.07, pluck(m, 1.6, bright=0.7), 0.05)
    elif ty == 'touch': place(lowfx, t, thump(90, 60, 0.4, 12), 0.25)
    elif ty == 'ignite':
        for m in (62, 66, 69, 74): place(pad, t, pad_note(m, 3.0, a=0.6, r=2.5, bright=0.6), 0.05)
        place(bells, t, bell(81, 4.0, ratio=2.0, idx=1.0, decay=0.8), 0.1)
    elif ty == 'braid':
        for k in range(10):
            place(bells, t + k * 0.5, pluck([69, 74][k % 2], 1.2), 0.04)
            place(bells, t + k * 0.5 + 0.25, pluck([66, 71][k % 2], 1.2), 0.035)
    elif ty == 'beatflash': place(bells, t + 0.02, bell(86, 1.4, ratio=2.0, idx=0.6, decay=3.0), 0.025)
    elif ty == 'emblem': place(bells, t, bell([74, 76, 78, 81, 83][e['i']], 4.0, ratio=2.0, idx=1.3, decay=0.9), 0.14)

# 字幕出现时的轻铃（很轻，只提示"新的一句"）
for a, b, zh, en in TL['SUBS']:
    place(bells, a, bell(86, 1.5, ratio=2.0, idx=0.4, decay=3.5), 0.018)

# 心跳
for i, b in enumerate(TL['HEARTBEATS']):
    g = 0.5
    if 157 < b < 164: g = 0.42
    if 294 < b < 302: g = 0.45
    if b > 344: g = 0.32 * max(0.0, 1 - (b - 344) / 8)
    place(heart, b, thump(), g)
    place(heart, b + 0.3, thump(52, 36, 0.4, 11), g * 0.6)

# 重击与蓄力
for t, s in TL['HITS']:
    place(hits, t, boom(s), 0.55)
    place(hits, t, pad_note(38, 2.0, a=0.01, r=2.5, bright=0.1), 0.12 * s)
for a, b in TL['RISERS']:
    place(risers, a, riser(b - a), 0.09)

# 流动段的水声（低通的粉红噪声，缓慢起伏）
def pink(n):
    w = rng.standard_normal(n)
    X = np.fft.rfft(w); f = np.arange(len(X)); f[0] = 1
    return np.fft.irfft(X / np.sqrt(f), n)
wseg = pink(int(48 * SR)); wseg /= np.abs(wseg).max()
wt = tt(48)
wseg = lp(wseg, 700) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * wt)) * env_adsr(len(wt), 4.0, 5.0)
place(water, 222.5, wseg, 0.5)
# 图灵段：两个慢慢拍频的低音（"一边反应，一边扩散"）
tx = tt(22)
turing = (np.sin(2 * np.pi * 73.4 * tx) + np.sin(2 * np.pi * 74.1 * tx)) * env_adsr(len(tx), 3.0, 4.0)
place(lowfx, 200.0, turing, 0.06)

# ———————————— 混音 ————————————
def ir(dur=3.6, decay=2.4, lpf=5200):
    x = tt(dur)
    L = lp(rng.standard_normal(len(x)), lpf) * np.exp(-x * decay)
    R = lp(rng.standard_normal(len(x)), lpf) * np.exp(-x * decay)
    L[: int(0.012 * SR)] = 0; R[: int(0.017 * SR)] = 0
    return L / np.abs(L).sum() * 30, R / np.abs(R).sum() * 30
IRL, IRR = ir()
def stereo(x, pan=0.0, width=0.0):
    l = x * math.cos((pan + 1) * math.pi / 4); r = x * math.sin((pan + 1) * math.pi / 4)
    if width > 0:
        d = int(0.011 * SR); r = np.concatenate([np.zeros(d), r[:-d]]) * (1 - width * 0.3) + r * width * 0.3
    return np.stack([l, r])
def verb(st, wet):
    return np.stack([fftconvolve(st[0], IRL)[:N], fftconvolve(st[1], IRR)[:N]]) * wet

pad_f = lp(hp(pad, 40), 6000)
arp_f = lp(arp, 5500)
bells_f = lp(bells, 7000)
music = stereo(pad_f, 0, 0.8) + stereo(arp_f, 0.15, 0.6) + stereo(bells_f, -0.1, 0.5) + stereo(lp(lowfx, 3000), 0, 0.3)
music = music + verb(music, 0.55)
fx = stereo(lp(hits, 2500), 0) + stereo(heart, 0) * 0.9 + stereo(risers, 0, 0.7) + stereo(water, 0, 0.9)
fx = fx + verb(stereo(lp(hits, 2500) + risers, 0, 0.5), 0.25)
# 重击时让音乐微微让位（侧链）
duck = np.ones(N, np.float32)
for t, s in TL['HITS']:
    i = int(t * SR); n = int(1.2 * SR)
    seg = 1 - 0.35 * s * np.exp(-np.arange(n) / SR * 3)
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[: len(duck[i:i + n])])
mix = music * duck + fx
# 开头淡入、结尾淡出
fade = np.ones(N, np.float32)
fade[: int(0.8 * SR)] = np.linspace(0, 1, int(0.8 * SR))
e0, e1 = int(350.4 * SR), int(352.8 * SR)
fade[e0:e1] = np.linspace(1, 0, e1 - e0); fade[e1:] = 0
mix = mix * fade
mix = np.stack([hp(mix[0], 28), hp(mix[1], 28)])   # 去掉听不见、只占动态余量的超低频
mix = mix[:, : int(DUR * SR)]
mix = mix / (np.abs(mix).max() + 1e-9) * 0.9
mix = np.tanh(mix * 1.15) / np.tanh(1.15)   # 柔和削波

pcm = (np.clip(mix.T, -1, 1) * 32767).astype(np.int16)
import wave
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('audio ->', OUT, f'{DUR}s')
