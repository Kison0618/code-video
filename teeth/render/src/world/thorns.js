// 荆棘（主歌 2 + 预副歌 2）：带刺的藤从画面四周长进来，越缠越紧；每一下跺脚，藤尖开出一朵玫瑰。
// 爱长着刺。预副歌 2 没有鼓：藤继续收紧，镜头推向正中那朵最大的玫瑰；236 拍急停：花瓣开始飘落
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, glow, mulberry32, noise1 } = K;
const A = require('../audio');

const T0 = A.beatT(184), T1 = A.beatT(240), TSTOP = A.beatT(236);
// 藤：从边缘出发，朝中间弯弯曲曲地长
const VINES = (() => {
  const r = mulberry32(23), out = [];
  for (let i = 0; i < 16; i++) {
    const edge = i % 4;
    let x = edge === 0 ? -20 : edge === 1 ? W + 20 : r() * W, y = edge === 2 ? H + 20 : edge === 3 ? -20 : H * (0.1 + r() * 0.8);
    let ang = Math.atan2(H / 2 - y + (r() - 0.5) * 500, W / 2 - x + (r() - 0.5) * 700);
    const pts = [[x, y]];
    const len = 900 + r() * 700, seed = r() * 100;
    for (let s = 0; s < 220; s++) {
      ang += noise1(s * 0.05 + seed, 3) * 0.09 + 0.004 * (i % 2 ? 1 : -1);
      x += Math.cos(ang) * len / 220; y += Math.sin(ang) * len / 220;
      pts.push([x, y]);
    }
    out.push({ pts, t0: T0 - 1.8 + r() * 3, grow: 8 + r() * 6, w: 13 + r() * 8, seed });
  }
  return out;
})();
// 玫瑰：开在鼓点上，位置在某条藤上
const ROSES = (() => {
  const r = mulberry32(61), out = [];
  let n = 0;
  for (let k = 184; k < 236; k++) if (A.isHit(k)) {
    const v = VINES[n % VINES.length]; n++;
    out.push({ vine: v, at: 0.45 + r() * 0.5, t: A.beatT(k), R: 34 + r() * 40, rot: r() * 6.28, hue: r() });
  }
  return out;
})();
const PETALS = (() => { const r = mulberry32(7); return Array.from({ length: 140 }, () => ({ x: r() * W, y: r() * H, s: 6 + r() * 12, sp: 30 + r() * 60, ph: r() * 6.28, rot: r() * 6.28 })); })();

function vinePoint(v, f) { const i = Math.min(v.pts.length - 1, Math.floor(f * (v.pts.length - 1))); return v.pts[i]; }
function rose(ctx, x, y, R, open, rot, col, a) {
  if (a <= 0.01 || open <= 0.01) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const L = 5;
  // 外层大而舒展，内层小而卷
  for (let l = L - 1; l >= 0; l--) {
    const n = 5 - Math.floor(l / 2), rr = R * (0.28 + 0.72 * (l + 1) / L) * (0.35 + 0.65 * open);
    const spread = 0.55 + 0.35 * (l / L) * open;
    for (let p = 0; p < n; p++) {
      const ang = p / n * 6.2832 + l * 1.1;
      ctx.save(); ctx.rotate(ang);
      const g = ctx.createLinearGradient(0, 0, rr, 0);
      g.addColorStop(0, rgba([45, 4, 30], a)); g.addColorStop(0.55, rgba(mix(col, [45, 4, 30], 0.25), a)); g.addColorStop(1, rgba(mix(col, C.pink, 0.35), a));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(rr * 0.5, -rr * spread, rr * 1.1, -rr * spread * 0.55, rr, 0);
      ctx.bezierCurveTo(rr * 1.1, rr * spread * 0.55, rr * 0.5, rr * spread, 0, 0); ctx.fill();
      // 花瓣边缘一道亮边
      ctx.strokeStyle = rgba(mix(col, C.pink, 0.6), 0.55 * a); ctx.lineWidth = Math.max(1, R * 0.02);
      ctx.beginPath(); ctx.moveTo(rr * 0.45, -rr * spread * 0.75); ctx.bezierCurveTo(rr * 0.9, -rr * spread * 0.6, rr * 1.08, -rr * spread * 0.25, rr, 0); ctx.stroke();
      ctx.restore();
    }
  }
  // 花心：卷起来的螺旋
  ctx.strokeStyle = rgba([40, 0, 25], 0.8 * a); ctx.lineWidth = Math.max(1, R * 0.025);
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) { const th = i / 60 * 12, r = R * 0.02 + i / 60 * R * 0.22 * (0.4 + 0.6 * open); const px = Math.cos(th) * r, py = Math.sin(th) * r; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.stroke();
  ctx.restore();
  glow(ctx, x, y, R * 2, col, 0.1 * a * open);
}

