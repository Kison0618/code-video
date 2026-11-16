'use strict';
// 《ESFJ》v6 第 1 段：A01–B05（S1 开场亮窗 / S2 送汤围巾、各户灯变暖 / S3 活动室签名戴袖章）
// 进场：开场近景 3R 窗；出场：B.camUnit('GL', 1.4) 活动室（主角站在公告栏前，面朝右，戴红袖章）
const X = require('./ehk');
const B = require('./ebw');
const EF = require('./esf');
const { K, vs, ve, at } = X;
const { W, clamp, lerp, mix, prog, smooth, easeInOut, easeOut, hash, glow, rgba } = K;

// ---------- 时间锚点（全部按句取） ----------
const env = (t, a, b, r = 0.15) => smooth(prog(t, a, a + r)) * (1 - smooth(prog(t, b - r, b)));
const spring = (t, t0, k = 7, f = 13) => (t < t0 ? 0 : 1 - Math.exp(-(t - t0) * k) * Math.cos((t - t0) * f));
const hop = (t, t0, d = 0.45) => (t < t0 || t > t0 + d ? 0 : Math.sin(Math.PI * (t - t0) / d));
const T = (() => {
  const o = {};
  o.click = 0.35; o.cur0 = 0.62; o.cur1 = 1.3; o.str0 = 1.3; o.str1 = Math.max(2.3, Math.min(2.7, vs('A02')));
  o.pull0 = 1.75; o.pull1 = Math.max(o.pull0 + 1.0, vs('A02') + 0.15);
  o.b1 = at('A02', '蓝妈妈') - 0.05; o.b2 = Math.max(o.b1 + 0.6, at('A02', '男妈妈') - 0.05);
  o.cover = o.b2 + 0.2; o.coverEnd = Math.max(o.cover + 1.0, vs('A03') + 0.1);
  o.up0 = Math.max(o.coverEnd - 0.1, vs('A03') + 0.05); o.up1 = o.up0 + 1.2;
  o.sg0 = o.up1 + 0.05; o.sg1 = Math.max(o.sg0 + 0.55, ve('A03') - 0.75); o.sgEnd = o.sg1 + 0.66;
  o.down0 = Math.max(o.sgEnd + 1.0, ve('A03') + 1.0); o.down1 = vs('B01') - 0.1;
  o.pk0 = vs('B01') - 0.15; o.leave = ve('B01') - 0.5; o.pkD = (o.leave - 0.35 - o.pk0) / 3;
  o.k1 = at('B02', '看到') - 0.35; o.k2 = Math.max(o.k1 + 1.35, at('B02', '穿暖') - 0.3);
  o.joy = o.k2 + 0.8; o.out0 = vs('B03') - 0.25; o.out1 = vs('B03') + 0.9; o.casc = vs('B03') + 0.35;
  o.gl0 = ve('B03') - 0.25; o.gl1 = vs('B04') + 0.55;
  o.wave = Math.max(vs('B04') + 0.35, at('B04', '随和') - 0.1);
  const s0 = Math.max(o.wave + 1.1, at('B04', '学校') - 0.35), s2 = Math.max(s0 + 1.2, at('B04', '社团') + 0.25);
  o.s = [s0, (s0 + s2) / 2, s2];
  o.arm = Math.max(s2 + 0.75, Math.min(vs('B05') + 0.1, ve('B04') + 0.1));
  o.pat = Math.max(o.arm + 1.0, at('B05', '自己') - 0.1);
  o.end = vs('B06') - 0.05;
  return o;
})();

