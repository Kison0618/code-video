// 开场 → 主歌（0–34.9 秒）：同一个 3D"人的宇宙"，一镜到底
//  0–3.8   黑场，解码出第一句；一个金点
//  3.8     第一下跺脚：宇宙从金点炸开（大爆炸），第二句砸进来
//  7.3–19  镜头穿过人群星团
//  19.4    金点发出一圈"真话"的球面波，扫过的人各自变色：少数金（认同），多数不变（无感），一部分暗红（敌意）
//  21–35   暗红的人向你发出攻击线，一个个光包沿线飞向你
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, text } = K;
const A = require('../audio');
const U = require('../universe');
const T = require('../textfx');
const UI = require('../ui');
const { you } = require('./common');

const TB = A.beatT(8);                  // 大爆炸
const TW = 19.4;                        // 真话的球面波
const TA = 23.2;                        // 攻击开始
const T1 = A.beatT(80);
const ATTACK = U.PTS.map((p, i) => i).filter(i => U.PTS[i].react === -1 && i % 3 === 0);

function cam(t) {
  const fly = easeInOut(prog(t, 6.5, 20));
  const back = easeInOut(prog(t, 20.5, 26));
  const dist = lerp(lerp(5600, 1500, fly), 4300, back);
  const az = 0.2 + 1.1 * fly + 0.35 * back + 0.02 * t;
  const el = lerp(0.1, 0.32, fly) + 0.05 * back;
  return U.orbit(dist, az, el, 900);
}

