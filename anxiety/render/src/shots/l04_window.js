// 定律 04 · 可得性启发 + 幸存者偏差（1973，特沃斯基 & 卡尼曼）  47.93–58.54 秒
//  下：一万个人的真实分布（对数正态，长尾在右）。推荐算法只把最右边那 0.1% 捞进上方的"橱窗"。
//  橱窗越满，大脑以为的"正常水平"就越往右挪；"你"明明在中间，大脑给你的排名却一路往下掉。
//  最后一句"一边灿烂，一边腐烂"：橱窗里每张卡的下半截开始发暗、碎掉、往下掉
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, hash, mulberry32, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { gauss } = require('../util');
const { B } = A;

const T0 = B(90), T1 = B(110);
const N = 10000, NB = 60, BX0 = 180, BX1 = 1740, BY = 800, BW = (BX1 - BX0) / NB;
const VMAX = 4.2;
const xOfV = v => BX0 + clamp(v / VMAX) * (BX1 - BX0);
// 分布：每个点 = 一个人；按桶堆叠
const PEOPLE = (() => {
  const r = mulberry32(73), vs = [];
  for (let i = 0; i < N; i++) vs.push(Math.exp(gauss(r) * 0.55 - 0.05));
  vs.sort((a, b) => a - b);
  const fill = new Array(NB).fill(0);
  return vs.map((v, i) => {
    const b = Math.min(NB - 1, Math.floor(clamp(v / VMAX) * NB));
    const k = fill[b]++;
    return { v, i, x: BX0 + b * BW + 2 + (k % 10) * 2.3, y: BY - 4 - Math.floor(k / 10) * 2.6, d: r() };
  });
})();
const MEDIAN = PEOPLE[N / 2].v;
const TOP = PEOPLE.slice(N - 10);                        // 最右边的 0.1%
const SHOW = ['清北学霸', '年入百万', '25 岁财务自由', '环游世界', '完美身材', '创业上市', '名校博士', '千万粉丝', '全款买房', '天才少年'];
const WX0 = 560, WY0 = 300, CWD = 156, CHT = 92;
const slot = j => [WX0 + (j % 5) * (CWD + 12), WY0 + Math.floor(j / 5) * (CHT + 14)];
const TF = j => T0 + 1.3 + j * 0.42;                     // 第 j 个被捞上去的时刻
const TROT = B(104);

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 1973, prev: 2006, who: 'A. 特沃斯基 & D. 卡尼曼', no: '04', law: '可得性启发', en: 'Availability Heuristic', paper: 'Availability: A Heuristic for Judging Frequency', paperCn: '《可得性：判断频率的一种启发》' });
  const a = smooth(prog(t, T0 + 0.1, T0 + 0.5)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  // —— 分布 ——
  const nUp = TOP.filter((p, j) => t > TF(j)).length;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.fillStyle = rgba([150, 160, 185], 0.75 * a); ctx.beginPath();
  for (const p of PEOPLE) {
    if (p.i >= N - 10) continue;
    const u = easeOutExpo(prog(t, T0 + 0.2 + p.d * 0.6, T0 + 0.7 + p.d * 0.6));
    if (u <= 0) continue;
    ctx.rect(p.x, p.y - (1 - u) * 300, 1.8, 1.8);
  }
  ctx.fill(); ctx.restore();
  ctx.fillStyle = rgba(C.line, a); ctx.fillRect(BX0, BY + 2, BX1 - BX0, 1);
  UI.note(ctx, '一万个人的真实分布 · 每个点 = 1 人', BX0, BY + 38, { size: 20, alpha: a });
  UI.note(ctx, '成就 / 收入 / 颜值 / 学历 →', BX1, BY + 38, { size: 20, alpha: a, align: 'right' });
  // 最右边的 0.1%：先亮，再被捞上去变成橱窗里的卡
  TOP.forEach((p, j) => {
    const tf = TF(j), u = easeInOut(prog(t, tf, tf + 0.55));
    const [sx, sy] = slot(j);
    if (u <= 0) { glow(ctx, p.x, p.y, 24, C.cyan, 0.7 * a * smooth(prog(t, T0 + 0.9, T0 + 1.3))); ctx.fillStyle = rgba(C.cyan, a); ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); return; }
    const x = lerp(p.x, sx + CWD / 2, u), y = lerp(p.y, sy + CHT / 2, u) - Math.sin(u * Math.PI) * 120;
    if (u < 1) { glow(ctx, x, y, 40, C.cyan, 0.8 * a); return; }
    // 卡片
    const rot = smooth(prog(t, TROT + 0.3 + j * 0.06, TROT + 1.4 + j * 0.06));
    const k = smooth(prog(t, tf + 0.55, tf + 0.8)) * a;
    ctx.fillStyle = rgba(mix(C.bg, C.gold, 0.22), k); ctx.fillRect(sx, sy, CWD, CHT);
    ctx.strokeStyle = rgba(C.gold, 0.8 * k); ctx.lineWidth = 1.2; ctx.strokeRect(sx, sy, CWD, CHT);
    glow(ctx, sx + CWD / 2, sy + CHT / 2, 110, C.gold, 0.12 * k);
    text(ctx, SHOW[j], sx + CWD / 2, sy + 40, { family: 'Song', size: 22, weight: 700, color: C.white, alpha: k });
    text(ctx, '♥ ' + (10 + hash(j) * 90).toFixed(0) + 'w', sx + CWD / 2, sy + 72, { family: 'Mono', size: 18, color: C.gold, alpha: k });
    // 腐烂：下半截变暗、碎成颗粒往下掉
    if (rot > 0) {
      ctx.fillStyle = rgba([24, 14, 14], 0.85 * rot * k); ctx.fillRect(sx, sy + CHT * 0.5, CWD, CHT * 0.5);
      const r = mulberry32(j * 31 + 7);
      ctx.fillStyle = rgba([150, 70, 60], 0.8 * k);
      for (let q = 0; q < 40; q++) {
        const px = sx + r() * CWD, d = rot * (40 + r() * 140), py = sy + CHT * (0.5 + r() * 0.5) + d * d / 60;
        if (r() < rot) ctx.fillRect(px, py, 2.4, 2.4);
      }
    }
  });
  // 橱窗框
  const wa = smooth(prog(t, T0 + 0.8, T0 + 1.2)) * a;
  ctx.strokeStyle = rgba(C.cyan, 0.5 * wa); ctx.lineWidth = 1.5; ctx.strokeRect(WX0 - 20, WY0 - 20, 5 * (CWD + 12) + 28, 2 * (CHT + 14) + 26);
  UI.note(ctx, '你的推荐页 · 橱窗', WX0 - 20, WY0 - 34, { size: 20, color: C.cyan, alpha: wa });
  UI.note(ctx, `${nUp} / ${N} = 前 0.1%`, WX0 + 5 * (CWD + 12) + 8, WY0 - 34, { size: 20, color: C.cyan, alpha: wa, align: 'right' });
  // 真实中位数 vs 大脑以为的"正常"
  const mx = xOfV(MEDIAN);
  ctx.fillStyle = rgba(C.gray, 0.8 * a); ctx.fillRect(mx, 560, 1.5, BY - 560);
  UI.note(ctx, '真实的中位数', mx - 10, 580, { size: 20, alpha: a, align: 'right' });
  const shift = easeInOut(clamp(nUp / 10 * 1.05));
  const px = lerp(mx, xOfV(3.6), shift);
  const sa = smooth(prog(t, TF(0) + 0.6, TF(0) + 1.0)) * a;
  ctx.save(); ctx.setLineDash([8, 6]); ctx.strokeStyle = rgba(C.red, 0.9 * sa); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(px, 560); ctx.lineTo(px, BY); ctx.stroke(); ctx.restore();
  text(ctx, '大脑以为的"正常"', px + 12, 584, { family: 'Song', size: 26, color: C.red, alpha: sa, align: 'left' });
  // 你
  you(ctx, mx, BY + 76, a);
  text(ctx, '你', mx + 22, BY + 86, { family: 'Song', size: 28, weight: 700, color: C.gold, alpha: a, align: 'left' });
  const beat = Math.round(lerp(50, 3, shift));
  UI.note(ctx, '大脑给你的排名', 180, 380, { size: 20, alpha: sa });
  text(ctx, `超过了 ${beat}% 的人`, 180, 436, { family: 'Song', size: 40, weight: 700, color: beat < 20 ? C.red : C.bone, alpha: sa, align: 'left' });

  T.seq(ctx, t, [
    { t: B(91), s: '社交平台，是一个橱窗。', hl: { '橱窗': C.cyan }, en: 'Social media is a shop window.' },
    { t: B(94), s: '里面是典型，是极端，是幸存者。', hl: { '幸存者': C.gold }, en: 'Inside: the outliers, the extremes, the survivors.' },
    { t: B(97.5), s: '他们出现得太频繁——' },
    { t: B(100), s: '大脑就悄悄把他们，当成了常态。', hl: { '常态': C.red }, en: 'Your brain quietly files them as normal.' },
    { t: TROT, s: '橱窗里的生活，一边灿烂，一边腐烂。', fx: 'slam', size: 66, hl: { '灿烂': C.gold, '腐烂': C.red }, en: 'Life in the window: blooming on one side, rotting on the other.' },
  ], { y: CARD.CAP_Y + 40, size: 56, out: T1 - 0.05 });
}
function you(ctx, x, y, a) {
  glow(ctx, x, y, 70, C.gold, 0.35 * a); glow(ctx, x, y, 20, C.gold, 0.8 * a);
  ctx.fillStyle = rgba(C.white, a); ctx.beginPath(); ctx.arc(x, y, 4, 0, 6.2832); ctx.fill();
}
module.exports = { draw, t0: T0, t1: T1 };
