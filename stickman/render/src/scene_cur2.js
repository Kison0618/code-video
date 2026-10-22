// 《火柴人 VS 光标》第 2 段（SCENE=cur2）：回合 1（剧本 火柴人VS光标_剧本.md）
//   它打出 BOOM，四个大字母砸下来：他跳过 B、扑过 O、M 砸在电脑边上把电脑翘回他面前 → 趴着打 n < 10
//   → 十节小蛇扑上去抽它两下 → Ctrl+F 全世界的 hi 亮黄 → Ctrl+H hi→bye，小蛇自己走了 → 他把 bye 换回 hi，小蛇跳回来
//   → 它在 jump 下画红波浪线、改成 jmup（他没看见）→ 蓄力冲过来，他回车 jmup() → NameError，被撞飞 → hahaha 掉在他身上
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E } = K;
const { Actor2, FightFX } = require('./fight');
const { Director } = require('./director');
const { Code } = require('./code');
const { Body } = require('./phys');
const { Snake, spline } = require('./snake');
const PR = require('./props');
const CL = require('./cursorlib');

const DRAW = { step: 'auto', smear: false, turn: 0.4 };                    // 一拍一 / 一拍二出画、身上不画拖影、转身压扁一张（研究/动作逐帧_四集.md）
const HH = 300, LW = CL.LW, GAP = 80, F = 1 / 24;
const D = new Director(), clock = D.clock, cam = D.cam;
const R = CL.keyRig();
const fx = new FightFX(HH);
// 接第 1 段的结尾：他在 X0 空着手；电脑在远处；它（站着的 |）在中间；小蛇在他身后
const X0 = -180, XLAP = 1640, XCUR = 695;
const hero = new Actor2({ H: HH, x0: X0, dir: 1, clock, lean: 2, headTilt: 0, noise: 0 });   // noise 0：定格就是完全不动（原片规律 3）
const ST = hero.STAND;
const cur = new CL.Cur({ x: XCUR, y: 0, form: 'ibeam', size: 0.68 * HH, blink: 'slow' });
let t;

// ════════════════ BOOM ════════════════
cur.blink(0.2, 'fast');
cur.say(0.25, 'BOOM', { cps: 9, dur: 0.15, size: 0.13 * HH });
D.cue(0.25, 'caps_lock', { v: 0.6 });
// 四个大字母：先从它头顶飞上天，再一个个砸下来（落地留下当地形）
const LET = [];
const letter = (ch, x, tl) => { LET.push({ ch, x, tl }); D.cue(tl, 'thud', { v: 0.9 }); D.cue(tl - 0.35, 'whoosh', { v: 0.4 }); };
const BIG = 0.5 * HH, TUP = 0.75;
// 跑 → B 砸在他面前 → 跳过 B
const Ra = hero.run(0.5, X0 + 1.0 * HH, { speed: 3.4 * HH, stop: true, ramp: 0.25 });
const XB = Ra.x + 0.5 * HH;
letter('B', XB, Ra.t + 0.04);                                                // 他刚刹住 1 帧，B 就砸在他鼻子前面
hero.lean(Ra.t, -16, 0.06).head(Ra.t, -24).lean(Ra.t + 0.25, 4, 0.1);
const J1 = hero.jump(Ra.t + 0.42, { to: XB + 0.75 * HH, h: 0.85 * HH, dur: 0.6 });
hero.footFree('F', Ra.t + 0.5, [0.16, 0.2]).footFree('B', Ra.t + 0.52, [0.04, 0.24]);
hero.foot('F', J1.t, [XB + 0.83 * HH, 0], 0.08, 0, 'out3', { v: 1 }).foot('B', J1.t, [XB + 0.67 * HH, 0], 0.09, 0, 'out3', false);
// 落地马上往前扑（O 砸在他刚离开的地方）
const TDIVE = J1.t + 0.06;
const Dv = hero.move(TDIVE, 'dive');
letter('O', XB + 0.75 * HH, TDIVE + 0.2);
cur.hop(TDIVE - 0.05, XCUR + 2.6 * HH);                                       // 它往后跳开，让他扑空
const XPRONE = Dv.x;
hero.hand('B', Dv.t - 0.1, 'world', [XPRONE + 0.33 * HH, -5]);               // 趴着：后手撑在胸前地上（不写会垂到地底下）
letter('O', XPRONE + 0.95 * HH, Dv.t + 0.15);                                 // 第二个 O 砸在他头前面
letter('M', XLAP - 0.2 * LW, Dv.t + 0.55);                                    // M 砸在电脑边上——电脑被翘起来，飞回他面前
const TLAP = Dv.t + 0.57, XLAP2 = XPRONE + 1.1 * HH;                    // 名义落点：物理里有弹跳和滑动，实际停在他头前面 ~0.55H（底座在他下巴底下，手够得着键盘）
const lapBody = new Body({ t0: TLAP, x: XLAP, y: -0.05 * LW, vx: (XLAP2 - XLAP) / 0.85, vy: -1450, vrot: -7, r: 0.05 * LW, bounce: 0.15, friction: 0.4, sfx: 'laptop_drop', defer: true });
hero.obj(0, 'rest', [XLAP, -0.045 * LW, 0]);
hero.obj(TLAP, 'rest', s => lapBody.at(s));
hero.look(TLAP - 0.2, [XLAP, -0.3 * HH], { dur: 0.1 });
D.shot(0, 0.01, { on: [hero, cur], kind: 'full' });
D.shot(0.5, 1.2, { on: [hero, [XB + 2.5 * HH, -0.4 * HH]], kind: 'full' });
D.shot(TDIVE, 0.6, { on: [hero, [XLAP + 0.2 * HH, -0.3 * HH], cur], kind: 'wide' });

