// 《火柴人 VS 光标》总片（SCENE=cursor）：按顺序拼第 1–5 段（scene_cur1 … scene_cur5）
//   每段是独立的场景（各自体检）；这里只做两件事：按时间把画面交给对应的那一段，把每段登记的音效挪到总片的时间上。
'use strict';
const cues = require('./cues');

const NAMES = ['./scene_cur1', './scene_cur2', './scene_cur3', './scene_cur4', './scene_cur5'];
const parts = [];
let T = 0;
for (const n of NAMES) {
  const c0 = cues.list.length;
  const S = require(n);
  const added = cues.list.splice(c0);                                        // 这一段（和它加载的回忆用场景）登记的音效
  parts.push({ S, t0: T, cues: added });
  T += S.DUR;
}
// 回忆镜头会再加载第 1 段 / 上一集：那些模块已经在缓存里，不会重复登记；这里只保留每段自己的音效，挪到总片时间
for (const p of parts) for (const c of p.cues) cues.list.push({ ...c, t: +(c.t + p.t0).toFixed(4) });
const DUR = +T.toFixed(2);
const at = t => { let p = parts[0]; for (const q of parts) if (t >= q.t0) p = q; return p; };
function draw(ctx, t) { const p = at(t); p.S.draw(ctx, Math.min(t - p.t0, p.S.DUR - 1e-3)); }
function post(ctx, t, base) { const p = at(t); if (p.S.post) p.S.post(ctx, Math.min(t - p.t0, p.S.DUR - 1e-3), base); }
const bloomAt = t => { const p = at(t); return p.S.bloomAt ? p.S.bloomAt(t - p.t0) : 0; };

module.exports = { DUR, draw, post, bloomAt, parts: parts.map((p, i) => ({ scene: 'cur' + (i + 1), t0: +p.t0.toFixed(2), dur: p.S.DUR })) };
