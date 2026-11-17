'use strict';
// ESFJ v9 第 0 章「雨夜公交站」：A01–A04（2026-11-17 重做）
//   开场：镜头从雨夜的城市上空往下摇（长焦的远景天际线 → 街对面的住宅楼 → 公交站），停在一个冻得缩着肩的女孩身上
//   A01 他撑着伞、挎着帆布包走进来，手里一直捧着一只冒热气的杯子；说到「热水」时把杯子沿一道弧线递到她手里，她身上的冷色一点点退掉
//   A02 镜头横移到候车亭的灯箱：灯箱从下往上一格格亮起（暖色海报，不是白光），画面上方金箔大字「ESFJ / 供给者」逐字升起、扫光
//   A03 男妈妈：他把手伸进帆布包 —— 先抽出一条红围巾，在空中甩开、绕到她脖子上；再捧出便当盒，沿弧线放进她怀里。（反馈 1：东西不再凭空叠上去）
//   A04 她要走了：他把自己的伞递给她，自己站进雨里；她撑着他的伞往左走出画面。镜头升起来越过候车亭顶，街对面那栋楼他家的窗亮起，推进去（→ 下一章厨房）
//   去掉了：公交车灯的大白光团（反馈 2：13s 左侧光斑）、灯箱过曝的白、对面楼满墙的小方窗（反馈 7）
const X = require('./ehk');
const S = require('./ESS_kit');
const PR = require('./ESS_props');
const QT = require('./ESS_quote');
const TY = require('./ESS_type');
const CT = require('./ESS_city');
const NE = require('./ESS_neon');
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash } = K;
const glow = S.glow;

