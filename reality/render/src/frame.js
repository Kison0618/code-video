// 合成一帧：按时间找到当前镜头（镜头交界处短暂交叉淡化，重拍上的硬切除外）→ 轻微泛光 → 暗角颗粒 → 首尾淡入淡出
'use strict';
const K = require('./core');
const { W, H, C, Canvas, rgba, prog, smooth } = K;
const A = require('./audio');
const FX = require('./fx');

const SHOTS = ['s1_open', 's2_malice', 's3_please', 's4_compass', 's5_scapegoat', 's6_split', 's7_filter', 's8_final'].map(n => require('./shots/' + n));
// 这些交界是硬切：急停之后副歌砸进来，硬切更有冲击力
const HARD = new Set([2, 5]);
const TR = 0.35;
const OFF = new Canvas(W, H), OFFB = new Canvas(W, H);

function shotAt(t) { let i = SHOTS.findIndex(s => t >= s.t0 && t < s.t1); return i < 0 ? SHOTS.length - 1 : i; }
function paint(ctx, i, t) { ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, W, H); SHOTS[i].draw(ctx, t); }

function renderFrame(ctx, t, frame) {
  ctx.save();
  const i = shotAt(t);
  paint(ctx, i, t);
  // 与上一个镜头交叉淡化
  if (i > 0 && !HARD.has(i) && t < SHOTS[i].t0 + TR) {
    const a = 1 - smooth((t - SHOTS[i].t0) / TR);
    const ox = OFF.getContext('2d'); ox.reset();
    paint(ox, i - 1, t);
    FX.flatten(OFF, OFFB);
    ctx.save(); ctx.globalAlpha = a; ctx.drawImage(OFFB, 0, 0); ctx.restore();
  }
  const base = FX.bake(ctx);
  FX.bloom(ctx, 0.5, base);
  FX.finish(ctx, frame, 0.9);
  FX.black(ctx, Math.max(1 - smooth(prog(t, 0, 0.3)), smooth(prog(t, A.DUR - 1.2, A.DUR - 0.05))));
  ctx.restore();
}
module.exports = { renderFrame };
