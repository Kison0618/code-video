'use strict';
// 《ESFJ》v7 EC7：G01–G03 + 片尾关注卡（竖屏 1080x1920）
//   G01 深夜他一个人在家，坐在窗边桌前。入场灯亮起来，他送出过的东西（汤碗、热茶、蛋糕、毛毯、围巾）从暗处旋进来，
//       在他身边绕成一圈星座（3D 椭圆轨道，前后遮挡）；说到「名字」，一张张名牌弹进轨道的空位。
//   G02 东西一件件飞出窗外，变成窗外城里的小灯；吊灯暗到只剩一点光，镜头推近，他低头看手里的杯子。静 1.5 秒。
//       敲门声，门开了：邻居、同事、ISTP、孩子一个个在光里出现，胸口的光流回他身上；上屏「谢谢你，我需要你」停 2.5 秒；
//       吊灯亮满，心跳一下，暖光从他胸口铺满整个屋子，他笑了。
//   G03 镜头往后拉，屋里的画面缩进一扇窗：他家这扇窗在一栋楼上，楼在满城灯火里；灯火从他的窗往外一圈圈亮开。
//   片尾：镜头上摇进夜空，城里升起金色粒子，聚成「关注依恋研究室 / 了解更多心理知识」，4 秒。
//   粒子聚字是轻量版：每颗粒子用 arc，按透明度分 6 档合并成一条路径填充（不用 drawImage 光晕贴图），单帧开销很小。
const X = require('./ehk');
const E = require('./egenv');
const FX = require('./egfx');
require('./ebw'); // 注册 EQHeavy 字体
const { K, L, vs, ve, at } = X;
const { W, H, clamp, lerp, mix, prog, smooth, easeOut, easeInOut, hash, glow, rgba } = K;
const WARM = E.WARM, CANDLE = E.CANDLE, MOON = [176, 196, 240];
const sm = (t, a, b) => smooth(prog(t, a, b));
const ei = (t, a, b) => easeInOut(prog(t, a, b));
const backOut = u => { u = clamp(u, 0, 1); const s = 1.9, v = u - 1; return 1 + (s + 1) * v * v * v + s * v * v; };
function kf(t, KS) {
  if (t <= KS[0][0]) return { ...KS[0][1] };
  for (let i = 0; i < KS.length - 1; i++) {
    const [ta, A] = KS[i], [tb, B] = KS[i + 1];
    if (t <= tb) { const u = easeInOut(prog(t, ta, tb)), o = {}; for (const k in A) o[k] = lerp(A[k], B[k] == null ? A[k] : B[k], u); return o; }
  }
  return { ...KS[KS.length - 1][1] };
}

// ---------- 时间（全部按句取） ----------
const T0 = vs('G01') - 0.05, G1 = vs('G01'), G1E = ve('G01'), G2 = vs('G02'), G2E = ve('G02'), G3 = vs('G03'), G3E = ve('G03');
const TNAME = at('G01', '名字');
const TQ = G2E + 1.5;                                          // 静 1.5 秒后敲门
const TXT0 = Math.max(TQ + 0.45, G3 + 0.05 - 2.8), TXT1 = TXT0 + 0.3 + 2.5; // 大字淡入 0.3 + 停 2.5
const TH = TXT0 + 0.75;                                        // 灯亮满 + 心跳
const TPULL = G3 - 0.05;                                       // 拉远出窗
const TC = G3E + 0.3, END = TC + 4.0;                          // 关注卡 4 秒

// ---------- 屋子 ----------
const HX = -0.35, HZ = 5.3, HY = -0.05;                        // 他坐着（腿被桌布挡住）
const TB = { x0: -1.05, x1: 0.55, z0: 4.45, z1: 5.05, y: 0.74 };
const LAMP = { X: 0.3, Z: 4.95, drop: 1.05 };
const WIN = { X: 0.95, Y: 0.85, w: 2.2, h: 1.75 }, BACK = 7.5, HW = 3.2, HT = 3.0;
const DOOR = { X: -2.05, w: 0.95, h: 2.1 };
const CAMI = [
  [T0, { z0: 0.9, x0: -0.75, h: 1.64, pitch: 0.075 }],
  [G1 + 0.7, { z0: 1.7, x0: -0.45, h: 1.5, pitch: 0.06 }],
  [G1E, { z0: 2.1, x0: -0.18, h: 1.44, pitch: 0.05 }],
  [G2 + 0.3, { z0: 2.2, x0: -0.12, h: 1.42, pitch: 0.05 }],
  [G2E, { z0: 3.0, x0: -0.3, h: 1.32, pitch: 0.02 }],
  [TQ, { z0: 3.08, x0: -0.33, h: 1.32, pitch: 0.02 }],
  [TQ + 1.3, { z0: 1.5, x0: -0.3, h: 1.6, pitch: 0.07 }],
  [TPULL, { z0: 1.36, x0: -0.3, h: 1.62, pitch: 0.07 }],
];
const camI = t => E.cam3({ cx: W / 2, cy: 740, f: 1100, ...kf(Math.min(t, TPULL), CAMI) });

function lampV(t) { // 吊灯亮度：入场亮起 → G02 暗到一点光（闪一下） → 心跳时亮满（冲高回落）
  let v = lerp(0.15, 0.9, easeOut(prog(t, T0, T0 + 0.55)));
  const d0 = G2 + 0.8;
  v = lerp(v, 0.12, sm(t, d0, G2E - 0.15));
  if (t > d0 && t < d0 + 0.3) v *= 0.75 + 0.25 * Math.sin((t - d0) * 70);
  if (t > G2E) v += 0.015 * Math.sin(t * 7.3);
  if (t >= TH) { const u = t - TH; v = lerp(0.12, 0.92, easeOut(prog(u, 0, 0.3))) + 0.15 * Math.exp(-u * 4) * prog(u, 0, 0.3); }
  return v;
}
const beat = t => (t < TH ? 0 : Math.exp(-(t - TH) * 2.4));

// ---------- 他送出过的东西 + 名牌：绕着他的星座 ----------
const ITEMS = [
  { k: 'bowl' }, { k: 'tag', name: '小林', col: [214, 84, 70] }, { k: 'tea' }, { k: 'tag', name: '小周', col: [70, 150, 170] },
  { k: 'cake' }, { k: 'tag', name: '阿杰', col: [70, 104, 160] }, { k: 'blanket' }, { k: 'tag', name: '朵朵', col: [232, 130, 156] },
  { k: 'gift' }, { k: 'tag', name: '王姐', col: [206, 156, 66] },
];
const NI = ITEMS.length, ORB = { X: HX, Y: 1.45, Z: HZ, rx: 1.42, rz: 0.9 }, OMEGA = 0.3, ISZ = 0.56;
const tgtOf = i => [WIN.X + (hash(i * 3.7) - 0.5) * 1.7, WIN.Y + 0.12 + hash(i * 5.3) * 0.75, BACK - 0.02];
function itemState(i, t) {
  const it = ITEMS[i], tag = it.k === 'tag';
  const ta = tag ? TNAME - 0.14 + (i >> 1) * 0.11 : T0 + 0.04 + (i >> 1) * 0.09;
  if (t < ta) return null;
  const ang0 = i / NI * 6.283 + 0.5, an = ang0 + OMEGA * (t - T0);
  let P = [ORB.X + ORB.rx * Math.cos(an), ORB.Y + 0.36 * Math.sin(an) + 0.04 * Math.sin(t * 1.7 + i), ORB.Z + ORB.rz * Math.sin(an)];
  let s, a;
  if (tag) { s = backOut(prog(t, ta, ta + 0.42)); a = clamp((t - ta) / 0.12, 0, 1); }
  else { // 从暗处旋进来：外圈 → 轨道，越近越大
    const u = easeOut(prog(t, ta, ta + 0.85)), a2 = an - (1 - u) * 1.5, R = 1 + 1.5 * (1 - u);
    P = [ORB.X + ORB.rx * R * Math.cos(a2), P[1] + (1 - u) * 0.5, ORB.Z + ORB.rz * Math.min(R, 2.1) * Math.sin(a2)];
    s = u; a = clamp(u * 1.6, 0, 1);
  }
  const tl = G2 + 0.06 + ((i * 3) % NI) * 0.085;               // 飞出窗外
  let gone = 0;
  if (t > tl) {
    const u = ei(t, tl, tl + 1.2), tg = tgtOf(i);
    P = [lerp(P[0], tg[0], u), lerp(P[1], tg[1], u) + Math.sin(u * Math.PI) * 0.4, lerp(P[2], tg[2], u)];
    s *= lerp(1, 0.08, u); gone = u;
  }
  return { i, it, P, s, a, gone };
}

