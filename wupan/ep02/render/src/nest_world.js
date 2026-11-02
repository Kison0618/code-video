// 蚁巢剖面（静态部分）：天空、草皮、分层土、蚁室和隧道（剪纸洞）。启动时画成一张大位图，逐帧只贴图
'use strict';
const K = require('./core');
const { Canvas, mulberry32, noise1, clamp } = K;
const { Path2D } = require('skia-canvas');
const P = require('./paper');

const X0 = -1300, Y0 = -700, WW = 4600, WH = 2700;   // 世界范围
const SURF = 188;                                     // 地面高度

// 蚁室：中心、半宽、顶高、底深（底比较平，蚂蚁站在底上）
const ROOMS = {
  M: [1010, 800, 640, 250, 85], R1: [1520, 400, 240, 110, 50], C2: [-260, 560, 300, 120, 55],
  C3: [300, 1280, 380, 150, 60], C4: [1680, 1250, 420, 150, 60], C5: [2330, 660, 300, 130, 55], C6: [960, 1640, 360, 130, 55],
};
const floorY = (k, x) => { const [cx, cy, rx, , rb] = ROOMS[k]; const u = clamp((x - cx) / rx, -0.98, 0.98); return cy + rb * Math.sqrt(1 - u * u); };
// 隧道中心线、宽
const TUNNELS = [
  [[[560, 830], [450, 770], [375, 670], [330, 550], [302, 430], [276, 310], [258, 200], [252, 140]], 150],
  [[[1560, 800], [1680, 700], [1705, 560], [1640, 450]], 120],
  [[[340, 600], [160, 590], [0, 575], [-110, 565]], 100],
  [[[700, 860], [620, 1000], [520, 1120], [420, 1210]], 100],
  [[[1350, 870], [1450, 1000], [1560, 1120], [1630, 1170]], 100],
  [[[1720, 420], [1890, 470], [2060, 560], [2150, 620]], 100],
  [[[420, 1330], [560, 1450], [750, 1560], [860, 1600]], 95],
];

function roomPts(k) {
  const [cx, cy, rx, rt, rb] = ROOMS[k], o = [];
  for (let i = 0; i < 72; i++) { const a = Math.PI + i / 72 * Math.PI * 2; const s = Math.sin(a); o.push([cx + rx * Math.cos(a), cy + (s < 0 ? rt : rb) * s]); }
  return o;
}
function tubePts(pts, w) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d * w / 2, ny = dx / d * w / 2;
    L.push([pts[i][0] + nx, pts[i][1] + ny]); R.push([pts[i][0] - nx, pts[i][1] - ny]);
  }
  return [...L, ...R.reverse()];
}
const CAV = (() => {
  let p = null; let seed = 30;
  const add = q => { p = p ? p.union(q) : q; };
  for (const k of Object.keys(ROOMS)) add(P.poly(P.jag(roomPts(k), 3, 16, seed++)));
  for (const [pts, w] of TUNNELS) add(P.poly(P.jag(tubePts(pts, w), 3, 16, seed++)));
  const soil = new Path2D(); soil.rect(X0, SURF - 4, WW, WH);
  return p.intersect(soil);
})();

function wave(y, amp, seed, f = 0.004) { const o = []; for (let x = X0; x <= X0 + WW; x += 30) o.push([x, y + noise1(x * f, seed) * amp + noise1(x * f * 4, seed + 3) * amp * 0.25]); return o; }
const LAYERS = [[SURF, '#dcb882', 0], [360, '#cfa66d', 40], [560, '#c0925c', 46], [800, '#ab7d4b', 52], [1050, '#97693e', 48], [1360, '#835a35', 56], [1680, '#704b2c', 50]];

