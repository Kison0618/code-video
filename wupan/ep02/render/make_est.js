// v6 估算：C 4.9 字/秒，B8 5.3 字/秒，同人间隔 0.3s，换人间隔 0.35s。
'use strict';
const fs = require('fs');
const path = require('path');
const EP = path.join(__dirname, '..');
const md = fs.readFileSync(path.join(EP, '文案_v7.md'), 'utf8');
const lines = [];
for (const row of md.split(/\r?\n/)) {
  const m = row.match(/^\|\s*(\d{3})\s*\|/); if (!m) continue;
  const cells = row.split('|').slice(2).map(s => s.trim()).filter(Boolean);
  lines.push({ id: m[1], role: cells[0], text: cells[1] });
}
const units = s => [...s].filter(c => /[\u4e00-\u9fff]/.test(c)).length + (s.match(/[A-Za-z]+/g) || []).length;
const B8 = new Set(['001','002','003','007','014','024','031','032','038','043','044']);
let t = 0.3;
const speaker = l => (l.role === '假警察' || l.role === '实验员') ? l.role : B8.has(l.id) ? 'B8' : 'C';
const out = lines.map((l, i) => {
  const voice = speaker(l), d = units(l.text) / (voice === 'B8' ? 5.3 : 4.9);
  const o = { ...l, voice, start: +t.toFixed(2), end: +(t + d).toFixed(2), align: 'even' };
  t += d + (lines[i + 1] && speaker(lines[i + 1]) !== voice ? 0.35 : 0.3);
  return o;
});
const dst = path.join(EP, 'voice', 'v7', 'lines_timed_est.json');
fs.mkdirSync(path.dirname(dst), { recursive: true });
fs.writeFileSync(dst, JSON.stringify({ audio: null, estimated: true, duration: +t.toFixed(2), lines: out }, null, 1));
console.log(`${out.length} 句，${t.toFixed(1)} 秒 → ${dst}`);
