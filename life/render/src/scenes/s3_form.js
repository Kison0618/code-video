// 第三幕 形态：向日葵的黄金角 + 图灵斑纹（163–227 秒）
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('../core');
const { W, H, C, Canvas, clamp, lerp, prog, smooth, easeInOut, easeOut, easeIn, vis, glow, glowLine, line, partial, text, fmt, mulberry32, rgba, mix } = K;
const UI = require('../ui');

const events = [];
const CX = 960, CY = 500, R = 400, N = 1000;
const GOLD = 137.50776405;
const c = R / Math.sqrt(N);

// 种子数量随时间增长：先慢慢长出前十几粒，然后加速长满
function count(t) {
  if (t < 165.2) return 0;
  if (t < 171.4) return 13 * prog(t, 165.4, 171.0);
  return lerp(13, N, easeIn(prog(t, 171.4, 177.2)) * 0.15 + 0.85 * easeInOut(prog(t, 172.0, 177.4)));
}
// 每粒转过的角度
function alphaDeg(t) {
  const off = easeInOut(prog(t, 179.0, 180.8)) * (1 - easeInOut(prog(t, 185.6, 187.4)));
  return lerp(GOLD, 137.0, off);
}
// 镜头：开始时贴近花心，种子长满时拉远
function zoom(t) { return lerp(3.4, 1, easeInOut(prog(t, 171.6, 177.6))); }

for (let j = 0; j < 13; j++) events.push({ t: 165.4 + (j / 13) * 5.6, type: 'seed' });
for (let k = 0; k < 40; k++) events.push({ t: 171.6 + Math.pow(k / 40, 0.6) * 5.6, type: 'seedfast' });
events.push({ t: 179.0, type: 'twist' }, { t: 185.6, type: 'untwist' }, { t: 192.4, type: 'spiral' }, { t: 194.6, type: 'spiral' });

function seedPos(j, n, aDeg) {
  const r = c * Math.sqrt(Math.max(0, n - j) + 0.5);
  const th = j * aDeg * Math.PI / 180;
  return [CX + r * Math.cos(th), CY + r * Math.sin(th), r];
}

function drawSunflower(ctx, t) {
  if (t < 164.8 || t > 201) return;
  const n = count(t), aDeg = alphaDeg(t), z = zoom(t);
  const off = clamp(Math.abs(aDeg - GOLD) / 0.5);
  const fade = 1 - smooth(prog(t, 197.6, 200.2));
  const nInt = Math.ceil(n);
  ctx.save();
  ctx.translate(CX, CY); ctx.scale(z, z); ctx.translate(-CX, -CY);
  // 花盘底光
  glow(ctx, CX, CY, (Math.sqrt(n) * c + 80) * 1.6, C.amber, 0.12 * fade);
  for (let j = 0; j < nInt; j++) {
    const age = n - j;                 // 0 = 刚长出
    if (age <= 0) continue;
    const [x, y, r] = seedPos(j, n, aDeg);
    const grow = smooth(clamp(age / 2.0));
    const sz = c * 0.43 * grow * (0.75 + 0.25 * clamp(r / R));
    const col = mix(mix(C.ivory, C.gold, clamp(r / (R * 0.5))), C.rose, off * 0.85);
    ctx.fillStyle = rgba(col, 0.9 * fade);
    ctx.beginPath(); ctx.arc(x, y, sz, 0, 6.2832); ctx.fill();
  }
  // 前几粒：画出旋转角度的弧
  const arcA = vis(t, 165.6, 173.6, 0.6, 1.0) * fade;
  if (arcA > 0 && nInt >= 2) {
    const j = nInt - 1;
    const a1 = (j - 1) * aDeg * Math.PI / 180, a2 = j * aDeg * Math.PI / 180;
    const rr = c * 2.6;
    ctx.save();
    ctx.strokeStyle = rgba(C.cyan, 0.7 * arcA); ctx.lineWidth = 1.2 / z;
    ctx.beginPath(); ctx.arc(CX, CY, rr, a1, a2, false); ctx.stroke();
    ctx.setLineDash([3 / z, 4 / z]);
    for (const a of [a1, a2]) { ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + rr * 1.5 * Math.cos(a), CY + rr * 1.5 * Math.sin(a)); ctx.stroke(); }
    ctx.restore();
    const am = (a1 + a2) / 2;
    text(ctx, '137.5°', CX + rr * 1.9 * Math.cos(am), CY + rr * 1.9 * Math.sin(am) + 4 / z, { size: 15 / z, family: 'Mono', color: C.cyan, alpha: 0.9 * arcA });
  }
  // 螺旋线：34 条（青）与 55 条（金）
  for (const [F, col, t0, rmin, rmax] of [[34, C.cyan, 192.4, 0.18, 0.7], [55, C.gold, 194.6, 0.38, 0.98]]) {
    const sa = vis(t, t0, 197.8, 0.4, 0.5) * fade;
    if (sa <= 0) continue;
    const f = easeInOut(prog(t, t0, t0 + 1.6));
    for (let fam = 0; fam < F; fam++) {
      const pts = [];
      for (let j = fam; j < N; j += F) {
        const [x, y, r] = seedPos(j, n, aDeg);
        if (r >= rmin * R && r <= rmax * R) pts.push([x, y]);
      }
      glowLine(ctx, partial(pts, f), col, 0.75 * sa, 1.1, 0.5);
    }
  }
  ctx.restore();
  // 数字标注
  const l34 = vis(t, 193.2, 197.8, 0.5, 0.5) * fade, l55 = vis(t, 195.4, 197.8, 0.5, 0.5) * fade;
  text(ctx, '34', CX - 560, CY + 20, { size: 84, family: 'Garamond', weight: 300, color: C.cyan, alpha: l34 });
  text(ctx, 'SPIRALS', CX - 560, CY + 56, { size: 13, family: 'Mono', alpha: 0.5 * l34, spacing: 0.4 });
  text(ctx, '55', CX + 560, CY + 20, { size: 84, family: 'Garamond', weight: 300, color: C.gold, alpha: l55 });
  text(ctx, 'SPIRALS', CX + 560, CY + 56, { size: 13, family: 'Mono', alpha: 0.5 * l55, spacing: 0.4 });
  // HUD
  const ha = vis(t, 171.6, 191.6, 0.6, 0.6);
  UI.hud(ctx, ha, { label: '每粒旋转', en: 'TURN PER SEED', value: `${aDeg.toFixed(1)}°`, valueEn: off > 0.05 ? 'OFF BY HALF A DEGREE' : 'THE GOLDEN ANGLE', valueColor: mix(C.gold, C.rose, off) });
  UI.hud(ctx, vis(t, 166.0, 171.4, 0.6, 0.4), { label: '种子', en: 'SEEDS', value: `${Math.floor(n)}`, valueEn: 'ONE BY ONE' });
}

