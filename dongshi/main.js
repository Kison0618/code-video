// main.js — 时间线上的字（字幕 / 大字 / 角标 / 片尾）和每一帧的合成顺序
'use strict';
// 时间都是成片时间（配乐《经济舱》钢琴版整首放两遍，全片 208.5 秒；第二遍从 104.25 秒开始）；场景时间见 timeline.js
const SUBS = [
  // —— 第一遍：他们 ——
  [0.30, 2.75, '有一种父母，脾气说来就来，{r|从不道歉}。'], [2.95, 5.75, '摔倒了，没有安慰，只有“{r|叫你别跑}！”'], [5.95, 8.55, '这样长大的孩子，开心都要{i|小声一点}。'],
  [8.75, 11.35, '长大后，别人一冷脸，你就{r|先怪自己}。'], [11.55, 14.15, '明明委屈的是你，先道歉的，也{i|总是你}。'], [14.35, 16.40, '从小到大，人人都夸你{g|懂事}。'],
  [16.90, 19.60, '可是，没有人问过你，累不累。'],
  [27.835, 30.74, '这样的父母，身体长大了，{e|情绪}没有。'], [30.94, 32.54, '这叫{e|情感不成熟}。'], [32.74, 34.17, '他们不说“我难受”。'], [34.375, 36.90, '他们摔门、摆脸色，难受的却是{i|你}。'],
  [37.10, 39.625, '你一提意见：“{r|都怪我}，行了吧！”'], [39.825, 42.35, '吵完架，要你{r|马上原谅}。'], [42.55, 45.075, '你还难过，就成了{r|你的错}。'],
  [45.275, 47.80, '他们有委屈，就找你{i|倒苦水}。'], [48.00, 50.525, '你有委屈，却{i|没人}听你说。'], [50.725, 54.45, '你站在雨里，替大人{i|撑伞}。'],
  [59.90, 62.515, '这样的父母，大致{w|四种}，常常混着来。'], [62.715, 65.24, '情绪型：家里人人{i|如履薄冰}。'], [65.44, 67.965, '驱动型：爱你，也一直给你{r|打分}。'],
  [68.165, 70.69, '消极型：陪你玩，出了事却{i|不在}。'], [70.89, 73.415, '拒绝型：让你觉得自己{i|多余}。'], [73.615, 75.595, '四种样子，留下同一种{i|孤单}：'],
  [75.795, 78.32, '家里明明有人，心里却{i|没人}。'], [78.52, 81.00, '这叫{i|情感孤独}。'],
  [85.06, 87.585, '你会想：我什么都{g|不缺}，'], [87.785, 90.40, '为什么，还是{i|难过}？'],
  [99.775, 102.60, '小小的你，想了一个{g|办法}。'],
  // —— 第二遍：你 ——
  [105.925, 108.45, '先看{i|脸色}，再开口。'], [108.65, 111.72, '考满分回家，只换来一句：“{r|别烦我}。”'], [111.92, 114.445, '把别人的需要，放在{g|第一位}。'],
  [114.645, 118.26, '你演一个{w|不添麻烦}的孩子。'], [118.46, 121.10, '演久了，比做自己还累。'],
  [127.725, 130.795, '“要是我再好一点，他们就会{g|懂我}。”'], [130.995, 134.065, '可是，无条件的爱，{r|换不来}。'],
  [134.265, 137.335, '长大后，你总爱上{i|熟悉}的冷淡。'], [137.535, 140.35, '因为对大脑来说，熟悉就是{i|安全}。'],
  [140.805, 144.30, '你等的那句{i|对不起}，可能永远不会来。'], [144.62, 147.69, '直到有一天，你{r|撑不住}了。'], [147.89, 150.50, '书里说，这是{g|觉醒}的开始。'],
  [157.155, 159.60, '不是因为你不值得——'],
  [163.695, 166.765, '那时候，孩子只该被看见，不该被听见。'], [166.965, 168.945, '他们也被一年年{r|修剪}、捆扎。'], [169.145, 172.215, '长成了，{w|不是它本来的样子}。'],
  [172.415, 177.12, '他们只顾自己，像一直{r|疼}着的人。'], [177.32, 179.845, '所以，他们不是{w|故意}的。'], [180.045, 182.025, '但伤害，是{r|真的}。'],
  [182.225, 185.295, '你会生气，这很正常，{r|不是不孝}。'], [185.495, 188.02, '退一步，像旁观者一样{g|看}。'], [188.22, 190.60, '你改变不了他们，但能{g|救自己}。'],
  [190.945, 193.47, '以后摔倒了，先{g|抱抱自己}。'], [193.67, 195.65, '不是你的错，就{g|不用道歉}。'], [195.85, 199.20, '开心，可以{g|大声一点}。'],
];
const HUD_SRC = 'L. C. GIBSON · 2015 · 不成熟的父母';
const HUDW = [[28.0, 55.5], [59.9, 92.0], [105.6, 121.6], [127.6, 140.4], [144.5, 150.8], [163.4, 190.4]];
const CONC = [[30.94, 32.6, 'EMOTIONALLY IMMATURE · p.28', '情感不成熟'], [32.74, 36.95, 'EMOTIONAL CONTAGION · CH.3', '情绪传染'], [37.1, 39.7, 'DEFENSIVE · CH.3', '一说就防御'],
  [39.825, 45.1, 'NO REPAIR · CH.3', '不修复关系'], [45.275, 55.3, 'ROLE REVERSAL · p.33', '角色颠倒'], [59.9, 75.6, 'FOUR TYPES · CH.4', '四类父母'],
  [75.795, 91.9, 'EMOTIONAL LONELINESS · CH.1', '情感孤独'], [105.925, 114.5, 'INTERNALIZER · CH.5', '自我掌控者'], [114.645, 121.5, 'ROLE-SELF · CH.5', '角色型自我'],
  [127.725, 134.1, 'HEALING FANTASY · CH.5', '治愈型幻想'], [134.265, 140.3, 'FAMILIAR = SAFE · CH.1', '熟悉 = 安全'], [144.62, 150.7, 'BREAKDOWN · AWAKENING · CH.7', '崩溃与觉醒'],
  [163.695, 166.8, 'SEEN, NOT HEARD · p.37', '只该被看见'], [166.965, 172.3, 'BONSAI · p.38', '盆景'], [172.415, 177.2, 'SELF-PREOCCUPIED · CH.2', '像长期疼痛的人'],
  [177.32, 182.0, 'NOT ON PURPOSE · CH.2', '并非故意'], [182.225, 185.35, 'ANGER · p.53', '生气是正常反应'], [185.495, 190.3, 'DETACHED OBSERVATION · CH.8', '超脱地观察']];
