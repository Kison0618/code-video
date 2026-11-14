'use strict';
// PWG1「夜山坡」：A01–A09 开头（全组一个场景，镜头推拉；结尾镜头升上山顶 → PWG2 的山崖）
//   场景：一轮很大的月亮（主光源）压在山坡后面，她站在坡顶正好在月亮前；远山两层 + 天边城市的光霾 + 云；坡上有散步的小路，前景虚化的树枝和草
//   A01 悬念：她只是月亮前的一个黑剪影。一圈圈柔光从她胸口荡出去，扫到坡上散步的人，对方胸口就亮起同样的光、同样的节拍 —— 共情
//   A02 六眼：推近，剪影上一双冰蓝的眼睛亮起来；再拉开，每个路人身上都裹着一团有体积的情绪光焰：怒=红、丧=蓝、乐=黄、慌=紫
//   A03 你能猜出来吗：只留剪影和那双眼睛；之后 2.6 秒静场，起风、云散、月光越来越亮
//   A04 揭晓：月光从头到脚把她照出颜色，蝴蝶落到发边，脚下的花一朵朵开（看起来很美好）
//   A05 理想主义 / 安静随和：她闭眼微笑，风车慢慢转，全景像一张海报
//   A06–A07 本质上：七个「内在的她」一个接一个从她身体里走出来，各演各的 —— 敏感（一片花瓣落下就荡开一大圈涟漪）、感性（心口发烫掉眼泪）、社恐（缩到她身后只露半张脸）、
//           矛盾（一个身体朝两边）、内耗（一圈念头绕着头转）、傲娇（扭头哼）、拧巴（身子拧成麻花）
//   A08 仍然值得喜爱：七个她全部走回来、融进她身体里，暖光从脚下升起，满坡花开
//   A09 片名：她举起风车一吹，风卷着花瓣在夜空里聚成「INFP」
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const CL = require('./PWS_cliff');
const { K, C: LC, GOLD, LIME, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const PAD = 260, MOON = [590, 640], MR = 300, HER = [540, 1262], ICE = [140, 214, 255];
const T = { a01: vs('A01'), emp: at('A01', '共情'), a02: vs('A02'), six: at('A02', '六眼'), sense: at('A02', '感知'), a03: vs('A03'), a03e: ve('A03'), a04: vs('A04'), nice: at('A04', '美好'), a05: vs('A05'), calm: at('A05', '安静'), a06: vs('A06'),
  w: [at('A06', '敏感'), at('A06', '感性'), at('A06', '社恐'), at('A06', '矛盾'), at('A07', '内耗'), at('A07', '傲娇'), at('A07', '拧巴')], a08: vs('A08'), love: at('A08', '值得'), a09: vs('A09'), title: at('A09', '介绍'), a09e: ve('A09'), up: vs('B01') - 1.15 };
const CAM = [
  [0, { x: 0, y: -40, z: 1.16, ax: 540, ay: 1000 }], [T.a02 - 0.2, { x: 0, y: -20, z: 1.0 }], [T.six + 0.5, { x: 16, y: -165, z: 2.3 }], [T.sense, { x: 16, y: -165, z: 2.36 }], [T.sense + 1.0, { x: 0, y: -10, z: 0.96 }], [T.a03, { x: 0, y: -10, z: 0.98 }],
  [T.a03e + 0.6, { x: 6, y: -120, z: 1.36 }], [T.a04 - 0.2, { x: 6, y: -130, z: 1.44 }], [T.a04 + 1.6, { x: 0, y: -60, z: 1.2 }], [T.a05 + 0.8, { x: 0, y: -10, z: 0.94 }], [T.a06 - 0.2, { x: 0, y: -10, z: 0.98 }], [T.a06 + 1.0, { x: 0, y: 0, z: 1.0 }], [T.a08, { x: 0, y: 0, z: 1.02 }],
  [T.a08 + 1.6, { x: 0, y: -80, z: 1.3 }], [T.a09, { x: 0, y: -80, z: 1.32 }], [T.title, { x: 0, y: 30, z: 0.9 }], [T.up, { x: 0, y: 30, z: 0.88 }], [T.up + 1.0, { x: 0, y: -700, z: 0.9 }, easeIn],
];
// ---------- 场景预渲 ----------
const SKY = S.lazy(() => S.bake(W + PAD * 2, H + PAD * 2, c => {
  c.translate(PAD, PAD);
  S.vgrad(c, [[0, [4, 6, 22]], [0.3, [12, 18, 54]], [0.5, [30, 34, 90]], [0.62, [70, 56, 116]], [0.7, [128, 86, 120]], [1, [40, 34, 70]]], -PAD, 1500, -PAD, W + PAD);
  S.stars(c, 13, [-PAD, -PAD, W + PAD, 900], 170, 0.9);
  S.clouds(c, 27, [-200, 240, W + 200, 430], 4, [140, 150, 220], 0.1, [200, 460]);
}));
const HILLS = S.lazy(() => S.bake(W + PAD * 2, H + PAD * 2, c => {
  c.translate(PAD, PAD);
  S.mountain(c, S.ridge(17, -PAD, W + PAD, 1100, 240, 120), 1500, [80, 78, 146], [46, 48, 108], { facet: 0.5 });
  S.add(c, () => { S.rgrad(c, 150, 1090, 520, [[0, [255, 170, 130], 0.3], [1, [255, 170, 130], 0]], 0.3); const r = mulberry32(3); for (let k = 0; k < 90; k++) glow(c, -100 + r() * 520, 1060 + r() * 50, 5 + r() * 6, [255, 206, 140], 0.7); });
  S.vgrad(c, [[0, [140, 104, 150], 0], [1, [140, 104, 150], 0.5]], 900, 1140, -PAD, W + PAD);
  S.mountain(c, S.ridge(29, -PAD, W + PAD, 1160, 150, 110, 1.4), 1500, [52, 60, 120], [26, 32, 80], { facet: 0.55 });
  S.vgrad(c, [[0, [110, 96, 150], 0], [1, [110, 96, 150], 0.4]], 1000, 1200, -PAD, W + PAD);
}));
// 近处的山坡：坡顶在画面中间（她站的地方），向两边落下去；低多边形草坡 + 小路
const crest = x => 1262 + Math.pow(Math.abs(x - 540) / 600, 1.7) * 150 + (x < 540 ? 30 * Math.sin(x * 0.006) : 0);
const HILL = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, -900); const r = mulberry32(8), top = []; for (let x = -PAD; x <= W + PAD; x += 60) top.push([x, crest(x)]);
  S.poly(c, [...top, [W + PAD, 2900], [-PAD, 2900]], 'rgb(16,30,44)');
  c.save(); S.poly(c, [...top, [W + PAD, 2900], [-PAD, 2900]]); c.clip();
  const V = []; for (let j = 0; j < 9; j++) for (let i = 0; i < 12; i++) V.push([-PAD + i * 150 + (r() - 0.5) * 90, 1240 + j * 100 + (r() - 0.5) * 50]);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 11; i++) { const a = V[j * 12 + i], b = V[j * 12 + i + 1], d = V[(j + 1) * 12 + i], e = V[(j + 1) * 12 + i + 1]; for (const tri of [[a, b, d], [b, e, d]]) { const k = clamp(0.5 - j * 0.07 + (r() - 0.5) * 0.24 - Math.abs(i - 5.5) * 0.03); S.poly(c, tri, rgba(mix([10, 20, 36], [60, 124, 110], k))); } }
  // 月光勾在坡顶
  const g = c.createLinearGradient(0, 1250, 0, 1420); g.addColorStop(0, 'rgba(190,220,255,0.3)'); g.addColorStop(1, 'rgba(190,220,255,0)'); c.fillStyle = g; c.fillRect(-PAD, 1200, W + PAD * 2, 300);
  // 小路
  c.filter = 'blur(8px)'; c.fillStyle = 'rgba(190,196,230,0.14)'; c.beginPath(); c.moveTo(-PAD, 1420); c.bezierCurveTo(200, 1350, 420, 1330, 560, 1380); c.bezierCurveTo(760, 1450, 960, 1400, W + PAD, 1470); c.lineTo(W + PAD, 1530); c.bezierCurveTo(960, 1470, 760, 1520, 560, 1440); c.bezierCurveTo(420, 1390, 200, 1420, -PAD, 1500); c.fill(); c.filter = 'none';
  c.restore();
  for (let i = 0; i < 150; i++) { const x = -PAD + r() * (W + PAD * 2), y = crest(x) + 4 + (r() < 0.5 ? 0 : r() * 240), h = 14 + r() * 30, lean = (r() - 0.4) * 16, k = y - crest(x) < 8 ? 1 : 0.5; c.fillStyle = rgba(mix([40, 100, 96], [170, 230, 190], r() * 0.5 * k), 0.9); c.beginPath(); c.moveTo(x - 4, y); c.quadraticCurveTo(x + lean * 0.3, y - h * 0.6, x + lean, y - h); c.quadraticCurveTo(x + 4 + lean * 0.3, y - h * 0.5, x + 5, y); c.fill(); }
}));
const FGRASS = S.lazy(() => S.bake(W + 400, 520, c => { const r = mulberry32(19); c.filter = 'blur(7px)'; for (let i = 0; i < 46; i++) { const x = r() * (W + 400), h = 180 + r() * 300, lean = (r() - 0.4) * 200; c.fillStyle = rgba(mix([6, 12, 24], [30, 76, 80], r() * r())); c.beginPath(); c.moveTo(x - 16, 520); c.quadraticCurveTo(x + lean * 0.3, 520 - h * 0.6, x + lean, 520 - h); c.quadraticCurveTo(x + 16 + lean * 0.3, 520 - h * 0.5, x + 18, 520); c.fill(); } }));
const FLOWERS = Array.from({ length: 34 }, (_, i) => { const r = mulberry32(700 + i); let x = 60 + r() * 960; if (Math.abs(x - 540) < 110) x += x < 540 ? -130 : 130; return { x, y: crest(x) + 2 + r() * 60, r: 13 + r() * 12, c: [[255, 170, 196], [255, 226, 150], [200, 180, 255], [255, 250, 236]][i % 4], dl: Math.abs(x - 540) / 700 + r() * 0.15, h: 26 + r() * 40 }; });
function flower(ctx, f, u, t) {
  if (u <= 0.003) return; const e = easeOut(clamp(u)) * (1 + 0.2 * Math.sin(Math.min(1, u) * Math.PI)), sw = Math.sin(t * 1.2 + f.x) * 5, hx = f.x + sw, hy = f.y - f.h * e;
  ctx.strokeStyle = 'rgb(70,150,110)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.quadraticCurveTo(f.x, f.y - f.h * 0.5 * e, hx, hy); ctx.stroke();
  S.add(ctx, () => glow(ctx, hx, hy, f.r * 2 * e, f.c, 0.12 * e));
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(f.x); for (let k = 0; k < 5; k++) { ctx.rotate(6.2832 / 5); const g = ctx.createRadialGradient(0, 0, 0, 0, -f.r * 0.6 * e, f.r * e); g.addColorStop(0, rgba(mix(f.c, [255, 255, 255], 0.5))); g.addColorStop(1, rgba(mix(f.c, [120, 60, 120], 0.2))); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -f.r * 0.55 * e, f.r * 0.4 * e, f.r * 0.6 * e, 0, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = 'rgb(255,220,120)'; ctx.beginPath(); ctx.arc(0, 0, f.r * 0.22 * e, 0, 6.2832); ctx.fill(); ctx.restore();
}
// 路人：[类型, x, y, 大小, 情绪色]
const FOLK = [['istj-male', 120, 1400, 1.9, [255, 90, 70]], ['esfp-female', 960, 1430, 2.0, [255, 214, 90]], ['intp-male', 300, 1322, 1.25, [110, 150, 255]], ['isfj-female', 800, 1336, 1.3, [190, 120, 255]]];
// 有体积的情绪光焰：沿着人形往上烧的一团团柔光
function aura(ctx, x, y, s, c, a, t, seed) {
  if (a <= 0.003) return;
  S.add(ctx, () => { for (let k = 0; k < 9; k++) { const u = k / 8, ph = (t * 0.5 + hash(k * 3.1 + seed)) % 1, yy = y - (20 + u * 130 + ph * 40) * s, w = (150 - u * 60) * s * (1 - 0.4 * ph); S.rgrad(ctx, x + Math.sin(t * 1.7 + k * 1.3 + seed) * 26 * s, yy, w, [[0, mix(c, [255, 255, 255], 0.25), 0.3 * a * (1 - ph * 0.7)], [1, c, 0]], 1.25); } glow(ctx, x, y - 70 * s, 170 * s, c, 0.3 * a); });
}
// 七个内在的她：[词, 颜色, 落点 x, y, 大小]
const SELF = [
  ['敏感', [150, 220, 255], 90, 1362, 0.54], ['感性', [255, 150, 180], 232, 1318, 0.52], ['社恐', [170, 160, 210], 640, 1264, 0.74], ['矛盾', [255, 200, 120], 762, 1300, 0.5],
  ['内耗', [130, 140, 240], 1000, 1362, 0.54], ['傲娇', [255, 170, 150], 384, 1290, 0.48], ['拧巴', [120, 220, 190], 884, 1326, 0.5]];
function tinted(ctx, x, y, s, o, col, a, flip) {
  ctx.save(); if (flip) { ctx.translate(2 * x, 0); ctx.scale(-1, 1); }
  const R = S.lit(ctx, c => infp(c, x, y, s, { flies: 0, wind: false, ...o }), { at: [x, y - 280 * s], r: 330 * s, k: 0.3, tint: [col, 0.3], alpha: a });
  ctx.restore(); if (flip) for (const k in R) R[k] = [2 * x - R[k][0], R[k][1]]; return R;
}
// 片名的落点：把「INFP」渲到小画布上采样笔画像素
const titlePts = S.lazy(() => { const cv = new K.Canvas(W, 420), c = cv.getContext('2d'); K.text(c, 'INFP', W / 2, 340, { size: 250, weight: 500, spacing: 0.08, color: [255, 255, 255] }); const d = c.getImageData(0, 0, W, 420).data, pts = [], r = mulberry32(77);
  for (let y = 0; y < 420; y += 5) for (let x = 0; x < W; x += 5) if (d[(y * W + x) * 4 + 3] > 140) pts.push({ x: x + r() * 3, y: y + r() * 3, dl: (x / W) * 0.4 + r() * 0.3, cu: (r() - 0.5) * 2, up: 60 + r() * 200 }); return pts; });
function draw(ctx, t, fx = {}) {
  const C = S.camKF(t, CAM);
  const reveal = smooth(prog(t, T.a04 - 0.5, T.a04 + 0.8)), wind = smooth(prog(t, T.a03e, T.a03e + 1.2)), moonK = lerp(0.8, 1.08, reveal);
  ctx.fillStyle = 'rgb(4,6,22)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 0.1); ctx.drawImage(SKY(), -PAD, -PAD); ctx.restore();
  // 大月亮
  ctx.save(); S.cam(ctx, C, 0.3); S.moon(ctx, MOON[0], MOON[1], MR, t, [246, 240, 222], moonK);
  // 云从月亮前面移开（静场时）
  const cl = 1 - smooth(prog(t, T.a03e - 0.2, T.a04 + 0.2)); if (cl > 0.01) { for (let k = 0; k < 4; k++) S.rgrad(ctx, MOON[0] - 200 + k * 150 + (1 - cl) * (k % 2 ? 500 : -500), MOON[1] + 40 + (k % 2) * 110, 330, [[0, [20, 24, 60], 0.6 * cl], [1, [20, 24, 60], 0]], 0.36); }
  ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.4); ctx.drawImage(HILLS(), -PAD, -PAD); ctx.restore();
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(HILL(), -PAD, 900);
  // 花：揭晓时从她脚下向两边一朵朵开；A08 再开一轮（更远的）
  const bl = prog(t, T.a04 + 0.2, T.a05 + 0.6);
  FLOWERS.forEach((f, i) => flower(ctx, f, i % 2 ? prog(bl, f.dl * 0.8, f.dl * 0.8 + 0.25) : prog(t, T.love - 0.3 + f.dl * 1.2, T.love + 0.3 + f.dl * 1.2), t));
  // ---- 她 ----
  const [hx, hy] = HER;
  const calm = smooth(prog(t, T.a05, T.calm)) * (1 - smooth(prog(t, T.a06 - 0.2, T.a06 + 0.3))), back = prog(t, T.a08 - 0.1, T.love + 0.4), loved = smooth(prog(t, T.love - 0.2, T.love + 0.8));
  const blow = smooth(prog(t, T.a09 + 0.1, T.a09 + 0.8)), sil = 1 - reveal;
  const o = { t, flies: reveal > 0.6 ? 1 : 0, spin: t * (1.2 + 3 * wind + 12 * blow), eyes: sil > 0.5 ? 'closed' : calm > 0.5 || loved > 0.5 ? 'happy' : 'open', mouth: 'smile', tilt: -0.25 * blow + 0.1 * calm, look: [0.6, -0.4], ra: -0.55 * blow, la: -0.3 * loved * (1 - blow), dim: sil };
  S.add(ctx, () => { S.rgrad(ctx, hx, hy + 6, 260, [[0, [190, 214, 255], 0.12 + 0.1 * reveal], [1, [190, 214, 255], 0]], 0.16); if (loved > 0.01) { glow(ctx, hx, hy - 260, 620 * loved, [255, 200, 150], 0.34 * loved); S.rgrad(ctx, hx, hy, 520, [[0, [255, 206, 150], 0.22 * loved], [1, [255, 206, 150], 0]], 0.2); } });
  const R = S.lit(ctx, c => infp(c, hx, hy, 1.0, o), { light: loved > 0.5 ? [hx, hy + 200] : [MOON[0] + 300, MOON[1] - 300], at: [hx, hy - 290], r: 340, warm: loved > 0.5 ? [255, 220, 170] : [226, 234, 255], cool: [10, 12, 44], k: 0.9, tint: sil > 0.01 ? [[5, 7, 22], 0.9 * sil] : null });
  // A01 共情的光圈：从她胸口荡开，扫到谁谁就亮
  const e1 = K.vis(t, T.a01 - 0.2, T.six + 0.3, 0.6, 0.6);
  if (e1 > 0.003) for (let k = 0; k < 3; k++) { const ph = ((t - T.a01) * 0.42 + k / 3) % 1; if (t - T.a01 < k / 3 / 0.42 - 0.5) continue; S.ring(ctx, R.chest[0], R.chest[1], 40 + ph * 760, 40, PINK, 0.42 * (1 - ph) * e1, 0.5); }
  if (e1 > 0.003) S.add(ctx, () => glow(ctx, R.chest[0], R.chest[1], 150 + 30 * Math.sin(t * 5.3), PINK, 0.6 * e1));
  // A02 六眼
  const eye = K.vis(t, T.six - 0.25, T.a04 + 0.3, 0.3, 0.8);
  if (eye > 0.003) { const pop = 1 + 0.6 * Math.exp(-Math.max(0, t - T.six + 0.25) * 4); S.add(ctx, () => { for (const [dx, dy] of [[-17, -1], [15, 1]]) { const ex = R.eyes[0] + dx, ey = R.eyes[1] + dy; glow(ctx, ex, ey, 30 * pop, ICE, 0.7 * eye); ctx.save(); ctx.translate(ex, ey); ctx.scale(1.4, 0.8); glow(ctx, 0, 0, 11 * pop, [236, 250, 255], eye); ctx.restore(); ctx.save(); ctx.translate(ex, ey); ctx.scale(3.4, 0.3); glow(ctx, 0, 0, 16, ICE, 0.45 * eye); ctx.restore(); } }); }
  // 路人 + 情绪光焰
  const fa = 1 - smooth(prog(t, T.a03e + 0.3, T.a04));
  if (fa > 0.003) FOLK.forEach(([key, x, y, s, col], i) => {
    const wx = x + Math.sin(t * 0.25 + i * 2) * 26, au = smooth(prog(t, T.sense - 0.1 + i * 0.12, T.sense + 0.5 + i * 0.12)) * fa;
    aura(ctx, wx, y, s, col, au, t, i * 7);
    const P = MB.person(ctx, key, wx, y, s, { a: fa, dim: 0.82 - 0.3 * au, flip: i % 2 === 1, bob: Math.abs(Math.sin(t * 2.4 + i)) * 4 });
    const d = Math.hypot(P.chest[0] - R.chest[0], P.chest[1] - R.chest[1]), hit = [0, 1, 2].reduce((m, k) => { const ph = ((t - T.a01) * 0.42 + k / 3) % 1; return Math.max(m, t - T.a01 < k / 3 / 0.42 - 0.5 ? 0 : Math.exp(-Math.pow((40 + ph * 760 - d) / 110, 2))); }, 0);
    if (e1 > 0.003) S.add(ctx, () => glow(ctx, P.chest[0], P.chest[1], 60 * s, PINK, (0.25 + 0.6 * hit) * e1 * fa));
  });
  // ---- A06–A07 七个内在的她：一个个走出来；A08 走回去 ----
  SELF.forEach(([word, col, sx, sy, ss], i) => {
    const u = prog(t, T.w[i] - 0.35, T.w[i] + 0.35), bk = easeInOut(clamp(back * 1.6 - i * 0.07)); if (u <= 0 || bk >= 1) return;
    const e = easeOut(u) * (1 - bk), x = lerp(hx, sx, e), y = lerp(hy, sy, e) - Math.sin(e * Math.PI) * 50, s = lerp(1.0, ss, e), a = smooth(prog(u, 0, 0.3)) * (1 - smooth(prog(bk, 0.6, 1))), age = t - T.w[i];
    let oo = { t: t + i, eyes: 'open', mouth: 'flat' }, flip = sx > 540;
    if (i === 0) oo = { ...oo, eyes: 'wide', mouth: 'o', lean: 0.04 * Math.sin(t * 20) * Math.exp(-((age % 1.6)) * 3) };
    if (i === 1) oo = { ...oo, eyes: 'sad', la: -0.6, tilt: 0.4 };
    if (i === 2) { oo = { ...oo, eyes: 'wide', tilt: 0.4, lean: -0.06 }; flip = false; }
    if (i === 4) oo = { ...oo, eyes: 'closed', tilt: 0.5, la: -0.9, ra: -0.6, dim: 0.3 };
    if (i === 5) oo = { ...oo, eyes: 'closed', mouth: 'smile', tilt: -0.9, nod: -0.5, la: 0.3 };
    if (i === 6) oo = { ...oo, eyes: 'sad', lean: 0.12 * Math.sin(t * 3.2), tilt: 0.6 * Math.sin(t * 3.2 + 1), la: -0.5, ra: -0.4 };
    S.add(ctx, () => { glow(ctx, x, y - 250 * s, 330 * s, col, 0.26 * a); S.rgrad(ctx, x, y + 4, 170 * s, [[0, col, 0.4 * a], [1, col, 0]], 0.18); });
    let P;
    if (i === 3) { ctx.save(); ctx.beginPath(); ctx.rect(x, y - 700, 400, 800); ctx.clip(); P = tinted(ctx, x - 16 * e, y, s, oo, col, a, false); ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(x - 400, y - 700, 400, 800); ctx.clip(); tinted(ctx, x + 16 * e, y, s, { ...oo, t: t + 3 }, [150, 190, 255], a, true); ctx.restore(); }
    else if (i === 2) { ctx.save(); ctx.beginPath(); ctx.rect(hx + 62, y - 800, 500, 900); ctx.clip(); P = tinted(ctx, x, y, s, oo, col, a, flip); ctx.restore(); }
    else P = tinted(ctx, x, y, s, oo, col, a, flip);
    if (u < 1 || bk > 0) return;
    if (i === 0) { const pp = (age * 0.6) % 1; ctx.fillStyle = rgba([255, 190, 206], a * (1 - pp)); ctx.save(); ctx.translate(x + 60, y - 300 * s - 200 + pp * 200); ctx.rotate(pp * 5); ctx.beginPath(); ctx.ellipse(0, 0, 14, 7, 0, 0, 6.2832); ctx.fill(); ctx.restore(); for (let k = 0; k < 3; k++) S.ring(ctx, x, y + 4, 30 + ((pp + k * 0.2) % 1) * 300, 13, col, 0.5 * a * (1 - (pp + k * 0.2) % 1), 0.24); }
    if (i === 1) { S.add(ctx, () => glow(ctx, P.chest[0], P.chest[1], 110 + 20 * Math.sin(t * 6), [255, 120, 150], 0.7 * a)); const tp = (age * 0.8) % 1; ctx.fillStyle = rgba([170, 220, 255], a * (1 - tp)); ctx.beginPath(); ctx.ellipse(P.eyes[0] + (flip ? -16 : 16), P.eyes[1] + 14 + tp * 90, 6, 10, 0, 0, 6.2832); ctx.fill(); }
    if (i === 4) for (let k = 0; k < 3; k++) { const pts = Array.from({ length: 26 }, (_, q) => { const an = t * 2.4 + k * 2.1 + q * 0.12; return [P.head[0] + Math.cos(an) * 120 * s, P.head[1] - 20 + Math.sin(an) * 34 * s]; }); S.ribbon(ctx, pts, q => 3 + 12 * q, col, 0.6 * a, 1); }
    if (i === 5) S.add(ctx, () => { const pf = (age * 1.2) % 1; glow(ctx, P.head[0] + (flip ? 70 : -70) + pf * (flip ? 30 : -30), P.head[1] - 10 - pf * 30, 30 * (1 - pf) + 10, [255, 236, 226], 0.8 * a * (1 - pf)); glow(ctx, P.head[0] + (flip ? -30 : 30), P.head[1] + 16, 26, [255, 120, 130], 0.6 * a); });
    P.word = [x, y - 590 * s];
    SELF[i].lab = [x, y - 560 * s, a];
  });
  SELF.forEach((sf, i) => { if (!(prog(t, T.w[i] - 0.35, T.w[i] + 0.35) >= 1 && back <= 0)) sf.lab = null; });
  ctx.restore();
  // 风、花瓣
  S.petals(ctx, t, { n: 30, seed: 5, dir: [1, -0.12], speed: 300, a: 0.9 * Math.max(wind * (1 - smooth(prog(t, T.a05, T.a05 + 1.5))) , blow), c: [255, 176, 200], c2: [255, 236, 226], size: 20, box: [-100, 200, W + 100, 1500], gust: 1 + blow });
  // 前景
  CL.front(ctx, t, C, 1);
  ctx.save(); S.cam(ctx, C, 1.6); ctx.translate(-200, 1560); ctx.rotate(Math.sin(t * 0.7) * 0.01); ctx.drawImage(FGRASS(), 0, 0); ctx.restore();
  return { C };
}
function over(ctx, t, a, st) {
  const C = (st && st.C) || S.camKF(t, CAM);
  // 七个她头顶的词（跟着人走）
  SELF.forEach(([word, col], i) => { const lab = SELF[i].lab; if (!lab) return; const p = S.w2s(C, lab[0], lab[1]), u = easeOut(prog(t, T.w[i] + 0.05, T.w[i] + 0.4)); S.title(ctx, word, p[0], p[1] + (1 - u) * 16, { size: 64, c: mix(col, [255, 255, 255], 0.1), glowA: 0.9, a: lab[2] * u * a, spacing: 0.1 }); });
  // 片名：风里的光粒聚成 INFP
  if (t > T.title - 1.2) { ctx.save(); const C2 = S.camKF(t, CAM); ctx.translate(0, t > T.up ? -(C2.y - 30) * 0.9 : 0);
    const t0 = T.title - 1.0, age = t - t0, out = smooth(prog(t, T.up, T.up + 0.5)), real = smooth(prog(age, 1.0, 1.6)) * (1 - out);
    S.add(ctx, () => { for (const q of titlePts()) { const f = easeInOut(prog(age, q.dl, q.dl + 0.95)); if (f <= 0) continue; const sw = Math.sin(f * Math.PI) * 150 * q.cu, x = lerp(640 + q.cu * 60, q.x, f) + sw, y = lerp(900, q.y, f) - sw * 0.5 - out * q.up; const al = (0.3 + 0.7 * f) * (1 - 0.8 * real) * (1 - out) + out * (1 - out) * 2; glow(ctx, x, y, 5.5, f > 0.7 ? LIME : mix([255, 190, 200], LIME, f), al); } if (real > 0.01) glow(ctx, W / 2, 250, 620, LIME, 0.14 * real); });
    K.text(ctx, 'INFP', W / 2, 340, { size: 250, weight: 500, spacing: 0.08, color: mix(LIME, [255, 255, 255], 0.12), alpha: real });
    const sa = K.vis(t, T.title + 0.5, T.up + 0.3, 0.5, 0.4) * a; if (sa > 0.003) K.text(ctx, '小蝴蝶 · 调停者', W / 2, 520, { size: 58, weight: 500, color: [44, 52, 116], alpha: sa, spacing: 0.24 }); ctx.restore(); }
}
module.exports = { draw, over, T };
