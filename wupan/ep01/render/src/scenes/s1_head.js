// 开场 001–003 + 012（v2：画面只画配音正在说的事）
//   001 动物剪影队列 蚂蚁→鸟→狗→人；“人类”人亮起；“底层代码”推近人头，颅腔半透明亮起芯片「底层代码」
//   002 前半 手碰烫水壶 0.1 秒缩回：芯片一条亮线连到手，秒表「0.1 秒」，绿勾
//   002 后半 缪勒-莱尔错觉「✓ 这条更长」→ 尺子一量一样长 → ✓ 翻成 ✗，小人头还在点头
//   003 地面一队蚂蚁，放大镜移过来，「社会性昆虫」；“比如蚂蚁”推进放大镜 → 圆形转场进蚁巢（s2_nest）
//   012 蚁巢规则卡飞进人脑 → 再弹出「IF 价格高 → 一定好」「IF 好比较 → 就选它」→ “经常出事故”两张闪红、警示带、警示灯
'use strict';
const K = require('../core');
const { W, H, Canvas, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut, noise1 } = K;
const { Path2D } = require('skia-canvas');
const TL = require('../timeline');
const P = require('../paper');
const C = require('../card');
const ANT = require('../ant');
const CUT = require('../cutout');
const B = require('../brain');
const { L, at } = TL;

const IMG = { ant: CUT.get('eng_ant'), bird: CUT.get('eng_bird'), dog: CUT.get('eng_dog'), man: CUT.get('eng_man'), kettle: CUT.get('eng_kettle'), hand: CUT.get('eng_hand') };

// —— 时间（全部从句子取）——
const T = {
  enter: [L('001').t0 + 0.05, at('001', '动物') + 0.05, at('001', '一样'), at('001', '人类') - 0.25],
  human: at('001', '人类'), code: at('001', '底层代码'),
  b0: L('002').t0, good: at('002', '很好用'), fast: at('002', '飞快'), pick: at('002', '选择'),
  cost: at('002', '代价'), often: at('002', '它常常'), unaware: at('002', '不知不觉'), wrong: at('002', '犯错'),
  c0: L('003').t0 - 0.12, sci: at('003', '科学家'), social: at('003', '社会性'), eg: at('003', '比如'),
  back: L('012').t0 + 0.25, many: at('012', '很多'), simp: at('012', '过度简化'), fate: at('012', '注定'), often2: at('012', '经常'), boom: at('012', '事故'),
};
T.zoomA = [T.code - 0.3, T.code + 0.15];            // 推近人头
T.touch = T.fast - 0.1;                              // 手碰到壶
T.zoom = [T.eg - 0.15, L('003').t1 + 0.3];          // 推进放大镜
T.end = TL.CARD_T0 + 0.35;
const ACT1 = t => t < T.zoom[1] + 0.05, ACT2 = t => t >= T.back - 0.05 && t < T.end + 0.4;

// ======================= 001：动物队列 =======================
const GROUND = 806;
const LINEUP = [
  { k: 'ant', x: 230, h: 130 }, { k: 'bird', x: 640, h: 280 }, { k: 'dog', x: 1180, h: 470 }, { k: 'man', x: 1680, h: 730 },
];
const STRIP = P.poly(P.jag([[-40, 0], [W + 40, 0], [W + 40, 70], [-40, 70]], 4, 18, 71));
function lineup(ctx, t) {
  const hum = smooth(prog(t, T.human - 0.05, T.human + 0.3));
  ctx.save(); ctx.translate(0, GROUND - 6); P.piece(ctx, STRIP, '#d8c093', { blur: 8, dy: 3 }); ctx.restore();
  LINEUP.forEach((f, i) => {
    const e = easeOut(prog(t, T.enter[i], T.enter[i] + 0.35));
    if (e <= 0.01) return;
    const isMan = f.k === 'man';
    const a = clamp(e * 1.6) * (isMan ? 1 : lerp(1, 0.3, hum));
    const h = f.h * (1 + 0.12 * (1 - e)) * (isMan ? 1 + 0.05 * hum : 1);
    if (isMan && hum > 0.01) {
      const g = ctx.createRadialGradient(f.x, GROUND - f.h * 0.5, 20, f.x, GROUND - f.h * 0.5, f.h * 0.75);
      g.addColorStop(0, `rgba(255,214,110,${0.55 * hum})`); g.addColorStop(1, 'rgba(255,214,110,0)');
      ctx.fillStyle = g; ctx.fillRect(f.x - f.h, GROUND - f.h * 1.3, f.h * 2, f.h * 1.4);
    }
    CUT.place(ctx, IMG[f.k], f.x - (1 - e) * 60, GROUND + 4, h, { alpha: a });
  });
}
const MANHEAD = () => CUT.pt(IMG.man, 1680, GROUND + 4, 730, 0.6, 0.06);

