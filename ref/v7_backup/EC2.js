'use strict';
// 《ESFJ》v7 第 2 段：B04–B10「护卫者四型专场」+「每十个人一个」
// 场景：黄昏小广场上的一条摊位街（透视 3D，egenv.cam3）。四个摊位沿进深左右交错排开，中间一道「护卫者」牌楼：
//   近 → 远：ESFJ 供给者（右，补给车）/ ISFJ 保护者（左，伞）/ 牌楼 / ISTJ 检查者（右，柜台账本罐子）/ ESTJ 监管者（左，站台+一排人）
//   B04 从伞哥的补给车摇臂升起，牌楼「护卫者」亮，另三家摊位灯依次亮；守规矩：一排人走到点位、罐子摆正；安排妥当：灯串一路亮到底
//   B05 镜头穿过牌楼推到 ESTJ：吹哨，跑开的人跑回点位；她的目光扫过一排人，每人头上弹出一个勾
//   B06 拉回 ISTJ：举放大镜，先扫账本（每行打勾）再扫罐子，停在有裂纹的那只，拿开放大镜画红圈
//   B07 ISFJ：下雨，孩子缩着；她撑开伞罩住孩子，雨点打在伞上溅开；「安全」时伞下暖光亮起
//   B08 伞哥：三个人头上冒出缺的东西（面包/毛毯/热茶），他从车上一件件递过去，落到手上，人亮起来
//   B09 拉回全景：其他三家暗下去，伞哥往前一步站进聚光里，朝四周挥手，周围的人转身朝他挥手
//   B10 镜头升到高空俯瞰：广场上一排排的人冒出来（每排十个），先数第一排，伞哥亮成蓝色；接着每排都亮起一个（有的排两个）
const X = require('./ehk');
const E = require('./egenv');
const B = require('./ebw');
const MB = require('./mb');
const { K, vs, ve, at } = X;
const { W, H, clamp, lerp, mix, prog, smooth, easeInOut, easeOut, easeIn, hash, glow, rgba } = K;

// ---------- 时间（全部按句取） ----------
const T0 = vs('B04') - 0.05, T1 = vs('C01') - 0.05;
const tGuard = at('B04', '护卫者'), tFour = at('B04', '四种'), tRule = at('B04', '守规矩'), tSet = at('B04', '安排'), e4 = ve('B04');
const b5 = vs('B05'), tW = at('B05', '监管者'), tStare = at('B05', '盯着'), tDuty = at('B05', '各司其职'), e5 = ve('B05');
const b6 = vs('B06'), tChk = at('B06', '检查者'), tBook = at('B06', '账目'), tGoods = at('B06', '产品'), tFlaw = at('B06', '瑕疵'), e6 = ve('B06');
const b7 = vs('B07'), tProt = at('B07', '保护者'), tQuiet = at('B07', '默默'), tSafe = at('B07', '安全'), e7 = ve('B07');
const b8 = vs('B08'), tSup = at('B08', '供给者'), tNeed = at('B08', '大家'), tGive = at('B08', '他们就'), e8 = ve('B08');
const b9 = vs('B09'), tEasy = at('B09', '随和'), tSocial = at('B09', '交际'), e9 = ve('B09');
const b10 = vs('B10'), tMany = at('B10', '不少'), tTen = at('B10', '每十个'), tOne = at('B10', '就有'), e10 = ve('B10');
const tSign = tGuard + 0.55;                       // 牌楼进画面时亮
const tStep = b9 + 0.8;                            // 伞哥往前一步
const tOpen = tProt + 0.05;                        // 伞撑开
const tCircle = Math.max(tFlaw + 0.35, at('B06', '逃不过') - 0.1); // 红圈
const tBlue = tTen + 0.68;                         // 第一排数完，伞哥亮蓝

// ---------- 小工具 ----------
const env = (t, a, b, r = 0.2) => smooth(prog(t, a, a + r)) * (1 - smooth(prog(t, b - r, b)));
const spring = (t, t0, k = 7, f = 13) => (t < t0 ? 0 : 1 - Math.exp(-(t - t0) * k) * Math.cos((t - t0) * f));
const hop = (t, t0, d = 0.4) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * (t - t0) / d));
const bump = (t, t0, d) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * (t - t0) / d));
const nearFade = d => smooth((d - 0.5) / 0.9);
const DARK = [10, 8, 18];
const sh = (c, k) => mix(DARK, c, k);
function poly2(ctx, pts, fill, a = 1) { if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = fill; ctx.beginPath(); pts.forEach((q, i) => (i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]))); ctx.closePath(); ctx.fill(); ctx.restore(); }
function polyW(ctx, p, pts, c, a = 1) { poly2(ctx, pts.map(q => p(q[0], q[1], q[2])), typeof c === 'string' ? c : rgba(c), a); }
// 盒子：只画朝镜头的面（前/侧/顶），各面明暗不同
function box(ctx, p, x0, x1, y0, y1, z0, z1, c, a = 1, o = {}) {
  const { top = 1, front = 0.82, side = 0.66 } = o;
  if (p.x0 < x0) polyW(ctx, p, [[x0, y0, z0], [x0, y1, z0], [x0, y1, z1], [x0, y0, z1]], sh(c, side), a);
  if (p.x0 > x1) polyW(ctx, p, [[x1, y0, z0], [x1, y1, z0], [x1, y1, z1], [x1, y0, z1]], sh(c, side), a);
  if (p.z0 < z0) polyW(ctx, p, [[x0, y0, z0], [x1, y0, z0], [x1, y1, z0], [x0, y1, z0]], sh(c, front), a);
  if (p.h > y1) polyW(ctx, p, [[x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]], sh(c, top), a);
}
const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

// ---------- 实物图标（泡泡里 / 车上 / 飞出去的东西） ----------
function iconBread(ctx, x, y, w, a = 1) {
  if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  const g = ctx.createLinearGradient(0, -w * 0.3, 0, w * 0.3); g.addColorStop(0, '#f6c172'); g.addColorStop(1, '#a35a26');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.5, w * 0.28, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,232,186,0.9)'; ctx.lineWidth = w * 0.055; ctx.lineCap = 'round';
  for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * w * 0.22 - w * 0.07, -w * 0.13); ctx.lineTo(i * w * 0.22 + w * 0.05, w * 0.11); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.beginPath(); ctx.ellipse(-w * 0.16, -w * 0.15, w * 0.2, w * 0.06, -0.2, 0, 7); ctx.fill();
  ctx.restore();
}
function iconBlanket(ctx, x, y, w, a = 1) {
  if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  for (const k of [1, 0]) {
    const yy = k * w * 0.2 - w * 0.12, c0 = k ? '#b8463f' : '#e0705a';
    ctx.fillStyle = c0; rr(ctx, -w * 0.46, yy - w * 0.15, w * 0.92, w * 0.3, w * 0.1); ctx.fill();
    ctx.save(); rr(ctx, -w * 0.46, yy - w * 0.15, w * 0.92, w * 0.3, w * 0.1); ctx.clip();
    ctx.fillStyle = 'rgba(255,236,206,0.55)'; for (const sx of [-0.28, 0.02, 0.3]) ctx.fillRect(sx * w, yy - w * 0.15, w * 0.06, w * 0.3);
    ctx.fillStyle = 'rgba(60,10,10,0.25)'; ctx.fillRect(-w * 0.46, yy - w * 0.02, w * 0.92, w * 0.05);
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-w * 0.46, yy - w * 0.15, w * 0.92, w * 0.07);
    ctx.restore();
  }
  ctx.restore();
}
function iconCup(ctx, x, y, w, a = 1, t = 0) {
  if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y + w * 0.08);
  ctx.strokeStyle = '#d9d2c4'; ctx.lineWidth = w * 0.08; ctx.beginPath(); ctx.arc(w * 0.27, 0, w * 0.13, -1.3, 1.3); ctx.stroke();
  const g = ctx.createLinearGradient(-w * 0.28, 0, w * 0.28, 0); g.addColorStop(0, '#fffaf0'); g.addColorStop(1, '#c7bba6');
  ctx.fillStyle = g; rr(ctx, -w * 0.28, -w * 0.22, w * 0.52, w * 0.44, w * 0.08); ctx.fill();
  ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.ellipse(-w * 0.02, -w * 0.21, w * 0.24, w * 0.05, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = w * 0.06; ctx.lineCap = 'round';
  for (const sx of [-0.1, 0.08]) { ctx.beginPath(); for (let i = 0; i <= 10; i++) { const u = i / 10, yy = -w * 0.3 - u * w * 0.36; ctx[i ? 'lineTo' : 'moveTo'](sx * w + Math.sin(u * 5 + t * 4 + sx * 9) * w * 0.05, yy); } ctx.stroke(); }
  ctx.restore();
}
const ICON = { bread: iconBread, blanket: iconBlanket, cup: iconCup };
// 勾章：青色圆片 + 白色粗勾
function checkBadge(ctx, x, y, r, a) {
  if (a <= 0.003) return;
  glow(ctx, x, y, r * 2.6, [120, 230, 220], 0.35 * a);
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r); g.addColorStop(0, '#9cf3e6'); g.addColorStop(1, '#2a9d97');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.26; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x - r * 0.45, y + r * 0.02); ctx.lineTo(x - r * 0.1, y + r * 0.36); ctx.lineTo(x + r * 0.48, y - r * 0.34); ctx.stroke();
  ctx.restore();
}

// ---------- 镜头 ----------
// [时间, x0, h, z0, pitch, cy]
const CK = [
  [T0, 0.55, 1.55, 2.05, 0.02, 560],
  [tGuard - 0.15, 0.55, 1.6, 2.6, 0.03, 560],
  [tGuard + 1.5, 0.15, 2.5, 0.2, 0.07, 580],
  [e4, 0.05, 2.35, 1.1, 0.06, 570],
  [b5 + 0.75, -0.72, 1.75, 12.15, 0.03, 540],
  [e5, -0.76, 1.72, 12.5, 0.03, 540],
  [b6 + 0.75, 0.72, 1.95, 9.0, 0.25, 470],
  [e6, 0.78, 1.9, 9.3, 0.25, 470],
  [b7 + 0.65, -0.45, 1.45, 6.35, 0.02, 520],
  [e7, -0.5, 1.45, 6.6, 0.02, 520],
  [b8 + 0.65, 0.45, 1.45, 2.7, 0.02, 500],
  [e8, 0.48, 1.45, 2.95, 0.02, 500],
  [b9 + 0.7, 0.15, 2.5, 0.0, 0.08, 580],
  [tStep + 0.5, 0.2, 2.45, 0.3, 0.075, 575],
  [e9, 0.7, 2.0, 1.6, 0.05, 560],
  [b10 + 1.5, 0.6, 15, 2.8, 0.9, 680],
  [T1, 0.6, 16.5, 2.3, 0.92, 680],
];
function camAt(t) {
  let i = 0; while (i < CK.length - 2 && t >= CK[i + 1][0]) i++;
  const A = CK[i], Bk = CK[i + 1], d = Bk[0] - A[0], u0 = clamp((t - A[0]) / d), u = d > 2.2 ? lerp(u0, smooth(u0), 0.35) : easeInOut(u0);
  const v = k => lerp(A[k], Bk[k], u);
  return E.cam3({ cx: W / 2, cy: v(5), f: 1000, h: v(2), z0: v(3), x0: v(1), pitch: v(4) });
}

