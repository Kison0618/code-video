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
//   hip：相对起始胯，x 沿朝向、y 向下为正，单位 H；hipY：胯离地的绝对高度（单位 H，写了就覆盖 hip 的 y，架势用）
//   lean / head：度（lean 是绝对值，正 = 往前倾）
//   F / B：前手 / 后手，相对肩膀（同 hand 的 'pose' 模式：[朝前, 朝下]，世界方向，不跟着前倾转），单位 H。兵器沿"肘→手"方向伸出去
//   fF / fB：前脚 / 后脚，x 相对起始胯（沿朝向），y 离地高度（向上为正），单位 H
//   e：从上一个姿势过来的缓动（默认 'out'：一开始最快——"一下到位"）；hit：这一帧是接触帧
//   st：这一帧允许手脚拉长到几倍（极限姿势"作弊"，例如 1.4；招式结束后自动回到 1）
//   wa：剑的角度（度，朝向坐标：0 = 指向前方，90 = 朝天，−90 = 朝地，180 / −180 = 指向身后）。不写就沿"肘→手"方向（第 7 轮以前的做法，
//       只适合刺）；写了剑的角度就和前臂无关，能做出劈、撩、横扫的大弧线。招式结束后保持"相对前臂"的角度（人被打飞时剑跟着手转）。
//       角度可以超过 ±180（转一整圈就写 −200），在 key 之间按数值线性 / 缓动插值，不自动取近路
//   wl：剑看起来的长度倍数（默认 1）。横扫时剑指向镜头，写 0.3 左右就是"透视缩短"；招式最后一个 key 要回到 1
//   h：前手的位置 [在胯前多少, 离地多高]（单位 H），代替 F 写，按这一帧的胯高和前倾自动换算（设计劈砍时比 F 直观）
//   g2：双手握剑，两手间距（单位 H，0.07 左右）。写了就按这一帧的 F 和 wa 自动算后手 B（后手在剑柄末端）
//   fr：true 时这一帧的 fF / fB 改成按身体写（[沿身体朝前, 沿身体朝上]，相对这一帧的胯，跟着 lean 转；站直时 [0.2, −0.36] = 脚在胯前 0.2、下 0.36），空中翻滚用
//   slide：true 时从上一个 key 到这一帧脚贴地滑（滑退、被打得往后蹭），不自动抬脚
//   没写某只脚、胯又走得离它太远（腿够不着）时，自动在那个 key 补一步（自动跟脚）
//   turn：true 时在这一帧转身（朝向翻过去，1 帧）。之后这一招的 F / B / lean / wa 按新朝向写；hip / fF / fB 仍按招式开始时的朝向写
//   没写的通道保持上一个值；第一个 key 之前从当前状态出发。
//   招式级 behind: [f0, f1]（第 10 轮）：这几帧兵器画在身体后面（缠头裹脑刀背贴后背）；场景里用 a.weaponBehind(ta) 决定先画人还是先画刀
//
// 单手持刀剑（第 10 轮，blade1）：actor.blade = { kind: 'jian' | 'dao', tassel, zhi } 就按真刀剑画（剑柄、护手、剑身 / 单刃刀身、剑穗、
//   握着剑柄的拳头、空手捏剑指），见下面"刀剑的画法"；肘往哪边弯、刀刃朝哪边按剑角自动选（gripGrid，见"持剑"）。
//   兵器脱手（被磕飞、插地、踢起来、接住；断刀头飞出去再掉下来）用 FlyBlade；慢镜头用 clock.slow（actor2.js 的 Clock）
'use strict';
const fs = require('fs'), path = require('path');
const K = require('./core');
const { lerp, E, clamp } = K;
const { Actor2 } = require('./acting');
const { P } = require('./rig');
const { body } = require('./rig2');

const A = Actor2.prototype;
const MOVES = JSON.parse(fs.readFileSync(path.join(__dirname, '../../analysis/fight_moves.json'), 'utf8')).moves;

// 一个通道（一串 [时间, 值, 缓动]）在 t 时的值
//   e: 'thru'（第 11 轮）：这一段用 Catmull-Rom 样条"穿过"关键帧——速度在 key 处连续，不像 'out' 那样每个 key 都"到位 → 停 → 再起"。
//   连贯的挥剑（蓄 → 挥 → 收）把中间几个 key 写成 thru，只有最后一个 key 用 out / inOut 收住；接触帧照样精确经过
function chan(list) {
  const val = (v, n) => Array.isArray(v) ? v[n] : v;
  const tangent = (i, n) => {                                              // 第 i 个 key 处的斜率（有限差分，两头单边）
    const a = list[Math.max(0, i - 1)], b = list[Math.min(list.length - 1, i + 1)], c = list[i];
    const dt = b[0] - a[0]; if (dt <= 1e-6) return 0;
    const m = (val(b[1], n) - val(a[1], n)) / dt;
    if (a === c || b === c) return m;
    // 保单调（Fritsch–Carlson）：key 两边一升一降（这个 key 是转折点）斜率取 0，不然样条会冲过头（剑尖插地、手甩过位）；斜率也不超过两边平均速度的 3 倍
    const d1 = (val(c[1], n) - val(a[1], n)) / Math.max(1e-6, c[0] - a[0]), d2 = (val(b[1], n) - val(c[1], n)) / Math.max(1e-6, b[0] - c[0]);
    if (d1 * d2 <= 0) return 0;
    return Math.sign(m) * Math.min(Math.abs(m), 3 * Math.abs(d1), 3 * Math.abs(d2));
  };
  return t => {
    if (t <= list[0][0]) return list[0][1];
    for (let i = 1; i < list.length; i++) {
      const [t1, v1, e] = list[i];
      if (t <= t1) {
        const [t0, v0] = list[i - 1], h = Math.max(1e-6, t1 - t0);
        if (e === 'thru') {
          const u = clamp((t - t0) / h), u2 = u * u, u3 = u2 * u;
          const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
          const one = n => h00 * val(v0, n) + h10 * h * tangent(i - 1, n) + h01 * val(v1, n) + h11 * h * tangent(i, n);
          return Array.isArray(v0) ? v0.map((_, n) => one(n)) : one(0);
        }
        const u = (E[e] || E.out)((t - t0) / h);
        return Array.isArray(v0) ? v0.map((x, n) => lerp(x, v1[n], u)) : lerp(v0, v1, u);
      }
    }
    return list[list.length - 1][1];
  };
}

