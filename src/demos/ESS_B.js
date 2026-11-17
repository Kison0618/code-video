'use strict';
// ESFJ v9 第 1 章「他家」：B01–B07
//   幕一「清晨的厨房」B01–B03（左边大窗的晨光是主光，光柱里有浮尘；墙上一排挂杯子的钩子；料理台、餐桌、吊灯）
//     B01 供给：近景，料理台上三只便当盒，他一格一格装好、一只只扣上盖子
//     B02 吃饱穿暖：镜头拉开，他把冒热气的碗一碗碗放到家人面前，给怕冷的那个披上围巾；大家动筷子了，他这才松口气笑
//     B03 归属感：门口站着一个刚来的室友，局促地抱着包；他从柜子里取出一只新杯子，挂到墙上空着的那只钩子上，再给她拉开椅子 —— 她坐下了
//   幕二「楼道」B04–B06（楼梯间：四扇门，窗外是白天；顶上一盏坏了的灯）
//     B04 护卫者四种：四扇门一扇扇开 —— 监管者看表点头、检查者只开一条缝、保护者探头笑一下；最后一扇门整个打开，他端着蛋糕出来，挨个打招呼
//     B05 可靠、帮得上忙：楼道那盏灯坏了，他踩上小凳把新灯泡拧上，暖光一点点把楼道照亮，邻居们抬头看他
//     B06 信赖权威、珍视感恩、需要安全感：他对着墙上的「住户公约」点点头；保护者递来一张写着谢谢的卡片，他珍重地钉到自家门上那一整板卡片里；回屋前把门锁拧了两圈
//   幕三「夜里的楼」B07：镜头从他家门口退到楼外，整栋楼的窗一扇扇亮着；拉远到一片楼 —— 每十扇窗里，就有一扇是和他家一样的暖金色
const X = require('./ehk');
const S = require('./ESS_kit');
const PR = require('./ESS_props');
const SET = require('./ESS_set');
const QT = require('./ESS_quote');
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('B01') - 0.9, b01: vs('B01'), b02: vs('B02'), full: at('B02', '吃饱'), b03: vs('B03'), seat: at('B03', '位置'), belong: at('B03', '归属感'), b04: vs('B04'), most: at('B04', '最随和'),
  b05: vs('B05'), help: at('B05', '帮得上忙'), b06: vs('B06'), auth: at('B06', '信赖权威'), grat: at('B06', '珍视感恩'), safe: at('B06', '安全感'), b07: vs('B07'), ten: at('B07', '每十个人'), more: at('B07', '一个以上'), end: vs('C01') };
