// 《火柴人 VS 光标》第 1 段（SCENE=cur1）：冷开场 + 第一幕（剧本 stickman/剧本/火柴人VS光标_剧本.md）
//   接上一集走进来 → Alt+点击多出一个光标 → 两个光标一起打字（hi5、跳两次）→ 它停止闪烁 → 跳出代码落到地上 → 站起来 |
//   → 单击删 5、双击删掉一整节 → 他拎起小蛇护在身后 → Esc / Ctrl+C 都没用 → 蓄力 → 鼠标箭头把电脑拖走
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E } = K;
const { Actor2 } = require('./fight');
const { Director } = require('./director');
const { Code } = require('./code');
const { Snake, spline } = require('./snake');
const PR = require('./props');
const CL = require('./cursorlib');

const DRAW = { step: 'auto', smear: false, turn: 0.4 };                    // 一拍一 / 一拍二出画、身上不画拖影、转身压扁一张（研究/动作逐帧_四集.md）
const HH = 300, LW = CL.LW, GAP = 80;                                   // 节距要比 hi5 宽，不然挤在一起
const D = new Director(), clock = D.clock, cam = D.cam;
const R = CL.keyRig();
const hero = new Actor2({ H: HH, x0: -1500, dir: 1, clock, lean: 2, headTilt: 0, noise: 0 });   // noise 0：定格就是完全不动（原片规律 3）
const ST = hero.STAND;
let t;

// ———— 布局：他停在 XH；小蛇在他前面（右边）；代码在左上 ————
const XH = 0, CS = 45, LH = CS * 1.32, CX = -560, CY = -2.05 * HH;
const TAME = 'n = 0\nwhile n < 3:\n    print("hi")\n    n = n + 1';
const code = new Code({ x: CX, y: CY, size: CS, seed: 11, cps: 13 });
const CB = () => [[CX - 20, CY - 60], [CX + 15 * CS * 0.5, CY + 6 * LH]];   // 代码块的范围（给镜头）

// ════════════════ 0:00 接上一集 ════════════════
hero.obj(0, 'held', { fwd: 0.18, up: 0.06 }).hand('B', 0, 'obj', CL.GRIP_UNDER);
hero.hand('F', 0, 'free', s => [0.05 + 0.08 * Math.sin(s * 8), 0.35]);
const W1 = hero.walk(0, XH, { stepDur: 0.36 });
const TS = W1.t;
hero.hand('F', TS, 'free', [0.05, 0.35]);
D.shot(0, 0.01, { on: [[-600, -200]], kind: 'wide', z: 0.3 });
const kS = [];
for (let tk = 0; tk <= TS; tk += 0.1) kS.push([tk, hero.hipNow(tk)[0] + 0.95 * HH, -30]);
const XS1 = 400;                                                            // 停下后小蛇再往前游一点
kS.push([TS + 0.6, XS1 - 60, -30], [TS + 1.2, XS1, -30]);

