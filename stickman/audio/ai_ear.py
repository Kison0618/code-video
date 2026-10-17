# AI 耳朵：用 PANNs Cnn14（AudioSet 527 类声音分类）辅助判断"这是哪一类声音、和原片是不是同一类"
#
# 重要：这不是听感质量评分。它只回答"模型认为这段声音属于哪些类别、有多确定"，
# 以及"合成音和原片在模型眼里是不是同一类"。好不好听、像不像原片的味道，仍然要人耳判断。
#
# 运行环境（都在仓库外，不入库）：
#   虚拟环境  ~/.venvs/ai-ear（官方 CPU 版 torch + PyPI 的 panns-inference）
#   模型      ~/panns_data/Cnn14_mAP=0.431.pth  （Zenodo 10.5281/zenodo.3987831，CC-BY-4.0，见下方署名）
#             ~/panns_data/class_labels_indices.csv（AudioSet 官方类别表）
# 安装步骤见 stickman/README.md 的"AI 耳朵"一节。每次运行前都会校验权重的 MD5，并只用 weights_only=True 安全加载。
#
# 用法：
#   ~/.venvs/ai-ear/bin/python ai_ear.py --spec 片段表.json --out 报告       # 按片段表分析（可成对比较原片和合成）
#   ~/.venvs/ai-ear/bin/python ai_ear.py 音频或视频 --windows 2.0 0.5 --out 报告   # 整段按 2 秒窗口、0.5 秒步进打时间戳（1 秒窗口太短，见下方说明）
# 片段表格式：{"items": [{"name": "键盘/原片", "file": "x.mp4", "start": 15.2, "dur": 0.2, "group": "key", "source": "ref"}, ...]}
#   group 相同、source 分别为 ref / synth 的条目会成对比较。
# 输出：<out>.json（完整数据）和 <out>.md（文字报告）
#
# 模型署名：Kong, Q., Cao, Y., Iqbal, T., Wang, Y., Wang, W., Plumbley, M. D. "PANNs: Large-Scale Pretrained Audio Neural
# Networks for Audio Pattern Recognition", IEEE/ACM TASLP 2020. 预训练权重 CC-BY-4.0，https://zenodo.org/record/3987831
import argparse, hashlib, json, os, subprocess, sys, time
from pathlib import Path
import numpy as np

SR = 32000
DATA = Path.home() / 'panns_data'
WEIGHTS = DATA / 'Cnn14_mAP=0.431.pth'
WEIGHTS_MD5 = '541141fa2ee191a88f24a3219fff024e'      # Zenodo 记录里公布的值
WEIGHTS_SIZE = 327428481
LABELS = DATA / 'class_labels_indices.csv'
LABELS_SHA256 = 'cdd1049833c4b86127c2773ac0d14a2754b6a6d0d1798002ed5c66e699708429'
MIN_LEN = 2.0          # 比这短的片段要先处理（报告里会标出用了哪种办法）；时间轴窗口也建议 ≥ 2 秒
# 短片段的处理：Cnn14 用 10 秒片段训练，会在时间上做平均。0.1 秒的声音如果补数字静音，静音会压倒内容，
# 输出塌成和内容无关的先验（冒烟测试里 8 类短音效的输出一模一样）。默认改为"平铺"：只取有声部分，
# 每隔 80 ms 重复一次铺满 2 秒。代价是加进了周期性的节奏，可能把结果往 Music 一类推；可用 --short pad 改回补静音。
TILE_TOTAL, TILE_GAP = 2.0, 0.08
DISCLAIMER = ('这是声音类别 / 匹配的辅助判断（AudioSet 527 类分类模型的输出），不是听感质量评分；'
              '好不好听、味道对不对，需要人耳判断。')
# 和我们的音效相关、值得盯着看的 AudioSet 类别
WATCH = ['Typing', 'Computer keyboard', 'Clicking', 'Tick', 'Tick-tock', 'Walk, footsteps', 'Thump, thud', 'Explosion', 'Boom',
         'Whoosh, swoosh, swish', 'Beep, bleep', 'Ding', 'Chime', 'Boing', 'Plop', 'Pop', 'Bang', 'Slap, smack', 'Glass', 'Crack',
         'Breaking', 'Bouncing', 'Writing', 'Scratch', 'Rustle', 'Music', 'Silence', 'Sine wave', 'Buzzer', 'Electronic tuner']

