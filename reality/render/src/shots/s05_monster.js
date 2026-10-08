// 5 · 副歌 1 后半："你"被每个人拉向他们想要的位置。几百条线拽着金点，它被拉成一个连向所有人的多角形，
// 越拉越扭曲，最后成了一个长满尖刺的怪物；满意度停在 99.97%，"无解"
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, glow, noise1 } = K;
const A = require('../audio');
const U = require('../ui');
const { PEOPLE } = require('../pop');
const { you, crowd } = require('./common');

const T0 = A.beatT(144), T1 = A.beatT(176);
const CX = W / 2 - 120, CY = H / 2 + 20;
const PULL = PEOPLE.filter((p, i) => i % 5 === 0);           // 400 个在拉你的人

function draw(ctx, t) {
  const u = prog(t, T0, T1);
  const warp = easeInOut(prog(t, T0 + 1, T1 - 4));               // 被拉扯的程度
  // 人群：在"立场地图"上，各自站在希望你站的位置
  crowd(ctx, p => [lerp(p.sx, CX + (p.sx - W / 2), 0.0) - 120, p.sy + 20, C.gray, 0.55, p.sz]);
  // 拉线
  ctx.save();
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (const p of PULL) { ctx.moveTo(CX, CY); ctx.lineTo(p.sx - 120, p.sy + 20); }
  ctx.strokeStyle = rgba(C.gold, 0.06 + 0.06 * warp); ctx.stroke();
  ctx.restore();
  // 身体：每个方向上被拉出去多远 → 一个尖刺状的轮廓
  const NB = 180, rad = new Float32Array(NB);
  for (const p of PULL) {
    const dx = p.sx - 120 - CX, dy = p.sy + 20 - CY, ang = Math.atan2(dy, dx), d = Math.hypot(dx, dy);
    const b = Math.floor(((ang + Math.PI) / 6.2832) * NB) % NB;
    rad[b] = Math.max(rad[b], d);
  }
  const body = [];
  for (let i = 0; i < NB; i++) {
    const ang = i / NB * 6.2832 - Math.PI;
    const r = 14 + warp * (rad[i] * 0.55 + 18 * noise1(i * 0.7 + t * 2, 3));
    body.push([CX + Math.cos(ang) * r, CY + Math.sin(ang) * r]);
  }
  if (warp > 0.02) {
    ctx.save();
    ctx.beginPath(); body.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 320);
    g.addColorStop(0, rgba([60, 40, 20], 0.9)); g.addColorStop(1, rgba([20, 14, 10], 0.85));
    ctx.fillStyle = g; ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(C.gold, 0.75); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.restore();
  }
  you(ctx, CX, CY, 1, 5);
  // 满意度仪表
  const MX = W - 260, MY0 = 250, MY1 = 790;
  const sat = warp < 0.98 ? 0.55 + 0.4 * warp + 0.08 * Math.sin(t * 3.1) * (1 - warp) : 0.9997;
  ctx.strokeStyle = rgba(C.dim, 0.6); ctx.lineWidth = 1; ctx.strokeRect(MX, MY0, 26, MY1 - MY0);
  ctx.fillStyle = rgba(C.gold, 0.75); ctx.fillRect(MX + 4, lerp(MY1, MY0, sat) , 18, (MY1 - 4) - lerp(MY1, MY0, sat));
  ctx.strokeStyle = rgba(C.red, 0.9); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(MX - 14, MY0); ctx.lineTo(MX + 40, MY0); ctx.stroke(); ctx.setLineDash([]);
  U.note(ctx, '100%', MX + 50, MY0 + 4, { color: C.red });
  U.note(ctx, '满意度 · APPROVAL', MX + 13, MY1 + 34, { align: 'center' });
  K.text(ctx, (sat * 100).toFixed(2) + '%', MX + 13, MY1 + 74, { family: 'Mono', size: 30, color: C.bone });
  const nos = smooth(prog(t, T1 - 4, T1 - 3));
  U.note(ctx, '无解 · NO SOLUTION', MX + 13, MY1 + 104, { align: 'center', color: C.red, alpha: nos });
  // 文案
  U.caption(ctx, t, '一个能满足所有人利益的人，', { t0: T0 + 2, y: 120, size: 42, cps: 11 });
  U.caption(ctx, t, '一定是个怪物，不是个人。', { t0: T0 + 5, y: 176, size: 42, cps: 9, hl: { '怪物': C.gold }, en: 'Someone who satisfies everyone is a monster, not a person.' });
}
module.exports = { draw, t0: T0, t1: T1 };
