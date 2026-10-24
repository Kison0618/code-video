// fx.js —《懂事》「灯下光尘」：光点累加缓冲（叠得越密越亮，像曝光）+ 选择性泛光
// 人物、云、雨、火星、片名、盆景都由光点组成；同一批光点可以在形状之间流动。所有光点只由 t 决定，同一帧怎么截都一样。
'use strict';
const PX = (() => {
  const BW = W >> 1, BH = H >> 1, A = new Float32Array(W * H * 3), B = new Float32Array(BW * BH * 3);
  const OC = mk(W, H), oc = OC.getContext('2d'), OI = oc.createImageData(W, H);
  const BC = mk(BW, BH), bc = BC.getContext('2d'), BI = bc.createImageData(BW, BH);
  const LUT = new Uint8ClampedArray(4096); for (let i = 0; i < 4096; i++) LUT[i] = Math.round(255 * (1 - Math.exp(-i / 620)));
  const M = [1, 0, 0, 1, 0, 0]; let x0, y0, x1, y1, u0, v0, u1, v1, SC = 1;
  function reset() { x0 = y0 = u0 = v0 = 1e9; x1 = y1 = u1 = v1 = -1; } reset();
  function useM(c = sx) { const m = c.getTransform(); M[0] = m.a; M[1] = m.b; M[2] = m.c; M[3] = m.d; M[4] = m.e; M[5] = m.f; SC = Math.hypot(m.a, m.b); return SC; }
  const X = (x, y) => M[0] * x + M[2] * y + M[4], Y = (x, y) => M[1] * x + M[3] * y + M[5];
  function inv(xs, ys) { const det = M[0] * M[3] - M[1] * M[2], xx = xs - M[4], yy = ys - M[5]; return [(M[3] * xx - M[2] * yy) / det, (-M[1] * xx + M[0] * yy) / det]; }
  function sp(x, y, r, g, b) {
    if (!(x >= 0 && y >= 0 && x < W - 1 && y < H - 1)) return;
    const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy;
    if (ix < x0) x0 = ix; if (ix > x1) x1 = ix; if (iy < y0) y0 = iy; if (iy > y1) y1 = iy;
    const w0 = (1 - fx) * (1 - fy), w1 = fx * (1 - fy), w2 = (1 - fx) * fy, w3 = fx * fy;
    let k = (iy * W + ix) * 3;
    A[k] += r * w0; A[k + 1] += g * w0; A[k + 2] += b * w0; A[k + 3] += r * w1; A[k + 4] += g * w1; A[k + 5] += b * w1;
    k += W * 3;
    A[k] += r * w2; A[k + 1] += g * w2; A[k + 2] += b * w2; A[k + 3] += r * w3; A[k + 4] += g * w3; A[k + 5] += b * w3;
  }
  function sb(x, y, r, g, b) {
    x *= .5; y *= .5; if (!(x >= 0 && y >= 0 && x < BW - 1 && y < BH - 1)) return;
    const ix = x | 0, iy = y | 0, fx = x - ix, fy = y - iy;
    if (ix < u0) u0 = ix; if (ix > u1) u1 = ix; if (iy < v0) v0 = iy; if (iy > v1) v1 = iy;
    const w0 = (1 - fx) * (1 - fy), w1 = fx * (1 - fy), w2 = (1 - fx) * fy, w3 = fx * fy;
    let k = (iy * BW + ix) * 3;
    B[k] += r * w0; B[k + 1] += g * w0; B[k + 2] += b * w0; B[k + 3] += r * w1; B[k + 4] += g * w1; B[k + 5] += b * w1;
    k += BW * 3;
    B[k] += r * w2; B[k + 1] += g * w2; B[k + 2] += b * w2; B[k + 3] += r * w3; B[k + 4] += g * w3; B[k + 5] += b * w3;
  }
  // 屏幕坐标一颗光点：col 0–255，k 亮度（1 ≈ 一个像素接近饱和），bl 额外泛光
  function spt(x, y, col, k, bl = 0) { const s = k / 255; sp(x, y, col[0] * s, col[1] * s, col[2] * s); if (bl > 0) { const q = s * bl; sb(x, y, col[0] * q, col[1] * q, col[2] * q); } }
  function pt(x, y, col, k, bl = 0) { spt(X(x, y), Y(x, y), col, k, bl); }
  function sline(xa, ya, xb, yb, col, ka, kb, bl = 0) {   // 屏幕坐标一道细光：亮度从 ka 渐变到 kb
    const L = Math.hypot(xb - xa, yb - ya), n = Math.max(1, Math.ceil(L / .9));
    if (L > 4000) return;
    for (let i = 0; i <= n; i++) { const u = i / n; spt(xa + (xb - xa) * u, ya + (yb - ya) * u, col, ka + (kb - ka) * u, (i & 3) ? 0 : bl * 2); }
  }
  function line(xa, ya, xb, yb, col, ka, kb, bl = 0) { sline(X(xa, ya), Y(xa, ya), X(xb, yb), Y(xb, yb), col, ka, kb, bl); }
  function sdisc(x, y, r, col, k, bl = 0) {   // 屏幕坐标一个软圆点（半径 r 像素）
    if (r <= .8) { spt(x, y, col, k, bl); return; }
    const n = Math.ceil(r);
    for (let dy = -n; dy <= n; dy++) for (let dx = -n; dx <= n; dx++) { const q = 1 - (dx * dx + dy * dy) / (r * r); if (q > 0) spt(x + dx, y + dy, col, k * q, 0); }
    if (bl > 0) spt(x, y, col, 0, bl * k * r);
  }
  function glowB(x, y, rad, col, k) {   // 泛光缓冲里的一团软光（世界坐标，半径按屏幕缩放）
    const xs = X(x, y), ys = Y(x, y), R = Math.max(1, rad * SC * .5), n = Math.ceil(R), s = k / 255;
    for (let dy = -n; dy <= n; dy += 1) for (let dx = -n; dx <= n; dx += 1) { const q = 1 - (dx * dx + dy * dy) / (R * R); if (q > 0) sb(xs + dx * 2, ys + dy * 2, col[0] * s * q, col[1] * s * q, col[2] * s * q); }
  }
  function flush(c = sx) {
    if (x1 >= x0) {
      const xa = x0, ya = y0, xb = Math.min(W - 1, x1 + 1), yb = Math.min(H - 1, y1 + 1), D = OI.data;
      for (let y = ya; y <= yb; y++) {
        let k = (y * W + xa) * 3, j = (y * W + xa) * 4;
        for (let x = xa; x <= xb; x++, k += 3, j += 4) {
          const r = A[k] * 1000, g = A[k + 1] * 1000, b = A[k + 2] * 1000;
          D[j] = LUT[r > 4095 ? 4095 : r | 0]; D[j + 1] = LUT[g > 4095 ? 4095 : g | 0]; D[j + 2] = LUT[b > 4095 ? 4095 : b | 0]; D[j + 3] = 255;
          A[k] = A[k + 1] = A[k + 2] = 0;
        }
      }
      const w = xb - xa + 1, h = yb - ya + 1;
      oc.putImageData(OI, 0, 0, xa, ya, w, h);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter'; c.drawImage(OC, xa, ya, w, h, xa, ya, w, h); c.restore();
    }
    if (u1 >= u0) {
      const m = 14, xa = Math.max(0, u0 - m), ya = Math.max(0, v0 - m), xb = Math.min(BW - 1, u1 + 1 + m), yb = Math.min(BH - 1, v1 + 1 + m), D = BI.data;
      for (let y = ya; y <= yb; y++) {
        let k = (y * BW + xa) * 3, j = (y * BW + xa) * 4;
        for (let x = xa; x <= xb; x++, k += 3, j += 4) {
          const r = B[k] * 1000, g = B[k + 1] * 1000, b = B[k + 2] * 1000;
          D[j] = LUT[r > 4095 ? 4095 : r | 0]; D[j + 1] = LUT[g > 4095 ? 4095 : g | 0]; D[j + 2] = LUT[b > 4095 ? 4095 : b | 0]; D[j + 3] = 255;
          B[k] = B[k + 1] = B[k + 2] = 0;
        }
      }
      const w = xb - xa + 1, h = yb - ya + 1;
      bc.putImageData(BI, 0, 0, xa, ya, w, h);
      c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; c.globalCompositeOperation = 'lighter';
      c.filter = 'blur(4px)'; c.drawImage(BC, xa, ya, w, h, xa * 2, ya * 2, w * 2, h * 2);
      c.filter = 'blur(16px)'; c.drawImage(BC, xa, ya, w, h, xa * 2, ya * 2, w * 2, h * 2);
      c.filter = 'none'; c.restore();
    }
    reset();
  }
  return { useM, inv, X, Y, spt, pt, sline, line, sdisc, glowB, flush, get sc() { return SC; }, t: 0 };
})();

