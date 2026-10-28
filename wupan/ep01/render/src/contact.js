// 从成片里按给定秒数抽帧拼图，每格右下角标时间（成片的真实时间）
//   node src/contact.js <视频.mp4> <输出.png> <列数> t1 t2 ...
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const K = require('./core');
const { Canvas, loadImage } = require('skia-canvas');

const [video, out, colsArg, ...ts] = process.argv.slice(2);
const cols = +colsArg, TW = 640, TH = 360;
(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'contact_'));
  const rows = Math.ceil(ts.length / cols);
  const cv = new Canvas(cols * TW, rows * TH), x = cv.getContext('2d');
  x.fillStyle = '#000'; x.fillRect(0, 0, cv.width, cv.height);
  for (let i = 0; i < ts.length; i++) {
    const f = path.join(tmp, `f${i}.png`);
    const r = spawnSync(K.FFMPEG, ['-y', '-loglevel', 'error', '-ss', ts[i], '-i', video, '-frames:v', '1', '-vf', `scale=${TW}:${TH}`, f]);
    if (r.status !== 0) { console.error(String(r.stderr)); process.exit(1); }
    const im = await loadImage(f), px = (i % cols) * TW, py = Math.floor(i / cols) * TH;
    x.drawImage(im, px, py);
    const s = (+ts[i]), lab = `${Math.floor(s / 60)}:${(s % 60).toFixed(2).padStart(5, '0')}`;
    x.font = '700 26px Mono'; const w = x.measureText(lab).width + 16;
    x.fillStyle = 'rgba(0,0,0,0.75)'; x.fillRect(px + TW - w - 6, py + TH - 40, w, 34);
    x.fillStyle = '#ffe14a'; x.textBaseline = 'middle'; x.fillText(lab, px + TW - w + 2, py + TH - 23);
  }
  await cv.toFile(out);
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('wrote', out);
})();
