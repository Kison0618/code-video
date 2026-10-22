// 《火柴人 VS 光标》第 4 段（SCENE=cur4）：回合 3（条件反射）+ 回合 4（def 连招）+ 全选 / 删除（剧本 火柴人VS光标_剧本.md）
//   while True + if near(cursor): dodge() → 身体自己闪，越来越快 → 他干脆躺下，身体还在自己滚 → 它打大字砸他 → elif typing(cursor): duck()
//   → 它把 dodge 改成 doge → NameError，被打飞 → def combo()：什么都没发生，两个人干等 2 秒 → combo() 三连 → combo(3) 九连踢飞它
//   → combo(100) 打到累瘫 → 它 Ctrl+/ 把他的代码注释掉、吃掉，长到 2H → 蓄力 → Ctrl+A 全世界变蓝 → Delete 一片白
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E } = K;
const { Actor2, FightFX } = require('./fight');
const { Director } = require('./director');
const { Code } = require('./code');
const { Snake, spline } = require('./snake');
const PR = require('./props');
const CL = require('./cursorlib');

const DRAW = { step: 'auto', smear: false, turn: 0.4 };                    // 一拍一 / 一拍二出画、身上不画拖影、转身压扁一张（研究/动作逐帧_四集.md）
const HH = 300, LW = CL.LW, F = 1 / 24, GAP = 80, CS = 45, LH = CS * 1.32;
const D = new Director(), clock = D.clock, cam = D.cam;
const R = CL.keyRig();
const fx = new FightFX(HH);
const X0 = 0, WX = X0 - 0.8 * HH, CWB = 56, CHB = 62;
const hero = new Actor2({ H: HH, x0: X0, dir: -1, clock, lean: 2, headTilt: 0, noise: 0 });   // noise 0：定格就是完全不动（原片规律 3）
const ST = hero.STAND;
const cur = new CL.Cur({ x: WX - 0.95 * HH, form: 'ibeam', size: 1.0 * HH, blink: 'slow' });
const KC = [];
const capAt = (tk, at, keys, size = 58) => KC.push({ at: typeof at === 'function' ? at : () => at, size, keys: keys.map((l, i) => ({ label: l, t: tk + i * 0.17 })), t1: tk + 0.17 * keys.length + 0.5 });
const capCur = tk => () => { const c = cur.topAt(tk); return [c[0], c[1] - 0.45 * HH]; };
let t;