// ---------- 世界布置 ----------
const BOOTH = {
  esfj: { side: 1, Z: 6, col: [232, 160, 76], plate: '供给者', type: 'ESFJ' },
  isfj: { side: -1, Z: 9, col: [206, 104, 108], plate: '保护者', type: 'ISFJ' },
  istj: { side: 1, Z: 12, col: [96, 128, 186], plate: '检查者', type: 'ISTJ' },
  estj: { side: -1, Z: 15, col: [70, 162, 172], plate: '监管者', type: 'ESTJ' },
};
const ORDER = ['estj', 'istj', 'isfj', 'esfj'];
const lampOn = (k, t) => (k === 'esfj' ? smooth(prog(t, T0, T0 + 0.4)) : spring(t, tFour - 0.1 + ORDER.indexOf(k) * 0.3, 9, 18) * (0.92 + 0.08 * Math.sin(t * 7 + ORDER.indexOf(k))));
const dimOthers = t => smooth(prog(t, tStep - 0.1, tStep + 0.6));
const structA = t => 1 - smooth(prog(t, b10 + 0.15, b10 + 1.0));   // B10 升空时摊位、牌楼淡出
const HERO0 = [1.35, 6.3], HERO1 = [0.9, 4.9];
const QZ = 17.6, QUEUE = [['infj-female', -0.62], ['esfp-female', 0.05], ['entp-male', 0.72], ['intj-male', 1.39], ['enfj-female', 2.06]];
const RECV = [{ k: 'infp-female', X: -0.37, Z: 6.1, it: 'bread' }, { k: 'intp-male', X: -1.42, Z: 7.5, it: 'blanket' }, { k: 'enfp-male', X: 0.05, Z: 8.7, it: 'cup' }];
const COLS = 10, ROWS = 14, CX = i => 0.9 + 1.3 * (i - 5), RZ = k => 3.2 + 1.7 * k;
const FOLK = [{ k: 'enfj-female', c: 3, r: 1 }, { k: 'isfp-female', c: 4, r: 1 }, { k: 'esfp-male', c: 6, r: 1 }, { k: 'entj-female', c: 7, r: 1 }];
const NOT_E = MB.ALL.filter(k => !k.startsWith('esfj'));
const BLUE = [110, 196, 255];
// 每排的蓝色的人：第 1 排就是伞哥；每三排多一个
const CROWD = [];
for (let r = -3; r < ROWS; r++) {
  const c1 = r === 1 ? 5 : Math.floor(hash(r * 7.31 + 2) * COLS), c2 = ((r % 3) + 3) % 3 === 2 ? (c1 + 3 + Math.floor(hash(r * 3.7) * 4)) % COLS : -1;
  for (let c = 0; c < COLS; c++) {
    const blue = c === c1 || c === c2;
    const f = FOLK.find(q => q.c === c && q.r === r);
    CROWD.push({ c, r, X: CX(c) + (hash(c * 1.7 + r * 9.1) - 0.5) * 0.25, Z: RZ(r) + (hash(c * 5.3 + r * 2.9) - 0.5) * 0.3, blue, hero: r === 1 && c === 5, folk: f || null,
      k: f ? f.k : blue ? (hash(c + r * 3) > 0.5 ? 'esfj-female' : 'esfj-male') : NOT_E[Math.floor(hash(c * 13.1 + r * 7.7) * NOT_E.length)],
      tp: b10 + 0.1 + (r + 3) * 0.06 + hash(c * 2.3 + r) * 0.18, flip: hash(c * 4.1 + r * 1.3) > 0.5 });
  }
}
for (const q of FOLK) { const g = CROWD.find(o => o.c === q.c && o.r === q.r); g.X = CX(q.c); g.Z = RZ(q.r); }
const rowBlueT = r => (r === 1 ? tBlue : tOne + 0.05 + (r + 3) * 0.05 + hash(r * 8.8 + 30) * 0.05);

// 远景楼群（一次生成）
const CITY = [];
for (let i = 0; i < 46; i++) {
  const X0 = -80 + i * 3.6 + hash(i * 3.1) * 1.5, w = 2.4 + hash(i * 1.7) * 3.2, h = 7 + hash(i * 5.5) * 22 * (0.5 + 0.5 * Math.cos(i * 0.21)), Z = 82 + hash(i * 2.2) * 14;
  CITY.push({ X0, X1: X0 + w, h, Z, near: false });
}
for (let i = 0; i < 12; i++) { const s = i % 2 ? 1 : -1, X0 = s * (11 + hash(i * 4.4) * 14), w = 4 + hash(i * 6.1) * 4, Z = 44 + i * 3.4; CITY.push({ X0: Math.min(X0, X0 + s * w), X1: Math.max(X0, X0 + s * w), h: 12 + hash(i * 9.3) * 16, Z, near: true }); }
const TREES = []; for (const s of [-1, 1]) for (let i = 0; i < 6; i++) TREES.push({ X: s * (5.0 + hash(i * 3.3 + s) * 1.8), Z: 4 + i * 6.2 + hash(i * 7 + s) * 2, r: 1.1 + hash(i * 2.1 + s) * 0.5 });
const POSTS = [2, 8, 14, 20, 26, 32];

