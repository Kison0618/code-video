'use strict';
// PWG2 第二幕「雨夜的街」：B05–B06。镜头从山崖扎进城市，落在一条下着小雨的老街上，沿街向右横移
//   B05 三盏路灯下三件正在发生的事（不是三颗球）：
//       ① 情感共鸣：路灯下一个垂着头的陌生人，她站到旁边，两个人胸口的心跳光圈从各跳各的变成同频，她也掉了一滴泪，对方身上的冷色被暖回来
//       ② 慈善：雨里淋着的老人，她把伞整个倾过去，自己半边肩膀露在雨里
//       ③ 真实可信：古董店门口一面大镜子，她把笑脸面具从脸上拿下来，镜子里是她本来的样子
//       说到「三大自我形象」镜头拉远，三盏灯下三件事同框
//   B06 街口：路牌上写着「捷径 / 大家都走这边 / 标准答案」，她闭上眼，胸口飘出一条光绸（直觉）绕过路牌，引向一座缠着花藤的拱门；
//       说到「渴望浪漫」，光绸经过的地方花一朵朵开、串灯一盏盏亮，她睁眼笑着走进去
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const { K, GOLD, LIME, PINK, BLUE, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, rgba, mix, hash, mulberry32 } = K;

const GY = 1250, X1 = 540, X2 = 1300, X3 = 2060, X4 = 3100, ARCH = X4 + 500, WARM = [255, 206, 140];
const T = { in: vs('B05') - 0.3, v1: vs('B05'), v2: at('B05', '慈善'), v3: at('B05', '真实'), tri: at('B05', '三大'), b06: vs('B06'), intu: at('B06', '直觉'), rom: at('B06', '渴望'), end: ve('B06') + 0.25 };
const Z = 1.3;
const CAM = [
  [T.in, { x: X1 - 540, y: 0, z: Z * 0.9, ax: W / 2, ay: GY }], [T.v2 - 0.12, { x: X1 - 540 + 20, z: Z }], [T.v2 + 0.22, { x: X2 - 540, z: Z }], [T.v3 - 0.12, { x: X2 - 540 + 20, z: Z * 1.03 }],
  [T.v3 + 0.22, { x: X3 - 540 + 60, z: Z }], [T.tri - 0.15, { x: X3 - 540 + 80, z: Z * 1.04 }], [T.tri + 0.45, { x: X2 - 540, z: 0.47 }], [T.b06 - 0.35, { x: X2 - 540 + 30, z: 0.46 }],
  [T.b06 + 0.6, { x: X4 - 540 - 60, z: 1.1 }], [T.rom, { x: X4 - 540 + 60, z: 1.12 }], [T.end - 0.1, { x: ARCH - 540 - 60, z: 1.6 }, easeIn],
];
// ---------- 预渲：天、远处高楼、沿街店铺 ----------
const SKY = S.lazy(() => S.bake(W, H, c => {
  S.vgrad(c, [[0, [8, 10, 30]], [0.4, [26, 24, 66]], [0.62, [70, 48, 96]], [0.75, [120, 78, 104]], [1, [40, 30, 60]]], 0, H, 0, W);
  S.clouds(c, 12, [-100, 200, W + 100, 700], 8, [120, 110, 190], 0.14, [220, 520]);
}));
const FARW = 2160;
const FAR = S.lazy(() => S.bake(FARW, 1300, c => {
  const r = mulberry32(64);
  for (let L = 0; L < 2; L++) for (let i = 0; i < 26; i++) {
    const w = 70 + r() * 130, h = (L ? 300 : 520) + r() * (L ? 420 : 620), x = (i / 26) * FARW + r() * 40, col = L ? [30, 28, 70] : [52, 44, 100];
    const g = c.createLinearGradient(0, 1300 - h, 0, 1300); g.addColorStop(0, rgba(mix(col, [120, 90, 150], 0.25))); g.addColorStop(1, rgba(mix(col, [150, 96, 130], 0.5)));
    c.fillStyle = g; c.fillRect(x, 1300 - h, w, h); c.fillStyle = 'rgba(0,0,10,0.25)'; c.fillRect(x + w * 0.62, 1300 - h, w * 0.38, h);
    if (r() < 0.4) c.fillRect(x + w * 0.4, 1300 - h - 40, 6, 40);
    S.add(c, () => { const wc = [[255, 200, 130], [255, 226, 180], [150, 220, 240]][(r() * 3) | 0]; for (let yy = 1300 - h + 16; yy < 1290; yy += 22) for (let xx = x + 8; xx < x + w - 12; xx += 17) if (r() < (L ? 0.3 : 0.2)) { c.fillStyle = rgba(wc, 0.35 + r() * 0.5); c.fillRect(xx, yy, 9, 11); } });
  }
  S.vgrad(c, [[0, [150, 100, 140], 0], [1, [150, 100, 140], 0.55]], 700, 1300, 0, FARW);
}));
const SHOPS = [['茶', [70, 52, 96]], ['花店', [44, 70, 96]], ['书店', [96, 58, 62]], ['面包房', [56, 60, 104]], ['唱片', [72, 60, 84]], ['咖啡', [40, 64, 84]], ['古董', [84, 56, 76]], ['画廊', [50, 58, 100]], ['杂货', [90, 62, 60]], ['邮局', [48, 68, 92]]];
const BLD = (() => { const r = mulberry32(8), o = []; let x = -900; for (let i = 0; x < X4 + 60; i++) { const w = 430 + r() * 170, h = 800 + r() * 380; o.push({ x, w, h, i }); x += w + 6; } return o; })();
const BIMG = BLD.map(b => S.lazy(() => S.bake(Math.ceil(b.w), Math.ceil(b.h) + 10, c => {
  const r = mulberry32(100 + b.i), [name, col] = SHOPS[b.i % SHOPS.length], w = b.w, h = b.h + 10, sh = 340;   // sh：底层店面高度
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, rgba(mix(col, [10, 10, 30], 0.55))); g.addColorStop(0.7, rgba(col)); g.addColorStop(1, rgba(mix(col, [255, 190, 130], 0.22)));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const gs = c.createLinearGradient(0, 0, w, 0); gs.addColorStop(0, 'rgba(255,255,255,0.05)'); gs.addColorStop(1, 'rgba(0,0,20,0.28)'); c.fillStyle = gs; c.fillRect(0, 0, w, h);
  c.fillStyle = rgba(mix(col, [200, 180, 220], 0.3)); c.fillRect(-4, 0, w + 8, 22); c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(0, 22, w, 10);
  // 楼上的窗：有的亮着暖灯、拉着帘，有的黑着映着天
  const cols = Math.floor((w - 60) / 130), fl = Math.floor((h - sh - 80) / 190), x0 = (w - cols * 130 + 40) / 2;
  for (let j = 0; j < fl; j++) for (let i = 0; i < cols; i++) {
    const wx = x0 + i * 130, wy = 60 + j * 190, on = r() < 0.5;
    c.fillStyle = rgba(mix(col, [0, 0, 0], 0.5)); c.fillRect(wx - 8, wy - 8, 106, 146);
    if (on) { const wg = c.createLinearGradient(0, wy, 0, wy + 130); const wc = r() < 0.75 ? [255, 200, 120] : [190, 220, 255]; wg.addColorStop(0, rgba(mix(wc, [255, 255, 255], 0.3))); wg.addColorStop(1, rgba(mix(wc, [200, 90, 60], 0.35))); c.fillStyle = wg; c.fillRect(wx, wy, 90, 130);
      c.fillStyle = 'rgba(120,50,40,0.35)'; c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + 34, wy); c.quadraticCurveTo(wx + 26, wy + 70, wx, wy + 110); c.fill(); c.beginPath(); c.moveTo(wx + 90, wy); c.lineTo(wx + 56, wy); c.quadraticCurveTo(wx + 64, wy + 70, wx + 90, wy + 110); c.fill();
      S.add(c, () => glow(c, wx + 45, wy + 65, 150, wc, 0.2)); }
    else { const wg = c.createLinearGradient(0, wy, 0, wy + 130); wg.addColorStop(0, 'rgb(40,44,90)'); wg.addColorStop(1, 'rgb(18,20,48)'); c.fillStyle = wg; c.fillRect(wx, wy, 90, 130); }
    c.fillStyle = rgba(mix(col, [0, 0, 0], 0.5)); c.fillRect(wx + 42, wy, 6, 130); c.fillRect(wx - 12, wy + 130, 114, 12);
    if (r() < 0.35) for (let k = 0; k < 5; k++) { c.fillStyle = rgba([50 + r() * 40, 120 + r() * 50, 90], 0.9); c.beginPath(); c.arc(wx + 10 + k * 18, wy + 128, 12 + r() * 6, 0, 6.2832); c.fill(); }
  }
  // 店面：大橱窗里是暖光和货架，上面条纹雨棚和招牌
  const sy = h - sh, ww = w - 190;
  c.fillStyle = rgba(mix(col, [0, 0, 0], 0.45)); c.fillRect(0, sy, w, sh);
  const wg = c.createLinearGradient(0, sy + 70, 0, h - 30); wg.addColorStop(0, 'rgb(255,226,160)'); wg.addColorStop(1, 'rgb(236,150,90)'); c.fillStyle = wg; c.fillRect(34, sy + 90, ww, sh - 130);
  for (let j = 0; j < 3; j++) { c.fillStyle = 'rgba(110,60,40,0.55)'; c.fillRect(34, sy + 150 + j * 60, ww, 8); for (let k = 0; k < ww / 26; k++) { c.fillStyle = rgba([120 + r() * 120, 70 + r() * 110, 60 + r() * 120], 0.6); const bh = 20 + r() * 26; c.fillRect(40 + k * 26, sy + 150 + j * 60 - bh, 18, bh); } }
  c.fillStyle = rgba(mix(col, [0, 0, 0], 0.6)); c.fillRect(34 + ww / 2 - 5, sy + 90, 10, sh - 130);
  const dg = c.createLinearGradient(0, sy + 90, 0, h); dg.addColorStop(0, 'rgb(250,206,140)'); dg.addColorStop(1, 'rgb(190,110,70)'); c.fillStyle = dg; c.beginPath(); c.roundRect(w - 132, sy + 96, 96, sh - 96, [46, 46, 0, 0]); c.fill();
  c.fillStyle = 'rgba(60,30,30,0.6)'; c.fillRect(w - 88, sy + 96, 8, sh - 96);
  const aw = [[230, 96, 90], [240, 190, 110], [90, 160, 150], [200, 120, 170]][b.i % 4];
  for (let k = 0; k < (ww + 40) / 44; k++) { c.fillStyle = rgba(k % 2 ? aw : [246, 236, 220]); c.beginPath(); c.moveTo(18 + k * 44, sy + 40); c.lineTo(18 + k * 44 + 44, sy + 40); c.lineTo(8 + k * 44 + 46, sy + 98); c.arc(8 + k * 44 + 23, sy + 98, 23, 0, Math.PI); c.closePath(); c.fill(); }
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(18, sy + 40, ww + 40, 8);
  c.fillStyle = 'rgb(40,26,40)'; c.beginPath(); c.roundRect(w / 2 - 130, sy - 44, 260, 76, 12); c.fill();
  S.add(c, () => { glow(c, w / 2, sy - 6, 240, aw, 0.35); glow(c, 34 + ww / 2, sy + 220, 420, WARM, 0.3); });
  K.text(c, name, w / 2, sy + 14, { size: 52, weight: 500, color: mix(aw, [255, 250, 230], 0.6), spacing: name.length > 2 ? 0.1 : 0.5 });
})));
// 路灯的光锥（预渲一张）
const CONE = S.lazy(() => S.bake(900, 900, c => { c.filter = 'blur(26px)'; const g = c.createLinearGradient(0, 40, 0, 860); g.addColorStop(0, 'rgba(255,220,160,0.5)'); g.addColorStop(1, 'rgba(255,220,160,0.05)'); c.fillStyle = g; S.poly(c, [[410, 40], [490, 40], [860, 860], [40, 860]]); c.fill(); }));
function lamp(ctx, x, t, k = 1) {
  const hy = GY - 770;
  S.add(ctx, () => { ctx.globalAlpha = 0.9 * k; ctx.drawImage(CONE(), x - 450, hy - 20, 900, 800); ctx.globalAlpha = 1; S.rgrad(ctx, x, GY + 6, 470, [[0, WARM, 0.5 * k], [1, WARM, 0]], 0.18); });
  const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0); g.addColorStop(0, 'rgb(34,30,50)'); g.addColorStop(0.5, 'rgb(86,76,104)'); g.addColorStop(1, 'rgb(24,22,40)');
  ctx.fillStyle = g; ctx.fillRect(x - 8, hy + 30, 16, GY - hy - 30); ctx.beginPath(); ctx.roundRect(x - 22, GY - 90, 44, 90, 8); ctx.fill();
  S.poly(ctx, [[x - 40, hy + 34], [x + 40, hy + 34], [x + 26, hy - 30], [x - 26, hy - 30]], 'rgba(255,226,170,0.9)'); S.poly(ctx, [[x - 52, hy - 30], [x + 52, hy - 30], [x, hy - 70]], 'rgb(50,44,70)'); ctx.fillStyle = 'rgb(50,44,70)'; ctx.fillRect(x - 46, hy + 30, 92, 10);
  S.add(ctx, () => { glow(ctx, x, hy + 6, 210, WARM, 0.6 * k); glow(ctx, x, hy + 4, 60, [255, 250, 230], 0.7 * k); });
}
// ---------- 街道世界 ----------
function world(ctx, t, C) {
  ctx.drawImage(SKY(), 0, 0);
  ctx.save(); S.cam(ctx, C, 0.2); for (let k = 0; k <= 1; k++) ctx.drawImage(FAR(), -700 + k * FARW, GY - 1300 + 40); ctx.restore();
  // 沿街店铺 + 湿地面上的倒影
  ctx.save(); S.cam(ctx, C, 1);
  const vx0 = C.x + W / 2 - (W / 2 + 200) / C.z, vx1 = C.x + W / 2 + (W / 2 + 200) / C.z;
  for (let i = 0; i < BLD.length; i++) { const b = BLD[i]; if (b.x + b.w < vx0 || b.x > vx1) continue; ctx.drawImage(BIMG[i](), b.x, GY - 44 - b.h); }
  // 街尾的花园：树影
  for (let k = 0; k < 7; k++) { const tx = X4 + 250 + k * 210, r = 190 + (k % 3) * 50; S.rgrad(ctx, tx, GY - 520 - (k % 2) * 90, r, [[0, [70, 50, 100], 0.95], [0.7, [48, 36, 84], 0.9], [1, [48, 36, 84], 0]], 0.9); }
  // 人行道
  S.vgrad(ctx, [[0, [96, 80, 110]], [0.5, [70, 60, 92]], [1, [44, 40, 70]]], GY - 44, GY + 56, vx0, vx1);
  ctx.fillStyle = 'rgba(0,0,0,0.16)'; for (let x = Math.floor(vx0 / 120) * 120; x < vx1; x += 120) S.poly(ctx, [[x, GY - 44], [x + 6, GY - 44], [x - 30, GY + 56], [x - 38, GY + 56]], 'rgba(0,0,0,0.16)');
  ctx.fillStyle = 'rgb(120,104,130)'; ctx.fillRect(vx0, GY + 56, vx1 - vx0, 7); ctx.fillStyle = 'rgb(34,30,56)'; ctx.fillRect(vx0, GY + 63, vx1 - vx0, 26);
  // 马路：湿的，映着店铺的光
  S.vgrad(ctx, [[0, [30, 28, 60]], [0.3, [16, 16, 40]], [1, [6, 8, 22]]], GY + 89, GY + 1700, vx0, vx1);
  ctx.save(); ctx.beginPath(); ctx.rect(vx0, GY + 89, vx1 - vx0, 1700); ctx.clip(); ctx.globalAlpha = 0.26; ctx.filter = 'blur(9px)';
  for (let i = 0; i < BLD.length; i++) { const b = BLD[i]; if (b.x + b.w < vx0 || b.x > vx1) continue; ctx.save(); ctx.translate(0, GY + 89); ctx.scale(1, -0.75); ctx.drawImage(BIMG[i](), b.x, -b.h - 40); ctx.restore(); }
  ctx.restore();
  S.vgrad(ctx, [[0, [6, 8, 22], 0], [1, [6, 8, 22], 0.85]], GY + 200, GY + 700, vx0, vx1);
  // 雨点打在地上的小涟漪
  for (let i = 0; i < 26; i++) { const ph = (t * 1.3 + hash(i * 3.1)) % 1, rx = vx0 + hash(i * 7.7 + Math.floor(t * 1.3 + hash(i * 3.1))) * (vx1 - vx0), ry = GY + 110 + hash(i * 5.3) * 260; S.ring(ctx, rx, ry, 6 + ph * 44, 5, [200, 210, 255], 0.3 * (1 - ph), 0.28); }
  ctx.restore();
}
// ---------- 道具 ----------
function tear(ctx, x, y, s, a) {
  if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; S.add(ctx, () => glow(ctx, x, y, 34 * s, [170, 220, 255], 0.7));
  const g = ctx.createRadialGradient(x - 3 * s, y + 2 * s, 0, x, y, 13 * s); g.addColorStop(0, 'rgb(250,254,255)'); g.addColorStop(1, 'rgb(120,190,250)'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x, y - 20 * s); ctx.quadraticCurveTo(x + 13 * s, y, x, y + 11 * s); ctx.quadraticCurveTo(x - 13 * s, y, x, y - 20 * s); ctx.fill(); ctx.restore();
}
function umbrella(ctx, hx, hy, tx, ty, r, t) {   // 手 (hx,hy)，伞顶 (tx,ty)
  S.add(ctx, () => S.rgrad(ctx, tx, ty + r * 0.75, r * 1.25, [[0, [255, 214, 150], 0.4], [1, [255, 214, 150], 0]], 0.7));
  ctx.strokeStyle = 'rgb(70,50,56)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(tx, ty + r * 0.2); ctx.stroke();
  const ang = Math.atan2(tx - hx, hy - ty);
  ctx.save(); ctx.translate(tx, ty); ctx.rotate(ang);
  const N = 6, base = r * 0.62;
  for (let k = 0; k < N; k++) {   // 伞面一瓣一瓣：从伞尖到伞沿，沿下缘是扇贝边
    const a0 = Math.PI + (k / N) * Math.PI, a1 = Math.PI + ((k + 1) / N) * Math.PI, x0 = Math.cos(a0) * r, x1 = Math.cos(a1) * r, y0 = base + Math.sin(a0) * 0, y1 = base;
    const g = ctx.createLinearGradient(x0, 0, x1, 0); const c0 = k % 2 ? [255, 226, 150] : [250, 190, 96]; g.addColorStop(0, rgba(mix(c0, [140, 80, 50], 0.28))); g.addColorStop(0.5, rgba(c0)); g.addColorStop(1, rgba(mix(c0, [255, 255, 255], 0.25)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -r * 0.06); ctx.quadraticCurveTo(x0 * 0.9, -r * 0.02, x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, base - r * 0.16, x1, y1); ctx.quadraticCurveTo(x1 * 0.9, -r * 0.02, 0, -r * 0.06); ctx.fill();
  }
  ctx.fillStyle = 'rgb(90,60,60)'; ctx.fillRect(-4, -r * 0.16, 8, r * 0.12);
  // 雨打在伞面上溅起来
  S.add(ctx, () => { for (let i = 0; i < 12; i++) { const ph = (t * 3 + hash(i * 4.7)) % 1, a = Math.PI + (0.08 + 0.84 * hash(i * 9.1 + Math.floor(t * 3 + hash(i * 4.7)))) * Math.PI, px = Math.cos(a) * r * 0.86, py = base * 0.45 + Math.sin(a) * r * 0.42; glow(ctx, px, py - ph * 26, 16 * (1 - ph) + 6, [220, 232, 255], 0.8 * (1 - ph)); } });
  ctx.restore();
}
function mask(ctx, x, y, s, rot, a) {
  if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  const g = ctx.createLinearGradient(-60, -70, 60, 80); g.addColorStop(0, 'rgb(255,252,244)'); g.addColorStop(1, 'rgb(206,196,206)'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-62, -58); ctx.quadraticCurveTo(0, -84, 62, -58); ctx.quadraticCurveTo(70, 20, 30, 70); ctx.quadraticCurveTo(0, 92, -30, 70); ctx.quadraticCurveTo(-70, 20, -62, -58); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgb(40,30,50)';
  for (const sd of [-1, 1]) { ctx.beginPath(); ctx.moveTo(sd * 12, -18); ctx.quadraticCurveTo(sd * 30, -40, sd * 46, -20); ctx.quadraticCurveTo(sd * 30, -12, sd * 12, -18); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(-34, 22); ctx.quadraticCurveTo(0, 62, 34, 22); ctx.quadraticCurveTo(0, 44, -34, 22); ctx.fill();
  ctx.fillStyle = 'rgba(240,120,130,0.5)'; for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(sd * 44, 12, 11, 0, 6.2832); ctx.fill(); }
  ctx.restore();
}
const beat = (t, per, ph = 0) => { const u = ((t / per + ph) % 1 + 1) % 1; return u; };
const her = (ctx, x, s, o, light, extra = {}) => S.lit(ctx, c => infp(c, x, GY, s, o), { light, at: [x, GY - 290 * s], r: 340 * s, warm: [255, 222, 170], cool: [20, 20, 64], k: 0.95, ...extra });
const folk = (ctx, key, x, s, o, light) => S.lit(ctx, c => MB.person(c, key, x, GY, s, o), { light, at: [x, GY - 250], r: 320, warm: [255, 222, 170], cool: [20, 20, 64], k: 0.95 });

// ① 情感共鸣
function v1(ctx, t) {
  lamp(ctx, X1 + 20, t);
  const u = prog(t, T.v1 - 0.1, T.v2 - 0.1), sync = smooth(prog(u, 0.25, 0.7)), L = [X1 + 20, GY - 760];
  const P = folk(ctx, 'isfp-female', X1 + 190, 2.15, { flip: true, slump: 0.9 - 0.5 * sync, gray: 0.8 * (1 - sync), dim: 0.25 * (1 - sync), lean: -0.03 }, L);
  const R = her(ctx, X1 - 150, 1.0, { t, eyes: 'sad', mouth: 'flat', tilt: 0.5, look: [1.4, 0.4], la: -0.25 * sync, spin: t * 1.2, lean: 0.03 * sync }, L);
  const c1 = R.chest, c2 = P.chest, colA = mix([255, 190, 130], PINK, sync), colB = mix([120, 160, 255], PINK, sync);
  // 心跳：一开始各跳各的（她快、对方慢而弱），后来同频
  const pa = beat(t, 0.62), pb = beat(t, lerp(0.95, 0.62, sync), lerp(0.37, 0, sync));
  S.add(ctx, () => { glow(ctx, c1[0], c1[1], 150 + 40 * Math.exp(-pa * 5), colA, 0.5); glow(ctx, c2[0], c2[1], 130 + 40 * Math.exp(-pb * 5), colB, 0.3 + 0.25 * sync); });
  S.ring(ctx, c1[0], c1[1], 40 + pa * 190, 20, colA, 0.5 * (1 - pa)); S.ring(ctx, c2[0], c2[1], 40 + pb * 190, 20, colB, (0.25 + 0.3 * sync) * (1 - pb));
  if (sync > 0.02) { const pts = Array.from({ length: 20 }, (_, k) => { const s = k / 19; return [lerp(c1[0], c2[0], s), lerp(c1[1], c2[1], s) - Math.sin(s * Math.PI) * 50 + Math.sin(s * 9 - t * 6) * 8]; }); S.ribbon(ctx, pts, s => 10 + 22 * Math.sin(s * Math.PI), [255, 130, 150], 0.7 * sync, sync); }
  // 同一刻掉下来的泪
  const tu = prog(u, 0.3, 0.95); if (tu > 0 && tu < 1) { tear(ctx, R.eyes[0] + 28, R.eyes[1] + 26 + tu * tu * 150, 1.3, Math.sin(Math.PI * Math.min(1, tu * 1.4))); tear(ctx, P.head[0] - 26, P.head[1] + 20 + tu * tu * 150, 1.3, Math.sin(Math.PI * Math.min(1, tu * 1.4))); }
  if (tu >= 1 || u >= 1) { tear(ctx, R.eyes[0] + 30, R.eyes[1] + 30, 0.8, 0.8); }
}
// ② 慈善：把伞倾过去
function v2(ctx, t) {
  lamp(ctx, X2 + 10, t);
  const u = prog(t, T.v2 - 0.1, T.v3 - 0.1), tip = easeInOut(prog(u, 0.12, 0.6)), L = [X2 + 10, GY - 760];
  folk(ctx, 'isfj-male', X2 + 170, 2.1, { flip: true, slump: 0.8 * (1 - tip), gray: 0.55 * (1 - tip), warm: tip }, L);
  const R = her(ctx, X2 - 120, 1.0, { t, wind: false, eyes: tip > 0.6 ? 'happy' : 'open', look: [1.5, 0], ra: -0.5 - 0.25 * tip, tilt: 0.3, lean: 0.05 * tip }, L);
  const hx = R.rh[0], hy = R.rh[1], tx = lerp(X2 - 70, X2 + 120, tip), ty = GY - 700 + 40 * tip;
  umbrella(ctx, hx, hy, tx, ty, 300, t);
  // 她露在雨里的半边肩膀：雨点溅在头发和肩上
  S.add(ctx, () => { for (let i = 0; i < 6; i++) { const ph = (t * 2.6 + hash(i * 2.9)) % 1; glow(ctx, R.top[0] - 30 - hash(i * 8.3 + Math.floor(t * 2.6 + hash(i * 2.9))) * 110, R.top[1] + 30 + hash(i * 1.7) * 160 - ph * 20, 18 * (1 - ph) + 5, [220, 232, 255], 0.8 * (1 - ph) * tip); } });
}
// ③ 真实可信：摘下面具
function v3(ctx, t) {
  lamp(ctx, X3 - 340, t);
  const u = prog(t, T.v3 - 0.1, T.tri - 0.05), off = easeInOut(prog(u, 0.18, 0.62)), L = [X3 - 340, GY - 760];
  const mx = X3 + 210, mw = 300, mh = 700, my = GY - mh;
  // 镜子：厚的金框，拱顶；镜面里是她（不戴面具的样子，暖光）
  const frame = (pad) => { ctx.beginPath(); ctx.moveTo(mx - mw / 2 - pad, GY); ctx.lineTo(mx - mw / 2 - pad, my + mw / 2); ctx.arc(mx, my + mw / 2, mw / 2 + pad, Math.PI, 0); ctx.lineTo(mx + mw / 2 + pad, GY); ctx.closePath(); };
  frame(26); const fg = ctx.createLinearGradient(mx - mw / 2 - 26, 0, mx + mw / 2 + 26, 0); fg.addColorStop(0, 'rgb(150,100,50)'); fg.addColorStop(0.3, 'rgb(250,214,130)'); fg.addColorStop(0.6, 'rgb(190,136,70)'); fg.addColorStop(1, 'rgb(110,70,40)'); ctx.fillStyle = fg; ctx.fill();
  ctx.save(); frame(0); ctx.clip();
  S.vgrad(ctx, [[0, [60, 70, 130]], [1, [30, 32, 76]]], my, GY, mx - mw, mx + mw);
  S.add(ctx, () => S.rgrad(ctx, mx, GY - 380, 420, [[0, [255, 226, 170], 0.25 + 0.5 * off], [1, [255, 226, 170], 0]]));
  ctx.save(); ctx.translate(mx + 20, 0); ctx.scale(-1, 1); infp(ctx, 0, GY - 14, 0.9, { t, eyes: off > 0.5 ? 'happy' : 'open', spin: t * 1.2, la: 0, tilt: 0.2 }); ctx.restore();
  const sw = prog(u, 0.5, 0.95); if (sw > 0 && sw < 1) { const sx = mx - mw + sw * mw * 2; const g = ctx.createLinearGradient(sx - 90, 0, sx + 90, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.save(); ctx.transform(1, 0, -0.3, 1, 0, 0); ctx.fillRect(sx - 90 + GY * 0.3, my, 180, mh); ctx.restore(); }
  ctx.restore();
  S.add(ctx, () => glow(ctx, mx, GY - 400, 520, [255, 226, 170], 0.22 * off));
  const R = her(ctx, X3 - 110, 1.0, { t, wind: false, eyes: off > 0.5 ? 'happy' : 'open', look: [1.4, 0], ra: lerp(-1.0, 0.5, off), tilt: 0.15 }, L);
  // 面具：从脸上拿下来，垂到手边
  const fx = R.head[0] + 16, fy = R.head[1] + 14, hx = R.rh[0] + 10, hy = R.rh[1] + 10;
  mask(ctx, lerp(fx, hx, off), lerp(fy, hy, off) - Math.sin(off * Math.PI) * 40, lerp(1.25, 0.95, off), lerp(-0.08, 0.6, off), 1);
}
// B06：街口 —— 路牌 vs 直觉
function signpost(ctx, x, t, dimA) {
  const g = ctx.createLinearGradient(x - 9, 0, x + 9, 0); g.addColorStop(0, 'rgb(40,40,64)'); g.addColorStop(0.5, 'rgb(110,110,140)'); g.addColorStop(1, 'rgb(30,30,50)'); ctx.fillStyle = g; ctx.fillRect(x - 9, GY - 700, 18, 700);
  [['捷径', 1, 0], ['大家都走这边', -1, 1], ['标准答案', 1, 2]].forEach(([s, d, i]) => {
    const y = GY - 660 + i * 118, w = 150 + s.length * 44, x0 = d > 0 ? x - 30 : x + 30 - w;
    ctx.save(); ctx.translate(0, 0); ctx.globalAlpha = 1 - 0.55 * dimA;
    S.add(ctx, () => glow(ctx, x0 + w / 2, y + 42, w * 0.9, [150, 190, 255], 0.2 * (1 - dimA)));
    const pts = d > 0 ? [[x0, y], [x0 + w - 40, y], [x0 + w, y + 42], [x0 + w - 40, y + 84], [x0, y + 84]] : [[x0 + w, y], [x0 + 40, y], [x0, y + 42], [x0 + 40, y + 84], [x0 + w, y + 84]];
    const bg = ctx.createLinearGradient(0, y, 0, y + 84); bg.addColorStop(0, 'rgb(214,228,250)'); bg.addColorStop(1, 'rgb(130,150,200)'); S.poly(ctx, pts, bg);
    K.text(ctx, s, x0 + w / 2 + (d > 0 ? -12 : 12), y + 58, { size: 42, weight: 500, color: [30, 40, 80], spacing: 0.06 });
    ctx.restore();
  });
}
function flower(ctx, x, y, r, u, c) {
  if (u <= 0.003) return; const e = easeOut(u) * (1 + 0.25 * Math.sin(Math.min(1, u) * Math.PI));
  S.add(ctx, () => glow(ctx, x, y, r * 2.2 * e, c, 0.22 * e));
  ctx.save(); ctx.translate(x, y); ctx.rotate(hash(x) * 6);
  for (let k = 0; k < 5; k++) { ctx.rotate(6.2832 / 5); const g = ctx.createRadialGradient(0, -r * 0.2, 0, 0, -r * 0.6 * e, r * e); g.addColorStop(0, 'rgb(255,250,240)'); g.addColorStop(1, rgba(c)); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -r * 0.6 * e, r * 0.42 * e, r * 0.62 * e, 0, 0, 6.2832); ctx.fill(); }
  ctx.fillStyle = 'rgb(255,220,120)'; ctx.beginPath(); ctx.arc(0, 0, r * 0.22 * e, 0, 6.2832); ctx.fill(); ctx.restore();
}
const AW = 250, AH = 760;    // 拱门
const AP = s => { if (s < 0.25) return [ARCH - AW, GY - (s / 0.25) * (AH - AW)]; if (s > 0.75) return [ARCH + AW, GY - ((1 - s) / 0.25) * (AH - AW)]; const a = (s - 0.25) / 0.5 * Math.PI; return [ARCH - Math.cos(a) * AW, GY - (AH - AW) - Math.sin(a) * AW]; };
function v4(ctx, t) {
  const iu = smooth(prog(t, T.intu - 0.2, T.intu + 1.0)), ru = prog(t, T.rom - 0.15, T.end), L = [X4 - 640, GY - 760];
  lamp(ctx, X4 - 640, t, 1 - 0.3 * smooth(ru));
  signpost(ctx, X4 - 330, t, smooth(ru));
  // 拱门：石柱 + 花藤（花随光绸经过一朵朵开）
  ctx.save(); S.add(ctx, () => S.rgrad(ctx, ARCH, GY - 380, 560, [[0, [255, 190, 200], 0.12 + 0.2 * smooth(ru)], [1, [255, 190, 200], 0]]));
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); for (let k = 0; k <= 60; k++) { const p = AP(k / 60); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }
  ctx.strokeStyle = 'rgb(34,36,70)'; ctx.lineWidth = 64; ctx.stroke(); ctx.strokeStyle = 'rgb(74,78,128)'; ctx.lineWidth = 44; ctx.stroke(); ctx.strokeStyle = 'rgb(46,96,90)'; ctx.lineWidth = 16; ctx.stroke();
  ctx.restore();
  // 串灯：拱门里一条垂下来的暖灯，一盏盏亮（亮了就不灭）
  for (let k = 0; k < 9; k++) { const s = (k + 0.5) / 9, x = ARCH - AW * 0.8 + s * AW * 1.6, y = GY - AH + 130 + Math.sin(s * Math.PI) * 90, on = smooth(prog(ru, 0.1 + s * 0.4, 0.2 + s * 0.4)); ctx.fillStyle = 'rgb(60,50,70)'; ctx.fillRect(x - 2, y - 26, 4, 22); S.add(ctx, () => { glow(ctx, x, y, 54 * on, [255, 200, 130], 0.5 * on); glow(ctx, x, y, 18, [255, 236, 200], 0.2 + 0.6 * on); }); }
  const walk = easeIn(prog(ru, 0.35, 1)), hx = X4 + 40 + walk * 400;
  const R = her(ctx, hx, 1.0, { t, eyes: ru > 0.12 ? 'happy' : iu > 0.05 || t > T.b06 + 0.5 ? 'closed' : 'open', la: -0.7 * smooth(prog(t, T.b06 + 0.3, T.b06 + 0.9)) * (1 - smooth(ru)), tilt: -0.2 * iu, spin: t * (1.5 + 5 * smooth(ru)), look: [1, -0.5] }, ru > 0.3 ? [ARCH, GY - 500] : L, ru > 0.3 ? { warm: [255, 200, 200] } : {});
  // 光绸（直觉）：从胸口出来，绕过路牌，穿过拱门
  if (iu > 0.01) {
    const c0 = R.chest, pts = Array.from({ length: 60 }, (_, k) => { const s = k / 59, x = lerp(c0[0], ARCH + 80, s), y = c0[1] - Math.sin(s * Math.PI) * 190 - Math.sin(s * 9 - t * 2.2) * 46 * Math.sin(s * Math.PI) + s * 60; return [x, y]; });
    S.add(ctx, () => glow(ctx, c0[0], c0[1], 170, [255, 220, 160], 0.5 * iu));
    S.ribbon(ctx, pts, s => 8 + 26 * Math.sin(s * Math.PI), [255, 170, 150], 0.7, iu);
    const hd = pts[Math.min(59, Math.floor(iu * 59))]; S.add(ctx, () => { glow(ctx, hd[0], hd[1], 80, [255, 220, 170], 0.7 * (1 - smooth(prog(iu, 0.9, 1)))); });
  }
  for (let k = 0; k < 26; k++) { const s = (k + 0.5) / 26, p = AP(s), j = hash(k * 3.3); flower(ctx, p[0] + (j - 0.5) * 50, p[1] + (hash(k * 5.1) - 0.5) * 50, 26 + j * 22, prog(ru, 0.02 + s * 0.45 + j * 0.05, 0.02 + s * 0.45 + j * 0.05 + 0.22), k % 3 ? [255, 160, 190] : [255, 214, 170]); }
}
function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  world(ctx, t, C);
  ctx.save(); S.cam(ctx, C, 1);
  const vx0 = C.x + W / 2 - (W / 2 + 500) / C.z, vx1 = C.x + W / 2 + (W / 2 + 500) / C.z, see = x => x > vx0 && x < vx1;
  if (see(X1)) v1(ctx, t); if (see(X2)) v2(ctx, t); if (see(X3)) v3(ctx, t); if (see(X4) || see(ARCH)) v4(ctx, t);
  ctx.restore();
  // 雨（屏幕空间，三层）+ 花瓣
  S.rain(ctx, t, { a: 0.85 * (1 - smooth(prog(t, T.rom, T.end))), n: 110 });
  const ru = smooth(prog(t, T.rom - 0.1, T.rom + 0.6));
  S.petals(ctx, t, { n: 46, seed: 5, dir: [-0.5, 0.6], speed: 240, a: ru, c: [255, 170, 196], c2: [255, 232, 226], size: 22, box: [-100, -100, W + 100, 1500] });
  // 前景：横移时掠过去的虚化路灯杆 / 邮筒（只在近景时有）
  const fa = smooth(prog(C.z, 0.85, 1.05));
  if (fa > 0.01) { ctx.save(); S.cam(ctx, C, 1.8); ctx.globalAlpha = fa; ctx.filter = 'blur(12px)';
    for (const fx of [540 + 380 * 1.8, 540 + 1140 * 1.8]) { ctx.fillStyle = 'rgb(10,10,26)'; ctx.fillRect(fx - 40, -400, 80, 2600); }
    ctx.filter = 'none'; ctx.restore(); }
  return { C };
}
function over(ctx, t, a) {
  // 拉远时三件事的名字（各在自己那盏灯上面）
  const ta = K.vis(t, T.tri + 0.15, T.b06 - 0.2, 0.35, 0.3) * a; if (ta <= 0.003) return;
  const C = S.camKF(t, CAM);
  [['情感共鸣', X1 + 20, PINK], ['慈善', X2 + 10, GOLD], ['真实可信', X3 - 30, LIME]].forEach(([s, x, c], i) => { const p = S.w2s(C, x, GY - 800), u = easeOut(prog(t, T.tri + 0.15 + i * 0.12, T.tri + 0.6 + i * 0.12)); S.title(ctx, s, p[0], p[1] - 40 + (1 - u) * 20, { size: 56, c, a: ta * u, spacing: 0.08 }); });
}
module.exports = { draw, over, T, world, lamp, GY };
