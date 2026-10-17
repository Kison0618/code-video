// 《火柴人 VS 循环》（SCENE=loop）——内容见 stickman/剧本/火柴人VS循环.md，节拍、镜头、声音都按剧本来
//   第一幕 醒来：光标和 print
//   第二幕 重复和 for：手敲三行 → for → IndentationError → Tab → 3 / 10 / 100 → 被 hi 埋了
//   第三幕 i 和 while True：print(i) → while True → 逃命 → Ctrl+C → 消散 → bye
// 写法：所有动作、音效写在动画时间上（导演模块统一换算）；镜头只写意图（景别 + 看谁），动作模拟完再算机位。
'use strict';
const K = require('./core');
const { W, H, C, clamp, lerp, E, rgba, mulberry32 } = K;
const { Actor2 } = require('./acting');
const { Director } = require('./director');
const { Code } = require('./code');
const { Body, Pile, flushSfx } = require('./phys');
const PR = require('./props');
const V = require('./vfx');

const HH = 300, LW = 0.5 * HH;
const D = new Director(), clock = D.clock, cam = D.cam;
const pile = new Pile();
const WORD = { r: 16, hw: 28, bounce: 0.3, friction: 0.6, sfx: 'tick', defer: true, pile };

// ———————————————— 布局 ————————————————
const CX = -760, CY = -300, CS = 58;                      // 代码（第一幕悬在伸手够得着的高度）
const code = new Code({ x: CX, y: CY, size: CS, seed: 4 });
const CUR = [CX + CS * 0.25, CY + CS * 0.12];
const LX = -930, LD = -1;                                  // 电脑朝左放，键盘对着右边来的人
const GRIP_UNDER = [-0.18 * LW, 0.07 * LW], GRIP_BACK = [-0.5 * LW, 0.03 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];
const KP = [LX + LD * KEYPT[0], -0.045 * LW - 6];          // 键盘上的点（世界坐标）
let KEYS = [];
const keyTimes = () => { const out = []; for (let i = 1; i < code.snaps.length; i++) if (code.snaps[i].text !== code.snaps[i - 1].text && Math.abs(code.snaps[i].text.length - code.snaps[i - 1].text.length) <= 4) out.push(code.snaps[i].t); return out; };
function tapAt(t) {
  let d = 0, k = -1;
  for (let i = 0; i < KEYS.length; i++) { const a = t - KEYS[i]; if (a >= -0.03 && a <= 0.12) { k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07); } }
  return { d, k };
}
const keyPoint = t => { const tp = tapAt(t); return [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; };
const typing = (a, t) => a.hand('B', t, 'obj', GRIP_UNDER).hand('F', t + 0.05, 'obj', keyPoint);
const offscreen = [];
const codeBox = ta => { const sn = code.snap(ta), L = (sn.text || ' ').split('\n'), [x0, y0] = code.pos(ta); return [[x0 - 10, y0 - CS], [x0 + Math.max(...L.map(l => l.length)) * CS * 0.55 + 10, y0 + (L.length - 1) * CS * 1.32 + CS * 0.3]]; };

const hero = new Actor2({ H: HH, x0: -560, dir: -1, clock, lean: 2, headTilt: 0 });
const ST = hero.STAND;
let t;

// ════════════════ 第一幕 醒来：光标和 print ════════════════
code.blinkSound(0, 2.8);
const lap = new Body({ t0: 0.6, x: LX, y: -1200, vrot: 0.3, r: 0.05 * LW, bounce: 0.25, friction: 0.5, sfx: 'laptop_drop', defer: true });
hero.obj(0, 'rest', s => lap.at(s));
const T_FALL = 0.95;
const L0 = hero.launch(T_FALL, { from: [-560, -1250], vx: 0, vy: 0, lean0: 80, land: 'front' });
offscreen.push([D.R(T_FALL), D.R(L0.t) - 0.25]);
D.hit(L0.t, [-560, -10], 'ground', { sfx: ['thud'], freeze: 0.06, shake: [20, 0.4], punch: 0.03, ring: 380, warp: 6 });
D.cue(L0.t - 0.4, 'whoosh', { v: 0.5 });
D.shot(0, 0.01, { on: [CUR, [-560, -10]], kind: 'wide', z: 0.75 });                      // 远景：黑底上只有一个光标
hero.head(L0.t + 0.1, 8).head(L0.t + 0.5, 0);
t = hero.notice(L0.t + 0.8, CUR, { hold: 0.6 });                                         // 趴着抬头：那是什么
D.shot(L0.t + 0.5, 0.9, { on: [hero, CUR], kind: 'full' });
const U0 = hero.getUp(t, { from: 'front' });
hero.look(U0.t - 0.15, CUR, { dur: 0.3 });
t = hero.think(U0.t + 0.15, 1.1, { head: -18 });                                         // 托腮盯着看（好奇）
const XP = CUR[0] + 0.24 * HH;
const Wk = hero.walk(t + 0.05, XP, { stepDur: 0.32 });
hero.look(Wk.t - 0.25, CUR, { dur: 0.25 });
D.shot(Wk.t + 0.3, 0.45, { on: CUR, kind: 'extreme', z: 2.4, dx: 70, dy: -10 });         // 大特写：伸手戳光标
const P1 = hero.poke(Wk.t + 0.2, CUR, { reach: 0.7 });
const TP1 = Wk.t + 0.9;
code.jiggle(TP1, 12);
hero.lean(TP1 + 0.05, -8).head(TP1 + 0.05, -30).lean(TP1 + 0.4, 2, 0.3);               // 手缩回来，身子也往后一缩
hero.look(P1, [XP + 40, -0.62 * HH], { dur: 0.22 });                                     // 看看自己的手
hero.hand('F', P1, 'local', [0.18, -0.02]);
const P2 = hero.poke(P1 + 0.4, CUR, { reach: 0.28 });
code.jiggle(P1 + 0.68, 9);
hero.hand('F', P2 - 0.1, 'free', [0.05, 0.35]);
hero.look(P2, CUR, { dur: 0.2 });
D.shot(P2, 0.5, { on: [hero, CUR], kind: 'medium' });
t = hero.scratch(P2 + 0.2, 0.9);                                                         // 没反应……挠头
hero.look(t + 0.05, [XP + 600, -150], { dur: 0.22 });                                    // 往右看看
hero.look(t + 0.55, [XP - 400, -150], { dur: 0.22 });                                    // 往左看看
const TN = t + 1.0;
D.shot(t, 0.5, { on: [hero, [LX, 0]], kind: 'full' });
t = hero.notice(TN, [LX + 40, -20], { hold: 0.55 });                                     // 脚边：电脑！
const FRONT = LX - LD * (0.5 * LW + 14);
const Wk2 = hero.walk(t, FRONT + 0.2 * HH, { stepDur: 0.3 });
const K1 = hero.kneel(Wk2.t - 0.1, { front: FRONT, head: 34, lean: 22 });
D.shot(K1.t - 0.2, 0.6, { on: [hero, CUR, KP], kind: 'medium' });
hero.look(K1.t + 0.05, KP, { dur: 0.3 });
const TK1 = K1.t + 0.8;                                                                  // 试探着按一个键 → 冒出 h
hero.poke(TK1 - 0.55, KP, { reach: 0.55, sfx: 'key', retract: false });
code.type(TK1, 'h', 400);
hero.hand('F', TK1 + 0.15, 'local', [0.14, 0.05]);
t = hero.doubleTake(TK1 + 0.25, [CUR[0] + 10, CUR[1]], KP);                              // 抬头看字 → 低头看电脑 → 猛地再抬头
const TK2 = t + 0.05;
hero.poke(TK2 - 0.28, KP, { reach: 0.28, sfx: 'key', retract: false });
code.type(TK2, 'e', 400);
hero.look(TK2 + 0.12, [CUR[0] + 40, CUR[1]], { dur: 0.08 });
t = hero.nod(TK2 + 0.3, 2);                                                              // 明白了
hero.look(t, KP, { dur: 0.2 });
typing(hero, t);
code.type(t + 0.2, 'llo', 9);
const TH = code.tEnd + 0.12;
hero.look(TH + 0.08, [CUR[0] + 90, CUR[1]], { dur: 0.25 });
hero.head(TH + 0.1, -40, 0.3);                                                           // 看着 hello，有点得意
const TR1 = TH + 0.75, TE = TR1 + 0.15;
code.run(TR1, 0.3, 'touch2').error(TE, 0, 5, 'NameError');                               // 回车 → 报错
hero.lean(TE, -22).head(TE, -34).hip(TE, [K1.x + 0.04 * HH, -0.22 * HH]);
hero.hand('F', TE, 'local', [0.16, -0.06]).hand('B', TE + 0.02, 'local', [0.12, -0.02]);
hero.sfx(TE, 'whoosh_short', { v: 0.3 });
D.punch(TE, 0.04, 0.4);
hero.lean(TE + 0.45, 14, 0.3).hip(TE + 0.45, [K1.x, -0.235 * HH], 0.3).head(TE + 0.45, -30);
D.shot(TE + 0.5, 0.5, { on: hero, kind: 'close', dy: 70 });
t = hero.scratch(TE + 0.6, 0.85, { head: -34, lean: 16 });
typing(hero, t); hero.look(t, KP, { dur: 0.3 });
code.back(t + 0.25, 5, 6);                                                               // 慢慢删掉
hero.lean(t + 0.25, 28, 0.5).head(t + 0.25, 44, 0.5);
t = hero.think(code.tEnd + 0.25, 1.0, { head: -24 });
t = hero.idea(t + 0.05, { after: -30 });
D.shot(t - 0.2, 0.5, { on: [hero, CUR, KP], kind: 'medium' });
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
code.type(t + 0.12, 'print()', 9);                                                       // print() → 没反应
t = code.tEnd + 0.25;
hero.look(t, [CUR[0] + 100, CUR[1]], { dur: 0.2 });
code.run(t + 0.2, 0.3);
hero.look(t + 0.75, [CUR[0] - 200, -60], { dur: 0.22 }); hero.look(t + 1.1, [CUR[0] + 300, -60], { dur: 0.22 });
const TR3 = t + 1.55;
hero.lean(TR3 - 0.15, 30); hero.look(TR3 - 0.15, KP, { dur: 0.1 });
code.run(TR3, 0.3);                                                                      // 用力再按一次
hero.lean(TR3 + 0.2, 16, 0.3); hero.look(TR3 + 0.3, [CUR[0] + 100, CUR[1]], { dur: 0.2 });
D.shot(TR3 + 0.5, 0.4, { on: hero, kind: 'close', dy: 70 });
t = hero.scratch(TR3 + 0.6, 0.8, { head: -36, lean: 14 });
t = hero.idea(t, { after: -30 });
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
code.cursor(t + 0.15, 6).type(t + 0.3, '"hi"', 7);
t = code.tEnd + 0.3;
hero.look(t, [CUR[0] + 140, CUR[1]], { dur: 0.2 });
const TR4 = t + 0.4, TO = TR4 + 0.08;
code.run(TR4); D.cue(TO, 'output');
// hi 变成实物掉出来
const hi1 = new Body({ t0: TO, x: CX + 6.5 * CS * 0.5, y: CY + 30, vx: 250, vy: -380, vrot: 2, r: 13, hw: 22, bounce: 0.42, friction: 0.7, sfx: 'tick', defer: true,
  hits: [{ t: TO + 3.3, vx: 60, vy: -260, vrot: 4 }, { t: TO + 4.1, vx: 40, vy: -200, vrot: -3 }] });
const HXr = hi1.at(TO + 3.0)[0];
D.shot(TO + 0.05, 0.3, { on: [hero, [HXr, -10], CUR], kind: 'full' }, 'out3');
const TS = TO + 0.18;                                                                    // 吓得往后一坐（转身朝着 hi）
hero.turn(TS, 1).hip(TS, [K1.x - 0.02 * HH, -0.13 * HH], 0.12, 'out3').lean(TS, -24).head(TS, -10);
hero.foot('F', TS + 0.02, [K1.x + 0.28 * HH, 0], 0.18, 10, 'out3', false).foot('B', TS + 0.04, [K1.x + 0.2 * HH, 0], 0.2, 8, 'out3', false);
hero.hand('F', TS, 'local', [0.14, -0.06]).hand('B', TS + 0.02, 'world', [K1.x - 0.14 * HH, 0]);
hero.sfx(TS, 'whoosh_short', { v: 0.45 }).sfx(TS + 0.15, 'body', { v: 0.7 });
hero.look(TS + 0.3, [HXr, -12], { dur: 0.4 });
hero.lean(TS + 1.0, -10, 0.5);
const K3 = hero.kneel(TO + 1.7, { front: HXr - 0.17 * HH, lean: 48, head: 26, dur: 0.75 });   // 跪着慢慢挪过去
hero.hand('F', TO + 2.0, 'free', [0.12, 0.2]).hand('B', TO + 2.0, 'free', [0.02, 0.3]);
D.shot(TO + 2.0, 0.7, { on: [hero, [HXr, -10]], kind: 'medium', dy: 40 });
hero.look(TO + 2.5, [HXr, -12], { dur: 0.2 });
hero.poke(TO + 2.7, [HXr - 4, -14], { reach: 0.6 });                                     // 戳一戳（hi 晃一下）
hero.poke(TO + 3.8, [HXr + 10, -14], { reach: 0.3 });
// 捡起来端详，满意地点头，放到一边
const TPICK = TO + 4.7, TPLACE = TO + 6.6;
hero.hand('F', TPICK - 0.25, 'world', [HXr, -12]);
hero.hand('F', TPICK, 'local', [0.2, -0.04]).head(TPICK, 4).lean(TPICK, 20, 0.3);
hero.sfx(TPICK, 'touch2');
hero.hand('F', TPICK + 0.6, 'local', [0.22, -0.1]).head(TPICK + 0.6, -6, 0.3);           // 举到眼前看看
t = hero.nod(TPICK + 1.2, 2);
const XPL = HXr + 0.3 * HH;
hero.hand('F', TPLACE - 0.4, 'world', [XPL, -14]).lean(TPLACE - 0.4, 40, 0.3);
hero.hand('F', TPLACE + 0.1, 'free', [0.05, 0.35]);
const T2 = TPLACE + 0.5;

// 输出的东西（hi、数字）先只记"什么时候从哪里、以什么速度飞出来"，等主角动作模拟完，再按时间顺序生成物理（字会一层层堆起来）
const SPAWN = [];
const spawn = (t0, x, y, vx, vy, str = 'hi', o = {}) => SPAWN.push({ t0, x, y, vx, vy, str, vrot: o.vrot ?? (vx / 300), ...o });
const BLAST = [];                                          // 被炸开（主角从字堆里钻出来）
const rnd = mulberry32(77);
const R2 = () => rnd() * 2 - 1;

// ════════════════ 第二幕 重复和 for ════════════════
// 回到电脑前跪下；代码升高一点，给多行留地方
const CY2 = -470;
hero.rise(T2, { head: 10 });
hero.turn(T2 + 0.35, -1);
const Wb = hero.walk(T2 + 0.4, FRONT + 0.2 * HH, { stepDur: 0.3 });
const KA = hero.kneel(Wb.t - 0.1, { front: FRONT, head: 30, lean: 22 });
code.moveTo(T2 + 0.4, T2 + 1.3, CX, CY2);
const OUT = () => [CX + 90 + R2() * 20, CY2 + 30];          // 输出从代码下面冒出来，往左前方飞
t = KA.t + 0.1;
D.shot(T2 + 0.3, 0.8, { on: [hero, [CX, CY2 - 40], [CX + 300, CY2]], kind: 'medium' });
typing(hero, t); hero.look(t, KP, { dur: 0.3 });
code.type(t + 0.2, '\nprint("hi")', 10);                                                // 第二行
t = code.tEnd + 0.25;
hero.look(t, [CX + 150, CY2 + 40], { dur: 0.2 });
code.run(t + 0.2); D.cue(t + 0.28, 'output'); D.cue(t + 0.4, 'output');
spawn(t + 0.28, ...OUT(), -330, -320); spawn(t + 0.4, ...OUT(), -430, -300);
hero.look(t + 0.5, [-1080, -20], { dur: 0.25 });
hero.hip(t + 0.9, [KA.x, -0.25 * HH]).hip(t + 1.05, [KA.x, -0.22 * HH]).hip(t + 1.2, [KA.x, -0.25 * HH]).hip(t + 1.35, [KA.x, -0.235 * HH], 0.2);   // 小小地高兴了一下
hero.head(t + 0.9, -10, 0.2);
t += 1.6;
typing(hero, t); hero.look(t, KP, { dur: 0.25 });
D.shot(t, 0.6, { on: [hero, codeBox], kind: 'medium' });
code.type(t + 0.15, '\nprint(', 6);                                                     // 第三行……越敲越慢
t = code.tEnd + 0.15;
hero.hand('F', t, 'local', s => [0.16 + 0.04 * Math.sin((s - t) * 30), 0.02]).sfx(t + 0.05, 'rustle', { v: 0.5 });   // 甩甩手腕
hero.lean(t, 10, 0.3).head(t, 10, 0.3);
hero.hand('F', t + 0.55, 'obj', keyPoint);
code.type(t + 0.65, '"hi")', 3.2);
t = code.tEnd + 0.2;
hero.hand('F', t, 'local', s => [lerp(0.12, -0.04, clamp((s - t) / 0.4)), -0.24]).head(t, 20, 0.2);   // 擦汗
hero.hand('F', t + 0.45, 'free', [0.05, 0.35]);
hero.lean(t + 0.5, 34, 0.5).head(t + 0.5, 46, 0.5).hip(t + 0.5, [KA.x, -0.21 * HH], 0.5);   // 看着长长的代码，叹气
hero.hip(t + 1.4, [KA.x, -0.235 * HH], 0.4);
D.shot(t + 0.3, 0.6, { on: [hero, [CX, CY2 - 40], [CX + 330, CY2 + 160]], kind: 'medium' });
t = hero.think(t + 1.3, 1.0, { head: -26 });
t = hero.idea(t, { after: -26 });
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
{ const len = code.last().text.length; code.select(t + 0.15, 0, len); }
const FOR1 = 'for i in range(3):\nprint("hi")';
code.type(t + 0.4, FOR1, 11);                                                          // 换一种写法：for
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
code.set(TTAB, FOR1.slice(0, L2) + '    ' + FOR1.slice(L2), L2 + 4); D.cue(TTAB, 'tab');   // Tab：整行往右一挪
KEYS.push(TTAB);
D.shot(t + 0.1, 0.4, { on: [[CX - 40, CY2 - 60], [CX + 560, CY2 + 110]], kind: 'extreme', fit: 0.8 });   // 特写代码
hero.look(TTAB + 0.2, [CX + 200, CY2 + 60], { dur: 0.3, tilt: -10 });
t = hero.nod(TTAB + 0.6, 1);
D.shot(TTAB + 0.5, 0.4, { on: [hero, codeBox], kind: 'medium' });
const TR5 = t + 0.25;
code.run(TR5);                                                                           // 三个 hi 一起掉下来
for (let k = 0; k < 3; k++) { D.cue(TR5 + 0.1 + k * 0.12, 'output'); spawn(TR5 + 0.1 + k * 0.12, ...OUT(), -600 - k * 120, -380, 'hi', { vrot: 0.5 }); }
D.shot(TR5, 0.4, { on: [hero, [-1350, -20], codeBox], kind: 'full' });
hero.look(TR5 + 0.3, [-1250, -20], { dur: 0.3 });
const TCEL = TR5 + 0.9;                                                                 // 举起双拳庆祝
hero.hand('F', TCEL, 'local', [0.12, -0.3]).hand('B', TCEL + 0.03, 'local', [0.02, -0.3]).lean(TCEL, -10).head(TCEL, -24);
hero.sfx(TCEL, 'rustle', { v: 0.6 });
hero.hand('F', TCEL + 0.7, 'local', [0.1, 0.1]).hand('B', TCEL + 0.7, 'local', [0.06, 0.14]).lean(TCEL + 0.7, 24, 0.4);
hero.look(TCEL + 0.8, [CX + 15 * CS * 0.5, CY2], { dur: 0.3, tilt: -12 });             // 盯着 range(3) 里的 3
D.shot(TCEL + 0.6, 0.5, { on: [hero, [CX, CY2 - 40], [CX + 600, CY2]], kind: 'medium' });
t = TCEL + 1.5;
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
const I3 = FOR1.indexOf('3');
code.select(t + 0.2, I3, I3 + 1).type(t + 0.4, '10', 8);
t = code.tEnd + 0.25;
const TR6 = t + 0.2;
code.run(TR6);                                                                           // 十个 hi
for (let k = 0; k < 10; k++) { const tk = TR6 + 0.1 + k * 0.08; D.cue(tk, 'output', { v: 0.7 }); spawn(tk, ...OUT(), -350 - rnd() * 700, -250 - rnd() * 500); }
D.shot(TR6, 0.4, { on: [hero, [-1500, -20], codeBox], kind: 'full' });
hero.look(TR6 + 0.3, [-1250, -20], { dur: 0.3 });
hero.hip(TR6 + 1.2, [KA.x, -0.26 * HH]).hip(TR6 + 1.35, [KA.x, -0.22 * HH]).hip(TR6 + 1.5, [KA.x, -0.235 * HH], 0.2);
const TRUB = TR6 + 1.7;                                                                  // 搓手
hero.hand('F', TRUB, 'local', s => [0.12 + 0.03 * Math.sin((s - TRUB) * 26), 0.05]).hand('B', TRUB, 'local', s => [0.1 - 0.03 * Math.sin((s - TRUB) * 26), 0.07]);
hero.look(TRUB, [CX + 15 * CS * 0.5, CY2], { dur: 0.2, tilt: -8 });
D.shot(TRUB - 0.1, 0.4, { on: hero, kind: 'close', dy: 30 });
t = TRUB + 0.9;
typing(hero, t); hero.look(t, KP, { dur: 0.2 });
code.select(t + 0.15, I3, I3 + 2).type(t + 0.3, '100', 8);
t = code.tEnd + 0.2;
hero.lean(t + 0.1, 32);
const TR7 = t + 0.3;
code.run(TR7, 3.4); D.cue(TR7, 'key_enter', { v: 1 });                                 // 用力按下回车
// 100 个 hi：先从代码喷出来，后面从天上下下来，把他埋了
const TRAIN = TR7 + 0.1, RAIN = 3.3;
const XB = KA.x + 0.25 * HH;                                                             // 他站起来迎接的位置
for (let k = 0; k < 100; k++) {                                                         // 先从代码喷出来，后面主要从他头顶下下来
  const tk = TRAIN + RAIN * Math.pow(k / 100, 0.8);
  if (k < 22) spawn(tk, ...OUT(), -200 - rnd() * 900, -250 - rnd() * 650);
  else spawn(tk, XB + R2() * 150 * (1 - (k - 22) / 140), -1300 - rnd() * 200, R2() * 40, 0, 'hi', { vrot: R2() * 3 });
}
D.cue(TRAIN, 'word_rain', { dur: RAIN + 0.6, v: 0.9 });
D.cue(TRAIN + 0.3, 'music', { t1: TRAIN + RAIN + 0.4, bpm: 150 });
hero.rise(TRAIN + 0.2, { head: -20 });
hero.walk(TRAIN + 0.45, XB, { stepDur: 0.26 });
hero.hand('F', TRAIN + 0.6, 'local', [0.16, -0.26]).hand('B', TRAIN + 0.65, 'local', [0.06, -0.28]).head(TRAIN + 0.6, -30).lean(TRAIN + 0.6, -10);   // 张开手迎接
D.shot(TRAIN + 0.2, 0.8, { on: [hero, codeBox, [XB, -700]], kind: 'wide', z: 0.72 });   // 拉到远景：满天的 hi
const TCOV = TRAIN + 1.7;                                                                 // 发现不对：抱头蹲下
hero.notice(TCOV - 0.3, [XB, -900], { hold: 0.3 });
hero.hand('F', TCOV, 'local', [0.06, -0.22]).hand('B', TCOV + 0.02, 'local', [0.0, -0.22]).hip(TCOV, [XB, -0.3 * HH], 0.25).lean(TCOV, 18).head(TCOV, 20);
hero.foot('F', TCOV, [XB + 0.12 * HH, 0], 0.15, 6).foot('B', TCOV + 0.03, [XB - 0.1 * HH, 0], 0.15, 6);
const TEND = TRAIN + RAIN + 0.5;
D.shot(TCOV + 0.4, 1.0, { on: [hero, [XB - 400, -40], [XB + 300, -40], codeBox], kind: 'full' });
hero.look(TEND + 0.6, [XB - 500, -100], { dur: 0.2 }); hero.look(TEND + 1.2, [XB + 500, -100], { dur: 0.2 });   // 埋着，只有头在转
hero.look(TEND + 1.7, [XB, -200], { dur: 0.2 });
const TOUT = TEND + 2.1;                                                                  // 钻出来
hero.hip(TOUT, [XB, -ST - 0.06 * HH]).lean(TOUT, -4).head(TOUT, -10).hip(TOUT + 0.25, [XB, -ST], 0.25);
hero.foot('F', TOUT, [XB + 0.08 * HH, 0], 0.2, 20).foot('B', TOUT + 0.03, [XB - 0.07 * HH, 0], 0.2, 20);
hero.hand('F', TOUT, 'local', [0.2, -0.2]).hand('B', TOUT, 'local', [-0.15, -0.15]).sfx(TOUT, 'whoosh_short', { v: 0.6 }).sfx(TOUT + 0.05, 'rustle', { v: 0.9 });
BLAST.push({ t: TOUT + 0.03, x: XB, y: -0.4 * HH, r: 0.75 * HH, power: 900 });
for (let k = 0; k < 5; k++) hero.lean(TOUT + 0.35 + k * 0.09, k % 2 ? -9 : 9);            // 抖一抖
hero.lean(TOUT + 0.8, 2, 0.2);
hero.hand('F', TOUT + 0.4, 'local', s => [0.05 + 0.08 * Math.sin((s - TOUT) * 20), 0.15]).hand('B', TOUT + 0.4, 'local', s => [0.02 - 0.08 * Math.sin((s - TOUT) * 20), 0.2]);
hero.hand('F', TOUT + 1.0, 'free', [0.05, 0.35]).hand('B', TOUT + 1.0, 'free', [-0.04, 0.35]);
D.shot(TOUT - 0.1, 0.5, { on: [hero, codeBox], kind: 'full' });
hero.look(TOUT + 1.1, [-1300, -150], { dur: 0.3 });                                       // 回头看那一大堆
hero.look(TOUT + 1.8, [CX + 200, CY2], { dur: 0.3 });                                     // 看看代码
t = hero.scratch(TOUT + 2.3, 0.8);
for (let k = 0; k < 3; k++) hero.hip(t + 0.1 + k * 0.16, [XB, -ST + (k % 2 ? 0 : 0.03) * HH]);   // 笑（身子一颠一颠）
hero.head(t + 0.1, -24).head(t + 0.7, 0, 0.3).hip(t + 0.6, [XB, -ST], 0.2);
const T3 = t + 1.0;

// ════════════════ 第三幕 i 和 while True ════════════════
// 把电脑捡起来抱着（地上已经乱了）
hero.turn(T3, -1);
const Wc = hero.walk(T3 + 0.05, FRONT + 0.2 * HH, { stepDur: 0.28 });
const KB = hero.kneel(Wc.t - 0.1, { front: FRONT, head: 34, lean: 30 });
const TG3 = KB.t + 0.2;
BLAST.push({ t: KB.t - 0.3, x: (LX + KB.x) / 2, y: -0.2 * HH, r: 0.75 * HH, power: 650 });   // 扒开字堆，把电脑挖出来
hero.sfx(KB.t - 0.3, 'rustle', { v: 0.8 });
hero.hand('F', KB.t - 0.05, 'world', [LX + LD * (GRIP_UNDER[0] + 30), -0.045 * LW + 4]).hand('B', KB.t, 'world', [LX + LD * GRIP_BACK[0], -0.045 * LW + 3]);
hero.hand('F', TG3, 'obj', [GRIP_UNDER[0] + 30, GRIP_UNDER[1] - 4]).hand('B', TG3, 'obj', GRIP_BACK).obj(TG3, 'held', { fwd: 0.3, up: -0.05 }).sfx(TG3, 'touch2');
const RS = hero.rise(TG3 + 0.3, { head: 20 });
hero.obj(TG3 + 0.3, 'held', { fwd: 0.24, up: 0.05 }).hand('B', TG3 + 0.35, 'obj', GRIP_UNDER).hand('F', TG3 + 0.7, 'obj', keyPoint);
D.shot(T3 + 0.1, 0.7, { on: [hero, [CX, CY2 - 40], [CX + 600, CY2 + 100]], kind: 'medium' });
t = TG3 + 0.9;
hero.look(t, [CX + 200, CY2], { dur: 0.25 });
const FOR2 = code.snaps[code.snaps.length - 1].text;                                     // 'for i in range(100):\n    print("hi")'
const I100 = FOR2.indexOf('100');
code.select(t + 0.2, I100, I100 + 3).type(t + 0.35, '10', 8);
let txt = FOR2.slice(0, I100) + '10' + FOR2.slice(I100 + 3);
const IHI = txt.indexOf('"hi"');
code.select(code.tEnd + 0.3, IHI, IHI + 4).type(code.tEnd + 0.5, 'i', 6);               // "hi" → i
t = code.tEnd + 0.3;
hero.look(t, [CX + 200, CY2 + 60], { dur: 0.2, tilt: -8 });
const TR8 = t + 0.35;
code.run(TR8);                                                                           // 0 1 2 … 9
const NX0 = XB + 1.9 * HH;                                                               // 掉在右边的空地上（左边是字山）
for (let k = 0; k < 10; k++) { const tk = TR8 + 0.12 + k * 0.2; D.cue(tk, 'output', { v: 0.8 }); spawn(tk, CX + 120, CY2 + 30, (NX0 + k * 70 - (CX + 120)) / 0.62, -330, String(k), { vrot: 0, num: true, bounce: 0.15, nopile: true }); }
hero.turn(TR8 + 0.3, 1); hero.look(TR8 + 0.35, [NX0 + 300, -20], { dur: 0.3 });
const Wn0 = hero.walk(TR8 + 0.6, NX0 - 0.45 * HH, { stepDur: 0.3 });                     // 走到第一个数字旁边
D.shot(TR8 + 0.2, 0.6, { on: [hero, [NX0 + 700, -20], codeBox], kind: 'full' });
// 沿着数字走一遍，一个一个指着数
const TW = Math.max(TR8 + 2.4, Wn0.t + 0.1);
code.moveTo(TW, TW + 2.2, NX0 + 9 * 70 - 0.25 * HH - 520, CY2);                          // 代码跟着他飘过去
hero.hand('F', TW, 'free', s => [0.3, 0.05 + 0.04 * Math.sin((s - TW) * 9)]);
const Wn = hero.walk(TW, NX0 + 9 * 70 - 0.25 * HH, { stepDur: 0.34, stride: 0.2 * HH });
for (let k = 0; k < 10; k++) hero.look(TW + k * (Wn.t - TW) / 10, [NX0 + k * 70, -20], { dur: 0.1 });
D.track(TW + 0.2, Wn.t, { on: [hero], kind: 'full', lead: 0.12 });
t = hero.nod(Wn.t + 0.1, 2);
hero.hand('F', t, 'obj', keyPoint);
// while True
const XW = Wn.x;

D.shot(t, 0.6, { on: [hero, [XW - 520, CY2 - 40], [XW + 100, CY2 + 100]], kind: 'medium' });
hero.look(t + 0.2, [XW - 300, CY2], { dur: 0.25 });
{ const len = txt.replace('"hi"', 'i').length; code.select(t + 0.5, 0, len); }
code.type(t + 0.7, 'while True:\n    print("hi")', 12);
t = code.tEnd + 0.3;
hero.head(t, -26, 0.2).lean(t, -4, 0.3);                                                 // 得意
const TR9 = t + 0.4;
code.run(TR9, 30);
// hi 一个一个冒出来，越来越快
const CODEOUT = () => [XW - 520 + 120 + R2() * 30, CY2 + 30];
let tk9 = TR9 + 0.15, gap = 0.5;
const TPANIC = TR9 + 3.0;
while (tk9 < TPANIC) { spawn(tk9, ...CODEOUT(), 150 + R2() * 250, -300 - rnd() * 200); D.cue(tk9, 'output', { v: 0.6 }); tk9 += gap; gap = Math.max(0.06, gap * 0.8); }
hero.look(TR9 + 0.3, [XW - 300, CY2 + 200], { dur: 0.2 });
hero.look(TR9 + 1.2, [XW - 350, CY2], { dur: 0.2, tilt: -10 }).valueOf();
hero.lean(TR9 + 1.2, 10, 0.3);                                                           // 等一下……
D.shot(TR9 + 0.5, 0.8, { on: [hero, [XW - 520, CY2 - 40], [XW + 400, 0]], kind: 'full' });
for (let k = 0; k < 6; k++) KEYS.push(TR9 + 1.6 + k * 0.12), D.cue(TR9 + 1.6 + k * 0.12, 'key', { v: 0.9 });   // 乱按，没用
hero.hand('F', TR9 + 2.4, 'local', [0.08, -0.2]).head(TR9 + 2.4, -16);                  // 慌
// 逃命：抓着电脑往右跑；身后喷出来的 hi 越来越远、越来越多；头顶也开始下
const VR = 4.6 * HH;
const TRUN = TPANIC + 0.1;
hero.obj(TRUN, 'held', { fwd: 0.0, up: 0.1 }).hand('B', TRUN + 0.01, 'obj', GRIP_UNDER);
const Ra = hero.run(TRUN, XW + 1500, { speed: VR, stop: false, ramp: 0.3 });
hero.hand('B', TRUN + 0.02, 'obj', GRIP_UNDER);
const Sl = hero.slide(Ra.t, { v0: Ra.v, dur: 0.55 });
hero.hand('B', Ra.t + 0.01, 'obj', GRIP_UNDER);
const Rb = hero.run(Sl.t, Sl.x + 0.55 * VR, { speed: VR, v0: Math.abs(Sl.v), ramp: 0.25, stop: false });
hero.hand('B', Sl.t + 0.01, 'obj', GRIP_UNDER);
const JD = 0.52, Jp = hero.jump(Rb.t, { to: Rb.x + JD * VR, h: 180, dur: JD, running: true, land: 'run' });
hero.hand('B', Rb.t + 0.01, 'obj', GRIP_UNDER);
const Rc = hero.run(Jp.t, Jp.x + 0.7 * VR, { speed: VR, v0: VR, ramp: 0.2, stop: false });
hero.hand('B', Jp.t + 0.01, 'obj', GRIP_UNDER);
const TTRIP = Rc.t;                                                                      // 被绊倒，往前扑
D.shot(TRUN, 0.4, { on: [hero, codeBox], kind: 'wide', z: 0.62 });                     // 逃命：远景跟拍，人在右边，身后留给追来的字浪
D.track(TRUN + 0.45, Ra.t - 0.3, { on: hero, kind: 'wide', z: 0.62, lead: -0.12 });
D.shot(Ra.t - 0.3, 0.25, { on: hero, kind: 'full', dy: 40 });                            // 滑铲：拉近、压低
D.track(Ra.t, Sl.t, { on: hero, kind: 'full', dy: 40 });
D.shot(Sl.t, 0.3, { on: hero, kind: 'wide', z: 0.7, lead: 0.1 });                        // 前面那堆：往前看
D.track(Sl.t + 0.32, TTRIP - 0.2, { on: hero, kind: 'wide', z: 0.7, lead: 0.1 });
const Lt = hero.launch(TTRIP, { vx: 380, vy: -350, land: 'front', turns: 0 });
hero.obj(TTRIP, 'held', { fwd: 0.35, up: 0.1 });
D.cue(TRUN, 'music', { t1: TTRIP + 2.2, bpm: 170 });
D.cue(TRUN, 'word_rain', { dur: TTRIP + 2.2 - TRUN, v: 1 });
const hx = ta => hero.hipT.at(ta)[0];                                                    // 目标位置（模拟前就能用）
const xAt = ta => ta < Ra.t ? Ra.X(ta) : ta < Sl.t ? lerp(Ra.x, Sl.x, (ta - Ra.t) / (Sl.t - Ra.t)) : ta < Rb.t ? Rb.X(ta) : ta < Jp.t ? lerp(Rb.x, Jp.x, (ta - Rb.t) / JD) : ta < Rc.t ? Rc.X(ta) : Lt.x;
// 喷泉：落点一直追在他身后 1.5 个身高
for (let tk = TPANIC; tk < TTRIP + 1.6; tk += 0.035) {
  const fl = 0.75, target = xAt(tk + fl) - 0.6 * HH - rnd() * 1.2 * HH, [ox, oy] = CODEOUT();
  spawn(tk, ox, oy, (target - ox) / fl, -0.5 * 2600 * fl + (0 - oy) / fl * 0.0 - 200 - rnd() * 100);
}
// 一股贴着头顶飞过来的 hi（他滑铲钻过去）
const tSm = Ra.t + 0.27, xSm = xAt(tSm);
for (let k = 0; k < 14; k++) spawn(tSm - 0.45 + k * 0.025, xSm - 1100 + R2() * 40, -0.68 * HH + R2() * 25, 2400, -60, 'hi', { vrot: 0 });
// 前面一堆（他跨跳过去）
const xJ = xAt(Rb.t + JD / 2);
for (let k = 0; k < 16; k++) spawn(Rb.t - 1.6 + k * 0.04, xJ + R2() * 50, -1300 - rnd() * 100, R2() * 40, 0);
// 头顶的雨：越来越密，最后把他埋了
for (let tk = TRUN + 0.5; tk < TTRIP + 1.4; tk += 0.06) spawn(tk, xAt(tk + 0.9) + R2() * 500, -1500, R2() * 60, 0);
for (let k = 0; k < 70; k++) spawn(TTRIP - 0.4 + k * 0.022, Lt.x + R2() * 180, -1400 - rnd() * 300, R2() * 40, 0);
// 埋到只剩头：跪着，一只手把电脑举过头顶
const TBUR = Lt.t + 0.5;
hero.kneel(TBUR, { front: Lt.x + 0.15 * HH, lean: 6, head: -10, dur: 0.4 });
hero.obj(TBUR, 'held', { fwd: 0.12, up: 0.72 }).hand('B', TBUR + 0.05, 'obj', GRIP_UNDER).hand('F', TBUR + 0.2, 'obj', [GRIP_UNDER[0], GRIP_UNDER[1]]);
D.shot(TTRIP - 0.2, 0.5, { on: [hero, [Lt.x - 500, -20], [Lt.x + 500, -20]], kind: 'wide', z: 0.5 });   // 大远景：一片字海
D.shot(TBUR + 0.6, 0.6, { on: hero, kind: 'close', dy: -40 });
const TCC = TBUR + 1.6;                                                                  // Ctrl+C
hero.look(TBUR + 0.7, [Lt.x + 0.2 * HH, -0.9 * HH], { dur: 0.3 });
hero.hand('F', TCC - 0.35, 'obj', keyPoint);
KEYS.push(TCC - 0.12, TCC); D.cue(TCC - 0.12, 'key', { v: 1 }); D.cue(TCC, 'interrupt');
const TF = TCC + 0.02;                                                                   // 一切定住
code.runs = code.runs.filter(r => r.t !== TR9); code.runs.push({ t: TR9, dur: TF - TR9 });
D.cue(TF + 0.05, 'error');
const TDIS = TF + 0.9;                                                                   // 碎成灰散掉
D.cue(TDIS, 'dissolve');
D.shot(TF, 0.25, { on: [hero, [Lt.x - 700, -600], [Lt.x + 700, 0]], kind: 'wide' }, 'out3');
// 掉回地上，坐着喘气
hero.hip(TDIS + 0.5, [Lt.x + 0.05 * HH, -0.12 * HH], 0.25, 'in').lean(TDIS + 0.5, -14, 0.3).sfx(TDIS + 0.75, 'body', { v: 0.6 });
hero.foot('F', TDIS + 0.55, [Lt.x + 0.38 * HH, 0], 0.25, 8, 'inOut', false).foot('B', TDIS + 0.6, [Lt.x + 0.3 * HH, 0], 0.25, 8, 'inOut', false);
hero.obj(TDIS + 0.5, 'held', { fwd: 0.3, up: 0.05 });
for (let k = 0; k < 5; k++) hero.lean(TDIS + 1.2 + k * 0.38, k % 2 ? -10 : -16, 0.18);  // 喘气
D.shot(TDIS + 0.6, 0.8, { on: hero, kind: 'medium' });
hero.look(TDIS + 1.3, [Lt.x - 800, -200], { dur: 0.3 }).valueOf();
hero.look(TDIS + 2.0, [Lt.x + 800, -200], { dur: 0.3 });                                 // 看看空荡荡的世界
hero.look(TDIS + 2.7, [Lt.x + 0.3 * HH, -0.25 * HH], { dur: 0.3 });                     // 看看电脑
hero.lean(TDIS + 3.2, -24, 0.5).head(TDIS + 3.2, -20, 0.5);                              // 长出一口气
// 躺倒，电脑放在肚子上；敲 print("bye")
const TLIE = TDIS + 3.9;
hero.lean(TLIE, -84, 0.6).hip(TLIE, [Lt.x + 0.02 * HH, -0.03 * HH], 0.6).head(TLIE, 0, 0.5).sfx(TLIE + 0.5, 'body', { v: 0.5 });
hero.foot('F', TLIE + 0.2, [Lt.x + 0.42 * HH, 0], 0.4, 6, 'inOut', false).foot('B', TLIE + 0.25, [Lt.x + 0.35 * HH, 0], 0.4, 6, 'inOut', false);
hero.obj(TLIE + 0.3, 'held', { fwd: 0.18, up: 0.2 });
D.shot(TLIE, 1.4, { on: hero, kind: 'full' }, 'inOut');
const TBYE = TLIE + 1.6;
code.set(TBYE - 0.1, '').moveTo(TBYE - 0.1, TBYE - 0.09, Lt.x - 160, -0.95 * HH);
hero.hand('F', TBYE - 0.2, 'obj', keyPoint);
code.type(TBYE, 'print("bye")', 11);
const TRB = code.tEnd + 0.3;
code.run(TRB); D.cue(TRB + 0.08, 'output');
hero.look(TRB + 0.1, [Lt.x - 60, -0.9 * HH], { dur: 0.2 });
const ADUR = TRB + 2.4;
offscreen.push([D.R(TTRIP), D.R(TTRIP + 1.5)], [D.R(TTAB - 1.5), D.R(TTAB + 0.8)]);

// ———————————————— 模拟 ————————————————
KEYS = keyTimes().concat(KEYS.filter(k => k > T2)).sort((a, b) => a - b);
D.finalize({ actors: [hero], bodies: [lap, hi1], dur: ADUR, start: { x: -520, y: -330, z: 0.75 } });
const DUR = D.DUR;
// 依赖主角动作的东西（模拟之后才知道位置）
const handAt = ta => hero.jointsAt(ta).aF[2];
const words = [];
const mk = (o) => { const b = new Body({ ...WORD, ...o }); b.str = o.str || 'hi'; b.num = o.num; words.push(b); return b; };
{ const p = handAt(TPLACE); mk({ t0: TPLACE, x: p[0], y: p[1], vx: 0, vy: 0 }); }
SPAWN.sort((a, b) => a.t0 - b.t0);
for (const sp of SPAWN) { if (sp.t0 >= TF) continue; mk({ t0: sp.t0, x: sp.x, y: sp.y, vx: sp.vx, vy: sp.vy, vrot: sp.vrot, str: sp.str, num: sp.num, bounce: sp.bounce ?? 0.3, until: Math.min(TF + 0.1, sp.t0 + 12), ...(sp.nopile ? { pile: null } : {}) }); }
for (const bl of BLAST) for (const b of words) {
  if (b.t0 >= bl.t) continue;
  const [x, y] = b.at(bl.t), dx = x - bl.x, dy = y - bl.y, d = Math.hypot(dx, dy);
  // 他身边整列的字（不管堆多高）都炸开，不然上面的会悬在半空
  if (Math.abs(dx) < bl.r && y > -2 * HH) { const k = bl.power * (0.6 + 0.6 * (1 - d / bl.r)); b.hits.push({ t: bl.t + rnd() * 0.05, vx: dx / (d + 1) * k + R2() * 200, vy: -Math.abs(k) * (0.7 + rnd() * 0.5), vrot: R2() * 15 }); b.sim(); }
}
// bye 掉在他脸上
const head = hero.jointsAt(TRB + 0.6).head, bx0 = Lt.x - 160 + 6 * CS * 0.5, by0 = -0.95 * HH + 30, byG = head[1] - 0.115 * HH + 4 - 13;
const bT = (200 + Math.sqrt(200 * 200 + 2 * 2600 * (byG - by0))) / 2600;               // 落到脸上要多久
const bye = new Body({ t0: TRB + 0.08, x: bx0, y: by0, vx: (head[0] - bx0) / bT, vy: -200, vrot: 1, r: 13, hw: 30, ground: byG + 13, bounce: 0.15, friction: 0.3, sfx: 'tick', defer: true });
{ // 落地声：字雨期间由字雨声代替；其它时段间隔太近的只留最响的那个（不然几百个字一起落地会响成一片）
  const rainWin = [[TRAIN, TRAIN + RAIN + 0.6], [TRUN, TTRIP + 2.2]];
  const ev = words.flatMap(b => b.events.map(e => ({ ...e, b }))).filter(e => !rainWin.some(([a, z]) => e.t > a && e.t < z)).sort((x, y) => x.t - y.t);
  const keep = [];
  for (const e of ev) { const p = keep[keep.length - 1]; if (!p || e.t - p.t > 0.06) keep.push(e); else if (e.v > p.v) keep[keep.length - 1] = e; }
  for (const b of words) b.events = [];
  for (const e of keep) e.b.events.push({ t: e.t, type: e.type, v: e.v });
}
flushSfx([...words, bye], clock);

// ———————————————— 画面 ————————————————
const TFW = TF;
function wordPos(b, ta) { return b.at(Math.min(ta, TFW)); }
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  code.draw(ctx, ta);
  const s = hero.stateAt(ta);
  const held = ta >= TG3;
  if (ta >= lap.t0 && !held) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, LD);
  if (ta < TPICK) { if (ta >= hi1.t0) { const [x, y, r] = hi1.at(ta); PR.word(ctx, 'hi', x, y, r); } }
  if (ta >= T_FALL + 0.04) hero.draw(ctx, ta);
  if (held) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, s.dir);
  if (ta >= TPICK && ta < TPLACE) { const p = handAt(ta); PR.word(ctx, 'hi', p[0] + 6, p[1] - 14, 0.1 * Math.sin(ta * 3)); }
  // 字：Ctrl+C 之后定住，再碎成字母散掉
  const dis = clamp((ta - TDIS) / 0.9);
  // 字堆的实心轮廓（画在人前面、字后面）：埋住的人被它挡住，看起来是一座字山
  if (dis < 1) {
    const tp = Math.min(ta, TFW), x0 = c.x - W / 2 / c.z - 40, x1 = c.x + W / 2 / c.z + 40, step = pile.cell;
    ctx.save(); ctx.fillStyle = `rgba(24,24,24,${1 - dis})`; ctx.beginPath(); ctx.moveTo(x0, 2);
    let any = false;
    for (let x = x0; x <= x1; x += step) { const h = pile.top(x, step * 1.5, tp); if (h > 0) any = true; ctx.lineTo(x, -Math.max(0, h - 12)); }
    ctx.lineTo(x1, 2); ctx.closePath(); if (any) ctx.fill(); ctx.restore();
  }
  for (let i = 0; i < words.length; i++) {
    const b = words[i];
    if (ta < b.t0) continue;
    const [x, y, r] = wordPos(b, ta);
    if (dis <= 0) { PR.word(ctx, b.str, x, y, r, b.num ? 58 : 50, 1, b.num ? [235, 235, 235] : undefined); continue; }
    if (dis >= 1) continue;
    const rr = mulberry32(i * 13 + 5), a = 1 - E.in(dis);
    for (let k = 0; k < b.str.length; k++) {                                              // 每个字母各自飘散
      const ox = (k - (b.str.length - 1) / 2) * 22, vx = (rr() - 0.5) * 160, vy = -60 - rr() * 160, sp = (rr() - 0.5) * 6;
      PR.word(ctx, b.str[k], x + ox + vx * dis, y + vy * dis - 40 * dis * dis, r + sp * dis, 50 * (1 - 0.5 * dis), a);
    }
    if (i % 3 === 0) { ctx.fillStyle = `rgba(214,214,214,${0.5 * a})`; for (let k = 0; k < 4; k++) ctx.fillRect(x + (rr() - 0.5) * 70 * (1 + dis), y - rr() * 90 * dis, 3, 3); }
  }
  if (ta >= bye.t0) { const [x, y, r] = bye.at(ta); PR.word(ctx, 'bye', x, y, r); }
  D.imp.drawWorld(ctx, tr);
  // KeyboardInterrupt：红字
  if (ta >= TF + 0.05) {
    const a = clamp((ta - TF - 0.05) / 0.08) * (1 - clamp((ta - TDIS - 1.6) / 0.6));
    if (a > 0) { ctx.save(); ctx.font = `400 ${CS * 1.1}px Code`; ctx.textAlign = 'center'; ctx.fillStyle = rgba(C.errText || [244, 71, 71], a); ctx.fillText('KeyboardInterrupt', Lt.x - 0.2 * HH, -1.18 * HH); ctx.restore(); }
  }
  ctx.restore();
  // Ctrl+C 插入镜头：键盘大特写（0.7 秒）
  const ci = tr - D.R(TCC - 0.45);
  if (ci >= 0 && ci < 0.7) drawCtrlC(ctx, ci);
}
function key(ctx, x, y, w, h, label, down) {
  ctx.save(); ctx.translate(x, y + (down ? 10 : 0));
  ctx.fillStyle = '#1b1b1b'; ctx.strokeStyle = '#5a5a5a'; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 22); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#e8e8e8'; ctx.font = `400 ${h * 0.34}px Code`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, 0, 0);
  ctx.restore();
}
function drawCtrlC(ctx, a) {
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#9a9a9a'; ctx.fillRect(0, 0, W, H);                                    // 电脑的银色机身
  ctx.fillStyle = '#7d7d7d'; for (let k = 0; k < 5; k++) ctx.fillRect(0, 120 + k * 230, W, 6);
  const down1 = a > 0.18, down2 = a > 0.45;
  key(ctx, 620, 640, 420, 230, 'Ctrl', down1); key(ctx, 1180, 640, 230, 230, 'C', down2);
  key(ctx, 1460, 640, 230, 230, 'V', false); key(ctx, 160, 640, 300, 230, 'Fn', false); key(ctx, 900, 380, 230, 230, 'D', false); key(ctx, 1460, 380, 230, 230, 'F', false);
  // 手指（黄色粗线，从右上角伸进来）
  ctx.strokeStyle = rgba(C.yellow); ctx.lineCap = 'round'; ctx.lineWidth = 120;
  const tip = a < 0.3 ? [620, down1 ? 600 : 520] : [1180, a < 0.45 ? 520 : 610];      // 指尖：先按 Ctrl，再按 C
  ctx.beginPath(); ctx.moveTo(W + 200, -300); ctx.lineTo(tip[0], tip[1]); ctx.stroke();
  if (down2 && a < 0.62) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 8; for (let k = 0; k < 7; k++) { const g = k / 7 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(1180 + Math.cos(g) * 170, 640 + Math.sin(g) * 170); ctx.lineTo(1180 + Math.cos(g) * 240, 640 + Math.sin(g) * 240); ctx.stroke(); } }
  ctx.restore();
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }

module.exports = { DUR, draw, post, cam, hero, clock, codes: [code], offscreen, heroFrom: D.R(T_FALL + 0.05),
  marks: { L0, U0, K1, TE, TO, TPICK, TPLACE, T2, KA, TIE, TTAB, TR5, TR6, TR7, TEND, TOUT, T3, TR8, TR9, TRUN, TTRIP, TCC, TF, TDIS, TLIE, TRB, ADUR } };
