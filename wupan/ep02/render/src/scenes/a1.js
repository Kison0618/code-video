// 故事一（上）001–005：少年 + 制服落下 → 拉远成胶片一格 → 档案卡 → 机组走出酒店 → 头顶拼贴
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeInOut } = K;
const TL = require('../timeline');
const X = require('../kit');
const Q = require('../kit02');
const CUT = require('../cutout');
const L = TL.L, at = TL.at;
const pop = X.pop;

// 001：有电影片段（film_airport）就贴一张大旧照片放片段；没有就是 G01 少年，G02 的外套和帽子分两下落到他身上
// G02 剪图里帽子占上 17%，外套从 17% 往下；按这条线把一张图裁成两块，分别对准少年的脖子和头顶
const BOY_H = 700, BOY_X = 900, BOY_Y = 930, CAP_V = 0.17;
const F = require('../filmclip');
const FILM01 = F.use('film_airport', 0, L('002').t0 - 0.1);
// G02 拆成帽子/外套两张剪图：接缝处 alpha 渐隐，不用 clip（clip 会切出一道直边亮带）
const G02P = {};
function g02Cut(top) {
  const k = top ? 'cap' : 'coat';
  if (G02P[k] !== undefined) return G02P[k];
  const c = Q.cut('G02'); if (!c) return (G02P[k] = null);
  const [, y0, , y1] = c.box, Y = v => y0 + (y1 - y0) * v;
  const cv = new K.Canvas(c.w, c.h), z = cv.getContext('2d');
  z.drawImage(c.img, 0, 0);
  z.globalCompositeOperation = 'destination-in';
  const a = top ? Y(0.150) : Y(0.168), b = top ? Y(0.163) : Y(0.185);
  const g = z.createLinearGradient(0, a, 0, b);
  g.addColorStop(0, top ? 'rgba(0,0,0,1)' : 'rgba(0,0,0,0)');
  g.addColorStop(1, top ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,1)');
  z.fillStyle = g; z.fillRect(0, 0, c.w, c.h);
  return (G02P[k] = { ...c, img: require('../paper').bitmap(cv) });
}
function g02Part(ctx, x, y, h, top, o = {}) {
  const c = g02Cut(top); if (!c) return Q.put(ctx, 'G02', x, y, h, o);
  CUT.place(ctx, c, x, y, h, { ...o, anchor: [0.5, CAP_V] });
}
function s01(ctx, t) {
  if (FILM01) {
    const k = 1 + 0.04 * smooth(prog(t, 0, L('002').t0));
    F.draw(ctx, 'film_airport', t, W / 2 - 60, 450, 1380, { s: k, rot: -0.012, seed: 11 });
  } else {
    Q.put(ctx, 'G01', BOY_X, BOY_Y, BOY_H, { ar: 0.32 });
    const GH = BOY_H * 0.47;                                                         // 外套宽 ≈ 少年肩宽 + 两袖
    const [nx, ny] = Q.ptOf('G01', BOY_X, BOY_Y, BOY_H, 0.52, 0.175, { ar: 0.32 });   // 脖子
    const [hx, hy] = Q.ptOf('G01', BOY_X, BOY_Y, BOY_H, 0.5, 0.035, { ar: 0.32 });    // 发际线（帽檐不压眼睛）
    const d = easeInOut(prog(t, 0.6, at('001', '骗过') - 0.6));
    const c = easeInOut(prog(t, at('001', '骗过') - 0.9, at('001', '骗过') + 0.1));
    g02Part(ctx, nx, lerp(-GH, ny, d), GH, false, { rot: (1 - d) * 0.06 });
    g02Part(ctx, hx, lerp(-GH, hy, c), GH, true, { rot: (1 - c) * -0.1 });
  }
  const p = pop(t, at('001', '十六岁'));
  Q.tag(ctx, 1380, 520, '十六岁', p, { size: 72, rot: -0.03 });
  Q.ring(ctx, 1380, 522, 170, 78, prog(t, at('001', '十六岁') + 0.1, at('001', '十六岁') + 0.7));
}
// 002：拉远——刚才那一格是胶片里的一格；红褐大问号压在“连你也骗了”上
function s02(ctx, t) {
  const a = L('002').t0 - 0.1, z = easeInOut(prog(t, a, a + 1.6));
  const fw = lerp(W * 1.0, W * 0.44, z), y = lerp(H / 2, 470, z);
  if (z < 0.002) { s01(ctx, t); return; }
  Q.film(ctx, W / 2, y, fw, c => s01(c, t));
  const p = pop(t, at('002', '连你'), 0.5);
  Q.tag(ctx, 1240, 860, '连你也骗了', p, { size: 66, rot: 0.02 });
  if (p > 0.01) X.mark(ctx, 1480, 920, 300 * clamp(p * 1.2), '?', clamp(p * 1.4), Q.RUST);
}
// 003：牛皮纸档案卡 + 回形针别住版画肖像，打字机打出名字；场记板斜插“猫鼠游戏 · 2002”
function s03(ctx, t) {
  const a = L('003').t0;
  ctx.save(); ctx.translate(820, 520); ctx.rotate(-0.025);
  const P = require('../paper');
  P.piece(ctx, P.poly(P.jag([[-560, -330], [560, -330], [560, 330], [-560, 330]], 2, 18, 13)), Q.KRAFT, { blur: 24, dy: 12 });
  ctx.fillStyle = '#cfb27c'; ctx.fillRect(-560, -330, 1120, 70);
  ctx.strokeStyle = 'rgba(90,60,30,0.35)'; ctx.lineWidth = 3; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-40, -140 + k * 70); ctx.lineTo(500, -140 + k * 70); ctx.stroke(); }
  // 肖像：白纸照片 + 回形针
  ctx.save(); ctx.translate(-300, 30); ctx.rotate(0.03);
  P.piece(ctx, P.poly([[-200, -250], [200, -250], [200, 250], [-200, 250]]), '#f4ecdc', { blur: 14, dy: 6 });
  ctx.save(); ctx.beginPath(); ctx.rect(-180, -230, 360, 460); ctx.clip(); Q.put(ctx, 'G03', 0, 236, 470, { shadow: false, ar: 0.83, label: '阿巴格内尔' }); ctx.restore();
  ctx.restore();
  Q.clip(ctx, -330, -310, 1.1, -0.1);
  Q.typed(ctx, 'FRANK W. ABAGNALE', -40, -170, 56, Q.typeN(t, at('003', '阿巴格内尔') - 0.2, 14));
  ctx.restore();
  // 场记板
  const q = easeOut(prog(t, at('003', '斯皮尔伯格') - 0.1, at('003', '斯皮尔伯格') + 0.6));
  if (q > 0.01) Q.clapper(ctx, lerp(2200, 1470, q), 690, 520, prog(t, at('003', '猫鼠'), at('003', '猫鼠') + 0.35), ['猫鼠游戏', '2002'], { rot: 0.1 });
}
// 004：版画街景——机组走出酒店；前景少年背影（剪影）仰头看；左上角纸签“按他自己的说法”（整个故事一常驻）
function s04(ctx, t) {
  const a = L('004').t0, k = 1 + 0.05 * smooth(prog(t, a, a + 5));
  ctx.save(); ctx.translate(W / 2, 470); ctx.scale(k, k); ctx.translate(-W / 2, -470);
  Q.sheet(ctx, 'G04', W / 2 + 60, 470, 1320, 860, { seed: 41, label: '机组走出酒店' });
  ctx.restore();
  const e = easeOut(prog(t, at('004', '他看见') - 0.2, at('004', '他看见') + 0.8));
  Q.put(ctx, 'G01', lerp(-100, 330, e), 1080 + 40, 600, { sil: true, ar: 0.32, shadow: 0.6 });
}
// 头顶拼贴（005）：少年在左下，想法里依次出现制服、银行柜台、支票；“谁还会怀疑我”标黄
function s05(ctx, t) {
  Q.put(ctx, 'G01', 330, 980, 600, { ar: 0.32 });
  // 想法云：三个小圆点 + 一张撕边大纸
  const P = require('../paper');
  const a = L('005').t0, e = easeOut(prog(t, a, a + 0.5));
  ctx.save(); ctx.globalAlpha = e;
  [[470, 470, 16], [530, 410, 24], [610, 350, 32]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = '#fbf6ea'; ctx.shadowColor = 'rgba(60,35,10,0.35)'; ctx.shadowBlur = 10; ctx.fill(); });
  ctx.shadowColor = 'transparent';
  P.piece(ctx, P.poly(P.jag(P.ellipsePts(1180, 380, 600, 290, 70), 4, 16, 52)), '#fbf6ea', { blur: 18, dy: 8 });
  ctx.restore();
  // 气泡里的拼贴：左制服、中银行柜台、右上支票（popScale 已经平移到中心点，里面按 0,0 画）
  const p1 = pop(t, at('005', '机长制服'), 0.45), p2 = pop(t, at('005', '银行'), 0.45), p3 = pop(t, at('005', '支票'), 0.45);
  if (p2 > 0.01) X.popScale(ctx, 1230, 420, p2, () => Q.sheet(ctx, 'G05', 0, 0, 560, 380, { seed: 55 }));
  if (p1 > 0.01) X.popScale(ctx, 820, 400, p1, () => Q.put(ctx, 'G02', 0, 210, 420, { ar: 0.66, rot: -0.04 }));
  if (p3 > 0.01) Q.cheque(ctx, 1560, 300, 360, { alpha: clamp(p3 * 1.5), s: 0.6 + 0.4 * p3, rot: 0.12, seed: 7 });
  Q.tag(ctx, 1220, 790, '谁还会怀疑我', pop(t, at('005', '谁还')), { size: 70, hl: true, rot: -0.02 });
}

// 镜头表：a 起点秒，tr 软切换方式；gl = 山河转场 id
module.exports = [
  { a: 0, gl: 'paixian', draw: s01, name: '001' },
  { a: L('002').t0 - 0.1, tr: 'cut', draw: s02, name: '002' },
  { a: L('003').t0 - 0.2, tr: 'slide', draw: s03, name: '003' },
  { a: L('004').t0 - 0.15, tr: 'slide', draw: s04, name: '004' },
  { a: L('005').t0 - 0.2, tr: 'fade', draw: s05, name: '005' },
];
