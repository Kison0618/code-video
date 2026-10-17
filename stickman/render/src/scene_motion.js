// 动作验证片（12.5 秒）：用 v2 骨骼重做三个 v1 最差的片段
//   A 0–3.6   从地上捡起电脑：带呼吸的停顿 → 小预备 → 迈一步 → 快速蹲下（手用 IK 真正伸到电脑上）→ 抓住 → 抬到膝盖 → 快速站起，电脑跟着弹簧走
//   B 3.6–8.2 抱着电脑敲 print("hi")：每一次按键手落下、电脑微震、键盘声对齐到同一帧；重心在两条腿之间换来换去
//   C 8.2–12.5 一脚踢飞 hi：预备 → 2 帧出脚 → 停顿帧（动画冻结 0.1 秒，闪光和震屏照走）→ 冲击 → 跟随 → 回稳
// 节奏按原片实测：大姿势变化 2–4 帧完成、带一点过冲；停顿时身体一直有细小的活动（拆解 第 3 节）。
// 所有动作写在"动画时间"上；停顿帧通过时间重映射实现（真实时间继续走，动画时间暂停）。
'use strict';
const K = require('./core');
const { C, W, H, clamp, lerp, E, noise1 } = K;
const { body, paint, smear } = require('./rig2');
const { Actor2, Clock } = require('./actor2');
const { P } = require('./rig');
const { Camera, floor } = require('./cam');
const { Code } = require('./code');
const { Body } = require('./phys');
const PR = require('./props');
const V = require('./vfx');
const cues = require('./cues');

const HH = 300, LW = 0.5 * HH, DIR = 1;

// —— 停顿帧：踢中的瞬间动画冻结 0.1 秒 ——
const TC = 9.07, FREEZE = 0.1;            // 动画时间里的接触时刻
const animT = t => (t < TC ? t : t < TC + FREEZE ? TC : t - FREEZE);
const realT = ta => (ta <= TC ? ta : ta + FREEZE);      // 接触那一刻本身算在冻结之前
const DUR = 12.5, ADUR = DUR - FREEZE;

// ———————————————— 代码（按键时刻驱动手）————————————————
const code = new Code({ x: -390, y: -640, size: 62, seed: 5 });
code.type(3.75, 'print("hi")', 7.5).run(6.55);
const KEYS = [];
for (let i = 1; i < code.snaps.length; i++) if (code.snaps[i].text.length > code.snaps[i - 1].text.length) KEYS.push(code.snaps[i].t);
cues.add(6.55 + 0.12, 'output');

