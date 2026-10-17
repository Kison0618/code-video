// 反应动作验证片（SCENE=react）：从天上掉下来脸朝下 → 爬起 → 小后仰 → 击退 → 被打飞后空翻仰面落地 → 爬起 → 跑 → 跳 → 跑着跳
'use strict';
const K = require('./core');
const { W, H } = K;
const { Clock } = require('./actor2');
const { Actor2 } = require('./moves');
const { Camera } = require('./cam');
const { Impacts } = require('./impact');
const cues = require('./cues');

const HH = 300;
const clock = new Clock(), cam = new Camera(), imp = new Impacts({ clock, cam });
const a = new Actor2({ H: HH, x0: 0, clock });

// 打击先登记（停顿帧）
const T1 = 3.2, T2 = 4.6, T3 = 6.4;
imp.hit(T1, [40, -250], 'light');
imp.hit(T2, [40, -200], 'medium');
imp.hit(T3, [0, -220], 'heavy');

// ① 从天上掉下来，脸朝下
cues.add(clock.real(0.2), 'whoosh', { v: 0.7 });
const L0 = a.launch(0.3, { from: [0, -1500], vx: 0, vy: 0, lean0: 30, land: 'front' });
cam.shake(clock.real(L0.t), 18, 0.35);
const U0 = a.getUp(L0.t + 0.6, { from: 'front' });
// ② 小后仰 ③ 击退
a.head(U0.t, 0, 0.3);
a.flinch(T1);
const KB = a.knockback(T2, { dist: 110 });
// ④ 被打飞：往后空翻一圈，仰面落地
const L1 = a.launch(T3, { vx: -520, vy: -1100, turns: 1, land: 'back' });
cam.shake(clock.real(L1.t), 22, 0.4);
const U1 = a.getUp(L1.t + 0.7, { from: 'back' });
// ⑤ 跑（起跑 → 刹车）→ 再跑 → 滑铲 → 接着跑 → 跨跳 → 接着跑 → 刹车
const V = 4.5 * HH;
const R1 = a.run(U1.t + 0.2, U1.x + 900, { speed: V });
const R2 = a.run(R1.t + 0.5, R1.x + 1500, { speed: V, stop: false });
const S1 = a.slide(R2.t, { v0: R2.v, dur: 0.5 });
const R3 = a.run(S1.t, S1.x + 700, { speed: V, v0: Math.abs(S1.v), ramp: 0.25, stop: false });
const J2 = a.jump(R3.t, { to: R3.x + 0.5 * V, h: 150, dur: 0.5, running: true, land: 'run' });
const R4 = a.run(J2.t, J2.x + 1000, { speed: V, v0: V, ramp: 0.2 });
const ADUR = R4.t + 1.2;
a.simulate(ADUR);
const DUR = +clock.real(ADUR).toFixed(2);

// 摄像机：跟着胯走
for (let ta = 0; ta <= ADUR + 0.01; ta += 0.25) {
  const s = a.stateAt(ta);
  cam.key(clock.real(ta), { x: s.hip[0] + 60, y: -300, z: ta < L0.t ? 0.8 : 1.0, ease: 'linear' });
}

function draw(ctx, t) {
  const ta = clock.anim(t), c = cam.at(t);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  // 地面参考线：每 200 px 一个小刻度，方便看脚有没有滑
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 2;
  for (let x = Math.floor((c.x - 1400) / 200) * 200; x < c.x + 1400; x += 200) { ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, 18); ctx.stroke(); }
  a.draw(ctx, ta);
  imp.drawWorld(ctx, t);
  ctx.restore();
}
function post(ctx, t, base) { imp.post(ctx, t, base); }

module.exports = { DUR, draw, post, cam, actor: a, clock, marks: { L0, U0, KB, L1, U1, R1, R2, S1, R3, J2, R4 } };