// ---------- 道具（屏幕坐标，S = 物件宽度像素） ----------
function steam(c, x, y, S, t, a = 1, n = 4) {
  for (let i = 0; i < n; i++) { const u = (t * 0.55 + i / n) % 1; glow(c, x + Math.sin(t * 2 + i * 2) * S * 0.12 * u + (i - n / 2) * S * 0.06, y - u * S * 0.9, S * (0.1 + 0.18 * u), [255, 240, 225], 0.26 * a * Math.sin(u * Math.PI)); }
}
function dBowl(c, x, y, S, t) {
  const r = S * 0.5, yy = y - S * 0.1;
  c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x, yy + r * 0.98, r * 0.55, r * 0.1, 0, 0, 7); c.fill();
  const g = c.createLinearGradient(x - r, 0, x + r, 0); g.addColorStop(0, 'rgb(250,246,238)'); g.addColorStop(0.7, 'rgb(228,220,206)'); g.addColorStop(1, 'rgb(176,166,152)');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - r, yy); c.quadraticCurveTo(x - r * 0.92, yy + r * 0.95, x, yy + r * 0.95); c.quadraticCurveTo(x + r * 0.92, yy + r * 0.95, x + r, yy); c.closePath(); c.fill();
  c.fillStyle = 'rgb(72,118,178)'; c.beginPath(); c.moveTo(x - r * 0.95, yy + r * 0.16); c.quadraticCurveTo(x, yy + r * 0.42, x + r * 0.95, yy + r * 0.16); c.lineTo(x + r * 0.9, yy + r * 0.3); c.quadraticCurveTo(x, yy + r * 0.56, x - r * 0.9, yy + r * 0.3); c.closePath(); c.fill();
  c.fillStyle = 'rgb(240,234,224)'; c.beginPath(); c.ellipse(x, yy, r, r * 0.27, 0, 0, 7); c.fill();
  const sg = c.createRadialGradient(x - r * 0.2, yy - r * 0.05, 0, x, yy, r * 0.9); sg.addColorStop(0, 'rgb(246,186,110)'); sg.addColorStop(1, 'rgb(196,116,56)');
  c.fillStyle = sg; c.beginPath(); c.ellipse(x, yy + r * 0.02, r * 0.88, r * 0.21, 0, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,250,236,0.55)'; c.beginPath(); c.ellipse(x - r * 0.3, yy - r * 0.02, r * 0.22, r * 0.05, -0.1, 0, 7); c.fill();
  steam(c, x, yy - r * 0.1, S, t);
}
function dTea(c, x, y, S, t) {
  const w = S * 0.6, h = S * 0.5, yy = y - S * 0.05;
  c.fillStyle = 'rgb(226,218,204)'; c.beginPath(); c.ellipse(x, yy + h * 0.52, S * 0.52, S * 0.11, 0, 0, 7); c.fill();
  c.fillStyle = 'rgb(246,240,230)'; c.beginPath(); c.ellipse(x, yy + h * 0.46, S * 0.46, S * 0.08, 0, 0, 7); c.fill();
  c.strokeStyle = 'rgb(236,228,214)'; c.lineWidth = S * 0.08; c.beginPath(); c.arc(x + w * 0.52, yy - h * 0.02, h * 0.24, -1.2, 1.2); c.stroke();
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, 'rgb(255,252,246)'); g.addColorStop(0.65, 'rgb(236,228,216)'); g.addColorStop(1, 'rgb(190,178,164)');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2, yy - h / 2); c.lineTo(x + w / 2, yy - h / 2); c.quadraticCurveTo(x + w * 0.48, yy + h * 0.45, x, yy + h * 0.45); c.quadraticCurveTo(x - w * 0.48, yy + h * 0.45, x - w / 2, yy - h / 2); c.closePath(); c.fill();
  c.fillStyle = 'rgb(214,120,96)'; c.fillRect(x - w * 0.47, yy - h * 0.18, w * 0.94, h * 0.1);
  c.fillStyle = 'rgb(232,224,212)'; c.beginPath(); c.ellipse(x, yy - h / 2, w / 2, h * 0.14, 0, 0, 7); c.fill();
  c.fillStyle = 'rgb(160,92,44)'; c.beginPath(); c.ellipse(x, yy - h / 2 + h * 0.02, w * 0.44, h * 0.1, 0, 0, 7); c.fill();
  steam(c, x, yy - h * 0.55, S, t);
}
function dCake(c, x, y, S, t) {
  const w = S * 0.82, h = S * 0.42, yy = y + S * 0.06, ry = w * 0.17;
  const g = c.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, 'rgb(250,222,208)'); g.addColorStop(0.7, 'rgb(236,196,180)'); g.addColorStop(1, 'rgb(196,150,136)');
  c.fillStyle = g; c.beginPath(); c.moveTo(x - w / 2, yy - h / 2); c.lineTo(x - w / 2, yy + h / 2); c.ellipse(x, yy + h / 2, w / 2, ry, 0, Math.PI, 0, true); c.lineTo(x + w / 2, yy - h / 2); c.closePath(); c.fill();
  c.fillStyle = 'rgb(222,96,104)'; c.fillRect(x - w / 2, yy + h * 0.02, w, h * 0.12);
  c.fillStyle = 'rgb(255,250,240)'; c.beginPath(); c.ellipse(x, yy - h / 2, w / 2, ry, 0, 0, 7); c.fill();
  for (let k = 0; k < 7; k++) { const u = (k + 0.5) / 7, dx = (u - 0.5) * w * 0.96; c.beginPath(); c.ellipse(x + dx, yy - h / 2 + ry * Math.sqrt(1 - 4 * (u - 0.5) ** 2) * 0.9, w * 0.05, h * (0.12 + 0.1 * hash(k)), 0, 0, 7); c.fill(); }
  for (const [dx, dy] of [[-0.25, -0.02], [0.22, 0.03], [0.02, 0.08]]) { c.fillStyle = 'rgb(214,40,56)'; c.beginPath(); c.arc(x + dx * w, yy - h / 2 + dy * w, w * 0.07, 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x + dx * w - w * 0.02, yy - h / 2 + dy * w - w * 0.02, w * 0.018, 0, 7); c.fill(); }
  const cw = w * 0.07, ch = h * 0.6, cy = yy - h / 2 - ch;
  c.fillStyle = 'rgb(120,190,226)'; c.fillRect(x - cw / 2, cy, cw, ch);
  const fl = 1 + 0.12 * Math.sin(t * 13);
  glow(c, x, cy - cw * 1.4, S * 0.45, CANDLE, 0.45); c.fillStyle = 'rgb(255,226,140)'; c.beginPath(); c.ellipse(x, cy - cw * 1.3, cw * 0.55, cw * 1.2 * fl, 0, 0, 7); c.fill();
}
function dBlanket(c, x, y, S, t) {
  const w = S * 0.96, hh = S * 0.16;
  for (let k = 2; k >= 0; k--) {
    const yy = y - hh * 1.5 + k * hh * 1.02, base = [[70, 150, 160], [64, 138, 150], [58, 126, 140]][k];
    const g = c.createLinearGradient(0, yy, 0, yy + hh); g.addColorStop(0, rgba(mix(base, [255, 255, 255], 0.18))); g.addColorStop(1, rgba(mix(base, [0, 0, 0], 0.25)));
    c.fillStyle = g; c.beginPath(); c.roundRect(x - w / 2 + k * 3, yy, w - k * 2, hh, hh * 0.5); c.fill();
    c.fillStyle = 'rgba(250,236,206,0.55)'; for (let q = 1; q < 6; q++) c.fillRect(x - w / 2 + q * w / 6 - w * 0.018, yy + hh * 0.08, w * 0.036, hh * 0.84);
    c.fillStyle = 'rgba(214,90,70,0.6)'; c.fillRect(x - w / 2 + hh * 0.4, yy + hh * 0.42, w - hh * 0.8, hh * 0.16);
  }
  c.fillStyle = 'rgb(234,220,190)'; for (let q = 0; q < 9; q++) c.fillRect(x + w / 2 - 2, y - hh * 1.5 + q * hh * 0.34, S * 0.05, hh * 0.16);
}
function dGift(c, x, y, S, t) { // 包好的礼物盒：正面 + 顶面 + 丝带 + 蝴蝶结
  const w = S * 0.62, h = S * 0.48, d = S * 0.18, x0 = x - w / 2, y0 = y - h / 2 + d * 0.5;
  c.fillStyle = 'rgb(226,80,86)'; c.fillRect(x0, y0, w, h);
  c.fillStyle = 'rgb(170,52,62)'; c.beginPath(); c.moveTo(x0 + w, y0); c.lineTo(x0 + w + d * 0.7, y0 - d * 0.6); c.lineTo(x0 + w + d * 0.7, y0 + h - d * 0.6); c.lineTo(x0 + w, y0 + h); c.closePath(); c.fill();
  c.fillStyle = 'rgb(246,120,120)'; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + d * 0.7, y0 - d * 0.6); c.lineTo(x0 + w + d * 0.7, y0 - d * 0.6); c.lineTo(x0 + w, y0); c.closePath(); c.fill();
  c.fillStyle = 'rgb(255,214,120)'; c.fillRect(x - w * 0.07, y0, w * 0.14, h);
  c.beginPath(); c.moveTo(x - w * 0.07, y0); c.lineTo(x - w * 0.07 + d * 0.7, y0 - d * 0.6); c.lineTo(x + w * 0.07 + d * 0.7, y0 - d * 0.6); c.lineTo(x + w * 0.07, y0); c.closePath(); c.fill();
  const bx = x + d * 0.35, by = y0 - d * 0.35, sw = Math.sin(t * 2) * 0.06;
  for (const s of [-1, 1]) { c.save(); c.translate(bx, by); c.rotate(s * (0.5 + sw)); c.fillStyle = 'rgb(255,200,100)'; c.beginPath(); c.ellipse(s * w * 0.17, -w * 0.05, w * 0.18, w * 0.1, 0, 0, 7); c.fill(); c.fillStyle = 'rgba(160,100,40,0.5)'; c.beginPath(); c.ellipse(s * w * 0.12, -w * 0.05, w * 0.07, w * 0.045, 0, 0, 7); c.fill(); c.restore(); }
  c.fillStyle = 'rgb(255,226,150)'; c.beginPath(); c.arc(bx, by, w * 0.06, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.22)'; c.fillRect(x0 + w * 0.08, y0 + h * 0.08, w * 0.12, h * 0.8);
}
function dTag(c, x, y, S, it, t) {
  const w = S * 1.18, h = S * 0.72;
  c.save(); c.translate(x, y); c.rotate(0.08 * Math.sin(t * 1.3 + it.name.length * 2.1 + w * 0.01));
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.roundRect(-w / 2 + S * 0.03, -h / 2 + S * 0.04, w, h, h * 0.14); c.fill();
  c.fillStyle = 'rgb(252,248,238)'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h * 0.14); c.fill();
  c.fillStyle = rgba(it.col); c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h * 0.3, [h * 0.14, h * 0.14, 0, 0]); c.fill();
  c.fillStyle = 'rgb(252,248,238)'; c.beginPath(); c.ellipse(0, -h / 2 + h * 0.13, w * 0.12, h * 0.05, 0, 0, 7); c.fill();
  const g = c.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, 'rgba(255,255,255,0.0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.08)');
  c.fillStyle = g; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, h * 0.14); c.fill();
  K.text(c, it.name, 0, h * 0.31, { size: h * 0.38, weight: 500, color: [44, 36, 34], spacing: 0.1 });
  c.restore();
}
const DRAW = { bowl: dBowl, tea: dTea, cake: dCake, blanket: dBlanket, gift: dGift };
function drawItem(c, st, x, y, S, t) {
  if (S < 2) { glow(c, x, y, 26, WARM, 0.7 * st.a); return; }
  c.save(); c.globalAlpha *= st.a;
  glow(c, x, y, S * 1.55, WARM, 0.24 + 0.2 * st.gone);
  if (st.it.k === 'tag') dTag(c, x, y, S, st.it, t); else DRAW[st.it.k](c, x, y, S, t);
  const tw = 0.6 + 0.4 * Math.sin(t * 3.1 + st.i * 1.9);
  glow(c, x + S * 0.34, y - S * 0.3, S * 0.22, [255, 250, 230], 0.6 * tw);
  c.restore();
}

// ---------- 光照：人物画进离屏，再按灯位上色（离屏每帧新建） ----------
function litL(ctx, cv, fn, o = {}) {
  const { x = W / 2, y = 500, r = 1100, c = WARM, k = 0.32, amb = 0.5, ac = [10, 6, 14] } = o;
  const M = ctx.getTransform(), ox = cv.getContext('2d');
  ox.setTransform(1, 0, 0, 1, 0, 0); ox.globalCompositeOperation = 'source-over'; ox.globalAlpha = 1; ox.clearRect(0, 0, W, H);
  ox.setTransform(M); const res = fn(ox);
  ox.setTransform(M); ox.globalCompositeOperation = 'source-atop'; ox.globalAlpha = 1;
  const g = ox.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, k)); g.addColorStop(0.4, rgba(c, k * 0.35)); g.addColorStop(0.75, rgba(ac, amb * 0.5)); g.addColorStop(1, rgba(ac, amb));
  ox.fillStyle = g; ox.fillRect(-4000, -4000, 9000, 9000); ox.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(cv, 0, 0); ctx.restore();
  return res;
}

