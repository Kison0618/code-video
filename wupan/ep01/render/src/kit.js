// 014–036 共用小零件：镜头切换、撕边照片、纸条标签、印章、价签、手写字、½→2 变形、小人图标、天平、滚动数字、星星、首饰
'use strict';
const K = require('./core');
const { W, H, Canvas, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const P = require('./paper');
const CUT = require('./cutout');

const INK = '#231b15', RED = '#c8321f', GREEN = '#3d8a3a', PAPER = '#fbf6ea';

// —— 镜头：list = [{a: 起点秒, draw(ctx,t), tr: 'slide'|'fade'|'cut'|'up'}]，按 a 排好序 ——
// 新镜头盖在旧镜头上；盖满以后不再画旧的
const TR = 0.45;
const SHEET = P.poly(P.jag([[0, -60], [W + 160, -60], [W + 160, H + 60], [0, H + 60]], 8, 22, 172));
const SHEET_V = P.poly(P.jag([[-60, 0], [W + 60, 0], [W + 60, H + 160], [-60, H + 160]], 8, 22, 173));
function shots(ctx, t, list) {
  let i = -1;
  for (let k = 0; k < list.length; k++) if (t >= list[k].a) i = k;
  if (i < 0) return -1;
  const s = list[i], e = prog(t, s.a, s.a + (s.d || TR));
  if (e < 1 && i > 0) list[i - 1].draw(ctx, t);
  const tr = i === 0 ? 'cut' : s.tr || 'slide';
  ctx.save();
  if (tr === 'slide' && e < 1) {
    const q = easeInOut(e); ctx.translate((1 - q) * (W + 80), 0);
    P.piece(ctx, SHEET, P.BG, { blur: 34, dx: -16, dy: 0, color: 'rgba(50,28,8,0.45)' });
  } else if (tr === 'up' && e < 1) {
    const q = easeInOut(e); ctx.translate(0, (1 - q) * (H + 80));
    P.piece(ctx, SHEET_V, P.BG, { blur: 34, dx: 0, dy: -16, color: 'rgba(50,28,8,0.45)' });
  } else if (tr === 'fade' && e < 1) {
    ctx.globalAlpha = smooth(e); ctx.fillStyle = P.BG; ctx.fillRect(0, 0, W, H);
  } else if (e < 1 || tr === 'cut') { ctx.fillStyle = P.BG; ctx.fillRect(0, 0, W, H); }
  else { ctx.fillStyle = P.BG; ctx.fillRect(0, 0, W, H); }
  s.draw(ctx, t);
  ctx.restore();
  return i;
}

// —— 照片：缩到最长边 1800 后缓存 ——
const PHC = new Map();
function photo(name) {
  if (PHC.has(name)) return PHC.get(name);
  const im = CUT.load(require('path').join(CUT.ASSETS, name + '.png'));
  const s = Math.min(1, 1800 / Math.max(im.width, im.height));
  const cv = new Canvas(Math.round(im.width * s), Math.round(im.height * s)); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height);
  const b = P.bitmap(cv); PHC.set(name, b); return b;
}
// 撕边照片：中心 (x,y)，宽高 w×h；src = [u0,v0,u1,v1] 取原图哪一块（比例，默认按 w:h 居中裁）
const PATHS = new Map();
function tornPath(w, h, seed) {
  const k = `${w | 0}x${h | 0}_${seed}`;
  if (!PATHS.has(k)) PATHS.set(k, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 6, 18, seed)));
  return PATHS.get(k);
}
function photoCard(ctx, name, x, y, w, h, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.01) return;
  const img = photo(name);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot); if (o.scale) ctx.scale(o.scale, o.scale);
  const bd = o.border == null ? 14 : o.border;
  P.piece(ctx, tornPath(w + bd * 2, h + bd * 2, (o.seed || 5) + 1), '#f7f0e0', { blur: 22, dy: 10 });
  const inner = tornPath(w, h, o.seed || 5);
  ctx.save(); ctx.clip(inner);
  let [u0, v0, u1, v1] = o.src || [0, 0, 1, 1];
  if (!o.src) { const ar = w / h, iar = img.width / img.height; if (iar > ar) { const d = (1 - ar / iar) / 2; u0 = d; u1 = 1 - d; } else { const d = (1 - iar / ar) / 2; v0 = d; v1 = 1 - d; } }
  const z = o.zoom || 1, cu = o.focus ? o.focus[0] : (u0 + u1) / 2, cv = o.focus ? o.focus[1] : (v0 + v1) / 2;
  u0 = cu + (u0 - cu) / z; u1 = cu + (u1 - cu) / z; v0 = cv + (v0 - cv) / z; v1 = cv + (v1 - cv) / z;
  ctx.drawImage(img, u0 * img.width, v0 * img.height, (u1 - u0) * img.width, (v1 - v0) * img.height, -w / 2, -h / 2, w, h);
  if (o.dim) { ctx.fillStyle = `rgba(30,20,12,${o.dim})`; ctx.fillRect(-w / 2, -h / 2, w, h); }
  if (o.sepia !== false) { ctx.fillStyle = 'rgba(150,100,40,0.08)'; ctx.fillRect(-w / 2, -h / 2, w, h); }
  if (o.inner) o.inner(ctx, w, h);
  ctx.restore();
  ctx.restore();
}

