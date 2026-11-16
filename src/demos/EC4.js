'use strict';
// 《ESFJ》v7 EC4：D01–D05（敏感）。动作照 v6 EB4，场景换成有纵深的透视餐厅（egenv 3D：房间/吊灯/窗外夜景/远处餐桌）。
//   D01 长焦推到脸部特写（背景虚焦），喜/厌每拍切一次（暖光+星星 / 冷光+青筋+小乌云）
//   D02 拉开到餐厅中景：远处几桌客人一个个冒评价泡泡，泡泡飞过来，他伸手接住，捧回胸口
//   D03 客人「菜咸了」泡泡撞他 → 他头顶吊灯咔哒变暗，他瘫进椅子 → 念头分叉树 → ▶▶3小时后（蜡烛烧短、客人走光）→ 掌声泡泡 → 灯亮，跳起来擦桌子
//   D04 ISFJ 在侧门口说「我需要你」→ 心跳两下，镜头升起拉开：整间餐厅暗着，只有他这盏灯亮满
//   D05 ISFJ 走过来碰倒杯子，他马上鞠躬「对不起，是我」，脸泛红；尾声镜头慢慢退远，别的灯熄掉
const X = require('./ehk');
const E = require('./egenv');
const B = require('./ebw');
const { makeTree } = require('../tree');
const { K, vs, ve, at } = X;
const { W, H, clamp, lerp, mix, prog, smooth, easeOut, easeInOut, hash, glow, rgba } = K;
const { WARM, CANDLE } = E;
const sm = (t, a, b) => smooth(prog(t, a, b));

// ---------- 布景（世界坐标，米） ----------
const RM = { hw: 3.6, ht: 3.3, back: 10.5 };
const HX = -0.3, HZ = 4.3, HM = 1.8, SIT = 0.45;                 // 主角站在自家餐桌后；坐下 = 往下沉 SIT
const FACE = [HX + 112 / 394 * HM, 294 / 394 * HM, HZ];           // 脸的世界坐标
const TB = { x0: -1.25, x1: 1.05, z0: 3.05, z1: 3.85, top: 0.76 }; // 前景餐桌（挡住他下半身）
const CUP = [0.6, 3.3], PLATE = [-0.15, 3.45], CANDLE_X = -0.85, LAMP = [-0.1, 3.5];
const GUEST = [1.42, 3.5];
const DOOR = { z0: 4.2, z1: 5.2, h: 2.25 };                        // 右墙侧门
const IS0 = [2.95, 4.75], IS1 = [1.3, 3.42];
const FAR = [ // 远处几桌客人（坐在自己桌子后面）
  { key: 'enfp-female', X: -1.95, Z: 6.6, flip: false },
  { key: 'istj-male', X: 2.05, Z: 6.3, flip: true },
  { key: 'esfp-male', X: 0.95, Z: 8.5, flip: true },
  { key: 'intp-female', X: -0.9, Z: 9.4, flip: false },
  { key: 'enfj-male', X: -2.7, Z: 9.0, flip: false },
  { key: 'isfp-female', X: 2.75, Z: 9.1, flip: true },
];

// ---------- 时间（全按句子取） ----------
const T = {};
T.s = vs('D01') - 0.05; T.end = vs('E01') - 0.05;
T.c08 = vs('D01'); T.c08e = ve('D01'); T.c09 = vs('D02'); T.c09e = ve('D02');
T.c10 = vs('D03'); T.c10e = ve('D03'); T.c11 = vs('D04'); T.c11e = ve('D04'); T.c12 = vs('D05'); T.c12e = ve('D05');
T.faceIn = T.s + 0.7; T.sw0 = at('D01', '喜欢') - 0.08; T.swS = clamp(at('D01', '讨厌') - T.sw0, 0.36, 0.6);
T.faceOut = T.c08e + 0.08; T.wideIn = T.faceOut + 0.62;
// v8：D02 两个泡泡一个接一个（不重叠）；D03 → 停顿 → D03B 用「一档档亮 + 慢慢坐直站起」，不跳；D04 后只留心跳光波
const BS = clamp((T.c09e - T.c09 - 0.1) / 2.9, 0.8, 1.15), BU = [0.3, 0.68, 0.92, 1.15, 1.45].map(v => v * BS);
T.b = [0, 1].map(i => T.c09 + 0.22 + i * (BU[4] + 0.08));
T.c10b = vs('D03B'); T.c10be = ve('D03B');
T.salty = T.c10 + 0.05; T.hit = T.salty + 0.62; T.dark = T.hit + 0.12; T.darkE = T.dark + 1.0;   // 灯慢慢暗（1 秒，不闪）
T.slump = T.c10e + 0.25;                                                                      // 停顿：趴到桌上
T.ffA = T.c10e + 0.35; T.ffB = T.c10b + 0.15;                                                   // 蜡烛烧短、客人走光
T.ffTag = T.c10e + 0.95;                                                                        // ▶▶3小时后角标
T.clap = [0.05, 0.9, 1.35].map(d => T.c10b + d);                                                // 一个 → 停半拍 → 两个 → 三个
T.lampUp = T.clap[0]; T.stand = T.clap[2] + 0.35; T.stood = T.stand + 0.85; T.work = T.stood + 0.15;
T.turn = T.c11 + 0.05; T.need = at('D04', '我需要你') - 0.12; T.h1 = at('D04', '我需要你') + 0.85; T.h2 = T.h1 + 0.45;
T.slowW = [T.c11e + 0.05, T.c11e + 0.8];                                                        // D04 后 1.2 秒：只有心跳光波慢慢扩散
T.walkA = T.c12 - 0.15; T.walkB = T.c12 + 0.75; T.knock = T.c12 + 0.9; T.bow = T.knock + 0.32;
T.rise = T.c12e + 0.45; T.hold = T.end - 0.3;
// 灯一档档亮：[时刻, 亮度]
const LSTEP = [[T.clap[0] + 0.1, 0.32], [T.clap[1] + 0.1, 0.55], [T.clap[2] + 0.1, 0.78], [T.stand + 0.3, 0.95]];

// ---------- 小工具 ----------
const win = (t, a, b, fi = 0.12, fo = 0.25) => clamp(Math.min((t - a) / fi, (b - t) / fo), 0, 1);
const spring = (t, t0, k = 9, f = 20) => (t < t0 ? 0 : Math.exp(-(t - t0) * k) * Math.sin((t - t0) * f));
const back = u => { u = clamp(u, 0, 1); const c = 1.8; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); };
function keys(t, ks) {
  if (t <= ks[0][0]) return ks[0].slice(1);
  for (let i = 1; i < ks.length; i++) if (t <= ks[i][0]) { const u = easeInOut(prog(t, ks[i - 1][0], ks[i][0])); return ks[i].slice(1).map((v, j) => lerp(ks[i - 1][j + 1], v, u)); }
  return ks[ks.length - 1].slice(1);
}
const S = (c, k) => mix([8, 5, 9], c, clamp(k, 0, 1.2));

// ---------- 镜头：[f, x0, h, z0, cy, pitch, 背景虚焦px] ----------
const C_IN = [1100, 0.15, 1.6, 0.1, 760, 0.03, 9];
const C_FACE = [2000, FACE[0] - 0.02, 1.44, 2.25, 650, 0, 11];
const C_FACE2 = [2150, FACE[0] - 0.02, 1.44, 2.32, 650, 0, 11];
const C_WIDE = [1150, 0.22, 1.85, 1.15, 640, 0.1, 2.5];
const C_WIDE2 = [1180, 0.24, 1.82, 1.32, 640, 0.1, 2.5];
const C_MED = [1100, 0.62, 1.7, 0.75, 660, 0.08, 4];
const C_SLUMP = [1450, 0.35, 1.28, 1.6, 690, 0.02, 6];
const C_PAUSE = [1250, -0.22, 1.5, 1.25, 820, 0.07, 6];       // 停顿：灯、蜡烛、趴着的他都在画里
const C_PAUSE2 = [1360, -0.24, 1.45, 1.42, 830, 0.06, 6.5];   // 停顿里极慢地推近
const C_TWO = [1000, 1.3, 1.62, 0.0, 720, 0.03, 3];
const C_TWO2 = [1040, 1.25, 1.62, 0.15, 720, 0.03, 3];
const C_HIGH = [1150, 0.75, 2.8, -0.55, 600, 0.3, 1.5];
const C_HIGH2 = [1160, 0.75, 2.8, -0.45, 600, 0.3, 1.5];
const C_D05 = [1120, 0.62, 1.72, 0.8, 660, 0.09, 3.5];
const C_D05b = [1150, 0.6, 1.7, 0.92, 660, 0.09, 3.5];
const C_END = [1050, 0.45, 2.1, -0.6, 660, 0.12, 2];
const CAMS = [
  [T.s, ...C_IN], [T.faceIn, ...C_FACE], [T.faceOut, ...C_FACE2], [T.wideIn, ...C_WIDE], [T.c09e + 0.1, ...C_WIDE2],
  [T.c10 + 0.3, ...C_MED], [T.dark + 0.2, ...C_MED], [T.darkE + 0.3, ...C_PAUSE], [T.c10e + 0.3, ...C_PAUSE], [T.c10b + 0.3, ...C_PAUSE2],
  [T.stand, ...C_PAUSE2], [T.stood + 0.25, ...C_MED],
  [T.c11 + 0.6, ...C_TWO], [T.h1, ...C_TWO2], [T.h2 + 0.3, ...C_TWO2], [T.c11e + 0.7, ...C_HIGH], [T.c12, ...C_HIGH2],
  [T.c12 + 0.8, ...C_D05], [T.c12e + 0.2, ...C_D05b], [T.hold, ...C_END], [T.end + 1, ...C_END],
];
function camAt(t) {
  const v = keys(t, CAMS), sh = spring(t, T.hit, 9, 40) * 0.035;
  return { f: v[0], x0: v[1] + sh, h: v[2] + sh * 0.4, z0: v[3], cy: v[4], pitch: v[5], dof: v[6] };
}

