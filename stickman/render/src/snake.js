// hi 长蛇：while True 的输出首尾相连成一条蛇（剧本 v2 第三幕）
//   蛇身 = 蛇头走过的路。蛇头从代码里出发，所以尾巴永远连着代码；蛇头走多远，蛇就有多长（无限循环 = 无限长）
//   const s = new Snake({ t0, t1, head: spline([[t, x, y, z], ...]), gap: 62 })
//   s.draw(ctx, t, 'back' | 'front')   z > 0 的部分画在人前面（缠绕时绕到身前），其余画在后面
//   s.segs(t) → [{ x, y, rot, z, k }]  k = 0 是蛇头
// 全部按时间预先采样，确定性。
'use strict';
const K = require('./core');
const { clamp } = K;
const PR = require('./props');

// 过关键帧的 Catmull-Rom 曲线：keys = [[t, x, y, z?], ...]，返回 t → [x, y, z]
// o.mono：单调插值（关键帧速度差很大时，普通 Catmull-Rom 会冲过头再折回来，蛇身就挤成一团）
function spline(keys, o = {}) {
  const n = keys.length;
  return t => {
    if (t <= keys[0][0]) return [keys[0][1], keys[0][2], keys[0][3] || 0];
    if (t >= keys[n - 1][0]) { const k = keys[n - 1]; return [k[1], k[2], k[3] || 0]; }
    let i = 0; while (keys[i + 1][0] < t) i++;
    const p0 = keys[Math.max(0, i - 1)], p1 = keys[i], p2 = keys[i + 1], p3 = keys[Math.min(n - 1, i + 2)];
    const u = (t - p1[0]) / (p2[0] - p1[0]);
    // 非均匀时间间隔：切线按时间缩放，速度连续
    const out = [];
    for (let c = 1; c <= 3; c++) {
      const a = p0[c] || 0, b = p1[c] || 0, d = p2[c] || 0, e = p3[c] || 0;
      let m1 = (d - a) / Math.max(1e-6, p2[0] - p0[0]) * (p2[0] - p1[0]), m2 = (e - b) / Math.max(1e-6, p3[0] - p1[0]) * (p2[0] - p1[0]);
      if (o.mono) {
        const s0 = (b - a) / Math.max(1e-6, p1[0] - p0[0]), s1 = (d - b) / Math.max(1e-6, p2[0] - p1[0]), s2 = (e - d) / Math.max(1e-6, p3[0] - p2[0]), h = p2[0] - p1[0];
        const lim = (m, sa, sb) => (sa * sb <= 0 ? 0 : Math.sign(m) * Math.min(Math.abs(m), 3 * Math.abs(sa) * h, 3 * Math.abs(sb) * h));
        m1 = i === 0 ? s1 * h : lim(m1, s0, s1); m2 = i + 2 >= n ? s1 * h : lim(m2, s1, s2);
      }
      const u2 = u * u, u3 = u2 * u;
      out.push((2 * u3 - 3 * u2 + 1) * b + (u3 - 2 * u2 + u) * m1 + (-2 * u3 + 3 * u2) * d + (u3 - u2) * m2);
    }
    return out;
  };
}
// 分段拼接：[[t0, fn], [t1, fn2], ...]，每段从自己的起始时间开始生效
function pieces(list) { return t => { let f = list[0][1]; for (const [t0, fn] of list) if (t >= t0) f = fn; return f(t); }; }

