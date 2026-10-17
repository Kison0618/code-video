// 样片 v2（SCENE=v2）：情节和第一版（scene.js）一样，换成 v2 动作系统 + 打击感系统
//   掉下来脸朝下砸地 → 爬起、挠头 → 走过去单膝跪下捡电脑 → hello 报错 → print("hi") 掉出实物 → 夹着电脑一脚踢飞
//   → 三个 hi 掉成一堆 → print(*bomb) 爆炸，被炸飞后空翻仰面落地 → 爬起来、晕 → 走到电脑旁跪下敲 turtle → 白线追来 → 跑 → 跳
// 所有动作写在动画时间上；打击（停顿帧）先登记，最后统一把音效换算成真实时间。
'use strict';
const K = require('./core');
const { C, W, H, clamp, lerp, E } = K;
const { Clock } = require('./actor2');
const { Actor2 } = require('./moves');
const { Camera } = require('./cam');
const { Code } = require('./code');
const { Body, flushSfx } = require('./phys');
const PR = require('./props');
const V = require('./vfx');
const cues = require('./cues');
const { Impacts } = require('./impact');

const HH = 300, LW = 0.5 * HH;
const clock = new Clock(), cam = new Camera(), imp = new Impacts({ clock, cam });
// 打击登记的音效已经是真实时间，其余的（代码、动作、手写的）最后统一换算
const realCue = new Set();
const hit = (...a) => { const n = cues.list.length, tr = imp.hit(...a); for (let i = n; i < cues.list.length; i++) realCue.add(cues.list[i]); return tr; };

// ———————————————— 代码 ————————————————
const code = new Code({ x: -430, y: -640, size: 66, seed: 3 });
code.blinkSound(0, 1.7).blinkSound(5.0, 6.2);
code.type(8.7, 'hello', 6.5).run(10.0, 0.32, 'touch2').error(10.15, 0, 5, 'NameError').back(12.0, 5, 12);
code.type(12.7, 'print()', 8).cursor(13.9, 6).type(14.05, '"hi"', 7).cursor(14.75, 11).run(15.0);
code.type(18.9, '\nprint("hi")\nprint("hi")', 20).run(20.5);
code.set(23.6, '').type(23.9, 'bomb = ["BOOM","BAM","POW"]\nprint(*bomb)', 15).run(27.4, 0.12);
// 按键时刻（打字和删除）驱动手和电脑的微震；turtle 那段等知道人跪在哪以后再写
const keyTimes = () => { const out = []; for (let i = 1; i < code.snaps.length; i++) if (Math.abs(code.snaps[i].text.length - code.snaps[i - 1].text.length) === 1) out.push(code.snaps[i].t); return out; };
let KEYS = keyTimes();
function tapAt(t) {
  let d = 0, k = -1, j = 0;
  for (let i = 0; i < KEYS.length; i++) {
    const a = t - KEYS[i];
    if (a >= -0.03 && a <= 0.12) { k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07); }
    if (a > 0 && a < 0.25) j += Math.exp(-a * 25) * Math.sin(a * 60);
  }
  return { d, k, j };
}

