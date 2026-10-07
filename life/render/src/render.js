// 渲染一段帧到 mp4：node src/render.js <起始帧> <结束帧(不含)> <输出文件>
'use strict';
const { spawn } = require('child_process');
const K = require('./core');
const { renderFrame } = require('./frame');
const { toSrc } = require('./timeline');

const [a, b, out] = process.argv.slice(2);
const f0 = +a, f1 = +b;
// LIFE_ENC=nvenc 时交给 NVIDIA 显卡编码（build.js 会自动检测），否则用 CPU 的 x264
const enc = process.env.LIFE_ENC === 'nvenc'
  ? ['-c:v', 'h264_nvenc', '-preset', 'p7', '-tune', 'hq', '-rc', 'vbr', '-cq', '16', '-b:v', '0', '-profile:v', 'high', '-spatial-aq', '1', '-temporal-aq', '1', '-bf', '3']
  : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-tune', 'film', '-threads', '2'];
const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error',
  '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${K.W}x${K.H}`, '-r', String(K.FPS), '-i', '-',
  ...enc, '-pix_fmt', 'yuv420p', out],
  { stdio: ['pipe', 'inherit', 'inherit'] });
const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');

function write(buf) {
  return new Promise(res => { if (!ff.stdin.write(buf)) ff.stdin.once('drain', res); else res(); });
}
(async () => {
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    ctx.reset();
    renderFrame(ctx, toSrc(f / K.FPS), f);
    await write(cv.toBufferSync('raw'));   // RGBA；在循环里引用 cv，防止画布被回收
    if ((f - f0) % 600 === 0) console.log(`[${out}] ${f}/${f1}  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end();
  ff.on('close', code => { console.log(`[${out}] done code=${code} ${((Date.now() - t0) / 1000).toFixed(0)}s`); process.exit(code); });
})();
