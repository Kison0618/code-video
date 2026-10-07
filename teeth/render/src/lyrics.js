// 歌词层（中英双语）。读取：
//   teeth/lyrics/teeth.lrc      原文（标准 LRC：[mm:ss.xx]歌词）
//   teeth/lyrics/teeth.zh.lrc   中文翻译（可选，时间轴与原文对应）
// 也可以只放一个 teeth.lrc：同一时间戳下的英文行和中文行（网易云导出的"原文+翻译"格式）会自动配对，
// 或者一行里写成 "English / 中文"。没有文件时不显示歌词。
'use strict';
const fs = require('fs');
const path = require('path');
const K = require('./core');
const { W, H, C, rgba, clamp, smooth, text, glow, measure } = K;
const A = require('./audio');

const DIR = path.join(__dirname, '..', '..', 'lyrics');
const OFFSET = 0; // 整体偏早或偏晚时在这里调（秒，正数 = 推迟）
const hasCJK = s => /[㐀-鿿]/.test(s);

function parse(file) {
  if (!fs.existsSync(file)) return [];
  const out = [];
  for (const raw of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const tags = [...raw.matchAll(/\[(\d+):(\d+(?:\.\d+)?)\]/g)];
    const txt = raw.replace(/\[[^\]]*\]/g, '').trim();
    for (const m of tags) out.push({ t: +m[1] * 60 + +m[2] + OFFSET, text: txt });
  }
  return out.sort((a, b) => a.t - b.t);
}
function build() {
  const src = parse(path.join(DIR, 'teeth.lrc')), zh = parse(path.join(DIR, 'teeth.zh.lrc'));
  const lines = [];
  for (const e of src) {
    let en = e.text, cn = '';
    if (en.includes(' / ')) { const [a, b] = en.split(' / '); en = a.trim(); cn = b.trim(); }
    const prev = lines[lines.length - 1];
    if (prev && Math.abs(prev.t - e.t) < 0.06) {           // 同一时间戳：一行英文一行中文
      if (hasCJK(en)) prev.cn = prev.cn || en; else prev.en = prev.en || en;
      continue;
    }
    if (hasCJK(en) && !cn) { cn = en; en = ''; }
    lines.push({ t: e.t, en, cn });
  }
  for (const z of zh) {
    let best = null, bd = 0.4;
    for (const L of lines) { const d = Math.abs(L.t - z.t); if (d < bd) { bd = d; best = L; } }
    if (best && !best.cn) best.cn = z.text;
  }
  return lines.map((l, i) => ({ ...l, end: Math.min(lines[i + 1] ? lines[i + 1].t : l.t + 6, l.t + 7) })).filter(l => l.en || l.cn);
}
const LINES = build();

// style: { y, size, color, accent, a } 由当前场景决定
function draw(ctx, t, style = {}) {
  const { y = H - 150, size = 44, color = C.bone, accent = C.magenta, a: aScene = 1 } = style;
  if (aScene <= 0) return;
  const hit = A.hit(t, 9);
  for (const L of LINES) {
    if (t < L.t - 0.2 || t > L.end + 0.5) continue;
    const dur = L.end - L.t;
    const out = 1 - smooth((t - (L.end - 0.15)) / 0.5);
    // 英文：大写衬线，逐词"咬"进来（从略大缩回原位，0.14 秒）
    if (L.en) {
      const words = L.en.toUpperCase().split(/\s+/);
      const o = { size, family: 'Cinzel', weight: 600, spacing: 0.08 };
      const total = measure(ctx, words.join(' '), o);
      let x = W / 2 - total / 2;
      const spread = Math.min(dur * 0.55, 2.4);
      glow(ctx, W / 2, y - size * 0.35, total * 0.5 + 90, accent, (0.07 + 0.08 * hit) * out * aScene);
      words.forEach((w, i) => {
        const ti = L.t + (i / Math.max(1, words.length)) * spread;
        const k = clamp((t - ti) / 0.14);
        const a = k * out * aScene;
        const ww = measure(ctx, w + ' ', o);
        if (a > 0) {
          const s = 1 + 0.25 * (1 - smooth(k));
          const cx = x + measure(ctx, w, o) / 2;
          ctx.save(); ctx.translate(cx, y - size * 0.35); ctx.scale(s, s); ctx.translate(-cx, -(y - size * 0.35));
          text(ctx, w, x, y, { ...o, color, alpha: a, align: 'left' });
          ctx.restore();
        }
        x += ww;
      });
    }
    // 中文：在英文下面，整行柔和地浮现
    if (L.cn) {
      const a = smooth((t - L.t - 0.15) / 0.5) * out * aScene;
      text(ctx, L.cn, W / 2, y + (L.en ? size * 1.05 : 0), { family: 'Song', size: L.en ? size * 0.56 : size * 0.8, weight: 400, spacing: 0.18, color: L.en ? accent : color, alpha: a * (L.en ? 0.9 : 1) });
    }
  }
}
module.exports = { draw, LINES };
