// 《火柴人 VS 循环》v2（SCENE=loop2）——内容见 stickman/剧本/火柴人VS循环_v2.md，节拍、镜头、声音都按剧本来
//   第一幕 空的世界：光标和 print（hi 砸在头上）
//   第二幕 重复、for、i、楼梯：for → Tab（键帽）→ 3 / 10 / 100（hi 雨砸在身上）→ print(i) → "#" * i 搭出楼梯
//   第三幕 hi 长蛇：while True 造出无穷长的蛇 → for 砌墙 → 被缠住 → Ctrl+C（键帽，不切镜头）→ while n < 3 驯服成三节小蛇
// 写法和 v1 一样：动作、音效写在动画时间上，镜头只写意图；会砸到人的东西先预演主角动作再算碰撞，按接触时刻加反应。
'use strict';
const K = require('./core');
const { W, H, C, clamp, lerp, E, rgba, mulberry32 } = K;
const { Actor2 } = require('./acting');
const { Director } = require('./director');
const { Code } = require('./code');
const { Body, Pile, flushSfx, G } = require('./phys');
const { Snake, spline, pieces } = require('./snake');
const PR = require('./props');

const HH = 300, LW = 0.5 * HH;
const D = new Director(), clock = D.clock, cam = D.cam;
let pile = new Pile();
const WORD = { r: 16, hw: 28, bounce: 0.3, friction: 0.6, sfx: 'tick', defer: true };
const CWB = 68, CHB = 76, BF = 96;                         // "#" 方块：宽、高、字号（台阶和墙都用它）

