// 多进程渲染：node src/render_all.js <输出.mp4> [开始秒] [结束秒] [进程数]
// 切成 4 秒一块交给进程池，各进程负载均衡；最后无损拼接
'use strict';
const { spawn, execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const K = require('./core');
const { DUR } = require('./frame');

const out = process.argv[2] || 'out/video.mp4';
const s0 = +(process.argv[3] || 0), s1 = +(process.argv[4] || DUR);  // 结束秒留空 = 整首
const N = +(process.argv[5] || 4);
const F0 = Math.round(s0 * K.FPS), F1 = Math.round(s1 * K.FPS);
const dir = path.join(path.dirname(out), 'parts_' + path.basename(out, '.mp4'));
fs.rmSync(dir, { recursive: true, force: true });
fs.mkdirSync(dir, { recursive: true });
const CHUNK = 4 * K.FPS, parts = [];
for (let a = F0; a < F1; a += CHUNK) parts.push([a, Math.min(F1, a + CHUNK), path.join(dir, `part${String(parts.length).padStart(3, '0')}.mp4`)]);
let next = 0, done = 0;
const t0 = Date.now();
function worker() {
  if (next >= parts.length) return Promise.resolve();
  const [a, b, p] = parts[next++];
  return new Promise((res, rej) => {
    const c = spawn('node', [path.join(__dirname, 'render.js'), a, b, p], { stdio: ['ignore', 'ignore', 'inherit'] });
    c.on('close', code => (code === 0 ? res() : rej(new Error(`frames ${a}-${b} failed`))));
  }).then(() => {
    done++;
    const el = (Date.now() - t0) / 1000, eta = el / done * (parts.length - done);
    process.stdout.write(`\r  画面 ${done}/${parts.length} 块   已用 ${Math.round(el)}s   预计还要 ${Math.round(eta)}s   `);
    return worker();
  });
}
Promise.all(Array.from({ length: Math.min(N, parts.length) }, worker)).then(() => {
  const list = path.join(dir, 'list.txt');
  fs.writeFileSync(list, parts.map(([, , p]) => `file '${path.resolve(p).replace(/\\/g, '/')}'`).join('\n'));
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', out], { stdio: 'inherit' });
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('\nvideo ->', out);
}).catch(e => { console.error(e); process.exit(1); });
