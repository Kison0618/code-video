// 样片 v3（SCENE=v3）：在 v2 的基础上重做三件事
//   1. 跑步：按原片逐帧实测重写的跑步周期（moves.js run），v2 那种碎步、塌胯、手臂下垂没有了
//   2. 追逐段重新设计：不再是 7 秒同一个动作。白线（turtle 的笔尖）是"会动的危险"，每一两秒一个新花样：
//      发现 → 吓一跳 → 抓起电脑就跑 → 笔尖贴着头顶冲过来，滑铲钻过去 → 笔尖跑到前面掉头贴地杀回来，跨跳躲过
//      → 绕一大圈从背后再追上来 → 停下转身，对着冲过来的笔尖敲 turtle.bye() → 笔尖停在脸前、整条线消失 → 腿软坐下
//   3. 镜头按原片的用法重排（见 拆解 第 2.1 节）：看动作范围用远景、看反应推近景；在节拍上推拉、节拍之间稳住；
//      大事件先大远景交代规模，再推到主角的反应；跟拍时人物前方 / 威胁那一侧留空间
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
const CODE2 = [Math.min(K2.x, LX2) - 520, -640];                                         // 代码挪到人上方（v2 留在原地，镜头一跟人就看不见了）
code.set(TT_TYPE - 0.3, '').moveTo(TT_TYPE - 0.32, TT_TYPE - 0.31, ...CODE2).type(TT_TYPE, 'import turtle\nt.speed("fastest")', 15).run(TT_RUN);
hero.head(TT_RUN, 10, 0.2);

// ———————————————— G 追逐 ————————————————
const VR = 4.2 * HH;                                                                      // 跑速（约 4 个身高 / 秒）
// 发现 → 吓一跳
const TN = TT0 + 0.3, TS0 = TT0 + 0.55;
if (FACE === 1) hero.turn(TN, -1);                                                        // 线从左边来：背对着就回头看
hero.head(TN, -22).lean(TN, -6);
hero.lean(TS0, -18).head(TS0, -16).hip(TS0, [K2.x - hero.dirAt(TS0) * 0.03 * HH, -0.25 * HH]);
cues.add(TS0, 'whoosh_short', { v: 0.5 });
// 抓起电脑夹在胳膊下，转身就跑
const TGR = TS0 + 0.22;
hero.hand('F', TGR, 'obj', [GRIP_UNDER[0] + 30, GRIP_UNDER[1] - 4]).hand('B', TGR, 'obj', GRIP_BACK).obj(TGR, 'held', LOW).sfx(TGR, 'rustle', { v: 0.7 });
const TRUN = TGR + 0.2;
hero.turn(TRUN, 1).obj(TRUN, 'held', { fwd: 0.0, up: 0.1, rot: 0 });                   // 合上夹在胳膊下
const R1 = hero.run(TRUN, K2.x + 1500, { speed: VR, stop: false, ramp: 0.3 });
hero.hand('B', TRUN + 0.01, 'obj', GRIP_UNDER);                                           // 后手托着电脑，前手照样摆
// 滑铲：笔尖贴着头顶冲过去
const S2 = hero.slide(R1.t, { v0: R1.v, dur: 0.55 });
hero.hand('B', R1.t + 0.01, 'obj', GRIP_UNDER);
const R2 = hero.run(S2.t, S2.x + 0.62 * VR, { speed: VR, v0: Math.abs(S2.v), ramp: 0.25, stop: false });
hero.hand('B', S2.t + 0.01, 'obj', GRIP_UNDER);
// 跨跳：笔尖贴地从前面杀回来，从脚底下穿过去
const JD = 0.52;
const J2 = hero.jump(R2.t, { to: R2.x + JD * VR, h: 170, dur: JD, running: true, land: 'run' });
hero.hand('B', R2.t + 0.01, 'obj', GRIP_UNDER);
cues.add(R2.t, 'whoosh_short', { v: 0.7 });
const R3 = hero.run(J2.t, J2.x + 1.05 * VR, { speed: VR, v0: VR, ramp: 0.32 });
hero.hand('B', J2.t + 0.01, 'obj', GRIP_UNDER);
// 停下 → 转身面对追来的笔尖 → 敲 turtle.bye()
const XS = R3.x, TTURN = R3.t + 0.22;
hero.turn(TTURN, -1).obj(TTURN, 'held', HELD).head(TTURN, 18).lean(TTURN, 4);
hero.hand('B', TTURN + 0.05, 'obj', GRIP_UNDER).hand('F', TTURN + 0.15, 'obj', keyPoint);
const TBYE = TTURN + 0.3, BYE = 'turtle.bye()';
code.set(TBYE - 0.3, '').moveTo(TBYE - 0.31, TBYE - 0.3, XS - 430, -540).type(TBYE, BYE, 16);
const TBYE_RUN = TBYE + BYE.length / 16 + 0.08;
code.run(TBYE_RUN, 0.2);
KEYS = keyTimes();
const TF = TBYE_RUN + 0.02, TV = TBYE_RUN + 0.14;                                          // 笔尖停住 / 整条线消失
hero.lean(TBYE_RUN - 0.25, -6).head(TBYE_RUN - 0.25, -6);                                  // 笔尖冲到脸前：往后一缩
hero.lean(TV + 0.3, 6, 0.3).head(TV + 0.3, 24, 0.3);                                       // 松一口气
// 腿一软坐下（电脑放在腿上）
const TSIT = TV + 0.9;
hero.hip(TSIT, [XS + 0.06 * HH, -0.12 * HH], 0.35, 'in').lean(TSIT, -12, 0.4).head(TSIT, 6, 0.4);
hero.foot('F', TSIT + 0.05, [XS - 0.3 * HH, 0], 0.3, 6, 'inOut', false).foot('B', TSIT + 0.1, [XS - 0.24 * HH, 0], 0.3, 6, 'inOut', false);
hero.obj(TSIT, 'held', LOW).sfx(TSIT + 0.35, 'body', { v: 0.7 });
for (let k = 0; k < 4; k++) hero.lean(TSIT + 0.6 + k * 0.42, k % 2 ? -12 : -16, 0.2);     // 喘气
const ADUR = TSIT + 2.6;
cues.add(TT0, 'turtle', { dur: TF - TT0 });
cues.add(TT0 - 0.2, 'music', { t1: TV, bpm: 150 });
cues.add(TV, 'whoosh_short', { v: 0.5 });

