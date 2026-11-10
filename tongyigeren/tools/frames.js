// 抽关键帧 / 逐帧输出。
//   node tools/frames.js <输出目录> 1.0,2.5,30        → 这几个时刻各出一张（still_0001.00.jpg）
//   node tools/frames.js <输出目录> 0:321.4:30:0:4     → 从 0 到 321.4 秒、30fps，把帧分成 4 份，只出第 0 份（多进程用，见 render-all.cjs）
// 环境变量：CHROME_PATH = 浏览器路径（不设就用 playwright 自带的）；PNG=1 输出 png；SCALE=0.5 输出缩小一半的图
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [out, spec] = process.argv.slice(2);
  if (!out || !spec) { console.error('用法见文件开头'); process.exit(1); }
  fs.mkdirSync(out, { recursive: true });
  const png = !!process.env.PNG, ext = png ? 'png' : 'jpg', scale = +(process.env.SCALE || 1);
  let jobs;
  if (spec.includes(':')) {
    const [a, b, fps, w, n] = spec.split(':').map(Number);
    jobs = [];
    for (let f = Math.round(a * fps); f < Math.round(b * fps); f++) if (f % n === w) jobs.push({ t: f / fps, name: `f_${String(f).padStart(6, '0')}.${ext}` });
  } else jobs = spec.split(',').map(Number).map(t => ({ t, name: `still_${t.toFixed(2).padStart(7, '0')}.${ext}` }));
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  let errors = 0;
  page.on('pageerror', e => { errors++; console.error('PAGE ERROR:', e.message); });
  page.on('console', m => { if (m.type() === 'error') { errors++; console.error('CONSOLE:', m.text()); } });
  await page.goto('file://' + path.join(__dirname, '..', 'index.html').replace(/\\/g, '/'));
  await page.evaluate(() => window.ready);
  try {
    for (const j of jobs) {
      const target = path.join(out, j.name);
      if (fs.existsSync(target) && fs.statSync(target).size > 1000 && spec.includes(':')) continue;      // 断点续跑
      const data = await page.evaluate(([t, png, scale]) => {
        window.render(t);
        let c = document.getElementById('c');
        if (scale !== 1) { const d = document.createElement('canvas'); d.width = c.width * scale; d.height = c.height * scale; const x = d.getContext('2d'); x.imageSmoothingQuality = 'high'; x.drawImage(c, 0, 0, d.width, d.height); c = d; }
        return c.toDataURL(png ? 'image/png' : 'image/jpeg', .93).split(',')[1];
      }, [j.t, png, scale]);
      fs.writeFileSync(target, Buffer.from(data, 'base64'));
    }
  } finally { await browser.close(); }
  if (errors) { console.error(`有 ${errors} 个报错`); process.exitCode = 2; }
})();
