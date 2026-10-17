// 姿势库总览：node src/tools/posesheet.js out.png  → 每个姿势一格，外加走路、跑步循环的分解
'use strict';
const K = require('../core');
const { Actor } = require('../rig');
const POSES = require('../poses');

const out = process.argv[2] || 'poses.png';
const names = Object.keys(POSES);
const cell = 240, cols = 8;
const cyc = [['walk', 8], ['run', 8]];
const rows = Math.ceil(names.length / cols) + cyc.length;
const cv = new K.Canvas(cell * cols, cell * rows), ctx = cv.getContext('2d');
ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
function cellAt(i, r, label, fn) {
  const x = (i % cols) * cell, y = r * cell;
  ctx.save();
  ctx.strokeStyle = '#222'; ctx.strokeRect(x, y, cell, cell);
  ctx.fillStyle = '#1a1a1a'; ctx.fillRect(x, y + cell - 40, cell, 1);
  ctx.translate(x + cell / 2, y + cell - 40);
  fn();
  ctx.restore();
  K.text(ctx, label, x + 8, y + 20, { size: 15, family: 'Mono', color: [150, 150, 150] });
}
names.forEach((n, i) => {
  const a = new Actor({ H: 150, color: i % 2 ? K.C.orange : K.C.yellow, head: i % 2 ? 'ring' : 'fill', ghost: false });
  a.key(0, POSES[n]);
  cellAt(i, Math.floor(i / cols), n, () => a.draw(ctx, 0));
});
cyc.forEach(([kind, n], r) => {
  for (let k = 0; k < n; k++) {
    const a = new Actor({ H: 150, ghost: false });
    a.key(0, POSES.stand).cycle(0, 100, kind, 0, 100 * 150);
    // 采样一个步态周期里的 n 个相位
    const stride = { walk: 0.36, run: 0.62 }[kind] * 150 * 2;
    const vmax = 1 / (100 - 0.25) * 100 * 150;
    const t = 10 + (stride * k / n) / vmax;
    cellAt(k, Math.ceil(names.length / cols) + r, `${kind} ${k}/${n}`, () => { ctx.translate(-a.joints(t).hip[0], 0); a.draw(ctx, t); });
  }
});
cv.toFileSync(out);
console.log('wrote', out);
