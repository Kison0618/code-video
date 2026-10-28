// 时间线：直接读 voice/v3/lines_timed.json（整段配音里每句的绝对起止秒）
// 画面全部按句 id 取时间：TL.L('008').t0 / TL.at('004','抬出')。换配音后重新对齐即可，不写死秒数。
'use strict';
const fs = require('fs');
const path = require('path');

const EP = path.join(__dirname, '..', '..');
const SRC = JSON.parse(fs.readFileSync(path.join(EP, 'voice', 'v3', 'lines_timed.json'), 'utf8'));
const AUDIO = path.join(EP, SRC.audio);

// 全集：001–036。章节卡 No.1 在 012 与 014 之间，No.2 在 024 与 026 之间
const ALL = SRC.lines.map(l => ({ id: l.id, role: l.role, text: l.text, t0: l.start, t1: l.end }));
const BY = Object.fromEntries(ALL.map(l => [l.id, l]));
const L = id => BY[id];
const LINES = ALL;
const CARD_T0 = L('012').t1 + 0.08;            // 章节卡 No.1：012 说完
const CARD2_T0 = L('024').t1 + 0.08;           // 章节卡 No.2：024 说完
const FIRST = +(L('014').t0 - 0.05).toFixed(2); // 前 1 分钟版本到 014 开口前（约 56.5 秒）
const DUR = +(L('036').t1 + 0.37).toFixed(2);  // 配音全长 3:23.8
const CARDS = [[CARD_T0, L('014').t0 - 0.05], [CARD2_T0, L('026').t0 - 0.05]];
const inCard = t => CARDS.some(([a, b]) => t >= a && t < b);

// 字幕文字（与配音一致；长句按标点切成一行一块）
const SUB = {};
const MAX = 16;
const PUN = /[，。：、？！；“”"\s]/g;
function chunks(s) {
  const parts = s.match(/[^。？！；]+[。？！；]*/g) || [s];
  const out = [];
  for (const p of parts) {
    if ([...p.replace(/[。？！；，]+$/, '')].length <= MAX) { out.push(p); continue; }
    const sub = p.match(/[^，、：]+[，、：]?/g);
    let cur = '';
    for (const q of sub) {
      if (cur && [...(cur + q).replace(/[，、：。]+$/, '')].length > MAX) { out.push(cur); cur = q; } else cur += q;
    }
    if (cur) out.push(cur);
  }
  // 太短的块并到前一块
  const merged = [];
  let carry = '';
  for (let k = 0; k < out.length; k++) {
    let c = carry + out[k]; carry = '';
    const n = [...c.replace(PUN, '')].length;
    if (!merged.length && n <= 3) { carry = c; continue; }      // 开头太短（如“啊？？？”）并到下一块
    // 以逗号结尾的短块（如“代价是，”）是后半句的开头：并到下一块，不挂在上一行末尾
    if (n <= 3 && /[，、：]$/.test(c) && k < out.length - 1) { carry = c; continue; }
    if (merged.length && n <= 3 && [...(merged[merged.length - 1] + c)].length <= MAX + 3) merged[merged.length - 1] += c;
    else merged.push(c);
  }
  if (carry) merged.push(carry);
  return merged;
}
const CAPS = [];
for (const l of LINES) {
  const cs = chunks(SUB[l.id] || l.text);
  const n = cs.map(c => Math.max(1, [...c.replace(PUN, '')].length));
  const tot = n.reduce((a, b) => a + b, 0);
  let t = l.t0;
  cs.forEach((c, i) => {
    const d = (l.t1 - l.t0) * n[i] / tot;
    CAPS.push({ id: l.id, s: c.replace(/[，、：；]$/, ''), t0: t, t1: t + d });
    t += d;
  });
}
CAPS.forEach((c, i) => { const nx = CAPS[i + 1], card = CARDS.find(([a]) => a > c.t0); c.out = Math.min(nx ? nx.t0 : 1e9, c.t1 + 0.8, card ? card[0] : 1e9, DUR); });

// 逐字时间：本版配音没有逐字时间戳，按句内字数线性估算（标点不计时）
function at(id, word, nth = 0) {
  const l = BY[id], s = l.text;
  let i = -1;
  for (let k = 0; k <= nth; k++) { i = s.indexOf(word, i + 1); if (i < 0) break; }
  if (i < 0) return l.t0;
  const cnt = str => [...str.replace(PUN, '')].length;
  return l.t0 + (l.t1 - l.t0) * cnt(s.slice(0, i)) / cnt(s);
}
const span = (a, b, pre = 0.3, post = 0.3) => [L(a).t0 - pre, L(b).t1 + post];

module.exports = { DUR, FIRST, LINES, L, CAPS, CARD_T0, CARD2_T0, CARDS, inCard, AUDIO, at, span };
if (require.main === module) {
  console.log('DUR', DUR, 'FIRST', FIRST, 'CARD_T0', CARD_T0.toFixed(2), 'CARD2_T0', CARD2_T0.toFixed(2), 'audio', AUDIO);
  for (const c of CAPS) console.log(c.id, c.t0.toFixed(2), c.out.toFixed(2), c.s);
}
