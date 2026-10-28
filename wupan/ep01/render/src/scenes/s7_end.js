// 收尾 034–036（C 线）
//   034 回到人脑：两张卡「贵 = 好」「好比较 → 就选它」；“认知倾向”标签；“很有用”绿光 + 勾；“经常出错”闪红 + 叉；
//       “生活”“事业”两张纸签，“犯大错”一张「大错」小票掉下来；“被别人故意操纵”木偶手从上方伸进来，提线垂下挂住两张卡，
//       “操纵”一拽，两张卡被吊着晃（保持正面）
//   035 芒格版画 +「芒格」名签；“人类误判心理学”大字拍下；“这样的心理误差”一排 25 张背面朝上的卡发下来；
//       “足足有二十五种”大号数字从 1 滚到 25，数到哪张哪张亮金边
//   036 回到人脑（卡还是背面、手还提着）；“了解它们”两张卡翻回正面、亮起；“想得更清楚”颅腔放光；
//       “不被别人控制”四根提线一根根断开，手缩回去；“快来学习吧”画面缩到左边，右边出系列名「人类误判心理学」和「下一集」
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const C = require('../card');
const CUT = require('../cutout');
const B = require('../brain');
const KIT = require('../kit');
const E = require('../kit_end');
const { L, at } = TL;

// —— 时间（全部从句子取）——
const T0 = L('034').t0 - 0.3;
const T = {
  many: at('034', '很多'), tend: at('034', '认知倾向'), useful: at('034', '很有用'), err: at('034', '却经常出错'),
  guard: at('034', '不加提防'), life: at('034', '生活'), career: at('034', '事业'), big: at('034', '犯大错'),
  hand: at('034', '还会') + 0.05, other: at('034', '被别人'), manip: at('034', '操纵'),
  b0: L('035').t0 - 0.25, munger: at('035', '芒格'), title: at('035', '人类误判'), deal: at('035', '这样的'), count0: at('035', '足足'), n25: at('035', '二十五'),
  c0: L('036').t0 - 0.25, know: at('036', '了解'), clear: at('036', '想得更清楚'), free: at('036', '不被'), ctrl: at('036', '控制'),
  so: at('036', '所以'), learn: at('036', '快来'),
};
T.drop = [T.hand + 0.45, T.hand + 0.85];                       // 提线垂下来挂住卡
T.jerk = T.manip - 0.12;                                       // 一拽
T.flipDown = T.manip + 0.08;                                   // 被拽得翻到背面（034 句末前翻完）
T.flipUp = [T.know + 0.05, T.know + 0.35];                     // 036 两张卡依次翻回正面
T.snap = [0, 1, 2, 3].map(i => T.free + 0.05 + i * 0.15);       // 说到“不被”起 0.6 秒内四根线依次断
T.away = T.snap[3] + 0.3;                                      // 手缩回
T.fin = T.so - 0.05;                                           // 画面缩到左边
T.series = T.learn - 0.1;

// ======================= 人脑 + 两张卡 + 木偶手（034 / 036 共用）=======================
// 人头比 012 小一号、靠下，给头顶上的木偶手留出位置（手要整只看得见）
const HD = { x: 760, y: 1250, h: 1010 };
const SIZE = 48;
const CARDS = [
  { text: '贵 = 好', x: 700, y: 420, rot: 0.012, seed: 31, ph: 0 },
  { text: '好比较 → 就选它', x: 700, y: 585, rot: -0.012, seed: 32, ph: 1.7 },
].map(c => { const [w, h] = E.cardSize(c.text, SIZE); return { ...c, w, h }; });
const HAND = { x: 700, y: 300, h: 540 };
// 四根线：后左 → 下卡左，前左 → 上卡左，前右 → 上卡右，后右 → 下卡右（下卡的线挂得靠外，绕开上卡）
const WIRES = [[1, -1], [0, -1], [0, 1], [1, 1]];
const attachLocal = (c, side) => [side * (c.w / 2 - (c.w > 450 ? 20 : 40)), -c.h / 2 + 8];
const cranium = () => CUT.pt(B.HEAD, HD.x, HD.y, HD.h, B.CR.u, B.CR.v);