// ---------- 灯 ----------
function lampMe(t) { // 他头顶这盏
  let v = lerp(0.62, 0.8, sm(t, T.c09, T.c09e)) * sm(t, T.s, T.s + 0.35) * (t < T.s + 0.4 ? 0.8 + 0.2 * Math.sin(t * 80) : 1);
  if (t > T.dark) v = lerp(v, 0.13, sm(t, T.dark, T.darkE));                         // 慢慢暗下，只剩一点
  if (t > T.ffA) v *= 0.92 + 0.08 * Math.sin(t * 2.1);                                 // 停顿里灯芯似有似无地喘
  if (t > T.lampUp) { let L = 0.13; for (const [ts, lv] of LSTEP) L = lerp(L, lv, sm(t, ts, ts + 0.45)); v = L; } // 一档档亮
  if (t > T.h1) v = 0.95 + 0.45 * Math.exp(-(t - T.h1) * 5) + 0.15 * sm(t, T.h1, T.h1 + 0.2);
  if (t > T.h2) v = 1.1 + 0.5 * Math.exp(-(t - T.h2) * 4) + 0.12 * sm(t, T.h2, T.h2 + 0.3);
  for (const s of T.slowW) if (t > s) v += 0.08 * Math.sin(Math.PI * clamp((t - s) / 1.4, 0, 1));
  if (t > T.c12 + 0.1) v = lerp(1.22, 1.0, sm(t, T.c12, T.c12e));
  return v;
}
function lampOthers(t) { // 其余所有灯（远处吊灯、壁灯、灯串）
  let v = 1;
  v = lerp(v, 0.45, sm(t, T.ffA, T.ffB));                       // 3 小时后：客人走光，只剩几盏
  v = lerp(v, 0.08, sm(t, T.need, T.h1));                       // 「我需要你」：别的都暗下去
  v = lerp(v, 0.22, sm(t, T.c12 - 0.2, T.c12 + 0.6));
  v = lerp(v, 0.06, sm(t, T.rise, T.hold));
  return v;
}

// ---------- 主角姿势（照 v6，高度换成米） ----------
const REST = [0.18, 0.2], CH = [1.0, 1.2];
const REACH = [[-2.15, 0.35], [0.55, 1.55]];
const ARM = (() => {
  const k = [[T.s, ...REST], [T.c09 - 0.1, ...REST]];
  T.b.forEach((b, i) => { k.push([b + BU[0] - 0.02, ...(i ? CH : REST)], [b + BU[1] - 0.04, ...REACH[i]], [b + BU[1] + 0.08, ...REACH[i]], [b + BU[2] + 0.1, ...CH]); });
  k.push([T.hit, ...CH], [T.darkE, 0.35, 0.05], [T.slump, 0.35, 0.05], [T.slump + 0.9, 0.75, 0.35], [T.clap[1], 0.75, 0.35],
    [T.clap[1] + 0.6, 0.35, 0.1], [T.stand, 0.35, 0.1], [T.stood, ...REST], [T.work + 0.2, 0.9, 1.3],
    [T.c11 + 0.4, 0.9, 1.3], [T.c11 + 0.8, ...REST], [T.h1, ...REST], [T.h1 + 0.25, ...CH], [T.c11e, ...CH], [T.c12 + 0.3, ...REST], [T.bow, 0.6, 0.6],
    [T.rise + 0.2, 0.6, 0.6], [T.rise + 0.9, 0.3, 0.5], [T.end, 0.3, 0.5]);
  return k;
})();
function heroPose(t) {
  const o = { cake: false, eyes: 'open', mouth: 'smile', fx: {} };
  let Y = 0;
  [o.rs, o.re] = keys(t, ARM);
  if (t < T.wideIn - 0.2) { // D01 喜恶写在脸上
    o.mouth = 'flat'; o.look = [0, 0.5];
    if (t >= T.sw0) {
      const i = Math.floor((t - T.sw0) / T.swS), u = t - T.sw0 - i * T.swS, like = i % 2 === 0, j = Math.exp(-u * 12);
      if (like) Object.assign(o, { eyes: 'happy', mouth: 'grin', tilt: 0.45 + 0.35 * j, warm: 0.55, nod: -0.25 * j, look: [0, 0] });
      else Object.assign(o, { eyes: 'squint', mouth: 'frown', brow: 1, tilt: -0.35 - 0.3 * j, gray: 0.28, nod: 0.35 * j, look: [0, 0] });
      o.fx = { like: like ? 1 : -1, u, i };
    }
  } else if (t < T.c10) { // D02 接评价
    o.look = [0.3, -0.6]; o.eyes = 'open'; o.mouth = 'smile';
    T.b.forEach((b, i) => {
      if (t > b) o.look = [i === 0 ? -1 : 1, -0.5];
      if (t > b + BU[1]) {
        if (i === 1) Object.assign(o, { eyes: 'wide', mouth: t < b + BU[2] ? 'o' : 'frown', brow: 1, look: [0, 0.6], warm: 0, gray: 0.1 });
        else Object.assign(o, { eyes: 'happy', mouth: 'grin', brow: 0, look: [0, 0], warm: 0.4, gray: 0 });
      }
    });
    const last = Math.max(0, ...T.b.filter(b => t > b + BU[2]).map(b => b + BU[2]));
    o.glow = last ? 0.5 * Math.exp(-(t - last) * 3) : 0;
  } else if (t < T.c11) { // D03 批评 → 慢慢瘫下 → 停顿趴着 → D03B 认可：抬头 → 坐直 → 站起来 → 干活
    o.mouth = 'grin'; o.eyes = 'open'; o.look = [1, 0];
    if (t > T.hit) { const r = spring(t, T.hit, 8, 22); o.lean = -0.18 * r; Object.assign(o, { eyes: 'wide', mouth: 'o' }); }
    if (t > T.dark) {
      const u = easeInOut(prog(t, T.dark, T.darkE));                    // 跟着灯一起慢慢沉进椅子
      const v = easeInOut(prog(t, T.slump, T.slump + 1.1));             // 停顿里再趴到桌上
      Y = -SIT * u - 0.13 * v;
      Object.assign(o, { eyes: t > T.dark + 0.6 ? 'closed' : 'wide', mouth: 'frown', lean: -0.1 * u * (1 - v) + 0.16 * v, nod: 1.2 * u + 0.25 * v, gray: 0.38 * u, look: [0, 1] });
      const br = Math.sin((t - T.dark) * 2.2);                           // 只剩呼吸起伏
      o.nod += 0.035 * br * u; Y += 0.008 * br * v;
    }
    if (t > T.clap[0] + 0.15) { // 一个人鼓掌：慢慢抬头，眯着眼
      const a = easeInOut(prog(t, T.clap[0] + 0.15, T.clap[0] + 0.8)), b = easeInOut(prog(t, T.clap[1] + 0.1, T.clap[1] + 0.7));
      Y = lerp(-SIT - 0.13, -SIT, a);
      o.lean = lerp(0.16, 0.03, a) * (1 - b); o.nod = lerp(1.45, 0.65, a) * (1 - b);
      o.gray = 0.38 * (1 - a); o.eyes = b > 0.3 ? 'open' : 'squint'; o.mouth = b > 0.5 ? 'smile' : 'flat'; o.look = [0.6 * a, 0.3 * (1 - b)];
      o.warm = 0.3 * b;
    }
    if (t > T.stand) { // 站起来：慢慢直起，不跳
      const u = easeInOut(prog(t, T.stand, T.stood));
      Y = -SIT * (1 - u) + 0.015 * Math.sin(Math.PI * u);
      Object.assign(o, { eyes: u > 0.5 ? 'happy' : 'open', mouth: 'grin', lean: 0.05 * Math.sin(Math.PI * u), nod: -0.1 * u, gray: 0, warm: 0.3 + 0.25 * u, glow: 0.55 * u * Math.exp(-Math.max(0, t - T.stood) * 1.5), look: [0, 0] });
    }
    if (t > T.work) { const w = sm(t, T.work, T.work + 0.3); o.rs += 0.28 * w * Math.sin((t - T.work) * 12); o.re += 0.18 * w * Math.sin((t - T.work) * 12 + 1); o.lean = 0.12 * w; o.eyes = 'open'; o.fx.work = w; }
  } else if (t < T.walkB - 0.1) { // D04 我需要你
    o.eyes = 'open'; o.mouth = 'smile'; o.look = t > T.turn ? [1, -0.3] : [1, 0];
    if (t > T.turn && t < T.turn + 0.25) o.bob = 6 * Math.sin((t - T.turn) / 0.25 * Math.PI);
    if (t > T.need + 0.3) Object.assign(o, { eyes: 'wide', mouth: 'o' });
    if (t > T.h1) {
      const pk = Math.exp(-(t - T.h1) * 6) + (t > T.h2 ? Math.exp(-(t - T.h2) * 5) : 0);
      let sw = 0; for (const s of T.slowW) if (t > s) sw += Math.sin(Math.PI * clamp((t - s) / 1.4, 0, 1));
      Object.assign(o, { eyes: 'happy', mouth: 'grin', warm: 0.75, glow: clamp(0.55 + 0.6 * pk + 0.25 * sw, 0, 1.3), nod: -0.2 - 0.04 * sw });
      o.bob = 10 * pk;
    }
  } else { // D05 先怪自己
    o.eyes = 'happy'; o.mouth = 'grin'; o.warm = 0.5; o.glow = 0.4 * (1 - sm(t, T.walkB, T.knock)); o.look = [1, 0];
    if (t > T.knock) Object.assign(o, { eyes: 'wide', mouth: 'o', warm: 0, glow: 0 });
    if (t > T.bow) {
      const u = back(prog(t, T.bow, T.bow + 0.32)), up = sm(t, T.rise, T.rise + 1.0);
      o.lean = 0.34 * u * (1 - up * 0.8); o.nod = 1.2 * u * (1 - up * 0.85); o.eyes = up > 0.6 ? 'open' : 'closed'; o.mouth = 'frown'; o.look = [0, 1];
      o.fx.blush = sm(t, T.bow + 0.1, T.bow + 0.5) * (1 - 0.5 * up);
    }
  }
  return { Y, o };
}

