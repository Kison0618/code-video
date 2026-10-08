// 副歌 2（104–131.6 秒，全片第二个高潮）：恨与爱
//  宇宙里所有人先被吸成正中一根灰色的光柱：你没有立场，谁都不恨你，谁也不爱你——计数 0 / 0，分布图只有中间一根柱子。
//  "自己的立场"落下的那一拍：光柱炸开，分成左右两个旋转的星系，左边暗红（恨你的），右边金色（爱你的）
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeInOut, easeOutExpo, glow, text, hash } = K;
const A = require('../audio');
const U = require('../universe');
const UI = require('../ui');
const T = require('../textfx');
const { you } = require('./common');

const T0 = A.beatT(240), TC = A.beatT(241), TSPLIT = A.beatT(273), T1 = A.beatT(304);
const NB = 41;
const side = pt => (pt.react === 1 ? 1 : pt.react === -1 ? -1 : pt.ord < 0.22 ? 1 : pt.ord < 0.52 ? -1 : 0);

function column(pt) {
  const r = 30 + 60 * hash(pt.tw * 13), a = pt.tw * 7;
  return [Math.cos(a) * r, (pt.ord - 0.5) * 1900 - 260, Math.sin(a) * r];
}
function galaxy(pt, t) {
  const s = side(pt);
  const o = hash(pt.tw * 31.7);
  if (s === 0) { const a = pt.tw * 5 + t * 0.2, r = 40 + o * 260; return [Math.cos(a) * r, (o - 0.5) * 80, Math.sin(a) * r]; }
  const rr = 80 + Math.pow(o, 0.7) * 1500, arm = Math.floor(hash(pt.tw * 3.3) * 2);
  const ang = rr * 0.0045 + arm * Math.PI + (hash(pt.tw * 9.1) - 0.5) * 0.7 - t * 0.25 * s;
  const x = Math.cos(ang) * rr, z = Math.sin(ang) * rr;
  return [s * 1950 + x, (hash(pt.tw * 5.5) - 0.5) * 120 + z * 0.35, z * 0.9];
}

