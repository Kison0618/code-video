'use strict';
// 《INFP》v2 第 1 组：0 → B01-0.3（A01-A05）
//   1 大远景：天上一道光柱落在山岗上的她，光里的粒子升起聚成「医治者」
//   2 特写：她发边那只蝴蝶起飞，焦点从她转到蝴蝶，翅膀抖落的光屑聚成「小蝴蝶」
//   3 中景：她戴着耳机站在镜面湖上，「心里」一出，星环炸开绕着她转，湖面倒影被涟漪打碎
//   4 过肩：前景是她，中景是他，背景一群人在聊天；他情绪暗下去，只有她的目光先连过去
//   5 低机位大远景：风车吹出的旋风聚成巨大的「INFP」立在地平线上，背后放射光，湿地面倒影
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { C, K, L, LIME, LEAF, GOLD, IVORY, PINK, BLUE } = X;
const { vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, hash, mulberry32, rgba, mix } = K;

const OFF = new K.Canvas(W, H);
function offCtx() { const o = OFF.getContext('2d'); o.setTransform(1, 0, 0, 1, 0, 0); o.globalAlpha = 1; o.globalCompositeOperation = 'source-over'; o.filter = 'none'; o.clearRect(0, 0, W, H); return o; }

// ---------- 小工具 ----------
function grad(ctx, stops, y0 = 0, y1 = H) { const g = ctx.createLinearGradient(0, y0, 0, y1); for (const [p, c] of stops) g.addColorStop(p, rgba(c, 1)); ctx.fillStyle = g; ctx.fillRect(-200, -200, W + 400, H + 400); }
const RS = mulberry32(4101);
const STARS = Array.from({ length: 230 }, () => ({ x: RS() * W, y: RS() * 1100, r: 0.8 + RS() * RS() * 3.4, a: 0.15 + RS() * 0.6, ph: RS() * 6.28, sp: 0.5 + RS() * 2 }));
function stars(ctx, t, dy = 0, a = 1, c = [220, 240, 230], ymax = 1100, mirrorY = 0, wob = 0) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of STARS) {
    let y = s.y + dy; if (y > ymax) continue;
    let x = s.x;
    const tw = 0.55 + 0.45 * Math.sin(t * s.sp + s.ph);
    if (mirrorY) { y = 2 * mirrorY - y; x += Math.sin(y * 0.06 - t * 2.5) * wob; }
    ctx.fillStyle = rgba(c, s.a * tw * a); ctx.fillRect(x - s.r / 2, y - s.r / 2 * (mirrorY ? 0.6 : 1), s.r, s.r * (mirrorY ? 0.6 : 1));
    if (s.r > 2.6) glow(ctx, x, y, s.r * 5, c, 0.25 * tw * a);
  }
  ctx.restore();
}
// 低多边形山脊（和 16P 角色同一种折面感）
function ridge(ctx, base, amp, seed, col, off = 0, step = 70, yb = H + 10) {
  ctx.fillStyle = rgba(col, 1); ctx.beginPath(); ctx.moveTo(-220, yb);
  const i0 = Math.floor((-220 + off) / step), i1 = Math.ceil((W + 220 + off) / step);
  for (let i = i0; i <= i1; i++) ctx.lineTo(i * step - off, base - amp * (0.3 + 0.7 * hash(i * 13 + seed)) * (0.65 + 0.35 * Math.sin(i * 0.7 + seed)));
  ctx.lineTo(W + 220, yb); ctx.closePath(); ctx.fill();
}
// 虚焦大光斑：柔边圆 + 一圈亮边
function bokeh(ctx, x, y, r, c, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, 0.08 * a)); g.addColorStop(0.8, rgba(c, 0.14 * a)); g.addColorStop(0.93, rgba(c, 0.26 * a)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.restore();
}
// 体积光柱：分段画，af(y) 控制每段亮度
function beam(ctx, x, yTop, yBot, wTop, wBot, c, a, af = () => 1, seg = 16) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let s = 0; s < seg; s++) {
    const ya = Math.round(lerp(yTop, yBot, s / seg)), yb = Math.round(lerp(yTop, yBot, (s + 1) / seg)), ym = (ya + yb) / 2;
    const wa = lerp(wTop, wBot, s / seg), wb = lerp(wTop, wBot, (s + 1) / seg), k = af(ym) * a;
    for (const [m, al] of [[1, 0.2], [0.55, 0.32], [0.16, 0.6]]) {
      const g = ctx.createLinearGradient(x - wb * m, 0, x + wb * m, 0);
      g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, rgba(m < 0.2 ? mix(c, [255, 252, 240], 0.6) : c, al * k)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - wa * m, ya); ctx.lineTo(x + wa * m, ya); ctx.lineTo(x + wb * m, yb); ctx.lineTo(x - wb * m, yb); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}
