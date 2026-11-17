'use strict';
// 《ESFJ》v9 总装（竖屏 KW=1080 KH=1920）。每章一个文件 ESS_A..ESS_G，各自管自己的场景和章内转场；
// 章与章之间 0.7 秒：上一章继续演（它的结尾已经把镜头推向某个光源 / 物件），下一章从同一处光里淡出来，
// 不用统一的擦除。分段文件缺失时画暗底占位。字幕在这里统一画。
const X = require('./ehk');
const { vs } = X;
const { K } = X;
const { W, H, clamp, smooth, lerp } = K;
const { GOLD, TEAL, RED } = X;
const SKY = [120, 200, 236];
const load = n => { try { return require('./' + n); } catch (e) { if (process.env.EB_STRICT || (e.code === 'MODULE_NOT_FOUND' && !String(e.message).includes(n))) throw e; if (e.code !== 'MODULE_NOT_FOUND') console.error('[ECX] ' + n + ' 加载失败：' + e.message); return null; } };
const START = [['ESS_A', 0], ['ESS_B', vs('B01') - 0.9], ['ESS_C', vs('C01') - 0.9], ['ESS_D', vs('D01') - 0.9], ['ESS_E', vs('E01') - 0.9], ['ESS_F', vs('F01') - 0.9], ['ESS_G', vs('G01') - 0.9]];
const PARTS = START.map(([n, t0]) => ({ n, t0, m: load(n) }));
const KEYS = [['热水', GOLD], ['供给者', GOLD], ['男妈妈', SKY], ['ESFJ', SKY], ['照顾人', GOLD], ['吃饱穿暖', GOLD], ['归属感', GOLD],
  ['护卫者', GOLD], ['最随和', GOLD], ['最好交际', GOLD], ['可靠', GOLD], ['帮得上忙', GOLD], ['值得尊重', GOLD], ['信赖权威', SKY], ['珍视感恩', GOLD], ['安全感', SKY], ['十个人', GOLD],
  ['天生的主人', GOLD], ['尽兴而归', GOLD], ['名字', GOLD], ['离不开人群', GOLD], ['不踏实', SKY], ['陌生人', GOLD], ['具体的事', GOLD], ['最快', GOLD], ['哲学', SKY], ['心理学', SKY], ['安静', SKY], ['权威', GOLD], ['念旧', GOLD], ['出什么事', RED],
  ['敏感', GOLD], ['写在脸上', GOLD], ['当真', GOLD], ['批评', RED], ['消沉', RED], ['我需要你', GOLD], ['打起精神', GOLD], ['认可', GOLD], ['冷落', RED], ['怪自己', RED],
  ['长处', GOLD], ['团队合作', GOLD], ['不知疲倦', GOLD], ['会卖东西', GOLD], ['热心', GOLD], ['完美的下属', GOLD], ['和人打交道', GOLD],
  ['妥妥当当', GOLD], ['意见一致', SKY], ['忠诚', GOLD], ['多情', GOLD], ['一个都不会忘', GOLD], ['ISTP', TEAL], ['自由', TEAL], ['冒险', TEAL], ['迎他们回家', GOLD], ['互补', GOLD],
  ['委屈自己', GOLD], ['严格', SKY], ['骄傲', GOLD], ['尴尬', RED], ['被需要', GOLD], ['被看见', GOLD], ['放在心上', GOLD], ['谢谢', GOLD]];
