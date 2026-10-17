// 动作验证片（12.5 秒）：用 v2 骨骼重做三个 v1 最差的片段
//   A 0–3.6   从地上捡起电脑：带呼吸的停顿 → 小预备 → 迈一步 → 快速蹲下（手用 IK 真正伸到电脑上）→ 抓住 → 抬到膝盖 → 快速站起，电脑跟着弹簧走
//   B 3.6–8.2 抱着电脑敲 print("hi")：每一次按键手落下、电脑微震、键盘声对齐到同一帧；重心在两条腿之间换来换去
//   C 8.2–12.5 一脚踢飞 hi：预备 → 2 帧出脚 → 停顿帧（动画冻结 0.1 秒，闪光和震屏照走）→ 冲击 → 跟随 → 回稳
// 节奏按原片实测：大姿势变化 2–4 帧完成、带一点过冲；停顿时身体一直有细小的活动（拆解 第 3 节）。
// 所有动作写在"动画时间"上；停顿帧通过时间重映射实现（真实时间继续走，动画时间暂停）。
'use strict';
const K = require('./core');
const { C, W, H, clamp, lerp, E, noise1 } = K;
const { Dyn, Track, body, paint, smear, FEEL } = require('./rig2');
const { P } = require('./rig');
const { Camera, floor } = require('./cam');
const { Code } = require('./code');
const { Body } = require('./phys');
const PR = require('./props');
const V = require('./vfx');
const cues = require('./cues');

const HH = 300, LW = 0.5 * HH, DIR = 1;
const STAND = 0.44 * HH;                  // 站立时胯的高度（腿几乎伸直）
const DT = 1 / 240;

// —— 停顿帧：踢中的瞬间动画冻结 0.1 秒 ——
const TC = 9.07, FREEZE = 0.1;            // 动画时间里的接触时刻
const animT = t => (t < TC ? t : t < TC + FREEZE ? TC : t - FREEZE);
const realT = ta => (ta <= TC ? ta : ta + FREEZE);      // 接触那一刻本身算在冻结之前
const DUR = 12.5, ADUR = DUR - FREEZE;

// ———————————————— 代码（按键时刻驱动手）————————————————
const code = new Code({ x: -390, y: -640, size: 62, seed: 5 });
code.type(3.75, 'print("hi")', 7.5).run(6.55);
const KEYS = [];
for (let i = 1; i < code.snaps.length; i++) if (code.snaps[i].text.length > code.snaps[i - 1].text.length) KEYS.push(code.snaps[i].t);
cues.add(6.55 + 0.12, 'output');

// ———————————————— 意图时间轴（动画时间）————————————————
const X0 = -40;
const hipT = new Track([X0, -STAND]), leanT = new Track(2), headT = new Track(18);
// 脚：每次挪动是一段弧线（抬脚 lift 像素），不是弹簧——脚落地的位置和时刻要精确，才不会滑
class Foot {
  constructor(p) { this.m = [{ t: -1e9, to: p, dur: 0, lift: 0, ease: 'inOut' }]; }
  move(t, to, dur, lift = 16, ease = 'inOut', sfx = true) {
    this.m.push({ t, to, dur, lift, ease }); this.m.sort((a, b) => a.t - b.t);
    if (sfx) cues.add(realT(t + dur), 'step', { v: 0.8 });
    return this;
  }
  at(t) {
    let i = 0; while (i < this.m.length - 1 && this.m[i + 1].t <= t) i++;
    const c = this.m[i], p = this.m[Math.max(0, i - 1)].to;
    if (i === 0 || t >= c.t + c.dur) return c.to;
    const u = (E[c.ease] || E.inOut)((t - c.t) / c.dur);
    return [lerp(p[0], c.to[0], u), lerp(p[1], c.to[1], u) - c.lift * Math.sin(Math.PI * u)];
  }
}
const fF = new Foot([X0 + 22, 0]), fB = new Foot([X0 - 20, 0]);

// 手：每段时间一个模式。free = 相对肩膀（跟着身体、带弹簧）；world = 世界里的固定点；laptop = 电脑上的点（到位后精确贴住）
const handMode = { F: [], B: [] };
const hand = (h, t, mode, arg) => handMode[h].push({ t, mode, arg });
// 电脑：ground 躺在地上；held 跟着身体（目标是相对胸口的位置，带弹簧）
const lapMode = [];
const lap = (t, mode, arg) => lapMode.push({ t, mode, arg });

