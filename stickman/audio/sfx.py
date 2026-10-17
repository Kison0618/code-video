# 火柴人样片的音效：全部由代码合成，按画面登记的时间表（cues.json）逐个放置
# 用法：python sfx.py <cues.json> <输出.wav>
# 依赖：numpy、scipy
#
# 原片的声音规律（见 拆解_火柴人系列.md 第 5 节）：
#   每个动作一个音效，严格对齐画面；安静本身是设计；配乐只在剧情升级时进来。
import json, sys
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve

SR = 48000
CU = json.load(open(sys.argv[1], encoding='utf-8'))
OUT = sys.argv[2]
DUR = CU['dur']
N = int((DUR + 3) * SR)
rng = np.random.default_rng(2026)

def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, hi], 'band', fs=SR, output='sos'), x)
def dec(d, k): return np.exp(-tt(d) * k)
def chirp(f0, f1, d, curve=1.0):
    t = tt(d); f = f0 + (f1 - f0) * (t / d) ** curve
    return np.sin(2 * np.pi * np.cumsum(f) / SR)
def fade(x, a=0.002, r=0.01):
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    x = x.copy(); x[:na] *= np.linspace(0, 1, na); x[-nr:] *= np.linspace(1, 0, nr); return x

dry, wet = np.zeros(N), np.zeros(N)     # wet 会送进混响
def place(t, sig, g=1.0, rev=0.15):
    i = int(t * SR)
    if i >= N or i < 0: return
    j = min(N, i + len(sig))
    dry[i:j] += sig[: j - i] * g
    wet[i:j] += sig[: j - i] * g * rev

# —————————— 单个音效 ——————————
def s_key(v):           # 键盘：极短的高频噪声 + 一点键帽的闷响
    f = 1 + (rng.random() - 0.5) * 0.3
    click = hp(noise(0.012), 2500) * dec(0.012, 420)
    body = np.sin(2 * np.pi * 190 * f * tt(0.03)) * dec(0.03, 140) * 0.5
    x = np.zeros(int(0.03 * SR)); x[:len(click)] += click; x += body
    return fade(x) * 0.22 * v
def s_enter(v): return np.concatenate([s_key(1) * 1.4, np.zeros(10)]) * v
def s_click(v):
    a = s_key(0.8); b = s_key(0.6)
    x = np.zeros(int(0.08 * SR)); x[:len(a)] += a; x[int(0.045 * SR):int(0.045 * SR) + len(b)] += b
    return x
def s_run(v):           # 运行：轻轻的上行"嘀"
    x = chirp(900, 1500, 0.07, 0.6) * dec(0.07, 40)
    return fade(x) * 0.12
def s_error(v):         # 报错：低沉的"嘟"
    t = tt(0.24)
    x = np.sign(np.sin(2 * np.pi * 116 * t)) * 0.6 + np.sin(2 * np.pi * 174 * t) * 0.5
    return fade(lp(x, 900) * dec(0.24, 12)) * 0.32
def s_pop(v):           # 文字冒出来：气泡"啵"
    return fade(chirp(380, 1300, 0.05, 0.5) * dec(0.05, 70)) * 0.3
def s_tick(v):          # 小字落地：清脆的"嗒"
    x = bp(noise(0.02), 2500, 7000) * dec(0.02, 260) + np.sin(2 * np.pi * 1700 * tt(0.02)) * dec(0.02, 300) * 0.4
    return fade(x) * 0.35 * (0.3 + 0.7 * v)
def s_laptop(v):        # 电脑砸地：塑料"咔哒"
    t = tt(0.16)
    x = bp(noise(0.16), 900, 4500) * dec(0.16, 70) * 0.8
    x += (np.sin(2 * np.pi * 620 * t) + 0.6 * np.sin(2 * np.pi * 935 * t)) * dec(0.16, 45) * 0.5
    x += np.sin(2 * np.pi * 120 * t) * dec(0.16, 30) * 0.6
    return fade(x) * 0.5 * (0.35 + 0.65 * v)
