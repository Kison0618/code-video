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

module.exports = { GLY, gly, glitchAt, drawGlyph, fall, Clump, hash };
