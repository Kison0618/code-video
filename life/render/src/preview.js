// 预览：node src/preview.js out.png 12 24.5 40 ...  → 把这些时刻拼成一张带时间码的图
'use strict';
const K = require('./core');
const { renderFrame } = require('./frame');
const { toSrc, toOut } = require('./timeline');

const [outFile, ...times] = process.argv.slice(2);
const ts = times.map(Number);
const cols = ts.length === 1 ? 1 : ts.length <= 4 ? 2 : 3;
const rows = Math.ceil(ts.length / cols);
const sw = ts.length === 1 ? K.W : 960, sh = ts.length === 1 ? K.H : 540;
const sheet = new K.Canvas(sw * cols, sh * rows);
const sc = sheet.getContext('2d');
sc.fillStyle = '#000'; sc.fillRect(0, 0, sheet.width, sheet.height);
const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');
ts.forEach((t, i) => {
  const t0 = Date.now();
  const outputTime = toOut(t);
  ctx.reset();
  renderFrame(ctx, toSrc(outputTime), Math.round(outputTime * K.FPS));
  const ms = Date.now() - t0;
  const x = (i % cols) * sw, y = Math.floor(i / cols) * sh;
  sc.drawImage(cv, x, y, sw, sh);
  sc.font = '20px Mono'; sc.fillStyle = '#ff0';
  sc.fillText(`src ${t.toFixed(1)}s / out ${outputTime.toFixed(3)}s  ${ms}ms`, x + 10, y + 26);
});
sheet.toFileSync(outFile);
console.log('wrote', outFile);
