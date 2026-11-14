'use strict';
// 《INFP》v3 第 2 组（Kiro）：B01–B11 特征（书页 P1 之前），B12 占比 1%（书页之后）
//   全组在同一片夜里的山岗上，她手里一盏暖灯（她的理想和价值观）贯穿全组
//   S1 风越刮越大，远处别人手里的灯被吹得摇晃、熄掉，只有她那盏稳稳亮着（忠于价值观）
//   S2 她脚边一本摊开的大书，书页里升起一道光柱，光尘往上飘（人文、精神的力量）
//   S3 三团有体积的光（粉=情感共鸣、金=慈善、白=真实可信）依次落进她手里，跟灯融在一起，数字 1→3
//   S4 她提灯沿一条踏光的小路往地平线走，路尽头站着一个发光的她自己（自我身份）
//   S5 有人笑着递来一朵花，她毫不犹豫接过去（珍视认可、容易轻信）
//   S6 风车转起来，风里的光尘往天上卷，汇成一颗星（理想、自由、热爱 → 追梦）
//   S7 一架有体积的发光天平：粉色的心那头沉下去，蓝色的方块那头翘起来（感性 > 理性）
//   S8 书页之后：俯瞰夜里一大片人头大小的柔光点（100 个），只有一个是暖金色（1%）
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const U = require('./pwu');
const { C, K, L, LIME, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, vis, mix, rgba, mulberry32, hash } = K;
const R0 = mulberry32(202);
const LAMP = [255, 200, 130];
const DUST = U.mkDust(22, 60, [0, 300, W, 1500]);