// —— 纸条标签：中心 (x,y)；pop 0..1 ——
function label(ctx, x, y, text, o = {}) {
  const pop = o.pop == null ? 1 : o.pop;
  if (pop <= 0.01) return;
  const size = o.size || 60, fam = o.font || 'Sans', wt = o.weight || 700;
  ctx.save();
  ctx.font = `${wt} ${size}px ${fam}`;
  const tw = ctx.measureText(text).width, w = tw + size * 0.9, h = size * 1.55;
  const sc = 0.6 + 0.4 * pop + Math.sin(clamp(pop) * Math.PI) * 0.08;
  ctx.globalAlpha *= clamp(pop * 1.6) * (o.alpha == null ? 1 : o.alpha);
  ctx.translate(x, y); ctx.rotate(o.rot == null ? -0.02 : o.rot); ctx.scale(sc, sc);
  const k = `lab_${w | 0}_${o.seed || 3}`;
  if (!PATHS.has(k)) PATHS.set(k, P.poly(P.jag([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], 2, 14, o.seed || 3)));
  P.piece(ctx, PATHS.get(k), o.bg || PAPER, { blur: 12, dy: 6 });
  ctx.fillStyle = o.color || INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(text, 0, size * 0.04);
  ctx.restore();
  return w;
}
// 人名：版画底下一条深色纸条
const nameTag = (ctx, x, y, text, pop) => label(ctx, x, y, text, { pop, size: 56, bg: INK, color: '#fbf3df', font: 'Serif', weight: 700, rot: -0.025, seed: 9 });

// —— 印章：中心 (x,y)，p 0..1（从大到小砸下）——
function stamp(ctx, x, y, text, p, o = {}) {
  if (p <= 0.01) return;
  const size = o.size || 84, col = o.color || RED;
  ctx.save();
  ctx.font = `900 ${size}px ${o.font || 'Sans'}`;
  const tw = ctx.measureText(text).width, w = tw + size * 0.8, h = size * 1.5;
  const q = easeIn(clamp(p * 1.4)), sc = lerp(1.9, 1, q) + (p > 0.72 ? Math.sin((p - 0.72) / 0.28 * Math.PI) * 0.05 : 0);
  ctx.globalAlpha *= clamp(p * 2.2) * 0.92;
  ctx.translate(x, y); ctx.rotate(o.rot == null ? -0.12 : o.rot); ctx.scale(sc, sc);
  ctx.strokeStyle = col; ctx.lineWidth = size * 0.1; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, size * 0.14); ctx.stroke();
  ctx.lineWidth = size * 0.035; ctx.beginPath(); ctx.roundRect(-w / 2 + size * 0.14, -h / 2 + size * 0.14, w - size * 0.28, h - size * 0.28, size * 0.08); ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.05);
  // 印泥斑驳：随机挖掉一些小点
  ctx.globalCompositeOperation = 'destination-out';
  const r = K.mulberry32(o.seed || 11);
  for (let n = 0; n < 50; n++) { ctx.beginPath(); ctx.arc((r() - 0.5) * w, (r() - 0.5) * h, 1 + r() * 4, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fill(); }
  ctx.restore();
}

