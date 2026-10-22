// 《火柴人 VS 光标》第 3 段（SCENE=cur3）：回合 2 + 回忆砌墙（剧本 火柴人VS光标_剧本.md）
//   它复制粘贴出一排自己 → 一个接一个冲过来，他连着躲 / 拍开 / 踢飞 → 抓住一个塞进电脑：两个光标一起打 jump()，二段跳
//   → 光标们合回一个、变大 → 三击删掉他脚下那段地面，他掉进去、扒着边爬上来 → 被一格格逼到画面尽头
//   → 回忆 1（上一集 for 砌墙）→ 快打 for，墙挡住它 → 它框选删掉半截墙
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E } = K;
const cues = require('./cues');
const { Actor2, FightFX } = require('./fight');
const { Director } = require('./director');
const { Code } = require('./code');
const { Snake, spline } = require('./snake');
const PR = require('./props');
const CL = require('./cursorlib');

// 回忆要用上一集的画面：加载上一集的场景（它的音效不要进这一段的时间表）
const n0 = cues.list.length;
const V2 = require('./scene_loop2');
cues.list.length = n0;

const DRAW = { step: 'auto', smear: false, turn: 0.4 };                    // 一拍一 / 一拍二出画、身上不画拖影、转身压扁一张（研究/动作逐帧_四集.md）
const HH = 300, LW = CL.LW, F = 1 / 24, GAP = 80;
const D = new Director(), clock = D.clock, cam = D.cam;
const R = CL.keyRig();
const fx = new FightFX(HH);
const X0 = 0;
const hero = new Actor2({ H: HH, x0: X0, dir: 1, clock, lean: 2, headTilt: 0, noise: 0 });   // noise 0：定格就是完全不动（原片规律 3）
const ST = hero.STAND;
const XC0 = X0 + 1.9 * HH;
const c0 = new CL.Cur({ x: XC0, form: 'ibeam', size: 0.68 * HH, blink: 'slow' });
const XLAP0 = X0 - 0.9 * HH;
hero.obj(0, 'rest', [XLAP0, -0.045 * LW, 0]);
let t;
const KC = [];
const capAt = (tk, at, keys, size = 56) => KC.push({ at: typeof at === 'function' ? at : () => at, size, keys: keys.map((l, i) => ({ label: l, t: tk + i * 0.17 })), t1: tk + 0.17 * keys.length + 0.5 });
D.shot(0, 0.01, { on: [hero, c0, [XLAP0, 0]], kind: 'full' });

// ════════════════ 复制粘贴出一排自己 ════════════════
const TSEL = 0.5;
c0.blink(TSEL - 0.3, 'solid');
D.cue(TSEL, 'select');
const capC = () => { const c = c0.topAt(TSEL); return [c[0], c[1] - 0.45 * HH]; };
capAt(TSEL + 0.3, capC, ['Ctrl', 'C']); D.cue(TSEL + 0.3, 'key'); D.cue(TSEL + 0.47, 'key');
const copies = [];
for (let i = 0; i < 4; i++) {
  const tp = TSEL + 1.0 + i * 0.28;
  if (i === 0) capAt(tp - 0.17, capC, ['Ctrl', 'V']);
  D.cue(tp, 'key', { v: 0.7 }); D.cue(tp + 0.02, 'cursor_hop', { v: 0.5 });
  const c = new CL.Cur({ x: XC0 + (i + 1) * 0.55 * HH, form: 'ibeam', size: 0.45 * HH, blink: 'irregular', show: [tp, 1e9], sfx: true });
  copies.push(c);
}
c0.blink(TSEL + 2.3, 'fast');
hero.look(TSEL + 1.2, [XC0 + 1.4 * HH, -0.4 * HH], { dur: 0.2 });
D.shot(TSEL + 0.6, 0.6, { on: [hero, c0, [XC0 + 2.4 * HH, -0.5 * HH]], kind: 'full' });

