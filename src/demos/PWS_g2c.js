'use strict';
// PWG2 第三幕「湖边」：B07–B11。穿过花拱门是城市公园的湖，对岸是城市的灯，月亮在左上，她站在伸进湖里的木栈桥上
//   B07 自我身份：湖面上站着一个发着金光的「她自己」。她伸手走过去，那个自己就往湖心退一步，再走再退 —— 永远在追
//   B08 珍视认可 / 轻信：栈桥上两个朋友各递来一朵发光的花，她转身接住，抱在胸口整个人都亮了；
//       同时湖上小船里一个看不清脸的人甩过来一根钓竿，钩子上挂着一颗更大更亮的心，她眼睛一亮，转头就伸手去够（上钩）
//   B09 理想、自由、热爱：她点起三盏天灯，念到哪个词就放飞哪一盏，灯上写着那个词
//   B10 追求梦想、对世界心怀热忱：对岸整座城的天灯跟着升起来，倒映在湖里；她张开手臂，风车飞转，胸口的光一圈圈荡开（触动灵魂）
//   B11 感性远大于理性：镜头推近，她手心托着一颗小小的蓝色晶体（理性）；说到「感性」，暖色的极光从她胸口涌出来铺满整片天和湖，晶体只剩一点蓝
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const { K, GOLD, LIME, PINK, BLUE, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const HY = 980, PY = 1236, PAD = 240, BW = W + PAD * 2, MOON = [230, 290];
const T = { in: vs('B07') - 0.5, b07: vs('B07'), ever: at('B07', '永远'), b08: vs('B08'), also: at('B08', '同时'), trust: at('B08', '轻信'), b09: vs('B09'),
  w: [at('B09', '理想'), at('B09', '自由'), at('B09', '热爱')], b10: vs('B10'), world: at('B10', '对世界'), soul: at('B10', '触动'), b11: vs('B11'), feel: at('B11', '感性'), far: at('B11', '远远'), reason: at('B11', '理性'), end: ve('B11') + 0.4 };
const CAM = [
  [T.in, { x: 190, y: 500, z: 1.04, ax: W / 2, ay: PY }], [T.b07 + 0.5, { x: 200, y: 560, z: 1.0 }], [T.b07 + 1.25, { x: 200, y: 560, z: 1.0 }], [T.ever + 1.2, { x: 170, y: 110, z: 0.96 }], [T.b08 - 0.1, { x: 150, y: 30, z: 0.96 }], [T.b08 + 1.0, { x: -150, y: 0, z: 1.1 }], [T.also - 0.2, { x: -150, y: 0, z: 1.12 }],
  [T.also + 0.5, { x: 150, y: -30, z: 1.0 }], [T.b09 - 0.4, { x: 150, y: -30, z: 1.03 }], [T.b09 + 0.6, { x: 110, y: 0, z: 1.2 }], [T.w[0] - 0.1, { x: 110, y: -10, z: 1.2 }], [T.w[2] + 0.9, { x: 0, y: -30, z: 1.0 }],
  [T.world + 1.6, { x: 0, y: -44, z: 0.9 }], [T.b11 - 0.3, { x: 0, y: -50, z: 0.9 }], [T.b11 + 0.9, { x: -30, y: 110, z: 1.5 }], [T.feel - 0.1, { x: -30, y: 110, z: 1.54 }], [T.far + 0.5, { x: 0, y: -40, z: 0.92 }], [T.end, { x: 0, y: -50, z: 0.9 }],
];
// ---------- 预渲 ----------
const SKY = S.lazy(() => S.bake(BW, HY + PAD + 30, c => {
  c.translate(PAD, PAD);
  S.vgrad(c, [[0, [5, 9, 30]], [0.4, [14, 30, 78]], [0.72, [44, 60, 124]], [0.9, [126, 100, 150]], [1, [200, 140, 150]]], -PAD, HY, -PAD, W + PAD);
  S.stars(c, 77, [-PAD, -PAD, W + PAD, 800], 170, 0.9);
  S.clouds(c, 15, [-200, 560, W + 200, 800], 6, [150, 160, 230], 0.13, [200, 460]);
}));
// 对岸：远山 + 城市天际线（带灯），倒影用它翻过来画
const FARH = 420;
const FAR = S.lazy(() => S.bake(BW, FARH, c => {
  c.translate(PAD, 0); const r = mulberry32(21), B = FARH;
  S.mountain(c, S.ridge(31, -PAD, W + PAD, B, 250, 110), B, [88, 96, 160], [52, 60, 120], { facet: 0.5 });
  S.mountain(c, S.ridge(47, -PAD, W + PAD, B + 20, 150, 90, 1.5), B, [60, 66, 130], [34, 40, 92], { facet: 0.5 });
  S.vgrad(c, [[0, [190, 140, 160], 0], [1, [190, 140, 160], 0.5]], B - 170, B, -PAD, W + PAD);
  for (let i = 0; i < 90; i++) {
    const x = -PAD + r() * BW, cl = Math.exp(-Math.pow((x - 700) / 330, 2)), w = 14 + r() * 26, h = 14 + r() * 26 + cl * r() * 130;
    c.fillStyle = rgba(mix([30, 34, 84], [60, 54, 110], r())); c.fillRect(x, B - h, w, h);
    S.add(c, () => { const wc = [[255, 200, 130], [255, 226, 180], [150, 220, 240], [255, 150, 170]][(r() * 4) | 0]; for (let yy = B - h + 5; yy < B - 4; yy += 9) for (let xx = x + 3; xx < x + w - 4; xx += 7) if (r() < 0.4) { c.fillStyle = rgba(wc, 0.5 + r() * 0.5); c.fillRect(xx, yy, 3.4, 4.4); } });
  }
  S.add(c, () => { for (let i = 0; i < 70; i++) glow(c, -PAD + r() * BW, B - 3 - r() * 6, 9 + r() * 10, [255, 206, 140], 0.7); S.rgrad(c, 700, B, 620, [[0, [255, 170, 140], 0.4], [1, [255, 170, 140], 0]], 0.3); });
}));
const PIER = S.lazy(() => S.bake(1100, 500, c => {
  const ox = 200, r = mulberry32(3);
  for (const px of [-140, 110, 380, 640]) { const g = c.createLinearGradient(ox + px, 0, ox + px + 34, 0); g.addColorStop(0, 'rgb(70,60,84)'); g.addColorStop(1, 'rgb(22,20,40)'); c.fillStyle = g; c.fillRect(ox + px, 60, 34, 300); c.globalAlpha = 0.3; c.fillRect(ox + px + 4, 360, 26, 120); c.globalAlpha = 1; }
  S.poly(c, [[0, 62], [ox + 740, 62], [ox + 740, 96], [0, 96]]); const g1 = c.createLinearGradient(0, 62, 0, 96); g1.addColorStop(0, 'rgb(60,48,70)'); g1.addColorStop(1, 'rgb(26,22,44)'); c.fillStyle = g1; c.fill();
  S.poly(c, [[0, 20], [ox + 680, 20], [ox + 740, 62], [0, 62]]); const g = c.createLinearGradient(0, 20, 0, 62); g.addColorStop(0, 'rgb(150,124,140)'); g.addColorStop(1, 'rgb(104,84,110)'); c.fillStyle = g; c.fill();
  for (let x = 20; x < ox + 700; x += 62) { S.poly(c, [[x, 20], [x + 5, 20], [x + 5 + (x / (ox + 700)) * 56, 62], [x + (x / (ox + 700)) * 56, 62]], 'rgba(30,20,50,0.4)'); }
  const hl = c.createLinearGradient(0, 0, ox + 700, 0); hl.addColorStop(0, 'rgba(200,214,255,0.35)'); hl.addColorStop(1, 'rgba(200,214,255,0.1)'); c.fillStyle = hl; c.fillRect(0, 20, ox + 680, 5);
}));
const REED = S.lazy(() => S.bake(700, 900, c => { const r = mulberry32(6); c.filter = 'blur(6px)'; c.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const x = 60 + r() * 520, h = 360 + r() * 460, lean = (r() - 0.5) * 220; c.strokeStyle = rgba(mix([8, 12, 30], [40, 70, 100], r() * r())); c.lineWidth = 10 + r() * 12; c.beginPath(); c.moveTo(x, 900); c.quadraticCurveTo(x + lean * 0.2, 900 - h * 0.6, x + lean, 900 - h); c.stroke(); if (r() < 0.5) { c.fillStyle = 'rgb(30,28,50)'; c.beginPath(); c.ellipse(x + lean, 900 - h, 12, 54, lean / 400, 0, 6.2832); c.fill(); } } }));
const LANT = S.lazy(() => S.bake(240, 320, c => {
  c.translate(120, 160);
  c.beginPath(); c.moveTo(-76, -96); c.quadraticCurveTo(0, -142, 76, -96); c.lineTo(54, 96); c.quadraticCurveTo(0, 110, -54, 96); c.closePath();
  const g = c.createRadialGradient(0, 80, 6, 0, 10, 170); g.addColorStop(0, 'rgb(255,250,214)'); g.addColorStop(0.35, 'rgb(255,206,110)'); g.addColorStop(0.75, 'rgb(250,140,60)'); g.addColorStop(1, 'rgb(196,76,44)'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); c.fillStyle = 'rgba(160,60,30,0.2)'; for (const x of [-40, 0, 40]) c.fillRect(x - 2, -140, 4, 260); const sh = c.createLinearGradient(-80, 0, 80, 0); sh.addColorStop(0, 'rgba(120,30,20,0.3)'); sh.addColorStop(0.4, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(120,30,20,0.34)'); c.fillStyle = sh; c.fillRect(-90, -150, 180, 280); c.restore();
  c.fillStyle = 'rgb(120,50,36)'; c.beginPath(); c.ellipse(0, 100, 54, 9, 0, 0, 6.2832); c.fill();
  S.add(c, () => { glow(c, 0, 104, 44, [255, 240, 190], 1); });
}));
const RAYS = S.lazy(() => S.bake(1200, 1200, c => { c.translate(600, 600); c.filter = 'blur(14px)'; for (let k = 0; k < 12; k++) { c.rotate(Math.PI / 6 + (k % 2) * 0.1); const g = c.createLinearGradient(0, 0, 0, -580); g.addColorStop(0, 'rgba(255,236,190,0.5)'); g.addColorStop(1, 'rgba(255,236,190,0)'); c.fillStyle = g; S.poly(c, [[-10, 0], [10, 0], [50 + (k % 3) * 30, -580], [-50 - (k % 3) * 30, -580]]); c.fill(); } }));

function lantern(ctx, x, y, s, a, word, sway = 0) {
  if (a <= 0.003 || s <= 0.01) return;
  S.add(ctx, () => { glow(ctx, x, y, 330 * s, [255, 180, 90], 0.42 * a); glow(ctx, x, y + 60 * s, 150 * s, [255, 226, 160], 0.4 * a); });
  ctx.save(); ctx.translate(x, y); ctx.rotate(sway); ctx.globalAlpha *= a; ctx.drawImage(LANT(), -120 * s, -160 * s, 240 * s, 320 * s);
  if (word) [...word].forEach((ch, i) => K.text(ctx, ch, 0, (-36 + i * 84) * s, { size: 78 * s, weight: 500, color: [150, 44, 24], alpha: 0.92 }));
  ctx.restore();
}
function world(ctx, t, C, o = {}) {
  const { aur = 0, lan = 0 } = o;
  ctx.fillStyle = 'rgb(5,9,30)'; ctx.fillRect(0, 0, W, H);
  const far = img => { ctx.save(); S.cam(ctx, C, 0.3); img(); ctx.restore(); };
  far(() => { ctx.drawImage(SKY(), -PAD, -PAD); S.moon(ctx, MOON[0], MOON[1], 78, t); ctx.drawImage(FAR(), -PAD, HY - FARH + 2); });
  // 湖面：底色 + 对岸倒影（切成横条按水波错开）+ 月光路
  ctx.save(); S.cam(ctx, C, 0.3);
  S.vgrad(ctx, [[0, [150, 112, 150]], [0.06, [70, 70, 136]], [0.3, [26, 36, 92]], [1, [8, 12, 40]]], HY, HY + 1500, -PAD * 2, W + PAD * 2);
  const img = FAR(), SL = 10;
  for (let k = 0; k < 30; k++) { const yy = k * SL, a = 0.6 * (1 - k / 30); ctx.globalAlpha = a; ctx.drawImage(img, 0, FARH - (yy + SL) * 1.3, BW, SL * 1.3, -PAD + Math.sin(t * 1.1 + k * 0.7) * (1 + k * 0.5), HY + yy, BW, SL + 0.6); }
  ctx.globalAlpha = 1;
  S.add(ctx, () => { for (let k = 0; k < 16; k++) { const yy = HY + 14 + k * k * 2.2, w = 50 + k * 16; S.rgrad(ctx, MOON[0] + Math.sin(t * 0.8 + k * 1.3) * (6 + k * 2.5), yy, w, [[0, [236, 232, 220], 0.4 - k * 0.018], [1, [236, 232, 220], 0]], 0.12); } });
  ctx.restore();
  return {};
}
// 水面一道道横向的波光（主体平面之下）
function shimmer(ctx, t, c, a) { S.add(ctx, () => { for (let i = 0; i < 22; i++) { const y = PY + 60 + hash(i * 3.7) * 520, x = hash(i * 8.1) * W + Math.sin(t * 0.5 + i) * 40, w = 90 + hash(i * 1.9) * 200; S.rgrad(ctx, x, y, w, [[0, c, a * (0.4 + 0.6 * Math.sin(t * 0.9 + i * 2) ** 2)], [1, c, 0]], 0.05); } }); }
const LIGHT = [-400, 100];   // 月光方向
function herL(ctx, x, y, s, o, flip, extra = {}) {
  ctx.save(); if (flip) { ctx.translate(2 * x, 0); ctx.scale(-1, 1); }
  const R = S.lit(ctx, c => infp(c, x, y, s, o), { light: flip ? [2 * x - LIGHT[0], LIGHT[1]] : LIGHT, at: [x, y - 290 * s], r: 340 * s, warm: [220, 230, 255], cool: [14, 16, 54], k: 0.9, ...extra });
  ctx.restore();
  if (flip) for (const k in R) R[k] = [2 * x - R[k][0], R[k][1]];
  return R;
}
function flowerG(ctx, x, y, r, c, a) {
  if (a <= 0.003) return; S.add(ctx, () => glow(ctx, x, y, r * 3.6, c, 0.5 * a));
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
  for (let k = 0; k < 5; k++) { ctx.rotate(6.2832 / 5); const g = ctx.createRadialGradient(0, 0, 0, 0, -r * 0.6, r); g.addColorStop(0, 'rgb(255,252,240)'); g.addColorStop(1, rgba(c)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r * 0.6, r * 0.42, r * 0.62, 0, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = 'rgb(255,224,130)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.24, 0, 6.2832); ctx.fill(); ctx.restore();
}
function heart(ctx, x, y, s, a) {
  if (a <= 0.003) return; S.add(ctx, () => { glow(ctx, x, y, 240 * s, [255, 120, 150], 0.5 * a); });
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  // 钩子：心下面露出来的那一截
  ctx.lineCap = 'round'; ctx.strokeStyle = 'rgb(60,66,90)'; ctx.lineWidth = 15; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, 96); ctx.arc(-26, 96, 26, 0, Math.PI * 0.9); ctx.stroke();
  ctx.strokeStyle = 'rgb(206,216,240)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, 96); ctx.arc(-26, 96, 26, 0, Math.PI * 0.9); ctx.stroke();
  const g = ctx.createRadialGradient(-22, -30, 4, 0, 0, 96); g.addColorStop(0, 'rgb(255,226,230)'); g.addColorStop(0.4, 'rgb(255,120,150)'); g.addColorStop(1, 'rgb(214,50,96)'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(0, 62); ctx.bezierCurveTo(-96, 0, -80, -84, -34, -76); ctx.bezierCurveTo(-14, -74, 0, -56, 0, -44); ctx.bezierCurveTo(0, -56, 14, -74, 34, -76); ctx.bezierCurveTo(80, -84, 96, 0, 0, 62); ctx.fill();
  ctx.restore();
}
function crystal(ctx, x, y, s, a, t) {
  if (a <= 0.003) return; S.add(ctx, () => { glow(ctx, x, y, 150 * s, [110, 170, 255], 0.5 * a); });
  ctx.save(); ctx.translate(x, y + Math.sin(t * 1.4) * 5); ctx.scale(s, s); ctx.globalAlpha *= a;
  const P = [[0, -60], [36, 0], [0, 60], [-36, 0], [8, -4]];
  [[0, 1, 4, [200, 228, 255]], [0, 4, 3, [140, 190, 250]], [4, 1, 2, [90, 140, 230]], [3, 4, 2, [60, 100, 200]]].forEach(([a0, b0, c0, col]) => S.poly(ctx, [P[a0], P[b0], P[c0]], rgba(col)));
  ctx.restore();
}
// 极光：从 (ox) 往两边铺开的三道光幕
function aurora(ctx, t, u, ox) {
  if (u <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  [[[255, 110, 150], 430, 300, 0], [[255, 196, 110], 560, 360, 2.1], [[190, 120, 255], 300, 260, 4.2]].forEach(([c, y0, hh, ph], j) => {
    for (let x = -80; x < W + 80; x += 12) {
      const d = Math.abs(x - ox) / 1000, rv = smooth(prog(u, d * 0.75 + j * 0.06, d * 0.75 + 0.3 + j * 0.06)); if (rv <= 0.01) continue;
      const yb = y0 + 70 * Math.sin(x * 0.006 + t * 0.35 + ph) + 40 * Math.sin(x * 0.013 - t * 0.2 + ph), ray = 0.55 + 0.45 * Math.sin(x * 0.045 + t * 0.6 + ph * 3) * Math.sin(x * 0.017 - t * 0.3), h = hh * (0.6 + 0.4 * ray) * rv;
      const g = ctx.createLinearGradient(0, yb - h, 0, yb + 70); g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.7, rgba(c, 0.09 * rv * (0.5 + 0.5 * ray))); g.addColorStop(0.86, rgba(mix(c, [255, 255, 255], 0.3), 0.13 * rv * (0.5 + 0.5 * ray))); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.fillRect(x - 18, yb - h, 36, h + 70);
    }
  });
  ctx.restore();
}
const FARL = Array.from({ length: 130 }, (_, i) => ({ x: -200 + hash(i * 3.1) * (W + 400), dl: hash(i * 7.3) * 4.5 + (hash(i * 1.7) < 0.3 ? 0 : 0.8), sp: 26 + hash(i * 5.9) * 46, s: 0.07 + Math.pow(hash(i * 9.7), 2) * 0.24, sw: hash(i * 2.3) * 6.28 }));
const BIG = [{ word: '理想', to: [300, 470], s: 1.0 }, { word: '自由', to: [650, 330], s: 1.08 }, { word: '热爱', to: [880, 560], s: 0.96 }];

function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  const lanU = t - T.b10, aur = prog(t, T.feel - 0.15, T.far + 1.0);
  world(ctx, t, C);
  // 远处的天灯（对岸升起）+ 倒影
  if (lanU > -0.3) { ctx.save(); S.cam(ctx, C, 0.3);
    for (const l of FARL) { const age = lanU + 0.3 - l.dl; if (age <= 0) continue; const y = HY - 10 - age * l.sp - 30 * (1 - Math.exp(-age)), a = smooth(prog(age, 0, 0.8)) * (1 - 0.5 * smooth(aur)), x = l.x + Math.sin(t * 0.5 + l.sw) * 14 + age * 5;
      if (y < -200) continue; S.add(ctx, () => { glow(ctx, x, y, 150 * l.s * 2, [255, 170, 80], 0.5 * a); glow(ctx, x, 2 * HY - y + 8, 110 * l.s * 2, [255, 170, 80], 0.2 * a); });
      ctx.globalAlpha = a; ctx.drawImage(LANT(), x - 120 * l.s, y - 160 * l.s, 240 * l.s, 320 * l.s); ctx.globalAlpha = 1; }
    ctx.restore(); }
  // 极光（在天上，远层）
  if (aur > 0) { ctx.save(); S.cam(ctx, C, 0.3); aurora(ctx, t, aur, 430); S.add(ctx, () => { for (let k = 0; k < 6; k++) S.rgrad(ctx, 100 + k * 190, HY + 120 + (k % 2) * 90, 420, [[0, k % 2 ? [255, 130, 160] : [255, 196, 120], 0.2 * smooth(aur)], [1, [255, 150, 150], 0]], 0.2); }); ctx.restore(); }
  ctx.save(); S.cam(ctx, C, 1);
  // 水雾
  S.add(ctx, () => { for (let i = 0; i < 5; i++) S.rgrad(ctx, 100 + i * 250 + Math.sin(t * 0.2 + i * 2) * 60, HY + 70 + (i % 2) * 50, 380, [[0, [170, 170, 230], 0.12], [1, [170, 170, 230], 0]], 0.16); });
  shimmer(ctx, t, [200, 210, 255], 0.2);
  // ---- B07（2026-11-15 反馈 02 重做）：水里的倒影 ----
  //   她走到栈桥尽头低头看：水里的倒影胸口有一颗星（她想成为的那个自己）。她俯身去碰 —— 指尖一碰水面，倒影碎成一片片金色波光，
  //   顺着月光路漂远，在更远的水面重新聚成一个更小的她；再伸手，又碎、又漂得更远，最后只剩天边水面上的一点金光 —— 永远在追
  const g7 = K.vis(t, T.in, T.b08 + 0.6, 0.6, 0.8);
  const step = 2 * easeInOut(prog(t, T.in + 0.1, T.b07 + 0.5));
  const t1 = T.b07 + 1.0, t2 = T.ever + 0.35;
  const RP = [[800, PY + 84, 0.9], [950, 1104, 0.55], [850, 1030, 0.32]];
  const sc1 = prog(t, t1, t1 + 0.55), rf1 = prog(t, t1 + 0.4, t1 + 1.0), sc2 = prog(t, t2, t2 + 0.55), rf2 = prog(t, t2 + 0.4, t2 + 1.05);
  draw.REFL = () => {
    if (g7 <= 0.003) return;
    const refl = (x, y, s, al, scat) => {
      if (al <= 0.01) return; const hgt = 590 * s, rows = Math.ceil(hgt / (9 * Math.max(0.4, s * 2)));
      S.add(ctx, () => { S.rgrad(ctx, x, y + hgt * 0.5, hgt * 0.7, [[0, [255, 206, 120], 0.16 * al * (1 - scat)], [1, [255, 206, 120], 0]], 1.3); });
      for (let k = 0; k < rows; k++) { const u = k / rows, ry = y + u * hgt, rh = hgt / rows + 0.7, dx = Math.sin(t * 2.2 + k * 0.7) * (2 + u * 9) * (s * 2) + scat * (hash(k * 3.7) - 0.3) * 520 * (0.4 + s), a2 = al * (1 - scat) * (1 - 0.35 * u);
        if (a2 <= 0.01) continue; ctx.save(); ctx.beginPath(); ctx.rect(x - 400 + dx, ry, 800, rh); ctx.clip(); ctx.translate(dx, 2 * y); ctx.scale(1, -1); infp(ctx, x, y, s, { t, a: a2, flies: 0, spin: t * 2, eyes: 'happy' }); ctx.restore(); }
      // 胸口那颗星 + 一身金色的波光
      const cy = y + 0.37 * 590 * s; S.add(ctx, () => { glow(ctx, x - 6 * s, cy, 70 * s, [255, 226, 150], 0.7 * al * (1 - scat)); glow(ctx, x - 6 * s, cy, 22 * s, [255, 255, 240], al * (1 - scat)); for (let k = 0; k < 6; k++) S.rgrad(ctx, x + Math.sin(t * 1.6 + k * 1.3) * 30 * s, y + (0.1 + k * 0.16) * hgt, 170 * s, [[0, [255, 214, 130], 0.12 * al * (1 - scat)], [1, [255, 214, 130], 0]], 0.1); });
    };
    refl(...RP[0], g7 * (1 - smooth(sc1)), smooth(sc1));
    refl(...RP[1], g7 * smooth(rf1) * (1 - smooth(sc2)), Math.max(1 - smooth(rf1), smooth(sc2)) * 0.9);
    refl(...RP[2], g7 * smooth(rf2), (1 - smooth(rf2)) * 0.9);
    // 碎开的波光顺着水面漂向下一处
    [[sc1, rf1, 0], [sc2, rf2, 1]].forEach(([sc, rf, i]) => { const u = prog(t, (i ? t2 : t1), (i ? t2 : t1) + 1.05); if (u <= 0 || u >= 1) return; const A = RP[i], B = RP[i + 1];
      S.add(ctx, () => { for (let k = 0; k < 16; k++) { const v = clamp(u * 1.5 - hash(k * 2.3) * 0.5), e = easeInOut(v), px = lerp(A[0], B[0], e) + Math.sin(k * 1.9 + t * 3) * 40 * Math.sin(e * Math.PI), py = lerp(A[1] + 120 * A[2] * 2 * hash(k * 5.1), B[1] + 60 * B[2] * 2 * hash(k * 5.1), e); S.rgrad(ctx, px, py, 46 * lerp(A[2], B[2], e) * 2 + 10, [[0, [255, 226, 150], 0.8 * Math.sin(Math.PI * v) * g7], [1, [255, 226, 150], 0]], 0.3); } });
      const ru = prog(t, i ? t2 : t1, (i ? t2 : t1) + 0.9); for (let j = 0; j < 3; j++) S.ring(ctx, A[0], A[1] + 8, (20 + ru * 300 * (0.5 + A[2])) * (1 - j * 0.25), 11, [255, 226, 160], 0.6 * (1 - ru) * g7, 0.24); });
    // 最远处那一点金光留在水面上
    if (rf2 > 0.5) S.add(ctx, () => { const tw = 0.8 + 0.2 * Math.sin(t * 1.2); glow(ctx, RP[2][0], RP[2][1] + 60, 110 * tw, [255, 214, 130], 0.3 * g7 * smooth(rf2)); });
  };
  if (t >= t1) draw.REFL();        // 漂远以后在栈桥后面
  // ---- 栈桥 ----
  ctx.drawImage(PIER(), -200, PY - 20);
  if (t < t1) draw.REFL();         // 一开始就在桥头脚下
  // ---- B08：朋友、花、钓上来的心 ----
  const f8 = K.vis(t, T.b08 - 0.1, T.b09 - 0.2, 0.3, 0.5), give = prog(t, T.b08 + 0.2, T.also - 0.2), bait = prog(t, T.also - 0.15, T.b09 - 0.3), baitOut = smooth(prog(t, T.b09 - 0.5, T.b09 + 0.1));
  const face8 = t > T.b08 - 0.15 && t < T.also + 0.1;      // 这段她朝左（面向朋友）
  const hx = lerp(430, 640, step / 2) - 110 * smooth(prog(t, T.w[2] + 0.2, T.b10 + 1.2));
  if (f8 > 0.003) {
    const sl = (1 - easeOut(prog(t, T.b08 - 0.1, T.b08 + 0.9))) * -560;
    const F1 = S.lit(ctx, c => MB.person(c, 'enfj-female', 320 + sl, PY, 2.05, { a: f8, bob: Math.abs(Math.sin(t * 5)) * 6 }), { light: LIGHT, at: [320, PY - 250], r: 320, warm: [220, 230, 255], k: 0.8 });
    const F2 = S.lit(ctx, c => MB.person(c, 'esfp-male', 130 + sl, PY, 2.0, { a: f8, bob: Math.abs(Math.sin(t * 5 + 1)) * 6 }), { light: LIGHT, at: [130, PY - 250], r: 320, warm: [220, 230, 255], k: 0.8 });
    draw.F = [F1.chest, F2.chest];
  }
  // ---- 她 ----
  const b9 = smooth(prog(t, T.b09 - 0.3, T.b09 + 0.4)), open = smooth(prog(t, T.b10 + 0.2, T.b10 + 1.2)) * (1 - smooth(prog(t, T.b11 - 0.3, T.b11 + 0.5))), soul = prog(t, T.soul - 0.2, T.b11), b11 = smooth(prog(t, T.b11 - 0.2, T.b11 + 0.6));
  const reach7 = 0, rd = K.vis(t, T.b07 - 0.2, t1 + 0.6, 0.5, 0.5), rfar = K.vis(t, t2 - 0.5, T.b08 - 0.3, 0.45, 0.5);
  const bu = clamp(bait), grab = smooth(prog(bu, 0.45, 0.8));
  const hold = t > T.b09 - 0.4 && t < T.w[2] + 0.1 ? 1 : 0;
  const o = { t, spin: t * (1.6 + 9 * open), flap: 0,
    eyes: aur > 0.1 || open > 0.5 || (give > 0.5 && bait <= 0) ? 'happy' : bait > 0.2 && bait < 1 ? 'wide' : 'open',
    mouth: bait > 0.2 && baitOut < 0.5 ? 'o' : 'smile', look: [1.2, -0.8 * (grab + open) + 1.6 * (rd + 0.5 * rfar)], tilt: -0.3 * (grab + open) + 0.2 * b11 * (1 - smooth(aur)),
    ra: 0.75 * smooth(prog(t, t1 - 0.5, t1)) * rd - 0.35 * rfar - 1.0 * grab * (1 - baitOut) - 0.6 * open - 0.35 * hold, la: -0.45 * smooth(prog(give, 0.5, 0.9)) * (1 - smooth(bu)) - 0.9 * open - 0.5 * hold - 0.55 * b11,
    wind: !(hold), lean: 0.2 * rd + 0.08 * rfar, nod: 2.2 * rd + 0.8 * rfar, tilt: 0 };
  const hop = Math.abs(Math.sin(prog(bu, 0.5, 1) * Math.PI * 2)) * 16 * (bait > 0 && baitOut < 1 ? 1 : 0) + Math.abs(Math.sin(open * Math.PI * 3)) * 10 * (open < 1 ? 1 : 0);
  S.add(ctx, () => S.rgrad(ctx, hx, PY + 6, 200, [[0, [190, 210, 255], 0.16], [1, [190, 210, 255], 0]], 0.14));
  const warmK = Math.max(smooth(prog(give, 0.6, 1)) * (1 - b9) * 0.6, b9 * 0.8, smooth(aur));
  const R = herL(ctx, hx, PY - hop, 1.0, o, face8, warmK > 0.2 ? { warm: [255, 214, 160], light: [hx + 200, 300] } : {});
  // 朋友递来的花：飞到她胸口
  if (f8 > 0.003 && draw.F) draw.F.forEach((p, i) => { const u = prog(give, 0.1 + i * 0.22, 0.6 + i * 0.22), e = easeInOut(u); if (u <= 0) { flowerG(ctx, p[0] + 60, p[1] - 30, 30, i ? [255, 206, 130] : [255, 150, 180], f8); return; }
    const fx = lerp(p[0] + 60, R.chest[0] - 26 + i * 40, e), fy = lerp(p[1] - 30, R.chest[1] + 4, e) - Math.sin(e * Math.PI) * 120; flowerG(ctx, fx, fy, 30 + 6 * Math.sin(e * Math.PI), i ? [255, 206, 130] : [255, 150, 180], f8 * (1 - 0.0 * e)); });
  const cg = smooth(prog(give, 0.55, 1)) * f8 * (1 - 0.5 * smooth(bu));
  if (cg > 0.01) S.add(ctx, () => { glow(ctx, R.chest[0], R.chest[1], 300 * cg, [255, 200, 150], 0.45 * cg); const ph = (t * 0.9) % 1; S.ring(ctx, R.chest[0], R.chest[1], 60 + ph * 200, 24, [255, 200, 160], 0.35 * (1 - ph) * cg); });
  // 小船 + 钓竿 + 心（上钩）
  if (bait > 0 && baitOut < 1) {
    const ba = smooth(prog(bait, 0, 0.15)) * (1 - baitOut), bx = 1080 + (1 - easeOut(prog(bait, 0, 0.3))) * 200 + baitOut * 240, by = PY + 90 + Math.sin(t * 1.2) * 5;
    ctx.save(); ctx.globalAlpha = ba;
    S.poly(ctx, [[bx - 170, by - 46], [bx + 170, by - 46], [bx + 120, by + 14], [bx - 130, by + 14]]); const bg = ctx.createLinearGradient(0, by - 46, 0, by + 14); bg.addColorStop(0, 'rgb(40,36,70)'); bg.addColorStop(1, 'rgb(14,14,34)'); ctx.fillStyle = bg; ctx.fill();
    MB.person(ctx, 'entp-male', bx + 20, by - 30, 1.7, { flip: true, dim: 0.72, shadow: 0 });
    const tip = [bx - 330, by - 640 + Math.sin(t * 2) * 6], hx2 = lerp(tip[0] + 10, R.rh[0] + 40, 0) , drop = easeOut(prog(bait, 0.1, 0.5)), hy2 = lerp(tip[1] - 40, R.top[1] - 150, drop) + Math.sin(t * 2.4) * 10 - 40 * grab;
    ctx.strokeStyle = 'rgb(30,30,56)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(bx - 40, by - 250); ctx.quadraticCurveTo(bx - 200, by - 520, tip[0], tip[1]); ctx.stroke();
    const bxh = tip[0] - 20 + Math.sin(t * 1.7) * 14;
    ctx.strokeStyle = 'rgba(220,226,255,0.75)'; ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(tip[0], tip[1]); ctx.quadraticCurveTo(tip[0] - 30, (tip[1] + hy2) / 2, bxh, hy2 - 60); ctx.stroke();
    ctx.restore();
    heart(ctx, bxh, hy2, 1.0 + 0.08 * Math.sin(t * 5), ba);
    if (bait > 0.5) S.add(ctx, () => { const tw = Math.pow(Math.max(0, Math.sin((bait - 0.5) * 9)), 6); glow(ctx, bxh - 34, hy2 + 122, 60 * tw, [255, 255, 255], tw * ba); });
  }
  // ---- B09：三盏天灯 ----
  BIG.forEach((b, i) => {
    const t0 = T.w[i], app = smooth(prog(t, i === 0 ? T.b09 - 0.2 : T.w[i - 1] + 0.12, i === 0 ? T.b09 + 0.5 : T.w[i - 1] + 0.42)); if (app <= 0) return;
    const fly = prog(t, t0, t0 + 2.6), e = easeOut(fly), drift = Math.max(0, t - t0 - 2.6);
    const hxh = R.rh[0] + 110, hyh = R.rh[1] - 110;
    const x = lerp(hxh, b.to[0], easeInOut(fly)) + Math.sin(t * 0.7 + i * 2) * 14 * e, y = lerp(hyh, b.to[1], e) - drift * 16;
    lantern(ctx, x, y, lerp(0.56, b.s, e) * (0.3 + 0.7 * app), app * (1 - 0.45 * smooth(aur)), b.word, Math.sin(t * 0.9 + i) * 0.05 * e);
  });
  // ---- B10：触动灵魂 —— 胸口的光一圈圈荡开 ----
  if (soul > 0 && b11 < 1) { const a = smooth(prog(soul, 0, 0.25)) * (1 - b11), [cx, cy] = R.chest; S.add(ctx, () => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.12); ctx.globalAlpha = 0.5 * a; ctx.drawImage(RAYS(), -700, -700, 1400, 1400); ctx.restore(); glow(ctx, cx, cy, 190, [255, 210, 150], 0.3 * a); });
    for (let k = 0; k < 3; k++) { const ph = (t * 0.45 + k / 3) % 1; S.ring(ctx, cx, cy, 60 + ph * 520, 34, [255, 214, 150], 0.4 * (1 - ph) * a); } }
  // ---- B11：晶体（理性）和极光（感性） ----
  if (b11 > 0.01) { const [cx, cy] = R.chest; crystal(ctx, R.lh[0] - 26, R.lh[1] - 84, 1.0 - 0.25 * smooth(aur), b11, t);
    const hu = smooth(prog(t, T.feel - 0.35, T.feel + 0.5)); if (hu > 0) { S.add(ctx, () => { glow(ctx, cx, cy, 200 + 260 * hu, [255, 140, 150], 0.3 * hu); glow(ctx, cx, cy, 90, [255, 226, 200], 0.45 * hu); });
      for (let k = 0; k < 5; k++) { const pts = Array.from({ length: 30 }, (_, q) => { const s = q / 29; return [cx + (k - 2) * 190 * s + Math.sin(s * 5 + t * 1.3 + k) * 40 * s, cy - s * (700 + k * 40) * smooth(aur * 1.6)]; }); S.ribbon(ctx, pts, s => 12 + 60 * s, [[255, 110, 150], [255, 180, 100], [210, 120, 255]][k % 3], 0.22 * hu * (1 - 0.5 * smooth(prog(aur, 0.6, 1))), 1); } } }
  ctx.restore();
  // 前景：右下角虚化的芦苇
  ctx.save(); S.cam(ctx, C, 1.5); ctx.globalAlpha = 1 - K.vis(t, T.in - 1, T.ever + 0.6, 0.01, 0.8); ctx.translate(840, 1330); ctx.rotate(Math.sin(t * 0.6) * 0.015); ctx.drawImage(REED(), 0, 0); ctx.restore();
  ctx.save(); S.cam(ctx, C, 1.7); ctx.translate(-330, 1260); ctx.rotate(-Math.sin(t * 0.5) * 0.015); ctx.drawImage(REED(), 0, 0); ctx.restore();
  S.petals(ctx, t, { n: 16, seed: 14, dir: [-0.6, 0.5], speed: 150, a: (1 - smooth(prog(t, T.b07, T.b07 + 3))) + 0.7 * open, c: [255, 170, 196], c2: [255, 232, 226], size: 18, box: [-100, 0, W + 100, 1400] });
  return { C };
}
function over(ctx, t, a) {}
module.exports = { draw, over, T };
