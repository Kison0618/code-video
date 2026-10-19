// 打斗接触检查：不用渲染，逐拍量"打到没打到"（剑尖到身体、剑碰剑、剑插地），再逐帧查"架势太低"
//   SCENE=duel1 node src/tools/contact_check.js
// 场景要求：用 fight.js 的 exchange() 编排（会把每一拍登记在 D.fights），并导出 fights: D.fights；
//           兵器长度导出 weaponLen(actor, ta)（单位 H，没有兵器返回 0），不导出就用每一拍的 tip
// 每一拍打印：帧号（24fps）、谁打谁、两人胯间距、剑尖越过对方躯干线多少（+ 穿进去 / − 没够着）、剑尖到身体最近距离、
//             剑和剑最近距离、剑尖高度，和判断：
//   hit / heavy：刺——剑尖要碰到身体（越过躯干线 −0.05…+0.15H）；挥砍——剑身扫过躯干或头，交点在剑的前半段
//                穿过去太多 → 把 reach 加大（人站远一点），够不着 → reach 减小
//   clash：两把剑要真的碰上（最近距离 < 0.06H），而且碰在身前（攻方剑尖离对方躯干线至少 0.05H，或者离身体 0.12H 以上），不然看起来像打中了
//   闪开（landed=false）：剑尖离身体 0.03…0.3H（差一点）
//   任何时候剑尖不能插进地里（y > 0）
//   守方用剑挡（block: true 的反应招，写了 wa）：再算"守方的手该放在哪"——两把剑交在攻方剑 70–85%、守方剑 25–50% 处，
//     打印守方接触帧（ready 那个 key）该写的 h [胯前, 离地] 和剑角，以及够不够得着（手离肩 ≤ 0.375H）
//   闪开：用整条剑身到身体的最近距离（不只是剑尖），横扫、劈砍也准
// 逐帧（第 8 轮加）：剑尖插地、手 / 脚够不着（画出来手停在半路、腿被拖直）、锁剑段两把剑没卡在一起（场景导出 locks: [[t0, t1]]）、
//   打斗段（第一拍出手到最后一拍接触）两个人同时几乎不动超过 4 帧（= 停顿，用户明确说"打架中间是没有停顿的"）
// 建议 reach：只对带 reach 的招式有效（move 会按 reach 自动调整接触前的前移，reach 大 1 → 接触时人往后站 1H）
'use strict';
const K = require('../core');
const { P } = require('../rig');
const { weaponLine, MOVES } = require('../fight');
const SC = { duel1: '../scene_duel1', duel2: '../scene_duel2', fight: '../scene_fight_demo' };
const S = require(SC[process.env.SCENE] || '../scene_duel1');
const fights = S.fights || [];
const wl = (a, ta, fb) => (S.weaponLen ? S.weaponLen(a, ta) : fb) || 0;
const r2 = v => (v >= 0 ? '+' : '') + v.toFixed(2);

