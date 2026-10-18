// 打斗：关键姿势序列 + 招式库 + 编排
//
// 原片的打斗是"一个个关键姿势之间 1–3 帧切过去，然后定住"，弹簧做不出来。所以招式写成按帧号（24fps，原片的帧率）排的一串姿势，
// 这段时间里胯、上身、手、脚全部走精确路径；结束后把目标交还给弹簧，接下来的普通动作照常。
//
//   const { Actor2, exchange } = require('./fight');
//   const r = hero.move(t, 'jab');                 // 招式数据在 analysis/fight_moves.json（从原片逐帧量出来的帧数和姿势）
//   r.contact                                      // 打中的时刻（动画时间）；r.t 招式结束（回到架势）
//   exchange(D, [{ t, a: hero, move: "thrust", b: foe, react: "stagger", glyph: "0" }, ...], fx)   // 出招 + 反应 + 打击特效（不停帧）
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

// 此刻胯的实际位置（精确路径进行中就取路径上的值，否则取目标）
A.hipNow = function (t) { const L = this.paths.hip; for (let n = L.length - 1; n >= 0; n--) if (t >= L[n].t0 && t < L[n].t1) return L[n].fn(t); return this.hipT.at(t); };

A.keys = function (t0, keys, o = {}) {
  const D = o.dir ?? this.dirAt(t0), H = this.H, fps = o.fps ?? 24, sc = o.slow ?? 1;
  // 起点 = 此刻的实际姿势：上一招的精确路径还没走完（招式叠着接）时取路径上此刻的值，不然人会被拽回上一招开始前的位置
  const pathNow = ch => { const L = this.paths[ch]; for (let n = L.length - 1; n >= 0; n--) if (t0 >= L[n].t0 && t0 < L[n].t1) return L[n].fn(t0); return null; };
  const footNow = f => { let m = null; for (const x of this.footModes[f]) if (x.t <= t0) m = x; return m && m.mode === 'path' ? m.fn(t0) : this.feet[f].target(t0); };
  const hip0 = pathNow('hip') || this.hipT.at(t0), lean0 = pathNow('lean') ?? this.leanT.at(t0), head0 = this.headT.at(t0);
  const lw = 360 * Math.round(lean0 / 360);
  const fw = { F: footNow('F'), B: footNow('B') };
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
    const D = this.dirAt(t), gap = (o.to.hipNow(t)[0] - this.hipNow(t)[0]) * D / this.H, extra = clamp(gap - m.reach, -0.3, 0.9);
    const hi = keys.findIndex(k => k.hit);
    if (hi >= 0 && Math.abs(extra) > 0.02) keys = keys.map((k, i) => {
      const u = i >= hi ? 1 : clamp(k.f / keys[hi].f, 0, 1), add = v => v && [v[0] + extra * u, v[1]];
      return { ...k, hip: add(k.hip) ?? (i >= hi ? undefined : k.hip), fF: k.fF ? add(k.fF) : k.fF, fB: k.fB ? add(k.fB) : k.fB };
    });
    if (hi >= 0 && Math.abs(extra) > 0.02 && !keys[hi].hip) keys[hi] = { ...keys[hi], hip: [extra, 0.05] };
  }
  const hiF = keys.find(k => k.hit);
  const r = this.keys(t, keys, { ...o, follow: o.to && m.reach && hiF ? { f: hiF.f + 1, dx: clamp((o.to.hipNow(t)[0] - this.hipNow(t)[0]) * this.dirAt(t) / this.H - m.reach, -0.3, 0.9) } : null });
  if (m.whoosh !== undefined && o.sfx !== false) this.sfx(t + m.whoosh / 24 * (o.slow ?? 1), 'whoosh_short', { v: m.whooshV ?? 0.6 });
  return { ...r, react: m.react, level: m.level, reach: m.reach };
};