// ======================= 001–002 前半：大人头 + 芯片 + 烫水壶 =======================
const HX = 470, HY = 1092, HHT = 890;
function bigHead(ctx, t) {
  const glass = smooth(prog(t, T.code - 0.05, T.code + 0.35));
  const map = B.head(ctx, { x: HX, y: HY, h: HHT, glass });
  const [cx, cy] = map(B.CR.u, B.CR.v + 0.02);
  const pop = easeOut(prog(t, T.code + 0.1, T.code + 0.45));
  const flash = Math.exp(-Math.max(0, t - T.touch) * 4) * (t > T.touch ? 1 : 0);
  const glow = 0.55 + 0.45 * smooth(prog(t, T.good - 0.2, T.good + 0.3)) + flash;
  if (pop > 0.01) {
    ctx.save(); ctx.translate(cx, cy); ctx.scale(0.6 + 0.4 * pop, 0.6 + 0.4 * pop);
    B.chip(ctx, 0, 0, 330, 170, '底层代码', clamp(pop * 1.5), clamp(glow));
    ctx.restore();
  }
  return [cx, cy];
}
// 水壶 + 手
const KX = 1020, KY = 850, KH = 420;
const TOUCH = CUT.pt(IMG.kettle, KX, KY, KH, 0.93, 0.7);
function handTip(t) {
  const x0 = TOUCH[0] + 260, back = TOUCH[0] + 210;
  const app = prog(t, T.b0 + 0.6, T.touch);
  let x = t < T.touch ? lerp(x0, TOUCH[0], easeIn(app) * 0.25 + smooth(app) * 0.75) : lerp(TOUCH[0], back, easeOut(prog(t, T.touch, T.touch + 0.1)));
  const slide = easeOut(prog(t, T.b0 + 0.05, T.b0 + 0.5));
  x += (1 - slide) * 700;
  let rot = 0;
  if (t > T.touch) rot = Math.sin((t - T.touch) * 40) * 0.05 * Math.exp(-(t - T.touch) * 6);
  return [x, TOUCH[1] - 8, rot];
}
function kettleHand(ctx, t, chipAt) {
  const k = easeOut(prog(t, T.b0, T.b0 + 0.4));
  if (k <= 0.01) return;
  // 热气：碰到时一圈红色热浪
  CUT.place(ctx, IMG.kettle, KX, KY - (1 - k) * 160, KH, { alpha: clamp(k * 1.5) });
  const hot = t > T.touch ? Math.exp(-(t - T.touch) * 2.2) : 0;
  if (hot > 0.02) {
    ctx.save(); ctx.strokeStyle = `rgba(214,60,30,${0.85 * hot})`; ctx.lineWidth = 7; ctx.lineCap = 'round';
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      for (let s = 0; s <= 20; s++) { const u = s / 20, r = 40 + u * 110; const a = i * 0.45; const px = TOUCH[0] + Math.cos(a) * r, py = TOUCH[1] + Math.sin(a) * r + Math.sin(u * 14) * 7; s ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
    ctx.restore();
  }
  const [hx, hy, hr] = handTip(t);
  // 芯片 → 手：一条亮线（“很好用”时连上，碰到时脉冲）
  const wire = smooth(prog(t, T.good - 0.15, T.good + 0.45));
  if (wire > 0.01 && chipAt) {
    const a = [chipAt[0] + 170, chipAt[1]], b = [hx + 420, hy - 10];
    const pts = []; for (let s = 0; s <= 40; s++) { const u = s / 40; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) - Math.sin(u * Math.PI) * 150]); }
    const q = K.partial(pts, wire);
    if (q.length > 1) {
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const p of q.slice(1)) ctx.lineTo(p[0], p[1]);
      ctx.strokeStyle = 'rgba(120,70,10,0.35)'; ctx.lineWidth = 14; ctx.stroke();
      ctx.strokeStyle = '#f0b43a'; ctx.lineWidth = 7; ctx.stroke();
      ctx.restore();
      const pu = prog(t, T.touch - 0.12, T.touch);           // 电流脉冲：碰到之前 0.12 秒从芯片跑到手
      if (pu > 0 && pu < 1) { const p = K.partial(pts, pu); const e = p[p.length - 1]; ctx.save(); ctx.fillStyle = '#fff3c4'; ctx.shadowColor = '#ffb020'; ctx.shadowBlur = 30; ctx.beginPath(); ctx.arc(e[0], e[1], 16, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    }
  }
  CUT.place(ctx, IMG.hand, hx, hy, 270, { anchor: [0, 0.1], rot: hr });
  // 缩手的速度线
  const sp = t > T.touch ? 1 - smooth(prog(t, T.touch + 0.05, T.touch + 0.5)) : 0;
  if (sp > 0.01) {
    ctx.save(); ctx.strokeStyle = `rgba(43,33,24,${0.6 * sp})`; ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const y = hy - 40 + i * 50; ctx.beginPath(); ctx.moveTo(hx - 120, y); ctx.lineTo(hx - 30, y); ctx.stroke(); }
    ctx.restore();
  }
  // 秒表「0.1 秒」+ 绿勾
  const sw = easeOut(prog(t, T.touch + 0.12, T.touch + 0.4));
  if (sw > 0.01) stopwatch(ctx, 1640, 250, 108, sw, t);
  C.tick(ctx, 1830, 230, 110, prog(t, T.pick - 0.05, T.pick + 0.35));
}
function stopwatch(ctx, x, y, r, p, t) {
  ctx.save(); ctx.translate(x, y); const s = 0.5 + 0.5 * p + Math.sin(clamp(p) * Math.PI) * 0.1; ctx.scale(s, s); ctx.globalAlpha *= clamp(p * 1.5);
  ctx.shadowColor = 'rgba(40,25,10,0.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#6b5a48'; ctx.fillRect(-16, -r - 34, 32, 26); ctx.beginPath(); ctx.arc(0, -r - 40, 14, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = '#6b5a48'; ctx.fill();
  ctx.shadowColor = 'transparent';
  ctx.beginPath(); ctx.arc(0, 0, r - 12, 0, Math.PI * 2); ctx.fillStyle = '#fbf6ea'; ctx.fill();
  ctx.strokeStyle = '#6b5a48'; ctx.lineWidth = 3;
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * (r - 22), Math.sin(a) * (r - 22)); ctx.lineTo(Math.cos(a) * (r - 34), Math.sin(a) * (r - 34)); ctx.stroke(); }
  const ang = -Math.PI / 2 + 0.1 / 60 * Math.PI * 2 * 40 * clamp(p);   // 指针只走了一小格
  ctx.strokeStyle = '#c8321f'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(ang) * (r - 30), Math.sin(ang) * (r - 30)); ctx.stroke();
  ctx.fillStyle = '#231b15'; ctx.font = '700 46px Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('0.1 秒', 0, 34);
  ctx.restore();
}