// ════════════════ 一个接一个冲过来：后仰闪 → 收腿跳 → 拍开 → 踢飞（连贯，每个隔 8 帧） ════════════════
const TA = TSEL + 2.6, GAPT = 8 * F + 0.18;
hero.move(TA - 0.3, 'guard');
const passTo = x => x - 1.6 * HH;
// 1：后仰闪
const A1 = TA, M1 = hero.move(A1 - 3 * F, 'lean_dodge');
copies[0].hops(A1 - 0.25, X0 + 0.2 * HH, { dt: 0.05 }); copies[0].hops(A1 + 0.05, passTo(X0), { dt: 0.05 });
// 2：贴地冲过来，收腿跳
const A2 = A1 + GAPT + 0.15, M2 = hero.move(A2 - 4 * F, 'tuck_jump');
copies[1].hops(A2 - 0.3, X0 + 0.1 * HH, { dt: 0.05 }); copies[1].hops(A2 + 0.02, passTo(X0) - 0.4 * HH, { dt: 0.05 });
copies[1].form(A2 - 0.35, 'under', 0.45 * HH, 0.04); copies[1].form(A2 + 0.5, 'ibeam', 0.45 * HH, 0.05);
// 3：拍开（前手横扫），它被打歪、往右上飞走
const A3 = M2.t + 0.1, M3 = hero.move(A3 - 5 * F, 'cross');
copies[2].hops(A3 - 0.3, X0 + 0.42 * HH, { dt: 0.05 });
copies[2].hit(A3 + 0.02, 1); copies[2].glide(A3 + 0.03, 0.6, X0 + 2.8 * HH, -0.2, { arc: 500, ease: 'out' });
fx.add(A3, [X0 + 0.4 * HH, -0.5 * HH], 'hit'); D.cue(A3, 'impact_light');
// 4：一脚踢飞
const A4 = A3 + GAPT, M4 = hero.move(A4 - 5 * F, 'front_kick');
copies[3].hops(A4 - 0.3, X0 + 0.5 * HH, { dt: 0.05 });
copies[3].hit(A4 + 0.02, 1); copies[3].glide(A4 + 0.03, 0.7, X0 + 4.2 * HH, -0.3, { arc: 700, ease: 'out' });
fx.add(A4, [X0 + 0.45 * HH, -0.3 * HH], 'hit'); D.cue(A4, 'impact_medium');
D.shot(TA - 0.4, 0.4, { on: [hero, c0, [passTo(X0) - 0.4 * HH, -0.3 * HH]], kind: 'full' });

// ════════════════ 抓住一个塞进电脑：两个光标一起打 jump()，二段跳 ════════════════
// 第 1 个（在他身后）又冲回来：他转身一把抓住；它在手里乱闪
const TG = M4.t + 0.6;
copies[0].hops(TG - 0.5, X0 - 0.45 * HH, { dt: 0.07 });
hero.turn(TG - 0.25, -1).reach('F', TG - 0.12, s => { const p = copies[0].posAt(s); return [p[0], p[1] - 0.25 * HH]; }, { dur: 0.12 });
const TGOT = TG + 0.05;
copies[0].blink(TGOT, 'fast');
D.cue(TGOT, 'grab');
let handF = null;                                                           // 模拟之后填：抓住以后光标跟着手
// 跪到电脑边，把它塞进电脑；电脑拿起来
const Kn = hero.kneel(TGOT + 0.35, { front: XLAP0 + 0.5 * LW + 16, head: 30, lean: 30, dur: 0.4 });
const TSTUFF = Kn.t + 0.25;
hero.reach('F', TSTUFF - 0.2, [XLAP0, -0.25 * LW], { dur: 0.15 });
D.cue(TSTUFF, 'pop_open', { v: 0.6 });
const TPICK = TSTUFF + 0.45;
hero.reach('B', TPICK - 0.15, [XLAP0 + 0.25 * LW, -0.03 * LW], { dur: 0.1 }).hand('F', TPICK - 0.15, 'world', [XLAP0 - 0.05 * LW, -0.05 * LW]);
hero.obj(TPICK, 'held', { fwd: 0.24, up: 0.05 });
const Rz = hero.rise(TPICK + 0.15, { head: 10 });
R.oneHand(hero, TPICK + 0.2);
// 代码：两个光标一起打 jump()
const CS = 45, LH = CS * 1.32;
const code = new Code({ x: XLAP0 - 0.9 * HH, y: -1.75 * HH, size: CS, seed: 31, cps: 14 });
const CB = () => [[code.x - 20, code.y - 60], [code.x + 14 * CS * 0.5, code.y + 2 * LH]];
const TJT = Rz.t + 0.25;
code.set(TJT - 0.2, '\n', 0).fadeOut(-1e9, TJT - 0.25);
code.extra(TJT - 0.2, TJT + 2.2, s => code.snap(s).text.length);
const JL = 'jump()';
for (let i = 1; i <= JL.length; i++) { const ti = TJT + i * 0.075; code.set(ti, JL.slice(0, i) + '\n' + JL.slice(0, i), i); D.cue(ti, 'key', { v: 0.6 }); R.KEYS.push(ti); }
// 光标们一起冲过来；他回车：跳一下，空中再跳一下，越过它们
const TRJ = TJT + JL.length * 0.075 + 0.25;
const XJ = hero.hipNow(TRJ)[0];
hero.turn(TRJ - 0.4, 1);
for (const [i, c] of [[1, copies[1]], [2, copies[2]], [3, copies[3]]]) c.hops(TRJ - 0.2 + i * 0.05, XJ - 0.1 * HH, { dt: 0.06 });
code.run(TRJ);
const J1 = hero.jump(TRJ + 0.1, { to: XJ - 0.1 * HH, h: 0.6 * HH, dur: 0.42, keep: true });
const J2 = hero.jump(TRJ + 0.36, { to: XJ - 1.3 * HH, h: 1.0 * HH, dur: 0.6, running: true });
R.oneHand(hero, TRJ + 0.102); R.oneHand(hero, TRJ + 0.362); R.oneHand(hero, J2.t + 0.002);
D.cue(TRJ + 0.36, 'whoosh_short', { v: 0.6 });
for (const c of copies.slice(1)) c.hops(TRJ + 0.45, XJ - 2.6 * HH, { dt: 0.05 });   // 扑了个空，冲过头
D.shot(TJT - 0.4, 0.4, { on: [hero, ...CB(), c0], kind: 'full' });
D.shot(TRJ, 0.4, { on: [hero, [XJ, -1.8 * HH], [XJ - 2.8 * HH, -0.3 * HH]], kind: 'full' });

