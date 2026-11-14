'use strict';
// 《INFP》v3 第 6 组（Kiro）：F01–F10 保护精力，书页 P4/P5 之后关注卡
//   一个贯穿装置：她身边浮着一颗玻璃「蓝量」球（她的精力），液面高低 + 球上的百分数当证据
//   F01-F02 夜里的房间，球是满的；左右远处另两个人也有一样大的球（天生不差）
//   F03-F05 工作纸页一张张冒出来、越变越大、越叠越多，每张都从球里抽走一道光流 → 100% 掉到 38%
//   F06-F07 身边一圈人胸口压着暗色情绪，暗雾流进她，球里的光变成血色往外被抽 → 9%；粉色丝带（同情心）缠住她的手
//   F08 一根金色的跳高横杆从上方降下，停在高得够不着的地方（道德水准太高）
//   F09-F10 她抬手撑开一层光罩：暗雾撞上光罩散开，往外抽的光流断开，丝带松开化成光点，球慢慢回到 55%
//   关注卡：暖色光尘往中间聚，金粒子聚成「关注依恋研究室」
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const { C, K, L, LIME, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, vis, mix, rgba, mulberry32 } = K;

const MANA = [96, 170, 255], MANA2 = [40, 80, 190], BLOOD = [236, 92, 98], BLOOD2 = [130, 30, 44];
const R0 = mulberry32(606);