// ---------- 背景：天、城、雾、地 ----------
function backdrop(ctx, p, t, rainA) {
  const hz = p.cy - p.f * Math.tan(p.pitch);
  const g = ctx.createLinearGradient(0, hz - 1300, 0, hz + 40);
  g.addColorStop(0, '#0f1230'); g.addColorStop(0.45, '#2a2552'); g.addColorStop(0.78, '#7a4c78'); g.addColorStop(0.93, '#e08a68'); g.addColorStop(1, '#f6b47a');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (hz > -200) {
    glow(ctx, W * 0.32 - p.x0 * 6, hz + 10, 700, [255, 150, 100], 0.45);
    glow(ctx, W * 0.32 - p.x0 * 6, hz + 10, 240, [255, 210, 160], 0.4);
    // 晚霞云带（厚的柔光带）
    for (let i = 0; i < 5; i++) { const y = hz - 120 - i * 95 - hash(i) * 40, x = (hash(i * 3) * W * 1.4 - W * 0.2 - p.x0 * 20 + t * 4) % (W * 1.6) - W * 0.3; ctx.save(); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); cg.addColorStop(0, `rgba(255,170,150,${0.13 - i * 0.018})`); cg.addColorStop(1, 'rgba(255,170,150,0)'); ctx.translate(x, y); ctx.scale(520 + hash(i * 5) * 300, 34 + hash(i * 7) * 20); ctx.fillStyle = cg; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 7); ctx.fill(); ctx.restore(); }
    // 星星
    for (let i = 0; i < 40; i++) { const x = hash(i * 1.9) * W, y = hz - 500 - hash(i * 4.3) * 1400; if (y < -10) continue; ctx.fillStyle = `rgba(255,250,235,${0.25 + 0.35 * Math.sin(t * 1.6 + i)})`; ctx.beginPath(); ctx.arc(x, y, 1.6 + hash(i) * 1.4, 0, 7); ctx.fill(); }
  }
  // 楼群：远处一排剪影 + 两侧近一点的高楼，窗光是柔光点
  for (const b of CITY.slice().sort((a, b2) => b2.Z - a.Z)) {
    if (p.depth(b.Z) < 2) continue;
    const c = b.near ? [30, 26, 48] : mix([44, 36, 72], [150, 96, 120], 0.35);
    const A = p(b.X0, b.h, b.Z), Bp = p(b.X1, 0, b.Z);
    if (Bp[0] < -50 || A[0] > W + 50) continue;
    const gg = ctx.createLinearGradient(0, A[1], 0, Bp[1]); gg.addColorStop(0, rgba(mix(c, [190, 120, 140], b.near ? 0.12 : 0.25))); gg.addColorStop(1, rgba(sh(c, 0.7)));
    poly2(ctx, [A, [Bp[0], A[1]], Bp, [A[0], Bp[1]]], gg);
    const fl = Math.floor(b.h / 2.8), cols = Math.max(1, Math.floor((b.X1 - b.X0) / 1.3));
    for (let f = 0; f < fl; f++) for (let k = 0; k < cols; k++) {
      const hh = hash(b.X0 * 3.1 + f * 7.7 + k * 1.3); if (hh < 0.58) continue;
      const q = p(b.X0 + (k + 0.5) * (b.X1 - b.X0) / cols, 1.6 + f * 2.8, b.Z), r = Math.max(1.6, p.px(b.Z, 0.38));
      const on = 0.5 + 0.5 * Math.sin(t * 0.5 + hh * 40);
      glow(ctx, q[0], q[1], r * 4, [255, 196, 120], 0.12 * on); ctx.fillStyle = rgba([255, 214, 150], 0.55 + 0.3 * on); ctx.beginPath(); ctx.ellipse(q[0], q[1], r * 0.8, r, 0, 0, 7); ctx.fill();
    }
  }
  // 地平线薄雾
  if (hz > -300 && hz < H + 300) { const fg = ctx.createLinearGradient(0, hz - 220, 0, hz + 260); fg.addColorStop(0, 'rgba(200,130,140,0)'); fg.addColorStop(0.5, 'rgba(190,120,130,0.32)'); fg.addColorStop(1, 'rgba(60,40,70,0)'); ctx.fillStyle = fg; ctx.fillRect(0, hz - 220, W, 480); }
  // 地面：石板（每块略有色差、留缝）
  const zn = p.z0 + (0.5 - p.h * Math.sin(p.pitch)) / Math.cos(p.pitch);
  polyW(ctx, p, [[-60, 0, zn], [60, 0, zn], [60, 0, 130], [-60, 0, 130]], [46, 38, 54]);
  const wet = rainA;
  for (let Z = Math.max(-7.2, Math.ceil(zn / 0.9) * 0.9); Z < 34; Z += 0.9) {
    const d = p.depth(Z); if (d < 0.4) continue;
    for (let Xg = -7.2; Xg < 7.2; Xg += 0.9) {
      const hv = hash(Xg * 3.7 + Z * 1.9), c = E.fogC(mix([66, 56, 68], [92, 78, 86], hv * 0.6 + (Math.abs(Xg) < 0.9 ? 0.25 : 0)), Z, p, [70, 50, 70], 34);
      polyW(ctx, p, [[Xg + 0.04, 0, Z + 0.04], [Xg + 0.86, 0, Z + 0.04], [Xg + 0.86, 0, Z + 0.86], [Xg + 0.04, 0, Z + 0.86]], mix(c, [90, 100, 130], wet * 0.25));
    }
  }
  return hz;
}
function tree(ctx, p, tr, t, a) {
  const d = p.depth(tr.Z); if (d < 1) return; a *= nearFade(d);
  const base = p(tr.X, 0, tr.Z), top = p(tr.X, 2.6, tr.Z), R = p.px(tr.Z, tr.r);
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = rgba(E.fogC([40, 28, 26], tr.Z, p, [60, 44, 64], 40)); ctx.lineWidth = Math.max(2, p.px(tr.Z, 0.16)); ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const ox = (hash(i * 3 + tr.Z) - 0.5) * R * 0.9, oy = -R * 0.55 - hash(i * 7 + tr.X) * R * 0.6, r = R * (0.6 + hash(i * 5 + tr.Z) * 0.35);
    const g = ctx.createRadialGradient(top[0] + ox - r * 0.3 * Math.sign(tr.X), top[1] + oy - r * 0.35, r * 0.1, top[0] + ox, top[1] + oy, r);
    g.addColorStop(0, rgba(E.fogC([96, 92, 74], tr.Z, p, [80, 60, 80], 40))); g.addColorStop(1, rgba(E.fogC([22, 30, 34], tr.Z, p, [60, 44, 64], 40)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(top[0] + ox, top[1] + oy, r, 0, 7); ctx.fill();
  }
  ctx.restore();
}
function lamppost(ctx, p, X0, Z, t, a) {
  const d = p.depth(Z); if (d < 0.8) return; a *= nearFade(d); if (a <= 0.01) return;
  const on = smooth(prog(t, T0 + 0.05 + Z * 0.012, T0 + 0.35 + Z * 0.012));
  ctx.save(); ctx.globalAlpha *= a;
  const b0 = p(X0, 0, Z), b1 = p(X0, 3.6, Z), w = Math.max(2, p.px(Z, 0.11));
  const g = ctx.createLinearGradient(b0[0] - w, 0, b0[0] + w, 0); g.addColorStop(0, '#15121c'); g.addColorStop(0.5, '#3a3240'); g.addColorStop(1, '#100c14');
  ctx.fillStyle = g; ctx.fillRect(b1[0] - w / 2, b1[1], w, b0[1] - b1[1]);
  const lw = p.px(Z, 0.34), lh = p.px(Z, 0.42);
  ctx.fillStyle = '#1c1820'; rr(ctx, b1[0] - lw / 2, b1[1] - lh, lw, lh, lw * 0.2); ctx.fill();
  ctx.fillStyle = rgba(mix([80, 60, 50], [255, 220, 160], on)); rr(ctx, b1[0] - lw * 0.36, b1[1] - lh * 0.86, lw * 0.72, lh * 0.72, lw * 0.12); ctx.fill();
  ctx.restore();
  if (on > 0.02) { glow(ctx, b1[0], b1[1] - lh / 2, lw * 5, E.WARM, 0.35 * on * a); E.pool(ctx, p, X0, Z, 2.2, E.WARM, 0.2 * on * a); }
}
function arch(ctx, p, t, a) {
  const Z = 10.5, d = p.depth(Z); if (d < 0.9) return; a *= nearFade(d - 0.3); if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  const stone = [96, 70, 72];
  for (const s of [-1, 1]) { box(ctx, p, s * 3.05 - 0.2, s * 3.05 + 0.2, 0, 4.4, Z - 0.2, Z + 0.2, stone); box(ctx, p, s * 3.05 - 0.28, s * 3.05 + 0.28, 0, 0.5, Z - 0.28, Z + 0.28, sh(stone, 0.8)); }
  box(ctx, p, -3.45, 3.45, 4.4, 4.82, Z - 0.26, Z + 0.26, [120, 64, 56]);
  box(ctx, p, -3.6, 3.6, 4.82, 4.95, Z - 0.34, Z + 0.34, [70, 44, 42]);
  // 横梁前的灯泡
  const lit = smooth(prog(t, tSign - 0.4, tSign + 0.5));
  for (let i = 0; i < 15; i++) { const u = i / 14, q = p(lerp(-3.3, 3.3, u), 4.6, Z - 0.27), r = Math.max(1.5, p.px(Z, 0.05)); E.bulb(ctx, q[0], q[1], r, E.CANDLE, smooth(prog(lit, u * 0.6, u * 0.6 + 0.3)) * (0.85 + 0.15 * Math.sin(t * 4 + i))); }
  // 吊链 + 牌匾「护卫者」
  const sA = p(-1.25, 4.16, Z - 0.03), sB = p(1.25, 3.5, Z - 0.03);
  for (const s of [-1, 1]) { const q0 = p(s * 1.0, 4.4, Z), q1 = p(s * 1.0, 4.16, Z); ctx.strokeStyle = '#2a2026'; ctx.lineWidth = Math.max(1.5, p.px(Z, 0.03)); ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); }
  const sw = sB[0] - sA[0], sh2 = sB[1] - sA[1], sg = smooth(prog(t, tSign, tSign + 0.6));
  ctx.fillStyle = '#2a1712'; rr(ctx, sA[0] - sw * 0.03, sA[1] - sh2 * 0.06, sw * 1.06, sh2 * 1.12, sw * 0.04); ctx.fill();
  const pg = ctx.createLinearGradient(0, sA[1], 0, sB[1]); pg.addColorStop(0, rgba(mix([80, 30, 30], [170, 50, 44], sg))); pg.addColorStop(1, rgba(mix([50, 18, 20], [110, 28, 28], sg)));
  ctx.fillStyle = pg; rr(ctx, sA[0], sA[1], sw, sh2, sw * 0.03); ctx.fill();
  ctx.strokeStyle = rgba([230, 186, 100], 0.5 + 0.5 * sg); ctx.lineWidth = Math.max(1.5, sw * 0.012); rr(ctx, sA[0] + sw * 0.03, sA[1] + sh2 * 0.08, sw * 0.94, sh2 * 0.84, sw * 0.02); ctx.stroke();
  ctx.restore();
  const cx = (sA[0] + sB[0]) / 2, cy = (sA[1] + sB[1]) / 2, fs = sh2 * 0.6;
  if (sg > 0) glow(ctx, cx, cy, sw * 0.8, [255, 200, 110], 0.28 * sg * a);
  const chars = ['护', '卫', '者'];
  chars.forEach((ch, i) => { const u = smooth(prog(t, tSign + i * 0.12, tSign + i * 0.12 + 0.35)); K.text(ctx, ch, cx + (i - 1) * fs * 1.25, cy + fs * 0.36, { size: fs, weight: 800, color: mix([150, 110, 70], [255, 222, 140], u), alpha: a }); });
}
function strings(ctx, p, t, a) {
  for (let j = 0; j < 4; j++) {
    const Z = 2 + j * 6; if (p.depth(Z) < 1.2) continue;
    const on = (i, u) => smooth(prog(t, tSet - 0.25 + j * 0.16 + u * 0.3, tSet - 0.05 + j * 0.16 + u * 0.3)) * a;
    ctx.save(); ctx.globalAlpha *= a * nearFade(p.depth(Z)); E.bulbs(ctx, p, [-3.3, 3.55, Z], [3.3, 3.55, Z + 3], 16, 0.55, t, on); ctx.restore();
  }
}

// 近景道具：木箱堆、花盆（远景镜头的前景，压暗）
function crates(ctx, p, t, a) {
  const d = p.depth(3.3); if (d < 0.7) return; a *= nearFade(d); if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  const wd = [110, 74, 50];
  box(ctx, p, -1.75, -1.1, 0, 0.55, 3.0, 3.6, sh(wd, 0.55));
  box(ctx, p, -1.65, -1.2, 0.55, 0.95, 3.1, 3.5, sh(wd, 0.62));
  for (const y of [0.18, 0.37]) E.seg(ctx, p, [-1.75, y, 3.0], [-1.1, y, 3.0], sh([40, 26, 18], 0.8), 0.7, Math.max(1.5, p.px(3.0, 0.025)));
  // 花盆 + 一丛花
  const q = p(-0.72, 0, 3.4), r = p.px(3.4, 0.26);
  const g = ctx.createLinearGradient(q[0] - r, 0, q[0] + r, 0); g.addColorStop(0, '#5a2e22'); g.addColorStop(0.5, '#a3583a'); g.addColorStop(1, '#3a1c16');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(q[0] - r, q[1] - r * 1.4); ctx.lineTo(q[0] + r, q[1] - r * 1.4); ctx.lineTo(q[0] + r * 0.75, q[1]); ctx.lineTo(q[0] - r * 0.75, q[1]); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 9; i++) { const an = -Math.PI * (0.1 + 0.8 * hash(i * 3.3)), rr2 = r * (0.5 + 0.7 * hash(i * 1.1)), x = q[0] + Math.cos(an) * rr2 * 1.3, y = q[1] - r * 1.4 + Math.sin(an) * rr2; ctx.fillStyle = rgba(sh([60, 96, 70], 0.7)); ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 7); ctx.fill(); }
  for (let i = 0; i < 7; i++) { const an = -Math.PI * (0.15 + 0.7 * hash(i * 5.3)), rr2 = r * (0.7 + 0.6 * hash(i * 2.1)), x = q[0] + Math.cos(an) * rr2 * 1.2, y = q[1] - r * 1.5 + Math.sin(an) * rr2; glow(ctx, x, y, r * 0.35, [255, 170, 150], 0.25); ctx.fillStyle = rgba([255, 190, 170], 0.9); ctx.beginPath(); ctx.arc(x, y, r * 0.11, 0, 7); ctx.fill(); }
  ctx.restore();
}

