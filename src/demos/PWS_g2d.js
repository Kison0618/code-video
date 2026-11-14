'use strict';
// PWG2 第四幕「万家灯火」：B12（书页 P1 之后）
//   镜头从一扇亮着绿光的窗开始（她在窗里），慢慢拉远：整片山城的楼，正好 100 扇亮着的窗，99 扇暖黄，只有她这一扇是绿的 —— 1%
const X = require('./pwk');
const { infp } = require('./pf');
const S = require('./PWS_kit');
const { K, GOLD, LIME, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeInOut, glow, rgba, mix, hash, mulberry32 } = K;

const T = { in: vs('B12') - 0.9, b12: vs('B12'), pct: at('B12', '百分'), end: ve('B12') + 1.2 };
const CAM = () => [[T.in, { x: 0, y: 0, z: 5.4, ax: HW[0], ay: HW[1] }], [T.b12 + 0.2, { x: 0, y: 0, z: 4.8 }], [T.pct - 0.1, { x: 0, y: 0, z: 1.0 }], [T.end, { x: 0, y: 0, z: 0.94 }]];
let _cam; const camOf = t => S.camKF(t, _cam || (_cam = CAM()));
const SC = 2;      // 中景按 2 倍预渲，拉近时不糊
// 楼：{x, y(底), w, h, cols, rows}，窗格 = 列 × 行
function mkBuildings(seed, n, x0, x1, base, hr, sc) {
  const r = mulberry32(seed), o = []; let x = x0;
  while (x < x1) { const cols = 2 + (r() * 3 | 0), rows = 3 + (r() * hr | 0), w = cols * 150 * sc + 50 * sc, h = rows * 170 * sc + 90 * sc; o.push({ x, w, h, cols, rows, base: base + (r() - 0.5) * 80, hue: r(), roof: r() }); x += w + (10 + r() * 50) * sc; }
  return o;
}
const MS = 0.62, FS = 0.36;
const MID = mkBuildings(5, 0, -260, W + 260, 1520, 6, MS), FARB = mkBuildings(9, 0, -300, W + 300, 1010, 5, FS);
// 她的窗：取中景里最靠近画面中间的那一格
const WW = 104 * MS, WH = 124 * MS;
const HW = (() => { let best = null, bd = 1e9; MID.forEach(b => { for (let j = 0; j < b.rows; j++) for (let i = 0; i < b.cols; i++) { const cx = b.x + (45 + i * 150 + 52) * MS, cy = b.base - b.h + (80 + j * 170 + 62) * MS, d = Math.hypot(cx - 540, cy - 880); if (d < bd) { bd = d; best = [cx, cy]; } } }); return best; })();
// 给每扇窗定亮不亮：中景 62 + 远景 37 = 99 扇暖窗，再加她的 1 扇
function pickLit(B, n, seed, sc, avoid) {
  const r = mulberry32(seed), all = [];
  B.forEach((b, bi) => { for (let j = 0; j < b.rows; j++) for (let i = 0; i < b.cols; i++) { const cx = b.x + (45 + i * 150 + 52) * sc, cy = b.base - b.h + (80 + j * 170 + 62) * sc; if (cx > 30 && cx < W - 30 && cy > 330 && cy < 1300 && !(avoid && Math.hypot(cx - avoid[0], cy - avoid[1]) < 40)) all.push({ bi, i, j, k: r() }); } });
  all.sort((a, b) => a.k - b.k); const S0 = new Set(all.slice(0, Math.floor(all.length * n)).map(q => q.bi + '_' + q.i + '_' + q.j)); return S0;
}
const LITM = pickLit(MID, 0.52, 3, MS, HW), LITF = pickLit(FARB, 0.55, 4, FS, null);
function drawB(c, B, LIT, sc, far) {
  const r = mulberry32(far ? 71 : 37);
  B.forEach((b, bi) => {
    const top = b.base - b.h, col = far ? mix([40, 42, 96], [62, 52, 110], b.hue) : mix([26, 30, 74], [50, 40, 86], b.hue);
    const g = c.createLinearGradient(0, top, 0, b.base); g.addColorStop(0, rgba(mix(col, [130, 120, 190], 0.2))); g.addColorStop(1, rgba(mix(col, [4, 6, 20], 0.35))); c.fillStyle = g; c.fillRect(b.x, top, b.w, b.h + 400);
    const gs = c.createLinearGradient(b.x, 0, b.x + b.w, 0); gs.addColorStop(0, 'rgba(170,180,255,0.10)'); gs.addColorStop(0.5, 'rgba(0,0,0,0)'); gs.addColorStop(1, 'rgba(0,0,10,0.3)'); c.fillStyle = gs; c.fillRect(b.x, top, b.w, b.h + 400);
    // 屋顶：女儿墙 + 水箱 / 天线
    c.fillStyle = rgba(mix(col, [150, 150, 210], 0.3)); c.fillRect(b.x - 6 * sc, top - 10 * sc, b.w + 12 * sc, 16 * sc);
    c.fillStyle = rgba(mix(col, [0, 0, 20], 0.3));
    if (b.roof < 0.4) { c.fillRect(b.x + b.w * 0.2, top - 70 * sc, 70 * sc, 60 * sc); c.fillRect(b.x + b.w * 0.2 - 6 * sc, top - 78 * sc, 82 * sc, 10 * sc); } else if (b.roof < 0.7) { c.fillRect(b.x + b.w * 0.7, top - 120 * sc, 6 * sc, 110 * sc); c.fillRect(b.x + b.w * 0.7 - 24 * sc, top - 100 * sc, 54 * sc, 5 * sc); } else { c.beginPath(); c.moveTo(b.x + b.w * 0.5, top - 10 * sc); c.lineTo(b.x + b.w * 0.75, top - 70 * sc); c.lineTo(b.x + b.w, top - 10 * sc); c.fill(); }
    for (let j = 0; j < b.rows; j++) for (let i = 0; i < b.cols; i++) {
      const wx = b.x + (45 + i * 150) * sc, wy = top + (80 + j * 170) * sc, ww = 104 * sc, wh = 124 * sc, on = LIT.has(bi + '_' + i + '_' + j);
      c.fillStyle = rgba(mix(col, [0, 0, 10], 0.45)); c.fillRect(wx - 7 * sc, wy - 7 * sc, ww + 14 * sc, wh + 14 * sc);
      if (on) { const wc = mix([255, 190, 110], [255, 226, 170], r()); const wg = c.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, rgba(mix(wc, [255, 255, 255], 0.35))); wg.addColorStop(1, rgba(mix(wc, [220, 100, 60], 0.3))); c.fillStyle = wg; c.fillRect(wx, wy, ww, wh);
        const k = r(); c.fillStyle = 'rgba(110,50,36,0.4)';
        if (k < 0.35) { c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + ww * 0.4, wy); c.quadraticCurveTo(wx + ww * 0.3, wy + wh * 0.6, wx, wy + wh * 0.9); c.fill(); } else if (k < 0.6) { c.beginPath(); c.arc(wx + ww * (0.3 + r() * 0.4), wy + wh * 0.62, ww * 0.16, 0, 6.2832); c.fill(); c.fillRect(wx + ww * 0.3, wy + wh * 0.74, ww * 0.4, wh * 0.26); } else if (k < 0.8) c.fillRect(wx, wy + wh * 0.72, ww, wh * 0.28);
        S.add(c, () => glow(c, wx + ww / 2, wy + wh / 2, 150 * sc, wc, 0.32)); }
      else { const wg = c.createLinearGradient(0, wy, 0, wy + wh); wg.addColorStop(0, far ? 'rgb(46,50,104)' : 'rgb(34,40,92)'); wg.addColorStop(1, 'rgb(14,16,44)'); c.fillStyle = wg; c.fillRect(wx, wy, ww, wh); }
      c.fillStyle = rgba(mix(col, [0, 0, 10], 0.45)); c.fillRect(wx + ww / 2 - 3 * sc, wy, 6 * sc, wh); c.fillRect(wx - 12 * sc, wy + wh, ww + 24 * sc, 10 * sc);
    }
  });
}
const PADX = 300;
const IMG_F = S.lazy(() => S.bake(W + PADX * 2, 1500, c => { c.translate(PADX, 0); drawB(c, FARB, LITF, FS, true); S.vgrad(c, [[0, [110, 90, 150], 0], [1, [110, 90, 150], 0.55]], 500, 1100, -PADX, W + PADX); }));
const SKY = S.lazy(() => S.bake(W + 400, H, c => { c.translate(200, 0); S.vgrad(c, [[0, [5, 8, 28]], [0.3, [16, 22, 64]], [0.5, [50, 46, 104]], [0.62, [120, 84, 120]], [1, [40, 34, 70]]], 0, H, -200, W + 200); S.stars(c, 52, [-200, 0, W + 200, 620], 120, 0.9); S.clouds(c, 19, [-200, 380, W + 200, 600], 6, [150, 150, 220], 0.14, [200, 460]); }));
const HILL = S.lazy(() => S.bake(W + 600, 1100, c => { c.translate(300, 0); const r = mulberry32(88);
  S.mountain(c, S.ridge(61, -300, W + 300, 760, 330, 130), 1100, [70, 66, 140], [40, 40, 100], { facet: 0.5 });
  S.add(c, () => { for (let k = 0; k < 520; k++) { const x = -300 + r() * (W + 600), y = 470 + Math.pow(r(), 0.7) * 520, cl = 0.5 + 0.5 * Math.sin(x * 0.011 + y * 0.02); if (r() > cl + 0.25) continue; const s = 2 + r() * 2.6; glow(c, x, y, s * 3.4, [255, 196, 120], 0.5); c.fillStyle = 'rgba(255,226,170,0.9)'; c.fillRect(x - s / 2, y - s / 2, s, s); } });
  S.vgrad(c, [[0, [130, 96, 150], 0], [1, [130, 96, 150], 0.5]], 600, 1100, -300, W + 300); }));
