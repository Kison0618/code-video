// 合成一帧：底（深蓝黑 + 尘埃）→ 当前镜头（交界处和上一个镜头交叉淡化，片名处硬切）→ 泛光 → 暗角颗粒 → 首尾淡入淡出
'use strict';
const K = require('./core');
const { W, H, Canvas, prog, smooth } = K;
const A = require('./audio');
const FX = require('./fx');
const BG = require('./bg');

const NAMES = ['hook', 'title', 'l01_skinner', 'l02_hedonic', 'l03_fluency', 'l04_window', 'l05_compare', 'l06_polar', 'l07_numb', 'l08_helpless', 'l09_time', 'l10_choice', 'l11_dual', 'end'];
const SHOTS = NAMES.map(n => require('./shots/' + n));
const HARD = new Set([1, 10]);  // 曲子进入（片名）和再次进入（定律 09）的那一下硬切
const TR = 0.4;
const OFF = new Canvas(W, H), OFFB = new Canvas(W, H);

function shotAt(t) { let i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return i < 0 ? SHOTS.length - 1 : i; }
function paint(ctx, i, t) {
  const s = SHOTS[i];
  BG.draw(ctx, t, s.bg ? s.bg(t) : {});
  s.draw(ctx, t);
}

function renderFrame(ctx, t, frame) {
  ctx.save();
  const i = shotAt(t);
  paint(ctx, i, t);
  if (i > 0 && !HARD.has(i) && t < SHOTS[i].t0 + TR) {
    const a = 1 - smooth((t - SHOTS[i].t0) / TR);
    const ox = OFF.getContext('2d'); ox.reset();
    paint(ox, i - 1, t);
    FX.flatten(OFF, OFFB);
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(OFFB, 0, 0); ctx.restore();
  }
  const base = FX.bake(ctx);
  FX.bloom(ctx, 0.45, base);
  FX.finish(ctx, frame, 0.85);
  FX.black(ctx, Math.max(1 - smooth(prog(t, 0, 0.25)), smooth(prog(t, A.DUR - 1.0, A.DUR - 0.05))));
  ctx.restore();
}
module.exports = { renderFrame, SHOTS };
