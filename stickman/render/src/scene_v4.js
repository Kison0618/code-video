// 样片 v4 开头（SCENE=v4，约 34 秒）：按原片的逻辑重做"从 0 到 1 的探索"，加上角色的内心过程
//   ① 黑屏只有光标在闪 → 电脑、人先后掉下来
//   ② 抬头看见光标 → 爬起来 → 托腮盯着看 → 走过去 → 犹豫着伸手戳一下（光标一抖，手缩回来）→ 看看手 → 再戳 → 没反应 → 挠头
//   ③ 左右张望 → 发现脚边的电脑 → 跪下 → 试探着按一个键 → 光标那里冒出 h → 抬头、低头、猛地再抬头（反应过来）
//      → 再按一个 → 点头 → 敲出 hello
//   ④ 回车 → 报错变红，吓一跳 → 挠头 → 慢慢删掉 → 托腮想 → 想到主意
//   ⑤ print() → 运行，没反应 → 左右看看 → 用力再按一次，还是没反应 → 挠头 → 往括号里加 "hi" → 运行
//   ⑥ hi 变成实物掉出来 → 吓得往后一坐 → 盯着看 → 凑过去戳一戳（hi 晃一下）→ 再戳 → 站起来一脚踢飞 → 得意
// 镜头：按拆解 2.1 节的规则，在节拍上推拉、节拍之间稳住；戳光标用大特写（分镜草图第 3 格）
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E } = K;
const { Clock } = require('./actor2');
const { Actor2 } = require('./acting');
const { Camera } = require('./cam');
const { Code } = require('./code');
const { Body, flushSfx } = require('./phys');
const PR = require('./props');
const V = require('./vfx');
const cues = require('./cues');
const { Impacts } = require('./impact');

const HH = 300, LW = 0.5 * HH;
const clock = new Clock(), cam = new Camera(), imp = new Impacts({ clock, cam });
const realCue = new Set();
const hit = (...a) => { const n = cues.list.length, tr = imp.hit(...a); for (let i = n; i < cues.list.length; i++) realCue.add(cues.list[i]); return tr; };

// ———————————————— 布局 ————————————————
// 光标悬在半空，人伸手够得着的高度；电脑掉在光标左下方；人掉在右边，脸朝左
const CX = -760, CY = -300, CS = 58;                     // 代码左上角 / 字号
const code = new Code({ x: CX, y: CY, size: CS, seed: 4 });
const CUR = [CX + CS * 0.25, CY + CS * 0.12];             // 光标中心（空行时）
const LX = -930;                                          // 电脑铰链（朝左放，键盘对着右边来的人）
const LD = -1;
const GRIP_UNDER = [-0.18 * LW, 0.07 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];

