"""程序合成全片音效（numpy），输出到 public/sfx/*.wav（44.1 kHz 立体声）。
原则（来自比特新语的拆解）：少而准。只做三类声音——画面里会响的东西、大字砸下、落点之前的上扬。
用法：python3 scripts/make-sfx.py
"""
import os, wave, subprocess
import numpy as np

SR = 44100
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'sfx')
os.makedirs(OUT, exist_ok=True)
rng = np.random.default_rng(7)


def t_(dur):
    return np.arange(int(dur * SR)) / SR


def noise(dur):
    return rng.standard_normal(int(dur * SR))


def lowpass(x, fc):
    """FFT 低通（软边）"""
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (f / fc) ** 4)
    return np.fft.irfft(X, len(x))


def highpass(x, fc):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    X *= 1 / (1 + (fc / np.maximum(f, 1)) ** 4)
    return np.fft.irfft(X, len(x))


def bandpass(x, lo, hi):
    return highpass(lowpass(x, hi), lo)


def env(dur, a=0.01, d=None, curve=4.0):
    t = t_(dur)
    e = np.minimum(1, t / max(a, 1e-4))
    if d is None:
        d = dur - a
    e *= np.exp(-np.maximum(0, t - a) / d * curve)
    return e


def fade(x, fi=0.01, fo=0.05):
    n = len(x)
    a, b = int(fi * SR), int(fo * SR)
    if a: x[:a] *= np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)
    return x


def reverb(x, size=2.5, mix=0.35, damp=3000):
    """衰减噪声做脉冲响应的卷积混响，左右声道用不同的 IR"""
    n = int(size * SR)
    out = []
    for ch in range(2):
        ir = rng.standard_normal(n) * np.exp(-np.arange(n) / SR / size * 5)
        ir = lowpass(ir, damp)
        ir /= np.sqrt((ir ** 2).sum())
        m = len(x) + n
        y = np.fft.irfft(np.fft.rfft(x, m) * np.fft.rfft(ir, m), m)
        dry = np.concatenate([x, np.zeros(n)])
        out.append(dry * (1 - mix) + y * mix * 3)
    return np.stack(out, 1)


def stereo(x):
    return np.stack([x, x], 1) if x.ndim == 1 else x


def save(name, x, peak=0.5):
    x = stereo(x)
    x = x / (np.abs(x).max() + 1e-9) * peak
    x = (x * 32767).astype(np.int16)
    wav = os.path.join(OUT, name + '.wav')
    with wave.open(wav, 'wb') as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(x.tobytes())
    # 转成 mp3，仓库里小一些
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', '-i', wav, '-b:a', '192k', os.path.join(OUT, name + '.mp3')], check=True)
    os.remove(wav)
    print(name, f'{len(x) / SR:.1f}s')


# ———— 水下环境声（浅水：闷闷的涌动 + 零星气泡） ————
def underwater(dur, bright=1.0, bubbles=20):
    n = lowpass(noise(dur), 260 * bright) * 0.8
    t = t_(dur)
    swell = 0.6 + 0.4 * np.sin(2 * np.pi * 0.11 * t) * np.sin(2 * np.pi * 0.07 * t + 1)
    x = n * swell
    for _ in range(bubbles):
        s = rng.uniform(0, dur - 0.3)
        f0 = rng.uniform(500, 1600)
        bt = t_(0.12)
        b = np.sin(2 * np.pi * f0 * bt * (1 + bt * 4)) * np.exp(-bt * 40) * 0.25
        i = int(s * SR)
        x[i:i + len(b)] += b
    return fade(x, 1.0, 1.5)


# ———— 鲸的叫声：低沉的 FM 长音 ————
def whale_call(dur=4.5, f0=95, f1=55):
    t = t_(dur)
    f = f0 + (f1 - f0) * (t / dur) ** 0.7 + 6 * np.sin(2 * np.pi * 0.9 * t)
    ph = 2 * np.pi * np.cumsum(f) / SR
    x = np.sin(ph) + 0.45 * np.sin(2 * ph + 0.3) + 0.2 * np.sin(3 * ph) + 0.08 * np.sin(5 * ph)
    x *= np.sin(np.pi * np.minimum(1, t / dur)) ** 0.6
    return reverb(fade(x, 0.4, 0.8), size=4, mix=0.55, damp=1500)