// ———————————————— 模拟 ————————————————
for (const c of cues.list) if (!realCue.has(c)) c.t = +clock.real(c.t).toFixed(4);
cam.punches.forEach(p => { p.t = clock.real(p.t); });                                   // 手写的推镜也是动画时间
hero.simulate(ADUR);
flushSfx([lapFall, hi1, ...pile, blast], clock);
const DUR = +clock.real(ADUR).toFixed(2);
const R = ta => clock.real(ta), hx = ta => hero.stateAt(ta).hip[0];

// ———————————————— 笔尖的路线（按人的动作反推：什么时候、在哪里擦身而过）————————————————
// 路点 [动画时间, x, y]；两点之间匀速直线。速度约 2400 px/s（"fastest"）
const VT = 2400, YH = -215, YG = -28, YF = -275;
const tSm = R1.t + 0.27, xSm = hx(tSm);                                                  // 滑铲最低时，笔尖从头顶过去
const tAp = R2.t + JD / 2, xAp = hx(tAp);                                                // 跨跳最高时，笔尖从脚底穿过去
const WP = [];
{
  const xs = K2.x - 1700, d0t = tSm - 0.5, d0x = xSm - VT * 0.5;
  const n = 7;                                                                            // 先是之字形追过来
  for (let i = 0; i <= n; i++) WP.push([lerp(TT0, d0t, i / n), lerp(xs, d0x, i / n), i === n ? YH : i % 2 ? -60 : -700]);
  const d1 = Math.max(600, ((tAp - tSm) * VT + 810 + (xAp - xSm) - 200 - 1200) / 2);    // 贴着头顶冲到前面……
  WP.push([tSm + d1 / VT, xSm + d1, YH]);
  WP.push([tSm + (d1 + 274) / VT, xSm + d1 + 200, YG]);                                  // ……一头扎到地面……
  WP.push([tAp, xAp, YG]);                                                                // ……掉头贴地杀回来，从脚底下穿过
  const gx = XS - 0.22 * HH;                                                              // 最后停在脸前
  const a = Math.max(250, (xAp - 60 - gx + VT * (TF - tAp - 0.1)) / 2);                   // 绕一大圈（画面外），再从背后追上来
  WP.push([tAp + a / VT, xAp - a, YG]);
  WP.push([tAp + a / VT + 0.1, xAp - a - 60, YF]);
  WP.push([TF, gx, YF]);
}
const tipAt = ta => {
  if (ta <= WP[0][0]) return [WP[0][1], WP[0][2], 0];
  for (let i = 0; i < WP.length - 1; i++) {
    const a = WP[i], b = WP[i + 1];
    if (ta <= b[0]) { const u = (ta - a[0]) / (b[0] - a[0] || 1e-6); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u), i]; }
  }
  const z = WP[WP.length - 1]; return [z[1], z[2], WP.length - 1];
};

