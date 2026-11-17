'use strict';
// ESFJ v9 第 5 章「家庭」：F01–F08。整章在他家：玄关 + 客厅 + 餐桌（暖色吊灯为主光，右边是门）；镜头在家里推拉
//   F01 吃穿住妥妥当当：清晨，他在玄关把三双鞋摆正、三件外套挂好、三个便当放进三个书包，一样不落
//   F02 一套该做和不该做：墙上一块家规板「回家先洗手 / 吃饭不看手机 / 九点前回家」；他一条条指给家人看，家人点头，餐桌上大家同时举手表决 —— 全票
//   F03 伴侣、生日纪念日：墙上日历翻到一页画着红圈的日子，他从背后端出一个点着蜡烛的蛋糕，伴侣捂住嘴笑
//   F04 最适合 ISTP：门铃响 —— 一个戴护目镜的 ISTP 推着摩托车站在门口，一身尘土
//   F05 爱自由爱冒险：门外的风灌进来，ISTP 背后是飞驰过的公路和山（门框里的风景）；他闯够了，摘下护目镜，打了个哈欠
//   F06 互补：他接过 ISTP 的头盔挂好、递上一碗热汤；ISTP 坐下修起他家那盏一直闪的台灯，台灯亮了 —— 两个人一个守家一个修东西
//   F07 父母：他把唯一的大鸡腿夹给孩子，自己碗里只有青菜（委屈自己）；然后蹲下来平视孩子，认真指着家规板（严格）
//   F08 骄傲 / 尴尬：门铃又响，来了客人 —— 孩子鞠躬问好，他挺胸、骄傲地发光；下一秒孩子冲客人做鬼脸，画面冷场（暖光抽走、一阵冷风），
//       他脸从耳根红到额头、头顶冒蒸汽，一手捂脸一手按着孩子的头一起鞠躬道歉
const X = require('./ehk');
const S = require('./ESS_kit');
const PR = require('./ESS_props');
const SET = require('./ESS_set');
const TP = require('./ESS_type');
const NE = require('./ESS_neon');
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('F01') - 0.9, f01: vs('F01'), eat: at('F01', '吃穿住'), f02: vs('F02'), rule: at('F02', '该做'), agree: at('F02', '意见一致'), f03: vs('F03'), mate: at('F03', '伴侣'), bday: at('F03', '生日'),
  f04: vs('F04'), istp: at('F04', 'ISTP'), f05: vs('F05'), adv: at('F05', '冒险'), tired: at('F05', '闯够'), home: at('F05', '迎他们'), f06: vs('F06'), f06e: ve('F06'), out: at('F06', '外面闯'), guard: at('F06', '把家守好'), match: at('F06', '互补'), keep: at('F06', '把家守好'), f07: vs('F07'), wrong: at('F07', '委屈'), strict: at('F07', '严格'),
  f08: vs('F08'), polite: at('F08', '有礼貌'), rude: at('F08', '没礼貌'), awk: at('F08', '尴尬'), end: vs('G01') };