// ---------- 摊位 ----------
function boothBack(ctx, p, b, t, L) {
  const s = b.side, xb = s * 3.0, z0 = b.Z - 0.85, z1 = b.Z + 0.85, wood = sh([120, 78, 54], 0.4 + 0.6 * L);
  polyW(ctx, p, [[xb, 0, z0], [xb, 2.75, z0], [xb, 2.75, z1], [xb, 0, z1]], wood);
  for (let i = 1; i < 6; i++) { const y = i * 0.45; E.seg(ctx, p, [xb, y, z0], [xb, y, z1], sh([60, 36, 26], 0.5 + 0.5 * L), 0.6, Math.max(1, p.px(b.Z, 0.02))); }
  polyW(ctx, p, [[xb, 0, z1], [s * 1.9, 0, z1], [s * 1.9, 2.6, z1], [xb, 2.75, z1]], sh([104, 68, 48], 0.35 + 0.5 * L));
  // 后墙上的招牌（门牌：型号 + 岗位）
  const q = p(xb - s * 0.02, 2.2, b.Z), wpx = p.px(b.Z, 0.95), hpx = wpx * 0.46;
  ctx.save(); ctx.fillStyle = rgba(sh([40, 26, 22], 1)); rr(ctx, q[0] - wpx / 2 - 4, q[1] - hpx / 2 - 4, wpx + 8, hpx + 8, hpx * 0.18); ctx.fill();
  const pg = ctx.createLinearGradient(0, q[1] - hpx / 2, 0, q[1] + hpx / 2); pg.addColorStop(0, rgba(sh(mix(b.col, [255, 240, 210], 0.35), 0.3 + 0.7 * L))); pg.addColorStop(1, rgba(sh(b.col, 0.25 + 0.6 * L)));
  ctx.fillStyle = pg; rr(ctx, q[0] - wpx / 2, q[1] - hpx / 2, wpx, hpx, hpx * 0.15); ctx.fill(); ctx.restore();
  K.text(ctx, b.type, q[0], q[1] - hpx * 0.08, { size: hpx * 0.3, family: 'Latin', weight: 700, spacing: 0.15, color: sh([40, 24, 20], 0.5 + 0.5 * L) });
  K.text(ctx, b.plate, q[0], q[1] + hpx * 0.34, { size: hpx * 0.38, weight: 800, spacing: 0.1, color: sh([255, 250, 236], 0.3 + 0.7 * L) });
  if (L > 0.05) glow(ctx, q[0], q[1], wpx * 0.9, mix(b.col, [255, 220, 160], 0.5), 0.16 * L);
}
function boothFront(ctx, p, b, t, L) {
  const s = b.side, xf = s * 1.05, xb = s * 3.0, z0 = b.Z - 0.85, z1 = b.Z + 0.85, n = 7, under = p.h < 2.4;
  // 篷顶挑出来的斜撑（不挡人）
  for (const zz of [z0 + 0.05, z1 - 0.05]) { const a0 = p(xb, 1.7, zz), a1 = p(s * 1.6, 2.5, zz); ctx.strokeStyle = rgba(sh([70, 46, 34], 0.5 + 0.5 * L)); ctx.lineWidth = Math.max(2, p.px(zz, 0.06)); ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke(); }
  // 条纹篷顶
  for (let i = 0; i < n; i++) {
    const za = lerp(z0, z1, i / n), zb = lerp(z0, z1, (i + 1) / n), c = i % 2 ? [246, 232, 206] : b.col;
    polyW(ctx, p, [[xf, 2.35, za], [xb, 2.78, za], [xb, 2.78, zb], [xf, 2.35, zb]], sh(c, (under ? 0.45 : 0.85) * (0.35 + 0.65 * L)));
  }
  // 前沿的花边（朝街，被灯照亮）
  for (let i = 0; i < n; i++) {
    const za = lerp(z0, z1, i / n), zb = lerp(z0, z1, (i + 1) / n), c = i % 2 ? [250, 238, 214] : b.col;
    polyW(ctx, p, [[xf, 2.37, za], [xf, 2.37, zb], [xf, 2.15, zb], [xf, 2.05, (za + zb) / 2], [xf, 2.15, za]], sh(c, 0.4 + 0.6 * L));
  }
  // 吊灯
  const lq = p(s * 1.25, 2.05, b.Z), r = Math.max(2, p.px(b.Z, 0.06));
  ctx.strokeStyle = '#1a1214'; ctx.lineWidth = Math.max(1, r * 0.25); const lq0 = p(s * 1.25, 2.3, b.Z); ctx.beginPath(); ctx.moveTo(lq0[0], lq0[1]); ctx.lineTo(lq[0], lq[1]); ctx.stroke();
  E.bulb(ctx, lq[0], lq[1], r, E.CANDLE, L);
  if (L > 0.02) { const fl = p(s * 1.3, 0, b.Z); E.cone(ctx, lq[0], lq[1], fl[1], r * 2, p.px(b.Z, 1.8), E.WARM, 0.07 * L); }
}
const boothLight = (b, t) => { const k = Object.keys(BOOTH).find(q => BOOTH[q] === b); return lampOn(k, t) * (k === 'esfj' ? 1 : 1 - 0.7 * dimOthers(t)); };

// ---------- 人物 ----------
function litPerson(ctx, p, key, X0, Z, o, L, lx) {
  const d = p.depth(Z); if (d < 0.4) return null;
  const a = (o.a == null ? 1 : o.a) * nearFade(d); if (a < 0.01) return null;
  const oo = Object.assign({}, o, { a });
  if (!lx) return E.folk3(ctx, p, key, X0, Z, oo);
  const q = p(lx[0], lx[1], lx[2]);
  return E.lit(ctx, c => E.folk3(c, p, key, X0, Z, oo), { x: q[0], y: q[1], r: p.px(Z, 3.4), c: E.WARM, k: 0.26 * L, amb: 0.42 });
}
// 走路：分段 [[t, X, Z], ...]
function route(t, keys) {
  if (t <= keys[0][0]) return { X: keys[0][1], Z: keys[0][2], mv: false };
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) { const [ta, xa, za] = keys[i - 1], [tb, xb, zb] = keys[i], u = easeInOut(prog(t, ta, tb)); return { X: lerp(xa, xb, u), Z: lerp(za, zb, u), mv: xa !== xb || za !== zb, dir: Math.sign(xb - xa) }; }
  const k = keys[keys.length - 1]; return { X: k[1], Z: k[2], mv: false };
}
const gait = (t, mv, hz = 2.6) => (mv ? Math.abs(Math.sin(t * hz * Math.PI)) * 0.05 : 0);