const T = { a01: vs('A01'), hot: at('A01', '热水'), a02: vs('A02'), a03: vs('A03'), mm: at('A03', '男妈妈'), a03e: ve('A03'), a04: vs('A04'), a04e: ve('A04'), end: vs('B01') };
const GY = 1250, HERX = 340, HIMX = 800, LAMP = [1010, 330], SODIUM = [255, 186, 110], COOL = [190, 214, 255];
// 动作时间
const M = {
  walk: [T.a01 + 0.1, T.hot - 0.5], give: [T.hot - 0.4, T.hot + 0.5],
  scIn: [T.a03 - 0.05, T.a03 + 0.45], scFly: [T.a03 + 0.45, T.a03 + 1.25],
  lbIn: [T.a03 + 1.3, T.a03 + 1.75], lbFly: [T.a03 + 1.75, T.a03e + 0.35],
  umb: [T.a04 + 0.1, T.a04 + 0.9], leave: [T.a04 + 1.0, T.a04 + 3.2],
};
const CAM = [
  [0, { x: 60, y: -1150, z: 0.92, ax: 540, ay: 1000 }], [T.a01 + 2.0, { x: 60, y: -180, z: 1.3 }, easeInOut], [T.hot + 0.8, { x: 40, y: -170, z: 1.36 }],
  [T.a02 + 0.2, { x: 10, y: -170, z: 1.34 }], [T.a02 + 1.6, { x: -250, y: -170, z: 1.28 }], [T.a03 - 0.2, { x: -220, y: -170, z: 1.3 }],
  [T.a03 + 0.6, { x: 60, y: -170, z: 1.3 }], [T.a03e + 0.6, { x: 50, y: -170, z: 1.36 }], [T.a04 - 0.2, { x: 50, y: -170, z: 1.38 }],
  [T.a04 + 1.4, { x: 0, y: -120, z: 1.18 }], [T.a04e + 0.3, { x: 0, y: -170, z: 1.1 }], [T.end - 1.7, { x: 0, y: -1030, z: 0.98 }],
];
// ---------- 预渲 ----------
const SKY = S.lazy(() => CT.skyline({ w: 1900, h: 1700, seed: 4, sky: [[8, 10, 26], [48, 36, 70]], fog: [92, 66, 98], base: [24, 22, 44], lit: 0.07, ground: 1560 }));
const FAC = S.lazy(() => CT.facade({ cols: 3, rows: 7, uw: 300, uh: 250, seed: 31, lit: 0.3, skip: [[1, 1]] }));
const FX = 400, FY = -930, MYW = [1, 1]; // 立面在 p=0.6 层的位置；他家 = 第 2 列第 2 层
// 雨夜的街：路面、路沿、倒影
function wetRoad(ctx, t) {
  S.vgrad(ctx, [[0, [66, 64, 92]], [1, [38, 36, 60]]], GY - 6, GY + 50, -500, W + 500);
  ctx.fillStyle = 'rgb(120,118,146)'; ctx.fillRect(-500, GY + 48, W + 1000, 8);
  S.vgrad(ctx, [[0, [22, 20, 40]], [1, [6, 6, 16]]], GY + 56, H + 400, -500, W + 500);
  S.add(ctx, () => { for (const [x, c, w, a] of [[LAMP[0], SODIUM, 140, 0.13], [200, [255, 200, 150], 220, 0.08], [560, COOL, 260, 0.06]]) for (let k = 0; k < 9; k++) S.rgrad(ctx, x + Math.sin(t * 2 + k) * 6, GY + 100 + k * 50, w * (1 - k * 0.06), [[0, c, a - k * 0.011], [1, c, 0]], 0.12); });
  for (let i = 0; i < 14; i++) { const ph = (t * 1.3 + hash(i * 3.1)) % 1, rx = hash(i * 7.7 + Math.floor(t * 1.3 + hash(i * 3.1))) * W, ry = GY + 110 + hash(i * 5.3) * 380; S.ring(ctx, rx, ry, 8 + ph * 46, 4, [190, 200, 240], 0.22 * (1 - ph), 0.25); }
}
function streetLamp(ctx) {
  const [x, y] = LAMP; const g = ctx.createLinearGradient(x + 50, 0, x + 80, 0); g.addColorStop(0, 'rgb(30,30,44)'); g.addColorStop(0.5, 'rgb(84,84,104)'); g.addColorStop(1, 'rgb(24,24,36)');
  ctx.fillStyle = g; ctx.fillRect(x + 56, y, 18, GY - y); ctx.strokeStyle = 'rgb(56,56,76)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x + 64, y + 10); ctx.quadraticCurveTo(x + 58, y - 40, x, y - 20); ctx.stroke();
  ctx.fillStyle = 'rgb(46,46,62)'; ctx.beginPath(); ctx.ellipse(x, y - 14, 50, 16, 0, 0, 6.2832); ctx.fill();
  S.add(ctx, () => { glow(ctx, x, y, 520, SODIUM, 0.2); glow(ctx, x, y - 4, 70, [255, 224, 180], 0.55); });
  ctx.save(); ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.lineTo(x + 380, GY); ctx.lineTo(x - 380, GY); ctx.closePath(); ctx.clip();
  S.add(ctx, () => { const g2 = ctx.createLinearGradient(0, y, 0, GY); g2.addColorStop(0, rgba(SODIUM, 0.16)); g2.addColorStop(1, rgba(SODIUM, 0.02)); ctx.fillStyle = g2; ctx.fillRect(x - 400, y, 800, GY - y); });
  ctx.restore();
}
// 灯箱：暖色海报（他捧着杯子的剪影 + 夕阳），亮起是从下往上一格格点亮的灯管；最亮也只到奶油色
const BOX = [70, 560, 300, 560];
function lightbox(ctx, t, ad) {
  const [bx, by, bw, bh] = BOX;
  ctx.fillStyle = 'rgb(28,30,42)'; ctx.fillRect(bx - 16, by - 16, bw + 32, bh + 32);
  ctx.fillStyle = 'rgb(46,48,62)'; ctx.fillRect(bx - 16, by - 16, bw + 32, 6);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip();
  ctx.fillStyle = 'rgb(26,26,40)'; ctx.fillRect(bx, by, bw, bh);
  if (ad > 0.003) {
    const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, 'rgb(226,168,120)'); g.addColorStop(0.55, 'rgb(206,116,86)'); g.addColorStop(1, 'rgb(120,56,64)');
    // 从下往上亮：遮罩一条渐变边
    const yEdge = by + bh * (1 - ad * 1.15);
    ctx.save(); ctx.beginPath(); ctx.rect(bx, yEdge, bw, by + bh - yEdge); ctx.clip();
    ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
    S.rgrad(ctx, bx + bw * 0.62, by + bh * 0.4, 130, [[0, [255, 226, 180], 0.7], [1, [255, 200, 140], 0]]);
    ES.hero(ctx, bx + bw * 0.45, by + bh + 30, 0.6, { umbrella: false, cake: false, book: false, rs: -1.0, re: -0.5, eyes: 'happy', mouth: 'smile', dim: 0.0, warm: 0.5 });
    const sh = ctx.createLinearGradient(0, by + bh * 0.5, 0, by + bh); sh.addColorStop(0, 'rgba(120,50,50,0)'); sh.addColorStop(1, 'rgba(90,30,40,0.55)'); ctx.fillStyle = sh; ctx.fillRect(bx, by, bw, bh);
    ctx.restore();
    S.add(ctx, () => { const e = ctx.createLinearGradient(0, yEdge - 20, 0, yEdge + 20); e.addColorStop(0, 'rgba(255,230,190,0)'); e.addColorStop(0.5, `rgba(255,230,190,${0.5 * (1 - ad)})`); e.addColorStop(1, 'rgba(255,230,190,0)'); ctx.fillStyle = e; ctx.fillRect(bx, yEdge - 20, bw, 40); });
  }
  // 玻璃面板的反光
  ctx.fillStyle = 'rgba(255,255,255,0.06)'; ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + bw * 0.5, by); ctx.lineTo(bx, by + bh * 0.6); ctx.fill();
  ctx.restore();
  if (ad > 0.01) S.add(ctx, () => glow(ctx, bx + bw / 2, by + bh / 2, 420, [255, 170, 110], 0.13 * ad));
}
function shelter(ctx, t, ad) {
  // 后玻璃：磨砂，雨水往下流
  ctx.save(); const gg = ctx.createLinearGradient(0, 520, 0, 1210); gg.addColorStop(0, 'rgba(150,170,220,0.12)'); gg.addColorStop(1, 'rgba(150,170,220,0.05)'); ctx.fillStyle = gg; ctx.fillRect(400, 520, 540, 690);
  ctx.strokeStyle = 'rgba(200,214,255,0.25)'; ctx.lineWidth = 3; ctx.strokeRect(400, 520, 540, 690);
  ctx.save(); ctx.beginPath(); ctx.rect(400, 520, 540, 690); ctx.clip(); ctx.lineCap = 'round';
  for (let i = 0; i < 16; i++) { const ph = (t * (0.05 + hash(i) * 0.08) + hash(i * 3)) % 1, x = 410 + hash(i * 7) * 520, y = 520 + ph * 700; const g = ctx.createLinearGradient(0, y - 80, 0, y); g.addColorStop(0, 'rgba(210,222,255,0)'); g.addColorStop(1, 'rgba(210,222,255,0.3)'); ctx.strokeStyle = g; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(x, y - 80); ctx.quadraticCurveTo(x + 3, y - 40, x, y); ctx.stroke(); }
  ctx.restore(); ctx.restore();
  const steel = (x, y, w, h) => { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgb(36,40,56)'); g.addColorStop(0.5, 'rgb(110,118,140)'); g.addColorStop(1, 'rgb(28,30,44)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); };
  steel(30, 470, 24, 780); steel(930, 470, 24, 780);
  // 顶棚：深色金属 + 下沿一条暖白灯带（柔，不刺眼）
  ctx.fillStyle = 'rgb(32,34,48)'; ctx.beginPath(); ctx.moveTo(-60, 476); ctx.lineTo(1040, 476); ctx.lineTo(1080, 430); ctx.lineTo(-100, 430); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(54,58,76)'; ctx.fillRect(-60, 470, 1100, 8);
  const lg = ctx.createLinearGradient(0, 478, 0, 492); lg.addColorStop(0, 'rgba(255,236,206,0.9)'); lg.addColorStop(1, 'rgba(255,236,206,0)'); ctx.fillStyle = lg; ctx.fillRect(160, 478, 700, 14);
  S.add(ctx, () => { const cg = ctx.createLinearGradient(0, 480, 0, 1250); cg.addColorStop(0, 'rgba(255,226,190,0.13)'); cg.addColorStop(1, 'rgba(255,226,190,0)'); ctx.fillStyle = cg; ctx.beginPath(); ctx.moveTo(160, 480); ctx.lineTo(860, 480); ctx.lineTo(980, 1250); ctx.lineTo(40, 1250); ctx.fill(); });
  // 长凳
  ctx.fillStyle = 'rgb(58,46,46)'; ctx.fillRect(470, 1062, 420, 24); ctx.fillStyle = 'rgb(96,72,58)'; ctx.fillRect(460, 1040, 440, 24); ctx.fillStyle = 'rgb(38,38,50)'; ctx.fillRect(500, 1086, 14, 160); ctx.fillRect(840, 1086, 14, 160);
  lightbox(ctx, t, ad);
}
// 伞（单独画：A04 他把伞交给她；G 她把红伞举到他头顶）
function umbrella(ctx, x, y, s, rot, c = [92, 200, 196], a = 1) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  const g = ctx.createLinearGradient(-240, 0, 240, 0); g.addColorStop(0, rgba(mix(c, [0, 0, 0], 0.35))); g.addColorStop(0.5, rgba(mix(c, [255, 255, 255], 0.15))); g.addColorStop(1, rgba(mix(c, [0, 0, 0], 0.4)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-250, 60); ctx.quadraticCurveTo(-200, -110, 0, -130); ctx.quadraticCurveTo(200, -110, 250, 60); for (let k = 5; k >= 0; k--) ctx.quadraticCurveTo(-250 + (k + 0.5) * 83, 30, -250 + k * 83, 60); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = rgba(mix(c, [0, 0, 0], 0.5), 0.6); ctx.lineWidth = 4; for (const k of [-1, -0.33, 0.33, 1]) { ctx.beginPath(); ctx.moveTo(0, -128); ctx.quadraticCurveTo(k * 120, -90, k * 166 * 1.5 * 0.6, 50); ctx.stroke(); }
  ctx.strokeStyle = 'rgb(60,50,50)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(0, -130); ctx.lineTo(0, 230); ctx.arc(-22, 230, 22, 0, Math.PI); ctx.stroke();
  ctx.restore();
}
// 背景（第 6 章复用）：o.city 让对面楼的窗一扇扇亮起暖光；o.myWin 他家那扇窗
function scene(ctx, t, C, o = {}) {
  const { ad = 1, city = 0, myWin = 0 } = o;
  ctx.save(); S.cam(ctx, C, 0.3); ctx.drawImage(SKY(), -420, -560, 1900, 1700); ctx.restore();
  const F = FAC();
  ctx.save(); S.cam(ctx, C, 0.6); ctx.drawImage(F.img, FX, FY, F.W, F.H);
  for (const u of F.units) { const isMine = u.i === MYW[0] && u.j === MYW[1]; const on = isMine ? myWin : (u.on ? 0 : smooth(prog(city, hash(u.i * 3 + u.j * 7) * 0.7, hash(u.i * 3 + u.j * 7) * 0.7 + 0.3))); if (on > 0.01) homeWin(ctx, FX + 30 + u.i * F.uw, FY + 20 + u.j * F.uh, F.uw, F.uh, on, isMine); }
  ctx.restore();
  ctx.fillStyle = 'rgba(12,12,30,0.32)'; ctx.fillRect(0, 0, W, H); // 雨雾：把背景压下去一档，人和候车亭才跳得出来
  ctx.save(); S.cam(ctx, C, 1); wetRoad(ctx, t); streetLamp(ctx); shelter(ctx, t, ad); ctx.restore();
}
// 亮起来的一户：暖光 + 窗帘 + 窗台上的绿植；isMine 时窗里有他家厨房的吊灯
function homeWin(ctx, x, y, uw, uh, on, isMine) {
  const ww = uw * 0.56, wh = uh * 0.62, wx = x + (uw - ww) / 2, wy = y + uh * 0.12;
  ctx.save(); ctx.globalAlpha *= on;
  const g = ctx.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, 'rgb(255,226,170)'); g.addColorStop(1, 'rgb(236,150,100)'); ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);
  if (isMine) { ctx.fillStyle = 'rgb(70,150,140)'; ctx.beginPath(); ctx.moveTo(wx + ww * 0.5 - 24, wy + 34); ctx.lineTo(wx + ww * 0.5 + 24, wy + 34); ctx.lineTo(wx + ww * 0.5 + 14, wy + 20); ctx.lineTo(wx + ww * 0.5 - 14, wy + 20); ctx.fill(); }
  ctx.fillStyle = 'rgba(196,92,76,0.85)'; ctx.fillRect(wx, wy, ww * 0.18, wh); ctx.fillRect(wx + ww * 0.82, wy, ww * 0.18, wh);
  ctx.fillStyle = 'rgba(16,14,30,0.9)'; ctx.fillRect(wx + ww / 2 - 4, wy, 8, wh); ctx.fillRect(wx, wy + wh * 0.3, ww, 6);
  ctx.restore();
  S.add(ctx, () => glow(ctx, wx + ww / 2, wy + wh / 2, ww * 1.4, [255, 190, 120], 0.25 * on));
}
// 飞起来的围巾：一条随风抖动的厚布带，从 a 点沿弧线飞到 b 点（头部领先、尾巴拖后）
function flyingScarf(ctx, t, a, b, u, c = [214, 72, 70]) {
  const N = 16, pts = [];
  for (let i = 0; i < N; i++) { const lag = i / (N - 1) * 0.35, v = clamp(u * 1.35 - lag), e = easeInOut(v), x = lerp(a[0], b[0], e), y = lerp(a[1], b[1], e) - Math.sin(e * Math.PI) * 260 + Math.sin(t * 14 + i * 0.7) * 14 * (1 - e) * (i / N); pts.push([x, y]); }
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = rgba(mix(c, [0, 0, 0], 0.3)); ctx.lineWidth = 46; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  ctx.strokeStyle = rgba(c); ctx.lineWidth = 36; ctx.stroke();
  ctx.setLineDash([10, 22]); ctx.strokeStyle = 'rgba(255,236,220,0.35)'; ctx.lineWidth = 30; ctx.stroke(); ctx.setLineDash([]);
  ctx.restore();
}
// 围在脖子上的围巾：一圈厚针织（前高后低的椭圆环）+ 打结后垂下的一条，带流苏；k 落定进度（从松到紧）
function neckScarf(ctx, x, y, s, t, k) {
  const c = [214, 72, 70], dk = mix(c, [60, 10, 20], 0.45), hi = mix(c, [255, 220, 200], 0.25);
  ctx.save(); ctx.translate(x, y); ctx.scale(s * lerp(1.25, 1, k), s * lerp(1.25, 1, k));
  ctx.lineCap = 'round';
  ctx.strokeStyle = rgba(dk); ctx.lineWidth = 30; ctx.beginPath(); ctx.ellipse(0, 0, 38, 13, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); // 后半圈
  const sw = Math.sin(t * 2.2) * 5;
  const g = ctx.createLinearGradient(-30, 0, 30, 0); g.addColorStop(0, rgba(dk)); g.addColorStop(0.5, rgba(c)); g.addColorStop(1, rgba(dk));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(4, 8); ctx.quadraticCurveTo(14 + sw, 60, 10 + sw * 1.6, 112); ctx.lineTo(40 + sw * 1.6, 108); ctx.quadraticCurveTo(38 + sw, 50, 30, 4); ctx.closePath(); ctx.fill(); // 垂下的一条
  ctx.fillStyle = 'rgba(255,236,220,0.22)'; for (let i = 0; i < 4; i++) ctx.fillRect(12 + sw * (0.6 + i * 0.25), 30 + i * 20, 26, 5);
  ctx.fillStyle = rgba(hi); for (let i = 0; i < 5; i++) ctx.fillRect(12 + sw * 1.6 + i * 6, 110, 3, 12);
  ctx.strokeStyle = rgba(c); ctx.lineWidth = 32; ctx.beginPath(); ctx.ellipse(0, 0, 38, 13, 0, -0.05 * Math.PI, Math.PI * 1.05); ctx.stroke(); // 前半圈
  ctx.strokeStyle = 'rgba(255,236,220,0.25)'; ctx.lineWidth = 4; ctx.setLineDash([6, 8]); ctx.beginPath(); ctx.ellipse(0, -4, 38, 13, 0, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = rgba(mix(c, [40, 0, 10], 0.2)); ctx.beginPath(); ctx.ellipse(20, 12, 15, 12, 0.3, 0, 6.2832); ctx.fill(); // 结
  ctx.restore();
}
// A02 片名：切进霓虹线稿 —— 他的线稿捧着一只金色杯子，热气一缕缕长出来；身后一圈轨道环描出来，环上三个小图标（碗、外套、房子：吃穿住）慢慢转
function neonTitle(ctx, t) {
  const t0 = T.a02 - 0.1;
  NE.bg(ctx, t);
  NE.floor(ctx, 1300, NE.TEAL, smooth(prog(t, t0, t0 + 0.8)));
  const cx = 540, cy = 1000, ring = easeInOut(prog(t, t0 + 0.2, t0 + 1.5));
  NE.orbit(ctx, cx, cy, 340, ring, t, NE.TEAL, 0.9);
  NE.orbit(ctx, cx, cy, 300, easeInOut(prog(t, t0 + 0.5, t0 + 1.9)), -t, NE.GOLD, 0.35, { ticks: 0, w: 2, dash: [4, 14] });
  [['bowl', 200], ['coat', 340], ['house', 270]].forEach(([k, deg], i) => { const an = (deg * Math.PI / 180) + t * 0.12, x = cx + Math.cos(an) * 340, y = cy + Math.sin(an) * 340, p = prog(t, t0 + 1.0 + i * 0.25, t0 + 1.8 + i * 0.25);
    if (p > 0) { ctx.save(); ctx.fillStyle = `rgba(4,14,20,${0.9 * smooth(p)})`; ctx.beginPath(); ctx.arc(x, y, 62, 0, 6.2832); ctx.fill(); ctx.restore(); NE.line(ctx, NE.arcPts(x, y, 62, 0, Math.PI * 2, 40), p, NE.TEAL, 2, 0.8, { head: false }); NE.icon(ctx, k, x, y, 0.38, p, NE.GOLD, 1, t, 3); } });
  const R = NE.wire(ctx, c => ES.hero(c, cx - 60, 1300, 1.02, { umbrella: false, cake: false, book: false, rs: -0.55, re: -0.85, eyes: 'happy', mouth: 'smile' }), { c: NE.TEAL, w: 3, p: prog(t, t0, t0 + 1.3) });
  if (R) { const p = prog(t, t0 + 0.9, t0 + 1.5); NE.icon(ctx, 'mug', R.hand[0] + 6, R.hand[1] + 10, 0.42, p, NE.GOLD, 1, t, 4); if (p >= 1) NE.icon(ctx, 'steam', R.hand[0] + 6, R.hand[1] + 10, 0.42, 1, NE.GOLD, 0.8 * smooth(prog(t, t0 + 1.5, t0 + 2.0)), t, 3); S.add(ctx, () => glow(ctx, R.hand[0], R.hand[1], 220, NE.GOLD, 0.18 * p)); }
}
function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  const push = easeIn(prog(t, T.end - 1.9, T.end - 0.1));
  ctx.fillStyle = 'rgb(10,12,28)'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  const F = FAC(), TW = [FX + 30 + MYW[0] * F.uw + F.uw / 2, FY + 20 + MYW[1] * F.uh + F.uh * 0.43];
  if (push > 0) { const wp = S.w2s(C, TW[0], TW[1], 0.6), z = 1 + 11 * push * push; ctx.translate(lerp(wp[0], 540, push), lerp(wp[1], 900, push)); ctx.scale(z, z); ctx.translate(-wp[0], -wp[1]); }
  const ad = smooth(prog(t, T.a02 + 0.1, T.a02 + 1.4)), myWin = smooth(prog(t, T.a04e - 0.2, T.a04e + 0.8));
  scene(ctx, t, C, { ad, myWin });
  ctx.save(); S.cam(ctx, C, 1);
  // ---- 她 ----
  const warm = smooth(prog(t, M.give[1] - 0.1, M.give[1] + 1.6)), leave = prog(t, M.leave[0], M.leave[1]), lv = easeIn(leave);
  const shiver = (1 - warm) * Math.sin(t * 30) * 0.01, hx = HERX - lv * 760, hb = leave > 0 && leave < 1 ? Math.abs(Math.sin(leave * Math.PI * 6)) * 8 : 0;
  const HP = MB.person(ctx, 'istj-female', hx, GY, 2.15, { a: 0 }); // 只取坐标
  const her = { chest: HP.chest, neck: [hx + 4, HP.head[1] + 140], hand: [hx + 36, HP.chest[1] + 60] };
  if (leave < 1) S.lit(ctx, c => MB.person(c, 'istj-female', hx, GY, 2.15, { lean: shiver, bob: hb, gray: 0.5 * (1 - warm), warm: 0.5 * warm }), { light: warm > 0.4 ? [HIMX, 800] : [480, 480], at: [hx, GY - 280], r: 330, warm: warm > 0.4 ? [255, 214, 160] : COOL, cool: [10, 12, 40], k: 1.0 });
  if (warm < 0.95 && leave <= 0) for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k * 0.5) % 1; S.rgrad(ctx, hx + 50 + ph * 50, her.neck[1] - 80 - ph * 40, 22 + ph * 40, [[0, [236, 240, 250], 0.32 * (1 - ph) * (1 - warm)], [1, [236, 240, 250], 0]]); }
  // ---- 他 ----
  const walkIn = easeOut(prog(t, M.walk[0], M.walk[1])), give = easeInOut(prog(t, M.give[0], M.give[1])), gback = smooth(prog(t, M.give[1] + 0.2, M.give[1] + 0.8));
  const scIn = prog(t, M.scIn[0], M.scIn[1]), scFly = prog(t, M.scFly[0], M.scFly[1]), lbIn = prog(t, M.lbIn[0], M.lbIn[1]), lbFly = prog(t, M.lbFly[0], M.lbFly[1]);
  const umbG = easeInOut(prog(t, M.umb[0], M.umb[1])), wet = smooth(prog(t, M.umb[1], M.umb[1] + 2));
  const mx = lerp(1320, HIMX, walkIn), step = walkIn < 1 ? Math.abs(Math.sin(walkIn * Math.PI * 5)) * 10 : 0;
  // 手的姿势：递杯子（向前伸）→ 收回 → 伸进包（向下）→ 甩出围巾（上扬）→ 再进包 → 递便当（向前）→ 递伞
  const dig = Math.max(K.vis(t, M.scIn[0], M.scIn[1] + 0.05, 0.15, 0.15), K.vis(t, M.lbIn[0], M.lbIn[1] + 0.05, 0.15, 0.15));
  const throwA = Math.sin(clamp(scFly) * Math.PI), reachLb = Math.sin(clamp(lbFly) * Math.PI * 0.5) * (1 - smooth(prog(t, M.lbFly[1], M.lbFly[1] + 0.4)));
  const reach = Math.max(give * (1 - gback), reachLb, Math.sin(umbG * Math.PI));
  const o = { t, flip: true, umbrella: umbG < 0.5, cake: false, book: false, um: -0.2 + 0.25 * umbG, rs: -1.15 * reach + 0.6 * dig - 1.9 * throwA, re: -0.35 * reach + 0.3 * dig - 0.4 * throwA, eyes: walkIn < 1 ? 'open' : 'happy', mouth: wet > 0.5 ? 'grin' : 'smile', lean: -0.05 * reach, bob: step, warm: 0.3, gray: 0.15 * wet };
  const R = S.lit(ctx, c => ES.hero(c, mx, GY, 0.92, o), { light: LAMP, at: [mx, GY - 300], r: 330, warm: [255, 214, 160], cool: [20, 20, 50], k: 0.95 });
  // 帆布包：挎在身前（在他身上，不会凭空出现）
  const bagP = [R.chest[0] - 20, R.chest[1] + 120];
  canvasBag(ctx, bagP[0], bagP[1], 0.72, t);
  // 杯子：一开始就捧在手里 → 沿弧线到她手里
  if (walkIn > 0.02 && leave < 0.6) { const e = give, cx = lerp(R.hand[0], her.hand[0], e), cy = lerp(R.hand[1] + 36, her.hand[1], e) - Math.sin(e * Math.PI) * 60; PR.mug(ctx, cx, cy, 0.64, t, { c: [240, 130, 96], hot: 1 }); if (warm > 0.01) S.add(ctx, () => glow(ctx, her.hand[0], her.hand[1] - 60, 300, [255, 180, 110], 0.18 * Math.sin(warm * Math.PI))); }
  // 围巾：从包里抽出来（被包口遮住下半截）→ 甩开飞过去 → 落在她脖子上
  if (scIn > 0 && scFly < 1) {
    if (scFly <= 0) { const up = easeOut(scIn); ctx.save(); ctx.beginPath(); ctx.rect(bagP[0] - 200, bagP[1] - 400, 400, 400 - 50); ctx.clip(); ctx.fillStyle = 'rgb(214,72,70)'; ctx.beginPath(); ctx.roundRect(bagP[0] - 18, bagP[1] - 50 - up * 110, 36, 150, 16); ctx.fill(); ctx.restore(); }
    else flyingScarf(ctx, t, [bagP[0], bagP[1] - 160], her.neck, easeInOut(scFly));
  }
  if (scFly >= 1 && leave < 1) neckScarf(ctx, her.neck[0], her.neck[1], 1, t, smooth(prog(t, M.scFly[1] - 0.1, M.scFly[1] + 0.45)));
  // 便当盒：从包里捧出来 → 弧线递进她怀里（盒子先微微倾斜、落定回正）
  if (lbIn > 0) {
    const inBag = lbFly <= 0, e = easeInOut(lbFly);
    const x0 = bagP[0], y0 = bagP[1] - 60 - easeOut(lbIn) * 100, take = easeInOut(prog(t, M.leave[0] - 0.4, M.leave[0] + 0.2)), x1 = lerp(560, hx + 50, take), y1 = lerp(1040, her.chest[1] + 150, take);
    const lx = inBag ? x0 : lerp(R.hand[0] - 10, x1, e) + (take > 0 ? 0 : 0), ly = inBag ? y0 : lerp(R.hand[1] + 30, y1, e) - Math.sin(e * Math.PI) * 90;
    if (leave < 1) { ctx.save(); if (inBag) { ctx.beginPath(); ctx.rect(x0 - 300, y0 - 300, 600, bagP[1] - 70 - (y0 - 300)); ctx.clip(); } PR.lunchbox(ctx, lx, ly, 0.5, { lid: 1, c: [96, 180, 170], rot: Math.sin(e * Math.PI) * -0.3 }); if (!inBag && e >= 1 && take <= 0) S.add(ctx, () => PR.steam(ctx, lx, ly - 40, 0.6, t, 0.5, 2)); ctx.restore(); }
  }
  // 伞：从他手里 → 到她头顶；她撑着走
  if (umbG >= 0.5 && leave < 1) { const e = smooth(prog(umbG, 0.5, 1)), ux = lerp(R.umb[0], hx + 40, e), uy = lerp(R.umb[1] + 60, GY - 640, e) - hb; umbrella(ctx, ux, uy, 0.95, lerp(-0.3, -0.08, e)); }
  ctx.restore();
  S.rain(ctx, t, { a: 0.85, n: 120 });
  ctx.restore();
  const nA = K.vis(t, T.a02 - 0.15, T.a03 - 0.05, 0.4, 0.4);
  if (nA > 0.003) S.group(ctx, nA, c => NE.batch(c, () => neonTitle(c, t)));
  return { C };
}
// 帆布包（米色，包口露出一截保温杯盖、一角布）
function canvasBag(ctx, x, y, s, t) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate(Math.sin(t * 2) * 0.02);
  ctx.strokeStyle = 'rgb(150,120,90)'; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(-60, -70); ctx.quadraticCurveTo(-20, -260, 70, -300); ctx.stroke();
  ctx.fillStyle = 'rgb(120,170,160)'; ctx.beginPath(); ctx.roundRect(-36, -92, 30, 40, 6); ctx.fill();
  const g = ctx.createLinearGradient(-90, 0, 90, 0); g.addColorStop(0, 'rgb(170,150,120)'); g.addColorStop(0.6, 'rgb(226,206,170)'); g.addColorStop(1, 'rgb(150,126,100)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-86, -70); ctx.lineTo(86, -70); ctx.lineTo(96, 80); ctx.quadraticCurveTo(0, 96, -96, 80); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(80,60,40,0.25)'; ctx.fillRect(-86, -70, 172, 12);
  ctx.fillStyle = 'rgb(214,72,70)'; ctx.beginPath(); ctx.arc(40, 20, 16, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(255,240,220)'; ctx.beginPath(); ctx.arc(40, 20, 7, 0, 6.2832); ctx.fill();
  ctx.restore();
}
function over(ctx, t) {
  // A02：画面上方金箔大字（逐字升起 + 扫光），压一条柔和的暗底让字立得住
  const a = K.vis(t, T.a02 + 0.05, T.a03 - 0.05, 0.3, 0.4);
  if (a > 0.003) {
    TY.foil(ctx, 'ESFJ', W / 2, 300, { size: 190, family: 'Latin', weight: 600, spacing: 0.16, p: prog(t, T.a02 + 0.15, T.a02 + 1.1), sweep: prog(t, T.a02 + 1.3, T.a02 + 2.3), a });
    TY.foil(ctx, '供给者', W / 2, 466, { size: 112, spacing: 0.42, p: prog(t, T.a02 + 0.6, T.a02 + 1.5), sweep: prog(t, T.a02 + 1.6, T.a02 + 2.6), a, glowA: 0.4 });
    NE.tags(ctx, [['E', '外向'], ['S', '实感'], ['F', '情感'], ['J', '判断']], 570, prog(t, T.a02 + 1.1, T.a02 + 2.0), NE.TEAL, a);
  }
  QT.draw(ctx, t, { y: 230 });
}
// 第 6 章用：对面楼此刻亮着（被 city 点亮）的窗，在屏幕上的位置
function cityWins(C, city) {
  const F = FAC(), out = [];
  for (const u of F.units) { if (u.on || (u.i === MYW[0] && u.j === MYW[1])) continue; const on = smooth(prog(city, hash(u.i * 3 + u.j * 7) * 0.7, hash(u.i * 3 + u.j * 7) * 0.7 + 0.3)); if (on > 0.05) out.push([...S.w2s(C, FX + 30 + u.i * F.uw + F.uw / 2, FY + 20 + u.j * F.uh + F.uh * 0.43, 0.6), on]); }
  return out;
}
module.exports = { cityWins, draw, over, T, scene, umbrella, neckScarf, flyingScarf, canvasBag, GY, LAMP };