// ════════════════ 回合 3：条件反射 ════════════════
const K0 = hero.kneel(0.05, { front: X0 - 0.15 * HH, head: 30, lean: 24 });
hero.obj(0, 'held', { fwd: 0.4, up: -0.05 }); R.oneHand(hero, 0.1);
const code = new Code({ x: X0 + 0.2 * HH, y: -2.0 * HH, size: CS, seed: 41, cps: 18 });
const CB = (n = 4, w = 22) => [[code.x - 20, code.y - 60], [code.x + w * CS * 0.5, code.y + n * LH]];
const RF1 = 'while True:';
code.type(0.4, RF1, 16);
const THES = code.tEnd + 0.1;                                                // 看到 while True 犹豫一下（上一集被它坑过）
hero.head(THES, 10, 0.15).lean(THES, 14, 0.2);
const RF = RF1 + '\n    if near(cursor):\n        dodge()';
code.type(THES + 0.8, RF.slice(RF1.length), 20);
const TR1 = code.tEnd + 0.3;
code.run(TR1, 0.35);
hero.lean(THES + 0.8, 24, 0.2);
const Rz = hero.rise(TR1 + 0.3, { head: 4 });
hero.obj(TR1 + 0.3, 'held', { fwd: 0.24, up: 0.05 }); R.oneHand(hero, TR1 + 0.32);
D.shot(0, 0.01, { on: [hero, cur, ...CB(3)], kind: 'full' });
// 它跳过半截墙，扑过来——他的身体自己闪开（越来越快：22 → 12 → 10 → 8 → 6 帧）
const TJW = Rz.t + 0.5;
cur.glide(TJW, 0.5, X0 - 0.75 * HH, 0, { arc: 260 }); D.cue(TJW + 0.5, 'cursor_hop', { v: 0.9 });
const TWD = TJW + 0.55; D.cue(TWD, 'backspace_eat', { v: 0.7 });
const IFL = RF.indexOf('if'), IFE = RF.indexOf(':', IFL);
const GAPS = [22, 12, 10, 8, 6], DODGES = ['lean_dodge', 'dodge_back', 'duck', 'tuck_jump', 'lean_dodge'];
let tk = TJW + 0.9;
const lunges = [];
for (let i = 0; i < GAPS.length; i++) {
  const xh = hero.hipNow(tk)[0];
  hero.move(tk - 4 * F, DODGES[i]);
  cur.hop(tk - 0.04, xh - 0.45 * HH); cur.hop(tk + 0.1, xh - 0.15 * HH, undefined, { v: 0.9 }); cur.hop(tk + 0.22, xh - 0.75 * HH, undefined, { sfx: false });
  code.tag(tk - 4 * F, tk + 0.25, IFL, IFE, 'True', [62, 150, 80], 'right'); D.cue(tk - 4 * F, 'cond_true', { v: 0.5 }); D.cue(tk, 'whoosh', { v: 0.5 });
  lunges.push(tk); tk += GAPS[i] * F + 0.35;
}
D.shot(TJW, 0.5, { on: [hero, cur, ...CB(3)], kind: 'full' });
// 他发现不用管了：干脆侧躺、手撑着头；它扑来，身体自己滚开
const TLIE = tk + 0.3, XL = hero.hipNow(TLIE)[0];
hero.hip(TLIE, [XL, -0.12 * HH], 0.35).lean(TLIE, 74, 0.35).head(TLIE, -40, 0.3);   // 侧躺：头朝电脑、脚朝后
hero.foot('F', TLIE + 0.05, [XL + 0.5 * HH, 0], 0.3, 6).foot('B', TLIE + 0.1, [XL + 0.42 * HH, 0], 0.3, 6);
hero.hand('B', TLIE + 0.1, 'local', [-0.06, -0.28]);                         // 手撑着头
hero.obj(TLIE + 0.1, 'rest', [XL - 0.62 * HH, -0.045 * LW, 0]);              // 电脑放在面前地上（头前面，手够得着）
hero.hand('F', TLIE + 0.3, 'obj', R.keyPoint);
const ROLLS = [TLIE + 1.0, TLIE + 1.7];
for (const tr of ROLLS) {
  const x = hero.hipNow(tr)[0];
  cur.hop(tr - 0.05, x - 0.3 * HH); cur.hop(tr + 0.08, x, undefined, { v: 0.9 }); cur.hop(tr + 0.2, x - 0.85 * HH, undefined, { sfx: false });
  hero.path('hip', tr - 0.06, tr + 0.18, s => { const u = (s - tr + 0.06) / 0.24; return [x + 0.0 * HH * u, -0.12 * HH - 0.35 * HH * Math.sin(Math.PI * u)]; });   // 整个人往上弹一下躲开
  hero.hip(tr + 0.18, [x, -0.12 * HH]);
  hero.hand('F', tr - 0.06, 'local', [0.2, 0.05]).hand('F', tr + 0.22, 'obj', R.keyPoint);   // 弹起来时手离开键盘，落回去再放上
  code.tag(tr - 0.1, tr + 0.25, IFL, IFE, 'True', [62, 150, 80], 'right'); D.cue(tr - 0.1, 'cond_true', { v: 0.5 });
}
cur.blink(ROLLS[1] + 0.3, 'fast');                                           // 它气得乱闪
D.shot(TLIE, 0.5, { on: [hero, cur, [XL + 0.6 * HH, 0]], kind: 'full' });
// 它打大写字砸他 → 他躺着补一行 elif
const TTY = ROLLS[1] + 0.9;
cur.say(TTY, 'HEY', { cps: 10, dur: 0.1 });
const RF2 = RF + '\n    elif typing(cursor):\n        duck()';
code.type(TTY + 0.15, RF2.slice(RF.length), 26);
const TR2 = code.tEnd + 0.15;
code.run(TR2, 0.3);
const IEL = RF2.indexOf('elif'), IEE = RF2.indexOf(':', IEL);
const LETS = [['H', TR2 + 0.5], ['E', TR2 + 0.75], ['Y', TR2 + 1.0]];
for (const [, tl] of LETS) { const x = hero.hipNow(tl)[0]; hero.path('hip', tl - 0.12, tl + 0.12, s => { const u = (s - tl + 0.12) / 0.24; return [x, -0.12 * HH - 0.3 * HH * Math.sin(Math.PI * u)]; }); hero.hip(tl + 0.12, [x, -0.12 * HH]); hero.hand('F', tl - 0.12, 'local', [0.2, 0.05]).hand('F', tl + 0.16, 'obj', R.keyPoint); code.tag(tl - 0.15, tl + 0.2, IEL, IEE, 'True', [62, 150, 80], 'right'); D.cue(tl, 'thud', { v: 0.6 }); }
D.shot(TTY - 0.2, 0.4, { on: [hero, cur, ...CB(5, 24)], kind: 'full' });
// 它停住、常亮……在 dodge 下面画红波浪线，改成 doge → 下一次扑来：NameError，循环断了，被打飞
const TSQ = LETS[2][1] + 0.8;
cur.blink(TSQ, 'solid');
const ID = RF2.indexOf('dodge');
code.squiggle(TSQ + 0.4, TSQ + 1.5, ID, ID + 5);
const RF3 = RF2.slice(0, ID) + 'doge' + RF2.slice(ID + 5);
code.set(TSQ + 1.1, RF3); D.cue(TSQ + 1.1, 'replace', { v: 0.4 });
const TLN = TSQ + 1.8, XLN = hero.hipNow(TLN)[0];
cur.hops(TLN - 0.3, XLN - 0.1 * HH, { dt: 0.06 });
code.tag(TLN - 0.2, TLN + 0.1, IFL, IFE, 'True', [62, 150, 80], 'right');
code.error(TLN - 0.05, ID, ID + 4, 'NameError');
const L1 = hero.launch(TLN, { vx: 750, vy: -700, turns: 1, land: 'back' });
fx.add(TLN, [XLN - 0.1 * HH, -0.3 * HH], 'heavy'); D.cue(TLN, 'impact_heavy');
D.shot(TLN, 8 * F, { on: [hero, cur, [L1.x + 0.5 * HH, 0]], kind: 'wide' }, 'out3');