// —— 剑决定手（第 11 轮）——
// 第 10 轮的问题：h（手在哪）和 wa（剑指哪）是分开手写的两个数，腕角（剑和前臂的夹角）没人管，blade1 里主角 22%、强者 41% 的帧腕角超过 60°，
//   剑看起来是粘在手腕上转，不是握在手里。真人握剑：腕的伸屈 ±30°、尺桡偏 ±40°，侧视图里剑和前臂的夹角舒服的范围在 45° 以内。
// 做法：剑的线（过设计的手位、角度 wa）是设计意图，不动；手沿着这条线滑（最多 ±slide H），两种肘向里挑一个，让腕角回到 wr（默认 ≤ WR 就行），
//   滑得越少越好。actor.blade.solve = true | { wr: 45, slide: 0.2 } 打开；招式级 "solve": false 关掉（抱剑礼这种反握）；key 级 wr 指定腕角（挂剑写 80）
// 肘向连续选（第 11 轮）：bend 在 −1…1 里挑（ik2 支持小数 = 肘转出画面），让腕角 ≤ WR（或 ≈ wr），同时离 prev 近（不跳）、平手时偏向默认 +1。
//   p：手相对肩（[朝前, 朝下]，单位 H）；wa：剑角；返回 { bend, w = 腕角超标量 }
function bestBend(p, wa, WR, wr, prev = 1, kPrev = 0) {
  const Lu = P.upper, Lf = P.fore, d = clamp(Math.hypot(p[0], p[1]), Math.abs(Lu - Lf) + 1e-3, (Lu + Lf) * 0.999);
  const a = Math.atan2(p[1], p[0]), A = Math.acos(clamp((Lu * Lu + d * d - Lf * Lf) / (2 * Lu * d), -1, 1));
  const ux = Math.cos(a), uy = Math.sin(a), c = Lu * Math.cos(A), sA = Lu * Math.sin(A), hx = d * ux, hy = d * uy;
  let best = null;
  for (let i = -20; i <= 20; i++) {
    const b = i / 20, ex = c * ux - b * sA * uy, ey = c * uy + b * sA * ux;
    const fa = Math.atan2(-(hy - ey), hx - ex) * 180 / Math.PI, dev = Math.abs(wrap(wa - fa));
    const w = wr == null ? Math.max(0, dev - WR) : Math.abs(dev - wr);
    const cost = w * w + kPrev * (b - prev) * (b - prev) + 20 * (1 - b) * (1 - b);
    if (!best || cost < best.cost) best = { cost, bend: b, w };
  }
  return best;
}
function solveGrip(F, wa, wr, WR, SL) {
  const u = [Math.cos(wa * Math.PI / 180), -Math.sin(wa * Math.PI / 180)];   // 剑的方向（[朝前, 朝下]，单位 H）
  let best = null;
  for (let i = -20; i <= 20; i++) {
    const s = SL * i / 20, p = [F[0] + s * u[0], F[1] + s * u[1]], d = Math.hypot(p[0], p[1]);
    if (s > 0 && u[1] > 0.4) continue;                                   // 剑尖朝下时手不往剑尖那头滑（会把剑尖压进地里）
    if (d > (P.upper + P.fore) * 0.995 || d < Math.abs(P.upper - P.fore) + 0.01) continue;
    const w = bestBend(p, wa, WR, wr).w, cost = w * w + 2500 * s * s;   // 滑 0.2H 的代价 ≈ 腕角差 10°
    if (!best || cost < best.cost) best = { cost, p, w, s };
  }
  return best ? best.p : F;
}

// 此刻胯的实际位置（精确路径进行中就取路径上的值，否则取目标）
A.hipNow = function (t) { const L = this.paths.hip; for (let n = L.length - 1; n >= 0; n--) if (t >= L[n].t0 && t < L[n].t1) return L[n].fn(t); return this.hipT.at(t); };

