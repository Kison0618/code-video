// 故事一 绿松石 014–024：实拍照片 + 手写拼贴，暖纸底
//   时间全部按句 id / TL.at 取；No.1 章节卡（s3_card）014 开口时往左滑走，这里先画好底下的第一个镜头
//   到 TL.CARD2_T0 交给 No.2 章节卡（另一条线）盖住
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const C = require('../card');
const CUT = require('../cutout');
const B = require('../brain');
const X = require('../kit');
const S3 = require('./s3_card');
const { INK, RED, GREEN } = X;

const L = TL.L, at = TL.at;
const T0 = L('014').t0 - 0.05, T1 = TL.CARD2_T0;
const pop = X.pop;

// —— 素材 ——
const CIAL = CUT.get('eng_cialdini'), OWNER = CUT.get('eng_owner'), CLERK = CUT.get('eng_clerk');
const TOUR = CUT.get('eng_tourist'), SUIT = CUT.get('eng_suitcase'), HAND = CUT.get('eng_hand');
const PHONE = CUT.get('ph_phone', { photo: true, th: 236, tint: 0 });

// —— 小零件（只在故事一用）——
// 进场：从下方升起
const rise = (t, a, d = 0.55) => (1 - easeOut(prog(t, a, a + d))) * 260;
const fadeIn = (t, a, d = 0.4) => smooth(prog(t, a, a + d));

// 美国地图（代码画，经纬度 → 等距投影），亚利桑那单独一块
const US = [[-124.7, 48.4], [-124.0, 46.3], [-124.1, 43.0], [-124.2, 40.0], [-122.4, 37.8], [-120.6, 34.6], [-117.1, 32.5], [-114.7, 32.7], [-111.0, 31.3], [-108.2, 31.3], [-106.5, 31.8], [-104.5, 29.6], [-103.0, 29.0], [-101.4, 29.8], [-99.5, 27.5], [-97.4, 25.9], [-97.4, 27.8], [-94.7, 29.4], [-93.0, 29.7], [-90.0, 29.1], [-89.4, 30.2], [-88.0, 30.4], [-85.0, 29.7], [-83.0, 29.0], [-82.6, 27.5], [-81.0, 25.2], [-80.1, 26.0], [-80.6, 28.4], [-81.4, 30.7], [-80.9, 32.1], [-79.0, 33.5], [-76.5, 34.7], [-75.5, 35.6], [-76.0, 37.0], [-75.2, 38.5], [-74.0, 39.8], [-73.9, 40.6], [-72.0, 41.1], [-70.0, 41.6], [-70.6, 42.6], [-70.2, 43.7], [-67.0, 44.8], [-67.8, 47.1], [-69.2, 47.4], [-71.5, 45.0], [-74.9, 45.0], [-76.5, 44.2], [-79.2, 43.4], [-79.0, 42.9], [-82.5, 41.7], [-83.1, 42.3], [-82.4, 43.0], [-82.1, 45.3], [-84.6, 46.5], [-88.4, 48.3], [-89.6, 48.0], [-95.2, 49.0], [-123.0, 49.0]];
const AZ = [[-114.05, 37.0], [-109.05, 37.0], [-109.05, 31.33], [-111.07, 31.33], [-114.81, 32.5], [-114.47, 34.7], [-114.6, 35.1], [-114.05, 36.2]];
const MAP_W = 860, MK = MAP_W / (58 * Math.cos(38 * Math.PI / 180));
const proj = ([lo, la]) => [(lo + 125) * MK * Math.cos(38 * Math.PI / 180), (50 - la) * MK];
const US_PATH = P.poly(P.jag(US.map(proj), 2.2, 12, 81));
const AZ_PATH = P.poly(AZ.map(proj));
const AZ_C = proj([-111.7, 34.3]);
function usMap(ctx, x, y, a, lit, t) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y);
  P.piece(ctx, US_PATH, '#e6d3ac', { blur: 18, dy: 8 });
  ctx.save(); ctx.clip(US_PATH);
  ctx.strokeStyle = 'rgba(120,90,50,0.22)'; ctx.lineWidth = 2;
  for (let k = 1; k < 9; k++) { ctx.beginPath(); ctx.moveTo(k * MAP_W / 9, 0); ctx.lineTo(k * MAP_W / 9 + 20, 500); ctx.stroke(); }
  for (let k = 1; k < 5; k++) { ctx.beginPath(); ctx.moveTo(0, k * 90); ctx.lineTo(MAP_W, k * 90 + 10); ctx.stroke(); }
  ctx.restore();
  ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 3; ctx.stroke(US_PATH);
  // 亚利桑那：亮起
  if (lit > 0.01) {
    const g = 0.6 + 0.4 * Math.sin(t * 5);
    ctx.save(); ctx.shadowColor = `rgba(255,150,40,${0.9 * lit})`; ctx.shadowBlur = 30 + 14 * g;
    ctx.fillStyle = `rgba(232,120,40,${lit})`; ctx.fill(AZ_PATH); ctx.restore();
    ctx.strokeStyle = `rgba(140,50,10,${lit})`; ctx.lineWidth = 4; ctx.stroke(AZ_PATH);
  } else { ctx.strokeStyle = 'rgba(138,106,68,0.6)'; ctx.lineWidth = 2; ctx.stroke(AZ_PATH); }
  ctx.restore();
}

