'use strict';
// 《ESFJ》v8 EC7：G01–G04 + 片尾关注卡（竖屏 1080x1920）
//   G01 黑暗里，他送出去的汤碗、热茶、蛋糕、毛毯、任务卡一件件浮出来，地上连成一条光路，通到路尽头的他；他头顶的灯很暗。
//   G02 镜头沿光路慢慢走过去，每件东西身后那块空地亮起一束冷光，空的，没有人；走到他跟前停住（静：灰尘、蒸汽、烛火、呼吸）。
//   G03 一个人从右边走来，把一杯贴着「谢谢」便签的热茶放进他手里（全片唯一一次别人给他东西）；他愣一下，
//       光路从他脚下一路亮回去，灯亮满、心跳；镜头跟着亮起来的路往后退。
//   G04 拉远：这一帧缩进一扇窗，满城灯火里他这扇最亮。片尾金色粒子关注卡 4 秒。
// ---- 以下为 v7 的旧说明（拉远出窗 / 片尾粒子沿用） ----
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
const T0 = vs('G01') - 0.05, G1 = vs('G01'), G1E = ve('G01'), G2 = vs('G02'), G2E = ve('G02'), G3 = vs('G03'), G3E = ve('G03'), G4 = vs('G04'), G4E = ve('G04');
const TWALK = G3 + 0.05, TARR = TWALK + 1.25;                  // 有人从左边慢慢走进来
const TGIVE = Math.max(TARR + 0.9, at('G03', '谢谢') - 0.15);   // 杯子落进他手里（念到「谢谢」）
const TOFF = TGIVE - 0.95;                                     // 开始递
const TH = TGIVE + 0.4;                                        // 愣 0.4 秒 → 光路从脚下点亮 + 心跳
const TPULL = G4 + 0.05;                                       // 拉远出窗
const TC = G4E + 0.45, END = TC + 4.0;                         // 关注卡 4 秒
const TW0 = TPULL + 0.35;                                      // 满城灯火从他的窗往外亮

// ---------- 光路：从镜头这头一直通到他脚下 ----------
const HX = 0.25, HZ = 8, PZ0 = 0.3, PZ1 = HZ - 0.2, V = 4.0;
const pathX = z => HX + 0.85 * Math.sin((HZ - z) * 0.62) * clamp((HZ - z) / 1.4, 0, 1);
// 他送出去的东西：汤碗、热茶、蛋糕、毛毯、任务卡，一件件浮在路边
const ITEMS = [
  { k: 'bowl', Z: 1.5, s: 1 }, { k: 'tea', Z: 2.8, s: -1 }, { k: 'cake', Z: 4.1, s: 1 }, { k: 'blanket', Z: 5.4, s: -1 }, { k: 'card', Z: 7.5, s: -1 },
].map((o, i) => ({ ...o, i, X: o.k === 'card' ? HX - 0.58 : pathX(o.Z) + o.s * 0.6, Y: 1.0, t0: G1 + 0.12 + i * 0.4 }));
const NI = ITEMS.length, ISZ = 0.5;
const TREACH = ITEMS[NI - 1].t0 + 0.75;                        // 光路接到他脚下
const revealZ = t => { // 光路已经长到哪儿
  const ks = [[G1 - 0.1, PZ0]].concat(ITEMS.map(it => [it.t0 + 0.3, it.Z]), [[TREACH, PZ1]]);
  if (t <= ks[0][0]) return PZ0 - 0.01;
  for (let i = 0; i < ks.length - 1; i++) if (t <= ks[i + 1][0]) return lerp(ks[i][1], ks[i + 1][1], easeInOut(prog(t, ks[i][0], ks[i + 1][0])));
  return PZ1;
};
const tLit = z => TH + 0.05 + (HZ - z) / V;                    // 点亮的波从他脚下往回跑
const litK = (z, t) => sm(t, tLit(z), tLit(z) + 0.45);
const front = (z, t) => { const d = t - tLit(z); return d > 0 ? Math.exp(-d * 3.2) * sm(d, 0, 0.08) : 0; };