def die(msg):
    print('✗ ' + msg, file=sys.stderr); sys.exit(1)

def file_hash(p, algo):
    h = hashlib.new(algo)
    with open(p, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 22), b''): h.update(chunk)
    return h.hexdigest()

def preflight():
    # 先确认模型文件齐全且未被改动。缺了就停下，不自动下载
    #（panns_inference 在 import 时会用 wget 自动下载类别表，所以必须先确认文件在位）
    if not LABELS.exists(): die(f'缺少 {LABELS}。按 README"AI 耳朵"一节放好再运行（本脚本不会自动下载）。')
    if file_hash(LABELS, 'sha256') != LABELS_SHA256: die(f'{LABELS} 的校验值不对，可能不是 AudioSet 官方类别表。')
    if not WEIGHTS.exists(): die(f'缺少 {WEIGHTS}。按 README"AI 耳朵"一节从 Zenodo 下载并校验后再运行。')
    if WEIGHTS.stat().st_size != WEIGHTS_SIZE or file_hash(WEIGHTS, 'md5') != WEIGHTS_MD5:
        die(f'{WEIGHTS} 的大小或 MD5 和 Zenodo 公布的不一致，拒绝加载。')

def load_model():
    import torch
    from panns_inference.models import Cnn14       # 只用到模型结构；类别表已经在位，不会触发下载
    ck = torch.load(WEIGHTS, map_location='cpu', weights_only=True)      # 安全加载：不执行任意 pickle
    m = Cnn14(sample_rate=SR, window_size=1024, hop_size=320, mel_bins=64, fmin=50, fmax=14000, classes_num=527)
    m.load_state_dict(ck['model'], strict=True)
    m.eval()
    labels = [l.split(',', 2)[2].strip().strip('"') for l in LABELS.read_text().splitlines()[1:]]
    return m, labels

def decode(path, start=None, dur=None):
    a = ['ffmpeg', '-v', 'error']
    if start is not None: a += ['-ss', str(start)]
    a += ['-i', str(path)]
    if dur is not None: a += ['-t', str(dur)]
    a += ['-vn', '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-']
    r = subprocess.run(a, capture_output=True)
    if r.returncode != 0: die(f'解码失败：{path}\n{r.stderr.decode(errors="ignore")}')
    return np.frombuffer(r.stdout, np.float32).astype(np.float32)

def metrics(x):
    # 时长 = 掉到峰值下 30 dB 的时刻；峰值、RMS 都是 dBFS（RMS 只算有声的部分）
    if len(x) < 64 or np.abs(x).max() < 1e-7: return {'dur_s': 0.0, 'peak_dbfs': None, 'rms_dbfs': None}
    w = np.lib.stride_tricks.sliding_window_view(np.pad(x, (0, 256)), 256)[::64]
    db = 20 * np.log10(np.sqrt((w ** 2).mean(1)) + 1e-12)
    ip = int(np.argmax(db)); below = np.where(db[ip:] < db[ip] - 30)[0]
    end = ip + (below[0] if len(below) else len(db) - ip)
    active = db[: end + 1] > db[ip] - 30
    return {'dur_s': round(end * 64 / SR, 3), 'peak_dbfs': round(float(20 * np.log10(np.abs(x).max())), 1),
            'rms_dbfs': round(float(10 * np.log10(np.mean(10 ** (db[: end + 1][active] / 10)))), 1)}

def infer(model, x, short='tile'):
    method = None
    if len(x) < MIN_LEN * SR:
        if short == 'tile':
            seg = x[: max(64, int(metrics(x)['dur_s'] * SR))]
            step, n = len(seg) + int(TILE_GAP * SR), int(TILE_TOTAL * SR)
            y = np.zeros(n, np.float32)
            for i in range(0, n, step): y[i:i + len(seg)] = seg[: n - i]
            x, method = y, f'平铺（有声部分每 {int(TILE_GAP*1000)} ms 重复，铺满 {TILE_TOTAL:g} 秒）'
        else:
            x, method = np.pad(x, (0, int(MIN_LEN * SR) - len(x))), f'补静音到 {MIN_LEN:g} 秒'
    p, emb = _forward(model, x)
    return p, emb, method, cos(p, prior(model, len(x))) < PRIOR_COS