// 电脑在地上
const LX = 95, LREST = [LX, -0.045 * LW, 0];
// 电脑上的抓握点（电脑本地坐标，原点在铰链）：底下托着的点、键盘上的点（在盖子后面，看不见）
const GRIP_UNDER = [-0.18 * LW, 0.07 * LW], GRIP_BACK = [-0.5 * LW, 0.03 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];
// 拿在胸前时电脑铰链相对身体的位置（实测：铰链高约 0.57H，在身体前方）
const HELD = { fwd: 0.24, up: 0.05 }, LOW = { fwd: 0.3, up: -0.05 }, TUCK = { fwd: 0.16, up: 0.03 };

// —— A 捡电脑 ——
hand('F', 0, 'free', [0.05, 0.35]); hand('B', 0, 'free', [-0.04, 0.35]); lap(0, 'ground');
headT.set(0.3, 26, 0.7, 'inOut');                                   // 一直盯着电脑，头慢慢再低一点
hipT.set(0.9, [X0 - 3, -STAND + 5], 0.15); leanT.set(0.9, 7); headT.set(0.9, 30);     // 预备：微微一沉
fF.move(1.02, [X0 + 62, 0], 0.22, 18); hipT.set(1.02, [X0 + 18, -STAND + 2], 0.2);    // 迈一步靠近
cues.add(1.02, 'rustle', { v: 0.5 });
const CR = [X0 + 8, -0.21 * HH];
hipT.set(1.42, CR); leanT.set(1.42, 40); headT.set(1.42, 34);                          // 蹲下（弹簧 ~3 帧完成）
fB.move(1.38, [X0 - 12, 0], 0.14, 10);
hand('F', 1.42, 'world', [LX + GRIP_UNDER[0] + 30, LREST[1] + 4]); hand('B', 1.46, 'world', [LX + GRIP_BACK[0] + 4, LREST[1] + 3]);
cues.add(1.52, 'body', { v: 0.8 });
headT.set(1.9, 38, 0.3); hipT.set(1.9, [CR[0] + 2, CR[1] + 3], 0.3);                   // 蹲着稍微调整
const TG = 2.12;                                                                       // 抓住
hand('F', TG, 'laptop', [GRIP_UNDER[0] + 30, GRIP_UNDER[1] - 4]); hand('B', TG, 'laptop', GRIP_BACK);
lap(TG, 'held', LOW); cues.add(TG, 'touch2');
headT.set(TG, 30);
const TS = 2.48;                                                                       // 站起来
hipT.set(TS, [X0 + 22, -STAND]); leanT.set(TS, 3); headT.set(TS, 20);
fB.move(TS + 0.02, [X0 + 2, 0], 0.16, 12);
lap(TS, 'held', HELD); cues.add(TS, 'rustle', { v: 0.7 });
hand('B', TS + 0.05, 'laptop', GRIP_UNDER);                                            // 托底的手换到下面
hand('F', 3.15, 'laptop', KEYPT);                                                      // 前手放到键盘上

// —— B 敲键盘 ——（手按 KEYS 的时刻敲；见 tapAt）
headT.set(3.4, 22, 0.3);
hipT.set(4.25, [X0 + 30, -STAND + 4], 0.5); fB.move(4.3, [X0 + 2, 0], 0.01, 0, 'linear', false);   // 重心挪到前脚，后膝自然弯
hipT.set(5.5, [X0 + 14, -STAND + 3], 0.6);                                             // 重心挪回后脚
headT.set(5.2, 25, 0.4);
headT.set(6.55, 4, 0.12); leanT.set(6.55, -2);                                         // 运行：抬头看代码
headT.set(7.05, 38); leanT.set(7.05, 9);                                               // hi 掉下来，低头看
hipT.set(7.05, [X0 + 24, -STAND + 2], 0.3);

// hi：从代码下面掉出来，落在脚前
const hi = new Body({ t0: 6.67, x: -40, y: -560, vx: 330, vy: -320, vrot: 1.5, r: 12, bounce: 0.42, friction: 0.7, sfx: 'tick',
  hits: [{ t: TC, vx: 2400, vy: -1350, vrot: 26 }] });
const HX = hi.at(8.9)[0];

