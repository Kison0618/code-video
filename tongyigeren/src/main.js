// 每一帧：选场景 → 场景自己画 → 字幕 → 纸纹
'use strict';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
SCENES.sort((a, b) => a.t0 - b.t0);
window.TOTAL = TL.total;
window.render = function (t) {
  t = clamp(t, 0, TL.total);
  let sc = SCENES[0]; for (const s of SCENES) if (s.t0 <= t) sc = s;
  camReset(ctx); shOff(ctx); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = css(PAL.bg); ctx.fillRect(0, 0, W, H);
  const r = sc.draw(ctx, t) || {};
  camReset(ctx); shOff(ctx); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
  Post.finish(ctx, t, r.post);
  subBand(ctx, r.band === undefined ? 1 : r.band);
  if (!r.noSub) drawSubtitle(ctx, t);
};
