'use strict';
// PWG4 第二幕：D01–D09 工作（书页 P2 之后）
//   A「清晨的岔路口」D01–D03：山顶的三岔路，太阳刚出来（主光源）。左边一条路通向城市的写字楼，右边一条通向草坡上亮着暖窗的小木屋
//     D01 INFJ（绿老头）站在大地图前，教鞭沿着地图上的路线一条条推演，地图上的路一笔笔亮起来
//     D02 她不看地图：手按在胸口，胸口的光像罗盘一样转了半圈，停下来 —— 只有它指着的那条小路亮了
//     D03 现实和理想冲突：两条光绸从她胸口往两边拉，灰蓝的拉向写字楼，金色的拉向小木屋，她被扯得左右晃
//   B「格子间」D04–D09：镜头顺着灰蓝的那条路进了写字楼。一排排一模一样的隔板伸向远处，头顶是冷白的灯管，只有左边一扇窗有太阳
//     D04 她坐在工位上，头顶冒出同一句话，一遍、两遍、三遍：「我真的喜欢这份工作吗？」
//     D05 尊重自己的感受：窗外的阳光斜着照进来正好落在她胸口，胸口那盏小灯一下一下亮（感受是世界给你的提醒）
//     D06 无趣、高压、没有意义：她盖一张章，纸顺着桌子滑进旁边的碎纸机，再盖一张，再碎；头顶一块大压板一点点压下来
//     D07 待遇不错：一只鼓鼓的金色工资袋吊下来晃；她伸手，又缩回去
//     D08 耗竭心力：她身上的颜色从头到脚褪成灰，胸口的灯缩成一点火星；生理不适 —— 头顶转圈、脸发青、身子打晃
//     D09 生无可恋：她整个人歪倒在桌上，一个半透明的小小的她从身体里飘出来往上升
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const { K, GOLD, LIME, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const PAD = 240, GY = 1262, SUNP = [760, 800], SUNC = [255, 206, 140];
const T = { in: vs('D01') - 1.2, d01: vs('D01'), infj: at('D01', 'INFJ'), plan: at('D01', '推演'), d02: vs('D02'), mean: at('D02', '个人意义'), inner: at('D02', '内在'), d03: vs('D03'), real: at('D03', '现实'), ideal: at('D03', '内心理想'), clash: at('D03', '冲突'),
  d04: vs('D04'), ask: at('D04', '我真的'), d05: vs('D05'), resp: at('D05', '尊重'), feel: at('D05', '感受是'), remind: at('D05', '提醒'), d06: vs('D06'), press: at('D06', '高压'), nomean: at('D06', '没有价值'), d07: vs('D07'), pay: at('D07', '待遇'), care: at('D07', '谨慎'),
  d08: vs('D08'), drain: at('D08', '耗竭'), sick: at('D08', '生理'), d09: vs('D09'), dead: at('D09', '生无可恋'), end: ve('D09') + 0.7 };
const OFF = T.d04 - 0.5;
const CAMA = [[T.in, { x: -60, y: -30, z: 1.0, ax: 540, ay: GY }], [T.infj, { x: -150, y: -10, z: 1.3 }], [T.d02 - 0.2, { x: -150, y: -10, z: 1.34 }], [T.d02 + 0.8, { x: 90, y: 0, z: 1.3 }], [T.d03, { x: 90, y: 0, z: 1.36 }], [T.real, { x: 20, y: -20, z: 1.0 }], [OFF + 0.1, { x: -40, y: -20, z: 1.05 }], [OFF + 0.6, { x: -420, y: -60, z: 2.6 }, easeIn]];
const CAMB = [[OFF, { x: 0, y: 0, z: 1.3, ax: 540, ay: 1000 }], [T.d04 + 0.4, { x: 0, y: 0, z: 1.12 }], [T.d05, { x: 0, y: 10, z: 1.2 }], [T.feel, { x: -20, y: 30, z: 1.5 }], [T.d06 - 0.1, { x: -20, y: 30, z: 1.54 }], [T.d06 + 0.9, { x: 40, y: -20, z: 1.0 }], [T.d08, { x: 30, y: -10, z: 1.06 }], [T.drain + 0.6, { x: 0, y: 20, z: 1.4 }], [T.d09, { x: 0, y: 10, z: 1.44 }], [T.dead + 0.4, { x: 0, y: -40, z: 1.16 }], [T.end, { x: 0, y: -50, z: 1.12 }]];
// ---------- A：岔路口 ----------
const SKYA = S.lazy(() => S.bake(W + PAD * 2, 1400, c => {
  c.translate(PAD, 0); S.vgrad(c, [[0, [40, 60, 120]], [0.35, [110, 120, 170]], [0.55, [240, 170, 150]], [0.66, [255, 214, 160]], [1, [255, 230, 190]]], 0, 1400, -PAD, W + PAD);
  S.clouds(c, 33, [-200, 240, W + 200, 560], 7, [255, 190, 170], 0.3, [200, 460]); S.clouds(c, 35, [-200, 100, W + 200, 300], 4, [255, 230, 220], 0.16, [200, 400]);
}));
const LANDA = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, 0); const r = mulberry32(44);
  S.mountain(c, S.ridge(51, -PAD, W + PAD, 1000, 260, 120), 1300, [150, 130, 170], [96, 96, 150], { facet: 0.5 });
  S.vgrad(c, [[0, [255, 200, 170], 0], [1, [255, 200, 170], 0.55]], 800, 1010, -PAD, W + PAD);
  // 左边远处：城市的写字楼（灰蓝）
  for (let k = 0; k < 14; k++) { const x = -160 + k * 34 + r() * 14, w = 26 + r() * 22, h = 90 + r() * 230; const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgb(130,140,170)'); g.addColorStop(1, 'rgb(84,96,130)'); c.fillStyle = g; c.fillRect(x, 1010 - h, w, h); c.fillStyle = 'rgba(220,230,255,0.3)'; for (let yy = 1010 - h + 8; yy < 1000; yy += 12) c.fillRect(x + 4, yy, w - 8, 3); }
  // 草坡
  const top = []; for (let x = -PAD; x <= W + PAD; x += 60) top.push([x, 1000 + 30 * Math.sin(x * 0.004 + 1)]);
  S.poly(c, [...top, [W + PAD, H + PAD], [-PAD, H + PAD]]); const gg = c.createLinearGradient(0, 1000, 0, 1700); gg.addColorStop(0, 'rgb(150,170,110)'); gg.addColorStop(0.3, 'rgb(96,130,96)'); gg.addColorStop(1, 'rgb(40,70,70)'); c.fillStyle = gg; c.fill();
  const V = []; for (let j = 0; j < 9; j++) for (let i = 0; i < 12; i++) V.push([-PAD + i * 150 + (r() - 0.5) * 90, 1010 + j * 110 + (r() - 0.5) * 50]);
  c.save(); S.poly(c, [...top, [W + PAD, H + PAD], [-PAD, H + PAD]]); c.clip(); for (let j = 0; j < 8; j++) for (let i = 0; i < 11; i++) { const a = V[j * 12 + i], b = V[j * 12 + i + 1], d = V[(j + 1) * 12 + i], e = V[(j + 1) * 12 + i + 1]; for (const tri of [[a, b, d], [b, e, d]]) { c.fillStyle = `rgba(${r() < 0.5 ? '255,240,180' : '20,50,60'},${0.04 + r() * 0.1})`; S.poly(c, tri); c.fill(); } }
  // 三条路：从脚下分出去
  const road = (pts, col) => { c.beginPath(); c.moveTo(pts[0], pts[1]); c.bezierCurveTo(pts[2], pts[3], pts[4], pts[5], pts[6], pts[7]); c.lineTo(pts[8], pts[9]); c.bezierCurveTo(pts[10], pts[11], pts[12], pts[13], pts[14], pts[15]); c.closePath(); c.fillStyle = col; c.fill(); };
  road([380, 1900, 420, 1500, 200, 1250, -40, 1040, 10, 1024, 320, 1220, 600, 1480, 700, 1900], 'rgb(170,170,180)');
  road([420, 1900, 520, 1500, 800, 1260, 980, 1100, 1010, 1108, 900, 1280, 700, 1500, 760, 1900], 'rgb(214,190,140)');
  c.restore();
  // 右边：小木屋（暖窗）+ 树
  const hx = 940, hy = 1100; c.fillStyle = 'rgb(120,80,70)'; c.fillRect(hx - 60, hy - 70, 120, 70); S.poly(c, [[hx - 78, hy - 70], [hx + 78, hy - 70], [hx, hy - 136]], 'rgb(170,84,70)'); c.fillStyle = 'rgb(255,214,130)'; c.fillRect(hx - 36, hy - 50, 30, 30); c.fillRect(hx + 10, hy - 50, 22, 50); S.add(c, () => glow(c, hx - 20, hy - 36, 110, [255, 200, 120], 0.7));
  for (const [tx, ts] of [[1040, 1], [840, 0.8], [1100, 1.2]]) { c.fillStyle = 'rgb(90,60,50)'; c.fillRect(tx - 5 * ts, hy - 60 * ts, 10 * ts, 70 * ts); for (let k = 0; k < 3; k++) S.poly(c, [[tx - (50 - k * 12) * ts, hy - (50 + k * 40) * ts], [tx + (50 - k * 12) * ts, hy - (50 + k * 40) * ts], [tx, hy - (120 + k * 40) * ts]], rgba(mix([60, 120, 90], [120, 170, 110], k / 3))); }
}));
// 地图（INFJ 的）：木架 + 羊皮纸，上面的路线一条条亮
const ROUTES = [[[40, 250], [90, 180], [170, 200], [230, 120], [300, 60]], [[40, 250], [120, 260], [200, 230], [280, 250], [320, 180]], [[40, 250], [70, 120], [150, 90], [220, 40]]];
function map(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgb(110,76,60)'; ctx.fillRect(20, 300, 14, 190); ctx.fillRect(330, 300, 14, 190); ctx.fillRect(0, -16, 364, 18);
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; const g = ctx.createLinearGradient(0, 0, 364, 300); g.addColorStop(0, 'rgb(250,236,200)'); g.addColorStop(1, 'rgb(226,200,156)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 364, 310); ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(150,170,120,0.5)'; for (const [mx, my, mr] of [[100, 100, 50], [250, 190, 60], [300, 90, 36]]) { ctx.beginPath(); ctx.ellipse(mx, my, mr, mr * 0.6, 0.3, 0, 6.2832); ctx.fill(); }
  ROUTES.forEach((rt, i) => { const u = easeInOut(prog(t, T.infj - 0.2 + i * 0.75, T.infj + 0.7 + i * 0.75)); ctx.strokeStyle = 'rgba(150,110,80,0.5)'; ctx.lineWidth = 5; ctx.setLineDash([10, 8]); ctx.beginPath(); rt.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.setLineDash([]);
    S.neon(ctx, rt, u, [[255, 120, 90], [90, 160, 255], [120, 200, 120]][i], 0.9, 5, false, 0.3); if (u >= 1) { const e = rt[rt.length - 1]; ctx.fillStyle = 'rgb(214,70,60)'; ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[0], e[1] - 34); ctx.lineTo(e[0] + 24, e[1] - 24); ctx.lineTo(e[0], e[1] - 14); ctx.fill(); } });
  ctx.restore();
}
function sceneA(ctx, t) {
  const C = S.camKF(t, CAMA);
  ctx.fillStyle = 'rgb(40,60,120)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 0.12); ctx.drawImage(SKYA(), -PAD, -260);
  const br = 1 + 0.03 * Math.sin(t * 0.7); S.add(ctx, () => { glow(ctx, SUNP[0], SUNP[1], 1200 * br, [255, 190, 130], 0.4); glow(ctx, SUNP[0], SUNP[1], 420, [255, 226, 170], 0.6); glow(ctx, SUNP[0], SUNP[1], 130, [255, 250, 230], 1); }); ctx.restore();
  ctx.save(); S.cam(ctx, C, 1); ctx.drawImage(LANDA(), -PAD, 0);
  const L0 = [SUNP[0] + 400, SUNP[1] - 200];
  // 两条路的亮度：她的心选了哪条
  const pick = smooth(prog(t, T.inner - 0.2, T.inner + 0.9));
  S.add(ctx, () => { ctx.filter = 'blur(14px)'; ctx.fillStyle = `rgba(255,214,130,${0.4 * pick})`; ctx.beginPath(); ctx.moveTo(420, 1700); ctx.bezierCurveTo(520, 1500, 800, 1260, 980, 1100); ctx.lineTo(1010, 1108); ctx.bezierCurveTo(900, 1280, 700, 1500, 760, 1700); ctx.fill(); ctx.filter = 'none'; glow(ctx, 940, 1060, 260 * pick, [255, 200, 120], 0.5 * pick); });
  // INFJ + 地图
  map(ctx, 60, 760, 1.0, t);
  const pt = Math.min(2.99, Math.max(0, (t - T.infj + 0.2) / 0.75)), ri = Math.floor(pt), rt = ROUTES[Math.min(2, ri)], pp = rt[Math.min(rt.length - 1, Math.round((pt - ri) * (rt.length - 1)))];
  const J = S.lit(ctx, c => MB.person(c, 'infj-male', 520, GY + 6, 2.1, { flip: true, bob: Math.abs(Math.sin(t * 2)) * 3 }), { light: L0, at: [520, GY - 250], r: 320, warm: SUNC, cool: [50, 60, 110], k: 0.9 });
  ctx.strokeStyle = 'rgb(120,84,56)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(J.chest[0] - 70, J.chest[1] + 10); ctx.lineTo(60 + pp[0] + 14, 760 + pp[1] + 6); ctx.stroke();
  // 她
  const heart = smooth(prog(t, T.d02 - 0.2, T.mean)), tug = smooth(prog(t, T.real - 0.3, T.ideal + 0.4)) * (1 - smooth(prog(t, OFF - 0.3, OFF + 0.3))), sway = Math.sin(t * 2.6) * tug;
  const hx = 800 + sway * 30, o = { t, wind: false, eyes: heart > 0.5 && tug < 0.3 ? 'closed' : tug > 0.4 ? 'sad' : 'open', mouth: tug > 0.4 ? 'flat' : 'smile', la: -0.7 * heart * (1 - tug), tilt: 0.2 * heart - 0.3 * sway, lean: 0.07 * sway, look: [-1, 0] };
  const R = S.lit(ctx, c => infp(c, hx, GY, 1.0, o), { light: L0, at: [hx, GY - 290], r: 340, warm: SUNC, cool: [50, 60, 120], k: 0.9 });
  // 胸口的罗盘光：转半圈，停在右边那条路
  if (heart > 0.01) { const ang = lerp(-2.6, -0.5, easeOut(prog(t, T.mean - 0.2, T.inner + 0.5))) + Math.sin(t * 9) * 0.3 * (1 - pick); S.add(ctx, () => { glow(ctx, R.chest[0], R.chest[1], 190, [255, 214, 140], 0.6 * heart); });
    S.ring(ctx, R.chest[0], R.chest[1], 86, 12, [255, 226, 160], 0.5 * heart); ctx.save(); ctx.translate(R.chest[0], R.chest[1]); ctx.rotate(ang); ctx.globalAlpha = heart * (1 - tug); S.poly(ctx, [[0, -15], [118, 0], [0, 15]], 'rgb(255,236,180)'); S.poly(ctx, [[0, -15], [-50, 0], [0, 15]], 'rgb(214,150,90)'); ctx.restore(); }
  // 现实 vs 理想：两条光绸往两边拉
  if (tug > 0.01) { const mk = (to, bend) => Array.from({ length: 30 }, (_, k) => { const s = k / 29; return [lerp(R.chest[0], to[0], s), lerp(R.chest[1], to[1], s) + Math.sin(s * Math.PI) * bend + Math.sin(s * 10 - t * 5) * 8]; });
    S.ribbon(ctx, mk([40, 960], 80 - sway * 60), s => 8 + 20 * Math.sin(s * Math.PI), [90, 110, 190], 0.4 * tug, smooth(prog(t, T.real - 0.3, T.real + 0.5)));
    S.ribbon(ctx, mk([940, 1064], -150 + sway * 60), s => 8 + 20 * Math.sin(s * Math.PI), [255, 150, 60], 0.4 * tug, smooth(prog(t, T.ideal - 0.3, T.ideal + 0.5))); }
  ctx.restore();
  return { C };
}
// ---------- B：格子间 ----------
const FYB = 1000;
const OFFICE = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2); const r = mulberry32(61);
  S.vgrad(c, [[0, [70, 78, 104]], [1, [104, 112, 136]]], -PAD, FYB, -PAD, W + PAD);
  // 天花板的灯管（透视，往消失点排）
  S.poly(c, [[-PAD, -PAD], [W + PAD, -PAD], [760, 330], [320, 330]], 'rgb(84,92,116)');
  for (let k = 0; k < 5; k++) { const u = k / 4, y = lerp(-80, 300, Math.pow(u, 0.7)), w = lerp(700, 150, u), x = 540; c.fillStyle = 'rgb(250,252,255)'; c.beginPath(); c.roundRect(x - w / 2, y, w, lerp(40, 12, u), 6); c.fill(); S.add(c, () => glow(c, x, y + 10, w * 0.8, [200, 220, 255], 0.34)); }
  // 左墙的窗（唯一的暖光）
  S.poly(c, [[-PAD, -100], [160, 330], [160, FYB], [-PAD, 1300]], 'rgb(84,92,118)');
  const q = [[-150, 250], [90, 380], [90, 840], [-150, 960]]; S.poly(c, q); const g = c.createLinearGradient(0, 300, 0, 900); g.addColorStop(0, 'rgb(255,236,190)'); g.addColorStop(1, 'rgb(255,200,140)'); c.fillStyle = g; c.fill(); c.strokeStyle = 'rgb(226,230,236)'; c.lineWidth = 14; S.poly(c, q); c.stroke();
  // 远处一排排隔板
  for (let row = 0; row < 4; row++) { const u = row / 3, y = lerp(700, 940, u), sc = lerp(0.3, 0.75, u), n = 7; for (let i = 0; i < n; i++) { const x = 540 + (i - (n - 1) / 2) * 240 * sc; const pg = c.createLinearGradient(0, y - 150 * sc, 0, y); pg.addColorStop(0, rgba(mix([96, 104, 128], [78, 86, 112], u))); pg.addColorStop(1, rgba(mix([80, 88, 112], [56, 62, 86], u))); c.fillStyle = pg; c.fillRect(x - 110 * sc, y - 150 * sc, 220 * sc, 150 * sc); c.fillStyle = 'rgba(40,50,70,0.5)'; c.fillRect(x - 40 * sc, y - 120 * sc, 80 * sc, 60 * sc); c.fillStyle = 'rgba(170,200,250,0.75)'; c.fillRect(x - 34 * sc, y - 114 * sc, 68 * sc, 44 * sc); } }
  c.fillStyle = 'rgb(60,66,88)'; c.fillRect(-PAD, FYB - 20, W + PAD * 2, 20);
  S.vgrad(c, [[0, [96, 102, 124]], [0.4, [70, 76, 98]], [1, [30, 34, 50]]], FYB, H + PAD, -PAD, W + PAD);
  for (let i = -8; i <= 20; i++) { const xb = i * 170, xa = 540 + (xb - 540) * 0.5; S.poly(c, [[xa - 1.5, FYB], [xa + 1.5, FYB], [xb + 4, H + PAD], [xb - 4, H + PAD]], 'rgba(20,30,50,0.16)'); }
}));
const BEAMB = S.lazy(() => S.bake(1300, 1200, c => { c.filter = 'blur(20px)'; const g = c.createLinearGradient(0, 200, 900, 1000); g.addColorStop(0, 'rgba(255,220,150,0.6)'); g.addColorStop(1, 'rgba(255,220,150,0)'); c.fillStyle = g; S.poly(c, [[20, 230], [150, 330], [1000, 1060], [620, 1140]]); c.fill(); }));
const HB = [560, 1290], DKY = 1100;
function sceneB(ctx, t) {
  const C = S.camKF(t, CAMB);
  ctx.fillStyle = 'rgb(70,78,104)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1); ctx.drawImage(OFFICE(), -PAD, -PAD / 2);
  const sun = smooth(prog(t, T.d05 + 0.3, T.resp + 0.6)) * (1 - smooth(prog(t, T.d06 - 0.3, T.d06 + 0.6)));
  S.add(ctx, () => { ctx.globalAlpha = 0.25 + 0.75 * sun; ctx.drawImage(BEAMB(), -200, 150); ctx.globalAlpha = 1; });
  // 大压板（高压）：从天花板一点点压下来
  const pr = smooth(prog(t, T.press - 0.3, T.d08)) * (1 - smooth(prog(t, T.dead, T.dead + 0.8)) * 0.3), py = lerp(-260, 420, pr) + Math.sin(t * 30) * 2 * (pr > 0.05 && pr < 0.98 ? 1 : 0);
  if (pr > 0.01) { ctx.fillStyle = 'rgb(84,90,104)'; ctx.fillRect(500, -400, 80, py + 400); const g = ctx.createLinearGradient(0, py, 0, py + 110); g.addColorStop(0, 'rgb(130,138,156)'); g.addColorStop(1, 'rgb(60,66,82)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(120, py, 840, 110, 14); ctx.fill(); ctx.fillStyle = 'rgba(255,220,90,0.9)'; for (let k = 0; k < 10; k++) S.poly(ctx, [[140 + k * 84, py + 110], [182 + k * 84, py + 110], [162 + k * 84, py + 84], [120 + k * 84, py + 84]]), ctx.fill(); K.text(ctx, '高 压', 540, py + 66, { size: 54, weight: 500, color: [240, 240, 250], spacing: 0.6 }); ctx.save(); ctx.globalAlpha = 0.3 * pr; S.rgrad(ctx, 540, 1000, 700, [[0, [20, 26, 44], 0.9], [1, [20, 26, 44], 0]], 0.5); ctx.restore(); }
  // 她
  const drain = smooth(prog(t, T.drain - 0.8, T.sick)), sick = smooth(prog(t, T.sick - 0.3, T.sick + 0.4)) * (1 - smooth(prog(t, T.d09, T.dead))), dead = easeInOut(prog(t, T.dead - 0.5, T.dead + 0.2));
  const stamp = t > T.d06 + 0.2 && t < T.d08 + 0.4, sc = ((t - T.d06 - 0.2) / 0.62) % 1, down = stamp ? (sc < 0.25 ? easeIn(sc / 0.25) : sc < 0.4 ? 1 : 1 - easeOut((sc - 0.4) / 0.3)) : 0;
  const reach = Math.sin(Math.PI * prog(t, T.pay + 0.2, T.care + 0.5));
  const L0 = [540, 0];
  const o = { t, wind: false, flies: dead > 0.5 ? 0 : 1, eyes: dead > 0.3 || drain > 0.8 ? 'closed' : sick > 0.3 ? 'sad' : sun > 0.6 ? 'closed' : 'open', mouth: drain > 0.3 || stamp ? 'flat' : 'smile', dim: 0.9 * drain, tilt: 0.5 * drain + 0.3 * Math.sin(t * 5) * sick + 1.2 * dead, nod: 1.2 * dead, lean: 0.06 * Math.sin(t * 4) * sick + 0.34 * dead, la: -0.6 * sun, ra: -0.6 * down - 0.9 * reach, look: reach > 0.2 ? [1, -1.6] : [0.4, 1] };
  const R = S.lit(ctx, c => infp(c, HB[0] - 40 * dead, HB[1] + 70 * dead, 1.0, o), { light: sun > 0.4 ? [-300, 300] : L0, at: [HB[0], HB[1] - 290], r: 340, warm: sun > 0.4 ? [255, 226, 170] : [226, 234, 250], cool: [40, 48, 80], k: 0.9, tint: sick > 0.05 ? [[120, 170, 110], 0.3 * sick] : null });
  // 胸口的小灯：感受（一下一下亮）→ 被耗成火星
  const lamp = smooth(prog(t, T.d04, T.d04 + 0.6)) * (1 - 0.92 * drain) * (1 - dead), bl = 0.6 + 0.4 * Math.pow(Math.max(0, Math.sin(t * 2.6)), 2) * (0.3 + 0.7 * sun);
  S.add(ctx, () => { glow(ctx, R.chest[0], R.chest[1], (80 + 90 * sun) * lamp * bl + 12, [255, 190, 110], 0.45 * (lamp + 0.1)); glow(ctx, R.chest[0], R.chest[1], 30 * lamp + 6, [255, 244, 210], 0.9); });
  if (sun > 0.3) for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k / 2) % 1; S.ring(ctx, R.chest[0], R.chest[1], 50 + ph * 300, 22, [255, 220, 150], 0.4 * (1 - ph) * sun); }
  // 工位：桌面 + 隔板 + 显示器 + 纸 + 碎纸机
  const dg = ctx.createLinearGradient(0, DKY, 0, DKY + 40); dg.addColorStop(0, 'rgb(176,184,204)'); dg.addColorStop(1, 'rgb(120,128,152)'); ctx.fillStyle = dg; S.poly(ctx, [[140, DKY], [980, DKY], [1010, DKY + 44], [110, DKY + 44]]); ctx.fill();
  const fg = ctx.createLinearGradient(0, DKY + 44, 0, DKY + 400); fg.addColorStop(0, 'rgb(84,92,118)'); fg.addColorStop(1, 'rgb(40,46,66)'); ctx.fillStyle = fg; ctx.fillRect(110, DKY + 44, 900, 400);
  ctx.fillStyle = 'rgb(60,66,84)'; ctx.fillRect(196, DKY - 20, 150, 22); ctx.fillRect(256, DKY - 80, 30, 64); const mg = ctx.createLinearGradient(0, DKY - 250, 0, DKY - 76); mg.addColorStop(0, 'rgb(50,56,74)'); mg.addColorStop(1, 'rgb(30,34,50)'); ctx.fillStyle = mg; ctx.beginPath(); ctx.roundRect(150, DKY - 260, 250, 186, 12); ctx.fill();
  ctx.fillStyle = 'rgb(206,220,246)'; ctx.fillRect(164, DKY - 246, 222, 158); for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(90,110,160,0.45)'; ctx.fillRect(176, DKY - 232 + k * 24, 80 + ((k * 53) % 110), 10); }
  // 碎纸机
  const sx = 860; ctx.fillStyle = 'rgb(84,90,108)'; ctx.beginPath(); ctx.roundRect(sx - 90, DKY - 100, 180, 104, 12); ctx.fill(); ctx.fillStyle = 'rgb(30,34,46)'; ctx.fillRect(sx - 66, DKY - 86, 132, 12); K.text(ctx, '碎纸机', sx, DKY - 30, { size: 30, weight: 500, color: [200, 206, 220] });
  if (stamp) { for (let k = 0; k < 12; k++) { const ph = (t * 1.2 + k / 12) % 1; ctx.fillStyle = `rgba(250,250,246,${0.9 * (1 - ph)})`; ctx.fillRect(sx - 60 + k * 10.5, DKY + 6 + ph * 190, 6, 46); } }
  // 纸：盖完章滑向碎纸机
  ctx.fillStyle = 'rgb(250,250,244)'; S.poly(ctx, [[470, DKY - 4], [660, DKY - 4], [680, DKY + 26], [450, DKY + 26]]); ctx.fill();
  if (stamp) { const sl = sc > 0.45 ? easeIn((sc - 0.45) / 0.55) : 0, px = lerp(565, sx, sl), pyy = lerp(DKY + 8, DKY - 84, sl); ctx.save(); ctx.translate(px, pyy); ctx.rotate(-0.5 * sl); ctx.scale(1 - 0.5 * sl, 1); ctx.fillStyle = 'rgb(255,255,250)'; S.poly(ctx, [[-96, -14], [96, -14], [112, 14], [-112, 14]]); ctx.fill(); if (sc > 0.3) { ctx.strokeStyle = 'rgba(220,60,60,0.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(10, 0, 30, 9, 0, 0, 6.2832); ctx.stroke(); } ctx.restore();
    const hx = R.rh[0] + 30, hy = lerp(DKY - 120, DKY - 22, down); ctx.fillStyle = 'rgb(120,70,50)'; ctx.beginPath(); ctx.roundRect(hx - 16, hy - 70, 32, 60, 10); ctx.fill(); ctx.fillStyle = 'rgb(200,60,60)'; ctx.beginPath(); ctx.roundRect(hx - 30, hy - 14, 60, 22, 6); ctx.fill(); }
  // 工资袋（待遇不错）：吊下来晃
  const pay = K.vis(t, T.d07, T.d08 + 0.4, 0.5, 0.6); if (pay > 0.01) { const bx = 800 + Math.sin(t * 1.6) * 40, by = lerp(-200, 640, easeOut(prog(t, T.d07, T.pay + 0.3))); ctx.save(); ctx.globalAlpha = pay; ctx.strokeStyle = 'rgba(240,230,200,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(820, -300); ctx.lineTo(bx, by - 90); ctx.stroke();
    S.add(ctx, () => glow(ctx, bx, by, 330, [255, 206, 100], 0.5)); ctx.translate(bx, by); ctx.rotate(Math.sin(t * 1.6) * 0.12); const g = ctx.createLinearGradient(-90, -90, 90, 110); g.addColorStop(0, 'rgb(255,236,150)'); g.addColorStop(1, 'rgb(230,160,60)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-50, -90); ctx.lineTo(50, -90); ctx.quadraticCurveTo(30, -50, 96, 30); ctx.quadraticCurveTo(110, 120, 0, 120); ctx.quadraticCurveTo(-110, 120, -96, 30); ctx.quadraticCurveTo(-30, -50, -50, -90); ctx.fill(); ctx.fillStyle = 'rgb(190,110,50)'; ctx.fillRect(-46, -64, 92, 14); K.text(ctx, '¥', 0, 76, { size: 120, family: 'Latin', weight: 600, color: [150, 84, 30] }); ctx.restore(); }
  // 生理不适：头顶转圈
  if (sick > 0.01) for (let k = 0; k < 3; k++) { const a = t * 5 + k * 2.1; S.add(ctx, () => glow(ctx, R.top[0] + Math.cos(a) * 80, R.top[1] - 30 + Math.sin(a) * 22, 26, [200, 240, 150], 0.9 * sick)); }
  // 生无可恋：小小的她飘出来
  if (dead > 0.3) { const u = prog(t, T.dead - 0.1, T.end), gx = HB[0] + 40 + Math.sin(t * 1.5) * 30, gy = HB[1] - 330 - u * 420; S.add(ctx, () => { glow(ctx, gx, gy - 130, 220, [200, 220, 255], 0.2 * smooth(u * 3)); S.ring(ctx, gx, gy - 300, 54, 10, [255, 250, 220], 0.8 * smooth(u * 3), 0.3); });
    S.lit(ctx, c => infp(c, gx, gy, 0.5, { t, flies: 0, wind: false, eyes: 'closed', mouth: 'flat', la: -0.4, ra: -0.4 }), { at: [gx, gy - 140], r: 170, k: 0.2, tint: [[200, 226, 255], 0.5], alpha: 0.85 * smooth(u * 3) }); }
  ctx.restore();
  // 前景：近处的隔板边（虚化）
  ctx.save(); S.cam(ctx, C, 1.6); ctx.filter = 'blur(10px)'; ctx.fillStyle = 'rgb(60,66,84)'; ctx.fillRect(-340, 1180, 420, 1200); ctx.fillRect(1000, 1240, 420, 1200); ctx.filter = 'none'; ctx.restore();
  return { C };
}
function draw(ctx, t) {
  if (t < OFF) return sceneA(ctx, t);
  let st; if (t < OFF + 0.6) st = sceneA(ctx, t);
  S.group(ctx, smooth(prog(t, OFF + 0.1, OFF + 0.6)), c => { st = sceneB(c, t); });
  return st;
}
function over(ctx, t, a) {
  // 那句话：一遍、两遍、三遍
  if (t > T.d04 - 0.2 && t < T.d06 + 0.3) [0, 1, 2].forEach(k => { const t0 = T.d04 + 0.15 + k * 0.9, age = t - t0; if (age <= 0) return; const al = smooth(prog(age, 0, 0.3)) * lerp(1, 0.22, smooth(prog(age, 0.6, 1.6))) * (1 - smooth(prog(t, T.d05 + 1.2, T.d05 + 2.0))) * a, sc = 1 + 0.16 * age; ctx.save(); ctx.translate(540, 300); ctx.scale(sc, sc); S.title(ctx, '我真的喜欢', 0, -44, { size: 84, c: [220, 230, 255], a: al, spacing: 0.06, glowA: 0.3 }); S.title(ctx, '这份工作吗？', 0, 60, { size: 84, c: [220, 230, 255], a: al, spacing: 0.06, glowA: 0.3 }); ctx.restore(); });
  const r = K.vis(t, T.remind - 0.6, T.d06 - 0.1, 0.4, 0.4) * a; if (r > 0.003) S.title(ctx, '感受，是世界给你的提醒', 540, 300, { size: 66, c: [255, 220, 150], a: r, spacing: 0.08, glowA: 0.3 });
  const n = K.vis(t, T.nomean - 0.1, T.d07 + 0.2, 0.3, 0.4) * a; if (n > 0.003) S.title(ctx, '盖章 → 碎掉 → 盖章 → 碎掉', 540, 640, { size: 52, c: [200, 210, 236], a: n, spacing: 0.06, glowA: 0.2 });
}
module.exports = { draw, over, T };