// ———————————————— 摄像机 ————————————————
// 在节拍上推拉（mv：先稳住，再在 dur 秒内移到新机位），节拍之间稳住；跟拍（track）时按人的位置每 0.2 秒一个关键帧
const plan = [];
let cc = { x: 40, y: -400, z: 0.8 };
const at = (ta, o, ease = 'inOut3') => { cc = { ...cc, ...o }; plan.push({ ta, ...cc, ease }); };
const mv = (ta, dur, o, ease = 'inOut3') => { at(ta, {}, 'linear'); at(ta + dur, o, ease); };
const track = (t0, t1, o) => { for (let ta = t0; ta < t1 + 1e-6; ta += 0.2) at(Math.min(ta, t1), { x: hx(Math.min(ta, t1)) + (o.lead || 0), y: o.y ?? cc.y, z: o.z ?? cc.z }, 'linear'); };
at(0, {});                                                                                // 开场：远景交代（光标 + 掉下来的地方）
mv(L0.t + 0.5, 1.1, { x: -40, y: -170, z: 1.75 });                                        // 落地后推近：主角登场，抬头看光标
mv(U0.t - 0.5, 0.8, { x: -40, y: -300, z: 1.25 });                                        // 站起来：全身
mv(6.0, 0.8, { x: LX - 140, y: -320, z: 1.12 });                                          // 看电脑：人和电脑的双人镜头
mv(8.2, 1.0, { x: HX0 - 140, y: -400, z: 1.02 });                                         // 敲代码：代码 + 人
mv(10.9, 0.5, { x: HX0 + 20, y: -300, z: 1.85 });                                          // 报错后垂头丧气：推近看情绪
mv(12.0, 0.6, { x: HX0 - 140, y: -400, z: 1.02 });
mv(15.0, 0.7, { x: HXK - 80, y: -330, z: 1.0 });                                          // hi 掉出来：看地上
mv(TC1 + 0.04, 0.35, { x: HXK + 650, y: -380, z: 0.82 }, 'out3');                         // 踢飞：镜头甩过去追着 hi
mv(TC1 + 0.85, 0.5, { x: SX + 60, y: -300, z: 1.4 });                                    // 甩回来看主角得意
mv(18.5, 0.8, { x: HX1 - 160, y: -400, z: 1.02 });
mv(23.6, 3.7, { x: HX1 - 60, y: -380, z: 1.4 }, 'inOut');                                // 敲 bomb：慢慢推近（紧张感）
mv(TB, 0.18, { x: EX[0] - 260, y: -430, z: 0.62 }, 'out3');                               // 爆炸：猛地拉成大远景，交代规模
mv(L1.t - 0.1, 0.5, { x: L1.x + 120, y: -280, z: 0.98 });                                 // 落地
mv(L1.t + 1.1, 0.9, { x: L1.x + 40, y: -180, z: 1.8 });                                   // 推近：晕乎乎地爬起来
mv(U1.t + 0.7, 0.8, { x: (U1.x + LX2) / 2, y: -330, z: 1.05 });                          // 人和电脑
mv(K2.t - 0.2, 0.6, { x: K2.x - 260, y: -420, z: 1.02 });                                 // 跪着敲 turtle：代码 + 人
mv(TT0 + 0.05, 0.5, { x: K2.x - 760, y: -420, z: 0.62 });                                 // 白线出现：拉远，看清它从哪来、离人多远
mv(TS0 - 0.05, 0.22, { x: K2.x - 30, y: -200, z: 2.1 }, 'out3');                         // 吓一跳：猛推到脸
mv(TRUN, 0.35, { x: hx(TRUN + 0.35) - 160, y: -320, z: 0.8 });                            // 开跑：拉开跟拍，人在右边、身后留出追来的线
track(TRUN + 0.4, R1.t - 0.32, { lead: -160, y: -320, z: 0.8 });
mv(R1.t - 0.3, 0.25, { x: hx(R1.t - 0.05), y: -190, z: 1.15 });                           // 滑铲：压低、拉近
track(R1.t, S2.t, { lead: 0, y: -190, z: 1.15 });
mv(S2.t, 0.3, { x: hx(S2.t + 0.3) + 320, y: -300, z: 0.74 });                             // 笔尖跑到前面掉头：镜头往前看
track(S2.t + 0.32, J2.t, { lead: 320, y: -300, z: 0.74 });
mv(J2.t, 0.35, { x: hx(J2.t + 0.35) - 60, y: -320, z: 0.95 });
track(J2.t + 0.36, R3.t, { lead: -60, y: -320, z: 0.95 });
mv(TTURN - 0.1, 0.6, { x: XS - 520, y: -380, z: 0.82 });                                  // 转身敲代码：画面左边留给追来的笔尖
mv(TF - 0.55, 0.45, { x: XS - 110, y: -300, z: 1.55 });                                    // 笔尖冲到脸前：推成近景
mv(TSIT + 0.2, 1.4, { x: XS - 80, y: -230, z: 1.2 }, 'inOut');                            // 坐下：慢慢拉开，收尾
at(ADUR, {}, 'linear');
for (const p of plan) cam.key(R(p.ta), { x: p.x, y: p.y, z: p.z, ease: p.ease });

