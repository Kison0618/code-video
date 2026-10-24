// core.js —《懂事》v1「灯下线描」引擎：画布 / 数学 / 颜色 / 镜头 / 人物（骨架 → 剪影 → 发光轮廓）/ 轮廓追踪 / 文字
'use strict';
const V = /[?&]ar=9x16\b/.test(location.search);          // 竖屏 1080×1920：同一条时间线，镜头和版式重排
const W = V ? 1080 : 1920, H = V ? 1920 : 1080;
const ANCH = V ? [540, 860] : [960, 540];                  // 镜头焦点落在屏幕上的位置
const cv = document.getElementById('c'); cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
const S = mk(W, H), sx = S.getContext('2d');               // 画面层（会被泛光）
const TMP = mk(W, H), tx = TMP.getContext('2d');           // 临时层：剪影“外扩描边 + 内填充”要先在这里合成，才能整体淡入淡出
const B1 = mk(W >> 2, H >> 2), b1 = B1.getContext('2d');   // 泛光 1/4
const B2 = mk(W >> 3, H >> 3), b2 = B2.getContext('2d');   // 泛光 1/8
const CH = mk(W, H), chx = CH.getContext('2d');            // 色差

// ---------- 数学 ----------
const clamp = (x, a = 0, b = 1) => x < a ? a : x > b ? b : x;
const lerp = (a, b, u) => a + (b - a) * u;
const pr = (t, a, b) => clamp((t - a) / (b - a));
const eo = u => 1 - Math.pow(1 - u, 3);
const ei = u => u * u * u;
const eio = u => u < .5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2;
const win = (t, a, b, fi = .5, fo = .5) => Math.min(eio(pr(t, a, a + fi)), 1 - eio(pr(t, b - fo, b)));
const rnd = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7 + 17.3) * 43758.5453; return x - Math.floor(x); };
const DEG = Math.PI / 180;