// st: {glass, hand:[dx,dy]|null, handA, drop, cards:[{dx,dy,rot,flip,tick,tint,x(叉),lit}], snap:[p×4], shine, rays}
function brainScene(ctx, t, st) {
  const [cx, cy] = cranium();
  // 放光（036 “想得更清楚”）：头后面一圈慢慢转的金色光芒
  if (st.rays > 0.01) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(t * 0.08);
    for (let k = 0; k < 18; k++) {
      ctx.rotate(Math.PI * 2 / 18);
      const g = ctx.createLinearGradient(0, 0, 1100, 0);
      g.addColorStop(0, `rgba(255,210,100,${0.34 * st.rays})`); g.addColorStop(1, 'rgba(255,210,100,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(1100, -95); ctx.lineTo(1100, 95); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  B.head(ctx, { x: HD.x, y: HD.y, h: HD.h, glass: st.glass });
  if (st.shine > 0.01) E.glowBehind(ctx, cx, cy, 520, 360, st.shine * 0.8, [255, 236, 170]);

  // 卡片的当前位置（挂点要用）
  const pose = CARDS.map((c, i) => {
    const s = st.cards[i];
    return { x: c.x + (s.dx || 0), y: c.y + (s.dy || 0), rot: c.rot + (s.rot || 0), sx: Math.max(0.03, Math.abs(Math.cos(clamp(s.flip || 0) * Math.PI))) };
  });
  const attach = (i, side) => {
    const c = CARDS[i], p = pose[i], [lx, ly] = attachLocal(c, side), x = lx * p.sx;
    return [p.x + x * Math.cos(p.rot) - ly * Math.sin(p.rot), p.y + x * Math.sin(p.rot) + ly * Math.cos(p.rot)];
  };
  const hp = st.hand ? [HAND.x + st.hand[0], HAND.y + st.hand[1]] : null;
  const hk = hp ? E.hooks(hp[0], hp[1], HAND.h) : null;

  // 线在卡后面（挂点在卡的上沿）
  if (hk && st.drop > 0) WIRES.forEach(([ci, side], k) => {
    const sp = st.snap ? st.snap[k] : 0;
    E.string(ctx, hk[k], attach(ci, side), { drop: easeOut(st.drop), snap: sp, side: side, alpha: st.handA, sag: 6 });
  });

  CARDS.forEach((c, i) => {
    const s = st.cards[i], p = pose[i];
    if (s.alpha != null && s.alpha <= 0.01) return;
    ctx.save(); if (s.alpha != null) ctx.globalAlpha *= s.alpha;
    const sc = s.scale == null ? 1 : s.scale;
    if (s.lit > 0.01) E.glowBehind(ctx, p.x, p.y, c.w * 0.95 * sc, c.h * 1.6 * sc, s.lit);
    if (s.green > 0.01) E.glowBehind(ctx, p.x, p.y, c.w * 0.9, c.h * 1.5, s.green, [120, 200, 90]);
    E.flipCard(ctx, p.x, p.y, s.flip || 0, p.rot, x => {
      if (sc !== 1) x.scale(sc, sc);
      B.ruleCard(x, 0, 0, c.text, SIZE, { rot: 0, seed: c.seed, tick: s.tick || 0, tint: s.tint || 0 });
      if (s.x > 0.01) { const k = SIZE / 46; E.cross(x, c.w / 2 - 52 * k, -c.h / 2 + 50 * k, 46 * k, s.x); }
    }, x => { if (sc !== 1) x.scale(sc, sc); E.cardBack(x, c.w, c.h, { seed: c.seed }); });
    ctx.restore();
  });

  if (hp) E.hand(ctx, hp[0], hp[1], HAND.h, st.handA);
}

// ======================= 034 =======================
function handOff034(t) {
  const e = easeOut(prog(t, T.hand, T.hand + 0.6));
  let dx = 0, dy = -(1 - e) * 640;
  const J = t - T.jerk;
  if (J > 0) { dy += -46 * easeOut(prog(J, 0, 0.18)) + 16 * Math.sin(J * 11) * Math.exp(-J * 3); dx += 30 * Math.sin(J * 8) * Math.exp(-J * 2.2); }
  return [dx, dy];
}
const LIFT_END = -46;   // 034 末手的抬高量（036 接着用）
function shotA(ctx, t) {
  const glass = smooth(prog(t, T0 + 0.1, T0 + 0.6));
  const red = smooth(prog(t, T.err - 0.05, T.err + 0.15));
  const flash = red * (0.3 + 0.28 * Math.max(0, Math.sin((t - T.err) * 11))) * (1 - 0.6 * smooth(prog(t, T.guard + 0.6, T.guard + 1.2)));
  const att = t >= T.drop[1];
  const cards = CARDS.map((c, i) => {
    const pop = easeOut(prog(t, T.many + i * 0.25, T.many + i * 0.25 + 0.35));
    const s = { alpha: clamp(pop * 1.5), scale: 0.6 + 0.4 * pop + Math.sin(clamp(pop) * Math.PI) * 0.08 };
    s.green = smooth(prog(t, T.useful, T.useful + 0.3)) * (1 - smooth(prog(t, T.err - 0.1, T.err + 0.1))) * 0.9;
    s.tick = prog(t, T.useful + 0.1 + i * 0.15, T.useful + 0.45 + i * 0.15) * (t < T.err ? 1 : 0);
    s.x = prog(t, T.err + i * 0.12, T.err + 0.35 + i * 0.12);
    s.tint = flash;
    if (att) {
      const [hx, hy] = handOff034(t - 0.07 - i * 0.04);
      const J = t - T.jerk;
      s.dx = hx; s.dy = hy; s.rot = J > 0 ? 0.07 * Math.sin(J * 9 + c.ph) * Math.exp(-J * 2) : 0;
    }
    s.flip = 0;                                  // 被操纵时卡片保持正面，观众要看得见被吊着的是哪两条规则
    return s;
  });
  brainScene(ctx, t, { glass, hand: t > T.hand ? handOff034(t) : null, handA: 1, drop: prog(t, T.drop[0], T.drop[1]), cards });

  // 右边：认知倾向 → 生活 / 事业 → 大错
  const tendA = 1 - smooth(prog(t, T.guard - 0.2, T.guard + 0.2));
  if (tendA > 0.01) {
    const p = KIT.pop(t, T.tend);
    if (p > 0.01) {
      ctx.save(); ctx.globalAlpha = tendA * clamp(p * 1.5);
      ctx.strokeStyle = '#5a4630'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(1450, 300); ctx.quadraticCurveTo(1200, 260, CARDS[0].x + CARDS[0].w / 2 + 10, CARDS[0].y - 20); ctx.stroke();
      ctx.restore();
    }
    KIT.label(ctx, 1580, 260, '认知倾向', { pop: p, size: 64, alpha: tendA, seed: 5 });
  }
  KIT.label(ctx, 1460, 420, '生活', { pop: KIT.pop(t, T.life), size: 60, rot: -0.04, seed: 6 });
  KIT.label(ctx, 1720, 420, '事业', { pop: KIT.pop(t, T.career), size: 60, rot: 0.03, seed: 7 });
  const f = prog(t, T.big - 0.15, T.big + 0.35);
  if (f > 0) {
    const fall = easeIn(f), land = t - (T.big + 0.35);
    const bounce = land > 0 ? -18 * Math.abs(Math.sin(land * 9)) * Math.exp(-land * 5) : 0;
    E.receipt(ctx, 1590, lerp(-200, 690, fall) + bounce, '大错', { rot: lerp(0.5, -0.08, easeOut(f)) + (land > 0 ? 0.02 * Math.sin(land * 9) * Math.exp(-land * 4) : 0), w: 330, h: 290 });
  }
}

// ======================= 035 =======================
const MUNGER = CUT.get('eng_munger');
const NC = 25, CW = 84, CH = 120, STEP = 46, ROWY = 770, MIDX = 1290;
const RND = (() => { const r = K.mulberry32(25); return Array.from({ length: NC }, () => [(r() - 0.5) * 0.08, (r() - 0.5) * 10]); })();
// 数字 1 → 25：每个数先停住，只在换下一个数前的一小段时间里滚过去（每帧都看得清是几）
const cnt = t => { const v = lerp(1, 25, easeInOut(prog(t, T.count0, T.n25 + 0.55))), i = Math.floor(v); return i + smooth(clamp((v - i - 0.55) / 0.45)); };
function shotB(ctx, t) {
  const z = prog(t, T.b0, L('035').t1 + 0.4);
  // 芒格：照片转的版画是横构图（约 1.3:1），高 700 时宽约 910；左缘切口出画，右肩只压到第一两张卡底下
  CUT.place(ctx, MUNGER, 280, 965, 700 * (1 + 0.025 * z));
  KIT.nameTag(ctx, 380, 880, '芒格', KIT.pop(t, T.munger));
  E.slab(ctx, MIDX, 250, '人类误判心理学', prog(t, T.title - 0.05, T.title + 0.25), { size: 116, rot: -0.02 });
  // 25 张背面朝上的卡
  const v = t >= T.count0 ? cnt(t) : 0;
  for (let i = 0; i < NC; i++) {
    const d = easeOut(prog(t, T.deal + i * 0.04, T.deal + i * 0.04 + 0.35));
    if (d <= 0.01) continue;
    const x = MIDX - (NC - 1) * STEP / 2 + i * STEP, y = ROWY + RND[i][1];
    const sx = lerp(W + 140, x, d), sy = lerp(560, y, d) - Math.sin(d * Math.PI) * 120;
    const on = v >= i + 1, ct = T.count0 + (T.n25 + 0.55 - T.count0) * i / 24;   // 大致的被数到时刻（只用于抬起动画）
    const lift = on ? -22 * Math.sin(clamp((t - ct) / 0.3) * Math.PI) - 8 : 0;
    ctx.save(); ctx.translate(sx, sy + lift); ctx.rotate(RND[i][0] + (1 - d) * 0.6);
    E.cardBack(ctx, CW, CH, { seed: 40 + i, rim: on ? 0.75 : 0 });
    ctx.restore();
  }
  // 大号数字 1 → 25
  const np = KIT.pop(t, T.count0 - 0.1);
  if (np > 0.01) KIT.popScale(ctx, MIDX, 520, np, x => {
    const ns = 230, w = NUMW, cw = 130;
    const tot = w + 20 + cw;
    KIT.roll(x, Math.round(v), -tot / 2 + w, 0, ns, { digits: 2, color: E.RED });   // 整数逐个跳
    x.fillStyle = E.INK; x.font = '900 130px Sans'; x.textAlign = 'left'; x.textBaseline = 'middle';
    x.fillText('种', -tot / 2 + w + 20, 8);
  });
}
const NUMW = (() => { const cv = new K.Canvas(10, 10), x = cv.getContext('2d'); x.font = '700 230px Num'; return x.measureText('0').width * 1.02 * 2; })();

// ======================= 036 =======================
function shotC(ctx, t) {
  const sway = t * 1.6;
  const away = easeIn(prog(t, T.away, T.away + 0.6));
  const hand = [12 * Math.sin(sway), LIFT_END + 6 * Math.sin(sway * 1.3) - away * 760];
  const lit = smooth(prog(t, T.flipUp[1] + 0.2, T.flipUp[1] + 0.6));
  const clear = smooth(prog(t, T.clear - 0.1, T.clear + 0.5));
  const snap = T.snap.map(s => clamp(prog(t, s, s + 0.35)));
  const cards = CARDS.map((c, i) => {
    // 这张卡的两根线都断了才算“自由”：落回原位、停止摆动
    const mine = WIRES.map((w, k) => (w[0] === i ? T.snap[k] : null)).filter(v => v != null);
    const free = smooth(prog(t, Math.max(...mine), Math.max(...mine) + 0.45));
    const held = 1 - free;
    const s = {
      dx: hand[0] * held, dy: LIFT_END * held + (free > 0 && free < 1 ? -10 * Math.sin(free * Math.PI) : 0),
      rot: 0.025 * Math.sin(sway * 1.1 + c.ph) * held,
      flip: 0,
      lit: lit * (0.75 + 0.25 * Math.sin(t * 3 + i)),
    };
    return s;
  });
  const fz = easeInOut(prog(t, T.fin, T.fin + 0.6));
  ctx.save();
  if (fz > 0) { const s = lerp(1, 0.74, fz); ctx.translate(260, 600); ctx.scale(s, s); ctx.translate(-260, -600); }
  brainScene(ctx, t, { glass: 1, hand: away < 1 ? hand : null, handA: 1, drop: 1, cards, snap, shine: clear, rays: clear * (1 - 0.3 * fz) });
  ctx.restore();
  // 系列名 + 下一集
  E.slab(ctx, 1450, 400, '人类误判心理学', prog(t, T.series, T.series + 0.3), { size: 100, rot: -0.02 });
  const np = prog(t, T.series + 0.35, T.series + 0.65);
  if (np > 0.01) {
    const w = E.slab(ctx, 1450, 600, '下一集', np, { size: 72, font: 'Sans', bg: E.INK, color: '#fbf3df', rot: 0.02, seed: 66 });
    // 右边一个小三角（播放箭头）
    const a = clamp(np * 3), nudge = 8 * Math.sin(Math.max(0, t - T.series - 0.7) * 6);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(1450 + w / 2 + 50 + nudge, 600); ctx.fillStyle = E.RED;
    ctx.beginPath(); ctx.moveTo(-22, -32); ctx.lineTo(30, 0); ctx.lineTo(-22, 32); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
}

// ======================= 合成 =======================
const SHOTS = [
  { a: T0 - 1, draw: () => {} },                 // 占位：第一镜头也从右边滑进来，盖住故事二最后一帧
  { a: T0, draw: shotA, tr: 'slide' },
  { a: T.b0, draw: shotB, tr: 'slide' },
  { a: T.c0, draw: shotC, tr: 'slide' },
];
module.exports = {
  t0: T0, t1: TL.DUR,
  draw(ctx, t) { if (t < T0) return; KIT.shots(ctx, t, SHOTS); },
  T,
};
