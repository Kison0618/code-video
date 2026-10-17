// 第一阶段样片：1:1 模仿《火柴人 VS 编程》开头的节奏，再接一段特效集锦
// 一镜到底：整片是同一个世界、同一台摄像机，靠推拉摇移转场（和原片一样）
//
//  0.0  黑底，光标在闪；笔记本、火柴人先后从天上掉下来
//  2.4  爬起来，看光标，走过去捡起笔记本
//  8.6  敲 hello → NameError（暗红底 + 小红字）→ 沮丧 → 删掉
// 12.6  print("hi") → 运行 → "hi" 作为实物掉到地上 → 放下电脑、一脚踢飞
// 18.8  连敲三行 print → 三个 hi 掉成一堆
// 23.6  print(*bomb) → 爆炸：闪白、暖色辉光、冲击波、BOOM 群飞、集中线、震屏，人被炸飞后空翻
// 33.0  爬起来蹲在电脑前敲 turtle → 白色折线越画越粗，追着人跑 → 起跳 → 落地
'use strict';
const K = require('./core');
const { C, W, H, clamp, lerp, E } = K;
const { Actor } = require('./rig');
const PO = require('./poses');
const { Camera, floor } = require('./cam');
const { Code } = require('./code');
const { Body } = require('./phys');
const PR = require('./props');
const V = require('./vfx');
const cues = require('./cues');

const DUR = 48;
const HH = 300;                       // 火柴人站立身高（世界像素）
const LW = 0.5 * HH;                  // 笔记本盖子宽度（实测 ≈ 0.5H）
const rot = (p, d) => ({ ...p, lean: (p.lean ?? 0) + d });   // 整体转一圈后的姿势（避免角度插值绕远路）

// ———————————————— 摄像机 ————————————————
const cam = new Camera();
cam.key(0, { x: 0, y: -330, z: 1 })
  .key(8.0, { x: 20, y: -330, z: 1, ease: 'linear' })        // 开场缓慢漂移
  .key(11.5, { x: -60, y: -390, z: 1.12 })                    // 敲代码时推近
  .key(14.6, { x: -40, y: -380, z: 1.1 })
  .key(15.6, { x: 60, y: -330, z: 1 })                        // 踢之前拉开
  .key(23.5, { x: 40, y: -350, z: 1 })
  .key(27.5, { x: 40, y: -360, z: 1.04 })
  .key(27.75, { x: -60, y: -360, z: 0.9, ease: 'out3' })      // 爆炸：一下子拉远
  .key(31.0, { x: -380, y: -350, z: 0.95 })                   // 跟着被炸飞的人
  .key(36.0, { x: -420, y: -380, z: 1 })
  .key(37.4, { x: -100, y: -420, z: 0.74 })                   // 追逐：拉远看全
  .key(44.0, { x: 3250, y: -420, z: 0.74, ease: 'linear' })   // 匀速跟拍
  .key(45.4, { x: 3620, y: -360, z: 0.95, ease: 'out3' })
  .key(DUR, { x: 3640, y: -360, z: 0.98, ease: 'linear' });

// ———————————————— 代码 ————————————————
const code = new Code({ x: -430, y: -640, size: 66, seed: 3 });
// B. hello → NameError
code.type(8.7, 'hello', 6.5).run(10.0).error(10.15, 0, 5, 'NameError').back(12.0, 5, 12);
// C. print("hi")
code.type(12.7, 'print()', 8).cursor(13.9, 6).type(14.05, '"hi"', 7).cursor(14.75, 11).run(15.0);
// D. 三行 print
code.type(18.9, '\nprint("hi")\nprint("hi")', 20).run(20.5);
// E. bomb
code.set(23.6, '').type(23.9, 'bomb = ["BOOM","BAM","POW"]\nprint(*bomb)', 15).run(27.4, 0.12);
// F. turtle
code.set(33.5, '').moveTo(33.4, 33.6, -760, -640).type(33.8, 'import turtle\nt.speed("fastest")', 15).run(36.0);

