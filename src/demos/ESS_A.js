'use strict';
// ESFJ v9 第 0 章「雨夜公交站」：A01–A04
//   场景：深夜下雨的公交站。玻璃候车亭（冷白顶灯）+ 右侧路灯（钠灯暖黄，主光源）+ 街对面被雨打虚的楼和店招；湿路面倒映灯光；前景雨帘、虚化的伞骨
//   A01 一个女孩缩着肩在等车，冻得发抖、呵着白气（镜头贴着她）。他撑伞从右边走进来，停一拍，说到「热水」时把一杯冒热气的杯子递到她手边，她身上的冷色一点点退掉
//   A02 镜头往后退、抬高：候车亭侧面的灯箱广告慢慢亮起来，是他自己的海报「ESFJ 供给者」
//   A03 男妈妈：他还没完 —— 又把自己的围巾绕到她脖子上，再从袋子里掏出一个便当盒塞给她；她被裹成一团，笑了。网友原话上屏
//   A04 车灯从左边扫进来，她上车；镜头升起来越过候车亭顶，他撑着伞往街对面那栋亮着暖灯的楼走，最后推进其中一扇窗（→ 下一章他的厨房）
const X = require('./ehk');
const S = require('./ESS_kit');
const PR = require('./ESS_props');
const QT = require('./ESS_quote');
const { K, ES, MB, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { a01: vs('A01'), hot: at('A01', '热水'), a02: vs('A02'), a03: vs('A03'), a03e: ve('A03'), a04: vs('A04'), end: vs('B01') };
const GY = 1250, HER = [470, GY], HIM = [820, GY], LAMP = [980, 300], SODIUM = [255, 186, 110], COOL = [200, 226, 255];
const CAM = [
  [0, { x: 30, y: -230, z: 2.1, ax: 540, ay: 1000 }], [T.hot - 0.9, { x: 60, y: -210, z: 1.9 }], [T.hot + 0.7, { x: 110, y: -140, z: 1.45 }],
  [T.a02 + 0.2, { x: 100, y: -130, z: 1.4 }], [T.a02 + 1.7, { x: -40, y: -40, z: 1.0 }], [T.a03 - 0.1, { x: -30, y: -50, z: 1.04 }], [T.a03e + 1.2, { x: 80, y: -130, z: 1.34 }], [T.a04 - 0.3, { x: 80, y: -130, z: 1.36 }], [T.a04 + 1.0, { x: 40, y: -60, z: 1.08 }],
];
// ---------- 预渲：街对面（雨夜、楼、店招，被雨打虚） ----------
const PAD = 300;
const FAR = S.lazy(() => S.bake(W + PAD * 2, 1400, c => {
  c.translate(PAD, 0); const r = mulberry32(5);
  S.vgrad(c, [[0, [10, 12, 28]], [0.5, [26, 26, 56]], [1, [60, 44, 70]]], 0, 1400, -PAD, W + PAD);
  for (let L = 0; L < 2; L++) for (let i = 0; i < 12; i++) {
    const w = 160 + r() * 140, x = -PAD + i * 150 + r() * 40 - L * 70, h = (L ? 700 : 1000) + r() * 300, top = 1300 - h, col = L ? [24, 24, 52] : [40, 34, 70];
    const g = c.createLinearGradient(0, top, 0, 1300); g.addColorStop(0, rgba(col)); g.addColorStop(1, rgba(mix(col, [110, 70, 90], 0.4))); c.fillStyle = g; c.fillRect(x, top, w, h);
    S.add(c, () => { for (let yy = top + 30; yy < 1180; yy += 56) for (let xx = x + 16; xx < x + w - 30; xx += 44) if (r() < (L ? 0.2 : 0.12)) { const wc = r() < 0.8 ? [255, 196, 120] : [170, 210, 255]; c.fillStyle = rgba(wc, 0.5 + r() * 0.4); c.fillRect(xx, yy, 24, 32); glow(c, xx + 12, yy + 16, 50, wc, 0.25); } });
  }
  // 一楼的店：暖色招牌和橱窗
  for (let i = 0; i < 5; i++) { const x = -PAD + 60 + i * 340, col = [[255, 120, 110], [255, 200, 110], [120, 220, 200], [255, 160, 210], [150, 190, 255]][i]; c.fillStyle = 'rgb(255,214,160)'; c.fillRect(x, 1120, 230, 170); S.add(c, () => { glow(c, x + 115, 1200, 240, [255, 190, 120], 0.45); glow(c, x + 115, 1090, 160, col, 0.6); }); c.fillStyle = rgba(col); c.fillRect(x + 20, 1070, 190, 40); }
  c.filter = 'blur(16px)'; c.drawImage(c.canvas, 0, 0); c.filter = 'none';
}));
const RAINFG = mulberry32(9);
// 候车亭：顶棚 + 玻璃 + 长凳 + 灯箱（灯箱内容 lit 时亮）
function shelter(ctx, t, ad) {
  // 后玻璃（透出街景，雨水往下流）
  ctx.save(); ctx.fillStyle = 'rgba(160,190,230,0.10)'; ctx.fillRect(40, 520, 900, 690);
  S.add(ctx, () => { for (let i = 0; i < 30; i++) { const ph = (t * (0.06 + hash(i) * 0.1) + hash(i * 3)) % 1, x = 50 + hash(i * 7) * 880, y = 520 + ph * 700; const g = ctx.createLinearGradient(0, y - 60, 0, y); g.addColorStop(0, 'rgba(220,230,255,0)'); g.addColorStop(1, 'rgba(220,230,255,0.35)'); ctx.fillStyle = g; ctx.fillRect(x - 2, y - 60, 4, 60); glow(ctx, x, y, 7, [230, 240, 255], 0.8); } });
  ctx.restore();
  // 立柱、顶棚
  const steel = (x, y, w, h) => { const g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, 'rgb(40,46,60)'); g.addColorStop(0.5, 'rgb(130,140,160)'); g.addColorStop(1, 'rgb(30,34,48)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); };
  steel(30, 470, 24, 780); steel(930, 470, 24, 780);
  ctx.fillStyle = 'rgb(34,38,52)'; ctx.beginPath(); ctx.moveTo(-60, 470); ctx.lineTo(1040, 470); ctx.lineTo(1080, 430); ctx.lineTo(-100, 430); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(200,220,255,0.5)'; ctx.fillRect(-60, 466, 1100, 4);
  // 顶灯（冷白）
  ctx.fillStyle = 'rgb(236,244,255)'; ctx.fillRect(200, 472, 560, 12); S.add(ctx, () => { glow(ctx, 480, 490, 620, COOL, 0.22); });
  // 长凳
  ctx.fillStyle = 'rgb(60,50,50)'; ctx.fillRect(400, 1060, 480, 26); ctx.fillStyle = 'rgb(90,70,60)'; ctx.fillRect(390, 1040, 500, 24); ctx.fillStyle = 'rgb(40,40,52)'; ctx.fillRect(430, 1086, 16, 160); ctx.fillRect(830, 1086, 16, 160);
  // 灯箱：右侧
  const bx = 60, by = 560, bw = 300, bh = 560;
  ctx.fillStyle = 'rgb(30,32,44)'; ctx.fillRect(bx - 14, by - 14, bw + 28, bh + 28);
  const g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, rgba(mix([30, 34, 50], [255, 230, 190], ad))); g.addColorStop(1, rgba(mix([24, 26, 40], [255, 180, 120], ad))); ctx.fillStyle = g; ctx.fillRect(bx, by, bw, bh);
  if (ad > 0.01) { ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip(); ctx.globalAlpha = ad; ES.hero(ctx, bx + 150, by + bh + 60, 0.62, { umbrella: true, cake: true, eyes: 'happy', mouth: 'grin' });
    const sh = ctx.createLinearGradient(0, by, 0, by + bh); sh.addColorStop(0, 'rgba(255,240,210,0)'); sh.addColorStop(1, 'rgba(255,190,120,0.45)'); ctx.fillStyle = sh; ctx.fillRect(bx, by, bw, bh); ctx.restore();
    S.add(ctx, () => glow(ctx, bx + bw / 2, by + bh / 2, 560, [255, 200, 140], 0.36 * ad)); }
}
function wetRoad(ctx, t) {
  S.vgrad(ctx, [[0, [70, 70, 96]], [1, [40, 40, 64]]], GY - 6, GY + 50, -PAD, W + PAD);
  ctx.fillStyle = 'rgb(140,140,160)'; ctx.fillRect(-PAD, GY + 50, W + PAD * 2, 8);
  S.vgrad(ctx, [[0, [22, 22, 40]], [1, [6, 6, 16]]], GY + 58, H + 200, -PAD, W + PAD);
  // 路面倒影：路灯和店招拉长的光
  S.add(ctx, () => { for (const [x, c, w] of [[LAMP[0] - 10, SODIUM, 120], [480, COOL, 260], [1110, [255, 200, 140], 160], [-120, [255, 140, 120], 120], [200, [120, 220, 200], 90]]) for (let k = 0; k < 10; k++) S.rgrad(ctx, x + Math.sin(t * 2 + k) * 6, GY + 90 + k * 46, w * (1 - k * 0.06), [[0, c, 0.16 - k * 0.012], [1, c, 0]], 0.12); });
  for (let i = 0; i < 18; i++) { const ph = (t * 1.4 + hash(i * 3.1)) % 1, rx = hash(i * 7.7 + Math.floor(t * 1.4 + hash(i * 3.1))) * W, ry = GY + 100 + hash(i * 5.3) * 360; S.ring(ctx, rx, ry, 6 + ph * 50, 5, [200, 210, 255], 0.3 * (1 - ph), 0.25); }
}
function streetLamp(ctx) {
  const [x, y] = LAMP; const g = ctx.createLinearGradient(x - 10, 0, x + 10, 0); g.addColorStop(0, 'rgb(30,30,44)'); g.addColorStop(0.5, 'rgb(90,90,110)'); g.addColorStop(1, 'rgb(24,24,36)');
  ctx.fillStyle = g; ctx.fillRect(x + 60, y, 18, GY - y); ctx.strokeStyle = 'rgb(60,60,80)'; ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(x + 68, y + 10); ctx.quadraticCurveTo(x + 60, y - 40, x, y - 20); ctx.stroke();
  ctx.fillStyle = 'rgb(50,50,66)'; ctx.beginPath(); ctx.ellipse(x, y - 14, 50, 16, 0, 0, 6.2832); ctx.fill();
  S.add(ctx, () => { glow(ctx, x, y, 700, SODIUM, 0.28); glow(ctx, x, y, 150, [255, 230, 190], 0.7); });
  // 光锥里的雨
  ctx.save(); ctx.beginPath(); ctx.moveTo(x - 40, y); ctx.lineTo(x + 40, y); ctx.lineTo(x + 420, GY); ctx.lineTo(x - 420, GY); ctx.closePath(); ctx.clip();
  S.add(ctx, () => { const g2 = ctx.createLinearGradient(0, y, 0, GY); g2.addColorStop(0, rgba(SODIUM, 0.22)); g2.addColorStop(1, rgba(SODIUM, 0.03)); ctx.fillStyle = g2; ctx.fillRect(x - 440, y, 880, GY - y); });
  ctx.restore();
}
// 街对面的居民楼（中景，看得清：窗框、窗帘、阳台、空调外机）；目标窗 TW 是他家
const TW = [700, 170], WW = 150, WH = 190;
const MIDB = S.lazy(() => S.bake(900, 1500, c => {
  const r = mulberry32(31);
  const g = c.createLinearGradient(0, 0, 900, 0); g.addColorStop(0, 'rgb(46,44,74)'); g.addColorStop(0.7, 'rgb(36,34,62)'); g.addColorStop(1, 'rgb(22,22,44)'); c.fillStyle = g; c.fillRect(0, 0, 900, 1500);
  for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) {
    const x = 70 + i * 210, y = 40 + j * 230;
    c.fillStyle = 'rgb(26,24,46)'; c.fillRect(x - 12, y - 12, WW + 24, WH + 24);
    const on = r() < 0.32, wc = r() < 0.8 ? [255, 196, 124] : [180, 210, 255];
    const wg = c.createLinearGradient(0, y, 0, y + WH); wg.addColorStop(0, on ? rgba(mix(wc, [255, 255, 255], 0.2)) : 'rgb(44,48,84)'); wg.addColorStop(1, on ? rgba(mix(wc, [180, 90, 60], 0.3)) : 'rgb(24,26,52)'); c.fillStyle = wg; c.fillRect(x, y, WW, WH);
    if (on) { c.fillStyle = 'rgba(120,60,50,0.35)'; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 46, y); c.quadraticCurveTo(x + 36, y + 110, x, y + 170); c.fill(); S.add(c, () => glow(c, x + WW / 2, y + WH / 2, 200, wc, 0.25)); }
    c.fillStyle = 'rgb(26,24,46)'; c.fillRect(x + WW / 2 - 4, y, 8, WH); c.fillStyle = 'rgb(70,66,100)'; c.fillRect(x - 18, y + WH + 8, WW + 36, 12);
    if (r() < 0.4) { c.fillStyle = 'rgb(80,84,110)'; c.fillRect(x + WW + 10, y + WH - 60, 50, 50); }
  }
}));
// 第 6 章复用同一个公交站：只画环境（不含人物），o.city 让对面楼的窗一扇扇亮起暖光
function scene(ctx, t, C, o = {}) {
  const { ad = 1, city = 0, myWin = 1 } = o;
  ctx.save(); S.cam(ctx, C, 0.35); ctx.drawImage(FAR(), -PAD, -120); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.6); ctx.drawImage(MIDB(), 400, -900);
  if (city > 0.01) for (let j = 0; j < 7; j++) for (let i = 0; i < 4; i++) { if (hash(i * 3 + j * 7 + 11) < 0.45) continue; const on = smooth(prog(city, hash(i * 3 + j * 7) * 0.7, hash(i * 3 + j * 7) * 0.7 + 0.3)); if (on <= 0.01) continue; const x = 400 + 70 + i * 210, y = -900 + 40 + j * 230; const wg = ctx.createLinearGradient(0, y, 0, y + WH); wg.addColorStop(0, rgba([255, 226, 170], on)); wg.addColorStop(1, rgba([255, 170, 110], on)); ctx.fillStyle = wg; ctx.fillRect(x, y, WW, WH); ctx.fillStyle = 'rgb(26,24,46)'; ctx.fillRect(x + WW / 2 - 4, y, 8, WH); S.add(ctx, () => glow(ctx, x + WW / 2, y + WH / 2, 280, [255, 196, 124], 0.4 * on)); }
  ctx.restore();
  ctx.save(); S.cam(ctx, C, 1); wetRoad(ctx, t); streetLamp(ctx); shelter(ctx, t, ad); ctx.restore();
}
function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  // A04：她上车，车开走；他挥挥手往街对面走；镜头升起来，推进对面楼他家那扇窗
  const up = easeInOut(prog(t, T.a04 + 2.0, T.end - 1.6)), push = easeIn(prog(t, T.end - 2.1, T.end - 0.2));
  C.y -= up * 760; C.z = lerp(C.z, 0.95, up);
  ctx.fillStyle = 'rgb(10,12,28)'; ctx.fillRect(0, 0, W, H);
  ctx.save();
  if (push > 0) { const C0 = { ...C }, wp = S.w2s(C0, TW[0], TW[1], 0.6), z = 1 + 9 * push * push; ctx.translate(lerp(wp[0], 540, push), lerp(wp[1], 820, push)); ctx.scale(z, z); ctx.translate(-wp[0], -wp[1]); }
  ctx.save(); S.cam(ctx, C, 0.35); ctx.drawImage(FAR(), -PAD, -120); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.6); ctx.drawImage(MIDB(), 400, -900);
  { const on = smooth(prog(t, T.a04 + 1.6, T.a04 + 2.6)), x = TW[0] - WW / 2, y = TW[1] - WH / 2; const wg = ctx.createLinearGradient(0, y, 0, y + WH); wg.addColorStop(0, rgba(mix([44, 48, 84], [255, 226, 170], on))); wg.addColorStop(1, rgba(mix([24, 26, 52], [255, 170, 110], on))); ctx.fillStyle = wg; ctx.fillRect(x, y, WW, WH);
    ctx.fillStyle = `rgba(200,90,80,${0.6 * on})`; ctx.fillRect(x, y, 34, WH); ctx.fillRect(x + WW - 34, y, 34, WH); ctx.fillStyle = 'rgb(26,24,46)'; ctx.fillRect(x + WW / 2 - 4, y, 8, WH);
    ctx.fillStyle = `rgba(80,150,100,${on})`; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.ellipse(x + 40 + k * 14, y + WH - 14 - (k % 2) * 8, 12, 6, k, 0, 6.2832); ctx.fill(); }
    S.add(ctx, () => { glow(ctx, TW[0], TW[1], 300, [255, 196, 124], 0.5 * on); }); }
  ctx.restore();
  ctx.save(); S.cam(ctx, C, 1);
  wetRoad(ctx, t);
  streetLamp(ctx);
  const ad = smooth(prog(t, T.a02 + 0.1, T.a02 + 1.3));
  shelter(ctx, t, ad);
  // 她：冷得发抖 → 暖起来；A04 上车离开
  const warm = smooth(prog(t, T.hot + 0.1, T.hot + 1.6)), leave = easeIn(prog(t, T.a04 + 0.5, T.a04 + 1.3)), bus = prog(t, T.a04 - 0.2, T.a04 + 2.6);
  const shiver = (1 - warm) * Math.sin(t * 34) * 0.012, hx = HER[0] - leave * 520;
  if (leave < 1) S.lit(ctx, c => MB.person(c, 'istj-female', hx, GY, 2.5, { lean: shiver, gray: 0.55 * (1 - warm), warm: 0.6 * warm, a: 1 - smooth(prog(leave, 0.6, 1)) }), { light: warm > 0.4 ? [HIM[0], 700] : [480, 480], at: [hx, GY - 300], r: 340, warm: warm > 0.4 ? [255, 214, 160] : COOL, cool: [10, 12, 40], k: 1.0 });
  // 呵出的白气（冷的时候）
  if (warm < 0.95) for (let k = 0; k < 2; k++) { const ph = (t * 0.6 + k * 0.5) % 1; S.rgrad(ctx, hx + 120 + ph * 60, GY - 520 - ph * 40, 26 + ph * 50, [[0, [236, 240, 250], 0.4 * (1 - ph) * (1 - warm)], [1, [236, 240, 250], 0]]); }
  // 他：撑伞走进来 → 停一拍 → 递杯子 → 围巾 → 便当 → A04 往街对面走
  const walkIn = easeOut(prog(t, T.a01 + 0.2, T.hot - 0.7)), give = easeInOut(prog(t, T.hot - 0.35, T.hot + 0.4)), back = smooth(prog(t, T.hot + 1.4, T.hot + 2.2));
  const sc = smooth(prog(t, T.a03 - 0.2, T.a03 + 0.6)), lb = easeInOut(prog(t, T.a03 + 0.9, T.a03e + 0.2)), walkOut = easeIn(prog(t, T.a04 + 2.0, T.end - 0.4)), wave = K.vis(t, T.a04 + 1.3, T.a04 + 2.3, 0.25, 0.3);
  const mx = lerp(1300, HIM[0], walkIn) + walkOut * 700, step = walkIn < 1 ? Math.abs(Math.sin(walkIn * Math.PI * 5)) * 10 : walkOut > 0 ? Math.abs(Math.sin(walkOut * Math.PI * 6)) * 10 : 0;
  const reach = Math.max(give * (1 - back), sc * (1 - smooth(prog(t, T.a03 + 0.6, T.a03 + 0.9))), lb * (1 - smooth(prog(t, T.a03e + 0.3, T.a03e + 0.8))));
  const o = { t, flip: walkOut <= 0, umbrella: true, cake: false, book: false, um: -0.25 + 0.15 * reach, rs: -1.1 * reach - 2.2 * wave, re: -0.35 * reach - 0.6 * wave + 0.3 * Math.sin(t * 9) * wave, eyes: walkIn < 1 ? 'open' : 'happy', mouth: 'smile', lean: -0.05 * reach, bob: step, warm: 0.3 };
  const R = S.lit(ctx, c => ES.hero(c, mx, GY, 1.06, o), { light: LAMP, at: [mx, GY - 300], r: 340, warm: [255, 214, 160], cool: [20, 20, 50], k: 0.95 });
  // 杯子：在他手里 → 到她手边
  const herHand = [hx + 70, GY - 262];
  if (t < T.a04 + 0.6 && walkIn > 0.6) { const p = give < 1 ? [lerp(R.hand[0], herHand[0], give * 0.0), 0] : null; const cx = give < 1 ? R.hand[0] : herHand[0], cy = give < 1 ? R.hand[1] : herHand[1]; PR.mug(ctx, cx, cy + 40, 0.68, t, { c: [240, 130, 96], hot: 1 }); if (warm > 0.01 && warm < 1) S.add(ctx, () => glow(ctx, herHand[0], herHand[1] - 30, 320 * warm, [255, 190, 120], 0.35 * (1 - warm * 0.6))); }
  // 围巾：从他手里绕到她脖子上
  if (sc > 0.01 && leave < 1) { const s0 = smooth(prog(t, T.a03 + 0.2, T.a03 + 0.7)), sx = lerp(R.hand[0], hx + 30, s0), sy = lerp(R.hand[1], GY - 470, s0); PR.scarf(ctx, sx, sy, 0.9, t, { c: [214, 72, 70], sway: 1 }); }
  // 便当盒：塞进她怀里
  if (lb > 0.01 && leave < 1) { const lx = lerp(R.hand[0], hx + 40, lb), ly = lerp(R.hand[1] + 30, GY - 236, lb) - Math.sin(lb * Math.PI) * 60; PR.lunchbox(ctx, lx, ly, 0.6, { lid: 1, c: [96, 180, 170] }); }
  ctx.restore();
  // 公交车：不画车身，只有车灯 —— 两团白光从左边扫进来、停在她面前（她被光包住、走进光里），再往右开走
  if (bus > 0 && bus < 1) { ctx.save(); S.cam(ctx, C, 1); const bx = lerp(-600, 260, easeOut(clamp(bus * 2.2))) + easeIn(clamp(bus * 1.8 - 0.9)) * 1800, a = smooth(clamp(bus * 6)) * (1 - smooth(clamp(bus * 4 - 3)));
    S.add(ctx, () => { glow(ctx, bx, GY - 200, 1000, [255, 240, 210], 0.5 * a); glow(ctx, bx - 60, GY - 110, 150, [255, 252, 240], 0.9 * a); glow(ctx, bx + 120, GY - 110, 110, [255, 252, 240], 0.8 * a);
      for (let k = 0; k < 8; k++) S.rgrad(ctx, bx + 40, GY + 80 + k * 50, 260 - k * 14, [[0, [255, 240, 210], 0.22 * a], [1, [255, 240, 210], 0]], 0.12); });
    ctx.restore(); }
  // 前景：雨帘（三层，近的粗而虚）
  S.rain(ctx, t, { a: 0.85, n: 110 });
  ctx.restore();
  return { C };
}
function over(ctx, t) {
  QT.draw(ctx, t, { y: 230 });
  // A02：灯箱上的字（物件上的字，跟着镜头）
  const ad = smooth(prog(t, T.a02 + 0.1, T.a02 + 1.3));
  if (ad > 0.01) { const C = S.camKF(t, CAM), p = S.w2s(C, 210, 650); ctx.save(); ctx.globalAlpha = ad; const s = C.z; K.text(ctx, 'ESFJ', p[0], p[1], { size: 64 * s, family: 'Latin', weight: 600, color: [120, 60, 40], spacing: 0.12 }); K.text(ctx, '供给者', p[0], p[1] + 64 * s, { size: 46 * s, weight: 700, color: [140, 70, 50], spacing: 0.3 }); ctx.restore(); }
}
module.exports = { draw, over, T, scene };
