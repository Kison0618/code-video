// 封面：铜版画人头（半透明颅腔）里两张本集的规则卡，被上方一只提线木偶的手吊着；左边（竖版在上）放带“你”的钩子
//   整集一句话：你以为是自己在判断，其实是大脑里简化过的程序在选，还会被人拿来操纵
//   node src/cover.js   → out/封面_16x9.jpg、out/封面_9x16.jpg
'use strict';
const path = require('path');
const K = require('./core');
const { W, H, Canvas } = K;
const P = require('./paper');
const FX = require('./fx');
const CUT = require('./cutout');
const B = require('./brain');

const INK = '#231b15', MARK = '#f4c63d', STRING = 'rgba(50,38,28,0.85)';
const PUP = CUT.get('eng_puppet_hand');
const RULES = ['IF 价格高 → 一定好', 'IF 好比较 → 就选它'];

// 一行字，marked 里的字下面垫一条黄色马克笔
function line(ctx, s, x, y, size, marked = '') {
  ctx.font = `700 ${size}px Sans`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const i = marked ? s.indexOf(marked) : -1;
  if (i >= 0) {
    const x0 = x + ctx.measureText(s.slice(0, i)).width, w = ctx.measureText(marked).width;
    ctx.save(); ctx.fillStyle = MARK; ctx.globalAlpha = 0.9;
    ctx.beginPath(); ctx.moveTo(x0 - 10, y - size * 0.34); ctx.lineTo(x0 + w + 12, y - size * 0.40);
    ctx.lineTo(x0 + w + 8, y + size * 0.12); ctx.lineTo(x0 - 6, y + size * 0.16); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = INK; ctx.fillText(s, x, y);
}
function tag(ctx, s, x, y, size) {
  ctx.font = `700 ${size}px Sans`;
  const w = ctx.measureText(s).width + size * 1.1, h = size * 1.7;
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.012);
  P.piece(ctx, P.poly(P.jag([[0, 0], [w, 0], [w, h], [0, h]], 1.8, 12, 91)), INK, { blur: 10, dy: 4, color: 'rgba(60,35,10,0.4)' });
  ctx.fillStyle = '#fbf3df'; ctx.textBaseline = 'middle'; ctx.fillText(s, size * 0.55, h / 2 + 2);
  ctx.restore();
}

// 人头 + 两张卡 + 提线手。hd = {x, y(底边), h}；pup = {x, y(底边), h}
function figure(ctx, hd, pup, size) {
  B.head(ctx, { ...hd, glass: 1 });
  const map = (u, v) => CUT.pt(B.HEAD, hd.x, hd.y, hd.h, u, v);
  const pos = [map(0.43, 0.17), map(0.43, 0.33)];
  // 先量卡宽，算提线落点
  const mc = new Canvas(10, 10).getContext('2d'); mc.font = require('./card').CODE(size);
  const k = size / 46, wOf = s => mc.measureText(s).width + 130 * k;
  // 手：只画横木以上（原图的线带着白边，不用），线自己画
  const pp = (u, v) => CUT.pt(PUP, pup.x, pup.y, pup.h, u, v);
  const cut = pp(0, 0.6)[1];                     // 横木下方撕开，原图的线只留一小截，接着画自己的线
  const holes = [pp(0.16, 0.6), pp(0.57, 0.6), pp(0.035, 0.6), pp(0.60, 0.6)];
  const ends = [
    [pos[0][0] - wOf(RULES[0]) * 0.36, pos[0][1] - 52 * k], [pos[0][0] + wOf(RULES[0]) * 0.36, pos[0][1] - 52 * k],
    [pos[1][0] - wOf(RULES[1]) * 0.44, pos[1][1] - 52 * k], [pos[1][0] + wOf(RULES[1]) * 0.44, pos[1][1] - 52 * k],
  ];
  ctx.save(); ctx.strokeStyle = STRING; ctx.lineWidth = 2.6; ctx.lineCap = 'round';
  holes.forEach((h, i) => { ctx.beginPath(); ctx.moveTo(...h); ctx.lineTo(...ends[i]); ctx.stroke(); });
  ctx.restore();
  B.ruleCard(ctx, pos[1][0], pos[1][1], RULES[1], size, { rot: 0.01, seed: 23 });
  B.ruleCard(ctx, pos[0][0], pos[0][1], RULES[0], size, { rot: -0.015, seed: 22 });
  // 线头的小圆钉
  ctx.fillStyle = '#7a5a3a'; ends.forEach(([x, y]) => { ctx.beginPath(); ctx.arc(x, y + 4, 5, 0, Math.PI * 2); ctx.fill(); });
  ctx.save(); ctx.clip(P.poly(P.jag([[-200, -2000], [4000, -2000], [4000, cut], [-200, cut]], 3.5, 14, 77)));
  CUT.place(ctx, PUP, pup.x, pup.y, pup.h);
  ctx.restore();
}