// ---------- 主角姿势 ----------
const POSE = { knock: { rs: -0.3 }, sign: { rs: -0.32 }, grab: { rs: -0.25 }, pat: { rs: 0.7, re: -2.5 }, cover: { rs: -2.2 } };
const handOff = p => EF.hero(null, 0, 0, 0.6, Object.assign({ a: 0 }, p)).hand; // 脸朝右时手相对脚底的偏移
const HK = handOff(POSE.knock), HS = handOff(POSE.sign), HG = handOff(POSE.grab);
const F3 = -1800, HX = 1180;
const D1L = B.door('1L').x, D1R = B.door('1R').x;
// 报名表贴在公告栏下沿（比主角的头低，签名时不被头挡住）
const SHEET = [236, 170, 104], SHW = 56, SH_TOP = -266, ARM_PIN = [50, -200];
const SX = SHEET.map(x => x + HS[0]), ARMX = ARM_PIN[0] + HG[0], LINE_Y = HS[1] + 2;
function legs(t0, t1, pts) {
  const L = []; let tot = 0;
  for (let i = 1; i < pts.length; i++) tot += Math.hypot(pts[i][0] - pts[i - 1][0], (pts[i][1] - pts[i - 1][1]) * 0.6);
  let tc = t0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], (pts[i][1] - pts[i - 1][1]) * 0.6) / tot * (t1 - t0); L.push({ t0: tc, t1: tc + d, a: pts[i - 1], b: pts[i] }); tc += d; }
  return L;
}
const PATH = [
  ...legs(T.leave, T.k1 - 0.15, [[HX, F3], [B.stair(3, 0)[0], F3], B.stair(3, 1), B.stair(2, 1), [D1L + HK[0], -600]]),
  ...legs(T.k1 + 1.0, T.k2 - 0.12, [[D1L + HK[0], -600], [D1R - HK[0], -600]]),
  ...legs(vs('B03') - 0.05, vs('B03') + 1.9, [[D1R - HK[0], -600], [B.stair(1, 0)[0], -600], B.stair(1, 1), [700, 0]]),
  ...legs(T.wave - 0.9, T.wave - 0.12, [[700, 0], [445, 0]]),
  ...legs(T.wave + 0.6, T.s[0] - 0.22, [[445, 0], [SX[0], 0]]),
  ...legs(T.s[0] + 0.38, T.s[1] - 0.12, [[SX[0], 0], [SX[1], 0]]),
  ...legs(T.s[1] + 0.38, T.s[2] - 0.12, [[SX[1], 0], [SX[2], 0]]),
  ...legs(T.s[2] + 0.4, T.arm - 0.08, [[SX[2], 0], [ARMX, 0]]),
];
function heroPos(t) {
  let p = [HX, F3], mv = null;
  for (const l of PATH) {
    if (t >= l.t1) p = l.b;
    else if (t > l.t0) { const u = (t - l.t0) / (l.t1 - l.t0); p = [lerp(l.a[0], l.b[0], u), lerp(l.a[1], l.b[1], u)]; mv = l; break; }
    else break;
  }
  return { x: p[0], y: p[1], mv };
}
const NUM = ['rs', 're', 'bk', 'lean', 'nod', 'glow', 'um'];
function blend(o, p, w) { if (w <= 0) return; for (const k of NUM) if (p[k] != null) o[k] = lerp(o[k] || 0, p[k], w); }
function heroAt(t) {
  const P = heroPos(t), o = { flip: false, rs: 0, re: 0, bk: 0, lean: 0, nod: 0, glow: 0, um: 0, bob: 0, hipB: 0, hipF: 0, eyes: 'open', mouth: 'smile', cake: false, dim: 0, warm: 0, look: [0, 0], blush: 0 };
  o.bob = Math.sin(t * 2.4) * 1.2;
  // S1：黑屋里睡眼 → 灯亮 → 拉窗帘 → 伸懒腰
  if (t < T.click + 0.1) { o.eyes = 'closed'; o.nod = 0.3; o.mouth = 'flat'; }
  o.dim = 0.72 * (1 - lamp3R(t));
  blend(o, { rs: -0.55 }, env(t, T.cur0 - 0.1, T.cur0 + 0.2, 0.2));
  if (t > T.cur0 && t < T.cur1 + 0.2) blend(o, { rs: lerp(-0.55, 0.25, easeOut(prog(t, T.cur0, T.cur1))) }, env(t, T.cur0, T.cur1 + 0.2, 0.12));
  const ws = env(t, T.str0, T.str1, 0.35);
  if (ws > 0) { blend(o, { rs: -1.35, re: -0.5, bk: -0.7, lean: -0.1, nod: -0.4 }, ws); o.bob += 10 * ws; if (ws > 0.5) { o.eyes = 'closed'; o.mouth = 'o'; } }
  if (t > T.b1 - 0.1 && t < T.b2) o.look = [-1, 0];
  if (t >= T.b2 && t < T.cover) o.look = [0, -1], o.eyes = 'wide';
  const wc = env(t, T.cover, T.coverEnd, 0.18);
  if (wc > 0) { blend(o, Object.assign({ nod: 0.6 }, POSE.cover), wc); o.blush = wc; if (wc > 0.4) o.eyes = 'closed'; o.bob += -4 * wc + Math.sin(t * 22) * 1.5 * wc; }
  // S2：装篮子
  for (let i = 0; i < 3; i++) {
    const c0 = T.pk0 + i * T.pkD, ph = (t - c0) / T.pkD;
    if (ph < 0 || ph >= 1) continue;
    const reach = [-0.35, -0.95, 0.65][i];
    if (ph < 0.42) { o.flip = true; o.rs = lerp(0, reach, smooth(ph / 0.3)); }
    else { o.flip = false; o.rs = lerp(reach, 0.5, smooth((ph - 0.42) / 0.3)); }
    o.look = [0, 0.6];
  }
  if (t >= T.pk0 + 3 * T.pkD && t < T.leave) o.rs = lerp(0.5, 0, smooth(prog(t, T.leave - 0.3, T.leave)));
  // 走路
  if (P.mv) {
    const ph = (t - P.mv.t0) * 2.6 * Math.PI * 2;
    o.flip = P.mv.b[0] < P.mv.a[0]; o.bob += Math.abs(Math.sin(ph)) * 9; o.hipB = Math.sin(ph) * 0.38; o.hipF = -Math.sin(ph) * 0.38; o.rs = 0.25 + Math.sin(ph) * 0.25;
  }
  // 敲门 / 递东西
  const knock = (tk, flip, give) => {
    const w = env(t, tk - 0.15, tk + 0.95, 0.12);
    if (w <= 0) return;
    o.flip = flip; blend(o, POSE.knock, w);
    if (t > tk - 0.02 && t < tk + 0.3) o.re = -0.55 * Math.abs(Math.sin((t - tk) / 0.15 * Math.PI));
    if (t > tk + 0.42) blend(o, { rs: -0.1, re: 0, nod: 0.25 }, env(t, tk + 0.42, give, 0.12));
  };
  if (t > T.k1 - 0.3 && t < T.k1 + 1.0) knock(T.k1, true, T.k1 + 0.95);
  if (t > T.k2 - 0.3 && t < T.k2 + 1.0) knock(T.k2, false, T.k2 + 0.95);
  const wj = env(t, T.joy, ve('B02') + 0.3, 0.2);
  if (wj > 0) { o.eyes = 'happy'; o.glow = 0.55 * wj; o.bob += hop(t, T.joy, 0.4) * 14; blend(o, { rs: -0.9, re: -0.6 }, wj * 0.7); }
  // S3：招手、签名、袖章、拍胸口
  const ww = env(t, T.wave - 0.1, T.wave + 0.55, 0.12);
  if (ww > 0) { o.flip = false; blend(o, { rs: -1.9, re: -0.4 + 0.45 * Math.sin((t - T.wave) * 22) }, ww); o.eyes = 'happy'; }
  T.s.forEach(s => {
    const w = env(t, s - 0.18, s + 0.42, 0.12);
    if (w > 0) { o.flip = true; blend(o, POSE.sign, w); if (t > s && t < s + 0.35) o.re = -0.12 * Math.sin((t - s) * 50); o.look = [0, -0.4]; }
  });
  if (t > T.s[2] - 0.2 && t < T.arm + 0.05) o.flip = true;
  const wa = env(t, T.arm - 0.08, T.arm + 0.5, 0.12);
  if (wa > 0) { o.flip = true; blend(o, POSE.grab, wa); }
  if (t > T.arm + 0.5) {
    o.flip = t > T.pat - 0.45 ? false : true;
    const wp = env(t, T.pat - 0.25, T.pat + 0.95, 0.2);
    if (wp > 0) { blend(o, Object.assign({ lean: -0.05, nod: -0.2 }, POSE.pat), wp); if (t > T.pat && t < T.pat + 0.7) o.re = -2.5 + 0.35 * Math.abs(Math.sin((t - T.pat) / 0.35 * Math.PI)); }
    if (t > T.pat - 0.1) { o.eyes = 'happy'; o.glow = 0.35 + 0.65 * Math.exp(-Math.max(0, t - T.pat - 0.1) * 2.2); }
  }
  return Object.assign(o, { x: P.x, y: P.y, moving: !!P.mv });
}