// ---------- 窗外夜景（屋里那扇窗看出去） ----------
function skylineLayer(c, x0, x1, base, w, h, k, seed, col, lights, t) {
  const n = 7 + k * 3, bw = (x1 - x0) / n;
  const g = c.createLinearGradient(0, base - h * 0.32, 0, base + h * 0.1); g.addColorStop(0, rgba(mix(col, [120, 120, 170], 0.35))); g.addColorStop(0.25, rgba(col)); g.addColorStop(1, rgba(mix(col, [0, 0, 0], 0.4)));
  c.fillStyle = g; c.beginPath(); c.moveTo(x0, base + h);
  const tops = [];
  for (let i = 0; i < n; i++) {
    const bh = h * (0.06 + hash(seed + i * 3.1) * 0.24) * (1 - k * 0.12), xa = x0 + i * bw, xb = xa + bw * (0.86 + hash(seed + i) * 0.14);
    c.lineTo(xa, base - bh); c.lineTo(xb, base - bh);
    if (hash(seed + i * 7.7) > 0.6) { c.lineTo(xb, base - bh * 0.82); c.lineTo(xa + bw, base - bh * 0.82); }
    tops.push([xa, xb, base - bh]);
  }
  c.lineTo(x1, base + h); c.closePath(); c.fill();
  if (!lights) return;
  c.save(); c.globalCompositeOperation = 'lighter';
  const r = Math.max(1.2, w * (0.0045 + 0.002 * k));
  for (const pass of [[r * 3, 0.1], [r, 0.75]]) {
    c.fillStyle = rgba([255, 204, 140], pass[1]); c.beginPath();
    tops.forEach(([xa, xb, yt], i) => { for (let q = 0; q < 6; q++) { const hq = hash(seed + i * 17 + q * 5); if (hq < 0.35) continue; const lx = lerp(xa, xb, 0.15 + 0.7 * hash(seed + i * 9 + q)), ly = yt + (base - yt) * (0.15 + 0.75 * hash(seed + i * 4 + q * 2)); c.moveTo(lx + pass[0], ly); c.arc(lx, ly, pass[0] * (0.8 + 0.2 * Math.sin(t * 2 + q + i)), 0, 6.283); } });
    c.fill();
  }
  c.restore();
}
function nightView(c, x0, y0, x1, y1, t) {
  const w = x1 - x0, h = y1 - y0, hz = y0 + h * 0.66;
  c.save(); c.beginPath(); c.rect(x0, y0, w, h); c.clip();
  const g = c.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, 'rgb(12,16,42)'); g.addColorStop(0.62, 'rgb(56,54,104)'); g.addColorStop(1, 'rgb(26,24,46)');
  c.fillStyle = g; c.fillRect(x0, y0, w, h);
  glow(c, x0 + w * 0.25, y0 + h * 0.3, w * 0.6, [130, 110, 210], 0.18); glow(c, x0 + w * 0.82, y0 + h * 0.48, w * 0.45, [90, 160, 210], 0.12);
  glow(c, x0 + w * 0.5, hz, w * 0.8, [255, 170, 120], 0.12);
  glow(c, x0 + w * 0.76, y0 + h * 0.2, w * 0.18, [220, 230, 255], 0.55);
  c.fillStyle = 'rgb(238,242,255)'; c.beginPath(); c.arc(x0 + w * 0.76, y0 + h * 0.2, w * 0.034, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,252,240,0.8)'; c.beginPath();
  for (let i = 0; i < 22; i++) { const sx = x0 + hash(i * 2.7) * w, sy = y0 + hash(i * 5.1) * h * 0.5, r = w * (0.0015 + 0.002 * hash(i)) * (0.7 + 0.3 * Math.sin(t * 2 + i)); c.moveTo(sx + r, sy); c.arc(sx, sy, r, 0, 6.283); }
  c.fill();
  skylineLayer(c, x0 - w * 0.05, x1 + w * 0.05, hz, w, h, 0, 11, [44, 42, 78], true, t);
  skylineLayer(c, x0 - w * 0.1, x1 + w * 0.1, hz + h * 0.07, w, h, 1, 37, [28, 26, 50], true, t);
  skylineLayer(c, x0 - w * 0.1, x1 + w * 0.1, hz + h * 0.15, w, h, 2, 71, [16, 14, 28], true, t);
  c.restore();
}

