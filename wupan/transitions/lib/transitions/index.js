/* 20 式清单。浏览器：<script src="lib/transitions/index.js"></script> 之后调用 ShanheTransitions.load(base) 按顺序插入脚本；
 * Node：require('./lib/transitions') 返回 { id: def } */
(function (root) {
  var FILES = [
  "01_moran.js",
  "02_feibai.js",
  "03_juanzhou.js",
  "04_cengluan.js",
  "05_kongmeng.js",
  "06_yunhai.js",
  "07_lianyi.js",
  "08_liushui.js",
  "09_jinhui.js",
  "10_yufeng.js",
  "11_fengsha.js",
  "12_yeyu.js",
  "13_feixue.js",
  "14_xinghe.js",
  "15_louchuang.js",
  "16_zheshan.js",
  "17_yinzhang.js",
  "18_shuaijing.js",
  "19_yijiao.js",
  "20_yunying.js",
  "21_sizhi.js",
  "22_moxian.js",
  "23_paixian.js",
  "24_fanye.js"
];
  if (typeof module === 'object' && module.exports) {
    var all = {};
    FILES.forEach(function (f) { var d = require('./' + f); all[d.id] = d; });
    module.exports = all;
    return;
  }
  var T = root.ShanheTransitions = root.ShanheTransitions || {};
  Object.defineProperty(T, 'FILES', { value: FILES, enumerable: false });
  Object.defineProperty(T, 'load', { enumerable: false, value: function (base) {
    base = base || 'lib/transitions/';
    return Promise.all(FILES.map(function (f) {
      return new Promise(function (res, rej) {
        var s = document.createElement('script');
        s.src = base + f; s.async = false; s.onload = res; s.onerror = function () { rej(new Error(f)); };
        document.head.appendChild(s);
      });
    }));
  } });
})(typeof self !== 'undefined' ? self : this);
