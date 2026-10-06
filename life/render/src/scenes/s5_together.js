// 第五幕 共生：一个细胞吞下另一个细胞，却没有消化它（266–303 秒）
'use strict';
const K = require('../core');
const { W, H, C, clamp, lerp, prog, smooth, easeInOut, easeOut, easeIn, vis, glow, glowLine, line, partial, text, mulberry32, rgba, mix } = K;
const TL = require('../timeline');
const UI = require('../ui');

const events = [{ t: 273.6, type: 'touch' }, { t: 278.6, type: 'ignite' }, { t: 281.8, type: 'braid' }];
for (const b of TL.HEARTBEATS) if (b > 294 && b < 302) events.push({ t: b, type: 'beatflash' });

const CC = [900, 500], CR = 230;
// 细菌位置：从右侧游来，被包进细胞
function bactPos(t) {
  const x = t < 274 ? lerp(1760, 1150, easeOut(prog(t, 268.5, 273.8))) : lerp(1150, 1010, easeInOut(prog(t, 274.2, 277.0)));
  const y = 505 + 10 * Math.sin(t * 1.3);
  return [x, y];
}
function membrane(t, cx, cy, R, bp, bulge) {
  const pts = [];
  for (let k = 0; k <= 180; k++) {
    const th = k / 180 * 6.2832;
    let r = R * (1 + 0.022 * Math.sin(3 * th + t * 0.9) + 0.014 * Math.sin(5 * th - t * 1.3));
    if (bulge > 0 && bp) {
      const ab = Math.atan2(bp[1] - cy, bp[0] - cx);
      let d = th - ab; d = Math.atan2(Math.sin(d), Math.cos(d));
      r += bulge * Math.exp(-Math.pow(d / 0.42, 2));
    }
    pts.push([cx + r * Math.cos(th), cy + r * Math.sin(th)]);
  }
  return pts;
}
function capsule(cx, cy, L, Wd, ang) {
  const pts = [], r = Wd / 2, hl = L / 2 - r;
  for (let k = 0; k <= 24; k++) { const a = -Math.PI / 2 + k / 24 * Math.PI; pts.push([hl + r * Math.cos(a), r * Math.sin(a)]); }
  for (let k = 0; k <= 24; k++) { const a = Math.PI / 2 + k / 24 * Math.PI; pts.push([-hl + r * Math.cos(a), r * Math.sin(a)]); }
  pts.push(pts[0]);
  const ca = Math.cos(ang), sa = Math.sin(ang);
  return pts.map(([x, y]) => [cx + x * ca - y * sa, cy + x * sa + y * ca]);
}
function cristae(cx, cy, L, Wd, ang, f = 1) {
  const out = [], ca = Math.cos(ang), sa = Math.sin(ang);
  const n = 5;
  for (let i = 0; i < n; i++) {
    const x0 = -L / 2 + L * (i + 0.7) / (n + 0.4);
    const pts = [];
    for (let k = 0; k <= 10; k++) {
      const u = k / 10, y = (u - 0.5) * Wd * 0.62 * (i % 2 ? 1 : -1);
      pts.push([x0 + 4 * Math.sin(u * 6.28), y]);
    }
    out.push(partial(pts.map(([x, y]) => [cx + x * ca - y * sa, cy + x * sa + y * ca]), f));
  }
  return out;
}
// 组织：很多细胞
const TISSUE = (() => {
  const r = mulberry32(17), out = [];
  const s = 118;
  for (let j = -1; j < 11; j++) for (let i = -1; i < 18; i++) {
    const x = i * s + (j % 2 ? s / 2 : 0) + (r() - 0.5) * 22, y = j * s * 0.87 + (r() - 0.5) * 22;
    const mitos = [];
    const m = 3 + Math.floor(r() * 3);
    for (let k = 0; k < m; k++) mitos.push({ dx: (r() - 0.5) * 60, dy: (r() - 0.5) * 56, ang: r() * 3.14, L: 18 + r() * 8, ph: r() * 6 });
    out.push({ x, y, R: 50 + r() * 6, mitos, seed: r() * 6 });
  }
  return out;
})();

