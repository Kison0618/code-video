// 逐帧输出整片（多进程），再用 ffmpeg 合成 mp4。在 tongyigeren/ 目录下运行：
//   node tools/render-all.cjs                    只出帧图片（.render/frames/f_000000.jpg ...）
//   node tools/render-all.cjs 配音.wav            出帧 + 合成 out/同一个人.mp4（带这条配音）
// 环境变量：CHROME_PATH 浏览器路径；FFMPEG ffmpeg 路径（默认 ffmpeg）；RENDER_WORKERS 进程数（默认 4）；PNG=1 用 png 帧
const { spawn, spawnSync } = require('child_process');
const fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), frames = path.join(root, '.render', 'frames');
const timing = JSON.parse(fs.readFileSync(path.join(root, 'timing', 'timing.json'), 'utf8'));
const FPS = 30, END = timing.total, TOTAL = Math.round(END * FPS), N = +(process.env.RENDER_WORKERS || 4), ext = process.env.PNG ? 'png' : 'jpg';
fs.mkdirSync(frames, { recursive: true });
const count = () => fs.readdirSync(frames).filter(n => n.endsWith('.' + ext)).length;
const timer = setInterval(() => console.log(`帧 ${count()}/${TOTAL}`), 15000);
Promise.all(Array.from({ length: N }, (_, i) => new Promise((ok, bad) => {
  const c = spawn(process.execPath, [path.join(__dirname, 'frames.js'), frames, `0:${END}:${FPS}:${i}:${N}`], { cwd: root, stdio: 'inherit', windowsHide: true });
  c.on('error', bad); c.on('exit', code => code === 0 ? ok() : bad(new Error(`第 ${i} 个进程退出码 ${code}（2 = 页面有报错）`)));
}))).then(() => {
  clearInterval(timer);
  const n = count(); console.log(`帧输出完成：${n}/${TOTAL}`);
  if (n !== TOTAL) throw new Error('帧数不对，重跑一次会自动补缺的帧');
  const audio = process.argv[2]; if (!audio) return;
  fs.mkdirSync(path.join(root, 'out'), { recursive: true });
  const out = path.join(root, 'out', '同一个人.mp4');
  const r = spawnSync(process.env.FFMPEG || 'ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(frames, `f_%06d.${ext}`), '-i', audio,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-x264-params', 'b-pyramid=none:keyint=60:min-keyint=30',
    '-c:a', 'aac', '-b:a', '256k', '-t', String(END), '-movflags', '+faststart', out], { stdio: 'inherit' });
  if (r.status !== 0) throw new Error('ffmpeg 失败'); console.log('成片：' + out);
}).catch(e => { clearInterval(timer); console.error(e.message); process.exitCode = 1; });