// —— C 踢 ——（hi 落点 HX 由物理算出；先挪两步，让踢的那条腿够得着）
const SX = HX - 112;                                                                    // 踢之前胯所在的位置
hipT.set(7.75, [SX - 10, -STAND + 2], 0.45, 'inOut');
fF.move(7.75, [SX + 24, 0], 0.24, 16); fB.move(8.0, [SX - 22, 0], 0.24, 16);
hand('F', 8.25, 'free', [0.16, 0.24]);                                                  // 前手松开键盘，垂到一边保持平衡
lap(8.25, 'held', TUCK); hand('B', 8.25, 'laptop', GRIP_UNDER);                          // 电脑夹到身边，后手托着
headT.set(8.3, 36);
const K0 = 8.62;                                                                        // 预备：身体往后一收，踢的脚往后抬
hipT.set(K0, [SX - 14, -STAND + 8], 0.18); leanT.set(K0, 8); headT.set(K0, 34);
fF.move(K0, [SX - 22, -46], 0.26, 0, 'out3', false);
hand('F', K0, 'free', [0.24, 0.12]);
cues.add(8.94, 'whoosh', { v: 0.8 });
fF.move(TC - 0.075, [HX - 14, -16], 0.075, 0, 'in', false);                              // 出脚：约 2 帧
hipT.set(TC - 0.075, [SX + 12, -STAND + 2]); leanT.set(TC - 0.075, -16); headT.set(TC - 0.075, 22);
hand('F', TC - 0.075, 'free', [-0.26, 0.22]);                                            // 手往后甩，平衡
cues.add(realT(TC), 'kick'); cues.add(realT(TC), 'hit');
fF.move(TC + 0.01, [HX + 40, -170], 0.2, 0, 'out3', false);                              // 跟随：脚继续往上踢
leanT.set(TC + 0.01, -24);
fF.move(TC + 0.32, [SX + 50, 0], 0.26, 20, 'inOut');                                     // 收脚落地
hipT.set(TC + 0.3, [SX + 26, -STAND + 3]); leanT.set(TC + 0.3, 4); headT.set(TC + 0.3, -6);
hand('F', TC + 0.3, 'free', [0.06, 0.34]);
fB.move(TC + 0.62, [SX + 4, 0], 0.2, 12);
hipT.set(TC + 0.6, [SX + 26, -STAND]);
headT.set(TC + 1.1, -12, 0.3);                                                          // 看着 hi 飞走的方向
hand('F', TC + 1.25, 'free', [0.2, -0.12]); headT.set(TC + 1.25, -16);                   // 小小得意：前手一扬
hand('F', TC + 2.1, 'free', [0.05, 0.34]); headT.set(TC + 2.1, 4, 0.4);