// ———————————————— 火柴人 ————————————————
const hero = new Actor({ H: HH, color: C.yellow, head: 'fill' });
// 敲键盘的小动作：两种手势来回切
function typingAnim(t0, t1, a = PO.typing, b = PO.typing2, step = 0.13) {
  for (let t = t0, k = 0; t < t1; t += step, k++) hero.key(t, k % 2 ? b : a, { ease: 'inOut' });
}
const LIE = PO.lieFlat;
// A. 从天上掉下来，脸朝下砸在地上
hero.key(0, { ...LIE, head: 10 }, { x: -110, y: -1250, free: true })
  .key(1.0, { ...LIE, head: 10 }, { x: -110, y: -1250, free: true })
  .key(1.75, { ...LIE, head: -5 }, { x: -110, y: hero.restHip(LIE), ease: 'in' })
  .key(1.9, { ...LIE, head: 8, lF: [0, 30] }, { ease: 'out' })              // 落地回弹：腿弹一下
  .key(2.2, { ...LIE, head: 0, lF: [0, 5] })
  .key(2.8, { ...LIE, head: -50 })                                           // 抬头看光标
  .key(3.4, { lean: 62, head: -30, aF: [120, -10], aB: [110, -5], lF: [5, 20], lB: [10, 40] })   // 撑起来
  .key(3.95, { ...PO.kneel, head: -10 })
  .key(4.55, { ...PO.stand, head: -12 }, { ease: 'out3' })
  .key(5.0, { ...PO.scratch, head: -14 })                                    // 挠头
  .key(5.25, { ...PO.scratch, aF: [150, 100], head: -14 })
  .key(5.5, { ...PO.scratch, aF: [150, 125], head: -14 })
  .key(5.75, { ...PO.scratch, aF: [150, 100], head: -12 })
  .key(6.1, { ...PO.standRelax, head: 18 });                                 // 低头看电脑
hero.cycle(6.25, 7.0, 'walk', -110, 15);
hero.key(7.0, PO.standRelax, { x: 15 })
  .key(7.3, { ...PO.crouch, aF: [80, 10], aB: [70, 15], head: 10 }, { x: 15 })   // 蹲下捡电脑
  .key(7.9, PO.typing, { x: 15, ease: 'out3' });
typingAnim(8.65, 9.65);
hero.key(9.8, PO.typing)
  .key(10.15, { ...PO.typing, lean: -12, head: -8 }, { ease: 'out3' })      // 报错：往后一仰
  .key(10.6, { ...PO.typing, lean: -6, head: 5 })
  .key(11.1, { ...PO.typing, lean: 14, head: 42 }, { ease: 'inOut3' })      // 垂头丧气
  .key(11.8, { ...PO.typing, lean: 10, head: 36 })
  .key(12.0, PO.typing);
typingAnim(12.0, 12.45);
hero.key(12.6, PO.typing);
typingAnim(12.7, 13.6);
hero.key(13.75, PO.typing);
typingAnim(14.0, 14.55);
hero.key(14.7, PO.typing)
  .key(15.35, { ...PO.typing, head: 40, lean: 8 })                           // 低头看掉下来的 hi
  .key(15.9, { ...PO.typing, head: 45, lean: 12 })
  .key(16.1, { ...PO.standRelax, head: 30 }, { ease: 'out' })                // 松手，电脑掉了
  .key(16.4, { ...PO.kickWind, head: 20 })
  .key(16.62, { ...PO.kick, lF: [62, 4], head: 18 }, { ease: 'in3' })      // 一脚踢飞
  .key(16.95, { ...PO.kick, lF: [70, 8], head: 0, lean: -14 }, { ease: 'out' })
  .key(17.4, { ...PO.standRelax, head: -6 })
  .key(17.75, { ...PO.cheer, aF: [120, 30], aB: [-125, -30] }, { ease: 'outBack' })   // 小小的得意
  .key(18.1, PO.standRelax)
  .key(18.35, { ...PO.crouch, aF: [80, 10], aB: [70, 15], head: 10 })        // 再把电脑捡起来
  .key(18.85, PO.typing, { ease: 'out3' });
typingAnim(18.9, 20.25, PO.typing, PO.typing2, 0.08);
hero.key(20.4, PO.typing)
  .key(20.9, { ...PO.typing, head: 42 })                                     // 看着一堆 hi
  .key(21.6, { ...PO.typing, head: 38, lean: -4 })
  .key(22.1, { ...PO.typing, head: 10, lean: -8 })                           // 抬头想了想
  .key(23.0, { ...PO.typing, head: 4 });
