'use strict';
// 网友原话：只上屏不念。读 lines.json 里的 quote 字段，在这句念完后的 quote_slot 里出现在画面上方
const fs = require('fs');
const X = require('./ehk');
const { K } = X;
const { W, clamp, smooth, easeOut, rgba } = K;
const LS = JSON.parse(fs.readFileSync((process.env.ESFJ_DATA || 'F:/AI/lianai/08_ESFJ/voice6').replace(/\/voice$/, '') + (process.env.ESFJ_DATA ? '/voice/lines.json' : '/lines.json'), 'utf8'));
const Q = LS.filter(o => o.quote).map(o => { const l = X.VT[o.id], sl = l.quote_slot || [l.end + 0.2, l.end + 0.2 + 1.7 * (o.quotes || 1)]; return { id: o.id, txt: o.quote, a: sl[0] - 0.15, b: sl[1] + 0.6 }; });
const MC = new K.Canvas(8, 8).getContext('2d');
require('./ESS_type');
function wrapZh(str, size, maxW) { const out = []; let cur = ''; for (const ch of str) { if (K.measure(MC, cur + ch, { size, family: 'ESSans', weight: 500 }) > maxW && cur && !'，。、；：？！”）'.includes(ch)) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out; }
function draw(ctx, t, o = {}) {
  const { y = 250 } = o;
  for (const q of Q) {
    if (t < q.a || t > q.b) continue;
    const a = Math.min(smooth((t - q.a) / 0.35), smooth((q.b - t) / 0.4)), dy = (1 - easeOut((t - q.a) / 0.6)) * 18;
    const lines = wrapZh(q.txt, 50, 780), h = 64 + lines.length * 74, x0 = 70, w = W - 140, e = easeOut((t - q.a) / 0.7);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(-(1 - e) * 60, dy);
    // 网友原话：深色磨砂卡片 + 左侧金条 + 大引号；字是思源黑（白），卡片从左边滑进来
    ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12;
    ctx.fillStyle = 'rgba(16,12,22,0.78)'; ctx.beginPath(); ctx.roundRect(x0, y - 20, w, h + 20, 28); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,214,150,0.28)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = 'rgb(240,190,110)'; ctx.beginPath(); ctx.roundRect(x0 + 22, y + 10, 10, h - 40, 5); ctx.fill();
    K.text(ctx, '“', x0 + w - 70, y + 96, { size: 150, family: 'Latin', weight: 600, color: [240, 190, 110], alpha: 0.35 });
    lines.forEach((ln, i) => { const li = smooth((t - q.a - 0.15 - i * 0.18) / 0.4); K.text(ctx, ln, x0 + 62, y + 62 + i * 74 + (1 - li) * 14, { size: 50, family: 'ESSans', weight: 500, color: [252, 246, 236], align: 'left', spacing: 0.02, alpha: li }); });
    ctx.restore();
  }
}
module.exports = { draw, Q };
