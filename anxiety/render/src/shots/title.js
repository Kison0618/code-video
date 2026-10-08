// 片名（17.09–22.41 秒）：曲子进入的那一下硬切。
//  "生于焦虑 / 死于自律" 由光点聚成；下面 11 张定律索引卡依次亮起
'use strict';
const K = require('../core');
const { W, H, C, rgba, clamp, lerp, prog, smooth, easeOut, easeOutExpo, glow, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const { B } = A;

const T0 = A.DROP, T1 = B(42);
const LAWS = ['可变奖励', '享乐适应', '流畅性错觉', '可得性启发', '社会比较', '群体极化', '心理麻木', '习得性无助', '时间感知', '选择过载', '双系统'];

function draw(ctx, t) {
  const k = t - T0;
  // 进入的一圈光环（只有一次）
  const ru = easeOut(clamp(k / 1.6));
  if (ru < 1) {
    ctx.strokeStyle = rgba(C.gold, 0.35 * (1 - ru)); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(W / 2, 430, 60 + ru * 1100, 0, 6.2832); ctx.stroke();
  }
  const from = side => (i, r) => { const a = r() * 6.2832, d = 200 + r() * 900; return [W / 2 + side * 300 + Math.cos(a) * d, 430 + Math.sin(a) * d * 0.6]; };
  T.particleText(ctx, t, '生于焦虑', { t0: T0, y: 330, size: 168, color: C.ice, dur: 1.0, from: from(-1), out: T1 - 0.4, step: 4 });
  T.particleText(ctx, t, '死于自律', { t0: T0 + 0.25, y: 540, size: 168, color: C.gold, dur: 1.0, from: from(1), out: T1 - 0.4, step: 4 });
  // 年份与分隔线
  const la = smooth(prog(t, T0 + 1.2, T0 + 1.8)) * (1 - smooth(prog(t, T1 - 0.6, T1 - 0.2)));
  const lw = 520 * easeOut(prog(t, T0 + 1.2, T0 + 2.0));
  ctx.fillStyle = rgba(C.gold, 0.6 * la); ctx.fillRect(W / 2 - lw, 440, lw * 2, 1.5);
  text(ctx, '2 0 2 0', W / 2, 168, { family: 'Garamond', size: 40, color: C.gold, alpha: la, spacing: 0.1 });
  // 副标题
  T.rise(ctx, t, '11 条心理学定律，解释你为什么「道理都懂，就是做不到」', { t0: B(35.5), y: 712, size: 44, hl: { '道理都懂，就是做不到': C.gold }, underline: false, out: T1 - 0.3, en: '11 laws of the mind that explain why knowing is not doing' });
  // 定律索引
  const X0 = 150, CW = (W - 300) / 11;
  LAWS.forEach((nm, i) => {
    const ti = B(37) + i * 0.13;
    const a = smooth(prog(t, ti, ti + 0.3)) * (1 - smooth(prog(t, T1 - 0.5, T1 - 0.15)));
    if (a <= 0) return;
    const x = X0 + i * CW + CW / 2, y = 900;
    const lit = Math.exp(-Math.max(0, t - ti) * 2.5);
    ctx.strokeStyle = rgba(K.mix(C.line, C.gold, 0.4 + 0.6 * lit), a); ctx.lineWidth = 1; ctx.strokeRect(x - CW / 2 + 8, y - 54, CW - 16, 96);
    text(ctx, String(i + 1).padStart(2, '0'), x, y - 14, { family: 'Mono', size: 26, color: C.gold, alpha: a });
    text(ctx, nm, x, y + 26, { family: 'Song', size: 22, color: C.bone, alpha: a });
    glow(ctx, x, y - 6, 80, C.gold, 0.25 * lit * a);
  });
}
module.exports = { draw, t0: T0, t1: T1 };
