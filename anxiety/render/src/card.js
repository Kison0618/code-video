// 定律卡的公共部件：左上角年份（像里程表一样从上一张卡的年份滚过来）、研究者、定律名；右上角论文 / 书名和红色印章
// 布局：0–250 抬头，250–840 画面，860–1040 字幕
'use strict';
const K = require('./core');
const { W, H, C, rgba, clamp, lerp, smooth, easeOut, easeOutExpo, easeInOut, text, measure, glow } = K;

const CAP_Y = H - 128;          // 字幕基线
const VIEW = [120, 270, W - 120, 830];

// 里程表式的年份
function odometer(ctx, t, t0, from, to, x, y, o = {}) {
  const { size = 92, color = C.gold, alpha = 1, dur = 0.9 } = o;
  const u = easeInOut(clamp((t - t0) / dur));
  const n = lerp(from, to, u);
  const digits = String(Math.round(Math.max(from, to))).length;
  const st = { family: 'Cinzel', size: size * 0.86, weight: 400 };
  const dw = measure(ctx, '0', st) * 1.02, h = size * 1.05;
  ctx.save();
  ctx.beginPath(); ctx.rect(x - 4, y - size * 0.86, dw * digits + 8, h); ctx.clip();
  for (let p = 0; p < digits; p++) {
    const pw = Math.pow(10, p);
    let c;
    if (p === 0) c = n % 10;
    else { const lower = n % pw; c = Math.floor(n / pw) % 10 + clamp(lower - (pw - 1)); }
    const base = Math.floor(c), fr = c - base;
    const dx = x + (digits - 1 - p) * dw;
    text(ctx, String(base % 10), dx, y - fr * h, { ...st, color, alpha, align: 'left' });
    if (fr > 0.001) text(ctx, String((base + 1) % 10), dx, y + (1 - fr) * h, { ...st, color, alpha, align: 'left' });
  }
  ctx.restore();
  return dw * digits;
}

// 印章：从大到小、带一点旋转地盖下去
function seal(ctx, t, t0, x, y, str, o = {}) {
  const { size = 58, alpha = 1 } = o;
  const k = clamp((t - t0) / 0.28);
  if (k <= 0) return;
  const e = easeOutExpo(k), s = lerp(1.8, 1, e), a = clamp(k * 2) * alpha;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(lerp(-0.25, -0.06, e)); ctx.scale(s, s);
  ctx.fillStyle = rgba(C.seal, 0.92 * a);
  ctx.beginPath(); ctx.roundRect(-size / 2, -size / 2, size, size, 5); ctx.fill();
  ctx.strokeStyle = rgba([240, 210, 200], 0.55 * a); ctx.lineWidth = 1.5;
  ctx.strokeRect(-size / 2 + 5, -size / 2 + 5, size - 10, size - 10);
  const ch = [...str];
  if (ch.length === 2) ch.forEach((c, i) => text(ctx, c, 0, -size * 0.04 + (i - 0.5) * size * 0.4 + size * 0.17, { family: 'Song', weight: 700, size: size * 0.36, color: [250, 232, 220], alpha: a }));
  else text(ctx, str, 0, size * 0.14, { family: 'Song', weight: 700, size: size * 0.4, color: [250, 232, 220], alpha: a });
  ctx.restore();
  if (k < 1) glow(ctx, x, y, size * 1.6, C.seal, 0.3 * (1 - k) * alpha);
}

// 抬头。o = { t0, t1, year, prev, who, no, law, en, paper, paperCn }
function header(ctx, t, o) {
  const { t0, t1, year, prev = year, who = '', no = '', law = '', en = '', paper = '', paperCn = '' } = o;
  const a = smooth((t - t0) / 0.35) * (1 - smooth((t - (t1 - 0.25)) / 0.25));
  if (a <= 0) return;
  const X = 96;
  const yw = odometer(ctx, t, t0, prev, year, X, 132, { alpha: a });
  if (o.yearNote) text(ctx, o.yearNote, X + yw + 14, 132, { family: 'Song', size: 24, color: C.dim, alpha: a, align: 'left' });
  text(ctx, who, X, 178, { family: 'Song', size: 26, color: C.bone, alpha: 0.82 * a * smooth((t - t0 - 0.2) / 0.4), align: 'left', spacing: 0.04 });
  // 定律名
  const lk = smooth((t - t0 - 0.35) / 0.4);
  if (no) text(ctx, '定律 ' + no, X, 238, { family: 'Mono', size: 22, color: C.gold, alpha: a * lk, align: 'left', spacing: 0.1 });
  const w = text(ctx, law, X + (no ? 150 : 0), 240, { family: 'Song', size: 38, weight: 700, color: C.white, alpha: a * lk, align: 'left', spacing: 0.06 });
  if (en) text(ctx, en, X + (no ? 150 : 0) + w + 18, 238, { family: 'Garamond', style: 'italic', size: 26, color: C.gray, alpha: a * lk, align: 'left' });
  // 右上：论文与印章
  const pk = smooth((t - t0 - 0.15) / 0.5) * a;
  if (paper) text(ctx, paper, W - 176, 104, { family: 'Garamond', style: 'italic', size: 25, color: C.gray, alpha: pk, align: 'right' });
  if (paperCn) text(ctx, paperCn, W - 176, 142, { family: 'Song', size: 24, color: C.bone, alpha: 0.85 * pk, align: 'right' });
  if (paper || paperCn) { ctx.fillStyle = rgba(C.line, 0.9 * pk); ctx.fillRect(W - 176 - 340, 160, 340, 1); }
  if (o.seal !== false) seal(ctx, t, t0 + 0.45, W - 120, 122, o.sealText || '定律', { alpha: a });
}

module.exports = { header, odometer, seal, CAP_Y, VIEW };
