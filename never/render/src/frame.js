// 合成一帧：当前场景（段落交界处与下一个场景交叉淡化）→ 片名与歌词 → 柔和的泛光 → 暗角颗粒
// 不再有按拍的震动、闪白、色散：音乐只改变场景、亮度、密度和"事件"（流星、烟花……）
'use strict';
const K = require('./core');
const { W, H, C, Canvas, rgba, clamp, prog, smooth, text, glow, vis } = K;
const A = require('./audio');
const FX = require('./fx');
const LY = require('./lyrics');

// 段落 → 场景
const WORLD = {
  intro: 'city', drift: 'rain', constel: 'attractor', tunnel: 'clouds', drop1: 'aurora',
  crystal: 'deepsea', ascent: 'lighthouse', tunnel2: 'timelight', final: 'lanterns', outro: 'ending',
};
const MODS = {};
function world(name) {
  if (!(name in MODS)) { try { MODS[name] = require('./world/' + name); } catch (e) { if (e.code === 'MODULE_NOT_FOUND') MODS[name] = null; else throw e; } }
  return MODS[name];
}
const BLOOM = { city: 0.7, rain: 0.6, memories: 0.8, clouds: 0.6, aurora: 0.9, deepsea: 0.7, lighthouse: 0.7, timelight: 0.9, lanterns: 0.9, ending: 0.8 };

function drawWorld(ctx, t, S) {
  ctx.save();
  ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, W, H);
  const m = world(WORLD[S.name]);
  if (m) m.draw(ctx, t, S);
  ctx.restore();
}

const OFF = new Canvas(W, H), OFFB = new Canvas(W, H);
const TR = 0.45; // 交叉淡化的半宽（秒），以段落交界为中心
function renderFrame(ctx, t, frame) {
  ctx.save();
  const S = A.section(t);
  drawWorld(ctx, t, S);
  // 段落交界：下一个场景淡入
  const idx = A.SECTIONS.findIndex(s => s[0] === S.name);
  const next = A.SECTIONS[idx + 1], prev = A.SECTIONS[idx - 1];
  let blendA = 0, other = null;
  if (next && t > A.barT(next[1]) - TR) { blendA = smooth((t - (A.barT(next[1]) - TR)) / (2 * TR)); other = A.section(A.barT(next[1]) + 0.001); }
  if (prev && t < A.barT(S.a) + TR) { blendA = 1 - smooth((t - (A.barT(S.a) - TR)) / (2 * TR)); other = A.section(A.barT(S.a) - 0.001); }
  if (other && blendA > 0.01) {
    const ox = OFF.getContext('2d'); ox.reset();
    drawWorld(ox, t, { ...other });
    FX.flatten(OFF, OFFB);
    ctx.save(); ctx.globalAlpha = blendA; ctx.drawImage(OFFB, 0, 0); ctx.restore();
  }
  const base = FX.bake(ctx);
  FX.bloom(ctx, BLOOM[WORLD[S.name]] || 0.7, base);

  // 片名：开场前两小节
  const ta = vis(t, A.barT(0.5), A.barT(4.5), 1.4, 1.4);
  if (ta > 0) {
    text(ctx, 'WE  NEVER', W / 2, H / 2 + 10, { size: 120, weight: 300, alpha: ta, spacing: 0.32 });
    text(ctx, '若 如 初 见', W / 2, H / 2 + 92, { family: 'Song', size: 34, weight: 300, alpha: 0.75 * ta * smooth(prog(t, A.barT(1.2), A.barT(2.4))), spacing: 0.5, color: C.gold });
  }
  // 歌词：位置和颜色由场景决定
  const m = world(WORLD[S.name]);
  LY.draw(ctx, t, (m && m.lyricStyle) || {});
  FX.finish(ctx, frame, 1);
  FX.black(ctx, Math.max(1 - smooth(prog(t, 0, 0.6)), smooth(prog(t, A.DUR - 1.2, A.DUR - 0.05))));
  ctx.restore();
}
module.exports = { renderFrame, WORLD };
