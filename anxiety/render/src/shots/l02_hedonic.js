// 定律 02 · 享乐适应（1971，布里克曼 & 坎贝尔）  30.91–39.40 秒
//  左：多巴胺曲线——每一次高刺激都是一根尖峰，尖峰过后基线回不到原来的位置，一级级往上抬
//  右：各种事情的刺激强度。左右两张图共用一条"爽的下限"（阈值线），它每抬高一次，就有一根柱子掉到线下面、变灰："无感"
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, glow, glowLine, hash, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(58), T1 = B(74);
const Y0 = 330, Y1 = 780;                     // 两张图共用的纵轴：0..100
const yOf = v => lerp(Y1, Y0, v / 100);
const TA = T0 + 0.6, TB = T0 + 6.4;          // 曲线从左画到右
// 刺激事件（在曲线上的相对位置），每一次之后阈值抬高一点
const EVENTS = [0.07, 0.17, 0.25, 0.34, 0.41, 0.5, 0.57, 0.65, 0.72, 0.8, 0.86, 0.93];
const thAt = u => 12 + 46 * EVENTS.filter(e => e + 0.02 < u).length / EVENTS.length;
const BARS = [['散步', 22], ['学习', 26], ['读书', 31], ['运动', 40], ['聊天', 47], ['游戏', 80], ['短视频', 95]];

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 1971, prev: 1957, who: 'P. 布里克曼 & D. 坎贝尔', no: '02', law: '享乐适应', en: 'Hedonic Adaptation', paper: 'Hedonic Relativism and Planning the Good Society', paperCn: '《享乐相对论与美好社会规划》' });
  const a = smooth(prog(t, T0 + 0.2, T0 + 0.6)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  const up = easeInOut(prog(t, TA, TB));
  const th = thAt(up);
  // —— 左：多巴胺曲线 ——
  const X0 = 180, X1 = 860;
  UI.axes(ctx, [X0, Y0, X1, Y1], a, { nx: 8, ny: 5 });
  UI.note(ctx, '多巴胺 · DOPAMINE', X0, Y0 - 18, { size: 20, alpha: a });
  const pts = [];
  for (let i = 0; i <= 400; i++) {
    const u = i / 400 * up;
    let v = thAt(u) * 0.9 + 3 * Math.sin(u * 60) * 0.5;
    for (const e of EVENTS) { const d = (u - e) * 60; if (d > 0) v += (40 + 30 * e) * Math.exp(-d) * (1 - Math.exp(-d * 6)); }
    pts.push([lerp(X0, X1, u), yOf(Math.min(98, v))]);
  }
  glowLine(ctx, pts, C.cyan, a, 2);
  const e = pts[pts.length - 1]; glow(ctx, e[0], e[1], 30, C.cyan, 0.8 * a);
  // —— 右：刺激强度柱 ——
  const BX0 = 1000, BX1 = 1780, bw = (BX1 - BX0) / BARS.length;
  UI.note(ctx, '刺激强度 · STIMULATION', BX0, Y0 - 18, { size: 20, alpha: a });
  ctx.fillStyle = rgba(C.line, a); ctx.fillRect(BX0, Y1, BX1 - BX0, 1);
  BARS.forEach(([nm, v], i) => {
    const grow = easeOut(prog(t, T0 + 0.4 + i * 0.06, T0 + 1.0 + i * 0.06));
    const x = BX0 + i * bw + 14, w = bw - 28, y = yOf(v * grow);
    const dead = v < th, hi = v > 70;
    const dk = dead ? smooth(prog(th - v, 0, 4)) : 0;
    const col = mix(hi ? C.cyan : C.gold, [70, 70, 76], dk);
    ctx.fillStyle = rgba(col, (0.85 - 0.35 * dk) * a); ctx.fillRect(x, y, w, Y1 - y);
    if (hi) glow(ctx, x + w / 2, y, 90, C.cyan, 0.2 * a);
    text(ctx, nm, x + w / 2, Y1 + 40, { family: 'Song', size: 26, color: dead ? C.dim : C.bone, alpha: a });
    UI.note(ctx, String(v), x + w / 2, y - 12, { size: 20, alpha: a * grow, align: 'center', color: dead ? C.dim : C.bone });
    if (dk > 0) text(ctx, '无感', x + w / 2, y - 44, { family: 'Song', size: 26, weight: 700, color: C.red, alpha: a * dk });
  });
  // —— 阈值线：横穿两张图 ——
  const ty = yOf(th);
  ctx.save(); ctx.setLineDash([10, 8]); ctx.strokeStyle = rgba(C.red, 0.9 * a); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(X0, ty); ctx.lineTo(BX1 + 10, ty); ctx.stroke(); ctx.restore();
  glow(ctx, BX1 + 10, ty, 40, C.red, 0.4 * a);
  text(ctx, '爽的下限', 920 + 10, ty - 14, { family: 'Song', size: 24, color: C.red, alpha: a });
  text(ctx, th.toFixed(0), 930, ty + 32, { family: 'Mono', size: 28, color: C.red, alpha: a });
  T.seq(ctx, t, [
    { t: B(59), s: '刺激一次比一次强，', en: 'Each hit is stronger than the last,' },
    { t: B(62), s: '你的阈值，也一次比一次高。', hl: { '阈值': C.red }, en: 'and your threshold rises every time.' },
    { t: B(66), s: '看书、学习，这些无趣而有用的事——' },
    { t: B(70), s: '再也爽不起来了。', fx: 'slam', size: 72, hl: { '爽不起来': C.red }, en: 'The useful, quiet things stop feeling like anything at all.' },
  ], { y: CARD.CAP_Y, size: 60, out: T1 - 0.05 });
}
module.exports = { draw, t0: T0, t1: T1 };