// —— 吊牌价签：挂点 (x,y)，text；flip 0..1（翻面换字 text2）——
function priceTag(ctx, x, y, text, o = {}) {
  const a = o.alpha == null ? 1 : o.alpha;
  if (a <= 0.01) return;
  const s = o.s || 1, flip = o.flip || 0, txt = flip > 0.5 && o.text2 ? o.text2 : text;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  ctx.strokeStyle = '#8a6a44'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-20, 30, 0, 60); ctx.stroke();
  ctx.translate(0, 60); ctx.rotate((o.rot || 0) + Math.sin((o.t || 0) * 2 + (o.seed || 0)) * 0.03);
  ctx.scale(Math.max(0.02, Math.abs(Math.cos(flip * Math.PI))), 1);
  const w = 200, h = 108;
  const tag = new (require('skia-canvas').Path2D)();
  tag.moveTo(-w / 2 + 30, 0); tag.lineTo(w / 2 - 30, 0); tag.lineTo(w / 2, 30); tag.lineTo(w / 2, h); tag.lineTo(-w / 2, h); tag.lineTo(-w / 2, 30); tag.closePath();
  ctx.shadowColor = 'rgba(50,28,8,0.4)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 6;
  ctx.fillStyle = o.bg || '#fff8e8'; ctx.fill(tag); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#b89a6a'; ctx.lineWidth = 2.5; ctx.stroke(tag);
  ctx.beginPath(); ctx.arc(0, 18, 7, 0, Math.PI * 2); ctx.fillStyle = '#c9b48c'; ctx.fill();
  ctx.fillStyle = o.color || INK; ctx.font = `700 ${o.size || 62}px Num`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(txt, 0, 68);
  if (o.strike > 0.01) { ctx.strokeStyle = RED; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-80, 80); ctx.lineTo(-80 + 160 * easeOut(o.strike), 52); ctx.stroke(); }
  ctx.restore();
}

// —— 手写：一个字一个字地写出来（每个字用从左到右的擦除露出），字歪歪扭扭 ——
//   n = 已写的字数（可以是小数），返回最后一个字后面的 x
function write(ctx, str, x, y, size, n, o = {}) {
  const chars = [...str], r = K.mulberry32(o.seed || 31), sl = o.sloppy == null ? 1 : o.sloppy;
  ctx.save(); ctx.font = `${o.weight || 400} ${size}px ${o.font || 'Kai'}`; ctx.fillStyle = o.color || '#1d2a4a'; ctx.textBaseline = 'alphabetic';
  let cx = x;
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i], w = ctx.measureText(ch).width, rot = (r() - 0.5) * 0.24 * sl, dy = (r() - 0.5) * size * 0.16 * sl, sc = 1 + (r() - 0.4) * 0.22 * sl;
    const p = clamp(n - i);
    if (p > 0) {
      ctx.save(); ctx.translate(cx + w / 2, y + dy); ctx.rotate(rot); ctx.scale(sc, sc);
      if (p < 1) { ctx.beginPath(); ctx.rect(-w / 2 - 4, -size * 1.1, (w + 8) * p, size * 1.5); ctx.clip(); }
      ctx.fillText(ch, -w / 2, 0);
      ctx.restore();
    }
    cx += w * (0.92 + 0.12 * r() * sl) + (o.spacing || 0);
  }
  ctx.restore();
  return cx;
}

