// 定律 11 · 双系统（2011，卡尼曼）  110.62–119.12 秒
//  冲动到行动有两条路：系统 1 快（感性），系统 2 慢（理性）。第一轮赛跑：系统 1 先到，"刷手机"。
//  然后在快路上加三道摩擦：删掉 App、重新登录、换小屏手机。第二轮：快路一道道卡住，系统 2 先到，"学习"
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, glowLine, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(208), T1 = B(224);
const S = [330, 570], P = [1560, 400], L = [1560, 760];
const bez = (p0, p1, p2, p3, u) => { const v = 1 - u; return [0, 1].map(k => v * v * v * p0[k] + 3 * v * v * u * p1[k] + 3 * v * u * u * p2[k] + u * u * u * p3[k]); };
const fast = u => bez(S, [700, 420], [1100, 380], P, u);
const slow = u => bez(S, [600, 900], [1200, 900], L, u);
const R1 = T0 + 0.6, R2 = B(216.5);
const GATES = [[0.3, '删掉 App', '+20 秒', B(213)], [0.55, '重新登录', '+15 秒', B(213.9)], [0.8, '换小屏手机', '+5 秒', B(214.8)]];
// 第二轮快路：走一段、在每道门前卡住
function fastU2(s) {
  const seg = [[0.3, 0.2], [null, 0.9], [0.55, 0.18], [null, 0.8], [0.8, 0.18], [null, 0.7], [1, 0.2]];
  let u = 0, tt = 0;
  for (const [to, d] of seg) { if (s < tt + d) { const f = (s - tt) / d; return to == null ? u : lerp(u, to, f); } tt += d; if (to != null) u = to; }
  return 1;
}
function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 2011, prev: 2000, who: 'D. 卡尼曼 · 诺贝尔经济学奖得主', no: '11', law: '双系统', en: 'System 1 / System 2', paper: 'Thinking, Fast and Slow', paperCn: '《思考，快与慢》' });
  const a = smooth(prog(t, T0 + 0.1, T0 + 0.5)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  const pts = (f) => { const o = []; for (let i = 0; i <= 80; i++) o.push(f(i / 80)); return o; };
  K.line(ctx, pts(fast), C.cyan, 0.45 * a, 2);
  K.line(ctx, pts(slow), C.gold, 0.45 * a, 2);
  text(ctx, '系统 1 · 快 · 感性', 760, 360, { family: 'Song', size: 26, color: C.cyan, alpha: a });
  text(ctx, '系统 2 · 慢 · 理性', 900, 870, { family: 'Song', size: 26, color: C.gold, alpha: a });
  // 节点
  glow(ctx, S[0], S[1], 90, C.white, 0.3 * a); ctx.fillStyle = rgba(C.white, a); ctx.beginPath(); ctx.arc(S[0], S[1], 10, 0, 6.2832); ctx.fill();
  text(ctx, '冲动：想刷手机', S[0], S[1] + 56, { family: 'Song', size: 28, color: C.bone, alpha: a });
  // 赛跑
  const r2 = t >= R2;
  const s = t - (r2 ? R2 : R1);
  const uf = r2 ? fastU2(s) : clamp(s / 0.8), us = clamp(s / 2.0);
  const winP = !r2 && t > R1 + 0.8, winL = r2 && s > 2.0;
  [[P, '刷手机', C.cyan, winP], [L, '学习', C.gold, winL]].forEach(([q, nm, col, win]) => {
    glow(ctx, q[0], q[1], win ? 200 : 60, col, (win ? 0.45 : 0.15) * a);
    ctx.strokeStyle = rgba(col, a); ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(q[0], q[1], 16, 0, 6.2832); ctx.stroke();
    text(ctx, nm, q[0] + 40, q[1] + 14, { family: 'Song', size: 40, weight: 700, color: win ? col : C.bone, alpha: a, align: 'left' });
    if (win) UI.note(ctx, '胜出', q[0] + 40, q[1] + 50, { size: 22, color: col, alpha: a });
  });
  if (s >= 0) {
    if (uf > 0 && uf < 1) { const q = fast(uf); glow(ctx, q[0], q[1], 40, C.cyan, 0.9 * a); }
    if (us > 0 && us < 1) { const q = slow(us); glow(ctx, q[0], q[1], 40, C.gold, 0.9 * a); }
    glowLine(ctx, pts(u => fast(u * uf)), C.cyan, a, 2.4);
    glowLine(ctx, pts(u => slow(u * us)), C.gold, a, 2.4);
  }
  // 摩擦
  GATES.forEach(([u, nm, add, tg]) => {
    const k = easeOutExpo(prog(t, tg, tg + 0.35)) * a;
    if (k <= 0) return;
    const q = fast(u);
    ctx.fillStyle = rgba(C.red, 0.9 * k); ctx.fillRect(q[0] - 5, q[1] - 46, 10, 92);
    text(ctx, nm, q[0], q[1] - 62, { family: 'Song', size: 24, weight: 700, color: C.white, alpha: k });
    text(ctx, add, q[0], q[1] + 80, { family: 'Mono', size: 24, color: C.red, alpha: k });
  });
  // 计时
  UI.note(ctx, r2 ? '第二轮 · 加了摩擦' : '第一轮', 200, 360, { size: 22, alpha: a });
  text(ctx, r2 ? '系统 2 先到' : (winP ? '系统 1 先到' : '…'), 200, 420, { family: 'Song', size: 38, weight: 700, color: r2 ? (winL ? C.gold : C.bone) : C.cyan, alpha: a * (s > 0.2 ? 1 : 0), align: 'left' });
  T.seq(ctx, t, [
    { t: B(208.6), s: '感性是第一反应，理性是事后一想。', hl: { '感性': C.cyan, '理性': C.gold }, en: 'Feeling is the first reaction; reason comes after.' },
    { t: B(213), s: '所以，删掉 App，换小屏手机——', en: 'So delete the apps. Get a smaller phone —' },
    { t: R2, s: '把路设长一点，', en: 'make the road a little longer,' },
    { t: B(219.3), s: '给大脑一点时间，它就能做对的决定。', fx: 'slam', size: 66, hl: { '一点时间': C.gold }, en: 'give your brain a moment, and it makes the right call.' },
  ], { y: CARD.CAP_Y + 20, size: 60, out: T1 - 0.05 });
}
module.exports = { draw, t0: T0, t1: T1 };
