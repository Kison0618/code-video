// 打击特效样片（约 18 秒）：四种力度的打击，全部用 v2 动作系统 + 打击感系统（impact.js）
//   ① 轻击   hi 从天上掉下来 → 一脚踢飞（停顿帧、星芒、冲击环）
//   ② 重击   print(hi) 运行报错变红 → 恼了，蓄力一拳把这行代码打碎：字符四散落地弹跳（反色冲击帧、冲击波扭曲、推镜、震屏）
//   ③ 砸地   一台电脑从天上砸下来：地面冲击波、灰尘、扭曲；人吓得往后一跳
//   ④ 巨大   扎马步蓄力 2 秒（能量球、吸入线、画面压暗、身体越来越抖）→ 释放光束 → 电脑爆炸，代码词四散；人被反冲力推着往后滑
// 所有动作写在动画时间上；所有打击先登记进时钟（停顿帧），再模拟角色。
'use strict';
const K = require('./core');
const { C, W, H, clamp, lerp, E } = K;
const { Actor2, Clock } = require('./actor2');
const { Camera } = require('./cam');
const { Code } = require('./code');
const { Body, flushSfx } = require('./phys');
const PR = require('./props');
const V = require('./vfx');
const cues = require('./cues');
const { Impacts, Shatter, charge } = require('./impact');

const HH = 300, LW = 0.5 * HH;
const clock = new Clock(), cam = new Camera(), imp = new Impacts({ clock, cam });
const STAND = 0.44 * HH;
const X0 = -170;

// ———————————————— ① 轻击：踢飞 hi ————————————————
const TC1 = 2.4;
const hiBody = new Body({ t0: 0.35, x: -40, y: -900, vrot: 0.6, r: 12, bounce: 0.42, friction: 0.7, sfx: 'tick', defer: true,
  hits: [{ t: TC1, vx: 2400, vy: -1350, vrot: 26 }] });
const HX = hiBody.at(1.9)[0];
const SX = HX - 112;                                 // 踢的时候胯的位置
imp.hit(TC1, [HX - 6, -18], 'light');

// ———————————————— ② 重击：一拳打碎代码 ————————————————
const CODE_X = SX + 250, CODE_Y = -236, CODE_SZ = 54, CW = CODE_SZ * 0.5;
const code = new Code({ x: CODE_X, y: CODE_Y, size: CODE_SZ, seed: 9, show: [3.55, 1e9] });
const codeCues = [cues.list.length];                 // 代码的键盘声是按动画时间登记的，等停顿帧都登记完再换算成真实时间
code.type(3.9, 'print(hi)', 9).run(5.1, 0.32, 'touch2').error(5.25, 0, 9, 'NameError');
codeCues.push(cues.list.length);
const TC2 = 6.72, HIT2 = [CODE_X + 0.3 * CW, CODE_Y - CODE_SZ * 0.32];
code.hide(TC2 + 0.001);
imp.hit(TC2, HIT2, 'heavy');
cues.add(clock.real(TC2), 'shatter');
const shatter = new Shatter({ code, line: 'print(hi)', ta: TC2, hit: [HIT2[0] - 30, HIT2[1] + 10], power: 1.1, seed: 5 });

// ———————————————— ③ 砸地：电脑从天上掉下来 ————————————————
const B3 = SX + 90;                                   // ③④ 的站位
const LAP_X = B3 + 300;
const TE = 14.02;                                    // ④ 爆炸时刻（电脑被炸飞要提前写进它的物理）
const lap = new Body({ t0: 8.6, x: LAP_X, y: -1500, vy: 150, vrot: 0.5, r: 0.05 * LW, bounce: 0.22, friction: 0.5, sfx: 'laptop_drop', defer: true,
  hits: [{ t: TE, vx: 1300, vy: -2400, vrot: 22 }] });
let TL = lap.t0; for (let t = lap.t0; t < lap.t0 + 3; t += 1 / 240) { if (lap.at(t)[1] >= -0.05 * LW - 0.5) { TL = t; break; } }
lap.events = lap.events.filter(e => Math.abs(e.t - TL) > 0.02);      // 第一次触地由砸地音效负责
imp.hit(TL, [LAP_X, -4], 'ground');

