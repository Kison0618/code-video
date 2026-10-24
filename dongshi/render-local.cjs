// 本地并行逐帧输出（8 个进程）：0–285.55 秒 @30fps，帧图片放在 .render-tmp/frames（竖屏见 render-local-9x16.cjs）
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const root = __dirname;
const AR = process.env.AR === '9x16' ? '9x16' : '16x9';
const frameDir = path.join(root, '.render-tmp', AR === '9x16' ? 'frames-9x16' : 'frames');
fs.mkdirSync(frameDir, { recursive: true });
const browser = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const END = 285.55, FPS = 30, TOTAL = Math.round(END * FPS);
const workers = +(process.env.RENDER_WORKERS || 4);
const children = [];
const timer = setInterval(() => console.log(`Frames ${fs.readdirSync(frameDir).filter(n => n.endsWith('.jpg')).length}/${TOTAL}`), 15000);
Promise.all(Array.from({ length: workers }, (_, i) => new Promise((resolve, reject) => {
  const child = spawn(process.execPath, ['render.js', frameDir, `0:${END}:${FPS}:${i}:${workers}`], { cwd: root, env: { ...process.env, CHROME_PATH: browser, AR }, stdio: 'inherit', windowsHide: true });
  children.push(child);
  child.on('error', reject);
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`Worker ${i} exited ${code}`)));
}))).then(() => { clearInterval(timer); console.log(`Complete: ${TOTAL} frames (${AR}) in ${frameDir}`); }).catch(e => { clearInterval(timer); children.forEach(c => c.kill()); console.error(e); process.exitCode = 1; });

