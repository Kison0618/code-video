'use strict';
// 《ESFJ》v7 EC3：C01–C09 社区晚会大厅（透视长桌、灯笼、灯串、后墙舞台）。每句演一个表现，不演"他的一天"：
//  C01 灯一路亮起，他在过道迎客，客人从后门涌进来坐满两张长桌 → 拉远全景，每位客人头上冒笑脸
//  C02 小美自我介绍，泡泡变成金色名牌飞进他脑袋，和记住的名牌一起绕头转 → 他看到一只空杯，拿茶壶过去续上
//  C03 镜头摇到布告栏：学校 / 社区 / 合唱团三张海报钉上，每张都有他的照片 → 照片亮起贴金星
//  C04 他走到布告栏前，袖章套上胳膊，手按胸口发暖光
//  C05 邻居围上来，他的泡泡是实物：太阳 / 带价签的青菜 / 一家人
//  C06 他冒出「新鲜事」泡泡，光流从他头上传到每个人耳边，大家凑近 → 拉远看光流传满大厅
//  C07 INTP 插进来抽象符号泡泡，他的泡泡一个个瘪掉，只剩「……」，全场静 → 熄灯
//  C08 舞台灯亮：白大褂专家讲同一组符号，符号变金；他坐直、在书上记、跟着专家举手
//  C09 灯回暖，他翻开老相册，照片发光飘起 → 说到以后，头顶念头长成担心分叉树，句尾收掉
const X = require('./ehk');
const E = require('./egenv');
const F = require('./egfx');
const B = require('./ebw');
const ES = require('./esf');
const MB = require('./mb');
const { makeTree } = require('../tree');
const { K, vs, ve, at } = X;
const { W, H, clamp, lerp, mix, prog, smooth, easeInOut, easeOut, hash, glow, rgba } = K;
const { WARM, CANDLE } = E;

const T0 = vs('C01') - 0.05, T1 = vs('D01') - 0.05;
const ss = (t, a, b) => smooth(prog(t, a, b));
const GOLDC = [255, 206, 96], INK = [40, 40, 46], COOL = [130, 160, 220];

// ---------- 时间点（全部按句取） ----------
const S = {};
S.wave = vs('C01') + 0.45; S.give = at('C01', '交给'); S.pull0 = at('C01', '聚会') - 0.25; S.pull1 = ve('C01') - 0.1; S.joy = at('C01', '每位') - 0.05;
S.c2 = vs('C02'); S.intro = S.c2 + 0.15; S.fly0 = Math.max(at('C02', '他们'), S.intro + 0.9); S.nameIn = Math.max(at('C02', '名字') + 0.05, S.fly0 + 0.55);
S.look = at('C02', '还时刻') - 0.05; S.grab = S.look + 0.35; S.step1 = S.grab + 0.45; S.pour0 = Math.max(at('C02', '需要') - 0.1, S.step1 + 0.05); S.pour1 = S.pour0 + 0.75;
S.c3 = vs('C03'); S.post = [at('C03', '学校') - 0.05, at('C03', '社区') - 0.05, at('C03', '社团') - 0.05]; S.star = at('C03', '最积极');
S.c4 = vs('C04'); S.band = at('C04', '这是') - 0.1; S.chest = at('C04', '该尽') - 0.15;
S.c5 = vs('C05'); S.ic = [at('C05', '天气') - 0.12, at('C05', '菜价') - 0.12, at('C05', '亲戚') - 0.12];
S.c6 = vs('C06'); S.news = at('C06', '问他们') - 0.1; S.spread = S.news + 0.3;
S.c7 = vs('C07'); S.intpIn = S.c7 - 0.75; S.isay = at('C07', '哲学') - 0.2;
S.def = [at('C07', '这种'), at('C07', '抽象'), at('C07', '话题')]; S.dots = at('C07', '沉默') - 0.12;
S.dim0 = vs('C08') - 0.75; S.cut = vs('C08') - 0.22; S.on = vs('C08') + 0.05;
S.same = at('C08', '同样') - 0.1; S.gold = at('C08', '权威'); S.sit = at('C08', '他们') - 0.05; S.note = at('C08', '认真听'); S.demo = at('C08', '还会') - 0.15; S.copy = at('C08', '照着');
S.c9 = vs('C09'); S.open = at('C09', '重视') - 0.1; S.nost = at('C09', '怀念') - 0.1; S.fut = at('C09', '说到') - 0.05; S.tree0 = S.fut + 0.25;
S.back0 = ve('C09') + 0.9; S.back1 = Math.min(S.back0 + 1.3, T1 - 0.9);

// ---------- 灯光状态 ----------
const house = t => {
  let v = lerp(0.3, 1, ss(t, T0, T0 + 0.7));
  v *= 1 - 0.22 * ss(t, ve('C07') + 0.1, ve('C07') + 0.5);           // 全场静：暗一档
  v = lerp(v, 0.06, ss(t, S.dim0, S.cut));                            // 熄灯
  if (t > S.cut) v = lerp(0.3, 0.95, ss(t, S.c9 - 0.3, S.c9 + 0.5));  // 舞台时观众席暗，C09 回暖
  if (t > S.tree0 - 0.4) v = lerp(v, 0.5, ss(t, S.tree0 - 0.4, S.tree0 + 0.6) * (1 - ss(t, S.back0 + 0.2, S.back1)));
  return v;
};
const stageOn = t => (t < S.cut ? 0 : ss(t, S.on - 0.05, S.on + 0.25) * (1 - 0.85 * ss(t, S.c9 - 0.3, S.c9 + 0.6)));
const lampOn = (t, i) => ss(t, T0 + 0.04 + i * 0.045, T0 + 0.22 + i * 0.045);

// ---------- 镜头：[时间, x0, z0, h, f, cy, pitch]，相邻两键之间缓入缓出 ----------
const CK = [
  [T0, 0.2, 4.1, 1.25, 1150, 700, 0.0], [T0 + 0.6, 0.15, 4.4, 1.28, 1150, 700, 0.0], [S.pull0, 0.1, 4.5, 1.3, 1150, 700, 0.0],
  [S.pull1, 0.0, 3.6, 3.6, 1000, 470, 0.36],                                     // C01 拉远：桌桌坐满
  [S.c2 + 0.75, 0.15, 4.95, 1.4, 1150, 720, 0.02], [S.look, 0.2, 5.05, 1.4, 1150, 720, 0.02],
  [S.pour0, 1.35, 5.75, 1.5, 1100, 700, 0.06], [S.c3 - 0.1, 1.4, 5.85, 1.5, 1100, 700, 0.06],
  [S.c3 + 0.6, -3.0, 4.55, 1.95, 1000, 700, 0.0], [S.c4 - 0.25, -2.95, 4.75, 1.95, 1000, 700, 0.0],   // 布告栏
  [S.c4 + 0.55, -2.0, 3.2, 1.5, 1080, 770, 0.02], [S.c5 - 0.1, -1.9, 3.45, 1.5, 1080, 770, 0.02],
  [S.c5 + 0.8, -1.45, 2.4, 1.75, 1050, 740, 0.1], [S.news, -1.5, 2.6, 1.75, 1050, 740, 0.1],
  [ve('C06') + 0.25, -0.9, 0.1, 3.0, 980, 620, 0.22],                           // C06 拉远：光流传满大厅
  [S.c7 + 0.3, -1.1, 2.7, 1.6, 1060, 760, 0.06], [S.cut, -1.1, 3.15, 1.6, 1060, 760, 0.06],
  [S.cut + 0.001, -0.55, 20.9, 1.45, 1100, 760, -0.04], [S.sit, -0.55, 21.3, 1.45, 1100, 760, -0.04],   // 熄灯里切到舞台
  [S.copy + 0.5, -0.4, 21.1, 1.55, 1060, 760, -0.03],
  [S.open + 0.3, -1.0, 22.15, 1.55, 1100, 820, 0.0], [S.fut, -1.05, 22.3, 1.55, 1100, 820, 0.0],
  [S.tree0, -1.1, 21.6, 1.6, 1060, 1000, 0.0],
];
for (let i = 1; i < CK.length; i++) if (CK[i][0] <= CK[i - 1][0]) CK[i][0] = CK[i - 1][0] + 0.001;
function camAt(t) {
  let i = 0; while (i < CK.length - 1 && t >= CK[i + 1][0]) i++;
  const a = CK[i], b = CK[Math.min(i + 1, CK.length - 1)], u = b === a ? 0 : easeInOut(prog(t, a[0], b[0])), v = k => lerp(a[k], b[k], u);
  const dr = 1 - ss(t, S.fut, S.tree0);
  return E.cam3({ cx: W / 2, cy: v(5), f: v(4), h: v(3) + Math.sin(t * 0.37) * 0.012 * dr, z0: v(2), x0: v(1) + Math.sin(t * 0.29) * 0.025 * dr, pitch: v(6) });
}

// ---------- 主角路线：[时间, X, Z] ----------
const HP = [[T0 - 1, 0.7, 8.0], [S.grab, 0.7, 8.0], [S.step1, 1.05, 9.2], [S.c3 + 0.5, 1.05, 9.2], [S.c3 + 2.2, 0.2, 6.6], [S.c4 - 0.95, 0.2, 6.6], [S.c4 + 0.05, -1.6, 6.0],
  [S.cut, -1.6, 6.0], [S.cut + 0.001, -1.1, 24.6], [T1 + 5, -1.1, 24.6]];
function route(t, P, hz = 2.6) {
  let i = 0; while (i < P.length - 2 && t >= P[i + 1][0]) i++;
  const a = P[i], b = P[i + 1], r = prog(t, a[0], b[0]), u = easeInOut(r), d = Math.hypot(b[1] - a[1], b[2] - a[2]);
  const moving = d > 0.05 && r > 0 && r < 1 && b[0] - a[0] > 0.05, ph = (t - a[0]) * hz * Math.PI * 2;
  return { X: lerp(a[1], b[1], u), Z: lerp(a[2], b[2], u), moving, left: b[1] < a[1], bob: moving ? Math.abs(Math.sin(ph)) * 7 : 0, hipB: moving ? Math.sin(ph) * 0.35 : 0, hipF: moving ? -Math.sin(ph) * 0.35 : 0 };
}
const ARM_DOWN = [1.2, 0.3], WAVE = [-2.0, 0], PRESENT = [-0.6, 0.35], CHEST = [0.8, -2.2], WRITE = [0.6, -1.4], TALK = [0.15, -0.6], POUR = [0.05, 0.0];
const am = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];

