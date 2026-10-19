// 持剑 / 流畅度体检（第 11 轮）：不渲染，按 24fps 逐帧量三件事，回答"手的位置对不对、动作顺不顺"
//   SCENE=blade1 node src/tools/wrist_check.js [起始帧-结束帧] [--all]
//   腕角   剑和前臂的夹角（0 = 剑是前臂的延长线）。真人握剑：伸屈 ±30°、尺桡偏 ±40° 以内；侧视图里超过 60° 就是"手腕断了"，剑像粘在手腕上
//   穿头   剑身线段穿过头的圆（距头心 < 0.6 头径）——2D 侧视图里剑在身体"后面"没画出深度，看起来是穿过脑袋
//   够不着 手的目标离肩膀超过臂长（画出来手停半路，剑柄和手错位）
//   顿挫   剑尖速度（H/帧）在相邻两帧之间突变超过 0.5 H/帧（出招一下到位、下一帧死停，或者 key 之间缓动不连续）
//   独舞   这一帧一个人在动（剑尖或手速度 > 0.04 H/帧）而另一个人完全不动（< 0.005）——开场各自表演的"尬"就是这个
'use strict';
const { weaponLine } = require('../fight');
const SC = { duel1: '../scene_duel1', duel2: '../scene_duel2', blade1: '../scene_blade1', blade2: '../scene_blade2', blade2: '../scene_blade2', fight: '../scene_fight_demo' };
const S = require(SC[process.env.SCENE] || '../scene_blade1');
const args = process.argv.slice(2), all = args.includes('--all');
let f0 = 0, f1 = Math.floor(S.DUR * 24) - 1;
for (const a of args) { const m = a.match(/^(\d+)-(\d+)$/); if (m) { f0 = +m[1]; f1 = +m[2]; } }
const wrap = d => ((d + 540) % 360) - 180;
const info = (a, ta) => {
  const j = a.jointsAt(ta), s = a.stateAt(ta), H = a.H;
  const len = S.weaponLen ? S.weaponLen(a, ta) : (typeof a.weapon === 'function' ? a.weapon(ta) : a.weapon || 0);
  const o = { hand: j.aF[2], tip: null, wrist: null, head: false, reach: Math.hypot(j.aF[2][0] - s.hF[0], j.aF[2][1] - s.hF[1]) > 0.03 * H, j };
  if (len > 0) {
    const [h, tip] = weaponLine(a, ta, len); o.tip = tip;
    const fa = Math.atan2(j.aF[2][1] - j.aF[1][1], j.aF[2][0] - j.aF[1][0]), sa = Math.atan2(tip[1] - h[1], tip[0] - h[0]);
    o.wrist = Math.abs(wrap((sa - fa) * 180 / Math.PI));
    // 剑身（护手往前）到头心的距离
    const hc = j.head, r = 0.6 * (a.headR || 0.11 * H);
    const g = 0.03 * H, ux = (tip[0] - h[0]) / (len * H), uy = (tip[1] - h[1]) / (len * H), a0 = [h[0] + ux * g, h[1] + uy * g];
    const vx = tip[0] - a0[0], vy = tip[1] - a0[1], L2 = vx * vx + vy * vy, u = Math.max(0, Math.min(1, ((hc[0] - a0[0]) * vx + (hc[1] - a0[1]) * vy) / L2));
    o.head = Math.hypot(a0[0] + vx * u - hc[0], a0[1] + vy * u - hc[1]) < r && !(a.weaponBehind && a.weaponBehind(ta));
  }
  return o;
};
const names = [['主', S.hero], ['敌', S.foe]];
const prev = {}, stat = {};
for (const [nm] of names) stat[nm] = { wrist: [], head: [], reach: [], jerk: [], solo: [] };
let lastV = {};
for (let f = f0; f <= f1; f++) {
  const ta = S.clock ? S.clock.anim(f / 24) : f / 24;
  const cur = {}, vel = {};
  for (const [nm, a] of names) {
    const o = info(a, ta); cur[nm] = o;
    const p = prev[nm];
    const sp = p ? Math.hypot(o.hand[0] - p.hand[0], o.hand[1] - p.hand[1]) / a.H : 0;
    const spT = p && p.tip && o.tip ? Math.hypot(o.tip[0] - p.tip[0], o.tip[1] - p.tip[1]) / a.H : sp;
    vel[nm] = { hand: sp, tip: spT, any: Math.max(sp, spT, p ? Math.hypot(o.j.hip[0] - p.j.hip[0], o.j.hip[1] - p.j.hip[1]) / a.H : 0) };
    if (o.wrist !== null && o.wrist > 60) stat[nm].wrist.push([f, o.wrist]);
    if (o.head) stat[nm].head.push(f);
    if (o.reach) stat[nm].reach.push(f);
    if (lastV[nm] !== undefined && p && p.tip && o.tip && Math.abs(spT - lastV[nm]) > 0.5) stat[nm].jerk.push([f, lastV[nm], spT]);
    lastV[nm] = spT;
  }
  if (prev['主'] && prev['敌']) {
    if (vel['主'].any > 0.04 && vel['敌'].any < 0.005) stat['主'].solo.push(f);
    if (vel['敌'].any > 0.04 && vel['主'].any < 0.005) stat['敌'].solo.push(f);
  }
  Object.assign(prev, cur);
}
const runs = L => { if (!L.length) return '—'; const r = []; let s = L[0], e = L[0]; for (let i = 1; i <= L.length; i++) { if (L[i] === e + 1) e = L[i]; else { r.push(s === e ? `${s}` : `${s}-${e}`); s = e = L[i]; } } return r.join(' '); };
const N = f1 - f0 + 1;
for (const [nm] of names) {
  const s = stat[nm];
  console.log(`${nm}（${N} 帧）  腕角>60°: ${s.wrist.length} 帧  穿头: ${s.head.length} 帧  够不着: ${s.reach.length} 帧  顿挫: ${s.jerk.length} 次  独舞: ${s.solo.length} 帧`);
  console.log(`  腕角>60° 帧: ${runs(s.wrist.map(x => x[0]))}${all ? '\n    ' + s.wrist.map(x => `f${x[0]}:${x[1].toFixed(0)}°`).join(' ') : ''}`);
  if (s.wrist.length) { const mx = s.wrist.reduce((m, x) => x[1] > m[1] ? x : m); console.log(`  最大腕角 f${mx[0]} ${mx[1].toFixed(0)}°`); }
  console.log(`  穿头帧: ${runs(s.head)}`);
  console.log(`  够不着帧: ${runs(s.reach)}`);
  console.log(`  顿挫帧: ${s.jerk.map(x => `f${x[0]}(${x[1].toFixed(2)}→${x[2].toFixed(2)})`).join(' ') || '—'}`);
  console.log(`  独舞帧（我动他死停）: ${runs(s.solo)}`);
}