// 前景：近处屋顶的剪影（虚化）
const FG = S.lazy(() => S.bake(W + 600, 800, c => { c.filter = 'blur(8px)'; c.fillStyle = 'rgb(7,8,22)'; c.fillRect(0, 330, 560, 500); c.fillRect(90, 180, 150, 160); c.fillRect(70, 160, 190, 26); c.fillRect(420, 60, 12, 280); c.fillRect(380, 100, 92, 9);
  c.fillRect(1100, 400, 700, 420); c.beginPath(); c.moveTo(1180, 400); c.lineTo(1330, 250); c.lineTo(1480, 400); c.fill(); c.fillRect(1560, 220, 14, 190); }));

function herWindow(ctx, t, C) {
  const x = HW[0] - WW / 2, y = HW[1] - WH / 2, br = 1 + 0.06 * Math.sin(t * 0.8);
  S.add(ctx, () => { glow(ctx, HW[0], HW[1], 260 * br, [190, 240, 120], 0.55); glow(ctx, HW[0], HW[1], 110, [226, 250, 170], 0.4); });
  ctx.fillStyle = 'rgb(18,20,50)'; ctx.fillRect(x - 4.5, y - 4.5, WW + 9, WH + 9);
  const g = ctx.createLinearGradient(0, y, 0, y + WH); g.addColorStop(0, 'rgb(236,252,180)'); g.addColorStop(1, 'rgb(150,214,120)'); ctx.fillStyle = g; ctx.fillRect(x, y, WW, WH);
  ctx.save(); ctx.beginPath(); ctx.rect(x, y, WW, WH); ctx.clip();
  // 窗里：她趴在窗台看外面，旁边一盆小植物
  infp(ctx, HW[0] + 3, y + WH + 21, 0.124, { t, spin: t * 2, look: [1, -0.5], tilt: -0.2 });
  ctx.fillStyle = 'rgba(70,130,90,0.9)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(x + 10 + k * 2, y + WH - 9 - k * 2.5, 2.5, 7, -0.6 + k * 0.4, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = 'rgb(170,110,80)'; ctx.fillRect(x + 6, y + WH - 8, 11, 8);
  const cg = ctx.createLinearGradient(x, 0, x + 22, 0); cg.addColorStop(0, 'rgba(90,150,90,0.7)'); cg.addColorStop(1, 'rgba(90,150,90,0)'); ctx.fillStyle = cg; ctx.fillRect(x, y, 14, WH);
  ctx.restore();
  ctx.fillStyle = 'rgb(18,20,50)'; ctx.fillRect(x - 7.5, y + WH, WW + 15, 6);
}
function draw(ctx, t) {
  const C = camOf(t);
  ctx.fillStyle = 'rgb(5,8,28)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 0.1); ctx.drawImage(SKY(), -200, 0); S.moon(ctx, 830, 250, 70, t); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.25); ctx.drawImage(HILL(), -300, 0); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.5); ctx.drawImage(IMG_F(), -PADX, 0); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.75); S.add(ctx, () => { for (let i = 0; i < 5; i++) S.rgrad(ctx, i * 280 + Math.sin(t * 0.15 + i) * 60, 1020 + (i % 2) * 70, 480, [[0, [140, 110, 180], 0.2], [1, [140, 110, 180], 0]], 0.3); }); ctx.restore();
  ctx.save(); S.cam(ctx, C, 1); drawB(ctx, MID, LITM, MS, false); herWindow(ctx, t, C); ctx.restore();
  const fa = smooth(prog(C.z, 1.6, 1.05)); if (fa > 0.01) { ctx.save(); S.cam(ctx, C, 1.35); ctx.globalAlpha = fa; ctx.drawImage(FG(), -300, 1210); ctx.restore(); }
  S.vgrad(ctx, [[0, [5, 8, 28], 0], [1, [5, 8, 28], 0.75]], 1250, 1700, 0, W);
  return { C };
}
function over(ctx, t, a) {
  const u = prog(t, T.pct - 0.25, T.pct + 0.7), ta = smooth(u) * a * (1 - smooth(prog(t, T.end - 0.5, T.end))); if (ta <= 0.003) return;
  ctx.save(); ctx.shadowColor = rgba(LIME, 0.6 * ta); ctx.shadowBlur = 70;
  K.text(ctx, '1%', W / 2, 300 + (1 - easeOut(u)) * 30, { size: 250, family: 'Latin', weight: 600, color: mix(LIME, [255, 255, 255], 0.3), alpha: ta }); ctx.restore();
  X.L.rich(ctx, '万家灯火里，只有一扇窗是这个颜色', W / 2, 392, { size: 40, weight: 500, spacing: 0.08, color: [226, 226, 240], alpha: 0.9 * ta * smooth(prog(u, 0.4, 1)), keys: ['一扇窗'], keyColor: LIME });
}
module.exports = { draw, over, T };
