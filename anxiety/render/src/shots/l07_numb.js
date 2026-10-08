// 定律 07 · 心理麻木（2007，斯莫尔、洛温斯坦 & 斯洛维奇）  77.67–85.10 秒（曲子断开，安静）
//  一个点，有名字、有年龄；然后 10 个、1000 个、100 万个——人数每多一个数量级，"同情"读数反而往下掉。
//  实验：给一个具体的孩子捐 2.38 美元，给一串统计数字只捐 1.14 美元
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, hash, mulberry32, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(146), T1 = B(160);
const CX = 700, CY = 560;
const STEPS = [[T0 + 0.5, 1, 100], [T0 + 2.0, 10, 74], [T0 + 3.2, 1000, 41], [T0 + 4.3, 1000000, 9]];
const PTS = (() => { const r = mulberry32(8), o = []; for (let i = 0; i < 6000; i++) o.push([r(), r(), r()]); return o; })();

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 2007, prev: 1969, who: 'D. 斯莫尔、G. 洛温斯坦 & P. 斯洛维奇', no: '07', law: '心理麻木', en: 'Psychic Numbing', paper: 'Sympathy and Callousness', paperCn: '《同情与冷漠》' });
  const a = smooth(prog(t, T0 + 0.2, T0 + 0.6)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  let si = -1; STEPS.forEach((s, i) => { if (t >= s[0]) si = i; });
  // 人：一个 → 一片
  if (si >= 0) {
    const n = STEPS[si][1], k = easeOutExpo(prog(t, STEPS[si][0], STEPS[si][0] + 0.6));
    if (n === 1) {
      glow(ctx, CX, CY, 120, C.gold, 0.5 * a * k);
      ctx.fillStyle = rgba(C.white, a * k); ctx.beginPath(); ctx.arc(CX, CY, 9, 0, 6.2832); ctx.fill();
      text(ctx, 'Rokia · 7 岁 · 马里', CX, CY + 70, { family: 'Song', size: 30, color: C.bone, alpha: a * k });
    } else {
      const m = Math.min(PTS.length, n === 10 ? 10 : n === 1000 ? 1000 : 6000);
      const R = n === 10 ? 160 : n === 1000 ? 320 : 520;
      const sz = n === 10 ? 7 : n === 1000 ? 3 : 2;
      const fade = n === 1000000 ? 0.75 : 0.9;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba(mix(C.gold, C.gray, si / 3), fade * a * k); ctx.beginPath();
      for (let i = 0; i < m; i++) { const [u, v] = PTS[i]; const r = Math.sqrt(u) * R * k, an = v * 6.2832; ctx.rect(CX + Math.cos(an) * r * 1.3 - sz / 2, CY + Math.sin(an) * r * 0.6 - sz / 2, sz, sz); }
      ctx.fill(); ctx.restore();
    }
    UI.note(ctx, '人数', 200, 360, { size: 22, alpha: a });
    text(ctx, n.toLocaleString('en-US'), 200, 430, { family: 'Mono', size: 60, color: C.white, alpha: a, align: 'left' });
  }
  // 同情读数
  const RX = 1380;
  const cur = si < 0 ? 100 : lerp(si ? STEPS[si - 1][2] : 100, STEPS[si][2], easeOut(prog(t, STEPS[si][0], STEPS[si][0] + 0.8)));
  UI.note(ctx, '同情 · SYMPATHY', RX, 360, { size: 22, alpha: a });
  text(ctx, Math.round(cur) + '', RX, 450, { family: 'Mono', size: 90, color: mix(C.red, C.gold, cur / 100), alpha: a, align: 'left' });
  ctx.fillStyle = rgba(C.line, a); ctx.fillRect(RX, 480, 380, 10);
  ctx.fillStyle = rgba(mix(C.red, C.gold, cur / 100), a); ctx.fillRect(RX, 480, 380 * cur / 100, 10);
  // 捐款实验
  const da = smooth(prog(t, T0 + 1.2, T0 + 1.7)) * a;
  UI.note(ctx, '捐款实验 · 2007', RX, 580, { size: 20, alpha: da });
  [['一个具体的孩子', 2.38, C.gold], ['一串统计数字', 1.14, C.gray]].forEach(([nm, v, col], i) => {
    const y = 640 + i * 80, u = easeOut(prog(t, T0 + 1.4 + i * 0.2, T0 + 2.2 + i * 0.2));
    text(ctx, nm, RX, y, { family: 'Song', size: 26, color: C.bone, alpha: da, align: 'left' });
    ctx.fillStyle = rgba(col, 0.85 * da); ctx.fillRect(RX, y + 14, 140 * v * u, 12);
    text(ctx, '$' + (v * u).toFixed(2), RX + 140 * v * u + 14, y + 28, { family: 'Mono', size: 26, color: col, alpha: da, align: 'left' });
  });
  T.seq(ctx, t, [
    { t: B(146.8), s: '一个人的不幸，是故事。', en: "One person's suffering is a story." },
    { t: B(150.8), s: '一百万人的不幸，只是数字。', hl: { '数字': C.gray }, en: "A million people's suffering is a statistic." },
    { t: B(155), s: '我开始变得，冷漠又麻木。', fx: 'decode', size: 66, cps: 9, hl: { '冷漠又麻木': C.ice }, en: 'I became cold, and numb.' },
  ], { y: CARD.CAP_Y, size: 60, out: T1 - 0.05 });
}
function bg() { return { amt: 0.6 }; }
module.exports = { draw, bg, t0: T0, t1: T1 };