// ---------- 主角姿态 ----------
function heroState(t) {
  const w = route(t, HP), o = { cake: false, umbrella: true, mouth: 'grin', bob: w.bob, hipB: w.hipB, hipF: w.hipF }, pr = {};
  let arm = ARM_DOWN;
  if (w.moving) { o.flip = w.left; arm = [ARM_DOWN[0] + Math.sin(t * 16) * 0.22, ARM_DOWN[1]]; }
  if (t < S.c2 - 0.2) {                                   // C01 迎客：挥手 → 手掌一摊「这边请」 → 点头
    o.flip = true; o.eyes = 'happy';
    const wv = ss(t, S.wave - 0.2, S.wave + 0.15) * (1 - ss(t, S.give - 0.4, S.give - 0.1));
    const pv = ss(t, S.give - 0.3, S.give) * (1 - ss(t, S.joy, S.joy + 0.4));
    arm = am(am(ARM_DOWN, [WAVE[0], Math.sin(t * 10) * 0.35], wv), PRESENT, pv);
    o.nod = 0.5 * Math.max(0, Math.sin(prog(t, S.give, S.give + 0.5) * Math.PI)); o.glow = 0.35 * ss(t, S.joy, S.joy + 0.5);
  } else if (t < S.look) {                                // C02 听自我介绍 → 名牌飞进脑袋
    o.flip = true; o.look = [-0.6, 0]; o.eyes = t > S.nameIn ? 'happy' : 'open';
    const d = t - S.nameIn; if (d > 0 && d < 0.5) o.nod = -0.6 * Math.sin(d / 0.5 * Math.PI);
    o.glow = 0.5 * Math.exp(-Math.max(0, d) * 2) * (d > 0 ? 1 : 0);
  } else if (t < S.c3 + 0.5) {                            // 留意空杯 → 拿茶壶续上
    o.flip = false; o.look = [1, 0.4]; o.eyes = t < S.grab ? 'wide' : 'open';
    if (t > S.grab) { pr.pot = 1; arm = am(ARM_DOWN, POUR, ss(t, S.grab, S.grab + 0.25)); }
    const tilt = ss(t, S.pour0, S.pour0 + 0.2) * (1 - ss(t, S.pour1, S.pour1 + 0.25)); pr.tilt = tilt; arm = [arm[0] + 0.25 * tilt, arm[1]];
    if (t > S.pour1 + 0.2) { o.eyes = 'happy'; arm = am(arm, ARM_DOWN, ss(t, S.pour1 + 0.3, S.pour1 + 0.6)); pr.pot = 1 - ss(t, S.pour1 + 0.3, S.pour1 + 0.45); }
  } else if (t < S.c5 - 0.4) {                            // C04 袖章 → 手按胸口
    if (!w.moving) { o.flip = false; o.look = [0.3, 0]; }
    const c = ss(t, S.chest - 0.15, S.chest + 0.2);
    arm = am(arm, CHEST, c); pr.band = ss(t, S.band, S.band + 0.4);
    if (c > 0.3) { o.eyes = 'closed'; o.mouth = 'smile'; o.nod = 0.25 * c; }
    o.glow = 0.9 * c; o.warm = 0.4 * c; pr.chestGlow = c;
  } else if (t < S.cut) {                                 // C05–C07 和邻居聊天
    pr.band = 1;
    const k = t < S.ic[1] ? 0 : t < S.ic[2] ? 1 : 2;
    o.flip = t < S.c6 ? k === 1 : t < S.c7 - 0.2 ? false : false;
    const talk = (t > S.ic[0] - 0.3 && t < ve('C05')) || (t > S.news - 0.2 && t < S.news + 0.9) || (t > S.c7 - 0.3 && t < S.isay);
    const g = talk ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
    arm = am(ARM_DOWN, TALK, talk ? 0.4 + 0.6 * g : 0); o.bob = talk ? Math.abs(Math.sin(t * 9)) * 4 : 0;
    o.glow = 0.2 + 0.15 * ss(t, S.spread, S.spread + 0.4) * (1 - ss(t, ve('C06'), ve('C06') + 0.6));
    if (t > S.c6 && t < S.news) { o.look = [0.5, -0.3]; o.eyes = 'wide'; }
    if (t > S.isay - 0.1) { o.look = [0.8, -0.2]; }
    if (t > S.def[0]) { const u = ss(t, S.def[0], S.dots); o.mouth = u > 0.4 ? 'flat' : 'o'; o.eyes = 'wide'; o.lean = -0.05 * u; arm = am(arm, ARM_DOWN, u); o.bob = 0; o.glow = 0.3 * (1 - u); }
    if (t > ve('C07')) { o.eyes = 'open'; o.look = [0.2, 0.4]; o.gray = 0.15 * ss(t, ve('C07'), ve('C07') + 0.5); }
  } else if (t < S.c9 - 0.2) {                            // C08 台下：散漫 → 坐直 → 记笔记 → 跟着举手
    o.flip = false; o.look = [0.6, -0.5]; o.mouth = 'flat'; o.eyes = 'squint'; o.lean = 0.07; o.nod = -0.2; pr.band = 1;
    if (t > S.gold) { o.eyes = 'wide'; o.mouth = 'o'; }
    const up = ss(t, S.sit - 0.1, S.sit + 0.25); o.lean = lerp(0.07, -0.03, up); o.nod = lerp(-0.2, 0, up);
    if (t > S.note - 0.1) { const u = ss(t, S.note - 0.1, S.note + 0.15) * (1 - ss(t, S.copy - 0.15, S.copy)); arm = am(arm, [WRITE[0], WRITE[1] + Math.sin(t * 24) * 0.1], u); o.nod = 0.6 * u; o.look = [0.2, 1.2 * u]; pr.pen = u; o.mouth = 'flat'; }
    if (t > S.copy - 0.15) { const u = ss(t, S.copy - 0.15, S.copy + 0.15); arm = am(arm, [-1.4, -0.15], u); o.eyes = 'happy'; o.mouth = 'grin'; o.glow = 0.5 * u; o.nod = 0; o.look = [0.6, -0.6]; }
  } else {                                                // C09 老相册 → 担心
    o.flip = false; pr.band = 1; arm = [1.0, -0.2];
    const op = ss(t, S.open, S.open + 0.4); pr.album = op; o.book = op < 0.5; o.nod = 0.55 * op; o.look = [0.1, 1.1 * op]; o.eyes = 'happy'; o.mouth = 'smile';
    o.warm = 0.5 * ss(t, S.nost, S.nost + 0.5);
    const wr = ss(t, S.fut, S.fut + 0.35) * (1 - ss(t, S.back0 + 0.2, S.back1));
    if (wr > 0.3) { o.eyes = t > S.tree0 + 0.6 ? 'wide' : 'open'; o.mouth = 'frown'; o.brow = 1.3 * wr; o.look = [-0.2, -1.2]; o.nod = -0.35 * wr; o.warm = 0; o.gray = 0.25 * wr; }
    if (t > S.back1 - 0.4) { o.eyes = 'open'; o.mouth = 'smile'; }
  }
  o.rs = arm[0]; o.re = arm[1];
  o.dim = (o.dim || 0) + 0.45 * (1 - house(t)) * (t > S.cut && t < S.c9 ? 0.55 : 1);
  return { X: w.X, Z: w.Z, o, pr };
}

// ---------- 客人：四条通道（桌子内外两侧），从后墙两扇门走进来，近的座位先坐满 ----------
const TX = 2.6, TW = 0.75, TZ1 = 9.6, TZ2 = 24.2;           // 两张长桌 X=±2.6
const LANES = [-1.4, -3.8, 1.4, 3.8], SEATZ = [10.6, 12.4, 14.2, 16.0, 17.8, 19.6, 21.4, 23.2];
const GK = MB.ALL.filter(k => !/^esfj|intp-male|enfp-female|isfj-female|estj-female|enfp-male/.test(k));
const GUESTS = [];
SEATZ.forEach((Z, zi) => LANES.forEach((LX, li) => {
  if (li === 0 && zi === 0) return;                         // 留给小美
  GUESTS.push({ X: LX, Z, li, zi, key: li === 2 && zi === 0 ? 'istj-male' : GK[(zi * 5 + li * 7 + 3) % GK.length], ph: hash(zi * 9 + li) * 6 });
}));
GUESTS.forEach(g => { g.rk = g.zi * 4 + [1, 3, 0, 2][g.li] + hash(g.zi + g.li * 3) * 1.5; });
[...GUESTS].sort((a, b) => a.rk - b.rk).forEach((g, i) => { g.ta = T0 - 1.8 + i * 0.15; });
[...GUESTS].sort((a, b) => a.Z - b.Z || Math.abs(a.X) - Math.abs(b.X)).forEach((g, i) => { g.tj = S.joy + i * 0.045; });
const V = 3.0;
function mkPath(g, door, head) { const l1 = Math.hypot(head[0] - door[0], head[1] - door[1]), l2 = head[1] - g.Z; g.door = door; g.head = head; g.l1 = l1; g.len = l1 + l2; g.ts = g.ta - g.len / V; }
GUESTS.forEach(g => mkPath(g, [Math.sign(g.X) * 5.0, 29.6], [g.X, 27.4]));
const MEI = { X: -0.35, Z: 8.9, key: 'enfp-female', ta: S.c2 - 0.25, ph: 1.3 }; mkPath(MEI, [-5.0, 29.6], [-0.35, 27.4]);
function walker(g, t) {
  const s = (t - g.ts) * V; if (s < 0) return null;
  let X1, Z1; if (s < g.l1) { const u = s / g.l1; X1 = lerp(g.door[0], g.head[0], u); Z1 = lerp(g.door[1], g.head[1], u); }
  else { X1 = g.head[0]; Z1 = Math.max(g.Z, g.head[1] - (s - g.l1)); }
  const moving = s < g.len, ph = (t - g.ts) * 2.6 * Math.PI * 2;
  return { X: X1, Z: Z1, moving, a: ss(s, 0, 0.7), bobM: moving ? Math.abs(Math.sin(ph)) * 0.035 : 0 };
}
function meiPos(t) { const w = walker(MEI, t); if (!w) return null; if (t > S.c3 + 0.3) { const u = easeInOut(prog(t, S.c3 + 0.3, S.c3 + 1.5)); w.X = lerp(-0.35, -1.4, u); w.Z = lerp(8.9, 10.6, u); w.moving = u > 0 && u < 1; } return w; }

// 邻居（C05–C07）和 INTP：[key, 起点, 终点, 进场时间]
const NB = [['isfj-female', [-4.6, 6.9], [-2.85, 6.6], S.c5 - 0.95], ['estj-female', [1.4, 6.6], [-0.25, 6.55], S.c5 - 0.8], ['enfp-male', [0.9, 8.2], [-0.95, 7.75], S.c5 - 0.6]];
const INTP = ['intp-male', [2.0, 7.2], [0.6, 7.05], S.intpIn];
function npos(n, t) { const [, a, b, t0] = n, u = easeInOut(prog(t, t0, t0 + 0.85)), mv = u > 0 && u < 1, ph = (t - t0) * 2.6 * Math.PI * 2; return { X: lerp(a[0], b[0], u), Z: lerp(a[1], b[1], u), moving: mv, bobM: mv ? Math.abs(Math.sin(ph)) * 0.035 : 0 }; }

