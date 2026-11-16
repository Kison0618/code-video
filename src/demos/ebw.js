'use strict';
// 《ESFJ》v6 公共世界：剖面居民楼「幸福里3栋」（像娃娃屋，前墙拿掉）。所有 EB* 场景共用，保证全片是一个世界。
// 世界坐标（像素，z=1）：地面 y=0，往上为负。每层高 FH=600；每层 L 户 [0,640]、中间楼梯间 [640,900]、R 户 [900,1540]。
//   层号 k：0=地面层 G，1..4=1F..4F；第 k 层地板 y=-k*FH，天花板 y=-(k+1)*FH。屋顶 y=-5*FH，招牌在屋顶上。
//   住户：4L INTP 书房 | 4R 小两口 | 3L ISFJ | 3R 主角 ESFJ 家 | 2L ISTJ | 2R ESTJ | 1L 王奶奶 | 1R 有小孩一家 | GL 社区活动室 | GR 小卖部+候诊
// 用法（场景里）：
//   const B = require('./ebw');
//   const cam = B.camAt(...) 或 X.cam(z, fx, fy, 540, sy)；
//   B.world(ctx, t, cam, st)  画天空+城市+整栋楼（st 可覆盖灯/门/天色），之后 ctx 已复位到屏幕坐标；
//   B.inCam(ctx, cam, () => { 在世界坐标里画人和道具 })；
//   B.hud(ctx, t)  右上角时钟（总装统一画，场景不用画）
//   B.U('3R') → { x0, x1, top, floor, cx, w, h, k }；B.door('3R') → { x, y(地面), w, h }
//   B.stair(kFrom, u) → 楼梯第 kFrom 层往下一层那一段上 u∈[0,1] 的脚底点
//   B.hour(t) → 全片统一的钟点（小时，含小数）；天色、窗外、默认开灯都按它
const { FontLibrary } = require('skia-canvas');
const EQF = require('path').join(__dirname, '..', '..', 'fonts', 'SourceHanSerifSC-Heavy.ttf'); // 云端仓库里的字体
FontLibrary.use('EQHeavy', [require('fs').existsSync(EQF) ? EQF : 'C:/Windows/Fonts/Source Han Serif SC Heavy (TrueType).ttf']);
const X = require('./ehk');
const MB = require('./mb');
const EF = require('./esf');
const { K } = X;
const { W, H, clamp, lerp, mix, prog, smooth, easeInOut, easeOut, hash, glow, rgba } = K;

const FH = 600, UW = 640, SW = 260, BW = UW * 2 + SW, NF = 5, SLAB = 30;
const ROOF = -NF * FH;
const UNITS = {};
for (let k = 0; k < NF; k++) for (const s of ['L', 'R']) {
  const id = (k === 0 ? 'G' : String(k)) + s, x0 = s === 'L' ? 0 : UW + SW;
  UNITS[id] = { id, k, side: s, x0, x1: x0 + UW, top: -(k + 1) * FH + SLAB, floor: -k * FH, cx: x0 + UW / 2, w: UW, h: FH - SLAB };
}
const U = id => UNITS[id];
// 楼梯间两扇门（面朝镜头）：L 户门靠左、R 户门靠右
const door = id => { const u = U(id); return { x: u.side === 'L' ? UW + 62 : UW + SW - 62, y: u.floor, w: 96, h: 214 }; };
// 楼梯：第 k 层往下到 k-1 层的一段；奇数层从右上往左下，偶数层从左上往右下
function stair(k, u) {
  const xa = k % 2 ? UW + SW - 30 : UW + 30, xb = k % 2 ? UW + 30 : UW + SW - 30;
  return [lerp(xa, xb, u), lerp(-k * FH, -(k - 1) * FH, u)];
}

// ---------- 全片统一的钟点 ----------
// 关键帧：[秒, 小时]。章节之间的停顿里时钟快转。估算时间轴和正式配音都按句子 id 取，不写死秒数。
// v7 换了台词表，旧 id 缺失的关键帧直接丢掉（只剩开场 EB1 用得到）
const HAS = id => !!X.VT[id];
const vs = id => (HAS(id) ? X.vs(id) : NaN), ve = id => (HAS(id) ? X.ve(id) : NaN), at = (id, w) => (HAS(id) ? X.at(id, w) : NaN);
const HK = () => HK0().filter(k => isFinite(k[0])).sort((a, b) => a[0] - b[0]).filter((k, i, A) => !i || k[1] >= A[i - 1][1]);
const HK0 = () => [
  [0, 6.4], [ve('A03') + 1.0, 6.7], [vs('B01'), 7.3], [ve('B05'), 8.3], [ve('B10') + 0.4, 8.6], [vs('C01') - 0.3, 10.0],
  [ve('C02'), 10.5], [vs('C05'), 11.5], [vs('C08'), 15.5], [vs('C10'), 16.0], [at('C10', '被大家') - 0.6, 16.1], [at('C10', '被大家') - 0.1, 19.1],
  [ve('C11'), 19.6], [ve('C12') + 0.2, 21.4], [vs('E01') - 0.2, 24 + 8.5], [vs('E03'), 24 + 12.0], [vs('E04'), 24 + 17.5], [ve('E06'), 24 + 18.0],
  [vs('F01') - 0.2, 24 + 18.6], [vs('F05'), 24 + 20.0], [at('F05', 'ISTP爱'), 24 + 22.6], [ve('F06'), 24 + 23.0], [vs('G01') - 0.2, 24 + 23.5], [X.VJ.end + 10, 24 + 23.9]];
