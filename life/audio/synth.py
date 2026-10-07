# 《生命之美》配乐与音效：全部由代码合成，与画面共用 render/cache/timeline.json
# 用法：python synth.py <timeline.json> <输出.wav>
# 依赖：numpy、scipy
import json, sys, math
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
TL = json.load(open(sys.argv[1], encoding='utf-8'))
OUT = sys.argv[2]
DUR = TL['OUT_DURATION']
WARP = TL['WARP']

def map_time(time, input_column):
    output_column = 1 - input_column
    for start, end in zip(WARP, WARP[1:]):
        if time <= end[input_column]:
            progress = (time - start[input_column]) / (end[input_column] - start[input_column])
            return start[output_column] + progress * (end[output_column] - start[output_column])
    last = WARP[-1]
    return time + last[output_column] - last[input_column]

def to_out(source_time): return map_time(source_time, 0)
def to_src(output_time): return map_time(output_time, 1)

N = int(DUR * SR) + SR * 4
rng = np.random.default_rng(2026)

def mtof(m): return 440.0 * 2 ** ((m - 69) / 12)
def zeros(): return np.zeros(N, np.float32)
def place(buf, t, sig, gain=1.0, out_time=False):
    if not out_time: t = to_out(t)
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
    duration = to_out(a + d) - to_out(a)
    for m in CH[name]:
        place(pad, a, pad_note(m, duration, a=1.6 if duration > 3 else 0.8, r=2.5), vol * 0.07)
    place(pad, a, pad_note(CH[name][0] - 12, duration, a=2.0, r=2.5, bright=0.2), vol * 0.06)
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
    output_start, output_end = to_out(a), to_out(b)
    output_time = output_start
    while output_time < output_end:
        ch, vol = chord_at(to_src(output_time))
        if ch:
            notes = [n + 12 for n in ch] + [ch[1] + 24]
            pat = [0, 2, 1, 3, 2, 4, 1, 2]
            m = notes[pat[k % len(pat)] % len(notes)]
            g = 0.05 * vol * (1.0 if step >= 0.5 else 0.7)
            if a == 301.0: g *= 0.6 + 0.8 * (output_time - output_start) / (output_end - output_start)
            place(arp, output_time, pluck(m, 1.4 if step >= 0.5 else 0.7), g, out_time=True)
        output_time += step; k += 1

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
    place(risers, a, riser(to_out(b) - to_out(a)), 0.09)

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

# ———————————— 真实素材质感层（Mixkit 免费授权，叠在合成音色上，不替换）————————————
import os, warnings
from scipy.signal import resample_poly
SAMP = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'samples')
def load(name, semis=0.0):
    """读 WAV → 峰值归一的 float32（立体声 2×n），重采样到 48k；semis 为移调半音数（变速移调）"""
    from scipy.io import wavfile
    with warnings.catch_warnings():
        warnings.simplefilter('ignore')
        sr, x = wavfile.read(os.path.join(SAMP, name + '.wav'))
    x = x.astype(np.float32)
    if x.ndim == 1: x = np.stack([x, x], 1)
    x = x.T / (np.abs(x).max() + 1e-9)
    up, down = 160, 147                       # 44.1k → 48k
    if semis:                                 # 移调：再按频率比重采样
        r = 2 ** (semis / 12)
        up, down = int(round(160 * 1000)), int(round(147 * 1000 * r))
        g = math.gcd(up, down); up, down = up // g, down // g
    return np.stack([resample_poly(c, up, down) for c in x]).astype(np.float32)
def fades(x, a=0.01, r=0.05):
    n = x.shape[-1]; e = np.ones(n, np.float32)
    na, nr = min(n, int(a * SR)), min(n, int(r * SR))
    if na: e[:na] = np.linspace(0, 1, na)
    if nr: e[-nr:] *= np.linspace(1, 0, nr)
    return x * e
real = np.zeros((2, N), np.float32)        # 立体声质感总线
def place_st(t, sig, gain, out_time=False):
    if not out_time: t = to_out(t)
    i = int(t * SR)
    if i < 0: sig = sig[:, -i:]; i = 0
    if i >= N: return
    j = min(N, i + sig.shape[1]); real[:, i:j] += sig[:, : j - i] * gain
