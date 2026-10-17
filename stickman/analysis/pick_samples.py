# 从你的音效素材库里，按原片实测参数自动挑声音
# 用法：python pick_samples.py <素材库文件夹> [每类几个，默认 6] [--apply]
#   不加 --apply：只出报告 audio/samples/挑选报告.md（每类候选按相似度排好，附文件路径，方便你先试听）
#   加 --apply：把每类前几名复制进 audio/samples/<类型>/，之后 node build.js 就会自动用这些录音代替合成音
# 量法和 analysis/ref_spectra.py 完全一样：48 个对数频带的频谱包络 + 长度（掉到峰值下 30 dB）+ 频谱重心。
# 评分 = 频谱包络相关系数 − 长度偏差 − 亮度偏差（都按对数算），越高越像原片。
#
# 只挑"真实录音更好"的类型（键盘、脚步、身体着地、电脑落地、小物件落地、选中）；
# 运行 / 打印结果 / 碰代码 / 报错 / 光标这些是原片设计出来的界面音，合成版本已经按实测对齐，不用素材。
# 原片没有可测量参照的类型（爆炸、呼呼声、踢、摔、衣服声）用描述性目标（长度、亮度的范围）。
import sys, os, json, glob, shutil, subprocess
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
AUD = os.path.join(HERE, '..', 'audio')
lib = sys.argv[1]
topn = int(next((a for a in sys.argv[2:] if a.isdigit()), 6))
apply = '--apply' in sys.argv
REF = json.load(open(os.path.join(AUD, 'ref_spectra.json')))
BANDS = np.array(REF['bands_hz'])

MEASURED = ['key', 'step', 'body', 'laptop', 'select']          # 有原片实测指纹
# 没有原片参照的：给长度（秒）、重心（Hz）的范围，以及包络形状（'hit' 起音快、'swell' 中间最响）
DESCRIBED = {
    'tick':   {'dur': (0.03, 0.12), 'cen': (150, 3000), 'shape': 'hit'},
    'whoosh': {'dur': (0.25, 0.9), 'cen': (800, 5000), 'shape': 'swell'},
    'kick':   {'dur': (0.08, 0.35), 'cen': (200, 2000), 'shape': 'hit'},
    'thud':   {'dur': (0.15, 0.7), 'cen': (60, 600), 'shape': 'hit'},
    'boom':   {'dur': (1.5, 5.0), 'cen': (300, 3000), 'shape': 'hit'},
    'rustle': {'dur': (0.15, 0.8), 'cen': (2500, 9000), 'shape': 'swell'},
}
KEYWORDS = {   # 文件名里有这些词会小幅加分（不同素材包命名不一，只作参考）
    'key': ['key', 'type', 'typing', 'keyboard', 'click'], 'step': ['step', 'foot', 'walk'], 'body': ['body', 'fall', 'knee', 'land', 'thump'],
    'laptop': ['plastic', 'laptop', 'drop', 'clack', 'impact'], 'select': ['select', 'click', 'tick', 'ui'], 'tick': ['tick', 'tap', 'drop', 'small'],
    'whoosh': ['whoosh', 'swoosh', 'swish', 'woosh'], 'kick': ['punch', 'hit', 'kick', 'impact'], 'thud': ['thud', 'body', 'fall', 'heavy'],
    'boom': ['explosion', 'explode', 'boom', 'blast'], 'rustle': ['cloth', 'rustle', 'fabric', 'foley'],
}

def decode(path, maxdur=6.0):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-t', str(maxdur), '-i', path, '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

def measure(x):
    if len(x) < 512 or np.abs(x).max() < 1e-4: return None
    e = np.abs(x); i = max(0, int(np.argmax(e > e.max() * 0.1)) - int(0.002 * SR)); x = x[i:]
    w = np.lib.stride_tricks.sliding_window_view(np.pad(x, (0, 256)), 256)[::64]
    db = 20 * np.log10(np.sqrt((w ** 2).mean(1)) + 1e-12); ip = int(np.argmax(db))
    below = np.where(db[ip:] < db[ip] - 30)[0]
    dur = (ip + (below[0] if len(below) else len(db) - ip)) * 64 / SR
    seg = x[: max(512, int(dur * SR))]
    n = 1 << 15
    P = np.abs(np.fft.rfft(seg * np.hanning(len(seg)), n)) ** 2; f = np.fft.rfftfreq(n, 1 / SR)
    bands = np.array([10 * np.log10(P[(f >= a) & (f < b)].mean() + 1e-20) for a, b in zip(BANDS[:-1], BANDS[1:])])
    cen = float((f * P).sum() / P.sum())
    peak_pos = ip * 64 / SR / max(dur, 1e-3)               # 最响的位置在声音的前段还是中段
    return {'dur': dur, 'cen': cen, 'bands': bands - bands.max(), 'peak_pos': peak_pos}

