// 《火柴人 VS 光标》第 5 段（SCENE=cur5）：撤销对决 + 和解（剧本 火柴人VS光标_剧本.md）
//   一片白里他坐着 → 站起来拿起电脑 → Ctrl+Z：黑色和地面回来 → Ctrl+Z：代码回来 → Ctrl+Z：小蛇一节节回来
//   → 远处巨大的 | ：Delete / Ctrl+Z 键帽对飞、在中间撞碎，越来越快 → 他把 Ctrl+Z 对准它：它吐出吃掉的东西，一圈圈变小
//   → 缩回小小的 _，害怕，退进他的代码里 → 手指放在 Delete 上 → 回忆 2（它一直在学他）→ 他打半行 print(，它补上 "hi")
//   → 一个 hi 接到小蛇尾巴上；两个光标同步闪 → 一起往右走
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

// 回忆 2 要用第 1 段的画面（它的音效不进这一段的时间表）
const n0 = cues.list.length;
const V1 = require('./scene_cur1');
cues.list.length = n0;

const HH = 300, LW = CL.LW, F = 1 / 24, GAP = 80, CS = 45, LH = CS * 1.32;
const D = new Director(), clock = D.clock, cam = D.cam;
const R = CL.keyRig();
const fx = new FightFX(HH);
const X0 = 0;
const hero = new Actor2({ H: HH, x0: X0, dir: 1, clock, lean: -6, headTilt: 30 });
const ST = hero.STAND;
const KC = [];
const capHero = (tk, keys, size = 56) => KC.push({ at: () => { const o = hero.stateAt(tk).obj; return [o[0], o[1] - 0.45 * HH]; }, size, keys: keys.map((l, i) => ({ label: l, t: tk + i * 0.15 })), t1: tk + 0.15 * keys.length + 0.4 });
let t;

// ════════════════ 一片白：他坐着；站起来，拿起电脑 ════════════════
const XLAP = X0 + 0.55 * HH;
hero.hip(0, [X0, -0.16 * HH]).foot('F', 0, [X0 + 0.42 * HH, 0], 0).foot('B', 0, [X0 + 0.32 * HH, 0], 0);
hero.hand('F', 0, 'world', [X0 - 0.18 * HH, 0]).hand('B', 0, 'world', [X0 - 0.24 * HH, 0]);
hero.obj(0, 'rest', [XLAP + 0.2 * HH, -0.045 * LW, 0]);
hero.look(0.7, [X0 - 1500, -300], { dur: 0.3, turn: false }); hero.look(1.3, [X0 + 1500, -300], { dur: 0.3, turn: false });
const TUP = 1.9;
hero.hip(TUP, [X0 + 0.1 * HH, -ST], 0.45).lean(TUP, 4, 0.4).head(TUP, 20, 0.3);
hero.foot('F', TUP + 0.1, [X0 + 0.2 * HH, 0], 0.3, 10).foot('B', TUP + 0.15, [X0 + 0.0 * HH, 0], 0.3, 10);
hero.hand('F', TUP, 'free', [0.05, 0.35]).hand('B', TUP, 'free', [-0.04, 0.35]);
const TPK = TUP + 0.9;
hero.lean(TPK - 0.3, 44, 0.25).hand('F', TPK - 0.25, 'world', [XLAP + 0.2 * HH - 0.05 * LW, -0.05 * LW]).hand('B', TPK - 0.2, 'world', [XLAP + 0.2 * HH - 0.3 * LW, -0.03 * LW]);
hero.obj(TPK, 'held', { fwd: 0.24, up: 0.05 }).lean(TPK, 2, 0.25);
R.oneHand(hero, TPK + 0.05);
hero.head(TPK + 0.3, 34, 0.3);                                              // 低头看着电脑……停一下
D.shot(0, 0.01, { on: [hero, [X0 - 0.8 * HH, 0], [X0 + 0.8 * HH, -1.2 * HH]], kind: 'full' });

