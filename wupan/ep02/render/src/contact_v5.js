// 全片抽帧拼图：每句一帧（句内 97% 处，元素基本都出来了），左上角标句号和时刻
//   node src/contact_v5.js out/_v6_拼图.jpg [比例 0.97]
'use strict';
const K = require('./core');
const TL = require('./timeline');
const { renderFrameAsync, closeGL } = require('./frame');
const out = process.argv[2] || 'out/_v6_拼图.jpg', f = +(process.argv[3] || 0.97);
const ranges={a:[1,7],m:[8,18],b:[19,24],c:[25,30],d:[31,40]};
const ranges2={a:[1,7],m:[8,15],g:[16,25],b:[26,31],c:[32,37],d:[38,44]};const range=(ranges2[process.argv[4]]||ranges[process.argv[4]]), lines=range?TL.LINES.filter(l=>+l.id>=range[0]&&+l.id<=range[1]):TL.LINES;
const cols = range ? 3 : 5, sw = range ? 960 : 768, sh = sw*9/16, rows = Math.ceil(lines.length / cols);
const sheet = new K.Canvas(sw * cols, sh * rows), sc = sheet.getContext('2d');
sc.fillStyle = '#222'; sc.fillRect(0, 0, sheet.width, sheet.height);
const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');
(async () => {
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i], ratio = l.id === '018' ? Math.min(f,0.68) : f;
    const t = l.t0 + (l.t1 - l.t0) * ratio;
    ctx.reset(); await renderFrameAsync(ctx, t, Math.round(t * K.FPS));
    const x = (i % cols) * sw, y = Math.floor(i / cols) * sh;
    sc.drawImage(cv, x + 2, y + 2, sw - 4, sh - 4);
    sc.font = '700 26px Mono'; const lab = `${l.id} ${t.toFixed(1)}s`;
    sc.fillStyle = 'rgba(0,0,0,0.7)'; sc.fillRect(x + 2, y + 2, sc.measureText(lab).width + 16, 34);
    sc.fillStyle = '#ffd400'; sc.textBaseline = 'top'; sc.fillText(lab, x + 10, y + 7);
  }
  sheet.toFileSync(out, { quality: 0.88 });
  console.log('wrote', out, TL.EST ? '(估算时间轴)' : '(真配音时间轴)');
  console.log('missing assets:', [...require('./scenes/v6_util').missing, ...require('./kit02').MISSING].filter((x,i,a)=>a.indexOf(x)===i).join(', ') || 'none');
  await closeGL();
})().catch(e => { console.error(e); process.exit(1); });