let HKC = null;
function hour(t) {
  const k = HKC || (HKC = HK());
  if (t <= k[0][0]) return k[0][1];
  for (let i = 1; i < k.length; i++) if (t <= k[i][0]) return lerp(k[i - 1][1], k[i][1], easeInOut(prog(t, k[i - 1][0], k[i][0])));
  return k[k.length - 1][1];
}
// 天色：按钟点（24 小时制，取模）
const SKY = [
  [0, [10, 12, 30], [22, 22, 48]], [5.2, [14, 16, 40], [40, 32, 66]], [6.3, [44, 52, 104], [214, 132, 132]], [7.4, [96, 150, 206], [238, 196, 168]],
  [10, [112, 170, 222], [196, 222, 236]], [16, [104, 156, 214], [214, 220, 222]], [17.8, [74, 82, 150], [246, 152, 96]], [19, [30, 30, 72], [104, 64, 110]],
  [20.5, [12, 14, 36], [28, 26, 58]], [24, [10, 12, 30], [22, 22, 48]]];
function skyCols(h) {
  h = ((h % 24) + 24) % 24;
  for (let i = 1; i < SKY.length; i++) if (h <= SKY[i][0]) { const u = smooth(prog(h, SKY[i - 1][0], SKY[i][0])); return [mix(SKY[i - 1][1], SKY[i][1], u), mix(SKY[i - 1][2], SKY[i][2], u)]; }
  return [SKY[0][1], SKY[0][2]];
}
// 白天程度 0..1（室内墙面亮度、窗光、默认开灯）
const dayness = h => { h = ((h % 24) + 24) % 24; return smooth(prog(h, 6.0, 8.0)) * (1 - smooth(prog(h, 17.4, 19.4))); };

// ---------- 小工具 ----------
function inCam(ctx, c, fn) { ctx.save(); X.applyCam(ctx, c); fn(); ctx.restore(); }
function rect(ctx, x, y, w, h, c, a = 1) { ctx.fillStyle = rgba(c, a); ctx.fillRect(x, y, w, h); }
function rrect(ctx, x, y, w, h, r, c, a = 1) { ctx.fillStyle = rgba(c, a); ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); }
function vgrad(ctx, x, y, w, h, c0, c1, a = 1) { const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, rgba(c0, a)); g.addColorStop(1, rgba(c1, a)); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); }
const dark = (c, k) => mix(c, [6, 8, 18], k);

// ---------- 天空和远处城市 ----------
function sky(ctx, h) {
  const [c0, c1] = skyCols(h), g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgba(c0)); g.addColorStop(1, rgba(c1)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const night = 1 - smooth(prog(((h % 24) + 24) % 24, 5.0, 7.0)) * (1 - smooth(prog(((h % 24) + 24) % 24, 18.6, 20.4)));
  if (night > 0.02) for (let i = 0; i < 90; i++) { const x = hash(i * 3.1) * W, y = hash(i * 7.7) * H * 0.55, r = 1 + hash(i) * 1.8; ctx.fillStyle = rgba([255, 250, 230], night * (0.35 + 0.5 * hash(i * 1.3))); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); }
}
// 远处楼群（世界坐标，跟镜头有视差）。blueEvery>0 时每 N 扇窗亮一扇蓝窗（B10），blueA 控制亮度
const CITY = [];
for (let i = 0; i < 46; i++) {
  const side = i % 2 ? 1 : -1, n = Math.floor(i / 2);
  const w = 260 + hash(i * 5.3) * 300, h = 900 + hash(i * 2.9) * 2600, gap = 60 + hash(i * 1.7) * 120;
  CITY.push({ x: side > 0 ? BW + 160 + n * 420 + hash(i * 9) * 140 : -160 - w - n * 420 - hash(i * 4) * 140, w, h, gap, seed: i * 13.7, depth: 0.45 + 0.4 * hash(i * 3.3) });
}
function city(ctx, c, h, o = {}) {
  const { blueEvery = 0, blueA = 0, lit = null } = o, d = dayness(h);
  const litA = lit == null ? 1 - d * 0.85 : lit;
  for (const b of CITY) {
    const px = c.fx * (1 - b.depth), bx = b.x * b.depth + px, py = c.fy * (1 - b.depth);
    ctx.save(); X.applyCam(ctx, c); ctx.translate(px * 0 , 0);
    const x0 = b.x + (c.fx - BW / 2) * (1 - b.depth), y0 = -b.h + (c.fy + 1500) * (1 - b.depth) * 0.25;
    const body = mix(dark(skyCols(h)[0], 0.55), [40, 46, 70], 0.3);
    rect(ctx, x0, y0, b.w, b.h + 2000, mix(body, [150, 160, 180], d * 0.35));
    const cols = Math.max(2, Math.floor(b.w / 64)), rows = Math.floor(b.h / 90);
    for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
      const id = Math.floor(b.seed * 100) + r * 31 + q * 7, hv = hash(id * 0.37);
      const wx = x0 + 22 + q * (b.w - 44) / cols, wy = y0 + 40 + r * 90, ww = (b.w - 44) / cols - 18, wh = 46;
      const blue = blueEvery > 0 && id % blueEvery === 0;
      let col = [255, 214, 150], a = hv < 0.55 ? litA * (0.35 + 0.4 * hash(id)) : 0.06;
      if (blue) { col = [110, 196, 255]; a = Math.max(a, blueA); }
      rect(ctx, wx, wy, ww, wh, mix([30, 34, 50], col, Math.min(1, a + d * 0.2)), 0.9);
      if (blue && blueA > 0.05) glow(ctx, wx + ww / 2, wy + wh / 2, 70, [120, 200, 255], blueA * 0.5);
    }
    ctx.restore();
  }
}

