'use strict';
// 《ESFJ》v2 场景工具：一个小小的 3D 透视投影，所有场景（长桌、街道、屋子、走廊）都在同一套透视里搭，
// 人物按深度缩放、站在地上、被场景里的灯照亮。全片暖色夜晚的世界：灯是暖的，屋外是冷蓝的。
//   const p = E.cam3({ cx, cy, f, h, z0, x0 })   世界坐标 X 左右(米) Y 高度(米) Z 深度(米) -> 屏幕
//   E.hero3(ctx, p, X, Z, o) / E.folk3(ctx, p, key, X, Z, o)   按深度放人（身高约 1.75 米）
//   E.lit(ctx, fn, { x, y, r, c, k, amb })   人物画进离屏，再按场景光上色（近灯一侧暖、远离一侧压暗）
const K = require('../core');
const MB = require('./mb');
const ES = require('./esf');
const { W, H, clamp, lerp, mix, hash, glow, rgba, smooth, prog } = K;

const WARM = [255, 196, 122], WARM2 = [255, 168, 96], CANDLE = [255, 214, 150], NIGHT = [36, 46, 84], NIGHT2 = [18, 22, 44];
const PLUM = [26, 17, 22], WOOD = [118, 74, 46], WALL = [92, 62, 50], CLOTH = [236, 222, 200];

