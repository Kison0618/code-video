// 多进程渲染全片（或一个时间段）：node src/render_all.js <输出.mp4> [开始秒] [结束秒] [进程数]
'use strict';
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const K = require('./core');
const TL = require('./timeline');

const out = process.argv[2] || 'out/video.mp4';
const s0 = +(process.argv[3] || 0), s1 = +(process.argv[4] || TL.DURATION);
const N = +(process.argv[5] || 4);
const F0 = Math.round(s0 * K.FPS), F1 = Math.round(s1 * K.FPS);
const dir = path.join(path.dirname(out), 'parts');
fs.mkdirSync(dir, { recursive: true });
const per = Math.ceil((F1 - F0) / N);
const parts = [];
const jobs = [];
for (let i = 0; i < N; i++) {
  const a = F0 + i * per, b = Math.min(F1, a + per);
  if (a >= b) break;
  const p = path.join(dir, `part${i}.mp4`);
  parts.push(p);
  jobs.push(new Promise((res, rej) => {
    const c = spawn('node', [path.join(__dirname, 'render.js'), a, b, p], { stdio: 'inherit' });
    c.on('close', code => (code === 0 ? res() : rej(new Error('part ' + i + ' failed'))));
  }));
}
Promise.all(jobs).then(() => {
  const list = path.join(dir, 'list.txt');
  fs.writeFileSync(list, parts.map(p => `file '${path.resolve(p).replace(/\\/g, '/')}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' });
  console.log('video ->', out);
}).catch(e => { console.error(e); process.exit(1); });
