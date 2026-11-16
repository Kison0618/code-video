'use strict';
// 《ESFJ》v7 总装（竖屏 KW=1080 KH=1920）。开场 EB1（剖面楼，A01–B03）沿用 v6；之后每章一个专门设计的场景 EC2..EC7。
// 段与段之间统一 0.6 秒转场：上一段定格在交界时刻，下一段从斜向柔边擦入 + 轻微推近，交界处一道暖光扫过。
// 分段文件缺失时画暗底占位，方便单段预览。时钟角标只在 EB1 里显示；字幕在这里统一画。
const X = require('./ehk');
const { vs } = X;
const { K } = X;
const { W, H, clamp, smooth, prog, glow } = K;
const { GOLD, TEAL, RED } = X;
const SKY = [92, 190, 220];
const load = n => { try { return require('./' + n); } catch (e) { if (process.env.EB_STRICT || (e.code === 'MODULE_NOT_FOUND' && !String(e.message).includes(n))) throw e; if (e.code !== 'MODULE_NOT_FOUND') console.error('[ECX] ' + n + ' 加载失败：' + e.message); return null; } };
const START = [
  ['EB1', 0], ['EC2', vs('B04') - 0.05], ['EC3', vs('C01') - 0.05], ['EC4', vs('D01') - 0.05],
  ['EC5', vs('E01') - 0.05], ['EC6', vs('F01') - 0.05], ['EC7', vs('G01') - 0.05],
];
const PARTS = START.map(([n, t0]) => ({ n, t0, m: load(n) }));
const KEYS = [['供给者', GOLD], ['蓝妈妈', SKY], ['男妈妈', SKY], ['ESFJ', SKY], ['照顾人', GOLD], ['归属感', GOLD],
  ['护卫者', GOLD], ['监管者', SKY], ['检查者', SKY], ['保护者', SKY], ['各司其职', SKY], ['瑕疵', SKY], ['安全', SKY], ['及时送到', GOLD], ['随和', GOLD], ['好交际', GOLD], ['十个人', GOLD],
  ['天生的主人', GOLD], ['尽兴', GOLD], ['记住了名字', GOLD], ['责任', GOLD], ['具体的事', GOLD], ['最快', GOLD], ['沉默', SKY], ['权威', GOLD], ['传统', GOLD], ['出事', RED],
  ['敏感', GOLD], ['写在脸上', GOLD], ['在意形象', GOLD], ['批评', RED], ['认可', GOLD], ['我需要你', GOLD], ['强心剂', GOLD], ['怪自己', RED],
  ['长处', GOLD], ['眼里有人', GOLD], ['对同事', SKY], ['对顾客', SKY], ['对上司', SKY], ['渴望', GOLD], ['被认可', GOLD], ['看得见', GOLD], ['谢谢', GOLD], ['配合', GOLD], ['不知疲倦', GOLD], ['军需官', GOLD], ['热心', GOLD], ['完美的下属', GOLD], ['跟人打交道', GOLD],
  ['妥妥当当', GOLD], ['意见一致', SKY], ['忠诚', GOLD], ['多情', GOLD], ['家长作风', RED], ['ISTP', TEAL], ['冒险', TEAL], ['安抚', GOLD], ['互补', GOLD],
  ['衣食住行', GOLD], ['严格', SKY], ['骄傲', GOLD], ['尴尬', RED], ['名字', GOLD]];
const SUBS = X.buildSubs(KEYS);
const last = PARTS[PARTS.length - 1].m;
const END = last && last.END ? last.END : X.VJ.end + 6;
const DUR = +(process.env.EI_DUR || END);
const TR = 0.6;
function idx(t) { let k = 0; PARTS.forEach((q, i) => { if (t >= q.t0) k = i; }); return k; }
function drawPart(ctx, p, t) {
  ctx.save();
  if (p.m) p.m.draw(ctx, t); else { ctx.fillStyle = '#100a0e'; ctx.fillRect(0, 0, W, H); K.text(ctx, p.n + ' 待写', W / 2, H / 2, { size: 60, color: [200, 190, 180] }); }
  ctx.restore();
}
function draw(ctx, t) {
  const k = idx(t), p = PARTS[k], u = k > 0 ? (t - p.t0) / TR : 1;
  if (u >= 1) { drawPart(ctx, p, t); return; }
  // 转场：上一段定格在交界前一帧，下一段斜向柔边擦入
  const q = PARTS[k - 1], A = new K.Canvas(W, H), B = new K.Canvas(W, H);
  drawPart(A.getContext('2d'), q, p.t0 - 1 / 60);
  const bx = B.getContext('2d'), z = 1 + 0.06 * (1 - smooth(u));
  bx.translate(W / 2, H / 2); bx.scale(z, z); bx.translate(-W / 2, -H / 2); drawPart(bx, p, t);
  ctx.drawImage(A, 0, 0);
  const e = smooth(clamp(u, 0, 1)), y0 = -H * 0.35 + e * (H * 1.7), M = new K.Canvas(W, H), mx = M.getContext('2d');
  const g = mx.createLinearGradient(0, y0 - 420, W * 0.25, y0 + 420);
  g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.5, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  mx.drawImage(B, 0, 0); mx.globalCompositeOperation = 'destination-in'; mx.fillStyle = g; mx.fillRect(0, 0, W, H);
  ctx.drawImage(M, 0, 0);
  const a = Math.sin(Math.PI * clamp(u, 0, 1));
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const s = ctx.createLinearGradient(0, y0 - 120, W * 0.25, y0 + 120);
  s.addColorStop(0, 'rgba(255,214,150,0)'); s.addColorStop(0.5, `rgba(255,214,150,${0.35 * a})`); s.addColorStop(1, 'rgba(255,214,150,0)');
  ctx.fillStyle = s; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function lowShade(ctx) { const g = ctx.createLinearGradient(0, 1150, 0, 1920); g.addColorStop(0, 'rgba(6,6,14,0)'); g.addColorStop(0.45, 'rgba(6,6,14,0.45)'); g.addColorStop(1, 'rgba(6,6,14,0.7)'); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.fillStyle = g; ctx.fillRect(0, 1150, W, 770); ctx.restore(); }
function subBand(ctx) {
  const y0 = 1330, y1 = 1560, g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, 'rgba(6,4,8,0)'); g.addColorStop(0.35, 'rgba(6,4,8,0.45)'); g.addColorStop(0.65, 'rgba(6,4,8,0.45)'); g.addColorStop(1, 'rgba(6,4,8,0)');
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1; ctx.filter = 'none'; ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0); ctx.restore();
}
function over(ctx, t) {
  const k = idx(t), p = PARTS[k];
  if (t < X.VJ.end) lowShade(ctx);
  if (p.m && p.m.over && (k === 0 || t - p.t0 >= TR)) { ctx.save(); p.m.over(ctx, t); ctx.restore(); }
  if (k === 0 && p.m) { const B = require('./ebw'); ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); B.hud(ctx, t, clamp((vs('B04') - 0.4 - t) / 0.4, 0, 1)); ctx.restore(); }
  if (t < X.VJ.end + 0.5) subBand(ctx);
  X.drawSubs(ctx, t, SUBS);
}
module.exports = { DUR, END, draw, over, SUBS: [], bloom: 0.2, vig: 0.5, START };