// ———————————————— 画面 ————————————————
const penW = ta => lerp(6, 34, clamp((ta - TT0) / 2.5));                                  // 线越画越粗（pensize 越调越大）
function drawTurtle(ctx, ta) {
  if (ta < TT0) return;
  const a = 1 - clamp((ta - TV) / 0.25);
  if (a <= 0) return;
  const [tx, ty, ti] = tipAt(Math.min(ta, TF));
  ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#fff'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let i = 0; i <= ti; i++) {
    const p = WP[i], q = i < ti ? WP[i + 1] : [0, tx, ty];
    ctx.lineWidth = penW(p[0]);
    ctx.beginPath(); ctx.moveTo(p[1], p[2]); ctx.lineTo(q[1], q[2]); ctx.stroke();
  }
  // 笔尖：turtle 的箭头
  const [px, py] = tipAt(Math.min(ta, TF) - 0.02);
  const ang = Math.atan2(ty - py, tx - px) || 0, s = 1 + penW(ta) / 30;
  ctx.translate(tx, ty); ctx.rotate(ang); ctx.scale(s, s); ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-14, -16); ctx.lineTo(-6, 0); ctx.lineTo(-14, 16); ctx.closePath(); ctx.fill();
  ctx.restore();
}

function draw(ctx, t) {
  const ta = clock.anim(t), c = cam.at(t);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  drawTurtle(ctx, ta);
  code.draw(ctx, ta);
  const s = hero.stateAt(ta), held = (ta >= TG && ta < TB) || ta >= TGR, ld = ta < TB ? 1 : ta < TGR ? LD : s.dir;
  if (!held && s.obj) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, ld);
  if (ta >= hi1.t0) { const [x, y, r] = hi1.at(ta); PR.word(ctx, 'hi', x, y, r); }
  for (const b of pile) if (ta >= b.t0) { const [x, y, r] = b.at(ta); PR.word(ctx, 'hi', x, y, r); }
  if (ta > TC1 && ta < TC1 + 0.45) { const [x, y] = hi1.at(ta), [x0, y0] = hi1.at(ta - 1 / 60); V.motionLines(ctx, x, y, (x - x0) * 60, (y - y0) * 60, { n: 4, spread: 16, len: 0.05, seed: 4 }); }
  if (ta >= TB - 0.1 && ta < TB + 0.05) V.wordBurst(ctx, EX[0], EX[1] - 20, ta - (TB - 0.1), ['BOOM', 'BAM', 'POW'], { n: 6, speed: 300, size: 30, seed: 21 });
  // 跑步时身后的速度线（只在全速时）
  if (ta > TRUN + 0.3 && ta < R3.t - 0.3 && !(ta > R1.t && ta < S2.t)) V.motionLines(ctx, s.hip[0] - 60, s.hip[1] - 50, -VR * 1.6, 0, { n: 5, spread: 110, len: 0.08, seed: Math.floor(t * 20), a: 0.45 });
  if (ta >= T_FALL + 0.04) hero.draw(ctx, ta);                                          // 开始掉之前人在画面外（多等 2 帧，拖影不会从站姿扫过来）
  if (held) {
    const closed = ta > TRUN + 0.06 && ta < TTURN;                                        // 跑的时候合上夹着
    if (closed) { PR.laptop(ctx, s.obj[0], s.obj[1], LW * 0.8, s.obj[2], 0, ld); PR.laptop(ctx, s.obj[0], s.obj[1] - 0.036 * LW, LW * 0.8, s.obj[2], 0, ld); }
    else PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, ld);
  }
  V.explosion(ctx, EX[0], EX[1], t - R(TB), { scale: 1, words: ['BOOM', 'BAM', 'POW'], seed: 31 });
  imp.drawWorld(ctx, t);
  ctx.restore();
}
function post(ctx, t, base) { imp.post(ctx, t, base); }
const bloomAt = t => 0.9 * Math.exp(-Math.max(0, t - R(TB)) * 1.2) * (t >= R(TB) - 0.05 ? 1 : 0);

module.exports = { DUR, draw, post, cam, bloomAt, hero, clock, marks: { L0, U0, K1, HX0, SX, HX1, L1, U1, LX2, FACE, K2, TT0, TRUN, R1, S2, R2, J2, R3, TBYE_RUN, TV, TSIT }, WP };