function draw(ctx, t, S) {
  const mid = A.env('mid', t), hit = A.hit(t, 6);
  const push = easeInOut(prog(t, A.beatT(208), TSTOP));            // 预副歌 2：推向中心
  const stop = smooth(prog(t, TSTOP, TSTOP + 0.4));
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  g.addColorStop(0, 'rgb(28,12,36)'); g.addColorStop(1, 'rgb(6,5,12)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  glow(ctx, W / 2, H / 2, 700, [90, 20, 80], 0.2 + 0.08 * mid);

  ctx.save();
  const zs = 1 + 0.5 * push;
  ctx.translate(W / 2, H / 2); ctx.scale(zs, zs); ctx.rotate(0.08 * push); ctx.translate(-W / 2, -H / 2);
  // 藤（越到后面收得越紧：向中心收缩）
  const tight = 0.18 * smooth(prog(t, A.beatT(200), TSTOP));
  for (const v of VINES) {
    const f = clamp((t - v.t0) / v.grow);
    if (f <= 0) continue;
    const n = Math.floor(f * (v.pts.length - 1));
    const P = i => { const p = v.pts[i]; return [lerp(p[0], W / 2, tight * i / 220), lerp(p[1], H / 2, tight * i / 220)]; };
    ctx.lineCap = 'round';
    for (let i = 1; i <= n; i++) {
      const a = P(i - 1), b = P(i), w = v.w * (1 - 0.8 * i / 220);
      ctx.strokeStyle = 'rgb(38,66,72)'; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    // 藤的高光（一侧被青光照亮）
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = rgba(C.cyan, 0.35); ctx.lineWidth = 1.2; ctx.beginPath();
    for (let i = 0; i <= n; i++) { const p = P(i); const off = v.w * 0.35 * (1 - 0.8 * i / 220); i ? ctx.lineTo(p[0] - off, p[1] - off) : ctx.moveTo(p[0] - off, p[1] - off); }
    ctx.stroke(); ctx.restore();
    // 刺：每隔几节一根，左右交替
    for (let i = 8; i <= n; i += 9) {
      const a = P(i - 1), b = P(i), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const side = (i / 9) % 2 ? 1 : -1, nx = -dy / L * side, ny = dx / L * side, w = v.w * (1 - 0.8 * i / 220);
      const tl = (6 + w * 0.8) * smooth(clamp((n - i) / 10));
      ctx.fillStyle = rgba(C.bone, 0.7);
      ctx.beginPath(); ctx.moveTo(b[0] - dx / L * w * 0.6, b[1] - dy / L * w * 0.6); ctx.lineTo(b[0] + nx * (w / 2 + tl) + dx / L * tl * 0.4, b[1] + ny * (w / 2 + tl) + dy / L * tl * 0.4); ctx.lineTo(b[0] + dx / L * w * 0.6, b[1] + dy / L * w * 0.6); ctx.fill();
    }
    // 藤尖的卷须
    if (f < 1) { const tip = P(n); glow(ctx, tip[0], tip[1], 26, C.cyan, 0.5); }
  }
  // 玫瑰
  for (const R of ROSES) {
    const age = t - R.t; if (age < 0) continue;
    const vf = clamp((t - R.vine.t0) / R.vine.grow);
    const i = Math.floor(Math.min(R.at, vf) * 220), p = R.vine.pts[i];
    const pp = [lerp(p[0], W / 2, tight * i / 220), lerp(p[1], H / 2, tight * i / 220)];
    const open = easeOut(age / 1.2);
    const col = R.hue < 0.5 ? [230, 40, 130] : R.hue < 0.8 ? [170, 50, 170] : [200, 30, 100];
    rose(ctx, pp[0], pp[1], R.R * (1 + 0.06 * hit), open, R.rot + age * 0.05, col, 1);
  }
  // 正中那朵最大的玫瑰：预副歌 2 里慢慢开
  const big = smooth(prog(t, A.beatT(204), A.beatT(232)));
  if (big > 0) rose(ctx, W / 2, H / 2 - 20, 170, big, t * 0.05, [230, 40, 130], 1);
  ctx.restore();

  // 急停后：花瓣飘落
  if (stop > 0) for (const p of PETALS) {
    const age = t - TSTOP, y = (p.y + age * p.sp * 3) % (H + 40), x = p.x + Math.sin(age * 2 + p.ph) * 30;
    ctx.save(); ctx.translate(x, y); ctx.rotate(p.rot + age * 2);
    ctx.fillStyle = rgba(C.pink, 0.7 * stop);
    ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.2832); ctx.fill(); ctx.restore();
  }
}
const lyricStyle = () => ({ y: H - 130, size: 44, accent: C.pink });
module.exports = { draw, lyricStyle };