// ---------- 灯 / 门 / 招牌 ----------
function lamp3R(t) { if (t < T.click) return 0; const u = t - T.click; if (u < 0.14) return Math.floor(u * 50) % 2 ? 0.35 : 0.85; return 0.95; }
const CASC = ['GR', 'GL', '2L', '2R', '3L', '4L', '4R'];
const WT = { '1L': T.k1 + 0.6, '1R': T.k2 + 0.6 };
CASC.forEach((id, i) => { WT[id] = T.casc + i * 0.15; });
const warmW = (id, t) => (WT[id] == null ? 0 : smooth(prog(t, WT[id], WT[id] + 0.3)));
const SIGN_COLS = [[118, 198, 240], [118, 198, 240], [118, 198, 240], [118, 198, 240], [255, 204, 116], [255, 204, 116], [255, 204, 116]];
function signP(t) {
  if (t < T.sg0) return 0;
  if (t < T.sg1) return (4 / 7) * clamp((t - T.sg0) / 0.3, 0, 1);
  return 4 / 7 + (3 / 7) * clamp((t - T.sg1) / 0.66, 0, 1);
}
const close = (t, a) => clamp(1 - easeOut(prog(t, a, a + 0.35)), 0, 1);
function stAt(t) {
  const lamps = {}, grayUnit = {};
  for (const id of Object.keys(B.UNITS)) { const w = warmW(id, t); lamps[id] = lerp(0.05, 0.92, w); grayUnit[id] = 0.55 * (1 - w); }
  lamps['3R'] = lamp3R(t); grayUnit['3R'] = 0;
  const cu = t < T.cur0 ? 1 : lerp(1, 0.15, easeOut(prog(t, T.cur0, T.cur1)));
  const tc = vs('B03') + 0.35;
  const doors = {
    '3R': t < T.leave + 0.1 ? 0 : Math.min(spring(t, T.leave + 0.1), close(t, T.leave + 0.95)),
    '1L': t < T.k1 + 0.25 ? 0 : Math.min(spring(t, T.k1 + 0.25), close(t, tc)),
    '1R': t < T.k2 + 0.25 ? 0 : Math.min(spring(t, T.k2 + 0.25), close(t, tc)),
  };
  return { lamps, grayUnit, doors, curtain3R: cu, sign: { text: '', p: 0 } };
}

// ---------- 镜头 ----------
const CA = X.cam(1.62, 1325, -2075, 540, 640), CA2 = X.cam(1.78, 1330, -2080, 540, 640);
const CB = X.cam(1.0, 985, -2190, 540, 760), CC = X.cam(0.66, 770, -3020, 540, 700);
const CD = B.camUnit('3R', 1.5, -40, -10), C1F = X.cam(1.05, 770, -860, 540, 760), CGL = B.camUnit('GL', 1.4);
const follow = t => { const h = heroPos(t); return X.cam(1.12, lerp(h.x, 770, 0.45), h.y - 210, 540, 760); };
const CW = t => X.cam(lerp(0.4, 0.42, smooth(prog(t, T.out1, T.gl0))), B.BW / 2, B.ROOF / 2 - 120, 540, 800);
const M = (a, b, t, t0, t1) => B.camMix(a, b, easeInOut(prog(t, t0, t1)));
function camAt(t) {
  if (t < T.pull0) return B.camMix(CA, CA2, smooth(prog(t, 0, T.pull0)));
  if (t < T.up0) return M(CA2, CB, t, T.pull0, T.pull1);
  if (t < T.down0) return M(CB, CC, t, T.up0, T.up1);
  if (t < T.leave - 0.1) return M(CC, CD, t, T.down0, T.down1);
  if (t < T.k1 - 0.6) return M(CD, follow(t), t, T.leave - 0.1, T.leave + 0.5);
  if (t < T.out0) return M(follow(t), C1F, t, T.k1 - 0.6, T.k1 - 0.1);
  if (t < T.gl0) return M(C1F, CW(t), t, T.out0, T.out1);
  if (t >= T.gl1) return CGL;
  return M(CW(t), CGL, t, T.gl0, T.gl1);
}

