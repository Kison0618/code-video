// 音效时间表：画面代码在加载时登记"第几秒发生了什么"，音效合成器按这张表出声
// 直接运行：node src/cues.js  → 打印 JSON（build.js 用它生成音轨）
'use strict';
const list = [];
function add(t, type, o = {}) { list.push({ t: +t.toFixed(4), type, ...o }); }
module.exports = { add, list };

if (require.main === module) {
  const { DUR } = require('./frame');
  list.sort((a, b) => a.t - b.t);
  process.stdout.write(JSON.stringify({ dur: DUR, cues: list }, null, 0));
}