function draw(ctx, t) {
  const col = easeInOut(prog(t, TC, TC + 3));
  const sp = easeOutExpo(clamp((t - TSPLIT) / 2.2));
  const P = U.orbit(lerp(4200, 4700, sp), 0.25 * Math.sin(t * 0.08) + 0.1, lerp(0.16, 0.42, sp), 900);
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, 'rgb(14,13,20)'); bg.addColorStop(1, 'rgb(4,4,7)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
  let love = 0, hate = 0;
  const bins = new Float32Array(NB);
  U.draw(ctx, t, P, {
    nebula: 0.6 * (1 - col) + 0.4 * sp, focus: 4200, aperture: 0.5, links: col > 0.01 ? 0 : 1,
    map: (pt) => {
      let p = pt.p;
      if (col > 0) { const c = column(pt); p = [lerp(p[0], c[0], col), lerp(p[1], c[1], col), lerp(p[2], c[2], col)]; }
      let colr = col > 0.5 ? [170, 172, 182] : null;
      const s = side(pt);
      if (sp > 0) {
        const g = galaxy(pt, t), c = column(pt);
        const burst = Math.sin(sp * Math.PI) * 400;
        p = [lerp(c[0], g[0], sp) + pt.dir[0] * burst, lerp(c[1], g[1], sp) + pt.dir[1] * burst, lerp(c[2], g[2], sp) + pt.dir[2] * burst];
        colr = s === 1 ? mix([170, 172, 182], C.gold, sp) : s === -1 ? mix([170, 172, 182], C.red, sp) : [110, 112, 120];
        if (sp > 0.5) { if (s === 1) love++; else if (s === -1) hate++; }
      }
      const v = sp > 0 ? s * sp * (0.55 + 0.35 * hash(pt.tw * 2.2)) : (hash(pt.tw * 4.4) - 0.5) * 0.08;
      bins[clamp(Math.round((v + 1) / 2 * (NB - 1)), 0, NB - 1)]++;
      return { p, col: colr, a: s === 0 && sp > 0 ? 0.22 : col > 0.5 && sp < 0.5 ? 0.3 : 1, s: col > 0.5 && sp < 0.5 ? 0.6 : 1 };
    },
  });
  // 光柱的辉光
  const c0 = P([0, -1400, 0]), c1 = P([0, 1400, 0]);
  if (c0 && c1 && col > 0) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(c0[0] - 60, 0, c0[0] + 60, 0);
    g.addColorStop(0, 'rgba(200,205,220,0)'); g.addColorStop(0.5, rgba([200, 205, 220], 0.14 * col * (1 - sp))); g.addColorStop(1, 'rgba(200,205,220,0)');
    ctx.fillStyle = g; ctx.fillRect(c0[0] - 60, Math.min(c0[1], c1[1]), 120, Math.abs(c1[1] - c0[1]));
    ctx.restore();
  }
  // 炸开的一瞬：一道金色的冲击环
  const age = t - TSPLIT;
  if (age > 0 && age < 2) { const o = P([0, 0, 0]); if (o) { glow(ctx, o[0], o[1], 300 + age * 1600, C.gold, 0.3 * (1 - age / 2)); } }
  const o = P([0, 0, 0]); if (o) you(ctx, o[0], o[1], 1, 5 + 4 * sp);

  // 计数器
  const ca = smooth(prog(t, TC + 1, TC + 2));
  text(ctx, String(hate), 260, 300, { family: 'Mono', size: 54, color: C.red, alpha: ca });
  UI.note(ctx, '恨你的人 · HATE', 260, 336, { align: 'center', alpha: ca });
  text(ctx, String(love), W - 260, 300, { family: 'Mono', size: 54, color: C.gold, alpha: ca });
  UI.note(ctx, '爱你的人 · LOVE', W - 260, 336, { align: 'center', alpha: ca });
  // 底部的分布图
  const BX0 = 560, BX1 = 1360, BY = 1010, BH = 110, bw = (BX1 - BX0) / NB;
  ctx.strokeStyle = rgba(C.dim, 0.5 * ca); ctx.beginPath(); ctx.moveTo(BX0, BY); ctx.lineTo(BX1, BY); ctx.stroke();
  for (let i = 0; i < NB; i++) {
    const v = i / (NB - 1) * 2 - 1, h = Math.min(1, bins[i] / 1800) * BH * ca;
    ctx.fillStyle = rgba(v < -0.2 ? C.red : v > 0.2 ? C.gold : C.dim, 0.8);
    ctx.fillRect(BX0 + i * bw + 1, BY - h, bw - 2, h);
  }
  UI.note(ctx, '恨', BX0 - 26, BY - 4, { color: C.red, alpha: ca, size: 15 });
  UI.note(ctx, '爱', BX1 + 12, BY - 4, { color: C.gold, alpha: ca, size: 15 });

  // —— 文案 ——
  T.slam(ctx, t, '谁都不恨你，', { t0: TC, y: 130, size: 64, hl: { '恨': C.red }, out: A.beatT(264) });
  T.particleText(ctx, t, '那就必然谁都不爱你。', { t0: A.beatT(249), y: 230, size: 72, color: C.bone, dur: 1.4, out: A.beatT(264), from: (i, r) => { const q = P(column({ tw: r() * 6.28, ord: r() })); return q ? [q[0], q[1]] : [W / 2, H / 2]; }, en: 'If no one hates you, no one loves you.' });
  T.decode(ctx, t, '你有且只有一个立场：', { t0: A.beatT(265), y: 140, size: 50, cps: 10, out: A.beatT(300) });
  T.particleText(ctx, t, '自己的立场。', { t0: TSPLIT, y: 240, size: 96, color: C.gold, dur: 1.2, out: A.beatT(300), en: 'You have one stance: your own.' });
}
module.exports = { draw, t0: T0, t1: T1 };