// ════════════════ 趴着打 n < 10 ════════════════
const TTYPE = TLAP + 1.35;
const CS = 45, LH = CS * 1.32;
const CODE0 = 'n = 0\nwhile n < 5:\n    print("hi5")\n    n = n + 1\njump()\njump()';
const code = new Code({ x: XPRONE - 0.6 * HH, y: -2.0 * HH, size: CS, seed: 21, cps: 14 });
code.set(-1, CODE0, CODE0.length);
hero.hand('F', TTYPE - 0.25, 'world', s => { const p = lapBody.at(s); return [p[0] - 0.12 * LW, p[1] - 0.06 * LW]; });
const I5 = CODE0.indexOf('5');
code.select(TTYPE, I5, I5 + 1).type(TTYPE + 0.15, '10', 10);
const TR1 = code.tEnd + 0.2;
code.run(TR1);
const CB = () => [[code.x - 20, code.y - 60], [code.x + 16 * CS * 0.5, code.y + 6 * LH]];
D.shot(TTYPE - 0.4, 0.5, { on: [hero, ...CB()], kind: 'full' });

// ════════════════ 小蛇：一直跟在他后面；长到十节，扑上去抽它两下 ════════════════
const kS = [];
const followX = s => hero.hipNow(s)[0] - 1.0 * HH;
const bumpY = x => { for (const L of LET) if (Math.abs(x - L.x) < 0.3 * HH) return -BIG * 1.05; return 0; };
for (let tk = -1.5; tk <= TR1; tk += 0.1) { const x = tk < 0 ? X0 - 1.0 * HH + tk * 200 : Math.max(followX(tk), X0 - 1.0 * HH); kS.push([tk, x, -30 + bumpY(x) * (tk > 1.5 ? 1 : 0)]); }
const TGROW = TR1 + 0.15;
const XSN = kS[kS.length - 1][1];
kS.push([TGROW + 0.6, XSN + 0.3 * HH, -30]);
const TUPH = TGROW + 0.9;                                                     // 他撑起来、指着它
const U1 = hero.getUp(TUPH, { from: 'front', speed: 1.7 });
R.oneHand(hero, U1.t - 0.1);
hero.obj(U1.t - 0.1, 'held', { fwd: 0.24, up: 0.05 });
const CURX2 = XCUR + 2.6 * HH;
// 两下扑击：从他身后拱过他头顶扑过去，抽中后从下面绕回来（不折返）
const TS1 = U1.t + 0.35, TS2 = TS1 + 1.0;
const HIT1 = [CURX2 - 0.1 * HH, -0.55 * HH], HIT2 = [CURX2 - 0.05 * HH, -0.3 * HH];
const XH1 = hero.hipNow(U1.t)[0];
kS.push([TS1 - 0.35, XH1 - 0.2 * HH, -0.9 * HH], [TS1 - 0.18, XH1 + 0.5 * HH, -1.45 * HH], [TS1, HIT1[0], HIT1[1]], [TS1 + 0.25, HIT1[0] + 0.3 * HH, -0.15 * HH],
  [TS1 + 0.6, XH1 + 0.9 * HH, -40], [TS2 - 0.25, XH1 + 1.2 * HH, -0.6 * HH], [TS2, HIT2[0], HIT2[1]], [TS2 + 0.3, HIT2[0] + 0.5 * HH, -40],
  [TS2 + 1.3, HIT2[0] + 3.0 * HH, -30]);                                      // 抽完往前游，身子拉直躺在他和它之间（Ctrl+F 时整条看得清）