typingAnim(23.9, 27.0);
hero.key(27.2, PO.typing).key(27.5, { ...PO.typing, head: 30 });
// E. 爆炸：被炸飞，往后空翻一圈半，仰面落地
const TB = 27.55;
const hipNow = hero.restHip(PO.typing);
hero.key(TB, { ...PO.typing, head: 30 }, { x: 15, y: hipNow, free: true })
  .key(TB + 0.12, rot(PO.shock, -10), { x: -110, y: hipNow - 140, free: true, ease: 'out' })
  .key(TB + 0.5, rot(PO.tuck, -200), { x: -380, y: hipNow - 330, free: true, ease: 'linear' })
  .key(TB + 0.85, rot(PO.tuck, -330), { x: -560, y: hipNow - 120, free: true, ease: 'linear' })
  .key(TB + 1.05, rot(PO.lieBack, -360), { x: -640, y: hero.restHip(PO.lieBack), ease: 'in' })
  .key(TB + 1.25, rot({ ...PO.lieBack, lF: [40, 60], lB: [20, 30] }, -360), { x: -650, ease: 'out' })
  .key(TB + 1.6, rot(PO.lieBack, -360), { x: -655 })
  .key(30.2, rot(PO.lieBack, -360))
  .key(30.9, rot(PO.propUp, -360))
  .key(31.6, rot({ ...PO.sitSlump, head: 20 }, -360))                        // 坐起来，晕乎乎
  .key(31.9, rot({ ...PO.sitSlump, head: 34, lean: 24 }, -360))
  .key(32.2, rot({ ...PO.sitSlump, head: 14, lean: 34 }, -360))
  .key(32.55, rot({ ...PO.kneel, head: 0 }, -360))
  .key(32.9, rot({ ...PO.standRelax, head: 20 }, -360), { dir: -1 });       // 站起来，转身走向电脑
// 爆炸时电脑从手里被炸飞：先算出它落在哪，人再爬过去面朝它蹲下
const LB = { r: 0.05 * LW, bounce: 0.25, friction: 0.5, sfx: 'laptop' };
const heldAt = t => {
  const j = hero.joints(t), a = j.aF[2], b = j.aB[2];
  return [(a[0] + b[0]) / 2 + 0.05 * HH * j.dir, (a[1] + b[1]) / 2 - 0.02 * HH, j.dir];
};
const blast = (() => { const [x, y] = heldAt(TB); return new Body({ t0: TB, x, y, vx: -560, vy: -1300, vrot: -11, ...LB, bounce: 0.3 }); })();
const LX = blast.at(40)[0], SQX = LX + 95;      // 蹲在电脑右边，面朝左
hero.cycle(33.0, 33.45, 'walk', hero.joints(32.9).hip[0], SQX + 20);
hero.key(33.5, rot(PO.standRelax, -360), { x: SQX + 20 })
  .key(33.75, rot({ ...PO.squatLow, aF: [80, 30], aB: [70, 35], head: 10 }, -360), { x: SQX });
// F. 蹲在地上敲 turtle
const SQ1 = rot({ ...PO.squatLow, aF: [82, 40], aB: [72, 50], head: 14 }, -360);
const SQ2 = rot({ ...PO.squatLow, aF: [86, 30], aB: [70, 56], head: 16 }, -360);
typingAnim(33.85, 35.8, SQ1, SQ2, 0.11);
hero.key(36.0, SQ1)
  .key(36.35, rot({ ...PO.squatLow, head: -20, lean: 20 }, -360))            // 回头：听到了什么
  .key(36.6, rot({ ...PO.shock, lean: -10 }, -360), { dir: 1, ease: 'out3' })     // 转身
  .key(36.85, rot(PO.jumpPrep, -360));
hero.cycle(37.0, 43.9, 'run', SQX, 3380, 0.15);
hero.key(43.95, rot(PO.jumpPrep, -360), { x: 3380 })
  .key(44.05, rot(PO.jumpUp, -360), { x: 3420, y: hero.restHip(PO.jumpUp) - 30, free: true, ease: 'out' })
  .key(44.4, rot(PO.tuck, -360), { x: 3560, y: -560, free: true, ease: 'out' })
  .key(44.75, rot(PO.tuck, -360), { x: 3690, y: -330, free: true, ease: 'in' })
  .key(44.9, rot(PO.land, -360), { x: 3740, y: hero.restHip(PO.land), ease: 'in' })
  .key(45.25, rot(PO.land, -360), { x: 3745 })
  .key(45.7, rot(PO.standRelax, -360), { ease: 'out3' })
  .key(46.0, rot({ ...PO.standRelax, head: -10 }, -360), { dir: -1 })         // 回头看
  .key(46.6, rot(PO.cheer, -360), { dir: 1, ease: 'outBack' })
  .key(47.2, rot(PO.standRelax, -360));

