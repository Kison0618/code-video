// 结尾（119.12–130 秒）：此刻 · 你
//  一条灰色虚线是想象中的"逆袭"（一下冲到顶）；金线是真实的自己：歪歪扭扭、有回落，但一直往上
//  最后光点聚成片名
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, glow, glowLine, noise1, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(224), T1 = A.DUR + 1;
const X0 = 220, X1 = 1700, Y0 = 360, Y1 = 780;
const TT = B(234.8);
const real = u => { const steps = 14, p = u * steps, i = Math.floor(p), f = p - i; return 0.08 + 0.78 * (i + smooth(clamp((f - 0.5) / 0.4))) / steps - 0.05 * Math.max(0, noise1(u * 9, 5)); };

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: TT + 0.3, year: 2020, prev: 2011, who: '此刻 · 你', law: '尊重现实', en: 'Respect Reality', sealText: '此刻' });
  const a = smooth(prog(t, T0 + 0.1, T0 + 0.5)) * lerp(1, 0.18, smooth(prog(t, TT - 0.3, TT + 0.6)));
  // 想象中的逆袭
  const ia = smooth(prog(t, T0 + 0.4, T0 + 1.0)) * a;
  ctx.save(); ctx.setLineDash([8, 10]); ctx.strokeStyle = rgba(C.gray, 0.7 * ia); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(X0, Y1); ctx.bezierCurveTo(X0 + 600, Y1, X0 + 700, Y1, X0 + 820, Y0 - 40); ctx.stroke(); ctx.restore();
  text(ctx, '想象中的逆袭', X0 + 840, Y0 - 30, { family: 'Song', size: 26, color: C.gray, alpha: ia, align: 'left' });
  // 真实的自己
  const up = prog(t, T0 + 0.5, B(233));
  const pts = []; for (let i = 0; i <= 300; i++) { const u = i / 300 * up; pts.push([lerp(X0, X1, u), lerp(Y1, Y0, real(u))]); }
  glowLine(ctx, pts, C.gold, a, 2.6);
  const e = pts[pts.length - 1];
  glow(ctx, e[0], e[1], 70, C.gold, 0.6 * a); ctx.fillStyle = rgba(C.white, a); ctx.beginPath(); ctx.arc(e[0], e[1], 5, 0, 6.2832); ctx.fill();
  text(ctx, '你', e[0] + 18, e[1] - 14, { family: 'Song', size: 30, weight: 700, color: C.gold, alpha: a, align: 'left' });
  UI.note(ctx, '早睡早起 · 关掉朋友圈 · 删掉 App · 换小屏手机', X0, Y1 + 50, { size: 22, color: C.gold, alpha: smooth(prog(t, T0 + 1.5, T0 + 2.0)) * a });
  T.seq(ctx, t, [
    { t: B(224.6), s: '我并没有逆袭，', en: "I didn't turn my life around overnight," },
    { t: B(227.5), s: '但我在一步一步变好。', hl: { '一步一步': C.gold }, en: 'but I am getting better, step by step.' },
    { t: B(231), s: '对科技多点警惕——打不过，就跑。', hl: { '就跑': C.gold }, out: TT - 0.3, en: "Be wary of technology. If you can't beat it, run." },
  ], { y: CARD.CAP_Y, size: 60 });
  // 片名
  T.particleText(ctx, t, '生于焦虑，死于自律', { t0: TT, y: 470, size: 120, color: C.gold, dur: 1.2, en: 'Born in anxiety. Ended in discipline.' });
  T.rise(ctx, t, '从认知开始，和习惯协调，知行合一。', { t0: B(238.5), y: 700, size: 40, color: C.bone, hl: { '知行合一': C.gold } });
}
module.exports = { draw, t0: T0, t1: T1 };