// ════════════════ Ctrl+Z ×3：世界一样样倒着回来 ════════════════
const U = [TPK + 1.5, TPK + 2.9, TPK + 4.3];
for (const u of U) { capHero(u, ['Ctrl', 'Z']); R.KEYS.push(u, u + 0.15); D.cue(u, 'key'); D.cue(u + 0.15, 'undo', { v: 0.9 }); }
const groundR = s => (s < U[0] + 0.15 ? 0 : 3000 * E.out(clamp((s - U[0] - 0.15) / 0.9)));
const DEF = 'def combo(n):\n    for i in range(n):\n        jab()\n        kick()';
const code = new Code({ x: X0 - 0.9 * HH, y: -2.15 * HH, size: CS, seed: 51, cps: 60 });
code.type(U[1] + 0.2, DEF, 70);
code.fadeOut(U[2] + 1.6, 1e9);
const CB = (n = 4, w = 22) => [[code.x - 20, code.y - 60], [code.x + w * CS * 0.5, code.y + n * LH]];
const TSN = U[2] + 0.2;                                                     // 小蛇一节节回来，抬头看他
for (let k = 0; k < 10; k++) D.cue(TSN + k * 0.07, 'output', { v: 0.35 });
hero.look(U[0] + 0.4, [X0 + 1.2 * HH, 0], { dur: 0.3, turn: false });
hero.look(U[1] + 0.4, [code.x + 200, code.y + LH], { dur: 0.3 });
hero.look(U[2] + 0.5, [X0 - 1.2 * HH, -40], { dur: 0.3 });
D.shot(U[1] - 0.3, 0.5, { on: [hero, ...CB()], kind: 'full' });
D.shot(U[2], 0.5, { on: [hero, [X0 - 2.5 * HH, -40], ...CB()], kind: 'full' });

