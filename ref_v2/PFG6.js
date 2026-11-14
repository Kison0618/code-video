'use strict';
// 《INFP》v2 第 6 组：E01-E08 恋爱里，F01-F02 结尾，关注卡（竖屏 1080x1920）
//   S1 月亮山岗大远景（恋爱里/忠诚）  S2 近景虚焦（憋着）  S3 俯视书桌写信  S4 巨钟+缠绕丝带（黏）
//   S5 想象泡泡→碎裂→现实（摇下）  S6 前景沙漏焦点转移（越幸福越不安）  S7 仰拍城堡+骑士影子
//   S8 蝴蝶微距→拉远：她走过的长路  S9 关注卡
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { C, K, L, LIME, LEAF, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, vis, hash, mix, rgba, mulberry32 } = K;
const HIM = 'enfj-male';

// ---------- 小工具 ----------
const DUMMY = new K.Canvas(8, 8).getContext('2d');
let BL = null, SH = null;
const off = (n) => { if (n === 'bl') { if (!BL) BL = new K.Canvas(W, H); return BL; } if (!SH) SH = new K.Canvas(W, H); return SH; };
// 把一组东西画到离屏层再整体虚焦贴回来（同一变换）
function blurLayer(ctx, px, fn) {
  if (px < 0.6) { fn(ctx); return; }
  const cv = off('bl'), c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, W, H); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
  c.setTransform(ctx.getTransform()); fn(c);
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.filter = `blur(${px.toFixed(1)}px)`; ctx.drawImage(cv, 0, 0); ctx.filter = 'none'; ctx.restore();
}
function grad(ctx, stops, y0 = 0, y1 = H, x0 = -300, x1 = W + 300) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  stops.forEach(([p, c]) => g.addColorStop(p, rgba(c, 1)));
  ctx.fillStyle = g; ctx.fillRect(x0, y0 - 400, x1 - x0, y1 - y0 + 800);
}
function bokehDisc(ctx, x, y, r, c, a) {
  if (a <= 0.003) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, a * 0.35)); g.addColorStop(0.8, rgba(c, a * 0.5)); g.addColorStop(0.92, rgba(c, a * 0.32)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
}
const mkBokeh = (seed, n, cols, box, rr) => { const r = mulberry32(seed); return Array.from({ length: n }, () => ({ x: box[0] + r() * (box[2] - box[0]), y: box[1] + r() * (box[3] - box[1]), r: rr[0] + r() * (rr[1] - rr[0]), c: cols[Math.floor(r() * cols.length)], a: 0.3 + r() * 0.7, ph: r() * 6.28 })); };
function bokeh(ctx, t, list, a, drift = 12) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const b of list) bokehDisc(ctx, b.x + Math.sin(t * 0.3 + b.ph) * drift, b.y + Math.cos(t * 0.23 + b.ph) * drift * 0.6, b.r, b.c, a * b.a * (0.75 + 0.25 * Math.sin(t * 0.8 + b.ph)));
  ctx.restore();
}
const mkMotes = (seed, n, box) => { const r = mulberry32(seed); return Array.from({ length: n }, () => ({ x: box[0] + r() * (box[2] - box[0]), y: box[1] + r() * (box[3] - box[1]), r: 2 + r() * 5, ph: r() * 6.28, sp: 0.2 + r() * 0.8 })); };
function motes(ctx, t, list, c, a, rise = 20) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const m of list) glow(ctx, m.x + Math.sin(t * m.sp + m.ph) * 26, m.y - ((t * rise * m.sp) % 200) + 100, m.r * 2.4, c, a * (0.35 + 0.65 * Math.sin(t * m.sp * 2 + m.ph) ** 2));
  ctx.restore();
}
function stars(ctx, t, list, a, dy = 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const s of list) glow(ctx, s.x, s.y + dy, s.r * 1.6, [220, 240, 230], a * (0.25 + 0.5 * Math.sin(t * s.sp * 3 + s.ph) ** 2)); ctx.restore(); }
// 前景虚焦草叶（暗）
function fgGrass(ctx, t, seed, side, y0, a) {
  const r = mulberry32(seed);
  blurLayer(ctx, 9, c => {
    c.save(); c.globalAlpha *= a; c.fillStyle = 'rgb(4,10,10)';
    for (let i = 0; i < 9; i++) {
      const bx = side < 0 ? r() * 300 - 40 : W - r() * 300 + 40, h = 260 + r() * 380, w = 18 + r() * 26, sw = Math.sin(t * 0.9 + i) * 24 + (side < 0 ? 60 : -60) * r();
      c.beginPath(); c.moveTo(bx - w, y0 + 500); c.quadraticCurveTo(bx - w * 0.3 + sw * 0.3, y0 + 500 - h * 0.6, bx + sw, y0 + 500 - h); c.quadraticCurveTo(bx + w * 0.3 + sw * 0.3, y0 + 500 - h * 0.6, bx + w, y0 + 500); c.fill();
    }
    c.restore();
  });
}
// 轻柔的体积光束（从 apex 往下张开）
function beam(ctx, x0, y0, xa, xb, y1, c, a) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(x0, y0, (xa + xb) / 2, y1);
  g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - 20, y0); ctx.lineTo(x0 + 20, y0); ctx.lineTo(xb, y1); ctx.lineTo(xa, y1); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// 大蝴蝶（16P 风的低多边形，青绿 + 柠檬黄）
function bigFly(ctx, x, y, S, t, a, rot = 0.2) {
  if (a <= 0.003) return;
  const f = 0.3 + 0.7 * Math.abs(Math.cos(t * 3.4));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  glow(ctx, 0, 0, S * 3.2, LIME, 0.22);
  for (const sd of [-1, 1]) {
    ctx.save(); ctx.scale(sd * f, 1);
    const up = [[0, -S * 0.06], [S * 0.45, -S * 1.05], [S * 1.3, -S * 1.0], [S * 1.22, -S * 0.38], [S * 0.28, S * 0.04]];
    let g = ctx.createLinearGradient(0, 0, S * 1.3, -S); g.addColorStop(0, 'rgb(52,150,124)'); g.addColorStop(0.55, 'rgb(120,206,150)'); g.addColorStop(1, 'rgb(226,234,112)');
    ctx.fillStyle = g; ctx.beginPath(); up.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,230,0.18)'; ctx.beginPath(); ctx.moveTo(...up[0]); ctx.lineTo(...up[1]); ctx.lineTo(...up[2]); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,40,40,0.18)'; ctx.beginPath(); ctx.moveTo(...up[0]); ctx.lineTo(...up[3]); ctx.lineTo(...up[4]); ctx.closePath(); ctx.fill();
    const lo = [[0, S * 0.04], [S * 0.92, S * 0.2], [S * 0.86, S * 0.86], [S * 0.36, S * 1.0]];
    g = ctx.createLinearGradient(0, 0, S * 0.9, S); g.addColorStop(0, 'rgb(46,128,112)'); g.addColorStop(1, 'rgb(96,196,164)');
    ctx.fillStyle = g; ctx.beginPath(); lo.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,230,0.14)'; ctx.beginPath(); ctx.moveTo(...lo[0]); ctx.lineTo(...lo[1]); ctx.lineTo(...lo[2]); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,236,0.32)'; ctx.lineWidth = Math.max(1, S * 0.012);
    for (const p of [up[1], up[2], up[3], lo[1], lo[2], lo[3]]) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(p[0] * 0.92, p[1] * 0.92); ctx.stroke(); }
    ctx.restore();
  }
  ctx.fillStyle = 'rgb(34,46,44)'; ctx.beginPath(); ctx.ellipse(0, S * 0.1, S * 0.07, S * 0.5, 0, 0, 6.283); ctx.fill();
  ctx.strokeStyle = 'rgb(34,46,44)'; ctx.lineWidth = Math.max(1, S * 0.02);
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -S * 0.35); ctx.quadraticCurveTo(sd * S * 0.15, -S * 0.75, sd * S * 0.34, -S * 0.86); ctx.stroke(); }
  ctx.restore();
}