for (const [ts, p, dir] of [[TS1, HIT1, 1], [TS2, HIT2, 1]]) { cur.hit(ts, dir); fx.add(ts, p, 'hit'); D.cue(ts, 'impact_medium'); D.cue(ts - 0.1, 'whoosh', { v: 0.5 }); }
hero.hand('F', TS1 - 0.4, 'local', [0.3, -0.1]).hand('F', TS1 + 0.3, 'obj', R.keyPoint);   // 指着它："上！"
D.shot(TS1 - 0.6, 0.5, { on: [hero, cur, [HIT1[0], -1.5 * HH], ...CB()], kind: 'full' });

// ════════════════ Ctrl+F 搜 hi → Ctrl+H hi→bye：小蛇自己走了 ════════════════
const TF = TS2 + 1.1, TH = TF + 1.3;
const KC = [];
const capAbove = (tk, keys) => KC.push({ at: () => { const c = cur.topAt(tk); return [c[0], c[1] - 0.5 * HH]; }, size: 58, keys: keys.map((l, i) => ({ label: l, t: tk + i * 0.18 })), t1: tk + 0.9 });
cur.blink(TF - 0.6, 'solid');
capAbove(TF, ['Ctrl', 'F']); D.cue(TF, 'key'); D.cue(TF + 0.18, 'key'); D.cue(TF + 0.4, 'find_hit');
capAbove(TH, ['Ctrl', 'H']); D.cue(TH, 'key'); D.cue(TH + 0.18, 'key');
const TREP = TH + 0.45;                                                       // 一节一节翻成 bye（从头往尾）
for (let k = 0; k < 10; k++) D.cue(TREP + k * 0.06, 'replace', { v: 0.4 });
hero.look(TF + 0.4, [XH1 + 1.5 * HH, -40], { dur: 0.15 });
const TLEAVE = TREP + 0.9;                                                    // 小蛇往右游走，出画
kS.push([TLEAVE, HIT2[0] + 3.4 * HH, -30], [TLEAVE + 2.4, HIT2[0] + 11 * HH, -30]);
hero.hand('F', TLEAVE + 0.2, 'local', [0.32, -0.05]).lean(TLEAVE + 0.2, 14, 0.2);   // 伸手："别走！"
D.shot(TF - 0.3, 0.5, { on: [hero, cur, [XH1 + 2.5 * HH, -40]], kind: 'full' });
// ———— 他把 bye 换回 hi：小蛇从右边拱成一道弧跳回来 ————
const THB = TLEAVE + 1.3;
R.oneHand(hero, THB - 0.3).lean(THB - 0.3, 4, 0.2);
R.KEYS.push(THB, THB + 0.18); D.cue(THB, 'key'); D.cue(THB + 0.18, 'key');
KC.push({ at: () => { const o = hero.stateAt(THB).obj; return [o[0], o[1] - 0.42 * HH]; }, size: 56, keys: [{ label: 'Ctrl', t: THB }, { label: 'H', t: THB + 0.18 }], t1: THB + 0.8 });
const TBACK = THB + 0.55;
for (let k = 0; k < 10; k++) D.cue(TBACK + k * 0.05, 'replace', { v: 0.4 });
const XH2 = hero.hipNow(THB)[0];
kS.push([TBACK + 0.4, HIT2[0] + 11.6 * HH, -1.6 * HH], [TBACK + 1.3, XH2 + 2.2 * HH, -1.2 * HH], [TBACK + 1.75, XH2 + 0.9 * HH, -30], [TBACK + 2.3, XH2 - 1.6 * HH, -30]);
const TCATCH = TBACK + 1.8;                                                    // 小蛇扑回来，从他脚边绕到身后
hero.look(TBACK + 0.6, [XH2 + 3 * HH, -1.2 * HH], { dur: 0.2 });
hero.look(TCATCH, [XH2 - 0.5 * HH, -0.2 * HH], { dur: 0.2 });
D.cue(TCATCH, 'roar_small', { v: 0.5 });
D.shot(THB - 0.4, 0.4, { on: [hero, ...CB()], kind: 'full' });
D.shot(TBACK + 0.5, 0.6, { on: [hero, [XH2 + 3 * HH, -1.3 * HH]], kind: 'wide' });
D.shot(TCATCH, 0.5, { on: [hero, cur], kind: 'full' });