// ════════════════ 远处巨大的 |：Delete / Ctrl+Z 键帽对飞 ════════════════
const XC = X0 + 3.6 * HH;
const TCUR = U[2] + 1.6;
const cur = new CL.Cur({ x: XC, form: 'ibeam', size: 2.0 * HH, blink: 'solid', show: [TCUR, 1e9] });
cur.fade(TCUR, TCUR + 0.3, 0, 1);
D.cue(TCUR, 'cursor_stare', { v: 0.8 });
hero.turn(TCUR + 0.2, 1).look(TCUR + 0.2, [XC, -1.2 * HH], { dur: 0.15 });
hero.lean(TCUR + 0.2, -10, 0.1).lean(TCUR + 0.5, 4, 0.3);
const flies = [];
const heroTop = s => { const o = hero.stateAt(s).obj; return [o[0] + 0.1 * HH, o[1] - 0.5 * HH]; };
const curTop = s => { const c = cur.topAt(s); return [c[0] - 0.2 * HH, c[1] + 0.3 * HH]; };
const DUEL = [1.0, 0.8, 0.6, 0.45, 0.35, 0.28];
let td = TCUR + 1.2;
const flickers = [];
for (let i = 0; i < DUEL.length; i++) {
  const mid = [lerp(X0, XC, 0.5) + (i % 2 ? 40 : -40), -1.15 * HH - (i % 3) * 30];
  flies.push({ t0: td, t1: td + 0.3, fromFn: curTop, to: mid, label: 'Delete', size: 58 });
  flies.push({ t0: td + 0.02, t1: td + 0.3, fromFn: heroTop, to: mid, label: 'Ctrl+Z', size: 58 });
  D.cue(td, 'key', { v: 0.8 }); D.cue(td + 0.3, 'key_clash', { v: 0.9 });
  R.KEYS.push(td);
  fx.add(td + 0.3, mid, 'clash');
  flickers.push(td + 0.3);
  td += DUEL[i];
}
D.shot(TCUR, 0.6, { on: [hero, cur], kind: 'full' });
// ════════════════ 他把 Ctrl+Z 对准它：它吐出吃掉的东西，一圈圈变小 ════════════════
const TAIM = td + 0.3;
hero.obj(TAIM, 'held', { fwd: 0.35, up: 0.35 }).lean(TAIM, -6, 0.15);      // 把电脑举起来对准它
const SIZES = [1.4, 0.95, 0.55, 0.15], SPITS = ['# def combo():', 'jump', 'hi5', 'hi'];
const spits = [];
let ta = TAIM + 0.5;
for (let i = 0; i < SIZES.length; i++) {
  capHero(ta, ['Ctrl', 'Z']); R.KEYS.push(ta, ta + 0.15); D.cue(ta, 'key'); D.cue(ta + 0.15, 'undo', { v: 0.9 });
  flies.push({ t0: ta + 0.15, t1: ta + 0.4, fromFn: heroTop, toFn: s => { const c = cur.topAt(s); return [c[0], c[1] + 0.3 * cur.formAt(s).size]; }, label: 'Ctrl+Z', size: 52, hit: true });
  cur.hit(ta + 0.4, 1); D.cue(ta + 0.4, 'impact_medium');
  cur.grow(ta + 0.45, SIZES[i] * HH, 0.2);
  spits.push({ t0: ta + 0.45, str: SPITS[i], i });
  D.cue(ta + 0.45, 'pop_open', { v: 0.6 });
  ta += 0.9;
}
const TSMALL = ta;
cur.form(TSMALL, 'under', 0.15 * HH, 0.08);
cur.blink(TSMALL, 'fast');
hero.obj(TSMALL + 0.2, 'held', { fwd: 0.24, up: 0.05 }).lean(TSMALL + 0.2, 2, 0.2);
D.shot(TAIM, 0.5, { on: [hero, cur, [XC, -2.2 * HH]], kind: 'full' });
// ════════════════ 缩回小小的 _，害怕，往后退 → 跳进他的代码里（最后一行后面） ════════════════
const code2 = new Code({ x: X0 + 0.9 * HH, y: -1.75 * HH, size: CS, seed: 53, cps: 12 });
code2.set(TSMALL + 0.8, 'jump()', 6).fadeOut(-1e9, TSMALL + 0.8);
cur.hops(TSMALL + 0.3, XC + 0.6 * HH, { dt: 0.12, step: 0.25 * HH });
const TIN = TSMALL + 1.6, CIN = code2.charAt(TIN, 6);
cur.glide(TIN, 0.45, CIN[0], CIN[1] + 10, { arc: 200 });
cur.fade(TIN + 0.45, TIN + 0.5, 1, 0);
code2.extra(TIN + 0.48, 1e9, s => code2.snap(s).text.length, s => (s >= TSYNC ? Math.floor(s / 0.53) % 2 === 0 : CL.Cur.prototype.on.call({ modeAt: () => (s < THOVER + 1.2 ? 'fast' : 'irregular'), seed: 99 }, s)));
D.shot(TSMALL + 0.2, 0.6, { on: [hero, [XC + 0.8 * HH, -0.3 * HH], [code2.x - 20, code2.y - 60], [code2.x + 400, code2.y + 30]], kind: 'full' });
// 他走过去，手指放在 Delete 上
const XD = X0 + 1.3 * HH;
const Wd = hero.walk(TIN + 0.6, XD, { stepDur: 0.32 });
R.oneHand(hero, Wd.t);
const THOVER = Wd.t + 0.3;
hero.hand('F', THOVER, 'obj', [CL.KEYPT[0] + 18, CL.KEYPT[1] - 14]).lean(THOVER, 12, 0.3).head(THOVER, 30, 0.3);
KC.push({ at: () => { const o = hero.stateAt(THOVER).obj; return [o[0], o[1] - 0.45 * HH]; }, size: 56, keys: [{ label: 'Delete', t: THOVER + 0.2 }], t1: THOVER + 1.0, ghost: true });
D.shot(THOVER - 0.3, 0.6, { on: [hero, [code2.x - 20, code2.y - 60], [code2.x + 300, code2.y + 30]], kind: 'medium' });
// ════════════════ 回忆 2（暖色）：开场他手一滑多出一个光标，它跟着他打 5、跟着他跳 ════════════════
const TFB0 = THOVER + 1.3, FBS = [V1.marks.TALT - 0.2, V1.marks.T5 - 0.1, V1.marks.TRJ + 0.4], FBD = 1.0, TFB1 = TFB0 + FBS.length * FBD;
D.cue(TFB0, 'flashback_in'); D.cue(TFB1, 'flashback_out');
// ════════════════ 他把手指从 Delete 上拿开，打半行 print(，停下来等 ════════════════
const TLIFT = TFB1 + 0.4;
hero.hand('F', TLIFT, 'local', [0.16, -0.06]).head(TLIFT, 10, 0.3).lean(TLIFT, 4, 0.3);
const TP = TLIFT + 0.8;
R.oneHand(hero, TP - 0.1);
code2.cursor(TP, 6).type(TP + 0.05, '\nprint(', 9);
const TWAIT = code2.tEnd + 0.2;
hero.hand('F', TWAIT, 'local', [0.14, 0.02]).head(TWAIT + 0.2, 16, 0.3);   // 停下来，看着它
const TFILL = TWAIT + 1.4;                                                  // 它慢慢挪过来，打 "hi")
code2.type(TFILL, '"hi")', 5);
const TRUN = code2.tEnd + 0.6;
R.oneHand(hero, TRUN - 0.3);
code2.run(TRUN, 0.3, 'run', { line: -1 });
const TSYNC = TRUN + 0.4;
// 一个 hi 掉下来，接到小蛇尾巴上
const TDROP = TRUN + 0.1, TJOIN = TDROP + 0.8;
D.cue(TDROP, 'output'); D.cue(TJOIN, 'tap', { v: 0.5 });
D.shot(TP - 0.3, 0.5, { on: [hero, [code2.x - 20, code2.y - 60], [code2.x + 360, code2.y + 1.5 * LH]], kind: 'medium' });
D.shot(TRUN, 0.6, { on: [hero, [X0 - 3 * HH, -40], [code2.x + 360, code2.y]], kind: 'full' });
// 摸摸小蛇；屏幕上它打一个 :)
const TPAT = TJOIN + 0.6;
D.cue(TPAT + 0.9, 'key', { v: 0.4 });
const SMILE = TPAT + 0.9;
// 一起往右走，镜头不动，越走越小
const TWALK = TPAT + 2.2;
hero.turn(TWALK, 1);
const Wend = hero.walk(TWALK + 0.1, XD + 7 * HH, { stepDur: 0.36 });
code2.moveTo(TWALK + 0.1, Wend.t, code2.x + 7 * HH, code2.y);
D.shot(TWALK + 0.4, 3.5, { on: [hero], kind: 'wide', z: 0.18, dx: 1800 });
const ADUR = TWALK + 5.0;

