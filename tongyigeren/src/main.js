// 每一帧：选场景 → 场景自己画（木板 + 标签）→ 字幕 → 颗粒和暗角
'use strict';
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
SCENES.sort((a, b) => a.t0 - b.t0);
window.TOTAL = TL.total;
window.render = function (t) {
  t = clamp(t, 0, TL.total);
  let sc = SCENES[0]; for (const s of SCENES) if (s.t0 <= t) sc = s;
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.filter = 'none';
  ctx.fillStyle = css(PAL.bg); ctx.fillRect(0, 0, W, H);
  const r = sc.draw(ctx, t) || {};
  subBand(ctx, r.band === undefined ? 1 : r.band);
  if (!r.noCorner) HUD.corner(ctx, t);
  if (!r.noSub) drawSubtitle(ctx, t);
  Post.finish(ctx, t, r.post);
};
