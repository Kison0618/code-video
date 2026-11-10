// 预览：index.html?play  （空格 播放/暂停，← → 前后 2 秒，Shift+← → 前后 10 秒，拖进度条跳转；?play&t=120 从 120 秒开始）
// 不带 ?play 时什么都不做，等 tools/frames.js 逐帧调用 window.render(t)
'use strict';
window.ready = (async () => {
  await Promise.all([FONT.serif(40, 700), FONT.serif(40, 900), FONT.sans(40), FONT.mono(40, 500), FONT.mono(40, 700)].map(f => document.fonts.load(f, '同一个人 abc 123')));
  await document.fonts.ready;
})();
if (/[?&]play\b/.test(location.search)) (async () => {
  await window.ready;
  const cv = document.getElementById('c'), ui = document.getElementById('ui'), bar = document.getElementById('bar'), info = document.getElementById('info');
  ui.style.display = 'block'; bar.max = TL.total;
  const fit = () => { const k = Math.min(innerWidth / W, (innerHeight - 56) / H); cv.style.transform = `scale(${k})`; cv.style.marginLeft = `${(innerWidth - W * k) / 2}px`; };
  fit(); addEventListener('resize', fit);
  // 有配音就跟着配音走；没有（或文件不在）就用时钟
  const q = new URLSearchParams(location.search), src = q.get('audio') || (TL.audio ? 'audio/' + TL.audio : null);
  let au = null, playing = false, t = +(q.get('t') || 0), last = performance.now();
  if (src) { au = new Audio(src); au.addEventListener('error', () => { au = null; }); au.currentTime = t; }
  const seek = x => { t = clamp(x, 0, TL.total); if (au) au.currentTime = t; };
  addEventListener('keydown', e => {
    if (e.code === 'Space') { playing = !playing; if (au) playing ? au.play().catch(() => { au = null; }) : au.pause(); e.preventDefault(); }
    if (e.code === 'ArrowRight') seek(t + (e.shiftKey ? 10 : 2));
    if (e.code === 'ArrowLeft') seek(t - (e.shiftKey ? 10 : 2));
  });
  bar.addEventListener('input', () => seek(+bar.value));
  const loop = now => {
    const dt = (now - last) / 1000; last = now;
    if (playing) t = au && !au.paused ? au.currentTime : Math.min(TL.total, t + dt);
    window.render(t);
    bar.value = t; const i = TL.idx(t), L = i >= 0 ? TL.lines[i] : null;
    info.innerHTML = `<b>${t.toFixed(2)}s</b> / ${TL.total}s　${L ? L.id + '　' + L.text.replace(/[{}]/g, '') : ''}　｜ 空格 播放/暂停 · ←→ 2 秒 · Shift+←→ 10 秒${au ? '' : ' · 没找到配音，按时钟播放'}`;
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
})();
