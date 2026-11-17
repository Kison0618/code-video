'use strict';
// 《ESFJ》v9 道具：都有体积（亮面/暗面/高光）和接触阴影，一眼能认出是什么。坐标 = 物件底部中心（除非注明）
const K = require('../core');
const S = require('./ESS_kit');
const { clamp, lerp, mix, rgba, hash, smooth } = K;
const glow = S.glow;
const shade = (c, k) => rgba(mix(c, k > 0 ? [255, 255, 255] : [10, 8, 16], Math.abs(k)));

// 热气：几缕柔软上升的白雾（不是线）
function steam(ctx, x, y, s, t, a = 1, n = 3) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) for (let k = 0; k < 7; k++) {
    const ph = ((t * 0.45 + i / n + k / 7) % 1), yy = y - ph * 150 * s, xx = x + (i - (n - 1) / 2) * 16 * s + Math.sin(ph * 6 + i * 2 + t) * 14 * s * ph;
    S.rgrad(ctx, xx, yy, (10 + ph * 30) * s, [[0, [255, 250, 244], 0.22 * a * Math.sin(Math.PI * ph)], [1, [255, 250, 244], 0]]);
  }
  ctx.restore();
}
function contact(ctx, x, y, rx, a = 0.45) { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.22); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, `rgba(10,6,12,${a})`); g.addColorStop(1, 'rgba(10,6,12,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, 6.2832); ctx.fill(); ctx.restore(); }
// 马克杯 / 保温杯杯盖：c 杯身颜色；hot 冒热气
function mug(ctx, x, y, s, t, o = {}) {
  const { c = [236, 120, 96], hot = 1, a = 1, rot = 0, label = '' } = o; if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  contact(ctx, 0, 0, 70, 0.4);
  ctx.lineWidth = 14; ctx.strokeStyle = shade(c, -0.25); ctx.beginPath(); ctx.ellipse(46, -58, 24, 30, 0, -1.4, 1.4); ctx.stroke();
  const g = ctx.createLinearGradient(-48, 0, 48, 0); g.addColorStop(0, shade(c, -0.35)); g.addColorStop(0.35, shade(c, 0.12)); g.addColorStop(0.55, rgba(c)); g.addColorStop(1, shade(c, -0.45));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-46, -112); ctx.lineTo(46, -112); ctx.lineTo(42, -6); ctx.quadraticCurveTo(0, 6, -42, -6); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(c, -0.5); ctx.beginPath(); ctx.ellipse(0, -112, 46, 11, 0, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgb(120,70,44)'; ctx.beginPath(); ctx.ellipse(0, -110, 40, 8, 0, 0, 6.2832); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-30, -100, 8, 80);
  if (label) K.text(ctx, label, 4, -48, { size: 30, weight: 700, color: shade(c, 0.75) === '' ? [255, 255, 255] : mix(c, [255, 255, 255], 0.8) });
  ctx.restore();
  if (hot > 0.01) steam(ctx, x, y - 120 * s, s, t, hot * a);
}
// 碗（有饭/汤）：fill 0 空 1 满
function bowl(ctx, x, y, s, t, o = {}) {
  const { c = [240, 236, 228], food = [250, 230, 190], fill = 1, hot = 1, a = 1, soup = false } = o; if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  contact(ctx, 0, 2, 110, 0.4);
  if (fill > 0.01) { const fy = lerp(-38, -86, fill); ctx.fillStyle = soup ? 'rgb(214,150,80)' : rgba(food); ctx.beginPath(); ctx.ellipse(0, fy + (soup ? 18 : 0), 92 * (soup ? 0.95 : 0.72 + 0.2 * fill), soup ? 18 : 30 * fill, 0, Math.PI, 0); if (!soup) ctx.fill(); else { ctx.ellipse(0, fy + 18, 90, 18, 0, 0, 6.2832); ctx.fill(); } if (!soup) { ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.ellipse(-50 + hash(k) * 100, fy - 6 - hash(k * 3) * 20 * fill, 9, 5, hash(k * 7), 0, 6.2832); ctx.fill(); } } }
  const g = ctx.createLinearGradient(-100, 0, 100, 0); g.addColorStop(0, shade(c, -0.3)); g.addColorStop(0.35, shade(c, 0.2)); g.addColorStop(1, shade(c, -0.4));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-100, -70); ctx.quadraticCurveTo(-92, 0, 0, 0); ctx.quadraticCurveTo(92, 0, 100, -70); ctx.quadraticCurveTo(0, -52, -100, -70); ctx.fill();
  ctx.strokeStyle = shade(c, 0.4); ctx.lineWidth = 5; ctx.beginPath(); ctx.ellipse(0, -70, 100, 16, 0, 0, Math.PI); ctx.stroke();
  ctx.fillStyle = 'rgba(220,90,80,0.5)'; ctx.fillRect(-80, -44, 160, 5);
  ctx.restore();
  if (hot > 0.01 && fill > 0.1) steam(ctx, x, y - 80 * s, s * 1.2, t, hot * a);
}
// 便当盒（打开/盖上）
function lunchbox(ctx, x, y, s, o = {}) {
  const { c = [96, 170, 160], lid = 0, a = 1, rot = 0 } = o; if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  contact(ctx, 0, 2, 130, 0.4);
  ctx.fillStyle = shade(c, -0.35); ctx.beginPath(); ctx.roundRect(-110, -60, 220, 60, 14); ctx.fill();
  ctx.fillStyle = shade(c, -0.1); ctx.beginPath(); ctx.roundRect(-110, -64, 220, 18, 8); ctx.fill();
  if (lid < 0.99) { // 里面：米饭、蛋、青菜、小番茄
    ctx.fillStyle = 'rgb(250,246,236)'; ctx.beginPath(); ctx.roundRect(-100, -86, 110, 30, 10); ctx.fill();
    ctx.fillStyle = 'rgb(255,214,90)'; ctx.beginPath(); ctx.ellipse(48, -78, 34, 14, 0, 0, 6.2832); ctx.fill();
    ctx.fillStyle = 'rgb(110,180,90)'; for (let k = 0; k < 4; k++) { ctx.beginPath(); ctx.ellipse(18 + k * 14, -66, 14, 8, k, 0, 6.2832); ctx.fill(); }
    ctx.fillStyle = 'rgb(236,70,60)'; ctx.beginPath(); ctx.arc(-70, -88, 11, 0, 6.2832); ctx.fill(); ctx.beginPath(); ctx.arc(-46, -90, 10, 0, 6.2832); ctx.fill();
  }
  if (lid > 0.01) { ctx.save(); ctx.translate(0, -66 - (1 - lid) * 120); ctx.rotate((1 - lid) * -0.4); const g = ctx.createLinearGradient(0, -30, 0, 6); g.addColorStop(0, shade(c, 0.35)); g.addColorStop(1, shade(c, -0.05)); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-114, -30, 228, 36, 14); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-90, -22, 120, 6); ctx.restore(); }
  ctx.restore();
}
// 围巾（搭在肩上 / 递出）：两端垂下的厚布条，格子纹
function scarf(ctx, x, y, s, t, o = {}) {
  const { c = [214, 70, 70], a = 1, sway = 0 } = o; if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s);
  const g = ctx.createLinearGradient(-80, 0, 80, 0); g.addColorStop(0, shade(c, -0.35)); g.addColorStop(0.5, rgba(c)); g.addColorStop(1, shade(c, -0.3));
  ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, 0, 80, 26, 0, 0, 6.2832); ctx.fill();
  for (const [dx, len, ph] of [[-30, 150, 0], [24, 120, 1.3]]) { const sw = Math.sin(t * 2 + ph) * 8 * sway; ctx.beginPath(); ctx.moveTo(dx - 22, 6); ctx.quadraticCurveTo(dx - 18 + sw, len * 0.6, dx - 20 + sw * 1.5, len); ctx.lineTo(dx + 20 + sw * 1.5, len); ctx.quadraticCurveTo(dx + 22 + sw, len * 0.6, dx + 22, 6); ctx.closePath(); ctx.fill();
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(255,240,220,0.18)'; for (let k = 0; k < 6; k++) ctx.fillRect(dx - 30, 20 + k * 24, 60, 6); ctx.restore();
    ctx.fillStyle = shade(c, 0.3); for (let k = 0; k < 5; k++) ctx.fillRect(dx - 18 + k * 9 + sw * 1.5, len, 4, 14); ctx.fillStyle = g; }
  ctx.restore();
}
// 购物袋（纸袋，冒出青菜、法棍）
function bag(ctx, x, y, s, o = {}) {
  const { a = 1, rot = 0, c = [214, 170, 120] } = o; if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  contact(ctx, 0, 2, 120, 0.4);
  ctx.fillStyle = 'rgb(110,180,90)'; for (let k = 0; k < 4; k++) { ctx.save(); ctx.translate(-30 + k * 16, -190); ctx.rotate(-0.3 + k * 0.2); ctx.beginPath(); ctx.ellipse(0, -40, 18, 50, 0, 0, 6.2832); ctx.fill(); ctx.restore(); }
  ctx.fillStyle = 'rgb(220,170,100)'; ctx.save(); ctx.translate(40, -200); ctx.rotate(0.35); ctx.beginPath(); ctx.roundRect(-16, -90, 32, 130, 16); ctx.fill(); ctx.restore();
  const g = ctx.createLinearGradient(-90, 0, 90, 0); g.addColorStop(0, shade(c, -0.25)); g.addColorStop(0.6, shade(c, 0.1)); g.addColorStop(1, shade(c, -0.35));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-80, -200); ctx.lineTo(80, -200); ctx.lineTo(90, 0); ctx.lineTo(-90, 0); ctx.closePath(); ctx.fill();
  ctx.fillStyle = shade(c, -0.15); ctx.beginPath(); ctx.moveTo(-80, -200); ctx.lineTo(80, -200); ctx.lineTo(70, -180); ctx.lineTo(-70, -180); ctx.fill();
  ctx.restore();
}
// 手机：屏幕亮着，o.draw(ctx, w, h) 画屏幕内容
function phone(ctx, x, y, s, o = {}) {
  const { a = 1, rot = 0, on = 1, draw = null, w = 200, h = 400 } = o; if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  if (on > 0.01) S.add(ctx, () => glow(ctx, 0, 0, w * 1.8, [190, 220, 255], 0.25 * on));
  ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 10;
  ctx.fillStyle = 'rgb(28,30,40)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 26); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.save(); ctx.beginPath(); ctx.roundRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20, 18); ctx.clip();
  ctx.fillStyle = rgba(mix([20, 22, 30], [240, 244, 250], on)); ctx.fillRect(-w / 2, -h / 2, w, h);
  if (draw && on > 0.01) { ctx.globalAlpha *= on; ctx.translate(-w / 2 + 10, -h / 2 + 10); draw(ctx, w - 20, h - 20); }
  ctx.restore(); ctx.restore();
}
// 消息气泡（手机里 / 角色说话），自动宽
function chat(ctx, str, x, y, o = {}) {
  const { size = 34, c = [255, 255, 255], ink = [40, 40, 50], a = 1, right = false, tail = true } = o; if (a <= 0.003) return;
  const w = K.measure(ctx, str, { size, weight: 600 }) + size * 1.2, h = size * 1.8;
  ctx.save(); ctx.globalAlpha *= a; ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.roundRect(right ? x - w : x, y - h / 2, w, h, h / 2); ctx.fill(); ctx.shadowColor = 'transparent';
  if (tail) { ctx.beginPath(); const tx = right ? x - 18 : x + 18; ctx.moveTo(tx, y + h / 2 - 6); ctx.lineTo(tx + (right ? 14 : -14), y + h / 2 + 12); ctx.lineTo(tx + (right ? -14 : 14), y + h / 2 - 4); ctx.fill(); }
  K.text(ctx, str, right ? x - w / 2 : x + w / 2, y + size * 0.36, { size, weight: 600, color: ink });
  ctx.restore();
}
// 角色头顶的话（大号，带尾巴指向说话人）
function say(ctx, str, x, y, o = {}) {
  const { size = 48, a = 1, tx = x - 40, ty = y + 90, c = [252, 250, 244], ink = [44, 40, 46] } = o; if (a <= 0.003) return;
  const w = K.measure(ctx, str, { size, weight: 600, spacing: 0.04 }) + size * 1.3, h = size * 1.9, sc = 0.85 + 0.15 * smooth(a);
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8;
  ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 26 + (tx - x) * 0.25, y + h / 2 - 4); ctx.lineTo(tx, ty); ctx.lineTo(x + 26 + (tx - x) * 0.25, y + h / 2 - 4); ctx.fill(); ctx.shadowColor = 'transparent';
  K.text(ctx, str, x, y + size * 0.36, { size, weight: 600, spacing: 0.04, color: ink });
  ctx.restore();
}
// 蜡烛：len 0-1 烧剩多少
function candle(ctx, x, y, s, t, o = {}) {
  const { len = 1, a = 1, lit = 1 } = o; if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); const h = 30 + 110 * len;
  contact(ctx, 0, 2, 50, 0.4);
  ctx.fillStyle = 'rgb(200,180,150)'; ctx.beginPath(); ctx.ellipse(0, -2, 40, 9, 0, 0, 6.2832); ctx.fill();
  const g = ctx.createLinearGradient(-18, 0, 18, 0); g.addColorStop(0, 'rgb(220,206,180)'); g.addColorStop(0.4, 'rgb(255,250,236)'); g.addColorStop(1, 'rgb(190,176,150)'); ctx.fillStyle = g; ctx.fillRect(-18, -h, 36, h);
  ctx.fillStyle = 'rgb(240,232,214)'; ctx.beginPath(); ctx.ellipse(0, -h, 18, 5, 0, 0, 6.2832); ctx.fill();
  if (lit > 0.01) { const fl = 1 + 0.06 * Math.sin(t * 11) + 0.04 * Math.sin(t * 17); ctx.save(); ctx.translate(0, -h - 4); ctx.scale(fl, 1 / fl);
    S.add(ctx, () => { glow(ctx, 0, -18, 220 * lit, [255, 180, 100], 0.4 * lit); glow(ctx, 0, -18, 60, [255, 230, 170], 0.8 * lit); });
    ctx.fillStyle = `rgba(255,190,90,${lit})`; ctx.beginPath(); ctx.moveTo(0, -46); ctx.quadraticCurveTo(13, -14, 0, 0); ctx.quadraticCurveTo(-13, -14, 0, -46); ctx.fill(); ctx.fillStyle = `rgba(255,250,220,${lit})`; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(6, -10, 0, -2); ctx.quadraticCurveTo(-6, -10, 0, -30); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
// 记事本（摊开，上面一行字）
function notebook(ctx, x, y, s, o = {}) {
  const { a = 1, rot = 0, lines = [], write = 1 } = o; if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s);
  ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 8; ctx.fillStyle = 'rgb(120,70,60)'; ctx.beginPath(); ctx.roundRect(-176, -124, 352, 248, 12); ctx.fill(); ctx.shadowColor = 'transparent';
  for (const sd of [-1, 1]) { const g = ctx.createLinearGradient(0, 0, sd * 170, 0); g.addColorStop(0, 'rgb(214,204,186)'); g.addColorStop(0.15, 'rgb(252,248,238)'); g.addColorStop(1, 'rgb(240,232,214)'); ctx.fillStyle = g; ctx.fillRect(sd < 0 ? -168 : 0, -116, 168, 232); }
  ctx.fillStyle = 'rgba(110,140,200,0.25)'; for (let k = 0; k < 7; k++) { ctx.fillRect(-160, -84 + k * 28, 150, 2); ctx.fillRect(10, -84 + k * 28, 150, 2); }
  lines.forEach((ln, i) => { const u = clamp(write * lines.length - i); if (u <= 0) return; if (ln[0] === '═') { ctx.strokeStyle = 'rgb(214,70,70)'; ctx.lineWidth = 5; ctx.lineCap = 'round'; for (let k = 0; k < 2; k++) { ctx.beginPath(); ctx.moveTo(14, -48 + i * 60 + k * 12); ctx.lineTo(14 + 150 * clamp(u * 2 - k), -48 + i * 60 + k * 12 + (k ? 2 : -2)); ctx.stroke(); } return; } const n = [...ln].length, m = Math.round(n * u); K.text(ctx, [...ln].slice(0, m).join(''), 14, -56 + i * 60, { size: 40, family: 'ESSans', weight: 700, color: [50, 50, 90], align: 'left' }); });
  ctx.restore();
}
module.exports = { steam, contact, mug, bowl, lunchbox, scarf, bag, phone, chat, say, candle, notebook };