// ———————————————— 角色（v2 动作系统，见 actor2.js）————————————————
const clock = new Clock().freeze(TC, FREEZE);
const X0 = -40;
// 每次按键：手往下点一下（25 ms 下、70 ms 回），电脑跟着微震
function tapAt(t) {
  let d = 0, k = -1;
  for (let i = 0; i < KEYS.length; i++) {
    const a = t - KEYS[i]; if (a < -0.03 || a > 0.12) continue;
    k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07);
  }
  let j = 0; for (const tk of KEYS) { const a = t - tk; if (a > 0 && a < 0.25) j += Math.exp(-a * 25) * Math.sin(a * 60); }
  return { d, k, j };
}
const hero = new Actor2({ H: HH, x0: X0, clock, lean: 2, headTilt: 18, objJiggle: t => { const j = tapAt(t).j; return [j * 1.2, j * 0.012]; } });
const STAND = hero.STAND;
// 电脑在地上；电脑上的抓握点（本地坐标，原点在铰链）：底下托着的点、后沿、键盘上的点（在盖子后面，看不见）
const LX = 95, LREST = [LX, -0.045 * LW, 0];
const GRIP_UNDER = [-0.18 * LW, 0.07 * LW], GRIP_BACK = [-0.5 * LW, 0.03 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];
const keyPoint = t => { const tp = tapAt(t); return [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; };
// 拿在胸前时电脑铰链相对身体的位置（实测原片：铰链高约 0.5–0.57H，在身体前方）
const HELD = { fwd: 0.24, up: 0.05 }, LOW = { fwd: 0.3, up: -0.05 }, TUCK = { fwd: 0.16, up: 0.03 };

// —— A 捡电脑 ——
hero.obj(0, 'rest', LREST);
hero.head(0.3, 26, 0.7, 'inOut');                                                      // 一直盯着电脑，头慢慢再低一点
hero.hip(0.9, [X0 - 3, -STAND + 5], 0.15).lean(0.9, 7).head(0.9, 30);                 // 预备：微微一沉
hero.foot('F', 1.02, [X0 + 62, 0], 0.22, 18).hip(1.02, [X0 + 18, -STAND + 2], 0.2);    // 迈一步靠近
cues.add(1.02, 'rustle', { v: 0.5 });
const CR = [X0 + 8, -0.21 * HH];
hero.hip(1.42, CR).lean(1.42, 40).head(1.42, 34);                                      // 蹲下（弹簧 ~3 帧完成）
hero.foot('B', 1.38, [X0 - 12, 0], 0.14, 10);
hero.hand('F', 1.42, 'world', [LX + GRIP_UNDER[0] + 30, LREST[1] + 4]).hand('B', 1.46, 'world', [LX + GRIP_BACK[0] + 4, LREST[1] + 3]);
cues.add(1.52, 'body', { v: 0.8 });
hero.head(1.9, 38, 0.3).hip(1.9, [CR[0] + 2, CR[1] + 3], 0.3);                         // 蹲着稍微调整
const TG = 2.12;                                                                       // 抓住
hero.hand('F', TG, 'obj', [GRIP_UNDER[0] + 30, GRIP_UNDER[1] - 4]).hand('B', TG, 'obj', GRIP_BACK);
hero.obj(TG, 'held', LOW); cues.add(TG, 'touch2');
hero.head(TG, 30);
const TS = 2.48;                                                                       // 站起来
hero.hip(TS, [X0 + 22, -STAND]).lean(TS, 3).head(TS, 20);
hero.foot('B', TS + 0.02, [X0 + 2, 0], 0.16, 12);
hero.obj(TS, 'held', HELD); cues.add(TS, 'rustle', { v: 0.7 });
hero.hand('B', TS + 0.05, 'obj', GRIP_UNDER);                                          // 托底的手换到下面
hero.hand('F', 3.15, 'obj', keyPoint);                                                 // 前手放到键盘上，按按键时刻敲

// —— B 敲键盘 ——
hero.head(3.4, 22, 0.3);
hero.hip(4.25, [X0 + 30, -STAND + 4], 0.5);                                            // 重心挪到前脚，后膝自然弯
hero.hip(5.5, [X0 + 14, -STAND + 3], 0.6);                                             // 重心挪回后脚
hero.head(5.2, 25, 0.4);
hero.head(6.55, 4, 0.12).lean(6.55, -2);                                               // 运行：抬头看代码
hero.head(7.05, 38).lean(7.05, 9);                                                     // hi 掉下来，低头看
hero.hip(7.05, [X0 + 24, -STAND + 2], 0.3);

// hi：从代码下面掉出来，落在脚前
const hi = new Body({ t0: 6.67, x: -40, y: -560, vx: 330, vy: -320, vrot: 1.5, r: 12, bounce: 0.42, friction: 0.7, sfx: 'tick',
  hits: [{ t: TC, vx: 2400, vy: -1350, vrot: 26 }] });
const HX = hi.at(8.9)[0];

// —— C 踢 ——（hi 落点 HX 由物理算出；先挪两步，让踢的那条腿够得着）
const SX = HX - 112;                                                                    // 踢之前胯所在的位置
hero.hip(7.75, [SX - 10, -STAND + 2], 0.45, 'inOut');
hero.foot('F', 7.75, [SX + 24, 0], 0.24, 16).foot('B', 8.0, [SX - 22, 0], 0.24, 16);
hero.hand('F', 8.25, 'free', [0.16, 0.24]);                                             // 前手松开键盘，垂到一边保持平衡
hero.obj(8.25, 'held', TUCK).hand('B', 8.25, 'obj', GRIP_UNDER);                        // 电脑夹到身边，后手托着
hero.head(8.3, 36);
const K0 = 8.62;                                                                        // 预备：身体往后一收，踢的脚往后抬
hero.hip(K0, [SX - 14, -STAND + 8], 0.18).lean(K0, 8).head(K0, 34);
hero.foot('F', K0, [SX - 22, -46], 0.26, 0, 'out3', false);
hero.hand('F', K0, 'free', [0.24, 0.12]);
cues.add(8.94, 'whoosh_short', { v: 0.8 });
hero.foot('F', TC - 0.075, [HX - 14, -16], 0.075, 0, 'in', false);                       // 出脚：约 2 帧
hero.hip(TC - 0.075, [SX + 12, -STAND + 2]).lean(TC - 0.075, -16).head(TC - 0.075, 22);
hero.hand('F', TC - 0.075, 'free', [-0.26, 0.22]);                                       // 手往后甩，平衡
cues.add(clock.real(TC), 'impact_light');
hero.foot('F', TC + 0.01, [HX + 40, -170], 0.2, 0, 'out3', false);                       // 跟随：脚继续往上踢
hero.lean(TC + 0.01, -24);
hero.foot('F', TC + 0.32, [SX + 50, 0], 0.26, 20, 'inOut');                              // 收脚落地
hero.hip(TC + 0.3, [SX + 26, -STAND + 3]).lean(TC + 0.3, 4).head(TC + 0.3, -6);
hero.hand('F', TC + 0.3, 'free', [0.06, 0.34]);
hero.foot('B', TC + 0.62, [SX + 4, 0], 0.2, 12);
hero.hip(TC + 0.6, [SX + 26, -STAND]);
hero.head(TC + 1.1, -12, 0.3);                                                          // 看着 hi 飞走的方向
hero.hand('F', TC + 1.25, 'free', [0.2, -0.12]).head(TC + 1.25, -16);                    // 小小得意：前手一扬
hero.hand('F', TC + 2.1, 'free', [0.05, 0.34]).head(TC + 2.1, 4, 0.4);
hero.simulate(ADUR);
const stateAt = ta => { const s = hero.stateAt(ta); s.lap = s.obj; return s; };
const jointsAt = ta => hero.jointsAt(ta);

// 停顿帧之后登记的物理音效要往后挪（物理在动画时间里跑）
for (const c of cues.list) if (c.t > TC && (c.type === 'tick')) c.t = +(c.t + FREEZE).toFixed(4);

// ———————————————— 摄像机（真实时间）————————————————
const cam = new Camera();
cam.key(0, { x: 20, y: -330, z: 1.08 })
  .key(3.2, { x: 10, y: -340, z: 1.1, ease: 'inOut' })
  .key(4.2, { x: -60, y: -400, z: 1.2 })                    // 敲代码：推近
  .key(7.2, { x: -40, y: -390, z: 1.18 })
  .key(8.2, { x: 40, y: -320, z: 1.06 })
  .key(realT(TC) + 0.02, { x: 50, y: -320, z: 1.0, ease: 'out3' })
  .key(DUR, { x: 130, y: -330, z: 0.98, ease: 'inOut' });
cam.shake(realT(TC), 16, 0.32);

// ———————————————— 合成一帧 ————————————————
function draw(ctx, t) {
  const ta = animT(t), c = cam.at(t);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  code.draw(ctx, ta);
  const s = stateAt(ta), j = body(s, HH, DIR);
  const held = ta >= TG;
  if (!held) PR.laptop(ctx, s.lap[0], s.lap[1], LW, s.lap[2], 1, DIR);
  // hi
  if (ta >= hi.t0) { const [x, y, r] = hi.at(ta); PR.word(ctx, 'hi', x, y, r); }
  if (ta > TC && ta < TC + 0.45) {
    const [x, y] = hi.at(ta), [x0, y0] = hi.at(ta - 1 / 60);
    V.motionLines(ctx, x, y, (x - x0) * 60, (y - y0) * 60, { n: 5, spread: 18, len: 0.06, seed: 7 });
  }
  // 拖影：手脚快速移动时，沿最近 7 个采样点的轨迹画一条由细到粗的带子
  for (const k of ['aF', 'aB', 'lF', 'lB']) {
    const pts = []; for (let n = 7; n >= 0; n--) pts.push(jointsAt(ta - n / 160)[k][2]);
    const sp = Math.hypot(pts[7][0] - pts[0][0], pts[7][1] - pts[0][1]) / (7 / 160) / HH;   // 每秒几个身高
    if (sp > 3.2) smear(ctx, pts, P.lw * HH * 1.05, C.yellow, clamp((sp - 3.2) / 4, 0, 0.9));
  }
  paint(ctx, j, C.yellow, HH, 'fill');
  if (held) PR.laptop(ctx, s.lap[0], s.lap[1], LW, s.lap[2], 1, DIR);
  // 踢中：冲击星芒 + 冲击环 + 火花（画在世界里，真实时间驱动，所以停顿帧期间照样在动）
  const ia = t - realT(TC), ip = [HX - 6, -18];
  if (ia >= 0 && ia < 0.35) {
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
    for (let n = 0; n < 9; n++) {
      const a = n / 9 * Math.PI * 2 + 0.3, r0 = 18 + 160 * E.out3(ia / 0.25), r1 = r0 + 70 * (1 - ia / 0.35);
      ctx.lineWidth = 7 * (1 - ia / 0.35);
      ctx.beginPath(); ctx.moveTo(ip[0] + Math.cos(a) * r0, ip[1] + Math.sin(a) * r0 * 0.8); ctx.lineTo(ip[0] + Math.cos(a) * r1, ip[1] + Math.sin(a) * r1 * 0.8); ctx.stroke();
    }
    ctx.restore();
  }
  V.shockRing(ctx, ip[0], ip[1], ia, { r1: 260, dur: 0.4, w: 12, squash: 0.75 });
  V.sparks(ctx, ip[0], ip[1], ia, { n: 16, speed: 1100, life: 0.4, seed: 9, w: 3, up: 2.4, gravity: 2600 });
  ctx.restore();
  V.flash(ctx, ia >= 0 && ia < 0.034 ? 0.16 : 0);            // 接触那一帧轻闪（只有 1–2 帧）
}
const bloomAt = () => 0;
module.exports = { DUR, draw, cam, bloomAt, TC, FREEZE, jointsAt, animT };