// —— 图灵斑纹 ——
const GW = 480, GH = 270, RD_T0 = 197.5, RD_FPS = 30;
let RD = null;
function rdData() {
  if (!RD) {
    const f = path.join(__dirname, '..', '..', 'cache', 'rd.bin');
    RD = fs.readFileSync(f);
  }
  return RD;
}
const rdCanvas = new Canvas(GW, GH);
const rdCtx = rdCanvas.getContext('2d');
const rdImg = rdCtx.createImageData(GW, GH);
// 颜色表：暗底 → 深琥珀 → 金 → 象牙白
const LUT = (() => {
  const stops = [[0, [0, 0, 0]], [0.25, [10, 10, 14]], [0.45, [70, 44, 22]], [0.68, [176, 128, 66]], [0.88, [226, 196, 140]], [1, [240, 224, 196]]];
  const out = [];
  for (let i = 0; i < 256; i++) {
    const s = i / 255;
    let k = 0; while (k < stops.length - 2 && s > stops[k + 1][0]) k++;
    const [s0, c0] = stops[k], [s1, c1] = stops[k + 1];
    const u = smooth((s - s0) / (s1 - s0));
    out.push(mix(c0, c1, u));
  }
  return out;
})();
function drawTuring(ctx, t) {
  if (t < 197.5 || t > 227) return;
  const data = rdData();
  const fr = (t - RD_T0) * RD_FPS;
  const nF = Math.floor(data.length / (GW * GH));
  const f0 = Math.min(nF - 1, Math.floor(fr)), f1 = Math.min(nF - 1, f0 + 1), u = fr - Math.floor(fr);
  const o0 = f0 * GW * GH, o1 = f1 * GW * GH;
  const d = rdImg.data;
  for (let i = 0; i < GW * GH; i++) {
    const v = data[o0 + i] * (1 - u) + data[o1 + i] * u;
    const c3 = LUT[Math.round(v)];
    d[i * 4] = c3[0]; d[i * 4 + 1] = c3[1]; d[i * 4 + 2] = c3[2]; d[i * 4 + 3] = 255;
  }
  rdCtx.putImageData(rdImg, 0, 0);
  const a = smooth(prog(t, 198.2, 200.6)) * (1 - smooth(prog(t, 221.8, 225.6)));
  if (a <= 0) return;
  ctx.save();
  ctx.globalAlpha = a;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = a * 0.78;
  ctx.drawImage(rdCanvas, 0, 0, W, H);
  ctx.restore();
  UI.bands(ctx, a);
  UI.hud(ctx, vis(t, 200.2, 213.6, 0.8, 0.6), { label: '形态发生的化学基础', en: 'THE CHEMICAL BASIS OF MORPHOGENESIS', value: '1952', valueEn: 'A. M. TURING' });
  UI.hud(ctx, vis(t, 214.0, 221.2, 0.6, 0.6), { label: '反应 · 扩散', en: 'REACTION · DIFFUSION', value: '没有设计图', valueEn: 'NO BLUEPRINT' });
}

function draw(ctx, t) {
  drawSunflower(ctx, t);
  drawTuring(ctx, t);
}
module.exports = { start: 164, end: 227, draw, events };
