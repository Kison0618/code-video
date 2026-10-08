// 断开 + 主歌 2（76.4–90.2 秒）：立场罗盘
//  一个巨大的罗盘，四周是家人、朋友、老板……指针被每一边轮流拽过去，疯狂地来回乱转，身后留下一圈圈残影；
//  指针越转越短，最后缩成 0："STANCE = NULL"
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, noise1, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const { you } = require('./common');

const T0 = A.beatT(176), T1 = A.beatT(208);
const CX = W / 2, CY = H / 2 + 30, R = 300;
const GROUPS = ['家人', '朋友', '老板', '同事', '网友', '陌生人', '对手', '旁观者'];
const angleAt = t => 6.2832 * (0.9 * noise1(t * 0.9, 11) + 0.6 * noise1(t * 2.3, 12) + 0.25 * noise1(t * 5.1, 13)) + t * 0.8;

function draw(ctx, t) {
  const on = smooth(prog(t, T0, T0 + 0.6));
  const shrink = easeInOut(prog(t, T0 + 4, A.beatT(192)));
  const L = (R - 40) * (1 - shrink);
  // 刻度盘
  ctx.save();
  ctx.strokeStyle = rgba(C.dim, 0.7 * on); ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(CX, CY, R, 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = rgba(C.line, 0.6 * on); ctx.beginPath(); ctx.arc(CX, CY, R - 46, 0, 6.2832); ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 360; i += 2) {
    const a = i / 180 * Math.PI, l = i % 30 === 0 ? 18 : i % 10 === 0 ? 10 : 5;
    ctx.moveTo(CX + Math.cos(a) * R, CY + Math.sin(a) * R); ctx.lineTo(CX + Math.cos(a) * (R - l), CY + Math.sin(a) * (R - l));
  }
  ctx.strokeStyle = rgba(C.dim, 0.6 * on); ctx.stroke();
  ctx.restore();
  for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; UI.note(ctx, String(i * 30).padStart(3, '0'), CX + Math.cos(a) * (R - 34), CY + Math.sin(a) * (R - 34) + 4, { align: 'center', size: 11, alpha: 0.6 * on }); }
  GROUPS.forEach((g, i) => {
    const a = (i + 0.5) / 8 * 6.2832 - Math.PI / 2;
    const pull = Math.max(0, Math.cos(angleAt(t) - a));
    text(ctx, g, CX + Math.cos(a) * (R + 62), CY + Math.sin(a) * (R + 62) + 8, { family: 'Song', size: 22, color: mix(C.dim, C.bone, pull), alpha: on });
    glow(ctx, CX + Math.cos(a) * (R + 62), CY + Math.sin(a) * (R + 62), 40, C.gold, 0.18 * pull * (1 - shrink) * on);
  });
  // 指针残影
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let k = 24; k >= 0; k--) {
    const tt = t - k * 0.03, a = angleAt(tt), l = (R - 40) * (1 - easeInOut(prog(tt, T0 + 4, A.beatT(192))));
    if (l < 2) continue;
    ctx.strokeStyle = rgba(C.gold, (k === 0 ? 0.95 : 0.12 * (1 - k / 25)) * on); ctx.lineWidth = k === 0 ? 3 : 2;
    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(a) * l, CY + Math.sin(a) * l); ctx.stroke();
  }
  ctx.restore();
  if (L > 2) { const a = angleAt(t); glow(ctx, CX + Math.cos(a) * L, CY + Math.sin(a) * L, 26, C.gold, 0.7 * on); }
  you(ctx, CX, CY, on, 5);
  // 读数
  const deg = ((angleAt(t) / Math.PI * 180) % 360 + 360) % 360;
  UI.note(ctx, 'STANCE  方向', 120, H - 170, { alpha: 0.7 * on });
  text(ctx, shrink > 0.98 ? 'NULL' : deg.toFixed(1) + '°', 120, H - 128, { family: 'Mono', size: 34, color: shrink > 0.98 ? C.red : C.bone, alpha: on, align: 'left' });
  UI.note(ctx, 'MAGNITUDE  强度', 120, H - 88, { alpha: 0.7 * on });
  text(ctx, (1 - shrink).toFixed(3), 120, H - 50, { family: 'Mono', size: 26, color: C.bone, alpha: on, align: 'left' });
  if (shrink > 0.98) {
    ctx.strokeStyle = rgba(C.red, 0.5); ctx.setLineDash([6, 6]); ctx.beginPath(); ctx.arc(CX, CY, 40, 0, 6.2832); ctx.stroke(); ctx.setLineDash([]);
  }

  // —— 文案 ——
  T.decode(ctx, t, '你不能占所有人的立场——', { t0: T0 + 0.15, y: 110, size: 46, cps: 13, out: A.beatT(191), hl: { '所有人': C.gold } });
  T.slam(ctx, t, '那样，你就没立场了。', { t0: A.beatT(192), y: 110, size: 58, out: A.beatT(199) - 0.2, hl: { '没立场': C.red }, en: 'Stand with everyone, and you stand for nothing.' });
  T.decode(ctx, t, '没有立场的人，就是墙头草。', { t0: A.beatT(199), y: 110, size: 46, cps: 14, out: T1 - 0.1, hl: { '墙头草': C.red } });
}
module.exports = { draw, t0: T0, t1: T1 };
