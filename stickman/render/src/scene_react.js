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
// ⑤ 跑 → 跳 → 跑着跳
const R1 = a.run(U1.t + 0.2, U1.x + 700, { speed: 950 });
const J1 = a.jump(R1.t + 0.5, { to: R1.x + 160, h: 140 });
const R2 = a.run(J1.t + 0.8, J1.x + 520, { speed: 1000, stop: false });
const J2 = a.jump(R2.t, { to: R2.x + 580, h: 170, dur: 0.6, running: true, skid: 110 });
const ADUR = J2.t + 1.4;
a.simulate(ADUR);
const DUR = +clock.real(ADUR).toFixed(2);

// 摄像机：跟着胯走
for (let ta = 0; ta <= ADUR + 0.01; ta += 0.5) {
  const s = a.stateAt(ta);
  cam.key(clock.real(ta), { x: s.hip[0] + 60, y: -300, z: ta < L0.t ? 0.8 : 1.0 });
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

module.exports = { DUR, draw, post, cam, actor: a, clock, marks: { L0, U0, KB, L1, U1, R1, J1, R2, J2 } };
