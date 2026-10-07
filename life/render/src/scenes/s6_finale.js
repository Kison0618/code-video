// 终幕 线：五盏灯、"你"、还没写的下一段、片名（300–353 秒）
'use strict';
const K = require('../core');
const { W, H, C, clamp, lerp, prog, smooth, easeInOut, easeOut, vis, glow, glowLine, line, text, mulberry32, rgba, mix } = K;
const TL = require('../timeline');
const S1 = require('./s1_thread');

const Y = 540, YOU = 1600;
const EMB = [
  [300, '祖先', 'ANCESTORS'], [560, '文字', 'TEXT'], [820, '形态', 'FORM'], [1080, '流动', 'FLOW'], [1340, '共生', 'TOGETHER'],
];
const ET = i => 315.4 + i * 0.9;
const events = EMB.map((_, i) => ({ t: ET(i), type: 'emblem', i }));
// "下一段"前方亮起的那一粒新字母
const NEXT_T = 340.6;
events.push({ t: NEXT_T, type: 'beatflash' });

// 线上的"错字"：第二幕的红色突变点回到终幕，322 秒重击时绽放成金色——不完美正是美的来源
const FLECKS = (() => { const r = mulberry32(31); return Array.from({ length: 46 }, () => ({ x: -20 + r() * (YOU - 90), ph: r() * 6.283, s: 0.6 + r() * 0.8, d: r() * 0.5 })); })();
const threadY = (x, t) => Y + 3 * Math.sin(x * 0.012 - t * 0.9);
function drawFlecks(ctx, t, embFade) {
  const appear = smooth(prog(t, 315.6, 317.4));
  if (appear <= 0) return;
  for (const f of FLECKS) {
    const y = threadY(f.x, t);
    const toGold = smooth(prog(t, 322 + f.d * 0.4, 323.0 + f.d * 0.4));
    const col = mix(C.rose, C.gold, toGold);
    // 金色之前轻轻呼吸，像还没被接受的"错误"
    const breathe = 0.85 + 0.15 * Math.sin(t * 2.2 * f.s + f.ph);
    const a = appear * lerp(breathe, 0.75, toGold) * embFade;
    const pop = t >= 322 + f.d * 0.4 ? Math.exp(-(t - 322 - f.d * 0.4) * 3.2) : 0;
    glow(ctx, f.x, y, lerp(10 + 5 * f.s, 6 + 3 * f.s, toGold) + 34 * pop, col, a * (lerp(1.1, 0.8, toGold) + 1.2 * pop));
    ctx.fillStyle = rgba(mix(col, C.ivory, 0.35), a);
    ctx.beginPath(); ctx.arc(f.x, y, lerp(2.4, 1.6, toGold) * f.s + 0.6, 0, 6.283); ctx.fill();
  }
}
// "从没有停下"：沿线流向"你"的光脉冲
function drawPulses(ctx, t, embFade) {
  const a = smooth(prog(t, 322.3, 323.6)) * embFade;
  if (a <= 0) return;
  const span = YOU + 60;
  for (let k = 0; k < 6; k++) {
    const x = (((t - 322) * 300 + k * span / 6) % span) - 60;
    const near = 1 - smooth(prog(x, YOU - 160, YOU));   // 汇入"你"时淡出
    for (let j = 0; j < 5; j++) {
      const xx = x - j * 14;
      glow(ctx, xx, threadY(xx, t), 12 - j * 1.8, C.gold, a * near * 0.55 * (1 - j / 5));
    }
  }
}

