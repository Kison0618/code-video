// 特效库：全部是"时间 → 画面"的纯函数（不存跨帧状态），多进程分块渲染也能无缝接上
'use strict';
const K = require('./core');
const { W, H, C, rgba, clamp, lerp, E, mulberry32, hash } = K;

// —— 辉光：径向渐变 + 叠加混合 ——
// stops: [[位置0~1, [r,g,b], alpha], ...]
function glow(ctx, x, y, r, col = C.warm, a = 1, core = 0.25) {
  if (a <= 0.003 || r <= 1) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(K.mix(col, C.white, 0.75), clamp(a)));
  g.addColorStop(core, rgba(col, clamp(a * 0.55)));
  g.addColorStop(0.55, rgba(K.mix(col, [60, 30, 10], 0.4), clamp(a * 0.18)));
  g.addColorStop(1, rgba(col, 0));
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
  ctx.restore();
}

// —— 文字群爆：一堆单词从中心往外飞，带自旋和远近缩放（编程集 print(*bomb) 那段）——
// o: { n, speed, life, size, seed, drag, gravity, colors }
function wordBurst(ctx, x, y, age, words, o = {}) {
  if (age < 0) return;
  const { n = 40, speed = 1400, life = 1.6, size = 34, seed = 1, drag = 2.2, gravity = 260, family = 'Code' } = o;
  const r = mulberry32(seed);
  ctx.save();
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI * 2, ph = Math.acos(r() * 2 - 1);      // 球面上均匀的方向
    const v = speed * (0.35 + r() * 0.85);
    const dx = Math.sin(ph) * Math.cos(th), dy = Math.sin(ph) * Math.sin(th), dz = Math.cos(ph);
    const delay = r() * 0.08, a0 = age - delay;
    const lf = life * (0.6 + r() * 0.6);
    if (a0 < 0 || a0 > lf) { r(); r(); r(); continue; }
    const d = v / drag * (1 - Math.exp(-drag * a0));                 // 带阻力的位移
    const z = dz * d;
    const s = 900 / (900 - z * 0.8);                                  // 透视
    const px = x + dx * d * s, py = y + dy * d * s + 0.5 * gravity * a0 * a0;
    const rot = (r() - 0.5) * 12 * a0 + (r() - 0.5);
    const shade = 170 + r() * 85;
    const fade = 1 - E.in(a0 / lf);
    const w = words[i % words.length];
    ctx.save();
    ctx.translate(px, py); ctx.rotate(rot); ctx.scale(s, s);
    ctx.font = `400 ${size * (0.6 + r() * 0.8)}px ${family}`;
    ctx.fillStyle = `rgba(${shade | 0},${shade | 0},${shade | 0},${clamp(fade)})`;
    ctx.fillText(w, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

// —— 放射速度线（漫画集中线），屏幕空间；每 2 帧换一次形状，产生闪烁感 ——
function speedLines(ctx, cx, cy, t, o = {}) {
  const { n = 90, r0 = 220, r1 = 1300, a = 0.8, w = 2.2, fps = 30, seed = 3, col = C.white } = o;
  if (a <= 0.003) return;
  const r = mulberry32(seed * 1000 + Math.floor(t * fps));
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const th = r() * Math.PI * 2;
    const a0 = r0 * (0.7 + r() * 0.8), len = (r1 - a0) * (0.15 + r() * 0.6);
    const c = Math.cos(th), s = Math.sin(th);
    ctx.strokeStyle = rgba(col, a * (0.3 + r() * 0.7));
    ctx.lineWidth = w * (0.4 + r() * 1.4);
    ctx.beginPath();
    ctx.moveTo(cx + c * a0, cy + s * a0);
    ctx.lineTo(cx + c * (a0 + len), cy + s * (a0 + len));
    ctx.stroke();
  }
  ctx.restore();
}

// —— 冲击波环 ——
function shockRing(ctx, x, y, age, o = {}) {
  const { dur = 0.6, r1 = 600, w = 26, col = C.white, a = 0.9, squash = 1 } = o;
  if (age < 0 || age > dur) return;
  const u = age / dur, rr = r1 * E.outExpo(u);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.strokeStyle = rgba(col, a * (1 - u) * (1 - u));
  ctx.lineWidth = w * (1 - u * 0.8);
  ctx.beginPath();
  ctx.ellipse(x, y, rr, rr * squash, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// —— 火花 / 碎屑：带重力的短线 ——
function sparks(ctx, x, y, age, o = {}) {
  const { n = 30, speed = 1600, life = 0.8, seed = 5, col = C.white, gravity = 1800, len = 0.035, w = 3, up = 0 } = o;
  if (age < 0) return;
  const r = mulberry32(seed);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const th = up ? -Math.PI / 2 + (r() - 0.5) * up : r() * Math.PI * 2;
    const v = speed * (0.3 + r() * 0.9), lf = life * (0.5 + r() * 0.7);
    if (age > lf) continue;
    const vx = Math.cos(th) * v, vy = Math.sin(th) * v;
    const px = x + vx * age, py = y + vy * age + 0.5 * gravity * age * age;
    const tx = vx, ty = vy + gravity * age;                     // 当前速度方向
    const f = 1 - age / lf;
    ctx.strokeStyle = rgba(col, f);
    ctx.lineWidth = w * (0.5 + r());
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px - tx * len, py - ty * len);
    ctx.stroke();
  }
  ctx.restore();
}

// —— 镜头光晕：中心亮点 + 横竖星芒 ——
function lensFlare(ctx, x, y, size, a = 1, col = [255, 236, 200]) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  glow(ctx, x, y, size * 1.4, col, a * 0.8, 0.12);
  const streak = (w, h, al) => {
    const g = ctx.createLinearGradient(x - w, y, x + w, y);
    g.addColorStop(0, rgba(col, 0)); g.addColorStop(0.5, rgba(col, al)); g.addColorStop(1, rgba(col, 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - w, y - h / 2, 2 * w, h);
  };
  streak(size * 5, size * 0.05, a);
  streak(size * 2.5, size * 0.16, a * 0.35);
  ctx.translate(x, y); ctx.rotate(Math.PI / 2); ctx.translate(-x, -y);
  streak(size * 2.2, size * 0.04, a * 0.9);
  ctx.restore();
}

// —— 闪电：递归中点位移 ——
function bolt(x0, y0, x1, y1, r, rough = 0.35, depth = 6) {
  let pts = [[x0, y0], [x1, y1]];
  let amp = Math.hypot(x1 - x0, y1 - y0) * rough;
  for (let d = 0; d < depth; d++) {
    const np = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i];
      const mx = (ax + bx) / 2, my = (ay + by) / 2, nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1;
      const o = (r() - 0.5) * amp;
      np.push([mx + nx / L * o, my + ny / L * o], pts[i]);
    }
    pts = np; amp *= 0.55;
  }
  return pts;
}
function lightning(ctx, x0, y0, x1, y1, t, o = {}) {
  const { seed = 9, w = 5, col = C.gold, a = 1, fps = 12, branches = 3 } = o;
  if (a <= 0.003) return;
  const r = mulberry32(seed * 977 + Math.floor(t * fps));
  const main = bolt(x0, y0, x1, y1, r);
  const all = [main];
  for (let b = 0; b < branches; b++) {
    const p = main[Math.floor(r() * main.length * 0.8)];
    const ang = Math.atan2(y1 - y0, x1 - x0) + (r() - 0.5) * 1.8, L = Math.hypot(x1 - x0, y1 - y0) * (0.2 + r() * 0.3);
    all.push(bolt(p[0], p[1], p[0] + Math.cos(ang) * L, p[1] + Math.sin(ang) * L, r, 0.4, 4));
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  all.forEach((pts, k) => {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (const p of pts) ctx.lineTo(p[0], p[1]);
    for (const [lw, la, cc] of [[w * 6, 0.12, col], [w * 2.5, 0.35, col], [w, 1, K.mix(col, C.white, 0.7)]]) {
      ctx.strokeStyle = rgba(cc, a * la * (k ? 0.6 : 1)); ctx.lineWidth = lw * (k ? 0.6 : 1); ctx.stroke();
    }
  });
  ctx.restore();
}

// —— 能量光束：白芯 + 彩色外晕 ——
function beam(ctx, x0, y0, x1, y1, w, col = C.gold, a = 1) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  for (const [k, al, cc] of [[4, 0.08, col], [2.2, 0.18, col], [1.2, 0.5, col], [0.55, 1, C.white]]) {
    ctx.strokeStyle = rgba(cc, a * al); ctx.lineWidth = w * k;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  }
  ctx.restore();
  glow(ctx, x0, y0, w * 4, col, a * 0.6);
  glow(ctx, x1, y1, w * 3, col, a * 0.4);
}

