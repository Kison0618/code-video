// 画在木板上面的清晰文字：字幕、小标签、角标、数字。字不发光、不抖，只做淡入和轻微位移
'use strict';
const SUB = { y: 1000, px: 60 };
// 这些句子不走普通字幕（画面里已经用别的方式把字打出来了）
const SUB_MODE = { e2: 'none', g4: 'none', i9: 'none', i10: 'none', b6: 'list' };
const SUB_COLOR = { a2: 'hot', b3: 'hot', b5: 'hot', b13: 'hot', d2: 'hot', d3: 'hot', d5: 'hot', g4: 'hot', g7: 'hot', g10: 'hot', g12: 'hot', g15: 'hot', g17: 'hot', h18: 'hot', i4: 'hot', a1: 'hot', b8: 'hot' };

function parseRuns(text) {                                 // "会骗你{两次}" → [{s:'会骗你'},{s:'两次',hl:1}]
  const out = []; let m, re = /\{([^}]*)\}|([^{}]+)/g;
  while ((m = re.exec(text))) out.push(m[1] !== undefined ? { s: m[1], hl: 1 } : { s: m[2] });
  return out;
}
function drawRuns(ctx, runs, cx, y, px, o) {
  o = o || {}; ctx.font = FONT.serif(px, o.weight || 700); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  const widths = runs.map(r => ctx.measureText(r.s).width), tw = widths.reduce((a, b) => a + b, 0);
  let x = o.left ? cx : cx - tw / 2;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = px * .28; ctx.shadowOffsetY = 2;
  for (let i = 0; i < runs.length; i++) {
    const r = runs[i];
    ctx.globalAlpha = (o.alpha === undefined ? 1 : o.alpha) * (r.a === undefined ? 1 : r.a);
    ctx.fillStyle = css(r.col || (r.hl ? mixc(PAL.ink, o.hl || PAL.gold, r.k === undefined ? 1 : r.k) : PAL.ink));
    ctx.fillText(r.s, x, y); ctx.fillText(r.s, x, y);       // 画两遍，阴影更实，压得住亮背景
    x += widths[i];
  }
  ctx.restore();
  return tw;
}
function drawSubtitle(ctx, t) {
  const L = TL.lines; let i = TL.idx(t); if (i < 0) return;
  const ln = L[i], s = TL.s(ln.id), e = TL.e(ln.id), next = i + 1 < L.length ? TL.s(L[i + 1].id) : 1e9;
  const out = Math.min(next - .04, e + .7), mode = SUB_MODE[ln.id];
  if (t > out || mode === 'none') return;
  const a = Math.min(seg(t, s - .02, s + .14), 1 - seg(t, out - .12, out)), dy = (1 - E.out(seg(t, s, s + .22))) * 10;
  // 字幕底下垫一条暗带，亮画面上也看得清
  const hl = SUB_COLOR[ln.id] === 'hot' ? PAL.hot : PAL.gold;
  let runs = parseRuns(ln.text);
  if (mode === 'list') {                                   // 一个词一个词出现：墙、窗帘、被子……
    const words = ln.text.split('、'); runs = [];
    words.forEach((w, k) => { const tk = TL.at(ln.id, w), on = seg(t, tk - .03, tk + .12), cur = k === words.length - 1 || t < TL.at(ln.id, words[k + 1]); runs.push({ s: w, a: on, col: cur ? PAL.gold : PAL.ink }); if (k < words.length - 1) runs.push({ s: '、', a: on * .6 }); });
  } else runs.forEach(r => { if (r.hl) { const tk = TL.at(ln.id, r.s.replace(/[“”，。？]/g, '')); r.k = seg(t, tk - .05, tk + .12); } });
  drawRuns(ctx, runs, W / 2, SUB.y + dy, SUB.px, { alpha: a, hl });
}
function subBand(ctx, a) {
  const gr = ctx.createLinearGradient(0, 860, 0, H); gr.addColorStop(0, 'rgba(4,5,9,0)'); gr.addColorStop(.6, `rgba(4,5,9,${.62 * a})`); gr.addColorStop(1, `rgba(4,5,9,${.8 * a})`);
  ctx.fillStyle = gr; ctx.fillRect(0, 860, W, H - 860);
}