// 放射光：从一点散开的楔形光
function rays(ctx, cx, cy, n, R, w, c, a, rot, seed = 1) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const an = i / n * 6.283 + rot + hash(i * 3 + seed) * 0.25, ww = w * (0.4 + hash(i * 7 + seed)), rr = R * (0.55 + 0.45 * hash(i * 11 + seed)), al = a * (0.25 + 0.75 * hash(i * 5 + seed));
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, rgba(c, al * 0.55)); g.addColorStop(0.3, rgba(c, al * 0.25)); g.addColorStop(1, rgba(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, rr, an - ww, an + ww); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}
// 倒影：把 src 层 yl 以上的部分翻到 yl 以下，越往下越淡、水波横向错开
function mirror(ctx, src, yl, depth, alpha, amp, t, a) {
  const step = 4;
  ctx.save();
  for (let d = 0; d < depth; d += step) {
    const f = 1 - d / depth, al = alpha * f * f; if (al < 0.008) continue;
    const dx = Math.sin(d * 0.05 - t * 2.6) * amp * (0.35 + d / depth) + Math.sin(d * 0.013 + t * 1.1) * amp * 0.4;
    const sy = yl - d - step; if (sy < 0) break;
    ctx.globalAlpha = a * al; ctx.drawImage(src, 0, sy, W, step, dx, yl + d, W, step + 0.5);
  }
  ctx.restore();
}
function catenary(x0, y0, x1, y1, sag, n) { const p = []; for (let i = 0; i <= n; i++) { const u = i / n; p.push([lerp(x0, x1, u), lerp(y0, y1, u) + sag * 4 * u * (1 - u)]); } return p; }
const backOut = u => { const c = 1.7; u = clamp(u) - 1; return 1 + (c + 1) * u * u * u + c * u * u; };
const camZ = (ctx, s, fx, fy) => { ctx.translate(fx, fy); ctx.scale(s, s); ctx.translate(-fx, -fy); };