// ---------- 投影 ----------
function cam3(c) {
  // pitch：镜头往下看的角度（弧度）。0 = 平视；0.6 ≈ 俯拍 35°；1.2 ≈ 接近正俯视
  const { cx = W / 2, cy = 820, f = 900, h = 1.6, z0 = 0, x0 = 0, pitch = 0 } = c;
  const cs = Math.cos(pitch), sn = Math.sin(pitch);
  const zc = (Y, Z) => Math.max(0.05, -(Y - h) * sn + (Z - z0) * cs);
  const p = (X, Y, Z) => { const z = zc(Y, Z), yc = (Y - h) * cs + (Z - z0) * sn; return [cx + f * (X - x0) / z, cy - f * yc / z]; };
  p.depth = (Z, Y = 0) => zc(Y, Z); p.f = f; p.h = h; p.cx = cx; p.cy = cy; p.z0 = z0; p.x0 = x0; p.pitch = pitch;
  p.px = (Z, m = 1, Y = 0) => f * m / zc(Y, Z); // 深度 Z 处 m 米对应多少像素
  return p;
}
function poly(ctx, p, pts, fill, a = 1) {
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = typeof fill === 'string' ? fill : rgba(fill);
  ctx.beginPath(); pts.forEach((q, i) => { const s = p(q[0], q[1], q[2]); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.closePath(); ctx.fill(); ctx.restore();
}
function seg(ctx, p, A, B, c, a = 1, w = 2) {
  const s = p(...A), e = p(...B); ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = rgba(c); ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(s[0], s[1]); ctx.lineTo(e[0], e[1]); ctx.stroke(); ctx.restore();
}
// 远处融进雾色
const fogC = (c, Z, p, fog = PLUM, far = 40) => mix(c, fog, clamp((p.depth(Z) - 2) / far, 0, 0.92));

// ---------- 人物 ----------
const HERO_PX = 585, FOLK_PX = 240;
function hero3(ctx, p, X, Z, o = {}) { const m = o.m || 1.75, s = p.px(Z, m) / HERO_PX; const [x, y] = p(X, o.Y || 0, Z); contact(ctx, x, y, 95 * s * 1.1, o.shadow == null ? 0.45 : o.shadow); return ES.hero(ctx, x, y, s, o); }
function folk3(ctx, p, key, X, Z, o = {}) { const m = o.m || 1.7, s = p.px(Z, m) / FOLK_PX; const [x, y] = p(X, o.Y || 0, Z); contact(ctx, x, y, 44 * s, o.shadow == null ? 0.4 : o.shadow); return MB.person(ctx, key, x, y, s, { shadow: 0, ...o }); }
function contact(ctx, x, y, rx, a = 0.45) {
  if (a <= 0) return; ctx.save(); const g = ctx.createRadialGradient(x, y, 0, x, y, rx);
  g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g;
  ctx.translate(x, y); ctx.scale(1, 0.22); ctx.beginPath(); ctx.arc(0, 0, rx, 0, 7); ctx.fill(); ctx.restore();
}
// 场景光：人物先画进离屏，再按灯位上色。x,y,r 用当前变换下的坐标
const OFF = new K.Canvas(W, H), OX = OFF.getContext('2d');
function lit(ctx, fn, o = {}) {
  const { x = W / 2, y = 500, r = 1100, c = WARM, k = 0.32, amb = 0.5, ac = [10, 6, 14] } = o;
  const M = ctx.getTransform();
  OX.setTransform(1, 0, 0, 1, 0, 0); OX.globalCompositeOperation = 'source-over'; OX.globalAlpha = 1; OX.clearRect(0, 0, W, H);
  OX.setTransform(M); const res = fn(OX);
  OX.setTransform(M); OX.globalCompositeOperation = 'source-atop'; OX.globalAlpha = 1;
  const g = OX.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(c, k)); g.addColorStop(0.4, rgba(c, k * 0.35)); g.addColorStop(0.75, rgba(ac, amb * 0.5)); g.addColorStop(1, rgba(ac, amb));
  OX.fillStyle = g; OX.fillRect(-4000, -4000, 9000, 9000);
  OX.globalCompositeOperation = 'source-over';
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(OFF, 0, 0); ctx.restore();
  return res;
}

// ---------- 光 ----------
function pool(ctx, p, X, Z, R, c = WARM, a = 0.35) { // 地上的光斑（按透视压扁）
  if (p.depth(Z) < 1.2) return;
  const [x, y] = p(X, 0, Z), rx = Math.min(1400, p.px(Z, R)), ry = rx * clamp(p.h / p.depth(Z) * 1.2 + Math.sin(p.pitch || 0), 0.08, 1);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g; ctx.translate(x, y); ctx.scale(1, ry / rx); ctx.beginPath(); ctx.arc(0, 0, rx, 0, 7); ctx.fill(); ctx.restore();
}
function cone(ctx, x, y0, y1, w0, w1, c = WARM, a = 0.1) { // 灯下的光柱
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0)); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - w0 / 2, y0); ctx.lineTo(x + w0 / 2, y0); ctx.lineTo(x + w1 / 2, y1); ctx.lineTo(x - w1 / 2, y1); ctx.closePath(); ctx.fill(); ctx.restore();
}
function bulb(ctx, x, y, r, c = CANDLE, a = 1) { if (a <= 0.01) return; glow(ctx, x, y, r * 7, c, 0.22 * a); glow(ctx, x, y, r * 2.4, c, 0.55 * a); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = rgba(mix(c, [255, 255, 245], 0.6)); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore(); }
// 灯串：A、B 两个 3D 点之间下垂的电线 + n 个灯泡；on(i) 返回 0..1
function bulbs(ctx, p, A, B, n, sag, t, on = () => 1, c = CANDLE) {
  const pts = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24; pts.push([lerp(A[0], B[0], u), lerp(A[1], B[1], u) - sag * 4 * u * (1 - u), lerp(A[2], B[2], u)]); }
  ctx.save(); ctx.strokeStyle = 'rgba(30,22,20,0.9)'; ctx.lineWidth = 2; ctx.beginPath(); pts.forEach((q, i) => { const s = p(...q); i ? ctx.lineTo(s[0], s[1]) : ctx.moveTo(s[0], s[1]); }); ctx.stroke(); ctx.restore();
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, q = [lerp(A[0], B[0], u), lerp(A[1], B[1], u) - sag * 4 * u * (1 - u) - 0.06, lerp(A[2], B[2], u)], s = p(...q);
    const a = on(i, u); const r = Math.max(1.5, p.px(q[2], 0.035));
    ctx.save(); ctx.fillStyle = 'rgba(60,46,38,0.9)'; ctx.beginPath(); ctx.arc(s[0], s[1], r, 0, 7); ctx.fill(); ctx.restore();
    bulb(ctx, s[0], s[1], r, c, a * (0.85 + 0.15 * Math.sin(t * 3 + i * 1.7)));
  }
}
// 前景虚焦光斑（全片统一，暖色）
const BOKEH = Array.from({ length: 26 }, (_, i) => ({ x: hash(i * 3.1) * (W + 200), y: hash(i * 7.7) * H, r: 30 + hash(i * 1.3) * 90, sp: 0.4 + hash(i * 5.2), ph: hash(i * 9.9) * 6, c: hash(i * 2.2) > 0.3 ? WARM : [255, 230, 200] }));
function bokeh(ctx, t, a = 1) {
  if (a <= 0) return; ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const b of BOKEH) { const x = (b.x + t * 14 * b.sp) % (W + 200) - 100, y = b.y + Math.sin(t * b.sp + b.ph) * 30; glow(ctx, x, y, b.r, b.c, 0.055 * a * (0.6 + 0.4 * Math.sin(t * 0.7 + b.ph))); }
  ctx.restore();
}
function rain(ctx, t, a = 1, o = {}) {
  const { n = 220, c = [170, 190, 230], len = 46, slant = -0.18 } = o; if (a <= 0) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.6;
  for (let i = 0; i < n; i++) { const sp = 1400 + hash(i * 1.9) * 900, x = hash(i * 3.3) * (W + 300) - 150, y = (hash(i * 7.1) * H + t * sp) % (H + 100) - 50, d = 0.4 + hash(i * 4.4) * 0.6; ctx.strokeStyle = rgba(c, 0.22 * a * d); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + slant * len * d, y + len * d); ctx.stroke(); }
  ctx.restore();
}
function vignetteWarm(ctx, a = 0.5) { const g = ctx.createRadialGradient(W / 2, H * 0.45, H * 0.25, W / 2, H * 0.45, H * 0.8); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(8,4,8,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
function sky(ctx, top = NIGHT2, bot = NIGHT, y1 = H) { const g = ctx.createLinearGradient(0, 0, 0, y1); g.addColorStop(0, rgba(top)); g.addColorStop(1, rgba(bot)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }

// ---------- 屋子：一个盒子，后墙在 Z=back，左右墙 X=±hw，高 ht ----------
function room(ctx, p, o = {}) {
  const { hw = 3, ht = 3, back = 10, near = 0.6, wall = WALL, floor = WOOD, ceil = [40, 28, 26], light = 1, win = null, planks = 14, stripe = true, fog = PLUM } = o;
  const L = (c, k) => mix(c, [6, 4, 8], 1 - k * light);
  ctx.fillStyle = rgba(L(ceil, 0.7)); ctx.fillRect(0, 0, W, H);
  poly(ctx, p, [[-hw, ht, near], [hw, ht, near], [hw, ht, back], [-hw, ht, back]], L(ceil, 0.8));
  poly(ctx, p, [[-hw, 0, near], [-hw, ht, near], [-hw, ht, back], [-hw, 0, back]], L(wall, 0.55));
  poly(ctx, p, [[hw, 0, near], [hw, ht, near], [hw, ht, back], [hw, 0, back]], L(wall, 0.6));
  poly(ctx, p, [[-hw, 0, near], [hw, 0, near], [hw, 0, back], [-hw, 0, back]], L(floor, 0.75));
  poly(ctx, p, [[-hw, 0, back], [hw, 0, back], [hw, ht, back], [-hw, ht, back]], L(wall, 0.85));
  // 木地板缝（顺着进深）+ 墙裙线
  for (let i = 0; i <= planks; i++) { const X = -hw + 2 * hw * i / planks; seg(ctx, p, [X, 0, near], [X, 0, back], L(mix(floor, [20, 12, 8], 0.5), 0.8), 0.5, 1.5); }
  for (const s of [-1, 1]) seg(ctx, p, [s * hw, 0.9, near], [s * hw, 0.9, back], L(mix(wall, [255, 230, 200], 0.15), 0.7), 0.6, 2);
  seg(ctx, p, [-hw, 0.9, back], [hw, 0.9, back], L(mix(wall, [255, 230, 200], 0.15), 0.8), 0.6, 2);
  if (stripe) for (let i = 1; i < 18; i++) { const X = -hw + 2 * hw * i / 18; seg(ctx, p, [X, 0.9, back], [X, ht, back], L(mix(wall, [0, 0, 0], 0.12), 0.85), 0.35, 1); }
  if (win) window3(ctx, p, win.X, win.Y, back - 0.01, win.w, win.h, win);
}
function window3(ctx, p, X, Y, Z, w, h, o = {}) {
  const { sky: sc = NIGHT, moon = true, glowIn = 0, frame = [60, 40, 32], t = 0 } = o;
  const a = p(X - w / 2, Y + h, Z), b = p(X + w / 2, Y, Z);
  ctx.save(); const g = ctx.createLinearGradient(0, a[1], 0, b[1]); g.addColorStop(0, rgba(mix(sc, [0, 0, 0], 0.4))); g.addColorStop(1, rgba(sc)); ctx.fillStyle = g; ctx.fillRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  if (moon) glow(ctx, lerp(a[0], b[0], 0.72), lerp(a[1], b[1], 0.3), (b[0] - a[0]) * 0.18, [220, 230, 255], 0.5);
  for (let i = 0; i < 9; i++) { const sx = lerp(a[0], b[0], hash(i * 2.7)), sy = lerp(a[1], b[1], hash(i * 5.1) * 0.6); ctx.fillStyle = `rgba(255,255,240,${0.4 + 0.4 * Math.sin(t * 2 + i)})`; ctx.fillRect(sx, sy, 2, 2); }
  if (glowIn > 0) glow(ctx, (a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (b[0] - a[0]), WARM, glowIn * 0.5);
  ctx.strokeStyle = rgba(frame); ctx.lineWidth = Math.max(3, (b[0] - a[0]) * 0.05); ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]);
  ctx.beginPath(); ctx.moveTo((a[0] + b[0]) / 2, a[1]); ctx.lineTo((a[0] + b[0]) / 2, b[1]); ctx.moveTo(a[0], (a[1] + b[1]) / 2); ctx.lineTo(b[0], (a[1] + b[1]) / 2); ctx.stroke(); ctx.restore();
}
// 吊灯：从天花板垂下，灯罩 + 光柱 + 地上光斑
function pendant(ctx, p, X, Z, o = {}) {
  const { ht = 3, drop = 0.9, on = 1, c = WARM, R = 1.6 } = o;
  const top = p(X, ht, Z), lamp = p(X, ht - drop, Z), s = p.px(Z, 0.32);
  ctx.save(); ctx.strokeStyle = 'rgba(20,14,12,0.9)'; ctx.lineWidth = Math.max(1, s * 0.04); ctx.beginPath(); ctx.moveTo(top[0], top[1]); ctx.lineTo(lamp[0], lamp[1]); ctx.stroke();
  ctx.fillStyle = rgba(mix([60, 44, 34], c, 0.25 * on)); ctx.beginPath(); ctx.moveTo(lamp[0] - s * 0.3, lamp[1]); ctx.lineTo(lamp[0] + s * 0.3, lamp[1]); ctx.lineTo(lamp[0] + s * 0.6, lamp[1] + s * 0.45); ctx.lineTo(lamp[0] - s * 0.6, lamp[1] + s * 0.45); ctx.closePath(); ctx.fill(); ctx.restore();
  if (on > 0.01) {
    const fl = p(X, 0, Z); cone(ctx, lamp[0], lamp[1] + s * 0.45, fl[1], s * 1.1, p.px(Z, R * 1.6), c, 0.09 * on);
    bulb(ctx, lamp[0], lamp[1] + s * 0.42, s * 0.12, c, on); pool(ctx, p, X, Z, R, c, 0.3 * on);
  }
}

// ---------- 街道：两侧楼面 X=±hw，楼高 ht，从 Z=z1 排到 Z=z2 ----------
// winOn(side, floor, col) -> 0..1 窗户亮度；每扇窗位置可用 E.winPos 取到
function street(ctx, p, t, o = {}) {
  const { hw = 5, ht = 14, z1 = 1, z2 = 70, floors = 5, bay = 3.2, winOn = () => 0.15, wallC = [44, 34, 40], fog = [24, 20, 34], ground = [34, 28, 30], lamps = true } = o;
  sky(ctx, [10, 12, 26], [44, 40, 70], p(0, 0, z2)[1]);
  poly(ctx, p, [[-hw - 3, 0, z1], [hw + 3, 0, z1], [hw + 3, 0, z2], [-hw - 3, 0, z2]], ground);
  for (const s of [-1, 1]) {
    for (let Z = z2 - bay; Z >= z1; Z -= bay) {
      const c = fogC(mix(wallC, [0, 0, 0], (Math.floor(Z / bay) % 2) * 0.12), Z, p, fog, 50);
      poly(ctx, p, [[s * hw, 0, Z], [s * hw, ht, Z], [s * hw, ht, Z + bay], [s * hw, 0, Z + bay]], c);
      for (let fl = 0; fl < floors; fl++) {
        const col = Math.round(Z / bay), on = winOn(s, fl, col), y0 = 1.2 + fl * (ht - 1.5) / floors, wh = (ht - 1.5) / floors * 0.55;
        const z0 = Z + bay * 0.25, z1w = Z + bay * 0.75;
        const wc = fogC(mix([30, 34, 52], [255, 196, 120], on), Z, p, fog, 60);
        poly(ctx, p, [[s * hw, y0, z0], [s * hw, y0 + wh, z0], [s * hw, y0 + wh, z1w], [s * hw, y0, z1w]], wc);
        if (on > 0.05 && p.depth(Z) > 2.5) { const m = p(s * hw, y0 + wh / 2, (z0 + z1w) / 2); glow(ctx, m[0], m[1], Math.min(260, p.px(Z, 1.6)), WARM, 0.14 * on * clamp(1 - p.depth(Z) / 70, 0, 1)); }
      }
    }
  }
  if (lamps) for (let Z = z2 - 6; Z >= z1 + 2; Z -= 9) for (const s of [-1, 1]) {
    if (p.depth(Z) < 2.5) continue;
    const X = s * (hw - 0.6); seg(ctx, p, [X, 0, Z], [X, 4, Z], fogC([20, 18, 22], Z, p, fog), 1, Math.max(1, p.px(Z, 0.08)));
    const b = p(X, 4, Z); bulb(ctx, b[0], b[1], Math.max(2, p.px(Z, 0.1)), WARM, clamp(1.2 - p.depth(Z) / 60, 0.2, 1)); pool(ctx, p, X, Z, 2.2, WARM, 0.22);
  }
}
const winPos = (p, s, fl, col, o = {}) => { const { hw = 5, ht = 14, floors = 5, bay = 3.2 } = o; const Z = col * bay + bay / 2, y = 1.2 + fl * (ht - 1.5) / floors + (ht - 1.5) / floors * 0.27; return p(s * hw, y, Z); };

// ---------- 长桌：桌面 X∈[-tw,tw]，从 Z=z1 到 z2，高 0.75 ----------
function table(ctx, p, t, o = {}) {
  const { tw = 0.85, z1 = 1.6, z2 = 26, cloth = CLOTH, light = 1, plates = true, candles = true, candleOn = () => 1 } = o;
  const top = 0.76;
  poly(ctx, p, [[-tw, top, z1], [tw, top, z1], [tw, top, z2], [-tw, top, z2]], mix(cloth, [40, 26, 22], 0.25 + 0.5 * (1 - light)));
  poly(ctx, p, [[-tw, top, z1], [tw, top, z1], [tw, 0.35, z1], [-tw, 0.35, z1]], mix(cloth, [30, 20, 18], 0.35 + 0.5 * (1 - light)));
  // 桌布中线的暖光（被蜡烛照着）
  for (let Z = z1 + 0.8; Z < z2; Z += 1.8) {
    if (plates) for (const s of [-1, 1]) { const q = p(s * tw * 0.55, top + 0.005, Z), r = p.px(Z, 0.17); ctx.save(); ctx.fillStyle = rgba(mix([250, 246, 236], [40, 30, 26], clamp(p.depth(Z) / 40, 0, 0.7))); ctx.translate(q[0], q[1]); ctx.scale(1, clamp(p.h / p.depth(Z), 0.12, 0.5)); ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.fill(); ctx.restore(); }
    if (candles) { const on = candleOn(Z), b = p(0, top, Z), c = p(0, top + 0.22, Z), w = Math.max(1.5, p.px(Z, 0.035)); ctx.fillStyle = 'rgb(240,232,214)'; ctx.fillRect(b[0] - w / 2, c[1], w, b[1] - c[1]); bulb(ctx, c[0], c[1] - w, w * 0.7, CANDLE, on * clamp(1.3 - p.depth(Z) / 30, 0.25, 1)); }
  }
}

module.exports = { WARM, WARM2, CANDLE, NIGHT, NIGHT2, PLUM, WOOD, WALL, CLOTH, cam3, poly, seg, fogC, hero3, folk3, contact, lit, pool, cone, bulb, bulbs, bokeh, rain, vignetteWarm, sky, room, window3, pendant, street, winPos, table };