// ---------- 家具（每户不一样） ----------
function lampAt(u) { return [u.cx + (u.side === 'L' ? -40 : 40), u.top + 10]; }
function pendant(ctx, x, y, on, warm = [255, 210, 140], len = 110) {
  ctx.strokeStyle = 'rgba(30,26,24,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + len); ctx.stroke();
  ctx.fillStyle = rgba(mix([60, 56, 52], warm, on * 0.6)); ctx.beginPath(); ctx.moveTo(x - 46, y + len + 34); ctx.lineTo(x - 18, y + len); ctx.lineTo(x + 18, y + len); ctx.lineTo(x + 46, y + len + 34); ctx.closePath(); ctx.fill();
  if (on > 0.01) { ctx.fillStyle = rgba(mix([255, 255, 255], warm, 0.3), on); ctx.beginPath(); ctx.ellipse(x, y + len + 34, 30, 9, 0, 0, 7); ctx.fill(); }
}
// 室内光：灯锥 + 地面光斑
function lampLight(ctx, u, on, warm) {
  if (on <= 0.01) return;
  const [lx, ly] = lampAt(u), y0 = ly + 144, yF = u.floor;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createLinearGradient(0, y0, 0, yF); g.addColorStop(0, rgba(warm, 0.34 * on)); g.addColorStop(1, rgba(warm, 0.05 * on));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx - 40, y0); ctx.lineTo(lx + 40, y0); ctx.lineTo(lx + 250, yF); ctx.lineTo(lx - 250, yF); ctx.closePath(); ctx.fill();
  glow(ctx, lx, y0, 220, warm, 0.45 * on);
  ctx.fillStyle = rgba(warm, 0.22 * on); ctx.beginPath(); ctx.ellipse(lx, yF - 6, 260, 26, 0, 0, 7); ctx.fill();
  ctx.restore();
}
function windowPane(ctx, x, y, w, h, hr, o = {}) {
  const { curtain = 0.15, frame = [70, 58, 48] } = o, [c0, c1] = skyCols(hr);
  rect(ctx, x - 12, y - 12, w + 24, h + 24, frame);
  vgrad(ctx, x, y, w, h, c0, c1);
  const night = 1 - dayness(hr);
  if (night > 0.3) { ctx.fillStyle = rgba([250, 246, 220], 0.9 * night); ctx.beginPath(); ctx.arc(x + w * 0.72, y + h * 0.3, 14, 0, 7); ctx.fill(); }
  for (let i = 0; i < 5; i++) rect(ctx, x + i * w / 5 + 4, y + h * (0.55 + 0.25 * hash(i + x)), w / 5 - 8, h, mix([30, 34, 56], c0, 0.25), 0.85);
  rect(ctx, x + w / 2 - 4, y, 8, h, frame); rect(ctx, x, y + h / 2 - 4, w, 8, frame);
  const cw = w * 0.5 * curtain;
  vgrad(ctx, x - 16, y - 20, cw + 16, h + 40, [196, 92, 84], [130, 56, 56]); vgrad(ctx, x + w - cw, y - 20, cw + 16, h + 40, [196, 92, 84], [130, 56, 56]);
}
function frameOnWall(ctx, x, y, w, h, c, a = 1) { rect(ctx, x - 6, y - 6, w + 12, h + 12, [90, 70, 50], a); rect(ctx, x, y, w, h, c, a); }

