'use strict';
// 场景「山崖看城」：夜空 + 月亮（主光源）+ 云 + 三层低多边形远山 + 盆地里的城市灯海 + 近处山崖 + 前景虚化的树枝
//   world(ctx, t, C, o)  按相机 C 画全部背景层；o.city 城市亮度、o.wave 灯海随风起伏、o.moonA
//   cliffTop(x)          山崖顶面在 x 处的 y（人站在上面）
const K = require('../core');
const S = require('./PWS_kit');
const { W, H, clamp, lerp, prog, smooth, glow, rgba, mix, mulberry32, hash } = K;

const PAD = 260, BW = W + PAD * 2, BH = H + PAD * 2;   // 位图比画面大一圈，相机可以平移/拉远
const NIGHT = {
  sky: [[0, [5, 8, 26]], [0.3, [13, 20, 58]], [0.52, [34, 36, 92]], [0.64, [86, 62, 112]], [0.72, [150, 96, 110]], [0.78, [60, 48, 86]], [1, [14, 16, 40]]],
  moon: [246, 240, 222], cloud: [150, 160, 230], far: [[86, 84, 150], [50, 52, 110]], mid: [[58, 62, 124], [28, 32, 78]], near: [[36, 44, 92], [14, 18, 48]],
  rockL: [70, 84, 132], rockD: [16, 20, 46], grass: [64, 132, 110],
};
const HORIZON = 1030, MOON = [860, 250];

