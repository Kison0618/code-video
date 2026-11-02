// 蚁巢演员表：每个时刻每只蚂蚁在哪、什么姿势（纯函数，时间全部取自句子）
'use strict';
const K = require('./core');
const { clamp, lerp, smooth, prog, easeOut, easeInOut } = K;
const TL = require('./timeline');
const { L, at } = TL;
const ANT = require('./ant');
const NW = require('./nest_world');
const KIT = require('./nest_kit');

const U = 26, FOOT = ANT.FOOT * U;
const fl = x => NW.floorY('M', x);
const fy = x => fl(x) - FOOT;
const DEADY = x => fl(x) - 2.25 * U;

const P_OUT = KIT.mkPath([[1200, fy(1200)], [1000, fy(1000)], [600, fy(600)], [470, 770], [400, 690], [350, 600], [315, 480], [288, 360], [262, 240], [248, 150], [200, NW.SURF - FOOT], [-400, NW.SURF - FOOT]]);
const dOf = x => 200 + (1000 - x);                 // 地面段上 x 对应的路程（1000 处 = 200）
const D_HOLE = P_OUT.L[9];
const inR = x => KIT.mkPath([[1640, 377], [1705, 560], [1680, 700], [1560, fy(1560)], [x, fy(x)]]);
const inL = x => KIT.mkPath([[300, 430], [330, 550], [375, 670], [450, 750], [600, fy(600)], [x, fy(x)]]);
const P_W1 = inR(1110), P_W2 = inR(900), P_A = inL(820), P_B = inR(1230), P_C1 = inR(930), P_C2 = inR(720);

const T = {
  smell: at('004', '气味'), other: at('004', '其他'), mate: at('004', '同伴'), lift: at('004', '抬出'),
  useful: at('005', '实用'), aIn: L('005').t0 + 0.2, bIn: L('005').t0 + 0.7,
  brush0: at('006', '气味') - 0.3, dab: at('006', '涂到') + 0.1, push: at('006', '有意思'),
  s7: L('007').t0, s8: L('008').t0, s9: L('009').t0, alive: at('009', '活着'), s10: L('010').t0, toss: at('010', '扔出'),
  s11: L('011').t0, minis: at('011', '很多时候'), s12: L('012').t0,
};
T.carry = T.lift + 0.55; T.carryEnd = T.carry + (P_OUT.len - 200) / 340;
T.liftA = T.alive + 0.1;

// 沿路径走：在 [ta,tb] 内从 0 走到终点
function walkPath(p, t, ta, tb, extra = {}) {
  const d = p.len * easeInOut(prog(t, ta, tb)), o = KIT.pose(p, d);
  return { ...o, walk: t > ta && t < tb ? d / KIT.STRIDE * 6.283 : null, ...extra };
}
function onOut(d, back, extra = {}) { const o = KIT.pose(P_OUT, d, back); return { ...o, ...extra }; }
function patrol(room, x0, x1, sp, t, ph, extra = {}) {
  const len = x1 - x0, s = ((t * sp + ph) % (2 * len) + 2 * len) % (2 * len);
  const fwd = s < len, x = fwd ? x0 + s : x1 - (s - len);
  return { x, y: NW.floorY(room, x) - FOOT * (extra.s || 1), dir: fwd ? 1 : -1, walk: t * sp / KIT.STRIDE * 6.283, ...extra };
}

