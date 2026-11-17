'use strict';
// ESFJ v9 第 2 章「生活里的表现」：C01–C10
//   幕一「屋顶长桌宴」C01–C03（夜里的天台：串灯是主光，一张往远处伸的长桌，背后是城市灯火）
//     C01 他站在桌头一个个迎客，给每个人拉椅子；C02 大家举杯说笑，他提着茶壶沿着桌子挨个添；C03 一位新客人站起来自我介绍「我叫小林」——
//     他立刻在名牌上写下「小林」摆到她面前，又发现她杯子空了，顺手满上
//   幕二「散场后的客厅」C04：只剩他一个。钟在走，他坐下又站起，拿起手机又放下，最后抓起外套出门（门外的光）
//   幕三「医院候诊室」C05–C09（冷白顶灯 + 一扇有阳光的窗；一排排塑料椅前后错开）
//     C05 他坐在一个看报纸的陌生人旁边，开口搭话；报纸一点点放下来
//     C06 天气（他指窗外）、菜价（从袋子里掏出一把青菜，上面贴着价签）、谁家孩子考上了大学（手机里一张戴学士帽的照片）
//     C07 想打听新鲜事问他最快：候诊室里的人一个个凑过来，连护士都探出头
//     C08 另一位病人突然问「你说，人活着的意义是什么？」—— 他的笑僵住，不说话了
//     C09 诊室门开了，主任医师出来说了同一句话 —— 他立刻站起来，掏出本子认真记，连连点头
//   幕四「窗边」C10：回到家，台灯下翻一本旧相册（泛黄的合照、往年的聚会）；窗外起风、乌云压过来，他合上相册，皱着眉去把窗关紧
const X = require('./ehk');
const S = require('./ESS_kit');
const PR = require('./ESS_props');
const SET = require('./ESS_set');
const QT = require('./ESS_quote');
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('C01') - 0.9, c01: vs('C01'), c02: vs('C02'), c03: vs('C03'), name: at('C03', '名字'), lack: at('C03', '缺什么'), c04: vs('C04'), c05: vs('C05'), c06: vs('C06'), weather: at('C06', '天气'), price: at('C06', '菜价'), kid: at('C06', '谁家'),
  c07: vs('C07'), c08: vs('C08'), quiet: at('C08', '安静'), c09: vs('C09'), auth: at('C09', '权威'), listen: at('C09', '认真听'), c10: vs('C10'), past: at('C10', '怀念'), worry: at('C10', '担心'), end: vs('D01') };