// ———————————————— 电脑上的点（本地坐标，原点在铰链）————————————————
const GRIP_UNDER = [-0.18 * LW, 0.07 * LW], GRIP_BACK = [-0.5 * LW, 0.03 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];
const keyPoint = t => { const tp = tapAt(t); return [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; };
const HELD = { fwd: 0.24, up: 0.05 }, LOW = { fwd: 0.3, up: -0.05 }, TUCK = { fwd: 0.16, up: 0.03 };
const LB = { r: 0.05 * LW, bounce: 0.25, friction: 0.5, sfx: 'laptop_drop', defer: true };

const hero = new Actor2({ H: HH, x0: -110, clock, lean: 2, headTilt: 10, objJiggle: t => { const j = tapAt(t).j; return [j * 1.2, j * 0.012]; } });
const ST = hero.STAND;

// ———————————————— A 从天上掉下来 ————————————————
const lapFall = new Body({ t0: 0.6, x: 200, y: -1150, vrot: 0.4, ...LB });
const LX = lapFall.at(6)[0];
hero.obj(0, 'rest', t => lapFall.at(t));
const T_FALL = 0.77;
const L0 = hero.launch(T_FALL, { from: [-110, -1250], vx: 0, vy: 0, lean0: 80, land: 'front' });
hit(L0.t, [-110, -10], 'ground', { sfx: ['thud'], freeze: 0.06, shake: [22, 0.45], punch: 0.04, ring: 420, warp: 7 });
cues.add(L0.t - 0.45, 'whoosh', { v: 0.6 });
hero.head(L0.t + 0.1, 8).head(L0.t + 0.45, 0).head(2.8, -50, 0.3);                      // 趴着，抬头看光标
const U0 = hero.getUp(3.2, { from: 'front' });
hero.head(U0.t - 0.3, -12);
// 挠头
hero.hand('F', 4.7, 'local', s => [0.05, -0.21 + 0.03 * Math.sin((s - 4.7) * 26)]).head(4.7, -14);
hero.sfx(4.85, 'rustle', { v: 0.4 });
hero.hand('F', 5.75, 'free', [0.05, 0.35]).head(6.0, 28, 0.3);                           // 低头看电脑
// 走过去，单膝跪在电脑旁边
const FRONT = LX - 0.5 * LW - 14;
const W1 = hero.walk(6.15, FRONT - 0.2 * HH, { stepDur: 0.28 });
const K1 = hero.kneel(W1.t - 0.12, { front: FRONT });
hero.hand('F', K1.t - 0.1, 'world', [LX + GRIP_UNDER[0] + 30, -0.045 * LW + 4]).hand('B', K1.t - 0.06, 'world', [LX + GRIP_BACK[0] + 4, -0.045 * LW + 3]);
const TG = K1.t + 0.25;                                                                    // 抓住
hero.hand('F', TG, 'obj', [GRIP_UNDER[0] + 30, GRIP_UNDER[1] - 4]).hand('B', TG, 'obj', GRIP_BACK);
hero.obj(TG, 'held', LOW).sfx(TG, 'touch2');
const S1 = hero.rise(TG + 0.3, { head: 20 });
hero.obj(TG + 0.3, 'held', HELD).hand('B', TG + 0.35, 'obj', GRIP_UNDER).hand('F', TG + 0.75, 'obj', keyPoint);
const HX0 = S1.x;                                                                          // 站着敲代码时胯的位置

// ———————————————— B hello → 报错 → 沮丧 ————————————————
hero.head(8.6, 22, 0.3);
hero.hip(9.2, [HX0 + 8, -ST + 3], 0.5);
hero.lean(10.15, -12).head(10.15, -8);                                                    // 往后一仰
cam.punch(10.15, 0.03, 0.4);                                                              // （真实时间，最后统一换算）
hero.lean(10.6, -6).head(10.6, 5);
hero.lean(11.1, 14, 0.25).head(11.1, 42, 0.25).hip(11.1, [HX0 + 4, -ST + 10], 0.3);      // 垂头丧气
hero.lean(11.8, 10).head(11.8, 36);
hero.lean(12.0, 2, 0.2).head(12.0, 22, 0.2).hip(12.0, [HX0, -ST + 2], 0.3);
hero.hip(13.4, [HX0 - 6, -ST + 3], 0.6);

// ———————————————— C print("hi") → 实物掉下来 → 夹着电脑一脚踢飞 ————————————————
const HI = { r: 12, bounce: 0.42, friction: 0.7, sfx: 'tick', defer: true };
const TC1 = 16.62;
const hi1 = new Body({ t0: 15.08, x: HX0 + 182, y: -470, vy: -260, vrot: 0.8, ...HI, hits: [{ t: TC1, vx: 2300, vy: -1250, vrot: 22 }] });
cues.add(15.08, 'output');
const HXK = hi1.at(16.3)[0], SX = HXK - 112;
hit(TC1, [HXK - 6, -18], 'light');
hero.head(15.35, 40).lean(15.35, 8);
hero.hip(15.8, [SX - 10, -ST + 2], 0.42, 'inOut');
hero.foot('F', 15.78, [SX + 24, 0], 0.22, 16).foot('B', 16.0, [SX - 22, 0], 0.22, 16);
hero.hand('F', 16.05, 'free', [0.16, 0.24]).obj(16.05, 'held', TUCK).hand('B', 16.05, 'obj', GRIP_UNDER);
const KK = TC1 - 0.24;                                                                     // 预备
hero.hip(KK, [SX - 14, -ST + 8], 0.16).lean(KK, 8).head(KK, 34);
hero.foot('F', KK, [SX - 22, -46], 0.22, 0, 'out3', false).hand('F', KK, 'free', [0.24, 0.12]);
cues.add(TC1 - 0.12, 'whoosh_short', { v: 0.8 });
hero.foot('F', TC1 - 0.075, [HXK - 14, -16], 0.075, 0, 'in', false);
hero.hip(TC1 - 0.075, [SX + 12, -ST + 2]).lean(TC1 - 0.075, -16).head(TC1 - 0.075, 22).hand('F', TC1 - 0.075, 'free', [-0.26, 0.22]);
hero.foot('F', TC1 + 0.01, [HXK + 40, -170], 0.2, 0, 'out3', false).lean(TC1 + 0.01, -24);
hero.foot('F', TC1 + 0.32, [SX + 50, 0], 0.26, 20).hip(TC1 + 0.3, [SX + 26, -ST + 3]).lean(TC1 + 0.3, 4).head(TC1 + 0.3, -6);
hero.hand('F', TC1 + 0.3, 'free', [0.06, 0.34]);
hero.foot('B', TC1 + 0.62, [SX + 4, 0], 0.2, 12).hip(TC1 + 0.6, [SX + 26, -ST]);
hero.head(17.4, -14, 0.3);
hero.hand('F', 17.75, 'free', [0.2, -0.14]).head(17.75, -18);                             // 小小的得意
hero.hand('F', 18.3, 'free', [0.05, 0.34]).head(18.3, 20, 0.3);
hero.obj(18.45, 'held', HELD).hand('B', 18.5, 'obj', GRIP_UNDER).hand('F', 18.7, 'obj', keyPoint);   // 回到敲键盘
const HX1 = SX + 26;

// ———————————————— D 三个 hi 掉成一堆 ————————————————
const TB = 27.55;
const pile = [0, 1, 2].map(k => new Body({ t0: 20.58 + k * 0.07, x: HX1 + 150 + k * 75, y: -560 - k * 30, vx: 0, vy: -200, vrot: (k - 1) * 3, ...HI,
  hits: [{ t: TB, vx: (k - 1) * 900 - 300, vy: -1800 - k * 300, vrot: (k - 1) * 25 + 10 }] }));
cues.add(20.58, 'output');
hero.head(20.9, 42).lean(20.9, 6);
hero.head(21.6, 38).lean(21.6, -4);
hero.head(22.1, 10).lean(22.1, -8);                                                       // 抬头想了想
hero.head(23.0, 6, 0.3).lean(23.0, 2, 0.3);
hero.hip(25.0, [HX1 + 6, -ST + 3], 0.6);

// ———————————————— E print(*bomb) → 爆炸，被炸飞 ————————————————
const EX = [HX1 + 185, -360];
hero.head(27.25, 30, 0.2);
hit(TB, EX, 'huge', { glow: true, invert: 1, sfx: ['impact_frame', 'boom'] });     // 反色只留 1 帧（暖色辉光反色后是一大团蓝，刺眼）
cues.add(TB - 0.1, 'output'); cues.add(TB + 0.1, 'whoosh', { v: 1 }); cues.add(TB + 0.5, 'debris');
const L1 = hero.launch(TB, { vx: -560, vy: -1000, turns: 1, land: 'back' });
hit(L1.t, [L1.x, -10], 'ground', { sfx: ['thud'], freeze: 0.05, shake: [20, 0.4], punch: 0.03, ring: 460, warp: 6 });
// 预演一遍，算出爆炸那一刻电脑在手里的位置，再让它被炸飞
hero.simulate(TB + 0.05, { sfx: false });
const held0 = hero.stateAt(TB).obj;
const blast = new Body({ t0: TB, x: held0[0], y: held0[1], rot: held0[2], vx: -560, vy: -1500, vrot: -11, ...LB, bounce: 0.3 });
hero.obj(TB, 'rest', t => blast.at(t));
const LX2 = blast.at(TB + 6)[0];

// ———————————————— F 爬起来 → 走到电脑旁跪下敲 turtle ————————————————
const U1 = hero.getUp(L1.t + 1.3, { from: 'back' });
hero.head(U1.t, 20, 0.3).head(U1.t + 0.35, -8, 0.3).head(U1.t + 0.7, 16, 0.3);          // 晕乎乎
hero.lean(U1.t + 0.2, 8, 0.4).lean(U1.t + 0.6, -4, 0.4).lean(U1.t + 1.0, 2, 0.3);
const FACE = Math.sign(LX2 - U1.x) || 1, LD = FACE;                                     // 电脑在哪边就朝哪边；电脑落地后键盘朝着人
const TW2 = U1.t + 1.1;
if (FACE !== hero.dirAt(TW2)) hero.turn(TW2, FACE);
const FRONT2 = LX2 - FACE * (0.5 * LW + 14);
const W2 = hero.walk(TW2 + 0.05, FRONT2 - FACE * 0.2 * HH, { stepDur: 0.28 });
const K2 = hero.kneel(W2.t - 0.12, { front: FRONT2, head: 26 });
hero.hand('B', K2.t, 'obj', GRIP_UNDER).hand('F', K2.t + 0.05, 'obj', keyPoint);
cues.add(K2.t, 'touch2');
const TT_TYPE = K2.t + 0.25, TT_RUN = TT_TYPE + 2.2, TT0 = TT_RUN + 0.2;
code.set(TT_TYPE - 0.3, '').moveTo(TT_TYPE - 0.4, TT_TYPE - 0.2, -760, -640).type(TT_TYPE, 'import turtle\nt.speed("fastest")', 15).run(TT_RUN);
KEYS = keyTimes();
hero.head(TT_RUN, 10, 0.2);

// ———————————————— G 白线追来 → 跑 → 跳 ————————————————
hero.head(TT0 + 0.15, -20).lean(TT0 + 0.15, 20);                                         // 听到了什么
const TT = TT0 + 0.4;
if (FACE === 1) hero.turn(TT, -1);                                                       // 白线从左边来：背对着的话先回头
hero.head(TT, -14).lean(TT, -12);                                                         // 吓一跳
hero.hand('F', TT, 'free', [0.12, 0.1]).hand('B', TT, 'free', [0.06, 0.14]);
cues.add(TT, 'whoosh', { v: 0.5 });
hero.turn(TT + 0.32, 1).hip(TT + 0.32, [K2.x, -ST + 0.1 * HH]).lean(TT + 0.32, 14).head(TT + 0.32, 4);   // 转身、站起来就跑
hero.foot('B', TT + 0.32, [K2.x - 0.1 * HH, 0], 0.14, 10);
const RUN_V = 600, RUN_T = 6.9;
const R1 = hero.run(TT + 0.55, K2.x + RUN_V * RUN_T, { speed: RUN_V, stop: false, ramp: 0.35 });
const J1 = hero.jump(R1.t, { to: R1.x + 0.6 * RUN_V, h: 200, dur: 0.6, running: true, skid: 90 });
hit(J1.t, [J1.x - 40, -6], 'ground', { sfx: ['thud', 'ground_shock'], freeze: 0.06, shake: [24, 0.5], punch: 0.04, ring: 520, warp: 8 });
cues.add(R1.t - 0.05, 'whoosh', { v: 0.8 });
const TE = J1.t + 0.9;
hero.turn(TE, -1).head(TE, -10);                                                          // 回头看
hero.turn(TE + 0.6, 1).hand('F', TE + 0.6, 'free', [0.2, -0.14]).hand('B', TE + 0.6, 'free', [-0.18, -0.1]).head(TE + 0.6, -16);   // 得意
hero.hand('F', TE + 1.2, 'free', [0.05, 0.35]).hand('B', TE + 1.2, 'free', [-0.04, 0.35]).head(TE + 1.2, 0, 0.3);
const ADUR = TE + 1.9;

// 白线：从左边画面外追过来，比人稍快一点，越追越近但追不上
const TT1 = R1.t + 0.4, TX0 = K2.x - 1400;
const tipX = ta => TX0 + 640 * Math.max(0, ta - TT0);
cues.add(TT0, 'turtle', { dur: TT1 - TT0 });
cues.add(TT0 - 0.2, 'music', { t1: J1.t + 0.7, bpm: 150 });

// ———————————————— 模拟 + 音效换算 ————————————————
for (const c of cues.list) if (!realCue.has(c)) c.t = +clock.real(c.t).toFixed(4);
cam.punches.forEach(p => { p.t = clock.real(p.t); });                                   // 手写的推镜也是动画时间
hero.simulate(ADUR);
flushSfx([lapFall, hi1, ...pile, blast], clock);
const DUR = +clock.real(ADUR).toFixed(2);

// ———————————————— 摄像机（真实时间）————————————————
const R = ta => clock.real(ta), hx = ta => hero.stateAt(ta).hip[0];
cam.key(0, { x: 0, y: -330, z: 1 })
  .key(R(6.0), { x: 20, y: -330, z: 1, ease: 'linear' })
  .key(R(8.6), { x: HX0 - 60, y: -390, z: 1.1 })                                        // 敲代码：推近
  .key(R(14.8), { x: HX0 - 40, y: -380, z: 1.1 })
  .key(R(15.7), { x: SX + 40, y: -330, z: 1.0 })                                         // 踢之前拉开
  .key(R(23.4), { x: HX1 - 10, y: -350, z: 1.0 })
  .key(R(27.4), { x: HX1 - 10, y: -360, z: 1.05 })
  .key(R(TB) + 0.25, { x: HX1 - 140, y: -360, z: 0.88, ease: 'out3' })                  // 爆炸：一下拉远
  .key(R(L1.t) + 0.3, { x: L1.x + 120, y: -350, z: 0.95 })                              // 跟着被炸飞的人
  .key(R(U1.t), { x: U1.x + 60, y: -360, z: 1.0 })
  .key(R(K2.t), { x: (K2.x + LX2) / 2 - 120, y: -400, z: 1.0 })
  .key(R(TT0), { x: (K2.x + LX2) / 2 - 140, y: -400, z: 1.0 })
  .key(R(TT + 0.6), { x: hx(TT + 0.6) - 150, y: -420, z: 0.74 })                        // 追逐：拉远看全
  .key(R(R1.t), { x: R1.x - 130, y: -420, z: 0.74, ease: 'linear' })                    // 匀速跟拍
  .key(R(J1.t) + 0.5, { x: J1.x + 40, y: -360, z: 0.95, ease: 'out3' })
  .key(DUR, { x: J1.x + 60, y: -360, z: 0.98, ease: 'linear' });

// ———————————————— 画面 ————————————————
function drawTurtle(ctx, ta) {
  if (ta < TT0) return;
  const x1 = tipX(Math.min(ta, TT1)), pts = [], step = 140;
  for (let x = TX0, k = 0; x < x1; x += step, k++) pts.push([x, k % 2 ? -760 : -40]);
  const k = pts.length, u = (x1 - (TX0 + (k - 1) * step)) / step;
  pts.push([x1, lerp((k - 1) % 2 ? -760 : -40, k % 2 ? -760 : -40, u)]);
  ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineJoin = 'miter'; ctx.miterLimit = 10; ctx.lineCap = 'butt';
  const segs = 24;
  for (let s = 0; s < segs; s++) {               // 线宽越来越粗（pensize 越调越大）
    const i0 = Math.floor(pts.length * s / segs), i1 = Math.min(pts.length - 1, Math.floor(pts.length * (s + 1) / segs) + 1);
    if (i1 <= i0) continue;
    ctx.lineWidth = lerp(4, 70, (s + 0.5) / segs * clamp((Math.min(ta, TT1) - TT0) / 4));
    ctx.beginPath(); ctx.moveTo(pts[i0][0], pts[i0][1]);
    for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  const [x, y] = pts[pts.length - 1], [px, py] = pts[pts.length - 2] || [x - 1, y];
  ctx.translate(x, y); ctx.rotate(Math.atan2(y - py, x - px)); ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-14, -16); ctx.lineTo(-6, 0); ctx.lineTo(-14, 16); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function draw(ctx, t) {
  const ta = clock.anim(t), c = cam.at(t);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  drawTurtle(ctx, ta);
  code.draw(ctx, ta);
  const s = hero.stateAt(ta), held = ta >= TG && ta < TB, ld = ta < TB ? 1 : LD;
  if (!held && s.obj) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, ld);
  if (ta >= hi1.t0) { const [x, y, r] = hi1.at(ta); PR.word(ctx, 'hi', x, y, r); }
  for (const b of pile) if (ta >= b.t0) { const [x, y, r] = b.at(ta); PR.word(ctx, 'hi', x, y, r); }
  if (ta > TC1 && ta < TC1 + 0.45) { const [x, y] = hi1.at(ta), [x0, y0] = hi1.at(ta - 1 / 60); V.motionLines(ctx, x, y, (x - x0) * 60, (y - y0) * 60, { n: 4, spread: 16, len: 0.05, seed: 4 }); }
  if (ta >= TB - 0.1 && ta < TB + 0.05) V.wordBurst(ctx, EX[0], EX[1] - 20, ta - (TB - 0.1), ['BOOM', 'BAM', 'POW'], { n: 6, speed: 300, size: 30, seed: 21 });
  if (ta >= T_FALL + 0.04) hero.draw(ctx, ta);                                          // 开始掉之前人在画面外（多等 2 帧，拖影不会从站姿扫过来）
  if (held) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, ld);
  V.explosion(ctx, EX[0], EX[1], t - R(TB), { scale: 1, words: ['BOOM', 'BAM', 'POW'], seed: 31 });
  if (ta > TT + 0.8 && ta < R1.t) V.motionLines(ctx, s.hip[0] - 40, s.hip[1] - 40, 2400, 0, { n: 6, spread: 120, len: 0.1, seed: Math.floor(t * 20), a: 0.5 });
  imp.drawWorld(ctx, t);
  ctx.restore();
}
function post(ctx, t, base) { imp.post(ctx, t, base); }
const bloomAt = t => 0.9 * Math.exp(-Math.max(0, t - R(TB)) * 1.2) * (t >= R(TB) - 0.05 ? 1 : 0);

module.exports = { DUR, draw, post, cam, bloomAt, hero, clock, marks: { L0, U0, W1, K1, TG, S1, HX0, SX, HX1, L1, U1, LX2, FACE, W2, K2, TT0, TT, R1, J1, TE } };
