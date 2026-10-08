// 小工具
'use strict';
// 标准正态随机数（Box–Muller），r 是 mulberry32 之类的随机源
function gauss(r) { return Math.sqrt(-2 * Math.log(1 - r() * 0.999)) * Math.cos(6.2832 * r()); }
module.exports = { gauss };
