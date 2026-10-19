// 乱码（第三部的对手，剧本 火柴人VS乱码.md）：一切都由乱码字拼成，灰白色，字一直在抖
//   gly(seed, t)                    这个位置此刻显示哪个乱码字（每隔几帧随机换一个）
//   drawGlyph(ctx, ch, x, y, rot, size, a, glitch)   画一个乱码字；glitch > 0 时横向错位 + 青 / 品红残影（信号不好）
//   glitchAt(seed, t)               此刻要不要错位（偶尔 2 帧）
//   new Clump({ seed, n, size, center: t → [x, y], walk: t → 0~1 })   S 形态：一团字，用字当脚一跳一跳地爬
//     .draw(ctx, t, { from })      from(i, t) → [x, y, rot, a] 或 null：散落的字还没聚过来时用它的位置
// 全部确定性（同一时刻永远画一样的东西）。
'use strict';
const K = require('./core');
const { clamp, lerp, rgba, E } = K;

const GLY = Array.from('锟斤拷烫屯�ÃÂ©¤ÿï¿½▯Ðþ§µ¶ØÆ');
const COL = [206, 206, 206];
const hash = (a, b = 0) => { let h = (a * 374761393 + b * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// 每个位置有一个"本来"的字，每 1/rate 秒有 p 的概率换成别的
function gly(seed, t, rate = 7, p = 0.4) {
  const k = Math.floor(t * rate), base = GLY[Math.floor(hash(seed, 7) * GLY.length)];
  return hash(seed, k) < p ? GLY[Math.floor(hash(seed + 31, k) * GLY.length)] : base;
}
function glitchAt(seed, t, p = 0.07) {
  const k = Math.floor(t * 12);
  return hash(seed + 913, k) < p ? 1 : 0;
}
function drawGlyph(ctx, ch, x, y, rot = 0, size = 50, a = 1, glitch = 0, col = COL) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = `400 ${size}px Mono, SC`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (glitch > 0) {
    const d = size * 0.09 * glitch;
    ctx.fillStyle = `rgba(0,230,230,${0.55 * a * glitch})`; ctx.fillText(ch, -d, 0);
    ctx.fillStyle = `rgba(240,0,200,${0.55 * a * glitch})`; ctx.fillText(ch, d, 0);
    ctx.translate(size * 0.12 * glitch, 0);
  }
  ctx.fillStyle = rgba(col, a); ctx.fillText(ch, 0, 0);
  ctx.restore();
}
// 一个字从 p0 掉下来（带横向速度），落地弹一下停住；返回 [x, y, rot]
function fall(p0, vx, t0, t, size, o = {}) {
  const G = o.G ?? 2600, gy = -size * 0.42, s = Math.max(0, t - t0);
  const tg = Math.sqrt(2 * Math.max(0, gy - p0[1]) / G);
  if (s < tg) return [p0[0] + vx * s, p0[1] + 0.5 * G * s * s, (o.vr ?? 0) * s];
  const v = G * tg * 0.25, b = Math.max(0, s - tg), tb = 2 * v / G, xl = p0[0] + vx * tg;
  if (b < tb) return [xl + vx * 0.25 * b, gy - (v * b - 0.5 * G * b * b), (o.vr ?? 0) * (tg + b)];
  return [xl + vx * 0.25 * tb, gy, (o.vr ?? 0) * (tg + tb)];
}

class Clump {
  constructor(o) {
    Object.assign(this, { seed: 11, n: 8, size: 46, walk: () => 0 }, o);
    // 字的"家"：挤成一个贴地的小土堆（下面一排宽、上面窄）
    const a = Math.ceil(this.n * 0.5), b = Math.ceil((this.n - a) * 0.7), rows = [a, b, this.n - a - b].filter(v => v > 0);
    this.home = [];
    let i = 0;
    rows.forEach((inRow, row) => {
      for (let k = 0; k < inRow; k++, i++) {
        const x = (k - (inRow - 1) / 2) * this.size * 0.78 + (hash(this.seed, i) - 0.5) * this.size * 0.2;
        this.home.push({ x, y: -this.size * (0.42 + 0.7 * row), s: 0.8 + 0.4 * hash(this.seed + 5, i), ph: hash(this.seed + 9, i) * 6.28 });
      }
    });
  }
  // 第 i 个字此刻在家里的位置（爬的时候底下一排一跳一跳当脚）
  homeAt(i, t) {
    const c = this.center(t), h = this.home[i], w = this.walk(t), sz = this.size;
    const k = Math.floor(t * 24), jx = (hash(this.seed + i, k) - 0.5) * 3, jy = (hash(this.seed + i + 50, k) - 0.5) * 3;
    const hop = h.y > -sz * 0.6 ? Math.max(0, Math.sin(t * 22 + h.ph)) * 0.35 * sz * w : 0;
    const sway = Math.sin(t * 9 + h.ph) * 0.05 * sz * w;
    return [c[0] + h.x + jx + sway, c[1] + h.y - hop + jy, (hash(this.seed + i + 90, Math.floor(t * 7)) - 0.5) * 0.4];
  }
  draw(ctx, t, o = {}) {
    for (let i = 0; i < this.n; i++) {
      const f = o.from ? o.from(i, t) : null, h = this.home[i];
      const p = f || this.homeAt(i, t);
      drawGlyph(ctx, gly(this.seed * 100 + i, t), p[0], p[1], p[2], this.size * h.s, p[3] ?? (o.alpha ?? 1), glitchAt(this.seed * 100 + i, t));
    }
  }
}

// 乱码本体（剧本 v3）：一团没有固定形状的乱码，一直在变形；能力只有一个——碰到的字变成乱码、被吸进来，它就变大
//   new Blob({ seed, center: t → [x, y](底部中心), mass: t → 字数 })
//   .lash(t0, tHit, t1, to)        甩出一条字带：2 帧伸到 to，停住，再收回（攻击）
//   .scatter(t, dir)               被打中：字往外散开再聚回来
//   .tipAt(t) / .R(t)              字带末端、半径（给碰撞、镜头用）
class Blob {
  constructor(o) { Object.assign(this, { seed: 3, size: 40, lashes: [], hits: [] }, o); }
  R(t) { return this.size * 0.55 * Math.sqrt(Math.max(1, this.mass(t))); }
  lash(t0, tHit, t1, to) { this.lashes.push({ t0, tHit, t1, to }); return this; }
  scatter(t, dir = 0) { this.hits.push({ t, dir }); return this; }
  lashAt(t) {
    for (const L of this.lashes) if (t >= L.t0 && t < L.t1) {
      const ext = t < L.tHit ? E.out(clamp((t - L.t0) / Math.max(0.02, L.tHit - L.t0))) : 1 - E.inOut(clamp((t - (L.t1 - 0.22)) / 0.22));
      return { L, ext };
    }
    return null;
  }
  tipAt(t) { const a = this.lashAt(t); if (!a) return null; const c = this.center(t), r = this.R(t); const b = [c[0], c[1] - r]; return [lerp(b[0], a.L.to[0], a.ext), lerp(b[1], a.L.to[1], a.ext)]; }
  draw(ctx, t, o = {}) {
    const n = Math.round(this.mass(t)), c = this.center(t), R = this.R(t), a0 = o.alpha ?? 1;
    if (n <= 0) return;
    let sc = 0, sdir = 0;
    for (const h of this.hits) { const d = t - h.t; if (d >= 0 && d < 0.7) { const k = Math.exp(-d * 6) * Math.min(1, d / 0.03); if (k > sc) { sc = k; sdir = h.dir; } } }
    for (let i = 0; i < n; i++) {
      const hs = hash(this.seed, i), ha = hash(this.seed + 1, i);
      // 形状：每个字有自己的角度和半径；整团的轮廓随时间起伏（变形），每 0.4 秒有一部分字换位置（重新排列）
      const k = Math.floor(t * 2.5 + hs * 7), swap = hash(this.seed + i, k), u = E.inOut(clamp((t * 2.5 + hs * 7 - k) * 3));
      const ang0 = (i / n + 0.13 * hash(this.seed + 2, i)) * 6.283, ang1 = ang0 + (swap < 0.3 ? (swap - 0.15) * 4 : 0);
      const ang = lerp(ang0, ang1, u);
      const wob = 1 + 0.22 * Math.sin(3 * ang + t * 1.7 + this.seed) + 0.14 * Math.sin(5 * ang - t * 2.3);
      let r = R * Math.sqrt(0.08 + 0.92 * ha) * wob;
      r *= 1 + sc * (0.9 + hash(this.seed + 4, i)) * (1 + 0.6 * Math.cos(ang - sdir));
      const x = c[0] + Math.cos(ang) * r * 1.15, y = c[1] - R + Math.sin(ang) * r * 0.9;
      drawGlyph(ctx, gly(this.seed * 1000 + i, t, 5, 0.3), x, Math.min(y, -this.size * 0.4), (hash(this.seed + 5, i) - 0.5) * 0.6, this.size * (0.75 + 0.5 * hs), a0, glitchAt(this.seed * 1000 + i, t, 0.04));
    }
    const la = this.lashAt(t);
    if (la) {                                                       // 字带：一串字从身体伸到末端
      const b = [c[0], c[1] - R * 0.9], tip = this.tipAt(t), len = Math.hypot(tip[0] - b[0], tip[1] - b[1]), m = Math.max(2, Math.floor(len / (this.size * 0.75)));
      const nx = -(tip[1] - b[1]) / (len || 1), ny = (tip[0] - b[0]) / (len || 1);
      for (let j = 1; j <= m; j++) { const v = j / m, w = Math.sin(v * 9 - t * 30) * this.size * 0.25 * (1 - v);
        drawGlyph(ctx, gly(this.seed * 3000 + j, t, 9, 0.5), lerp(b[0], tip[0], v) + nx * w, lerp(b[1], tip[1], v) + ny * w, 0, this.size * (1.1 - 0.4 * v), a0, glitchAt(this.seed * 3000 + j, t, 0.1)); }
    }
  }
}
// 乱码火柴人：沿着骨头每隔一段放一个乱码字，头是一个大大的 �
function drawGlyphFigure(ctx, j, size, seed, t, a = 1) {
  const bones = [[j.hip, j.neck], [j.lF[0], j.lF[1]], [j.lF[1], j.lF[2]], [j.lB[0], j.lB[1]], [j.lB[1], j.lB[2]], [j.aF[0], j.aF[1]], [j.aF[1], j.aF[2]], [j.aB[0], j.aB[1]], [j.aB[1], j.aB[2]]];
  let n = 0;
  for (const [p, q] of bones) {
    const len = Math.hypot(q[0] - p[0], q[1] - p[1]), m = Math.max(1, Math.round(len / (size * 0.62))), rot = Math.atan2(q[1] - p[1], q[0] - p[0]);
    ctx.save(); ctx.strokeStyle = `rgba(30,30,30,${0.9 * a})`; ctx.lineWidth = size * 1.1; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.restore();   // 暗底：骨头有粗细
    for (let k = 0; k <= m; k++, n++) { const v = k / m; drawGlyph(ctx, gly(seed * 100 + n, t, 6, 0.3), lerp(p[0], q[0], v), lerp(p[1], q[1], v), rot + Math.PI / 2, size, a, glitchAt(seed * 100 + n, t, 0.04)); }
  }
  drawGlyph(ctx, '�', j.head[0], j.head[1], 0, size * 2.6, a, glitchAt(seed + 77, t, 0.05));
}

// ———— v4 设计稿的造型（拆解 3.6：轮廓 + 核心、平时整齐、只有吃 / 被打时乱）————
// drawMound(ctx, x, y, R, o)：画一团乱码，(x, y) 是底部中心，R 是半径
//   o.style：'A' 鳞片土堆（外圈顺着轮廓排）| 'B' 绕核心的环 | 'C' 被搅乱的几行字（水滴形）
//   o.t 时间；o.sx / o.sy 缩放（预备时缩、弹）；o.aim 盯住的方向（弧度，给了就所有字一起转向那里、不转动）
//   o.mess 0~1 乱的程度（吃东西 / 被打）；o.hit 被打的方向（那一侧的字飞散）；o.core 核心显示的字（打嗝时闪被吃的字）
//   o.alpha；o.col
const CORE_COL = [250, 250, 250], BODY_COL = [214, 214, 214], DIM_COL = [120, 120, 120];
function drawMound(ctx, x, y, R, o = {}) {
  const t = o.t ?? 0, style = o.style || 'A', sx = o.sx ?? 1, sy = o.sy ?? 1, mess = o.mess ?? 0, a0 = o.alpha ?? 1, seed = o.seed ?? 21;
  const sz = o.size ?? Math.max(20, R * 0.3);
  const lean = o.lean ?? 0;                                                    // 往一侧倾（盯住时倾向主角）：顶部横移 lean × R
  if (o.fill !== false) {                                                      // 实心暗底：让它有体积、轮廓一眼看得出
    ctx.save(); ctx.fillStyle = `rgba(30,30,30,${0.9 * a0})`; ctx.beginPath();
    for (let k = 0; k <= 40; k++) { const u = k / 40, ang = Math.PI + u * Math.PI, py = style === 'C' ? -R * 2 * Math.sin(u * Math.PI) ** 0.8 : Math.sin(ang) * R * 1.02, px = style === 'C' ? (u - 0.5) * 2 * R * 0.95 * (0.6 + 0.4 * Math.sin(u * Math.PI)) : Math.cos(ang) * R * 1.3;
      const qx = x + (px + lean * R * (-py / (2 * R))) * sx, qy = y + py * sy; k ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const put = (i, px, py, rot, s, col, a = 1) => {
    let qx = px, qy = py, r = rot;
    if (o.aim !== undefined) r = o.aim;                                        // 所有字一个方向
    if (o.aimAt) r = Math.atan2(o.aimAt[1] - py, o.aimAt[0] - px);             // 盯住：每个字像指南针一样指向主角
    qx += lean * R * (-py / (2 * R));
    if (mess > 0) { qx += (hash(seed + i, 3) - 0.5) * R * 0.5 * mess; qy += (hash(seed + i, 4) - 0.5) * R * 0.4 * mess; r += (hash(seed + i, 5) - 0.5) * 3 * mess; }
    if (o.hit !== undefined) { const d = Math.cos(Math.atan2(py, px) - o.hit); if (d > 0.3) { qx += Math.cos(o.hit) * R * 0.9 * d * d; qy += Math.sin(o.hit) * R * 0.6 * d * d; r += d * 2; } }
    drawGlyph(ctx, gly(seed * 1000 + i, t, 4, 0.25 + 0.5 * mess), x + qx * sx, y + qy * sy, r, s, a * a0, mess > 0.5 ? glitchAt(seed + i, t, 0.3) : 0, col);
  };
  const spin = o.aim !== undefined || o.aimAt ? 0 : t * 0.6;                              // 平时慢慢绕核心转（约 10 秒一圈）
  let i = 0;
  if (style === 'A') {                                                        // 外圈：沿半椭圆轮廓排的"鳞片"
    for (let ring = 0; ring < 3; ring++) {
      const rr = R * (1 - ring * 0.2), n = Math.round(rr * Math.PI / (sz * (ring ? 1.05 : 0.82)));
      for (let k = 0; k <= n; k++, i++) {
        const u = k / n, ang = Math.PI + u * Math.PI + (ring % 2 ? 0.08 : 0) + Math.sin(spin + ring) * 0.03;
        const px = Math.cos(ang) * rr * 1.25, py = Math.sin(ang) * rr - sz * 0.45;
        put(i, px, py, ang + Math.PI / 2, sz * (ring ? 0.85 : 1.05), ring ? BODY_COL : CORE_COL, ring ? 0.75 : 1);
      }
    }
  } else if (style === 'B') {                                                 // 三个倾斜的环绕着核心转
    for (let ring = 0; ring < 3; ring++) {
      const tilt = [-0.5, 0.15, 0.8][ring], rx = R * 1.15, ry = R * 0.38, n = Math.round(2 * Math.PI * R * 0.8 / sz);
      for (let k = 0; k < n; k++, i++) {
        const ang = k / n * 2 * Math.PI + spin * (ring % 2 ? -1 : 1) * 1.4, ex = Math.cos(ang) * rx, ey = Math.sin(ang) * ry;
        const px = ex * Math.cos(tilt) - ey * Math.sin(tilt), py = ex * Math.sin(tilt) + ey * Math.cos(tilt) - R * 0.95;
        const front = Math.sin(ang) > 0;
        put(i, px, py, Math.atan2(py + R * 0.95, px) + Math.PI / 2, sz * (front ? 1 : 0.8), front ? CORE_COL : DIM_COL, front ? 1 : 0.7);
      }
    }
  } else {                                                                     // C：几行"被搅乱的文本"，越往下越宽，像一滴往下坠的字
    const rows = Math.max(4, Math.round(R * 1.9 / (sz * 1.05)));
    for (let r = 0; r < rows; r++) {
      const v = (r + 0.5) / rows, w = R * 1.3 * Math.sin(Math.PI * Math.min(1, v * 0.82 + 0.1)) * (0.35 + 0.65 * v), n = Math.max(1, Math.round(2 * w / (sz * 0.9)));
      const py = -R * 2 + v * R * 2 - sz * 0.3, bend = Math.sin(v * 5 + spin * 2) * R * 0.08;
      for (let k = 0; k < n; k++, i++) put(i, -w + (k + 0.5) * 2 * w / n + bend, py, Math.sin(v * 5 + spin * 2) * 0.15, sz * 0.95, v > 0.75 ? CORE_COL : BODY_COL, 0.65 + 0.35 * v);
    }
  }
  // 核心：最大最亮的 �（打嗝时闪出被吃的字）
  const cy = style === 'C' ? -R * 0.75 : -R * 0.55;
  drawGlyph(ctx, o.core || '�', x + (lean * R * (-cy / (2 * R)) + (o.aimAt ? Math.sign(o.aimAt[0]) * R * 0.2 : 0)) * sx, y + cy * sy, 0, sz * 2.6, a0, 0, CORE_COL);
}
// 地上的痕迹：被它碰过的字变成暗灰乱码留在原地
function drawTrace(ctx, x0, x1, y, size, t, a = 0.5) {
  for (let x = x0, i = 0; x < x1; x += size * 2.2, i++) drawGlyph(ctx, gly(4000 + i, 0), x, y, (hash(i, 9) - 0.5) * 0.6, size, a, 0, DIM_COL);
}

module.exports = { GLY, gly, glitchAt, drawGlyph, fall, Clump, Blob, drawGlyphFigure, drawMound, drawTrace, hash };