function hill(ctx, t, wind = 0) {
  U.vgrad(ctx, [[0, [8, 16, 30]], [0.6, [22, 40, 54]], [1, [34, 58, 56]]], -200, 1120);
  for (let i = 0; i < 60; i++) glow(ctx, (i * 173) % W, 60 + (i * 71) % 860, 4, [230, 240, 230], 0.3 * (0.5 + 0.5 * Math.sin(t + i)));
  glow(ctx, 240, 300, 220, [210, 230, 220], 0.35); glow(ctx, 240, 300, 50, [245, 250, 240], 0.9);
  ctx.fillStyle = 'rgb(14,30,32)'; ctx.beginPath(); ctx.moveTo(-100, 1120); for (let i = 0; i <= 10; i++) ctx.lineTo(-100 + i * 130, 1010 - Math.sin(i * 1.1 + 2) * 70); ctx.lineTo(W + 100, 1120); ctx.closePath(); ctx.fill();
  // 近处的山岗（往下鼓的弧面）
  const g = ctx.createLinearGradient(0, 1080, 0, H); g.addColorStop(0, 'rgb(36,66,52)'); g.addColorStop(1, 'rgb(8,16,14)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-100, 1200); ctx.quadraticCurveTo(540, 1040, W + 100, 1200); ctx.lineTo(W + 100, H + 100); ctx.lineTo(-100, H + 100); ctx.closePath(); ctx.fill();
  // 风里的草：粗短的弯叶（有宽度，随风倒）
  ctx.save();
  for (let i = 0; i < 60; i++) { const x = (i * 97) % (W + 100) - 50, y = 1180 + ((i * 53) % 500), s = 0.6 + (y - 1180) / 500, sw = (Math.sin(t * 2 + i) * 8 + wind * 40) * s;
    ctx.fillStyle = `rgba(${60 + i % 3 * 10},${110 + i % 4 * 8},${80},${0.35 + 0.3 * s})`; ctx.beginPath(); ctx.moveTo(x - 6 * s, y); ctx.quadraticCurveTo(x + sw * 0.4, y - 30 * s, x + sw, y - 60 * s); ctx.quadraticCurveTo(x + 6 * s + sw * 0.4, y - 30 * s, x + 6 * s, y); ctx.fill(); }
  ctx.restore();
}
// 手提灯：有灯罩、提手和火光
function lantern(ctx, x, y, s, f, a = 1) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  glow(ctx, x, y, 420 * s * f, LAMP, 0.32 * f);
  ctx.fillStyle = 'rgb(60,44,30)'; ctx.beginPath(); ctx.roundRect(x - 34 * s, y - 64 * s, 68 * s, 14 * s, 4 * s); ctx.fill(); ctx.beginPath(); ctx.roundRect(x - 30 * s, y + 46 * s, 60 * s, 14 * s, 4 * s); ctx.fill();
  const g = ctx.createRadialGradient(x, y, 0, x, y, 40 * s); g.addColorStop(0, `rgba(255,240,200,${0.95 * f})`); g.addColorStop(1, `rgba(255,170,90,${0.55 * f})`);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - 28 * s, y - 50 * s, 56 * s, 96 * s, 14 * s); ctx.fill();
  ctx.strokeStyle = 'rgb(60,44,30)'; ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.arc(x, y - 70 * s, 22 * s, Math.PI, 0); ctx.stroke();
  glow(ctx, x, y, 60 * s, [255, 250, 220], 0.9 * f);
  ctx.restore();
}
// 摊开的书（俯视一点的角度）：两页弧面 + 书页厚度 + 字行
function openBook(ctx, x, y, s, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  U.shadow(ctx, 0, 40, 320, 0.6);
  ctx.fillStyle = 'rgb(110,60,40)'; ctx.beginPath(); ctx.moveTo(-300, 10); ctx.lineTo(300, 10); ctx.lineTo(290, 40); ctx.lineTo(-290, 40); ctx.closePath(); ctx.fill();
  for (const sd of [-1, 1]) {
    const g = ctx.createLinearGradient(0, 0, sd * 290, 0); g.addColorStop(0, 'rgb(180,160,130)'); g.addColorStop(0.2, 'rgb(240,228,204)'); g.addColorStop(1, 'rgb(222,206,178)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, -10); ctx.quadraticCurveTo(sd * 140, -60, sd * 290, -40); ctx.lineTo(sd * 290, 20); ctx.quadraticCurveTo(sd * 140, 0, 0, 20); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(90,70,56,0.3)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(sd * 150, -26 + k * 12, 100, 3, sd * 0.08, 0, 6.283); ctx.fill(); }
  }
  ctx.restore();
}
// 花：几片有体积的花瓣
function flower(ctx, x, y, s, a, t) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.globalAlpha *= a;
  ctx.strokeStyle = 'rgb(70,130,80)'; ctx.lineWidth = 8 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(10 * s, 60 * s, 0, 120 * s); ctx.stroke();
  glow(ctx, 0, -10 * s, 120 * s, [255, 180, 200], 0.35);
  for (let i = 0; i < 6; i++) { const an = i / 6 * 6.283 + t * 0.3; ctx.save(); ctx.rotate(an); const g = ctx.createRadialGradient(0, -22 * s, 0, 0, -22 * s, 30 * s); g.addColorStop(0, 'rgb(255,230,236)'); g.addColorStop(1, 'rgb(240,140,170)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -24 * s, 16 * s, 28 * s, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
  U.orb(ctx, 0, 0, 12 * s, [255, 220, 120], 1);
  ctx.restore();
}
// 发光天平：粗立柱 + 粗横梁 + 两个托盘（盘里各放一样东西）
function scale(ctx, x, y, tilt, a, t) {
  ctx.save(); ctx.globalAlpha *= a;
  glow(ctx, x, y + 120, 520, [200, 210, 255], 0.18);
  const g = ctx.createLinearGradient(x - 20, 0, x + 20, 0); g.addColorStop(0, 'rgb(150,130,90)'); g.addColorStop(0.5, 'rgb(250,220,150)'); g.addColorStop(1, 'rgb(140,110,70)');
  ctx.fillStyle = g; ctx.fillRect(x - 16, y, 32, 420); ctx.beginPath(); ctx.ellipse(x, y + 420, 120, 26, 0, 0, 6.283); ctx.fill();
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-330, -14, 660, 28, 14); ctx.fill();
  ctx.restore();
  U.orb(ctx, x, y, 26, [255, 230, 170], 1);
  for (const sd of [-1, 1]) {
    const px = x + Math.cos(tilt) * 320 * sd, py = y + Math.sin(tilt) * 320 * sd, py2 = py + 200;
    ctx.fillStyle = 'rgba(240,210,150,0.7)'; ctx.fillRect(px - 4, py, 8, 200);
    const pg = ctx.createLinearGradient(0, py2 - 10, 0, py2 + 30); pg.addColorStop(0, 'rgb(250,220,150)'); pg.addColorStop(1, 'rgb(150,110,60)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(px, py2, 140, 30, 0, 0, Math.PI); ctx.fill(); ctx.beginPath(); ctx.ellipse(px, py2, 140, 14, 0, 0, 6.283); ctx.fill();
    if (sd < 0) { // 心（粉）
      glow(ctx, px, py2 - 70, 200, PINK, 0.45);
      ctx.fillStyle = 'rgb(255,150,180)'; ctx.beginPath(); const hx = px, hy = py2 - 50; ctx.moveTo(hx, hy + 30); ctx.bezierCurveTo(hx - 90, hy - 30, hx - 50, hy - 100, hx, hy - 60); ctx.bezierCurveTo(hx + 50, hy - 100, hx + 90, hy - 30, hx, hy + 30); ctx.fill();
      ctx.fillStyle = 'rgba(255,240,245,0.45)'; ctx.beginPath(); ctx.ellipse(hx - 30, hy - 60, 14, 22, -0.5, 0, 6.283); ctx.fill();
    } else { // 方块（蓝，理性）
      glow(ctx, px, py2 - 60, 160, BLUE, 0.35);
      const s = 56; ctx.fillStyle = 'rgb(110,150,220)'; ctx.fillRect(px - s / 2, py2 - s - 10, s, s);
      ctx.fillStyle = 'rgb(160,195,250)'; ctx.beginPath(); ctx.moveTo(px - s / 2, py2 - s - 10); ctx.lineTo(px - s / 2 + 20, py2 - s - 30); ctx.lineTo(px + s / 2 + 20, py2 - s - 30); ctx.lineTo(px + s / 2, py2 - s - 10); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgb(80,110,180)'; ctx.beginPath(); ctx.moveTo(px + s / 2, py2 - s - 10); ctx.lineTo(px + s / 2 + 20, py2 - s - 30); ctx.lineTo(px + s / 2 + 20, py2 - 30); ctx.lineTo(px + s / 2, py2 - 10); ctx.closePath(); ctx.fill();
    }
  }
  ctx.restore();
}

module.exports = function make(G) {
  const S = []; const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const P1 = G.PAGES.find(p => p.name === 'P1');
  const b = {}; for (let i = 1; i <= 12; i++) b[i] = vs('B' + String(i).padStart(2, '0'));
  const ORBS = [[PINK, at('B05', '情感')], [GOLD, at('B05', '慈善')], [[240, 246, 255], at('B05', '真实')]];
  // ===== S1–S6：山岗上，一盏灯贯穿 =====
  add(G.a, b[11] - 0.2, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const wind = smooth(prog(t, b[1], b[2])) * (1 - smooth(prog(t, b[4] - 0.5, b[4])));
    const walk = easeInOut(prog(t, b[6] + 0.3, b[8] - 0.4));
    const camZ = 1 + 0.06 * smooth(prog(t, b[1], b[4])) + 0.1 * smooth(prog(t, b[5] - 0.4, b[5] + 1)) * (1 - smooth(prog(t, b[6] - 0.3, b[6] + 0.8)));
    ctx.translate(W / 2, 1250); ctx.scale(camZ, camZ); ctx.translate(-W / 2, -1250);
    hill(ctx, t, wind);
    // S1：远处别人的灯，被风吹灭
    if (t < b[4] + 0.5) {
      const others = [[160, 1150, 1.2], [880, 1140, 1.3], [700, 1080, 0.8], [330, 1070, 0.8]];
      const fade = smooth(prog(t, b[4] - 0.4, b[4] + 0.5));
      others.forEach(([x, y, s], i) => {
        const o = MB.person(ctx, ['esfj-male', 'estp-female', 'entj-female', 'isfp-male'][i], x, y, s, { a: 0.75 * (1 - fade), dim: 0.6, flip: x > W / 2 });
        const out = smooth(prog(t, b[2] + i * 0.6, b[2] + i * 0.6 + 0.8));
        const sway = Math.sin(t * 9 + i) * wind * 0.3;
        lantern(ctx, x + 40 * s + sway * 30, y - 120 * s, 0.5 * s, (1 - out) * (0.8 + 0.2 * Math.sin(t * 20 + i)), 1 - fade);
      });
    }
    // S2：书 + 光柱
    const bk = smooth(prog(t, b[4] - 0.3, b[4] + 0.6)) * (1 - smooth(prog(t, b[6] - 0.4, b[6] + 0.4)));
    if (bk > 0.01) {
      openBook(ctx, 790, 1250, 0.75, bk);
      U.beam(ctx, 790, 1230, 340, 790, 150, 520, [255, 230, 170], 0.3 * bk);
      for (let i = 0; i < 40; i++) { const u = (t * 0.2 + i / 40) % 1; glow(ctx, 790 + Math.sin(i * 5 + t) * 140 * u, 1220 - u * 1000, 8 + (i % 3) * 4, [255, 230, 180], 0.7 * bk * (1 - u)); }
    }
    // S4：踏光的小路 + 远处发光的她自己
    const path = smooth(prog(t, b[6] - 0.2, b[6] + 1.2)) * (1 - smooth(prog(t, b[8] - 0.6, b[8])));
    if (path > 0.01) {
      for (let k = 0; k < 12; k++) { const u = k / 11, y = lerp(1500, 1110, Math.sqrt(u)), x = lerp(500, 820, u) + Math.sin(u * 5) * 60, s = lerp(1, 0.25, Math.sqrt(u)); U.pool(ctx, x, y, 120 * s, [255, 220, 160], 0.6 * path * smooth(prog(t, b[6] + u * 1.2, b[6] + u * 1.2 + 0.4)), 0.25); }
      const me = smooth(prog(t, b[7] - 0.2, b[7] + 1.0)) * path;
      if (me > 0.01) { glow(ctx, 830, 1000, 220, [255, 230, 190], 0.6 * me); ctx.save(); ctx.globalAlpha *= me; ctx.filter = 'brightness(1.8) blur(1px)'; infp(ctx, 830, 1110, 0.32, { t, a: 0.9, flies: 1, wind: false, look: [-1, 0] }); ctx.filter = 'none'; ctx.restore(); }
    }
    // 她（灯一直在手上）
    const sx = lerp(420, 640, walk), sy = 1420 - walk * 140, ss = 1.15 - walk * 0.35;
    const take = smooth(prog(t, b[8] + 0.6, b[8] + 1.4));
    const o = infp(ctx, sx, sy, ss, { t, a: 1, flies: 1, wind: t > b[9] - 0.5, spin: t * 4, ra: -0.6 - take * 0.5, look: t > b[9] ? [0.2, -1] : [0.6, -0.2], eyes: take > 0.5 && t < b[9] ? 'happy' : 'open', lean: wind * -0.06 });
    const lh = o.lh || [sx - 80, sy - 280];
    // 三团光落进灯里
    let n = 0; ORBS.forEach(([c, t0], i) => { const u = prog(t, t0 - 0.3, t0 + 0.6); if (u >= 1) n++; if (u <= 0 || u >= 1) return; U.orb(ctx, lerp(300 + i * 240, lh[0], easeIn(u)), lerp(500, lh[1] + 20, easeIn(u)), 40 * (1 - 0.6 * u), c, 1); });
    const lampF = 0.85 + 0.15 * Math.sin(t * 6) + 0.25 * n * (1 - smooth(prog(t, b[6], b[6] + 2)));
    lantern(ctx, lh[0] - 10, lh[1] + 40, 0.9 * ss / 1.15, Math.min(1.4, lampF));
    // S5：有人递来一朵花
    const fl = smooth(prog(t, b[8] - 0.2, b[8] + 0.6)) * (1 - smooth(prog(t, b[9] - 0.3, b[9] + 0.4)));
    if (fl > 0.01) {
      const ho = MB.person(ctx, 'enfp-male', sx + 330, sy, 2.4 * ss / 1.15, { a: fl, flip: true, dim: 0.15 });
      const hand = o.rh || [sx + 120, sy - 300];
      flower(ctx, lerp(sx + 230, hand[0] + 10, take), lerp(sy - 330, hand[1] - 40, take), 0.9, fl, t);
    }
    // S6：风车吹出的光尘卷上天，汇成一颗星
    const dream = smooth(prog(t, b[9], b[9] + 1)) * (1 - smooth(prog(t, b[11] - 0.6, b[11])));
    if (dream > 0.01) {
      const star = smooth(prog(t, b[10], b[10] + 2.5));
      for (let i = 0; i < 80; i++) { const u = ((t - b[9]) * 0.25 + i / 80) % 1, an = i * 2.4 + t, rr = lerp(60, 300, Math.sin(u * Math.PI)); const px = lerp(o.wheel ? o.wheel[0] : sx + 100, 760, u) + Math.cos(an) * rr * (1 - u), py = lerp(o.wheel ? o.wheel[1] : sy - 300, 380, u) + Math.sin(an) * rr * 0.3 * (1 - u); glow(ctx, px, py, 10, i % 3 ? LIME : GOLD, 0.6 * dream * (0.4 + 0.6 * u)); }
      glow(ctx, 760, 380, 360 * star, [255, 240, 190], 0.5 * star * dream); U.orb(ctx, 760, 380, 46 * star, [255, 246, 210], dream * star);
    }
    U.dust(ctx, t, DUST, [220, 240, 180], 0.5, 12);
    ctx.restore();
    return { n };
  }, (ctx, t, a, st) => {
    if (!st) return;
    const v = vis(t, ORBS[0][1] - 0.2, b[6] - 0.2, 0.3, 0.4);
    if (v > 0.01) K.text(ctx, st.n + ' / 3', W - 100, 320, { size: 70, family: 'Latin', weight: 600, color: [255, 230, 190], alpha: a * v, align: 'right' });
  });
  // ===== S7：天平 =====
  add(b[11] - 0.4, P1.a + 0.4, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    U.vgrad(ctx, [[0, [12, 14, 30]], [1, [30, 30, 50]]], -200, H + 200);
    U.fog(ctx, 540, 1200, 600, t * 0.3, 0.6, [60, 60, 110]);
    U.pool(ctx, 540, 1290, 500, [200, 210, 255], 0.3);
    const tilt = lerp(0, -0.32, easeOut(prog(t, at('B11', '感性') - 0.1, at('B11', '感性') + 1.2))) + Math.sin(t * 3) * 0.01;
    scale(ctx, 540, 860, tilt, 1, t);
    ctx.restore();
  });
  // ===== S8：1%（书页之后） =====
  add(P1.b - 0.4, G.b + 0.4, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const z = 1.25 - 0.25 * easeOut(prog(t, P1.b, b[12] + 3));
    ctx.translate(W / 2, 900); ctx.scale(z, z); ctx.translate(-W / 2, -900);
    U.vgrad(ctx, [[0, [10, 14, 24]], [1, [22, 26, 40]]], -200, H + 200);
    // 透视铺开的 10 x 10 人群（俯视的头顶光点），一个是暖金色
    const lit = smooth(prog(t, at('B12', '百分之一') - 0.2, at('B12', '百分之一') + 0.6));
    for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
      const u = r / 9, y = lerp(420, 1560, u * u * 0.6 + u * 0.4), sp = lerp(84, 140, u), x = 540 + (c - 4.5) * sp + Math.sin(r * 3 + c) * 6, s = lerp(0.45, 1.1, u);
      const me = r === 6 && c === 3, col = me ? mix([150, 170, 210], [255, 210, 130], lit) : [150, 170, 210];
      U.shadow(ctx, x, y + 26 * s, 34 * s, 0.4);
      U.orb(ctx, x, y, 34 * s * (me ? 1 + 0.25 * lit : 1), col, me ? 1 : 0.6 - 0.2 * lit);
      if (me) { glow(ctx, x, y, 260 * lit, [255, 200, 130], 0.4 * lit); U.pool(ctx, x, y + 30, 160, [255, 200, 130], 0.5 * lit); }
    }
    ctx.restore();
  }, (ctx, t, a) => {
    const v = vis(t, at('B12', '百分之一') + 0.2, G.b + 1, 0.4, 0.4);
    if (v > 0.01) K.text(ctx, '1 / 100', W / 2, 300, { size: 120, family: 'Latin', weight: 600, color: [255, 226, 180], alpha: a * v });
  });
  return S;
};