// ════════════════ 光标们合回一个、变大 ════════════════
const TM = J2.t + 0.8, XHERO = J2.x;
const XCM = XHERO + 2.2 * HH;
c0.hops(TM - 0.3, XCM, { dt: 0.08 });
copies.forEach((c, i) => { c.glide(TM + i * 0.06, 0.35, XCM, 0, { arc: 120 }); c.fade(TM + i * 0.06 + 0.3, TM + i * 0.06 + 0.36, 1, 0); D.cue(TM + i * 0.06 + 0.35, 'cursor_hop', { v: 0.7 }); });
c0.grow(TM + 0.45, 1.0 * HH, 0.2);
hero.turn(TM - 0.2, 1).look(TM, [XCM, -0.6 * HH], { dur: 0.2 });
D.shot(TM - 0.3, 0.5, { on: [hero, [XCM, -1.1 * HH]], kind: 'full' });

// ════════════════ 三击：他脚下那段地面被删掉 → 掉进去 → 扒着边爬上来 ════════════════
const T3 = TM + 1.1;
D.cue(T3, 'click'); D.cue(T3 + 0.09, 'click'); D.cue(T3 + 0.18, 'click');
const HX0 = XHERO - 0.4 * HH, HX1 = XHERO + 0.4 * HH, TDEL = T3 + 0.4;
const holes = [{ x0: HX0, x1: HX1, t0: TDEL, dur: 0.22 }];
const selGround = (x, s) => (s >= T3 + 0.18 && s < TDEL + 0.25 && x >= HX0 && x <= HX1 ? CL.BLUE : null);
D.cue(TDEL, 'backspace_eat', { v: 0.9 });
const TFALL = TDEL + 0.12, FD = 0.3, YHANG = -ST + 0.62 * HH;
hero.path('hip', TFALL, TFALL + FD, s => { const u = (s - TFALL) / FD; return [XHERO, lerp(-ST, YHANG, u * u)]; });
hero.hip(TFALL + FD, [XHERO, YHANG]);
hero.footFree('F', TFALL, [0.06, 0.44]).footFree('B', TFALL + 0.02, [-0.04, 0.44]);
hero.obj(TFALL + 0.05, 'rest', [HX1 + 0.25 * LW, -0.045 * LW, 0]);           // 电脑掉在缺口边上
hero.hand('B', TFALL + 0.6 * FD, 'world', [HX0 + 6, -4]).hand('F', TFALL + 0.6 * FD, 'world', [HX1 - 6, -4]);   // 掉到一半手才扒住两边（之前够不着）
hero.head(TFALL, -30).sfx(TFALL + FD, 'body', { v: 0.6 });
const TCLIMB = TFALL + FD + 0.75;                                            // 扒着边：先挂一下，再撑上去
hero.path('hip', TCLIMB, TCLIMB + 0.45, s => { const u = E.inOut((s - TCLIMB) / 0.45); return [lerp(XHERO, HX1 + 0.2 * HH, u), lerp(YHANG, -ST, u) - 0.1 * HH * Math.sin(Math.PI * u)]; });
hero.lean(TCLIMB, 40, 0.2).lean(TCLIMB + 0.4, 4, 0.2);
hero.hand('F', TCLIMB, 'world', [HX1 + 10, -6]).hand('B', TCLIMB + 0.05, 'world', [HX1 + 30, -6]);
hero.hand('F', TCLIMB + 0.3, 'free', [0.05, 0.35]).hand('B', TCLIMB + 0.32, 'free', [-0.04, 0.35]);   // 撑上来就松手（人站起来手还按在身后的地上 = 隔空）
const XUP = HX1 + 0.2 * HH;
hero.foot('F', TCLIMB + 0.35, [XUP + 0.1 * HH, 0], 0.12, 10).foot('B', TCLIMB + 0.42, [XUP - 0.08 * HH, 0], 0.12, 10);
hero.hip(TCLIMB + 0.45, [XUP, -ST], 0.15);
const TGRL = TCLIMB + 0.55;
hero.reach('F', TGRL, [HX1 + 0.25 * LW - 0.05 * LW, -0.05 * LW], { dur: 0.15, back: TGRL + 0.2 });
hero.obj(TGRL + 0.15, 'held', { fwd: 0.24, up: 0.05 }); R.oneHand(hero, TGRL + 0.2); hero.lean(TGRL + 0.2, 2, 0.2);
D.shot(T3 - 0.3, 0.4, { on: [hero, c0, [XHERO, 0.7 * HH]], kind: 'full' });