class Snake {
  // o: { t0, t1, head: t → [x, y, z], gap, word, size, freeze, wig: t → 振幅, mouth: t → 0~1, max（最多几节：有限的蛇尾巴会离开代码）, plain,
  //      bob: t → [dx, dy] 蛇头原地晃（蹭人、点头）：只偏移头和后面两节，不进轨迹——轨迹来回折会让蛇身挤成一团 }
  constructor(o) {
    Object.assign(this, { gap: 62, word: 'hi', headWord: 'HI', size: 50, freeze: 1e9, wig: () => 10, mouth: () => 0, bob: null, max: 420 }, o);
    const DT = 1 / 240;
    this.pts = []; this.S = [];
    let s = 0, prev = null;
    for (let t = this.t0; t <= this.t1 + 1e-9; t += DT) {
      const p = this.head(t);
      if (prev) s += Math.hypot(p[0] - prev[0], p[1] - prev[1]);
      this.pts.push(p); this.S.push(s); prev = p;
    }
    this.DT = DT;
  }
  idx(t) { return clamp(Math.round((Math.min(t, this.freeze, this.t1) - this.t0) / this.DT), 0, this.pts.length - 1); }
  // 弧长 → 点（在采样点之间插值）
  at(s, i1) {
    let lo = 0, hi = i1;
    while (lo < hi) { const m = (lo + hi) >> 1; if (this.S[m] < s) lo = m + 1; else hi = m; }
    const i = Math.max(1, lo), a = this.pts[i - 1], b = this.pts[i], ds = this.S[i] - this.S[i - 1], u = ds > 0 ? clamp((s - this.S[i - 1]) / ds) : 0;
    return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * u];
  }
  segs(t) {
    if (t < this.t0) return [];
    const tt = Math.min(t, this.freeze), i1 = this.idx(tt), sh = this.S[i1], out = [], amp = this.wig(tt);
    const n = Math.min(this.max, Math.floor(sh / this.gap) + 1);
    for (let k = 0; k < n; k++) {
      const s = sh - k * this.gap;
      const p = k === 0 ? this.pts[i1] : this.at(s, i1);
      const a = this.at(Math.max(0, s - this.gap * 0.5), i1), b = k === 0 ? this.at(Math.max(0, s - 2), i1) : this.at(Math.min(sh, s + this.gap * 0.5), i1);
      let tx = k === 0 ? p[0] - b[0] : b[0] - a[0], ty = k === 0 ? p[1] - b[1] : b[1] - a[1];
      const L = Math.hypot(tx, ty) || 1; tx /= L; ty /= L;
      // 游动：沿蛇身往后传的横向波，蛇头附近小
      const w = amp * Math.sin(s / 260 * Math.PI * 2 - tt * 9) * Math.min(1, k / 3);
      const bb = this.bob ? this.bob(tt) : null, f = bb ? Math.max(0, 1 - k / 2.5) : 0;
      out.push({ x: p[0] - ty * w + (f && bb[0] * f), y: p[1] + tx * w + (f && bb[1] * f), z: p[2] || 0, rot: Math.atan2(ty, tx), k });
    }
    return out;
  }
  // 蛇头位置和朝向（给碰撞、镜头用）
  headAt(t) { const g = this.segs(t); return g.length ? g[0] : null; }
  draw(ctx, t, layer = 'back', o = {}) {
    const g = this.segs(t), alpha = o.alpha ?? 1;
    for (let i = g.length - 1; i >= 0; i--) {
      const q = g[i];
      if ((layer === 'front') !== (q.z > 0)) continue;
      // 字一直保持正着读：往左走时转半圈
      let r = q.rot; const flip = Math.cos(r) < 0; if (flip) r += Math.PI;
      if (q.k > 0 || this.plain) { PR.word(ctx, this.word, q.x, q.y, r, this.size, alpha); continue; }   // plain：蛇头也是普通的字（驯服后的小蛇）
      // 蛇头：大一号的 HI，嘴（H 和 I 之间）会张开
      const m = clamp(this.mouth(Math.min(t, this.freeze))), sz = this.size * 1.7, d = sz * (0.3 + 0.18 * m);
      const fw = flip ? -1 : 1;                                   // 朝前的那个字母是 I（往左走时是 H 在前）
      ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(r);
      PR.word(ctx, 'H', -d, 0, -0.38 * m * fw, sz, alpha);
      PR.word(ctx, 'I', d, 0, 0.38 * m * fw, sz, alpha);
      ctx.restore();
    }
  }
}

module.exports = { Snake, spline, pieces };
