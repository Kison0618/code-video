// main.js —《被剥夺超级反应》：字幕、大字、镜头、情绪调色、一帧
// 时间都是成片秒数（0–120）。配乐由用户本地挑选和合成，大节点见 README.md 的“卡点”表。
'use strict';
window.TOTAL = 120;
window.FONTS = ["900 40px 'Noto Serif SC'", "500 40px 'Noto Sans SC'", "500 40px 'JetBrains Mono'", "400 40px 'Ma Shan Zheng'"];

// ---------- 字幕（{r|} 红 = 失去 / 愤怒，{i|} 冰蓝 = 差一点 / 冷，{g|} 金 = 得到 / 松手） ----------
const SUBS = [
  [1.4, 4.1, '丢了一百块，你能难受一整天。'], [4.4, 7.2, '捡到一百块，开心五分钟就没了。'],
  [7.6, 10.0, '同样是一百块，失去的痛，'], [10.2, 13.2, '大约是得到的快乐的{r|两倍}。'],
  [13.8, 16.3, '你可能觉得，这不就是小气吗？'], [16.6, 19.2, '芒格说，没那么简单，他管这叫——'],
  [24.0, 26.8, '芒格家养过一只狗，性子很温顺。'], [27.0, 29.6, '可只要有人从它嘴里拿吃的，'], [29.8, 32.0, '它连{r|主人}都咬。'],
  [32.4, 36.0, '人被拿走东西的那一刻，和它没什么两样。'],
  [36.6, 39.4, '更折磨人的，是{i|差一点}就到手。'], [39.6, 42.6, '砍到 99.9%，只差最后 0.1%，'], [42.8, 45.6, '你又拉了二十个人帮你砍。'],
  [45.9, 48.4, '差一点到手，又落了空，'], [48.6, 51.8, '疼得就像{r|已经拥有过}，又被人抢走。'],
  [52.4, 54.6, '疼，还只是开始。'], [54.8, 57.8, '为了不失去，人什么都做得出来。'],
  [58.4, 61.2, '拍卖会上，你本来只想出一百。'], [61.4, 64.4, '别人一举牌，你就像被{r|抢走}了什么，'], [64.6, 67.0, '一口气喊到了四百。'],
  [67.4, 70.6, '巴菲特的办法很简单：{g|不去拍卖会}。'],
  [71.0, 74.2, '股票跌掉一半：“不卖就不算亏。”'], [74.4, 77.6, '一段早该结束的感情：“都七年了。”'],
  [77.8, 81.0, '到后来，你攥着它，只是不想承认{r|输了}。'],
  [87.8, 91.0, '芒格说过这样一个人：账户里有一千万，'], [91.2, 94.4, '钱包里丢了一百块，照样会气得不行。'], [94.6, 97.8, '他盯着近处的一百，忘了{g|真正要紧的}。'],
  [98.4, 101.0, '下次攥紧拳头之前，问自己一句：'], [101.2, 104.0, '如果它今天不在我手里，'], [104.2, 107.4, '我还愿意花这么大代价，去换它吗？'],
  [108.0, 111.6, '松开手，影子才会变回{g|你的大小}。'],
];
const SUBC = { '': [242, 238, 230], g: [252, 206, 118], i: [146, 204, 255], r: [255, 118, 100] };
function subtitles(t) {
  for (const [t0, t1, s] of SUBS) {
    if (t < t0 || t > t1 + .05) continue;
    const a = 1 - pr(t, t1 - .22, t1);
    textBlock(ctx, s, W / 2, V ? 1480 : 968, { size: V ? 66 : 60, font: FS.sans, weight: 500, ls: 1, t0, per: .04, fade: .22, t, a, shadow: true, rise: 4, maxW: V ? 920 : 1640, lh: V ? 88 : 76, color: k => SUBC[k] || SUBC[''] });
  }
}

// ---------- 大节点 ----------
const HIT_X2 = 10.6, HIT_TITLE = 19.4, HIT_SNAP = 29.8, HIT_400 = 65.0, HIT_HERO = 81.6, HIT_FREE = 108.2, END = 112.4;
const HITS = [[HIT_TITLE, 6, .28, .45], [HIT_SNAP, 5, .12, .3], [HIT_400, 5, .1, .3], [HIT_HERO, 3, 0, .4], [HIT_FREE, 0, .22, .6]];   // 大特效 5 次