// ======================= 002 后半：错觉 =======================
const SHEET = P.poly(P.jag([[0, -40], [W + 120, -40], [W + 120, H + 40], [0, H + 40]], 8, 22, 72));
function sheetIn(ctx, t, a, draw) {
  const e = easeInOut(prog(t, a, a + 0.45));
  if (e <= 0) return false;
  ctx.save(); ctx.translate((1 - e) * (W + 60), 0);
  P.piece(ctx, SHEET, '#f6ecd7', { blur: 30, dx: -14, dy: 0, color: 'rgba(50,28,8,0.45)' });
  draw(ctx, t);
  ctx.restore();
  return e >= 1;
}
const LX0 = 720, LX1 = 1340, LY0 = 360, LY1 = 640, FIN = 70;
function mlLine(ctx, y, out) {
  ctx.save(); ctx.strokeStyle = '#231b15'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(LX0, y); ctx.lineTo(LX1, y);
  const d = out ? -1 : 1;
  for (const [x, s] of [[LX0, 1], [LX1, -1]]) { ctx.moveTo(x + d * s * FIN, y - FIN * 0.8); ctx.lineTo(x, y); ctx.lineTo(x + d * s * FIN, y + FIN * 0.8); }
  ctx.stroke(); ctx.restore();
}
function illusion(ctx, t) {
  // 小人头：一直在点头（不知不觉）
  const nod = Math.sin((t - T.cost) * 5.2) * 0.07;
  B.head(ctx, { x: 250, y: 860, h: 470, rot: nod, anchor: [0.5, 0.92] });
  const l1 = easeOut(prog(t, T.cost + 0.05, T.cost + 0.4)), l2 = easeOut(prog(t, T.cost + 0.2, T.cost + 0.55));
  ctx.save(); ctx.globalAlpha = l1; mlLine(ctx, LY0, true); ctx.globalAlpha = l2; mlLine(ctx, LY1, false); ctx.restore();
  // 标签：✓ 这条更长 → ✗
  const lab = easeOut(prog(t, T.cost + 0.45, T.cost + 0.75));
  const flip = prog(t, T.unaware - 0.3, T.unaware);
  if (lab > 0.01) {
    ctx.save(); ctx.translate(1520, LY0); ctx.globalAlpha = lab;
    const sx = Math.abs(Math.cos(flip * Math.PI));
    ctx.save(); ctx.translate(-40, -4); ctx.scale(sx, 1);
    if (flip < 0.5) C.tick(ctx, 0, 0, 74, 1);
    else { ctx.strokeStyle = '#c8321f'; ctx.lineWidth = 13; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-30, -32); ctx.lineTo(30, 32); ctx.moveTo(30, -32); ctx.lineTo(-30, 32); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = flip < 0.5 ? '#2c5e2a' : '#231b15'; ctx.font = '700 60px Sans'; ctx.textBaseline = 'middle';
    ctx.fillText('这条更长', 20, 0);
    const st = prog(t, T.unaware, T.unaware + 0.35);
    if (st > 0) { ctx.strokeStyle = '#c8321f'; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(14, 4); ctx.lineTo(14 + 250 * easeOut(st), -2); ctx.stroke(); }
    ctx.restore();
  }
  // 尺子：滑进来量上面那条，再量下面那条；两端红色竖虚线
  const rIn = easeOut(prog(t, T.often - 0.05, T.often + 0.45)), rDown = easeInOut(prog(t, T.often + 0.6, T.often + 1.05));
  if (rIn > 0.01) {
    const ry = lerp(LY0, LY1, rDown) + 42;
    const g = prog(t, T.often + 0.35, T.often + 0.6);
    if (g > 0) {
      ctx.save(); ctx.strokeStyle = '#c8321f'; ctx.lineWidth = 5; ctx.setLineDash([16, 12]);
      const yy = lerp(LY0 - 90, LY1 + 90, 1);
      for (const x of [LX0, LX1]) { ctx.beginPath(); ctx.moveTo(x, LY0 - 90); ctx.lineTo(x, lerp(LY0 - 90, yy, easeOut(g))); ctx.stroke(); }
      ctx.restore();
    }
    ruler(ctx, LX0 - 30 + (1 - rIn) * 900, ry, LX1 - LX0 + 60);
  }
}
function ruler(ctx, x, y, w) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = 'rgba(40,25,10,0.45)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#e9c77c'; ctx.fillRect(0, 0, w, 64);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(150,100,40,0.25)'; ctx.fillRect(0, 50, w, 14);
  ctx.strokeStyle = '#5a4026'; ctx.lineWidth = 3;
  for (let i = 0; i <= 64; i++) { const xx = 30 + (w - 60) * i / 64, l = i % 8 === 0 ? 30 : i % 4 === 0 ? 20 : 11; ctx.beginPath(); ctx.moveTo(xx, 0); ctx.lineTo(xx, l); ctx.stroke(); }
  ctx.fillStyle = '#c8321f'; ctx.fillRect(28, 0, 5, 64); ctx.fillRect(w - 33, 0, 5, 64);
  ctx.restore();
}