// ════════════════ 回合 4：def combo ════════════════
const U1 = hero.getUp(L1.t + 0.4, { from: 'back', speed: 1.7 });
const XLAP = XL - 0.62 * HH;                                                 // 电脑还在他躺着时放的地方
hero.turn(U1.t, -1);
const Wk = hero.walk(U1.t + 0.05, XLAP + 0.45 * HH, { stepDur: 0.24 });
const K2 = hero.kneel(Wk.t - 0.05, { front: XLAP + 0.5 * LW + 4, head: 30, lean: 26 });
hero.reach('B', K2.t - 0.1, [XLAP + 0.02 * LW, -0.03 * LW], { dur: 0.15 }).hand('F', K2.t, 'obj', R.keyPoint);   // 跪着、俯身、双手在键盘上（认真了）
const code2 = new Code({ x: XLAP - 0.3 * HH, y: -1.95 * HH, size: CS, seed: 43, cps: 16 });
const CB2 = (n = 4, w = 14) => [[code2.x - 20, code2.y - 60], [code2.x + w * CS * 0.5, code2.y + n * LH]];
const DEF = 'def combo():\n    jab()\n    jab()\n    kick()';
code2.type(K2.t + 0.2, DEF, 18);
const TDR = code2.tEnd + 0.3;
code2.run(TDR);
const Rz2 = hero.rise(TDR + 0.35, { head: 0 });
hero.hand('F', TDR + 0.35, 'free', [0.05, 0.35]).hand('B', TDR + 0.37, 'free', [-0.04, 0.35]);   // 站起来手就离开键盘
hero.move(Rz2.t + 0.05, 'guard');
const TWAIT = Rz2.t + 0.3;                                                   // 什么都没发生：两个人干等 2 秒
cur.hops(TWAIT - 0.6, XLAP - 0.4 * HH + 0.0, { dt: 0.1 });
cur.blink(TWAIT, 'solid');
hero.head(TWAIT + 0.9, 14, 0.2).head(TWAIT + 1.4, -6, 0.2);
D.shot(K2.t, 0.5, { on: [hero, cur, ...CB2()], kind: 'full' });
D.shot(TWAIT, 0.5, { on: [hero, cur], kind: 'medium' });
// 恍然：跪下打 combo() → 刺拳、刺拳、踢，它连退三格
const TAH = TWAIT + 2.0;
hero.head(TAH, -20).lean(TAH, -6).hip(TAH, [hero.hipNow(TAH)[0], -ST - 0.02 * HH]).lean(TAH + 0.2, 4, 0.15);
hero.hand('F', TAH, 'local', [0.14, -0.1]).hand('B', TAH, 'local', [0.1, -0.06]);   // 一下站起来，手离开键盘
const CALL1 = TAH + 0.3;
code2.cursor(CALL1, DEF.length).type(CALL1 + 0.05, '\ncombo()', 24);
D.cue(CALL1, 'key', { v: 0.8 });
hero.reach('F', CALL1 - 0.1, [XLAP + 0.1 * LW, -0.05 * LW], { dur: 0.1 });   // 弯腰点一下键盘（自动弯到够得着）
const TC1 = code2.tEnd + 0.15;
code2.run(TC1, 0.25);
hero.lean(TC1 + 0.05, 4, 0.1).hip(TC1 + 0.05, [hero.hipNow(TC1)[0], -ST], 0.1);
let tc = TC1 + 0.15;
const hitCur = (tt, back, lvl = 'hit') => { const p = cur.posAt(tt); cur.hit(tt + 2 * F, -1); fx.add(tt + 2 * F, [p.x + 0.15 * HH, -0.55 * HH], lvl); D.cue(tt + 2 * F, lvl === 'heavy' ? 'impact_heavy' : 'impact_light'); cur.hop(tt + 0.12, p.x - back); };
for (const m of ['jab', 'jab', 'front_kick']) { const r = hero.move(tc, m, { to: null }); hitCur(tc + (m === 'front_kick' ? 5 : 3) * F, 0.3 * HH); tc = r.t - 0.05; }
D.shot(CALL1 - 0.3, 0.3, { on: [hero, cur, ...CB2(5)], kind: 'full' });
D.shot(TC1 + 0.5, 0.4, { on: [hero, cur, [cur.posAt(TC1).x - 1.2 * HH, 0]], kind: 'full' });
// combo(3)：九连击越打越快，最后一脚把它踢飞
const Wbk = hero.walk(tc + 0.05, XLAP + 0.45 * HH, { stepDur: 0.15 });      // 退回电脑边（打完人站在电脑上方，够不着键盘）
const C3 = Math.max(tc + 0.4, Wbk.t + 0.05);
code2.back(C3, 1, 30).type(C3 + 0.08, '3)', 20);
D.shot(C3 - 0.4, 0.3, { on: [hero, cur, ...CB2(5)], kind: 'full' });
hero.reach('F', C3 - 0.1, [XLAP + 0.1 * LW, -0.05 * LW], { dur: 0.08 });
const TC3 = code2.tEnd + 0.1;
code2.run(TC3, 0.25);
hero.lean(TC3, 4, 0.08).hip(TC3, [hero.hipNow(TC3)[0], -ST], 0.08).hand('F', TC3, 'free', [0.05, 0.35]);
// 他先追上去
const XCH = cur.posAt(TC3).x + 0.85 * HH;
hero.walk(TC3 + 0.02, XCH, { stepDur: 0.18 });
tc = TC3 + 0.55;
const NINE = ['jab', 'jab', 'front_kick', 'jab', 'jab', 'front_kick', 'jab', 'jab', 'front_kick'];
NINE.forEach((m, i) => { const r = hero.move(tc, m); const last = i === 8; if (!last) hitCur(tc + (m === 'front_kick' ? 5 : 3) * F, 0.18 * HH); tc = r.t - 0.12 - 0.012 * i; });
const TKO = tc + 0.05;
const pK = cur.posAt(TKO);
cur.hit(TKO, -1); cur.glide(TKO + 0.02, 0.8, pK.x - 3.2 * HH, 0, { arc: 600, ease: 'out' });
fx.add(TKO, [pK.x + 0.1 * HH, -0.5 * HH], 'heavy'); D.cue(TKO, 'impact_heavy');
D.shot(TKO, 10 * F, { on: [hero, [pK.x - 3.4 * HH, -0.3 * HH]], kind: 'wide' }, 'out3');
// 得意忘形 combo(100)：拳越来越软，累瘫
const C100 = TKO + 1.1;
hero.move(C100 - 0.3, 'guard');
hero.hand('F', C100, 'local', [0.25, -0.18]);                                // 指着代码：再来！
code2.back(C100 + 0.2, 2, 30).type(C100 + 0.3, '100)', 16);
const T100 = code2.tEnd + 0.1;
code2.run(T100, 0.3);
const XC100 = hero.hipNow(T100)[0];
cur.hops(T100 + 0.1, XC100 - 0.7 * HH, { dt: 0.12 });                        // 它回来了
tc = T100 + 0.35;
for (let i = 0; i < 12; i++) { const r = hero.move(tc, 'jab'); if (i < 5) hitCur(tc + 3 * F, 0.05 * HH); tc = r.t - 0.1 + i * 0.03; D.cue(tc, 'punch_soft', { v: Math.max(0.15, 0.8 - i * 0.06) }); }
const TTIRED = tc + 0.1, XT = hero.hipNow(TTIRED)[0];
hero.hip(TTIRED, [XT, -0.09 * HH], 0.4).lean(TTIRED, -22, 0.4).head(TTIRED, 30, 0.4);   // 累瘫坐下（往后仰、两手撑在身后地上）
hero.foot('F', TTIRED + 0.1, [XT - 0.45 * HH, 0], 0.4, 6).foot('B', TTIRED + 0.15, [XT - 0.35 * HH, 0], 0.4, 6);
hero.hand('F', TTIRED + 0.1, 'world', [XT + 0.14 * HH, 0]).hand('B', TTIRED + 0.12, 'world', [XT + 0.2 * HH, 0]);
for (let k = 0; k < 5; k++) hero.lean(TTIRED + 0.5 + k * 0.4, k % 2 ? -25 : -19, 0.2);   // 喘气
D.shot(T100, 0.4, { on: [hero, cur, ...CB2(5)], kind: 'full' });

