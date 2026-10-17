// 表演：角色的"内心过程"（拆解 第 3.1 节）。原片的探索都是这个链条：
//   注意到（头先转过去、身体一顿、停住看）→ 情绪姿势（好奇：歪头托腮；困惑：挠头）→ 小心试探（慢慢伸手、一戳就缩回）
//   → 得出结论（再看一眼、点头 / 想到主意）→ 下一步行动
// 这里每个函数都是一小段表演，挂在 Actor2 上，返回这段表演结束的时间（动画时间），方便一段接一段写。
//   a.notice(t, [x, y])          注意到某个东西：头转过去、身子一顿，停住看
//   a.look(t, [x, y])            看向某处（头的角度按位置算；在身后就转身）
//   a.think(t, 1.4)              托腮想（歪头、重心慢慢晃）
//   a.scratch(t, 1.0)            挠头（带挠头声）
//   a.startle(t)                 吓一跳往后缩
//   a.poke(t, [x, y])            试探着伸手 → 一戳 → 缩回来
//   a.doubleTake(t, [x1,y1], [x2,y2])   看 A → 看 B → 猛地再看 A → 再看 B（反应过来）
//   a.idea(t)                    想到主意：头一抬、手指竖起来
//   a.nod(t, 2)                  点头
'use strict';
const K = require('./core');
const { clamp, lerp } = K;
const { Actor2 } = require('./actor2');
require('./moves');

const A = Actor2.prototype;
const REST_F = [0.05, 0.35], REST_B = [-0.04, 0.35];
const neckAt = (a, t) => { const h = a.hipT.at(t), D = a.dirAt(t), l = a.leanT.at(t) * Math.PI / 180; return [h[0] + D * Math.sin(l) * 0.29 * a.H, h[1] - Math.cos(l) * 0.29 * a.H]; };

// 看向某处：头往目标方向偏（没有脸，靠头的位置和身体朝向表现"在看哪"）
A.look = function (t, p, o = {}) {
  const n = neckAt(this, t), D = this.dirAt(t);
  const side = Math.sign(p[0] - n[0]) || D;
  if (side !== D && o.turn !== false && Math.abs(p[0] - n[0]) > 0.15 * this.H) this.turn(t, side);
  const e = Math.atan2(n[1] - p[1], Math.max(Math.abs(p[0] - n[0]), 0.2 * this.H)) * 180 / Math.PI;   // 仰角（上为正）
  this.head(t, clamp(-e * 0.75 + (o.tilt || 0), -48, 55), o.dur ?? 0);
  if (o.lean !== undefined) this.lean(t, o.lean, o.dur ?? 0);
  return t + (o.dur ?? 0.15);
};

// 注意到：头先转过去，身子一顿（微微往后一缩再回来），然后停住看
A.notice = function (t, p, o = {}) {
  const h = this.hipT.at(t), l = this.leanT.at(t), D = this.dirAt(t);
  this.look(t, p, { tilt: -6 });
  this.hip(t + 0.04, [h[0] - D * 0.012 * this.H, h[1] - 0.012 * this.H]).lean(t + 0.04, l - 5);
  this.hip(t + 0.22, h, 0.2).lean(t + 0.22, l, 0.25);
  this.look(t + 0.25, p, { dur: 0.3 });
  return t + (o.hold ?? 0.6);
};

// 托腮想：一只手托着下巴、另一只手托着这只手的胳膊肘，歪头，重心慢慢晃
A.think = function (t, dur = 1.4, o = {}) {
  const h = this.hipT.at(t), D = this.dirAt(t);
  this.hand('F', t, 'local', [0.11, -0.1]).hand('B', t + 0.05, 'local', [0.08, 0.1]);
  this.head(t, o.head ?? -12, 0.25);
  for (let k = 0, n = Math.max(1, Math.floor(dur / 0.6)); k < n; k++)
    this.hip(t + 0.3 + k * 0.6, [h[0] + D * (k % 2 ? -1 : 1) * 0.012 * this.H, h[1]], 0.5);
  if (o.release !== false) { this.hand('F', t + dur, 'free', REST_F).hand('B', t + dur, 'free', REST_B).hip(t + dur, h, 0.3); }
  return t + dur;
};

