// 姿势库：原片里反复出现的身体语言。角度含义见 rig.js 顶部
'use strict';
module.exports = {
  stand:      { lean: 0, head: 0, aF: [10, 10], aB: [-10, 10], lF: [9, 3], lB: [-9, 3] },
  standRelax: { lean: -2, head: 3, aF: [6, 14], aB: [-6, 14], lF: [7, 2], lB: [-7, 2] },
  // 抱着笔记本敲键盘（编程集的招牌姿势）：后臂托底、前臂在键盘上
  typing:     { lean: 2, head: 22, aF: [30, 95], aB: [12, 105], lF: [8, 3], lB: [-8, 3] },
  typing2:    { lean: 2, head: 24, aF: [34, 88], aB: [12, 105], lF: [8, 3], lB: [-8, 3] },
  // 托腮、挠头、抱头
  think:      { lean: -2, head: -6, aF: [30, 140], aB: [5, 70], lF: [6, 2], lB: [-8, 2] },
  scratch:    { lean: 0, head: 12, aF: [150, 118], aB: [-8, 12], lF: [8, 2], lB: [-8, 2] },
  headHands:  { lean: 18, head: 25, aF: [150, 120], aB: [140, 125], lF: [14, 10], lB: [-6, 8] },
  // 往前探头看
  peek:       { lean: 24, head: -18, aF: [20, 30], aB: [-25, 20], lF: [18, 12], lB: [-14, 4] },
  // 蹲、坐、跪
  crouch:     { lean: 28, head: -10, aF: [55, 25], aB: [40, 35], lF: [100, 145], lB: [85, 140] },
  squatLow:   { lean: 40, head: -20, aF: [75, 20], aB: [60, 25], lF: [115, 160], lB: [105, 160] },
  sitHug:     { lean: 8, head: 12, aF: [62, 40], aB: [52, 45], lF: [82, 128], lB: [76, 132] },
  sitSlump:   { lean: 30, head: 35, aF: [60, 20], aB: [45, 30], lF: [80, 125], lB: [70, 130] },
  kneel:      { lean: 6, head: 18, aF: [32, 85], aB: [14, 100], lF: [85, 95], lB: [0, 100] },
  // 趴在地上敲键盘（编程集开头）
  lieType:    { lean: 88, head: -62, aF: [100, 70], aB: [92, 80], lF: [0, 60], lB: [6, 25] },
  lieFlat:    { lean: 90, head: -10, aF: [150, 10], aB: [140, 15], lF: [0, 5], lB: [4, 8] },
  // 仰面躺倒
  lieBack:    { lean: -88, head: 8, aF: [20, 10], aB: [-20, 15], lF: [8, 20], lB: [-4, 8] },
  // 从躺到坐起来的中间态
  propUp:     { lean: -55, head: 20, aF: [-45, 10], aB: [-60, 15], lF: [30, 40], lB: [20, 20] },
  // 吓一跳 / 被冲击往后仰
  shock:      { lean: -22, head: -10, aF: [135, -20], aB: [-150, -15], lF: [22, 20], lB: [-14, 6] },
  flinch:     { lean: 18, head: 30, aF: [120, 140], aB: [110, 140], lF: [20, 25], lB: [-6, 15] },
  // 蓄力 → 出脚
  kickWind:   { lean: 14, head: 0, aF: [-30, 40], aB: [40, 60], lF: [-25, 75], lB: [12, 18] },
  kick:       { lean: -20, head: -5, aF: [60, 20], aB: [-70, 30], lF: [95, 5], lB: [-5, 4] },
  // 甩手扔东西
  throwWind:  { lean: -12, head: -4, aF: [-120, 40], aB: [40, 30], lF: [20, 10], lB: [-18, 8] },
  throwRel:   { lean: 22, head: 6, aF: [110, 5], aB: [-40, 30], lF: [26, 18], lB: [-24, 4] },
  // 起跳
  jumpPrep:   { lean: 30, head: -14, aF: [-40, 30], aB: [-55, 30], lF: [80, 120], lB: [70, 125] },
  jumpUp:     { lean: -4, head: -10, aF: [140, 5], aB: [-145, -5], lF: [6, 10], lB: [-10, 30] },
  tuck:       { lean: 25, head: 10, aF: [70, 80], aB: [60, 85], lF: [95, 130], lB: [85, 135] },
  land:       { lean: 25, head: -6, aF: [40, 30], aB: [-30, 30], lF: [70, 105], lB: [40, 95] },
  // 挥拳
  punchWind:  { lean: -8, head: 0, aF: [-30, 120], aB: [60, 110], lF: [25, 12], lB: [-20, 6] },
  punch:      { lean: 18, head: -6, aF: [95, 0], aB: [-30, 90], lF: [30, 20], lB: [-26, 4] },
  // 举手欢呼 / 张开双臂
  cheer:      { lean: -6, head: -14, aF: [145, 10], aB: [-150, -10], lF: [12, 4], lB: [-12, 4] },
  armsOut:    { lean: 0, head: -4, aF: [95, 0], aB: [-95, 0], lF: [14, 4], lB: [-14, 4] },
  // 捂住脸往后退
  cower:      { lean: 10, head: 30, aF: [130, 140], aB: [120, 140], lF: [40, 60], lB: [-10, 30] },
};
