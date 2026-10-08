// 定律 06 · 群体极化（1969，莫斯科维奇 & 扎瓦洛尼）  67.04–77.67 秒
//  两千个人的观点：一开始是一座山（大多数人在中间），算法只喂你同意的东西，山慢慢裂成两座；
//  "中间派"从 60% 掉到个位数。坐标轴的标题轮流换成贫富、两性、地域、意识形态；最后两边之间飞起红色的弧线：互喷
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, glow, hash, mulberry32, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { gauss } = require('../util');
const { B } = A;

const T0 = B(126), T1 = B(146);
const N = 2000, X0 = 200, X1 = 1720, CY = 520, HY = 790;
const AG = (() => { const r = mulberry32(69), o = []; for (let i = 0; i < N; i++) { const x0 = clamp(gauss(r) * 0.33, -0.95, 0.95); o.push({ x0, y: gauss(r) * 0.5, d: r(), side: x0 >= 0 ? 1 : -1, ph: r() * 6.28 }); } return o; })();
const TP0 = T0 + 1.6, TP1 = B(139);                    // 极化过程
const opin = (g, p) => { const tgt = g.side * (0.74 + 0.14 * (hash(g.d * 99) + hash(g.d * 57) - 1)); return lerp(g.x0, tgt, easeInOut(clamp(p * (0.7 + 0.6 * g.d)))); };
const TOPICS = ['贫富', '两性', '地域', '意识形态'];
const TT = B(135);
const xOf = v => lerp(X0, X1, (v + 1) / 2);

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 1969, prev: 1954, who: 'S. 莫斯科维奇 & M. 扎瓦洛尼', no: '06', law: '群体极化', en: 'Group Polarization', paper: 'The Group as a Polarizer of Attitudes', paperCn: '《群体是态度的极化器》' });
  const a = smooth(prog(t, T0 + 0.1, T0 + 0.5)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  const p = prog(t, TP0, TP1);
  // 人
  const hist = new Array(80).fill(0);
  const cols = [[], []];
  for (const g of AG) {
    const v = opin(g, p);
    const x = xOf(v) + Math.sin(t * 1.3 + g.ph) * 3, y = CY + g.y * 110 * (1 - 0.3 * p);
    cols[g.side > 0 ? 1 : 0].push(x, y);
    hist[Math.min(79, Math.floor((v + 1) / 2 * 80))]++;
  }
  const sideCol = [mix(C.cyan, C.gray, 0.6 * (1 - p)), mix([232, 120, 84], C.gray, 0.6 * (1 - p))];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  cols.forEach((c, k) => { ctx.fillStyle = rgba(sideCol[k], 0.8 * a); ctx.beginPath(); for (let i = 0; i < c.length; i += 2) ctx.rect(c[i] - 1.2, c[i + 1] - 1.2, 2.4, 2.4); ctx.fill(); });
  ctx.restore();
  // 分布曲线
  const mx = Math.max(...hist), pts = hist.map((h, i) => [lerp(X0, X1, (i + 0.5) / 80), HY - h / Math.max(mx, 90) * 120]);
  K.glowLine(ctx, pts, C.bone, 0.8 * a, 1.6);
  ctx.fillStyle = rgba(C.line, a); ctx.fillRect(X0, HY, X1 - X0, 1);
  // 轴标题：轮流换
  const ti = t < TT ? -1 : Math.min(TOPICS.length - 1, Math.floor((t - TT) / ((B(139) - TT) / TOPICS.length)));
  const topic = ti < 0 ? '观点' : TOPICS[ti];
  text(ctx, '← 一方', X0, HY + 40, { family: 'Song', size: 24, color: sideCol[0], alpha: a, align: 'left' });
  text(ctx, '另一方 →', X1, HY + 40, { family: 'Song', size: 24, color: sideCol[1], alpha: a, align: 'right' });
  text(ctx, topic, W / 2, HY + 44, { family: 'Song', size: 32, weight: 700, color: C.white, alpha: a });
  // 中间派
  const mid = AG.filter(g => Math.abs(opin(g, p)) < 0.25).length / N;
  UI.note(ctx, '中间派', 1500, 330, { size: 22, alpha: a });
  text(ctx, Math.round(mid * 100) + '%', 1500, 400, { family: 'Mono', size: 60, color: mid < 0.2 ? C.red : C.bone, alpha: a, align: 'left' });
  UI.note(ctx, '算法：只推你同意的', X0, 330, { size: 22, color: C.cyan, alpha: a });
  // 互喷：两边之间的红色弧线（带飞行的光点）
  const fa = smooth(prog(t, B(138.5), B(139.5))) * a;
  if (fa > 0) {
    const r = mulberry32(5);
    for (let i = 0; i < 46; i++) {
      const l = xOf(-0.55 - r() * 0.35), rr = xOf(0.55 + r() * 0.35), y0 = CY + (r() - 0.5) * 140, y1 = CY + (r() - 0.5) * 140;
      const dir = r() < 0.5, ph = r(), sp = 0.8 + r() * 0.6;
      const h = 120 + r() * 160;
      const pt = u => { const x = lerp(l, rr, u), y = lerp(y0, y1, u) - Math.sin(u * Math.PI) * h; return [x, y]; };
      const arc = []; for (let k = 0; k <= 30; k++) arc.push(pt(k / 30));
      K.line(ctx, arc, C.red, 0.18 * fa, 1);
      const u = ((t * sp + ph) % 1), q = pt(dir ? u : 1 - u);
      glow(ctx, q[0], q[1], 16, C.red, 0.7 * fa);
    }
  }
  T.seq(ctx, t, [
    { t: B(127), s: '算法只给你看，你同意的东西。', hl: { '你同意的': C.cyan }, en: 'The algorithm only shows you what you already agree with.' },
    { t: B(131), s: '讨论之后，每个人都更极端了。', hl: { '更极端': C.red }, en: 'After the discussion, everyone is more extreme.' },
    { t: TT, s: '贫富，两性，地域，意识形态——', fx: 'decode', size: 58, cps: 14 },
    { t: B(139), s: '站队，互喷。', fx: 'glitch', size: 84, color: C.white, en: 'Pick a side. Open fire.' },
    { t: B(142.5), s: '焦虑，成了所有人通向未来的唯一解。', hl: { '唯一解': C.red }, en: 'Anxiety became everyone\'s only road to the future.' },
  ], { y: CARD.CAP_Y + 20, size: 58, out: T1 - 0.05 });
}
module.exports = { draw, t0: T0, t1: T1 };