// ---------- 镜头 ----------
const CAMK = [
  [T0, { z0: -1.9, h: 3.4, pitch: 0.3, f: 1500, cy: 700 }],
  [G1E + 0.2, { z0: -1.3, h: 3.1, pitch: 0.28, f: 1500, cy: 700 }],
  [G2 - 0.25, { z0: -1.2, h: 3.05, pitch: 0.27, f: 1500, cy: 700 }],   // 停一拍再出发
  [G2E + 0.15, { z0: 5.0, h: 1.5, pitch: 0.035, f: 1180, cy: 620 }],   // 沿着光路走过去
  [G3 + 0.1, { z0: 5.12, h: 1.49, pitch: 0.03, f: 1190, cy: 615 }],    // 停顿：几乎不动
  [TH - 0.05, { z0: 5.4, h: 1.47, pitch: 0.03, f: 1220, cy: 610 }],
  [TH + 0.25, { z0: 5.36, h: 1.48, pitch: 0.035, f: 1215, cy: 612 }],
  [TH + 2.15, { z0: -1.3, h: 3.3, pitch: 0.31, f: 1400, cy: 700 }],    // 跟着亮起来的路往后退
  [TPULL, { z0: -1.5, h: 3.4, pitch: 0.32, f: 1400, cy: 700 }],
];
function camI(t) {
  const o = kf(Math.min(t, TPULL), CAMK);
  return E.cam3({ cx: W / 2, ...o, x0: lerp(pathX(clamp(o.z0 + 2.5, PZ0, HZ)), HX, sm(o.z0, 2.5, 5.0)) - 0.12 + 0.42 * sm(o.z0, 3.5, 5.0) });
}
// 镜头走到每件东西跟前的时刻（东西身后那块空地上的冷光在这时亮起）
const tNear = ITEMS.map(it => { let tt = G2 - 0.25; while (tt < G2E + 0.15 && kf(tt, CAMK).z0 < it.Z - 3.0) tt += 0.02; return tt; });
const EMPTY = ITEMS.map(it => ({ X: it.k === 'card' ? HX - 1.3 : it.X + it.s * 0.2, Z: it.Z + 0.6 }));

function lampV(t) { // 他头顶那盏灯：一直很暗 → 光路点亮时亮满（冲高回落）
  let v = 0.2 * sm(t, T0, G1 + 1.2) + 0.03 * Math.sin(t * 1.3);
  if (t > TREACH) v += 0.05 * Math.exp(-(t - TREACH) * 2);
  if (t >= TH) { const u = t - TH; v = lerp(v, 1.0, easeOut(prog(u, 0, 0.5))) + 0.2 * Math.exp(-u * 3) * prog(u, 0, 0.25); }
  return v;
}
const beat = t => (t < TH ? 0 : Math.exp(-(t - TH) * 2.2));
const WK = t => sm(t, TH, TH + 2.0);                            // 整个空间暖起来

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
const DRAW = { bowl: dBowl, tea: dTea, cake: dCake, blanket: dBlanket };
function drawItem(c, st, x, y, S, t) {
  if (S < 2) { glow(c, x, y, 26, WARM, 0.7 * st.a); return; }
  c.save(); c.globalAlpha *= st.a;
  glow(c, x, y, S * 1.55, WARM, 0.24 + 0.2 * st.gone);
  DRAW[st.it.k](c, x, y, S, t);
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


// 任务卡：夹板 + 一张清单，三行都打了勾（他揽下的活）
function dCard(c, x, y, S, t) {
  const w = S * 0.72, h = S * 0.92;
  c.save(); c.translate(x, y); c.rotate(-0.06 + 0.03 * Math.sin(t * 1.1));
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.roundRect(-w / 2 + S * 0.03, -h / 2 + S * 0.04, w, h, S * 0.05); c.fill();
  const g = c.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, 'rgb(176,120,72)'); g.addColorStop(1, 'rgb(128,82,48)');
  c.fillStyle = g; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, S * 0.05); c.fill();
  c.fillStyle = 'rgb(252,248,236)'; c.beginPath(); c.roundRect(-w * 0.42, -h * 0.38, w * 0.84, h * 0.82, S * 0.02); c.fill();
  const cg = c.createLinearGradient(0, -h / 2 - S * 0.05, 0, -h / 2 + S * 0.08); cg.addColorStop(0, 'rgb(236,236,240)'); cg.addColorStop(1, 'rgb(150,150,160)');
  c.fillStyle = cg; c.beginPath(); c.roundRect(-w * 0.22, -h / 2 - S * 0.05, w * 0.44, S * 0.13, S * 0.03); c.fill();
  c.fillStyle = 'rgb(214,96,84)'; c.fillRect(-w * 0.34, -h * 0.3, w * 0.4, S * 0.05);
  for (let r = 0; r < 3; r++) {
    const yy = -h * 0.12 + r * h * 0.19, cx = -w * 0.26;
    c.fillStyle = 'rgb(86,176,110)'; c.beginPath(); c.arc(cx, yy, S * 0.055, 0, 7); c.fill();
    c.strokeStyle = 'rgb(255,255,255)'; c.lineWidth = S * 0.025; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(cx - S * 0.028, yy); c.lineTo(cx - S * 0.006, yy + S * 0.024); c.lineTo(cx + S * 0.032, yy - S * 0.022); c.stroke();
    c.fillStyle = 'rgb(200,192,180)'; c.beginPath(); c.roundRect(-w * 0.14, yy - S * 0.022, w * (0.44 - 0.08 * r), S * 0.044, S * 0.02); c.fill();
  }
  c.restore();
}
// 贴在杯子上的便签「谢谢」
function dNote(c, x, y, S, a, rot) {
  if (a <= 0.01) return;
  c.save(); c.globalAlpha *= a; c.translate(x, y); c.rotate(rot);
  c.fillStyle = 'rgba(0,0,0,0.3)'; c.fillRect(-S / 2 + S * 0.05, -S / 2 + S * 0.07, S, S);
  const g = c.createLinearGradient(0, -S / 2, 0, S / 2); g.addColorStop(0, 'rgb(255,230,120)'); g.addColorStop(1, 'rgb(248,206,92)');
  c.fillStyle = g; c.beginPath(); c.moveTo(-S / 2, -S / 2); c.lineTo(S / 2, -S / 2); c.lineTo(S / 2, S * 0.36); c.lineTo(S * 0.36, S / 2); c.lineTo(-S / 2, S / 2); c.closePath(); c.fill();
  c.fillStyle = 'rgb(222,174,70)'; c.beginPath(); c.moveTo(S / 2, S * 0.36); c.lineTo(S * 0.36, S * 0.36); c.lineTo(S * 0.36, S / 2); c.closePath(); c.fill();
  c.fillStyle = 'rgba(214,160,60,0.45)'; c.fillRect(-S / 2, -S / 2, S, S * 0.16);
  K.text(c, '谢谢', 0, S * 0.17, { size: S * 0.4, weight: 700, color: [120, 64, 40], spacing: 0.06 });
  c.restore();
}
DRAW.card = dCard;

