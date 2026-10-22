# 火柴人样片的音效 v2：每一种声音都按《火柴人 VS 编程》原片实测的参数合成
# 用法：python sfx.py <cues.json> <输出.wav> [--solo 类型]   （--solo 只导出某一类，用来单独对比）
# 依赖：numpy、scipy；用素材包时还需要 ffmpeg（解码各种格式）
#
# 怎么来的：analysis/ref_events.py 把原片前 100 秒（纯音效、没有配乐）的 216 个声音事件逐个切出来，
# 量了峰值、长度、起音、频谱重心、主频和音高走向，再对照画面确认每个声音是什么（见 拆解_火柴人系列.md 第 5 节）。
# 下面每个函数顶上的注释就是它要对齐的实测值；level() 把每个声音的峰值调到原片里同类声音的峰值，
# 所以声音之间的音量比例和原片一致。
#
# 素材包（可选）：把录音放进 audio/samples/<类型>/（wav/mp3/ogg/flac 都行），就会代替合成音，
# 一样按实测峰值调音量、随机轻微变调。挑哪些文件可以交给 analysis/pick_samples.py 按实测参数自动挑。
import json, sys, os, glob, subprocess
import numpy as np
from scipy.signal import butter, sosfilt, fftconvolve, resample_poly

SR = 48000
rng = np.random.default_rng(2026)
HERE = os.path.dirname(os.path.abspath(__file__))