// ———————————————— 布局 ————————————————
const CX = -760, CY = -300, CS = 58;
const code = new Code({ x: CX, y: CY, size: CS, seed: 4 });
const CUR = [CX + CS * 0.25, CY + CS * 0.12];
const LX = -930, LD = -1;
const GRIP_UNDER = [-0.18 * LW, 0.07 * LW], GRIP_BACK = [-0.5 * LW, 0.03 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];
const KP = [LX + LD * KEYPT[0], -0.045 * LW - 6];
let KEYS = [];
const keyTimes = c => { const out = []; for (let i = 1; i < c.snaps.length; i++) if (c.snaps[i].text !== c.snaps[i - 1].text && Math.abs(c.snaps[i].text.length - c.snaps[i - 1].text.length) <= 4) out.push(c.snaps[i].t); return out; };
function tapAt(t) {
  let d = 0, k = -1;
  for (let i = 0; i < KEYS.length; i++) { const a = t - KEYS[i]; if (a >= -0.03 && a <= 0.12) { k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07); } }
  return { d, k };
}
const keyPoint = t => { const tp = tapAt(t); return [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; };
const typing = (a, t) => a.hand('B', t, 'obj', GRIP_UNDER).hand('F', t + 0.05, 'obj', keyPoint);
const offscreen = [];
const boxOf = (c, cs = CS) => ta => { const sn = c.snap(ta), L = (sn.text || ' ').split('\n'), [x0, y0] = c.pos(ta); return [[x0 - 10, y0 - cs], [x0 + Math.max(...L.map(l => l.length)) * cs * 0.55 + 10, y0 + (L.length - 1) * cs * 1.32 + cs * 0.3]]; };
const codeBox = boxOf(code);
const KC = [];                                              // 键帽（组合键）

const hero = new Actor2({ H: HH, x0: -560, dir: -1, clock, lean: 2, headTilt: 0 });
const ST = hero.STAND;
let t;

// ════════════════ 第一幕 空的世界：光标和 print ════════════════
const OPEN = 4.0;                                           // 开场 4 秒：大远景里只有一个小光标
code.blinkSound(0, OPEN + 2.6);
const lap = new Body({ t0: OPEN + 0.2, x: LX, y: -1200, vrot: 0.3, r: 0.05 * LW, bounce: 0.25, friction: 0.5, sfx: 'laptop_drop', defer: true });
hero.obj(0, 'rest', s => lap.at(s));
const T_FALL = OPEN + 0.55;
const L0 = hero.launch(T_FALL, { from: [-560, -1250], vx: 0, vy: 0, lean0: 80, land: 'front' });
D.hit(L0.t, [-560, -10], 'ground', { sfx: ['thud'], freeze: 0.06, shake: [20, 0.4], punch: 0.03, ring: 380, warp: 6 });
D.cue(L0.t - 0.4, 'whoosh', { v: 0.5 });
D.shot(0, 0.01, { on: [CUR], kind: 'wide', z: 0.2 });
offscreen.push([0, L0.t + 1.6]);                                    // 大远景：空的世界正中一个光标
hero.head(L0.t + 0.1, 8).head(L0.t + 0.5, 0);
t = hero.notice(L0.t + 0.8, CUR, { hold: 0.6 });
D.shot(L0.t + 0.2, 1.6, { on: [hero, CUR], kind: 'full' });                              // 慢慢推到全景
const U0 = hero.getUp(t, { from: 'front' });
hero.look(U0.t - 0.15, CUR, { dur: 0.3 });
t = hero.think(U0.t + 0.15, 1.1, { head: -18 });
const XP = CUR[0] + 0.24 * HH;
const Wk = hero.walk(t + 0.05, XP, { stepDur: 0.32 });
hero.look(Wk.t - 0.25, CUR, { dur: 0.25 });
D.shot(Wk.t + 0.3, 0.45, { on: CUR, kind: 'extreme', z: 2.4, dx: 70, dy: -10 });
const P1 = hero.poke(Wk.t + 0.2, CUR, { reach: 0.7 });
const TP1 = Wk.t + 0.9;
code.jiggle(TP1, 12);
hero.lean(TP1 + 0.05, -8).head(TP1 + 0.05, -30).lean(TP1 + 0.4, 2, 0.3);
hero.look(P1, [XP + 40, -0.62 * HH], { dur: 0.22 });
hero.hand('F', P1, 'local', [0.18, -0.02]);
const P2 = hero.poke(P1 + 0.4, CUR, { reach: 0.28 });
code.jiggle(P1 + 0.68, 9);
hero.hand('F', P2 - 0.1, 'free', [0.05, 0.35]);
hero.look(P2, CUR, { dur: 0.2 });
D.shot(P2, 0.5, { on: [hero, CUR], kind: 'medium' });
t = hero.scratch(P2 + 0.2, 0.9);
hero.look(t + 0.05, [XP + 600, -150], { dur: 0.22 });
hero.look(t + 0.55, [XP - 400, -150], { dur: 0.22 });
const TN = t + 1.0;
D.shot(t, 0.5, { on: [hero, [LX, 0]], kind: 'full' });
t = hero.notice(TN, [LX + 40, -20], { hold: 0.55 });
const FRONT = LX - LD * (0.5 * LW + 14);
const Wk2 = hero.walk(t, FRONT + 0.2 * HH, { stepDur: 0.3 });
const K1 = hero.kneel(Wk2.t - 0.1, { front: FRONT, head: 34, lean: 22 });
D.shot(K1.t - 0.2, 0.6, { on: [hero, CUR, KP], kind: 'medium' });
hero.look(K1.t + 0.05, KP, { dur: 0.3 });
const TK1 = K1.t + 0.8;
hero.poke(TK1 - 0.55, KP, { reach: 0.55, sfx: 'key', retract: false });
code.type(TK1, 'h', 400);
hero.hand('F', TK1 + 0.15, 'local', [0.14, 0.05]);
t = hero.doubleTake(TK1 + 0.25, [CUR[0] + 10, CUR[1]], KP);
const TK2 = t + 0.05;
hero.poke(TK2 - 0.28, KP, { reach: 0.28, sfx: 'key', retract: false });
code.type(TK2, 'e', 400);
hero.look(TK2 + 0.12, [CUR[0] + 40, CUR[1]], { dur: 0.08 });
t = hero.nod(TK2 + 0.3, 2);
hero.look(t, KP, { dur: 0.2 });
typing(hero, t);
code.type(t + 0.2, 'llo', 9);
const TH = code.tEnd + 0.12;
hero.look(TH + 0.08, [CUR[0] + 90, CUR[1]], { dur: 0.25 });
hero.head(TH + 0.1, -40, 0.3);
const TR1 = TH + 0.75, TE = TR1 + 0.15;
code.run(TR1, 0.3, 'touch2').error(TE, 0, 5, 'NameError');
hero.lean(TE, -22).head(TE, -34).hip(TE, [K1.x + 0.04 * HH, -0.22 * HH]);
hero.hand('F', TE, 'local', [0.16, -0.06]).hand('B', TE + 0.02, 'local', [0.12, -0.02]);
hero.sfx(TE, 'whoosh_short', { v: 0.3 });
D.punch(TE, 0.04, 0.4);
hero.lean(TE + 0.45, 14, 0.3).hip(TE + 0.45, [K1.x, -0.235 * HH], 0.3).head(TE + 0.45, -30);
D.shot(TE + 0.5, 0.5, { on: hero, kind: 'close', dy: 70 });
t = hero.scratch(TE + 0.6, 0.85, { head: -34, lean: 16 });
typing(hero, t); hero.look(t, KP, { dur: 0.3 });
code.back(t + 0.25, 5, 6);
hero.lean(t + 0.25, 28, 0.5).head(t + 0.25, 44, 0.5);
t = hero.think(code.tEnd + 0.25, 1.0, { head: -24 });
t = hero.idea(t + 0.05, { after: -30 });
D.shot(t - 0.2, 0.5, { on: [hero, CUR, KP], kind: 'medium' });
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
code.type(t + 0.12, 'print()', 9);
t = code.tEnd + 0.25;
hero.look(t, [CUR[0] + 100, CUR[1]], { dur: 0.2 });
code.run(t + 0.2, 0.3);
hero.look(t + 0.75, [CUR[0] - 200, -60], { dur: 0.22 }); hero.look(t + 1.1, [CUR[0] + 300, -60], { dur: 0.22 });
const TR3 = t + 1.55;
hero.lean(TR3 - 0.15, 30); hero.look(TR3 - 0.15, KP, { dur: 0.1 });
code.run(TR3, 0.3);
hero.lean(TR3 + 0.2, 16, 0.3); hero.look(TR3 + 0.3, [CUR[0] + 100, CUR[1]], { dur: 0.2 });
D.shot(TR3 + 0.5, 0.4, { on: hero, kind: 'close', dy: 70 });
t = hero.scratch(TR3 + 0.6, 0.8, { head: -36, lean: 14 });
t = hero.idea(t, { after: -30 });
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
D.shot(t, 0.5, { on: [hero, [CX - 20, CY - 70], [CX + 12 * CS * 0.55, CY + 30]], kind: 'medium' });
code.cursor(t + 0.15, 6).type(t + 0.3, '"hi"', 7);
t = code.tEnd + 0.3;
hero.look(t, [CUR[0] + 140, CUR[1]], { dur: 0.2 });
const TR4 = t + 0.4, TO = TR4 + 0.08;
code.run(TR4); D.cue(TO, 'output');
// hi 飞出来正砸在他头上：先预演到这一刻，按头的位置算出抛出去的速度；弹开的方向和落点由碰撞算
hero.simulate(TO + 1.2, { sfx: false });
const HX0 = CX + 6.5 * CS * 0.5, HY0 = CY + 30, TAU = 0.42, hd0 = hero.jointsAt(TO + TAU).head;
const HI1 = { t0: TO, x: HX0, y: HY0, vx: (hd0[0] + 8 - HX0) / TAU, vy: (hd0[1] - 0.07 * HH - HY0 - 0.5 * G * TAU * TAU) / TAU, vrot: -3, r: 13, hw: 22, bounce: 0.42, friction: 0.7, sfx: 'tick', defer: true, collide: hero, collideUntil: TO + 0.9 };
let hi1 = new Body(HI1);
const TB = hi1.contacts.length ? hi1.contacts[0].t : TO + TAU;
hi1 = new Body({ ...HI1, collideUntil: TB + 0.06 });                                     // 弹开之后不再和人碰（之后的动作是按这一下编的）
hero.bonk(TB, { amt: 1.3 });
D.hit(TB, [hd0[0], hd0[1] - 0.1 * HH], 'light', { freeze: 0.06, flash: 0, rays: 6, ring: 140, sparks: 8, warp: 0, lines: 0, invert: 0, sfx: [], shake: [10, 0.25], punch: 0.05 });
const HXr = hi1.at(TB + 2.6)[0];
D.shot(TB + 0.1, 0.35, { on: [hero, [HXr, -10], CUR], kind: 'full' }, 'out3');
const TS = TB + 0.16;                                                                    // 被砸得往后一坐（转身朝着 hi）
hero.turn(TS, 1).hip(TS, [K1.x - 0.02 * HH, -0.13 * HH], 0.12, 'out3').lean(TS, -24).head(TS, -10);
hero.foot('F', TS + 0.02, [K1.x + 0.28 * HH, 0], 0.18, 10, 'out3', false).foot('B', TS + 0.04, [K1.x + 0.2 * HH, 0], 0.2, 8, 'out3', false);
hero.hand('F', TS, 'local', [0.14, -0.06]).hand('B', TS + 0.02, 'world', [K1.x - 0.14 * HH, 0]);
hero.sfx(TS + 0.15, 'body', { v: 0.7 });
const TRH = TS + 0.35;                                                                   // 揉脑袋
hero.hand('F', TRH, 'local', s => [0.05 + 0.035 * Math.sin((s - TRH) * 24), -0.27]).head(TRH, 16, 0.2).sfx(TRH + 0.05, 'rustle', { v: 0.35 });
hero.hand('F', TRH + 0.8, 'local', [0.14, -0.06]).head(TRH + 0.8, -10, 0.2);
hero.look(TRH + 0.85, [HXr, -12], { dur: 0.35 });                                       // 瞪着那个 hi
const TO2 = TRH + 1.15;                                                                  // 之后接 v1 的节拍（戳一戳、捡起来）
hero.lean(TO2 - 0.4, -10, 0.5);
const K3 = hero.kneel(TO2 + 0.2, { front: HXr - 0.17 * HH, lean: 48, head: 26, dur: 0.75 });
hero.hand('F', TO2 + 0.5, 'free', [0.12, 0.2]).hand('B', TO2 + 0.5, 'free', [0.02, 0.3]);
D.shot(TO2 + 0.5, 0.7, { on: [hero, [HXr, -10]], kind: 'medium', dy: 40 });
hero.look(TO2 + 1.0, [HXr, -12], { dur: 0.2 });
const PK1 = hero.poke(TO2 + 1.2, [HXr - 4, -14], { reach: 0.6 }) - 0.3;
const PK2 = hero.poke(TO2 + 2.3, [HXr + 10, -14], { reach: 0.3 }) - 0.3;
hi1.hits = [{ t: PK1, vx: 60, vy: -260, vrot: 4 }, { t: PK2, vx: 40, vy: -200, vrot: -3 }]; hi1.sim();
const HXr2 = hi1.at(TO2 + 3.1)[0];
const TPICK = TO2 + 3.2, TPLACE = TO2 + 5.1;
hero.hand('F', TPICK - 0.25, 'world', [HXr2, -12]);
hero.hand('F', TPICK, 'local', [0.2, -0.04]).head(TPICK, 4).lean(TPICK, 20, 0.3);
hero.sfx(TPICK, 'touch2');
hero.hand('F', TPICK + 0.6, 'local', [0.22, -0.1]).head(TPICK + 0.6, -6, 0.3);
t = hero.nod(TPICK + 1.2, 2);
const XPL = HXr2 + 0.3 * HH;
hero.hand('F', TPLACE - 0.4, 'world', [XPL, -14]).lean(TPLACE - 0.4, 40, 0.3);
hero.hand('F', TPLACE + 0.1, 'free', [0.05, 0.35]);
const T2 = TPLACE + 0.5;

// 输出的东西先只记"什么时候从哪里飞出来"，主角动作模拟完再按时间顺序生成物理（字会一层层堆起来、会砸到人）
const SPAWN = [];
const spawn = (t0, x, y, vx, vy, str = 'hi', o = {}) => SPAWN.push({ t0, x, y, vx, vy, str, vrot: o.vrot ?? (vx / 300), ...o });
const BLAST = [];
const rnd = mulberry32(77);
const R2 = () => rnd() * 2 - 1;

// ════════════════ 第二幕 重复、for、i、楼梯 ════════════════
const CY2 = -470;
hero.rise(T2, { head: 10 });
hero.turn(T2 + 0.35, -1);
const Wb = hero.walk(T2 + 0.4, FRONT + 0.2 * HH, { stepDur: 0.3 });
const KA = hero.kneel(Wb.t - 0.1, { front: FRONT, head: 30, lean: 22 });
code.moveTo(T2 + 0.4, T2 + 1.3, CX, CY2);
const OUT = () => [CX + 90 + R2() * 20, CY2 + 30];
t = KA.t + 0.1;
D.shot(T2 + 0.3, 0.8, { on: [hero, [CX, CY2 - 40], [CX + 300, CY2]], kind: 'medium' });
typing(hero, t); hero.look(t, KP, { dur: 0.3 });
code.cursor(t + 0.1, code.last().text.length);                                          // 先把光标挪到行尾（上一次停在括号里）
code.type(t + 0.2, '\nprint("hi")', 10);
t = code.tEnd + 0.25;
hero.look(t, [CX + 150, CY2 + 40], { dur: 0.2 });
code.run(t + 0.2); D.cue(t + 0.28, 'output'); D.cue(t + 0.4, 'output');
spawn(t + 0.28, ...OUT(), -330, -320); spawn(t + 0.4, ...OUT(), -430, -300);
hero.look(t + 0.5, [-1080, -20], { dur: 0.25 });
hero.hip(t + 0.9, [KA.x, -0.25 * HH]).hip(t + 1.05, [KA.x, -0.22 * HH]).hip(t + 1.2, [KA.x, -0.25 * HH]).hip(t + 1.35, [KA.x, -0.235 * HH], 0.2);
hero.head(t + 0.9, -10, 0.2);
t += 1.6;
typing(hero, t); hero.look(t, KP, { dur: 0.25 });
D.shot(t, 0.6, { on: [hero, codeBox], kind: 'medium' });
code.type(t + 0.15, '\nprint(', 6);
t = code.tEnd + 0.15;
hero.hand('F', t, 'local', s => [0.16 + 0.04 * Math.sin((s - t) * 30), 0.02]).sfx(t + 0.05, 'rustle', { v: 0.5 });
hero.lean(t, 10, 0.3).head(t, 10, 0.3);
hero.hand('F', t + 0.55, 'obj', keyPoint);
code.type(t + 0.65, '"hi")', 3.2);
t = code.tEnd + 0.2;
hero.hand('F', t, 'local', s => [lerp(0.12, -0.04, clamp((s - t) / 0.4)), -0.24]).head(t, 20, 0.2);
hero.hand('F', t + 0.45, 'free', [0.05, 0.35]);
hero.lean(t + 0.5, 34, 0.5).head(t + 0.5, 46, 0.5).hip(t + 0.5, [KA.x, -0.21 * HH], 0.5);
hero.hip(t + 1.4, [KA.x, -0.235 * HH], 0.4);
D.shot(t + 0.3, 0.6, { on: [hero, [CX, CY2 - 40], [CX + 330, CY2 + 160]], kind: 'medium' });
t = hero.think(t + 1.3, 1.0, { head: -26 });
t = hero.idea(t, { after: -26 });
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
{ const len = code.last().text.length; code.select(t + 0.15, 0, len); }
const FOR1 = 'for i in range(3):\nprint("hi")';
code.type(t + 0.4, FOR1, 11);
t = code.tEnd + 0.3;
hero.look(t, [CX + 200, CY2], { dur: 0.2 });
const TIE = t + 0.4 + 0.15;
code.run(t + 0.4, 0.3, 'touch2').error(TIE, FOR1.indexOf('\n') + 1, FOR1.length, 'IndentationError');
hero.lean(TIE, -20).head(TIE, -34).hip(TIE, [KA.x + 0.04 * HH, -0.22 * HH]).sfx(TIE, 'whoosh_short', { v: 0.3 });
hero.hand('F', TIE, 'local', [0.16, -0.06]).hand('B', TIE + 0.02, 'local', [0.12, -0.02]);
D.punch(TIE, 0.04, 0.4);
hero.lean(TIE + 0.45, 14, 0.3).hip(TIE + 0.45, [KA.x, -0.235 * HH], 0.3);
t = hero.scratch(TIE + 0.55, 0.8, { head: -34, lean: 14 });
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
const L2 = FOR1.indexOf('\n') + 1;
code.cursor(t + 0.25, L2); D.cue(t + 0.25, 'select');
const TTAB = t + 0.75;
code.set(TTAB, FOR1.slice(0, L2) + '    ' + FOR1.slice(L2), L2 + 4); D.cue(TTAB, 'tab');
KEYS.push(TTAB);
KC.push({ at: [LX + 40, -0.7 * HH], size: 60, keys: [{ label: 'Tab', t: TTAB }], t1: TTAB + 0.7 });   // 键帽：不切镜头
D.shot(t + 0.1, 0.4, { on: [hero, codeBox, [LX, -0.8 * HH]], kind: 'medium' });
hero.look(TTAB + 0.2, [CX + 200, CY2 + 60], { dur: 0.3, tilt: -10 });
t = hero.nod(TTAB + 0.6, 1);
const TR5 = t + 0.25;
code.run(TR5);
for (let k = 0; k < 3; k++) { D.cue(TR5 + 0.1 + k * 0.12, 'output'); spawn(TR5 + 0.1 + k * 0.12, ...OUT(), -600 - k * 120, -380, 'hi', { vrot: 0.5 }); }
D.shot(TR5, 0.4, { on: [hero, [-1350, -20], codeBox], kind: 'full' });
hero.look(TR5 + 0.3, [-1250, -20], { dur: 0.3 });
const TCEL = TR5 + 0.9;
hero.hand('F', TCEL, 'local', [0.12, -0.3]).hand('B', TCEL + 0.03, 'local', [0.02, -0.3]).lean(TCEL, -10).head(TCEL, -24);
hero.sfx(TCEL, 'rustle', { v: 0.6 });
hero.hand('F', TCEL + 0.7, 'local', [0.1, 0.1]).hand('B', TCEL + 0.7, 'local', [0.06, 0.14]).lean(TCEL + 0.7, 24, 0.4);
hero.look(TCEL + 0.8, [CX + 15 * CS * 0.5, CY2], { dur: 0.3, tilt: -12 });
D.shot(TCEL + 0.6, 0.5, { on: [hero, [CX, CY2 - 40], [CX + 600, CY2]], kind: 'medium' });
t = TCEL + 1.5;
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
const I3 = FOR1.indexOf('3');
code.select(t + 0.2, I3, I3 + 1).type(t + 0.4, '10', 8);
t = code.tEnd + 0.25;
const TR6 = t + 0.2;
code.run(TR6);
for (let k = 0; k < 10; k++) { const tk = TR6 + 0.1 + k * 0.08; D.cue(tk, 'output', { v: 0.7 }); spawn(tk, ...OUT(), -350 - rnd() * 700, -250 - rnd() * 500); }
D.shot(TR6, 0.4, { on: [hero, [-1500, -20], codeBox], kind: 'full' });
hero.look(TR6 + 0.3, [-1250, -20], { dur: 0.3 });
hero.hip(TR6 + 1.2, [KA.x, -0.26 * HH]).hip(TR6 + 1.35, [KA.x, -0.22 * HH]).hip(TR6 + 1.5, [KA.x, -0.235 * HH], 0.2);
const TRUB = TR6 + 1.7;
hero.hand('F', TRUB, 'local', s => [0.12 + 0.03 * Math.sin((s - TRUB) * 26), 0.05]).hand('B', TRUB, 'local', s => [0.1 - 0.03 * Math.sin((s - TRUB) * 26), 0.07]);
hero.look(TRUB, [CX + 15 * CS * 0.5, CY2], { dur: 0.2, tilt: -8 });
D.shot(TRUB - 0.1, 0.4, { on: hero, kind: 'close', dy: 30 });
t = TRUB + 0.9;
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
code.select(t + 0.15, I3, I3 + 2).type(t + 0.3, '100', 8);
t = code.tEnd + 0.2;
hero.lean(t + 0.1, 32);
const TR7 = t + 0.3;
code.run(TR7, 3.4); D.cue(TR7, 'key_enter', { v: 1 });
// 100 个 hi：先从代码喷出来，后面从他头顶下下来——第一个正砸在头上，之后一个个砸在身上，把他埋了
const TRAIN = TR7 + 0.1, RAIN = 3.3;
const XB = KA.x + 0.25 * HH;
D.cue(TRAIN, 'word_rain', { dur: RAIN + 0.6, v: 0.9 });
D.cue(TRAIN + 0.3, 'music', { t1: TRAIN + RAIN + 0.4, bpm: 150 });
hero.rise(TRAIN + 0.2, { head: -20 });
hero.walk(TRAIN + 0.45, XB, { stepDur: 0.26 });
hero.hand('F', TRAIN + 0.6, 'local', [0.16, -0.26]).hand('B', TRAIN + 0.65, 'local', [0.06, -0.28]).head(TRAIN + 0.6, -30).lean(TRAIN + 0.6, -10);
D.shot(TRAIN + 0.2, 0.8, { on: [hero, codeBox, [XB, -1400]], kind: 'wide', z: 0.42 });  // 大远景：满天的 hi
hero.simulate(TRAIN + 2.2, { sfx: false });
const THIT = TRAIN + 1.25, hd2 = hero.jointsAt(THIT).head, FT = Math.sqrt(2 * (hd2[1] - 0.06 * HH + 1300) / G);
const FIRST = { t0: THIT - FT, x: hd2[0] + 6, y: -1300, vx: 0, vy: 0, vrot: 0.4, cu: THIT + 0.3 };
const TB2 = (() => { const b = new Body({ ...WORD, t0: FIRST.t0, x: FIRST.x, y: FIRST.y, collide: hero, collideUntil: FIRST.cu }); return b.contacts.length ? b.contacts[0].t : THIT; })();
spawn(FIRST.t0, FIRST.x, FIRST.y, 0, 0, 'hi', { vrot: 0.4, cu: FIRST.cu });
hero.bonk(TB2, { amt: 1.1 });
const TCOV = TB2 + 0.4;                                                                  // 疼！抬头一看：抱头蹲下
for (let k = 0; k < 100; k++) {
  const tk = TRAIN + RAIN * Math.pow(k / 100, 0.8);
  if (k < 22) spawn(tk, ...OUT(), -200 - rnd() * 900, -250 - rnd() * 650);
  else spawn(tk, XB + R2() * 150 * (1 - (k - 22) / 140), -1300 - rnd() * 200, R2() * 40, 0, 'hi', { vrot: R2() * 3, cu: TCOV + 1.0 });
}
hero.look(TB2 + 0.2, [XB, -900], { dur: 0.15 });
hero.hand('F', TCOV, 'local', [0.06, -0.22]).hand('B', TCOV + 0.02, 'local', [0.0, -0.22]).hip(TCOV, [XB, -0.3 * HH], 0.25).lean(TCOV, 18).head(TCOV, 20);
hero.foot('F', TCOV, [XB + 0.12 * HH, 0], 0.15, 6).foot('B', TCOV + 0.03, [XB - 0.1 * HH, 0], 0.15, 6);
const TEND = TRAIN + RAIN + 0.5;
D.shot(TCOV + 0.4, 1.0, { on: [hero, [XB - 400, -40], [XB + 300, -40], codeBox], kind: 'full' });
hero.look(TEND + 0.6, [XB - 500, -100], { dur: 0.2 }); hero.look(TEND + 1.2, [XB + 500, -100], { dur: 0.2 });
hero.look(TEND + 1.7, [XB, -200], { dur: 0.2 });
const TOUT = TEND + 2.1;
hero.hip(TOUT, [XB, -ST - 0.06 * HH]).lean(TOUT, -4).head(TOUT, -10).hip(TOUT + 0.25, [XB, -ST], 0.25);
hero.foot('F', TOUT, [XB + 0.08 * HH, 0], 0.2, 20).foot('B', TOUT + 0.03, [XB - 0.07 * HH, 0], 0.2, 20);
hero.hand('F', TOUT, 'local', [0.2, -0.2]).hand('B', TOUT, 'local', [-0.15, -0.15]).sfx(TOUT, 'whoosh_short', { v: 0.6 }).sfx(TOUT + 0.05, 'rustle', { v: 0.9 });
BLAST.push({ t: TOUT + 0.03, x: XB, y: -0.4 * HH, r: 0.75 * HH, power: 900 });
for (let k = 0; k < 5; k++) hero.lean(TOUT + 0.35 + k * 0.09, k % 2 ? -9 : 9);
hero.lean(TOUT + 0.8, 2, 0.2);
hero.hand('F', TOUT + 0.4, 'local', s => [0.05 + 0.08 * Math.sin((s - TOUT) * 20), 0.15]).hand('B', TOUT + 0.4, 'local', s => [0.02 - 0.08 * Math.sin((s - TOUT) * 20), 0.2]);
hero.hand('F', TOUT + 1.0, 'free', [0.05, 0.35]).hand('B', TOUT + 1.0, 'free', [-0.04, 0.35]);
D.shot(TOUT - 0.1, 0.5, { on: [hero, codeBox], kind: 'full' });
hero.look(TOUT + 1.1, [-1300, -150], { dur: 0.3 });
hero.look(TOUT + 1.8, [CX + 200, CY2], { dur: 0.3 });
t = hero.scratch(TOUT + 2.3, 0.8);
for (let k = 0; k < 3; k++) hero.hip(t + 0.1 + k * 0.16, [XB, -ST + (k % 2 ? 0 : 0.03) * HH]);
hero.head(t + 0.1, -24).head(t + 0.7, 0, 0.3).hip(t + 0.6, [XB, -ST], 0.2);
const T3 = t + 1.0;
// —— print(i)：0–9 ——
hero.turn(T3, -1);
const Wc = hero.walk(T3 + 0.05, FRONT + 0.2 * HH, { stepDur: 0.28 });
const KB = hero.kneel(Wc.t - 0.1, { front: FRONT, head: 34, lean: 30 });
const TG3 = KB.t + 0.2;
BLAST.push({ t: KB.t - 0.3, x: (LX + KB.x) / 2, y: -0.2 * HH, r: 0.75 * HH, power: 650 });
hero.sfx(KB.t - 0.3, 'rustle', { v: 0.8 });
hero.hand('F', KB.t - 0.05, 'world', [LX + LD * (GRIP_UNDER[0] + 30), -0.045 * LW + 4]).hand('B', KB.t, 'world', [LX + LD * GRIP_BACK[0], -0.045 * LW + 3]);
hero.hand('F', TG3, 'obj', [GRIP_UNDER[0] + 30, GRIP_UNDER[1] - 4]).hand('B', TG3, 'obj', GRIP_BACK).obj(TG3, 'held', { fwd: 0.3, up: -0.05 }).sfx(TG3, 'touch2');
hero.rise(TG3 + 0.3, { head: 20 });
hero.obj(TG3 + 0.3, 'held', { fwd: 0.24, up: 0.05 }).hand('B', TG3 + 0.35, 'obj', GRIP_UNDER).hand('F', TG3 + 0.7, 'obj', keyPoint);
D.shot(T3 + 0.1, 0.7, { on: [hero, [CX, CY2 - 40], [CX + 600, CY2 + 100]], kind: 'medium' });
t = TG3 + 0.9;
hero.look(t, [CX + 200, CY2], { dur: 0.25 });
const FOR2 = 'for i in range(100):\n    print("hi")';
const I100 = FOR2.indexOf('100');
code.select(t + 0.2, I100, I100 + 3).type(t + 0.35, '10', 8);
let txt = FOR2.slice(0, I100) + '10' + FOR2.slice(I100 + 3);
const IHI = txt.indexOf('"hi"');
code.select(code.tEnd + 0.3, IHI, IHI + 4).type(code.tEnd + 0.5, 'i', 6);
txt = txt.replace('"hi"', 'i');
t = code.tEnd + 0.3;
hero.look(t, [CX + 200, CY2 + 60], { dur: 0.2, tilt: -8 });
const TR8 = t + 0.35;
code.run(TR8);
const NX0 = XB + 1.9 * HH;
for (let k = 0; k < 10; k++) { const tk = TR8 + 0.12 + k * 0.2; D.cue(tk, 'output', { v: 0.8 }); spawn(tk, CX + 120, CY2 + 30, (NX0 + k * 70 - (CX + 120)) / 0.62, -330, String(k), { vrot: 0, num: true, bounce: 0.15, nopile: true }); }
hero.turn(TR8 + 0.3, 1); hero.look(TR8 + 0.35, [NX0 + 300, -20], { dur: 0.3 });
const Wn0 = hero.walk(TR8 + 0.6, NX0 - 0.45 * HH, { stepDur: 0.3 });
D.shot(TR8 + 0.2, 0.6, { on: [hero, [NX0 + 700, -20], codeBox], kind: 'full' });
const TW = Math.max(TR8 + 2.4, Wn0.t + 0.1);
const XW = NX0 + 9 * 70 - 0.25 * HH;
code.moveTo(TW, TW + 2.2, XW - 520, CY2);
hero.hand('F', TW, 'free', s => [0.3, 0.05 + 0.04 * Math.sin((s - TW) * 9)]);
const Wn = hero.walk(TW, XW, { stepDur: 0.34, stride: 0.2 * HH });
for (let k = 0; k < 10; k++) hero.look(TW + k * (Wn.t - TW) / 10, [NX0 + k * 70, -20], { dur: 0.1 });
D.track(TW + 0.2, Wn.t, { on: [hero], kind: 'full', lead: 0.12 });
t = hero.nod(Wn.t + 0.1, 2);
typing(hero, t);
// —— "#" * i：一级级台阶 ——
D.shot(t, 0.6, { on: [hero, [XW - 520, CY2 - 40], [XW + 100, CY2 + 100]], kind: 'medium' });
hero.look(t + 0.1, [XW - 300, -0.3 * HH], { dur: 0.3 });                                // 回头看看那排数字
t = hero.think(t + 0.5, 1.1, { head: -16 });
t = hero.idea(t, { release: false });
typing(hero, t + 0.3); hero.look(t + 0.3, [XW - 300, CY2], { dur: 0.2 });
const II = txt.lastIndexOf('(i)') + 1;
code.select(t + 0.5, II, II + 1).type(t + 0.7, '"#" * i', 9);
t = code.tEnd + 0.3;
const TRS = t + 0.3;
code.run(TRS);
const XS0 = XW + 1.05 * HH, COUTS = [XW - 520 + 160, CY2 + 90];
const colX = k => XS0 + (k - 1) * CWB, colTop = k => -k * CHB;
const COLS = [];
for (let k = 1; k <= 9; k++) {
  const t0 = TRS + 0.15 + 0.2 * k, tl = t0 + 0.55;
  COLS.push({ k, t0, tl, x0: COUTS[0], y0: COUTS[1], x1: colX(k), y1: -k * CHB / 2 });
  D.cue(t0, 'output', { v: 0.6 }); D.cue(tl, 'block_drop', { v: 0.35 + 0.07 * k });
}
const TSL = COLS[8].tl;
hero.look(TRS + 0.35, [XS0 + 300, -200], { dur: 0.25 });
hero.lean(COLS[0].tl, -14).lean(COLS[0].tl + 0.3, 2, 0.3);                               // 第一根落地：吓得一仰
for (let k = 2; k < 9; k += 2) hero.look(COLS[k].tl, [colX(k + 1), colTop(k + 1)], { dur: 0.15 });   // 一根比一根高，头跟着抬
hero.hip(TSL + 0.25, [XW, -ST - 0.04 * HH]).hip(TSL + 0.4, [XW, -ST], 0.15).hip(TSL + 0.55, [XW, -ST - 0.04 * HH]).hip(TSL + 0.7, [XW, -ST], 0.15);   // 高兴得蹦两下
D.shot(TRS + 0.3, 0.9, { on: [hero, [XS0 + 8 * CWB + 80, colTop(9) - 1.15 * HH], [XW - 520, CY2 - 40]], kind: 'full' });
// 抱着电脑一级一级跳上去
const Wst = hero.walk(TSL + 0.9, XS0 - 0.42 * HH, { stepDur: 0.28 });
typing(hero, TSL + 0.9);
let tj = Wst.t + 0.1, Jt = null;
for (let k = 1; k <= 9; k++) {
  Jt = hero.jump(tj, { to: colX(k), gy: colTop(k), h: 46, dur: 0.34, keep: k < 9 });
  typing(hero, tj + 0.002); typing(hero, Jt.t + 0.002);
  tj = Jt.t + 0.16;
}
const TTOP = Jt.t + 0.3, X9 = colX(9), G9 = colTop(9);
hero.hand('F', TTOP, 'local', [0.12, -0.32]).lean(TTOP, -8).head(TTOP, -26).sfx(TTOP, 'rustle', { v: 0.7 });   // 到顶了！举手欢呼
hero.hip(TTOP + 0.05, [X9, G9 - ST - 0.05 * HH]).hip(TTOP + 0.22, [X9, G9 - ST], 0.15).hip(TTOP + 0.4, [X9, G9 - ST - 0.05 * HH]).hip(TTOP + 0.57, [X9, G9 - ST], 0.15);
hero.lean(TTOP + 0.8, 2, 0.3).head(TTOP + 0.8, 0, 0.3); typing(hero, TTOP + 0.8);
hero.look(TTOP + 1.0, [X9 + 900, G9 - 100], { dur: 0.3, turn: false }); hero.look(TTOP + 1.6, [X9 - 900, G9 - 100], { dur: 0.3, turn: false });
D.shot(TTOP + 0.4, 1.4, { on: [hero, [XS0 - 700, 0], [XS0 + 1500, 0]], kind: 'wide', z: 0.4 });   // 拉远：站在高处，四周空荡荡

// ════════════════ 第三幕 hi 长蛇 ════════════════
const T3B = TTOP + 2.4;
const XC1 = X9 - 860, YC1 = G9 - 420;                                                    // 代码飘到他左上方
code.moveTo(T3B - 0.9, T3B - 0.1, XC1, YC1);
hero.look(T3B - 0.6, [XC1 + 300, YC1], { dur: 0.3 });
D.shot(T3B - 0.5, 0.8, { on: [hero, [XC1 - 20, YC1 - 70], [XC1 + 16 * CS * 0.55, YC1 + 110]], kind: 'medium' });
{ const len = txt.replace('(i)', '("#" * i)').length; code.select(T3B, 0, len); }
code.type(T3B + 0.2, 'while True:\n    print("hi")', 12);
t = code.tEnd + 0.3;
hero.head(t, -26, 0.2).lean(t, -4, 0.3);                                                 // 得意
const TR9 = t + 0.4;
code.run(TR9, 0.3);
const TS0 = TR9 + 0.15, SO = [XC1 + 160, YC1 + 140];
// —— 蛇从代码里游出来，绕一圈，停下来盯着他 ——
const HV = [X9 - 1.15 * HH, G9 - 0.84 * HH];
const TNOT = TS0 + 4.3, TL = TS0 + 5.6;
const kA = [[TS0, SO[0], SO[1]], [TS0 + 0.9, SO[0] + 280, SO[1] + 260], [TS0 + 1.8, SO[0] + 60, SO[1] + 560], [TS0 + 2.7, SO[0] - 260, SO[1] + 260],
  [TS0 + 3.5, SO[0] + 40, SO[1] - 160], [TNOT, HV[0] - 60, HV[1] - 30], [TNOT + 0.9, HV[0], HV[1]], [TL - 0.25, HV[0] - 50, HV[1] + 10],
  [TL, X9 - 0.02 * HH, G9 - 0.86 * HH], [TL + 0.25, X9 + 0.6 * HH, G9 - 0.62 * HH], [TL + 0.7, X9 + 0.3 * HH, G9 - 1.25 * HH]];
hero.look(TS0 + 0.6, SO, { dur: 0.25, turn: false });
hero.look(TS0 + 1.6, [SO[0] + 60, SO[1] + 500], { dur: 0.3, tilt: -12, turn: false });   // 歪头：这是什么？
hero.look(TS0 + 3.0, [SO[0], SO[1] - 100], { dur: 0.3, turn: false });
hero.lean(TS0 + 1.6, 8, 0.4);
D.shot(TS0 + 0.4, 0.9, { on: [hero, [SO[0] - 320, SO[1] - 220], [SO[0] + 300, SO[1] + 600]], kind: 'full' });
hero.look(TNOT, HV, { dur: 0.3, turn: false });
const TWAVE = TNOT + 0.25;                                                               // 试探着挥挥手
hero.hand('F', TWAVE, 'local', s => [0.14 + 0.05 * Math.sin((s - TWAVE) * 16), -0.3]).head(TWAVE, -14, 0.2);
hero.hand('F', TL - 0.45, 'local', [0.12, -0.04]).lean(TL - 0.45, -12, 0.12).head(TL - 0.45, -20);   // 蛇头一顿：愣住
D.shot(TNOT - 0.2, 0.6, { on: hero, kind: 'close', dy: 30, lead: -0.12 });               // 近景：他的反应
D.shot(TNOT + 0.9, 0.4, { on: [hero, HV, [XC1 - 20, YC1 - 70], [XC1 + 16 * CS * 0.55, YC1 + 110]], kind: 'medium' });                             // 两个对视
const Lf = hero.launch(TL, { vx: 820, vy: -650, turns: 1, land: 'back' });               // 撞飞下楼梯
hero.obj(TL, 'held', { fwd: 0.3, up: 0.1 });
D.hit(TL, [X9 - 0.05 * HH, G9 - 0.86 * HH], 'heavy', { sfx: ['impact_heavy', 'snake_bite'] });
D.shot(TL + 0.1, 0.5, { on: [hero, [XC1, YC1], [Lf.x + 300, 0]], kind: 'wide' }, 'out3'); // 拉远：蛇有多长
const Ug = hero.getUp(Lf.t + 0.35, { from: 'back' });
typing(hero, Ug.t - 0.2);
// —— 逃命：往右跑，蛇在身后追，两次咬在他脚后跟的地上 ——
const VR = 4.6 * HH, TRUN = Ug.t + 0.05;
hero.turn(TRUN, 1).obj(TRUN, 'held', { fwd: 0.0, up: 0.1 }).hand('B', TRUN + 0.01, 'obj', GRIP_UNDER);
const Ra = hero.run(TRUN, Lf.x + 2700, { speed: VR, stop: true, ramp: 0.3 });
hero.hand('B', TRUN + 0.02, 'obj', GRIP_UNDER);
const XST = Ra.x;
const xAt = ta => ta < TRUN ? Lf.x : ta < Ra.t ? Ra.X(ta) : XST;
D.track(TRUN + 0.1, Ra.t, { on: hero, kind: 'wide', z: 0.62, lead: -0.12 });
D.cue(TRUN, 'music', { t1: TRUN + 30, bpm: 170 });
const kB = [];
const TB1 = TRUN + 0.75, TBT2 = TRUN + 1.45;
for (let tk = TRUN + 0.15; tk < Ra.t - 0.15; tk += 0.24) {
  if (Math.abs(tk - TB1) < 0.2 || Math.abs(tk - TBT2) < 0.2) continue;
  kB.push([tk, xAt(tk) - 1.5 * HH - 40 * Math.sin(tk * 5), -0.62 * HH + 50 * Math.sin(tk * 7)]);
}
for (const tb of [TB1, TBT2]) {
  kB.push([tb - 0.12, xAt(tb) - 1.2 * HH, -1.0 * HH], [tb, xAt(tb) - 0.5 * HH, -26]);
  D.cue(tb, 'snake_bite', { v: 0.9 }); D.punch(tb, 0.025, 0.25);
  for (let k = 0; k < 5; k++) spawn(tb + 0.01, xAt(tb) - 0.5 * HH + R2() * 30, -30, R2() * 260, -500 - rnd() * 400, 'hi', { vrot: R2() * 9, nopile: true });
}
kB.sort((a, b) => a[0] - b[0]);
// —— 砌墙：for 砌出一堵 ##### 墙 ——
hero.turn(Ra.t + 0.15, -1); typing(hero, Ra.t + 0.2);
hero.obj(Ra.t + 0.2, 'held', { fwd: 0.24, up: 0.05 });
const code2 = new Code({ x: XST - 720, y: -2.2 * HH, size: CS, seed: 9 });
const codeBox2 = boxOf(code2);
const TT2 = Ra.t + 0.45;
hero.look(TT2 - 0.1, [XST - 400, -2.0 * HH], { dur: 0.2 });
code2.type(TT2, 'for i in range(6):\n    print("#####")', 22);
const TR10 = code2.tEnd + 0.2;
code2.run(TR10);
D.shot(Ra.t - 0.1, 0.5, { on: [hero, codeBox2], kind: 'medium' });
const WX = XST - 1.5 * HH, C2OUT = [XST - 720 + 200, -2.2 * HH + 130];
const ROWS = [];
for (let k = 0; k < 6; k++) { const t0 = TR10 + 0.12 + 0.16 * k, tl = t0 + 0.32; ROWS.push({ k, t0, tl, y1: -(k + 0.5) * CHB }); D.cue(t0, 'output', { v: 0.5 }); D.cue(tl, 'block_drop', { v: 0.7 }); }
D.shot(TR10, 0.4, { on: [hero, codeBox2, [WX - 400, -1.6 * HH]], kind: 'full' });
hero.look(TR10 + 0.2, [WX, -0.8 * HH], { dur: 0.2 });
const TWH = ROWS[5].tl + 0.45;
const kC = [[Ra.t + 0.35, WX - 2.2 * HH, -1.5 * HH], [Ra.t + 1.2, WX - 3.0 * HH, -2.1 * HH], [TR10 + 0.4, WX - 2.4 * HH, -1.8 * HH],
  [TWH - 0.55, WX - 3.0 * HH, -1.9 * HH], [TWH - 0.2, WX - 1.2 * HH, -1.0 * HH], [TWH, WX - 2.5 * CWB - 14, -5.6 * CHB]];
D.hit(TWH, [WX - 2.5 * CWB, -5.6 * CHB], 'heavy', { sfx: ['impact_heavy', 'snake_bite'] });
const BRICK_FLY = [];
for (let j = 0; j < 5; j++) BRICK_FLY.push({ row: 5, j, vx: 350 + rnd() * 450, vy: -500 - rnd() * 500, vr: R2() * 8 });
for (let j = 0; j < 2; j++) BRICK_FLY.push({ row: 4, j, vx: 150 + rnd() * 300, vy: -350 - rnd() * 300, vr: R2() * 8 });
// 撞墙之后：往后一弹、晃脑袋 → 身子还在不停从代码里出来，往天上拱，盘满天空 → 从右边扑下来缠住他
const kD = [[TWH + 0.25, WX - 1.0 * HH, -0.75 * HH], [TWH + 0.5, WX - 1.35 * HH, -0.95 * HH], [TWH + 0.7, WX - 1.15 * HH, -0.9 * HH],
  [TWH + 1.3, WX - 1.6 * HH, -2.5 * HH], [TWH + 2.1, WX - 0.5 * HH, -4.6 * HH], [TWH + 2.9, WX + 2.5 * HH, -6.0 * HH],
  [TWH + 3.7, WX + 5.0 * HH, -4.5 * HH], [TWH + 4.3, WX + 4.3 * HH, -2.2 * HH], [TWH + 4.75, XST + 1.2 * HH, -0.6 * HH]];
const TCH = TWH + 0.35;                                                                  // 挡住了！挥拳庆祝
hero.hand('F', TCH, 'local', [0.1, -0.32]).lean(TCH, -8).head(TCH, -24).sfx(TCH, 'rustle', { v: 0.7 });
hero.hip(TCH + 0.05, [XST, -ST - 0.06 * HH]).hip(TCH + 0.22, [XST, -ST], 0.15).hip(TCH + 0.4, [XST, -ST - 0.06 * HH]).hip(TCH + 0.57, [XST, -ST], 0.15);
hero.hand('F', TCH + 0.9, 'obj', keyPoint).lean(TCH + 0.9, 2, 0.3);
D.shot(TWH + 0.15, 0.5, { on: [hero, [WX - 1.4 * HH, -1.1 * HH]], kind: 'full' });
const TUP = TWH + 1.4;                                                                   // 抬头……咽口水
hero.look(TUP, [WX - 0.5 * HH, -3.0 * HH], { dur: 0.4, turn: false }).valueOf();
hero.look(TUP + 1.2, [WX + 2.5 * HH, -4.5 * HH], { dur: 0.5, turn: false });
hero.hip(TUP + 1.0, [XST, -ST + 0.03 * HH], 0.12).hip(TUP + 1.15, [XST, -ST], 0.2);
D.shot(TUP - 0.1, 1.3, { on: [hero, [XC1, YC1], [WX - 2 * HH, -6.4 * HH], [WX + 5.6 * HH, 0]], kind: 'wide', fit: 0.8 });   // 大远景：蛇占满天空，尾巴还连着楼梯顶上的代码
D.cue(TUP, 'scale_drone', { dur: 3.6, v: 0.8 });
// 缠绕：绕着他转 2.5 圈，从腰往上缠，转到身前的那半圈画在人前面
const TC0 = TWH + 4.95, TC1 = TC0 + 1.4, RCO = 0.2 * HH;
const coil = s => { const u = clamp((s - TC0) / (TC1 - TC0)), ph = u * Math.PI * 5; return [XST + RCO * Math.cos(ph), lerp(-0.15, -0.86, u) * HH, Math.sin(ph)]; };
const kE0 = coil(TC0);
kD.push([TC0, kE0[0], kE0[1], kE0[2]]);
const kE1 = coil(TC1);
const kF = [[TC1, kE1[0], kE1[1], kE1[2]], [TC1 + 0.35, XST - 0.42 * HH, -1.02 * HH, 1], [TC1 + 3, XST - 0.45 * HH, -1.04 * HH, 1]];
hero.obj(TC0 - 0.35, 'held', { fwd: 0.12, up: 0.72 }).hand('B', TC0 - 0.3, 'obj', GRIP_UNDER).hand('F', TC0 - 0.2, 'obj', [GRIP_UNDER[0], GRIP_UNDER[1]]);   // 电脑举过头顶
hero.look(TC0 - 0.3, [XST + 1.2 * HH, -0.6 * HH], { dur: 0.15, turn: false });
for (let k = 0; k < 6; k++) hero.lean(TC0 + 0.1 + k * 0.22, k % 2 ? -6 : 6, 0.12);       // 挣扎
hero.lean(TC1 + 0.2, 0, 0.2);
hero.look(TC1 + 0.1, [XST - 0.45 * HH, -1.04 * HH], { dur: 0.25, turn: false });
D.shot(TC0 - 0.3, 0.6, { on: [hero, [XST, -1.3 * HH]], kind: 'medium' });
D.cue(TC0, 'snake_slither', { dur: 1.4, v: 1 });
// Ctrl+C：电脑上方弹出键帽，不切镜头
const TCC = TC1 + 1.1;
hero.look(TC1 + 0.6, [XST + 0.1 * HH, -1.2 * HH], { dur: 0.25, turn: false });            // 抬头看电脑……
hero.hand('F', TCC - 0.45, 'obj', keyPoint);
KEYS.push(TCC - 0.3, TCC); D.cue(TCC - 0.3, 'key', { v: 1 }); D.cue(TCC, 'interrupt');
KC.push({ at: ta => { const o = hero.stateAt(ta).obj; return [o[0], o[1] - 0.36 * HH]; }, size: 62, keys: [{ label: 'Ctrl', t: TCC - 0.3 }, { label: 'C', t: TCC }], t1: TCC + 0.9 });
D.shot(TCC - 0.8, 0.5, { on: [hero, [XST, -1.9 * HH]], kind: 'medium' });
const TF = TCC + 0.02;
code.runs.push({ t: TR9 + 0.3, dur: TF - TR9 - 0.3 });                                   // 运行中：一直盖着灰
D.cue(TF + 0.05, 'error');
D.cue(TS0, 'snake_slither', { dur: TF - TS0, v: 0.6 });
// —— 蛇碎掉：定住 0.6 秒，然后碎成字母掉下来（会砸到他），再化成灰 ——
const TCR = TF + 0.6, TDIS = TCR + 1.7;
D.cue(TCR, 'dissolve', { v: 0.6 }); D.cue(TDIS, 'dissolve');
hero.obj(TCR + 0.1, 'held', { fwd: 0.3, up: 0.05 }).hand('B', TCR + 0.12, 'obj', GRIP_UNDER).hand('F', TCR + 0.3, 'obj', keyPoint);
hero.turn(TCR + 0.42, 1);                                                                // 掉下来坐着，转向右边的空地（墙在身后）
hero.hip(TCR + 0.5, [XST + 0.05 * HH, -0.12 * HH], 0.25, 'in').lean(TCR + 0.5, -14, 0.3).sfx(TCR + 0.75, 'body', { v: 0.6 });
hero.foot('F', TCR + 0.55, [XST + 0.48 * HH, 0], 0.25, 8, 'inOut', false).foot('B', TCR + 0.6, [XST + 0.4 * HH, 0], 0.25, 8, 'inOut', false);
D.shot(TCR, 0.6, { on: [hero, [XST - 700, -1100], [XST + 700, 0]], kind: 'full' });
const XS = XST + 0.05 * HH;                                                              // 坐着的位置
for (let k = 0; k < 5; k++) hero.lean(TDIS + 0.3 + k * 0.38, k % 2 ? -10 : -16, 0.18);   // 喘气
D.shot(TDIS + 0.2, 0.8, { on: hero, kind: 'medium' });
hero.look(TDIS + 0.5, [XST - 900, -200], { dur: 0.3, turn: false }); hero.look(TDIS + 1.2, [XST + 900, -200], { dur: 0.3, turn: false });
hero.look(TDIS + 1.9, [XST - 600, -500], { dur: 0.3, turn: false });                      // 看看远处的代码
// —— 托腮想：要是它自己会停就好了 ——
t = hero.think(TDIS + 2.4, 1.2, { head: -18, release: false });
D.shot(TDIS + 2.3, 0.6, { on: hero, kind: 'close', dy: 40 });
t = hero.idea(t, { release: false });
typing(hero, t + 0.3); hero.obj(t + 0.3, 'held', { fwd: 0.3, up: 0.05 });
const TAME = 'n = 0\nwhile n < 3:\n    print("hi")\n    n = n + 1';
const XC2 = XS + 0.12 * HH, YC2 = -1.75 * HH;
code2.set(t + 0.2, '').moveTo(t + 0.2, t + 0.21, XC2, YC2);
code2.fadeOut(TWH + 0.15, t + 0.2);
code.fadeOut(TDIS + 1);
hero.look(t + 0.4, [XC2 + 300, YC2 + 100], { dur: 0.25, turn: false });
D.shot(t + 0.3, 0.7, { on: [hero, [XC2 - 20, YC2 - 80], [XC2 + 640, YC2 + 280]], kind: 'medium' });
code2.type(t + 0.5, TAME, 12);
const TRN = code2.tEnd + 0.4;
code2.run(TRN);
const L1a = TAME.indexOf('while'), L1b = TAME.indexOf(':'), L0b = TAME.indexOf('\n');
const C2HOLD = [];
for (let k = 0; k <= 3; k++) {
  const tk = TRN + 0.35 + 0.75 * k;
  if (k < 3) { code2.tag(tk, tk + 0.5, L1a, L1b, 'True', [62, 150, 80], 'right'); D.cue(tk, 'cond_true'); D.cue(tk + 0.15, 'output', { v: 0.7 }); }
  else { code2.tag(tk, tk + 1.6, L1a, L1b, 'False', [190, 60, 60], 'right'); D.cue(tk, 'cond_false'); }
  code2.tag(tk + 0.5, k < 3 ? TRN + 0.35 + 0.75 * (k + 1) + 0.5 : tk + 2.2, 0, L0b, `n = ${Math.min(3, k + 1)}`, [70, 90, 130], 'right');
}
code2.tag(TRN + 0.2, TRN + 0.85, 0, L0b, 'n = 0', [70, 90, 130], 'right');
const T3D = TRN + 0.35 + 0.75 * 3;
hero.look(TRN + 0.3, [XC2 + 300, YC2 + 60], { dur: 0.2, turn: false });
for (let k = 0; k < 3; k++) hero.look(TRN + 0.5 + 0.75 * k, [XC2 + 200 + k * 30, YC2 + 280], { dur: 0.15, turn: false });
hero.head(T3D + 0.1, -24, 0.2).lean(T3D + 0.1, -18, 0.3);                               // 停了！
// 三节小蛇：从代码里出来，游到他面前；他往后一缩……它蹭蹭他，他摸摸它
const S2O = [XC2 + 160, YC2 + 3 * CS * 1.32 + 70];
const TNZ = T3D + 1.0, NZ = [XS + 0.52 * HH, -34];
const kS2 = [[TRN + 0.5, S2O[0], S2O[1]], [TRN + 2.0, S2O[0] + 30, S2O[1] + 124], [T3D + 0.4, S2O[0] + 160, -60], [TNZ - 0.3, NZ[0] + 90, -30], [TNZ, NZ[0], NZ[1]]];
hero.lean(TNZ - 0.15, -26, 0.12).hand('F', TNZ - 0.15, 'local', [0.14, -0.08]);           // 吓得往后一缩
hero.lean(TNZ + 0.6, -8, 0.4);
const TPAT = TNZ + 0.8;                                                                  // 摸摸它
const S2BOB = s => s > TNZ && s < TWALK + 0.4 ? [8 * Math.sin((s - TNZ) * 9), -14 * Math.abs(Math.sin((s - TNZ) * 6))] : [0, 0];
const s2head = ta => { const p = spline(kS2)(ta), b = S2BOB(ta); return [p[0] + b[0], p[1] + b[1]]; };
hero.hand('F', TPAT, 'world', s => { const p = s2head(s); return [p[0] + 6, p[1] - 22 - 10 * Math.max(0, Math.sin((s - TPAT) * 14))]; }).head(TPAT, 20, 0.3).sfx(TPAT + 0.2, 'touch2', { v: 0.5 });
hero.hand('F', TPAT + 1.1, 'obj', keyPoint).head(TPAT + 1.1, 0, 0.3);
// 站起来往右走，小蛇在前面一扭一扭地带路
const TWALK = TPAT + 1.5;
code2.fadeOut(TWALK + 0.6);
hero.hip(TWALK, [XS + 0.12 * HH, -ST], 0.5).lean(TWALK, 2, 0.4).head(TWALK, 0, 0.3);
hero.foot('F', TWALK + 0.1, [XS + 0.2 * HH, 0], 0.3, 10).foot('B', TWALK + 0.2, [XS + 0.05 * HH, 0], 0.3, 10);
hero.obj(TWALK, 'held', { fwd: 0.18, up: 0.06 });
hero.turn(TWALK + 0.6, 1);
const Wend = hero.walk(TWALK + 0.65, XS + 4.2 * HH, { stepDur: 0.36 });
hero.hand('F', TWALK + 0.7, 'free', s => [0.05 + 0.08 * Math.sin((s - TWALK) * 8), 0.35]);
kS2.push([TWALK + 0.7, NZ[0], NZ[1]]);                                                   // 等他站起来、迈步了再走
for (let tk = TWALK + 0.9; tk < Wend.t + 2; tk += 0.2) kS2.push([tk, hero.hipT.at(tk)[0] + 0.95 * HH, -30 - 10 * Math.abs(Math.sin(tk * 7))]);
kS2.sort((a, b) => a[0] - b[0]);
D.shot(TWALK + 0.3, 0.8, { on: hero, kind: 'full' });
D.shot(TWALK + 1.4, 3.6, { on: [hero], kind: 'wide', z: 0.17, dx: 4000 });                        // 慢慢拉到大远景：又是空荡荡的世界
const ADUR = TWALK + 5.6;

// ———————————————— 蛇（不依赖主角模拟） ————————————————
const snake = new Snake({ t0: TS0, t1: TF, freeze: TF, gap: 62, max: 420,
  head: pieces([[TS0, spline([...kA, ...kB, ...kC, ...kD].sort((a, b) => a[0] - b[0]))], [TC0, coil], [TC1, spline(kF)]]),
  wig: s => s > TC0 - 0.2 ? 3 : s > TWH && s < TWH + 0.8 ? 26 : 12,
  mouth: s => Math.max(clamp(1 - Math.abs(s - TL + 0.05) / 0.35), clamp(1 - Math.abs(s - TWH + 0.05) / 0.3), s > TC1 ? 0.6 + 0.3 * Math.sin(s * 5) : 0) });
const snake2 = new Snake({ t0: TRN + 0.5, t1: ADUR, gap: 58, max: 3, head: spline(kS2), size: 46, plain: true, bob: S2BOB,
  wig: s => s > TNZ && s < TWALK ? 16 : 8 });

// ———————————————— 模拟 ————————————————
KEYS = keyTimes(code).concat(keyTimes(code2), KEYS).sort((a, b) => a - b);
const handAt = ta => hero.jointsAt(ta).aF[2];
let words = [], bricks = [], crumbs = [];
// 会砸到人的东西：主角动作模拟完才能算。先预演一遍 → 记下砸到头的时刻 → 加反应 → 正式模拟 → 再算一遍
function buildWorld() {
  pile = new Pile();
  const rr = mulberry32(5), Q = () => rr() * 2 - 1;
  words = []; bricks = []; crumbs = [];
  const mk = o => { const b = new Body({ ...WORD, pile, ...o }); b.str = o.str || 'hi'; b.num = o.num; words.push(b); return b; };
  { const p = handAt(TPLACE); mk({ t0: TPLACE, x: p[0], y: p[1], vx: 0, vy: 0 }); }
  for (const sp of [...SPAWN].sort((a, b) => a.t0 - b.t0)) mk({ t0: sp.t0, x: sp.x, y: sp.y, vx: sp.vx, vy: sp.vy, vrot: sp.vrot, str: sp.str, num: sp.num, bounce: sp.bounce ?? 0.3, until: sp.t0 + 12,
    ...(sp.cu ? { collide: hero, collideUntil: sp.cu } : {}), ...(sp.nopile ? { pile: null } : {}) });
  for (const bl of BLAST) for (const b of words) {
    if (b.t0 >= bl.t) continue;
    const [x, y] = b.at(bl.t), dx = x - bl.x, dy = y - bl.y, d = Math.hypot(dx, dy);
    if (Math.abs(dx) < bl.r && y > -2 * HH) { const k = bl.power * (0.6 + 0.6 * (1 - d / bl.r)); b.hits.push({ t: bl.t + rr() * 0.05, vx: dx / (d + 1) * k + Q() * 200, vy: -Math.abs(k) * (0.7 + rr() * 0.5), vrot: Q() * 15 }); b.sim(); }
  }
  for (const c of BRICK_FLY) bricks.push(Object.assign(new Body({ t0: TWH, x: WX + (c.j - 2) * CWB, y: -(c.row + 0.5) * CHB, vx: c.vx, vy: c.vy, vrot: c.vr, r: 30, hw: 30, bounce: 0.3, friction: 0.5, sfx: 'block_drop', defer: true, collide: hero, collideUntil: TWH + 1.6, until: TWH + 5 }), c));
  for (const q of snake.segs(TF)) {
    const parts = q.k === 0 ? [['H', -28], ['I', 28]] : [[snake.word, 0]];
    for (const [s, off] of parts) crumbs.push(Object.assign(new Body({ t0: TCR, x: q.x + Math.cos(q.rot) * off, y: q.y + Math.sin(q.rot) * off, rot: q.rot, vx: Q() * 70, vy: -40 - rr() * 90, vrot: Q() * 4, r: 14, hw: 26, bounce: 0.3, friction: 0.6, sfx: 'tick', defer: true, collide: hero, collideUntil: TCR + 2.5, until: TCR + 4 }), { str: s, big: q.k === 0 }));
  }
}
hero.simulate(ADUR, { sfx: false });
buildWorld();
{ // 砸到头的反应（文字、砖、碎掉的蛇）：每次间隔至少 0.4 秒，第一下 hi 雨已经单独编过
  const cs = [...words, ...bricks, ...crumbs].flatMap(b => b.contacts).filter(c => c.part === 'head' && c.speed > 260 && Math.abs(c.t - TB2) > 0.3).sort((a, b) => a.t - b.t);
  let last = -9;
  for (const c of cs) { if (c.t - last < 0.4) continue; hero.bonk(c.t, { amt: clamp(c.speed / 1000, 0.35, 0.9), hip: false }); last = c.t; }
}
D.finalize({ actors: [hero], bodies: [lap, hi1], dur: ADUR, start: { x: CUR[0], y: CUR[1], z: 0.2 } });
const DUR = D.DUR;
buildWorld();
{ // 落地声：字雨期间由字雨声代替；其它时段间隔太近的只留最响的那个；砸到人的声音（bonk / tap）都保留
  const rainWin = [[TRAIN, TRAIN + RAIN + 0.6]];
  const all = [...words, ...bricks, ...crumbs];
  const ev = all.flatMap(b => b.events.map(e => ({ ...e, b }))).sort((x, y) => x.t - y.t);
  const keep = [], hits = ev.filter(e => e.type === 'bonk' || e.type === 'tap');
  for (const e of ev) {
    if (e.type === 'bonk' || e.type === 'tap') continue;
    if (e.type === 'tick' && rainWin.some(([a, z]) => e.t > a && e.t < z)) continue;
    const p = keep[keep.length - 1]; if (!p || e.t - p.t > 0.06) keep.push(e); else if (e.v > p.v) keep[keep.length - 1] = e;
  }
  const hk = []; for (const e of hits) { const p = hk[hk.length - 1]; if (!p || e.t - p.t > 0.08) hk.push(e); }
  for (const b of all) b.events = [];
  for (const e of [...keep, ...hk]) e.b.events.push({ t: e.t, type: e.type, v: e.v });
  flushSfx(all, clock);
}

// ———————————————— 画面 ————————————————
const blk = (ctx, x, y, rot = 0, a = 1) => PR.word(ctx, '#', x, y, rot, BF, a, [228, 228, 228]);
function drawStairs(ctx, ta) {
  for (const c of COLS) {
    if (ta < c.t0) continue;
    const u = clamp((ta - c.t0) / (c.tl - c.t0)), e = E.inOut(u);
    // 飞出来时是一行 "###"（横着），在空中转 90° 立起来
    const x = lerp(c.x0, c.x1, e), y = lerp(c.y0, c.y1, e) - 260 * Math.sin(Math.PI * u), rot = -Math.PI / 2 * E.inOut(clamp(u * 1.3)), sq = u >= 1 ? 1 - 0.06 * Math.exp(-(ta - c.tl) * 14) : 1;
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, sq);
    for (let j = 0; j < c.k; j++) blk(ctx, (j - (c.k - 1) / 2) * CHB, 0, Math.PI / 2 * E.inOut(clamp(u * 1.3)));
    ctx.restore();
  }
}
function drawWall(ctx, ta) {
  for (const r of ROWS) {
    if (ta < r.t0) continue;
    const u = clamp((ta - r.t0) / (r.tl - r.t0)), e = E.in(u);
    const y = lerp(C2OUT[1], r.y1, e), x = lerp(C2OUT[0], WX, E.out(u));
    for (let j = 0; j < 5; j++) {
      const br = bricks.find(b => b.row === r.k && b.j === j);
      if (br && ta >= TWH) { const [bx, by, brot] = br.at(ta); blk(ctx, bx, by, brot); continue; }
      blk(ctx, x + (j - 2) * CWB, y);
    }
  }
}
function drawWords(ctx, ta, list, dis0, dur = 0.9) {
  const dis = clamp((ta - dis0) / dur);
  for (let i = 0; i < list.length; i++) {
    const b = list[i];
    if (ta < b.t0 || dis >= 1) continue;
    const [x, y, r] = b.at(ta), sz = b.big ? 85 : b.num ? 58 : 50, col = b.num ? [235, 235, 235] : undefined;
    if (dis <= 0) { PR.word(ctx, b.str, x, y, r, sz, 1, col); continue; }
    const rr = mulberry32(i * 13 + 5), a = 1 - E.in(dis);
    for (let k = 0; k < b.str.length; k++) {
      const ox = (k - (b.str.length - 1) / 2) * 22, vx = (rr() - 0.5) * 160, vy = -60 - rr() * 160, sp = (rr() - 0.5) * 6;
      PR.word(ctx, b.str[k], x + ox + vx * dis, y + vy * dis - 40 * dis * dis, r + sp * dis, sz * (1 - 0.5 * dis), a, col);
    }
    if (i % 3 === 0) { ctx.fillStyle = `rgba(214,214,214,${0.5 * a})`; for (let k = 0; k < 4; k++) ctx.fillRect(x + (rr() - 0.5) * 70 * (1 + dis), y - rr() * 90 * dis, 3, 3); }
  }
}
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  code.draw(ctx, ta);
  code2.draw(ctx, ta);
  drawStairs(ctx, ta); drawWall(ctx, ta);
  if (ta < TCR) snake.draw(ctx, ta, 'back');
  const s = hero.stateAt(ta), held = ta >= TG3;
  if (ta >= lap.t0 && !held) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, LD);
  if (ta < TPICK) { if (ta >= hi1.t0) { const [x, y, r] = hi1.at(ta); PR.word(ctx, 'hi', x, y, r); } }
  if (ta >= T_FALL + 0.04) hero.draw(ctx, ta);
  if (held) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, s.dir);
  if (ta < TCR) snake.draw(ctx, ta, 'front');
  if (ta >= snake2.t0) snake2.draw(ctx, ta, 'back');
  if (ta >= TPICK && ta < TPLACE) { const p = handAt(ta); PR.word(ctx, 'hi', p[0] + 6, p[1] - 14, 0.1 * Math.sin(ta * 3)); }
  // 第一、二幕的字堆实心轮廓（画在人前面、字后面）
  { const x0 = c.x - W / 2 / c.z - 40, x1 = c.x + W / 2 / c.z + 40, step = pile.cell;
    if (x0 < XW) { ctx.save(); ctx.fillStyle = 'rgb(24,24,24)'; ctx.beginPath(); ctx.moveTo(x0, 2);
      let any = false; const xe = Math.min(x1, XW);
      for (let x = x0; x <= xe; x += step) { const h = pile.top(x, step * 1.5, ta); if (h > 0) any = true; ctx.lineTo(x, -Math.max(0, h - 12)); }
      ctx.lineTo(xe, 2); ctx.closePath(); if (any) ctx.fill(); ctx.restore(); } }
  drawWords(ctx, ta, words, 1e9);
  if (ta >= TCR) drawWords(ctx, ta, crumbs, TDIS);
  D.imp.drawWorld(ctx, tr);
  for (const k of KC) PR.keyCombo(ctx, ta, { ...k, at: typeof k.at === 'function' ? k.at(ta) : k.at });
  if (ta >= TF + 0.05) {                                                                 // KeyboardInterrupt：红字
    const a = clamp((ta - TF - 0.05) / 0.08) * (1 - clamp((ta - TDIS - 0.6) / 0.6));
    if (a > 0) { ctx.save(); ctx.font = `400 ${CS * 1.1}px Code`; ctx.textAlign = 'center'; ctx.fillStyle = rgba(C.errText || [244, 71, 71], a); ctx.fillText('KeyboardInterrupt', XST - 0.1 * HH, -1.9 * HH); ctx.restore(); }
  }
  ctx.restore();
}
function post(ctx, tr, base) {
  D.imp.post(ctx, tr, base);
  const f = clamp((tr - (DUR - 1.2)) / 1.0);                                             // 结尾淡出
  if (f > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

module.exports = { DUR, draw, post, cam, hero, clock, codes: [code, code2], offscreen, heroFrom: D.R(T_FALL + 0.05),
  marks: { L0, TB, TO2, T2, TTAB, TR7, TB2, TOUT, T3, TR8, TRS, TTOP, T3B, TR9, TNOT, TL, TRUN, TR10, TWH, TUP, TC0, TCC, TF, TCR, TDIS, TRN, TNZ, TWALK, ADUR } };
