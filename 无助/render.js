// 用法：node render.js <输出目录> <时刻列表 | start:end:fps:worker:workers>
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
(async () => {
  const [out, spec] = process.argv.slice(2);
  fs.mkdirSync(out, { recursive: true });
  let jobs;
  if (spec.includes(':')) {
    const [a, b, fps, w, n] = spec.split(':').map(Number);
    jobs = [];
    for (let f = Math.round(a * fps); f < Math.round(b * fps); f++) if (f % n === w) jobs.push({ f, t: f / fps, name: `f_${String(f).padStart(5, '0')}.jpg` });
  } else {
    jobs = spec.split(',').map(Number).map(t => ({ f: Math.round(t * 30), t, name: `still_${t.toFixed(1)}.jpg` }));
  }
  const browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {});
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('file://' + path.join(__dirname, 'demo.html'));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  for (const j of jobs) {
    await page.evaluate(([t, f]) => window.render(t, f), [j.t, j.f]);
    await page.screenshot({ path: path.join(out, j.name), type: 'jpeg', quality: 92 });
  }
  await browser.close();
})();