def tt(d): return np.arange(int(d * SR)) / SR
def noise(d): return rng.standard_normal(int(d * SR))
def lp(x, f, o=2): return sosfilt(butter(o, min(f, SR / 2 - 100), 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi, o=2): return sosfilt(butter(o, [lo, min(hi, SR / 2 - 100)], 'band', fs=SR, output='sos'), x)
def ex(d, k, t=None): return np.exp(-(tt(d) if t is None else t) * k)
def att(x, a):  # 起音斜坡
    n = max(1, int(a * SR)); x = x.copy(); x[:n] *= np.linspace(0, 1, n) ** 1.5; return x
def tail(x, r=0.01):
    n = max(1, int(r * SR)); x = x.copy(); x[-n:] *= np.linspace(1, 0, n); return x
def osc(freq_curve, harm=((1, 1.0),)):
    # 按逐样本频率曲线生成带泛音的正弦
    ph = 2 * np.pi * np.cumsum(freq_curve) / SR
    return sum(a * np.sin(h * ph) for h, a in harm)
def pad(x, n):
    out = np.zeros(max(n, len(x))); out[:len(x)] = x; return out
def at(x, t0, total):  # 把 x 放到 total 秒长的缓冲里 t0 处
    out = np.zeros(int(total * SR)); i = int(t0 * SR); j = min(len(out), i + len(x)); out[i:j] += x[:j - i]; return out
def peak_db(x):
    # 和 analysis/ref_events.py 同样的量法：256 点 RMS、64 点步进的最大值
    if len(x) < 256: x = pad(x, 256)
    w = np.lib.stride_tricks.sliding_window_view(x, 256)[::64]
    return 20 * np.log10(np.sqrt((w ** 2).mean(1)).max() + 1e-12)
# 原片每类声音的频谱包络（analysis/ref_spectra.py 量出来的 48 个频带，dB）
_SP = json.load(open(os.path.join(HERE, 'ref_spectra.json'))) if os.path.exists(os.path.join(HERE, 'ref_spectra.json')) else None
def fill(x, kind, amount=1.0):
    # 补质感：原片的声音是录音/处理过的，各个频带都有能量；纯合成音只有几根谱线、中间是深谷。
    # 这里量出合成音每个频带比原片少多少，用按这个差值整形的噪声补上，噪声跟着声音自己的包络走。
    if not _SP or kind not in _SP['spectra'] or amount <= 0: return x
    edges = np.array(_SP['bands_hz']); ref = 10 ** (np.array(_SP['spectra'][kind]) / 10)
    n = len(x); nf = 1 << int(np.ceil(np.log2(max(n, 2048))))
    f = np.fft.rfftfreq(nf, 1 / SR); P = np.abs(np.fft.rfft(x, nf)) ** 2
    idx = [(f >= a) & (f < b) for a, b in zip(edges[:-1], edges[1:])]
    pb = np.array([P[m].mean() if m.any() else 0 for m in idx])
    ref = ref * pb.max() / ref.max()                           # 原片曲线的最高点对齐合成音最强的频带
    deficit = np.maximum(0, ref - pb)
    centers = np.sqrt(edges[:-1] * edges[1:])
    want = np.interp(np.log(np.maximum(f, 1)), np.log(centers), deficit, left=0, right=0)
    W = np.fft.rfft(rng.standard_normal(nf)); W /= np.sqrt(np.mean(np.abs(W) ** 2))
    r = np.fft.irfft(W * np.sqrt(want), nf)[:n]
    env = lp(np.abs(x), 60); env = np.maximum(env, 0); env /= env.max() + 1e-12
    r *= env * np.sqrt(nf / n) / np.sqrt(np.mean(env ** 2) + 1e-12)
    return x + amount * r
def level(x, target_db, kind=None, amount=1.0):
    if kind: x = fill(x, kind, amount)
    return x * 10 ** ((target_db - peak_db(x)) / 20)
def vary(lo=-1.5, hi=1.5): return rng.uniform(lo, hi)   # 每次触发的小随机（dB）
def pitch(p=0.04): return 1 + rng.uniform(-p, p)

# ———————————————— 实测目标（原片峰值 dBFS）————————————————
# （和 analysis/compare_sfx.py 同一种量法量出来的原片中位数）
REF = {
    'blink_on': -19.2, 'blink_off': -22.7, 'key': -18.7, 'enter': -16.5, 'run': -12.5, 'output': -5.5, 'output_thump': -18.0,
    'touch': -18.8, 'touch2': -20.3, 'error': -5.0, 'select': -18.7, 'step': -16.1, 'step_run': -14.0, 'body': -13.0, 'thud': -9.5,
    'laptop': -11.2, 'tick': -15.0, 'rustle': -28.0, 'whoosh': -15.0, 'kick': -8.0, 'boom': -6.0, 'turtle': -8.0, 'hit': -7.0,
}

# ———————————————— 每一种声音 ————————————————
def s_blink(on=True):
    # 光标闪烁：两个正弦分音的"嘀/嗒"，28 ms 内掉 60 dB。亮 = 2050+1289 Hz，灭 = 2871+1792 Hz
    f1, f2 = (2050, 1289) if on else (2871, 1792)
    t = tt(0.04)
    x = np.sin(2 * np.pi * f1 * t) * np.exp(-t * 330) + 0.75 * np.sin(2 * np.pi * f2 * t) * np.exp(-t * 150)
    return level(att(x, 0.0015), REF['blink_on' if on else 'blink_off'] + vary(-1, 1), 'blink_on' if on else 'blink_off')

def s_key(big=False):
    # 键盘：机械键。实测 130 ms，主峰 2296 Hz、重心约 3.4 kHz；另有 87 / 1101 / 1453 / 3738 / 8050 Hz 共振。
    # 主频走向：按下（低频闷点）→ 20 ms 触底（2296 Hz）→ 30–50 ms 1101 Hz → 约 60 ms 松开（又一个 2296 Hz 的"嗒"）。
    s = pitch(0.06); d = 0.17; t = tt(d)
    def hit(amp, low=0.6):
        click = bp(noise(d), 2500, 14000) * np.exp(-t * 700)
        res = sum(a * np.sin(2 * np.pi * f * s * t + rng.uniform(0, 6.28)) * np.exp(-t * k)
                  for f, a, k in [(1101, 0.3, 40), (1453, 0.25, 45), (2296, 0.9, 24), (3738, 0.6, 35), (8050, 0.35, 60)])
        lo = np.sin(2 * np.pi * 87 * s * t) * np.exp(-t * 60) * low
        return amp * (click * 1.6 + res + lo)
    j1, j2 = 0.018 + rng.uniform(-0.004, 0.004), 0.06 + rng.uniform(-0.01, 0.01)
    x = hit(0.6, 1.0) + at(hit(1.0, 0.3), j1, d)[:len(t)] + at(hit(0.45, 0.1), j2, d)[:len(t)]
    return level(tail(x), REF['enter' if big else 'key'] + vary(), 'key')

def s_run():
    # 运行（灰色高亮）：实测主频走向（每 10 ms）：960(回车键) 164 164 585 585 585 585 468 445 445 562 585，
    # 分音 351 / 1078 Hz，235 ms。也就是：按回车 → 585 Hz 的木质"嘟" → 中间往下一沉到 445 Hz → 再回到 585。
    d = 0.3; t = tt(d)
    H = ((1, 1.0), (0.6, 0.4), (1.84, 0.3), (3, 0.08))
    f = np.where(t < 0.045, 585, np.where(t < 0.065, 585 - 140 * np.sin(np.pi / 2 * (t - 0.045) / 0.02),
                 np.where(t < 0.075, 445, 445 + 140 * np.clip((t - 0.075) / 0.025, 0, 1))))
    env = np.minimum(1, t / 0.006) * (0.55 + 0.45 * np.exp(-t * 40)) * np.exp(-t * 14)
    tone = osc(f, H) * env
    x = at(tone, 0.022, d)[:len(t)] + pad(s_key(True) / 10 ** (REF['enter'] / 20) * 0.35, len(t))[:len(t)]
    x += np.sin(2 * np.pi * 164 * t) * np.exp(-t * 60) * 0.25
    return level(tail(x, 0.04), REF['run'] + vary(-0.5, 0.5), 'run')

def s_output():
    # 打印结果出现："叮—咚"往下掉。实测主频走向（每 10 ms）：1617 164 1265 1242 1242 539 539 1218 609 632 421 257，
    # 重心约 1.5 kHz，153 ms，全片最响的界面音（-5 dB）。
    # 两个成分：1250 Hz 的"叮"（35 Hz 颤音，频谱上每隔 35 Hz 一条边带）+ 从 40 ms 开始低八度的 630 Hz 往下滑到 250 Hz；
    # 开头一个 1617 Hz 的小点和一个很轻的 164 Hz 闷点。
    d = 0.26; t = tt(d); p = pitch(0.02)
    trem = 0.7 + 0.3 * np.cos(2 * np.pi * 35 * t)
    ding = osc(np.full(len(t), 1250 * p), ((1, 1.0), (2, 0.2), (3, 0.06))) * trem * np.exp(-t * 20)
    drop_f = 630 * p * np.exp(-np.clip(t - 0.04, 0, None) / 0.07)
    drop = osc(np.maximum(drop_f, 230), ((1, 1.0), (2, 0.3))) * np.clip((t - 0.04) / 0.006, 0, 1) * np.exp(-np.maximum(0, t - 0.05) * 30) * 0.6
    x = ding + drop + np.sin(2 * np.pi * 1617 * p * t) * np.exp(-t * 250) * 0.5
    x += np.sin(2 * np.pi * 164 * t) * np.exp(-np.maximum(0, t - 0.008) * 70) * (t > 0.008) * 0.3
    return level(att(x, 0.002), REF['output'] + vary(-0.7, 0.7), 'output')

def s_touch():
    # 碰到代码 / 捡起东西："啵～"。实测走向 445 515 515 609 679 703 703 726 726 375 375 398（每 10 ms），153 ms：
    # 60 ms 内从 445 滑到 ~720 Hz，停一下，85 ms 处掉到 375 Hz 的短尾巴。
    d = 0.2; t = tt(d); p = pitch(0.03)
    up = 445 + 280 * np.sin(np.pi / 2 * np.clip(t / 0.065, 0, 1))
    f = np.where(t < 0.085, up, 375 + 20 * np.clip((t - 0.11) / 0.05, 0, 1))
    env = np.minimum(1, t / 0.035) * np.where(t < 0.085, 1, 0.55 * np.exp(-(t - 0.085) * 28))
    x = osc(f * p, ((1, 1.0), (2, 0.28), (3, 0.1))) * env
    x += np.sin(2 * np.pi * 2039 * t) * np.exp(-t * 200) * 0.1
    return level(tail(x, 0.02), REF['touch'] + vary(-1, 1), 'touch')

def s_touch2():
    # 同一家族的另一种"啵"（蹲下摸东西、按回车前）：445 539 585 585 609 632 632 632 328 328（每 10 ms），127 ms
    d = 0.18; t = tt(d); p = pitch(0.03)
    up = 445 + 187 * np.sin(np.pi / 2 * np.clip(t / 0.05, 0, 1))
    f = np.where(t < 0.08, up, 328)
    env = np.minimum(1, t / 0.01) * np.where(t < 0.08, 1, 0.7 * np.exp(-(t - 0.08) * 30))
    x = osc(f * p, ((1, 1.0), (2, 0.35), (3, 0.15))) * env
    return level(tail(x, 0.02), REF['touch2'] + vary(-1, 1), 'touch2')

def s_error():
    # 报错（代码变红的那一下）：实测 4 段，约 300 ms，峰值约 -8 dB：
    #   0–60 ms   1010 → 1250 Hz 的音（20 ms 处有个 1617 Hz 的小点）
    #   60–150 ms 刺耳的亮噪声，重心 4–5 kHz，2.8 / 3.4 kHz 共振
    #   150–220 ms 750 Hz 左右的音往下衰减
    #   240–320 ms 很轻的 5.6 kHz 余音
    d = 0.4; t = tt(d)
    f1 = 1010 + 240 * np.clip(t / 0.03, 0, 1)
    a = osc(f1, ((1, 1.0), (2, 0.25))) * np.minimum(1, t / 0.004) * np.exp(-t * 18) * (t < 0.07)
    a += np.sin(2 * np.pi * 1617 * t) * np.exp(-np.maximum(0, t - 0.02) * 120) * (t > 0.02) * 0.4
    b = bp(noise(d), 2400, 10000) * 1.4 + sum(np.sin(2 * np.pi * fr * t) * 0.35 for fr in (2800, 2976, 3375))
    b *= np.clip((t - 0.06) / 0.008, 0, 1) * np.exp(-np.maximum(0, t - 0.07) * 22) * (t < 0.2)
    c = osc(760 - 40 * np.clip((t - 0.15) / 0.07, 0, 1), ((1, 1.0), (2, 0.2))) * np.clip((t - 0.14) / 0.01, 0, 1) * np.exp(-np.maximum(0, t - 0.15) * 20)
    hi = np.sin(2 * np.pi * 7617 * t) * np.clip((t - 0.04) / 0.002, 0, 1) * np.exp(-np.maximum(0, t - 0.04) * 90) * 0.5   # 40 ms 处的 7.6 kHz 尖点
    sh = bp(noise(d), 5000, 6500) * np.clip((t - 0.24) / 0.02, 0, 1) * np.exp(-np.maximum(0, t - 0.25) * 25) * 0.15
    x = a * 0.7 + b * 1.1 + c * 0.45 + sh + hi
    x += np.sin(2 * np.pi * 70 * t) * np.exp(-np.maximum(0, t - 0.02) * 50) * (t > 0.02) * 0.4
    return level(tail(x, 0.04), REF['error'], 'error')

def s_select():
    # 选中文字："嚓"，40 ms 的 6.2 kHz 短音 + 100 ms 的 2.1 kHz 尾巴
    d = 0.16; t = tt(d)
    x = np.sin(2 * np.pi * 6250 * t) * np.exp(-t * 45) + 0.6 * np.sin(2 * np.pi * 6445 * t) * np.exp(-t * 55)
    x += (0.5 * np.sin(2 * np.pi * 2150 * t) + 0.3 * np.sin(2 * np.pi * 609 * t)) * np.clip((t - 0.045) / 0.005, 0, 1) * np.exp(-np.maximum(0, t - 0.05) * 22)
    x += bp(noise(d), 3000, 8000) * np.exp(-t * 60) * 0.9
    return level(att(x, 0.001), REF['select'] + vary(), 'select')

def s_step(run=False, v=1.0):
    # 脚步：58 Hz 的超低频闷点（+105 Hz 泛音），50 ms；走路约每秒 6 步
    d = 0.09; t = tt(d); s = pitch(0.06)
    x = (np.sin(2 * np.pi * 58 * s * t) + 0.45 * np.sin(2 * np.pi * 105 * s * t)) * np.exp(-t * 85)
    x += lp(noise(d), 400) * np.exp(-t * 200) * 0.25
    return level(att(x, 0.003), REF['step_run' if run else 'step'] + vary() + 20 * np.log10(max(v, 0.05)), 'step')

def s_body(v=1.0):
    # 身体着地（跪、蹲、坐、手撑地）：原片里是更响、更长一点的超低频闷点（70 Hz，40–70 ms）+ 一点衣服声
    d = 0.14; t = tt(d); s = pitch(0.05)
    x = (np.sin(2 * np.pi * 62 * s * t) + 0.5 * np.sin(2 * np.pi * 118 * s * t)) * np.exp(-t * 55)
    x += lp(noise(d), 900) * np.exp(-t * 90) * 0.35 + bp(noise(d), 2000, 7000) * np.exp(-t * 40) * 0.05
    return level(att(x, 0.003), REF['body'] + vary() + 20 * np.log10(max(v, 0.05)), 'body', 0.3)

def s_thud(v=1.0):
    # 整个人摔在地上：身体着地 + 更长的超低频 + 衣服摩擦
    d = 0.6; t = tt(d)
    sub = osc(40 + 35 * np.exp(-t / 0.08)) * np.exp(-t * 8)
    x = sub + pad(s_body(1) / 10 ** (REF['body'] / 20) * 0.8, len(t))[:len(t)] + bp(noise(d), 1500, 6000) * np.exp(-t * 18) * 0.08
    return level(att(x, 0.002), REF['thud'] + 20 * np.log10(max(v, 0.05)))

def s_laptop(v=1.0):
    # 电脑落地：实测先是 70–140 Hz 的闷响（0–40 ms），40–100 ms 一串塑料共振（1054 / 1242 / 1593 / 1710 / 1851 / 1968 / 2039 Hz）
    # 和 4 kHz 的亮"咔"，重心约 3.5 kHz，107 ms
    d = 0.2; t = tt(d)
    x = (np.sin(2 * np.pi * 70 * t) + 0.6 * np.sin(2 * np.pi * 117 * t)) * np.exp(-t * 45) * 0.7
    k = np.clip((t - 0.035) / 0.004, 0, 1)
    x += k * sum(a * np.sin(2 * np.pi * f * pitch(0.02) * t + rng.uniform(0, 6.28)) * np.exp(-np.maximum(0, t - 0.035) * kk)
                 for f, a, kk in [(1054, 0.5, 40), (1242, 0.6, 35), (1593, 0.5, 45), (1710, 0.45, 50), (1851, 0.45, 50), (1968, 0.4, 55), (2039, 0.4, 60), (4242, 0.3, 70)])
    x += k * bp(noise(d), 3000, 12000) * np.exp(-np.maximum(0, t - 0.035) * 120) * 1.5
    return level(att(x, 0.001), REF['laptop'] + 20 * np.log10(max(0.15, v)), 'laptop')

def s_tick(v=1.0):
    # 小字落地：原片里 hi 掉地上是一个很短的低频闷点 + 一点点亮的"嗒"
    d = 0.07; t = tt(d)
    x = np.sin(2 * np.pi * 70 * t) * np.exp(-t * 110) + bp(noise(d), 2500, 7000) * np.exp(-t * 300) * 0.35
    return level(att(x, 0.002), REF['tick'] + 20 * np.log10(max(0.15, v)) + vary())

def s_rustle(v=1.0):
    # 衣服摩擦（起身、转身）：实测频谱重心约 5 kHz，很轻（-30 dB）
    d = 0.35; env = np.sin(np.linspace(0, np.pi, int(d * SR))) ** 2
    return level(bp(noise(d), 2500, 10000) * env, REF['rustle'] + 20 * np.log10(max(0.2, v)))

def s_scratch(v=1.0):
    # 挠头（占位；正式声音见 音效需求.json 的 scratch）：一下约 0.17 s 的亮摩擦声，原片实测重心约 5 kHz、约 -27 dB
    d = 0.17; u = np.linspace(0, 1, int(d * SR)); env = np.sin(np.pi * u ** 0.6) ** 2
    return level(bp(noise(d), 3000, 11000) * env, -27.0 + 20 * np.log10(max(0.2, v)))

def s_tab(v=1.0):
    # Tab（占位）：比普通键大一点的"哒"
    d = 0.12; u = np.linspace(0, 1, int(d * SR)); env = np.exp(-u * 30)
    return level(bp(noise(d), 900, 5000) * env, -17.0)

def s_interrupt(v=1.0):
    # Ctrl+C（占位）：果断的一下 + 咔哒
    a = s_tab(1); d = 0.3; n = int(d * SR); out = np.zeros(n); out[:len(a)] += a
    k = bp(noise(0.05), 2000, 8000) * np.exp(-np.linspace(0, 1, int(0.05 * SR)) * 20); o = int(0.06 * SR); out[o:o + len(k)] += k
    return level(out, -10.0)

def s_word_rain(dur=4.0, v=1.0):
    # 字雨（占位）：大量随机的小 tick 叠在一起
    n = int(dur * SR); out = np.zeros(n); rng = np.random.default_rng(7)
    t1 = s_tick(0.5); m = int(dur * (25 + 120 * v))
    for k in rng.integers(0, max(1, n - len(t1)), m): out[k:k + len(t1)] += t1 * rng.uniform(0.2, 0.8)
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.3 * SR))
    return level(out * fade, -14.0 + 20 * np.log10(max(0.3, v)))

