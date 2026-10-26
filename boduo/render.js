// 用法：node render.js <输出目录> <时刻列表 | start:end:fps:worker:workers>
// 环境变量 AR=9x16 → 竖屏 1080×1920（demo.html?ar=9x16，同一条时间线，镜头重新构图）
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const V = process.env.AR === '9x16';
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
  const page = await browser.newPage({ viewport: V ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 } });
  page.on('pageerror', e => console.error('PAGE ERROR:', e.message));
  page.on('console', m => { if (m.type() === 'error') console.error('CONSOLE:', m.text()); });
  await page.goto('file://' + path.join(__dirname, 'demo.html') + (V ? '?ar=9x16' : ''));
  await page.evaluate(async () => {
    const txt = [document.body.textContent, ...(window.ALL_TEXT || [])].join('');
    await Promise.all(window.FONTS.map(f => document.fonts.load(f, txt)));
    await document.fonts.ready;
  });
  await page.waitForTimeout(500);
  try {
    for (const j of jobs) {
      const target = path.join(out, j.name);
      if (fs.existsSync(target)) {
        const bytes = fs.readFileSync(target);
        if (bytes.length > 1000 && bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) continue;
      }
      const jpeg = await page.evaluate(([t, f]) => {
        window.render(t, f);
        return document.getElementById('c').toDataURL('image/jpeg', .92).split(',')[1];
      }, [j.t, j.f]);
      fs.writeFileSync(target, Buffer.from(jpeg, 'base64'));
    }
  } finally {
    await browser.close();
  }
})();
