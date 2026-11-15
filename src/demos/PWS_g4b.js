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
const CAMA = [[T.in, { x: -60, y: -30, z: 1.0, ax: 540, ay: GY }], [T.infj, { x: -330, y: -30, z: 1.24 }], [T.d02 - 0.1, { x: -330, y: -30, z: 1.28 }], [T.d02 + 1.5, { x: 250, y: 10, z: 1.3 }], [T.d03 - 0.1, { x: 250, y: 10, z: 1.34 }], [T.real + 0.2, { x: 160, y: -10, z: 1.0 }], [OFF - 0.2, { x: 150, y: -10, z: 1.03 }], [OFF + 0.6, { x: -420, y: -60, z: 2.6 }, easeIn]];
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
// 2026-11-15 反馈 07 重做：去掉那根上下晃的教鞭。推演直接画在地图上：
//   第一条路线画到一半撞上山，打叉；第二条绕到河边，打叉；第三条一路画到终点，插上旗、亮起星 —— 这是他推演出来的「正确道路」
const ROUTES = [[[40, 262], [84, 214], [128, 190], [150, 150]], [[40, 262], [112, 268], [190, 250], [250, 262], [286, 228]], [[40, 262], [70, 150], [120, 96], [200, 84], [262, 118], [318, 60]]];
function map(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgb(110,76,60)'; ctx.fillRect(20, 300, 14, 190); ctx.fillRect(330, 300, 14, 190); ctx.fillRect(-6, -18, 376, 20);
  ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; const g = ctx.createLinearGradient(0, 0, 364, 300); g.addColorStop(0, 'rgb(252,240,206)'); g.addColorStop(1, 'rgb(230,204,160)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 364, 310); ctx.shadowColor = 'transparent';
  // 地形：山（挡住第一条路）、河（挡住第二条路）、树
  for (const [mx, my, w] of [[150, 150, 70], [196, 170, 54], [110, 168, 44]]) { S.poly(ctx, [[mx - w, my + 30], [mx, my - w * 0.9], [mx + w, my + 30]], 'rgb(170,150,120)'); S.poly(ctx, [[mx, my - w * 0.9], [mx + w, my + 30], [mx + w * 0.2, my + 30]], 'rgb(134,116,96)'); S.poly(ctx, [[mx - w * 0.2, my - w * 0.6], [mx, my - w * 0.9], [mx + w * 0.22, my - w * 0.58], [mx, my - w * 0.5]], 'rgb(250,246,240)'); }
  ctx.strokeStyle = 'rgb(120,180,214)'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(364, 150); ctx.bezierCurveTo(300, 180, 330, 250, 270, 310); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 5; ctx.stroke();
  for (const [tx, ty] of [[60, 60], [90, 86], [240, 40], [44, 120], [330, 110]]) { ctx.fillStyle = 'rgb(120,170,120)'; ctx.beginPath(); ctx.arc(tx, ty, 13, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = 'rgb(214,90,70)'; ctx.beginPath(); ctx.arc(40, 262, 11, 0, 6.2832); ctx.fill(); K.text(ctx, '现在', 40, 298, { size: 22, weight: 500, color: [110, 76, 60] });
  ROUTES.forEach((rt, i) => { const t0 = T.infj - 0.3 + i * 0.95, u = easeInOut(prog(t, t0, t0 + (i === 2 ? 1.1 : 0.7))), done = prog(t, t0 + (i === 2 ? 1.1 : 0.7), t0 + (i === 2 ? 1.5 : 1.0)); if (u <= 0) return;
    const col = i === 2 ? [255, 170, 60] : [150, 130, 120], dim = i < 2 ? 1 - 0.55 * smooth(done) : 1;
    const P = u >= 1 ? rt : K.partial(rt, u); ctx.save(); ctx.globalAlpha = dim; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); P.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]));
    if (i === 2) { ctx.strokeStyle = 'rgba(255,190,90,0.45)'; ctx.lineWidth = 18; ctx.stroke(); ctx.strokeStyle = 'rgb(236,110,50)'; ctx.lineWidth = 8; ctx.stroke(); } else { ctx.strokeStyle = 'rgb(120,100,90)'; ctx.lineWidth = 7; ctx.setLineDash([14, 10]); ctx.stroke(); ctx.setLineDash([]); }
    if (u < 1 && P.length) { const h = P[P.length - 1]; ctx.fillStyle = i === 2 ? 'rgb(236,110,50)' : 'rgb(120,100,90)'; ctx.beginPath(); ctx.arc(h[0], h[1], 11, 0, 6.2832); ctx.fill(); } ctx.restore();
    const e = rt[rt.length - 1];
    if (i < 2 && done > 0) { const k = easeOut(done), r = 20 * (1 + 0.5 * (1 - k)); ctx.strokeStyle = 'rgb(214,60,60)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(e[0] - r, e[1] - r); ctx.lineTo(e[0] - r + 2 * r * Math.min(1, k * 2), e[1] - r + 2 * r * Math.min(1, k * 2)); if (k > 0.5) { ctx.moveTo(e[0] + r, e[1] - r); ctx.lineTo(e[0] + r - 2 * r * (k * 2 - 1), e[1] - r + 2 * r * (k * 2 - 1)); } ctx.stroke(); }
    if (i === 2 && done > 0) { const k = easeOut(done) * (1 + 0.3 * Math.sin(Math.min(1, done) * Math.PI)); S.add(ctx, () => glow(ctx, e[0], e[1] - 20, 110 * k, [255, 200, 90], 0.8)); ctx.fillStyle = 'rgb(110,76,60)'; ctx.fillRect(e[0] - 2.5, e[1] - 50 * k, 5, 50 * k); S.poly(ctx, [[e[0], e[1] - 50 * k], [e[0] + 34 * k, e[1] - 38 * k], [e[0], e[1] - 24 * k]], 'rgb(230,70,60)'); } });
  ctx.restore();
}
function compass(ctx, x, y, r, ang, a, t) {      // 反馈 08：一只看得清的铜罗盘，指针是一颗心
  if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
  S.add(ctx, () => glow(ctx, 0, 0, r * 1.7, [255, 214, 150], 0.22));
  ctx.shadowColor = 'rgba(40,20,10,0.45)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8; const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, 'rgb(250,214,130)'); g.addColorStop(0.5, 'rgb(190,130,70)'); g.addColorStop(1, 'rgb(240,196,110)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, 6.2832); ctx.fill(); ctx.shadowColor = 'transparent';
  const f = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 0, 0, 0, r * 0.84); f.addColorStop(0, 'rgb(255,252,240)'); f.addColorStop(1, 'rgb(236,220,190)'); ctx.fillStyle = f; ctx.beginPath(); ctx.arc(0, 0, r * 0.84, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgb(130,90,60)'; for (let k = 0; k < 12; k++) { ctx.save(); ctx.rotate(k * Math.PI / 6); ctx.beginPath(); ctx.roundRect(-r * 0.03, -r * 0.8, r * 0.06, k % 3 ? r * 0.1 : r * 0.2, 2); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = 'rgb(210,150,80)'; ctx.beginPath(); ctx.roundRect(-r * 0.12, -r * 1.22, r * 0.24, r * 0.26, 4); ctx.fill();
  ctx.rotate(ang);
  S.poly(ctx, [[0, -r * 0.1], [-r * 0.5, 0], [0, r * 0.1]], 'rgb(150,160,180)');
  ctx.fillStyle = 'rgb(236,84,104)'; ctx.fillRect(0, -r * 0.06, r * 0.44, r * 0.12); ctx.save(); ctx.translate(r * 0.56, 0); ctx.rotate(-Math.PI / 2); const h = r * 0.2; ctx.beginPath(); ctx.moveTo(0, h); ctx.bezierCurveTo(-h * 1.5, 0, -h * 1.2, -h * 1.3, 0, -h * 0.5); ctx.bezierCurveTo(h * 1.2, -h * 1.3, h * 1.5, 0, 0, h); ctx.fill(); ctx.restore();
  ctx.fillStyle = 'rgb(110,76,60)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.08, 0, 6.2832); ctx.fill();
  ctx.restore();
}
function sceneA(ctx, t) {
  const C = S.camKF(t, CAMA);
  ctx.fillStyle = 'rgb(40,60,120)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 0.12); ctx.drawImage(SKYA(), -PAD, -260);
  const br = 1 + 0.03 * Math.sin(t * 0.7); S.add(ctx, () => { glow(ctx, SUNP[0], SUNP[1], 1200 * br, [255, 190, 130], 0.4); glow(ctx, SUNP[0], SUNP[1], 420, [255, 226, 170], 0.6); glow(ctx, SUNP[0], SUNP[1], 130, [255, 250, 230], 1); }); ctx.restore();
  ctx.save(); S.cam(ctx, C, 1); ctx.drawImage(LANDA(), -PAD, 0);
  const L0 = [SUNP[0] + 400, SUNP[1] - 200];
  const pick = smooth(prog(t, T.inner - 0.2, T.inner + 0.9));
  // 她的心选了哪条：只是沿着小路一盏盏亮起几点暖光，不再整条路刷亮（反馈 08：黄色光太亮）
  S.add(ctx, () => { for (let k = 0; k < 6; k++) { const u = smooth(prog(pick, k * 0.14, k * 0.14 + 0.3)), s2 = k / 5, px = lerp(700, 965, s2) + Math.sin(s2 * 3) * 30, py = lerp(1400, 1112, Math.pow(s2, 0.8)); S.rgrad(ctx, px, py, 70 - k * 7, [[0, [255, 214, 140], 0.5 * u], [1, [255, 214, 140], 0]], 0.3); } glow(ctx, 940, 1060, 150 * pick, [255, 200, 120], 0.3 * pick); });
  // INFJ + 地图：推演完就沿着他的路线走了（画面让给她）
  const leave = easeInOut(prog(t, T.d02 + 0.2, T.d02 + 1.6)), ja = 1 - smooth(prog(leave, 0.6, 1));
  if (ja > 0.01) { ctx.save(); ctx.globalAlpha = ja; map(ctx, -170, 690, 1.25, t); ctx.restore();
    const jx = 470 - leave * 520, think = smooth(prog(t, T.infj - 0.3, T.infj + 0.2)) * (1 - smooth(prog(t, T.plan + 0.3, T.d02)));
    const J = S.lit(ctx, c => MB.person(c, 'infj-male', jx, GY + 6, 2.1, { a: ja, flip: true, bob: Math.abs(Math.sin(t * (leave > 0 && leave < 1 ? 7 : 2))) * (leave > 0 && leave < 1 ? 8 : 3), lean: -0.02 * think }), { light: L0, at: [jx, GY - 250], r: 320, warm: SUNC, cool: [50, 60, 110], k: 0.9 });
    for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(255,255,255,${0.8 * think * (0.5 + 0.5 * Math.sin(t * 4 - k))})`; ctx.beginPath(); ctx.arc(lerp(J.head[0] - 70, 300, (k + 1) / 4), lerp(J.head[1] - 40, 880, (k + 1) / 4), 7 + k * 5, 0, 6.2832); ctx.fill(); } }
  // 她
  const heart = smooth(prog(t, T.d02 - 0.2, T.mean)), tug = smooth(prog(t, T.real - 0.4, T.real + 0.4)) * (1 - smooth(prog(t, OFF - 0.1, OFF + 0.4))), win = smooth(prog(t, OFF - 0.6, OFF + 0.3));
  const sway = (Math.sin(t * 2.4) * 0.8 - 1.3 * win) * tug, hx = lerp(800, 700, smooth(prog(t, T.d03, T.real))) + sway * 44;
  const o = { t, wind: false, eyes: heart > 0.5 && tug < 0.3 ? 'closed' : tug > 0.4 ? 'wide' : 'open', mouth: tug > 0.4 ? 'o' : 'smile', la: -0.5 * heart * (1 - tug) - 0.9 * tug, ra: -0.9 * tug, tilt: 0.2 * heart * (1 - tug) - 0.3 * sway, lean: 0.07 * sway, look: [sway, 0] };
  const R = S.lit(ctx, c => infp(c, hx, GY, 1.0, o), { light: L0, at: [hx, GY - 290], r: 340, warm: SUNC, cool: [50, 60, 120], k: 0.9 });
  // D02：捧在胸前的罗盘 —— 指针转了大半圈，停在通向小木屋的那条路上
  if (heart > 0.01 && tug < 0.99) { const st = easeOut(prog(t, T.mean - 0.2, T.inner + 0.6)), ang = lerp(-9.5, -0.42, st) + Math.sin(t * 7) * 0.25 * (1 - st); compass(ctx, R.chest[0] + 96, R.chest[1] + 20, 84 * (0.6 + 0.4 * easeOut(heart)), ang, heart * (1 - tug), t); }
  // D03（反馈 08 重做，不再是两条光线）：现实的她和理想的她，一人拽住她一只手往两边拉
  if (tug > 0.01) {
    const self = (dx, col, flip, lab, prop, ph) => { const pull = Math.sin(t * 2.4 + ph) * 0.5 + 0.5, x = hx + dx - sway * 10 + (flip ? -1 : 1) * pull * 14, lean = (flip ? -1 : 1) * (0.1 + 0.08 * pull);
      S.add(ctx, () => S.rgrad(ctx, x, GY + 4, 190, [[0, col, 0.3 * tug], [1, col, 0]], 0.16));
      ctx.save(); if (flip) { ctx.translate(2 * x, 0); ctx.scale(-1, 1); }
      const Q = S.lit(ctx, c => infp(c, x, GY, 0.92, { t: t + ph, flies: 0, wind: false, eyes: 'open', mouth: 'flat', lean: 0.1 + 0.08 * pull, la: -1.0, ra: 0.5 }), { at: [x, GY - 250], r: 300, k: 0.3, tint: [col, 0.5], alpha: Math.min(1, tug * 1.5) });
      ctx.restore(); const hand = flip ? [2 * x - Q.lh[0], Q.lh[1]] : Q.lh, top = flip ? [2 * x - Q.top[0], Q.top[1]] : Q.top, oh = flip ? [2 * x - Q.rh[0], Q.rh[1]] : Q.rh;
      // 两只手之间一段绷紧的光带
      const tgt = flip ? R.lh : R.rh, pts = Array.from({ length: 10 }, (_, k) => [lerp(hand[0], tgt[0], k / 9), lerp(hand[1], tgt[1], k / 9) + Math.sin(k / 9 * Math.PI) * 6]); ctx.save(); ctx.globalAlpha = tug; ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((q, k) => k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.strokeStyle = 'rgb(120,90,70)'; ctx.lineWidth = 13; ctx.stroke(); ctx.strokeStyle = 'rgb(226,196,150)'; ctx.lineWidth = 7; ctx.setLineDash([12, 8]); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
      ctx.save(); ctx.globalAlpha = tug; ctx.translate(oh[0] + (flip ? -10 : 10), oh[1] + 40);
      if (prop === 'case') { ctx.fillStyle = 'rgb(60,70,100)'; ctx.beginPath(); ctx.roundRect(-46, -10, 92, 66, 8); ctx.fill(); ctx.strokeStyle = 'rgb(60,70,100)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(0, -10, 18, Math.PI, 0); ctx.stroke(); ctx.fillStyle = 'rgb(214,190,120)'; ctx.fillRect(-8, 14, 16, 12); }
      else { ctx.rotate(-0.3); ctx.fillStyle = 'rgb(240,214,170)'; ctx.beginPath(); ctx.ellipse(0, 20, 50, 36, 0, 0, 6.2832); ctx.fill(); [[255, 110, 110], [255, 200, 90], [110, 180, 240], [130, 200, 130]].forEach((c2, k) => { ctx.fillStyle = rgba(c2); ctx.beginPath(); ctx.arc(-26 + k * 17, 12 + (k % 2) * 16, 8, 0, 6.2832); ctx.fill(); }); }
      ctx.restore(); return top; };
    sceneA.TOPS = [self(-240, [96, 116, 180], true, '现实', 'case', 0), self(240, [255, 186, 90], false, '理想', 'art', Math.PI)];
  } else sceneA.TOPS = null;
  ctx.restore();
  sceneA.C = C;
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
  if (t < OFF + 0.3 && sceneA.TOPS && sceneA.C) { const la = K.vis(t, T.real - 0.1, OFF - 0.1, 0.4, 0.3) * a; [['现实的选择', [190, 206, 250]], ['内心的理想', [255, 220, 150]]].forEach(([str, col], i) => { const p = S.w2s(sceneA.C, sceneA.TOPS[i][0], sceneA.TOPS[i][1] - 60); ctx.fillStyle = `rgba(30,30,60,${0.6 * la})`; ctx.beginPath(); ctx.roundRect(p[0] - 150, p[1] - 50, 300, 72, 36); ctx.fill(); K.text(ctx, str, p[0], p[1], { size: 46, weight: 500, color: col, alpha: la, spacing: 0.06 }); }); }
  // 那句话：一遍、两遍、三遍
  if (t > T.d04 - 0.2 && t < T.d06 + 0.3) [0, 1, 2].forEach(k => { const t0 = T.d04 + 0.15 + k * 0.9, age = t - t0; if (age <= 0) return; const al = smooth(prog(age, 0, 0.3)) * lerp(1, 0.22, smooth(prog(age, 0.6, 1.6))) * (1 - smooth(prog(t, T.d05 + 1.2, T.d05 + 2.0))) * a, sc = 1 + 0.16 * age; ctx.save(); ctx.translate(540, 300); ctx.scale(sc, sc); S.title(ctx, '我真的喜欢', 0, -44, { size: 84, c: [220, 230, 255], a: al, spacing: 0.06, glowA: 0.3 }); S.title(ctx, '这份工作吗？', 0, 60, { size: 84, c: [220, 230, 255], a: al, spacing: 0.06, glowA: 0.3 }); ctx.restore(); });
  const r = K.vis(t, T.remind - 0.6, T.d06 - 0.1, 0.4, 0.4) * a; if (r > 0.003) S.title(ctx, '感受，是世界给你的提醒', 540, 300, { size: 66, c: [255, 220, 150], a: r, spacing: 0.08, glowA: 0.3 });
  const n = K.vis(t, T.nomean - 0.1, T.d07 + 0.2, 0.3, 0.4) * a; if (n > 0.003) S.title(ctx, '盖章 → 碎掉 → 盖章 → 碎掉', 540, 640, { size: 52, c: [200, 210, 236], a: n, spacing: 0.06, glowA: 0.2 });
}
module.exports = { draw, over, T };