const FURN = {
  '3R'(ctx, u, hr, st) { // 主角家：厨房灶台、冰箱、餐桌四把椅子、照片墙、日历、窗
    const f = u.floor, x0 = u.x0;
    windowPane(ctx, x0 + 380, u.top + 120, 200, 170, hr, { curtain: st.curtain3R == null ? 0.25 : st.curtain3R });
    for (let i = 0; i < 3; i++) frameOnWall(ctx, x0 + 60 + i * 74, u.top + 110 + (i % 2) * 24, 58, 70, [[212, 180, 130], [196, 170, 136], [220, 196, 150]][i]);
    rect(ctx, x0 + 262, u.top + 120, 84, 96, [244, 240, 230]); rect(ctx, x0 + 262, u.top + 120, 84, 22, [214, 82, 72]);
    for (let r = 0; r < 3; r++) for (let q = 0; q < 4; q++) rect(ctx, x0 + 270 + q * 19, u.top + 150 + r * 20, 13, 13, [200, 196, 186]);
    rect(ctx, x0 + 40, f - 196, 210, 196, [214, 206, 192]); rect(ctx, x0 + 40, f - 206, 210, 14, [120, 112, 104]);
    rect(ctx, x0 + 60, f - 236, 90, 30, [70, 72, 78]); rrect(ctx, x0 + 170, f - 246, 52, 40, 8, [196, 70, 60]);
    rrect(ctx, x0 + 560, f - 300, 70, 300, 10, [226, 232, 236]); rect(ctx, x0 + 564, f - 200, 62, 4, [180, 186, 190]);
    rect(ctx, x0 + 300, f - 130, 230, 18, [150, 104, 70]); rect(ctx, x0 + 316, f - 112, 14, 112, [120, 84, 58]); rect(ctx, x0 + 500, f - 112, 14, 112, [120, 84, 58]);
  },
  '3L'(ctx, u, hr) { // ISFJ：整齐的小厨房、毛线筐、绿植
    const f = u.floor, x0 = u.x0;
    windowPane(ctx, x0 + 90, u.top + 120, 180, 160, hr, { curtain: 0.5, frame: [86, 96, 80] });
    rect(ctx, x0 + 330, f - 180, 260, 180, [190, 206, 196]); for (let i = 0; i < 4; i++) rect(ctx, x0 + 340 + i * 64, f - 170, 52, 70, [170, 188, 178]);
    rrect(ctx, x0 + 380, u.top + 130, 180, 20, 4, [140, 110, 80]); for (let i = 0; i < 5; i++) rrect(ctx, x0 + 390 + i * 34, u.top + 96, 24, 34, 6, [[220, 150, 120], [130, 170, 200], [230, 210, 140], [170, 200, 150], [210, 170, 200]][i]);
    rrect(ctx, x0 + 60, f - 70, 90, 70, 12, [176, 130, 86]); for (let i = 0; i < 3; i++) { ctx.fillStyle = rgba([[220, 90, 90], [120, 170, 220], [240, 200, 110]][i]); ctx.beginPath(); ctx.arc(x0 + 82 + i * 24, f - 74, 16, 0, 7); ctx.fill(); }
  },
  '4L'(ctx, u, hr) { // INTP：满墙书、黑板几何、书桌台灯
    const f = u.floor, x0 = u.x0;
    for (let r = 0; r < 4; r++) { rect(ctx, x0 + 30, u.top + 90 + r * 100, 220, 10, [110, 80, 56]); for (let i = 0; i < 9; i++) rect(ctx, x0 + 36 + i * 23, u.top + 34 + r * 100 + (i % 3) * 6, 18, 56 - (i % 3) * 6, [[150, 80, 70], [70, 100, 140], [200, 170, 90], [90, 130, 100]][(i + r) % 4]); }
    rect(ctx, x0 + 300, u.top + 90, 300, 190, [36, 60, 52]); ctx.strokeStyle = 'rgba(236,240,230,0.75)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x0 + 380, u.top + 180, 50, 0, 7); ctx.moveTo(x0 + 450, u.top + 230); ctx.lineTo(x0 + 520, u.top + 130); ctx.lineTo(x0 + 580, u.top + 230); ctx.closePath(); ctx.stroke();
    rect(ctx, x0 + 330, f - 120, 240, 16, [120, 90, 64]); rect(ctx, x0 + 345, f - 104, 12, 104, [96, 72, 52]); rect(ctx, x0 + 545, f - 104, 12, 104, [96, 72, 52]);
  },
  '4R'(ctx, u, hr) { // 小两口：沙发、落地灯、植物
    const f = u.floor, x0 = u.x0;
    windowPane(ctx, x0 + 230, u.top + 110, 220, 170, hr, { curtain: 0.3, frame: [60, 60, 70] });
    rrect(ctx, x0 + 150, f - 150, 330, 110, 26, [96, 136, 170]); rrect(ctx, x0 + 130, f - 120, 60, 120, 20, [80, 118, 150]); rrect(ctx, x0 + 440, f - 120, 60, 120, 20, [80, 118, 150]);
    rect(ctx, x0 + 560, f - 200, 30, 200, [140, 100, 70]); ctx.fillStyle = rgba([90, 150, 96]); ctx.beginPath(); ctx.ellipse(x0 + 575, f - 230, 50, 70, 0, 0, 7); ctx.fill();
  },
  '2L'(ctx, u, hr) { // ISTJ：档案柜、格子日历、挂钟
    const f = u.floor, x0 = u.x0;
    for (let i = 0; i < 3; i++) { rect(ctx, x0 + 40 + i * 92, f - 260, 84, 260, [150, 156, 162]); for (let r = 0; r < 4; r++) rect(ctx, x0 + 50 + i * 92, f - 250 + r * 62, 64, 50, [176, 182, 188]); }
    rect(ctx, x0 + 360, u.top + 100, 220, 170, [240, 238, 232]); for (let r = 0; r < 5; r++) for (let q = 0; q < 7; q++) rect(ctx, x0 + 370 + q * 30, u.top + 120 + r * 28, 24, 22, (r * 7 + q) % 5 ? [210, 212, 214] : [120, 150, 200]);
    X.clock(ctx, x0 + 470, u.top + 330, 34, 600);
  },
  '2R'(ctx, u, hr) { // ESTJ：白板清单、办公桌
    const f = u.floor, x0 = u.x0;
    rect(ctx, x0 + 80, u.top + 90, 300, 200, [240, 242, 244]); rect(ctx, x0 + 76, u.top + 86, 308, 6, [150, 150, 150]);
    for (let i = 0; i < 4; i++) { rect(ctx, x0 + 140, u.top + 120 + i * 42, 200, 8, [70, 90, 140]); ctx.strokeStyle = rgba([60, 160, 90]); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0 + 100, u.top + 122 + i * 42); ctx.lineTo(x0 + 110, u.top + 132 + i * 42); ctx.lineTo(x0 + 126, u.top + 110 + i * 42); ctx.stroke(); }
    windowPane(ctx, x0 + 430, u.top + 110, 160, 160, hr, { curtain: 0, frame: [70, 76, 86] });
    rect(ctx, x0 + 120, f - 120, 300, 18, [90, 80, 74]); rect(ctx, x0 + 140, f - 102, 260, 102, [110, 100, 92]);
  },
  '1L'(ctx, u, hr) { // 王奶奶：摇椅、收音机、老相框、绿萝
    const f = u.floor, x0 = u.x0;
    windowPane(ctx, x0 + 80, u.top + 120, 190, 160, hr, { curtain: 0.4, frame: [96, 76, 56] });
    frameOnWall(ctx, x0 + 330, u.top + 120, 110, 80, [190, 170, 130]);
    rrect(ctx, x0 + 360, f - 180, 150, 120, 30, [150, 96, 76]); rect(ctx, x0 + 350, f - 70, 170, 20, [120, 76, 60]);
    rrect(ctx, x0 + 540, f - 120, 70, 50, 8, [120, 90, 70]); rect(ctx, x0 + 560, f - 70, 30, 70, [90, 70, 56]);
  },
  '1R'(ctx, u, hr) { // 有小孩一家：小桌、积木、身高贴纸
    const f = u.floor, x0 = u.x0;
    windowPane(ctx, x0 + 340, u.top + 120, 200, 160, hr, { curtain: 0.3, frame: [80, 90, 110] });
    rect(ctx, x0 + 90, u.top + 110, 26, 300, [250, 220, 140]); for (let i = 0; i < 6; i++) rect(ctx, x0 + 116, u.top + 130 + i * 48, 16, 4, [120, 90, 50]);
    for (let i = 0; i < 6; i++) rect(ctx, x0 + 220 + (i % 3) * 36, f - 36 - Math.floor(i / 3) * 36, 32, 32, [[230, 90, 80], [90, 160, 220], [240, 200, 80]][i % 3]);
    rect(ctx, x0 + 420, f - 90, 160, 14, [200, 160, 110]); rect(ctx, x0 + 432, f - 76, 10, 76, [170, 130, 90]); rect(ctx, x0 + 558, f - 76, 10, 76, [170, 130, 90]);
  },
  'GL'(ctx, u, hr, st) { // 社区活动室：公告栏、电视、长桌折叠椅、彩旗
    const f = u.floor, x0 = u.x0;
    rect(ctx, x0 + 50, u.top + 110, 260, 190, [176, 130, 86]); rect(ctx, x0 + 58, u.top + 118, 244, 174, [196, 152, 104]);
    rrect(ctx, x0 + 380, u.top + 110, 220, 140, 8, [24, 24, 30]); rect(ctx, x0 + 390, u.top + 120, 200, 120, st.tvOn ? mix([40, 50, 70], [210, 230, 255], st.tvOn) : [30, 34, 44]);
    for (let i = 0; i < 9; i++) { ctx.fillStyle = rgba([[230, 90, 80], [90, 170, 220], [250, 200, 90]][i % 3]); ctx.beginPath(); ctx.moveTo(x0 + 30 + i * 66, u.top + 40); ctx.lineTo(x0 + 96 + i * 66, u.top + 40); ctx.lineTo(x0 + 63 + i * 66, u.top + 84); ctx.closePath(); ctx.fill(); }
    rect(ctx, x0 + 80, f - 110, 480, 16, [200, 196, 186]); rect(ctx, x0 + 100, f - 94, 10, 94, [150, 150, 150]); rect(ctx, x0 + 530, f - 94, 10, 94, [150, 150, 150]);
  },
  'GR'(ctx, u, hr) { // 小卖部 + 候诊长椅
    const f = u.floor, x0 = u.x0;
    for (let r = 0; r < 3; r++) { rect(ctx, x0 + 330, u.top + 120 + r * 90, 280, 10, [130, 100, 70]); for (let i = 0; i < 9; i++) rrect(ctx, x0 + 338 + i * 30, u.top + 76 + r * 90, 24, 44, 4, [[220, 80, 70], [250, 200, 80], [90, 170, 120], [100, 150, 220]][(i + r) % 4]); }
    rect(ctx, x0 + 320, f - 130, 300, 130, [176, 120, 80]); rect(ctx, x0 + 320, f - 140, 300, 14, [140, 90, 60]);
    rect(ctx, x0 + 40, f - 80, 240, 14, [90, 140, 170]); rect(ctx, x0 + 50, f - 66, 10, 66, [70, 100, 130]); rect(ctx, x0 + 260, f - 66, 10, 66, [70, 100, 130]);
    rrect(ctx, x0 + 80, u.top + 120, 150, 60, 8, [250, 250, 246]); X.text && null;
  },
};
const WALL = { '4L': [70, 84, 92], '4R': [176, 150, 170], '3L': [196, 214, 190], '3R': [236, 210, 170], '2L': [178, 184, 192], '2R': [190, 196, 210], '1L': [214, 190, 160], '1R': [196, 222, 236], 'GL': [226, 200, 150], 'GR': [214, 222, 206] };
const LAMPC = { '3R': [255, 206, 130], 'GL': [255, 220, 160], '4L': [230, 236, 255] };
// 默认开灯：天黑后开；白天也微开（室内）
function defaultLamp(id, hr) { const n = 1 - dayness(hr); return 0.03 + 0.85 * n; }

