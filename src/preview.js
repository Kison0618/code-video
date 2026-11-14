// 抽帧预览：JQ_DEMO=A node src/preview.js <输出.jpg> <秒1> <秒2> ...   （每帧缩到 960 宽，2 列拼图）
'use strict';
const fs = require('fs');
const K = require('./core');
const { renderFrame, D } = require('./frame');
const [out, ...ts] = process.argv.slice(2);
const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');
const PORT = K.H > K.W, cols = Math.min(PORT ? 4 : 2, ts.length), rows = Math.ceil(ts.length / cols), w = PORT ? 405 : 960, h = PORT ? 720 : 540;
const sheet = new K.Canvas(w * cols, h * rows), sx = sheet.getContext('2d');
(async () => {
  for (let i = 0; i < ts.length; i++) {
    const s = ts[i], f = Math.round(+s * K.FPS);
    if (D.prepare) await D.prepare(f);
    ctx.reset(); renderFrame(ctx, +s, f);
    sx.drawImage(cv, (i % cols) * w, Math.floor(i / cols) * h, w, h);
    K.text(sx, (+s).toFixed(2) + 's', (i % cols) * w + 12, Math.floor(i / cols) * h + 30, { size: 22, family: 'Latin', color: [255, 80, 80], align: 'left' });
  }
  fs.writeFileSync(out, sheet.toBufferSync('jpg', { quality: 0.9 }));
  console.log('preview ->', out);
})();