A.keys = function (t0, keys, o = {}) {
  const D = o.dir ?? this.dirAt(t0), H = this.H, fps = o.fps ?? 24, sc = o.slow ?? 1;
  // 起点 = 此刻的实际姿势：上一招的精确路径还没走完（招式叠着接）时取路径上此刻的值，不然人会被拽回上一招开始前的位置
  const pathNow = ch => { const L = this.paths[ch]; for (let n = L.length - 1; n >= 0; n--) if (t0 >= L[n].t0 && t0 < L[n].t1) return L[n].fn(t0); return null; };
  const footNow = f => { let m = null; for (const x of this.footModes[f]) if (x.t <= t0) m = x; return m && m.mode === 'path' ? m.fn(t0) : this.feet[f].target(t0); };
  const fw = { F: footNow('F'), B: footNow('B') };
  let hip0 = pathNow('hip') || this.hipT.at(t0);
  const lean0 = pathNow('lean') ?? this.leanT.at(t0), head0 = this.headT.at(t0);
  const lw = 360 * Math.round(lean0 / 360);
  // 弹簧段的胯会被"脚够得着"约束压低（actor2：脚踩地够不到时胯往下沉）。招式从约束后的实际高度出发，不然第一帧胯会往上跳
  if (!pathNow('hip')) {
    const LEG = (P.thigh + P.shin) * H * 0.97;
    hip0 = [hip0[0], hip0[1]];
    for (const f of ['F', 'B']) {
      let m = null; for (const x of this.footModes[f]) if (x.t <= t0) m = x;
      const p = fw[f], dx = p[0] - hip0[0];
      if (m && m.mode === 'ground' && p[1] > -4 && Math.abs(dx) < LEG) hip0[1] = Math.max(hip0[1], p[1] - Math.sqrt(LEG * LEG - dx * dx));
    }
  }
  // hipY：胯离地的绝对高度（单位 H）。hip 的 y 是相对起点的，架势类招式连着调用会一次比一次低；写 hipY 就总是回到同一高度
  if (keys.some(k => k.hipY !== undefined)) { let px = 0; keys = keys.map(k => { const hx = k.hip ? k.hip[0] : px; px = hx; return k.hipY === undefined ? k : { ...k, hip: [hx, (-k.hipY * H - hip0[1]) / H] }; }); }
  // h：手的位置直接写成"在胯前多少、离地多高"（单位 H），按这一帧的胯高和前倾换算成 F（肩膀 = 胯 + 0.255H 沿上身）
  if (keys.some(k => k.h)) {
    let hy = -hip0[1] / H, ln = lean0;
    keys = keys.map(k => {
      if (k.hip) hy = -(hip0[1] + k.hip[1] * H) / H;
      if (k.lean !== undefined) ln = k.lean;
      if (!k.h) return k;
      const a = ln * Math.PI / 180, sh = (P.torso - P.shoulderDrop);
      return { ...k, F: [k.h[0] - sh * Math.sin(a), hy + sh * Math.cos(a) - k.h[1]] };
    });
  }
  // fr：这一帧的 fF / fB 按身体写（[沿身体朝前, 沿身体朝上]，相对这一帧的胯，跟着 lean 一起转）——空中翻滚、被打飞时脚跟着身体走
  if (keys.some(k => k.fr)) {
    let hx = 0, hy = -hip0[1] / H, ln = lean0;
    keys = keys.map(k => {
      if (k.hip) { hx = k.hip[0]; hy = -(hip0[1] + k.hip[1] * H) / H; }
      if (k.lean !== undefined) ln = k.lean;
      if (!k.fr) return k;
      const a = ln * Math.PI / 180, cv = ([u, v]) => [hx + u * Math.cos(a) + v * Math.sin(a), hy - u * Math.sin(a) + v * Math.cos(a)];
      return { ...k, fF: k.fF && cv(k.fF), fB: k.fB && cv(k.fB) };
    });
  }
  // 剑决定手（第 11 轮，见 solveGrip）：有剑角的 key，手沿剑的线滑到腕角合理的位置
  const GS = this.blade && this.blade.solve && o.solve !== false, TH = !!(this.blade && this.blade.thru) && o.thru !== false;
  if (GS && keys.some(k => k.wa !== undefined)) {
    const cfg = typeof GS === 'object' ? GS : {}, WR = cfg.wr ?? 45, SL = cfg.slide ?? 0.2;
    const wl = keys.filter(k => k.wa !== undefined).map(k => [k.f, k.wa, k.e]), wc = chan(wl), f0 = wl[0][0];
    // 接触帧（攻方 hit、守方挡的那一帧 = ready）手不滑：剑的线不变，但手沿线滑了，两把剑碰的位置就跟着沿剑移（滑 0.15H = 碰点挪 1/4 剑长，会变成剑柄磕剑柄）
    keys = keys.map(k => (!k.F || k.f < f0 || k.wr === null) ? k : { ...k, F: solveGrip(k.F, wc(k.f), k.wr, WR, (k.hit || (o.blockF != null && k.f === o.blockF)) ? 0 : SL) });
  }
  // g2：双手握剑 → 后手跟着前手和剑的角度走（后手在剑柄末端，沿剑往回 g2）
  if (keys.some(k => k.g2)) { let F = null, wa = null; keys = keys.map(k => { F = k.F ?? F; wa = k.wa ?? wa; if (!k.g2 || !F || wa === null) return k; const a = wa * Math.PI / 180; return { ...k, B: [F[0] - k.g2 * Math.cos(a), F[1] + k.g2 * Math.sin(a)] }; }); }
  const T = k => t0 + k.f / fps * sc, tE = T(keys[keys.length - 1]);
  // turn：这一帧转身（朝向翻过去）
  { let d = D; for (const k of keys) if (k.turn) { d = -d; this.turn(T(k), d); } }
  const build = (name, start) => {
    const L = start === undefined ? [] : [[t0, start, 'linear']];
    const ks = keys.filter(k => k[name] !== undefined);
    // 默认 thru（第 11 轮，actor.blade.thru = true；招式级 "thru": false 关掉）：只管手和剑（F / B / wa / wl）：没写 e 的 key，除了这个通道的最后一个，都用样条穿过——剑路中间不停顿；最后一个照样 out 收住。
    //   胯和身体不改：招式常被下一招中途接走，胯用 out 早到位，换成样条会让人停在半路、两人间距变了（blade2 f164 间距 1.07→0.95H，剑柄磕剑）
    ks.forEach((k, i) => L.push([T(k), k[name], k.e || (TH && /^(F|B|wa|wl)$/.test(name) && i < ks.length - 1 ? 'thru' : 'out'), k.slide]));   // 第 4 项：slide（脚贴地滑，不抬脚）
    return L.length ? L : null;
  };
  // 胯、上身：精确路径
  const hipC = chan(build('hip', [0, 0]));
  const hipW = s => { const v = hipC(s); return [hip0[0] + D * v[0] * H, hip0[1] + v[1] * H]; };
  this.path('hip', t0, tE, hipW).hip(tE, hipW(tE));
  const lk = build('lean', lean0 - lw);
  if (lk) { const lc = chan(lk); this.path('lean', t0, tE, s => lw + lc(s)); this.lean(tE, lw + lc(tE)); }
  // 手脚拉长（只在招式这段时间内有效）
  const sk = build('st', 1);
  if (sk) this.stSegs.push([t0, tE, chan(sk)]);
  // 剑的角度 / 看起来的长度：起点要等模拟完才知道（此刻剑的实际角度），所以只登记，画的时候再算（swordAng / bladeK）
  const wk = build('wa'), lk2 = build('wl');
  if (wk) (this.waSegs = this.waSegs || []).push({ t0, tE, L: wk });
  if (lk2) (this.wlSegs = this.wlSegs || []).push({ t0, tE, L: lk2 });
  // 头：交给头的轨道（软一点，像原片头会晚半拍）
  for (let i = 0, prev = t0; i < keys.length; i++) if (keys[i].head !== undefined) { const tk = T(keys[i]); this.head(prev, keys[i].head, Math.max(0.001, tk - prev), 'out'); prev = tk; }
  // 手：'pose' 模式（精确、相对肩膀）
  for (const h of ['F', 'B']) {
    const L = build(h);
    if (!L) continue;
    const hc = chan(L);
    this.hand(h, t0, 'pose', s => hc(s), Math.min(0.1, L[0][0] - t0));   // 第一个 key 的那一帧手必须到位（1 帧就打到的招式，默认 0.1 秒过渡会让手晚 2 帧）
  }
  // 自动跟脚：这一招没写某只脚，而胯走得离这只着地的脚太远（腿够不着），就在那个 key 补一步，落在舒适距离（前脚胯前 0.2H、后脚胯后 0.21H）
  //   连着出招时人会越走越远，没写的那只脚原来会被拖着、腿拉直或者胯被压低
  if (!o.follow) {
    const LEG = (P.thigh + P.shin) * H * 0.97;
    for (const f of ['F', 'B']) {
      const nm = 'f' + f;
      if (keys.some(k => k[nm] !== undefined) || fw[f][1] < -4) continue;
      let px = fw[f][0], prev = null;
      const add = [];
      for (const k of keys) {
        const tk = T(k), hp = hipW(tk), stk = k.st || 1;
        if (-hp[1] < LEG * stk && Math.abs(px - hp[0]) > Math.sqrt(Math.max(0, (LEG * stk) ** 2 - hp[1] * hp[1])) * 0.98) {
          const nx = hp[0] + D * (f === 'F' ? 0.2 : -0.21) * H;
          if (prev) add.push([prev, (px - hip0[0]) * D / H]);
          add.push([k, (nx - hip0[0]) * D / H]); px = nx;
        }
        prev = k;
      }
      if (add.length) { const m = new Map(add); keys = keys.map(k => m.has(k) ? { ...k, [nm]: [m.get(k), 0] } : k); }
    }
  }
  // 脚：精确的世界坐标轨迹；水平移动时自动抬一点脚（key 写了 slide: true 的那一段贴地滑）
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
      const arc = Math.min(0.08, Math.abs(b[0] - a[0]) * 0.25) * Math.sin(Math.PI * u) * (a[1] <= 0.001 && b[1] <= 0.001 && !L[i][3] ? 1 : 0);
      return [hip0[0] + D * v[0] * H, -(v[1] + arc) * H];
    };
    this.footModes[f] = this.footModes[f].filter(m => m.t <= t0);                  // 这一招接管这只脚：上一招排在后面的"落地"作废（招式叠着接时，不然脚会被拽回去）
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
  if (o.sfx !== false && contact === null && keys.some(k => k.whoosh)) this.sfx(T(keys.find(k => k.whoosh)), this.blade ? 'sword_whoosh' : 'whoosh_short', { v: 0.5 });
  return { t: tE, contact, point, x: hipW(tE)[0], D };
};


