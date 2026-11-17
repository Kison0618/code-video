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
const AA = require('./ESS_A');
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('B01') - 0.9, b01: vs('B01'), b02: vs('B02'), full: at('B02', '吃饱'), b03: vs('B03'), seat: at('B03', '位置'), belong: at('B03', '归属感'), b04: vs('B04'), most: at('B04', '最随和'), social: at('B04', '最好交际'), respect: at('B05', '值得尊重'),
  b05: vs('B05'), help: at('B05', '帮得上忙'), b06: vs('B06'), auth: at('B06', '信赖权威'), grat: at('B06', '珍视感恩'), safe: at('B06', '安全感'), b07: vs('B07'), ten: at('B07', '每十个人'), more: at('B07', '一个以上'), end: vs('C01') };
const ACT2 = T.b04 - 0.6, ACT3 = T.b07 - 0.3;
const PAD = SET.PAD, SUN = [255, 214, 160];
// ================= 幕一：厨房 =================
const FY = 1060, GY = 1300, WIN = [70, 300, 330, 470];
const MUGX = [430, 530, 630, 730, 830], MUGY = 470, MUGC = [[236, 120, 96], [110, 170, 220], [250, 200, 90], [130, 190, 130], [214, 150, 200]];
const KIT = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  SET.walls(c, { FY, wall: [170, 126, 104], wall2: [92, 62, 62], floor: [150, 100, 70], floor2: [56, 34, 30] });
  // 墙砖（料理台后面一片白瓷砖）
  c.fillStyle = 'rgba(120,100,90,0.35)'; c.fillRect(420, 684, 680, 236); for (let j = 0; j < 5; j++) for (let i = -1; i < 10; i++) { const x = 430 + i * 74 + (j % 2) * 37, y = 690 + j * 46; if (x < 420 || x > 1030) continue; const tg = c.createLinearGradient(x, y, x, y + 42); tg.addColorStop(0, 'rgba(255,252,246,0.85)'); tg.addColorStop(1, 'rgba(226,214,200,0.85)'); c.fillStyle = tg; c.beginPath(); c.roundRect(x, y, 68, 40, 8); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(x + 8, y + 4, 40, 4); }
  SET.window(c, ...WIN, { sky: (c2, x, y, w, h) => { S.vgrad(c2, [[0, [120, 140, 200]], [0.55, [240, 176, 150]], [1, [250, 206, 160]]], y, y + h, x, x + w); S.add(c2, () => glow(c2, x + w * 0.6, y + h * 0.7, 180, [255, 226, 180], 0.3)); const r = mulberry32(2); c2.save(); c2.filter = 'blur(4px)'; c2.fillStyle = 'rgba(150,110,130,0.55)'; c2.beginPath(); c2.moveTo(x, y + h); for (let k = 0; k <= 8; k++) { const bx = x + k * w / 8, bh = 50 + r() * 110; c2.lineTo(bx, y + h - bh); c2.lineTo(bx + w / 8, y + h - bh); } c2.lineTo(x + w, y + h); c2.fill(); c2.restore(); }, curtain: [230, 170, 140] });
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
const FAM = [['isfj-female', 150, 2.05, 30], ['enfp-male', 400, 1.85, -40], ['estp-male', 640, 1.95, 0]];
const NEW = ['infp-female', 860, 1.9];
function act1(ctx, t) {
  const C = S.camKF(t, [[T.in, { x: -400, y: -560, z: 3.2, ax: 220, ay: 540 }], [T.b01 + 0.2, { x: 200, y: 40, z: 1.55 }], [T.b02 - 0.2, { x: 210, y: 40, z: 1.57 }], [T.b02 + 1.2, { x: 0, y: 0, z: 1.0 }], [T.b03, { x: 10, y: 0, z: 1.02 }], [T.b03 + 1.2, { x: 60, y: -20, z: 1.02 }], [ACT2 + 0.6, { x: 70, y: -20, z: 1.04 }]]);
  ctx.fillStyle = 'rgb(120,84,80)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(KIT(), -PAD, -PAD / 2);
  S.add(ctx, () => { ctx.globalAlpha = 0.32; ctx.drawImage(BEAM(), 120, 330, 1200, 1200); ctx.globalAlpha = 1; });
  SET.motes(ctx, t, [300, 500, 1000, 1250], SUN, 0.5, 16, 3);
  SET.pendant(ctx, 470, 640, t, { k: 0.5, len: 900, shade: [70, 120, 120] });
  // 墙上的杯子：家人四只 + 一只空钩（B03 挂上新杯子）
  const hang = easeOut(prog(t, T.seat - 0.6, T.seat + 0.2));
  MUGX.forEach((x, i) => { if (i === 4 && hang <= 0) return; const dy = i === 4 ? (1 - hang) * 120 : 0; PR.mug(ctx, x - 6, MUGY + 92 + dy, 0.62, t, { c: MUGC[i], hot: 0, rot: 0.04 * Math.sin(t + i) * (i === 4 ? (1 - hang) : 0.2) }); });
  if (hang > 0 && hang < 1.2) S.add(ctx, () => glow(ctx, MUGX[4], MUGY + 50, 160, [255, 220, 160], 0.6 * Math.sin(Math.PI * clamp(hang))));
  // 他：B01 在料理台后装便当 → B02 端碗走到桌边 → B03 去挂杯子、拉椅子
  const walk = easeInOut(prog(t, T.b02 + 0.1, T.b02 + 1.1)), toHook = easeInOut(prog(t, T.b03 + 0.3, T.seat - 0.7)), toChair = easeInOut(prog(t, T.seat + 0.3, T.belong));
  const hx = lerp(lerp(lerp(780, 940, walk), 740, toHook), 860, toChair), hy = lerp(GY - 230, GY, walk);
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
  const seated = easeInOut(prog(t, T.belong - 0.3, T.belong + 0.6)), nx = lerp(1220, 1010, easeOut(prog(t, T.b03 - 0.4, T.b03 + 0.6))) - seated * 0, ny = lerp(GY, GY - 30, seated);
  const FP = []; FAM.forEach(([key, x, s, dy], i) => { const eat = smooth(prog(t, T.b02 + 1.5 + i * 0.55, T.b02 + 2.2 + i * 0.55)), arr = smooth(prog(t, T.b02 - 0.2 + i * 0.2, T.b02 + 0.5 + i * 0.2)); if (arr <= 0.01) return; FP[i] = S.lit(ctx, c => MB.person(c, key, x - (1 - arr) * 120, GY - 40 + dy, s, { a: arr, bob: Math.sin(t * 2.4 + i) * 3 * eat, lean: 0.05 * eat * Math.sin(t * 3 + i), warm: 0.3 * eat }), { light: [WIN[0] + 160, WIN[1] + 200], at: [x, GY - 300], r: 300, warm: SUN, cool: [60, 30, 40], k: 0.8 }); });
  if (t > T.b03 - 0.5) S.lit(ctx, c => MB.person(c, NEW[0], nx, ny, NEW[2], { flip: true, lean: lerp(0.05, 0, seated), gray: 0.3 * (1 - smooth(prog(t, T.seat, T.belong + 0.4))) }), { light: [WIN[0] + 160, WIN[1] + 200], at: [nx, ny - 280], r: 300, warm: SUN, cool: [60, 30, 40], k: 0.8 });
  ctx.save(); ctx.globalAlpha = smooth(prog(t, T.b02 - 0.3, T.b02 + 0.5)); table(ctx, 40, 1000, 1190); ctx.restore();
  // 碗：一碗碗放到大家面前
  FAM.forEach(([, x], i) => { const u = serve[i]; if (u <= 0) return; const e = easeOut(u), bx = lerp(R.hand[0], x + 20, e), by = lerp(R.hand[1] + 30, 1186, e) - Math.sin(e * Math.PI) * 60; PR.bowl(ctx, bx, by, 0.7, t, { fill: 1 - 0.4 * smooth(prog(t, T.b02 + 2.5 + i * 0.5, T.b03 + 1.5)), soup: i === 1 }); });
  if (seated > 0.5) PR.mug(ctx, nx - 40, 1186, 0.5, t, { c: MUGC[4], hot: 1 });
  // 围巾：给怕冷的那位披上
  const sc = prog(t, T.full + 0.1, T.full + 0.8); if (sc > 0 && FP[0]) { const nk = [FP[0].head[0] + 2, FP[0].head[1] + 128]; if (sc < 1) AA.flyingScarf(ctx, t, [R.hand[0], R.hand[1]], nk, easeInOut(sc)); else AA.neckScarf(ctx, nk[0], nk[1], 0.95, t, smooth(prog(t, T.full + 0.7, T.full + 1.1))); }
  ctx.restore();
  // 前景：虚化的椅背（让纵深出来）
  ctx.save(); S.cam(ctx, C, 1.5); ctx.filter = 'blur(10px)'; ctx.fillStyle = 'rgb(70,40,36)'; ctx.beginPath(); ctx.roundRect(-120, 1340, 360, 700, 40); ctx.fill(); ctx.filter = 'none'; ctx.restore();
  return { C };
}
// ================= 幕二：楼道（2026-11-17 重做） =================
//   B04 楼道里那盏灯坏了，很暗。镜头低机位沿走廊横移：每到一扇门，门打开，屋里的暖光泼到走廊上，门边的铜牌被照亮、扫过一道反光，
//       住户走出来站到走廊上（站在门外，不和门框叠）。最后一扇门是他家：门整个打开，他端着蛋糕出来 ——「最随和」；
//       「最好交际」镜头拉开成全景，邻居们朝他走过来，他挨个递蛋糕
//   B05 他搬来凳子踩上去，把新灯泡拧上：暖光从灯泡往下铺开，整条走廊亮了；邻居们抬头
//   B06 信赖权威：楼长把新的《住户公约》钉到告示板上，他凑过去一条条看、点头；
//       珍视感恩：保护者把孩子画的画递给他（画上是他端着蛋糕），他捧着看了好一会儿，转身把画挂到自家门边那面「谢谢墙」正中间 —— 墙上是这些年邻居们给他的照片、卡片、画；
//       安全感：回屋，关门，特写门锁拧了两圈、挂上链条，他背靠着门松了口气
const TY = require('./ESS_type');
const NE = require('./ESS_neon');
const CT = require('./ESS_city');
const DOORS = [['estj-male', '监管者', 'ESTJ'], ['istj-male', '检查者', 'ISTJ'], ['isfj-female', '保护者', 'ISFJ'], ['esfj', '供给者', 'ESFJ']];
const DXS = [300, 900, 1500, 2160], DW = 250, DH = 520, DB = 1150, BULB = [1830, 360], BOARD = [1800, 560, 300, 380], WALLX = 2440;
const OPEN = [ACT2 + 0.35, T.b04 + 0.35, T.b04 + 1.0, T.most - 0.45];
const HALL = S.lazy(() => S.bake(3000, 2000, c => {
  c.translate(300, 0); const r = mulberry32(12);
  // 墙：上半截暖米色、下半截深绿护墙板；顶上暗
  S.vgrad(c, [[0, [70, 58, 60]], [0.18, [168, 140, 118]], [0.55, [190, 162, 136]]], 0, 760, -300, 2700);
  S.vgrad(c, [[0, [80, 100, 88]], [1, [52, 66, 60]]], 760, DB, -300, 2700); c.fillStyle = 'rgb(120,134,110)'; c.fillRect(-300, 752, 3000, 10); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(-300, 762, 3000, 8);
  for (let x = -300; x < 2700; x += 120) { c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(x, 770, 4, DB - 770); }
  c.fillStyle = 'rgb(60,44,40)'; c.fillRect(-300, DB - 24, 3000, 24);
  // 地板：木地板，近大远小的透视线
  S.vgrad(c, [[0, [140, 104, 80]], [1, [70, 46, 40]]], DB, 2000, -300, 2700);
  for (let k = 0; k < 40; k++) { const x = -300 + k * 80; c.strokeStyle = 'rgba(40,24,20,0.3)'; c.lineWidth = 3; c.beginPath(); c.moveTo(x, DB); c.lineTo(1200 + (x - 1200) * 2.6, 2000); c.stroke(); }
  for (let j = 0; j < 8; j++) { const y = DB + Math.pow(j / 8, 1.6) * 850; c.fillStyle = 'rgba(40,24,20,0.18)'; c.fillRect(-300, y, 3000, 3); }
  // 门框（门洞里面是黑的，开门时画暖光）
  for (const x of DXS) { c.fillStyle = 'rgb(66,52,48)'; c.fillRect(x - DW / 2 - 22, DB - DH - 22, DW + 44, DH + 22); c.fillStyle = 'rgb(92,74,66)'; c.fillRect(x - DW / 2 - 22, DB - DH - 22, DW + 44, 10); c.fillStyle = 'rgb(24,18,20)'; c.fillRect(x - DW / 2, DB - DH, DW, DH); }
  // 地垫
  DXS.forEach((x, i) => { c.fillStyle = rgba([[150, 70, 60], [80, 80, 90], [120, 140, 100], [190, 120, 70]][i]); c.beginPath(); c.ellipse(x, DB + 40, 150, 26, 0, 0, 6.2832); c.fill(); });
  // 墙上的小东西：消防栓箱、电表箱、一盆绿萝（走廊有人住的样子）
  c.fillStyle = 'rgb(170,60,56)'; c.fillRect(560, 820, 120, 200); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(574, 836, 92, 70);
  c.fillStyle = 'rgb(130,128,120)'; c.fillRect(1170, 500, 150, 190); c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(1182, 512, 126, 80);
  c.fillStyle = 'rgb(150,90,60)'; c.fillRect(2680, DB - 110, 80, 110); c.fillStyle = 'rgb(70,130,80)'; for (let k = 0; k < 9; k++) { c.beginPath(); c.ellipse(2720 + (r() - 0.5) * 90, DB - 140 - r() * 90, 30, 16, r() * 3, 0, 6.2832); c.fill(); }
  // 告示板（软木 + 木框）
  const [bx, by, bw, bh] = BOARD; c.fillStyle = 'rgb(96,64,40)'; c.fillRect(bx - bw / 2 - 16, by - 16, bw + 32, bh + 32); c.fillStyle = 'rgb(186,140,96)'; c.fillRect(bx - bw / 2, by, bw, bh);
  for (let k = 0; k < 300; k++) { c.fillStyle = `rgba(90,56,30,${0.15 + r() * 0.2})`; c.fillRect(bx - bw / 2 + r() * bw, by + r() * bh, 3, 3); }
}));
// 谢谢墙：他家门边一整面墙，挂满这些年邻居们给的照片、卡片、孩子的画；正中间留一个空位
const THANKS = S.lazy(() => S.bake(560, 620, c => {
  const r = mulberry32(21);
  c.fillStyle = 'rgba(60,40,30,0.25)'; c.fillRect(0, 0, 560, 620);
  const items = [[20, 20, 150, 170, 'photo'], [190, 30, 130, 110, 'card', '谢谢你！'], [340, 16, 190, 150, 'kid'], [30, 210, 120, 150, 'card', '辛苦啦'], [380, 190, 150, 180, 'photo'], [20, 390, 170, 130, 'kid'], [210, 420, 150, 180, 'photo'], [380, 400, 160, 110, 'card', 'Thanks'], [400, 530, 120, 80, 'card', '♥']];
  for (const [x, y, w, h, k, str] of items) {
    c.save(); c.translate(x + w / 2, y + h / 2); c.rotate((r() - 0.5) * 0.16); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 10; c.shadowOffsetY = 5;
    if (k === 'photo') { c.fillStyle = 'rgb(250,248,240)'; c.fillRect(-w / 2, -h / 2, w, h); c.shadowColor = 'transparent'; const g = c.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, rgba([[250, 200, 150], [160, 200, 230], [240, 170, 160]][Math.floor(r() * 3)])); g.addColorStop(1, 'rgb(200,120,100)'); c.fillStyle = g; c.fillRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 44);
      for (let p = 0; p < 3; p++) { c.fillStyle = rgba([[90, 190, 180], [230, 120, 90], [250, 210, 110]][p]); const px = -w / 2 + 30 + p * (w - 60) / 2; c.beginPath(); c.arc(px, -h / 2 + 40 + (p % 2) * 6, 13, 0, 6.2832); c.fill(); c.beginPath(); c.roundRect(px - 16, -h / 2 + 56, 32, h - 110, 10); c.fill(); } }
    else if (k === 'kid') { c.fillStyle = 'rgb(255,252,244)'; c.fillRect(-w / 2, -h / 2, w, h); c.shadowColor = 'transparent'; c.lineCap = 'round'; c.lineWidth = 6;
      c.strokeStyle = 'rgb(255,190,60)'; c.beginPath(); c.arc(w / 2 - 34, -h / 2 + 34, 18, 0, 6.2832); c.stroke(); for (let a = 0; a < 8; a++) { c.beginPath(); c.moveTo(w / 2 - 34 + Math.cos(a) * 26, -h / 2 + 34 + Math.sin(a) * 26); c.lineTo(w / 2 - 34 + Math.cos(a) * 36, -h / 2 + 34 + Math.sin(a) * 36); c.stroke(); }
      c.strokeStyle = 'rgb(70,170,170)'; c.beginPath(); c.arc(-14, -6, 16, 0, 6.2832); c.moveTo(-14, 10); c.lineTo(-14, 46); c.moveTo(-40, 24); c.lineTo(12, 24); c.moveTo(-14, 46); c.lineTo(-30, 66); c.moveTo(-14, 46); c.lineTo(2, 66); c.stroke();
      c.strokeStyle = 'rgb(230,80,90)'; c.beginPath(); c.moveTo(30, 0); c.bezierCurveTo(30, -14, 52, -14, 52, 2); c.bezierCurveTo(52, 14, 36, 22, 30, 30); c.bezierCurveTo(24, 22, 8, 14, 8, 2); c.bezierCurveTo(8, -14, 30, -14, 30, 0); c.stroke(); }
    else { c.fillStyle = rgba([[255, 226, 150], [255, 200, 200], [200, 226, 255], [214, 236, 200]][Math.floor(r() * 4)]); c.fillRect(-w / 2, -h / 2, w, h); c.shadowColor = 'transparent';
      K.text(c, str, 0, 14, { size: str === 'Thanks' ? 44 : str === '♥' ? 50 : 38, family: str === 'Thanks' ? 'Latin' : 'ESSans', style: str === 'Thanks' ? 'italic' : 'normal', weight: str === 'Thanks' ? 500 : 700, color: [170, 60, 50] }); }
    c.restore();
    c.fillStyle = 'rgb(214,70,70)'; c.beginPath(); c.arc(x + w / 2, y + 6, 7, 0, 6.2832); c.fill();
  }
}));
// 孩子画的画：他端着蛋糕，旁边一个小人（孩子自己），太阳、爱心；歪歪扭扭的蜡笔线
function kidDrawing(ctx, x, y, s, rot, a = 1) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6; ctx.fillStyle = 'rgb(255,252,242)'; ctx.fillRect(-110, -80, 220, 160); ctx.shadowColor = 'transparent';
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = 6;
  ctx.strokeStyle = 'rgb(255,186,50)'; ctx.beginPath(); ctx.arc(76, -48, 16, 0, 6.2832); ctx.stroke();
  ctx.strokeStyle = 'rgb(60,170,170)'; ctx.beginPath(); ctx.arc(-40, -30, 18, 0, 6.2832); ctx.moveTo(-40, -12); ctx.lineTo(-40, 30); ctx.moveTo(-40, 30); ctx.lineTo(-56, 60); ctx.moveTo(-40, 30); ctx.lineTo(-24, 60); ctx.moveTo(-40, 4); ctx.lineTo(-6, -4); ctx.stroke();
  ctx.fillStyle = 'rgb(250,150,170)'; ctx.fillRect(-8, -26, 36, 22); ctx.fillStyle = 'rgb(240,90,80)'; ctx.fillRect(6, -36, 5, 10);
  ctx.strokeStyle = 'rgb(240,140,60)'; ctx.beginPath(); ctx.arc(50, 6, 12, 0, 6.2832); ctx.moveTo(50, 18); ctx.lineTo(50, 44); ctx.moveTo(50, 44); ctx.lineTo(40, 62); ctx.moveTo(50, 44); ctx.lineTo(60, 62); ctx.stroke();
  ctx.strokeStyle = 'rgb(230,70,90)'; ctx.beginPath(); ctx.moveTo(10, 30); ctx.bezierCurveTo(10, 18, 28, 18, 28, 32); ctx.bezierCurveTo(28, 42, 14, 50, 10, 56); ctx.bezierCurveTo(6, 50, -8, 42, -8, 32); ctx.bezierCurveTo(-8, 18, 10, 18, 10, 30); ctx.stroke();
  ctx.restore();
}
function doorLeaf(ctx, x, open, warmA) {
  const y = DB - DH;
  if (open > 0.01) {
    const ig = ctx.createLinearGradient(0, y, 0, DB); ig.addColorStop(0, 'rgb(255,214,160)'); ig.addColorStop(1, 'rgb(214,138,92)'); ctx.save(); ctx.globalAlpha = smooth(clamp(open * 1.5)); ctx.fillStyle = ig; ctx.fillRect(x - DW / 2, y, DW, DH);
    ctx.fillStyle = 'rgba(120,70,50,0.5)'; ctx.fillRect(x - DW / 2 + 30, y + DH * 0.55, DW * 0.5, DH * 0.45); ctx.restore(); // 屋里的家具剪影
    // 门里的光泼到走廊地上（一个梯形光斑）
    S.add(ctx, () => { ctx.save(); ctx.globalAlpha = 0.32 * warmA; const g = ctx.createLinearGradient(0, DB, 0, DB + 420); g.addColorStop(0, 'rgba(255,200,140,1)'); g.addColorStop(1, 'rgba(255,200,140,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - DW / 2, DB); ctx.lineTo(x + DW / 2, DB); ctx.lineTo(x + DW / 2 + 240, DB + 420); ctx.lineTo(x - DW / 2 - 60, DB + 420); ctx.fill(); ctx.restore(); glow(ctx, x, DB - DH / 2, 420, [255, 180, 120], 0.12 * warmA); });
  }
  const w = DW * (1 - 0.86 * open), g = ctx.createLinearGradient(x - DW / 2, 0, x - DW / 2 + w, 0); g.addColorStop(0, 'rgb(150,98,66)'); g.addColorStop(1, 'rgb(104,64,44)');
  ctx.fillStyle = g; ctx.fillRect(x - DW / 2, y, w, DH);
  ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 6; ctx.strokeRect(x - DW / 2 + w * 0.14, y + 46, w * 0.72, DH * 0.36); ctx.strokeRect(x - DW / 2 + w * 0.14, y + DH * 0.52, w * 0.72, DH * 0.38);
  ctx.fillStyle = 'rgb(232,196,110)'; ctx.beginPath(); ctx.arc(x - DW / 2 + w * 0.86, y + DH * 0.53, 11, 0, 6.2832); ctx.fill();
}
const CAM2 = [
  [ACT2, { x: 20, y: -60, z: 1.14, ax: 540, ay: 1000 }], [T.b04 + 0.4, { x: 80, y: -60, z: 1.12 }], [T.most - 0.4, { x: 1500, y: -60, z: 1.12 }, easeInOut],
  [T.most + 0.4, { x: 1460, y: -90, z: 1.3 }], [T.b05 - 0.1, { x: 1800 - 540, y: -60, z: 0.86 }], [T.help - 0.2, { x: 1800 - 540, y: -160, z: 0.96 }], [T.b06 - 0.1, { x: 1800 - 540, y: -120, z: 0.92 }],
  [T.auth + 0.1, { x: BOARD[0] - 540 - 60, y: -280, z: 1.5 }], [T.grat - 0.6, { x: BOARD[0] - 540 - 40, y: -280, z: 1.52 }], [T.grat + 0.1, { x: 2150 - 540, y: -170, z: 1.16 }], [T.grat + 0.5, { x: 2170 - 540, y: -190, z: 1.22 }], [T.safe - 0.75, { x: WALLX + 230 - 540, y: -330, z: 1.45 }],
];
function act2(ctx, t) {
  const C = S.camKF(t, CAM2);
  const lamp = smooth(prog(t, T.help - 0.35, T.help + 0.9));
  ctx.fillStyle = 'rgb(40,32,34)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(HALL(), -300, 0);
  // 灯坏着的时候走廊很暗（只有门里泼出来的光）；灯亮以后整条走廊暖起来
  ctx.fillStyle = `rgba(10,10,24,${0.55 * (1 - lamp)})`; ctx.fillRect(-300, 0, 3000, 2000);
  if (lamp > 0.01) S.add(ctx, () => { const g = ctx.createLinearGradient(0, BULB[1], 0, DB + 300); g.addColorStop(0, `rgba(255,210,150,${0.2 * lamp})`); g.addColorStop(1, 'rgba(255,210,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(BULB[0] - 40, BULB[1]); ctx.lineTo(BULB[0] + 40, BULB[1]); ctx.lineTo(BULB[0] + 900, DB + 300); ctx.lineTo(BULB[0] - 900, DB + 300); ctx.fill(); glow(ctx, BULB[0], BULB[1] + 24, 700, [255, 200, 140], 0.2 * lamp); glow(ctx, BULB[0], BULB[1] + 24, 60, [255, 240, 210], 0.6 * lamp); });
  SET.motes(ctx, t, [BULB[0] - 500, BULB[1] + 60, BULB[0] + 500, DB], [255, 226, 180], 0.4 * lamp, 14, 31);
  // 灯：灯座 + 灯泡（B05 拧上去）
  ctx.fillStyle = 'rgb(50,46,50)'; ctx.fillRect(BULB[0] - 3, 0, 6, BULB[1] - 24); ctx.beginPath(); ctx.ellipse(BULB[0], BULB[1] - 20, 36, 12, 0, 0, 6.2832); ctx.fill();
  const bulbIn = easeOut(prog(t, T.b05 + 0.6, T.help - 0.3));
  if (bulbIn > 0) { ctx.save(); ctx.translate(BULB[0], BULB[1] + (1 - bulbIn) * 70); ctx.rotate((1 - bulbIn) * 6); ctx.fillStyle = rgba(mix([210, 216, 226], [255, 236, 196], lamp)); ctx.beginPath(); ctx.arc(0, 24, 26, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(170,160,140)'; ctx.fillRect(-10, -6, 20, 16); ctx.restore(); }
  // 门 + 铜牌（门右侧墙上，大号）
  const op = OPEN.map((a, i) => easeOut(prog(t, a, a + (i === 3 ? 0.5 : 0.7)))); op[1] = Math.min(op[1], 0.45);
  DXS.forEach((x, i) => { doorLeaf(ctx, x, op[i], 1 - 0.6 * lamp); TY.plaque(ctx, x, DB - DH - 92, 236, 112, DOORS[i][1], DOORS[i][2], { p: Math.max(smooth(op[i] * 2), lamp), sweep: prog(t, OPEN[i] + 0.25, OPEN[i] + 1.05), metal: i === 3 ? [236, 180, 96] : [200, 160, 100] }); });
  // 告示板上的《住户公约》（B06）
  const pinN = easeOut(prog(t, T.b06 - 0.2, T.auth - 0.1)), rules = ['楼道保持整洁', '晚十点后请安静', '邻里互相照应'];
  if (pinN > 0) { const [bx, by, bw] = BOARD, ny = by + 30 - (1 - pinN) * 50; ctx.save(); ctx.globalAlpha = smooth(pinN * 2); ctx.translate(bx, ny + 160); ctx.rotate((1 - pinN) * 0.2 - 0.02); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6; ctx.fillStyle = 'rgb(252,248,236)'; ctx.fillRect(-bw / 2 + 20, -160, bw - 40, 320); ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgb(190,60,50)'; ctx.fillRect(-bw / 2 + 20, -160, bw - 40, 12); K.text(ctx, '住户公约', 0, -100, { size: 44, family: 'ESHeavy', weight: 900, color: [150, 44, 36], spacing: 0.12 });
    rules.forEach((ru, k) => { const ra = smooth(prog(t, T.auth - 0.2 + k * 0.3, T.auth + 0.2 + k * 0.3)); ctx.fillStyle = rgba([190, 60, 50], ra); ctx.beginPath(); ctx.arc(-bw / 2 + 50, -34 + k * 62 - 12, 6, 0, 6.2832); ctx.fill(); K.text(ctx, ru, -bw / 2 + 66, -34 + k * 62, { size: 32, family: 'ESSans', weight: 700, color: [60, 50, 50], align: 'left', alpha: ra }); });
    ctx.fillStyle = 'rgb(214,70,70)'; ctx.beginPath(); ctx.arc(0, -150, 8, 0, 6.2832); ctx.fill(); ctx.restore(); }
  // 谢谢墙（他家门右边）
  ctx.drawImage(THANKS(), WALLX, 470, 560, 620);
  // ---- 人：按站位深度排序后画，谁也不和门框/别人叠 ----
  const lit = (x, y) => ({ light: lamp > 0.3 ? BULB : [x - 200, DB - 300], at: [x, y - 260], r: 300, warm: [255, 214, 160], cool: [24, 20, 40], k: 0.85 });
  const walkTo = easeInOut(prog(t, T.social - 0.1, T.b05 + 0.4));
  // 邻居：出门站到自家门右前方 → 「最好交际」时朝他那边走过去
  const NB = [[0, 1440, DB + 210, 2.0], [1, 1600, DB + 120, 1.9], [2, 2230, DB + 200, 2.0]];
  const drawers = [];
  NB.forEach(([i, gx, gy, s]) => { const o = smooth(prog(t, OPEN[i] + 0.1, OPEN[i] + 0.45)), st = easeOut(prog(t, OPEN[i] + 0.1, OPEN[i] + 0.9)); if (o <= 0.01) return; const sx = DXS[i] + lerp(-10, 70, st), sy = lerp(DB + 10, DB + 80, st) + i * 10, x = lerp(sx, gx, walkTo), y = lerp(sy, gy, walkTo), moving = walkTo > 0 && walkTo < 1;
    const look = t > T.help && t < T.b06 ? -0.06 : 0, istjNod = i === 1 ? 0.06 * Math.sin(Math.PI * prog(t, T.respect - 0.1, T.respect + 0.8)) : 0;
    drawers.push([y, c => S.lit(c, cc => MB.person(cc, DOORS[i][0], x, y - (1 - o) * 0, s * lerp(0.94, 1, o), { a: o, flip: x > BULB[0] + 100, warm: 0.3 * lamp, lean: look + istjNod, bob: moving ? Math.abs(Math.sin(walkTo * Math.PI * 5)) * 7 : 0 }), lit(x, y))]); });
  // 他：B04 出门端蛋糕 → 递蛋糕 → B05 凳子上拧灯泡 → B06 看公约、接画、挂画
  const out = easeOut(prog(t, T.most - 0.25, T.most + 0.5)), toStool = easeInOut(prog(t, T.b05 - 0.1, T.b05 + 0.6)), up = easeOut(prog(t, T.b05 + 0.55, T.b05 + 0.95)) * (1 - easeIn(prog(t, T.help + 0.9, T.help + 1.4)));
  const toBoard = easeInOut(prog(t, T.b06 - 0.3, T.auth - 0.2)), toGift = easeInOut(prog(t, T.grat - 0.5, T.grat)), toWall = easeInOut(prog(t, T.grat + 0.4, T.safe - 1.05));
  const hx = lerp(lerp(lerp(lerp(lerp(DXS[3], 1980, out), BULB[0] + 40, toStool), BOARD[0] + 230, toBoard), 2080, toGift), WALLX + 120, toWall), hy = lerp(lerp(DB + 40, DB + 170, out), DB + 140, toWall) - up * 150;
  if (up > 0.01 || (toStool > 0.4 && toBoard < 0.6)) { const sa = 1 - smooth(prog(toBoard, 0, 0.6)); ctx.save(); ctx.globalAlpha = sa; ctx.fillStyle = 'rgb(170,116,74)'; ctx.fillRect(BULB[0] - 70, DB + 170 - 160, 200, 24); ctx.fillStyle = 'rgb(120,80,50)'; ctx.fillRect(BULB[0] - 56, DB + 170 - 136, 18, 136); ctx.fillRect(BULB[0] + 98, DB + 170 - 136, 18, 136); ctx.restore(); }
  const hand = [0, 1, 2].map(k => Math.sin(Math.PI * prog(t, T.social + 0.15 + k * 0.38, T.social + 0.5 + k * 0.38)));
  const reachUp = up * (1 - easeIn(prog(t, T.help + 0.7, T.help + 1.1))), hold = smooth(prog(t, T.grat - 0.1, T.grat + 0.2)) * (1 - smooth(prog(t, T.safe - 1.1, T.safe - 0.9))), hang = Math.sin(Math.PI * prog(t, T.safe - 1.1, T.safe - 0.6)), nod = Math.sin(Math.PI * prog(t, T.auth, T.auth + 0.9));
  let R = null;
  if (out > 0.02) drawers.push([hy, c => { R = S.lit(c, cc => ES.hero(cc, hx, hy, 0.86, { t, flip: (t < T.b05 - 0.1) || (t > T.grat - 0.3 && t < T.grat + 0.5), umbrella: false, book: false, cake: t < T.b05 - 0.1, rs: -2.6 * reachUp - 0.9 * Math.max(...hand) - 0.8 * hold - 1.6 * hang, re: -0.6 * reachUp - 0.3 * hold, eyes: hold > 0.5 ? 'happy' : 'open', mouth: hold > 0.5 ? 'smile' : 'grin', nod: 0.7 * nod + 0.35 * hold, look: t > T.b06 - 0.2 && t < T.grat - 0.3 ? [-2, -0.5] : [0, 0], bob: Math.abs(Math.sin((out + toStool + toBoard + toWall + toGift) * Math.PI * 3)) * 7 * ((out > 0 && out < 1) || (toWall > 0 && toWall < 1) || (toBoard > 0 && toBoard < 1) ? 1 : 0), glow: 0 }), lit(hx, hy)); }]);
  drawers.sort((a, b) => a[0] - b[0]).forEach(d => d[1](ctx));
  // 孩子的画：保护者递过来 → 他捧着 → 挂到谢谢墙正中间的空位
  const g0 = prog(t, T.grat - 0.5, T.grat);
  if (g0 > 0 && R) { const isfj = [lerp(2230, 2230, 1), DB + 200 - 300], e = easeInOut(g0), landed = prog(t, T.safe - 1.05, T.safe - 0.7), le = easeInOut(landed);
    const px = landed > 0 ? lerp(R.hand[0] + 40, WALLX + 290, le) : lerp(isfj[0] - 60, R.hand[0] + 40, e), py = landed > 0 ? lerp(R.hand[1] + 30, 470 + 300, le) : lerp(isfj[1], R.hand[1] + 30, e);
    kidDrawing(ctx, px, py, lerp(landed > 0 ? 1.0 : 0.8, landed > 0 ? 0.62 : 1.0, landed > 0 ? le : e), lerp(0.1, landed > 0 ? -0.04 : -0.06, e));
    if (landed >= 1) { ctx.fillStyle = 'rgb(214,70,70)'; ctx.beginPath(); ctx.arc(px, py - 46, 7, 0, 6.2832); ctx.fill(); } }
  ctx.restore();
  return { C };
}
// ---- 安全感：回屋关门，特写门锁拧两圈、挂链条，他背靠门松口气 ----
const ENTRY = S.lazy(() => S.bake(W, H, c => {
  S.vgrad(c, [[0, [120, 80, 66]], [0.6, [176, 120, 90]], [1, [90, 56, 48]]], 0, H, 0, W);
  // 门（从屋里看）：大，占画面左半
  const g = c.createLinearGradient(80, 0, 600, 0); g.addColorStop(0, 'rgb(130,82,56)'); g.addColorStop(1, 'rgb(96,58,40)'); c.fillStyle = 'rgb(70,46,36)'; c.fillRect(60, 160, 560, 1260); c.fillStyle = g; c.fillRect(84, 184, 512, 1236);
  c.strokeStyle = 'rgba(0,0,0,0.22)'; c.lineWidth = 8; c.strokeRect(140, 240, 400, 480); c.strokeRect(140, 800, 400, 520);
  // 衣帽钩 + 挂着的伞和帆布包；墙上一盏壁灯
  c.fillStyle = 'rgb(80,60,50)'; c.fillRect(700, 520, 300, 18); for (const x of [740, 830, 920]) { c.fillStyle = 'rgb(200,170,110)'; c.beginPath(); c.arc(x, 548, 10, 0, 6.2832); c.fill(); }
  c.fillStyle = 'rgb(226,206,170)'; c.beginPath(); c.moveTo(800, 560); c.lineTo(880, 560); c.lineTo(900, 720); c.lineTo(780, 720); c.closePath(); c.fill(); c.strokeStyle = 'rgb(150,120,90)'; c.lineWidth = 6; c.beginPath(); c.moveTo(812, 562); c.quadraticCurveTo(830, 520, 868, 562); c.stroke();
  S.rgrad(c, 880, 330, 420, [[0, [255, 220, 170], 0.55], [1, [255, 200, 140], 0]]); c.fillStyle = 'rgb(240,200,140)'; c.beginPath(); c.moveTo(850, 300); c.lineTo(910, 300); c.lineTo(930, 350); c.lineTo(830, 350); c.fill();
  S.vgrad(c, [[0, [110, 70, 50]], [1, [60, 36, 30]]], 1420, H, 0, W);
}));
function lockInsert(ctx, t, u) {
  // 特写：门锁（黄铜锁盘 + 旋钮），旋钮拧两圈（每圈伴一下「咔」的光圈），锁舌滑出；再挂上链条
  const cx = 540, cy = 760, turn = easeInOut(clamp(u * 1.6)) * Math.PI * 2, chain = easeOut(prog(u, 0.62, 0.95));
  ctx.fillStyle = 'rgb(112,70,48)'; ctx.fillRect(0, 0, W, H);
  const wg = ctx.createLinearGradient(0, 0, W, 0); wg.addColorStop(0, 'rgba(0,0,0,0.3)'); wg.addColorStop(0.5, 'rgba(255,220,170,0.08)'); wg.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = wg; ctx.fillRect(0, 0, W, H);
  // 门框缝 + 锁舌
  ctx.fillStyle = 'rgb(56,36,28)'; ctx.fillRect(860, 0, 40, H);
  const bolt = smooth(clamp(u * 1.6)); ctx.fillStyle = 'rgb(200,170,110)'; ctx.fillRect(700, cy - 30, 120 + bolt * 120, 60); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(700, cy - 30, 120 + bolt * 120, 10);
  // 锁盘
  ctx.save(); ctx.translate(cx, cy); ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  const pg = ctx.createRadialGradient(-60, -60, 10, 0, 0, 220); pg.addColorStop(0, 'rgb(255,226,150)'); pg.addColorStop(0.6, 'rgb(200,150,70)'); pg.addColorStop(1, 'rgb(120,80,30)'); ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(0, 0, 200, 0, 6.2832); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(80,50,20,0.6)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.arc(0, 0, 176, 0, 6.2832); ctx.stroke();
  ctx.rotate(turn); const kg = ctx.createLinearGradient(-50, 0, 50, 0); kg.addColorStop(0, 'rgb(150,100,40)'); kg.addColorStop(0.5, 'rgb(255,226,160)'); kg.addColorStop(1, 'rgb(140,90,36)'); ctx.fillStyle = kg; ctx.beginPath(); ctx.roundRect(-44, -150, 88, 300, 44); ctx.fill(); ctx.fillStyle = 'rgba(80,50,20,0.5)'; ctx.beginPath(); ctx.arc(0, 0, 26, 0, 6.2832); ctx.fill();
  ctx.restore();
  // 每拧一圈，「咔」一下：一圈金色的波纹（不是光点）
  for (const k of [0.31, 0.62]) { const p = prog(u, k, k + 0.25); if (p > 0 && p < 1) S.ring(ctx, cx, cy, 220 + p * 260, 10, [255, 220, 150], 0.45 * (1 - p)); }
  // 链条：从右边滑进来挂上
  if (chain > 0) { ctx.save(); ctx.translate(lerp(1200, 940, chain), 470); ctx.strokeStyle = 'rgb(200,190,170)'; ctx.lineWidth = 10; for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.ellipse(-k * 36, k * 12 + Math.sin(k * 0.8) * 6, 22, 12, 0.3, 0, 6.2832); ctx.stroke(); } ctx.restore(); }
}
function act2b(ctx, t) {
  const S0 = T.safe - 0.6, close = easeInOut(prog(t, S0, S0 + 0.45)), ins = K.vis(t, S0 + 0.4, ACT3 - 0.2, 0.2, 0.3);
  ctx.drawImage(ENTRY(), 0, 0);
  // 门在关：门缝里走廊的光越来越窄
  const gap = 1 - close; if (gap > 0.01) { ctx.fillStyle = 'rgb(255,214,160)'; ctx.fillRect(596, 184, 120 * gap, 1236); S.add(ctx, () => glow(ctx, 600 + 60 * gap, 800, 400, [255, 200, 140], 0.2 * gap)); }
  const lean = smooth(prog(t, ACT3 - 0.5, ACT3 + 0.4));
  S.lit(ctx, c => ES.hero(c, lerp(760, 720, lean), 1440, 1.25, { t, flip: true, umbrella: false, cake: false, book: false, rs: -1.0 * (1 - lean), re: -0.4, eyes: lean > 0.5 ? 'closed' : 'open', mouth: 'smile', lean: -0.12 * lean, nod: -0.2 * lean }), { light: [880, 330], at: [740, 1100], r: 380, warm: [255, 214, 160], cool: [50, 26, 30], k: 0.9 });
  if (ins > 0.003) S.group(ctx, ins, c => lockInsert(c, t, prog(t, S0 + 0.5, ACT3 - 0.35)));
  return { C: { x: 0, y: 0, z: 1 } };
}
// ================= 幕三：夜里的楼（反馈 7：不再是满墙小方窗） =================
//   从他家亮着的窗往后拉：先是他这栋楼（有阳台、窗帘、空调、绿植的立面），再拉远成一片楼；
//   「每十个人里就有一个」：暗着的窗里，零星的十分之一亮起和他家一样的暖金色
const BLDF = S.lazy(() => CT.facade({ cols: 4, rows: 8, uw: 280, uh: 240, seed: 41, lit: 0.22, skip: [[1, 2]], wall: [56, 50, 82] }));
const NEIGH = S.lazy(() => [0, 1, 2, 3].map(k => CT.facade({ cols: 3, rows: 9, uw: 260, uh: 230, seed: 60 + k, lit: 0.08, wall: mix([46, 42, 76], [60, 48, 70], k / 3) })));
const NSKY = S.lazy(() => CT.skyline({ w: 2400, h: 1800, seed: 9, sky: [[6, 8, 24], [40, 30, 66]], fog: [80, 56, 92], base: [20, 18, 40], lit: 0.06, ground: 1700 }));
let STARS = [];
function goldWin(ctx, x, y, uw, uh, on, mine) {
  { const m = ctx.getTransform(), cx = x + uw / 2, cy = y + uh * 0.43; STARS.push([m.a * cx + m.c * cy + m.e, m.b * cx + m.d * cy + m.f, on, mine]); }
  const ww = uw * 0.56, wh = uh * 0.62, wx = x + (uw - ww) / 2, wy = y + uh * 0.12;
  ctx.save(); ctx.globalAlpha *= on; const g = ctx.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, 'rgb(255,222,150)'); g.addColorStop(1, 'rgb(240,150,80)'); ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip(); ES.hero(ctx, wx + ww * 0.55, wy + wh + 14, wh / 560, { umbrella: false, book: false, cake: mine, dim: 0.75, flame: false }); ctx.restore();
  ctx.fillStyle = 'rgba(16,14,30,0.9)'; ctx.fillRect(wx + ww / 2 - 4, wy, 8, wh); ctx.restore();
  S.add(ctx, () => glow(ctx, wx + ww / 2, wy + wh / 2, ww * 1.6, [255, 180, 100], 0.3 * on));
}
function act3(ctx, t) {
  STARS = [];
  const pull = easeInOut(prog(t, ACT3 + 0.1, T.more + 0.5)), z = lerp(2.3, 0.6, pull);
  ctx.fillStyle = 'rgb(8,10,26)'; ctx.fillRect(0, 0, W, H);
  const F = BLDF(), N = NEIGH(), mine = [30 + 1 * F.uw + F.uw / 2, 20 + 2 * F.uh + F.uh * 0.43];
  ctx.save(); ctx.translate(540, 880); ctx.scale(z, z); ctx.translate(-mine[0], -mine[1]);
  // 远景天空 + 天际线（视差更慢）
  ctx.save(); const pz = lerp(1, 0.55, pull); ctx.translate(mine[0], mine[1]); ctx.scale(1 / z * lerp(1.4, 1, pull), 1 / z * lerp(1.4, 1, pull)); ctx.drawImage(NSKY(), -1200, -1300 + 200 * pz, 2400, 1800); ctx.restore();
  // 邻楼（左右各两栋，前后错开）
  const NB = [[-1900, 300, 0.95], [-950, 520, 0.9], [F.W + 120, 400, 0.92], [F.W + 1000, 200, 0.97]];
  NB.forEach(([nx, ny, s], k) => { const n = N[k]; ctx.drawImage(n.img, nx, ny, n.W * s, n.H * s); ctx.fillStyle = 'rgba(14,10,30,0.45)'; ctx.fillRect(nx, ny, n.W * s, n.H * s);
    n.units.forEach(u => { if (u.on || hash(k * 31 + u.i * 7 + u.j * 3) > 0.11) return; const on = smooth(prog(t, T.ten - 0.2 + hash(k + u.i * 2 + u.j) * 1.0, T.ten + 0.4 + hash(k + u.i * 2 + u.j) * 1.0)); if (on > 0.01) { ctx.save(); ctx.translate(nx, ny); ctx.scale(s, s); goldWin(ctx, 30 + u.i * n.uw, 20 + u.j * n.uh, n.uw, n.uh, on, false); ctx.restore(); } }); });
  ctx.fillStyle = 'rgba(10,8,26,0.0)';
  ctx.drawImage(F.img, 0, 0, F.W, F.H);
  F.units.forEach(u => { const isMine = u.i === 1 && u.j === 2; if (!isMine && (u.on || hash(u.i * 7 + u.j * 3 + 5) > 0.1)) return; const on = isMine ? 1 : smooth(prog(t, T.ten - 0.3 + (u.i + u.j) * 0.1, T.ten + 0.3 + (u.i + u.j) * 0.1)); goldWin(ctx, 30 + u.i * F.uw, 20 + u.j * F.uh, F.uw, F.uh, on, isMine); });
  // 地面的雾
  const fg = ctx.createLinearGradient(0, F.H - 300, 0, F.H + 200); fg.addColorStop(0, 'rgba(60,40,70,0)'); fg.addColorStop(1, 'rgba(60,40,70,0.8)'); ctx.fillStyle = fg; ctx.fillRect(-3000, F.H - 300, 7000, 1500);
  ctx.restore();
  // 「每十个人里就有一个」：亮起来的金窗之间连出金线（像星座），从他家那扇窗开始一笔笔连出去
  const lk = prog(t, T.ten - 0.1, T.more + 0.6);
  if (lk > 0 && STARS.length > 1) NE.batch(ctx, () => { const st = STARS.filter(q => q[2] > 0.3 && q[0] > 40 && q[0] < W - 40 && q[1] > 80 && q[1] < 1280), m = st.find(q => q[3]) || st[0], order = [m], rest = st.filter(q => q !== m);
    while (rest.length) { const last = order[order.length - 1]; let bi = 0, bd = 1e9; rest.forEach((q, i) => { const d = Math.hypot(q[0] - last[0], q[1] - last[1]); if (d < bd) { bd = d; bi = i; } }); order.push(rest.splice(bi, 1)[0]); }
    NE.line(ctx, order.map(q => [q[0], q[1]]), lk, NE.GOLD, 2.5, 0.75, { head: true });
    order.forEach((q, i) => { const u = clamp(lk * order.length - i); if (u > 0) NE.line(ctx, NE.arcPts(q[0], q[1], 26 + 10 * (1 - u), 0, Math.PI * 2, 24), u, NE.GOLD, 2, 0.7 * u, { head: false }); }); });
  return { C: { x: 0, y: 0, z: 1 } };
}
function draw(ctx, t) {
  let st;
  const SAFE = T.safe - 0.6;
  if (t < ACT2 + 0.7) st = act1(ctx, t);
  if (t >= ACT2 && t < SAFE + 0.5) S.group(ctx, smooth(prog(t, ACT2, ACT2 + 0.7)), c => { st = act2(c, t); });
  if (t >= SAFE && t < ACT3 + 0.7) S.group(ctx, smooth(prog(t, SAFE, SAFE + 0.5)), c => { st = act2b(c, t); });
  if (t >= ACT3) S.group(ctx, smooth(prog(t, ACT3, ACT3 + 0.7)), c => { st = act3(c, t); });
  return st;
}
function over(ctx, t) {
  QT.draw(ctx, t);
}
module.exports = { draw, over, T };
