'use strict';
// PWG3 第三幕「人际关系这个副本」：C201–C210
//   场景：夜里的山谷。一座刻着「副本 · 人际关系」的石拱门立在谷口，门后一条小路弯进雾里，路两边站满了提着灯的人，一直排到天边（每个人是一盏灯，不是「门里一堆人」）
//   C201 她一个人站在巨大的拱门前，门上的纹路一笔笔亮起来，写着「推荐人数：2–3 人」；说到「不得不面对」她吸口气往里走
//   C202 镜头穿过拱门：那么多盏灯里，只有三盏朝她走过来 —— 营火边，三个朋友围着她坐下（「两三个」时一个一个亮起来），其余的人都在远处的雾里
//   C203 好事/坏事：营火的暖圈很小很亮（好事），圈外的夜很大很冷（坏事）—— 风一吹火苗矮下去，冷色压进来，又缓回来
//   C204 她和三个朋友之间只有三根松松的光线，轻轻晃，不费力
//   C205 关系一多：几十根线从她胸口射向满山谷的灯，缠在一起，她的光顺着线一股股被抽走，人暗下去、弯下去，营火也小了
//   C206–C207 想象天天应酬：线一拽，她被拉到酒楼包间的大圆桌前 —— 一圈人轮番举杯伸过来，墙上的日历一页页翻（天天），每碰一次杯她就褪一分颜色、矮一截
//   C208 回到营火：镜头拉得很远，偌大的黑山谷里只有这一小圈暖光
//   C209 很重视这仅有的朋友：推近，她把自己的光顺着三根线送过去，线变粗变亮，她两手小心护着
//   C210 起了矛盾：一根线迸出红色的火星、绷紧，朋友转过身去；她往后退进暗处，发边那只蝴蝶飞起来往夜里去；「请不要把小蝴蝶放走」—— 朋友回头伸手，线重新变暖，蝴蝶绕了一圈飞回来
const X = require('./pwk');
const { infp, LIME: FLYL } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const { K, GOLD, LIME, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const PAD = 260, HZ = 1000, GY = 1262, FIRE = [600, 1292], WARM = [255, 190, 110];
const T = { in: vs('C201') - 1.9, c201: vs('C201'), must: at('C201', '不得不'), fb: at('C201', '副本'), c202: vs('C202'), fr: at('C202', '好朋友'), three: at('C202', '两三个'), c203: vs('C203'), good: at('C203', '好事'), bad: at('C203', '坏事'),
  c204: vs('C204'), c205: vs('C205'), tired: at('C205', '精疲'), c206: vs('C206'), daily: at('C206', '天天'), c207: vs('C207'), feel: at('C207', '是什么'), c208: vs('C208'), c209: vs('C209'), value: at('C209', '重视'),
  c210: vs('C210'), fight: at('C210', '矛盾'), please: at('C210', '请不要'), end: ve('C210') + 0.3 };
const BQ = [T.c206 - 0.35, T.c208 - 0.25];     // 圆桌那段
const CAM = [
  [T.in, { x: 0, y: -30, z: 1.0, ax: 540, ay: GY }], [T.must, { x: 0, y: -20, z: 1.08 }], [T.c202 + 0.2, { x: 60, y: -40, z: 1.5 }], [T.fr, { x: 0, y: 0, z: 1.0 }], [T.c203, { x: 0, y: 0, z: 1.06 }], [T.c204, { x: 0, y: 0, z: 1.1 }], [T.c205, { x: -30, y: 10, z: 1.22 }],
  [T.tired, { x: 0, y: -40, z: 0.92 }], [T.c206 - 0.3, { x: 0, y: -40, z: 0.9 }], [T.c208 - 0.2, { x: 0, y: -40, z: 0.9 }], [T.c208 + 0.3, { x: 0, y: -60, z: 0.78 }], [T.c209, { x: 0, y: -60, z: 0.78 }], [T.c209 + 1.4, { x: -40, y: 20, z: 1.34 }], [T.c210, { x: -40, y: 20, z: 1.38 }], [T.fight, { x: 0, y: 0, z: 1.04 }], [T.end, { x: 0, y: -10, z: 1.1 }],
];
// ---------- 预渲 ----------
const SKY = S.lazy(() => S.bake(W + PAD * 2, HZ + PAD + 40, c => {
  c.translate(PAD, PAD);
  S.vgrad(c, [[0, [4, 8, 24]], [0.45, [10, 26, 60]], [0.8, [30, 60, 100]], [1, [70, 100, 130]]], -PAD, HZ + 40, -PAD, W + PAD);
  S.stars(c, 91, [-PAD, -PAD, W + PAD, 800], 200, 1);
  c.save(); c.translate(600, 330); c.rotate(-0.35); S.add(c, () => { for (let i = 0; i < 16; i++) S.rgrad(c, (i - 8) * 110, Math.sin(i * 1.3) * 50, 240, [[0, i % 2 ? [90, 140, 220] : [140, 110, 220], 0.08], [1, [100, 130, 220], 0]], 0.5); }); c.restore();
  S.mountain(c, S.ridge(71, -PAD, W + PAD, HZ + 20, 330, 120), HZ + 60, [44, 70, 110], [20, 36, 76], { facet: 0.5 });
  S.mountain(c, S.ridge(83, -PAD, W + PAD, HZ + 30, 190, 100, 1.5), HZ + 60, [30, 52, 90], [12, 26, 60], { facet: 0.5 });
  S.vgrad(c, [[0, [90, 130, 170], 0], [1, [90, 130, 170], 0.5]], HZ - 190, HZ + 40, -PAD, W + PAD);
}));
// 山谷地面 + 满谷提灯的人（越远越小越密）
const PEOPLE = (() => { const r = mulberry32(55), o = []; for (let i = 0; i < 170; i++) { const d = Math.pow(r(), 1.5), y = lerp(HZ + 14, 1250, d), s = 0.11 + d * 0.72, x = -PAD + r() * (W + PAD * 2); if (d > 0.42 && Math.abs(x - 540) < 620) continue; o.push({ x, y, s, key: MB.ALL[(r() * MB.ALL.length) | 0], c: r() < 0.7 ? WARM : [255, 226, 180] }); } return o.sort((a, b) => a.y - b.y); })();
const VALLEY = S.lazy(() => S.bake(W + PAD * 2, 1100, c => {
  c.translate(PAD, -HZ + 40);
  S.vgrad(c, [[0, [40, 66, 96]], [0.12, [20, 40, 66]], [0.5, [10, 22, 42]], [1, [4, 8, 20]]], HZ, HZ + 1060, -PAD, W + PAD);
  // 小路：一条从近处弯到天边的淡光带
  c.save(); c.globalCompositeOperation = 'lighter'; c.filter = 'blur(12px)'; c.fillStyle = 'rgba(150,180,220,0.07)'; c.beginPath(); c.moveTo(330, HZ + 1060); c.bezierCurveTo(430, 1400, 720, 1200, 600, 1090); c.bezierCurveTo(540, 1040, 600, 1012, 640, HZ + 4); c.lineTo(660, HZ + 4); c.bezierCurveTo(640, 1020, 620, 1050, 700, 1100); c.bezierCurveTo(900, 1230, 720, 1440, 800, HZ + 1060); c.closePath(); c.fill(); c.restore();
  for (const p of PEOPLE) { MB.person(c, p.key, p.x, p.y, p.s, { dim: 0.8, shadow: 0.6 }); S.add(c, () => { glow(c, p.x + 26 * p.s, p.y - 120 * p.s, 190 * p.s, p.c, 0.6); glow(c, p.x + 26 * p.s, p.y - 120 * p.s, 44 * p.s, [255, 246, 220], 0.9); S.rgrad(c, p.x, p.y, 160 * p.s, [[0, p.c, 0.3], [1, p.c, 0]], 0.2); }); }
  S.add(c, () => { for (let i = 0; i < 7; i++) S.rgrad(c, -100 + i * 220, HZ + 40 + (i % 2) * 40, 380, [[0, [110, 150, 190], 0.16], [1, [110, 150, 190], 0]], 0.16); });
}));
// 石拱门
const AX = 560, AWID = 300, AHT = 900;
const archPts = (w, pad = 0) => { const o = [[AX - w - pad, GY]]; const top = GY - AHT + w; o.push([AX - w - pad, top]); for (let k = 0; k <= 24; k++) { const a = Math.PI + (k / 24) * Math.PI; o.push([AX + Math.cos(a) * (w + pad), top + Math.sin(a) * (w + pad)]); } o.push([AX + w + pad, GY]); return o; };
const GATE = S.lazy(() => S.bake(W + PAD * 2, 1500, c => {
  c.translate(PAD, 200);
  const outer = archPts(AWID, 110), inner = archPts(AWID, 0);
  c.beginPath(); outer.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); for (let i = inner.length - 1; i >= 0; i--) c.lineTo(inner[i][0], inner[i][1]); c.closePath();
  const g = c.createLinearGradient(AX - 420, 0, AX + 420, 0); g.addColorStop(0, 'rgb(30,40,66)'); g.addColorStop(0.35, 'rgb(74,90,124)'); g.addColorStop(0.7, 'rgb(44,56,90)'); g.addColorStop(1, 'rgb(18,24,46)'); c.fillStyle = g; c.fill();
  c.save(); c.clip(); const r = mulberry32(2); for (let k = 0; k < 44; k++) { c.fillStyle = `rgba(${r() < 0.5 ? '0,0,20' : '150,170,220'},${0.05 + r() * 0.08})`; const x = AX - 420 + r() * 840, y = GY - AHT - 120 + r() * (AHT + 120); S.poly(c, [[x, y], [x + 60 + r() * 90, y + r() * 30], [x + 40 + r() * 60, y + 50 + r() * 60], [x - 10, y + 40 + r() * 40]]); c.fill(); } c.restore();
  // 门楣上的牌子
  c.fillStyle = 'rgb(20,26,50)'; c.beginPath(); c.roundRect(AX - 250, GY - AHT - 96, 500, 110, 14); c.fill();
}));
const FIRERAY = S.lazy(() => S.bake(900, 900, c => { c.translate(450, 450); const g = c.createRadialGradient(0, 0, 0, 0, 0, 450); g.addColorStop(0, 'rgba(255,190,110,0.6)'); g.addColorStop(0.4, 'rgba(255,150,80,0.22)'); g.addColorStop(1, 'rgba(255,150,80,0)'); c.fillStyle = g; c.fillRect(-450, -450, 900, 900); }));
function fire(ctx, x, y, s, t, k = 1) {
  S.add(ctx, () => { ctx.globalAlpha = k; ctx.drawImage(FIRERAY(), x - 620 * s, y - 520 * s, 1240 * s, 1040 * s); ctx.globalAlpha = 1; S.rgrad(ctx, x, y + 10, 520 * s, [[0, WARM, 0.5 * k], [1, WARM, 0]], 0.2); });
  for (const [dx, rot] of [[-56, 0.5], [56, -0.5], [0, 0]]) { ctx.save(); ctx.translate(x + dx * s, y + 8 * s); ctx.rotate(rot); const g = ctx.createLinearGradient(0, -14 * s, 0, 14 * s); g.addColorStop(0, 'rgb(120,80,60)'); g.addColorStop(1, 'rgb(50,30,34)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-70 * s, -14 * s, 140 * s, 28 * s, 12 * s); ctx.fill(); ctx.restore(); }
  for (let i = 0; i < 3; i++) { const w = (70 - i * 18) * s * (0.7 + 0.3 * k), h = (190 - i * 44) * s * (0.5 + 0.5 * k) * (1 + 0.08 * Math.sin(t * 6 + i * 2)), sw = Math.sin(t * 4.3 + i) * 12 * s, col = [[255, 120, 60], [255, 190, 90], [255, 244, 200]][i];
    ctx.fillStyle = rgba(col, 0.92); ctx.beginPath(); ctx.moveTo(x - w, y - 6 * s); ctx.bezierCurveTo(x - w, y - h * 0.5, x - w * 0.2 + sw, y - h * 0.7, x + sw * 1.4, y - h); ctx.bezierCurveTo(x + w * 0.3 + sw, y - h * 0.6, x + w, y - h * 0.4, x + w, y - 6 * s); ctx.closePath(); ctx.fill(); }
  S.add(ctx, () => glow(ctx, x, y - 70 * s, 190 * s, [255, 210, 130], 0.5 * k));
}
function fly(ctx, x, y, s, t, a = 1) {
  if (a <= 0.003) return; const f = 0.25 + 0.75 * Math.abs(Math.cos(t * 11));
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.3 + Math.sin(t * 2) * 0.2); ctx.scale(s, s); ctx.globalAlpha *= a; S.add(ctx, () => glow(ctx, 0, 0, 70, [200, 240, 140], 0.5));
  S.poly(ctx, [[0, 0], [-34 * f, -30], [-40 * f, 6]], 'rgb(120,206,160)'); S.poly(ctx, [[0, 0], [-26 * f, 26], [-8 * f, 30]], 'rgb(80,174,132)'); S.poly(ctx, [[0, 0], [34 * f, -30], [40 * f, 6]], 'rgb(217,227,84)'); S.poly(ctx, [[0, 0], [26 * f, 26], [8 * f, 30]], 'rgb(180,200,70)'); ctx.restore();
}
// 关系线
const bz = (A, B, sag, s, wob = 0) => [lerp(A[0], B[0], s), lerp(A[1], B[1], s) + Math.sin(s * Math.PI) * sag + wob * Math.sin(s * 12)];
function thread(ctx, A, B, sag, col, a, w = 9, t = 0, pulse = 0, dir = 1, f = 1) {
  if (a <= 0.003) return; const pts = Array.from({ length: 22 }, (_, k) => bz(A, B, sag + Math.sin(t * 1.2 + A[0] + B[0]) * 8, k / 21));
  const ph = ((t * 0.7 * dir) % 1 + 1) % 1; S.ribbon(ctx, pts, s => w * (1 + pulse * 2.4 * Math.exp(-Math.pow((s - ph) * 6, 2))), col, a, f);
}
const FR = [['enfj-female', 180, 1256, 2.0, false], ['isfp-male', 760, 1230, 1.9, true], ['infj-female', 960, 1268, 2.05, true]];
const MANY = Array.from({ length: 26 }, (_, i) => { const p = PEOPLE[(i * 4 + 3) % PEOPLE.length]; return [p.x + 26 * p.s, p.y - 120 * p.s]; });

// ---------- 圆桌（想象：天天应酬） ----------
const BQBG = S.lazy(() => S.bake(W, H, c => {
  S.vgrad(c, [[0, [60, 16, 24]], [0.55, [130, 40, 40]], [1, [90, 30, 36]]], 0, 1040, 0, W);
  for (let x = 0; x < W; x += 120) { c.fillStyle = 'rgba(255,200,120,0.05)'; c.fillRect(x, 0, 60, 1040); }
  // 圆窗花格
  c.save(); c.translate(820, 560); c.fillStyle = 'rgb(40,12,22)'; c.beginPath(); c.arc(0, 0, 190, 0, 6.2832); c.fill(); const g = c.createRadialGradient(0, 0, 0, 0, 0, 170); g.addColorStop(0, 'rgb(60,70,130)'); g.addColorStop(1, 'rgb(24,26,70)'); c.fillStyle = g; c.beginPath(); c.arc(0, 0, 166, 0, 6.2832); c.fill();
  c.strokeStyle = 'rgb(200,140,70)'; c.lineWidth = 9; for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * 62, -166); c.lineTo(k * 62, 166); c.moveTo(-166, k * 62); c.lineTo(166, k * 62); c.stroke(); } c.lineWidth = 16; c.beginPath(); c.arc(0, 0, 174, 0, 6.2832); c.stroke(); c.restore();
  S.vgrad(c, [[0, [70, 30, 36]], [1, [20, 8, 18]]], 1040, H, 0, W);
  c.fillStyle = 'rgb(50,14,22)'; c.fillRect(0, 1010, W, 30);
}));
function banquet(ctx, t) {
  const u = prog(t, BQ[0], BQ[1]), n = Math.floor(Math.max(0, (t - T.c206 - 0.4) / 0.78)), drain = clamp((t - T.c206 - 0.3) / (BQ[1] - T.c206 - 0.6));
  ctx.drawImage(BQBG(), 0, 0);
  // 吊灯（主光源）
  const br = 1 + 0.03 * Math.sin(t * 0.8);
  ctx.fillStyle = 'rgb(60,30,24)'; ctx.fillRect(537, 0, 6, 250); for (let k = 0; k < 3; k++) S.poly(ctx, [[540 - 70 - k * 50, 250 + k * 44], [540 + 70 + k * 50, 250 + k * 44], [540 + 50 + k * 50, 290 + k * 44], [540 - 50 - k * 50, 290 + k * 44]], rgba(mix([255, 210, 130], [200, 120, 60], k * 0.3)));
  S.add(ctx, () => { glow(ctx, 540, 330, 900 * br, [255, 180, 100], 0.3); glow(ctx, 540, 330, 190, [255, 230, 170], 0.5); });
  // 墙上的日历：一页一页翻（天天）
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日', '周一', '周二', '周三', '周四', '周五'], cu = clamp((t - T.c206 - 0.4) / 0.78 - n);
  ctx.save(); ctx.translate(210, 560);
  ctx.fillStyle = 'rgb(250,244,232)'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; ctx.beginPath(); ctx.roundRect(-100, -120, 200, 250, 10); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgb(214,70,70)'; ctx.beginPath(); ctx.roundRect(-100, -120, 200, 66, [10, 10, 0, 0]); ctx.fill(); K.text(ctx, '应酬', 0, -74, { size: 40, weight: 500, color: [255, 240, 230], spacing: 0.3 });
  K.text(ctx, days[Math.min(days.length - 1, n + 1)], 0, 64, { size: 84, weight: 500, color: [70, 40, 40] });
  if (cu < 1) { ctx.save(); ctx.translate(0, -54); ctx.transform(1, 0, -0.5 * cu, 1 - cu, 0, 0); ctx.fillStyle = 'rgb(255,250,240)'; ctx.fillRect(-100, 0, 200, 184); K.text(ctx, days[Math.min(days.length - 1, n)], 0, 118, { size: 84, weight: 500, color: [70, 40, 40] }); ctx.restore(); }
  ctx.restore();
  // 后排的人（桌子后面）+ 她在正中
  const TY = 1120, L0 = [540, 330];
  const seats = [['estj-male', 110, 1030, 1.8], ['esfj-female', 310, 1010, 1.7], ['entj-male', 790, 1010, 1.74], ['estp-female', 980, 1034, 1.8]];
  const toast = k => { const ph = (t - T.c206 - 0.4) / 0.78 - k * 0.25; return Math.pow(Math.max(0, Math.sin(ph * Math.PI * 2 * 0.5)), 2); };
  seats.forEach(([key, x, y, s], k) => S.lit(ctx, c => MB.person(c, key, x, y + 120, s, { bob: toast(k) * 14, lean: (540 - x) / 3000 + toast(k) * (540 - x) / 2400, flip: x > 540 }), { light: L0, at: [x, y - 100], r: 300, warm: [255, 220, 160], cool: [60, 10, 30], k: 0.8 }));
  const shrink = 1 - 0.2 * smooth(drain);
  const R = S.lit(ctx, c => infp(c, 540, TY + 50, 1.0 * shrink, { t, wind: false, eyes: drain > 0.75 ? 'closed' : drain > 0.35 ? 'sad' : 'open', mouth: drain > 0.5 ? 'flat' : 'smile', dim: 0.85 * smooth(drain), tilt: 0.5 * drain, lean: 0.06 * drain, la: -0.4, ra: -0.5 + 0.2 * Math.sin(t * 8) * (1 - drain) }), { light: L0, at: [540, TY - 200], r: 300, warm: [255, 220, 160], cool: [60, 10, 30], k: 0.8 });
  // 她身上被抽走的光：每碰一次杯，一股光从胸口飞向那只杯子
  // 圆桌：桌面 + 转盘 + 菜
  ctx.save(); ctx.translate(540, TY + 70);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 150, 600, 120, 0, 0, 6.2832); ctx.fill();
  const tg = ctx.createLinearGradient(0, -110, 0, 130); tg.addColorStop(0, 'rgb(255,240,226)'); tg.addColorStop(1, 'rgb(214,170,160)'); ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(0, 0, 620, 136, 0, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgb(190,140,130)'; ctx.beginPath(); ctx.ellipse(0, 26, 620, 136, 0, 0, Math.PI); ctx.fill(); ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(0, 0, 620, 136, 0, 0, Math.PI); ctx.fill();
  ctx.fillStyle = 'rgba(200,150,90,0.55)'; ctx.beginPath(); ctx.ellipse(0, -6, 380, 82, 0, 0, 6.2832); ctx.fill();
  for (let k = 0; k < 7; k++) { const a = t * 0.5 + k * 0.9, dx = Math.cos(a) * 290, dy = -8 + Math.sin(a) * 60, col = [[230, 90, 70], [240, 190, 90], [120, 170, 110], [250, 230, 210], [200, 110, 60]][k % 5]; ctx.fillStyle = 'rgb(252,248,244)'; ctx.beginPath(); ctx.ellipse(dx, dy, 60, 20, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.ellipse(dx, dy - 6, 42, 15, 0, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  // 一只只伸过来的酒杯（从四面八方轮番举到她面前）
  const cups = [[110, 960], [310, 940], [790, 940], [980, 964], [60, 1240], [1020, 1240]];
  cups.forEach(([cx, cy], k) => { const tv = toast(k), gx = lerp(cx, 540 + (cx - 540) * 0.3, tv), gy = lerp(cy, 960, tv) - tv * 40;
    ctx.save(); ctx.translate(gx, gy); ctx.rotate((540 - cx) / 900 * tv); S.poly(ctx, [[-20, -40], [20, -40], [14, 10], [-14, 10]]); const gg = ctx.createLinearGradient(-20, 0, 20, 0); gg.addColorStop(0, 'rgba(255,250,240,0.9)'); gg.addColorStop(1, 'rgba(210,200,220,0.8)'); ctx.fillStyle = gg; ctx.fill(); ctx.fillStyle = 'rgba(240,170,60,0.9)'; S.poly(ctx, [[-17, -18], [17, -18], [14, 10], [-14, 10]]); ctx.fill(); ctx.restore();
    if (tv > 0.3) { const pts = Array.from({ length: 14 }, (_, q) => bz(R.chest, [gx, gy], -30, q / 13)); S.ribbon(ctx, pts, s => 5 + 16 * Math.exp(-Math.pow((s - tv) * 4, 2)), [255, 214, 140], 0.6 * tv * (1 - drain * 0.6), 1); S.add(ctx, () => glow(ctx, gx, gy - 16, 70 * tv, [255, 230, 170], 0.8 * tv)); } });
  // 前排的两个背影（虚、暗）
  S.comp(ctx, c => { MB.person(c, 'esfp-male', 110, 1840, 3.6, { dim: 0.88, shadow: 0 }); MB.person(c, 'enfj-male', 990, 1880, 3.8, { dim: 0.88, shadow: 0, flip: true }); }, { filter: 'blur(9px)' });
  S.add(ctx, () => glow(ctx, R.chest[0], R.chest[1], 150, [255, 214, 150], 0.4 * (1 - drain)));
}

function valley(ctx, t) {
  const C = S.camKF(t, CAM);
  ctx.fillStyle = 'rgb(4,8,24)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 0.25); ctx.drawImage(SKY(), -PAD, -PAD); ctx.restore();
  const camp = smooth(prog(t, T.c202 + 0.4, T.fr));
  ctx.save(); S.cam(ctx, C, lerp(0.6, 0.6, camp)); ctx.drawImage(VALLEY(), -PAD, HZ - 40); ctx.restore();
  // 冷下去（坏事 / 精疲力竭 / 矛盾）
  const cold = Math.sin(Math.PI * prog(t, T.bad - 0.25, T.c204)) * 0.8, many = prog(t, T.c205 + 0.1, T.c206 - 0.3), tired = t < BQ[1] ? smooth(prog(t, T.c205 + 1.2, T.c206 - 0.4)) : 0;
  const fight = smooth(prog(t, T.fight - 0.5, T.fight + 0.3)) * (1 - smooth(prog(t, T.please, T.please + 0.9)));
  const fk = clamp(1 - 0.6 * cold - 0.55 * tired - 0.35 * fight);
  ctx.save(); S.cam(ctx, C, 1);
  // 营火 + 三个朋友
  const back8 = t > T.c208 - 0.3;
  if (camp > 0.01) {
    fire(ctx, FIRE[0], FIRE[1], 1.0, t, fk * camp);
    FR.forEach(([key, x, y, s, flip], i) => {
      const on = smooth(prog(t, T.three - 0.5 + i * 0.3, T.three - 0.1 + i * 0.3)), come = easeOut(prog(t, T.fr - 0.5 + i * 0.2, T.fr + 0.6 + i * 0.2));
      const turn = i === 1 ? fight : 0, away = i === 1 ? fight * 70 : 0;
      const P = S.lit(ctx, c => MB.person(c, key, x + (1 - come) * (flip ? 300 : -300) + away, y, s, { a: come, flip: turn > 0.5 ? !flip : flip, dim: 0.5 * (1 - on) + 0.3 * tired, bob: Math.abs(Math.sin(t * 2 + i)) * 3 }), { light: [FIRE[0], FIRE[1] - 100], at: [x, y - 240], r: 320, warm: [255, 200, 130], cool: [10, 20, 50], k: 1.0 * fk + 0.2 });
      FR[i].P = P; if (on > 0.01) S.add(ctx, () => glow(ctx, P.chest[0], P.chest[1], 200 * on, WARM, 0.4 * on * (1 - 0.5 * turn)));
    });
  }
  // 她
  const walk = easeInOut(prog(t, T.must - 0.2, T.c202 + 0.3)), inx = lerp(430, 560, walk);
  const retreat = fight * 110, hx = lerp(inx, 430, camp) - retreat, hy = GY - 4 + (camp > 0 ? 0 : -Math.abs(Math.sin(walk * Math.PI * 5)) * 9);
  const give = smooth(prog(t, T.c209 + 0.3, T.value + 0.6)) * (1 - smooth(prog(t, T.c210 + 0.5, T.fight)));
  const flyOff = prog(t, T.fight - 0.2, T.please + 0.2), flyBack = easeInOut(prog(t, T.please + 0.2, T.end - 0.1));
  const o = { t, spin: t * 1.5, flies: flyOff > 0 && flyBack < 1 ? 0 : 1, eyes: fight > 0.4 ? 'sad' : tired > 0.5 ? 'closed' : camp > 0.5 && cold < 0.3 && many <= 0 ? 'happy' : 'open', mouth: tired > 0.4 || fight > 0.4 ? 'flat' : 'smile', dim: 0.65 * tired + 0.3 * fight, lean: 0.07 * tired - 0.04 * fight, tilt: 0.4 * tired - 0.3 * (1 - camp) * smooth(prog(t, T.c201, T.must)), look: camp < 0.5 ? [1, -1.5] : [1, 0], la: -0.5 * give, ra: -0.3 * give };
  S.add(ctx, () => S.rgrad(ctx, hx, hy + 8, 210, [[0, [170, 200, 255], 0.14 * (1 - camp)], [1, [170, 200, 255], 0]], 0.15));
  const R = S.lit(ctx, c => infp(c, hx, hy, lerp(0.86, 1.0, camp), o), camp > 0.5 ? { light: [FIRE[0] + 200, FIRE[1] - 100], at: [hx, hy - 280], r: 330, warm: [255, 200, 130], cool: [10, 20, 50], k: fk + 0.15 } : { light: [900, 200], at: [hx, hy - 260], r: 320, warm: [190, 214, 255], cool: [6, 12, 40], k: 1 });
  // 关系线
  if (camp > 0.5) {
    const tA = smooth(prog(t, T.c204 - 0.2, T.c204 + 0.8));
    FR.forEach((f, i) => { if (!f.P) return; const bad = i === 1 ? fight : 0, col = mix(mix([255, 214, 140], [255, 240, 200], give), [255, 70, 60], bad);
      thread(ctx, R.chest, f.P.chest, lerp(70, 6, bad), mix(col, [255, 150, 60], 0.45 * (1 - bad)), tA * 0.5, 5 + 5 * give, t, 0.5 * give + tired * 0.6, 1, tA);
      if (bad > 0.2) S.add(ctx, () => { for (let k = 0; k < 5; k++) { const ph = (t * 2.2 + k / 5) % 1, m = bz(R.chest, f.P.chest, 6, 0.5), ang = hash(k * 3.3 + Math.floor(t * 2.2 + k / 5)) * 6.28; glow(ctx, m[0] + Math.cos(ang) * ph * 90, m[1] + Math.sin(ang) * ph * 70, 26 * (1 - ph) + 6, [255, 110, 80], bad * (1 - ph)); } }); });
    if (many > 0) MANY.forEach((p, i) => { const u = prog(many, i * 0.02, i * 0.02 + 0.3) * (1 - smooth(prog(t, T.c206 - 0.5, T.c206 - 0.1)) * 0) * (back8 ? 0 : 1); if (u <= 0) return; const q = S.w2s(C, 0, 0, 1), pp = [(p[0] - 540) * 0.75 + 540, (p[1] - GY) * 0.7 + GY - 30]; thread(ctx, R.chest, pp, 40 + (i % 5) * 26 - 50, [150, 180, 255], 0.5 * u, 4.5, t + i, 1.6, 1, easeOut(u)); });
  }
  ctx.restore();
  // 拱门（主体平面稍前，镜头穿过去）
  const ga = 1 - smooth(prog(t, T.c202 - 0.1, T.c202 + 0.5));
  if (ga > 0.01) {
    ctx.save(); S.cam(ctx, C, 1.25); ctx.globalAlpha = ga; ctx.drawImage(GATE(), -PAD, -200);
    const nu = prog(t, T.in + 0.6, T.c201 + 1.4);
    S.neon(ctx, archPts(AWID, 0), easeInOut(nu), [120, 200, 255], 0.8 * ga, 6, false, 0.3); S.neon(ctx, archPts(AWID, 110), easeInOut(prog(nu, 0.15, 1)), [120, 200, 255], 0.5 * ga, 4, false, 0.3);
    const ta = smooth(prog(nu, 0.5, 0.9)) * ga; S.add(ctx, () => glow(ctx, AX, GY - AHT - 40, 420, [120, 190, 255], 0.3 * ta));
    K.text(ctx, '副本 · 人际关系', AX, GY - AHT - 24, { size: 58, weight: 500, color: [214, 236, 255], alpha: ta, spacing: 0.1 });
    const t2 = smooth(prog(t, T.c201 + 1.2, T.c201 + 1.9)) * ga; if (t2 > 0.01) { ctx.fillStyle = `rgba(20,26,50,${0.9 * t2})`; ctx.beginPath(); ctx.roundRect(AX - 210, GY - AHT + 36, 420, 76, 38); ctx.fill(); K.text(ctx, '推荐人数：2–3 人', AX, GY - AHT + 90, { size: 44, weight: 500, color: [255, 220, 150], alpha: t2, spacing: 0.06 }); }
    ctx.restore();
  }
  // 蝴蝶：飞走 → 飞回来
  if (flyOff > 0 && flyBack < 1) { ctx.save(); S.cam(ctx, C, 1); const e = easeOut(clamp(flyOff)), sx = R.top[0] - 70, sy = R.top[1] + 40, ox = sx - 260 * e + Math.sin(t * 3) * 30, oy = sy - 420 * e + Math.cos(t * 2.3) * 24, tx = FR[1].P ? FR[1].P.head[0] - 60 : 760, ty = FR[1].P ? FR[1].P.head[1] - 90 : 700;
    const bx = flyBack > 0 ? lerp(ox, lerp(tx, sx, smooth(prog(flyBack, 0.5, 1))), flyBack) + Math.sin(flyBack * Math.PI) * 120 : ox, by = flyBack > 0 ? lerp(oy, lerp(ty, sy, smooth(prog(flyBack, 0.5, 1))), flyBack) - Math.sin(flyBack * Math.PI) * 60 : oy;
    fly(ctx, bx, by, 1.5 - 0.5 * e * (1 - flyBack), t, 1); ctx.restore(); }
  // 整体冷色压进来
  const cd = Math.max(cold * 0.3, tired * 0.3, fight * 0.22); if (cd > 0.01) { ctx.fillStyle = `rgba(10,20,60,${cd})`; ctx.fillRect(0, 0, W, H); }
  return { C };
}
function draw(ctx, t) {
  if (t > BQ[0] && t < BQ[1] + 0.4) {
    const a = smooth(prog(t, BQ[0], BQ[0] + 0.4)) * (1 - smooth(prog(t, BQ[1], BQ[1] + 0.4)));
    let st; if (a < 0.999) st = valley(ctx, t);
    S.group(ctx, a, c => { const z = 1 + 0.25 * (1 - easeOut(prog(t, BQ[0], BQ[0] + 0.7))) + 0.05 * prog(t, BQ[0], BQ[1]); c.translate(540, 1000); c.scale(z, z); c.translate(-540, -1000); banquet(c, t); });
    return st || { C: { x: 0, y: 0, z: 1 } };
  }
  return valley(ctx, t);
}
function over(ctx, t, a) {
  // 好事 / 坏事：火光里一个，暗处一个
  const g = K.vis(t, T.good - 0.1, T.c204 - 0.1, 0.3, 0.4) * a, b = K.vis(t, T.bad - 0.1, T.c204 - 0.1, 0.3, 0.4) * a;
  if (g > 0.003) S.title(ctx, '好事', 330, 620 + (1 - easeOut(prog(t, T.good - 0.1, T.good + 0.5))) * 20, { size: 120, c: GOLD, a: g, spacing: 0.2 });
  if (b > 0.003) S.title(ctx, '坏事', 760, 620 + (1 - easeOut(prog(t, T.bad - 0.1, T.bad + 0.5))) * 20, { size: 120, c: BLUE, a: b, spacing: 0.2 });
  const im = K.vis(t, T.c206 + 0.1, T.daily + 0.6, 0.3, 0.4) * a; if (im > 0.003) S.title(ctx, '想象一下', W / 2, 250, { size: 72, c: [255, 230, 200], a: im, spacing: 0.3 });
}
module.exports = { draw, over, T };
