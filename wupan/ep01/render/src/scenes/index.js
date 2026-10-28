// 场景表：按顺序叠画（后面的盖在前面）
// s4–s7 由三条并行线各自新建：文件缺失时跳过；某条线的文件暂时报错时只打印警告并跳过，不拖垮其他线的预览
'use strict';
const NAMES = ['s1_head', 's2_nest', 's3_card', 's4_story1', 's5_card2', 's6_story2', 's7_end'];
const OPTIONAL = new Set(['s4_story1', 's5_card2', 's6_story2', 's7_end']);
module.exports = NAMES.map(n => {
  try { return require('./' + n); } catch (e) {
    if (e.code === 'MODULE_NOT_FOUND' && String(e.message).includes(n)) return null;
    if (OPTIONAL.has(n) && !process.env.STRICT_SCENES) { console.warn(`⚠ 场景 ${n} 加载失败，已跳过：${e.message.split('\n')[0]}`); return null; }
    throw e;
  }
}).filter(Boolean);
