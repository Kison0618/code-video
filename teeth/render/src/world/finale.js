// 两面（最后的副歌，四个乐句各 24 拍）：前面所有的意象重新组合。
//   ① 心 + 一圈向内的獠牙（像一张围着心的嘴），每下鼓点咬进一齿、收紧一下
//   ② 墨迹重新晕开，心浮在墨迹上
//   ③ 荆棘和玫瑰重新长出来，缠住这颗心
//   ④ 全部叠在一起
// 结尾：最后一口咬死，两半合上，光慢慢暗下去
'use strict';
const K = require('../core');
const { W, H, C, Canvas, rgba, mix, clamp, lerp, prog, smooth, easeOut, glow, mulberry32 } = K;
const A = require('../audio');
const FX = require('../fx');
const HEART = require('./heart');
const INK = require('./rorschach');
const THORN = require('./thorns');

const HL = new Canvas(W, H), HLF = new Canvas(W, H);
const B0 = 368;
const phase = t => Math.max(0, Math.min(3, Math.floor((A.beatF(t) - B0) / 24)));

// 一圈向内的獠牙，绕着心
function jaw(ctx, t, a) {
  const { k, s } = A.sinceBeat(t);
  const n = 40, steps = A.bitesAt(t) - (A.isHit(k) ? 1 : 0) + (A.isHit(k) ? easeOut(clamp(s / 0.12)) : 1);
  const rot = steps * (6.2832 / n) * 0.5;
  const squeeze = 1 - 0.06 * A.hit(t, 6);
  const R = 430 * squeeze, cx = W / 2, cy = H / 2 - 10;
  ctx.save(); ctx.translate(cx, cy);
  ctx.strokeStyle = rgba(C.violet, 0.5 * a); ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, R + 18, (R + 18) * 0.92, 0, 0, 6.2832); ctx.stroke();
  for (let i = 0; i < n; i++) {
    const th = rot + i / n * 6.2832, dw = 6.2832 / n * 0.42;
    const len = 46 + 22 * (i % 2) + 18 * Math.sin(i * 2.3);
    const p0 = [Math.cos(th - dw) * R, Math.sin(th - dw) * R * 0.92], p1 = [Math.cos(th + dw) * R, Math.sin(th + dw) * R * 0.92];
    const tip = [Math.cos(th) * (R - len), Math.sin(th) * (R - len) * 0.92];
    const g = ctx.createLinearGradient((p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2, tip[0], tip[1]);
    const col = Math.cos(th) < 0 ? C.teal : [150, 30, 110];
    g.addColorStop(0, rgba(mix(C.bone, col, 0.6), 0.9 * a)); g.addColorStop(1, rgba(C.bone, a));
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.quadraticCurveTo((p0[0] + tip[0]) / 2, (p0[1] + tip[1]) / 2, tip[0], tip[1]);
    ctx.quadraticCurveTo((p1[0] + tip[0]) / 2, (p1[1] + tip[1]) / 2, p1[0], p1[1]); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

function heartLayer(ctx, t, S, a, extra = {}) {
  const hx = HL.getContext('2d'); hx.reset();
  HEART.draw(hx, t, { name: 'chorus', t0: S.t0, t1: S.t1, ...extra });
  FX.flatten(HL, HLF);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.drawImage(HLF, 0, 0); ctx.restore();
}

function draw(ctx, t, S) {
  if (S.name === 'outro') {
    // 结尾：两半合上，光暗下去
    const u = prog(t, S.t0, S.t0 + 3.5);
    HEART.draw(ctx, t, { name: 'chorus', t0: S.t0, t1: S.t1, closed: true });
    ctx.fillStyle = `rgba(0,0,0,${0.75 * smooth(u)})`; ctx.fillRect(0, 0, W, H);
    return;
  }
  const ph = phase(t);
  if (ph === 0) {
    HEART.draw(ctx, t, { name: 'chorus', t0: S.t0, t1: S.t1 });
    jaw(ctx, t, 1);
  } else if (ph === 1) {
    INK.draw(ctx, t, S);
    heartLayer(ctx, t, S, 0.9);
  } else if (ph === 2) {
    // 把这一句映射到主歌 2 的时间轴上（相差整 29 个 8 拍循环，鼓型一致），藤和玫瑰重新长一遍
    const t2 = A.beatT(184) + (t - A.beatT(B0 + 48));
    THORN.draw(ctx, t2, { name: 'verse2', t0: A.beatT(184), t1: A.beatT(208) });
    heartLayer(ctx, t, S, 0.85);
  } else {
    INK.draw(ctx, t, S);
    ctx.fillStyle = 'rgba(4,4,10,0.45)'; ctx.fillRect(0, 0, W, H);   // 墨迹压暗一点，让心和牙站在前面
    heartLayer(ctx, t, S, 0.85);
    jaw(ctx, t, 0.9);
  }
}
const lyricStyle = (t, S) => ({ y: H - 110, size: 46, accent: phase(t) === 2 ? C.pink : C.cyan });
module.exports = { draw, lyricStyle };