// —— 打击特效（原片实测：打中不停帧、不震屏；1 帧放射光 + 1–2 帧火花，命中本体再加一个结果字形 5 帧淡出）——
//   level：none 擦碰无光 / clash 兵器相碰 / hit 命中本体 / shot 子弹命中 / heavy 击倒打飞（再加 1 帧全屏白闪）
const F1 = 1 / 24;
class FightFX {
  constructor(H = 300) { this.H = H; this.list = []; }
  add(t, p, level = 'hit', o = {}) { if (level !== 'none' && p) this.list.push({ t, p, level, glyph: o.glyph, dir: o.dir ?? 1, seed: this.list.length * 7 + 3 }); return this; }
  flashAt(t) { let a = 0; for (const e of this.list) if (e.level === 'heavy' && t >= e.t && t < e.t + F1) a = 0.9; return a; }
  draw(ctx, t) {
    const H = this.H;
    for (const e of this.list) {
      const age = t - e.t;
      if (age < 0 || age > F1 * 8) continue;
      const big = e.level === 'clash' ? 0.25 : e.level === 'shot' ? 0.3 : 0.4, r = big * H, rnd = K.mulberry32(e.seed);
      ctx.save(); ctx.translate(e.p[0], e.p[1]);
      if (age < F1) {                                               // 1 帧放射光
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
        if (e.level !== 'clash') { ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, r * 1.15, 0, Math.PI * 2); ctx.stroke(); }
      }
      if (age < F1 * 2.2) {                                         // 火花细线
        const n = e.level === 'clash' ? 3 : 6;
        ctx.strokeStyle = `rgba(255,255,255,${1 - age / (F1 * 2.2)})`; ctx.lineWidth = 3; ctx.lineCap = 'round';
        for (let k = 0; k < n; k++) { const a = rnd() * Math.PI * 2, r0 = r * (0.5 + age / F1 * 0.5), r1 = r0 + r * (0.4 + rnd() * 0.5); ctx.beginPath(); ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0); ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1); ctx.stroke(); }
      }
      if (e.glyph && age >= F1 * 0.5 && age < F1 * 6.5) {           // 结果字形（例如 e^iπ 被 +1 打中出现 0），5 帧淡出
        const a = 1 - (age - F1 * 0.5) / (F1 * 6);
        ctx.fillStyle = `rgba(180,180,180,${a})`; ctx.font = `400 ${0.6 * H}px Code`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(e.glyph, 0, -0.05 * H);
      }
      ctx.restore();
    }
  }
}

// 手里的武器：从肘到手的方向往前延伸 len（单位 H）。挥得快的那一帧画扇形拖影（原片只留 1 帧）
function weaponLine(actor, ta, len, hand = 'F') {
  const j = actor.jointsAt(ta), L = j[hand === 'F' ? 'aF' : 'aB'], el = L[1], hd = L[2];
  const dx = hd[0] - el[0], dy = hd[1] - el[1], n = Math.hypot(dx, dy) || 1;
  return [hd, [hd[0] + dx / n * len * actor.H, hd[1] + dy / n * len * actor.H]];
}
function drawWeapon(ctx, actor, ta, o = {}) {
  const len = o.len ?? 0.45, [a, b] = weaponLine(actor, ta, len, o.hand), [pa, pb] = weaponLine(actor, ta - F1, len, o.hand);
  const H = actor.H, moved = Math.hypot(b[0] - pb[0], b[1] - pb[1]);
  if (moved > 0.12 * H) {                                           // 拖影：上一帧和这一帧武器之间的扇面
    const g = ctx.createLinearGradient(pb[0], pb[1], b[0], b[1]);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.55)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(pa[0], pa[1]); ctx.lineTo(pb[0], pb[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(a[0], a[1]); ctx.closePath(); ctx.fill();
  }
  ctx.strokeStyle = o.color || '#f0f0f0'; ctx.lineWidth = o.width ?? 0.035 * H; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  if (o.label) { ctx.save(); ctx.fillStyle = o.color || '#f0f0f0'; ctx.font = `400 ${0.2 * H}px Code`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(o.label, b[0], b[1]); ctx.restore(); }
}

// 攻防编排：每一拍 { t, a, move, b, react, level, glyph }。a 出招；打中那一刻 b 做反应，登记打击特效
//   react：fight_moves 里的反应招式名（stagger、hurt_fold、launched…），或 'block' / 'dodge' / 'lean_dodge' / 'duck'（b 先做这个招式，算没打中），或函数 (b, tc) => {}
//   fx：FightFX（不传就不画特效）；heavy 级别额外交给导演登记一次（白闪 1 帧，不停帧不震屏）
function exchange(D, beats, fx) {
  const out = [];
  for (const bt of beats) {
    const r = bt.a.move(bt.t, bt.move, { to: bt.b, ...(bt.opts || {}) });
    const tc = r.contact ?? r.t;
    let landed = true;
    const react = bt.react ?? r.react;
    if (bt.b && react) {
      if (react === 'block' || react === 'dodge' || (MOVES[react] && MOVES[react].defend)) {
        const name = react === 'block' ? 'block' : react === 'dodge' ? 'dodge_back' : react;
        bt.b.move(tc - (MOVES[name].ready ?? 2) / 24, name);              // 防守要在接触前就位
        landed = name === 'block';
      } else if (typeof react === 'function') react(bt.b, tc);
      else bt.b.move(tc, react);
    }
    const level = bt.level ?? r.level ?? 'hit';
    if (fx && (r.point || bt.point)) fx.add(tc, bt.point || r.point, landed ? (react === 'block' ? 'clash' : level) : 'none', { glyph: landed && react !== 'block' ? bt.glyph : null });
    if (D && landed && level === 'heavy') D.cue(tc, 'impact_heavy');
    else if (D && landed && level !== 'none') D.cue(tc, level === 'clash' || react === 'block' ? 'impact_light' : 'impact_medium', { v: 0.8 });
    out.push({ ...r, tc, landed });
  }
  return out;
}

module.exports = { Actor2, exchange, MOVES, FightFX, drawWeapon, weaponLine };