const ACT2 = T.b04 - 0.6, ACT3 = T.b07 - 0.6;
const PAD = SET.PAD, SUN = [255, 214, 160];
// ================= 幕一：厨房 =================
const FY = 1060, GY = 1300, WIN = [70, 300, 330, 470];
const MUGX = [430, 530, 630, 730, 830], MUGY = 470, MUGC = [[236, 120, 96], [110, 170, 220], [250, 200, 90], [130, 190, 130], [214, 150, 200]];
const KIT = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  SET.walls(c, { FY, wall: [170, 126, 104], wall2: [92, 62, 62], floor: [150, 100, 70], floor2: [56, 34, 30] });
  // 墙砖（料理台后面一片白瓷砖）
  for (let j = 0; j < 5; j++) for (let i = 0; i < 9; i++) { const x = 430 + i * 74 + (j % 2) * 37, y = 690 + j * 46; c.fillStyle = 'rgba(255,250,240,0.55)'; c.fillRect(x, y, 70, 42); }
  SET.window(c, ...WIN, { sky: (c2, x, y, w, h) => { S.vgrad(c2, [[0, [120, 140, 200]], [0.55, [240, 176, 150]], [1, [250, 206, 160]]], y, y + h, x, x + w); S.add(c2, () => glow(c2, x + w * 0.6, y + h * 0.7, 200, [255, 236, 190], 0.6)); const r = mulberry32(2); for (let k = 0; k < 9; k++) { const bw = 30 + r() * 40, bh = 60 + r() * 120; c2.fillStyle = 'rgba(150,110,130,0.7)'; c2.fillRect(x + k * 40, y + h - bh, bw, bh); } }, curtain: [230, 170, 140] });
  SET.shelf(c, 440, 620, 560, 4, { jars: true });
  // 挂杯子的横杆 + 钩子
  c.fillStyle = 'rgb(120,84,64)'; c.fillRect(390, MUGY - 40, 480, 12); for (const x of MUGX) { c.strokeStyle = 'rgb(90,70,60)'; c.lineWidth = 5; c.beginPath(); c.moveTo(x, MUGY - 28); c.lineTo(x, MUGY - 6); c.arc(x - 8, MUGY - 6, 8, 0, Math.PI); c.stroke(); }
  SET.frame(c, 920, 330, 120, 150, 1);
  // 料理台（后面）：台面 + 柜门
  const cg = c.createLinearGradient(0, 960, 0, 1000); cg.addColorStop(0, 'rgb(240,232,220)'); cg.addColorStop(1, 'rgb(190,176,160)'); c.fillStyle = cg; c.fillRect(400, 960, 700, 40);
  c.fillStyle = 'rgb(110,150,150)'; c.fillRect(410, 1000, 680, 80); for (let k = 0; k < 4; k++) { c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(420 + k * 170, 1010, 160, 60); c.fillStyle = 'rgb(220,200,150)'; c.fillRect(490 + k * 170, 1030, 20, 6); }
}));
const BEAM = S.lazy(() => SET.beamImg(1200, 1200, SUN, 0.55));
// 餐桌（前景）：桌面 + 桌布 + 桌腿
function table(ctx, x0, x1, y) {
  const g = ctx.createLinearGradient(0, y - 30, 0, y + 30); g.addColorStop(0, 'rgb(250,240,226)'); g.addColorStop(1, 'rgb(210,190,170)'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x0 + 40, y - 34); ctx.lineTo(x1 - 40, y - 34); ctx.lineTo(x1, y + 30); ctx.lineTo(x0, y + 30); ctx.closePath(); ctx.fill();
  const fg = ctx.createLinearGradient(0, y + 30, 0, y + 300); fg.addColorStop(0, 'rgb(220,110,96)'); fg.addColorStop(1, 'rgb(130,56,60)'); ctx.fillStyle = fg;
  ctx.beginPath(); ctx.moveTo(x0, y + 30); ctx.lineTo(x1, y + 30); ctx.lineTo(x1, y + 220); for (let k = 9; k >= 0; k--) ctx.quadraticCurveTo(x0 + (k + 0.5) * (x1 - x0) / 10, y + 250, x0 + k * (x1 - x0) / 10, y + 220); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,220,0.25)'; for (let k = 0; k < 10; k++) ctx.fillRect(x0 + k * (x1 - x0) / 10 + 10, y + 30, 8, 190);
}
const FAM = [['isfj-female', 170, 2.3, 30], ['enfp-male', 430, 2.05, -40], ['estp-male', 670, 2.2, 0]];
const NEW = ['infp-female', 860, 2.1];
function act1(ctx, t) {
  const C = S.camKF(t, [[T.in, { x: -400, y: -560, z: 3.2, ax: 220, ay: 540 }], [T.b01 + 0.2, { x: 200, y: 40, z: 1.55 }], [T.b02 - 0.2, { x: 210, y: 40, z: 1.57 }], [T.b02 + 1.2, { x: 0, y: 0, z: 1.0 }], [T.b03, { x: 10, y: 0, z: 1.02 }], [T.b03 + 1.2, { x: 60, y: -20, z: 1.02 }], [ACT2 + 0.6, { x: 70, y: -20, z: 1.04 }]]);
  ctx.fillStyle = 'rgb(120,84,80)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(KIT(), -PAD, -PAD / 2);
  S.add(ctx, () => { ctx.globalAlpha = 0.5; ctx.drawImage(BEAM(), 120, 330, 1200, 1200); ctx.globalAlpha = 1; });
  SET.motes(ctx, t, [300, 500, 1000, 1250], SUN, 0.5, 16, 3);
  SET.pendant(ctx, 470, 640, t, { k: 0.5, len: 900, shade: [70, 120, 120] });
  // 墙上的杯子：家人四只 + 一只空钩（B03 挂上新杯子）
  const hang = easeOut(prog(t, T.seat - 0.6, T.seat + 0.2));
  MUGX.forEach((x, i) => { if (i === 4 && hang <= 0) return; const dy = i === 4 ? (1 - hang) * 120 : 0; PR.mug(ctx, x - 6, MUGY + 92 + dy, 0.62, t, { c: MUGC[i], hot: 0, rot: 0.04 * Math.sin(t + i) * (i === 4 ? (1 - hang) : 0.2) }); });
  if (hang > 0 && hang < 1.2) S.add(ctx, () => glow(ctx, MUGX[4], MUGY + 50, 160, [255, 220, 160], 0.6 * Math.sin(Math.PI * clamp(hang))));
  // 他：B01 在料理台后装便当 → B02 端碗走到桌边 → B03 去挂杯子、拉椅子
  const walk = easeInOut(prog(t, T.b02 + 0.1, T.b02 + 1.1)), toHook = easeInOut(prog(t, T.b03 + 0.3, T.seat - 0.7)), toChair = easeInOut(prog(t, T.seat + 0.3, T.belong));
  const hx = lerp(lerp(lerp(780, 980, walk), 860, toHook), 960, toChair), hy = lerp(GY - 230, GY, walk);
  const serve = [0, 1, 2].map(i => prog(t, T.b02 + 1.1 + i * 0.55, T.b02 + 1.5 + i * 0.55));
  const fillU = [0, 1, 2].map(i => prog(t, T.b01 + 0.1 + i * 0.6, T.b01 + 0.65 + i * 0.6));
  const reachK = Math.max(...fillU.map(u => Math.sin(Math.PI * u)), ...serve.map(u => Math.sin(Math.PI * u)), Math.sin(Math.PI * clamp(hang * 1.2)), Math.sin(Math.PI * prog(t, T.belong - 0.4, T.belong + 0.3)));
  const happy = smooth(prog(t, T.full, T.full + 0.6));
  const R = S.lit(ctx, c => ES.hero(c, hx, hy, 1.0, { t, flip: true, umbrella: false, cake: false, book: false, rs: -1.2 * reachK - (hang > 0 && hang < 1 ? 1.0 : 0), re: -0.4 * reachK, eyes: happy > 0.5 ? 'happy' : 'open', mouth: happy > 0.5 ? 'grin' : 'smile', lean: -0.06 * reachK, bob: Math.abs(Math.sin((walk + toHook + toChair) * Math.PI * 3)) * 8 * ((walk > 0 && walk < 1) || (toHook > 0 && toHook < 1) || (toChair > 0 && toChair < 1) ? 1 : 0), glow: 0.35 * happy }), { light: [WIN[0] + 160, WIN[1] + 200], at: [hx, hy - 300], r: 340, warm: SUN, cool: [60, 30, 40], k: 0.85 });
  // 料理台前沿（遮住他下半身，B01 时）
  if (walk < 1) { ctx.save(); ctx.globalAlpha = 1 - walk; const g = ctx.createLinearGradient(0, 1000, 0, 1060); g.addColorStop(0, 'rgb(240,232,220)'); g.addColorStop(1, 'rgb(200,186,170)'); ctx.fillStyle = g; ctx.fillRect(400, 1000, 700, 50); ctx.fillStyle = 'rgb(100,140,140)'; ctx.fillRect(410, 1050, 680, 260); ctx.restore(); }
  // B01：台面上三只便当，一只只装好扣上
  fillU.forEach((u, i) => { const lx = 500 + i * 250; PR.lunchbox(ctx, lx, 1030, 1.0, { lid: smooth(prog(u, 0.6, 1)), c: [[96, 180, 170], [236, 140, 110], [140, 170, 230]][i], a: 1 - walk }); });
  // 家人（在餐桌后面）+ 新来的室友
  const seated = easeInOut(prog(t, T.belong - 0.3, T.belong + 0.6)), nx = lerp(1180, 900, easeOut(prog(t, T.b03 - 0.4, T.b03 + 0.6))) - seated * 0, ny = lerp(GY, GY - 30, seated);
  const FP = []; FAM.forEach(([key, x, s, dy], i) => { const eat = smooth(prog(t, T.b02 + 1.5 + i * 0.55, T.b02 + 2.2 + i * 0.55)), arr = smooth(prog(t, T.b02 - 0.2 + i * 0.2, T.b02 + 0.5 + i * 0.2)); if (arr <= 0.01) return; FP[i] = S.lit(ctx, c => MB.person(c, key, x - (1 - arr) * 120, GY - 40 + dy, s, { a: arr, bob: Math.sin(t * 2.4 + i) * 3 * eat, lean: 0.05 * eat * Math.sin(t * 3 + i), warm: 0.3 * eat }), { light: [WIN[0] + 160, WIN[1] + 200], at: [x, GY - 300], r: 300, warm: SUN, cool: [60, 30, 40], k: 0.8 }); });
  if (t > T.b03 - 0.5) S.lit(ctx, c => MB.person(c, NEW[0], nx, ny, NEW[2], { flip: true, lean: lerp(0.05, 0, seated), gray: 0.3 * (1 - smooth(prog(t, T.seat, T.belong + 0.4))) }), { light: [WIN[0] + 160, WIN[1] + 200], at: [nx, ny - 280], r: 300, warm: SUN, cool: [60, 30, 40], k: 0.8 });
  ctx.save(); ctx.globalAlpha = smooth(prog(t, T.b02 - 0.3, T.b02 + 0.5)); table(ctx, 40, 1000, 1190); ctx.restore();
  // 碗：一碗碗放到大家面前
  FAM.forEach(([, x], i) => { const u = serve[i]; if (u <= 0) return; const e = easeOut(u), bx = lerp(R.hand[0], x + 20, e), by = lerp(R.hand[1] + 30, 1186, e) - Math.sin(e * Math.PI) * 60; PR.bowl(ctx, bx, by, 0.7, t, { fill: 1 - 0.4 * smooth(prog(t, T.b02 + 2.5 + i * 0.5, T.b03 + 1.5)), soup: i === 1 }); });
  if (seated > 0.5) PR.mug(ctx, nx - 40, 1186, 0.5, t, { c: MUGC[4], hot: 1 });
  // 围巾：给怕冷的那位披上
  const sc = easeInOut(prog(t, T.full + 0.2, T.full + 0.9)); if (sc > 0 && FP[0]) PR.scarf(ctx, lerp(R.hand[0], FP[0].chest[0], sc), lerp(R.hand[1], FP[0].chest[1] - 60, sc), 0.7, t, { c: [214, 72, 70] });
  ctx.restore();
  // 前景：虚化的椅背（让纵深出来）
  ctx.save(); S.cam(ctx, C, 1.5); ctx.filter = 'blur(10px)'; ctx.fillStyle = 'rgb(70,40,36)'; ctx.beginPath(); ctx.roundRect(-120, 1340, 360, 700, 40); ctx.fill(); ctx.filter = 'none'; ctx.restore();
  return { C };
}
// ================= 幕二：楼道 =================
const DOORS = [['estj-male', '监管者', 'ESTJ'], ['istj-male', '检查者', 'ISTJ'], ['isfj-female', '保护者', 'ISFJ'], ['esfj', '供给者', 'ESFJ']];
const DX = [150, 410, 670, 930], DW = 210, DH = 430, DB = 1080, BULB = [540, 300];
const HALL = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  SET.walls(c, { FY: DB, wall: [184, 156, 132], wall2: [96, 78, 80], floor: [150, 128, 110], floor2: [52, 44, 50], stripe: 0.035, base: [90, 70, 64] });
  { const g = c.createLinearGradient(0, -PAD, 0, 260); g.addColorStop(0, 'rgba(16,12,20,0.6)'); g.addColorStop(1, 'rgba(16,12,20,0)'); c.fillStyle = g; c.fillRect(-PAD, -PAD, W + PAD * 2, 560); for (const [x0, x1] of [[-PAD, 160], [W + PAD, W - 160]]) { const h = c.createLinearGradient(x0, 0, x1, 0); h.addColorStop(0, 'rgba(16,12,20,0.5)'); h.addColorStop(1, 'rgba(16,12,20,0)'); c.fillStyle = h; c.fillRect(Math.min(x0, x1), -PAD, Math.abs(x1 - x0), DB + PAD); } }
  c.fillStyle = 'rgba(80,100,90,0.35)'; c.fillRect(-PAD, 760, W + PAD * 2, DB - 760); c.fillStyle = 'rgba(60,70,64,0.4)'; c.fillRect(-PAD, 756, W + PAD * 2, 6);
  // 住户公约（墙上的告示板）
  c.fillStyle = 'rgb(120,90,60)'; c.fillRect(-250, 420, 260, 330); c.fillStyle = 'rgb(250,246,232)'; c.fillRect(-236, 434, 232, 302); K.text(c, '住户公约', -120, 490, { size: 40, weight: 700, color: [150, 50, 40] }); for (let k = 0; k < 6; k++) { c.fillStyle = 'rgba(80,80,90,0.4)'; c.fillRect(-214, 530 + k * 30, 190 - (k % 2) * 30, 8); }
  // 门框
  DX.forEach(x => { c.fillStyle = 'rgb(70,60,60)'; c.fillRect(x - DW / 2 - 16, DB - DH - 16, DW + 32, DH + 16); c.fillStyle = 'rgb(30,26,30)'; c.fillRect(x - DW / 2, DB - DH, DW, DH); });
  // 他家门口：门边一块软木板，钉满了别人写的谢谢卡片
  c.fillStyle = 'rgb(176,130,90)'; c.fillRect(1080, 560, 190, 260); const r = mulberry32(8); for (let k = 0; k < 9; k++) { c.save(); c.translate(1100 + (k % 3) * 56 + r() * 10, 590 + Math.floor(k / 3) * 76 + r() * 10); c.rotate((r() - 0.5) * 0.3); c.fillStyle = rgba([[255, 240, 190], [255, 210, 210], [210, 236, 255]][k % 3]); c.fillRect(0, 0, 48, 56); c.fillStyle = 'rgb(214,70,70)'; c.beginPath(); c.arc(24, 6, 5, 0, 6.2832); c.fill(); c.restore(); }
}));
function doorLeaf(ctx, x, open, plate, en, a = 1) {
  const w = DW * (1 - 0.82 * open), y = DB - DH; const g = ctx.createLinearGradient(x - DW / 2, 0, x - DW / 2 + w, 0); g.addColorStop(0, 'rgb(150,100,70)'); g.addColorStop(1, 'rgb(100,64,46)');
  if (open > 0.01) { const ig = ctx.createLinearGradient(0, y, 0, DB); ig.addColorStop(0, 'rgb(255,226,180)'); ig.addColorStop(1, 'rgb(220,150,100)'); ctx.fillStyle = ig; ctx.globalAlpha = smooth(open); ctx.fillRect(x - DW / 2, y, DW, DH); ctx.globalAlpha = 1; S.add(ctx, () => S.rgrad(ctx, x, DB + 40, 260, [[0, [255, 214, 150], 0.4 * open], [1, [255, 214, 150], 0]], 0.25)); }
  ctx.fillStyle = g; ctx.fillRect(x - DW / 2, y, w, DH);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 5; ctx.strokeRect(x - DW / 2 + w * 0.14, y + 40, w * 0.72, DH * 0.38); ctx.strokeRect(x - DW / 2 + w * 0.14, y + DH * 0.52, w * 0.72, DH * 0.38);
  ctx.fillStyle = 'rgb(230,196,110)'; ctx.beginPath(); ctx.arc(x - DW / 2 + w * 0.86, y + DH * 0.52, 9, 0, 6.2832); ctx.fill();
  if (open < 0.5) { const pw = 150, ph = 70, px = x - DW / 2 + w / 2, py = y - 58; const pg = ctx.createLinearGradient(0, py, 0, py + ph); pg.addColorStop(0, 'rgb(244,220,150)'); pg.addColorStop(1, 'rgb(170,130,60)'); ctx.fillStyle = pg; ctx.fillRect(px - pw / 2, py, pw, ph); }
}
function act2(ctx, t) {
  const C = S.camKF(t, [[ACT2, { x: 60, y: -40, z: 1.06, ax: 540, ay: 1000 }], [T.most - 0.2, { x: 70, y: -30, z: 1.0 }], [T.b05 - 0.1, { x: 60, y: -60, z: 1.04 }], [T.b05 + 1.0, { x: 0, y: -160, z: 1.2 }], [T.b06 - 0.1, { x: 0, y: -150, z: 1.2 }], [T.auth + 0.6, { x: -160, y: -60, z: 1.08 }], [T.grat + 0.4, { x: 180, y: -40, z: 1.2 }], [ACT3 + 0.6, { x: 260, y: -40, z: 1.34 }]]);
  const lamp = smooth(prog(t, T.help - 0.3, T.help + 1.1));
  ctx.fillStyle = 'rgb(90,86,84)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(HALL(), -PAD, -PAD / 2);
  // 楼梯间左边窗户斜照进来的白天的光（主光源之一，灯亮之前就有）
  S.add(ctx, () => { ctx.globalAlpha = 0.45; ctx.drawImage(BEAM(), -360, -120, 1300, 1300); }); SET.motes(ctx, t, [0, 200, 700, DB], SUN, 0.35, 14, 31);
  // 楼道很暗 → 灯亮了
  ctx.fillStyle = `rgba(14,14,30,${0.5 * (1 - lamp)})`; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
  ctx.fillStyle = 'rgb(60,56,60)'; ctx.fillRect(BULB[0] - 3, 0, 6, BULB[1] - 30); ctx.beginPath(); ctx.ellipse(BULB[0], BULB[1] - 26, 30, 10, 0, 0, 6.2832); ctx.fill();
  const bulbIn = easeOut(prog(t, T.b05 + 0.6, T.help - 0.2));
  if (bulbIn > 0) { ctx.save(); ctx.translate(BULB[0], BULB[1] + (1 - bulbIn) * 90); ctx.fillStyle = rgba(mix([220, 226, 236], [255, 240, 200], lamp)); ctx.beginPath(); ctx.arc(0, 20, 30, 0, 6.2832); ctx.fill(); ctx.restore(); }
  if (lamp > 0.01) S.add(ctx, () => { glow(ctx, BULB[0], BULB[1] + 20, 1100, [255, 206, 140], 0.36 * lamp); glow(ctx, BULB[0], BULB[1] + 20, 120, [255, 246, 220], 0.9 * lamp); S.rgrad(ctx, 540, DB + 60, 600, [[0, [255, 214, 150], 0.3 * lamp], [1, [255, 214, 150], 0]], 0.22); });
  // 四扇门
  const op = [0, 1, 2, 3].map(i => easeOut(prog(t, ACT2 + 0.5 + i * 0.75, ACT2 + 1.1 + i * 0.75)));
  op[1] = Math.min(op[1], 0.35);   // 检查者只开一条缝
  DX.forEach((x, i) => doorLeaf(ctx, x, op[i], DOORS[i][1], DOORS[i][2]));
  // 邻居：从门里出来，站成前后错落的半圈
  const L0 = lamp > 0.3 ? BULB : [1400, 300];
  const NB = [[0, 230, DB + 150, 2.35], [1, 410, DB + 20, 1.95], [2, 720, DB + 90, 2.15]];
  const gather = easeInOut(prog(t, T.most - 0.3, T.most + 1.0));
  NB.forEach(([i, gx, gy, s]) => { const o = op[i]; if (o <= 0.05) return; const x = lerp(DX[i], gx, i === 1 ? 0.1 : gather), y = lerp(DB, gy, i === 1 ? 0.2 : gather), sc = lerp(1.85, s, i === 1 ? 0.2 : gather);
    S.lit(ctx, c => MB.person(c, DOORS[i][0], x, y, sc, { a: smooth(o * 2), flip: x > 600, warm: 0.4 * lamp, bob: Math.abs(Math.sin(t * 2 + i)) * 2 }), { light: L0, at: [x, y - 260], r: 300, warm: [255, 220, 170], cool: [30, 30, 50], k: 0.8 }); });
  // 他：从最后一扇门出来，端着蛋糕，走到中间；B05 踩凳子拧灯泡；B06 钉卡片、锁门
  const out = easeOut(prog(t, ACT2 + 2.75, T.most + 0.2)), toStool = easeInOut(prog(t, T.b05 - 0.1, T.b05 + 0.6)), up = easeOut(prog(t, T.b05 + 0.5, T.b05 + 0.9)) * (1 - easeIn(prog(t, T.help + 1.0, T.help + 1.5)));
  const toBoard = easeInOut(prog(t, T.grat - 0.2, T.grat + 0.6)), lock = prog(t, T.safe - 0.2, T.safe + 1.4);
  const hx = lerp(lerp(lerp(DX[3], 760, out), BULB[0] + 60, toStool), 1010, toBoard), hy = lerp(DB, DB + 150, out) - up * 170;
  if (up > 0.01 || toStool > 0.5) { ctx.fillStyle = 'rgb(160,110,70)'; ctx.fillRect(BULB[0] - 30, DB + 150 - 170, 180, 22); ctx.fillStyle = 'rgb(120,80,50)'; ctx.fillRect(BULB[0] - 20, DB + 150 - 150, 18, 150); ctx.fillRect(BULB[0] + 120, DB + 150 - 150, 18, 150); }
  const reachUp = up * (1 - easeIn(prog(t, T.help + 0.8, T.help + 1.2))), turn = lock > 0 && lock < 1 ? Math.sin(lock * Math.PI * 4) : 0, pin = Math.sin(Math.PI * prog(t, T.grat + 0.5, T.grat + 1.4)), nod = Math.sin(Math.PI * prog(t, T.auth - 0.1, T.auth + 0.9));
  if (out > 0.02) S.lit(ctx, c => ES.hero(c, hx, hy, 1.0, { t, flip: hx > 900 || t < T.most, umbrella: false, book: false, cake: t < T.b05 - 0.1, rs: -2.6 * reachUp - 1.0 * pin - 0.9 * Math.abs(turn), re: -0.6 * reachUp + 0.4 * turn, eyes: lamp > 0.6 && t < T.b06 ? 'happy' : 'open', mouth: 'grin', nod: 0.8 * nod, look: nod > 0.1 ? [-2, 0] : [0, 0], bob: Math.abs(Math.sin(out * Math.PI * 3)) * 8 * (out < 1 ? 1 : 0), glow: 0.3 * lamp }), { light: L0, at: [hx, hy - 300], r: 340, warm: [255, 220, 170], cool: [30, 30, 50], k: 0.85 });
  // 卡片：保护者递来 → 钉到板上
  const card = prog(t, T.grat - 0.4, T.grat + 1.0); if (card > 0 && card < 1.5) { const e = easeInOut(clamp(card)), cx = lerp(700, 1150, e), cy = lerp(DB - 200, 700, e) - Math.sin(e * Math.PI) * 80; ctx.save(); ctx.translate(cx, cy); ctx.rotate(0.1 - 0.15 * e); ctx.fillStyle = 'rgb(255,236,200)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.fillRect(-46, -54, 92, 108); ctx.shadowColor = 'transparent'; K.text(ctx, '谢谢', 0, 12, { size: 34, weight: 700, color: [200, 80, 60] }); ctx.restore(); if (e >= 1) S.add(ctx, () => glow(ctx, cx, cy, 120, [255, 220, 160], 0.6 * (1 - clamp(card - 1) * 2))); }
  // 他家的门：B06 最后锁上（门缝的光被关掉）
  ctx.restore();
  return { C };
}
// ================= 幕三：夜里的楼 =================
const COLS = 6, ROWS = 9, BW2 = 140, BH2 = 170, GX0 = 120, GY0 = 160;
const ESFJW = new Set([[1, 2], [4, 4], [2, 6], [5, 1], [0, 7]].map(([i, j]) => i + '_' + j));
function facade(c, x0, y0, cols, rows, seed, sc = 1) {
  const r = mulberry32(seed);
  const g = c.createLinearGradient(x0, 0, x0 + cols * 170 * sc, 0); g.addColorStop(0, 'rgb(52,48,84)'); g.addColorStop(1, 'rgb(30,30,60)'); c.fillStyle = g; c.fillRect(x0 - 40 * sc, y0 - 60 * sc, cols * 170 * sc + 60 * sc, rows * 210 * sc + 200 * sc);
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { const x = x0 + i * 170 * sc, y = y0 + j * 210 * sc, w = BW2 * sc, h = BH2 * sc, on = r() < 0.4;
    c.fillStyle = 'rgb(24,22,44)'; c.fillRect(x - 8 * sc, y - 8 * sc, w + 16 * sc, h + 16 * sc);
    const wc = r() < 0.6 ? [180, 200, 240] : [240, 210, 170]; const wg = c.createLinearGradient(0, y, 0, y + h); wg.addColorStop(0, on ? rgba(mix(wc, [255, 255, 255], 0.2), 0.85) : 'rgb(40,44,80)'); wg.addColorStop(1, on ? rgba(mix(wc, [60, 60, 100], 0.4), 0.85) : 'rgb(22,24,50)'); c.fillStyle = wg; c.fillRect(x, y, w, h);
    if (on) { for (const sd of [0, 1]) { const cw = w * (0.16 + r() * 0.12), cx = sd ? x + w - cw : x, cg = c.createLinearGradient(cx, 0, cx + cw, 0); const cc = r() < 0.5 ? [200, 120, 110] : [150, 170, 200]; cg.addColorStop(0, rgba(mix(cc, [40, 30, 50], 0.45), 0.9)); cg.addColorStop(0.5, rgba(cc, 0.9)); cg.addColorStop(1, rgba(mix(cc, [40, 30, 50], 0.45), 0.9)); c.fillStyle = cg; c.fillRect(cx, y, cw, h); } S.add(c, () => glow(c, x + w / 2, y + h * 0.4, w * 0.9, wc, 0.35)); if (r() < 0.35) { c.fillStyle = 'rgba(40,30,40,0.7)'; c.beginPath(); c.ellipse(x + w * (0.35 + r() * 0.3), y + h * 0.62, w * 0.12, h * 0.2, 0, 0, 6.2832); c.fill(); c.beginPath(); c.arc(x + w * 0.5, y + h * 0.36, w * 0.09, 0, 6.2832); c.fill(); } }
    else { c.fillStyle = 'rgba(150,160,220,0.12)'; S.poly(c, [[x + w * 0.1, y + h], [x + w * 0.35, y + h], [x + w * 0.9, y], [x + w * 0.65, y]]); c.fill(); }
    c.fillStyle = 'rgb(24,22,44)'; c.fillRect(x + w / 2 - 3 * sc, y, 6 * sc, h); c.fillStyle = 'rgb(70,66,100)'; c.fillRect(x - 14 * sc, y + h + 6 * sc, w + 28 * sc, 10 * sc); c.fillStyle = 'rgba(255,240,220,0.18)'; c.fillRect(x - 14 * sc, y + h + 6 * sc, w + 28 * sc, 3 * sc); }
}
const BLD = S.lazy(() => S.bake(W + PAD * 2, 2400, c => { c.translate(PAD, 300); facade(c, GX0, GY0, COLS, ROWS, 41); }));
const CITY = S.lazy(() => S.bake(W * 3, 2600, c => { const r = mulberry32(77); S.vgrad(c, [[0, [8, 10, 30]], [0.6, [30, 30, 70]], [1, [80, 56, 90]]], 0, 2600, 0, W * 3); S.stars(c, 4, [0, 0, W * 3, 900], 120, 0.8); for (let k = 0; k < 9; k++) { const x = k * 360 + r() * 60, top = 600 + r() * 700; facade(c, x, top, 2, 9, 50 + k, 1.0); } }));
function act3(ctx, t) {
  const u = prog(t, ACT3, T.end + 0.2), pull = easeInOut(prog(t, ACT3 + 0.2, T.more + 0.6)), z = lerp(2.6, 0.52, pull);
  ctx.fillStyle = 'rgb(10,12,30)'; ctx.fillRect(0, 0, W, H);
  // 远处的城市（拉远时才出现）
  const ca = smooth(prog(pull, 0.45, 0.9));
  if (ca > 0.01) { ctx.save(); ctx.globalAlpha = ca; const cz = lerp(1.1, 0.74, pull); ctx.translate(540, 900); ctx.scale(cz, cz); ctx.translate(-W * 1.5, -1300); ctx.drawImage(CITY(), 0, 0);
    // 城里每十扇窗里一扇是暖金色
    const r = mulberry32(77); for (let k = 0; k < 9; k++) { const x = k * 360 + r() * 60, top = 600 + r() * 700; for (let j = 0; j < 9; j++) for (let i = 0; i < 2; i++) { if (hash(k * 31 + i * 7 + j * 3) > 0.12) continue; const on = smooth(prog(t, T.ten - 0.2 + hash(k + i + j) * 0.9, T.ten + 0.4 + hash(k + i + j) * 0.9)); const wx = x + i * 170, wy = top + j * 210; ctx.fillStyle = `rgba(255,204,120,${on})`; ctx.fillRect(wx, wy, BW2, BH2); ctx.fillStyle = 'rgb(24,22,44)'; ctx.fillRect(wx + BW2 / 2 - 3, wy, 6, BH2); S.add(ctx, () => glow(ctx, wx + 70, wy + 85, 260, [255, 190, 110], 0.5 * on)); } }
    ctx.restore(); }
  // 他住的这栋楼（从他家窗口开始往后退）
  ctx.save(); const tx = GX0 + 1 * 170 + BW2 / 2, ty = GY0 + 2 * 210 + BH2 / 2 + 300 - PAD * 0; ctx.translate(540, 860); ctx.scale(z, z); ctx.translate(-(tx + PAD - PAD), -(ty));
  ctx.drawImage(BLD(), -PAD, 0);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) { if (!ESFJW.has(i + '_' + j)) continue; const x = GX0 + i * 170, y = GY0 + j * 210 + 300, mine = i === 1 && j === 2, on = mine ? 1 : smooth(prog(t, T.ten - 0.3 + (i + j) * 0.12, T.ten + 0.3 + (i + j) * 0.12));
    const wg = ctx.createLinearGradient(0, y, 0, y + BH2); wg.addColorStop(0, `rgba(255,232,180,${on})`); wg.addColorStop(1, `rgba(255,170,100,${on})`); ctx.fillStyle = wg; ctx.fillRect(x, y, BW2, BH2);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, BW2, BH2); ctx.clip(); ctx.globalAlpha = on; ES.hero(ctx, x + 70, y + BH2 + 20, 0.24, { umbrella: false, book: false, cake: true, dim: 0.85, flame: false }); ctx.restore();
    ctx.fillStyle = 'rgb(24,22,44)'; ctx.fillRect(x + BW2 / 2 - 3, y, 6, BH2); S.add(ctx, () => glow(ctx, x + BW2 / 2, y + BH2 / 2, 260, [255, 196, 120], 0.45 * on)); }
  ctx.restore();
  S.rain(ctx, t, { a: 0.0 });
  return { C: { x: 0, y: 0, z: 1 } };
}
function draw(ctx, t) {
  let st;
  if (t < ACT2 + 0.7) st = act1(ctx, t);
  if (t >= ACT2) S.group(ctx, smooth(prog(t, ACT2, ACT2 + 0.7)), c => { if (t < ACT3 + 0.7) st = act2(c, t); });
  if (t >= ACT3) S.group(ctx, smooth(prog(t, ACT3, ACT3 + 0.7)), c => { st = act3(c, t); });
  return st;
}
function over(ctx, t) {
  QT.draw(ctx, t);
  // 幕二：门牌上的字（物件上的字，跟着镜头）
  if (t > ACT2 && t < ACT3 + 0.7) { const a = smooth(prog(t, ACT2, ACT2 + 0.7)) * (1 - smooth(prog(t, ACT3, ACT3 + 0.7))); const C = S.camKF(t, [[ACT2, { x: 60, y: -40, z: 1.06, ax: 540, ay: 1000 }], [T.most - 0.2, { x: 70, y: -30, z: 1.0 }], [T.b05 - 0.1, { x: 60, y: -60, z: 1.04 }], [T.b05 + 1.0, { x: 0, y: -160, z: 1.2 }], [T.b06 - 0.1, { x: 0, y: -150, z: 1.2 }], [T.auth + 0.6, { x: -160, y: -60, z: 1.08 }], [T.grat + 0.4, { x: 180, y: -40, z: 1.2 }], [ACT3 + 0.6, { x: 260, y: -40, z: 1.34 }]]);
    DOORS.forEach(([, zh, en], i) => { const op = easeOut(prog(t, ACT2 + 0.5 + i * 0.75, ACT2 + 1.1 + i * 0.75)); if (op > 0.5 && i !== 1) return; const p = S.w2s(C, DX[i], DB - DH - 28); ctx.save(); ctx.globalAlpha = a; K.text(ctx, zh, p[0], p[1] - 4 * C.z, { size: 30 * C.z, weight: 700, color: [80, 50, 20] }); K.text(ctx, en, p[0], p[1] + 26 * C.z, { size: 22 * C.z, family: 'Latin', weight: 600, color: [100, 70, 30], spacing: 0.1 }); ctx.restore(); }); }
}
module.exports = { draw, over, T };