// ---------- 每个摊位的戏 ----------
// ESTJ：站台 + 一排人
function qPos(i, t) {
  const [, Xs] = QUEUE[i], sx = Xs + (hash(i * 3.3) - 0.5) * 1.1, sz = QZ + (hash(i * 5.1) - 0.5) * 1.8 + 0.4;
  const t0 = tRule - 0.15 + i * 0.12, keys = [[t0, sx, sz], [t0 + 0.75, Xs, QZ]];
  if (i === 2) keys.push([b5 - 0.2, Xs, QZ], [b5 + 0.6, Xs + 0.4, QZ + 1.0], [tW + 0.12, Xs + 0.4, QZ + 1.0], [tW + 0.75, Xs, QZ]);
  const r = route(t, keys); r.flip = i === 2 && t > b5 - 0.2 && t < tW + 0.12 ? false : true;
  if (r.mv && r.dir) r.flip = r.dir < 0;
  return r;
}
const scanT = i => lerp(tStare + 0.05, tDuty + 0.25, i / 4);
function sceneESTJ(ctx, p, t, L, A) {
  const b = BOOTH.estj, Z = b.Z;
  box(ctx, p, -1.85, -0.9, 0, 0.35, Z - 0.45, Z + 0.45, sh([120, 82, 58], 0.4 + 0.6 * L));
  polyW(ctx, p, [[-1.85, 0.351, Z - 0.45], [-0.9, 0.351, Z - 0.45], [-0.9, 0.351, Z - 0.3], [-1.85, 0.351, Z - 0.3]], sh(b.col, 0.4 + 0.6 * L));
  const blow = env(t, tW - 0.05, tW + 0.55, 0.08);
  const o = litPerson(ctx, p, 'estj-female', -1.35, Z, { Y: 0.35, bob: hop(t, tW - 0.12, 0.25) * p.px(Z, 0.04), a: A, dim: 0.6 * dimOthers(t) }, L, [-1.2, 2.05, Z]);
  if (!o) return null;
  const hh = p.px(Z, 1.7), wx = o.head[0] + hh * 0.13, wy = o.head[1] + hh * 0.07;
  X.whistle(ctx, wx, wy, hh * 0.028, -0.15, A * smooth(prog(t, tW - 0.6, tW - 0.35)) * (1 - smooth(prog(t, tW + 0.9, tW + 1.2))), blow);
  // 哨声：厚的柔光波朝一排人推出去
  if (blow > 0 || (t > tW && t < tW + 1.0)) for (let k = 0; k < 3; k++) {
    const u = prog(t, tW + k * 0.12, tW + 0.75 + k * 0.12); if (u <= 0 || u >= 1) continue;
    const R = hh * (0.1 + u * 0.9), aa = (1 - u) * 0.55 * A;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (const [lw, la] of [[hh * 0.06, 0.18], [hh * 0.025, 0.5]]) { ctx.strokeStyle = rgba([210, 250, 240], aa * la); ctx.lineWidth = lw; ctx.beginPath(); ctx.arc(wx + hh * 0.04, wy, R, -0.55, 0.55); ctx.stroke(); }
    ctx.restore();
  }
  return { o, hh };
}
function sceneQueue(ctx, p, t, A, est) {
  const items = [];
  for (let i = 0; i < 5; i++) {
    const r = qPos(i, t), d = p.depth(r.Z); if (d < 0.4) continue;
    items.push({ d, f: () => {
      // 点位：地上的青色光斑，人站上去、被勾过之后更亮
      const ck = smooth(prog(t, scanT(i), scanT(i) + 0.3));
      E.pool(ctx, p, QUEUE[i][1], QZ, 0.42, [110, 230, 220], (0.22 + 0.4 * ck) * A * smooth(prog(t, tRule - 0.4, tRule + 0.4)));
      const startle = i === 2 ? hop(t, tW + 0.02, 0.3) : 0;
      const o = litPerson(ctx, p, QUEUE[i][0], r.X, r.Z, { flip: r.flip, bob: (gait(t, r.mv) + startle * 0.12 + hop(t, scanT(i), 0.3) * 0.04) * p.px(r.Z, 1), a: A, dim: 0.55 * dimOthers(t) }, 1, null);
      if (!o) return;
      const hh = p.px(r.Z, 1.7);
      checkBadge(ctx, o.top[0], o.top[1] - hh * 0.16, hh * 0.09 * Math.min(1.2, B.popIn(t, scanT(i))), A * (1 - smooth(prog(t, e5 + 0.4, e5 + 0.9))));
      if (i === 2 && startle > 0) { ctx.save(); ctx.globalAlpha *= startle * A; ctx.strokeStyle = '#fff'; ctx.lineWidth = hh * 0.025; ctx.lineCap = 'round'; for (const k of [-1, 0, 1]) { ctx.beginPath(); ctx.moveTo(o.top[0] + k * hh * 0.1, o.top[1] - hh * 0.06); ctx.lineTo(o.top[0] + k * hh * 0.16, o.top[1] - hh * 0.2); ctx.stroke(); } ctx.restore(); }
    } });
  }
  // 她的目光：一束青白的光从眼睛扫过一排人
  const sa = env(t, tStare - 0.15, tDuty + 0.6, 0.2) * A;
  if (sa > 0.01 && est) {
    const u = clamp(prog(t, tStare + 0.05, tDuty + 0.25)) * 4, i0 = Math.min(4, Math.floor(u)), i1 = Math.min(4, i0 + 1), f = u - i0;
    const r0 = qPos(i0, t), r1 = qPos(i1, t), tx = lerp(r0.X, r1.X, smooth(f)), tz = lerp(r0.Z, r1.Z, smooth(f));
    const tc = p(tx, 1.15, tz), hh = p.px(tz, 1.7), e = [est.o.head[0] + est.hh * 0.1, est.o.head[1] - est.hh * 0.01];
    items.push({ d: 0.01, f: () => {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(e[0], e[1], tc[0], tc[1]); g.addColorStop(0, rgba([200, 255, 245], 0.32 * sa)); g.addColorStop(1, rgba([140, 240, 230], 0.12 * sa));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(e[0], e[1] - 4); ctx.lineTo(tc[0], tc[1] - hh * 0.42); ctx.lineTo(tc[0], tc[1] + hh * 0.42); ctx.lineTo(e[0], e[1] + 4); ctx.closePath(); ctx.fill();
      ctx.restore(); glow(ctx, tc[0], tc[1], hh * 0.5, [150, 240, 230], 0.25 * sa);
    } });
  }
  return items;
}
// ISTJ：柜台上的账本和罐子 + 放大镜
const CX0 = 0.55, CX1 = 1.2, CZ0 = 11.0, CZ1 = 12.95, JX = 0.86, JW = 0.19;
const JARS = [0, 1, 2, 3].map(j => ({ Z: 12.18 + j * 0.23, flaw: j === 2 }));
const PZ = pg => 11.1 + pg * 0.45, RZr = (pg, r) => PZ(pg) + 0.08 + r * 0.088;
const ROWT = (pg, r) => lerp(tBook + 0.05, tGoods - 0.1, (pg * 4 + r) / 7);
function counterTop(ctx, p, t, L) {
  const lit = 0.45 + 0.55 * L;
  polyW(ctx, p, [[CX0, 0.951, CZ0], [CX1, 0.951, CZ0], [CX1, 0.951, CZ1], [CX0, 0.951, CZ1]], sh([150, 104, 70], lit));
  // 账本：两页，每页四行字（墨色粗条），扫过一行打一个勾
  for (let pg = 0; pg < 2; pg++) {
    const za = PZ(pg), zb = za + 0.42;
    polyW(ctx, p, [[0.62, 0.956, za], [1.14, 0.956, za], [1.14, 0.956, zb], [0.62, 0.956, zb]], sh([244, 234, 210], lit));
    for (let r = 0; r < 4; r++) {
      const zr = RZr(pg, r);
      E.seg(ctx, p, [0.7, 0.958, zr], [1.0 - hash(pg * 4 + r) * 0.12, 0.958, zr], sh([60, 54, 70], lit), 0.85, Math.max(1.5, p.px(zr, 0.02)));
      const tk = smooth(prog(t, ROWT(pg, r), ROWT(pg, r) + 0.12));
      if (tk > 0) { const a0 = p(1.03, 0.958, zr - 0.012), a1 = p(1.06, 0.958, zr + 0.016), a2 = p(1.11, 0.958, zr - 0.04); ctx.save(); ctx.strokeStyle = rgba([30, 150, 120], tk); ctx.lineWidth = Math.max(2, p.px(zr, 0.018)); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.lineTo(a2[0], a2[1]); ctx.stroke(); ctx.restore(); }
    }
  }
  const sp = p(0.88, 0.957, PZ(0)), sp2 = p(0.88, 0.957, PZ(1) + 0.42); ctx.save(); ctx.strokeStyle = rgba(sh([120, 60, 40], lit)); ctx.lineWidth = Math.max(2, p.px(11.6, 0.02)); ctx.beginPath(); ctx.moveTo(sp[0], sp[1]); ctx.lineTo(sp2[0], sp2[1]); ctx.stroke(); ctx.restore();
  // 罐子：守规矩之前歪着，之后摆正；第三只有一道裂纹
  const tidy = spring(t, tRule + 0.25, 8, 14);
  for (let j = JARS.length - 1; j >= 0; j--) {
    const J = JARS[j], off = (hash(j * 4.4) - 0.5) * 0.08 * (1 - tidy), rot = (hash(j * 2.9) - 0.5) * 0.6 * (1 - tidy);
    const q = p(JX + off, 0.955, J.Z), w = p.px(J.Z, JW), h = w * 1.3;
    ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(0, 0, w * 0.55, w * 0.14, 0, 0, 7); ctx.fill();
    const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, rgba(sh([255, 190, 80], lit))); g.addColorStop(0.5, rgba(sh([240, 150, 40], lit))); g.addColorStop(1, rgba(sh([150, 80, 20], lit)));
    ctx.fillStyle = g; rr(ctx, -w / 2, -h, w, h, w * 0.22); ctx.fill();
    ctx.fillStyle = rgba(sh([120, 80, 60], lit)); rr(ctx, -w * 0.42, -h - w * 0.2, w * 0.84, w * 0.24, w * 0.06); ctx.fill();
    ctx.fillStyle = rgba(sh([250, 240, 220], lit)); ctx.fillRect(-w * 0.34, -h * 0.62, w * 0.68, h * 0.26);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; rr(ctx, -w * 0.36, -h * 0.92, w * 0.12, h * 0.75, w * 0.06); ctx.fill();
    if (J.flaw) { ctx.strokeStyle = 'rgba(50,20,10,0.95)'; ctx.lineWidth = Math.max(1.2, w * 0.035); ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(w * 0.12, -h * 0.98); ctx.lineTo(w * 0.22, -h * 0.82); ctx.lineTo(w * 0.1, -h * 0.7); ctx.lineTo(w * 0.26, -h * 0.55); ctx.lineTo(w * 0.18, -h * 0.4); ctx.stroke(); ctx.fillStyle = 'rgba(255,250,230,0.9)'; ctx.beginPath(); ctx.moveTo(w * 0.36, -h); ctx.lineTo(w * 0.5, -h * 0.98); ctx.lineTo(w * 0.42, -h * 0.86); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }
}
// 放大镜在柜台上的位置（世界坐标，罐子中段高度）
function lensAt(t) {
  const up = smooth(prog(t, tChk - 0.15, tChk + 0.35));
  const keys = [[tChk + 0.3, 1.05, 11.1], [tBook, 0.85, RZr(0, 0)]];
  for (let pg = 0; pg < 2; pg++) for (let r = 0; r < 4; r++) { const tr = ROWT(pg, r); keys.push([tr - 0.04, 0.85, RZr(pg, r)]); }
  keys.push([tGoods + 0.05, JX, JARS[0].Z], [tGoods + 0.3, JX, JARS[1].Z], [tFlaw - 0.15, JX, JARS[3].Z], [tFlaw + 0.1, JX, JARS[2].Z], [tCircle - 0.1, JX, JARS[2].Z], [tCircle + 0.35, 0.66, RZr(1, 1)]);
  const r = route(t, keys);
  return { X: r.X, Z: r.Z, up, Y: lerp(0.98, 1.08, smooth(prog(r.Z, 11.95, 12.18))) };
}
function sceneISTJ(ctx, p, t, L, A) {
  const Z = 12;
  const o = litPerson(ctx, p, 'istj-male', 1.55, Z, { flip: true, a: A, dim: 0.6 * dimOthers(t), bob: hop(t, tCircle, 0.3) * p.px(Z, 0.03) }, L, [1.25, 2.05, Z]);
  ctx.save(); ctx.globalAlpha *= A * nearFade(p.depth(Z));
  box(ctx, p, CX0, CX1, 0, 0.95, CZ0, CZ1, sh([130, 88, 58], 0.45 + 0.55 * L));
  counterTop(ctx, p, t, L);
  ctx.restore();
  if (!o || p.depth(Z) > 6) return;  // 远景不画放大镜
  const ln = lensAt(t); if (ln.up <= 0.01) return;
  const c = p(ln.X, ln.Y, ln.Z), R = p.px(ln.Z, 0.25) * (0.6 + 0.4 * ln.up), hh = p.px(Z, 1.7), hand = [o.chest[0] - hh * 0.2, o.chest[1] + hh * 0.02];
  const cy = c[1] - (1 - ln.up) * hh * 0.3;
  // 把手
  const ang = Math.atan2(hand[1] - cy, hand[0] - c[0]), hx = c[0] + Math.cos(ang) * R, hy = cy + Math.sin(ang) * R;
  ctx.save(); ctx.globalAlpha *= A; ctx.lineCap = 'round';
  ctx.strokeStyle = '#3b2418'; ctx.lineWidth = R * 0.2; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(lerp(hx, hand[0], 0.85), lerp(hy, hand[1], 0.85)); ctx.stroke();
  ctx.strokeStyle = '#7a4c30'; ctx.lineWidth = R * 0.08; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(lerp(hx, hand[0], 0.85), lerp(hy, hand[1], 0.85)); ctx.stroke();
  // 镜片里：柜台面放大 1.9 倍
  ctx.save(); ctx.beginPath(); ctx.arc(c[0], cy, R, 0, 7); ctx.clip();
  ctx.fillStyle = rgba(sh([150, 104, 70], 0.9)); ctx.fillRect(c[0] - R, cy - R, R * 2, R * 2);
  ctx.translate(c[0], cy); ctx.scale(1.9, 1.9); ctx.translate(-c[0], -c[1]); counterTop(ctx, p, t, 1);
  ctx.restore();
  const g = ctx.createRadialGradient(c[0] - R * 0.4, cy - R * 0.4, R * 0.05, c[0], cy, R); g.addColorStop(0, 'rgba(255,255,255,0.32)'); g.addColorStop(0.5, 'rgba(200,230,255,0.05)'); g.addColorStop(1, 'rgba(160,200,255,0.18)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c[0], cy, R, 0, 7); ctx.fill();
  ctx.strokeStyle = '#2b2a30'; ctx.lineWidth = R * 0.16; ctx.beginPath(); ctx.arc(c[0], cy, R, 0, 7); ctx.stroke();
  ctx.strokeStyle = '#a8a6ae'; ctx.lineWidth = R * 0.05; ctx.beginPath(); ctx.arc(c[0], cy, R * 0.97, 3.6, 5.2); ctx.stroke();
  ctx.restore();
  glow(ctx, c[0], cy, R * 1.6, [200, 230, 255], 0.1 * A);
}
// 红圈（画在画面最上层，罐子上）
function redCircle(ctx, p, t, A) {
  const u = prog(t, tCircle, tCircle + 0.4); if (u <= 0 || A <= 0.01) return;
  const J = JARS[2], q = p(JX, 0.955 + JW * 0.62, J.Z), R = p.px(J.Z, JW * 1.05), a0 = -2.2;
  ctx.save(); ctx.globalAlpha *= A * (1 - smooth(prog(t, e6 + 0.3, e6 + 0.8))); ctx.lineCap = 'round';
  const pts = []; for (let i = 0; i <= 40; i++) { const a = a0 + (i / 40) * Math.PI * 2.25 * easeOut(u); pts.push([q[0] + Math.cos(a) * R * (1.05 + 0.08 * Math.sin(a * 2)), q[1] + Math.sin(a) * R * 0.95 * (1.25 - 0.05 * i / 40)]); }
  K.glowLine(ctx, pts, [255, 70, 64], 1, Math.max(6, R * 0.13), 1.3);
  ctx.restore();
}
// ISFJ：伞 + 孩子 + 雨
const UMB = { c0: [238, 118, 104], c1: [150, 52, 60] };
function umbrellaState(t, o, hh) {
  const lift = smooth(prog(t, tOpen - 0.45, tOpen)), open = clamp(spring(t, tOpen, 6, 12), 0, 1.15);
  const hx = o.chest[0] + hh * 0.17, hy = o.chest[1] + hh * 0.02;
  const cx = lerp(hx + hh * 0.08, hx + hh * 0.16, lift), cy = lerp(hy + hh * 0.05, o.top[1] - hh * 0.16, lift);
  return { hx, hy, cx, cy, open, lift, R: hh * 0.52, tilt: 0.14 * lift };
}
function drawUmbrella(ctx, U, a) {
  const { cx, cy, open, R, tilt } = U, rx = R * lerp(0.1, 1, clamp(open)), ry = R * lerp(0.95, 0.48, clamp(open)) * (open > 1 ? 1 - (open - 1) * 0.6 : 1);
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round';
  ctx.strokeStyle = '#2a2024'; ctx.lineWidth = R * 0.035; ctx.beginPath(); ctx.moveTo(U.hx, U.hy); ctx.lineTo(cx, cy - ry * 0.02); ctx.stroke();
  ctx.lineWidth = R * 0.04; ctx.beginPath(); ctx.arc(U.hx - R * 0.05, U.hy, R * 0.05, 0, Math.PI); ctx.stroke();
  ctx.translate(cx, cy); ctx.rotate(tilt);
  const g = ctx.createLinearGradient(0, -ry, 0, ry * 0.15); g.addColorStop(0, rgba(mix(UMB.c0, [255, 230, 210], 0.25))); g.addColorStop(1, rgba(UMB.c1));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-rx, 0);
  ctx.bezierCurveTo(-rx, -ry * 1.15, rx, -ry * 1.15, rx, 0);
  const n = 6; for (let i = n - 1; i >= 0; i--) { const xa = lerp(-rx, rx, (i + 1) / n), xb = lerp(-rx, rx, i / n); ctx.quadraticCurveTo((xa + xb) / 2, -ry * 0.16, xb, 0); }
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(sh(UMB.c1, 0.6)); ctx.lineWidth = R * 0.025;
  for (let i = 1; i < n; i++) { const xb = lerp(-rx, rx, i / n); ctx.beginPath(); ctx.moveTo(0, -ry * 0.86); ctx.quadraticCurveTo(xb * 0.55, -ry * 0.75, xb, -ry * 0.06); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.ellipse(-rx * 0.35, -ry * 0.62, rx * 0.26, ry * 0.12, -0.35, 0, 7); ctx.fill();
  ctx.fillStyle = '#2a2024'; ctx.beginPath(); ctx.arc(0, -ry * 0.88, R * 0.03, 0, 7); ctx.fill();
  ctx.restore();
  return { rx, ry };
}
const rainA = t => smooth(prog(t, b7 - 0.3, b7 + 0.45)) * (1 - smooth(prog(t, e7 - 0.05, e7 + 0.55)));
function sceneISFJ(ctx, p, t, L, A, out) {
  const Z = 9, hh = p.px(Z, 1.7), ra = rainA(t);
  const cover = smooth(prog(t, tOpen - 0.2, tOpen + 0.3)), safe = smooth(prog(t, tSafe - 0.05, tSafe + 0.45));
  // 孩子：淋雨时缩着发抖，伞撑开后站直，「安全」时胸口亮
  const shiver = ra * (1 - cover) * Math.sin(t * 46) * hh * 0.006;
  const kid = p.depth(8.85) > 0.4 ? E.folk3(ctx, p, 'infp-male', -0.48 + shiver / Math.max(1, p.px(8.85, 1)), 8.85, { m: 1.02, a: A * nearFade(p.depth(8.85)), slump: 0.7 * ra * (1 - cover), inner: safe * 0.9 * A, innerC: [255, 214, 150], dim: 0.6 * dimOthers(t), warm: safe * 0.6 }) : null;
  const o = litPerson(ctx, p, 'isfj-female', -1.15, Z, { a: A, lean: 0.06 * cover, dim: 0.6 * dimOthers(t) }, L, [-1.2, 2.05, Z]);
  if (!o) return;
  const U = umbrellaState(t, o, hh);
  if (p.depth(Z) < 7 || cover > 0) {
    const ua = A * (p.depth(Z) < 7 ? 1 : env(t, tOpen - 0.4, e7 + 0.8, 0.3));
    if (safe > 0 || cover > 0) { // 伞下的暖光
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(U.cx, U.cy + hh * 0.35, 0, U.cx, U.cy + hh * 0.35, hh * 0.75);
      g.addColorStop(0, rgba([255, 200, 130], (0.12 * cover + 0.22 * safe) * ua)); g.addColorStop(1, 'rgba(255,200,130,0)');
      ctx.fillStyle = g; ctx.fillRect(U.cx - hh, U.cy - hh * 0.4, hh * 2, hh * 1.6); ctx.restore();
    }
    const sz = drawUmbrella(ctx, U, ua);
    out.umb = { U, sz, ground: p(-0.8, 0, Z)[1], hh };
  }
  out.kid = kid;
}
function rainLayer(ctx, p, t, ra, umb) {
  if (ra <= 0.01) return;
  ctx.save();
  // 天色压暗一点、偏冷
  ctx.fillStyle = `rgba(20,30,60,${0.22 * ra})`; ctx.fillRect(0, 0, W, H);
  const slant = -0.2;
  if (umb && umb.U.open > 0.3) { // 伞下这一块不下雨（顺着雨的斜度往下）
    const { U, sz, ground } = umb, rx = sz.rx * 0.98, dy = ground - U.cy;
    const L0 = [U.cx - rx * Math.cos(U.tilt), U.cy - rx * Math.sin(U.tilt)], R0 = [U.cx + rx * Math.cos(U.tilt), U.cy + rx * Math.sin(U.tilt)];
    ctx.beginPath(); ctx.rect(0, 0, W, H);
    ctx.moveTo(L0[0], L0[1] - 8); ctx.lineTo(L0[0] + slant * dy, ground + 30); ctx.lineTo(R0[0] + slant * dy, ground + 30); ctx.lineTo(R0[0], R0[1] - 8);
    ctx.quadraticCurveTo(U.cx, U.cy - sz.ry * 1.3, L0[0], L0[1] - 8); ctx.closePath(); ctx.clip('evenodd');
  }
  E.rain(ctx, t, ra * 1.6, { n: 260, len: 60, slant, c: [190, 205, 240] });
  // 近处的大雨丝（虚焦）
  ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
  for (let i = 0; i < 26; i++) { const sp = 2200 + hash(i * 2.3) * 800, x = hash(i * 5.7) * (W + 300) - 100, y = (hash(i * 9.1) * H + t * sp) % (H + 300) - 150; ctx.strokeStyle = rgba([210, 220, 250], 0.12 * ra); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + slant * 140, y + 140); ctx.stroke(); }
  ctx.restore();
  // 雨点打在伞上溅开 + 地上的水花
  if (umb && umb.U.open > 0.5) {
    const { U, sz, hh } = umb;
    for (let i = 0; i < 22; i++) {
      const per = 0.32 + hash(i * 3.1) * 0.2, ph = (t / per + hash(i * 7.3)) % 1, u = ph, ang = lerp(-0.85, 0.95, hash(i * 1.9 + Math.floor(t / per + hash(i * 7.3)) * 0.37));
      const bx = U.cx + Math.cos(U.tilt) * ang * sz.rx - Math.sin(U.tilt) * (-sz.ry * 0.85 * (1 - ang * ang)), by = U.cy + Math.sin(U.tilt) * ang * sz.rx - sz.ry * 0.85 * (1 - ang * ang);
      const vx = (ang * 1.6 + 0.3) * hh * 0.22, vy = -hh * 0.18;
      const x = bx + vx * u, y = by + vy * u + hh * 0.9 * u * u, a = (1 - u) * ra;
      glow(ctx, x, y, hh * 0.02, [220, 235, 255], 0.5 * a); ctx.fillStyle = rgba([235, 245, 255], 0.8 * a); ctx.beginPath(); ctx.arc(x, y, Math.max(1.5, hh * 0.006), 0, 7); ctx.fill();
    }
  }
  for (let i = 0; i < 14; i++) {
    const per = 0.6 + hash(i * 4.1) * 0.4, cyc = Math.floor(t / per + hash(i)), u = (t / per + hash(i)) % 1;
    const Xr = lerp(-2.6, 2.6, hash(cyc * 1.3 + i * 7.1)), Zr = lerp(7.4, 12, hash(cyc * 2.9 + i * 3.3));
    if (p.depth(Zr) < 1) continue; const q = p(Xr, 0, Zr), r = p.px(Zr, 0.05 + u * 0.22);
    ctx.save(); ctx.strokeStyle = rgba([200, 215, 245], 0.35 * (1 - u) * ra); ctx.lineWidth = Math.max(1.5, p.px(Zr, 0.02)); ctx.beginPath(); ctx.ellipse(q[0], q[1], r, r * 0.25, 0, 0, 7); ctx.stroke(); ctx.restore();
  }
}
// ESFJ：补给车 + 三个缺东西的人
const GIVE = RECV.map((_, i) => tGive - 0.05 + i * 0.4);
function cartItems(ctx, p, t, L, A) {
  const left = i => t < GIVE[i] + 0.05;
  const lit = 0.5 + 0.5 * L;
  const spots = [['bread', 0.68, 5.55, 0.22], ['bread', 0.86, 5.68, 0.2], ['blanket', 0.66, 5.85, 0.24], ['blanket', 0.86, 5.95, 0.22], ['cup', 0.68, 6.12, 0.16], ['cup', 0.86, 6.15, 0.15]];
  spots.forEach(([k, X0, Z, s], j) => {
    const give = { bread: 0, blanket: 1, cup: 2 }[k];
    if (j % 2 === 0 && !left(give)) return;
    const q = p(X0, 0.82 + (k === 'blanket' ? 0.03 : 0.05), Z), w = p.px(Z, s);
    ctx.save(); ctx.globalAlpha *= A; ctx.filter = 'none'; ICON[k](ctx, q[0], q[1], w, lit, t); ctx.restore();
  });
}
function sceneCart(ctx, p, t, L, A) {
  const wood = sh([150, 98, 60], 0.45 + 0.55 * L);
  ctx.save(); ctx.globalAlpha *= A * nearFade(p.depth(5.4));
  box(ctx, p, 0.55, 1.0, 0.3, 0.78, 5.4, 6.25, wood);
  for (const z of [5.6, 6.05]) { const q = p(0.54, 0.24, z), r = p.px(z, 0.22); ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(0.5, 1); ctx.fillStyle = '#2a1c16'; ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.strokeStyle = rgba(sh([200, 150, 90], lit(L))); ctx.lineWidth = r * 0.16; ctx.beginPath(); ctx.arc(0, 0, r * 0.82, 0, 7); ctx.stroke(); for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2 + t * 0.2; ctx.lineWidth = r * 0.08; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * r * 0.8, Math.sin(a) * r * 0.8); ctx.stroke(); } ctx.restore(); }
  // 车上的小灯杆
  const a0 = p(0.97, 0.78, 6.2), a1 = p(0.97, 1.75, 6.2); ctx.strokeStyle = '#2a1c16'; ctx.lineWidth = Math.max(2, p.px(6.45, 0.04)); ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke();
  const lq = p(0.9, 1.72, 6.2); E.bulb(ctx, lq[0], lq[1], Math.max(2, p.px(6.2, 0.06)), E.CANDLE, L * (0.9 + 0.1 * Math.sin(t * 6)));
  cartItems(ctx, p, t, L, 1);
  ctx.restore();
}
const lit = L => 0.5 + 0.5 * L;
function heroState(t) {
  const r = route(t, [[tStep, HERO0[0], HERO0[1]], [tStep + 0.75, HERO1[0], HERO1[1]]]);
  let rs = 0, re = 0, eyes = 'open', mouth = 'grin', nod = 0;
  for (let i = 0; i < 3; i++) { rs += 0.55 * bump(t, GIVE[i] - 0.2, 0.22) - 0.95 * bump(t, GIVE[i] + 0.02, 0.36); }
  nod += bump(t, tSet - 0.1, 0.5) * 0.8 + bump(t, tSup - 0.1, 0.5) * 0.6;
  const wave = env(t, tEasy - 0.25, b10 + 0.5, 0.25);
  if (wave > 0) { rs = lerp(rs, -2.15 + Math.sin((t - tEasy) * 11) * 0.28, wave); re = lerp(re, -0.4, wave); eyes = 'happy'; }
  if (t > tTen) eyes = 'happy';
  return { X: r.X, Z: r.Z, mv: r.mv, rs, re, eyes, mouth, nod, flip: true };
}
function sceneHero(ctx, p, t, L, out) {
  const s = heroState(t), d = p.depth(s.Z); if (d < 0.45) return;
  const a = nearFade(d), ph = t * 2.6 * Math.PI;
  const blue = smooth(prog(t, tBlue, tBlue + 0.35));
  const o = { flip: s.flip, rs: s.rs, re: s.re, eyes: s.eyes, mouth: s.mouth, nod: s.nod, cake: false, umbrella: true, a,
    bob: s.mv ? Math.abs(Math.sin(ph)) * 9 : 0, hipB: s.mv ? Math.sin(ph) * 0.4 : 0, hipF: s.mv ? -Math.sin(ph) * 0.4 : 0, glow: 0.35 * smooth(prog(t, tStep + 0.3, tStep + 0.9)) * (1 - blue) };
  const q = p(1.1, 2.0, 6.2);
  out.hero = E.lit(ctx, c => E.hero3(c, p, s.X, s.Z, o), { x: q[0], y: q[1], r: p.px(s.Z, 3.6), c: E.WARM, k: 0.3 * L, amb: 0.35 });
  if (blue > 0) {
    const c = out.hero.chest, [fx, fy] = p(s.X, 0, s.Z), hh = p.px(s.Z, 1.75);
    E.pool(ctx, p, s.X, s.Z, 0.9, BLUE, 0.7 * blue);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const gg = ctx.createLinearGradient(0, fy, 0, fy - hh * 2.4); gg.addColorStop(0, rgba(BLUE, 0.3 * blue)); gg.addColorStop(1, rgba(BLUE, 0));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(fx - hh * 0.25, fy); ctx.lineTo(fx + hh * 0.25, fy); ctx.lineTo(fx + hh * 0.14, fy - hh * 2.4); ctx.lineTo(fx - hh * 0.14, fy - hh * 2.4); ctx.closePath(); ctx.fill(); ctx.restore();
    glow(ctx, c[0], c[1], p.px(s.Z, 1.4), BLUE, 0.45 * blue); glow(ctx, c[0], c[1], p.px(s.Z, 0.45), [220, 240, 255], 0.35 * blue); }
}
function sceneRecv(ctx, p, t, i, A, bub) {
  const t0 = b8 + 0.1 + i * 0.15, R = RECV[i], r = route(t, [[t0, R.X - 1.3, R.Z + 0.3], [t0 + 0.9, R.X, R.Z]]), d = p.depth(r.Z); if (d < 0.45) return;
  if (t < t0) return;
  A *= smooth(prog(t, t0, t0 + 0.35));
  const got = smooth(prog(t, GIVE[i] + 0.42, GIVE[i] + 0.7)), tl = GIVE[i] + 0.4;
  const o = litPerson(ctx, p, R.k, r.X, r.Z, { a: A, bob: (gait(t, r.mv) + hop(t, tl, 0.35) * 0.08) * p.px(r.Z, 1), inner: got * 0.8 * (1 - smooth(prog(t, e9, e9 + 0.6))), warm: got * 0.6, flip: false, dim: 0.0 }, 1, null);
  if (!o) return;
  const hh = p.px(r.Z, 1.7);
  // 缺什么：头顶一个实物泡泡；东西送到就啪地散掉
  const tb = tNeed + i * 0.2, ba = B.popIn(t, tb) * (1 - smooth(prog(t, tl, tl + 0.12)));
  if (ba > 0.01 && d < 7) bub.push({ x: o.top[0] + hh * 0.06, y: o.top[1] - hh * 0.26, a: Math.min(1, ba) * A, pop: ba, icon: R.it, w: Math.min(120, hh * 0.32), tail: [-hh * 0.05, hh * 0.2] });
  if (t > tl && t < tl + 0.5) { const u = prog(t, tl, tl + 0.5); for (let k = 0; k < 8; k++) { const an = k / 8 * 7 + i, rr2 = hh * (0.1 + 0.25 * easeOut(u)); glow(ctx, o.top[0] + Math.cos(an) * rr2, o.top[1] - hh * 0.26 + Math.sin(an) * rr2, hh * 0.04, [255, 230, 170], (1 - u) * 0.8); } }
  // 东西落到手里（胸前）之后一直抱着
  if (t >= tl) { ICON[R.it](ctx, o.chest[0] + hh * 0.08, o.chest[1] + hh * 0.05, hh * 0.22, A * (1 - smooth(prog(t, b10 + 0.2, b10 + 0.8))), t); }
  return o;
}
// 正在飞的补给（伞哥的手 → 对方胸口）
function flying(ctx, p, t, heroO, recvO) {
  if (!heroO) return;
  for (let i = 0; i < 3; i++) {
    const t0 = GIVE[i] - 0.2, t1 = GIVE[i] + 0.4; if (t < t0 || t > t1 || !recvO[i]) continue;
    const R = RECV[i], cq = p(0.77, 0.88, i === 0 ? 5.6 : i === 1 ? 5.9 : 6.13), hd = heroO.hand, tg = [recvO[i].chest[0] + 20, recvO[i].chest[1]];
    let x, y; const u1 = prog(t, t0, t0 + 0.2);
    if (t < t0 + 0.2) { x = lerp(cq[0], hd[0], easeOut(u1)); y = lerp(cq[1], hd[1], easeOut(u1)) - Math.sin(Math.PI * u1) * 30; }
    else { const u = easeInOut(prog(t, t0 + 0.2, t1)); x = lerp(hd[0], tg[0], u); y = lerp(hd[1], tg[1], u) - Math.sin(Math.PI * u) * 130; }
    const w = lerp(p.px(6, 0.24), p.px(R.Z, 0.38), prog(t, t0 + 0.2, t1));
    for (let k = 1; k <= 4; k++) glow(ctx, x + k * 16, y + k * 4, w * 0.4, [255, 220, 150], 0.12 * (1 - k / 5)); // 光尾
    glow(ctx, x, y, w * 0.7, [255, 220, 150], 0.18); ICON[R.it](ctx, x, y, w, 1, t);
  }
}
// B09 周围的人：先背着身，伞哥挥手时转过来、跳一下、胸口亮
function sceneFolk(ctx, p, g, t, A) {
  const f = g.folk, enter = b9 + 0.25 + (g.c % 4) * 0.12, side = g.X < HERO1[0] ? -1 : 1;
  if (t < enter && t < g.tp) return;
  const r = route(t, [[enter, g.X + side * 1.6, g.Z + 0.6], [enter + 0.8, g.X, g.Z]]), d = p.depth(r.Z); if (d < 0.45) return;
  const turn = t > tEasy - 0.15 + (g.c % 3) * 0.1, faceHero = side < 0 ? false : true;
  const blue = t > b10 ? 1 : 0;
  litPerson(ctx, p, f.k, r.X, r.Z, { a: A, flip: turn ? faceHero : (r.mv ? side > 0 : !faceHero), bob: (gait(t, r.mv) + hop(t, tEasy + 0.1 + (g.c % 3) * 0.12, 0.35) * 0.1) * p.px(r.Z, 1), inner: smooth(prog(t, tEasy + 0.2, tEasy + 0.6)) * 0.25 * (1 - blue * smooth(prog(t, tTen, tOne))), warm: 0.4, gray: crowdGray(t), dim: crowdDim(t) }, 1, null);
}
const crowdGray = t => 0.5 * smooth(prog(t, tTen - 0.2, tOne + 0.4));
const crowdDim = t => 0.3 * smooth(prog(t, tTen - 0.2, tOne + 0.4));
// 人群小图缓存：每个型号 × 朝向 × (正常 / 压暗) 一张 140×190 的小画布，只建一次
const SPR = new Map(), SPR_W = 150, SPR_H = 190, SPR_AX = 75, SPR_AY = 182, SPR_S = 170 / 240;
function sprite(key, flip, v) {
  const id = key + (flip ? 'F' : 'N') + v; let cv = SPR.get(id);
  if (!cv) { cv = new K.Canvas(SPR_W, SPR_H); MB.person(cv.getContext('2d'), key, SPR_AX, SPR_AY, SPR_S, { flip, shadow: 0, gray: v ? 0.5 : 0, dim: v ? 0.3 : 0 }); SPR.set(id, cv); }
  return cv;
}
// B10 人群
function sceneCrowd(ctx, p, g, t) {
  if (t < g.tp) return;
  const d = p.depth(g.Z); if (d < 0.5) return;
  const up = clamp(spring(t, g.tp, 8, 14), 0, 1.2), s = p.px(g.Z, 1.7) / 240 * up;
  const [x, y] = p(g.X, 0, g.Z);
  if (x < -80 || x > W + 80 || y < -200 || y > H + 300) return;
  const sweep = g.r === 1 ? bump(t, lerp(tTen, tBlue - 0.12, g.c / 9), 0.28) : 0;
  const bt = rowBlueT(g.r), bl = g.blue ? smooth(prog(t, bt, bt + 0.3)) : 0;
  const hh = p.px(g.Z, 1.7);
  if (bl > 0) { E.pool(ctx, p, g.X, g.Z, 0.7, BLUE, 0.6 * bl); }
  if (sweep > 0) E.pool(ctx, p, g.X, g.Z, 0.55, [255, 220, 160], 0.45 * sweep);
  if (!g.blue && sweep <= 0 && g.r !== 1) { // 普通的人：用缓存好的小图（正常 / 压暗两张叠），省时间
    const k = crowdGray(t) / 0.5, sc = s / SPR_S, A0 = smooth(clamp(up));
    E.contact(ctx, x, y, 44 * s, 0.4 * A0);
    ctx.save(); ctx.globalAlpha *= A0;
    const dw = SPR_W * sc, dh = SPR_H * sc;
    ctx.drawImage(sprite(g.k, g.flip, 0), x - SPR_AX * sc, y - SPR_AY * sc, dw, dh);
    if (k > 0.01) { ctx.globalAlpha *= k; ctx.drawImage(sprite(g.k, g.flip, 1), x - SPR_AX * sc, y - SPR_AY * sc, dw, dh); }
    ctx.restore(); return;
  }
  const o = MB.person(ctx, g.k, x, y, s, { a: smooth(clamp(up)), flip: g.flip, shadow: 0.6, gray: crowdGray(t) * (1 - bl), dim: crowdDim(t) * (1 - bl) - sweep * 0.2, warm: sweep, inner: bl * 0.9, innerC: BLUE, bob: hop(t, bt, 0.35) * hh * 0.08 * (g.blue ? 1 : 0) });
  if (bl > 0) { // 蓝色的光柱
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const gg = ctx.createLinearGradient(0, y, 0, y - hh * 2.2); gg.addColorStop(0, rgba(BLUE, 0.28 * bl)); gg.addColorStop(1, rgba(BLUE, 0));
    ctx.fillStyle = gg; ctx.beginPath(); ctx.moveTo(x - hh * 0.22, y); ctx.lineTo(x + hh * 0.22, y); ctx.lineTo(x + hh * 0.12, y - hh * 2.2); ctx.lineTo(x - hh * 0.12, y - hh * 2.2); ctx.closePath(); ctx.fill(); ctx.restore();
    glow(ctx, o.chest[0], o.chest[1], hh * 0.7, BLUE, 0.4 * bl);
  }
}