// ---------- 屋子 ----------
function roomDraw(ctx, p, t, lv, lk) {
  const near = p.z0 + 0.25, WALL = [122, 84, 74], FLOOR = [108, 70, 50], CEIL = [56, 38, 38];
  const dk = (c, k) => mix(c, [8, 6, 12], 1 - clamp(k, 0, 1));
  ctx.fillStyle = rgba(dk(CEIL, 0.45 * lk)); ctx.fillRect(0, 0, W, H);
  E.poly(ctx, p, [[-HW, HT, near], [HW, HT, near], [HW, HT, BACK], [-HW, HT, BACK]], dk(CEIL, 0.55 * lk));
  E.poly(ctx, p, [[-HW, 0, near], [-HW, HT, near], [-HW, HT, BACK], [-HW, 0, BACK]], dk(WALL, 0.5 * lk));
  E.poly(ctx, p, [[HW, 0, near], [HW, HT, near], [HW, HT, BACK], [HW, 0, BACK]], dk(WALL, 0.56 * lk));
  E.poly(ctx, p, [[-HW, 0, near], [HW, 0, near], [HW, 0, BACK], [-HW, 0, BACK]], dk(FLOOR, 0.72 * lk));
  for (let i = 1; i < 10; i += 2) { const a = -HW + i * 2 * HW / 10, b = a + 2 * HW / 10; E.poly(ctx, p, [[a, 0.001, near], [b, 0.001, near], [b, 0.001, BACK], [a, 0.001, BACK]], dk(mix(FLOOR, [70, 42, 28], 0.4), 0.72 * lk), 0.55); }
  E.poly(ctx, p, [[-HW, 0, BACK], [HW, 0, BACK], [HW, HT, BACK], [-HW, HT, BACK]], dk(WALL, 0.78 * lk));
  for (let i = 0; i < 16; i += 2) { const a = -HW + i * 2 * HW / 16, b = a + 2 * HW / 16; E.poly(ctx, p, [[a, 0.9, BACK - 0.005], [b, 0.9, BACK - 0.005], [b, HT, BACK - 0.005], [a, HT, BACK - 0.005]], dk(mix(WALL, [160, 112, 96], 0.35), 0.78 * lk), 0.35); }
  E.poly(ctx, p, [[-HW, 0, BACK - 0.01], [HW, 0, BACK - 0.01], [HW, 0.9, BACK - 0.01], [-HW, 0.9, BACK - 0.01]], dk([92, 60, 50], 0.75 * lk));
  E.poly(ctx, p, [[-HW, 0.88, BACK - 0.02], [HW, 0.88, BACK - 0.02], [HW, 0.95, BACK - 0.02], [-HW, 0.95, BACK - 0.02]], dk([170, 128, 104], 0.75 * lk));
  // 墙面受吊灯的光（离灯越远越暗）
  const Lp = p(LAMP.X, 1.7, BACK - 0.1), R = p.px(BACK, 3.4);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(Lp[0], Lp[1], 0, Lp[0], Lp[1], R); g.addColorStop(0, rgba(WARM, 0.2 * Math.min(1.2, lv))); g.addColorStop(1, rgba(WARM, 0));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  // 地毯
  const rug = []; for (let k = 0; k < 28; k++) { const a = k / 28 * 6.283; rug.push([HX + 0.2 + 1.7 * Math.cos(a), 0.003, HZ + 0.45 + 1.0 * Math.sin(a)]); }
  E.poly(ctx, p, rug, dk([128, 54, 52], 0.65 * lk));
  const rug2 = rug.map(q => [lerp(HX + 0.2, q[0], 0.78), 0.004, lerp(HZ + 0.45, q[2], 0.78)]);
  E.poly(ctx, p, rug2, dk([160, 92, 66], 0.65 * lk));
}
function windowDraw(ctx, p, t, lk) {
  const Z = BACK - 0.02, a = p(WIN.X - WIN.w / 2, WIN.Y + WIN.h, Z), b = p(WIN.X + WIN.w / 2, WIN.Y, Z);
  nightView(ctx, a[0], a[1], b[0], b[1], t);
  const ft = Math.max(6, p.px(Z, 0.07)), fc = rgba(mix([78, 52, 40], [10, 8, 12], 1 - (0.35 + 0.5 * lk)));
  ctx.fillStyle = fc;
  ctx.fillRect(a[0] - ft, a[1] - ft, b[0] - a[0] + 2 * ft, ft); ctx.fillRect(a[0] - ft, b[1], b[0] - a[0] + 2 * ft, ft);
  ctx.fillRect(a[0] - ft, a[1], ft, b[1] - a[1]); ctx.fillRect(b[0], a[1], ft, b[1] - a[1]);
  ctx.fillRect((a[0] + b[0]) / 2 - ft * 0.4, a[1], ft * 0.8, b[1] - a[1]); ctx.fillRect(a[0], lerp(a[1], b[1], 0.42) - ft * 0.4, b[0] - a[0], ft * 0.8);
  // 窗台
  E.poly(ctx, p, [[WIN.X - WIN.w / 2 - 0.1, WIN.Y, Z], [WIN.X + WIN.w / 2 + 0.1, WIN.Y, Z], [WIN.X + WIN.w / 2 + 0.1, WIN.Y, Z - 0.22], [WIN.X - WIN.w / 2 - 0.1, WIN.Y, Z - 0.22]], mix([170, 140, 120], [10, 8, 12], 1 - (0.3 + 0.55 * lk)));
  E.poly(ctx, p, [[WIN.X - WIN.w / 2 - 0.1, WIN.Y, Z - 0.22], [WIN.X + WIN.w / 2 + 0.1, WIN.Y, Z - 0.22], [WIN.X + WIN.w / 2 + 0.1, WIN.Y - 0.07, Z - 0.22], [WIN.X - WIN.w / 2 - 0.1, WIN.Y - 0.07, Z - 0.22]], mix([120, 92, 76], [10, 8, 12], 1 - (0.3 + 0.55 * lk)));
  // 窗帘：两侧垂下的布，带褶
  for (const s of [-1, 1]) {
    const xa = WIN.X + s * (WIN.w / 2 + 0.02), xb = xa + s * 0.42, Zc = Z - 0.06;
    const A = p(xa, WIN.Y + WIN.h + 0.2, Zc), B = p(xb, 0.25, Zc);
    const g = ctx.createLinearGradient(A[0], 0, B[0], 0), base = mix([150, 84, 70], [12, 8, 12], 1 - (0.3 + 0.6 * lk));
    for (let q = 0; q <= 6; q++) g.addColorStop(q / 6, rgba(mix(base, q % 2 ? [0, 0, 0] : [255, 220, 190], q % 2 ? 0.3 : 0.08)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(A[0], A[1]); ctx.lineTo(B[0], A[1]); ctx.quadraticCurveTo(B[0] + s * 12, (A[1] + B[1]) / 2, B[0] - s * 6, B[1]); ctx.lineTo(A[0] + s * 18, B[1]); ctx.quadraticCurveTo(A[0] + s * 30, (A[1] + B[1]) * 0.55, A[0], A[1]); ctx.closePath(); ctx.fill();
  }
  // 月光从窗口斜落到地上
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const fl = [p(WIN.X - 1.5, 0, Z - 2.0), p(WIN.X + 0.4, 0, Z - 2.4)];
  const mg = ctx.createLinearGradient(0, a[1], 0, fl[0][1]); mg.addColorStop(0, rgba(MOON, 0.09)); mg.addColorStop(1, rgba(MOON, 0.0));
  ctx.fillStyle = mg; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], a[1]); ctx.lineTo(fl[1][0], fl[1][1]); ctx.lineTo(fl[0][0], fl[0][1]); ctx.closePath(); ctx.fill();
  ctx.restore();
  E.pool(ctx, p, WIN.X - 0.6, Z - 2.2, 1.4, MOON, 0.12);
  // 窗边一盆绿植
  const pp = p(WIN.X + WIN.w / 2 + 0.75, 0, BACK - 0.45), s = p.px(BACK - 0.45, 1);
  const dkk = 1 - (0.3 + 0.55 * lk);
  ctx.fillStyle = rgba(mix([150, 92, 64], [8, 6, 10], dkk)); ctx.beginPath(); ctx.moveTo(pp[0] - s * 0.2, pp[1] - s * 0.42); ctx.lineTo(pp[0] + s * 0.2, pp[1] - s * 0.42); ctx.lineTo(pp[0] + s * 0.15, pp[1]); ctx.lineTo(pp[0] - s * 0.15, pp[1]); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 9; i++) { const an = -Math.PI / 2 + (i - 4) * 0.32 + Math.sin(t * 0.8 + i) * 0.03, L2 = s * (0.55 + 0.3 * hash(i * 2.3)); ctx.save(); ctx.translate(pp[0], pp[1] - s * 0.42); ctx.rotate(an); ctx.fillStyle = rgba(mix(i % 2 ? [58, 110, 70] : [74, 132, 82], [8, 10, 12], dkk)); ctx.beginPath(); ctx.ellipse(L2 * 0.5, 0, L2 * 0.5, s * 0.07, 0, 0, 7); ctx.fill(); ctx.restore(); }
}
function wallDecor(ctx, p, t, lk) { // 后墙上的两张旧照片（暖色，他和大家）
  const dkk = 1 - (0.3 + 0.6 * lk);
  for (const [Xc, Yc, w, h, sd] of [[-1.0, 1.9, 0.46, 0.34, 1], [-0.48, 2.28, 0.32, 0.4, 2]]) {
    const a = p(Xc - w / 2, Yc + h / 2, BACK - 0.03), b = p(Xc + w / 2, Yc - h / 2, BACK - 0.03), fw = Math.max(4, (b[0] - a[0]) * 0.08);
    ctx.fillStyle = rgba(mix([60, 40, 30], [8, 6, 10], dkk)); ctx.fillRect(a[0] - fw, a[1] - fw, b[0] - a[0] + 2 * fw, b[1] - a[1] + 2 * fw);
    const g = ctx.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, rgba(mix([236, 196, 140], [10, 8, 10], dkk))); g.addColorStop(1, rgba(mix([180, 130, 90], [10, 8, 10], dkk)));
    ctx.fillStyle = g; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    ctx.fillStyle = rgba(mix([96, 64, 44], [8, 6, 10], dkk));
    const n = sd === 1 ? 3 : 2, ww = b[0] - a[0], hh = b[1] - a[1];
    for (let k = 0; k < n; k++) { const cx = a[0] + ww * (k + 0.5) / n, r = hh * 0.13; ctx.beginPath(); ctx.arc(cx, b[1] - hh * 0.5, r, 0, 7); ctx.fill(); ctx.beginPath(); ctx.ellipse(cx, b[1], r * 1.6, hh * 0.32, 0, Math.PI, 0); ctx.fill(); }
  }
}
function doorDraw(ctx, p, t, lk) {
  const open = easeOut(prog(t, TQ + 0.02, TQ + 0.42)), Z = BACK - 0.01, hx = DOOR.X - DOOR.w / 2;
  const a = p(DOOR.X - DOOR.w / 2, DOOR.h, Z), b = p(DOOR.X + DOOR.w / 2, 0, Z), fw = Math.max(5, p.px(Z, 0.07));
  ctx.fillStyle = rgba(mix([70, 46, 34], [8, 6, 10], 1 - (0.3 + 0.6 * lk))); ctx.fillRect(a[0] - fw, a[1] - fw, b[0] - a[0] + 2 * fw, b[1] - a[1] + fw);
  if (open > 0.01) { // 门外走廊的暖光
    const g = ctx.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, rgba([255, 230, 180], 0.95)); g.addColorStop(1, rgba([255, 186, 120], 0.9));
    ctx.fillStyle = g; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
    glow(ctx, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (b[1] - a[1]) * 0.9, [255, 206, 140], 0.35 * open);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const f0 = p(DOOR.X - 0.6, 0, Z - 1.6), f1 = p(DOOR.X + 0.8, 0, Z - 1.6);
    const lg = ctx.createLinearGradient(0, b[1], 0, f0[1]); lg.addColorStop(0, rgba([255, 200, 140], 0.22 * open)); lg.addColorStop(1, rgba([255, 200, 140], 0));
    ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(a[0], b[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(f1[0], f1[1]); ctx.lineTo(f0[0], f0[1]); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  const th = open * 1.2, ex = hx + DOOR.w * Math.cos(th), ez = Z - DOOR.w * Math.sin(th);
  const c0 = mix([110, 76, 54], [8, 6, 10], 1 - (0.3 + 0.6 * lk)), c1 = mix(c0, [0, 0, 0], 0.3);
  E.poly(ctx, p, [[hx, 0, Z], [ex, 0, ez], [ex, DOOR.h, ez], [hx, DOOR.h, Z]], open > 0.01 ? c1 : c0);
  const kn = p(lerp(hx, ex, 0.86), 1.0, lerp(Z, ez, 0.86));
  ctx.fillStyle = 'rgb(216,182,106)'; ctx.beginPath(); ctx.arc(kn[0], kn[1], Math.max(3, p.px(Z, 0.035)), 0, 7); ctx.fill();
  glow(ctx, kn[0], kn[1], 18, [255, 220, 150], 0.3);
}
function tableDraw(ctx, p, t, lk, lv) {
  const C1 = mix([150, 74, 62], [14, 10, 14], 1 - (0.3 + 0.6 * lk)); // 暗红桌布（不抢主角）
  E.poly(ctx, p, [[TB.x0, TB.y, TB.z0], [TB.x1, TB.y, TB.z0], [TB.x1, TB.y, TB.z1], [TB.x0, TB.y, TB.z1]], C1);
  const A = p(TB.x0, TB.y, TB.z0), B = p(TB.x1, 0.02, TB.z0 - 0.05);
  const g = ctx.createLinearGradient(0, A[1], 0, B[1]); g.addColorStop(0, rgba(mix(C1, [0, 0, 0], 0.12))); g.addColorStop(1, rgba(mix(C1, [0, 0, 0], 0.55)));
  ctx.fillStyle = g; const q = [p(TB.x0, TB.y, TB.z0), p(TB.x1, TB.y, TB.z0), p(TB.x1 + 0.05, 0.02, TB.z0 - 0.05), p(TB.x0 - 0.05, 0.02, TB.z0 - 0.05)];
  ctx.beginPath(); q.forEach((s, i) => (i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]))); ctx.closePath(); ctx.fill();
  for (let i = 1; i < 8; i++) { const u = i / 8, X0 = lerp(TB.x0, TB.x1, u); E.poly(ctx, p, [[X0 - 0.025, TB.y - 0.03, TB.z0 - 0.002], [X0 + 0.025, TB.y - 0.03, TB.z0 - 0.002], [X0 + 0.05 + (u - 0.5) * 0.06, 0.03, TB.z0 - 0.052], [X0 - 0.05 + (u - 0.5) * 0.06, 0.03, TB.z0 - 0.052]], [0, 0, 0], 0.16); }
  E.poly(ctx, p, [[TB.x0 - 0.05, 0.1, TB.z0 - 0.052], [TB.x1 + 0.05, 0.1, TB.z0 - 0.052], [TB.x1 + 0.05, 0.03, TB.z0 - 0.052], [TB.x0 - 0.05, 0.03, TB.z0 - 0.052]], mix(C1, [255, 255, 255], 0.08));
  const lp = p(LAMP.X - 0.1, TB.y, (TB.z0 + TB.z1) / 2);
  ctx.save(); ctx.translate(lp[0], lp[1]); ctx.scale(1, 0.32); glow(ctx, 0, 0, p.px(TB.z0, 0.9), WARM, 0.16 * Math.min(1.2, lv)); ctx.restore();
  // 桌上的茶壶
  const tp = p(0.28, TB.y, 4.82), s = p.px(4.82, 0.24), dkk = 1 - (0.35 + 0.6 * lk);
  ctx.fillStyle = rgba(mix([214, 236, 236], [12, 12, 16], dkk));
  ctx.beginPath(); ctx.ellipse(tp[0], tp[1] - s * 0.4, s * 0.5, s * 0.4, 0, 0, 7); ctx.fill();
  ctx.beginPath(); ctx.moveTo(tp[0] - s * 0.4, tp[1] - s * 0.45); ctx.quadraticCurveTo(tp[0] - s * 0.8, tp[1] - s * 0.5, tp[0] - s * 0.85, tp[1] - s * 0.85); ctx.lineTo(tp[0] - s * 0.72, tp[1] - s * 0.82); ctx.quadraticCurveTo(tp[0] - s * 0.6, tp[1] - s * 0.55, tp[0] - s * 0.3, tp[1] - s * 0.3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(mix([160, 190, 196], [12, 12, 16], dkk)); ctx.beginPath(); ctx.ellipse(tp[0], tp[1] - s * 0.8, s * 0.22, s * 0.08, 0, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.beginPath(); ctx.ellipse(tp[0] - s * 0.18, tp[1] - s * 0.55, s * 0.1, s * 0.16, -0.4, 0, 7); ctx.fill();
}

// ---------- 他照顾过的人：一个个在光里出现 ----------
const FOLKS = [
  { key: 'isfj-female', X: -2.02, Z: 7.28, m: 1.6, d: 0.12, flip: false },   // 邻居（门口）
  { key: 'istj-male', X: -1.22, Z: 6.75, m: 1.74, d: 0.3, flip: false },     // 同事
  { key: 'istp-male', X: 1.22, Z: 6.15, m: 1.78, d: 0.48, flip: true },       // ISTP（窗前）
  { key: 'enfp-male', X: -1.32, Z: 4.85, m: 1.12, d: 0.66, flip: false },    // 孩子（桌边）
];
const folkA = (t, f) => clamp((t - TQ - f.d) / 0.28, 0, 1);
function folkDraw(c, p, t, f) {
  const u = t - TQ - f.d, a = folkA(t, f);
  if (a <= 0.003) return null;
  const rise = 1 - Math.exp(-Math.max(0, u) * 7) * Math.cos(Math.max(0, u) * 11);
  const inner = 0.18 + 0.14 * sm(t, TH - 0.1, TH + 0.4) + 0.2 * beat(t + 0.06);
  return E.folk3(c, p, f.key, f.X, f.Z, { m: f.m, Y: -0.12 * (1 - rise), a, flip: f.flip, warm: 0.08, inner, shadow: 0.35, bob: Math.abs(Math.sin(t * 2.2 + f.d * 9)) * p.px(f.Z, 0.012) });
}
function folkColumn(ctx, p, t, f) { // 出现前那一束光
  const u = t - TQ - f.d + 0.14; if (u < 0) return;
  const k = Math.exp(-Math.max(0, u - 0.25) * 2.2) * sm(u, 0, 0.18), top = p(f.X, 2.6, f.Z), bot = p(f.X, 0, f.Z);
  E.cone(ctx, top[0], top[1], bot[1], p.px(f.Z, 0.2), p.px(f.Z, 1.0), [255, 214, 160], 0.16 * k + 0.03);
  E.pool(ctx, p, f.X, f.Z, 0.9, WARM, 0.32 * k + 0.08);
}
function streamTo(ctx, A, B, t, a, seed) { // 一串暖光粒子从 A 流到 B（实心光点，无细线）
  if (a <= 0.01) return;
  const C = [(A[0] + B[0]) / 2, Math.min(A[1], B[1]) - Math.hypot(B[0] - A[0], B[1] - A[1]) * 0.28];
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [rk, al] of [[3.2, 0.12], [1, 0.7]]) {
    ctx.fillStyle = rgba([255, 214, 150], al * a); ctx.beginPath();
    for (let j = 0; j < 12; j++) {
      const ph = (t * 0.5 + j / 12 + hash(seed + j) * 0.05) % 1, v = 1 - ph, s = Math.sin(ph * Math.PI);
      const x = v * v * A[0] + 2 * v * ph * C[0] + ph * ph * B[0] + Math.sin(t * 3 + j) * 8 * s, y = v * v * A[1] + 2 * v * ph * C[1] + ph * ph * B[1] + Math.cos(t * 2.4 + j) * 5 * s;
      const r = (3 + 3 * hash(seed + j * 2)) * rk * (0.5 + 0.5 * s); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.283);
    }
    ctx.fill();
  }
  ctx.restore();
}