// ════════════════ 0:04 上一集的代码还在；选中 3，手一滑 Alt + 点击：多出一个光标 ════════════════
code.set(-1, TAME, TAME.length).fadeOut(-1e9, TS + 0.1);
R.oneHand(hero, TS + 0.1);
hero.look(TS + 0.15, [CX + 200, CY + LH], { dur: 0.2 });
D.shot(TS - 0.5, 1.2, { on: [hero, ...CB(), [XS1 + 60, -40]], kind: 'full' });
const I3 = TAME.indexOf('3'), IQ = TAME.indexOf('"hi"') + 3;                  // 第二个光标插在 "hi 和 " 之间
code.select(TS + 0.5, I3, I3 + 1);
const TALT = TS + 0.85;
R.KEYS.push(TALT - 0.1, TALT);
const KC = [{ at: () => [XH - 0.1 * HH, -1.25 * HH], size: 52, keys: [{ label: 'Alt', t: TALT - 0.1 }, { label: '点击', t: TALT }], t1: TALT + 0.7 }];
D.cue(TALT - 0.1, 'key'); D.cue(TALT, 'click');
// 第二个光标在代码里的位置（字符偏移）：先在 "hi 后面，后来跳到最后一行
let off2 = () => IQ;
// ———— 两个光标一起打 5 ————
const T5 = TALT + 0.7;
const TXT5 = TAME.slice(0, I3) + '5' + TAME.slice(I3 + 1, IQ) + '5' + TAME.slice(IQ);   // while n < 5 ... print("hi5")
code.set(T5, TXT5, I3 + 1); D.cue(T5, 'key'); R.KEYS.push(T5);
const TR1 = T5 + 0.45;
code.run(TR1);
hero.look(T5 + 0.1, [CX + 220, CY + 2 * LH], { dur: 0.15 });
// 运行：小蛇往前游两节，新的两节（在最前面）写着 hi5；两个 hi5 从 print 那一行飞过去
const OUTP = [CX + 9 * CS * 0.5, CY + 2 * LH + 15];
const TGROW0 = TR1 + 0.1, TGROW1 = TR1 + 0.7, XS2 = XS1 + 2 * GAP;
kS.push([TGROW0, XS1, -30], [TGROW1, XS2, -30]);
const flyers = [];
flyers.push({ t0: TR1 + 0.05, t1: TGROW1 - 0.1, from: OUTP, to: s => segXY(s, 1), str: 'hi5' }, { t0: TR1 + 0.15, t1: TGROW1, from: OUTP, to: s => segXY(s, 0), str: 'hi5' });
D.cue(TR1 + 0.05, 'output', { v: 0.6 }); D.cue(TR1 + 0.15, 'output', { v: 0.6 });
hero.look(TR1 + 0.2, [XS2 - 2 * GAP, -40], { dur: 0.25 });
const TTILT = TGROW1 + 0.3;                                                 // 他歪头，小蛇也歪头
hero.head(TTILT, 26, 0.12).head(TTILT + 0.6, 6, 0.2);

// ════════════════ 0:11 两个光标一起打 jump()：他跳两次 ════════════════
const TJ0 = TTILT + 0.9;
code.set(TJ0, TXT5, TXT5.length);                                           // 他把光标挪到最后
const TJH = TJ0 + 0.25;                                                     // 第二个光标也跳到最后（看得见它跳了一下）
code.set(TJH + 0.15, TXT5 + '\n\n', TXT5.length + 1); D.cue(TJH + 0.15, 'key_enter'); R.KEYS.push(TJH + 0.15);
const JL = 'jump()';
for (let i = 1; i <= JL.length; i++) { const ti = TJH + 0.25 + i * 0.075; code.set(ti, TXT5 + '\n' + JL.slice(0, i) + '\n' + JL.slice(0, i), TXT5.length + 1 + i); D.cue(ti, 'key', { v: 0.6 }); R.KEYS.push(ti); }
const TXTJ = TXT5 + '\njump()\njump()';
const TRJ = TJH + 0.25 + JL.length * 0.075 + 0.35;
code.run(TRJ);
const J1 = hero.jump(TRJ + 0.15, { to: XH + 0.05 * HH, h: 0.42 * HH, dur: 0.48 });
R.oneHand(hero, TRJ + 0.152); R.oneHand(hero, J1.t + 0.002);
const J2 = hero.jump(J1.t + 0.03, { to: XH + 0.25 * HH, h: 0.32 * HH, dur: 0.42, running: true });   // 第二次：没准备好就被弹起来
R.oneHand(hero, J1.t + 0.032);
{ const tl = J2.t, x = XH + 0.25 * HH;                                      // 落地踉跄
  hero.lean(tl, 18).foot('F', tl + 0.08, [x + 0.22 * HH, 0], 0.14, 10).hip(tl + 0.08, [x + 0.12 * HH, -ST + 0.06 * HH], 0.2).lean(tl + 0.25, -8, 0.15).lean(tl + 0.45, 2, 0.2).hip(tl + 0.45, [x + 0.1 * HH, -ST], 0.2);
  hero.foot('B', tl + 0.3, [x + 0.02 * HH, 0], 0.14, 10); R.oneHand(hero, tl + 0.5); }
const XA = XH + 0.35 * HH;
D.shot(TRJ - 0.1, 0.3, { on: [hero, [XA, -1.5 * HH], ...CB()], kind: 'full' });