module.exports = function make(P1) {
  const { butterfly, headphones, note, heart } = P1;
  const S = [];
  const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const tb = at('A02', '小蝴蝶');

  // ======== 1 大远景：光柱 + 粒子聚「医治者」 ========
  const GR = mulberry32(77);
  const BLADES = Array.from({ length: 70 }, () => { const side = GR() < 0.5 ? -1 : 1; return { x: side < 0 ? GR() * 330 : W - GR() * 330, h: 120 + GR() * 300, w: 6 + GR() * 10, ph: GR() * 6.28, c: GR() }; });
  add(0, tb - 0.45, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null, lift: 0.2 });
    ctx.globalAlpha = a;
    const cam = easeInOut(prog(t, 0, tb)), thit = 0.55;
    ctx.save(); camZ(ctx, lerp(1.0, 1.05, cam), W / 2, 900);
    grad(ctx, [[0, [3, 8, 14]], [0.4, [9, 24, 28]], [0.555, [30, 62, 54]], [0.6, [14, 30, 28]], [1, [3, 8, 8]]]);
    stars(ctx, t, cam * 18, 1, [220, 240, 220], 1060);
    glow(ctx, W / 2, 1080 + cam * 30, 820, [80, 140, 110], 0.22);
    ridge(ctx, 1085 + cam * 30, 110, 3, [17, 36, 38], t * 3, 90);
    glow(ctx, W / 2, 1140 + cam * 50, 700, [60, 110, 90], 0.12);
    ridge(ctx, 1165 + cam * 70, 140, 7, [9, 21, 23], t * 7, 120);
    // 近处山岗
    const gy = 1190 + cam * 120, fx = W / 2, fy = gy + 45;
    ctx.fillStyle = rgba([5, 12, 12], 1); ctx.beginPath(); ctx.moveTo(-60, H); ctx.lineTo(-60, gy + 120); ctx.quadraticCurveTo(W / 2, gy - 40, W + 60, gy + 140); ctx.lineTo(W + 60, H); ctx.closePath(); ctx.fill();
    // 光柱：先闪两下（预备）→ 砸下来变宽（命中）→ 慢慢收细、呼吸（余波）
    const pa = t < thit ? 0.28 * smooth(prog(t, 0, 0.35)) * (0.55 + 0.45 * Math.sin(t * 46)) : 0.62 + 0.55 * Math.exp(-(t - thit) * 3) + 0.06 * Math.sin(t * 2.2);
    const wb = t < thit ? 50 : 150 + 230 * Math.exp(-(t - thit) * 3.5);
    beam(ctx, fx, -80, fy, wb * 0.62, wb, [230, 240, 190], pa, y => 1 - 0.62 * Math.exp(-Math.pow((y - 560) / 170, 2)));
    // 落点：地面一圈光 + 冲击环
    ctx.save(); ctx.translate(fx, fy); ctx.scale(1, 0.18); glow(ctx, 0, 0, 640, GOLD, 0.45 * Math.min(1, pa)); glow(ctx, 0, 0, 260, [255, 250, 230], 0.6 * Math.min(1, pa)); ctx.restore();
    L.shock(ctx, fx, fy, t, thit, { r0: 30, r1: 760, sy: 0.16, dur: 1.7, c: GOLD, a: 1, w: 2.4 });
    L.shock(ctx, fx, fy, t, thit + 0.25, { r0: 20, r1: 460, sy: 0.16, dur: 1.4, c: [255, 250, 220], a: 0.8 });
    // 光柱里往上升的光尘
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 150; i++) {
      const u = (t * 0.22 * (0.6 + hash(i)) + hash(i * 3)) % 1, y = fy - u * 1450, x = fx + (hash(i * 5) - 0.5) * wb * 1.3 * (1 - u * 0.25) + Math.sin(u * 12 + i) * 16;
      glow(ctx, x, y, 3 + 5 * hash(i * 9), i % 4 ? [240, 245, 200] : GOLD, 0.8 * Math.sin(u * Math.PI) * smooth(prog(t, thit, thit + 0.6)));
    }
    ctx.restore();
    // 她：站在光里，仰头
    glow(ctx, fx, fy - 170, 260, [255, 250, 220], 0.35 * smooth(prog(t, thit, thit + 0.4)));
    infp(ctx, fx, fy, 0.62, { a, t, look: [0.2, -1], eyes: 'open', tilt: -0.2, la: -0.5 + Math.sin(t * 1.5) * 0.05, ra: -0.35, spin: t * 2.5, flies: 1 });
    // 字背后的放射光
    rays(ctx, W / 2, 570, 40, 980, 0.022, GOLD, 0.42 * smooth(prog(t, 1.5, 2.4)), t * 0.04, 3);
    // 近景：两侧暗草叶 + 虚焦光斑
    ctx.fillStyle = rgba([2, 6, 6], 1);
    for (const b of BLADES) { const sw = Math.sin(t * 1.3 + b.ph) * 18, y0 = H + 20 - cam * 40; ctx.beginPath(); ctx.moveTo(b.x - b.w, y0); ctx.quadraticCurveTo(b.x + sw * 0.4, y0 - b.h * 0.6, b.x + sw, y0 - b.h - 260); ctx.quadraticCurveTo(b.x + sw * 0.4 + b.w * 0.3, y0 - b.h * 0.5, b.x + b.w, y0); ctx.closePath(); ctx.fill(); }
    bokeh(ctx, 110, 260 - cam * 60, 130, LIME, 0.55);
    bokeh(ctx, 990, 1210 - cam * 120, 160, GOLD, 0.45);
    bokeh(ctx, 70, 1420 - cam * 140, 110, LEAF, 0.4);
    ctx.restore();
  }, (ctx, t, a) => {
    L.rich(ctx, 'INFP', W / 2, 365, { size: 62, weight: 600, spacing: 0.45, color: LIME, alpha: a * smooth(prog(t, 0.5, 1.1)) * (1 - smooth(prog(t, tb - 1.0, tb - 0.6))), glowKey: 0.5 });
    ctx.save(); ctx.globalAlpha *= a; C.gather(ctx, '医治者', W / 2, 650, t, 0.2, tb - 1.0, { size: 210, weight: 600, spacing: 0.16, keys: ['医治者'], keyColor: GOLD, from: [W / 2, 1230] }); ctx.restore();
    L.shock(ctx, W / 2, 575, t, 1.3, { r0: 40, r1: 560, dur: 1.3, c: GOLD, a, w: 2 });
  });

  // ======== 2 特写：蝴蝶起飞，焦点转移，聚「小蝴蝶」 ========
  const BR = mulberry32(203);
  const BOK2 = Array.from({ length: 16 }, () => ({ x: BR() * W, y: 150 + BR() * 1100, r: 40 + BR() * 110, c: BR() < 0.6 ? [150, 220, 170] : GOLD, a: 0.3 + BR() * 0.5, ph: BR() * 6.28, z: 0.2 + BR() * 0.6 }));
  const tl = tb - 0.5, s2k = 1.43 * 2.9;
  const s2fx = 430, s2fy = 2240;
  const headY0 = s2fy - 321 * s2k, headX0 = s2fx + 44 * s2k;
  const B0 = [headX0 - 102 * s2k, headY0 - 21.5 * s2k], B1 = [560, 800];
  const bpath = tt => { const v = easeInOut(prog(tt, tl, tl + 1.5)); return [lerp(B0[0], B1[0], v) + Math.sin(v * Math.PI) * 60 + (v >= 1 ? Math.sin(tt * 1.3) * 12 : 0), lerp(B0[1], B1[1], v) - Math.sin(v * Math.PI) * 260 + (v >= 1 ? Math.cos(tt * 1.7) * 10 : 0), v]; };
  add(tb - 0.75, vs('A03') + 0.9, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null, lift: 0.2 });
    ctx.globalAlpha = a;
    const pan = easeInOut(prog(t, tl, tl + 1.5)), focus = smooth(prog(t, tl, tl + 0.8));
    grad(ctx, [[0, [3, 11, 12]], [0.45, [12, 34, 30]], [0.72, [22, 50, 42]], [1, [5, 13, 12]]]);
    for (const b of BOK2) bokeh(ctx, b.x + Math.sin(t * 0.3 + b.ph) * 20, b.y + pan * b.z * 220, b.r * (1 + focus * 0.25), b.c, b.a * (0.7 + 0.3 * focus));
    // 她：近景，焦点移走后虚掉
    const fy = s2fy + pan * 320;
    glow(ctx, headX0, headY0 + pan * 320, 520, [120, 200, 150], 0.25);
    ctx.save(); if (focus > 0.03) ctx.filter = `blur(${(focus * 8).toFixed(1)}px)`;
    infp(ctx, s2fx, fy, 2.9, { a, t, wind: false, flies: t < tl ? 1 : 0, eyes: 'open', look: [0.6, -1], tilt: 0.25, nod: -0.15, la: 0.1, ra: 0.2, dim: focus * 0.35 });
    ctx.restore();
    // 蝴蝶：拖尾 + 抖落的光屑
    if (t >= tl) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let j = 26; j >= 1; j--) { const tj = t - j * 0.032; if (tj < tl) continue; const p = bpath(tj); glow(ctx, p[0], p[1], 26 - j * 0.7, mix(LIME, LEAF, j / 26), 0.55 * (1 - j / 26)); }
      for (let i = 0; i < 90; i++) {
        const te = tl + i * 0.022, age = t - te; if (age < 0 || age > 1.5) continue;
        const p = bpath(te), an = hash(i * 7) * 6.283, d = age * (60 + 120 * hash(i * 3));
        glow(ctx, p[0] + Math.cos(an) * d, p[1] + Math.sin(an) * d * 0.6 - age * 90, 3 + 4 * hash(i), i % 3 ? LIME : GOLD, 0.9 * (1 - age / 1.5));
      }
      ctx.restore();
      const [bx, by, v] = bpath(t), sc = lerp(3.0, 6.4, easeOut(v));
      const ta = tl + 1.5, fl = t > ta ? Math.exp(-(t - ta) * 2.5) : 0;
      glow(ctx, bx, by, 300 + 200 * fl, LIME, 0.25 + 0.4 * fl);
      butterfly(ctx, bx, by, sc, t, 1, lerp(-0.35, -0.08, v) + Math.sin(t * 2) * 0.05);
      L.shock(ctx, bx, by, t, ta, { r0: 40, r1: 520, dur: 1.2, c: LIME, a: 0.9, w: 2 });
    }
    // 近处虚焦光斑
    bokeh(ctx, 960, 300 + pan * 520, 190, LIME, 0.55);
    bokeh(ctx, 120, 1250 + pan * 380, 150, GOLD, 0.4);
  }, (ctx, t, a) => {
    ctx.save(); ctx.globalAlpha *= a; C.gather(ctx, '小蝴蝶', W / 2, 500, t, tb - 0.5, 99, { size: 205, weight: 600, spacing: 0.16, keys: ['小蝴蝶'], keyColor: LIME, from: [B0[0] + 120, B0[1] - 200] }); ctx.restore();
    L.shock(ctx, W / 2, 430, t, tb + 0.6, { r0: 40, r1: 540, dur: 1.2, c: LIME, a, w: 2 });
  });

  // ======== 3 镜面湖 + 星环 ========
  const tq = at('A03', '心里'), tn = at('A03', '不平静');
  const s3a = vs('A03') + 0.6, s3b = vs('A04') + 0.1;
  const RING2 = [170, 150, 255];
  function ring3(ctx, cx, cy, R, tilt, rot, t, n, c, a, half, seed, spd) {
    if (a <= 0.003 || R < 2) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const a0 = half < 0 ? Math.PI : 0, a1 = half < 0 ? Math.PI * 2 : Math.PI;
    L.ellipse(ctx, cx, cy, R, R * tilt, c, a * 0.4, 1.5, rot, a0, a1);
    L.ellipse(ctx, cx, cy, R * 1.05, R * 1.05 * tilt, c, a * 0.1, 9, rot, a0, a1);
    for (let i = 0; i < n; i++) {
      const an = i / n * 6.283 + t * spd + hash(i * 3 + seed) * 0.3, s = Math.sin(an);
      if ((s >= 0) !== (half > 0)) continue;
      const rr = R * (0.88 + 0.24 * hash(i * 7 + seed)), lx = Math.cos(an) * rr, ly = s * rr * tilt;
      const x = cx + lx * Math.cos(rot) - ly * Math.sin(rot), y = cy + lx * Math.sin(rot) + ly * Math.cos(rot), dep = 0.5 + 0.5 * s;
      glow(ctx, x, y, (3 + 6 * hash(i + seed * 13)) * (0.6 + 0.9 * dep) * 2, c, a * (0.3 + 0.7 * dep) * (0.6 + 0.4 * Math.sin(t * 3 + i)));
    }
    ctx.restore();
  }
  add(s3a, s3b, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null, lift: 0.2 });
    ctx.globalAlpha = a;
    const zs = lerp(1.0, 1.09, smooth(prog(t, s3a, s3b))), FXc = W / 2, FYc = 820, HZ = 1010, FY = 1150;
    const scr = y => FYc + (y - FYc) * zs;
    const hit = prog(t, tq, tq + 0.6), on = smooth(prog(t, tq - 0.1, tq + 0.4));
    const wob = lerp(1.2, 11, on) + 10 * Math.exp(-Math.max(0, t - tn) * 2) * (t > tn ? 1 : 0);
    ctx.save(); camZ(ctx, zs, FXc, FYc);
    grad(ctx, [[0, [3, 5, 16]], [0.42, [12, 19, 44]], [HZ / H, [38, 54, 96]], [HZ / H + 0.008, [16, 24, 50]], [0.75, [7, 11, 26]], [1, [2, 4, 10]]]);
    stars(ctx, t, 0, 1, [200, 215, 255], HZ - 8);
    stars(ctx, t, 0, 0.35, [180, 200, 255], HZ - 8, HZ, wob * 0.6);
    glow(ctx, W / 2, HZ, 900, [70, 90, 160], 0.22);
    ridge(ctx, HZ, 50, 11, [7, 10, 26], 0, 80, HZ + 1);
    glowLine(ctx, [[-100, HZ], [W + 100, HZ]], [130, 160, 230], 0.45, 1.2, 0.6);
    // 湖面的光带
    ctx.save(); ctx.translate(W / 2, FY + 60); ctx.scale(1, 0.12); glow(ctx, 0, 0, 900, [110, 140, 230], 0.25 + 0.2 * on); ctx.restore();
    ctx.restore();
    // 水面以上：她 + 星环，画进单独一层，好做倒影
    const o = offCtx(); o.save(); camZ(o, zs, FXc, FYc);
    const cx = W / 2, cy = 790, tilt = lerp(0.24, 0.33, prog(t, s3a, s3b)), rot = -0.1;
    const R1 = t < tq - 0.3 ? 210 : t < tq ? lerp(210, 175, smooth(prog(t, tq - 0.3, tq))) : 175 + 300 * backOut(hit);
    const a1 = t < tq - 0.3 ? 0.28 : lerp(0.28, 1, smooth(prog(t, tq - 0.3, tq + 0.2)));
    const sp1 = lerp(0.35, 1.25, on);
    const h2 = prog(t, tn, tn + 0.6), R2 = 120 + 280 * backOut(h2), a2 = smooth(prog(t, tn - 0.05, tn + 0.3));
    const h3 = prog(t, tn + 0.3, tn + 0.9), R3 = 80 + 250 * backOut(h3), a3 = smooth(prog(t, tn + 0.25, tn + 0.6));
    ring3(o, cx, cy, R1, tilt, rot, t, 120, LIME, a1, -1, 1, sp1);
    ring3(o, cx, cy - 30, R2, tilt * 1.2, rot + 0.42, t, 90, RING2, a2 * 0.9, -1, 2, -0.9);
    ring3(o, cx, cy + 20, R3, tilt * 0.9, rot - 0.35, t, 70, GOLD, a3 * 0.8, -1, 3, 0.7);
    glow(o, cx, cy, 340, [120, 150, 255], 0.22 + 0.25 * on);
    const lean = Math.sin(t * 2.2) * 0.03 * on;
    const g = infp(o, W / 2, FY, 1.2, { a: 1, t, eyes: 'closed', nod: 0.28, la: 0.15, ra: 0.22, spin: t * (0.3 + 2 * on), flies: 1, flap: 1, lean });
    headphones(o, g, 1.43 * 1.2, 1);
    // 耳机里传出的声波（心里的动静）
    for (let k = 0; k < 6; k++) { const t0 = tq - 0.3 + k * 0.42; L.shock(o, g.head[0] + 10, g.head[1] + 50, t, t0, { r0: 60, r1: 330, dur: 1.1, c: [170, 190, 255], a: 0.7, w: 1.6 }); }
    ring3(o, cx, cy, R1, tilt, rot, t, 120, LIME, a1, 1, 1, sp1);
    ring3(o, cx, cy - 30, R2, tilt * 1.2, rot + 0.42, t, 90, RING2, a2 * 0.9, 1, 2, -0.9);
    ring3(o, cx, cy + 20, R3, tilt * 0.9, rot - 0.35, t, 70, GOLD, a3 * 0.8, 1, 3, 0.7);
    // 炸开那一下的火花（沿环面飞出去）
    if (t > tq && t < tq + 1.4) { o.save(); o.globalCompositeOperation = 'lighter'; const u = prog(t, tq, tq + 1.4); for (let i = 0; i < 70; i++) { const an = hash(i * 17) * 6.283, d = easeOut(u) * (300 + 420 * hash(i * 5)); glow(o, cx + Math.cos(an) * d, cy + Math.sin(an) * d * tilt * 1.6, 4 + 6 * hash(i), i % 2 ? LIME : [230, 240, 255], 0.9 * (1 - u)); } o.restore(); }
    // 绕着前半圈转的音符
    for (let i = 0; i < 7; i++) { const an = t * sp1 + i * 0.9, s = Math.sin(an); if (s < 0) continue; note(o, cx + Math.cos(an) * R1 * 1.02, cy + s * R1 * tilt - 40, 1.4 + 0.6 * s, i % 2 ? GOLD : LIME, on * (0.4 + 0.6 * s)); }
    o.restore();
    // 倒影（被涟漪打碎）+ 本体
    mirror(ctx, OFF, scr(FY), 430 * zs, 0.42, wob, t, a);
    ctx.drawImage(OFF, 0, 0);
    // 涟漪
    ctx.save(); camZ(ctx, zs, FXc, FYc);
    L.shock(ctx, W / 2, FY, t, s3a + 0.1, { r0: 30, r1: 300, sy: 0.11, dur: 2.2, c: [150, 180, 255], a: 0.4 });
    for (const [t0, r1, al] of [[tq, 640, 0.9], [tq + 0.45, 520, 0.6], [tn, 760, 1], [tn + 0.35, 600, 0.7], [tn + 0.8, 480, 0.5]]) L.shock(ctx, W / 2, FY, t, t0, { r0: 30, r1, sy: 0.11, dur: 2, c: [160, 190, 255], a: al, w: 2 });
    ctx.restore();
    bokeh(ctx, 90, 1500, 160, [120, 150, 255], 0.45);
    bokeh(ctx, 1010, 260, 130, RING2, 0.4);
  }, (ctx, t, a) => {
    X.quote(ctx, '就像我戴着耳机，\n音乐便成了我的星环。', t, tq - 0.1, s3b, { y: 250, keys: ['星环'], keyColor: LIME });
  });

  // ======== 4 过肩：她先看出他的情绪 ========
  const tA4 = vs('A04'), tSay = at('A04', '说出口'), tOther = at('A04', '可对方'), tEmo = at('A04', '情绪'), tFirst = at('A04', '第一个');
  const s4a = tA4 - 0.2, s4b = vs('A05') + 0.1;
  const CROWD = [['esfp-female', 70, 1040, 1.25, false, 0], ['entp-male', 205, 1048, 1.32, true, 1], ['estp-male', 470, 1030, 1.15, false, 2], ['isfj-female', 590, 1036, 1.2, true, 3], ['enfp-female', 1000, 1046, 1.3, true, 4], ['intp-male', 900, 1034, 1.15, false, 5]];
  const COLD = [120, 150, 220];
  add(s4a, s4b, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null, lift: 0.2 });
    ctx.globalAlpha = a;
    const see = smooth(prog(t, tFirst - 0.1, tFirst + 0.5)), emo = smooth(prog(t, tOther + 0.1, tEmo + 0.4));
    const love = smooth(prog(t, tA4, tA4 + 0.6)), hide = smooth(prog(t, tSay, tSay + 0.5));
    ctx.save(); camZ(ctx, lerp(1, 1.07, smooth(prog(t, s4a, s4b))), 720, 900);
    grad(ctx, [[0, [4, 11, 12]], [0.36, [11, 27, 26]], [0.52, [28, 44, 36]], [0.545, [14, 25, 21]], [1, [4, 9, 8]]]);
    stars(ctx, t, 0, 0.5, [230, 240, 210], 820);
    ridge(ctx, 1012, 280, 21, [8, 19, 18], 0, 46, 1100);
    glow(ctx, 600, 960, 760, [255, 190, 110], 0.2 * (1 - 0.45 * see));
    // 远处一串小灯
    const far = catenary(-40, 640, 1120, 610, 90, 26);
    for (let i = 0; i < far.length; i++) { const [x, y] = far[i]; glow(ctx, x, y, 20, GOLD, (0.4 + 0.25 * Math.sin(t * 2 + i)) * (1 - 0.3 * see)); glow(ctx, x, y, 5, [255, 245, 220], 0.9); }
    glowLine(ctx, far, [90, 80, 60], 0.3, 1, 0.3);
    // 地面暖光
    ctx.save(); ctx.translate(640, 1120); ctx.scale(1, 0.2); glow(ctx, 0, 0, 700, [255, 200, 130], 0.28 * (1 - 0.4 * see)); ctx.restore();
    // 背景一群人：虚焦、自顾自聊天（谁也没注意他）
    ctx.save(); ctx.filter = 'blur(5px)';
    for (const [key, x, y, s, flip, i] of CROWD) {
      const bob = Math.abs(Math.sin(t * 3 + i * 1.7)) * 5;
      MB.person(ctx, key, x, y, s, { flip, bob, lean: Math.sin(t * 2 + i) * 0.03, dim: 0.45 + 0.3 * see, warm: 1 });
      glow(ctx, x, y - 160 * s, 70, [255, 200, 130], (0.35 + 0.15 * Math.sin(t * 4 + i)) * (1 - 0.4 * see));
    }
    ctx.restore();
    // 他：中景，胸口的暖光先闪、再暗成冷色
    const hx = 770, hy = 1220;
    const he = MB.person(ctx, 'enfj-male', hx, hy, 2.3, { flip: true, slump: emo * 0.75, dim: emo * 0.18 });
    const ch = [hx - 6, he.chest[1] + 10], flick = t > tOther && t < tEmo + 0.4 ? 0.7 + 0.3 * Math.sin(t * 38) : 1;
    glow(ctx, ch[0], ch[1], 120, mix(GOLD, COLD, emo), (0.55 - 0.15 * emo) * flick);
    glow(ctx, ch[0], ch[1], 36, mix([255, 240, 200], [200, 215, 255], emo), 0.7 * flick);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 14; i++) { const u = (t * 0.3 + hash(i * 3)) % 1; glow(ctx, hx + (hash(i) - 0.5) * 260 + Math.sin(u * 6 + i) * 20, hy - 120 - u * 520, 40 + 40 * hash(i * 7), COLD, emo * 0.5 * Math.sin(u * Math.PI)); }
    ctx.restore();
    // 她：前景，大
    const fx = 260, fy = 1650;
    glow(ctx, fx + 60, fy - 600, 380, [255, 200, 150], 0.18);
    const g = infp(ctx, fx, fy, 1.5, { a, t, wind: false, flies: 1, eyes: see > 0.3 ? 'wide' : 'open', look: [1, lerp(0.6 * hide, 0, see)], nod: lerp(0.32 * hide, -0.05, see), tilt: see * 0.35, la: -0.2, ra: 0.35 - hide * 0.2 });
    // 胸口那颗没说出口的心
    const hp = [g.chest[0] + 20, g.chest[1] - 10], hb = 0.5 + 0.5 * Math.sin(t * 5);
    glow(ctx, hp[0], hp[1], 150, PINK, love * (0.4 - 0.25 * hide));
    heart(ctx, hp[0], hp[1], lerp(56, 26, hide) + 4 * hb, PINK, love * (1 - 0.5 * hide));
    // 伸向他的粉线：伸到一半，缩回来
    const reach = smooth(prog(t, tA4 + 0.4, tSay)) * (1 - easeIn(prog(t, tSay, tSay + 0.55)));
    if (reach > 0.01) {
      const end = [lerp(hp[0], ch[0], reach * 0.62), lerp(hp[1], ch[1], reach * 0.62)], pts = [];
      for (let i = 0; i <= 20; i++) { const u = i / 20; pts.push([lerp(hp[0], end[0], u), lerp(hp[1], end[1], u) + Math.sin(u * Math.PI) * 40 + Math.sin(u * 9 - t * 6) * 6 * u]); }
      glowLine(ctx, pts, PINK, 0.8, 2.2, 0.8); glow(ctx, end[0], end[1], 26, PINK, 0.8);
    }
    // 她看出来：一道金光从她眼里连到他胸口
    const u = smooth(prog(t, tFirst - 0.15, tFirst + 0.3));
    if (u > 0) {
      const e = g.eyes;
      glowLine(ctx, [e, [lerp(e[0], ch[0], u), lerp(e[1], ch[1], u)]], GOLD, 0.9, 2.6, 1);
      L.shock(ctx, ch[0], ch[1], t, tFirst + 0.3, { r0: 20, r1: 260, dur: 1.0, c: GOLD, a: 1, w: 2 });
      L.ellipse(ctx, ch[0], ch[1], 90, 90, GOLD, 0.6 * smooth(prog(t, tFirst + 0.3, tFirst + 0.8)), 1.6, t * 0.5, 0, Math.PI * 2 * smooth(prog(t, tFirst + 0.3, tFirst + 0.9)));
    }
    // 近处一串大灯泡（虚焦前景）
    for (const [x, y, r] of [[60, 170, 150], [380, 250, 70], [700, 210, 110], [1030, 330, 170], [960, 1180, 120]]) {
      const ph = x * 0.01; glow(ctx, x + Math.sin(t * 0.4 + ph) * 15, y, r * 1.3, GOLD, (0.22 + 0.06 * Math.sin(t * 1.5 + ph)) * (1 - 0.3 * see));
    }
    ctx.restore();
  });

  // ======== 5 低机位大远景：巨大的「INFP」 ========
  const tI = at('A05', 'INFP'), g0 = tI - 0.65, tf = g0 + 1.15;
  const s5a = vs('A05') - 0.2, s5b = vs('B01') + 0.05;
  const HZ5 = 1075, s5k = 1.43 * 0.6, WH = [540 + 109 * s5k, 1360 - 215 * s5k];
  add(s5a, s5b, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null, lift: 0.2 });
    ctx.globalAlpha = a;
    const zs = lerp(1.16, 1.0, easeOut(prog(t, s5a, s5b))), fxc = W / 2, fyc = 1000;
    const scr = y => fyc + (y - fyc) * zs;
    const formed = smooth(prog(t, tf - 0.1, tf + 0.4)), fl = t > tf ? Math.exp(-(t - tf) * 2.2) : 0;
    const pre = smooth(prog(t, s5a, s5a + 1)) * (1 - smooth(prog(t, g0 + 0.3, g0 + 1.2)));
    ctx.save(); camZ(ctx, zs, fxc, fyc);
    grad(ctx, [[0, [3, 9, 11]], [0.38, [8, 25, 25]], [HZ5 / H - 0.01, [30, 66, 54]], [HZ5 / H + 0.004, [10, 22, 20]], [0.8, [4, 10, 10]], [1, [2, 5, 5]]]);
    stars(ctx, t, 0, 1, [220, 240, 220], HZ5 - 10);
    glow(ctx, W / 2, HZ5, 950, [90, 160, 110], 0.22 + 0.3 * formed);
    ridge(ctx, HZ5, 55, 31, [6, 15, 15], 0, 64, HZ5 + 1);
    // 背后放射光 + 两道探照光（聚字那一下竖起来）
    rays(ctx, W / 2, 930, 46, 1250, 0.02, LIME, 0.45 * formed, t * 0.035, 5);
    rays(ctx, W / 2, 930, 20, 900, 0.03, GOLD, 0.3 * formed, -t * 0.05, 9);
    for (const sx of [-1, 1]) {
      const up = backOut(prog(t, tf - 0.15, tf + 0.6)), an = sx * lerp(1.35, 0.32, up) + Math.sin(t * 0.6 + sx) * 0.06;
      ctx.save(); ctx.translate(W / 2 + sx * 300, HZ5); ctx.rotate(an); beam(ctx, 0, -1900, 0, 150, 26, [210, 240, 180], 0.55 * formed, y => 0.4 + 0.6 * (1 + y / 1900), 10); ctx.restore();
    }
    glowLine(ctx, [[-200, HZ5], [W + 200, HZ5]], [220, 245, 200], 0.4 + 1.2 * fl, 1.4 + 3 * fl, 1 + fl);
    ctx.restore();
    // 字层（单独画，好做倒影；她站在字前面）
    const o = offCtx(); o.save(); camZ(o, zs, fxc, fyc);
    if (fl > 0.01) glow(o, W / 2, HZ5 - 120, 700, [230, 250, 200], 0.4 * fl);
    C.gather(o, 'INFP', W / 2, HZ5 - 8, t, g0, 99, { size: 300, weight: 600, spacing: 0.14, keys: ['INFP'], keyColor: LIME, from: WH });
    o.restore();
    mirror(ctx, OFF, scr(HZ5), 330 * zs, 0.38, 3 + 6 * fl, t, a);
    ctx.drawImage(OFF, 0, 0);
    ctx.save(); camZ(ctx, zs, fxc, fyc);
    // 湿地面上的横向光纹
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 26; i++) { const z = hash(i * 3), y = HZ5 + 12 + z * z * 520, w = 40 + z * 260, x = W / 2 + (hash(i * 7) - 0.5) * 900 * (0.4 + z) + Math.sin(t * 0.8 + i) * 20; glowLine(ctx, [[x - w, y], [x + w, y]], i % 3 ? LIME : GOLD, (0.15 + 0.3 * formed) * (0.4 + 0.6 * Math.sin(t * 1.6 + i * 2) ** 2), 1.2, 0.6); }
    ctx.restore();
    L.shock(ctx, W / 2, HZ5 + 10, t, tf, { r0: 60, r1: 1100, sy: 0.1, dur: 1.8, c: LIME, a: 1, w: 2.4 });
    L.shock(ctx, W / 2, HZ5 + 10, t, tf + 0.25, { r0: 40, r1: 700, sy: 0.1, dur: 1.5, c: GOLD, a: 0.7 });
    // 风车吹出的旋风：聚字前往上卷
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const vx = (u, an, r) => [lerp(WH[0], W / 2, Math.min(1, u * 1.6)) + Math.cos(an) * r, WH[1] - u * 720 + Math.sin(an) * r * 0.22];
    for (let i = 0; i < 420; i++) {
      const u = (t * 0.32 * (0.7 + 0.6 * hash(i)) + hash(i * 3)) % 1, an = u * 11 + i * 0.37 + t * 1.8, r = 20 + u * 470;
      const [x, y] = vx(u, an, r);
      glow(ctx, x, y, 4 + 7 * hash(i * 5), i % 3 ? LIME : [240, 250, 220], pre * 0.95 * Math.sin(u * Math.PI));
    }
    // 旋风里的几道光带
    for (let s = 0; s < 7; s++) {
      const pts = []; for (let j = 0; j <= 40; j++) { const u = j / 40 * 0.9 + 0.04; pts.push(vx(u, u * 11 + s * 0.9 + t * 1.8, 20 + u * 470)); }
      glowLine(ctx, pts, s % 2 ? LIME : [230, 250, 210], pre * 0.14, 2.4, 2.2);
    }
    ctx.restore();
    glow(ctx, W / 2, 700, 520, LIME, 0.18 * pre);
    // 她：站在字前，逆光
    glow(ctx, 540, 1200, 260, [220, 250, 200], 0.25 + 0.3 * formed);
    infp(ctx, 540, 1360, 0.6, { a, t, spin: t * 7, eyes: formed > 0.5 ? 'happy' : 'open', look: [0.2, -1], tilt: -0.15, ra: -0.35, la: 0.3, flies: 1, dim: 0.3 * formed });
    ctx.restore();
    bokeh(ctx, 100, 420, 150, LIME, 0.4);
    bokeh(ctx, 990, 1500, 170, GOLD, 0.35);
  });

  return S;
};
