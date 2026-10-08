// 副歌 1（48.7–76.4 秒）：讨好所有人
//  一张"立场雷达"：家人、朋友、老板、同事、网友、陌生人……每个点都站在自己希望你站的位置，
//  几百根线拽着金点，它被扯来扯去，线拉得越长越红；右边的"满意度"永远到不了 100%。
//  后半段：金点被拉成一个连向所有人的多角形，最后成了一个长满尖刺的怪物，满意度 99.97%，"无解"
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, easeOut, glow, noise1, mulberry32, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const { you } = require('./common');
const { gauss } = require('../universe');

const T0 = A.beatT(112), TM = A.beatT(143), T1 = A.beatT(176);
const CX = W / 2 - 150, CY = H / 2 + 70, RMAX = 340;
const GROUPS = ['家人', '朋友', '老板', '同事', '网友', '陌生人', '对手', '旁观者'];
const PEOPLE = (() => {
  const r = mulberry32(5), out = [];
  for (let i = 0; i < 900; i++) {
    const g = Math.floor(r() * 8), a = (g + 0.5) / 8 * 6.2832 + gauss(r) * 0.28, d = 70 + Math.pow(r(), 0.6) * (RMAX - 60);
    out.push({ g, a, d, x: CX + Math.cos(a) * d, y: CY + Math.sin(a) * d, pull: i % 3 === 0, ph: r() * 6.28, sz: 1.3 + r() * 1.4 });
  }
  return out;
})();

function goldPos(t) {
  // 被扯来扯去：几股力量此消彼长
  const m = smooth(prog(t, TM - 1, TM + 2));
  const k = 1 - m;
  const x = CX + k * (190 * noise1(t * 1.6, 1) + 80 * noise1(t * 3.7, 2));
  const y = CY + k * (150 * noise1(t * 1.4, 3) + 70 * noise1(t * 3.3, 4));
  return [x, y];
}

