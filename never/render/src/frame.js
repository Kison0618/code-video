// 合成一帧：背景 → 镜头（冲击/抖动）→ 当前段落画面 → 泛光 → 色散 → 闪白 → HUD → 暗角颗粒
'use strict';
const K = require('./core');
const { W, H, C, rgba, clamp, lerp, prog, smooth, text, glow } = K;
const A = require('./audio');
const FX = require('./fx');
const SC = require('./scenes');

// 各段的后期强度
const LOOK = {
  pre: { bloom: 0.8, zoom: 0, shake: 0, chroma: 0, flash: 0 },
  intro: { bloom: 1.0, zoom: 0.03, shake: 0.25, chroma: 2, flash: 0.08 },
  drift: { bloom: 0.8, zoom: 0, shake: 0, chroma: 0, flash: 0 },
  constel: { bloom: 1.0, zoom: 0.012, shake: 0.05, chroma: 1, flash: 0.03 },
  tunnel: { bloom: 1.1, zoom: 0.03, shake: 0.3, chroma: 3, flash: 0.06 },
  drop1: { bloom: 1.25, zoom: 0.05, shake: 0.7, chroma: 7, flash: 0.14 },
  crystal: { bloom: 0.9, zoom: 0, shake: 0, chroma: 0, flash: 0 },
  ascent: { bloom: 1.0, zoom: 0.02, shake: 0.15, chroma: 1.5, flash: 0.04 },
  tunnel2: { bloom: 1.1, zoom: 0.035, shake: 0.35, chroma: 3.5, flash: 0.07 },
  final: { bloom: 1.35, zoom: 0.055, shake: 0.8, chroma: 8, flash: 0.16 },
  outro: { bloom: 0.9, zoom: 0, shake: 0, chroma: 0, flash: 0 },
};
// 每次 drop 的第一拍：大闪白
const DROPS = [A.barT(48), A.barT(96)];

function hud(ctx, t, S) {
  const a = (S.name === 'pre' || S.name === 'outro') ? 0 : 0.55 * smooth(prog(t, A.barT(2), A.barT(3)));
  if (a <= 0) return;
  const b = Math.max(0, Math.floor(A.barF(t))), beat = Math.max(0, Math.floor(A.beatF(t))) % 4;
  text(ctx, 'NEVER', 120, 96, { family: 'Mono', size: 15, weight: 400, alpha: a, spacing: 0.6, align: 'left' });
  text(ctx, `${A.D.bpm.toFixed(0)} BPM  ·  4/4`, 120, 122, { family: 'Mono', size: 12, weight: 300, alpha: a * 0.6, spacing: 0.3, align: 'left' });
  text(ctx, `BAR ${String(b + 1).padStart(3, '0')} / 128`, W - 120, 96, { family: 'Mono', size: 15, weight: 400, alpha: a, spacing: 0.3, align: 'right', color: C.gold });
  const idx = A.SECTIONS.findIndex(s => s[0] === S.name);
  text(ctx, `${String(idx + 1).padStart(2, '0')} · ${S.name.toUpperCase()}`, W - 120, 122, { family: 'Mono', size: 12, weight: 300, alpha: a * 0.6, spacing: 0.3, align: 'right' });
  // 底部四个拍点
  for (let i = 0; i < 4; i++) {
    const x = W / 2 + (i - 1.5) * 26, on = i === beat;
    ctx.fillStyle = rgba(on ? C.gold : C.ivory, a * (on ? 1 : 0.3));
    ctx.beginPath(); ctx.arc(x, H - 70, on ? 4 : 2.5, 0, 6.283); ctx.fill();
    if (on) glow(ctx, x, H - 70, 22, C.gold, a * A.pulse(t, 5));
  }
}

function renderFrame(ctx, t, frame) {
  ctx.save();
  ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, W, H);
  const S = A.section(t);
  const L = LOOK[S.name] || LOOK.pre;
  const k = A.kick(t, 9);
  ctx.save();
  // drop 里每 4 小节的重拍，整个画面转过一个角度
  let rot = 0;
  if (S.name === 'drop1' || S.name === 'final') {
    const ph = Math.floor(S.bar / 4), into = (S.bar - ph * 4) * 4;
    const sg = n => (n % 2 ? 1 : -1);
    rot = 0.16 * K.lerp(sg(ph - 1), sg(ph), K.easeOutExpo(into / 1.2));   // 左右来回摆，衔接连续
  }
  FX.camera(ctx, t, { zoom: 1 + L.zoom * k, shake: L.shake * k, rot });
  const fn = SC.DRAW[S.name];
  if (fn) fn(ctx, t, S);
  ctx.restore();
  const base = FX.bake(ctx);
  FX.bloom(ctx, L.bloom * (1 + 0.5 * k * (L.flash > 0.1 ? 1 : 0)), base);
  FX.chroma(ctx, L.chroma * k);
  // 拍点微闪
  FX.flash(ctx, L.flash * A.kick(t, 14), S.name === 'final' || S.name === 'drop1' ? C.white : C.gold);
  // drop 第一拍：全屏闪白
  for (const d of DROPS) { const age = t - d; if (age >= 0 && age < 0.9) FX.flash(ctx, Math.exp(-age * 5.5), C.white); }
  // 两次蓄力最后一小节的闪白滚奏
  for (const rb of [47, 95]) {
    const r = SC.rollStrobe(t, rb);
    FX.flash(ctx, r.flash, C.white);
    FX.black(ctx, r.black);
  }
  // 片尾最后一拍的闪白
  const end = t - A.barT(128); if (end >= 0 && end < 0.6) FX.flash(ctx, Math.exp(-end * 7) * 0.9, C.gold);
  hud(ctx, t, S);
  FX.finish(ctx, frame, 1);
  // 片头片尾黑场
  const fadeIn = 1 - smooth(prog(t, 0, 0.25));
  const fadeOut = smooth(prog(t, A.DUR - 0.6, A.DUR - 0.05));
  FX.black(ctx, Math.max(fadeIn, fadeOut));
  ctx.restore();
}
module.exports = { renderFrame };