// ════════════════ 0:14 他看见那个多出来的光标；凑近，它跳开 ════════════════
const TSEE = J2.t + 0.7;
off2 = s => s < TJH ? IQ : s < TSEE + 0.75 ? TXTJ.length : s < TSEE + 1.15 ? TXTJ.length - 9 : TXTJ.length;
code.extra(TALT, 1e9, s => off2(s), s => s >= TSEE + 1.6 && s < TOUT ? true : CL.Cur.prototype.on.call({ modeAt: () => 'irregular' }, s));
hero.look(TSEE, [CX + 3 * CS * 0.5, CY + 5 * LH], { dur: 0.15 });
hero.lean(TSEE + 0.3, 16, 0.2).head(TSEE + 0.3, -34, 0.2);
hero.look(TSEE + 0.8, [CX + 6 * CS * 0.5, CY + 4 * LH], { dur: 0.08 }); hero.look(TSEE + 1.2, [CX + 3 * CS * 0.5, CY + 5 * LH], { dur: 0.08 });
D.cue(TSEE + 0.75, 'cursor_hop', { v: 0.4 }); D.cue(TSEE + 1.15, 'cursor_hop', { v: 0.4 });
D.shot(TSEE - 0.2, 0.4, { on: [hero, ...CB()], kind: 'medium' });
// ———— 0:17 它停止闪烁（盯住，全静）→ 跳出代码，飞过他头顶落在右边地上 ————
const TST = TSEE + 1.6, TOUT = TST + 0.55;
D.cue(TST, 'cursor_stare', { v: 0.8 });
hero.lean(TST, 6, 0.3);
const P0 = code.charAt(TOUT, TXTJ.length);
const cur = new CL.Cur({ x: P0[0], y: P0[1] + 10, size: 0.15 * HH * 0.6, show: [TOUT, 1e9], blink: 'solid' });
const XL = XS2 + 1.4 * HH;
cur.grow(TOUT, 0.15 * HH, 0.3);
cur.glide(TOUT, 0.75, XL, 0, { arc: 380, ease: 'inOut' });
D.cue(TOUT, 'whoosh_short', { v: 0.4 }); D.cue(TOUT + 0.75, 'cursor_hop', { v: 0.8 });
cur.blink(TOUT + 0.8, 'irregular');
hero.look(TOUT + 0.1, [CX + 300, CY], { dur: 0.1 }); hero.look(TOUT + 0.4, [XH + 0.6 * HH, -1.6 * HH], { dur: 0.15 }); hero.look(TOUT + 0.75, [XL, -20], { dur: 0.2 });
D.shot(TOUT + 0.05, 0.6, { on: [hero, [XL + 0.3 * HH, -0.2 * HH], [XS2 - 5 * GAP, -40], ...CB()], kind: 'full' });
// ———— 0:20 站起来 |，一格一格跳向小蛇 ————
const TSTAND = TOUT + 1.3;
cur.form(TSTAND, 'ibeam', 0.55 * HH, 0.06);
const XC1 = XS2 + 0.45 * HH;
const TH1 = cur.hops(TSTAND + 0.5, XC1, { dt: k => 0.22 + 0.08 * k });
// ———— 0:23 单击：删掉最前面那节的 5；双击：删掉一整节 ————
const TCL = TH1 + 0.35, TDEL1 = TCL + 0.3;
D.cue(TCL, 'click'); D.cue(TDEL1, 'backspace_eat', { v: 0.6 });
cur.grow(TDEL1 + 0.05, 0.6 * HH);
const TDBL = TDEL1 + 0.75, TDEL2 = TDBL + 0.3;
D.cue(TDBL, 'click'); D.cue(TDBL + 0.09, 'click'); D.cue(TDEL2, 'backspace_eat', { v: 0.9 }); D.cue(TDEL2 + 0.05, 'roar_small', { v: 0.9 });
cur.grow(TDEL2 + 0.15, 0.68 * HH);
hero.look(TCL - 0.2, [XS2, -40], { dur: 0.15 });
// ———— 先演反应：往后一弹 ————
const TSTA = TDEL2 + 0.12, XB0 = hero.hipNow(TSTA)[0];
hero.lean(TSTA, -30, 0.06, 'out3').head(TSTA, -24).hip(TSTA, [XB0 - 0.12 * HH, -ST + 0.04 * HH], 0.08, 'out3');
hero.foot('B', TSTA + 0.03, [XB0 - 0.32 * HH, 0], 0.12, 10, 'out3', false);
hero.hand('F', TSTA, 'local', [0.12, -0.16]);
hero.lean(TSTA + 0.35, 4, 0.15).head(TSTA + 0.35, 0, 0.15);
// ———— 冲过去一把拎起小蛇，退回来放在身后 ————
const TRUN = TSTA + 0.5, XGRAB = XS2 - 2.4 * GAP - 0.12 * HH;
const Wg = hero.walk(TRUN, XGRAB, { stepDur: 0.22 });
const TGRAB = Wg.t - 0.05;
hero.reach('F', TGRAB - 0.15, s => segXY(s, 2), { dur: 0.12, at: [XGRAB + 0.31 * HH, -26] });
const THANG = TGRAB + 0.05;                                                 // 小蛇挂在他手上
hero.hand('F', THANG, 'local', [0.24, -0.18]).lean(THANG + 0.05, -6, 0.2);
D.cue(THANG, 'rustle', { v: 0.8 }); D.cue(THANG + 0.05, 'roar_small', { v: 0.6 });
const XBACK = XH - 0.6 * HH;
const Wb = hero.walk(THANG + 0.1, XBACK, { stepDur: 0.24 });
const TSET = Wb.t + 0.05, SNAKE_REST = k => [XBACK - 0.35 * HH - k * GAP, -30];   // 放在他身后（左边）的地上
hero.turn(TSET - 0.3, -1).reach('F', TSET - 0.25, [XBACK - 0.3 * HH, -0.25 * HH], { dur: 0.2, back: TSET + 0.25 });
hero.lean(TSET + 0.25, 2, 0.15).turn(TSET + 0.42, 1);                       // 先直起身再转回来（弯着腰转身 = 头一帧甩过去）
R.oneHand(hero, TSET + 0.3);
D.shot(TDEL2 + 0.1, 0.4, { on: [hero, cur, [XS2 - 5 * GAP, -40]], kind: 'full' });