// ---------- 人物光尘：粒子挂在骨架胶囊上（边缘 = 胶囊轮廓，身体里 = 胶囊内部），姿势一变，光点跟着走 ----------
const GRP = [0, 0, 0, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 4, 4, 4];   // 远臂 / 远腿 / 躯干头 / 近腿 / 近臂（后画的在前面）
const TPL = {};
const FIG_REF = 620;          // 屏幕上身高 620px 时用满全部光点
function figTpl(kind) {
  if (TPL[kind]) return TPL[kind];
  const b = BN[kind], L = caps(fk(PO.stand, b), b), R = [], I = []; let id = kind === 'adult' ? 0 : 50000;
  L.forEach((q, c) => {
    const d = Math.hypot(q[1][0] - q[0][0], q[1][1] - q[0][1]), per = 2 * d + Math.PI * (q[2] + q[3]);
    const nr = Math.max(8, Math.round(per * 1.25 * FIG_REF));
    for (let k = 0; k < nr; k++, id++) R.push({ c, q: (k + rnd(id, 1)) / nr, o: rnd(id, 2), ph: rnd(id, 3) * 6.283, f: 1.5 + 4 * rnd(id, 4), w: rnd(id, 5), s: rnd(id, 6), id });
    const ab = d * (q[2] + q[3]), aa = Math.PI * q[2] * q[2] / 2, ae = Math.PI * q[3] * q[3] / 2, ni = Math.round((ab + aa + ae) * .05 * FIG_REF * FIG_REF);
    for (let k = 0; k < ni; k++, id++) { const z = rnd(id, 7) * (ab + aa + ae); I.push({ c, m: z < ab ? 0 : z < ab + aa ? 1 : 2, u: rnd(id, 8), v: rnd(id, 9) * 2 - 1, o: rnd(id, 2), ph: rnd(id, 3) * 6.283, f: 1 + 2.5 * rnd(id, 4), w: rnd(id, 5), s: rnd(id, 6), id }); }
  });
  return TPL[kind] = { R, I };
}
function bnMix(a, b, u) { const o = {}; for (const k in a) o[k] = lerp(a[k], b[k], u); return o; }
// 遍历人物的光点（世界坐标）。cb(x, y, k 亮度系数, p, rim)
function figEach(F, G, cb) {
  const sc = PX.useM(sx), hs = F.h * sc, tpl = figTpl(F.tpl || F.kind), L = G.L, n = L.length;
  const fr = clamp(hs / FIG_REF) * (F.sparse ? .5 : 1), fi = fr * clamp(hs / FIG_REF) * (F.sparse ? .4 : 1);
  const Ax = [], Ay = [], Dx = [], Dy = [], D2 = [], Dd = [], R0 = [], R1 = [], Ex = [], Ey = [];
  for (let j = 0; j < n; j++) {
    const q = L[j], a = G.tr(q[0]), e = G.tr(q[1]); Ax[j] = a[0]; Ay[j] = a[1]; Dx[j] = e[0] - a[0]; Dy[j] = e[1] - a[1];
    D2[j] = Dx[j] * Dx[j] + Dy[j] * Dy[j]; Dd[j] = Math.sqrt(D2[j]); R0[j] = q[2] * F.h; R1[j] = q[3] * F.h;
    if (Dd[j] > 1e-4) { Ex[j] = Dx[j] / Dd[j]; Ey[j] = Dy[j] / Dd[j]; } else { Ex[j] = 1; Ey[j] = 0; }
  }
  const inside = (j, px, py, eps) => {
    const vx = px - Ax[j], vy = py - Ay[j]; let u = D2[j] > 1e-8 ? (vx * Dx[j] + vy * Dy[j]) / D2[j] : 0; u = u < 0 ? 0 : u > 1 ? 1 : u;
    const cx = Ax[j] + Dx[j] * u - px, cy = Ay[j] + Dy[j] * u - py, r = R0[j] + (R1[j] - R0[j]) * u - eps; return r > 0 && cx * cx + cy * cy < r * r;
  };
  const eps = .9 / sc;
  for (const p of tpl.R) {
    if (p.o > fr) continue;
    const c = p.c, d = Dd[c], r0 = R0[c], r1 = R1[c], ex = Ex[c], ey = Ey[c], nx = -ey, ny = ex, P = 2 * d + Math.PI * (r0 + r1), s = p.q * P;
    let x, y;
    if (s < d) { const u = s / d, r = r0 + (r1 - r0) * u; x = Ax[c] + Dx[c] * u + nx * r; y = Ay[c] + Dy[c] * u + ny * r; }
    else if (s < d + Math.PI * r1) { const ph = (s - d) / r1, bx = Ax[c] + Dx[c], by = Ay[c] + Dy[c]; x = bx + r1 * (nx * Math.cos(ph) + ex * Math.sin(ph)); y = by + r1 * (ny * Math.cos(ph) + ey * Math.sin(ph)); }
    else if (s < 2 * d + Math.PI * r1) { const u = 1 - (s - d - Math.PI * r1) / d, r = r0 + (r1 - r0) * u; x = Ax[c] + Dx[c] * u - nx * r; y = Ay[c] + Dy[c] * u - ny * r; }
    else { const ph = (s - 2 * d - Math.PI * r1) / r0; x = Ax[c] + r0 * (-nx * Math.cos(ph) - ex * Math.sin(ph)); y = Ay[c] + r0 * (-ny * Math.cos(ph) - ey * Math.sin(ph)); }
    const g = GRP[c]; let k = 1, hid = false;
    for (let j = 0; j < n; j++) { if (j === c) continue; if (GRP[j] >= g && inside(j, x, y, eps)) { hid = true; break; } }
    if (hid) continue;
    if (g > 0) for (let j = 0; j < n; j++) if (GRP[j] < g && inside(j, x, y, 0)) { k = .5; break; }   // 身体前面的手臂、腿：内轮廓暗一些
    cb(x, y, k, p, true);
  }
  for (const p of tpl.I) {
    if (p.o > fi) continue;
    const c = p.c, r0 = R0[c], r1 = R1[c], ex = Ex[c], ey = Ey[c], nx = -ey, ny = ex;
    let x, y;
    if (p.m === 0) { const r = r0 + (r1 - r0) * p.u; x = Ax[c] + Dx[c] * p.u + nx * p.v * r; y = Ay[c] + Dy[c] * p.u + ny * p.v * r; }
    else { const rho = Math.sqrt(p.u), ph = p.v * Math.PI / 2, sg = p.m === 1 ? -1 : 1, r = p.m === 1 ? r0 : r1, bx = Ax[c] + (p.m === 2 ? Dx[c] : 0), by = Ay[c] + (p.m === 2 ? Dy[c] : 0);
      x = bx + r * rho * (sg * ex * Math.cos(ph) + nx * Math.sin(ph)); y = by + r * rho * (sg * ey * Math.cos(ph) + ny * Math.sin(ph)); }
    const g = GRP[c]; let hid = false;
    for (let j = 0; j < n; j++) { if (j === c) continue; const gj = GRP[j]; if ((gj > g || (gj === g && j < c)) && inside(j, x, y, 0)) { hid = true; break; } }
    if (hid) continue;
    cb(x, y, 1, p, false);
  }
}
// 光尘人物：深色身体（挡住身后）+ 边缘密而亮、身体里稀而暗的光点
// F 额外字段：draw 0..1（光点从 src 聚拢成形）、src(i, u0) → 世界坐标起点、scatter 0..1（散开）、sparse、nobody、refl（地面 y，画倒影）、tpl、bn、bloom、gain
function drawFigP(F, G) {
  const a = F.a ?? 1, t = PX.t, col = F.rim || C.silver, hot = mixC(col, C.white, .55), dim = mixC(col, C.body, .35);
  const dr = F.draw === undefined ? 1 : clamp(F.draw), sc = PX.useM(sx), kk = a * Math.max(1, Math.pow(F.h * sc / FIG_REF, -.25)) * (F.gain || 1);
  if (!F.nobody) { const ba = a * (dr < 1 ? eo(pr(dr, .45, 1)) : 1); if (ba > .01) { sx.save(); sx.globalAlpha = ba; figPath(sx, G, F, 0); sx.fillStyle = rgba(C.body); sx.fill(); sx.restore(); } }
  const sct = F.scatter || 0, hh = F.h, refl = F.refl, bl = F.bloom ?? .06;
  figEach(F, G, (x, y, k0, p, rim) => {
    let k = (rim ? 1.05 : .28) * k0 * kk * (.7 + .3 * Math.sin(t * p.f + p.ph));
    if (k <= .002) return;
    let px = x, py = y;
    if (sct > 0) { const an = p.ph, dd = hh * (.08 + .3 * p.s) * sct; px += Math.cos(an) * dd; py += Math.sin(an) * dd * .7 - hh * .12 * sct * p.w; k *= 1 + .8 * sct; }
    if (dr < 1) {   // 聚拢：每颗光点各自晚一点出发，飞到一半最亮，拖一小段光迹
      const s0 = p.s * .55, u = eio(clamp((dr - s0) / .45)); if (u <= 0) return;
      const S = F.src ? F.src(p.id, s0) : [x + Math.cos(p.ph) * hh * (.25 + .55 * p.w), y + Math.sin(p.ph) * hh * (.2 + .4 * p.w) - hh * .25];
      const cx_ = (S[0] + px) / 2 + (p.w - .5) * hh * .3, cy_ = Math.min(S[1], py) - hh * .15 * p.s;
      const at = v => { const q = 1 - v; return [q * q * S[0] + 2 * q * v * cx_ + v * v * px, q * q * S[1] + 2 * q * v * cy_ + v * v * py]; };
      const P = at(u); k *= (.55 + .45 * u) * (1 + 1.4 * Math.sin(Math.PI * u));
      if (u < 1 && p.o < .3) { const Q = at(Math.max(0, u - .04)); PX.line(Q[0], Q[1], P[0], P[1], col, 0, k * .35); }
      px = P[0]; py = P[1];
    }
    PX.pt(px, py, p.w > .86 ? hot : rim ? col : dim, k, bl);
    if (refl !== undefined && rim && p.o < .5 && py < refl) { const f = 1 - (refl - py) / (hh * .5); if (f > 0) PX.pt(px, 2 * refl - py + 2, col, k * .16 * f * f); }
  });
  PX.flush(sx);
}
// 屏幕坐标下人物的光点（给“流到另一个形状”用）；按 y 排好序
function figScreenPts(F) {
  const G = figGeom(F), o = []; figEach(F, G, (x, y, k, p, rim) => { if (rim || p.o < .5) o.push([PX.X(x, y), PX.Y(x, y), rim ? 1 : .3, p.ph]); });
  o.sort((a, b) => a[1] - b[1] || a[0] - b[0]); return o;
}
// 漂浮在灯下的微尘（世界坐标）
function motes(t, cx, cy, rw, rh, n, col, a) {
  if (a <= 0) return; PX.useM(sx); t = PX.t;   // 漂浮用成片时间
  for (let i = 0; i < n; i++) {
    const sp = .25 + .5 * rnd(i, 91), x = cx + (rnd(i, 92) - .5) * 2 * rw + Math.sin(t * .23 * sp + i) * 26, yy = ((rnd(i, 93) - t * .012 * sp) % 1 + 1) % 1, y = cy + (yy - .5) * 2 * rh + Math.cos(t * .31 + i * 1.7) * 14;
    const e = 1 - Math.hypot((x - cx) / rw, (y - cy) / rh); if (e <= 0) continue;
    const tw = Math.pow(.5 + .5 * Math.sin(t * (.8 + 1.4 * rnd(i, 94)) + i * 2.1), 3);
    PX.pt(x, y, col, a * .5 * e * (.25 + .75 * tw), 0);
  }
}