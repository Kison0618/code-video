// 合成一帧：当前场景（段落交界处与下一个场景交叉淡化）→ 柔和泛光 → 片名 / 歌词 / 实验记录式的 HUD 与心电图 → 暗角颗粒
// v2：不再有按拍的震动、负片闪、撕裂、色散。鼓点只驱动场景里发生的事（心跳、墨迹、齿轮咬合、裂纹……）
'use strict';
const K = require('./core');
const { W, H, C, Canvas, rgba, clamp, prog, smooth, text, glow, vis } = K;
const A = require('./audio');
const FX = require('./fx');
const LY = require('./lyrics');

const WORLD = {
  pre0: 'heart', intro: 'heart', verse: 'rorschach', pre: 'corridor', chorus: 'heart', break: 'heart',
  verse2: 'thorns', pre2: 'thorns', chorus2: 'machine', bridge: 'mirror', final: 'finale', outro: 'finale',
};
// HUD 上的中文段落名：整支片子像一份"实验记录"（官方 MV 讲的是一场改变意识的实验）
const LABEL = {
  intro: '01 · 心跳', verse: '02 · 墨迹测试', pre: '03 · 走廊', chorus: '04 · 心有獠牙', break: '05 · 碎',
  verse2: '06 · 荆棘', pre2: '06 · 荆棘', chorus2: '07 · 咬合', bridge: '08 · 镜子', final: '09 · 两面', outro: '10 · 停',
};
// 每段开头的字卡（自己写的短句，不是歌词）：中文大字 + 英文小字，出现两三秒
const CARDS = [
  [48, '你 看 到 了 什 么', 'WHAT DO YOU SEE'],
  [80, '走 廊 尽 头', 'AT THE END OF THE HALL'],
  [112, '她 的 心 长 着 牙', 'A HEART WITH TEETH'],
  [176, '碎', 'BROKEN'],
  [184, '爱 也 带 刺', 'LOVE HAS THORNS'],
  [240, '一 口 一 口', 'BITE BY BITE'],
  [304, '镜 子 里 的 另 一 个 你', 'THE OTHER YOU'],
  [368, '两 面', 'TWO FACES'],
];
function cards(ctx, t) {
  for (const [b, cn, en] of CARDS) {
    const t0 = A.beatT(b), a = vis(t, t0, t0 + (b === 176 ? 3.2 : 3.0), 0.25, 0.7);
    if (a <= 0) continue;
    const rise = (1 - smooth((t - t0) / 0.6)) * 10;
    text(ctx, cn, W / 2, 140 + rise, { family: 'Song', size: 54, weight: 500, alpha: 0.92 * a, spacing: 0.25, color: C.bone });
    text(ctx, en, W / 2, 180 + rise, { family: 'Cinzel', size: 18, weight: 600, alpha: 0.7 * a, spacing: 0.5, color: C.pink });
  }
}
const BLOOM = { heart: 0.9, rorschach: 0.6, corridor: 0.8, thorns: 0.45, machine: 0.8, mirror: 0.8, finale: 0.9 };
const MODS = {};
function world(name) {
  if (!(name in MODS)) { try { MODS[name] = require('./world/' + name); } catch (e) { if (e.code === 'MODULE_NOT_FOUND' && e.message.includes('/world/' + name)) MODS[name] = null; else throw e; } }
  return MODS[name];
}
function drawWorld(ctx, t, S) {
  ctx.save();
  ctx.fillStyle = rgba(C.bg); ctx.fillRect(0, 0, W, H);
  const m = world(WORLD[S.name]);
  if (m) m.draw(ctx, t, S);
  ctx.restore();
}

// 心电图：每一下鼓点是一次心跳，从右往左走
function ecg(ctx, t, a) {
  if (a <= 0.01) return;
  const x0 = 120, x1 = W - 120, y0 = H - 64, span = 4.0;   // 屏幕上显示最近 4 秒
  const pts = [];
  for (let i = 0; i <= 480; i++) {
    const tt = t - span + (i / 480) * span;
    const { k, s } = A.sinceBeat(tt);
    let v = 0;
    if (k >= 0 && A.isHit(k)) {
      const h = A.hitAt(k);
      // P-QRS-T 波形
      v = h * (s < 0.03 ? -0.15 * s / 0.03 : s < 0.06 ? -0.15 + 1.15 * (s - 0.03) / 0.03 : s < 0.1 ? 1 - 1.35 * (s - 0.06) / 0.04 : s < 0.14 ? -0.35 + 0.35 * (s - 0.1) / 0.04 : 0.12 * Math.sin(Math.min(1, (s - 0.14) / 0.12) * Math.PI));
    }
    pts.push([x0 + (i / 480) * (x1 - x0), y0 - v * 26]);
  }
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  ctx.lineJoin = 'round';
  for (const [lw, la] of [[5, 0.06], [1.4, 0.55]]) {
    ctx.strokeStyle = rgba(C.cyan, la * a); ctx.lineWidth = lw;
    ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.stroke();
  }
  ctx.restore();
  glow(ctx, x1, pts[pts.length - 1][1], 14, C.white, 0.8 * a);
}

