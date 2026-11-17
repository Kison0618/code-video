'use strict';
// ESFJ v9 第 4 章「工作」：E01–E05。一栋楼的剖面：底层是门店、二层是团队办公室、三层是上司办公室；
//   镜头在这栋楼里移动（从上一章家里窗外的雨夜 → 白天的这栋楼），他在每层干一件事，最后拉远，整栋楼和左右邻楼里是五个职业
//   E01 这份在意放进工作里：他从家门出来，胸口的暖光还在；推开公司的玻璃门，阳光照进来
//   E02 团队合作、细节不知疲倦（二层办公室）：白板上一张排得满满的日程表，他一格格贴上便签；同事们围过来，他把每个人的任务卡递到各自手上；墙上的钟从九点转到晚上八点，他还在贴
//   E03 会卖东西（一层门店）：一位顾客犹豫着看两件毛衣，他拿起其中一件比在她身上，又从后面翻出一条围巾配好；顾客笑着结账，袋子里除了毛衣还多了一张他手写的卡片
//   E04 完美的下属（三层上司办公室）：上司递过来一摞乱七八糟的文件，他一转身就分好类、贴好标签、整整齐齐摞回去；上司点头，在门口的员工照片墙上给他贴了一颗星
//   E05 跟人打交道的工作：镜头拉远出楼外，整条街五扇亮着的窗：老师在黑板前、教练在操场吹哨、销售在柜台、秘书在电话前、前台在门口鞠躬 —— 每个窗里都是他
const X = require('./ehk');
const S = require('./ESS_kit');
const PR = require('./ESS_props');
const SET = require('./ESS_set');
const TP = require('./ESS_type');
const AA = require('./ESS_A');
const CT = require('./ESS_city');
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('E01') - 0.9, e01: vs('E01'), e02: vs('E02'), detail: at('E02', '安排'), tire: at('E02', '不知疲倦'), e03: vs('E03'), buy: at('E03', '顾客'), heart: at('E03', '热心'), e04: vs('E04'), boss: at('E04', '上司'), order: at('E04', '有条理'), loyal: at('E04', '忠心'), perfect: at('E04', '完美的下属'),
  e05: vs('E05'), jobs: at('E05', '老师'), end: vs('F01') };
