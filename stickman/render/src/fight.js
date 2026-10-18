// 打斗：关键姿势序列 + 招式库 + 编排
//
// 原片的打斗是"一个个关键姿势之间 1–3 帧切过去，然后定住"，弹簧做不出来。所以招式写成按帧号（24fps，原片的帧率）排的一串姿势，
// 这段时间里胯、上身、手、脚全部走精确路径；结束后把目标交还给弹簧，接下来的普通动作照常。
//
//   const { Actor2, exchange } = require('./fight');
//   const r = hero.move(t, 'jab');                 // 招式数据在 analysis/fight_moves.json（从原片逐帧量出来的帧数和姿势）
//   r.contact                                      // 打中的时刻（动画时间）；r.t 招式结束（回到架势）
//   exchange(D, [{ t, a: hero, move: 'jab', b: foe, react: 'hurt_high', level: 'light' }, ...])   // 攻防编排：动作 + 反应 + 打击停顿
//
// 姿势（每个 key）：{ f, hip:[x,y], lean, head, F:[x,y], B:[x,y], fF:[x,y], fB:[x,y], e, hit }
//   f：帧号（24fps，相对招式开始）
//   hip：相对起始胯，x 沿朝向、y 向下为正，单位 H；lean / head：度（lean 是绝对值，正 = 往前倾）
//   F / B：前手 / 后手，相对肩膀（同 hand 的 'pose' 模式：[朝前, 朝下]），单位 H
//   fF / fB：前脚 / 后脚，x 相对起始胯（沿朝向），y 离地高度（向上为正），单位 H
//   e：从上一个姿势过来的缓动（默认 'out'：一开始最快——"一下到位"）；hit：这一帧是接触帧
//   没写的通道保持上一个值；第一个 key 之前从当前状态出发。
'use strict';
const fs = require('fs'), path = require('path');
const K = require('./core');
const { lerp, E, clamp } = K;
const { Actor2 } = require('./acting');

const A = Actor2.prototype;
const MOVES = JSON.parse(fs.readFileSync(path.join(__dirname, '../../analysis/fight_moves.json'), 'utf8')).moves;

// 一个通道（一串 [时间, 值, 缓动]）在 t 时的值
function chan(list) {
  return t => {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      const [t1, v1, e] = list[i];
      if (t <= t1) {
        const [t0, v0] = list[i - 1], u = (E[e] || E.out)((t - t0) / Math.max(1e-6, t1 - t0));
        return Array.isArray(v0) ? v0.map((x, n) => lerp(x, v1[n], u)) : lerp(v0, v1, u);
      }
    }
    return list[list.length - 1][1];
  };
}

A.keys = function (t0, keys, o = {}) {
  const D = o.dir ?? this.dirAt(t0), H = this.H, fps = o.fps ?? 24, sc = o.slow ?? 1;
  const hip0 = this.hipT.at(t0), lean0 = this.leanT.at(t0), head0 = this.headT.at(t0);
  const lw = 360 * Math.round(lean0 / 360);
  const fw = { F: this.feet.F.target(t0), B: this.feet.B.target(t0) };
  const T = k => t0 + k.f / fps * sc, tE = T(keys[keys.length - 1]);
  const build = (name, start) => {
    const L = start === undefined ? [] : [[t0, start, 'linear']];
    for (const k of keys) if (k[name] !== undefined) L.push([T(k), k[name], k.e || 'out']);
    return L.length ? L : null;
  };
  // 胯、上身：精确路径
  const hipC = chan(build('hip', [0, 0]));
  const hipW = s => { const v = hipC(s); return [hip0[0] + D * v[0] * H, hip0[1] + v[1] * H]; };
  this.path('hip', t0, tE, hipW).hip(tE, hipW(tE));
  const lk = build('lean', lean0 - lw);
  if (lk) { const lc = chan(lk); this.path('lean', t0, tE, s => lw + lc(s)); this.lean(tE, lw + lc(tE)); }
  // 头：交给头的轨道（软一点，像原片头会晚半拍）
  for (let i = 0, prev = t0; i < keys.length; i++) if (keys[i].head !== undefined) { const tk = T(keys[i]); this.head(prev, keys[i].head, Math.max(0.001, tk - prev), 'out'); prev = tk; }
  // 手：'pose' 模式（精确、相对肩膀）
  for (const h of ['F', 'B']) {
    const L = build(h);
    if (!L) continue;
    const hc = chan(L);
    this.hand(h, t0, 'pose', s => hc(s));
  }
  // 脚：精确的世界坐标轨迹；水平移动时自动抬一点脚
  for (const f of ['F', 'B']) {
    let L = build('f' + f);
    if (!L && o.follow) L = [[t0 + o.follow.f / fps * sc + (f === 'B' ? 0.03 : 0), [(fw[f][0] - hip0[0]) * D / H + o.follow.dx, 0], 'inOut']];   // 自动前移时没写的脚跟一步
    if (!L) continue;
    const st = [(fw[f][0] - hip0[0]) * D / H, -fw[f][1] / H];
    L.unshift([t0, st, 'linear']);
    const fc = chan(L);
    const fn = s => {
      const v = fc(s);
      let i = 1; while (i < L.length - 1 && L[i][0] < s) i++;
      const a = L[i - 1][1], b = L[i][1], u = clamp((s - L[i - 1][0]) / Math.max(1e-6, L[i][0] - L[i - 1][0]));
      const arc = Math.min(0.08, Math.abs(b[0] - a[0]) * 0.25) * Math.sin(Math.PI * u) * (a[1] <= 0.001 && b[1] <= 0.001 ? 1 : 0);
      return [hip0[0] + D * v[0] * H, -(v[1] + arc) * H];
    };
    this.footPath(f, t0, fn, 0.04);
    const end = fn(tE);
    if (end[1] > -1) this.foot(f, tE, [end[0], 0], 0.001, 0, 'linear', false);     // 最后落地：交还给踩地模式
    else this.footFree(f, tE, [0.1, 0.35]);
  }
  if (o.release) this.hand('F', tE + o.release, 'free', [0.05, 0.35]).hand('B', tE + o.release, 'free', [-0.04, 0.35]);
  const hk = keys.find(k => k.hit);
  const contact = hk ? T(hk) : null;
  // 接触点（给打击特效用）：大约是出手那只手 / 脚的位置
  let point = null;
  if (hk) {
    const hp = hipW(T(hk)), limb = hk.F ? ['F', 0.26] : hk.B ? ['B', 0.26] : hk.fF ? ['fF', 0] : hk.fB ? ['fB', 0] : null;
    if (limb && limb[0].length === 1) point = [hp[0] + D * hk[limb[0]][0] * H, hp[1] - (limb[1] - hk[limb[0]][1]) * H];
    else if (limb) point = [hip0[0] + D * hk[limb[0]][0] * H, -hk[limb[0]][1] * H];
  }
  if (o.sfx !== false && contact === null && keys.some(k => k.whoosh)) this.sfx(T(keys.find(k => k.whoosh)), 'whoosh_short', { v: 0.5 });
  return { t: tE, contact, point, x: hipW(tE)[0], D };
};