// ---------- 颜色：金 = 孩子自己的感受 / 自我照顾；银 = 人；冰 = 别人的情绪雨、距离；红 = 伤害与责怪；余烬 = 父母心里没长大的孩子 ----------
const C = {
  silver: [212, 220, 230], gold: [247, 198, 104], ice: [132, 196, 255], red: [255, 84, 70],
  ember: [255, 132, 56], lamp: [236, 222, 198], gray: [112, 116, 124], white: [248, 247, 242], body: [12, 11, 11], soil: [128, 108, 88],
};
const rgba = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${Math.max(0, Math.min(1, a))})`;
const mixC = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];

// ---------- 镜头 ----------
let CAM = { fx: 960, fy: 540, s: 1 };
function keyCam(K, t) {
  if (t <= K[0][0]) return K[0];
  for (let i = 0; i < K.length - 1; i++) {
    const a = K[i], b = K[i + 1];
    if (t < b[0]) { const u = eio(pr(t, a[0], b[0])); return [t, lerp(a[1], b[1], u), lerp(a[2], b[2], u), lerp(a[3], b[3], u)]; }
  }
  return K[K.length - 1];
}
function camT(c) { c.setTransform(CAM.s, 0, 0, CAM.s, ANCH[0] - CAM.fx * CAM.s, ANCH[1] - CAM.fy * CAM.s); }
const w2s = (x, y) => [ANCH[0] + (x - CAM.fx) * CAM.s, ANCH[1] + (y - CAM.fy) * CAM.s];

// 临时层：画进 TMP（同一个变换），再整体按透明度合成回画面层
function layerBegin() { tx.setTransform(1, 0, 0, 1, 0, 0); tx.globalAlpha = 1; tx.globalCompositeOperation = 'source-over'; tx.clearRect(0, 0, W, H); tx.setTransform(sx.getTransform()); return tx; }
function layerEnd(a = 1, op = 'source-over') { sx.save(); sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalAlpha = clamp(a); sx.globalCompositeOperation = op; sx.drawImage(TMP, 0, 0); sx.restore(); }

// ---------- 人物：侧身骨架（角度驱动，形状之间插值角度 → 动作自然成弧） ----------
const BN = {
  adult: { sp: .30, nk: .105, hr: .07, ua: .17, fa: .155, th: .245, sh: .235, ft: .062, rC: .078, rP: .07, rN: .03, rU: .031, rF: .025, rHd: .028, rT: .047, rS: .035, rFt: .023 },
  child: { sp: .25, nk: .1, hr: .108, ua: .135, fa: .12, th: .18, sh: .17, ft: .058, rC: .082, rP: .074, rN: .036, rU: .034, rF: .029, rHd: .032, rT: .052, rS: .041, rFt: .027 },
};
const PO = {   // sp 躯干前倾 / hd 低头 / a 上臂（从竖直向下算，向前为正）/ e 肘 / l 大腿 / k 膝（负 = 小腿向后）；N 近侧、F 远侧
  stand:   { sp: 1, hd: 0, aN: 6, eN: 12, aF: -6, eF: 10, lN: 4, kN: -3, lF: -4, kF: -3 },
  happy:   { sp: -3, hd: -14, aN: 24, eN: 46, aF: -16, eF: 34, lN: 5, kN: -4, lF: -5, kF: -4 },
  startle: { sp: -12, hd: -6, aN: 46, eN: 76, aF: 34, eF: 64, lN: 14, kN: -10, lF: -12, kF: -12 },
  shrink:  { sp: 20, hd: 40, aN: 20, eN: 62, aF: 14, eF: 56, lN: 7, kN: -10, lF: -4, kF: -8 },
  bow:     { sp: 11, hd: 36, aN: 0, eN: 8, aF: -3, eF: 8, lN: 3, kN: -2, lF: -3, kF: -2 },
  point:   { sp: 4, hd: 14, aN: 72, eN: 6, aF: -6, eF: 12, lN: 4, kN: -3, lF: -4, kF: -3 },
  reach:   { sp: 5, hd: 14, aN: 54, eN: 26, aF: -5, eF: 12, lN: 4, kN: -3, lF: -4, kF: -3 },
  offer:   { sp: 2, hd: -12, aN: 62, eN: 34, aF: 52, eF: 40, lN: 4, kN: -3, lF: -4, kF: -3 },
  sad:     { sp: 9, hd: 30, aN: 10, eN: 40, aF: 4, eF: 36, lN: 3, kN: -3, lF: -3, kF: -3 },
  hold:    { sp: -3, hd: -16, aN: 150, eN: 12, aF: 18, eF: 40, lN: 6, kN: -4, lF: -6, kF: -4 },
  holdA:   { sp: 2, hd: 4, aN: 40, eN: 70, aF: -4, eF: 12, lN: 4, kN: -3, lF: -4, kF: -3 },
  care:    { sp: -4, hd: -24, aN: 128, eN: 16, aF: 40, eF: 40, lN: 5, kN: -4, lF: -5, kF: -4 },
  cheer:   { sp: -7, hd: -22, aN: 166, eN: 10, aF: 150, eF: 14, lN: 8, kN: -6, lF: -8, kF: -6 },
  kneel:   { sp: 9, hd: 16, aN: 58, eN: 28, aF: 26, eF: 40, lN: 94, kN: -96, lF: -6, kF: -94 },
  cross:   { sp: -2, hd: -3, aN: 20, eN: 95, aF: 18, eF: 95, lN: 4, kN: -3, lF: -4, kF: -3 },
  storm:   { sp: 7, hd: 2, aN: 122, eN: 40, aF: 58, eF: 72, lN: 10, kN: -4, lF: -10, kF: -4 },
  passive: { sp: 3, hd: 10, aN: 2, eN: 4, aF: -2, eF: 4, lN: 3, kN: -2, lF: -3, kF: -2 },
};
function fk(P, b) {
  const sa = P.sp * DEG, J = {};
  J.hip = [0, 0];
  J.neck = [Math.sin(sa) * b.sp, -Math.cos(sa) * b.sp];
  J.chest = [J.neck[0] * .68, J.neck[1] * .68];
  const ha = (P.sp + P.hd) * DEG;
  J.head = [J.neck[0] + Math.sin(ha) * b.nk, J.neck[1] - Math.cos(ha) * b.nk];
  const sh = [J.neck[0] - Math.sin(sa) * b.sp * .08, J.neck[1] + Math.cos(sa) * b.sp * .08];
  J.sh = sh;
  for (const s of ['N', 'F']) {
    const a = P['a' + s] * DEG, e = (P['a' + s] + P['e' + s]) * DEG;
    const el = [sh[0] + Math.sin(a) * b.ua, sh[1] + Math.cos(a) * b.ua];
    J['el' + s] = el; J['ha' + s] = [el[0] + Math.sin(e) * b.fa, el[1] + Math.cos(e) * b.fa];
    const l = P['l' + s] * DEG, k = (P['l' + s] + P['k' + s]) * DEG;
    const kn = [Math.sin(l) * b.th, Math.cos(l) * b.th], an = [kn[0] + Math.sin(k) * b.sh, kn[1] + Math.cos(k) * b.sh];
    J['kn' + s] = kn; J['an' + s] = an; J['to' + s] = [an[0] + Math.cos(k) * b.ft, an[1] - Math.sin(k) * b.ft];
  }
  return J;
}
function caps(J, b) {
  return [
    [J.sh, J.elF, b.rU, b.rU * .9], [J.elF, J.haF, b.rF, b.rF * .85], [J.haF, J.haF, b.rHd, b.rHd],
    [J.hip, J.knF, b.rT, b.rT * .82], [J.knF, J.anF, b.rS, b.rS * .72], [J.anF, J.toF, b.rFt, b.rFt * .8],
    [J.hip, J.chest, b.rP, b.rC], [J.chest, J.neck, b.rC, b.rN * 1.5], [J.neck, J.head, b.rN, b.rN], [J.head, J.head, b.hr, b.hr],
    [J.hip, J.knN, b.rT, b.rT * .82], [J.knN, J.anN, b.rS, b.rS * .72], [J.anN, J.toN, b.rFt, b.rFt * .8],
    [J.sh, J.elN, b.rU, b.rU * .9], [J.elN, J.haN, b.rF, b.rF * .85], [J.haN, J.haN, b.rHd, b.rHd],
  ];
}
(function normalize() {      // 站姿身高 = 1
  for (const k in BN) {
    const b = BN[k], L = caps(fk(PO.stand, b), b); let top = 1e9, bot = -1e9;
    for (const q of L) { top = Math.min(top, q[0][1] - q[2], q[1][1] - q[3]); bot = Math.max(bot, q[0][1] + q[2], q[1][1] + q[3]); }
    const s = 1 / (bot - top); for (const p in b) b[p] *= s;
  }
})();
function lerpPose(A, B, u) { const o = {}; for (const k in A) o[k] = lerp(A[k], B[k] ?? A[k], u); return o; }
function poseSeq(t, list) {   // list: [[t0, pose], [t1, pose, dur], ...] —— 到点开始在 dur 秒里过渡到下一个姿势
  let P = list[0][1];
  for (let i = 1; i < list.length; i++) { const [t0, Q, d = .6] = list[i]; if (t <= t0) break; P = lerpPose(P, Q, eio(pr(t, t0, t0 + d))); }
  return P;
}
function walkPose(ph, run = 0) {
  const s = Math.sin(ph), s2 = Math.sin(ph + Math.PI), A = lerp(22, 40, run), K = lerp(28, 72, run);
  const kb = p => -(5 + K * Math.pow(Math.max(0, Math.cos(p)), 1.4));
  return { sp: lerp(4, 15, run), hd: lerp(-2, -8, run), aN: -A * .9 * s, eN: lerp(16, 72, run), aF: -A * .9 * s2, eF: lerp(16, 72, run), lN: A * s, kN: kb(ph), lF: A * s2, kF: kb(ph + Math.PI) };
}

function tcap(c, x0, y0, x1, y1, r0, r1) {   // 两端半径不同的胶囊（凸包），顺时针
  const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy);
  if (d <= Math.abs(r0 - r1) + 1e-3) { const [x, y, r] = r0 >= r1 ? [x0, y0, r0] : [x1, y1, r1]; c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); return; }
  const th = Math.atan2(dy, dx), ph = Math.acos((r0 - r1) / d);
  c.moveTo(x0 + r0 * Math.cos(th + ph), y0 + r0 * Math.sin(th + ph));
  c.arc(x0, y0, r0, th + ph, th - ph + Math.PI * 2);
  c.arc(x1, y1, r1, th - ph, th + ph);
  c.closePath();
}
function figGeom(F) {
  const b = F.bn || BN[F.kind], J = fk(F.P, b), L = caps(J, b);
  let low = -1e9; for (const q of L) low = Math.max(low, q[0][1] + q[2], q[1][1] + q[3]);
  const tr = p => [F.x + F.dir * p[0] * F.h, F.y + (p[1] - low) * F.h];
  return { J, L, tr, b, at: k => tr(J[k]) };
}
function figPath(c, G, F, grow) {
  c.beginPath();
  for (const q of G.L) { const a = G.tr(q[0]), e = G.tr(q[1]); tcap(c, a[0], a[1], e[0], e[1], q[2] * F.h + grow, q[3] * F.h + grow); }
}
function figBBox(G, F) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const q of G.L) for (const [p, r] of [[q[0], q[2]], [q[1], q[3]]]) { const w = G.tr(p), rr = r * F.h + 6; x0 = Math.min(x0, w[0] - rr); y0 = Math.min(y0, w[1] - rr); x1 = Math.max(x1, w[0] + rr); y1 = Math.max(y1, w[1] + rr); }
  return [x0, y0, x1, y1];
}
const poseKey = P => Object.keys(P).map(k => P[k].toFixed(1)).join(',');
function figTrace(F, G = figGeom(F)) {
  return traceShape(`fig|${F.kind}|${F.h.toFixed(1)}|${F.dir}|${F.x.toFixed(1)}|${F.y.toFixed(1)}|${poseKey(F.P)}`, figBBox(G, F), c => { figPath(c, G, F, 0); c.fill(); }, F.h > 380 ? .5 : .8);
}
// F: {kind, P, x, y(地面), h, dir(1 向右/-1 向左), rim(颜色), a, draw(0..1 描线进度), dash, rw}
function drawFig(F) {
  const G = figGeom(F), a = F.a ?? 1; if (a <= .002 || F.h < 2) return G;
  drawFigP(F, G); return G;
}
function pen(c, x, y, col, rw = 2.5) {    // 描线的笔头：一颗亮点
  const g = c.createRadialGradient(x, y, 0, x, y, rw * 9);
  g.addColorStop(0, rgba(C.white, .95)); g.addColorStop(.18, rgba(col, .7)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, rw * 9, 0, Math.PI * 2); c.fill();
}

// ---------- 轮廓追踪：把任意填充形状画进小遮罩 → Moore 边界追踪 → 平滑 → 等距重采样（缓存） ----------
const TRC = new Map(); const MK = mk(8, 8), mkx = MK.getContext('2d', { willReadFrequently: true });
const DX8 = [1, 1, 0, -1, -1, -1, 0, 1], DY8 = [0, 1, 1, 1, 0, -1, -1, -1];
function dirOf(dx, dy) { for (let i = 0; i < 8; i++) if (DX8[i] === dx && DY8[i] === dy) return i; return 4; }
function moore(m, w, h) {
  let s = -1; for (let i = 0; i < w * h; i++) if (m[i]) { s = i; break; }
  if (s < 0) return [];
  const x0 = s % w, y0 = (s / w) | 0, at = (x, y) => x >= 0 && y >= 0 && x < w && y < h && m[y * w + x];
  let x = x0, y = y0, bd = 4; const out = [[x, y]];
  for (let it = 0; it < w * h * 2; it++) {
    let ok = false;
    for (let k = 1; k <= 8; k++) {
      const d = (bd + k) % 8, nx = x + DX8[d], ny = y + DY8[d];
      if (at(nx, ny)) { const p = (d + 7) % 8, bx = x + DX8[p], by = y + DY8[p]; x = nx; y = ny; bd = dirOf(bx - x, by - y); ok = true; break; }
    }
    if (!ok || (x === x0 && y === y0)) break;
    out.push([x, y]);
  }
  return out;
}
function smoothClosed(p, r) { const n = p.length, o = []; for (let i = 0; i < n; i++) { let sx_ = 0, sy_ = 0; for (let k = -r; k <= r; k++) { const q = p[(i + k + n) % n]; sx_ += q[0]; sy_ += q[1]; } o.push([sx_ / (2 * r + 1), sy_ / (2 * r + 1)]); } return o; }
function withLen(p) { const cum = [0]; for (let i = 1; i < p.length; i++) cum.push(cum[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); p.cum = cum; p.L = cum[cum.length - 1]; return p; }
function resample(p, step, closed = true) {
  const q = closed ? [...p, p[0]] : p; withLen(q); const n = Math.max(8, Math.round(q.L / step)), o = []; let j = 0;
  for (let i = 0; i <= n; i++) { const d = q.L * i / n; while (j < q.length - 2 && q.cum[j + 1] < d) j++; const u = (d - q.cum[j]) / Math.max(1e-6, q.cum[j + 1] - q.cum[j]); o.push([lerp(q[j][0], q[j + 1][0], u), lerp(q[j][1], q[j + 1][1], u)]); }
  return withLen(o);
}
function traceShape(key, bb, fillFn, res = .6, step = 3) {
  if (TRC.has(key)) return TRC.get(key);
  const pad = 4, w = Math.ceil((bb[2] - bb[0]) * res) + pad * 2, h = Math.ceil((bb[3] - bb[1]) * res) + pad * 2;
  MK.width = w; MK.height = h; mkx.setTransform(res, 0, 0, res, pad - bb[0] * res, pad - bb[1] * res); mkx.fillStyle = '#fff'; fillFn(mkx);
  const d = mkx.getImageData(0, 0, w, h).data, m = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) m[i] = d[i * 4 + 3] > 127 ? 1 : 0;
  let pts = moore(m, w, h).map(([x, y]) => [(x + .5 - pad) / res + bb[0], (y + .5 - pad) / res + bb[1]]);
  if (pts.length < 8) pts = [[bb[0], bb[1]], [bb[2], bb[1]], [bb[2], bb[3]], [bb[0], bb[3]]];
  pts = resample(smoothClosed(smoothClosed(pts, 2), 2), step);
  if (TRC.size > 400) TRC.clear();
  TRC.set(key, pts); return pts;
}
function polyPath(c, p, closed = false) { c.beginPath(); c.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) c.lineTo(p[i][0], p[i][1]); if (closed) c.closePath(); }
function strokePartial(c, p, u, style, lw) {   // 只描前 u 段；返回笔头位置
  if (u <= 0 || !p.length) return null; if (!p.cum) withLen(p);
  const d = p.L * clamp(u); c.beginPath(); c.moveTo(p[0][0], p[0][1]); let e = p[0];
  for (let i = 1; i < p.length; i++) {
    if (p.cum[i] >= d) { const k = (d - p.cum[i - 1]) / Math.max(1e-6, p.cum[i] - p.cum[i - 1]); e = [lerp(p[i - 1][0], p[i][0], k), lerp(p[i - 1][1], p[i][1], k)]; c.lineTo(e[0], e[1]); break; }
    c.lineTo(p[i][0], p[i][1]); e = p[i];
  }
  c.strokeStyle = style; c.lineWidth = lw; c.lineCap = 'round'; c.lineJoin = 'round'; c.stroke();
  return e;
}
function samplePts(p, n) { if (!p.cum) withLen(p); const o = []; let j = 0; for (let i = 0; i < n; i++) { const d = p.L * i / n; while (j < p.length - 2 && p.cum[j + 1] < d) j++; o.push(p[j]); } return o; }

// ---------- 文字 ----------
const FS = { serif: "'Noto Serif SC', serif", sans: "'Noto Sans SC', sans-serif", mono: "'JetBrains Mono', 'Noto Sans SC', monospace" };
const KC = { r: C.red, i: C.ice, g: C.gold, e: C.ember, w: [255, 255, 255], s: C.silver, '': [236, 233, 226] };
function parse(s) { const o = []; let k = ''; for (let i = 0; i < s.length; i++) { const ch = s[i]; if (ch === '{') { k = s[i + 1]; i += 2; continue; } if (ch === '}') { k = ''; continue; } o.push({ ch, k }); } return o; }
const plain = s => parse(s).map(x => x.ch).join('');
function measureChars(c, ch, ls) { let w = 0; const ws = ch.map(x => { const m = c.measureText(x.ch).width; w += m + ls; return m; }); return { ws, w: w - ls }; }
function splitLines(c, ch, maxW, ls) {
  const { w } = measureChars(c, ch, ls); if (w <= maxW) return [ch];
  let best = -1, bd = 1e9; const n = ch.length;
  for (let i = 1; i < n - 1; i++) if ('，：、——'.includes(ch[i].ch) && !'——'.includes(ch[i + 1]?.ch || '')) { const d = Math.abs(i + 1 - n / 2); if (d < bd) { bd = d; best = i + 1; } }
  if (best < 0 || bd > n * .3) best = Math.ceil(n / 2);
  return [ch.slice(0, best), ...splitLines(c, ch.slice(best), maxW, ls)];
}
// 一行字：逐字浮现；o = {size, font, weight, ls, t0, per, t, a, align, color(k)->rgb, glow, grad}
function drawChars(c, ch, x, y, o) {
  c.font = `${o.weight || 500} ${o.size}px ${o.font || FS.sans}`; c.textBaseline = 'middle'; c.textAlign = 'left';
  const ls = o.ls || 0, { ws, w } = measureChars(c, ch, ls); let cx = o.align === 'left' ? x : x - w / 2;
  ch.forEach((q, i) => {
    const ta = o.t0 + i * (o.per ?? .05), u = o.t === undefined ? 1 : eo(pr(o.t, ta, ta + (o.fade ?? .26))), al = (o.a ?? 1) * u;
    if (al > .003 && q.ch !== ' ') {
      const col = o.color ? o.color(q.k) : KC[q.k], yy = y + (o.rise ?? 6) * (1 - u);
      if (o.glow) { c.save(); c.shadowColor = rgba(o.glow(q.k), .7); c.fillStyle = rgba(o.glow(q.k), 1); c.globalAlpha = al * .32; c.shadowBlur = o.size * .55; c.fillText(q.ch, cx, yy); c.globalAlpha = al * .45; c.shadowBlur = o.size * .16; c.fillText(q.ch, cx, yy); c.restore(); }
      if (o.shadow) { c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = o.size * .28; c.shadowOffsetY = 2; }
      if (o.grad) { const g = c.createLinearGradient(0, yy - o.size * .5, 0, yy + o.size * .5), gs = o.grad(q.k); gs.forEach((s, j) => g.addColorStop(j / (gs.length - 1), rgba(s))); c.fillStyle = g; }
      else c.fillStyle = rgba(col);
      c.globalAlpha = al; c.fillText(q.ch, cx, yy); c.globalAlpha = 1; c.shadowBlur = 0; c.shadowOffsetY = 0; c.shadowColor = 'transparent';
    }
    cx += ws[i] + ls;
  });
  return w;
}
function textBlock(c, s, x, y, o) {    // 多行（自动断行）；返回行数
  c.font = `${o.weight || 500} ${o.size}px ${o.font || FS.sans}`;
  const ch = parse(s), lines = o.maxW ? splitLines(c, ch, o.maxW, o.ls || 0) : [ch], lh = o.lh || o.size * 1.42;
  let k = 0; lines.forEach((L, i) => { drawChars(c, L, x, y + (i - (o.anchorTop ? 0 : (lines.length - 1) / 2)) * lh, { ...o, t0: o.t0 + k * (o.per ?? .05) }); k += L.length; });
  return lines.length;
}
const GRAD_W = () => [[255, 255, 255], [238, 236, 232], [178, 182, 192]];
const GRAD_G = () => [[255, 238, 196], [247, 204, 118], [196, 132, 52]];
const GRAD_I = () => [[236, 246, 255], [160, 208, 255], [92, 146, 210]];