// ———————————————— 实物：电脑、文字 ————————————————
// 笔记本：先掉下来躺在地上 → 被捡起 → 踢之前松手掉地 → 再捡起 → 爆炸时被炸飞
const laptopFall = new Body({ t0: 0.6, x: 120, y: -1150, vrot: 0.4, ...LB });
const drop1 = (() => { const [x, y] = heldAt(16.1); return new Body({ t0: 16.1, x, y, vx: -60, vy: 0, vrot: -0.6, ...LB }); })();
// 段落：[开始, 结束, 位置函数]；交界处 0.3 秒平滑过渡
const LAP = [
  [-1, 7.45, t => { const [x, y, r] = laptopFall.at(t); return [x, y, 1, r]; }],
  [7.45, 16.1, t => { const [x, y, d] = heldAt(t); return [x, y, d, 0]; }],
  [16.1, 18.5, t => { const [x, y, r] = drop1.at(t); return [x, y, 1, r]; }],
  [18.5, TB, t => { const [x, y, d] = heldAt(t); return [x, y, d, 0]; }],
  [TB, 99, t => { const [x, y, r] = blast.at(t); return [x, y, 1, r]; }],
];
function laptopAt(t) {
  const i = LAP.findIndex(s => t >= s[0] && t < s[1]);
  const cur = LAP[i][2](t);
  // 被捡起时从地上的位置过渡到手上
  if (i > 0 && t < LAP[i][0] + 0.3 && (i === 1 || i === 3)) {
    const prev = LAP[i - 1][2](t), u = E.inOut((t - LAP[i][0]) / 0.3);
    return cur.map((v, k) => lerp(prev[k], v, u));
  }
  return cur;
}

// 打印出来的 hi
const HI = { r: 12, bounce: 0.42, friction: 0.7, sfx: 'tick' };
const hi1 = new Body({ t0: 15.08, x: 205, y: -470, vy: -260, vrot: 0.8, ...HI, hits: [{ t: 16.62, vx: 2300, vy: -1250, vrot: 22 }] });
const TB0 = 27.55;   // 爆炸时刻（下面的 TB）
const pile = [0, 1, 2].map(k => new Body({ t0: 20.58 + k * 0.07, x: 120 + k * 75, y: -560 - k * 30, vx: 0, vy: -200, vrot: (k - 1) * 3, ...HI, hits: [{ t: TB0, vx: (k - 1) * 900 - 300, vy: -1800 - k * 300, vrot: (k - 1) * 25 + 10 }] }));
cues.add(15.08, 'pop'); cues.add(20.58, 'pop'); cues.add(20.65, 'pop'); cues.add(20.72, 'pop');

// ———————————————— 其他音效 ————————————————
cues.add(1.75, 'thud', { v: 1 });
cues.add(3.4, 'rustle'); cues.add(4.5, 'rustle', { v: 0.6 });
cues.add(7.3, 'rustle', { v: 0.5 }); cues.add(7.8, 'grab');
cues.add(16.5, 'whoosh', { v: 0.7 }); cues.add(16.62, 'kick');
cues.add(18.4, 'rustle', { v: 0.5 }); cues.add(18.8, 'grab');
cues.add(TB, 'boom', { v: 1 }); cues.add(TB + 0.1, 'whoosh', { v: 1 });
cues.add(TB + 1.05, 'thud', { v: 0.9 });
cues.add(36.2, 'turtle', { dur: 8.1 });
cues.add(36.6, 'whoosh', { v: 0.5 });
cues.add(44.0, 'whoosh', { v: 0.8 }); cues.add(44.9, 'thud', { v: 0.8 });
cues.add(36.0, 'music', { t1: 45.6, bpm: 150 });
cues.add(44.9, 'hit');