const HUD = {
  // 小标签：一行字，可带一条细线引到 (ax,ay)
  tag(ctx, x, y, text, o) {
    o = o || {}; const a = o.a === undefined ? 1 : o.a; if (a <= 0.01) return 0;
    const px = o.px || 30, col = o.col || PAL.ink;
    ctx.save(); ctx.globalAlpha = a; ctx.font = o.mono ? FONT.mono(px, o.w) : o.serif ? FONT.serif(px, o.w) : FONT.sans(px); ctx.textBaseline = 'middle'; ctx.textAlign = o.align || 'left';
    const tw = ctx.measureText(text).width, pad = o.pad === undefined ? 14 : o.pad, h = px + 16, bx = o.align === 'center' ? x - tw / 2 - pad : o.align === 'right' ? x - tw - pad : x - pad;
    if (o.box !== false) { ctx.fillStyle = o.fill || 'rgba(6,7,12,.78)'; ctx.fillRect(bx, y - h / 2, tw + pad * 2, h); ctx.fillStyle = css(o.line || col, .9); ctx.fillRect(bx, y - h / 2, 3, h); }
    else { ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 10; }
    ctx.fillStyle = css(col); ctx.fillText(text, x, y + 1);
    ctx.restore(); return tw;
  },
  // 四个角的取景框，k = 展开程度
  bracket(ctx, x, y, w, h, k, o) {
    o = o || {}; if (k <= 0) return; const col = o.col || PAL.gold, L = Math.min(o.len || 26, w / 2, h / 2) * E.out(k), lw = o.lw || 4;
    ctx.save(); ctx.globalAlpha = (o.a === undefined ? 1 : o.a) * sat(k * 2); ctx.fillStyle = css(col);
    const ex = (1 - E.out(k)) * 14; x -= ex; y -= ex; w += ex * 2; h += ex * 2;
    for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { ctx.fillRect(sx > 0 ? px : px - L, sy > 0 ? py : py - lw, L, lw); ctx.fillRect(sx > 0 ? px : px - lw, sy > 0 ? py : py - L, lw, L); }
    if (o.frame) { ctx.globalAlpha *= o.frame; ctx.strokeStyle = css(col); ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h); }
    ctx.restore();
  },
  // 带编号的小方牌：① 墙
  numTag(ctx, x, y, n, text, a, o) {
    if (a <= 0.01) return; o = o || {};
    ctx.save(); ctx.globalAlpha = a; const s = 44;
    ctx.fillStyle = css(PAL.gold); ctx.fillRect(x, y, s, s);
    ctx.fillStyle = '#16120c'; ctx.font = FONT.mono(30, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), x + s / 2, y + s / 2 + 2);
    if (text) { ctx.font = FONT.sans(32); const tw = ctx.measureText(text).width; ctx.fillStyle = 'rgba(6,7,12,.84)'; ctx.fillRect(x + s, y, tw + 26, s); ctx.fillStyle = css(PAL.ink); ctx.textAlign = 'left'; ctx.fillText(text, x + s + 13, y + s / 2 + 2); }
    ctx.restore();
  },
  // 角标：左上角一行小字（章节）
  corner(ctx, t) {
    const idx = TL.idx(t); if (idx < 0) return;
    const ch = TL.lines[idx].ch, list = [...new Set(TL.lines.map(l => l.ch))], n = list.indexOf(ch) + 1;
    let first = idx; while (first > 0 && TL.lines[first - 1].ch === ch) first--;
    const t0 = TL.s(TL.lines[first].id), a = seg(t, t0, t0 + .5) * .92;
    ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 8;
    const x = 64 - (1 - E.out(seg(t, t0, t0 + .5))) * 14, y = 66;
    ctx.fillStyle = css(PAL.gold); ctx.font = FONT.mono(30, 700); ctx.textAlign = 'left'; ctx.fillText(String(n).padStart(2, '0'), x, y + 1);
    ctx.fillStyle = css(PAL.ink, .6); ctx.fillRect(x + 52, y - 1, 30, 3);
    ctx.fillStyle = css(PAL.ink); ctx.font = FONT.sans(32); ctx.fillText(ch, x + 96, y + 1);
    ctx.restore();
  },
  // 大数字 + 小字说明（右上角）
  counter(ctx, x, y, label, value, o) {
    o = o || {}; const a = o.a === undefined ? 1 : o.a; if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = 12;
    ctx.fillStyle = css(PAL.ink, .86); ctx.font = FONT.sans(28); ctx.fillText(label, x, y);
    ctx.fillStyle = css(o.col || PAL.gold); ctx.font = FONT.mono(o.px || 92, 700); ctx.fillText(String(value), x + 4, y + (o.px || 92) + 4);
    ctx.restore();
  },
  line(ctx, x0, y0, x1, y1, k, o) {
    o = o || {}; if (k <= 0) return; ctx.save(); ctx.globalAlpha = o.a === undefined ? .9 : o.a; ctx.strokeStyle = css(o.col || PAL.ink); ctx.lineWidth = o.lw || 3;
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, E.out(k)), lerp(y0, y1, E.out(k))); ctx.stroke(); ctx.restore();
  },
  // 居中的大字（清晰的，不是木板拼的）
  big(ctx, text, x, y, px, o) {
    o = o || {}; const a = o.a === undefined ? 1 : o.a; if (a <= 0.01) return;
    drawRuns(ctx, typeof text === 'string' ? parseRuns(text) : text, x, y, px, { alpha: a, weight: o.w || 900, hl: o.hl, left: o.left });
  },
  cite(ctx, text, a) { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = a * .8; ctx.font = FONT.mono(24, 500); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 8; ctx.fillStyle = css(PAL.ink); ctx.fillText(text, W / 2, 1046); ctx.restore(); },
};
// 把世界坐标换成屏幕坐标（标签要贴着画面里的东西时用）
function toScreen(cam, x, y) { const z = cam ? cam.z : 1, cx = cam ? cam.x : W / 2, cy = cam ? cam.y : H / 2; return [(x - cx) * z + W / 2, (y - cy) * z + H / 2]; }
function camMix(a, b, k) { return { z: lerp(a.z, b.z, k), x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) }; }
const CAM0 = { z: 1, x: W / 2, y: H / 2 };

