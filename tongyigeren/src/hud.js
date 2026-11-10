// 字：字幕、纸签、编号牌、大字。字不发光、不抖，只做淡入和轻微位移
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
  ctx.shadowColor = 'rgba(16,10,6,.85)'; ctx.shadowBlur = px * .3; ctx.shadowOffsetY = 3;
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
  const gr = ctx.createLinearGradient(0, 900, 0, H); gr.addColorStop(0, 'rgba(18,11,7,0)'); gr.addColorStop(.55, `rgba(18,11,7,${.4 * a})`); gr.addColorStop(1, `rgba(18,11,7,${.62 * a})`);
  ctx.fillStyle = gr; ctx.fillRect(0, 900, W, H - 900);
}

const HUD = {
  // 纸签：米色的小纸条，深色字。o = {a, px, align, tone: 'paper' | 'gold' | 'hot' | 'dark', rot, serif}
  label(ctx, x, y, text, o) {
    o = o || {}; const a = o.a === undefined ? 1 : o.a; if (a <= 0.01) return 0;
    const px = o.px || 34, tone = o.tone || 'paper';
    const bg = tone === 'gold' ? PAL.gold : tone === 'hot' ? PAL.hot : tone === 'dark' ? C('#241b16') : PAL.paper, fg = tone === 'dark' || tone === 'hot' ? PAL.ink : PAL.inkD;
    ctx.save(); ctx.globalAlpha = sat(a); ctx.font = o.serif ? FONT.serif(px, 900) : o.mono ? FONT.mono(px, 700) : FONT.sans(px); ctx.textBaseline = 'middle';
    const tw = ctx.measureText(text).width, pad = px * .5, w = tw + pad * 2, h = px * 1.62, bx = o.align === 'center' ? -w / 2 : o.align === 'right' ? -w : 0;
    ctx.translate(x, y + (1 - E.out(sat(a))) * 10); ctx.rotate(o.rot || 0);
    shOn(ctx, .8); ctx.fillStyle = css(bg); ctx.beginPath(); ctx.roundRect(bx, -h / 2, w, h, 6); ctx.fill(); shOff(ctx);
    ctx.fillStyle = css(fg); ctx.textAlign = 'left'; ctx.fillText(text, bx + pad, 2);
    ctx.restore(); return w;
  },
  // 不带底的字（压在画面上，带一点阴影）
  text(ctx, x, y, text, o) {
    o = o || {}; const a = o.a === undefined ? 1 : o.a; if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = sat(a); ctx.font = o.mono ? FONT.mono(o.px || 30, o.w || 700) : o.serif ? FONT.serif(o.px || 30, o.w || 700) : FONT.sans(o.px || 30); ctx.textBaseline = 'middle'; ctx.textAlign = o.align || 'left';
    ctx.shadowColor = 'rgba(20,12,8,.7)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 2; ctx.fillStyle = css(o.col || PAL.ink); ctx.fillText(text, x, y); ctx.restore();
  },
  // 圆形编号牌
  badge(ctx, x, y, n, a, o) {
    if (a <= 0.01) return; o = o || {}; const r = (o.r || 26) * (.6 + .4 * E.back(sat(a)));
    ctx.save(); ctx.globalAlpha = sat(a * 1.5); shOn(ctx, .8); ctx.fillStyle = css(o.col || PAL.gold); ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); shOff(ctx);
    ctx.fillStyle = css(PAL.inkD); ctx.font = FONT.mono(r * 1.15, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), x, y + 2); ctx.restore();
  },
  // 四个角的取景框，k = 展开程度
  bracket(ctx, x, y, w, h, k, o) {
    o = o || {}; if (k <= 0) return; const col = o.col || PAL.gold, L = Math.min(o.len || 30, w / 2, h / 2) * E.out(k), lw = o.lw || 6;
    ctx.save(); ctx.globalAlpha = (o.a === undefined ? 1 : o.a) * sat(k * 2); ctx.strokeStyle = css(col); ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.shadowColor = 'rgba(20,12,8,.45)'; ctx.shadowBlur = 8; ctx.shadowOffsetY = 3;
    const ex = (1 - E.out(k)) * 16; x -= ex; y -= ex; w += ex * 2; h += ex * 2;
    for (const [px, py, sx, sy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) { ctx.beginPath(); ctx.moveTo(px + sx * L, py); ctx.lineTo(px, py); ctx.lineTo(px, py + sy * L); ctx.stroke(); }
    ctx.restore();
  },
  line(ctx, x0, y0, x1, y1, k, o) {
    o = o || {}; if (k <= 0) return; ctx.save(); ctx.globalAlpha = o.a === undefined ? .9 : o.a; ctx.strokeStyle = css(o.col || PAL.ink); ctx.lineWidth = o.lw || 3; ctx.lineCap = 'round';
    if (o.dash) ctx.setLineDash(o.dash);
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(lerp(x0, x1, E.out(k)), lerp(y0, y1, E.out(k))); ctx.stroke(); ctx.restore();
  },
  // 居中的大字
  big(ctx, text, x, y, px, o) {
    o = o || {}; const a = o.a === undefined ? 1 : o.a; if (a <= 0.01) return;
    drawRuns(ctx, typeof text === 'string' ? parseRuns(text) : text, x, y, px, { alpha: a, weight: o.w || 900, hl: o.hl, left: o.left });
  },
  cite(ctx, text, a) { if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = a * .8; ctx.font = FONT.mono(24, 500); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 8; ctx.fillStyle = css(PAL.ink); ctx.fillText(text, W - 60, 56); ctx.restore(); },
};

// “那个晚上”的记忆卡片：一张小纸卡，上面九道横线代表九个词。s = 缩放
function drawMemCard(ctx, x, y, s, a) {
  if (a <= 0.01) return;
  const w = 250 * s, h = 150 * s;
  ctx.save(); ctx.globalAlpha = sat(a); ctx.translate(x, y); ctx.rotate(-.03);
  shOn(ctx, 1); ctx.fillStyle = css(PAL.paper); ctx.beginPath(); ctx.roundRect(0, 0, w, h, 8 * s); ctx.fill(); shOff(ctx);
  ctx.fillStyle = css(PAL.gold); ctx.beginPath(); ctx.roundRect(0, 0, w, 14 * s, [8 * s, 8 * s, 0, 0]); ctx.fill();
  ctx.font = FONT.sans(27 * s); ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillStyle = css(PAL.inkD); ctx.fillText('那个晚上', 18 * s, 44 * s);
  ctx.font = FONT.mono(23 * s, 700); ctx.textAlign = 'right'; ctx.fillStyle = css(PAL.goldDeep); ctx.fillText('9 个词', w - 16 * s, 44 * s);
  const ws = [1, 2, 2, 2, 2, 2, 2, 2, 2]; let k = 0;
  for (let r = 0; r < 2; r++) { let bx = 18 * s; for (let c = 0; c < (r ? 4 : 5); c++, k++) { const bw = (ws[k] === 1 ? 20 : 38) * s; ctx.fillStyle = css(PAL.inkD, .7); ctx.beginPath(); ctx.roundRect(bx, (76 + r * 32) * s, bw, 14 * s, 4 * s); ctx.fill(); bx += bw + 9 * s; } }
  ctx.restore();
}