// ---------- 他的姿态 ----------
function heroPose(t) {
  const sad = sm(t, G2 + 0.9, G2E), knock = sm(t, TQ + 0.05, TQ + 0.4), joy = sm(t, TH - 0.05, TH + 0.3), leave = sm(t, G2, G2 + 0.5) * (1 - sad);
  let look = [0.8 * Math.sin((t - T0) * 1.1), -0.25];
  look = [lerp(look[0], 0.9, leave), lerp(look[1], -0.7, leave)];
  look = [lerp(look[0], 0.25, sad), lerp(look[1], 1, sad)];
  look = [lerp(look[0], -1, knock), lerp(look[1], -0.35, knock)];
  look = [lerp(look[0], 0, joy), lerp(look[1], -0.2, joy)];
  const nodK = Math.exp(-Math.max(0, t - TQ - 0.05) * 5) * Math.sin(Math.max(0, t - TQ - 0.05) * 14) * 0.25 * knock; // 抬头的余波
  const b = beat(t);
  return {
    m: 1.75, Y: HY, umbrella: false, cake: false, book: false, shadow: 0,
    eyes: t < TQ + 0.05 ? (sad > 0.6 ? 'open' : 'open') : t < TH ? 'wide' : 'happy',
    mouth: sad < 0.5 ? 'smile' : t < TQ + 0.05 ? 'flat' : t < TH ? 'o' : 'smile',
    look, nod: lerp(lerp(-0.1, 0.8, sad), -0.35, knock) - 0.15 * joy + nodK, tilt: 0.2 * sad * (1 - knock),
    lean: 0.03 * sad * (1 - knock), rs: -0.12, re: -0.25 - 0.1 * sad,
    glow: 0.2 * (1 - sad) + 0.06 + 0.3 * joy + 0.3 * b, warm: 0.15 * (1 - sad) + 0.3 * joy, bob: b * 6 + Math.sin(t * 1.6) * 1.2,
  };
}

// ---------- 前景（虚焦）：小画布画好再放大，自然就虚了（每帧新建） ----------
function foreground(ctx, p, t, lv) {
  const S = 4, cv = new K.Canvas(W / S, H / S), c = cv.getContext('2d'), par = (p.x0 + 0.3) * -60, dz = (p.z0 - 2) * 8;
  c.scale(1 / S, 1 / S);
  c.fillStyle = 'rgba(12,8,12,0.7)';
  c.beginPath(); c.ellipse(-60 + par * 1.4 - dz, 1830, 360, 260, 0.2, 0, 7); c.fill();             // 近处沙发扶手
  c.beginPath(); c.ellipse(1150 + par * 1.6 + dz, 1760, 300, 330, -0.3, 0, 7); c.fill();
  c.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) { const x = (hash(i * 3.1) * 1300 + t * 10 * (0.4 + hash(i))) % 1300 - 110 + par, y = 200 + hash(i * 7.7) * 1500, r = 50 + hash(i * 1.3) * 80; const g = c.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(i % 3 ? WARM : [255, 230, 200], 0.16 * (0.5 + 0.5 * Math.min(1, lv)))); g.addColorStop(0.7, rgba(WARM, 0.08)); g.addColorStop(1, rgba(WARM, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.imageSmoothingQuality = 'high'; ctx.filter = 'blur(6px)'; ctx.drawImage(cv, 0, 0, W, H); ctx.restore();
}

// ---------- 屋里一整帧 ----------
let HERO_CH = [W / 2, 900];
function interior(ctx, t, fg = true) {
  const p = camI(t), lv = lampV(t), lk = 0.35 + 0.65 * Math.min(1, lv), cv = new K.Canvas(W, H);
  roomDraw(ctx, p, t, lv, lk);
  windowDraw(ctx, p, t, lk);
  wallDecor(ctx, p, t, lk);
  doorDraw(ctx, p, t, lk);
  E.pendant(ctx, p, LAMP.X, LAMP.Z, { ht: HT, drop: LAMP.drop, on: Math.min(1.25, lv), R: 1.9 });
  const lamp = p(LAMP.X, HT - LAMP.drop, LAMP.Z);
  // 东西：按深度分前后
  const sts = []; for (let i = 0; i < NI; i++) { const s = itemState(i, t); if (s) sts.push(s); }
  sts.sort((a, b) => b.P[2] - a.P[2]);
  const scr = s => { const q = p(...s.P); return { x: q[0], y: q[1], S: p.px(s.P[2], ISZ) * s.s }; };
  // 星座：相邻两件东西之间一串细小的星尘点
  const live = sts.filter(s => s.gone < 0.15 && s.a > 0.3).sort((a, b) => a.i - b.i);
  if (live.length > 2) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([255, 228, 180], 0.42); ctx.beginPath();
    for (let k = 0; k < live.length; k++) {
      const A = live[k], B = live[(k + 1) % live.length]; if ((B.i - A.i + NI) % NI > 2) continue;
      for (let j = 1; j < 5; j++) { const u = j / 5, P3 = [lerp(A.P[0], B.P[0], u), lerp(A.P[1], B.P[1], u) + 0.05 * Math.sin(u * Math.PI), lerp(A.P[2], B.P[2], u)], q = p(...P3), r = Math.max(1.5, p.px(P3[2], 0.012)) * (0.7 + 0.3 * Math.sin(t * 4 + j + k)); ctx.moveTo(q[0] + r, q[1]); ctx.arc(q[0], q[1], r, 0, 6.283); }
    }
    ctx.fill(); ctx.restore();
  }
  for (const s of sts) if (s.P[2] >= HZ - 0.02) { const q = scr(s); drawItem(ctx, s, q.x, q.y, q.S, t); }
  // 门口和身后的人 + 他
  for (const f of FOLKS) if (f.Z > HZ) folkColumn(ctx, p, t, f);
  const LO = { x: lamp[0], y: lamp[1] + 40, r: 1250, k: 0.1 + 0.16 * Math.min(1.1, lv), amb: lerp(0.6, 0.36, Math.min(1, lv)) };
  const res = litL(ctx, cv, c => {
    const out = {};
    for (const f of FOLKS) if (f.Z > HZ) out[f.key] = folkDraw(c, p, t, f);
    out.hero = E.hero3(c, p, HX, HZ, heroPose(t));
    return out;
  }, LO);
  const hr = res.hero; HERO_CH = hr.chest;
  tableDraw(ctx, p, t, lk, lv);
  // 他手里的那杯茶
  const cs = p.px(HZ, 0.2);
  ctx.save(); ctx.globalAlpha = 0.6 + 0.4 * lk; dTea(ctx, hr.hand[0] + cs * 0.1, hr.hand[1] - cs * 0.05, cs, t); ctx.restore();
  for (const s of sts) if (s.P[2] < HZ - 0.02) { const q = scr(s); drawItem(ctx, s, q.x, q.y, q.S, t); }
  // 孩子（桌边，最近）
  for (const f of FOLKS) if (f.Z <= HZ) folkColumn(ctx, p, t, f);
  const kid = litL(ctx, cv, c => { const o = {}; for (const f of FOLKS) if (f.Z <= HZ) o[f.key] = folkDraw(c, p, t, f); return o; }, LO);
  // 大家胸口的光流回他身上
  const all = { ...res, ...kid };
  const fa = 1 - sm(t, TPULL + 0.3, TPULL + 1.0);
  FOLKS.forEach((f, k) => { const r = all[f.key]; if (r) streamTo(ctx, r.chest, hr.chest, t, fa * 0.85 * sm(t, TQ + f.d + 0.3, TQ + f.d + 0.8), k * 13 + 3); });
  // 他胸口的光；心跳时暖光铺满屋子
  const b = beat(t), joy = sm(t, TH - 0.05, TH + 0.4);
  FX.heartLight(ctx, hr.chest[0], hr.chest[1], t, { size: 0.3 + 0.2 * (1 - sm(t, G2, G2E)) + 0.4 * joy + 0.35 * b, R: p.px(HZ, 0.08), a: 0.4 + 0.2 * joy });
  if (t > TH && t < TH + 1.8) { const u = (t - TH) / 1.8; glow(ctx, hr.chest[0], hr.chest[1], 400 + 1800 * easeOut(u), WARM, 0.16 * (1 - u) * sm(u, 0, 0.05)); }
  // 灯下慢慢飘的灰尘
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([255, 230, 190], 0.22 + 0.25 * Math.min(1, lv)); ctx.beginPath();
  for (let i = 0; i < 22; i++) { const s = i * 3.9, ph = (t * 0.05 + hash(s)) % 1, x = lamp[0] + (hash(s + 1) - 0.5) * p.px(LAMP.Z, 1.6) + Math.sin(t * 0.4 + s) * 16, y = lamp[1] + 40 + ph * p.px(LAMP.Z, 1.7), r = 2 + 2.5 * hash(s + 2); ctx.moveTo(x + r, y); ctx.arc(x, y, r * Math.sin(ph * Math.PI), 0, 6.283); }
  ctx.fill(); ctx.restore();
  if (fg) { foreground(ctx, p, t, lv); E.bokeh(ctx, t, 0.35); }
  // 入场：从暗处亮起
  const inA = 1 - sm(t, T0, T0 + 0.55); if (inA > 0.003) { ctx.fillStyle = `rgba(4,3,8,${0.6 * inA})`; ctx.fillRect(0, 0, W, H); }
  return hr;
}