// 电话响：两侧弧线
function rings(ctx, x, y, s, a, t) {
  if (a <= 0.01) return;
  ctx.save(); ctx.strokeStyle = RED; ctx.lineCap = 'round'; ctx.lineWidth = 6 * s;
  for (let k = 0; k < 3; k++) {
    const ph = (t * 3 + k / 3) % 1, r = (40 + ph * 70) * s;
    ctx.globalAlpha = a * (1 - ph);
    for (const d of [-1, 1]) { ctx.beginPath(); ctx.arc(x, y, r, d > 0 ? -0.6 : Math.PI - 0.6, d > 0 ? 0.6 : Math.PI + 0.6); ctx.stroke(); }
  }
  ctx.restore();
}

// 绒布展台：w×h，3×6 件首饰；gone(i) 0..1 第 i 件消失进度
const SLOTS = [];
for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) SLOTS.push([c, r]);
function velvet(ctx, x, y, w, h, gone) {
  ctx.save(); ctx.translate(x, y);
  ctx.shadowColor = 'rgba(30,15,5,0.55)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.fillStyle = '#6b4a2a'; ctx.beginPath(); ctx.roundRect(-w / 2 - 22, -h / 2 - 22, w + 44, h + 44, 18); ctx.fill();
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, '#2c2226'); g.addColorStop(1, '#16110f');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 10); ctx.fill();
  const cw = w / 6, rh = h / 3;
  SLOTS.forEach(([c, r], i) => {
    const sx = -w / 2 + cw * (c + 0.5), sy = -h / 2 + rh * (r + 0.5);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(sx, sy + 6, cw * 0.32, rh * 0.26, 0, 0, Math.PI * 2); ctx.fill();
    const q = gone ? gone(i) : 0;
    if (q < 1) {
      const s = 1 - easeIn(q);
      ctx.save(); ctx.translate(sx, sy); ctx.scale(s, s); X.jewel(ctx, 0, 0, Math.min(cw, rh) * 0.34, 7 + i, 0); ctx.restore();
    }
    if (q > 0 && q < 1) {  // 小火花
      ctx.save(); ctx.strokeStyle = `rgba(255,236,170,${1 - q})`; ctx.lineWidth = 4; ctx.lineCap = 'round';
      for (let k = 0; k < 6; k++) { const an = k * Math.PI / 3, r0 = 20 + q * 50, r1 = r0 + 18; ctx.beginPath(); ctx.moveTo(sx + Math.cos(an) * r0, sy + Math.sin(an) * r0); ctx.lineTo(sx + Math.cos(an) * r1, sy + Math.sin(an) * r1); ctx.stroke(); }
      ctx.restore();
    }
  });
  ctx.restore();
}

// 便签纸：中心 (x,y)
const NOTES = new Map();
function note(ctx, x, y, w, h, rot, seed = 91, inner) {
  const k = `${w}x${h}x${seed}`;
  if (!NOTES.has(k)) NOTES.set(k, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 2.5, 16, seed)));
  const path = NOTES.get(k);
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  P.piece(ctx, path, '#fdf1c2', { blur: 22, dy: 12 });
  ctx.save(); ctx.clip(path);
  ctx.strokeStyle = 'rgba(90,130,190,0.32)'; ctx.lineWidth = Math.max(1.5, w / 500);
  const step = Math.max(26, h / 7);
  for (let yy = -h / 2 + step * 1.2; yy < h / 2; yy += step) { ctx.beginPath(); ctx.moveTo(-w / 2, yy); ctx.lineTo(w / 2, yy); ctx.stroke(); }
  ctx.restore();
  // 胶带
  ctx.save(); ctx.rotate(-0.05); ctx.fillStyle = 'rgba(226,212,160,0.75)'; ctx.fillRect(-w * 0.12, -h / 2 - h * 0.06, w * 0.24, h * 0.12); ctx.restore();
  if (inner) inner(ctx);
  ctx.restore();
}

// 木柜台
function counter(ctx, y) {
  const g = ctx.createLinearGradient(0, y, 0, H); g.addColorStop(0, '#8a5a32'); g.addColorStop(0.08, '#a8713f'); g.addColorStop(1, '#6b4224');
  ctx.save(); ctx.shadowColor = 'rgba(40,20,5,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = -6;
  ctx.fillStyle = g; ctx.fillRect(-20, y, W + 40, H - y + 20); ctx.restore();
  ctx.strokeStyle = 'rgba(60,30,10,0.28)'; ctx.lineWidth = 2;
  for (let k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(0, y + 24 + k * 34); for (let xx = 0; xx <= W; xx += 80) ctx.lineTo(xx, y + 24 + k * 34 + Math.sin(xx * 0.01 + k) * 5); ctx.stroke(); }
}

// 歪歪扭扭的乱线（潦草）
function scribble(ctx, x, y, w, rows, p, seed = 5) {
  const r = K.mulberry32(seed);
  ctx.save(); ctx.strokeStyle = '#1d2a4a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  for (let k = 0; k < rows; k++) {
    const pk = clamp(p * rows - k); if (pk <= 0) break;
    const pts = [], len = w * (0.6 + r() * 0.4);
    for (let u = 0; u <= 40; u++) pts.push([x + len * u / 40, y + k * 50 + Math.sin(u * 1.7 + k) * 12 + (r() - 0.5) * 8]);
    const q = K.partial(pts, pk);
    if (q.length > 1) { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const pt of q.slice(1)) ctx.lineTo(pt[0], pt[1]); ctx.stroke(); }
  }
  ctx.restore();
}