// ════════════════ 0:30 Esc —— 它打 no；Ctrl+C —— 它学他 ^C ^C ^C ════════════════
const TESC = TSET + 0.7;
R.KEYS.push(TESC); D.cue(TESC, 'key', { v: 1 });
KC.push({ at: () => { const o = hero.stateAt(TESC).obj; return [o[0], o[1] - 0.42 * HH]; }, size: 56, keys: [{ label: 'Esc', t: TESC }], t1: TESC + 0.6 });
cur.say(TESC + 0.45, 'no');
hero.look(TESC + 0.45, [XC1, -0.8 * HH], { dur: 0.15 });
const TCC = TESC + 1.5;
R.KEYS.push(TCC - 0.2, TCC); D.cue(TCC - 0.2, 'key'); D.cue(TCC, 'key');
KC.push({ at: () => { const o = hero.stateAt(TCC).obj; return [o[0], o[1] - 0.42 * HH]; }, size: 56, keys: [{ label: 'Ctrl', t: TCC - 0.2 }, { label: 'C', t: TCC }], t1: TCC + 0.6 });
cur.say(TCC + 0.45, '^C ^C ^C', { cps: 10 });
D.shot(TESC - 0.4, 0.4, { on: [hero, cur], kind: 'full' });

// ════════════════ 0:35 蓄力 → 鼠标箭头把电脑拖走 ════════════════
const TSP0 = TCC + 1.9, TSP1 = TSP0 + 0.8;
cur.blink(TSP0 - 0.4, 'solid'); cur.spin(TSP0, TSP1); cur.blink(TSP1 + 0.2, 'fast');
const TARR = TSP1 + 0.05, TPRESS = TARR + 0.3, TDRAG1 = TPRESS + 0.75, XDROP = XL + 2.2 * HH;
let LAP0 = [XBACK + 0.24 * HH, -ST - 0.05 * HH];                           // 箭头按住时电脑的位置（先估一个，预演后换成实际的）
const lapPath = s => { const u = E.inOut(clamp((s - TPRESS) / (TDRAG1 - TPRESS))); return [lerp(LAP0[0], XDROP, u), lerp(LAP0[1], -0.045 * LW, u) - 260 * Math.sin(Math.PI * u), 0]; };
hero.obj(TPRESS, 'rest', s => lapPath(s));
hero.hand('B', TPRESS + 0.02, 'local', [0.18, 0.02]).hand('F', TPRESS + 0.02, 'local', [0.2, -0.02]);
hero.hand('B', TPRESS + 0.35, 'free', [-0.04, 0.35]).hand('F', TPRESS + 0.35, 'local', [0.18, 0.05]);
D.cue(TPRESS, 'click', { v: 1 }); D.cue(TPRESS + 0.05, 'drag', { dur: TDRAG1 - TPRESS }); D.cue(TDRAG1, 'laptop_drop', { v: 0.6 });
const TLOOK3 = TDRAG1 + 0.4;                                                // 看空手 → 看电脑 → 看它
hero.look(TLOOK3, [XBACK + 0.2 * HH, -0.3 * HH], { dur: 0.1, tilt: 10 }).valueOf();
hero.head(TLOOK3, 30, 0.1);
hero.look(TLOOK3 + 0.55, [XDROP, -20], { dur: 0.08 });
hero.look(TLOOK3 + 1.05, [XC1, -0.6 * HH], { dur: 0.08 });
cur.blink(TLOOK3 + 1.0, 'slow');
D.shot(TSP0 - 0.3, 0.5, { on: [hero, cur, [XDROP + 0.3 * HH, -0.3 * HH]], kind: 'wide' });
D.shot(TLOOK3 + 0.9, 0.5, { on: [hero, cur], kind: 'full' });
code.fadeOut(TOUT + 0.6);                                                    // 它离开代码以后代码退场（动作段代码不常驻）
const ADUR = TLOOK3 + 2.4;

