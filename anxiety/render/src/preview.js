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
  sc.font = '20px Mono'; sc.fillStyle = '#ff0';
  sc.fillText(`${t.toFixed(2)}s ${ms}ms`, x + 10, y + 26);
});
sheet.toFileSync(outFile);
console.log('wrote', outFile);