// —— ½ 和 2：三笔，逐点插值变形 ——
const N = 40;
function resample(pts) {
  const d = [0]; for (let i = 1; i < pts.length; i++) d.push(d[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = d[d.length - 1], out = [];
  for (let k = 0; k < N; k++) { const s = L * k / (N - 1); let j = 1; while (j < d.length - 1 && d[j] < s) j++; const u = (s - d[j - 1]) / (d[j] - d[j - 1] || 1); out.push([lerp(pts[j - 1][0], pts[j][0], u), lerp(pts[j - 1][1], pts[j][1], u)]); }
  return out;
}
const bez = (a, b, c, n = 12) => { const o = []; for (let i = 0; i <= n; i++) { const u = i / n; o.push([(1 - u) * (1 - u) * a[0] + 2 * u * (1 - u) * b[0] + u * u * c[0], (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * b[1] + u * u * c[1]]); } return o; };
const HALF = [
  [[0.08, 0.13], [0.22, 0.02], [0.22, 0.44]],                                        // 1
  [[0.74, 0.0], [0.22, 1.0]],                                                         // 斜杠
  [...bez([0.52, 0.64], [0.62, 0.48], [0.76, 0.58]), ...bez([0.8, 0.66], [0.66, 0.86], [0.5, 0.98]).slice(1), [0.86, 0.97]], // 小 2
].map(resample);
const TWO = [
  [...bez([0.12, 0.26], [0.2, 0.0], [0.5, 0.02]), ...bez([0.5, 0.02], [0.86, 0.06], [0.76, 0.38]).slice(1)],
  [[0.76, 0.38], [0.14, 0.96]],
  [[0.14, 0.96], [0.9, 0.96]],
].map(resample);
// m 0..1 变形；p 0..1 写了多少（三笔依次写）；(x,y) 左上角，s 字高
function halfToTwo(ctx, x, y, s, m, p = 1, o = {}) {
  const e = easeInOut(m);
  ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = o.color || '#1d2a4a'; ctx.lineWidth = s * (o.w || 0.075);
  if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = s * 0.12; }
  for (let k = 0; k < 3; k++) {
    const pk = clamp(p * 3 - k); if (pk <= 0) break;
    const pts = HALF[k].map((a, i) => [lerp(a[0], TWO[k][i][0], e) * s * 0.78, lerp(a[1], TWO[k][i][1], e) * s]);
    const q = K.partial(pts, pk);
    if (q.length < 2) continue;
    ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const pt of q.slice(1)) ctx.lineTo(pt[0], pt[1]); ctx.stroke();
  }
  ctx.restore();
}

// —— 小人图标：脚底 (x,y)，高 h；walk 走路相位（null 站着）——
function person(ctx, x, y, h, col = '#5a4a3c', walk = null, o = {}) {
  const u = h / 10;
  ctx.save(); ctx.translate(x, y); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineCap = 'round';
  const sw = walk == null ? 0 : Math.sin(walk) * 0.45, bob = walk == null ? 0 : Math.abs(Math.cos(walk)) * u * 0.25;
  ctx.translate(0, -bob);
  ctx.lineWidth = u * 1.25;
  ctx.beginPath(); ctx.moveTo(-u * 0.55, -u * 4.6); ctx.lineTo(-u * 0.55 + Math.sin(sw) * u * 4.2, -u * 4.6 + Math.cos(sw) * u * 4.2 - u * 0.1);
  ctx.moveTo(u * 0.55, -u * 4.6); ctx.lineTo(u * 0.55 - Math.sin(sw) * u * 4.2, -u * 4.6 + Math.cos(sw) * u * 4.2 - u * 0.1); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-u * 1.5, -u * 8, u * 3, u * 3.9, u * 1.1); ctx.fill();
  ctx.lineWidth = u * 0.95;
  ctx.beginPath(); ctx.moveTo(-u * 1.35, -u * 7.4); ctx.lineTo(-u * 1.35 - Math.sin(-sw) * u * 3, -u * 7.4 + Math.cos(sw) * u * 3); ctx.moveTo(u * 1.35, -u * 7.4); ctx.lineTo(u * 1.35 - Math.sin(sw) * u * 3, -u * 7.4 + Math.cos(sw) * u * 3); ctx.stroke();
  ctx.beginPath(); ctx.arc(0, -u * 9.1, u * 1.05, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// —— 天平：支点底座在 (x,y)，s 缩放，tilt 弧度（>0 右边沉），left/right(ctx, 盘中心x, 盘面y)——
function balance(ctx, x, y, s, tilt, left, right, o = {}) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); if (o.alpha != null) ctx.globalAlpha *= o.alpha;
  const col = o.color || '#6b4a2a', hi = '#b98a4e';
  ctx.shadowColor = 'rgba(50,28,8,0.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 8;
  ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-110, 0); ctx.lineTo(110, 0); ctx.lineTo(60, -34); ctx.lineTo(-60, -34); ctx.closePath(); ctx.fill();
  ctx.fillRect(-12, -400, 24, 380);
  ctx.beginPath(); ctx.arc(0, -410, 26, 0, Math.PI * 2); ctx.fillStyle = hi; ctx.fill();
  ctx.shadowColor = 'transparent';
  const L = 330, py = -410;
  const ends = [-1, 1].map(d => [d * L * Math.cos(tilt), py + d * L * Math.sin(tilt)]);
  ctx.strokeStyle = col; ctx.lineWidth = 20; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(ends[0][0], ends[0][1]); ctx.lineTo(ends[1][0], ends[1][1]); ctx.stroke();
  ends.forEach(([ex, ey], i) => {
    const pan = ey + 230;
    ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(ex - 120, pan); ctx.moveTo(ex, ey); ctx.lineTo(ex + 120, pan); ctx.stroke();
    ctx.fillStyle = hi; ctx.beginPath(); ctx.ellipse(ex, pan, 140, 26, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = col; ctx.fillRect(ex - 142, pan - 6, 284, 10);
    const f = i ? right : left; if (f) f(ctx, ex, pan - 6);
  });
  ctx.restore();
}

