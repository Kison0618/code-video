# ep02 全片混音（沿用 mix02.py 的做法）：配音 + 山河转场音效（撕纸/翻页）+ 印章音效 + 电影片段原声
#   python mix_v5.py <输出wav>
# 时间全部从场景代码里取（node 打印 JSON），不写死秒数：
#   转场音效：wav 的 0.05 秒（trimStart）对齐转场开始；峰值压到配音峰值以下 6 dB（picks.json 约定）
#   印章：yinzhang 的能量峰对齐画面落章那一帧；“误判”低于人声峰值 4 dB，“301 医院”8 dB，其余 12 dB
#   电影原声：RMS 比人声（说话部分）低 18 dB，两端 0.2 秒淡入淡出
#   010 前换故事：配音本身留了停顿；撕纸声落在停顿里，停顿里不垫任何别的声音（半拍静音）
import json, sys, subprocess
import numpy as np, soundfile as sf, librosa

out = sys.argv[1]
SR = 48000
FF = r"F:\AI\For AI to use\codex2\AI-Coding-SuperVideos\.venv\Scripts\ffmpeg.exe"
SFX = 'assets/sfx/'
info = json.loads(subprocess.check_output(['node', '-e', """
const TL=require('./src/timeline'),S=require('./src/scenes'),F=require('./src/filmclip');
console.log(JSON.stringify({audio:TL.AUDIO,dur:TL.DUR,gl:S.SHOTS.filter(s=>s.gl).map(s=>[s.gl,s.a]),stamps:S.STAMPS,uses:F.USES}))
"""]).decode('utf8').strip().splitlines()[-1])
dur = info['dur']; N = int(dur * SR)
mix = np.zeros((2, N), np.float32)
if info['audio']:
    voice, _ = librosa.load(info['audio'], sr=SR, mono=False)
    voice = np.atleast_2d(voice)
    if voice.shape[0] == 1: voice = np.vstack([voice, voice])
    mix[:, :min(N, voice.shape[1])] = voice[:, :N]
    vpk = np.abs(voice).max()
    fr = np.sqrt(np.convolve(voice[0] ** 2, np.ones(SR // 10) / (SR // 10), 'same'))
    vrms = np.sqrt(np.mean(voice[0][fr > fr.max() * 0.1] ** 2))
    print('voice', info['audio'])
else:
    vpk, vrms = 0.7, 0.08
    print('（估算时间轴：没有配音，只混音效）')

def place(path, t, below_db, align=0.05):
    x, sr = sf.read(path, dtype='float32'); x = x.T
    if x.ndim == 1: x = np.vstack([x, x])
    x = x * (vpk * 10 ** (-below_db / 20) / np.abs(x).max())
    s = int(round((t - align) * SR))
    if s < 0: x = x[:, -s:]; s = 0
    e = min(N, s + x.shape[1])
    if e > s: mix[:, s:e] += x[:, :e - s]
    print(f'{path.split("/")[-1]:28s} @ {t:7.2f}s  peak {20*np.log10(vpk)-below_db:.1f} dBFS')

GL = {'fanye': 'wp_fanye_1.60_s15.wav', 'sizhi': 'wp_sizhi_1.80_s14.wav', 'moran': 'wp_moran_2.40_s3.wav', 'feibai': 'wp_feibai_2.00_s4.wav', 'shuaijing': 'wp_shuaijing_1.60_s5.wav', 'paixian': 'wp_paixian_2.20_s6.wav'}
# v7：用户说转场音效太吵，转场不加声音
# for gid, a in info['gl']: place(SFX + GL[gid], a, 6)

x, _ = sf.read(SFX + 'yinzhang_1.20_s2.wav', dtype='float32')
m = np.abs(x).max(1) if x.ndim > 1 else np.abs(x)
pk = np.convolve(m ** 2, np.ones(240) / 240, 'same').argmax() / SR
LEVEL = {'main': 4, 'mid': 8, 'minor': 12}
for s in info['stamps']: place(SFX + 'yinzhang_1.20_s2.wav', s['t'], LEVEL[s['level']], align=pk)

# v7：不用电影原声；加 BGM（精卫植物僵尸），全片不断乐，说话时压在人声下约 18 dB，句间空档抬到约 -12 dB
raw = subprocess.check_output([FF, '-v', 'error', '-i', 'assets/audio/bgm_精卫植物僵尸.m4a', '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'])
b = np.frombuffer(raw, np.float32).reshape(-1, 2).T.copy()
XF = int(3 * SR)                                   # 不够长就 3 秒交叉淡化循环
track = b.copy()
while track.shape[1] < N:
    ramp = np.linspace(0, 1, XF)
    head = track[:, :-XF]; tail = track[:, -XF:] * (1 - ramp) + b[:, :XF] * ramp
    track = np.concatenate([head, tail, b[:, XF:]], axis=1)
track = track[:, :N]
brms = np.sqrt(np.mean(track ** 2)) or 1e-6
# 人声包络：50 ms 帧，0.8 秒平滑
if info['audio']:
    v = np.abs(voice[0][:N]); hop = SR // 20
    fr = np.sqrt(np.add.reduceat(v ** 2, np.arange(0, len(v), hop)) / hop)
    speak = (fr > vrms * 0.25).astype(float)
    k = int(0.8 * 20); speak = np.convolve(speak, np.ones(k) / k, 'same')
    env_db = -18 * speak + -12 * (1 - speak)
    env = np.repeat(10 ** (env_db / 20), hop)[:N]
    if len(env) < N: env = np.pad(env, (0, N - len(env)), 'edge')
else:
    env = np.full(N, 10 ** (-15 / 20))
g = vrms / brms * env
fi, fo = int(1.0 * SR), int(2.0 * SR)
g[:fi] *= np.linspace(0, 1, fi); g[-fo:] *= np.linspace(1, 0, fo)
mix += track * g
print('bgm 精卫植物僵尸', f'{track.shape[1]/SR:.1f}s  speech -18 dB / gaps -12 dB')

mix[:, N - int(0.6 * SR):] *= np.linspace(1, 0, int(0.6 * SR))
peak = np.abs(mix).max()
if peak > 0.98: mix *= 0.98 / peak
sf.write(out, mix.T, SR, subtype='PCM_16')
print('wrote', out, f'{dur:.2f}s  peak {20*np.log10(max(1e-9, np.abs(mix).max())):.1f} dBFS')