// —— 运动线：快速移动的物体身后几条平行细线 ——
function motionLines(ctx, x, y, vx, vy, o = {}) {
  const { n = 5, len = 0.08, spread = 40, a = 0.6, w = 2, seed = 1, col = C.white } = o;
  const sp = Math.hypot(vx, vy);
  if (sp < 300 || a <= 0.003) return;
  const ux = vx / sp, uy = vy / sp, nx = -uy, ny = ux, r = mulberry32(seed);
  ctx.save();
  ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const off = (r() - 0.5) * 2 * spread, L = sp * len * (0.5 + r()), back = r() * 30 + 20;
    const sx = x + nx * off - ux * back, sy = y + ny * off - uy * back;
    ctx.strokeStyle = rgba(col, a * (0.4 + r() * 0.6)); ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx - ux * L, sy - uy * L); ctx.stroke();
  }
  ctx.restore();
}

// —— 地面灰尘：一串往两边扩散的柔和团块 ——
function dust(ctx, x, y, age, o = {}) {
  const { n = 10, spread = 260, size = 60, life = 1.2, seed = 2, a = 0.5 } = o;
  if (age < 0 || age > life) return;
  const r = mulberry32(seed);
  const u = age / life;
  ctx.save();
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, d = spread * (0.3 + r() * 0.7) * E.out3(u) * side;
    const s = size * (0.5 + r() * 0.8) * (0.6 + u * 0.8);
    const g = ctx.createRadialGradient(x + d, y - s * 0.4, 0, x + d, y - s * 0.4, s);
    g.addColorStop(0, `rgba(230,230,230,${a * (1 - u)})`); g.addColorStop(1, 'rgba(230,230,230,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x + d - s, y - s * 1.4, 2 * s, 2 * s);
  }
  ctx.restore();
}