// 按名字调用招式（analysis/fight_moves.json）
A.move = function (t, name, o = {}) {
  const m = MOVES[name];
  if (!m) throw new Error('没有这个招式：' + name);
  let keys = m.keys;
  // 打中对方：按招式的出手距离（reach，单位 H）和两人此刻的距离，把差值加到接触帧之前的前移里（够不着就多冲一点，太近就少走一点）
  if (o.to && m.reach) {
    const D = this.dirAt(t), gap = (o.to.hipT.at(t)[0] - this.hipT.at(t)[0]) * D / this.H, extra = clamp(gap - m.reach, -0.3, 0.9);
    const hi = keys.findIndex(k => k.hit);
    if (hi >= 0 && Math.abs(extra) > 0.02) keys = keys.map((k, i) => {
      const u = i >= hi ? 1 : clamp(k.f / keys[hi].f, 0, 1), add = v => v && [v[0] + extra * u, v[1]];
      return { ...k, hip: add(k.hip) ?? (i >= hi ? undefined : k.hip), fF: k.fF ? add(k.fF) : k.fF, fB: k.fB ? add(k.fB) : k.fB };
    });
    if (hi >= 0 && Math.abs(extra) > 0.02 && !keys[hi].hip) keys[hi] = { ...keys[hi], hip: [extra, 0.05] };
  }
  const hiF = keys.find(k => k.hit);
  const r = this.keys(t, keys, { ...o, follow: o.to && m.reach && hiF ? { f: hiF.f + 1, dx: clamp((o.to.hipT.at(t)[0] - this.hipT.at(t)[0]) * this.dirAt(t) / this.H - m.reach, -0.3, 0.9) } : null });
  if (m.whoosh !== undefined && o.sfx !== false) this.sfx(t + m.whoosh / 24 * (o.slow ?? 1), 'whoosh_short', { v: m.whooshV ?? 0.6 });
  return { ...r, react: m.react, level: m.level, reach: m.reach };
};

// 攻防编排：每一拍 { t, a, move, b, react, level, fx }。a 出招；打中那一刻 b 做反应，导演登记打击（停顿帧、震屏、闪白）
//   react：fight_moves 里的反应招式名（hurt_high、hurt_body…），或 'block' / 'dodge'（b 先做这个招式，不算打中），或函数 (b, tc) => {}
//   返回每一拍的结果（contact 时刻、接触点），方便接着排下一拍
function exchange(D, beats) {
  const out = [];
  for (const bt of beats) {
    const r = bt.a.move(bt.t, bt.move, { to: bt.b, ...(bt.opts || {}) });
    const tc = r.contact ?? r.t;
    let landed = true;
    const react = bt.react ?? r.react;
    if (bt.b && react) {
      if (react === 'block' || react === 'dodge' || (MOVES[react] && MOVES[react].defend)) {
        const name = react === 'block' ? 'block' : react === 'dodge' ? 'dodge_back' : react;
        const lead = (MOVES[name].ready ?? 2) / 24;                              // 防守要在接触前就位
        bt.b.move(tc - lead, name);
        landed = name === 'block';                                               // 格挡也会有一下小的打击
      } else if (typeof react === 'function') react(bt.b, tc);
      else bt.b.move(tc, react);
    }
    if (D && bt.b && (r.point || bt.point)) {
      const level = bt.level ?? r.level ?? 'light';
      if (landed) D.hit(tc, bt.point || r.point, react === 'block' ? 'light' : level, { ...(react === 'block' ? { sfx: ['impact_light'], freeze: 0.04, flash: 0, rays: 4 } : {}), ...(bt.fx || {}) });
    }
    out.push({ ...r, tc, landed });
  }
  return out;
}

module.exports = { Actor2, exchange, MOVES };
