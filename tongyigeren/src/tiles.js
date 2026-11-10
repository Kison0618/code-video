// “小木板”引擎：先把画面画进一张很小的画布（一个像素 = 一块小木板），再一块一块铺到 1920×1080 上。
// 每块木板可以单独：翻面（从画面 A 换成画面 B）、变亮、缩小、消失。全片“被换掉”的效果都靠这个。
'use strict';

class Grid {
  constructor(pitch, gap) {
    this.p = pitch; this.gap = gap === undefined ? (pitch >= 10 ? 2 : 1) : gap;
    this.gw = Math.ceil(W / pitch); this.gh = Math.ceil(H / pitch);
    this.n = this.gw * this.gh;
    const mk = () => { const c = document.createElement('canvas'); c.width = this.gw; c.height = this.gh; return c; };
    this.ca = mk(); this.cb = mk(); this.tmp = [mk(), mk(), mk()];
    this.xa = this.ca.getContext('2d', { willReadFrequently: true });
    this.xb = this.cb.getContext('2d', { willReadFrequently: true });
    this.tx = this.tmp.map(c => c.getContext('2d'));
    this.phase = new Float32Array(this.n);     // 0 = 画面 A，1 = 画面 B，中间 = 正在翻
    this.gain = new Float32Array(this.n);      // 额外亮度（0 = 不变）
    this.hide = new Uint8Array(this.n);        // 1 = 这块不画（被拿走了）
    this.jit = new Float32Array(this.n);
    for (let i = 0; i < this.n; i++) this.jit[i] = 0.93 + 0.14 * hash(i * 7 + 13);
    this.out = document.createElement('canvas'); this.out.width = W; this.out.height = H;
    this.ox = this.out.getContext('2d');
    this.img = this.ox.createImageData(W, H);
    this.u32 = new Uint32Array(this.img.data.buffer);
    this.useB = false;
  }
  // 开始画 A（或 B）。返回的 ctx 用 1920×1080 的世界坐标画就行。cam = {z, x, y}：以 (x,y) 为中心放大 z 倍
  begin(which, cam) {
    const x = which === 'b' ? this.xb : this.xa;
    if (which === 'b') this.useB = true;
    x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none';
    x.fillStyle = css(PAL.bg); x.fillRect(0, 0, this.gw, this.gh);
    this.setCam(x, cam);
    x.grid = this;
    return x;
  }
  setCam(x, cam) {
    const k = 1 / this.p, z = cam ? cam.z : 1, cx = cam ? cam.x : W / 2, cy = cam ? cam.y : H / 2;
    x.setTransform(k * z, 0, 0, k * z, k * (W / 2 - cx * z), k * (H / 2 - cy * z));
    x.cam = cam || { z: 1, x: W / 2, y: H / 2 };
  }
  reset() { this.phase.fill(0); this.gain.fill(0); this.hide.fill(0); this.useB = false; }
  // 世界坐标 → 木板编号（按当前镜头）
  cell(wx, wy, cam) { const z = cam ? cam.z : 1, cx = cam ? cam.x : W / 2, cy = cam ? cam.y : H / 2; return [Math.floor(((wx - cx) * z + W / 2) / this.p), Math.floor(((wy - cy) * z + H / 2) / this.p)]; }
  // 交叉淡化两种画法（慢慢换东西用）：k=0 只画 a，k=1 只画 b，中间是严格的线性过渡
  xfade(ctx, k, a, b) {
    if (k <= 0.001) return a(ctx); if (k >= 0.999) return b(ctx);
    const [t1, t2, t3] = this.tx, m = ctx.getTransform();
    for (const t of [t1, t2]) { t.setTransform(1, 0, 0, 1, 0, 0); t.clearRect(0, 0, this.gw, this.gh); t.setTransform(m); t.globalAlpha = 1; t.cam = ctx.cam; t.grid = this; }
    a(t1); b(t2);
    t3.setTransform(1, 0, 0, 1, 0, 0); t3.globalCompositeOperation = 'source-over'; t3.clearRect(0, 0, this.gw, this.gh);
    t3.globalAlpha = 1 - k; t3.drawImage(this.tmp[0], 0, 0);
    t3.globalCompositeOperation = 'lighter'; t3.globalAlpha = k; t3.drawImage(this.tmp[1], 0, 0);
    t3.globalAlpha = 1; t3.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.tmp[2], 0, 0); ctx.restore();
  }
  // 铺木板。flash = 翻面那一瞬间闪的颜色
  present(opts) {
    opts = opts || {};
    const { gw, gh, p, gap, u32, phase, gain, hide, jit } = this, ts = p - gap;
    const A = this.xa.getImageData(0, 0, gw, gh).data, B = this.useB ? this.xb.getImageData(0, 0, gw, gh).data : null;
    const fl = opts.flash || PAL.gold, bgc = PAL.bg;
    const bg32 = 0xff000000 | (bgc[2] << 16) | (bgc[1] << 8) | bgc[0];
    u32.fill(bg32);
    const gapK = opts.gapK === undefined ? .5 : opts.gapK, bevel = ts >= 4, hiK = p >= 10 ? 1.16 : 1.09, loK = p >= 10 ? 0.8 : 0.88;
    for (let iy = 0; iy < gh; iy++) {
      const y0 = iy * p; if (y0 >= H) break;
      for (let ix = 0; ix < gw; ix++) {
        const i = iy * gw + ix; if (hide[i]) continue;
        const x0 = ix * p; if (x0 >= W) break;
        let ph = B ? phase[i] : 0, o = i * 4, r, g, b, sx = 1, f = 0;
        if (ph <= 0) { r = A[o]; g = A[o + 1]; b = A[o + 2]; }
        else if (ph >= 1) { r = B[o]; g = B[o + 1]; b = B[o + 2]; }
        else if (Math.abs(A[o] - B[o]) + Math.abs(A[o + 1] - B[o + 1]) + Math.abs(A[o + 2] - B[o + 2]) < 14) { r = A[o]; g = A[o + 1]; b = A[o + 2]; }   // 两面一样：不用翻
        else {
          const src = ph < .5 ? A : B; r = src[o]; g = src[o + 1]; b = src[o + 2];
          const cph = Math.cos(Math.PI * ph); sx = Math.abs(cph); f = (1 - sx) * (1 - sx);
        }
        let k = jit[i] * (1 + gain[i]);
        r *= k; g *= k; b *= k;
        if (f > 0) { const ff = f * .85; r += (fl[0] - r) * ff; g += (fl[1] - g) * ff; b += (fl[2] - b) * ff; }
        if (r + g + b < 9) continue;
        if (gapK > 0) {                         // 缝不是纯黑，而是木板自己颜色的暗一档，画面更柔
          const cg = 0xff000000 | ((b * gapK) << 16) | ((g * gapK) << 8) | (r * gapK), xe2 = Math.min(W, x0 + p), ye2 = Math.min(H, y0 + p);
          for (let y = y0; y < ye2; y++) { let q = y * W + x0; for (let x = x0; x < xe2; x++) u32[q++] = cg; }
        }
        const w = sx >= 1 ? ts : Math.max(1, Math.round(ts * sx)), xo = x0 + ((ts - w) >> 1);
        const xe = Math.min(W, xo + w), ye = Math.min(H, y0 + ts);
        const c = 0xff000000 | (Math.min(255, b) << 16) | (Math.min(255, g) << 8) | Math.min(255, r);
        if (bevel) {
          const ch = 0xff000000 | (Math.min(255, b * hiK) << 16) | (Math.min(255, g * hiK) << 8) | Math.min(255, r * hiK);
          const cl = 0xff000000 | ((b * loK) << 16) | ((g * loK) << 8) | (r * loK);
          for (let y = y0; y < ye; y++) { const cc = y === y0 ? ch : y === ye - 1 ? cl : c; let q = y * W + xo; for (let x = xo; x < xe; x++) u32[q++] = cc; }
        } else {
          for (let y = y0; y < ye; y++) { let q = y * W + xo; for (let x = xo; x < xe; x++) u32[q++] = c; }
        }
      }
    }
    this.ox.putImageData(this.img, 0, 0);
    return this.out;
  }
  // 把“现在看到的样子”压成画面 A（翻过去的用 B 的颜色，被拿走的变黑），然后就可以再接一次翻面
  bake() {
    if (this.useB) {
      const ia = this.xa.getImageData(0, 0, this.gw, this.gh), ib = this.xb.getImageData(0, 0, this.gw, this.gh), a = ia.data, b = ib.data, bg = PAL.bg;
      for (let i = 0; i < this.n; i++) { const o = i * 4; if (this.hide[i]) { a[o] = bg[0]; a[o + 1] = bg[1]; a[o + 2] = bg[2]; } else if (this.phase[i] >= .5) { a[o] = b[o]; a[o + 1] = b[o + 1]; a[o + 2] = b[o + 2]; } }
      this.xa.putImageData(ia, 0, 0);
    }
    this.phase.fill(0); this.hide.fill(0); this.gain.fill(0);
  }
  // 整屏翻黑（k: 0→1），远处先翻
  toBlack(k, o) { this.bake(); this.xb.setTransform(1, 0, 0, 1, 0, 0); this.xb.globalAlpha = 1; this.xb.globalCompositeOperation = 'source-over'; this.xb.fillStyle = css(PAL.bg); this.xb.fillRect(0, 0, this.gw, this.gh); this.useB = true; Flip.wave(this, k, Object.assign({ far: 1, ox: this.gw / 2, oy: this.gh / 2, width: 8, rnd: 5 }, o)); }
  // 从黑里翻出来（k: 0→1），中间先翻。调用前画面 A 里已经是要出现的画面
  fromBlack(k, o) { this.bake(); this.xb.setTransform(1, 0, 0, 1, 0, 0); this.xb.globalAlpha = 1; this.xb.globalCompositeOperation = 'copy'; this.xb.drawImage(this.ca, 0, 0); this.xb.globalCompositeOperation = 'source-over'; this.xa.setTransform(1, 0, 0, 1, 0, 0); this.xa.fillStyle = css(PAL.bg); this.xa.fillRect(0, 0, this.gw, this.gh); this.useB = true; Flip.wave(this, k, Object.assign({ ox: this.gw / 2, oy: this.gh / 2, width: 8, rnd: 5 }, o)); }
  // 读某块木板现在的颜色（做“掉下来的旧木板”时用）
  sample(which) { return (which === 'b' ? this.xb : this.xa).getImageData(0, 0, this.gw, this.gh).data; }
}