def _forward(model, x):
    import torch
    with torch.no_grad():
        out = model(torch.from_numpy(np.ascontiguousarray(x[None, :])))
    return out['clipwise_output'][0].numpy(), out['embedding'][0].numpy()

# 无信息判定：输入太短（1 秒左右，Cnn14 经过 6 级下采样后只剩约 3 个时间步）或内容太稀疏时，
# 输出会塌成和同样长度的静音几乎一样的"先验"。冒烟测试实测：塌掉的输出和 1 秒静音的余弦是 1.000，
# 而 2 秒静音的输出就不一样了，所以必须拿"同样长度的静音"来比。余弦高于这个值就标成无信息。
PRIOR_COS = 0.98
WEAK_P = 0.2          # 最高置信度低于这个值：证据弱，报告里标"弱"
def tag(info, p1): return '（≈先验，无信息）' if not info else ('（弱）' if p1 < WEAK_P else '')
_PRIOR = {}
def prior(model, n):
    if n not in _PRIOR: _PRIOR[n] = _forward(model, np.zeros(n, np.float32))[0]
    return _PRIOR[n]

def top(p, labels, k=5):
    return [{'label': labels[i], 'p': round(float(p[i]), 3)} for i in np.argsort(p)[::-1][:k]]

def cos(a, b): return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b) + 1e-12))

def run_spec(model, labels, spec, short='tile'):
    res = []
    for it in spec['items']:
        x = decode(it['file'], it.get('start'), it.get('dur'))
        p, emb, method, info = infer(model, x, short)
        watch = {l: round(float(p[labels.index(l)]), 3) for l in WATCH if l in labels}
        res.append({**{k: it.get(k) for k in ('name', 'group', 'source', 'start', 'dur')}, 'file': os.path.basename(it['file']),
                    'short_clip_method': method, 'informative': info, 'metrics': metrics(x), 'top5': top(p, labels),
                    'watch': {k: v for k, v in sorted(watch.items(), key=lambda kv: -kv[1]) if v >= 0.01},
                    '_p': p, '_emb': emb})
    pairs = []
    for g in sorted({r['group'] for r in res if r.get('group')}):
        refs = [r for r in res if r['group'] == g and r['source'] == 'ref']
        syns = [r for r in res if r['group'] == g and r['source'] == 'synth']
        for a in refs:
            for b in syns:
                ta, tb = {t['label'] for t in a['top5']}, {t['label'] for t in b['top5']}
                pairs.append({'group': g, 'ref': a['name'], 'synth': b['name'], 'both_informative': a['informative'] and b['informative'], 'top5_overlap': sorted(ta & tb),
                              'class_vector_cosine': round(cos(a['_p'], b['_p']), 3), 'embedding_cosine': round(cos(a['_emb'], b['_emb']), 3)})
    for r in res: r.pop('_p'); r.pop('_emb')
    return {'items': res, 'pairs': pairs}

def run_windows(model, labels, path, win, hop):
    x = decode(path)
    out = []
    for i in range(0, max(1, len(x) - int(win * SR) + 1), int(hop * SR)):
        seg = x[i: i + int(win * SR)]
        p, _, _, info = infer(model, seg)
        out.append({'t0': round(i / SR, 2), 't1': round((i + len(seg)) / SR, 2), 'informative': info, 'metrics': metrics(seg), 'top3': top(p, labels, 3)})
    return {'file': os.path.basename(str(path)), 'window_s': win, 'hop_s': hop, 'windows': out}