// ———————————————— turtle 折线 ————————————————
const TT0 = 36.2, TT1 = 44.3;
const TX0 = -1950;   // 折线从画面左边外面开始，比人跑得稍慢一点，越追越近但追不上
const tipX = t => TX0 + 640 * Math.max(0, t - TT0);
// 折线顶点：横向每 140 像素一个尖，上下在 y = -40 和 y = -760 之间
function zigzag(t) {
  const x1 = tipX(Math.min(t, TT1)), pts = [], step = 140;
  for (let x = TX0, k = 0; x < x1; x += step, k++) pts.push([x, k % 2 ? -760 : -40]);
  const k = pts.length, xp = TX0 + (k - 1) * step, u = (x1 - xp) / step;
  const yA = (k - 1) % 2 ? -760 : -40, yB = k % 2 ? -760 : -40;
  pts.push([x1, lerp(yA, yB, u)]);
  return pts;
}
function drawTurtle(ctx, t) {
  if (t < TT0) return;
  const pts = zigzag(t);
  // 线宽随时间变粗（pensize 越调越大）
  ctx.save();
  ctx.strokeStyle = '#fff'; ctx.lineJoin = 'miter'; ctx.miterLimit = 10; ctx.lineCap = 'butt';
  const segs = 24;
  for (let s = 0; s < segs; s++) {
    const i0 = Math.floor(pts.length * s / segs), i1 = Math.min(pts.length - 1, Math.floor(pts.length * (s + 1) / segs) + 1);
    if (i1 <= i0) continue;
    ctx.lineWidth = lerp(4, 70, (s + 0.5) / segs * clamp((Math.min(t, TT1) - TT0) / 4));
    ctx.beginPath(); ctx.moveTo(pts[i0][0], pts[i0][1]);
    for (let i = i0 + 1; i <= i1; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.stroke();
  }
  // 笔尖的小三角（turtle 的箭头）
  const [x, y] = pts[pts.length - 1], [px, py] = pts[pts.length - 2] || [x - 1, y];
  const a = Math.atan2(y - py, x - px);
  ctx.translate(x, y); ctx.rotate(a);
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.moveTo(26, 0); ctx.lineTo(-14, -16); ctx.lineTo(-6, 0); ctx.lineTo(-14, 16); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// ———————————————— 合成一帧 ————————————————
function draw(ctx, t) {
  const c = cam.at(t);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  floor(ctx, c, 0.0);
  ctx.save();
  cam.apply(ctx, c);

  drawTurtle(ctx, t);
  code.draw(ctx, t);

  // 地上的电脑画在人后面，拿在手里的画在人前面
  const [lx, ly, ld, lr] = laptopAt(t);
  const held = (t >= 7.45 && t < 16.1) || (t >= 18.5 && t < TB);
  if (!held) PR.laptop(ctx, lx, ly, LW, lr, 1, ld);

  // 打印出来的字
  if (t >= hi1.t0) { const [x, y, r] = hi1.at(t); PR.word(ctx, 'hi', x, y, r); }
  for (const b of pile) if (t >= b.t0) { const [x, y, r] = b.at(t); PR.word(ctx, 'hi', x, y, r); }
  // 踢飞时 hi 身后的运动线
  if (t > 16.62 && t < 17.1) {
    const [x, y] = hi1.at(t), [x0, y0] = hi1.at(t - 1 / 60);
    V.motionLines(ctx, x, y, (x - x0) * 60, (y - y0) * 60, { n: 4, spread: 16, len: 0.05, seed: 4 });
  }

  // 爆炸前一瞬间：几个小 BOOM 冒出来
  if (t >= TB - 0.1 && t < TB + 0.05) V.wordBurst(ctx, 200, -380, t - (TB - 0.1), ['BOOM', 'BAM', 'POW'], { n: 6, speed: 300, size: 30, seed: 21 });

  // 灰尘：落地扬起
  V.dust(ctx, -110, 0, t - 1.75, { n: 8, spread: 220, size: 50, a: 0.35, seed: 4 });
  V.dust(ctx, -650, 0, t - (TB + 1.05), { n: 10, spread: 260, size: 60, a: 0.4, seed: 8 });
  V.dust(ctx, 3740, 0, t - 44.9, { n: 10, spread: 300, size: 60, a: 0.45, seed: 12 });

  hero.draw(ctx, t);
  if (held) PR.laptop(ctx, lx, ly, LW, lr, 1, ld);

  // 爆炸（画在人的前面）
  V.explosion(ctx, 200, -360, t - TB, { scale: 1, words: ['BOOM', 'BAM', 'POW'], seed: 31 });
  // 跑步时身后的速度线
  if (t > 37.2 && t < 43.9) {
    const j = hero.joints(t);
    V.motionLines(ctx, j.hip[0] - 40, j.hip[1] - 40, 2400, 0, { n: 6, spread: 120, len: 0.1, seed: Math.floor(t * 20), a: 0.5 });
  }
  ctx.restore();

  // —— 屏幕空间的特效 ——
  const [ex, ey] = cam.toScreen(c, 200, -360);
  const age = t - TB;
  if (age > 0 && age < 0.9) V.speedLines(ctx, ex, ey, t, { a: 0.9 * (1 - age / 0.9), n: 110, r0: 260, seed: 5 });
  V.flash(ctx, V.flashCurve(age, 0.95, 7));
}

// 泛光强度：只在爆炸那几秒打开
const bloomAt = t => 0.9 * Math.exp(-Math.max(0, t - TB) * 1.2) * (t >= TB - 0.05 ? 1 : 0);

module.exports = { DUR, draw, cam, bloomAt, hero };
