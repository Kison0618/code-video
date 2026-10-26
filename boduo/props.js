// props.js — 道具都是线描：门、花盆、伞、云、雨、标签、手机、盆景、砖墙、粒子
'use strict';
function floorLine(c, y, x0, x1, a = 1, u = 1, col = C.silver) {
  if (a <= 0 || u <= 0) return;
  const cx = (x0 + x1) / 2, hw = (x1 - x0) / 2 * eo(u), g = c.createLinearGradient(cx - hw, 0, cx + hw, 0);
  g.addColorStop(0, rgba(col, 0)); g.addColorStop(.22, rgba(col, .4 * a)); g.addColorStop(.5, rgba(col, .52 * a)); g.addColorStop(.78, rgba(col, .4 * a)); g.addColorStop(1, rgba(col, 0));
  c.strokeStyle = g; c.lineWidth = 1.6; c.beginPath(); c.moveTo(cx - hw, y); c.lineTo(cx + hw, y); c.stroke();
  // 地面反光：横向的椭圆，往下、往两边都渐隐（不再是硬边矩形）
  if (hw > 2) { c.save(); c.translate(cx, y); c.scale(hw, 150); const f = c.createRadialGradient(0, 0, 0, 0, 0, 1);
    f.addColorStop(0, rgba(C.lamp, .075 * a)); f.addColorStop(.45, rgba(C.lamp, .03 * a)); f.addColorStop(1, rgba(C.lamp, 0)); c.fillStyle = f; c.fillRect(-1, 0, 2, 1); c.restore(); }
}
function lampCone(c, x, y0, y1, w0, w1, a, col = C.lamp) {   // 头顶一盏灯：几层叠起来的淡光锥，边缘是软的
  if (a <= 0) return; c.save(); c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 6; i++) { const k = 1 - i / 6, g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, rgba(col, .016 * a)); g.addColorStop(.75, rgba(col, .007 * a)); g.addColorStop(1, rgba(col, 0));
    c.fillStyle = g; c.beginPath(); c.moveTo(x - w0 * k, y0); c.lineTo(x + w0 * k, y0); c.lineTo(x + w1 * k, y1); c.lineTo(x - w1 * k, y1); c.closePath(); c.fill(); }
  c.restore();
}
function lampPool(c, x, y, r, a, col = C.lamp) {   // 灯下：一圈很淡的暖光
  if (a <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, .09 * a)); g.addColorStop(.5, rgba(col, .035 * a)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.fillRect(x - r, y - r, r * 2, r * 2);
}
function glow(c, x, y, r, col, a) { if (a <= 0 || r <= 0) return; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(col, a)); g.addColorStop(.35, rgba(col, a * .35)); g.addColorStop(1, rgba(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function dot(c, x, y, r, col, a) { if (a <= 0) return; c.fillStyle = rgba(col, a); c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
function seg(c, x0, y0, x1, y1, col, a, lw = 2) { if (a <= 0) return; c.strokeStyle = rgba(col, a); c.lineWidth = lw; c.lineCap = 'round'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
function rrect(c, x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }
function ring(c, x, y, r, col, a, lw = 2) { if (a <= 0 || r <= 0) return; c.strokeStyle = rgba(col, a); c.lineWidth = lw; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); }
function ringPulse(c, t, t0, x, y, r0, r1, col, dur = .9, a0 = .8) { const u = pr(t, t0, t0 + dur); if (u <= 0 || u >= 1) return; ring(c, x, y, lerp(r0, r1, eo(u)), col, a0 * (1 - u) * (1 - u), 2.5 * (1 - u) + 1); }

// 门：D = {x0, x1, top, fy}；s = {u 描线, open 0..1, light 颜色, I 光强, under 门缝光, fig 门口的人}
function door(c, D, s) {
  const { x0, x1, top, fy } = D, w = x1 - x0, u = s.u ?? 1;
  const th = (s.open || 0) * 76 * DEG, xe = x1 - w * Math.cos(th), sk = 16 * Math.sin(th);
  if ((s.open || 0) > .01 && s.I > 0) {     // 门里的光
    const lc = s.light || C.lamp, g = c.createLinearGradient(x0, 0, x1, 0);
    g.addColorStop(0, rgba(lc, .5 * s.I)); g.addColorStop(1, rgba(lc, .22 * s.I));
    c.fillStyle = g; c.fillRect(x0, top, xe - x0, fy - top);
    const f = c.createLinearGradient(x0, 0, x0 - 760, 0); f.addColorStop(0, rgba(lc, .2 * s.I)); f.addColorStop(1, rgba(lc, 0));
    c.fillStyle = f; c.beginPath(); c.moveTo(x0, fy); c.lineTo(xe, fy); c.lineTo(xe - 140, fy + 150); c.lineTo(x0 - 760 * s.open, fy + 150); c.closePath(); c.fill();
    const b = c.createLinearGradient(x0, 0, x0 - 900, 0); b.addColorStop(0, rgba(lc, .07 * s.I)); b.addColorStop(1, rgba(lc, 0));
    c.fillStyle = b; c.beginPath(); c.moveTo(x0, top); c.lineTo(x0, fy); c.lineTo(x0 - 900 * s.open, fy + 40); c.lineTo(x0 - 900 * s.open, top - 160); c.closePath(); c.fill();
  }
  if (s.under > 0 && (s.open || 0) < .5) {   // 门缝下的一线光
    const lc = s.light || C.lamp; seg(c, x0 + 10, fy - 2, x1 - 10, fy - 2, lc, .9 * s.under * (1 - (s.open || 0) * 2), 3);
    glow(c, (x0 + x1) / 2, fy, w * .6, lc, .12 * s.under);
  }
  if (s.fig) s.fig();
  c.beginPath(); c.moveTo(x1, top); c.lineTo(xe, top - sk); c.lineTo(xe, fy + sk); c.lineTo(x1, fy); c.closePath();
  c.fillStyle = rgba(C.body, .96 * clamp(u * 2)); c.fill();
  c.strokeStyle = rgba(C.silver, .5 * clamp(u * 2 - .6)); c.lineWidth = 2; c.stroke();
  if ((s.open || 0) < .02) { c.strokeStyle = rgba(C.silver, .18 * clamp(u * 2 - 1)); c.lineWidth = 1.5; c.strokeRect(x0 + 26, top + 34, w - 52, (fy - top) * .38); c.strokeRect(x0 + 26, top + 60 + (fy - top) * .38, w - 52, (fy - top) * .42); dot(c, x0 + 22, (top + fy) / 2 + 20, 4, C.silver, .4 * clamp(u * 2 - 1)); }
  const fr = withLen([[x0 - 10, fy], [x0 - 10, top - 12], [x1 + 10, top - 12], [x1 + 10, fy]]);
  strokePartial(c, fr, u, rgba(C.silver, .62), 2.5);
}

// 花盆（局部坐标：底边中心为原点）；s = {rot 倾倒角度, sep 裂开, crack [颜色, 强度], plant {col, g, a}, k 缩放, u 描线, a}
const POT = [[-27, 0], [27, 0], [38, -54], [40, -54], [40, -64], [-40, -64], [-40, -54], [-38, -54]];
const CRK = [[6, -64], [0, -50], [9, -38], [-3, -24], [5, -11], [-4, 0]];
const POT_L = [[-27, 0], [-4, 0], ...CRK.slice().reverse().slice(1), [-40, -64], [-40, -54], [-38, -54]];
const POT_R = [[-4, 0], [27, 0], [38, -54], [40, -54], [40, -64], [6, -64], ...CRK.slice(1)];
function potMouthWorld(x, fy, s) { const k = s.k || 1, r = (s.rot || 0) * DEG, px = 27, dx = 0 - px, dy = -64; return [x + k * (px + dx * Math.cos(r) - dy * Math.sin(r)), fy + k * (dx * Math.sin(r) + dy * Math.cos(r))]; }
function pot(c, x, fy, s, t = 0) {
  const k = s.k || 1, a = s.a ?? 1; if (a <= 0) return;
  c.save(); c.translate(x, fy); c.scale(k, k); c.translate(27, 0); c.rotate((s.rot || 0) * DEG); c.translate(-27, 0);
  const lw = 2 / k, sep = s.sep || 0, cc = s.crack || [C.red, 0];
  for (const p of [].concat(s.plant || [])) if (p && p.a > 0) plant(c, p, t, a);   // 可以同时画两株（旧的淡出、新的长出来）
  const half = (P, dx, rot) => {
    c.save(); c.translate(dx, -sep * 3); c.rotate(rot * DEG);
    polyPath(c, P, true); c.fillStyle = rgba(C.body, a); c.fill(); c.strokeStyle = rgba(C.silver, .78 * a); c.lineWidth = lw; c.stroke();
    seg(c, P === POT_L ? -40 : 6, -54, P === POT_L ? 3 : 40, -54, C.silver, .4 * a, lw);
    if (cc[1] > 0) { c.save(); c.shadowColor = rgba(cc[0], 1); c.shadowBlur = 10; polyPath(c, CRK); c.strokeStyle = rgba(cc[0], cc[1] * a); c.lineWidth = 2.6 / k; c.stroke(); c.restore(); }
    if (s.kin > 0 && s.kin < 1 && P === POT_L) {   // 金缮：一颗金色的光沿着裂缝走过去
      PX.useM(c); const Pk = withLen(CRK.slice().reverse().map(p => [p[0], p[1]])), e = Pk.L * eio(s.kin); let acc = 0;
      for (let i = 1; i < Pk.length && acc < e; i++) { const a0 = Pk[i - 1], b0 = Pk[i], sl = Pk.cum[i] - Pk.cum[i - 1], u = Math.min(1, (e - acc) / sl), bx = lerp(a0[0], b0[0], u), by = lerp(a0[1], b0[1], u);
        PX.line(a0[0], a0[1], bx, by, C.gold, .5, .5, .4); acc += sl; if (u < 1 || acc >= e) { PX.sdisc(PX.X(bx, by), PX.Y(bx, by), 3, mixC(C.gold, C.white, .6), 1.2, 1.5); PX.glowB(bx, by, 30, C.gold, .9); } }
    }
    c.restore();
  };
  if (s.u !== undefined && s.u < 1) { strokePartial(c, withLen([...POT, POT[0]]), s.u, rgba(C.silver, .78 * a), lw); }
  else if (sep <= 0.001) { half(POT_L, 0, 0); half(POT_R, 0, 0); seg(c, -40, -54, 40, -54, C.silver, .4 * a, lw); }
  else { half(POT_L, -sep * 9, -sep * 7); half(POT_R, sep * 9, sep * 9); }
  c.restore(); if (s.kin > 0 && s.kin < 1) PX.flush(c);
}
function plant(c, p, t, a0) {     // 三根茎、叶子、两朵小花；g = 长到多少
  const g = clamp(p.g ?? 1), col = p.col || C.lamp, a = (p.a ?? 1) * a0; if (g <= 0) return;
  const stems = [[-8, -64, -34, -150, -22, -118], [0, -64, 6, -176, -6, -128], [8, -64, 38, -140, 26, -110]];
  c.lineCap = 'round';
  stems.forEach((s, i) => {
    const gg = clamp(g * 1.25 - i * .12); if (gg <= 0) return;
    const pts = []; for (let j = 0; j <= 16; j++) { const u = j / 16 * gg, q = 1 - u; pts.push([q * q * s[0] + 2 * q * u * s[4] + u * u * s[2], q * q * s[1] + 2 * q * u * s[5] + u * u * s[3]]); }
    polyPath(c, pts); c.strokeStyle = rgba(col, .7 * a); c.lineWidth = 1.8; c.stroke();
    [.45, .72].forEach((lu, j) => { if (gg < lu) return; const q = pts[Math.round(lu / gg * 16)] || pts[pts.length - 1], sd = (i + j) % 2 ? 1 : -1;
      c.beginPath(); c.moveTo(q[0], q[1]); c.quadraticCurveTo(q[0] + sd * 16, q[1] - 14, q[0] + sd * 26, q[1] - 4); c.quadraticCurveTo(q[0] + sd * 12, q[1] + 4, q[0], q[1]); c.strokeStyle = rgba(col, .6 * a); c.lineWidth = 1.5; c.stroke(); });
    if (gg >= .98 && i !== 2) { const e = pts[16]; for (let k = 0; k < 5; k++) { const an = k / 5 * Math.PI * 2 + i; c.beginPath(); c.arc(e[0] + Math.cos(an) * 7, e[1] + Math.sin(an) * 7, 5.5, 0, Math.PI * 2); c.strokeStyle = rgba(col, .75 * a); c.lineWidth = 1.5; c.stroke(); } dot(c, e[0], e[1], 3, col, .9 * a); }
  });
}
function soil(c, t, t0, x, y, fy, seed, n = 46, a = 1) {   // 泥土溅出，落地后停住
  if (t < t0) return; const tt = t - t0, G = 1500;
  for (let i = 0; i < n; i++) {
    const vx = lerp(60, 360, rnd(i, seed)) * (rnd(i, seed + 1) < .2 ? -.4 : 1), vy = -lerp(80, 420, rnd(i, seed + 2)), y0 = y + lerp(-10, 10, rnd(i, seed + 3));
    const tl = (-vy + Math.sqrt(vy * vy + 2 * G * (fy - y0))) / G, tm = Math.min(tt, tl);
    const px = x + vx * tm, py = Math.min(fy - 1, y0 + vy * tm + .5 * G * tm * tm);
    dot(c, px, py, lerp(1.4, 3, rnd(i, seed + 4)), C.soil, .85 * a);
  }
}

// 伞：手柄 (hx,hy) → 伞尖 (tx,ty)，半径 R，op 张开；返回伞面顶边折线（挡雨用）
function umbrella(c, hx, hy, tx_, ty, R, op, col, a) {
  const L = Math.hypot(hx - tx_, hy - ty), dx = (hx - tx_) / L, dy = (hy - ty) / L, px = -dy, py = dx;
  const P = s => { const w = op; return [tx_ + px * R * s * w + dx * R * (.42 * s * s * w + .9 * Math.abs(s) * (1 - w)), ty + py * R * s * w + dy * R * (.42 * s * s * w + .9 * Math.abs(s) * (1 - w))]; };
  const dome = []; for (let i = 0; i <= 24; i++) dome.push(P(-1 + 2 * i / 24));
  if (a > 0) {
    seg(c, tx_ - dx * 16, ty - dy * 16, hx, hy, col, .85 * a, 2.4);
    const hk = Math.atan2(dy, dx); c.beginPath(); c.arc(hx + Math.cos(hk + Math.PI / 2) * 11, hy + Math.sin(hk + Math.PI / 2) * 11, 11, hk - Math.PI / 2, hk + Math.PI / 2); c.strokeStyle = rgba(col, .85 * a); c.lineWidth = 2.4; c.stroke();
    const A = P(-1), B = P(1), n = 6;
    c.beginPath(); c.moveTo(dome[0][0], dome[0][1]); dome.forEach(q => c.lineTo(q[0], q[1]));
    for (let k = n - 1; k >= 0; k--) { const u0 = (k + 1) / n, u1 = k / n, e = [lerp(A[0], B[0], u1), lerp(A[1], B[1], u1)], m = [lerp(A[0], B[0], (u0 + u1) / 2) - dx * R * .1 * op, lerp(A[1], B[1], (u0 + u1) / 2) - dy * R * .1 * op]; c.quadraticCurveTo(m[0], m[1], e[0], e[1]); }
    c.closePath(); c.fillStyle = rgba(C.body, .92 * a); c.fill(); c.strokeStyle = rgba(col, .9 * a); c.lineWidth = 2.6; c.lineJoin = 'round'; c.stroke();
    for (let k = 1; k < n; k++) { const e = [lerp(A[0], B[0], k / n), lerp(A[1], B[1], k / n)]; seg(c, tx_, ty, e[0], e[1], col, .28 * a, 1.4); }
  }
  return dome;
}
function blockY(dome, x) { for (let i = 0; i < dome.length - 1; i++) { const a = dome[i], b = dome[i + 1]; if ((x - a[0]) * (x - b[0]) <= 0 && a[0] !== b[0]) return lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); } return null; }

// 云：几团圆合成的剪影（外扩描边 + 内填）
const CLOUD = [[-130, 14, 58], [-70, -22, 76], [8, -42, 90], [92, -18, 74], [152, 14, 54], [-10, 22, 68], [72, 24, 58]];
const CLT = (() => { const o = []; for (let id = 0; o.length < 4600 && id < 120000; id++) {
  const x = -200 + 420 * rnd(id, 70), y = -140 + 240 * rnd(id, 71); let best = -1e9, bi = 0;
  CLOUD.forEach(([cx, cy, r], i) => { const dd = r - Math.hypot(x - cx, y - cy); if (dd > best) { best = dd; bi = i; } });
  if (best <= 0) continue; const rim = best < 4.2; if (!rim && rnd(id, 72) > .2) continue;
  const [cx, cy, r] = CLOUD[bi]; o.push({ i: bi, ox: (x - cx) / r, oy: (y - cy) / r, rim, ph: rnd(id, 73) * 6.283, f: .6 + 1.4 * rnd(id, 74), w: rnd(id, 75), o: rnd(id, 76), lo: clamp((y + 20) / 100) });
} return o; })();
function cloud(c, cx, cy, s, a, t, col = C.ice) {   // 光尘云：深色云体挡住身后，轮廓由几千颗光点组成，缓慢呼吸、漂移
  t = PX.t;   // 呼吸用成片时间：速度恒定
  const ax = Array.isArray(s) ? s[0] : s, ay = Array.isArray(s) ? s[1] : s, ar = Math.sqrt(ax * ay);
  if (a <= 0 || ax <= 0 || ay <= 0) return;
  const rr = i => (CLOUD[i][2] + 3 * Math.sin(t * .9 + i * 1.7)) * ar;
  c.save(); c.globalAlpha = a; c.beginPath(); CLOUD.forEach(([x, y], i) => { c.moveTo(cx + x * ax + rr(i), cy + y * ay); c.arc(cx + x * ax, cy + y * ay, rr(i), 0, Math.PI * 2); }); c.fillStyle = rgba(C.body); c.fill(); c.restore();
  const sc = PX.useM(c), fr = clamp(ar * sc / 1.1), hot = mixC(col, C.white, .5), R = CLOUD.map((_, i) => rr(i));
  for (const p of CLT) {
    if (p.o > fr) continue;
    const q = CLOUD[p.i], x = cx + q[0] * ax + p.ox * R[p.i] + Math.sin(t * p.f + p.ph) * 1.8, y = cy + q[1] * ay + p.oy * R[p.i] + Math.cos(t * p.f * .8 + p.ph) * 1.3;
    const tw = .65 + .35 * Math.sin(t * p.f * 2.2 + p.ph), k = (p.rim ? .95 : .1 + .16 * p.lo) * a * tw / Math.max(.6, fr);
    PX.pt(x, y, p.w > .86 ? hot : col, k, p.rim ? .06 : 0);
  }
  PX.flush(c);
}
const cloudSpan = (cx, cy, s) => { const ax = Array.isArray(s) ? s[0] : s, ay = Array.isArray(s) ? s[1] : s; return [cx - 175 * ax, cx + 175 * ax, cy + 58 * ay]; };
// 雨：o = {x0, x1, y0, y1, n, sp, col, a, block: [dome…], rev: [倒流开始, 时长]} —— 光雨：头亮尾暗的细光，远近两层；落地 / 打在伞上溅起小光点
function rain(c, t, o) {
  if (o.a <= 0) return; PX.useM(c);
  const col = o.col || C.ice, hot = mixC(col, C.white, .6), base = o.y1 - o.y0 + 90, span = base + o.sp * .32, len0 = o.len || 34, n = Math.round(o.n * span / base);
  let tt = PX.t, front = 1e9, rev = false;   // 雨丝的相位用成片时间（落速恒定）；倒流的进度用场景时间
  if (o.rev && t > o.rev[0]) { const k = pr(t, o.rev[0], o.rev[0] + o.rev[1]), r0 = O2N(o.rev[0]); rev = true; tt = r0 - (PX.t - r0) * 1.4; front = o.y1 + 60 - eio(k) * (base + 80); }
  for (let i = 0; i < n; i++) {
    const z = rnd(i, 14), spd = o.sp * (.8 + .4 * z), per = span / spd, len = len0 * (.55 + .7 * z), x = o.x0 + rnd(i, 11) * (o.x1 - o.x0), f = ((tt / per + rnd(i, 12)) % 1 + 1) % 1;
    let yb = o.y1, onD = false; for (const d of o.block || []) { const y = blockY(d, x); if (y !== null && y > o.y0 && y < yb) { yb = y; onD = true; } }
    const raw = o.y0 - 40 + f * span, al = o.a * (.3 + .7 * z);
    if (raw > yb) {   // 已经落下：溅起来
      const s0 = (raw - yb) / spd; if (rev || s0 > .3 || yb > front) continue;
      const q = s0 / .3, xh = x - (yb - o.y0) * .08, ka = al * (1 - q) * (1 - q);
      for (let j = 0; j < 3; j++) { const an = -Math.PI / 2 + (j - 1) * .9 + (rnd(i, 15 + j) - .5) * .5, v = (onD ? 120 : 90) * (.6 + .6 * rnd(i, 18 + j)); PX.pt(xh + Math.cos(an) * v * s0, yb + Math.sin(an) * v * s0 + 500 * s0 * s0, hot, .5 * ka); }
      const w = 3 + 14 * eo(q); PX.line(xh - w, yb + 1, xh + w, yb + 1, col, .12 * ka, .12 * ka);
      continue;
    }
    const L2 = rev ? len * 2.6 : len, ye = raw, ys = Math.max(o.y0, ye - L2); if (ye <= ys || ye > front) continue;
    const fa = al * clamp((ye - o.y0) / 60) * (rev ? 1.7 : 1), xa = x - (ys - o.y0) * .08, xb = x - (ye - o.y0) * .08;
    if (rev) { PX.line(xb, ye, xa, ys, col, .05 * fa, .9 * fa); PX.pt(xa, ys, hot, Math.min(1, .95 * fa), .55); }
    else { PX.line(xa, ys, xb, ye, col, 0, .7 * fa); PX.pt(xb, ye, hot, .6 * fa, .25); }
  }
  if (rev) {   // 倒流时：地面积水的光点也被吸回云里
    const k = pr(t, o.rev[0], o.rev[0] + o.rev[1]), m = Math.round(o.n * .9);
    for (let i = 0; i < m; i++) {
      const d = rnd(i, 31) * .55, q = clamp((k - d) / .45); if (q <= 0 || q >= 1) continue;
      const x = o.x0 + rnd(i, 32) * (o.x1 - o.x0), y = lerp(o.y1, o.y0 + 20, eio(q)), a = o.a * Math.sin(Math.PI * q) * (.5 + .5 * rnd(i, 33));
      PX.line(x, y + 40 + 50 * rnd(i, 34), x, y, col, 0, .8 * a); PX.pt(x, y, hot, a, .6);
    }
  }
  PX.flush(c);
}
function pill(c, text, x, y, col, a, size = 26) {
  if (a <= 0) return; c.font = `500 ${size}px ${FS.sans}`; const w = c.measureText(text).width + size * 1.1, h = size * 1.62;
  rrect(c, x - w / 2, y - h / 2, w, h, h / 2); c.fillStyle = rgba(C.body, .9 * a); c.fill(); c.strokeStyle = rgba(col, .95 * a); c.lineWidth = 2; c.stroke();
  c.fillStyle = rgba(col, a); c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(text, x, y + 1); c.textAlign = 'left';
}
function burst(c, t, t0, x, y, o) {    // 一次性爆开的火星（解析解）：亮头 + 一小段光迹
  const tt = t - t0; if (tt < 0 || tt > (o.life || 1.2)) return; PX.useM(c);
  const hot = mixC(o.col, C.white, .6), bl = o.bl ?? .3;
  for (let i = 0; i < o.n; i++) {
    const an = (o.a0 ?? 0) + (o.spread ?? Math.PI * 2) * rnd(i, o.seed), sp = lerp(o.v0 || 60, o.v1 || 320, rnd(i, o.seed + 1)), life = (o.life || 1.2) * lerp(.55, 1, rnd(i, o.seed + 2));
    if (tt > life) continue; const q = tt / life;
    const P = s => { const d = 1 - Math.exp(-3 * s); return [x + Math.cos(an) * sp * d / 3, y + Math.sin(an) * sp * d / 3 + .5 * (o.g || 0) * s * s]; };
    const p1 = P(tt), p0 = P(Math.max(0, tt - .06)), k = (o.alpha ?? 1) * (1 - q) * (1 - q * .3);
    PX.line(p0[0], p0[1], p1[0], p1[1], o.col, 0, .5 * k); PX.pt(p1[0], p1[1], hot, 1.1 * k * lerp(.6, 1.2, rnd(i, o.seed + 3)), bl);
  }
  PX.flush(c);
}
function phoneFrame(c, cx, cy, w, h, a, u = 1) {
  const x = cx - w / 2, y = cy - h / 2, r = 46;
  rrect(c, x, y, w, h, r); c.fillStyle = rgba(C.body, .96 * a * clamp(u * 1.5)); c.fill();
  const pts = [[x + w / 2, y]], cs = [[x + w - r, y + r, -90], [x + w - r, y + h - r, 0], [x + r, y + h - r, 90], [x + r, y + r, 180]];
  cs.forEach(([ax, ay, a0]) => { for (let i = 0; i <= 18; i++) { const an = (a0 + 90 * i / 18) * DEG; pts.push([ax + Math.cos(an) * r, ay + Math.sin(an) * r]); } }); pts.push([x + w / 2, y]);
  strokePartial(c, withLen(pts), u, rgba(C.silver, .8 * a), 3);
  if (u >= 1) { rrect(c, cx - 38, y + 16, 76, 18, 9); c.strokeStyle = rgba(C.silver, .35 * a); c.lineWidth = 1.5; c.stroke(); }
}

// 盆景：s = {g 生长, tw 扭曲, cut [三根枝剩下的比例], wire 铁丝进度, a, col}
const TR_N = [[0, 0], [5, -70], [-6, -140], [3, -210], [0, -270]];
const TR_T = [[0, 0], [38, -36], [-44, -78], [46, -112], [-14, -150]];
const BR = [[.38, -1, 96, -.85, -.5], [.58, 1, 88, .85, -.52], [.8, -1, 66, -.75, -.6]];
function trunkPts(s, n = 30) { const ctl = TR_N.map((p, i) => [lerp(p[0], TR_T[i][0], s.tw) * s.g, lerp(p[1], TR_T[i][1], s.tw) * s.g]); const o = []; for (let i = 0; i <= n; i++) { const u = i / n * (ctl.length - 1), k = Math.min(ctl.length - 2, Math.floor(u)), f = u - k, p0 = ctl[Math.max(0, k - 1)], p1 = ctl[k], p2 = ctl[k + 1], p3 = ctl[Math.min(ctl.length - 1, k + 2)], f2 = f * f, f3 = f2 * f; o.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * f + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * f2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * f3))); } return o; }
function bonsaiGeom(x, y, s) {
  const T = trunkPts(s).map(p => [x + p[0], y + p[1]]), br = BR.map(([u, sd, L, dx, dy], i) => {
    const q = T[Math.round(u * 30)], tw = s.tw, ddx = lerp(dx, sd * .98, tw), ddy = lerp(dy, sd > 0 ? .06 : -.12, tw), n = Math.hypot(ddx, ddy), Lk = L * s.g * (s.cut ? s.cut[i] : 1);
    const mid = [q[0] + ddx / n * Lk * .5, q[1] + ddy / n * Lk * .5 - 14 * s.g * (1 - tw) + 10 * tw * sd], e = [q[0] + ddx / n * Lk, q[1] + ddy / n * Lk];
    return { q, mid, e, dir: [ddx / n, ddy / n], L: Lk };
  });
  return { T, br, top: T[T.length - 1] };
}
function bonsai(c, x, y, s) {
  const a = s.a ?? 1; if (a <= 0) return; const col = s.col || C.silver, G = bonsaiGeom(x, y, s);
  c.globalAlpha = a;
  c.beginPath(); c.moveTo(x - 118, y); c.lineTo(x + 118, y); c.lineTo(x + 96, y + 42); c.lineTo(x - 96, y + 42); c.closePath(); c.fillStyle = rgba(C.body); c.fill(); c.strokeStyle = rgba(C.silver, .7); c.lineWidth = 2; c.stroke();
  seg(c, x - 108, y + 10, x + 108, y + 10, C.silver, .3, 1.5);
  const limb = (pts, w0, w1) => { for (let pass = 0; pass < 2; pass++) for (let i = 0; i < pts.length - 1; i++) { const u = i / (pts.length - 1), w = lerp(w0, w1, u) + (pass ? 0 : 5); seg(c, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], pass ? C.body : col, pass ? 1 : .85, w); } };
  G.br.forEach(b => limb([b.q, b.mid, b.e], 8 * s.g, 3.5 * s.g));
  limb(G.T, 15 * s.g, 6 * s.g);
  [...G.br.map(b => b.e), G.top].forEach((p, i) => { const r = (i === 3 ? 34 : 26) * s.g * (s.cut && i < 3 ? lerp(.7, 1, s.cut[i]) : 1); for (let pass = 0; pass < 2; pass++) { c.beginPath(); for (let k = 0; k < 4; k++) { const ax = p[0] + (k - 1.5) * r * .55, ay = p[1] + Math.abs(k - 1.5) * r * .12, rr = r * (.55 + .12 * (k % 2)) + (pass ? 0 : 2.4); c.moveTo(ax + rr, ay); c.arc(ax, ay, rr, 0, Math.PI * 2); } c.fillStyle = pass ? rgba(C.body) : rgba(col, .8); c.fill(); } });
  if (s.wire > 0) { const n = Math.floor((G.T.length - 1) * s.wire), pts = []; for (let i = 0; i <= n * 4; i++) { const u = i / 4, k = Math.min(G.T.length - 2, Math.floor(u)), f = u - k, p = [lerp(G.T[k][0], G.T[k + 1][0], f), lerp(G.T[k][1], G.T[k + 1][1], f)], d = [G.T[k + 1][0] - G.T[k][0], G.T[k + 1][1] - G.T[k][1]], dl = Math.hypot(d[0], d[1]) || 1, w = lerp(10, 5, u / G.T.length) * s.g; pts.push([p[0] - d[1] / dl * w * Math.sin(u * 2.6), p[1] + d[0] / dl * w * Math.sin(u * 2.6)]); } if (pts.length > 1) { polyPath(c, pts); c.strokeStyle = rgba(C.red, .85); c.lineWidth = 1.8; c.stroke(); } }
  c.globalAlpha = 1;
  return G;
}
function snipFX(c, t, t0, x, y, dir, len) {   // 剪一刀：红色剪口合拢，剪下的一截掉下去
  const u = pr(t, t0, t0 + .22), f = pr(t, t0 + .1, t0 + 1.1); if (t < t0 - .05 || f >= 1) return;
  const op = 1 - eo(u), a = 1 - pr(t, t0 + .3, t0 + .6);
  if (a > 0) { for (const sg of [-1, 1]) { const an = Math.atan2(dir[1], dir[0]) + sg * (.15 + .5 * op); seg(c, x - Math.cos(an) * 26, y - Math.sin(an) * 26, x + Math.cos(an) * 18, y + Math.sin(an) * 18, C.red, .95 * a, 2.4); } glow(c, x, y, 34, C.red, .45 * a); }
  burst(c, t, t0 + .06, x, y, { n: 26, seed: 41 + Math.round(t0 * 10) % 7, col: C.red, v0: 60, v1: 300, g: 260, life: .8, bl: .5 });
  if (f > 0) { const yy = y + 600 * f * f; c.save(); c.translate(x + dir[0] * (20 + f * 30), yy); c.rotate(f * 2.4 * (dir[0] > 0 ? 1 : -1)); seg(c, 0, 0, dir[0] * len, dir[1] * len, C.red, .8 * (1 - f), 3); c.restore(); }
}
function bricks(c, x, fy, w, hgt, u, col, a) {   // 砖墙一行一行垒起来
  const bh = 18, rows = Math.ceil(hgt / bh), shown = rows * u;
  for (let r = 0; r < rows; r++) { const k = eo(clamp(shown - r)); if (k <= 0) break; const y = fy - (r + 1) * bh - (1 - k) * 30, off = r % 2 ? w / 4 : 0;
    for (let bx = -w / 2 - off; bx < w / 2; bx += w / 2) { const x0 = Math.max(x - w / 2, x + bx), x1 = Math.min(x + w / 2, x + bx + w / 2); if (x1 - x0 < 3) continue; c.fillStyle = rgba(C.body, a * k); c.fillRect(x0, y, x1 - x0, bh); c.strokeStyle = rgba(col, .8 * a * k); c.lineWidth = 1.6; c.strokeRect(x0 + 1, y + 1, x1 - x0 - 2, bh - 2); } }
}

