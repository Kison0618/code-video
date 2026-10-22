// 打印场景的节拍时间（真实时间）和相邻节拍的间隔：写完一段马上看实际有多长，和剧本的时间对照
//   SCENE=cur2 node src/tools/marks.js
'use strict';
const S = require({ v4: '../scene_v4', loop: '../scene_loop', loop2: '../scene_loop2', fight: '../scene_fight_demo', garble: '../scene_garble', garble2: '../scene_garble2', cur1: '../scene_cur1', cur2: '../scene_cur2', cur3: '../scene_cur3', cur4: '../scene_cur4', cur5: '../scene_cur5' }[process.env.SCENE]);
const m = Object.entries(S.marks || {}).map(([k, v]) => [k, S.clock ? S.clock.real(v) : v]).sort((a, b) => a[1] - b[1]);
let prev = 0;
for (const [k, v] of m) { console.log(`${v.toFixed(2).padStart(7)}s  +${(v - prev).toFixed(2).padStart(5)}  ${k}`); prev = v; }
console.log(`总长 ${S.DUR}s，${m.length} 个节拍，平均每拍 ${(S.DUR / Math.max(1, m.length)).toFixed(2)}s`);
