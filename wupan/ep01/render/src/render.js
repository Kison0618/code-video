// 渲染一段帧到 mp4：node src/render.js <起始帧> <结束帧(不含)> <输出文件>
// ffmpeg 用绝对路径（core.FFMPEG）；stdin 出错时打印 ffmpeg 自己的 stderr，而不是只抛 EOF
'use strict';
const { spawn } = require('child_process');
const K = require('./core');
const { renderFrame } = require('./frame');

const [a, b, out] = process.argv.slice(2);
const f0 = +a, f1 = +b;
// b-pyramid=none：B 帧不再被当作参考帧。x264 默认 b-pyramid=normal 会让部分 B 帧成为参考帧，
// 播放器一卡顿就丢 B 帧，引用它的后续帧会花成方块、静止区域（字幕）停在旧内容上。2026-10-27 用户实测踩坑。
// keyint=60：每 2 秒一个关键帧，万一出错也能很快恢复。
const enc = ['-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-tune', 'film', '-threads', '2', '-x264-params', 'b-pyramid=none:keyint=60:min-keyint=30'];
const ff = spawn(K.FFMPEG, ['-y', '-loglevel', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${K.W}x${K.H}`, '-r', String(K.FPS), '-i', '-',
  ...enc, '-pix_fmt', 'yuv420p', out], { stdio: ['pipe', 'ignore', 'pipe'] });
let errText = '', failed = false;
ff.stderr.on('data', d => { errText += d; });
const fail = why => {
  if (failed) return; failed = true;
  console.error(`\n✗ 帧 ${f0}-${f1} → ${out}：${why}\n--- ffmpeg stderr ---\n${errText.trim() || '(空)'}\n---------------------`);
  process.exit(1);
};
ff.on('error', e => fail(`ffmpeg 启动失败 ${e.message}`));
ff.stdin.on('error', e => setTimeout(() => fail(`写入 ffmpeg stdin 出错 ${e.code || e.message}`), 300));   // 稍等，让 stderr 收齐
ff.on('close', code => { if (code !== 0) fail(`ffmpeg 退出码 ${code}`); });

const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');
const write = buf => new Promise(res => { if (failed) return; if (!ff.stdin.write(buf)) ff.stdin.once('drain', res); else res(); });
(async () => {
  for (let f = f0; f < f1; f++) {
    ctx.reset();
    renderFrame(ctx, f / K.FPS, f);
    await write(cv.toBufferSync('raw'));
    if (failed) return;
  }
  ff.stdin.end();
  ff.on('close', code => process.exit(code));
})().catch(e => fail(`渲染出错 ${e.stack || e}`));