// ———— 小蛇：Ctrl+Z 一节节回来（从他左边地上），之后跟着他 ————
const kS = [];
for (let tk = -4; tk < TSN; tk += 0.25) kS.push([tk, X0 - 4.5 * HH + (tk + 4) * 0.4 * HH * 0, -30]);
kS.length = 0;
for (let tk = -4; tk <= TSN; tk += 0.25) kS.push([tk, X0 - 4.6 * HH + (tk + 4) / (TSN + 4) * 3.4 * HH, -30]);
kS.push([TSN + 0.8, X0 - 0.6 * HH, -30]);
kS.push([TJOIN + 0.2, X0 - 0.5 * HH, -30], [TJOIN + 0.9, XD - 0.4 * HH, -30]);                // 接上新的一节以后游到他脚边，他摸摸它
const TPET = TPAT;
for (let tk = TWALK + 0.3; tk <= ADUR; tk += 0.2) kS.push([tk, Math.max(XD - 0.4 * HH, hero.hipNow(tk)[0] + 0.9 * HH), -30]);   // 走的时候小蛇在前面带路（和上一集结尾一样）
kS.sort((a, b) => a[0] - b[0]);
const snake = new Snake({ t0: -4, t1: ADUR, gap: GAP, max: 14, head: spline(kS, { mono: true }), size: 42, plain: true,
  bob: s => (s > TSN + 0.8 && s < TSN + 1.4 ? [0, -16 * Math.sin(Math.PI * (s - TSN - 0.8) / 0.6)] : s > TJOIN && s < TJOIN + 0.8 ? [0, -12 * Math.abs(Math.sin((s - TJOIN) * 12))] : [0, 0]) });
const nAt = s => (s < TSN ? 0 : s < TJOIN ? Math.min(10, 1 + Math.floor((s - TSN) / 0.07)) : 11);
const ws = new CL.WordSnake({ snake, n: nAt, size: 42 });
hero.hand('F', TPET, 'world', s => { const g = snake.segs(s); const q = g[0] || { x: X0, y: -30 }; return [q.x + 4, q.y - 26 - 8 * Math.max(0, Math.sin((s - TPET) * 12))]; });
hero.lean(TPET, 30, 0.3).hand('F', TPET + 1.2, 'obj', R.keyPoint).lean(TPET + 1.2, 2, 0.3);

// ———— 模拟 ————
R.KEYS.push(...R.keyTimes(code2)); R.KEYS.sort((a, b) => a - b);
D.finalize({ actors: [hero], dur: ADUR, start: { x: 0, y: -330, z: 1 } });
const DUR = D.DUR;
const offscreen = [[clock.real(TFB0), clock.real(TFB1)]];