function build() {
  const cv = new Canvas(WW, WH), x = cv.getContext('2d');
  x.translate(-X0, -Y0);
  const r = mulberry32(5);
  // 天空 + 远山 + 云
  x.fillStyle = '#f5ead3'; x.fillRect(X0, Y0, WW, SURF - Y0 + 10);
  P.piece(x, P.poly([...wave(118, 30, 4, 0.002), [X0 + WW, SURF + 20], [X0, SURF + 20]]), '#d9d2a6', { blur: 10, dy: 4 });
  for (const [cx, cy, s] of [[760, 80, 1], [1250, 40, 0.8], [-300, 60, 1.1], [2300, 50, 1], [2900, 90, 0.9]]) {
    const pth = new Path2D();
    for (const [dx, dy, rr] of [[-70, 10, 40], [-20, -12, 52], [40, 0, 44], [90, 14, 30]]) pth.ellipse(cx + dx * s, cy + dy * s, rr * s, rr * 0.8 * s, 0, 0, Math.PI * 2);
    P.piece(x, pth, '#fbf5e6', { blur: 10, dy: 5 });
  }
  // 土层（从上往下叠，每层往上投影）
  LAYERS.forEach(([y, col, amp], i) => {
    const top = i === 0 ? wave(y, 6, 9, 0.01) : wave(y, amp, 10 + i);
    P.piece(x, P.poly([...P.jag(top, 2, 20, 50 + i, false), [X0 + WW, Y0 + WH], [X0, Y0 + WH]]), col, { blur: 16, dy: -7, color: 'rgba(50,28,8,0.35)' });
  });
  // 石子、根须
  for (let n = 0; n < 160; n++) {
    const px = X0 + r() * WW, py = SURF + 40 + r() * (WH + Y0 - SURF - 40), rr = 6 + r() * 16;
    P.piece(x, P.poly(P.jag(P.ellipsePts(px, py, rr * (1 + r() * 0.6), rr, 14, r() * 3), 1.2, 6, n)), ['#e3cba0', '#b9925f', '#8f6a45', '#d8bd8c'][n % 4], { blur: 5, dy: 3 });
  }
  x.lineCap = 'round';
  for (let n = 0; n < 22; n++) {
    let px = X0 + 200 + r() * (WW - 400), py = SURF + 5; const len = 120 + r() * 260;
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 8; k++) { px += (r() - 0.5) * 40; py += len / 8; x.lineTo(px, py); }
    x.save(); x.shadowColor = 'rgba(50,28,8,0.35)'; x.shadowBlur = 6; x.shadowOffsetY = 3;
    x.strokeStyle = '#ecd8ad'; x.lineWidth = 5 + r() * 4; x.stroke(); x.restore();
  }
  // 蚁室和隧道：洞
  P.hole(x, CAV, '#86603f', { blur: 28, dy: 16, color: 'rgba(30,15,5,0.7)' });
  x.save(); x.clip(CAV);
  for (let n = 0; n < 400; n++) { x.fillStyle = `rgba(30,15,5,${0.05 + r() * 0.08})`; x.beginPath(); x.ellipse(X0 + r() * WW, SURF + r() * 2000, 4 + r() * 14, 3 + r() * 8, r() * 3, 0, Math.PI * 2); x.fill(); }
  x.restore();
  // 草皮
  const grass = new Path2D();
  for (let gx = X0; gx < X0 + WW; gx += 14) {
    if (gx > 200 && gx < 305) continue;                  // 洞口
    const h = 26 + r() * 34, lean = (r() - 0.5) * 18;
    grass.moveTo(gx - 9, SURF + 6); grass.lineTo(gx + lean, SURF - h); grass.lineTo(gx + 9, SURF + 6); grass.closePath();
  }
  P.piece(x, grass, '#7f9146', { blur: 8, dy: 4 });
  P.piece(x, P.poly([...P.jag([[X0, SURF - 6], [205, SURF - 6], [205, SURF + 12], [X0, SURF + 12]], 2, 14, 7)]), '#6d7e3a', { blur: 6, dy: 3 });
  P.piece(x, P.poly([...P.jag([[300, SURF - 6], [X0 + WW, SURF - 6], [X0 + WW, SURF + 12], [300, SURF + 12]], 2, 14, 8)]), '#6d7e3a', { blur: 6, dy: 3 });
  // 洞口土堆
  for (const [mx, s] of [[180, 1], [330, 0.85]]) P.piece(x, P.poly(P.jag([[mx - 60 * s, SURF + 4], [mx - 25 * s, SURF - 26 * s], [mx + 20 * s, SURF - 30 * s], [mx + 60 * s, SURF + 4]], 2, 8, mx)), '#c79e66', { blur: 8, dy: 4 });
  // 卵室里的卵
  for (const [ex, ey] of [[1400, 430], [1450, 438], [1500, 434], [1555, 440], [1610, 430], [1470, 410], [1530, 408]]) {
    P.piece(x, P.poly(P.ellipsePts(ex, ey, 22, 14, 24, -0.2)), '#fbf6e8', { blur: 6, dy: 3 });
  }
  return P.bitmap(cv);
}
const BMP = build();

module.exports = { BMP, X0, Y0, WW, WH, SURF, ROOMS, floorY };