def s_thud(v):          # 人摔地上：低频闷响 + 沙沙
    t = tt(0.5)
    x = chirp(85, 42, 0.5, 0.4) * dec(0.5, 9) * 1.0
    x += lp(noise(0.5), 500) * dec(0.5, 14) * 0.6
    x += bp(noise(0.5), 1500, 5000) * dec(0.5, 22) * 0.12
    return fade(x) * 0.75 * v
def s_rustle(v):        # 衣服摩擦（起身、蹲下）
    d = 0.3; env = np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2
    return fade(bp(noise(d), 1500, 6500) * env) * 0.07 * v
def s_grab(v):
    x = np.zeros(int(0.25 * SR)); r = s_rustle(0.6)[: len(x)]; x[:len(r)] += r
    l = s_laptop(0.25); x[:len(l)] += l * 0.6
    return x
def s_whoosh(v):        # 呼：带通噪声，中心频率先升后降
    d = 0.4; n = int(d * SR); t = np.linspace(0, 1, n)
    env = np.sin(np.pi * t) ** 1.5
    x = noise(d); out = np.zeros(n); seg = 512
    for k in range(0, n, seg):
        u = k / n; fc = 350 + 2600 * np.sin(np.pi * u) ** 2
        out[k:k + seg] = bp(x[max(0, k - 2048):k + seg], fc * 0.6, min(fc * 1.6, 20000))[-len(out[k:k + seg]):]
    return fade(out * env) * 0.35 * v
def s_kick(v):          # 一脚踢中：短促的"啪"
    t = tt(0.18)
    x = lp(noise(0.18), 2500) * dec(0.18, 55) * 0.8 + chirp(150, 60, 0.18, 0.5) * dec(0.18, 22)
    return fade(x) * 0.6
def s_hit(v):           # 落地重音
    t = tt(0.9)
    x = chirp(70, 38, 0.9, 0.3) * dec(0.9, 5) + lp(noise(0.9), 1200) * dec(0.9, 9) * 0.5
    x += hp(noise(0.9), 6000) * dec(0.9, 6) * 0.15
    return fade(x) * 0.7
def s_boom(v):          # 爆炸：瞬态 + 超低频下潜 + 越来越闷的噪声 + 噼啪碎响
    d = 3.2; t = tt(d); n = len(t)
    sub = chirp(62, 26, d, 0.35) * dec(d, 1.6) * 1.1
    nz = noise(d); body = np.zeros(n); seg = 2048
    for k in range(0, n, seg):
        fc = 200 + 5200 * np.exp(-k / SR * 3.0)
        body[k:k + seg] = lp(nz[max(0, k - 4096):k + seg], fc)[-len(body[k:k + seg]):]
    body *= dec(d, 1.3) * 1.2
    crack = np.zeros(n)
    for _ in range(140):
        i = int(min(n - 400, (rng.random() ** 2) * 1.6 * SR))
        crack[i:i + 300] += hp(noise(300 / SR), 2000) * dec(300 / SR, 300) * rng.random() * (1 - i / n)
    trans = np.zeros(n); tr = hp(noise(0.03), 800) * dec(0.03, 90); trans[:len(tr)] = tr * 2
    x = sub + body + crack * 0.5 + trans
    return fade(x, 0.001, 0.2) * 0.95
def s_turtle(dur):      # turtle 画线：沙沙的笔尖声，随折线的每一折起伏
    t = tt(dur); n = len(t)
    zig = 0.5 + 0.5 * np.abs(np.sin(np.pi * (4.7 * t + 0.6 * t * t)))
    x = bp(noise(dur), 1800, 6000) * zig * 0.5 + lp(noise(dur), 300) * 0.25
    x *= np.minimum(1, t / 0.3) * np.minimum(1, (dur - t) / 0.2) * (0.6 + 0.4 * t / dur)
    return x * 0.22