// ---------- 黑暗的空间：远处一点暖雾，地面往远处退 ----------
function bg(ctx, p, t, wk) {
  const hy = p(0, 0, 400)[1];
  // 天和地在地平线上接成同一种雾色，没有硬边
  const hz = mix([30, 20, 32], [104, 62, 50], wk), top = mix([5, 4, 9], [40, 22, 26], wk), fl1 = mix([4, 3, 7], [30, 18, 16], wk);
  const g = ctx.createLinearGradient(0, hy - 1100, 0, hy + 1100);
  g.addColorStop(0, rgba(top)); g.addColorStop(0.42, rgba(mix(top, hz, 0.55))); g.addColorStop(0.5, rgba(hz)); g.addColorStop(0.62, rgba(mix(hz, fl1, 0.45))); g.addColorStop(1, rgba(fl1));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 他身后的暖雾（灯亮满时整片铺开）
  const b = p(HX, 1.3, HZ + 4);
  glow(ctx, b[0], b[1], 900 + 700 * wk, mix([150, 80, 110], WARM, 0.5 + 0.5 * wk), 0.07 + 0.15 * wk);
  glow(ctx, W * 0.2, (hy > 0 ? hy : 200) - 200, 700, [110, 80, 170], 0.07 * (1 - wk));
}
// 地上那条光路：宽的柔光带 + 亮芯 + 路面上一颗颗光斑
function ribbon(ctx, p, t) {
  const rz = revealZ(t), N = 56;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < N; i++) {
    const za = lerp(PZ0, PZ1, i / N), zb = lerp(PZ0, PZ1, (i + 1) / N);
    if (za > rz || p.depth(zb) < 0.3) continue;
    const zc = (za + zb) / 2, lk = litK(zc, t), fr = front(zc, t), tip = Math.exp(-Math.max(0, rz - zc) * 1.6) * (t < TREACH + 0.6 ? 1 : 0);
    const b = 0.32 + 0.68 * lk + 0.8 * fr, col = mix([255, 158, 92], [255, 216, 150], lk);
    const ze = Math.min(zb, rz), xa = pathX(za), xb = pathX(ze);
    for (const [hw, al] of [[0.9, 0.05], [0.42, 0.13], [0.16, 0.42]]) {
      const w = hw * (1 + 0.6 * fr);
      E.poly(ctx, p, [[xa - w, 0.004, za], [xb - w, 0.004, ze], [xb + w, 0.004, ze], [xa + w, 0.004, za]], rgba(col, Math.min(1, al * (b + 0.9 * tip))));
    }
  }
  // 路面上的光斑（像一块块踏过的石头）
  for (let j = 0; j < 22; j++) {
    const z = lerp(PZ0 + 0.2, PZ1, (j + 0.5) / 22) + (hash(j * 3.3) - 0.5) * 0.2; if (z > rz || p.depth(z) < 0.5) continue;
    const lk = litK(z, t), q = p(pathX(z) + (hash(j * 7.1) - 0.5) * 0.36, 0.006, z), r = p.px(z, 0.07 + 0.05 * hash(j));
    const a = (0.25 + 0.5 * lk + 0.6 * front(z, t)) * (0.75 + 0.25 * Math.sin(t * 2.2 + j));
    ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(1, clamp(p.h / p.depth(z) + Math.sin(p.pitch), 0.12, 1));
    glow(ctx, 0, 0, r * 3, mix([255, 150, 90], [255, 214, 150], lk), 0.3 * a); glow(ctx, 0, 0, r, [255, 240, 210], 0.7 * a);
    ctx.restore();
  }
  // 路的尽头往前长时，头上一团亮光
  if (t < TREACH + 0.4 && rz > PZ0) { const q = p(pathX(rz), 0.05, rz), a = 1 - sm(t, TREACH, TREACH + 0.4); glow(ctx, q[0], q[1], p.px(rz, 0.9), [255, 200, 130], 0.4 * a); glow(ctx, q[0], q[1], p.px(rz, 0.25), [255, 244, 220], 0.7 * a); }
  ctx.restore();
}
// 每件东西旁边那块空地：一束冷光照着，空的
function emptySpot(ctx, p, t, i) {
  const e = EMPTY[i], on = sm(t, tNear[i], tNear[i] + 0.7) * (1 - sm(t, tLit(e.Z) - 0.1, tLit(e.Z) + 0.35)), dep = p.depth(e.Z);
  if (on <= 0.01 || dep < 0.9) return;
  const col = mix([150, 170, 215], [255, 200, 140], litK(e.Z, t)), top = p(e.X, 3.0, e.Z), bot = p(e.X, 0, e.Z);
  E.cone(ctx, top[0], top[1], bot[1], p.px(e.Z, 0.22), p.px(e.Z, 1.0), col, 0.2 * on);
  E.pool(ctx, p, e.X, e.Z, 0.65, col, 0.45 * on);
  const q = p(e.X, 0.01, e.Z); ctx.save(); ctx.translate(q[0], q[1]); ctx.scale(1, clamp(p.h / dep + Math.sin(p.pitch), 0.12, 1)); glow(ctx, 0, 0, p.px(e.Z, 0.28), [235, 240, 255], 0.22 * on); ctx.restore();
}
function itemAt(i, t) {
  const it = ITEMS[i], u = prog(t, it.t0, it.t0 + 0.6);
  if (u <= 0) return null;
  const lk = litK(it.Z, t), fr = front(it.Z, t);
  return { i, it, a: clamp(u * 1.8, 0, 1), s: backOut(u) * (1 + 0.12 * fr), gone: 0.3 * lk + 0.6 * fr, P: [it.X, lerp(0.45, it.Y, easeOut(u)) + 0.04 * Math.sin(t * 1.4 + i * 1.7), it.Z] };
}
function itemDraw(ctx, p, t, st) {
  const dep = p.depth(st.P[2], st.P[1]), fa = sm(dep, 1.0, 1.9); if (fa < 0.02) return; // 镜头擦身而过时淡掉，不压字幕
  st = { ...st, a: st.a * fa };
  const q = p(...st.P), S = p.px(st.P[2], ISZ, st.P[1]) * st.s;
  if (q[0] < -S * 1.5 || q[0] > W + S * 1.5) return;
  E.pool(ctx, p, st.P[0], st.P[2], 0.55, WARM, (0.14 + 0.3 * st.gone) * st.a);
  drawItem(ctx, st, q[0], q[1], S, t);
}

