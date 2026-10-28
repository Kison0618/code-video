# 电平测量：ebur128 逐帧（100 ms）瞬时响度 M，按“说话段 / 间隙段”能量平均
# 用法：python audio/measure.py audio/_full_mix.wav [更多 wav…]
#   说话段 = events.json duck 块内（各块 s0–s1）；间隙段 = 块与块之间、片尾（≥ 0.5 秒的部分取中间，去掉包络斜坡）
import json, os, re, subprocess, sys
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
FF = r'F:\AI\For AI to use\codex2\AI-Coding-SuperVideos\.venv\Scripts\ffmpeg.exe'
D = json.load(open(os.path.join(HERE, 'events.json'), encoding='utf8'))
blocks = [(b['s0'], b['s1']) for b in D['duck']]
gaps = [(blocks[i][1], blocks[i + 1][0]) for i in range(len(blocks) - 1)]

def ebur(path):
    p = subprocess.run([FF, '-hide_banner', '-nostats', '-i', path, '-af', 'ebur128=framelog=info:peak=true', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf8', errors='ignore')
    num = lambda x: float(x) if re.fullmatch(r'-?[\d.]+', x) else -np.inf
    rows = [(float(m.group(1)), num(m.group(2)), num(m.group(3))) for m in re.finditer(r't:\s*([\d.]+)\s+TARGET:.*?M:\s*(\S+)\s+S:\s*(\S+)', p.stderr)]
    summ = p.stderr[p.stderr.rfind('Summary:'):]
    g = lambda k: float(re.search(k + r':\s*(-?[\d.]+)', summ).group(1))
    return np.array(rows), {'I': g('I'), 'LRA': g('LRA'), 'TP': g('Peak')}
def eavg(v):
    v = v[np.isfinite(v) & (v > -70)]
    return 10 * np.log10(np.mean(10 ** (v / 10))) if len(v) else float('nan')
def sel(rows, spans, trim=0.0):
    t = rows[:, 0] - 0.2                       # M 是 400 ms 窗，时间戳在窗尾：往前挪 0.2 秒对到窗中心
    m = np.zeros(len(t), bool)
    for a, b in spans: m |= (t >= a + trim) & (t <= b - trim)
    return rows[m, 1]

for p in sys.argv[1:]:
    rows, s = ebur(p)
    sp = eavg(sel(rows, blocks, 0.3)); gp = [eavg(sel(rows, [g], 0.15)) for g in gaps]
    print(f"{os.path.basename(p)}: 整体 I {s['I']:.1f} LUFS  LRA {s['LRA']:.1f} LU  真峰值 {s['TP']:.1f} dBFS  | 说话段 M 均值 {sp:.1f} LUFS  | 间隙段 "
          + '  '.join(f'{a:.2f}–{b:.2f}: {v:.1f}' for (a, b), v in zip(gaps, gp)))
