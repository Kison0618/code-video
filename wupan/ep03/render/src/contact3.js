// 第三集自查拼图
//   node src/contact3.js mid   → out/_ep03_拼图.jpg：每句一帧，句内 60% 处
//   node src/contact3.js open  → out/_ep03_开头.png：每句开口后 0.3 秒一帧，专门查空白画面
//   第三个参数可给句号范围，如 010-014，只出这几句（默认全片）
'use strict';
const K = require('./core');
const TL = require('./timeline');
const { renderFrameAsync, closeGL } = require('./frame');
const mode = process.argv[2] || 'mid';
const [r0, r1] = (process.argv[3] || '001-999').split('-').map(Number);
const lines = TL.LINES.filter(l => +l.id >= r0 && +l.id <= r1);
const out = process.argv[4] || (mode === 'open' ? 'out/_ep03_开头.png' : 'out/_ep03_拼图.jpg');
const cols = lines.length <= 6 ? 3 : 5, sw = cols === 3 ? 960 : 768, sh = sw * 9 / 16, rows = Math.ceil(lines.length / cols);
const sheet = new K.Canvas(sw * cols, sh * rows), sc = sheet.getContext('2d');
sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');
(async () => {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], t = mode === 'open' ? l.t0 + 0.3 : l.t0 + (l.t1 - l.t0) * 0.6;
    ctx.reset(); await renderFrameAsync(ctx, t, Math.round(t * K.FPS));
    const x = (i % cols) * sw, y = Math.floor(i / cols) * sh;
    sc.drawImage(cv, x + 2, y + 2, sw - 4, sh - 4);
    sc.font = '700 26px Mono'; const lab = `${l.id} ${t.toFixed(1)}s`;
    sc.fillStyle = 'rgba(0,0,0,0.7)'; sc.fillRect(x + 2, y + 2, sc.measureText(lab).width + 16, 34);
    sc.fillStyle = '#ffd400'; sc.textBaseline = 'top'; sc.fillText(lab, x + 10, y + 7);
  }
  if (out.endsWith('.png')) sheet.toFileSync(out); else sheet.toFileSync(out, { quality: 0.86 });
  console.log('wrote', out, TL.EST ? '(估算时间轴)' : '(真配音时间轴)');
  console.log('missing assets:', [...require('./kit02').MISSING].join(', ') || 'none');
  await closeGL();
})().catch(e => { console.error(e); process.exit(1); });
