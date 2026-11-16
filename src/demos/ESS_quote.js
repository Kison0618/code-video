'use strict';
// 网友原话：只上屏不念。读 lines.json 里的 quote 字段，在这句念完后的 quote_slot 里出现在画面上方
const fs = require('fs');
const X = require('./ehk');
const { K } = X;
const { W, clamp, smooth, easeOut, rgba } = K;
const LS = JSON.parse(fs.readFileSync((process.env.ESFJ_DATA || 'F:/AI/lianai/08_ESFJ/voice6').replace(/\/voice$/, '') + (process.env.ESFJ_DATA ? '/voice/lines.json' : '/lines.json'), 'utf8'));
const Q = LS.filter(o => o.quote).map(o => { const l = X.VT[o.id], sl = l.quote_slot || [l.end + 0.2, l.end + 0.2 + 1.7 * (o.quotes || 1)]; return { id: o.id, txt: o.quote, a: sl[0] - 0.15, b: sl[1] + 0.6 }; });
const MC = new K.Canvas(8, 8).getContext('2d');
function wrapZh(str, size, maxW) { const out = []; let cur = ''; for (const ch of str) { if (K.measure(MC, cur + ch, { size, weight: 500 }) > maxW && cur && !'，。、；：？！”）'.includes(ch)) { out.push(cur); cur = ch; } else cur += ch; } if (cur) out.push(cur); return out; }
function draw(ctx, t, o = {}) {
  const { y = 250 } = o;
  for (const q of Q) {
    if (t < q.a || t > q.b) continue;
    const a = Math.min(smooth((t - q.a) / 0.35), smooth((q.b - t) / 0.4)), dy = (1 - easeOut((t - q.a) / 0.6)) * 18;
    const lines = wrapZh(q.txt, 50, 820), h = 70 + lines.length * 72;
    ctx.save(); ctx.globalAlpha = a; ctx.translate(0, dy);
    const g = ctx.createLinearGradient(0, y - 40, 0, y + h + 40); g.addColorStop(0, 'rgba(8,6,12,0)'); g.addColorStop(0.2, 'rgba(8,6,12,0.62)'); g.addColorStop(0.8, 'rgba(8,6,12,0.62)'); g.addColorStop(1, 'rgba(8,6,12,0)');
    ctx.fillStyle = g; ctx.fillRect(0, y - 40, W, h + 80);
    K.text(ctx, '“', 116, y + 82, { size: 120, family: 'Latin', weight: 600, color: [240, 200, 130], alpha: 0.9 });
    lines.forEach((ln, i) => K.text(ctx, ln, 150, y + 70 + i * 72, { size: 50, weight: 500, color: [250, 244, 232], align: 'left', spacing: 0.02 }));
    K.text(ctx, '—— 网友', W - 120, y + 70 + lines.length * 72 + 2, { size: 30, weight: 500, color: [200, 190, 176], align: 'right' });
    ctx.restore();
  }
}
module.exports = { draw, Q };
