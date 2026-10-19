// 《火柴人 VS 乱码》v3（SCENE=garble2）——剧本 stickman/剧本/火柴人VS乱码_v3.md 的"前 1 分钟节拍表"
// v2 的前 64 秒（scene_garble.js）保留不动。v3 的原则：开头只玩几秒就出事；新知识直接在打斗里用；只有他、电脑、代码、小蛇、乱码；
// 反应 0.1 秒到位、定 0.3 秒就接下一件事。
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E, mulberry32 } = K;
const { Actor2, FightFX } = require('./fight');
const { Director } = require('./director');
const { Code } = require('./code');
const { Snake, spline } = require('./snake');
const PR = require('./props');
const GB = require('./garble');

const HH = 300, LW = 0.5 * HH, F = 1 / 24;
const D = new Director(), clock = D.clock, cam = D.cam;
const fx = new FightFX(HH);
const GRIP_UNDER = [-0.18 * LW, 0.07 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];
let KEYS = [];
const keyTimes = c => { const out = []; for (let i = 1; i < c.snaps.length; i++) if (c.snaps[i].text !== c.snaps[i - 1].text && Math.abs(c.snaps[i].text.length - c.snaps[i - 1].text.length) <= 4) out.push(c.snaps[i].t); return out; };
function tapAt(t) {
  let d = 0, k = -1;
  for (let i = 0; i < KEYS.length; i++) { const a = t - KEYS[i]; if (a >= -0.03 && a <= 0.12) { k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07); } }
  return { d, k };
}
const keyPoint = t => { const tp = tapAt(t); return [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; };
const typing = (a, t) => a.hand('B', t, 'obj', GRIP_UNDER).hand('F', t + 0.05, 'obj', keyPoint);

// ———————————————— 布局：主角停在 XH；小蛇跟在他身后（左边）；乱码从左边远处顺着地面爬过来 ————————————————
const XH = 200, XS0 = XH - 0.75 * HH, GAP = 62, CXB = -330;
const CS = 50, LH = CS * 1.32, CX = -360, CY = -2.05 * HH;
const TAME = 'n = 0\nwhile n < 3:\n    print("hi")\n    n = n + 1';
const code = new Code({ x: CX, y: CY, size: CS, seed: 5 });
const code2 = new Code({ x: CX, y: CY + 4.2 * LH, size: CS, seed: 6, cps: 14 });
const OUTP = [CX + 7 * CS * 0.5, CY + 2 * LH + 20];                           // print 那一行：输出从这里飞出来

const hero = new Actor2({ H: HH, x0: -1500, dir: 1, clock, lean: 2, headTilt: 0 });
const ST = hero.STAND;
let t;

// ════════════════ 0:00 接上一集：他抱着电脑走进来，小蛇跟在身后 ════════════════
const GLINT = [[1.0, 1.06], [2.2, 2.26]];                                     // 身后远处（上一集长蛇碎掉的地方）一个 � 闪 3 帧
D.cue(1.0, 'glitch', { v: 0.15 }); D.cue(2.2, 'glitch', { v: 0.12 });
hero.obj(0, 'held', { fwd: 0.18, up: 0.06 }).hand('B', 0, 'obj', GRIP_UNDER);
hero.hand('F', 0, 'free', s => [0.05 + 0.08 * Math.sin(s * 8), 0.35]);
const W1 = hero.walk(0, XH, { stepDur: 0.36 });
const TS = W1.t;
D.shot(0, 0.01, { on: [[-700, -200]], kind: 'wide', z: 0.3 });
// 小蛇：跟在身后 0.75H；2.3 秒停一下、抬头往后看，再追上
const TLOOK = 2.3;
const sx = s => { const f = hero.hipNow(s)[0] - 0.75 * HH; if (s < TLOOK) return f; const fz = hero.hipNow(TLOOK)[0] - 0.75 * HH; return s < TLOOK + 0.5 ? fz : lerp(fz, f, E.inOut(clamp((s - TLOOK - 0.5) / 0.6))); };
const kS = [];
for (let tk = 0; tk <= TS + 0.4; tk += 0.1) kS.push([tk, sx(tk), -30]);                 // 轨迹里不要上下抖：原地抖会让蛇身挤成一团（抖动放在 bob 里）

// ════════════════ 0:04 打开电脑：上一集的代码还在。3 改 5，小蛇多长两节（最后一节路上闪了一下） ════════════════
code.set(-1, TAME, TAME.length).fadeOut(-1e9, TS + 0.1);
hero.turn(TS + 0.05, -1).obj(TS + 0.05, 'held', { fwd: 0.24, up: 0.05 });
typing(hero, TS + 0.1);
hero.look(TS + 0.15, [CX + 160, CY + LH], { dur: 0.2 });
D.shot(TS - 0.6, 1.4, { on: [hero, [XS0 - 4 * GAP, -40], [CX - 20, CY - 60], [CX + 340, CY + 3 * LH]], kind: 'full' });
const I3 = TAME.indexOf('3');
code.select(TS + 0.4, I3, I3 + 1).type(TS + 0.6, '5', 6);
const TR1 = code.tEnd + 0.3;
code.run(TR1);
const flyers = [];                                                            // 飞着的字：{ t0, t1, from, to(t), str, arc, garble:[[a,b]] }
let nSeg = s => 3;
const TA3 = TR1 + 0.5, TA4 = TR1 + 0.68;
flyers.push({ t0: TR1 + 0.1, t1: TA3, from: OUTP, to: s => seg(s, 3), str: 'hi', arc: 120 });
flyers.push({ t0: TR1 + 0.25, t1: TA4, from: OUTP, to: s => seg(s, 4), str: 'hi', arc: 150, garble: [[TR1 + 0.42, TR1 + 0.54]] });
D.cue(TR1 + 0.1, 'output', { v: 0.6 }); D.cue(TR1 + 0.25, 'output', { v: 0.6 }); D.cue(TR1 + 0.42, 'glitch', { v: 0.1 });
hero.look(TR1 + 0.2, [XS0 - 3 * GAP, -40], { dur: 0.25 });

// ════════════════ 0:10 jump()：回车那一帧 u 变成了 锟 → NameError；凑近看又是好的；再跑，跳了 ════════════════
t = TA4 + 0.5;
hero.look(t, [CX + 100, code2.y], { dur: 0.2 });
code2.type(t + 0.15, 'jump()', 14);
const TJR = code2.tEnd + 0.3;
code2.set(TJR - 0.04, 'j锟mp()').run(TJR, 0.3, 'run').set(TJR + 0.1, 'jump()').error(TJR + 0.13, 0, 6, 'NameError');
D.cue(TJR - 0.04, 'glitch', { v: 0.2 });
{ const E0 = TJR + 0.13, x = XH;
  hero.lean(E0, -22).head(E0, -28).hip(E0, [x + 0.06 * HH, -ST + 0.03 * HH]).sfx(E0, 'whoosh_short', { v: 0.3 });
  hero.foot('B', E0 + 0.03, [x + 0.25 * HH, 0], 0.14, 12).hip(E0 + 0.08, [x + 0.15 * HH, -ST], 0.25).foot('F', E0 + 0.2, [x + 0.04 * HH, 0], 0.14, 10);
  hero.lean(E0 + 0.35, 2, 0.25).head(E0 + 0.35, 0, 0.25);
  D.punch(E0, 0.03, 0.3); }
const XA = XH + 0.15 * HH;
const TPEER = TJR + 0.75;                                                     // 凑近看：代码好好的
hero.lean(TPEER, 22, 0.15).head(TPEER, -24, 0.15).look(TPEER + 0.05, [CX + 80, code2.y], { dur: 0.1 });
t = hero.scratch(TPEER + 0.45, 0.55, { head: -16 });
hero.lean(t, 2, 0.15);
code2.clearErr(t);
typing(hero, t);
const TJ = t + 0.25;
code2.run(TJ - 0.08, 0.3, 'run');
const J1 = hero.jump(TJ, { to: XA, h: 0.4 * HH, dur: 0.45 });
typing(hero, TJ + 0.002); typing(hero, J1.t + 0.002);
D.shot(TR1 + 0.6, 0.6, { on: [hero, [CX - 20, CY - 60], [CX + 360, code2.y + 20]], kind: 'medium' });

// ════════════════ 0:16 小蛇尾巴一节节变成乱码 → 他吓得往后弹、跌坐 → 拉远：乱码团 + 一串脚印通到左边 ════════════════
const TC0 = J1.t + 1.05;                                                     // 最安宁的一刻之后才出事
const corrupt = [];                                                           // 小蛇第 k 节从 t 开始变乱码
corrupt.push({ k: 4, t: TC0 }, { k: 3, t: TC0 + 0.9 });
const eaten = [];                                                             // 被吸走：{ k, t }（从那一刻的位置飞进乱码团）
eaten.push({ k: 4, t: TC0 + 0.95 }, { k: 3, t: TC0 + 1.65 });
D.cue(TC0, 'garble', { v: 0.6 }); D.cue(TC0 + 0.12, 'roar_small', { v: 0.9 }); D.cue(TC0 + 0.9, 'garble', { v: 0.5 });
const TST = TC0 + 0.22;                                                       // 先演反应：往后一弹、跌坐（0.1 秒到位）
hero.lean(TST, -32, 0.06, 'out3').head(TST, -26).hip(TST, [XA + 0.12 * HH, -0.2 * HH], 0.12, 'out3');
hero.foot('F', TST + 0.02, [XA + 0.05 * HH, 0], 0.12, 10, 'out3', false).foot('B', TST + 0.04, [XA + 0.32 * HH, 0], 0.14, 8, 'out3', false);
hero.hip(TST + 0.14, [XA + 0.22 * HH, -0.12 * HH], 0.12, 'in').lean(TST + 0.14, -14, 0.2).sfx(TST + 0.26, 'body', { v: 0.7 });
hero.foot('F', TST + 0.16, [XA - 0.15 * HH, 0], 0.15, 8, 'out3', false).foot('B', TST + 0.18, [XA - 0.05 * HH, 0], 0.15, 8, 'out3', false);
const XSIT = XA + 0.22 * HH;
D.cue(TC0 + 0.4, 'scale_drone', { dur: 2.2, v: 0.5 });
D.shot(TC0 + 0.35, 0.5, { on: [hero, [-2300, -60], [CXB, -260], [CX - 20, CY - 60]], kind: 'wide' }, 'out3');
// 乱码团：从脚印尽头冒出来，吃一节长一点
let massExtra = [];                                                           // [t, +n]
const TRICK0 = 3.0, TRICK1 = 6.5;                                             // 一小串乱码顺着地面从左边爬到蛇尾下面（很淡）
const trickX = s => lerp(-3000, CXB, E.out(clamp((s - TRICK0) / (TRICK1 - TRICK0))));
const blob = new GB.Blob({ seed: 9, size: 40,
  center: s => [CXB + (s > TCC + 0.3 ? 40 * E.inOut(clamp((s - TCC - 0.3) / 1.2)) : 0), 0],
  mass: s => { if (s < TC0 - 0.1) return 0; let m = 26 * E.out(clamp((s - TC0 + 0.1) / 0.5)); for (const [a, n] of massExtra) if (s > a) m += n; return m; } });

// ════════════════ 0:20 扑过去抓住小蛇的头，往回拽，连人带蛇摔回来 ════════════════
const TTUG = TC0 + 2.3, XG = XS0 + 0.32 * HH;
hero.hip(TTUG, [XG + 0.1 * HH, -0.3 * HH], 0.16, 'out3').lean(TTUG, 52, 0.12).head(TTUG, 20);
hero.foot('B', TTUG + 0.05, [XG + 0.45 * HH, 0], 0.15, 10).foot('F', TTUG + 0.08, [XG + 0.1 * HH, 0], 0.15, 10);
hero.hand('F', TTUG, 'world', s => snakeHead(s));
const TPULL = TTUG + 0.45;
hero.hip(TPULL, [XSIT, -0.12 * HH], 0.3, 'out3').lean(TPULL, -24, 0.25).sfx(TPULL, 'rustle', { v: 0.9 }).sfx(TPULL + 0.3, 'body', { v: 0.8 });
hero.foot('F', TPULL + 0.05, [XSIT - 0.36 * HH, 0], 0.25, 10, 'out3', false).foot('B', TPULL + 0.08, [XSIT - 0.25 * HH, 0], 0.25, 8, 'out3', false);
kS.push([TTUG + 0.3, XS0, -32], [TPULL + 0.3, XSIT - 0.42 * HH, -0.25 * HH], [TPULL + 0.7, XSIT - 0.5 * HH, -40]);
hero.hand('F', TPULL + 0.75, 'obj', keyPoint);
D.shot(TTUG - 0.1, 0.4, { on: [hero, [CXB - 80, -0.5 * HH], [CX - 20, CY - 60], [CX + 340, code2.y + 20]], kind: 'full' });

// ════════════════ 0:24 Ctrl+C——没用，它慢慢歪向他 ════════════════
const TCC = TPULL + 1.4;
KEYS.push(TCC - 0.3, TCC); D.cue(TCC - 0.3, 'key', { v: 1 }); D.cue(TCC, 'key', { v: 1 });
const KC = [{ at: s => { const o = hero.stateAt(s).obj; return [o[0], o[1] - 0.4 * HH]; }, size: 58, keys: [{ label: 'Ctrl', t: TCC - 0.3 }, { label: 'C', t: TCC }], t1: TCC + 0.8 }];
hero.look(TCC + 0.4, [CXB, -0.5 * HH], { dur: 0.2 });
D.shot(TCC - 0.7, 0.4, { on: [hero, [XSIT, -1.0 * HH], [CX - 20, CY - 60], [CX + 340, code2.y + 20]], kind: 'medium' });
D.shot(TCC + 0.6, 0.6, { on: [hero, [CXB - 120, -0.6 * HH], [CX - 20, CY - 60], [CX + 340, code2.y + 20]], kind: 'full' });
const TUP = TCC + 1.3, XF = XSIT;                                             // 站起来（面朝乱码）
hero.hip(TUP, [XF, -ST], 0.25).lean(TUP, 4, 0.25).head(TUP, 0, 0.2);
hero.foot('F', TUP + 0.05, [XF - 0.1 * HH, 0], 0.2, 12).foot('B', TUP + 0.1, [XF + 0.12 * HH, 0], 0.2, 12);

// ════════════════ 0:27 第一回合：字带抽过来 → jump() 跳过去；横着一下 → 低头 ════════════════
const TL1 = TUP + 1.2;
code2.run(TL1 - 0.18, 0.3, 'run'); KEYS.push(TL1 - 0.2);
const J2 = hero.jump(TL1 - 0.05, { to: XF + 0.05 * HH, h: 0.62 * HH, dur: 0.55 });
typing(hero, TL1 - 0.048); typing(hero, J2.t + 0.002);
blob.lash(TL1 - 0.02, TL1 + 0.1, TL1 + 0.55, [XF, -18]);                    // 他离开 3 帧后抽在地上
D.cue(TL1 - 0.02, 'whoosh', { v: 0.6 }); D.cue(TL1 + 0.1, 'impact_light', { v: 0.6 });
const XF2 = XF + 0.05 * HH, TL2 = J2.t + 0.8;
blob.lash(TL2, TL2 + 0.12, TL2 + 0.55, [XF2 + 0.6 * HH, -0.85 * HH]);       // 横着一下：低头躲
D.cue(TL2, 'whoosh', { v: 0.6 });
hero.hip(TL2 + 0.02, [XF2 + 0.04 * HH, -ST + 0.16 * HH], 0.06, 'out3').lean(TL2 + 0.02, 46, 0.06, 'out3').head(TL2 + 0.02, 30);
hero.hip(TL2 + 0.45, [XF2, -ST], 0.2).lean(TL2 + 0.45, 4, 0.2).head(TL2 + 0.45, 0, 0.2);
D.shot(TL1 - 0.5, 0.4, { on: [hero, [CXB - 120, -0.7 * HH], [XF + 0.3 * HH, 0], [CX - 20, CY - 60], [CX + 340, code2.y + 20]], kind: 'full' });

// ════════════════ 0:32 3 改 10：小蛇变成十节的鞭子抽过去；第三下被咬住，坏的往头那边爬 → 改回 3，缩回来 ════════════════
const TW0 = TL2 + 1.1;
hero.look(TW0 - 0.1, [CX + 160, CY + LH], { dur: 0.15 });
const I5 = TAME.indexOf('3');
code.select(TW0, I5, I5 + 1).type(TW0 + 0.15, '10', 12);
const TR2 = code.tEnd + 0.15;
code.run(TR2);
for (let k = 3; k < 10; k++) { const ta = TR2 + 0.25 + (k - 3) * 0.05; flyers.push({ t0: TR2 + 0.05 + (k - 3) * 0.04, t1: ta, from: OUTP, to: s => seg(s, k), str: 'hi', arc: 90 }); }
D.cue(TR2 + 0.05, 'output', { v: 0.6 }); D.cue(TR2 + 0.15, 'output', { v: 0.5 }); D.cue(TR2 + 0.25, 'output', { v: 0.5 });
const TGROW = TR2 + 0.6;
// 蛇头抽三下：扑出去（快）→ 收回（慢）
const HOME = [XSIT - 0.5 * HH, -40];
const TW1 = TGROW + 0.45, TW2 = TW1 + 0.75, TW3 = TW2 + 1.05;
const hitP1 = [CXB + 40, -0.55 * HH], hitP2 = [CXB + 60, -0.25 * HH], biteP = [CXB - 0.9 * HH, -0.4 * HH];
kS.push([TW1 - 0.25, HOME[0] + 30, -0.3 * HH], [TW1, hitP1[0], hitP1[1]], [TW1 + 0.4, HOME[0], HOME[1] - 30],
  [TW2 - 0.2, HOME[0] + 40, -0.35 * HH], [TW2, hitP2[0], hitP2[1]], [TW2 + 0.4, HOME[0], HOME[1] - 20],
  [TW3 - 0.2, HOME[0] + 40, -0.45 * HH], [TW3 + 0.05, biteP[0], biteP[1]]);
blob.scatter(TW1, 0).scatter(TW2, 0.4);
fx.add(TW1, hitP1, 'hit'); fx.add(TW2, hitP2, 'hit');
D.cue(TW1, 'impact_medium'); D.cue(TW2, 'impact_medium'); D.cue(TW1 - 0.08, 'whoosh', { v: 0.5 }); D.cue(TW2 - 0.08, 'whoosh', { v: 0.5 });
const TBITE = TW3 + 0.1;                                                      // 蛇身中间被一条字带缠住，坏的往两边爬
blob.lash(TW3 - 0.05, TW3 + 0.05, TW3 + 1.1, [CXB + 0.15 * HH, -0.35 * HH]);
for (const [k, d] of [[5, 0], [4, 0.22], [6, 0.22], [3, 0.44], [7, 0.44], [8, 0.62]]) corrupt.push({ k, t: TBITE + d });
D.cue(TBITE, 'garble', { v: 0.8 }); D.cue(TBITE + 0.05, 'roar_small', { v: 0.9 });
hero.look(TBITE + 0.05, [CXB, -0.4 * HH], { dur: 0.1 });
const TCUT = TBITE + 0.9;                                                    // 10 改回 3：只留前三节
code.select(TCUT - 0.35, I5, I5 + 2).type(TCUT - 0.2, '3', 10);
code.run(TCUT);
for (let k = 3; k < 10; k++) eaten.push({ k, t: TCUT + 0.05 + (k - 3) * 0.03 });
kS.push([TCUT + 0.05, biteP[0] + 20, biteP[1]], [TCUT + 0.25, biteP[0] + 120, -1.0 * HH], [TCUT + 0.5, HOME[0], HOME[1]], [TCUT + 1.0, HOME[0] + 20, HOME[1]]);   // 掉头时往上拱成一道弧，不折叠
nSeg = s => s < TA3 ? 3 : s < TA4 ? 4 : s < TC0 + 0.95 ? 5 : s < TC0 + 1.65 ? 4 : s < TR2 + 0.25 ? 3 : s < TCUT + 0.05 ? Math.min(10, 3 + Math.floor((s - TR2 - 0.25) / 0.05) + 1) : 3;
D.cue(TCUT + 0.05, 'recoil_slide', { dur: 0.4 });
D.shot(TW0 - 0.2, 0.5, { on: [hero, [CXB - 150, -0.7 * HH], [CX - 20, CY - 60], [CX + 340, code2.y + 20]], kind: 'full' });

// ════════════════ 0:42 它悄悄改了 jump（观众看到，他没看到）→ 闪避失灵，被抽飞 ════════════════
const TGJ = TCUT + 1.4;
code2.set(TGJ, '锟ump()');
D.cue(TGJ, 'glitch', { v: 0.12 });
for (let k = 0; k < 4; k++) hero.lean(TGJ - 0.1 + k * 0.3, k % 2 ? 6 : 12, 0.2);                       // 喘气
hero.look(TGJ, [CXB, -0.4 * HH], { dur: 0.2 });
D.shot(TGJ - 0.3, 0.4, { on: [hero, [CX - 20, CY - 60], [CX + 360, code2.y + 20], [CXB, -0.3 * HH]], kind: 'full' });
const TL3 = TGJ + 1.6;
code2.run(TL3 - 0.2, 0.3, 'run').error(TL3 - 0.08, 0, 6, 'NameError'); KEYS.push(TL3 - 0.22);
hero.lean(TL3 - 0.18, 16, 0.08).hip(TL3 - 0.18, [XF2, -ST + 0.1 * HH], 0.08);                        // 蹲好准备跳——没跳
const THIT = TL3 + 0.1;
blob.lash(TL3 - 0.02, THIT, TL3 + 0.5, [XF2, -0.5 * HH]);
D.cue(TL3 - 0.02, 'whoosh', { v: 0.7 });
const L1 = hero.launch(THIT, { vx: 820, vy: -620, turns: 1, land: 'back' });
hero.obj(THIT, 'held', { fwd: 0.3, up: 0.1 });
fx.add(THIT, [XF2 - 0.05 * HH, -0.5 * HH], 'heavy', { glyph: '锟' });
D.cue(THIT, 'impact_heavy');
D.shot(THIT, 10 * F, { on: [hero, [CXB - 100, -0.6 * HH], [L1.x + 1.0 * HH, 0]], kind: 'wide' }, 'out3');
const U1 = hero.getUp(L1.t + 0.3, { from: 'back' });
typing(hero, U1.t - 0.2);
hero.turn(U1.t + 0.1, -1);
hero.obj(U1.t - 0.2, 'held', { fwd: 0.24, up: 0.05 });

// ════════════════ 0:48 它把 jump 吃掉，拼成一个乱码火柴人，学着他跳了一下 ════════════════
const TEAT = THIT + 0.6;
for (let i = 0; i < 6; i++) flyers.push({ t0: TEAT + i * 0.05, t1: TEAT + 0.45 + i * 0.05, from: code2.charAt(TEAT, i), to: s => blob.center(s).map((v, n) => n ? v - blob.R(s) : v), str: '锟ump()'[i], arc: 60, eat: true });
code2.set(TEAT + 0.02, '').fadeOut(TEAT + 0.4);
massExtra.push([TEAT + 0.5, 6]);
code.fadeOut(TEAT + 0.3);
D.cue(TEAT, 'garble', { v: 0.6 });
const TFORM = TEAT + 1.3, FH = 0.9 * HH;
const foe = new Actor2({ H: FH, x0: CXB + 40, dir: 1, clock, lean: 4, headTilt: 0 });
D.cue(TFORM, 'assemble', { v: 0.8 });
const TMOCK = TFORM + 1.0;
foe.jump(TMOCK, { to: CXB + 60, h: 0.35 * FH, dur: 0.45 });
D.cue(TMOCK, 'glitch_crawl', { v: 0.5 });
D.shot(TFORM - 0.3, 0.6, { on: [foe, hero, [CXB - 40, -1.1 * FH]], kind: 'full' });
D.shot(TMOCK + 0.6, 0.5, { on: [foe, hero], kind: 'full', fit: 0.6 });
kS.push([L1.t + 0.5, HOME[0] + 120, -40], [U1.t + 0.6, hero.hipNow(U1.t)[0] - 0.45 * HH, -32], [U1.t + 1.0, hero.hipNow(U1.t)[0] - 0.4 * HH, -30]);
const ADUR = TMOCK + 2.4;

// ———————————————— 小蛇 ————————————————
kS.sort((a, b) => a[0] - b[0]);
const SBOB = s => {
  let dy = 0;
  if (s > TLOOK && s < TLOOK + 0.6) dy -= 22 * Math.sin(Math.PI * (s - TLOOK) / 0.6);                    // 停下、抬头往后看
  if (s > TA4 && s < TA4 + 0.8) dy -= 10 * Math.abs(Math.sin((s - TA4) * 12));                           // 长了两节，高兴
  return [0, dy];
};
const snake = new Snake({ t0: 0, t1: ADUR, gap: GAP, max: 12, head: spline(kS, { mono: true }), size: 46, plain: true, bob: SBOB,
  wig: s => (s > TA4 && s < TA4 + 0.8 ? 18 : s > TC0 && s < TPULL ? 2 : 8) });
function snakeHead(s) { const g = snake.segs(s); return g.length ? [g[0].x, g[0].y] : [XS0, -30]; }
function seg(s, k) { const g = snake.segs(s); const q = g[Math.min(k, g.length - 1)]; return q ? [q.x, q.y, q.rot] : [XS0, -30, 0]; }
const eatenFly = eaten.map(e => ({ ...e, p: seg(e.t, e.k) }));

// ———————————————— 模拟 ————————————————
KEYS = keyTimes(code).concat(keyTimes(code2), KEYS).sort((a, b) => a - b);
D.finalize({ actors: [hero, foe], bodies: [], dur: ADUR, start: { x: -700, y: -200, z: 0.3 } });
const DUR = D.DUR;

// ———————————————— 画面 ————————————————
const glyphPair = (seed, s) => GB.gly(seed, s) + GB.gly(seed + 1, s);
function drawSnake(ctx, s) {
  const g = snake.segs(s), n = nSeg(s);
  for (let k = Math.min(n, g.length) - 1; k >= 0; k--) {
    if (eaten.some(e => e.k === k && s >= e.t)) continue;
    const q = g[k]; let r = q.rot; if (Math.cos(r) < 0) r += Math.PI;
    const c = corrupt.find(e => e.k === k && s >= e.t && s < e.t + 99 && !(s > TCUT && k < 3));
    if (c) GB.drawGlyph(ctx, glyphPair(500 + k, s), q.x, q.y, r, 40, 1, GB.glitchAt(500 + k, s, 0.15));
    else PR.word(ctx, 'hi', q.x, q.y, r, 46);
  }
}
function drawFlyers(ctx, s) {
  for (const f of flyers) {
    if (s < f.t0 || s >= f.t1) continue;
    const u = clamp((s - f.t0) / (f.t1 - f.t0)), e = E.inOut(u), b = f.to(s);
    const x = lerp(f.from[0], b[0], e), y = lerp(f.from[1], b[1], e) - f.arc * Math.sin(Math.PI * u);
    const gl = f.eat || (f.garble || []).some(([a, z]) => s >= a && s < z);
    if (gl) GB.drawGlyph(ctx, f.eat ? GB.gly(800 + flyers.indexOf(f), s) : 'h锟', x, y, 0, f.eat ? 46 : 44, 1, 1);
    else PR.word(ctx, f.str, x, y, 0, 46);
  }
  for (const e of eatenFly) {                                                                        // 被吸走的蛇节：变成乱码飞进乱码团
    const u = clamp((s - e.t) / 0.4); if (u <= 0 || u >= 1) continue;
    const c = blob.center(s), x = lerp(e.p[0], c[0], E.in(u)), y = lerp(e.p[1], c[1] - blob.R(s), E.in(u)) - 50 * Math.sin(Math.PI * u);
    GB.drawGlyph(ctx, glyphPair(600 + e.k, s), x, y, e.p[2] * (1 - u), 40 * (1 - 0.5 * u), 1, 1);
  }
}
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  for (const [a, b] of GLINT) if (ta >= a && ta < b) GB.drawGlyph(ctx, '�', -2700, -40, 0, 70, 1, 1);
  // 脚印：爬过来的那一小串走过的地方留下很淡的乱码（拉远的时候才看得清）
  if (ta >= TRICK0) {
    const hx = trickX(ta);
    for (let x = -3000; x < hx; x += 90) GB.drawGlyph(ctx, GB.gly(Math.floor(x), ta, 2, 0.2), x, -16, 0, 30, (ta < TC0 ? 0.1 : 0.28) + 0.1 * GB.glitchAt(Math.floor(x), ta, 0.1), 0);
    if (ta < TC0) for (let i = 0; i < 4; i++) GB.drawGlyph(ctx, GB.gly(900 + i, ta), hx - i * 26, -14 - 6 * Math.abs(Math.sin(ta * 20 + i)), 0, 22, 0.35, 0);
  }
  code.draw(ctx, ta); code2.draw(ctx, ta);
  // 乱码团 → 乱码火柴人（字从团里飞到骨头上）
  const fa = clamp((ta - TFORM) / 0.5);
  if (fa < 1) blob.draw(ctx, ta, { alpha: 1 - fa });
  if (ta >= TFORM) GB.drawGlyphFigure(ctx, foe.jointsAt(ta), 36, 4, ta, fa);
  drawSnake(ctx, ta);
  const s = hero.stateAt(ta);
  hero.draw(ctx, ta);
  PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, s.dir);
  drawFlyers(ctx, ta);
  for (const k of KC) PR.keyCombo(ctx, ta, { ...k, at: k.at(ta) });
  fx.draw(ctx, ta);
  D.imp.drawWorld(ctx, tr);
  ctx.restore();
  const fl = fx.flashAt(ta);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }

module.exports = { DUR, draw, post, cam, hero, clock, codes: [code, code2], beats: [], snake, kS,
  marks: { TS, TR1, TJR, TJ, TC0, TTUG, TCC, TL1, TL2, TW0, TW1, TBITE, TCUT, TGJ, THIT, TEAT, TFORM, TMOCK, ADUR } };