// “那个晚上”的小卡片：记词的时候收起来，后面再打开。s = 缩放
function drawMemCard(ctx, x, y, s, a, o) {
  if (a <= 0.01) return; o = o || {};
  const w = 250 * s, h = 150 * s;
  ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y);
  ctx.fillStyle = 'rgba(8,10,18,.9)'; ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = css(PAL.gold, .9); ctx.lineWidth = 3 * s; ctx.strokeRect(0, 0, w, h);
  ctx.fillStyle = css(PAL.gold); ctx.fillRect(0, 0, w, 8 * s);
  ctx.font = FONT.sans(28 * s); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = css(PAL.ink); ctx.fillText('那个晚上', 18 * s, 38 * s);
  ctx.font = FONT.mono(24 * s, 500); ctx.textAlign = 'right'; ctx.fillStyle = css(PAL.gold); ctx.fillText('9 个词', w - 16 * s, 38 * s);
  const ws = [1, 2, 2, 2, 2, 2, 2, 2, 2];                          // 九个词：一个字的短，两个字的长
  let k = 0; for (let r = 0; r < 2; r++) { let bx = 18 * s; for (let c = 0; c < (r ? 4 : 5); c++, k++) { const bw = (ws[k] === 1 ? 20 : 38) * s; ctx.fillStyle = css(PAL.ink, .82); ctx.fillRect(bx, (72 + r * 34) * s, bw, 16 * s); bx += bw + 9 * s; } }
  ctx.restore();
}
