// 音乐驱动：节拍网格、段落、频段包络。所有画面都从这里取"音乐此刻在做什么"。
'use strict';
const path = require('path');
const D = require(path.join(__dirname, '..', '..', 'analysis', 'never.json'));
const { clamp } = require('./core');

// 底鼓的起音比低频能量峰早约 30ms；画面冲击再提前一点，看起来和听起来才是同一下
const BEAT = D.beat, PHASE = D.phase - 0.025, BAR = BEAT * 4, DUR = D.duration;
const ENV = D.env, FPS = D.fps;

// 段落（按小节号，小节 n 从 PHASE + n*BAR 开始）。由 analysis/analyze.py 的能量分析确定
const SECTIONS = [
  ['intro', 0, 16],      // 开场就是全能量
  ['drift', 16, 24],     // 安静
  ['constel', 24, 40],   // 铺垫
  ['tunnel', 40, 48],    // 蓄力；45–47 小节低音抽空，47 小节军鼓滚奏
  ['drop1', 48, 64],     // 第一次 drop
  ['crystal', 64, 72],   // 间奏
  ['ascent', 72, 88],    // 再次铺垫
  ['tunnel2', 88, 96],   // 再次蓄力；93–95 低音抽空，95 滚奏
  ['final', 96, 128],    // 最后 32 小节
  ['outro', 128, 140],
];
const barT = n => PHASE + n * BAR;          // 第 n 小节的开始时间
const beatT = k => PHASE + k * BEAT;        // 第 k 拍的时间
const beatF = t => (t - PHASE) / BEAT;      // 连续的拍数
const barF = t => (t - PHASE) / BAR;        // 连续的小节数

function section(t) {
  const b = barF(t);
  for (const [name, a, z] of SECTIONS) if (b >= a && b < z) return { name, a, z, bar: b - a, u: (b - a) / (z - a), t0: barT(a), t1: barT(z) };
  return { name: 'pre', a: -1, z: 0, bar: b, u: 0, t0: 0, t1: PHASE };
}

// 频段包络 0..1（线性插值）
function env(name, t) {
  const a = ENV[name], f = t * FPS, i = Math.floor(f);
  if (i < 0) return 0;
  if (i >= a.length - 1) return a[a.length - 1] / 255;
  return (a[i] + (a[i + 1] - a[i]) * (f - i)) / 255;
}
// 32 段频谱
function spec(i, t) {
  const s = D.spec30, f = t * 30, k = Math.floor(f);
  if (k < 0 || k >= s.length - 1) return 0;
  return (s[k][i] + (s[k + 1][i] - s[k][i]) * (f - k)) / 255;
}

// 底鼓强度：看这一拍的低频能量（低音抽空、安静段自然为 0）
const kickGate = k => clamp((env('sub', beatT(k) + 0.08) - 0.5) / 0.28);
const hasKick = b => kickGate(b * 4) > 0.3;
// 距上一拍多久；返回 0..1 的冲击包络
function sinceBeat(t) { const k = Math.floor(beatF(t)); return { k, s: t - beatT(k) }; }
function kick(t, decay = 7) {
  const { k, s } = sinceBeat(t);
  if (k < 0) return 0;
  return kickGate(k) * Math.exp(-s * decay);
}
// 每拍都有的"脉搏"（不论有没有底鼓）
function pulse(t, decay = 6) { const { k, s } = sinceBeat(t); return k < 0 ? 0 : Math.exp(-s * decay); }
// 反拍（拍与拍之间的高频）
function offbeat(t, decay = 10) {
  const b = beatF(t) - 0.5, k = Math.floor(b);
  if (k < 0) return 0;
  return Math.exp(-(b - k) * BEAT * decay);
}
// 小节重拍
function downbeat(t, decay = 3) {
  const b = barF(t), n = Math.floor(b);
  if (n < 0) return 0;
  return Math.exp(-(b - n) * BAR * decay);
}
// 侧链"泵感"：拍点瞬间压低，再回弹
function pump(t) { const { s } = sinceBeat(t); return clamp(1 - Math.exp(-s * 9)); }

// 高频起音（时间, 强度），用于闪点
const HI = D.hi_onsets;
function hiOnsetsBetween(a, b) { return HI.filter(([t]) => t >= a && t < b); }

module.exports = { D, BEAT, PHASE, BAR, DUR, SECTIONS, barT, beatT, beatF, barF, section, env, spec, hasKick, kick, pulse, offbeat, downbeat, pump, sinceBeat, hiOnsetsBetween };