// ════════════════ 它悄悄改了 jump（观众看到，他没看到）→ 蓄力冲过来 → jmup() → NameError，被撞飞 ════════════════
const TSQ = TCATCH + 0.8;
const CODE10 = CODE0.replace('n < 5', 'n < 10');
const IJ = CODE10.lastIndexOf('jump');
code.set(TCATCH + 0.4, CODE10);
code.squiggle(TSQ + 0.4, TSQ + 1.6, IJ, IJ + 4);
const CODEJ = CODE10.slice(0, IJ) + 'jmup' + CODE10.slice(IJ + 4);
code.set(TSQ + 1.2, CODEJ); D.cue(TSQ + 1.2, 'replace', { v: 0.3 });
hero.lean(TSQ, 10, 0.3).look(TSQ, [cur.posAt(TSQ).x, -0.5 * HH], { dur: 0.2 });             // 他盯着它，没看代码
D.shot(TSQ - 0.2, 0.5, { on: [hero, cur, ...CB()], kind: 'full' });
const TSP0 = TSQ + 1.9, TSP1 = TSP0 + 0.8;
cur.blink(TSP0 - 0.3, 'solid'); cur.spin(TSP0, TSP1); cur.blink(TSP1, 'fast');
const XH3 = hero.hipNow(TSP0)[0];
const TRAM = cur.hops(TSP1 + 0.05, XH3 + 0.35 * HH, { dt: 0.06, v: 0.9 });       // 连跳冲过来
const TENT = TRAM - 0.12;
code.run(TENT, 0.3).error(TENT + 0.06, IJ, IJ + 6, 'NameError'); R.KEYS.push(TENT);
hero.lean(TENT - 0.15, 16, 0.08).hip(TENT - 0.15, [XH3, -ST + 0.1 * HH], 0.08);           // 蹲好要跳——没跳
const L1 = hero.launch(TRAM, { vx: -900, vy: -650, turns: 1, land: 'back' });
hero.obj(TRAM, 'rest', s => lapFly.at(s));
fx.add(TRAM, [XH3 + 0.2 * HH, -0.55 * HH], 'heavy');
D.cue(TRAM, 'impact_heavy');
cur.hop(TRAM + 0.15, XH3 + 0.15 * HH);
const lapFly = (() => { let b = null; return { at: s => { if (!b) b = new Body({ t0: TRAM, x: XH3 + 0.25 * HH, y: -0.5 * HH, vx: 500, vy: -800, vrot: 9, r: 0.05 * LW, bounce: 0.2, friction: 0.4, sfx: 'laptop_drop', defer: true }); return b.at(s); }, body: () => b }; })();
D.shot(TRAM, 8 * F, { on: [hero, cur, [L1.x - 0.8 * HH, 0], [XH3 + 2.2 * HH, 0]], kind: 'wide' }, 'out3');
// ———— hahaha 掉在他身上 ————
const THA = L1.t + 0.3;
cur.hops(THA - 0.4, L1.x + 0.9 * HH, { dt: 0.1 });
cur.say(THA, 'hahaha', { cps: 8, dur: 0.4 });
const HAS = [0, 1, 2].map(i => ({ t0: THA + 0.9 + i * 0.22, x: L1.x + (0.1 - 0.12 * i) * HH }));
for (const h of HAS) D.cue(h.t0 + 0.35, 'tap', { v: 0.5 });
const U2 = hero.getUp(HAS[2].t0 + 0.9, { from: 'back', speed: 1.7 });
hero.hand('F', U2.t + 0.1, 'local', s => [0.08 + 0.05 * Math.sin((s - U2.t) * 28), 0.05]).sfx(U2.t + 0.15, 'rustle', { v: 0.6 });   // 扒拉掉身上的 ha
hero.hand('F', U2.t + 0.8, 'free', [0.05, 0.35]);
hero.look(U2.t + 0.9, [cur.posAt(U2.t).x, -0.5 * HH], { dur: 0.2 });
D.shot(L1.t, 0.5, { on: [hero, cur], kind: 'full' });
const ADUR = U2.t + 1.0;
// 代码只在打字的时候露出来（动作段代码不常驻）
code.fadeOut(-1e9, TTYPE - 0.3).fadeOut(TR1 + 1.2, THB - 0.3).fadeOut(THB + 1.1, TSQ - 0.3).fadeOut(TRAM + 0.5, 1e9);