function draw(ctx, t) {
  const on = smooth(prog(t, T0, T0 + 0.8));
  const mon = easeInOut(prog(t, TM, T1 - 4));
  const [gx, gy] = goldPos(t);
  // 雷达：同心圆、辐条、刻度、组名
  ctx.save();
  ctx.strokeStyle = rgba(C.line, 0.55 * on); ctx.lineWidth = 1;
  for (let r = 85; r <= RMAX; r += 85) { ctx.beginPath(); ctx.arc(CX, CY, r, 0, 6.2832); ctx.stroke(); }
  ctx.setLineDash([2, 6]);
  for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832; ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + Math.cos(a) * (RMAX + 30), CY + Math.sin(a) * (RMAX + 30)); ctx.stroke(); }
  ctx.setLineDash([]);
  ctx.restore();
  GROUPS.forEach((g, i) => {
    const a = (i + 0.5) / 8 * 6.2832;
    text(ctx, g, CX + Math.cos(a) * (RMAX + 52), CY + Math.sin(a) * (RMAX + 52) + 7, { family: 'Song', size: 18, color: C.dim, alpha: 0.85 * on });
  });
  // 人
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba([175, 185, 210], 0.9 * on);
  ctx.beginPath();
  for (const p of PEOPLE) { const b = 0.6 + 0.4 * Math.sin(t * 1.5 + p.ph); ctx.rect(p.x - p.sz / 2, p.y - p.sz / 2, p.sz * b + 0.6, p.sz * b + 0.6); }
  ctx.fill();
  ctx.restore();
  // 拉线：越长越红
  const pulled = PEOPLE.filter(p => p.pull);
  const nOn = Math.floor(pulled.length * smooth(prog(t, T0 + 0.5, T0 + 4)));
  const bins = [[], [], []];
  for (let i = 0; i < nOn; i++) {
    const p = pulled[i], d = Math.hypot(p.x - gx, p.y - gy);
    const k = d > 360 ? 2 : d > 220 ? 1 : 0;
    bins[k].push(p.x, p.y);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 0.9;
  [[C.gold, 0.1], [[230, 120, 80], 0.11], [C.red, 0.14]].forEach(([col, a], k) => {
    ctx.strokeStyle = rgba(col, a * on * (1 - 0.4 * mon)); ctx.beginPath();
    for (let i = 0; i < bins[k].length; i += 2) { ctx.moveTo(gx, gy); ctx.lineTo(bins[k][i], bins[k][i + 1]); }
    ctx.stroke();
  });
  ctx.restore();
  // 怪物：每个方向上被拉出多远 → 尖刺状的身体
  if (mon > 0.01) {
    const NB = 200, rad = new Float32Array(NB);
    for (const p of pulled) {
      const ang = Math.atan2(p.y - CY, p.x - CX), d = Math.hypot(p.x - CX, p.y - CY);
      const b = Math.floor(((ang + Math.PI) / 6.2832) * NB) % NB;
      rad[b] = Math.max(rad[b], d);
    }
    const body = [];
    for (let i = 0; i < NB; i++) {
      const ang = i / NB * 6.2832 - Math.PI;
      const r = 12 + mon * (rad[i] * 0.8 + 14 * noise1(i * 0.9 + t * 2.4, 3));
      body.push([CX + Math.cos(ang) * r, CY + Math.sin(ang) * r]);
    }
    ctx.save();
    ctx.beginPath(); body.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath();
    const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 340);
    g.addColorStop(0, rgba([70, 44, 22], 0.92)); g.addColorStop(1, rgba([24, 10, 10], 0.9));
    ctx.fillStyle = g; ctx.fill();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(mix(C.gold, C.red, mon * 0.6), 0.85); ctx.lineWidth = 1.5; ctx.stroke();
    ctx.restore();
  }
  you(ctx, gx, gy, on, 5);

  // 满意度
  const MX = W - 300, MY0 = 260, MY1 = 760;
  const sat = mon > 0.97 ? 0.9997 : clamp(0.62 + 0.18 * noise1(t * 1.6, 9) + 0.36 * mon, 0, 0.995);
  ctx.strokeStyle = rgba(C.dim, 0.6 * on); ctx.lineWidth = 1; ctx.strokeRect(MX, MY0, 30, MY1 - MY0);
  for (let i = 0; i <= 10; i++) { const y = lerp(MY1, MY0, i / 10); ctx.fillStyle = rgba(C.dim, 0.5 * on); ctx.fillRect(MX - 10, y, i % 5 ? 5 : 9, 1); }
  const fy = lerp(MY1, MY0, sat);
  const fg = ctx.createLinearGradient(0, MY1, 0, MY0);
  fg.addColorStop(0, rgba(C.red, 0.8 * on)); fg.addColorStop(1, rgba(C.gold, 0.85 * on));
  ctx.fillStyle = fg; ctx.fillRect(MX + 5, fy, 20, MY1 - 5 - fy);
  ctx.strokeStyle = rgba(C.red, 0.9 * on); ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(MX - 18, MY0); ctx.lineTo(MX + 48, MY0); ctx.stroke(); ctx.setLineDash([]);
  UI.note(ctx, '100%', MX + 56, MY0 + 4, { color: C.red, alpha: on });
  UI.note(ctx, '满意度 · APPROVAL', MX + 15, MY1 + 34, { align: 'center', alpha: on });
  text(ctx, (sat * 100).toFixed(2) + '%', MX + 15, MY1 + 76, { family: 'Mono', size: 32, color: C.bone, alpha: on });
  UI.note(ctx, '无解 · NO SOLUTION', MX + 15, MY1 + 106, { align: 'center', color: C.red, alpha: smooth(prog(t, T1 - 5, T1 - 4.4)) });

  // —— 文案 ——
  T.decode(ctx, t, '你想让所有人都喜欢你？', { t0: T0 + 0.3, x: W / 2, y: 120, size: 46, cps: 12, out: A.beatT(142), hl: { '所有人': C.gold } });
  const costs = [['效率很低。', A.beatT(121), 'COST 01'], ['很痛苦。', A.beatT(129), 'COST 02'], ['不停怀疑。', A.beatT(137), 'COST 03']];
  costs.forEach(([s, t0, tag], i) => {
    const y = 330 + i * 120;
    if (t > t0 && t < TM) UI.note(ctx, tag, 120, y - 62, { alpha: smooth(prog(t, t0, t0 + 0.3)) * (1 - smooth(prog(t, TM - 0.6, TM))) });
    T.slam(ctx, t, s, { t0, x: 120, y, size: 60, align: 'left', out: TM - 0.6, color: i === 2 ? C.red : C.bone });
  });
  T.decode(ctx, t, '一个能满足所有人利益的人，', { t0: TM + 0.4, x: W / 2, y: 118, size: 44, cps: 13, out: A.beatT(164) });
  T.slam(ctx, t, '一定是个怪物，不是个人。', { t0: A.beatT(153), x: W / 2, y: 196, size: 60, hl: { '怪物': C.red }, out: A.beatT(164), en: 'Someone who satisfies everyone is a monster, not a person.' });
  T.decode(ctx, t, '神都做不到。', { t0: A.beatT(165), x: W / 2, y: H - 190, size: 42, cps: 10, out: T1 - 0.2 });
  T.decode(ctx, t, '上帝，还有人天天骂呢。', { t0: A.beatT(169), x: W / 2, y: H - 120, size: 42, cps: 12, out: T1 - 0.2, hl: { '天天骂': C.red } });
}
module.exports = { draw, t0: T0, t1: T1 };
