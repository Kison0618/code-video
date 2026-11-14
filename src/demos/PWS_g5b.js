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
  const br = 1 + 0.03 * Math.sin(t * 0.8), cake = smooth(prog(t, T.e08 - 0.2, T.best)), fear = smooth(prog(t, T.fear - 0.3, T.fear + 1.0)), real = smooth(prog(t, T.real - 0.4, T.real + 0.5)) * (1 - smooth(prog(t, T.e08 - 0.6, T.e08)));
  S.add(ctx, () => { glow(ctx, LAMP[0], LAMP[1] - 30, 900 * br, WARM, 0.36 * (1 - 0.5 * real)); glow(ctx, LAMP[0], LAMP[1] - 40, 190, [255, 236, 190], 0.5); S.rgrad(ctx, 420, 1260, 700, [[0, WARM, 0.26 * (1 - 0.5 * real)], [1, WARM, 0]], 0.22); });
  if (real > 0.01) { ctx.fillStyle = `rgba(20,24,56,${0.34 * real})`; ctx.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2); }
  // 挂饰（和谐）
  const sp = [T.e02 + 0.3, T.e02 + 1.7].map(t0 => ({ t0, u: prog(t, t0, t0 + 1.2) })), act = sp.find(q => q.u > 0 && q.u < 1), tiltM = act ? 0.3 * Math.sin(Math.PI * Math.min(1, act.u * 1.4)) * (1 - smooth(prog(act.u, 0.55, 0.9))) : 0;
  mobile(ctx, 252, t, tiltM - 0.12 * real + 0.1 * Math.sin(t * 3) * fear * 0.5);
  // 他
  const laugh = smooth(prog(t, T.fun + 0.5, T.fun + 1.0)) * (1 - smooth(prog(t, T.e05, T.e05 + 0.8))), sad = smooth(prog(t, T.e04 - 0.4, T.e04 + 0.3)) * (1 - smooth(prog(t, T.fun + 0.3, T.fun + 0.9)));
  const P = S.lit(ctx, c => MB.person(c, 'isfj-male', PX, GYB - 40, 2.1, { bob: Math.abs(Math.sin(t * 9)) * 9 * laugh + Math.abs(Math.sin(t * 2)) * 2, slump: 0.5 * sad + 0.5 * real, lean: 0.03 * Math.sin(t * 9) * laugh, gray: 0.3 * real }), { light: LAMP, at: [PX, GYB - 290], r: 320, warm: [255, 220, 170], cool: [40, 24, 60], k: 0.9 });
  // 她
  const dash = act ? smooth(prog(act.u, 0.2, 0.55)) * (1 - smooth(prog(act.u, 0.8, 1))) : 0;
  const hide = smooth(prog(t, T.e03, T.e03 + 0.5)) * (1 - smooth(prog(t, T.e04 - 0.3, T.e04))), offer = Math.sin(Math.PI * prog(t, T.open + 0.9, T.open + 2.3)) * hide;
  const glint = K.vis(t, T.sense - 0.2, T.fun + 0.2, 0.2, 0.5), blow = smooth(prog(t, T.fun - 0.1, T.fun + 0.5)) * (1 - smooth(prog(t, T.e05 - 0.2, T.e05 + 0.4)));
  const idl = smooth(prog(t, T.e05 + 0.2, T.ideal)), drift = easeIn(prog(t, T.e07 - 0.1, T.far + 0.9)), reach = smooth(prog(t, T.e07 + 0.2, T.far + 0.4)) * (1 - smooth(prog(t, T.e08 - 0.5, T.e08)));
  const hx = HXB - dash * 250 - cake * 250, flip = t < T.e05 + 0.2 || cake > 0.5;
  const o = { t, wind: hide < 0.3 && real < 0.3, spin: t * (1.5 + 12 * blow), eyes: fear > 0.3 ? 'wide' : real > 0.5 ? 'sad' : laugh > 0.5 || cake > 0.6 || t < T.e02 ? 'happy' : glint > 0.5 ? 'wide' : hide > 0.5 ? 'open' : 'open', mouth: fear > 0.3 ? 'o' : real > 0.5 ? 'flat' : 'smile', look: fear > 0.3 ? [2, -1] : hide > 0.5 && offer < 0.3 ? [0, -1.8] : reach > 0.3 ? [0.5, -2] : [1.2, 0],
    la: -0.9 * dash - 0.9 * idl * (1 - drift) - 1.2 * reach - 0.6 * offer, ra: -0.6 * dash - 0.5 * blow - 0.9 * idl * (1 - drift) - 0.9 * reach + 0.5 * hide * (1 - offer), tilt: -0.3 * idl * (1 - drift) - 0.4 * reach + 0.3 * real, lean: 0.03 * Math.sin(t * 5) * fear, dim: 0.3 * real };
  ctx.save(); if (flip) { ctx.translate(2 * hx, 0); ctx.scale(-1, 1); }
  const Rm = S.lit(ctx, c => infp(c, hx, GYB, 1.0, o), { light: flip ? [2 * hx - LAMP[0], LAMP[1]] : LAMP, at: [hx, GYB - 290], r: 340, warm: [255, 220, 170], cool: [40, 24, 60], k: 0.9 });
  ctx.restore(); const R = {}; for (const k in Rm) R[k] = flip ? [2 * hx - Rm[k][0], Rm[k][1]] : Rm[k];
  // E02：火星 → 绒团
  sp.forEach((q, i) => { if (q.u <= 0 || q.u >= 1) return; const sx = P.head[0] + 70 + i * 40, sy = P.top[1] - 70 - i * 20, soft = smooth(prog(q.u, 0.45, 0.7)); ctx.save(); ctx.globalAlpha = smooth(prog(q.u, 0, 0.15)) * (1 - smooth(prog(q.u, 0.85, 1))); spark(ctx, sx, sy - soft * 40, 1 + 0.15 * Math.sin(t * 20) * (1 - soft), soft); ctx.restore(); });
  // E03：胸口的两扇小门 + 藏在背后的心形信
  if (hide > 0.01) { const [cx, cy] = R.chest, op = Math.sin(Math.PI * prog(t, T.open - 0.3, T.open + 1.0)) * 0.9; ctx.save(); ctx.globalAlpha = hide; S.add(ctx, () => glow(ctx, cx, cy, 150 * op + 30, [255, 190, 170], 0.7 * op + 0.1));
    ctx.fillStyle = 'rgb(255,236,200)'; ctx.fillRect(cx - 34, cy - 40, 68, 80); for (const sd of [-1, 1]) { const w = 34 * (1 - op * 0.8); const g = ctx.createLinearGradient(cx, 0, cx + sd * 34, 0); g.addColorStop(0, 'rgb(150,100,90)'); g.addColorStop(1, 'rgb(100,64,70)'); ctx.fillStyle = g; ctx.fillRect(sd < 0 ? cx - 34 : cx + 34 - w, cy - 40, w, 80); } ctx.strokeStyle = 'rgb(70,44,56)'; ctx.lineWidth = 6; ctx.strokeRect(cx - 37, cy - 43, 74, 86);
    const lx = lerp(R.rh[0] + 50, R.lh[0] - 110, offer), ly = lerp(R.rh[1] + 40, R.lh[1] - 30, offer); S.add(ctx, () => glow(ctx, lx, ly, 110, [255, 150, 170], 0.5)); ctx.translate(lx, ly); ctx.rotate(-0.2); ctx.fillStyle = 'rgb(255,246,240)'; ctx.beginPath(); ctx.roundRect(-54, -36, 108, 72, 8); ctx.fill(); ctx.fillStyle = 'rgb(240,110,130)'; ctx.beginPath(); ctx.moveTo(0, 20); ctx.bezierCurveTo(-34, -4, -26, -30, 0, -12); ctx.bezierCurveTo(26, -30, 34, -4, 0, 20); ctx.fill(); ctx.restore(); }
  // E04：他头顶的雨云 → 小太阳；她眼睛一亮，吹过去花瓣和星星
  const cl = K.vis(t, T.e04 - 0.4, T.e05 + 0.3, 0.4, 0.5); if (cl > 0.01) { const sun = smooth(prog(t, T.fun + 0.4, T.fun + 1.0)), cx = P.top[0] + 10, cy = P.top[1] - 90; ctx.save(); ctx.globalAlpha = cl;
    if (sun < 1) { ctx.globalAlpha = cl * (1 - sun); for (let k = 0; k < 6; k++) S.rgrad(ctx, cx + (k - 2.5) * 34, cy + (k % 2) * 16, 56, [[0, [200, 210, 236], 0.95], [0.7, [150, 164, 200], 0.8], [1, [150, 164, 200], 0]]); ctx.translate(cx - 90, cy + 30); S.rain(ctx, t, { box: [0, 0, 180, 110], a: 1, n: 18, c: [170, 200, 255], slant: -0.1, seed: 7 }); ctx.translate(-cx + 90, -cy - 30); }
    if (sun > 0) { ctx.globalAlpha = cl * sun; S.add(ctx, () => glow(ctx, cx, cy, 190, [255, 214, 110], 0.7)); ctx.fillStyle = 'rgb(255,226,120)'; ctx.beginPath(); for (let k = 0; k < 24; k++) { const a = k / 24 * 6.2832 + t * 0.6, rr = k % 2 ? 46 : 70; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.fill(); ctx.fillStyle = 'rgb(255,246,200)'; ctx.beginPath(); ctx.arc(cx, cy, 40, 0, 6.2832); ctx.fill(); }
    ctx.restore(); }
  if (glint > 0.01) S.add(ctx, () => { for (const dx of [-17, 15]) { const ex = R.eyes[0] + (flip ? -dx : dx), ey = R.eyes[1]; glow(ctx, ex, ey, 34, [140, 214, 255], 0.8 * glint); ctx.save(); ctx.translate(ex, ey); ctx.scale(3.2, 0.3); glow(ctx, 0, 0, 18, [140, 214, 255], 0.5 * glint); ctx.restore(); } });
  if (blow > 0.01) for (let k = 0; k < 14; k++) { const ph = (t * 0.9 + k / 14) % 1, A = R.wheel, B = [P.head[0] + 40, P.head[1] - 40], px = lerp(A[0], B[0], ph), py = lerp(A[1], B[1], ph) - Math.sin(ph * Math.PI) * (80 + (k % 4) * 30) + Math.sin(t * 5 + k) * 10; ctx.save(); ctx.translate(px, py); ctx.rotate(t * 3 + k); ctx.globalAlpha = blow * Math.sin(ph * Math.PI); if (k % 3) { ctx.fillStyle = k % 2 ? 'rgb(255,180,200)' : 'rgb(255,236,226)'; ctx.beginPath(); ctx.ellipse(0, 0, 18, 9, 0, 0, 6.2832); ctx.fill(); } else { ctx.fillStyle = 'rgb(255,230,130)'; ctx.beginPath(); for (let q = 0; q < 10; q++) { const a = q * Math.PI / 5, rr = q % 2 ? 8 : 20; ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); } ctx.fill(); } ctx.restore(); }
  // E06：两部手机的冷光
  if (real > 0.01) S.add(ctx, () => { glow(ctx, P.chest[0] + 60, P.chest[1] + 20, 170, [150, 200, 255], 0.5 * real); glow(ctx, R.chest[0] + (flip ? -60 : 60), R.chest[1] + 20, 170, [150, 200, 255], 0.5 * real * (1 - reach)); });
  // E05–E07：理想的画框（举起来 → 越飘越远）
  if (idl > 0.01 && drift < 1) { const s = lerp(0.2, 1.0, easeOut(idl)) * lerp(1, 0.06, drift), ix = lerp(R.top[0] + 30, wx + 120, drift), iy = lerp(R.top[1] - 330, wy + 90, drift) + Math.sin(t * 0.9) * 10 * (1 - drift); S.add(ctx, () => glow(ctx, ix, iy, 420 * s, [255, 200, 220], 0.4)); ctx.save(); ctx.globalAlpha = idl; ctx.drawImage(IDEAL(), ix - 300 * s, iy - 300 * s, 600 * s, 600 * s); ctx.restore(); }
  // E08：茶几 + 蛋糕 + 暖光圈；暗影从四角爬过来
  ctx.fillStyle = 'rgb(150,104,84)'; S.poly(ctx, [[380, 1240], [640, 1240], [664, 1270], [356, 1270]]); ctx.fill(); ctx.fillStyle = 'rgb(96,64,60)'; ctx.fillRect(372, 1270, 20, 90); ctx.fillRect(628, 1270, 20, 90);
  if (cake > 0.01) { const cx = 510, cy = 1240; ctx.save(); ctx.globalAlpha = cake; S.add(ctx, () => { glow(ctx, cx, cy - 200, 760, [255, 196, 120], 0.34 * cake); S.rgrad(ctx, cx, cy - 250, 560, [[0, WARM, 0], [0.86, WARM, 0.1 * cake], [0.97, [255, 226, 170], 0.3 * cake], [1, WARM, 0]], 1.0); });
    ctx.fillStyle = 'rgb(255,240,236)'; ctx.beginPath(); ctx.roundRect(cx - 80, cy - 70, 160, 70, 12); ctx.fill(); ctx.fillStyle = 'rgb(255,170,190)'; ctx.fillRect(cx - 80, cy - 30, 160, 10); for (let k = 0; k < 3; k++) { ctx.fillStyle = 'rgb(140,190,240)'; ctx.fillRect(cx - 44 + k * 40, cy - 104, 8, 36); S.add(ctx, () => { glow(ctx, cx - 40 + k * 40, cy - 114, 40, [255, 220, 130], 0.9); glow(ctx, cx - 40 + k * 40, cy - 112, 12, [255, 250, 230], 1); }); } ctx.restore(); }
  // E09：价签
  const tg = smooth(prog(t, T.e09 - 0.2, T.e09 + 0.7)); if (tg > 0.01) { const fl = easeInOut(prog(t, T.cost - 0.7, T.cost - 0.1)), sw = Math.sin(t * 1.3) * 0.08, tx = 800, ty = 600; ctx.save(); ctx.globalAlpha = tg; ctx.strokeStyle = 'rgba(240,226,200,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(690, 400); ctx.quadraticCurveTo(760, 420, tx - 30, ty - 150 + (1 - tg) * -200); ctx.stroke();
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
function over() {}
module.exports = { draw, over, T };