// 按名字调用招式（analysis/fight_moves.json）
A.move = function (t, name, o = {}) {
  const m = MOVES[name];
  if (!m) throw new Error('没有这个招式：' + name);
  let keys = m.keys;
  const reach = o.reach ?? m.reach;                 // o.reach 覆盖招式自带的出手距离（例如换了更长的兵器）
  // 打中对方：按招式的出手距离（reach，单位 H）和两人此刻的距离，把差值加到接触帧之前的前移里（够不着就多冲一点，太近就少走一点）
  //   reach 的意思：接触时两人胯的间距 = reach − 招式自己在接触帧的胯前移。兵器招式的 reach 含兵器长度，用 tools/contact_check.js 校
  //   o.extra：直接给出"接触前多走多少"（单位 H，可负）。两个人同时冲向对方时 to 算不准（对方也在动），由场景按两人的终点算好传进来
  let extra = 0;
  if (o.extra !== undefined || (o.to && reach)) {
    const D = this.dirAt(t), gap = o.to ? (o.to.hipNow(t)[0] - this.hipNow(t)[0]) * D / this.H : 0;
    extra = o.extra ?? clamp(gap - reach, -0.3, 0.9);
    const hi = keys.findIndex(k => k.hit);
    if (hi >= 0 && Math.abs(extra) > 0.02) keys = keys.map((k, i) => {
      const u = i >= hi ? 1 : clamp(k.f / keys[hi].f, 0, 1), add = v => v && [v[0] + extra * u, v[1]];
      return { ...k, hip: add(k.hip) ?? (i >= hi ? undefined : k.hip), fF: k.fF && !k.fr ? add(k.fF) : k.fF, fB: k.fB && !k.fr ? add(k.fB) : k.fB };
    });
    if (hi >= 0 && Math.abs(extra) > 0.02 && !keys[hi].hip) keys[hi] = { ...keys[hi], hip: [extra, 0.05] };
  }
  const hiF = keys.find(k => k.hit);
  const r = this.keys(t, keys, { ...o, solve: m.solve === false ? false : o.solve, thru: m.thru === false ? false : o.thru, blockF: m.block ? (m.ready ?? 2) : null, follow: o.extra === undefined && o.to && reach && hiF ? { f: hiF.f + 1, dx: clamp((o.to.hipNow(t)[0] - this.hipNow(t)[0]) * this.dirAt(t) / this.H - reach, -0.3, 0.9) } : null });
  if (m.whoosh !== undefined && o.sfx !== false) this.sfx(t + m.whoosh / 24 * (o.slow ?? 1), this.blade ? 'sword_whoosh' : 'whoosh_short', { v: m.whooshV ?? 0.6 });   // 拿刀剑的（.blade）挥起来是更细更尖的“咻”
  // behind: [从第几帧, 到第几帧]——这段时间兵器画在身体后面（缠头裹脑时刀背贴着后背、背剑）。场景用 a.weaponBehind(ta) 决定先画谁
  if (m.behind) (this.behindSegs = this.behindSegs || []).push([t + m.behind[0] / 24 * (o.slow ?? 1), t + m.behind[1] / 24 * (o.slow ?? 1)]);
  return { ...r, react: m.react, level: m.level, reach, extra };
};

// 前臂的角度（朝向坐标，度）
//   用"默认肘向"的关节（raw）：剑的角度定义不随自动换肘变（换肘只改手臂怎么画，手和剑的位置不动）
A.forearmAng = function (ta, hand = 'F') {
  const j = this.jointsAt(ta, true), L = j[hand === 'F' ? 'aF' : 'aB'];
  return Math.atan2(-(L[2][1] - L[1][1]), (L[2][0] - L[1][0]) * j.dir) * 180 / Math.PI;
};
// 剑此刻的角度（朝向坐标，度）；没写过 wa 返回 null（沿前臂）
A.swordAng = function (ta) {
  const S = this.waSegs;
  if (!S || !S.length) return null;
  let seg = null; for (const g of S) if (g.t0 <= ta && (!seg || g.t0 >= seg.t0)) seg = g;
  if (!seg) return null;
  if (seg.rec !== this.rec) { seg.rec = this.rec; seg.fn = null; seg.rel = null; }   // 重新模拟过就重算
  if (ta <= seg.tE) {
    if (!seg.fn) {
      let a0 = this.swordAng(seg.t0 - 1e-4); if (a0 === null) a0 = this.forearmAng(seg.t0);
      const v1 = seg.L[0][1]; a0 += 360 * Math.round((v1 - a0) / 360);
      seg.fn = chan([[seg.t0, a0, 'linear'], ...seg.L]);
    }
    return seg.fn(ta);
  }
  if (seg.rel === null) seg.rel = this.swordAng(seg.tE) - this.forearmAng(seg.tE);       // 招式结束后：保持相对前臂的角度
  return this.forearmAng(ta) + seg.rel;
};
A.bladeK = function (ta) {
  const S = this.wlSegs;
  if (!S) return 1;
  let seg = null; for (const g of S) if (g.t0 <= ta && ta <= g.tE && (!seg || g.t0 >= seg.t0)) seg = g;
  if (!seg) return 1;
  if (!seg.fn) seg.fn = chan([[seg.t0, this.bladeK(seg.t0 - 1e-4), 'linear'], ...seg.L]);
  return seg.fn(ta);
};

