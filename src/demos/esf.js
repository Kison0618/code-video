'use strict';
// 《ESFJ》主角：16P 官网 ESFJ（执政官，网友叫「伞哥 / 蛋糕哥」）77 块多边形，拆成
//   头 / 伞 / 托蛋糕的右臂(上臂+前臂+蛋糕) / 抱书的手 / 两条腿，按关节转
//   EF.hero(ctx, x, y, s, o)  x,y = 两脚中间的地面；s=1 时身高约 585px
//   o: a, flip, lean, nod, tilt, eyes('open'|'closed'|'happy'|'wide'|'squint'), mouth('grin'|'flat'|'o'|'frown'|'smile'),
//      rs(右肩) re(右肘) um(伞转角) umbrella(false=收伞) cake(false=不拿蛋糕) book(false) bk(抱书手转角)
//      hipB(后腿) hipF(前腿) bob, dim, warm, gray, glow(0-1 胸口暖光), look:[dx,dy], brow
//   返回关键点：hand(蛋糕手) cake head top face mouth chest eyeL eyeR umb(伞尖) book
const fs = require('fs');
const { Path2D } = require('skia-canvas');
const K = require('../core');
const { mix } = K;
const RAW = JSON.parse(fs.readFileSync((process.env.INFP_DATA ? process.env.INFP_DATA + '/chars16/' : 'F:/AI/lianai/07_INFJ/素材_表情包/05_16型角色/') + 'esfj-male.json', 'utf8'));
const hex = h => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(c => c + c).join(''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; };
const ID = (...a) => new Set(a);
const HEAD = ID(2, 24, 25, 26, 27, 28, 29, 30, 32, 33, 34, 35, 54, 55, 56, 57, 73, 74, 75);
const UMB = ID(3, 4, 5, 6, 7, 8, 9, 10);
const RUP = ID(18), RFORE = ID(19, 20), CAKE = ID(36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53);
const BOOK = ID(23, 58, 59, 60, 61, 62, 63, 64, 65, 66);
const LEGB = ID(1, 11, 12, 13, 14), LEGF = ID(15, 16, 17, 76), SHADOW = ID(0);
const EYES = ID(73, 74), MOUTH = ID(34, 35), FLAME = ID(43, 45, 47, 49);
const PIV = { head: [207, 165], um: [160, 106], rs: [270, 182], re: [267, 258], bk: [160, 232], hb: [72, 215], hf: [110, 330] };
const FOOT = [150, 394], H0 = 394;
const POLY = RAW.map((p, i) => {
  const o = { i, c: /^#/.test(p.fill || '') ? hex(p.fill) : [0, 0, 0], op: p.op == null ? 1 : p.op };
  if (p.pts) o.pts = p.pts; else o.path = new Path2D(p.d);
  o.part = HEAD.has(i) ? 'head' : UMB.has(i) ? 'umb' : RUP.has(i) ? 'rup' : RFORE.has(i) ? 'rfore' : CAKE.has(i) ? 'cake' : BOOK.has(i) ? 'book' : LEGB.has(i) ? 'legb' : LEGF.has(i) ? 'legf' : SHADOW.has(i) ? 'shadow' : 'body';
  return o;
});
// 眼睛中心（路径块的包围盒中心，启动时算一次）
const EYEC = {};
for (const p of POLY) if (p.path) { const b = p.path.bounds; EYEC[p.i] = [(b.left + b.right) / 2, (b.top + b.bottom) / 2]; }
const rotAbout = (p, c, r) => { const cs = Math.cos(r), sn = Math.sin(r), dx = p[0] - c[0], dy = p[1] - c[1]; return [c[0] + dx * cs - dy * sn, c[1] + dx * sn + dy * cs]; };

function hero(ctx, x, y, s, o = {}) {
  const { a = 1, flip = false, lean = 0, nod = 0, tilt = 0, eyes = 'open', mouth = 'grin', rs = 0, re = 0, um = 0, bk = 0,
    umbrella = true, cake = true, book = true, hipB = 0, hipF = 0, bob = 0, dim = 0, warm = 0, gray = 0, glow = 0, look = [0, 0], brow = 0, flame = true } = o;
  const k = s * 585 / H0;
  const re2 = rotAbout(PIV.re, PIV.rs, rs);
  const T = {
    head: p => rotAbout(p, PIV.head, nod * 0.18 + tilt * 0.12),
    umb: p => rotAbout(p, PIV.um, um),
    rup: p => rotAbout(p, PIV.rs, rs),
    rfore: p => rotAbout(rotAbout(p, PIV.rs, rs), re2, re),
    cake: p => rotAbout(rotAbout(p, PIV.rs, rs), re2, re),
    book: p => rotAbout(p, PIV.bk, bk),
    legb: p => rotAbout(p, PIV.hb, hipB), legf: p => rotAbout(p, PIV.hf, hipF),
    body: p => p, shadow: p => p,
  };
  const cl = Math.cos(lean), sl = Math.sin(lean);
  const W2 = (part, p) => {
    let [px, py] = T[part](p);
    if (part !== 'shadow' && part !== 'legb' && part !== 'legf') py -= bob;
    let X = (px - FOOT[0]) * k * (flip ? -1 : 1), Y = (py - FOOT[1]) * k;
    if (part !== 'shadow') { const X2 = X * cl - Y * sl, Y2 = X * sl + Y * cl; X = X2; Y = Y2; }
    return [x + X, y + Y];
  };
  const out = {
    hand: W2('rfore', [340, 212]), cake: W2('cake', [344, 160]), head: W2('head', [250, 90]), top: W2('head', [240, 10]),
    face: W2('head', [262, 100]), mouth: W2('head', [252, 136]), chest: W2('body', [190, 200]), umb: W2('umb', [117, 4]),
    book: W2('book', [185, 260]), eyeL: W2('head', EYEC[73] || [251, 88]), eyeR: W2('head', EYEC[74] || [282, 96]), k,
  };
  if (a <= 0.003) return out;
  ctx.save(); ctx.globalAlpha *= a;
  const base = ctx.globalAlpha;
  const fillC = c => {
    if (gray > 0) c = mix(c, [128, 130, 134], gray);
    if (warm > 0) c = mix(c, [255, 222, 170], warm * 0.35);
    if (dim > 0) c = mix(c, [14, 18, 26], dim);
    return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
  };
  const order = ['shadow', 'umb', 'legb', 'legf', 'body', 'book', 'head', 'rup', 'rfore', 'cake'];
  for (const part of order) {
    if (part === 'umb' && !umbrella) continue;
    if (part === 'cake' && !cake) continue;
    if (part === 'book' && !book) continue;
    for (const p of POLY) {
      if (p.part !== part) continue;
      if (EYES.has(p.i) && eyes !== 'open' && eyes !== 'wide') continue;
      if (MOUTH.has(p.i) && mouth !== 'grin') continue;
      if (FLAME.has(p.i) && !flame) continue;
      ctx.globalAlpha = base * p.op * (part === 'shadow' ? 0.8 : 1);
      ctx.fillStyle = fillC(p.c);
      if (p.pts) { ctx.beginPath(); p.pts.forEach((q, j) => { const [X, Y] = W2(part, q); j ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y); }); ctx.closePath(); ctx.fill(); }
      else {
        const o0 = W2(part, [0, 0]), o1 = W2(part, [1, 0]), o2 = W2(part, [0, 1]);
        ctx.save(); ctx.transform(o1[0] - o0[0], o1[1] - o0[1], o2[0] - o0[0], o2[1] - o0[1], o0[0], o0[1]);
        if (EYES.has(p.i) && (eyes === 'wide' || look[0] || look[1])) {
          const c = EYEC[p.i], sc = eyes === 'wide' ? 1.5 : 1;
          ctx.translate(c[0] + look[0] * 3, c[1] + look[1] * 2); ctx.scale(sc, sc); ctx.translate(-c[0], -c[1]);
        }
        ctx.fill(p.path); ctx.restore();
      }
    }
  }
  ctx.globalAlpha = base;
  if (glow > 0) { // 胸口暖光（被需要时整个人亮起来）
    const c = out.chest, R = 160 * k * (0.6 + glow * 0.6);
    const g = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], R);
    g.addColorStop(0, `rgba(255,214,140,${0.28 * glow})`); g.addColorStop(1, 'rgba(255,214,140,0)');
    ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(c[0], c[1], R, 0, Math.PI * 2); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
  }
  const ink = fillC([43, 43, 43]);
  ctx.strokeStyle = ink; ctx.lineCap = 'round'; ctx.lineWidth = 2.4 * k;
  if (eyes === 'closed' || eyes === 'happy' || eyes === 'squint') for (const e of [out.eyeL, out.eyeR]) {
    ctx.beginPath();
    if (eyes === 'happy') ctx.arc(e[0], e[1] + 2 * k, 4.5 * k, Math.PI * 1.15, Math.PI * 1.85);
    else if (eyes === 'squint') { ctx.moveTo(e[0] - 5 * k, e[1]); ctx.lineTo(e[0] + 5 * k, e[1]); }
    else ctx.arc(e[0], e[1] - 2 * k, 4.5 * k, Math.PI * 0.15, Math.PI * 0.85);
    ctx.stroke();
  }
  const M = out.mouth;
  if (mouth !== 'grin') {
    ctx.fillStyle = fillC([120, 70, 55]); ctx.strokeStyle = fillC([120, 70, 55]); ctx.lineWidth = 2.6 * k;
    if (mouth === 'flat') { ctx.beginPath(); ctx.moveTo(M[0] - 10 * k, M[1]); ctx.lineTo(M[0] + 10 * k, M[1]); ctx.stroke(); }
    else if (mouth === 'o') { ctx.beginPath(); ctx.ellipse(M[0], M[1], 4.5 * k, 5.5 * k, 0, 0, Math.PI * 2); ctx.fill(); }
    else if (mouth === 'frown') { ctx.beginPath(); ctx.arc(M[0], M[1] + 6 * k, 9 * k, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
    else if (mouth === 'smile') { ctx.beginPath(); ctx.arc(M[0], M[1] - 6 * k, 10 * k, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); }
  }
  if (brow) {
    ctx.strokeStyle = fillC([60, 60, 60]); ctx.lineWidth = 3.2 * k;
    for (const [e, d] of [[out.eyeL, 1], [out.eyeR, -1]]) { ctx.beginPath(); ctx.moveTo(e[0] - 7 * k * d, e[1] - 12 * k); ctx.lineTo(e[0] + 6 * k * d, e[1] - 12 * k + 4 * k * brow); ctx.stroke(); }
  }
  ctx.restore();
  return out;
}
module.exports = { hero, PIV };