const A2 = T.c04 - 0.6, A3 = T.c05 - 0.6, A4 = T.c10 - 0.6;
const PAD = SET.PAD, WARM = [255, 200, 130];
// ================= 幕一：屋顶长桌宴 =================
const VP = [560, 880], NEAR = 1500;
const ROOF = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2); const r = mulberry32(13);
  S.vgrad(c, [[0, [12, 14, 40]], [0.4, [40, 34, 80]], [0.55, [120, 70, 100]], [0.62, [70, 44, 70]]], -PAD, 1000, -PAD, W + PAD);
  S.stars(c, 3, [-PAD, -PAD, W + PAD, 500], 80, 0.8);
  for (let L = 0; L < 2; L++) for (let i = 0; i < 16; i++) { const w = 70 + r() * 90, x = -PAD + i * 110 + r() * 30, h = (L ? 180 : 320) + r() * (L ? 160 : 260), top = 900 - h, col = L ? [36, 30, 66] : [60, 44, 84]; c.fillStyle = rgba(col); c.fillRect(x, top, w, h + 20);
    S.add(c, () => { for (let yy = top + 16; yy < 880; yy += 30) for (let xx = x + 8; xx < x + w - 12; xx += 22) if (r() < 0.25) { c.fillStyle = rgba([255, 200, 130], 0.4 + r() * 0.4); c.fillRect(xx, yy, 12, 16); } }); }
  c.filter = 'blur(5px)'; c.drawImage(c.canvas, 0, 0); c.filter = 'none';
  // 天台地面 + 女儿墙
  S.vgrad(c, [[0, [90, 64, 70]], [1, [36, 24, 34]]], 900, H + PAD, -PAD, W + PAD);
  c.fillStyle = 'rgb(70,52,60)'; c.fillRect(-PAD, 880, W + PAD * 2, 40); c.fillStyle = 'rgba(255,220,180,0.2)'; c.fillRect(-PAD, 880, W + PAD * 2, 4);
  for (let i = -8; i <= 20; i++) { const xb = i * 150, xa = VP[0] + (xb - VP[0]) * 0.25; S.poly(c, [[xa - 1, 920], [xa + 1, 920], [xb + 4, H + PAD], [xb - 4, H + PAD]], 'rgba(20,10,20,0.2)'); }
  // 角落的盆栽
  SET.plant(c, -40, 960, 0.9, 4); SET.plant(c, 1100, 960, 0.9, 7);
}));
// 透视长桌：桌面从近（y=NEAR）到远（y=VP+40）收拢
const TL = (u) => lerp(40, VP[0] - 90, u), TR = (u) => lerp(1040, VP[0] + 90, u), TY = (u) => lerp(NEAR, VP[1] + 60, Math.pow(u, 0.7));
function longTable(ctx, t) {
  S.poly(ctx, [[TL(0) - 10, TY(0) + 60], [TR(0) + 10, TY(0) + 60], [TR(1), TY(1) + 8], [TL(1), TY(1) + 8]], 'rgb(90,54,46)');
  S.poly(ctx, [[TL(0), TY(0)], [TR(0), TY(0)], [TR(1), TY(1)], [TL(1), TY(1)]]); const g = ctx.createLinearGradient(0, TY(1), 0, TY(0)); g.addColorStop(0, 'rgb(130,100,110)'); g.addColorStop(0.6, 'rgb(206,180,170)'); g.addColorStop(1, 'rgb(180,150,140)'); ctx.fillStyle = g; ctx.fill();
  S.add(ctx, () => { for (let k = 0; k < 6; k++) { const u = 0.08 + k * 0.16; S.rgrad(ctx, lerp(TL(u), TR(u), 0.5), TY(u), 260 * lerp(1, 0.3, u), [[0, [255, 200, 130], 0.25], [1, [255, 200, 130], 0]], 0.3); } });
  ctx.fillStyle = 'rgba(214,80,80,0.75)'; S.poly(ctx, [[lerp(TL(0), TR(0), 0.44), TY(0)], [lerp(TL(0), TR(0), 0.56), TY(0)], [lerp(TL(1), TR(1), 0.55), TY(1)], [lerp(TL(1), TR(1), 0.45), TY(1)]]); ctx.fill();
  // 桌上的盘子、蜡烛、花（按深度缩放）
  for (let k = 0; k < 6; k++) { const u = 0.08 + k * 0.16, y = TY(u), s = lerp(1.0, 0.25, Math.pow(u, 0.7));
    for (const sd of [0.2, 0.8]) { const x = lerp(TL(u), TR(u), sd); ctx.fillStyle = 'rgb(252,250,246)'; ctx.beginPath(); ctx.ellipse(x, y, 90 * s, 26 * s, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = rgba([[240, 170, 90], [200, 90, 70], [130, 190, 110]][k % 3]); ctx.beginPath(); ctx.ellipse(x, y - 4 * s, 50 * s, 14 * s, 0, 0, 6.2832); ctx.fill(); }
    PR.candle(ctx, lerp(TL(u), TR(u), 0.5), y + 10 * s, s * 0.8, t, { len: 0.8 }); }
}
// 串灯：从左右两边的杆子拉到远处（常亮，只轻轻晃）
function stringLights(ctx, t) {
  for (const [A, B, n] of [[[-200, 180], [VP[0] - 40, 620], 14], [[1280, 180], [VP[0] + 40, 620], 14], [[-200, 180], [1280, 180], 16]]) {
    const pts = Array.from({ length: n + 1 }, (_, k) => { const s = k / n; return [lerp(A[0], B[0], s), lerp(A[1], B[1], s) + Math.sin(s * Math.PI) * 120 + Math.sin(t * 0.8 + k) * 3]; });
    ctx.strokeStyle = 'rgba(40,30,30,0.8)'; ctx.lineWidth = 3; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
    S.add(ctx, () => pts.forEach((p, k) => { if (!k) return; const s = 1 - 0.6 * (Math.abs(p[1] - 180) / 500); glow(ctx, p[0], p[1] + 14, 90 * s, WARM, 0.45); glow(ctx, p[0], p[1] + 14, 18 * s, [255, 246, 220], 1); }));
  }
}
// 客人：左右两排，按深度错落（u 越大越远越小）
const GUESTS = [['enfp-female', 0, 0.6], ['entp-male', 1, 0.45], ['isfj-male', 0, 0.5], ['estp-female', 1, 0.7], ['esfp-female', 0, 0.82], ['intj-female', 1, 0.92]];
const XIAOLIN = ['istj-female', 0, 0.3];
function act1(ctx, t) {
  const C = S.camKF(t, [[T.in, { x: 0, y: -360, z: 1.5, ax: 540, ay: 1000 }], [T.c01 + 0.4, { x: 0, y: -20, z: 1.0 }], [T.c02, { x: 0, y: -20, z: 1.02 }], [T.c02 + 1.6, { x: 0, y: -60, z: 1.12 }], [T.c03 - 0.2, { x: -60, y: 40, z: 1.16 }], [T.name + 0.4, { x: -190, y: 120, z: 1.45 }], [A2 + 0.6, { x: -180, y: 120, z: 1.5 }]]);
  ctx.fillStyle = 'rgb(20,16,40)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(ROOF(), -PAD, -PAD / 2);
  stringLights(ctx, t);
  // 远处的客人先画（远→近）
  const arrive = i => smooth(prog(t, T.in + 0.4 + i * 0.4, T.in + 1.2 + i * 0.4)), cheer = Math.sin(Math.PI * prog(t, T.c02 + 0.2, T.c02 + 1.6));
  const order = [...GUESTS.map((g, i) => [g, i]), [XIAOLIN, 6]].sort((a, b) => b[0][2] - a[0][2]);
  for (const [[key, side, u], i] of order) {
    const a = i === 6 ? 1 : arrive(i), y = TY(u) - 6, s = lerp(2.7, 0.8, Math.pow(u, 0.7)), x = lerp(TL(u), TR(u), side ? 1.06 : -0.06);
    const stand = i === 6 ? K.vis(t, T.c03 - 0.1, T.name + 0.8, 0.3, 0.4) : 0;
    S.lit(ctx, c => MB.person(c, key, x, y + 40 * s, s, { a, flip: side === 1, bob: Math.abs(Math.sin(t * 2.6 + i)) * 5 * s * (0.3 + cheer) - stand * 26 * s, lean: (side ? -1 : 1) * (0.03 + 0.04 * cheer), warm: 0.4 }), { light: [VP[0], 300], at: [x, y - 120 * s], r: 160 * s, warm: [255, 210, 160], cool: [40, 20, 50], k: 0.8 });
  }
  longTable(ctx, t);
  // 名牌：她的位子前（C03）
  const nm = smooth(prog(t, T.name + 0.1, T.name + 0.6)); if (nm > 0.01) { const u = XIAOLIN[2], x = lerp(TL(u), TR(u), 0.16), y = TY(u) + 8; ctx.save(); ctx.globalAlpha = nm; ctx.translate(x, y - 40 * (1 - nm)); ctx.fillStyle = 'rgb(255,250,236)'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 12; S.poly(ctx, [[-80, 0], [80, 0], [66, -60], [-66, -60]]); ctx.fill(); ctx.shadowColor = 'transparent'; K.text(ctx, '小林', 0, -16, { size: 40, weight: 700, color: [150, 60, 50] }); ctx.restore(); }
  // 他：桌头迎客 → 提壶添茶沿桌走 → 写名牌、满上
  const walk = easeInOut(prog(t, T.c02 + 0.2, T.c03 - 0.2)), pour = Math.sin(Math.PI * prog(t, T.lack - 0.2, T.lack + 0.9)), write = Math.sin(Math.PI * prog(t, T.name - 0.3, T.name + 0.5)), welcome = Math.sin(Math.PI * prog(t, T.c01, T.c01 + 1.4));
  const hx = lerp(880, 840, walk), hy = lerp(1500, 1330, walk), hs = lerp(1.12, 0.96, walk);
  const R = S.lit(ctx, c => ES.hero(c, hx, hy, hs, { t, flip: true, umbrella: false, book: false, cake: false, rs: -1.3 * Math.max(welcome, pour, write, 0.4 * walk), re: -0.4 * pour, eyes: 'happy', mouth: 'grin', bob: Math.abs(Math.sin(walk * Math.PI * 4)) * 8 * (walk > 0 && walk < 1 ? 1 : 0), lean: -0.06 * pour, glow: 0.3 }), { light: [VP[0], 300], at: [hx, hy - 330], r: 360, warm: [255, 214, 160], cool: [40, 20, 50], k: 0.85 });
  // 茶壶
  if (t > T.c02) { const tx = R.hand[0] - 30, ty = R.hand[1] + 30; ctx.save(); ctx.translate(tx, ty); ctx.rotate(-0.5 * pour); ctx.fillStyle = 'rgb(240,236,226)'; ctx.beginPath(); ctx.ellipse(0, 0, 54, 44, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(214,200,180)'; ctx.beginPath(); ctx.ellipse(0, -40, 26, 10, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = 'rgb(240,236,226)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(-50, -6); ctx.quadraticCurveTo(-92, -10, -100, -40); ctx.stroke(); ctx.restore(); if (pour > 0.3) S.add(ctx, () => { for (let k = 0; k < 8; k++) glow(ctx, tx - 100 - k * 4, ty - 30 + k * 16, 8, [255, 220, 160], 0.8 * pour); }); }
  ctx.restore();
  // 前景：虚化的椅背和一束花
  ctx.save(); S.cam(ctx, C, 1.6); ctx.filter = 'blur(12px)'; ctx.fillStyle = 'rgb(60,34,40)'; ctx.beginPath(); ctx.roundRect(-220, 1300, 420, 900, 50); ctx.fill(); ctx.fillStyle = 'rgb(214,90,110)'; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(1080 + k * 40, 1260 - (k % 2) * 60, 60, 0, 6.2832); ctx.fill(); } ctx.filter = 'none'; ctx.restore();
  return { C };
}
// ================= 幕二：散场后的客厅 =================
const LIV = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  SET.walls(c, { FY: 1060, wall: [96, 80, 110], wall2: [40, 34, 60], floor: [110, 80, 76], floor2: [36, 26, 36] });
  SET.window(c, 600, 300, 380, 520, { sky: (c2, x, y, w, h) => { S.vgrad(c2, [[0, [10, 14, 40]], [1, [40, 44, 90]]], y, y + h, x, x + w); S.stars(c2, 6, [x, y, x + w, y + h * 0.5], 14, 0.8); const r = mulberry32(3); S.add(c2, () => { for (let k = 0; k < 14; k++) glow(c2, x + r() * w, y + h * 0.6 + r() * h * 0.4, 12, [255, 200, 140], 0.6); }); }, curtain: [120, 80, 120] });
  SET.shelf(c, 60, 560, 420, 9); SET.frame(c, 100, 330, 140, 170, 2); SET.frame(c, 290, 360, 110, 130, 0); SET.plant(c, 1060, 1110, 1.3, 3);
  // 沙发
  const sg = c.createLinearGradient(0, 900, 0, 1200); sg.addColorStop(0, 'rgb(120,96,140)'); sg.addColorStop(1, 'rgb(70,54,90)'); c.fillStyle = sg; c.beginPath(); c.roundRect(-40, 880, 560, 200, 46); c.fill(); c.fillStyle = 'rgb(140,112,156)'; c.beginPath(); c.roundRect(-60, 1030, 600, 120, 40); c.fill();
}));
function act2(ctx, t) {
  const C = S.camKF(t, [[A2, { x: 0, y: -40, z: 1.12, ax: 540, ay: 1000 }], [A3 + 0.6, { x: 30, y: -60, z: 1.04 }]]);
  ctx.fillStyle = 'rgb(30,26,46)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1); ctx.drawImage(LIV(), -PAD, -PAD / 2);
  SET.pendant(ctx, 300, 700, t, { k: 0.55, len: 900, shade: [200, 150, 110] });
  // 挂钟：秒针在走，分针转得飞快（独处的时间被拉长）
  X.clock(ctx, 300, 420, 110, 21 * 60 + 40 + (t - A2) * 40, 1);
  const u = prog(t, A2 + 0.2, A3 + 0.2);
  // 他：坐下 → 起来来回走 → 拿起手机看（没消息）→ 抓外套出门
  const ph = u * 4, seg = Math.floor(ph), f = ph - seg;
  const hx = [300, 300, 640, 760, 1000][Math.min(4, seg)] + ([0, 340, 120, 240, 200][Math.min(4, seg)]) * easeInOut(f) * (seg === 1 || seg === 2 || seg === 3 ? 1 : 0) * (seg === 2 ? -1 : 1) * 0 + (seg === 1 ? 340 * easeInOut(f) : seg === 2 ? 340 - 200 * easeInOut(f) : seg === 3 ? 140 + 300 * easeInOut(f) : seg >= 4 ? 440 : 0);
  const sit = seg === 0 ? 1 : 0, phoneUp = seg === 2 ? Math.sin(Math.PI * f) : 0;
  const R = S.lit(ctx, c => ES.hero(c, hx, 1300 - sit * 120, 1.0, { t, flip: seg === 2, umbrella: false, cake: false, book: false, eyes: seg === 2 ? 'open' : 'squint', mouth: 'flat', rs: -1.3 * phoneUp, re: -0.8 * phoneUp, bob: seg === 1 || seg === 3 ? Math.abs(Math.sin(f * Math.PI * 4)) * 8 : 0, look: [seg === 0 ? 2 : 0, 0.5], lean: sit * 0.04 }), { light: [300, 760], at: [hx, 1000], r: 340, warm: [255, 210, 160], cool: [20, 16, 40], k: 1 });
  if (phoneUp > 0.05) PR.phone(ctx, R.hand[0] - 10, R.hand[1] - 40, 0.5, { rot: -0.2, on: phoneUp, draw: (c, w, h) => { K.text(c, '没有新消息', w / 2, h / 2, { size: 30, weight: 600, color: [140, 150, 170] }); } });
  ctx.restore();
  return { C };
}
// ================= 幕三：医院候诊室 =================
const WROOM = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  SET.walls(c, { FY: 1000, wall: [150, 178, 184], wall2: [86, 108, 120], floor: [158, 166, 168], floor2: [52, 60, 70], stripe: 0, base: [110, 130, 130] });
  c.fillStyle = 'rgba(110,160,160,0.35)'; c.fillRect(-PAD, 760, W + PAD * 2, 240);
  SET.window(c, 80, 260, 300, 420, { sky: (c2, x, y, w, h) => { S.vgrad(c2, [[0, [110, 160, 220]], [1, [200, 216, 236]]], y, y + h, x, x + w); c2.fillStyle = 'rgba(100,160,110,0.8)'; for (let k = 0; k < 6; k++) { c2.beginPath(); c2.arc(x + 30 + k * 50, y + h - 30, 50, 0, 6.2832); c2.fill(); } }, curtain: null, frame: [240, 246, 246] });
  // 诊室门 + 门牌 + 叫号屏
  c.fillStyle = 'rgb(120,140,150)'; c.fillRect(760, 520, 260, 480); c.fillStyle = 'rgb(220,230,232)'; c.fillRect(780, 540, 220, 460); c.fillStyle = 'rgb(160,180,186)'; c.fillRect(790, 760, 10, 60);
  c.fillStyle = 'rgb(40,60,70)'; c.fillRect(780, 420, 220, 70); K.text(c, '3 诊室', 890, 468, { size: 40, weight: 700, color: [120, 240, 200] });
  c.fillStyle = 'rgb(250,250,250)'; c.fillRect(440, 380, 200, 260); c.fillStyle = 'rgba(80,150,160,0.5)'; for (let k = 0; k < 6; k++) c.fillRect(460, 410 + k * 36, 160 - (k % 2) * 40, 12);
}));
const WBEAM = S.lazy(() => SET.beamImg(500, 490, [255, 226, 176], 0.55));
const WR = [['esfp-male', 120, 1150, 1.7, 0], ['isfj-female', 990, 1130, 1.65, 1], ['enfp-male', -80, 1460, 2.4, 2], ['esfj-female', 1180, 1470, 2.4, 3]];
function chair(ctx, x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = 'rgb(70,150,170)'; ctx.beginPath(); ctx.roundRect(-80, -150, 160, 120, 24); ctx.fill(); ctx.fillStyle = 'rgb(90,176,196)'; ctx.beginPath(); ctx.roundRect(-86, -40, 172, 36, 14); ctx.fill(); ctx.fillStyle = 'rgb(140,150,160)'; ctx.fillRect(-60, -6, 10, 60); ctx.fillRect(50, -6, 10, 60); ctx.restore(); }
function act3(ctx, t) {
  const C = S.camKF(t, [[A3, { x: 60, y: 0, z: 1.12, ax: 540, ay: 1100 }], [T.c05 + 1.0, { x: 30, y: -20, z: 1.2 }], [T.c06, { x: 30, y: -20, z: 1.22 }], [T.c07 - 0.2, { x: 30, y: -30, z: 1.2 }], [T.c07 + 0.8, { x: 0, y: 0, z: 0.96 }], [T.c08 - 0.2, { x: 0, y: 0, z: 0.98 }], [T.c08 + 1.0, { x: 80, y: -60, z: 1.4 }], [T.c09, { x: 80, y: -60, z: 1.42 }], [T.c09 + 1.0, { x: 120, y: -20, z: 1.06 }], [A4 + 0.6, { x: 120, y: -20, z: 1.08 }]]);
  const gather = easeInOut(prog(t, T.c07 - 0.2, T.c07 + 1.2)) * (1 - easeInOut(prog(t, T.c08 - 0.4, T.c08 + 0.3)));
  ctx.fillStyle = 'rgb(180,200,204)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1); ctx.drawImage(WROOM(), -PAD, -PAD / 2);
  S.add(ctx, () => { glow(ctx, 230, 480, 600, [255, 220, 170], 0.16); ctx.globalAlpha = 0.55; ctx.drawImage(WBEAM(), 40, 240, 1000, 980); });
  SET.motes(ctx, t, [160, 300, 900, 1100], [255, 236, 200], 0.45, 16, 21);
  for (const x of [300, 560]) { ctx.fillStyle = 'rgb(240,250,255)'; ctx.fillRect(x - 120, 0, 240, 14); S.add(ctx, () => glow(ctx, x, 20, 420, [220, 240, 255], 0.16)); }
  // 诊室门开（C09）
  const door = easeOut(prog(t, T.c09 - 0.2, T.c09 + 0.6));
  if (door > 0.01) { ctx.fillStyle = `rgba(255,252,240,${door})`; ctx.fillRect(780, 540, 220 * door, 460); }
  // 背景里的人（凑过来）
  WR.forEach(([key, x0, y0, s, i]) => { const gx = lerp(x0, i % 2 ? 700 : 300, gather * 0.55), gy = lerp(y0, y0 - 20, gather); S.lit(ctx, c => MB.person(c, key, gx, gy, s, { flip: x0 > 540, lean: (x0 > 540 ? -1 : 1) * 0.08 * gather }), { light: [230, 480], at: [gx, gy - 260], r: 300, warm: [255, 244, 220], cool: [60, 80, 100], k: 0.7 }); });
  // 医生（C09 从诊室出来）
  if (door > 0.2) S.lit(ctx, c => MB.person(c, 'intp-female', lerp(890, 860, door), 1010, 1.75, { flip: true, a: smooth(prog(door, 0.2, 0.8)) }), { light: [890, 600], at: [880, 760], r: 260, warm: [255, 250, 240], cool: [60, 80, 100], k: 0.6 });
  // 两把椅子 + 看报纸的陌生人 + 他
  chair(ctx, 380, 1250, 1.3); chair(ctx, 640, 1250, 1.3);
  const paper = smooth(prog(t, T.c05 + 0.8, T.c06 - 0.2)), standUp = easeOut(prog(t, T.listen - 0.3, T.listen + 0.3));
  S.lit(ctx, c => MB.person(c, 'istj-male', 380, 1230, 2.2, { lean: -0.04 * paper }), { light: [230, 480], at: [380, 990], r: 300, warm: [255, 244, 220], cool: [60, 80, 100], k: 0.7 });
  // 报纸：举着 → 放下
  { const px = 420, py = lerp(900, 1080, paper); ctx.save(); ctx.translate(px, py); ctx.rotate(-0.05 + 0.3 * paper); ctx.scale(0.62, 0.62); ctx.fillStyle = 'rgb(236,232,222)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.fillRect(-150, -110, 300, 220); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(60,60,70,0.6)'; ctx.fillRect(-130, -94, 140, 26); for (let k = 0; k < 7; k++) ctx.fillRect(-130 + (k % 2) * 140, -50 + Math.floor(k / 2) * 34, 120, 10); ctx.restore(); }
  const talk = t > T.c05 && t < T.c08 ? 1 : 0, quiet = smooth(prog(t, T.quiet - 0.3, T.quiet + 0.2)) * (1 - smooth(prog(t, T.c09 + 0.2, T.c09 + 0.6)));
  const gest = [T.weather, T.price, T.kid].map(a => Math.sin(Math.PI * prog(t, a - 0.2, a + 0.9))), gmax = Math.max(...gest);
  const write = Math.sin(Math.PI * prog(t, T.listen, T.listen + 1.6)) > 0 ? 1 : 0;
  const R = S.lit(ctx, c => ES.hero(c, 660, 1290 - 110 * (1 - standUp), 1.0, { t, flip: true, umbrella: false, cake: false, book: write > 0 || standUp > 0.5, bk: -0.4 * write, eyes: quiet > 0.4 ? 'open' : standUp > 0.5 ? 'wide' : 'happy', mouth: quiet > 0.4 ? 'flat' : talk ? (Math.sin(t * 12) > 0 ? 'o' : 'grin') : 'grin', rs: -1.4 * gmax - 0.6 * write + (gest[0] > 0.1 ? -0.8 : 0), re: -0.5 * gmax, lean: -0.06 * talk * (1 - quiet) + 0.06 * standUp, nod: 0.8 * Math.max(0, Math.sin(t * 8)) * standUp, look: quiet > 0.4 ? [Math.sin(t * 3) * 2, -1] : standUp > 0.5 ? [1, 0] : [-1, 0] }), { light: [230, 480], at: [660, 1000], r: 340, warm: [255, 244, 220], cool: [60, 80, 100], k: 0.75 });
  // C06 三样具体的事
  if (gest[1] > 0.05) { ctx.save(); ctx.globalAlpha = gest[1]; ctx.translate(R.hand[0] - 30, R.hand[1] - 40); ctx.fillStyle = 'rgb(110,180,90)'; for (let k = 0; k < 4; k++) { ctx.save(); ctx.rotate(-0.4 + k * 0.25); ctx.beginPath(); ctx.ellipse(0, -60, 22, 66, 0, 0, 6.2832); ctx.fill(); ctx.restore(); } ctx.fillStyle = 'rgb(255,236,120)'; ctx.fillRect(-46, -20, 92, 48); K.text(ctx, '¥4.5', 0, 14, { size: 30, family: 'Latin', weight: 600, color: [200, 50, 40] }); ctx.restore(); }
  if (gest[2] > 0.05) PR.phone(ctx, R.hand[0] - 40, R.hand[1] - 120, 0.75, { rot: -0.15, a: gest[2], draw: (c, w, h) => { S.vgrad(c, [[0, [150, 200, 240]], [1, [250, 240, 220]]], 0, h, 0, w); MB.person(c, 'esfp-male', w / 2, h - 40, 0.9, {}); c.fillStyle = 'rgb(30,30,40)'; S.poly(c, [[w / 2 - 50, 110], [w / 2 + 50, 110], [w / 2 + 70, 126], [w / 2 - 30, 130]]); c.fill(); K.text(c, '考上啦！', w / 2, 60, { size: 30, weight: 700, color: [200, 60, 50] }); } });
  ctx.restore();
  // 窗外天气：他说到天气时，阳光一下子更亮
  return { C };
}
// ================= 幕四：窗边翻相册 =================
function album(ctx, x, y, s, t, open, page) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 12; ctx.fillStyle = 'rgb(110,60,50)'; ctx.beginPath(); ctx.roundRect(-330, -220, 660, 440, 16); ctx.fill(); ctx.shadowColor = 'transparent';
  for (const sd of [-1, 1]) { const g = ctx.createLinearGradient(0, 0, sd * 320, 0); g.addColorStop(0, 'rgb(190,170,140)'); g.addColorStop(0.1, 'rgb(240,226,196)'); g.addColorStop(1, 'rgb(226,206,170)'); ctx.fillStyle = g; ctx.fillRect(sd < 0 ? -316 : 0, -206, 316, 412); }
  const r = mulberry32(5 + page);
  [[-250, -150, 0.06], [-170, 10, -0.05], [40, -170, -0.04], [70, 0, 0.05]].forEach(([px, py, rot], i) => { ctx.save(); ctx.translate(px + 90, py + 70); ctx.rotate(rot); ctx.fillStyle = 'rgb(250,246,236)'; ctx.fillRect(-100, -80, 200, 160); const g = ctx.createLinearGradient(0, -66, 0, 50); g.addColorStop(0, rgba([[220, 170, 110], [200, 150, 120], [230, 190, 140], [190, 140, 110]][i])); g.addColorStop(1, 'rgb(120,80,60)'); ctx.fillStyle = g; ctx.fillRect(-88, -68, 176, 120);
    ctx.globalAlpha = 0.85; for (let k = 0; k < 3; k++) MB.person(ctx, MB.ALL[(page * 7 + i * 5 + k * 3) % MB.ALL.length], -50 + k * 50, 48, 0.4, { shadow: 0, gray: 0.2, warm: 0.6 }); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(160,110,60,0.22)'; ctx.fillRect(-88, -68, 176, 120); ctx.restore(); });
  ctx.restore();
}
function act4(ctx, t) {
  const C = S.camKF(t, [[A4, { x: -60, y: 60, z: 1.45, ax: 540, ay: 1100 }], [T.past + 0.6, { x: -50, y: 40, z: 1.38 }], [T.worry - 0.3, { x: 20, y: -40, z: 1.1 }], [T.end, { x: 0, y: -60, z: 1.04 }]]);
  const storm = smooth(prog(t, T.worry - 0.6, T.worry + 0.8));
  ctx.fillStyle = 'rgb(30,26,46)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1); ctx.drawImage(LIV(), -PAD, -PAD / 2);
  // 窗外：起风、乌云压过来、闪电一下（只一次）
  if (storm > 0.01) { ctx.save(); ctx.beginPath(); ctx.rect(600, 300, 380, 520); ctx.clip(); ctx.globalAlpha = storm; for (let k = 0; k < 6; k++) S.rgrad(ctx, 600 + k * 80 + Math.sin(t * 0.7 + k) * 20, 360 + (k % 2) * 60, 160, [[0, [30, 30, 50], 0.95], [0.7, [50, 50, 76], 0.8], [1, [50, 50, 76], 0]]); const fl = Math.exp(-Math.pow((t - T.worry - 0.5) * 6, 2)); ctx.fillStyle = `rgba(220,230,255,${0.6 * fl})`; ctx.fillRect(600, 300, 380, 520); ctx.translate(600, 300); S.rain(ctx, t, { box: [-20, -20, 400, 540], a: 0.9, n: 50 }); ctx.restore(); }
  // 台灯
  SET.pendant(ctx, 300, 700, t, { k: 0.7 * (1 - 0.3 * storm), len: 900, shade: [200, 150, 110] });
  const close = easeInOut(prog(t, T.worry + 0.2, T.worry + 1.3)), hx = lerp(330, 760, close);
  const R = S.lit(ctx, c => ES.hero(c, hx, 1180 + 0 * close, 1.0, { t, flip: close < 0.5, umbrella: false, cake: false, book: false, eyes: storm > 0.3 ? 'open' : 'happy', mouth: storm > 0.3 ? 'frown' : 'smile', brow: storm > 0.3 ? 1 : 0, rs: -0.6 * (1 - close) - 2.0 * smooth(prog(close, 0.8, 1)), look: storm > 0.3 ? [2, -1] : [1, 1.2], bob: Math.abs(Math.sin(close * Math.PI * 4)) * 8 * (close > 0 && close < 1 ? 1 : 0) }), { light: [300, 760], at: [hx, 900], r: 340, warm: [255, 210, 160], cool: [20, 16, 40], k: 1 });
  // 相册：膝上翻开（翻一页）
  const pg = Math.floor(clamp((t - A4) / 1.6) * 2), ao = 1 - smooth(prog(t, T.worry - 0.2, T.worry + 0.3));
  if (ao > 0.01) { ctx.save(); ctx.globalAlpha = ao; album(ctx, 470, 1130, 0.74, t, 1, pg); ctx.restore(); }
  ctx.restore();
  return { C };
}
function draw(ctx, t) {
  let st;
  if (t < A2 + 0.7) st = act1(ctx, t);
  if (t >= A2 && t < A3 + 0.7) S.group(ctx, smooth(prog(t, A2, A2 + 0.7)), c => { st = act2(c, t); });
  if (t >= A3 && t < A4 + 0.7) S.group(ctx, smooth(prog(t, A3, A3 + 0.7)), c => { st = act3(c, t); });
  if (t >= A4) S.group(ctx, smooth(prog(t, A4, A4 + 0.7)), c => { st = act4(c, t); });
  return st;
}
function over(ctx, t) {
  QT.draw(ctx, t);
  // 说话的人头上的话（C03 自我介绍、C08 那个问题、C09 医生说同一句）
  const say = (str, x, y, a0, a1, tx, ty) => { const a = K.vis(t, a0, a1, 0.2, 0.3); if (a > 0.003) PR.say(ctx, str, x, y, { a, tx, ty, size: 46 }); };
  if (t > T.c03 - 0.2 && t < T.c04) say('我叫小林', 330, 560, T.c03 - 0.1, T.name + 0.4, 250, 700);
  if (t > T.c08 - 0.3 && t < T.c09 + 2.5) { say('你说，人活着的意义是什么？', 540, 560, T.c08 - 0.1, T.c08 + 2.6, 300, 700); say('人活着，要找到自己的意义。', 600, 640, T.c09 + 0.4, T.c09 + 3.2, 860, 760); }
  if (t > T.c09 && t < T.c10) { const a = K.vis(t, T.c09 + 0.2, T.c10 - 0.2, 0.3, 0.3); if (a > 0.01) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(20,60,70,0.85)'; ctx.beginPath(); ctx.roundRect(720, 470, 220, 56, 28); ctx.fill(); K.text(ctx, '主任医师', 830, 508, { size: 32, weight: 700, color: [220, 250, 240] }); ctx.restore(); } }
}
module.exports = { draw, over, T };