# —————————— 追逐段的配乐（占位：鼓 + 贝斯 + 和弦垫，150 BPM，E 小调）——————————
def music(t0, t1, bpm):
    beat = 60 / bpm; d = t1 - t0; n = int(d * SR)
    out = np.zeros(n + SR)
    def put(tl, sig, g):
        i = int(tl * SR); j = min(len(out), i + len(sig)); out[i:j] += sig[:j - i] * g
    kick = chirp(110, 45, 0.25, 0.4) * dec(0.25, 16)
    snare = bp(noise(0.2), 1200, 8000) * dec(0.2, 22) + np.sin(2 * np.pi * 190 * tt(0.2)) * dec(0.2, 30) * 0.5
    hat = hp(noise(0.05), 7000) * dec(0.05, 90)
    bass_notes = [40, 40, 43, 40, 45, 40, 43, 47]          # E2 E2 G2 E2 A2 E2 G2 B2（8 分音符一个）
    mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
    nb = int(d / beat)
    for b in range(nb):
        tb = b * beat
        bar = b // 4
        put(tb, kick, 0.9 if b % 2 == 0 else 0.6)
        if b % 4 in (1, 3): put(tb, snare, 0.5)
        for h in range(2): put(tb + h * beat / 2, hat, 0.18 if h else 0.1)
        for h in range(2):
            m = bass_notes[(b * 2 + h) % 8]
            tn = tt(beat / 2 * 0.9); f = mtof(m)
            saw = 2 * ((f * tn) % 1) - 1
            put(tb + h * beat / 2, lp(saw, 700) * dec(beat / 2 * 0.9, 6), 0.35)
    # 和弦垫：Em - C - G - D，每 2 小节换一次
    chords = [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]]
    bar_len = beat * 4
    for k in range(int(d / (bar_len * 2)) + 1):
        tc = k * bar_len * 2
        if tc > d - 0.5: break
        L = min(bar_len * 2, d - tc); tn = tt(L)
        sig = sum(np.sin(2 * np.pi * mtof(m) * tn) + 0.3 * np.sin(4 * np.pi * mtof(m) * tn) for m in chords[k % 4])
        env = np.minimum(1, tn / 0.3) * np.minimum(1, (L - tn) / 0.3 + 0.01)
        put(tc, lp(sig, 2500) * env, 0.06)
    out = out[:n]
    out *= np.minimum(1, np.arange(n) / (0.15 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.6 * SR))
    return out

FX = {'key': s_key, 'enter': s_enter, 'click': s_click, 'run': s_run, 'error': s_error, 'pop': s_pop,
      'tick': s_tick, 'laptop': s_laptop, 'thud': s_thud, 'rustle': s_rustle, 'grab': s_grab,
      'whoosh': s_whoosh, 'kick': s_kick, 'hit': s_hit, 'boom': s_boom}
REV = {'boom': 0.45, 'hit': 0.35, 'thud': 0.25, 'whoosh': 0.2, 'kick': 0.25, 'error': 0.2}
counts = {}
for c in CU['cues']:
    ty, t, v = c['type'], c['t'], c.get('v', 1.0)
    counts[ty] = counts.get(ty, 0) + 1
    if ty == 'turtle': place(t, s_turtle(c['dur']), 1.0, 0.1)
    elif ty == 'music': place(t, music(t, c['t1'], c['bpm']), 1.0, 0.12)
    elif ty in FX: place(t, FX[ty](v), 1.0, REV.get(ty, 0.12))
    else: print('（未知音效类型，跳过）', ty)

# 混响：指数衰减的噪声脉冲响应，左右声道不同，制造空间感
def ir(seed, d=1.6):
    r = np.random.default_rng(seed); t = tt(d)
    return lp(r.standard_normal(len(t)), 6000) * np.exp(-t * 3.2) * 0.12
wl, wr = fftconvolve(wet, ir(1))[:N], fftconvolve(wet, ir(2))[:N]
L, R = dry + wl, dry + wr
st = np.stack([L, R], 1)
st /= max(1e-9, np.abs(st).max()) / 0.89
import wave
with wave.open(OUT, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((st[: int(DUR * SR)] * 32767).astype(np.int16).tobytes())
print('音效：', ', '.join(f'{k}×{v}' for k, v in sorted(counts.items())), ' →', OUT)
