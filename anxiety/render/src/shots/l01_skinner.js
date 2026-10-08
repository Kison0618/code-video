// 定律 01 · 可变比率强化（1957，斯金纳）  22.41–30.91 秒
//  左：斯金纳的累计记录图——四种奖励方式，"可变比率"的线最陡，而且没有停顿
//  右：信息流就是一台老虎机。每次下拉，卷轴滚动、落在一个随机的"爽度"上；偶尔中一次大奖
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, glowLine, hash, noise1, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(42), T1 = B(58);

// —— 累计记录 ——
const BOX = [180, 330, 860, 760];
const TP0 = T0 + 0.5, TP1 = T0 + 4.8;      // 记录笔从左走到右
// 四种强化程式：u ∈ [0,1] → 累计反应（0..1）
const SCHED = [
  { name: '可变比率 VR', col: C.gold, f: u => 0.98 * u + 0.012 * Math.sin(u * 90) * 0 },
  { name: '固定比率 FR', col: C.gray, f: u => { const n = 7, p = u * n, i = Math.floor(p), r = p - i; return 0.78 * (i + clamp((r - 0.22) / 0.78)) / n; } },
  { name: '可变间隔 VI', col: C.gray, f: u => 0.46 * u },
  { name: '固定间隔 FI', col: C.gray, f: u => { const n = 5, p = u * n, i = Math.floor(p), r = p - i; return 0.3 * (i + r * r * r) / n; } },
];
function record(ctx, t) {
  const a = smooth(prog(t, T0 + 0.2, T0 + 0.6));
  const [x0, y0, x1, y1] = BOX;
  UI.axes(ctx, BOX, a, { nx: 8, ny: 5 });
  UI.note(ctx, '累计反应次数', x0, y0 - 18, { size: 20, alpha: a });
  UI.note(ctx, '时间 →', x1, y1 + 40, { size: 20, alpha: a, align: 'right' });
  UI.note(ctx, 'CUMULATIVE RECORD · 斯金纳箱', x0 + 10, y1 + 40, { size: 18, alpha: 0.7 * a });
  const up = easeInOut(prog(t, TP0, TP1));
  SCHED.forEach((s, k) => {
    const pts = [];
    for (let i = 0; i <= 160; i++) { const u = i / 160 * up; pts.push([lerp(x0, x1, u), lerp(y1, y0, s.f(u))]); }
    if (k === 0) glowLine(ctx, pts, s.col, a, 2.4); else K.line(ctx, pts, s.col, 0.75 * a, 1.6);
    // 可变比率：随机位置的奖励记号
    if (k === 0) for (let j = 0; j < 14; j++) { const u = (j + 0.2 + 0.6 * hash(j * 3.3)) / 14; if (u > up) break; const x = lerp(x0, x1, u), y = lerp(y1, y0, s.f(u)); ctx.strokeStyle = rgba(C.gold, 0.9 * a); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 8, y + 8); ctx.stroke(); }
    const e = pts[pts.length - 1];
    if (up > 0.05) text(ctx, s.name, e[0] + 14, e[1] + 8, { family: 'Song', size: k === 0 ? 26 : 20, weight: k === 0 ? 700 : 400, color: s.col, alpha: a * smooth(prog(up, 0.6, 0.9)), align: 'left' });
  });
  // 结论
  const ca = smooth(prog(t, TP1, TP1 + 0.4)) * a;
  text(ctx, '反应最快 · 停顿最少 · 最难戒掉', x0 + 30, y0 + 50, { family: 'Song', size: 30, color: C.gold, alpha: ca, align: 'left' });
}