// ---------- 总画面 ----------
let LAST = { t: -1, bub: [] };
function draw(ctx, t) {
  const p = camAt(t), ra = rainA(t), SA = structA(t), bub = [];
  const [sx, sy] = X.shake(t, tW, 9);
  ctx.save(); ctx.translate(sx, sy);
  backdrop(ctx, p, t, ra);
  const items = [];
  for (const tr of TREES) items.push({ d: p.depth(tr.Z), f: () => tree(ctx, p, tr, t, SA) });
  for (const Z of POSTS) for (const s of [-1, 1]) items.push({ d: p.depth(Z) + 0.01, f: () => lamppost(ctx, p, s * 3.35, Z, t, SA) });
  items.push({ d: p.depth(10.5), f: () => arch(ctx, p, t, SA) });
  items.push({ d: p.depth(2) + 0.02, f: () => strings(ctx, p, t, SA) });
  items.push({ d: p.depth(3.3), f: () => crates(ctx, p, t, SA) });
  const out = {};
  for (const k of ORDER) {
    const b = BOOTH[k], L = boothLight(b, t);
    if (p.depth(b.Z) < 0.4) continue;
    items.push({ d: p.depth(b.Z + 0.9), f: () => { ctx.save(); ctx.globalAlpha *= SA * nearFade(p.depth(b.Z)); boothBack(ctx, p, b, t, L); ctx.restore(); if (L > 0.02) E.pool(ctx, p, b.side * 1.35, b.Z, 1.5, E.WARM, 0.28 * L * SA); } });
    items.push({ d: p.depth(b.Z - 0.9), f: () => { ctx.save(); ctx.globalAlpha *= SA * nearFade(p.depth(b.Z - 0.6)); boothFront(ctx, p, b, t, L); ctx.restore(); } });
  }
  const LE = boothLight(BOOTH.estj, t), LI = boothLight(BOOTH.istj, t), LF = boothLight(BOOTH.isfj, t), LS = boothLight(BOOTH.esfj, t);
  let est = null;
  items.push({ d: p.depth(15), f: () => { est = sceneESTJ(ctx, p, t, LE, SA); } });
  items.push({ d: p.depth(12), f: () => sceneISTJ(ctx, p, t, LI, SA) });
  items.push({ d: p.depth(9), f: () => sceneISFJ(ctx, p, t, LF, SA, out) });
  const hs = heroState(t);
  items.push({ d: p.depth(hs.Z), f: () => sceneHero(ctx, p, t, LS, out) });
  items.push({ d: p.depth(5.8), f: () => sceneCart(ctx, p, t, LS, SA) });
  const recvO = [];
  RECV.forEach((R, i) => items.push({ d: p.depth(R.Z), f: () => { recvO[i] = sceneRecv(ctx, p, t, i, SA, bub); } }));
  for (const g of CROWD) {
    if (g.hero) continue;
    if (g.folk) items.push({ d: p.depth(g.Z) + 0.001, f: () => sceneFolk(ctx, p, g, t, 1) });
    else if (t >= g.tp) items.push({ d: p.depth(g.Z) + 0.001, f: () => sceneCrowd(ctx, p, g, t) });
  }
  // 一排人 + 目光（目光放最后画）
  const qi = sceneQueue(ctx, p, t, SA, null);
  qi.forEach(q => { if (q.d > 0.02) items.push(q); });
  items.sort((a, b) => b.d - a.d);
  for (const it of items) it.f();
  if (est && t > tStare - 0.3 && t < tDuty + 0.8) for (const q of sceneQueue(ctx, p, t, SA, est)) if (q.d <= 0.02) q.f();
  redCircle(ctx, p, t, SA);
  flying(ctx, p, t, out.hero, recvO);
  rainLayer(ctx, p, t, ra, out.umb);
  // B09 聚光：从上方落到伞哥身上
  const spot = smooth(prog(t, tStep + 0.2, tStep + 0.8)) * (1 - smooth(prog(t, b10 + 0.3, b10 + 1.2)));
  if (spot > 0 && out.hero) {
    const h0 = out.hero, top = Math.min(-50, h0.top[1] - 700), fl = p(hs.X, 0, hs.Z), w1 = p.px(hs.Z, 1.6);
    E.cone(ctx, h0.top[0], top, fl[1] + 20, w1 * 0.25, w1 * 1.2, [255, 232, 186], 0.16 * spot);
    E.pool(ctx, p, hs.X, hs.Z, 1.0, [255, 230, 180], 0.4 * spot);
    if (t > tSocial - 0.1 && t < b10 + 0.3) bub.push({ x: h0.top[0] - p.px(hs.Z, 0.35), y: h0.top[1] - p.px(hs.Z, 0.32), a: B.popIn(t, tSocial - 0.1) * (1 - smooth(prog(t, b10 - 0.05, b10 + 0.25))), str: '大家好！', size: 64, tail: [30, 70] });
  }
  E.bokeh(ctx, t, 0.8 * (1 - 0.6 * smooth(prog(t, b10, b10 + 1.5))));
  E.vignetteWarm(ctx, 0.45);
  ctx.restore();
  LAST = { t, bub };
}
function over(ctx, t) {
  if (LAST.t !== t) return;
  for (const b of LAST.bub) {
    if (b.icon) B.say(ctx, '', b.x, b.y, b.a, { icon: (c, x, y, w) => ICON[b.icon](c, x, y, w * 0.82, 1, t), iconW: b.w, tail: b.tail, pop: b.pop });
    else B.say(ctx, b.str, b.x, b.y, Math.min(1, b.a), { size: b.size, tail: b.tail, pop: Math.max(0.01, b.a) });
  }
}
const SFX = [
  { t: tSign, k: 'ding' },
  { t: tW, k: 'tick' },
  { t: tCircle, k: 'click' },
  { t: tOpen, k: 'pop' },
  { t: GIVE[0] + 0.4, k: 'pop' },
  { t: tBlue, k: 'ding' },
];
module.exports = { draw, over, SFX };