// ———————————————— ④ 巨大：蓄力 → 光束 → 爆炸 ————————————————
const TCH = 11.9, TB = 13.9;                          // 蓄力开始 / 释放
imp.hit(TB, [B3 + 40, -230], 'medium', { sfx: ['release'], ring: 300, rays: 0, sparks: 0, invert: 0, flash: 0.15, lines: 0.2 });
imp.hit(TE, [LAP_X, -70], 'huge', { glow: true });
cues.add(clock.real(TE), 'boom'); cues.add(clock.real(TE + 0.4), 'debris');
cues.add(clock.real(TCH), 'charge', { dur: TB - TCH });
for (let k = 0; k < 8; k++) cam.shake(clock.real(TCH + 0.25 * k), 1.5 + k * 1.3, 0.32);   // 蓄力时越来越抖

for (let i = codeCues[0]; i < codeCues[1]; i++) cues.list[i].t = +clock.real(cues.list[i].t).toFixed(4);

// ———————————————— 角色（所有打击登记完之后再写，脚步声才能换算到正确的真实时间）————————————————
const hero = new Actor2({ H: HH, x0: X0, clock, lean: 2, headTilt: -10 });
// ① 看着 hi 掉下来 → 走过去 → 踢
hero.head(0.4, -24, 0.3).head(0.95, 10, 0.25).head(1.25, 32, 0.15);
hero.hip(1.55, [SX - 10, -STAND + 2], 0.45, 'inOut');
hero.foot('F', 1.5, [SX + 24, 0], 0.26, 16).foot('B', 1.8, [SX - 22, 0], 0.24, 16);
hero.hand('F', 1.9, 'free', [0.16, 0.24]).hand('B', 1.9, 'free', [-0.16, 0.26]);
const K0 = 2.05;
hero.hip(K0, [SX - 14, -STAND + 8], 0.18).lean(K0, 8).head(K0, 34);
hero.foot('F', K0, [SX - 22, -46], 0.26, 0, 'out3', false).hand('F', K0, 'free', [0.24, 0.12]);
cues.add(clock.real(TC1 - 0.12), 'whoosh_short', { v: 0.8 });
hero.foot('F', TC1 - 0.075, [HX - 14, -16], 0.075, 0, 'in', false);
hero.hip(TC1 - 0.075, [SX + 12, -STAND + 2]).lean(TC1 - 0.075, -16).head(TC1 - 0.075, 22).hand('F', TC1 - 0.075, 'free', [-0.26, 0.22]);
hero.foot('F', TC1 + 0.01, [HX + 40, -170], 0.2, 0, 'out3', false).lean(TC1 + 0.01, -24);
hero.foot('F', TC1 + 0.32, [SX + 50, 0], 0.26, 20).hip(TC1 + 0.3, [SX + 26, -STAND + 3]).lean(TC1 + 0.3, 4).head(TC1 + 0.3, -6);
hero.hand('F', TC1 + 0.3, 'free', [0.06, 0.34]).hand('B', TC1 + 0.3, 'free', [-0.04, 0.35]);
hero.foot('B', TC1 + 0.62, [SX + 4, 0], 0.2, 12).hip(TC1 + 0.6, [SX + 26, -STAND]);
// ② 看代码打出来 → 报错吓一跳 → 恼了 → 走上前、拉拳、出拳
hero.head(3.7, -4, 0.3);
hero.lean(5.25, -12).head(5.25, -14);                                                   // 报错：往后一仰
hero.lean(5.6, 8).head(5.6, 8);                                                         // 恼了：往前凑
hero.hand('F', 5.85, 'free', [0.17, 0.06]).hand('B', 5.85, 'free', [0.12, 0.09]);       // 握拳举起
hero.foot('F', 5.95, [SX + 96, 0], 0.22, 14).hip(5.95, [SX + 64, -STAND + 4], 0.35);
hero.foot('B', 6.2, [SX + 40, 0], 0.2, 12);
const P0 = 6.42, PX = HIT2[0] - 150;                                                    // 拉拳预备
hero.hip(P0, [PX - 40, -STAND + 14], 0.14).lean(P0, -10).head(P0, 4);
hero.hand('F', P0, 'free', [-0.2, 0.06]).hand('B', P0, 'free', [0.17, 0.05]);
hero.foot('F', 6.56, [PX + 44, 0], 0.12, 10, 'out3', true);                              // 出拳的同时前脚踏出去
cues.add(clock.real(TC2 - 0.1), 'whoosh_short');
hero.hip(TC2 - 0.1, [PX, -STAND + 8]).lean(TC2 - 0.1, 18).head(TC2 - 0.1, 6);            // 出拳
hero.hand('F', TC2 - 0.07, 'strike', { to: HIT2, dur: 0.07 }).hand('B', TC2 - 0.08, 'free', [-0.14, 0.18]);
hero.hand('F', TC2 + 0.01, 'world', [HIT2[0] + 40, HIT2[1] - 4]);                         // 跟随：拳头继续往前
hero.hip(TC2 + 0.35, [PX - 6, -STAND + 4]).lean(TC2 + 0.35, 6).head(TC2 + 0.35, 24);
hero.hand('F', TC2 + 0.4, 'free', [0.12, 0.2]).hand('B', TC2 + 0.4, 'free', [0.02, 0.3]);
hero.head(7.3, 36, 0.3);                                                               // 低头看一地的字符
hero.hand('F', 7.7, 'free', [0.05, 0.35]).hip(7.7, [PX - 10, -STAND], 0.4).foot('B', 7.8, [PX - 30, 0], 0.22, 10);
// ③ 听到声音抬头 → 电脑砸下来，吓得往后一跳 → 落地、看着电脑
hero.head(8.75, -34, 0.25).lean(8.75, -6);
cues.add(clock.real(TL - 0.55), 'whoosh', { v: 0.9 });
const J = TL + 0.02;
hero.hip(J, [B3 - 4, -STAND - 34]).lean(J, -16).head(J, 10);
hero.foot('F', J, [B3 + 22, 0], 0.2, 34, 'inOut', true).foot('B', J + 0.02, [B3 - 44, 0], 0.2, 28);
hero.hand('F', J, 'free', [0.16, -0.08]).hand('B', J, 'free', [0.07, -0.1]);            // 手护在面前
hero.hip(J + 0.24, [B3 - 12, -STAND + 12]).lean(J + 0.24, 10);
hero.hip(J + 0.65, [B3 - 8, -STAND + 2], 0.3).lean(J + 0.65, 3).head(J + 0.65, 22);
hero.hand('F', J + 0.7, 'free', [0.05, 0.35]).hand('B', J + 0.7, 'free', [-0.04, 0.35]);
// ④ 扎马步、双手前推蓄力 → 释放 → 被反冲力推着往后滑 → 站起来、得意
hero.foot('B', 11.45, [B3 - 74, 0], 0.22, 14).foot('F', 11.6, [B3 + 18, 0], 0.2, 12);
hero.hip(11.5, [B3 - 26, -STAND + 30], 0.3).lean(11.5, 12).head(11.5, 4);
hero.hand('F', 11.8, 'free', [0.3, 0.13]).hand('B', 11.8, 'free', [0.27, 0.16]);
for (let k = 0; k < 18; k++) hero.hip(13.0 + k * 0.05, [B3 - 26 + (k % 2 ? 2 : -2) * (1 + k / 6), -STAND + 30 + (k % 2 ? 1.5 : -1.5)]);   // 越来越抖
hero.hip(TB, [B3 - 100, -STAND + 22], 0.34, 'out3').lean(TB, -12).head(TB, -6);         // 反冲：整个人往后滑
hero.foot('F', TB, [B3 - 50, 0], 0.34, 0, 'out3', false).foot('B', TB, [B3 - 150, 0], 0.34, 0, 'out3', false);
hero.hand('F', TB, 'free', [0.36, 0.1]).hand('B', TB, 'free', [0.33, 0.13]);
cues.add(clock.real(TB + 0.02), 'recoil_slide', { dur: 0.4 });
hero.lean(TB + 0.5, 4).hand('F', TB + 0.7, 'free', [0.06, 0.34]).hand('B', TB + 0.7, 'free', [-0.04, 0.35]);
hero.hip(15.5, [B3 - 110, -STAND], 0.4).foot('F', 15.5, [B3 - 88, 0], 0.22, 14).head(15.5, -8);
hero.hand('F', 16.4, 'free', [0.2, -0.14]).head(16.4, -16);                             // 得意地扬手
hero.hand('F', 17.1, 'free', [0.05, 0.34]).head(17.1, 2, 0.4);
const ADUR = 17.7;
hero.simulate(ADUR);
{ // 二十多个字符同时落地会响成一片：间隔太近的只留响的那个
  const ev = shatter.bodies.flatMap(b => b.events).sort((a, b) => a.t - b.t), keep = [];
  for (const e of ev) { const p = keep[keep.length - 1]; if (!p || e.t - p.t > 0.05) keep.push(e); else if (e.v > p.v) keep[keep.length - 1] = e; }
  for (const b of shatter.bodies) b.events = [];
  shatter.bodies[0].events = keep;
}
flushSfx([hiBody, lap, ...shatter.bodies], clock);
const DUR = +(clock.real(ADUR)).toFixed(2);