// ---------- 布景：夜里的房间（右上大窗 + 月光斜进来，左边落地灯暖光，木地板） ----------
const FLOOR = 1230;
const PLANKS = Array.from({ length: 16 }, (_, i) => ({ x: -900 + i * 190 + R0() * 40, tone: 0.75 + R0() * 0.5 }));
const DUST = Array.from({ length: 70 }, () => ({ u: R0(), v: R0(), r: 1.5 + R0() * 4, ph: R0() * 6.28, sp: 0.2 + R0() * 0.6 }));
function room(ctx, t, o) {
  const { warm = 1, moon = 1, dark = 0 } = o;
  let g = ctx.createLinearGradient(0, 0, 0, FLOOR);
  g.addColorStop(0, rgba(mix([14, 20, 34], [6, 8, 14], dark))); g.addColorStop(1, rgba(mix([26, 34, 48], [10, 12, 18], dark)));
  ctx.fillStyle = g; ctx.fillRect(-400, -400, W + 800, FLOOR + 400);
  // 墙面上一点细微的竖向纹理（墙纸）
  ctx.save(); ctx.globalAlpha = 0.05 * (1 - dark);
  for (let i = -2; i < 14; i++) { const x = i * 96; const gg = ctx.createLinearGradient(x, 0, x + 96, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,1)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = gg; ctx.fillRect(x, -400, 96, FLOOR + 400); }
  ctx.restore();
  // 窗：厚窗框 + 窗外夜空和月亮
  const wx = 640, wy = 120, ww = 360, wh = 520;
  ctx.save();
  g = ctx.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, rgba([30, 50, 86])); g.addColorStop(1, rgba([16, 26, 46]));
  ctx.fillStyle = g; ctx.fillRect(wx, wy, ww, wh);
  ctx.save(); ctx.beginPath(); ctx.rect(wx, wy, ww, wh); ctx.clip();
  glow(ctx, wx + 250, wy + 130, 260, [170, 200, 255], 0.5 * moon); glow(ctx, wx + 250, wy + 130, 54, [240, 246, 255], 0.95 * moon);
  for (let i = 0; i < 22; i++) glow(ctx, wx + ((i * 97) % ww), wy + ((i * 61) % (wh * 0.6)), 4, [220, 230, 255], 0.3 * moon * (0.5 + 0.5 * Math.sin(t * 0.8 + i)));
  ctx.restore();
  ctx.fillStyle = 'rgb(20,22,30)';
  ctx.fillRect(wx - 26, wy - 26, ww + 52, 26); ctx.fillRect(wx - 26, wy + wh, ww + 52, 34); ctx.fillRect(wx - 26, wy, 26, wh); ctx.fillRect(wx + ww, wy, 26, wh);
  ctx.fillRect(wx + ww / 2 - 9, wy, 18, wh); ctx.fillRect(wx, wy + wh * 0.45 - 9, ww, 18);
  ctx.fillStyle = 'rgba(150,180,230,0.12)'; ctx.fillRect(wx - 26, wy + wh, ww + 52, 6);
  ctx.restore();
  // 月光斜照进来（体积光）落在地板上
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  g = ctx.createLinearGradient(wx + ww / 2, wy + 100, 260, FLOOR + 220);
  g.addColorStop(0, `rgba(150,180,240,${0.16 * moon})`); g.addColorStop(1, 'rgba(150,180,240,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx, wy + 40); ctx.lineTo(wx + ww, wy + 40); ctx.lineTo(560, FLOOR + 260); ctx.lineTo(60, FLOOR + 220); ctx.closePath(); ctx.fill();
  for (const d of DUST) { const x = lerp(wx + 40, 120, d.u) + Math.sin(t * 0.2 + d.ph) * 30, y = lerp(wy + 80, FLOOR + 100, d.u) + (d.v - 0.5) * 300; glow(ctx, x, y, d.r * 3, [200, 220, 255], 0.16 * moon * (0.5 + 0.5 * Math.sin(t * d.sp + d.ph))); }
  ctx.restore();
  // 左边落地灯：灯罩 + 暖光
  ctx.save();
  const lx = 90, ly = 520;
  ctx.fillStyle = 'rgb(28,22,18)'; ctx.fillRect(lx - 7, ly + 60, 14, FLOOR - ly - 60);
  ctx.beginPath(); ctx.ellipse(lx, FLOOR, 70, 14, 0, 0, 6.283); ctx.fill();
  g = ctx.createLinearGradient(0, ly - 90, 0, ly + 60); g.addColorStop(0, rgba(mix([120, 80, 40], [255, 190, 120], warm * 0.8))); g.addColorStop(1, rgba(mix([80, 50, 30], [230, 150, 80], warm * 0.8)));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx - 70, ly - 90); ctx.lineTo(lx + 70, ly - 90); ctx.lineTo(lx + 110, ly + 60); ctx.lineTo(lx - 110, ly + 60); ctx.closePath(); ctx.fill();
  glow(ctx, lx, ly + 40, 520, [255, 170, 100], 0.32 * warm); glow(ctx, lx, ly + 70, 160, [255, 210, 150], 0.5 * warm);
  ctx.restore();
  // 地板：木板往远处收，靠近的亮、远的暗，地上映着窗光和灯光
  g = ctx.createLinearGradient(0, FLOOR, 0, H); g.addColorStop(0, rgba(mix([44, 34, 30], [14, 12, 12], dark))); g.addColorStop(1, rgba(mix([22, 16, 14], [6, 5, 5], dark)));
  ctx.fillStyle = g; ctx.fillRect(-400, FLOOR, W + 800, H - FLOOR + 400);
  ctx.save(); ctx.beginPath(); ctx.rect(-400, FLOOR, W + 800, H); ctx.clip();
  for (const p of PLANKS) {
    const xa = W / 2 + (p.x - W / 2) * 0.25, xb = p.x;
    ctx.fillStyle = `rgba(0,0,0,${0.18 * p.tone})`; ctx.beginPath(); ctx.moveTo(xa - 2, FLOOR); ctx.lineTo(xa + 2, FLOOR); ctx.lineTo(xb + 6, H + 200); ctx.lineTo(xb - 6, H + 200); ctx.closePath(); ctx.fill();
  }
  ctx.globalCompositeOperation = 'lighter';
  ctx.save(); ctx.translate(300, FLOOR + 140); ctx.scale(1, 0.22); glow(ctx, 0, 0, 420, [150, 180, 240], 0.22 * moon); ctx.restore();
  ctx.save(); ctx.translate(140, FLOOR + 40); ctx.scale(1, 0.25); glow(ctx, 0, 0, 380, [255, 170, 100], 0.3 * warm); ctx.restore();
  ctx.restore();
  // 墙根一道暗
  g = ctx.createLinearGradient(0, FLOOR - 60, 0, FLOOR + 30); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.35)'); ctx.fillStyle = g; ctx.fillRect(-400, FLOOR - 60, W + 800, 90);
}