// —— 五个小图标 ——
function iconAncestors(ctx, x, y, a) {
  const g = (gx, gy, depth, span) => {
    if (depth === 0) return;
    for (const s of [-1, 1]) {
      const nx = gx - 24, ny = gy + s * span;
      line(ctx, [[gx, gy], [nx, ny]], C.gold, a * 0.8, 1);
      glow(ctx, nx, ny, 5, C.gold, a * 0.8);
      g(nx, ny, depth - 1, span / 2);
    }
  };
  g(x + 36, y, 3, 20);
}
function iconHelix(ctx, x, y, a) {
  const s1 = [], s2 = [];
  for (let u = -45; u <= 45; u += 2) { s1.push([x + u, y + 16 * Math.sin(u * 0.105)]); s2.push([x + u, y - 16 * Math.sin(u * 0.105)]); }
  line(ctx, s1, C.gold, a, 1.2); line(ctx, s2, C.ivory, a * 0.8, 1.2);
  for (let u = -42; u <= 42; u += 7) line(ctx, [[x + u, y + 16 * Math.sin(u * 0.105)], [x + u, y - 16 * Math.sin(u * 0.105)]], C.cyan, a * 0.4, 1);
}
function iconSeeds(ctx, x, y, a) {
  ctx.fillStyle = rgba(C.gold, 0.9 * a);
  for (let k = 0; k < 150; k++) { const r = 3.1 * Math.sqrt(k + 0.5), th = k * 2.39996; ctx.beginPath(); ctx.arc(x + r * Math.cos(th), y + r * Math.sin(th), 1.3, 0, 6.283); ctx.fill(); }
}
function iconFlow(ctx, x, y, a, t) {
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let u = 0; u < 1; u += 0.02) { const th = u * 9 + k * 2.1 + t * 0.8, r = 4 + u * 34; pts.push([x + r * Math.cos(th), y + r * Math.sin(th)]); }
    line(ctx, pts, k === 0 ? C.gold : C.ivory, a * 0.75, 1);
  }
}
function iconCell(ctx, x, y, a) {
  const pts = []; for (let k = 0; k <= 40; k++) { const th = k / 40 * 6.283; pts.push([x + 36 * Math.cos(th), y + 36 * Math.sin(th)]); }
  line(ctx, pts, C.cyan, a * 0.8, 1.1);
  const cap = []; for (let k = 0; k <= 30; k++) { const th = k / 30 * 6.283; cap.push([x + 6 + 14 * Math.cos(th), y + 4 + 6 * Math.sin(th)]); }
  line(ctx, cap, C.gold, a, 1.2);
  glow(ctx, x + 6, y + 4, 14, C.gold, a * 0.6);
}
const ICONS = [iconAncestors, iconHelix, iconSeeds, iconFlow, iconCell];

const SPARKS = (() => { const r = mulberry32(12); return Array.from({ length: 160 }, () => ({ e: Math.floor(r() * 6), ang: r() * 6.283, sp: 60 + r() * 260, life: 0.8 + r() * 1.4 })); })();

