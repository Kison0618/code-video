// 音乐：逐拍时刻、段落、频段包络
// 这首曲子 112 BPM 左右，没有明显的底鼓，所以用 librosa 逐拍跟踪出来的真实拍点（analysis/bgm.json 的 beats）
'use strict';
const path = require('path');
const D = require(path.join(__dirname, '..', '..', 'analysis', 'bgm.json'));

const BEATS = D.beats, DUR = 130.0;
const P = (BEATS[BEATS.length - 1] - BEATS[0]) / (BEATS.length - 1);
// 第 k 拍的时刻（可以是小数拍；超出范围按平均拍长外推）
function B(k) {
  if (k <= 0) return BEATS[0] + k * P;
  const n = BEATS.length - 1;
  if (k >= n) return BEATS[n] + (k - n) * P;
  const i = Math.floor(k), f = k - i;
  return BEATS[i] + (BEATS[i + 1] - BEATS[i]) * f;
}
// 段落（按拍号，8 拍一句）。见 文案与分镜.md
//  0–32   前奏（16.2–17.0 秒有一段空白）
//  32     第一次进入（17.09 秒）
//  146    断开（77.7 秒，之后是安静的过渡）
//  176    再次进入（93.6 秒）
const DROP = B(32), BREAK = B(146), RETURN = B(176);
const ENV = D.env, FPS = D.fps;
function env(name, t) {
  const a = ENV[name], f = t * FPS, i = Math.floor(f);
  if (i < 0) return 0;
  if (i >= a.length - 1) return a[a.length - 1] / 255;
  return (a[i] + (a[i + 1] - a[i]) * (f - i)) / 255;
}
module.exports = { D, BEATS, P, B, DUR, DROP, BREAK, RETURN, env };