def s_dissolve(v=1.0):
    # 消散（占位）：往上飘的亮沙沙声
    d = 1.1; u = np.linspace(0, 1, int(d * SR)); env = np.exp(-u * 3) * np.minimum(1, u * 30)
    return level(bp(noise(d), 4000, 14000) * env, -14.0)

def s_bonk(v=1.0):
    # 砸到头（占位）：短促的木头"咚"，音高往下一滑，带点滑稽感
    d = 0.16; t = tt(d); f = 520 * np.exp(-t * 9)
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 28) + bp(noise(d), 1500, 6000) * np.exp(-t * 200) * 0.4
    return level(att(x, 0.001), -12.0 + 20 * np.log10(max(0.3, v)))

def s_tap(v=1.0):
    # 字碰到身上（占位）：很轻的"噗"
    d = 0.06; t = tt(d)
    return level(lp(noise(d), 1800) * np.exp(-t * 90), -24.0 + 20 * np.log10(max(0.3, v)))

def s_block_drop(v=1.0):
    # # 方块 / 一层墙砸地（占位）：比字重的闷响 + 一点石头碰撞的颗粒
    d = 0.3; t = tt(d)
    x = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 22) + bp(noise(d), 600, 4000) * np.exp(-t * 40) * 0.5
    return level(att(x, 0.002), -11.0 + 20 * np.log10(max(0.3, v)))

