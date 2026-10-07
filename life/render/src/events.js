'use strict';
// 汇总各幕的画面事件（供音频合成对齐铃音）
function events() {
  const out = [];
  for (const s of require('./scenes')) if (s.events) out.push(...s.events);
  out.push(...require('./teaser').events);
  return out.sort((a, b) => a.t - b.t);
}
module.exports = { events };