// ———— 小蛇 ————
kS.sort((a, b) => a[0] - b[0]);
const snake = new Snake({ t0: 0, t1: ADUR, gap: GAP, max: 8, head: spline(kS, { mono: true }), size: 46, plain: true,
  bob: s => (s > TTILT && s < TTILT + 0.7 ? [0, -10 * Math.sin(Math.PI * (s - TTILT) / 0.7)] : [0, 0]), wig: s => (s > TGROW1 && s < TGROW1 + 0.8 ? 16 : 8) });
const segTrail = (s, k) => { const g = snake.segs(s); const q = g[Math.min(k, g.length - 1)]; return q ? [q.x, q.y, q.rot] : [XS1, -30, 0]; };
// 节的编号从蛇头数起；长两节之后最前面两节是 hi5；单击删掉第 0 节的 5，双击删掉第 0 节
const nAt = s => (s < TGROW0 ? 3 : 5);
const wordAt = (k, s) => {
  if (s >= TGROW0 && k < 2) {
    if (k === 0 && s >= TDEL2) return CL.eat('hi', TDEL2, s, 0.06);
    if (k === 0 && s >= TDEL1) return 'hi';
    if (k === 0) return CL.eat('hi5', TDEL1, s, 0.06) || 'hi5';
    return 'hi5';
  }
  return 'hi';
};
const hlAt = (k, s) => (k === 0 && s >= TCL && s < TDEL1 + 0.06 ? CL.BLUE : k === 0 && s >= TDBL && s < TDEL2 + 0.12 ? CL.BLUE : null);
let handAt = null;
function segXY(s, k) {                                                      // 每一节此刻在哪：游 → 挂在手上 → 放在地上
  if (s >= TSET) { const p = SNAKE_REST(k); return [p[0], p[1], 0]; }
  if (s >= THANG && handAt) { const h = handAt(s), sw = 0.25 * Math.sin((s - THANG) * 7) * Math.exp(-(s - THANG) * 1.5); return [h[0] + Math.sin(sw) * (k - 0.5) * GAP * 0.8, h[1] + 30 + (k - 1) * GAP * 0.78, Math.PI / 2 + sw]; }
  return segTrail(s, k);
}