def s_snake_bite(v=1.0):
    # 蛇头咬地 / 撞墙（占位）：一口"咔"+ 下沉的闷声
    d = 0.35; t = tt(d)
    x = bp(noise(d), 2500, 9000) * np.exp(-t * 60) + np.sin(2 * np.pi * 90 * np.exp(-t * 3) * t) * np.exp(-t * 14) * 0.8
    return level(att(x, 0.001), -9.0 + 20 * np.log10(max(0.3, v)))

def s_snake_slither(dur=3.0, v=1.0):
    # 蛇游动（占位，可循环）：很多很轻的纸片摩擦声，带慢慢起伏
    n = int(dur * SR); u = np.arange(n) / SR
    x = bp(rng.standard_normal(n), 2000, 9000) * (0.55 + 0.45 * np.sin(2 * np.pi * 1.6 * u) ** 2)
    fade = np.minimum(1, np.minimum(np.arange(n), n - np.arange(n)) / (0.2 * SR))
    return level(x * fade, -20.0 + 20 * np.log10(max(0.3, v)))

def s_scale_drone(dur=3.6, v=1.0):
    # 蛇盘满天空（占位）：低沉、慢慢变大的拉长音
    n = int(dur * SR); u = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * u) for f, a in [(55, 1), (82.5, 0.5), (110, 0.3)]) * np.minimum(1, u / 1.2) * np.minimum(1, (dur - u) / 0.8)
    return level(x, -12.0 + 20 * np.log10(max(0.3, v)))

