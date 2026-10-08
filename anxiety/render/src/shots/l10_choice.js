// 定律 10 · 选择过载（2000，艾扬格 & 莱珀）  102.12–110.62 秒
//  超市试吃摊：一边 24 种果酱，一边 6 种。驻足 60% vs 40%，买的人 3% vs 30%。
//  "无限选择是混乱"：24 罐乱成一团；"自律是自由"：6 罐排齐、亮起来
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, hash, noise1, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(192), T1 = B(208);
const JAMC = [[196, 40, 70], [226, 120, 50], [150, 50, 130], [230, 180, 60], [120, 30, 50], [210, 80, 100], [90, 40, 120], [240, 150, 90]];
const TCH = B(200), TOR = B(203.5);

function jar(ctx, x, y, s, col, a, lit) {
  ctx.fillStyle = rgba(mix(col, C.bg, 0.15), 0.9 * a); ctx.beginPath(); ctx.roundRect(x - 22 * s, y - 28 * s, 44 * s, 56 * s, 8 * s); ctx.fill();
  ctx.fillStyle = rgba([200, 190, 170], 0.9 * a); ctx.fillRect(x - 24 * s, y - 36 * s, 48 * s, 10 * s);
  ctx.fillStyle = rgba(C.white, 0.25 * a); ctx.fillRect(x - 15 * s, y - 20 * s, 5 * s, 34 * s);
  if (lit) glow(ctx, x, y, 70 * s, C.gold, 0.35 * lit * a);
}
function booth(ctx, t, n, cx, cols, a, stop, buy, k) {
  const rows = Math.ceil(n / cols), dx = 74, dy = 86;
  const chaos = n === 24 ? easeInOut(prog(t, TCH, TCH + 0.8)) : 0;
  const order = n === 6 ? smooth(prog(t, TOR, TOR + 0.5)) : 0;
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const u = easeOutExpo(prog(t, T0 + 0.2 + i * 0.03, T0 + 0.6 + i * 0.03));
    let x = cx + (c - (cols - 1) / 2) * dx, y = 470 + (r - (rows - 1) / 2) * dy;
    x += chaos * 60 * noise1(i * 3.1 + t * 1.5, 1); y += chaos * 45 * noise1(i * 2.3 + t * 1.7, 2);
    jar(ctx, x, y - (1 - u) * 60, n === 24 ? 0.85 : 1.15, JAMC[(i * 5 + k) % JAMC.length], a * u, order);
  }
  text(ctx, n + ' 种果酱', cx, 680, { family: 'Song', size: 34, weight: 700, color: C.white, alpha: a });
  // 统计
  const sa = smooth(prog(t, T0 + 1.3, T0 + 1.7)) * a, ba = smooth(prog(t, B(196), B(196) + 0.4)) * a;
  const sv = stop * easeOut(prog(t, T0 + 1.3, T0 + 2.1)), bv = buy * easeOut(prog(t, B(196), B(196) + 0.8));
  text(ctx, '驻足', cx - 170, 750, { family: 'Song', size: 26, color: C.bone, alpha: sa, align: 'left' });
  ctx.fillStyle = rgba(C.gray, 0.8 * sa); ctx.fillRect(cx - 100, 732, 220 * sv / 100, 16);
  text(ctx, Math.round(sv) + '%', cx + 130, 752, { family: 'Mono', size: 28, color: C.bone, alpha: sa, align: 'left' });
  const bc = buy < 10 ? C.red : C.gold;
  text(ctx, '购买', cx - 170, 812, { family: 'Song', size: 26, color: C.bone, alpha: ba, align: 'left' });
  ctx.fillStyle = rgba(bc, 0.9 * ba); ctx.fillRect(cx - 100, 794, 220 * bv / 100, 16);
  text(ctx, Math.round(bv) + '%', cx + 130, 818, { family: 'Mono', size: 44, color: bc, alpha: ba, align: 'left' });
}
function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 2000, prev: 1877, who: 'S. 艾扬格 & M. 莱珀 · 哥伦比亚 / 斯坦福', no: '10', law: '选择过载', en: 'Choice Overload', paper: 'When Choice is Demotivating', paperCn: '《当选择让人失去动力》' });
  const a = smooth(prog(t, T0 + 0.1, T0 + 0.5)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  booth(ctx, t, 24, 640, 6, a, 60, 3, 0);
  booth(ctx, t, 6, 1380, 3, a, 40, 30, 3);
  ctx.fillStyle = rgba(C.line, a); ctx.fillRect(W / 2 + 60, 340, 1, 480);
  const xa = smooth(prog(t, B(197.5), B(198.5))) * a;
  text(ctx, '× 10', W / 2 + 60, 822, { family: 'Mono', size: 40, color: C.gold, alpha: xa });
  T.seq(ctx, t, [
    { t: B(192.6), s: '选项越多，人越不行动。', en: 'The more options, the less we act.' },
    { t: B(196), s: '24 种果酱，3% 的人买；6 种，30%。', hl: { '3%': C.red, '30%': C.gold }, en: '24 jams: 3% bought. 6 jams: 30%.' },
    { t: TCH, s: '无限选择，是混乱；', hl: { '混乱': C.red }, en: 'Unlimited choice is chaos;' },
    { t: TOR, s: '自律，才是自由的最终形态。', fx: 'slam', size: 76, hl: { '自由': C.gold }, en: 'discipline is the final form of freedom.' },
  ], { y: CARD.CAP_Y + 10, size: 60, out: T1 - 0.05 });
}
module.exports = { draw, t0: T0, t1: T1 };