// —— 老虎机信息流 ——
const SCORES = [34, 12, 57, 91, 23, 8, 45, 67, 15, 97, 29, 41, 6, 88, 52, 19];
const PULLS = (() => { const o = []; let x = T0 + 0.9; for (let i = 0; i < SCORES.length; i++) { o.push(x); x += 0.95 - 0.04 * i + 0.35 * hash(i * 5.1); } return o; })();
const RX = 1150, RY = 330, RW = 470, RH = 400;
function reel(ctx, t) {
  const a = smooth(prog(t, T0 + 0.4, T0 + 0.9));
  if (a <= 0) return;
  let n = PULLS.filter(p => p <= t).length;          // 已下拉次数
  const last = n > 0 ? PULLS[n - 1] : -9;
  const spin = clamp((t - last) / 0.45);             // 0..1 滚动中
  const cur = n > 0 ? SCORES[n - 1] : SCORES[0];
  // 框
  ctx.strokeStyle = rgba(C.gray, 0.7 * a); ctx.lineWidth = 1.5; ctx.strokeRect(RX - 2, RY - 2, RW + 4, RH + 4);
  UI.note(ctx, 'FEED · 信息流 = 老虎机', RX, RY - 18, { size: 20, alpha: a });
  ctx.save(); ctx.beginPath(); ctx.rect(RX, RY, RW, RH); ctx.clip();
  const off = (1 - easeOutExpo(spin)) * 6;            // 还要滚过几张
  for (let j = -2; j <= 2; j++) {
    const idx = n - 1 - Math.round(off) + j, f = off - Math.round(off);
    const y = RY + RH / 2 + (j + f) * 150;
    const sc = SCORES[((idx % SCORES.length) + SCORES.length) % SCORES.length];
    const big = sc >= 85;
    const col = big ? C.gold : C.cyan;
    const ca = (1 - Math.abs(j + f) * 0.42) * a;
    ctx.fillStyle = rgba(mix(C.bg, col, 0.18), ca); ctx.fillRect(RX + 20, y - 62, RW - 40, 124);
    ctx.strokeStyle = rgba(col, 0.6 * ca); ctx.strokeRect(RX + 20, y - 62, RW - 40, 124);
    text(ctx, '爽度', RX + 50, y + 12, { family: 'Song', size: 28, color: C.bone, alpha: ca, align: 'left' });
    text(ctx, String(sc), RX + RW - 50, y + 22, { family: 'Mono', size: 60, color: col, alpha: ca, align: 'right' });
    ctx.fillStyle = rgba(col, 0.8 * ca); ctx.fillRect(RX + 50, y + 30, (RW - 230) * sc / 100, 6);
  }
  ctx.restore();
  // 中奖
  if (cur >= 85 && spin >= 1) {
    const k = Math.exp(-(t - last - 0.45) * 1.5);
    glow(ctx, RX + RW / 2, RY + RH / 2, 380, C.gold, 0.3 * k * a);
    text(ctx, '★ 大奖', RX + RW / 2, RY + RH + 64, { family: 'Song', size: 34, weight: 700, color: C.gold, alpha: a * clamp(k * 2) });
  }
  // 拉杆：每次下拉往下一拽
  const pull = n > 0 ? Math.sin(clamp((t - last) / 0.35) * Math.PI) : 0;
  const lx = RX + RW + 70, ly = RY + 60 + pull * 120;
  ctx.strokeStyle = rgba(C.gray, 0.8 * a); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(lx, RY + 40); ctx.lineTo(lx, RY + RH - 40); ctx.stroke();
  glow(ctx, lx, ly, 40, C.cyan, 0.6 * a); ctx.fillStyle = rgba(C.white, a); ctx.beginPath(); ctx.arc(lx, ly, 12, 0, 6.2832); ctx.fill();
  UI.note(ctx, '下拉刷新', lx, RY + RH + 10, { size: 20, alpha: a, align: 'center' });
  // 统计
  UI.note(ctx, '下拉次数', RX, RY + RH + 120, { size: 20, alpha: a });
  text(ctx, String(n), RX + 130, RY + RH + 122, { family: 'Mono', size: 34, color: C.white, alpha: a, align: 'left' });
  const wins = SCORES.slice(0, n).filter(s => s >= 85).length;
  UI.note(ctx, '大奖', RX + 260, RY + RH + 120, { size: 20, alpha: a });
  text(ctx, String(wins), RX + 330, RY + RH + 122, { family: 'Mono', size: 34, color: C.gold, alpha: a, align: 'left' });
}

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 1957, prev: 2020, who: 'B. F. 斯金纳 · 哈佛大学', no: '01', law: '可变比率强化', en: 'Variable-Ratio Reinforcement', paper: 'Schedules of Reinforcement', paperCn: '《强化程式》' });
  record(ctx, t);
  reel(ctx, t);
  T.seq(ctx, t, [
    { t: B(43), s: '下一条，可能更好看。', hl: { '更好看': C.cyan }, en: 'The next one might be better.' },
    { t: B(47), s: '奖励越随机，你就越停不下来。', hl: { '越随机': C.gold }, en: 'The more random the reward, the harder it is to stop.' },
    { t: B(51), s: '老虎机和你的信息流，' },
    { t: B(54), s: '用的是同一条定律。', fx: 'slam', size: 72, hl: { '同一条定律': C.gold }, en: 'Slot machines and your feed run on the same law.' },
  ], { y: CARD.CAP_Y, size: 60, out: T1 - 0.05 });
}
module.exports = { draw, t0: T0, t1: T1 };