// 按键 → 手指点下去、电脑微震
let KEYS = [];
const keyTimes = () => { const out = []; for (let i = 1; i < code.snaps.length; i++) if (Math.abs(code.snaps[i].text.length - code.snaps[i - 1].text.length) === 1) out.push(code.snaps[i].t); return out; };
function tapAt(t) {
  let d = 0, k = -1;
  for (let i = 0; i < KEYS.length; i++) { const a = t - KEYS[i]; if (a >= -0.03 && a <= 0.12) { k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07); } }
  return { d, k };
}
const keyPoint = t => { const tp = tapAt(t); return [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; };

const hero = new Actor2({ H: HH, x0: -380, dir: -1, clock, lean: 2, headTilt: 0 });
const ST = hero.STAND;

// ———————————————— ① 掉下来 ————————————————
code.blinkSound(0, 3.0);
const lap = new Body({ t0: 0.7, x: LX, y: -1200, vrot: 0.3, r: 0.05 * LW, bounce: 0.25, friction: 0.5, sfx: 'laptop_drop', defer: true });
hero.obj(0, 'rest', t => lap.at(t));
const T_FALL = 1.05;
const L0 = hero.launch(T_FALL, { from: [-380, -1250], vx: 0, vy: 0, lean0: 80, land: 'front' });
hit(L0.t, [-380, -10], 'ground', { sfx: ['thud'], freeze: 0.06, shake: [20, 0.4], punch: 0.03, ring: 380, warp: 6 });
cues.add(L0.t - 0.4, 'whoosh', { v: 0.5 });

// ———————————————— ② 看见光标 → 戳 → 挠头 ————————————————
hero.head(L0.t + 0.1, 8).head(L0.t + 0.5, 0);
let t = hero.notice(L0.t + 1.0, CUR, { hold: 0.7 });                                   // 趴着抬头：那是什么
const U0 = hero.getUp(t, { from: 'front' });
t = hero.look(U0.t - 0.15, CUR, { dur: 0.3 });
t = hero.think(U0.t + 0.2, 1.5, { head: -18 });                                         // 托腮盯着看（好奇）
const XP = CUR[0] + 0.24 * HH;                                                          // 戳得到光标的位置
const Wk = hero.walk(t + 0.05, XP, { stepDur: 0.34 });                                  // 慢慢走过去（试探）
hero.look(Wk.t - 0.3, CUR, { dur: 0.25 });
const P1 = hero.poke(Wk.t + 0.25, CUR, { reach: 0.75 });                                // 犹豫着伸手……戳！
const TP1 = Wk.t + 1.0;
code.jiggle(TP1, 12);
hero.lean(TP1 + 0.05, -8).head(TP1 + 0.05, -30).lean(TP1 + 0.4, 2, 0.3);               // 手缩回来，身子也往后一缩
t = hero.look(P1, [XP + 40, -0.62 * HH], { dur: 0.25 });                                // 看看自己的手
hero.hand('F', P1, 'local', [0.18, -0.02]);
const P2 = hero.poke(P1 + 0.5, CUR, { reach: 0.3 });                                    // 再戳一下（这次快一点）
const TP2 = P1 + 0.8;
code.jiggle(TP2, 9);
hero.hand('F', P2 - 0.1, 'free', [0.05, 0.35]);
t = hero.look(P2, CUR, { dur: 0.2 });
t = hero.scratch(P2 + 0.25, 1.2);                                                       // 没反应……挠头

// ———————————————— ③ 发现电脑 → 按一个键 → 反应过来 ————————————————
hero.look(t + 0.1, [XP + 600, -150], { dur: 0.25 });                                    // 往右看看（转身）
hero.look(t + 0.75, [XP - 400, -150], { dur: 0.25 });                                   // 往左看看
const TN = t + 1.3;
t = hero.notice(TN, [LX + 40, -20], { hold: 0.7 });                                     // 脚边：电脑！
const FRONT = LX - LD * (0.5 * LW + 14);                                                // 跪在电脑右边
const Wk2 = hero.walk(t, FRONT + 0.2 * HH, { stepDur: 0.3 });
const K1 = hero.kneel(Wk2.t - 0.1, { front: FRONT, head: 34, lean: 22 });
const KP = [LX + LD * KEYPT[0], -0.045 * LW - 6];                                       // 键盘上的点（世界坐标）
t = hero.look(K1.t + 0.1, KP, { dur: 0.3 });
const TK1 = K1.t + 0.95;                                                                // 试探着按一个键
hero.poke(TK1 - 0.6, KP, { reach: 0.6, sfx: 'key', retract: false });
code.type(TK1, 'h', 400);
hero.hand('F', TK1 + 0.15, 'local', [0.14, 0.05]);
t = hero.doubleTake(TK1 + 0.3, [CUR[0] + 10, CUR[1]], KP);                              // 抬头看字 → 低头看电脑 → 猛地再抬头
const TK2 = t + 0.1;
hero.poke(TK2 - 0.3, KP, { reach: 0.3, sfx: 'key', retract: false });                   // 再按一个
code.type(TK2, 'e', 400);
hero.look(TK2 + 0.12, [CUR[0] + 40, CUR[1]], { dur: 0.08 });
t = hero.nod(TK2 + 0.35, 2);                                                            // 明白了
hero.look(t, KP, { dur: 0.2 });
hero.hand('B', t, 'obj', GRIP_UNDER).hand('F', t + 0.05, 'obj', keyPoint);
code.type(t + 0.25, 'llo', 9);
const TH = code.tEnd + 0.15;
hero.look(TH + 0.1, [CUR[0] + 90, CUR[1]], { dur: 0.25 });
hero.head(TH + 0.12, -40, 0.3);                                                         // 看着 hello，有点得意（头一歪）

// ———————————————— ④ 回车 → 报错 → 删掉 → 想 ————————————————
const TR1 = TH + 0.9;
code.run(TR1, 0.3, 'touch2').error(TR1 + 0.15, 0, 5, 'NameError');
const TE = TR1 + 0.15;
hero.lean(TE, -22).head(TE, -34).hip(TE, [K1.x + 0.04 * HH, -0.22 * HH]);               // 吓一跳（跪着往后一仰）
hero.hand('F', TE, 'local', [0.16, -0.06]).hand('B', TE + 0.02, 'local', [0.12, -0.02]);
hero.sfx(TE, 'whoosh_short', { v: 0.3 });
hero.lean(TE + 0.5, 14, 0.3).hip(TE + 0.5, [K1.x, -0.235 * HH], 0.3).head(TE + 0.5, -30);
t = hero.scratch(TE + 0.7, 1.0, { head: -34, lean: 16 });
hero.hand('F', t, 'obj', keyPoint).hand('B', t, 'obj', GRIP_UNDER).look(t, KP, { dur: 0.3 });
code.back(t + 0.3, 5, 6);                                                               // 慢慢删掉（有点沮丧）
hero.lean(t + 0.3, 28, 0.5).head(t + 0.3, 44, 0.5);
t = code.tEnd + 0.3;
t = hero.think(t, 1.4, { head: -24 });
t = hero.idea(t + 0.05, { after: -30 });

// ———————————————— ⑤ print() 没反应 → 挠头 → print("hi") ————————————————
hero.hand('F', t, 'obj', keyPoint).hand('B', t, 'obj', GRIP_UNDER).look(t, KP, { dur: 0.2 });
code.type(t + 0.15, 'print()', 9);
t = code.tEnd + 0.3;
hero.look(t, [CUR[0] + 100, CUR[1]], { dur: 0.2 });
code.run(t + 0.25, 0.3);
hero.look(t + 0.9, [CUR[0] - 200, -60], { dur: 0.25 }); hero.look(t + 1.3, [CUR[0] + 300, -60], { dur: 0.25 });   // 东西呢？左看看右看看
const TR3 = t + 1.85;
hero.lean(TR3 - 0.15, 30).look(TR3 - 0.15, KP, { dur: 0.1 });
code.run(TR3, 0.3);                                                                     // 用力再按一次
hero.lean(TR3 + 0.2, 16, 0.3).look(TR3 + 0.3, [CUR[0] + 100, CUR[1]], { dur: 0.2 });
t = hero.scratch(TR3 + 0.8, 1.1, { head: -36, lean: 14 });
t = hero.idea(t, { after: -30 });
hero.hand('F', t, 'obj', keyPoint).hand('B', t, 'obj', GRIP_UNDER).look(t, KP, { dur: 0.2 });
code.cursor(t + 0.2, 6).type(t + 0.35, '"hi"', 7);
t = code.tEnd + 0.35;
hero.look(t, [CUR[0] + 140, CUR[1]], { dur: 0.2 });
const TR4 = t + 0.5;
code.run(TR4);

// ———————————————— ⑥ hi 掉出来 → 吓一跳 → 戳一戳 → 踢飞 ————————————————
const TO = TR4 + 0.08;
cues.add(TO, 'output');
const TKICK = TO + 6.45;
const hi = new Body({ t0: TO, x: CX + 6.5 * CS * 0.5, y: CY + 30, vx: 250, vy: -380, vrot: 2, r: 12, bounce: 0.42, friction: 0.7, sfx: 'tick', defer: true,
  hits: [{ t: TO + 3.9, vx: 60, vy: -260, vrot: 4 }, { t: TO + 4.75, vx: 40, vy: -200, vrot: -3 }, { t: TKICK, vx: 2300, vy: -1250, vrot: 22 }] });
const HXr = hi.at(TO + 3.5)[0];
const TS = TO + 0.18;                                                                   // 吓得往后一坐（转身朝着 hi）
hero.turn(TS, 1).hip(TS, [K1.x - 0.02 * HH, -0.13 * HH], 0.12, 'out3').lean(TS, -24).head(TS, -10);
hero.foot('F', TS + 0.02, [K1.x + 0.28 * HH, 0], 0.18, 10, 'out3', false).foot('B', TS + 0.04, [K1.x + 0.2 * HH, 0], 0.2, 8, 'out3', false);
hero.hand('F', TS, 'local', [0.14, -0.06]).hand('B', TS + 0.02, 'world', [K1.x - 0.14 * HH, 0]);   // 一只手撑地，一只手护在身前
hero.sfx(TS, 'whoosh_short', { v: 0.45 }).sfx(TS + 0.15, 'body', { v: 0.7 });
hero.look(TS + 0.3, [HXr, -12], { dur: 0.4 });
hero.lean(TS + 1.2, -10, 0.6);                                                          // 盯着看……
// 跪着挪过去，俯下身
const K3 = hero.kneel(TO + 2.4, { front: HXr - 0.17 * HH, lean: 48, head: 26 });
hero.hand('F', TO + 2.4, 'free', [0.12, 0.2]).hand('B', TO + 2.4, 'free', [0.02, 0.3]);
hero.look(TO + 2.9, [HXr, -12], { dur: 0.2 });
hero.poke(TO + 3.3, [HXr - 4, -14], { reach: 0.6 });                                    // 戳一戳（hi 晃一下）
hero.poke(TO + 4.4, [HXr + 10, -14], { reach: 0.35 });
hero.hand('F', TO + 5.0, 'free', [0.05, 0.35]).hand('B', TO + 5.0, 'free', [-0.04, 0.35]);
hero.head(TO + 5.0, 30).lean(TO + 5.0, 30);
hero.nod(TO + 5.1, 1);
hero.rise(TO + 5.45, { head: 30 });
// 站起来，一脚踢飞
const SX = HXr - 112;
hero.hip(TO + 5.8, [SX - 10, -ST + 2], 0.3).lean(TO + 5.8, 6).head(TO + 5.8, 30);
hero.foot('F', TO + 5.8, [SX + 24, 0], 0.2, 14).foot('B', TO + 5.9, [SX - 22, 0], 0.2, 14);
hit(TKICK, [HXr - 6, -18], 'light');
const KK = TKICK - 0.24;
hero.hip(KK, [SX - 14, -ST + 8], 0.16).lean(KK, 8).head(KK, 34);
hero.foot('F', KK, [SX - 22, -46], 0.22, 0, 'out3', false).hand('F', KK, 'free', [0.24, 0.12]);
cues.add(TKICK - 0.12, 'whoosh_short', { v: 0.8 });
hero.foot('F', TKICK - 0.075, [HXr - 14, -16], 0.075, 0, 'in', false);
hero.hip(TKICK - 0.075, [SX + 12, -ST + 2]).lean(TKICK - 0.075, -16).head(TKICK - 0.075, 22).hand('F', TKICK - 0.075, 'free', [-0.26, 0.22]);
hero.foot('F', TKICK + 0.01, [HXr + 40, -170], 0.2, 0, 'out3', false).lean(TKICK + 0.01, -24);
hero.foot('F', TKICK + 0.32, [SX + 50, 0], 0.26, 20).hip(TKICK + 0.3, [SX + 26, -ST + 3]).lean(TKICK + 0.3, 4).head(TKICK + 0.3, -6);
hero.hand('F', TKICK + 0.3, 'free', [0.06, 0.34]).foot('B', TKICK + 0.62, [SX + 4, 0], 0.2, 12).hip(TKICK + 0.6, [SX + 26, -ST]);
hero.head(TKICK + 0.9, -14, 0.3);
hero.hand('F', TKICK + 1.2, 'free', [0.2, -0.14]).head(TKICK + 1.2, -18);               // 得意
hero.hand('F', TKICK + 1.9, 'free', [0.05, 0.34]).head(TKICK + 1.9, 2, 0.4);
const ADUR = TKICK + 2.8;

// ———————————————— 模拟 + 音效换算 ————————————————
KEYS = keyTimes();
for (const c of cues.list) if (!realCue.has(c)) c.t = +clock.real(c.t).toFixed(4);
hero.simulate(ADUR);
flushSfx([lap, hi], clock);
const DUR = +clock.real(ADUR).toFixed(2);
const R = ta => clock.real(ta);

// ———————————————— 摄像机 ————————————————
const plan = [];
let cc = { x: -520, y: -330, z: 0.72 };
const at = (ta, o, ease = 'inOut3') => { cc = { ...cc, ...o }; plan.push({ ta, ...cc, ease }); };
const mv = (ta, dur, o, ease = 'inOut3') => { at(ta, {}, 'linear'); at(ta + dur, o, ease); };
at(0, {});                                                                              // 远景：黑底上只有一个光标
mv(L0.t + 0.6, 1.0, { x: -470, y: -230, z: 1.3 });                                      // 趴着抬头：人和光标
mv(U0.t - 0.3, 0.7, { x: -430, y: -290, z: 1.3 });
mv(Wk.t - 0.2, 0.6, { x: CUR[0] + 120, y: -300, z: 1.45 });
mv(Wk.t + 0.5, 0.45, { x: CUR[0] + 60, y: -320, z: 2.4 });                              // 大特写：伸手戳光标
mv(P2 + 0.2, 0.5, { x: CUR[0] + 140, y: -300, z: 1.5 });                                // 挠头
mv(TN - 0.6, 0.6, { x: XP - 120, y: -250, z: 1.05 });                                   // 左右张望：拉开
mv(TN + 0.05, 0.4, { x: (LX + XP) / 2, y: -220, z: 1.35 });                             // 发现电脑
mv(K1.t - 0.1, 0.6, { x: LX + 140, y: -230, z: 1.55 });                                 // 跪着按键：人、电脑、头顶的光标
mv(TK1 + 0.25, 0.3, { x: LX + 160, y: -260, z: 1.7 });                                  // 反应过来：再近一点
mv(TH - 0.6, 0.6, { x: LX + 200, y: -240, z: 1.45 });
mv(TE + 0.6, 0.6, { x: LX + 160, y: -210, z: 1.8 });                                    // 挠头、沮丧：推近
mv(TR1 + 3.6, 0.8, { x: LX + 200, y: -240, z: 1.45 });
mv(TR3 + 0.6, 0.4, { x: LX + 160, y: -210, z: 1.75 });                                  // 又没反应：推近看挠头
mv(TR4 - 0.6, 0.5, { x: LX + 280, y: -230, z: 1.3 });
mv(TO + 0.1, 0.3, { x: (K1.x + HXr) / 2, y: -200, z: 1.2 }, 'out3');                    // hi 掉出来：看清它和人
mv(TO + 2.4, 0.8, { x: HXr - 120, y: -140, z: 1.9 });                                   // 凑过去戳：低机位近景
mv(TO + 5.2, 0.5, { x: HXr - 40, y: -300, z: 1.05 });                                   // 站起来准备踢
mv(TKICK + 0.04, 0.35, { x: HXr + 650, y: -380, z: 0.82 }, 'out3');                     // 踢飞：甩过去追 hi
mv(TKICK + 0.85, 0.5, { x: SX + 60, y: -300, z: 1.35 });                                // 甩回来看得意
at(ADUR, {}, 'linear');
for (const p of plan) cam.key(R(p.ta), { x: p.x, y: p.y, z: p.z, ease: p.ease });

// ———————————————— 画面 ————————————————
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  code.draw(ctx, ta);
  const s = hero.stateAt(ta);
  if (ta >= lap.t0) PR.laptop(ctx, s.obj[0], s.obj[1], LW, s.obj[2], 1, LD);
  if (ta >= hi.t0) { const [x, y, r] = hi.at(ta); PR.word(ctx, 'hi', x, y, r); }
  if (ta > TKICK && ta < TKICK + 0.45) { const [x, y] = hi.at(ta), [x0, y0] = hi.at(ta - 1 / 60); V.motionLines(ctx, x, y, (x - x0) * 60, (y - y0) * 60, { n: 4, spread: 16, len: 0.05, seed: 4 }); }
  if (ta >= T_FALL + 0.04) hero.draw(ctx, ta);
  imp.drawWorld(ctx, tr);
  ctx.restore();
}
function post(ctx, tr, base) { imp.post(ctx, tr, base); }

module.exports = { DUR, draw, post, cam, hero, clock, codes: [code], heroFrom: clock.real(T_FALL + 0.05), marks: { L0, U0, Wk, TP1, TP2, TN, K1, TK1, TK2, TH, TR1, TR3, TR4, TO, TKICK } };