// ---- 预渲层 ----
const SKY = S.lazy(() => S.bake(BW, BH, c => {
  c.translate(PAD, PAD);
  S.vgrad(c, NIGHT.sky, -PAD, 1500, -PAD, W + PAD); c.fillStyle = rgba([14, 16, 40]); c.fillRect(-PAD, 1500, BW, 800);
  S.stars(c, 31, [-PAD, -PAD, W + PAD, 900], 150, 0.9);
  // 银河一样的淡淡一条（斜的柔光带，给夜空层次）
  c.save(); c.translate(380, 300); c.rotate(-0.5); S.add(c, () => { for (let i = 0; i < 14; i++) S.rgrad(c, (i - 7) * 120, Math.sin(i) * 40, 260, [[0, [120, 130, 230], 0.07], [1, [120, 130, 230], 0]], 0.5); }); c.restore();
}));
const CLOUD = [0, 1].map(i => S.lazy(() => S.bake(BW, BH, c => {
  c.translate(PAD, PAD);
  if (i === 0) { S.clouds(c, 5, [-200, 520, W + 200, 760], 7, NIGHT.cloud, 0.16); S.clouds(c, 6, [-200, 120, W + 200, 300], 3, NIGHT.cloud, 0.08); }
  else { S.clouds(c, 8, [-200, 760, W + 200, 900], 6, [226, 170, 180], 0.14, [200, 480]); }
})));
const MTN = S.lazy(() => S.bake(BW, BH, c => {
  c.translate(PAD, PAD);
  S.mountain(c, S.ridge(11, -PAD, W + PAD, 940, 250, 120), 1300, NIGHT.far[0], NIGHT.far[1], { facet: 0.55 });
  S.vgrad(c, [[0, [150, 110, 150], 0], [1, [150, 110, 150], 0.5]], 760, 1040);   // 山脚的雾
  S.mountain(c, S.ridge(23, -PAD, W + PAD, 990, 170, 100, 1.4), 1300, NIGHT.mid[0], NIGHT.mid[1], { facet: 0.6 });
  S.vgrad(c, [[0, [130, 100, 150], 0], [1, [130, 100, 150], 0.42]], 880, 1060);
}));
// 城市灯海：盆地里按透视铺开，路网成串、街区成片，几栋高楼；越远越密越小
const CITY = S.lazy(() => S.bake(BW, BH, c => {
  c.translate(PAD, PAD);
  const r = mulberry32(77), Y0 = HORIZON + 6, Y1 = 1420;
  // 盆地底：暗紫的地面 + 一条反光的河
  S.vgrad(c, [[0, [44, 40, 86]], [0.25, [24, 24, 60]], [1, [8, 10, 26]]], Y0 - 4, 1700, -PAD, W + PAD);
  c.save(); c.globalCompositeOperation = 'lighter';
  c.beginPath(); c.moveTo(1180, Y0 + 10); c.bezierCurveTo(700, Y0 + 60, 980, Y0 + 150, 560, Y0 + 260); c.bezierCurveTo(420, Y0 + 300, 620, Y0 + 420, 900, Y0 + 520);
  c.lineTo(1100, Y0 + 520); c.bezierCurveTo(700, Y0 + 400, 560, Y0 + 320, 700, Y0 + 270); c.bezierCurveTo(1060, Y0 + 160, 800, Y0 + 70, 1220, Y0 + 22); c.closePath();
  c.filter = 'blur(6px)'; c.fillStyle = 'rgba(120,130,210,0.35)'; c.fill(); c.filter = 'none'; c.restore();
  const cols = [[255, 190, 110], [255, 190, 110], [255, 214, 150], [255, 236, 210], [130, 220, 240], [255, 140, 170], [255, 120, 90]];
  const dot = (x, y, s, col, a) => { glow(c, x, y, s * 3.2, col, a * 0.55); c.fillStyle = rgba(mix(col, [255, 255, 255], 0.5), a); c.fillRect(x - s / 2, y - s / 2, s, s * 0.8); };
  S.add(c, () => {
    // 街区：成片的格子灯
    for (let b = 0; b < 150; b++) {
      const d = Math.pow(r(), 1.6), y = lerp(Y0 + 4, Y1, d), sc = 0.25 + d * 1.5, x = -PAD + r() * BW, n = 6 + (r() * 16 | 0), col = cols[(r() * cols.length) | 0];
      const bw = (30 + r() * 90) * sc, bh = (6 + r() * 14) * sc, nx = Math.max(2, (bw / (9 * sc)) | 0);
      for (let k = 0; k < n; k++) dot(x + ((k % nx) / nx) * bw + r() * 3, y + ((k / nx) | 0) * bh * 0.5, (1.4 + r() * 1.6) * sc, r() < 0.8 ? col : cols[(r() * cols.length) | 0], 0.5 + r() * 0.5);
    }
    // 路：一串串暖黄路灯沿着弯路排开
    for (let rd = 0; rd < 9; rd++) {
      const x0 = -PAD + r() * BW, y0 = Y0 + 10 + r() * 60, x1 = -PAD + r() * BW, y1 = Y1 - r() * 80, cx = lerp(x0, x1, 0.5) + (r() - 0.5) * 500, cy = lerp(y0, y1, 0.4);
      for (let k = 0; k <= 60; k++) { const s = k / 60, u = 1 - s, x = u * u * x0 + 2 * u * s * cx + s * s * x1, y = u * u * y0 + 2 * u * s * cy + s * s * y1, sc = 0.25 + ((y - Y0) / (Y1 - Y0)) * 1.5; if (k % 2 === 0) dot(x + (r() - 0.5) * 4 * sc, y, 1.6 * sc, [255, 200, 120], 0.6); }
    }
  });
  // 高楼群：在中远处，有体积（亮面/暗面）和窗格
  for (let k = 0; k < 22; k++) {
    const x = 660 + (r() - 0.5) * (r() < 0.7 ? 420 : 900), d = 0.06 + r() * 0.2, y = lerp(Y0, Y1, d), sc = 0.45 + d * 1.6, w = (20 + r() * 26) * sc, h = (50 + r() * r() * 190) * sc;
    const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgb(52,52,104)'); g.addColorStop(0.55, 'rgb(30,30,72)'); g.addColorStop(0.56, 'rgb(16,16,44)'); g.addColorStop(1, 'rgb(12,12,36)');
    c.fillStyle = g; c.fillRect(x, y - h, w, h);
    S.add(c, () => { const col = cols[(r() * 4) | 0]; for (let j = 0; j < h / (7 * sc); j++) for (let i = 0; i < 3; i++) if (r() < 0.55) { c.fillStyle = rgba(col, 0.5 + r() * 0.5); c.fillRect(x + 3 * sc + i * w * 0.17, y - h + 5 * sc + j * 7 * sc, w * 0.11, 3.2 * sc); } glow(c, x + w / 2, y - h, 16 * sc, [255, 110, 100], 0.8); });
  }
  // 城市上空的光霾（暖）
  S.add(c, () => { S.rgrad(c, 700, Y0 + 40, 760, [[0, [255, 160, 130], 0.34], [1, [255, 160, 130], 0]], 0.3); S.rgrad(c, 300, Y0 + 90, 520, [[0, [255, 190, 130], 0.18], [1, [255, 190, 130], 0]], 0.3); });
}));
// 近处的山崖（低多边形岩面 + 崖顶草）
const TOP = [[-PAD, 1296], [120, 1284], [300, 1270], [470, 1262], [590, 1258], [640, 1266]];
function cliffTop(x) { for (let i = 1; i < TOP.length; i++) if (x <= TOP[i][0]) return lerp(TOP[i - 1][1], TOP[i][1], (x - TOP[i - 1][0]) / (TOP[i][0] - TOP[i - 1][0])); return TOP[TOP.length - 1][1]; }
const CLIFF = S.lazy(() => S.bake(BW, BH, c => {
  c.translate(PAD, PAD);
  const edge = [[640, 1266], [668, 1330], [640, 1420], [700, 1540], [680, 1700], [760, 1900], [800, BH]];
  S.poly(c, [...TOP, ...edge, [-PAD, BH]], rgba(NIGHT.rockD));
  // 岩面切面：朝月亮（右上）的亮，背光的暗
  const r = mulberry32(5), V = [];
  for (let j = 0; j < 7; j++) for (let i = 0; i < 8; i++) V.push([-PAD + i * 150 + (r() - 0.5) * 90, 1270 + j * 110 + (r() - 0.5) * 60]);
  c.save(); S.poly(c, [...TOP, ...edge, [-PAD, BH]]); c.clip();
  for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) {
    const a = V[j * 8 + i], b = V[j * 8 + i + 1], d = V[(j + 1) * 8 + i], e = V[(j + 1) * 8 + i + 1];
    for (const tri of [[a, b, d], [b, e, d]]) { const k = clamp(0.22 + (r() - 0.5) * 0.3 + (i / 7) * 0.32 - j * 0.045); S.poly(c, tri, rgba(mix(NIGHT.rockD, NIGHT.rockL, k))); }
  }
  // 崖边一道月光勾边
  const g = c.createLinearGradient(520, 0, 720, 0); g.addColorStop(0, 'rgba(170,186,255,0)'); g.addColorStop(1, 'rgba(170,186,255,0.34)'); c.fillStyle = g; c.fillRect(520, 1240, 300, 700);
  c.restore();
  // 崖顶的草皮：一层厚的亮边 + 成丛的草叶
  c.beginPath(); TOP.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = TOP.length - 1; i >= 0; i--) c.lineTo(TOP[i][0], TOP[i][1] + 26 + (i % 2) * 10);
  const gg = c.createLinearGradient(0, 1250, 0, 1310); gg.addColorStop(0, rgba(mix(NIGHT.grass, [200, 240, 200], 0.35))); gg.addColorStop(1, rgba(mix(NIGHT.grass, [10, 20, 40], 0.6))); c.fillStyle = gg; c.fill();
  for (let i = 0; i < 90; i++) { const x = -PAD + r() * (650 + PAD), y = cliffTop(x) + 4, h = 14 + r() * 26, lean = (r() - 0.3) * 14; c.fillStyle = rgba(mix(NIGHT.grass, [190, 240, 190], r() * 0.5), 0.9); c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h); c.quadraticCurveTo(x + 4 + lean * 0.3, y - h * 0.5, x + 5, y); c.fill(); }
}));
// 前景：左上角垂下来的虚化树枝（深色叶团，月光勾边）
const BRANCH = S.lazy(() => S.bake(700, 900, c => {
  const r = mulberry32(41);
  c.filter = 'blur(7px)';
  c.strokeStyle = 'rgb(8,10,24)'; c.lineWidth = 26; c.lineCap = 'round'; c.beginPath(); c.moveTo(-20, 60); c.quadraticCurveTo(220, 120, 420, 330); c.stroke();
  c.lineWidth = 14; c.beginPath(); c.moveTo(200, 130); c.quadraticCurveTo(280, 320, 250, 520); c.stroke();
  for (let i = 0; i < 70; i++) { const s = r(), x = 20 + s * 430 + (r() - 0.5) * 200, y = 60 + s * 300 + (r() - 0.2) * 260, R = 26 + r() * 40, rot = r() * 6.28;
    c.fillStyle = rgba(mix([8, 12, 28], [50, 76, 120], r() * r())); c.save(); c.translate(x, y); c.rotate(rot); c.beginPath(); c.moveTo(-R, 0); c.quadraticCurveTo(0, -R * 0.55, R, 0); c.quadraticCurveTo(0, R * 0.55, -R, 0); c.fill(); c.restore(); }
}));

