'use strict';
// ESFJ v9 第 3 章「敏感」：D01–D06，整章在夜里家中的餐桌（吊灯是主光，窗外还在下雨，桌上一支蜡烛）
//   D01 特写：朋友递来两碟菜，他尝第一口眼睛一亮、整张脸都亮了；尝第二口，眉头立刻皱起来 —— 喜欢和讨厌都写在脸上
//   D02 朋友随口一句「汤有点咸」，他马上翻开本子，一笔一划写下「汤：少放盐」，还在下面画了两道线
//   D03 一句批评：朋友们走了，只剩他。吊灯慢慢暗下去，他趴到桌上，蜡烛一点点烧短，光里的灰尘慢慢漂（1.6 秒只有环境在动）
//   D04 桌上的手机亮了：「我需要你」。暖光从手机里漫出来，他慢慢抬头、坐直，吊灯一档档亮回来，他站起来抓起外套（1.2 秒心跳光晕慢慢散开）
//   D05 他把今晚的合照发到群里，盯着手机：一个赞、两个赞……他刷新、再刷新。网友原话上屏
//   D06 他在群里问「大家都到家了吗？」—— 没人回，他一点点蔫下去；朋友不小心碰倒杯子，他抢着鞠躬：「都怪我没放好」
const X = require('./ehk');
const S = require('./ESS_kit');
const PR = require('./ESS_props');
const SET = require('./ESS_set');
const QT = require('./ESS_quote');
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('D01') - 0.9, d01: vs('D01'), like: at('D01', '喜欢'), hate: at('D01', '讨厌'), d02: vs('D02'), real: at('D02', '当真'), d03: vs('D03'), d03e: ve('D03'), d04: vs('D04'), need: at('D04', '我需要你'), up: at('D04', '打起精神'), d04e: ve('D04'),
  d05: vs('D05'), d05e: ve('D05'), d06: vs('D06'), cold: at('D06', '冷落'), err: at('D06', '出了错'), self: at('D06', '怪自己'), end: vs('E01') };
