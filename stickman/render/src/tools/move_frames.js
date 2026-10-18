// 把一个成套动作单独渲染出来（镜头跟着胯，人物大小和原片近景一样），用来和原片逐帧对照
//   node src/tools/move_frames.js 动作 输出 [起始秒 时长]
//   输出以 .png 结尾：直接拼成一张动作条（和 analysis/ref_strip.py 的格式一样，每格写帧号和秒数）
//   否则是一个目录：30fps 的图片序列（可以喂给 analysis/ref_pose.py 量化）
// 动作：run 跑、walk 走、walkarms 走（摆臂）、startle 吓一跳、bonk 被砸到头、knock 被打飞落地滚一圈坐起来、jump 原地跳上台子
'use strict';
const fs = require('fs'), path = require('path');
const { Canvas } = require('skia-canvas');
const { Actor2 } = require('../acting');
const [, , move = 'run', out = 'out/move_frames', a0 = '1.2', len = '0.7'] = process.argv;
const W = 960, H = 540, HH = 256;                          // 原片近景：身高约 256 px（960 宽时）
const a = new Actor2({ H: HH, x0: 0 });
const MOVES = {
  run: () => a.run(0.3, 6000, { speed: 5 * HH, stop: false }).t,
  walk: () => a.walk(0.3, 6 * HH, { stepDur: 0.42 }).t,
  walkarms: () => a.walk(0.3, 6 * HH, { stepDur: 0.42, arms: true }).t,
  startle: () => a.startle(1.0) + 1,
  bonk: () => a.bonk(1.0, { amt: 1.3 }) + 1,
  knock: () => a.launch(1.0, { vx: -620, vy: -600, land: 'back', roll: true }).t + 1,
  jump: () => a.jump(1.0, { to: 0.3 * HH, gy: -0.3 * HH, h: 46, dur: 0.34 }).t + 1,
};
const T = (MOVES[move] || MOVES.run)();
a.simulate(T + 0.2, { sfx: false });
const c = new Canvas(W, H), ctx = c.getContext('2d');
const frames = [];
for (let t = +a0; t < +a0 + +len - 1e-9; t += 1 / 30) {
  const s = a.stateAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.translate(W * 0.45 - s.hip[0], H * 0.82);           // 地面在画面 82% 高度
  a.draw(ctx, t);
  frames.push({ t, png: c.toBufferSync('png') });
}
if (out.endsWith('.png')) {
  const { loadImage } = require('skia-canvas');
  (async () => {
    const C = 200, cols = 12, rows = Math.ceil(frames.length / cols), sh = new Canvas(C * cols, C * rows), g = sh.getContext('2d');
    g.fillStyle = '#282828'; g.fillRect(0, 0, sh.width, sh.height);
    for (let i = 0; i < frames.length; i++) {
      const im = await loadImage(frames[i].png), x = (i % cols) * C, y = Math.floor(i / cols) * C;
      g.drawImage(im, W * 0.45 - H * 0.5, 0, H, H, x + 1, y + 1, C - 2, C - 2);          // 以人为中心裁正方形
      g.fillStyle = '#ff0'; g.font = '12px sans-serif'; g.fillText(`${i} ${frames[i].t.toFixed(2)}`, x + 4, y + 14);
    }
    fs.writeFileSync(out, await sh.toBuffer('png'));
    console.log('wrote strip', out, frames.length, 'frames');
  })();
} else {
  fs.mkdirSync(out, { recursive: true });
  frames.forEach((f, n) => fs.writeFileSync(path.join(out, `f${String(n + 1).padStart(3, '0')}.png`), f.png));
  console.log('wrote', frames.length, 'frames to', out);
}