// ---------- 翻面的几种节奏（往 grid.phase 里写） ----------
const Flip = {
  // 一道波从 (ox,oy) 往外推：prog 0→1；width = 波前有多宽（格）；rnd = 每块的随机提前量
  wave(g, prog, o) {
    o = o || {}; const { gw, gh, phase } = g, ox = o.ox === undefined ? 0 : o.ox, oy = o.oy === undefined ? gh / 2 : o.oy;
    const dir = o.dir || 'radial', width = o.width || 14, rnd = o.rnd === undefined ? 6 : o.rnd, rect = o.rect, inv = o.inv, seed = o.seed || 0;
    let maxd = 0;
    const dist = (x, y) => dir === 'x' ? Math.abs(x - ox) : dir === 'y' ? Math.abs(y - oy) : dir === 'diag' ? Math.abs((x - ox) + (y - oy) * 1.2) : Math.hypot(x - ox, (y - oy));
    const x0 = rect ? Math.max(0, rect[0]) : 0, y0 = rect ? Math.max(0, rect[1]) : 0, x1 = rect ? Math.min(gw, rect[2]) : gw, y1 = rect ? Math.min(gh, rect[3]) : gh;
    for (const [x, y] of [[x0, y0], [x1, y0], [x0, y1], [x1, y1]]) maxd = Math.max(maxd, dist(x, y));
    const front = prog * (maxd + width + rnd);
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = y * gw + x, d0 = dist(x, y), d = (o.far ? maxd - d0 : d0) + rnd * hash(i + seed * 977);
      let ph = sat((front - d) / width);
      if (inv) ph = 1 - ph;
      phase[i] = o.max ? Math.max(phase[i], ph) : ph;
    }
  },
  // 零零星星地、一块一块换：prog 0→1，每块在自己的随机时刻翻
  scatter(g, prog, o) {
    o = o || {}; const { gw, gh, phase } = g, dur = o.dur || .06, seed = o.seed || 0, rect = o.rect;
    const x0 = rect ? Math.max(0, rect[0]) : 0, y0 = rect ? Math.max(0, rect[1]) : 0, x1 = rect ? Math.min(gw, rect[2]) : gw, y1 = rect ? Math.min(gh, rect[3]) : gh;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const i = y * gw + x, t0 = hash(i * 3 + seed * 131) * (1 - dur);
      phase[i] = sat((prog - t0) / dur);
    }
  },
  rect(g, r, v) { const { gw, gh, phase } = g; for (let y = Math.max(0, r[1]); y < Math.min(gh, r[3]); y++) for (let x = Math.max(0, r[0]); x < Math.min(gw, r[2]); x++) phase[y * gw + x] = v; },
  all(g, v) { g.phase.fill(v); },
};