def s_cond(ok=True):
    # 条件的值（占位）：True 一声轻快的高"嘀"，False 两声往下的"嘀嘟"（循环结束）
    def blip(f, d=0.09): t = tt(d); return np.sin(2 * np.pi * f * t) * np.exp(-t * 30) * np.minimum(1, t / 0.003)
    if ok: return level(blip(1760), -20.0)
    a, b = blip(1320, 0.12), blip(880, 0.3); out = np.zeros(int(0.45 * SR)); out[:len(a)] += a; o = int(0.11 * SR); out[o:o + len(b)] += b
    return level(out, -15.0)

def s_whoosh(v=1.0):
    # 呼：中心频率先升后降的带通噪声
    d = 0.4; n = int(d * SR); u = np.linspace(0, 1, n)
    x = noise(d); out = np.zeros(n); seg = 512
    for k in range(0, n, seg):
        fc = 350 + 2600 * np.sin(np.pi * k / n) ** 2
        out[k:k + seg] = bp(x[max(0, k - 2048):k + seg], fc * 0.6, fc * 1.6)[-len(out[k:k + seg]):]
    return level(out * np.sin(np.pi * u) ** 1.5, REF['whoosh'] + 20 * np.log10(max(0.2, v)))

def s_kick():
    d = 0.25; t = tt(d)
    x = lp(noise(d), 2500) * np.exp(-t * 55) * 0.8 + osc(60 + 90 * np.exp(-t / 0.03)) * np.exp(-t * 20)
    x += pad(s_body(1) / 10 ** (REF['body'] / 20) * 0.3, len(t))[:len(t)]
    return level(att(x, 0.001), REF['kick'])

def s_boom():
    # 爆炸：原片是一段持续约 2.6 秒的轰鸣（RMS 约 -13 dB，宽频，重心约 2.5 kHz），不是一下就没的"砰"。
    # 结构：瞬态 + 超低频下潜 + 持续的轰鸣（噪声，截止频率慢慢变闷）+ 噼啪碎响 + 一串小爆点（BOOM 们）
    d = 3.2; t = tt(d); n = len(t)
    sub = osc(30 + 32 * np.exp(-t / 0.3)) * np.exp(-t * 0.9) * 1.2
    nz = noise(d); roar = np.zeros(n); seg = 2048
    for k in range(0, n, seg):
        fc = 1400 + 3200 * np.exp(-k / SR * 1.2)
        roar[k:k + seg] = lp(nz[max(0, k - 4096):k + seg], fc, 3)[-len(roar[k:k + seg]):]
    wob = 1 + 0.25 * np.sin(2 * np.pi * 3.1 * t) * np.sin(2 * np.pi * 0.7 * t)
    env = np.minimum(1, t / 0.02) * np.where(t < 2.4, 1 - 0.25 * t / 2.4, 0.75 * np.exp(-(t - 2.4) * 6))
    roar *= env * wob
    crack = np.zeros(n)
    for _ in range(220):
        i = int(min(n - 600, rng.random() ** 1.5 * 2.5 * SR))
        crack[i:i + 500] += hp(noise(500 / SR), 1800) * np.exp(-tt(500 / SR) * 250) * rng.random()
    pops = np.zeros(n)
    for _ in range(18):                      # 小爆点：每个 BOOM 一下
        i = int(rng.uniform(0.05, 1.6) * SR); dd = 0.25; tp = tt(dd)
        p = osc(45 + 60 * np.exp(-tp / 0.02)) * np.exp(-tp * 18) + lp(noise(dd), 1500) * np.exp(-tp * 25) * 0.6
        pops[i:i + len(p)] += p[: n - i] * rng.uniform(0.3, 0.8)
    trans = pad(hp(noise(0.04), 600) * ex(0.04, 80) * 3, n)
    x = sub + roar * 1.4 + crack * 0.6 * env + pops * 0.7 + trans
    return level(tail(x, 0.2), REF['boom'])

def s_turtle(dur):
    # turtle 画线：明亮的沙沙声（实测重心约 4.3 kHz、air 段能量高、持续好几秒），随折线每一折起伏
    t = tt(dur)
    zig = 0.55 + 0.45 * np.abs(np.sin(np.pi * 4.6 * t))
    x = bp(noise(dur), 2500, 12000) * zig + lp(noise(dur), 400) * 0.15
    x *= np.minimum(1, t / 0.15) * np.minimum(1, (dur - t) / 0.15 + 0.001) * (0.7 + 0.3 * t / dur)
    return level(x, REF['turtle'])

def s_hit():
    d = 0.9; t = tt(d)
    x = osc(38 + 32 * np.exp(-t / 0.06)) * np.exp(-t * 5) + lp(noise(d), 1200) * np.exp(-t * 9) * 0.5 + hp(noise(d), 6000) * np.exp(-t * 6) * 0.15
    return level(att(x, 0.001), REF['hit'])

# ———————————————— 特效样片用到的新声音：合成占位（你按 音效需求.json 做好放进 samples/<id>/ 就会替换）————————————————
def s_whoosh_short(v=1.0):
    d = 0.2; n = int(d * SR); u = np.linspace(0, 1, n)
    x = bp(noise(d), 900, 5000) * np.sin(np.pi * u ** 0.6) ** 2
    return level(x, -16.0 + 20 * np.log10(max(0.2, v)))