// ---------- 光尘盆景：几何同 bonsaiGeom，轮廓和身体由光点组成；铁丝是一道缠着树干的红光螺旋 ----------
const BTP = (() => {   // part: 0 树干 / 1–3 枝 / 4–7 叶团（各 4 个圆）/ 8 花盆
  const R = [], I = []; let id = 70000;
  const mkp = (o, n, ex) => { for (let i = 0; i < n; i++, id++) o.push({ id, u: rnd(id, 1), v: rnd(id, 2) * 2 - 1, sd: i % 2 ? 1 : -1, o: rnd(id, 3), ph: rnd(id, 4) * 6.283, f: 1.5 + 4 * rnd(id, 5), w: rnd(id, 6), s: rnd(id, 7), ...ex(i) }); };
  mkp(R, 760, () => ({ part: 0 })); mkp(I, 420, () => ({ part: 0 }));
  for (let b = 1; b <= 3; b++) { mkp(R, 300, () => ({ part: b })); mkp(I, 110, () => ({ part: b })); }
  for (let p = 4; p <= 7; p++) for (let k = 0; k < 4; k++) { mkp(R, 190, () => ({ part: p, k })); mkp(I, 80, () => ({ part: p, k })); }
  mkp(R, 1000, () => ({ part: 8 })); mkp(I, 260, () => ({ part: 8 }));
  return { R, I };
})();
function bonsaiEach(x, y, s, cb) {
  const G = bonsaiGeom(x, y, s), g = s.g, T = G.T, nT = T.length;
  const limbs = [{ P: T, w0: 15 * g, w1: 6 * g }, ...G.br.map(b => ({ P: [b.q, b.mid, b.e], w0: 8 * g, w1: 3.5 * g }))];
  const pads = [...G.br.map(b => b.e), G.top].map((p, i) => { const r = (i === 3 ? 34 : 26) * g * (s.cut && i < 3 ? lerp(.7, 1, s.cut[i]) : 1);
    return [0, 1, 2, 3].map(k => [p[0] + (k - 1.5) * r * .55, p[1] + Math.abs(k - 1.5) * r * .12, r * (.55 + .12 * (k % 2)) + 1.2]); });
  const at = (L, u) => { const P = L.P, f = u * (P.length - 1), k = Math.min(P.length - 2, f | 0), q = f - k, a = P[k], b = P[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    return [a[0] + dx * q, a[1] + dy * q, -dy / d, dx / d, (lerp(L.w0, L.w1, u) + 4) / 2]; };
  const inTrunk = (px, py) => { for (let i = 0; i < nT - 1; i++) { const a = T[i], b = T[i + 1], dx = b[0] - a[0], dy = b[1] - a[1], d2 = dx * dx + dy * dy || 1; let u = ((px - a[0]) * dx + (py - a[1]) * dy) / d2; u = u < 0 ? 0 : u > 1 ? 1 : u;
    const r = (lerp(15 * g, 6 * g, (i + u) / (nT - 1)) + 4) / 2 - .8, ex = a[0] + dx * u - px, ey = a[1] + dy * u - py; if (ex * ex + ey * ey < r * r) return true; } return false; };
  const inPad = (px, py, p0, skip = -1, eps = .8) => { for (let p = p0; p < 4; p++) for (let k = 0; k < 4; k++) { if (p === p0 && k === skip) continue; const C_ = pads[p][k], dx = px - C_[0], dy = py - C_[1], r = C_[2] - eps; if (dx * dx + dy * dy < r * r) return true; } return false; };
  const potP = u => { const L = [236, Math.hypot(22, 42), 192, Math.hypot(22, 42)], tot = L[0] + L[1] + L[2] + L[3]; let d = u * tot;
    const V_ = [[x - 118, y], [x + 118, y], [x + 96, y + 42], [x - 96, y + 42], [x - 118, y]]; for (let i = 0; i < 4; i++) { if (d <= L[i]) { const q = d / L[i]; return [lerp(V_[i][0], V_[i + 1][0], q), lerp(V_[i][1], V_[i + 1][1], q)]; } d -= L[i]; } return V_[0]; };
  for (const rim of [true, false]) for (const p of rim ? BTP.R : BTP.I) {
    let px, py, kk = 1, part = p.part;
    if (part <= 3) {
      const L = limbs[part], A = at(L, p.u), off = rim ? p.sd : p.v * .85; px = A[0] + A[2] * A[4] * off; py = A[1] + A[3] * A[4] * off;
      if (inPad(px, py, 0)) continue; if (part > 0 && inTrunk(px, py)) continue;
    } else if (part <= 7) {
      const pi = part - 4, C_ = pads[pi][p.k], an = p.u * 6.283, rr = rim ? C_[2] : C_[2] * Math.sqrt(Math.abs(p.v)) * .92;
      px = C_[0] + Math.cos(an) * rr; py = C_[1] + Math.sin(an) * rr;
      if (rim ? inPad(px, py, pi, p.k) || inPad(px, py, pi + 1, -1) : inPad(px, py, pi + 1, -1, 0)) continue;
      if (!rim && pi < 4) kk = 1.2;
    } else {
      if (rim) { const q = potP(p.u); px = q[0]; py = q[1]; }
      else { const yy = Math.abs(p.v) * 42, hw = lerp(118, 96, yy / 42); px = x + (p.u * 2 - 1) * hw; py = y + yy; kk = .7; }
    }
    cb(px, py, kk, p, rim);
  }
  return { G, pads, limbs };
}
function bonsaiBody(c, x, y, s, a) {   // 深色身体：挡住身后的光
  const G = bonsaiGeom(x, y, s), g = s.g; c.save(); c.globalAlpha = a; c.fillStyle = c.strokeStyle = rgba(C.body); c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath(); c.moveTo(x - 118, y); c.lineTo(x + 118, y); c.lineTo(x + 96, y + 42); c.lineTo(x - 96, y + 42); c.closePath(); c.fill();
  const limb = (P, w0, w1) => { for (let i = 0; i < P.length - 1; i++) { c.lineWidth = lerp(w0, w1, i / (P.length - 1)) + 4; c.beginPath(); c.moveTo(P[i][0], P[i][1]); c.lineTo(P[i + 1][0], P[i + 1][1]); c.stroke(); } };
  G.br.forEach(b => limb([b.q, b.mid, b.e], 8 * g, 3.5 * g)); limb(G.T, 15 * g, 6 * g);
  [...G.br.map(b => b.e), G.top].forEach((p, i) => { const r = (i === 3 ? 34 : 26) * g * (s.cut && i < 3 ? lerp(.7, 1, s.cut[i]) : 1); c.beginPath(); for (let k = 0; k < 4; k++) { const ax = p[0] + (k - 1.5) * r * .55, ay = p[1] + Math.abs(k - 1.5) * r * .12, rr = r * (.55 + .12 * (k % 2)) + 1.2; c.moveTo(ax + rr, ay); c.arc(ax, ay, rr, 0, Math.PI * 2); } c.fill(); });
  c.restore(); return G;
}
// s = {g, tw, cut, wire, a, col}；t 让光点呼吸、铁丝上的火花走动
function bonsaiP(c, x, y, s, t) {
  const a = s.a ?? 1; if (a <= .002) return; const col = s.col || C.silver, hot = mixC(col, C.white, .55), leaf = mixC(col, C.ice, .3), dim = mixC(col, C.body, .35), potc = mixC(C.silver, C.gray, .4);
  const G = bonsaiBody(c, x, y, s, a), sc = PX.useM(c), kk = a * Math.max(1, Math.pow(sc * 1.4, -.25));
  bonsaiEach(x, y, s, (px, py, k0, p, rim) => {
    const k = (rim ? 1.0 : .26) * k0 * kk * (.7 + .3 * Math.sin(t * p.f + p.ph)) * (p.part === 8 ? .7 : 1);
    PX.pt(px, py, p.w > .88 ? hot : p.part === 8 ? potc : rim ? (p.part >= 4 ? leaf : col) : dim, k);
  });
  if (s.wire > 0) {   // 铁丝：沿树干缠绕的红色螺旋；绕到后面那半圈暗一些；三颗火花沿着铁丝往上走
    const T = G.T, n = (T.length - 1) * s.wire, N = Math.floor(n * 6), W_ = [];
    for (let i = 0; i <= N; i++) { const u = i / 6, k = Math.min(T.length - 2, Math.floor(u)), f = u - k, p = [lerp(T[k][0], T[k + 1][0], f), lerp(T[k][1], T[k + 1][1], f)], d = [T[k + 1][0] - T[k][0], T[k + 1][1] - T[k][1]], dl = Math.hypot(d[0], d[1]) || 1, w = lerp(10, 5, u / T.length) * s.g, ph = u * 2.6;
      W_.push([p[0] - d[1] / dl * w * Math.sin(ph), p[1] + d[0] / dl * w * Math.sin(ph), Math.cos(ph) > 0 ? 1 : .22]); }
    for (let i = 0; i < W_.length - 1; i++) { const A = W_[i], B = W_[i + 1], kf = .55 * a * Math.min(A[2], B[2]); PX.line(A[0], A[1], B[0], B[1], C.red, kf, kf, .25); }
    for (let j = 0; j < 3; j++) { const q = ((t * .45 + j / 3) % 1) * (W_.length - 1), i = Math.floor(q); if (i >= W_.length - 1) continue; const A = W_[i], B = W_[i + 1], f = q - i; if (A[2] < .5) continue;
      PX.sdisc(PX.X(lerp(A[0], B[0], f), lerp(A[1], B[1], f)), PX.Y(lerp(A[0], B[0], f), lerp(A[1], B[1], f)), 1.6, mixC(C.red, C.white, .5), .9 * a, .8); }
  }
  PX.flush(c); return G;
}
// 盆景光点的屏幕坐标（给男孩流进盆景用），按 y 排序
function bonsaiScreenPts(x, y, s) { const o = []; PX.useM(sx); bonsaiEach(x, y, s, (px, py, k, p, rim) => { if (rim || p.o < .4) o.push([PX.X(px, py), PX.Y(px, py), rim ? 1 : .3]); }); o.sort((a, b) => a[1] - b[1] || a[0] - b[0]); return o; }