// ---------- 小道具 ----------
function star4(ctx, x, y, r, c, a) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgba(c); ctx.beginPath();
  for (let i = 0; i < 8; i++) { const an = i * Math.PI / 4, rr = i % 2 ? r * 0.28 : r; ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr); }
  ctx.closePath(); ctx.fill(); ctx.restore(); glow(ctx, x, y, r * 2.4, c, 0.5 * a);
}
function heart(ctx, x, y, r, c, a) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgba(c); ctx.beginPath();
  ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.3, y, x - r * 0.9, y - r * 1.1, x, y - r * 0.35); ctx.bezierCurveTo(x + r * 0.9, y - r * 1.1, x + r * 1.3, y, x, y + r * 0.9); ctx.fill(); ctx.restore();
  glow(ctx, x, y, r * 2.2, c, 0.35 * a);
}
function vein(ctx, x, y, r, a) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = rgba([226, 56, 50]); ctx.lineWidth = r * 0.32; ctx.lineCap = 'round';
  for (const [sx, sy] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { ctx.beginPath(); ctx.arc(x + sx * r, y + sy * r, r * 0.75, Math.atan2(-sy, -sx) - 0.75, Math.atan2(-sy, -sx) + 0.75); ctx.stroke(); }
  ctx.restore();
}
function gloom(ctx, x, y, r, a, t) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 6; i++) { const an = i / 6 * Math.PI * 2 + t * 2; ctx.fillStyle = rgba(mix([70, 74, 92], [40, 42, 56], i / 6)); ctx.beginPath(); ctx.arc(x + Math.cos(an) * r * 0.6, y + Math.sin(an) * r * 0.25, r * (0.45 + 0.15 * hash(i)), 0, 7); ctx.fill(); }
  ctx.fillStyle = rgba([140, 196, 246]);
  for (let i = 0; i < 3; i++) { const dx = (i - 1) * r * 0.5, ph = ((t * 3 + i * 0.37) % 1); ctx.globalAlpha = a * (1 - ph); ctx.beginPath(); ctx.ellipse(x + dx - r * 0.05 * ph, y + r * 0.55 + ph * r, r * 0.07, r * 0.16, 0.15, 0, 7); ctx.fill(); }
  ctx.restore();
}
function clapIcon(ctx, cx, cy, w) {
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(cx + s * w * 0.13, cy + w * 0.06); ctx.rotate(s * 0.32);
    ctx.fillStyle = '#f0c49c'; ctx.beginPath(); ctx.roundRect(-w * 0.12, -w * 0.3, w * 0.24, w * 0.5, w * 0.11); ctx.fill();
    ctx.fillStyle = '#d9a37c'; ctx.beginPath(); ctx.roundRect(s > 0 ? w * 0.06 : -w * 0.16, -w * 0.02, w * 0.1, w * 0.2, w * 0.05); ctx.fill();
    ctx.fillStyle = '#3d8fbf'; ctx.beginPath(); ctx.roundRect(-w * 0.13, w * 0.16, w * 0.26, w * 0.08, w * 0.03); ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#f4b73c';
    for (let i = 0; i < 3; i++) { const an = -Math.PI / 2 + s * (0.5 + i * 0.42); ctx.save(); ctx.translate(cx + Math.cos(an) * w * 0.42, cy - w * 0.08 + Math.sin(an) * w * 0.36); ctx.rotate(an + Math.PI / 2); ctx.beginPath(); ctx.roundRect(-w * 0.025, -w * 0.07, w * 0.05, w * 0.14, w * 0.025); ctx.fill(); ctx.restore(); }
  }
}
// 透视里的水平圆盘（桌面、盘子、光斑）
function disc(ctx, p, Xc, Y, Zc, rx, rz, fill, a = 1) {
  const l = p(Xc - rx, Y, Zc), r = p(Xc + rx, Y, Zc), f = p(Xc, Y, Zc - rz), b = p(Xc, Y, Zc + rz);
  const RX = Math.abs(r[0] - l[0]) / 2, RY = Math.max(0.5, Math.abs(f[1] - b[1]) / 2);
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse((l[0] + r[0]) / 2, (f[1] + b[1]) / 2, RX, RY, 0, 0, 7); ctx.fill(); ctx.restore();
  return { x: (l[0] + r[0]) / 2, y: (f[1] + b[1]) / 2, rx: RX, ry: RY };
}
// 渐变光束（代替细线）：从 A 到 B，尾细头粗，带外辉
function beam(ctx, ax, ay, bx, by, w, c, a) {
  if (a <= 0.01) return;
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, rgba(c, 0)); g.addColorStop(1, rgba(c, 0.85 * a));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(ax + nx * w * 0.15, ay + ny * w * 0.15); ctx.quadraticCurveTo((ax + bx) / 2 + nx * w * 1.6, (ay + by) / 2 + ny * w * 1.6, bx + nx * w, by + ny * w);
  ctx.lineTo(bx - nx * w, by - ny * w); ctx.quadraticCurveTo((ax + bx) / 2 + nx * w * 0.4, (ay + by) / 2 + ny * w * 0.4, ax - nx * w * 0.15, ay - ny * w * 0.15); ctx.closePath(); ctx.fill();
  for (let i = 0; i <= 6; i++) { const u = i / 6; glow(ctx, lerp(ax, bx, u) + nx * w * Math.sin(u * Math.PI) * 0.9, lerp(ay, by, u) + ny * w * Math.sin(u * Math.PI) * 0.9, w * (1.5 + 2.5 * u), c, 0.22 * a * u); }
  ctx.restore();
}