// ════════════════ 被一格格逼到画面尽头 → 常亮 → 白闪 → 回忆 → 快打 for ════════════════
const TPUSH = TGRL + 0.6;
const XEDGE = XUP + 1.6 * HH;                                                // 他往右退到画面尽头
c0.hops(TPUSH, XUP - 0.2 * HH, { dt: 0.18, step: 0.28 * HH });               // 它从缺口那边跳过来（跳过缺口）
const Wb = hero.walk(TPUSH + 0.2, XEDGE, { stepDur: 0.4 });
hero.turn(TPUSH + 0.1, -1);                                                  // 面朝它往后退
c0.hops(TPUSH + 1.4, XEDGE - 1.05 * HH, { dt: k => 0.3 + 0.12 * k, step: 0.3 * HH });
const TSTARE = Wb.t + 1.2;
c0.blink(TSTARE, 'solid');
hero.lean(TSTARE + 0.1, -10, 0.1).head(TSTARE + 0.1, -10);
const TFB0 = TSTARE + 0.55, FBS = [V2.marks.TR10 - 0.3, V2.marks.TR10 + 0.55, V2.marks.TWH - 0.05], FBD = 0.6, TFB1 = TFB0 + FBS.length * FBD;
D.cue(TFB0, 'flashback_in'); D.cue(TFB1, 'flashback_out');
for (let i = 0; i < 6; i++) D.cue(TFB1 + 0.2 + i * 0.05, 'key', { v: 0.8 });
D.shot(TPUSH, 0.6, { on: [hero, c0, [XEDGE + 0.4 * HH, -0.3 * HH], [HX0 - 0.5 * HH, 0]], kind: 'wide' });
D.shot(TSTARE, 0.5, { on: [hero, c0], kind: 'medium' });
// 快打：跪下，三倍速
const Kf = hero.kneel(TFB1 + 0.05, { front: XEDGE - 0.15 * HH, head: 30, lean: 26, dur: 0 });
hero.obj(TFB1 + 0.05, 'held', { fwd: 0.4, up: -0.05 }); R.oneHand(hero, TFB1 + 0.08);
const FOR = 'for i in range(6):\n    print("#####")';
const code2 = new Code({ x: XEDGE - 1.6 * HH, y: -1.6 * HH, size: CS, seed: 33, cps: 40 });
code2.type(TFB1 + 0.15, FOR, 40);
const TRW = code2.tEnd + 0.12;
code2.run(TRW);
const CB2 = () => [[code2.x - 20, code2.y - 60], [code2.x + 19 * CS * 0.5, code2.y + 2 * LH]];
// 墙：六行 ##### 一行行砸在他和它之间
const WX = XEDGE - 0.75 * HH, CWB = 56, CHB = 62, BF = 80;
const ROWS = [];
for (let k = 0; k < 6; k++) { const t0 = TRW + 0.1 + 0.12 * k; ROWS.push({ k, t0, tl: t0 + 0.28 }); D.cue(t0 + 0.28, 'block_drop', { v: 0.7 }); }
const TWALL = ROWS[5].tl;
c0.hops(TWALL - 0.25, WX - 0.55 * HH, { dt: 0.05 });
c0.hit(TWALL, -1); D.cue(TWALL + 0.02, 'impact_heavy'); fx.add(TWALL, [WX - 0.25 * HH, -0.6 * HH], 'hit');
c0.hop(TWALL + 0.12, WX - 0.95 * HH);
D.shot(TFB1, 0.3, { on: [hero, ...CB2(), c0], kind: 'full' });
// ════════════════ 它框选删掉半截墙；他从墙后探出头 ════════════════
const TBOX = TWALL + 1.0, TBOX1 = TBOX + 0.45, TDW = TBOX1 + 0.2;
D.cue(TBOX, 'select'); D.cue(TDW, 'backspace_eat', { v: 0.9 });
const boxRect = s => { const u = E.out(clamp((s - TBOX) / (TBOX1 - TBOX))); const x0 = WX - 1.6 * CWB, y0 = -6.4 * CHB; return [x0, y0, (3.2 * CWB) * u, (3.4 * CHB) * u]; };
hero.rise(TDW + 0.6, { head: 0 });
hero.lean(TDW + 1.0, 18, 0.3).head(TDW + 1.0, -20, 0.3);                    // 从墙后探出头
c0.blink(TDW + 0.5, 'slow');
D.shot(TBOX - 0.3, 0.4, { on: [hero, c0, [WX, -7 * CHB]], kind: 'full' });
code.fadeOut(TRJ + 0.9);
code2.fadeOut(TWALL + 0.6);
const ADUR = TDW + 2.6;