// ════════════════ 它 Ctrl+/ 把他的代码注释掉、吃掉，长到 2H ════════════════
const TCM = TTIRED + 1.2;
cur.blink(TCM - 0.3, 'solid');
capAt(TCM, capCur(TCM), ['Ctrl', '/']); D.cue(TCM, 'key'); D.cue(TCM + 0.17, 'key');
const DEFC = code2.last().text;
const commented = DEFC.split('\n').map(l => '# ' + l).join('\n');
code2.set(TCM + 0.4, commented); D.cue(TCM + 0.4, 'replace', { v: 0.5 });
const EATS = DEFC.split('\n').map((l, i) => ({ i, t0: TCM + 1.0 + i * 0.12 }));
for (const e of EATS) D.cue(e.t0 + 0.3, 'backspace_eat', { v: 0.5 });
cur.grow(TCM + 1.0, 1.5 * HH, 0.5); cur.grow(TCM + 1.6, 2.0 * HH, 0.3);
D.shot(TCM - 0.3, 0.5, { on: [hero, cur, ...CB2(5)], kind: 'full' });
// ════════════════ 蓄力 → Ctrl+A 全世界变蓝 → Delete 一片白 ════════════════
const TSP0 = TCM + 2.4, TSP1 = TSP0 + 1.0;
cur.spin(TSP0, TSP1);
const TALL = TSP1 + 0.2;
capAt(TALL - 0.17, capCur(TALL), ['Ctrl', 'A'], 70);
D.cue(TALL - 0.17, 'key'); D.cue(TALL, 'select_all', { v: 1 });
D.shot(TALL - 0.05, 0.25, { on: [hero, cur, [hero.hipNow(TALL)[0] - 4 * HH, 0], [hero.hipNow(TALL)[0] + 4 * HH, -2.5 * HH]], kind: 'wide', z: 0.22 }, 'out3');
const TDEL = TALL + 2.3;
capAt(TDEL - 0.1, capCur(TDEL), ['Delete'], 70); D.cue(TDEL, 'delete_all', { v: 1 });
D.shot(TDEL + 0.05, 0.6, { on: [hero], kind: 'full' });
hero.hand('F', TDEL + 0.8, 'free', [0.05, 0.35]);
hero.head(TDEL + 1.2, 34, 0.4);                                              // 低头看手里……什么都没了
const ADUR = TDEL + 3.4;
// 代码只在打字 / 运行的那几秒露出来（构图规则：动作段代码露 1–4 秒）
const showOnly = (c, wins) => { let prev = -1e9; for (const [a, b] of wins) { c.fadeOut(prev, a); prev = b; } c.fadeOut(prev, 1e9); };
showOnly(code, [[0.3, TR1 + 1.0], [TTY, TR2 + 0.8], [TSQ, TLN + 0.6]]);
showOnly(code2, [[K2.t, TDR + 0.8], [CALL1 - 0.3, TC1 + 0.5], [C3 - 0.3, TC3 + 0.5], [C100, T100 + 0.5], [TCM - 0.2, TCM + 1.0]]);

