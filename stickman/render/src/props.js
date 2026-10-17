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
    const h = 0.6 * w * open, sk = 0.14 * w * open;
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

module.exports = { laptop, word };
