// 导出某个场景的"音效时间表"：每个声音在第几秒、用哪个 id（对应 audio/音效需求.json）、力度多少。
// 你那边做声音时对着它听画面；也会列出时间表里用到、但需求表里还没有的 id。
//   SCENE=v4 node src/tools/cue_sheet.js      → stickman/audio/时间表/v4.json 和 v4.md
'use strict';
const fs = require('fs'), path = require('path');
const { DUR } = require('../frame');
const cues = require('../cues');
const scene = process.env.SCENE || 'v1';
const req = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../audio/音效需求.json'), 'utf8'));
const byId = Object.fromEntries(req.sounds.map(s => [s.id, s]));
const ALIAS = { enter: 'key_enter', laptop: 'laptop_drop', kick: 'impact_light', click: 'select', pop: 'output', grab: 'rustle', hit: 'ground_shock' };
const idOf = c => { if (c.type === 'blink') return c.on ? 'blink_on' : 'blink_off'; if (c.type === 'step' && c.run) return 'step_run'; return ALIAS[c.type] || c.type; };
const list = [...cues.list].sort((a, b) => a.t - b.t).map(c => ({ t: c.t, id: idOf(c), v: c.v ?? 1, dur: c.dur, note: c.note }));
const outDir = path.join(__dirname, '../../../audio/时间表');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, `${scene}.json`), JSON.stringify({ scene, dur: DUR, cues: list }, null, 1));
const count = {}; for (const c of list) count[c.id] = (count[c.id] || 0) + 1;
const missing = Object.keys(count).filter(id => !byId[id] && id !== 'music');
const L = [`# 音效时间表：${scene}（${DUR} 秒，共 ${list.length} 个声音）`, '',
  '由 `render/src/tools/cue_sheet.js` 从场景代码自动导出；时间是成片里的秒数。id 对应 `audio/音效需求.json`，做好的声音放进 `audio/samples/<id>/` 就会自动替换。', '',
  '## 用到的声音', '', '| id | 名称 | 次数 |', '|---|---|---|',
  ...Object.entries(count).sort((a, b) => b[1] - a[1]).map(([id, n]) => `| \`${id}\` | ${byId[id]?.name || (id === 'music' ? '配乐（占位）' : '**需求表里还没有**')} | ${n} |`), ''];
if (missing.length) L.push(`> 需求表里还没有的 id：${missing.join('、')}`, '');
L.push('## 逐个时间点', '', '| 时间 (s) | id | 名称 | 力度 | 备注 |', '|---|---|---|---|---|');
for (const c of list) L.push(`| ${c.t.toFixed(2)} | \`${c.id}\` | ${byId[c.id]?.name || ''} | ${(+c.v).toFixed(2)} | ${[c.dur ? `持续 ${(+c.dur).toFixed(2)} s` : '', c.note || ''].filter(Boolean).join('；')} |`);
fs.writeFileSync(path.join(outDir, `${scene}.md`), L.join('\n') + '\n');
console.log(`wrote audio/时间表/${scene}.{json,md}: ${list.length} cues, ${Object.keys(count).length} ids` + (missing.length ? `, missing: ${missing}` : ''));
