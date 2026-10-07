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
// 切成 4 秒的小块交给进程池：各段负载差很多（图灵斑纹段最重），小块能让每个进程一直有活干
const CHUNK = 4 * K.FPS;
const parts = [];
for (let a = F0; a < F1; a += CHUNK) parts.push([a, Math.min(F1, a + CHUNK), path.join(dir, `part${String(parts.length).padStart(3, '0')}.mp4`)]);
let next = 0;
function worker() {
  if (next >= parts.length) return Promise.resolve();
  const [a, b, p] = parts[next++];
  return new Promise((res, rej) => {
    const c = spawn('node', [path.join(__dirname, 'render.js'), a, b, p], { stdio: ['ignore', 'ignore', 'inherit'] });
    c.on('close', code => (code === 0 ? res() : rej(new Error(`frames ${a}-${b} failed`))));
  }).then(() => { console.log(`  已完成 ${path.basename(p)}（共 ${parts.length} 块）`); return worker(); });
}
const jobs = Array.from({ length: Math.min(N, parts.length) }, worker);
Promise.all(jobs).then(() => {
  const list = path.join(dir, 'list.txt');
  fs.writeFileSync(list, parts.map(([, , p]) => `file '${path.resolve(p).replace(/\\/g, '/')}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' });
  console.log('video ->', out);
}).catch(e => { console.error(e); process.exit(1); });