MIN_SCORE = {True: 0.5, False: 0.6}    # 低于这个分数的不用（这一类继续用合成音）

def corr(a, b):
    a, b = a - a.mean(), b - b.mean(); return float((a * b).sum() / (np.sqrt((a * a).sum() * (b * b).sum()) + 1e-12))
def out_of(v, lo, hi): return 0 if lo <= v <= hi else abs(np.log(v / (lo if v < lo else hi)))

files = sorted(p for e in ('wav', 'mp3', 'ogg', 'flac', 'aif', 'aiff', 'WAV', 'MP3', 'OGG') for p in glob.glob(os.path.join(lib, '**', f'*.{e}'), recursive=True))
print(f'扫描 {len(files)} 个文件……')
feats = {}
for k, p in enumerate(files):
    m = measure(decode(p))
    if m: feats[p] = m
    if (k + 1) % 200 == 0: print(f'  {k + 1}/{len(files)}')

def score(kind, m, path):
    name = os.path.basename(path).lower()
    bonus = 0.05 if any(w in name for w in KEYWORDS.get(kind, [])) else 0
    if kind in MEASURED:
        r = REF['scalars'][kind]
        return corr(m['bands'], np.array(REF['spectra'][kind])) - 0.35 * abs(np.log(m['dur'] / r['dur'])) - 0.35 * abs(np.log(m['cen'] / r['centroid'])) + bonus
    d = DESCRIBED[kind]
    shape = (m['peak_pos'] < 0.2) if d['shape'] == 'hit' else (0.2 <= m['peak_pos'] <= 0.7)
    return 1 - out_of(m['dur'], *d['dur']) - out_of(m['cen'], *d['cen']) - (0 if shape else 0.4) + bonus

lines = ['# 素材挑选报告', '', f'素材库：`{lib}`，有效文件 {len(feats)} 个。每类按"像原片的程度"排序，分数越高越像。', '']
for kind in MEASURED + list(DESCRIBED):
    ranked = sorted(((score(kind, m, p), p, m) for p, m in feats.items()), reverse=True)[: max(topn, 12)]
    ref = REF['scalars'].get(kind)
    lines += [f'## {kind}', '', f'采用门槛：{MIN_SCORE[kind in MEASURED]}。目标：' + (f"长度 {ref['dur']*1000:.0f} ms，重心 {ref['centroid']} Hz（原片实测）" if ref else
              f"长度 {DESCRIBED[kind]['dur'][0]}–{DESCRIBED[kind]['dur'][1]} 秒，重心 {DESCRIBED[kind]['cen'][0]}–{DESCRIBED[kind]['cen'][1]} Hz"), '',
              '| # | 分数 | 长度 ms | 重心 Hz | 文件 |', '|---|---|---|---|---|']
    for i, (sc, p, m) in enumerate(ranked):
        lines.append(f"| {i + 1} | {sc:.2f} | {m['dur']*1000:.0f} | {m['cen']:.0f} | `{os.path.relpath(p, lib)}` |")
    lines.append('')
    if apply:
        dst = os.path.join(AUD, 'samples', kind); os.makedirs(dst, exist_ok=True)
        for f in glob.glob(os.path.join(dst, '*')): os.remove(f)
        good = [(sc, p, m) for sc, p, m in ranked[:topn] if sc >= MIN_SCORE[kind in MEASURED]]
        for i, (sc, p, m) in enumerate(good):
            shutil.copy(p, os.path.join(dst, f'{i + 1:02d}_{os.path.basename(p)}'))
        if not good: os.rmdir(dst)
        print(f'  {kind:7s} 采用 {len(good)} 个' + ('' if good else '（没有够像的，继续用合成音）'))
os.makedirs(os.path.join(AUD, 'samples'), exist_ok=True)
rep = os.path.join(AUD, 'samples', '挑选报告.md')
open(rep, 'w', encoding='utf-8').write('\n'.join(lines))
print('报告 →', rep, '（已复制到 audio/samples/<类型>/）' if apply else '（加 --apply 复制前几名）')
