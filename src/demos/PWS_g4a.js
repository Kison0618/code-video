'use strict';
// PWG4 第一幕「中学教室」：C301–C310（之后是书页 P2）
//   场景：午后的教室。左边一排大窗，阳光斜着打进来（主光源，光柱里有浮尘），后墙黑板、挂钟、讲台，一排排课桌有纵深，前景是虚化的前排椅背和后脑勺；她和同桌共用一张双人桌，桌上一条「三八线」
//   C301 镜头从教室全景推到她那张课桌
//   C302 忍让 / 一忍再忍：同桌的书一摞摞越过三八线、拿走她的橡皮、胳膊肘整个压过来 —— 每过分一次，她头顶那只刻着「忍」字的玻璃杯里水就涨一截
//   C303 忍无可忍：水涨到杯沿鼓起来、冒泡，她腾地站起来，红光炸开，「忍无可忍！」；一转 —— 一只盖子「啪」扣在杯口，红光瘪下去，她坐回去挤出一个笑：「……忍辱负重」
//   C304 俯视这张课桌：他那边摊得满满当当、胳膊肘笔盒零食一路压过线，她的东西被挤到一个小角；一个大问号
//   C305 没点 B 数：推到同桌胸口，开一扇小窗，里面的「B 数」牌子上是 0，飘过一根草
//   C306 一头雾水：同桌的脑袋被一团雾罩住，雾里还在下小雨
//   C307 他觉得无关紧要 / 她如此重视：同一块橡皮 —— 在他手心上只有米粒大，飘到她这边越长越大，变成压在她头顶的一座山
//   C308 身不由己：她使劲把这座「山」往外推，推出去一点又弹回来，更大
//   C309 INFJ 老师走上讲台，教鞭一点，黑板上的粉笔线自己画出一个脑袋的剖面
//   C310 情绪开关：脑袋里一只大闸刀，她（小小的）跳起来把它拉到「关」，一松手「啪」弹回「开」，再拉、再弹
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const { K, GOLD, LIME, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const FY = 1000, PAD = 240, DY = 1096, SUN = [255, 220, 150];
const T = { in: vs('C301') - 0.6, c301: vs('C301'), c302: vs('C302'), r1: at('C302', '权且'), r2: at('C302', '一忍'), c303: vs('C303'), boil: at('C303', '忍无可忍'), lid: at('C303', '选择'), c304: vs('C304'), c305: vs('C305'), bnum: at('C305', 'B数'), c306: vs('C306'), fogw: at('C306', '一头雾水'),
  c307: vs('C307'), small: at('C307', '无关紧要'), big: at('C307', '如此重视'), c308: vs('C308'), cant: at('C308', '身不由己'), c309: vs('C309'), c310: vs('C310'), sw: at('C310', '开关'), no: at('C310', '不是'), end: ve('C310') + 0.5 };
const TOP = [T.c304 - 0.3, T.c305 - 0.25];           // 俯视课桌那一段
const BRAIN = T.c309 + 1.1;                            // 黑板上的脑袋开始画
const CAM = [
  [T.in, { x: 0, y: 0, z: 1.0, ax: 560, ay: 1000 }], [T.c302, { x: 20, y: 10, z: 1.24 }], [T.boil - 0.2, { x: 60, y: -20, z: 1.3 }], [T.boil + 0.5, { x: 90, y: -40, z: 1.44 }], [T.lid + 0.8, { x: 40, y: -10, z: 1.26 }], [T.c304 - 0.3, { x: 40, y: -10, z: 1.3 }],
  [T.c305 - 0.2, { x: -60, y: 0, z: 1.3 }], [T.bnum - 0.2, { x: -150, y: 60, z: 2.5 }], [T.c306 - 0.1, { x: -150, y: 60, z: 2.56 }], [T.c306 + 0.7, { x: -130, y: -150, z: 1.9 }], [T.c307 - 0.1, { x: -130, y: -150, z: 1.94 }], [T.c307 + 0.9, { x: 0, y: -40, z: 1.14 }],
  [T.c309 - 0.2, { x: 20, y: -60, z: 1.2 }], [T.c309 + 0.9, { x: 60, y: -200, z: 1.0 }], [T.c310, { x: 60, y: -300, z: 1.5 }], [T.end, { x: 60, y: -310, z: 1.58 }],
];
// ---------- 教室预渲 ----------
const BB = [300, 250, 720, 430];      // 黑板
const ROOM = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2); const r = mulberry32(14);
  S.vgrad(c, [[0, [150, 128, 110]], [0.62, [196, 166, 130]], [0.63, [120, 136, 120]], [1, [96, 112, 104]]], -PAD, FY, -PAD, W + PAD);
  c.fillStyle = 'rgb(84,70,64)'; c.fillRect(-PAD, FY - 22, W + PAD * 2, 22);
  // 左墙（透视）+ 两扇大窗：窗外是操场的树和天
  S.poly(c, [[-PAD, -200], [200, 120], [200, FY], [-PAD, 1420]]); const lw = c.createLinearGradient(-PAD, 0, 200, 0); lw.addColorStop(0, 'rgb(214,190,150)'); lw.addColorStop(1, 'rgb(170,146,118)'); c.fillStyle = lw; c.fill();
  for (const [x0, x1] of [[-190, -30], [10, 160]]) { const ty = x => 150 + (200 - x) * -0.6 + (x < 0 ? 0 : 0), yt0 = 250 - (x0 - 200) * -0.5 - 200, q = [[x0, 180 - (200 - x0) * 0.52], [x1, 180 - (200 - x1) * 0.52], [x1, 820 + (200 - x1) * 0.5], [x0, 820 + (200 - x0) * 0.5]];
    S.poly(c, q); const g = c.createLinearGradient(0, q[0][1], 0, q[3][1]); g.addColorStop(0, 'rgb(255,236,190)'); g.addColorStop(0.55, 'rgb(255,206,150)'); g.addColorStop(0.56, 'rgb(150,180,110)'); g.addColorStop(1, 'rgb(110,150,96)'); c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgb(236,226,206)'; c.lineWidth = 16; c.lineJoin = 'round'; S.poly(c, q); c.stroke(); c.lineWidth = 8; c.beginPath(); c.moveTo((x0 + x1) / 2, (q[0][1] + q[1][1]) / 2); c.lineTo((x0 + x1) / 2, (q[2][1] + q[3][1]) / 2); c.stroke(); }
  // 地板
  S.vgrad(c, [[0, [176, 136, 100]], [0.4, [140, 104, 84]], [1, [70, 50, 50]]], FY, H + PAD, -PAD, W + PAD);
  for (let i = -8; i <= 20; i++) { const xb = i * 160, xa = 560 + (xb - 560) * 0.5; S.poly(c, [[xa - 1.5, FY], [xa + 1.5, FY], [xb + 5, H + PAD], [xb - 5, H + PAD]], 'rgba(60,30,20,0.2)'); }
  // 黑板 + 粉笔槽
  const [bx, by, bw, bh] = BB; c.fillStyle = 'rgb(120,84,56)'; c.fillRect(bx - 20, by - 20, bw + 40, bh + 40); const bg = c.createLinearGradient(0, by, 0, by + bh); bg.addColorStop(0, 'rgb(40,84,70)'); bg.addColorStop(1, 'rgb(28,62,56)'); c.fillStyle = bg; c.fillRect(bx, by, bw, bh);
  c.fillStyle = 'rgba(255,255,255,0.05)'; for (let k = 0; k < 12; k++) { c.beginPath(); c.ellipse(bx + r() * bw, by + r() * bh, 80 + r() * 120, 16 + r() * 20, r(), 0, 6.2832); c.fill(); }
  c.fillStyle = 'rgb(150,110,76)'; c.fillRect(bx - 20, by + bh + 20, bw + 40, 16);
  K.text(c, '好好学习  天天向上', bx + bw / 2, by - 50, { size: 44, weight: 500, color: [190, 70, 60], spacing: 0.3 });
  // 挂钟
  c.fillStyle = 'rgb(240,232,220)'; c.beginPath(); c.arc(170 + 60, 210, 0, 0, 0); c.fill();
  // 讲台
  const pg = c.createLinearGradient(0, 860, 0, 1010); pg.addColorStop(0, 'rgb(170,120,84)'); pg.addColorStop(1, 'rgb(110,74,60)'); c.fillStyle = pg; c.fillRect(840, 840, 230, 170); c.fillStyle = 'rgb(190,140,100)'; c.fillRect(826, 826, 258, 22);
  // 后排的课桌（小）
  for (const dx of [250, 620]) { c.fillStyle = 'rgb(150,110,84)'; c.fillRect(dx, 1010, 250, 14); c.fillStyle = 'rgb(110,80,66)'; c.fillRect(dx + 8, 1024, 234, 46); }
}));
const SHAFT = S.lazy(() => S.bake(1300, 1400, c => { c.filter = 'blur(22px)'; for (const [x0, w] of [[40, 150], [250, 150]]) { const g = c.createLinearGradient(0, 200, 900, 1300); g.addColorStop(0, 'rgba(255,226,160,0.55)'); g.addColorStop(1, 'rgba(255,226,160,0)'); c.fillStyle = g; S.poly(c, [[x0, 240], [x0 + w, 200], [x0 + w + 980, 1340], [x0 + 560, 1380]]); c.fill(); } }));
const FRONT = S.lazy(() => S.bake(W + 600, 900, c => { c.filter = 'blur(9px)'; c.fillStyle = 'rgb(40,28,30)'; c.beginPath(); c.roundRect(60, 420, 520, 520, 30); c.fill(); c.beginPath(); c.roundRect(1160, 480, 520, 460, 30); c.fill(); MB.person(c, 'istj-male', 330, 1160, 3.4, { dim: 0.86, shadow: 0 }); }));
// ---------- 道具 ----------
function glass(ctx, x, y, s, lv, o = {}) {       // 忍耐杯：lv 0-1 水位；o.boil 沸腾、o.lid 盖子
  const { boil = 0, lid = 0, t = 0, a = 1 } = o; if (a <= 0.003) return;
  ctx.save(); ctx.translate(x + (boil > 0.5 ? Math.sin(t * 50) * 5 * boil : 0), y); ctx.scale(s, s); ctx.globalAlpha *= a;
  const w0 = 110, w1 = 86, h = 300, col = mix([255, 150, 90], [255, 60, 50], clamp(lv * 1.1));
  S.add(ctx, () => glow(ctx, 0, -h / 2, 330, col, 0.2 + 0.4 * boil));
  // 杯身（玻璃）
  S.poly(ctx, [[-w0, -h], [w0, -h], [w1, 0], [-w1, 0]]); const gg = ctx.createLinearGradient(-w0, 0, w0, 0); gg.addColorStop(0, 'rgba(255,255,255,0.34)'); gg.addColorStop(0.2, 'rgba(255,255,255,0.08)'); gg.addColorStop(0.8, 'rgba(255,255,255,0.1)'); gg.addColorStop(1, 'rgba(255,255,255,0.3)'); ctx.fillStyle = gg; ctx.fill();
  // 水
  const wy = -h * clamp(lv) * 0.97, ww = lerp(w1, w0, clamp(lv) * 0.97) - 6;
  ctx.save(); S.poly(ctx, [[-w0 + 6, -h], [w0 - 6, -h], [w1 - 6, -6], [-w1 + 6, -6]]); ctx.clip();
  const wg = ctx.createLinearGradient(0, wy, 0, 0); wg.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.3), 0.9)); wg.addColorStop(1, rgba(mix(col, [120, 0, 30], 0.3), 0.92)); ctx.fillStyle = wg;
  ctx.beginPath(); ctx.moveTo(-w0, 0); ctx.lineTo(-w0, wy); for (let k = 0; k <= 12; k++) ctx.lineTo(-w0 + (k / 12) * w0 * 2, wy + Math.sin(k * 1.4 + t * (3 + 9 * boil)) * (4 + 10 * boil)); ctx.lineTo(w0, 0); ctx.fill();
  for (let k = 0; k < 8; k++) { const ph = (t * (0.5 + boil * 1.6) + hash(k * 3.3)) % 1; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph) * (0.3 + boil)})`; ctx.beginPath(); ctx.arc((hash(k * 7.1) - 0.5) * ww * 1.6, -6 + (wy + 6) * ph, 5 + hash(k) * 9, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  if (lv > 0.98 && lid < 0.5) { ctx.fillStyle = rgba(mix(col, [255, 255, 255], 0.3), 0.9); ctx.beginPath(); ctx.ellipse(0, -h, w0 - 4, 16 + 10 * boil, 0, Math.PI, 0); ctx.fill(); }
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(-w0 + 14, -h + 20, 10, h - 60);
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(0, -h, w0, 12, 0, 0, 6.2832); ctx.stroke();
  K.text(ctx, '忍', 0, -h * 0.36, { size: 110, weight: 500, color: [255, 255, 255], alpha: 0.85 });
  if (lid > 0.01) { const ly = -h - 14 - (1 - easeIn(lid)) * 420; const lg = ctx.createLinearGradient(-130, 0, 130, 0); lg.addColorStop(0, 'rgb(120,130,150)'); lg.addColorStop(0.5, 'rgb(226,232,244)'); lg.addColorStop(1, 'rgb(100,110,130)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.roundRect(-130, ly - 30, 260, 36, 10); ctx.fill(); ctx.beginPath(); ctx.roundRect(-30, ly - 60, 60, 34, 10); ctx.fill(); }
  ctx.restore();
}
function eraser(ctx, x, y, s, rot = 0, a = 1) {
  if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
  const g = ctx.createLinearGradient(0, -34, 0, 34); g.addColorStop(0, 'rgb(255,250,244)'); g.addColorStop(1, 'rgb(214,204,210)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-60, -34, 120, 68, 12); ctx.fill(); ctx.shadowColor = 'transparent';
  const b = ctx.createLinearGradient(0, -34, 0, 34); b.addColorStop(0, 'rgb(110,170,240)'); b.addColorStop(1, 'rgb(60,110,200)'); ctx.fillStyle = b; ctx.beginPath(); ctx.roundRect(-36, -34, 64, 68, 4); ctx.fill();
  K.text(ctx, '橡皮', -4, 12, { size: 28, weight: 500, color: [240, 246, 255] }); ctx.restore();
}
function books(ctx, x, y, n, s = 1) { for (let i = 0; i < n; i++) { const col = [[214, 96, 90], [90, 140, 200], [240, 196, 110], [110, 170, 130]][i % 4], w = (150 - (i % 2) * 14) * s; ctx.fillStyle = rgba(col); ctx.beginPath(); ctx.roundRect(x - w / 2 + (i % 3 - 1) * 6, y - (i + 1) * 22 * s, w, 22 * s, 3); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x - w / 2 + (i % 3 - 1) * 6 + 6, y - (i + 1) * 22 * s + 6 * s, w - 12, 7 * s); } }
function desk(ctx, cx) {
  const g = ctx.createLinearGradient(0, DY, 0, DY + 44); g.addColorStop(0, 'rgb(226,180,130)'); g.addColorStop(1, 'rgb(180,130,96)'); ctx.fillStyle = g; S.poly(ctx, [[cx - 330, DY], [cx + 330, DY], [cx + 356, DY + 44], [cx - 356, DY + 44]]); ctx.fill();
  const f = ctx.createLinearGradient(0, DY + 44, 0, DY + 320); f.addColorStop(0, 'rgb(150,106,80)'); f.addColorStop(1, 'rgb(96,66,60)'); ctx.fillStyle = f; ctx.fillRect(cx - 356, DY + 44, 712, 300);
  ctx.fillStyle = 'rgba(255,255,255,0.2)'; ctx.fillRect(cx - 330, DY, 660, 4);
  ctx.strokeStyle = 'rgba(200,40,40,0.85)'; ctx.lineWidth = 5; ctx.setLineDash([14, 9]); ctx.beginPath(); ctx.moveTo(cx - 2, DY + 2); ctx.lineTo(cx, DY + 42); ctx.stroke(); ctx.setLineDash([]);
}
// 俯视的课桌
function topDesk(ctx, t) {
  const u = prog(t, TOP[0], TOP[1]), inv = easeInOut(prog(u, 0.1, 0.8));
  S.vgrad(ctx, [[0, [120, 90, 76]], [1, [70, 50, 50]]], 0, H, 0, W);
  for (let i = 0; i < 8; i++) { ctx.fillStyle = 'rgba(40,20,20,0.2)'; ctx.fillRect(i * 160 - 4, 0, 8, H); }
  ctx.save(); ctx.translate(540, 760); ctx.rotate(-0.05 + 0.02 * u); const z = 1 + 0.06 * u; ctx.scale(z, z);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 26; const g = ctx.createLinearGradient(-480, -330, 480, 330); g.addColorStop(0, 'rgb(240,196,140)'); g.addColorStop(1, 'rgb(196,146,104)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-480, -330, 960, 660, 26); ctx.fill(); ctx.shadowColor = 'transparent';
  S.add(ctx, () => S.rgrad(ctx, -260, -160, 620, [[0, SUN, 0.32], [1, SUN, 0]]));
  for (let k = 0; k < 9; k++) { ctx.fillStyle = 'rgba(120,70,40,0.07)'; ctx.fillRect(-480, -330 + k * 74 + 20, 960, 10); }
  ctx.strokeStyle = 'rgba(206,40,40,0.9)'; ctx.lineWidth = 8; ctx.setLineDash([26, 16]); ctx.beginPath(); ctx.moveTo(0, -330); ctx.lineTo(0, 330); ctx.stroke(); ctx.setLineDash([]);
  // 她这边（右）：被挤到角上的一小撮
  const sq = 1 - 0.3 * inv; eraser(ctx, 400 - 20 * inv, 250, 0.9 * sq, 0.1); ctx.save(); ctx.translate(360 + 40 * inv, 110 + 60 * inv); ctx.rotate(0.06); ctx.scale(sq, sq); ctx.fillStyle = 'rgb(250,246,236)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 12; ctx.fillRect(-90, -120, 180, 240); ctx.shadowColor = 'transparent'; for (let k = 0; k < 7; k++) { ctx.fillStyle = 'rgba(90,110,160,0.35)'; ctx.fillRect(-70, -96 + k * 28, k === 6 ? 80 : 140, 8); } ctx.restore();
  ctx.save(); ctx.translate(250 + 60 * inv, 280); ctx.rotate(-0.5); const pg = ctx.createLinearGradient(0, -8, 0, 8); pg.addColorStop(0, 'rgb(150,214,150)'); pg.addColorStop(1, 'rgb(80,150,110)'); ctx.fillStyle = pg; ctx.beginPath(); ctx.roundRect(-90, -9, 180, 18, 9); ctx.fill(); ctx.restore();
  // 他那边（左）：一路压过线
  const push = inv * 330;
  ctx.save(); ctx.translate(-300 + push * 0.5, -120); ctx.rotate(0.14); books(ctx, 0, 60, 1, 2.2); ctx.fillStyle = 'rgb(214,96,90)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 14; ctx.fillRect(-150, -110, 300, 220); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-120, -80, 200, 30); ctx.restore();
  ctx.save(); ctx.translate(-200 + push * 0.9, 110); ctx.rotate(-0.2); ctx.fillStyle = 'rgb(90,140,200)'; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 14; ctx.fillRect(-140, -100, 280, 200); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(-110, -70, 180, 26); ctx.restore();
  ctx.save(); ctx.translate(-330 + push * 1.05, 250); ctx.rotate(0.3); const cg = ctx.createLinearGradient(0, -40, 0, 40); cg.addColorStop(0, 'rgb(255,214,110)'); cg.addColorStop(1, 'rgb(240,150,70)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.roundRect(-110, -44, 220, 88, 16); ctx.fill(); K.text(ctx, '薯片', 0, 14, { size: 40, weight: 500, color: [150, 60, 30] }); ctx.restore();
  for (let k = 0; k < 12; k++) { ctx.fillStyle = 'rgba(240,190,90,0.9)'; ctx.beginPath(); ctx.ellipse(-80 + push * 0.9 + hash(k) * 200, 200 + hash(k * 3) * 110, 9, 6, k, 0, 6.2832); ctx.fill(); }
  // 胳膊肘：从左下斜着压过线
  ctx.save(); ctx.translate(-560 + push * 1.25, 60); ctx.rotate(-0.3); const ag = ctx.createLinearGradient(0, -70, 0, 70); ag.addColorStop(0, 'rgb(255,214,90)'); ag.addColorStop(1, 'rgb(214,160,50)'); ctx.fillStyle = ag; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24; ctx.beginPath(); ctx.roundRect(-300, -72, 520, 144, 70); ctx.fill(); ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgb(244,206,170)'; ctx.beginPath(); ctx.ellipse(250, 0, 86, 66, 0, 0, 6.2832); ctx.fill(); ctx.restore();
  ctx.restore();
  const q = smooth(prog(u, 0.45, 0.75)); if (q > 0.01) { ctx.save(); ctx.translate(820, 300); ctx.rotate(0.14 + Math.sin(t * 3) * 0.05); S.title(ctx, '？', 0, 0, { size: 330 * (0.8 + 0.2 * q), c: [255, 240, 200], a: q, family: 'Serif' }); ctx.restore(); }
}
const HERX = 720, MATEX = 400;
function draw(ctx, t) {
  if (t > TOP[0] + 0.25 && t < TOP[1]) { topDesk(ctx, t); return { C: { x: 0, y: 0, z: 1 } }; }
  const C = S.camKF(t, CAM);
  ctx.fillStyle = 'rgb(120,100,90)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(ROOM(), -PAD, -PAD / 2);
  // 黑板上的字 / 脑袋剖面
  const [bx, by, bw, bh] = BB, bu = prog(t, BRAIN, BRAIN + 1.6), chalk = [236, 240, 230];
  if (bu <= 0) { K.text(ctx, '第三章  二次函数', bx + 40, by + 90, { size: 46, color: chalk, alpha: 0.75, align: 'left' }); K.text(ctx, 'y = ax² + bx + c', bx + 60, by + 180, { size: 50, family: 'Latin', style: 'italic', color: chalk, alpha: 0.7, align: 'left' }); ctx.strokeStyle = 'rgba(236,240,230,0.6)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.beginPath(); for (let k = 0; k <= 30; k++) { const s = k / 30 * 2 - 1; ctx.lineTo(bx + 520 + s * 120, by + 370 - (1 - s * s) * 200 + 0); } ctx.stroke(); ctx.beginPath(); ctx.moveTo(bx + 380, by + 370); ctx.lineTo(bx + 670, by + 370); ctx.moveTo(bx + 520, by + 390); ctx.lineTo(bx + 520, by + 140); ctx.stroke(); }
  else { // 粉笔线自己画出脑袋的剖面（参考片的描线手法，用在黑板上正合适）
    const hc = [bx + 300, by + 215], head = Array.from({ length: 41 }, (_, k) => { const a = -0.4 + (k / 40) * 5.1, r = 170 + 14 * Math.sin(a * 2); return [hc[0] + Math.cos(a) * r * 1.02, hc[1] + Math.sin(a) * r * 0.98]; });
    S.neon(ctx, [...head, [hc[0] + 30, hc[1] + 200], [hc[0] + 110, hc[1] + 200]], easeInOut(bu), chalk, 0.8, 5, false, 0.6);
    S.neon(ctx, Array.from({ length: 30 }, (_, k) => { const a = k / 29 * 12.5; return [hc[0] - 10 + Math.cos(a) * (130 - k * 3.4), hc[1] - 20 + Math.sin(a) * (110 - k * 3)]; }), easeInOut(prog(bu, 0.3, 1)), [255, 170, 190], 0.4, 3.4, false, 0.4);
    K.text(ctx, '情绪开关', bx + 560, by + 90, { size: 50, weight: 500, color: chalk, alpha: 0.9 * smooth(prog(bu, 0.5, 1)) });
    // 闸刀开关：底座 + 拉杆（开=上=粉色亮，关=下）
    const sa = smooth(prog(t, T.sw - 0.5, T.sw)), ph = (t - T.sw - 0.2) / 1.25, cyc = ph - Math.floor(ph), pull = ph < 0 ? 0 : cyc < 0.55 ? easeInOut(cyc / 0.55) : cyc < 0.7 ? 1 : Math.max(0, 1 - easeOut((cyc - 0.7) / 0.08)), snap = ph >= 0 && cyc > 0.7 ? Math.exp(-(cyc - 0.7) * 14) : 0;
    const sx = hc[0] - 10, sy = hc[1] - 10, ang = lerp(-0.75, 0.75, pull) + Math.sin(t * 40) * 0.05 * snap;
    if (sa > 0.01) { ctx.save(); ctx.globalAlpha = sa; ctx.translate(sx, sy); ctx.scale(1.5, 1.5); ctx.translate(-sx, -sy); S.add(ctx, () => glow(ctx, sx, sy, 230, mix([255, 120, 160], [120, 150, 200], pull), 0.5));
      ctx.fillStyle = 'rgb(60,66,84)'; ctx.beginPath(); ctx.roundRect(sx - 70, sy - 96, 140, 192, 18); ctx.fill(); ctx.fillStyle = 'rgb(30,34,46)'; ctx.beginPath(); ctx.roundRect(sx - 16, sy - 70, 32, 140, 14); ctx.fill();
      K.text(ctx, '开', sx - 44, sy - 52, { size: 30, weight: 500, color: [255, 150, 180], alpha: 1 - 0.6 * pull }); K.text(ctx, '关', sx - 44, sy + 74, { size: 30, weight: 500, color: [170, 190, 230], alpha: 0.4 + 0.6 * pull });
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(ang - Math.PI / 2 + Math.PI / 2); const lg = ctx.createLinearGradient(-12, 0, 12, 0); lg.addColorStop(0, 'rgb(150,156,176)'); lg.addColorStop(0.5, 'rgb(244,246,255)'); lg.addColorStop(1, 'rgb(120,126,146)'); ctx.fillStyle = lg; ctx.beginPath(); ctx.roundRect(-11, -8, 22, -0, 0); ctx.restore();
      const hx2 = sx + 130 * Math.cos(ang), hy2 = sy + 130 * Math.sin(ang) * 1; ctx.strokeStyle = 'rgb(226,230,244)'; ctx.lineWidth = 22; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(hx2, hy2); ctx.stroke(); ctx.fillStyle = 'rgb(240,90,110)'; ctx.beginPath(); ctx.arc(hx2, hy2, 30, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(hx2 - 9, hy2 - 10, 9, 0, 6.2832); ctx.fill();
      if (snap > 0.05) S.add(ctx, () => { for (let k = 0; k < 8; k++) glow(ctx, hx2 + Math.cos(k * 0.8) * 90 * (1 - snap), hy2 + Math.sin(k * 0.8) * 90 * (1 - snap), 26 * snap + 6, [255, 230, 150], snap); });
      // 小小的她：吊在拉杆头上往下拽
      infp(ctx, hx2 + 6, hy2 + 150 - 0, 0.24, { t, wind: false, flies: 0, ra: -1.5, la: -1.5, eyes: pull > 0.9 ? 'happy' : snap > 0.1 ? 'wide' : 'sad', mouth: snap > 0.1 ? 'o' : 'flat', lean: 0.1 * Math.sin(t * 9) * (1 - pull) });
      ctx.restore(); }
  }
  // 阳光：斜的光柱 + 浮尘
  S.add(ctx, () => { ctx.globalAlpha = 0.8 + 0.04 * Math.sin(t * 0.6); ctx.drawImage(SHAFT(), -260, -80); ctx.globalAlpha = 1; for (let k = 0; k < 16; k++) { const dx = 100 + hash(k * 3.1) * 700 + Math.sin(t * 0.3 + k) * 30, dy = 300 + hash(k * 7.7) * 700 + Math.cos(t * 0.25 + k * 2) * 24; if (dx - 100 > (dy - 250) * 0.9 + 260 || dx < (dy - 300) * 0.45) continue; glow(ctx, dx, dy, 12 + hash(k) * 12, SUN, 0.5); } });
  // 老师（INFJ）走上讲台
  const tu = prog(t, T.c309 - 0.3, T.c309 + 0.9);
  if (tu > 0) { const txx = lerp(1300, 960, easeOut(tu)); S.lit(ctx, c => MB.person(c, 'infj-male', txx, 1010, 2.0, { flip: true, bob: Math.abs(Math.sin(tu * Math.PI * 4)) * 6 * (tu < 1 ? 1 : 0) }), { light: [-300, 200], at: [txx, 760], r: 320, warm: SUN, cool: [60, 40, 60], k: 0.8 });
    const pu = smooth(prog(t, T.c309 + 0.7, BRAIN + 0.2)); ctx.strokeStyle = 'rgb(120,80,50)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(txx - 60, 800); ctx.lineTo(txx - 60 - 150 * pu - 40, 800 - 190 * pu - 20); ctx.stroke(); }
  // 同桌
  const st = [prog(t, T.r1 - 0.5, T.r1 + 0.1), prog(t, T.r2 - 0.5, T.r2 + 0.1), prog(t, T.r2 + 0.5, T.r2 + 1.1), prog(t, T.boil - 0.7, T.boil - 0.1)];
  const fog = smooth(prog(t, T.c306 - 0.2, T.fogw)) * (1 - smooth(prog(t, T.c307, T.c307 + 0.8)));
  const L0 = [-300, 200];
  const M = S.lit(ctx, c => MB.person(c, 'estp-male', MATEX + easeOut(st[2]) * 40, 1300, 2.25, { lean: 0.05 * easeOut(st[2]) + 0.02 * Math.sin(t * 2), bob: Math.abs(Math.sin(t * 3)) * 3 }), { light: L0, at: [MATEX, 1040], r: 330, warm: SUN, cool: [50, 30, 50], k: 0.9 });
  // 她
  const boil = smooth(prog(t, T.boil - 0.25, T.boil + 0.25)) * (1 - smooth(prog(t, T.lid + 0.15, T.lid + 0.5))), lid = prog(t, T.lid, T.lid + 0.4), after = smooth(prog(t, T.lid + 0.3, T.lid + 0.9));
  const big = easeInOut(prog(t, T.small + 0.4, T.big + 0.6)) * (1 - smooth(prog(t, T.c309 - 0.4, T.c309 + 0.2))), push = prog(t, T.c308, T.c309 - 0.2), pcy = push > 0 && push < 1 ? (push * 2.2) % 1 : 0, shove = pcy < 0.6 ? easeOut(pcy / 0.6) : 1 - easeOut((pcy - 0.6) / 0.15);
  const rise = boil * 46;
  const o = { t, wind: false, eyes: boil > 0.4 ? 'wide' : after > 0.3 && t < T.c304 ? 'happy' : big > 0.3 ? 'sad' : st[0] > 0.5 && t < T.c304 ? 'closed' : 'open', mouth: boil > 0.4 ? 'o' : after > 0.3 && t < T.c304 ? 'smile' : st[0] > 0.5 ? 'flat' : 'smile', tilt: -0.3 * boil + 0.3 * big * (1 - shove), look: big > 0.3 ? [0, -1.8] : [-1.5, 0.3], la: -0.9 * boil - 1.3 * big * shove * (push > 0 ? 1 : 0), ra: -0.7 * boil - 1.2 * big * shove * (push > 0 ? 1 : 0), lean: 0.03 * Math.sin(t * 30) * boil - 0.05 * after * (t < T.c304 ? 1 : 0) };
  const R = S.lit(ctx, c => infp(c, HERX, 1296 - rise, 1.0, o), { light: L0, at: [HERX, 1010], r: 340, warm: SUN, cool: [50, 30, 60], k: 0.9, tint: boil > 0.05 ? [[255, 60, 40], 0.25 * boil] : null });
  if (boil > 0.02) S.add(ctx, () => { glow(ctx, HERX, 900, 700 * boil, [255, 70, 50], 0.4 * boil); });
  // 课桌 + 桌上的东西：他的书一摞摞越线
  desk(ctx, 560);
  books(ctx, 330, DY + 6, 3); books(ctx, lerp(250, 520, easeOut(st[0])), DY + 6, 4); if (st[1] > 0) books(ctx, lerp(300, 640, easeOut(st[1])), DY + 8, 2);
  ctx.save(); ctx.translate(770, DY + 8); ctx.fillStyle = 'rgb(250,246,236)'; S.poly(ctx, [[-90, -6], [80, -6], [100, 22], [-110, 22]]); ctx.fill(); ctx.restore();
  // 橡皮：被他拿走 → C307 的主角
  const tk = easeInOut(st[1]), sm = smooth(prog(t, T.c307 - 0.2, T.small + 0.3));
  let ex = lerp(860, M.chest[0] + 150, tk), ey = lerp(DY + 4, M.chest[1] + 40, tk) - Math.sin(tk * Math.PI) * 120, es = 0.5;
  if (sm > 0) { const hx0 = M.chest[0] + 150, hy0 = M.chest[1] + 40; ex = lerp(hx0, R.top[0] + 10 + 60 * shove * (push > 0 ? 1 : 0), big); ey = lerp(hy0 - 60 * sm, R.top[1] - 220 - 80 * shove * (push > 0 ? 1 : 0), big); es = lerp(0.34, 4.6 + (push > 0 ? Math.floor(push * 2.2) * 0.5 : 0) - 0.5 * shove * (push > 0 ? 1 : 0), big); }
  if (big > 0.2 && t < T.c309) { ctx.save(); ctx.globalAlpha = 0.4 * big; S.rgrad(ctx, HERX, 1100, 420, [[0, [20, 10, 30], 0.9], [1, [20, 10, 30], 0]], 0.6); ctx.restore(); }
  eraser(ctx, ex, ey, es, 0.1 * (1 - big) + Math.sin(t * 2) * 0.02, 1 - smooth(prog(t, T.c309 - 0.4, T.c309 + 0.2)));
  // 一头雾水
  if (fog > 0.01) { const fx = M.head[0], fy = M.head[1] - 20; ctx.save(); ctx.globalAlpha = fog; for (let k = 0; k < 9; k++) S.rgrad(ctx, fx + Math.sin(t * 0.7 + k * 1.9) * 70, fy + Math.cos(t * 0.5 + k * 2.3) * 30 - 30, 62 + (k % 3) * 16, [[0, [226, 232, 246], 0.6], [0.6, [190, 200, 226], 0.4], [1, [190, 200, 226], 0]]); ctx.restore();
    ctx.save(); ctx.translate(fx - 110, fy + 20); S.rain(ctx, t, { box: [0, 0, 220, 170], a: 0.9 * fog, n: 24, c: [200, 220, 255], slant: -0.1, seed: 5 }); ctx.restore(); K.text(ctx, '?', fx + 30 + Math.sin(t * 2) * 12, fy - 130, { size: 130, family: 'Latin', weight: 600, color: [255, 250, 236], alpha: fog }); }
  // 没点 B 数：胸口的小窗
  const bn = smooth(prog(t, T.c305 + 0.1, T.bnum)) * (1 - smooth(prog(t, T.c306 - 0.2, T.c306 + 0.3)));
  if (bn > 0.01) { const cx = M.chest[0] + 6, cy = M.chest[1] + 10, w = 150 * bn, h = 110; ctx.save(); ctx.globalAlpha = bn; ctx.fillStyle = 'rgb(60,40,40)'; ctx.beginPath(); ctx.roundRect(cx - w / 2 - 8, cy - h / 2 - 8, w + 16, h + 16, 14); ctx.fill(); const g = ctx.createLinearGradient(0, cy - h / 2, 0, cy + h / 2); g.addColorStop(0, 'rgb(40,44,70)'); g.addColorStop(1, 'rgb(20,22,40)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(cx - w / 2, cy - h / 2, w, h, 8); ctx.fill();
    if (bn > 0.7) { K.text(ctx, 'B 数', cx - 30, cy - 12, { size: 26, weight: 500, color: [190, 200, 230] }); K.text(ctx, '0', cx + 34, cy + 30, { size: 74, family: 'Latin', weight: 600, color: [255, 120, 110] }); const tw = (t * 0.5) % 1; ctx.strokeStyle = 'rgba(210,190,130,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx - w / 2 + tw * w, cy + 38, 9, t * 6, t * 6 + 4.6); ctx.stroke(); } ctx.restore(); }
  // 忍耐杯
  const lv = 0.08 + 0.26 * easeOut(st[0]) + 0.28 * easeOut(st[1]) + 0.24 * easeOut(st[2]) + 0.16 * easeOut(st[3]), ga = smooth(prog(t, T.c302 - 0.3, T.c302 + 0.3)) * (1 - smooth(prog(t, T.c304 - 0.6, T.c304 - 0.2)));
  glass(ctx, 850, 790 - 20 * boil + after * 40, 0.9 * (1 - 0.12 * after), Math.min(1, lv), { boil, lid, t, a: ga });
  if (ga > 0.01) for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(255,255,255,${0.55 * ga})`; ctx.beginPath(); ctx.arc(lerp(R.top[0] + 50, 830, (k + 1) / 4), lerp(R.top[1], 800, (k + 1) / 4) - 20, 8 + k * 5, 0, 6.2832); ctx.fill(); }
  ctx.restore();
  // 前景：前排的椅背和后脑勺（虚化）
  ctx.save(); S.cam(ctx, C, 1.6); ctx.globalAlpha = 1 - smooth(prog(C.z, 1.5, 2.0)); ctx.drawImage(FRONT(), -300, 1180); ctx.restore();
  return { C };
}
function over(ctx, t, a) {
  if (t > TOP[0] && t < TOP[1]) return;
  const b = K.vis(t, T.boil - 0.1, T.lid + 0.1, 0.12, 0.25) * a;
  if (b > 0.003) { const s = 1 + 0.5 * Math.exp(-Math.max(0, t - T.boil + 0.1) * 7); ctx.save(); ctx.translate(430 + Math.sin(t * 60) * 6, 420 + Math.cos(t * 53) * 5); ctx.rotate(-0.08); ctx.scale(s, s); S.title(ctx, '忍无可忍！', 0, 0, { size: 150, c: [255, 90, 70], a: b, spacing: 0.04, glowA: 0.9 }); ctx.restore(); }
  const c = K.vis(t, T.lid + 0.45, T.c304 - 0.4, 0.4, 0.3) * a; if (c > 0.003) { ctx.save(); ctx.translate(430, 440 + Math.sin(t * 2) * 4); ctx.rotate(0.03); S.title(ctx, '……忍辱负重', 0, 0, { size: 92, c: [226, 220, 236], a: c, spacing: 0.1, glowA: 0.3 }); ctx.restore(); }
  // 橡皮两边的说明
  const s1 = K.vis(t, T.small - 0.1, T.c308 + 0.6, 0.3, 0.3) * a, s2 = K.vis(t, T.big - 0.3, T.c308 + 0.6, 0.3, 0.3) * a;
  const pill = (str, x, y, c, al, size) => { ctx.fillStyle = `rgba(30,20,30,${0.62 * al})`; ctx.beginPath(); ctx.roundRect(x - str.length * size * 0.56, y - size * 0.95, str.length * size * 1.12, size * 1.36, size * 0.68); ctx.fill(); K.text(ctx, str, x, y, { size, weight: 500, color: c, alpha: al, spacing: 0.06 }); };
  if (s1 > 0.003) pill('他：多大点事', 250, 760, [255, 226, 160], s1, 50);
  if (s2 > 0.003) pill('她：天大的事', 760, 640, [255, 190, 206], s2, 56);
}
module.exports = { draw, over, T };