const PAD = SET.PAD, FY = 1040, GY = 1290, LAMP = [540, 560];
const ROOM = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  SET.walls(c, { FY, wall: [110, 76, 80], wall2: [44, 30, 44], floor: [100, 66, 60], floor2: [30, 20, 28] });
  SET.window(c, 700, 260, 340, 480, { sky: (c2, x, y, w, h) => { S.vgrad(c2, [[0, [14, 18, 44]], [1, [40, 44, 90]]], y, y + h, x, x + w); const r = mulberry32(4); S.add(c2, () => { for (let k = 0; k < 12; k++) glow(c2, x + r() * w, y + h * 0.55 + r() * h * 0.4, 14, [255, 200, 140], 0.5); }); }, curtain: [150, 80, 90] });
  SET.shelf(c, 40, 520, 440, 7, { jars: true }); SET.frame(c, 120, 300, 150, 170, 0); SET.frame(c, 320, 330, 120, 140, 2);
}));
const TB = 1150;
function table(ctx) {
  const g = ctx.createLinearGradient(0, TB - 40, 0, TB + 30); g.addColorStop(0, 'rgb(150,100,76)'); g.addColorStop(1, 'rgb(100,64,50)'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-20, TB - 40); ctx.lineTo(1100, TB - 40); ctx.lineTo(1160, TB + 40); ctx.lineTo(-80, TB + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(70,44,38)'; ctx.fillRect(-80, TB + 40, 1240, 40); ctx.fillStyle = 'rgb(54,34,32)'; ctx.fillRect(40, TB + 80, 40, 400); ctx.fillRect(1000, TB + 80, 40, 400);
}
// 菜碟
function dish(ctx, x, y, s, c, a = 1) { if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); PR.contact(ctx, 0, 4, 120, 0.4); ctx.fillStyle = 'rgb(250,248,240)'; ctx.beginPath(); ctx.ellipse(0, 0, 120, 34, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(214,206,196)'; ctx.beginPath(); ctx.ellipse(0, -4, 92, 24, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.ellipse(0, -12, 70, 22, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = rgba(mix(c, [255, 255, 255], 0.35)); for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(-40 + k * 16, -18 - (k % 2) * 6, 10, 6, k, 0, 6.2832); ctx.fill(); } ctx.restore(); }
function draw(ctx, t) {
  // 镜头：D01 脸部特写 → D02 中景 → D03 远景（他一个人）→ D04 慢慢推近 → D05 手机特写 → D06 中景
  const C = S.camKF(t, [[T.in, { x: 140, y: -330, z: 2.2, ax: 540, ay: 1000 }], [T.d02 - 0.2, { x: 140, y: -320, z: 2.1 }], [T.d02 + 0.8, { x: 60, y: -40, z: 1.2 }], [T.d03 - 0.1, { x: 60, y: -40, z: 1.22 }], [T.d03 + 1.0, { x: 0, y: -60, z: 0.92 }], [T.d04 - 0.2, { x: 0, y: -60, z: 0.94 }], [T.d04e, { x: 80, y: -120, z: 1.24 }],
    [T.d05 + 0.5, { x: 40, y: -80, z: 1.45 }], [T.d05e + 1.4, { x: 40, y: -80, z: 1.5 }], [T.d06 + 0.6, { x: 120, y: -40, z: 1.02 }], [T.end, { x: 120, y: -40, z: 1.04 }]]);
  const dark = smooth(prog(t, T.d03 + 0.2, T.d03e + 1.2)) * (1 - smooth(prog(t, T.need + 0.2, T.up + 0.6)));
  const lampK = 1 - 0.78 * dark;
  ctx.fillStyle = 'rgb(30,20,30)'; ctx.fillRect(0, 0, W, H);
  ctx.save(); S.cam(ctx, C, 1);
  ctx.drawImage(ROOM(), -PAD, -PAD / 2);
  ctx.save(); ctx.beginPath(); ctx.rect(700, 260, 340, 480); ctx.clip(); ctx.translate(700, 260); S.rain(ctx, t, { box: [-20, -20, 360, 500], a: 0.7, n: 40, seed: 2 }); ctx.restore();
  SET.pendant(ctx, LAMP[0], LAMP[1], t, { k: lampK, len: 900, shade: [200, 140, 90] });
  if (dark > 0.05) SET.motes(ctx, t, [300, 600, 800, 1100], [255, 210, 150], 0.4 * dark, 14, 6);
  // 朋友们（D01–D02 在，D03 前离开）
  const leave = easeIn(prog(t, T.d02 + 2.4, T.d03 + 0.4)), comeBack = smooth(prog(t, T.err - 0.8, T.err - 0.2));
  const fA = leave < 1 ? 1 - smooth(leave) : 0;
  const friend = (key, x, s, flip, al, extra = {}) => { if (al <= 0.01) return null; return S.lit(ctx, c => MB.person(c, key, x, GY - 60, s, { a: al, flip, bob: Math.abs(Math.sin(t * 2 + x)) * 3, ...extra }), { light: LAMP, at: [x, GY - 320], r: 300, warm: [255, 210, 160], cool: [30, 16, 30], k: 0.9 * lampK + 0.1 }); };
  const F1 = friend('entp-male', 230 - leave * 400, 2.3, false, fA);
  friend('enfp-female', fA > 0.5 ? 900 : 960, 2.2, true, Math.max(fA, comeBack), { lean: 0.05 * comeBack });
  // 他
  const taste1 = Math.sin(Math.PI * prog(t, T.d01 + 0.2, T.like + 0.9)), taste2 = Math.sin(Math.PI * prog(t, T.hate - 0.3, T.hate + 0.9));
  const writeU = prog(t, T.d02 + 0.6, T.real + 0.5), slump = smooth(prog(t, T.d03 + 0.1, T.d03e + 0.6)) * (1 - smooth(prog(t, T.need + 0.3, T.up + 0.3)));
  const rise = easeInOut(prog(t, T.up - 0.2, T.d04e + 0.4)), phoneLook = smooth(prog(t, T.d05 - 0.3, T.d05 + 0.3)) * (1 - smooth(prog(t, T.err - 0.6, T.err - 0.2))), wilt = smooth(prog(t, T.cold - 0.3, T.cold + 0.8)) * (1 - smooth(prog(t, T.err - 0.4, T.err)));
  const bow = Math.sin(Math.PI * prog(t, T.self - 0.4, T.self + 1.2));
  const hx = 470, hy = GY - 120 + 120 * rise * (1 - smooth(prog(t, T.d05 - 0.5, T.d05))) ;
  const face = taste1 > 0.3 ? 'love' : taste2 > 0.3 ? 'hate' : null;
  const o = { t, flip: false, umbrella: false, cake: false, book: false,
    eyes: face === 'love' ? 'happy' : face === 'hate' ? 'squint' : slump > 0.5 ? 'closed' : wilt > 0.4 ? 'closed' : bow > 0.2 ? 'closed' : 'open', mouth: face === 'love' ? 'grin' : face === 'hate' ? 'frown' : slump > 0.3 || wilt > 0.3 ? 'frown' : 'smile', brow: face === 'hate' ? 1 : 0,
    rs: -1.6 * Math.max(taste1, taste2) - 0.8 * (writeU > 0 && writeU < 1 ? 1 : 0) * 0 - 1.4 * phoneLook, re: -0.8 * Math.max(taste1, taste2) - 0.6 * phoneLook, nod: 1.6 * slump + 0.6 * wilt + 1.4 * bow + 0.5 * phoneLook, lean: 0.32 * slump + 0.08 * wilt + 0.2 * bow, dim: 0.5 * slump + 0.35 * wilt, glow: 0.5 * (face === 'love' ? taste1 : 0) + 0.6 * Math.sin(Math.PI * prog(t, T.need, T.d04e + 1.0)), look: phoneLook > 0.4 ? [1, 1.5] : [0, 0] };
  const R = S.lit(ctx, c => ES.hero(c, hx, hy, 1.0, o), { light: LAMP, at: [hx, hy - 300], r: 340, warm: [255, 210, 160], cool: [30, 16, 30], k: 0.9 * lampK + 0.1 });
  // 筷子尖上的菜（D01）
  if (taste1 > 0.05 || taste2 > 0.05) { const a = Math.max(taste1, taste2); ctx.strokeStyle = 'rgb(160,110,70)'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(R.hand[0], R.hand[1]); ctx.lineTo(R.mouth[0] + 10, R.mouth[1] + 20); ctx.stroke(); ctx.fillStyle = taste1 > taste2 ? 'rgb(240,170,90)' : 'rgb(110,150,80)'; ctx.beginPath(); ctx.arc(R.mouth[0] + 14, R.mouth[1] + 22, 12 * a, 0, 6.2832); ctx.fill(); }
  // 尝到喜欢的：脸边一圈暖光；讨厌的：头上一小朵冷云
  if (face === 'love') S.add(ctx, () => glow(ctx, R.head[0], R.head[1], 320, [255, 200, 120], 0.4 * taste1));
  table(ctx);
  // 桌上：两碟菜、蜡烛、他的本子、手机、杯子
  const dA = 1 - smooth(prog(t, T.d02 + 2.4, T.d03));
  dish(ctx, 380, TB - 30, 0.9, [240, 170, 90], dA); dish(ctx, 720, TB - 30, 0.9, [110, 150, 80], dA);
  PR.candle(ctx, 880, TB - 30, 0.9, t, { len: lerp(1, 0.25, smooth(prog(t, T.d03, T.d04))) });
  if (writeU > 0 && t < T.d03 - 0.2) PR.notebook(ctx, 420, TB - 80, 0.8, { rot: -0.08, lines: ['汤：少放盐', '══════'], write: clamp(writeU * 1.3), a: 1 - smooth(prog(t, T.d03 - 0.9, T.d03 - 0.3)) });
  // 手机：D04 亮起「我需要你」；D05 群里点赞；D06 没人回
  const ph = t > T.d03e + 0.3;
  if (ph) { const lit = smooth(prog(t, T.need - 0.4, T.need)), big = phoneLook;
    const px = lerp(640, R.hand[0] + 80, big), py = lerp(TB - 36, R.hand[1] - 200, big), s = lerp(0.42, 1.3, big), rot = lerp(-1.45, -0.1, big);
    if (lit > 0.01 && big < 0.5) S.add(ctx, () => { glow(ctx, px, py, 520 * lit, [255, 210, 150], 0.5 * lit * (1 - big)); });
    PR.phone(ctx, px, py, s, { rot, on: lit, draw: (c, w, h) => {
      if (t < T.d05 - 0.3) { PR.chat(c, '我需要你', 16, h * 0.45, { size: 34, c: [255, 255, 255] }); return; }
      S.vgrad(c, [[0, [236, 240, 246]], [1, [214, 220, 230]]], 0, h, 0, w);
      c.fillStyle = 'rgb(250,236,210)'; c.fillRect(14, 30, w - 28, 160); MB.person(c, 'enfp-female', 60, 180, 0.42, { shadow: 0 }); MB.person(c, 'entp-male', 120, 180, 0.42, { shadow: 0 }); ES.hero(c, 150, 186, 0.26, { umbrella: false, cake: false, book: false });
      const likes = Math.min(4, Math.floor(Math.max(0, t - T.d05 - 0.3) / 0.7)) * (t < T.cold ? 1 : 0);
      for (let k = 0; k < likes; k++) { c.fillStyle = 'rgb(240,90,110)'; const hx2 = 30 + k * 34, hy2 = 214; c.beginPath(); c.moveTo(hx2, hy2 + 10); c.bezierCurveTo(hx2 - 16, hy2, hx2 - 10, hy2 - 12, hx2, hy2 - 4); c.bezierCurveTo(hx2 + 10, hy2 - 12, hx2 + 16, hy2, hx2, hy2 + 10); c.fill(); }
      if (t > T.cold - 0.6) { PR.chat(c, '大家都到家了吗？', w - 12, 290, { size: 22, c: [150, 220, 140], right: true, a: smooth(prog(t, T.cold - 0.6, T.cold - 0.3)) }); K.text(c, '无人回复', w / 2, 340, { size: 22, color: [140, 146, 160], alpha: smooth(prog(t, T.cold, T.cold + 0.6)) }); }
    } }); }
  // D04：心跳光晕慢慢散开
  { const p = prog(t, T.up - 0.1, T.d04e + 1.2); if (p > 0 && p < 1) for (let k = 0; k < 2; k++) { const u = clamp(p * 1.6 - k * 0.4); if (u > 0 && u < 1) S.ring(ctx, R.chest[0], R.chest[1], 60 + u * 520, 34, [255, 214, 150], 0.4 * (1 - u)); } }
  // D06：杯子被碰倒（朋友回来时）
  const cupU = prog(t, T.err - 0.2, T.err + 0.6); if (comeBack > 0.01) { const fall = easeIn(clamp(cupU * 1.6)); ctx.save(); ctx.translate(820, TB - 40); ctx.rotate(fall * 1.5); ctx.globalAlpha = comeBack; PR.mug(ctx, 0, 0, 0.6, t, { c: [130, 180, 230], hot: 0 }); ctx.restore(); if (cupU > 0.6) S.add(ctx, () => { for (let k = 0; k < 8; k++) S.rgrad(ctx, 820 + k * 24, TB - 30 + (k % 2) * 6, 40, [[0, [200, 220, 255], 0.4 * comeBack], [1, [200, 220, 255], 0]], 0.3); }); }
  ctx.restore();
  return { C };
}
function over(ctx, t) {
  QT.draw(ctx, t);
  const say = (str, x, y, a0, a1, tx, ty, o = {}) => { const a = K.vis(t, a0, a1, 0.2, 0.3); if (a > 0.003) PR.say(ctx, str, x, y, { a, tx, ty, size: 48, ...o }); };
  say('汤有点咸。', 330, 620, T.d02 - 0.1, T.d02 + 1.4, 240, 780);
  say('都怪我没放好！', 430, 640, T.self - 0.4, T.end - 0.3, 560, 820);
}
module.exports = { draw, over, T };
