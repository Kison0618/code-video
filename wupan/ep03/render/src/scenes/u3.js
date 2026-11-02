'use strict';
// 第三集公共零件：“你”（头顶黄签，签跟人走）、排队的人、慢推、视线虚线、判词、货架格子。
// 素材缺图时由 kit02.put 画带编号的占位纸片，落盘后下一次预览自动换成真图。
const K = require('../core'), P = require('../paper'), Q = require('../kit02'), X = require('../kit');
const V = require('./v6_util');
const TL = require('../timeline');
const { smooth, prog, lerp, clamp, easeOut, easeInOut } = K;
const { L, at } = TL;

const pop = V.pop;
// 镜头 2–4% 慢推：围绕 (cx,cy) 从 1 推到 1+amt
function push(c, t, a, b, amt, cx, cy, fn) {
  const z = 1 + amt * smooth(prog(t, a, b));
  c.save(); c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy); fn(); c.restore();
}
// 人物剪图：底边中点 (x,y)，高 h。o.flip 朝左。缺图占位比例按人像 0.42
function fig(c, n, x, y, h, o = {}) { Q.put(c, n, x, y, h, { ar: 0.42, ...o }); }
// “你”：同一个人物 + 头顶马克笔黄小纸签；bounce 0..1 让签跳一下
function you(c, n, x, y, h, o = {}) {
  fig(c, n, x, y, h, o);
  const [hx, hy] = Q.ptOf(n, x, y, h, 0.5, 0, { ar: 0.42, ...o });
  const b = o.bounce ? Math.sin(clamp(o.bounce) * Math.PI) * 22 : 0;
  Q.tag(c, hx, hy - 46 - b, '你', o.tagPop == null ? 1 : o.tagPop, { size: o.tagSize || 44, hl: true, rot: -0.03, seed: 701 });
}
// 头顶的小纸签（问号、感叹号、托）
function over(c, n, x, y, h, s, p, o = {}) {
  const [hx, hy] = Q.ptOf(n, x, y, h, 0.5, 0, { ar: 0.42, flip: o.flip });
  Q.tag(c, hx + (o.dx || 0), hy - (o.dy == null ? 46 : o.dy), s, p, { size: o.size || 44, hl: o.hl, color: o.color, bg: o.bg, seed: o.seed || 711, rot: o.rot });
}
// 排队的路人：E05 / E06 / E07 轮换，face = 'L' 朝左（素材默认朝右，左朝就镜像）
const CROWD = ['E05', 'E06', 'E07'];
function crowdAt(k) { return CROWD[((k % 3) + 3) % 3]; }
// 视线虚线：从 a 点画到 b 点，p 0..1 画出长度
function gaze(c, a, b, p, o = {}) {
  if (p <= 0.01) return;
  const q = easeOut(p);
  c.save(); c.setLineDash(o.dash || [14, 12]); c.lineCap = 'round';
  c.strokeStyle = o.color || 'rgba(35,27,21,0.75)'; c.lineWidth = o.w || 4;
  c.beginPath(); c.moveTo(a[0], a[1]);
  const mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - (o.bend == null ? 60 : o.bend);
  const pts = []; for (let i = 0; i <= 30; i++) { const u = i / 30 * q; pts.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * mx + u * u * b[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * my + u * u * b[1]]); }
  for (const [x, y] of pts) c.lineTo(x, y); c.stroke(); c.restore();
}
// 判词：一个主体 + 一张大关键词纸签（78px 黄底）
function verdict(c, t, id, s, a, x = 960, y = 850, size = 78) { V.verdict(c, t, id, s, a, x, y, size); }
// 大纸片标题（章节卡用）
function bigPaper(c, x, y, w, h, s, size, p, o = {}) {
  if (p <= 0.01) return;
  c.save(); c.globalAlpha *= clamp(p * 1.5); c.translate(x, y + (1 - easeOut(p)) * 40); c.rotate(o.rot || -0.015);
  P.piece(c, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 3, 18, o.seed || 731)), o.bg || Q.CREAM, { blur: 20, dy: 10 });
  c.fillStyle = o.color || Q.INK; c.font = `900 ${size}px ${o.font || 'Serif'}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, size * 0.04);
  c.restore();
}
// 一行字（画面里的说明，不是字幕）
const text = V.text;
module.exports = { pop, push, fig, you, over, crowdAt, gaze, verdict, bigPaper, text, L, at, Q, X, V, K, P };
