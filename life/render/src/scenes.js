'use strict';
// 按顺序加载各幕；尚未完成的幕会被跳过
const list = ['s1_thread', 's2_text', 's3_form', 's4_flow', 's5_together', 's6_finale'];
const out = [];
for (const n of list) {
  try { out.push(require('./scenes/' + n)); }
  catch (e) { if (e.code !== 'MODULE_NOT_FOUND' || !String(e.message).includes(n)) throw e; }
}
module.exports = out;