// ———— 小蛇：跟在他后面（缺口打开的时候停在缺口边） ————
const kS = [];
for (let tk = -4; tk < -1; tk += 0.25) kS.push([tk, XLAP0 - 1.6 * HH - (-1 - tk) * 300, -30]);   // 预滚：一开始身子就是展开的
for (let tk = -1; tk <= ADUR; tk += 0.25) {
  let x = Math.max(hero.hipNow(Math.max(0, tk - 0.6))[0] - 1.1 * HH, XLAP0 - 1.6 * HH);
  if (tk > TDEL && x > HX0 - 0.6 * HH && x < HX1 + 0.3 * HH && tk < TCLIMB + 1.5) x = HX0 - 0.6 * HH;
  if (kS.length && x < kS[kS.length - 1][1]) x = kS[kS.length - 1][1];      // 只往前，不掉头
  kS.push([tk, x, -30]);
}
const snake = new Snake({ t0: -4, t1: ADUR, gap: GAP, max: 12, head: spline(kS, { mono: true }), size: 42, plain: true });
const ws = new CL.WordSnake({ snake, n: () => 10, size: 42 });

// ———— 模拟 ————
R.KEYS.push(...R.keyTimes(code), ...R.keyTimes(code2)); R.KEYS.sort((a, b) => a - b);
hero.simulate(ADUR, { sfx: false });
handF = s => hero.jointsAt(s).aF[2];
copies[0].pos.push({ t: TGOT, x: 0, y: 0, mode: 'hop' });                     // 抓住以后跟着手（画的时候换成手的位置）
D.codes = [code, code2];                                                    // 镜头自动把露出来的代码框进来（director.js）
D.finalize({ actors: [hero], dur: ADUR, start: { x: 0, y: -330, z: 1 } });
const DUR = D.DUR;
const offscreen = [[clock.real(TFB0), clock.real(TFB1)]];