// ———— 小蛇 ————
kS.push([TCATCH + 1.5, XH2 - 1.7 * HH, -30], [ADUR, XH2 - 1.75 * HH, -30]);
for (const k of kS) if (k[0] > TRAM) k[1] = Math.min(k[1], XH2 - 1.6 * HH);
kS.sort((a, b) => a[0] - b[0]);
const snake = new Snake({ t0: -1.5, t1: ADUR, gap: GAP, max: 12, head: spline(kS, { mono: true }), size: 42, plain: true, wig: s => (s > TGROW && s < TGROW + 0.8 ? 16 : 8) });
const nAt = s => (s < TGROW ? 4 : s < TGROW + 0.5 ? 4 + Math.floor((s - TGROW) / 0.08) : 10);
const wordAt = (k, s) => {
  if (s >= TREP && s < TBACK + k * 0.05) return s >= TREP + k * 0.06 ? 'bye' : 'hi';
  return k === 0 && s < TGROW ? 'hi5' : 'hi';
};
const hlAt = (k, s) => (s >= TF + 0.4 && s < TREP + k * 0.06 + 0.05 ? CL.YELLOW : null);
const ws = new CL.WordSnake({ snake, n: nAt, words: wordAt, hl: hlAt, size: 42 });

// ———— 模拟 ————
R.KEYS.push(...R.keyTimes(code)); R.KEYS.sort((a, b) => a - b);
D.codes = [code];                                                           // 镜头自动把露出来的代码框进来（director.js）
D.finalize({ actors: [hero], bodies: [lapBody], dur: ADUR, start: { x: 0, y: -330, z: 1 } });
if (lapFly.body()) { const { flushSfx } = require('./phys'); flushSfx([lapFly.body()], clock); }
const DUR = D.DUR;

// ———— 画面 ————
function drawLetters(ctx, s) {
  for (const L of LET) {
    if (s < TUP) continue;
    let y, a = 1, sc = 1;
    if (s < TUP + 0.25) { const u = (s - TUP) / 0.25; const c = cur.topAt(TUP); PR.word(ctx, L.ch, lerp(c[0], c[0] + (L.x - c[0]) * 0.2, u), c[1] - 60 - 900 * u * u, 0, lerp(40, BIG * 1.3, u)); continue; }
    if (s < L.tl - 0.35) continue;
    const u = clamp((s - (L.tl - 0.35)) / 0.35); y = lerp(-1700, -BIG * 0.5, u * u);
    if (s > L.tl) { const d = s - L.tl; sc = 1 - 0.12 * Math.exp(-d * 14) * Math.cos(d * 40); y = -BIG * 0.5; }
    ctx.save(); ctx.translate(L.x, 0); ctx.scale(1, sc); PR.word(ctx, L.ch, 0, y / sc, 0, BIG * 1.3, a, [235, 235, 235]); ctx.restore();
  }
}
function drawHa(ctx, s) {
  for (const h of HAS) { if (s < h.t0) continue; const u = clamp((s - h.t0) / 0.35), y = lerp(-1.3 * HH, -0.12 * HH, u * u), off = s > U2.t + 0.2 ? clamp((s - U2.t - 0.2) / 0.4) : 0; PR.word(ctx, 'ha', h.x + off * 60, y + off * off * 200, off * 2, 34, 1 - off); }
}
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c); ctx.translate(0, fx.joltAt(ta));
  CL.drawGround(ctx, c.x - W / 2 / c.z - 60, c.x + W / 2 / c.z + 60, ta);
  code.draw(ctx, ta);
  drawLetters(ctx, ta);
  ws.draw(ctx, ta);
  cur.draw(ctx, ta);
  const s = hero.stateAt(ta);
  hero.draw(ctx, ta, DRAW);
  PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, ta < TLAP + 0.4 ? -1 : s.dir);   // 在空中翻的时候换面：落下来屏幕朝他、键盘在他手边
  drawHa(ctx, ta);
  for (const k of KC) PR.keyCombo(ctx, ta, { ...k, at: k.at(ta) });
  fx.draw(ctx, ta);
  ctx.restore();
  const fl = fx.flashAt(ta);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }

module.exports = { snakes: [ws], DUR, draw, post, cam, hero, clock, codes: [code], beats: [], cur,
  marks: { Ra: Ra.t, J1: J1.t, TDIVE, TLAP, TTYPE, TGROW, TS1, TS2, TF, TH, TLEAVE, THB, TBACK, TSQ, TSP0, TRAM, THA, ADUR } };