// ---------- 镜头（世界坐标 [t, fx, fy, s]） ----------
const CAMH = [[0, 780, 540, 1.2], [7.4, 1000, 500, 1.04], [13.6, 980, 500, 1.0], [18.8, 900, 470, .94], [23.4, 920, 470, .96],
  [24.6, 1210, 560, 1.22], [31.4, 1210, 560, 1.3], [32.6, 1000, 520, 1.1], [36.2, 980, 520, 1.06],
  [37.4, 1080, 470, 1.0], [51.6, 1060, 480, 1.08], [57.8, 960, 520, 1.18],
  [58.6, 960, 470, .96], [66.8, 960, 470, 1.04], [70.6, 980, 500, 1.04], [77.6, 960, 520, 1.16], [81.4, 960, 440, .88], [87.4, 960, 440, .9],
  [88.0, 1040, 470, 1.0], [97.8, 1040, 480, 1.03], [98.6, 920, 540, 1.16], [107.6, 910, 540, 1.26], [111.6, 940, 470, 1.0], [120, 940, 460, .97]];
const CAMV = [[0, 900, 560, 1.15], [7.4, 960, 480, 1.0], [19.2, 960, 470, .98], [23.4, 960, 480, 1.0],
  [24.6, 940, 560, 1.12], [31.4, 940, 560, 1.18], [32.6, 940, 520, 1.05], [36.2, 940, 520, 1.0],
  [37.4, 960, 440, .98], [51.6, 960, 450, 1.0], [57.8, 930, 500, 1.1],
  [58.6, 960, 450, .92], [66.8, 960, 450, .96], [70.6, 960, 470, .98], [77.6, 930, 500, 1.08], [81.4, 940, 420, .8], [87.4, 940, 420, .82],
  [88.0, 960, 450, .98], [97.8, 960, 460, 1.0], [98.6, 920, 520, 1.1], [107.6, 910, 520, 1.18], [111.6, 930, 450, .95], [120, 930, 440, .92]];

// ---------- 情绪调色：整张画面跟着字幕变色 [t, 饱和度, 色调, 色调强度, 亮度] ----------
const TONE = { n: C.lamp, cold: [110, 160, 230], warm: [255, 196, 110], red: [220, 50, 40], gray: [150, 150, 150] };
const GRADE = [[0, 1, 'n', 0, 1], [1.8, 1, 'n', 0, 1], [2.4, .45, 'cold', .32, .9], [4.2, .45, 'cold', .32, .9], [4.6, 1, 'warm', .22, 1.05], [6.4, 1, 'warm', .14, 1], [7.4, .9, 'n', 0, 1],
  [10.4, .9, 'n', 0, 1], [10.8, 1, 'red', .2, 1], [13.4, 1, 'red', .12, 1], [13.8, 1, 'n', 0, 1], [19.2, 1, 'n', 0, 1], [19.6, 1, 'warm', .2, 1.05], [23.4, 1, 'warm', .1, 1],
  [24.2, .9, 'n', 0, 1], [29.6, .9, 'n', 0, 1], [29.9, 1, 'red', .32, 1], [32.0, 1, 'red', .22, .95], [33.6, 1, 'red', .1, 1], [34.2, 1, 'red', .3, .95], [36.2, 1, 'red', .15, 1],
  [36.8, .75, 'cold', .22, .95], [45.6, .7, 'cold', .25, .95], [46.2, .6, 'cold', .38, .88], [48.6, 1, 'red', .25, .92], [52.0, .7, 'red', .2, .85], [57.8, .6, 'red', .26, .82],
  [58.6, 1, 'n', 0, 1], [61.4, 1, 'red', .08, 1], [65.0, 1, 'red', .32, 1], [67.2, 1, 'red', .2, 1], [68.2, 1, 'warm', .18, 1.05], [70.6, 1, 'warm', .1, 1],
  [71.2, .35, 'gray', .1, .92], [74.2, .35, 'gray', .1, .9], [74.6, .5, 'cold', .3, .9], [77.6, .5, 'cold', .32, .88], [78.2, .7, 'red', .25, .85], [81.4, .4, 'red', .3, .78], [87.2, .4, 'red', .26, .8],
  [88.0, 1, 'n', 0, 1], [91.4, 1, 'n', 0, 1], [92.8, 1, 'red', .25, .95], [94.6, 1, 'red', .1, 1], [95.6, 1, 'warm', .14, 1.02], [97.8, 1, 'warm', .08, 1],
  [98.6, .85, 'n', 0, .95], [107.6, .8, 'n', 0, .92], [108.4, 1, 'warm', .2, 1.08], [111.0, 1, 'warm', .26, 1.08], [120, 1, 'warm', .2, 1]];