// ======================= 003：地面上的蚂蚁 + 放大镜 =======================
const GY = 690;
const SOIL = (() => {
  const cv = new Canvas(W + 400, H - GY + 60), x = cv.getContext('2d');
  const bands = [['#b88b55', 0], ['#a2733f', 70], ['#8c6034', 170], ['#774f2b', 280]];
  bands.forEach(([c, y0], i) => { const p = P.poly(P.jag([[0, y0], [W + 400, y0], [W + 400, H], [0, H]], 6, 26, 80 + i)); P.piece(x, p, c, { blur: 8, dy: -3, color: 'rgba(40,22,8,0.3)' }); });
  const r = K.mulberry32(4);
  for (let n = 0; n < 70; n++) { const px = r() * (W + 400), py = 40 + r() * 330; x.fillStyle = `rgba(${200 + r() * 40},${170 + r() * 30},${120 + r() * 30},0.8)`; x.beginPath(); x.ellipse(px, py, 6 + r() * 12, 4 + r() * 7, r() * 3, 0, Math.PI * 2); x.fill(); }
  x.strokeStyle = '#6f8a3a'; x.lineWidth = 4; x.lineCap = 'round';
  for (let n = 0; n < 160; n++) { const px = r() * (W + 400), l = 14 + r() * 26; x.beginPath(); x.moveTo(px, 6); x.quadraticCurveTo(px + (r() - 0.5) * 10, 6 - l / 2, px + (r() - 0.5) * 14, 6 - l); x.stroke(); }
  return P.bitmap(cv);
})();
const AS = 0.62, AU = 26 * AS, AN = 9, SPD = 70, GAP = 190;
const antX = (i, t) => -260 + i * GAP + SPD * (t - T.c0);
const AFOCUS = 5;
function groundScene(ctx, t) {
  ctx.drawImage(SOIL, -200, GY - 6);
  for (let i = 0; i < AN; i++) {
    const x = antX(i, t), y = GY - ANT.FOOT * AU;
    ANT.draw(ctx, t, { x, y, s: AS, pal: 'W', dir: 1, walk: x / AU * 0.9, seed: i });
  }
}
function lensPos(t) {
  const tx = antX(AFOCUS, t) + 30, ty = GY - ANT.FOOT * AU - 10;
  const e = easeInOut(prog(t, T.sci - 0.1, T.sci + 0.9));
  return [lerp(W + 300, tx, e), lerp(-260, ty, e)];
}
const LR = 175, MAG = 2.3;
function magnifier(ctx, t) {
  const [lx, ly] = lensPos(t);
  ctx.save(); ctx.beginPath(); ctx.arc(lx, ly, LR, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#f6ecd7'; ctx.fillRect(lx - LR, ly - LR, LR * 2, LR * 2);
  ctx.translate(lx, ly); ctx.scale(MAG, MAG); ctx.translate(-lx, -ly);
  groundScene(ctx, t);
  ctx.restore();
  ctx.save();
  const g = ctx.createRadialGradient(lx - 60, ly - 70, 10, lx, ly, LR);
  g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0.05)'); g.addColorStop(1, 'rgba(120,160,170,0.18)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(lx, ly, LR, 0, Math.PI * 2); ctx.fill();
  // 把手
  ctx.shadowColor = 'rgba(40,25,10,0.5)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 10;
  ctx.translate(lx, ly); ctx.rotate(-0.75);
  ctx.fillStyle = '#5b3a22'; ctx.beginPath(); ctx.roundRect(LR + 10, -26, 300, 52, 22); ctx.fill();
  ctx.fillStyle = '#9c7b45'; ctx.fillRect(LR - 4, -20, 40, 40);
  ctx.shadowColor = 'transparent';
  ctx.lineWidth = 26; ctx.strokeStyle = '#3a2a1e'; ctx.beginPath(); ctx.arc(0, 0, LR, 0, Math.PI * 2); ctx.stroke();
  ctx.lineWidth = 8; ctx.strokeStyle = '#b7924e'; ctx.beginPath(); ctx.arc(0, 0, LR - 4, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
}
function tag(ctx, x, y, text, a, ax, ay) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]); ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.quadraticCurveTo(x, ay - 40, ax, ay); ctx.stroke(); ctx.setLineDash([]);
  ctx.font = '700 62px Sans'; const w = ctx.measureText(text).width + 60;
  ctx.translate(x, y); ctx.rotate(-0.03); ctx.scale(0.8 + 0.2 * a, 0.8 + 0.2 * a);
  P.piece(ctx, P.poly(P.jag([[-w / 2, -48], [w / 2, -48], [w / 2, 48], [-w / 2, 48]], 2, 14, 90)), '#fbf6ea', { blur: 12, dy: 6 });
  ctx.fillStyle = '#231b15'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 2);
  ctx.restore();
}
function antsShot(ctx, t) {
  groundScene(ctx, t);
  tag(ctx, 470, 380, '社会性昆虫', smooth(prog(t, T.social, T.social + 0.3)) * (1 - smooth(prog(t, T.eg - 0.2, T.eg))), antX(2, t), GY - 70);
  if (t > T.sci - 0.15) magnifier(ctx, t);
}

