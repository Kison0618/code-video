// 道具：笔记本（编程集）、被打印出来的"实物文字"
'use strict';
const K = require('./core');
const { C, rgba } = K;

// 笔记本：原点在铰链中点；w = 盖子宽度；open 0~1（1 = 打开）；dir = 屏幕朝向（1 = 屏幕朝左，背面朝观众右侧）
function laptop(ctx, x, y, w, ang = 0, open = 1, dir = 1) {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(ang); ctx.scale(dir, 1);
  ctx.lineJoin = 'round';
  // 底座：一条薄板
  ctx.fillStyle = rgba(C.laptopEdge);
  ctx.beginPath();
  ctx.moveTo(-0.56 * w, 0); ctx.lineTo(0.46 * w, 0); ctx.lineTo(0.5 * w, 0.045 * w); ctx.lineTo(-0.6 * w, 0.045 * w);
  ctx.closePath(); ctx.fill();
  if (open > 0.02) {
    // 盖子：往后仰的四边形，看到的是背面（银色 + logo）
    // 实测原片：盖子宽 0.5H、高只有 0.21H（透视压扁，宽大于高）
    const h = 0.42 * w * open, sk = 0.12 * w * open;
    ctx.fillStyle = rgba(C.laptop);
    ctx.strokeStyle = rgba(C.laptopEdge);
    ctx.lineWidth = 0.035 * w;
    ctx.beginPath();
    ctx.moveTo(-0.5 * w, 0); ctx.lineTo(0.44 * w, 0); ctx.lineTo(0.44 * w + sk, -h); ctx.lineTo(-0.44 * w + sk, -h);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    // logo：一个小白点加缺口
    const lx = sk * 0.5 + 0.02 * w, ly = -h * 0.5, lr = 0.055 * w;
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(C.laptop);
    ctx.beginPath(); ctx.arc(lx + lr * 0.9, ly - lr * 0.2, lr * 0.45, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.95)';
    ctx.beginPath(); ctx.ellipse(lx + lr * 0.15, ly - lr * 1.25, lr * 0.18, lr * 0.32, 0.5, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

// 被打印出来的文字：小号灰白等宽字，旋转中心在文字中间
function word(ctx, str, x, y, rot = 0, size = 40, a = 1, col = [214, 214, 214]) {
  if (a <= 0.003) return;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(rot);
  ctx.font = `400 ${size}px Code`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = rgba(col, a);
  ctx.fillText(str, 0, 0);
  ctx.restore();
}

// 键帽：按组合键时在电脑上方弹出（不切镜头）。combo = { at: [x, y], size, keys: [{ label, t }], t1 }
//   每个键在按下那一刻弹出（放大一下），按住 0.15 秒往下一沉，键之间画 "+"；t1 之后 0.25 秒淡出
function keyCombo(ctx, t, combo) {
  const { at, size = 64, keys } = combo, t1 = combo.t1 ?? keys[keys.length - 1].t + 0.6;
  if (t < keys[0].t - 0.02 || t > t1 + 0.25) return;
  const fade = 1 - K.clamp((t - t1) / 0.25), pad = size * 0.32, gap = size * 0.7;
  ctx.save(); ctx.font = `400 ${size * 0.5}px Code`;
  const ws = keys.map(k => Math.max(size, ctx.measureText(k.label).width + pad * 2));
  const total = ws.reduce((a, b) => a + b, 0) + gap * (keys.length - 1);
  let x = at[0] - total / 2;
  keys.forEach((k, i) => {
    const age = t - k.t, w = ws[i];
    if (age >= 0) {
      const pop = 1 + 0.3 * Math.exp(-age * 16) * Math.sin(Math.min(age * 30, Math.PI)), down = age < 0.15 ? size * 0.1 : 0;
      ctx.save(); ctx.translate(x + w / 2, at[1] + down); ctx.scale(pop, pop); ctx.globalAlpha = fade * K.clamp(age / 0.04);
      ctx.fillStyle = '#5a5a5a'; ctx.beginPath(); ctx.roundRect(-w / 2, -size / 2 + size * 0.12, w, size, size * 0.2); ctx.fill();   // 键帽侧面（按下去时看不见）
      ctx.fillStyle = age < 0.15 ? '#d9d9d9' : '#f2f2f2'; ctx.beginPath(); ctx.roundRect(-w / 2, -size / 2 + (age < 0.15 ? size * 0.08 : 0), w, size, size * 0.2); ctx.fill();
      ctx.fillStyle = '#1e1e1e'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(k.label, 0, (age < 0.15 ? size * 0.08 : 0) + size * 0.02);
      ctx.restore();
    }
    if (i < keys.length - 1 && t >= keys[i + 1].t - 0.08) {
      ctx.save(); ctx.globalAlpha = fade; ctx.fillStyle = '#f2f2f2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `400 ${size * 0.6}px Code`;
      ctx.fillText('+', x + w + gap / 2, at[1]); ctx.restore();
    }
    x += w + gap;
  });
  ctx.restore();
}

module.exports = { laptop, word, keyCombo };