function gradeAt(t) {
  let i = 0; while (i < GRADE.length - 1 && t >= GRADE[i + 1][0]) i++;
  const a = GRADE[i], b = GRADE[Math.min(i + 1, GRADE.length - 1)], u = b[0] > a[0] ? eio(pr(t, a[0], b[0])) : 0;
  const ta = a[3] > 0 ? TONE[a[2]] : TONE[b[2]], tb = b[3] > 0 ? TONE[b[2]] : ta;
  return { sat: lerp(a[1], b[1], u), tone: mixC(ta, tb, u), amt: lerp(a[3], b[3], u), lum: lerp(a[4], b[4], u) };
}
function grade(t) {
  const g = gradeAt(t); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1;
  if (g.sat < .999) { ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${1 - g.sat})`; ctx.fillRect(0, 0, W, H); }
  if (g.amt > .001) { ctx.globalCompositeOperation = 'color'; ctx.fillStyle = rgba(g.tone, g.amt); ctx.fillRect(0, 0, W, H); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = rgba(g.tone, g.amt * .8); ctx.fillRect(0, 0, W, H); }
  if (g.lum < .999) { ctx.globalCompositeOperation = 'multiply'; const v = Math.round(255 * g.lum); ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(0, 0, W, H); }
  else if (g.lum > 1.001) { ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = rgba(C.lamp, (g.lum - 1) * 1.2); ctx.fillRect(0, 0, W, H); }
  ctx.globalCompositeOperation = 'source-over';
}

// ---------- 大字（调色之后画，保持干净） ----------
const GRR = () => [[255, 206, 190], [255, 110, 90], [176, 44, 36]];
function heroTexts(t) {
  const c = ctx;
  // ×2：计数器从 ×1.0 跑到 ×2.0
  if (t > HIT_X2 - .5 && t < 13.6) {
    const a = eo(pr(t, HIT_X2 - .5, HIT_X2 - .2)) * (1 - eio(pr(t, 13.1, 13.6))), u = eo(pr(t, HIT_X2 - .5, HIT_X2)), v = (1 + u).toFixed(1), s = 1 + .12 * Math.exp(-Math.max(0, t - HIT_X2) * 7);
    const y = V ? 330 : 150;
    c.save(); c.translate(W / 2, y); c.scale(s, s); drawChars(c, parse('×' + v), 0, 0, { size: V ? 200 : 210, font: FS.serif, weight: 900, ls: 4, t0: 0, per: 0, a, grad: GRR, shadow: true, rise: 0 }); c.restore();
    label(c, 'LOSS ÷ GAIN', '失去的痛 ÷ 得到的快乐', W / 2, y + (V ? 132 : 137), a * eo(pr(t, HIT_X2 + .2, HIT_X2 + .8)), C.red, 22);
    c.font = `500 24px ${FS.sans}`; c.textAlign = 'center'; c.fillStyle = rgba(C.silver, .55 * a * eo(pr(t, HIT_X2 + .6, HIT_X2 + 1.2)));
    c.fillText(V ? '不同实验里大约 1.5–2.5 倍，因人而异' : 'Kahneman & Tversky · 不同实验里大约 1.5–2.5 倍，因人而异', W / 2, y + (V ? 184 : 184)); c.textAlign = 'left';
  }
  // 片名：被剥夺超级反应
  if (t > HIT_TITLE - .1 && t < 23.8) {
    const a = 1 - eio(pr(t, 23.2, 23.8)), y = V ? 330 : 190;
    callig('被剥夺超级反应', W / 2, y, { size: V ? 118 : 150, t, t0: HIT_TITLE, a, col: mixC(C.gold, C.ember, .25), seal: '芒格' });
    const ua = a * eo(pr(t, HIT_TITLE + 1.3, HIT_TITLE + 2.1));
    label(c, V ? 'DEPRIVAL-SUPERREACTION' : 'DEPRIVAL-SUPERREACTION TENDENCY', '人类误判心理学 第 14 条', W / 2, y + (V ? 120 : 150), ua, C.gold, V ? 20 : 22);
  }
  // 卡片：不甘 / 舍不得
  if (t > 45.9 && t < 50.4) callig('不甘', V ? 150 : 250, V ? 520 : 360, { size: V ? 96 : 120, t, t0: 46.0, a: 1 - eio(pr(t, 49.8, 50.4)), col: C.ice, vert: true, seal: '失' });
  if (t > 74.6 && t < 80.8) callig('舍不得', V ? 150 : 240, V ? 560 : 400, { size: V ? 90 : 110, t, t0: 74.8, a: 1 - eio(pr(t, 80.2, 80.8)), col: mixC(C.ice, C.silver, .4), vert: true, seal: '攥' });
  if (t > 64.9 && t < 67.4) callig('抢', V ? 170 : 250, V ? 520 : 330, { size: V ? 130 : 170, t, t0: 65.0, a: 1 - eio(pr(t, 66.9, 67.4)), col: C.red });
  // 大字：真正让人输光的，往往是后面那些不想输的决定。
  if (t > HIT_HERO && t < 87.4) {
    const a = 1 - eio(pr(t, 86.8, 87.4)), o = { font: FS.serif, weight: 900, per: .06, fade: .35, t, a, shadow: true, rise: 8, grad: k => k === 'r' ? GRR() : GRAD_W() };
    if (V) { drawChars(c, parse('真正让人输光的，'), W / 2, 330, { ...o, size: 80, ls: 4, t0: HIT_HERO }); drawChars(c, parse('往往是后面那些'), W / 2, 450, { ...o, size: 80, ls: 4, t0: HIT_HERO + .9 }); drawChars(c, parse('{r|不想输}的决定。'), W / 2, 570, { ...o, size: 80, ls: 4, t0: HIT_HERO + 1.4 }); }
    else { drawChars(c, parse('真正让人输光的，'), W / 2, 170, { ...o, size: 84, ls: 6, t0: HIT_HERO }); drawChars(c, parse('往往是后面那些{r|不想输}的决定。'), W / 2, 290, { ...o, size: 84, ls: 6, t0: HIT_HERO + 1.0 }); }
  }
  // 片尾卡
  if (t > END) {
    const a = eo(pr(t, END, END + .5)) * (1 - eio(pr(t, window.TOTAL - .6, window.TOTAL))), y = V ? 760 : 430;
    callig('被剥夺超级反应', W / 2, y, { size: V ? 110 : 140, t, t0: END + .1, a, col: mixC(C.gold, C.ember, .25), seal: '芒格' });
    drawChars(c, parse('关注{g|依恋研究所}，接受最好的心理学内容'), W / 2, y + (V ? 150 : 170), { size: V ? 40 : 38, font: FS.sans, weight: 500, ls: 3, t0: END + 1.6, per: .03, fade: .5, t, a, shadow: true, rise: 8, color: k => k ? SUBC[k] : C.lamp });
  }
}

window.ALL_TEXT = [...SUBS.map(s => plain(s[2])), '×0123456789.%¥−+,', '被剥夺超级反应芒格不甘失舍不得攥抢', '真正让人输光的，往往是后面那些不想输的决定。',
  'LOSS ÷ GAIN 失去的痛 ÷ 得到的快乐 Kahneman & Tversky · 不同实验里大约 1.5–2.5 倍，因人而异', 'DEPRIVAL-SUPERREACTION TENDENCY 人类误判心理学 第 14 条', 'ALMOST 只差一点 OPEN-OUTCRY AUCTION 公开叫价 BROKERAGE ACCOUNT 账户',
  '关注依恋研究所，接受最好的心理学内容'];

// ---------- 一帧 ----------
window.render = function (t, frame = Math.round(t * 30)) {
  t = clamp(t, 0, window.TOTAL); PX.t = t;
  const k = keyCam(V ? CAMV : CAMH, t), hb = heart(t) * kv([[0, 0], [52, 0], [53, .5], [57.8, .6], [58.6, 0], [77.8, 0], [80, .7], [87.2, .7], [88, 0]], t);
  CAM = { fx: k[1], fy: k[2], s: k[3] };
  sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
  const bg = sx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, 'rgb(14,12,11)'); bg.addColorStop(.62, 'rgb(22,19,16)'); bg.addColorStop(1, 'rgb(7,6,6)');
  sx.fillStyle = bg; sx.fillRect(0, 0, W, H);
  camT(sx);
  const F = youFig(t), G = figGeom(F), hands = [(G.at('haN')[0] + G.at('haF')[0]) / 2, (G.at('haN')[1] + G.at('haF')[1]) / 2], o = orb(t, hands);
  wallLight(t, o, F);
  camT(sx); floorLine(sx, FY, 120, 1800, 1, 1); lampPool(sx, o.x, FY + 20, 520, .9 * Math.min(1, o.a));
  motes(t, 960, 420, 760, 380, 160, C.lamp, .9);
  wallGraphics(t);
  camT(sx); partner(t);
  if (F.a > .01) { drawFig(F); camT(sx); drawPaddle(sx, G, t); }
  camT(sx); drawOrb(sx, o, t);
  camT(sx); burst(sx, t, 110.6, o.x, o.y, { n: 120, seed: 901, col: C.gold, v0: 80, v1: 520, g: -30, life: 2.2 });
  if (t > 110.6) { PX.useM(sx); for (let i = 0; i < 90; i++) { const u = (t - 110.6) / (2 + 3 * rnd(i, 911)); if (u > 1) continue; const x = o.x + (rnd(i, 912) - .5) * 1400 * Math.sqrt(u), y = 120 - 260 * u + (rnd(i, 913) - .5) * 300; PX.pt(x, y, mixC(C.gold, C.white, rnd(i, 914) * .5), (1 - u) * Math.pow(.5 + .5 * Math.sin(t * 4 + i), 2) * 1.4, .6); } PX.flush(sx); }
  // 片头的黑、片尾卡时压暗
  sx.setTransform(1, 0, 0, 1, 0, 0); let d = eo(pr(t, .2, 1.2)) * (1 - .7 * eio(pr(t, END - .4, END + .6)));
  for (const h of [HIT_TITLE, HIT_HERO]) if (t > h - .45 && t < h + .3) d *= t < h ? 1 - eio(pr(t, h - .45, h - .1)) : eo(pr(t, h, h + .3));   // 大节点前先黑 0.45 秒
  if (d < 1) { sx.fillStyle = `rgba(0,0,0,${1 - d})`; sx.fillRect(0, 0, W, H); }
  bloom(); haze(t, .8);
  grade(t);
  flushWallText();
  let ck = 0, fl = 0; for (const [h, kk, f, fd] of HITS) if (t >= h) { const u = pr(t, h, h + .35); ck = Math.max(ck, kk * (1 - u) * (1 - u)); fl = Math.max(fl, f * Math.pow(1 - pr(t, h, h + fd), 2)); }
  chroma(ck); flash(fl);
  const [ox, oy] = w2s(o.x, o.y);
  lensRing(t, HIT_TITLE, ox, oy, mixC(C.gold, C.white, .5), true, 1.3); anam(t, HIT_TITLE, W / 2, V ? 330 : 190, C.gold, 1.0);
  lensRing(t, HIT_FREE + 2.4, ox, oy, mixC(C.gold, C.white, .4), false, 1.2);
  vignette(); if (hb > 0) { ctx.fillStyle = `rgba(0,0,0,${.18 * hb})`; ctx.fillRect(0, 0, W, H); }
  grain(frame);
  heroTexts(t); subtitles(t);
};