// ---------- 背景：餐厅（房间、窗外夜景、墙饰、远处餐桌和客人） ----------
const CITY = Array.from({ length: 46 }, (_, i) => ({ x: hash(i * 3.1), y: 0.42 + 0.56 * hash(i * 7.3), r: 0.012 + 0.05 * Math.pow(hash(i * 1.7), 2), c: hash(i * 5.5) > 0.35 ? [255, 196, 120] : [150, 190, 255], ph: hash(i * 9.1) * 6 }));
const TOWERS = Array.from({ length: 9 }, (_, i) => ({ x: i / 8.4 - 0.04 + 0.05 * hash(i * 2.2), w: 0.09 + 0.08 * hash(i * 4.4), h: 0.25 + 0.45 * hash(i * 6.6) }));
function cityWin(ctx, p, Xc, Y, Z, w, h, t, k, pane) {
  const a = p(Xc - w / 2, Y + h, Z), b = p(Xc + w / 2, Y, Z), x0 = a[0], y0 = a[1], ww = b[0] - a[0], hh = b[1] - a[1];
  ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, ww, hh); ctx.clip();
  const g = ctx.createLinearGradient(0, y0, 0, y0 + hh); g.addColorStop(0, 'rgb(10,14,38)'); g.addColorStop(0.6, 'rgb(34,38,84)'); g.addColorStop(1, 'rgb(82,62,104)'); ctx.fillStyle = g; ctx.fillRect(x0, y0, ww, hh);
  glow(ctx, x0 + ww * (pane ? 0.25 : 0.78), y0 + hh * 0.2, ww * 0.35, [210, 220, 255], 0.35);
  for (const q of TOWERS) { // 远处楼群剪影（软边渐变，不画方块窗）
    const bx = x0 + ww * ((q.x + (pane ? 0.37 : 0)) % 1.05), bw = ww * q.w, top = y0 + hh * (1 - q.h);
    const gg = ctx.createLinearGradient(0, top, 0, y0 + hh); gg.addColorStop(0, 'rgba(20,22,48,0.95)'); gg.addColorStop(1, 'rgba(36,30,60,0.95)');
    ctx.fillStyle = gg; ctx.beginPath(); ctx.roundRect(bx, top, bw, y0 + hh - top + 4, [bw * 0.12, bw * 0.12, 0, 0]); ctx.fill();
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const q of CITY) { // 失焦的城市灯：大小不一的柔光圆
    const x = x0 + ww * ((q.x + (pane ? 0.5 : 0)) % 1), y = y0 + hh * q.y, r = ww * q.r, tw = 0.7 + 0.3 * Math.sin(t * 1.3 + q.ph);
    ctx.fillStyle = rgba(q.c, 0.16 * tw); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); glow(ctx, x, y, r * 2.2, q.c, 0.22 * tw);
  }
  ctx.restore();
  const rf = ctx.createLinearGradient(x0, y0, x0 + ww, y0 + hh); rf.addColorStop(0.25, 'rgba(255,255,255,0)'); rf.addColorStop(0.36, 'rgba(255,240,220,0.08)'); rf.addColorStop(0.44, 'rgba(255,255,255,0)'); ctx.fillStyle = rf; ctx.fillRect(x0, y0, ww, hh);
  ctx.restore();
  // 木窗框 + 窗台（实心、有明暗）
  const fw = Math.max(5, ww * 0.045), fc = S([92, 60, 40], k), fcl = S([140, 96, 64], k);
  ctx.fillStyle = rgba(fc); ctx.fillRect(x0 - fw, y0 - fw, ww + fw * 2, fw); ctx.fillRect(x0 - fw, y0, fw, hh); ctx.fillRect(x0 + ww, y0, fw, hh);
  ctx.fillRect(x0 + ww / 2 - fw * 0.4, y0, fw * 0.8, hh); ctx.fillRect(x0, y0 + hh * 0.42 - fw * 0.35, ww, fw * 0.7);
  ctx.fillStyle = rgba(fcl); ctx.fillRect(x0 - fw * 1.6, y0 + hh, ww + fw * 3.2, fw * 1.1);
  ctx.fillStyle = rgba(S([60, 38, 26], k)); ctx.fillRect(x0 - fw * 1.6, y0 + hh + fw * 1.1, ww + fw * 3.2, fw * 0.6);
}
function roundTable(ctx, p, Xc, Zc, r, k, cand, t) {
  const top = 0.74, sk = 0.5, l = p(Xc - r, top, Zc), rr = p(Xc + r, top, Zc), lb = p(Xc - r, sk, Zc);
  // 底座：一根深色桌腿 + 圆脚
  disc(ctx, p, Xc, 0.01, Zc, r * 0.38, r * 0.38, rgba(S([34, 22, 18], k)));
  { const a = p(Xc - 0.04, sk, Zc), b = p(Xc + 0.04, 0.02, Zc); ctx.fillStyle = rgba(S([40, 26, 20], k)); ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); }
  // 桌布裙边：中间亮两边暗，往下渐暗
  const g = ctx.createLinearGradient(l[0], 0, rr[0], 0); g.addColorStop(0, rgba(S([110, 92, 78], k))); g.addColorStop(0.42, rgba(S([196, 178, 156], k))); g.addColorStop(1, rgba(S([100, 82, 70], k)));
  ctx.fillStyle = g; ctx.fillRect(l[0], l[1], rr[0] - l[0], lb[1] - l[1]);
  disc(ctx, p, Xc, sk, Zc, r, r, rgba(S([120, 100, 86], k)));
  const gy = ctx.createLinearGradient(0, l[1], 0, lb[1]); gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(1, 'rgba(10,4,6,0.45)'); ctx.fillStyle = gy; ctx.fillRect(l[0], l[1], rr[0] - l[0], lb[1] - l[1]);
  const d = disc(ctx, p, Xc, top, Zc, r, r, rgba(S([214, 200, 178], k)));
  for (const s of [-1, 1]) disc(ctx, p, Xc + s * r * 0.45, top + 0.005, Zc - r * 0.2, r * 0.22, r * 0.22, rgba(S([250, 248, 240], k)));
  if (cand > 0.01) { const c = p(Xc, top + 0.16, Zc); E.bulb(ctx, c[0], c[1], Math.max(2, p.px(Zc, 0.03)), CANDLE, cand * (0.85 + 0.15 * Math.sin(t * 7 + Xc))); glow(ctx, d.x, d.y, d.rx * 1.1, WARM, 0.1 * cand); }
}
function drawBG(ctx, p, t, st) {
  const { amb, oth } = st, k = amb;
  E.room(ctx, p, { ...RM, near: st.cam.z0 + 0.3, wall: [112, 70, 54], floor: [116, 74, 46], ceil: [52, 34, 30], light: 0.35 + 0.6 * k, planks: 1, stripe: false });
  const hw = RM.hw, bk = RM.back - 0.01, nz = st.cam.z0 + 0.35;
  // 地板：一条条有深浅的木板（实心面，不画线）
  for (let i = 0; i < 12; i++) { const x0 = -hw + 2 * hw * i / 12, x1 = x0 + 2 * hw / 12 - 0.015; E.poly(ctx, p, [[x0, 0.001, nz], [x1, 0.001, nz], [x1, 0.001, bk], [x0, 0.001, bk]], S(mix([118, 76, 48], [84, 52, 34], hash(i * 3.3)), 0.25 + 0.6 * k)); }
  // 护墙板（下半截深色木、上沿一条亮木条）
  const wood = S([74, 46, 34], 0.3 + 0.6 * k), rail = S([150, 104, 70], 0.3 + 0.65 * k);
  for (const s of [-1, 1]) { E.poly(ctx, p, [[s * hw, 0, nz], [s * hw, 0.95, nz], [s * hw, 0.95, bk], [s * hw, 0, bk]], wood); E.poly(ctx, p, [[s * hw, 0.95, nz], [s * hw, 1.02, nz], [s * hw, 1.02, bk], [s * hw, 0.95, bk]], rail); }
  E.poly(ctx, p, [[-hw, 0, bk], [hw, 0, bk], [hw, 0.95, bk], [-hw, 0.95, bk]], wood); E.poly(ctx, p, [[-hw, 0.95, bk], [hw, 0.95, bk], [hw, 1.02, bk], [-hw, 1.02, bk]], rail);
  // 后墙两扇大窗：窗外夜景
  cityWin(ctx, p, -1.75, 1.15, bk, 2.1, 1.75, t, 0.35 + 0.6 * k, 0); cityWin(ctx, p, 1.75, 1.15, bk, 2.1, 1.75, t, 0.35 + 0.6 * k, 1);
  // 左墙：两幅暖色挂画 + 壁灯
  for (const [z0, z1, c] of [[4.6, 5.6, [210, 140, 90]], [7.2, 8.0, [120, 150, 170]]]) {
    E.poly(ctx, p, [[-hw + 0.01, 1.35, z0], [-hw + 0.01, 2.25, z0], [-hw + 0.01, 2.25, z1], [-hw + 0.01, 1.35, z1]], S([60, 40, 30], 0.3 + 0.6 * k));
    E.poly(ctx, p, [[-hw + 0.02, 1.43, z0 + 0.08], [-hw + 0.02, 2.17, z0 + 0.08], [-hw + 0.02, 2.17, z1 - 0.08], [-hw + 0.02, 1.43, z1 - 0.08]], S(c, 0.3 + 0.6 * k));
  }
  for (const z of [6.4, 9.0]) { const q = p(-hw + 0.05, 2.0, z); glow(ctx, q[0], q[1] + p.px(z, 0.1), p.px(z, 0.9), WARM, 0.28 * oth); E.bulb(ctx, q[0], q[1], Math.max(2, p.px(z, 0.05)), CANDLE, oth); }
  // 右墙：侧门（D04 打开，门外走廊的暖光照进来）
  const op = st.door, dx = hw - 0.01;
  E.poly(ctx, p, [[dx, 0, DOOR.z0 - 0.1], [dx, DOOR.h + 0.1, DOOR.z0 - 0.1], [dx, DOOR.h + 0.1, DOOR.z1 + 0.1], [dx, 0, DOOR.z1 + 0.1]], S([60, 38, 28], 0.3 + 0.6 * k));
  E.poly(ctx, p, [[dx, 0, DOOR.z0], [dx, DOOR.h, DOOR.z0], [dx, DOOR.h, DOOR.z1], [dx, 0, DOOR.z1]], op > 0.01 ? mix(S([40, 26, 20], k), [255, 214, 160], 0.85 * op) : S([40, 26, 20], k));
  if (op > 0.01) { const m = p(dx, 1.1, (DOOR.z0 + DOOR.z1) / 2); glow(ctx, m[0], m[1], p.px(DOOR.z1, 1.8), [255, 206, 140], 0.4 * op); E.pool(ctx, p, dx - 0.6, (DOOR.z0 + DOOR.z1) / 2, 1.3, [255, 206, 140], 0.3 * op); }
  const an = op * 1.25, hz = DOOR.z0, ex = dx - Math.sin(an) * (DOOR.z1 - DOOR.z0), ez = hz + Math.cos(an) * (DOOR.z1 - DOOR.z0);
  E.poly(ctx, p, [[dx, 0, hz], [dx, DOOR.h, hz], [ex, DOOR.h, ez], [ex, 0, ez]], S([120, 78, 52], 0.3 + 0.6 * k));
  { const kn = p(lerp(dx, ex, 0.88), 1.0, lerp(hz, ez, 0.88)); glow(ctx, kn[0], kn[1], p.px(ez, 0.06), [255, 220, 150], 0.7 * k); }
  // 天花板灯串
  for (const [za, zb] of [[6.0, 6.6], [8.3, 8.9]]) E.bulbs(ctx, p, [-hw + 0.1, 3.18, za], [hw - 0.1, 3.18, zb], 12, 0.35, t, i => oth * (0.7 + 0.3 * hash(i * 1.7)));
  // 远处餐桌：后面的先画
  const far = FAR.map((f, i) => ({ ...f, i })).sort((a, b) => b.Z - a.Z);
  const res = {};
  for (const f of far) {
    const tz = f.Z - 0.55, a = st.farA * (f.i < 3 ? 1 : st.farA2);
    if (a > 0.01) {
      res[f.i] = E.lit(ctx, c => E.folk3(c, p, f.key, f.X, f.Z, { m: 1.75, Y: -0.42, flip: f.flip, a, shadow: 0, bob: st.bob[f.i] || 0, lean: st.lean[f.i] || 0, dim: 0.25 * (1 - oth) }), { x: p(f.X, 2, tz)[0], y: p(f.X, 2, tz)[1], r: p.px(tz, 2.4), k: 0.3 * oth, amb: 0.4 });
    } else res[f.i] = E.folk3(ctx, p, f.key, f.X, f.Z, { m: 1.75, Y: -0.42, a: 0 });
    roundTable(ctx, p, f.X, tz, 0.5, 0.3 + 0.65 * k * (0.4 + 0.6 * oth), oth * (t < T.ffB ? 1 : 0.6), t);
    E.pendant(ctx, p, f.X, tz, { ht: RM.ht, drop: 1.25, on: 0.8 * oth, R: 1.2 });
  }
  E.pendant(ctx, p, 0, 10.0 - 1.2, { ht: RM.ht, drop: 1.0, on: 0.6 * oth, R: 1 });
  return res;
}