// 硬币堆、小票
function coins(ctx, x, y, n) {
  for (let k = 0; k < n; k++) {
    const cy = y - k * 16;
    ctx.fillStyle = '#9a7020'; ctx.beginPath(); ctx.ellipse(x, cy + 5, 62, 18, 0, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createLinearGradient(x - 60, cy, x + 60, cy); g.addColorStop(0, '#e8c25a'); g.addColorStop(1, '#b88a2a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, cy, 62, 18, 0, 0, Math.PI * 2); ctx.fill();
  }
  ctx.fillStyle = '#7a5410'; ctx.font = '700 30px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('$', x, y - (n - 1) * 16 + 1);
}
function receipt(ctx, x, y, rot, p, seed) {
  if (p <= 0.01) return;
  ctx.save(); ctx.translate(x, y - (1 - easeOut(p)) * 120); ctx.rotate(rot); ctx.globalAlpha *= clamp(p * 2);
  const w = 150, h = 190;
  ctx.shadowColor = 'rgba(50,28,8,0.35)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5;
  ctx.fillStyle = '#fffdf6'; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2);
  for (let k = 0; k <= 10; k++) ctx.lineTo(-w / 2 + w * k / 10, -h / 2 + (k % 2 ? 8 : 0));
  ctx.lineTo(w / 2, h / 2); ctx.lineTo(-w / 2, h / 2); ctx.closePath(); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgba(80,60,40,0.35)'; for (let k = 0; k < 4; k++) ctx.fillRect(-w / 2 + 18, -h / 2 + 30 + k * 22, (k % 2 ? 70 : 100), 8);
  C.tick(ctx, 10, 50, 70, prog(p, 0.4, 1));
  ctx.restore();
}

// 吊牌（可滚动数字）：挂点 (x,y)，s 缩放，v 价格
function rollTag(ctx, x, y, s, v, o = {}) {
  X.priceTag(ctx, x, y, '', { s, t: o.t, seed: o.seed, alpha: o.alpha, rot: o.rot });
  if (o.alpha != null && o.alpha <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  const cy = y + (60 + 68) * s, size = 62 * s;
  ctx.font = `700 ${size}px Num`; const dw = ctx.measureText('0').width * 1.02;
  const digits = String(Math.floor(v)).length, tw = dw * digits + ctx.measureText('$').width;
  ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('$', x - tw / 2, cy);
  X.roll(ctx, v, x + tw / 2, cy, size, { digits, color: INK });
  ctx.restore();
}

// —— 关键时刻（全部按句 id）——
const T = {
  // 014
  cial: at('014', '西奥迪尼'), call: at('014', '接到'), az0: at('014', '她在'), az: at('014', '亚利桑那'), shop: at('014', '印第安'),
  // 015
  s15: L('015').t0, psy: at('015', '心理学家'), help: at('015', '你帮我'), odd: at('015', '我碰到'),
  // 016
  s16: L('016').t0, tq: at('016', '绿松石'), unsold: at('016', '卖不掉'), crowd: at('016', '客人'), good: at('016', '货也'), fair: at('016', '价格也'),
  // 017
  s17: L('017').t0, center: at('017', '中央'), clerk: at('017', '店员'), push: at('017', '使劲'), noUse: at('017', '都没用'),
  // 018
  s18: L('018').t0, trip: at('018', '出差'), note: at('018', '字条'), messy: at('018', '潦草'),
};

// ================= 镜头 =================
// A 014：西奥迪尼接电话 → 美国地图亚利桑那亮起 → 珠宝店照片
function shotA(ctx, t) {
  const cx = 420, by = 975, h = 700;
  const ring = fadeIn(t, T.call - 0.1, 0.2) * (1 - fadeIn(t, T.az0, 0.4));
  const shake = ring * Math.sin(t * 60) * 0.02;
  CUT.place(ctx, PHONE, 930, by - 10, 230, { rot: shake });
  rings(ctx, 930, by - 150, 1.1, ring, t);
  CUT.place(ctx, CIAL, cx, by, h, {});
  X.nameTag(ctx, 300, 880, '西奥迪尼', pop(t, T.cial));
  // 地图
  const ma = fadeIn(t, T.az0 - 0.3, 0.5);
  const mx = 990, my = 230 + (1 - easeOut(prog(t, T.az0 - 0.3, T.az0 + 0.2))) * 40;
  usMap(ctx, mx, my, ma, fadeIn(t, T.az - 0.05, 0.3), t);
  const ax = mx + AZ_C[0], ay = my + AZ_C[1];
  X.label(ctx, ax - 10, ay - 150, '亚利桑那', { pop: pop(t, T.az), size: 60, rot: -0.04, seed: 12 });
  // 珠宝店照片从亚利桑那弹出
  const q = easeOut(prog(t, T.shop, T.shop + 0.5));
  if (q > 0.01) {
    const px = lerp(ax, 1470, q), py = lerp(ay, 740, q), s = lerp(0.15, 1, q);
    ctx.save(); ctx.strokeStyle = 'rgba(140,50,10,0.7)'; ctx.lineWidth = 4; ctx.setLineDash([12, 10]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(px, py); ctx.stroke(); ctx.restore();
    X.photoCard(ctx, 'ph_store', px, py, 560, 360, { scale: s, rot: 0.03, seed: 15, alpha: clamp(q * 2) });
    X.label(ctx, 1470, 545, '珠宝店', { pop: pop(t, T.shop + 0.35), size: 56, seed: 13, rot: 0.03 });
  }
}

// B 015：电话两头，店主说话
function shotB(ctx, t) {
  const by = 975;
  const cP = [330, by, 600], oP = [1480, by + 10, 820];
  CUT.place(ctx, CIAL, cP[0], cP[1], cP[2], {});
  CUT.place(ctx, OWNER, oP[0], oP[1] + rise(t, T.s15 - 0.2), oP[2], {});
  const cr = CUT.pt(CIAL, cP[0], cP[1], cP[2], 0.7, 0.47), or = CUT.pt(OWNER, oP[0], oP[1], oP[2], 0.2, 0.42);
  // 电话线 + 信号点（从店主这头传过来）
  ctx.save(); ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = 4; ctx.setLineDash([2, 12]); ctx.lineCap = 'round';
  const mid = [(cr[0] + or[0]) / 2, Math.max(cr[1], or[1]) + 160];
  const pts = X.bez(cr, mid, or, 40);
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.restore();
  for (let k = 0; k < 3; k++) {
    const u = 1 - ((t * 0.9 + k / 3) % 1), p = pts[Math.round(u * 40)];
    K.glow(ctx, p[0], p[1], 26, [255, 170, 60], 0.9);
  }
  X.label(ctx, 330, 300, '心理学家', { pop: pop(t, T.psy), size: 56, rot: -0.03, seed: 17 });
  const mouth = CUT.pt(OWNER, oP[0], oP[1], oP[2], 0.36, 0.38);
  const a1 = 1 - fadeIn(t, T.odd - 0.1, 0.25);
  C.bubble(ctx, { x: 900, y: 290, text: '你帮我解释解释', pop: pop(t, T.help, 0.35), alpha: a1, size: 60, tail: mouth });
  C.bubble(ctx, { x: 930, y: 330, text: '我碰到一件怪事！', pop: pop(t, T.odd, 0.35), size: 64, shout: true, tail: mouth });
}

// C 016：展柜照片 → 卖不掉 → 客人多 → 货不差 ✓ 价格公道 ✓
function shotC(ctx, t) {
  const dim = 0.3 * fadeIn(t, T.unsold, 0.4) * (1 - fadeIn(t, T.good - 0.2, 0.5));
  X.photoCard(ctx, 'ph_case', 960, 520, 1700, 880, { seed: 21, zoom: 1 + 0.04 * prog(t, T.s16, L('016').t1), dim });
  X.label(ctx, 1500, 190, '绿松石首饰', { pop: pop(t, T.tq), size: 60, seed: 22, rot: 0.02 });
  // 卖不掉：灰牌晃
  const ps = pop(t, T.unsold, 0.4);
  if (ps > 0.01) {
    const sw = Math.sin((t - T.unsold) * 3) * 0.06 * Math.exp(-(t - T.unsold) * 0.8);
    ctx.save(); ctx.translate(820, 230); ctx.rotate(sw);
    ctx.strokeStyle = '#5a5048'; ctx.lineWidth = 3; ctx.globalAlpha = clamp(ps * 2);
    ctx.beginPath(); ctx.moveTo(-90, 60); ctx.lineTo(0, -10); ctx.lineTo(90, 60); ctx.stroke();
    X.label(ctx, 0, 120, '卖不掉', { pop: ps, size: 76, bg: '#8b8580', color: '#fbf6ea', rot: 0, seed: 23 });
    ctx.restore();
  }
  // 客人多：剪影来回走
  const crowd = [[-1, 0, 600], [1, 0.2, 560], [-1, 0.45, 580], [1, 0.6, 620]];
  crowd.forEach(([d, dl, hh], i) => {
    const u = prog(t, T.crowd + dl - 0.3, T.crowd + dl + 1.5);
    if (u <= 0 || u >= 1) return;
    const x = d > 0 ? lerp(-150, W + 150, u) : lerp(W + 150, -150, u);
    X.person(ctx, x, 975, hh, 'rgba(34,25,20,0.78)', (t - T.crowd) * 9 + i, {});
  });
  // 价签 + 两个勾
  const pa = fadeIn(t, T.good - 0.25, 0.3);
  X.priceTag(ctx, 1320, 470, '$100', { s: 1.25, t, alpha: pa, seed: 2 });
  const g1 = pop(t, T.good), g2 = pop(t, T.fair);
  if (g1 > 0.01) { X.label(ctx, 1720, 560, '货不差', { pop: g1, size: 58, seed: 24 }); C.tick(ctx, 1545, 555, 70, prog(t, T.good + 0.1, T.good + 0.5)); }
  if (g2 > 0.01) { X.label(ctx, 1730, 720, '价格公道', { pop: g2, size: 58, seed: 25 }); C.tick(ctx, 1520, 715, 70, prog(t, T.fair + 0.1, T.fair + 0.5)); }
}

// D 017：托盘挪到中央展台 → 店员推销 → 都没用
const TABLE = [960, 735];
function shotD(ctx, t) {
  const dim = 0.42 * fadeIn(t, T.noUse - 0.1, 0.5);
  X.photoCard(ctx, 'ph_store', 960, 520, 1700, 880, { seed: 31, dim });
  // 聚光
  const sp = fadeIn(t, T.center, 0.4) * (1 - 0.6 * fadeIn(t, T.noUse, 0.5));
  if (sp > 0.01) {
    ctx.save(); ctx.globalAlpha = sp * 0.55; ctx.globalCompositeOperation = 'screen';
    const g = ctx.createRadialGradient(TABLE[0], TABLE[1] - 40, 20, TABLE[0], TABLE[1] - 40, 340);
    g.addColorStop(0, 'rgba(255,236,180,0.9)'); g.addColorStop(1, 'rgba(255,236,180,0)');
    ctx.fillStyle = g; ctx.fillRect(TABLE[0] - 400, TABLE[1] - 440, 800, 800); ctx.restore();
  }
  // 托盘被手推过去
  const m = easeInOut(prog(t, T.s17 + 0.1, T.center + 0.3));
  const tx = lerp(1640, TABLE[0], m), ty = lerp(880, TABLE[1] - 30, m);
  velvet(ctx, tx, ty, 330, 150);
  const ha = 1 - fadeIn(t, T.center + 0.35, 0.4);
  if (ha > 0.01) CUT.place(ctx, HAND, tx + 200, ty + 20, 210, { anchor: [0, 0.35], alpha: ha });
  X.label(ctx, TABLE[0], 470, '中央展台', { pop: pop(t, T.center + 0.1), size: 60, seed: 32, alpha: 1 - 0.6 * fadeIn(t, T.clerk, 0.3) });
  // 店员
  const ca = fadeIn(t, T.clerk - 0.15, 0.35);
  if (ca > 0.01) {
    const shake = Math.sin(t * 14) * 0.012 * (1 - fadeIn(t, T.noUse, 0.3));
    CUT.place(ctx, CLERK, 330 - (1 - ca) * 200, 970, 640, { alpha: ca, rot: shake });
    const hand = CUT.pt(CLERK, 330, 970, 640, 0.97, 0.46);
    C.bubble(ctx, { x: 600, y: 300, text: '使劲推销！', pop: pop(t, T.clerk + 0.15), alpha: 1 - fadeIn(t, T.noUse + 0.2, 0.3), size: 60, shout: true, tail: CUT.pt(CLERK, 330, 970, 640, 0.42, 0.3) });
    // 手势线
    const ga = pop(t, T.clerk + 0.15) * (1 - fadeIn(t, T.noUse, 0.3));
    if (ga > 0.01) { ctx.save(); ctx.strokeStyle = `rgba(200,50,30,${ga})`; ctx.lineWidth = 6; ctx.lineCap = 'round'; for (let k = -1; k <= 1; k++) { const ph = (t * 2.5) % 1; ctx.beginPath(); ctx.moveTo(hand[0] + 40 + ph * 20, hand[1] + k * 34); ctx.lineTo(hand[0] + 90 + ph * 20, hand[1] + k * 44); ctx.stroke(); } ctx.restore(); }
  }
  // 都没用：灰问号飘过
  const nq = prog(t, T.noUse, T.noUse + 2.2);
  if (nq > 0 && nq < 1) X.mark(ctx, lerp(1250, 1500, nq), 640 - Math.sin(nq * Math.PI) * 140, 170, '?', Math.sin(nq * Math.PI), '#8b8580');
  X.label(ctx, 1450, 300, '都没用', { pop: pop(t, T.noUse + 0.15), size: 66, bg: '#8b8580', color: '#fbf6ea', seed: 33 });
}

// E 018：行李箱 + 字条飞到柜台上 → 潦草
const NOTE_S = [1320, 800];
function shotE(ctx, t) {
  counter(ctx, 790);
  const sa = easeOut(prog(t, T.trip - 0.2, T.trip + 0.4));
  CUT.place(ctx, SUIT, lerp(-300, 520, sa), 860, 440, { rot: (1 - sa) * -0.1 });
  X.label(ctx, 520, 300, '出差采购', { pop: pop(t, T.trip + 0.2), size: 64, seed: 41 });
  const f = easeOut(prog(t, T.note - 0.1, T.note + 0.6));
  if (f > 0.01) {
    const x = lerp(1900, NOTE_S[0], f), y = lerp(-150, NOTE_S[1], f) - Math.sin(f * Math.PI) * 120, rot = lerp(1.6, -0.06, f);
    note(ctx, x, y, 460, 300, rot, 92, c => {
      scribble(c, -190, -80, 380, 4, prog(t, T.messy - 0.1, T.messy + 1.0), 7);
    });
    X.label(ctx, 1320, 470, '字条', { pop: pop(t, T.note + 0.4), size: 60, seed: 42, alpha: 1 - fadeIn(t, T.messy - 0.1, 0.3) });
    X.label(ctx, 1320, 470, '特别潦草', { pop: pop(t, T.messy), size: 64, seed: 43, rot: 0.04 });
  }
}

Object.assign(T, {
  // 019–020
  s19: L('019').t0, price: at('019', '价格'), times: at('019', '乘以'), half: at('019', '二分之一'), e19: L('019').t1,
  s20: L('020').t0, loss: at('020', '亏本'), e20: L('020').t1,
  // 021
  s21: L('021').t0, back: at('021', '回来'), sold: at('021', '卖光'), clerk21: at('021', '店员'), half21: at('021', '二分之一'), saw: at('021', '看成'), e21: L('021').t1,
  // 022 / 022b
  s22: L('022').t0, dbl: at('022', '两倍'), sell: at('022', '卖出去'), s22b: L('022b').t0, smile: at('022b', '笑了'),
  // 023
  s23: L('023').t0, tour: at('023', '游客'), rule: at('023', '一分钱'), again: at('023', '一次次'), simp: at('023', '简化'), eq: at('023', '贵'),
  // 024
  s24: L('024').t0, cant: at('024', '看不懂'), look: at('024', '那就'), dear: at('024', '标得'), feel: at('024', '越觉得'), goodThing: at('024', '好东西'), e24: L('024').t1,
});

// F 019–020：字条特写，手写「这个柜里所有东西 / 价格 × ½」→ 价签被红笔划掉「亏本也清掉」
const NOTE_F = [960, 470, 1360, 740, -0.015];
function shotF(ctx, t) {
  note(ctx, NOTE_F[0], NOTE_F[1], NOTE_F[2], NOTE_F[3], NOTE_F[4], 93, c => {
    const o = { sloppy: 1.7, seed: 31 };
    X.write(c, '这个柜里所有东西', -580, -170, 124, 8 * prog(t, T.s19, T.price - 0.05), o);
    const nx = X.write(c, '价格', -580, 70, 124, 2 * prog(t, T.price, T.times - 0.1), { ...o, seed: 37 });
    const xx = X.write(c, '×', nx + 30, 70, 124, 1.2 * prog(t, T.times, T.times + 0.4), { ...o, seed: 41 });
    X.halfToTwo(c, xx + 40, -120, 230, 0, prog(t, T.half, T.e19 + 0.1), { w: 0.07 });
    // 020：价签挂在字条右边，红笔划掉
    const ta = fadeIn(t, T.s20 - 0.2, 0.3);
    X.priceTag(c, 470, -60, '$100', { s: 1.2, t, alpha: ta, strike: prog(t, T.loss - 0.1, T.loss + 0.3), seed: 4 });
    X.write(c, '亏本也清掉', -120, 300, 92, 5 * prog(t, T.loss, T.e20 + 0.2), { sloppy: 1.2, seed: 51, color: RED, weight: 700 });
  });
}

// G 021 前半：展台首饰一件件消失 → SOLD OUT
const ORDER = (() => { const r = K.mulberry32(77), a = SLOTS.map((_, i) => [r(), i]); a.sort((p, q) => p[0] - q[0]); const o = []; a.forEach(([, i], k) => { o[i] = k; }); return o; })();
function shotG(ctx, t) {
  X.photoCard(ctx, 'ph_store', 960, 520, 1700, 880, { seed: 31, dim: 0.45 });
  const a = T.back, b = T.sold - 0.1, dt = (b - a) / SLOTS.length;
  velvet(ctx, 960, 540, 1140, 540, i => prog(t, a + ORDER[i] * dt, a + ORDER[i] * dt + 0.3));
  // 你猜怎么着？
  const qa = fadeIn(t, T.s21, 0.3) * (1 - fadeIn(t, T.back, 0.3));
  X.mark(ctx, 1640, 300 + Math.sin(t * 4) * 10, 220, '?', qa, '#fbf6ea');
  X.stamp(ctx, 960, 540, 'SOLD OUT', prog(t, T.sold - 0.05, T.sold + 0.3), { size: 160, rot: -0.1, seed: 13, font: 'Num' });
}

// H 021 后半：店员把潦草的 ½ 看成了 2（笔画变形，中间态停一下）
function morphM(t) {
  const a = T.saw - 0.25;                      // 021 在“看成了”后不到 0.9 秒就结束：变形压到 0.9 秒内，中间态仍停 0.25 秒
  if (t < a + 0.3) return 0.5 * easeInOut(prog(t, a, a + 0.3));
  if (t < a + 0.55) return 0.5;
  return 0.5 + 0.5 * easeInOut(prog(t, a + 0.55, a + 0.9));
}
function shotH(ctx, t) {
  note(ctx, 1060, 480, 1120, 780, 0.012, 94);
  const m = morphM(t), done = prog(t, T.saw + 0.65, T.saw + 0.85);
  const s = 500, gx = 1060 - s * 0.39 - 90, gy = 230;
  X.halfToTwo(ctx, gx, gy, s, m, 1, { w: 0.07, color: done > 0 ? '#7a1f14' : '#1d2a4a', glow: done > 0 ? 'rgba(220,60,30,0.6)' : null });
  // 店员（左下）凑过来看
  CUT.place(ctx, CLERK, 230 - (1 - fadeIn(t, T.clerk21 - 0.2, 0.4)) * 200, 975, 560, {});
  X.label(ctx, 1450, 230, '二分之一', { pop: pop(t, T.half21), size: 62, seed: 61 });
  X.arrow(ctx, [1450, 300], [1450, 640], prog(t, T.saw, T.saw + 0.4), RED, 9, 0.12);
  X.label(ctx, 1450, 720, '二', { pop: pop(t, T.saw + 0.35), size: 96, seed: 62, color: RED });
  C.circle(ctx, gx + s * 0.39, gy + s * 0.5, s * 0.5, s * 0.62, prog(t, T.saw + 0.6, T.saw + 0.95), RED, 8);
}

// I 022：价签翻牌 $100 → $200，「× 2」
function shotI(ctx, t) {
  X.photoCard(ctx, 'ph_case', 960, 520, 1700, 880, { seed: 21, dim: 0.2 });
  [[520, 150], [960, 120], [1400, 150]].forEach(([x, y], i) => {
    const f = prog(t, T.s22 + 0.1 + i * 0.4, T.s22 + 0.5 + i * 0.4);
    X.priceTag(ctx, x, y, '$100', { s: 1.55, flip: f, text2: '$200', t, seed: i + 5, color: f > 0.5 ? RED : INK });
  });
  X.label(ctx, 1580, 640, '× 2', { pop: pop(t, T.dbl), size: 130, font: 'Num', weight: 900, color: RED, rot: -0.06, seed: 14 });
}

// J 022b：西奥迪尼听完，笑了
const CJ = [860, 1000, 960];
function shotJ(ctx, t) {
  const sm = easeOut(prog(t, T.smile - 0.05, T.smile + 0.35));
  const bob = t > T.smile ? Math.abs(Math.sin((t - T.smile) * 9)) * 10 * Math.exp(-(t - T.smile) * 2.2) : 0;   // 笑的时候轻轻颠两下
  CUT.place(ctx, CIAL, CJ[0], CJ[1] - bob, CJ[2], { rot: -0.03 * sm });
  X.nameTag(ctx, 470, 880, '西奥迪尼', 1);
  if (sm > 0.01) {
    const o = { rot: -0.03 * sm }, p = (u, v) => CUT.pt(CIAL, CJ[0], CJ[1] - bob, CJ[2], u, v, o);
    // 开心的小线
    const h = p(0.78, 0.12);
    ctx.save(); ctx.strokeStyle = `rgba(200,120,20,${sm})`; ctx.lineWidth = 8; ctx.lineCap = 'round';
    for (let k = 0; k < 3; k++) { const an = -1.1 + k * 0.45, r0 = 40, r1 = 40 + 50 * sm; ctx.beginPath(); ctx.moveTo(h[0] + Math.cos(an) * r0, h[1] + Math.sin(an) * r0); ctx.lineTo(h[0] + Math.cos(an) * r1, h[1] + Math.sin(an) * r1); ctx.stroke(); }
    ctx.restore();
    X.label(ctx, 1480, 360, '笑了', { pop: pop(t, T.smile), size: 72, seed: 63, rot: 0.04 });
  }
}

// K 023：游客 → 天平（一分钱一分货）→ 打勾小票叠起来 → 天平收缩成代码卡「贵 = 好」
const BAL = [1180, 900, 0.9];
function shotK(ctx, t) {
  CUT.place(ctx, TOUR, 330, 975 + rise(t, T.s23 - 0.2), 700, {});
  X.label(ctx, 330, 230, '游客', { pop: pop(t, T.tour), size: 64, seed: 71 });
  const ba = pop(t, T.rule - 0.1, 0.45), shrink = easeInOut(prog(t, T.simp, T.eq - 0.05));
  if (ba > 0.01 && shrink < 1) {
    const cx = BAL[0], cy = 620;
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1 - shrink, 1 - shrink); ctx.rotate(shrink * 0.6); ctx.translate(-cx, -cy);
    ctx.globalAlpha = clamp(ba * 1.5) * (1 - shrink * 0.6);
    const tilt = Math.sin((t - T.rule) * 2.4) * 0.05 * Math.exp(-(t - T.rule) * 0.7);
    X.balance(ctx, BAL[0], BAL[1], BAL[2] * (0.7 + 0.3 * ba), tilt, (c, x, y) => coins(c, x, y - 18, 5), (c, x, y) => X.jewel(c, x, y - 70, 70, 3, 0));
    ctx.restore();
  }
  X.label(ctx, 1180, 190, '一分钱一分货', { pop: pop(t, T.rule + 0.1), size: 64, seed: 72, alpha: 1 - fadeIn(t, T.simp, 0.4) });
  // 一次次被验证：小票叠起来
  const ra = 1 - fadeIn(t, T.simp, 0.4);
  if (ra > 0.01) { ctx.save(); ctx.globalAlpha = ra; for (let k = 0; k < 5; k++) receipt(ctx, 1770 + (k % 2) * 30 - 15, 800 - k * 46, (k % 2 ? 0.08 : -0.06), prog(t, T.again + k * 0.38, T.again + k * 0.38 + 0.4), k); ctx.restore(); }
  // 贵 = 好
  const ca = pop(t, T.eq - 0.15, 0.4);
  if (ca > 0.01) B.ruleCard(ctx, BAL[0], 600, '贵 = 好', 120, { alpha: clamp(ca * 1.5), scale: 0.5 + 0.5 * ca, rot: -0.02, seed: 23 });
}

// L 024：游客拿放大镜看首饰 → 一团问号（看不懂）→ 镜头移到价签 → 价格往上涨 → 星星一颗颗亮
const TL_ = [470, 985, 760];
function shotL(ctx, t) {
  const pan = -260 * easeInOut(prog(t, T.look, T.look + 0.9));
  ctx.save(); ctx.translate(pan, 0);
  CUT.place(ctx, TOUR, TL_[0], TL_[1], TL_[2], {});
  const mg = CUT.pt(TOUR, TL_[0], TL_[1], TL_[2], 0.86, 0.2);
  // 首饰照片
  X.photoCard(ctx, 'ph_case', 1500, 560, 640, 470, { seed: 25, rot: 0.03, zoom: 1.6, focus: [0.5, 0.45] });
  X.label(ctx, 1500, 260, '绿松石', { pop: pop(t, T.s24 + 0.4), size: 60, seed: 81 });
  // 放大镜里：糊成一团 + 问号
  const la = pop(t, T.s24 + 0.9, 0.45);
  if (la > 0.01) {
    const lx = 1020, ly = 420, lr = 190 * (0.6 + 0.4 * la);
    ctx.save(); ctx.globalAlpha = clamp(la * 1.5);
    ctx.strokeStyle = 'rgba(90,60,30,0.6)'; ctx.lineWidth = 3; ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(mg[0] + 20, mg[1] - 30); ctx.lineTo(lx - lr * 0.8, ly - lr * 0.6); ctx.moveTo(mg[0] + 20, mg[1] + 30); ctx.lineTo(lx - lr * 0.8, ly + lr * 0.6); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.save(); ctx.clip();
    ctx.filter = 'blur(10px)'; X.photoCard(ctx, 'ph_case', lx, ly, lr * 2.4, lr * 2.4, { zoom: 3, focus: [0.45, 0.5], border: 0, sepia: false }); ctx.filter = 'none';
    ctx.fillStyle = 'rgba(250,244,230,0.35)'; ctx.fillRect(lx - lr, ly - lr, lr * 2, lr * 2);
    const qp = fadeIn(t, T.cant - 0.5, 0.5);
    for (let k = 0; k < 5; k++) { const an = t * 0.8 + k * 1.26, rr = lr * 0.45; X.mark(ctx, lx + Math.cos(an) * rr, ly + Math.sin(an) * rr * 0.8, 90 + (k % 2) * 30, '?', qp, '#5a3a20'); }
    ctx.restore();
    ctx.lineWidth = 16; ctx.strokeStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  X.label(ctx, 1020, 700, '看不懂', { pop: pop(t, T.cant + 0.1), size: 64, seed: 82, alpha: 1 - fadeIn(t, T.look, 0.4) });
  // 价签（镜头移过去）：标得越贵 → 数字往上涨
  // 越贵：价签一档档翻牌 100→200→300→500→900（滚动的半截数字太乱，改成翻牌）
  const STEPS = [100, 200, 300, 500, 900], st = (T.feel + 0.9 - T.dear) / 4;
  let k = 0; while (k < 4 && t >= T.dear + k * st) k++;
  const fl = k > 0 ? prog(t, T.dear + (k - 1) * st, T.dear + (k - 1) * st + 0.3) : 0;
  X.priceTag(ctx, 1900, 300, '$' + STEPS[Math.max(0, k - 1)], { s: 2.0, flip: fl, text2: '$' + STEPS[k], t, seed: 6, alpha: fadeIn(t, T.look, 0.4), color: k > 0 ? RED : INK });
  X.label(ctx, 1900, 230, '看价格', { pop: pop(t, T.look + 0.5), size: 64, seed: 83, alpha: 1 - fadeIn(t, T.dear, 0.3) });
  if (t > T.dear) { const up = prog(t, T.dear, T.feel + 0.8); X.arrow(ctx, [2125, 740], [2125, 360], up, RED, 12, 0); X.label(ctx, 1900, 230, '越贵', { pop: pop(t, T.dear + 0.1), size: 64, seed: 84, color: RED }); }
  // 星星：头顶一颗颗亮
  const hx = CUT.pt(TOUR, TL_[0], TL_[1], TL_[2], 0.55, 0)[0];
  const sa = fadeIn(t, T.feel - 0.3, 0.3);
  if (sa > 0.01) {
    ctx.save(); ctx.globalAlpha = sa;
    for (let k = 0; k < 5; k++) X.star(ctx, hx - 110 + k * 85, 175, 36, prog(t, T.feel + k * 0.38, T.feel + k * 0.38 + 0.3));
    ctx.restore();
  }
  X.label(ctx, hx + 400, 175, '好东西', { pop: pop(t, T.goodThing), size: 62, seed: 85, rot: 0.03 });
  ctx.restore();
}

const SHOTS = [
  { a: T0, draw: shotA },
  { a: L('015').t0 - 0.3, draw: shotB },
  { a: L('016').t0 - 0.3, draw: shotC },
  { a: L('017').t0 - 0.3, draw: shotD },
  { a: L('018').t0 - 0.3, draw: shotE, tr: 'up' },
  { a: L('019').t0 - 0.4, draw: shotF, tr: 'up' },
  { a: L('021').t0 - 0.25, draw: shotG },
  { a: T.clerk21 - 0.1, draw: shotH },
  { a: L('022').t0 - 0.3, draw: shotI },
  { a: L('022b').t0 - 0.3, draw: shotJ },
  { a: L('023').t0 - 0.3, draw: shotK },
  { a: L('024').t0 - 0.3, draw: shotL },
];

module.exports = {
  t0: T0, t1: T1 + 0.6, SHOTS, T,
  draw(ctx, t) {
    if (t < T0 || t > T1 + 0.6) return;
    X.shots(ctx, t, SHOTS);
    if (t < S3.t1) S3.draw(ctx, t);       // No.1 章节卡往左滑走时盖在故事一上面
  },
};