// —— 滚动数字：v 可以是小数（里程表那样滚）。右对齐到 x ——
function roll(ctx, v, x, y, size, o = {}) {
  const digits = o.digits || Math.max(1, String(Math.floor(Math.max(v, 0))).length);
  ctx.save(); ctx.font = `700 ${size}px ${o.font || 'Num'}`; ctx.fillStyle = o.color || INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const dw = ctx.measureText('0').width * 1.02, lh = size * 1.1;
  const suf = o.suffix || '';
  const sw = suf ? ctx.measureText(suf).width : 0;
  let cx = x - sw - dw / 2;
  if (suf) { ctx.textAlign = 'left'; ctx.fillText(suf, x - sw, y); ctx.textAlign = 'center'; }
  ctx.save(); ctx.beginPath(); ctx.rect(x - sw - dw * digits - 4, y - lh / 2, dw * digits + 4, lh); ctx.clip();
  for (let k = 0; k < digits; k++) {
    const pw = Math.pow(10, k), d = v / pw, dig = Math.floor(d) % 10;
    let fr = k === 0 ? d - Math.floor(d) : Math.max(0, (v % pw) - (pw - 1));
    if (v < pw && k > 0 && fr === 0) { cx -= dw; continue; }           // 不画前导 0
    ctx.fillText(String(dig), cx, y - fr * lh);
    ctx.fillText(String((dig + 1) % 10), cx, y + (1 - fr) * lh);
    cx -= dw;
  }
  ctx.restore(); ctx.restore();
}

function star(ctx, x, y, r, on) {
  ctx.save(); ctx.translate(x, y); const s = 1 + Math.sin(clamp(on) * Math.PI) * 0.25; ctx.scale(s, s);
  ctx.beginPath();
  for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, rr = k % 2 ? r * 0.45 : r; k ? ctx.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : ctx.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); }
  ctx.closePath();
  if (on > 0.5) { ctx.shadowColor = 'rgba(255,190,40,0.8)'; ctx.shadowBlur = 20; }
  ctx.fillStyle = on > 0.5 ? '#f2b62c' : 'rgba(120,100,80,0.25)'; ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.strokeStyle = on > 0.5 ? '#a36d10' : 'rgba(120,100,80,0.5)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}

