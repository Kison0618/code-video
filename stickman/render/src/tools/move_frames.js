// 把一个成套动作单独渲染成 30fps 的图片序列（镜头跟着胯，人物大小和原片近景一样），
// 用来和原片逐帧对照、喂给 analysis/ref_pose.py 量化比较。
//   node src/tools/move_frames.js run 输出目录 [起始秒 时长]
'use strict';
const fs = require('fs'), path = require('path');
const { Canvas } = require('skia-canvas');
const { Actor2 } = require('../moves');
const [, , move = 'run', out = 'out/move_frames', a0 = '1.2', len = '0.7'] = process.argv;
const W = 960, H = 540, HH = 256;                          // 原片近景：身高约 256 px（960 宽时）
const a = new Actor2({ H: HH, x0: 0 });
let T = 4;
if (move === 'run') { const r = a.run(0.3, 6000, { speed: 5 * HH, stop: false }); T = r.t; }
a.simulate(T + 0.1);
fs.mkdirSync(out, { recursive: true });
const c = new Canvas(W, H), ctx = c.getContext('2d');
let n = 0;
for (let t = +a0; t < +a0 + +len; t += 1 / 30) {
  const s = a.stateAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.translate(W * 0.45 - s.hip[0], H * 0.82);           // 地面在画面 82% 高度
  a.draw(ctx, t);
  fs.writeFileSync(path.join(out, `f${String(++n).padStart(3, '0')}.png`), c.toBufferSync('png'));
}
console.log('wrote', n, 'frames to', out);
