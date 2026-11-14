'use strict';
// PWG3 第二幕「朋友家的聚会」：C103–C105（邀请函铺满画面后翻进来）
//   场景：有纵深的客厅 —— 吊灯（主光源）、彩旗和串灯、气球、摆着蛋糕的长桌；人前后错落：前景虚化的两个大背影和气球、中景跳舞聊天的一群、后景桌边的一群；
//        右后方的角落：窗、垂到地的窗帘、一大盆龟背竹 —— 她就在那里
//   C103 线下活动：全景，热闹，镜头慢慢横移，像在人群里找人
//   C104 躲在角落里局促不安：镜头穿过人群一直推到角落，她半个身子藏在窗帘边，两手捧着杯子，眼睛左右瞟，额角一滴汗
//   C105 被朋友丢下：带她来的朋友挥挥手挤进人堆里去了，她伸了伸手又缩回来；「一抓一个准」—— 一束追光扫过人群，啪地停在她身上
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const { K, GOLD, LIME, PINK, BLUE, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const FY = 1040, PAD = 240, HER = [806, 1090], HS = 0.66, PEND = [430, 250];
const T = { in: vs('C103') - 0.3, c103: vs('C103'), c104: vs('C104'), hide: at('C104', '躲在'), c105: vs('C105'), grab: at('C105', '一抓'), end: ve('C105') + 1.3 };
const CAM = [[T.in, { x: -150, y: 30, z: 1.3, ax: 800, ay: 1000 }], [T.c103 + 0.6, { x: -120, y: 20, z: 1.12 }], [T.c104 - 0.1, { x: -60, y: 20, z: 1.16 }], [T.hide + 1.3, { x: 104, y: -20, z: 2.2 }], [T.c105, { x: 104, y: -20, z: 2.26 }], [T.c105 + 1.0, { x: 30, y: -10, z: 1.8 }], [T.grab - 0.1, { x: 40, y: -10, z: 1.8 }], [T.grab + 0.5, { x: 104, y: -30, z: 2.3 }], [T.end, { x: 104, y: -30, z: 2.36 }]];
const BCOL = [[255, 120, 130], [255, 200, 110], [120, 200, 220], [190, 140, 240], [150, 220, 150]];
function balloon(c, x, y, r, col, a = 1) {
  c.save(); c.globalAlpha *= a; c.strokeStyle = 'rgba(240,230,230,0.5)'; c.lineWidth = 2.5; c.beginPath(); c.moveTo(x, y + r * 1.15); c.quadraticCurveTo(x + r * 0.3, y + r * 2, x - r * 0.1, y + r * 3.2); c.stroke();
  const g = c.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.15); g.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.7))); g.addColorStop(0.5, rgba(col)); g.addColorStop(1, rgba(mix(col, [40, 10, 50], 0.5)));
  c.fillStyle = g; c.beginPath(); c.ellipse(x, y, r, r * 1.15, 0, 0, 6.2832); c.fill(); S.poly(c, [[x - r * 0.12, y + r * 1.1], [x + r * 0.12, y + r * 1.1], [x, y + r * 1.3]], rgba(col)); c.restore();
}
const BACK = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2); const r = mulberry32(17);
  S.vgrad(c, [[0, [70, 40, 70]], [0.6, [128, 76, 84]], [1, [150, 96, 90]]], -PAD, FY, -PAD, W + PAD);
  for (let x = -PAD; x < W + PAD; x += 90) { c.fillStyle = 'rgba(255,220,180,0.03)'; c.fillRect(x, -PAD, 45, FY + PAD); }
  c.fillStyle = 'rgb(70,40,56)'; c.fillRect(-PAD, FY - 30, W + PAD * 2, 30);
  S.vgrad(c, [[0, [150, 100, 84]], [0.35, [110, 70, 72]], [1, [40, 26, 44]]], FY, H + PAD, -PAD, W + PAD);
  for (let i = -8; i <= 20; i++) { const xb = i * 150, xa = 540 + (xb - 540) * 0.5; S.poly(c, [[xa - 1.5, FY], [xa + 1.5, FY], [xb + 5, H + PAD], [xb - 5, H + PAD]], 'rgba(40,10,20,0.22)'); }
  // 角落的窗（夜色）
  const wx = 760, wy = 330, ww = 250, wh = 500; S.vgrad(c, [[0, [16, 22, 60]], [1, [60, 60, 120]]], wy, wy + wh, wx, wx + ww); S.add(c, () => { for (let k = 0; k < 14; k++) glow(c, wx + r() * ww, wy + 250 + r() * 240, 10 + r() * 10, [255, 206, 140], 0.6); glow(c, wx + 170, wy + 110, 60, [226, 230, 255], 0.8); });
  c.fillStyle = 'rgb(236,220,214)'; c.fillRect(wx - 14, wy - 14, ww + 28, 14); c.fillRect(wx - 14, wy, 14, wh); c.fillRect(wx + ww, wy, 14, wh); c.fillRect(wx + ww / 2 - 5, wy, 10, wh); c.fillRect(wx - 26, wy + wh, ww + 52, 20);
  // 墙上的相框、挂钟
  for (const [x, y, w, h] of [[80, 420, 120, 150], [230, 470, 90, 110], [560, 440, 110, 140]]) { c.fillStyle = 'rgb(60,34,50)'; c.fillRect(x - 7, y - 7, w + 14, h + 14); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgb(250,200,150)'); g.addColorStop(1, 'rgb(170,110,130)'); c.fillStyle = g; c.fillRect(x, y, w, h); }
  // 彩旗：两道
  for (const [x0, y0, x1, y1, sag] of [[-80, 250, 620, 230, 90], [520, 240, 1180, 270, 100]]) { for (let k = 0; k < 13; k++) { const s = (k + 0.5) / 13, x = lerp(x0, x1, s), y = lerp(y0, y1, s) + Math.sin(s * Math.PI) * sag; S.poly(c, [[x - 26, y], [x + 26, y], [x, y + 62]], rgba(BCOL[k % 5])); } c.strokeStyle = 'rgba(250,240,230,0.7)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1); c.stroke(); }
  // 后景左边一簇气球
  [[150, 610, 62, 0], [236, 560, 70, 1], [100, 520, 54, 2], [210, 680, 50, 3], [300, 640, 58, 4]].forEach(([x, y, rr, k]) => balloon(c, x, y, rr, BCOL[k]));
  // 长桌 + 桌布 + 蛋糕 + 饮料
  const tg = c.createLinearGradient(0, 1006, 0, 1190); tg.addColorStop(0, 'rgb(250,240,230)'); tg.addColorStop(1, 'rgb(190,160,170)'); c.fillStyle = tg; c.beginPath(); c.moveTo(40, 1006); c.lineTo(560, 1006); c.lineTo(590, 1190); for (let k = 6; k >= 0; k--) c.quadraticCurveTo(10 + k * 83 + 41, 1220, 10 + k * 83, 1190); c.closePath(); c.fill();
  c.fillStyle = 'rgb(255,250,244)'; c.beginPath(); c.ellipse(300, 1008, 280, 22, 0, 0, 6.2832); c.fill();
  [[300, 150, 60, [255, 230, 220]], [300, 110, 46, [255, 190, 200]], [300, 76, 32, [255, 236, 226]]].forEach(([x, w, h, col], i) => { c.fillStyle = rgba(col); c.beginPath(); c.roundRect(x - w / 2, 1000 - 60 - i * 46, w, h, 8); c.fill(); c.fillStyle = 'rgba(200,90,110,0.5)'; c.fillRect(x - w / 2, 1000 - 60 - i * 46 + h - 12, w, 6); });
  for (const [x, col] of [[110, [120, 190, 150]], [160, [240, 170, 90]], [450, [200, 120, 160]], [500, [130, 170, 230]]]) { c.fillStyle = rgba(col); c.beginPath(); c.roundRect(x, 930, 30, 76, 8); c.fill(); c.fillRect(x + 9, 904, 12, 30); }
}));
// 角落：窗帘（垂到地）+ 龟背竹（在她前面一点，她半藏在后面）
const CORNER = S.lazy(() => S.bake(520, 900, c => {
  const r = mulberry32(23);
  for (let k = 0; k < 6; k++) { const fx = 40 + k * 22, g = c.createLinearGradient(fx, 0, fx + 23, 0); g.addColorStop(0, 'rgb(110,60,100)'); g.addColorStop(0.5, 'rgb(170,104,140)'); g.addColorStop(1, 'rgb(90,46,90)'); c.fillStyle = g; c.fillRect(fx, 0, 23, 800 + Math.sin(k * 2) * 8); }
  // 花盆
  S.poly(c, [[330, 720], [470, 720], [450, 850], [350, 850]]); const pg = c.createLinearGradient(330, 0, 470, 0); pg.addColorStop(0, 'rgb(230,170,130)'); pg.addColorStop(1, 'rgb(150,90,80)'); c.fillStyle = pg; c.fill();
  for (let k = 0; k < 9; k++) { const a = -2.6 + k * 0.44 + (r() - 0.5) * 0.2, L = 190 + r() * 150, bx = 400 + Math.cos(a) * L, by = 720 + Math.sin(a) * L * 1.2;
    c.strokeStyle = 'rgb(50,96,80)'; c.lineWidth = 7; c.beginPath(); c.moveTo(400, 730); c.quadraticCurveTo(400 + Math.cos(a) * L * 0.3, 700 + Math.sin(a) * L * 0.9, bx, by); c.stroke();
    c.save(); c.translate(bx, by); c.rotate(a + 1.57); const lg = c.createLinearGradient(-60, 0, 60, 0); lg.addColorStop(0, 'rgb(40,110,90)'); lg.addColorStop(0.5, 'rgb(90,170,120)'); lg.addColorStop(1, 'rgb(36,90,84)'); c.fillStyle = lg; c.beginPath(); c.moveTo(0, 60); c.bezierCurveTo(-90, 30, -70, -70, 0, -90); c.bezierCurveTo(70, -70, 90, 30, 0, 60); c.fill(); c.restore(); }
}));
const FGIMG = S.lazy(() => S.bake(W + 800, 1500, c => {    // 前景：两个大背影 + 一簇气球（虚化）
  c.filter = 'blur(10px)';
  MB.person(c, 'estp-male', 300, 1700, 3.6, { dim: 0.86, shadow: 0 });
  balloon(c, 620, 330, 130, [150, 60, 80]); balloon(c, 770, 230, 110, [150, 110, 50]);
}));
const CROWD = [   // 人分三层景深（y 越大越靠近镜头、越大），散在客厅左边三分之二；右后角落空着
  ['estj-female', 70, 1078, 0.9, 0], ['entp-male', 236, 1066, 0.86, 1.3], ['esfj-female', 590, 1080, 0.92, 2.1],
  ['estp-male', 400, 1178, 1.28, 2.9], ['entj-female', 150, 1200, 1.36, 0.4],
  ['esfp-female', 560, 1330, 1.9, 1.7],
];
function cup(ctx, x, y, s) { const g = ctx.createLinearGradient(x - 14 * s, 0, x + 14 * s, 0); g.addColorStop(0, 'rgb(255,250,246)'); g.addColorStop(1, 'rgb(200,196,214)'); ctx.fillStyle = g; S.poly(ctx, [[x - 15 * s, y - 22 * s], [x + 15 * s, y - 22 * s], [x + 11 * s, y + 20 * s], [x - 11 * s, y + 20 * s]]); ctx.fill(); ctx.fillStyle = 'rgb(240,150,110)'; ctx.fillRect(x - 14 * s, y - 22 * s, 28 * s, 7 * s); }
function sweat(ctx, x, y, s, a) { if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; const g = ctx.createRadialGradient(x - 2 * s, y + 2 * s, 0, x, y, 10 * s); g.addColorStop(0, 'rgb(250,254,255)'); g.addColorStop(1, 'rgb(130,196,250)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y - 15 * s); ctx.quadraticCurveTo(x + 10 * s, y, x, y + 8 * s); ctx.quadraticCurveTo(x - 10 * s, y, x, y - 15 * s); ctx.fill(); ctx.restore(); }

function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  ctx.fillStyle = 'rgb(60,36,60)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(BACK(), -PAD, -PAD / 2);
  // 吊灯（主光源）+ 串灯（常亮）
  const br = 1 + 0.03 * Math.sin(t * 0.8);
  ctx.fillStyle = 'rgb(50,30,44)'; ctx.fillRect(PEND[0] - 3, -300, 6, PEND[1] + 280); S.poly(ctx, [[PEND[0] - 30, PEND[1] - 30], [PEND[0] + 30, PEND[1] - 30], [PEND[0] + 86, PEND[1] + 30], [PEND[0] - 86, PEND[1] + 30]], 'rgb(230,150,100)');
  S.add(ctx, () => { glow(ctx, PEND[0], PEND[1] + 40, 900 * br, [255, 190, 120], 0.26); glow(ctx, PEND[0], PEND[1] + 40, 150, [255, 230, 180], 0.4); S.rgrad(ctx, 430, 1180, 760, [[0, [255, 200, 130], 0.3], [1, [255, 200, 130], 0]], 0.24);
    for (let k = 0; k < 15; k++) { const s = (k + 0.5) / 15, x = lerp(-60, 1160, s), y = 150 + Math.sin(s * Math.PI) * 70 + Math.sin(s * Math.PI * 2) * 16; glow(ctx, x, y, 46, BCOL[k % 5], 0.5); glow(ctx, x, y, 14, [255, 250, 236], 0.8); } });
  // 角落的冷光（窗外的月光）：和大厅的暖光分开
  S.add(ctx, () => S.rgrad(ctx, 860, 900, 300, [[0, [130, 150, 255], 0.2], [1, [130, 150, 255], 0]], 1.3));
  // 人：按远近排序，随音乐轻轻晃
  const L0 = PEND;
  const leave = easeInOut(prog(t, T.c105 + 0.1, T.c105 + 1.5)), friend = ['enfp-female', lerp(640, 300, leave), lerp(1104, 1126, leave), lerp(1.36, 1.1, leave), 5.1];
  const drawP = ([key, x, y, s, ph], extra = {}) => S.lit(ctx, c => MB.person(c, key, x, y, s, { bob: Math.abs(Math.sin(t * 3.4 + ph)) * 7 * s, lean: Math.sin(t * 1.7 + ph) * 0.04, ...extra }), { light: L0, at: [x, y - 130 * s], r: 190 * s, warm: [255, 220, 170], cool: [50, 20, 60], k: 0.8 });
  const back = CROWD.filter(p => p[2] < 1120), mid = CROWD.filter(p => p[2] >= 1120);
  back.forEach(p => drawP(p));
  ctx.drawImage(CORNER(), 200, 0, 320, 900, 800, 250, 320, 900);
  // 她：在角落，半藏在窗帘后面
  const hide = smooth(prog(t, T.c104 - 0.3, T.hide + 0.6)), reach = Math.sin(Math.PI * prog(t, T.c105 + 0.2, T.c105 + 1.4)), gr = prog(t, T.grab - 0.05, T.grab + 0.6), hop = gr > 0 && gr < 1 ? Math.sin(gr * Math.PI) * 14 : 0;
  const o = { t, wind: false, flies: 1, eyes: gr > 0 ? 'wide' : leave > 0.15 ? 'sad' : 'open', mouth: gr > 0 ? 'o' : 'flat', look: gr > 0 ? [0, -1.5] : leave > 0.05 && leave < 1 ? [-2, 0.3] : [Math.sin(t * 2.6) * 1.8, 0.4], tilt: 0.25, la: -0.75 + 0.5 * reach, ra: -0.5 - 0.25 * reach, lean: -0.03 };
  ctx.save(); ctx.translate(2 * HER[0], 0); ctx.scale(-1, 1);       // 朝左（朝着人群）
  const Rm = S.lit(ctx, c => infp(c, HER[0], HER[1] - hop, HS, o), { light: [2 * HER[0] - 1100, 500], at: [HER[0], HER[1] - 180], r: 220, cool: [40, 24, 70], k: gr > 0.2 ? 0.5 : 0.9, warm: gr > 0.2 ? [255, 244, 210] : [190, 204, 255] });
  ctx.restore(); const R = {}; for (const k in Rm) R[k] = [2 * HER[0] - Rm[k][0], Rm[k][1]];
  cup(ctx, (R.lh[0] + R.rh[0]) / 2, Math.max(R.lh[1], R.rh[1]) + 4, 0.9);
  sweat(ctx, R.head[0] + 44, R.head[1] - 6 + ((t * 0.7) % 1) * 26, 1.1, hide * (1 - (t * 0.7) % 1) * (1 - smooth(gr)));
  ctx.drawImage(CORNER(), 0, 0, 200, 900, 560, 240, 200, 900);
  if (leave < 1) drawP(friend, { flip: leave > 0.05, bob: Math.abs(Math.sin(t * 7)) * 8 * (leave > 0 && leave < 1 ? 1 : 0) });
  mid.forEach(p => drawP(p)); if (leave >= 1) drawP(friend, { flip: true });
  // 追光：扫过人群，停在她身上
  const sp = prog(t, T.grab - 1.0, T.grab);
  if (sp > 0) { const sx = lerp(260, HER[0] - 6, easeInOut(sp)) + (sp < 1 ? Math.sin(sp * 9) * 50 * (1 - sp) : 0), a = smooth(prog(sp, 0, 0.2)), land = smooth(gr);
    S.add(ctx, () => { const g = ctx.createLinearGradient(0, 0, 0, HER[1]); g.addColorStop(0, `rgba(255,250,220,${0.3 * a})`); g.addColorStop(1, `rgba(255,250,220,${0.08 * a})`); ctx.fillStyle = g; ctx.filter = 'blur(12px)'; S.poly(ctx, [[sx - 150, -200], [sx - 90, -200], [sx + 200, HER[1] + 10], [sx - 200, HER[1] + 10]]); ctx.fill(); ctx.filter = 'none';
      S.rgrad(ctx, sx, HER[1] + 8, 230, [[0, [255, 250, 220], 0.36 * a], [0.8, [255, 250, 220], 0.22 * a], [1, [255, 250, 220], 0]], 0.2); if (gr > 0 && gr < 1) S.ring(ctx, sx, HER[1] + 8, 120 + gr * 300, 26, [255, 244, 200], 0.6 * (1 - gr), 0.2); });
    if (land > 0.01) S.rgrad(ctx, HER[0], HER[1] - 160, 1500, [[0, [24, 8, 36], 0], [0.22, [24, 8, 36], 0], [0.6, [24, 8, 36], 0.55 * land], [1, [24, 8, 36], 0.6 * land]]); }
  ctx.restore();
  // 彩纸屑（大片的，慢慢落）
  S.petals(ctx, t, { n: 22, seed: 31, dir: [0.15, 1], speed: 110, a: 0.9 * (1 - smooth(prog(C.z, 1.2, 1.8))), c: [255, 150, 150], c2: [150, 210, 240], size: 15, box: [-60, -100, W + 60, 1300] });
  // 前景
  const fz = 1 + (C.z - 1) * 1.7; ctx.save(); S.cam(ctx, C, 1.7); ctx.globalAlpha = 1 - smooth(prog(C.z, 1.5, 2.0)); ctx.drawImage(FGIMG(), -400, 200); ctx.restore();
  return { C };
}
function over(ctx, t, a) {
  const u = prog(t, T.grab + 0.1, T.grab + 0.6), ta = smooth(u) * a * (1 - smooth(prog(t, T.end - 0.5, T.end))); if (ta <= 0.003) return;
  const s = 1 + 0.25 * Math.exp(-u * 5);
  S.rgrad(ctx, 330, 300, 420, [[0, [20, 6, 30], 0.6 * ta], [1, [20, 6, 30], 0]], 0.6);
  ctx.save(); ctx.translate(330, 250); ctx.rotate(-0.06); ctx.scale(s, s); S.title(ctx, '抓到一只', 0, 0, { size: 84, c: [255, 240, 200], a: ta, spacing: 0.1 }); S.title(ctx, 'INFP', 30, 116, { size: 130, c: LIME, a: ta, family: 'Latin', weight: 600, spacing: 0.08 }); ctx.restore();
}
module.exports = { draw, over, T };