// ---------- 蓝量球：玻璃球 + 液面波动 + 气泡 + 外发光 ----------
const BUB = Array.from({ length: 26 }, () => ({ x: R0() * 2 - 1, sp: 0.3 + R0() * 0.7, r: 3 + R0() * 9, ph: R0() }));
function vessel(ctx, x, y, R, lvl, t, o = {}) {
  const { blood = 0, a = 1, flick = 0 } = o;
  const top = mix(MANA, BLOOD, blood), deep = mix(MANA2, BLOOD2, blood), f = 1 - flick * (0.5 + 0.5 * Math.sin(t * 37)) * 0.6;
  ctx.save(); ctx.globalAlpha *= a;
  // 背后的光：越满越亮
  glow(ctx, x, y, R * 2.6, top, (0.18 + 0.32 * lvl) * f);
  // 地上的影子和反光
  ctx.save(); ctx.translate(x, FLOOR + 40); ctx.scale(1, 0.18); glow(ctx, 0, 0, R * 1.3, top, 0.25 * lvl * f); ctx.restore();
  // 玻璃本体（暗底）
  let g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.35, R * 0.1, x, y, R);
  g.addColorStop(0, 'rgba(180,210,240,0.10)'); g.addColorStop(0.75, 'rgba(60,80,120,0.16)'); g.addColorStop(1, 'rgba(160,200,255,0.30)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, 6.283); ctx.fill();
  // 液体
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, R - 6, 0, 6.283); ctx.clip();
  const sy = y + R - 2 * R * clamp(lvl), amp = 10 + 6 * Math.sin(t * 0.9);
  ctx.beginPath(); ctx.moveTo(x - R - 10, sy);
  for (let i = 0; i <= 40; i++) { const u = i / 40, xx = x - R - 10 + u * (2 * R + 20); ctx.lineTo(xx, sy + Math.sin(u * 7 + t * 2.4) * amp * 0.6 + Math.sin(u * 13 - t * 3.1) * amp * 0.3); }
  ctx.lineTo(x + R + 10, y + R + 10); ctx.lineTo(x - R - 10, y + R + 10); ctx.closePath();
  g = ctx.createLinearGradient(0, sy - 20, 0, y + R); g.addColorStop(0, rgba(mix(top, [255, 255, 255], 0.35), 0.95 * f)); g.addColorStop(0.25, rgba(top, 0.85 * f)); g.addColorStop(1, rgba(deep, 0.95 * f));
  ctx.fillStyle = g; ctx.fill();
  // 液面那一道亮（厚的柔光带）
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  g = ctx.createLinearGradient(0, sy - 26, 0, sy + 30); g.addColorStop(0, rgba(top, 0)); g.addColorStop(0.5, rgba(mix(top, [255, 255, 255], 0.5), 0.45 * f)); g.addColorStop(1, rgba(top, 0));
  ctx.fillStyle = g; ctx.fillRect(x - R, sy - 26, 2 * R, 56);
  for (const b of BUB) { const by = y + R - ((t * b.sp * 0.25 + b.ph) % 1) * (y + R - sy); if (by < sy) continue; glow(ctx, x + b.x * R * 0.75, by, b.r * 2, mix(top, [255, 255, 255], 0.6), 0.5 * f); }
  ctx.restore();
  ctx.restore();
  // 玻璃边缘的厚光 + 左上高光
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  g = ctx.createRadialGradient(x, y, R * 0.86, x, y, R * 1.04); g.addColorStop(0, 'rgba(200,225,255,0)'); g.addColorStop(0.8, 'rgba(200,225,255,0.28)'); g.addColorStop(1, 'rgba(200,225,255,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R * 1.05, 0, 6.283); ctx.fill();
  ctx.save(); ctx.translate(x - R * 0.42, y - R * 0.48); ctx.rotate(-0.7); ctx.scale(1, 0.45);
  g = ctx.createRadialGradient(0, 0, 0, 0, 0, R * 0.32); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, R * 0.32, 0, 6.283); ctx.fill();
  ctx.restore(); ctx.restore();
  ctx.restore();
}