// ======================= 012：规则卡飞进人脑 =======================
const RULES = ['IF 闻到死亡气味 → 抬出巢穴', 'IF 价格高 → 一定好', 'IF 好比较 → 就选它'];
const H2 = { x: 760, y: 1360, h: 1260 };
const SLOT = [[0.43, 0.12], [0.43, 0.26], [0.43, 0.40]];
// 蚁巢右上角那张卡的初始位置（和 s2_nest 的 ruleCard 一致：字号 46，右上角）
const NEST_CARD = (() => { const cv = new Canvas(10, 10), x = cv.getContext('2d'); x.font = C.CODE(46); const w = x.measureText(RULES[0]).width + 130; return [W - 40 - w / 2, 30 + 52]; })();
function brain2(ctx, t) {
  const inA = easeOut(prog(t, T.back - 0.05, T.back + 0.6));
  const glass = smooth(prog(t, T.back + 0.1, T.back + 0.6));
  B.head(ctx, { x: H2.x - (1 - inA) * 500, y: H2.y, h: H2.h, glass, alpha: clamp(inA * 1.4) });
}
function brain2over(ctx, t) {
  const inA = easeOut(prog(t, T.back - 0.05, T.back + 0.6));
  const map = (u, v) => CUT.pt(B.HEAD, H2.x - (1 - inA) * 500, H2.y, H2.h, u, v);
  // 警示灯（头顶）
  const warn = smooth(prog(t, T.often2 - 0.1, T.often2 + 0.2));
  const top = map(0.52, 0.0);
  if (warn > 0.01) {
    const on = (Math.floor((t - T.often2) * 6) % 2 === 0 ? 1 : 0.25) * warn;
    ctx.save(); ctx.globalAlpha = warn; B.beacon(ctx, top[0], top[1] + 10 - (1 - warn) * 60, 1.05, on); ctx.restore();
  }
  const shake = t > T.fate ? Math.sin(t * 50) * 3 * smooth(prog(t, T.fate, T.often2)) + (t > T.boom ? Math.sin(t * 70) * 6 * Math.exp(-(t - T.boom) * 3) : 0) : 0;
  RULES.forEach((s, i) => {
    const [u, v] = SLOT[i], [tx, ty] = map(u, v);
    let x = tx, y = ty, size = 42, a = 1, sc = 1;
    if (i === 0) {
      const f = easeInOut(prog(t, T.back, T.back + 0.9));
      x = lerp(NEST_CARD[0], tx, f); y = lerp(NEST_CARD[1], ty, f) - Math.sin(f * Math.PI) * 90; size = lerp(46, 42, f);
    } else {
      const ta = i === 1 ? T.many : T.simp;
      const p = easeOut(prog(t, ta, ta + 0.35)); if (p <= 0.01) return;
      a = clamp(p * 1.5); sc = 0.6 + 0.4 * p + Math.sin(clamp(p) * Math.PI) * 0.08;
      x += shake * (i === 1 ? 1 : -1);
    }
    const red = i > 0 ? smooth(prog(t, T.often2, T.often2 + 0.15)) * (0.32 + 0.3 * Math.max(0, Math.sin((t - T.often2) * 12))) : 0;
    B.ruleCard(ctx, x, y, s, size, { alpha: a, scale: sc, rot: [0.012, -0.015, 0.01][i], seed: 21 + i, tint: red, hl: i === 0 ? [3, 6, 1] : null });
  });
  // 黄黑警示带：横拉过头顶
  B.tape(ctx, 200, -0.05, prog(t, T.often2 - 0.05, T.often2 + 0.45));
}

