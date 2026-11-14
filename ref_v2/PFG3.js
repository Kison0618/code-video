'use strict';
// 《INFP》v2 第 3 组：C104-C109（心里的仗 / 内耗 / 直觉 / 比喻 / 拖延）
//   S1 胸口里的战场 → 拉出到人群里笑着的她   S2 对话泡泡隧道里分叉的结局   S3 俯拍岔路：灰网格路 vs 萤火小路
//   S4 低机位巨书：字离开书页飞成月亮，书页变成海   S5 窗前时间流逝：星轨一整夜 → 日夜翻过、日历撕掉
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { K, L, LIME, GOLD, IVORY, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, vis, hash, mulberry32, mix } = K;
const rgba = K.rgba;

// ---------- 小工具 ----------
function vfill(ctx, stops, a, y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1); for (const [p, c, al] of stops) g.addColorStop(p, rgba(c, al));
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
}
function rad(ctx, x, y, r, c, al, a = 1) {
  if (a * al <= 0.003 || r <= 1) return;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(c, al)); g.addColorStop(1, rgba(c, 0));
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, 2 * r, 2 * r); ctx.restore();
}
function blur(ctx, px, fn) { ctx.save(); ctx.filter = `blur(${px}px)`; fn(); ctx.restore(); }
function poly(ctx, pts, fill, a = 1) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = fill; ctx.beginPath(); pts.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore(); }
const cHead = (x, y, s) => [x + 44 * 1.43 * s, y - 321 * 1.43 * s];     // infp 头部（未转动时）
const cChest = (x, y, s) => [x + 4 * 1.43 * s, y - 181 * 1.43 * s];