function unit(ctx, id, hr, st) {
  const u = U(id), lamp = st.lamps && st.lamps[id] != null ? st.lamps[id] : defaultLamp(id, hr);
  const d = dayness(hr), warm = LAMPC[id] || [255, 212, 150];
  const occ = st.occupied && st.occupied[id] === 0 ? 0 : 1;
  const lit = clamp(0.18 + 0.5 * d + 0.55 * lamp * occ, 0, 1.15), gray = st.grayUnit && st.grayUnit[id] || 0;
  const base = mix(WALL[id], [120, 124, 130], gray * 0.8);
  const wc = mix(dark(base, 0.86), mix(base, warm, lamp * 0.12), Math.min(1, lit));
  vgrad(ctx, u.x0, u.top, u.w, u.h, mix(wc, [0, 0, 0], 0.18), wc);
  ctx.save(); ctx.beginPath(); ctx.rect(u.x0, u.top, u.w, u.h); ctx.clip();
  ctx.globalAlpha = 0.25 + 0.75 * Math.min(1, lit);
  if (FURN[id]) FURN[id](ctx, u, hr, st);
  ctx.globalAlpha = 1;
  // 地板
  vgrad(ctx, u.x0, u.floor - 26, u.w, 26, mix([120, 86, 60], [20, 16, 14], 1 - lit), mix([90, 62, 44], [12, 10, 8], 1 - lit));
  // 暗部压一层（灯暗时屋里像傍晚没开灯）
  rect(ctx, u.x0, u.top, u.w, u.h, [8, 10, 22], clamp(0.62 - lit * 0.6, 0, 0.62));
  pendant(ctx, ...lampAt(u), lamp * occ, warm, id === 'GL' || id === 'GR' ? 60 : 110);
  lampLight(ctx, u, lamp * occ, warm);
  if (st.unitHook && st.unitHook[id]) st.unitHook[id](ctx, u, hr);
  ctx.restore();
}
// 楼梯间：后墙、两扇门、楼梯、壁灯
function stairwell(ctx, k, hr, st) {
  const x0 = UW, f = -k * FH, top = -(k + 1) * FH + SLAB, d = dayness(hr);
  vgrad(ctx, x0, top, SW, FH - SLAB, mix([30, 34, 44], [120, 124, 132], d * 0.6), mix([40, 44, 54], [140, 142, 148], d * 0.6));
  glow(ctx, x0 + SW / 2, top + 50, 120, [255, 220, 170], 0.35);
  rrect(ctx, x0 + SW / 2 - 16, top + 36, 32, 18, 6, [255, 236, 200]);
  for (const s of ['L', 'R']) {
    const id = (k === 0 ? 'G' : String(k)) + s, dd = door(id), op = st.doors && st.doors[id] || 0;
    const plate = st.plates && st.plates[id] != null ? st.plates[id] : '';
    X.door(ctx, dd.x, dd.y, dd.w, dd.h, 1, { plate, open: op, glowIn: op > 0 ? 1 : 0 });
  }
  if (k > 0) { // 往下一层的楼梯（在门前面）
    ctx.fillStyle = rgba(mix([96, 90, 92], [170, 164, 156], d * 0.5));
    const n = 12;
    for (let i = 0; i < n; i++) { const [sx, sy] = stair(k, i / n), [ex] = stair(k, (i + 1) / n); ctx.fillRect(Math.min(sx, ex), sy, Math.abs(ex - sx) + 1, FH / n + 1); }
    const [ax, ay] = stair(k, 0), [bx, by] = stair(k, 1);
    ctx.strokeStyle = 'rgba(200,190,170,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(ax, ay - 90); ctx.lineTo(bx, by - 90); ctx.stroke();
  }
}
// 屋顶招牌：sign = { text, p(0-1 逐字亮), c, size }
function roof(ctx, hr, st) {
  const d = dayness(hr);
  rect(ctx, -30, ROOF - 40, BW + 60, 46, mix([40, 40, 52], [120, 116, 120], d * 0.6));
  rect(ctx, 120, ROOF - 320, 14, 290, [60, 60, 66]); rect(ctx, BW - 134, ROOF - 320, 14, 290, [60, 60, 66]);
  const s = st.sign || { text: '幸福里3栋', p: 0.15 };
  rrect(ctx, 80, ROOF - 340, BW - 160, 200, 20, [24, 22, 30]);
  const ch = [...s.text], size = s.size || 120, cw = size * 1.05, x0 = BW / 2 - (ch.length - 1) * cw / 2;
  ch.forEach((c, i) => {
    const on = clamp(s.p * ch.length - i, 0, 1), col = (s.cols && s.cols[i]) || s.c || [255, 204, 116];
    ctx.save(); ctx.font = `900 ${size}px EQHeavy, Serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (on > 0.01) { ctx.shadowColor = rgba(col, 0.9 * on); ctx.shadowBlur = 40; }
    ctx.fillStyle = rgba(mix([60, 56, 64], col, on)); ctx.fillText(c, x0 + i * cw, ROOF - 240); ctx.restore();
    if (on > 0.01) glow(ctx, x0 + i * cw, ROOF - 240, size * 1.2, col, 0.25 * on);
  });
}
// 整栋楼（世界坐标）
function building(ctx, hr, st) {
  const d = dayness(hr);
  rect(ctx, -40, ROOF - 10, BW + 80, -ROOF + 60, mix([34, 30, 36], [150, 140, 132], d * 0.6)); // 外墙边
  for (let k = 0; k < NF; k++) { for (const s of ['L', 'R']) unit(ctx, (k === 0 ? 'G' : String(k)) + s, hr, st); stairwell(ctx, k, hr, st); }
  for (let k = 0; k <= NF; k++) vgrad(ctx, -40, -k * FH - (k ? 0 : 0), BW + 80, SLAB, mix([70, 62, 60], [196, 186, 176], d * 0.6), mix([40, 36, 36], [150, 140, 132], d * 0.6)); // 楼板
  for (const x of [-40, UW - 8, UW + SW - 8, BW + 24]) rect(ctx, x, ROOF, 16, -ROOF, mix([50, 46, 50], [170, 160, 150], d * 0.6)); // 隔墙
  roof(ctx, hr, st);
  // 地面
  vgrad(ctx, -20000, 0, 42000, 20000, mix([30, 30, 36], [120, 122, 118], d * 0.6), [10, 10, 14]);
  rect(ctx, -20000, 0, 42000, 8, [90, 86, 80]);
  // 楼层号小牌
  for (let k = 0; k < NF; k++) { const y = -k * FH - FH + 70; rrect(ctx, BW + 30, y, 70, 46, 8, [30, 34, 44]); K.text(ctx, k === 0 ? 'G' : k + 'F', BW + 65, y + 33, { size: 30, family: 'Latin', weight: 700, color: [230, 220, 200] }); }
}
// 主入口：画天空、城市、楼。st: { hr(覆盖钟点), lamps, doors, plates, sign, city:{blueEvery,blueA}, occupied, unitHook, grayUnit, tvOn, curtain3R }
function world(ctx, t, c, st = {}) {
  const hr = st.hr != null ? st.hr : hour(t);
  sky(ctx, hr);
  city(ctx, c, hr, st.city || {});
  inCam(ctx, c, () => building(ctx, hr, st));
  return hr;
}

// ---------- 镜头 ----------
// 对准某户（中景，一户占画面宽约 95%）；dy 微调，主体放画面中上部（避开字幕区）
const camUnit = (id, z = 1.55, dx = 0, dy = 0, sy = 760) => { const u = U(id); return X.cam(z, u.cx + dx, (u.top + u.floor) / 2 + dy, W / 2, sy); };
const camFloor = (k, z = 0.68, sy = 760) => X.cam(z, BW / 2, -k * FH - FH / 2, W / 2, sy); // 一整层
const camWhole = (z = 0.42, sy = 900) => X.cam(z, BW / 2, ROOF / 2 - 120, W / 2, sy);
const camMix = (a, b, u) => X.cam(Math.exp(lerp(Math.log(a.z), Math.log(b.z), u)), lerp(a.fx, b.fx, u), lerp(a.fy, b.fy, u), lerp(a.sx, b.sx, u), lerp(a.sy, b.sy, u));
// 按关键帧插值镜头：keys = [[t, cam], ...]，段间 easeInOut
function camKeys(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t <= keys[i][0]) return camMix(keys[i - 1][1], keys[i][1], easeInOut(prog(t, keys[i - 1][0], keys[i][0])));
  return keys[keys.length - 1][1];
}

// ---------- 角色 ----------
// 主角（16P ESFJ 伞哥），默认 s=0.6 时身高约 350px（屋高 570）
const hero = (ctx, x, y, s = 0.6, o = {}) => EF.hero(ctx, x, y, s, o);
const folk = (ctx, key, x, y, s = 1.25, o = {}) => MB.person(ctx, key, x, y, s, o);
// 走路：返回 [x, y, 步态 bob, hipB, hipF]
function walk(t, t0, t1, p0, p1, stepHz = 2.2) {
  const u = easeInOut(prog(t, t0, t1)), moving = t > t0 && t < t1, ph = (t - t0) * stepHz * Math.PI * 2;
  return { x: lerp(p0[0], p1[0], u), y: lerp(p0[1], p1[1], u), bob: moving ? Math.abs(Math.sin(ph)) * 8 : 0, hipB: moving ? Math.sin(ph) * 0.35 : 0, hipF: moving ? -Math.sin(ph) * 0.35 : 0, moving, flip: p1[0] < p0[0] };
}

// ---------- 参考片同款 HUD / 泡泡 ----------
// 右上角时钟（数字表，琥珀色字），总装统一调用
function hud(ctx, t, a = 1) {
  const hr = hour(t), hh = Math.floor(((hr % 24) + 24) % 24), mm = Math.floor((hr - Math.floor(hr)) * 60);
  if (a <= 0.01) return;
  const x = W - 220, y = 120, w = 170, h = 74;
  ctx.save(); ctx.globalAlpha = a;
  rrect(ctx, x, y, w, h, 14, [20, 18, 22], 0.82); ctx.strokeStyle = 'rgba(255,200,110,0.55)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(x, y, w, h, 14); ctx.stroke();
  const s = String(hh).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
  ctx.font = '700 50px Latin, monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(255,190,90,0.8)'; ctx.shadowBlur = 14;
  ctx.fillStyle = '#ffcf7a'; ctx.fillText(s, x + w / 2, y + h / 2 + 2);
  ctx.restore();
}
// 「▶▶ 3小时后」快进角标（屏幕坐标）
function ffBadge(ctx, str, a, x = W - 220, y = 214) {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha = a;
  ctx.fillStyle = '#fff'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.moveTo(x + 10 + i * 30, y); ctx.lineTo(x + 40 + i * 30, y + 22); ctx.lineTo(x + 10 + i * 30, y + 44); ctx.closePath(); ctx.fill(); }
  K.text(ctx, str, x + 85, y + 80, { size: 34, weight: 700, color: [255, 255, 255] });
  ctx.restore();
}
// 白底黑字泡泡；gray=1 变成旧泡泡（灰、半透明）；icon(ctx, cx, cy) 画实物图标（不写字时用 str=''）
function say(ctx, str, x, y, a, o = {}) {
  if (a <= 0.003) return;
  const { size = 46, tail = [-40, 70], gray = 0, icon = null, iconW = 120, pop = 1 } = o;
  const c = mix([252, 250, 246], [150, 150, 156], gray), ink = mix([30, 30, 34], [90, 90, 96], gray);
  ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
  if (icon) {
    const w = iconW + 50, h = iconW * 0.8 + 40;
    ctx.globalAlpha *= a * (1 - gray * 0.5);
    rrect(ctx, -w / 2 + 5, -h / 2 + 7, w, h, 26, [0, 0, 0], 0.3); rrect(ctx, -w / 2, -h / 2, w, h, 26, c);
    ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.moveTo(-14, h / 2 - 2); ctx.lineTo(tail[0], tail[1]); ctx.lineTo(14, h / 2 - 2); ctx.closePath(); ctx.fill();
    icon(ctx, 0, 0, iconW);
  } else X.bubble(ctx, str, 0, 0, a * (1 - gray * 0.5), { size, tail, c, ink });
  ctx.restore();
}
const popIn = (t, t0) => (t < t0 ? 0 : 1 + 0.18 * Math.exp(-(t - t0) * 9) * Math.sin((t - t0) * 30) * (t - t0 < 0.6 ? 1 : 0)) * Math.min(1, (t - t0) / 0.12);

module.exports = { FH, UW, SW, BW, NF, ROOF, U, UNITS, door, stair, hour, dayness, skyCols, world, building, unit, inCam, camUnit, camFloor, camWhole, camMix, camKeys, hero, folk, walk, hud, ffBadge, say, popIn, rect, rrect, vgrad, glow, lampAt, windowPane };