// ================= G03：拉远成满城灯火里的一扇窗 =================
const WY = 1.7 + 3.2 * 4, GW = 1.2, GH = 1.2 * 16 / 9, FZ = -0.2, BL = 6.4, BTOP = 32.6;
const D0 = 1100 * GW / W, D1 = 50;
function extCam(t) {
  // 先慢慢起步（0.3 秒），然后很快离开墙面，越拉越慢地停在全城（对数空间里 easeOut）
  const w = prog(t, TPULL, TC + 1.0), u = easeOut(w) * smooth(clamp(w / 0.12, 0, 1)), d = D0 * Math.pow(D1 / D0, u);
  const v = sm(t, TPULL + 0.3, TC + 1.0), tilt = ei(t, TC, TC + 2.0);
  return E.cam3({ cx: W / 2, cy: lerp(960, 860, v) + 430 * tilt, f: 1100, h: WY + 3.5 * v, z0: -d, x0: 0.6 * v, pitch: 0.04 * v });
}
const tWave = (Xw, Yw, Zw) => G3 + 0.15 + Math.hypot(Xw, Yw - WY, Zw) / 85;
const BLD = (() => {
  const r = K.mulberry32(77), out = [];
  // [Z, 栋数, 左右铺开, 最矮, 高差]：近处是一片矮楼（屋顶在镜头下面，铺满画面下半），远处高楼成天际线
  for (const [Z, n, spread, h0, hv] of [[9, 6, 40, 5, 8], [20, 8, 60, 6, 12], [34, 10, 80, 8, 26], [52, 11, 110, 12, 40], [82, 13, 160, 12, 56], [130, 16, 230, 14, 64], [210, 20, 340, 14, 76]]) for (let i = 0; i < n; i++) {
    const X0 = (r() - 0.5) * 2 * spread; if (Z < 25 && Math.abs(X0) < 8) continue;
    out.push({ X: X0, Z: Z + (r() - 0.5) * 9, w: 8 + r() * 14, h: h0 + r() * hv, dz: 8 + r() * 8, seed: Math.floor(r() * 1000), tank: r() > 0.55, ant: r() > 0.8 });
  }
  out.push({ X: -15.2, Z: 2.5, w: 15, h: 27, seed: 501, tank: true }, { X: 15.6, Z: 4.5, w: 15, h: 40, seed: 502, ant: true });
  out.push({ X: -27, Z: -30, w: 16, h: 52, seed: 601, side: true }, { X: 28, Z: -40, w: 14, h: 66, seed: 602, side: true });
  for (let i = 0; i < 11; i++) { // 他家楼前面一片矮楼：拉远后铺在画面下半，屋顶和窗里的灯一起亮
    const X0 = -36 + i * 7.2 + (r() - 0.5) * 3; out.push({ X: X0, Z: -12 - r() * 22, w: 6 + r() * 4, h: 4 + r() * 6, dz: 6 + r() * 4, seed: 700 + i, tank: r() > 0.6 });
  }
  return out;
})();
const STREETS = [8, 24, 42, 66, 100, 150, 230];
function bldDraw(ctx, p, b, t) {
  const dep = p.depth(b.Z); if (dep < 1.5) return;
  const A = p(b.X - b.w / 2, b.h, b.Z), B = p(b.X + b.w / 2, 0, b.Z);
  if (B[0] < -30 || A[0] > W + 30 || A[1] > H) return;
  const fog = clamp((dep - 6) / 260, 0, 0.8), near = !!b.side;
  const fa = b.Z < 0 && !near ? sm(dep, 3, 12) : 1; if (fa <= 0.01) return; // 镜头刚越过的近处矮楼慢慢显出来，不突然冒出一大块
  ctx.save(); ctx.globalAlpha *= fa; bldBody(ctx, p, b, t, dep, A, B, fog, near); ctx.restore();
}
function bldBody(ctx, p, b, t, dep, A, B, fog, near) {
  const top = mix(near ? [24, 20, 34] : [46, 42, 70], [70, 74, 120], fog), bot = mix(near ? [10, 8, 16] : [20, 18, 32], [50, 52, 90], fog);
  const g = ctx.createLinearGradient(0, A[1], 0, B[1]); g.addColorStop(0, rgba(top)); g.addColorStop(1, rgba(bot));
  ctx.fillStyle = g; ctx.fillRect(A[0], A[1], B[0] - A[0], B[1] - A[1]);
  const dz = b.dz || 10;
  if (b.h < p.h) { // 镜头比楼高：看得到屋顶面（往远处缩），屋顶上一盏天窗的光
    E.poly(ctx, p, [[b.X - b.w / 2, b.h, b.Z], [b.X + b.w / 2, b.h, b.Z], [b.X + b.w / 2, b.h, b.Z + dz], [b.X - b.w / 2, b.h, b.Z + dz]], mix(mix(top, [120, 130, 180], 0.12), [70, 74, 120], fog));
    if (hash(b.seed * 1.7) > 0.5) { const q = p(b.X + (hash(b.seed) - 0.5) * b.w * 0.5, b.h + 0.3, b.Z + dz * 0.4); glow(ctx, q[0], q[1], Math.max(6, p.px(b.Z + dz * 0.4, 1.4)), WARM, 0.25 * (1 - fog)); }
  }
  const px = p.px(b.Z, 1);
  ctx.fillStyle = rgba(mix([130, 140, 196], [86, 92, 140], fog), 0.45); ctx.fillRect(A[0], A[1], B[0] - A[0], Math.max(1.5, px * 0.3)); // 顶上被月光照亮的檐
  if (b.tank) { const q = p(b.X + b.w * 0.2, b.h, b.Z); ctx.fillStyle = rgba(mix(top, [0, 0, 0], 0.2)); ctx.beginPath(); ctx.ellipse(q[0], q[1] - px * 1.2, px * 1.0, px * 1.3, 0, 0, 7); ctx.fill(); }
  if (b.ant) { const q = p(b.X - b.w * 0.25, b.h, b.Z); ctx.fillStyle = rgba(top); ctx.fillRect(q[0] - Math.max(1, px * 0.08), q[1] - px * 5, Math.max(2, px * 0.16), px * 5); if (Math.sin(t * 3 + b.seed) > 0) glow(ctx, q[0], q[1] - px * 5, Math.max(8, px * 0.8), [255, 70, 60], 0.7); }
  if (near) return;
  const cols = Math.max(2, Math.floor(b.w / 2.4)), rows = Math.max(1, Math.floor((b.h - 1.2) / 3.2)), ww = px * 1.0, wh = px * 1.45;
  const lit = [], dark = [];
  for (let r = 0; r < rows; r++) for (let k = 0; k < cols; k++) {
    const Xw = b.X - b.w / 2 + (k + 0.5) * b.w / cols, Yw = 1.8 + r * 3.2, hq = hash(b.seed + r * 13.1 + k * 7.3);
    let on = hq > 0.78 ? 1 : 0;
    if (!on && hq > 0.3) { const tw = tWave(Xw, Yw, b.Z); on = sm(t, tw, tw + 0.3); }
    const q = p(Xw, Yw, b.Z); (on > 0.05 ? lit : dark).push([q[0], q[1], on, hq]);
  }
  // 灯火：每扇亮着的窗是一团竖着的柔光（外晕 → 中层 → 亮芯），暖黄为主，夹几盏白光和电视的蓝光；不画方格窗
  const COLS = [mix([255, 190, 116], [200, 160, 150], fog * 0.6), mix([255, 236, 204], [200, 190, 190], fog * 0.6), mix([150, 186, 255], [140, 150, 190], fog * 0.6)];
  const rr = Math.max(1.3, ww * 0.42);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let ci = 0; ci < 3; ci++) for (const [rk, al] of [[2.8, 0.035], [1.7, 0.08], [1.0, 0.24], [0.55, 0.75]]) {
    ctx.fillStyle = rgba(COLS[ci], al * (1 - fog * 0.4)); ctx.beginPath();
    for (const [x, y, on, hq] of lit) {
      if ((hq * 97 % 1 < 0.78 ? 0 : hq * 97 % 1 < 0.94 ? 1 : 2) !== ci) continue;
      const r = rr * rk * (0.55 + 0.45 * on) * (0.6 + 0.8 * (hq * 31 % 1)), jx = (hq * 53 % 1 - 0.5) * ww * 0.7, jy = (hq * 71 % 1 - 0.5) * wh * 0.5;
      ctx.moveTo(x + jx + r * 0.75, y + jy); ctx.ellipse(x + jx, y + jy, r * 0.75, r, 0, 0, 6.283);
    }
    ctx.fill();
  }
  ctx.restore();
}
function streetDraw(ctx, p, Z, t) {
  if (p.depth(Z) < 2) return;
  const r0 = Math.max(1.2, p.px(Z, 0.22)), pts = [];
  for (let Xs = -420; Xs <= 420; Xs += 7) { const q = p(Xs, 0.3, Z); if (q[0] < -20 || q[0] > W + 20) continue; pts.push(q); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [rk, al, c] of [[4, 0.06, WARM], [1, 0.75, [255, 214, 160]]]) { ctx.fillStyle = rgba(c, al); ctx.beginPath(); for (const q of pts) { ctx.moveTo(q[0] + r0 * rk, q[1]); ctx.arc(q[0], q[1], r0 * rk, 0, 6.283); } ctx.fill(); }
  ctx.restore();
}
function myBuilding(ctx, p, t, IC) {
  const A = p(-BL, BTOP, FZ), B = p(BL, 0, FZ), on = sm(t, G3, G3 + 0.6);
  const g = ctx.createLinearGradient(0, A[1], 0, B[1]); g.addColorStop(0, 'rgb(62,48,62)'); g.addColorStop(0.5, 'rgb(74,54,62)'); g.addColorStop(1, 'rgb(40,30,40)');
  ctx.fillStyle = g; ctx.fillRect(A[0], A[1], B[0] - A[0], B[1] - A[1]);
  ctx.fillStyle = 'rgba(150,150,200,0.4)'; ctx.fillRect(A[0], A[1], B[0] - A[0], Math.max(2, p.px(FZ, 0.35)));
  // 他家这扇窗的暖光照在外墙上（画在窗玻璃下面，不会把屋里那一帧冲白）
  const m = p(0, WY, 0), gw0 = p.px(0, GW), k = clamp(1.25 - gw0 / 600, 0, 1);
  if (k > 0) glow(ctx, m[0], m[1], Math.min(1000, gw0 * 3.6 + 90), [255, 200, 128], (0.4 + 0.08 * Math.sin(t * 2.4)) * k);
  // 窗与窗之间的壁柱（凸出墙面，有侧面明暗）
  for (const Xp of [-6.15, -3.75, -1.25, 1.25, 3.75, 6.15]) {
    const zf = FZ - 0.14, a0 = Xp - 0.2, a1 = Xp + 0.2;
    if (p.depth(zf) < 0.2) continue;
    if (p.x0 < a0) E.poly(ctx, p, [[a0, 0, zf], [a0, BTOP, zf], [a0, BTOP, FZ], [a0, 0, FZ]], [44, 32, 42]);
    if (p.x0 > a1) E.poly(ctx, p, [[a1, 0, zf], [a1, BTOP, zf], [a1, BTOP, FZ], [a1, 0, FZ]], [44, 32, 42]);
    const q0 = p(a0, BTOP, zf), q1 = p(a1, 0, zf), pg = ctx.createLinearGradient(q0[0], 0, q1[0], 0);
    pg.addColorStop(0, 'rgb(92,70,80)'); pg.addColorStop(0.6, 'rgb(80,60,70)'); pg.addColorStop(1, 'rgb(60,44,54)');
    ctx.fillStyle = pg; ctx.fillRect(q0[0], q0[1], q1[0] - q0[0], q1[1] - q0[1]);
  }
  // 每层的窗台挑檐（有厚度：正面 + 顶面/底面）
  for (let f = 0; f < 10; f++) {
    const yT = 1.7 + 3.2 * f - GH / 2 - 0.04, yB = yT - 0.16, zf = FZ - 0.34;
    if (p.depth(zf) < 0.15) continue;
    if (p.h > yT) E.poly(ctx, p, [[-BL - 0.1, yT, zf], [BL + 0.1, yT, zf], [BL + 0.1, yT, FZ], [-BL - 0.1, yT, FZ]], [104, 84, 92]);
    else E.poly(ctx, p, [[-BL - 0.1, yB, zf], [BL + 0.1, yB, zf], [BL + 0.1, yB, FZ], [-BL - 0.1, yB, FZ]], [34, 26, 34]);
    E.poly(ctx, p, [[-BL - 0.1, yB, zf], [BL + 0.1, yB, zf], [BL + 0.1, yT, zf], [-BL - 0.1, yT, zf]], [86, 66, 76]);
  }
  for (let f = 0; f < 10; f++) for (let k = -2; k <= 2; k++) {
    const Xw = k * 2.5, Yc = 1.7 + 3.2 * f, mine = f === 4 && k === 0;
    const o0 = p(Xw - GW / 2, Yc + GH / 2, FZ), o1 = p(Xw + GW / 2, Yc - GH / 2, FZ);
    if (o1[0] < -10 || o0[0] > W + 10 || o1[1] < -10 || o0[1] > H + 10) continue;
    const g0 = p(Xw - GW / 2, Yc + GH / 2, 0), g1 = p(Xw + GW / 2, Yc - GH / 2, 0), gw = g1[0] - g0[0], gh = g1[1] - g0[1];
    const hq0 = hash(f * 13.3 + k * 5.7 + 2), tw0 = tWave(Xw, Yc, 0), lv0 = hq0 > 0.55 ? 1 : (hq0 > 0.1 ? sm(t, tw0, tw0 + 0.3) : 0);
    if (!mine && gw < 40) { // 远了：和全城一样只剩一团柔光
      if (lv0 > 0.05) { const cx = (g0[0] + g1[0]) / 2, cy = (g0[1] + g1[1]) / 2; glow(ctx, cx, cy, gw * 2.4 + 6, WARM, 0.3 * lv0); glow(ctx, cx, cy, gw * 0.7 + 2, [255, 236, 200], 0.8 * lv0); }
      continue;
    }
    // 窗下的花箱（有些人家）
    if (!mine && hq0 > 0.62) {
      const yb = Yc - GH / 2 - 0.04, zf = FZ - 0.34;
      E.poly(ctx, p, [[Xw - 0.62, yb + 0.26, zf - 0.04], [Xw + 0.62, yb + 0.26, zf - 0.04], [Xw + 0.62, yb, zf - 0.04], [Xw - 0.62, yb, zf - 0.04]], [118, 70, 52]);
      for (let q = 0; q < 7; q++) { const s2 = p(Xw - 0.55 + q * 0.18, yb + 0.3 + 0.06 * hash(q + f), zf - 0.06), r2 = p.px(zf, 0.12 + 0.05 * hash(q * 3 + k)); ctx.fillStyle = q % 2 ? 'rgb(52,92,62)' : 'rgb(66,112,72)'; ctx.beginPath(); ctx.ellipse(s2[0], s2[1], r2, r2 * 0.8, 0, 0, 7); ctx.fill(); if (q % 3 === 1) { ctx.fillStyle = hq0 > 0.8 ? 'rgb(236,110,120)' : 'rgb(250,214,110)'; ctx.beginPath(); ctx.arc(s2[0], s2[1] - r2 * 0.5, r2 * 0.35, 0, 7); ctx.fill(); } }
    }
    const rg = ctx.createLinearGradient(o0[0], 0, o1[0], 0); rg.addColorStop(0, 'rgb(22,16,24)'); rg.addColorStop(0.5, 'rgb(36,26,34)'); rg.addColorStop(1, 'rgb(22,16,24)');
    ctx.fillStyle = rg; ctx.fillRect(o0[0], o0[1], o1[0] - o0[0], o1[1] - o0[1]);  // 窗洞侧壁
    if (mine) {
      if (gw > 150 && IC) ctx.drawImage(IC, g0[0], g0[1], gw, gh);
      else { const wg = ctx.createLinearGradient(0, g0[1], 0, g1[1]); wg.addColorStop(0, 'rgb(255,226,170)'); wg.addColorStop(1, 'rgb(236,150,84)'); ctx.fillStyle = wg; ctx.fillRect(g0[0], g0[1], gw, gh); ctx.fillStyle = 'rgba(60,30,30,0.45)'; ctx.beginPath(); ctx.arc(g0[0] + gw * 0.45, g0[1] + gh * 0.55, gw * 0.16, 0, 7); ctx.fill(); ctx.fillRect(g0[0] + gw * 0.25, g0[1] + gh * 0.66, gw * 0.4, gh * 0.34); }
      continue;
    }
    const hq = hash(f * 13.3 + k * 5.7 + 2), tw = tWave(Xw, Yc, 0), lv = hq > 0.55 ? 1 : (hq > 0.1 ? sm(t, tw, tw + 0.3) : 0);
    const wg = ctx.createLinearGradient(0, g0[1], 0, g1[1]);
    wg.addColorStop(0, rgba(mix([34, 38, 62], [226, 176, 124], lv))); wg.addColorStop(1, rgba(mix([22, 24, 42], [168, 96, 60], lv)));
    ctx.fillStyle = wg; ctx.fillRect(g0[0], g0[1], gw, gh);
    if (lv > 0.05) { // 窗帘和屋里人的影子
      ctx.fillStyle = rgba([120, 60, 50], 0.55 * lv); ctx.fillRect(g0[0], g0[1], gw * 0.24, gh); ctx.fillRect(g1[0] - gw * 0.2, g0[1], gw * 0.2, gh);
      if (hq > 0.78) { ctx.fillStyle = rgba([70, 34, 34], 0.5 * lv); ctx.beginPath(); ctx.arc(g0[0] + gw * (0.4 + 0.2 * hash(f + k)), g0[1] + gh * 0.55, gw * 0.13, 0, 7); ctx.fill(); ctx.fillRect(g0[0] + gw * (0.25 + 0.2 * hash(f + k)), g0[1] + gh * 0.65, gw * 0.32, gh * 0.35); }
    } else { ctx.fillStyle = 'rgba(170,190,240,0.08)'; ctx.beginPath(); ctx.moveTo(g0[0], g1[1]); ctx.lineTo(g0[0] + gw * 0.5, g0[1]); ctx.lineTo(g0[0] + gw * 0.8, g0[1]); ctx.lineTo(g0[0] + gw * 0.3, g1[1]); ctx.closePath(); ctx.fill(); }
    if (lv > 0.05) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const ig = ctx.createRadialGradient((g0[0] + g1[0]) / 2, g0[1] + gh * 0.35, 0, (g0[0] + g1[0]) / 2, g0[1] + gh * 0.35, gh * 0.6); ig.addColorStop(0, rgba([255, 230, 180], 0.18 * lv)); ig.addColorStop(1, 'rgba(255,200,140,0)'); ctx.fillStyle = ig; ctx.fillRect(g0[0], g0[1], gw, gh); ctx.restore(); }
    const fw = Math.max(3, gw * 0.06), fcol = lv > 0.05 ? 'rgb(214,196,176)' : 'rgb(120,108,112)'; ctx.fillStyle = fcol; // 窗框 + 中挺 + 横档
    ctx.fillRect(g0[0], g0[1], gw, fw); ctx.fillRect(g0[0], g1[1] - fw, gw, fw); ctx.fillRect(g0[0], g0[1], fw, gh); ctx.fillRect(g1[0] - fw, g0[1], fw, gh);
    ctx.fillRect(g0[0] + gw / 2 - fw * 0.4, g0[1], fw * 0.8, gh); ctx.fillRect(g0[0], g0[1] + gh * 0.3, gw, fw * 0.7);
    if (lv > 0.05) glow(ctx, (g0[0] + g1[0]) / 2, (g0[1] + g1[1]) / 2, Math.min(800, gw * 2.4), WARM, 0.09 * lv);
  }
  // 远了以后，他家这扇窗中心再亮一点，在满城灯火里认得出来
  const k2 = clamp(1.3 - gw0 / 50, 0, 1);
  if (k2 > 0) { glow(ctx, m[0], m[1], gw0 * 1.3 + 24, [255, 226, 170], 0.65 * k2); glow(ctx, m[0], m[1], gw0 * 3 + 70, [255, 196, 120], 0.3 * k2 * (1 + 0.15 * Math.sin(t * 2.4))); }
  return m;
}
function exterior(ctx, t) {
  const p = extCam(t), hz = p(0, p.h, 3000)[1];
  // 夜空：深蓝紫渐变 + 星云 + 月亮 + 星
  const g = ctx.createLinearGradient(0, hz - 1900, 0, hz); g.addColorStop(0, 'rgb(6,8,24)'); g.addColorStop(0.6, 'rgb(28,30,70)'); g.addColorStop(1, 'rgb(84,62,100)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  glow(ctx, 300, hz - 760, 760, [116, 92, 196], 0.14); glow(ctx, 860, hz - 1100, 640, [70, 140, 206], 0.1); glow(ctx, 540, hz - 60, 1000, [255, 170, 120], 0.16);
  const mx = 830, my = hz - 980; glow(ctx, mx, my, 220, [220, 230, 255], 0.4); ctx.fillStyle = 'rgb(238,242,255)'; ctx.beginPath(); ctx.arc(mx, my, 34, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,252,240,0.75)'; ctx.beginPath();
  for (let i = 0; i < 70; i++) { const x = hash(i * 2.3) * W, y = hz - 120 - hash(i * 5.9) * 1700, r = (0.8 + hash(i * 7.1) * 1.8) * (0.7 + 0.3 * Math.sin(t * 1.5 + i)); ctx.moveTo(x + r, y); ctx.arc(x, y, r, 0, 6.283); }
  ctx.fill();
  const gg = ctx.createLinearGradient(0, hz, 0, H); gg.addColorStop(0, 'rgb(40,32,52)'); gg.addColorStop(1, 'rgb(12,10,20)'); ctx.fillStyle = gg; ctx.fillRect(0, hz, W, H - hz);
  // 远 → 近：楼、街灯、雾层
  const list = BLD.filter(b => b.Z > 0).map(b => ({ Z: b.Z, f: () => bldDraw(ctx, p, b, t) })).concat(STREETS.map(Z => ({ Z, f: () => streetDraw(ctx, p, Z, t) })));
  for (const hzZ of [150, 70, 28]) list.push({ Z: hzZ, f: () => { const hg = ctx.createLinearGradient(0, hz - 260, 0, hz + 80); hg.addColorStop(0, 'rgba(90,92,150,0)'); hg.addColorStop(0.7, 'rgba(90,92,150,0.12)'); hg.addColorStop(1, 'rgba(90,92,150,0)'); ctx.fillStyle = hg; ctx.fillRect(0, hz - 260, W, 340); } });
  list.sort((a, b) => b.Z - a.Z).forEach(o => o.f());
  // 他家这栋楼（屋里那一帧画进他家的窗）
  const gw = p.px(0, GW), IC = gw > 150 ? new K.Canvas(W, H) : null;
  if (IC) interior(IC.getContext('2d'), t, false);
  const m = myBuilding(ctx, p, t, IC);
  BLD.filter(b => b.Z < 0).sort((a, b) => b.Z - a.Z).forEach(b => bldDraw(ctx, p, b, t));
  E.bokeh(ctx, t, 0.35 * sm(t, G3 + 0.6, G3 + 1.4));
  return m;
}

// ================= 片尾：金色粒子聚字（轻量） =================
const LINES = [
  { str: '关注依恋研究室', y: 640, size: 96, weight: 600, spacing: 0.14, col: [255, 208, 128], t0: TC + 0.15, step: 3, n: 900 },
  { str: '了解更多心理知识', y: 760, size: 56, weight: 500, spacing: 0.3, col: [255, 228, 180], t0: TC + 0.5, step: 2, n: 520 },
];
let TG = null;
function targets() {
  if (TG) return TG;
  const pw = extCam(TC + 0.15), m = pw(0, WY, 0);
  TG = LINES.map((Ln, li) => {
    const cv = new K.Canvas(W, 260), c = cv.getContext('2d');
    K.text(c, Ln.str, W / 2, 190, { size: Ln.size, weight: Ln.weight, spacing: Ln.spacing, color: [255, 255, 255] });
    const d = c.getImageData(0, 0, W, 260).data, pts = [];
    for (let yy = 0; yy < 260; yy += Ln.step) for (let xx = 0; xx < W; xx += Ln.step) if (d[(yy * W + xx) * 4 + 3] > 128) pts.push([xx, yy - 190 + Ln.y]);
    const r = K.mulberry32(91 + li), n = Math.min(Ln.n, pts.length), out = [];
    for (let i = 0; i < n; i++) {
      const [x, y] = pts.splice(Math.floor(r() * pts.length), 1)[0], fromWin = r() < 0.35;
      out.push({ x, y, sx: fromWin ? m[0] + (r() - 0.5) * 40 : r() * W, sy: fromWin ? m[1] + (r() - 0.5) * 40 : lerp(1000, 1800, r()), dl: (x / W) * 0.35 + r() * 0.35, cu: r() - 0.5, ph: r() * 6.28, sz: 0.7 + r() * 0.6 });
    }
    return out;
  });
  return TG;
}
function gatherLite(ctx, Q, Ln, t) {
  const age = t - Ln.t0; if (age < 0) return;
  const NB = 6, core = Array.from({ length: NB }, () => []), halo = Array.from({ length: NB }, () => []);
  for (const q of Q) {
    const f = easeInOut(prog(age, q.dl, q.dl + 1.25));
    const dx = q.x - q.sx, dy = q.y - q.sy, Lq = Math.hypot(dx, dy) || 1, curl = Math.sin(f * Math.PI) * 160 * q.cu;
    const x = lerp(q.sx, q.x, f) - dy / Lq * curl + Math.sin(t * 1.3 + q.ph) * 3 * (1 - f), y = lerp(q.sy, q.y, f) + dx / Lq * curl;
    const a = (0.3 + 0.7 * f) * (1 - 0.65 * sm(age, 1.7, 2.4)) * (0.8 + 0.2 * Math.sin(t * 9 + q.ph));
    if (a < 0.03) continue;
    const b = Math.min(NB - 1, Math.floor(a * NB));
    core[b].push(x, y, (f > 0.95 ? 1.7 : 2.4) * q.sz); if (f < 0.97) halo[b].push(x, y, 5 * q.sz);
  }
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const hc = mix(Ln.col, [255, 150, 70], 0.3), cc = mix(Ln.col, [255, 255, 240], 0.35);
  for (let b = 0; b < NB; b++) {
    const al = (b + 0.5) / NB;
    for (const [arr, c, k] of [[halo[b], hc, 0.16], [core[b], cc, 0.95]]) {
      if (!arr.length) continue;
      ctx.fillStyle = rgba(c, al * k); ctx.beginPath();
      for (let i = 0; i < arr.length; i += 3) { ctx.moveTo(arr[i] + arr[i + 2], arr[i + 1]); ctx.arc(arr[i], arr[i + 1], arr[i + 2], 0, 6.283); }
      ctx.fill();
    }
  }
  ctx.restore();
  const fl = age > 1.1 ? Math.exp(-(age - 1.1) * 4) : 0; // 落定时沿字面一道柔光
  if (fl > 0.02) glow(ctx, W / 2, Ln.y - Ln.size * 0.35, Ln.size * 4, mix(Ln.col, [255, 255, 255], 0.4), 0.22 * fl);
}

// ================= 主画面 =================
let WINM = [W / 2, 960];
function draw(ctx, t) {
  if (t < TPULL) interior(ctx, t, true);
  else WINM = exterior(ctx, t);
  const card = sm(t, TC, TC + 1.2);
  if (card > 0.003) { ctx.fillStyle = `rgba(4,5,14,${0.42 * card})`; ctx.fillRect(0, 0, W, H); }
  if (t > TC) { const Q = targets(); LINES.forEach((Ln, i) => gatherLite(ctx, Q[i], Ln, t)); }
}
// 「谢谢你，我需要你」：屋里唯一的大字，站在灯光里；纯色，不描边不渐变
const BIG = '谢谢你，我需要你', BIGY = 340, BIGS = 112;
function bigText(ctx, t) {
  const a = sm(t, TXT0, TXT0 + 0.3) * (1 - sm(t, TXT1, TXT1 + 0.35));
  if (a <= 0.003) return;
  const lit = sm(t, TH - 0.05, TH + 0.4);
  glow(ctx, W / 2, BIGY - BIGS * 0.35, 640, WARM, (0.1 + 0.08 * lit) * a);
  const col = mix([226, 204, 172], [255, 234, 192], lit);
  ctx.save(); ctx.font = `900 ${BIGS}px EQHeavy, Serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; // 只在这里设一次字体
  const ch = [...BIG], wd = ch.map(q => (q === '，' ? 0.62 : 1.04) * BIGS), tot = wd.reduce((s, v) => s + v, 0);
  let x = W / 2 - tot / 2;
  ch.forEach((q, i) => { // 逐字落定：轻微下落 + 余波
    const ti = TXT0 + i * 0.035, ai = a * sm(t, ti, ti + 0.25), u = prog(t, ti, ti + 0.5), dy = -18 * (1 - easeOut(u)) + 4 * Math.sin(u * Math.PI) * (u < 1 ? 1 : 0);
    ctx.fillStyle = rgba(col, ai);
    if (q === '，') { // 逗号自己画（字体里的全角逗号落点不稳）：圆点 + 往左下收的尾巴
      const cx = x + wd[i] * 0.32, cy = BIGY + dy + BIGS * 0.3, r = BIGS * 0.085;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(cx + r * 0.95, cy); ctx.quadraticCurveTo(cx + r * 0.9, cy + r * 2.4, cx - r * 1.1, cy + r * 3.0); ctx.quadraticCurveTo(cx + r * 0.1, cy + r * 1.9, cx - r * 0.2, cy + r * 0.6); ctx.closePath(); ctx.fill();
    } else ctx.fillText(q, x + wd[i] / 2, BIGY + dy);
    x += wd[i];
  });
  ctx.restore();
}
function over(ctx, t) {
  bigText(ctx, t);
  for (const Ln of LINES) {
    const real = sm(t, Ln.t0 + 1.35, Ln.t0 + 1.9);
    if (real > 0.003) L.rich(ctx, Ln.str, W / 2, Ln.y, { size: Ln.size, weight: Ln.weight, spacing: Ln.spacing, color: [255, 246, 228], keys: [Ln.str], keyColor: Ln.col, alpha: real, glowKey: 0.55 });
  }
}
const SFX = [
  { t: TNAME, k: 'pop' },          // 名牌弹进轨道
  { t: G2 + 0.8, k: 'click' },     // 灯暗下去
  { t: TQ, k: 'knock' },           // 敲门
  { t: TH, k: 'heart' },           // 灯亮满、心跳
  { t: G3 + 0.35, k: 'ding' },     // 满城灯火亮开
];
module.exports = { draw, over, SFX, END, T0 };