const SUBS = X.buildSubs(KEYS);
const last = PARTS[PARTS.length - 1].m;
const END = last && last.END ? last.END : X.VJ.end + 6;
const DUR = +(process.env.EI_DUR || END);
const TR = 0.7;
function idx(t) { let k = 0; PARTS.forEach((q, i) => { if (t >= q.t0) k = i; }); return k; }
function drawPart(ctx, p, t) {
  ctx.save();
  if (p.m) p.m.draw(ctx, t); else { ctx.fillStyle = '#100a0e'; ctx.fillRect(0, 0, W, H); K.text(ctx, p.n + ' 待写', W / 2, H / 2, { size: 60, color: [200, 190, 180] }); }
  ctx.restore();
}
let BUF = null;
const SK = require('./ESS_kit');
const NE = require('./ESS_neon');
// 维度小牌：念到对应特质时，字幕上方弹出一枚（呼应片名处的「E 外向 · S 实感 · F 情感 · J 判断」）
const CHIPS = [[X.at('B04', '最随和'), 'E', '外向 · 爱交际'], [X.vs('C06'), 'S', '实感 · 只聊具体的事'], [X.vs('D01'), 'F', '情感 · 写在脸上'], [X.at('F02', '该做'), 'J', '判断 · 有一套规矩']];
function draw(ctx, t) {
  SK.freeLayers(); // 离屏层每帧回收（以前没回收：每帧都新开画布，长片会把内存吃光）
  const k = idx(t), p = PARTS[k], u = k > 0 ? (t - p.t0) / TR : 1;
  if (u >= 1) { drawPart(ctx, p, t); return; }
  drawPart(ctx, PARTS[k - 1], t);
  if (!BUF) BUF = new K.Canvas(W, H);
  const bx = BUF.getContext('2d'); bx.reset(); drawPart(bx, p, t);
  // 章与章之间：一道发光的斜线扫过，线后面是下一章（方向逐章交替）；线两侧各有一小段柔化
  const e = smooth(clamp(u, 0, 1)), dir = k % 2 ? 1 : -1, span = W + H * 0.45, edge = lerp(-H * 0.45 - 120, W + 120, e), slope = H * 0.45;
  const P = y => dir > 0 ? edge + slope * (1 - y / H) : W - (edge + slope * (1 - y / H));
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.beginPath();
  if (dir > 0) { ctx.moveTo(-10, -10); ctx.lineTo(P(0), -10); ctx.lineTo(P(H), H + 10); ctx.lineTo(-10, H + 10); } else { ctx.moveTo(W + 10, -10); ctx.lineTo(P(0), -10); ctx.lineTo(P(H), H + 10); ctx.lineTo(W + 10, H + 10); }
  ctx.closePath(); ctx.clip(); ctx.drawImage(BUF, 0, 0); ctx.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 0.35 * Math.sin(Math.PI * e); ctx.drawImage(BUF, 0, 0); ctx.restore();
  if (e > 0.01 && e < 0.99) NE.line(ctx, [[P(-40), -40], [P(H + 40), H + 40]], 1, [255, 226, 180], 5, Math.sin(Math.PI * e), { head: false });
}
function subBand(ctx, a = 1) {
  const y0 = 1300, y1 = 1600, g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(6,4,10,0)'); g.addColorStop(0.3, `rgba(6,4,10,${0.72 * a})`); g.addColorStop(0.7, `rgba(6,4,10,${0.72 * a})`); g.addColorStop(1, 'rgba(6,4,10,0)');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); ctx.restore();
}
function over(ctx, t) {
  const k = idx(t), p = PARTS[k];
  if (k > 0 && t - p.t0 < TR && PARTS[k - 1].m && PARTS[k - 1].m.over) { ctx.save(); ctx.globalAlpha = 1 - smooth((t - p.t0) / TR); PARTS[k - 1].m.over(ctx, t); ctx.restore(); }
  if (p.m && p.m.over) { ctx.save(); if (k > 0) ctx.globalAlpha = smooth(clamp((t - p.t0) / TR, 0, 1)); p.m.over(ctx, t); ctx.restore(); }
  if (t < X.VJ.end + 0.5) subBand(ctx);
  for (const [a, k1, v] of CHIPS) { const al = K.vis(t, a - 0.1, a + 2.6, 0.01, 0.4); if (al > 0.003) NE.tags(ctx, [[k1, v]], 1270, smooth(clamp((t - a + 0.1) / 0.35)), NE.TEAL, al); }
  X.drawSubs(ctx, t, SUBS);
}
module.exports = { DUR, END, draw, over, SUBS: [], bloom: 0.18, vig: 0.5, START };
