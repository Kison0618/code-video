// 反求手的位置：想让兵器的某一点（或剑尖）落在某个位置、斜度大约多少，招式 key 里的 F 该写多少
//   node src/tools/hand_for.js hipY=0.30 lean=44 len=0.4 want=0.95,0.36 along=0.85 angle=-20 st=1.2
//     hipY：接触帧胯离地高度（单位 H）；lean：前倾角度；len：兵器长（单位 H）；st：这一帧手脚允许拉长的倍数
//     want：目标点 [朝前, 离地高度]，相对胯、单位 H；along：兵器上哪一点去碰（0 手、1 剑尖）；angle：想要的斜度（度，正 = 剑尖朝上，可不写）
//   打印误差最小的几个 F（相对肩膀，[朝前, 朝下]），和对应的手、剑尖、斜度
// 为什么需要它：兵器沿"肘→手"方向伸出去，肘永远在肩–手连线的下后方，所以剑的斜度 ≥ 肩到手的斜度——
//   手举得比肩高时剑尖不可能朝下；想劈得低，手就得低于肩。凭感觉写 F 很容易剑尖插地或者碰不到对方的剑
'use strict';
const { body } = require('../rig2');
const arg = Object.fromEntries(process.argv.slice(2).map(s => s.split('=')).map(([k, v]) => [k, v.includes(',') ? v.split(',').map(Number) : Number(v)]));
const H = 1, hipY = arg.hipY ?? 0.36, lean = arg.lean ?? 30, len = arg.len ?? 0.4, st = arg.st ?? 1, along = arg.along ?? 1, want = arg.want, wa = arg.angle;
if (!want) { console.log('要写 want=朝前,高度'); process.exit(1); }
const s0 = { t: 0, hip: [0, -hipY], lean, head: 0, hF: [0, 0], hB: [0, 0], fF: [0.1, 0], fB: [-0.1, 0], st };
const sh = body(s0, H, 1).sh;
const res = [];
for (let x = -0.1; x <= 0.6; x += 0.01) for (let y = -0.6; y <= 0.5; y += 0.01) {
  const j = body({ ...s0, hF: [sh[0] + x, sh[1] + y] }, H, 1), el = j.aF[1], hd = j.aF[2];
  const dx = hd[0] - el[0], dy = hd[1] - el[1], n = Math.hypot(dx, dy) || 1;
  const p = [hd[0] + dx / n * len * along, hd[1] + dy / n * len * along], tip = [hd[0] + dx / n * len, hd[1] + dy / n * len];
  const ang = Math.atan2(-dy, dx) * 180 / Math.PI, reachErr = Math.hypot(hd[0] - sh[0] - x, hd[1] - sh[1] - y);
  const err = Math.hypot(p[0] - want[0], -p[1] - want[1]) + (wa !== undefined ? Math.abs(ang - wa) / 200 : 0) + reachErr * 0.5;
  res.push({ F: [x, y], err, hd, tip, ang });
}
res.sort((a, b) => a.err - b.err);
const f2 = v => v.toFixed(2);
console.log(`肩膀在胯前 ${f2(sh[0])}、离地 ${f2(-sh[1])}（单位 H）`);
for (const r of res.slice(0, 5)) console.log(`F [${f2(r.F[0])}, ${f2(r.F[1])}]  手 ${f2(r.hd[0])},${f2(-r.hd[1])}  剑尖 ${f2(r.tip[0])},${f2(-r.tip[1])}  斜度 ${r.ang.toFixed(0)}°  误差 ${f2(r.err)}`);
