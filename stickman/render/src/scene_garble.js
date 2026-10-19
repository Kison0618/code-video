// 《火柴人 VS 乱码》（SCENE=garble）——内容见 stickman/剧本/火柴人VS乱码.md
// 目前做到：冷开场（接上一集结尾）+ 第一幕（变量便签、jump()、pet.upper()、列表车厢、索引从 0）+ 乱码诞生（约 1 分 25 秒）
// 写法同 v2：动作、音效写在动画时间上，镜头只写意图；编辑器像交互式窗口，回车只运行最新那一行，旧的行往上滚。
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E, rgba, mulberry32 } = K;
const { Actor2 } = require('./fight');
const { Director } = require('./director');
const { Code } = require('./code');
const { Body, G } = require('./phys');
const { Snake, spline } = require('./snake');
const PR = require('./props');
const GB = require('./garble');

const HH = 300, LW = 0.5 * HH;
const D = new Director(), clock = D.clock, cam = D.cam;
const rnd = mulberry32(31), R2 = () => rnd() * 2 - 1;

// ———————————————— 布局（从左到右：主角跪坐 → 电脑 → 5 → 7 → 小蛇；车厢落在主角身后） ————————————————
const LD = 1;                                                                 // 电脑屏幕朝左（朝着主角）
const FRONT = -250, XK = FRONT - 0.2 * HH, LX = FRONT + 0.5 * LW + 14;        // 跪坐时前脚、胯；电脑放在前面
const X5 = 60, X7 = 240, XSN = 540;                                           // 5、7、小蛇待着的地方
const GRIP_UNDER = [-0.18 * LW, 0.07 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];
const CS = 50, LH = CS * 1.32, CX = LX - 0.4 * HH, YL = -1.62 * HH;           // 代码：最新一行固定在 YL，旧行往上滚
const code = new Code({ x: CX, y: YL, size: CS, seed: 3, cps: 12, topY: YL - 2.5 * LH });   // 只露出最新的三行
let KEYS = [];
const keyTimes = c => { const out = []; for (let i = 1; i < c.snaps.length; i++) if (c.snaps[i].text !== c.snaps[i - 1].text && Math.abs(c.snaps[i].text.length - c.snaps[i - 1].text.length) <= 4) out.push(c.snaps[i].t); return out; };
function tapAt(t) {
  let d = 0, k = -1;
  for (let i = 0; i < KEYS.length; i++) { const a = t - KEYS[i]; if (a >= -0.03 && a <= 0.12) { k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07); } }
  return { d, k };
}
const keyPoint = t => { const tp = tapAt(t); return [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; };
const typing = (a, t) => a.hand('B', t, 'obj', GRIP_UNDER).hand('F', t + 0.05, 'obj', keyPoint);
let nLines = 1;
const newLine = (t, str, cps) => {                                            // 敲新的一行：先把光标挪到末尾，代码整体往上滚一行
  code.cursor(t, code.last().text.length);
  code.moveTo(t + 0.05, t + 0.3, CX, YL - nLines * LH); nLines++;
  code.type(t + 0.1, '\n' + str, cps);
  return code.tEnd;
};
const lastLineStart = () => code.last().text.lastIndexOf('\n') + 1;
const charOf = (t, k) => code.charAt(t, lastLineStart() + k);                // 最新一行第 k 个字的位置
const runLine = t => code.run(t, 0.3, 'run', { line: -1 });
// 抛物线：从 p0 以竖直速度 vy 出发，正好落在 x1（地面 y = gy）所需的横向速度
const vxTo = (p0, x1, vy, gy) => { const T = (vy + Math.sqrt(vy * vy + 2 * G * (gy - p0[1]))) / G; return (x1 - p0[0]) / T; };

const hero = new Actor2({ H: HH, x0: -1900, dir: 1, clock, lean: 2, headTilt: 0 });
const ST = hero.STAND;
let t;

// ════════════════ 冷开场：接上一集结尾（抱着电脑，小蛇在前面带路） ════════════════
const GLINT = [[0.75, 0.8], [1.85, 1.9]];                                     // 右边远处的 � 闪 3 帧（伏笔）
D.cue(0.75, 'glitch', { v: 0.18 }); D.cue(1.85, 'glitch', { v: 0.15 });
hero.obj(0, 'held', { fwd: 0.18, up: 0.06 }).hand('B', 0, 'obj', GRIP_UNDER);
hero.hand('F', 0, 'free', s => [0.05 + 0.08 * Math.sin(s * 8), 0.35]);
const XSTOP = LX - 0.45 * HH;
const W1 = hero.walk(0, XSTOP, { stepDur: 0.36 });
hero.hand('F', W1.t, 'free', [0.05, 0.35]);
D.shot(0, 0.01, { on: [[-250, -150]], kind: 'wide', z: 0.3 });
// 小蛇：在他前面 0.95H 带路；他停下后小蛇再往前游一点，回头（最后一段往左走，头就朝左）
const kS = [];
for (let tk = 0; tk < W1.t; tk += 0.2) kS.push([tk, hero.hipNow(tk)[0] + 0.95 * HH, -30 - 10 * Math.abs(Math.sin(tk * 7))]);
kS.push([W1.t + 0.6, XSN - 150, -32], [W1.t + 1.2, XSN - 30, -30], [W1.t + 1.6, XSN, -30]);   // 慢慢停下（关键帧速度差太大，曲线会冲过头再折回来，三节就挤成一团）
// 看看四周，把电脑放在地上，跪坐下来
hero.look(W1.t + 0.2, [-1300, -200], { dur: 0.3 });
hero.look(W1.t + 0.75, [900, -200], { dur: 0.3 });
t = hero.nod(W1.t + 1.2, 1);
const TPUT = t + 0.15, HELD0 = [XSTOP + 0.18 * HH, -ST - 0.06 * HH];
hero.lean(TPUT, 42, 0.35).head(TPUT, 30, 0.3).hip(TPUT, [XSTOP, -ST + 0.06 * HH], 0.35);
hero.hand('F', TPUT, 'obj', [GRIP_UNDER[0] + 30, GRIP_UNDER[1] - 4]);
hero.obj(TPUT + 0.02, 'rest', s => { const u = E.inOut(clamp((s - TPUT) / 0.4)); return [lerp(HELD0[0], LX, u), lerp(HELD0[1], -0.045 * LW, u), 0]; });
hero.sfx(TPUT + 0.4, 'laptop_drop', { v: 0.4 });
const K1 = hero.kneel(TPUT + 0.55, { front: FRONT, head: 30, lean: 22 });
typing(hero, K1.t);
D.shot(W1.t + 0.6, 2.2, { on: [hero, [XSN + 60, -40], [X7, -0.3 * HH]], kind: 'full' });

// ════════════════ 第一幕 学 ════════════════
// —— x = 5：5 从代码里掉出来，便签 x 飞过去贴上 ——
t = K1.t + 0.35;
hero.look(t, [CX + 80, YL], { dur: 0.25 });
D.shot(t, 0.6, { on: [hero, [CX - 20, YL - 2 * LH - 60], [X5 + 60, 0]], kind: 'medium' });
code.type(t + 0.3, 'x = 5', 10);
const TR1 = code.tEnd + 0.35;
runLine(TR1);
const NUM = { r: 44, hw: 30, bounce: 0.3, friction: 0.55, sfx: 'block_drop', defer: true };
const P5 = code.charAt(TR1, 4);
const n5a = new Body({ ...NUM, t0: TR1 + 0.08, x: P5[0], y: P5[1], vx: vxTo(P5, X5, -380, -NUM.r), vy: -380, vrot: 0.5 });
const TLAND5 = TR1 + 0.08 + (380 + Math.sqrt(380 * 380 + 2 * G * (-NUM.r - P5[1]))) / G;
hero.look(TR1 + 0.15, [X5, -0.2 * HH], { dur: 0.3 });
D.shot(TR1 + 0.1, 0.6, { on: [hero, [X5 + 80, -0.2 * HH], [CX, YL - 2 * LH - 60]], kind: 'full' });
// 便签：每张都是一串阶段，fly = 沿弧线飞（终点跟着目标走），on = 贴在某个东西上（贴上那一下晃一晃）
const tags = [];
const tagX = { text: 'x', ph: [] }; tags.push(tagX);
const TT1 = TLAND5 + 0.12;
let num5At;                                                                    // 5 的位置（掉落 → 被拿起来 → 放下），下面定义
const topOf = (at, up = 0.9) => s => { const p = at(s); return [p[0] + Math.sin(p[2]) * NUM.r * up, p[1] - Math.cos(p[2]) * NUM.r * up - 26, p[2]]; };
tagX.ph.push({ t0: TT1, t1: TT1 + 0.45, from: [code.charAt(TT1, 0)[0], code.charAt(TT1, 0)[1]], to: topOf(s => num5At(s)), arc: 160 });
tagX.ph.push({ t0: TT1 + 0.45, on: topOf(s => num5At(s)) });
D.cue(TT1, 'whoosh_short', { v: 0.3 }); D.cue(TT1 + 0.45, 'label_stick');
// 跪着挪过去，戳戳便签，把 5 抱起来掂掂，放回去
t = TT1 + 1.0;
hero.look(t - 0.3, [X5, -0.3 * HH], { dur: 0.2, tilt: -10 });
const K2 = hero.kneel(t, { front: X5 - 0.17 * HH, head: 34, lean: 30, dur: 0.6 });
const TPK = K2.t + 0.15;
const tagTop5 = () => topOf(s => num5At(s))(TPK + 0.5);
hero.hand('B', K2.t - 0.4, 'free', [-0.04, 0.3]);
t = hero.poke(TPK, [X5 - 6, -2 * NUM.r - 26], { reach: 0.5 });
const TPOKE = TPK + 0.5;
tagX.ph.push({ t0: TPOKE, on: topOf(s => num5At(s)) });                       // 被戳：重新晃一下
const TPICK = t + 0.1, TWEIGH = TPICK + 0.45, TPLACE = TWEIGH + 1.25;
hero.hand('F', TPICK - 0.25, 'world', [X5 - 0.1 * HH, -NUM.r]).lean(TPICK - 0.25, 40, 0.2);
hero.hand('F', TPICK, 'local', [0.22, -0.02]).lean(TPICK, 16, 0.3).head(TPICK, 10, 0.3).sfx(TPICK, 'touch2');
hero.hand('B', TPICK + 0.05, 'local', [0.2, 0.04]);
hero.hand('F', TWEIGH, 'local', s => [0.22, -0.02 + 0.035 * Math.max(0, Math.sin((s - TWEIGH) * 13))]).head(TWEIGH, 16, 0.2);   // 掂一掂
hero.hand('B', TWEIGH, 'local', s => [0.2, 0.04 + 0.035 * Math.max(0, Math.sin((s - TWEIGH) * 13))]);
t = hero.nod(TWEIGH + 0.75, 1);
hero.hand('F', TPLACE - 0.3, 'world', [X5 - 0.04 * HH, -NUM.r - 20]).hand('B', TPLACE - 0.3, 'world', [X5 - 0.12 * HH, -NUM.r - 10]).lean(TPLACE - 0.3, 40, 0.3);
hero.hand('F', TPLACE + 0.15, 'free', [0.05, 0.35]).hand('B', TPLACE + 0.15, 'free', [-0.04, 0.3]);
// 跪着挪回电脑
const K3 = hero.kneel(TPLACE + 0.45, { front: FRONT, head: 30, lean: 22, dur: 0.6 });
typing(hero, K3.t);
// —— x = 7：便签撕下来贴到 7 上，5 垂头丧气 ——
t = K3.t + 0.2;
hero.look(t, [CX + 80, YL], { dur: 0.2 });
D.shot(t - 0.2, 0.5, { on: [hero, [CX - 20, YL - 2 * LH - 60], [X5 + 60, 0]], kind: 'medium' });
code.select(t + 0.2, 4, 5).type(t + 0.45, '7', 6);
const TR2 = code.tEnd + 0.3;
runLine(TR2);
const P7 = code.charAt(TR2, 4);
const n7 = new Body({ ...NUM, t0: TR2 + 0.08, x: P7[0], y: P7[1], vx: vxTo(P7, X7, -420, -NUM.r), vy: -420, vrot: -0.4 });
const TLAND7 = TR2 + 0.08 + (420 + Math.sqrt(420 * 420 + 2 * G * (-NUM.r - P7[1]))) / G;
D.shot(TR2 + 0.1, 0.5, { on: [hero, [X7 + 80, -0.2 * HH], [CX, YL - 2 * LH - 60]], kind: 'full' });
hero.look(TR2 + 0.15, [X7, -0.2 * HH], { dur: 0.3 });
const TTEAR = TLAND7 + 0.25;
tagX.ph.push({ t0: TTEAR, t1: TTEAR + 0.5, from: null, to: topOf(s => n7.at(s)), arc: 120, peel: true });
tagX.ph.push({ t0: TTEAR + 0.5, on: topOf(s => n7.at(s)) });
D.cue(TTEAR, 'label_tear'); D.cue(TTEAR + 0.5, 'label_stick');
const TDROOP = TTEAR + 0.45;                                                  // 5 慢慢歪倒、矮下去
hero.look(TTEAR + 0.1, [X7, -0.4 * HH], { dur: 0.3 });
hero.look(TDROOP + 0.5, [X5, -0.2 * HH], { dur: 0.35, tilt: 12 });
D.shot(TDROOP + 0.2, 0.6, { on: [[X5 - 100, -40], [X5 + 100, -2.5 * NUM.r], hero], kind: 'full' });
// 跪着挪过去拍拍 5；小蛇在那边跟着点头
const K4 = hero.kneel(TDROOP + 1.2, { front: X5 - 0.2 * HH, head: 30, lean: 30, dur: 0.6 });
const TPAT = K4.t + 0.1, PATN = 3;
hero.hand('F', TPAT, 'world', s => [X5 - 8, -2 * NUM.r + 6 - 14 * Math.max(0, Math.sin((s - TPAT) * 10))]).head(TPAT, 24, 0.3);
for (let k = 0; k < PATN; k++) hero.sfx(TPAT + 0.16 + k * 0.63, 'touch2', { v: 0.4 });
const TNUZ = TPAT;
hero.hand('F', TPAT + 1.9, 'free', [0.05, 0.35]);
const K5 = hero.kneel(TPAT + 2.1, { front: FRONT, head: 30, lean: 22, dur: 0.6 });
typing(hero, K5.t);

// —— jump()：还跪着，身体自己弹了起来 ——
t = K5.t + 0.2;
hero.look(t, [CX + 80, YL], { dur: 0.2 });
D.shot(t - 0.1, 0.5, { on: [hero, [CX - 20, YL - 2 * LH - 60], [CX + 360, YL + 20]], kind: 'medium' });
newLine(t + 0.2, 'jump()', 10);
const TJ0 = code.tEnd + 0.4;
runLine(TJ0);
const TJ = TJ0 + 0.12, JD = 0.62, XJ0 = XK, XJ1 = XK - 0.1 * HH;
{ // 没有预备，直接从跪姿弹起来：胯走抛物线，手脚乱挥
  const y0 = -0.235 * HH, y1 = -ST + 0.06 * HH, top = -ST - 0.55 * HH;
  hero.path('hip', TJ, TJ + JD, s => { const u = (s - TJ) / JD; return [lerp(XJ0, XJ1, u), (1 - u) * (1 - u) * y0 + 2 * u * (1 - u) * (2 * top - (y0 + y1) / 2) + u * u * y1]; });
  hero.path('lean', TJ, TJ + JD, s => { const u = (s - TJ) / JD; return 22 - 34 * Math.sin(Math.PI * u) + 8 * Math.sin(u * 19); });
  hero.footFree('F', TJ, s => [0.08 + 0.12 * Math.sin((s - TJ) * 23), 0.38]).footFree('B', TJ + 0.02, s => [-0.06 - 0.12 * Math.sin((s - TJ) * 23 + 1), 0.4]);
  hero.hand('F', TJ, 'local', s => [0.12 + 0.14 * Math.sin((s - TJ) * 26), -0.14 + 0.14 * Math.cos((s - TJ) * 26)]);
  hero.hand('B', TJ, 'local', s => [-0.02 - 0.14 * Math.sin((s - TJ) * 26 + 2), -0.12 + 0.14 * Math.cos((s - TJ) * 26 + 2)]);
  hero.head(TJ, -30).sfx(TJ, 'whoosh_short', { v: 0.6 });
  const TL = TJ + JD;                                                          // 落地踉跄：往后退两步，手臂抡圈
  hero.foot('B', TL, [XJ1 - 0.1 * HH, 0], 0.06, 0, 'out3', { v: 1 }).foot('F', TL, [XJ1 + 0.08 * HH, 0], 0.07, 0, 'out3', false);
  hero.hip(TL, [XJ1, -ST + 0.08 * HH]).lean(TL, -18);
  hero.foot('B', TL + 0.18, [XJ1 - 0.3 * HH, 0], 0.16, 14).hip(TL + 0.15, [XJ1 - 0.2 * HH, -ST + 0.04 * HH], 0.25).lean(TL + 0.15, 14, 0.2);
  hero.foot('F', TL + 0.38, [XJ1 - 0.12 * HH, 0], 0.16, 14).lean(TL + 0.4, -10, 0.2);
  hero.hand('F', TL, 'local', s => [0.05 + 0.2 * Math.sin((s - TL) * 17), -0.1 + 0.2 * Math.cos((s - TL) * 17)]);
  hero.hand('B', TL, 'local', s => [-0.05 - 0.2 * Math.sin((s - TL) * 17), -0.1 - 0.2 * Math.cos((s - TL) * 17)]);
  hero.hip(TL + 0.7, [XJ1 - 0.22 * HH, -ST], 0.25).lean(TL + 0.7, 2, 0.25).foot('F', TL + 0.72, [XJ1 - 0.1 * HH, 0], 0.15, 8).foot('B', TL + 0.72, [XJ1 - 0.32 * HH, 0], 0.15, 8);
  hero.hand('F', TL + 0.75, 'free', [0.05, 0.35]).hand('B', TL + 0.75, 'free', [-0.04, 0.35]);
}
const TLJ = TJ + JD, XST = XJ1 - 0.22 * HH;
D.shot(TJ - 0.05, 0.25, { on: [hero, [XK, -1.3 * HH], [LX, 0]], kind: 'full' }, 'out3');
// 举起两只手看了又看
const THANDS = TLJ + 1.15;
hero.hand('F', THANDS, 'local', s => [0.2, -0.12 + 0.02 * Math.sin((s - THANDS) * 5)]).hand('B', THANDS + 0.05, 'local', s => [0.16, -0.08 - 0.02 * Math.sin((s - THANDS) * 5)]);
hero.head(THANDS, 26, 0.25).head(THANDS + 0.6, 34, 0.3).head(THANDS + 1.1, 20, 0.3);
D.shot(THANDS - 0.1, 0.5, { on: hero, kind: 'close', dy: 30 });
// 弯腰把电脑抱起来（之后一直站着抱着电脑打字）
const TGRAB = THANDS + 1.6;
hero.lean(TGRAB, 48, 0.3).hip(TGRAB, [XST, -ST + 0.1 * HH], 0.3).head(TGRAB, 30, 0.2);
hero.hand('F', TGRAB, 'world', [LX - 0.05 * LW, -0.05 * LW]).hand('B', TGRAB + 0.05, 'world', [LX - 0.3 * LW, -0.03 * LW]);
const TUP = TGRAB + 0.4;
hero.obj(TUP, 'held', { fwd: 0.24, up: 0.05 }).sfx(TUP, 'touch2');
hero.lean(TUP, 2, 0.3).hip(TUP, [XST, -ST], 0.3).head(TUP, 10, 0.3);
typing(hero, TUP);
hero.foot('F', TUP + 0.1, [XST + 0.1 * HH, 0], 0.2, 10);
// —— 再来一次 jump()：这次提前蹲好，跳得很高 ——
t = TUP + 0.5;
hero.look(t, [CX + 80, YL], { dur: 0.2 });
D.shot(t - 0.1, 0.5, { on: [hero, [CX - 20, YL - 2 * LH - 60], [CX + 360, YL + 20]], kind: 'medium' });
newLine(t + 0.15, 'jump()', 13);
const TJ2 = code.tEnd + 0.75;
hero.hip(code.tEnd + 0.1, [XST, -ST + 0.11 * HH], 0.2).lean(code.tEnd + 0.1, 16, 0.2).head(code.tEnd + 0.1, -10, 0.2);   // 先蹲好、憋足劲
hero.hand('F', TJ2 - 0.12, 'obj', keyPoint);
runLine(TJ2 - 0.1);
const J2 = hero.jump(TJ2, { to: XST + 0.05 * HH, h: 0.95 * HH, dur: 0.72 });
hero.footFree('F', TJ2 + 0.12, [0.16, 0.18]).footFree('B', TJ2 + 0.14, [0.04, 0.22]);   // 空中收腿
hero.foot('F', J2.t, [XST + 0.05 * HH + 0.08 * HH, 0], 0.08, 0, 'out3', { v: 1 }).foot('B', J2.t, [XST + 0.05 * HH - 0.08 * HH, 0], 0.09, 0, 'out3', false);
typing(hero, TJ2 + 0.002);
hero.hand('B', TJ2 + 0.003, 'obj', GRIP_UNDER);
const XS2 = XST + 0.05 * HH, TPOSE = J2.t + 0.25;
hero.hand('F', TPOSE, 'local', [0.12, -0.34]).head(TPOSE, -20).lean(TPOSE, -6).sfx(TPOSE, 'rustle', { v: 0.7 });   // 落地摆个姿势
hero.hand('F', TPOSE + 0.9, 'obj', keyPoint).head(TPOSE + 0.9, 0, 0.3).lean(TPOSE + 0.9, 2, 0.3);
D.shot(TJ2 - 0.2, 0.3, { on: [hero, [XS2, -2.0 * HH], [XSN, 0]], kind: 'full' });
// 小蛇也想跳，只离地一点点
const TSH = TPOSE + 0.75;
D.cue(TSH + 0.18, 'tap', { v: 0.3 });
hero.look(TSH, [XSN, -40], { dur: 0.25 });

// —— pet = "hi"：便签贴在小蛇头上，小蛇挺起来 ——
t = TSH + 1.0;
hero.look(t, [CX + 80, YL], { dur: 0.2 });
D.shot(t - 0.1, 0.5, { on: [hero, [CX - 20, YL - 2 * LH - 60], [CX + 460, YL + 20]], kind: 'medium' });
newLine(t + 0.15, 'pet = "hi"', 12);
const TR3 = code.tEnd + 0.3;
runLine(TR3);
const tagP = { text: 'pet', ph: [] }; tags.push(tagP);
const TT3 = TR3 + 0.2, TPROUD = TT3 + 0.55;
tagP.ph.push({ t0: TT3, t1: TT3 + 0.55, from: code.charAt(TT3, lastLineStart() + 1), to: s => { const h = snakeHead(s); return [h[0] - 8, h[1] - 52, 0]; }, arc: 220 });
tagP.ph.push({ t0: TT3 + 0.55, on: s => { const h = snakeHead(s); return [h[0] - 8, h[1] - 52, 0]; } });
D.cue(TT3, 'whoosh_short', { v: 0.3 }); D.cue(TT3 + 0.55, 'label_stick');
D.shot(TR3 + 0.1, 0.6, { on: [hero, [XSN + 60, -0.6 * HH], [CX, YL - 2 * LH - 60]], kind: 'full' });
hero.look(TT3 + 0.2, [XSN, -60], { dur: 0.35 });

// —— print(pet.upper())：巨大的 HI 吼人 ——
t = TPROUD + 1.1;
hero.look(t, [CX + 80, YL], { dur: 0.2 });
D.shot(t - 0.1, 0.5, { on: [hero, [CX - 20, YL - 2 * LH - 60], [CX + 560, YL + 20]], kind: 'medium' });
newLine(t + 0.15, 'print(pet.upper())', 14);
const TR4 = code.tEnd + 0.35;
runLine(TR4);
const HIP0 = code.charAt(TR4, lastLineStart() + 6), HIH = [XS2 + 0.95 * HH, -0.75 * HH];
const THI0 = TR4 + 0.08, THI1 = THI0 + 0.32, TROAR = THI1 + 0.18, TROAR1 = TROAR + 0.9, THIOUT = TROAR1 + 0.25;
D.cue(THI0, 'output'); D.cue(TROAR, 'roar_big', { dur: 0.9 });
hero.look(THI0 + 0.05, HIH, { dur: 0.15 });
{ // 被吹得后仰、往后滑，手挡着脸（电脑还抱着）
  const b = 0.32 * HH;
  hero.lean(TROAR, -30, 0.06, 'out3').head(TROAR, -24, 0.06).hip(TROAR, [XS2 - 0.05 * HH, -ST + 0.04 * HH], 0.06);
  hero.hip(TROAR + 0.08, [XS2 - b, -ST + 0.05 * HH], 0.7, 'out3').foot('F', TROAR + 0.08, [XS2 - b + 0.12 * HH, 0], 0.7, 0, 'out3', false).foot('B', TROAR + 0.1, [XS2 - b - 0.12 * HH, 0], 0.7, 0, 'out3', false);
  hero.hand('F', TROAR, 'local', [0.14, -0.2]);
  hero.sfx(TROAR + 0.1, 'recoil_slide', { dur: 0.6 });
  hero.lean(TROAR1, 2, 0.3).head(TROAR1, -6, 0.3).hip(TROAR1, [XS2 - b, -ST], 0.3).hand('F', TROAR1 + 0.1, 'obj', keyPoint);
}
const XS3 = XS2 - 0.32 * HH;
D.shot(THI0, 0.25, { on: hero, kind: 'close', dy: 20, lead: 0.15 }, 'out3');
D.shot(TROAR1 - 0.1, 0.4, { on: [hero, [XSN + 60, -0.4 * HH], [CX - 20, YL - 2 * LH - 60], [CX + 470, YL]], kind: 'full' });
// 小蛇学着张嘴：只冒出一个很小的 hi
const TSQ = THIOUT + 0.35;
D.cue(TSQ, 'roar_small');
hero.look(TSQ - 0.1, [XSN, -60], { dur: 0.25 });
const TLAUGH = TSQ + 0.45;
for (let k = 0; k < 4; k++) hero.hip(TLAUGH + k * 0.14, [XS3, -ST + (k % 2 ? 0 : 0.025) * HH]);   // 笑得一颤一颤
hero.hip(TLAUGH + 0.6, [XS3, -ST], 0.2).head(TLAUGH, -16, 0.15).head(TLAUGH + 0.6, 0, 0.2);

// —— toys = [...]：三节车厢落在他身后，一节节扣上 ——
t = TLAUGH + 0.9;
hero.look(t, [CX + 80, YL], { dur: 0.2 });
code.moveTo(t - 0.3, t, CX - 0.35 * HH, YL - (nLines - 1) * LH);              // 他往后滑了一点，代码跟过来
const CX2 = CX - 0.35 * HH;
const nl2 = (tt, str, cps) => { code.cursor(tt, code.last().text.length); code.moveTo(tt + 0.05, tt + 0.3, CX2, YL - nLines * LH); nLines++; code.type(tt + 0.1, '\n' + str, cps); return code.tEnd; };
D.shot(t - 0.1, 0.5, { on: [hero, [CX2 - 20, YL - 2 * LH - 60], [CX2 + 820, YL + 20]], kind: 'medium' });
const TOYS = 'toys = ["ball", "box", "rope"]';
nl2(t + 0.15, TOYS, 17);
const TR5 = code.tEnd + 0.3;
runLine(TR5);
const CARW = 175, CARH = 88, XC0 = XS3 - 2.8 * HH;                            // 车厢：从左到右 ball / box / rope
const ITEMS = ['ball', 'box', 'rope'];
const cars = ITEMS.map((w, i) => {
  const from = code.charAt(TR5, lastLineStart() + TOYS.indexOf('"' + w) + w.length / 2 + 1);
  const t0 = TR5 + 0.1 + i * 0.22, t1 = t0 + 0.55;
  return { w, i, from, t0, t1, x: XC0 + i * (CARW + 26), tlink: t1 + 0.12 };
});
cars.forEach(c => { D.cue(c.t0, 'output', { v: 0.6 }); D.cue(c.t1, 'block_drop', { v: 0.5 }); if (c.i > 0) D.cue(c.tlink, 'car_clack'); });
const TCARS = cars[2].tlink;
hero.look(TR5 + 0.2, [XC0 + 200, -0.5 * HH], { dur: 0.3 });
D.shot(TR5 + 0.1, 0.7, { on: [hero, [XC0 - 120, -0.6 * HH], [CX2 + 780, YL - 2 * LH - 60], [XSN + 80, 0]], kind: 'wide' });
hero.turn(TCARS + 0.25, -1).obj(TCARS + 0.25, 'held', { fwd: 0.24, up: 0.05 });
// —— toys[1]：想拿第一个，蹦出来的是 box ——
t = TCARS + 0.6;
D.shot(t - 0.1, 0.6, { on: [hero, [XC0 - 100, -0.5 * HH], [CX2 + 780, YL - 2 * LH - 60]], kind: 'full' });
nl2(t + 0.1, 'toys[1]', 11);
const TR6 = code.tEnd + 0.3;
runLine(TR6);
const TPOP1 = TR6 + 0.12;
D.cue(TPOP1, 'pop_open');
const box = new Body({ t0: TPOP1, x: cars[1].x, y: -CARH * 0.9, vx: 430, vy: -820, vrot: 3, r: 18, hw: 34, bounce: 0.3, friction: 0.6, sfx: 'tick', defer: true });
hero.look(TPOP1 + 0.1, [cars[1].x, -1.2 * HH], { dur: 0.2 });
hero.look(TPOP1 + 0.7, [cars[1].x + 150, -20], { dur: 0.25 });
t = hero.doubleTake(TPOP1 + 1.1, [cars[1].x + 150, -20], [CX2 + 200, YL]);
const TIDX = t + 0.1;                                                         // 车厢底下浮出 0 1 2
t = hero.scratch(TIDX - 0.2, 1.0, { head: -12 });
hero.hand('F', t, 'obj', keyPoint);
hero.look(TIDX + 0.3, [XC0 + CARW, -1.3 * CARH], { dur: 0.3 });
D.cue(TIDX, 'cond_true', { v: 0.4 });
// —— toys[0]：ball 蹦出来，滚到他脚边，他一脚踢给小蛇，小蛇顶回来 ——
t = TIDX + 1.3;
hero.look(t, [CX2 + 200, YL], { dur: 0.2 });
const I1 = code.last().text.length - 2;
code.select(t + 0.15, I1, I1 + 1).type(t + 0.35, '0', 6);
const TR7 = code.tEnd + 0.3;
runLine(TR7);
const TPOP0 = TR7 + 0.12;
D.cue(TPOP0, 'pop_open');
hero.turn(TPOP0 + 0.6, 1);                                                    // 球滚过来；他转身，踢向小蛇
const XKICK = XS3 + 0.06 * HH, TKICK = TPOP0 + 1.6;
hero.look(TPOP0 + 0.1, [cars[0].x, -1.2 * HH], { dur: 0.2, turn: false });
const ball0 = { t0: TPOP0, x: cars[0].x, y: -CARH * 0.9, vx: (XKICK - 0.05 * HH - cars[0].x) / 1.45, vy: -760, vrot: 6, r: 20, hw: 40, bounce: 0.35, friction: 0.97, sfx: 'tick', defer: true };
let ball = new Body(ball0);
const TRET = (() => {                                                          // 先模拟踢出去的那段，算出碰到小蛇头的时刻
  const b = new Body({ ...ball0, hits: [{ t: TKICK, vx: 1100, vy: -380, vrot: 9 }] });
  for (let s = TKICK; s < TKICK + 3; s += 1 / 240) if (b.at(s)[0] >= XSN - 30) return s;
  return TKICK + 0.8;
})();
const TTRAP = TRET + 0.9;
ball = new Body({ ...ball0, hits: [{ t: TKICK, vx: 1100, vy: -380, vrot: 9 }, { t: TRET, vx: -800, vy: -520, vrot: -8 }] });
const XTRAP = (() => { for (let s = TRET; s < TRET + 3; s += 1 / 240) if (ball.at(s)[0] <= XKICK + 0.25 * HH && ball.at(s)[1] > -60) return [s, ball.at(s)[0]]; return [TTRAP, XKICK + 0.25 * HH]; })();
ball = new Body({ ...ball0, hits: [{ t: TKICK, vx: 1100, vy: -380, vrot: 9 }, { t: TRET, vx: -800, vy: -520, vrot: -8 }, { t: XTRAP[0], vx: 0, vy: 0, vrot: 0 }] });
D.cue(TKICK, 'impact_light', { v: 0.5 }); D.cue(TRET, 'tap', { v: 0.6 }); D.cue(XTRAP[0], 'tap', { v: 0.4 });
{ // 踢：后撤一点 → 前脚一甩 → 收回
  hero.lean(TKICK - 0.14, -8).foot('F', TKICK - 0.14, [XKICK - 0.05 * HH, 0.0], 0.1, 10, 'out', false);
  hero.footPath('F', TKICK - 0.04, s => { const u = clamp((s - TKICK + 0.04) / 0.18); return [lerp(XKICK - 0.05 * HH, XKICK + 0.3 * HH, E.out(u)), -0.18 * HH * Math.sin(Math.PI * u)]; });
  hero.foot('F', TKICK + 0.22, [XKICK + 0.12 * HH, 0], 0.15, 6).lean(TKICK + 0.05, 10).lean(TKICK + 0.3, 2, 0.2);
  hero.look(TKICK + 0.1, [XSN, -60], { dur: 0.2 });
  // 球回来：用脚踩住
  const XT = XTRAP[1];
  hero.footPath('F', XTRAP[0] - 0.12, s => { const u = clamp((s - XTRAP[0] + 0.12) / 0.12); return [lerp(XKICK + 0.12 * HH, XT - 6, E.inOut(u)), -0.1 * HH * Math.sin(Math.PI * Math.min(1, u * 0.6 + 0.4))]; });
  hero.foot('F', XTRAP[0] + 0.02, [XT - 6, -24], 0.05, 0).lean(XTRAP[0], 6, 0.1);
  hero.look(XTRAP[0] - 0.4, [XT, -20], { dur: 0.2 });
}
D.shot(TPOP0 + 0.4, 0.8, { on: [hero, [cars[0].x - 80, -0.6 * HH], [XSN + 120, -0.4 * HH], [CX2 + 780, YL - 2 * LH - 60]], kind: 'wide' });
const TTR = XTRAP[0];

// —— prnit(toys)：报错 → 红字抖成乱码 → 那一团动了 ——
t = TTR + 0.6;
hero.look(t, [CX2 + 200, YL], { dur: 0.2 }).valueOf();
hero.foot('F', t + 0.05, [XKICK + 0.08 * HH, 0], 0.2, 10);
D.shot(t - 0.1, 0.5, { on: [hero, [CX2 - 20, YL - 2 * LH - 60], [CX2 + 780, YL + 20]], kind: 'medium' });
const PRN = 'prnit(toys)';
nl2(t + 0.12, PRN, 22);
const TR8 = code.tEnd + 0.15, TE8 = TR8 + 0.15;
runLine(TR8);
code.error(TE8, lastLineStart(), lastLineStart() + 5, 'NameError');
const XE = hero.hipNow(TE8)[0];
hero.lean(TE8, -22).head(TE8, -30).hip(TE8, [XE - 0.05 * HH, -ST + 0.03 * HH]).sfx(TE8, 'whoosh_short', { v: 0.3 });   // 红光推得后退两步
hero.foot('B', TE8 + 0.04, [XE - 0.3 * HH, 0], 0.16, 12).hip(TE8 + 0.1, [XE - 0.22 * HH, -ST + 0.02 * HH], 0.3).foot('F', TE8 + 0.25, [XE - 0.08 * HH, 0], 0.16, 10);
hero.lean(TE8 + 0.45, 2, 0.3).head(TE8 + 0.45, 0, 0.3).hip(TE8 + 0.45, [XE - 0.2 * HH, -ST], 0.3);
D.punch(TE8, 0.04, 0.4);
const XE2 = XE - 0.2 * HH, TDUST = TE8 + 0.8;
hero.hand('F', TDUST, 'local', s => [0.06 + 0.05 * Math.sin((s - TDUST) * 28), 0.02]).head(TDUST, 26, 0.2);   // 拍拍身上（早习惯了）
for (let k = 0; k < 3; k++) hero.sfx(TDUST + 0.08 + k * 0.22, 'rustle', { v: 0.4 });
hero.hand('F', TDUST + 0.7, 'obj', keyPoint).head(TDUST + 0.7, 0, 0.2);
// 红字没有消失，开始抖：一个字一个字变成乱码，掉下来挤成一团
const TGL = TDUST + 1.0, ELBL = 'NameError';
code.clearErr(TGL);
const EP0 = (() => { const p = code.charAt(TGL, lastLineStart()); return [p[0] - CS * 0.25, p[1] + CS * 0.32 + CS * 0.62 - CS * 0.1]; })();
const XCL = XE2 + 0.95 * HH;                                                  // 乱码团落在他前面
const clump = new GB.Clump({ seed: 7, n: ELBL.length, size: 40, center: s => [XCL + (s > TTW ? 16 * E.out(clamp((s - TTW) / 0.25)) : 0), 0], walk: s => clamp(1 - Math.abs(s - TTW - 0.12) / 0.14) });
const GL = Array.from(ELBL).map((ch, i) => ({ ch, i, p0: [EP0[0] + i * CS * 0.15, EP0[1]], tsw: TGL + 0.08 + rnd() * 0.45, tf: TGL + 0.6 + i * 0.05 + rnd() * 0.06, vx: (XCL - EP0[0]) / 0.75 + R2() * 260, vr: R2() * 8 }));
const TASM = Math.max(...GL.map(g => g.tf)) + 0.95, TTW = TASM + 1.1;
D.cue(TGL + 0.05, 'glitch', { v: 0.5 }); D.cue(TGL + 0.3, 'garble', { v: 0.4 }); D.cue(TGL + 0.62, 'whoosh_short', { v: 0.25 });
D.cue(TASM, 'assemble', { v: 0.5 }); D.cue(TTW, 'glitch_crawl', { v: 0.6 });
hero.look(TGL + 0.1, [EP0[0] + 40, EP0[1]], { dur: 0.2, tilt: -10 });
hero.look(TGL + 0.7, [XCL, -40], { dur: 0.3 });
hero.lean(TASM + 0.2, 18, 0.5).head(TASM + 0.2, 34, 0.5);                    // 凑近看
hero.lean(TTW + 0.05, -12, 0.05).head(TTW + 0.05, 10).lean(TTW + 0.3, 6, 0.4);   // 它动了：身子一缩
D.shot(TGL + 0.4, 0.6, { on: [hero, [XCL, -0.4 * HH], [CX2 - 20, YL - 2 * LH - 60], [CX2 + 780, YL]], kind: 'full' });
D.shot(TASM - 0.2, 2.6, { on: [hero, [XCL + 40, -40]], kind: 'medium', dy: 30 });
code.fadeOut(TASM - 0.4);                                                   // 最后的近景只看他和乱码
const ADUR = TTW + 2.6;

// ———————————————— 小蛇 ————————————————
kS.sort((a, b) => a[0] - b[0]);
const SBOB = s => {
  let dx = 0, dy = 0;
  if (s > TNUZ && s < TNUZ + 1.9) { dx += 8 * Math.sin((s - TNUZ) * 9); dy += -12 * Math.abs(Math.sin((s - TNUZ) * 6)); }        // 蹭 5
  if (s > TSH && s < TSH + 0.4) dy += -26 * Math.sin(Math.PI * (s - TSH) / 0.4);                                                   // 小小一跳
  if (s > TPROUD) dy += -18 * E.out(clamp((s - TPROUD) / 0.3)) * (1 - clamp((s - TPROUD - 1.4) / 0.4));                            // 挺起来
  if (s > TSQ - 0.1 && s < TSQ + 0.4) dy += -14 * Math.sin(Math.PI * (s - TSQ + 0.1) / 0.5);
  if (s > TRET - 0.12 && s < TRET + 0.3) dx += 14 * Math.sin(Math.PI * clamp((s - TRET + 0.12) / 0.42));                           // 用头顶球
  return [dx, dy];
};
const snake = new Snake({ t0: 0, t1: ADUR, gap: 58, max: 3, head: spline(kS), size: 46, plain: true, bob: SBOB, wig: s => (s > TNUZ && s < TNUZ + 1.9 ? 16 : 8) });
function snakeHead(s) { const g = snake.segs(s); return g.length ? [g[0].x, g[0].y] : [XSN, -30]; }

// ———————————————— 模拟 ————————————————
KEYS = keyTimes(code).concat([TJ2 - 0.12]).sort((a, b) => a - b);
hero.simulate(ADUR, { sfx: false });
const handAt = s => hero.jointsAt(s).aF[2];
const n5b = (() => { const p = handAt(TPLACE); return new Body({ ...NUM, t0: TPLACE, x: p[0] + 4, y: p[1] - NUM.r * 0.6, vx: 0, vy: 0 }); })();
num5At = s => {
  if (s < TPICK) return n5a.at(s);
  if (s < TPLACE) { const p = handAt(s), q = hero.jointsAt(s).aB[2]; return [(p[0] + q[0]) / 2 + 2, (p[1] + q[1]) / 2 - NUM.r * 0.6, 0]; }
  return n5b.at(s);
};
D.finalize({ actors: [hero], bodies: [n5a, n7, n5b, box, ball], dur: ADUR, start: { x: -250, y: -150, z: 0.3 } });
const DUR = D.DUR;

// ———————————————— 画面 ————————————————
function tagPos(tg, s) {
  let cur = null, prev = null;
  for (const p of tg.ph) { if (p.t0 <= s) { prev = cur; cur = p; } }
  if (!cur) return null;
  if (cur.on) { const q = cur.on(s), a = s - cur.t0; return [q[0], q[1], q[2] + 0.35 * Math.exp(-a * 6) * Math.sin(a * 24)]; }
  const u = clamp((s - cur.t0) / (cur.t1 - cur.t0)), e = E.inOut(u);
  const a = cur.from ? (typeof cur.from === 'function' ? cur.from(cur.t0) : cur.from) : (prev && prev.on ? prev.on(cur.t0) : [0, 0, 0]);
  const b = cur.to(s);
  let rot = Math.sin(Math.PI * u) * 0.6;
  if (cur.peel && u < 0.25) rot = -1.2 * Math.sin(Math.PI * u / 0.5);                                  // 撕下来：先翘起来
  return [lerp(a[0], b[0], e), lerp(a[1], b[1], e) - (cur.arc || 120) * Math.sin(Math.PI * u), rot];
}
function drawNum(ctx, str, p, o = {}) {
  ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(p[2] + (o.tilt || 0));
  ctx.translate(0, NUM.r); ctx.scale(1 + (o.wide || 0), o.sq || 1); ctx.translate(0, -NUM.r);
  PR.word(ctx, str, 0, 4, 0, 120, 1, [235, 235, 235]);
  ctx.restore();
}
function drawCar(ctx, c, s) {
  if (s < c.t0) return;
  const u = clamp((s - c.t0) / (c.t1 - c.t0)), e = E.inOut(u);
  const x = lerp(c.from[0], c.x, e), y = lerp(c.from[1], -CARH / 2, E.in(u)) - 200 * Math.sin(Math.PI * u), rot = (1 - e) * (c.i - 1) * 0.6;
  const sq = u >= 1 ? 1 - 0.08 * Math.exp(-(s - c.t1) * 12) * Math.cos((s - c.t1) * 30) : 1;
  const pop = c.i === 1 ? clamp(1 - Math.abs(s - TPOP1 - 0.05) / 0.2) : c.i === 0 ? clamp(1 - Math.abs(s - TPOP0 - 0.05) / 0.2) : 0;
  ctx.save(); ctx.translate(x, y + CARH / 2); ctx.rotate(rot); ctx.scale(1 + 0.05 * pop, sq); ctx.translate(0, -CARH / 2);
  ctx.lineWidth = 6; ctx.strokeStyle = rgba([214, 214, 214]); ctx.fillStyle = rgba([255, 255, 255], 0.35 * pop);
  ctx.beginPath(); ctx.roundRect(-CARW / 2, -CARH / 2, CARW, CARH, 12); ctx.fill(); ctx.stroke();
  PR.word(ctx, `"${c.w}"`, 0, 2, 0, 40);
  ctx.restore();
  if (c.i > 0 && s >= c.tlink) {                                                                     // 两节之间扣上一个逗号
    const k = clamp((s - c.tlink) / 0.08);
    PR.word(ctx, ',', c.x - CARW / 2 - 13, -CARH * 0.42, 0, 50 * (0.5 + 0.5 * k), k);
  }
  if (s >= TIDX) {                                                                                   // 索引：车厢上方浮出 0 1 2
    const k = clamp((s - TIDX - c.i * 0.12) / 0.2);
    PR.word(ctx, String(c.i), c.x, -CARH - 34 - 10 * (1 - k), 0, 40, k, [120, 170, 230]);
  }
}
function drawGlints(ctx, s) {
  for (const [a, b] of GLINT) if (s >= a && s < b) GB.drawGlyph(ctx, '�', 1500, -40, 0, 70, 1, 1);
}
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  drawGlints(ctx, ta);
  code.draw(ctx, ta);
  // 红字抖成乱码、掉下来（在代码上画，代码自己的报错字已经清掉）
  if (ta >= TGL && ta < TASM + 0.4) {
    for (const g of GL) {
      const sw = ta >= g.tsw, glyph = sw ? GB.gly(700 + g.i, ta) : g.ch;
      const red = 1 - clamp((ta - g.tsw) / 0.3);
      const col = [lerp(206, 230, red), lerp(206, 40, red), lerp(206, 40, red)];
      let p, size;
      if (ta < g.tf) { p = [g.p0[0] + (sw ? R2() * 0 : 0), g.p0[1], 0]; size = CS * 0.3 * (sw ? 1.5 : 1); }
      else { const q = GB.fall(g.p0, g.vx, g.tf, ta, 40, { vr: g.vr }); p = q; size = lerp(CS * 0.45, 40 * clump.home[g.i].s, clamp((ta - g.tf) / 0.5)); }
      if (ta >= TASM) continue;                                                                      // 之后交给乱码团画
      GB.drawGlyph(ctx, glyph, p[0], p[1], p[2], size, 1, GB.glitchAt(700 + g.i, ta), col);
    }
  }
  if (ta >= TASM) clump.draw(ctx, ta, {
    from: (i, s) => {                                                                                // 散落的字一跳一跳地聚过来
      const g = GL[i], u = clamp((s - TASM - i * 0.03) / 0.35);
      if (u >= 1) return null;
      const a = GB.fall(g.p0, g.vx, g.tf, TASM, 40, { vr: g.vr }), b = clump.homeAt(i, s);
      return [lerp(a[0], b[0], E.inOut(u)), lerp(a[1], b[1], E.inOut(u)) - 60 * Math.sin(Math.PI * u), lerp(a[2], b[2], u)];
    },
  });
  // 数字、车厢、球
  if (ta >= n5a.t0) {
    const dr = clamp((ta - TDROOP) / 0.9), patk = ta > TPAT && ta < TPAT + 1.9 ? Math.max(0, Math.sin((ta - TPAT) * 10)) : 0;
    drawNum(ctx, '5', num5At(ta), { tilt: -0.32 * E.inOut(dr), sq: 1 - 0.1 * E.inOut(dr) - 0.06 * patk, wide: 0.04 * patk });
  }
  if (ta >= n7.t0) drawNum(ctx, '7', n7.at(ta));
  for (const cr of cars) drawCar(ctx, cr, ta);
  if (ta >= box.t0) { const [x, y, r] = box.at(ta); PR.word(ctx, '"box"', x, y, r, 40); }
  if (ta >= ball.t0) { const [x, y, r] = ball.at(ta); PR.word(ctx, '"ball"', x, y, r, 40); }
  for (const cr of cars) if (ta >= cr.t1) { const fx = cars[0].x - CARW / 2 - 26, lx = cars[2].x + CARW / 2 + 26; const k = clamp((ta - TCARS) / 0.1);
    if (cr.i === 0) { PR.word(ctx, '[', fx, -CARH / 2, 0, 110, k); PR.word(ctx, ']', lx, -CARH / 2, 0, 110, k); } }
  // 小蛇（背后）→ 电脑 → 主角
  snake.draw(ctx, ta, 'back');
  const s = hero.stateAt(ta), held = ta >= TUP;
  if (!held) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, LD);
  hero.draw(ctx, ta);
  if (held) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, s.dir);
  // 大 HI：从代码里飞出来，停在他面前吼，吼完往上飘散
  if (ta >= THI0 && ta < THIOUT + 0.5) {
    const u = clamp((ta - THI0) / (THI1 - THI0)), roar = ta >= TROAR && ta < TROAR1 ? 1 : 0;
    const x = lerp(HIP0[0], HIH[0], E.out(u)), y = lerp(HIP0[1], HIH[1], E.out(u)) - 80 * Math.sin(Math.PI * u);
    const pulse = roar ? 1 + 0.06 * Math.sin((ta - TROAR) * 40) : 1, sz = lerp(60, 230, E.out(u)) * pulse * (ta > TROAR ? 1.08 : 1);
    const out = clamp((ta - TROAR1) / 0.45);
    if (out <= 0) PR.word(ctx, 'HI', x + (roar ? 4 * Math.sin(ta * 90) : 0), y, 0, sz, 1, [240, 240, 240]);
    else { const rr = mulberry32(9); for (let k = 0; k < 2; k++) PR.word(ctx, 'HI'[k], x + (k - 0.5) * sz * 0.5 + (rr() - 0.5) * 200 * out, y - 220 * out * (0.6 + rr()), (rr() - 0.5) * 3 * out, sz * (1 - 0.6 * out), 1 - out, [240, 240, 240]); }
    if (roar) {                                                                                     // 风：一道道横线吹向他
      const rr = mulberry32(Math.floor(ta * 30));
      ctx.save(); ctx.strokeStyle = 'rgba(220,220,220,0.55)'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let k = 0; k < 7; k++) { const yy = HIH[1] + (rr() - 0.5) * 2.2 * HH, x0 = HIH[0] - 160 - rr() * 200, len = 120 + rr() * 220; ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 - len, yy); ctx.stroke(); }
      ctx.restore();
    }
  }
  if (ta >= TSQ && ta < TSQ + 0.9) {                                                                 // 小蛇冒出的小小 hi
    const a = ta - TSQ, h = snakeHead(TSQ);
    PR.word(ctx, 'hi', h[0] - 10, h[1] - 50 - 90 * E.out(clamp(a / 0.5)), 0, 26 + 8 * Math.exp(-a * 8), 1 - clamp((a - 0.5) / 0.4));
  }
  for (const tg of tags) { const p = tagPos(tg, ta); if (p) PR.nameTag(ctx, tg.text, p[0], p[1], p[2], 30); }
  snake.draw(ctx, ta, 'front');
  D.imp.drawWorld(ctx, tr);
  ctx.restore();
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }

module.exports = { DUR, draw, post, cam, hero, clock, codes: [code], beats: [],
  marks: { W1: W1.t, TR1, TLAND5, TPICK, TR2, TTEAR, TDROOP, TPAT, TJ, THANDS, TUP, TJ2, TR3, TR4, TROAR, TR5, TR6, TIDX, TR7, TKICK, TRET, TR8, TGL, TASM, TTW, ADUR } };