def loop_to(x, n, xf=2.0):
    """交叉淡化循环到 n 个采样点"""
    k = int(xf * SR); out = np.zeros((2, n), np.float32); pos = 0; seg = x.shape[1] - k
    ramp = np.linspace(0, 1, k, dtype=np.float32)
    while pos < n:
        y = x.copy(); y[:, :k] *= ramp if pos else 1; y[:, -k:] *= ramp[::-1]
        j = min(n, pos + y.shape[1]); out[:, pos:j] += y[:, : j - pos]; pos += seg
    return out

# 心跳：从慢心跳录音里切一拍"扑-通"（3.25–4.45 秒），起音对齐每个拍点
hb = load('heartbeat_slow'); hb1 = fades(hb[:, int(3.25 * SR):int(4.45 * SR)], 0.005, 0.25)
hb1 = np.stack([hp(c, 30) for c in hb1])
for b in TL['HEARTBEATS']:
    g = 0.5 if b < 344 else 0.5 * max(0.0, 1 - (b - 344) / 8)
    place_st(b - 0.05, hb1, 0.32 * g / 0.5)
# 重击：深沉的真实冲击，起音（0.08 秒）对齐
imp = load('impact_deep')
for t, sv in TL['HITS']:
    place_st(to_out(t) - 0.08, imp, 0.42 * sv, out_time=True)
# 蓄力：风感 swoosh 的能量峰（1.17 秒）对齐到蓄力终点
sw = fades(load('swoosh_windy'), 0.3, 0.6)
for a, b in TL['RISERS']:
    place_st(to_out(b) - 1.17, sw, 0.22, out_time=True)
# 晶莹泛音：关键铃音事件叠水晶铃，按事件轮换移调
CH_SEMI = [0, 2, 5, 7, -3, 4]
chimes = {s_: fades(load('chime_crystal', s_), 0.002, 0.4) for s_ in CH_SEMI}
ci = 0
for e in TL['EVENTS']:
    if e['type'] in ('mark', 'letter', 'bloom', 'emblem', 'untwist', 'gen'):
        place_st(e['t'], chimes[CH_SEMI[ci % len(CH_SEMI)]], 0.05 if e['type'] != 'gen' else 0.03); ci += 1
# 水流：铺在"物质流过漩涡"段落（源时间 222.5–270）
wt0, wt1 = to_out(222.5), to_out(270.0)
wf = loop_to(load('water_flow'), int((wt1 - wt0) * SR))
wf = np.stack([lp(c, 2600) for c in wf]); wf = fades(wf, 4.0, 4.0)
place_st(wt0, wf, 0.16, out_time=True)
# 气泡：内共生段稀疏点缀，降调更"有机"
rb = np.random.default_rng(31)
bubs = [fades(load('bubble_liquid', sm), 0.002, 0.2) for sm in (-4, -6, -8)]
for k in range(16):
    place_st(268.5 + k * 1.95 + rb.random() * 0.9, bubs[k % 3], 0.05 + 0.04 * rb.random())
# 底层：低沉风声嗡鸣铺全片，片头 3 秒后进，图灵与细胞段稍高
dr = loop_to(load('drone_wind'), N, 3.0)
dr = np.stack([lp(c, 1800) for c in dr])
denv = np.ones(N, np.float32) * 0.07
tt_ = np.arange(N) / SR
src_ = np.interp(tt_, [to_out(x_) for x_ in (0, 3, 6, 200, 204, 226, 268, 272, 300, 350.4, 352.8)],
                 [0, 0, 1, 1, 1.6, 1.0, 1.0, 1.5, 1.0, 1.0, 0])
real += dr * (denv * src_)

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
fx = fx + real + verb(real, 0.18)
# 重击时让音乐微微让位（侧链）
duck = np.ones(N, np.float32)
for t, s in TL['HITS']:
    i = int(to_out(t) * SR); n = int(1.2 * SR)
    seg = 1 - 0.35 * s * np.exp(-np.arange(n) / SR * 3)
    duck[i:i + n] = np.minimum(duck[i:i + n], seg[: len(duck[i:i + n])])
mix = music * duck + fx
# 开头淡入、结尾淡出
fade = np.ones(N, np.float32)
fade[: int(0.8 * SR)] = np.linspace(0, 1, int(0.8 * SR))
e0, e1 = int(to_out(350.4) * SR), int(to_out(352.8) * SR)
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
