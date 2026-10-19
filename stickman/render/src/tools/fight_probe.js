// 打斗关节探针：不用渲染，打印指定帧（24fps 帧号）两个人的胯、前倾、手、剑尖、剑角、脚，和手脚够不着、剑尖插地的提示
//   SCENE=duel2 node src/tools/fight_probe.js 30 31 40-48
//   胯 = [世界 x, 离地高度]（单位自己的 H）；手 / 剑尖 / 脚 = [在胯前多少（沿朝向）, 离地高度]
//   ✗手：手的目标离肩膀太远（够不着，画出来手停在半路）；✗脚：脚离胯太远（腿拉直，脚被拖着）；✗地：剑尖低于地面
'use strict';
const { weaponLine } = require('../fight');
const SC = { duel1: '../scene_duel1', duel2: '../scene_duel2', fight: '../scene_fight_demo' };
const S = require(SC[process.env.SCENE] || '../scene_duel2');
const frames = [];
for (const a of process.argv.slice(2)) { const m = a.split('-').map(Number); if (m.length === 2) for (let f = m[0]; f <= m[1]; f++) frames.push(f); else frames.push(m[0]); }
const f2 = v => (v >= 0 ? ' ' : '') + v.toFixed(2);
for (const fr of frames) {
  const ta = S.clock ? S.clock.anim(fr / 24) : fr / 24;
  const jh = S.hero.jointsAt(ta), jf = S.foe.jointsAt(ta);
  const out = [`f${String(fr).padStart(3)}`, `距 ${((jf.hip[0] - jh.hip[0]) / S.hero.H).toFixed(2)}`];
  for (const [nm, a] of [['主', S.hero], ['敌', S.foe]]) {
    const j = a.jointsAt(ta), s = a.stateAt(ta), H = a.H, D = j.dir, st = a.stAt(ta);
    const rel = p => [(p[0] - j.hip[0]) * D / H, -p[1] / H];
    const len = S.weaponLen ? S.weaponLen(a, ta) : (typeof a.weapon === 'function' ? a.weapon(ta) : a.weapon || 0);
    const warn = [];
    if (Math.hypot(j.aF[2][0] - s.hF[0], j.aF[2][1] - s.hF[1]) > 0.03 * H) warn.push('✗手');
    for (const k of ['fF', 'fB']) { const lk = k === 'fF' ? j.lF : j.lB; if (Math.hypot(lk[2][0] - s[k][0], lk[2][1] - s[k][1]) > 0.03 * H) warn.push('✗脚' + k[1]); }
    let tipS = '';
    if (len > 0) { const [, tip] = weaponLine(a, ta, len); const t = rel(tip); tipS = ` 尖[${f2(t[0])},${f2(t[1])}]`; if (tip[1] > 2) warn.push('✗地'); }
    const wa = a.swordAng ? a.swordAng(ta) : null;
    const h = rel(j.aF[2]), fF = rel(j.lF[2]), fB = rel(j.lB[2]);
    out.push(`| ${nm} 胯${f2(j.hip[0] / H)},${(-j.hip[1] / H).toFixed(2)} 倾${s.lean.toFixed(0).padStart(4)} 手[${f2(h[0])},${f2(h[1])}]${tipS} 角${wa === null ? '  — ' : wa.toFixed(0).padStart(5)} 脚${f2(fF[0])}/${f2(fB[0])}${fF[1] > 0.01 || fB[1] > 0.01 ? `↑${Math.max(fF[1], fB[1]).toFixed(2)}` : ''}${st !== 1 ? ` st${st.toFixed(2)}` : ''} ${warn.join('')}`);
  }
  console.log(out.join(' '));
}