function draw(ctx, t) {
  if (t < 266 || t > 304) return;
  const sceneA = smooth(prog(t, 266.6, 269.6));
  // 281.5 起：细胞移到左侧并缩小，两条线编织向右
  const mv = easeInOut(prog(t, 281.4, 283.6));
  const tissueIn = smooth(prog(t, 286.4, 288.6));
  const cellA = sceneA * (1 - tissueIn);
  const cx = lerp(CC[0], 330, mv), cy = CC[1], sc = lerp(1, 0.55, mv);
  if (cellA > 0) {
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(sc, sc); ctx.translate(-CC[0], -CC[1]);
    const bp = bactPos(t);
    const bulge = 150 * smooth(prog(t, 272.4, 274.8)) * (1 - smooth(prog(t, 275.6, 277.4)));
    // 细胞内部柔光
    glow(ctx, CC[0], CC[1], CR * 1.6, C.cyan, 0.07 * cellA);
    const mem = membrane(t, CC[0], CC[1], CR, bp, bulge);
    glowLine(ctx, mem, C.cyan, 0.85 * cellA, 1.5);
    line(ctx, membrane(t + 0.6, CC[0], CC[1], CR - 9, bp, bulge * 0.92), C.cyan, 0.25 * cellA, 1);
    // 细胞核
    line(ctx, membrane(t * 0.7 + 3, CC[0] - 70, CC[1] + 20, 62, null, 0), C.ivory, 0.3 * cellA, 1);
    // 细菌 → 线粒体
    const ang = 0.15 * Math.sin(t * 0.8);
    const ignite = smooth(prog(t, 278.4, 279.6));
    const flick = t > 277.8 && t < 278.6 ? 0.5 + 0.5 * Math.sin(t * 60) : 1;
    const bcol = mix(C.ivory, C.gold, ignite);
    glowLine(ctx, capsule(bp[0], bp[1], 112, 48, ang), bcol, 0.9 * cellA * flick, 1.4);
    glow(ctx, bp[0], bp[1], 40 + 70 * ignite, C.gold, (0.15 + 0.6 * ignite) * cellA);
    for (const p of cristae(bp[0], bp[1], 112, 48, ang, easeOut(prog(t, 278.6, 280.4)))) glowLine(ctx, p, C.gold, 0.8 * cellA, 1.1, 0.5);
    // 包裹它的小泡
    const vA = smooth(prog(t, 276.2, 277.0)) * (1 - smooth(prog(t, 277.8, 279.0)));
    if (vA > 0) {
      ctx.save(); ctx.setLineDash([4, 5]); ctx.strokeStyle = rgba(C.cyan, 0.6 * vA * cellA); ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(bp[0], bp[1], 70, 0, 6.283); ctx.stroke(); ctx.restore();
    }
    ctx.restore();
    // 标注
    const la = vis(t, 270.4, 280.8, 0.8, 0.8) * cellA;
    text(ctx, '细胞', CC[0] - 120, CC[1] - CR - 40, { size: 22, alpha: 0.75 * la, spacing: 0.2 });
    text(ctx, 'HOST CELL', CC[0] - 120, CC[1] - CR - 16, { size: 12, family: 'Mono', alpha: 0.45 * la, spacing: 0.35 });
    const lb = vis(t, 269.4, 274.0, 0.8, 0.6) * cellA;
    text(ctx, '细菌', bp[0], bp[1] - 66, { size: 22, alpha: 0.75 * lb, spacing: 0.2 });
    text(ctx, 'BACTERIUM', bp[0], bp[1] - 44, { size: 12, family: 'Mono', alpha: 0.45 * lb, spacing: 0.35 });
  }
  // 两条线编织
  const brA = vis(t, 281.8, 288.0, 1.0, 1.4) * sceneA;
  if (brA > 0) {
    const x0 = 330 + CR * 0.55, x1 = lerp(x0, W + 40, easeOut(prog(t, 282.0, 285.0)));
    const a = [], b = [];
    for (let x = x0; x <= x1; x += 6) {
      const w = Math.min(1, (x - x0) / 120) * 34;
      const ph = x * 0.016 - t * 1.6;
      a.push([x, 500 + w * Math.sin(ph)]); b.push([x, 500 - w * Math.sin(ph)]);
    }
    glowLine(ctx, a, C.cyan, 0.85 * brA, 1.6);
    glowLine(ctx, b, C.gold, 0.95 * brA, 1.8);
  }
  // 组织：无数细胞，每个里面都有金色的线粒体
  if (tissueIn > 0) {
    const out = 1 - smooth(prog(t, 300.6, 302.8));
    const z = lerp(2.6, 1, easeOut(prog(t, 286.4, 291.0)));
    ctx.save();
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
    for (const c of TISSUE) {
      const d = Math.hypot(c.x - W / 2, c.y - H / 2);
      const appear = smooth(prog(t, 286.4 + d / 1400, 288.0 + d / 1400)) * out;
      if (appear <= 0) continue;
      const pts = [];
      for (let k = 0; k <= 40; k++) { const th = k / 40 * 6.283; const r = c.R * (1 + 0.04 * Math.sin(3 * th + c.seed + t * 0.6)); pts.push([c.x + r * Math.cos(th), c.y + r * Math.sin(th)]); }
      line(ctx, pts, C.cyan, 0.32 * appear, 1.1);
      // 心跳时，从中心向外传开的一闪
      let beat = 0;
      for (const hb of TL.HEARTBEATS) {
        if (hb < 294 || hb > 302) continue;
        const dd = t - hb - d / 2200;
        if (dd > 0 && dd < 1) beat = Math.max(beat, Math.exp(-dd * 5));
      }
      for (const m of c.mitos) {
        const mx = c.x + m.dx * 0.8, my = c.y + m.dy * 0.8, ang = m.ang + 0.2 * Math.sin(t * 0.7 + m.ph);
        const caps = capsule(mx, my, m.L, 8, ang);
        line(ctx, caps, C.gold, (0.6 + 0.4 * beat) * appear, 1.1);
        glow(ctx, mx, my, 14 + 18 * beat, C.gold, (0.25 + 0.75 * beat) * appear);
      }
    }
    ctx.restore();
    UI.bands(ctx, tissueIn * (1 - smooth(prog(t, 300.6, 302.8))));
    UI.hud(ctx, vis(t, 288.0, 300.4, 0.8, 0.8), { label: '线粒体', en: 'MITOCHONDRIA', value: '来自你的母亲', valueEn: 'INHERITED FROM YOUR MOTHER' });
  }
  UI.hud(ctx, vis(t, 270.2, 286.0, 0.8, 0.8), { label: '内共生', en: 'ENDOSYMBIOSIS', value: '约 20 亿年前', valueEn: '~2,000,000,000 YEARS AGO' });
}
module.exports = { start: 266, end: 304, draw, events };
