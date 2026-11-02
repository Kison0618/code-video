/* 两张占位图（程序绘制，不含任何外部影像）。浏览器 canvas 和 skia-canvas 通用。
 *   浏览器：ShanhePlaceholders.make('A', 1600, 900)            → HTMLCanvasElement
 *   Node：  require('./lib/placeholders').make('A', 1600, 900, (w, h) => new (require('skia-canvas').Canvas)(w, h))
 * A：暖色黄昏、太阳、三层远山、水面倒影。B：冷色晴空、云、雪峰、田块、河。B 上方有平滑天空，星河/金辉这类依赖天空的式子能看出效果。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShanhePlaceholders = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }
  function ridge(g, W, H, base, amp, freq, color, r) {
    const ph = [r() * 9, r() * 9, r() * 9];
    g.beginPath(); g.moveTo(0, H);
    for (let x = 0; x <= W; x += 4) {
      const u = x / W * freq;
      const y = base - amp * (0.55 * Math.sin(u * 2.1 + ph[0]) + 0.3 * Math.sin(u * 4.7 + ph[1]) + 0.15 * Math.sin(u * 11.3 + ph[2]) + Math.pow(Math.abs(Math.sin(u * 1.3 + ph[0])), 6) * 0.8);
      g.lineTo(x, y);
    }
    g.lineTo(W, H); g.closePath(); g.fillStyle = color; g.fill();
  }
  function grain(g, W, H, k, r) {
    const d = g.getImageData(0, 0, W, H), a = d.data;
    for (let i = 0; i < a.length; i += 4) { const n = (r() - 0.5) * k; a[i] += n; a[i + 1] += n; a[i + 2] += n; }
    g.putImageData(d, 0, 0);
  }
  function label(g, W, H, txt, sub, col) {
    g.fillStyle = col; g.textBaseline = 'alphabetic';
    g.font = `600 ${Math.round(H * 0.16)}px "Noto Serif SC", "Microsoft YaHei", serif`; g.fillText(txt, W * 0.06, H * 0.9);
    g.font = `${Math.round(H * 0.035)}px Consolas, monospace`; g.fillText(sub, W * 0.065, H * 0.95);
  }
  function A(g, W, H) {
    const r = rng(7);
    const s = g.createLinearGradient(0, 0, 0, H * 0.62);
    s.addColorStop(0, '#2b3a63'); s.addColorStop(0.45, '#c46a4a'); s.addColorStop(1, '#f2c27a');
    g.fillStyle = s; g.fillRect(0, 0, W, H);
    const sun = g.createRadialGradient(W * 0.68, H * 0.5, 0, W * 0.68, H * 0.5, H * 0.32);
    sun.addColorStop(0, 'rgba(255,244,214,1)'); sun.addColorStop(0.12, 'rgba(255,230,170,.95)'); sun.addColorStop(1, 'rgba(255,200,120,0)');
    g.fillStyle = sun; g.fillRect(0, 0, W, H);
    ridge(g, W, H, H * 0.56, H * 0.12, 3, '#8a5a5a', r);
    ridge(g, W, H, H * 0.62, H * 0.14, 2.2, '#5a3c46', r);
    ridge(g, W, H, H * 0.7, H * 0.16, 1.6, '#2a1f28', r);
    const w = g.createLinearGradient(0, H * 0.74, 0, H); w.addColorStop(0, '#3b2b33'); w.addColorStop(1, '#120d12');
    g.fillStyle = w; g.fillRect(0, H * 0.74, W, H * 0.26);
    g.fillStyle = 'rgba(255,220,160,.5)';
    for (let i = 0; i < 26; i++) { const y = H * (0.76 + i * 0.008); g.fillRect(W * 0.68 - (40 - i) * W * 0.002, y, (40 - i) * W * 0.004 * (0.5 + r()), H * 0.002); }
    grain(g, W, H, 14, r);
    label(g, W, H, '甲', 'PLACEHOLDER A · 程序绘制', 'rgba(255,240,220,.85)');
  }
  function B(g, W, H) {
    const r = rng(11);
    const s = g.createLinearGradient(0, 0, 0, H * 0.55);
    s.addColorStop(0, '#5f93c8'); s.addColorStop(1, '#d6e6ee');
    g.fillStyle = s; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 7; i++) {
      const x = r() * W, y = H * (0.08 + r() * 0.25), rr = H * (0.04 + r() * 0.06);
      for (let k = 0; k < 6; k++) { g.beginPath(); g.arc(x + (k - 3) * rr * 0.7, y + Math.sin(k) * rr * 0.2, rr * (0.6 + r() * 0.5), 0, 7); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); }
    }
    ridge(g, W, H, H * 0.52, H * 0.22, 2.4, '#e9eef3', r);
    ridge(g, W, H, H * 0.6, H * 0.12, 3.5, '#6f8a8c', r);
    ridge(g, W, H, H * 0.68, H * 0.08, 5, '#2f5a4a', r);
    g.fillStyle = '#3e6b3f'; g.fillRect(0, H * 0.7, W, H * 0.3);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 24; x++) {
      const yy = H * 0.7 + Math.pow(y / 8, 1.6) * H * 0.3, hh = H * 0.3 * (Math.pow((y + 1) / 8, 1.6) - Math.pow(y / 8, 1.6));
      g.fillStyle = `hsl(${85 + r() * 50},${35 + r() * 25}%,${22 + r() * 22}%)`;
      g.fillRect(x * W / 24 + 1, yy + 1, W / 24 - 2, hh - 2);
    }
    g.strokeStyle = 'rgba(170,215,230,.9)'; g.lineWidth = H * 0.012; g.beginPath();
    for (let x = 0; x <= W; x += 8) g.lineTo(x, H * (0.86 + 0.06 * Math.sin(x / W * 7)));
    g.stroke();
    grain(g, W, H, 12, r);
    label(g, W, H, '乙', 'PLACEHOLDER B · 程序绘制', 'rgba(20,30,28,.85)');
  }
  function make(which, W, H, createCanvas) {
    const c = createCanvas ? createCanvas(W, H) : Object.assign(document.createElement('canvas'), { width: W, height: H });
    const g = c.getContext('2d');
    (which === 'B' ? B : A)(g, W, H);
    return c;
  }
  return { make };
});
