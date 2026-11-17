// 渲染一段帧：JQ_DEMO=A node src/render.js <起始帧> <结束帧(不含)> <输出.mp4>
'use strict';
const { spawn } = require('child_process');
const K = require('./core');
const { renderFrame, D } = require('./frame');
const FF = 'C:/ffmpeg/bin/ffmpeg.exe';
const [a, b, out] = process.argv.slice(2);
// JQ_ENC=nvenc：改用显卡 NVENC 编码（腾出 CPU 给画图）；默认 libx264
const ENC = process.env.JQ_ENC === 'nvenc'
  ? ['-c:v', 'h264_nvenc', '-preset', 'p5', '-tune', 'hq', '-rc', 'vbr', '-cq', '17', '-b:v', '0', '-maxrate', '60M', '-bufsize', '120M', '-spatial-aq', '1']
  : ['-c:v', 'libx264', '-preset', 'medium', '-crf', '14', '-tune', 'grain', '-threads', '2'];
const ff = spawn(FF, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${K.W}x${K.H}`, '-r', String(K.FPS), '-i', '-',
  ...ENC, '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'inherit', 'inherit'] });
const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');
const write = buf => new Promise(res => { if (!ff.stdin.write(buf)) ff.stdin.once('drain', res); else res(); });
(async () => {
  for (let f = +a; f < +b; f++) { if (D.prepare) await D.prepare(f); ctx.reset(); renderFrame(ctx, f / K.FPS, f); await write(cv.toBufferSync('raw')); }
  ff.stdin.end();
  if (D.finish) await D.finish(); // 可选：演示自己收尾（如关掉转场用的无头 Chrome）
  ff.on('close', code => process.exit(code));
})();