// ———— 画面 ————
const blk = (ctx, x, y, a = 1) => PR.word(ctx, '#', x, y, 0, BF, a, [228, 228, 228]);
function drawWall(ctx, s) {
  for (const r of ROWS) {
    if (s < r.t0) continue;
    const u = clamp((s - r.t0) / (r.tl - r.t0)), y = lerp(code2.y + 2 * LH, -(r.k + 0.5) * CHB, E.in(u)), x = lerp(code2.x + 6 * CS * 0.5, WX, E.out(u));
    for (let j = 0; j < 5; j++) {
      if (r.k >= 3 && s >= TDW) { const order = (5 - r.k) * 5 + (4 - j); if (s >= TDW + order * 0.02) continue; }
      blk(ctx, x + (j - 2) * CWB, y);
    }
  }
  if (s >= TBOX && s < TDW + 0.4) { const [x0, y0, w, h] = boxRect(s); ctx.save(); ctx.fillStyle = 'rgba(38,79,160,0.45)'; ctx.strokeStyle = 'rgba(120,160,255,0.9)'; ctx.lineWidth = 3; ctx.fillRect(x0, y0, w, h); ctx.strokeRect(x0, y0, w, h); ctx.restore(); }
}
function drawCopy(ctx, c, s) {
  if (c === copies[0] && s >= TGOT && s < TSTUFF) { const h = handF(s); const p = c.pos; const saved = p.slice(); c.pos = [{ t: -1e9, x: h[0], y: h[1] + 0.2 * HH, mode: 'hop' }]; c.draw(ctx, s); c.pos = saved; return; }
  if (c === copies[0] && s >= TSTUFF) return;                                  // 塞进电脑了（之后在代码里当第二个光标）
  c.draw(ctx, s);
}
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  if (ta >= TFB0 && ta < TFB1) {                                               // 回忆 1：上一集的三个镜头
    const i = Math.min(FBS.length - 1, Math.floor((ta - TFB0) / FBD)), loc = (ta - TFB0 - i * FBD) * 0.6;
    CL.flashback(ctx, fc => V2.draw(fc, V2.clock.real(FBS[i] + loc)), 'cold', ta);
    CL.whiteFlash(ctx, ta, TFB0); CL.whiteFlash(ctx, ta, TFB1 - 2 * F);
    return;
  }
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c); ctx.translate(0, fx.joltAt(ta));
  CL.drawGround(ctx, c.x - W / 2 / c.z - 60, c.x + W / 2 / c.z + 60, ta, { holes, sel: selGround });
  if (ta >= TDEL) { ctx.save(); ctx.translate(0, 0.72 * HH); CL.drawGround(ctx, HX0 - 0.6 * HH, HX1 + 0.6 * HH, ta, { alpha: 0.12 }); ctx.restore(); }   // 下一行
  code.draw(ctx, ta); code2.draw(ctx, ta);
  drawWall(ctx, ta);
  ws.draw(ctx, ta);
  c0.draw(ctx, ta);
  for (const cp of copies) drawCopy(ctx, cp, ta);
  if (ta >= TSEL && ta < TSEL + 0.5) { const p = c0.posAt(ta), f = c0.formAt(ta); ctx.fillStyle = 'rgba(38,79,160,0.6)'; ctx.fillRect(p.x - f.size * 0.25, p.y - f.size * 1.05, f.size * 0.5, f.size * 1.1); }
  const st = hero.stateAt(ta);
  hero.draw(ctx, ta, DRAW);
  PR.laptop(ctx, st.obj[0], st.obj[1], LW, st.obj[2], 1, ta < TPICK ? -1 : st.dir);
  for (const k of KC) PR.keyCombo(ctx, ta, { ...k, at: k.at(ta) });
  fx.draw(ctx, ta);
  ctx.restore();
  const fl = fx.flashAt(ta);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
  CL.whiteFlash(ctx, ta, TFB1);
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }

module.exports = { snakes: [ws], DUR, draw, post, cam, hero, clock, codes: [code, code2], beats: [], offscreen, c0, copies,
  marks: { TSEL, TA, A3, A4, TG, TSTUFF, TRJ, TM, T3, TFALL, TCLIMB, TPUSH, TSTARE, TFB0, TFB1, TRW, TWALL, TBOX, ADUR } };