function hud(ctx, t, S) {
  const a = (S.name === 'pre0' || S.name === 'outro') ? 0 : 0.55 * smooth(prog(t, A.beatT(16), A.beatT(24)));
  if (a <= 0) return;
  text(ctx, 'TEETH', 120, 92, { family: 'Mono', size: 15, alpha: a, spacing: 0.6, align: 'left' });
  text(ctx, `${A.D.bpm.toFixed(0)} BPM`, 120, 118, { family: 'Mono', size: 12, weight: 300, alpha: a * 0.6, spacing: 0.3, align: 'left' });
  text(ctx, '实验记录', W - 120, 92, { family: 'Song', size: 15, alpha: a * 0.8, spacing: 0.4, align: 'right' });
  text(ctx, LABEL[S.name] || '', W - 120, 120, { family: 'Song', size: 15, weight: 300, alpha: a, spacing: 0.25, align: 'right', color: C.pink });
  ecg(ctx, t, a * 0.9);
}

const OFF = new Canvas(W, H), OFFB = new Canvas(W, H);
const TR = 0.35;
function renderFrame(ctx, t, frame) {
  ctx.save();
  const S = A.section(t);
  drawWorld(ctx, t, S);
  const idx = A.SECTIONS.findIndex(s => s[0] === S.name);
  const next = A.SECTIONS[idx + 1], prev = A.SECTIONS[idx - 1];
  let blendA = 0, other = null;
  // 同一个场景跨段落（比如 verse2 → pre2）不需要淡化
  if (next && t > A.beatT(next[1]) - TR) { const o = A.section(A.beatT(next[1]) + 0.001); if (WORLD[o.name] !== WORLD[S.name]) { blendA = smooth((t - (A.beatT(next[1]) - TR)) / (2 * TR)); other = o; } }
  if (prev && t < A.beatT(S.a) + TR) { const o = A.section(A.beatT(S.a) - 0.001); if (WORLD[o.name] !== WORLD[S.name]) { blendA = 1 - smooth((t - (A.beatT(S.a) - TR)) / (2 * TR)); other = o; } }
  if (other && blendA > 0.01) {
    const ox = OFF.getContext('2d'); ox.reset();
    drawWorld(ox, t, { ...other });
    FX.flatten(OFF, OFFB);
    ctx.save(); ctx.globalAlpha = blendA; ctx.drawImage(OFFB, 0, 0); ctx.restore();
  }
  const base = FX.bake(ctx);
  FX.bloom(ctx, BLOOM[WORLD[S.name]] || 0.8, base);

  // 片名：第一下跺脚时出现
  const t0 = A.beatT(8);
  const ta = vis(t, t0 - 0.05, A.beatT(40), 0.25, 1.6);
  if (ta > 0) {
    text(ctx, 'TEETH', W / 2, H / 2 + 300, { family: 'Cinzel', size: 110, weight: 700, alpha: ta, spacing: 0.3, color: C.bone });
    text(ctx, '心 有 獠 牙', W / 2, H / 2 + 360, { family: 'Song', size: 30, weight: 400, alpha: 0.8 * ta * smooth(prog(t, A.beatT(16), A.beatT(20))), spacing: 0.6, color: C.pink });
  }
  // 片尾
  const te = vis(t, A.beatT(464) + 0.3, A.DUR + 1, 1.2, 0.1);
  if (te > 0) {
    text(ctx, 'TEETH', W / 2, H / 2 + 330, { family: 'Cinzel', size: 64, weight: 700, alpha: 0.9 * te, spacing: 0.35, color: C.bone });
    text(ctx, '心 有 獠 牙', W / 2, H / 2 + 380, { family: 'Song', size: 26, weight: 400, alpha: 0.8 * te, spacing: 0.6, color: C.pink });
  }
  const m = world(WORLD[S.name]);
  LY.draw(ctx, t, (m && m.lyricStyle && m.lyricStyle(t, S)) || {});
  cards(ctx, t);
  hud(ctx, t, S);
  FX.finish(ctx, frame, 1);
  FX.black(ctx, Math.max(1 - smooth(prog(t, 0, 0.4)), smooth(prog(t, A.DUR - 1.2, A.DUR - 0.05))));
  ctx.restore();
}
module.exports = { renderFrame, WORLD };
