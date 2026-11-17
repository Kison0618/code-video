'use strict';
// ESFJ v9 第 6 章「结尾」：G01–G04 + 片尾关注卡。雨夜街头的公交站
//   G01 被需要也被看见：深夜，还是那个下雨的公交站。这次只有他一个人，撑着伞等车；他手里提满了别人的东西（便当袋、围巾、给别人买的药），自己肩膀湿了一半
//   G02 一直在付出，希望有人放在心上：他把伞往旁边一个淋雨的路人那边歪过去，自己整个露在雨里；路人走了，没回头。网友原话上屏。他低头看看自己湿掉的鞋（停）
//   G03 别吝啬一句谢谢：一个人撑着伞走进来（第 4 章被他照顾过的同事），站到他旁边，把一杯冒热气的杯子递到他手边，杯子上贴着便签「谢谢你」——
//       他愣一下，接过来，身上的冷色一点点退掉，胸口亮起来；她把自己那把伞举到他头顶
//   G04 你身边有这样的 ESFJ 吗：镜头升起来，越过候车亭，整条街的窗一扇扇亮起暖光；最后他们俩那一小圈暖光在雨夜里最亮
//   片尾：金色粒子聚成「关注依恋研究室 / 了解更多心理知识」（照 v8 轻量版），4 秒，导出 END
const X = require('./ehk');
const S = require('./ESS_kit');
const PR = require('./ESS_props');
const QT = require('./ESS_quote');
const A = require('./ESS_A');
const { K, L, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('G01') - 0.9, g01: vs('G01'), need: at('G01', '被需要'), seen: at('G01', '被看见'), g02: vs('G02'), give: at('G02', '一直'), heart: at('G02', '放在心上'), g02e: ve('G02'), g03: vs('G03'), thank: at('G03', '谢谢'), g03e: ve('G03'), g04: vs('G04'), g04e: ve('G04') };
const TC = T.g04e + 0.6, END = TC + 4.0;
const GY = 1250, LAMP = [980, 300], SODIUM = [255, 186, 110], COOL = [200, 226, 255];
const shelterDraw = (ctx, t) => {};
function draw(ctx, t) {
  const C = S.camKF(t, [[T.in, { x: 140, y: -60, z: 1.55, ax: 540, ay: 1000 }], [T.need + 0.6, { x: 110, y: -40, z: 1.32 }], [T.g02 + 0.2, { x: 40, y: -40, z: 1.2 }], [T.g02e + 1.0, { x: 120, y: -60, z: 1.45 }],
    [T.g03 + 0.4, { x: 20, y: -40, z: 1.22 }], [T.g03e + 0.6, { x: 20, y: -60, z: 1.3 }], [T.g04 + 0.2, { x: 0, y: -40, z: 1.1 }], [TC, { x: 0, y: -900, z: 0.62 }], [END, { x: 0, y: -980, z: 0.6 }]]);
  ctx.fillStyle = 'rgb(10,12,28)'; ctx.fillRect(0, 0, W, H);
  // 背景、楼、雨夜的街：直接复用第 0 章的场景（同一个公交站）
  const thanks = smooth(prog(t, T.thank - 0.2, T.thank + 0.8)), city = smooth(prog(t, T.g04 - 0.2, TC));
  A.scene(ctx, t, C, { ad: 1, city, myWin: 1 });
  ctx.save(); S.cam(ctx, C, 1);
  // 路人（G02）：在他左边淋雨，被他的伞遮住，然后走开没回头
  const tilt = smooth(prog(t, T.give - 0.3, T.give + 0.5)) * (1 - smooth(prog(t, T.g03 + 0.4, T.thank))), pa = K.vis(t, T.g02 - 0.3, T.g02e + 0.4, 0.4, 0.8), pleave = easeIn(prog(t, T.heart - 0.2, T.g02e + 0.4));
  if (pa > 0.01) S.lit(ctx, c => MB.person(c, 'estp-male', 340 - pleave * 700, GY, 2.3, { a: pa, flip: pleave > 0, bob: Math.abs(Math.sin(pleave * Math.PI * 5)) * 8 * (pleave > 0 && pleave < 1 ? 1 : 0) }), { light: LAMP, at: [420, GY - 300], r: 340, warm: [255, 214, 160], cool: [20, 20, 50], k: 0.9 });
  // 女孩（G03）：撑伞走进来，递杯子
  const gIn = easeOut(prog(t, T.g03 - 0.4, T.g03 + 0.9)), gx = lerp(-200, 360, gIn), giveCup = easeInOut(prog(t, T.thank - 0.8, T.thank - 0.1)), cover = smooth(prog(t, T.g03e - 0.6, T.g03e + 0.3));
  // 他
  const lonely = smooth(prog(t, T.need - 0.3, T.g02)) * (1 - thanks), wet = smooth(prog(t, T.give, T.heart + 0.6)) * (1 - thanks);
  const o = { t, flip: true, warm: 0.0, umbrella: t < T.g03e - 0.6, um: 0.9 * tilt, cake: false, book: false, rs: -1.3 * giveCup * 0 - 1.1 * thanks, re: -0.4 * thanks, eyes: thanks > 0.5 ? 'happy' : lonely > 0.4 ? 'closed' : 'open', mouth: thanks > 0.4 ? 'grin' : 'flat', nod: 0.5 * lonely + 0.2 * wet, gray: 0.35 * wet + 0.25 * lonely, glow: 0.25 * thanks, look: [0, 1.2 * wet] };
  const R = S.lit(ctx, c => ES.hero(c, 700, GY, 1.06, o), { light: thanks > 0.3 ? [420, 900] : LAMP, at: [700, GY - 300], r: 340, warm: thanks > 0.3 ? [240, 190, 140] : [226, 232, 255], cool: [14, 16, 44], k: 0.95, tint: thanks > 0.05 ? [[150, 90, 60], 0.12 * thanks] : null });
  // 他手上提满的东西（G01）
  const bags = 1 - smooth(prog(t, T.g03 + 0.4, T.thank - 0.6));
  if (bags > 0.01) { PR.bag(ctx, 830, GY - 30, 0.6, { a: bags }); PR.lunchbox(ctx, 590, GY - 20, 0.6, { lid: 1, a: bags }); }
  // 湿掉的肩膀：雨点打在他身上（G02）
  if (wet > 0.01) S.add(ctx, () => { for (let k = 0; k < 10; k++) { const ph = (t * 2.4 + hash(k * 2.9)) % 1; glow(ctx, R.top[0] - 80 + hash(k * 8.3 + Math.floor(t * 2.4 + hash(k * 2.9))) * 160, R.top[1] + 40 + hash(k * 1.7) * 300 - ph * 20, 16 * (1 - ph) + 5, [220, 232, 255], 0.8 * (1 - ph) * wet); } });
  if (gIn > 0.01) { const GP = S.lit(ctx, c => MB.person(c, 'isfp-female', gx, GY, 2.5, { warm: 0.4, bob: Math.abs(Math.sin(gIn * Math.PI * 4)) * 8 * (gIn < 1 ? 1 : 0) }), { light: LAMP, at: [gx, GY - 300], r: 340, warm: [255, 214, 160], cool: [20, 20, 50], k: 0.95 });
    // 她的伞：先撑在自己头上 → 举到他头顶
    const ux = lerp(gx + 40, 620, cover), uy = lerp(GY - 640, GY - 700, cover); ctx.save(); ctx.translate(ux, uy); ctx.rotate(lerp(0, -0.25, cover)); const g = ctx.createLinearGradient(-240, 0, 240, 0); g.addColorStop(0, 'rgb(150,40,50)'); g.addColorStop(0.5, 'rgb(230,90,90)'); g.addColorStop(1, 'rgb(140,40,50)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-250, 60); ctx.quadraticCurveTo(-200, -110, 0, -130); ctx.quadraticCurveTo(200, -110, 250, 60); for (let k = 5; k >= 0; k--) ctx.quadraticCurveTo(-250 + (k + 0.5) * 83, 30, -250 + k * 83, 60); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgb(80,30,40)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -130); ctx.lineTo(0, 240); ctx.stroke(); ctx.restore();
    // 杯子 + 便签
    const cx = lerp(GP.chest[0] + 90, R.hand[0] - 10, giveCup), cy = lerp(GP.chest[1] + 40, R.hand[1] + 30, giveCup); PR.mug(ctx, cx, cy, 0.68, t, { c: [240, 130, 96], hot: 1 - 0.7 * giveCup });
    ctx.save(); ctx.translate(cx + 30, cy - 70); ctx.rotate(0.12); ctx.fillStyle = 'rgb(255,236,140)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 8; ctx.fillRect(-56, -40, 112, 80); ctx.shadowColor = 'transparent'; K.text(ctx, '谢谢你', 0, 12, { size: 32, weight: 700, color: [160, 70, 50] }); ctx.restore();
    if (thanks > 0.01) S.add(ctx, () => { glow(ctx, 540, GY - 500, 900, [255, 190, 120], 0.12 * thanks); }); }
  // 心跳一下（G03 接过杯子那一刻）
  { const p = prog(t, T.thank + 0.2, T.thank + 1.8); if (p > 0 && p < 1) S.ring(ctx, R.chest[0], R.chest[1], 160 + p * 560, 30, [255, 214, 150], 0.3 * (1 - p)); }
  ctx.restore();
  S.rain(ctx, t, { a: 0.85 * (1 - 0.3 * city), n: 110 });
  // 片尾暗下来
  const card = smooth(prog(t, TC, TC + 1.2)); if (card > 0.003) { ctx.fillStyle = `rgba(4,5,14,${0.55 * card})`; ctx.fillRect(0, 0, W, H); }
  if (t > TC) { const Q = targets(); LINES.forEach((Ln, i) => gatherLite(ctx, Q[i], Ln, t)); }
  return { C };
}
// ================= 片尾：金色粒子聚字（照 v8 轻量版） =================
const LINES = [
  { str: '关注依恋研究室', y: 820, size: 96, weight: 600, spacing: 0.14, col: [255, 208, 128], t0: TC + 0.15, step: 3, n: 900 },
  { str: '了解更多心理知识', y: 940, size: 56, weight: 500, spacing: 0.3, col: [255, 228, 180], t0: TC + 0.5, step: 2, n: 520 },
];
let TG = null;
function targets() {
  if (TG) return TG;
  TG = LINES.map((Ln, li) => {
    const cv = new K.Canvas(W, 260), c = cv.getContext('2d');
    K.text(c, Ln.str, W / 2, 190, { size: Ln.size, weight: Ln.weight, spacing: Ln.spacing, color: [255, 255, 255] });
    const d = c.getImageData(0, 0, W, 260).data, pts = [];
    for (let yy = 0; yy < 260; yy += Ln.step) for (let xx = 0; xx < W; xx += Ln.step) if (d[(yy * W + xx) * 4 + 3] > 128) pts.push([xx, yy - 190 + Ln.y]);
    const r = mulberry32(91 + li), n = Math.min(Ln.n, pts.length), out = [];
    for (let i = 0; i < n; i++) { const [x, y] = pts.splice(Math.floor(r() * pts.length), 1)[0]; out.push({ x, y, sx: r() * W, sy: lerp(1200, 1900, r()), dl: (x / W) * 0.35 + r() * 0.35, cu: r() - 0.5, ph: r() * 6.28, sz: 0.7 + r() * 0.6 }); }
    return out;
  });
  return TG;
}
function gatherLite(ctx, Q, Ln, t) {
  const age = t - Ln.t0; if (age < 0) return;
  const NB = 6, core = Array.from({ length: NB }, () => []), halo = Array.from({ length: NB }, () => []);
  for (const q of Q) {
    const f = easeInOut(prog(age, q.dl, q.dl + 1.25)), dx = q.x - q.sx, dy = q.y - q.sy, Lq = Math.hypot(dx, dy) || 1, curl = Math.sin(f * Math.PI) * 160 * q.cu;
    const x = lerp(q.sx, q.x, f) - dy / Lq * curl + Math.sin(t * 1.3 + q.ph) * 3 * (1 - f), y = lerp(q.sy, q.y, f) + dx / Lq * curl;
    const a = (0.3 + 0.7 * f) * (1 - 0.65 * smooth(prog(age, 1.7, 2.4))) * (0.8 + 0.2 * Math.sin(t * 9 + q.ph)); if (a < 0.03) continue;
    const b = Math.min(NB - 1, Math.floor(a * NB)); core[b].push(x, y, (f > 0.95 ? 1.7 : 2.4) * q.sz); if (f < 0.97) halo[b].push(x, y, 5 * q.sz);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const hc = mix(Ln.col, [255, 150, 70], 0.3), cc = mix(Ln.col, [255, 255, 240], 0.35);
  for (let b = 0; b < NB; b++) { const al = (b + 0.5) / NB; for (const [arr, c, k] of [[halo[b], hc, 0.16], [core[b], cc, 0.95]]) { if (!arr.length) continue; ctx.fillStyle = rgba(c, al * k); ctx.beginPath(); for (let i = 0; i < arr.length; i += 3) { ctx.moveTo(arr[i] + arr[i + 2], arr[i + 1]); ctx.arc(arr[i], arr[i + 1], arr[i + 2], 0, 6.283); } ctx.fill(); } }
  ctx.restore();
  const fl = age > 1.1 ? Math.exp(-(age - 1.1) * 4) : 0; if (fl > 0.02) glow(ctx, W / 2, Ln.y - Ln.size * 0.35, Ln.size * 4, mix(Ln.col, [255, 255, 255], 0.4), 0.22 * fl);
}
function over(ctx, t) {
  QT.draw(ctx, t);
  for (const Ln of LINES) { const real = smooth(prog(t, Ln.t0 + 1.35, Ln.t0 + 1.9)); if (real > 0.003) L.rich(ctx, Ln.str, W / 2, Ln.y, { size: Ln.size, weight: Ln.weight, spacing: Ln.spacing, color: [255, 246, 228], keys: [Ln.str], keyColor: Ln.col, alpha: real, glowKey: 0.55 }); }
}
module.exports = { draw, over, T, END };