// ———————————————— 模拟（固定 240 Hz，加载时跑一遍）————————————————
const modeAt = (list, t) => { let m = list[0]; for (const x of list) if (x.t <= t) m = x; return m; };
function lapLocal(ls, p) {   // 电脑本地点 → 世界
  const c = Math.cos(ls[2]), s = Math.sin(ls[2]);
  return [ls[0] + DIR * (p[0] * c - p[1] * s), ls[1] + p[0] * s + p[1] * c];
}
// 每次按键：手往下点一下（25 ms 下、70 ms 回），电脑跟着微震
function tapAt(t) {
  let d = 0, k = -1;
  for (let i = 0; i < KEYS.length; i++) {
    const a = t - KEYS[i]; if (a < -0.03 || a > 0.12) continue;
    k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07);
  }
  const j = (() => { let v = 0; for (const tk of KEYS) { const a = t - tk; if (a > 0 && a < 0.25) v += Math.exp(-a * 25) * Math.sin(a * 60); } return v; })();
  return { d, k, j };
}
const N = Math.ceil(ADUR / DT) + 2;
const REC = { hip: [], lean: [], head: [], hF: [], hB: [], fF: [], fB: [], lap: [] };
(function simulate() {
  const dyn = {
    hx: new Dyn(...FEEL.hip, X0), hy: new Dyn(...FEEL.hip, -STAND), lean: new Dyn(...FEEL.lean, 2), head: new Dyn(...FEEL.head, 18),
    hFx: new Dyn(...FEEL.hand, 0), hFy: new Dyn(...FEEL.hand, 0), hBx: new Dyn(...FEEL.hand, 0), hBy: new Dyn(...FEEL.hand, 0),
    lx: new Dyn(...FEEL.obj, LREST[0]), ly: new Dyn(...FEEL.obj, LREST[1]), lr: new Dyn(...FEEL.obj, 0),
  };
  let first = true;
  const sw = { F: { t: -9, from: null }, B: { t: -9, from: null } };
  let prevMode = { F: null, B: null };
  for (let i = 0; i < N; i++) {
    const t = i * DT;
    // 1. 意图 + "活"的停顿（细小噪声）
    // "活"的停顿：幅度和速度按原片实测（停顿时头部每隔几帧挪 1 px ≈ 我们这个尺寸的 3–4 px/s）
    const ht = hipT.at(t);
    const feet = { F: fF.at(t), B: fB.at(t) };
    // 够得着约束：踩在地上的脚如果腿伸直也够不到，就把胯的"目标"往下压（膝盖自然弯），交给弹簧平滑地沉下去，
    // 而不是让脚被拖着滑。约束加在目标上、不硬改结果，否则约束一生效速度就突变（会出现卡顿）
    const LEG = (P.thigh + P.shin) * HH * 0.97;
    const tgt = [ht[0] + 4.5 * noise1(t * 0.9, 1), ht[1] + 2.4 * noise1(t * 1.1, 2)];
    for (const f of [feet.F, feet.B]) {
      if (f[1] < -4) continue;                                   // 抬起来的脚不管
      const dx = f[0] - tgt[0];
      if (Math.abs(dx) < LEG) tgt[1] = Math.max(tgt[1], f[1] - Math.sqrt(LEG * LEG - dx * dx));
    }
    const hip = [dyn.hx.step(DT, tgt[0]), dyn.hy.step(DT, tgt[1])];
    const lean = dyn.lean.step(DT, leanT.at(t) + 1.8 * noise1(t * 0.8, 3));
    const head = dyn.head.step(DT, headT.at(t) + 3.5 * noise1(t * 1.0, 4));
    const s0 = { t, hip, lean, head, fF: feet.F, fB: feet.B, hF: hip, hB: hip };
    const b0 = body(s0, HH, DIR);
    const up = [b0.neck[0] - hip[0], b0.neck[1] - hip[1]], ul = Math.hypot(...up); up[0] /= ul; up[1] /= ul;
    const fwd = [-up[1] * DIR, up[0] * DIR];     // 垂直于躯干、朝面向的方向（直立时 = [DIR, 0]）
    // 2. 电脑
    const lm = modeAt(lapMode, t);
    let ls;
    if (lm.mode === 'ground') { ls = [...LREST]; dyn.lx.snap(ls[0]); dyn.ly.snap(ls[1]); dyn.lr.snap(0); }
    else {
      const a = lm.arg, tg = [hip[0] + fwd[0] * a.fwd * HH + up[0] * a.up * HH, hip[1] + fwd[1] * a.fwd * HH + up[1] * a.up * HH];
      const tp = tapAt(t);
      ls = [dyn.lx.step(DT, tg[0]), dyn.ly.step(DT, tg[1]) + tp.j * 1.2, dyn.lr.step(DT, lean * 0.004) + tp.j * 0.012];
    }
    // 3. 手
    const hands = {};
    for (const h of ['F', 'B']) {
      const m = modeAt(handMode[h], t);
      if (prevMode[h] !== m) { sw[h] = { t, from: first ? null : [dyn['h' + h + 'x'].y, dyn['h' + h + 'y'].y] }; prevMode[h] = m; }
      let tgt, exact = false;
      if (m.mode === 'free') tgt = [b0.sh[0] + DIR * m.arg[0] * HH, b0.sh[1] + m.arg[1] * HH];
      else if (m.mode === 'world') tgt = m.arg;
      else {
        let p = m.arg;
        if (h === 'F' && p === KEYPT) { const tp = tapAt(t); p = [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; }
        tgt = lapLocal(ls, p); exact = true;
      }
      if (first) { dyn['h' + h + 'x'].snap(tgt[0]); dyn['h' + h + 'y'].snap(tgt[1]); }
      const sx = dyn['h' + h + 'x'].step(DT, tgt[0]), sy = dyn['h' + h + 'y'].step(DT, tgt[1]);
      if (exact) {
        const u = E.inOut((t - sw[h].t) / 0.1);                    // 贴上去之前的 0.1 秒：从弹簧位置平滑过渡到精确位置
        hands[h] = u >= 1 ? tgt : [lerp(sx, tgt[0], u), lerp(sy, tgt[1], u)];
        if (u >= 1) { dyn['h' + h + 'x'].snap(tgt[0]); dyn['h' + h + 'y'].snap(tgt[1]); }
      } else hands[h] = [sx, sy];
    }
    first = false;
    REC.hip.push(hip); REC.lean.push(lean); REC.head.push(head); REC.hF.push(hands.F); REC.hB.push(hands.B);
    REC.fF.push(feet.F); REC.fB.push(feet.B); REC.lap.push(ls);
  }
})();
function stateAt(ta) {
  const x = clamp(ta / DT, 0, N - 1.001), i = Math.floor(x), u = x - i;
  const L = (a, b) => (Array.isArray(a) ? a.map((v, n) => lerp(v, b[n], u)) : lerp(a, b, u));
  const g = k => L(REC[k][i], REC[k][i + 1]);
  return { t: ta, hip: g('hip'), lean: g('lean'), head: g('head'), hF: g('hF'), hB: g('hB'), fF: g('fF'), fB: g('fB'), lap: g('lap') };
}
const jointsAt = ta => body(stateAt(ta), HH, DIR);

// 停顿帧之后登记的物理音效要往后挪（物理在动画时间里跑）
for (const c of cues.list) if (c.t > TC && (c.type === 'tick')) c.t = +(c.t + FREEZE).toFixed(4);

// ———————————————— 摄像机（真实时间）————————————————
const cam = new Camera();
cam.key(0, { x: 20, y: -330, z: 1.08 })
  .key(3.2, { x: 10, y: -340, z: 1.1, ease: 'inOut' })
  .key(4.2, { x: -60, y: -400, z: 1.2 })                    // 敲代码：推近
  .key(7.2, { x: -40, y: -390, z: 1.18 })
  .key(8.2, { x: 40, y: -320, z: 1.06 })
  .key(realT(TC) + 0.02, { x: 50, y: -320, z: 1.0, ease: 'out3' })
  .key(DUR, { x: 130, y: -330, z: 0.98, ease: 'inOut' });
cam.shake(realT(TC), 16, 0.32);

// ———————————————— 合成一帧 ————————————————
function draw(ctx, t) {
  const ta = animT(t), c = cam.at(t);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  code.draw(ctx, ta);
  const s = stateAt(ta), j = body(s, HH, DIR);
  const held = ta >= TG;
  if (!held) PR.laptop(ctx, s.lap[0], s.lap[1], LW, s.lap[2], 1, DIR);
  // hi
  if (ta >= hi.t0) { const [x, y, r] = hi.at(ta); PR.word(ctx, 'hi', x, y, r); }
  if (ta > TC && ta < TC + 0.45) {
    const [x, y] = hi.at(ta), [x0, y0] = hi.at(ta - 1 / 60);
    V.motionLines(ctx, x, y, (x - x0) * 60, (y - y0) * 60, { n: 5, spread: 18, len: 0.06, seed: 7 });
  }
  // 拖影：手脚快速移动时，沿最近 7 个采样点的轨迹画一条由细到粗的带子
  for (const k of ['aF', 'aB', 'lF', 'lB']) {
    const pts = []; for (let n = 7; n >= 0; n--) pts.push(jointsAt(ta - n / 160)[k][2]);
    const sp = Math.hypot(pts[7][0] - pts[0][0], pts[7][1] - pts[0][1]) / (7 / 160) / HH;   // 每秒几个身高
    if (sp > 3.2) smear(ctx, pts, P.lw * HH * 1.05, C.yellow, clamp((sp - 3.2) / 4, 0, 0.9));
  }
  paint(ctx, j, C.yellow, HH, 'fill');
  if (held) PR.laptop(ctx, s.lap[0], s.lap[1], LW, s.lap[2], 1, DIR);
  // 踢中：冲击星芒 + 冲击环 + 火花（画在世界里，真实时间驱动，所以停顿帧期间照样在动）
  const ia = t - realT(TC), ip = [HX - 6, -18];
  if (ia >= 0 && ia < 0.35) {
    ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
    for (let n = 0; n < 9; n++) {
      const a = n / 9 * Math.PI * 2 + 0.3, r0 = 18 + 160 * E.out3(ia / 0.25), r1 = r0 + 70 * (1 - ia / 0.35);
      ctx.lineWidth = 7 * (1 - ia / 0.35);
      ctx.beginPath(); ctx.moveTo(ip[0] + Math.cos(a) * r0, ip[1] + Math.sin(a) * r0 * 0.8); ctx.lineTo(ip[0] + Math.cos(a) * r1, ip[1] + Math.sin(a) * r1 * 0.8); ctx.stroke();
    }
    ctx.restore();
  }
  V.shockRing(ctx, ip[0], ip[1], ia, { r1: 260, dur: 0.4, w: 12, squash: 0.75 });
  V.sparks(ctx, ip[0], ip[1], ia, { n: 16, speed: 1100, life: 0.4, seed: 9, w: 3, up: 2.4, gravity: 2600 });
  ctx.restore();
  V.flash(ctx, ia >= 0 && ia < 0.034 ? 0.16 : 0);            // 接触那一帧轻闪（只有 1–2 帧）
}
const bloomAt = () => 0;
module.exports = { DUR, draw, cam, bloomAt, TC, FREEZE, jointsAt, animT };