const HERO = {
  q: '为什么，你那么早就{g|懂事}了？', big: '孩子，成了{i|父母的父母}。', lone: '孤独没有伤口，但一样{i|疼}。', rev: '他们，也曾是{s|那个孩子}。',
  g1: '看清他们，不是背叛。', g2: '{g|是终于，站在了自己这边。}',
};
const H2 = BAR(25), H3L = BAR(43), H4 = BAR(25) + P2, GOLD = BAR(43) + P2, END = BAR(45) + P2;   // 56.175 / 95.415 / 160.425 / 199.665 / 204.025
const STEPS = [[186.04, '超脱地观察'], [186.585, '说了就放下'], [187.13, '专注结果，不求关系']];   // 原书第 8 章的三个办法
window.ALL_TEXT = [...SUBS.map(s => plain(s[2])), HUD_SRC, ...CONC.flatMap(c => [c[2], c[3]]), ...STEPS.map(s => s[1]),
  ...Object.values(HERO).map(plain), '懂事', 'EMOTIONALLY IMMATURE PARENTS', '妈妈', '你的错', '不孝', '都怪我，行了吧！', '别烦我', ...HL.map(x => x.s), ...TYPES.flatMap(x => [x.en.split('').join(' '), x.zh]),
  '孩子只该被看见，不该被听见', '“children should be seen and not heard”', '0123456789:.,·–—“”'];