// ---------- 自家餐桌（前景，桌布、菜、蜡烛、杯子） ----------
function myTable(ctx, p, t, k, lampK) {
  const { x0, x1, z0, z1, top } = TB;
  // 桌布正面：一条条褶子（实心面），下摆一道红边
  { // 一整块垂下来的桌布：横向柔和的褶子明暗 + 越往下越暗
    const q = [p(x0 - 0.02, top, z0), p(x1 + 0.02, top, z0), p(x1 + 0.02, 0.05, z0 - 0.02), p(x0 - 0.02, 0.05, z0 - 0.02)];
    const path = () => { ctx.beginPath(); q.forEach((s, i) => (i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]))); ctx.closePath(); };
    const gx = ctx.createLinearGradient(q[0][0], 0, q[1][0], 0);
    for (let i = 0; i <= 14; i++) { const u = i / 14, sh = 0.78 + 0.16 * Math.sin(u * 23 + 0.8) + 0.06 * Math.sin(u * 51); gx.addColorStop(u, rgba(S([222, 208, 188], k * 0.82 * sh))); }
    path(); ctx.fillStyle = gx; ctx.fill();
    const gy = ctx.createLinearGradient(0, q[0][1], 0, q[3][1]); gy.addColorStop(0, 'rgba(255,240,215,0.12)'); gy.addColorStop(0.15, 'rgba(0,0,0,0)'); gy.addColorStop(1, 'rgba(10,4,6,0.5)');
    path(); ctx.fillStyle = gy; ctx.fill();
  }
  E.poly(ctx, p, [[x0 - 0.02, 0.2, z0 - 0.015], [x1 + 0.02, 0.2, z0 - 0.015], [x1 + 0.02, 0.05, z0 - 0.025], [x0 - 0.02, 0.05, z0 - 0.025]], S([196, 70, 62], k));
  E.poly(ctx, p, [[x0 - 0.02, 0.23, z0 - 0.014], [x1 + 0.02, 0.23, z0 - 0.014], [x1 + 0.02, 0.2, z0 - 0.015], [x0 - 0.02, 0.2, z0 - 0.015]], S([240, 200, 150], k));
  // 桌面
  E.poly(ctx, p, [[x0 - 0.02, top, z0], [x1 + 0.02, top, z0], [x1 + 0.02, top, z1], [x0 - 0.02, top, z1]], S([240, 228, 206], k * 0.88));
  // 桌面上他这盏灯的光斑
  if (lampK > 0.02) { const d = p(LAMP[0], top, LAMP[1]); ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(d[0], d[1]); ctx.scale(1, 0.28); glow(ctx, 0, 0, p.px(LAMP[1], 1.1), WARM, 0.32 * Math.min(1.2, lampK)); ctx.restore(); }
  // 盘子和菜
  disc(ctx, p, PLATE[0], top + 0.004, PLATE[1], 0.24, 0.17, rgba(S([226, 224, 218], k)));
  const pl = disc(ctx, p, PLATE[0], top + 0.008, PLATE[1], 0.2, 0.14, rgba(S([252, 252, 248], k)));
  const mound = (dx, dz, rx, hgt, c) => { const q = p(PLATE[0] + dx, top + 0.01, PLATE[1] + dz), R = p.px(PLATE[1], rx), Hh = p.px(PLATE[1], hgt); const g = ctx.createRadialGradient(q[0] - R * 0.3, q[1] - Hh * 0.7, 1, q[0], q[1], R * 1.2); g.addColorStop(0, rgba(S(mix(c, [255, 255, 230], 0.35), k))); g.addColorStop(1, rgba(S(mix(c, [0, 0, 0], 0.3), k))); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(q[0], q[1], R, Hh, 0, Math.PI, 0); ctx.ellipse(q[0], q[1], R, Hh * 0.25, 0, 0, Math.PI); ctx.fill(); };
  mound(-0.04, 0.02, 0.13, 0.07, [96, 168, 84]); mound(0.08, -0.03, 0.07, 0.05, [226, 120, 70]); mound(-0.1, -0.04, 0.05, 0.035, [240, 200, 90]);
  const steam = 1 - sm(t, T.dark, T.ffB);
  if (steam > 0.02) for (let i = 0; i < 5; i++) { const ph = ((t * 0.7 + i * 0.2) % 1); glow(ctx, pl.x + (i - 2) * pl.rx * 0.3 + Math.sin(t * 3 + i) * pl.rx * 0.15, pl.y - pl.ry * 2 - ph * p.px(PLATE[1], 0.45), p.px(PLATE[1], 0.09), [255, 255, 255], 0.3 * steam * Math.sin(ph * Math.PI)); }
  // 蜡烛（3 小时后烧短）
  const ch = lerp(0.2, 0.06, sm(t, T.ffA, T.ffB)), cb = p(CANDLE_X, top, 3.5), ct = p(CANDLE_X, top + ch, 3.5), cw = p.px(3.5, 0.045);
  const melt = sm(t, T.ffA, T.ffB);
  if (melt > 0.01) disc(ctx, p, CANDLE_X, top + 0.002, 3.5, 0.03 + 0.07 * melt, 0.02 + 0.05 * melt, rgba(S([236, 226, 204], k)), 0.9); // 化下来的蜡
  ctx.fillStyle = rgba(S([240, 232, 214], k)); ctx.beginPath(); ctx.roundRect(cb[0] - cw / 2, ct[1], cw, cb[1] - ct[1], cw * 0.2); ctx.fill();
  if (melt > 0.05) { ctx.fillStyle = rgba(S([252, 246, 230], k), 0.9); ctx.beginPath(); ctx.roundRect(cb[0] - cw * 0.48, ct[1], cw * 0.16, (cb[1] - ct[1]) * (0.3 + 0.5 * melt), cw * 0.08); ctx.fill(); } // 一道蜡泪
  const quiet = sm(t, T.dark, T.darkE) * (1 - sm(t, T.clap[1], T.stood)), fl = 0.9 + 0.1 * Math.sin(t * 9) + 0.06 * Math.sin(t * 3.3);
  if (quiet > 0.01) glow(ctx, ct[0], ct[1] - cw, p.px(3.5, 0.5), CANDLE, 0.3 * quiet * fl);  // 暗下来后烛光成了主光
  E.bulb(ctx, ct[0] + Math.sin(t * 2.7) * cw * 0.06 * quiet, ct[1] - cw * 0.5, cw * 0.32, CANDLE, fl);
  // 杯子（D05 被碰倒）
  const kt = t - T.knock, base = p(CUP[0], top, CUP[1]), cr = p.px(CUP[1], 0.05);
  if (kt > 0.18) {
    const sp = easeOut(prog(kt, 0.18, 0.9));
    disc(ctx, p, CUP[0] - 0.12 - 0.12 * sp, top + 0.003, CUP[1] - 0.04, 0.06 + 0.22 * sp, 0.04 + 0.1 * sp, rgba(S([150, 200, 240], k), 0.75));
    const edge = p(0, top, TB.z0)[1], flo = p(0, 0, TB.z0 - 0.02)[1];
    for (let i = 0; i < 7; i++) {
      const tt = kt - 0.35 - i * 0.16; if (tt < 0) continue;
      const ph = tt % 1.1, ex = p(CUP[0] - 0.12 - hash(i * 3.7) * 0.32, top, TB.z0)[0], ey = edge + (flo - edge) * Math.min(1, 2.2 * ph * ph);
      if (ey < flo - 4) { ctx.fillStyle = rgba(S([170, 214, 250], k), 0.85); ctx.beginPath(); ctx.ellipse(ex, ey, cr * 0.12, cr * 0.2, 0, 0, 7); ctx.fill(); }
    }
    if (kt < 0.6) for (let i = 0; i < 10; i++) { const u = (kt - 0.18) / 0.42, an = -Math.PI * (0.55 + 0.4 * hash(i)), r = cr * (1 + 2 * hash(i * 2.1)); glow(ctx, base[0] - cr * 0.8 + Math.cos(an) * r * u, base[1] - cr * 0.3 + Math.sin(an) * r * u + cr * 3 * u * u, cr * 0.3, [190, 225, 255], 0.8 * (1 - u)); }
  }
  const rot = kt > 0 ? -Math.PI / 2 * Math.min(1, (kt / 0.22) ** 2) + (kt > 0.22 ? 0.06 * spring(t, T.knock + 0.22, 12, 30) : 0) : 0;
  ctx.save(); ctx.translate(base[0] - (kt > 0 ? cr * 0.45 * Math.min(1, kt / 0.22) : 0), base[1]); ctx.rotate(rot);
  const g = ctx.createLinearGradient(-cr, 0, cr, 0); g.addColorStop(0, rgba(S([180, 200, 220], k), 0.8)); g.addColorStop(0.4, rgba(S([236, 246, 252], k), 0.92)); g.addColorStop(1, rgba(S([160, 180, 200], k), 0.8));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-cr * 0.5, 0); ctx.lineTo(cr * 0.5, 0); ctx.lineTo(cr * 0.62, -cr * 1.55); ctx.lineTo(-cr * 0.62, -cr * 1.55); ctx.closePath(); ctx.fill();
  if (kt < 0.2) { ctx.fillStyle = rgba(S([130, 190, 236], k), 0.85); ctx.beginPath(); ctx.moveTo(-cr * 0.52, -cr * 0.08); ctx.lineTo(cr * 0.52, -cr * 0.08); ctx.lineTo(cr * 0.58, -cr * 1.05); ctx.lineTo(-cr * 0.58, -cr * 1.05); ctx.closePath(); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fillRect(-cr * 0.4, -cr * 1.45, cr * 0.13, cr * 1.25);
  ctx.restore();
}
// 他头顶的吊灯：黄铜灯罩 + 光柱
function myPendant(ctx, p, on) {
  const [Xl, Zl] = LAMP, top = p(Xl, RM.ht, Zl), lp = p(Xl, RM.ht - 1.0, Zl), s = p.px(Zl, 0.42);
  if (lp[1] < -s * 2 && on < 0.9) return lp;
  ctx.save(); ctx.fillStyle = 'rgba(24,16,12,0.95)'; ctx.fillRect(top[0] - Math.max(1.5, s * 0.025), top[1], Math.max(3, s * 0.05), lp[1] - top[1]);
  const g = ctx.createLinearGradient(lp[0] - s, 0, lp[0] + s, 0); g.addColorStop(0, rgba(mix([70, 48, 30], WARM, 0.2 * on))); g.addColorStop(0.45, rgba(mix([196, 150, 84], [255, 236, 190], 0.4 * clamp(on)))); g.addColorStop(1, rgba(mix([60, 40, 26], WARM, 0.15 * on)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(lp[0], lp[1] + s * 0.42, s * 0.62, s * 0.5, 0, Math.PI, 0); ctx.fill();
  ctx.fillStyle = rgba(mix([60, 40, 24], [255, 236, 190], clamp(on))); ctx.beginPath(); ctx.ellipse(lp[0], lp[1] + s * 0.42, s * 0.62, s * 0.11, 0, 0, 7); ctx.fill();
  ctx.restore();
  if (on > 0.02) { const fl = p(Xl, TB.top, Zl); E.cone(ctx, lp[0], lp[1] + s * 0.45, fl[1], s * 1.15, p.px(Zl, 1.9), WARM, 0.1 * Math.min(1.3, on)); E.bulb(ctx, lp[0], lp[1] + s * 0.42, s * 0.14, CANDLE, Math.min(1, on)); }
  return lp;
}
function chair(ctx, p, Xc, Zc, k) {
  const c1 = S([96, 60, 38], k), c2 = S([70, 44, 28], k);
  E.poly(ctx, p, [[Xc - 0.28, 0.46, Zc], [Xc + 0.28, 0.46, Zc], [Xc + 0.28, 1.0, Zc], [Xc - 0.28, 1.0, Zc]], c2);
  const a = p(Xc - 0.3, 1.04, Zc), b = p(Xc + 0.3, 0.92, Zc); ctx.fillStyle = rgba(c1); ctx.beginPath(); ctx.roundRect(a[0], a[1], b[0] - a[0], b[1] - a[1], (b[1] - a[1]) * 0.45); ctx.fill();
}
// 前景虚焦：近处一只酒瓶和一只高脚杯（随镜头视差）
function fgProps(ctx, cam, t, a) {
  if (a <= 0.01) return;
  const cv = new K.Canvas(W, H), c = cv.getContext('2d'), px = -(cam.x0 - 0.5) * 420, py = (cam.h - 1.6) * 260;
  const bottle = (x, y, s) => {
    const g = c.createLinearGradient(x - 60 * s, 0, x + 60 * s, 0); g.addColorStop(0, 'rgb(14,30,22)'); g.addColorStop(0.35, 'rgb(40,78,56)'); g.addColorStop(1, 'rgb(10,20,16)');
    c.fillStyle = g; c.beginPath(); c.roundRect(x - 70 * s, y - 330 * s, 140 * s, 700 * s, 40 * s); c.fill(); c.beginPath(); c.roundRect(x - 26 * s, y - 520 * s, 52 * s, 220 * s, 12 * s); c.fill();
    c.fillStyle = 'rgba(255,214,150,0.5)'; c.fillRect(x - 40 * s, y - 300 * s, 16 * s, 520 * s);
  };
  const glass = (x, y, s) => {
    c.fillStyle = 'rgba(200,220,240,0.22)'; c.beginPath(); c.ellipse(x, y - 200 * s, 110 * s, 150 * s, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(150,30,50,0.55)'; c.beginPath(); c.ellipse(x, y - 170 * s, 100 * s, 110 * s, 0, 0, Math.PI); c.fill();
    c.fillStyle = 'rgba(220,235,250,0.3)'; c.fillRect(x - 10 * s, y - 60 * s, 20 * s, 220 * s); c.beginPath(); c.ellipse(x, y + 160 * s, 90 * s, 18 * s, 0, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,240,220,0.5)'; c.fillRect(x - 70 * s, y - 300 * s, 14 * s, 160 * s);
  };
  const bxp = clamp(10 + px * 0.5, -40, 60), gxp = clamp(1060 + px * 0.5, 1020, 1110), yy = clamp(py, -80, 120); // 只在两侧边缘，不挡主体
  bottle(bxp, 1320 + yy, 1.0); glass(gxp, 1300 + yy, 1.0);
  glow(c, bxp, 1080 + yy, 110, WARM, 0.25); glow(c, gxp - 20, 1100 + yy, 90, [255, 220, 180], 0.2);
  ctx.save(); ctx.globalAlpha *= a; ctx.filter = 'blur(16px)'; ctx.drawImage(cv, 0, 0); ctx.filter = 'none'; ctx.restore();
}

// ---------- 主画面 ----------
let LAST = null; // over() 要用的屏幕坐标
function draw(ctx, t) {
  const cam = camAt(t), p = E.cam3({ cx: W / 2, cy: cam.cy, f: cam.f, h: cam.h, z0: cam.z0, x0: cam.x0, pitch: cam.pitch });
  const Lm = lampMe(t), oth = lampOthers(t), lmN = clamp(Lm, 0, 1);
  const crit = sm(t, T.dark, T.darkE) * (1 - sm(t, T.clap[0], T.stood));
  const amb = clamp((0.3 + 0.55 * oth + 0.18 * lmN * oth + 0.08 * lmN) * (1 - 0.45 * crit), 0, 1);
  const hp = heroPose(t);
  // 远处客人：D02 说话时晃一下；3 小时后都走了
  const bob = {}, lean = {};
  T.b.forEach((b, i) => { if (t > b && t < b + 0.5) { bob[i] = p.px(6, 0.04) * Math.abs(Math.sin((t - b) * 20)); lean[i] = 0.06 * Math.sin((t - b) * 12); } });
  const farA = 1 - sm(t, T.ffA + 0.15, T.ffB - 0.1), farA2 = farA;
  const door = sm(t, T.clap[0], T.c11 + 0.2) * (1 - sm(t, T.walkB, T.walkB + 0.8)); // 门从 D03B 起一点点开，暖光漫进来
  // 1) 背景层：画进离屏，按景深虚焦
  const BGc = new K.Canvas(W, H), bx = BGc.getContext('2d');
  const far = drawBG(bx, p, t, { amb, oth, cam, farA, farA2, bob, lean, door });
  ctx.fillStyle = 'rgb(14,9,12)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); ctx.filter = `blur(${cam.dof.toFixed(1)}px)`; ctx.drawImage(BGc, 0, 0); ctx.filter = 'none'; ctx.restore();
  // 2) 主体层
  const lpS = p(LAMP[0], RM.ht - 1.0, LAMP[1]), hdS = p(FACE[0], 2.1, HZ);
  const litO = { x: lerp(hdS[0], lpS[0], 0.3), y: hdS[1], r: p.px(HZ, 2.2) + 320, k: 0.3 * Math.min(1.1, Lm), amb: 0.32 + 0.35 * (1 - lmN) };
  // 「只亮他这盏灯」：光往外溢
  if (Lm > 0.98) { const e = clamp((Lm - 0.98) / 0.4, 0, 1.4); ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, lpS[0], lpS[1] + p.px(LAMP[1], 1.2), p.px(LAMP[1], 4.5), [255, 200, 120], 0.2 * e); ctx.restore(); }
  // ISFJ 位置
  const wu = easeInOut(prog(t, T.walkA, T.walkB)), walking = t > T.walkA && t < T.walkB;
  const isX = lerp(IS0[0], IS1[0], wu), isZ = lerp(IS0[1], IS1[1], wu), iA = sm(t, T.c11 - 0.1, T.c11 + 0.3);
  const isLean = t > T.knock - 0.18 ? -0.16 * Math.sin(Math.PI * clamp((t - T.knock + 0.18) / 0.5, 0, 1)) : 0;
  const isO = { m: 1.62, a: iA, flip: true, bob: walking ? Math.abs(Math.sin((t - T.walkA) * 16)) * p.px(isZ, 0.03) : 0, lean: isLean + (t > T.need && t < T.need + 0.4 ? 0.05 * Math.sin((t - T.need) * 16) : 0), dim: 0.25 * (1 - lmN) };
  let hero = null, isfj = null, guest = null;
  chair(ctx, p, HX + 0.25, HZ + 0.32, 0.3 + 0.7 * lmN);
  E.lit(ctx, c => {
    if (iA > 0.01 && isZ >= HZ) isfj = E.folk3(c, p, 'isfj-female', isX, isZ, isO);
    hero = E.hero3(c, p, HX, HZ, Object.assign({ m: HM, Y: hp.Y, shadow: 0.3 }, hp.o, { dim: Math.max(0.4 * (1 - lmN), hp.o.dim || 0) }));
  }, litO);
  // 心跳：从他胸口往外推的暖光波（厚的柔光环）
  for (const [th, D, A] of [[T.h1, 1.1, 0.5], [T.h2, 1.1, 0.5], [T.slowW[0], 2.2, 0.32], [T.slowW[1], 2.2, 0.26]]) { // 后两道：停顿里慢慢扩散
    const u = t - th; if (u < 0 || u > D) continue;
    const cx = hero.chest[0], cy = hero.chest[1], r = 120 + 1500 * easeOut(u / D), a = A * Math.min(1, u / (0.08 * D)) * (1 - u / D);
    const g = ctx.createRadialGradient(cx, cy, r * 0.7, cx, cy, r); g.addColorStop(0, 'rgba(255,214,140,0)'); g.addColorStop(0.75, `rgba(255,214,140,${a})`); g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.restore();
  }
  // D01 特写：脸上的喜/厌
  const fx = hp.o.fx || {};
  if (fx.like) {
    const k = hero.k, cx = hero.face[0], cy = hero.face[1], a = Math.min(1, fx.u / 0.06) * (1 - sm(t, T.faceOut, T.faceOut + 0.3));
    if (fx.like > 0) {
      for (const e of [hero.eyeL, hero.eyeR]) { ctx.fillStyle = rgba([255, 120, 130], 0.55 * a); ctx.beginPath(); ctx.ellipse(e[0], e[1] + 17 * k, 9 * k, 5 * k, 0, 0, 7); ctx.fill(); }
      for (let i = 0; i < 6; i++) { const an = -Math.PI * (0.1 + 0.8 * i / 5) + fx.i, r = (52 + 26 * easeOut(fx.u / 0.4)) * k; star4(ctx, cx + Math.cos(an) * r, cy - 10 * k + Math.sin(an) * r * 0.9, (5 + 3 * hash(i + fx.i)) * k, [255, 218, 120], a * (1 - fx.u / 0.45)); }
      heart(ctx, cx - 50 * k, cy - 40 * k - 30 * k * fx.u, 7 * k, [255, 110, 130], a);
    } else {
      vein(ctx, cx + 22 * k, cy - 52 * k, 6 * k, a * back(fx.u / 0.12));
      gloom(ctx, cx - 30 * k, cy - 88 * k, 22 * k, a, t);
      ctx.fillStyle = rgba([150, 210, 255], 0.85 * a); ctx.beginPath(); const sx = cx + 38 * k, sy = cy - 20 * k + 20 * k * fx.u; ctx.moveTo(sx, sy - 9 * k); ctx.quadraticCurveTo(sx + 6 * k, sy + 2 * k, sx, sy + 5 * k); ctx.quadraticCurveTo(sx - 6 * k, sy + 2 * k, sx, sy - 9 * k); ctx.fill();
    }
  }
  if (fx.blush) {
    const k = hero.k, b = fx.blush;
    for (const e of [hero.eyeL, hero.eyeR]) { ctx.fillStyle = rgba([240, 70, 80], 0.6 * b); ctx.beginPath(); ctx.ellipse(e[0], e[1] + 16 * k, 11 * k, 6 * k, 0, 0, 7); ctx.fill(); }
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, hero.face[0], hero.face[1], 70 * k, [255, 80, 70], 0.35 * b); ctx.restore();
  }
  myTable(ctx, p, t, clamp(0.3 + 0.75 * (0.35 * amb + 0.65 * lmN), 0, 1.05), Lm);
  if (fx.work) for (let i = 0; i < 4; i++) { const ph = ((t * 1.1 + i * 0.25) % 1), q = p(lerp(-1.0, 0.85, hash(i * 5.1)), TB.top, lerp(3.15, 3.75, hash(i * 2.9))); star4(ctx, q[0], q[1] - ph * p.px(3.4, 0.12), p.px(3.4, 0.035) * (1 - ph), [255, 240, 190], fx.work * (1 - ph)); }
  // 客人（嫌菜咸，3 小时后已经走了）+ 走近的 ISFJ
  const gA = sm(t, T.faceIn, T.faceOut) * (1 - sm(t, T.ffA + 0.15, T.ffB - 0.4));
  E.lit(ctx, c => {
    guest = E.folk3(c, p, 'estj-female', GUEST[0], GUEST[1], { m: 1.62, a: gA, flip: true, dim: 0.3 * (1 - lmN), bob: Math.abs(Math.sin(t * 5)) * p.px(GUEST[1], 0.012) * (t < T.salty ? 1 : 0), lean: t > T.salty && t < T.salty + 0.6 ? -0.06 : 0 });
    if (iA > 0.01 && isZ < HZ) isfj = E.folk3(c, p, 'isfj-female', isX, isZ, isO);
  }, litO);
  if (!isfj) isfj = E.folk3(ctx, p, 'isfj-female', isX, isZ, { ...isO, a: 0 });
  const lpP = myPendant(ctx, p, Lm);
  // 灯光里漂的灰尘：停顿时最显眼（灯暗了，光柱里只剩它们在动）
  const dustA = 0.2 + 0.8 * sm(t, T.dark, T.darkE) * (1 - sm(t, T.stand, T.stood + 0.6));
  if (dustA > 0.02) {
    const sz = p.px(LAMP[1], 0.42), y0 = lpP[1] + sz * 0.5, y1 = p(LAMP[0], TB.top, LAMP[1])[1], w1 = p.px(LAMP[1], 1.9);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 34; i++) {
      const ph = (hash(i * 2.3) + t * 0.035 * (0.5 + hash(i * 3.7))) % 1, y = lerp(y0, y1, ph), wy = lerp(sz * 1.15, w1, ph);
      const x = lpP[0] + (hash(i * 5.9) - 0.5) * wy * 0.85 + Math.sin(t * 0.5 + i * 1.7) * 14, r = (1.6 + 3.2 * hash(i * 7.1)) * sz / 120;
      const a = dustA * (0.35 + 0.65 * Math.min(1, Lm * 2.5 + 0.35)) * Math.sin(ph * Math.PI) * (0.5 + 0.5 * Math.sin(t * 1.3 + i));
      ctx.fillStyle = rgba([255, 226, 180], 0.7 * a); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); glow(ctx, x, y, r * 4, [255, 214, 150], 0.25 * a);
    }
    ctx.restore();
  }
  E.bokeh(ctx, t, 0.5 + 0.5 * amb);
  fgProps(ctx, cam, t, (1 - sm(cam.f, 1500, 1900)) * (0.5 + 0.5 * amb));
  // C08 特写：景深光斑 + 喜（暖）/ 厌（冷）的侧光
  const faceA = sm(t, T.s + 0.2, T.faceIn) * (1 - sm(t, T.faceOut, T.wideIn));
  if (faceA > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    if (fx.like > 0) glow(ctx, 120, 1150, 760, [255, 190, 110], 0.2 * faceA);
    if (fx.like < 0) glow(ctx, 1000, 260, 760, [90, 150, 255], 0.24 * faceA);
    ctx.restore();
  }
  // D03B 门口的暖光：从右边一点点漫进来，铺到他身上
  const dW = sm(t, T.clap[0], T.stood) * (1 - sm(t, T.c11 + 0.4, T.c11 + 1.4));
  if (dW > 0.01) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(W, 0, W * 0.15, 0); g.addColorStop(0, `rgba(255,200,130,${0.3 * dW})`); g.addColorStop(0.55, `rgba(255,190,120,${0.1 * dW})`); g.addColorStop(1, 'rgba(255,190,120,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    glow(ctx, W + 80, hero.chest[1], 900 * (0.6 + 0.4 * dW), [255, 206, 140], 0.22 * dW);
    ctx.restore();
  }
  E.vignetteWarm(ctx, 0.42 + 0.2 * (1 - amb));
  LAST = { t, p, cam, hero, guest, isfj, far };
}

