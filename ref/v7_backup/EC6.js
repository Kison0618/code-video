'use strict';
// 《ESFJ》v7 · EC6：家与伴侣（F01–F11）。一个有纵深的暖色家（egenv 透视：后墙窗/日历/置物架/门，吊灯下的餐桌），傍晚→夜。
// F01 开灯、摆碗、叠衣、拉窗帘；F02 家规卷轴 ✓✗、全家举手；F03 两人暖光相连、伞撑过对方、日历圈生日纪念日、端蛋糕；
// F04 给伴侣盛汤，同时指着乱放的靴子；F05 镜头穿过窗户 → 夜里山路上 ISTP 骑摩托冲进画面；F06 摩托翘头火花，镜头升空：
// 他家暖灯是圆心，摩托光轨一圈圈绕出去；F07 光轨绕回家门口，镜头冲进门（暖光盖满）→ 屋里披毯子、递热茶，头上火花熄灭；
// F08 他放下外面带回的东西，ESFJ 一件件收上架，两人周围一圈半青半暖的光；F09 孩子穿暖喂饱，自己吃剩菜；F10 家规卷轴对孩子；
// F11 孩子对客人鞠躬他发光骄傲 / 孩子做鬼脸他脸红捂脸。所有时间按句取（vs/ve/at）。
const X = require('./ehk');
const E = require('./egenv');
const B = require('./ebw');
const MB = require('./mb');
const { K, vs, ve, at } = X;
const { W, H, clamp, lerp, mix, prog, smooth, easeInOut, easeOut, easeIn, hash, glow, rgba } = K;
const { WARM, CANDLE } = E;
const TEALC = [110, 214, 222], SPARK = [255, 184, 88], IST = [232, 186, 60];

const sm = (t, a, b) => smooth(prog(t, a, b));
const bump = (t, a, b) => Math.sin(prog(t, a, b) * Math.PI);
const spring = (s, k = 8, w = 15) => s <= 0 ? 0 : 1 - Math.exp(-s * k) * Math.cos(s * w);
const popIn = (t, t0) => B.popIn(t, t0);
const gait = (t, moving, hz = 2.3) => { const ph = t * hz * Math.PI * 2; return moving ? { bob: Math.abs(Math.sin(ph)) * 7, hipB: Math.sin(ph) * 0.35, hipF: -Math.sin(ph) * 0.35 } : { bob: 0, hipB: 0, hipF: 0 }; };

// ---------- 时间点 ----------
const T = (() => {
  const o = { T0: vs('F01') - 0.05, T1: vs('G01') - 0.05 };
  o.lampOn = o.T0 + 0.1;
  o.f1 = vs('F01'); o.gong = at('F01', '供给者'); o.eat = at('F01', '吃'); o.wear = at('F01', '穿'); o.live = at('F01', '住'); o.tidy = at('F01', '妥妥'); o.e1 = ve('F01');
  o.f2 = vs('F02'); o.set = at('F02', '一整套'); o.dos = at('F02', '该做'); o.donts = at('F02', '不该做'); o.hope = at('F02', '也希望'); o.agree = at('F02', '意见一致');
  o.f3 = vs('F03'); o.loyal = at('F03', '忠诚'); o.share = at('F03', '同甘'); o.bday = at('F03', '生日'); o.anniv = at('F03', '纪念日'); o.never = at('F03', '一个都');
  o.f4 = vs('F04'); o.boss = at('F04', '家长作风'); o.care = at('F04', '照顾对方'); o.own = at('F04', '按自己'); o.ask = at('F04', '要求'); o.e4 = ve('F04');
  o.f5 = vs('F05'); o.istp = at('F05', '是') + 0.22;
  o.f6 = vs('F06'); o.adv = at('F06', '渴望'); o.free = at('F06', '自由'); o.esfj = at('F06', '外向') - 0.35; o.gentle = at('F06', '温柔'); o.soothe6 = at('F06', '安抚'); o.e6 = ve('F06');
  o.f7 = vs('F07'); o.enough = at('F07', '闯够'); o.need = at('F07', '需要'); o.greet = at('F07', '迎接'); o.home = at('F07', '回家'); o.calm = at('F07', '安抚'); o.rest = at('F07', '躁动'); o.e7 = ve('F07');
  o.f8 = vs('F08'); o.out = at('F08', '一个'); o.keep = at('F08', '一个', 1); o.comp = at('F08', '互补'); o.e8 = ve('F08');
  o.f9 = vs('F09'); o.yi = at('F09', '衣'); o.shi = at('F09', '食'); o.zhu = at('F09', '住'); o.xing = at('F09', '行'); o.full = at('F09', '周全'); o.self = at('F09', '委屈'); o.e9 = ve('F09');
  o.f10 = vs('F10'); o.strict = at('F10', '严格'); o.req = at('F10', '要求'); o.word = at('F10', '言行'); o.e10 = ve('F10');
  o.f11 = vs('F11'); o.polite = at('F11', '孩子有'); o.proud = at('F11', '骄傲'); o.rude = at('F11', '孩子没'); o.awk = at('F11', '尴尬'); o.e11 = ve('F11');
  o.bowl = [0, 1, 2].map(i => o.eat - 0.35 + i * 0.26);
  o.win0 = o.e4 + 0.12; o.win1 = o.f5 + 0.45;          // 推过窗户 → 窗外山路
  o.up = o.esfj; o.up0 = o.up - 0.85;                   // 镜头升空
  o.arrive = o.need - 0.35; o.dive1 = o.arrive + 0.6;   // 摩托回到门口 → 冲进门，暖光盖满
  o.item = [0, 1, 2].map(i => o.out + 0.05 + i * 0.32);
  o.stow = [0, 1, 2].map(i => o.keep + 0.05 + i * 0.3);
  o.kidIt = [o.yi, o.shi, o.zhu, o.xing].map(v => v - 0.1);
  o.guestIn = o.polite - 0.95;
  return o;
})();

// ---------- 镜头（屋内，一套 3D：后墙 Z=9，左右墙 X=±3.2，层高 3） ----------
const S = (f, h, z0, x0, cy, pitch = 0.03) => ({ f, h, z0, x0, cy, pitch });
const SH = {
  W0: S(1060, 1.8, 0.0, -0.3, 640, 0.12), W1: S(1140, 1.8, 1.1, -0.1, 640, 0.13),
  M: S(1250, 1.82, 2.55, -0.05, 650, 0.18), M1: S(1290, 1.8, 2.8, -0.12, 640, 0.16),
  SC: S(580, 1.95, 6.3, 0.25, 640, 0), M2: S(1150, 1.85, 1.8, 0.05, 650, 0.16),
  TW: S(1320, 1.72, 3.1, -0.22, 620, 0.1), CAL: S(1250, 1.92, 7.35, 0.31, 690, 0), TW2: S(1260, 1.75, 2.95, -0.02, 630, 0.12),
  SHO: S(1250, 1.7, 2.2, 0.35, 560, 0.15),
  WA: S(1250, 2.45, 2.7, -1.12, 500, 0), WB: S(1250, 1.71, 8.78, -1.12, 525, 0),
  DR: S(1150, 1.45, 4.2, 1.5, 620, 0.02), DR2: S(1230, 1.45, 4.75, 1.6, 615, 0.02),
  M3: S(1230, 1.52, 2.5, -0.15, 560), M4: S(1300, 1.72, 2.85, -0.12, 610, 0.12),
  KID: S(1150, 1.25, 0.8, 0.05, 580, 0.04), KIDH: S(1200, 1.35, 1.05, -0.15, 570, 0.04),
  SC2: S(1100, 1.55, 1.3, -0.02, 700, -0.06),
  WIDE: S(1100, 1.35, 0.85, 0.35, 600), PRO: S(1200, 1.3, 1.2, -0.2, 570), WIDE2: S(1120, 1.32, 1.0, 0.4, 600), AWK: S(1200, 1.32, 1.2, -0.05, 580),
};
const KEYS1 = [
  [T.T0, SH.W0], [T.T0 + 0.6, SH.W1], [T.eat - 0.2, SH.M], [T.tidy + 0.4, SH.M1],
  [T.set - 0.05, SH.M1], [T.set - 0.04, { ...SH.SC, f: 530, z0: 6.15 }], [T.set + 0.6, SH.SC], [T.hope - 0.12, { ...SH.SC, f: 620 }], [T.hope - 0.11, { ...SH.M2, z0: 1.5 }], [T.hope + 0.6, SH.M2], [ve('F02') + 0.1, SH.M2],
  [T.f3 + 0.35, SH.TW], [T.bday - 0.5, SH.TW], [T.bday - 0.05, SH.CAL], [T.never - 0.3, SH.CAL], [T.never + 0.15, SH.TW2],
  [T.care - 0.2, SH.TW2], [T.own - 0.3, SH.TW], [T.own + 0.35, SH.SHO], [T.e4 - 0.05, SH.SHO],
  [T.win0 + 0.4, SH.WA], [T.win1, SH.WB]];
const KEYS2 = [
  [T.dive1, SH.DR], [T.e7 + 0.2, SH.DR2], [T.f8 - 0.13, SH.DR2], [T.f8 - 0.12, SH.M3], [T.comp - 0.2, SH.M3], [T.comp + 0.5, SH.M4],
  [T.f9 - 0.25, SH.M4], [T.f9 - 0.24, SH.KID], [T.self - 0.3, SH.KID], [T.self + 0.25, SH.KIDH],
  [T.f10 - 0.3, SH.KIDH], [T.f10 + 0.3, SH.SC2], [T.f11 - 0.2, SH.SC2], [T.polite - 0.2, SH.WIDE], [T.proud - 0.3, SH.WIDE], [T.proud + 0.2, SH.PRO],
  [T.rude - 0.3, SH.PRO], [T.rude + 0.1, SH.WIDE2], [T.awk - 0.15, SH.WIDE2], [T.awk + 0.4, SH.AWK], [T.T1 + 1, SH.AWK]];
function shotAt(t, keys, ease = easeInOut) {
  if (t <= keys[0][0]) return { ...keys[0][1] };
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) {
    const a = keys[i - 1][1], b = keys[i][1], u = (keys[i][0] - keys[i - 1][0]) < 0.03 ? 1 : ease(prog(t, keys[i - 1][0], keys[i][0])), o = {};
    for (const k in a) o[k] = lerp(a[k], b[k], u);
    return o;
  }
  return { ...keys[keys.length - 1][1] };
}
function camIn(t) {
  let s;
  if (t < T.win0 + 0.4) s = shotAt(t, KEYS1);
  else s = shotAt(t, KEYS1, u => u * u * (1.6 - 0.6 * u)); // 推窗：越推越快
  if (t >= T.dive1 - 0.1) s = shotAt(t, KEYS2);
  const br = t < T.win0 ? 1 : 0; // 呼吸感（推窗时关掉）
  s.z0 += 0.05 * Math.sin(t * 0.37) * br; s.x0 += 0.035 * Math.sin(t * 0.29 + 1) * br; s.h += 0.015 * Math.sin(t * 0.43) * br;
  return E.cam3({ cx: W / 2, ...s });
}