const PAD = SET.PAD, FY = 1040, GY = 1290, LAMP = [460, 600], DOOR = [940, 1060], WARM = [255, 200, 130];
const HOUSE = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  SET.walls(c, { FY, wall: [196, 150, 120], wall2: [110, 78, 76], floor: [150, 100, 70], floor2: [50, 32, 30] });
  // 地毯
  c.save(); c.translate(440, 1300); c.scale(1, 0.2); const rg = c.createRadialGradient(0, 0, 40, 0, 0, 480); rg.addColorStop(0, 'rgb(200,120,100)'); rg.addColorStop(0.7, 'rgb(160,90,80)'); rg.addColorStop(0.72, 'rgb(240,200,160)'); rg.addColorStop(0.8, 'rgb(160,90,80)'); rg.addColorStop(1, 'rgb(120,64,64)'); c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 480, 0, 6.2832); c.fill(); c.restore();
  // 家规板
  c.save(); c.shadowColor = 'rgba(0,0,0,0.4)'; c.shadowBlur = 20; c.shadowOffsetY = 8; const fg = c.createLinearGradient(30, 290, 380, 690); fg.addColorStop(0, 'rgb(150,104,70)'); fg.addColorStop(1, 'rgb(90,58,40)'); c.fillStyle = fg; c.beginPath(); c.roundRect(28, 288, 354, 404, 16); c.fill(); c.restore();
  const bg = c.createLinearGradient(0, 306, 0, 676); bg.addColorStop(0, 'rgb(48,74,64)'); bg.addColorStop(1, 'rgb(36,56,50)'); c.fillStyle = bg; c.beginPath(); c.roundRect(46, 306, 318, 368, 8); c.fill(); // 黑板
  c.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 5; k++) { c.beginPath(); c.ellipse(90 + k * 60, 360 + k * 50, 70, 16, -0.3, 0, 6.2832); c.fill(); }
  c.save(); c.shadowColor = 'rgba(255,230,180,0.5)'; c.shadowBlur = 10; K.text(c, '家规', 205, 384, { size: 62, family: 'ESHeavy', weight: 900, color: [255, 226, 170], spacing: 0.4 }); c.restore();
  ['回家先洗手', '吃饭不看手机', '九点前回家', '见人要问好'].forEach((ln, i) => { c.strokeStyle = 'rgb(240,140,120)'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath(); c.moveTo(72, 438 + i * 62); c.lineTo(82, 450 + i * 62); c.lineTo(98, 426 + i * 62); c.stroke(); K.text(c, ln, 112, 452 + i * 62, { size: 38, family: 'ESSans', weight: 700, color: [240, 240, 228], align: 'left' }); });
  // 日历
  c.save(); c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 14; c.shadowOffsetY = 6; c.fillStyle = 'rgb(250,248,242)'; c.beginPath(); c.roundRect(410, 330, 190, 220, 10); c.fill(); c.restore();
  c.fillStyle = 'rgb(214,70,70)'; c.beginPath(); c.roundRect(410, 330, 190, 58, [10, 10, 0, 0]); c.fill(); K.text(c, '十一月', 505, 372, { size: 34, family: 'ESSans', weight: 900, color: [255, 250, 240], spacing: 0.1 });
  K.text(c, '17', 505, 500, { size: 110, family: 'ESHeavy', weight: 900, color: [60, 50, 60] }); c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(410, 520, 190, 4);
  SET.frame(c, 640, 330, 150, 180, 1); SET.shelf(c, 640, 620, 220, 3);
  // 门框 + 门（右边）+ 鞋架、衣帽钩
  c.fillStyle = 'rgb(90,60,50)'; c.fillRect(DOOR[0] - 150, DOOR[1] - 660, 300, 660); c.fillStyle = 'rgb(30,24,30)'; c.fillRect(DOOR[0] - 130, DOOR[1] - 640, 260, 640);
  c.fillStyle = 'rgb(120,84,64)'; c.fillRect(640, 700, 240, 12); for (let k = 0; k < 3; k++) { c.strokeStyle = 'rgb(90,70,60)'; c.lineWidth = 5; c.beginPath(); c.moveTo(680 + k * 70, 712); c.lineTo(680 + k * 70, 736); c.stroke(); }
}));
// 门：开合 + 门外的景（o.out(c, x, y, w, h) 画门外）
function doorLeaf(ctx, open, out, t) {
  const x = DOOR[0] - 130, y = DOOR[1] - 640, w = 260, h = 640;
  if (open > 0.01) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); out(ctx, x, y, w, h); ctx.restore(); }
  const dw = w * (1 - 0.86 * open), g = ctx.createLinearGradient(x, 0, x + dw, 0); g.addColorStop(0, 'rgb(160,110,76)'); g.addColorStop(1, 'rgb(110,74,52)'); ctx.fillStyle = g; ctx.fillRect(x, y, dw, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 5; ctx.strokeRect(x + dw * 0.14, y + 50, dw * 0.72, h * 0.36); ctx.strokeRect(x + dw * 0.14, y + h * 0.5, dw * 0.72, h * 0.4);
  ctx.fillStyle = 'rgb(230,196,110)'; ctx.beginPath(); ctx.arc(x + dw * 0.86, y + h * 0.52, 10, 0, 6.2832); ctx.fill();
}
// 门外：F04–F05 公路和山（飞驰感）；F08 楼道（客人）
function roadOut(ctx, x, y, w, h, t, k) {
  S.vgrad(ctx, [[0, [255, 170, 120]], [0.5, [255, 210, 160]], [1, [200, 140, 110]]], y, y + h, x, x + w);
  for (let L = 0; L < 2; L++) { ctx.fillStyle = L ? 'rgb(150,100,110)' : 'rgb(190,130,120)'; ctx.beginPath(); ctx.moveTo(x - 100, y + h * 0.62); for (let q = 0; q <= 8; q++) ctx.lineTo(x - 100 + q * 60, y + h * (0.42 + 0.1 * L) - Math.abs(Math.sin(q * 1.7 + L)) * 80 + ((t * 30 * (L + 1)) % 60) * 0); ctx.lineTo(x + w + 100, y + h); ctx.lineTo(x - 100, y + h); ctx.fill(); }
  ctx.fillStyle = 'rgb(70,60,70)'; S.poly(ctx, [[x + w * 0.45, y + h * 0.6], [x + w * 0.55, y + h * 0.6], [x + w + 60, y + h], [x - 60, y + h]]); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,200,0.8)'; for (let q = 0; q < 6; q++) { const u = ((q / 6 + t * 1.6) % 1), yy = lerp(y + h * 0.6, y + h, u * u), ww = lerp(3, 26, u * u); ctx.fillRect(x + w / 2 - ww / 2, yy, ww, 10 + 40 * u * u); }
  S.add(ctx, () => glow(ctx, x + w * 0.5, y + h * 0.4, 240, [255, 210, 160], 0.22 * k));
}
function hallOut(ctx, x, y, w, h) { S.vgrad(ctx, [[0, [190, 170, 150]], [1, [120, 104, 96]]], y, y + h, x, x + w); S.add(ctx, () => glow(ctx, x + w / 2, y + 60, 240, [255, 230, 200], 0.25)); }
// ISTP 的摩托车（只在门口露出车头）
function bike(ctx, x, y, s, a) { if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); PR.contact(ctx, 0, 0, 200, 0.4);
  ctx.fillStyle = 'rgb(30,30,40)'; for (const dx of [-110, 110]) { ctx.beginPath(); ctx.arc(dx, -60, 60, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(150,150,160)'; ctx.beginPath(); ctx.arc(dx, -60, 22, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(30,30,40)'; }
  const g = ctx.createLinearGradient(0, -200, 0, -80); g.addColorStop(0, 'rgb(255,214,90)'); g.addColorStop(1, 'rgb(200,140,40)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-130, -110); ctx.lineTo(-40, -190); ctx.lineTo(90, -190); ctx.lineTo(140, -120); ctx.lineTo(40, -90); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(255,250,230)'; ctx.beginPath(); ctx.arc(150, -150, 20, 0, 6.2832); ctx.fill(); S.add(ctx, () => glow(ctx, 150, -150, 110, [255, 230, 190], 0.3)); ctx.restore(); }
function goggles(ctx, x, y, s, a) { if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = 'rgb(60,50,40)'; ctx.fillRect(-60, -6, 120, 12); for (const dx of [-28, 28]) { ctx.fillStyle = 'rgb(200,140,40)'; ctx.beginPath(); ctx.ellipse(dx, 0, 26, 20, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgba(150,220,255,0.8)'; ctx.beginPath(); ctx.ellipse(dx, 0, 18, 13, 0, 0, 6.2832); ctx.fill(); } ctx.restore(); }
function cake(ctx, x, y, s, t, a) { if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); PR.contact(ctx, 0, 4, 120, 0.4); ctx.fillStyle = 'rgb(252,248,244)'; ctx.beginPath(); ctx.ellipse(0, 0, 120, 26, 0, 0, 6.2832); ctx.fill();
  const g = ctx.createLinearGradient(-90, 0, 90, 0); g.addColorStop(0, 'rgb(240,200,210)'); g.addColorStop(0.5, 'rgb(255,236,240)'); g.addColorStop(1, 'rgb(220,170,190)'); ctx.fillStyle = g; ctx.fillRect(-90, -110, 180, 110); ctx.fillStyle = 'rgb(255,250,250)'; ctx.beginPath(); ctx.ellipse(0, -110, 90, 20, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(236,90,110)'; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(-70 + k * 28, -114, 10, 0, 6.2832); ctx.fill(); }
  ctx.restore(); for (let k = 0; k < 3; k++) PR.candle(ctx, x + (-30 + k * 30) * s, y - 116 * s, 0.32 * s, t + k, { len: 0.7, a }); }
const KID = 'enfp-male', MATE = 'esfp-female', ISTP = 'istp-male', GUEST = 'estj-female';
// F06（2026-11-17 第二轮）：霓虹线稿 —— 金色的家先描出来（他站在门口）；一条青色的路从家门口蜿蜒出去，爬上远处的山脊（ISTP 在外面闯）；
//   路绕一圈又回到家门口，ISTP 的线稿走回来；「互补」：一圈环从两边同时描过来，一半金一半青，在顶上合上
const FN = [T.f06 - 0.35, T.f06e + 0.6];
const chaikin = (pts, n = 3) => { for (let k = 0; k < n; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], b = pts[i + 1]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts[pts.length - 1]); pts = o; } return pts; };
const ROAD_OUT = chaikin([[560, 1222], [720, 1262], [900, 1150], [940, 900], [810, 720], [870, 560], [760, 470]]), ROAD_BACK = chaikin([[760, 470], [520, 430], [300, 520], [150, 720], [210, 960], [170, 1150], [340, 1262], [520, 1222]]);
function neonPair(ctx, t) {
  NE.bg(ctx, t, { c0: [10, 10, 16], c1: [26, 22, 30], haze: [255, 200, 140] });
  NE.floor(ctx, 1262, NE.GOLD, 0.7);
  const hp = prog(t, FN[0] + 0.15, FN[0] + 1.0);
  if (hp > 0) { const gl = smooth(prog(t, T.guard - 0.2, T.guard + 0.6)); ctx.save(); ctx.fillStyle = `rgba(255,190,110,${(0.18 + 0.2 * gl) * smooth(prog(hp, 0.6, 1))})`; ctx.fillRect(540 - 62 * 2.4 + 14, 1050 - 24 * 2.4 + 14, 124 * 2.4 - 28, 94 * 2.4 - 20); ctx.restore(); S.add(ctx, () => glow(ctx, 540, 1080, 420, NE.GOLD, 0.12 + 0.18 * gl)); NE.icon(ctx, 'house', 540, 1050, 2.4, hp, NE.GOLD, 1, t, 4); }
  // 山脊
  const ridge = NE.sample(u => [80 + u * 920, 470 - Math.abs(Math.sin(u * 5.2 + 0.6)) * 150 - Math.sin(u * 13) * 18], 60);
  NE.line(ctx, ridge, prog(t, T.out - 0.1, T.out + 0.9), NE.TEAL, 3, 0.55, { head: false });
  NE.line(ctx, ROAD_OUT, prog(t, T.out - 0.35, T.out + 0.75), NE.TEAL, 4, 1);
  NE.line(ctx, ROAD_BACK, prog(t, T.guard, T.match - 0.6), NE.TEAL, 4, 1);
  NE.wire(ctx, c => ES.hero(c, 470, 1262, 0.44, { umbrella: false, cake: false, book: false, eyes: 'happy', mouth: 'smile', rs: -0.8 * smooth(prog(t, T.match - 0.6, T.match)) }), { c: NE.GOLD, w: 2.5, p: prog(t, FN[0] + 0.5, FN[0] + 1.2) });
  // ISTP：沿路走出去 → 绕回来（走在路上的小线稿）
  const along = (pts, u) => { const L = []; let tot = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); L.push(d); tot += d; } let want = tot * clamp(u); for (let i = 1; i < pts.length; i++) { if (want <= L[i - 1]) { const k = want / L[i - 1]; return [lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]; } want -= L[i - 1]; } return pts[pts.length - 1]; };
  const goOut = prog(t, T.out - 0.2, T.out + 0.8), back = prog(t, T.guard + 0.05, T.match - 0.6);
  const pos = back > 0 ? along(ROAD_BACK, easeInOut(back)) : along(ROAD_OUT, easeInOut(goOut)), sc = back >= 1 ? 1.0 : 0.62 - 0.25 * Math.sin(Math.PI * (back > 0 ? 1 - back : goOut)) * 0.8;
  if (goOut > 0) NE.wire(ctx, c => MB.person(c, ISTP, back >= 1 ? 640 : pos[0], back >= 1 ? 1262 : pos[1] + 10, back >= 1 ? 1.05 : sc, { shadow: 0, flip: back >= 1 }), { c: NE.TEAL, w: 2, p: 1 });
  // 互补：一圈环从左右两边同时描过来，左半金、右半青
  const m = easeInOut(prog(t, T.match - 0.65, T.match + 0.15));
  if (m > 0) { NE.line(ctx, NE.arcPts(540, 880, 470, Math.PI / 2, Math.PI / 2 + Math.PI * m, 80), 1, NE.GOLD, 4, 1, { head: false }); NE.line(ctx, NE.arcPts(540, 880, 470, Math.PI / 2, Math.PI / 2 - Math.PI * m, 80), 1, NE.TEAL, 4, 1, { head: false }); if (m >= 1) NE.rays(ctx, 540, 410, prog(t, T.match + 0.5, FN[1]), [255, 230, 190], 0.6, 14, 400); }
}
function draw(ctx, t) {
  const C = S.camKF(t, [[T.in, { x: 200, y: 110, z: 1.45, ax: 540, ay: 1000 }], [T.eat + 0.4, { x: 200, y: 100, z: 1.42 }], [T.f02 + 0.3, { x: -120, y: -100, z: 1.12 }], [T.agree + 0.6, { x: 0, y: -40, z: 1.0 }], [T.f03 + 0.4, { x: 0, y: -60, z: 1.08 }], [T.bday + 1.0, { x: -40, y: -20, z: 1.26 }],
    [T.f04 - 0.1, { x: 200, y: -40, z: 1.14 }], [T.adv + 0.5, { x: 300, y: -80, z: 1.42 }], [T.home + 0.6, { x: 180, y: -40, z: 1.1 }], [T.keep + 0.6, { x: 60, y: -30, z: 1.04 }], [T.f07 + 0.4, { x: -60, y: -20, z: 1.14 }], [T.strict + 0.8, { x: -120, y: -40, z: 1.18 }], [T.f08 + 0.3, { x: 100, y: -20, z: 1.02 }], [T.awk + 0.3, { x: 80, y: -60, z: 1.24 }], [T.end, { x: 80, y: -60, z: 1.28 }]]);
  const cold = smooth(prog(t, T.rude - 0.1, T.rude + 0.4)) * (1 - smooth(prog(t, T.end - 0.4, T.end + 0.4))), proud = smooth(prog(t, T.polite - 0.2, T.polite + 0.5)) * (1 - smooth(prog(t, T.rude - 0.2, T.rude + 0.1)));
  ctx.fillStyle = 'rgb(110,78,76)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(HOUSE(), -PAD, -PAD / 2);
  // 日历上的红圈（F03）
  const ring = easeOut(prog(t, T.mate - 0.2, T.bday)); if (ring > 0) { ctx.strokeStyle = 'rgb(226,50,60)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(505, 462, 76, 56, -0.1, -1.5, -1.5 + 6.6 * ring); ctx.stroke(); }
  // 家规板上的那一条亮一下（F02、F07）
  const hl = Math.max(Math.sin(Math.PI * prog(t, T.rule, T.agree)), Math.sin(Math.PI * prog(t, T.strict - 0.2, T.strict + 1.2)));
  if (hl > 0.01) S.add(ctx, () => S.rgrad(ctx, 205, 470 + (t > T.f07 ? 124 : 0), 220, [[0, [255, 220, 140], 0.45 * hl], [1, [255, 220, 140], 0]], 0.3));
  SET.pendant(ctx, LAMP[0], LAMP[1], t, { k: 1 - 0.7 * cold + 0.1 * proud, len: 900, shade: [70, 120, 120] });
  // 门
  const ring1 = prog(t, T.f04 - 0.6, T.f04), open1 = easeOut(prog(t, T.f04 - 0.1, T.istp + 0.2)) * (1 - easeIn(prog(t, T.keep - 0.6, T.keep)));
  const open2 = easeOut(prog(t, T.f08 - 0.2, T.f08 + 0.5));
  doorLeaf(ctx, Math.max(open1, open2), (c, x, y, w, h) => open2 > 0.05 ? hallOut(c, x, y, w, h) : roadOut(c, x, y, w, h, t, open1), t);
  if (ring1 > 0 && ring1 < 1) for (let k = 0; k < 2; k++) S.ring(ctx, DOOR[0] - 100, DOOR[1] - 380, 20 + ((ring1 * 2 + k * 0.5) % 1) * 140, 12, [255, 230, 170], 0.6 * (1 - ((ring1 * 2 + k * 0.5) % 1)));
  // 门外吹进来的风（F05）
  const wind = K.vis(t, T.f05 - 0.2, T.tired + 0.2, 0.3, 0.4);
  if (wind > 0.01) S.petals(ctx, t, { n: 22, seed: 7, dir: [-1, 0.05], speed: 900, a: wind, c: [230, 200, 150], c2: [255, 240, 210], size: 16, box: [100, 500, 1000, 1300] });
  const L0 = LAMP;
  // ISTP：门口 → 进屋坐下修台灯
  const inU = easeInOut(prog(t, T.home + 0.2, T.f06 + 0.6)), ia = smooth(prog(t, T.f04 - 0.1, T.istp + 0.1)) * (1 - smooth(prog(t, T.f07 - 0.4, T.f07)));
  if (ia > 0.01) { bike(ctx, DOOR[0] + 30, DOOR[1] - 10, 0.9, ia * (1 - inU)); const ix = lerp(DOOR[0] - 20, 900, inU), iy = lerp(DOOR[1] + 40, GY + 20, inU), yawn = Math.sin(Math.PI * prog(t, T.tired - 0.2, T.tired + 0.8));
    const P = S.lit(ctx, c => MB.person(c, ISTP, ix, iy, lerp(1.9, 2.3, inU), { a: ia, flip: true, lean: -0.05 * yawn, gray: 0.15 * (1 - inU), warm: 0.4 * inU }), { light: L0, at: [ix, iy - 280], r: 300, warm: [255, 210, 160], cool: [40, 24, 30], k: 0.9 });
    goggles(ctx, P.head[0] + 6, P.head[1] - 30, 1.1, ia * (1 - smooth(prog(t, T.tired, T.tired + 0.5))));
    // 修好的台灯（F06）：一开始是暗的、坏的，ISTP 一拧就亮
    const fix = smooth(prog(t, T.keep - 0.1, T.keep + 0.5)); ctx.save(); ctx.globalAlpha = ia; ctx.fillStyle = 'rgb(70,70,90)'; ctx.beginPath(); ctx.ellipse(880, GY - 230, 46, 12, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = 'rgb(90,90,110)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(880, GY - 236); ctx.quadraticCurveTo(860, GY - 340, 910, GY - 390); ctx.stroke(); S.poly(ctx, [[890, GY - 410], [960, GY - 400], [980, GY - 340], [880, GY - 356]], 'rgb(230,170,90)'); ctx.restore();
    if (fix > 0.01) S.add(ctx, () => { glow(ctx, 930, GY - 350, 400 * fix, WARM, 0.28 * fix * ia); glow(ctx, 930, GY - 360, 50, [255, 236, 200], 0.4 * fix * ia); });
    ctx.fillStyle = 'rgb(120,84,64)'; ctx.fillRect(820, GY - 224, 160, 18); ctx.fillStyle = 'rgb(90,60,50)'; ctx.fillRect(840, GY - 206, 14, 200); ctx.fillRect(950, GY - 206, 14, 200); }
  // 伴侣、孩子
  const mA = smooth(prog(t, T.f02 - 0.4, T.f02 + 0.3)) * (1 - smooth(prog(t, T.f04 - 0.4, T.f04)));
  if (mA > 0.01) { const vote = Math.sin(Math.PI * prog(t, T.agree - 0.2, T.agree + 1.0)), cover = Math.sin(Math.PI * prog(t, T.bday, T.bday + 1.6)); S.lit(ctx, c => MB.person(c, MATE, 640, GY - 20, 2.25, { a: mA, flip: true, bob: 12 * vote, lean: -0.04 * cover, warm: 0.4 * cover }), { light: L0, at: [640, GY - 280], r: 300, warm: [255, 210, 160], cool: [40, 24, 30], k: 0.9 }); if (cover > 0.2) S.add(ctx, () => glow(ctx, 640, GY - 460, 200, [255, 170, 180], 0.18 * cover)); }
  const kidA = smooth(prog(t, T.f02 - 0.2, T.f02 + 0.5)) * (1 - smooth(prog(t, T.f03 + 0.2, T.f03 + 0.8))) + smooth(prog(t, T.f07 - 0.6, T.f07));
  const kidX = t < T.f03 ? 830 : t < T.f08 ? lerp(800, 620, smooth(prog(t, T.strict - 0.6, T.strict))) : 600, face = smooth(prog(t, T.rude - 0.2, T.rude + 0.2)), bowK = Math.sin(Math.PI * prog(t, T.polite - 0.3, T.polite + 0.9)) + Math.sin(Math.PI * prog(t, T.awk + 0.3, T.end - 0.2));
  const KP = kidA > 0.01 ? S.lit(ctx, c => MB.person(c, KID, kidX, GY + (t > T.strict - 0.6 && t < T.f08 ? 140 : 60), 1.65, { a: clamp(kidA), flip: t > T.f08, lean: 0.3 * bowK, bob: 6 * face * Math.abs(Math.sin(t * 9)) }), { light: L0, at: [kidX, GY - 160], r: 220, warm: [255, 210, 160], cool: [40, 24, 30], k: 0.9 }) : null;
  // 鬼脸：吐舌头
  if (KP && face > 0.01 && face * (1 - smooth(prog(t, T.awk + 0.2, T.awk + 0.5))) > 0.01) { ctx.save(); ctx.globalAlpha = face * (1 - smooth(prog(t, T.awk + 0.2, T.awk + 0.5))); ctx.fillStyle = 'rgb(240,110,130)'; ctx.beginPath(); ctx.ellipse(KP.head[0] + 20, KP.head[1] + 36, 12, 18, 0, 0, 6.2832); ctx.fill(); ctx.restore(); }
  // 客人（F08）
  const gA = smooth(prog(t, T.f08, T.f08 + 0.6));
  if (gA > 0.01) S.lit(ctx, c => MB.person(c, GUEST, 920, GY + 10, 2.2, { a: gA, flip: true, lean: 0.06 * cold, gray: 0.3 * cold }), { light: L0, at: [900, GY - 280], r: 300, warm: [255, 210, 160], cool: [40, 24, 30], k: 0.9 });
  // 他
  const tidy = prog(t, T.f01 + 0.1, T.f02 - 0.4), point = Math.sin(Math.PI * prog(t, T.rule - 0.2, T.agree + 0.6)), carry = smooth(prog(t, T.f03 + 0.5, T.bday - 0.2)) * (1 - smooth(prog(t, T.f04 - 0.6, T.f04 - 0.2)));
  const serve = Math.sin(Math.PI * prog(t, T.keep - 0.8, T.keep + 0.2)), give = Math.sin(Math.PI * prog(t, T.wrong - 0.6, T.wrong + 0.6)), crouch = smooth(prog(t, T.strict - 0.4, T.strict + 0.2)) * (1 - smooth(prog(t, T.f08 - 0.4, T.f08)));
  const hx = t < T.f02 ? lerp(380, 330, (Math.sin(tidy * Math.PI * 3) + 1) / 2) : t < T.f04 ? 380 : t < T.f07 ? 500 : t < T.f08 ? 400 : 360;
  const blush = smooth(prog(t, T.awk - 0.2, T.awk + 0.6)) * (1 - smooth(prog(t, T.end - 0.3, T.end + 0.3)));
  const bow2 = Math.sin(Math.PI * prog(t, T.awk + 0.3, T.end - 0.2));
  const o = { t, flip: t < T.f02 ? false : t >= T.f02 && t < T.f03 ? true : false, umbrella: false, book: false, cake: false,
    rs: -1.4 * Math.max(Math.sin(tidy * Math.PI * 6) * 0.5 + 0.5 * (tidy > 0 && tidy < 1 ? 1 : 0), point, carry, serve, give) - 1.5 * blush, re: -0.6 * point - 1.2 * blush,
    eyes: proud > 0.4 ? 'happy' : blush > 0.3 ? 'closed' : cold > 0.4 ? 'wide' : crouch > 0.4 ? 'open' : 'happy', mouth: proud > 0.4 ? 'grin' : blush > 0.3 ? 'flat' : crouch > 0.4 ? 'flat' : cold > 0.3 ? 'o' : 'grin', brow: crouch > 0.4 ? 1 : 0,
    lean: -0.05 * proud + 0.2 * bow2 + 0.06 * crouch, nod: 0.8 * bow2 + 0.4 * crouch, bob: -18 * crouch, glow: 0.12 * proud + 0.12 * carry, warm: 0.3 * proud };
  const R = S.lit(ctx, c => ES.hero(c, hx, GY + 40 * crouch, 1.0 - 0.1 * crouch, o), { light: L0, at: [hx, GY - 300], r: 340, warm: [255, 210, 160], cool: [40, 24, 30], k: 0.9, tint: blush > 0.05 ? [[255, 60, 60], 0.22 * blush] : null });
  // F01：玄关的鞋、外套、书包
  const shoesU = clamp(tidy * 3), coatU = clamp(tidy * 3 - 1), bagU = clamp(tidy * 3 - 2), fa = 1 - smooth(prog(t, T.f02 - 0.4, T.f02 + 0.2));
  if (fa > 0.01) { ctx.save(); ctx.globalAlpha = fa;
    [0, 1, 2].forEach(k => { const neat = smooth(clamp(shoesU * 3 - k)), x = 700 + k * 110, rot = (1 - neat) * (hash(k) - 0.5) * 1.2; ctx.save(); ctx.translate(x + (1 - neat) * (hash(k * 3) - 0.5) * 80, GY + 30); ctx.rotate(rot); const sc = [[200, 80, 70], [70, 110, 170], [240, 190, 90]][k]; for (const dx of [-24, 24]) { ctx.save(); ctx.translate(dx, 0); ctx.fillStyle = 'rgb(240,236,226)'; ctx.beginPath(); ctx.roundRect(-30, -8, 62, 12, 6); ctx.fill(); const g = ctx.createLinearGradient(0, -36, 0, -6); g.addColorStop(0, rgba(mix(sc, [255, 255, 255], 0.2))); g.addColorStop(1, rgba(mix(sc, [0, 0, 0], 0.2))); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-30, -6); ctx.lineTo(-24, -34); ctx.quadraticCurveTo(-4, -40, 4, -26); ctx.quadraticCurveTo(24, -20, 32, -6); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-16, -28); ctx.lineTo(-4, -22); ctx.moveTo(-14, -20); ctx.lineTo(-2, -15); ctx.stroke(); ctx.restore(); } ctx.restore(); });
    [0, 1, 2].forEach(k => { const hang = smooth(clamp(coatU * 3 - k)); if (hang <= 0) return; const col = [[200, 80, 70], [70, 110, 170], [240, 190, 90]][k]; ctx.save(); ctx.translate(680 + k * 70, 736 + (1 - hang) * 120); ctx.rotate((1 - hang) * 0.3 + Math.sin(t * 2 + k) * 0.02); const g = ctx.createLinearGradient(-40, 0, 40, 0); g.addColorStop(0, rgba(mix(col, [0, 0, 0], 0.3))); g.addColorStop(0.5, rgba(col)); g.addColorStop(1, rgba(mix(col, [0, 0, 0], 0.35))); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(-34, 12); ctx.lineTo(-44, 110); ctx.lineTo(-36, 112); ctx.lineTo(-30, 50); ctx.lineTo(-30, 150); ctx.lineTo(30, 150); ctx.lineTo(30, 50); ctx.lineTo(36, 112); ctx.lineTo(44, 110); ctx.lineTo(34, 12); ctx.lineTo(10, 0); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(-10, 0); ctx.lineTo(0, 40); ctx.lineTo(10, 0); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-1, 40, 2, 108); ctx.restore(); });
    [0, 1, 2].forEach(k => { const u = smooth(clamp(bagU * 3 - k)); if (u <= 0) return; ctx.save(); ctx.translate(710 + k * 110, GY - 70); ctx.fillStyle = rgba(mix([[200, 80, 70], [70, 110, 170], [240, 190, 90]][k], [255, 255, 255], 0.2)); ctx.beginPath(); ctx.roundRect(-52, -140, 104, 140, 24); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.15)'; ctx.fillRect(-40, -70, 80, 50); PR.lunchbox(ctx, 0, -126 - (1 - u) * 80, 0.42, { lid: 1, a: 1 - smooth(prog(u, 0.6, 1)) }); ctx.restore(); });
    ctx.restore(); }
  // F03：蛋糕
  if (carry > 0.01) cake(ctx, lerp(R.hand[0] - 20, 500, 0), R.hand[1] + 20, 0.7, t, carry);
  // F06：热汤递给 ISTP
  if (serve > 0.05) PR.bowl(ctx, lerp(R.hand[0], 880, serve * 0.5), R.hand[1] + 30, 0.6, t, { soup: true, a: serve });
  // F07：鸡腿夹给孩子、自己碗里只有青菜
  if (t > T.f07 - 0.4 && t < T.f08 - 0.2) { const ta = smooth(prog(t, T.f07 - 0.4, T.f07)) * (1 - smooth(prog(t, T.f08 - 0.6, T.f08 - 0.2))); ctx.save(); ctx.globalAlpha = ta; ctx.fillStyle = 'rgb(120,84,64)'; ctx.fillRect(520, GY - 180, 500, 20); ctx.fillStyle = 'rgb(90,60,50)'; ctx.fillRect(540, GY - 160, 16, 160); ctx.fillRect(980, GY - 160, 16, 160); ctx.restore();
    PR.bowl(ctx, 800, GY - 182, 0.62, t, { a: ta, food: [240, 170, 90] }); PR.bowl(ctx, 600, GY - 182, 0.62, t, { a: ta, food: [110, 170, 90], fill: 0.4, hot: 0.3 });
    const leg = easeInOut(prog(t, T.wrong - 0.5, T.wrong + 0.2)); ctx.save(); ctx.globalAlpha = ta; ctx.translate(lerp(600, 800, leg), GY - 250 - Math.sin(leg * Math.PI) * 80); ctx.rotate(0.4); ctx.fillStyle = 'rgb(214,140,70)'; ctx.beginPath(); ctx.ellipse(0, 0, 40, 28, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(250,240,220)'; ctx.fillRect(30, -6, 34, 12); ctx.restore(); }
  // F08：骄傲的金光点落在肩上 / 冷场：头顶冒蒸汽
  if (proud > 0.01) { S.add(ctx, () => glow(ctx, R.chest[0], R.chest[1] - 60, 420, [255, 200, 120], 0.16 * proud)); const p = prog(t, T.polite - 0.1, T.polite + 1.3); if (p > 0 && p < 1) S.ring(ctx, R.chest[0], R.chest[1] - 60, 120 + p * 380, 18, [255, 214, 150], 0.25 * (1 - p)); }
  if (blush > 0.05) for (let k = 0; k < 3; k++) { const ph = (t * 0.9 + k / 3) % 1; S.rgrad(ctx, R.top[0] + (k - 1) * 40 + Math.sin(ph * 6) * 12, R.top[1] - ph * 160, 30 + ph * 40, [[0, [240, 236, 236], 0.4 * (1 - ph) * blush], [1, [240, 236, 236], 0]]); }
  ctx.restore();
  // 冷场：整个画面冷下去 + 一阵冷风
  if (cold > 0.01) { ctx.fillStyle = `rgba(30,50,90,${0.36 * cold})`; ctx.fillRect(0, 0, W, H); S.petals(ctx, t, { n: 16, seed: 23, dir: [1, 0.1], speed: 700, a: cold * (1 - smooth(prog(t, T.awk, T.awk + 0.6))), c: [200, 220, 255], c2: [240, 250, 255], size: 12, box: [-100, 300, W + 100, 1300] }); }
  const nfa = K.vis(t, FN[0], FN[1], 0.35, 0.4);
  if (nfa > 0.003) S.group(ctx, nfa, c => NE.batch(c, () => neonPair(c, t)));
  return { C };
}
function over(ctx, t) {
  const say = (str, x, y, a0, a1, tx, ty) => { const a = K.vis(t, a0, a1, 0.01, 0.3); if (a > 0.003) TP.bubble(ctx, str, x, y, { a, p: prog(t, a0, a0 + 0.45), tx, ty, size: 54 }); };
  say('阿姨好！', 640, 860, T.polite - 0.3, T.polite + 1.1, 620, 1000);
  say('对不起对不起……', 360, 700, T.awk + 0.2, T.end - 0.2, 360, 820);
}
module.exports = { draw, over, T };