// ---------- 小物件 ----------
function smiley(ctx, x, y, r, a) {
  if (a <= 0.01 || r < 2) return;
  glow(ctx, x, y, r * 2.6, [255, 214, 110], 0.35 * a);
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r); g.addColorStop(0, '#fff2a6'); g.addColorStop(0.7, '#ffcc3a'); g.addColorStop(1, '#f0a020');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.strokeStyle = '#6a3a10'; ctx.lineWidth = Math.max(1.5, r * 0.13); ctx.lineCap = 'round';
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * r * 0.36, y - r * 0.12, r * 0.17, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  ctx.beginPath(); ctx.arc(x, y + r * 0.05, r * 0.5, Math.PI * 0.15, Math.PI * 0.85); ctx.stroke();
  ctx.restore();
}
function nameplate(ctx, str, x, y, s, a, rot = 0) {
  if (a <= 0.01) return;
  const w = (str.length * 40 + 44) * s, h = 64 * s;
  glow(ctx, x, y, w * 0.9, GOLDC, 0.3 * a);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#fbe3a0'); g.addColorStop(0.5, '#e7b955'); g.addColorStop(1, '#a87a2c');
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 4 * s, -h / 2 + 6 * s, w, h, 12 * s); ctx.fill();
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 12 * s); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.roundRect(-w / 2 + 6 * s, -h / 2 + 5 * s, w - 12 * s, h * 0.3, 8 * s); ctx.fill();
  K.text(ctx, str, 0, 14 * s, { size: 40 * s, weight: 700, color: [70, 44, 14], spacing: 0.08 });
  ctx.restore();
}
// 瓷杯：fill 0..1 茶水，warm 0..1 热气
function cup3(ctx, p, Xc, Zc, fill, warm, lt = 1) {
  if (p.depth(Zc, 0.8) < 0.7) return null;
  const b = p(Xc, 0.76, Zc), tp = p(Xc, 0.88, Zc), r = p.px(Zc, 0.048), ry = r * clamp(0.25 + (p.pitch || 0) + 0.3 * (p.h - 0.88) / p.depth(Zc, 0.8), 0.15, 0.6);
  ctx.save();
  const g = ctx.createLinearGradient(b[0] - r, 0, b[0] + r, 0); g.addColorStop(0, rgba(mix([150, 140, 130], [250, 244, 232], lt * 0.8))); g.addColorStop(0.4, rgba(mix([200, 190, 180], [255, 252, 244], lt))); g.addColorStop(1, rgba(mix([90, 80, 76], [190, 176, 160], lt)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(tp[0] - r, tp[1]); ctx.lineTo(b[0] - r * 0.78, b[1]); ctx.ellipse(b[0], b[1], r * 0.78, ry * 0.78, 0, Math.PI, 0, true); ctx.lineTo(tp[0] + r, tp[1]); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(mix([60, 52, 50], [236, 228, 214], lt)); ctx.beginPath(); ctx.ellipse(tp[0], tp[1], r, ry, 0, 0, 7); ctx.fill();
  ctx.fillStyle = fill > 0.02 ? rgba(mix([60, 34, 18], [200, 120, 50], fill)) : 'rgb(36,30,34)'; ctx.beginPath(); ctx.ellipse(tp[0], tp[1] + ry * 0.15, r * 0.82, ry * 0.7, 0, 0, 7); ctx.fill();
  ctx.restore();
  if (warm > 0.02) { glow(ctx, tp[0], tp[1], r * 2.5, [255, 180, 90], 0.35 * warm); for (let i = 0; i < 3; i++) glow(ctx, tp[0] + Math.sin(warm * 9 + i * 2) * r * 0.4, tp[1] - r * (0.8 + i * 0.9) - (warm * 30 % (r * 0.9)), r * (0.9 + i * 0.3), [255, 245, 230], 0.18 * warm * (1 - i * 0.25)); }
  return tp;
}
// 茶壶（屏幕坐标，s=像素/米），返回壶嘴
function teapot(ctx, x, y, s, rot, a) {
  if (a <= 0.01) return [x, y];
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  const R = 0.11 * s;
  ctx.fillStyle = 'rgb(46,92,110)'; ctx.beginPath(); ctx.moveTo(R * 0.6, -R * 0.1); ctx.quadraticCurveTo(R * 1.5, -R * 0.2, R * 1.9, -R * 0.95); ctx.lineTo(R * 1.75, -R * 1.05); ctx.quadraticCurveTo(R * 1.35, -R * 0.5, R * 0.6, -R * 0.55); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgb(40,80,96)'; ctx.lineWidth = R * 0.22; ctx.beginPath(); ctx.arc(-R * 1.0, -R * 0.2, R * 0.55, Math.PI * 0.55, Math.PI * 1.5); ctx.stroke();
  const g = ctx.createRadialGradient(-R * 0.3, -R * 0.4, R * 0.1, 0, 0, R * 1.1); g.addColorStop(0, 'rgb(150,214,226)'); g.addColorStop(0.6, 'rgb(70,150,170)'); g.addColorStop(1, 'rgb(34,80,96)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, R * 1.05, R * 0.85, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgb(232,200,120)'; ctx.fillRect(-R * 0.9, -R * 0.12, R * 1.8, R * 0.16);
  ctx.fillStyle = 'rgb(60,120,140)'; ctx.beginPath(); ctx.ellipse(0, -R * 0.82, R * 0.5, R * 0.16, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgb(232,200,120)'; ctx.beginPath(); ctx.arc(0, -R * 1.0, R * 0.14, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-R * 0.45, -R * 0.4, R * 0.25, R * 0.12, -0.5, 0, 7); ctx.fill();
  ctx.restore();
  const c = Math.cos(rot), sn = Math.sin(rot), sx = R * 1.85, sy = -R * 1.0;
  return [x + sx * c - sy * sn, y + sx * sn + sy * c];
}
// 红灯笼
function lantern(ctx, p, Xl, Yl, Zl, on, t, i) {
  const d = p.depth(Zl, Yl); if (d < 0.8) return;
  const c = p(Xl, Yl, Zl), m = p.px(Zl, 1, Yl), rx = 0.3 * m, ry = 0.26 * m, sw = Math.sin(t * 0.8 + i) * 0.03;
  const top = p(Xl, 5.2, Zl);
  ctx.save(); ctx.strokeStyle = 'rgba(30,18,16,0.8)'; ctx.lineWidth = Math.max(1, m * 0.008); ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(c[0], c[1] - ry); ctx.stroke(); ctx.restore();
  glow(ctx, c[0], c[1], rx * 4.2, [255, 120, 70], 0.2 * on); glow(ctx, c[0], c[1], rx * 1.8, [255, 170, 90], 0.25 * on);
  ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(sw);
  const g = ctx.createRadialGradient(-rx * 0.15, -ry * 0.1, rx * 0.05, 0, 0, rx);
  g.addColorStop(0, rgba(mix([120, 30, 26], [255, 236, 170], on))); g.addColorStop(0.45, rgba(mix([100, 24, 22], [240, 92, 46], on))); g.addColorStop(1, rgba(mix([60, 14, 14], [168, 34, 28], on)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.fill();
  ctx.strokeStyle = rgba(mix([50, 10, 10], [150, 30, 24], on), 0.7); ctx.lineWidth = Math.max(1, rx * 0.06);
  for (const k of [-0.62, -0.25, 0.25, 0.62]) { ctx.beginPath(); ctx.ellipse(0, 0, rx * Math.abs(k), ry, 0, k < 0 ? Math.PI * 0.5 : -Math.PI * 0.5, k < 0 ? Math.PI * 1.5 : Math.PI * 0.5); ctx.stroke(); }
  ctx.fillStyle = 'rgb(214,170,80)'; ctx.fillRect(-rx * 0.42, -ry - ry * 0.16, rx * 0.84, ry * 0.2); ctx.fillRect(-rx * 0.42, ry - ry * 0.04, rx * 0.84, ry * 0.2);
  ctx.fillStyle = rgba(mix([90, 20, 20], [230, 60, 40], on)); ctx.beginPath(); ctx.moveTo(-rx * 0.14, ry * 1.12); ctx.lineTo(rx * 0.14, ry * 1.12); ctx.lineTo(rx * 0.1, ry * 1.85); ctx.lineTo(-rx * 0.1, ry * 1.85); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// 长桌一段（按进深切段，和人一起按深度排序）
const zMin = (p, Y) => p.z0 + Math.max(0.3, ((Y - p.h) * Math.sin(p.pitch) + 0.1) / Math.cos(p.pitch));
function tableSeg(ctx, p, Xt, za, zb, first, lt, t) {
  const z0 = Math.max(za, zMin(p, 0.8)); if (z0 >= zb) return;
  const top = 0.76, cl = E.CLOTH, L = k => mix(cl, [24, 14, 16], clamp(1 - lt * k, 0, 1));
  const fogK = clamp((p.depth(zb) - 3) / 30, 0, 0.6);
  const F2 = c => mix(c, [30, 18, 22], fogK);
  const sideX = p.x0 < Xt ? Xt - TW : Xt + TW;
  E.poly(ctx, p, [[sideX, top, z0], [sideX, top, zb], [sideX, 0.04, zb], [sideX, 0.04, z0]], F2(L(0.55)));
  E.poly(ctx, p, [[Xt - TW, top, z0], [Xt + TW, top, z0], [Xt + TW, top, zb], [Xt - TW, top, zb]], F2(L(0.92)));
  if (first && za >= z0 - 0.001) E.poly(ctx, p, [[Xt - TW, top, za], [Xt + TW, top, za], [Xt + TW, 0.04, za], [Xt - TW, 0.04, za]], F2(L(0.7)));
  E.seg(ctx, p, [sideX, top - 0.02, z0], [sideX, top - 0.02, zb], [250, 230, 200], 0.25 * lt, Math.max(1, p.px(zb, 0.012)));
  // 桌上：两只盘子 + 蜡烛
  const zc = (za + zb) / 2; if (zc < z0 + 0.2) return;
  for (const s of [-1, 1]) {
    const q = p(Xt + s * TW * 0.5, top + 0.005, zc), r = p.px(zc, 0.16);
    ctx.save(); ctx.fillStyle = rgba(F2(mix([70, 60, 56], [252, 248, 238], lt))); ctx.translate(q[0], q[1]); ctx.scale(1, clamp(0.12 + Math.sin(p.pitch) + p.h / p.depth(zc) * 0.6, 0.12, 0.7)); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill();
    ctx.fillStyle = rgba(F2(mix([60, 40, 30], [214, 120, 70], lt)), 0.9); ctx.beginPath(); ctx.arc(0, 0, r * 0.45, 0, 7); ctx.fill(); ctx.restore();
  }
  const b = p(Xt, top, zc + 0.4), c = p(Xt, top + 0.2, zc + 0.4), w = Math.max(1.5, p.px(zc, 0.035));
  ctx.fillStyle = rgba(F2([240, 232, 214])); ctx.fillRect(b[0] - w / 2, c[1], w, b[1] - c[1]);
  E.bulb(ctx, c[0], c[1] - w, w * 0.7, CANDLE, (0.6 + 0.4 * lt) * (0.9 + 0.1 * Math.sin(t * 7 + zc)));
}

// ---------- 布告栏（立在左前方，正对镜头） ----------
const BX = -3.0, BZ = 7.5, BY0 = 1.05, BY1 = 2.85, BWm = 2.6;
const POSTC = [[86, 140, 210], [92, 170, 110], [160, 110, 200]];
const ICON = {
  school(ctx, x, y, w) { const s = w / 100; ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#f2e4c8'; ctx.fillRect(-36 * s, -8 * s, 72 * s, 38 * s); ctx.fillStyle = '#c4553e'; ctx.beginPath(); ctx.moveTo(-44 * s, -6 * s); ctx.lineTo(0, -34 * s); ctx.lineTo(44 * s, -6 * s); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a5236'; ctx.fillRect(-8 * s, 10 * s, 16 * s, 20 * s); ctx.fillStyle = '#7fb4e0'; for (const dx of [-26, 14]) ctx.fillRect(dx * s, 2 * s, 12 * s, 10 * s);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, -14 * s, 7 * s, 0, 7); ctx.fill(); ctx.fillStyle = '#555'; ctx.fillRect(-1 * s, -48 * s, 2.5 * s, 16 * s); ctx.fillStyle = '#e04a3a'; ctx.beginPath(); ctx.moveTo(1.5 * s, -48 * s); ctx.lineTo(16 * s, -43 * s); ctx.lineTo(1.5 * s, -38 * s); ctx.fill(); ctx.restore(); },
  town(ctx, x, y, w) { const s = w / 100; ctx.save(); ctx.translate(x, y);
    for (const [dx, hh, c] of [[-22, 30, '#e8c890'], [16, 38, '#f0d8a8']]) { ctx.fillStyle = c; ctx.fillRect((dx - 16) * s, (30 - hh) * s, 32 * s, hh * s); ctx.fillStyle = '#6a8e4e'; ctx.beginPath(); ctx.moveTo((dx - 20) * s, (32 - hh) * s); ctx.lineTo(dx * s, (14 - hh) * s); ctx.lineTo((dx + 20) * s, (32 - hh) * s); ctx.fill(); ctx.fillStyle = '#ffd772'; ctx.fillRect((dx - 5) * s, (40 - hh) * s, 10 * s, 9 * s); }
    ctx.fillStyle = '#3f7f3a'; ctx.beginPath(); ctx.arc(44 * s, 4 * s, 12 * s, 0, 7); ctx.fill(); ctx.fillStyle = '#6a4a30'; ctx.fillRect(42 * s, 10 * s, 4 * s, 20 * s); ctx.restore(); },
  choir(ctx, x, y, w) { const s = w / 100; ctx.save(); ctx.translate(x, y); ctx.fillStyle = '#4a3466'; ctx.strokeStyle = '#4a3466'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
    for (const [dx, dy] of [[-16, 18], [16, 10]]) { ctx.beginPath(); ctx.ellipse(dx * s, dy * s, 10 * s, 7.5 * s, -0.4, 0, 7); ctx.fill(); ctx.beginPath(); ctx.moveTo((dx + 8) * s, dy * s); ctx.lineTo((dx + 8) * s, (dy - 40) * s); ctx.stroke(); }
    ctx.lineWidth = 8 * s; ctx.beginPath(); ctx.moveTo(-8 * s, -22 * s); ctx.lineTo(24 * s, -30 * s); ctx.stroke(); ctx.restore(); },
};
const PICON = [ICON.school, ICON.town, ICON.choir];
function pin(ctx, x, y, r) { glow(ctx, x, y, r * 2, [255, 120, 100], 0.2); const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); g.addColorStop(0, '#ff9a8a'); g.addColorStop(1, '#b02a22'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
function star(ctx, x, y, r, a, rot = 0) {
  if (a <= 0.01) return; glow(ctx, x, y, r * 2.4, GOLDC, 0.45 * a);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); const g = ctx.createRadialGradient(-r * 0.2, -r * 0.3, 1, 0, 0, r); g.addColorStop(0, '#fff3b8'); g.addColorStop(1, '#e09a20');
  ctx.fillStyle = g; ctx.beginPath(); for (let i = 0; i < 10; i++) { const an = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; ctx.lineTo(Math.cos(an) * rr, Math.sin(an) * rr); } ctx.closePath(); ctx.fill(); ctx.restore();
}
function board(ctx, p, t, lt) {
  if (p.depth(BZ, 2) < 1.0) return;
  const A = p(BX - BWm / 2, BY1, BZ), Bq = p(BX + BWm / 2, BY0, BZ), bw = Bq[0] - A[0], bh = Bq[1] - A[1], m = p.px(BZ, 1, 2);
  if (A[0] > W + 50 || Bq[0] < -50) return;
  const D = c => mix(c, [12, 8, 12], clamp(1 - lt, 0, 0.85));
  for (const s of [-1, 1]) { const a = p(BX + s * BWm * 0.38, BY0, BZ), b = p(BX + s * BWm * 0.38, 0, BZ); ctx.fillStyle = rgba(D([70, 44, 30])); ctx.fillRect(a[0] - m * 0.04, a[1], m * 0.08, b[1] - a[1]); }
  E.contact(ctx, (A[0] + Bq[0]) / 2, p(BX, 0, BZ)[1], bw * 0.5, 0.4);
  const fr = m * 0.07;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(A[0] - fr + 8, A[1] - fr + 12, bw + fr * 2, bh + fr * 2);
  const wg = ctx.createLinearGradient(0, A[1] - fr, 0, Bq[1] + fr); wg.addColorStop(0, rgba(D([150, 98, 60]))); wg.addColorStop(1, rgba(D([88, 54, 34])));
  ctx.fillStyle = wg; ctx.fillRect(A[0] - fr, A[1] - fr, bw + fr * 2, bh + fr * 2);
  const cg = ctx.createRadialGradient(A[0] + bw * 0.4, A[1] + bh * 0.3, 10, A[0] + bw / 2, A[1] + bh / 2, bw * 0.75);
  cg.addColorStop(0, rgba(D([214, 160, 104]))); cg.addColorStop(1, rgba(D([150, 100, 62])));
  ctx.fillStyle = cg; ctx.fillRect(A[0], A[1], bw, bh);
  for (let i = 0; i < 9; i++) glow(ctx, A[0] + hash(i * 3.1) * bw, A[1] + hash(i * 5.7) * bh, bw * 0.12, [120, 70, 40], 0.12);   // 软木的深浅
  // 旧纸条（别人的，褪色）
  for (const [u, v, ww, hh, r] of [[0.03, 0.6, 0.13, 0.28, -0.06], [0.84, 0.08, 0.12, 0.2, 0.05], [0.86, 0.62, 0.11, 0.3, 0.04], [0.3, 0.04, 0.14, 0.12, -0.03], [0.58, 0.82, 0.16, 0.13, 0.02]]) { ctx.save(); ctx.translate(A[0] + u * bw, A[1] + v * bh); ctx.rotate(r); ctx.fillStyle = rgba(D([226, 214, 186]), 0.75); ctx.fillRect(0, 0, ww * bw, hh * bh); ctx.restore(); pin(ctx, A[0] + (u + ww / 2) * bw, A[1] + v * bh + 6, m * 0.018); }
  for (let i = 0; i < 3; i++) {
    const t0 = S.post[i]; if (t < t0 - 0.35) continue;
    const u = prog(t, t0 - 0.35, t0), e = easeOut(u), pop = t > t0 ? B.popIn(t, t0) : 1;
    const pw = bw * 0.24, ph = bh * 0.82, cx = A[0] + bw * (0.24 + 0.27 * i), cy = A[1] + bh * 0.5;
    const sc = lerp(2.3, 1, e) * (t > t0 ? 1 + (pop - 1) * 0.5 : 1), ox = (1 - e) * (i - 1) * 300, oy = (1 - e) * -260, rot = (1 - e) * (i - 1) * 0.5 + (i - 1) * 0.03;
    ctx.save(); ctx.globalAlpha *= clamp(u * 3, 0, 1); ctx.translate(cx + ox, cy + oy); ctx.rotate(rot); ctx.scale(sc, sc);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-pw / 2 + 6, -ph / 2 + 9, pw, ph);
    ctx.fillStyle = rgba(D([250, 244, 230])); ctx.fillRect(-pw / 2, -ph / 2, pw, ph);
    ctx.fillStyle = rgba(D(POSTC[i])); ctx.fillRect(-pw / 2, -ph / 2, pw, ph * 0.3);
    PICON[i](ctx, 0, -ph / 2 + ph * 0.17, pw * 0.62);
    // 他的照片
    const fx = -pw * 0.38, fy = -ph * 0.14, fw = pw * 0.76, fh = ph * 0.46, hl = ss(t, S.star + i * 0.17, S.star + i * 0.17 + 0.3);
    ctx.fillStyle = rgba(D([255, 255, 255])); ctx.fillRect(fx - 6, fy - 6, fw + 12, fh + 12);
    ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
    const bg = ctx.createLinearGradient(0, fy, 0, fy + fh); bg.addColorStop(0, rgba(D(mix(POSTC[i], [255, 255, 255], 0.55)))); bg.addColorStop(1, rgba(D(mix(POSTC[i], [255, 230, 190], 0.3)))); ctx.fillStyle = bg; ctx.fillRect(fx, fy, fw, fh);
    const hs = fh / (585 * 0.62), hk = hs * 585 / 394; ES.hero(ctx, -hk * 70, fy + hs * 570 + fh * 0.06, hs, { cake: false, umbrella: false, book: false, eyes: 'happy', rs: -2.0, re: 0.2, dim: clamp(1 - lt, 0, 0.8) });
    ctx.restore();
    if (hl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([255, 210, 130], 0.22 * hl); ctx.fillRect(fx, fy, fw, fh); ctx.restore(); }
    for (let k = 0; k < 2; k++) { ctx.fillStyle = rgba(D([200, 190, 176])); ctx.beginPath(); ctx.roundRect(-pw * 0.32, ph * 0.38 + k * ph * 0.06 - ph * 0.02, pw * (0.64 - k * 0.2), ph * 0.03, ph * 0.015); ctx.fill(); }
    ctx.restore();
    if (u >= 1) pin(ctx, cx, cy - ph / 2 + 10, m * 0.024);
    const st = ss(t, S.star + i * 0.17, S.star + i * 0.17 + 0.18), sp = 1 + 0.4 * Math.exp(-(t - S.star - i * 0.17) * 8) * (t > S.star + i * 0.17 ? 1 : 0);
    star(ctx, cx + pw * 0.36, cy - ph * 0.12, m * 0.075 * sp, st, 0.2);
  }
}

// ---------- 泡泡里的实物图标（从 EB3 复制改写） ----------
const BI = {
  sun(ctx, x, y, w) { const r = w * 0.2; ctx.save(); ctx.strokeStyle = '#f2a93b'; ctx.lineWidth = w * 0.06; ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 1.4, y + Math.sin(a) * r * 1.4); ctx.lineTo(x + Math.cos(a) * r * 1.95, y + Math.sin(a) * r * 1.95); ctx.stroke(); }
    const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r); g.addColorStop(0, '#ffe680'); g.addColorStop(1, '#f5a020'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore(); },
  veg(ctx, x, y, w) { const s = w / 120; ctx.save(); ctx.translate(x - 14 * s, y + 6 * s);
    for (const [dx, rot, c] of [[-13, -0.42, '#4c9a3c'], [13, 0.42, '#4c9a3c'], [0, 0, '#68b64c']]) { ctx.save(); ctx.translate(dx * s, -10 * s); ctx.rotate(rot); ctx.fillStyle = c; ctx.beginPath(); ctx.ellipse(0, -14 * s, 14 * s, 25 * s, 0, 0, 7); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#eef4e0'; ctx.beginPath(); ctx.moveTo(-13 * s, 34 * s); ctx.quadraticCurveTo(-17 * s, 6 * s, -8 * s, -6 * s); ctx.lineTo(8 * s, -6 * s); ctx.quadraticCurveTo(17 * s, 6 * s, 13 * s, 34 * s); ctx.closePath(); ctx.fill();
    ctx.translate(40 * s, 14 * s); ctx.rotate(0.22); B.rrect(ctx, -20 * s, -14 * s, 42 * s, 26 * s, 5 * s, [255, 210, 80]);
    K.text(ctx, '¥3', 1 * s, 7 * s, { size: 19 * s, family: 'Latin', weight: 700, color: [170, 40, 30] }); ctx.restore(); },
  family(ctx, x, y, w) { const s = w / 120; ctx.save(); ctx.translate(x, y + 8 * s);
    for (const [dx, hr, c, bw2] of [[-30, 11, '#5a7fc0', 22], [30, 11, '#e07a8a', 22], [0, 8, '#f2b440', 16]]) {
      ctx.fillStyle = c; ctx.beginPath(); ctx.roundRect((dx - bw2 / 2) * s, (hr === 8 ? 6 : -4) * s, bw2 * s, (hr === 8 ? 22 : 32) * s, 8 * s); ctx.fill();
      ctx.fillStyle = '#f0c8a0'; ctx.beginPath(); ctx.arc(dx * s, (hr === 8 ? -4 : -18) * s, hr * s, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#e04a5a'; ctx.beginPath(); const hx = 0, hy = -34 * s, hs = 9 * s; ctx.moveTo(hx, hy + hs * 0.9); ctx.bezierCurveTo(hx - hs * 1.6, hy - hs * 0.2, hx - hs * 0.5, hy - hs * 1.3, hx, hy - hs * 0.4); ctx.bezierCurveTo(hx + hs * 0.5, hy - hs * 1.3, hx + hs * 1.6, hy - hs * 0.2, hx, hy + hs * 0.9); ctx.fill(); ctx.restore(); },
  news(ctx, x, y, w) { const s = w / 120; ctx.save(); ctx.translate(x - 12 * s, y + 4 * s);
    ctx.fillStyle = '#e07a52'; ctx.beginPath(); ctx.moveTo(-34 * s, -6 * s); ctx.lineTo(0, -34 * s); ctx.lineTo(34 * s, -6 * s); ctx.closePath(); ctx.fill();
    B.rect(ctx, -26 * s, -6 * s, 52 * s, 38 * s, [244, 226, 196]); B.rect(ctx, -7 * s, 8 * s, 14 * s, 24 * s, [140, 96, 64]);
    B.rrect(ctx, 40 * s, -32 * s, 10 * s, 40 * s, 4 * s, [224, 74, 58]); ctx.fillStyle = '#e04a3a'; ctx.beginPath(); ctx.arc(45 * s, 20 * s, 6 * s, 0, 7); ctx.fill(); ctx.restore(); },
};
// 抽象符号：圆内三角 / ∞ / ∑（粗线）
function sym(ctx, i, x, y, r, col, lw) {
  ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  if (i === 0) { ctx.arc(x, y, r, 0, 7); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.87, y + r * 0.5); ctx.lineTo(x - r * 0.87, y + r * 0.5); ctx.closePath(); }
  else if (i === 1) { for (let k = 0; k <= 40; k++) { const a = k / 40 * Math.PI * 2, d = 1 + Math.sin(a) ** 2; const px = x + r * 1.1 * Math.cos(a) / d, py = y + r * 1.1 * Math.sin(a) * Math.cos(a) / d; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } }
  else { ctx.moveTo(x + r * 0.7, y - r); ctx.lineTo(x - r * 0.7, y - r); ctx.lineTo(x + r * 0.15, y); ctx.lineTo(x - r * 0.7, y + r); ctx.lineTo(x + r * 0.7, y + r); }
  ctx.stroke(); ctx.restore();
}
const geomIcon = (ctx, x, y, w) => { const s = w / 200; [-0.3, 0, 0.3].forEach((dx, i) => sym(ctx, i, x + dx * w, y - w * 0.13, 24 * s, INK, 5 * s)); K.text(ctx, '认识论？', x, y + 60 * s, { size: 40 * s, weight: 700, color: INK }); };

// ---------- 舞台上的专家：白大褂、眼镜、胸牌「专家」；raise 0..1 右手举起 ----------
function expert(ctx, x, y, m, raise, dim, t) {
  const D = c => mix(c, [10, 8, 14], dim), u = v => v * m, sw = Math.sin(t * 1.6) * u(0.01);
  ctx.save();
  E.contact(ctx, x, y, u(0.4), 0.5);
  for (const s of [-1, 1]) { ctx.fillStyle = rgba(D([46, 50, 66])); ctx.fillRect(x + s * u(0.1) - u(0.065), y - u(0.88), u(0.13), u(0.86)); ctx.fillStyle = rgba(D([30, 26, 30])); ctx.beginPath(); ctx.roundRect(x + s * u(0.1) - u(0.08) + s * u(0.02), y - u(0.06), u(0.16), u(0.07), u(0.03)); ctx.fill(); }
  const arm = (sx, sy, hx, hy) => { ctx.strokeStyle = rgba(D([236, 238, 242])); ctx.lineWidth = u(0.1); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy); ctx.stroke(); ctx.fillStyle = rgba(D([232, 192, 156])); ctx.beginPath(); ctx.arc(hx, hy, u(0.045), 0, 7); ctx.fill(); };
  arm(x - u(0.22), y - u(1.38), x - u(0.3), y - u(0.86) + sw);
  ctx.strokeStyle = rgba(D([120, 84, 50])); ctx.lineWidth = u(0.02); ctx.beginPath(); ctx.moveTo(x - u(0.3), y - u(0.86)); ctx.lineTo(x - u(0.62), y - u(1.25)); ctx.stroke();
  const cg = ctx.createLinearGradient(x - u(0.3), 0, x + u(0.3), 0); cg.addColorStop(0, rgba(D([196, 202, 214]))); cg.addColorStop(0.45, rgba(D([250, 250, 252]))); cg.addColorStop(1, rgba(D([206, 210, 222])));
  ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(x - u(0.23), y - u(1.46)); ctx.lineTo(x + u(0.23), y - u(1.46)); ctx.lineTo(x + u(0.29), y - u(0.62)); ctx.lineTo(x - u(0.29), y - u(0.62)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(D([110, 150, 200])); ctx.beginPath(); ctx.moveTo(x - u(0.08), y - u(1.46)); ctx.lineTo(x + u(0.08), y - u(1.46)); ctx.lineTo(x, y - u(1.12)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(D([190, 50, 50])); ctx.beginPath(); ctx.moveTo(x - u(0.02), y - u(1.42)); ctx.lineTo(x + u(0.02), y - u(1.42)); ctx.lineTo(x + u(0.03), y - u(1.2)); ctx.lineTo(x, y - u(1.15)); ctx.lineTo(x - u(0.03), y - u(1.2)); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(D([214, 60, 52])); ctx.fillRect(x - u(0.21), y - u(1.3), u(0.13), u(0.065));
  K.text(ctx, '专家', x - u(0.145), y - u(1.252), { size: u(0.042), weight: 700, color: D([255, 255, 255]) });
  const r = easeInOut(raise); arm(x + u(0.22), y - u(1.38), lerp(x + u(0.31), x + u(0.34), r), lerp(y - u(0.86), y - u(2.02), r) + sw);
  ctx.fillStyle = rgba(D([226, 186, 150])); ctx.fillRect(x - u(0.04), y - u(1.54), u(0.08), u(0.1));
  ctx.beginPath(); ctx.arc(x, y - u(1.64), u(0.115), 0, 7); ctx.fill();
  ctx.fillStyle = rgba(D([170, 170, 176])); ctx.beginPath(); ctx.arc(x, y - u(1.67), u(0.12), Math.PI * 1.02, Math.PI * 1.98); ctx.fill();
  ctx.strokeStyle = rgba(D([36, 36, 42])); ctx.lineWidth = Math.max(1.5, u(0.012));
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(x + s * u(0.045), y - u(1.645), u(0.032), 0, 7); ctx.stroke(); }
  ctx.beginPath(); ctx.moveTo(x - u(0.013), y - u(1.645)); ctx.lineTo(x + u(0.013), y - u(1.645)); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y - u(1.6), u(0.035), Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
  ctx.restore();
}

// ---------- 大厅：墙、窗、地毯、后墙舞台 / 幕布 / 投影屏 / 两扇门 ----------
const HW = 6.5, HT = 5.2, BACK = 30;
function hall(ctx, p, t, lt, sOn) {
  E.room(ctx, p, { hw: HW, ht: HT, back: BACK, near: zMin(p, HT), wall: [104, 58, 50], floor: [112, 70, 44], ceil: [44, 28, 28], light: 0.25 + 0.75 * lt, planks: 0, stripe: false });
  const Lc = (c, k = 1) => mix(c, [8, 5, 9], clamp(1 - (0.25 + 0.75 * lt) * k, 0, 1)), zn = zMin(p, 0);
  // 墙裙（深木）
  for (const s of [-1, 1]) E.poly(ctx, p, [[s * HW, 0, zn], [s * HW, 1.0, zn], [s * HW, 1.0, BACK], [s * HW, 0, BACK]], Lc([70, 40, 30], 0.7));
  E.poly(ctx, p, [[-HW, 0, BACK - 0.01], [HW, 0, BACK - 0.01], [HW, 1.0, BACK - 0.01], [-HW, 1.0, BACK - 0.01]], Lc([70, 40, 30], 0.75));
  // 侧墙高窗：夜色 + 窗框 + 壁灯
  for (const Zw of [12, 16.5, 21, 25.5]) for (const s of [-1, 1]) {
    if (p.depth(Zw) < 1.5) continue;
    const q = (Y, Z) => [s * (HW - 0.01), Y, Z];
    E.poly(ctx, p, [q(1.55, Zw - 0.12), q(4.15, Zw - 0.12), q(4.15, Zw + 2.12), q(1.55, Zw + 2.12)], Lc([60, 36, 28], 0.8));
    E.poly(ctx, p, [q(1.7, Zw), q(4.0, Zw), q(4.0, Zw + 2), q(1.7, Zw + 2)], mix([22, 30, 62], [40, 54, 100], 0.4));
    const c = p(s * HW, 2.85, Zw + 1); glow(ctx, c[0], c[1], p.px(Zw + 1, 1.3), [110, 140, 220], 0.16);
    for (let k = 0; k < 4; k++) { const cc = p(s * HW, 2.0 + hash(Zw * 3 + k + s) * 0.9, Zw + 0.3 + hash(Zw + k * 7 + s) * 1.4); glow(ctx, cc[0], cc[1], p.px(Zw, 0.12), [255, 200, 130], 0.5); }
    E.poly(ctx, p, [q(2.82, Zw), q(2.9, Zw), q(2.9, Zw + 2), q(2.82, Zw + 2)], Lc([60, 36, 28], 0.8));
    E.poly(ctx, p, [q(1.7, Zw + 0.96), q(4.0, Zw + 0.96), q(4.0, Zw + 1.04), q(1.7, Zw + 1.04)], Lc([60, 36, 28], 0.8));
    const sc = p(s * (HW - 0.05), 3.2, Zw + 2.25); glow(ctx, sc[0], sc[1], p.px(Zw + 2.25, 0.9), WARM, 0.22 * lt); glow(ctx, sc[0], sc[1], p.px(Zw + 2.25, 0.12), [255, 236, 200], 0.7 * lt);
  }
  // 中间红地毯（金边）
  E.poly(ctx, p, [[-0.85, 0.004, zn], [0.85, 0.004, zn], [0.85, 0.004, 26], [-0.85, 0.004, 26]], Lc([130, 34, 36], 0.85));
  for (const s of [-1, 1]) E.poly(ctx, p, [[s * 0.85, 0.006, zn], [s * 0.97, 0.006, zn], [s * 0.97, 0.006, 26], [s * 0.85, 0.006, 26]], Lc([200, 150, 70], 0.8));
  // 两扇门：门外暖光
  for (const s of [-1, 1]) {
    E.poly(ctx, p, [[s * 5 - 0.85, 0, BACK - 0.02], [s * 5 + 0.85, 0, BACK - 0.02], [s * 5 + 0.85, 2.85, BACK - 0.02], [s * 5 - 0.85, 2.85, BACK - 0.02]], Lc([60, 36, 26], 0.8));
    E.poly(ctx, p, [[s * 5 - 0.7, 0, BACK - 0.03], [s * 5 + 0.7, 0, BACK - 0.03], [s * 5 + 0.7, 2.7, BACK - 0.03], [s * 5 - 0.7, 2.7, BACK - 0.03]], [255, 214, 150]);
    const c = p(s * 5, 1.3, BACK); glow(ctx, c[0], c[1], p.px(BACK, 2.2), [255, 200, 130], 0.3); E.pool(ctx, p, s * 5, BACK - 1.6, 2.2, [255, 200, 130], 0.35);
  }
  // 舞台：台面 + 台口 + 两侧红幕 + 顶幔 + 投影屏
  const so = 0.25 + 0.75 * lt;
  E.poly(ctx, p, [[-3.9, 0.6, 26], [3.9, 0.6, 26], [3.9, 0.6, BACK], [-3.9, 0.6, BACK]], mix(Lc([120, 78, 48]), [200, 150, 100], 0.45 * sOn));
  E.poly(ctx, p, [[-3.9, 0, 26], [3.9, 0, 26], [3.9, 0.6, 26], [-3.9, 0.6, 26]], Lc([66, 38, 26], 0.8));
  E.seg(ctx, p, [-3.9, 0.6, 26], [3.9, 0.6, 26], [230, 180, 100], 0.6 * so, Math.max(1.5, p.px(26, 0.025)));
  const scr = sOn > 0.01 ? mix([40, 44, 56], [226, 236, 250], sOn) : Lc([40, 42, 50], 0.6);
  E.poly(ctx, p, [[-1.3, 1.9, BACK - 0.02], [2.5, 1.9, BACK - 0.02], [2.5, 4.1, BACK - 0.02], [-1.3, 4.1, BACK - 0.02]], scr);
  if (sOn > 0.01) { const c = p(0.6, 3.0, BACK); glow(ctx, c[0], c[1], p.px(BACK, 3.2), [180, 210, 255], 0.25 * sOn); }
  for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
    const x0 = s * (2.7 + i * 0.2), x1 = s * (2.7 + (i + 1) * 0.2), sh = i % 2 ? 0.75 : 1;
    E.poly(ctx, p, [[x0, 0.6, BACK - 0.05], [x1, 0.6, BACK - 0.05], [x1, 5.1, BACK - 0.05], [x0, 5.1, BACK - 0.05]], mix(Lc([150, 26, 34].map(v => v * sh)), [220, 70, 70], 0.25 * sOn));
  }
  E.poly(ctx, p, [[-3.95, 4.45, BACK - 0.06], [3.95, 4.45, BACK - 0.06], [3.95, 5.15, BACK - 0.06], [-3.95, 5.15, BACK - 0.06]], Lc([170, 34, 40], 0.9));
  E.seg(ctx, p, [-3.95, 4.45, BACK - 0.07], [3.95, 4.45, BACK - 0.07], [230, 180, 90], 0.8 * so, Math.max(1.5, p.px(BACK, 0.04)));
  const st = p(0, 2.6, BACK); glow(ctx, st[0], st[1], p.px(BACK, 4.5), [255, 170, 110], 0.12 * lt + 0.1 * sOn);
}

// 投影屏上的同一组符号（权威一开口就变金）
function screenSyms(ctx, p, t, sOn) {
  if (t < S.same || sOn < 0.02) return;
  const a = ss(t, S.same, S.same + 0.3) * sOn, g = ss(t, S.gold, S.gold + 0.3), col = mix(INK, GOLDC, g), r = p.px(BACK, 0.3), lw = p.px(BACK, 0.07);
  [-0.15, 0.6, 1.35].forEach((Xs, i) => { const c = p(Xs, 3.35, BACK - 0.03); ctx.save(); ctx.globalAlpha *= a; if (g > 0) glow(ctx, c[0], c[1], r * 2.2, GOLDC, 0.55 * g); sym(ctx, i, c[0], c[1], r, col, lw * (1 + 0.5 * g)); ctx.restore(); });
  const c = p(0.6, 2.25, BACK - 0.03); K.text(ctx, '认识论？', c[0], c[1], { size: p.px(BACK, 0.34), weight: 700, color: mix(INK, [190, 120, 20], g), alpha: a });
  if (t > S.gold && t < S.gold + 1.0) { const d = t - S.gold, m = p(0.6, 3.2, BACK); for (let i = 0; i < 22; i++) { const an = i / 22 * 6.283, rr = p.px(BACK, 0.3 + d * 3.2 * (0.6 + hash(i) * 0.6)); glow(ctx, m[0] + Math.cos(an) * rr, m[1] + Math.sin(an) * rr * 0.7, p.px(BACK, 0.1), GOLDC, 0.7 * (1 - d)); } }
}
// 老相册（打开的两页，照片发暖光）
function album(ctx, x, y, m, op, warm, flip) {
  if (op <= 0.01) return;
  const w = 0.5 * m, h = 0.32 * m, sx = lerp(0.15, 1, easeOut(op));
  ctx.save(); ctx.translate(x + (flip ? -1 : 1) * 0.04 * m, y - 0.02 * m); ctx.scale(sx, 1); ctx.rotate(-0.06);
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(-w / 2 + 6, -h / 2 + 9, w, h);
  ctx.fillStyle = 'rgb(110,58,40)'; ctx.beginPath(); ctx.roundRect(-w / 2 - 0.015 * m, -h / 2 - 0.015 * m, w + 0.03 * m, h + 0.03 * m, 0.02 * m); ctx.fill();
  for (const s of [-1, 1]) {
    const g = ctx.createLinearGradient(0, 0, s * w / 2, 0); g.addColorStop(0, 'rgb(196,176,140)'); g.addColorStop(0.2, 'rgb(236,222,192)'); g.addColorStop(1, 'rgb(244,232,206)');
    ctx.fillStyle = g; ctx.fillRect(s < 0 ? -w / 2 : 0, -h / 2, w / 2, h);
    for (let k = 0; k < 2; k++) { const px = s * w * (0.25), py = -h * 0.22 + k * h * 0.44; F.photo(ctx, px, py, 0.27 * m, 1, 0.85, (s + 2) * 3 + k); }
  }
  ctx.restore();
  if (warm > 0.01) { glow(ctx, x, y, 0.55 * m, WARM, 0.35 * warm); glow(ctx, x, y - 0.1 * m, 0.25 * m, [255, 236, 200], 0.3 * warm); }
}
// 袖章：套在右上臂（esf.js 的上臂从肩 [270,182] 到肘 [267,258]）
const rotAbout = (q, c, r) => { const cs = Math.cos(r), sn = Math.sin(r), dx = q[0] - c[0], dy = q[1] - c[1]; return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs]; };
function armband(ctx, foot, k, flip, rs, u, hand, bobv) {
  if (u <= 0.01) return;
  const map = q => { const r = rotAbout(q, [270, 182], rs); return [foot[0] + (r[0] - 150) * k * (flip ? -1 : 1), foot[1] + (r[1] - 394 - bobv) * k]; };
  const A = map([269, 208]), Bq = map([268, 236]), c0 = [(A[0] + Bq[0]) / 2, (A[1] + Bq[1]) / 2], e = easeOut(u);
  const c = [lerp(hand[0], c0[0], e), lerp(hand[1], c0[1], e)], ang = Math.atan2(Bq[1] - A[1], Bq[0] - A[0]);
  ctx.save(); ctx.translate(c[0], c[1]); ctx.rotate(ang);
  const L = 38 * k, Wd = 56 * k;
  const g = ctx.createLinearGradient(0, -Wd / 2, 0, Wd / 2); g.addColorStop(0, '#9e1f22'); g.addColorStop(0.5, '#e6453a'); g.addColorStop(1, '#8a1a1e');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-L / 2, -Wd / 2, L, Wd, 5 * k); ctx.fill();
  ctx.fillStyle = '#f2c84a'; ctx.fillRect(-L / 2, -Wd * 0.08, L, Wd * 0.16);
  ctx.restore();
  if (u < 1) glow(ctx, c[0], c[1], 60 * k, [255, 200, 120], 0.5 * (1 - u));
  else glow(ctx, c[0], c[1], 40 * k, [255, 120, 90], 0.15);
}

// ---------- 灯笼、灯串、念头树 ----------
const LAMPS = [];
[11, 15, 19, 23].forEach(Z => [-TX, TX].forEach(Xl => LAMPS.push([Xl, 3.7, Z])));
[9, 13, 17, 21, 25].forEach(Z => LAMPS.push([0, 4.1, Z]));
LAMPS.sort((a, b) => a[2] - b[2]);
const STRINGS = [7.5, 11.5, 15.5, 19.5, 23.5, 27.2].map((Z, i) => [[-HW + 0.05, 4.8, Z], [HW - 0.05, 4.8, Z + (i % 2 ? -2 : 2)]]);
const pT = camAt(S.tree0 + 0.5), HTOP = pT(-1.1, 1.95, 24.6);
const RX = [clamp(HTOP[0] + 20, 380, 700), clamp(HTOP[1] - 330, 520, 700)];
const THINK = makeTree({
  root: '', bubble: false, radial: true, family: 'Serif', rootXY: RX, seed: 23, maxDepth: 7, len: 120,
  t0: S.tree0, growEnd: ve('C09') + 0.3,
  bounds: [20, 110, W - 20, 1010], labelBox: [30, 200, W - 60, 1000], ellipse: [560, 640],
  colors: { near: [250, 246, 240], mid: [255, 178, 196], far: [240, 84, 128], bad: [255, 110, 146] },
  gen1: [['下雨了', [RX[0] - 190, RX[1] - 140], true], ['涨价了', [RX[0] + 190, RX[1] - 150], true], ['生病了', [RX[0] - 200, RX[1] + 120], true], ['', [RX[0] + 190, RX[1] + 120], true]],
  labels: [['出事了', 3, 1, 0.5, 'bad']],
  filler: [],
});
function thoughtPuffs(ctx, head, a) {
  if (a <= 0.01) return;
  for (let i = 0; i < 3; i++) { const u = (i + 1) / 4, x = lerp(head[0], RX[0], u), y = lerp(head[1], RX[1] + 60, u); glow(ctx, x, y, 40 + i * 14, [250, 246, 240], 0.25 * a); ctx.fillStyle = rgba([250, 248, 242], 0.92 * a); ctx.beginPath(); ctx.arc(x, y, 12 + i * 8, 0, 7); ctx.fill(); }
  glow(ctx, RX[0], RX[1], 120, [255, 230, 240], 0.3 * a); glow(ctx, RX[0], RX[1], 36, [255, 255, 255], 0.6 * a);
}
// 怀念：照片从相册飘起来
const MEM = [[-300, -420, -0.12], [170, -520, 0.1], [-120, -700, 0.05], [330, -330, -0.08]];

let FR = { t: -1 };
function life(t, t0, t1, fade = 0.3) {
  if (t < t0) return null; const g = ss(t, t1, t1 + 0.2), a = 1 - ss(t, t1 + 0.2, t1 + 0.2 + fade);
  if (a <= 0.005) return null; return { a: a * Math.min(1, (t - t0) / 0.1), gray: g, pop: Math.max(0.02, B.popIn(t, t0)) };
}

// ---------- 主画面 ----------
function draw(ctx, t) {
  const p = camAt(t), lt = house(t), sOn = stageOn(t), fr = { t, p };
  ctx.save();
  hall(ctx, p, t, lt, sOn);
  screenSyms(ctx, p, t, sOn);
  // 灯串（近的先亮）+ 灯笼地上的光
  STRINGS.forEach(([A, Bq], i) => { if (Math.min(A[2], Bq[2]) < zMin(p, 4.8) + 0.6) return; E.bulbs(ctx, p, A, Bq, 13, 0.4, t, (k, u) => lampOn(t, i * 2.2 + u * 2) * (0.2 + 0.8 * lt)); });
  LAMPS.forEach((L, i) => { if (p.depth(L[2]) > 1.2) E.pool(ctx, p, L[0], L[2], 1.7, [255, 160, 96], 0.2 * lampOn(t, i) * lt); });
  if (sOn > 0.01) { const a = p(1.3, 5.1, 26.6), b = p(1.3, 0.6, 26.6); E.cone(ctx, a[0], a[1], b[1], p.px(26.6, 0.3), p.px(26.6, 1.9), [255, 236, 196], 0.17 * sOn); E.pool(ctx, p, 1.3, 26.6, 1.4, [255, 236, 196], 0.4 * sOn); }
  const DR = [], add = (Z, f) => DR.push({ Z, f });
  // 长桌
  for (const Xt of [-TX, TX]) for (let z = TZ1; z < TZ2 - 0.01; z += 1.8) { const za = z, zb = Math.min(TZ2, z + 1.8); add((za + zb) / 2, () => tableSeg(ctx, p, Xt, za, zb, za === TZ1, lt, t)); }
  // 空杯和茶壶（C02）
  const cupFill = ss(t, S.pour0 + 0.15, S.pour1), hs = heroState(t);
  add(10.0, () => {
    const tp = cup3(ctx, p, 1.98, 10.6, cupFill, cupFill * (1 - ss(t, S.c3 + 2, S.c3 + 3)), lt); fr.cup = tp;
    if (tp && t > S.look - 0.1 && t < S.pour0 + 0.2) { const k = ss(t, S.look - 0.1, S.look + 0.2) * (1 - ss(t, S.pour0, S.pour0 + 0.2)), pl = 0.6 + 0.4 * Math.sin((t - S.look) * 12); glow(ctx, tp[0], tp[1], p.px(10.6, 0.22), COOL, 0.5 * k * pl); }
    if (!hs.pr.pot && t < S.grab + 0.1) { const q = p(2.05, 0.76, 9.85); teapot(ctx, q[0], q[1] - p.px(9.85, 0.09), p.px(9.85, 1), 0, 1); }
  });
  // 灯笼
  LAMPS.forEach((L, i) => add(L[2] - 0.05, () => lantern(ctx, p, L[0], L[1], L[2], lampOn(t, i) * (0.15 + 0.85 * lt), t, i)));
  // 布告栏
  add(BZ, () => board(ctx, p, t, lt));
  // 客人
  const heads = [], smiles = [];
  for (const g of GUESTS) {
    const w = walker(g, t); if (!w || p.depth(w.Z) < (t > S.cut ? 2.8 : 0.9)) continue;
    add(w.Z, () => {
      const fd = clamp((p.depth(w.Z) - 3) / 26, 0, 0.7), d = t - g.tj, jump = d > 0 && d < 0.35 ? Math.sin(d / 0.35 * Math.PI) * 0.09 : 0;
      const face = w.moving ? (w.X < g.head[0] - 0.01 ? true : w.X > g.head[0] + 0.01 ? false : g.X > 0) : (Math.abs(g.X) < 2 ? g.X < 0 : g.X > 0);
      const r = E.folk3(ctx, p, g.key, w.X, w.Z, { a: w.a, flip: face, dim: fd * 0.75 + (1 - lt) * 0.6, warm: 0.25 * lt, bob: p.px(w.Z, w.bobM + jump + Math.abs(Math.sin(t * 1.3 + g.ph)) * 0.008), shadow: 0.35 });
      heads.push({ g, r, Z: w.Z });
      const sa = ss(t, g.tj, g.tj + 0.15) * (1 - ss(t, g.tj + 1.2, g.tj + 1.5));
      if (sa > 0) smiles.push([r.top[0], r.top[1] - p.px(w.Z, 0.28) - p.px(w.Z, 0.1) * B.popIn(t, g.tj), Math.max(13, p.px(w.Z, 0.19)) * B.popIn(t, g.tj), sa * (1 - fd * 0.3)]);
    });
  }
  // 小美
  const mw = meiPos(t);
  if (mw && p.depth(mw.Z) > 0.9) add(mw.Z, () => { const r = E.folk3(ctx, p, MEI.key, mw.X, mw.Z, { a: mw.a, flip: !mw.moving || mw.X > -0.36, dim: (1 - lt) * 0.6 + clamp((p.depth(mw.Z) - 3) / 26, 0, 0.7) * 0.75, warm: 0.3, bob: p.px(mw.Z, mw.bobM), lean: t > S.intro && t < S.fly0 ? 0.05 : 0 }); fr.mei = r.top; });
  // 邻居 + INTP（C05–C07）
  const nbTop = [];
  if (t > S.c5 - 1 && t < S.cut) {
    NB.forEach((n, i) => {
      const q = npos(n, t); if (p.depth(q.Z) < 0.9) return;
      const near = ss(t, S.spread + i * 0.12, S.spread + i * 0.12 + 0.3) * (1 - ss(t, ve('C06') + 0.2, ve('C06') + 0.8)), side = q.X < hs.X ? 1 : -1;
      const nod = S.ic.reduce((v, s0) => v + (t > s0 + 0.2 && t < s0 + 0.6 ? Math.sin((t - s0 - 0.2) * 16) * 0.02 : 0), 0);
      const quiet = ss(t, S.def[0], S.dots);
      add(q.Z, () => { const r = E.folk3(ctx, p, n[0], q.X + side * 0.12 * near, q.Z, { flip: side < 0, lean: side * 0.1 * near, bob: p.px(q.Z, q.bobM + Math.abs(nod)), warm: 0.3 * lt, inner: 0.5 * near, gray: 0.3 * quiet, dim: (1 - lt) * 0.5 }); nbTop[i] = r.top; });
    });
    if (t > S.intpIn) { const q = npos(INTP, t); add(q.Z, () => { const r = E.folk3(ctx, p, INTP[0], q.X, q.Z, { flip: true, bob: p.px(q.Z, q.bobM), warm: 0.2 * lt, dim: (1 - lt) * 0.5 }); fr.intp = r.top; }); }
  }
  // 主角
  add(hs.Z, () => {
    const o = hs.o, Hh = E.hero3(ctx, p, hs.X, hs.Z, o), m = p.px(hs.Z, 1), foot = p(hs.X, 0, hs.Z); fr.hero = Hh; fr.hm = m;
    if (hs.pr.chestGlow > 0.01) { const c = hs.pr.chestGlow, d = Math.max(0, t - S.chest - 0.1); glow(ctx, Hh.chest[0], Hh.chest[1], m * (0.5 + 0.9 * clamp(d / 0.8, 0, 1)), WARM, 0.35 * c * (1 - 0.6 * clamp(d / 0.8, 0, 1))); glow(ctx, Hh.chest[0], Hh.chest[1], m * 0.18, [255, 240, 210], 0.5 * c); }
    if (hs.pr.band) armband(ctx, foot, Hh.k, o.flip, o.rs, hs.pr.band, Hh.hand, o.bob || 0);
    if (hs.pr.pot > 0.01) fr.spout = teapot(ctx, Hh.hand[0] + m * 0.06, Hh.hand[1] - m * 0.02, m, 0.95 * (hs.pr.tilt || 0), hs.pr.pot);
    if (hs.pr.pen > 0.01) { ctx.save(); ctx.globalAlpha *= hs.pr.pen; ctx.strokeStyle = 'rgb(50,50,60)'; ctx.lineWidth = m * 0.02; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(Hh.hand[0], Hh.hand[1]); ctx.lineTo(Hh.hand[0] - m * 0.07, Hh.hand[1] + m * 0.09); ctx.stroke(); ctx.restore(); }
    if (hs.pr.album > 0.01) album(ctx, Hh.book[0], Hh.book[1], m, hs.pr.album, ss(t, S.nost - 0.2, S.nost + 0.4) * (1 - ss(t, S.fut, S.fut + 0.4)), o.flip);
  });
  // 专家
  if (t > S.cut) add(26.6, () => { const q = p(1.3, 0.6, 26.6); expert(ctx, q[0], q[1], p.px(26.6, 1, 1.5), ss(t, S.demo, S.demo + 0.35), clamp(1 - sOn, 0, 0.85), t); fr.exp = q; });
  DR.sort((a, b) => b.Z - a.Z).forEach(d => d.f());
  heads.sort((a, b) => a.Z - b.Z); fr._nb = nbTop[0];

  // ---------- 效果层 ----------
  ctx.save(); ctx.globalCompositeOperation = 'source-over';
  for (const s of smiles) smiley(ctx, s[0], s[1], s[2], s[3]);
  ctx.restore();
  const Hh = fr.hero;
  // C01：亮灯时近处一道暖光扫过（入场）
  if (t < T0 + 0.9) { const u = prog(t, T0, T0 + 0.9); glow(ctx, W * 0.5, lerp(200, 900, u), 700, WARM, 0.2 * Math.sin(u * Math.PI)); }
  // C02：倒茶的水流
  if (fr.spout && fr.cup && t > S.pour0 + 0.05 && t < S.pour1 + 0.1) {
    const a = fr.spout, b = fr.cup, k = ss(t, S.pour0 + 0.05, S.pour0 + 0.15) * (1 - ss(t, S.pour1 - 0.05, S.pour1 + 0.1)), pts = [];
    for (let i = 0; i <= 14; i++) { const u = i / 14; pts.push([lerp(a[0], b[0], u) + Math.sin(u * Math.PI) * 18, lerp(a[1], b[1], u * u)]); }
    K.glowLine(ctx, pts, [255, 170, 80], 0.9 * k, Math.max(4, fr.hm * 0.014), 3);
    for (let i = 0; i < 6; i++) { const u = (t * 2.5 + i / 6) % 1, q = pts[Math.floor(u * 14)]; glow(ctx, q[0], q[1], 14, [255, 220, 150], 0.6 * k); }
  }
  // C06：新鲜事从他头上像光一样传到每个人耳边
  if (Hh && t > S.spread - 0.05 && t < ve('C06') + 1.0) {
    const A0 = [Hh.top[0], Hh.top[1] + 30], fade = 1 - ss(t, ve('C06') + 0.35, ve('C06') + 0.95);
    const tg = nbTop.filter(Boolean).map(q => [q[0], q[1] + 40]).concat(heads.filter(h => h.r.head[1] < 1250 && h.r.head[0] > -50 && h.r.head[0] < W + 50).slice(0, 12).map(h => h.r.head));
    tg.forEach((B2, i) => { const d = i * 0.09, reach = ss(t, S.spread + d, S.spread + d + 0.5); const A = [A0[0] + Math.cos(i * 2.4) * 46, A0[1] + Math.sin(i * 2.4) * 30]; F.flow(ctx, A, B2, t, { reach, a: fade * (i < 3 ? 0.8 : 0.55), r: i < 3 ? 8 : 5, n: i < 3 ? 18 : 10, lift: 0.28, seed: i * 5, rate: 0.7, c: [255, 214, 140] }); if (reach > 0.98) glow(ctx, B2[0], B2[1], i < 3 ? 70 : 34, [255, 214, 140], 0.35 * fade); });
  }
  // C08：一枚金色符号从屏幕飞进他的本子
  if (Hh && t > S.note - 0.1 && t < S.note + 0.8) {
    const a0 = p(0.6, 3.35, BACK), u = easeInOut(prog(t, S.note - 0.1, S.note + 0.6)), x = lerp(a0[0], Hh.book[0], u), y = lerp(a0[1], Hh.book[1], u) - Math.sin(u * Math.PI) * 160;
    glow(ctx, x, y, 60, GOLDC, 0.5 * (1 - u * 0.5)); sym(ctx, 2, x, y, lerp(30, 16, u), GOLDC, lerp(8, 5, u));
    if (u >= 1) glow(ctx, Hh.book[0], Hh.book[1], 90, GOLDC, 0.5 * (1 - prog(t, S.note + 0.6, S.note + 0.8)));
  }
  // C08 照着做：举手时金光一闪
  if (Hh && t > S.copy && t < S.copy + 0.7) { const d = (t - S.copy) / 0.7; glow(ctx, Hh.hand[0], Hh.hand[1], 80 + 120 * d, GOLDC, 0.5 * (1 - d)); }
  // C09：怀念 → 照片飘起；说到以后 → 照片褪色散开，头顶长出担心分叉树
  if (Hh && t > S.nost - 0.1 && t < S.tree0 + 1.0) {
    const up = easeOut(prog(t, S.nost, S.nost + 1.0)), cool = ss(t, S.fut, S.tree0 + 0.3), base = Hh.book;
    MEM.forEach(([dx, dy, r], i) => {
      const u = clamp(up * 1.25 - i * 0.08, 0, 1), x = base[0] + dx * u + dx * 0.4 * cool, y = base[1] + dy * u + Math.sin(t * 1.1 + i) * 10 - 80 * cool;
      if (u > 0.01) F.photo(ctx, x, y, fr.hm * 0.7 * lerp(0.35, 1, u), u * (1 - cool), 1 - cool * 0.8, i * 7 + 2);
    });
  }
  const tA = ss(t, S.tree0 - 0.15, S.tree0 + 0.2) * (1 - ss(t, S.back0 + 0.6, S.back1)), wr = ss(t, S.fut, S.tree0 + 0.6) * (1 - ss(t, S.back0 + 0.3, S.back1));
  if (wr > 0.01) { ctx.fillStyle = rgba([16, 20, 46], 0.28 * wr); ctx.fillRect(0, 0, W, H); }
  if (tA > 0.01) {
    if (Hh) thoughtPuffs(ctx, [Hh.top[0] + 20, Hh.top[1] - 20], tA * (1 - ss(t, S.back0, S.back0 + 0.5)));
    THINK.draw(ctx, t, { alpha: tA, shatter: 0.85 * ss(t, S.back0, S.back1), push: [S.tree0, S.back0 + 0.5] });
  }
  // 前景虚焦光斑 + 暗角
  E.bokeh(ctx, t, 0.75 * lt);
  E.vignetteWarm(ctx, 0.45);
  // 熄灯切镜头
  const blk = 1 - ss(Math.abs(t - S.cut), 0.06, 0.32);
  if (blk > 0.01) { ctx.fillStyle = `rgba(4,3,6,${0.92 * blk})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
  FR = fr;
}

// ---------- 屏幕层：泡泡、名牌 ----------
const keepIn = (x, y, w = 140) => [clamp(x, w, W - w), clamp(y, 160, 1250)];
function over(ctx, t) {
  const fr = FR; if (fr.t !== t) return;
  const Hh = fr.hero;
  // C02：小美自我介绍 → 泡泡变成名牌飞进他脑袋 → 和记住的名牌一起绕着头转
  if (fr.mei) {
    const L = life(t, S.intro, S.fly0 - 0.05, 0.12), bp = keepIn(fr.mei[0] + 40, fr.mei[1] - 110, 200);
    if (L) B.say(ctx, '我叫小美', bp[0], bp[1], L.a, { size: 54, tail: [-30, 80], pop: L.pop });
    if (Hh && t > S.fly0 - 0.1 && t < S.nameIn + 0.1) {
      const u = easeInOut(prog(t, S.fly0 - 0.1, S.nameIn)), tg = [Hh.head[0], Hh.head[1] - 30];
      nameplate(ctx, '小美', lerp(bp[0], tg[0], u), lerp(bp[1], tg[1], u) - Math.sin(u * Math.PI) * 160, lerp(1.3, 0.95, u), 1, Math.sin(u * 6) * 0.15);
    }
  }
  if (Hh && t > S.nameIn - 0.05 && t < S.look + 0.8) {
    const a = ss(t, S.nameIn - 0.05, S.nameIn + 0.2) * (1 - ss(t, S.look + 0.2, S.look + 0.8)), cx = Hh.top[0] - 10, cy = Hh.top[1] - 40;
    glow(ctx, Hh.head[0], Hh.head[1], 220, GOLDC, 0.35 * a * Math.exp(-(t - S.nameIn) * 2.5));
    ['小美', '王阿姨', '李叔', '张奶奶'].forEach((s, i) => {
      const an = (t - S.nameIn) * 1.6 + i * Math.PI / 2 + Math.PI / 2, z = Math.sin(an);
      nameplate(ctx, s, cx + Math.cos(an) * 270, cy + z * 70, 0.95 + 0.18 * z, a * (i === 0 ? 1 : ss(t, S.nameIn + 0.1 + i * 0.1, S.nameIn + 0.35 + i * 0.1)) * (0.55 + 0.45 * (z + 1) / 2));
    });
  }
  if (!Hh) return;
  const hp = keepIn(Hh.top[0] + 120, Hh.top[1] - 120, 160);
  // C05：实物泡泡，一次一个
  const IC = [BI.sun, BI.veg, BI.family];
  S.ic.forEach((q, i) => { const L = life(t, q, i < 2 ? S.ic[i + 1] - 0.08 : ve('C05') + 0.3, 0.12); if (L) B.say(ctx, '', hp[0] + (i % 2 ? -40 : 20), hp[1], L.a, { icon: IC[i], iconW: 170, pop: L.pop, tail: [-50, 120] }); });
  // C06：邻居问「有新鲜事？」→ 他回一个新鲜事泡泡
  if (fr.t > S.c6 - 0.2) {
    const nq = FR_NB(fr); if (nq) { const L = life(t, S.c6 + 0.05, S.news - 0.1, 0.15); if (L) { const q = keepIn(nq[0] - 30, nq[1] - 100, 200); B.say(ctx, '有新鲜事？', q[0], q[1], L.a, { size: 48, tail: [20, 80], pop: L.pop }); } }
    const L = life(t, S.news, ve('C06') + 0.35, 0.2); if (L) B.say(ctx, '', hp[0], hp[1] - 20, L.a, { icon: BI.news, iconW: 160, pop: L.pop, tail: [-50, 120] });
  }
  // C07：他的泡泡一串 → INTP 抽象泡泡 → 他的泡泡一个个瘪掉 → 「……」
  if (t > S.c7 - 0.3 && t < S.on) {
    const pos = [[-60, 40], [120, -60], [-10, -200]];
    for (let i = 0; i < 3; i++) {
      const t0 = S.c7 - 0.25 + i * 0.14, d = ss(t, S.def[i], S.def[i] + 0.3); if (t < t0 || d >= 1) continue;
      const q = [hp[0] - 60 + pos[i][0], hp[1] + 40 + pos[i][1] + d * 70];
      ctx.save(); ctx.translate(q[0], q[1]); ctx.rotate(d * (i % 2 ? 0.5 : -0.5)); ctx.scale(1 + 0.25 * d, 1 - 0.8 * d);
      B.say(ctx, '', 0, 0, 1 - d * 0.5, { icon: IC[i], iconW: 110, pop: Math.max(0.02, B.popIn(t, t0)), gray: d, tail: [20, 60] }); ctx.restore();
      if (d > 0.05 && d < 0.95) for (let k = 0; k < 6; k++) { const a = hash(i * 7 + k) * 7, r = 20 + d * 80; glow(ctx, q[0] + Math.cos(a) * r, q[1] + Math.sin(a) * r, 10, [240, 240, 240], 0.6 * (1 - d)); }
    }
    const Ld = life(t, S.dots, S.dim0 + 0.25, 0.25); if (Ld) B.say(ctx, '……', hp[0] - 40, hp[1] + 20, Ld.a, { size: 60, tail: [-30, 80], pop: Ld.pop });
    if (fr.intp) { const L = life(t, S.isay, S.dots + 0.4, 0.25); if (L) { const q = keepIn(fr.intp[0] - 40, fr.intp[1] - 150, 190); B.say(ctx, '', q[0], q[1], L.a, { icon: geomIcon, iconW: 230, pop: L.pop, gray: L.gray * 0.3, tail: [20, 90] }); } }
  }
}
const FR_NB = fr => fr._nb || null;

const SFX = [
  { t: S.nameIn, k: 'ding' },        // 名牌飞进脑袋
  { t: S.post[0], k: 'pop' },        // 第一张海报钉上
  { t: S.chest, k: 'heart' },        // 手按胸口
  { t: S.def[0], k: 'pop' },         // 第一个泡泡瘪掉
  { t: S.cut - 0.15, k: 'click' },   // 熄灯
  { t: S.gold, k: 'ding' },          // 符号变金
];
module.exports = { draw, over, SFX, T0, T1, THINK };
