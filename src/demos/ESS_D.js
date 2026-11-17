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
const TP = require('./ESS_type');
const NE = require('./ESS_neon');
const CT = require('./ESS_city');
const DSKY = S.lazy(() => CT.skyline({ w: 900, h: 700, seed: 21, sky: [[14, 18, 44], [44, 40, 86]], fog: [70, 60, 110], base: [30, 26, 56], lit: 0.04, ground: 640, blurK: 1.6 }));
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('D01') - 0.9, d01: vs('D01'), like: at('D01', '喜欢'), hate: at('D01', '讨厌'), d02: vs('D02'), real: at('D02', '当真'), d03: vs('D03'), d03e: ve('D03'), d04: vs('D04'), need: at('D04', '我需要你'), up: at('D04', '打起精神'), d04e: ve('D04'),
  d05: vs('D05'), d05e: ve('D05'), d06: vs('D06'), cold: at('D06', '冷落'), err: at('D06', '出了错'), self: at('D06', '怪自己'), end: vs('E01') };
const PAD = SET.PAD, FY = 1040, GY = 1290, LAMP = [540, 560];
const ROOM = S.lazy(() => S.bake(W + PAD * 2, H + PAD, c => {
  c.translate(PAD, PAD / 2);
  SET.walls(c, { FY, wall: [110, 76, 80], wall2: [44, 30, 44], floor: [100, 66, 60], floor2: [30, 20, 28] });
  SET.window(c, 700, 260, 340, 480, { sky: (c2, x, y, w, h) => { S.vgrad(c2, [[0, [14, 18, 44]], [1, [40, 44, 90]]], y, y + h, x, x + w); c2.drawImage(DSKY(), x - 260, y + h * 0.2, 900, 700 * (h * 0.85) / 700); }, curtain: [150, 80, 90] });
  SET.shelf(c, 40, 520, 440, 7); SET.frame(c, 120, 300, 150, 170, 0); SET.frame(c, 320, 330, 120, 140, 2);
}));
const TB = 1150;
function table(ctx) {
  const g = ctx.createLinearGradient(0, TB - 40, 0, TB + 30); g.addColorStop(0, 'rgb(150,100,76)'); g.addColorStop(1, 'rgb(100,64,50)'); ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(-20, TB - 40); ctx.lineTo(1100, TB - 40); ctx.lineTo(1160, TB + 40); ctx.lineTo(-80, TB + 40); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(70,44,38)'; ctx.fillRect(-80, TB + 40, 1240, 40); ctx.fillStyle = 'rgb(54,34,32)'; ctx.fillRect(40, TB + 80, 40, 400); ctx.fillRect(1000, TB + 80, 40, 400);
}
// 菜碟
function dish(ctx, x, y, s, c, a = 1) { if (a <= 0.003) return; ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.scale(s, s); PR.contact(ctx, 0, 4, 120, 0.4); ctx.fillStyle = 'rgb(250,248,240)'; ctx.beginPath(); ctx.ellipse(0, 0, 120, 34, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = 'rgb(214,206,196)'; ctx.beginPath(); ctx.ellipse(0, -4, 92, 24, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.ellipse(0, -12, 70, 22, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = rgba(mix(c, [255, 255, 255], 0.35)); for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.ellipse(-40 + k * 16, -18 - (k % 2) * 6, 10, 6, k, 0, 6.2832); ctx.fill(); } ctx.restore(); }
// D03–D04（2026-11-17 第二轮）：切进霓虹线稿 —— 一道红色锯齿闪电（批评）打在他胸口，碎线往下掉，他的线稿从金色褪成冷灰蓝、塌下去，
//   头顶落下一根根冷色的线（消沉好久）；「我需要你」消息卡弹出；「打起精神」：胸口放射金光，金色从头到脚重新描一遍，他站直，身后一圈金环
const NA = [T.d03 - 0.45, T.d04e + 0.5];
function neonLow(ctx, t) {
  const hit = T.d03 + 0.33, drain = smooth(prog(t, hit, hit + 1.4)), up = easeInOut(prog(t, T.up - 0.15, T.up + 0.9)), low = drain * (1 - up);
  const DIM = [90, 110, 150], col = mix(NE.GOLD, DIM, drain);
  NE.bg(ctx, t, { c1: mix([30, 26, 20], [12, 16, 32], drain), haze: mix(NE.GOLD, DIM, low) });
  NE.floor(ctx, 1300, mix(NE.GOLD, DIM, low), 1 - 0.5 * low);
  // 消沉：头顶落下的冷色线
  if (low > 0.02) lit0(ctx, l => { l.strokeStyle = `rgba(150,170,220,${0.35 * low})`; l.lineWidth = 2; for (let k = 0; k < 26; k++) { const x = 120 + hash(k * 3.3) * 840, ph = (t * (0.35 + hash(k) * 0.3) + hash(k * 7.1)) % 1, y = 200 + ph * 1100; l.beginPath(); l.moveTo(x, y); l.lineTo(x, y + 90 + hash(k * 2) * 80); l.stroke(); } });
  const pose = { t, umbrella: false, cake: false, book: false, eyes: low > 0.4 ? 'closed' : 'happy', mouth: low > 0.4 ? 'frown' : 'grin', nod: 1.3 * low, lean: 0.2 * low, rs: -0.4 * (1 - low) - 1.6 * Math.sin(Math.PI * clamp(up * 1.2)) };
  const R = NE.wire(ctx, c => ES.hero(c, 520, 1300, 1.05, pose), { c: col, w: 3, p: prog(t, NA[0], NA[0] + 0.6), a: 1 - 0.4 * low });
  if (!R) return;
  if (up > 0.01) NE.wire(ctx, c => ES.hero(c, 520, 1300, 1.05, pose), { c: NE.GOLD, w: 3.5, p: up, fillA: 0 });
  // 红色闪电：从左上角劈到胸口
  const bolt = prog(t, hit - 0.25, hit), boltA = 1 - smooth(prog(t, hit + 0.2, hit + 1.0));
  if (bolt > 0 && boltA > 0.01) { const a0 = [70, 300], b0 = R.chest, pts = NE.sample(u => [lerp(a0[0], b0[0], u) + (u > 0 && u < 1 ? (hash(Math.floor(u * 9)) - 0.5) * 120 : 0), lerp(a0[1], b0[1], u)], 9); NE.line(ctx, pts, bolt, NE.ROSE, 6, boltA); }
  // 碎线：被打中的那一下，胸口炸出一把短线往下掉
  { const p = prog(t, hit, hit + 1.6); if (p > 0 && p < 1) lit0(ctx, l => { l.strokeStyle = rgba(mix(NE.ROSE, NE.GOLD, 0.3), 1 - p); l.lineWidth = 3; l.lineCap = 'round'; for (let k = 0; k < 14; k++) { const an = hash(k * 5.1) * Math.PI * 2, v = 260 + hash(k * 2.7) * 380, x = R.chest[0] + Math.cos(an) * v * p, y = R.chest[1] + Math.sin(an) * v * p + 900 * p * p, ro = an + p * 6; l.beginPath(); l.moveTo(x, y); l.lineTo(x + Math.cos(ro) * 34, y + Math.sin(ro) * 34); l.stroke(); } }); }
  // 打起精神：放射金光 + 金环
  if (up > 0.01) { NE.rays(ctx, R.chest[0], R.chest[1], up, NE.GOLD, 1 - 0.5 * smooth(prog(t, T.up + 0.8, NA[1]))); NE.orbit(ctx, 540, 960, 380, up, t, NE.GOLD, 0.9); }
}
function lit0(ctx, fn) { NE.lit(ctx, fn, { glowA: 0.6 }); }
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
  if (face === 'love') S.add(ctx, () => glow(ctx, R.head[0], R.head[1], 300, [255, 190, 110], 0.2 * taste1));
  table(ctx);
  // 桌上：两碟菜、蜡烛、他的本子、手机、杯子
  const dA = 1 - smooth(prog(t, T.d02 + 2.4, T.d03));
  dish(ctx, 380, TB - 30, 0.9, [240, 170, 90], dA); dish(ctx, 720, TB - 30, 0.9, [110, 150, 80], dA);
  PR.candle(ctx, 880, TB - 30, 0.9, t, { len: lerp(1, 0.25, smooth(prog(t, T.d03, T.d04))) });
  if (writeU > 0 && t < T.d03 - 0.2) PR.notebook(ctx, 430, TB - 90, 1.0, { rot: -0.08, lines: ['汤：少放盐', '══════'], write: clamp(writeU * 1.3), a: 1 - smooth(prog(t, T.d03 - 0.9, T.d03 - 0.3)) });
  // 手机：D04 亮起「我需要你」；D05 群里点赞；D06 没人回
  const ph = t > T.d03e + 0.3;
  if (ph) { const lit = smooth(prog(t, T.need - 0.4, T.need)), big = phoneLook;
    const px = lerp(640, R.hand[0] + 90, big), py = lerp(TB - 36, R.hand[1] - 220, big), s = lerp(0.38, 1.15, big), rot = lerp(-1.45, -0.1, big);
    if (lit > 0.01 && big < 0.5) S.add(ctx, () => { glow(ctx, px, py, 460 * lit, [255, 200, 140], 0.26 * lit * (1 - big)); });
    PR.phone(ctx, px, py, s, { rot, on: lit, w: 230, h: 450, draw: (c, w, h) => {
      if (t < T.d05 - 0.3) { S.vgrad(c, [[0, [40, 30, 50]], [1, [20, 16, 30]]], 0, h, 0, w); c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.roundRect(8, h * 0.3, w - 16, 96, 18); c.fill(); K.text(c, '小美', 24, h * 0.3 + 34, { size: 24, family: 'ESSans', weight: 700, color: [255, 214, 150], align: 'left' }); K.text(c, '我需要你', 24, h * 0.3 + 76, { size: 34, family: 'ESSans', weight: 900, color: [255, 255, 255], align: 'left' }); return; }
      S.vgrad(c, [[0, [250, 246, 240]], [1, [236, 230, 222]]], 0, h, 0, w);
      // 下拉刷新：他刷了又刷（顶上一圈转动的弧）
      const refresh = [0, 1, 2].map(k => prog(t, T.d05 + 1.2 + k * 0.9, T.d05 + 1.7 + k * 0.9)).find(u => u > 0 && u < 1), dy = refresh ? Math.sin(refresh * Math.PI) * 40 : 0;
      if (refresh) { c.strokeStyle = 'rgb(240,140,90)'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.arc(w / 2, 22, 12, refresh * 12, refresh * 12 + 4.4); c.stroke(); }
      c.save(); c.translate(0, dy);
      c.fillStyle = 'rgb(240,140,90)'; c.beginPath(); c.arc(30, 30, 16, 0, 6.2832); c.fill(); K.text(c, '我', 30, 39, { size: 22, family: 'ESSans', weight: 900, color: [255, 255, 255] }); K.text(c, '今晚的饭局', 56, 40, { size: 24, family: 'ESSans', weight: 700, color: [60, 50, 50], align: 'left' });
      const pg = c.createLinearGradient(0, 56, 0, 230); pg.addColorStop(0, 'rgb(255,214,160)'); pg.addColorStop(1, 'rgb(220,130,100)'); c.fillStyle = pg; c.beginPath(); c.roundRect(10, 56, w - 20, 176, 12); c.fill();
      c.save(); c.beginPath(); c.roundRect(10, 56, w - 20, 176, 12); c.clip(); MB.person(c, 'enfp-female', w * 0.25, 236, 0.62, { shadow: 0 }); MB.person(c, 'entp-male', w * 0.75, 236, 0.62, { shadow: 0 }); ES.hero(c, w * 0.52, 240, 0.34, { umbrella: false, cake: false, book: false, eyes: 'happy', mouth: 'grin' }); c.restore();
      const likes = Math.min(4, Math.floor(Math.max(0, t - T.d05 - 0.3) / 0.8)) * (t < T.cold ? 1 : 0);
      for (let k = 0; k < 4; k++) { const pop = k < likes ? TP.back(prog(t, T.d05 + 0.3 + k * 0.8, T.d05 + 0.7 + k * 0.8)) : 0; const hx2 = 34 + k * 40, hy2 = 262; c.save(); c.translate(hx2, hy2); c.scale(Math.max(0.001, pop), Math.max(0.001, pop)); c.fillStyle = k < likes ? 'rgb(240,80,100)' : 'rgba(0,0,0,0)'; c.beginPath(); c.moveTo(0, 12); c.bezierCurveTo(-20, 0, -12, -15, 0, -5); c.bezierCurveTo(12, -15, 20, 0, 0, 12); c.fill(); c.restore(); }
      if (t < T.cold) K.text(c, likes + ' 个赞', 18, 318, { size: 30, family: 'ESSans', weight: 900, color: [200, 70, 80], align: 'left' });
      if (t > T.cold - 0.6) { const ca = smooth(prog(t, T.cold - 0.6, T.cold - 0.3)); c.fillStyle = rgba([255, 255, 255], ca); c.fillRect(0, 290, w, h - 290); c.fillStyle = rgba([150, 220, 140], ca); c.beginPath(); c.roundRect(w - 200, 306, 190, 56, 22); c.fill(); K.text(c, '都到家了吗？', w - 105, 344, { size: 28, family: 'ESSans', weight: 700, color: [30, 60, 30], alpha: ca }); K.text(c, '— 无人回复 —', w / 2, 410, { size: 26, family: 'ESSans', weight: 500, color: [150, 150, 160], alpha: smooth(prog(t, T.cold, T.cold + 0.6)) }); }
      c.restore();
    } }); }
  // D04：心跳光晕慢慢散开
  { const p = prog(t, T.up - 0.1, T.d04e + 1.2); if (p > 0 && p < 1) for (let k = 0; k < 2; k++) { const u = clamp(p * 1.6 - k * 0.4); if (u > 0 && u < 1) S.ring(ctx, R.chest[0], R.chest[1], 60 + u * 520, 30, [255, 200, 140], 0.2 * (1 - u)); } }
  // D06：杯子被碰倒（朋友回来时）
  const cupU = prog(t, T.err - 0.2, T.err + 0.6); if (comeBack > 0.01) { const fall = easeIn(clamp(cupU * 1.6)); ctx.save(); ctx.translate(820, TB - 40); ctx.rotate(fall * 1.5); ctx.globalAlpha = comeBack; PR.mug(ctx, 0, 0, 0.6, t, { c: [130, 180, 230], hot: 0 }); ctx.restore(); if (cupU > 0.6) { ctx.save(); ctx.globalAlpha = comeBack * smooth(prog(cupU, 0.6, 1)); ctx.fillStyle = 'rgba(150,190,230,0.55)'; ctx.beginPath(); ctx.ellipse(900, TB - 26, 110 * smooth(prog(cupU, 0.6, 1)), 14, 0, 0, 6.2832); ctx.fill(); ctx.restore(); } }
  ctx.restore();
  const na = K.vis(t, NA[0], NA[1], 0.45, 0.5);
  if (na > 0.003) S.group(ctx, na, c => NE.batch(c, () => neonLow(c, t)));
  return { C };
}
function over(ctx, t) {
  QT.draw(ctx, t, { y: 1090 });
  // D04「我需要你」：手机消息的特写插入（画面上方，暖光托着，弹出来）
  { const a = K.vis(t, T.need - 0.45, T.up + 0.2, 0.01, 0.35), p = prog(t, T.need - 0.45, T.need + 0.1); if (a > 0.003) { const sc = TP.back(p); ctx.save(); ctx.globalAlpha = a; S.add(ctx, () => glow(ctx, 540, 560, 520, [255, 190, 120], 0.3 * smooth(p))); ctx.translate(540, 560); ctx.rotate(-0.05); ctx.scale(sc, sc);
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16; ctx.fillStyle = 'rgb(28,26,36)'; ctx.beginPath(); ctx.roundRect(-300, -150, 600, 300, 44); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.beginPath(); ctx.roundRect(-284, -134, 568, 268, 32); ctx.fill(); ctx.fillStyle = 'rgb(240,140,90)'; ctx.beginPath(); ctx.arc(-206, -50, 40, 0, 6.2832); ctx.fill(); K.text(ctx, '美', -206, -36, { size: 40, family: 'ESSans', weight: 900, color: [255, 255, 255] });
    K.text(ctx, '小美', -146, -60, { size: 36, family: 'ESSans', weight: 700, color: [255, 214, 150], align: 'left' }); K.text(ctx, '刚刚', 260, -60, { size: 28, family: 'ESSans', weight: 500, color: [170, 170, 190], align: 'right' });
    ctx.restore(); TP.foil(ctx, '我需要你', 540 + 40, 620, { size: 84, family: 'ESSans', weight: 900, spacing: 0.06, p: prog(t, T.need - 0.2, T.need + 0.4), sweep: prog(t, T.need + 0.4, T.need + 1.3), a, top: [255, 255, 255], bot: [255, 214, 160], glowA: 0.35, shadow: 0 }); } }
  const say = (str, x, y, a0, a1, tx, ty, o = {}) => { const a = K.vis(t, a0, a1, 0.01, 0.3); if (a > 0.003) TP.bubble(ctx, str, x, y, { a, p: prog(t, a0, a0 + 0.45), tx, ty, size: 54, ...o }); };
  say('汤有点咸。', 330, 620, T.d02 - 0.1, T.d02 + 1.4, 240, 780);
  say('都怪我没放好！', 430, 640, T.self - 0.4, T.end - 0.3, 560, 820);
}
module.exports = { draw, over, T };