// ---------- 道具（屏幕坐标 x,y = 底部中心；s = 该深度 1 米多少像素） ----------
const poly2 = (ctx, pts) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); };
function ell(ctx, x, y, rx, ry, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, 7); ctx.fill(); }
function steam(ctx, x, y, s, t, a = 1, n = 4, hgt = 0.38) {
  if (a <= 0.01) return;
  for (let i = 0; i < n; i++) {
    const ph = (t * 0.5 + i / n) % 1, yy = y - ph * s * hgt, xx = x + Math.sin(ph * 5 + t * 1.3 + i * 2) * s * 0.035, r = s * (0.03 + 0.06 * ph);
    const g = ctx.createRadialGradient(xx, yy, 0, xx, yy, r); g.addColorStop(0, `rgba(255,250,240,${0.3 * a * Math.sin(ph * Math.PI)})`); g.addColorStop(1, 'rgba(255,250,240,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(xx, yy, r, 0, 7); ctx.fill();
  }
}
// 碗：fill 'rice' | 'soup' | 'left'（剩菜） | 'big'（满满一大碗）
function bowl(ctx, x, y, s, col, fill = 'rice', sq = 0, size = 1) {
  const r = 0.09 * s * size;
  ctx.save(); ctx.translate(x, y); ctx.scale(1 + sq * 0.2, 1 - sq * 0.2);
  ell(ctx, 0, 1, r * 1.15, r * 0.25, 'rgba(0,0,0,0.28)');
  const g = ctx.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.35))); g.addColorStop(0.45, rgba(col)); g.addColorStop(1, rgba(mix(col, [0, 0, 0], 0.4)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r, -0.62 * r); ctx.bezierCurveTo(-r, 0.05 * r, -0.5 * r, 0, -0.34 * r, 0); ctx.lineTo(0.34 * r, 0); ctx.bezierCurveTo(0.5 * r, 0, r, 0.05 * r, r, -0.62 * r); ctx.closePath(); ctx.fill();
  ell(ctx, 0, -0.62 * r, r, 0.27 * r, rgba(mix(col, [255, 255, 255], 0.55)));
  if (fill === 'rice' || fill === 'big') { const k = fill === 'big' ? 1.5 : 1; ell(ctx, 0, -0.66 * r - 0.05 * r * k, 0.86 * r, 0.24 * r * k, 'rgb(250,248,240)'); ell(ctx, -0.2 * r, -0.72 * r - 0.1 * r * k, 0.35 * r, 0.1 * r * k, 'rgb(255,255,255)'); if (k > 1) { ell(ctx, 0.25 * r, -0.85 * r, 0.3 * r, 0.14 * r, 'rgb(214,120,70)'); ell(ctx, -0.3 * r, -0.86 * r, 0.22 * r, 0.12 * r, 'rgb(110,170,90)'); } }
  else if (fill === 'soup') { ell(ctx, 0, -0.64 * r, 0.86 * r, 0.22 * r, 'rgb(214,150,80)'); ell(ctx, -0.25 * r, -0.67 * r, 0.25 * r, 0.06 * r, 'rgba(255,230,180,0.8)'); }
  else if (fill === 'left') { ell(ctx, 0, -0.63 * r, 0.86 * r, 0.22 * r, 'rgb(150,140,130)'); for (let i = 0; i < 5; i++) ell(ctx, (hash(i * 3.3) - 0.5) * 0.9 * r, -0.63 * r + (hash(i * 7.1) - 0.5) * 0.2 * r, 0.06 * r, 0.035 * r, 'rgb(250,248,240)'); }
  ctx.restore();
}
function cake(ctx, x, y, s, t, a = 1, burn = 0) {
  if (a <= 0.01) return; const w = 0.3 * s, h = 0.14 * s;
  ctx.save(); ctx.globalAlpha *= a;
  ell(ctx, x, y + 2, w * 0.62, w * 0.12, 'rgba(0,0,0,0.3)'); ell(ctx, x, y, w * 0.62, w * 0.13, 'rgb(236,230,220)');
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, 'rgb(250,200,214)'); g.addColorStop(0.5, 'rgb(240,160,184)'); g.addColorStop(1, 'rgb(170,96,122)');
  ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h, w, h); ell(ctx, x, y - h, w / 2, w * 0.1, 'rgb(255,236,240)');
  for (let i = 0; i < 6; i++) ell(ctx, x - w / 2 + w * (i + 0.5) / 6, y - h + 0.02 * s, w * 0.05, 0.03 * s, 'rgb(255,236,240)');
  for (let i = 0; i < 4; i++) {
    const cx = x - w * 0.3 + i * w * 0.2, ch = 0.07 * s * (1 - burn * 0.6), cy = y - h - 0.01 * s;
    ctx.fillStyle = 'rgb(246,214,90)'; ctx.fillRect(cx - 0.007 * s, cy - ch, 0.014 * s, ch);
    const fl = 1 + 0.18 * Math.sin(t * 23 + i * 2.1); ell(ctx, cx, cy - ch - 0.018 * s, 0.009 * s * fl, 0.02 * s * fl, 'rgb(255,230,150)');
    glow(ctx, cx, cy - ch - 0.02 * s, 0.12 * s, [255, 190, 100], 0.45 * fl * a);
  }
  glow(ctx, x, y - h - 0.08 * s, 0.45 * s, [255, 180, 100], 0.1 * a);
  ctx.restore();
}
function mug(ctx, x, y, s, t, a = 1) {
  if (a <= 0.01) return; const w = 0.09 * s, h = 0.1 * s;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = 'rgb(230,222,210)'; ctx.lineWidth = w * 0.18; ctx.beginPath(); ctx.arc(x + w * 0.55, y - h * 0.5, w * 0.3, -1.3, 1.3); ctx.stroke();
  const g = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); g.addColorStop(0, 'rgb(255,252,246)'); g.addColorStop(1, 'rgb(196,186,172)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h, w, h, w * 0.12); ctx.fill();
  ctx.fillStyle = 'rgb(214,92,80)'; ctx.fillRect(x - w / 2, y - h * 0.62, w, h * 0.16); ell(ctx, x, y - h, w / 2, w * 0.14, 'rgb(170,104,60)');
  ctx.restore(); glow(ctx, x, y - h * 0.6, s * 0.25, [255, 200, 140], 0.3 * a); steam(ctx, x, y - h, s, t, a, 3, 0.3);
}
function helmet(ctx, x, y, s, rot = 0) {
  const r = 0.14 * s; ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ell(ctx, 0, 1, r * 1.1, r * 0.22, 'rgba(0,0,0,0.3)');
  const g = ctx.createRadialGradient(-r * 0.35, -r * 0.8, r * 0.1, 0, -r * 0.4, r * 1.2); g.addColorStop(0, 'rgb(255,236,150)'); g.addColorStop(0.5, rgba(IST)); g.addColorStop(1, 'rgb(120,86,24)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r, 0); ctx.bezierCurveTo(-r, -r * 1.35, r, -r * 1.35, r, 0); ctx.closePath(); ctx.fill();
  const v = ctx.createLinearGradient(0, -r * 0.7, 0, -r * 0.1); v.addColorStop(0, 'rgb(70,90,120)'); v.addColorStop(1, 'rgb(20,24,34)');
  ctx.fillStyle = v; ctx.beginPath(); ctx.moveTo(r * 0.05, -r * 0.62); ctx.quadraticCurveTo(r * 0.95, -r * 0.6, r * 1.02, -r * 0.1); ctx.lineTo(r * 0.1, -r * 0.12); ctx.closePath(); ctx.fill();
  ell(ctx, r * 0.55, -r * 0.48, r * 0.22, r * 0.06, 'rgba(255,255,255,0.55)'); ell(ctx, -r * 0.4, -r * 0.85, r * 0.25, r * 0.1, 'rgba(255,255,255,0.45)');
  ctx.restore();
}
function wrench(ctx, x, y, s, rot = 0) {
  const L = 0.26 * s; ctx.save(); ctx.translate(x, y - 0.015 * s); ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, -L * 0.08, 0, L * 0.08); g.addColorStop(0, 'rgb(236,240,246)'); g.addColorStop(0.5, 'rgb(150,158,168)'); g.addColorStop(1, 'rgb(70,76,84)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-L / 2, -L * 0.045, L, L * 0.09, L * 0.04); ctx.fill();
  for (const sx of [-1, 1]) { ctx.beginPath(); ctx.arc(sx * L / 2, 0, L * 0.11, 0, 7); ctx.fill(); ctx.fillStyle = 'rgb(40,30,28)'; ctx.beginPath(); ctx.moveTo(sx * L * 0.62, -L * 0.04); ctx.lineTo(sx * L * 0.5, -L * 0.03); ctx.lineTo(sx * L * 0.5, L * 0.03); ctx.lineTo(sx * L * 0.62, L * 0.04); ctx.closePath(); ctx.fill(); ctx.fillStyle = g; }
  ctx.restore();
}
// 布袋子：装着山里捡回来的松果
function sack(ctx, x, y, s, t) {
  const r = 0.13 * s; ctx.save(); ctx.translate(x, y);
  ell(ctx, 0, 1, r * 1.2, r * 0.22, 'rgba(0,0,0,0.3)');
  for (let i = 0; i < 4; i++) { const px = (i - 1.5) * r * 0.45, py = -r * 1.05 - (i % 2) * r * 0.12; const g = ctx.createRadialGradient(px - r * 0.06, py - r * 0.08, 0, px, py, r * 0.3); g.addColorStop(0, 'rgb(190,130,76)'); g.addColorStop(1, 'rgb(96,58,30)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(px, py, r * 0.22, r * 0.3, (i - 1.5) * 0.3, 0, 7); ctx.fill(); }
  const g = ctx.createLinearGradient(-r, 0, r, 0); g.addColorStop(0, 'rgb(214,186,140)'); g.addColorStop(1, 'rgb(130,104,70)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-r * 0.9, -r * 0.9); ctx.quadraticCurveTo(-r * 1.25, -r * 0.2, -r * 0.8, 0); ctx.lineTo(r * 0.8, 0); ctx.quadraticCurveTo(r * 1.25, -r * 0.2, r * 0.9, -r * 0.9); ctx.quadraticCurveTo(0, -r * 0.75, -r * 0.9, -r * 0.9); ctx.fill();
  ctx.fillStyle = 'rgb(200,80,60)'; ctx.fillRect(-r * 0.9, -r * 0.62, r * 1.8, r * 0.14);
  ctx.restore();
}
// 靴子（伴侣的，乱放在地上）
function boot(ctx, x, y, s, rot, col = [150, 100, 64]) {
  const L = 0.3 * s; ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  ell(ctx, 0, 2, L * 0.6, L * 0.12, 'rgba(0,0,0,0.35)');
  const g = ctx.createLinearGradient(0, -L, 0, 0); g.addColorStop(0, rgba(mix(col, [255, 230, 200], 0.25))); g.addColorStop(1, rgba(mix(col, [0, 0, 0], 0.45)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-L * 0.42, -L * 0.95); ctx.lineTo(-L * 0.05, -L * 0.95); ctx.lineTo(-L * 0.02, -L * 0.35); ctx.quadraticCurveTo(L * 0.5, -L * 0.32, L * 0.52, -L * 0.08); ctx.lineTo(L * 0.52, 0); ctx.lineTo(-L * 0.45, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(34,26,22)'; ctx.fillRect(-L * 0.46, -L * 0.07, L * 1.0, L * 0.08);
  ctx.fillStyle = 'rgba(255,240,220,0.35)'; ctx.fillRect(-L * 0.36, -L * 0.88, L * 0.07, L * 0.5);
  ctx.restore();
}
function ladle(ctx, x, y, s, tilt) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  ctx.strokeStyle = 'rgb(200,206,214)'; ctx.lineWidth = 0.018 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0.2 * s, 0.05 * s); ctx.stroke();
  const g = ctx.createRadialGradient(0.24 * s, 0.07 * s, 0, 0.24 * s, 0.07 * s, 0.07 * s); g.addColorStop(0, 'rgb(240,244,248)'); g.addColorStop(1, 'rgb(120,126,136)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0.25 * s, 0.07 * s, 0.055 * s, 0, Math.PI); ctx.fill(); ell(ctx, 0.25 * s, 0.07 * s, 0.055 * s, 0.016 * s, 'rgb(214,150,80)');
  ctx.restore();
}
// 毯子 / 外套：披在肩上（x,y = 肩线中点，w = 宽）
function drape(ctx, x, y, w, col, sq = 0, stripes = true) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1 + sq * 0.1, 1 - sq * 0.1);
  const g = ctx.createLinearGradient(-w / 2, 0, w / 2, 0); g.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.25))); g.addColorStop(0.6, rgba(col)); g.addColorStop(1, rgba(mix(col, [0, 0, 0], 0.4)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-w * 0.42, -w * 0.04); ctx.quadraticCurveTo(0, -w * 0.22, w * 0.42, -w * 0.04); ctx.bezierCurveTo(w * 0.7, w * 0.15, w * 0.72, w * 0.55, w * 0.6, w * 0.72); ctx.quadraticCurveTo(w * 0.3, w * 0.62, 0, w * 0.74); ctx.quadraticCurveTo(-w * 0.3, w * 0.62, -w * 0.6, w * 0.72); ctx.bezierCurveTo(-w * 0.72, w * 0.55, -w * 0.7, w * 0.15, -w * 0.42, -w * 0.04); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(0, w * 0.05, w * 0.18, w * 0.06, 0, 0, 7); ctx.fill();
  if (stripes) { ctx.fillStyle = 'rgba(255,236,210,0.45)'; for (let i = 1; i < 3; i++) ctx.fillRect(-w * 0.62, i * w * 0.22, w * 1.24, w * 0.04); }
  ctx.restore();
}
function scarf(ctx, hx, hy, r, sw = 0) { // hx,hy 头中心，r 头半径
  ctx.save(); const y = hy + r * 0.95;
  const g = ctx.createLinearGradient(hx - r, y, hx + r, y); g.addColorStop(0, 'rgb(240,96,86)'); g.addColorStop(1, 'rgb(160,40,46)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(hx, y, r * 0.95, r * 0.28, 0, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(hx + r * 0.35, y + r * 0.1); ctx.rotate(0.15 + sw); ctx.beginPath(); ctx.roundRect(-r * 0.16, 0, r * 0.32, r * 0.9, r * 0.08); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,220,0.7)'; ctx.fillRect(-r * 0.16, r * 0.55, r * 0.32, r * 0.1); ctx.restore(); ctx.restore();
}
function knitHat(ctx, x, y, r) { // x,y 头顶
  const g = ctx.createLinearGradient(x - r, y, x + r, y); g.addColorStop(0, 'rgb(120,190,220)'); g.addColorStop(1, 'rgb(50,110,150)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - r, y + r * 0.45); ctx.bezierCurveTo(x - r, y - r * 0.7, x + r, y - r * 0.7, x + r, y + r * 0.45); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(240,240,236)'; ctx.beginPath(); ctx.roundRect(x - r * 1.05, y + r * 0.3, r * 2.1, r * 0.32, r * 0.14); ctx.fill(); ctx.beginPath(); ctx.arc(x, y - r * 0.5, r * 0.26, 0, 7); ctx.fill();
}
function kidShoe(ctx, x, y, s) { for (const d of [-1, 1]) { const g = ctx.createLinearGradient(0, y - 0.06 * s, 0, y); g.addColorStop(0, 'rgb(250,120,140)'); g.addColorStop(1, 'rgb(170,60,80)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x + d * 0.06 * s, y - 0.025 * s, 0.065 * s, 0.03 * s, 0, 0, 7); ctx.fill(); ell(ctx, x + d * 0.06 * s - 0.02 * s, y - 0.04 * s, 0.025 * s, 0.01 * s, 'rgba(255,255,255,0.7)'); } }
// ISTP 头顶的火花（躁动）：k 大小
function sparks(ctx, x, y, k, t) {
  if (k <= 0.01) return; const seed = Math.floor(t * 16);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 11; i++) {
    const h0 = hash(seed * 7.1 + i * 3.3), an = -Math.PI / 2 + (i / 10 - 0.5) * 2.6 + (h0 - 0.5) * 0.3, r0 = 18 * k, r1 = (46 + 40 * h0) * k;
    for (const [lw, al] of [[9 * k, 0.25], [3.5 * k, 0.95]]) {
      ctx.strokeStyle = `rgba(255,${190 + 50 * h0 | 0},90,${al * Math.min(1, k * 1.5)})`; ctx.lineWidth = lw; ctx.beginPath();
      for (let s = 0; s <= 3; s++) { const r = lerp(r0, r1, s / 3), j = (s % 2 ? 1 : -1) * 0.18 * hash(seed + i + s); const px = x + Math.cos(an + j) * r, py = y + Math.sin(an + j) * r; s ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke();
    }
  }
  ctx.restore(); glow(ctx, x, y - 20 * k, 120 * k, [255, 170, 60], 0.55 * k);
}
function puffs(ctx, x, y, t, t0, n = 5, c = [210, 210, 214], sz = 1) {
  const u = t - t0; if (u < 0 || u > 1.6) return;
  for (let i = 0; i < n; i++) { const v = clamp(u - i * 0.08) / 1.3; if (v <= 0 || v >= 1) continue; ell(ctx, x + (hash(i * 5.1) - 0.5) * 70 * sz + Math.sin(v * 6 + i) * 6, y - v * 110 * sz, (10 + v * 20) * sz, (10 + v * 20) * sz, rgba(c, 0.5 * (1 - v))); }
}
function star4(ctx, x, y, r, c, a) {
  if (a <= 0.01) return; ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.28, y - r * 0.28); ctx.lineTo(x + r, y); ctx.lineTo(x + r * 0.28, y + r * 0.28); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.28, y + r * 0.28); ctx.lineTo(x - r, y); ctx.lineTo(x - r * 0.28, y - r * 0.28); ctx.closePath(); ctx.fill(); glow(ctx, x, y, r * 2.2, c, a * 0.4);
}
function okMark(ctx, x, y, s, ok = true) {
  if (s <= 0.01) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createRadialGradient(-6, -8, 2, 0, 0, 26); g.addColorStop(0, ok ? 'rgb(150,230,160)' : 'rgb(255,150,140)'); g.addColorStop(1, ok ? 'rgb(60,150,84)' : 'rgb(190,60,56)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 24, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
  if (ok) { ctx.moveTo(-11, 0); ctx.lineTo(-3, 9); ctx.lineTo(12, -9); } else { ctx.moveTo(-9, -9); ctx.lineTo(9, 9); ctx.moveTo(9, -9); ctx.lineTo(-9, 9); }
  ctx.stroke(); ctx.restore(); glow(ctx, x, y, 60 * s, ok ? [140, 240, 160] : [255, 120, 110], 0.3 * Math.min(1, s));
}
// 有体积的柔光环（填充渐变，不是细线），sy = 压扁比例（贴地）
function softRing(ctx, x, y, R, wd, c, a, sy = 1) {
  if (a <= 0.01 || R <= 2) return; const r0 = Math.max(0, R - wd), r1 = R + wd;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(x, y); ctx.scale(1, sy);
  const g = ctx.createRadialGradient(0, 0, r0, 0, 0, r1); g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r1, 0, 7); ctx.fill(); ctx.restore();
}
// 16P 配角鞠躬：上半身绕腰转（s 是 MB 尺度）
function folkBow(ctx, key, x, y, s, ang, o = {}) {
  if (Math.abs(ang) < 0.01) return MB.person(ctx, key, x, y, s, o);
  const hy = y - (o.bob || 0) - 240 * s * 0.42;
  ctx.save(); ctx.beginPath(); ctx.rect(x - 900, hy, 1800, 1800); ctx.clip(); const out = MB.person(ctx, key, x, y, s, o); ctx.restore();
  ctx.save(); ctx.translate(x, hy); ctx.rotate(ang); ctx.translate(-x, -hy); ctx.beginPath(); ctx.rect(x - 900, hy - 1800, 1800, 1801); ctx.clip(); MB.person(ctx, key, x, y, s, { ...o, shadow: 0 }); ctx.restore();
  const r = p => { const dx = p[0] - x, dy = p[1] - hy, c = Math.cos(ang), sn = Math.sin(ang); return [x + dx * c - dy * sn, hy + dx * sn + dy * c]; };
  return { head: r(out.head), chest: r(out.chest), top: r(out.top) };
}
function folkAt(ctx, p, key, X, Z, o = {}) { // 按深度放 16P 配角；返回 MB 输出 + 尺度
  const m = o.m || 1.7, Y = o.Y || 0, s = p.px(Z, m, Y) / 240, [x, y] = p(X, Y, Z);
  if (!o.noShadow) E.contact(ctx, x, y, 44 * s, 0.4);
  const out = o.bow ? folkBow(ctx, key, x, y, s, o.bow, { shadow: 0, ...o }) : MB.person(ctx, key, x, y, s, { shadow: 0, ...o });
  out.s = s; out.x = x; out.y = y; return out;
}
// 鬼脸：吐舌头 + 两手扒在脸边扇
function tongueFace(ctx, kh, k, t, t0, a) {
  if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; const tw = 1 + 0.15 * Math.sin((t - t0) * 20);
  ell(ctx, kh[0] - 8 * k, kh[1] + 16 * k, 9 * k, 6 * k, 'rgb(150,50,60)');
  ctx.fillStyle = 'rgb(240,96,120)'; ctx.beginPath(); ctx.ellipse(kh[0] - 8 * k, kh[1] + 24 * tw * k, 8 * k, 12 * tw * k, 0.15, 0, 7); ctx.fill();
  for (const s of [-1, 1]) {
    const wv = Math.sin((t - t0) * 22 + s) * 0.35; ctx.save(); ctx.translate(kh[0] - 6 * k + s * 38 * k, kh[1] - 6 * k); ctx.rotate(wv * s); ctx.scale(k, k);
    ctx.fillStyle = 'rgb(226,186,152)'; ctx.beginPath(); ctx.ellipse(0, 0, 11, 15, 0, 0, 7); ctx.fill();
    for (let f = 0; f < 4; f++) { ctx.beginPath(); ctx.ellipse(s * (f * 4 - 4), -16, 3.5, 8, s * (0.4 - f * 0.25), 0, 7); ctx.fill(); }
    ctx.restore();
  }
  ctx.restore();
}
// 配角举手（MB 没有可动的手臂，画一条带手的胳膊）
function raiseArm(ctx, out, u, col, side = -1) {
  if (u <= 0.01) return; const k = out.s * 1.2;
  const sx = out.chest[0] + side * 22 * k, sy = out.chest[1] - 18 * k, hx = sx + side * 10 * k, hy = lerp(sy, out.top[1] - 30 * k, easeOut(u));
  ctx.save(); ctx.strokeStyle = rgba(col); ctx.lineWidth = 13 * k; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx, hy + 8 * k); ctx.stroke();
  ell(ctx, hx, hy, 10 * k, 10 * k, 'rgb(226,186,152)'); ctx.restore();
}

// ---------- 屋子 ----------
const RM = { hw: 3.2, ht: 3.0, back: 9 };
const WALLC = [132, 92, 72], FLOORC = [116, 74, 48], CEILC = [60, 42, 36];
const LAMP = { X: 0, Z: 5.1, drop: 0.85 };
function polyS(ctx, p, pts, style, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = style; poly2(ctx, pts.map(q => p(q[0], q[1], q[2]))); ctx.fill(); ctx.restore(); }
// 在平行于镜头的平面（墙面）上开局部坐标：(0,0)=左上 (lw,lh)=右下
function onWall(ctx, p, X0, Y0, X1, Y1, Z, lw, lh, fn) { const a = p(X0, Y0, Z), b = p(X1, Y1, Z); ctx.save(); ctx.translate(a[0], a[1]); ctx.scale((b[0] - a[0]) / lw, (b[1] - a[1]) / lh); fn(); ctx.restore(); return [a, b]; }
function shell(ctx, p, lamp) {
  const { hw, ht, back } = RM, near = Math.min(p.z0 + 0.22, back - 0.05), L = (c, k) => mix(c, [8, 5, 10], clamp(1 - k, 0, 1));
  ctx.fillStyle = rgba(L(CEILC, 0.4)); ctx.fillRect(0, 0, W, H);
  polyS(ctx, p, [[-hw, ht, near], [hw, ht, near], [hw, ht, back], [-hw, ht, back]], rgba(L(CEILC, 0.35 + 0.25 * lamp)));
  for (const s of [-1, 1]) {
    const a = p(s * hw, 1.5, near), b = p(s * hw, 1.5, back), g = ctx.createLinearGradient(a[0], 0, b[0], 0);
    g.addColorStop(0, rgba(mix(L(WALLC, 0.12), [20, 26, 50], 0.4))); g.addColorStop(1, rgba(mix(L(WALLC, 0.36 + 0.22 * lamp), [30, 36, 70], 0.2)));
    polyS(ctx, p, [[s * hw, 0, near], [s * hw, ht, near], [s * hw, ht, back], [s * hw, 0, back]], g);
    polyS(ctx, p, [[s * hw, 0, near], [s * hw, 0.9, near], [s * hw, 0.9, back], [s * hw, 0, back]], 'rgba(46,26,20,0.4)');
    polyS(ctx, p, [[s * hw, 0.88, near], [s * hw, 0.95, near], [s * hw, 0.95, back], [s * hw, 0.88, back]], 'rgba(255,226,190,0.12)');
  }
  // 地板：木板一条条（宽色带，不画细缝）+ 地毯 + 灯下光斑
  const fa = p(0, 0, back), fg = ctx.createLinearGradient(0, fa[1], 0, H);
  fg.addColorStop(0, rgba(L(FLOORC, 0.5 + 0.2 * lamp))); fg.addColorStop(1, rgba(mix(L(FLOORC, 0.2), [16, 18, 36], 0.4)));
  polyS(ctx, p, [[-hw, 0, near], [hw, 0, near], [hw, 0, back], [-hw, 0, back]], fg);
  for (let i = 0; i < 16; i++) { const x0 = -hw + 2 * hw * i / 16, x1 = x0 + 2 * hw / 16; polyS(ctx, p, [[x0, 0, near], [x1, 0, near], [x1, 0, back], [x0, 0, back]], i % 2 ? 'rgba(40,20,10,0.13)' : 'rgba(255,220,180,0.04)'); }
  polyS(ctx, p, [[-1.55, 0.004, 3.7], [1.55, 0.004, 3.7], [1.55, 0.004, 6.7], [-1.55, 0.004, 6.7]], rgba(L([128, 46, 42], 0.8)));
  polyS(ctx, p, [[-1.4, 0.006, 3.85], [1.4, 0.006, 3.85], [1.4, 0.006, 6.55], [-1.4, 0.006, 6.55]], rgba(L([168, 72, 58], 0.8)));
  polyS(ctx, p, [[-1.2, 0.008, 4.05], [1.2, 0.008, 4.05], [1.2, 0.008, 6.35], [-1.2, 0.008, 6.35]], rgba(L([138, 52, 46], 0.8)));
  // 后墙：墙裙 + 腰线 + 踢脚
  polyS(ctx, p, [[-hw, 0, back], [hw, 0, back], [hw, ht, back], [-hw, ht, back]], rgba(mix(L(WALLC, 0.42 + 0.18 * lamp), [34, 40, 76], 0.18)));
  polyS(ctx, p, [[-hw, 0, back], [hw, 0, back], [hw, 0.9, back], [-hw, 0.9, back]], 'rgba(60,32,24,0.4)');
  polyS(ctx, p, [[-hw, 0.88, back], [hw, 0.88, back], [hw, 0.95, back], [-hw, 0.95, back]], 'rgba(255,230,196,0.16)');
  polyS(ctx, p, [[-hw, 0, back], [hw, 0, back], [hw, 0.1, back], [-hw, 0.1, back]], 'rgba(30,16,12,0.6)');
  // 灯把后墙和天花板照暖
  const lb = p(LAMP.X, RM.ht - LAMP.drop, LAMP.Z);
  if (p.depth(LAMP.Z) > 0.3) { glow(ctx, lb[0], lb[1] + 60, p.px(LAMP.Z, 3.0), WARM, 0.3 * lamp); glow(ctx, lb[0], lb[1], p.px(LAMP.Z, 1.2), WARM, 0.22 * lamp); }
  const wc = p(WIN.X, 1.5, back); glow(ctx, wc[0], wc[1], p.px(back, 2.6), [90, 120, 200], 0.16); // 窗口进来的冷蓝夜光
}
// 窗外：傍晚→夜的天、两层山、山里几点灯、月亮
const WIN = { X: -1.62, Y: 1.0, w: 2.0, h: 1.42 };
function winView(ctx, a, b, t, night, rainA = 0) {
  const w = b[0] - a[0], h = b[1] - a[1]; ctx.save(); ctx.beginPath(); ctx.rect(a[0], a[1], w, h); ctx.clip();
  const g = ctx.createLinearGradient(0, a[1], 0, b[1]);
  g.addColorStop(0, rgba(mix([60, 70, 130], [10, 14, 36], night))); g.addColorStop(0.62, rgba(mix([200, 120, 120], [46, 50, 96], night))); g.addColorStop(1, rgba(mix([250, 170, 110], [70, 60, 104], night)));
  ctx.fillStyle = g; ctx.fillRect(a[0], a[1], w, h);
  glow(ctx, a[0] + w * 0.74, a[1] + h * 0.26, w * 0.22, [230, 236, 255], 0.35 + 0.35 * night); ell(ctx, a[0] + w * 0.74, a[1] + h * 0.26, w * 0.035, w * 0.035, rgba([250, 250, 240], 0.4 + 0.6 * night));
  for (let i = 0; i < 16; i++) { const sx = a[0] + hash(i * 2.7) * w, sy = a[1] + hash(i * 5.1) * h * 0.5; glow(ctx, sx, sy, w * 0.012, [255, 250, 230], night * (0.4 + 0.4 * Math.sin(t * 2 + i))); }
  for (const [yb, amp, c, sd] of [[0.78, 0.26, [44, 42, 84], 1.3], [0.95, 0.2, [24, 22, 46], 4.1]]) {
    ctx.beginPath(); ctx.moveTo(a[0], b[1]);
    for (let i = 0; i <= 30; i++) { const u = i / 30; ctx.lineTo(a[0] + u * w, a[1] + h * (yb - amp * (0.5 + 0.35 * Math.sin(u * 7 + sd) + 0.15 * Math.sin(u * 17 + sd * 2)))); }
    ctx.lineTo(b[0], b[1]); ctx.closePath(); ctx.fillStyle = rgba(mix(mix(c, [120, 80, 110], 0.4), c, night)); ctx.fill();
  }
  for (let i = 0; i < 7; i++) glow(ctx, a[0] + w * (0.1 + 0.8 * hash(i * 9.1)), a[1] + h * (0.84 + 0.1 * hash(i * 3.9)), w * 0.02, WARM, 0.7 * night);
  if (rainA > 0.01) { ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 40; i++) { const x = a[0] + hash(i * 1.7) * w, y = a[1] + ((hash(i * 4.3) * h + t * h * 0.9 * (0.7 + hash(i))) % h); ctx.fillStyle = rgba([200, 220, 255], 0.35 * rainA); ctx.beginPath(); ctx.roundRect(x, y, w * 0.006, h * 0.05, w * 0.003); ctx.fill(); } }
  ctx.restore();
}
function windowWall(ctx, p, t, night, rainA, curtain) {
  const Z = RM.back - 0.005, a = p(WIN.X - WIN.w / 2, WIN.Y + WIN.h, Z), b = p(WIN.X + WIN.w / 2, WIN.Y, Z);
  winView(ctx, a, b, t, night, rainA);
  const w = b[0] - a[0], fr = Math.max(4, w * 0.035);
  ctx.save(); ctx.fillStyle = 'rgb(70,46,34)';
  ctx.fillRect(a[0] - fr, a[1] - fr, w + 2 * fr, fr); ctx.fillRect(a[0] - fr, b[1], w + 2 * fr, fr * 1.8); ctx.fillRect(a[0] - fr, a[1], fr, b[1] - a[1]); ctx.fillRect(b[0], a[1], fr, b[1] - a[1]);
  ctx.fillRect(a[0] + w / 2 - fr * 0.4, a[1], fr * 0.8, b[1] - a[1]); ctx.fillStyle = 'rgba(255,230,190,0.18)'; ctx.fillRect(a[0] - fr, b[1], w + 2 * fr, fr * 0.5);
  ctx.restore();
  // 窗帘：两片布，褶子用渐变
  for (const s of [-1, 1]) {
    const cw = 0.42 + 0.12 * curtain, xin = WIN.X + s * (WIN.w / 2 + 0.25 - cw), xout = WIN.X + s * (WIN.w / 2 + 0.25);
    const c0 = p(Math.min(xin, xout), 2.62, Z - 0.03), c1 = p(Math.max(xin, xout), 0.82, Z - 0.03), cg = ctx.createLinearGradient(c0[0], 0, c1[0], 0);
    for (let k = 0; k <= 8; k++) cg.addColorStop(k / 8, rgba(mix([168, 64, 58], [80, 24, 26], k % 2 ? 0.55 : 0.05)));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c0[1]); ctx.lineTo(c1[0] + s * (c1[0] - c0[0]) * 0.05, c1[1]); ctx.lineTo(c0[0] - s * (c1[0] - c0[0]) * 0.05, c1[1]); ctx.closePath(); ctx.fill();
  }
  const r0 = p(WIN.X - WIN.w / 2 - 0.35, 2.66, Z - 0.04), r1 = p(WIN.X + WIN.w / 2 + 0.35, 2.6, Z - 0.04);
  ctx.fillStyle = 'rgb(60,40,30)'; ctx.fillRect(r0[0], r0[1], r1[0] - r0[0], Math.max(3, r1[1] - r0[1]));
  return [a, b];
}
// 窗下矮柜：汤锅、绿植、叠好的衣服
function sideboard(ctx, p, t, st) {
  const z0 = 8.45, z1 = RM.back - 0.01, x0 = -2.95, x1 = -0.35, hy = 0.82;
  polyS(ctx, p, [[x0, hy, z0], [x1, hy, z0], [x1, hy, z1], [x0, hy, z1]], 'rgb(150,104,70)');
  const a = p(x0, hy, z0), b = p(x1, 0, z0), g = ctx.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, 'rgb(124,82,54)'); g.addColorStop(1, 'rgb(64,40,28)');
  ctx.fillStyle = g; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  const s = p.px(z0, 1);
  for (let i = 0; i < 3; i++) { const dx = lerp(a[0], b[0], (i + 0.06) / 3), dw = (b[0] - a[0]) / 3 * 0.88; ctx.fillStyle = 'rgba(30,16,10,0.35)'; ctx.fillRect(dx, a[1] + s * 0.08, dw, s * 0.58); ctx.fillStyle = 'rgba(255,230,190,0.08)'; ctx.fillRect(dx, a[1] + s * 0.08, dw, s * 0.04); ell(ctx, dx + dw / 2, a[1] + s * 0.3, s * 0.025, s * 0.025, 'rgb(220,180,100)'); }
  // 汤锅
  const pt = p(-1.95, hy, 8.72), ps = p.px(8.72, 1), pw = 0.34 * ps;
  const pg = ctx.createLinearGradient(pt[0] - pw / 2, 0, pt[0] + pw / 2, 0); pg.addColorStop(0, 'rgb(240,120,90)'); pg.addColorStop(0.5, 'rgb(200,70,56)'); pg.addColorStop(1, 'rgb(110,34,30)');
  ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(pt[0] - pw / 2, pt[1] - 0.2 * ps, pw, 0.2 * ps, 0.03 * ps); ctx.fill(); ell(ctx, pt[0], pt[1] - 0.2 * ps, pw / 2, 0.04 * ps, 'rgb(250,150,120)');
  steam(ctx, pt[0], pt[1] - 0.22 * ps, ps, t, 0.9, 4, 0.5);
  // 绿植
  const pl = p(-2.65, hy, 8.75), q = p.px(8.75, 1);
  ctx.fillStyle = 'rgb(186,120,80)'; ctx.beginPath(); ctx.moveTo(pl[0] - 0.1 * q, pl[1] - 0.2 * q); ctx.lineTo(pl[0] + 0.1 * q, pl[1] - 0.2 * q); ctx.lineTo(pl[0] + 0.075 * q, pl[1]); ctx.lineTo(pl[0] - 0.075 * q, pl[1]); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 9; i++) { const an = -Math.PI / 2 + (i / 8 - 0.5) * 2.4 + 0.05 * Math.sin(t + i); ctx.save(); ctx.translate(pl[0], pl[1] - 0.2 * q); ctx.rotate(an + Math.PI / 2); const lg = ctx.createLinearGradient(0, 0, 0, -0.42 * q); lg.addColorStop(0, 'rgb(40,90,56)'); lg.addColorStop(1, 'rgb(110,180,110)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.ellipse(0, -0.2 * q, 0.05 * q, 0.22 * q, 0, 0, 7); ctx.fill(); ctx.restore(); }
  // 叠好的衣服：一件件落下叠整齐
  const cs = p(-0.95, hy, 8.7), cq = p.px(8.7, 1), cols = [[90, 170, 200], [240, 196, 70], [236, 236, 230], [210, 96, 110]];
  for (let i = 0; i < 4; i++) {
    const t0 = st.wear + i * 0.13 - 0.25, u = prog(t, t0, t0 + 0.32); if (u <= 0) continue;
    const land = t > t0 + 0.32 ? Math.exp(-(t - t0 - 0.32) * 9) * Math.cos((t - t0 - 0.32) * 26) : 0;
    const yy = cs[1] - (i + 1) * 0.055 * cq - (1 - easeIn(u)) * 0.7 * cq, rot = (1 - u) * (i % 2 ? 0.8 : -0.8), w = 0.36 * cq;
    ctx.save(); ctx.translate(cs[0] + (1 - u) * (i - 1.5) * 0.2 * cq, yy); ctx.rotate(rot); ctx.scale(1 + land * 0.08, 1 - land * 0.15);
    const cg = ctx.createLinearGradient(0, -0.03 * cq, 0, 0.03 * cq); cg.addColorStop(0, rgba(mix(cols[i], [255, 255, 255], 0.3))); cg.addColorStop(1, rgba(mix(cols[i], [0, 0, 0], 0.25)));
    ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(-w / 2, -0.028 * cq, w, 0.056 * cq, 0.02 * cq); ctx.fill(); ctx.restore();
  }
}
// 日历：两次红笔圈（生日带蛋糕，纪念日带心）
function calendar(ctx, p, t) {
  onWall(ctx, p, 0.0, 2.27, 0.62, 1.55, RM.back - 0.01, 104, 120, () => {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(3, 6, 104, 116);
    ctx.fillStyle = 'rgb(246,242,232)'; ctx.fillRect(0, 0, 104, 120); ctx.fillStyle = 'rgb(214,82,72)'; ctx.fillRect(0, 0, 104, 24);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(0, 0, 104, 6);
    for (const rx of [24, 80]) { ctx.fillStyle = 'rgb(90,90,96)'; ctx.beginPath(); ctx.roundRect(rx - 3, -8, 6, 16, 3); ctx.fill(); }
    const cell = (r, c) => [14 + c * 19, 40 + r * 19];
    for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { const [cx, cy] = cell(r, c); ctx.fillStyle = 'rgb(206,200,190)'; ctx.beginPath(); ctx.roundRect(cx - 6, cy - 6, 12, 12, 2); ctx.fill(); }
    const ring = (r, c, t0, ico) => {
      const u = prog(t, t0, t0 + 0.42); if (u <= 0) return; const [cx, cy] = cell(r, c), a0 = -2.2;
      ctx.save(); ctx.strokeStyle = 'rgb(220,40,48)'; ctx.lineWidth = 3.2; ctx.lineCap = 'round'; ctx.beginPath();
      for (let k = 0; k <= 40 * u; k++) { const an = a0 + (k / 40) * Math.PI * 2.15, rr = 11.5 + Math.sin(k * 0.7) * 0.6; const px = cx + Math.cos(an) * rr * 1.08, py = cy + Math.sin(an) * rr; k ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
      ctx.stroke(); ctx.restore();
      if (u < 1) { const an = a0 + u * Math.PI * 2.15; glow(ctx, cx + Math.cos(an) * 12.4, cy + Math.sin(an) * 11.5, 12, [255, 90, 90], 0.8); }
      const s = popIn(t, t0 + 0.4); if (s > 0.01) { ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ico(); ctx.restore(); glow(ctx, cx, cy, 30, [255, 200, 160], 0.4 * Math.exp(-(t - t0 - 0.4) * 3)); }
    };
    ring(1, 3, T.bday - 0.05, () => { ctx.fillStyle = 'rgb(240,160,180)'; ctx.fillRect(-6, -2, 12, 7); ctx.fillStyle = 'rgb(246,214,90)'; ctx.fillRect(-1, -7, 2, 5); });
    ring(3, 1, T.anniv - 0.05, () => { ctx.fillStyle = 'rgb(236,84,96)'; ctx.beginPath(); ctx.moveTo(0, 5); ctx.bezierCurveTo(-8, -1, -5, -8, 0, -3); ctx.bezierCurveTo(5, -8, 8, -1, 0, 5); ctx.fill(); });
  });
}
// 置物架（F08 收东西用）
const SHELF = { x0: 1.12, x1: 1.92, Y: 2.02 };
function shelf(ctx, p) {
  const z0 = 8.78, z1 = RM.back - 0.01;
  polyS(ctx, p, [[SHELF.x0, SHELF.Y, z0], [SHELF.x1, SHELF.Y, z0], [SHELF.x1, SHELF.Y, z1], [SHELF.x0, SHELF.Y, z1]], 'rgb(170,120,82)');
  polyS(ctx, p, [[SHELF.x0, SHELF.Y, z0], [SHELF.x1, SHELF.Y, z0], [SHELF.x1, SHELF.Y - 0.05, z0], [SHELF.x0, SHELF.Y - 0.05, z0]], 'rgb(96,62,40)');
  for (const x of [SHELF.x0 + 0.1, SHELF.x1 - 0.1]) polyS(ctx, p, [[x - 0.02, SHELF.Y - 0.05, z1], [x + 0.02, SHELF.Y - 0.05, z1], [x + 0.02, SHELF.Y - 0.22, z1], [x - 0.02, SHELF.Y - 0.22, z1]], 'rgb(80,52,36)');
  const sh = p(1.52, SHELF.Y - 0.08, z1); glow(ctx, sh[0], sh[1], p.px(z1, 0.5), [0, 0, 0], 0);
}
// 门：后墙右边；open 0..1；外面是夜色和摩托车灯
const DOOR = { X: 2.5, w: 0.95, h: 2.1 };
function door3(ctx, p, t, open, outside) {
  const Z = RM.back - 0.005, a = p(DOOR.X - DOOR.w / 2, DOOR.h, Z), b = p(DOOR.X + DOOR.w / 2, 0, Z), w = b[0] - a[0], hgt = b[1] - a[1], fr = w * 0.09;
  ctx.fillStyle = 'rgb(58,36,26)'; ctx.fillRect(a[0] - fr, a[1] - fr, w + 2 * fr, hgt + fr);
  const og = ctx.createLinearGradient(0, a[1], 0, b[1]); og.addColorStop(0, 'rgb(14,18,40)'); og.addColorStop(1, 'rgb(40,46,80)');
  ctx.fillStyle = og; ctx.fillRect(a[0], a[1], w, hgt);
  if (open > 0.02) { ctx.save(); ctx.beginPath(); ctx.rect(a[0], a[1], w, hgt); ctx.clip(); for (let i = 0; i < 8; i++) glow(ctx, a[0] + hash(i * 3.1) * w, a[1] + hash(i * 1.7) * hgt * 0.5, w * 0.02, [255, 250, 230], 0.6); glow(ctx, a[0] + w * 0.3, b[1] - hgt * 0.12, w * 0.9, [230, 240, 255], 0.55 * outside); glow(ctx, a[0] + w * 0.3, b[1] - hgt * 0.12, w * 0.18, [255, 255, 250], 0.9 * outside); ctx.restore(); }
  const dw = w * (1 - open * 0.84), lx = b[0] - dw, g = ctx.createLinearGradient(lx, 0, b[0], 0); g.addColorStop(0, 'rgb(120,82,56)'); g.addColorStop(1, 'rgb(74,50,36)');
  ctx.fillStyle = g; ctx.fillRect(lx, a[1], dw, hgt);
  ctx.fillStyle = 'rgba(0,0,0,0.22)'; for (const [v0, v1] of [[0.07, 0.45], [0.53, 0.93]]) ctx.fillRect(lx + dw * 0.14, a[1] + hgt * v0, dw * 0.72, hgt * (v1 - v0));
  ell(ctx, lx + dw * 0.12, a[1] + hgt * 0.52, w * 0.04, w * 0.04, 'rgb(226,190,110)');
  return [a, b];
}
// 家规卷轴：从上往下展开，左列 ✓ 该做，右列 ✗ 不该做（图标是实物）。局部坐标 300×240
const IC = {
  bowl: (c, x, y) => { bowl(c, x, y + 16, 260, [210, 96, 80], 'rice'); c.strokeStyle = 'rgb(120,84,56)'; c.lineWidth = 3.5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 8, y - 20); c.lineTo(x + 24, y + 4); c.moveTo(x + 14, y - 22); c.lineTo(x + 28, y + 2); c.stroke(); },
  brush: (c, x, y) => { B.rrect(c, x - 26, y - 4, 44, 9, 4, [100, 160, 220]); B.rrect(c, x + 12, y - 12, 15, 13, 3, [250, 250, 250]); for (let i = 0; i < 4; i++) B.rect(c, x + 13 + i * 3.4, y - 17, 2.2, 7, [180, 210, 240]); },
  bed: (c, x, y) => { B.rrect(c, x - 26, y - 2, 52, 16, 5, [130, 160, 200]); B.rrect(c, x - 24, y - 12, 18, 12, 5, [246, 238, 214]); ell(c, x + 8, y - 6, 14, 8, 'rgb(240,200,90)'); },
  phone: (c, x, y) => { B.rrect(c, x - 13, y - 21, 26, 42, 5, [50, 52, 60]); B.rect(c, x - 10, y - 16, 20, 30, [120, 180, 230]); },
  candy: (c, x, y) => { c.fillStyle = 'rgb(236,110,150)'; c.beginPath(); c.ellipse(x, y, 13, 10, 0, 0, 7); c.fill(); c.beginPath(); c.moveTo(x - 12, y); c.lineTo(x - 26, y - 9); c.lineTo(x - 26, y + 9); c.closePath(); c.moveTo(x + 12, y); c.lineTo(x + 26, y - 9); c.lineTo(x + 26, y + 9); c.closePath(); c.fill(); },
  pad: (c, x, y) => { B.rrect(c, x - 25, y - 12, 50, 24, 12, [90, 90, 104]); c.fillStyle = '#fff'; c.fillRect(x - 16, y - 2, 10, 4); c.fillRect(x - 13, y - 5, 4, 10); c.beginPath(); c.arc(x + 12, y, 3.5, 0, 7); c.fill(); },
  bow: (c, x, y) => { ell(c, x + 10, y - 6, 8, 8, 'rgb(226,186,152)'); c.save(); c.translate(x - 4, y + 4); c.rotate(-0.9); B.rrect(c, -6, -22, 13, 26, 6, [120, 190, 140]); c.restore(); B.rrect(c, x - 8, y + 2, 9, 20, 4, [80, 90, 120]); },
  box: (c, x, y) => { B.rrect(c, x - 22, y - 6, 44, 24, 4, [196, 150, 96]); ell(c, x - 8, y - 9, 8, 8, 'rgb(236,96,96)'); B.rrect(c, x + 2, y - 18, 12, 14, 3, [100, 170, 220]); },
  tongue: (c, x, y) => { ell(c, x, y, 18, 18, 'rgb(240,206,160)'); ell(c, x - 6, y - 4, 2.5, 2.5, '#333'); ell(c, x + 6, y - 4, 2.5, 2.5, '#333'); ell(c, x, y + 9, 5, 7, 'rgb(240,96,120)'); },
  mess: (c, x, y) => { for (let i = 0; i < 5; i++) { c.save(); c.translate(x - 18 + i * 9, y + 6 - (i % 2) * 8); c.rotate(i * 1.3); B.rrect(c, -6, -6, 12, 12, 3, [[236, 96, 96], [100, 170, 220], [240, 200, 80], [120, 190, 140], [200, 140, 220]][i]); c.restore(); } },
};
const SET_A = { ok: ['bowl', 'brush', 'bed'], no: ['phone', 'candy', 'pad'] }, SET_B = { ok: ['bow', 'box'], no: ['tongue', 'mess'] };
function scroll3(ctx, p, X0, Z, Yt, wm, hm, down, t, set, tOk, tNo) {
  if (down <= 0.005) return; const a = p(X0 - wm / 2, Yt, Z), b = p(X0 + wm / 2, Yt - hm, Z), sx = (b[0] - a[0]) / 300, sy = (b[1] - a[1]) / 240;
  ctx.save(); ctx.translate(a[0], a[1]); ctx.scale(sx, sy);
  const hh = 240 * clamp(down, 0, 1.06);
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(10, 14, 300, hh);
  ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 300, hh); ctx.clip();
  const g = ctx.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, 'rgb(252,246,228)'); g.addColorStop(1, 'rgb(228,214,184)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 300, 240);
  const vg = ctx.createLinearGradient(0, 0, 300, 0); vg.addColorStop(0, 'rgba(120,80,40,0.2)'); vg.addColorStop(0.15, 'rgba(120,80,40,0)'); vg.addColorStop(0.85, 'rgba(120,80,40,0)'); vg.addColorStop(1, 'rgba(120,80,40,0.2)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, 300, 240);
  ctx.fillStyle = 'rgba(150,110,70,0.25)'; ctx.fillRect(148, 18, 4, 210);
  okMark(ctx, 76, 38, popIn(t, tOk - 0.35) * 0.8, true); okMark(ctx, 224, 38, popIn(t, tNo - 0.2) * 0.8, false);
  const rows = set.ok.length, dy = rows === 3 ? 58 : 80;
  for (let i = 0; i < rows; i++) for (const [list, cx, t0] of [[set.ok, 76, tOk - 0.15 + i * 0.2], [set.no, 224, tNo + 0.02 + i * 0.2]]) {
    const s = popIn(t, t0); if (s <= 0.01) continue; const yy = 96 + i * dy;
    ctx.save(); ctx.translate(cx, yy); ctx.scale(s * 1.45, s * 1.45); ctx.translate(-cx, -yy); IC[list[i]](ctx, cx, yy); ctx.restore();
  }
  ctx.restore();
  for (const y of [-6, hh]) { const rg = ctx.createLinearGradient(0, y - 8, 0, y + 10); rg.addColorStop(0, 'rgb(170,120,80)'); rg.addColorStop(1, 'rgb(90,56,34)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.roundRect(-12, y - 8, 324, 18, 9); ctx.fill(); }
  ctx.restore();
}

// ---------- 窗外：夜里的山路（侧面跟拍，多层视差） ----------
const RIDE0 = T.win0;
function ridgeY(x, yb, amp, sd) { return yb - amp * (0.5 + 0.32 * Math.sin(x * 0.0042 + sd) + 0.12 * Math.sin(x * 0.0113 + sd * 1.7) + 0.06 * Math.sin(x * 0.031 + sd * 2.3)); }
function ridge(ctx, yb, amp, off, sd, c0, c1, rim = 0) {
  ctx.beginPath(); ctx.moveTo(-60, H + 10);
  for (let x = -60; x <= W + 60; x += 18) ctx.lineTo(x, ridgeY(x + off, yb, amp, sd));
  ctx.lineTo(W + 60, H + 10); ctx.closePath();
  const g = ctx.createLinearGradient(0, yb - amp, 0, yb + 420); g.addColorStop(0, rgba(mix(c0, [140, 150, 210], rim))); g.addColorStop(0.25, rgba(c0)); g.addColorStop(1, rgba(c1)); ctx.fillStyle = g; ctx.fill();
}
function fogBand(ctx, y, hgt, c, a) { const g = ctx.createLinearGradient(0, y - hgt, 0, y + hgt); g.addColorStop(0, rgba(c, 0)); g.addColorStop(0.5, rgba(c, a)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(0, y - hgt, W, hgt * 2); }
function drawRide(ctx, t) {
  const tt = t - RIDE0, rise = sm(t, T.up0, T.up), dy = rise * rise * 1500;
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgb(8,10,30)'); g.addColorStop(0.42, 'rgb(28,32,76)'); g.addColorStop(0.58, 'rgb(84,62,112)'); g.addColorStop(0.7, 'rgb(36,28,52)'); g.addColorStop(1, 'rgb(14,12,22)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 110; i++) { const x = (hash(i * 3.1) * (W + 40) - tt * 4) % (W + 40), y = hash(i * 7.7) * 900 + dy * 0.15, r = 1 + hash(i) * 2; ctx.fillStyle = rgba([255, 250, 230], 0.3 + 0.5 * hash(i * 1.3) * (0.7 + 0.3 * Math.sin(t * 2 + i))); ctx.beginPath(); ctx.arc(x < 0 ? x + W + 40 : x, y, r, 0, 7); ctx.fill(); }
  const mx = 800, my = 330 + dy * 0.22; glow(ctx, mx, my, 420, [200, 210, 255], 0.22); glow(ctx, mx, my, 90, [240, 244, 255], 0.6); ell(ctx, mx, my, 34, 34, 'rgb(246,246,236)');
  ridge(ctx, 860 + dy * 0.35, 260, tt * 18, 1.1, [40, 40, 86], [22, 20, 44], 0.25);
  fogBand(ctx, 860 + dy * 0.35, 90, [120, 100, 150], 0.18);
  ridge(ctx, 960 + dy * 0.55, 200, tt * 55, 3.7, [26, 26, 54], [14, 12, 28], 0.15);
  for (let i = 0; i < 12; i++) { const x = ((hash(i * 4.1) * 2400 - tt * 55) % 2400 + 2400) % 2400 - 200; if (x < -50 || x > W + 50) continue; glow(ctx, x, ridgeY(x + tt * 55, 960 + dy * 0.55, 200, 3.7) + 40 + hash(i) * 80, 26, WARM, 0.75); }
  fogBand(ctx, 1000 + dy * 0.55, 70, [90, 70, 120], 0.2);
  // 路灯（中景，往后退）
  const roadY = 1052 + dy;
  for (let i = -1; i < 3; i++) {
    const x = ((i * 760 - tt * 760) % 2280 + 2280) % 2280 - 300; if (x < -200 || x > W + 200) continue;
    const top = roadY - 420; ctx.fillStyle = 'rgb(18,16,24)'; ctx.fillRect(x - 5, top, 10, 420); ctx.fillRect(x - 5, top, 70, 9);
    glow(ctx, x + 62, top + 10, 260, WARM, 0.22); glow(ctx, x + 62, top + 10, 40, CANDLE, 0.9);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; const cg = ctx.createLinearGradient(0, top, 0, roadY); cg.addColorStop(0, rgba(WARM, 0.16)); cg.addColorStop(1, rgba(WARM, 0)); ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(x + 50, top + 12); ctx.lineTo(x + 74, top + 12); ctx.lineTo(x + 200, roadY); ctx.lineTo(x - 70, roadY); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // 路面 + 护栏 + 中线
  const rg = ctx.createLinearGradient(0, roadY, 0, roadY + 300); rg.addColorStop(0, 'rgb(38,34,46)'); rg.addColorStop(1, 'rgb(18,16,22)'); ctx.fillStyle = rg; ctx.fillRect(0, roadY, W, H - roadY + 10);
  const bg = ctx.createLinearGradient(0, roadY - 34, 0, roadY - 14); bg.addColorStop(0, 'rgb(150,156,170)'); bg.addColorStop(1, 'rgb(50,52,62)'); ctx.fillStyle = bg; ctx.fillRect(0, roadY - 34, W, 18);
  for (let i = 0; i < 6; i++) { const x = ((i * 260 - tt * 1500) % 1560 + 1560) % 1560 - 100; ctx.fillStyle = 'rgb(30,30,38)'; ctx.fillRect(x - 6, roadY - 40, 12, 42); glow(ctx, x, roadY - 26, 18, [255, 120, 80], 0.7); }
  for (let i = 0; i < 6; i++) { const x = ((i * 340 - tt * 1900) % 2040 + 2040) % 2040 - 200; const dg = ctx.createLinearGradient(x, 0, x + 200, 0); dg.addColorStop(0, 'rgba(240,220,160,0)'); dg.addColorStop(0.4, 'rgba(240,220,160,0.75)'); dg.addColorStop(1, 'rgba(240,220,160,0.75)'); ctx.fillStyle = dg; ctx.fillRect(x, roadY + 120, 200, 12); }
  ctx.fillStyle = 'rgb(12,14,18)'; ctx.fillRect(0, roadY + 250, W, H);
  return { roadY, dy, tt };
}
function wheel(ctx, x, y, r, t) {
  ell(ctx, x, y, r, r, 'rgb(14,14,18)');
  const g = ctx.createRadialGradient(x - r * 0.2, y - r * 0.2, r * 0.1, x, y, r * 0.74); g.addColorStop(0, 'rgb(120,126,136)'); g.addColorStop(1, 'rgb(36,38,44)'); ell(ctx, x, y, r * 0.74, r * 0.74, g);
  ctx.save(); ctx.translate(x, y); ctx.rotate(-t * 40); for (let i = 0; i < 3; i++) { ctx.rotate(Math.PI / 1.5); const sg = ctx.createLinearGradient(0, 0, r * 0.7, 0); sg.addColorStop(0, 'rgba(230,236,244,0.5)'); sg.addColorStop(1, 'rgba(230,236,244,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * 0.7, -0.35, 0.35); ctx.closePath(); ctx.fill(); } ctx.restore();
  ell(ctx, x, y, r * 0.16, r * 0.16, 'rgb(210,214,220)');
}
// 摩托 + 骑手：x,y = 车底中心的路面点，S = 1 米多少像素，rot 翘头
function bike(ctx, x, y, S, t, rot = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(S, S);
  ell(ctx, 0, 0.02, 1.1, 0.07, 'rgba(0,0,0,0.5)');
  // 尾灯拖出来的光轨（厚的光带）
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [hw, a] of [[0.16, 0.18], [0.06, 0.5], [0.022, 0.95]]) { const lg = ctx.createLinearGradient(-7, 0, -0.95, 0); lg.addColorStop(0, 'rgba(255,90,60,0)'); lg.addColorStop(1, `rgba(255,${a > 0.9 ? 200 : 110},90,${a})`); ctx.fillStyle = lg; ctx.beginPath(); ctx.moveTo(-0.95, -0.86 - hw); ctx.lineTo(-7, -0.8 - hw * 0.3); ctx.lineTo(-7, -0.8 + hw * 0.3); ctx.lineTo(-0.95, -0.86 + hw); ctx.closePath(); ctx.fill(); }
  ctx.restore();
  wheel(ctx, -0.72, -0.34, 0.34, t);
  MB.person(ctx, 'istp-male', -0.3, -0.18, 1.72 / 240, { lean: 0.32, shadow: 0 });
  const mg = (y0, y1, c0, c1) => { const g = ctx.createLinearGradient(0, y0, 0, y1); g.addColorStop(0, c0); g.addColorStop(1, c1); return g; };
  ctx.fillStyle = mg(-0.65, -0.2, 'rgb(90,94,104)', 'rgb(24,26,32)'); ctx.beginPath(); ctx.roundRect(-0.32, -0.66, 0.6, 0.42, 0.08); ctx.fill();
  ctx.fillStyle = mg(-0.5, -0.3, 'rgb(236,240,246)', 'rgb(90,96,106)'); ctx.beginPath(); ctx.moveTo(-0.1, -0.36); ctx.lineTo(-0.9, -0.5); ctx.lineTo(-0.92, -0.42); ctx.lineTo(-0.1, -0.28); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(30,26,26)'; ctx.beginPath(); ctx.moveTo(-0.95, -0.84); ctx.quadraticCurveTo(-0.5, -0.98, -0.12, -0.9); ctx.lineTo(-0.15, -0.8); ctx.lineTo(-0.9, -0.76); ctx.closePath(); ctx.fill();
  ctx.fillStyle = mg(-1.02, -0.66, 'rgb(255,226,120)', 'rgb(150,100,20)'); ctx.beginPath(); ctx.moveTo(-0.18, -0.9); ctx.bezierCurveTo(0.0, -1.06, 0.42, -1.04, 0.5, -0.88); ctx.lineTo(0.38, -0.66); ctx.lineTo(-0.2, -0.7); ctx.closePath(); ctx.fill();
  ell(ctx, 0.12, -0.95, 0.16, 0.035, 'rgba(255,255,255,0.6)');
  ctx.strokeStyle = 'rgb(200,206,214)'; ctx.lineWidth = 0.06; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0.73, -0.34); ctx.lineTo(0.52, -1.02); ctx.stroke();
  ctx.strokeStyle = 'rgb(40,40,46)'; ctx.lineWidth = 0.05; ctx.beginPath(); ctx.moveTo(0.42, -1.1); ctx.lineTo(0.62, -1.04); ctx.stroke();
  ctx.fillStyle = 'rgb(214,92,60)'; ctx.beginPath(); ctx.moveTo(0.3, -0.62); ctx.quadraticCurveTo(0.8, -0.72, 0.98, -0.5); ctx.lineTo(0.96, -0.44); ctx.quadraticCurveTo(0.7, -0.56, 0.36, -0.52); ctx.closePath(); ctx.fill();
  wheel(ctx, 0.73, -0.34, 0.34, t);
  ell(ctx, 0.62, -0.96, 0.07, 0.07, 'rgb(255,250,230)');
  ctx.restore();
  const hp = [x + Math.cos(rot) * 0.62 * S + Math.sin(rot) * 0.96 * S, y + Math.sin(rot) * 0.62 * S - Math.cos(rot) * 0.96 * S];
  const tl = [x + Math.cos(rot) * -0.95 * S + Math.sin(rot) * 0.86 * S, y + Math.sin(rot) * -0.95 * S - Math.cos(rot) * 0.86 * S];
  glow(ctx, tl[0], tl[1], 0.25 * S, [255, 70, 50], 0.8);
  return { head: hp, rear: [x - 0.72 * S * Math.cos(rot), y - 0.72 * S * Math.sin(rot)] };
}
function rideBike(ctx, t, R) {
  const S = 250, enter = easeOut(prog(t, T.istp - 0.6, T.istp + 0.15)), x0 = lerp(-760, 470, enter) + 12 * Math.sin(t * 1.3), y0 = R.roadY + 196 + 3 * Math.sin(t * 19);
  // 车还没进画面：左边一团越来越亮的车灯光
  if (enter <= 0.001) { const k = sm(t, T.istp - 1.3, T.istp - 0.6); glow(ctx, 0, R.roadY + 90, 700 * k, [255, 244, 220], 0.45 * k); return; }
  const jump = bump(t, T.adv - 0.15, T.free + 0.2), rot = -0.2 * jump, lift = 70 * jump;
  // 风：几道很淡的长条，往后掠
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 12; i++) { const y = 480 + hash(i * 3.3) * 760 + R.dy, len = 160 + hash(i * 1.9) * 260, x = ((hash(i * 7.1) * 1600 - R.tt * 2600 * (0.7 + hash(i))) % 1600 + 1600) % 1600 - 260; const sg = ctx.createLinearGradient(x, 0, x + len, 0); sg.addColorStop(0, 'rgba(220,230,255,0)'); sg.addColorStop(0.7, `rgba(220,230,255,${0.16 * enter})`); sg.addColorStop(1, 'rgba(220,230,255,0)'); ctx.fillStyle = sg; ctx.beginPath(); ctx.roundRect(x, y, len, 6, 3); ctx.fill(); }
  ctx.restore();
  const out = bike(ctx, x0, y0 + R.dy * 0 - lift, S, t, rot);
  // 车头灯光柱 + 照亮的路面
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const [hx, hy] = out.head;
  const bg = ctx.createLinearGradient(hx, 0, hx + 900, 0); bg.addColorStop(0, 'rgba(255,248,226,0.34)'); bg.addColorStop(1, 'rgba(255,248,226,0)'); ctx.fillStyle = bg;
  ctx.beginPath(); ctx.moveTo(hx, hy - 10); ctx.lineTo(hx + 900, hy - 150 + rot * 600); ctx.lineTo(hx + 900, hy + 280 + rot * 600); ctx.lineTo(hx, hy + 12); ctx.closePath(); ctx.fill(); ctx.restore();
  glow(ctx, hx, hy, 140, [255, 248, 226], 0.8); glow(ctx, hx + 380, y0 + 10, 300, [255, 240, 210], 0.18);
  // 火花：从后轮甩出去，冒险那一下炸开更多
  const burst = 1 + 2.2 * bump(t, T.adv - 0.1, T.free + 0.3), n = Math.round(30 * burst), [rx, ry] = [out.rear[0], y0 - lift * 0.4];
  for (let i = 0; i < n; i++) {
    const age = ((t * 1.7 + hash(i * 2.9)) % 1) * 0.75, vx = -(500 + 700 * hash(i * 1.3)), vy = -(250 + 520 * hash(i * 4.7)) * (0.6 + 0.4 * burst / 3.2);
    const px = rx + vx * age, py = ry + vy * age + 1300 * age * age; if (py > y0 + 30) continue;
    const a = (1 - age / 0.75) * enter, c = mix([255, 240, 170], [255, 110, 50], age / 0.75);
    glow(ctx, px, py, 16 + 10 * hash(i), c, 0.55 * a); ctx.fillStyle = rgba([255, 250, 220], a); ctx.beginPath(); ctx.arc(px, py, 2.6, 0, 7); ctx.fill();
  }
}

// ---------- 升空俯瞰：他家暖灯是圆心，摩托光轨一圈圈绕出去，又绕回来 ----------
const ORB = { R0: 3.4, R1: 11.5, turns: 2.25 };
function orbPt(u) { const th = -Math.PI / 2 - 2 * Math.PI * ORB.turns * (1 - u), r = ORB.R0 + ORB.R1 * Math.pow(Math.sin(Math.PI * u), 1.15); return [r * Math.cos(th), r * Math.sin(th)]; }
function orbU(t) {
  const k = [[T.up - 0.45, 0.3], [T.enough, 0.64], [T.arrive, 1]];
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) { const v = prog(t, k[i - 1][0], k[i][0]); return lerp(k[i - 1][1], k[i][1], i === 2 ? easeOut(v) : v); }
  return 1;
}
function orbCam(t) {
  const r = sm(t, T.up - 0.45, T.up + 0.9);
  let h = lerp(8, 34, r), pitch = lerp(0.3, 0.95, r), f = lerp(1150, 1380, r) + 90 * sm(t, T.up + 0.9, T.arrive), F = [0, 0, 0];
  const d = easeIn(prog(t, T.arrive - 0.2, T.dive1));
  if (d > 0) { h = lerp(h, 1.8, d); pitch = lerp(pitch, 0.07, d); f = lerp(f, 3000, d * d); F = [0, lerp(0, 1.1, d), lerp(0, -2.5, d)]; }
  const z0 = F[2] + (F[1] - h) * Math.cos(pitch) / Math.sin(pitch);
  return E.cam3({ cx: W / 2, cy: 660, f, h, z0, x0: F[0], pitch });
}
const TREES = Array.from({ length: 84 }, (_, i) => { const r = 6.5 + hash(i * 3.7) * 26, an = hash(i * 9.1) * Math.PI * 2; return { X: r * Math.cos(an), Z: r * Math.sin(an), h: 2.6 + hash(i * 1.3) * 2.6 }; }).filter(o => !(o.Z < -2 && Math.abs(o.X) < 2.4));
function tree(ctx, p, o, warmK) {
  if (p.depth(o.Z) < 1) return; const [x, y] = p(o.X, 0, o.Z), top = p(o.X, o.h, o.Z), s = p.px(o.Z, 1), hgt = y - top[1], w = 0.9 * s;
  if (hgt < 2) return; ell(ctx, x + w * 0.2, y, w * 0.9, w * 0.3, 'rgba(0,0,0,0.35)');
  const dist = Math.hypot(o.X, o.Z), lit = warmK * clamp(1 - dist / 22, 0, 1), side = o.X > 0 ? -1 : 1;
  for (let k = 0; k < 3; k++) {
    const yb = y - hgt * (0.12 + k * 0.26), yt = yb - hgt * 0.5, ww = w * (1 - k * 0.24);
    const g = ctx.createLinearGradient(x - ww * side, 0, x + ww * side, 0); g.addColorStop(0, rgba(mix([22, 44, 50], [200, 140, 80], lit * 0.7))); g.addColorStop(1, 'rgb(10,20,26)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - ww, yb); ctx.quadraticCurveTo(x, yb + ww * 0.25, x + ww, yb); ctx.lineTo(x, yt); ctx.closePath(); ctx.fill();
  }
}
function house(ctx, p, t, L, doorOpen) {
  const ps = (pts, st) => polyS(ctx, p, pts, st);
  // 窗光洒在地上
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const [a0, a1] of [[-1.9, -0.9], [0.9, 1.9], [-0.45, 0.45]]) { const q0 = p(0, 0, -2.5), q1 = p(0, 0, -8), g = ctx.createLinearGradient(0, q0[1], 0, q1[1]); g.addColorStop(0, rgba(WARM, 0.32 * L)); g.addColorStop(1, rgba(WARM, 0)); ps([[a0, 0, -2.5], [a1, 0, -2.5], [a1 + 0.9, 0, -8], [a0 - 0.9, 0, -8]], g); }
  ctx.restore();
  ps([[-3.3, 3, 2.8], [3.3, 3, 2.8], [3.3, 4.8, 0], [-3.3, 4.8, 0]], 'rgb(40,44,70)');
  const fw0 = p(0, 3, -2.5), fw1 = p(0, 0, -2.5), wg = ctx.createLinearGradient(0, fw0[1], 0, fw1[1]); wg.addColorStop(0, 'rgb(150,110,90)'); wg.addColorStop(1, 'rgb(96,64,52)');
  ps([[-3, 0, -2.5], [3, 0, -2.5], [3, 3, -2.5], [-3, 3, -2.5]], wg);
  for (const [a0, a1] of [[-1.9, -0.9], [0.9, 1.9]]) {
    ps([[a0, 1.0, -2.51], [a1, 1.0, -2.51], [a1, 2.2, -2.51], [a0, 2.2, -2.51]], rgba(mix([60, 40, 30], [255, 214, 150], L)));
    const c = p((a0 + a1) / 2, 1.6, -2.5); glow(ctx, c[0], c[1], p.px(-2.5, 2.2), WARM, 0.5 * L); glow(ctx, c[0], c[1], p.px(-2.5, 0.6), CANDLE, 0.6 * L);
    ps([[(a0 + a1) / 2 - 0.05, 1.0, -2.52], [(a0 + a1) / 2 + 0.05, 1.0, -2.52], [(a0 + a1) / 2 + 0.05, 2.2, -2.52], [(a0 + a1) / 2 - 0.05, 2.2, -2.52]], 'rgb(70,46,34)');
  }
  ps([[-0.45, 0, -2.51], [0.45, 0, -2.51], [0.45, 2.1, -2.51], [-0.45, 2.1, -2.51]], rgba(mix([80, 52, 36], [255, 220, 160], doorOpen)));
  if (doorOpen > 0.02) { const c = p(0, 1, -2.5); glow(ctx, c[0], c[1], p.px(-2.5, 2.4), WARM, 0.6 * doorOpen); }
  ps([[-0.45 + 0.9 * doorOpen * 0.85, 0, -2.52], [0.45, 0, -2.52], [0.45, 2.1, -2.52], [-0.45 + 0.9 * doorOpen * 0.85, 2.1, -2.52]], 'rgb(96,62,42)');
  const pl = p(0, 2.35, -2.55); glow(ctx, pl[0], pl[1], p.px(-2.5, 1.2), CANDLE, 0.8 * L);
  // 前坡屋顶 + 烟囱 + 烟
  ps([[1.6, 3.6, 0.6], [2.2, 3.6, 0.6], [2.2, 5.6, 0.6], [1.6, 5.6, 0.6]], 'rgb(90,60,50)');
  const r0 = p(0, 4.8, 0), r1 = p(0, 3, -2.8), rg = ctx.createLinearGradient(0, r0[1], 0, r1[1]); rg.addColorStop(0, 'rgb(60,64,96)'); rg.addColorStop(1, rgba(mix([44, 40, 60], [150, 100, 70], 0.5 * L)));
  ps([[-3.3, 3, -2.8], [3.3, 3, -2.8], [3.3, 4.8, 0], [-3.3, 4.8, 0]], rg);
  for (let i = 0; i < 6; i++) { const v = (t * 0.25 + i / 6) % 1, c = p(1.9 + v * 1.5, 5.8 + v * 4, 0.6 + v * 2), r = p.px(0.6, 0.4 + v * 1.4); ell(ctx, c[0], c[1], r, r, rgba([180, 186, 210], 0.22 * (1 - v))); }
}
function trail(ctx, p, t, u, warmK) {
  const N = Math.max(2, Math.round(240 * u)), pts = [];
  for (let i = 0; i <= N; i++) { const v = u * i / N, [X, Z] = orbPt(v), s = p(X, 0.4, Z); pts.push({ s, v, X, Z }); }
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const step = 10;
  for (let i0 = 0; i0 < N; i0 += step) {
    const i1 = Math.min(N, i0 + step + 1), m = pts[Math.min(N, i0 + (step >> 1))], age = u - m.v, k = 0.32 + 0.68 * Math.exp(-age * 5), wpx = p.px(m.Z, 0.95) * (0.5 + 0.5 * k);
    const warm = warmK * clamp(1 - Math.hypot(m.X, m.Z) / 8, 0, 1), c = mix(TEALC, WARM, warm);
    for (const [ww, a, cc] of [[wpx * 3.2, 0.08, c], [wpx * 1.4, 0.22, c], [wpx * 0.55, 0.5, c], [wpx * 0.2, 0.9, mix(c, [255, 255, 255], 0.65)]]) {
      ctx.strokeStyle = rgba(cc, a * k); ctx.lineWidth = Math.max(1.5, ww); ctx.beginPath();
      for (let i = i0; i <= i1 && i <= N; i++) i === i0 ? ctx.moveTo(pts[i].s[0], pts[i].s[1]) : ctx.lineTo(pts[i].s[0], pts[i].s[1]);
      ctx.stroke();
    }
  }
  ctx.restore();
  // 光轨里流动的光点（让光带有体积）
  for (let i = 0; i < 110; i++) { const v = u - ((t * 0.08 + hash(i * 2.3)) % 1) * Math.min(u, 0.35), q = pts[Math.max(0, Math.round(v / Math.max(u, 1e-4) * N))], j = (hash(i * 8.7) - 0.5) * p.px(q.Z, 0.7); glow(ctx, q.s[0] + j, q.s[1] + j * 0.4, 9 + 9 * hash(i), mix(TEALC, [255, 255, 255], 0.5), 0.5 * (1 - (u - v) / 0.35)); }
  for (let i = 0; i < 46; i++) { const v = u * hash(i * 6.1), q = pts[Math.round(v / Math.max(u, 1e-4) * N)], up = ((t * 0.4 + hash(i)) % 1); glow(ctx, q.s[0] + Math.sin(t + i) * 8, q.s[1] - up * 60, 10 + 8 * hash(i * 2), mix(TEALC, [255, 255, 255], 0.4), 0.35 * (1 - up)); }
  return pts[N];
}
function drawOrbit(ctx, t) {
  const p = orbCam(t), u = orbU(t);
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgb(10,12,32)'); g.addColorStop(1, 'rgb(40,40,80)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const zn = p.z0 + 0.6;
  // 远山（只在镜头还没升高时看得到）
  ctx.beginPath(); for (let i = 0; i <= 40; i++) { const X = -260 + 520 * i / 40, Y = 14 + 12 * Math.sin(i * 0.7) + 6 * Math.sin(i * 1.9), s = p(X, Y, 140); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); } const e1 = p(260, 0, 140), e0 = p(-260, 0, 140); ctx.lineTo(e1[0], e1[1]); ctx.lineTo(e0[0], e0[1]); ctx.closePath(); ctx.fillStyle = 'rgb(22,22,46)'; ctx.fill();
  const q0 = p(0, 0, 140), q1 = p(0, 0, zn), gg = ctx.createLinearGradient(0, q0[1], 0, Math.min(H * 2, q1[1]));
  gg.addColorStop(0, 'rgb(26,30,52)'); gg.addColorStop(0.5, 'rgb(18,30,36)'); gg.addColorStop(1, 'rgb(10,18,22)');
  polyS(ctx, p, [[-300, 0, zn], [300, 0, zn], [300, 0, 140], [-300, 0, 140]], gg);
  for (let i = 0; i < 24; i++) { const X = (hash(i * 3.3) - 0.5) * 70, Z = (hash(i * 5.9) - 0.4) * 70; if (p.depth(Z) < 2) continue; const s = p(X, 0, Z); glow(ctx, s[0], s[1], p.px(Z, 6), [40, 70, 70], 0.18); }
  const houseL = 0.8 + 0.4 * sm(t, T.esfj, T.gentle) + 0.15 * Math.sin(t * 2.2) * sm(t, T.gentle, T.soothe6);
  const hc = p(0, 0, 0);
  if (p.depth(0) > 1) { E.pool(ctx, p, 0, 0, 13, WARM, 0.22 * houseL); glow(ctx, hc[0], hc[1], p.px(0, 16), WARM, 0.18 * houseL); }
  // 暖光一圈圈往外漾（照顾、安抚）
  for (let k = 0; k < 3; k++) { const t0 = T.gentle - 0.3 + k * 0.55, v = prog(t, t0, t0 + 2.4); if (v <= 0 || v >= 1) continue; softRing(ctx, hc[0], hc[1], p.px(0, 4 + v * 16), p.px(0, 1.6), WARM, 0.22 * Math.sin(v * Math.PI), Math.sin(p.pitch) * 0.95); }
  const warmK = sm(t, T.gentle - 0.2, T.soothe6 + 0.4);
  const items = TREES.filter(o => o.Z > zn).sort((a, b) => b.Z - a.Z);
  for (const o of items) if (o.Z > 0) tree(ctx, p, o, houseL);
  house(ctx, p, t, houseL, sm(t, T.soothe6 - 0.3, T.soothe6 + 0.3));
  // 门口的他：小小一个发光的人在等
  const hs = sm(t, T.esfj + 0.2, T.esfj + 0.8);
  if (hs > 0.01 && p.depth(-3.1) > 1.5) { const out = E.hero3(ctx, p, -0.9, -3.1, { umbrella: false, cake: false, book: false, a: hs, rs: -2.4 + 0.4 * Math.sin(t * 6), re: 1.4, glow: 0.8, eyes: 'happy' }); glow(ctx, out.chest[0], out.chest[1], p.px(-3.1, 2.4), WARM, 0.4 * hs); }
  for (const o of items) if (o.Z <= 0) tree(ctx, p, o, houseL);
  const head = trail(ctx, p, t, u, warmK);
  // 光轨的头：摩托车灯 + 一点火花
  if (head) {
    const [X, Z] = orbPt(u), [X2, Z2] = orbPt(Math.max(0, u - 0.004)), s0 = p(X, 0.4, Z), s1 = p(X2, 0.4, Z2), an = Math.atan2(s0[1] - s1[1], s0[0] - s1[0]), R = p.px(Z, 1);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.translate(s0[0], s0[1]); ctx.rotate(an); const bg = ctx.createLinearGradient(0, 0, R * 6, 0); bg.addColorStop(0, 'rgba(255,250,230,0.35)'); bg.addColorStop(1, 'rgba(255,250,230,0)'); ctx.fillStyle = bg; ctx.beginPath(); ctx.moveTo(0, -R * 0.2); ctx.lineTo(R * 6, -R * 1.8); ctx.lineTo(R * 6, R * 1.8); ctx.lineTo(0, R * 0.2); ctx.closePath(); ctx.fill(); ctx.restore();
    glow(ctx, s0[0], s0[1], R * 3, [220, 250, 255], 0.75); glow(ctx, s0[0], s0[1], R * 0.9, [255, 255, 255], 1);
    const moving = u < 0.999;
    if (moving) for (let i = 0; i < 16; i++) { const age = ((t * 2 + hash(i * 2.9)) % 1) * 0.5, px = s0[0] - Math.cos(an) * age * 500 + (hash(i * 4.1) - 0.5) * age * 260, py = s0[1] - Math.sin(an) * age * 500 + (hash(i * 7.3) - 0.5) * age * 260; glow(ctx, px, py, 10, SPARK, 0.7 * (1 - age * 2)); }
  }
  ctx.fillStyle = 'rgba(8,8,20,0.0)';
  E.vignetteWarm(ctx, 0.45);
}

// ---------- 角色状态 ----------
const POSE = { raise: [-2.6, 1.6], point: [-1.1, 0.7], offer: [0.3, -0.25], cover: [-2.6, 0.5], eat: [-1.3, -0.7], hug: [-1.9, 1.1] };
function armMix(w) { let rs = 0, re = 0; for (const k in w) { rs += POSE[k][0] * w[k]; re += POSE[k][1] * w[k]; } return [rs, re]; }
const HOFF = { umbrella: false, cake: false, book: false };
function hero1(t) {
  const wu = prog(t, T.T0, T.gong - 0.05), X = lerp(-2.4, -0.8, easeInOut(wu)), g = gait(t, wu > 0 && wu < 1);
  const w = {
    point: sm(t, T.dos - 0.35, T.dos - 0.05) * (1 - sm(t, T.hope - 0.2, T.hope + 0.1)) + sm(t, T.own - 0.05, T.own + 0.25) * (1 - sm(t, T.e4 + 0.3, T.win0 + 0.4)),
    raise: sm(t, T.agree - 0.3, T.agree - 0.05) * (1 - sm(t, T.f3 - 0.2, T.f3 + 0.2)),
    offer: sm(t, T.never - 0.35, T.never - 0.05) * (1 - sm(t, T.f4 - 0.3, T.f4 + 0.05)) + sm(t, T.care - 0.35, T.care - 0.05) * (1 - sm(t, T.own - 0.3, T.own)),
    hug: sm(t, T.loyal - 0.3, T.loyal) * (1 - sm(t, T.share + 0.1, T.share + 0.4)),
  };
  let [rs, re] = armMix(w);
  for (const b of T.bowl) { rs -= 0.85 * bump(t, b - 0.22, b + 0.18); re += 0.4 * bump(t, b - 0.22, b + 0.18); }
  rs += 0.12 * Math.sin(t * 9) * sm(t, T.care, T.care + 0.2) * (1 - sm(t, T.own - 0.3, T.own)); // 盛汤：手腕晃
  const o = { ...HOFF, rs, re, ...g, eyes: 'open', mouth: 'grin', flip: false };
  if ((t > T.tidy && t < T.tidy + 1.2) || (t > T.agree && t < T.f3 + 0.2) || (t > T.never && t < T.f4)) o.eyes = 'happy';
  o.lean = 0.07 * sm(t, T.loyal - 0.3, T.loyal) * (1 - sm(t, T.bday - 0.6, T.bday - 0.3));
  o.glow = 0.6 * sm(t, T.loyal - 0.2, T.loyal + 0.2) * (1 - sm(t, T.bday - 0.6, T.bday - 0.3)) + 0.4 * bump(t, T.tidy - 0.1, T.tidy + 1.0) + 0.3 * (1 - sm(t, T.T0, T.T0 + 0.6));
  o.umbrella = t > T.share - 0.2 && t < T.bday - 0.35; o.um = 0.45 * sm(t, T.share - 0.2, T.share + 0.2);
  o.cake = t > T.never - 0.4 && t < T.f4 - 0.08;
  if (t > T.own - 0.05 && t < T.win0 + 0.3) { o.brow = 1; o.mouth = 'flat'; o.tilt = 0.3; }
  return { X, Z: 5.95, o, w };
}
function partner1(t) {
  return { X: 0.78, Z: 6.05, o: { flip: true, warm: 0.6 * sm(t, T.loyal, T.loyal + 0.4) * (1 - sm(t, T.bday - 0.6, T.bday - 0.3)) + 0.5 * bump(t, T.never, T.f4 + 0.3), inner: 0.5 * bump(t, T.never, T.f4 + 0.3),
    lean: -0.07 * bump(t, T.own + 0.2, T.e4 + 0.4) + 0.05 * bump(t, T.loyal - 0.2, T.share), bob: 14 * bump(t, T.agree - 0.1, T.agree + 0.3) }, hand: sm(t, T.agree - 0.15, T.agree + 0.05) * (1 - sm(t, T.f3 - 0.2, T.f3 + 0.1)) };
}
function kid1(t) {
  return { X: 0.02, Z: 5.78, o: { m: 1.05, Y: 0.42, flip: false, bob: 22 * bump(t, T.agree - 0.15, T.agree + 0.3) + 8 * bump(t, T.wear + 0.25, T.wear + 0.6) }, hand: sm(t, T.agree - 0.2, T.agree) * (1 - sm(t, T.f3 - 0.2, T.f3 + 0.1)) };
}
function hero2(t) {
  let X, Z, moving = false; const o = { ...HOFF, eyes: 'open', mouth: 'grin', flip: false }, w = {};
  if (t < T.f8 - 0.12) {
    const u = prog(t, T.dive1 - 0.1, T.greet - 0.15); X = lerp(0.2, 0.85, easeInOut(u)); Z = lerp(6.9, 7.35, easeInOut(u)); moving = u > 0 && u < 1;
    w.hug = sm(t, T.greet - 0.2, T.greet + 0.1) * (1 - sm(t, T.calm - 0.45, T.calm - 0.2));
    w.offer = sm(t, T.calm - 0.3, T.calm) * (1 - sm(t, T.rest + 0.2, T.rest + 0.6));
    if (t > T.greet) o.eyes = 'happy'; if (t > T.calm) o.mouth = 'smile';
    o.glow = 0.5 * sm(t, T.calm, T.rest + 0.3);
  } else if (t < T.f9 - 0.24) {
    X = -0.8; Z = 5.95; o.eyes = t > T.comp ? 'happy' : 'open'; o.glow = 0.4 * sm(t, T.comp - 0.2, T.comp + 0.4);
  } else {
    X = -0.5; Z = 4.0;
    w.eat = sm(t, T.self - 0.2, T.self + 0.1) * (1 - sm(t, T.f10 - 0.4, T.f10 - 0.1));
    w.raise = 0.8 * sm(t, T.strict - 0.4, T.strict - 0.1) * (1 - sm(t, T.f11 - 0.3, T.f11));
    w.cover = sm(t, T.awk - 0.1, T.awk + 0.15) * (1 - sm(t, T.e11 + 1.4, T.e11 + 1.9));
    if (t > T.self - 0.1 && t < T.f10 - 0.2) { o.eyes = 'happy'; o.mouth = 'smile'; }
    if (t > T.strict - 0.4 && t < T.f11 - 0.1) { o.brow = 1; o.mouth = 'flat'; }
    const pr = sm(t, T.proud - 0.35, T.proud) * (1 - sm(t, T.rude, T.rude + 0.25));
    if (pr > 0.05) { o.eyes = 'happy'; o.glow = 0.45 * pr; o.warm = 0.15 * pr; o.lean = -0.06 * pr; }
    const bl = sm(t, T.awk - 0.15, T.awk + 0.2) * (1 - sm(t, T.e11 + 1.6, T.e11 + 2.2));
    if (bl > 0.3) { o.eyes = 'closed'; o.mouth = 'o'; o.nod = 0.6 * bl; }
    o.pr = pr; o.bl = bl;
  }
  let [rs, re] = armMix(w);
  if (t >= T.f8 - 0.12 && t < T.f9 - 0.24) for (const s of T.stow) { rs -= 1.0 * bump(t, s - 0.2, s + 0.25); re += 0.4 * bump(t, s - 0.2, s + 0.25); }
  if (t >= T.f9 - 0.24) for (const s of T.kidIt) { rs += 0.4 * bump(t, s - 0.2, s + 0.2); }
  re += 0.3 * Math.max(0, Math.sin((t - T.self) * 7)) * sm(t, T.self, T.self + 0.2) * (1 - sm(t, T.f10 - 0.5, T.f10 - 0.2)); // 一口一口吃
  Object.assign(o, gait(t, moving), { rs, re });
  return { X, Z, o, w };
}
function istp2(t) {
  if (t < T.f8 - 0.12) {
    const u = prog(t, T.dive1 - 0.1, T.greet + 0.05), X = lerp(2.65, 2.25, easeOut(u)), Z = lerp(9.35, 8.25, easeOut(u));
    const spark = 1 - sm(t, T.calm + 0.1, T.rest + 0.35);
    return { X, Z, o: { flip: true, bob: gait(t, u > 0 && u < 1).bob, lean: 0.04 * spark * Math.sin(t * 9), inner: 0.7 * sm(t, T.calm, T.rest + 0.4), warm: 0.5 * sm(t, T.calm, T.rest + 0.4) }, spark };
  }
  if (t < T.f9 - 0.24) return { X: 0.45, Z: 6.05, o: { flip: true, warm: 0.4 * sm(t, T.comp - 0.2, T.comp + 0.4), inner: 0.4 * sm(t, T.comp - 0.2, T.comp + 0.4) }, spark: 0 };
  return { X: 0.85, Z: 6.4, o: { flip: true, dim: 0.12, warm: 0.2 }, spark: 0 };
}
function kid2(t) {
  const face = sm(t, T.rude - 0.05, T.rude + 0.1) * (1 - sm(t, T.e11 + 0.4, T.e11 + 0.8));
  const flip = !(t > T.polite - 0.35 && t < T.rude - 0.15);
  const bow = 0.6 * sm(t, T.polite + 0.05, T.polite + 0.35) * (1 - sm(t, T.polite + 1.05, T.polite + 1.4));
  const straight = sm(t, T.req - 0.25, T.req) * (1 - sm(t, T.f11 - 0.2, T.f11 + 0.1));
  let bob = 10 * straight + 6 * Math.abs(Math.sin((t - T.rude) * 14)) * face + 12 * bump(t, T.full - 0.1, T.full + 0.3);
  const wu = prog(t, T.f9 - 0.2, T.f9 + 0.9); bob += gait(t, wu > 0 && wu < 1, 3).bob;
  return { X: lerp(1.7, 0.5, easeOut(wu)), Z: 3.3, face, o: { m: 1.05, flip, bob, slump: -0.35 * straight, lean: 0.08 * Math.sin((t - T.rude) * 18) * face, bow: flip ? 0 : bow } };
}
function guest(t) {
  if (t < T.guestIn) return null; const u = prog(t, T.guestIn, T.polite - 0.2);
  const shock = sm(t, T.rude + 0.1, T.rude + 0.3);
  return { X: lerp(2.6, 2.3, easeOut(u)), Z: lerp(9.4, 8.7, easeOut(u)), o: { flip: true, bob: gait(t, u > 0 && u < 1).bob, a: sm(t, T.guestIn, T.guestIn + 0.3), lean: -0.1 * shock, warm: 0.6 * sm(t, T.polite + 0.3, T.polite + 0.6) * (1 - shock) } };
}

// ---------- 屋内总绘制 ----------
const BOWL3 = [[-0.52, 5.12, [70, 170, 190]], [0.02, 5.02, [240, 196, 70]], [0.5, 5.12, [214, 92, 80]]];
const BOOTS = [[[1.22, 4.95, 0.95], [2.35, 8.55, 0]], [[1.55, 5.25, -1.5], [2.62, 8.55, 0]]];
const ITEMS = [[helmet, [0.02, 4.98], 1.35], [wrench, [0.28, 4.72], 1.6], [sack, [0.58, 5.02], 1.84]];
function lampLevel(t) {
  if (t >= T.dive1 - 0.1) return 1;
  if (t < T.lampOn) return 0.22;
  const u = t - T.lampOn, fl = u < 0.25 ? 0.55 + 0.45 * Math.abs(Math.sin(u * 60)) : 1;
  return (0.22 + 0.78 * (1 - Math.exp(-u * 9))) * fl + 0.1 * sm(t, T.live - 0.1, T.live + 0.3);
}
function bootPos(i, t) {
  const [a, b] = BOOTS[i], t0 = T.ask - 0.05 + i * 0.16, u = t >= T.dive1 - 0.1 ? 1 : prog(t, t0, t0 + 0.5), e = easeInOut(u);
  return { X: lerp(a[0], b[0], e), Z: lerp(a[1], b[1], e), Y: 0.9 * Math.sin(u * Math.PI), rot: lerp(a[2], b[2], e) + u * (1 - u) * 6, u, land: u >= 1 && t < T.dive1 ? Math.exp(-(t - t0 - 0.5) * 9) : 0 };
}
function itemState(i, t) { // F08：0 在 ISTP 手里飞向桌子；1 在桌上；2 飞上架子；3 在架子上
  const [, tb, sx] = ITEMS[i], t0 = T.item[i], t1 = T.stow[i];
  if (t < t0) return null;
  if (t < t0 + 0.35) return { k: 0, u: prog(t, t0, t0 + 0.35) };
  if (t < t1) return { k: 1, X: tb[0], Y: 0.76, Z: tb[1], land: Math.exp(-(t - t0 - 0.35) * 9) };
  const u = prog(t, t1, t1 + 0.5);
  if (u < 1) { const e = easeInOut(u); return { k: 2, X: lerp(tb[0], sx, e), Y: lerp(0.76, SHELF.Y, e) + 0.55 * Math.sin(u * Math.PI), Z: lerp(tb[1], 8.88, e), rot: (1 - u) * u * 4 }; }
  return { k: 3, X: sx, Y: SHELF.Y, Z: 8.88, land: Math.exp(-(t - t1 - 0.5) * 9) };
}
function drawItem(ctx, p, i, st, t) { const s = p.px(st.Z, 1, st.Y), [x, y] = p(st.X, st.Y, st.Z); ITEMS[i][0](ctx, x, y, s * (1 + (st.land || 0) * 0.1), st.rot || 0, t); if (st.k === 3 && st.land > 0.02) star4(ctx, x, y - 0.2 * s, 0.08 * s * st.land + 4, [255, 230, 160], st.land); }
function drawInterior(ctx, t) {
  const p = camIn(t), P2 = t >= T.dive1 - 0.1, lamp = lampLevel(t);
  const night = P2 ? 1 : sm(t, T.T0, T.f3 + 1), curtain = P2 ? 1 : sm(t, T.live - 0.15, T.live + 0.45), rainA = P2 ? 0 : bump(t, T.share - 0.35, T.bday - 0.1);
  shell(ctx, p, lamp);
  const [wa, wb] = windowWall(ctx, p, t, night, rainA, curtain);
  if (!P2 && t > T.win0) { ctx.save(); ctx.beginPath(); ctx.rect(wa[0], wa[1], wb[0] - wa[0], wb[1] - wa[1]); ctx.clip(); ctx.globalAlpha = sm(t, T.win0 + 0.05, T.win0 + 0.5); rideBike(ctx, t, drawRide(ctx, t)); ctx.restore(); }
  calendar(ctx, p, t); shelf(ctx, p);
  let dOpen = 0;
  if (P2) { dOpen = 1 - spring(t - (T.home + 0.4), 6, 12); if (t > T.guestIn - 0.3) dOpen = spring(t - (T.guestIn - 0.3), 7, 14); }
  door3(ctx, p, t, clamp(dOpen, 0, 1.05), t < T.f8 ? 1 : 0.15);
  polyS(ctx, p, [[2.05, 0.004, 8.25], [2.95, 0.004, 8.25], [2.95, 0.004, 8.9], [2.05, 0.004, 8.9]], 'rgb(64,84,64)');
  polyS(ctx, p, [[2.12, 0.006, 8.32], [2.88, 0.006, 8.32], [2.88, 0.006, 8.83], [2.12, 0.006, 8.83]], 'rgb(90,116,84)');
  for (let i = 0; i < 2; i++) { const b = bootPos(i, t); if (b.u >= 1) { const s = p.px(b.Z, 1), q = p(b.X, 0, b.Z); boot(ctx, q[0], q[1], s * (1 + b.land * 0.15), 0); if (b.land > 0.02) star4(ctx, q[0], q[1] - 0.2 * s, 10 + 30 * b.land, [255, 236, 190], b.land); } }
  sideboard(ctx, p, t, T);
  for (let i = 0; i < 3; i++) { const st = itemState(i, t); if (P2 && st && st.k === 3) drawItem(ctx, p, i, st, t); }
  if (p.depth(LAMP.Z) > 0.35) E.pendant(ctx, p, LAMP.X, LAMP.Z, { ht: RM.ht, drop: LAMP.drop, on: clamp(lamp, 0, 1), c: WARM, R: 1.9 });
  // 灯光里的浮尘
  if (p.depth(LAMP.Z) > 0.6) { const lb = p(LAMP.X, RM.ht - LAMP.drop, LAMP.Z), fl = p(LAMP.X, 0, LAMP.Z); ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < 26; i++) { const v = (hash(i * 2.3) + t * 0.03 * (0.5 + hash(i))) % 1, yy = lerp(lb[1] + 40, fl[1], v), half = lerp(30, p.px(LAMP.Z, 1.3), v), xx = lb[0] + (hash(i * 7.9) - 0.5) * 2 * half + Math.sin(t * 0.7 + i) * 8; ctx.fillStyle = rgba([255, 236, 190], 0.4 * lamp * Math.sin(v * Math.PI)); ctx.beginPath(); ctx.arc(xx, yy, 1.8 + hash(i) * 1.8, 0, 7); ctx.fill(); } ctx.restore(); }
  // 家规卷轴（F02 在后面；F10 挂在孩子和他中间的上方）
  if (!P2) scroll3(ctx, p, 0.25, 7.2, 2.52, 1.4, 1.05, spring(t - (T.set - 0.2), 7, 13) * (1 - sm(t, T.f3 - 0.2, T.f3 + 0.3)), t, SET_A, T.dos, T.donts);
  return { p, P2, lamp };
}
// 人物统一进离屏，按吊灯打光；离镜头太近的人虚焦（前景）
function persons(ctx, p, list, lampS) {
  const outs = {}, L = list.filter(q => p.depth(q.Z, 1) > 0.5).sort((a, b) => b.Z - a.Z);
  if (!L.length) return outs;
  E.lit(ctx, ox => {
    for (const q of L) {
      const d = p.depth(q.Z, 1), bl = clamp((1.7 - d) * 10, 0, 16); if (bl > 0.5) ox.filter = `blur(${bl.toFixed(1)}px)`;
      outs[q.id] = q.kind === 'hero' ? E.hero3(ox, p, q.X, q.Z, q.o) : folkAt(ox, p, q.key, q.X, q.Z, q.o);
      outs[q.id].s = outs[q.id].s || p.px(q.Z, 1.75) / 585; outs[q.id].px = p.px(q.Z, 1); ox.filter = 'none';
    }
  }, { x: lampS[0], y: lampS[1] + 220, r: 1500, c: WARM, k: 0.26, amb: 0.42 });
  return outs;
}
function table3(ctx, p, lamp) {
  const tw = 0.82, z1 = 4.45, z2 = 5.45, top = 0.76;
  for (const [x, z] of [[-tw + 0.08, z1 + 0.08], [tw - 0.08, z1 + 0.08], [-tw + 0.08, z2 - 0.08], [tw - 0.08, z2 - 0.08]]) polyS(ctx, p, [[x - 0.035, 0, z], [x + 0.035, 0, z], [x + 0.035, top, z], [x - 0.035, top, z]], 'rgb(66,40,28)');
  const a = p(0, top, z2), b = p(0, top, z1), g = ctx.createLinearGradient(0, a[1], 0, b[1]);
  g.addColorStop(0, rgba(mix([238, 220, 190], [60, 40, 30], 0.35 - 0.2 * lamp))); g.addColorStop(1, rgba(mix([214, 190, 160], [40, 26, 20], 0.4)));
  polyS(ctx, p, [[-tw, top, z1], [tw, top, z1], [tw, top, z2], [-tw, top, z2]], g);
  polyS(ctx, p, [[-0.24, top + 0.002, z1], [0.24, top + 0.002, z1], [0.24, top + 0.002, z2], [-0.24, top + 0.002, z2]], 'rgba(170,60,52,0.55)');
  const f0 = p(0, top, z1), f1 = p(0, top - 0.24, z1), fg = ctx.createLinearGradient(0, f0[1], 0, f1[1]); fg.addColorStop(0, 'rgb(214,192,160)'); fg.addColorStop(1, 'rgb(130,104,84)');
  polyS(ctx, p, [[-tw, top, z1], [tw, top, z1], [tw, top - 0.24, z1], [-tw, top - 0.24, z1]], fg);
  polyS(ctx, p, [[-0.24, top, z1], [0.24, top, z1], [0.24, top - 0.24, z1], [-0.24, top - 0.24, z1]], 'rgba(150,50,44,0.6)');
  const c = p(0, top, 4.9); if (p.depth(4.9) > 0.5) glow(ctx, c[0], c[1], p.px(4.9, 1.3), WARM, 0.14 * lamp);
}
// ---------- 第一段屋内：F01–F04 ----------
function act1(ctx, p, t, lampS) {
  const h = hero1(t), pa = partner1(t), kd = kid1(t);
  const O = persons(ctx, p, [{ id: 'pa', key: 'istp-male', X: pa.X, Z: pa.Z, o: pa.o }, { id: 'h', kind: 'hero', X: h.X, Z: h.Z, o: h.o }, { id: 'k', key: 'enfp-female', X: kd.X, Z: kd.Z, o: kd.o }], lampS);
  if (O.pa) raiseArm(ctx, O.pa, pa.hand, [70, 76, 90], 1);
  if (O.k) { raiseArm(ctx, O.k, kd.hand, [112, 170, 110], -1); const hr = 240 * O.k.s * 0.11, su = popIn(t, T.wear + 0.3); if (su > 0.01) { const nk = [lerp(O.k.chest[0], O.k.head[0], 0.4), lerp(O.k.chest[1], O.k.head[1], 0.4)], cu = prog(t, T.wear + 0.2, T.wear + 0.55); if (cu > 0) drape(ctx, nk[0], lerp(nk[1] - 160, nk[1], easeOut(cu)), hr * 2.3, [240, 196, 70], t > T.wear + 0.55 ? Math.exp(-(t - T.wear - 0.55) * 8) * Math.cos((t - T.wear - 0.55) * 24) : 0, false); void su; } }
  const tbl = p.z0 < 4.0;
  if (tbl) {
    table3(ctx, p, clamp(lampS[2], 0, 1));
    BOWL3.forEach(([bx, bz, col], i) => {
      const t0 = T.bowl[i], u = prog(t, t0, t0 + 0.42); if (u <= 0) return;
      const q = p(bx, 0.76, bz), s = p.px(bz, 1, 0.76) * 1.35, fill = i === 2 && t > T.care + 0.2 ? 'soup' : 'rice';
      if (u < 1 && O.h) { const e = easeInOut(u), x = lerp(O.h.hand[0], q[0], e), y = lerp(O.h.hand[1], q[1], e) - 140 * Math.sin(u * Math.PI); ctx.save(); ctx.translate(x, y); ctx.rotate((1 - u) * 1.2); bowl(ctx, 0, 0, s, col, fill); ctx.restore(); }
      else { const land = Math.exp(-(t - t0 - 0.42) * 9) * Math.cos((t - t0 - 0.42) * 22); bowl(ctx, q[0], q[1], s, col, fill, u < 1 ? 0 : land); steam(ctx, q[0], q[1] - 0.07 * s, s, t + i, sm(t, t0 + 0.4, t0 + 0.8) * 0.8); if (t > T.tidy - 0.1 && t < T.tidy + 0.9) star4(ctx, q[0] + 0.08 * s, q[1] - 0.12 * s, 0.05 * s * bump(t, T.tidy - 0.1 + i * 0.12, T.tidy + 0.5 + i * 0.12), [255, 236, 180], bump(t, T.tidy - 0.1 + i * 0.12, T.tidy + 0.5 + i * 0.12)); }
    });
    if (t > T.f4 - 0.1) { const q = p(-0.1, 0.76, 4.7), s = p.px(4.7, 1, 0.76), dr = easeOut(prog(t, T.f4 - 0.1, T.f4 + 0.1)); cake(ctx, q[0], q[1] - (1 - dr) * 40, s, t, 1, sm(t, T.f4, T.e4 + 2)); }
  }
  // 盛汤：勺子在他手里，汤一滴滴流进伴侣碗里
  const lu = sm(t, T.care - 0.3, T.care) * (1 - sm(t, T.own - 0.3, T.own));
  if (lu > 0.01 && O.h && tbl) {
    const hx = O.h.hand[0], hy = O.h.hand[1], s = O.h.px, q = p(BOWL3[2][0], 0.76, BOWL3[2][1]), tilt = 0.3 + 0.5 * Math.sin(t * 9) * 0.3 + 0.5 * lu;
    ctx.save(); ctx.globalAlpha *= lu; ladle(ctx, hx, hy, s, tilt); ctx.restore();
    const lx = hx + Math.cos(tilt) * 0.25 * s - Math.sin(tilt) * 0.07 * s, ly = hy + Math.sin(tilt) * 0.25 * s + Math.cos(tilt) * 0.07 * s;
    for (let i = 0; i < 9; i++) { const v = (t * 1.6 + i / 9) % 1, x = lerp(lx, q[0], v), y = lerp(ly, q[1] - 0.06 * s, v) - 60 * Math.sin(v * Math.PI); glow(ctx, x, y, 12, [230, 160, 80], 0.7 * lu); ell(ctx, x, y, 4, 5, rgba([240, 170, 90], lu)); }
  }
  // 乱放的靴子（在桌子前面的地板上）
  for (let i = 0; i < 2; i++) { const b = bootPos(i, t); if (b.u >= 1) continue; const d = p.depth(b.Z, b.Y); if (d < 0.6) continue; const q = p(b.X, b.Y, b.Z), s = p.px(b.Z, 1, b.Y); boot(ctx, q[0], q[1], s, b.rot); }
  return { O, h };
}
function act1fx(ctx, p, t, A) {
  const { O } = A;
  // 妥妥当当：一道暖光从左扫到右
  const sw = prog(t, T.tidy - 0.15, T.tidy + 0.75);
  if (sw > 0 && sw < 1) { const x = lerp(-300, W + 300, easeInOut(sw)); ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(x - 220, 0, x + 220, 0); g.addColorStop(0, 'rgba(255,220,160,0)'); g.addColorStop(0.5, `rgba(255,220,160,${0.16 * Math.sin(sw * Math.PI)})`); g.addColorStop(1, 'rgba(255,220,160,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, 1330); ctx.restore(); }
  // 意见一致：每只举起的手上方亮一个 ✓，桌上一圈暖光往外漾
  if (t > T.agree - 0.1 && t < T.f3 + 0.3) {
    const k = tt => popIn(t, tt) * (1 - sm(t, T.f3 - 0.25, T.f3 + 0.05));
    if (O.h) okMark(ctx, O.h.hand[0], O.h.hand[1] - 0.25 * O.h.px, k(T.agree - 0.05) * 1.3);
    if (O.k) okMark(ctx, O.k.chest[0] - 30, O.k.top[1] - 0.45 * O.h.px, k(T.agree + 0.06) * 1.3);
    if (O.pa) okMark(ctx, O.pa.chest[0] + 34, O.pa.top[1] - 0.35 * O.h.px, k(T.agree + 0.16) * 1.3);
    const v = prog(t, T.agree, T.agree + 1.4), c = p(0, 0.78, 4.9); if (v > 0 && v < 1 && p.z0 < 4) softRing(ctx, c[0], c[1], p.px(4.9, 0.3 + 1.8 * v), p.px(4.9, 0.35), WARM, 0.35 * Math.sin(v * Math.PI), 0.32);
  }
  // 忠诚、多情：暖光从他胸口一颗颗流到伴侣胸口
  const fa = sm(t, T.loyal - 0.25, T.loyal + 0.1) * (1 - sm(t, T.bday - 0.7, T.bday - 0.35));
  if (fa > 0.01 && O.h && O.pa) {
    const A0 = O.h.chest, B0 = O.pa.chest, C0 = [(A0[0] + B0[0]) / 2, Math.min(A0[1], B0[1]) - 160];
    for (let i = 0; i < 22; i++) { const v = (t * 0.45 + i / 22) % 1, w = 1 - v, x = w * w * A0[0] + 2 * w * v * C0[0] + v * v * B0[0], y = w * w * A0[1] + 2 * w * v * C0[1] + v * v * B0[1]; glow(ctx, x, y, 34, WARM, 0.5 * fa * Math.sin(v * Math.PI)); ell(ctx, x, y, 5, 5, rgba([255, 240, 200], fa * Math.sin(v * Math.PI))); }
    glow(ctx, B0[0], B0[1], 200, WARM, 0.25 * fa);
  }
  // 蛋糕：手里那块的蜡烛光
  if (O.h && t > T.never - 0.4 && t < T.f4 - 0.08) { glow(ctx, O.h.cake[0], O.h.cake[1] - 30, 260, [255, 190, 110], 0.35 * popIn(t, T.never - 0.4)); for (let i = 0; i < 8; i++) { const v = ((t - T.never) * 0.7 + hash(i * 3.1)) % 1; star4(ctx, O.h.cake[0] + (hash(i * 5.7) - 0.5) * 220, O.h.cake[1] - 40 - v * 200, 7 + 6 * hash(i), [255, 220, 140], 0.8 * Math.sin(v * Math.PI)); } }
}
// ---------- 第二段屋内：F07–F11 ----------
function act2(ctx, p, t, lampS) {
  const h = hero2(t), is = istp2(t), kd = kid2(t), gs = guest(t), F9 = t >= T.f9 - 0.24;
  const back = [{ id: 'is', key: 'istp-male', X: is.X, Z: is.Z, o: is.o }];
  if (!F9) back.push({ id: 'h', kind: 'hero', X: h.X, Z: h.Z, o: h.o });
  if (gs) back.push({ id: 'g', key: 'isfj-female', X: gs.X, Z: gs.Z, o: gs.o });
  const O = persons(ctx, p, back, lampS);
  if (p.z0 < 4.0) table3(ctx, p, 1);
  // F08 桌上的东西
  for (let i = 0; i < 3; i++) { const st = itemState(i, t); if (!st || F9) continue; if (st.k === 1) drawItem(ctx, p, i, st, t); }
  if (F9) { // 桌上剩下的盘子（饭后）
    const q = p(-0.2, 0.76, 5.0), s = p.px(5.0, 1, 0.76); if (p.depth(5.0) > 0.6) { bowl(ctx, q[0], q[1], s, [214, 92, 80], 'left'); bowl(ctx, q[0] + 0.32 * s, q[1] + 2, s, [70, 170, 190], 'left'); }
    const F = persons(ctx, p, [{ id: 'h', kind: 'hero', X: h.X, Z: h.Z, o: h.o }, { id: 'k', key: 'enfp-female', X: kd.X, Z: kd.Z, o: kd.o }], lampS);
    Object.assign(O, F);
  }
  // F08 手里的、飞着的东西
  for (let i = 0; i < 3; i++) {
    const st = itemState(i, t); if (!st || F9) continue;
    if (st.k === 0 && O.is) { const [, tb] = ITEMS[i], q = p(tb[0], 0.76, tb[1]), s = p.px(tb[1], 1, 0.76), e = easeInOut(st.u); const x = lerp(O.is.chest[0], q[0], e), y = lerp(O.is.chest[1], q[1], e) - 120 * Math.sin(st.u * Math.PI); ITEMS[i][0](ctx, x, y, s, (1 - st.u) * 0.8, t); }
    if (st.k === 2) drawItem(ctx, p, i, st, t);
  }
  return { O, h, is, kd, gs };
}
function act2fx(ctx, p, t, A) {
  const { O, h, is, kd } = A;
  // F07：头顶火花、披毯子、热茶
  if (O.is && t < T.f8 - 0.12) {
    const k = O.is.s * 0.85; sparks(ctx, O.is.top[0], O.is.top[1] - 26 * k, is.spark * k * (0.9 + 0.1 * Math.sin(t * 31)), t);
    puffs(ctx, O.is.top[0], O.is.top[1] - 20 * k, t, T.rest - 0.25, 6, [220, 220, 226], k);
    const bu = prog(t, T.greet - 0.05, T.greet + 0.4);
    if (bu > 0 && O.h) { const sq = t > T.greet + 0.4 ? Math.exp(-(t - T.greet - 0.4) * 8) * Math.cos((t - T.greet - 0.4) * 24) : 0, e = easeOut(bu); const sh = lerp(O.is.chest[1], O.is.head[1], 0.22); drape(ctx, lerp(O.h.hand[0], O.is.chest[0], e), lerp(O.h.hand[1] - 120, sh, e) - 80 * Math.sin(bu * Math.PI), 240 * O.is.s * 0.34, [178, 76, 62], sq); }
    if (O.h && t > T.calm - 0.45) { const g = easeInOut(prog(t, T.calm - 0.1, T.calm + 0.3)), p0 = O.h.hand, p1 = [O.is.chest[0] - 30 * k, O.is.chest[1] + 20 * k]; mug(ctx, lerp(p0[0], p1[0], g), lerp(p0[1], p1[1], g), O.h.px * 1.7, t, sm(t, T.calm - 0.45, T.calm - 0.3)); }
    if (t > T.calm) { glow(ctx, O.is.chest[0], O.is.chest[1], 200 * k, WARM, 0.12 * sm(t, T.calm, T.rest + 0.4)); }
  }
  // F08 互补：两人周围一圈光，一半青（他在外面闯）一半暖（他守着家），慢慢转成一个圆
  const ca = sm(t, T.comp - 0.3, T.comp + 0.4) * (1 - sm(t, T.f9 - 0.6, T.f9 - 0.25));
  if (ca > 0.01 && O.h && O.is) {
    const cx = (O.h.chest[0] + O.is.chest[0]) / 2, cy = (O.h.chest[1] + O.is.chest[1]) / 2 - 40, R = Math.max(260, Math.abs(O.is.chest[0] - O.h.chest[0]) * 0.95), close = sm(t, T.comp - 0.3, T.comp + 0.6);
    for (let i = 0; i < 64; i++) { const v = i / 64, an = v * Math.PI * 2 + t * 0.5, half = Math.cos(an - t * 0.5) > 0; if (v > 0.5 + 0.5 * close && v < 1) continue; const x = cx + Math.cos(an) * R, y = cy + Math.sin(an) * R * 0.42; glow(ctx, x, y, 26, i < 32 ? TEALC : WARM, 0.32 * ca); ell(ctx, x, y, 3.5, 3.5, rgba(mix(i < 32 ? TEALC : WARM, [255, 255, 255], 0.5), ca)); }
    glow(ctx, cx, cy + 60, R * 1.2, mix(TEALC, WARM, 0.5), 0.12 * ca);
  }
  // F09：孩子穿暖吃饱；他自己端着一小碗剩菜
  if (O.k) {
    const s = O.k.s, hr = 240 * s * 0.11, hd = O.k.head, it = T.kidIt;
    const cu = prog(t, it[0], it[0] + 0.35); if (cu > 0) drape(ctx, O.k.chest[0], lerp(O.k.chest[1] - 160, lerp(O.k.chest[1], O.k.head[1], 0.38), easeOut(cu)), 240 * s * 0.26, [90, 140, 206], t > it[0] + 0.35 ? Math.exp(-(t - it[0] - 0.35) * 8) * Math.cos((t - it[0] - 0.35) * 24) : 0, false);
    const hu = popIn(t, it[2]); if (hu > 0.01) { ctx.save(); ctx.translate(O.k.top[0] + 4 * s, O.k.top[1] + 26 * s); ctx.scale(hu, hu); knitHat(ctx, 0, 0, hr * 1.05); ctx.restore(); }
    const su = prog(t, it[3], it[3] + 0.3); if (su > 0) kidShoe(ctx, O.k.x, O.k.y - 50 * (1 - easeOut(su)), O.k.px || p.px(kd.Z, 1));
    const bu = prog(t, it[1], it[1] + 0.4); if (bu > 0 && O.h) { const e = easeOut(bu), x = lerp(O.h.hand[0], O.k.chest[0] - 16 * s, e), y = lerp(O.h.hand[1], O.k.chest[1] + 30 * s, e) - 80 * Math.sin(bu * Math.PI); const ps = p.px(kd.Z, 1), ba = 1 - sm(t, T.f10 - 0.4, T.f10); ctx.save(); ctx.globalAlpha *= ba; bowl(ctx, x, y, ps, [70, 170, 200], 'big', 0, 1.4); ctx.restore(); steam(ctx, x, y - 0.12 * ps, ps, t, sm(t, it[1] + 0.3, it[1] + 0.6) * ba, 4, 0.45); }
    const fv = prog(t, T.full - 0.1, T.full + 1.2); if (fv > 0 && fv < 1) softRing(ctx, O.k.chest[0], O.k.chest[1], 60 + 260 * fv, 50, WARM, 0.3 * Math.sin(fv * Math.PI), 1);
    if (kd.face > 0.01) tongueFace(ctx, hd, s * 1.1, t, T.rude, kd.face);
  }
  if (O.h && t > T.self - 0.4 && t < T.f10 - 0.2) { const a = sm(t, T.self - 0.4, T.self - 0.2) * (1 - sm(t, T.f10 - 0.45, T.f10 - 0.2)), ps = O.h.px; ctx.save(); ctx.globalAlpha *= a; bowl(ctx, O.h.hand[0] + 6, O.h.hand[1] + 0.06 * ps, ps, [150, 150, 160], 'left', 0, 1.3); ctx.restore(); }
  if (p.depth(4.6) > 0.5) scroll3(ctx, p, -0.02, 4.6, 2.9, 1.7, 1.05, spring(t - (T.strict - 0.55), 7, 13) * (1 - sm(t, T.f11 - 0.3, T.f11 + 0.2)), t, SET_B, T.strict + 0.15, T.req + 0.05);
  if (O.k && t > T.word - 0.1 && t < T.f11) okMark(ctx, O.k.top[0] + 40, O.k.top[1] - 60, popIn(t, T.word) * 1.4 * (1 - sm(t, T.f11 - 0.3, T.f11)));
  // F11：骄傲（发光、金色小星往上飘）/ 尴尬（脸红、头顶冒热气）
  const pr = h.o.pr || 0, bl = h.o.bl || 0;
  if (O.h && pr > 0.02) { const c = O.h.chest; for (let i = 0; i < 16; i++) { const v = ((t - T.proud) * 0.6 + hash(i * 3.1)) % 1, an = hash(i * 5.7) * Math.PI * 2; star4(ctx, c[0] + Math.cos(an) * (110 + 90 * v), c[1] - 80 + Math.sin(an) * 70 - v * 220, 9 + 8 * hash(i), [255, 216, 120], pr * Math.sin(v * Math.PI)); } glow(ctx, c[0], c[1] - 40, 340, [255, 200, 120], 0.1 * pr); }
  if (O.h && bl > 0.02) { const f = O.h.face, R = 0.16 * O.h.px; ctx.save(); const g = ctx.createRadialGradient(f[0], f[1], 0, f[0], f[1], R); g.addColorStop(0, `rgba(236,70,70,${0.45 * bl})`); g.addColorStop(1, 'rgba(236,70,70,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(f[0], f[1], R, 0, 7); ctx.fill(); ctx.restore(); puffs(ctx, O.h.top[0], O.h.top[1], t, T.awk - 0.1, 6, [250, 236, 236], 1.4); puffs(ctx, O.h.top[0] + 20, O.h.top[1], t, T.awk + 0.7, 5, [250, 236, 236], 1.2); }
}

// ---------- 屏幕层：泡泡、前景虚焦、景深 ----------
function bub(ctx, t, str, xy, t0, dur, o = {}) {
  const t1 = t0 + dur; if (!xy || t < t0 || t > t1 + 0.5) return;
  const a = sm(t, t0, t0 + 0.1) * (1 - sm(t, t1 + 0.25, t1 + 0.5));
  B.say(ctx, str, clamp(xy[0], 170, 910), clamp(xy[1], 140, 1180), a, { gray: sm(t, t1, t1 + 0.2), pop: popIn(t, t0), size: 52, ...o });
}
function fore(ctx, p, t, a) {
  if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; ctx.filter = 'blur(18px)';
  const ox = -p.x0 * 260, oz = (p.z0 - 2) * 30;
  ctx.save(); ctx.translate(-70 + ox - oz, 1250); for (let i = 0; i < 7; i++) { ctx.save(); ctx.rotate(-1.9 + i * 0.32 + 0.04 * Math.sin(t * 0.8 + i)); ell(ctx, 0, -190, 60, 210, rgba(mix([18, 40, 30], [40, 70, 50], hash(i)))); ctx.restore(); } ctx.restore();
  const mx = 1010 + ox * 1.3 + oz, my = 1260; const g = ctx.createLinearGradient(mx - 80, 0, mx + 80, 0); g.addColorStop(0, 'rgb(150,90,70)'); g.addColorStop(1, 'rgb(60,30,24)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(mx - 80, my - 170, 160, 190, 24); ctx.fill();
  ctx.filter = 'none'; glow(ctx, mx - 30, my - 120, 120, WARM, 0.25); ctx.restore();
}
function flash(ctx, a) { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = 1; ctx.fillStyle = rgba([255, 214, 160], 0.92 * a); ctx.fillRect(0, 0, W, H); ctx.restore(); glow(ctx, W / 2, H * 0.4, 1200, [255, 240, 210], 0.6 * a); }
function interior(ctx, t) {
  const R = drawInterior(ctx, t), p = R.p, lb = p(LAMP.X, RM.ht - LAMP.drop, LAMP.Z), lampS = [lb[0], lb[1], R.lamp];
  if (!R.P2) {
    const A = act1(ctx, p, t, lampS); act1fx(ctx, p, t, A);
    if (A.O.h) bub(ctx, t, '鞋摆好！', [A.O.h.top[0] + 150, A.O.h.top[1] - 70], T.own + 0.1, 1.5, { tail: [-60, 80] });
  } else {
    const A = act2(ctx, p, t, lampS); act2fx(ctx, p, t, A);
    if (A.O.h && t < T.f8) bub(ctx, t, '回来啦～', [A.O.h.top[0] - 20, A.O.h.top[1] - 80], T.greet - 0.05, 1.3, { tail: [40, 80] });
    if (A.O.k) { bub(ctx, t, '阿姨好！', [A.O.k.top[0] + 110, A.O.k.top[1] - 90], T.polite + 0.05, 1.25, { tail: [-50, 80] }); bub(ctx, t, '略略略～', [A.O.k.top[0] + 60, A.O.k.top[1] - 90], T.rude + 0.02, 1.35, { tail: [-40, 80] }); }
  }
  fore(ctx, p, t, 1 - sm(t, T.win0, T.win0 + 0.5) * (R.P2 ? 0 : 1));
  E.bokeh(ctx, t, R.P2 || t < T.win0 ? 0.8 : 0.8 * (1 - sm(t, T.win0, T.win0 + 0.5)));
  E.vignetteWarm(ctx, 0.42);
  if (R.P2) flash(ctx, 1 - sm(t, T.dive1 - 0.1, T.dive1 + 0.55));
}
function draw(ctx, t) {
  ctx.save();
  if (t < T.win1) interior(ctx, t);
  else if (t < T.dive1 - 0.1) {
    const oa = sm(t, T.up - 0.4, T.up + 0.05);
    if (oa < 1) rideBike(ctx, t, drawRide(ctx, t));
    if (oa > 0) { ctx.save(); ctx.globalAlpha = oa; drawOrbit(ctx, t); ctx.restore(); }
    flash(ctx, sm(t, T.arrive + 0.15, T.dive1 - 0.1));
  } else interior(ctx, t);
  ctx.restore();
}
const SFX = [{ t: T.agree, k: 'pop' }, { t: T.bday, k: 'ding' }, { t: T.istp, k: 'ff' }, { t: T.arrive, k: 'knock' }, { t: T.calm, k: 'heart' }, { t: T.proud, k: 'ding' }];
module.exports = { draw, SFX, T };