// —— 整套爆炸：辉光 + 闪光 + 冲击环 + 火花 + 文字群爆（可选）——
function explosion(ctx, x, y, age, o = {}) {
  if (age < 0) return;
  const { scale = 1, words = null, seed = 11, col = [255, 170, 80], dur = 2.4 } = o;
  const s = scale;
  // 暖色大光团：0.1 秒冲到最亮，之后慢慢暗下去
  const ga = age < 0.08 ? age / 0.08 : Math.exp(-(age - 0.08) * 1.4);
  glow(ctx, x, y, (700 + 500 * E.out3(clamp(age / 1.2))) * s, col, ga * 0.85, 0.18);
  glow(ctx, x, y, 220 * s, [255, 245, 220], ga, 0.3);
  shockRing(ctx, x, y, age, { r1: 900 * s, dur: 0.7, w: 34 * s, col: [255, 230, 190] });
  shockRing(ctx, x, y, age - 0.08, { r1: 1300 * s, dur: 0.9, w: 14 * s, a: 0.5 });
  sparks(ctx, x, y, age, { n: 46, speed: 2200 * s, life: 0.9, seed, w: 3.5 * s, col: [255, 230, 190] });
  if (words) wordBurst(ctx, x, y, age, words, { n: 70, speed: 2400 * s, size: 40 * s, seed: seed + 1, life: dur });
}

// 全屏闪白（屏幕空间）
function flash(ctx, a, col = C.white) {
  if (a <= 0.003) return;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = rgba(col, clamp(a)); ctx.fillRect(0, 0, W, H);
  ctx.restore();
}
// 闪白的标准曲线：瞬间到顶，指数衰减
const flashCurve = (age, peak = 1, k = 6) => (age < 0 ? 0 : peak * Math.exp(-age * k));

module.exports = { glow, wordBurst, speedLines, shockRing, sparks, lensFlare, lightning, beam, motionLines, dust, explosion, flash, flashCurve };