// ---------- 递茶的人 ----------
const GIVER = 'isfj-female', GZ = HZ + 0.12, GX0 = 2.6, GX1 = HX + 1.12; // 从右边走来（他面朝右、托东西的手也在右边）
function giverX(t) { return lerp(GX0, GX1, easeInOut(prog(t, TWALK, TARR))); }
function heroPose(t) {
  const notice = sm(t, TWALK + 0.6, TWALK + 1.2), daze = sm(t, TGIVE - 0.05, TGIVE + 0.1), joy = sm(t, TH - 0.05, TH + 0.3), b = beat(t);
  let look = [0.25 * Math.sin(t * 0.5), 0.55];                              // 一开始低着头
  look = [lerp(look[0], 0.9, notice), lerp(look[1], -0.1, notice)];         // 看向走来的人
  look = [lerp(look[0], 0.6, daze), lerp(look[1], 0.6, daze)];              // 看手里的杯子
  look = [lerp(look[0], 0.5, joy), lerp(look[1], -0.2, joy)];               // 抬头笑
  const breathe = Math.sin(t * 1.5) * 1.6;
  return {
    m: 1.75, umbrella: false, cake: false, book: true, shadow: 0,
    eyes: t < TGIVE ? 'open' : t < TH ? 'wide' : 'happy', mouth: t < TGIVE ? 'flat' : t < TH ? 'o' : 'smile',
    look, nod: lerp(0.45, -0.05, notice) + 0.25 * daze * (1 - joy) - 0.2 * joy, tilt: 0.12 * (1 - notice),
    lean: 0.02 * (1 - notice), rs: -0.15 + 0.06 * Math.exp(-Math.max(0, t - TGIVE) * 6) * (t > TGIVE ? 1 : 0), re: -0.2,
    glow: 0.08 + 0.22 * joy + 0.25 * b, warm: 0.3 * joy, bob: breathe + b * 7,
  };
}

