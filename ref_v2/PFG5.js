'use strict';
// 《INFP》v2 第 5 组：D01-D06「优点和工作」（竖屏 1080x1920）
//   S1 夜原：念头化成光种飞来缠成一团乱线，她耐心一根根理顺，线变成通往地平线的光河（适应力/新想法/复杂情况）
//   S2 仰拍：巨大的书自己翻页，书页飞起搭成螺旋楼梯，她一级级往上走，各国文字从台阶上升起（自学/语言）
//   S3 室内：台灯光柱下她在纸上画画，近处手机一响，焦点被拉到手机上（安静干活/电话打扰）
//   S4 文件隧道：一模一样的表格一直往脸上飞，她褪成灰色，彩色的她飘进隧道深处（重复琐碎/像换了个人）
//   S5 五扇亮起的窗：写作/设计/心理咨询/教育/社会工作，每扇窗里是小小的她在做那份工作（想象和共情）
//   S6 电话墙：一整面墙的电话由远到近响起来，投诉的锯齿声波、推销的盒子，她心口的光一点点灭掉
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { C, K, L, LIME, LEAF, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, hash, mix, rgba } = K;
const TAU = Math.PI * 2;

// ---------- 小工具 ----------
const R0 = K.mulberry32(5505);
const STARS = Array.from({ length: 140 }, () => ({ x: R0() * W, y: R0() * H * 0.62, r: 0.8 + R0() * 2.2, a: 0.12 + R0() * 0.5, ph: R0() * 6.28 }));
function sky(ctx, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  for (const [o, c] of stops) g.addColorStop(o, rgba(c, 1));
  ctx.fillStyle = g; ctx.fillRect(-300, -300, W + 600, H + 600);
}
function stars(ctx, t, dy = 0, a = 1, ymax = 1e9, c = [220, 240, 230]) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const s of STARS) { const y = s.y + dy; if (y > ymax) continue; ctx.fillStyle = rgba(c, s.a * a * (0.55 + 0.45 * Math.sin(t * 1.3 + s.ph))); ctx.fillRect(s.x, y, s.r, s.r); }
  ctx.restore();
}
function zoom(ctx, s, fx, fy) { ctx.translate(fx, fy); ctx.scale(s, s); ctx.translate(-fx, -fy); }
function poly(ctx, pts, fill) { ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
// 近处虚焦大光斑 [x, y, r, 颜色, 相位, 漂移幅度, 亮度]
function bokeh(ctx, t, list, a = 1) { for (const b of list) glow(ctx, b[0] + Math.sin(t * 0.3 + b[4]) * b[5], b[1] + Math.cos(t * 0.23 + b[4]) * b[5] * 0.6, b[2], b[3], b[6] * a); }
// 远山剪影
function hills(ctx, base, amp, seed, fill, dx = 0) {
  ctx.beginPath(); ctx.moveTo(-300, base + 200);
  for (let x = -300; x <= W + 300; x += 18) ctx.lineTo(x + dx, base - amp * (0.5 + 0.5 * K.noise1(x * 0.004 + seed, seed)) - amp * 0.4 * (0.5 + 0.5 * K.noise1(x * 0.013 + seed * 3, seed + 1)));
  ctx.lineTo(W + 300, base + 200); ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
}
function bezier(p0, c, p1, n = 40) { const o = []; for (let i = 0; i <= n; i++) { const u = i / n, v = 1 - u; o.push([v * v * p0[0] + 2 * v * u * c[0] + u * u * p1[0], v * v * p0[1] + 2 * v * u * c[1] + u * u * p1[1]]); } return o; }
const back0 = ctx => X.back(ctx, 0, { floor: 0, pool: null, lift: 0.3 });

module.exports = function make(P1, END) {
  const S = [];
  const add = (a, b, draw, over) => S.push({ a, b, draw, over });

  // ================= S1：乱线团理成光河 =================
  {
    const a0 = vs('D01') - 1.2, b0 = vs('D02') + 0.2;
    const tA = vs('D01'), tC = at('D01', '复杂'), tE = ve('D01'), tU = tC + 0.25;
    const KX = 700, KY = 720, N = 24, M = 64, VP = [800, 1000];
    const COLS = [LEAF, IVORY, LIME, [150, 200, 240], [255, 190, 200], GOLD];
    const TH = Array.from({ length: N }, (_, i) => {
      const an = -Math.PI * 0.95 + hash(i * 3.3) * Math.PI * 1.25;
      return { f1: 2 + hash(i * 3.1) * 4, f2: 2.4 + hash(i * 5.7) * 4, f3: 6 + hash(i * 1.3) * 6, p1: hash(i * 7.7) * 6.28, p2: hash(i * 2.9) * 6.28,
        R: 110 + hash(i * 4.4) * 140, c: COLS[i % COLS.length], sx: KX + Math.cos(an) * 820, sy: KY + Math.sin(an) * 820, ti: tA + 0.3 + (i / N) * (tC - tA - 0.05) };
    });
    const chaos = (th, s, t) => { const k = 1 + 0.18 * Math.sin(t * 0.9 + th.p1);
      return [KX + th.R * k * (0.8 * Math.sin(s * th.f1 * 3.2 + th.p1 + t * 0.5) + 0.3 * Math.sin(s * th.f3 + t)), KY + th.R * 0.9 * k * (0.8 * Math.cos(s * th.f2 * 3.2 + th.p2 + t * 0.4) + 0.3 * Math.cos(s * th.f3 * 1.3 - t))]; };
    const order = (i, s, t, h) => { const v = i / (N - 1) - 0.5, e = Math.pow(s, 0.8);
      return [lerp(h[0], VP[0] + v * 300, e) + Math.sin(s * Math.PI) * v * 560, lerp(h[1], VP[1], e) - Math.sin(s * Math.PI) * (130 + v * 60) + Math.sin(s * 9 - t * 2.4 + i) * 12 * (1 - s)]; };
    const NEAR = [[70, 260, 190, LEAF, 0, 26, 0.14], [1010, 420, 150, GOLD, 2, 20, 0.1], [980, 1200, 230, LIME, 4, 30, 0.08], [120, 1180, 170, [150, 200, 240], 1, 24, 0.08]];
    add(a0, b0, (ctx, t, a) => {
      back0(ctx); ctx.globalAlpha = a;
      sky(ctx, [[0, [4, 10, 14]], [0.4, [10, 28, 32]], [0.51, [30, 64, 58]], [0.535, [16, 34, 30]], [1, [3, 8, 9]]]);
      const cam = smooth(prog(t, a0, b0));
      ctx.save(); zoom(ctx, lerp(0.96, 1.07, cam), 560, 880); ctx.translate(lerp(20, -20, cam), 0);
      stars(ctx, t, 0, 1, 960);
      glow(ctx, VP[0], 990, 760, [80, 150, 115], 0.32);
      hills(ctx, 990, 70, 2, 'rgba(18,40,38,0.9)', -cam * 20);
      hills(ctx, 1004, 40, 7, 'rgba(10,24,22,1)', -cam * 50);
      // 地面
      const g = ctx.createLinearGradient(0, 1000, 0, H); g.addColorStop(0, 'rgb(22,46,40)'); g.addColorStop(0.35, 'rgb(10,22,20)'); g.addColorStop(1, 'rgb(3,7,8)');
      ctx.fillStyle = g; ctx.fillRect(-300, 1000, W + 600, H);
      // 地平线雾带
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const fg = ctx.createLinearGradient(0, 930, 0, 1070); fg.addColorStop(0, 'rgba(160,220,190,0)'); fg.addColorStop(0.5, 'rgba(160,220,190,0.12)'); fg.addColorStop(1, 'rgba(160,220,190,0)');
      ctx.fillStyle = fg; ctx.fillRect(-300, 930, W + 600, 140); ctx.restore();
      // 她脚下的光池
      ctx.save(); ctx.translate(310, 1335); ctx.scale(1, 0.16); glow(ctx, 0, 0, 380, [190, 236, 160], 0.45); ctx.restore();
      const pull = smooth(prog(t, tU, tE + 0.3));
      const o = infp(ctx, 300, 1335, 1.22, { a, t, wind: false, look: [1.2, -0.4], eyes: t > tE - 0.2 ? 'happy' : 'open', mouth: 'smile',
        ra: lerp(0.1, -0.35, smooth(prog(t, tA - 0.2, tA + 0.8))) + 0.18 * pull * Math.sin(t * 2.2), la: 0.25, lean: -0.03 * pull, flies: 1 });
      const h0 = o.rh;
      // 线团中心的心跳光
      const knot = smooth(prog(t, tA + 0.4, tC)) * (1 - smooth(prog(t, tU + 0.3, tE)));
      glow(ctx, KX, KY, 360, LIME, 0.18 * knot * (0.8 + 0.2 * Math.sin(t * 6)));
      for (let i = 0; i < N; i++) {
        const th = TH[i];
        if (t < th.ti) {   // 光种飞来
          const u = prog(t, th.ti - 0.85, th.ti); if (u <= 0) continue;
          const tg = chaos(th, 0.5, t);
          for (let k = 0; k < 6; k++) { const v = easeInOut(clamp(u - k * 0.035)); glow(ctx, lerp(th.sx, tg[0], v), lerp(th.sy, tg[1], v) - Math.sin(v * Math.PI) * 90, 18 - k * 2.2, th.c, 0.85 - k * 0.13); }
          continue;
        }
        const grow = easeOut(prog(t, th.ti, th.ti + 0.6)), m = easeInOut(prog(t, tU + i * 0.04, tU + i * 0.04 + 0.8));
        const pts = [];
        for (let j = 0; j <= M; j++) {
          const s = j / M, ch0 = chaos(th, s, t), w = smooth(s / 0.14), ch = [lerp(h0[0], ch0[0], w), lerp(h0[1], ch0[1], w)];
          if (m <= 0) { pts.push(ch); continue; }
          const od = order(i, s, t, h0); pts.push([lerp(ch[0], od[0], m), lerp(ch[1], od[1], m)]);
        }
        const vp = K.partial(pts, grow), c = mix(th.c, i % 2 ? GOLD : LIME, m * 0.7);
        if (m < 0.5) glowLine(ctx, vp, c, 0.7, 1.7, 0.8);
        else { const hf = Math.floor(vp.length * 0.55); glowLine(ctx, vp.slice(0, hf + 1), c, 0.95, 2.6, 0.9); glowLine(ctx, vp.slice(hf), c, 0.7, 1.4, 0.6); }
        if (grow < 1 && vp.length) { const e = vp[vp.length - 1]; glow(ctx, e[0], e[1], 22, th.c, 0.9); }
        if (m > 0.9) for (let k = 0; k < 2; k++) { const q = pts[Math.floor(((t * 0.45 + i * 0.137 + k * 0.5) % 1) * M)]; glow(ctx, q[0], q[1], 16, GOLD, 0.9 * (m - 0.9) * 10); }
      }
      // 光河流到地平线：远处一道金光
      const done = smooth(prog(t, tU + 0.6, tE + 0.4));
      glow(ctx, VP[0], VP[1] - 8, 420, GOLD, 0.28 * done);
      ctx.save(); ctx.translate(VP[0], VP[1] + 6); ctx.scale(1, 0.12); glow(ctx, 0, 0, 520, GOLD, 0.35 * done); ctx.restore();
      ctx.restore();
      bokeh(ctx, t, NEAR);
    }, (ctx, t, a) => {
      const ca = a * K.vis(t, a0, vs('D01') + 0.9, 0.3, 0.4); if (ca <= 0.003) return;
      ctx.save(); ctx.globalAlpha *= ca; C.gather(ctx, '优点和工作', W / 2, 400, t, a0 + 0.05, vs('D01') + 0.6, { size: 112, weight: 600, spacing: 0.14, keys: ['优点和工作'], keyColor: GOLD }); ctx.restore();
    });
  }

  // ================= S2：书页搭成螺旋楼梯，她自己往上走 =================
  {
    const a0 = vs('D02') - 0.1, b0 = vs('D03') + 0.2;
    const tS = vs('D02'), tL = at('D02', '语言'), tE = ve('D02');
    const NJ = 15, BOOK = [540, 1720];
    const step = j => { const th = Math.PI / 2 + j * 0.64, d = Math.sin(th); return { x: 540 + Math.cos(th) * 300, y: 1260 - j * 70 + d * 92, d, sc: 0.86 + 0.22 * d, rot: -Math.cos(th) * 0.18, th }; };
    const GLY = ['A', 'あ', 'Ж', 'α', '文', 'é', 'Ω', 'ß'];
    function page(ctx, x, y, sc, rot, al, lit) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(sc, sc); ctx.globalAlpha *= al;
      ctx.fillStyle = 'rgb(150,128,98)'; ctx.fillRect(-104, 0, 208, 12);
      poly(ctx, [[-114, 0], [94, 0], [114, -42], [-94, -42]], `rgb(${236 + lit * 14 | 0},${226 + lit * 16 | 0},${200 + lit * 20 | 0})`);
      ctx.strokeStyle = 'rgba(120,100,80,0.35)'; ctx.lineWidth = 2;
      for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(-80 + k * 6, -10 - k * 10); ctx.lineTo(70 + k * 6, -10 - k * 10); ctx.stroke(); }
      ctx.restore();
      glow(ctx, x, y + 10 * sc, 130 * sc, GOLD, 0.22 * al * (0.6 + lit));
    }
    add(a0, b0, (ctx, t, a) => {
      back0(ctx); ctx.globalAlpha = a;
      sky(ctx, [[0, [6, 12, 26]], [0.45, [12, 32, 44]], [0.8, [10, 24, 28]], [1, [4, 9, 10]]]);
      const cam = smooth(prog(t, a0, b0)), camY = lerp(-70, 330, cam);
      // 远景：月亮和云带（视差慢）
      stars(ctx, t, camY * 0.25);
      glow(ctx, 830, 300 + camY * 0.35, 360, [190, 225, 220], 0.3);
      ctx.save(); ctx.globalAlpha *= 0.95; ctx.fillStyle = 'rgb(236,240,222)'; ctx.beginPath(); ctx.arc(830, 300 + camY * 0.35, 66, 0, TAU); ctx.fill(); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 4; k++) { const y = 520 + k * 190 + camY * (0.4 + k * 0.08); ctx.save(); ctx.translate(540 + Math.sin(t * 0.1 + k) * 80, y); ctx.scale(1, 0.12); glow(ctx, 0, 0, 760, [120, 170, 170], 0.12); ctx.restore(); }
      ctx.restore();
      ctx.save(); ctx.translate(0, camY);
      // 底下的大书，自己一页页翻
      const bx = BOOK[0], by = BOOK[1];
      glow(ctx, bx, by - 80, 520, GOLD, 0.25);
      ctx.save();
      const pg = (sgn, lift, col) => { ctx.beginPath(); ctx.moveTo(bx, by - 90); ctx.quadraticCurveTo(bx + sgn * 240, by - 150 - lift, bx + sgn * 480, by - 120 - lift); ctx.lineTo(bx + sgn * 520, by + 150 - lift * 0.6); ctx.quadraticCurveTo(bx + sgn * 260, by + 120, bx, by + 170); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); };
      pg(-1, 0, 'rgb(214,200,170)'); pg(1, 0, 'rgb(222,208,178)');
      ctx.strokeStyle = 'rgba(110,90,70,0.28)'; ctx.lineWidth = 3;
      for (let k = 0; k < 7; k++) for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(bx + sg * 60, by - 70 + k * 30); ctx.quadraticCurveTo(bx + sg * 240, by - 110 + k * 32, bx + sg * 430, by - 90 + k * 34); ctx.stroke(); }
      for (let k = 0; k < 2; k++) {   // 正在翻的那一页
        const u = ((t - a0) * 1.6 + k * 0.5) % 1, ex = Math.cos(u * Math.PI), lift = Math.sin(u * Math.PI) * 260;
        ctx.beginPath(); ctx.moveTo(bx, by - 90); ctx.quadraticCurveTo(bx + ex * 240, by - 150 - lift, bx + ex * 470, by - 120 - lift * 0.9); ctx.lineTo(bx + ex * 500, by + 140 - lift * 0.7); ctx.quadraticCurveTo(bx + ex * 250, by + 110 - lift * 0.3, bx, by + 170); ctx.closePath();
        ctx.fillStyle = `rgba(232,222,198,${0.6 - Math.abs(ex) * 0.2})`; ctx.fill();
      }
      ctx.restore();
      glowLine(ctx, [[bx, by - 90], [bx, by + 170]], GOLD, 0.8, 3, 1.2);
      // 楼梯：书页从书缝飞起，落到螺旋上
      const q = lerp(1, 8.2, smooth(prog(t, tS + 0.5, tE + 0.3))), j0 = Math.floor(q), fr = q - j0;
      const s0 = step(j0), s1 = step(j0 + 1);
      const hx = lerp(s0.x, s1.x, fr), hy = lerp(s0.y - 34 * s0.sc, s1.y - 34 * s1.sc, fr) - Math.sin(fr * Math.PI) * 26, hd = lerp(s0.d, s1.d, fr);
      const steps = [];
      for (let j = 0; j < NJ; j++) {
        const s = step(j), tj = a0 - 0.25 + j * 0.13, u = easeOut(prog(t, tj, tj + 0.6)); if (u <= 0) continue;
        const x = lerp(bx + (hash(j) - 0.5) * 200, s.x, u), y = lerp(by - 40, s.y, u) - Math.sin(u * Math.PI) * 120;
        const lit = Math.abs(j - q) < 1.3 ? 1 - Math.abs(j - q) / 1.3 : 0;
        steps.push({ j, x, y, sc: s.sc * lerp(0.5, 1, u), rot: s.rot + (1 - u) * 2.4 * (hash(j + 3) - 0.5), al: Math.min(1, u * 2), d: s.d, lit, front: s.d > hd + 0.05 && Math.abs(j - q) > 1.2 });
      }
      for (const s of steps) if (!s.front) page(ctx, s.x, s.y, s.sc, s.rot, s.al, s.lit);
      ctx.save(); ctx.translate(hx, hy + 6); ctx.scale(1, 0.18); glow(ctx, 0, 0, 160, GOLD, 0.5); ctx.restore();
      infp(ctx, hx, hy, 0.98 * (0.9 + 0.14 * hd), { a, t, wind: true, spin: t * 2.5, look: [Math.sin(s0.th) < 0 ? -0.6 : 0.8, -1], eyes: 'happy', la: -0.15, ra: 0.1, nod: -0.3, flies: 1 });
      for (const s of steps) if (s.front) page(ctx, s.x, s.y, s.sc, s.rot, s.al, s.lit);
      // 语言：各国文字从台阶上升起来
      GLY.forEach((gch, k) => {
        const ti = tL - 0.1 + k * 0.1, u = prog(t, ti, ti + 2.2); if (u <= 0) return;
        const s = step(2 + k), x = s.x + (k % 2 ? 1 : -1) * (90 + 40 * Math.sin(k)), y = s.y - 70 - easeOut(u) * 170, al = smooth(u * 5) * (1 - 0.5 * smooth(prog(u, 0.5, 1)));
        glow(ctx, x, y - 26, 80, GOLD, 0.35 * al);
        K.text(ctx, gch, x, y, { size: 74 + (k % 3) * 10, weight: 600, color: k % 2 ? IVORY : [255, 226, 150], alpha: al, align: 'center' });
      });
      ctx.restore();
      bokeh(ctx, t, [[90, 700, 200, GOLD, 1, 30, 0.1], [1000, 980, 170, [150, 200, 240], 3, 24, 0.09]]);
    });
  }

  // ================= S3：台灯光柱下画画，手机一响焦点被拉走 =================
  {
    const a0 = vs('D03') - 0.1, b0 = vs('D04') + 0.2;
    const tS = vs('D03'), tR = at('D03', '电话');
    const RS = K.mulberry32(77), MOTE = Array.from({ length: 46 }, () => ({ u: RS(), v: RS(), ph: RS() * 6.28, r: 2 + RS() * 4 }));
    const CITY = Array.from({ length: 26 }, () => ({ x: 120 + RS() * 340, y: 690 + RS() * 90, r: 3 + RS() * 6, c: RS() < 0.6 ? [255, 210, 140] : [160, 210, 255] }));
    // 纸上的画：一朵花接一只鸟（连续的一笔）
    const DRAW = []; for (let i = 0; i <= 140; i++) { const u = i / 140; if (u < 0.6) { const ph = u / 0.6 * TAU * 1.0, r = 46 * Math.abs(Math.cos(2.5 * ph)) + 8; DRAW.push([690 + Math.cos(ph) * r, 1160 + Math.sin(ph) * r * 0.42]); } else { const v = (u - 0.6) / 0.4; DRAW.push([740 + v * 90, 1150 - Math.sin(v * Math.PI * 2) * 20 - v * 30]); } }
    add(a0, b0, (ctx, t, a) => {
      back0(ctx); ctx.globalAlpha = a;
      const ring = smooth(prog(t, tR - 0.05, tR + 0.15)), fl = ring * (0.5 + 0.5 * Math.sin(t * 47));
      sky(ctx, [[0, [12, 18, 20]], [0.55, [20, 26, 26]], [1, [6, 8, 8]]]);
      ctx.save(); zoom(ctx, lerp(1.0, 1.06, smooth(prog(t, a0, tR))) + 0.02 * ring, 520, 900); ctx.translate(-30 * ring, 0);
      // 窗：远处的城市夜景
      ctx.save(); ctx.beginPath(); ctx.rect(90, 330, 400, 470); ctx.clip();
      const wg = ctx.createLinearGradient(0, 330, 0, 800); wg.addColorStop(0, 'rgb(14,26,52)'); wg.addColorStop(1, 'rgb(30,52,70)'); ctx.fillStyle = wg; ctx.fillRect(90, 330, 400, 470);
      stars(ctx, t, -60, 0.8, 760);
      glow(ctx, 380, 430, 120, [220, 230, 240], 0.4); ctx.fillStyle = 'rgba(236,240,230,0.9)'; ctx.beginPath(); ctx.arc(380, 430, 26, 0, TAU); ctx.fill();
      hills(ctx, 760, 40, 4, 'rgb(12,20,34)');
      for (const c of CITY) glow(ctx, c.x, c.y, c.r * 2.4, c.c, 0.6);
      ctx.restore();
      ctx.save(); ctx.strokeStyle = 'rgb(40,34,30)'; ctx.lineWidth = 16; ctx.strokeRect(90, 330, 400, 470); ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(290, 330); ctx.lineTo(290, 800); ctx.moveTo(90, 565); ctx.lineTo(490, 565); ctx.stroke(); ctx.restore();
      // 窗光落在墙上
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; poly(ctx, [[490, 330], [700, 420], [700, 900], [490, 800]], 'rgba(120,150,200,0.05)'); ctx.restore();
      // 台灯：灯杆、灯罩、光柱
      const lampA = 1 - fl * 0.55;
      ctx.save(); ctx.strokeStyle = 'rgb(84,82,78)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(880, 1100); ctx.lineTo(930, 860); ctx.lineTo(790, 740); ctx.stroke();
      poly(ctx, [[720, 720], [830, 700], [850, 790], [700, 810]], 'rgb(60,62,58)'); ctx.fillStyle = 'rgb(70,66,60)'; ctx.fillRect(820, 1092, 120, 18); ctx.restore();
      glow(ctx, 770, 800, 180, [255, 226, 160], 0.7 * lampA);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const cg = ctx.createLinearGradient(780, 800, 600, 1160); cg.addColorStop(0, `rgba(255,220,160,${0.3 * lampA})`); cg.addColorStop(1, `rgba(255,220,160,${0.05 * lampA})`);
      poly(ctx, [[700, 805], [850, 790], [960, 1160], [330, 1160]], cg); ctx.restore();
      for (const m of MOTE) { const v = (m.v + t * 0.03) % 1, u = m.u, y = lerp(810, 1150, v), xl = lerp(700, 330, v), xr = lerp(850, 960, v); glow(ctx, lerp(xl, xr, u) + Math.sin(t * 0.7 + m.ph) * 10, y, m.r * 2.5, [255, 232, 190], 0.35 * lampA * (0.5 + 0.5 * Math.sin(t * 2 + m.ph))); }
      // 她（站在桌后，伏身画画）
      const o = infp(ctx, 470, 1420, 1.45, { a, t, wind: false, look: ring > 0.5 ? [1.6, 0.6] : [0.9, 1.2], nod: lerp(0.55, 0.05, ring), eyes: ring > 0.5 ? 'wide' : 'open', mouth: ring > 0.5 ? 'o' : 'smile', ra: 0.2 - 0.3 * ring, la: 0.45, lean: 0.04 * (1 - ring) - 0.03 * ring, flies: 1 });
      // 桌面
      const dg = ctx.createLinearGradient(0, 1080, 0, 1330); dg.addColorStop(0, 'rgb(70,50,36)'); dg.addColorStop(1, 'rgb(40,28,22)');
      poly(ctx, [[0, 1080], [1080, 1080], [1200, 1330], [-120, 1330]], dg);
      ctx.fillStyle = 'rgb(24,16,12)'; ctx.fillRect(-120, 1330, W + 240, 140);
      ctx.save(); ctx.translate(640, 1170); ctx.scale(1, 0.32); glow(ctx, 0, 0, 480, [255, 200, 130], 0.32 * lampA); ctx.restore();
      // 纸和画
      poly(ctx, [[590, 1105], [860, 1100], [890, 1225], [560, 1232]], 'rgb(240,232,212)');
      const pr = 0.04 + 0.92 * smooth(prog(t, a0, tR));
      const ln = K.partial(DRAW, pr); const inkS = (pp, col) => { ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 4; ctx.lineJoin = ctx.lineCap = 'round'; ctx.beginPath(); pp.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.stroke(); ctx.restore(); }; inkS(ln, 'rgb(40,96,90)');
      let tip = ln[ln.length - 1];
      if (ring > 0) { const zz = [tip]; for (let k = 1; k <= 6; k++) zz.push([tip[0] + k * 9 * ring, tip[1] + (k % 2 ? -16 : 14) * ring]); inkS(zz, 'rgb(170,50,44)'); tip = zz[zz.length - 1]; }
      const hd = o.rh; ctx.save(); ctx.strokeStyle = 'rgb(40,40,48)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(lerp(hd[0], tip[0], 0.35), lerp(hd[1], tip[1], 0.35)); ctx.lineTo(tip[0], tip[1]); ctx.stroke(); ctx.restore();
      // 杯子和热气
      ctx.save(); ctx.fillStyle = 'rgb(214,208,196)'; ctx.fillRect(250, 1100, 80, 90); ctx.beginPath(); ctx.ellipse(290, 1100, 40, 12, 0, 0, TAU); ctx.fillStyle = 'rgb(120,80,60)'; ctx.fill(); ctx.restore();
      for (let k = 0; k < 3; k++) glowLine(ctx, Array.from({ length: 16 }, (_, j) => [280 + k * 12 + Math.sin(j * 0.6 + t * 2 + k) * 10, 1090 - j * 12]), [230, 230, 220], 0.18 * (1 - ring), 2, 0.6);
      // 一响：整间屋子暗下去，只剩手机刺眼
      if (ring > 0) { ctx.fillStyle = `rgba(0,0,0,${0.32 * ring})`; ctx.fillRect(-300, -300, W + 600, H + 600); }
      ctx.restore();
      // 近处手机（离镜头最近；没响时虚焦，响了焦点拉过来）
      const px = 880 + (ring ? Math.sin(t * 70) * 7 : 0), py = 1235;
      const phone = (dx, dy, al) => { ctx.save(); ctx.globalAlpha *= al; ctx.translate(px + dx, py + dy); ctx.transform(1, 0, -0.35, 0.42, 0, 0); ctx.beginPath(); ctx.roundRect(-120, -220, 240, 440, 34); ctx.fillStyle = 'rgb(22,24,30)'; ctx.fill();
        ctx.beginPath(); ctx.roundRect(-104, -200, 208, 400, 24); ctx.fillStyle = ring ? `rgb(${255},${200 + 40 * fl | 0},${200 + 40 * fl | 0})` : 'rgb(30,36,44)'; ctx.fill(); ctx.restore(); };
      if (ring < 1) for (const [dx, dy] of [[-8, 0], [8, 0], [0, -6], [0, 6]]) phone(dx, dy, 0.28 * (1 - ring));
      if (ring > 0) {
        phone(0, 0, ring);
        glow(ctx, px - 30, py, 300, RED, 0.45 * ring * (0.6 + 0.4 * fl)); glow(ctx, px - 30, py, 120, [255, 240, 240], 0.5 * ring);
        for (let k = 0; k < 3; k++) { const v = ((t - tR) * 1.3 + k / 3) % 1; L.ellipse(ctx, px - 30, py, 120 + v * 380, (120 + v * 380) * 0.36, RED, (1 - v) * 0.7 * ring, 3); }
        L.shock(ctx, px - 30, py, t, tR, { r0: 40, r1: 520, dur: 0.6, c: [255, 220, 220], a });
      }
      bokeh(ctx, t, [[80, 1250, 220, [255, 200, 130], 0, 20, 0.12], [1000, 520, 160, [255, 220, 170], 2, 20, 0.08]], 1 - ring * 0.6);
    });
  }

  // ================= S4：一模一样的表格隧道，她褪成灰色，彩色的她飘走 =================
  {
    const a0 = vs('D04') - 0.1, b0 = vs('D05') + 0.2;
    const tS = vs('D04'), tRep = at('D04', '重复'), tX = at('D04', '换了');
    const VP = [660, 760], NS = 12;
    function form(ctx, x, y, f, rot, al) {   // 同一张表：几排方框 + 一个红章
      if (al <= 0.003) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(f, f); ctx.globalAlpha *= al;
      ctx.fillStyle = 'rgb(226,228,222)'; ctx.fillRect(-130, -170, 260, 340);
      ctx.strokeStyle = 'rgba(90,100,110,0.75)'; ctx.lineWidth = 4;
      for (let r = 0; r < 5; r++) { const yy = -128 + r * 52; ctx.strokeRect(-100, yy - 14, 28, 28); ctx.beginPath(); ctx.moveTo(-56, yy); ctx.lineTo(100, yy); ctx.stroke(); }
      ctx.strokeStyle = 'rgba(200,60,50,0.8)'; ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(62, 118, 36, 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(62, 118, 22, 0, TAU); ctx.stroke();
      ctx.restore();
    }
    add(a0, b0, (ctx, t, a) => {
      back0(ctx); ctx.globalAlpha = a;
      sky(ctx, [[0, [10, 14, 18]], [0.4, [22, 30, 34]], [0.6, [16, 22, 26]], [1, [5, 7, 8]]]);
      const beat = tRep > 0 ? Math.exp(-(((t - tRep) % 0.46 + 0.46) % 0.46) * 7) * (t > tRep ? 1 : 0) : 0;
      ctx.save(); zoom(ctx, lerp(1.0, 1.08, smooth(prog(t, a0, b0))), VP[0], VP[1]);
      glow(ctx, VP[0], VP[1], 420, [200, 220, 230], 0.25 + 0.1 * beat);
      // 两边墙：一层层一模一样的纸堆，往前流
      const ph = ((t - a0) * 1.1) % 1;
      for (let i = 16; i >= 0; i--) {
        const Z = 0.55 + (i - ph) * 0.5; if (Z < 0.35) continue;
        const f = 1 / Z, fog = clamp(1.25 - Z * 0.14);
        for (const sg of [-1, 1]) {
          const x0 = VP[0] + sg * 780 * f, x1 = VP[0] + sg * 560 * f, yT = VP[1] - 640 * f, yB = VP[1] + 760 * f;
          ctx.fillStyle = rgba([20, 26, 30], fog); ctx.fillRect(Math.min(x0, x1), yT, Math.abs(x1 - x0), yB - yT);
          ctx.fillStyle = rgba(i % 3 ? [214, 218, 210] : [180, 200, 214], 0.3 * fog);
          const n = 30, hh = (yB - yT) / n;
          for (let k = 0; k < n; k++) ctx.fillRect(Math.min(x0, x1) + (hash(k + i * 7) - 0.5) * 8 * f, yT + k * hh, Math.abs(x1 - x0), Math.max(1, hh * 0.32));
        }
        // 顶灯
        glowLine(ctx, [[VP[0] - 200 * f, VP[1] - 720 * f], [VP[0] + 200 * f, VP[1] - 720 * f]], [210, 230, 240], (0.35 + 0.4 * beat) * fog, 2.4 * f, 0.8);
      }
      // 地面反光
      ctx.save(); ctx.translate(VP[0], 1340); ctx.scale(1, 0.1); glow(ctx, 0, 0, 700, [200, 220, 230], 0.18); ctx.restore();
      ctx.restore();
      // 飞过来的表格
      const forms = [];
      for (let k = 0; k < NS; k++) {
        const p = ((t - a0) * 0.42 + k / NS) % 1, Z = lerp(8, 0.4, Math.pow(p, 1.5)), f = 1 / Z;
        const wx = (hash(k * 1.7) - 0.5) * 1100, wy = (hash(k * 2.3 + 4) - 0.5) * 900 - 150;
        forms.push({ x: VP[0] + wx * f, y: VP[1] + wy * f, f: f * 0.55, rot: (hash(k) - 0.5) * 0.5 + p * 0.4 * (hash(k + 1) - 0.5), al: smooth(p * 6) * (1 - smooth(prog(f, 1.6, 2.4))) * (0.5 + 0.5 * smooth(prog(t, tS - 0.3, tRep))), near: f > 1.1 });
      }
      for (const fm of forms) if (!fm.near) form(ctx, fm.x, fm.y, fm.f, fm.rot, fm.al);
      // 她：彩色的那个她飘进隧道深处，留下的是灰的
      const k = smooth(prog(t, tX - 0.7, tX + 0.9)), gray = clamp(0.3 * smooth(prog(t, tRep, tX)) + 0.75 * k);
      if (k > 0.02) {
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        infp(ctx, lerp(380, VP[0], easeIn(k)), lerp(1500, 920, easeInOut(k)), lerp(1.5, 0.42, easeInOut(k)), { a: a * 0.75 * Math.sin(Math.min(1, k * 1.15) * Math.PI) ** 0.6, t, wind: true, spin: t * 2, eyes: 'happy', flies: 1 });
        ctx.restore();
        glow(ctx, lerp(380, VP[0], easeIn(k)), lerp(1080, 820, easeInOut(k)), 200 * (1 - k * 0.6), LIME, 0.3 * Math.sin(k * Math.PI));
      }
      infp(ctx, 380, 1500, 1.5, { a, t, wind: gray < 0.5, spin: t * 2 * (1 - gray), dim: gray, eyes: gray > 0.6 ? 'open' : 'happy', look: gray > 0.6 ? [0, 0.6] : [0.6, 0], mouth: gray > 0.4 ? 'flat' : 'smile', nod: gray * 0.6, la: 0.5 * gray, ra: 0.5 * gray, flies: gray > 0.5 ? 0 : 1 });
      if (gray > 0.3) { ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.globalAlpha = a * (gray - 0.3) * 1.2; ctx.fillStyle = 'rgb(128,128,128)'; ctx.beginPath(); ctx.ellipse(380, 1150, 260, 420, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      for (const fm of forms) if (fm.near) form(ctx, fm.x, fm.y, fm.f, fm.rot, fm.al * 0.8);
      bokeh(ctx, t, [[950, 400, 200, [200, 220, 230], 1, 20, 0.08]]);
    });
  }

  // ================= S5：五扇亮起的窗，每扇里是小小的她在做那份工作 =================
  {
    const a0 = vs('D05') - 0.1, b0 = vs('D06') + 0.2;
    const tI = at('D05', '想象'), tG = at('D05', '共情'), tE = ve('D05');
    const ink = (ctx, pts, c, al, w = 3) => glowLine(ctx, pts, c, al, w, 0.5);
    // —— 写作：台灯下摊开的本子，钢笔写出一行发光的字迹，字迹化成星星飘起 ——
    function write(ctx, t, A, t0) {
      const g = ctx.createLinearGradient(0, -120, 0, 120); g.addColorStop(0, 'rgb(40,30,30)'); g.addColorStop(1, 'rgb(92,62,42)'); ctx.fillStyle = g; ctx.fillRect(-150, -120, 300, 240);
      glow(ctx, -90, -70, 160, [255, 210, 140], 0.5);
      poly(ctx, [[-130, 40], [0, 20], [0, 105], [-140, 112]], 'rgb(236,228,206)'); poly(ctx, [[0, 20], [130, 40], [140, 112], [0, 105]], 'rgb(246,238,216)');
      ctx.strokeStyle = 'rgba(120,100,80,0.3)'; ctx.lineWidth = 2; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-118, 50 + k * 15); ctx.lineTo(-12, 34 + k * 16); ctx.stroke(); }
      const u = ((t - t0) * 0.55) % 1, line = []; for (let i = 0; i <= 60; i++) { const v = i / 60; line.push([14 + v * 106 + Math.sin(v * 30) * 4, 58 + v * 6 + Math.cos(v * 30) * 7 - (v > 0.5 ? 18 : 0) * smooth((v - 0.5) * 8)]); }
      const ln = K.partial(line, u * 1.1); ink(ctx, ln, [255, 214, 140], 0.95, 2.6);
      const tp = ln[ln.length - 1] || line[0];
      ctx.save(); ctx.strokeStyle = 'rgb(28,30,40)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tp[0] + 54, tp[1] - 86); ctx.lineTo(tp[0] + 6, tp[1] - 8); ctx.stroke(); ctx.strokeStyle = 'rgb(230,190,100)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(tp[0] + 8, tp[1] - 10); ctx.lineTo(tp[0], tp[1]); ctx.stroke(); ctx.restore();
      for (let k = 0; k < 7; k++) { const v = ((t - t0) * 0.4 + k / 7) % 1; glow(ctx, 30 + k * 14 + Math.sin(k + t) * 14, 40 - v * 150, 10, GOLD, (1 - v) * 0.9); }
    }
    // —— 设计：图纸上一把圆规画出金色的圆，旁边一扇色卡展开 ——
    function design(ctx, t, A, t0) {
      ctx.fillStyle = 'rgb(28,44,58)'; ctx.fillRect(-150, -120, 300, 240);
      ctx.save(); ctx.translate(-10, 10); ctx.rotate(-0.06); ctx.fillStyle = 'rgb(214,226,232)'; ctx.fillRect(-120, -90, 230, 190); ctx.restore();
      const c0 = [-30, 20], ph = -Math.PI / 2 + Math.min(TAU, ((t - t0) * 2.6) % (TAU + 1.6));
      const arc = []; for (let f = -Math.PI / 2; f <= ph; f += 0.08) arc.push([c0[0] + Math.cos(f) * 78, c0[1] + Math.sin(f) * 46]);
      if (arc.length > 1) ink(ctx, arc, [230, 170, 60], 0.95, 3);
      const pen = [c0[0] + Math.cos(ph) * 78, c0[1] + Math.sin(ph) * 46], hg = [(c0[0] + pen[0]) / 2, -78];
      ctx.save(); ctx.strokeStyle = 'rgb(70,74,84)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(hg[0], hg[1]); ctx.lineTo(pen[0], pen[1]); ctx.stroke();
      ctx.fillStyle = 'rgb(200,170,90)'; ctx.beginPath(); ctx.arc(hg[0], hg[1], 9, 0, TAU); ctx.fill(); ctx.fillRect(hg[0] - 4, hg[1] - 30, 8, 22); ctx.restore();
      glow(ctx, pen[0], pen[1], 22, GOLD, 0.9);
      const open = smooth(prog(t, t0, t0 + 0.8)), SW = [[240, 110, 120], [250, 190, 90], [210, 230, 110], [110, 200, 170], [120, 160, 240]];
      SW.forEach((c, k) => { ctx.save(); ctx.translate(110, 100); ctx.rotate(-1.2 + k * 0.22 * open + 0.02 * Math.sin(t * 2 + k)); ctx.fillStyle = rgba(c, 1); ctx.beginPath(); ctx.roundRect(-12, -120, 24, 112, 8); ctx.fill(); ctx.restore(); });
    }
    // —— 心理咨询：两把扶手椅面对面，中间小台灯和纸巾盒，她在听对方说 ——
    function counsel(ctx, t, A, t0) {
      const g = ctx.createLinearGradient(0, -120, 0, 120); g.addColorStop(0, 'rgb(46,40,44)'); g.addColorStop(1, 'rgb(70,52,46)'); ctx.fillStyle = g; ctx.fillRect(-150, -120, 300, 240);
      ctx.fillStyle = 'rgb(58,44,40)'; ctx.fillRect(-150, 80, 300, 40);
      glow(ctx, 0, -10, 150, [255, 200, 140], 0.55 + 0.1 * Math.sin(t * 2));
      ctx.strokeStyle = 'rgb(90,80,70)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, 80); ctx.lineTo(0, -20); ctx.stroke(); poly(ctx, [[-20, -20], [20, -20], [12, -46], [-12, -46]], 'rgb(240,210,160)');
      ctx.fillStyle = 'rgb(110,80,60)'; ctx.fillRect(-26, 46, 52, 8); ctx.fillStyle = 'rgb(236,236,240)'; ctx.fillRect(-16, 32, 26, 14); ctx.fillStyle = 'rgb(250,250,252)'; ctx.beginPath(); ctx.moveTo(-6, 32); ctx.quadraticCurveTo(-2, 18, 4, 32); ctx.fill();
      const chairBack = (x, sg) => { ctx.fillStyle = 'rgb(150,84,74)'; ctx.beginPath(); ctx.roundRect(x - sg * 10 - 14, -16, 28, 100, 10); ctx.fill(); };
      const chairFront = (x, sg) => { ctx.fillStyle = 'rgb(170,96,82)'; ctx.beginPath(); ctx.roundRect(x - 40, 48, 80, 32, 10); ctx.fill(); ctx.fillStyle = 'rgb(130,72,64)'; ctx.beginPath(); ctx.roundRect(x + sg * 26 - 9, 30, 18, 52, 8); ctx.fill(); };
      chairBack(-96, 1); chairBack(96, -1);
      infp(ctx, -82, 96, 0.22, { a: A, t, wind: false, flies: 0, look: [1, 0.2], nod: 0.2 * Math.sin(t * 1.6) + 0.2, eyes: 'open' });
      MB.person(ctx, 'esfj-female', 92, 96, 0.5, { flip: true, slump: 0.6, shadow: 0, bob: Math.sin(t * 1.3) * 1.5 });
      chairFront(-96, 1); chairFront(96, -1);
      const hp = 0.5 + 0.5 * Math.sin(t * 2.4); glow(ctx, 6, -2, 46 + hp * 14, [255, 170, 180], 0.45 + 0.25 * hp);
    }
    // —— 教育：黑板上粉笔画出一棵树和太阳，她指着讲，前排两个孩子仰头看 ——
    function teach(ctx, t, A, t0) {
      ctx.fillStyle = 'rgb(46,52,50)'; ctx.fillRect(-150, -120, 300, 240);
      ctx.fillStyle = 'rgb(120,86,56)'; ctx.fillRect(-142, -108, 214, 134); ctx.fillStyle = 'rgb(30,66,52)'; ctx.fillRect(-134, -100, 198, 118);
      const u = ((t - t0) * 0.5) % 1.3;
      const tree = [[-60, 10], [-60, -30], ...Array.from({ length: 30 }, (_, i) => { const f = Math.PI / 2 + i / 29 * TAU; return [-60 + Math.cos(f) * 30, -58 - Math.sin(f) * 28]; })];
      const sun = Array.from({ length: 24 }, (_, i) => { const f = i / 23 * TAU; return [20 + Math.cos(f) * 14, -70 + Math.sin(f) * 14]; });
      ink(ctx, K.partial(tree, clamp(u * 1.6)), [236, 240, 230], 0.9, 2.6); ink(ctx, K.partial(sun, clamp(u * 1.6 - 0.8)), [250, 230, 160], 0.9, 2.6);
      if (u > 1) for (let k = 0; k < 8; k++) { const f = k / 8 * TAU; ink(ctx, [[20 + Math.cos(f) * 20, -70 + Math.sin(f) * 20], [20 + Math.cos(f) * 30, -70 + Math.sin(f) * 30]], [250, 230, 160], 0.9, 2); }
      infp(ctx, 108, 98, 0.24, { a: A, t, wind: false, flies: 0, la: -1.1 + 0.08 * Math.sin(t * 3), look: [-1, -0.3], eyes: 'happy' });
      MB.person(ctx, 'enfp-male', -96, 190, 0.46, { shadow: 0, bob: Math.sin(t * 2) * 2 }); MB.person(ctx, 'isfj-female', -14, 196, 0.46, { shadow: 0, bob: Math.sin(t * 2 + 1) * 2 });
    }
    // —— 社会工作：雨夜街灯下，她把伞撑到一位老人头顶 ——
    function social(ctx, t, A, t0) {
      const g = ctx.createLinearGradient(0, -120, 0, 120); g.addColorStop(0, 'rgb(14,22,38)'); g.addColorStop(1, 'rgb(28,40,52)'); ctx.fillStyle = g; ctx.fillRect(-150, -120, 300, 240);
      ctx.fillStyle = 'rgb(40,44,50)'; ctx.fillRect(-126, -96, 6, 196); glow(ctx, -112, -96, 110, [255, 214, 150], 0.6);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; poly(ctx, [[-118, -94], [-60, 100], [-150, 100], [-150, 60]], 'rgba(255,214,150,0.1)'); ctx.restore();
      ctx.save(); ctx.translate(0, 104); ctx.scale(1, 0.12); glow(ctx, 0, 0, 150, [255, 214, 150], 0.4); ctx.restore();
      const o = infp(ctx, -36, 100, 0.22, { a: A, t, wind: false, flies: 0, ra: -1.25, look: [1, -0.2], eyes: 'happy' });
      MB.person(ctx, 'istj-male', 52, 100, 0.52, { flip: true, slump: 0.5, gray: 0.35, shadow: 0 });
      const top = [o.rh[0] + 12, -54];
      ctx.save(); ctx.strokeStyle = 'rgb(60,50,50)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(o.rh[0], o.rh[1]); ctx.lineTo(top[0], top[1]); ctx.stroke(); ctx.restore();
      ctx.save(); ctx.translate(top[0], top[1]); ctx.beginPath(); ctx.ellipse(0, 6, 92, 44, 0, Math.PI, TAU); ctx.closePath(); ctx.fillStyle = 'rgb(232,110,124)'; ctx.fill();
      ctx.strokeStyle = 'rgba(120,40,50,0.6)'; ctx.lineWidth = 2; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(0, -38); ctx.lineTo(k * 38, 6); ctx.stroke(); } ctx.restore();
      glow(ctx, top[0], top[1] + 60, 110, [255, 200, 170], 0.35);
      ctx.save(); ctx.strokeStyle = 'rgba(180,210,240,0.5)'; ctx.lineWidth = 1.6;
      for (let k = 0; k < 46; k++) { const x = -150 + hash(k) * 320, y = -120 + ((t * 420 + hash(k + 9) * 240) % 260); if (Math.abs(x - top[0]) < 96 && y > top[1]) continue; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 18); ctx.stroke(); }
      ctx.restore();
    }
    const PAN = [
      { w: '写作', f: write, x: 190, y: 770, s: 1.0, r: -0.05, c: [255, 200, 130] },
      { w: '设计', f: design, x: 262, y: 450, s: 0.9, r: 0.04, c: [150, 200, 240] },
      { w: '心理咨询', f: counsel, x: 540, y: 240, s: 1.05, r: 0, c: [255, 170, 160] },
      { w: '教育', f: teach, x: 818, y: 460, s: 0.92, r: -0.04, c: [180, 236, 150] },
      { w: '社会工作', f: social, x: 890, y: 780, s: 1.0, r: 0.05, c: [255, 210, 160] },
    ].map((p, i) => ({ ...p, ti: at('D05', p.w), ph: i * 1.7 }));
    add(a0, b0, (ctx, t, a) => {
      back0(ctx); ctx.globalAlpha = a;
      sky(ctx, [[0, [6, 12, 18]], [0.45, [12, 30, 32]], [0.62, [26, 50, 44]], [0.66, [14, 28, 26]], [1, [4, 8, 9]]]);
      const cam = smooth(prog(t, a0, tG)), out = smooth(prog(t, tG, tE + 0.3));
      ctx.save(); zoom(ctx, lerp(1.0, 1.05, cam) - 0.06 * out, 540, 900);
      stars(ctx, t, 0, 0.8, 1180);
      glow(ctx, 540, 1180, 820, [90, 150, 120], 0.25);
      hills(ctx, 1190, 50, 5, 'rgb(12,26,24)');
      const fg = ctx.createLinearGradient(0, 1190, 0, H); fg.addColorStop(0, 'rgb(18,38,34)'); fg.addColorStop(1, 'rgb(3,7,8)'); ctx.fillStyle = fg; ctx.fillRect(-300, 1190, W + 600, H);
      ctx.save(); ctx.translate(540, 1330); ctx.scale(1, 0.16); glow(ctx, 0, 0, 420, [255, 220, 160], 0.4 + 0.3 * smooth(prog(t, tG, tG + 0.6))); ctx.restore();
      const o = infp(ctx, 540, 1330, 1.15, { a, t, wind: true, spin: t * 2.4, eyes: 'happy', look: [0, -1.2], nod: -0.4, ra: -0.35, la: 0.2, flies: 1 });
      // 想象 / 共情：从她心口牵出光线连到每一扇窗
      const thr = smooth(prog(t, tI - 0.2, tI + 0.8)), emp = smooth(prog(t, tG - 0.1, tG + 0.5));
      if (emp > 0) { glow(ctx, o.chest[0], o.chest[1], 200 * emp, [255, 200, 160], 0.5 * emp); glow(ctx, o.chest[0], o.chest[1], 60, [255, 250, 230], 0.6 * emp); }
      PAN.forEach((p, i) => {
        if (thr <= 0) return;
        const dx = Math.sin(t * 0.5 + p.ph) * 10 * (1.1 - p.s), dy = Math.cos(t * 0.4 + p.ph) * 8;
        const end = [p.x + dx, p.y + dy + 120 * p.s], c = [lerp(o.chest[0], end[0], 0.5) + (i - 2) * 30, Math.min(o.chest[1], end[1]) - 80];
        const pts = bezier(o.chest, c, end, 36), seg = K.partial(pts, thr);
        glowLine(ctx, seg, mix(LIME, p.c, emp), 0.55 + 0.35 * emp, 1.8, 0.8);
        for (let k = 0; k < 3; k++) { const q = pts[Math.floor(((t * 0.6 + k / 3 + i * 0.2) % 1) * 36)]; if (thr > 0.9) glow(ctx, q[0], q[1], 14, p.c, 0.8); }
      });
      // 五扇窗：念到哪一扇，先聚光、再翻开、再往外溢光
      for (const p of PAN) {
        const pre = smooth(prog(t, p.ti - 0.3, p.ti)), on = prog(t, p.ti, p.ti + 0.45), flip = on <= 0 ? 0 : 1 + 0.12 * Math.sin(Math.PI * on) * (1 - on) * 3 - (1 - easeOut(on));
        const dx = Math.sin(t * 0.5 + p.ph) * 10 * (1.1 - p.s), dy = Math.cos(t * 0.4 + p.ph) * 8, x = p.x + dx, y = p.y + dy;
        if (on <= 0) {   // 没点亮：暗着的窗框，聚起一点光
          ctx.save(); ctx.translate(x, y); ctx.rotate(p.r); ctx.scale(p.s, p.s); ctx.globalAlpha *= 0.5; ctx.strokeStyle = 'rgba(150,180,170,0.35)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(-150, -120, 300, 240, 20); ctx.stroke(); ctx.fillStyle = 'rgba(10,20,22,0.6)'; ctx.fill(); ctx.restore();
          glow(ctx, x, y, 40 + 120 * pre, p.c, 0.6 * pre);
          continue;
        }
        glow(ctx, x, y, 300 * p.s, p.c, 0.32 + 0.12 * emp);
        ctx.save(); ctx.translate(x, y); ctx.rotate(p.r); ctx.scale(p.s * clamp(flip, 0.02, 1.2), p.s * (0.92 + 0.08 * clamp(flip, 0, 1)));
        ctx.beginPath(); ctx.roundRect(-150, -120, 300, 240, 20); ctx.save(); ctx.clip();
        p.f(ctx, t, a, p.ti);
        ctx.restore();
        ctx.beginPath(); ctx.roundRect(-150, -120, 300, 240, 20); ctx.lineWidth = 5; ctx.strokeStyle = rgba(mix(p.c, [255, 240, 210], 0.4), 0.9); ctx.stroke();
        ctx.restore();
        glowLine(ctx, [[x - 150 * p.s, y - 120 * p.s], [x + 150 * p.s, y - 120 * p.s]], p.c, 0.4, 2, 1);
        L.shock(ctx, x, y, t, p.ti + 0.12, { r0: 30, r1: 260 * p.s, dur: 0.7, c: p.c, a });
        for (let k = 0; k < 10; k++) { const v = prog(t, p.ti + 0.1, p.ti + 1.1), an = k / 10 * TAU + p.ph; if (v > 0 && v < 1) glow(ctx, x + Math.cos(an) * (150 + v * 120) * p.s, y + Math.sin(an) * (120 + v * 100) * p.s, 10, p.c, (1 - v) * 0.9); }
      }
      ctx.restore();
      bokeh(ctx, t, [[60, 1100, 220, [255, 200, 150], 0, 20, 0.1], [1030, 200, 180, LIME, 2, 20, 0.08], [980, 1260, 160, [150, 200, 240], 4, 18, 0.07]]);
    });
  }

  // ================= S6：一整面墙的电话由远到近响起来，她心口的光一点点灭 =================
  {
    const a0 = vs('D06') - 0.1, b0 = vs('E01') - 0.9;
    const tR = at('D06', '陌生'), tC = at('D06', '投诉'), tP = at('D06', '推销'), tN = at('D06', '不认同'), tT = at('D06', '特别累');
    const VP = [1160, 760], NC = 10, ROWS = [-560, -300, -40, 220];
    const colZ = c => 1 + c * 0.75;
    function wallPhone(ctx, x, y, f, rg, t, seed) {
      const sh = rg > 0 ? Math.sin(t * 60 + seed) * 4 * f * rg : 0;
      ctx.save(); ctx.translate(x + sh, y); ctx.scale(f, f);
      ctx.fillStyle = 'rgb(34,40,52)'; ctx.beginPath(); ctx.roundRect(-60, -46, 120, 92, 14); ctx.fill();
      ctx.fillStyle = 'rgb(50,58,72)'; ctx.beginPath(); ctx.roundRect(-74, -70 - rg * 10 * Math.abs(Math.sin(t * 30 + seed)), 148, 30, 14); ctx.fill();
      ctx.restore();
      glow(ctx, x + 36 * f, y + 18 * f, 30 * f, rg > 0 ? RED : [80, 100, 120], rg > 0 ? 0.8 * rg : 0.3);
      if (rg > 0) { glow(ctx, x, y, 170 * f, RED, 0.25 * rg * (0.6 + 0.4 * Math.sin(t * 14 + seed))); const v = ((t * 1.4 + seed * 0.13) % 1); L.ellipse(ctx, x, y, (60 + v * 120) * f, (46 + v * 90) * f, RED, (1 - v) * 0.6 * rg, 2); }
    }
    function jag(ctx, cx, cy, r, t, c, al) {   // 投诉：锯齿状的声波圈
      const pts = []; for (let i = 0; i <= 48; i++) { const f = i / 48 * TAU, rr = r * (1 + (i % 2 ? 0.16 : -0.1) * (1 + 0.5 * Math.sin(t * 20 + i))); pts.push([cx + Math.cos(f) * rr, cy + Math.sin(f) * rr * 0.9]); }
      glowLine(ctx, pts, c, al, 3.2, 1);
    }
    add(a0, b0, (ctx, t, a) => {
      back0(ctx); ctx.globalAlpha = a;
      sky(ctx, [[0, [8, 12, 20]], [0.5, [16, 22, 32]], [1, [4, 6, 9]]]);
      const sl = smooth(prog(t, tT - 0.1, tT + 0.9));
      const ev = [tR, tC, tP, tN].reduce((s, e) => s + smooth(prog(t, e, e + 0.45)), 0), energy = clamp(1 - ev * 0.2 - sl * 0.18);
      ctx.save(); zoom(ctx, lerp(1.0, 1.07, smooth(prog(t, a0, tT))) - 0.05 * sl, 540, 900);
      // 斜着往远处退的墙：墙顶线、踢脚线、隔板
      const edge = Y => Array.from({ length: 30 }, (_, i) => { const Z = 1 + i * 0.4; return [VP[0] + (-260 - VP[0]) / Z, VP[1] + Y / Z]; });
      ctx.save(); const top = edge(-820), bot = edge(760); poly(ctx, [...top, ...bot.slice().reverse()], 'rgb(18,24,34)'); ctx.restore();
      glowLine(ctx, top, [170, 190, 220], 0.35, 2, 0.8); glowLine(ctx, bot, [170, 190, 220], 0.3, 2, 0.8);
      const fl = ctx.createLinearGradient(0, 1100, 0, H); fl.addColorStop(0, 'rgb(14,18,26)'); fl.addColorStop(1, 'rgb(4,5,8)'); ctx.fillStyle = fl;
      ctx.beginPath(); bot.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.lineTo(W + 300, H + 300); ctx.lineTo(-300, H + 300); ctx.closePath(); ctx.fill();
      // 顶灯：冷白的长灯管
      for (let c = NC; c >= 0; c--) { const Z = colZ(c) + 0.35, x = VP[0] + (-260 - VP[0]) / Z; glowLine(ctx, [[x, VP[1] - 900 / Z], [x + 120 / Z, VP[1] - 870 / Z]], [200, 220, 240], 0.5, 3 / Z + 1, 0.8); }
      for (let c = NC; c >= 0; c--) {
        const Z = colZ(c), f = 1 / Z, x = VP[0] + (-260 - VP[0]) / Z;
        ctx.strokeStyle = 'rgba(120,140,170,0.25)'; ctx.lineWidth = 3 * f + 1; ctx.beginPath(); ctx.moveTo(x - 110 * f, VP[1] - 820 * f); ctx.lineTo(x - 110 * f, VP[1] + 760 * f); ctx.stroke();
        const rt = tR + (NC - c) * 0.07, rg = smooth(prog(t, rt, rt + 0.15)) * (1 - 0.4 * sl);
        ROWS.forEach((Y, r) => wallPhone(ctx, x + 40 * f, VP[1] + Y * f, f * 1.6, rg, t, c * 4 + r));
      }
      // 远处响铃汇成一道红浪冲过来
      if (t > tR && t < tR + 1.2) { const v = prog(t, tR, tR + 0.9), Z = lerp(colZ(NC), 0.9, v), x = VP[0] + (-260 - VP[0]) / Z; glowLine(ctx, [[x, VP[1] - 800 / Z], [x, VP[1] + 700 / Z]], RED, 0.6 * (1 - v), 6 / Z + 2, 1.4); }
      // 她：戴着耳麦，近景
      const x0 = 400, y0 = 1700 + 150 * sl;
      const lean = -0.07 * smooth(prog(t, tC, tC + 0.2)) * (1 - smooth(prog(t, tC + 0.6, tC + 1.2))) + 0.05 * sl;
      const hold = smooth(prog(t, tP - 0.2, tP + 0.3)) * (1 - sl);
      const o = infp(ctx, x0, y0, 1.75, { a, t, wind: false, dim: (1 - energy) * 0.6, eyes: sl > 0.4 ? 'closed' : (t > tC && t < tC + 0.9 ? 'wide' : 'open'), mouth: sl > 0.3 ? 'flat' : (hold > 0.5 ? 'smile' : 'flat'), look: [0.8, 0.2],
        nod: 0.2 + 1.2 * sl, lean, ra: lerp(0.5, -0.85, hold) + 0.6 * sl, la: 0.4 + 0.4 * sl, flies: energy > 0.45 ? 1 : 0 });
      // 耳麦
      const k = 1.43 * 1.75, tp = o.top;
      ctx.save(); ctx.strokeStyle = 'rgb(36,38,46)'; ctx.lineWidth = 7 * k / 2.5; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(tp[0] - 60 * k, tp[1] + 82 * k); ctx.quadraticCurveTo(tp[0] - 10 * k, tp[1] - 22 * k, tp[0] + 52 * k, tp[1] + 60 * k); ctx.stroke();
      const ear = [tp[0] - 58 * k, tp[1] + 86 * k];
      ctx.fillStyle = 'rgb(40,42,50)'; ctx.beginPath(); ctx.ellipse(ear[0], ear[1], 13 * k, 17 * k, 0.2, 0, TAU); ctx.fill();
      ctx.lineWidth = 3.4 * k / 2.5; ctx.beginPath(); ctx.moveTo(ear[0], ear[1] + 10 * k); ctx.quadraticCurveTo(ear[0] + 10 * k, o.mouth[1] + 18 * k, o.mouth[0] - 6 * k, o.mouth[1] + 8 * k); ctx.stroke();
      ctx.fillStyle = 'rgb(60,62,70)'; ctx.beginPath(); ctx.arc(o.mouth[0] - 6 * k, o.mouth[1] + 8 * k, 4 * k, 0, TAU); ctx.fill(); ctx.restore();
      // 心口的光，一件事暗一截
      glow(ctx, o.chest[0], o.chest[1], 260 * energy + 30, [255, 210, 150], 0.5 * energy);
      glow(ctx, o.chest[0], o.chest[1], 70 * energy + 10, [255, 248, 228], 0.7 * energy);
      if (t > tN) { const cr = smooth(prog(t, tN, tN + 0.3)); glowLine(ctx, [[o.chest[0] - 40, o.chest[1] - 50], [o.chest[0] - 8, o.chest[1] - 10], [o.chest[0] - 26, o.chest[1] + 16], [o.chest[0] + 18, o.chest[1] + 58]].slice(0, 1 + Math.ceil(cr * 3)), [40, 40, 50], 0.9 * (1 - sl * 0.5), 3, 0.3); }
      // 投诉：耳边炸开锯齿声波
      for (let n = 0; n < 3; n++) { const v = prog(t, tC + n * 0.18, tC + n * 0.18 + 0.8); if (v > 0 && v < 1) jag(ctx, ear[0], ear[1], 60 + v * 360, t, RED, (1 - v) * 0.9); }
      if (t > tC && t < tC + 0.5) { ctx.fillStyle = `rgba(160,20,20,${0.16 * (1 - prog(t, tC, tC + 0.5))})`; ctx.fillRect(-300, -300, W + 600, H + 600); }
      // 推销：手里递出一只亮得刺眼的盒子（掉下去）
      if (t > tP - 0.2) {
        const drop = sl > 0 ? easeIn(prog(t, tT, tT + 0.9)) : 0, bx = o.rh[0] + 70 + drop * 60, by = o.rh[1] - 40 + drop * 700, ba = smooth(prog(t, tP - 0.2, tP + 0.2)) * (1 - drop * 0.8);
        ctx.save(); ctx.globalAlpha *= ba; ctx.translate(bx, by); ctx.rotate(-0.12 + drop * 1.6);
        poly(ctx, [[-90, -50], [60, -50], [110, -90], [-40, -90]], 'rgb(255,170,200)'); poly(ctx, [[60, -50], [110, -90], [110, 40], [60, 80]], 'rgb(190,90,130)'); ctx.fillStyle = 'rgb(240,120,160)'; ctx.fillRect(-90, -50, 150, 130);
        ctx.fillStyle = 'rgb(255,220,90)'; ctx.beginPath(); for (let i = 0; i < 10; i++) { const r = i % 2 ? 14 : 32, f = i / 10 * TAU - Math.PI / 2; ctx.lineTo(-15 + Math.cos(f) * r, 15 + Math.sin(f) * r); } ctx.closePath(); ctx.fill();
        ctx.restore();
        glow(ctx, bx, by, 160, [255, 170, 210], 0.3 * ba); glow(ctx, bx - 60, by - 60, 40, [255, 255, 255], 0.6 * ba * (0.5 + 0.5 * Math.sin(t * 9)));
      }
      ctx.restore();
      bokeh(ctx, t, [[960, 1240, 240, RED, 0, 20, 0.08 * (1 - sl * 0.5)], [80, 300, 200, [150, 180, 220], 2, 20, 0.08]]);
    }, (ctx, t, a) => X.quote(ctx, '今天的工作 do 了嘛\n微 do', t, at('D06', '特别累') - 0.2, ve('D06') + 0.5, { y: 300 }));
  }

  return S;
};
