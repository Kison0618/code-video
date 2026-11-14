'use strict';
// 《INFP》v3 总装（竖屏 1080x1920）：KW=1080 KH=1920 JQ_DEMO=PW
//   时间全从 pwk（voice_timed4.json / 估算 _est）读。画面分 6 组 PWG1..PWG6.js，每个文件：
//     module.exports = function make(G) { return [{ a, b, draw(ctx,t,a), over(ctx,t,a,st) }, ...] }
//     G = { a, b, END, PAGES }：本组负责的时段；书页时段由 PWB 盖满整屏（书页在 over 层，不被泛光）
//   某组文件不存在或报错 → 用占位画面，不影响别的组
const X = require('./pwk');
const { C, K, L, GOLD, LIME, PINK, BLUE, RED, vs, ve } = X;
const { W, H, vis } = K;
const PWB = require('./PWB');

const END = +(X.END).toFixed(2);
const DUR = END;
const G = [
  ['PWG1', 0, vs('B01') - 0.6],
  ['PWG2', vs('B01') - 0.6, vs('C101') - 0.6],
  ['PWG3', vs('C101') - 0.6, vs('C301') - 0.6],
  ['PWG4', vs('C301') - 0.6, vs('D10') - 0.6],
  ['PWG5', vs('D10') - 0.6, X.PAGES.find(p => p.name === 'P3').b - 0.6],
  ['PWG6', X.PAGES.find(p => p.name === 'P3').b - 0.6, END + 1],
];
const KEYS = [['INFP', LIME], ['INFJ', BLUE], ['共情', GOLD], ['六眼', GOLD], ['理想主义', GOLD], ['小蝴蝶', LIME], ['内耗', BLUE], ['拧巴', BLUE], ['喜爱', PINK],
  ['价值观', GOLD], ['精神的力量', GOLD], ['自我形象', GOLD], ['直觉', LIME], ['浪漫', PINK], ['自我身份', GOLD], ['轻信', RED], ['理想、自由、热爱', GOLD], ['感性', PINK], ['1%', LIME],
  ['独处', BLUE], ['思考过度', BLUE], ['局促不安', BLUE], ['一抓一个准', LIME], ['副本', GOLD], ['两三个', LIME], ['精疲力竭', RED], ['应酬', RED], ['仅有的朋友', GOLD], ['孤独', BLUE],
  ['忍无可忍', RED], ['忍辱负重', RED], ['情绪开关', GOLD], ['个人意义', GOLD], ['内在认同', GOLD], ['真的喜欢', GOLD], ['尊重自己的感受', GOLD], ['生无可恋', BLUE], ['适应能力', GOLD],
  ['求救', BLUE], ['牺牲', RED], ['和谐', LIME], ['敞开心扉', PINK], ['逗他们开心', PINK], ['理想', GOLD], ['惶恐不安', BLUE], ['代价', RED], ['精力', GOLD], ['蓝量', BLUE],
  ['磨损过度', RED], ['血包', RED], ['拒绝', GOLD], ['边界', GOLD], ['同情心', PINK]];
const subs = X.makeSubs(KEYS, END + 1);

function placeholder(name, a, b) {
  return [{ a, b, draw(ctx, t) { X.back(ctx, t, { mood: 0.3 }); }, over(ctx, t, al) { K.text(ctx, name + ' 待做', W / 2, 700, { size: 60, color: [255, 120, 120], alpha: al }); } }];
}
const SCENES = [];
for (const [name, a, b] of G) {
  let mine = null;
  try { mine = require('./' + name)({ a, b, END, PAGES: X.PAGES }); }
  catch (e) { if (!(e.code === 'MODULE_NOT_FOUND' && e.message.includes(name))) console.error('[PW] ' + name + ' 加载失败：' + e.message); }
  SCENES.push(...(mine || placeholder(name, a, b)));
}
// 背景只画一次（同 PF1）
const realBack = X.back, LAST = {}; let curScene = -1;
X.back = (ctx, t, o = {}) => { LAST[curScene] = o; };
const STATE = {};
function draw(ctx, t) {
  const pa = PWB.cover(t);
  if (pa >= 0.999) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); SCENES.forEach((s, i) => (STATE[i] = null)); return; }
  let best = 0, ba = -1;
  SCENES.forEach((s, i) => { const a = vis(t, s.a, s.b, i ? 0.3 : 0, 0.3); if (a > ba) { ba = a; best = i; } });
  if (LAST[best] === undefined) { curScene = best; const c = new K.Canvas(8, 8).getContext('2d'); try { SCENES[best].draw(c, t, 0.001); } catch (e) {} }
  realBack(ctx, t, LAST[best] || {});
  SCENES.forEach((s, i) => {
    const a = vis(t, s.a, s.b, i ? 0.3 : 0, 0.3);
    if (a <= 0.003) { STATE[i] = null; return; }
    curScene = i; ctx.save(); STATE[i] = { a, st: s.draw(ctx, t, a) || {} }; ctx.restore();
  });
}
function over(ctx, t) {
  SCENES.forEach((s, i) => { if (STATE[i] && s.over) { ctx.save(); s.over(ctx, t, STATE[i].a, STATE[i].st); ctx.restore(); } });
  X.front(ctx, t);
  PWB.draw(ctx, t);
  if (PWB.cover(t) < 0.35) subs(ctx, t);
}
const bloomAt = t => 0.2 * (1 - PWB.cover(t));
module.exports = { DUR, draw, over, SCENES, SUBS: [], bloomAt, vig: 0.62, GROUPS: G };