// ———— 小蛇：缩在他身后；Delete 之后不见了 ————
const kS = [];
for (let tk = -4; tk <= ADUR; tk += 0.25) { const x = tk < 0 ? X0 + (3.5 + tk * 0.5) * HH : X0 + 1.5 * HH; kS.push([tk, x, -30]); }
const snake = new Snake({ t0: -4, t1: ADUR, gap: GAP, max: 12, head: spline(kS, { mono: true }), size: 42, plain: true });
const ws = new CL.WordSnake({ snake, n: () => 10, size: 42, alpha: s => (s < TDEL ? 1 : 0) });

// ———— 模拟 ————
R.KEYS.push(...R.keyTimes(code), ...R.keyTimes(code2)); R.KEYS.sort((a, b) => a - b);
D.codes = [code, code2];                                                    // 镜头自动把露出来的代码框进来（director.js）
D.finalize({ actors: [hero], dur: ADUR, start: { x: 0, y: -330, z: 1 } });
const DUR = D.DUR;

// ———— 画面 ————
const blk = (ctx, x, y) => PR.word(ctx, '#', x, y, 0, 80, 1, [228, 228, 228]);
function drawWorld(ctx, ta, c) {
  CL.drawGround(ctx, c.x - W / 2 / c.z - 60, c.x + W / 2 / c.z + 60, ta);
  for (let k = 0; k < 3; k++) for (let j = 0; j < 5; j++) { if (ta >= TWD + ((2 - k) * 5 + (4 - j)) * 0.02) continue; blk(ctx, WX + (j - 2) * CWB, -(k + 0.5) * CHB); }   // 半截墙（它落地后顺手把墙删掉）
  code.draw(ctx, ta); code2.draw(ctx, ta);
  for (const e of EATS) {                                                     // 被吃掉的代码：一行字飞进它身体
    if (ta < e.t0 || ta > e.t0 + 0.45) continue;
    const u = E.in(clamp((ta - e.t0) / 0.4)), p = cur.posAt(ta), a = [code2.x + 4 * CS * 0.5, code2.y + e.i * LH];
    PR.word(ctx, '# ' + DEFC.split('\n')[e.i].trim(), lerp(a[0], p.x, u), lerp(a[1], p.y - cur.formAt(ta).size * 0.5, u), 0, CS * (1 - 0.7 * u), 1 - u * 0.5, [120, 120, 120]);
  }
  for (const [ch, tl] of LETS) {                                              // HEY 三个大字砸下来
    if (ta < tl - 0.35 || ta > tl + 1.2) continue;
    const u = clamp((ta - tl + 0.35) / 0.35), x = hero.hipNow(tl)[0] + 0.05 * HH, y = lerp(-1500, -0.25 * HH, u * u);
    PR.word(ctx, ch, x, ta > tl ? -0.25 * HH : y, 0, 0.5 * HH * 1.3, 1 - clamp((ta - tl - 0.8) / 0.4), [235, 235, 235]);
  }
  ws.draw(ctx, ta);
  cur.draw(ctx, ta);
}
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  const blue = ta >= TALL && ta < TDEL, white = ta >= TDEL;
  ctx.fillStyle = white ? '#fff' : blue ? K.rgba(CL.BLUE) : '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c); ctx.translate(0, fx.joltAt(ta));
  if (!white) drawWorld(ctx, ta, c);
  const s = hero.stateAt(ta);
  hero.draw(ctx, ta, DRAW);
  PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, s.dir);
  for (const k of KC) PR.keyCombo(ctx, ta, { ...k, at: k.at(ta) });
  if (!white) fx.draw(ctx, ta);
  ctx.restore();
  const fl = fx.flashAt(ta);
  if (fl > 0 && !white) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }

module.exports = { snakes: [ws], DUR, draw, post, cam, hero, clock, codes: [code, code2], beats: [], cur,
  end: { heroX: hero.hipNow(ADUR)[0], laptop: hero.stateAt ? null : null, curX: cur.posAt(ADUR).x },
  marks: { TR1, TJW, TLIE, TTY, TSQ, TLN, TDR, TWAIT, TC1, TC3, TKO, C100, TTIRED, TCM, TSP0, TALL, TDEL, ADUR } };