// ———— 模拟 ————
R.KEYS.push(...R.keyTimes(code)); R.KEYS.sort((a, b) => a - b);
hero.simulate(ADUR, { sfx: false });
handAt = s => hero.jointsAt(s).aF[2];
LAP0 = hero.stateAt(TPRESS - 0.01).obj;
D.codes = [code];                                                    // 镜头自动把露出来的代码框进来（director.js）
D.finalize({ actors: [hero], dur: ADUR, start: { x: -600, y: -200, z: 0.3 } });
const DUR = D.DUR;

// ———— 画面 ————
function drawSnake(ctx, s) {
  const n = nAt(s);
  for (let k = n - 1; k >= 0; k--) {
    const w = wordAt(k, s); if (!w) continue;
    const [x, y, r0] = segXY(s, k); let r = r0; if (Math.cos(r) < -0.01 && s < THANG) r += Math.PI;
    const c = hlAt(k, s);
    if (c) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = K.rgba(c, 0.9); ctx.fillRect(-50, -26, 100, 52); ctx.restore(); }
    // 单击时只选中那个 5
    if (k === 0 && s >= TCL && s < TDEL1 + 0.06 && s >= TGROW0) { ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = '#000'; ctx.fillRect(-50, -26, 66, 52); ctx.restore(); }
    PR.word(ctx, w, x, y, r, 42);
  }
}
function drawFlyers(ctx, s) {
  for (const f of flyers) { if (s < f.t0 || s >= f.t1) continue; const u = clamp((s - f.t0) / (f.t1 - f.t0)), e = E.inOut(u), b = f.to(s); PR.word(ctx, f.str, lerp(f.from[0], b[0], e), lerp(f.from[1], b[1], e) - 120 * Math.sin(Math.PI * u), 0, 46); }
}
function drawArrow(ctx, s) {
  if (s < TARR || s > TDRAG1 + 0.5) return;
  let x, y, sc = 1;
  if (s < TPRESS) { const u = E.out(clamp((s - TARR) / (TPRESS - TARR))); x = lerp(XDROP + 400, LAP0[0], u); y = lerp(-1200, LAP0[1] - 10, u); }
  else if (s < TDRAG1) { const p = lapPath(s); x = p[0]; y = p[1] - 10; sc = 0.9; }
  else { const u = E.in(clamp((s - TDRAG1) / 0.5)); x = XDROP + 300 * u; y = -0.045 * LW - 10 - 1100 * u; }
  ctx.save(); ctx.translate(x, y); ctx.scale(1.3 * sc, 1.3 * sc); ctx.fillStyle = '#f5f5f5'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 70); ctx.lineTo(17, 54); ctx.lineTo(30, 82); ctx.lineTo(40, 77); ctx.lineTo(27, 50); ctx.lineTo(50, 50); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
}
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  CL.drawGround(ctx, c.x - W / 2 / c.z - 60, c.x + W / 2 / c.z + 60, ta);
  code.draw(ctx, ta);
  drawSnake(ctx, ta);
  cur.draw(ctx, ta);
  const s = hero.stateAt(ta);
  hero.draw(ctx, ta, DRAW);
  PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, ta >= TPRESS ? -1 : s.dir);
  drawFlyers(ctx, ta);
  drawArrow(ctx, ta);
  for (const k of KC) PR.keyCombo(ctx, ta, { ...k, at: k.at(ta) });
  ctx.restore();
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }

module.exports = { DUR, draw, post, cam, hero, clock, codes: [code], beats: [], cur,
  end: { heroX: hero.hipNow(ADUR)[0], laptop: [XDROP, -0.045 * LW], cur: cur.posAt(ADUR), curSize: cur.formAt(ADUR).size, snake: [0, 1, 2].map(k => SNAKE_REST(k)) },
  marks: { TS, TALT, T5, TR1, TRJ, TSEE, TST, TOUT, TSTAND, TCL, TDBL, TSTA, TGRAB, TSET, TESC, TCC, TSP0, TPRESS, ADUR } };