# ———— 下沉：越来越低的压力声 + 鲸体被压的吱嘎 ————
def sink(dur=9.0):
    t = t_(dur)
    f = 70 * np.exp(-t / dur * 1.2)
    rumble = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.5 + lowpass(noise(dur), 120) * 0.8
    x = rumble * np.minimum(1, t / 1.5)
    for k in range(4):
        s = 1.5 + k * 1.9 + rng.uniform(0, 0.4)
        ct = t_(0.6)
        cf = 180 + 60 * np.sin(ct * 7)
        c = np.sin(2 * np.pi * np.cumsum(cf) / SR) * (np.sin(np.pi * ct / 0.6) ** 2) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 23 * ct)))
        i = int(s * SR)
        x[i:i + len(c)] += bandpass(c, 120, 900) * 0.35
    return reverb(fade(x, 0.5, 2.0), size=3, mix=0.4, damp=900)


# ———— 声呐 ping ————
def ping(f=1500):
    t = t_(0.5)
    x = np.sin(2 * np.pi * f * t) * np.exp(-t * 9) * np.minimum(1, t / 0.004)
    return reverb(x, size=3.5, mix=0.6, damp=4000)


# ———— 侧扫声呐：扫描时细碎的回波 ————
def sweep(dur=4.0):
    t = t_(dur)
    x = bandpass(noise(dur), 1800, 5200) * 0.2
    gate = (np.sin(2 * np.pi * 14 * t) > 0.6).astype(float)
    x *= 0.3 + 0.7 * lowpass(gate, 60)
    return reverb(fade(x, 0.2, 0.6), size=1.5, mix=0.3)


# ———— 落地：低频撞击 + 扬起泥沙的沙沙声 ————
def thud(dur=4.0, deep=1.0):
    t = t_(dur)
    f = 55 * deep * np.exp(-t * 3) + 28
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 2.2)
    silt = lowpass(noise(dur), 900) * np.exp(-t * 0.9) * np.minimum(1, t / 0.15) * 0.35
    return reverb(body + silt, size=2.5, mix=0.35, damp=1200)


# ———— 探照灯打开：继电器“咔哒”+ 电流嗡声起 ————
def lamp_on():
    t = t_(1.6)
    click = bandpass(noise(1.6), 1500, 6000) * np.exp(-t * 300) * 1.2
    click += bandpass(noise(1.6), 300, 2000) * np.exp(-np.maximum(0, t - 0.05) * 200) * (t > 0.05) * 0.8
    hum = (np.sin(2 * np.pi * 100 * t) + 0.5 * np.sin(2 * np.pi * 200 * t) + 0.2 * np.sin(2 * np.pi * 300 * t)) * 0.08 * np.minimum(1, t / 0.3) * np.exp(-t * 1.0)
    return reverb(click + hum, size=1.2, mix=0.25)


# ———— 上扬：落点之前 ————
def riser(dur=1.6, f0=200, f1=1400):
    t = t_(dur)
    k = (t / dur) ** 2
    f = f0 + (f1 - f0) * k
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    air = bandpass(noise(dur), 800, 9000) * 0.5
    x = (tone + air * (0.2 + 0.8 * k)) * (k ** 1.2)
    return fade(x, 0.05, 0.01)


# ———— 大字砸下：低音 + 一层细碎的亮 ————
def impact(dur=4.5, low=48, shimmer=0.25):
    t = t_(dur)
    f = low * (1 + 1.5 * np.exp(-t * 18))
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.3)
    sub = lowpass(noise(dur), 90) * np.exp(-t * 4) * 0.6
    sh = bandpass(noise(dur), 4000, 12000) * np.exp(-t * 2.5) * shimmer
    return reverb(body + sub + sh, size=3.5, mix=0.35, damp=2500)


# ———— 柔和的钟音（数字框亮起） ————
def chime(f=880):
    t = t_(3.0)
    x = sum(np.sin(2 * np.pi * f * m * t) * np.exp(-t * (2 + m)) / m for m in (1, 2.76, 5.4))
    return reverb(x * np.minimum(1, t / 0.005), size=3, mix=0.5, damp=6000)


# ———— 延时计数：由快到慢的轻嗒声 ————
def ticks(dur=3.0, n=26):
    x = np.zeros(int((dur + 0.1) * SR))
    times = dur * (np.linspace(0, 1, n) ** 1.8)
    for s in times:
        i = int(s * SR)
        tk = bandpass(noise(0.02), 2500, 8000) * np.exp(-t_(0.02) * 400)
        x[i:i + len(tk)] += tk * 0.5
    return reverb(x, size=0.8, mix=0.2)


# ———— 有机的“生长”声：一串细小的气泡和闪光 ————
def grow(dur=3.0, density=60, lo=1200, hi=4500):
    x = np.zeros(int(dur * SR))
    for _ in range(density):
        s = rng.uniform(0, dur - 0.2)
        f0 = rng.uniform(lo, hi)
        bt = t_(0.08)
        b = np.sin(2 * np.pi * f0 * bt * (1 + bt * 3)) * np.exp(-bt * 60)
        i = int(s * SR)
        x[i:i + len(b)] += b * rng.uniform(0.2, 0.6)
    return reverb(fade(x, 0.3, 0.6), size=2.5, mix=0.5, damp=6000)