const OUT = path.join(__dirname, '..', 'out');

// 16:9：人头在右，字在左
{
  const cv = new Canvas(W, H), ctx = cv.getContext('2d');
  ctx.fillStyle = P.BG; ctx.fillRect(0, 0, W, H);
  figure(ctx, { x: 1330, y: 1560, h: 1260 }, { x: 1380, y: 420, h: 470 }, 44);
  line(ctx, '你以为，', 110, 380, 120);
  line(ctx, '是你在选？', 110, 560, 168, '你在选');
  tag(ctx, '人类误判心理学 01', 116, 700, 46);
  FX.finish(ctx);
  cv.toFileSync(path.join(OUT, '封面_16x9.jpg'), { quality: 0.92 });
}
// 9:16：字在上，人头在下
{
  const VW = 1080, VH = 1920;
  const cv = new Canvas(VW, VH), ctx = cv.getContext('2d');
  ctx.fillStyle = P.BG; ctx.fillRect(0, 0, VW, VH);
  figure(ctx, { x: 560, y: 2330, h: 1500 }, { x: 700, y: 1110, h: 520 }, 50);
  line(ctx, '你以为，', 90, 300, 120);
  line(ctx, '是你在选？', 90, 490, 168, '你在选');
  tag(ctx, '人类误判心理学 01', 96, 600, 46);
  cv.toFileSync(path.join(OUT, '封面_9x16.jpg'), { quality: 0.92 });
}
// 4:3：同 16:9 的左右构图，人头更靠右下
{
  const VW = 1440, VH = 1080;
  const cv = new Canvas(VW, VH), ctx = cv.getContext('2d');
  ctx.fillStyle = P.BG; ctx.fillRect(0, 0, VW, VH);
  figure(ctx, { x: 1130, y: 1680, h: 1150 }, { x: 1180, y: 470, h: 430 }, 36);
  line(ctx, '你以为，', 70, 300, 140);
  line(ctx, '是你在选？', 70, 540, 196, '你在选');
  tag(ctx, '人类误判心理学 01', 78, 650, 56);
  cv.toFileSync(path.join(OUT, '封面_4x3.jpg'), { quality: 0.92 });
}
// 3:4：字在上，人头在下
{
  const VW = 1080, VH = 1440;
  const cv = new Canvas(VW, VH), ctx = cv.getContext('2d');
  ctx.fillStyle = P.BG; ctx.fillRect(0, 0, VW, VH);
  figure(ctx, { x: 600, y: 2080, h: 1250 }, { x: 720, y: 1000, h: 420 }, 44);
  line(ctx, '你以为，', 60, 250, 150);
  line(ctx, '是你在选？', 60, 480, 192, '你在选');
  tag(ctx, '人类误判心理学 01', 68, 580, 58);
  cv.toFileSync(path.join(OUT, '封面_3x4.jpg'), { quality: 0.92 });
}
console.log('wrote 封面_16x9.jpg 封面_9x16.jpg 封面_4x3.jpg 封面_3x4.jpg');
