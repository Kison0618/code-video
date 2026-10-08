// 定律 09 · 时间感知的比例理论（1877，让内）  93.60–102.12 秒（曲子再次进入，硬切）
//  一条 80 年的人生时间轴，每一格 = 一年。先是等宽；然后变成"主观长度"：10 岁的一年占人生 1/10，40 岁只占 1/40；
//  再把重复的日子压扁——整条人生缩短了；最后新地方、新的人把某几年撑开，人生又变长了
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(176), T1 = B(192);
const X0 = 160, X1 = 1760, Y = 600, HT = 90;
const NOVEL = { 24: '新城市', 28: '新的人', 33: '新目标', 39: '新技能', 46: '远行', 53: '转行' };
const PB = [T0 + 1.4, T0 + 3.6], PC = [B(185), B(186.8)], PD = [B(188.5), B(191)];
const subj = i => 1 / Math.max(i + 1, 3);
const SUM = (() => { let s = 0; for (let i = 0; i < 80; i++) s += subj(i); return s; })();
const routine = i => i >= 20 && i <= 66 && !NOVEL[i];

function widths(t) {
  const b = easeInOut(prog(t, ...PB)), c = easeInOut(prog(t, ...PC)), d = easeInOut(prog(t, ...PD));
  const o = [];
  for (let i = 0; i < 80; i++) {
    let w = lerp(1, subj(i) / SUM * 80, b);
    if (routine(i)) w *= lerp(1, 0.42, c);
    if (NOVEL[i]) w *= lerp(1, 4.2, d);
    o.push(w * (X1 - X0) / 80);
  }
  return { o, b, c, d };
}

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 1877, prev: 1967, who: 'P. 让内 · 法国哲学家', no: '09', law: '时间感知', en: 'Proportional Theory of Time', paper: "Une illusion d'optique interne", paperCn: '《一种内在的错觉》' });
  const a = smooth(prog(t, T0, T0 + 0.3)) * (1 - smooth(prog(t, T1 - 0.3, T1)));
  const { o, b, c, d } = widths(t);
  const grow = easeOutExpo(prog(t, T0 + 0.1, T0 + 1.0));
  let x = X0;
  const xs = [];
  for (let i = 0; i < 80; i++) {
    xs.push(x);
    const w = o[i] * grow;
    let col = mix([120, 150, 190], C.ice, 1 - i / 80);
    if (routine(i)) col = mix(col, [70, 70, 78], c);
    if (NOVEL[i]) col = mix(col, C.gold, d);
    ctx.fillStyle = rgba(col, 0.85 * a); ctx.fillRect(x, Y - HT / 2, Math.max(0.6, w - 1.2), HT);
    if (NOVEL[i] && d > 0.3) {
      glow(ctx, x + w / 2, Y, 80, C.gold, 0.25 * d * a);
      const alt = Object.keys(NOVEL).indexOf(String(i)) % 2;
      text(ctx, NOVEL[i], x + w / 2, Y - HT / 2 - 18 - alt * 34, { family: 'Song', size: 24, color: C.gold, alpha: a * smooth((d - 0.3) / 0.4) });
    }
    x += w;
  }
  xs.push(x);
  // 年龄刻度
  for (let i = 0; i <= 80; i += 10) UI.note(ctx, i + (i ? '' : ' 岁'), xs[i], Y + HT / 2 + 36, { size: 20, alpha: a, align: 'center' });
  // 标注：10 岁与 40 岁
  const la = smooth(prog(t, PB[1] - 0.6, PB[1])) * (1 - smooth(prog(t, PC[0], PC[0] + 0.3))) * a;
  [[10, '10 岁的一年 = 人生的 1/10'], [40, '40 岁的一年 = 人生的 1/40']].forEach(([i, s], k) => {
    const cx = xs[i] + o[i] / 2, y = Y - HT / 2 - 30 - k * 70;
    ctx.fillStyle = rgba(C.white, la); ctx.fillRect(cx - 1, y + 8, 2, Y - HT / 2 - y - 8);
    text(ctx, s, cx + (k ? -10 : 10), y, { family: 'Song', size: 28, color: C.white, alpha: la, align: k ? 'right' : 'left' });
  });
  if (c > 0.05 && d < 0.5) text(ctx, '重复的日子', (xs[20] + xs[66]) / 2, Y + HT / 2 + 80, { family: 'Song', size: 26, color: C.gray, alpha: a * smooth(c * 2) * (1 - smooth((d - 0.2) / 0.3)) });
  // 读数：主观的一生
  const total = (x - X0) / (X1 - X0);
  UI.note(ctx, '主观的一生', X0, 350, { size: 22, alpha: a });
  text(ctx, Math.round(total * 100 * grow) + '%', X0, 420, { family: 'Mono', size: 60, color: total < 0.8 ? C.red : C.white, alpha: a, align: 'left' });
  if (x < X1 - 4 && c > 0.1) {
    ctx.save(); ctx.setLineDash([6, 6]); ctx.strokeStyle = rgba(C.red, 0.7 * a * (1 - d)); ctx.strokeRect(x, Y - HT / 2, X1 - x, HT); ctx.restore();
    text(ctx, '被"习惯"吃掉的时间', X1, Y + HT / 2 + 124, { family: "Song", size: 26, color: C.red, alpha: a * smooth(c * 2) * (1 - d), align: "right" });
  }
  T.seq(ctx, t, [
    { t: T0 + 0.02, s: '但是。', fx: 'slam', size: 84, en: 'But.' },
    { t: B(178.2), s: '生活越习惯，新鲜感越少，', en: 'The more routine your life, the less is new,' },
    { t: B(182), s: '时间就过得越快——', hl: { '越快': C.ice }, en: 'and the faster time goes —' },
    { t: B(185), s: '生命，就越短。', fx: 'slam', size: 76, hl: { '越短': C.red }, en: 'and the shorter your life feels.' },
    { t: B(188.5), s: '所以，去新的地方，见新的人。', hl: { '新的地方': C.gold, '新的人': C.gold }, en: 'So go somewhere new. Meet someone new.' },
  ], { y: CARD.CAP_Y, size: 60, out: T1 - 0.05 });
}
module.exports = { draw, t0: T0, t1: T1 };