// ---------- 飞在外面的散木板（掉下来、飞过去、拼起来），每块的位置只由时间决定 ----------
// 一块散木板：{x,y 起点, tx,ty 终点, t0 出发, dur 飞多久, c 颜色, s 边长, arc 抛多高, spin}
function drawLoose(ctx, list, t, o) {
  o = o || {};
  for (let i = 0; i < list.length; i++) {
    const q = list[i]; if (t < q.t0 && !q.pre) continue;
    const k = sat((t - q.t0) / q.dur); if (k >= 1 && q.gone) continue;
    const e = q.ease ? q.ease(k) : E.io(k);
    const x = q.x + (q.tx - q.x) * e + (q.wob || 0) * Math.sin(k * Math.PI) * Math.sin(i * 1.7),
      y = q.y + (q.ty - q.y) * e - (q.arc || 0) * Math.sin(Math.PI * k);
    const rot = (q.spin || 0) * (1 - e) * Math.PI * 2, s = q.s * (q.s1 !== undefined ? lerp(1, q.s1, e) : 1);
    let a = q.a === undefined ? 1 : q.a; if (q.fade) a *= 1 - seg(k, .7, 1); if (q.fin) a *= seg(k, 0, .15);
    if (a <= 0.01) continue;
    const c = q.c1 ? mixc(q.c, q.c1, e) : q.c, lit = q.lit ? 1 + q.lit * Math.sin(Math.PI * k) : 1;
    ctx.fillStyle = css([Math.min(255, c[0] * lit), Math.min(255, c[1] * lit), Math.min(255, c[2] * lit)], a);
    if (q.cell && k >= 1) { ctx.fillStyle = css(mul(c, .5), a); ctx.fillRect(x, y, q.cell, q.cell); ctx.fillStyle = css(c, a); ctx.fillRect(x, y, s, s); continue; }
    if (rot) { ctx.save(); ctx.translate(x + s / 2, y + s / 2); ctx.rotate(rot); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore(); }
    else ctx.fillRect(x, y, s, s);
  }
}

