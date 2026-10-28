// 预览：node src/preview.js out.png 0.5 12 91.8 ...  → 把这些时刻拼成一张带时间码的图
'use strict';
const K = require('./core');
const A = require('./audio');
const { renderFrame } = require('./frame');
const [outFile, ...times] = process.argv.slice(2);
const ts = times.map(Number);
const cols = ts.length === 1 ? 1 : ts.length <= 4 ? 2 : 3, rows = Math.ceil(ts.length / cols);
const sw = ts.length === 1 ? K.W : 960, sh = ts.length === 1 ? K.H : 540;
const sheet = new K.Canvas(sw * cols, sh * rows), sc = sheet.getContext('2d');
const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');
ts.forEach((t, i) => {
  const t0 = Date.now();
  ctx.reset();
  renderFrame(ctx, t, Math.round(t * K.FPS));
  const ms = Date.now() - t0;
  const x = (i % cols) * sw, y = Math.floor(i / cols) * sh;
  sc.drawImage(cv, x, y, sw, sh);
  // 调试时间码：只在预览拼图里出现，放在每格右下角，不压画面里的标签
  sc.font = '700 22px Mono'; sc.textAlign = 'right';
  const lab = `${t.toFixed(2)}s ${ms}ms`, lw = sc.measureText(lab).width;
  sc.fillStyle = 'rgba(0,0,0,0.6)'; sc.fillRect(x + sw - lw - 18, y + sh - 34, lw + 12, 28);
  sc.fillStyle = '#ff0'; sc.fillText(lab, x + sw - 12, y + sh - 13); sc.textAlign = 'left';
});
sheet.toFileSync(outFile);
console.log('wrote', outFile);