// ---------- 道具 ----------
function bowl(ctx, x, y, s, t, steam = 1) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(2, 16, 26, 5, 0, 0, 7); ctx.fill();
  const g = ctx.createLinearGradient(0, -6, 0, 16); g.addColorStop(0, '#fbf8f0'); g.addColorStop(1, '#c9c2b4');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-26, -4); ctx.quadraticCurveTo(-24, 16, 0, 16); ctx.quadraticCurveTo(24, 16, 26, -4); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3d76b8'; ctx.fillRect(-22, 3, 44, 3);
  ctx.fillStyle = '#e09a4c'; ctx.beginPath(); ctx.ellipse(0, -4, 25, 6, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#f6c47a'; ctx.beginPath(); ctx.ellipse(-6, -5, 8, 2.4, 0, 0, 7); ctx.fill();
  if (steam > 0.01) {
    ctx.strokeStyle = `rgba(255,255,255,${0.55 * steam})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) { const ph = t * 2.2 + i * 2.1, x0 = -12 + i * 12; ctx.beginPath(); for (let k = 0; k <= 8; k++) { const yy = -10 - k * 5, xx = x0 + Math.sin(ph + k * 0.7) * 4; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
  }
  ctx.restore();
}
function scarfFold(ctx, x, y, s, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#b8242c'; ctx.beginPath(); ctx.roundRect(-24, -10, 48, 20, 6); ctx.fill();
  ctx.fillStyle = '#e04a46'; ctx.beginPath(); ctx.roundRect(-24, -10, 48, 9, 5); ctx.fill();
  ctx.fillStyle = '#f2e6d0'; ctx.fillRect(-24, -2, 48, 3);
  ctx.strokeStyle = '#b8242c'; ctx.lineWidth = 2; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-20 + i * 8, 10); ctx.lineTo(-21 + i * 8, 17); ctx.stroke(); }
  ctx.restore();
}
function scarfHang(ctx, x, y, s, t) { // 挂在墙钩上：x,y=钩子
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#6b5440'; ctx.fillRect(-14, -6, 28, 6); ctx.fillStyle = '#c9a66a'; ctx.beginPath(); ctx.arc(0, 0, 4, 0, 7); ctx.fill();
  const sw = Math.sin(t * 1.8) * 0.03;
  for (const [dx, len, c] of [[-9, 74, '#a8232a'], [9, 60, '#c62e33']]) {
    ctx.save(); ctx.translate(dx * 0.4, 2); ctx.rotate(sw * (dx > 0 ? 1 : -1));
    ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect(dx - 8, 0, 16, len, 4); ctx.fill();
    ctx.fillStyle = '#f2e6d0'; ctx.fillRect(dx - 8, len - 18, 16, 3);
    ctx.strokeStyle = c; ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(dx - 6 + i * 4, len); ctx.lineTo(dx - 6 + i * 4, len + 7); ctx.stroke(); }
    ctx.restore();
  }
  ctx.restore();
}
function scarfWorn(ctx, x, y, s, t, t0) { // 围在脖子上：x,y=脖子
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  ctx.fillStyle = '#c42a30'; ctx.beginPath(); ctx.ellipse(0, 0, 30, 11, 0, 0, 7); ctx.fill();
  ctx.fillStyle = '#e65049'; ctx.beginPath(); ctx.ellipse(0, -3, 28, 6, 0, 0, 7); ctx.fill();
  const sw = Math.sin((t - t0) * 9) * Math.exp(-(t - t0) * 2.5) * 0.5 + Math.sin(t * 2) * 0.05;
  ctx.save(); ctx.translate(14, 6); ctx.rotate(0.15 + sw);
  ctx.fillStyle = '#c42a30'; ctx.beginPath(); ctx.roundRect(-7, 0, 14, 36, 4); ctx.fill(); ctx.fillStyle = '#f2e6d0'; ctx.fillRect(-7, 22, 14, 3);
  ctx.restore(); ctx.restore();
}
function umbrellaS(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.strokeStyle = '#5b3a24'; ctx.lineWidth = 4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 30); ctx.arc(-7, 30, 7, 0, Math.PI); ctx.stroke();
  ctx.strokeStyle = '#d8d0c0'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 30); ctx.lineTo(0, -54); ctx.stroke();
  const g = ctx.createLinearGradient(-9, 0, 9, 0); g.addColorStop(0, '#2c6aa8'); g.addColorStop(1, '#174478');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -50); ctx.lineTo(9, 14); ctx.lineTo(-9, 14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#e8c45a'; ctx.fillRect(-6, 2, 12, 3);
  ctx.restore();
}
const BS = 0.95; // 篮子缩放
const SLOT = { bowl: [-17, 40], scarf: [15, 46], umb: [30, 16] };
function basket(ctx, x, y, has, t) { // x,y = 提手顶
  ctx.save(); ctx.translate(x, y); ctx.scale(BS, BS);
  ctx.strokeStyle = '#8a5a2e'; ctx.lineWidth = 7; ctx.beginPath(); ctx.ellipse(0, 52, 40, 50, 0, Math.PI, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = '#c08a4e'; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(0, 52, 40, 50, 0, Math.PI * 1.05, Math.PI * 1.6); ctx.stroke();
  if (has.umb) umbrellaS(ctx, SLOT.umb[0], SLOT.umb[1], 0.8, 0.45);
  if (has.scarf) scarfFold(ctx, SLOT.scarf[0], SLOT.scarf[1], 0.8, -0.15);
  if (has.bowl) bowl(ctx, SLOT.bowl[0], SLOT.bowl[1], 0.8, t, 0.8);
  const g = ctx.createLinearGradient(0, 50, 0, 106); g.addColorStop(0, '#d29a58'); g.addColorStop(1, '#8d5a2c');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-52, 50); ctx.lineTo(52, 50); ctx.lineTo(42, 106); ctx.lineTo(-42, 106); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(90,52,22,0.55)'; ctx.lineWidth = 2;
  for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(-50 + i * 2.5, 62 + i * 12); ctx.lineTo(50 - i * 2.5, 62 + i * 12); ctx.stroke(); }
  for (let i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * 11, 52); ctx.lineTo(i * 9, 104); ctx.stroke(); }
  ctx.fillStyle = '#e6b06a'; ctx.beginPath(); ctx.roundRect(-55, 45, 110, 10, 5); ctx.fill();
  ctx.restore();
}
const slotW = (bx, by, k) => [bx + SLOT[k][0] * BS, by + SLOT[k][1] * BS];
const bez = (p0, p1, h, u) => { const c = [(p0[0] + p1[0]) / 2, Math.min(p0[1], p1[1]) - h]; const v = 1 - u; return [v * v * p0[0] + 2 * v * u * c[0] + u * u * p1[0], v * v * p0[1] + 2 * v * u * c[1] + u * u * p1[1]]; };
function armband(ctx, x, y, s, rot) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.fillStyle = '#c8202a'; ctx.beginPath(); ctx.roundRect(-16, -11, 32, 22, 4); ctx.fill();
  ctx.fillStyle = '#f2c94c'; ctx.fillRect(-16, -8, 32, 3); ctx.fillRect(-16, 5, 32, 3);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-16, -11, 32, 3);
  ctx.restore();
}
function heart(ctx, x, y, w, c = '#e8505a') {
  const s = w / 100; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = c;
  ctx.beginPath(); ctx.moveTo(0, 34); ctx.bezierCurveTo(-60, -6, -36, -52, 0, -22); ctx.bezierCurveTo(36, -52, 60, -6, 0, 34); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-20, -18, 9, 6, -0.6, 0, 7); ctx.fill(); ctx.restore();
}
// 光点上升 / 暖光余波
function motes(ctx, cx, cy, wR, hR, t, t0, n, c, seed) {
  const u = t - t0; if (u < 0 || u > 2.2) return;
  for (let i = 0; i < n; i++) {
    const d = 0.6 + hash(seed + i) * 1.4, uu = u / d; if (uu > 1) continue;
    const x = cx + (hash(seed + i * 3.7) - 0.5) * wR + Math.sin(u * 3 + i) * 10, y = cy + (hash(seed + i * 1.9) - 0.2) * hR - uu * 220;
    glow(ctx, x, y, 14 + 10 * hash(i + seed), c, 0.7 * Math.sin(Math.PI * uu));
  }
}
function warmWave(ctx, x, y, R, t, t0, c = [255, 200, 120]) {
  const u = (t - t0) / 0.45; if (u < 0 || u > 1) return;
  glow(ctx, x, y, R * (0.3 + 0.9 * easeOut(u)), c, 0.55 * (1 - u));
  ctx.save(); ctx.strokeStyle = rgba(c, 0.5 * (1 - u)); ctx.lineWidth = 8 * (1 - u) + 1; ctx.beginPath(); ctx.arc(x, y, R * easeOut(u), 0, 7); ctx.stroke(); ctx.restore();
}

// ---------- 邻居 ----------
const FOLK = [
  { k: 'isfj-female', u: '3L', x: 548, s: 1.25, flip: false },
  { k: 'enfp-female', u: '4R', x: 1010, s: 1.2, flip: false }, { k: 'estp-male', u: '4R', x: 1200, s: 1.25, flip: true },
  { k: 'intp-male', u: '4L', x: 430, s: 1.25, flip: false },
  { k: 'istj-male', u: '2L', x: 300, s: 1.25, flip: false }, { k: 'estj-female', u: '2R', x: 1160, s: 1.25, flip: true },
  { k: 'isfj-female', u: '1L', x: 470, s: 1.15, flip: false, gran: 1 },
  { k: 'estp-female', u: '1R', x: 1300, s: 1.25, flip: true }, { k: 'enfp-male', u: '1R', x: 1060, s: 0.7, flip: true, kid: 1 },
  { k: 'esfp-female', u: 'GR', x: 1130, s: 1.2, flip: true },
  { k: 'enfj-female', u: 'GL', x: 512, s: 1.2, flip: false }, { k: 'esfp-male', u: 'GL', x: 588, s: 1.2, flip: true },
];
const GRAN_D = [T.k1 + 0.3, vs('B03') + 0.3], KID_D = [T.k2 + 0.3, vs('B03') + 0.3];
function folkHop(f, t) {
  let h = 0;
  if (f.k === 'isfj-female') h += hop(t, T.b1 - 0.05);
  if (f.k === 'enfp-female') h += hop(t, T.b2 - 0.05);
  if (WT[f.u] != null) h += hop(t, WT[f.u] + 0.05, 0.5);
  if (f.u === 'GL') h += hop(t, T.wave + 0.1, 0.4);
  return h;
}
function drawFolk(ctx, t) {
  for (const f of FOLK) {
    const w = f.u === '3R' ? 1 : warmW(f.u, t), dim = 0.5 * (1 - w), u = B.U(f.u);
    let a = 1;
    if (f.gran) a = 1 - env(t, GRAN_D[0], GRAN_D[1], 0.25);
    if (f.kid) a = 1 - env(t, KID_D[0], KID_D[1], 0.25);
    const lean = WT[f.u] != null ? Math.sin((t - WT[f.u]) * 7) * 0.08 * env(t, WT[f.u], WT[f.u] + 1.6, 0.2) : 0;
    const call = f.k === 'isfj-female' ? env(t, T.b1 - 0.1, T.b1 + 1.2, 0.15) * 0.12 : f.k === 'enfp-female' ? env(t, T.b2 - 0.1, T.b2 + 1.2, 0.15) * -0.1 : 0;
    const bob = folkHop(f, t) * 26 + Math.sin(t * 2 + f.x) * 1.5;
    if (a > 0.01) {
      const o = B.folk(ctx, f.k, f.x, u.floor, f.s, { a, bob, lean: lean + call, flip: f.flip, dim: Math.max(0, dim - 0.25 * (call ? 1 : 0)) });
      if (f.kid && t > T.k2 + 0.75) scarfWorn(ctx, f.x, o.head[1] + 0.7 * f.s * 240 * 0.2, 0.7, t, T.k2 + 0.75);
      if (f.gran && t > T.k1 + 0.85) bowl(ctx, f.x + 26, o.chest[1] + 6, 1.0, t);
    }
  }
}
// 门口的王奶奶和小孩
function doorFolk(ctx, t) {
  const og = B.door('1L'), ok = B.door('1R');
  const ag = env(t, GRAN_D[0], GRAN_D[1], 0.25), ak = env(t, KID_D[0], KID_D[1], 0.25);
  if (ag > 0.01) {
    const bob = hop(t, T.k1 + 0.9, 0.4) * 10, o = B.folk(ctx, 'isfj-female', og.x, og.y, 0.88, { a: ag, flip: false, bob });
    if (t > T.k1 + 0.85) bowl(ctx, og.x + 22, o.chest[1] + 6, 1.0, t);
  }
  if (ak > 0.01) {
    const bob = (hop(t, T.k2 + 0.8, 0.35) + hop(t, T.k2 + 1.2, 0.35)) * 16, o = B.folk(ctx, 'enfp-male', ok.x, ok.y, 0.66, { a: ak, flip: true, bob });
    if (t > T.k2 + 0.75) { ctx.save(); ctx.globalAlpha *= ak; scarfWorn(ctx, ok.x, o.head[1] + 0.66 * 240 * 0.2 * 0.7, 0.62, t, T.k2 + 0.75); ctx.restore(); }
  }
}

// ---------- 霓虹招牌（自己画：ESFJ 四个字母挨着，供给者三个字一格格亮） ----------
const SIGN_CH = ['E', 'S', 'F', 'J', '供', '给', '者'];
const SIGN_T = i => (i < 4 ? T.sg0 + i * 0.07 : T.sg1 + (i - 4) * 0.22);
const SIGN_SZ = 132, SIGN_Y = B.ROOF - 240;
let SIGN_X = null;
function signLayout(ctx) {
  if (SIGN_X) return SIGN_X;
  ctx.save(); ctx.font = `900 ${SIGN_SZ}px EQHeavy, Serif`;
  const w = SIGN_CH.map(c => ctx.measureText(c).width * (c < '\u4e00' ? 1.02 : 1)), gap = 46;
  const tot = w.reduce((a, b) => a + b, 0) + gap; let x = B.BW / 2 - tot / 2;
  SIGN_X = w.map((ww, i) => { if (i === 4) x += gap; const c = x + ww / 2; x += ww; return c; });
  ctx.restore(); return SIGN_X;
}
function signOn(t, i) { const t0 = SIGN_T(i), u = t - t0; if (u < 0) return 0; if (u < 0.16) return [0.9, 0.2, 1, 0.4, 1][Math.floor(u / 0.032)] || 1; return 0.92 + 0.08 * Math.sin(t * 9 + i * 1.7); }
function neonSign(ctx, t) {
  const xs = signLayout(ctx);
  ctx.save(); ctx.font = `900 ${SIGN_SZ}px EQHeavy, Serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  // 招牌整体溢光（照亮天空和屋顶）
  const lit = SIGN_CH.reduce((a, _, i) => a + signOn(t, i), 0) / 7;
  if (lit > 0.01) { glow(ctx, B.BW / 2, SIGN_Y, 900, [150, 190, 255], 0.22 * lit); glow(ctx, B.BW / 2, B.ROOF, 700, [255, 200, 130], 0.18 * lit); }
  SIGN_CH.forEach((c, i) => {
    const on = signOn(t, i), col = SIGN_COLS[i], x = xs[i];
    ctx.lineWidth = 7; ctx.strokeStyle = rgba(mix([52, 50, 60], col, on * 0.5)); ctx.strokeText(c, x, SIGN_Y);
    if (on > 0.01) {
      glow(ctx, x, SIGN_Y, SIGN_SZ * 1.3, col, 0.32 * on);
      ctx.shadowColor = rgba(col, 0.95 * on); ctx.shadowBlur = 36;
      ctx.fillStyle = rgba(mix([60, 56, 64], col, on)); ctx.fillText(c, x, SIGN_Y);
      ctx.shadowBlur = 0; ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.65), 0.75 * on); ctx.font = `900 ${SIGN_SZ}px EQHeavy, Serif`;
      ctx.save(); ctx.beginPath(); ctx.rect(x - SIGN_SZ, SIGN_Y - SIGN_SZ * 0.5, SIGN_SZ * 2, SIGN_SZ * 0.32); ctx.clip(); ctx.fillText(c, x, SIGN_Y); ctx.restore();
    } else { ctx.fillStyle = 'rgb(46,44,54)'; ctx.fillText(c, x, SIGN_Y); }
  });
  ctx.restore();
}
function signSparks(ctx, t) {
  const xs = signLayout(ctx), y = SIGN_Y;
  const fire = [[T.sg0, [0, 1, 2, 3]], [T.sg1, [4]], [T.sg1 + 0.22, [5]], [T.sg1 + 0.44, [6]]];
  for (const [t0, ids] of fire) {
    const u = t - t0; if (u < 0 || u > 1.2) continue;
    for (const i of ids) {
      const cx = xs[i], c = SIGN_COLS[i];
      glow(ctx, cx, y, 260 * (0.4 + u), c, 0.6 * Math.exp(-u * 4));
      for (let j = 0; j < 12; j++) {
        const an = hash(i * 31 + j) * Math.PI * 2, sp = 120 + hash(j * 7 + i) * 260;
        const px = cx + Math.cos(an) * sp * u, py = y + Math.sin(an) * sp * u * 0.7 + 380 * u * u;
        glow(ctx, px, py, 10, mix(c, [255, 255, 255], 0.5), Math.max(0, 1 - u / 0.9));
      }
    }
  }
}