// —— 持剑（第 10 轮）：肘的朝向自动选 + 刀刃朝哪边 ——
// 问题：肘永远往后下方弯，剑举过头顶、提腕下刺时前臂和剑折成 110°–150°（手腕"断了"，剑像指回肘）。
// 做法：手和剑的位置都不动，只换肘往哪边弯——每 1/240 秒比较两种肘位下"前臂 → 剑"的夹角（腕角），
//   默认肘朝下（+1）；+1 的腕角 > 105° 且翻过去（−1）能小 30° 以上就翻；翻过去以后 +1 的腕角回到 60° 以内、或者 −1 比 +1 差 20° 以上才翻回来。
//   结果按 ±1.5 帧滑动平均 → 换肘用 3 帧，手臂看起来是绕着"肩→手"的轴转过去（ik2 的 bend 支持小数）。
//   后手：双手握（后手贴着剑柄）时同样按剑选；单手持剑时后手不管（剑指、护手）。
// 刀（blade.kind = 'dao'）：单刃，刃朝挥动的方向——剑角在减小（往前下劈）刃在"剑角 − 90°"那边，在增大（上撩）就翻到另一边，
//   翻刃同样按 ±1 帧平滑（刃朝镜头的那一下刀看起来变窄，像真的转了刀）
const GG = 1 / 240;
const wrap = d => ((d + 540) % 360) - 180;
A.gripGrid = function () {
  if (this._gg && this._gg.rec === this.rec) return this._gg;
  const N = this.N, H = this.H, raw = { F: new Float32Array(N), B: new Float32Array(N), E: new Float32Array(N), Z: new Float32Array(N) };
  // 自动前后（第 11 轮，actor.blade.autoBehind）：剑身穿过头的圆、或者剑尖指向身后且穿过躯干时，这一帧剑画在身体后面——2D 侧视图里"剑在身体另一侧"的深度
  const seg = (p, a, b) => { const vx = b[0] - a[0], vy = b[1] - a[1], u = clamp(((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / Math.max(1e-9, vx * vx + vy * vy)); return Math.hypot(a[0] + vx * u - p[0], a[1] + vy * u - p[1]); };
  const cross = (a, b, c, d) => { const o = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]); return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0; };
  let sF = 1, sB = 1, sE = 1, prevA = null;
  const len = ta => (typeof this.weapon === 'function' ? this.weapon(ta) : this.weapon) || 0;
  const pick = (cur, w1, w2) => cur > 0 ? (w1 > 105 && w2 < w1 - 30 ? -1 : 1) : (w1 < 60 || w2 > w1 + 20 ? 1 : -1);
  for (let i = 0; i < N; i++) {
    const t = i * GG, wa = len(t) > 0 ? this.swordAng(t) : null;
    if (wa === null) { sF = 1; sB = 1; }
    else {
      const s = this.stateAt(t); s.st = this.stAt(t);
      const j1 = body(s, H, s.dir), j2 = body({ ...s, eF: -1, eB: -1 }, H, s.dir), D = s.dir;
      const sw = Math.atan2(-Math.sin(wa * Math.PI / 180), D * Math.cos(wa * Math.PI / 180)) * 180 / Math.PI;   // 剑的世界角度
      if (this.blade && this.blade.autoBehind) {
        const hd = j1.aF[2], ux = Math.cos(sw * Math.PI / 180), uy = Math.sin(sw * Math.PI / 180), L = len(t) * H;
        const g = [hd[0] + ux * 0.04 * H, hd[1] + uy * 0.04 * H], tp = [hd[0] + ux * L, hd[1] + uy * L];
        const inHead = seg(j1.head, g, tp) < P.headR * H * 0.95, back = Math.cos(wa * Math.PI / 180) < -0.25;
        raw.Z[i] = inHead || (back && cross(g, tp, j1.hip, j1.neck)) ? 1 : 0;
      }
      const fa = L => Math.atan2(L[2][1] - L[1][1], L[2][0] - L[1][0]) * 180 / Math.PI;
      const SV = this.blade && this.blade.solve, WRg = (SV && SV.wr) || 45;
      // 前手：solve 打开时肘向连续选（bestBend），不然沿用两档迟滞 pick
      const rel = L => { const sh = L[0], hd = L[2]; return [D * (hd[0] - sh[0]) / H, (hd[1] - sh[1]) / H]; };
      if (SV) sF = bestBend(rel(j1.aF), wa, WRg, null, sF, 2000).bend;
      else sF = pick(sF, Math.abs(wrap(sw - fa(j1.aF))), Math.abs(wrap(sw - fa(j2.aF))));
      // 后手在剑柄上（离剑轴 < 0.05H，在前手后面 0.02–0.2H）才按剑选
      const h = j1.aF[2], b = j1.aB[2], ux = Math.cos(sw * Math.PI / 180), uy = Math.sin(sw * Math.PI / 180);
      const along = -((b[0] - h[0]) * ux + (b[1] - h[1]) * uy), off = Math.abs((b[0] - h[0]) * uy - (b[1] - h[1]) * ux);
      const onHilt = along > 0.02 * H && along < 0.2 * H && off < 0.05 * H;
      sB = !onHilt ? 1 : SV ? bestBend(rel(j1.aB), wa, WRg, null, sB, 2000).bend : pick(sB, Math.abs(wrap(sw - fa(j1.aB))), Math.abs(wrap(sw - fa(j2.aB))));
    }
    if (this.blade && this.blade.kind === 'dao') {
      const a = wa ?? this.forearmAng(t);
      if (prevA !== null) { const w = wrap(a - prevA) / GG; if (w < -250) sE = 1; else if (w > 250) sE = -1; }
      prevA = a;
    }
    raw.F[i] = sF; raw.B[i] = sB; raw.E[i] = sE;
  }
  const avg = (A, W) => { const o = new Float32Array(N); let acc = 0; for (let i = -W; i <= W; i++) acc += A[clamp(i, 0, N - 1)]; for (let i = 0; i < N; i++) { o[i] = acc / (2 * W + 1); acc += A[Math.min(N - 1, i + W + 1)] - A[Math.max(0, i - W)]; } return o; };
  this._gg = { rec: this.rec, F: avg(raw.F, 15), B: avg(raw.B, 15), E: avg(raw.E, 10), Z: raw.Z };
  return this._gg;
};
A.weaponBehind = function (ta) {
  if (this.behindSegs && this.behindSegs.some(([a, b]) => ta >= a && ta < b)) return true;
  if (!(this.blade && this.blade.autoBehind && this.rec && this.N)) return false;
  return this.gripGrid().Z[clamp(Math.round(ta / GG), 0, this.N - 1)] > 0.5;
};
A.elbowAt = function (ta) {
  if (!this.blade || this.blade.elbow === false || !this.rec || !this.N) return [1, 1];
  const g = this.gripGrid(), x = clamp(ta / GG, 0, this.N - 1.001), i = Math.floor(x), u = x - i;
  return [lerp(g.F[i], g.F[i + 1], u), lerp(g.B[i], g.B[i + 1], u)];
};
A.edgeAt = function (ta) {
  if (!this.rec || !this.N) return 1;
  const g = this.gripGrid(), x = clamp(ta / GG, 0, this.N - 1.001), i = Math.floor(x), u = x - i;
  return lerp(g.E[i], g.E[i + 1], u);
};