function draw(ctx, t) {
  const P = cam(t);
  const bang = t >= TB ? easeOutExpo(clamp((t - TB) / 2.4)) : 0;
  const R = (t - TW) * 2600;                                         // 球面波半径
  const drift = smooth(prog(t, 21, 30));
  const dread = smooth(prog(t, 29.5, 31.5)) * (1 - smooth(prog(t, 33.6, 34.8)));
  // 背景微光
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.7);
  bg.addColorStop(0, rgba(mix([14, 14, 22], [26, 6, 10], dread))); bg.addColorStop(1, 'rgb(4,4,7)');
  ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

  if (bang > 0) {
    U.draw(ctx, t, P, {
      nebula: smooth(prog(t, TB + 0.5, TB + 4)),
      focus: lerp(5600, 1500, easeInOut(prog(t, 6.5, 20))),
      aperture: 0.8,
      map: (pt) => {
        const d = Math.hypot(...pt.p);
        let p = pt.p.map(v => v * bang);
        let col = null, a = 1;
        if (t > TW && d < R) {                                        // 被真话扫过
          const k = clamp((R - d) / 900);
          if (pt.react === 1) col = mix([165, 175, 200], C.gold, k);
          else if (pt.react === -1) col = mix([165, 175, 200], C.red, k);
          a = pt.react === 0 ? 1 - 0.35 * k : 1 + 0.4 * k;
          const pull = pt.react === 1 ? -0.14 : pt.react === -1 ? 0.1 : 0;
          p = p.map(v => v * (1 + pull * drift));
        }
        if (t > TW && Math.abs(d - R) < 160) a *= 2.4;                // 波前亮一下
        if (dread > 0 && pt.react !== -1) a *= 1 - 0.55 * dread;      // "希望你死"：其它人都暗下去
        return { p, col, a };
      },
    });
    // 大爆炸的冲击环
    const age = t - TB;
    if (age < 2.5) {
      const o = P([0, 0, 0]);
      if (o) { glow(ctx, o[0], o[1], 200 + age * 1400, C.gold, 0.3 * (1 - age / 2.5)); glow(ctx, o[0], o[1], 60 + age * 300, C.white, 0.5 * Math.exp(-age * 3)); }
    }
  }
  // 攻击线：一根根暗红的线连向你，光包沿线飞过来
  if (t > TA) {
    const o = P([0, 0, 0]);
    const on = smooth(prog(t, TA, TA + 3)) * (1 - smooth(prog(t, 33.8, 34.8)));
    if (o && on > 0) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const n = Math.floor(ATTACK.length * smooth(prog(t, TA, TA + 6)));
      ctx.strokeStyle = rgba(C.red, (0.07 + 0.08 * dread) * on); ctx.lineWidth = 1;
      ctx.beginPath();
      const packets = [];
      for (let j = 0; j < n; j++) {
        const pt = U.PTS[ATTACK[j]];
        const q = P(pt.p.map(v => v * 1.1)); if (!q) continue;
        ctx.moveTo(q[0], q[1]); ctx.lineTo(o[0], o[1]);
        const ph = ((t * (0.35 + (j % 7) * 0.05) + j * 0.137) % 1);
        packets.push([lerp(q[0], o[0], ph), lerp(q[1], o[1], ph)]);
      }
      ctx.stroke();
      ctx.fillStyle = rgba([255, 120, 120], 0.9 * on);
      ctx.beginPath(); for (const p of packets) ctx.rect(p[0] - 1.5, p[1] - 1.5, 3, 3); ctx.fill();
      ctx.restore();
    }
  }
  // 你
  const o = P([0, 0, 0]);
  if (o) you(ctx, o[0], o[1], (t < TB ? smooth(prog(t, 0.3, 1.5)) : 1) * (1 - 0.5 * dread), 5 + 3 * smooth(prog(t, TW - 0.5, TW)) * Math.exp(-Math.max(0, t - TW) * 2));

  // 数据面板：真话之后的反应统计
  const pa = smooth(prog(t, 21.5, 22.5)) * (1 - smooth(prog(t, 33.8, 34.6)));
  if (pa > 0) {
    const rows = [['认同', 'AGREE', 0.12, C.gold], ['无感', 'INDIFFERENT', 0.61, C.dim], ['敌意', 'HOSTILE', 0.27, C.red]];
    UI.note(ctx, '反应 · RESPONSE TO TRUTH', 120, 380, { alpha: 0.75 * pa });
    rows.forEach(([cn, en, v, col], i) => {
      const y = 420 + i * 46, u = smooth(prog(t, 21.8 + i * 0.3, 23.5 + i * 0.3));
      text(ctx, cn, 120, y + 14, { family: 'Song', size: 18, color: col, alpha: pa, align: 'left' });
      ctx.fillStyle = rgba(C.line, 0.6 * pa); ctx.fillRect(180, y, 260, 16);
      ctx.fillStyle = rgba(col, 0.85 * pa); ctx.fillRect(180, y, 260 * v * u / 0.61, 16);
      UI.note(ctx, (v * u * 100).toFixed(1) + '%', 456, y + 13, { alpha: pa, color: col });
    });
    UI.note(ctx, 'n = 8,000  ·  SIMULATION', 120, 580, { alpha: 0.5 * pa, size: 11 });
  }

  // —— 文案 ——
  const titleOut = 7.2;
  T.decode(ctx, t, '你永远都只能成为', { t0: 0.5, y: H / 2 - 150, size: 54, cps: 9, out: titleOut });
  T.slam(ctx, t, '少部分人心中的高级', { t0: TB + 0.05, y: H / 2 - 40, size: 84, hl: { '少部分人': C.gold }, out: titleOut, en: 'You will only ever be worth it to a few.' });
  T.decode(ctx, t, '如果你积极地活在真相里——', { t0: 8.4, y: H - 170, size: 44, cps: 12, out: 12.9, hl: { '真相': C.gold }, en: 'If you choose to live in the truth —' });
  T.decode(ctx, t, '选择说真话，选择做真事。', { t0: 13.3, y: H - 170, size: 44, cps: 11, out: 18.9, hl: { '真话': C.gold, '真事': C.gold }, en: 'to speak the truth, and do real things.' });
  T.decode(ctx, t, '那你必然会被——', { t0: 21.6, y: H - 230, size: 44, cps: 10, out: 28.6 });
  T.glitch(ctx, t, '攻击。诋毁。', { t0: 24.0, y: H - 130, size: 72, out: 28.6, en: 'attacked. smeared.' });
  T.decode(ctx, t, '甚至——', { t0: 29.0, y: H / 2 - 60, size: 44, cps: 8, out: 33.8, cursor: false });
  T.glitch(ctx, t, '希望你死。', { t0: 30.4, y: H / 2 + 70, size: 110, out: 33.8, settle: 0.8, en: 'Even wanting you dead.' });
}
module.exports = { draw, t0: 0, t1: T1 };