module.exports = function make(P1, END) {
  const { heart } = P1;
  const S = [];
  const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const ST = mkBokeh(61, 90, [[1, 1, 1]], [0, 0, W, 1000], [1, 3]).map(s => ({ ...s, sp: 0.3 + s.a }));
  // ===== S1：大远景。巨大的月亮压在山岗后面，两个人手牵手站在山顶，被月光勾出一道亮边；两条长影子朝镜头拖过来；镜头缓缓升起 =====
  const A1 = vs('E01') - 1.2, B1 = vs('E02') - 0.1;
  const FF1 = mkMotes(11, 16, [80, 700, 1000, 1300]);
  add(A1, B1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('E01'), c = smooth(prog(t, A1, B1 + 0.3)), d = lerp(-70, 50, c);
    ctx.save(); ctx.globalAlpha *= a;
    grad(ctx, [[0, [5, 12, 20]], [0.45, [14, 36, 40]], [0.62, [22, 48, 46]], [1, [6, 14, 14]]]);
    stars(ctx, t, ST, 0.8, d * 0.1);
    // 月亮
    const mx = W / 2 + 30, my = 900 + d * 0.3, R = 410;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, mx, my, 1100, [150, 210, 190], 0.25); glow(ctx, mx, my, R * 1.45, [220, 240, 220], 0.32); ctx.restore();
    let g = ctx.createRadialGradient(mx - 140, my - 150, 40, mx, my, R);
    g.addColorStop(0, 'rgb(250,250,232)'); g.addColorStop(0.7, 'rgb(224,234,212)'); g.addColorStop(1, 'rgb(186,206,190)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(mx, my, R, 0, 6.283); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(mx, my, R, 0, 6.283); ctx.clip();
    ctx.fillStyle = 'rgba(140,166,156,0.16)';
    for (const [dx, dy, r] of [[-150, -60, 110], [60, -170, 70], [130, 60, 130], [-60, 180, 80], [210, -60, 50]]) { ctx.beginPath(); ctx.arc(mx + dx, my + dy, r, 0, 6.283); ctx.fill(); }
    // 一缕薄云慢慢掠过月面
    ctx.fillStyle = 'rgba(12,30,32,0.35)';
    for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.ellipse(mx - 500 + ((t * 30 + k * 380) % 1200), my - 120 + k * 150, 260, 22, 0, 0, 6.283); ctx.fill(); }
    ctx.restore();
    // 山岗
    const hy = 1130 + d;
    const crest = []; for (let i = 0; i <= 40; i++) { const x = -40 + i * (W + 80) / 40, u = (x - 540) / 620; crest.push([x, hy + u * u * 150 + Math.sin(i * 1.7) * 3]); }
    ctx.beginPath(); crest.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.lineTo(W + 40, H + 200); ctx.lineTo(-40, H + 200); ctx.closePath();
    g = ctx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, 'rgb(16,32,30)'); g.addColorStop(0.35, 'rgb(8,18,18)'); g.addColorStop(1, 'rgb(3,8,8)');
    ctx.fillStyle = g; ctx.fill();
    glowLine(ctx, crest, [200, 236, 210], 0.45, 2, 0.6);
    // 长影子朝镜头
    for (const [x0, w0] of [[440, 60], [650, 70]]) {
      g = ctx.createLinearGradient(0, hy, 0, hy + 620); g.addColorStop(0, 'rgba(0,0,0,0.6)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x0 - w0 * 0.5, hy + 2); ctx.lineTo(x0 + w0 * 0.5, hy + 2); ctx.lineTo(x0 + w0 * 2.2 - 120, hy + 620); ctx.lineTo(x0 - w0 * 1.6 - 120, hy + 620); ctx.closePath(); ctx.fill();
    }
    // 两个人（逆光：稍暗 + 头后一圈月光）
    const hold = smooth(prog(t, t0 - 0.2, t0 + 0.8));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 470, hy - 420, 200, [220, 245, 225], 0.25); glow(ctx, 650, hy - 450, 200, [220, 245, 225], 0.25); ctx.restore();
    const pb = MB.person(ctx, HIM, 660, hy + 4, 2.1, { a: 1, flip: true, dim: 0.4, inner: hold * 0.8, innerC: PINK, shadow: 0 });
    const o = infp(ctx, 440, hy + 6, 0.95, { t, look: [1, -0.4], eyes: 'happy', wind: false, ra: lerp(0.2, -0.45, hold), la: 0.2, flies: 1, dim: 0.35, lean: 0.03, tilt: 0.2 * hold });
    // 牵着的手：一团稳稳的粉光，沿手臂亮到两个人心口
    const hx = (o.rh[0] + pb.chest[0] - 60) / 2, hy2 = (o.rh[1] + pb.chest[1] + 70) / 2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, hx, hy2, 90, PINK, 0.55 * hold); glow(ctx, hx, hy2, 22, [255, 240, 240], 0.9 * hold);
    glow(ctx, o.chest[0], o.chest[1], 120 * hold, PINK, 0.35 * hold);
    ctx.restore();
    if (hold > 0.01) glowLine(ctx, [o.chest, [hx, hy2], pb.chest], PINK, 0.5 * hold * (0.85 + 0.15 * Math.sin(t * 2)), 2, 0.7);
    motes(ctx, t, FF1.map(m => ({ ...m, y: m.y + d })), LIME, 0.5);
    fgGrass(ctx, t, 7, -1, 1400 + d * 1.8, 1); fgGrass(ctx, t, 8, 1, 1440 + d * 1.8, 1);
    ctx.restore();
  }, (ctx, t, a) => {
    const t0 = A1 + 0.1, ca = a * vis(t, A1, vs('E01') + 1.6, 0.2, 0.5);
    if (ca <= 0.003) return;
    ctx.save(); ctx.globalAlpha *= ca; C.gather(ctx, '恋爱里', W / 2, 330, t, t0, vs('E01') + 1.2, { size: 132, weight: 600, spacing: 0.2, keys: ['恋爱里'], keyColor: PINK }); ctx.restore();
    L.shock(ctx, W / 2, 285, t, t0 + 1.1, { r0: 30, r1: 460, dur: 1.2, c: PINK, a: ca, sy: 0.5 });
  });

  // ===== S2：近景。她占了左半边画面（实），他在右后方暖光里（虚）；一团乌云从她心口冒到嘴边，又被她咽回去，压成胸口一颗暗结 =====
  const A2 = vs('E02') - 0.3, B2 = vs('E03') - 0.05;
  const BK2 = mkBokeh(21, 22, [[255, 190, 120], [255, 160, 170], [140, 220, 190], [255, 220, 160]], [0, 0, W, 1300], [40, 130]);
  const BK2f = mkBokeh(23, 4, [[255, 196, 140], [255, 170, 180]], [700, 1100, W + 100, 1900], [140, 220]);
  const SM = (() => { const r = mulberry32(25); return Array.from({ length: 120 }, () => ({ an: r() * 6.283, rr: 0.25 + r() * 0.75, ph: r() * 6.28, sz: 0.6 + r() * 0.8, em: r() < 0.3 })); })();
  add(A2, B2, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const tc = at('E02', '有不满'), tf = at('E02', '怕说'), tk = at('E02', '憋着');
    const up = smooth(prog(t, tc - 0.15, tc + 0.9)), out = smooth(prog(t, tf - 0.1, tf + 0.7)), down = easeIn(prog(t, tk - 0.2, tk + 0.55)), knot = smooth(prog(t, tk + 0.2, tk + 0.8));
    ctx.save(); ctx.globalAlpha *= a; X.push(ctx, t, A2, B2, 0.06, 380, 1000);
    grad(ctx, [[0, [28, 30, 30]], [0.6, [22, 26, 26]], [1, [10, 12, 14]]]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 820, 760, 760, [255, 186, 120], 0.24 * (1 - up * 0.4)); ctx.restore();
    bokeh(ctx, t, BK2, 0.55 * (1 - up * 0.3));
    // 他（后景虚焦，暖光）
    blurLayer(ctx, 8, c => {
      MB.person(c, HIM, 820, 1560, 3.0, { flip: true, dim: 0.12 + up * 0.15 - knot * 0.1, warm: 0.6, shadow: 0 });
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, 820, 900, 260, [255, 200, 140], 0.25); c.restore();
    });
    // 两人之间暖暖的一根线（和和气气），乌云起来时被遮暗
    const o = infp(DUMMY, 300, 1820, 1.85, { t });
    const calm = 1 - up * 0.75 + knot * 0.4;
    glowLine(ctx, [[o.chest[0] + 120, o.chest[1] - 80], [620, 1080 + Math.sin(t * 1.6) * 10], [760, 1060]], [255, 200, 170], 0.4 * calm, 2, 0.8);
    // 她（前景，实）
    const eyes = t < tc ? 'happy' : t < tk ? 'open' : (knot > 0.5 ? 'sad' : 'closed');
    infp(ctx, 300, 1820, 1.85, { t, look: t < tk ? [1, 0] : [0.5, 1], eyes, mouth: t < tf ? 'smile' : 'flat', wind: false, flies: 1, dim: knot * 0.22, nod: knot * 0.35, ra: 0.3, la: 0.15 });
    // 乌云
    const Kp = [o.chest[0] + 30, o.chest[1] - 70], c1 = [o.mouth[0] + 90, o.mouth[1] - 60], c2 = [o.mouth[0] + 220, o.mouth[1] - 130];
    if (up > 0.01 && down < 0.999) {
      let cx = lerp(Kp[0], c1[0], up), cy = lerp(Kp[1], c1[1], up);
      cx = lerp(cx, c2[0], out * 0.6); cy = lerp(cy, c2[1], out * 0.6);
      cx = lerp(cx, Kp[0], down); cy = lerp(cy, Kp[1], down);
      const R = (50 + 150 * up + 70 * out) * (1 - down * 0.93);
      ctx.save();
      for (const p of SM) {
        const an = p.an + t * 0.7 * (1.4 - p.rr) + down * 6;
        const px = cx + Math.cos(an) * R * p.rr, py = cy + Math.sin(an) * R * p.rr * 0.72;
        ctx.fillStyle = `rgba(36,40,54,${0.2 * (1 - down * 0.4)})`; ctx.beginPath(); ctx.arc(px, py, p.sz * (20 + 34 * up) * (1 - down * 0.75), 0, 6.283); ctx.fill();
      }
      ctx.globalCompositeOperation = 'lighter';
      for (const p of SM) if (p.em) { const an = p.an + t * 0.7 * (1.4 - p.rr) + down * 6; glow(ctx, cx + Math.cos(an) * R * p.rr, cy + Math.sin(an) * R * p.rr * 0.72, 9, [230, 90, 80], 0.55 * up * (0.3 + out) * (1 - down) * (0.5 + 0.5 * Math.sin(t * 9 + p.ph))); }
      ctx.restore();
    }
    // 咽回去：一圈往里收的光环，胸口留下一颗暗结
    if (t > tk - 0.1) {
      const u = prog(t, tk + 0.1, tk + 0.6);
      if (u > 0 && u < 1) glowLine(ctx, K.circlePts(Kp[0], Kp[1], lerp(240, 16, easeIn(u)), 64), [200, 190, 220], 0.6 * (1 - u * 0.5), 2, 0.8, true);
      ctx.save(); ctx.globalAlpha *= knot; ctx.fillStyle = 'rgb(30,32,44)'; ctx.beginPath(); ctx.arc(Kp[0], Kp[1], 20, 0, 6.283); ctx.fill(); ctx.restore();
      glow(ctx, Kp[0], Kp[1], 40, [160, 80, 90], 0.35 * knot * (0.6 + 0.4 * Math.sin(t * 3)));
    }
    bokeh(ctx, t, BK2f, 0.35);
    ctx.restore();
  });

  // ===== S3：俯视书桌。台灯一束暖光照着一张大信纸；笔先悬着发抖（说不出口），落下去一行行写满；写完字迹发光，光点从纸上飘起来 =====
  const A3 = vs('E03') - 0.25, B3 = vs('E04') - 0.05;
  const HW = (() => {   // 手写字迹：8 行，每行若干个"字"，每个字是一小团连笔
    const r = mulberry32(31), lines = [];
    for (let i = 0; i < 8; i++) {
      const n = i === 7 ? 6 : 10 + Math.floor(r() * 3), y = -300 + i * 78, chars = [];
      for (let j = 0; j < n; j++) {
        const x0 = -290 + j * 48 + (i === 0 ? 0 : 0), h = r() * 6.28, pts = [];
        for (let k = 0; k < 16; k++) { const u = k / 15; pts.push([x0 + 36 * u + 6 * Math.sin(k * 1.9 + h), y - 14 - 15 * Math.sin(k * 1.1 + h * 2) * (0.6 + 0.4 * r())]); }
        chars.push(pts);
      }
      lines.push(chars);
    }
    return lines;
  })();
  const NCH = HW.reduce((s, l) => s + l.length, 0);
  const DM3 = mkMotes(33, 26, [-100, -100, 700, 1300]);
  const RISE = (() => { const r = mulberry32(35); return Array.from({ length: 46 }, () => ({ li: Math.floor(r() * 8), ch: r(), dl: r() * 1.2, dx: (r() - 0.5) * 160, sp: 260 + r() * 260, c: r() < 0.6 ? GOLD : PINK })); })();
  const BALLS = [[110, 300, 72, 1], [970, 430, 64, 2], [990, 1180, 80, 3]];
  add(A3, B3, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const tw = at('E03', '写下来'), tm = at('E03', '特别动人'), u = prog(t, A3, B3);
    ctx.save(); ctx.globalAlpha *= a;
    ctx.translate(W / 2, 820); ctx.rotate(lerp(-0.05, 0.015, smooth(u))); const sc = lerp(1.0, 1.09, smooth(u)); ctx.scale(sc, sc); ctx.translate(-W / 2, -820);
    // 桌面 + 木纹
    let g = ctx.createLinearGradient(0, -200, W, H); g.addColorStop(0, 'rgb(50,38,28)'); g.addColorStop(1, 'rgb(16,14,14)');
    ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 3;
    for (let i = 0; i < 30; i++) { ctx.beginPath(); for (let k = 0; k <= 30; k++) { const y = -200 + i * 80 + Math.sin(k * 0.4 + i) * 10 + k * 6; k ? ctx.lineTo(-300 + k * 60, y) : ctx.moveTo(-300, y); } ctx.stroke(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 420, 600, 980, [255, 190, 120], 0.34); glow(ctx, 420, 600, 420, [255, 220, 170], 0.18); ctx.restore();
    // 揉掉的纸团（之前写坏的几张）
    for (const [x, y, r0, sd] of BALLS) {
      const rr = mulberry32(sd * 97), pts = []; for (let k = 0; k < 11; k++) { const an = k / 11 * 6.283; pts.push([x + Math.cos(an) * r0 * (0.75 + 0.35 * rr()), y + Math.sin(an) * r0 * (0.75 + 0.35 * rr())]); }
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.beginPath(); ctx.ellipse(x + 14, y + 20, r0, r0 * 0.8, 0, 0, 6.283); ctx.fill();
      pts.forEach((p, k) => { const q = pts[(k + 1) % pts.length], sh = 0.65 + 0.35 * Math.sin(k * 2.3 + sd); ctx.fillStyle = rgba(mix([150, 140, 124], [240, 232, 214], sh), 1); ctx.beginPath(); ctx.moveTo(x - 8, y - 6); ctx.lineTo(...p); ctx.lineTo(...q); ctx.closePath(); ctx.fill(); });
    }
    // 信纸
    const px = 540, py = 760;
    ctx.save(); ctx.translate(px, py); ctx.rotate(-0.04);
    ctx.save(); ctx.filter = 'blur(16px)'; ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(-340, -420, 720, 900); ctx.filter = 'none'; ctx.restore();
    g = ctx.createLinearGradient(-350, -440, 350, 440); g.addColorStop(0, 'rgb(252,246,230)'); g.addColorStop(1, 'rgb(206,194,172)');
    ctx.fillStyle = g; ctx.fillRect(-350, -440, 700, 880);
    ctx.strokeStyle = 'rgba(120,130,150,0.2)'; ctx.lineWidth = 2;
    for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(-310, -300 + i * 78 + 4); ctx.lineTo(310, -300 + i * 78 + 4); ctx.stroke(); }
    // 字迹
    const wp = prog(t, tw - 0.05, tm + 0.3) * NCH, lit = smooth(prog(t, tm - 0.1, tm + 0.6));
    let n = 0, tip = [-290, -330];
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const stroke = (pts, f, col, w) => { const m = Math.max(2, Math.floor(pts.length * f)); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); for (let k = 0; k < m; k++) k ? ctx.lineTo(...pts[k]) : ctx.moveTo(...pts[k]); ctx.stroke(); return pts[m - 1]; };
    for (const line of HW) for (const ch of line) { const f = clamp(wp - n); if (f > 0) { const e = stroke(ch, f, 'rgba(46,40,64,0.92)', 3.4); if (f < 1) tip = e; else tip = ch[ch.length - 1]; } n++; }
    if (lit > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const line of HW) for (const ch of line) { stroke(ch, 1, rgba(GOLD, 0.25 * lit), 9); stroke(ch, 1, rgba([255, 236, 190], 0.55 * lit), 2.4); }
      ctx.restore();
    }
    // 笔：落笔前悬着发抖
    const down = smooth(prog(t, tw - 0.25, tw + 0.05)), done = smooth(prog(t, tm + 0.3, tm + 0.9));
    const shake = (1 - down) * Math.sin(t * 38) * 3;
    const lift = (1 - down) * 46 + done * 80;
    const pX = tip[0] + 30 * done + shake, pY = tip[1] - lift;
    ctx.save(); ctx.filter = 'blur(6px)'; ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.translate(tip[0] + 20 + lift * 0.9, tip[1] + 10 + lift * 0.5); ctx.rotate(-0.85); ctx.fillRect(0, -9, 460, 18); ctx.filter = 'none'; ctx.restore();
    ctx.save(); ctx.translate(pX, pY); ctx.rotate(-0.85);
    ctx.fillStyle = 'rgb(232,196,120)'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(60, -11); ctx.lineTo(60, 11); ctx.closePath(); ctx.fill();
    g = ctx.createLinearGradient(0, -14, 0, 14); g.addColorStop(0, 'rgb(70,78,92)'); g.addColorStop(0.4, 'rgb(30,34,42)'); g.addColorStop(1, 'rgb(14,16,20)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(60, -13); ctx.lineTo(440, -16); ctx.arc(440, 0, 16, -Math.PI / 2, Math.PI / 2); ctx.lineTo(60, 13); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgb(220,186,116)'; ctx.fillRect(150, -15, 14, 30);
    ctx.restore();
    ctx.restore();
    // 字迹里飘起来的光点
    if (lit > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const r of RISE) {
        const v = prog(t, tm + r.dl * 0.6, tm + r.dl * 0.6 + 2.2); if (v <= 0 || v >= 1) continue;
        const bx = px - 290 + r.ch * 560, by = py - 314 + r.li * 78;
        glow(ctx, bx + r.dx * v + Math.sin(v * 6 + r.dl * 9) * 20, by - r.sp * v * 1.6, 9, r.c, (1 - v) * 0.9 * lit);
      }
      ctx.restore();
    }
    beam(ctx, 200, -260, -500, 1250, 1500, [255, 214, 160], 0.14);
    motes(ctx, t, DM3, [255, 230, 190], 0.35, 14);
    // 前景虚焦杯沿
    blurLayer(ctx, 18, c => { c.fillStyle = 'rgb(10,10,12)'; c.beginPath(); c.arc(60, 1620, 300, 0, 6.283); c.fill(); c.strokeStyle = 'rgba(255,214,160,0.35)'; c.lineWidth = 10; c.beginPath(); c.arc(60, 1620, 300, -1.4, -0.2); c.stroke(); });
    ctx.restore();
  });
  // ===== S4：她挂在他胳膊上；身后一面巨大的钟，指针飞转；一条粉色丝带一圈圈把两个人缠在一起 =====
  const A4 = vs('E04') - 0.25, B4 = vs('E05') - 0.1;
  const SP4 = mkMotes(41, 30, [80, 380, 1000, 1300]);
  add(A4, B4, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('E04'), grow = smooth(prog(t, t0 - 0.15, t0 + 1.4));
    ctx.save(); ctx.globalAlpha *= a; X.push(ctx, t, A4, B4, 0.09, W / 2, 900);
    grad(ctx, [[0, [30, 18, 36]], [0.5, [22, 24, 36]], [1, [8, 12, 16]]]);
    const cx = W / 2, cy = 860, R = 420;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, cx, cy, R * 1.5, [255, 150, 180], 0.22); glow(ctx, cx, cy, R * 0.9, [255, 200, 210], 0.1);
    ctx.restore();
    glowLine(ctx, K.circlePts(cx, cy, R, 120), [255, 214, 222], 0.6, 2.4, 0.8, true);
    glowLine(ctx, K.circlePts(cx, cy, R - 46, 120), [255, 190, 205], 0.25, 1.4, 0.6, true);
    ctx.save(); ctx.lineCap = 'round';
    for (let k = 0; k < 60; k++) { const an = k / 60 * 6.283, maj = k % 5 === 0, r0 = R - (maj ? 60 : 30), r1 = R - 14; ctx.strokeStyle = maj ? 'rgba(255,226,230,0.85)' : 'rgba(255,210,220,0.35)'; ctx.lineWidth = maj ? 6 : 2.4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(an) * r0, cy + Math.sin(an) * r0); ctx.lineTo(cx + Math.cos(an) * r1, cy + Math.sin(an) * r1); ctx.stroke(); }
    ctx.restore();
    // 指针飞转 + 扫过的光扇
    const te = t - A4, hA = -Math.PI / 2 + te * 2.6, mA = -Math.PI / 2 + te * 11;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 16; k++) { const an = mA - k * 0.06; ctx.fillStyle = rgba(PINK, 0.1 * (1 - k / 16)); ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R - 70, an - 0.06, an); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    const hand = (an, len, w, c) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(an); ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(-40, -w); ctx.lineTo(len, -w * 0.3); ctx.lineTo(len + 20, 0); ctx.lineTo(len, w * 0.3); ctx.lineTo(-40, w); ctx.closePath(); ctx.fill(); ctx.restore(); };
    hand(hA, R * 0.5, 12, 'rgba(255,236,230,0.9)'); hand(mA, R * 0.78, 7, 'rgba(255,214,222,0.95)');
    glow(ctx, cx, cy, 34, [255, 240, 240], 0.9);
    // 丝带（螺旋）：先画在身后的半圈
    const N = 160, rib = []; for (let i = 0; i <= N; i++) { const s = i / N, an = s * 6.283 * 3.2 + t * 2.2; rib.push({ s, x: cx - 10 + Math.cos(an) * (250 - 70 * s), y: 1250 - s * 760, z: Math.sin(an) }); }
    const drawRib = (front) => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = 0; i < N; i++) { const p = rib[i], q = rib[i + 1]; if (p.s > grow) break; if ((p.z > 0) !== front) continue; const w = 5 + 9 * Math.abs(Math.cos(p.s * 6.283 * 3.2 + t * 2.2)); ctx.strokeStyle = rgba(front ? [255, 170, 196] : [180, 100, 140], front ? 0.85 : 0.45); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
      ctx.restore();
    };
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(cx, 1252); ctx.scale(1, 0.16); glow(ctx, 0, 0, 380, [255, 180, 200], 0.4); ctx.restore();
    drawRib(false);
    MB.person(ctx, HIM, 640, 1250, 2.35, { flip: true, warm: 0.4, inner: 0.6 * grow, innerC: PINK });
    infp(ctx, 468, 1250, 1.02, { t, wind: false, lean: 0.14, eyes: 'happy', ra: -1.05, la: 0.25, look: [1, -1], flies: 1, tilt: 0.3 });
    drawRib(true);
    if (grow > 0.98) { const tip = rib[N]; glow(ctx, tip.x, tip.y, 30, [255, 230, 236], 0.8); }
    motes(ctx, t, SP4, PINK, 0.45);
    for (let k = 0; k < 5; k++) { const v = ((t - t0) * 0.6 + k / 5) % 1; heart(ctx, 560 + Math.sin(k * 2.1 + t) * 70, 640 - v * 200, 16 + 8 * hash(k), PINK, (1 - v) * grow); }
    ctx.restore();
  }, (ctx, t, a) => X.quote(ctx, '我恨不得一天 25 个小时\n都粘着他', t, vs('E04') + 0.15, B4 - 0.15, { y: 250, keys: ['25 个小时'], keyColor: PINK }));

  // ===== S5：仰拍。她抬头，头顶一只巨大的彩虹肥皂泡，泡里是闪闪发光戴王冠的他；真过起日子时泡泡碎成玻璃片落下，镜头往下摇到现实：灰扑扑打哈欠的他 =====
  const A5 = vs('E05') - 0.25, B5 = vs('E07') - 0.05;
  const PET = (() => { const r = mulberry32(51); return Array.from({ length: 26 }, () => ({ x: r(), y: r(), ph: r() * 6.28, sp: 0.4 + r() * 0.6, s: 8 + r() * 10 })); })();
  const SHD = (() => { const r = mulberry32(53); return Array.from({ length: 34 }, () => ({ an: r() * 6.283, rr: 0.55 + r() * 0.45, v: 300 + r() * 500, rot: (r() - 0.5) * 8, sz: 22 + r() * 36, gy: 1262 + r() * 120, hue: Math.floor(r() * 4) })); })();
  const IRI = [[255, 150, 210], [140, 220, 255], [255, 240, 150], [170, 255, 200]];
  add(A5, B5, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('E05'), tpop = at('E06', '过起日子'), tfar = at('E06', '差得很远');
    const show = smooth(prog(t, t0 - 0.1, t0 + 0.9)), cold = smooth(prog(t, tpop, tpop + 1.0)), pp = prog(t, tpop, tpop + 2.2);
    ctx.save(); ctx.globalAlpha *= a;
    const tilt = lerp(160, -60, easeInOut(prog(t, tpop - 0.1, tpop + 1.6)));   // 先仰（世界往下压），碎了以后摇下来
    const zs = lerp(1.0, 1.06, smooth(prog(t, A5, tpop))) * lerp(1, 1.04, smooth(prog(t, tpop, B5)));
    grad(ctx, [[0, mix([46, 30, 60], [10, 16, 26], cold)], [0.55, mix([60, 44, 66], [18, 28, 36], cold)], [1, mix([18, 20, 28], [8, 12, 14], cold)]]);
    ctx.translate(W / 2, 900); ctx.scale(zs, zs); ctx.translate(-W / 2, -900 + tilt);
    stars(ctx, t, ST, 0.7, -200);
    // 地面
    let g = ctx.createLinearGradient(0, 1240, 0, 1900); g.addColorStop(0, rgba(mix([40, 46, 58], [28, 36, 40], cold), 1)); g.addColorStop(1, 'rgb(6,8,10)');
    ctx.fillStyle = g; ctx.fillRect(-200, 1240, W + 400, 900);
    glowLine(ctx, [[-100, 1241], [W + 100, 1241]], mix([255, 200, 220], [170, 190, 210], cold), 0.3, 1.5, 0.6);
    // 现实里的他：先在暗处被忽略，泡泡碎后被一盏冷光照出来，灰扑扑、塌着肩
    const lamp = smooth(prog(t, tpop + 0.4, tpop + 1.2));
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(800, 1262); ctx.scale(1, 0.18); glow(ctx, 0, 0, 260, [190, 210, 230], 0.45 * lamp); ctx.restore();
    beam(ctx, 800, 300, 600, 1000, 1262, [190, 210, 230], 0.12 * lamp);
    const pb = MB.person(ctx, HIM, 800, 1262, 2.1, { flip: true, dim: lerp(0.6, 0.05, lamp), gray: cold * 0.55, slump: cold * 0.8 });
    if (t > tpop + 1.0) for (let k = 0; k < 4; k++) { const v = ((t - tpop - 1.0) * 0.55 + k * 0.25) % 1; glow(ctx, pb.head[0] - 40 - v * 70, pb.head[1] - 10 - v * 80, 16 + v * 26, [210, 214, 220], 0.45 * Math.sin(v * Math.PI)); }
    // 她
    const lookUp = t < tfar ? [0.2, -1.6] : [1, 0];
    const o = infp(ctx, 330, 1262, 1.0, { t, look: lookUp, tilt: t < tpop ? -0.35 : 0, eyes: t < tpop ? 'happy' : (t < tfar ? 'wide' : 'open'), mouth: t < tpop ? 'smile' : (t < tfar ? 'o' : 'flat'), spin: t * 0.5, flies: 1, dim: cold * 0.1 });
    // 泡泡
    const Bc = [570, 450 + Math.sin(t * 0.8) * 8], R = 370 * (0.6 + 0.4 * easeOut(show));
    const ba = show * (1 - smooth(prog(t, tpop - 0.02, tpop + 0.08)));
    if (ba > 0.003) {
      ctx.save(); ctx.globalAlpha *= ba;
      for (const [k, r] of [[0.15, 16], [0.32, 24], [0.52, 34]]) { const x = lerp(o.top[0] + 40, Bc[0] - 120, k * 1.4), y = lerp(o.top[1] - 10, Bc[1] + R * 0.8, k * 1.6); ctx.strokeStyle = 'rgba(255,240,250,0.55)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.stroke(); }
      ctx.save(); ctx.beginPath(); ctx.arc(Bc[0], Bc[1], R, 0, 6.283); ctx.clip();
      g = ctx.createLinearGradient(0, Bc[1] - R, 0, Bc[1] + R); g.addColorStop(0, 'rgba(255,200,170,0.55)'); g.addColorStop(0.6, 'rgba(230,140,170,0.45)'); g.addColorStop(1, 'rgba(120,80,130,0.5)');
      ctx.fillStyle = g; ctx.fillRect(Bc[0] - R, Bc[1] - R, 2 * R, 2 * R);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, Bc[0], Bc[1] - 30, R * 0.8, [255, 220, 150], 0.6);
      for (let k = 0; k < 14; k++) { const an = k / 14 * 6.283 + t * 0.15; ctx.strokeStyle = rgba([255, 230, 170], 0.12); ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(Bc[0], Bc[1] - 30); ctx.lineTo(Bc[0] + Math.cos(an) * R, Bc[1] - 30 + Math.sin(an) * R); ctx.stroke(); }
      ctx.restore();
      MB.person(ctx, HIM, Bc[0], Bc[1] + R * 0.78, 1.65, { flip: true, warm: 1, inner: 1, innerC: GOLD, shadow: 0 });
      // 王冠
      const hx = Bc[0] + 6, hy = Bc[1] + R * 0.78 - 1.65 * 240 * 1.02;
      ctx.fillStyle = 'rgb(250,214,130)'; ctx.beginPath(); ctx.moveTo(hx - 46, hy + 10); ctx.lineTo(hx - 52, hy - 30); ctx.lineTo(hx - 22, hy - 6); ctx.lineTo(hx, hy - 44); ctx.lineTo(hx + 22, hy - 6); ctx.lineTo(hx + 52, hy - 30); ctx.lineTo(hx + 46, hy + 10); ctx.closePath(); ctx.fill();
      glow(ctx, hx, hy - 20, 70, GOLD, 0.6);
      for (const p of PET) { const x = Bc[0] - R + p.x * 2 * R + Math.sin(t * p.sp + p.ph) * 30, y = Bc[1] - R + ((p.y * 2 * R + t * 60 * p.sp) % (2 * R)); ctx.save(); ctx.translate(x, y); ctx.rotate(t * p.sp + p.ph); ctx.fillStyle = 'rgba(255,170,196,0.85)'; ctx.beginPath(); ctx.ellipse(0, 0, p.s, p.s * 0.55, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
      for (let k = 0; k < 10; k++) glow(ctx, Bc[0] + Math.cos(k * 2.1 + t * 0.4) * R * 0.75, Bc[1] + Math.sin(k * 1.3 + t * 0.4) * R * 0.7, 9, [255, 240, 200], 0.5 + 0.5 * Math.sin(t * 5 + k));
      ctx.restore();
      // 彩虹膜 + 高光
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      IRI.forEach((c, k) => { const a0 = t * 0.4 + k * 1.57; ctx.strokeStyle = rgba(c, 0.55); ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(Bc[0], Bc[1], R - 3 - k * 2, a0, a0 + 1.9); ctx.stroke(); });
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(Bc[0], Bc[1], R, 0, 6.283); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(Bc[0], Bc[1], R * 0.84, 3.55, 4.25); ctx.stroke();
      glow(ctx, Bc[0] - R * 0.42, Bc[1] - R * 0.55, 26, [255, 255, 255], 0.9);
      ctx.restore();
      ctx.restore();
    }
    // 碎裂：闪一下，玻璃片四散落地，颜色褪成灰
    if (t > tpop - 0.05) {
      const fl = 1 - smooth(prog(t, tpop, tpop + 0.45));
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, Bc[0], Bc[1], 520, [255, 240, 230], 0.6 * fl); ctx.restore();
      L.shock(ctx, Bc[0], Bc[1], t, tpop, { r0: R, r1: R * 1.7, dur: 0.9, c: IVORY, a: 0.9 });
      const tt = t - tpop;
      for (const s of SHD) {
        const dx = Math.cos(s.an), dy = Math.sin(s.an);
        let x = Bc[0] + dx * R * s.rr + dx * s.v * 0.5 * Math.min(tt, 1.2), y = Bc[1] + dy * R * s.rr + dy * s.v * 0.4 * Math.min(tt, 1.2) + 520 * tt * tt;
        const landed = y >= s.gy; if (landed) y = s.gy;
        const rot = landed ? s.rot * 0.3 : s.rot * tt, col = mix(IRI[s.hue], [120, 130, 140], smooth(prog(tt, 0.2, 1.4)));
        const al = landed ? 0.5 * (1 - smooth(prog(tt, 2.5, 4))) : 0.85;
        ctx.save(); ctx.translate(x, y); ctx.rotate(rot); if (landed) ctx.scale(1, 0.35);
        ctx.fillStyle = rgba(col, al * 0.55); ctx.strokeStyle = rgba(mix(col, [255, 255, 255], 0.5), al); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(0, -s.sz); ctx.lineTo(s.sz * 0.7, s.sz * 0.5); ctx.lineTo(-s.sz * 0.6, s.sz * 0.3); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.restore();
      }
      // 理想里那一点金光，越飘越远
      const v = easeOut(prog(t, tpop + 0.2, tfar + 0.8));
      const gx = lerp(Bc[0], 640, v), gy = lerp(Bc[1], -60, v);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, gx, gy, lerp(90, 22, v), GOLD, 0.8); glow(ctx, gx, gy, 6, [255, 250, 230], 1); ctx.restore();
    }
    ctx.restore();
  });

  // ===== S6：前景一只大沙漏（先虚），后面两个人在暖光里依偎（实）；她越幸福越不安，焦点从两人移到沙漏上：金色的沙往下漏，落下去的却变成暗沙 =====
  const A6 = vs('E07') - 0.25, B6 = vs('E08') - 0.1;
  const BK6 = mkBokeh(61, 16, [[255, 200, 130], [255, 220, 160], [255, 170, 120]], [420, 500, W + 60, 1250], [30, 90]);
  const SAND = mkMotes(63, 40, [0, 0, 1, 1]);
  add(A6, B6, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('E07'), tu = at('E07', '越不安'), tp = at('E07', '痛苦');
    const f = smooth(prog(t, tu - 0.3, tu + 0.8)), cold = smooth(prog(t, tu, ve('E07') + 0.2)), dark = smooth(prog(t, tp - 0.4, tp + 1.2));
    ctx.save(); ctx.globalAlpha *= a; X.push(ctx, t, A6, B6, 0.05, 420, 800);
    grad(ctx, [[0, mix([30, 30, 32], [12, 18, 30], cold)], [0.55, mix([44, 38, 34], [20, 26, 38], cold)], [1, [8, 10, 12]]]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 790, 900, 620, [255, 196, 128], 0.42 * (1 - cold * 0.6)); ctx.restore();
    let g = ctx.createLinearGradient(0, 1180, 0, 1700); g.addColorStop(0, 'rgba(40,36,30,1)'); g.addColorStop(1, 'rgba(8,8,10,1)');
    ctx.fillStyle = g; ctx.fillRect(-100, 1180, W + 200, 800);
    // 后景：两人依偎（先实后虚）
    blurLayer(ctx, 1 + 9 * f, c => {
      bokeh(c, t, BK6, 0.6 * (1 - cold * 0.5));
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(800, 1182); c.scale(1, 0.16); glow(c, 0, 0, 260, [255, 200, 140], 0.5); c.restore();
      MB.person(c, HIM, 880, 1180, 1.7, { flip: true, warm: 0.7 - cold * 0.4, lean: -0.05 });
      infp(c, 720, 1182, 0.74, { t, lean: 0.1, eyes: t < tu ? 'happy' : 'sad', look: t < tu ? [1, 0] : [-1, -0.4], tilt: t < tu ? 0.3 : -0.1, wind: false, ra: -0.9, la: 0.2, flies: 1 });
    });
    // 前景沙漏（先虚后实）
    const cx = 330, yT = 250, yN = 745, yB = 1230;
    blurLayer(ctx, 12 * (1 - f), c => {
      const glass = () => { c.beginPath(); c.moveTo(cx - 165, yT + 50); c.bezierCurveTo(cx - 215, yT + 280, cx - 34, yN - 110, cx - 16, yN); c.bezierCurveTo(cx - 34, yN + 110, cx - 215, yB - 290, cx - 165, yB - 45); c.lineTo(cx + 165, yB - 45); c.bezierCurveTo(cx + 215, yB - 290, cx + 34, yN + 110, cx + 16, yN); c.bezierCurveTo(cx + 34, yN - 110, cx + 215, yT + 280, cx + 165, yT + 50); c.closePath(); };
      const fall = prog(t, A6, B6 + 0.5);
      const lvl = lerp(yT + 150, yN - 120, fall), pile = lerp(yB - 70, yB - 300, fall);
      c.save(); glass(); c.clip();
      c.fillStyle = 'rgba(190,220,230,0.06)'; c.fillRect(cx - 260, yT, 520, yB - yT);
      // 上面：金色的沙（幸福）
      let gg = c.createLinearGradient(0, lvl, 0, yN); gg.addColorStop(0, 'rgb(255,222,140)'); gg.addColorStop(1, 'rgb(214,150,70)');
      c.fillStyle = gg; c.beginPath(); c.moveTo(cx - 260, lvl + 14); c.quadraticCurveTo(cx, lvl + 46, cx + 260, lvl + 14); c.lineTo(cx + 260, yN); c.lineTo(cx - 260, yN); c.closePath(); c.fill();
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, cx, (lvl + yN) / 2, 220, [255, 210, 120], 0.45);
      for (const m of SAND) { const y = lerp(lvl + 30, yN - 10, m.y), w = (y - yT) < (yN - yT) ? 160 * (1 - (y - lvl) / (yN - lvl + 1)) + 20 : 20; glow(c, cx + (m.x - 0.5) * w * 1.6, y, 4, [255, 240, 190], 0.6 * Math.sin(t * 3 * m.sp + m.ph) ** 2); }
      c.restore();
      // 下面：落下去的沙堆，上层越来越暗（拿痛苦来还）
      const darkC = [56, 62, 88];
      gg = c.createLinearGradient(0, pile, 0, yB); gg.addColorStop(0, rgba(mix([226, 168, 84], darkC, dark), 1)); gg.addColorStop(lerp(0.15, 0.7, dark), rgba(mix([214, 150, 70], darkC, dark * 0.9), 1)); gg.addColorStop(1, 'rgb(170,116,56)');
      c.fillStyle = gg; c.beginPath(); c.moveTo(cx - 260, yB); c.lineTo(cx - 260, pile + 120); c.quadraticCurveTo(cx, pile - 80, cx + 260, pile + 120); c.lineTo(cx + 260, yB); c.closePath(); c.fill();
      c.restore();
      // 沙流
      const sc = mix([255, 220, 140], [110, 120, 160], dark);
      glowLine(c, [[cx, yN - 6], [cx + Math.sin(t * 7) * 1.5, (yN + pile) / 2], [cx, pile + 22]], sc, 0.95, 4, 0.7);
      for (let k = 0; k < 8; k++) { const v = (t * 1.8 + k / 8) % 1; glow(c, cx + Math.sin(k * 3 + t) * 3, lerp(yN, pile + 20, v), 5, sc, 0.8); }
      // 玻璃
      glass(); c.strokeStyle = 'rgba(220,240,255,0.42)'; c.lineWidth = 3; c.stroke();
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(cx - 140, yT + 90); c.quadraticCurveTo(cx - 165, yT + 260, cx - 70, yN - 120); c.stroke();
      c.beginPath(); c.moveTo(cx - 140, yB - 90); c.quadraticCurveTo(cx - 168, yB - 250, cx - 80, yN + 130); c.stroke();
      c.strokeStyle = 'rgba(255,214,160,0.3)'; c.lineWidth = 6; c.beginPath(); c.moveTo(cx + 150, yT + 110); c.quadraticCurveTo(cx + 172, yT + 270, cx + 80, yN - 110); c.stroke();
      c.restore();
      // 木架
      const wood = (x, y, w, h) => { const q = c.createLinearGradient(x, 0, x + w, 0); q.addColorStop(0, 'rgb(40,26,18)'); q.addColorStop(0.4, 'rgb(120,82,52)'); q.addColorStop(1, 'rgb(46,30,20)'); c.fillStyle = q; c.fillRect(x, y, w, h); };
      wood(cx - 232, yT + 40, 26, yB - yT - 80); wood(cx + 206, yT + 40, 26, yB - yT - 80);
      for (const y of [yT, yB - 44]) { const q = c.createLinearGradient(0, y, 0, y + 44); q.addColorStop(0, 'rgb(140,98,62)'); q.addColorStop(1, 'rgb(52,34,22)'); c.fillStyle = q; c.fillRect(cx - 270, y, 540, 44); }
      c.save(); c.globalCompositeOperation = 'lighter'; c.strokeStyle = 'rgba(255,214,160,0.45)'; c.lineWidth = 2; c.beginPath(); c.moveTo(cx - 262, yT + 2); c.lineTo(cx + 262, yT + 2); c.stroke(); c.restore();
    });
    // 整体降温
    ctx.fillStyle = `rgba(14,22,48,${0.22 * cold})`; ctx.fillRect(-200, -200, W + 400, H + 400);
    ctx.restore();
  });
  // ===== S7：仰拍城堡。窗户一扇扇亮起，城门透出暖光；她站在门前的路上举起风车，被门光投到镜头前的影子是一个举剑的骑士 =====
  const A7 = vs('E08') - 0.25, B7 = vs('F01') - 0.1;
  const FF7 = mkMotes(71, 18, [60, 700, 1020, 1300]);
  add(A7, B7, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('E08'), th = at('E08', '城堡'), tk = at('E08', '骑士');
    const c7 = smooth(prog(t, A7, B7)), d = lerp(-50, 30, c7);
    const gate = smooth(prog(t, th - 0.3, th + 0.6)), stand = smooth(prog(t, tk - 0.5, tk + 0.15));
    ctx.save(); ctx.globalAlpha *= a; X.push(ctx, t, A7, B7, 0.05, W / 2, 1000);
    grad(ctx, [[0, [6, 12, 26]], [0.5, [16, 30, 44]], [0.68, [24, 42, 50]], [1, [6, 10, 12]]]);
    stars(ctx, t, ST, 0.8, d * 0.2);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 900, 230 + d * 0.2, 260, [200, 220, 240], 0.3); glow(ctx, 900, 230 + d * 0.2, 56, [240, 246, 255], 0.95); ctx.restore();
    ctx.save(); ctx.translate(0, d);
    const base = 1180;
    const stone = (x, w, top, lit = 0.5) => { const q = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); q.addColorStop(0, 'rgb(18,24,32)'); q.addColorStop(1 - lit * 0.4, 'rgb(34,44,56)'); q.addColorStop(1, 'rgb(62,78,92)'); ctx.fillStyle = q; ctx.fillRect(x - w / 2, top, w, base - top + 2); };
    const merlons = (x0, x1, top, mw = 38, gap = 30, mh = 34) => { for (let x = x0; x + mw <= x1 + 1; x += mw + gap) ctx.fillRect(x, top - mh, mw, mh + 2); };
    const roof = (x, w, top, h) => { ctx.fillStyle = 'rgb(36,30,52)'; ctx.beginPath(); ctx.moveTo(x - w / 2 - 18, top); ctx.lineTo(x, top - h); ctx.lineTo(x + w / 2 + 18, top); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(150,160,200,0.25)'; ctx.beginPath(); ctx.moveTo(x, top - h); ctx.lineTo(x + w / 2 + 18, top); ctx.lineTo(x + w * 0.18, top); ctx.closePath(); ctx.fill(); };
    const flag = (x, y) => { ctx.strokeStyle = 'rgb(60,60,70)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 70); ctx.stroke(); ctx.fillStyle = 'rgb(236,150,176)'; ctx.beginPath(); ctx.moveTo(x, y - 70); for (let k = 0; k <= 8; k++) { const u = k / 8; ctx.lineTo(x + u * 90, y - 70 + 14 * u + Math.sin(t * 5 - u * 4) * 8 * u); } for (let k = 8; k >= 0; k--) { const u = k / 8; ctx.lineTo(x + u * 90, y - 40 - 14 * u + Math.sin(t * 5 - u * 4) * 8 * u); } ctx.closePath(); ctx.fill(); };
    // 远塔（带雾）
    ctx.globalAlpha *= 1; ctx.save(); ctx.globalAlpha *= 0.55; stone(140, 110, 640, 0.3); roof(140, 110, 640, 160); stone(950, 120, 610, 0.3); roof(950, 120, 610, 170); ctx.restore();
    // 城墙
    stone(540, 860, 860, 0.5); ctx.fillStyle = 'rgb(30,40,52)'; merlons(110, 970, 860);
    // 左右塔
    stone(250, 180, 560, 0.5); ctx.fillStyle = 'rgb(30,40,52)'; merlons(160, 340, 560, 34, 22, 30); roof(250, 180, 530, 210); flag(250, 320);
    stone(830, 180, 540, 0.6); ctx.fillStyle = 'rgb(30,40,52)'; merlons(740, 920, 540, 34, 22, 30); roof(830, 180, 510, 220); flag(830, 290);
    // 主楼
    stone(540, 320, 470, 0.6); ctx.fillStyle = 'rgb(30,40,52)'; merlons(380, 700, 470, 40, 26, 34); roof(540, 320, 436, 250); flag(540, 186);
    // 月光勾边
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (const [x, y0] of [[340, 560], [920, 540], [700, 470], [970, 860]]) glowLine(ctx, [[x, y0], [x, base]], [170, 196, 230], 0.25, 1.6, 0.5);
    ctx.restore();
    // 窗户：一扇扇亮起
    const WIN = [[250, 700], [830, 690], [470, 600], [610, 600], [250, 880], [830, 880], [540, 720], [400, 980], [680, 980]];
    WIN.forEach(([x, y], i) => {
      const on = smooth(prog(t, t0 + 0.2 + i * 0.32, t0 + 0.6 + i * 0.32));
      ctx.fillStyle = rgba(mix([20, 24, 30], [255, 210, 140], on), 1);
      ctx.beginPath(); ctx.moveTo(x - 20, y + 40); ctx.lineTo(x - 20, y - 10); ctx.arc(x, y - 10, 20, Math.PI, 0); ctx.lineTo(x + 20, y + 40); ctx.closePath(); ctx.fill();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, x, y + 10, 90, [255, 196, 120], 0.45 * on); ctx.restore();
    });
    // 城门 + 门光
    ctx.fillStyle = rgba(mix([14, 16, 20], [255, 214, 150], gate), 1);
    ctx.beginPath(); ctx.moveTo(470, base); ctx.lineTo(470, 1010); ctx.arc(540, 1010, 70, Math.PI, 0); ctx.lineTo(610, base); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, 540, 1080, 300, [255, 196, 120], 0.55 * gate); ctx.restore();
    // 地面 + 门前的路
    let g = ctx.createLinearGradient(0, base, 0, 1900); g.addColorStop(0, 'rgb(20,28,30)'); g.addColorStop(1, 'rgb(4,6,8)'); ctx.fillStyle = g; ctx.fillRect(-200, base, W + 400, 900);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    g = ctx.createLinearGradient(0, base, 0, 1800); g.addColorStop(0, rgba([255, 200, 130], 0.5 * gate)); g.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(470, base); ctx.lineTo(610, base); ctx.lineTo(980, 1800); ctx.lineTo(100, 1800); ctx.closePath(); ctx.fill();
    ctx.restore();
    // 她：站在门前，逆光
    const hx = 470, hy = 1240, hs = 1.08;
    const opt = { t, ra: lerp(0.1, -1.35, stand), la: 0.35, spin: t * 2, eyes: 'open', mouth: 'flat', flies: 1, dim: 0.3, look: [0.3, -0.2] };
    const o = infp(DUMMY, hx, hy, hs, opt);
    // 骑士影子（只在影子里：长剑、头盔翎、披风）
    const sv = off('sh'), sc = sv.getContext('2d');
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.clearRect(0, 0, W, H); sc.globalAlpha = 1; sc.globalCompositeOperation = 'source-over';
    sc.translate(0, 300); infp(sc, hx, hy, hs, { ...opt, dim: 0 });
    sc.fillStyle = '#000';
    if (stand > 0.01) {
      sc.save(); sc.translate(o.rh[0], o.rh[1]); sc.rotate(-0.25 + (1 - stand) * 1.2); sc.globalAlpha = stand;
      sc.fillRect(-36, -8, 72, 16); sc.beginPath(); sc.moveTo(-10, -8); sc.lineTo(-8, -380); sc.lineTo(0, -420); sc.lineTo(8, -380); sc.lineTo(10, -8); sc.closePath(); sc.fill(); sc.restore();
      sc.save(); sc.globalAlpha = stand; sc.beginPath(); sc.moveTo(o.top[0] - 30, o.top[1] + 30); sc.quadraticCurveTo(o.top[0] - 10, o.top[1] - 150, o.top[0] - 120, o.top[1] - 120); sc.quadraticCurveTo(o.top[0] - 60, o.top[1] - 40, o.top[0] - 70, o.top[1] + 40); sc.closePath(); sc.fill();
      sc.beginPath(); sc.moveTo(o.chest[0] - 60, o.chest[1] - 60); sc.lineTo(o.chest[0] + 40, o.chest[1] - 70); sc.lineTo(hx + 150, hy); sc.lineTo(hx - 190, hy); sc.closePath(); sc.fill(); sc.restore();
    }
    sc.setTransform(1, 0, 0, 1, 0, 0); sc.globalCompositeOperation = 'source-in'; sc.fillStyle = 'rgb(2,4,6)'; sc.fillRect(0, 0, W, H); sc.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha *= 0.85 * (0.4 + 0.6 * gate); ctx.translate(hx, hy); ctx.transform(1, 0, -0.3, -0.72, 0, 0); ctx.translate(-hx, -hy - 300); ctx.filter = 'blur(3px)'; ctx.drawImage(sv, 0, 0); ctx.filter = 'none'; ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, hx + 20, hy - 360, 260, [255, 210, 150], 0.3 * gate); ctx.restore();
    infp(ctx, hx, hy, hs, opt);
    if (t > tk - 0.1) { L.shock(ctx, o.wheel[0], o.wheel[1], t, tk + 0.1, { r0: 20, r1: 420, dur: 1.2, c: GOLD, a: 1 }); glow(ctx, o.wheel[0], o.wheel[1], 120, GOLD, 0.5 * stand * (1 - prog(t, tk + 0.5, tk + 2))); }
    ctx.restore();
    motes(ctx, t, FF7, [255, 220, 150], 0.45);
    fgGrass(ctx, t, 77, -1, 1440, 1); fgGrass(ctx, t, 78, 1, 1460, 1);
    ctx.restore();
  });

  // ===== S8：微距。一只轻飘飘的蝴蝶占满画面，旁边路过的人虚成影子（别人看到的）；镜头一路拉远：蝴蝶停在她发边，她身后那条亮着的脚印一直延伸到地平线 =====
  const A8 = vs('F01') - 0.3, B8 = END - 6.3;
  const CROWD = [['estj-female', -1, 0], ['esfp-male', 1, 0.4], ['istj-male', -1, 0.8]];
  const DU8 = mkMotes(81, 40, [0, 200, W, 1400]);
  add(A8, B8, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('F01'), t2 = vs('F02'), tf = at('F02', '走多远');
    const pull = easeInOut(prog(t, t2 - 0.3, t2 + 2.4)), z = lerp(lerp(6.4, 5.9, prog(t, A8, t2)), 0.94, pull);
    const walk = prog(t, A8, B8), hx = 540, hy = lerp(1170, 1250, walk), hs = lerp(0.74, 0.84, walk), bob = Math.abs(Math.sin(t * 4.2)) * 7;
    const opt = { t, ra: -0.5, la: Math.sin(t * 4.2) * 0.35, spin: t * 2.2, eyes: 'happy', flies: 0, look: [0, 0.3] };
    const o = infp(DUMMY, hx, hy - bob, hs, opt);
    const bp = [o.top[0] - 70 * hs, o.top[1] + 70 * hs];
    const m = clamp((z - 1) / 5.4), Hc = lerp(960, 760, m), fx = lerp(540, bp[0], m), fy = lerp(960, bp[1], m);
    ctx.save(); ctx.globalAlpha *= a;
    grad(ctx, [[0, [6, 14, 24]], [0.4, [16, 34, 40]], [0.5, [44, 54, 48]], [0.62, [16, 28, 26]], [1, [4, 8, 8]]]);
    ctx.save(); ctx.translate(W / 2, Hc); ctx.scale(z, z); ctx.translate(-fx, -fy);
    const VP = [540, 900], reveal = smooth(prog(t, t2 + 0.8, tf + 0.6));
    const blurW = clamp((z - 1.6) * 2.4, 0, 12);
    blurLayer(ctx, blurW, c => {
      stars(c, t, ST, 0.7, -150);
      c.save(); c.globalCompositeOperation = 'lighter'; glow(c, VP[0], VP[1], 600, [255, 200, 140], 0.3); glow(c, VP[0], VP[1], 60, [255, 236, 200], 0.7); c.restore();
      c.fillStyle = 'rgb(10,18,18)'; c.beginPath(); c.moveTo(-600, 905); for (let k = 0; k <= 24; k++) c.lineTo(-600 + k * 95, 880 - 40 * Math.abs(Math.sin(k * 1.3)) - 20 * Math.sin(k * 0.5)); c.lineTo(1700, 905); c.closePath(); c.fill();
      let g = c.createLinearGradient(0, 900, 0, 1900); g.addColorStop(0, 'rgb(26,40,36)'); g.addColorStop(1, 'rgb(4,8,8)'); c.fillStyle = g; c.fillRect(-800, 900, 2700, 1200);
      // 路
      g = c.createLinearGradient(0, 900, 0, 1900); g.addColorStop(0, 'rgba(90,110,96,0.6)'); g.addColorStop(1, 'rgba(40,56,50,0.5)');
      c.fillStyle = g; c.beginPath(); c.moveTo(VP[0] - 8, 902); c.lineTo(VP[0] + 8, 902); c.lineTo(VP[0] + 640, 1900); c.lineTo(VP[0] - 640, 1900); c.closePath(); c.fill();
      // 脚印：从她脚下一直亮回地平线
      c.save(); c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 46; i++) {
        const v = i / 46, py = lerp(hy - 14, 906, Math.pow(v, 0.55)), k = (py - 900) / (hy - 900), side = i % 2 ? 1 : -1;
        const on = smooth(prog(reveal * 1.05, v - 0.04, v + 0.02)); if (on <= 0) continue;
        c.save(); c.translate(VP[0] + side * 22 * k * hs / 0.6, py); c.scale(1, 0.4); glow(c, 0, 0, 30 * k + 3, [255, 220, 150], 0.7 * on); glow(c, 0, 0, 8 * k + 1, [255, 248, 220], 0.9 * on); c.restore();
      }
      // 路灯
      for (let i = 0; i < 9; i++) {
        const v = (i + 0.5) / 9, py = lerp(1300, 910, Math.pow(v, 0.5)), k = (py - 900) / 400;
        for (const sd of [-1, 1]) {
          const lx = VP[0] + sd * (40 + 520 * k), on = smooth(prog(reveal * 1.05, v - 0.05, v + 0.03));
          c.strokeStyle = 'rgba(110,126,118,0.8)'; c.lineWidth = Math.max(1, 5 * k); c.beginPath(); c.moveTo(lx, py); c.lineTo(lx, py - 260 * k); c.stroke();
          glow(c, lx, py - 260 * k, 110 * k + 6, [255, 214, 150], 0.55 * on); glow(c, lx, py - 260 * k, 14 * k + 1.5, [255, 246, 220], 0.3 + 0.7 * on);
        }
      }
      c.restore();
      // 她
      c.save(); c.globalCompositeOperation = 'lighter'; c.translate(hx, hy); c.scale(1, 0.2); glow(c, 0, 0, 200 * hs, [255, 220, 150], 0.5); c.restore();
      infp(c, hx, hy - bob, hs, opt);
    });
    bigFly(ctx, bp[0] + Math.sin(t * 1.3) * 3 * hs, bp[1] + Math.cos(t * 1.1) * 3 * hs, 34 * hs, t, 1, 0.25);
    // 他：近景右侧虚焦，在等她
    const him = smooth(prog(z, 2.4, 1.2));
    if (him > 0.01) blurLayer(ctx, 10, c => MB.person(c, HIM, 1000, 1980, 4.0, { a: him, flip: true, dim: 0.45, shadow: 0 }));
    ctx.restore();
    // 微距时：轻飘飘的光尘 + 前景走过的人（别人看到的）
    const mac = smooth(prog(z, 2.5, 5.0));
    if (mac > 0.01) {
      ctx.save(); ctx.globalAlpha *= mac; motes(ctx, t, DU8, [230, 245, 200], 0.55, 30); ctx.restore();
      blurLayer(ctx, 14, c => {
        for (const [k, sd, dl] of CROWD) { const v = prog(t, A8 + dl, A8 + dl + 4.2); if (v <= 0 || v >= 1) continue; const x = sd < 0 ? lerp(-260, 1300, v) : lerp(1340, -240, v); MB.person(c, k, x, 2250, 5.2, { a: mac * Math.sin(v * Math.PI), flip: sd > 0, dim: 0.75, shadow: 0, bob: Math.abs(Math.sin(t * 5)) * 20 }); }
      });
    }
    ctx.restore();
  });

  // ===== S9：关注卡：远处那团暖光散成金粒子，聚成字 =====
  const A9 = END - 6.6, B9 = END + 1;
  const DU9 = mkMotes(91, 40, [0, 300, W, 1500]);
  add(A9, B9, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    grad(ctx, [[0, [6, 12, 20]], [0.45, [16, 30, 34]], [1, [4, 8, 8]]]);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, W / 2, 900, 700, [255, 200, 140], 0.2); ctx.restore();
    glowLine(ctx, [[-50, 1060], [W + 50, 1060]], [255, 220, 170], 0.18, 1.2, 0.6);
    motes(ctx, t, DU9, GOLD, 0.45, 26);
    ctx.restore();
  }, (ctx, t, a) => {
    const t0 = END - 6.4;
    ctx.save(); ctx.globalAlpha *= a;
    C.gather(ctx, '关注依恋研究室', W / 2, 880, t, t0, END + 30, { size: 96, weight: 600, spacing: 0.12, keys: ['关注依恋研究室'], keyColor: GOLD, from: [W / 2, 900] });
    C.gather(ctx, '了解更多心理知识', W / 2, 1010, t, t0 + 0.9, END + 30, { size: 54, weight: 500, spacing: 0.12, keys: ['了解更多心理知识'], keyColor: [242, 226, 190] });
    ctx.restore();
    L.shock(ctx, W / 2, 850, t, t0 + 1.15, { r0: 40, r1: 560, dur: 1.4, c: GOLD, a, sy: 0.4 });
  });
  return S;
};