def s_impact(kind):
    d = {'light': 0.25, 'medium': 0.4, 'heavy': 0.8}[kind]; t = tt(d)
    f0 = {'light': 140, 'medium': 110, 'heavy': 90}[kind]
    x = lp(noise(d), {'light': 3500, 'medium': 2500, 'heavy': 1800}[kind]) * np.exp(-t * {'light': 45, 'medium': 28, 'heavy': 14}[kind])
    x += osc(f0 * 0.45 + f0 * 0.55 * np.exp(-t / 0.04)) * np.exp(-t * {'light': 25, 'medium': 12, 'heavy': 5}[kind]) * 1.2
    return level(att(x, 0.001), {'light': -8.0, 'medium': -6.0, 'heavy': -4.0}[kind])
def s_impact_frame():
    d = 0.1; t = tt(d)
    return level(att(hp(noise(d), 3000) * np.exp(-t * 80) + np.sin(2 * np.pi * 7600 * t) * np.exp(-t * 120) * 0.4, 0.0005), -12.0)
def s_shatter():
    d = 1.0; n = int(d * SR); x = np.zeros(n)
    for _ in range(90):
        i = int(min(n - 3000, rng.random() ** 2 * 0.7 * SR)); f = rng.uniform(1800, 7000); dd = rng.uniform(0.01, 0.04); tp = tt(dd)
        x[i:i + len(tp)] += (np.sin(2 * np.pi * f * tp) * 0.6 + bp(noise(dd), 2500, 10000)) * np.exp(-tp * 120) * rng.uniform(0.2, 1)
    x += bp(noise(d), 2000, 9000) * np.exp(-tt(d) * 9) * 0.5
    return level(x, -9.0)
def s_char_bounce(v=1.0):
    d = 0.05; t = tt(d); f = rng.uniform(2200, 5200)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 160) + bp(noise(d), 3000, 9000) * np.exp(-t * 220) * 0.5
    return level(att(x, 0.0005), -20.0 + 20 * np.log10(max(0.15, v)) + vary())
def s_laptop_slam():
    d = 0.8; t = tt(d)
    x = pad(s_laptop(1) * 1.0, len(t))[:len(t)] + osc(35 + 40 * np.exp(-t / 0.05)) * np.exp(-t * 6) * 1.2 + lp(noise(d), 800) * np.exp(-t * 10) * 0.5
    return level(att(x, 0.001), -6.0)
def s_ground_shock():
    d = 1.1; t = tt(d)
    x = osc(28 + 30 * np.exp(-t / 0.12)) * np.exp(-t * 3.5) + lp(noise(d), 500) * np.exp(-t * 5) * 0.6
    return level(att(x, 0.002), -6.0)
def s_charge(dur=2.0):
    t = tt(dur); u = t / dur
    f = 110 * 2 ** (u * 2.2)
    x = osc(f, ((1, 1.0), (2, 0.5), (3, 0.25), (5, 0.12))) * (0.25 + 0.75 * u ** 1.5)
    x += bp(noise(dur), 1500, 9000) * u ** 2.5 * 0.6
    x *= 1 + 0.3 * np.sin(2 * np.pi * (6 + 18 * u) * t)
    return level(x * np.minimum(1, t / 0.1), -14.0)
def s_release():
    d = 1.2; t = tt(d)
    x = s_impact('heavy')[: len(t)]; x = pad(x, len(t))[:len(t)]
    x += bp(noise(d), 600, 6000) * np.exp(-t * 4) * 0.8 + osc(60 + 300 * np.exp(-t / 0.08)) * np.exp(-t * 6) * 0.6
    return level(x, -4.0)
def s_debris():
    d = 1.6; n = int(d * SR); x = np.zeros(n)
    for _ in range(26):
        i = int(rng.uniform(0.05, 1.4) * SR); dd = 0.05; tp = tt(dd)
        x[i:i + len(tp)] += (lp(noise(dd), 3000) * np.exp(-tp * 90) + np.sin(2 * np.pi * rng.uniform(300, 1500) * tp) * np.exp(-tp * 70) * 0.5) * rng.uniform(0.2, 1)
    return level(x, -18.0)
def s_recoil_slide(dur=0.5):
    t = tt(dur); x = bp(noise(dur), 400, 3500) * (1 + 0.5 * np.sin(2 * np.pi * 37 * t)) * np.minimum(1, t / 0.03) * np.exp(-t * 3)
    return level(x, -16.0)

# ———————————————— 追逐段配乐（占位：150 BPM，E 小调）————————————————
def music(t0, t1, bpm):
    # 有 assets/bgm.* 就用你的配乐，否则用这段占位的鼓 + 贝斯 + 和弦垫。原片动作段配乐 RMS 约 -22 dB。
    bgm = glob.glob(os.path.join(HERE, '..', 'assets', 'bgm.*'))
    d = t1 - t0; n = int(d * SR)
    if bgm:
        x = decode(bgm[0])[:n]; x = pad(x, n)
    else:
        beat = 60 / bpm; x = np.zeros(n + SR)
        def put(tl, sig, g):
            i = int(tl * SR); j = min(len(x), i + len(sig)); x[i:j] += sig[:j - i] * g
        kick = osc(45 + 65 * np.exp(-tt(0.25) / 0.03)) * ex(0.25, 16)
        snare = bp(noise(0.2), 1200, 8000) * ex(0.2, 22) + np.sin(2 * np.pi * 190 * tt(0.2)) * ex(0.2, 30) * 0.5
        hat = hp(noise(0.05), 7000) * ex(0.05, 90)
        notes = [40, 40, 43, 40, 45, 40, 43, 47]
        mtof = lambda m: 440 * 2 ** ((m - 69) / 12)
        for b in range(int(d / beat)):
            tb = b * beat
            put(tb, kick, 0.9 if b % 2 == 0 else 0.6)
            if b % 4 in (1, 3): put(tb, snare, 0.5)
            for h in range(2): put(tb + h * beat / 2, hat, 0.18 if h else 0.1)
            for h in range(2):
                tn = tt(beat / 2 * 0.9); f = mtof(notes[(b * 2 + h) % 8])
                put(tb + h * beat / 2, lp(2 * ((f * tn) % 1) - 1, 700) * ex(beat / 2 * 0.9, 6), 0.35)
        chords = [[52, 55, 59], [48, 52, 55], [55, 59, 62], [50, 54, 57]]
        bar = beat * 4
        for k in range(int(d / (bar * 2)) + 1):
            tc = k * bar * 2
            if tc > d - 0.5: break
            L = min(bar * 2, d - tc); tn = tt(L)
            sig = sum(np.sin(2 * np.pi * mtof(m) * tn) + 0.3 * np.sin(4 * np.pi * mtof(m) * tn) for m in chords[k % 4])
            put(tc, lp(sig, 2500) * np.minimum(1, tn / 0.3) * np.minimum(1, (L - tn) / 0.3 + 0.01), 0.06)
        x = x[:n]
    x *= np.minimum(1, np.arange(n) / (0.15 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.6 * SR))
    rms = np.sqrt(np.mean(x[: int(min(n, 4 * SR))] ** 2)) + 1e-9
    return x * 10 ** (-22 / 20) / rms

