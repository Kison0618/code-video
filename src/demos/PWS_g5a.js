'use strict';
// PWG5 第一幕「傍晚的工作室」：D10–D16
//   场景：一间暖色的共享工作室 —— 砖墙、一扇很大的拱窗（窗外是傍晚的城市，慢慢入夜）、几盏吊灯（主光源）、长桌、绿植、她靠窗的小书桌和台灯
//   D10 适应能力强、乐于接受新观点：她从上一幕的灰里缓过来（颜色一点点回来）；三个同事各扔过来一只不同颜色的纸飞机（新观点），她一只只接住，风车的叶片跟着换上那种颜色
//   D11 了解身边每一个人和他们的感受：她抬眼看过去，三个同事胸口各亮起一小团情绪的光焰（和开头「六眼」呼应），颜色都不一样
//   D12 矜持，但和大多数人友好和睦：她站得离大家远半步，手收在身前；可她和每个人之间都连着一条松松的暖线，三个人的光都暖起来
//   D13 不喜欢电话干扰、善于独自工作：入夜，同事走了。她在台灯下进入心流：一只发光的专注罩把她罩住，纸页绕着她转；桌上的电话一响，红色的震波把罩子震出裂纹、碎片四溅；
//       她把电话扣过去，罩子重新合上
//   D14 听到别人内心的求救：窗外雨夜的街上，一个路人胸口一下一下发出很弱的蓝光，光圈穿过玻璃传到她耳边，她抬起头
//   D15 愿意牺牲自我去帮：她走到窗前，把自己胸口的光掰下一块又一块送出去，路人亮了，她自己的越来越小
//   D16 亲人也得跟着牺牲：镜头摇到她身后桌上的手机 —— 屏幕亮着「家」的来电和一张等她吃饭的照片，一个未接，又一个未接
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const { K, GOLD, LIME, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const FY = 1040, PAD = 240, WARM = [255, 200, 130];
const T = { in: vs('D10') - 0.7, d10: vs('D10'), adapt: at('D10', '适应'), idea: at('D10', '新的观点'), d11: vs('D11'), every: at('D11', '每一个人'), d12: vs('D12'), shy: at('D12', '矜持'), friendly: at('D12', '友好'), d13: vs('D13'), phone: at('D13', '电话'), alone: at('D13', '独自'),
  d14: vs('D14'), sos: at('D14', '求救'), d15: vs('D15'), give: at('D15', '牺牲'), d16: vs('D16'), fam: at('D16', '亲人'), end: ve('D16') + 0.8 };
const NIGHT = t => smooth(prog(t, T.d13 - 1.2, T.d13 + 0.6));
const CAM = [[T.in, { x: 0, y: 0, z: 1.2, ax: 540, ay: 1000 }], [T.adapt, { x: 0, y: 0, z: 1.0 }], [T.d11, { x: -20, y: 0, z: 1.05 }], [T.d12, { x: 0, y: 0, z: 1.08 }], [T.d13 - 0.6, { x: 0, y: 0, z: 1.02 }], [T.d13 + 0.6, { x: 190, y: 30, z: 1.5 }], [T.d14 - 0.2, { x: 190, y: 30, z: 1.56 }],
  [T.d14 + 1.0, { x: 60, y: -60, z: 1.14 }], [T.d15, { x: 40, y: -60, z: 1.18 }], [T.d16 - 0.2, { x: 0, y: -50, z: 1.24 }], [T.d16 + 1.0, { x: 250, y: 150, z: 2.3 }], [T.end, { x: 250, y: 150, z: 2.4 }]];
const WIN = [330, 250, 420, 620];           // 拱窗 x,y,w,h
const BACK = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2); const r = mulberry32(72);
  S.vgrad(c, [[0, [110, 70, 70]], [1, [170, 110, 90]]], -PAD, FY, -PAD, W + PAD);
  for (let j = 0; j < 30; j++) for (let i = -4; i < 18; i++) { const bx = i * 84 + (j % 2) * 42, by = -PAD / 2 + j * 40; c.fillStyle = `rgba(${r() < 0.5 ? '255,220,180' : '60,20,30'},${0.03 + r() * 0.06})`; c.fillRect(bx, by, 80, 36); }
  c.fillStyle = 'rgb(80,50,54)'; c.fillRect(-PAD, FY - 24, W + PAD * 2, 24);
  S.vgrad(c, [[0, [150, 104, 86]], [0.4, [104, 70, 70]], [1, [40, 26, 40]]], FY, H + PAD, -PAD, W + PAD);
  for (let i = -8; i <= 20; i++) { const xb = i * 150, xa = 540 + (xb - 540) * 0.5; S.poly(c, [[xa - 1.5, FY], [xa + 1.5, FY], [xb + 5, H + PAD], [xb - 5, H + PAD]], 'rgba(40,10,20,0.2)'); }
  // 搁板和绿植、挂画
  for (const [sx, sy, sw] of [[-60, 420, 300], [800, 380, 330]]) { c.fillStyle = 'rgb(90,60,56)'; c.fillRect(sx, sy, sw, 14); let bx = sx + 10; for (let k = 0; k < 7; k++) { const bw = 16 + r() * 18, bh = 60 + r() * 50; c.fillStyle = rgba([[214, 120, 100], [110, 150, 190], [236, 196, 130], [120, 170, 140]][k % 4]); c.fillRect(bx, sy - bh, bw, bh); bx += bw + 3; }
    c.fillStyle = 'rgb(210,140,110)'; c.fillRect(sx + sw - 70, sy - 44, 50, 44); for (let k = 0; k < 9; k++) { c.fillStyle = rgba(mix([60, 130, 96], [130, 200, 130], r())); c.beginPath(); c.ellipse(sx + sw - 45 + (r() - 0.5) * 70, sy - 60 - r() * 60, 18, 9, r() * 3, 0, 6.2832); c.fill(); } }
  // 长桌（左边，同事围着）
  const tg = c.createLinearGradient(0, 1000, 0, 1040); tg.addColorStop(0, 'rgb(226,180,130)'); tg.addColorStop(1, 'rgb(170,120,90)'); c.fillStyle = tg; S.poly(c, [[-120, 1000], [420, 1000], [450, 1040], [-150, 1040]]); c.fill(); c.fillStyle = 'rgb(110,76,66)'; c.fillRect(-110, 1040, 26, 190); c.fillRect(400, 1040, 26, 190);
  for (const [lx, col] of [[40, [120, 150, 190]], [220, [230, 190, 120]]]) { c.fillStyle = 'rgb(60,56,70)'; c.fillRect(lx, 940, 110, 60); c.fillStyle = rgba(col); c.fillRect(lx + 6, 946, 98, 46); }
}));
// 窗外：傍晚 / 雨夜 两张
const OUT = [0, 1].map(n => S.lazy(() => S.bake(WIN[2], WIN[3], c => {
  const r = mulberry32(9); n ? S.vgrad(c, [[0, [10, 14, 40]], [1, [44, 50, 104]]], 0, WIN[3], 0, WIN[2]) : S.vgrad(c, [[0, [70, 80, 150]], [0.5, [240, 150, 130]], [1, [255, 206, 150]]], 0, WIN[3], 0, WIN[2]);
  for (let L = 0; L < 2; L++) for (let i = 0; i < 10; i++) { const w = 40 + r() * 50, h = (L ? 120 : 220) + r() * 200, x = i * 44 - 20 + r() * 20; c.fillStyle = rgba(n ? (L ? [20, 22, 56] : [36, 36, 84]) : (L ? [90, 70, 110] : [140, 100, 130])); c.fillRect(x, WIN[3] - 140 - h, w, h + 140);
    S.add(c, () => { for (let yy = WIN[3] - 140 - h + 8; yy < WIN[3] - 150; yy += 14) for (let xx = x + 5; xx < x + w - 6; xx += 11) if (r() < (n ? 0.4 : 0.15)) { c.fillStyle = rgba([255, 206, 140], 0.5 + r() * 0.4); c.fillRect(xx, yy, 5, 7); } }); }
  // 楼下的街
  S.vgrad(c, [[0, n ? [30, 32, 70] : [120, 90, 110]], [1, n ? [14, 16, 40] : [70, 56, 80]]], WIN[3] - 140, WIN[3], 0, WIN[2]);
})));
const FGPLANT = S.lazy(() => S.bake(600, 800, c => { const r = mulberry32(5); c.filter = 'blur(9px)'; for (let i = 0; i < 9; i++) { const a = -2.9 + i * 0.3, L = 330 + r() * 260; c.fillStyle = rgba(mix([20, 12, 20], [50, 70, 60], r() * 0.6)); c.save(); c.translate(540, 800); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -80, L, 0); c.quadraticCurveTo(L * 0.5, 80, 0, 0); c.fill(); c.restore(); } }));
function plane(ctx, x, y, s, rot, col, a) {
  if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a; S.add(ctx, () => glow(ctx, 0, 0, 110, col, 0.5));
  S.poly(ctx, [[70, 0], [-50, -34], [-30, 0]], rgba(mix(col, [255, 255, 255], 0.5))); S.poly(ctx, [[70, 0], [-50, 34], [-30, 0]], rgba(col)); S.poly(ctx, [[70, 0], [-30, 0], [-40, 22]], rgba(mix(col, [0, 0, 0], 0.3))); ctx.restore();
}
function aura(ctx, x, y, s, c, a, t, seed) { if (a <= 0.003) return; S.add(ctx, () => { for (let k = 0; k < 7; k++) { const u = k / 6, ph = (t * 0.6 + hash(k * 3.1 + seed)) % 1; S.rgrad(ctx, x + Math.sin(t * 1.7 + k * 1.3 + seed) * 12 * s, y - (u * 70 + ph * 40) * s, (46 - u * 22) * s, [[0, mix(c, [255, 255, 255], 0.3), 0.4 * a * (1 - ph * 0.7)], [1, c, 0]], 1.25); } glow(ctx, x, y, 90 * s, c, 0.4 * a); }); }
const MATES = [['entp-female', 130, 1250, 2.0, [255, 150, 90], [255, 120, 90]], ['istj-male', 310, 1110, 1.5, [120, 170, 255], [110, 150, 255]], ['esfp-female', 480, 1230, 1.9, [255, 214, 110], [190, 130, 255]]];
const HX0 = 720, DESK = [860, 1090];
function draw(ctx, t) {
  const C = S.camKF(t, CAM), night = NIGHT(t), rainy = smooth(prog(t, T.d14 - 1.0, T.d14));
  ctx.fillStyle = 'rgb(90,56,60)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(BACK(), -PAD, -PAD / 2);
  // 拱窗 + 窗外
  const [wx, wy, ww, wh] = WIN, arch = () => { ctx.beginPath(); ctx.moveTo(wx, wy + wh); ctx.lineTo(wx, wy + ww / 2); ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy + wh); ctx.closePath(); };
  ctx.save(); arch(); ctx.clip(); ctx.drawImage(OUT[0](), wx, wy); ctx.globalAlpha = night; ctx.drawImage(OUT[1](), wx, wy); ctx.globalAlpha = 1;
  if (rainy > 0.01) { ctx.save(); ctx.translate(wx, wy); S.rain(ctx, t, { box: [-30, -30, ww + 30, wh + 30], a: 0.8 * rainy, n: 50, seed: 4 }); ctx.restore(); }
  // 窗外街上的路人（D14–D15）
  const so = smooth(prog(t, T.d14 - 0.4, T.d14 + 0.5)), given = smooth(prog(t, T.give - 0.6, T.d16 - 0.3));
  if (so > 0.01) { const px = wx + 150, py = wy + wh - 30; MB.person(ctx, 'isfp-male', px, py, 0.75, { a: so, dim: 0.75 - 0.6 * given, slump: 0.8 * (1 - given), shadow: 0 });
    const pc = [px + 4, py - 100]; S.add(ctx, () => glow(ctx, pc[0], pc[1], 50 + 90 * given, mix([110, 160, 255], WARM, given), (0.5 + 0.4 * given) * so));
    draw.SOS = pc; }
  ctx.restore();
  ctx.strokeStyle = 'rgb(236,220,206)'; ctx.lineWidth = 22; ctx.lineJoin = 'round'; arch(); ctx.stroke(); ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.moveTo(wx, wy + ww / 2 + 60); ctx.lineTo(wx + ww, wy + ww / 2 + 60); ctx.stroke(); ctx.fillStyle = 'rgb(236,220,206)'; ctx.fillRect(wx - 30, wy + wh, ww + 60, 22);
  // 求救的光圈：穿过玻璃传到她耳边
  if (so > 0.01 && draw.SOS && given < 0.95) for (let k = 0; k < 3; k++) { const ph = (t * 0.55 + k / 3) % 1; S.ring(ctx, draw.SOS[0], draw.SOS[1], 20 + ph * 560, 16, [120, 170, 255], 0.5 * (1 - ph) * so * (1 - given)); }
  // 吊灯（主光源）：白天暖，入夜后只留她桌上那盏
  const br = 1 + 0.03 * Math.sin(t * 0.8);
  for (const [lx, ly, k] of [[150, 300, 1 - 0.75 * night], [880, 260, 1 - 0.6 * night]]) { ctx.fillStyle = 'rgb(50,34,40)'; ctx.fillRect(lx - 2.5, -300, 5, ly + 290); S.poly(ctx, [[lx - 24, ly - 24], [lx + 24, ly - 24], [lx + 70, ly + 30], [lx - 70, ly + 30]], 'rgb(60,110,110)'); S.add(ctx, () => { glow(ctx, lx, ly + 40, 700 * br, WARM, 0.26 * k); glow(ctx, lx, ly + 36, 130, [255, 236, 190], 0.5 * k); }); }
  if (night > 0.01) { ctx.fillStyle = `rgba(14,10,36,${0.42 * night})`; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2); }
  // 同事（傍晚在，入夜走了）
  const mates = 1 - smooth(prog(t, T.d13 - 1.3, T.d13 - 0.3)), revive = smooth(prog(t, T.in, T.adapt)), see = smooth(prog(t, T.every - 0.3, T.every + 0.5)), bond = smooth(prog(t, T.shy + 0.4, T.friendly));
  const MP = [];
  if (mates > 0.01) MATES.forEach(([key, x, y, s, col, emo], i) => { const P = S.lit(ctx, c => MB.person(c, key, x - (1 - mates) * 400, y, s, { a: mates, bob: Math.abs(Math.sin(t * 2.2 + i * 1.7)) * 4, lean: Math.sin(t * 1.1 + i) * 0.02, warm: bond }), { light: [150, 300], at: [x, y - 120 * s], r: 180 * s, warm: [255, 220, 170], cool: [50, 20, 50], k: 0.85 }); MP.push(P); aura(ctx, P.chest[0], P.chest[1] - 6, s * 0.75, emo, see * (1 - bond) * mates, t, i * 5); if (bond > 0.01) S.add(ctx, () => glow(ctx, P.chest[0], P.chest[1], 110 * s * 0.6, WARM, 0.5 * bond * mates)); });
  // 她
  const focus = K.vis(t, T.d13 + 0.2, T.d14 + 0.4, 0.6, 0.6), ring = prog(t, T.phone - 0.15, T.alone), crack = ring > 0 && ring < 1 ? smooth(prog(ring, 0, 0.2)) * (1 - smooth(prog(ring, 0.75, 1))) : 0;
  const toWin = easeInOut(prog(t, T.d15 - 0.2, T.d15 + 0.9)), hx = lerp(lerp(HX0, 760, night), 640, toWin), hy = 1272;
  const flip = toWin > 0.3 && t < T.d16 + 0.3;
  const catchN = [0, 1, 2].map(i => prog(t, T.adapt + 0.2 + i * 0.75, T.adapt + 0.95 + i * 0.75));
  const o = { t, wind: focus < 0.5 && toWin < 0.3, spin: t * 2.2, dim: 0.85 * (1 - revive) + 0.45 * given, eyes: crack > 0.3 ? 'wide' : focus > 0.5 && so < 0.5 ? 'closed' : bond > 0.5 && night < 0.3 ? 'happy' : 'open', mouth: crack > 0.3 ? 'o' : 'smile', look: see > 0.3 && bond < 0.5 ? [-2, 0] : so > 0.5 ? [-1, -1] : [0.6, 0.4],
    la: -0.35 * bond * (1 - night) - 0.5 * focus - 0.9 * toWin, ra: -0.4 * focus - 0.8 * toWin, tilt: -0.2 * so * (1 - toWin), lean: 0.02 * Math.sin(t * 40) * crack };
  ctx.save(); if (flip) { ctx.translate(2 * hx, 0); ctx.scale(-1, 1); }
  const Rm = S.lit(ctx, c => infp(c, hx, hy, 1.0, o), { light: night > 0.5 ? [flip ? 2 * hx - 900 : 900, 800] : [880, 260], at: [hx, hy - 290], r: 340, warm: [255, 220, 170], cool: [40, 20, 60], k: 0.9 });
  ctx.restore(); const R = {}; for (const k in Rm) R[k] = flip ? [2 * hx - Rm[k][0], Rm[k][1]] : Rm[k];
  // D10：三只纸飞机（新观点）飞过来，被她接住
  MATES.forEach(([, x, y, s, col], i) => { const u = catchN[i]; if (u <= 0 || u >= 1.25 || !MP[i]) return; const e = easeInOut(clamp(u)), A = [MP[i].chest[0] + 60, MP[i].chest[1] - 60], B = [R.lh[0] - 10, R.lh[1] - 30], px = lerp(A[0], B[0], e), py = lerp(A[1], B[1], e) - Math.sin(e * Math.PI) * (160 + i * 40); plane(ctx, px, py, 1.0, Math.atan2(B[1] - A[1] - Math.cos(e * Math.PI) * 200, B[0] - A[0]), col, smooth(prog(u, 0, 0.15)) * (1 - smooth(prog(u, 0.95, 1.2)))); });
  const got = catchN.filter(u => u >= 1).length; if (got > 0 && night < 0.5) S.add(ctx, () => { for (let k = 0; k < got; k++) glow(ctx, R.wheel[0] + Math.cos(t * 2.2 + k * 2.1) * 34, R.wheel[1] + Math.sin(t * 2.2 + k * 2.1) * 34, 30, MATES[k][4], 0.9 * (1 - night)); });
  // D12：她和每个人之间松松的暖线
  if (bond > 0.01 && mates > 0.01) MP.forEach((P, i) => { const pts = Array.from({ length: 22 }, (_, k) => { const s = k / 21; return [lerp(R.chest[0], P.chest[0], s), lerp(R.chest[1], P.chest[1], s) + Math.sin(s * Math.PI) * (70 + i * 20) + Math.sin(t * 1.2 + i) * 8 * Math.sin(s * Math.PI)]; }); S.ribbon(ctx, pts, () => 5, [255, 170, 80], 0.5 * bond * mates, smooth(prog(bond, i * 0.2, 0.5 + i * 0.2))); });
  // 她胸口的光（D15：一块块掰出去）
  const hl = smooth(prog(t, T.d14, T.d15)) * (1 - 0.8 * given);
  if (hl > 0.01) S.add(ctx, () => { glow(ctx, R.chest[0], R.chest[1], 60 + 150 * hl, WARM, 0.6 * hl + 0.15); });
  if (toWin > 0.5 && draw.SOS) for (let k = 0; k < 4; k++) { const u = prog(t, T.give - 0.5 + k * 0.5, T.give + 0.3 + k * 0.5); if (u <= 0 || u >= 1) continue; const e = easeInOut(u), px = lerp(R.chest[0], draw.SOS[0], e), py = lerp(R.chest[1], draw.SOS[1], e) - Math.sin(e * Math.PI) * 90; S.add(ctx, () => { glow(ctx, px, py, 70, WARM, 0.9); glow(ctx, px, py, 24, [255, 250, 230], 1); }); }
  // 她的小书桌 + 台灯 + 电话
  const [dx, dy] = DESK, dg = ctx.createLinearGradient(0, dy, 0, dy + 34); dg.addColorStop(0, 'rgb(226,176,126)'); dg.addColorStop(1, 'rgb(170,116,86)'); ctx.fillStyle = dg; S.poly(ctx, [[dx - 130, dy], [dx + 330, dy], [dx + 350, dy + 34], [dx - 150, dy + 34]]); ctx.fill(); ctx.fillStyle = 'rgb(110,70,60)'; ctx.fillRect(dx - 120, dy + 34, 24, 240); ctx.fillRect(dx + 300, dy + 34, 24, 240);
  ctx.fillStyle = 'rgb(60,56,84)'; ctx.beginPath(); ctx.ellipse(dx + 250, dy - 4, 44, 10, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = 'rgb(84,80,116)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(dx + 250, dy - 8); ctx.quadraticCurveTo(dx + 290, dy - 120, dx + 220, dy - 170); ctx.stroke(); S.poly(ctx, [[dx + 240, dy - 190], [dx + 170, dy - 176], [dx + 150, dy - 110], [dx + 250, dy - 130]], 'rgb(230,150,100)');
  S.add(ctx, () => { glow(ctx, dx + 190, dy - 110, 520 * br, WARM, 0.2 + 0.26 * night); S.rgrad(ctx, dx + 120, dy + 4, 260, [[0, [255, 220, 160], 0.5], [1, [255, 220, 160], 0]], 0.16); });
  ctx.fillStyle = 'rgb(250,246,236)'; S.poly(ctx, [[dx - 60, dy - 4], [dx + 80, dy - 4], [dx + 96, dy + 20], [dx - 76, dy + 20]]); ctx.fill();
  // 桌上的手机
  const face = smooth(prog(t, T.alone - 0.3, T.alone + 0.2)) * (1 - smooth(prog(t, T.d16 - 0.4, T.d16))), fam = smooth(prog(t, T.d16 + 0.3, T.d16 + 0.9));
  const phx = dx + 20, phy = dy - 10, shake = (ring > 0 && ring < 0.8 ? Math.sin(t * 70) * 5 : 0) + (fam > 0.2 ? Math.sin(t * 60) * 2 * (Math.sin(t * 4) > 0 ? 1 : 0) : 0);
  ctx.save(); ctx.translate(phx + shake, phy); ctx.fillStyle = 'rgb(30,32,50)'; S.poly(ctx, [[-44, -18], [52, -18], [64, 18], [-56, 18]]); ctx.fill(); if (face < 0.5) { const on = ring > 0 && ring < 0.8 || fam > 0.2; ctx.fillStyle = on ? (fam > 0.2 ? 'rgb(255,220,170)' : 'rgb(255,140,130)') : 'rgb(70,76,110)'; S.poly(ctx, [[-38, -14], [48, -14], [58, 13], [-50, 13]]); ctx.fill(); if (on) S.add(ctx, () => glow(ctx, 4, 0, 110, fam > 0.2 ? WARM : [255, 90, 80], 0.6)); } ctx.restore();
  if (ring > 0 && ring < 0.8) for (let k = 0; k < 3; k++) { const ph = (t * 2.4 + k / 3) % 1; S.ring(ctx, phx, phy, 20 + ph * 330, 14, [255, 90, 80], 0.6 * (1 - ph)); }
  // 专注罩 + 绕着她转的纸页；电话一响裂开
  if (focus > 0.01) { const fc = [hx + 20, hy - 300], fr = 330;
    S.add(ctx, () => { S.rgrad(ctx, fc[0], fc[1], fr, [[0, [255, 226, 170], 0.04 * focus], [0.8, [255, 226, 170], 0.12 * focus], [0.97, [255, 240, 200], 0.4 * focus * (1 - 0.7 * crack)], [1, [255, 240, 200], 0]], 1.05); });
    for (let k = 0; k < 6; k++) { const a = t * 0.7 + k * 1.05, px = fc[0] + Math.cos(a) * 250, py = fc[1] + Math.sin(a) * 90 + Math.sin(a * 2) * 30, back = Math.sin(a) < 0; ctx.save(); ctx.translate(px + (crack ? Math.sin(t * 50 + k) * 8 * crack : 0), py); ctx.rotate(Math.sin(a) * 0.4); ctx.globalAlpha = focus * (back ? 0.5 : 1); ctx.fillStyle = 'rgb(255,250,236)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 10; ctx.fillRect(-32, -42, 64, 84); ctx.shadowColor = 'transparent'; for (let q = 0; q < 4; q++) { ctx.fillStyle = 'rgba(110,120,160,0.4)'; ctx.fillRect(-22, -28 + q * 16, 44 - q * 6, 6); } ctx.restore(); }
    if (crack > 0.02) { ctx.save(); ctx.strokeStyle = `rgba(255,250,240,${0.9 * crack})`; ctx.lineWidth = 6; ctx.lineJoin = 'bevel'; for (let k = 0; k < 7; k++) { const a0 = 2.2 + k * 0.5, len = fr * (0.4 + 0.6 * hash(k * 3.1)) * smooth(prog(ring, 0, 0.3)); ctx.beginPath(); let px = phx - 20, py = phy - 60; ctx.moveTo(px, py); for (let q = 1; q <= 4; q++) { px += Math.cos(a0 + (hash(k * 7 + q) - 0.5) * 1.2) * len / 4; py += Math.sin(a0 + (hash(k * 5 + q) - 0.5) * 1.2) * len / 4; ctx.lineTo(px, py); } ctx.stroke(); } ctx.restore();
      for (let k = 0; k < 10; k++) { const a = 2.4 + hash(k * 2.3) * 2.2, d = 60 + ring * 520 * (0.5 + hash(k * 9.1)); ctx.save(); ctx.translate(phx + Math.cos(a) * d, phy - 60 + Math.sin(a) * d * 0.9); ctx.rotate(t * 3 + k); ctx.fillStyle = `rgba(255,240,206,${0.7 * crack})`; S.poly(ctx, [[-16, -8], [14, -14], [8, 16]]); ctx.fill(); ctx.restore(); } } }
  ctx.restore();
  ctx.save(); S.cam(ctx, C, 1.6); ctx.globalAlpha = 1 - smooth(prog(C.z, 1.6, 2.1)); ctx.drawImage(FGPLANT(), 660, 1120); ctx.restore();
  return { C };
}
function over(ctx, t, a) {
  // D16：手机屏幕上「家」的未接来电（推近以后）
  const f = smooth(prog(t, T.d16 + 0.7, T.d16 + 1.2)) * (1 - smooth(prog(t, T.end - 0.4, T.end))) * a; if (f <= 0.003) return;
  ctx.save(); ctx.translate(540, 640); ctx.rotate(-0.04);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.fillStyle = `rgba(36,30,44,${0.94 * f})`; ctx.beginPath(); ctx.roundRect(-330, -300, 660, 600, 40); ctx.fill(); ctx.shadowColor = 'transparent';
  S.add(ctx, () => glow(ctx, 0, -120, 300, WARM, 0.3 * f));
  // 一张「等你吃饭」的小照片：一盏灯、一张桌、两个人
  ctx.globalAlpha = f; const g = ctx.createLinearGradient(0, -270, 0, -30); g.addColorStop(0, 'rgb(255,214,150)'); g.addColorStop(1, 'rgb(200,120,90)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-150, -270, 300, 230, 24); ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-150, -270, 300, 230, 24); ctx.clip(); MB.person(ctx, 'isfj-male', -60, -40, 0.62, { shadow: 0 }); MB.person(ctx, 'enfp-female', 60, -40, 0.5, { shadow: 0, flip: true }); ctx.fillStyle = 'rgb(150,90,70)'; ctx.fillRect(-150, -70, 300, 40); S.add(ctx, () => glow(ctx, 0, -250, 120, [255, 244, 200], 0.8)); ctx.restore(); ctx.globalAlpha = 1;
  K.text(ctx, '家', 0, 50, { size: 90, weight: 500, color: [255, 240, 220], alpha: f });
  const n = Math.min(3, 1 + Math.floor(Math.max(0, t - T.fam) / 0.7));
  K.text(ctx, '未接来电 × ' + n, 0, 140, { size: 50, weight: 500, color: [255, 130, 120], alpha: f, spacing: 0.06 }); K.text(ctx, '「饭热了第三遍了，等你。」', 0, 230, { size: 40, color: [226, 214, 220], alpha: f * 0.9 });
  ctx.restore();
}
module.exports = { draw, over, T };