function world(ctx, t, C, o = {}) {
  const { city = 1, wave = 0, moonA = 1, cliff = 1, branch = 1 } = o;
  ctx.fillStyle = 'rgb(5,8,26)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 0.12); ctx.drawImage(SKY(), -PAD, -PAD); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.16); S.moon(ctx, MOON[0], MOON[1], 86, t, NIGHT.moon, moonA); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.2); ctx.globalAlpha = 0.9; ctx.drawImage(CLOUD[0](), -PAD + ((t * 5) % 80) - 40, -PAD); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.3); ctx.drawImage(MTN(), -PAD, -PAD); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.34); ctx.drawImage(CLOUD[1](), -PAD - ((t * 8) % 100) + 50, -PAD + 40); ctx.restore();
  // 城市
  ctx.save(); S.cam(ctx, C, 0.5);
  ctx.globalAlpha = lerp(0.3, 1, clamp(city)); ctx.drawImage(CITY(), -PAD, -PAD);
  if (wave > 0.01) {      // 风过灯海：一道道亮带从左往右扫过去
    ctx.globalCompositeOperation = 'lighter'; const img = CITY(), n = 64, sw = BW / n;
    for (let i = 0; i < n; i++) { const a = Math.pow(0.5 + 0.5 * Math.sin(t * 2.4 - i * 0.2), 3) * wave * 0.85; if (a > 0.02) { ctx.globalAlpha = a; ctx.drawImage(img, i * sw, PAD + HORIZON - 20, sw, 460, -PAD + i * sw, HORIZON - 20, sw, 460); } }
  }
  ctx.restore();
  if (city < 0.99) { ctx.save(); S.cam(ctx, C, 0.5); S.vgrad(ctx, [[0, [10, 12, 36], 0], [0.2, [10, 12, 36], 0.5 * (1 - city)], [1, [10, 12, 36], 0.6 * (1 - city)]], HORIZON - 60, 1700); ctx.restore(); }
  // 崖下的雾
  ctx.save(); S.cam(ctx, C, 0.8); S.add(ctx, () => { for (let i = 0; i < 5; i++) S.rgrad(ctx, 500 + i * 190 + Math.sin(t * 0.13 + i * 2) * 70, 1420 + (i % 2) * 70, 420, [[0, [120, 120, 200], 0.11], [1, [120, 120, 200], 0]], 0.34); }); ctx.restore();
  if (cliff > 0.01) { ctx.save(); S.cam(ctx, C, 1); ctx.globalAlpha = cliff; ctx.drawImage(CLIFF(), -PAD, -PAD); ctx.restore(); }
}
function front(ctx, t, C, a = 1) {
  if (a <= 0.003) return;
  ctx.save(); S.cam(ctx, C, 1.5); ctx.globalAlpha = a; ctx.translate(-150, -120); ctx.rotate(Math.sin(t * 0.5) * 0.012); ctx.drawImage(BRANCH(), 0, 0); ctx.restore();
}
module.exports = { world, front, cliffTop, HORIZON, MOON, NIGHT, PAD };