// ———— 画面 ————
function drawFly(ctx, s, f) {
  const from = f.fromFn ? f.fromFn(f.t0) : f.from, to = f.toFn ? f.toFn(f.t1) : f.to;
  CL.flyKey(ctx, s, { t0: f.t0, t1: f.t1, from, to, label: f.label, size: f.size, arc: 50 });
}
function drawSpits(ctx, s) {
  for (const sp of spits) {
    const d = s - sp.t0; if (d < 0 || d > 1.2) continue;
    const c = cur.topAt(sp.t0), dir = sp.i % 2 ? 1 : -1;
    PR.word(ctx, sp.str, c[0] + dir * d * 420, c[1] + 0.4 * HH - d * 500 + d * d * 900, dir * d * 2, 46, 1 - clamp((d - 0.8) / 0.4));
  }
}
function draw(ctx, tr) {
  const t2 = clock.anim(tr), c = cam.at(tr);
  if (t2 >= TFB0 && t2 < TFB1) {
    const i = Math.min(FBS.length - 1, Math.floor((t2 - TFB0) / FBD)), loc = (t2 - TFB0 - i * FBD) * 0.8;
    CL.flashback(ctx, fc => V1.draw(fc, V1.clock.real(FBS[i] + loc)), 'warm', t2);
    CL.whiteFlash(ctx, t2, TFB0);
    return;
  }
  const wk = 1 - clamp((t2 - U[0] - 0.1) / 0.4);                           // 白色退去
  const flick = flickers.some(f => t2 >= f && t2 < f + 2 * F);               // 键帽撞碎那一下，世界闪一下白
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (wk > 0) { ctx.fillStyle = `rgba(255,255,255,${wk})`; ctx.fillRect(0, 0, W, H); }
  ctx.save(); cam.apply(ctx, c);
  const gr = groundR(t2);
  if (gr > 0) CL.drawGround(ctx, Math.max(c.x - W / 2 / c.z - 60, X0 - gr), Math.min(c.x + W / 2 / c.z + 60, X0 + gr), t2);
  code.draw(ctx, t2); code2.draw(ctx, t2);
  ws.draw(ctx, t2);
  // 新的 hi：从代码里掉下来，接到小蛇尾巴上
  if (t2 >= TDROP && t2 < TJOIN) { const u = E.inOut((t2 - TDROP) / (TJOIN - TDROP)), g = snake.segs(TJOIN), q = g[Math.min(10, g.length - 1)] || { x: X0, y: -30 }, a = code2.charAt(TDROP, code2.snap(TDROP).text.length - 3); PR.word(ctx, 'hi', lerp(a[0], q.x, u), lerp(a[1], q.y, u) - 160 * Math.sin(Math.PI * u), 0, 42); }
  cur.draw(ctx, t2);
  drawSpits(ctx, t2);
  const st = hero.stateAt(t2);
  hero.draw(ctx, t2);
  PR.laptop(ctx, st.obj[0], st.obj[1], LW, st.obj[2], 1, t2 < TPK ? 1 : st.dir);
  for (const f of flies) drawFly(ctx, t2, f);
  for (const k of KC) { if (k.ghost) { ctx.save(); ctx.globalAlpha = 0.6; } PR.keyCombo(ctx, k.ghost ? Math.min(t2, THOVER + 0.15) : t2, { ...k, at: k.at(t2) }); if (k.ghost) ctx.restore(); }
  if (t2 >= SMILE && t2 < ADUR) { const p = code2.charAt(SMILE, code2.snap(SMILE).text.length); const n = Math.min(2, Math.floor((t2 - SMILE) * 8) + 1); PR.word(ctx, ':)'.slice(0, n), p[0] + 60, p[1] - 50, 0, 34, 1 - clamp((t2 - SMILE - 2.5) / 0.5)); }
  fx.draw(ctx, t2);
  ctx.restore();
  if (flick) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fillRect(0, 0, W, H); }
  const fl = fx.flashAt(t2);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
  CL.whiteFlash(ctx, t2, TFB1);
}
function post(ctx, tr, base) {
  D.imp.post(ctx, tr, base);
  const f = clamp((tr - (DUR - 1.4)) / 1.2);                                // 结尾淡出
  if (f > 0) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = `rgba(0,0,0,${f})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
}

module.exports = { DUR, draw, post, cam, hero, clock, codes: [code, code2], beats: [], offscreen, cur,
  marks: { TUP, TPK, U0: U[0], U1: U[1], U2: U[2], TCUR, TAIM, TSMALL, TIN, THOVER, TFB0, TFB1, TP, TFILL, TRUN, TJOIN, TPAT, TWALK, ADUR } };