// 楼的世界坐标：三层，每层高 FL，楼宽 BWID；镜头在楼里上下移动
const FL = 1700, BWID = 1400, BX = -160, BT = 0;   // 楼左上角 (BX, BT)，楼层 k 的地板 y = BT + (k+1)*FL
const floorY = k => BT + (3 - k) * FL;              // k=0 一层（最下）、1 二层、2 三层
const PAD = 300;
// ---------- 预渲：三层楼的内部 ----------
const BLD = S.lazy(() => S.bake((BWID + 400) / 2, (FL * 3 + 300) / 2, c => {
  c.scale(0.5, 0.5); c.translate(200 - BX, 100 - BT); const r = mulberry32(6);
  // 外墙（楼层之间的楼板）
  for (let k = 0; k < 3; k++) {
    const y0 = floorY(k) - FL, y1 = floorY(k);
    const wall = [[214, 176, 150], [176, 196, 200], [170, 150, 176]][k], floor = [[170, 120, 90], [140, 150, 160], [130, 96, 90]][k];
    S.vgrad(c, [[0, mix(wall, [40, 30, 40], 0.4)], [1, wall]], y0 + 636, y1 - 320, BX, BX + BWID);
    // 墙面质感：天花板下沿的阴影、两侧墙角暗下去、齐腰的护墙板、窗边被阳光照亮的一片
    { const g = c.createLinearGradient(0, y0 + 636, 0, y0 + 836); g.addColorStop(0, 'rgba(20,14,24,0.55)'); g.addColorStop(1, 'rgba(20,14,24,0)'); c.fillStyle = g; c.fillRect(BX, y0 + 636, BWID, 200); }
    for (const [x0, x1, a0] of [[BX, BX + 260, 0.45], [BX + BWID, BX + BWID - 220, 0.35]]) { const g = c.createLinearGradient(x0, 0, x1, 0); g.addColorStop(0, `rgba(20,14,24,${a0})`); g.addColorStop(1, 'rgba(20,14,24,0)'); c.fillStyle = g; c.fillRect(Math.min(x0, x1), y0 + 636, 260, FL - 956); }
    { const dy = y1 - 560; c.fillStyle = rgba(mix(wall, [70, 50, 50], 0.35)); c.fillRect(BX, dy, BWID, 240); c.fillStyle = 'rgba(255,248,236,0.22)'; c.fillRect(BX, dy, BWID, 8); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(BX, dy + 8, BWID, 6);
      for (let px = BX + 40; px < BX + BWID - 120; px += 230) { c.fillStyle = 'rgba(255,244,230,0.08)'; c.fillRect(px, dy + 40, 190, 150); c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(px, dy + 186, 190, 6); } }
    S.add(c, () => { glow(c, BX + 1060, y1 - 520, 560, [255, 230, 190], 0.12); });
    S.vgrad(c, [[0, floor], [1, mix(floor, [30, 20, 26], 0.6)]], y1 - 320, y1, BX, BX + BWID);
    for (let i = -6; i <= 16; i++) { const xb = BX + i * 140, xa = BX + 640 + (xb - BX - 640) * 0.45; S.poly(c, [[xa - 1, y1 - 320], [xa + 1, y1 - 320], [xb + 4, y1], [xb - 4, y1]], 'rgba(20,10,10,0.14)'); }
    { const g = c.createLinearGradient(0, y1 - 4, 0, y1 + 640); g.addColorStop(0, 'rgb(60,50,58)'); g.addColorStop(0.15, 'rgb(40,34,44)'); g.addColorStop(1, 'rgb(28,24,34)'); c.fillStyle = g; c.fillRect(BX - 30, y1 - 4, BWID + 60, 640); c.fillStyle = 'rgba(255,240,220,0.12)'; c.fillRect(BX - 30, y1 - 4, BWID + 60, 6); }
    for (const lx of [BX + 300, BX + 800]) { c.fillStyle = 'rgb(60,54,64)'; c.fillRect(lx - 2, y1 - 1064, 4, 0); S.poly(c, [[lx - 30, y1 - 1150], [lx + 30, y1 - 1150], [lx + 80, y1 - 1090], [lx - 80, y1 - 1090]], 'rgb(240,230,210)'); S.add(c, () => { glow(c, lx, y1 - 1060, 520, [255, 222, 180], 0.12); }); c.fillStyle = 'rgb(255,236,200)'; c.beginPath(); c.ellipse(lx, y1 - 1090, 78, 10, 0, 0, 6.2832); c.fill(); }
    // 每层的大窗（白天）
    const wx = BX + 1000, wy = y1 - 960, ww = 340, wh = 540;
    SET.window(c, wx, wy, ww, wh, { sky: (c2, x, y, w, h) => { S.vgrad(c2, [[0, [130, 190, 240]], [1, [220, 236, 250]]], y, y + h, x, x + w); c2.save(); c2.filter = 'blur(5px)'; c2.fillStyle = 'rgba(150,170,200,0.55)'; c2.beginPath(); c2.moveTo(x, y + h); for (let q = 0; q < 6; q++) { const bh = 80 + r() * 200; c2.lineTo(x + q * 60, y + h - bh); c2.lineTo(x + q * 60 + 50, y + h - bh); } c2.lineTo(x + w, y + h); c2.fill(); c2.restore(); }, curtain: null, frame: [240, 240, 236] });
  }
  // 一层：门店 —— 货架、衣架、收银台
  { const y1 = floorY(0); SET.shelf(c, BX + 80, y1 - 700, 420, 2); SET.shelf(c, BX + 80, y1 - 520, 420, 3);
    c.fillStyle = 'rgb(120,90,70)'; c.fillRect(BX + 560, y1 - 720, 380, 10); for (let q = 0; q < 6; q++) { const col = [[214, 90, 80], [240, 190, 110], [110, 170, 200], [150, 200, 140], [230, 150, 180], [200, 170, 140]][q]; c.fillStyle = rgba(col); S.poly(c, [[BX + 580 + q * 58, y1 - 700], [BX + 630 + q * 58, y1 - 700], [BX + 640 + q * 58, y1 - 520], [BX + 570 + q * 58, y1 - 520]]); c.fill(); }
    c.fillStyle = 'rgb(150,56,48)'; c.beginPath(); c.roundRect(BX + 560, y1 - 900, 400, 110, 18); c.fill(); c.fillStyle = 'rgb(186,80,64)'; c.beginPath(); c.roundRect(BX + 570, y1 - 890, 380, 90, 12); c.fill(); TP.engrave(c, '日常杂货', BX + 760, y1 - 822, { size: 60, family: 'ESHeavy', ink: [255, 236, 200], hi: [110, 30, 30], spacing: 0.18 }); }
  // 二层：办公室 —— 白板、工位、绿植
  { const y1 = floorY(1); c.fillStyle = 'rgb(250,252,252)'; c.fillRect(BX + 100, y1 - 860, 640, 420); c.fillStyle = 'rgb(150,160,170)'; c.fillRect(BX + 90, y1 - 870, 660, 12); c.fillRect(BX + 90, y1 - 440, 660, 14);
    for (let q = 0; q < 6; q++) { c.fillStyle = 'rgba(80,110,140,0.4)'; c.fillRect(BX + 120, y1 - 820 + q * 64, 600, 3); } for (let q = 0; q < 5; q++) { c.fillStyle = 'rgba(80,110,140,0.4)'; c.fillRect(BX + 220 + q * 110, y1 - 840, 3, 380); }
    K.text(c, '本周排班', BX + 130, y1 - 884, { size: 46, family: 'ESSans', weight: 900, color: [60, 80, 120], align: 'left' }); SET.plant(c, BX + 900, y1 - 300, 1.1, 2); }
  // 三层：上司办公室 —— 书柜、大桌、员工照片墙
  { const y1 = floorY(2); SET.shelf(c, BX + 100, y1 - 760, 360, 5); SET.shelf(c, BX + 100, y1 - 580, 360, 8);
    c.fillStyle = 'rgb(120,90,70)'; c.fillRect(BX + 520, y1 - 860, 420, 360); c.fillStyle = 'rgb(240,232,220)'; c.fillRect(BX + 534, y1 - 846, 392, 332);
    K.text(c, '本月之星', BX + 730, y1 - 784, { size: 50, family: 'ESHeavy', weight: 900, color: [170, 70, 50], spacing: 0.12 }); for (let q = 0; q < 6; q++) { const px = BX + 560 + (q % 3) * 124, py = y1 - 750 + Math.floor(q / 3) * 128; c.fillStyle = 'rgb(255,255,250)'; c.fillRect(px, py, 96, 110); const pg = c.createLinearGradient(0, py, 0, py + 78); pg.addColorStop(0, 'rgb(200,220,236)'); pg.addColorStop(1, 'rgb(150,170,200)'); c.fillStyle = pg; c.fillRect(px + 8, py + 8, 80, 74); MB.person(c, MB.ALL[(q * 5 + 3) % MB.ALL.length], px + 48, py + 84, 0.3, { shadow: 0 }); } }
}));
// 楼外：左右两排邻楼（有窗格、招牌）+ 街道 + 行道树（拉远时看得见）
// 楼外：左右两排邻楼（玻璃幕墙，反着天光，不再是一格格小方窗）+ 街道 + 行道树（拉远时看得见）
const GLASS = S.lazy(() => [0, 1, 2, 3].map(k => CT.curtain({ w: 900, h: 5200, sky: [[[150, 200, 240], [250, 214, 190]], [[170, 196, 230], [230, 200, 210]], [[140, 190, 230], [240, 224, 200]], [[160, 206, 236], [250, 230, 210]]][k], frame: [[70, 86, 110], [90, 80, 100], [60, 90, 100], [100, 96, 110]][k], mull: 110 + k * 20, res: 0.25, seed: 7 + k })));
const STREET = S.lazy(() => S.bake(2250, 2100, c => { c.scale(0.25, 0.25); c.translate(4000, 3000); const r = mulberry32(19), G = GLASS();
  for (const side of [-1, 1]) for (let k = 0; k < 4; k++) { const w = 700 + r() * 400, h = 2600 + r() * 2600, x = side < 0 ? BX - 260 - (k + 1) * 900 : BX + BWID + 260 + k * 900, top = floorY(0) - h;
    c.drawImage(G[k], x, top, w, h); c.fillStyle = 'rgba(40,50,70,0.5)'; c.fillRect(x, top - 40, w, 40);
    c.fillStyle = rgba([[214, 90, 80], [240, 190, 110], [110, 170, 200], [150, 200, 140]][k]); c.fillRect(x + 60, floorY(0) - 420, w - 120, 90); c.fillStyle = 'rgba(30,30,40,0.6)'; c.fillRect(x, floorY(0) - 320, w, 320); }
  S.vgrad(c, [[0, [120, 120, 140]], [1, [70, 70, 90]]], floorY(0) + 30, floorY(0) + 1600, -4000, 5000);
  c.fillStyle = 'rgb(230,230,230)'; for (let x = -4000; x < 5000; x += 400) c.fillRect(x, floorY(0) + 700, 200, 30);
  for (let x = -3600; x < 4800; x += 700) { c.fillStyle = 'rgb(90,64,50)'; c.fillRect(x - 20, floorY(0) - 400, 40, 430); for (let q = 0; q < 5; q++) { c.fillStyle = q % 2 ? 'rgb(80,150,96)' : 'rgb(110,180,110)'; c.beginPath(); c.arc(x + Math.cos(q * 1.3) * 110, floorY(0) - 540 + Math.sin(q * 1.9) * 80, 150, 0, 6.2832); c.fill(); } }
}));
// ---------- 镜头：楼里上下移动 ----------
const fy = k => floorY(k) - 1180;   // 让这层地板落在屏幕 y≈1300（字幕区之上一点）
const CAM = [
  [T.in, { x: 140, y: fy(1) - 200, z: 1.0, ax: 540, ay: 1000 }], [T.e01 + 0.9, { x: 140, y: fy(1), z: 1.0 }],
  [T.e02 - 0.2, { x: 100, y: fy(1), z: 1.02 }], [T.detail + 0.6, { x: -40, y: fy(1) - 60, z: 1.12 }], [T.e03 - 0.7, { x: -20, y: fy(1) - 40, z: 1.1 }],
  [T.e03 + 0.5, { x: 60, y: fy(0), z: 1.04 }, easeInOut], [T.buy + 0.3, { x: -170, y: fy(0) - 280, z: 1.3 }], [T.heart - 0.5, { x: -120, y: fy(0) - 260, z: 1.28 }], [T.heart + 0.4, { x: 200, y: fy(0) - 250, z: 1.26 }], [Math.max(T.heart + 0.6, T.e04 - 0.6), { x: 140, y: fy(0) - 120, z: 1.12 }],
  [T.e04 + 0.5, { x: 60, y: fy(2), z: 1.04 }], [T.order + 0.2, { x: 0, y: fy(2) - 120, z: 1.14 }], [T.perfect - 0.1, { x: 80, y: fy(2) - 300, z: 1.28 }], [T.e05 - 0.3, { x: 60, y: fy(2) - 200, z: 1.18 }],
  [T.e05 + 1.6, { x: 140, y: floorY(1) - 1500, z: 0.36 }], [T.end, { x: 140, y: floorY(1) - 1500, z: 0.34 }],
];
function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  ctx.fillStyle = 'rgb(140,180,220)'; ctx.fillRect(0, 0, W, H);
  // 楼外：天空 + 邻楼（拉远时看得见）
  ctx.save(); S.cam(ctx, C, 1);
  S.vgrad(ctx, [[0, [70, 120, 200]], [0.6, [170, 206, 240]], [1, [250, 226, 200]]], -3000, floorY(0) + 200, -4000, 5000);
  if (C.z < 0.9) ctx.drawImage(STREET(), -4000, -3000, 9000, 8400);
  { const g = ctx.createLinearGradient(0, floorY(0), 0, floorY(0) + 900); g.addColorStop(0, 'rgb(40,34,44)'); g.addColorStop(1, 'rgb(20,18,26)'); ctx.fillStyle = g; ctx.fillRect(BX - 60, floorY(0), BWID + 120, 900); }
  ctx.drawImage(BLD(), BX - 200, BT - 100, BWID + 400, FL * 3 + 300);
  // 楼外墙边框（剖面感）
  ctx.fillStyle = 'rgb(80,74,90)'; ctx.fillRect(BX - 60, BT - 60, 60, FL * 3 + 90); ctx.fillRect(BX + BWID, BT - 60, 60, FL * 3 + 90); ctx.fillRect(BX - 60, BT - 90, BWID + 120, 60);
  TP.foil(ctx, '供给大厦', BX + BWID / 2, BT - 34, { size: 72, spacing: 0.3, p: 1, glowA: 0.25, shadow: 0.4 });
  // 每层：从右边大窗斜照进来的阳光 + 光里的浮尘（主光源）
  for (let k = 0; k < 3; k++) { const y1 = floorY(k); S.add(ctx, () => { ctx.save(); ctx.translate(BX + 1360, y1 - 980); ctx.scale(-1, 1); ctx.globalAlpha = 0.5; ctx.drawImage(BEAM(), 0, 0, 1000, 980); ctx.restore(); }); if (C.z > 0.8) SET.motes(ctx, t, [BX + 380, y1 - 900, BX + 1300, y1 - 120], [255, 236, 200], 0.4, 14, 11 + k); }
  // ---------- 二层：团队 ----------
  const y2 = floorY(1);
  const clockMin = 9 * 60 + 11 * 60 * smooth(prog(t, T.detail, T.tire + 0.8));
  X.clock(ctx, BX + 840, y2 - 820, 70, clockMin, 1);
  // 白板上的便签：一格格贴上
  const notes = Math.floor(clamp(prog(t, T.e02 - 0.2, T.tire + 0.6)) * 24);
  for (let k = 0; k < notes; k++) { const col = [[255, 230, 110], [255, 170, 180], [150, 220, 200], [170, 200, 255]][k % 4], i = k % 6, j = Math.floor(k / 6), px = BX + 130 + i * 104, py = y2 - 800 + j * 92; ctx.save(); ctx.translate(px + 40, py + 34); ctx.rotate((hash(k) - 0.5) * 0.1); ctx.fillStyle = rgba(col); ctx.shadowColor = 'rgba(0,0,0,0.2)'; ctx.shadowBlur = 6; ctx.fillRect(-40, -34, 80, 68); ctx.restore(); }
  const mates = [['entj-female', BX + 260, 1.9], ['intp-male', BX + 560, 1.75], ['estj-male', BX + 820, 1.85]];
  const cards = mates.map((m, i) => prog(t, T.tire - 0.6 + i * 0.4, T.tire - 0.1 + i * 0.4));
  mates.forEach(([key, x, s], i) => S.lit(ctx, c => MB.person(c, key, x, y2 - 60, s, { flip: i === 2, warm: 0.4 * smooth(cards[i]) }), { light: [BX + 1170, y2 - 700], at: [x, y2 - 300], r: 300, warm: [255, 244, 220], cool: [60, 70, 90], k: 0.6 }));
  const busy = prog(t, T.e02, T.e03 - 0.4), hx2 = lerp(BX + 300, BX + 720, (Math.sin(busy * Math.PI * 2.5) + 1) / 2);
  const R2 = S.lit(ctx, c => ES.hero(c, hx2, y2 - 30, 1.0, { t, umbrella: false, cake: false, book: false, flip: Math.cos(busy * Math.PI * 2.5) < 0, rs: -1.6 - 0.3 * Math.sin(t * 6), re: -0.4, eyes: 'happy', mouth: 'grin', bob: Math.abs(Math.sin(t * 7)) * 6, glow: 0.3 }), { light: [BX + 1170, y2 - 700], at: [hx2, y2 - 330], r: 340, warm: [255, 244, 220], cool: [60, 70, 90], k: 0.6 });
  // 任务卡递到每个人手上
  mates.forEach(([, x], i) => { const u = cards[i]; if (u <= 0) return; const e = easeInOut(clamp(u)), cx = lerp(R2.hand[0], x + 50, e), cy = lerp(R2.hand[1], y2 - 330, e) - Math.sin(e * Math.PI) * 60; ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.1); ctx.fillStyle = 'rgb(255,250,240)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8; ctx.fillRect(-36, -26, 72, 52); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(214,90,80,0.8)'; ctx.fillRect(-28, -18, 40, 8); ctx.restore(); });
  // ---------- 一层：门店 ----------
  const y1 = floorY(0);
  const cust = smooth(prog(t, T.e03 - 0.6, T.e03 + 0.4)), hold = Math.sin(Math.PI * prog(t, T.e03 + 0.4, T.buy + 0.6)), scarfU = easeInOut(prog(t, T.buy + 0.2, T.buy + 1.0)), pay = smooth(prog(t, T.heart - 0.6, T.heart));
  S.lit(ctx, c => MB.person(c, 'isfp-female', BX + 380, y1 - 60, 2.0, { a: cust, lean: -0.03, warm: 0.5 * pay }), { light: [BX + 1170, y1 - 700], at: [BX + 380, y1 - 300], r: 300, warm: [255, 230, 190], cool: [60, 40, 40], k: 0.6 });
  if (scarfU > 0) { const nk = [BX + 384, y1 - 60 - 480 * 0.86 + 156]; if (scarfU < 1) AA.flyingScarf(ctx, t, [BX + 640, y1 - 420], nk, scarfU, [214, 90, 80]); else AA.neckScarf(ctx, nk[0], nk[1], 0.9, t, 1); }
  // 收银台
  ctx.fillStyle = 'rgb(160,110,80)'; ctx.fillRect(BX + 860, y1 - 260, 380, 200); ctx.fillStyle = 'rgb(200,150,110)'; ctx.fillRect(BX + 850, y1 - 280, 400, 26);
  const R1 = S.lit(ctx, c => ES.hero(c, BX + 740, y1 - 30, 1.0, { t, flip: true, umbrella: false, cake: false, book: false, rs: -1.4 * Math.max(hold, Math.sin(Math.PI * scarfU)), re: -0.5 * hold, eyes: 'happy', mouth: 'grin', lean: -0.05 * hold }), { light: [BX + 1170, y1 - 700], at: [BX + 740, y1 - 330], r: 340, warm: [255, 230, 190], cool: [60, 40, 40], k: 0.6 });
  if (hold > 0.05) { ctx.save(); ctx.translate(lerp(R1.hand[0], BX + 400, hold * 0.6), R1.hand[1] + 40); ctx.globalAlpha = hold; ctx.fillStyle = 'rgb(240,190,110)'; S.poly(ctx, [[-70, -60], [70, -60], [90, 90], [-90, 90]]); ctx.fill(); ctx.fillStyle = 'rgb(214,160,80)'; ctx.fillRect(-90, 70, 180, 20); ctx.restore(); }
  if (pay > 0.01) { PR.bag(ctx, BX + 1040, y1 - 280, 0.7, { a: pay }); ctx.save(); ctx.globalAlpha = pay; ctx.translate(BX + 1080, y1 - 430); ctx.rotate(0.2); ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.fillStyle = 'rgb(255,240,210)'; ctx.fillRect(-80, -70, 160, 140); ctx.shadowColor = 'transparent'; K.text(ctx, '天冷', 0, -12, { size: 44, family: 'ESSans', weight: 900, color: [170, 70, 50] }); K.text(ctx, '多穿点', 0, 44, { size: 40, family: 'ESSans', weight: 900, color: [170, 70, 50] }); ctx.restore(); }
  // ---------- 三层：上司办公室 ----------
  const y3 = floorY(2);
  const give = easeInOut(prog(t, T.e04 + 0.1, T.boss + 0.6)), sortU = prog(t, T.boss + 0.6, T.loyal), star = easeOut(prog(t, T.perfect - 0.2, T.perfect + 0.6));
  ctx.fillStyle = 'rgb(110,70,54)'; ctx.fillRect(BX + 140, y3 - 330, 560, 40); ctx.fillStyle = 'rgb(80,50,40)'; ctx.fillRect(BX + 160, y3 - 290, 30, 230); ctx.fillRect(BX + 650, y3 - 290, 30, 230);
  S.lit(ctx, c => MB.person(c, 'entj-male', BX + 300, y3 - 60, 2.0, { flip: false, lean: 0.04 * Math.sin(Math.PI * give) }), { light: [BX + 1170, y3 - 700], at: [BX + 300, y3 - 300], r: 300, warm: [255, 236, 210], cool: [50, 40, 60], k: 0.6 });
  const R3 = S.lit(ctx, c => ES.hero(c, BX + 840, y3 - 30, 1.0, { t, flip: true, umbrella: false, cake: false, book: false, rs: -1.3 * Math.max(Math.sin(Math.PI * give), sortU > 0 && sortU < 1 ? 1 : 0) - 0.4 * Math.sin(t * 10) * (sortU > 0 && sortU < 1 ? 1 : 0), re: -0.5, eyes: star > 0.2 ? 'happy' : 'open', mouth: 'grin', glow: 0.5 * star }), { light: [BX + 1170, y3 - 700], at: [BX + 840, y3 - 330], r: 340, warm: [255, 236, 210], cool: [50, 40, 60], k: 0.6 });
  // 文件：乱 → 分好类摞整齐
  for (let k = 0; k < 9; k++) { const mess = 1 - easeInOut(clamp(sortU * 1.3 - k * 0.04)), col = [[255, 250, 240], [255, 230, 180], [200, 230, 255]][k % 3], stack = k % 3, sx = BX + 420 + stack * 90, sy = y3 - 340 - Math.floor(k / 3) * 14; const x = lerp(sx, BX + 460 + hash(k * 3) * 200 - 100, mess), y = lerp(sy, y3 - 340 - hash(k * 7) * 40, mess), rot = mess * (hash(k * 5) - 0.5) * 1.6;
    if (give < 0.5 && t < T.boss + 0.4) continue; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = rgba(col); ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 6; ctx.fillRect(-40, -12, 80, 24); ctx.shadowColor = 'transparent'; if (mess < 0.2) { ctx.fillStyle = rgba([[214, 80, 70], [90, 150, 210], [110, 180, 110]][stack]); ctx.fillRect(28, -14, 14, 10); } ctx.restore(); }
  // 照片墙上的星
  if (star > 0.01) { const sx = BX + 560 + 124, sy = y3 - 760; ctx.fillStyle = 'rgb(255,255,250)'; ctx.fillRect(sx, sy, 96, 110); ES.hero(ctx, sx + 48, sy + 108, 0.17, { umbrella: false, cake: false, book: false, eyes: 'happy' }); S.add(ctx, () => glow(ctx, sx + 80, sy, 120 * star, [255, 200, 100], 0.35)); ctx.fillStyle = 'rgb(255,214,90)'; ctx.beginPath(); for (let q = 0; q < 10; q++) { const a = q * Math.PI / 5 - 1.57, rr = (q % 2 ? 12 : 30) * star; ctx.lineTo(sx + 80 + Math.cos(a) * rr, sy + Math.sin(a) * rr); } ctx.fill(); }
  ctx.restore();
  // 前景：近处虚化的绿植（只在楼里的镜头里，拉远时退掉）
  { const fa = smooth(clamp((C.z - 0.8) / 0.2)); if (fa > 0.01) { ctx.save(); ctx.globalAlpha = 0.9 * fa; ctx.drawImage(SET.FGLEAF(), -170 - (C.x || 0) * 0.25, 1080, 700, 800); ctx.restore(); } }
  return { C };
}
const BEAM = S.lazy(() => SET.beamImg(500, 490, [255, 232, 190], 0.5));
// E05：拉远后楼外的五个职业 —— 在 over 层（清晰）里用小相框画出来，每个相框里是他在做那份工作
function job(ctx, x, y, w, h, kind, a, t) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  const sc = 0.92 + 0.08 * smooth(a); ctx.scale(sc, sc);
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; ctx.fillStyle = 'rgb(250,246,236)'; ctx.beginPath(); ctx.roundRect(-w / 2 - 12, -h / 2 - 12, w + 24, h + 80, 14); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); ctx.clip();
  const bg = [[[70, 110, 90], [40, 70, 60]], [[140, 200, 120], [90, 150, 90]], [[250, 220, 180], [220, 170, 130]], [[200, 210, 230], [150, 160, 190]], [[240, 220, 200], [200, 170, 150]]][kind];
  S.vgrad(ctx, [[0, bg[0]], [1, bg[1]]], -h / 2, h / 2, -w / 2, w / 2);
  const o = { t, umbrella: false, cake: false, book: false, eyes: 'happy', mouth: 'grin' };
  if (kind === 0) { K.text(ctx, '1+1=2', -w * 0.16, -h * 0.16, { size: 44, family: 'ESSans', weight: 700, color: [240, 250, 240] }); ES.hero(ctx, w * 0.12, h / 2 + 20, 0.42, { ...o, rs: -2.2, re: -0.4 }); }
  if (kind === 1) { ES.hero(ctx, 0, h / 2 + 20, 0.42, { ...o, rs: -1.4, mouth: 'o' }); X.whistle(ctx, 22, -h * 0.12, 12, 0.3, 1); }
  if (kind === 2) { ctx.fillStyle = 'rgb(160,110,80)'; ctx.fillRect(-w / 2, h * 0.12, w, h); ES.hero(ctx, 0, h / 2 + 20, 0.42, { ...o, rs: -1.2 }); PR.bag(ctx, w * 0.3, h * 0.14, 0.26, {}); }
  if (kind === 3) { ctx.fillStyle = 'rgb(110,80,70)'; ctx.fillRect(-w / 2, h * 0.16, w, h); ES.hero(ctx, -w * 0.1, h / 2 + 20, 0.42, { ...o, rs: -2.0, re: -1.4 }); PR.phone(ctx, w * 0.14, -h * 0.06, 0.16, { on: 1 }); }
  if (kind === 4) { ctx.fillStyle = 'rgb(130,90,70)'; ctx.fillRect(-w / 2, h * 0.18, w, h); ES.hero(ctx, 0, h / 2 + 20, 0.42, { ...o, nod: 1.0, lean: 0.12 }); }
  ctx.restore();
  K.text(ctx, ['老师', '教练', '销售', '秘书', '前台'][kind], 0, h / 2 + 50, { size: 46, family: 'ESHeavy', weight: 900, color: [120, 70, 40], spacing: 0.2 });
  ctx.restore();
}
function over(ctx, t) {
  const ja = smooth(prog(t, T.jobs - 0.4, T.jobs + 0.2)), done = 1 - smooth(prog(t, T.end - 0.6, T.end));
  const pos = [[200, 400], [540, 320], [880, 400], [330, 790], [750, 790]];
  pos.forEach(([x, y], i) => job(ctx, x, y, 270, 280, i, ja * done * smooth(prog(t, T.jobs - 0.4 + i * 0.35, T.jobs + 0.1 + i * 0.35)), t));
}
module.exports = { draw, over, T };