// 全片共用两种粗细的木板：6px（远景，320×180 块）和 12px（近景，看得清一块一块）
const G6 = new Grid(6), G12 = new Grid(12);
const SCENES = [];                       // 每个场景：{name, t0: 开始时间, draw(ctx, t)}
// 两种粗细的木板之间换场：先整屏翻黑（远的先翻），下一个场景再从黑里翻出来
const Trans = {
  out(g, k, o) { if (k > 0) g.toBlack(k, o); },
  // 用法：if (k < 1) { g.begin('a'); paint(g.begin('b')); Trans.in(g, k) } else paint(g.begin('a'))
  in(g, k, o) { Flip.wave(g, k, Object.assign({ width: 10, rnd: 6, ox: g.gw / 2, oy: g.gh / 2 }, o)); },
};

// 把画面切成一块块“碎片”再各自挪开：fn(bx, by, 第几块) → [往右挪几格, 往下挪几格]。which = 'a' / 'b'
Grid.prototype.shatter = function (which, bw, bh, fn) {
  const src = which === 'b' ? this.cb : this.ca, x = which === 'b' ? this.xb : this.xa, tmp = this.tx[2];
  tmp.setTransform(1, 0, 0, 1, 0, 0); tmp.globalAlpha = 1; tmp.globalCompositeOperation = 'source-over'; tmp.fillStyle = css(PAL.bg); tmp.fillRect(0, 0, this.gw, this.gh);
  let k = 0;
  for (let by = 0; by * bh < this.gh; by++) for (let bx = 0; bx * bw < this.gw; bx++, k++) {
    const o = fn(bx, by, k), sx = bx * bw, sy = by * bh;
    tmp.drawImage(src, sx, sy, bw, bh, sx + Math.round(o[0]), sy + Math.round(o[1]), bw, bh);
  }
  x.save(); x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'copy'; x.drawImage(this.tmp[2], 0, 0); x.restore();
};
