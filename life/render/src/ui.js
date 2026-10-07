// 字幕、HUD、引文卡、背景星尘、颗粒、暗角
'use strict';
const K = require('./core');
const { W, H, C, text, vis, rgba, clamp, smooth, Canvas, mulberry32, glow } = K;
const TL = require('./timeline');

// —— 背景 ——
const rnd = mulberry32(7);
const STARS = Array.from({ length: 520 }, () => ({
  x: rnd() * W, y: rnd() * H, r: Math.pow(rnd(), 3) * 1.6 + 0.35,
  a: 0.15 + Math.pow(rnd(), 2) * 0.55, tw: rnd() * 6.28, sp: 0.3 + rnd() * 1.2, dx: (rnd() - 0.5) * 3,
}));
function background(ctx, t, o = {}) {
  const { starA = 1, warm = 0.5 } = o;
  ctx.fillStyle = rgba(C.bg);
  ctx.fillRect(0, 0, W, H);
  // 中心偏下的暖色雾，极淡
  const g = ctx.createRadialGradient(W * 0.5, H * 0.62, 0, W * 0.5, H * 0.62, W * 0.62);
  g.addColorStop(0, `rgba(60,44,28,${0.32 * warm})`);
  g.addColorStop(0.5, `rgba(20,24,34,${0.25})`);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  if (starA > 0) {
    ctx.save();
    for (const s of STARS) {
      const a = s.a * starA * (0.65 + 0.35 * Math.sin(t * s.sp + s.tw));
      const x = ((s.x + s.dx * t) % W + W) % W;
      ctx.fillStyle = `rgba(200,210,230,${a})`;
      ctx.beginPath(); ctx.arc(x, s.y, s.r, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  }
}

// —— 颗粒与暗角（预先生成）——
const GRAIN = [];
{
  const r = mulberry32(99);
  for (let n = 0; n < 6; n++) {
    const S = 256, cv = new Canvas(S, S), x = cv.getContext('2d');
    const img = x.createImageData(S, S), d = img.data;
    for (let i = 0; i < S * S; i++) {
      const v = r() * 255;
      d[i * 4] = v; d[i * 4 + 1] = v; d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
    }
    x.putImageData(img, 0, 0);
    GRAIN.push(cv);
  }
}
const VIGNETTE = (() => {
  const cv = new Canvas(W, H), x = cv.getContext('2d');
  const g = x.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 1.05);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.72)');
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // 底部为字幕压暗
  const b = x.createLinearGradient(0, H * 0.74, 0, H);
  b.addColorStop(0, 'rgba(0,0,0,0)');
  b.addColorStop(1, 'rgba(0,0,0,0.55)');
  x.fillStyle = b; x.fillRect(0, H * 0.74, W, H * 0.26);
  return cv;
})();
function finish(ctx, t, frame) {
  ctx.drawImage(VIGNETTE, 0, 0);
  ctx.save();
  ctx.globalCompositeOperation = 'overlay';
  ctx.globalAlpha = 0.07;
  const g = GRAIN[frame % GRAIN.length];
  const ox = (frame * 37) % 256, oy = (frame * 91) % 256;
  for (let y = -oy; y < H; y += 256) for (let x = -ox; x < W; x += 256) ctx.drawImage(g, x, y);
  ctx.restore();
}

// —— 字幕 ——
function subtitles(ctx, t) {
  for (const [a, b, zh, en] of TL.SUBS) {
    const v = vis(t, a, b, 0.55, 0.45);
    if (v <= 0) continue;
    const rise = (1 - smooth((t - a) / 0.8)) * 6;
    // 字幕下方的柔和压暗，画面铺满或掠过字幕区时保证可读
    const tw = K.measure(ctx, zh, { size: 40, weight: 400, spacing: 0.04 });
    ctx.save();
    ctx.translate(W / 2, 980); ctx.scale((tw / 2 + 140) / 70, 1);
    const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, 70);
    sg.addColorStop(0, `rgba(3,4,7,${0.62 * v})`); sg.addColorStop(0.6, `rgba(3,4,7,${0.4 * v})`); sg.addColorStop(1, 'rgba(3,4,7,0)');
    ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(0, 0, 70, 0, 6.2832); ctx.fill();
    ctx.restore();
    text(ctx, zh, W / 2, 962 + rise, { size: 40, weight: 400, alpha: 0.94 * v, spacing: 0.04 });
    text(ctx, en, W / 2, 1009 + rise, { size: 27, family: 'Garamond', style: 'italic', weight: 400, alpha: 0.58 * v });
  }
}