// ---------- 屏幕层：泡泡、念头树、快进角标 ----------
const SR = { x: 560, y: 470 };
// 树在灯暗下去之后长出，句末长满，停顿开头慢慢沉下去收干净（停顿里只剩他、蜡烛和灰尘）
T.tr0 = T.dark + 0.55; T.trEnd = T.c10e + 0.1; T.trBreak = T.c10e + 0.25; T.trGone = T.c10e + 1.05;
const SELF = makeTree({
  root: '', bubble: false, radial: true, family: 'Serif', rootXY: [SR.x, SR.y], seed: 53, maxDepth: 6, len: 120,
  t0: T.tr0, growEnd: T.trEnd,
  bounds: [30, 300, W - 30, 1180], labelBox: [40, 320, W - 120, 1150], ellipse: [520, 560],
  colors: { near: [250, 246, 240], mid: [255, 178, 196], far: [240, 84, 128], bad: [255, 110, 146] },
  gen1: [['不合口味', [350, 420], true], ['我没做好', [700, 400], true], ['他们嫌弃', [340, 660], true], ['下次别做', [710, 670], true]],
  labels: [['手艺退步', 0, 2, 0.4, 'mid'], ['不会做饭', 1, 2, 0.6, 'mid'], ['不喜欢我', 2, 3, 0.5, 'bad'], ['没用了', 3, 3, 0.4, 'bad']],
  filler: ['盐放多了', '太丢人', '白忙了', '笨', '扫兴', '不该请', '生气了', '再也不来', '又搞砸', '怪我', '难吃', '尴尬'],
});
function selfTree(ctx, t) {
  if (t < T.tr0 - 0.2 || t > T.trGone + 1.2) return;
  const dk = 0.6 * sm(t, T.tr0 - 0.1, T.tr0 + 0.8) * (1 - sm(t, T.trBreak, T.trGone));
  if (dk > 0.005) {
    const g = ctx.createRadialGradient(SR.x, SR.y + 150, 100, SR.x, SR.y + 150, 1100);
    g.addColorStop(0, `rgba(14,12,34,${dk * 0.8})`); g.addColorStop(1, `rgba(6,6,18,${Math.min(0.88, dk * 1.2)})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const shx = 0.35 * smooth(prog(t, T.trBreak, T.trGone));             // 念头慢慢往下沉、变灰，不炸
  SELF.draw(ctx, t, { alpha: sm(t, T.tr0 - 0.1, T.tr0 + 0.25) * (1 - sm(t, T.trBreak, T.trGone)), shatter: shx, push: [T.tr0, T.trEnd] });
}
function over(ctx, t) {
  const L = LAST; if (!L || Math.abs(L.t - t) > 1e-6) return;
  const { hero, guest, isfj, far } = L;
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  const hand = hero.hand, chest = hero.chest, head = hero.top, bubbles = [];
  // D02 三个评价泡泡：冒出 → 飞来 → 接住 → 捧回胸口 → 变灰消失
  const EV = [['发型真帅', 0, 30], ['领子歪了', 1, -30]];
  T.b.forEach((b, i) => {
    const [str, wi, tx] = EV[i], who = far[wi]; if (!who || t < b || t > b + BU[4]) return;
    const src = [clamp(who.top[0], 190, W - 190), Math.max(260, who.top[1] - 90)], u = t - b;
    let x = src[0], y = src[1], sc = B.popIn(t, b), gray = 0, a = 1;
    if (u > BU[0]) { const f = easeInOut(prog(u, BU[0], BU[1])); x = lerp(src[0], hand[0], f); y = lerp(src[1], hand[1], f) - Math.sin(f * Math.PI) * 60; sc = lerp(1, 0.85, f); }
    if (u > BU[1]) { const f = easeInOut(prog(u, BU[1], BU[2])); x = lerp(hand[0], chest[0], f); y = lerp(hand[1], chest[1] - 20, f); sc = lerp(0.85, 0.5, f) * (1 + 0.12 * spring(t, b + BU[1], 12, 30)); }
    if (u > BU[2]) { x = chest[0]; y = chest[1] - 20; gray = sm(u, BU[2], BU[3]); a = 1 - sm(u, BU[3], BU[4]); }
    if (u > BU[0] && u < BU[1]) for (let q = 1; q <= 5; q++) { const f = easeInOut(prog(u - q * 0.035, BU[0], BU[1])); glow(ctx, lerp(src[0], hand[0], f), lerp(src[1], hand[1], f) - Math.sin(f * Math.PI) * 60, 30 - q * 3, [255, 250, 230], 0.4 * (1 - q / 6)); }
    bubbles.push(() => B.say(ctx, str, x, y, a, { size: 54, gray, pop: sc, tail: u < BU[0] ? [tx, 80] : [0, 70] }));
  });
  // D03 「菜咸了」：撞到他脸上，变灰、落在桌上，3 小时后才消失
  if (guest && t > T.salty && t < T.ffB) {
    const src = [Math.min(W - 170, guest.top[0] - 20), guest.top[1] - 70], face = hero.face, u = t - T.salty;
    let x = src[0], y = src[1], sc = B.popIn(t, T.salty), gray = 0, a = 1;
    const H0 = T.hit - T.salty, fA = H0 - 0.27;                                     // 停一拍让人读清，再飞过去
    if (u > fA) { const f = Math.pow(prog(u, fA, H0), 2); x = lerp(src[0], face[0] + 40, f); y = lerp(src[1], face[1], f); }
    if (u > H0) { const f = prog(u, H0, H0 + 0.6); sc = (1 + 0.25 * spring(t, T.hit, 10, 28)) * lerp(1, 0.75, f); x = face[0] + 40 + 160 * easeOut(f); y = face[1] + 260 * f * f; gray = smooth(f); }
    if (u > H0 + 0.6) { const tb = L.p(0.55, TB.top, 3.6); x = tb[0]; y = tb[1] - 34; sc = 0.75; gray = 1; a = 1 - sm(t, T.ffA, T.ffA + 0.8); }
    bubbles.push(() => B.say(ctx, '菜咸了', x, y, a, { size: 56, gray, pop: sc, tail: [-30, 75] }));
    if (u > H0 && u < H0 + 0.32) { const f = (u - H0) / 0.32; for (let i = 0; i < 8; i++) { const an = i / 8 * Math.PI * 2; glow(ctx, face[0] + 40 + Math.cos(an) * 90 * f, face[1] + Math.sin(an) * 90 * f, 18, [210, 214, 226], 0.7 * (1 - f)); } }
  }
  // D03B 掌声：门那边先一个人轻轻鼓掌（一个泡泡），停半拍，再第二个、第三个。泡泡不飞，原地轻轻浮着；
  //       每响一个，一小团暖光慢慢飘到他胸口（余波），他站稳后泡泡一起慢慢淡掉，D04 前收干净
  const CP = [[840, 560], [905, 820], [720, 395]], cOut = 1 - sm(t, T.stood + 0.1, T.c11 - 0.05);
  T.clap.forEach((c, i) => {
    const u = t - c; if (u < 0 || cOut <= 0.01) return;
    const x = CP[i][0] + Math.sin(t * 1.1 + i * 2) * 6, y = CP[i][1] - 14 * easeOut(Math.min(1, u / 1.2)) + Math.sin(t * 1.6 + i) * 5;
    const clapK = 1 + 0.07 * Math.max(0, Math.sin(u * 13)) * Math.exp(-u * 1.6);      // 拍手时轻轻一鼓一鼓
    glow(ctx, x, y, 170, [255, 206, 140], 0.28 * cOut * sm(u, 0, 0.3));
    bubbles.push(() => B.say(ctx, '', x, y, cOut * sm(u, 0, 0.18), { icon: clapIcon, iconW: 104, pop: Math.max(0.02, B.popIn(t, c)) * clapK, tail: [-40, 66] }));
    const v = prog(u, 0.25, 1.35);
    if (v > 0 && v < 1) { const e = easeInOut(v), mx = lerp(x, chest[0], e), my = lerp(y, chest[1], e) - Math.sin(e * Math.PI) * 70; glow(ctx, mx, my, 46 * (1 - 0.4 * e), [255, 214, 140], 0.65 * Math.sin(v * Math.PI)); star4(ctx, mx, my, 9 * (1 - 0.5 * e), [255, 236, 190], 0.8 * Math.sin(v * Math.PI)); }
  });
  // D04 「我需要你」：放大单独出，停住让人读清
  if (isfj && t > T.need && t < T.c11e + 0.2) {
    const pp = isfj.top, u = t - T.need;
    const gray = sm(t, T.h2 + 0.4, T.h2 + 0.75), a = 1 - sm(t, T.h2 + 0.75, T.c11e + 0.2);
    bubbles.push(() => B.say(ctx, '我需要你', clamp(pp[0] - 120, 260, W - 260), Math.max(300, pp[1] - 110), a, { size: 72, gray, pop: B.popIn(t, T.need) * (1 + 0.06 * (u > 0.85 ? spring(t, T.h1, 8, 20) + spring(t, T.h2, 8, 20) : 0)), tail: [90, 95] }));
  }
  // D05 「对不起，是我」
  if (t > T.bow + 0.06 && t < T.c12e + 0.9) {
    const gray = sm(t, T.c12e - 0.1, T.c12e + 0.3), a = 1 - sm(t, T.c12e + 0.3, T.c12e + 0.9);
    bubbles.push(() => B.say(ctx, '对不起，是我', clamp(head[0] + 20, 280, W - 280), Math.max(300, head[1] - 100), a, { size: 56, gray, pop: B.popIn(t, T.bow + 0.06), tail: [30, 80] }));
  }
  selfTree(ctx, t);
  bubbles.forEach(f => f());
  B.ffBadge(ctx, '3小时后', 0.85 * win(t, T.ffTag, T.c10b + 0.35, 0.5, 0.45));   // 念头收干净后才轻轻出现
  ctx.restore();
}

const SFX = [
  { t: T.salty, k: 'pop' },
  { t: T.ffTag, k: 'ff' },
  { t: T.clap[0] + 0.05, k: 'pop' },
  { t: T.h1, k: 'heart' }, { t: T.h2, k: 'heart' },
  { t: T.knock, k: 'knock' },
];

module.exports = { draw, over, SFX, T };