// ---------- 灯下飘的灰尘（世界坐标，跟着镜头有视差） ----------
const DUST = Array.from({ length: 70 }, (_, i) => ({ X: (hash(i * 1.7) - 0.5) * 6, Y: 0.2 + hash(i * 3.1) * 2.8, Z: 0.6 + hash(i * 5.3) * 11, ph: hash(i * 7.9) * 6.28, r: 0.008 + 0.012 * hash(i * 9.1) }));
function dust(ctx, p, t, lv) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = rgba([255, 226, 186], 0.3 + 0.25 * Math.min(1, lv)); ctx.beginPath();
  for (const d of DUST) {
    const X = d.X + Math.sin(t * 0.25 + d.ph) * 0.2, Y = d.Y + Math.sin(t * 0.18 + d.ph * 2) * 0.15 - ((t * 0.04 + d.ph) % 1) * 0.2, dep = p.depth(d.Z, Y);
    if (dep < 0.5) continue;
    const q = p(X, Y, d.Z), near = Math.exp(-Math.abs(X - pathX(clamp(d.Z, PZ0, HZ))) * 0.7), r = Math.min(9, p.px(d.Z, d.r, Y)) * (0.5 + 0.5 * near) * (0.7 + 0.3 * Math.sin(t * 1.7 + d.ph));
    if (r < 0.6) continue; ctx.moveTo(q[0] + r, q[1]); ctx.arc(q[0], q[1], r, 0, 6.283);
  }
  ctx.fill(); ctx.restore();
}