// ---------- 光流：一束有宽度的粒子流（底下一层宽柔光带 + 上面流动的光点） ----------
function bez(A, B, Cc, s) { const u = 1 - s; return [u * u * A[0] + 2 * u * s * Cc[0] + s * s * B[0], u * u * A[1] + 2 * u * s * Cc[1] + s * s * B[1]]; }
function stream(ctx, A, B, Cc, t, c, a, o = {}) {
  if (a <= 0.003) return;
  const { n = 46, w = 34, sp = 0.45, cut = 1 } = o;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  ctx.lineCap = 'round';
  ctx.beginPath(); for (let i = 0; i <= 30; i++) { const s = (i / 30) * cut, p = bez(A, B, Cc, s); i ? ctx.lineTo(...p) : ctx.moveTo(...p); }
  for (const [lw, la] of [[w * 2.2, 0.05], [w, 0.09]]) { ctx.strokeStyle = rgba(c, la * a); ctx.lineWidth = lw; ctx.stroke(); }
  for (let i = 0; i < n; i++) {
    const s = (i / n + t * sp) % 1; if (s > cut) continue;
    const p = bez(A, B, Cc, s), j = Math.sin(i * 12.9 + t * 2) * w * 0.35, env = Math.sin(Math.PI * s);
    glow(ctx, p[0] + j, p[1] + Math.cos(i * 7.1 + t * 1.6) * w * 0.3, 10 + (i % 4) * 4, c, a * (0.35 + 0.65 * env));
  }
  ctx.restore();
}
// 暗色情绪雾：一团慢慢翻滚的深色体
function gloom(ctx, x, y, r, t, a, c = [70, 80, 120]) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  for (let i = 0; i < 7; i++) {
    const ax = x + Math.sin(t * 0.7 + i * 1.9) * r * 0.45, ay = y + Math.cos(t * 0.6 + i * 2.3) * r * 0.3, rr = r * (0.55 + 0.1 * (i % 3));
    const g = ctx.createRadialGradient(ax, ay, 0, ax, ay, rr); g.addColorStop(0, `rgba(${c[0] * 0.4 | 0},${c[1] * 0.4 | 0},${c[2] * 0.4 | 0},0.5)`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(ax, ay, rr, 0, 6.283); ctx.fill();
  }
  glow(ctx, x, y, r * 1.1, c, 0.22);
  ctx.restore();
}
// 工作纸页：有厚度、投影、暖光的纸，上面几条模糊的字行（粗柔的灰条）
function sheet(ctx, x, y, w, h, rot, a, glowA = 0.3) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  glow(ctx, 0, 0, Math.max(w, h) * 0.9, [255, 210, 150], glowA);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  ctx.fillStyle = 'rgb(210,198,176)'; ctx.fillRect(-w / 2 + 5, -h / 2 + 6, w, h);
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, 'rgb(250,240,222)'); g.addColorStop(1, 'rgb(220,206,182)');
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = 'rgba(90,80,70,0.28)';
  const rows = Math.max(3, Math.floor(h / (w * 0.12)));
  for (let i = 0; i < rows; i++) { const ry = -h / 2 + h * 0.16 + i * (h * 0.7 / rows), rw = w * (i === rows - 1 ? 0.45 : 0.72 + 0.1 * Math.sin(i * 3)); ctx.beginPath(); ctx.roundRect(-w / 2 + w * 0.12, ry, rw, Math.max(6, w * 0.035), 4); ctx.fill(); }
  ctx.restore();
}
// 粉色丝带（同情心）：厚丝带，两面明暗不同
function ribbon(ctx, pts, wd, a, t) {
  if (a <= 0.003 || pts.length < 2) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p));
  ctx.strokeStyle = 'rgba(150,60,90,0.9)'; ctx.lineWidth = wd; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,160,190,0.9)'; ctx.lineWidth = wd * 0.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,225,235,0.55)'; ctx.lineWidth = wd * 0.18; ctx.stroke();
  ctx.globalCompositeOperation = 'lighter'; for (let i = 0; i < pts.length; i += 3) glow(ctx, pts[i][0], pts[i][1], wd * 1.6, PINK, 0.12);
  ctx.restore();
}
function wavePts(A, B, amp, k, t, n = 28) { const o = []; for (let i = 0; i <= n; i++) { const s = i / n, x = lerp(A[0], B[0], s), y = lerp(A[1], B[1], s) + Math.sin(s * k + t * 2.2) * amp * Math.sin(Math.PI * s); o.push([x, y]); } return o; }