// ---------- 字幕（屏幕层，最后画，保持清晰） ----------
function subtitles(t) {
  for (const [t0, t1, s] of SUBS) {
    if (t < t0 || t > t1 + .05) continue;
    const a = 1 - pr(t, t1 - .22, t1);
    textBlock(ctx, s, W / 2, V ? 1480 : 972, { size: V ? 62 : 54, font: FS.sans, weight: 500, ls: 1, t0, per: .045, fade: .24, t, a, shadow: true, rise: 4, maxW: V ? 900 : 1600, lh: V ? 84 : 70 });
  }
}
// ---------- 角标：书名 + 正在讲的概念（整行淡入、往右轻轻滑到位，没有打字和光标） ----------
function hud(t) {
  let a = 0; for (const [a0, b0] of HUDW) a = Math.max(a, win(t, a0, b0, .6, .5)); if (a <= 0) return;
  const [x, y] = V ? [56, 120] : [64, 60];
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left';
  ctx.fillStyle = rgba(C.gold, .8 * a); ctx.fillRect(x, y - 10, 3, 20);
  ctx.font = `500 22px ${FS.mono}`; ctx.fillStyle = rgba(C.gray, .95 * a); ctx.fillText(HUD_SRC, x + 14, y);
  for (const [c0, c1, en, zh] of CONC) {
    if (t < c0 || t > c1) continue;
    const ca = a * (1 - pr(t, c1 - .35, c1)), ue = eo(pr(t, c0, c0 + .55)), uz = eo(pr(t, c0 + .3, c0 + .85));
    ctx.font = `500 26px ${FS.mono}`; ctx.fillStyle = rgba(C.silver, .95 * ca * ue); ctx.fillText(en, x + 14 - 14 * (1 - ue), y + 44);
    ctx.font = `500 26px ${FS.sans}`; ctx.fillStyle = rgba(C.lamp, .9 * ca * uz); ctx.fillText(zh, x + 14 - 10 * (1 - uz), y + 84);
  }
}
// ---------- 退一步：画面左边（竖屏在下面）三行小字，金色的勾 ----------
function steps(t) {
  if (t < STEPS[0][0] || t > 189.3) return;
  const out = 1 - eio(pr(t, 188.8, 189.3)), X = V ? 150 : 150, IY = V ? [1215, 1285, 1355] : [430, 530, 630], sz = V ? 40 : 44;
  STEPS.forEach(([t0, s], i) => {
    const y = IY[i], ba = eo(pr(t, t0, t0 + .3)) * out; if (ba <= 0) return;
    ctx.strokeStyle = rgba(C.gold, .9 * ba); ctx.lineWidth = 2; ctx.strokeRect(X, y - 18, 36, 36);
    const cu = eio(pr(t, t0 + .25, t0 + .5));
    if (cu > 0) { const P = withLen([[X + 7, y + 1], [X + 15, y + 11], [X + 32, y - 13]]); strokePartial(ctx, P, cu, rgba(mixC(C.gold, C.white, .3), out), 3.5); }
    drawChars(ctx, parse(s), X + 60, y, { size: sz, font: FS.sans, weight: 500, ls: 1, t0: t0 + .1, per: .04, t, a: out, align: 'left', shadow: true, color: () => C.lamp });
  });
}
// ---------- 大字（泛光之后画，自带两层光晕） ----------
const GL = k => k === 'g' ? C.gold : k === 'i' ? C.ice : k === 's' ? C.silver : C.lamp;
const GR = k => k === 'g' ? GRAD_G() : k === 'i' || k === 's' ? GRAD_I() : GRAD_W();
function heroTexts(t) {
  const c = ctx;
  if (t >= T_IN && t < 27.725) {   // 片名：落在全曲进入的那一拍
    const a = eo(pr(t, T_IN, T_IN + .35)) * (1 - eio(pr(t, 26.625, 27.325))), s = lerp(1.07, 1, eo(pr(t, T_IN, T_IN + .85)));
    c.save(); c.translate(TT.x, TT.y); c.scale(s, s); c.translate(-TT.x, -TT.y);
    drawChars(c, parse('懂事'), TT.x, TT.y, { size: TT.size, font: FS.serif, weight: 900, ls: TT.ls, t0: T_IN, per: 0, fade: .01, t, a, grad: GRAD_W, shadow: true, rise: 0 });
    titleSheen(c, t, s, a);
    c.restore();
    const ue = eo(pr(t, T_IN + .45, T_IN + 2.0)), ls0 = V ? 4 : 7, ey = TT.y - TT.size * .78;   // 英文：整行一起出现，字距从宽慢慢收拢（没有打字和光标）
    const ew = drawChars(c, parse('EMOTIONALLY IMMATURE PARENTS'), TT.x, ey, { size: V ? 20 : 22, font: FS.mono, ls: lerp(ls0 * 2.6, ls0, ue), t0: 0, per: 0, a: a * .8 * eo(pr(t, T_IN + .45, T_IN + 1.25)), color: () => C.silver });
    const hl = (V ? 44 : 70) * eio(pr(t, T_IN + 1.0, T_IN + 1.9)), ha = a * .45;   // 两侧一对细线，从字边往外长
    if (hl > 1) { c.fillStyle = rgba(C.silver, ha); c.fillRect(TT.x - ew / 2 - 22 - hl, ey, hl, 1.2); c.fillRect(TT.x + ew / 2 + 22, ey, hl, 1.2); }
    drawChars(c, parse(HERO.q), TT.x, TT.y + TT.size * .82, { size: 52, font: FS.sans, ls: 3, t0: T_IN + 1.35, per: .035, fade: .6, t, a, shadow: true, rise: 10, color: k => k ? KC[k] : C.lamp });
  }
  if (t >= H2 && t < 59.7) {       // 孩子，成了父母的父母。
    const a = 1 - eio(pr(t, 59.2, 59.7)), o = { size: V ? 104 : 110, font: FS.serif, weight: 900, ls: V ? 6 : 10, per: .045, fade: .3, t, a, grad: GR, shadow: true, rise: 10 };
    if (V) { drawChars(c, parse('孩子，'), W / 2, 790, { ...o, t0: H2 }); drawChars(c, parse('成了{i|父母的父母}。'), W / 2, 930, { ...o, t0: H2 + 3 * .045 }); }
    else drawChars(c, parse(HERO.big), W / 2, 520, { ...o, t0: H2 });
  }
  if (t >= H3L && t < 99.6) {      // 孤独没有伤口，但一样疼。
    const a = 1 - eio(pr(t, 99.1, 99.6)), o = { font: FS.serif, weight: 900, per: .05, fade: .3, t, a, grad: GR, shadow: true, rise: 8 };
    if (V) { drawChars(c, parse('孤独没有伤口，'), W / 2, 400, { ...o, size: 86, ls: 6, t0: H3L }); drawChars(c, parse('但一样{i|疼}。'), W / 2, 520, { ...o, size: 86, ls: 6, t0: H3L + 7 * .05 }); }
    else drawChars(c, parse(HERO.lone), W / 2, 250, { ...o, size: 84, ls: 8, t0: H3L });
  }
  if (t >= H4 && t < 162.9) {      // 他们，也曾是那个孩子。
    const a = 1 - eio(pr(t, 162.4, 162.9));
    drawChars(c, parse(HERO.rev), W / 2, V ? 430 : 220, { size: V ? 62 : 70, font: FS.serif, weight: 900, ls: 6, t0: H4, per: .05, fade: .3, t, a, grad: GR, shadow: true, rise: 8 });
  }
  if (t >= GOLD && t < 203.95) {   // 金句
    const a = 1 - eio(pr(t, 203.45, 203.95)), sz = V ? 62 : 66;
    drawChars(c, parse(HERO.g1), W / 2, V ? 780 : 470, { size: sz, font: FS.serif, weight: 900, ls: 6, t0: GOLD, per: .06, fade: .35, t, a, grad: GRAD_W, shadow: true, rise: 8 });
    drawChars(c, parse(HERO.g2), W / 2, V ? 920 : 610, { size: sz, font: FS.serif, weight: 900, ls: 6, t0: GOLD + 1.5, per: .06, fade: .35, t, a, grad: GR, shadow: true, rise: 8 });
  }
  if (t >= END) {                  // 片尾卡：只有片名（光尘先聚回字形）；参考文献放在文案.md / 发布简介里
    const a = 1 - eio(pr(t, 207.95, 208.5));
    drawChars(c, parse('懂事'), TT.x, TT.y, { size: TT.size, font: FS.serif, weight: 900, ls: TT.ls, t0: END + .575, per: .12, fade: .7, t, a, grad: GRAD_W, shadow: true, rise: 0 });
  }
}
// 片名落定后，一道斜的亮光从左到右扫过“懂事”两个字（只在字形里面，字外不发光）
let SHEEN = null;
function titleSheen(c, t, s, a) {
  const u = pr(t, T_IN + .55, T_IN + 1.75); if (u <= 0 || u >= 1 || a <= .01) return;
  if (!SHEEN) SHEEN = mk(W, H); const g2 = SHEEN.getContext('2d');
  g2.setTransform(1, 0, 0, 1, 0, 0); g2.globalCompositeOperation = 'source-over'; g2.clearRect(0, 0, W, H);
  drawChars(g2, parse('懂事'), TT.x, TT.y, { size: TT.size, font: FS.serif, weight: 900, ls: TT.ls, t0: 0, per: 0, color: () => C.white });
  const half = TT.size * 1.5, cx = lerp(TT.x - half, TT.x + half, eio(u)), bw = TT.size * .32, sk = TT.size * .35;
  const gr = g2.createLinearGradient(cx - bw - sk, TT.y + TT.size * .5, cx + bw + sk, TT.y - TT.size * .5);
  gr.addColorStop(0, 'rgba(255,240,210,0)'); gr.addColorStop(.5, 'rgba(255,244,222,1)'); gr.addColorStop(1, 'rgba(255,240,210,0)');
  g2.globalCompositeOperation = 'source-in'; g2.fillStyle = gr; g2.fillRect(0, 0, W, H); g2.globalCompositeOperation = 'source-over';
  c.save(); c.setTransform(1, 0, 0, 1, 0, 0); c.translate(TT.x, TT.y); c.scale(s, s); c.translate(-TT.x, -TT.y);
  c.globalCompositeOperation = 'lighter'; c.globalAlpha = .55 * a * Math.sin(Math.PI * u); c.drawImage(SHEEN, 0, 0); c.restore();
}
function goldLine(t) {    // 金句中间那一道金色的横光，之后留一根细线
  if (t < GOLD || t > 203.95) return;
  const y = V ? 850 : 540;
  anam(t, GOLD, W / 2, y, C.gold, 1.2, W * .55);
  const a = .35 * eo(pr(t, GOLD + .2, GOLD + 1)) * (1 - pr(t, 203.45, 203.95)), L = (V ? 300 : 360) * eo(pr(t, GOLD, GOLD + .8));
  if (a > 0) { const g = ctx.createLinearGradient(W / 2 - L, 0, W / 2 + L, 0); g.addColorStop(0, rgba(C.gold, 0)); g.addColorStop(.5, rgba(mixC(C.gold, C.white, .4), a)); g.addColorStop(1, rgba(C.gold, 0)); ctx.fillStyle = g; ctx.fillRect(W / 2 - L, y - 1, L * 2, 2); }
}
const HITS = [[T_IN, 5, .22, .35], [H2, 5, 0, .5], [H3L, 5, .16, .4], [H4, 6, .28, .4]];   // 大特效都在小节重拍上，前面各有 0.45 秒黑（第五次是金句的金色横光）