// —— HUD：左上标签 + 右上数值 ——
function hud(ctx, a, o) {
  if (a <= 0.002) return;
  const { label, en, value, valueEn, valueColor = C.gold } = o;
  if (label) text(ctx, label, 150, 112, { size: 26, weight: 300, align: 'left', alpha: 0.72 * a, spacing: 0.12 });
  if (en) text(ctx, en, 152, 140, { size: 13, family: 'Mono', weight: 300, align: 'left', alpha: 0.45 * a, spacing: 0.3 });
  if (value) text(ctx, value, W - 150, 112, { size: 26, weight: 300, align: 'right', alpha: 0.9 * a, color: valueColor, spacing: 0.06 });
  if (valueEn) text(ctx, valueEn, W - 150, 140, { size: 13, family: 'Mono', weight: 300, align: 'right', alpha: 0.45 * a, spacing: 0.3 });
}

// —— 引文卡 ——
function quotes(ctx, t) {
  for (const [a, b, zh, en, src] of TL.QUOTES) {
    const v = vis(t, a, b, 1.2, 1.0);
    if (v <= 0) continue;
    const n = zh.length, lh = 66;
    const y0 = 470 - (n - 1) * lh / 2;
    // 上下细线
    ctx.save();
    const lw = 160 * smooth((t - a) / 1.5);
    ctx.strokeStyle = rgba(C.gold, 0.45 * v); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2 - lw, y0 - 92); ctx.lineTo(W / 2 + lw, y0 - 92); ctx.stroke();
    ctx.restore();
    zh.forEach((s, i) => {
      const vi = v * smooth((t - a - 0.35 * i) / 1.0);
      text(ctx, s, W / 2, y0 + i * lh, { size: 44, weight: 300, alpha: 0.95 * vi, spacing: 0.08 });
    });
    const ve = v * smooth((t - a - 0.35 * n - 0.4) / 1.2);
    wrapItalic(ctx, en, W / 2, y0 + (n - 1) * lh + 72, 1100, ve);
    text(ctx, src, W / 2, y0 + (n - 1) * lh + (en.length > 70 ? 182 : 140), { size: 20, weight: 300, alpha: 0.6 * ve, color: C.gold, spacing: 0.15 });
  }
}
function wrapItalic(ctx, s, x, y, maxW, a) {
  const o = { size: 30, family: 'Garamond', style: 'italic', weight: 400, alpha: 0.62 * a };
  const words = s.split(' '); const lines = []; let cur = '';
  for (const w of words) {
    const tryS = cur ? cur + ' ' + w : w;
    if (K.measure(ctx, tryS, o) > maxW && cur) { lines.push(cur); cur = w; } else cur = tryS;
  }
  lines.push(cur);
  lines.forEach((l, i) => text(ctx, l, x, y + i * 40, o));
}

// —— 重击时的画面微闪 ——
function hitFlash(ctx, t) {
  let f = 0;
  for (const [ht, s] of TL.HITS) {
    const d = t - ht;
    if (d >= 0 && d < 1.2) f = Math.max(f, s * Math.exp(-d * 5));
  }
  if (f > 0.01) glow(ctx, W / 2, H / 2, W * 0.75, C.gold, 0.12 * f);
  return f;
}

// 画面铺满时，为 HUD 和字幕压暗上下边
function bands(ctx, a) {
  if (a <= 0) return;
  ctx.save();
  const gb = ctx.createLinearGradient(0, 760, 0, H);
  gb.addColorStop(0, 'rgba(3,4,7,0)'); gb.addColorStop(0.45, `rgba(3,4,7,${0.82 * a})`); gb.addColorStop(1, `rgba(3,4,7,${0.9 * a})`);
  ctx.fillStyle = gb; ctx.fillRect(0, 760, W, H - 760);
  const gt = ctx.createLinearGradient(0, 0, 0, 230);
  gt.addColorStop(0, `rgba(3,4,7,${0.85 * a})`); gt.addColorStop(1, 'rgba(3,4,7,0)');
  ctx.fillStyle = gt; ctx.fillRect(0, 0, W, 230);
  ctx.restore();
}

module.exports = { bands, background, finish, subtitles, hud, quotes, hitFlash };
