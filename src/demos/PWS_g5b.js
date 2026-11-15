'use strict';
// PWG5 第二幕「家」：E01–E09（之后书页 P3）
//   场景：夜里的客厅。一盏落地灯（主光源，暖）、沙发、茶几、地毯、书架、墙上的合照、右边一扇夜色的窗和窗帘、后面的水槽台面；前景虚化的绿植
//   E01 喜欢和谐：他在沙发上看书，她在旁边摆花；天花板垂下来一只挂饰（月亮和星星），稳稳地平着
//   E02 竭力避免矛盾：他头顶冒出一颗带刺的小火星（不耐烦），挂饰跟着一歪 —— 她立刻凑过去，一捧一吹，火星变成一小团粉色的绒；又冒一颗，她又去扑
//   E03 没法敞开心扉：她背后藏着一封心形的信。胸口有两扇小门，开了一条缝透出光，又合上；信递出去一半，缩回来，他转头看她，她看天花板
//   E04 敏锐感知配偶的情绪 / 逗他开心：他头顶一小朵下雨的云；她眼睛一亮（和开头的六眼呼应），转起风车，吹过去一串花瓣和小星星，云散了变成小太阳，他笑得直晃
//   E05 坚守理想：她举起手，头顶浮出一只发光的圆画框 —— 云上的城堡、月牙、两个小人在跳舞（她理想里的婚姻，童话插画的样子）
//   E06 婚后的现实、朝夕相处：窗外的太阳和月亮飞快地轮着过，水槽里的碗越摞越高，两个人各坐沙发一头，脸上映着各自手机的光
//   E07 相去甚远：那只画框越飘越高、越来越小，飘出窗外成了天上一颗很远的星，她仰头伸手
//   E08 最美好的日子：茶几上一个点着蜡烛的蛋糕，两个人挨着，暖光把他们罩成一个圈；说到「惶恐不安」，暗影从画面四角一点点爬向这个圈，只有她回头看见了
//   E09 担心幸福要以日后的牺牲为代价：暖光圈上挂下来一张大大的价签，正面「眼前的幸福」，翻过来「代价：日后结算」，她攥着价签
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const { K, GOLD, LIME, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;
const { moodWin } = require('./PWS_g5a');

const FY = 1050, PAD = 240, WARM = [255, 200, 130], LAMP = [150, 560];
const T = { in: vs('E01') - 1.0, e01: vs('E01'), harm: at('E01', '和谐'), e02: vs('E02'), e03: vs('E03'), open: at('E03', '敞开'), e04: vs('E04'), sense: at('E04', '感知'), fun: at('E04', '逗'), e05: vs('E05'), ideal: at('E05', '理想'), e06: vs('E06'), real: at('E06', '现实'), daily: at('E06', '朝夕'),
  e07: vs('E07'), far: at('E07', '相去'), e08: vs('E08'), best: at('E08', '最美好'), fear: at('E08', '惶恐'), e09: vs('E09'), cost: at('E09', '代价'), end: ve('E09') + 0.5 };
const CAM = [[T.in, { x: 0, y: 0, z: 1.25, ax: 540, ay: 1000 }], [T.e01 + 1.0, { x: 0, y: 0, z: 1.0 }], [T.e02, { x: -30, y: 0, z: 1.1 }], [T.e03, { x: 0, y: 0, z: 1.1 }], [T.e03 + 0.9, { x: 110, y: 10, z: 1.42 }], [T.e04 - 0.2, { x: 110, y: 10, z: 1.46 }], [T.e04 + 0.8, { x: -40, y: 0, z: 1.12 }], [T.e05 - 0.2, { x: -30, y: 0, z: 1.14 }],
  [T.e05 + 0.9, { x: 60, y: -150, z: 1.1 }], [T.e06, { x: 60, y: -150, z: 1.12 }], [T.e06 + 0.9, { x: 0, y: -10, z: 0.96 }], [T.e07, { x: 0, y: -10, z: 0.98 }], [T.far + 0.5, { x: 80, y: -200, z: 1.06 }], [T.e08, { x: 60, y: -180, z: 1.06 }], [T.e08 + 0.9, { x: -30, y: 40, z: 1.34 }], [T.fear, { x: -30, y: 40, z: 1.36 }], [T.fear + 0.9, { x: 0, y: 0, z: 0.98 }], [T.end, { x: 0, y: -30, z: 1.04 }]];
const WIN = [690, 280, 300, 440];
const BACK = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2); const r = mulberry32(81);
  S.vgrad(c, [[0, [70, 52, 80]], [1, [128, 88, 96]]], -PAD, FY, -PAD, W + PAD);
  for (let x = -PAD; x < W + PAD; x += 70) { c.fillStyle = 'rgba(255,220,190,0.025)'; c.fillRect(x, -PAD, 35, FY + PAD); }
  c.fillStyle = 'rgb(64,44,60)'; c.fillRect(-PAD, FY - 26, W + PAD * 2, 26);
  S.vgrad(c, [[0, [140, 100, 90]], [0.4, [100, 70, 76]], [1, [36, 26, 44]]], FY, H + PAD, -PAD, W + PAD);
  for (let i = -8; i <= 20; i++) { const xb = i * 150, xa = 540 + (xb - 540) * 0.5; S.poly(c, [[xa - 1.5, FY], [xa + 1.5, FY], [xb + 5, H + PAD], [xb - 5, H + PAD]], 'rgba(40,10,20,0.2)'); }
  // 地毯
  c.save(); c.translate(470, 1300); c.scale(1, 0.2); const rg = c.createRadialGradient(0, 0, 40, 0, 0, 520); rg.addColorStop(0, 'rgb(190,130,120)'); rg.addColorStop(0.7, 'rgb(150,96,110)'); rg.addColorStop(0.72, 'rgb(230,200,170)'); rg.addColorStop(0.8, 'rgb(150,96,110)'); rg.addColorStop(1, 'rgb(110,70,96)'); c.fillStyle = rg; c.beginPath(); c.arc(0, 0, 520, 0, 6.2832); c.fill(); c.restore();
  // 墙上的合照
  for (const [x, y, w, h] of [[330, 330, 150, 190], [500, 380, 110, 130], [330, 550, 110, 110]]) { c.fillStyle = 'rgb(50,34,50)'; c.fillRect(x - 8, y - 8, w + 16, h + 16); const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, 'rgb(250,206,160)'); g.addColorStop(1, 'rgb(180,120,130)'); c.fillStyle = g; c.fillRect(x, y, w, h); c.fillStyle = 'rgba(90,150,120,0.8)'; c.beginPath(); c.arc(x + w * 0.38, y + h * 0.6, w * 0.16, 0, 6.2832); c.fill(); c.fillStyle = 'rgba(90,120,190,0.8)'; c.beginPath(); c.arc(x + w * 0.64, y + h * 0.56, w * 0.17, 0, 6.2832); c.fill(); }
  // 后面的台面 + 水槽
  c.fillStyle = 'rgb(96,70,84)'; c.fillRect(820, 880, 500, 170); c.fillStyle = 'rgb(214,200,206)'; c.fillRect(806, 862, 520, 22); c.fillStyle = 'rgb(150,156,176)'; c.fillRect(880, 850, 160, 14); c.strokeStyle = 'rgb(190,196,214)'; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(1010, 850); c.lineTo(1010, 790); c.quadraticCurveTo(1010, 770, 980, 772); c.stroke();
  // 沙发
  const sg = c.createLinearGradient(0, 900, 0, 1200); sg.addColorStop(0, 'rgb(110,150,160)'); sg.addColorStop(1, 'rgb(60,96,116)'); c.fillStyle = sg; c.beginPath(); c.roundRect(40, 880, 620, 210, 50); c.fill(); c.fillStyle = 'rgb(130,170,176)'; c.beginPath(); c.roundRect(20, 1040, 660, 130, 40); c.fill(); c.fillStyle = 'rgb(84,124,140)'; c.beginPath(); c.roundRect(0, 980, 90, 200, 36); c.fill(); c.beginPath(); c.roundRect(610, 980, 90, 200, 36); c.fill();
  c.fillStyle = 'rgb(240,190,150)'; c.beginPath(); c.roundRect(120, 960, 130, 100, 30); c.fill();
  // 落地灯
  c.fillStyle = 'rgb(60,50,70)'; c.fillRect(LAMP[0] - 5, LAMP[1], 10, 600); c.beginPath(); c.ellipse(LAMP[0], 1160, 60, 12, 0, 0, 6.2832); c.fill(); S.poly(c, [[LAMP[0] - 56, LAMP[1] - 110], [LAMP[0] + 56, LAMP[1] - 110], [LAMP[0] + 96, LAMP[1] + 10], [LAMP[0] - 96, LAMP[1] + 10]]); const lg = c.createLinearGradient(0, LAMP[1] - 110, 0, LAMP[1] + 10); lg.addColorStop(0, 'rgb(255,226,170)'); lg.addColorStop(1, 'rgb(250,180,110)'); c.fillStyle = lg; c.fill();
}));
const FGP = S.lazy(() => S.bake(700, 800, c => { const r = mulberry32(15); c.filter = 'blur(9px)'; for (let i = 0; i < 9; i++) { const a = -1.9 + i * 0.3, L = 360 + r() * 260; c.fillStyle = rgba(mix([24, 14, 30], [50, 80, 76], r() * 0.6)); c.save(); c.translate(120, 800); c.rotate(a); c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(L * 0.5, -90, L, 0); c.quadraticCurveTo(L * 0.5, 90, 0, 0); c.fill(); c.restore(); } }));
// 理想里的婚姻：圆画框里的童话插画
const IDEAL = S.lazy(() => S.bake(600, 600, c => {
  c.translate(300, 300); c.save(); c.beginPath(); c.arc(0, 0, 270, 0, 6.2832); c.clip();
  S.vgrad(c, [[0, [70, 80, 170]], [0.6, [190, 150, 220]], [1, [255, 200, 210]]], -300, 300, -300, 300); S.stars(c, 4, [-300, -300, 300, 60], 40, 1);
  c.fillStyle = 'rgb(255,246,214)'; c.beginPath(); c.arc(150, -150, 56, 0, 6.2832); c.fill(); c.fillStyle = 'rgb(110,104,190)'; c.beginPath(); c.arc(172, -164, 50, 0, 6.2832); c.fill();
  // 云上的城堡
  for (const [x, w, h] of [[-150, 60, 150], [-80, 90, 210], [20, 70, 170], [-20, 50, 260]]) { const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgb(255,236,240)'); g.addColorStop(1, 'rgb(214,180,230)'); c.fillStyle = g; c.fillRect(x, 90 - h, w, h); S.poly(c, [[x - 8, 90 - h], [x + w + 8, 90 - h], [x + w / 2, 90 - h - w * 0.9]], 'rgb(255,150,170)'); c.fillStyle = 'rgba(255,220,130,0.9)'; c.fillRect(x + w / 2 - 7, 110 - h, 14, 22); }
  for (let k = 0; k < 9; k++) S.rgrad(c, -260 + k * 66, 110 + (k % 2) * 24, 110, [[0, [255, 255, 255], 0.95], [0.7, [255, 240, 250], 0.8], [1, [255, 240, 250], 0]], 0.5);
  MB.person(c, 'enfp-male', 130, 196, 0.5, { shadow: 0, lean: -0.12 }); c.save(); c.translate(250, 0); c.scale(-1, 1); MB.person(c, 'infp-female', 34, 196, 0.5, { shadow: 0, lean: -0.12 }); c.restore();
  S.add(c, () => glow(c, 190, 150, 150, [255, 220, 170], 0.5));
  c.restore(); c.strokeStyle = 'rgb(255,226,160)'; c.lineWidth = 18; c.beginPath(); c.arc(0, 0, 270, 0, 6.2832); c.stroke(); c.strokeStyle = 'rgba(190,130,70,0.8)'; c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 281, 0, 6.2832); c.stroke();
}));
function mobile(ctx, x, t, tilt) {
  ctx.strokeStyle = 'rgba(240,226,220,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, -200); ctx.lineTo(x, 330); ctx.stroke();
  ctx.save(); ctx.translate(x, 330); ctx.rotate(tilt + Math.sin(t * 0.9) * 0.015); ctx.strokeStyle = 'rgb(214,170,110)'; ctx.lineWidth = 8; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-130, 0); ctx.lineTo(130, 0); ctx.stroke();
  for (const [dx, len, kind] of [[-130, 70, 0], [0, 110, 2], [130, 70, 1]]) { ctx.strokeStyle = 'rgba(240,226,220,0.7)'; ctx.lineWidth = 3; ctx.save(); ctx.translate(dx, 0); ctx.rotate(-tilt); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, len); ctx.stroke(); S.add(ctx, () => glow(ctx, 0, len + 20, 70, [255, 226, 150], 0.5));
    ctx.fillStyle = 'rgb(255,230,150)'; if (kind === 0) { ctx.beginPath(); ctx.arc(0, len + 22, 24, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(110,76,90)'; ctx.beginPath(); ctx.arc(10, len + 14, 20, 0, 6.2832); ctx.fill(); } else { ctx.beginPath(); for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5 - 1.57, rr = k % 2 ? 11 : 26; ctx.lineTo(Math.cos(a) * rr, len + 24 + Math.sin(a) * rr); } ctx.fill(); } ctx.restore(); }
  ctx.restore();
}
function spark(ctx, x, y, s, u) {      // 带刺的小火星 → 粉色绒团（u 0-1）
  ctx.save(); ctx.translate(x, y); const col = mix([255, 80, 60], [255, 190, 206], u); S.add(ctx, () => glow(ctx, 0, 0, 110 * s, col, 0.6));
  ctx.fillStyle = rgba(col); ctx.beginPath(); const n = 18; for (let k = 0; k < n; k++) { const a = k / n * 6.2832 + 0.3, rr = (k % 2 ? 22 : lerp(54, 30, u)) * s * (1 + 0.1 * Math.sin(a * 3)); ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.beginPath(); ctx.arc(-8 * s, -8 * s, 9 * s, 0, 6.2832); ctx.fill(); ctx.restore();
}
const PX = 300, HXB = 760, GYB = 1280;
function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  ctx.fillStyle = 'rgb(70,52,80)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(BACK(), -PAD, -PAD / 2);
  // 窗：夜色；E06 时日月飞快地轮
  const [wx, wy, ww, wh] = WIN, cyc = prog(t, T.daily - 0.9, T.e07 - 0.1), dn = cyc > 0 && cyc < 1 ? cyc * 4 : 0, day = cyc > 0 && cyc < 1 ? 0.5 - 0.5 * Math.cos(dn * 6.2832) : 0;
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  const sky = mix([16, 20, 56], [150, 200, 250], day); S.vgrad(ctx, [[0, sky], [1, mix([56, 56, 120], [255, 230, 200], day)]], wy, wy + wh, wx, wx + ww);
  S.add(ctx, () => { for (let k = 0; k < 12; k++) glow(ctx, wx + hash(k * 3.1) * ww, wy + 260 + hash(k * 7.7) * 170, 12 + hash(k) * 8, [255, 206, 140], 0.6 * (1 - day)); });
  if (cyc > 0 && cyc < 1) { const a = dn * 6.2832; S.add(ctx, () => { glow(ctx, wx + ww / 2 + Math.cos(a - 1.57) * 170, wy + 260 + Math.sin(a - 1.57) * 220, 90, [255, 226, 150], 1); glow(ctx, wx + ww / 2 - Math.cos(a - 1.57) * 170, wy + 260 - Math.sin(a - 1.57) * 220, 60, [220, 230, 255], 0.9); }); } else S.add(ctx, () => glow(ctx, wx + 210, wy + 100, 56, [226, 232, 255], 0.9));
  // E07：飘远的画框成了窗外的一颗星
  const farU = smooth(prog(t, T.far + 0.2, T.e08 - 0.2)); if (farU > 0.01 && t < T.e08 + 1) S.add(ctx, () => glow(ctx, wx + 120, wy + 90, 30, [255, 220, 200], farU * (1 - smooth(prog(t, T.e08, T.e08 + 0.8)))));
  ctx.restore();
  ctx.fillStyle = 'rgb(236,220,214)'; ctx.fillRect(wx - 14, wy - 14, ww + 28, 14); ctx.fillRect(wx - 14, wy, 14, wh); ctx.fillRect(wx + ww, wy, 14, wh); ctx.fillRect(wx + ww / 2 - 5, wy, 10, wh); ctx.fillRect(wx - 26, wy + wh, ww + 52, 20);
  for (const sd of [-1, 1]) for (let k = 0; k < 4; k++) { const fx = (sd < 0 ? wx - 70 : wx + ww - 18) + k * 22, g = ctx.createLinearGradient(fx, 0, fx + 23, 0); g.addColorStop(0, 'rgb(150,90,110)'); g.addColorStop(0.5, 'rgb(206,140,150)'); g.addColorStop(1, 'rgb(120,70,100)'); ctx.fillStyle = g; ctx.fillRect(fx, wy - 30, 23, wh + 130); }
  // 水槽里的碗（E06 越摞越高）
  const dish = Math.floor(clamp(prog(t, T.real - 0.3, T.e07)) * 9); for (let k = 0; k < dish; k++) { ctx.fillStyle = k % 2 ? 'rgb(250,246,240)' : 'rgb(214,226,240)'; ctx.beginPath(); ctx.ellipse(950 + Math.sin(k * 2.3) * 14, 846 - k * 13, 56, 12, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgba(0,0,30,0.12)'; ctx.beginPath(); ctx.ellipse(950 + Math.sin(k * 2.3) * 14, 849 - k * 13, 56, 9, 0, 0, Math.PI); ctx.fill(); }
  // 落地灯的光（主光源，缓慢呼吸）
  const br = 1 + 0.03 * Math.sin(t * 0.8), cake = 0, fear = 0, real = smooth(prog(t, T.real - 0.4, T.real + 0.5)) * (1 - smooth(prog(t, T.e08 - 0.6, T.e08)));
  S.add(ctx, () => { glow(ctx, LAMP[0], LAMP[1] - 30, 900 * br, WARM, 0.36 * (1 - 0.5 * real)); glow(ctx, LAMP[0], LAMP[1] - 40, 190, [255, 236, 190], 0.5); S.rgrad(ctx, 420, 1260, 700, [[0, WARM, 0.26 * (1 - 0.5 * real)], [1, WARM, 0]], 0.22); });
  if (real > 0.01) { ctx.fillStyle = `rgba(20,24,56,${0.34 * real})`; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2); }
  // 挂饰（和谐）
  const sp = [T.e02 + 0.3, T.e02 + 1.7].map(t0 => ({ t0, u: prog(t, t0, t0 + 1.2) })), act = sp.find(q => q.u > 0 && q.u < 1), tiltM = act ? 0.3 * Math.sin(Math.PI * Math.min(1, act.u * 1.4)) * (1 - smooth(prog(act.u, 0.55, 0.9))) : 0;
  // 他
  const laugh = smooth(prog(t, T.fun + 0.5, T.fun + 1.0)) * (1 - smooth(prog(t, T.e05, T.e05 + 0.8))), sad = smooth(prog(t, T.e04 - 0.4, T.e04 + 0.3)) * (1 - smooth(prog(t, T.fun + 0.3, T.fun + 0.9)));
  const P = S.lit(ctx, c => MB.person(c, 'isfj-male', PX, GYB - 40, 2.1, { bob: Math.abs(Math.sin(t * 9)) * 9 * laugh + Math.abs(Math.sin(t * 2)) * 2, slump: 0.5 * sad + 0.5 * real, lean: 0.03 * Math.sin(t * 9) * laugh, gray: 0.3 * real }), { light: LAMP, at: [PX, GYB - 290], r: 320, warm: [255, 220, 170], cool: [40, 24, 60], k: 0.9 });
  // 她
  const dash = act ? smooth(prog(act.u, 0.2, 0.55)) * (1 - smooth(prog(act.u, 0.8, 1))) : 0;
  const hide = smooth(prog(t, T.e03, T.e03 + 0.5)) * (1 - smooth(prog(t, T.e04 - 0.3, T.e04))), offer = Math.sin(Math.PI * prog(t, T.open + 0.9, T.open + 2.3)) * hide;
  const glint = K.vis(t, T.sense - 0.2, T.fun + 0.2, 0.2, 0.5), blow = smooth(prog(t, T.fun - 0.1, T.fun + 0.5)) * (1 - smooth(prog(t, T.e05 - 0.2, T.e05 + 0.4)));
  const idl = smooth(prog(t, T.e05 + 0.2, T.ideal)), drift = easeIn(prog(t, T.e07 - 0.1, T.far + 0.9)), reach = smooth(prog(t, T.e07 + 0.2, T.far + 0.4)) * (1 - smooth(prog(t, T.e08 - 0.5, T.e08)));
  const hx = HXB - dash * 250 - cake * 250, flip = t < T.e05 + 0.2 || cake > 0.5;
  const o = { t, flies: t > T.sense - 0.7 && t < T.e05 + 0.2 ? 0 : 1, wind: hide < 0.3 && real < 0.3, spin: t * (1.5 + 12 * blow), eyes: fear > 0.3 ? 'wide' : real > 0.5 ? 'sad' : laugh > 0.5 || cake > 0.6 || t < T.e02 ? 'happy' : glint > 0.5 ? 'wide' : hide > 0.5 ? 'open' : 'open', mouth: fear > 0.3 ? 'o' : real > 0.5 ? 'flat' : 'smile', look: fear > 0.3 ? [2, -1] : hide > 0.5 && offer < 0.3 ? [0, -1.8] : reach > 0.3 ? [0.5, -2] : [1.2, 0],
    la: -0.9 * dash - 0.9 * idl * (1 - drift) - 1.2 * reach - 0.6 * offer, ra: -0.6 * dash - 0.5 * blow - 0.9 * idl * (1 - drift) - 0.9 * reach + 0.5 * hide * (1 - offer), tilt: -0.3 * idl * (1 - drift) - 0.4 * reach + 0.3 * real, lean: 0.03 * Math.sin(t * 5) * fear, dim: 0.3 * real };
  ctx.save(); if (flip) { ctx.translate(2 * hx, 0); ctx.scale(-1, 1); }
  const Rm = S.lit(ctx, c => infp(c, hx, GYB, 1.0, o), { light: flip ? [2 * hx - LAMP[0], LAMP[1]] : LAMP, at: [hx, GYB - 290], r: 340, warm: [255, 220, 170], cool: [40, 24, 60], k: 0.9 });
  ctx.restore(); const R = {}; for (const k in Rm) R[k] = flip ? [2 * hx - Rm[k][0], Rm[k][1]] : Rm[k];
  // E02（2026-11-15 反馈 10 重做）：矛盾 = 两个人之间裂开的一道缝。他「啧」一声，地毯上就裂开一道发红的缝朝她这边爬；
  //   她立刻扑过去，一针一针用金线把它缝上，补上一颗小心形的补丁；刚缝完，身后墙上又裂一道，她再去贴上创可贴
  const CRK = [[[250, 1386], [330, 1412], [400, 1380], [486, 1416], [560, 1388], [640, 1420], [700, 1396]], [[452, 610], [486, 660], [462, 700], [508, 742], [490, 790]]];
  sp.forEach((q, i) => { const keep = 1 - smooth(prog(t, T.e03 - 0.2, T.e03 + 0.6)); if (q.u <= 0 || keep <= 0.01) return; const pts = CRK[i], grow = easeOut(prog(q.u, 0, 0.32)), sew = prog(q.u, 0.42, 0.82), P2 = K.partial(pts, grow), heal = smooth(sew);
    ctx.save(); ctx.globalAlpha = keep; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (P2.length > 1) { S.add(ctx, () => { const m = P2[P2.length - 1]; glow(ctx, m[0], m[1], 90 * (1 - heal), [255, 80, 70], 0.7 * (1 - heal)); });
      ctx.beginPath(); P2.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = `rgba(40,10,30,${0.9 * (1 - 0.8 * heal)})`; ctx.lineWidth = 20 * (1 - 0.75 * heal); ctx.stroke(); ctx.strokeStyle = `rgba(255,90,70,${0.95 * (1 - heal)})`; ctx.lineWidth = 7; ctx.stroke(); }
    // 金线：沿着裂缝一针一针缝过去
    const n = (pts.length - 1) * 2; for (let k = 0; k < n; k++) { const su = easeOut(prog(sew, k / n * 0.85, k / n * 0.85 + 0.15)); if (su <= 0) continue; const seg = Math.floor(k / 2), f = (k % 2) * 0.5 + 0.25, a0 = pts[seg], b0 = pts[seg + 1], mx = lerp(a0[0], b0[0], f), my = lerp(a0[1], b0[1], f), dx = b0[0] - a0[0], dy = b0[1] - a0[1], L = Math.hypot(dx, dy), nx = -dy / L * 20, ny = dx / L * 20;
      ctx.strokeStyle = 'rgb(255,214,120)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(mx - nx, my - ny); ctx.lineTo(mx - nx + 2 * nx * su, my - ny + 2 * ny * su); ctx.stroke(); }
    const pu = prog(q.u, 0.8, 1); if (pu > 0) { const e = easeOut(pu) * (1 + 0.3 * Math.sin(Math.min(1, pu) * Math.PI)), c = pts[Math.floor(pts.length / 2)]; S.add(ctx, () => glow(ctx, c[0], c[1], 100 * e, [255, 170, 180], 0.5)); ctx.translate(c[0], c[1]); ctx.rotate(i ? 0.5 : -0.15);
      if (i === 0) { const h = 30 * e; ctx.fillStyle = 'rgb(255,150,170)'; ctx.beginPath(); ctx.moveTo(0, h); ctx.bezierCurveTo(-h * 1.5, 0, -h * 1.2, -h * 1.3, 0, -h * 0.5); ctx.bezierCurveTo(h * 1.2, -h * 1.3, h * 1.5, 0, 0, h); ctx.fill(); }
      else { ctx.fillStyle = 'rgb(250,220,190)'; ctx.beginPath(); ctx.roundRect(-58 * e, -20 * e, 116 * e, 40 * e, 20 * e); ctx.fill(); ctx.fillStyle = 'rgb(255,246,236)'; ctx.fillRect(-18 * e, -20 * e, 36 * e, 40 * e); } }
    ctx.restore();
    // 他的「啧」
    const tz = K.vis(t, q.t0 - 0.1, q.t0 + 0.6, 0.15, 0.3); if (tz > 0.01) { ctx.save(); ctx.globalAlpha = tz; ctx.translate(P.head[0] + 150 + i * 20, P.top[1] - 30); ctx.rotate(0.1); ctx.fillStyle = 'rgb(255,250,240)'; ctx.beginPath(); ctx.roundRect(-56, -50, 112, 96, 30); ctx.fill(); S.poly(ctx, [[-36, 40], [-8, 40], [-50, 80]], 'rgb(255,250,240)'); K.text(ctx, '啧', 0, 20, { size: 60, weight: 500, color: [200, 70, 60] }); ctx.restore(); } });
  { const sw = K.vis(t, T.e02 + 1.2, T.e03 + 0.2, 0.3, 0.4); if (sw > 0.01) { const ph = (t * 0.8) % 1; ctx.fillStyle = `rgba(150,206,250,${sw * (1 - ph)})`; ctx.beginPath(); ctx.ellipse(R.head[0] + (flip ? 50 : -50), R.head[1] - 20 + ph * 40, 9, 14, 0, 0, 6.2832); ctx.fill(); } }
  // E03：胸口的两扇小门 + 藏在背后的心形信
  if (hide > 0.01) { const [cx, cy] = R.chest, op = Math.sin(Math.PI * prog(t, T.open - 0.3, T.open + 1.0)) * 0.9; ctx.save(); ctx.globalAlpha = hide; S.add(ctx, () => glow(ctx, cx, cy, 150 * op + 30, [255, 190, 170], 0.7 * op + 0.1));
    ctx.fillStyle = 'rgb(255,236,200)'; ctx.fillRect(cx - 34, cy - 40, 68, 80); for (const sd of [-1, 1]) { const w = 34 * (1 - op * 0.8); const g = ctx.createLinearGradient(cx, 0, cx + sd * 34, 0); g.addColorStop(0, 'rgb(150,100,90)'); g.addColorStop(1, 'rgb(100,64,70)'); ctx.fillStyle = g; ctx.fillRect(sd < 0 ? cx - 34 : cx + 34 - w, cy - 40, w, 80); } ctx.strokeStyle = 'rgb(70,44,56)'; ctx.lineWidth = 6; ctx.strokeRect(cx - 37, cy - 43, 74, 86);
    const lx = lerp(R.rh[0] + 50, R.lh[0] - 110, offer), ly = lerp(R.rh[1] + 40, R.lh[1] - 30, offer); S.add(ctx, () => glow(ctx, lx, ly, 110, [255, 150, 170], 0.5)); ctx.translate(lx, ly); ctx.rotate(-0.2); ctx.fillStyle = 'rgb(255,246,240)'; ctx.beginPath(); ctx.roundRect(-54, -36, 108, 72, 8); ctx.fill(); ctx.fillStyle = 'rgb(240,110,130)'; ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-34, -4, -26, -30, 0, -12); ctx.bezierCurveTo(26, -30, 34, -4, 0, 20); ctx.fill(); ctx.restore(); }
  // E04（反馈 10 重做，不再用眼睛放光）：他嘴上说「我没事。」—— 她发边那只小蝴蝶飞过去，停在他肩上，翅膀慢慢变成灰蓝色（感知到了）；
  //   他胸口这才打开一扇小窗：里面在下雨。她吹起风车逗他，花瓣和小星星飞过去，小窗里雨停出太阳，蝴蝶的翅膀变回暖色飞回来
  { const say = K.vis(t, T.e04 - 0.2, T.sense + 0.5, 0.25, 0.3); if (say > 0.01) { ctx.save(); ctx.globalAlpha = say; ctx.translate(P.head[0] + 30, P.top[1] - 70); ctx.fillStyle = 'rgb(255,250,240)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.roundRect(-110, -50, 220, 96, 34); ctx.fill(); ctx.shadowColor = 'transparent'; S.poly(ctx, [[-30, 40], [0, 40], [-40, 84]], 'rgb(255,250,240)'); K.text(ctx, '我没事。', 0, 16, { size: 48, weight: 500, color: [90, 70, 80] }); ctx.restore(); }
    const go = easeInOut(prog(t, T.sense - 0.7, T.sense + 0.1)), back = easeInOut(prog(t, T.fun + 0.9, T.e05 + 0.2)), felt = smooth(prog(t, T.sense + 0.1, T.sense + 0.7)), sunK = smooth(prog(t, T.fun + 0.4, T.fun + 1.0));
    const A0 = [R.top[0] + (flip ? 90 : -90), R.top[1] + 60], B0 = [P.head[0] + 86, P.head[1] + 96], f = go * (1 - back), bx = lerp(A0[0], B0[0], f) + Math.sin(f * Math.PI) * 0, by = lerp(A0[1], B0[1], f) - Math.sin(f * Math.PI) * 120 + Math.sin(t * 6) * 6 * Math.sin(f * Math.PI);
    draw.BFLY = (t > T.sense - 0.7 && back < 1) ? { x: bx, y: by, landed: go >= 1 && back <= 0, col: mix(mix([217, 227, 84], [120, 140, 200], felt * (1 - sunK)), [255, 200, 120], sunK * (1 - back)), col2: mix(mix([120, 206, 160], [80, 96, 160], felt * (1 - sunK)), [255, 150, 130], sunK * (1 - back)) } : null;
    const wa = felt * (1 - smooth(prog(t, T.e05 + 0.1, T.e05 + 0.7))); if (wa > 0.01) { if (sunK < 1) moodWin(ctx, P.chest[0] - 30, P.chest[1] + 30, 86, 0, wa * (1 - sunK), t); if (sunK > 0) moodWin(ctx, P.chest[0] - 30, P.chest[1] + 30, 86, 1, wa * sunK, t); }
    if (felt > 0.02 && sunK < 0.5) for (let k = 0; k < 3; k++) { const ph = (t * 0.6 + k / 3) % 1, pp = [lerp(B0[0], R.head[0], ph), lerp(B0[1], R.head[1], ph) - Math.sin(ph * Math.PI) * 70]; S.add(ctx, () => glow(ctx, pp[0], pp[1], 26, [150, 190, 255], 0.8 * Math.sin(ph * Math.PI) * felt)); } }
  if (blow > 0.01) for (let k = 0; k < 14; k++) { const ph = (t * 0.9 + k / 14) % 1, A = R.wheel, B = [P.head[0] + 40, P.head[1] - 40], px = lerp(A[0], B[0], ph), py = lerp(A[1], B[1], ph) - Math.sin(ph * Math.PI) * (80 + (k % 4) * 30) + Math.sin(t * 5 + k) * 10; ctx.save(); ctx.translate(px, py); ctx.rotate(t * 3 + k); ctx.globalAlpha = blow * Math.sin(ph * Math.PI); if (k % 3) { ctx.fillStyle = k % 2 ? 'rgb(255,180,200)' : 'rgb(255,236,226)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 9, 0, 0, 6.2832); ctx.fill(); } else { ctx.fillStyle = 'rgb(255,230,130)'; ctx.beginPath(); for (let q = 0; q < 10; q++) { const a = q * Math.PI / 5, rr = q % 2 ? 8 : 20; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); } ctx.restore(); }
  if (draw.BFLY) { const b = draw.BFLY, fl = b.landed ? 0.75 + 0.25 * Math.abs(Math.cos(t * 2.5)) : 0.3 + 0.7 * Math.abs(Math.cos(t * 12)); ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(-0.3); ctx.scale(1.7, 1.7); S.add(ctx, () => glow(ctx, 0, 0, 60, b.col, 0.5));
    S.poly(ctx, [[0, 0], [-34 * fl, -30], [-40 * fl, 6]], rgba(b.col2)); S.poly(ctx, [[0, 0], [-26 * fl, 26], [-8 * fl, 30]], rgba(mix(b.col2, [0, 0, 0], 0.2))); S.poly(ctx, [[0, 0], [34 * fl, -30], [40 * fl, 6]], rgba(b.col)); S.poly(ctx, [[0, 0], [26 * fl, 26], [8 * fl, 30]], rgba(mix(b.col, [0, 0, 0], 0.15))); ctx.restore(); }
  // E06：两部手机的冷光
  if (real > 0.01) S.add(ctx, () => { glow(ctx, P.chest[0] + 60, P.chest[1] + 20, 170, [150, 200, 255], 0.5 * real); glow(ctx, R.chest[0] + (flip ? -60 : 60), R.chest[1] + 20, 170, [150, 200, 255], 0.5 * real * (1 - reach)); });
  // E05–E07：理想的画框（举起来 → 越飘越远）
  if (idl > 0.01 && drift < 1) { const s = lerp(0.2, 1.0, easeOut(idl)) * lerp(1, 0.06, drift), ix = lerp(R.top[0] + 30, wx + 120, drift), iy = lerp(R.top[1] - 330, wy + 90, drift) + Math.sin(t * 0.9) * 10 * (1 - drift); S.add(ctx, () => glow(ctx, ix, iy, 420 * s, [255, 200, 220], 0.4)); ctx.save(); ctx.globalAlpha = idl; ctx.drawImage(IDEAL(), ix - 300 * s, iy - 300 * s, 600 * s, 600 * s); ctx.restore(); }
  // E08：茶几 + 蛋糕 + 暖光圈；暗影从四角爬过来
  ctx.fillStyle = 'rgb(150,104,84)'; S.poly(ctx, [[380, 1240], [640, 1240], [664, 1270], [356, 1270]]); ctx.fill(); ctx.fillStyle = 'rgb(96,64,60)'; ctx.fillRect(372, 1270, 20, 90); ctx.fillRect(628, 1270, 20, 90);
  if (cake > 0.01) { const cx = 510, cy = 1240; ctx.save(); ctx.globalAlpha = cake; S.add(ctx, () => { glow(ctx, cx, cy - 200, 760, [255, 196, 120], 0.34 * cake); S.rgrad(ctx, cx, cy - 250, 560, [[0, WARM, 0], [0.86, WARM, 0.1 * cake], [0.97, [255, 226, 170], 0.3 * cake], [1, WARM, 0]], 1.0); });
    ctx.fillStyle = 'rgb(255,240,236)'; ctx.beginPath(); ctx.roundRect(cx - 80, cy - 70, 160, 70, 12); ctx.fill(); ctx.fillStyle = 'rgb(255,170,190)'; ctx.fillRect(cx - 80, cy - 30, 160, 10); for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgb(140,190,240)'; ctx.fillRect(cx - 44 + k * 40, cy - 104, 8, 36); S.add(ctx, () => { glow(ctx, cx - 40 + k * 40, cy - 114, 40, [255, 220, 130], 0.9); glow(ctx, cx - 40 + k * 40, cy - 112, 12, [255, 250, 230], 1); }); } ctx.restore(); }
  // E09：价签
  const tg = 0; if (tg > 0.01) { const fl = easeInOut(prog(t, T.cost - 0.7, T.cost - 0.1)), sw = Math.sin(t * 1.3) * 0.08, tx = 800, ty = 600; ctx.save(); ctx.globalAlpha = tg; ctx.strokeStyle = 'rgba(240,226,200,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(690, 400); ctx.quadraticCurveTo(760, 420, tx - 30, ty - 150 + (1 - tg) * -200); ctx.stroke();
    ctx.translate(tx, ty + (1 - easeOut(tg)) * -300); ctx.rotate(0.12 + sw); ctx.scale(Math.abs(Math.cos(fl * Math.PI)) * 0.92 + 0.08, 1); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10; const back = fl > 0.5; const g = ctx.createLinearGradient(-150, -170, 150, 190); g.addColorStop(0, back ? 'rgb(226,90,90)' : 'rgb(255,236,190)'); g.addColorStop(1, back ? 'rgb(170,50,70)' : 'rgb(250,196,130)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-90, -190); ctx.lineTo(90, -190); ctx.lineTo(150, -110); ctx.lineTo(150, 190); ctx.lineTo(-150, 190); ctx.lineTo(-150, -110); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = back ? 'rgb(30,26,44)' : 'rgb(150,90,60)'; ctx.beginPath(); ctx.arc(0, -140, 16, 0, 6.2832); ctx.fill();
    if (!back) { K.text(ctx, '眼前的', 0, -30, { size: 60, weight: 500, color: [150, 84, 50], spacing: 0.1 }); K.text(ctx, '幸福', 0, 80, { size: 110, weight: 500, color: [190, 90, 60], spacing: 0.1 }); } else { K.text(ctx, '代价', 0, -10, { size: 110, weight: 500, color: [255, 246, 236], spacing: 0.1 }); K.text(ctx, '日后结算', 0, 90, { size: 54, weight: 500, color: [255, 226, 220], spacing: 0.12 }); }
    ctx.restore(); }
  ctx.restore();
  // 暗影从四角爬进来
  if (fear > 0.01) { const cc = S.w2s(C, 510, 1000); for (const [x, y] of [[0, 0], [W, 0], [0, H], [W, H]]) for (let k = 0; k < 5; k++) { const u = fear * (0.5 + 0.1 * k), px = lerp(x, cc[0], u * 0.62) + Math.sin(t * 0.8 + k * 2 + x) * 40, py = lerp(y, cc[1], u * 0.62) + Math.cos(t * 0.7 + k + y) * 40; S.rgrad(ctx, px, py, 430 - k * 40, [[0, [10, 6, 30], 0.6 * fear], [1, [10, 6, 30], 0]]); } }
  ctx.save(); S.cam(ctx, C, 1.6); ctx.drawImage(FGP(), -280, 1100); ctx.restore();
  return { C };
}
// ================= 2026-11-15 反馈 11：E08–E09 重做 =================
//   「最美好的日子」换成一个真正美好的场景：傍晚的山坡野餐 —— 夕阳是主光，一棵开满花的大树，树上挂着串灯和彩旗，
//   野餐垫上有蛋糕和茶，两个人挨着坐，花瓣慢慢落，远处是层层的山和反光的湖。
//   「惶恐不安」：只有她一个人回过头 —— 天边远远地压着一线乌云；夕阳把她的影子拉得又长又黑，影子在发抖，而他的影子好好的；她胸口一圈圈发冷的心跳
//   「以日后的牺牲为代价」：花枝上垂下一张价签，正面「眼前的幸福」，翻过来「代价 · 日后结算」
const PSKY = S.lazy(() => S.bake(W + 200, 1200, c => {
  c.translate(100, 0); S.vgrad(c, [[0, [96, 110, 190]], [0.3, [190, 150, 200]], [0.55, [255, 176, 150]], [0.75, [255, 214, 150]], [1, [255, 236, 190]]], 0, 1200, -100, W + 100);
  S.clouds(c, 71, [-100, 180, W + 100, 520], 7, [255, 200, 190], 0.34, [200, 440]); S.clouds(c, 73, [-100, 520, W + 100, 760], 5, [255, 236, 214], 0.3, [180, 380]);
}));
const PLAND = S.lazy(() => S.bake(W + 200, H, c => {
  c.translate(100, 0); const r = mulberry32(28);
  S.mountain(c, S.ridge(81, -100, W + 100, 1010, 250, 120), 1300, [196, 150, 190], [150, 120, 180], { facet: 0.4 });
  S.vgrad(c, [[0, [255, 214, 180], 0], [1, [255, 214, 180], 0.6]], 820, 1020, -100, W + 100);
  S.mountain(c, S.ridge(83, -100, W + 100, 1040, 150, 100, 1.4), 1300, [150, 160, 150], [110, 130, 140], { facet: 0.4 });
  // 湖：一条反着夕阳的水面
  const lg = c.createLinearGradient(0, 1040, 0, 1100); lg.addColorStop(0, 'rgb(255,226,170)'); lg.addColorStop(1, 'rgb(240,170,150)'); c.fillStyle = lg; c.fillRect(-100, 1040, W + 200, 64);
  S.add(c, () => { for (let k = 0; k < 40; k++) S.rgrad(c, 300 + (r() - 0.5) * 700, 1046 + r() * 50, 30 + r() * 40, [[0, [255, 250, 220], 0.5], [1, [255, 250, 220], 0]], 0.12); });
  // 草坡：低多边形，暖色受光
  const top = []; for (let x = -100; x <= W + 100; x += 60) top.push([x, 1100 + 26 * Math.sin(x * 0.005 + 0.6) + (x > 540 ? (x - 540) * 0.05 : 0)]);
  S.poly(c, [...top, [W + 100, H], [-100, H]]); const gg = c.createLinearGradient(0, 1090, 0, H); gg.addColorStop(0, 'rgb(214,206,120)'); gg.addColorStop(0.3, 'rgb(140,176,110)'); gg.addColorStop(1, 'rgb(60,104,96)'); c.fillStyle = gg; c.fill();
  c.save(); S.poly(c, [...top, [W + 100, H], [-100, H]]); c.clip(); const V = []; for (let j = 0; j < 9; j++) for (let i = 0; i < 10; i++) V.push([-100 + i * 150 + (r() - 0.5) * 90, 1090 + j * 110 + (r() - 0.5) * 50]);
  for (let j = 0; j < 8; j++) for (let i = 0; i < 9; i++) { const a = V[j * 10 + i], b = V[j * 10 + i + 1], d = V[(j + 1) * 10 + i], e = V[(j + 1) * 10 + i + 1]; for (const tri of [[a, b, d], [b, e, d]]) { c.fillStyle = `rgba(${r() < 0.5 ? '255,236,170' : '30,70,80'},${0.04 + r() * 0.1})`; S.poly(c, tri); c.fill(); } } c.restore();
  for (let k = 0; k < 60; k++) { const x = -100 + r() * (W + 200), y = 1130 + r() * 700, col = [[255, 250, 240], [255, 190, 200], [255, 226, 130]][k % 3]; c.fillStyle = rgba(col, 0.9); for (let q = 0; q < 5; q++) { c.beginPath(); c.arc(x + Math.cos(q * 1.2566) * 7, y + Math.sin(q * 1.2566) * 7, 5, 0, 6.2832); c.fill(); } c.fillStyle = 'rgb(255,214,110)'; c.beginPath(); c.arc(x, y, 4, 0, 6.2832); c.fill(); }
}));
// 开满花的大树（左边）：树干 + 伸向画面上方的花枝
const PTREE = S.lazy(() => S.bake(1500, 1300, c => {
  const r = mulberry32(44);
  const tg = c.createLinearGradient(60, 0, 230, 0); tg.addColorStop(0, 'rgb(96,60,70)'); tg.addColorStop(0.6, 'rgb(150,100,96)'); tg.addColorStop(1, 'rgb(214,150,120)'); c.fillStyle = tg;
  c.beginPath(); c.moveTo(60, 1300); c.bezierCurveTo(110, 1000, 90, 800, 150, 620); c.lineTo(240, 600); c.bezierCurveTo(220, 820, 250, 1040, 300, 1300); c.closePath(); c.fill();
  c.strokeStyle = 'rgb(130,84,86)'; c.lineCap = 'round'; for (const [x0, y0, cx, cy, x1, y1, w] of [[190, 640, 400, 480, 720, 430, 46], [170, 640, 150, 420, 330, 250, 40], [420, 500, 560, 330, 820, 250, 26], [600, 440, 800, 470, 1000, 400, 22]]) { c.lineWidth = w; c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1); c.stroke(); }
  // 花团：一层暗一层亮
  for (let L = 0; L < 3; L++) for (let k = 0; k < 90; k++) { const u = r(), x = 40 + u * 1380 + (r() - 0.5) * 120, y = 420 - Math.sin(u * 2.6) * 250 + (r() - 0.5) * 260 + L * 14 - (u > 0.7 ? (u - 0.7) * 500 : 0), R = 46 + r() * 60, col = [[196, 96, 140], [236, 136, 170], [255, 186, 204]][L]; if (y > 640 && x > 300) continue;
    S.rgrad(c, x, y, R, [[0, col, 0.95], [0.65, col, 0.85], [1, col, 0]]); }
}));
const BLANKET = S.lazy(() => S.bake(900, 320, c => {
  c.translate(450, 160); c.save(); c.scale(1, 0.3); c.beginPath(); c.arc(0, 0, 430, 0, 6.2832); c.clip();
  c.fillStyle = 'rgb(255,246,236)'; c.fillRect(-450, -450, 900, 900); for (let i = -6; i <= 6; i++) { c.fillStyle = 'rgba(236,96,96,0.75)'; c.fillRect(i * 140 - 35, -450, 70, 900); c.fillRect(-450, i * 140 - 35, 900, 70); } c.restore();
}));
const SHADOWIMG = S.lazy(() => S.bake(700, 700, c => { c.translate(350, 660); c.filter = 'blur(6px)'; infp(c, 0, 0, 1.0, { flies: 0, wind: false, dim: 1 }); c.globalCompositeOperation = 'source-in'; c.fillStyle = 'rgb(20,30,50)'; c.fillRect(-400, -700, 800, 800); }));
function picnic(ctx, t) {
  const u = prog(t, T.e08 - 0.5, T.end), fear = smooth(prog(t, T.fear - 0.4, T.fear + 0.9)), tg = smooth(prog(t, T.e09 + 0.2, T.e09 + 1.0)), fl = easeInOut(prog(t, T.e09 + 2.0, T.e09 + 2.6));
  const C = { x: lerp(-30, 20, easeInOut(u)), y: lerp(40, -10, easeInOut(u)), z: lerp(1.16, 1.0, easeOut(prog(t, T.e08 - 0.5, T.best + 0.8))) + 0.04 * u, ax: 540, ay: 1100 };
  ctx.fillStyle = 'rgb(255,214,160)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 0.15); ctx.drawImage(PSKY(), -100, -60);
  // 夕阳（主光源，缓慢呼吸）
  const SUN = [640, 960], br = 1 + 0.03 * Math.sin(t * 0.7); S.add(ctx, () => { glow(ctx, SUN[0], SUN[1], 1100 * br, [255, 150, 100], 0.26); glow(ctx, SUN[0], SUN[1], 360, [255, 206, 130], 0.4); glow(ctx, SUN[0], SUN[1], 120, [255, 246, 220], 0.9); });
  // 天边那一线乌云：只在右边远远的地方，慢慢压过来一点
  if (fear > 0.01) { const sx = lerp(1300, 1010, fear); for (let k = 0; k < 9; k++) S.rgrad(ctx, sx + (k % 3) * 100 + Math.sin(t * 0.3 + k) * 10, 800 + Math.floor(k / 3) * 60 - (k % 2) * 34, 150, [[0, [50, 46, 90], 0.9 * fear], [0.6, [80, 70, 120], 0.7 * fear], [1, [80, 70, 120], 0]], 0.62);
    S.add(ctx, () => { const f2 = Math.pow(Math.max(0, Math.sin(t * 1.7)), 12); glow(ctx, sx + 120, 800, 170, [200, 210, 255], 0.5 * f2 * fear); }); }
  ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.5); ctx.drawImage(PLAND(), -100, 0); ctx.restore();
  ctx.save(); S.cam(ctx, C, 1);
  // 人影：夕阳把影子朝镜头方向拉长；她的影子越来越长、越来越黑，还在抖
  const PXp = 400, HXp = 680, GYp = 1330;
  const shadow = (x, len, a, shake) => { ctx.save(); ctx.translate(x + shake, GYp + 4); ctx.transform(1, 0, -0.5 - 0.1 * len, -0.42 * len, 0, 0); ctx.globalAlpha = a; ctx.drawImage(SHADOWIMG(), -350, -660, 700, 700); ctx.restore(); };
  shadow(PXp + 20, 1.0, 0.28, 0); shadow(HXp, 1.0 + 1.1 * fear, 0.28 + 0.4 * fear, Math.sin(t * 23) * 7 * fear);
  ctx.drawImage(BLANKET(), 540 - 450, GYp - 160);
  // 野餐篮、蛋糕、茶
  ctx.fillStyle = 'rgb(190,130,80)'; ctx.beginPath(); ctx.roundRect(170, GYp - 96, 150, 96, 14); ctx.fill(); ctx.strokeStyle = 'rgb(150,96,60)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(245, GYp - 96, 60, Math.PI, 0); ctx.stroke(); for (let k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(120,76,50,0.4)'; ctx.fillRect(170, GYp - 80 + k * 22, 150, 6); }
  const cxk = 540, cyk = GYp + 36; ctx.fillStyle = 'rgb(255,252,246)'; ctx.beginPath(); ctx.ellipse(cxk, cyk, 100, 20, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(255,236,226)'; ctx.beginPath(); ctx.roundRect(cxk - 64, cyk - 76, 128, 76, 12); ctx.fill(); ctx.fillStyle = 'rgb(255,160,180)'; ctx.fillRect(cxk - 64, cyk - 40, 128, 10); for (let k = 0; k < 5; k++) { ctx.fillStyle = 'rgb(236,84,104)'; ctx.beginPath(); ctx.arc(cxk - 48 + k * 24, cyk - 80, 9, 0, 6.2832); ctx.fill(); }
  // 两个人：挨着坐，她靠向他
  const L0 = [SUN[0] + 500, SUN[1] - 100];
  S.lit(ctx, c => MB.person(c, 'isfj-male', PXp, GYp, 2.2, { bob: Math.abs(Math.sin(t * 5)) * 5, lean: 0.03 * Math.sin(t * 2.5) }), { light: L0, at: [PXp, GYp - 270], r: 330, warm: [255, 214, 150], cool: [90, 60, 110], k: 0.9 });
  const o = { t, spin: t * 3, eyes: fear > 0.35 ? 'wide' : 'happy', mouth: fear > 0.35 ? 'flat' : 'smile', lean: -0.06 * (1 - fear) + 0.02 * Math.sin(t * 9) * fear, tilt: -0.2 * (1 - fear), look: fear > 0.35 ? [2, -0.6] : [-1, 0], la: -0.3 * fear };
  const flip = fear < 0.35; ctx.save(); if (flip) { ctx.translate(2 * HXp, 0); ctx.scale(-1, 1); }
  const Rm = S.lit(ctx, c => infp(c, HXp, GYp, 1.0, o), { light: flip ? [2 * HXp - L0[0], L0[1]] : L0, at: [HXp, GYp - 290], r: 340, warm: [255, 214, 150], cool: [90, 60, 110], k: 0.9 }); ctx.restore();
  const chest = flip ? [2 * HXp - Rm.chest[0], Rm.chest[1]] : Rm.chest;
  // 两个人之间的一小颗心（最美好）
  const hb = (1 - fear) * smooth(prog(t, T.e08, T.best)); if (hb > 0.01) { const hy2 = GYp - 640 + Math.sin(t * 1.4) * 10, h = 40 * (1 + 0.1 * Math.sin(t * 5)); S.add(ctx, () => glow(ctx, 540, hy2, 150, [255, 130, 160], 0.3 * hb)); ctx.save(); ctx.globalAlpha = hb; ctx.translate(540, hy2); ctx.fillStyle = 'rgb(240,96,130)'; ctx.beginPath(); ctx.moveTo(0, h); ctx.bezierCurveTo(-h * 1.5, 0, -h * 1.2, -h * 1.3, 0, -h * 0.5); ctx.bezierCurveTo(h * 1.2, -h * 1.3, h * 1.5, 0, 0, h); ctx.fill(); ctx.restore(); }
  // 惶恐：她胸口一圈圈发冷的心跳
  if (fear > 0.02) for (let k = 0; k < 3; k++) { const ph = (t * 0.9 + k / 3) % 1; S.ring(ctx, chest[0], chest[1], 40 + ph * 220, 16, [70, 90, 220], 0.3 * (1 - ph) * fear); }
  ctx.restore();
  // 大树 + 串灯 + 彩旗（比人近一层）
  ctx.save(); S.cam(ctx, C, 1.15); ctx.drawImage(PTREE(), -160, -140);
  const sag = (x0, y0, x1, y1, s2, d) => [lerp(x0, x1, s2), lerp(y0, y1, s2) + Math.sin(s2 * Math.PI) * d + Math.sin(t * 0.9 + s2 * 5) * 4];
  ctx.strokeStyle = 'rgba(96,60,70,0.9)'; ctx.lineWidth = 4; ctx.beginPath(); for (let k = 0; k <= 20; k++) { const p = sag(240, 470, 1140, 380, k / 20, 150); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
  for (let k = 1; k < 12; k++) { const p = sag(240, 470, 1140, 380, k / 12, 150); S.add(ctx, () => { glow(ctx, p[0], p[1] + 16, 70, [255, 214, 130], 0.6); glow(ctx, p[0], p[1] + 16, 18, [255, 250, 230], 1); }); }
  for (let k = 0; k < 9; k++) { const p = sag(-40, 600, 760, 330, (k + 0.5) / 9, 110), col = [[255, 120, 130], [255, 200, 110], [120, 200, 220], [190, 140, 240], [150, 220, 150]][k % 5]; S.poly(ctx, [[p[0] - 24, p[1]], [p[0] + 24, p[1]], [p[0], p[1] + 58]], rgba(col)); }
  // E09：花枝上垂下来的价签
  if (tg > 0.01) { const sw = Math.sin(t * 1.3) * 0.07, tx = 880, ty = 640; ctx.save(); ctx.globalAlpha = tg; ctx.strokeStyle = 'rgba(120,84,70,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(860, 380); ctx.lineTo(tx - 6, ty - 150 - (1 - easeOut(tg)) * 260); ctx.stroke();
    ctx.translate(tx, ty - (1 - easeOut(tg)) * 260); ctx.rotate(0.1 + sw); ctx.scale(Math.abs(Math.cos(fl * Math.PI)) * 0.92 + 0.08, 1); const back = fl > 0.5; ctx.shadowColor = 'rgba(60,20,30,0.4)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
    const g = ctx.createLinearGradient(-150, -170, 150, 190); g.addColorStop(0, back ? 'rgb(96,84,130)' : 'rgb(255,246,214)'); g.addColorStop(1, back ? 'rgb(50,44,84)' : 'rgb(255,210,150)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-90, -190); ctx.lineTo(90, -190); ctx.lineTo(150, -110); ctx.lineTo(150, 190); ctx.lineTo(-150, 190); ctx.lineTo(-150, -110); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = back ? 'rgb(30,26,50)' : 'rgb(170,100,70)'; ctx.beginPath(); ctx.arc(0, -140, 16, 0, 6.2832); ctx.fill();
    if (!back) { K.text(ctx, '眼前的', 0, -30, { size: 60, weight: 500, color: [170, 96, 60], spacing: 0.1 }); K.text(ctx, '幸福', 0, 84, { size: 112, weight: 500, color: [214, 96, 70], spacing: 0.1 }); } else { K.text(ctx, '代价', 0, -6, { size: 112, weight: 500, color: [255, 150, 140], spacing: 0.1 }); K.text(ctx, '日后结算', 0, 96, { size: 54, weight: 500, color: [226, 220, 244], spacing: 0.12 }); }
    ctx.restore(); }
  ctx.restore();
  // 花瓣慢慢落 + 夕阳的暖色漫在整张画面上；惶恐时只在她那一侧冷下来
  S.petals(ctx, t, { n: 34, seed: 61, dir: [0.35, 1], speed: 90, a: 0.95, c: [255, 170, 196], c2: [255, 236, 232], size: 20, box: [-60, -100, W + 60, 1500] });
  S.add(ctx, () => S.rgrad(ctx, 640, 900, 1300, [[0, [255, 170, 110], 0.07], [1, [255, 170, 110], 0]]));
  if (fear > 0.01) { const g = ctx.createLinearGradient(540, 0, W, 0); g.addColorStop(0, 'rgba(40,50,110,0)'); g.addColorStop(1, `rgba(40,50,110,${0.3 * fear})`); ctx.fillStyle = g; ctx.fillRect(540, 0, 540, H); }
  return { C };
}
function drawAll(ctx, t) {
  const pa = smooth(prog(t, T.e08 - 0.25, T.e08 + 0.3));
  let st; if (pa < 0.999) st = draw(ctx, t);
  if (pa > 0.003) S.group(ctx, pa, c => { st = picnic(c, t); });
  return st;
}
function over() {}
module.exports = { draw: drawAll, over, T };
