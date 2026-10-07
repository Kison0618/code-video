// 歌词：读取 never/lyrics/we_never.lrc（标准 LRC：[mm:ss.xx]歌词）。没有这个文件时不显示歌词。
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('./core');
const { W, H, C, clamp, smooth, text, glow, measure } = K;

const FILE = path.join(__dirname, '..', '..', 'lyrics', 'we_never.lrc');
const OFFSET = 0; // 如果整体偏早或偏晚，在这里调（秒）
function parse(src) {
  const out = [];
  for (const raw of src.split(/\r?\n/)) {
    const tags = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const txt = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const m of tags) out.push({ t: +m[1] * 60 + +m[2] + OFFSET, text: txt });
  }
  out.sort((a, b) => a.t - b.t);
  // 每行显示到下一行开始（最长 7 秒），空行代表间奏
  return out.map((l, i) => ({ ...l, end: Math.min((out[i + 1] ? out[i + 1].t : l.t + 6), l.t + 7) })).filter(l => l.text);
}
const LINES = fs.existsSync(FILE) ? parse(fs.readFileSync(FILE, 'utf8')) : [];
const hasCJK = s => /[㐀-鿿]/.test(s);

// style: { y, size, color, align } 由当前场景决定
function draw(ctx, t, style = {}) {
  const { y = H - 150, size = 46, color = C.ivory, glowCol = C.gold, a: aScene = 1 } = style;
  for (const L of LINES) {
    if (t < L.t - 0.3 || t > L.end + 0.6) continue;
    const dur = L.end - L.t;
    const out = 1 - smooth((t - (L.end - 0.2)) / 0.6);
    const cjk = hasCJK(L.text);
    const units = cjk ? [...L.text] : L.text.split(' ');
    const o = { size: cjk ? size * 0.9 : size, family: cjk ? 'Song' : 'Garamond', style: cjk ? 'normal' : 'italic', weight: cjk ? 300 : 400, spacing: cjk ? 0.12 : 0 };
    const sep = cjk ? '' : ' ';
    const full = units.join(sep);
    const total = measure(ctx, full, o);
    let x = W / 2 - total / 2;
    // 逐词（逐字）浮现：在本行前 45% 的时间里依次出现
    units.forEach((u, i) => {
      const ti = L.t + (i / Math.max(1, units.length)) * Math.min(dur * 0.45, 2.2);
      const a = clamp((t - ti) / 0.45) * out * aScene;
      const w = measure(ctx, u + sep, o);
      if (a > 0) {
        const rise = (1 - smooth((t - ti) / 0.7)) * 14;
        text(ctx, u, x, y + rise, { ...o, color, alpha: a, align: 'left' });
      }
      x += w;
    });
    glow(ctx, W / 2, y - size * 0.35, total * 0.55 + 80, glowCol, 0.06 * out * aScene);
  }
}
module.exports = { draw, LINES };