// ---------- 主画 ----------
const PICK = { bowl: [1005, -2042], scarf: [1135, -2128], umb: [1162, -1880] };
const TABLE_B = [1335, -1930 - 106 * BS];
const ITEMS = ['bowl', 'scarf', 'umb'];
function draw(ctx, t) {
  const cam = camAt(t), st = stAt(t);
  B.world(ctx, t, cam, st);
  B.inCam(ctx, cam, () => {
    // 3R 窗外清晨光、灯亮余光
    const L3 = B.lampAt(B.U('3R'));
    if (t > T.click) { const u = t - T.click; glow(ctx, L3[0], L3[1] + 150, 300 + 700 * easeOut(Math.min(1, u / 0.6)), [255, 206, 130], 0.5 * Math.exp(-u * 3.5)); }
    // 活动室：报名表 + 袖章（挂在公告栏下沿）
    T.s.forEach((s, i) => {
      const x = SHEET[i], p = clamp((t - s) / 0.32, 0, 1);
      ctx.save(); ctx.translate(x, SH_TOP); ctx.rotate((i - 1) * 0.03);
      B.rect(ctx, -SHW / 2 + 3, 4, SHW, LINE_Y - SH_TOP + 26, [0, 0, 0], 0.25);
      B.rect(ctx, -SHW / 2, 0, SHW, LINE_Y - SH_TOP + 26, [248, 246, 238]);
      B.rect(ctx, -SHW / 2, 0, SHW, 14, [[96, 170, 220], [236, 120, 96], [130, 196, 120]][i]);
      for (let r = 0; r < 4; r++) B.rect(ctx, -SHW / 2 + 6, 28 + r * 16, SHW - 12, 2, [200, 196, 186]);
      ctx.fillStyle = '#d23b3b'; ctx.beginPath(); ctx.arc(0, 4, 4, 0, 7); ctx.fill();
      ctx.restore();
      const ly = LINE_Y, xa = x - SHW / 2 + 7, xb = x + SHW / 2 - 7;
      if (p > 0) {
        ctx.save(); ctx.strokeStyle = '#1d3f8a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath();
        const n = 26; for (let k = 0; k <= n * p; k++) { const u = k / n, xx = lerp(xa, xb, u), yy = ly + Math.sin(u * 19) * 5 - Math.sin(u * 7) * 2; k ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
        ctx.stroke(); ctx.restore();
        const ex = lerp(xa, xb, p), ey = ly + Math.sin(p * 19) * 5;
        if (p < 1) for (let k = 1; k <= 3; k++) { ctx.strokeStyle = `rgba(255,255,255,${0.7 - k * 0.15})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ex - 8 - k * 10, ey - 8 + k * 6); ctx.lineTo(ex - 30 - k * 14, ey - 8 + k * 6); ctx.stroke(); }
        if (p >= 1) glow(ctx, x, (SH_TOP + ly) / 2, 90, [255, 226, 150], 0.5 * Math.exp(-(t - s - 0.32) * 3));
      }
    });
    const armT = clamp((t - T.arm - 0.12) / 0.35, 0, 1);
    if (t < T.arm + 0.12) {
      ctx.strokeStyle = 'rgba(60,40,30,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(ARM_PIN[0], ARM_PIN[1] - 40); ctx.lineTo(ARM_PIN[0], ARM_PIN[1] - 12); ctx.stroke();
      armband(ctx, ARM_PIN[0], ARM_PIN[1], 1, Math.PI / 2 + Math.sin(t * 2) * 0.05);
    }
    // 3R 柜台上的东西 / 桌上篮子
    const has = {}; let flying = [];
    ITEMS.forEach((k, i) => {
      const c0 = T.pk0 + i * T.pkD, ph = (t - c0) / T.pkD;
      if (ph < 0.28) { if (k === 'bowl') bowl(ctx, PICK.bowl[0], PICK.bowl[1], 1.15, t); if (k === 'scarf') scarfHang(ctx, PICK.scarf[0], PICK.scarf[1] - 40, 1.1, t); if (k === 'umb') umbrellaS(ctx, PICK.umb[0], PICK.umb[1], 1.2, 0.18); }
      else if (ph < 0.85) flying.push([k, smooth((ph - 0.28) / 0.57)]);
      else has[k] = true;
    });
    // 给出去的
    if (t > T.k1 + 0.45) has.bowl = false;
    if (t > T.k2 + 0.35) has.scarf = false;
    const H = heroAt(t);
    let bx, by;
    drawFolk(ctx, t);
    doorFolk(ctx, t);
    const out = B.hero(ctx, H.x, H.y, 0.6, H);
    // 脸红
    if (H.blush > 0.01) {
      const f = out.face; glow(ctx, f[0] - 6, f[1] + 6, 46, [255, 90, 90], 0.55 * H.blush);
      ctx.fillStyle = `rgba(240,90,100,${0.55 * H.blush})`; ctx.beginPath(); ctx.ellipse(f[0] - 22, f[1] + 12, 13, 7, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(255,120,120,${0.8 * H.blush})`; ctx.lineWidth = 3;
      for (let i = 0; i < 3; i++) { const ph = (t * 1.6 + i / 3) % 1, x = out.top[0] - 30 + i * 30, y = out.top[1] - 10 - ph * 50; ctx.globalAlpha = Math.sin(Math.PI * ph); ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 8, y - 10, x, y - 20); ctx.stroke(); }
      ctx.globalAlpha = 1;
    }
    // 篮子：桌上 → 主角左手
    const carried = [out.book[0] + (H.flip ? -6 : 6), out.book[1] - 14];
    if (t < T.leave - 0.3) [bx, by] = TABLE_B;
    else { const u = smooth(prog(t, T.leave - 0.3, T.leave)); bx = lerp(TABLE_B[0], carried[0], u); by = lerp(TABLE_B[1], carried[1], u) + (H.moving ? Math.sin(t * 33) * 2 : 0); }
    const showBasket = t < vs('B03') + 2.2;
    if (showBasket) basket(ctx, bx, by, has, t);
    for (const [k, u] of flying) {
      const p = bez(PICK[k], slotW(TABLE_B[0], TABLE_B[1], k), 120, u);
      if (k === 'bowl') bowl(ctx, p[0], p[1], 1.15 - 0.2 * u, t); else if (k === 'scarf') scarfFold(ctx, p[0], p[1], 1.1 - 0.25 * u, u * 6); else umbrellaS(ctx, p[0], p[1], 1.2 - 0.4 * u, 0.18 + u * 0.3);
      if (u > 0.9) glow(ctx, p[0], p[1], 60, [255, 230, 170], 0.5);
    }
    ITEMS.forEach((k, i) => { const tl = T.pk0 + (i + 0.85) * T.pkD; const s = slotW(TABLE_B[0], TABLE_B[1], k); if (t > tl && t < tl + 0.4) glow(ctx, s[0], s[1], 70, [255, 220, 150], 0.6 * (1 - (t - tl) / 0.4)); });
    // 递汤 / 围围巾
    const og = B.door('1L'), ok = B.door('1R');
    if (t > T.k1 + 0.45 && t < T.k1 + 0.85) { const u = smooth(prog(t, T.k1 + 0.45, T.k1 + 0.85)); const p = bez(slotW(bx, by, 'bowl'), [og.x + 22, og.y - 0.88 * 240 * 0.55 + 6], 70, u); bowl(ctx, p[0], p[1], lerp(0.8, 1.0, u), t); }
    if (t > T.k2 + 0.35 && t < T.k2 + 0.75) { const u = smooth(prog(t, T.k2 + 0.35, T.k2 + 0.75)); const p = bez(slotW(bx, by, 'scarf'), [ok.x, ok.y - 0.66 * 240 * 0.72], 80, u); scarfFold(ctx, p[0], p[1], lerp(0.8, 1.1, u), u * 7); }
    // 暖光余波 + 光点
    for (const id of Object.keys(WT)) {
      const u = B.U(id), tw = WT[id];
      const src = id === '1L' ? [og.x, og.y - 100] : id === '1R' ? [ok.x, ok.y - 100] : [u.cx, (u.top + u.floor) / 2];
      warmWave(ctx, src[0], src[1], id[0] === '1' ? 520 : 420, t, tw);
      motes(ctx, u.cx, u.floor - 200, u.w * 0.8, 200, t, tw, 10, [255, 206, 130], id.charCodeAt(0) * 7 + id.charCodeAt(1));
    }
    if (t > T.joy - 0.1) motes(ctx, H.x, H.y - 200, 160, 100, t, T.joy, 12, [255, 214, 140], 91);
    // 袖章：从公告栏 → 手 → 上臂
    const k = out.k, rs = H.rs, fx = H.flip ? -1 : 1;
    const mid = [268 - 270, 222 - 182], c = Math.cos(rs), s = Math.sin(rs), rp = [270 + mid[0] * c - mid[1] * s, 182 + mid[0] * s + mid[1] * c];
    const armW = [H.x + (rp[0] - 150) * k * fx, H.y + (rp[1] - H.bob - 394) * k], armRot = (rs + 0) * fx;
    if (t >= T.arm + 0.12) {
      const p0 = ARM_PIN, p = armT < 1 ? bez(p0, armW, 30, easeInOut(armT)) : armW;
      armband(ctx, p[0], p[1], lerp(1, 1.2, armT), lerp(Math.PI / 2, armRot, armT));
      if (armT >= 1) { const u = t - T.arm - 0.47; if (u < 0.6) { glow(ctx, armW[0], armW[1], 80, [255, 90, 80], 0.6 * (1 - u / 0.6)); ctx.strokeStyle = `rgba(255,220,160,${0.8 * (1 - u / 0.6)})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(armW[0], armW[1], 20 + u * 90, 0, 7); ctx.stroke(); } }
    }
    // 拍胸口：胸前闪光
    for (const tp of [T.pat + 0.12, T.pat + 0.47]) {
      const u = t - tp; if (u < 0 || u > 0.7) continue;
      glow(ctx, out.chest[0], out.chest[1], 120 + 260 * u, [255, 214, 140], 0.75 * (1 - u / 0.7));
      for (let i = 0; i < 14; i++) { const an = i / 14 * Math.PI * 2, r = 40 + 200 * easeOut(u / 0.7); glow(ctx, out.chest[0] + Math.cos(an) * r, out.chest[1] + Math.sin(an) * r * 0.8, 9, [255, 236, 190], 1 - u / 0.7); }
    }
    neonSign(ctx, t);
    signSparks(ctx, t);
  });
}
function over(ctx, t) {
  const cam = camAt(t);
  const head = (x, y, s, bob = 0) => cam.map(x, y - bob - s * 240 * 0.86);
  const bub = (str, hx, hy, t0, t1, tg, o = {}) => {
    if (t < t0 || t > t1) return;
    const a = Math.min(1, (t - t0) / 0.1) * (1 - smooth(prog(t, t1 - 0.2, t1))), gray = tg ? smooth(prog(t, tg, tg + 0.15)) : 0;
    const bx = clamp(hx + (o.dx || 0), 170, W - 170), by = hy + (o.dy || -150);
    B.say(ctx, str, bx, by, a, Object.assign({ pop: B.popIn(t, t0), gray, tail: [clamp(hx - bx, -120, 120), Math.max(60, hy - by - 40)] }, o));
  };
  const f0 = FOLK[0], f1 = FOLK[1];
  const h0 = head(f0.x, B.U(f0.u).floor, f0.s), h1 = head(f1.x, B.U(f1.u).floor, f1.s);
  bub('蓝妈妈~', h0[0], h0[1], T.b1, T.b1 + 1.35, T.b2, { dx: 110, dy: -130 });
  bub('男妈妈！', h1[0], h1[1], T.b2, T.b2 + 1.35, 0, { dx: 40, dy: -120 });
  const og = B.door('1L'), ok = B.door('1R');
  const g = head(og.x, og.y, 0.88), kd = head(ok.x, ok.y, 0.66);
  bub('', g[0], g[1], T.k1 + 0.95, T.k1 + 1.9, T.k2 + 0.85, { icon: (c, x, y, w) => heart(c, x, y + 4, w * 0.75), iconW: 120, dx: -60, dy: -130 });
  bub('', kd[0], kd[1], T.k2 + 0.85, T.k2 + 1.85, 0, { icon: (c, x, y, w) => heart(c, x, y + 4, w * 0.75), iconW: 120, dx: 60, dy: -130 });
}
const hudA = t => smooth(prog(t, 0.8, 1.4));
const SFX = [
  { t: T.click, k: 'click' },
  { t: T.b1, k: 'pop' }, { t: T.b2, k: 'pop' },
  { t: T.sg0, k: 'ding' }, { t: T.sg1 + 0.44, k: 'ding' },
  { t: T.k1, k: 'knock' }, { t: T.k2, k: 'knock' },
];
module.exports = { draw, over, hudA, SFX, T, camAt };
