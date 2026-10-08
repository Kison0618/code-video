// 音乐驱动：节拍网格、段落、频段包络、每一拍的真实鼓点强度
'use strict';
const path = require('path');
const D = require(path.join(__dirname, '..', '..', 'analysis', 'teeth.json'));
const { clamp } = require('./core');

// 画面冲击比网格提前一点点，看起来和听起来才是同一下
const BEAT = D.beat, PHASE = D.phase + D.hit_offset - 0.02, DUR = D.duration;
const ENV = D.env, FPS = D.fps;
const CYCLE = 8;  // 这首歌的鼓以 8 拍为一个循环：4 下重击 + 4 拍空

// 段落（按拍号）。由 analysis/analyze.py 的能量图确定，见 README
const SECTIONS = [
  ['intro', 0, 48],      // 稀疏的跺脚，嘴还闭着
  ['verse', 48, 80],     // 主歌：环形的"口"张开
  ['pre', 80, 112],      // 预副歌（没有鼓）：上下两排牙逼近；108–112 拍急停
  ['chorus', 112, 176],  // 副歌 1：咬
  ['break', 176, 184],   // 断开，低频涌起
  ['verse2', 184, 208],  // 主歌 2：进入喉咙
  ['pre2', 208, 240],    // 预副歌 2（没有鼓）；236–240 急停
  ['chorus2', 240, 304], // 副歌 2
  ['bridge', 304, 368],  // 桥段：玻璃碎裂；338–342、346–350 掐断
  ['final', 368, 464],   // 最后的副歌
  ['outro', 464, 999],
];
const beatT = k => PHASE + k * BEAT;
const beatF = t => (t - PHASE) / BEAT;
function section(t) {
  const b = beatF(t);
  for (const [name, a, z] of SECTIONS) if (b >= a && b < z) return { name, a, z, beat: b - a, u: (b - a) / (z - a), t0: beatT(a), t1: beatT(z) };
  return { name: 'pre0', a: -1, z: 0, beat: b, u: 0, t0: 0, t1: PHASE };
}
function env(name, t) {
  const a = ENV[name], f = t * FPS, i = Math.floor(f);
  if (i < 0) return 0;
  if (i >= a.length - 1) return a[a.length - 1] / 255;
  return (a[i] + (a[i + 1] - a[i]) * (f - i)) / 255;
}
function spec(i, t) {
  const s = D.spec30, f = t * 30, k = Math.floor(f);
  if (k < 0 || k >= s.length - 1) return 0;
  return (s[k][i] + (s[k + 1][i] - s[k][i]) * (f - k)) / 255;
}
// 每一拍的鼓点强度（实测，0..1）
const norm = arr => { const m = Math.max(...arr) * 0.8; return arr.map(v => clamp(v / m)); };
const KICK = norm(D.kick), CLAP = norm(D.clap);
const hitAt = k => (k < 0 || k >= KICK.length ? 0 : clamp(Math.max(KICK[k], 0.8 * CLAP[k]) * 1.15 - 0.15));
const isHit = k => hitAt(k) > 0.35;
function sinceBeat(t) { const k = Math.floor(beatF(t)); return { k, s: t - beatT(k) }; }
// 重击包络：这一拍的实测强度 × 指数衰减
function hit(t, decay = 8) { const { k, s } = sinceBeat(t); return k < 0 ? 0 : hitAt(k) * Math.exp(-s * decay); }
function pulse(t, decay = 6) { const { k, s } = sinceBeat(t); return k < 0 ? 0 : Math.exp(-s * decay); }
// 循环内第几拍（0..7）
const cyclePos = t => { const b = Math.floor(beatF(t)); return ((b % CYCLE) + CYCLE) % CYCLE; };
// 到目前为止一共咬了几下
const BITES = (() => { const c = []; let n = 0; for (let k = 0; k < KICK.length; k++) { if (isHit(k)) n++; c.push(n); } return c; })();
const bitesAt = t => { const k = Math.floor(beatF(t)); return k < 0 ? 0 : BITES[Math.min(k, BITES.length - 1)]; };
const HI = D.hi_onsets;
const hiOnsetsBetween = (a, b) => HI.filter(([t]) => t >= a && t < b);

module.exports = { D, BEAT, PHASE, DUR, CYCLE, SECTIONS, beatT, beatF, section, env, spec, hitAt, isHit, hit, pulse, sinceBeat, cyclePos, bitesAt, hiOnsetsBetween };