// —— 打击特效（原片实测：打中不停帧、不震屏；1 帧放射光 + 1–2 帧火花，命中本体再加一个结果字形 5 帧淡出）——
//   level：none 擦碰无光 / clash 兵器相碰 / hit 命中本体 / shot 子弹命中 / heavy 击倒打飞（再加 1 帧全屏白闪）
const F1 = 1 / 24;
class FightFX {
  constructor(H = 300) { this.H = H; this.list = []; }
  add(t, p, level = 'hit', o = {}) { if (level !== 'none' && p) this.list.push({ t, p, level, glyph: o.glyph, dir: o.dir ?? 1, seed: this.list.length * 7 + 3 }); return this; }
  // 打中时画面上下震 1–2 帧（约 0.02–0.05H，研究/动作逐帧_四集.md 规律 10）：返回此刻镜头的竖直偏移
  joltAt(t) { let y = 0; for (const e of this.list) { const age = t - e.t; if (age < 0 || age >= 2 * F1 || e.level === 'clash') continue; const k = e.level === 'heavy' ? 0.045 : 0.025; y = (age < F1 ? 1 : -0.5) * k * this.H; } return y; }
  flashAt(t) { let a = 0; for (const e of this.list) if (e.level === 'heavy' && t >= e.t && t < e.t + F1) a = 0.9; return a; }
  draw(ctx, t) {
    const H = this.H;
    for (const e of this.list) {
      const age = t - e.t;
      if (age < 0 || age > F1 * 8) continue;
      const p = typeof e.p === 'function' ? e.p() : e.p;           // 打击点可以是函数：模拟完才知道剑在哪（exchange 用剑的实际位置）
      if (!p) continue;
      const big = e.level === 'clash' ? 0.25 : e.level === 'shot' ? 0.3 : 0.4, r = big * H, rnd = K.mulberry32(e.seed);
      ctx.save(); ctx.translate(p[0], p[1]);
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
//   招式里写了 wa 就按 wa 的角度；wl 是透视缩短（横扫时剑指向镜头）
function weaponLine(actor, ta, len, hand = 'F') {
  if (len === undefined) len = typeof actor.weapon === 'function' ? actor.weapon(ta) : actor.weapon ?? 0.45;
  const j = actor.jointsAt(ta), L = j[hand === 'F' ? 'aF' : 'aB'], el = L[1], hd = L[2];
  const wa = hand === 'F' && actor.swordAng ? actor.swordAng(ta) : null, k = hand === 'F' && actor.bladeK ? actor.bladeK(ta) : 1;
  let dx, dy;
  if (wa === null) { dx = hd[0] - el[0]; dy = hd[1] - el[1]; }
  else { const a = wa * Math.PI / 180; dx = j.dir * Math.cos(a); dy = -Math.sin(a); }
  const n = Math.hypot(dx, dy) || 1, l = len * k * actor.H;
  return [hd, [hd[0] + dx / n * l, hd[1] + dy / n * l]];
}
// 两条线段之间最近的两点的中点（剑碰剑的位置）
function segMid(a, b, c, d) {
  let best = null;
  for (let i = 0; i <= 20; i++) {
    const u = i / 20, p = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u];
    const vx = d[0] - c[0], vy = d[1] - c[1], v = clamp(((p[0] - c[0]) * vx + (p[1] - c[1]) * vy) / Math.max(1e-9, vx * vx + vy * vy));
    const q = [c[0] + vx * v, c[1] + vy * v], dd = Math.hypot(p[0] - q[0], p[1] - q[1]);
    if (!best || dd < best[0]) best = [dd, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2]];
  }
  return best;
}
//   o.arc：弧形拖影（第 8 轮）——把最近 o.arc 秒（默认 1.5 帧）里剑扫过的面画成一片由淡到浓的月牙，只画剑的外 3/4。
//          写了 wa 的大弧线劈砍用它；不写就是原来的 1 帧扇面。o.arcFrom：月牙最早从这个时刻画起（剑一帧变长、瞬移这种跳变之前的位置不算）
// —— 刀剑的画法（第 10 轮）：剑柄、护手、剑身 / 刀身、剑穗、握着剑柄的拳头 ——
//   actor.blade = { kind: 'jian' | 'dao', color, tassel: '#d8402f'（剑穗颜色，不写不画）, zhi: true（空着的手捏剑指）}
//   剑长（actor.weapon）仍然是"手 → 剑尖"，打中 / 碰剑的判断不变；剑柄从手往后伸（双手握时伸到后手后面），护手在手前 0.03H
//   单位都是 H：
const BLADE = {
  jian: { w: 0.03, grip: 0.06, guard: 0.03, gw: 0.042, color: '#f0f0f0', gripColor: '#7a5c3e', guardColor: '#d9b45a' },   // 剑：直、双刃、剑尖收窄，有剑脊
  dao: { w: 0.034, grip: 0.07, guard: 0.025, gw: 0.034, color: '#f0f0f0', gripColor: '#5a4636', guardColor: '#c9a24a' },    // 刀：单刃、刀头宽、微弯，刃朝挥动方向
};
const bladeOf = b => ({ ...BLADE[b.kind || 'jian'], ...b });
// 画一把刀 / 剑：base = 握把上前手的位置（世界坐标），u = 朝剑尖的单位向量，L = 手到剑尖的长度（像素，已含透视缩短）
//   o.back：剑柄往手后伸多长（像素）；o.k：透视缩短；o.edge：刀刃朝向（−1…1，0 = 刃对着镜头）；o.dir：朝向
//   o.cut：刀断了——刀身只画到离手 o.cut 像素，断口斜切；o.from：只画 from 之后的那一截（飞出去的断刀头），不画柄和护手
function paintBlade(ctx, base, u, L, H, B, o = {}) {
  const k = o.k ?? 1, n = [-u[1], u[0]], g = (o.from ?? B.guard * H * k), P = (sv, off) => [base[0] + u[0] * sv + n[0] * off, base[1] + u[1] * sv + n[1] * off];
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (o.from === undefined) {                                           // 剑柄 + 剑首
    const back = o.back ?? B.grip * H * k, pe = P(-back, 0), pg = P(g, 0);
    ctx.strokeStyle = B.gripColor; ctx.lineWidth = 0.034 * H;
    ctx.beginPath(); ctx.moveTo(pe[0], pe[1]); ctx.lineTo(pg[0], pg[1]); ctx.stroke();
    ctx.fillStyle = B.guardColor; ctx.beginPath(); ctx.arc(pe[0], pe[1], 0.02 * H, 0, Math.PI * 2); ctx.fill();
  }
  const end = o.cut ?? L, col = o.color || B.color, wb = (o.width ?? B.w * H) / 2;
  const pts = [];
  if (B.kind === 'dao') {
    const e = (o.edge ?? 1) * (o.dir ?? 1), sp = 0.4 * wb, span = Math.max(1, L - B.guard * H * k);
    const we = sv => { const q = clamp((sv - B.guard * H * k) / span); return q < 0.8 ? wb + (0.9 * wb) * q / 0.8 : -sp + (1.9 * wb + sp) * Math.cos((q - 0.8) / 0.2 * Math.PI / 2); };
    const cv = sv => 0.035 * H * Math.pow(clamp((sv - B.guard * H * k) / span), 2);   // 刀身微弯：越往刀头越往刀背那边弯
    const N = 12, a0 = g, a1 = Math.min(end, L);
    const edgeL = [], spineL = [];
    for (let i = 0; i <= N; i++) { const sv = a0 + (a1 - a0) * i / N; edgeL.push(P(sv, e * (we(sv) - cv(sv)))); spineL.push(P(sv, -e * (sp + cv(sv)))); }
    if (o.cut !== undefined && o.cut < L) { edgeL[N] = P(a1 + 0.012 * H, e * (we(a1) - cv(a1))); spineL[N] = P(a1 - 0.012 * H, -e * (sp + cv(a1))); }   // 断口斜切
    pts.push(...edgeL, ...spineL.reverse());
  } else {
    const tl = Math.min(0.07 * H, (L - g) * 0.3);
    if (o.cut !== undefined && o.cut < L - tl) pts.push(P(g, wb), P(end + 0.01 * H, wb * 0.85), P(end - 0.01 * H, -wb * 0.85), P(g, -wb));
    else pts.push(P(g, wb), P(L - tl, wb * 0.72), P(L, 0), P(L - tl, -wb * 0.72), P(g, -wb));
  }
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 0.008 * H;
  ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts) ctx.lineTo(q[0], q[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (B.kind !== 'dao' && o.cut === undefined) {                          // 剑脊
    const r0 = P(g + 0.01 * H, 0), r1 = P(L - 0.05 * H, 0);
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.lineWidth = 0.006 * H; ctx.beginPath(); ctx.moveTo(r0[0], r0[1]); ctx.lineTo(r1[0], r1[1]); ctx.stroke();
  }
  if (o.from === undefined) {                                           // 护手（剑格 / 刀盘）
    const a = P(g, -B.gw * H), b = P(g, B.gw * H);
    ctx.strokeStyle = B.guardColor; ctx.lineWidth = (B.kind === 'dao' ? 0.03 : 0.022) * H;
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
  }
  ctx.restore();
}
const weaponLenOf = (actor, ta) => (typeof actor.weapon === 'function' ? actor.weapon(ta) : actor.weapon ?? 0.45);
function drawBlade(ctx, actor, ta, o) {
  const B = bladeOf(o.blade || actor.blade), H = actor.H, len = o.len ?? weaponLenOf(actor, ta);
  const j = actor.jointsAt(ta), fist = K.rgba(o.fist || actor.color);
  const dot = (p, r) => { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fill(); };
  if (!(len > 0)) { ctx.fillStyle = fist; dot(j.aF[2], 0.03 * H); return; }   // 手里没剑：只画拳头
  const [hd, tip] = weaponLine(actor, ta, len, 'F'), k = actor.bladeK ? actor.bladeK(ta) : 1;
  const Lp = Math.hypot(tip[0] - hd[0], tip[1] - hd[1]) || 1e-6, u = [(tip[0] - hd[0]) / Lp, (tip[1] - hd[1]) / Lp];
  const bh = j.aB[2], along = -((bh[0] - hd[0]) * u[0] + (bh[1] - hd[1]) * u[1]), off = Math.abs((bh[0] - hd[0]) * u[1] - (bh[1] - hd[1]) * u[0]);
  const two = along > 0.02 * H && along < 0.22 * H && off < 0.06 * H;    // 后手贴着剑柄 = 双手握：剑柄伸到后手后面
  const back = Math.max(B.grip * H * k, two ? along + 0.04 * H : 0);
  const cut = B.broken && ta >= B.broken.t ? B.broken.at * H * k : undefined;
  // 剑穗：挂在剑首，跟着剑首最近 0.05 / 0.11 秒的位置甩（剑停下就垂下来）
  if (B.tassel && cut === undefined) {
    const anc = t => { const [h, tp] = weaponLine(actor, t, len, 'F'), l = Math.hypot(tp[0] - h[0], tp[1] - h[1]) || 1; return [h[0] - (tp[0] - h[0]) / l * (back + 0.02 * H), h[1] - (tp[1] - h[1]) / l * (back + 0.02 * H)]; };
    const a0 = anc(ta), a1 = anc(ta - 0.05), a2 = anc(ta - 0.11), sg = 0.065 * H;
    const toward = (from, to, l) => { const d = Math.hypot(to[0] - from[0], to[1] - from[1]) || 1; return [from[0] + (to[0] - from[0]) / d * l, from[1] + (to[1] - from[1]) / d * l]; };
    const m = toward(a0, [a0[0] + (a1[0] - a0[0]) * 0.9, a0[1] + (a1[1] - a0[1]) * 0.9 + sg * 0.6], sg);
    const e = toward(m, [m[0] + (a2[0] - a0[0]) * 0.7, m[1] + (a2[1] - a0[1]) * 0.7 + sg * 0.8], sg);
    ctx.save(); ctx.strokeStyle = B.tassel; ctx.lineCap = 'round'; ctx.lineWidth = 0.011 * H;
    ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.quadraticCurveTo(m[0], m[1], (m[0] + e[0]) / 2, (m[1] + e[1]) / 2); ctx.lineTo(e[0], e[1]); ctx.stroke();
    const da = Math.atan2(e[1] - m[1], e[0] - m[0]); ctx.lineWidth = 0.008 * H;
    for (const s of [-0.3, 0, 0.3]) { ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[0] + Math.cos(da + s) * 0.04 * H, e[1] + Math.sin(da + s) * 0.04 * H); ctx.stroke(); }
    ctx.restore();
  }
  paintBlade(ctx, hd, u, Lp, H, B, { back, k, color: o.color, width: o.width, edge: actor.edgeAt ? actor.edgeAt(ta) : 1, dir: j.dir, cut });
  ctx.fillStyle = fist; dot(hd, 0.032 * H);
  if (two) dot(bh, 0.032 * H);
  else if (B.zhi) {                                                     // 剑指：食指、中指并拢伸直，顺着前臂
    const L = j.aB, d = Math.hypot(L[2][0] - L[1][0], L[2][1] - L[1][1]) || 1, q = [(L[2][0] - L[1][0]) / d, (L[2][1] - L[1][1]) / d];
    ctx.save(); ctx.strokeStyle = fist; ctx.lineCap = 'round'; ctx.lineWidth = 0.02 * H;
    ctx.beginPath(); ctx.moveTo(L[2][0], L[2][1]); ctx.lineTo(L[2][0] + q[0] * 0.05 * H, L[2][1] + q[1] * 0.05 * H); ctx.stroke(); ctx.restore();
  } else dot(bh, 0.03 * H);
}

// 脱手飞出去的刀剑（第 10 轮：被磕飞、插地、被踢起来、接住；刀断了飞出去的刀头）
//   const fb = new FlyBlade(hero.blade, 0.6, hero.H);
//   fb.toss(t0, p0, a0, T, p1, a1, spins)   // t0 时握把在 p0、世界角度 a0（度，画布坐标：0 = 向右，90 = 向下）；抛物线飞 T 秒到 p1、角度 a1（多转 spins 圈）
//   fb.stick(dur)                            // 落下来以后插在地上（剑尖入地，余震晃 dur 秒）；fb.hide(t) 之后不画（被接住了）
//   p0 / p1 / a0 / a1 都可以是函数（等角色模拟完再算：例如"主角那一刻的手在哪"）
class FlyBlade {
  constructor(blade, len, H, o = {}) { this.B = bladeOf(blade); this.len = len; this.H = H; this.ph = []; this.tHide = 1e9; this.o = o; }
  toss(t0, p0, a0, T, p1, a1, spins = 0) { this.last = { t0, T, p0, a0, p1, a1, spins }; this.ph.push(this.last); this.ph.sort((a, b) => a.t0 - b.t0); return this; }
  stick(dur = 0.35, amp = 7) { this.last.wob = { dur, amp }; return this; }       // 加在上一次 toss 上
  hide(t) { this.tHide = t; return this; }
  get(v) { return typeof v === 'function' ? v() : v; }
  state(ta) {
    if (ta >= this.tHide) return null;
    let ph = null; for (const p of this.ph) if (p.t0 <= ta) ph = p;
    if (!ph) return null;
    if (!ph.r) ph.r = { p0: this.get(ph.p0), a0: this.get(ph.a0), p1: this.get(ph.p1), a1: this.get(ph.a1) + 360 * ph.spins };
    const { p0, a0, p1, a1 } = ph.r, G = this.o.g ?? 9.8 * this.H / 1.7;      // 重力：按身高 1.7 m 换算
    const dt = Math.min(ta - ph.t0, ph.T), q = dt / ph.T;
    const vy = (p1[1] - p0[1] - 0.5 * G * ph.T * ph.T) / ph.T;
    let a = a0 + (a1 - a0) * q;
    const p = [p0[0] + (p1[0] - p0[0]) * q, p0[1] + vy * dt + 0.5 * G * dt * dt];
    const late = ta - ph.t0 - ph.T;
    if (late > 0 && ph.wob && late < ph.wob.dur) a += ph.wob.amp * Math.exp(-late / ph.wob.dur * 3) * Math.sin(late * 2 * Math.PI * 9);   // 插地余震
    return { p, a, flying: late < 0 };
  }
  draw(ctx, ta, o = {}) {
    const s = this.state(ta);
    if (!s) return;
    const H = this.H, a = s.a * Math.PI / 180, u = [Math.cos(a), Math.sin(a)];
    ctx.save();
    ctx.beginPath(); ctx.rect(-1e5, -1e5, 2e5, 1e5); ctx.clip();          // 地面（y = 0）以下不画：插进地里的那一截、刚从地里拔出来的剑尖
    paintBlade(ctx, s.p, u, this.len * H, H, this.B, { color: o.color, from: this.o.from !== undefined ? this.o.from * H : undefined, edge: 1, dir: 1 });
    ctx.restore();
  }
  tip(ta) { const s = this.state(ta); if (!s) return null; const a = s.a * Math.PI / 180; return [s.p[0] + Math.cos(a) * this.len * this.H, s.p[1] + Math.sin(a) * this.len * this.H]; }
}

function drawWeapon(ctx, actor, ta, o = {}) {
  const len = o.len ?? (typeof actor.weapon === 'function' ? actor.weapon(ta) : actor.weapon ?? 0.45), H = actor.H;
  const [a, b] = weaponLine(actor, ta, len, o.hand);
  const bk = (actor.blade || o.blade || {}).broken, alen = bk && ta >= bk.t ? Math.min(len, bk.at) : len;   // 断刀：拖影只到断口
  if (o.arc && len > 0) {
    const span = Math.max(0, Math.min(o.arc === true ? 1.5 * F1 : o.arc, ta - (o.arcFrom ?? -1e9))), N = 8, L = [];
    for (let i = 0; i <= N; i++) { const [h, tp] = weaponLine(actor, ta - span * (1 - i / N), alen, o.hand); L.push([[h[0] + (tp[0] - h[0]) * 0.25, h[1] + (tp[1] - h[1]) * 0.25], tp]); }
    const moved = Math.hypot(L[N][1][0] - L[0][1][0], L[N][1][1] - L[0][1][1]);
    if (moved > 0.25 * H) for (let i = 0; i < N; i++) {
      const [p0, q0] = L[i], [p1, q1] = L[i + 1];
      ctx.fillStyle = `rgba(255,255,255,${(0.08 + 0.5 * (i + 1) / N) * Math.min(1, (moved / H - 0.25) / 0.4)})`;
      ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.lineTo(p1[0], p1[1]); ctx.closePath(); ctx.fill();
    }
  }
  if (actor.blade || o.blade) return drawBlade(ctx, actor, ta, o);
  const [pa, pb] = weaponLine(actor, ta - F1, len, o.hand);
  const moved = Math.hypot(b[0] - pb[0], b[1] - pb[1]);
  if (!o.arc && o.trail !== false && moved > 0.12 * H) {            // 拖影：上一帧和这一帧武器之间的扇面（o.trail: false 不画）
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
//   tip：兵器长度（单位 H）。给了就把打击点从手挪到兵器尖，但不越过守方身体前沿
//   opts：传给 move 的额外参数（例如 { reach: 1.85 } 换长兵器；{ to: null } 不自动迈步）
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
        bt.b.move(tc - (MOVES[name].ready ?? 2) / 24, name, bt.ropts || {});   // 防守要在接触前就位
        landed = name === 'block' || !!MOVES[name].block;                  // block: true 的防守招（用剑挡）算碰上：火花 + 叮
      } else if (typeof react === 'function') react(bt.b, tc);
      else bt.b.move(tc, react, bt.ropts || {});
    }
    const blocked = react === 'block' || !!(MOVES[react] && MOVES[react].block);
    const level = blocked ? 'clash' : bt.level ?? r.level ?? 'hit';
    let point = bt.point || r.point;
    // 有兵器（actor.weapon）就用模拟后的实际位置：碰剑 = 两把剑最近处；打中 = 剑上离对方躯干最近的点
    if (!bt.point && bt.a.weapon && bt.b) {
      const A0 = bt.a, B0 = bt.b;
      point = () => {
        const [h, tip] = weaponLine(A0, tc);
        if (level === 'clash' && B0.weapon) { const [c, d] = weaponLine(B0, tc); return segMid(h, tip, c, d)[1]; }
        const j = B0.jointsAt(tc); return segMid(h, tip, j.hip, j.head)[1];
      };
    } else
    if (point && bt.tip && !bt.point) {
      point = [point[0] + r.D * bt.tip * bt.a.H, point[1]];
      if (bt.b) { const bx = bt.b.hipNow(tc)[0] - r.D * 0.08 * bt.b.H; point[0] = r.D > 0 ? Math.min(point[0], bx) : Math.max(point[0], bx); }
    }
    if (fx && point) fx.add(tc, point, landed ? level : 'none', { glyph: landed && !blocked ? bt.glyph : null });
    if (D && landed && level === 'heavy') D.cue(tc, 'impact_heavy');
    else if (D && landed && level !== 'none') D.cue(tc, level !== 'clash' ? 'impact_medium' : (bt.a.blade || bt.b?.blade) ? 'sword_clang' : 'impact_light', { v: 0.8 });   // 刀剑相碰用 sword_clang（金属“铛”）
    out.push({ ...r, tc, landed, point });
    if (D) (D.fights = D.fights || []).push({ tc, a: bt.a, b: bt.b, move: bt.move, react: typeof react === 'function' ? '(函数)' : react, level, landed, tip: bt.tip, reach: r.reach, extra: r.extra, t0: bt.t });   // 给 tools/contact_check.js 用
  }
  return out;
}

module.exports = { Actor2, exchange, MOVES, FightFX, drawWeapon, weaponLine, segMid, paintBlade, FlyBlade, BLADE };