function draw(ctx, t) {
  if (t < 313 || t > 353) return;
  const flare = t >= 322 ? Math.exp(-(t - 322) * 1.1) : 0;
  const z = lerp(1, 2.1, easeInOut(prog(t, 329.4, 333.6))) * 1;
  const zBack = easeInOut(prog(t, 343.2, 346.0));
  const zz = lerp(z, 1, zBack);
  ctx.save();
  ctx.translate(YOU, Y); ctx.scale(zz, zz); ctx.translate(-YOU, -Y);
  const lineA = smooth(prog(t, 314.4, 316.4));
  // 线：从左到"你"
  const pts = [];
  for (let x = -40; x <= YOU; x += 8) pts.push([x, Y + 3 * Math.sin(x * 0.012 - t * 0.9)]);
  glowLine(ctx, pts, C.gold, lineA * (0.85 + 0.6 * flare), 1.6 + 1.6 * flare, 1 + flare);
  const embFade = 1 - smooth(prog(t, 343.4, 345.6));
  drawFlecks(ctx, t, embFade);
  drawPulses(ctx, t, embFade);
  // 五盏灯
  EMB.forEach(([x, zh, en], i) => {
    const a = smooth(prog(t, ET(i), ET(i) + 0.9)) * embFade;
    if (a <= 0) return;
    const pop = Math.exp(-Math.max(0, t - ET(i)) * 3);
    glow(ctx, x, Y, 18 + 26 * pop + 30 * flare, C.gold, a * (0.8 + 0.8 * flare));
    glow(ctx, x, 430, 70 + 40 * flare, C.amber, a * (0.12 + 0.25 * flare));
    ICONS[i](ctx, x, 430, a * (0.85 + 0.15 * flare), t);
    line(ctx, [[x, 478], [x, Y - 10]], C.gold, 0.35 * a, 1);
    text(ctx, zh, x, 604, { size: 22, weight: 300, alpha: 0.85 * a, spacing: 0.25 });
    text(ctx, en, x, 630, { size: 11, family: 'Mono', alpha: 0.45 * a, spacing: 0.35 });
  });
  // 322 秒的爆发：火花
  if (t > 322 && t < 325) {
    for (const s of SPARKS) {
      const d = t - 322;
      if (d > s.life) continue;
      const ex = s.e < 5 ? EMB[s.e][0] : YOU, ey = s.e < 5 ? 430 : Y;
      const r = s.sp * (1 - Math.exp(-d * 2.4)) / 2.4 * 2;
      glow(ctx, ex + r * Math.cos(s.ang), ey + r * Math.sin(s.ang), 4, C.gold, 0.8 * (1 - d / s.life));
    }
  }
  // 你
  const ya = smooth(prog(t, 314.8, 316.8));
  S1.drawHead(ctx, YOU, Y, t, ya * (1 + 0.4 * flare), 0.85);
  const la = ya * (1 - smooth(prog(t, 343.6, 345.0)));
  text(ctx, '你', YOU, Y - 52, { size: 30, alpha: 0.9 * la });
  text(ctx, 'YOU', YOU, Y - 30, { size: 11, family: 'Mono', alpha: 0.45 * la, spacing: 0.4 });
  // 下一段：还没写（虚线）
  const dA = smooth(prog(t, 338.2, 339.4));
  if (dA > 0) {
    const reach = lerp(YOU + 20, W + 400, easeOut(prog(t, 338.4, 342.6)));
    ctx.save();
    ctx.setLineDash([10, 14]);
    ctx.strokeStyle = rgba(C.gold, 0.55 * dA);
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(YOU + 22, Y); ctx.lineTo(reach, Y); ctx.stroke();
    ctx.restore();
  }
  // 虚线前方：一粒还没有写定的新字母
  const na = smooth(prog(t, NEXT_T, NEXT_T + 1.2)) * (1 - smooth(prog(t, 349.5, 351.5)));
  if (na > 0) {
    const nx = YOU + 125, br = 0.7 + 0.3 * Math.sin((t - NEXT_T) * 2.4);
    glow(ctx, nx, Y, 16, C.rose, na * 0.7 * br);
    ctx.fillStyle = rgba(mix(C.rose, C.ivory, 0.3), na * 0.9);
    ctx.beginPath(); ctx.arc(nx, Y, 2.2, 0, 6.283); ctx.fill();
  }
  ctx.restore();
  // 片名
  const ta = vis(t, 344.4, 352.4, 1.2, 1.2);
  if (ta > 0) {
    [...'生命之美'].forEach((ch, i) => {
      const a = ta * smooth(prog(t, 344.6 + i * 0.3, 346.0 + i * 0.3));
      text(ctx, ch, W / 2 + (i - 1.5) * 150, 438, { size: 108, weight: 200, alpha: a });
    });
    const sa = ta * smooth(prog(t, 346.6, 348.0));
    text(ctx, '一条从未断过的线', W / 2, 650, { size: 30, weight: 300, color: C.gold, alpha: sa, spacing: 0.5 });
    text(ctx, 'THE BEAUTY OF LIFE  ·  AN UNBROKEN THREAD', W / 2, 690, { size: 14, family: 'Mono', weight: 300, alpha: 0.5 * sa, spacing: 0.45 });
  }
}
module.exports = { start: 313, end: 353, draw, events };