// ---------- 一帧 ----------
window.render = function (t, frame = Math.round(t * 30)) {
  t = clamp(t, 0, window.TOTAL); const T = N2O(t);   // T：场景时间
  PX.t = t; const k = keyCam(V ? CAMV : CAMH, T); CAM = { fx: k[1], fy: k[2], s: k[3] };
  sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
  const bg = sx.createRadialGradient(W / 2, H * .45, 0, W / 2, H * .45, Math.hypot(W, H) * .6); bg.addColorStop(0, 'rgb(20,17,14)'); bg.addColorStop(1, 'rgb(6,5,5)');
  sx.fillStyle = bg; sx.fillRect(0, 0, W, H);
  camT(sx); scenes(T); PX.flush(sx);
  sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalAlpha = 1; sx.globalCompositeOperation = 'source-over';
  const d = dimAt(T) * cutDim(t); if (d < 1) { sx.fillStyle = `rgba(0,0,0,${1 - d})`; sx.fillRect(0, 0, W, H); }
  titleDust(t, T); endDust(t);
  bloom(); haze(t, .9);
  heroTexts(t);
  let ck = 0, fl = 0; for (const [h, kk, f, fd] of HITS) if (t >= h) { const u = pr(t, h, h + .35); ck = Math.max(ck, kk * (1 - u) * (1 - u)); fl = Math.max(fl, f * Math.pow(1 - pr(t, h, h + fd), 2)); }
  chroma(ck); flash(fl);
  lensRing(t, T_IN, TT.x, TT.y, mixC(C.gold, C.white, .5), true, 1.3);
  lensRing(t, H2, W / 2, V ? 860 : 520, C.white, true, 1.25);
  if (t >= H3L && t < H3L + 1.5) { const p = lonePt(t); lensRing(t, H3L, p[0], p[1], mixC(C.ice, C.white, .5), true, 1.3); anam(t, H3L, p[0], p[1], C.ice, .9); }
  lensRing(t, H4, W / 2, V ? 430 : 220, mixC(C.ice, C.white, .5), true, 1.25);
  if (t >= 127.725 && t < 129) { const p = dreamPt(); lensRing(t, 127.725, p[0], p[1], mixC(C.gold, C.white, .4), false, 1.1); }   // 第二遍全曲进入：梦泡（中等，不黑场）
  anam(t, T_IN, TT.x, TT.y, C.gold, .9);
  anam(t, H4, W / 2, V ? 430 : 220, C.ice, .8);
  goldLine(t);
  vignette(); grain(frame);
  hud(t); hookLabels(T); typeLabels(t); steps(t); subtitles(t);
};
