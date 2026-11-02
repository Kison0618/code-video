// 合成一帧：纸底 → 场景（各自管淡入淡出）→ 左上角栏目名 → 字幕 → 纸纹颗粒 → 开头黑场
'use strict';
const K = require('./core');
const { W, H, prog, smooth } = K;
const P = require('./paper');
const FX = require('./fx');
const SUBS = require('./subs');
const HUD = require('./hud');
const SCENES = require('./scenes');

function renderFrame(ctx, t, frame) {
  ctx.save();
  ctx.fillStyle = P.BG; ctx.fillRect(0, 0, W, H);
  const live = SCENES.filter(s => t >= s.t0 - 1 && t < s.t1 + 1);
  for (const s of live) s.draw(ctx, t);
  for (const s of live) if (s.over) s.over(ctx, t);
  HUD.draw(ctx, t);
  SUBS.draw(ctx, t, live.some(s => s.hideSubs && s.hideSubs(t)), live.some(s => s.photoSubs && s.photoSubs(t)));
  FX.finish(ctx);
  FX.black(ctx, 1 - smooth(prog(t, 0, 0.1)));
  ctx.restore();
}
// —— 山河 GL 转场（排线/翻页/撕纸）：转场时段前后两个镜头各画一张，交 GL 桥合成，再盖 HUD/字幕/颗粒 ——
const SH = process.env.SHANHE_LIB || 'F:/AI/For AI to use/codex2/视频/资料库/转场库_山河/lib';   // 云端：SHANHE_LIB=../../transitions/lib
const path = require('path');
let gb = null, cA = null, cB = null;
async function glBridge() {
  if (!gb) {
    const { createGLBridge } = require(SH + '/node/gl-bridge');
    gb = await createGLBridge({ width: W, height: H, executablePath: process.env.SHANHE_CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe',
      profileDir: path.join(__dirname, '../.render-tmp/chrome_ep03_' + process.pid) });
    cA = new K.Canvas(W, H); cB = new K.Canvas(W, H);
  }
  return gb;
}
async function renderFrameAsync(ctx, t, frame) {
  const g = SCENES.glAt(t);
  if (!g) return renderFrame(ctx, t, frame);
  const b = await glBridge();
  const a = cA.getContext('2d'), c = cB.getContext('2d');
  a.reset(); c.reset();
  SCENES.drawShot(a, g.from, t); SCENES.drawShot(c, g.to, t);
  const px = await require(SH + '/picks').framePick(b, cA, cB, g.id, g.elapsed);
  ctx.save();
  ctx.putImageData(b.toImageData(px, require('skia-canvas').ImageData), 0, 0);
  const live = SCENES.filter(s => t >= s.t0 - 1 && t < s.t1 + 1);
  for (const s of live) if (s.over) s.over(ctx, t);
  HUD.draw(ctx, t);
  SUBS.draw(ctx, t, false, false);
  FX.finish(ctx);
  FX.black(ctx, 1 - smooth(prog(t, 0, 0.1)));
  ctx.restore();
}
async function closeGL() { if (gb) { await gb.close(); gb = null; } }
module.exports = { renderFrame, renderFrameAsync, closeGL, SCENES };
