// 定律 03 · 流畅性错觉（2006，罗迪格 & 卡皮克）  39.40–47.93 秒
//  两组人读同一篇文章：A 组反复读 4 遍；B 组读 1 遍、自测 3 次。
//  5 分钟后考：A 组 83%，B 组 71%——"读的组赢了？"  一周后再考：A 组掉到 40%，B 组还有 61%。
//  右侧：考前问他们"你觉得自己能记住多少"（7 分制），反复读的人更自信
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(74), T1 = B(90);
const Y0 = 340, Y1 = 760, yOf = v => lerp(Y1, Y0, v / 100);
const TW = T0 + 2.6, TW1 = T0 + 4.0;           // "一周后"：天数滚动
const GA = { nm: '反复读 4 遍', col: [150, 170, 200] }, GB = { nm: '读 1 遍 + 自测 3 次', col: C.gold };

function bar(ctx, x, w, v, col, a, label, big) {
  const y = yOf(v);
  ctx.fillStyle = rgba(col, 0.85 * a); ctx.fillRect(x, y, w, Y1 - y);
  text(ctx, Math.round(v) + '%', x + w / 2, y - 16, { family: 'Mono', size: big ? 44 : 32, color: big ? col : C.bone, alpha: a });
}
function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 2006, prev: 1971, who: 'H. 罗迪格 & J. 卡皮克 · 华盛顿大学', no: '03', law: '流畅性错觉', en: 'Fluency Illusion', paper: 'Test-Enhanced Learning', paperCn: '《测试增强学习》· 心理科学' });
  const a = smooth(prog(t, T0 + 0.2, T0 + 0.6)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  const X0 = 180, X1 = 1180;
  UI.axes(ctx, [X0, Y0, X1, Y1], a, { nx: 0, ny: 5 });
  UI.note(ctx, '测验正确率', X0, Y0 - 18, { size: 20, alpha: a });
  // 图例
  [[GA, 0], [GB, 1]].forEach(([g, i]) => {
    ctx.fillStyle = rgba(g.col, a); ctx.fillRect(X0 + 40 + i * 300, Y0 + 6, 22, 22);
    text(ctx, g.nm, X0 + 74 + i * 300, Y0 + 26, { family: 'Song', size: 24, color: C.bone, alpha: a, align: 'left' });
  });
  // 5 分钟后
  const g1 = easeOutExpo(prog(t, T0 + 0.6, T0 + 1.3));
  const cx1 = X0 + 250, cx2 = X0 + 720, bw = 130;
  bar(ctx, cx1 - bw - 10, bw, 83 * g1, GA.col, a);
  bar(ctx, cx1 + 10, bw, 71 * g1, GB.col, a);
  text(ctx, '5 分钟后', cx1, Y1 + 46, { family: 'Song', size: 30, color: C.bone, alpha: a });
  const q = smooth(prog(t, T0 + 1.4, T0 + 1.7)) * (1 - smooth(prog(t, TW1, TW1 + 0.3)));
  text(ctx, '读的组赢了？', cx1, Y0 + 90, { family: 'Song', size: 34, color: C.white, alpha: a * q });
  // 一周后
  const wk = prog(t, TW, TW1), wa = smooth(prog(t, TW - 0.3, TW)) * a;
  if (wa > 0) {
    const day = Math.max(1, Math.ceil(wk * 7));
    text(ctx, wk < 1 ? `第 ${day} 天` : '1 周后', cx2, Y1 + 46, { family: 'Song', size: 30, color: wk < 1 ? C.dim : C.bone, alpha: wa });
    const e = easeInOut(wk);
    const va = lerp(83, 40, e), vb = lerp(71, 61, e);
    const done = smooth(prog(t, TW1, TW1 + 0.3));
    bar(ctx, cx2 - bw - 10, bw, va, mix(GA.col, C.red, done), wa, '', done > 0.5);
    bar(ctx, cx2 + 10, bw, vb, GB.col, wa, '', done > 0.5);
    // 交叉：A 组掉下去的那一段
    if (done > 0) {
      ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(C.red, 0.8 * done * a); ctx.lineWidth = 1.5;
      ctx.strokeRect(cx2 - bw - 10, yOf(83), bw, yOf(40) - yOf(83)); ctx.restore();
      text(ctx, '−43%', cx2 - bw / 2 - 10, yOf(70), { family: 'Mono', size: 34, color: C.red, alpha: done * a });
    }
  }
  // 右侧：自信程度
  const ca = smooth(prog(t, T0 + 1.8, T0 + 2.3)) * a;
  const PX = 1300;
  UI.note(ctx, '考前自评：能记住多少？（7 分制）', PX, Y0 + 10, { size: 20, alpha: ca });
  [[GA, 4.8], [GB, 4.0]].forEach(([g, v], i) => {
    const y = Y0 + 110 + i * 150, u = easeOut(prog(t, T0 + 2.0 + i * 0.15, T0 + 2.8 + i * 0.15));
    text(ctx, g.nm, PX, y, { family: 'Song', size: 24, color: C.bone, alpha: ca, align: 'left' });
    ctx.fillStyle = rgba(C.line, ca); ctx.fillRect(PX, y + 22, 420, 14);
    ctx.fillStyle = rgba(g.col, ca); ctx.fillRect(PX, y + 22, 420 * v / 7 * u, 14);
    text(ctx, (v * u).toFixed(1), PX + 440, y + 38, { family: 'Mono', size: 30, color: g.col, alpha: ca, align: 'left' });
  });
  const ck = smooth(prog(t, TW1 + 0.2, TW1 + 0.6)) * a;
  text(ctx, '越觉得会，记得越少', PX, Y0 + 430, { family: 'Song', size: 32, weight: 700, color: C.red, alpha: ck, align: 'left' });
  T.seq(ctx, t, [
    { t: B(75), s: '碎片知识，逻辑简单，理解轻松。', en: 'Bite-sized knowledge: simple, smooth, easy.' },
    { t: B(78), s: '读得越顺，你越以为自己学会了。', hl: { '以为': C.gold }, en: 'The smoother it reads, the more you think you learned.' },
    { t: B(82), s: '一周后，反复读的人只记得 40%。', hl: { '40%': C.red }, en: 'A week later, the re-readers kept only 40%.' },
    { t: B(86), s: '那是安慰，不是学习。', fx: 'slam', size: 72, hl: { '安慰': C.red }, en: "That's comfort, not learning." },
  ], { y: CARD.CAP_Y, size: 60, out: T1 - 0.05 });
}
module.exports = { draw, t0: T0, t1: T1 };