// 点到线段的距离
function dSeg(p, a, b) {
  const vx = b[0] - a[0], vy = b[1] - a[1], L = vx * vx + vy * vy || 1e-9;
  const u = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vy) / L));
  return [Math.hypot(p[0] - a[0] - u * vx, p[1] - a[1] - u * vy), u];
}
// 线段到线段的最近距离（不相交时取四个端点到对边的最小值；相交返回 0）和在第二条线段上的位置
function dSegSeg(a, b, c, d) {
  const cr = (p, q, r) => (q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
  const d1 = cr(c, d, a), d2 = cr(c, d, b), d3 = cr(a, b, c), d4 = cr(a, b, d);
  if (d1 * d2 < 0 && d3 * d4 < 0) { const u = d3 / (d3 - d4); return [0, u]; }
  const c1 = dSeg(a, c, d), c2 = dSeg(b, c, d), c3 = dSeg(c, a, b), c4 = dSeg(d, a, b);
  let best = [c1[0], c1[1]];
  if (c2[0] < best[0]) best = [c2[0], c2[1]];
  if (c3[0] < best[0]) best = [c3[0], 0];
  if (c4[0] < best[0]) best = [c4[0], 1];
  return best;
}
function bodyDist(p, j, H) {
  let m = Math.max(0, Math.hypot(p[0] - j.head[0], p[1] - j.head[1]) - P.headR * H);
  const segs = [[j.hip, j.neck], [j.aF[0], j.aF[1]], [j.aF[1], j.aF[2]], [j.aB[0], j.aB[1]], [j.aB[1], j.aB[2]], [j.lF[0], j.lF[1]], [j.lF[1], j.lF[2]], [j.lB[0], j.lB[1]], [j.lB[1], j.lB[2]]];
  for (const [a, b] of segs) m = Math.min(m, dSeg(p, a, b)[0]);
  return m;
}
// 剑尖越过对方躯干线多少（沿出手方向，单位攻方 H）：躯干线 = 胯–脖子–头顶，取剑尖那个高度上的 x
function depth(tip, j, D, Ha, Hb) {
  const top = [j.head[0], j.head[1] - P.headR * Hb];
  const pts = [j.hip, j.neck, top];
  let x;
  if (tip[1] >= j.hip[1]) x = j.hip[0];
  else if (tip[1] <= top[1]) x = top[0];
  else for (let i = 0; i < 2; i++) { const a = pts[i], b = pts[i + 1]; if (tip[1] <= a[1] && tip[1] >= b[1]) { const u = (a[1] - tip[1]) / ((a[1] - b[1]) || 1e-9); x = a[0] + (b[0] - a[0]) * u; } }
  return (tip[0] - x) * D / Ha;
}

// 整条剑身（手 → 剑尖）到身体的最近距离
function bladeBody(h, tip, j, H) { let m = 1e9; for (let i = 0; i <= 20; i++) { const u = i / 20; m = Math.min(m, bodyDist([h[0] + (tip[0] - h[0]) * u, h[1] + (tip[1] - h[1]) * u], j, H)); } return m; }
// 守方的剑该放在哪：两把剑交在攻方剑 ua（0.7–0.85）、守方剑 ub（0.25–0.5）；剑角在现在的 ±30° 里找，攻方 reach 在 ±0.2 里找
//   （reach 大 = 攻方接触时站远）；手离肩 ≤ 0.33H 最好，剑角、手、reach 改得越少越好
function blockFit(h, tip, a, b, tc, lb) {
  const j = b.jointsAt(tc), Hb = b.H, Ha = a.H, D = j.dir, Da = a.jointsAt(tc).dir, wa0 = b.swordAng(tc), k = b.bladeK ? b.bladeK(tc) : 1, L = lb * k * Hb;
  const rel = p => [(p[0] - j.hip[0]) * D / Hb, -(p[1]) / Hb];
  const curH = rel(j.aF[2]), curReach = Math.hypot(j.aF[2][0] - j.sh[0], j.aF[2][1] - j.sh[1]) / Hb;
  let best = null;
  for (let dr = -0.2; dr <= 0.201; dr += 0.05) for (let ua = 0.7; ua <= 0.851; ua += 0.05) for (let ub = 0.25; ub <= 0.501; ub += 0.05) for (let dw = -30; dw <= 30; dw += 5) {
    const P = [h[0] + (tip[0] - h[0]) * ua - Da * dr * Ha, h[1] + (tip[1] - h[1]) * ua], an = (wa0 + dw) * Math.PI / 180;
    const hd = [P[0] - D * Math.cos(an) * L * ub, P[1] + Math.sin(an) * L * ub];
    const r = Math.hypot(hd[0] - j.sh[0], hd[1] - j.sh[1]) / Hb, hh = rel(hd);
    const sc = Math.max(0, r - 0.33) * 10 + Math.abs(dw) / 60 + Math.abs(ua - 0.78) + Math.abs(ub - 0.35) + Math.abs(dr) * 2 + Math.hypot(hh[0] - curH[0], hh[1] - curH[1]) * 2;
    if (!best || sc < best.sc) best = { sc, h: hh, wa: wa0 + dw, r, dr };
  }
  return { best, curH, wa0, curReach };
}

console.log(`场景 ${process.env.SCENE || 'duel1'}：${fights.length} 拍`);
const bad = [];
for (const f of fights) {
  const { tc, a, b } = f, ja = a.jointsAt(tc), jb = b.jointsAt(tc), D = ja.dir, Ha = a.H, Hb = b.H;
  const la = wl(a, tc, f.tip), lb = wl(b, tc, 0);
  const fr = Math.round(tc * 24), gap = (jb.hip[0] - ja.hip[0]) * D / Ha;
  const ext = Math.abs(f.extra || 0) > 0.02 ? f.extra : 0, disp = f.t0 != null ? (ja.hip[0] - a.jointsAt(f.t0).hip[0]) * D / Ha - ext : 0;
  const gap0 = f.t0 != null ? (b.jointsAt(f.t0).hip[0] - a.jointsAt(f.t0).hip[0]) * D / Ha : gap;
  // 建议 reach：要让接触时的间距变大 d，就把 reach 加 d（reach = 接触间距 + 招式自己的胯前移）
  const want = d => { const r = gap + d + disp, e = gap0 - r; return ` → 建议 reach ${r.toFixed(2)}` + (f.reach == null ? '（这招原来没有 reach）' : '') + (e < -0.3 || e > 0.9 ? `（起手间距 ${gap0.toFixed(2)}，自动前移只能调 −0.3…+0.9，要先走近/退开）` : ''); };
  const row = [`f${String(fr).padStart(3)}`, `${f.move}→${f.react}`.padEnd(30), f.level.padEnd(5), `间距 ${gap.toFixed(2)}H`];
  const notes = [];
  if (la > 0) {
    const [h, tip] = weaponLine(a, tc, la);
    const dep = depth(tip, jb, D, Ha, Hb), db = bodyDist(tip, jb, Hb) / Ha;
    row.push(`越过躯干 ${r2(dep)}`, `到身体 ${db.toFixed(2)}`, `尖高 ${(-tip[1] / Ha).toFixed(2)}`);
    if (tip[1] > 2) notes.push(`剑尖插进地里 ${(tip[1] / Ha).toFixed(2)}H`);
    let blade = null, bl = null;
    if (lb > 0) { bl = weaponLine(b, tc, lb); blade = dSegSeg(h, tip, bl[0], bl[1]); row.push(`剑碰剑 ${(blade[0] / Ha).toFixed(2)}`); }
    const dBl = bladeBody(h, tip, jb, Hb) / Ha;
    row.push(`剑身到身体 ${dBl.toFixed(2)}`);
    if (!f.landed) { if (dBl < 0.03) notes.push('闪开了却碰到身体' + want(0.08 - dBl)); else if (dBl > 0.3) notes.push(`差得太远（${dBl.toFixed(2)}H），看不出"差一点"` + want(0.12 - dBl)); }
    else if (f.level === 'clash') {
      if (blade && b.swordAng && MOVES[f.react] && MOVES[f.react].block) {
        const fit = blockFit(h, tip, a, b, tc, lb), cur = blade[0] / Ha;
        const [c, d] = bl, ua = blade[0] / Ha <= 0.06 ? dSegSeg(c, d, h, tip)[1] : null, ub = blade[0] / Ha <= 0.06 ? blade[1] : null;
        const ok = cur <= 0.06 && ua >= 0.68 && ua <= 0.88 && ub >= 0.2 && ub <= 0.55 && fit.curReach <= 0.375;
        row.push(ub !== null ? `碰在 攻${ua.toFixed(2)} 守${ub.toFixed(2)}` : '');
        if (!ok) notes.push(`守方 ${f.react} 接触帧（ready）写 h [${fit.best.h.map(v => v.toFixed(2)).join(', ')}] wa ${fit.best.wa.toFixed(0)}（现在 h [${fit.curH.map(v => v.toFixed(2)).join(', ')}] wa ${fit.wa0.toFixed(0)}，手离肩 ${fit.curReach.toFixed(2)}→${fit.best.r.toFixed(2)}H）` + (Math.abs(fit.best.dr) > 0.01 ? `，攻方 ${f.move} reach ${f.reach != null ? (f.reach + fit.best.dr).toFixed(2) : '（没有 reach）'}${fit.best.dr > 0 ? '（站远一点）' : '（站近一点）'}` : ''));
        console.log(row.join('  ') + (notes.length ? '\n      ✗ ' + notes.join('；') : '  ✓'));
        if (notes.length) bad.push(fr);
        continue;
      }
      if (!blade) notes.push('clash 但守方没有兵器');
      else if (blade[0] / Ha > 0.06 || (dep > -0.05 && db < 0.12)) {   // 剑尖越过躯干线但离身体还远（比如在头顶上方），不算刺中
        // 攻方剑上 0.6…1.0 那一段，找和守方剑同高的点，算出要前后挪多少才碰上（越靠近 0.85 越好）
        const [c, d] = bl, ylo = Math.min(c[1], d[1]), yhi = Math.max(c[1], d[1]);
        let best = null;
        for (let u = 0.6; u <= 1.0001; u += 0.05) {
          const p = [h[0] + (tip[0] - h[0]) * u, h[1] + (tip[1] - h[1]) * u];
          if (p[1] < ylo || p[1] > yhi) continue;
          const v = (p[1] - c[1]) / ((d[1] - c[1]) || 1e-9), xd = c[0] + (d[0] - c[0]) * v, dl = (p[0] - xd) * D / Ha;
          if (!best || Math.abs(u - 0.85) < Math.abs(best.u - 0.85)) best = { u, dl };
        }
        const ya = [-Math.max(h[1], tip[1]) / Ha, -Math.min(h[1], tip[1]) / Ha], yb = [-yhi / Ha, -ylo / Ha];
        if (best && blade[0] / Ha <= 0.06) notes.push(`剑尖已经到对方身上（越过躯干 ${r2(dep)}H），碰剑要碰在身前` + want(Math.max(best.dl, dep + 0.12)));
        else if (best) notes.push(`两把剑没碰上（差 ${(blade[0] / Ha).toFixed(2)}H）` + want(best.dl));
        else notes.push(`高度对不上：攻方剑 ${ya.map(v => v.toFixed(2)).join('…')}H，守方剑 ${yb.map(v => v.toFixed(2)).join('…')}H（改手的位置，tools/hand_for.js）`);
      }
    } else {
      // 挥砍（剑身扫过身体）：剑身和躯干 / 头相交，交点在剑的前半段，就算打中；交点太靠剑根 = 站太近
      const segs = [[jb.hip, jb.neck]];
      let cut = null;
      for (const [c, d] of segs) { const x = dSegSeg(h, tip, c, d); if (x[0] < 0.03 * Ha) { const y = dSegSeg(c, d, h, tip); cut = y[1]; } }
      const hd = dSeg(jb.head, h, tip); if (hd[0] < P.headR * Hb) cut = cut === null ? hd[1] : Math.min(cut, hd[1]);
      row.push(cut !== null ? `剑身扫中 @${cut.toFixed(2)}` : '');
      if (cut !== null && cut < 0.5) notes.push(`站太近：剑身 ${cut.toFixed(2)} 处（靠剑根）就打到身上了，剑尖穿到身后` + want((0.8 - cut) * la));
      else if (cut !== null) { /* 剑身前段扫中：算打中 */ }
      else if (dep > 0.15) notes.push(`穿过去了 ${r2(dep)}H` + want(dep - 0.05));
      else if (cut === null && dep < -0.05 && db > 0.05) notes.push(`够不着 ${r2(dep)}H` + want(dep - 0.05));
    }
  }
  console.log(row.join('  ') + (notes.length ? '\n      ✗ ' + notes.join('；') : '  ✓'));
  if (notes.length) bad.push(fr);
}

// 架势太低：弹簧段（不在招式精确路径里）实际胯比目标低 0.06H 以上，连续 0.25 秒——说明两脚分得太开、腿够不着，胯被压下去了
const actors = S.actors || [S.hero, S.foe].filter(Boolean);
for (const ac of actors) {
  let s = null, worst = 0;
  const step = 1 / 24, end = S.clock ? S.clock.anim(S.DUR) : S.DUR;
  for (let t = 0; t <= end + 1e-6; t += step) {
    const inPath = ac.paths.hip.some(p => t >= p.t0 && t < p.t1);
    const sink = inPath ? 0 : (ac.jointsAt(t).hip[1] - ac.hipT.at(t)[1]) / ac.H;
    if (sink > 0.06) { if (s === null) s = t; worst = Math.max(worst, sink); }
    else if (s !== null) { if (t - s >= 0.25) { console.log(`  ✗ ${ac === S.hero ? '主角' : '对手'} f${Math.round(s * 24)}–f${Math.round(t * 24)} 胯被压低 ${worst.toFixed(2)}H（脚分太开够不着，换小一点的架势）`); bad.push(-1); } s = null; worst = 0; }
  }
}
// 逐帧：剑尖插地、手脚够不着、锁剑没卡住、两人同时不动
const nm = ac => ac === S.hero ? '主角' : '对手';
const end = S.clock ? S.clock.anim(S.DUR) : S.DUR, NF = Math.floor(end * 24);
const ranges = (list) => { const out = []; for (const f of list) { const l = out[out.length - 1]; if (l && f === l[1] + 1) l[1] = f; else out.push([f, f]); } return out.map(([a, b]) => a === b ? `f${a}` : `f${a}–${b}`).join(' '); };
for (const ac of actors) {
  const lab = { 地: [], 手: [], 后手: [], 脚: [] };
  for (let fr = 0; fr <= NF; fr++) {
    const ta = fr / 24, j = ac.jointsAt(ta), s = ac.stateAt(ta), Hh = ac.H;
    const len = wl(ac, ta, 0);
    if (len > 0 && weaponLine(ac, ta, len)[1][1] > 2) lab.地.push(fr);
    if (Math.hypot(j.aF[2][0] - s.hF[0], j.aF[2][1] - s.hF[1]) > 0.03 * Hh) lab.手.push(fr);
    if (Math.hypot(j.aB[2][0] - s.hB[0], j.aB[2][1] - s.hB[1]) > 0.04 * Hh) lab.后手.push(fr);
    if (Math.hypot(j.lF[2][0] - s.fF[0], j.lF[2][1] - s.fF[1]) > 0.03 * Hh || Math.hypot(j.lB[2][0] - s.fB[0], j.lB[2][1] - s.fB[1]) > 0.03 * Hh) lab.脚.push(fr);
  }
  const msg = { 地: '剑尖插进地里', 手: '前手够不着（停在半路）', 后手: '后手够不着', 脚: '脚够不着（腿被拖直）' };
  for (const k of Object.keys(lab)) if (lab[k].length) { console.log(`  ✗ ${nm(ac)} ${msg[k]}：${ranges(lab[k])}`); bad.push(-1); }
}
for (const [t0, t1] of S.locks || []) {
  const miss = [];
  for (let fr = Math.ceil(t0 * 24); fr <= Math.floor(t1 * 24); fr++) {
    const ta = fr / 24, A = weaponLine(S.hero, ta, wl(S.hero, ta, 0)), B = weaponLine(S.foe, ta, wl(S.foe, ta, 0));
    const d = dSegSeg(A[0], A[1], B[0], B[1]);
    if (d[0] / S.hero.H > 0.04) miss.push(fr);
  }
  if (miss.length) { console.log(`  ✗ 锁剑段两把剑没卡在一起：${ranges(miss)}`); bad.push(-1); }
}
if (fights.length > 1 && fights[0].t0 != null) {
  const t0 = fights[0].t0, t1 = fights[fights.length - 1].tc, still = [];
  const pts = (ac, ta) => { const j = ac.jointsAt(ta), l = wl(ac, ta, 0); return [j.hip, j.aF[2], j.head, ...(l > 0 ? [weaponLine(ac, ta, l)[1]] : [])]; };
  for (let fr = Math.ceil(t0 * 24) + 1; fr <= Math.floor(t1 * 24); fr++) {
    const mv = ac => { const a = pts(ac, (fr - 1) / 24), b = pts(ac, fr / 24); return Math.max(...a.map((p, i) => Math.hypot(p[0] - b[i][0], p[1] - b[i][1]))) / ac.H; };
    if (actors.every(ac => mv(ac) < 0.006)) still.push(fr);
  }
  const long = []; { let s = null; for (let i = 0; i <= still.length; i++) { if (i < still.length && (s === null || still[i] === still[i - 1] + 1)) { if (s === null) s = still[i]; } else { if (s !== null && still[i - 1] - s + 1 > 4) long.push(`f${s}–${still[i - 1]}`); s = i < still.length ? still[i] : null; } } }
  if (long.length) { console.log(`  ✗ 打斗中两个人同时不动（停顿）：${long.join(' ')}`); bad.push(-1); }
}
console.log(bad.length ? `共 ${bad.length} 处要看` : '全部通过');