// 挠头：手放到头顶来回挠，配挠头声（每下约 0.2 秒），头微微歪
A.scratch = function (t, dur = 1.0, o = {}) {
  const t0 = t + 0.18;
  this.hand('F', t, 'local', s => [0.02 + 0.025 * Math.sin((s - t0) * 28), -0.25 + 0.015 * Math.cos((s - t0) * 28)]);
  this.head(t, o.head ?? -10, 0.2).lean(t, o.lean ?? 3, 0.3);
  for (let s = t0; s < t + dur - 0.1; s += 0.2 + 0.03 * Math.sin(s * 13)) this.sfx(s, 'scratch', { v: 0.6 + 0.3 * Math.abs(Math.sin(s * 7)) });
  if (o.release !== false) this.hand('F', t + dur, 'free', REST_F).head(t + dur, o.after ?? 4, 0.3);
  return t + dur;
};

// 吓一跳：身子往后一弹、手护到身前，落回来时膝盖压一下
A.startle = function (t, o = {}) {
  const h = this.hipT.at(t), l = this.leanT.at(t), D = this.dirAt(t), H = this.H, k = o.amt ?? 1;
  const fF = this.feet.F.at(t), fB = this.feet.B.at(t), back = (o.back ?? 0.1) * H * k;
  this.hip(t, [h[0] - D * back * 0.6, h[1] - 0.06 * H * k]).lean(t, l - 16 * k).head(t, -14 * k);
  this.hand('F', t, 'local', [0.16, -0.06]).hand('B', t + 0.02, 'local', [0.1, -0.02]);
  this.foot('F', t + 0.03, [fF[0] - D * back, 0], 0.16, 14 * k, 'out3', false).foot('B', t + 0.05, [fB[0] - D * back * 1.2, 0], 0.16, 12 * k);
  this.hip(t + 0.2, [h[0] - D * back, h[1] + 0.05 * H * k]).lean(t + 0.2, l - 6);
  this.hip(t + 0.55, [h[0] - D * back, h[1]], 0.35).lean(t + 0.55, l, 0.3);
  this.sfx(t, 'whoosh_short', { v: 0.35 * k });
  if (o.release !== false) this.hand('F', t + 0.7, 'free', REST_F).hand('B', t + 0.7, 'free', REST_B);
  return t + 0.7;
};

// 试探着伸手去戳：慢慢伸过去（犹豫）→ 很快戳一下（配音效）→ 像被烫到一样缩回来
A.poke = function (t, p, o = {}) {
  const H = this.H, D = this.dirAt(t), reach = o.reach ?? 0.55, hand = o.hand || 'F';
  const near = [p[0] - D * 0.08 * H, p[1] + 0.02 * H];
  this.look(t, p);
  this.hand(hand, t, 'world', near);                               // 伸过去（弹簧带出犹豫的慢）
  const tc = t + reach;
  this.hand(hand, tc - 0.06, 'strike', { to: p, dur: 0.06 });
  this.sfx(tc, o.sfx || 'touch', { v: 0.8 });
  if (o.retract !== false) this.hand(hand, tc + 0.05, 'local', [0.1, 0.02]);   // 缩回到胸前
  return tc + 0.3;
};

// 反应过来：看 A → 看 B → 猛地再看 A → 再看 B
A.doubleTake = function (t, a, b) {
  this.look(t, a, { dur: 0.2 });
  this.look(t + 0.45, b, { dur: 0.18 });
  this.look(t + 0.75, a, { dur: 0.06 });
  this.look(t + 1.0, b, { dur: 0.08 });
  return t + 1.3;
};

// 想到主意：头一抬、身子一挺、手指竖起来
A.idea = function (t, o = {}) {
  const l = this.leanT.at(t), h = this.hipT.at(t);
  this.head(t, -22).lean(t, l - 6).hip(t, [h[0], h[1] - 0.015 * this.H]);
  this.hand('F', t, 'local', [0.14, -0.22]);
  this.hip(t + 0.3, h, 0.3).lean(t + 0.3, l, 0.3);
  if (o.release !== false) this.hand('F', t + 0.75, 'free', REST_F).head(t + 0.75, o.after ?? 10, 0.3);
  return t + 0.75;
};

A.nod = function (t, n = 2) {
  const h0 = this.headT.at(t);
  for (let k = 0; k < n; k++) this.head(t + k * 0.28, h0 + 16).head(t + k * 0.28 + 0.14, h0 - 2);
  this.head(t + n * 0.28, h0, 0.15);
  return t + n * 0.28 + 0.15;
};

module.exports = { Actor2, REST_F, REST_B };
