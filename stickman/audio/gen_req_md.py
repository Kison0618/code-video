"""把 音效需求.json 转成 音效需求.md（两份内容一致；改需求只改 JSON，再跑这个脚本）"""
import json, os
here = os.path.dirname(os.path.abspath(__file__))
d = json.load(open(os.path.join(here, '音效需求.json')))
L = [f"# {d['title']}", '', '> 机器可读版本：`音效需求.json`（内容和本文件一致，由同一份数据生成）。你那边的程序可以直接读 JSON。', '', '## 交付方式', '']
for k, v in d['how_to_deliver'].items(): L.append(f'- **{k}**：{v}')
group = None
for s in d['sounds']:
    if s['group'] != group:
        group = s['group']; L += ['', f'## {group}']
    L += ['', f"### `{s['id']}` {s['name']}", '', f"- 用在：{s['used_for']}", f"- 对齐：{s['trigger']}"]
    dm = s['duration_ms']; L.append(f"- 时长：{dm[0]}–{dm[1]} ms" if isinstance(dm, list) else f"- 时长：{dm}")
    L += [f"- 性格：{s['character']}", f"- 避免：{s['avoid']}", f"- 目标峰值：{s['level_peak_dbfs']} dBFS（管线自动对齐）", f"- 变体：{s['variants']} 个"]
    if s.get('reference'): L.append(f"- 原片参考：{s['reference']}")
    if s.get('notes'): L.append(f"- 备注：{s['notes']}")
open(os.path.join(here, '音效需求.md'), 'w').write('\n'.join(L) + '\n')
print('wrote 音效需求.md,', len(d['sounds']), 'sounds')