# ———————————————— 素材包 ————————————————
def decode(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
SAMPLES = {}
def sample(kind, idx):
    if kind not in SAMPLES:
        fs = sorted(sum((glob.glob(os.path.join(HERE, 'samples', kind, e)) for e in ('*.wav', '*.mp3', '*.ogg', '*.flac', '*.aif*')), []))
        SAMPLES[kind] = [decode(f) for f in fs]
    pool = SAMPLES[kind]
    if not pool: return None
    x = pool[idx % len(pool)]
    r = rng.uniform(0.96, 1.04)                     # 轻微变调，避免机关枪效应
    up, dn = int(round(1000 / r)), 1000
    return resample_poly(x, up, dn)

# ———————————————— 按时间表放置 ————————————————
# 每个 cue 先找 samples/<id>/ 里的素材（id 见 音效需求.json），没有才用合成音；音量按需求文件里的目标峰值对齐
_REQ = json.load(open(os.path.join(HERE, '音效需求.json'), encoding='utf-8')) if os.path.exists(os.path.join(HERE, '音效需求.json')) else {'sounds': []}
LEVELS = {x['id']: x['level_peak_dbfs'] for x in _REQ['sounds']}
LOOPABLE = {'turtle', 'charge', 'word_rain', 'snake_slither'}
ALIAS = {'enter': 'key_enter', 'laptop': 'laptop_drop', 'kick': 'impact_light', 'click': 'select', 'pop': 'output', 'grab': 'rustle', 'hit': 'ground_shock'}
def sample_id(c):
    ty = c['type']
    if ty == 'blink': return 'blink_on' if c.get('on', True) else 'blink_off'
    if ty == 'step' and c.get('run'): return 'step_run'
    return ALIAS.get(ty, ty)
GEN = {
    'blink': lambda c: s_blink(c.get('on', True)), 'key': lambda c: s_key(), 'enter': lambda c: s_key(True), 'run': lambda c: s_run(),
    'output': lambda c: s_output(), 'pop': lambda c: s_output(), 'touch': lambda c: s_touch(), 'touch2': lambda c: s_touch2(), 'error': lambda c: s_error(),
    'select': lambda c: s_select(), 'click': lambda c: s_select(), 'step': lambda c: s_step(c.get('run', False), c.get('v', 1)),
    'body': lambda c: s_body(c.get('v', 1)), 'thud': lambda c: s_thud(c.get('v', 1)), 'laptop': lambda c: s_laptop(c.get('v', 1)),
    'tick': lambda c: s_tick(c.get('v', 1)), 'rustle': lambda c: s_rustle(c.get('v', 1)), 'scratch': lambda c: s_scratch(c.get('v', 1)), 'tab': lambda c: s_tab(), 'interrupt': lambda c: s_interrupt(),
    'word_rain': lambda c: s_word_rain(c.get('dur', 4), c.get('v', 1)), 'dissolve': lambda c: s_dissolve(), 'grab': lambda c: s_rustle(0.8),
    'whoosh': lambda c: s_whoosh(c.get('v', 1)), 'kick': lambda c: s_kick(), 'boom': lambda c: s_boom(),
    'turtle': lambda c: s_turtle(c['dur']), 'hit': lambda c: s_hit(), 'music': lambda c: music(c['t'], c['t1'], c['bpm']),
    'key_space': lambda c: s_key(), 'key_enter': lambda c: s_key(True), 'key_back': lambda c: s_key(),
    'laptop_drop': lambda c: s_laptop(c.get('v', 1)), 'whoosh_short': lambda c: s_whoosh_short(c.get('v', 1)),
    'impact_light': lambda c: s_impact('light'), 'impact_medium': lambda c: s_impact('medium'), 'impact_heavy': lambda c: s_impact('heavy'),
    'impact_frame': lambda c: s_impact_frame(), 'shatter': lambda c: s_shatter(), 'char_bounce': lambda c: s_char_bounce(c.get('v', 1)),
    'laptop_slam': lambda c: s_laptop_slam(), 'ground_shock': lambda c: s_ground_shock(), 'charge': lambda c: s_charge(c.get('dur', 2.0)),
    'bonk': lambda c: s_bonk(c.get('v', 1)), 'tap': lambda c: s_tap(c.get('v', 1)), 'block_drop': lambda c: s_block_drop(c.get('v', 1)),
    'snake_bite': lambda c: s_snake_bite(c.get('v', 1)), 'snake_slither': lambda c: s_snake_slither(c.get('dur', 3), c.get('v', 1)),
    'scale_drone': lambda c: s_scale_drone(c.get('dur', 3.6), c.get('v', 1)), 'cond_true': lambda c: s_cond(True), 'cond_false': lambda c: s_cond(False),
    'label_stick': lambda c: s_tap(0.6), 'label_tear': lambda c: s_whoosh_short(0.4), 'roar_big': lambda c: s_whoosh(1.0), 'roar_small': lambda c: s_cond(True),
    'car_clack': lambda c: s_tick(1.0), 'pop_open': lambda c: s_output(), 'glitch': lambda c: s_select(), 'garble': lambda c: s_dissolve(),
    'assemble': lambda c: s_tick(0.8), 'glitch_crawl': lambda c: s_tick(0.5),
    'cursor_hop': lambda c: s_tick(c.get('v', 0.6)), 'cursor_stand': lambda c: s_select(), 'cursor_stare': lambda c: s_select(), 'cursor_load': lambda c: s_charge(c.get('dur', 0.8)),
    'click': lambda c: s_select(), 'backspace_eat': lambda c: s_dissolve(), 'drag': lambda c: s_whoosh(0.6), 'caps_lock': lambda c: s_key(), 'find_hit': lambda c: s_cond(True),
    'replace': lambda c: s_tick(c.get('v', 0.5)), 'punch_soft': lambda c: s_impact('light'), 'select_all': lambda c: s_scale_drone(0.9, 0.8), 'delete_all': lambda c: s_whoosh(1.0),
    'undo': lambda c: s_whoosh_short(0.8), 'key_clash': lambda c: s_shatter(), 'flashback_in': lambda c: s_whoosh(0.7), 'flashback_out': lambda c: s_whoosh_short(0.7),
    'release': lambda c: s_release(), 'debris': lambda c: s_debris(), 'recoil_slide': lambda c: s_recoil_slide(c.get('dur', 0.5)),
    # 刀剑短片 blade1（第 10 轮）新声音：先用现有合成音占位，按 音效需求.json 做好放进 samples/<id>/ 就会替换
    'sword_whoosh': lambda c: s_whoosh_short(c.get('v', 1)), 'sword_clang': lambda c: s_impact('light') * c.get('v', 1),
    'sword_scrape': lambda c: s_impact('light') * c.get('v', 1), 'blade_heavy_clang': lambda c: s_impact('heavy'),
    'sword_slam': lambda c: s_thud(c.get('v', 1)), 'sword_spin': lambda c: s_whoosh_short(c.get('v', 1)),
    'sword_stick': lambda c: s_thud(c.get('v', 1)), 'sword_kick': lambda c: s_impact('light') * c.get('v', 1),
    'sword_catch': lambda c: s_impact('light') * c.get('v', 1), 'blade_break': lambda c: s_impact('heavy'),
    'whistle_fall': lambda c: s_whoosh_short(c.get('v', 1)),
}
# 有素材时替换合成音的类型（音量仍按实测值）
SAMPLE_KINDS = {'key': 'key', 'enter': 'key', 'step': 'step', 'body': 'body', 'thud': 'thud', 'laptop': 'laptop', 'tick': 'tick',
                'rustle': 'rustle', 'whoosh': 'whoosh', 'kick': 'kick', 'boom': 'boom', 'select': 'select', 'click': 'select'}
REV = {'boom': 0.3, 'hit': 0.25, 'thud': 0.12, 'whoosh': 0.12, 'kick': 0.12, 'error': 0.1, 'output': 0.08, 'run': 0.06}

def main():
    args = sys.argv[1:]
    SOLO = args[args.index('--solo') + 1] if '--solo' in args else None
    CU = json.load(open(args[0], encoding='utf-8'))
    OUT = args[1]
    DUR = CU['dur']
    N = int((DUR + 4) * SR)
    dry, wet = np.zeros(N), np.zeros(N)
    counts, from_samples = {}, {}
    for idx, c in enumerate(sorted(CU['cues'], key=lambda c: c['t'])):
        ty = c['type']
        if SOLO and ty != SOLO: continue
        if ty not in GEN and sample_id(c) not in GEN: print('（未知音效类型，跳过）', ty); continue
        if ty not in GEN: ty = sample_id(c)
        sig = None
        sid = sample_id(c)
        s = sample(sid, idx) if ty != 'music' else None
        if s is None and ty in SAMPLE_KINDS: s = sample(SAMPLE_KINDS[ty], idx)       # 兼容旧的文件夹名
        if s is not None:
            if sid in LOOPABLE and c.get('dur'):                                    # 可循环的声音按需要的长度拼接
                n = int(c['dur'] * SR); s = np.tile(s, n // max(1, len(s)) + 1)[:n]
                s = s * np.minimum(1, np.arange(n) / (0.05 * SR)) * np.minimum(1, (n - np.arange(n)) / (0.1 * SR))
            target = LEVELS.get(sid, REF.get(ty, -18)) + 20 * np.log10(max(0.15, c.get('v', 1)))
            sig = level(s, target); from_samples[sid] = from_samples.get(sid, 0) + 1
        if sig is None: sig = GEN[ty](c)
        counts[ty] = counts.get(ty, 0) + 1
        i = int(c['t'] * SR); j = min(N, i + len(sig))
        dry[i:j] += sig[:j - i]
        wet[i:j] += sig[:j - i] * REV.get(ty, 0.04)

    # 很短的房间混响（原片的音效基本是干的，只有爆炸、重击带一点空间）
    def ir(seed, d=1.2):
        r = np.random.default_rng(seed); t = tt(d)
        return lp(r.standard_normal(len(t)), 6000) * np.exp(-t * 4.5) * 0.1
    L, R = dry + fftconvolve(wet, ir(1))[:N], dry + fftconvolve(wet, ir(2))[:N]
    st = np.stack([L, R], 1)[: int(DUR * SR)]
    pk = np.abs(st).max()
    if pk > 0.98: st *= 0.98 / pk          # 只防削波，不压缩：保留原片那种大动态
    import wave
    with wave.open(OUT, 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((np.clip(st, -1, 1) * 32767).astype(np.int16).tobytes())
    print('音效：', ', '.join(f'{k}×{v}' for k, v in sorted(counts.items())))
    if from_samples: print('其中用了素材：', ', '.join(f'{k}×{v}' for k, v in sorted(from_samples.items())))
    print('→', OUT)


if __name__ == '__main__':
    main()