// 绿松石首饰（画的）：戒指 / 吊坠，中心 (x,y)，r 半径
function jewel(ctx, x, y, r, seed = 1, kind = 0) {
  const rnd = K.mulberry32(seed);
  ctx.save(); ctx.translate(x, y); ctx.rotate((rnd() - 0.5) * 0.4);
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = r * 0.3; ctx.shadowOffsetY = r * 0.12;
  if (kind === 0) { ctx.strokeStyle = '#c9ccd0'; ctx.lineWidth = r * 0.22; ctx.beginPath(); ctx.ellipse(0, r * 0.55, r * 0.8, r * 0.5, 0, 0, Math.PI * 2); ctx.stroke(); }
  else { ctx.strokeStyle = '#c9ccd0'; ctx.lineWidth = r * 0.12; ctx.beginPath(); ctx.moveTo(-r * 1.2, -r * 1.6); ctx.quadraticCurveTo(0, -r * 0.6, r * 1.2, -r * 1.6); ctx.stroke(); }
  ctx.shadowColor = 'transparent';
  const g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, '#eef0f2'); g.addColorStop(1, '#8d9399');
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.82, r * 0.62, 0, 0, Math.PI * 2); ctx.fill();
  const tg = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.05, 0, 0, r * 0.65); tg.addColorStop(0, '#7fe0d4'); tg.addColorStop(1, '#1f8f88');
  ctx.fillStyle = tg; ctx.beginPath(); ctx.ellipse(0, 0, r * 0.64, r * 0.46, 0, 0, Math.PI * 2); ctx.fill();
  ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(70,45,25,0.6)'; ctx.lineWidth = r * 0.04;
  for (let n = 0; n < 5; n++) { ctx.beginPath(); let px = (rnd() - 0.5) * r * 1.2, py = (rnd() - 0.5) * r; ctx.moveTo(px, py); for (let m = 0; m < 3; m++) { px += (rnd() - 0.5) * r * 0.6; py += (rnd() - 0.5) * r * 0.5; ctx.lineTo(px, py); } ctx.stroke(); }
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(-r * 0.22, -r * 0.18, r * 0.16, r * 0.08, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// 大问号 / 叹号（手写感）
function mark(ctx, x, y, s, ch, a = 1, col = '#7a6a5a') {
  if (a <= 0.01) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.font = `900 ${s}px Serif`; ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(50,28,8,0.3)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 5; ctx.fillText(ch, x, y); ctx.restore();
}
// 箭头（手绘），从 a 到 b，p 画到哪
function arrow(ctx, a, b, p, col = RED, w = 10, bend = 0.25) {
  if (p <= 0.01) return;
  const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
  const pts = bez(a, [mx, my], b, 30), q = K.partial(pts, easeOut(p));
  ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const pt of q.slice(1)) ctx.lineTo(pt[0], pt[1]); ctx.stroke();
  if (p > 0.85) { const e = q[q.length - 1], f = q[Math.max(0, q.length - 4)], ang = Math.atan2(e[1] - f[1], e[0] - f[0]); ctx.translate(e[0], e[1]); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(w * 1.2, 0); ctx.lineTo(-w * 2.6, -w * 2.2); ctx.lineTo(-w * 2.6, w * 2.2); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}
// 弹出缩放
const pop = (t, a, d = 0.35) => easeOut(prog(t, a, a + d));
function popScale(ctx, x, y, p, f) {
  if (p <= 0.01) return;
  ctx.save(); ctx.translate(x, y); const s = 0.6 + 0.4 * p + Math.sin(clamp(p) * Math.PI) * 0.08; ctx.scale(s, s); ctx.globalAlpha *= clamp(p * 1.6); f(ctx); ctx.restore();
}

module.exports = { INK, RED, GREEN, PAPER, shots, photo, photoCard, label, nameTag, stamp, priceTag, write, halfToTwo, person, balance, roll, star, jewel, mark, arrow, pop, popScale, bez };