# ———— 溶骨的嘶嘶声 ————
def fizz(dur=4.5):
    t = t_(dur)
    x = bandpass(noise(dur), 3000, 9000) * 0.25
    x *= 0.5 + 0.5 * lowpass(rng.standard_normal(len(t)) > 1.2, 30)
    return reverb(fade(x, 0.8, 1.0), size=1.5, mix=0.3)


# ———— 嗜硫段：一条细长的高音 + 很轻的冒泡 ————
def thin_tone(dur=10.5, f=2350):
    t = t_(dur)
    x = np.sin(2 * np.pi * f * t) * 0.15 + np.sin(2 * np.pi * (f * 1.5 + 0.4) * t) * 0.05
    x *= np.minimum(1, t / 2) * np.minimum(1, (dur - t) / 2)
    return reverb(x + grow(dur, 30, 300, 900).mean(1)[: len(x)] * 0.3, size=3, mix=0.5)


# ———— 憋着的那一段：心跳一样的低音 ————
def pulses(dur=6.3, beat=60 / 112.9):
    x = np.zeros(int(dur * SR))
    k = 0
    s = 0.0
    while s < dur - 0.6:
        bt = t_(0.5)
        p = np.sin(2 * np.pi * (48 + 30 * np.exp(-bt * 25)) * bt) * np.exp(-bt * 7)
        i = int(s * SR)
        x[i:i + len(p)] += p * (0.5 + 0.5 * k / 10)
        s += beat * 2
        k += 1
    return reverb(x, size=2, mix=0.3, damp=600)


# ———— 第二个落点：低音炸开 + 满天细碎的光 ————
def bloom():
    a = impact(5.0, 42, 0.1)
    g = grow(5.0, 260, 1500, 7000)
    n = min(len(a), len(g))
    return a[:n] + g[:n] * 0.6


# ———— 地图上的点亮起：一串极轻的“叮” ————
def dots(dur=3.0, n=40):
    x = np.zeros(int(dur * SR))
    for k in range(n):
        s = dur * k / n * 0.9
        f = 1800 + 900 * np.sin(k * 1.7)
        bt = t_(0.3)
        b = np.sin(2 * np.pi * f * bt) * np.exp(-bt * 18)
        i = int(s * SR)
        x[i:i + len(b)] += b * 0.3
    return reverb(x, size=3, mix=0.55, damp=7000)


# ———— 捕鲸：灯一盏盏熄灭 → 一声低沉的钟 ————
def toll():
    t = t_(6.0)
    x = sum(np.sin(2 * np.pi * 65 * m * t + m) * np.exp(-t * (0.5 + m * 0.4)) / m for m in (1, 2.0, 2.92, 4.1))
    return reverb(x * np.minimum(1, t / 0.01), size=5, mix=0.5, damp=1500)


# ———— 深潜器：推进器嗡声 ————
def motor(dur=6.0):
    t = t_(dur)
    x = (np.sin(2 * np.pi * 62 * t) + 0.6 * np.sin(2 * np.pi * 124 * t + 0.4) + 0.3 * np.sin(2 * np.pi * 186 * t)) * 0.3
    x *= 1 + 0.2 * np.sin(2 * np.pi * 7 * t)
    x += bandpass(noise(dur), 200, 1200) * 0.25
    return reverb(fade(x, 1.0, 2.0), size=2, mix=0.35, damp=1500)


if __name__ == '__main__':
    save('underwater', underwater(8.0), 0.45)
    save('surface_amb', underwater(13.0, bright=2.2, bubbles=40), 0.4)
    save('whale_call', whale_call(), 0.55)
    save('whale_call2', whale_call(3.5, 140, 90), 0.4)
    save('sink', sink(), 0.5)
    save('ping', ping(), 0.45)
    save('ping_lo', ping(1050), 0.4)
    save('sweep', sweep(), 0.3)
    save('thud', thud(), 0.7)
    save('thud_soft', thud(3.0, 0.8), 0.45)
    save('lamp_on', lamp_on(), 0.45)
    save('riser', riser(), 0.45)
    save('riser2', riser(1.6, 120, 900), 0.45)
    save('impact', impact(), 0.75)
    save('impact_soft', impact(4.0, 55, 0.4), 0.55)
    save('chime', chime(), 0.3)
    save('ticks', ticks(), 0.35)
    save('grow', grow(), 0.35)
    save('fizz', fizz(), 0.25)
    save('thin_tone', thin_tone(), 0.22)
    save('pulses', pulses(), 0.55)
    save('bloom', bloom(), 0.8)
    save('dots', dots(), 0.3)
    save('toll', toll(), 0.5)
    save('motor', motor(), 0.35)
