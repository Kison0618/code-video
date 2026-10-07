// 合成一帧：画面 → 泛光 → 色散 → 撕裂 → 反色 → 闪白 → HUD → 暗角颗粒
'use strict';
const K = require('./core');
const { W, H, C, rgba, clamp, prog, smooth, text, glow } = K;
const A = require('./audio');
const FX = require('./fx');
const SC = require('./scenes');

const LOOK = {
  pre0: { bloom: 0.8 }, intro: { bloom: 1.0, zoom: 0.03, shake: 0.5, chroma: 3, glitch: 0.3 },
  verse: { bloom: 0.7, zoom: 0.03, shake: 0.4, chroma: 3, glitch: 0.3 }, pre: { bloom: 0.75, zoom: 0, shake: 0, chroma: 0 },
  chorus: { bloom: 0.85, zoom: 0.05, shake: 1.2, chroma: 9, glitch: 1, invert: 1 }, break: { bloom: 1.2 },
  verse2: { bloom: 0.75, zoom: 0.03, shake: 0.4, chroma: 3, glitch: 0.3 }, pre2: { bloom: 0.8 },
  chorus2: { bloom: 0.9, zoom: 0.05, shake: 1.3, chroma: 10, glitch: 1, invert: 1 }, bridge: { bloom: 0.9, zoom: 0.03, shake: 0.8, chroma: 6, glitch: 0.6 },
  final: { bloom: 0.95, zoom: 0.06, shake: 1.5, chroma: 12, glitch: 1.2, invert: 1 }, outro: { bloom: 0.9 },
};

function hud(ctx, t, S) {
  const a = (S.name === 'pre0' || S.name === 'outro') ? 0 : 0.5 * smooth(prog(t, A.beatT(16), A.beatT(20)));
  if (a <= 0) return;
  text(ctx, 'TEETH', 120, 96, { family: 'Mono', size: 15, alpha: a, spacing: 0.6, align: 'left' });
  text(ctx, `${A.D.bpm.toFixed(0)} BPM`, 120, 122, { family: 'Mono', size: 12, weight: 300, alpha: a * 0.6, spacing: 0.3, align: 'left' });
  text(ctx, `BITE ${String(A.bitesAt(t)).padStart(4, '0')}`, W - 120, 96, { family: 'Mono', size: 15, alpha: a, spacing: 0.3, align: 'right', color: C.blood });
  text(ctx, S.name.toUpperCase(), W - 120, 122, { family: 'Mono', size: 12, weight: 300, alpha: a * 0.6, spacing: 0.3, align: 'right' });
  // 8 拍循环：亮起的是有重击的拍
  const pos = A.cyclePos(t), k0 = Math.floor(A.beatF(t)) - pos;
  for (let i = 0; i < 8; i++) {
    const x = W / 2 + (i - 3.5) * 22, on = i === pos, hit = A.isHit(k0 + i);
    ctx.fillStyle = rgba(hit ? C.blood : C.bone, a * (on ? 1 : 0.3));
    ctx.beginPath(); ctx.arc(x, H - 70, on ? 4 : 2.5, 0, 6.283); ctx.fill();
  }
}

function renderFrame(ctx, t, frame) {
  ctx.save();
  ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, W, H);
  const S = A.section(t);
  const L = LOOK[S.name] || LOOK.pre0;
  const h = A.hit(t, 10);
  ctx.save();
  FX.camera(ctx, t, { zoom: 1 + (L.zoom || 0) * h, shake: (L.shake || 0) * h, rot: 0 });
  const fn = SC.DRAW[S.name];
  if (fn) fn(ctx, t, S);
  ctx.restore();
  const base = FX.bake(ctx);
  FX.bloom(ctx, (L.bloom || 1) * (1 + 0.4 * h), base);
  FX.chroma(ctx, (L.chroma || 0) * h);
  const { k, s } = A.sinceBeat(t);
  if (L.glitch && A.isHit(k)) FX.glitch(ctx, L.glitch * Math.exp(-s * 14), k * 7 + Math.floor(s * 30));
  // 一组重击的第一下：负片闪一下
  if (L.invert && A.isHit(k) && !A.isHit(k - 1)) FX.invert(ctx, Math.exp(-s * 22));
  FX.flash(ctx, 0.1 * A.hit(t, 18), C.blood);
  hud(ctx, t, S);
  FX.finish(ctx, frame, 1);
  FX.black(ctx, Math.max(1 - smooth(prog(t, 0, 0.3)), smooth(prog(t, A.DUR - 0.8, A.DUR - 0.05))));
  ctx.restore();
}
module.exports = { renderFrame };