def md_report(rep):
    L = ['# AI 耳朵报告（PANNs Cnn14）', '', f'> {DISCLAIMER}', '',
         f'标记：（≈先验，无信息）= 输出和同样长度的静音几乎一样，不能用；（弱）= 最高置信度 < {WEAK_P}，只能当线索。', '',
         f"- 模型：{rep['model']['name']}，权重 MD5 已校验（{rep['model']['weights_md5']}），weights_only 安全加载",
         f"- 运行：{rep['created']}，CPU，用时 {rep['seconds']} 秒", '']
    if 'items' in rep:
        L += ['## 各片段的类别（前 5）', '', '短于 2 秒的片段先做了处理（见最后一列），原因见 ai_ear.py 顶部的说明。', '',
              '| 片段 | 来源 | 开始 s | 时长 s | 峰值 dBFS | RMS dBFS | 前 5 类别（置信度） | 短片段处理 |', '|---|---|---|---|---|---|---|---|']
        for r in rep['items']:
            m = r['metrics']
            L.append(f"| {r['name']}{tag(r['informative'], r['top5'][0]['p'])} | {r.get('source') or ''} | {r.get('start') if r.get('start') is not None else ''} | {m['dur_s']} | {m['peak_dbfs']} | {m['rms_dbfs']} | "
                     + '；'.join(f"{t['label']} {t['p']:.2f}" for t in r['top5']) + f" | {r['short_clip_method'] or ''} |")
        if rep.get('pairs'):
            L += ['', '## 原片 vs 合成（同一组）', '', '类别向量余弦 / 嵌入余弦：越接近 1，模型越认为是同一类声音（不代表好不好听）。'
                  '任一方"≈先验"时这一行没有参考价值。', '',
                  '| 组 | 原片 | 合成 | 前 5 重合的类别 | 类别向量余弦 | 嵌入余弦 |', '|---|---|---|---|---|---|']
            for p in rep['pairs']:
                L.append(f"| {p['group']}{'' if p['both_informative'] else '（无参考价值）'} | {p['ref']} | {p['synth']} | {'、'.join(p['top5_overlap']) or '（无）'} | {p['class_vector_cosine']} | {p['embedding_cosine']} |")
    if 'windows' in rep:
        L += ['', f"## 时间轴（{rep['file']}，{rep['window_s']} 秒窗口、{rep['hop_s']} 秒步进）", '', '| 时间 s | 峰值 dBFS | 前 3 类别 |', '|---|---|---|']
        for w in rep['windows']:
            L.append(f"| {w['t0']}–{w['t1']} | {w['metrics']['peak_dbfs']} | " + tag(w['informative'], w['top3'][0]['p'])
                     + '；'.join(f"{t['label']} {t['p']:.2f}" for t in w['top3']) + ' |')
    L += ['', '---', '模型署名：Kong et al., "PANNs: Large-Scale Pretrained Audio Neural Networks for Audio Pattern Recognition", IEEE/ACM TASLP 2020；权重 CC-BY-4.0（zenodo.org/record/3987831）。']
    return '\n'.join(L) + '\n'

def main():
    ap = argparse.ArgumentParser(description='AI 耳朵：PANNs Cnn14 声音类别辅助判断（不是听感质量评分）')
    ap.add_argument('input', nargs='?', help='音频或视频文件（--windows 模式）')
    ap.add_argument('--spec', help='片段表 JSON')
    ap.add_argument('--windows', nargs=2, type=float, metavar=('窗口秒', '步进秒'))
    ap.add_argument('--out', required=True, help='报告路径前缀（生成 .json 和 .md）')
    ap.add_argument('--short', choices=['tile', 'pad'], default='tile', help='短于 2 秒的片段：tile 平铺（默认）/ pad 补静音')
    a = ap.parse_args()
    if not a.spec and not (a.input and a.windows): ap.error('需要 --spec，或者 输入文件 + --windows')
    t0 = time.time()
    preflight()
    model, labels = load_model()
    rep = {'disclaimer': DISCLAIMER, 'created': time.strftime('%Y-%m-%d %H:%M:%S'),
           'model': {'name': 'PANNs Cnn14 (AudioSet, 527 classes, 32 kHz)', 'weights': WEIGHTS.name, 'weights_md5': WEIGHTS_MD5,
                     'source': 'https://zenodo.org/record/3987831', 'license': 'CC-BY-4.0'}}
    rep['short_clip_handling'] = a.short
    if a.spec: rep.update(run_spec(model, labels, json.load(open(a.spec, encoding='utf-8')), a.short))
    if a.windows: rep.update(run_windows(model, labels, a.input, *a.windows))
    rep['seconds'] = round(time.time() - t0, 1)
    Path(a.out).parent.mkdir(parents=True, exist_ok=True)
    json.dump(rep, open(a.out + '.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    open(a.out + '.md', 'w', encoding='utf-8').write(md_report(rep))
    print(f'✓ {a.out}.json / {a.out}.md（{rep["seconds"]} 秒）')

if __name__ == '__main__':
    main()