// ---------- 一整帧 ----------
let HERO_CH = [W / 2, 900];
function interior(ctx, t, fg = true) {
  const p = camI(t), lv = lampV(t), wk = WK(t), cv = new K.Canvas(W, H);
  bg(ctx, p, t, wk);
  ribbon(ctx, p, t);
  // 他头顶那盏灯
  E.pendant(ctx, p, HX, HZ + 0.05, { ht: 3.6, drop: 1.25, on: Math.min(1.3, 0.25 + lv), R: 1.3 + 0.8 * lv });
  const lamp = p(HX, 3.6 - 1.25, HZ + 0.05);
  // 光路点亮那一下：从他脚下炸开一团光
  if (t > TH - 0.02 && t < TH + 2.2) { const u = (t - TH) / 2.2, f0 = p(HX, 0.02, HZ); glow(ctx, f0[0], f0[1], p.px(HZ, 0.6 + 3.4 * easeOut(u)), [255, 214, 150], 0.5 * (1 - u)); }
  // 人物（他 + 递茶的人），按灯位打光
  const gx = giverX(t), gA = sm(t, TWALK, TWALK + 0.4), walkP = prog(t, TWALK, TARR), gStep = Math.abs(Math.sin(walkP * Math.PI * 4)) * (walkP < 1 ? 1 : 0);
  const LO = { x: lamp[0], y: lamp[1] + 60, r: 900 + 700 * lv, k: 0.08 + 0.26 * Math.min(1, lv), amb: lerp(0.62, 0.3, Math.min(1, lv)) };
  if (gA > 0.01) E.pool(ctx, p, gx - 0.15, GZ, 0.8, WARM, 0.22 * gA);       // 她手里那杯茶在地上照出的一点光
  const res = litL(ctx, cv, c => ({
    g: gA > 0.01 ? E.folk3(c, p, GIVER, gx, GZ, { m: 1.62, a: gA, flip: true, warm: 0.1 + 0.3 * wk, shadow: 0.35, bob: gStep * p.px(GZ, 0.03), inner: 0.15 + 0.4 * beat(t + 0.1) }) : null,
    h: E.hero3(c, p, HX, HZ, heroPose(t)),
  }), LO);
  const hr = res.h; HERO_CH = hr.chest;
  // 杯子：先在她手里，递过去，落进他手里
  const cupS = p.px(HZ, 0.24);
  if (res.g && gA > 0.01) {
    const gr = res.g, sx = gr.chest[0] - p.px(GZ, 0.2), sy = gr.chest[1] + p.px(GZ, 0.06);
    const u = easeInOut(prog(t, TOFF, TGIVE)), back = sm(t, TGIVE + 0.15, TGIVE + 0.7);
    const hand = [hr.hand[0] + cupS * 0.05, hr.hand[1] - cupS * 0.3];
    const cx = lerp(sx, hand[0], u), cy = lerp(sy, hand[1], u) - Math.sin(u * Math.PI) * cupS * 0.15;
    // 她托着杯子的手臂（短、有体积：袖子 + 手），递完慢慢收回
    const sh = [gr.chest[0] - p.px(GZ, 0.05), gr.chest[1] - p.px(GZ, 0.07)];
    const hx = lerp(cx + cupS * 0.32, gr.chest[0] - p.px(GZ, 0.08), back), hy = lerp(cy + cupS * 0.18, gr.chest[1] + p.px(GZ, 0.1), back);
    ctx.save(); ctx.globalAlpha *= gA; ctx.lineCap = 'round';
    ctx.strokeStyle = rgba(mix([92, 168, 164], [255, 214, 160], 0.25 * wk)); ctx.lineWidth = p.px(GZ, 0.09); ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.quadraticCurveTo((sh[0] + hx) / 2, Math.max(sh[1], hy) + p.px(GZ, 0.08), hx, hy); ctx.stroke();
    ctx.fillStyle = rgba(mix([226, 178, 146], [255, 220, 180], 0.3 * wk)); ctx.beginPath(); ctx.ellipse(hx, hy, p.px(GZ, 0.05), p.px(GZ, 0.04), 0, 0, 7); ctx.fill(); ctx.restore();
    const fx = u >= 1 ? hand[0] : cx, fy = u >= 1 ? hand[1] : cy;
    glow(ctx, fx, fy, cupS * 2.4, WARM, 0.3 * gA);
    ctx.save(); ctx.globalAlpha *= gA; dTea(ctx, fx, fy, cupS, t); ctx.restore();
    dNote(ctx, fx - cupS * 0.08, fy + cupS * 0.06, cupS * 0.7, gA, -0.12 + 0.03 * Math.sin(t * 1.8));
  }
  // 他胸口那点光：一直很小 → 点亮时撑满
  const b = beat(t), joy = sm(t, TH - 0.05, TH + 0.4), reach = t > TREACH ? Math.exp(-(t - TREACH) * 2.5) : 0;
  FX.heartLight(ctx, hr.chest[0], hr.chest[1], t, { size: 0.22 + 0.25 * reach + 0.06 * Math.sin(t * 1.5) + 0.75 * joy + 0.45 * b, R: p.px(HZ, 0.08), a: 0.35 + 0.35 * joy });
  if (t > TH && t < TH + 1.8) { const u = (t - TH) / 1.8; glow(ctx, hr.chest[0], hr.chest[1], 300 + 1500 * easeOut(u), WARM, 0.18 * (1 - u)); }
  // 空地 + 东西（远 → 近）
  const objs = [];
  for (let i = 0; i < NI; i++) { objs.push({ Z: EMPTY[i].Z, f: () => emptySpot(ctx, p, t, i) }); const st = itemAt(i, t); if (st) objs.push({ Z: st.P[2], f: () => itemDraw(ctx, p, t, st) }); }
  objs.sort((a, c) => c.Z - a.Z).forEach(o => o.f());
  dust(ctx, p, t, lv);
  if (fg) E.bokeh(ctx, t, 0.3 + 0.3 * wk);
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
const tWave = (Xw, Yw, Zw) => TW0 + Math.hypot(Xw, Yw - WY, Zw) / 85;
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
  const A = p(-BL, BTOP, FZ), B = p(BL, 0, FZ);
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
    const hq0 = hash(f * 13.3 + k * 5.7 + 2), tw0 = tWave(Xw, Yc, 0), lv0 = 0.62 * (hq0 > 0.6 ? 1 : (hq0 > 0.15 ? sm(t, tw0, tw0 + 0.4) : 0)); // 别人家的窗暗一档，他这扇最亮
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
      if (gw > 150 && IC) {
        ctx.drawImage(IC, g0[0], g0[1], gw, gh);
        const kk = clamp(1.2 - gw / 900, 0, 1); // 越远，窗里那团暖光越亮（灯亮满了）
        if (kk > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const ig = ctx.createRadialGradient((g0[0] + g1[0]) / 2, g0[1] + gh * 0.45, 0, (g0[0] + g1[0]) / 2, g0[1] + gh * 0.45, gh * 0.7); ig.addColorStop(0, rgba([255, 214, 150], 0.32 * kk)); ig.addColorStop(1, rgba([255, 170, 100], 0.12 * kk)); ctx.fillStyle = ig; ctx.fillRect(g0[0], g0[1], gw, gh); ctx.restore(); }
      }
      else { const wg = ctx.createLinearGradient(0, g0[1], 0, g1[1]); wg.addColorStop(0, 'rgb(255,226,170)'); wg.addColorStop(1, 'rgb(236,150,84)'); ctx.fillStyle = wg; ctx.fillRect(g0[0], g0[1], gw, gh); ctx.fillStyle = 'rgba(60,30,30,0.45)'; ctx.beginPath(); ctx.arc(g0[0] + gw * 0.45, g0[1] + gh * 0.55, gw * 0.16, 0, 7); ctx.fill(); ctx.fillRect(g0[0] + gw * 0.25, g0[1] + gh * 0.66, gw * 0.4, gh * 0.34); }
      continue;
    }
    const hq = hash(f * 13.3 + k * 5.7 + 2), tw = tWave(Xw, Yc, 0), lv = 0.62 * (hq > 0.6 ? 1 : (hq > 0.15 ? sm(t, tw, tw + 0.4) : 0));
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
  const k2 = clamp(1.25 - gw0 / 320, 0, 1);
  if (k2 > 0) { glow(ctx, m[0], m[1], gw0 * 1.1 + 30, [255, 236, 196], 0.75 * k2); glow(ctx, m[0], m[1], gw0 * 3.2 + 110, [255, 196, 120], 0.4 * k2 * (1 + 0.15 * Math.sin(t * 2.4))); }
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
  E.bokeh(ctx, t, 0.35 * sm(t, TW0 + 0.4, TW0 + 1.2));
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
function over(ctx, t) {
  for (const Ln of LINES) {
    const real = sm(t, Ln.t0 + 1.35, Ln.t0 + 1.9);
    if (real > 0.003) L.rich(ctx, Ln.str, W / 2, Ln.y, { size: Ln.size, weight: Ln.weight, spacing: Ln.spacing, color: [255, 246, 228], keys: [Ln.str], keyColor: Ln.col, alpha: real, glowKey: 0.55 });
  }
}
const SFX = [
  { t: ITEMS[0].t0 + 0.05, k: 'pop' },  // 第一件东西在黑暗里浮出来
  { t: TREACH, k: 'tick' },             // 光路接到他脚下
  { t: TGIVE, k: 'pop' },               // 那杯茶落进他手里
  { t: TH, k: 'heart' },                // 光路点亮、心跳
  { t: TW0 + 0.2, k: 'ding' },          // 满城灯火亮开
];
module.exports = { draw, over, SFX, END, T0 };