module.exports = function make(G) {
  const S = [];
  const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const p4 = G.PAGES.find(p => p.name === 'P4'), p5 = G.PAGES.find(p => p.name === 'P5') || p4;
  const A = G.a, B = p4.a + 0.4;
  const T = {}; for (const id of ['F01', 'F02', 'F03', 'F04', 'F05', 'F06', 'F07', 'F08', 'F09', 'F10']) T[id] = [vs(id), ve(id)];
  const [f1] = T.F01, [f2] = T.F02, [f3] = T.F03, [f4, f4e] = T.F04, [, f5e] = T.F05, [f6] = T.F06, [f7, f7e] = T.F07, [f8, f8e] = T.F08, [f9] = T.F09, [, f10e] = T.F10;
  // 蓝量（0-1）随时间
  const level = t => {
    if (t < f3) return 1;
    if (t < f5e) return lerp(1, 0.38, easeInOut(prog(t, f3, f5e)));
    if (t < f7e) return lerp(0.38, 0.09, easeInOut(prog(t, f6, f7e)));
    if (t < f9) return 0.09;
    return lerp(0.09, 0.55, easeInOut(prog(t, f9 + 0.6, f10e + 0.5)));
  };
  const SHE = [380, 1250], ORB = [770, 760], OR = 205;
  const PEOPLE = [['estj-male', 120, 1180, 2.0], ['esfj-female', 960, 1170, 1.95], ['entp-male', 250, 1110, 1.5], ['enfj-female', 860, 1100, 1.5]];
  const TASKS = [[700, 360, 0.0], [900, 520, 0.5], [600, 520, 0.9], [960, 330, 1.3], [520, 330, 1.7]];   // 冒出的工作纸 [x,y,延迟]

  add(A, B, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const lv = level(t);
    const dark = 0.35 * smooth(prog(t, f6, f7e)) * (1 - smooth(prog(t, f9, f10e)));
    const bar = smooth(prog(t, f8 - 0.2, f8 + 1.4)) * (1 - smooth(prog(t, f9, f9 + 1.2)));
    // 镜头：开场缓推；F02 拉远看见别人；F08 往上摇看横杆；F09 回来
    const pull = smooth(prog(t, f2 - 0.2, f2 + 1.2)) * (1 - smooth(prog(t, f3 - 0.4, f3 + 0.8)));
    const tilt = bar * 260;
    const zs = 1 + 0.06 * smooth(prog(t, A, f2)) - 0.18 * pull + 0.05 * smooth(prog(t, f3, f5e)) - 0.05 * smooth(prog(t, f6, f6 + 1));
    ctx.save(); ctx.globalAlpha *= a;
    ctx.translate(W / 2, 900); ctx.scale(zs, zs); ctx.translate(-W / 2, -900 + tilt);
    room(ctx, t, { warm: 1 - dark, moon: 1 - dark * 0.6, dark });
    // F02：左右远处另两个人，也有一样大的球
    if (pull > 0.01) for (const [k, x, sd] of [['isfj-female', -170, -1], ['entj-male', 1250, 1]]) {
      MB.person(ctx, k, x, 1225, 2.3, { a: pull * 0.85, flip: sd > 0, dim: 0.3 });
      vessel(ctx, x + sd * -150, 820, OR * 0.62, 1, t + x, { a: pull * 0.9 });
    }
    // 周围那圈人（F06 起）
    const crowd = smooth(prog(t, f6 - 0.3, f6 + 1.4)) * (1 - smooth(prog(t, f8 - 0.3, f8 + 0.8)) * 0.7) * (1 - smooth(prog(t, f10e - 1, f10e + 0.3)));
    const pts = [];
    PEOPLE.forEach(([k, x, y, s], i) => {
      if (crowd <= 0.01) return;
      const o = MB.person(ctx, k, x, y, s, { a: crowd * 0.9, flip: x > W / 2, dim: 0.35 + 0.3 * (1 - lv) });
      const ch = o && o.chest ? o.chest : [x, y - 300 * s / 2];
      pts.push(ch);
      gloom(ctx, ch[0], ch[1], 90 * s / 2, t + i, crowd * (1 - 0.6 * smooth(prog(t, f9 + 0.5, f10e))));
    });
    // 光罩（F09 起）：撑开有预备（先缩一下）再张开，边缘厚柔光
    const sh0 = f9 + 0.5, dome = easeOut(prog(t, sh0, sh0 + 1.3));
    const domeR = 620 * dome * (1 - 0.05 * Math.exp(-((t - sh0 - 0.15) ** 2) / 0.01)), DC = [560, 900];
    // 她
    const slump = smooth(prog(t, f6, f7e)) * (1 - smooth(prog(t, f9, f9 + 0.8)));
    const raise = smooth(prog(t, f9 - 0.1, f9 + 0.6));
    const o = infp(ctx, SHE[0], SHE[1], 1.12, { t, a: 1, flies: 1, wind: false, dim: 0.15 + 0.4 * slump, nod: slump * 0.8 - bar * 0.7, look: bar > 0.2 ? [0, -1] : [0.6, 0], eyes: slump > 0.6 && raise < 0.3 ? 'sad' : 'open', mouth: slump > 0.5 && raise < 0.3 ? 'flat' : 'smile',
      ra: lerp(slump * 0.35, -1.5, raise), la: slump * 0.45, lean: -0.04 * slump });
    // 蓝量球（F07 血包：液体变血色、轻微闪）
    const blood = smooth(prog(t, f7 - 0.2, f7 + 0.8)) * (1 - smooth(prog(t, f9 + 0.5, f10e)));
    const flick = smooth(prog(t, at('F05', '磨损') - 0.1, at('F05', '磨损') + 0.3)) * (1 - smooth(prog(t, f6, f6 + 0.6)));
    const bob = Math.sin(t * 1.1) * 10;
    // 往外被抽走的光流
    const orbP = [ORB[0], ORB[1] + bob];
    TASKS.forEach(([x, y, dl], i) => {
      const on = smooth(prog(t, f4 + dl * ((f5e - f4) / 2.4), f4 + dl * ((f5e - f4) / 2.4) + 0.7)) * (1 - smooth(prog(t, f6 - 0.4, f6 + 0.6)));
      if (t >= f3 && i === 0) { /* 第一张从 F03 开始 */ }
      const first = i === 0 ? smooth(prog(t, f3 + 0.4, f3 + 1.1)) * (1 - smooth(prog(t, f6 - 0.4, f6 + 0.6))) : on;
      if (first <= 0.01) return;
      const big = i === 0 ? 1 + 0.7 * smooth(prog(t, at('F04', '大工作') - 0.2, at('F04', '大工作') + 0.6)) : 1;
      stream(ctx, [orbP[0] - 40, orbP[1] - 80], [x, y], [(orbP[0] + x) / 2 + 80, Math.min(orbP[1], y) - 160], t + i, MANA, first * 0.7, { w: 26 });
      const wob = Math.sin(t * 1.4 + i) * 0.04;
      sheet(ctx, x, y + Math.sin(t * 1.2 + i) * 8, 150 * big, 196 * big, -0.12 + i * 0.07 + wob, first);
      // 「重复工作」：后面叠出几张一样的
      const rep = smooth(prog(t, at('F04', '重复') - 0.1, at('F04', '重复') + 0.8));
      if (rep > 0.01 && i < 3) for (let q = 1; q <= 3; q++) sheet(ctx, x + q * 16, y - q * 16, 150 * big, 196 * big, -0.12 + i * 0.07 + wob + q * 0.03, first * rep * (1 - q * 0.22), 0.1);
    });
    // 别人的暗雾流进她，她的光被抽走流向别人（血色）
    const drain = smooth(prog(t, f6 + 0.6, f7 + 0.6)) * (1 - smooth(prog(t, sh0, sh0 + 0.8)));
    pts.forEach((ch, i) => {
      stream(ctx, ch, o.chest, [(ch[0] + o.chest[0]) / 2, ch[1] - 220], t * 0.8 + i, [90, 100, 150], drain * 0.65, { w: 40, sp: 0.3 });
      stream(ctx, [orbP[0], orbP[1] + OR * 0.4], ch, [(orbP[0] + ch[0]) / 2, orbP[1] + 260], t + i * 0.7, mix(MANA, BLOOD, blood), drain * 0.8, { w: 24, sp: 0.6, cut: 1 });
    });
    // 撞上光罩散开的暗雾
    if (dome > 0.01) {
      const bounce = smooth(prog(t, sh0 + 0.5, sh0 + 1.6)) * (1 - smooth(prog(t, f10e - 0.6, f10e + 0.4)));
      pts.forEach((ch, i) => {
        const ang = Math.atan2(ch[1] - DC[1], ch[0] - DC[0]), hx = DC[0] + Math.cos(ang) * domeR, hy = DC[1] + Math.sin(ang) * domeR;
        stream(ctx, ch, [hx, hy], [(ch[0] + hx) / 2, (ch[1] + hy) / 2 - 60], t * 0.8 + i, [90, 100, 150], bounce * 0.5 * crowd, { w: 34, sp: 0.3 });
        for (let q = 0; q < 8; q++) { const u = ((t * 0.7 + q / 8 + i * 0.13) % 1), sp = ang + (q - 3.5) * 0.12; glow(ctx, hx + Math.cos(sp) * u * 140, hy + Math.sin(sp) * u * 140, 16, [130, 150, 210], bounce * crowd * 0.4 * (1 - u)); }
      });
    }
    vessel(ctx, orbP[0], orbP[1], OR, level(t), t, { blood, flick });
    // 同情心丝带：F06 起从她手腕缠向那圈人，F10 松开化成光点
    const rb = smooth(prog(t, f6 + 1.2, f7 + 0.4)), rel = smooth(prog(t, at('F10', '绑架') - 0.3, f10e + 0.4));
    if (rb > 0.01 && false) {   // 丝带看着像细线，去掉；同情心由暗雾+光流演
      [[o.lh, pts[2] || [200, 900]], [o.rh, pts[3] || [880, 900]]].forEach(([hnd, to], i) => {
        if (!hnd || !to) return;
        const ps = wavePts(hnd, to, 60, 7, t + i, 30).slice(0, Math.max(2, Math.round(31 * rb * (1 - rel))));
        ribbon(ctx, ps, 22, 1 - rel, t);
        // 手腕上一圈（厚丝带）
        ctx.save(); ctx.globalAlpha *= 1 - rel; ctx.strokeStyle = 'rgba(255,160,190,0.9)'; ctx.lineWidth = 16; ctx.beginPath(); ctx.ellipse(hnd[0], hnd[1], 22, 12, 0.3, 0, 6.283); ctx.stroke(); ctx.restore();
        if (rel > 0.01 && rel < 0.99) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (let q = 0; q < 24; q++) { const s = q / 24, p = [lerp(hnd[0], to[0], s), lerp(hnd[1], to[1], s) - rel * 220 * (0.3 + hashq(q + i * 31))]; glow(ctx, p[0] + Math.sin(q * 3 + t) * 20, p[1], 14, PINK, (1 - rel) * 0.7); } ctx.restore(); }
      });
    }
    // 光罩本体：半透明实心 + 厚柔光边 + 里面缓慢流动的光
    if (dome > 0.01) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      let g = ctx.createRadialGradient(DC[0], DC[1], domeR * 0.2, DC[0], DC[1], domeR);
      g.addColorStop(0, 'rgba(255,230,190,0.0)'); g.addColorStop(0.75, `rgba(255,220,170,${0.06 * dome})`); g.addColorStop(0.93, `rgba(255,226,180,${0.24 * dome})`); g.addColorStop(1, 'rgba(255,226,180,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(DC[0], DC[1], domeR, 0, 6.283); ctx.fill();
      for (let q = 0; q < 10; q++) { const an = q / 10 * 6.283 + t * 0.25; glow(ctx, DC[0] + Math.cos(an) * domeR * 0.97, DC[1] + Math.sin(an) * domeR * 0.97, 60, [255, 220, 170], 0.16 * dome); }
      ctx.restore();
    }
    // 横杆（F08）：两根光柱 + 一根粗金色横杆，高得够不着
    if (bar > 0.01) {
      const by = lerp(-500, 120, easeOut(prog(t, f8 - 0.2, f8 + 1.2)));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const px of [150, 930]) {
        const g = ctx.createLinearGradient(px - 30, 0, px + 30, 0); g.addColorStop(0, 'rgba(255,210,130,0)'); g.addColorStop(0.5, `rgba(255,214,140,${0.35 * bar})`); g.addColorStop(1, 'rgba(255,210,130,0)');
        ctx.fillStyle = g; ctx.fillRect(px - 30, by, 60, FLOOR - by);
      }
      ctx.restore();
      ctx.save(); ctx.globalAlpha *= bar;
      const g = ctx.createLinearGradient(0, by - 22, 0, by + 22); g.addColorStop(0, 'rgb(255,236,170)'); g.addColorStop(0.5, 'rgb(236,180,90)'); g.addColorStop(1, 'rgb(150,96,40)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(130, by - 22, 820, 44, 22); ctx.fill();
      ctx.restore();
      glow(ctx, W / 2, by, 520, [255, 200, 120], 0.35 * bar);
    }
    ctx.restore();
    return { tilt, zs, orb: orbP, lv: level(t), blood };
  }, (ctx, t, a, st) => {
    // 球上的百分数（证据）
    if (!st || !st.orb) return;
    const [x, y] = st.orb, zs = st.zs;
    const sx = W / 2 + (x - W / 2) * zs, sy = 900 + (y + st.tilt - 900) * zs;
    const pc = Math.round(st.lv * 100), c = st.lv < 0.2 ? [255, 150, 150] : [236, 244, 255];
    const show = smooth(prog(t, f1 + 0.4, f1 + 1.2));
    K.text(ctx, pc + '%', sx, sy + 34, { size: 104, family: 'Latin', weight: 600, color: c, alpha: a * show * 0.95 });
  });

  // ===== 关注卡 =====
  const A9 = p5.b + 0.2, B9 = G.END + 1;
  const M9 = Array.from({ length: 120 }, () => ({ a: R0() * 6.283, r: 300 + R0() * 700, s: 2 + R0() * 6, sp: 0.2 + R0() * 0.5, ph: R0() }));
  add(A9, B9, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createRadialGradient(W / 2, 900, 0, W / 2, 900, 1300); g.addColorStop(0, 'rgb(40,30,22)'); g.addColorStop(0.5, 'rgb(16,12,12)'); g.addColorStop(1, 'rgb(6,6,8)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const u = easeOut(prog(t, A9, A9 + 2.5));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    glow(ctx, W / 2, 920, 900, [255, 190, 120], 0.25 * u); glow(ctx, W / 2, 920, 300, [255, 220, 170], 0.25 * u);
    for (const m of M9) { const rr = m.r * (1 - 0.55 * u) + Math.sin(t * m.sp + m.ph * 6) * 30, an = m.a + t * 0.05; glow(ctx, W / 2 + Math.cos(an) * rr, 920 + Math.sin(an) * rr * 0.75, m.s * 3, GOLD, 0.35 * (0.5 + 0.5 * Math.sin(t * 2 * m.sp + m.ph * 6))); }
    // 地面上的一层暖光（厚柔光，不画线）
    ctx.save(); ctx.translate(W / 2, 1140); ctx.scale(1, 0.12); glow(ctx, 0, 0, 760, [255, 200, 140], 0.35 * u); ctx.restore();
    ctx.restore();
    infp(ctx, W / 2, 1520, 0.62, { t, a: smooth(prog(t, A9 + 0.4, A9 + 1.6)) * 0.9, flies: 1, wind: true, spin: t * 2, eyes: 'happy' });
    ctx.restore();
  }, (ctx, t, a) => {
    const t0 = A9 + 0.5;
    ctx.save(); ctx.globalAlpha *= a;
    C.gather(ctx, '关注依恋研究室', W / 2, 880, t, t0, B9 + 30, { size: 96, weight: 600, spacing: 0.12, keys: ['关注依恋研究室'], keyColor: GOLD, from: [W / 2, 920] });
    C.gather(ctx, '了解更多心理知识', W / 2, 1010, t, t0 + 0.9, B9 + 30, { size: 54, weight: 500, spacing: 0.12, keys: ['了解更多心理知识'], keyColor: [242, 226, 190] });
    ctx.restore();
  });
  return S;
};
function hashq(n) { const s = Math.sin(n * 91.7) * 4375.5; return s - Math.floor(s); }