function cast(t) {
  const ants = [], fx = { wisps: [], bubbles: [], minis: [], brush: null, coil: null };
  const miniA = k => smooth(prog(t, T.minis + k * 0.18, T.minis + k * 0.18 + 0.4));
  // —— 004：尸体、两只工蚁闻到、抬走 ——
  if (t < T.carryEnd + 0.5) {
    const lp = smooth(prog(t, T.lift, T.lift + 0.5));
    const dc = 200 + Math.max(0, t - T.carry) * 340;
    const front = onOut(dc + 100), back = onOut(dc - 105);
    const w1 = t < T.lift ? walkPath(P_W1, t, T.other - 0.3, T.other + 1.5, { sniff: prog(t, T.other + 1.2, T.other + 1.5) }) : { ...back, walk: t > T.carry ? (dc - 105) / KIT.STRIDE * 6.283 : null };
    const w2 = t < T.lift ? walkPath(P_W2, t, T.mate - 0.2, T.mate + 1.7) : { ...front, walk: t > T.carry ? (dc + 100) / KIT.STRIDE * 6.283 : null };
    const cp = onOut(dc), [ux, uy] = KIT.up(cp);
    const corpse = { x: lerp(1000, cp.x + ux * 3.8 * U, lp), y: lerp(DEADY(1000), cp.y + uy * 3.8 * U, lp), ang: lerp(0, cp.ang, lp), dir: lp > 0.5 ? cp.dir : 1, pal: 'DEAD', flip: true, curl: 1, eye: 'x', droop: 1.3, still: true };
    if (t > T.mate - 0.2) ants.push({ ...w2, pal: 'W2', s: 0.92, y: w2.y - 12, layer: 0 });
    ants.push({ ...corpse, layer: 1 });
    if (t > T.other - 0.3) ants.push({ ...w1, pal: 'W', layer: 2 });
    const sa = smooth(prog(t, T.smell, T.smell + 0.9)) * (1 - smooth(prog(t, T.carryEnd - 1.2, T.carryEnd)));
    for (let k = 0; k < 3; k++) fx.wisps.push([corpse.x - 70 + k * 60, corpse.y - 40, 170 + k * 30, k * 2.1, sa, smooth(prog(t, T.smell + k * 0.2, T.smell + k * 0.2 + 1.2))]);
  }
  // —— 005–011：A（红）和 B（黑）——
  const lifted = smooth(prog(t, T.liftA, T.liftA + 0.5));
  const dA0 = dOf(820), dA = t < T.s10 ? dA0 : lerp(dA0, D_HOLE, easeInOut(prog(t, T.s10, T.toss)));
  let A;
  if (t < T.liftA) A = walkPath(P_A, t, T.aIn, T.aIn + 2.4);
  else if (t < T.toss) {
    const o = onOut(dA), [ux, uy] = KIT.up(o), base = KIT.pose(P_OUT, dA);
    A = { ...o, x: lerp(820, base.x + ux * 3.8 * U, lifted), y: lerp(fy(820), base.y + uy * 3.8 * U, lifted), ang: lifted > 0.5 ? o.ang : 0, dir: lifted > 0.5 ? o.dir : 1, sy: Math.cos(Math.PI * lifted), flail: lifted };
  } else {
    const k = prog(t, T.toss, T.toss + 0.8), h = KIT.posAt(P_OUT, D_HOLE), lx = 660, ly = NW.SURF - 2.25 * U;
    const x = lerp(h[0], lx, k), y = lerp(h[1], ly, k) - Math.sin(k * Math.PI) * 110;
    A = { x, y, ang: k < 1 ? k * 6.283 * 1.25 : 0, dir: 1, sy: -1, flail: 1 - 0.6 * smooth(prog(t, T.toss + 1, T.toss + 4)) };
  }
  const eyeA = t > T.s9 ? 'shock' : 'open';
  if (t > T.aIn) ants.push({ ...A, pal: 'A', eye: eyeA, wave: smooth(prog(t, T.s7 - 0.1, T.s7 + 0.2)) * (1 - smooth(prog(t, L('007').t1, L('007').t1 + 0.3))), stain: smooth(prog(t, T.dab, T.dab + 0.5)), layer: 3, id: 'A' });
  const B = walkPath(P_B, t, T.bIn, T.bIn + 2.4, { eye: 'flat', pal: 'B', layer: 2, id: 'B', headTilt: t > T.s8 && t < T.s9 ? -0.05 : 0 });
  if (t > T.bIn) ants.push(B);
  // 抬走 A 的两只
  if (t > T.s9 - 0.1) {
    let c1, c2;
    if (t < T.s10) { c1 = walkPath(P_C1, t, T.s9 - 0.1, T.alive); c2 = walkPath(P_C2, t, T.s9 + 0.05, T.alive + 0.1); }
    else if (t < T.toss + 0.3) { c1 = { ...onOut(dA - 110), walk: (dA - 110) / KIT.STRIDE * 6.283 }; c2 = { ...onOut(dA + 100), walk: (dA + 100) / KIT.STRIDE * 6.283 }; }
    else {
      const r = easeInOut(prog(t, T.toss + 0.3, T.toss + 3.3));
      const d1 = lerp(D_HOLE - 110, dOf(1360), r), d2 = lerp(D_HOLE + 100, dOf(560), r);
      c1 = { ...onOut(d1, true), walk: r < 1 ? -d1 / KIT.STRIDE * 6.283 : null }; c2 = { ...onOut(d2, true), walk: r < 1 ? -d2 / KIT.STRIDE * 6.283 : null };
    }
    ants.push({ ...c2, pal: 'W2', s: 0.92, y: c2.y - 12, layer: 0 }, { ...c1, pal: 'W', layer: 4 });
  }
  if (t > T.minis) fx.minis.push([B.x, B.y - 165, miniA(0)]);
  // 刷子、污渍、缠绕的气味线
  if (t > T.brush0 && t < T.dab + 1.8) {
    const tip = ANT.pt({ ...A, s: 1 }, -3.4, -2.25);
    const down = easeOut(prog(t, T.brush0, T.dab)), upk = smooth(prog(t, T.dab + 0.7, T.dab + 1.7));
    fx.brush = [tip[0] + Math.sin(t * 22) * 10 * (t > T.dab && t < T.dab + 0.7 ? 1 : 0), tip[1] - 900 * (1 - down) - 900 * upk, 1];
  }
  if (t > T.dab + 0.3) { fx.coil = [A, smooth(prog(t, T.dab + 0.3, T.dab + 1.5))]; fx.wisps.push([A.x - 40, A.y - 60, 140, 5.0, 0.8 * smooth(prog(t, T.dab + 0.5, T.dab + 1.2)), 1]); }
  // 对话气泡（锚点：头顶）
  const head = o => ANT.pt({ ...o, s: 1 }, 3.0, -2.6);
  fx.bubbles.push({ who: A, at: head(A), text: '嗨，兄弟，今儿怎么样？', a: [T.s7 - 0.05, T.s8 + 0.05] });
  fx.bubbles.push({ who: B, at: head(B), text: '你好像有点死了。来人啊。', a: [T.s8 - 0.05, T.s9 + 0.05] });
  fx.bubbles.push({ who: A, at: head(A), text: '？？？我还活着啊！', a: [T.s9 - 0.05, T.s10 + 0.4], shout: true });
  // —— 别的蚁室：一样的程序，一样地忙（拉远时看到）——
  const bg = [
    patrol('C2', -460, -80, 120, t, 0, { pal: 'W', s: 0.85 }), patrol('R1', 1360, 1480, 60, t, 120, { pal: 'W2', s: 0.85 }),
    patrol('C4', 1380, 1980, 150, t, 0, { pal: 'W', s: 0.85 }), patrol('C4', 1380, 1980, 150, t, 330, { pal: 'W2', s: 0.85 }),
    patrol('C5', 2080, 2300, 90, t, 60, { pal: 'W', s: 0.85 }), patrol('C6', 720, 1200, 110, t, 200, { pal: 'W2', s: 0.85 }),
  ];
  ants.push(...bg.map(o => ({ ...o, layer: 1 })));
  // C3：两只抬着另一具“尸体”来回走
  const g = patrol('C3', 80, 520, 100, t, 0, { pal: 'W', s: 0.85 }), gx = g.x;
  for (const off of [-90, 90]) ants.push({ ...g, x: gx + off * g.dir, y: NW.floorY('C3', gx) - FOOT * 0.85, layer: 1 });
  ants.push({ x: gx, y: NW.floorY('C3', gx) - FOOT * 0.85 - 3.2 * U * 0.85, s: 0.85, dir: g.dir, pal: 'DEAD', flip: true, curl: 1, eye: 'x', droop: 1.3, still: true, layer: 1 });
  // 011：只给 5 只（每个蚁室一只）头上浮一张卡，互不重叠
  bg.forEach((o, k) => { if ([0, 2, 4].includes(k) && t > T.minis) fx.minis.push([o.x, o.y - 150, miniA(1 + k)]); });
  if (t > T.minis) fx.minis.push([gx, NW.floorY('C3', gx) - 300, miniA(3)]);
  ants.sort((a, b) => (a.layer || 0) - (b.layer || 0));
  return { ants, fx, A, B };
}

module.exports = { cast, T, U };
