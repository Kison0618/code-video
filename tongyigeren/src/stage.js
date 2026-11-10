// 舞台：镜头、纸片投影、离屏图层、“换一张纸”的几种动作。全部直接画在 1920×1080 上，没有低分辨率中转
'use strict';
const SCENES = [];                       // 每个场景：{name, t0: 开始时间, draw(ctx, t)}
const CAM0 = { z: 1, x: W / 2, y: H / 2 };
const camMix = (a, b, k) => ({ z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
function toScreen(cam, x, y) { const z = cam ? cam.z : 1, cx = cam ? cam.x : W / 2, cy = cam ? cam.y : H / 2; return [(x - cx) * z + W / 2, (y - cy) * z + H / 2]; }
function camApply(ctx, cam) { cam = cam || CAM0; const z = cam.z; ctx.setTransform(z, 0, 0, z, W / 2 - cam.x * z, H / 2 - cam.y * z); ctx._z = z; }
function camReset(ctx) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx._z = 1; }

// 纸片的投影：光从左上来。k = 离背景多高（0 = 贴着，1 = 正常，2 = 被拿起来了）
function shOn(ctx, k) { k = k === undefined ? 1 : k; const z = ctx._z || 1; ctx.shadowColor = `rgba(24,14,8,${Math.min(.5, .3 + .06 * k)})`; ctx.shadowBlur = 16 * z * k; ctx.shadowOffsetX = 5 * z * k; ctx.shadowOffsetY = 9 * z * k; }
function shOff(ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; }
function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); }
function circ(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
const fs = (c, col, a) => { c.fillStyle = css(col, a); };
const lite = (c, k) => mixc(c, [255, 252, 244], k), dark = (c, k) => mixc(c, [26, 18, 14], k);

// 离屏图层（整屏大小）。0 号留给 swap 用，场景自己用 1 以后的
const Layer = (() => {
  const pool = [];
  return { get(i) { if (!pool[i]) { const c = document.createElement('canvas'); c.width = W; c.height = H; pool[i] = c.getContext('2d'); } const x = pool[i]; x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over'; x.filter = 'none'; shOff(x); x.clearRect(0, 0, W, H); x._z = 1; return x; } };
})();
function toLayer(i, ctx, fn) { const L = Layer.get(i); L.setTransform(ctx.getTransform()); L._z = ctx._z; fn(L); return L.canvas; }
function blit(ctx, canvas, a) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); shOff(ctx); ctx.globalAlpha *= (a === undefined ? 1 : a); ctx.drawImage(canvas, 0, 0); ctx.restore(); }

// 换一张纸。v 是普通值，或者 {__x:1, a, b, k, mode}（从 a 换到 b，进度 k）
// cfg.mode：flipX 绕竖轴翻面 / flipY 绕横轴翻面 / roll 从上往下卷起再放下 / pop 缩回去再弹出来 / wipe 从左到右刷过去 / fade 慢慢渗过去
function swap(ctx, v, cfg, fn) {
  if (!(v && v.__x)) return fn(ctx, v);
  const k = v.k, mode = v.mode === 'fade' ? 'fade' : (cfg.mode || 'flipX');
  if (k <= 0.001) return fn(ctx, v.a); if (k >= 0.999) return fn(ctx, v.b);
  if (mode === 'fade') {                                 // 先让 b 渗出来，再让 a 退掉，中间不会透出背景
    blit(ctx, toLayer(0, ctx, c => fn(c, v.a)), Math.min(1, 2 * (1 - k)));
    blit(ctx, toLayer(0, ctx, c => fn(c, v.b)), Math.min(1, 2 * k)); return;
  }
  ctx.save();
  if (mode === 'wipe') {
    fn(ctx, v.a); const x0 = cfg.x0 === undefined ? -800 : cfg.x0, x1 = cfg.x1 === undefined ? W + 800 : cfg.x1, e = x0 + (x1 - x0) * E.io2(k);
    ctx.save(); ctx.beginPath(); ctx.rect(x0, -900, e - x0, 2900); ctx.clip(); fn(ctx, v.b); ctx.restore();
    fs(ctx, [255, 255, 255], .5 * Math.sin(Math.PI * k)); ctx.fillRect(e - 10, cfg.y0 === undefined ? -900 : cfg.y0, 10, cfg.y1 === undefined ? 2900 : cfg.y1 - cfg.y0);
  } else {
    const first = k < .5, u = first ? k * 2 : k * 2 - 1, px = cfg.x || 0, py = cfg.y || 0;
    let sx = 1, sy = 1;
    if (mode === 'flipX') sx = Math.max(.02, Math.abs(Math.cos(Math.PI * k)));
    else if (mode === 'flipY') sy = Math.max(.02, Math.abs(Math.cos(Math.PI * k)));
    else if (mode === 'roll') sy = Math.max(.03, first ? 1 - E.io(u) : E.io(u));
    else if (mode === 'pop') sx = sy = Math.max(.02, first ? 1 - E.in(u) : E.back(u));
    ctx.translate(px, py); ctx.scale(sx, sy); ctx.translate(-px, -py);
    fn(ctx, first ? v.a : v.b);
  }
  ctx.restore();
}
// 整屏淡入淡出（场景之间）：a = 盖多少
function veil(ctx, a, col) { if (a <= 0) return; ctx.save(); camReset(ctx); shOff(ctx); ctx.fillStyle = css(col || PAL.bg, sat(a)); ctx.fillRect(0, 0, W, H); ctx.restore(); }
const fadeIO = (t, t0, t1, d) => Math.max(1 - seg(t, t0, t0 + (d || .4)), seg(t, t1 - (d || .4), t1));