module.exports = function make(P1) {
  const TYPES = (P1 && P1.TYPES) || MB.ALL;
  const S = [];
  const add = (a, b, draw, over) => S.push({ a, b, draw, over });

  // ================= S1：C104-C105 胸口里的仗 → 拉出来，她在人群里笑着，没人看出来 =================
  const R1 = mulberry32(3104);
  const UNITS = [];
  for (let i = 0; i < 160; i++) { const g = i % 2; UNITS.push({ g, wx: (g ? -1 : 1) * (70 + R1() * 1050), d: R1(), ph: R1() * 6.28, h: 0.75 + R1() * 0.55 }); }
  UNITS.sort((p, q) => p.d - q.d);
  const HOR1 = 960;
  const front1 = (d, t) => 120 * Math.sin(t * 1.15 + d * 2.6) + 50 * Math.sin(t * 2.7 + 1);
  const pj1 = (wx, d) => { const z = 1.3 + (1 - d) * 9; return [540 + wx * 1.25 / z, HOR1 + 800 / z, 1.45 / z]; };
  function innerWar(c, t, push) {
    c.save();
    c.fillStyle = 'rgb(6,6,10)'; c.fillRect(-2600, -2600, W + 5200, H + 5200);
    c.translate(540, HOR1); c.scale(push, push); c.translate(-540, -HOR1);
    // 天空：左金右血红
    let g = c.createLinearGradient(0, 0, W, 0);
    g.addColorStop(0, 'rgb(150,104,38)'); g.addColorStop(0.42, 'rgb(70,46,28)'); g.addColorStop(0.58, 'rgb(64,14,20)'); g.addColorStop(1, 'rgb(124,18,30)');
    c.fillStyle = g; c.fillRect(-2600, -2600, W + 5200, HOR1 + 2600);
    g = c.createLinearGradient(0, 0, 0, HOR1); g.addColorStop(0, 'rgba(4,4,8,0.94)'); g.addColorStop(0.65, 'rgba(4,4,8,0.4)'); g.addColorStop(1, 'rgba(4,4,8,0)');
    c.fillStyle = g; c.fillRect(-2600, -2600, W + 5200, HOR1 + 2600);
    // 左上：金色光束
    c.save(); c.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) {
      const an = 0.62 + i * 0.12 + 0.03 * Math.sin(t * 0.7 + i), x0 = -160 + i * 40, y0 = -160, len = 1700;
      const gg = c.createLinearGradient(x0, y0, x0 + Math.cos(an) * len, y0 + Math.sin(an) * len); gg.addColorStop(0, 'rgba(255,214,130,0.2)'); gg.addColorStop(1, 'rgba(255,214,130,0)');
      c.fillStyle = gg; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0 + Math.cos(an - 0.045) * len, y0 + Math.sin(an - 0.045) * len); c.lineTo(x0 + Math.cos(an + 0.045) * len, y0 + Math.sin(an + 0.045) * len); c.closePath(); c.fill();
    }
    c.restore();
    // 右边：压过来的暗云 + 红色闪电
    for (let i = 0; i < 16; i++) rad(c, 600 + hash(i) * 620 + Math.sin(t * 0.5 + i) * 40 - (t % 30) * 4, 160 + hash(i + 9) * 680, 170 + hash(i + 3) * 160, [22, 3, 7], 0.75);
    const fl = Math.max(0, Math.sin(t * 5.3) * Math.sin(t * 2.1 + 1)); if (fl > 0.55) glow(c, 860, 360, 460, [255, 80, 70], (fl - 0.55) * 0.9);
    // 地平线
    glow(c, 540, HOR1, 560, [255, 206, 160], 0.3);
    g = c.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(255,220,140,0.5)'); g.addColorStop(0.5, 'rgba(255,244,226,0.7)'); g.addColorStop(1, 'rgba(255,90,80,0.5)');
    c.fillStyle = g; c.fillRect(-2600, HOR1 - 2, W + 5200, 4);
    g = c.createLinearGradient(0, HOR1, 0, H); g.addColorStop(0, 'rgb(46,30,22)'); g.addColorStop(0.25, 'rgb(18,11,11)'); g.addColorStop(1, 'rgb(6,4,6)');
    c.fillStyle = g; c.fillRect(-2600, HOR1 + 2, W + 5200, H + 2600);
    // 地面一排排光纹：前线左边金、右边红
    for (let r = 0; r < 18; r++) {
      const d = r / 17, f = front1(d, t), lp = [], rp = [];
      for (let j = 0; j <= 20; j++) { const wx = -1400 + j * 70; const p = pj1(wx, d); (wx < f ? lp : rp).push([p[0], p[1]]); }
      const fp = pj1(f, d); lp.push([fp[0], fp[1]]); rp.unshift([fp[0], fp[1]]);
      glowLine(c, lp, GOLD, 0.1 + 0.2 * d, 1 + d, 0.5); glowLine(c, rp, RED, 0.1 + 0.2 * d, 1 + d, 0.5);
    }
    // 两支队伍：金色光之骑士（光柱+火头） vs 暗红影子（黑影+红眼）
    for (const u of UNITS) {
      const f = front1(u.d, t), near = Math.max(0, 1 - Math.abs(u.wx) / 340);
      const wx = u.wx * 0.9 + f + (u.g ? -36 : 36) + Math.sin(t * 7 + u.ph) * 30 * near;
      const [x, y, s] = pj1(wx, u.d), hh = 200 * s * u.h, lean = (u.g ? 1 : -1) * 0.25 * near * (0.5 + 0.5 * Math.sin(t * 6 + u.ph));
      const tx = x + Math.sin(lean) * hh, ty = y - Math.cos(lean) * hh;
      if (u.g) {
        glow(c, x, y, 50 * s + 4, GOLD, 0.25);
        glowLine(c, [[x, y], [tx, ty]], GOLD, 0.9, 2.6 * s + 0.6, 0.9);
        glow(c, tx, ty, 30 * s + 4, [255, 238, 180], 0.95); glow(c, x + (tx - x) * 0.5, y + (ty - y) * 0.5, 70 * s, GOLD, 0.22);
      } else {
        glow(c, x, y - hh * 0.5, 110 * s + 6, [210, 30, 34], 0.32);
        c.fillStyle = 'rgba(20,4,7,0.95)'; c.beginPath(); c.ellipse(x + (tx - x) * 0.4, y - hh * 0.46, 46 * s + 1, hh * 0.52, -lean, 0, 6.283); c.fill();
        glow(c, x + (tx - x) * 0.6 - 11 * s, y - hh * 0.66, 10 * s + 2, RED, 1); glow(c, x + (tx - x) * 0.6 + 11 * s, y - hh * 0.66, 10 * s + 2, RED, 1);
      }
    }
    // 交锋处的火花和冲击波
    for (let r = 0; r < 12; r++) {
      const d = r / 11, f = front1(d, t), [x, y, s] = pj1(f, d), fk = Math.abs(Math.sin(t * 9 + r * 1.7));
      glow(c, x, y - 90 * s, (60 + 70 * fk) * s, [255, 246, 226], 0.55 * fk);
      for (let k = 0; k < 5; k++) { const v = (t * 1.7 + hash(r * 7 + k)) % 1, sd = hash(k + r * 3) - 0.5; glow(c, x + sd * 420 * s * v, y - 100 * s - 360 * s * v + 300 * s * v * v, (12 * (1 - v) + 3) * s * 2, sd < 0 ? GOLD : RED, (1 - v) * 0.9); }
    }
    const Tc = Math.floor(t / 0.75) * 0.75, rr = 8 + Math.floor(hash(Math.floor(t / 0.75)) * 4), [sx, sy, ss] = pj1(front1(rr / 11, Tc), rr / 11);
    L.shock(c, sx, sy - 90 * ss, t, Tc, { r0: 10, r1: 420 * ss, dur: 0.7, c: [255, 240, 214], a: 0.9, w: 2.4 });
    // 近处飞过的大火星（虚）
    for (let k = 0; k < 7; k++) { const v = (t * 0.35 + hash(k + 40)) % 1; glow(c, lerp(-100, W + 100, hash(k + 50)) + Math.sin(v * 6 + k) * 80, lerp(H + 80, -80, v), 60 + hash(k) * 60, k % 2 ? GOLD : RED, 0.18 * Math.sin(v * Math.PI)); }
    c.restore();
  }
  const FY1 = 1320, SC1 = 1.6, CH1 = cChest(W / 2, FY1, SC1);
  const R1b = mulberry32(55);
  const CITY = Array.from({ length: 46 }, () => ({ x: R1b() * W, y: 760 + R1b() * 260, r: 8 + R1b() * 26, c: R1b() < 0.55 ? [255, 206, 140] : [140, 220, 210], ph: R1b() * 6.28 }));
  add(vs('C104') - 0.2, vs('C106') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('C104'), tz = at('C104', '旁人'), tc = at('C105', '没必要');
    const out = easeInOut(prog(t, tz - 0.15, tz + 1.45));
    const Z = Math.exp(lerp(Math.log(12), 0, out)), push = 1 + 0.05 * smooth(prog(t, tz + 1.2, ve('C105') + 0.5)), Sc = Z * push;
    const close = smooth(prog(t, tc - 0.1, tc + 0.9));
    const [cx, cy] = CH1;
    // ---- 外面的世界：夜里的广场（被镜头放大）----
    if (Z < 11.5) {
      ctx.save(); ctx.translate(cx, cy); ctx.scale(Sc, Sc); ctx.translate(-cx, -cy);
      vfill(ctx, [[0, [5, 14, 18], 1], [0.48, [18, 44, 44], 1], [0.53, [26, 56, 52], 1], [0.62, [12, 26, 26], 1], [1, [5, 10, 12], 1]], a);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const b of CITY) glow(ctx, b.x + Math.sin(t * 0.2 + b.ph) * 6, b.y, b.r * 2.2, b.c, a * (0.22 + 0.12 * Math.sin(t * 1.3 + b.ph)));
      ctx.restore();
      // 远处人群（小、灰）
      for (let i = 0; i < 12; i++) { const v = ((t * 0.025 * (i % 2 ? 1 : -1) + hash(i + 3)) % 1 + 1) % 1; MB.person(ctx, TYPES[(i * 5 + 1) % TYPES.length], lerp(-60, W + 60, v), 1030 + (i % 3) * 14, 0.6, { a: a * 0.6, flip: i % 2 === 0, gray: 0.5, dim: 0.55, bob: Math.abs(Math.sin(t * 5 + i)) * 2 }); }
      rad(ctx, W / 2, FY1, 460, [190, 236, 170], 0.16, a);
      // 中景路人：从她身后走过，谁也没看她
      for (let i = 0; i < 3; i++) { const v = ((t - t0) * 0.07 * (i === 1 ? -1 : 1) + [0.1, 0.62, 0.85][i] + 1) % 1; MB.person(ctx, TYPES[(i * 7 + 4) % TYPES.length], lerp(-150, W + 150, v), FY1 - 120 + i * 18, 1.35, { a: a * 0.9, flip: i === 1, dim: 0.42, bob: Math.abs(Math.sin(t * 5.5 + i)) * 4 }); }
      infp(ctx, W / 2, FY1, SC1, { a, t, eyes: 'happy', mouth: 'smile', spin: t * 0.5, la: lerp(0.15, -0.95, close), ra: 0.3, tilt: 0.3, flies: 1 });
      ctx.restore();
    }
    // ---- 胸口那扇圆窗：里面就是那场仗 ----
    const r0 = 104 * (1 - 0.82 * close), rs = r0 * Sc;
    if (rs > 1) {
      const m = rs / 1000;
      ctx.save(); ctx.globalAlpha *= a; ctx.beginPath(); ctx.arc(cx, cy, rs, 0, 6.283); ctx.clip();
      ctx.translate(cx, cy); ctx.scale(m, m); ctx.translate(-540, -(HOR1 + 80));
      innerWar(ctx, t, 1 + 0.16 * smooth(prog(t, t0 - 0.3, tz + 1.2)));
      ctx.restore();
      if (rs < 900) {
        const rimA = a * (1 - smooth(prog(rs, 500, 900)));
        ctx.save(); ctx.globalCompositeOperation = 'lighter';
        for (const [c, w, al] of [[GOLD, 14, 0.12], [[255, 180, 120], 5, 0.35], [[255, 240, 210], 1.8, 0.9]]) { ctx.strokeStyle = rgba(c, al * rimA); ctx.lineWidth = w; ctx.beginPath(); ctx.arc(cx, cy, rs, 0, 6.283); ctx.stroke(); }
        ctx.restore();
        glow(ctx, cx, cy, rs * 2.2, [255, 170, 110], rimA * 0.25);
      }
    }
    // 窗合上之后，胸口只剩一点在跳的余火
    if (close > 0) { const p = 0.6 + 0.4 * Math.sin(t * 7); glow(ctx, cx, cy, 70, mix(GOLD, RED, 0.5 + 0.5 * Math.sin(t * 3)), a * close * 0.6 * p); glow(ctx, cx, cy, 20, [255, 240, 220], a * close * 0.7 * p); }
    // ---- 近景：大而虚的路人从镜头前挡过 ----
    const fg = a * smooth(prog(Z, 2.2, 1.05));
    if (fg > 0.01) blur(ctx, 9, () => {
      for (let i = 0; i < 2; i++) { const v = (t - tz - 0.4) * (i ? -0.2 : 0.24) + (i ? 1.12 : -0.18); MB.person(ctx, TYPES[(i * 9 + 6) % TYPES.length], v * W, 2180, 4.6, { a: fg * 0.95, flip: i === 1, dim: 0.78, shadow: 0, bob: Math.abs(Math.sin(t * 4 + i)) * 10 }); }
    });
  }, (ctx, t) => { if (t <= vs('C106') + 0.1) X.trait(ctx, '2', '心里有一场仗', ['一场仗'], t, vs('C104') - 0.2, ve('C106') + 0.3, RED); });

  // ================= S2：C106 对话泡泡隧道：一句话没发出去，脑子里分叉出好几种结局 =================
  const VP2 = [600, 610];
  const P2 = (wx, wy, D) => [VP2[0] + wx / D, VP2[1] + wy / D];
  const RING = (() => {    // 一个巨大的聊天气泡外框（世界坐标），尾巴在左下
    const pts = [], hw = 940, hh = 1080, r = 220, cy = 120;
    const arc = (cx0, cy0, a0, a1) => { for (let i = 0; i <= 8; i++) { const an = lerp(a0, a1, i / 8); pts.push([cx0 + Math.cos(an) * r, cy0 + Math.sin(an) * r]); } };
    arc(-hw + r, cy - hh + r, Math.PI, Math.PI * 1.5); arc(hw - r, cy - hh + r, -Math.PI / 2, 0); arc(hw - r, cy + hh - r, 0, Math.PI / 2);
    pts.push([-hw + 420, cy + hh], [-hw + 120, cy + hh + 260], [-hw + 220, cy + hh]);
    arc(-hw + r, cy + hh - r, Math.PI / 2, Math.PI); pts.push(pts[0]);
    return pts;
  })();
  const TREE = [];
  (function build(L, wx, wy, par) {
    const n = { L, wx, wy, par, i: TREE.length }; TREE.push(n); if (L >= 4) return;
    if (L % 2 === 0) { const sp = [640, 0, 170, 0][L]; build(L + 1, wx - sp, wy - 60, n); build(L + 1, wx + sp, wy - 60, n); }
    else { const sp = [0, 290, 0, 130][L]; build(L + 1, wx - sp * 0.35, wy - sp, n); build(L + 1, wx + sp * 0.35, wy + sp, n); }
  })(0, 60, 380, null);
  const TXT = { 1: ['他会不会嫌我烦', '已读不回怎么办'], 2: ['回个「哦」？', '他是不是在忙', '会不会太突然', '要不明天再发'] };
  { const cnt = {}; for (const n of TREE) { cnt[n.L] = cnt[n.L] || 0; n.k = cnt[n.L]++; n.txt = n.L === 0 ? '在吗？' : TXT[n.L] ? TXT[n.L][n.k] : null; } }
  const ENDC = [RED, BLUE, GOLD, [170, 176, 190]];
  const R2 = mulberry32(206);
  const DUST2 = Array.from({ length: 90 }, () => ({ wx: (R2() - 0.5) * 2400, wy: (R2() - 0.5) * 2600, ph: R2() }));
  function pill(ctx, x, y, w, h, a, edge, fillA = 0.85) {
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, `rgba(40,62,70,${fillA})`); g.addColorStop(1, `rgba(14,24,32,${fillA})`);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
    ctx.strokeStyle = rgba(edge, 0.7); ctx.lineWidth = Math.max(1.2, h / 40); ctx.stroke(); ctx.restore();
  }
  add(vs('C106') - 0.2, vs('C107') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('C106'), tb = at('C106', '一句话'), tk = at('C106', '好几种'), te = at('C106', '演完');
    const cz = 1.2 * easeInOut(prog(t, tb + 0.2, ve('C106') + 0.4));
    ctx.save(); ctx.translate(W / 2, 900); ctx.rotate(0.03 * Math.sin((t - t0) * 0.6)); ctx.translate(-W / 2, -900);
    vfill(ctx, [[0, [4, 10, 18], 1], [0.32, [12, 34, 46], 1], [0.6, [6, 16, 24], 1], [1, [3, 6, 10], 1]], a);
    glow(ctx, VP2[0], VP2[1], 620, [90, 190, 210], a * 0.35); glow(ctx, VP2[0], VP2[1], 160, [220, 250, 255], a * 0.5);
    // 隧道：一圈圈气泡外框往远处退，镜头一直往里走
    const flow = (t - t0) * 0.9 + cz * 1.4;
    for (let k = 0; k < 16; k++) {
      const D = 0.55 + (((k - flow) % 16) + 16) % 16 * 0.62, ra = a * smooth(prog(D, 0.55, 1.3)) * (1 - smooth(prog(D, 5, 10.5)));
      if (ra <= 0.01) continue;
      glowLine(ctx, RING.map(([x, y]) => P2(x, y, D)), mix([110, 200, 220], LIME, 0.5 + 0.5 * Math.sin(k)), ra * 0.55, 2.2 / Math.sqrt(D), 0.7, true);
    }
    // 隧道里的浮尘往镜头飞
    for (const d of DUST2) { const D = 0.5 + ((d.ph * 9 - (t - t0) * 1.6) % 9 + 9) % 9; const [x, y] = P2(d.wx, d.wy, D); glow(ctx, x, y, 7 / D + 1, [180, 230, 240], a * 0.5 * smooth(prog(D, 0.5, 1.2)) * (1 - D / 9)); }
    // 分叉的念头树
    const Dn = n => 1.25 + 0.8 * n.L - cz;
    const grow = n => easeOut(prog(t, tb - 0.35 + n.L * 0.42, tb + 0.15 + n.L * 0.42));
    const order = TREE.slice().sort((p, q) => Dn(q) - Dn(p));
    for (const n of order) {
      const D = Dn(n), g = grow(n); if (g <= 0) continue;
      const na = a * smooth(prog(D, 0.5, 0.95));
      if (n.par) {   // 枝：从父泡泡长到子泡泡
        const p = n.par, Dp = Dn(p), pts = [];
        for (let j = 0; j <= 14; j++) { const u = j / 14 * g, D2 = lerp(Dp, D, u); if (D2 < 0.45) continue; pts.push(P2(lerp(p.wx, n.wx, u), lerp(p.wy, n.wy, u) - Math.sin(u * Math.PI) * 60, D2)); }
        glowLine(ctx, pts, n.L === 4 ? ENDC[n.k % 4] : [140, 220, 230], na * 0.6, 2.4 / Math.sqrt(D), 0.8);
      }
      if (g < 0.85 || D < 0.45) continue;
      const [x, y] = P2(n.wx, n.wy, D), ga = na * smooth(prog(g, 0.85, 1));
      if (n.L === 4) {   // 结局：每一个都亮成不同颜色的光团
        const tf = tk - 0.15 + n.k * 0.06, f = smooth(prog(t, tf, tf + 0.25)), c = ENDC[n.k % 4];
        glow(ctx, x, y, (26 + 60 * f) / D * 1.6, c, ga * (0.35 + 0.6 * f)); glow(ctx, x, y, 12 / D * 1.6, [255, 250, 240], ga * f);
        L.shock(ctx, x, y, t, tf, { r0: 4, r1: 120 / D, dur: 0.6, c, a: ga * 0.8 });
        continue;
      }
      const w = (n.L >= 3 ? 340 : 640) / D, h = 170 / D, fs = 82 / D;
      glow(ctx, x, y, w * 0.7, n.L === 0 ? LIME : [120, 210, 230], ga * 0.18);
      pill(ctx, x, y, w, h, ga, n.L === 0 ? LIME : [130, 220, 235], 0.88);
      if (n.txt && fs >= 24) L.rich(ctx, n.txt, x, y + fs * 0.36, { size: Math.min(fs, 76), weight: 500, spacing: 0.03, color: n.L === 0 ? LIME : IVORY, alpha: ga * smooth(prog(fs, 24, 32)), glowKey: 0.3 });
    }
    ctx.restore();
    // 前景：她侧身站在左下，手机的光照着脸，抬头看着隧道
    const fx = 150, fy = 1680, s = 1.4, wide = t > tk;
    rad(ctx, fx + 120, fy - 760, 520, [60, 140, 160], 0.35, a);
    const o = infp(ctx, fx, fy, s, { a, t, wind: false, dim: 0.12, ra: -0.6, la: 0.25, look: [0.8, -0.7], eyes: wide ? 'wide' : 'open', mouth: wide ? 'o' : 'flat', nod: -0.2, tilt: -0.3, flies: 1 });
    if (o.rh) {
      const [px, py] = [o.rh[0] + 14, o.rh[1] - 46];
      ctx.save(); ctx.globalAlpha *= a; ctx.translate(px, py); ctx.rotate(-0.25);
      ctx.fillStyle = 'rgb(22,26,32)'; ctx.beginPath(); ctx.roundRect(-52, -94, 104, 188, 16); ctx.fill();
      const sg = ctx.createLinearGradient(0, -82, 0, 82); sg.addColorStop(0, 'rgb(200,240,236)'); sg.addColorStop(1, 'rgb(130,200,200)');
      ctx.fillStyle = sg; ctx.beginPath(); ctx.roundRect(-44, -82, 88, 164, 9); ctx.fill();
      ctx.fillStyle = 'rgba(90,170,130,0.9)'; ctx.beginPath(); ctx.roundRect(-34, 30, 62, 26, 13); ctx.fill();
      ctx.restore();
      glow(ctx, px, py, 220, [170, 240, 230], a * 0.32); glow(ctx, o.head[0] + 20, o.head[1] + 40, 200, [160, 230, 230], a * 0.2);
      const r0 = TREE[0], [rx, ry] = P2(r0.wx, r0.wy, Dn(r0));
      const g0 = grow(r0);
      if (g0 > 0 && Dn(r0) > 0.5) glowLine(ctx, [[px + 10, py - 90], [lerp(px, rx, g0), lerp(py - 90, ry + 40, g0)]], LIME, a * 0.6, 2.4, 0.9);
    }
    // 近景：两个大而虚的空气泡从镜头前飘过
    blur(ctx, 12, () => { for (let i = 0; i < 2; i++) { const v = ((t - t0) * 0.16 + i * 0.5) % 1; pill(ctx, lerp(i ? 1240 : -160, i ? 760 : 260, v), i ? 380 + v * 160 : 1180 - v * 120, 420, 120, a * 0.5 * Math.sin(v * Math.PI), [130, 220, 235], 0.5); } });
  }, (ctx, t) => {
    if (t > vs('C106') + 0.1) X.trait(ctx, '2', '心里有一场仗', ['一场仗'], t, vs('C104') - 0.2, ve('C106') + 0.3, RED);
    X.quote(ctx, '我会预先在脑内推演\n他的回复可能', t, at('C106', '演完') + 0.2, vs('C107') + 0.3, { y: 330 });
  });

  // ================= S3：C107 升镜俯拍岔路：左边灰网格「逻辑」，右边萤火小路，她选了光 =================
  const R3 = mulberry32(307);
  const FLY3 = Array.from({ length: 70 }, () => ({ z: 2.3 + Math.pow(R3(), 1.6) * 40, side: R3() * 2 - 1, ph: R3() * 6.28, up: R3() }));
  const STAR3 = Array.from({ length: 80 }, () => ({ x: R3() * W, y: R3() * 620, r: 1 + R3() * 2.5, ph: R3() * 6.28 }));
  const leftC = z => -Math.min(1.45, (z - 2.2) * 0.85);
  const rightC = z => { const q = Math.max(0, z - 2.2); return 1.25 * (1 - Math.exp(-q * 0.55)) + 0.55 * Math.sin(q * 0.5) * (1 - Math.exp(-q * 0.4)); };
  add(vs('C107') - 0.2, vs('C108') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('C107'), tg = at('C107', '直觉');
    const crane = easeInOut(prog(t, t0 - 0.2, ve('C107') + 0.4)), HOR = lerp(640, 520, crane);
    const pj = (gx, z) => [540 + 620 * gx / z, HOR + 1280 / z];
    const go = easeIn(prog(t, tg - 0.1, tg + 1.3)), zw = 2.2 + 70 * go * go, bloom = smooth(prog(t, tg - 0.1, tg + 0.5));
    // 天和地
    vfill(ctx, [[0, [4, 10, 16], 1], [HOR / H * 0.98, [22, 50, 46], 1], [HOR / H, [40, 70, 56], 1], [HOR / H + 0.04, [16, 34, 28], 1], [1, [4, 10, 8], 1]], a);
    for (const s of STAR3) if (s.y < HOR - 20) glow(ctx, s.x, s.y, s.r * 2.4, [220, 240, 220], a * 0.4 * (0.6 + 0.4 * Math.sin(t * 2 + s.ph)));
    glow(ctx, 540, HOR, 700, [100, 160, 110], a * 0.25);
    // 左：灰网格路（逻辑）
    const gA = a * lerp(0.5, 0.2, bloom);
    const edgeL = (o) => { const p = []; for (let z = 2.2; z < 60; z *= 1.08) p.push(pj(leftC(z) + o, z)); return p; };
    const lp = edgeL(-0.55), rp = edgeL(0.55);
    poly(ctx, [...lp, ...rp.reverse()], 'rgba(52,60,72,0.75)', a * lerp(1, 0.6, bloom));
    for (const o of [-0.55, -0.275, 0, 0.275, 0.55]) glowLine(ctx, edgeL(o), [150, 166, 188], gA, 1.4, 0.3);
    for (let z = 2.2; z < 40; z += 0.7) glowLine(ctx, [pj(leftC(z) - 0.55, z), pj(leftC(z) + 0.55, z)], [150, 166, 188], gA * 0.8, 1.2, 0.3);
    // 路牌
    { const [bx, by] = pj(-0.95, 1.95), s = 1.12;
      ctx.save(); ctx.globalAlpha *= a * lerp(1, 0.7, bloom);
      ctx.fillStyle = 'rgb(70,76,86)'; ctx.fillRect(bx - 7 * s, by - 330 * s, 14 * s, 330 * s);
      ctx.fillStyle = 'rgb(118,126,138)'; ctx.beginPath(); ctx.moveTo(bx + 60 * s, by - 320 * s); ctx.lineTo(bx - 120 * s, by - 320 * s); ctx.lineTo(bx - 160 * s, by - 280 * s); ctx.lineTo(bx - 120 * s, by - 240 * s); ctx.lineTo(bx + 60 * s, by - 240 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(bx - 120 * s, by - 320 * s, 180 * s, 8 * s); ctx.restore();
      K.text(ctx, '逻辑', bx - 40 * s, by - 264 * s, { size: 50 * s, weight: 600, color: [226, 230, 236], alpha: a * lerp(1, 0.6, bloom), align: 'center' }); }
    // 右：萤火铺的小路
    const pts = []; for (let z = 2.2; z < 70; z *= 1.05) pts.push(z);
    const eL = pts.map(z => pj(rightC(z) - 0.42, z)), eR = pts.map(z => pj(rightC(z) + 0.42, z));
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    poly(ctx, [...eL, ...eR.slice().reverse()], rgba(LIME, 0.07 + 0.2 * bloom), a);
    ctx.restore();
    pts.forEach((z, i) => {
      const lit = z < zw ? 1 : 0.18, w = 1 + 5 * Math.exp(-Math.abs(z - zw) * 0.8) * (go > 0 && go < 1 ? 1 : 0), r = 44 / z * 2.2;
      for (const [x, y] of [eL[i], eR[i]]) glow(ctx, x, y, r * (1 + w * 0.5), LIME, a * (0.25 + 0.6 * lit) * (0.6 + 0.4 * Math.sin(t * 4 - i * 0.6)));
      if (w > 1.5) { const [x, y] = pj(rightC(z), z); glow(ctx, x, y, r * 5, [240, 250, 190], a * 0.35); }
    });
    for (const f of FLY3) {
      const lit = f.z < zw ? 1 : 0.15, rise = f.z < zw ? ((t - tg) * 0.4 + f.up) % 1 : 0;
      const [x, y] = pj(rightC(f.z) + f.side * 0.36, f.z);
      glow(ctx, x + Math.sin(t * 2 + f.ph) * 10, y - rise * 520 / f.z * 2.2, 18 / f.z * 2.2 + 2, f.ph > 3 ? GOLD : LIME, a * lit * 0.8 * (1 - rise));
    }
    if (go > 0.35) { const [hx, hy] = pj(rightC(60), 60); glow(ctx, hx, hy, 300, [230, 250, 190], a * 0.6 * smooth(prog(go, 0.35, 0.9))); glow(ctx, hx, hy, 80, [255, 255, 230], a * 0.7 * smooth(prog(go, 0.35, 0.9))); }
    // 她：站在岔路口，左右看，念到「直觉」转身走上光路
    const walk = smooth(prog(t, tg + 0.1, ve('C107') + 0.6)), zh = 2.2 + 0.55 * walk, [hx, hy] = pj(rightC(zh) * walk, zh);
    rad(ctx, hx, hy, 220, [210, 240, 150], 0.25 + 0.2 * bloom, a);
    const look = t < tg - 0.6 ? [-1, 0.2] : t < tg ? [1, 0] : [0.8, -0.4];
    infp(ctx, hx, hy, 1.08 * 2.2 / zh, { a, t, look, eyes: t > tg ? 'happy' : 'open', mouth: t > tg ? 'smile' : 'flat', spin: t * (t > tg ? 6 : 0.6), lean: 0.06 * walk, ra: lerp(0.2, -0.4, bloom), la: 0.2, flies: 1 });
    // 前景：近处虚焦草叶，镜头上升时滑出画面
    blur(ctx, 8, () => {
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgba(8,20,14,0.95)';
      const off = crane * 260;
      for (let i = 0; i < 14; i++) { const x = i < 7 ? i * 34 - 20 : W - (i - 7) * 34 + 20, y = 1900 + off, h = 380 + hash(i) * 260, sw = Math.sin(t * 1.3 + i) * 20 + (i < 7 ? 60 : -60);
        ctx.beginPath(); ctx.moveTo(x - 14, y); ctx.quadraticCurveTo(x + sw * 0.4, y - h * 0.5, x + sw, y - h); ctx.quadraticCurveTo(x + sw * 0.5, y - h * 0.5, x + 14, y); ctx.fill(); }
      ctx.restore();
      for (let i = 0; i < 5; i++) glow(ctx, hash(i + 70) * W, 1500 + hash(i + 80) * 300 + off * 0.6, 90, LIME, a * 0.12);
    });
  }, (ctx, t, a) => { if (t <= vs('C108') + 0.1) X.trait(ctx, '3', '跟着感觉走', ['感觉'], t, vs('C107') - 0.2, ve('C109') + 0.3, LIME); });

  // ================= S4：C108 低机位巨书：她站在书脊上，字一行行离开书页飞成月亮和星星，书页化成一片海 =================
  const MOON = [770, 470], MR = 150;
  const bk = (u, v) => [540 + u * lerp(440, 640, v), lerp(985, 1335, v) - 46 * Math.sin(Math.min(1, Math.abs(u)) * Math.PI) * (0.5 + 0.5 * v) + 22 * Math.exp(-u * u * 70)];
  const LINES4 = [];
  for (let r = 0; r < 8; r++) for (const sd of [-1, 1]) LINES4.push({ r, sd, v: 0.14 + r * 0.1 });
  LINES4.sort((p, q) => p.r - q.r || p.sd - q.sd);
  const STARP = [[300, 360], [420, 250], [560, 330], [930, 300], [990, 640], [250, 560]];
  const MC = new K.Canvas(420, 420), mc = MC.getContext('2d');
  add(vs('C108') - 0.2, vs('C109') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('C108'), tl = at('C108', '写起') - 0.15, sea = smooth(prog(t, tl + 0.5, tl + 2.0));
    ctx.save(); const ps = 1 + 0.06 * smooth(prog(t, t0 - 0.2, ve('C108') + 0.4)); ctx.translate(540, 900); ctx.scale(ps, ps); ctx.translate(-540, -900 + 40 * smooth(prog(t, t0, ve('C108'))));
    vfill(ctx, [[0, [4, 8, 20], 1], [0.45, [12, 30, 50], 1], [0.52, [20, 46, 60], 1], [1, [4, 8, 12], 1]], a, -100, H);
    for (let i = 0; i < 70; i++) glow(ctx, hash(i * 3) * W, hash(i * 7) * 900 - 60, 2 + hash(i) * 4, [230, 240, 255], a * 0.35 * (0.6 + 0.4 * Math.sin(t * 2.4 + i)));
    // 月亮：字飞到之后才成形
    const mF = smooth(prog(t, tl + 0.9, tl + 1.9));
    glow(ctx, MOON[0], MOON[1], 520, [200, 220, 255], a * 0.22 * mF); glow(ctx, MOON[0], MOON[1], 260, [255, 246, 220], a * 0.3 * mF);
    if (mF > 0.01) {
      mc.setTransform(1, 0, 0, 1, 0, 0); mc.clearRect(0, 0, 420, 420); mc.globalCompositeOperation = 'source-over';
      const mg = mc.createRadialGradient(170, 190, 20, 210, 210, MR); mg.addColorStop(0, 'rgb(255,250,232)'); mg.addColorStop(1, 'rgb(236,222,186)');
      mc.fillStyle = mg; mc.beginPath(); mc.arc(210, 210, MR, 0, 6.283); mc.fill();
      mc.globalCompositeOperation = 'destination-out'; mc.beginPath(); mc.arc(210 + 72, 210 - 34, MR * 0.9, 0, 6.283); mc.fill();
      ctx.save(); ctx.globalAlpha *= a * mF; ctx.drawImage(MC, MOON[0] - 210, MOON[1] - 210); ctx.restore();
    }
    // 远处海平线（书后面的海，书页化开后才显）
    // 书：封皮 + 书页 + 页厚
    const N = 26, edge = (v) => { const p = []; for (let i = 0; i <= N; i++) p.push(bk(-1 + 2 * i / N, v)); return p; };
    const far = edge(0), near = edge(1);
    const sideL = [], sideR = []; for (let j = 0; j <= 10; j++) { sideL.push(bk(-1, j / 10)); sideR.push(bk(1, j / 10)); }
    const page = [...far, ...sideR, ...near.slice().reverse(), ...sideL.slice().reverse()];
    poly(ctx, page.map(([x, y]) => [x + (x - 540) * 0.04, y + 18 + (y - 985) * 0.08]), 'rgb(26,34,30)', a);
    for (let k = 0; k < 6; k++) poly(ctx, [...near.map(([x, y]) => [x, y + k * 5]), ...near.slice().reverse().map(([x, y]) => [x, y + k * 5 + 4])], k % 2 ? 'rgb(196,186,160)' : 'rgb(226,216,190)', a * (1 - sea * 0.6));
    { const g = ctx.createLinearGradient(0, 985, 0, 1340); g.addColorStop(0, 'rgb(214,204,176)'); g.addColorStop(1, 'rgb(244,236,214)');
      ctx.save(); ctx.globalAlpha *= a * (1 - sea * 0.92); ctx.fillStyle = g; ctx.beginPath(); page.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.fill(); ctx.restore(); }
    // 书页化成海：深蓝水面 + 波纹 + 月光倒影带
    if (sea > 0.01) {
      ctx.save(); ctx.beginPath(); page.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.closePath(); ctx.clip();
      const g = ctx.createLinearGradient(0, 985, 0, 1340); g.addColorStop(0, `rgba(30,70,96,${sea})`); g.addColorStop(1, `rgba(8,22,40,${sea})`);
      ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(0, 900, W, 520);
      for (let r = 0; r < 14; r++) { const v = r / 13, p = []; for (let i = 0; i <= 30; i++) { const u = -1 + 2 * i / 30, [x, y] = bk(u, v); p.push([x, y + Math.sin(u * 9 + t * 2.2 + r) * (2 + 5 * v)]); } glowLine(ctx, p, [140, 210, 240], sea * (0.12 + 0.16 * v), 1 + v, 0.5); }
      for (let r = 0; r < 22; r++) { const v = r / 21, [x0, y0] = bk((MOON[0] - 540) / 560 * (1 - v * 0.3), v), wv = (14 + 70 * v) * (0.6 + 0.4 * Math.sin(t * 5 + r * 1.9)); glowLine(ctx, [[x0 - wv, y0], [x0 + wv, y0]], [255, 246, 220], sea * mF * (0.5 + 0.4 * Math.sin(t * 7 + r)), 1.6 + v * 2, 0.8); }
      ctx.restore();
    }
    // 书页上的手写行：先一行行写出来，再离开书页飞上天
    const wrote = prog(t, t0 - 0.1, tl) * LINES4.length;
    LINES4.forEach((ln, i) => {
      const wr = clamp(wrote - i); if (wr <= 0) return;
      const tli = tl + i * 0.05, lift = easeInOut(prog(t, tli, tli + 1.25));
      const base = []; const u0 = ln.sd < 0 ? -0.9 : 0.1, u1 = ln.sd < 0 ? -0.1 : 0.9;
      for (let j = 0; j <= 16; j++) { const u = lerp(u0, u1, j / 16 * wr), [x, y] = bk(u, ln.v); base.push([x, y + Math.sin(j * 1.7 + i) * 2]); }
      if (lift <= 0) { ctx.save(); ctx.globalAlpha *= a * (1 - sea); ctx.strokeStyle = 'rgba(56,66,72,0.85)'; ctx.lineWidth = 2.4 + ln.v * 2; ctx.lineCap = 'round'; ctx.beginPath(); base.forEach(([x, y], j) => j ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore(); return; }
      const toMoon = i < 10, tgt = j => {
        if (toMoon) { const an = lerp(Math.PI * 0.62, Math.PI * 1.55, j / 16), rr = MR * (1 - (i % 5) * 0.05); return [MOON[0] + Math.cos(an) * rr - (i % 5) * 6, MOON[1] + Math.sin(an) * rr]; }
        const s = STARP[(i - 10) % STARP.length]; return [s[0] + (j - 8) * 2, s[1]];
      };
      const p = base.map(([x, y], j) => { const q = clamp(lift * 1.25 - j * 0.015), T = tgt(j), cx = lerp(x, T[0], 0.3) + (i % 2 ? 160 : -160), cy = lerp(y, T[1], 0.5) - 260; const e = easeInOut(q);
        return [(1 - e) * (1 - e) * x + 2 * e * (1 - e) * cx + e * e * T[0], (1 - e) * (1 - e) * y + 2 * e * (1 - e) * cy + e * e * T[1]]; });
      const fade = 1 - smooth(prog(lift, 0.85, 1)) * (toMoon ? 1 : 0.6);
      glowLine(ctx, p, mix([150, 220, 255], toMoon ? [255, 244, 210] : GOLD, lift), a * fade * 0.9, 2.2, 0.9);
      glow(ctx, p[p.length - 1][0], p[p.length - 1][1], 16, [255, 250, 230], a * fade * 0.8);
      if (!toMoon && lift > 0.9) { const s = STARP[(i - 10) % STARP.length], tw = 0.7 + 0.3 * Math.sin(t * 6 + i); glow(ctx, s[0], s[1], 40, GOLD, a * tw * 0.7); glowLine(ctx, [[s[0] - 34, s[1]], [s[0] + 34, s[1]]], [255, 246, 220], a * tw * 0.7, 1.4, 0.6); glowLine(ctx, [[s[0], s[1] - 34], [s[0], s[1] + 34]], [255, 246, 220], a * tw * 0.7, 1.4, 0.6); }
    });
    // 书页本身发的光，照着她
    glow(ctx, 540, 1080, 420, [255, 236, 190], a * 0.18 * (1 - sea)); glow(ctx, 540, 1080, 420, [120, 190, 230], a * 0.16 * sea);
    infp(ctx, 540, 1000, 0.95, { a, t, look: t > tl + 0.4 ? [0.7, -1] : [0, 0.6], eyes: 'happy', mouth: t > at('C108', '比喻') && t < tl ? 'o' : 'smile', spin: t * 1.2, ra: -0.5, la: 0.25, tilt: t > tl + 0.4 ? -0.3 : 0.2, nod: t > tl + 0.4 ? -0.3 : 0.5, flies: 1 });
    ctx.restore();
    // 近景：虚焦的纸屑光点
    blur(ctx, 10, () => { for (let i = 0; i < 6; i++) { const v = ((t - t0) * 0.12 + hash(i + 300)) % 1; glow(ctx, i < 3 ? 80 + i * 60 : W - 80 - (i - 3) * 60, lerp(1700, 1100, v), 70 + hash(i) * 40, i % 2 ? [255, 236, 190] : [140, 210, 240], a * 0.22 * Math.sin(v * Math.PI)); } });
  }, (ctx, t) => { if (t > vs('C108') + 0.1 && t <= vs('C109') + 0.1) X.trait(ctx, '3', '跟着感觉走', ['感觉'], t, vs('C107') - 0.2, ve('C109') + 0.3, LIME); });

  // ================= S5：C109 窗前时间流逝：感觉来了写一整夜（星轨转、纸飞） → 感觉不来，日夜一天天翻过去 =================
  const PAP = Array.from({ length: 26 }, (_, i) => ({ t: i / 26, vx: (hash(i + 500) - 0.5) * 700, vy: -(500 + hash(i + 600) * 500), rot: (hash(i + 700) - 0.5) * 8 }));
  const STAR5 = Array.from({ length: 60 }, (_, i) => ({ r: 60 + hash(i + 800) * 760, an: hash(i + 900) * 6.283, b: 0.3 + hash(i + 950) * 0.7 }));
  const WIN = [170, 250, 910, 1000], POLE = [660, 300];
  add(vs('C109') - 0.2, vs('C201') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('C109'), tn = at('C109', '感觉不来'), tL = ve('C109') - 0.35;
    const night = prog(t, t0 - 0.2, tn), days = Math.max(0, t - tn) * 3.05 / (ve('C109') - 0.35 - tn), late = t > tL;
    const dayAmt = t < tn ? smooth(prog(night, 0.75, 1)) * 0.45 : 0.5 - 0.5 * Math.cos(days * 6.283 + Math.acos(0.1)) ;
    const lamp = t < tn ? 1 : late ? 1.4 : lerp(1, 0.35, smooth(prog(t, tn, tn + 0.8)));
    ctx.save(); const ps = lerp(1.08, 1.0, easeInOut(prog(t, t0 - 0.2, ve('C109') + 0.4))); ctx.translate(540, 820); ctx.scale(ps, ps); ctx.translate(-540, -820);
    // 墙
    vfill(ctx, [[0, [16, 22, 24], 1], [0.6, [26, 28, 26], 1], [1, [10, 10, 10], 1]], a, -100, H + 100);
    // 窗外的天
    const [wx0, wy0, wx1, wy1] = WIN;
    ctx.save(); ctx.beginPath(); ctx.rect(wx0, wy0, wx1 - wx0, wy1 - wy0); ctx.clip();
    const sk = mix([6, 14, 30], [120, 170, 210], dayAmt), hz = mix([20, 40, 60], t < tn ? [250, 170, 110] : [230, 220, 190], dayAmt);
    { const g = ctx.createLinearGradient(0, wy0, 0, wy1); g.addColorStop(0, rgba(sk, 1)); g.addColorStop(1, rgba(hz, 1)); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = g; ctx.fillRect(wx0, wy0, wx1 - wx0, wy1 - wy0); ctx.restore(); }
    // 星轨：一整夜，星星绕着北极星画出越来越长的弧
    const trail = t < tn ? 0.15 + 1.6 * easeInOut(night) : 1.75, starA = a * (1 - dayAmt * 1.6);
    if (starA > 0.01) for (const s of STAR5) { const p = []; const a1 = s.an + trail; for (let k = 0; k <= 16; k++) { const an = lerp(s.an, a1, k / 16); p.push([POLE[0] + Math.cos(an) * s.r, POLE[1] + Math.sin(an) * s.r]); } glowLine(ctx, p, [200, 220, 255], starA * s.b * 0.55, 1.1, 0.4); glow(ctx, p[16][0], p[16][1], 5, [240, 246, 255], starA * s.b); }
    // 月亮划过窗：一整夜从左下升到右上再落
    if (t < tn + 0.3) { const m = night, mx = lerp(wx0 + 40, wx1 - 40, m), my = wy1 - 80 - Math.sin(m * Math.PI) * 560; glow(ctx, mx, my, 160, [255, 246, 220], a * 0.4 * (1 - dayAmt)); ctx.save(); ctx.globalAlpha *= a * (1 - dayAmt); ctx.fillStyle = 'rgb(250,244,226)'; ctx.beginPath(); ctx.arc(mx, my, 44, 0, 6.283); ctx.fill(); ctx.restore(); }
    // 白天划过的太阳
    if (t > tn) { const ph = days % 1, sx = lerp(wx0 - 60, wx1 + 60, ph), sy = wy1 - Math.sin(ph * Math.PI) * 600; glow(ctx, sx, sy, 200, [255, 236, 190], a * 0.7 * dayAmt); glow(ctx, sx, sy, 50, [255, 255, 240], a * dayAmt); }
    // 远处楼群剪影
    ctx.fillStyle = rgba(mix([6, 10, 16], [70, 90, 110], dayAmt), a); for (let i = 0; i < 9; i++) { const bw = 60 + hash(i + 40) * 70, bh = 80 + hash(i + 41) * 200; ctx.fillRect(wx0 + i * 86 - 10, wy1 - bh, bw, bh); }
    ctx.restore();
    // 窗框
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(34,30,26)';
    ctx.fillRect(wx0 - 26, wy0 - 26, wx1 - wx0 + 52, 26); ctx.fillRect(wx0 - 26, wy1, wx1 - wx0 + 52, 34); ctx.fillRect(wx0 - 26, wy0, 26, wy1 - wy0); ctx.fillRect(wx1, wy0, 26, wy1 - wy0);
    ctx.fillRect((wx0 + wx1) / 2 - 9, wy0, 18, wy1 - wy0); ctx.fillRect(wx0, (wy0 + wy1) / 2 - 9, wx1 - wx0, 18); ctx.restore();
    // 白天：阳光透过窗格投到墙和桌上，随太阳扫过去
    if (t > tn && dayAmt > 0.05) {
      const ph = days % 1, sh = lerp(260, -260, ph);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= a * dayAmt * 0.32;
      for (const [qx, qy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const x0 = wx0 + 40 + qx * 370 + sh, y0 = 1080 + qy * 60; ctx.fillStyle = 'rgb(255,230,180)'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + 330, y0); ctx.lineTo(x0 + 330 + sh * 0.5 + 60, y0 + 54); ctx.lineTo(x0 + sh * 0.5 + 60, y0 + 54); ctx.closePath(); ctx.fill(); }
      ctx.restore();
    }
    // 日历：每过一天撕掉一页，最后一页画着红圈
    { const cx = 955, cy = 520, day = t < tn ? 0 : Math.floor(days + 0.1), tear = t < tn ? 0 : (days + 0.1) % 1;
      const num = Math.min(15, 12 + day);
      ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(230,224,210)'; ctx.fillRect(cx - 62, cy - 70, 124, 150); ctx.fillStyle = 'rgb(180,60,56)'; ctx.fillRect(cx - 62, cy - 70, 124, 30); ctx.restore();
      K.text(ctx, String(num), cx, cy + 56, { size: 76, weight: 700, color: [40, 40, 44], alpha: a, align: 'center' });
      if (num === 15) L.ellipse(ctx, cx, cy + 30, 52, 44, RED, a * 0.9, 3.4);
      if (t > tn && num < 15 && tear > 0.6) { const u = prog(tear, 0.6, 1); ctx.save(); ctx.globalAlpha *= a * (1 - u); ctx.translate(cx - 40 * u, cy - 10 + u * 200); ctx.rotate(-u * 1.2); ctx.fillStyle = 'rgb(236,230,216)'; ctx.fillRect(-62, -40, 124, 120); ctx.restore(); }
    }
    // 台灯光锥（体积光）
    const lx = 860, ly = 900;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha *= a * clamp(lamp * 0.55);
    { const g = ctx.createLinearGradient(lx, ly, lx - 180, 1180); g.addColorStop(0, 'rgba(255,214,150,0.55)'); g.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(lx - 50, ly); ctx.lineTo(lx + 40, ly + 10); ctx.lineTo(lx + 160, 1170); ctx.lineTo(lx - 520, 1170); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    for (let i = 0; i < 14; i++) { const v = (t * 0.1 + hash(i + 400)) % 1; glow(ctx, lx - 300 + hash(i + 410) * 380 + Math.sin(t + i) * 20, lerp(1150, 920, v), 4, [255, 230, 180], a * lamp * 0.5 * Math.sin(v * Math.PI)); }
    // 她：感觉来了奋笔疾书；感觉不来趴着，最后一刻猛地弹起来
    const busy = t < tn || late;
    const o = infp(ctx, 470, 1310, 1.22, { a, t, wind: false, dim: lerp(0, 0.35, t < tn || late ? 0 : smooth(prog(t, tn, tn + 0.8))),
      eyes: late ? 'wide' : t < tn ? 'happy' : 'closed', mouth: late ? 'o' : t < tn ? 'smile' : 'flat',
      nod: t < tn ? 0.9 : late ? 0.4 : lerp(0.9, 2.2, smooth(prog(t, tn, tn + 0.7))), lean: late ? 0.04 * Math.sin(t * 40) : t < tn ? 0 : 0.12 * smooth(prog(t, tn, tn + 0.7)),
      ra: busy ? 0.75 + 0.22 * Math.sin(t * (late ? 34 : 15)) : 1.1, la: 0.55, flies: t < tn || late ? 1 : 0 });
    glow(ctx, 600, 1080, 300, [255, 210, 150], a * 0.22 * lamp);
    // 台灯
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgb(70,66,60)'; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(900, 1110); ctx.lineTo(930, 960); ctx.lineTo(870, 890); ctx.stroke();
    ctx.fillStyle = 'rgb(96,88,74)'; ctx.beginPath(); ctx.moveTo(800, 905); ctx.lineTo(880, 850); ctx.lineTo(912, 912); ctx.closePath(); ctx.fill(); ctx.restore();
    glow(ctx, 852, 908, 70, [255, 236, 190], a * lamp * 0.8);
    // 桌子（挡住她下半身）
    poly(ctx, [[-40, 1110], [1120, 1110], [1160, 1210], [-80, 1210]], 'rgb(58,42,32)', a);
    poly(ctx, [[-80, 1210], [1160, 1210], [1160, 1700], [-80, 1700]], 'rgb(24,18,14)', a);
    { const g = ctx.createLinearGradient(0, 1110, 0, 1210); g.addColorStop(0, 'rgba(255,210,150,0.25)'); g.addColorStop(1, 'rgba(255,210,150,0)'); ctx.save(); ctx.globalAlpha *= a * lamp; ctx.fillStyle = g; ctx.fillRect(0, 1110, W, 100); ctx.restore(); }
    // 纸：写一整夜时一张张飞起来，越堆越高；最后一刻又炸开一片
    const np = t < tn ? Math.floor(night * 18) : 18;
    for (let i = 0; i < np; i++) poly(ctx, [[420 + hash(i) * 20, 1150 - i * 5], [600 + hash(i) * 20, 1150 - i * 5], [610 + hash(i + 1) * 20, 1162 - i * 5], [410 + hash(i + 1) * 20, 1162 - i * 5]], i % 2 ? 'rgb(230,224,206)' : 'rgb(214,206,186)', a);
    const fly = (u0, k0) => PAP.forEach((p, i) => {
      const ti = u0 + p.t * k0, age = t - ti; if (age < 0 || age > 1.4) return;
      const x = 560 + p.vx * age, y = 1080 + p.vy * age + 600 * age * age, r = p.rot * age;
      ctx.save(); ctx.globalAlpha *= a * (1 - age / 1.4); ctx.translate(x, y); ctx.rotate(r); ctx.scale(1, 0.6 + 0.4 * Math.cos(r * 1.3));
      ctx.fillStyle = 'rgb(242,236,220)'; ctx.fillRect(-34, -44, 68, 88); ctx.fillStyle = 'rgba(80,90,96,0.5)'; for (let k = 0; k < 4; k++) ctx.fillRect(-24, -30 + k * 18, 48, 3); ctx.restore();
      glow(ctx, x, y, 60, [255, 226, 180], a * 0.12 * (1 - age / 1.4));
    });
    if (t < tn + 1.4) fly(t0 - 0.2, tn - t0 - 0.6);
    if (late) { fly(tL, 0.5); L.shock(ctx, 852, 908, t, tL, { r0: 20, r1: 520, dur: 0.6, c: [255, 230, 180], a: a * 0.8, w: 2.4 }); }
    ctx.restore();
    // 近景：左侧虚焦的窗帘边
    blur(ctx, 14, () => { const sw = Math.sin(t * 0.8) * 14; poly(ctx, [[-60, -40], [70 + sw, -40], [50 + sw * 1.5, 900], [90 + sw, 1960], [-60, 1960]], 'rgb(10,14,14)', a * 0.95); glow(ctx, 70, 700, 120, [255, 214, 160], a * 0.08); });
  }, (ctx, t) => {
    if (t > vs('C109') + 0.1) X.trait(ctx, '3', '跟着感觉走', ['感觉'], t, vs('C107') - 0.2, ve('C109') + 0.3, LIME);
    X.quote(ctx, '很喜欢卡最后一刻。', t, at('C109', '感觉不来') + 0.1, vs('C201') + 0.3, { y: 330 });
  });

  return S;
};