// ======================= 合成 =======================
function camera1(t) {
  // 001 末：从队列推近人头
  const z = prog(t, T.zoomA[0], T.zoomA[1]);
  return z;
}
module.exports = {
  t0: 0, t1: T.end,
  over(ctx, t) { if (ACT2(t) && t < TL.CARD_T0) brain2over(ctx, t); },
  draw(ctx, t) {
    if (ACT2(t)) { brain2(ctx, t); if (t >= TL.CARD_T0) brain2over(ctx, t); return; }
    if (!ACT1(t)) return;
    // C 盖在 B 上，B 盖在 A 上；完全盖住以后就不画下面的
    const cover = a => t >= a + 0.45;
    const zoom = T.zoom, zc = prog(t, zoom[0], zoom[1]);
    if (zc > 0) {                                        // 003 末：推进放大镜（镜心推到屏幕中央）
      const [lx, ly] = lensPos(t);
      const e = easeIn(zc) * 0.55 + smooth(zc) * 0.45, s = Math.exp(lerp(0, Math.log(9), e));
      const cx = lerp(W / 2, lx, smooth(Math.min(1, zc * 1.8))), cy = lerp(H / 2, ly, smooth(Math.min(1, zc * 1.8)));
      ctx.save(); ctx.fillStyle = '#f6ecd7'; ctx.fillRect(0, 0, W, H);
      ctx.translate(W / 2, H / 2); ctx.scale(s, s); ctx.translate(-cx, -cy);
      antsShot(ctx, t); ctx.restore();
      return;
    }
    if (!cover(T.c0)) {
      if (!cover(T.cost)) {
        const z = camera1(t);
        if (z < 1) {                                     // A1 队列（推近人头时淡出）
          const [mx, my] = MANHEAD(), s = Math.exp(lerp(0, Math.log(5), easeIn(z)));
          ctx.save(); ctx.globalAlpha = 1 - smooth(prog(z, 0.55, 1));
          ctx.translate(lerp(0, W / 2 - mx, easeIn(z)) + mx, lerp(0, H / 2 - my, easeIn(z)) + my); ctx.scale(s, s); ctx.translate(-mx, -my);
          lineup(ctx, t); ctx.restore();
        }
        const a2 = smooth(prog(z, 0.5, 1));
        if (a2 > 0.01) {                                 // A2 大人头 + 芯片 → 水壶
          const s = lerp(0.62, 1, easeOut(prog(t, T.zoomA[0] + 0.25, T.zoomA[1] + 0.35)));
          const ox = lerp(W / 2 - HX, 0, easeInOut(prog(t, T.zoomA[1], T.zoomA[1] + 0.6)));
          ctx.save(); ctx.globalAlpha = a2; ctx.translate(HX + ox, 540); ctx.scale(s, s); ctx.translate(-HX, -540);
          const chipAt = bigHead(ctx, t);
          ctx.restore();
          kettleHand(ctx, t, [chipAt[0] + ox, chipAt[1]]);
        }
      }
      sheetIn(ctx, t, T.cost - 0.15, illusion);
    }
    sheetIn(ctx, t, T.c0, antsShot);
  },
  T,
};
