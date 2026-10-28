# BGM《代码小区》（audio/bgm.m4a，130 秒，73.8 BPM）铺满第一集 → audio/bgm_long.wav（48 kHz 立体声，未调音量，压低在 mix.js 里做）
#   1. 偏移：曲子 17.08 秒的鼓点落在 001“底层代码”芯片亮起（events.json marks.drop = TL.at('001','底层代码')）
#      片头之前那一小段直接从曲子相应位置（17.08 - drop）开始放，0.3 秒淡入
#   2. 循环：沿用 theory 的跳点（曲子 120.12 → 44.00，间隔 LAG = 76.12 秒，1 秒等功率交叉淡化），不断乐
#      跳点在 118.6–121.0 秒之间整体平移（间隔不变，节拍不错位），挑一个让每次交叉淡化都尽量落在句间停顿里的位置
#   3. 只做开头 0.3 秒淡入；片尾 2.5 秒淡出在 mix.js 里和压低包络一起做（只淡 BGM + 音效，不淡人声）
# 用法：python audio/bgm_prep.py [audio/events.json]
import json, os, sys, subprocess, wave
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
FF = r'F:\AI\For AI to use\codex2\AI-Coding-SuperVideos\.venv\Scripts\ffmpeg.exe'
SR = 48000
D = json.load(open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'events.json'), encoding='utf8'))
M = D['marks']; DUR = M['DUR']
DROP, LAG, XF, B_DEF, B_RANGE = 17.08, 76.12, 1.0, 120.12, (118.6, 121.0)
FADE_IN = 0.3
OFF = DROP - M['drop']                       # 片中时间 t ↔ 曲子时间 t + OFF

raw = subprocess.run([FF, '-v', 'error', '-i', os.path.join(HERE, 'bgm.m4a'), '-ac', '2', '-ar', str(SR), '-f', 'f32le', '-'], capture_output=True, check=True).stdout
src = np.frombuffer(raw, np.float32).reshape(-1, 2).T.astype(np.float64)
SONG = src.shape[1] / SR

# —— 选跳点：第 j 次跳在片中 tj = B - OFF + (j-1)*LAG；交叉淡化窗 [tj - XF/2, tj + XF/2] 里说话的时长越少越好 ——
speech = sorted(M['lines'].values())
def talk(a, b): return sum(max(0, min(b, s1) - max(a, s0)) for s0, s1 in speech)
def cost(B):
    n = int(np.ceil((DUR + OFF - B) / LAG)) if DUR + OFF > B else 0
    return sum(talk(B - OFF + j * LAG - XF / 2, B - OFF + j * LAG + XF / 2) for j in range(n))
cands = np.round(np.arange(B_RANGE[0], B_RANGE[1] + 1e-9, 0.01), 2)
B = float(min(cands, key=lambda b: (round(cost(b), 3), abs(b - B_DEF))))
A = B - LAG

n = int(round(DUR * SR)); t = np.arange(n) / SR
st = t + OFF                                  # 不循环时对应的曲子位置
k = np.where(st > B - XF / 2, np.ceil((st - (B - XF / 2)) / LAG), 0).astype(int)
def take(times):
    idx = np.clip(np.round(times * SR).astype(int), 0, src.shape[1] - 1)
    return src[:, idx]
out = take(st - k * LAG)
jumps = []
for j in range(1, int(k.max()) + 1):
    edge = B - XF / 2 + (j - 1) * LAG         # 展开时间上的第 j 个跳点窗起点
    m = (st >= edge) & (st < edge + XF)
    if not m.any(): continue
    u = (st[m] - edge) / XF
    a = take(st[m] - (j - 1) * LAG)           # 继续往下放
    b = take(st[m] - j * LAG)                 # 跳回去
    out[:, m] = a * np.cos(u * np.pi / 2) + b * np.sin(u * np.pi / 2)
    jumps.append(edge + XF / 2 - OFF)
assert (st - k * LAG).max() < SONG, '曲子不够长'

env = np.clip(t / FADE_IN, 0, 1)
out *= env
w = wave.open(os.path.join(HERE, 'bgm_long.wav'), 'wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((np.clip(out.T, -1, 1) * 32767).astype(np.int16).tobytes()); w.close()

def where(tj):
    for i, (s0, s1) in enumerate(speech):
        if s0 <= tj <= s1: return '说话中'
    return '停顿中'
info = {'OFF': round(OFF, 3), 'start_in_song': round(OFF, 3), 'drop_film': round(M['drop'], 3), 'loop_B': B, 'loop_A': round(A, 2),
        'jumps_film': [round(x, 2) for x in jumps], 'xf_talk_s': round(cost(B), 3), 'song_end_used': round(float((st - k * LAG).max()), 2)}
json.dump(info, open(os.path.join(HERE, 'bgm_info.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
print(f'bgm_long.wav  曲子从 {OFF:.2f}s 开始；17.08s 鼓点 → 片中 {M["drop"]:.3f}s；跳点 {B:.2f}→{A:.2f}；'
      + '，'.join(f'片中 {x:.2f}s（{where(x)}）' for x in jumps) + f'；交叉淡化内说话 {cost(B):.2f}s')
