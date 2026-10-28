// 字幕：底部居中一行，64px 思源黑体粗，深色字 + 浅色描边（纸面上都清楚）。按句换，切块见 timeline.js
'use strict';
const K = require('./core');
const { W, rgba, clamp, smooth, prog } = K;
const TL = require('./timeline');

const Y = 1022, SIZE = 64;
const INK = [34, 27, 22], RIM = [250, 244, 230];
const WHITE = [255, 252, 244], DARK = [28, 20, 14];

// photo = 底下是照片：改成白字深描边
function draw(ctx, t, hide, photo) {
  if (hide || TL.inCard(t)) return;
  const live = TL.CAPS.find(c => t >= c.t0 - 0.08 && t < c.out);
  if (!live) return;
  const a = smooth(prog(t, live.t0 - 0.08, live.t0 + 0.1)) * (1 - smooth(prog(t, live.out - 0.12, live.out)));
  if (a <= 0.01) return;
  ctx.save();
  let size = SIZE;
  ctx.font = `700 ${size}px Sans`;
  let w = ctx.measureText(live.s).width;
  if (w > W - 200) { size = Math.floor(size * (W - 200) / w); ctx.font = `700 ${size}px Sans`; w = ctx.measureText(live.s).width; }
  ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.lineJoin = 'round';
  const y = Y + (1 - smooth(prog(t, live.t0 - 0.08, live.t0 + 0.18))) * 8;
  // 柔和投影 + 浅描边 + 深字
  ctx.shadowColor = `rgba(20,12,5,${(photo ? 0.6 : 0.35) * a})`; ctx.shadowBlur = 14; ctx.shadowOffsetY = 3;
  ctx.strokeStyle = rgba(photo ? DARK : RIM, clamp(a)); ctx.lineWidth = 14; ctx.strokeText(live.s, W / 2, y);
  ctx.shadowColor = 'transparent';
  ctx.fillStyle = rgba(photo ? WHITE : INK, clamp(a)); ctx.fillText(live.s, W / 2, y);
  ctx.restore();
}
module.exports = { draw, Y, SIZE };