// ———————————————— 摄像机（真实时间）————————————————
const R = ta => clock.real(ta);
cam.key(0, { x: -90, y: -330, z: 1.1 })
  .key(R(3.4), { x: SX + 220, y: -320, z: 1.1 })
  .key(R(6.4), { x: SX + 250, y: -300, z: 1.18 })                                       // 出拳前推近
  .key(R(8.6), { x: B3 + 150, y: -440, z: 0.86 })                                      // 抬头：拉远看天上
  .key(R(TL) + 0.3, { x: B3 + 140, y: -340, z: 0.96, ease: 'out3' })
  .key(R(11.5), { x: B3 + 120, y: -330, z: 1.0 })
  .key(R(TB), { x: B3 + 110, y: -330, z: 1.14, ease: 'inOut' })                         // 蓄力：慢慢推近
  .key(R(TE) + 0.15, { x: B3 + 160, y: -360, z: 0.88, ease: 'out3' })                   // 爆炸：一下拉远
  .key(DUR, { x: B3 + 120, y: -340, z: 0.92, ease: 'inOut' });

// ———————————————— 合成一帧 ————————————————
const chargeU = ta => clamp((ta - TCH) / (TB - TCH), 0, 1) * (ta < TB ? 1 : 0);
function handsMid(ta) { const j = hero.jointsAt(ta); return [(j.aF[2][0] + j.aB[2][0]) / 2 + 26, (j.aF[2][1] + j.aB[2][1]) / 2 - 6]; }
function draw(ctx, t) {
  const ta = clock.anim(t), c = cam.at(t);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  code.draw(ctx, ta);
  shatter.draw(ctx, ta);
  if (ta >= hiBody.t0) { const [x, y, r] = hiBody.at(ta); PR.word(ctx, 'hi', x, y, r); }
  if (ta >= lap.t0) { const [x, y, r] = lap.at(ta); PR.laptop(ctx, x, y, LW, r, 1, 1); }
  if (ta > TC1 && ta < TC1 + 0.45) { const [x, y] = hiBody.at(ta), [x0, y0] = hiBody.at(ta - 1 / 60); V.motionLines(ctx, x, y, (x - x0) * 60, (y - y0) * 60, { n: 5, spread: 18, len: 0.06, seed: 7 }); }
  if (ta > TE && ta < TE + 0.8) { const [x, y] = lap.at(ta), [x0, y0] = lap.at(ta - 1 / 60); V.motionLines(ctx, x, y, (x - x0) * 60, (y - y0) * 60, { n: 7, spread: 60, len: 0.08, seed: 8 }); }
  hero.draw(ctx, ta);
  ctx.restore();
  // 蓄力时画面压暗（能量光在压暗之后画，会显得更亮）
  const u = chargeU(ta);
  if (u > 0) { ctx.save(); ctx.fillStyle = `rgba(0,0,0,${0.45 * E.inOut(u)})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  ctx.save(); cam.apply(ctx, c);
  if (u > 0) { const [x, y] = handsMid(ta); charge(ctx, x, y, u, t, { size: 60 }); }
  const rb = t - R(TB);                                                                 // 光束
  if (rb >= 0 && rb < 0.55) {
    const [x, y] = handsMid(TB), w = 46 * (1 - rb / 0.55) * (rb < 0.05 ? rb / 0.05 : 1);
    V.beam(ctx, x, y, LAP_X, -70, w, C.gold, 1 - rb / 0.6);
  }
  V.explosion(ctx, LAP_X, -70, t - R(TE), { scale: 1.1, words: ['BOOM', 'print', 'hi', 'None', 'def', 'Error', '{ }', '0x0'], seed: 41 });
  imp.drawWorld(ctx, t);
  ctx.restore();
}
function post(ctx, t, base) { imp.post(ctx, t, base); }
const bloomAt = t => { const ta = clock.anim(t); return Math.max(0.6 * chargeU(ta), 0.9 * Math.exp(-Math.max(0, t - R(TB)) * 1.1) * (t >= R(TB) ? 1 : 0)); };

module.exports = { DUR, draw, post, cam, bloomAt, hero, clock };
