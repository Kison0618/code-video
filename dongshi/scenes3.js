// scenes3.js — v3 新场景（场景时间 = 成片时间 + S3；这里函数收到的 t 就是成片时间）
// 四种样子 59.7–75.8 / 情感孤独 75.8–104.25 / 懂事的代价 + 治愈型幻想（同一间屋子）104.25–140.5 / 面具裂开 144.4–160
// 要在 scenes.js 之前载入（老场景的镜头表接着用这里的 CAM3H / CAM3V）；用到的 scenes.js 里的函数和常量都只在运行时调用
'use strict';
const CAM3H = [[S3 + 59.7, 990, 540, 1], [S3 + 75.79, 990, 540, 1],
  [S3 + 75.795, 960, 550, 1], [S3 + 94.96, 1040, 565, 1.1], [S3 + 94.965, 1290, 590, 1.24], [S3 + 104.24, 1290, 600, 1.32],
  [S3 + 104.25, 960, 545, 1], [S3 + 127.6, 1000, 530, 1.08], [S3 + 140.45, 975, 515, 1],
  [S3 + 144.4, 960, 535, 1.04], [S3 + 159.97, 930, 545, 1.12]];
const CAM3V = [[S3 + 59.7, 960, 772, .94], [S3 + 75.79, 960, 772, .94],
  [S3 + 75.795, 960, 600, 1.0], [S3 + 94.96, 1000, 605, 1.07], [S3 + 94.965, 1290, 560, 1.3], [S3 + 104.24, 1290, 570, 1.36],
  [S3 + 104.25, 960, 560, 1.18], [S3 + 127.6, 985, 555, 1.26], [S3 + 140.45, 965, 520, 1.15],
  [S3 + 144.4, 960, 545, 1.22], [S3 + 159.97, 900, 560, 1.3]];

function dim3(t) {
  if (t < 59.7) return 0;
  if (t < 75.795) return 1;                                                   // 四种样子（进出靠 CUTS）
  if (t < 95.415) return 1 - eio(pr(t, 94.45, 94.965));                       // 情感孤独；大字前 0.45 秒黑
  if (t < 104.25) return eo(pr(t, 95.415, 95.75)) * (1 - eio(pr(t, 102.9, 104.2)));   // 孤独没有伤口 → 第一遍音乐结束
  if (t < 140.5) return eo(pr(t, 104.55, 105.6));                             // 第二遍：同一间屋子
  if (t < 144.4) return 0;
  if (t < 159.975) return 1 - eio(pr(t, 159.45, 159.975));                    // 面具裂开 → 大字前 0.45 秒黑
  return 0;
}
function scenes3(t) {
  if (t >= 59.7 && t < 75.795) sceneTypes(t);
  else if (t >= 75.795 && t < 104.25) sceneLone(t);
  else if (t >= 104.25 && t < 140.5) sceneHome(t);
  else if (t >= 144.4 && t < 159.975) sceneMask(t);
}

// ===================== 四种样子（成片 59.7–75.8，素材来自 v1） =====================
// 59.9 一个大人分成四个（常常混着来）→ 62.715 / 65.44 / 68.165 / 70.89 依次亮出四种样子 → 73.615 大人散成光尘，只剩四个孩子胸口一点冰蓝
const TY = V ? { fy: [560, 560, 1150, 1150], px: [640, 1120, 640, 1120], kx: [770, 1250, 770, 1250], ph: 290, kh: 125, o: [960, 900, 400] }
             : { fy: [720, 720, 720, 720], px: [360, 740, 1120, 1500], kx: [485, 865, 1245, 1625], ph: 330, kh: 140, o: [990, 720, 420] };
const TYI = [62.715, 65.44, 68.165, 70.89];
const TYPES = [
  { P: PO.storm, en: 'EMOTIONAL', zh: '情绪型' }, { P: PO.point, en: 'DRIVEN', zh: '驱动型' },
  { P: PO.passive, en: 'PASSIVE', zh: '消极型', turn: 1, dash: 1 }, { P: PO.cross, en: 'REJECTING', zh: '拒绝型', turn: 1 },
];
function sceneTypes(t) {
  const c = sx, T = TY, gone = eio(pr(t, 73.8, 75.0)), pa = 1 - pr(t, 74.2, 75.2);
  (V ? [560, 1150] : [720]).forEach(y => floorLine(c, y, V ? 420 : 160, V ? 1500 : 1820, eo(pr(t, 59.7, 60.5)), 1));
  TYPES.forEach((ty, i) => {
    const u = eio(pr(t, 60.95 + i * .07, 61.8 + i * .07)), ti = TYI[i], on = eo(pr(t, ti, ti + .4));
    const x = lerp(T.o[0], T.px[i], u), y = lerp(T.o[1], T.fy[i], u), h = lerp(T.o[2], T.ph, u), fy = T.fy[i];
    const a = lerp(lerp(.32, .5, u), 1, on) * pa, P = lerpPose(PO.stand, ty.P, eio(pr(t, ti, ti + .55)));
    const tu = ty.turn ? eio(pr(t, ti + .2, ti + .5)) : 0, rim = ty.dash ? mixC(C.silver, C.gray, .25) : C.silver;
    const F = { kind: 'adult', P, x, y, h, rim, sparse: ty.dash && t > ti + .1, refl: fy, scatter: gone, draw: t < 60.7 ? pr(t, 59.75, 60.7) : undefined };
    if (a > 0) { if (tu < 1) drawFig({ ...F, dir: 1, a: a * (1 - tu) }); if (tu > 0) drawFig({ ...F, dir: -1, a: a * tu }); }
    // 孩子：跟着每一种样子出现；73.615 起低下头，胸口只剩一点冰蓝
    const kd = pr(t, ti + .25, ti + 1.25); if (kd <= 0) return;
    const lone = eio(pr(t, 73.7, 74.5)), KP = lerpPose(PO.stand, PO.bow, lone), krim = mixC(mixC(C.silver, C.gray, .35), mixC(C.ice, C.gray, .5), lone);
    const kx = T.kx[i], GK = drawFig({ kind: 'child', P: KP, x: kx, y: fy, h: T.kh, dir: -1, rim: krim, draw: kd < 1 ? kd : undefined, refl: fy });
    chestDot(c, GK, C.ice, .85 * eo(pr(t, 73.9 + i * .08, 74.4 + i * .08)), 4.5);
    const mid = (x + kx) / 2;
    if (i === 0 && t > ti + .2) {   // 情绪型：头顶一场随时会来的暴雨
      const ca = eo(pr(t, ti + .2, ti + .7)) * pa, cy = fy - T.ph - 70, s = .46, [x0, x1, yb] = cloudSpan(mid, cy, s);
      rain(c, t, { x0, x1, y0: yb, y1: fy, n: 30, sp: 1100, a: ca * .75 });
      cloud(c, mid, cy, s, ca, t);
    }
    if (i === 1) {                   // 驱动型：一直在打分
      const top = fy - T.kh - 14;
      [['72', 65.985, 34, -30, 30, C.silver], ['88', 66.53, 70, -70, 30, C.silver], ['59', 67.075, 98, -4, 40, C.red]].forEach(([s, t0, dx, dy, sz, col]) => {
        const v = eo(pr(t, t0, t0 + .35)) * pa; if (v <= 0) return;
        c.font = `500 ${sz}px ${FS.mono}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgba(col, v * .95);
        c.fillText(s, kx + dx, top + dy - 14 * v - 4 * pr(t, t0, 76)); c.textAlign = 'left';
      });
    }
    if (i === 2 && t > ti + .6) {    // 消极型：陪你玩，出了事却不在 → 孩子头顶的小雨没人挡
      const ca = eo(pr(t, ti + .6, ti + 1.1)) * pa, cy = fy - T.kh - 58, s = .2, [x0, x1, yb] = cloudSpan(kx, cy, s);
      rain(c, t, { x0, x1, y0: yb, y1: fy, n: 9, sp: 900, a: ca * .7, len: 22 });
      cloud(c, kx, cy, s, ca, t);
    }
    if (i === 3) bricks(c, mid + 4, fy, 34, T.ph * .72, eio(pr(t, ti + .2, ti + 1.2)), C.ice, pa);   // 拒绝型：一堵墙
  });
}
function typeLabels(t) {   // 屏幕层的清晰小字：英文 + 中文
  if (t < TYI[0] + .4 || t > 73.9) return;
  TYPES.forEach((ty, i) => {
    const a = eo(pr(t, TYI[i] + .4, TYI[i] + .9)) * (1 - pr(t, 73.4, 73.9)); if (a <= 0) return;
    const [x, y] = w2s((TY.px[i] + TY.kx[i]) / 2, TY.fy[i] + 46);
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `500 20px ${FS.mono}`; ctx.fillStyle = rgba(C.gray, .95 * a); ctx.fillText(ty.en.split('').join(' '), x, y);
    ctx.font = `500 34px ${FS.sans}`; ctx.fillStyle = rgba(i === 0 ? C.ice : C.lamp, a); ctx.fillText(ty.zh, x, y + 42);
    ctx.textAlign = 'left';
  });
}

// ===================== 情感孤独（成片 75.8–104.25） =====================
// 75.795 一家人在灯下的桌边，孩子站在光外面 → 78.52 一圈冰蓝的光把他隔开 → 85.06 桌上的饭菜、脚边的礼物都亮着暖光 → 87.785 孩子低下头
// → 95.415 大字：只剩孩子和一圈光环 → 99.775 抬头，胸口亮起一点金色（想了一个办法）
const LN = { fy: 780, t0: 560, t1: 1100, top: 640, fa: 660, mo: 990, kx: 1300, lx: 825 };
const loneKid = t => ({ kind: 'child', P: poseSeq(t, [[0, { ...PO.stand, hd: 4 }], [87.95, PO.bow, .9], [99.9, { ...PO.stand, hd: -8, aN: 4, aF: -4 }, .8]]), x: LN.kx, y: LN.fy, h: 230, dir: -1,
  rim: mixC(mixC(mixC(C.ice, C.silver, .4), C.gray, .35), C.ice, .5 * eo(pr(t, 95.415, 96.2))), refl: LN.fy });
function lonePt(t) { const p = figGeom(loneKid(t)).at('chest'); return w2s(p[0], p[1]); }
function table(c, x0, x1, top, fy, a) {
  c.save(); c.globalAlpha = a; c.fillStyle = rgba(C.body); c.strokeStyle = rgba(C.silver, .65); c.lineWidth = 2;
  c.fillRect(x0, top, x1 - x0, 14); c.strokeRect(x0, top, x1 - x0, 14);
  for (const lx of [x0 + 34, x1 - 34]) { c.fillRect(lx - 5, top + 14, 10, fy - top - 14); seg(c, lx - 5, top + 14, lx - 5, fy, C.silver, .5, 2); seg(c, lx + 5, top + 14, lx + 5, fy, C.silver, .5, 2); }
  c.restore();
}
function thing(c, kind, x, y, a, g) {   // 桌上 / 脚边亮着暖光的东西：碗（冒热气）、杯子、礼物、皮球；y = 放东西的面
  if (a <= 0) return; const col = mixC(C.lamp, C.gold, .6 * g);
  glow(c, x, y - 26, 95, C.gold, .22 * g * a);
  c.save(); c.globalAlpha = a; c.fillStyle = rgba(C.body); c.strokeStyle = rgba(col, .95); c.lineWidth = 2.4; c.lineCap = 'round';
  if (kind === 'bowl') {
    c.beginPath(); c.arc(x, y - 30, 32, 0, Math.PI); c.closePath(); c.fill(); c.stroke();
    for (let k = 0; k < 3; k++) { const ph = PX.t * 1.4 + k * 2.1; c.beginPath(); for (let j = 0; j <= 12; j++) { const u = j / 12, yy = y - 40 - u * 62, xx = x - 14 + k * 14 + Math.sin(ph + u * 5) * 5; j ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
      c.strokeStyle = rgba(C.lamp, .4 * g); c.lineWidth = 1.6; c.stroke(); }
  } else if (kind === 'cup') {
    rrect(c, x - 14, y - 38, 28, 38, 5); c.fill(); c.stroke(); c.beginPath(); c.arc(x + 14, y - 20, 9, -Math.PI / 2, Math.PI / 2); c.stroke();
  } else if (kind === 'gift') {
    c.fillRect(x - 26, y - 46, 52, 46); c.strokeRect(x - 26, y - 46, 52, 46); seg(c, x - 30, y - 46, x + 30, y - 46, col, .95, 2.4); seg(c, x, y - 46, x, y, col, .95, 2.4);
    for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * 11, y - 54, 11, 7, s * .5, 0, Math.PI * 2); c.stroke(); }
  } else if (kind === 'ball') {
    c.beginPath(); c.arc(x, y - 21, 21, 0, Math.PI * 2); c.fill(); c.stroke(); c.beginPath(); c.arc(x - 28, y - 21, 30, -.75, .75); c.stroke();
  }
  c.restore();
}
function iceRing(c, t, x, y, r, a) {   // 把孩子和别人隔开的一圈冰蓝虚线光（慢慢转）
  if (a <= 0) return; PX.useM(c);
  for (let i = 0; i < 180; i++) { const an = i / 180 * Math.PI * 2 + PX.t * .12, m = .5 + .5 * Math.sin(i * .55 - PX.t * 2.4);
    PX.pt(x + Math.cos(an) * r, y + Math.sin(an) * r * .92, C.ice, a * 1.1 * m * m, .4); }
  PX.flush(c);
}
function sceneLone(t) {
  const c = sx, L = LN, fy = L.fy, big = t >= 94.965;
  const fam = big ? 0 : lerp(1, .55, eio(pr(t, 90.6, 93.4))), og = big ? 0 : eo(pr(t, 85.06, 85.5)) * lerp(1, .3, eio(pr(t, 90.6, 93.2)));
  if (!big) {
    lampPool(c, L.lx, 430, 760, 1);
    lampCone(c, L.lx, -60, fy + 40, 70, 560, .85);
    glow(c, L.lx, 410, 220, C.lamp, .14 * fam);    // 大人之间那一点暖：说话、吃饭，都在灯下
  }
  floorLine(c, fy, big ? 1000 : 300, big ? 1600 : 1640, big ? .6 : 1, 1);
  motes(t, big ? L.kx : L.lx, 440, big ? 380 : 620, 330, big ? 70 : 130, C.lamp, big ? .45 : .8);
  if (!big) {
    drawFig({ kind: 'adult', P: poseSeq(t, [[0, PO.holdA], [80.5, { ...PO.holdA, hd: 12 }, 1.2]]), x: L.fa, y: fy, h: 450, dir: 1, rim: mixC(C.silver, C.lamp, .5), a: fam, refl: fy });
    drawFig({ kind: 'adult', P: poseSeq(t, [[0, { ...PO.reach, hd: 8 }], [82.0, { ...PO.holdA, hd: 6 }, 1.2]]), x: L.mo, y: fy, h: 420, dir: -1, rim: mixC(C.silver, C.lamp, .5), a: fam, refl: fy });
    table(c, L.t0, L.t1, L.top, fy, fam);
    // 我什么都不缺：饭菜、杯子、礼物、皮球，一拍一样亮起来
    [['bowl', 770, L.top, 85.06], ['bowl', 880, L.top, 85.605], ['cup', 1030, L.top, 86.15], ['gift', 1185, fy, 86.695], ['ball', 1400, fy, 87.24]].forEach(([k, x, y, t0]) => {
      const v = eo(pr(t, t0, t0 + .35)); if (v > 0) { thing(c, k, x, y, v * (k === 'bowl' || k === 'cup' ? fam : 1), og); ringPulse(c, t, t0, x, y - 26, 8, 70, C.gold, .7, .45); } });
  }
  // 孩子：站在灯光外面；胸口一点冰蓝
  const F = loneKid(t), G = drawFig(F), p = G.at('chest');
  const sad = lerp(1, .55, eio(pr(t, 88.0, 89.0))) * (.85 + .15 * Math.sin(PX.t * 9) * win(t, 88.0, 94.4, .3, .3));
  const ia = big ? lerp(1, 0, eio(pr(t, 100.4, 101.4))) : eo(pr(t, 76.1, 76.6)) * .75 * sad;
  chestDot(c, G, C.ice, ia, big ? 6 : 4.5);
  const ra = big ? .9 * (1 - eio(pr(t, 100.5, 101.8))) : eo(pr(t, 78.6, 79.7)) * (.55 + .25 * win(t, 88.0, 94.4, .5, .5)) * (1 - eio(pr(t, 94.2, 94.9)));
  iceRing(c, t, F.x - 10, fy - 118, 178, ra);
  if (big) { ringPulse(c, t, 95.415, p[0], p[1], 8, 260, C.ice, 1.2, .7); ringPulse(c, t, 96.5, p[0], p[1], 8, 200, C.ice, 1.4, .35); }
  // 想了一个办法：胸口亮起一点金色
  const ga = eo(pr(t, 100.32, 100.6)); if (ga > 0) { chestDot(c, G, C.gold, ga, 6); ringPulse(c, t, 100.32, p[0], p[1], 6, 130, C.gold, .9, .7); }
}

// ===================== 懂事的代价 + 治愈型幻想：同一间屋子（成片 104.25–140.5） =====================
// 105.925 先看脸色（大人头上的“天气”）→ 108.65 满分的卷子被一句“别烦我”压灭 → 111.92 把自己的光递给大人 → 114.645 戴上微笑面具 → 118.46 演累了
// → 127.725 光尘聚成一个梦泡（要是我再好一点）→ 131.54 碎掉 → 134.265 长大：对面换成一个冷淡的背影，头上是同一朵云 → 137.535 和当年的大人重叠
const HM = { fy: 780, ax: 800, kx: 1120, bub: [960, 250, 140] };
function dreamPt() { return w2s(HM.bub[0], HM.bub[1]); }
const MCR = [[[-.08, -1], [.06, -.62], [-.12, -.28], [.07, .06], [-.04, .42]], [[.98, -.15], [.6, -.02], [.42, .26], [.12, .3]], [[-.95, .3], [-.6, .18], [-.36, .5], [-.12, .44]]];
function smileMask(c, G, F, o) {   // 微笑面具：o = {a, form 光尘聚拢 0..1, crack [三道裂缝 0..1], light 裂缝里透出的光, shatter 碎掉 0..1}
  const a = o.a ?? 1; if (a <= 0) return;
  const hd = G.at('head'), r = G.b.hr * F.h, cx = hd[0] + F.dir * r * .1, cy = hd[1] + r * .02, rx = r * 1.05, ry = r * 1.22;
  const fm = o.form ?? 1, sh = o.shatter || 0, lt = o.light || 0, P = (x, y) => [cx + rx * x, cy + ry * y];
  if (fm < 1) { PX.useM(c); for (let i = 0; i < 110; i++) { const an = i / 110 * Math.PI * 2, s0 = .5 * rnd(i, 501), u = eio(clamp((fm - s0) / .5)); if (u <= 0) continue;
      const tx = cx + Math.cos(an) * rx, ty = cy + Math.sin(an) * ry, x0 = tx + (rnd(i, 502) - .5) * 170, y0 = ty - 50 - 90 * rnd(i, 503);
      PX.pt(lerp(x0, tx, u), lerp(y0, ty, u), mixC(C.white, C.lamp, .3), a * (.45 + .7 * Math.sin(Math.PI * u)), .3); } PX.flush(c); }
  const sa = a * eo(pr(fm, .7, 1)) * (sh > 0 ? 0 : 1);
  if (sa > 0) {
    c.save(); c.globalAlpha = sa; c.beginPath(); c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); c.fillStyle = rgba(mixC(C.body, C.white, .07)); c.fill();
    c.strokeStyle = rgba(o.col || C.white, .9); c.lineWidth = 2.4; c.stroke(); c.lineCap = 'round'; c.lineWidth = 2.2;
    for (const s of [-1, 1]) { c.beginPath(); c.arc(cx + s * rx * .4, cy - ry * .08, r * .2, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }   // 弯弯的笑眼
    c.beginPath(); c.arc(cx, cy + ry * .02, r * .55, Math.PI * .2, Math.PI * .8); c.stroke();                                              // 一直在笑
    c.restore();
  }
  if (sh <= 0) (o.crack || []).forEach((u, i) => { if (u <= 0) return; const pts = withLen(MCR[i].map(q => P(q[0], q[1])));
    c.save(); c.shadowColor = rgba(lt > 0 ? C.gold : C.red, 1); c.shadowBlur = 10 + 22 * lt; strokePartial(c, pts, u, rgba(mixC(C.red, mixC(C.gold, C.white, .35), lt), a), 2.4 + 1.8 * lt); c.restore(); });
  if (lt > 0) glow(c, cx, cy, r * (2 + 3.5 * lt), C.gold, .4 * lt * a * (1 - .6 * sh));
  if (sh > 0 && sh < 1) for (let i = 0; i < 12; i++) {   // 碎片往下掉
    const an = rnd(i, 511) * 6.283, d = rnd(i, 512), x0 = cx + Math.cos(an) * rx * d * .8, y0 = cy + Math.sin(an) * ry * d * .8, f = sh;
    const x = x0 + ((x0 - cx) * 1.6 + (rnd(i, 513) - .5) * 60) * f, y = y0 + 420 * f * f - 40 * f, sz = r * (.22 + .2 * rnd(i, 515));
    c.save(); c.translate(x, y); c.rotate((rnd(i, 514) - .5) * 8 * f); c.globalAlpha = a * (1 - f);
    c.beginPath(); c.moveTo(-sz, -sz * .4); c.lineTo(sz * .8, -sz * .6); c.lineTo(sz * .2, sz * .7); c.closePath(); c.fillStyle = rgba(C.body); c.fill(); c.strokeStyle = rgba(C.white, .8); c.lineWidth = 1.6; c.stroke(); c.restore();
  }
}
function paper(c, x, y, rot, lit, a) {   // 满分的卷子
  if (a <= 0) return; c.save(); c.translate(x, y); c.rotate(rot); c.globalAlpha = a;
  glow(c, 0, 0, 110, C.gold, .35 * lit);
  c.fillStyle = rgba(C.body); c.fillRect(-30, -38, 60, 76); c.strokeStyle = rgba(mixC(C.gray, mixC(C.gold, C.white, .3), lit), .95); c.lineWidth = 2; c.strokeRect(-30, -38, 60, 76);
  for (let k = 0; k < 3; k++) seg(c, -18, 12 + k * 9, 18, 12 + k * 9, C.gray, .6, 1.4);
  c.font = `500 24px ${FS.mono}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = rgba(mixC(C.gray, C.gold, lit), 1); c.fillText('100', 0, -14); c.textAlign = 'left';
  c.restore();
}
function homeKid(t) {
  const gm = eio(pr(t, 134.3, 135.5)), w = eio(pr(t, 138.0, 138.2)) * (1 - eio(pr(t, 138.8, 139.0)));
  const x = lerp(lerp(HM.kx, HM.kx + 30, gm), HM.kx - 60, eio(pr(t, 138.0, 139.0)));
  let P = poseSeq(t, [[0, { ...PO.stand, hd: 6 }], [106.1, { ...PO.stand, hd: -24, aN: 2, aF: -2 }, .6], [108.75, { ...PO.offer, hd: -14 }, .45], [110.5, PO.sad, .5],
    [112.15, { ...PO.offer, hd: -6 }, .4], [113.4, { ...PO.stand, hd: 4 }, .5], [114.9, { ...PO.stand, hd: -4, aN: 2, aF: -2 }, .5], [118.7, PO.bow, 1.4], [120.4, { ...PO.bow, sp: 16, hd: 44 }, 2.5],
    [134.3, { ...PO.stand, hd: 10 }, 1.2]]);
  if (w > 0) P = lerpPose(P, walkPose((HM.kx + 30 - x) / 70 * Math.PI, 0), w);
  let rim = mixC(mixC(C.silver, C.ice, .4), C.gray, .35 * eio(pr(t, 110.0, 110.6)));
  rim = mixC(rim, C.silver, eio(pr(t, 115.2, 115.8))); rim = mixC(rim, C.gray, .7 * eio(pr(t, 118.7, 120.2)));
  return { kind: 'child', tpl: gm < .5 ? 'child' : 'adult', bn: gm > 0 ? bnMix(BN.child, BN.adult, gm) : undefined, P, x, y: HM.fy, h: lerp(230, 420, gm), dir: -1, rim, scatter: Math.sin(Math.PI * gm) * .6, refl: HM.fy };
}
function sceneHome(t) {
  const c = sx, fy = HM.fy, AX = HM.ax;
  lampPool(c, 960, 430, 900, 1); lampCone(c, 960, -80, fy + 40, 80, 700, .8); floorLine(c, fy, 260, 1720, 1, pr(t, 104.5, 105.6)); motes(t, 960, 430, 700, 330, 120, C.lamp, .8);
  // 大人：先看脸色 → “别烦我”转过身去 → 又难过地转回来（要你照顾）→ 134.3 淡出
  const pA = (1 - eio(pr(t, 134.3, 134.9))) * lerp(1, .78, eio(pr(t, 118.6, 120.2))), dm = eio(pr(t, 109.85, 110.15)) * (1 - eio(pr(t, 111.45, 111.75)));
  const aP = poseSeq(t, [[0, { ...PO.stand, hd: 8 }], [109.8, PO.cross, .3], [111.45, PO.sad, .5], [113.6, { ...PO.stand, hd: 12 }, .8]]);
  const arim = mixC(mixC(C.silver, C.red, .55 * win(t, 106.4, 107.2, .1, .5) + .6 * win(t, 109.74, 110.6, .08, .4)), C.gold, .5 * win(t, 113.25, 114.8, .2, .8));
  let GA = null;
  if (pA > 0) { const A = { kind: 'adult', P: aP, x: AX, y: fy, h: 460, rim: arim, refl: fy };
    if (dm < 1) GA = drawFig({ ...A, dir: 1, a: pA * (1 - dm) }); if (dm > 0) { const g = drawFig({ ...A, dir: -1, a: pA * dm }); if (dm >= .5) GA = g; } }
  // 大人头上的“天气”：一朵小云，106.47 闪了一下红
  const ca = eo(pr(t, 106.0, 106.5)) * (1 - eio(pr(t, 111.4, 111.9)));
  if (ca > 0) { cloud(c, AX, 215, [.36, .3], ca, t); glow(c, AX, 215, 90, C.ember, .5 * win(t, 106.47, 107.0, .05, .4)); ringPulse(c, t, 106.47, AX, 215, 10, 120, C.red, .7, .55); }
  // 对面换成一个冷淡的背影（长大后），头上是同一朵云；137.535 和当年的大人重叠
  const pB = eo(pr(t, 134.7, 135.5));
  if (pB > 0) {
    const GB = drawFig({ kind: 'adult', P: { ...PO.cross, hd: 4 }, x: AX - 10, y: fy, h: 440, dir: -1, rim: COLD, a: pB, refl: fy });
    const cb = eo(pr(t, 135.3, 135.9)); if (cb > 0) cloud(c, AX - 10, 225, [.36, .3], cb, t);
    const ga = .5 * win(t, 137.6, 139.9, .4, .9);
    if (ga > 0) { drawFig({ kind: 'adult', P: { ...PO.stand, hd: 8 }, x: AX, y: fy, h: 460, dir: 1, rim: C.ice, sparse: true, nobody: true, a: ga }); }
    const pc = GB.at('chest'); ringPulse(c, t, 137.6, pc[0], pc[1], 12, 200, C.ice, 1.0, .6);
  }
  // 孩子（134.3 以后长成大人）
  const K = homeKid(t), GK = drawFig(K), kc = GK.at('chest'), kh = GK.at('head');
  // 先看脸色：孩子的视线（一串冰蓝的小点）
  const la = .55 * win(t, 106.15, 108.4, .3, .4);
  if (la > 0) { PX.useM(c); for (let i = 0; i < 16; i++) { const u = i / 16, m = .5 + .5 * Math.sin(i * 1.3 - PX.t * 7); PX.pt(lerp(kh[0] - 20, AX + 30, u), lerp(kh[1] - 10, 250, u), C.ice, la * m, .3); } PX.flush(c); }
  // 满分的卷子：举起来 → “别烦我” → 光灭了 → 掉在地上
  if (t > 108.7 && t < 114.0) {
    const hN = GK.at('haN'), hF = GK.at('haF'), hx = (hN[0] + hF[0]) / 2, hy = (hN[1] + hF[1]) / 2 - 34, f = eio(pr(t, 110.6, 111.25));
    const lit = eo(pr(t, 108.8, 109.2)) * (1 - eio(pr(t, 109.95, 110.5)));
    paper(c, lerp(hx, hx - 30, f), lerp(hy, fy - 6, f), lerp(0, -1.45, f), lit, eo(pr(t, 108.7, 108.95)) * (1 - pr(t, 113.3, 114.0)));
  }
  if (GA && t > 109.74 && t < 111.5) {
    const hd = GA.at('head'), u = pr(t, 109.74, 109.92), k = 1 + .2 * Math.sin(Math.PI * u) * (u < 1 ? 1 : 0), ba = eo(u) * (1 - eio(pr(t, 111.0, 111.4)));
    c.save(); c.translate(AX + 110, hd[1] - 40); c.scale(k, k); pill(c, '别烦我', 0, 0, C.red, ba, 30); c.restore();
    ringPulse(c, t, 109.74, hd[0], hd[1], 14, 140, C.red, .8, .6);
  }
  // 胸口的光：暗下去 → 112.2 递给大人（大人收下了，孩子胸口空了）
  if (t < 134.3) {
    if (t < 112.25) chestDot(c, GK, C.gold, .6 * lerp(1, .45, eio(pr(t, 110.0, 110.6))) * eo(pr(t, 104.8, 105.4)), 5);
    else ring(c, kc[0], kc[1], 6, C.gray, .55 * (1 - pr(t, 133.6, 134.2)), 1.5);
    if (t > 112.2 && t < 113.3 && GA) { const ac = GA.at('chest'), u = eio(pr(t, 112.25, 113.25)), ox = lerp(kc[0], ac[0], u), oy = lerp(kc[1], ac[1], u) - 120 * Math.sin(Math.PI * u);
      glow(c, ox, oy, 46, C.gold, .55); dot(c, ox, oy, 8, mixC(C.gold, C.white, .4), 1); }
    if (GA) { const ac = GA.at('chest'); ringPulse(c, t, 113.25, ac[0], ac[1], 8, 120, C.gold, .9, .6); glow(c, ac[0], ac[1], 60, C.gold, .4 * win(t, 113.25, 114.6, .1, .9)); }
  }
  // 微笑面具：114.75 光尘聚成形，一直戴着（长大以后也戴着）
  if (t > 114.75) smileMask(c, GK, K, { form: pr(t, 114.75, 115.6), a: 1, col: mixC(C.white, C.gray, .55 * eio(pr(t, 118.6, 120.6))) });   // 演久了：面具发灰
  // 梦泡：要是我再好一点，他们就会懂我（127.725 第二遍全曲进入）→ 131.0 裂开 → 131.54 碎掉
  const [bx, by, br] = HM.bub;
  if (t > 126.3 && t < 132.8) {
    PX.useM(c); const N = 240, pop = pr(t, 131.54, 132.7), hot = mixC(C.gold, C.white, .5);
    for (let i = 0; i < N; i++) {
      const an = i / N * Math.PI * 2, s0 = 126.5 + 1.0 * rnd(i, 601), e0 = 127.4 + .32 * rnd(i, 602), u = eio(pr(t, s0, e0)); if (u <= 0) continue;
      const tx = bx + Math.cos(an) * br, ty = by + Math.sin(an) * br, cx_ = lerp(kh[0], tx, .5) + (rnd(i, 603) - .5) * 160, cy_ = Math.min(kh[1], ty) - 60;
      const q = 1 - u; let x = q * q * kh[0] + 2 * q * u * cx_ + u * u * tx, y = q * q * kh[1] + 2 * q * u * cy_ + u * u * ty;
      let k = (u < 1 ? .3 + .6 * Math.sin(Math.PI * u) : .55 + .35 * Math.sin(PX.t * 3 + i)) * (1 - pr(t, 131.0, 131.54) * .3);
      if (pop > 0) { x += Math.cos(an) * 160 * eo(pop); y += Math.sin(an) * 110 * eo(pop) + 260 * pop * pop; k *= (1 - pop); }
      if (k > .003) PX.pt(x, y, rnd(i, 604) < .2 ? hot : C.gold, k, .35);
    }
    PX.flush(c);
    const ia = eo(pr(t, 127.8, 128.4)) * (1 - eio(pr(t, 131.54, 132.1)));   // 梦里：大人蹲下来，抱住那个孩子
    if (ia > 0) { glow(c, bx, by + 40, 120, C.gold, .18 * ia);
      drawFig({ kind: 'adult', P: PO.kneel, x: bx - 40, y: by + 92, h: 150, dir: 1, rim: C.gold, a: ia, scatter: eio(pr(t, 131.54, 132.1)) });
      drawFig({ kind: 'child', P: PO.cheer, x: bx + 42, y: by + 92, h: 84, dir: -1, rim: C.gold, a: ia, scatter: eio(pr(t, 131.54, 132.1)) }); }
    const cu = eio(pr(t, 131.05, 131.4)), cra = 1 - pr(t, 131.54, 131.7);
    if (cu > 0 && cra > 0) { c.save(); c.shadowColor = rgba(C.red, 1); c.shadowBlur = 12;
      strokePartial(c, withLen([[bx + br * .7, by - br * .7], [bx + 40, by - 50], [bx + 64, by - 8], [bx + 10, by + 30], [bx + 26, by + 70]]), cu, rgba(C.red, cra), 2.6);
      strokePartial(c, withLen([[bx - br * .95, by + 30], [bx - 70, by + 10], [bx - 48, by + 46], [bx - 12, by + 34]]), cu, rgba(C.red, cra), 2.4); c.restore(); }
    ringPulse(c, t, 131.05, bx, by, 20, 200, C.red, .8, .5);
    burst(c, t, 131.54, bx, by, { n: 70, seed: 611, col: C.gold, v0: 60, v1: 380, g: 300, life: 1.3 });
  }
}

// ===================== 面具裂开（成片 144.4–160） =====================
// 144.62 撑不住：三道裂缝落在拍上 → 147.89 裂缝里透出金光 → 148.435 面具碎掉，胸口重新亮起来 → 157.155 当年的大人出现在对面 → 黑
const MK3 = { fy: 780, x: 1020, px: 680 };
function sceneMask(t) {
  const c = sx, fy = MK3.fy;
  lampPool(c, 900, 430, 900, 1); lampCone(c, 960, -80, fy + 40, 80, 680, lerp(.7, 1, eio(pr(t, 148.4, 150.5)))); floorLine(c, fy, 300, 1650, 1, 1); motes(t, 960, 430, 680, 330, 120, C.lamp, .8);
  const P = poseSeq(t, [[0, { ...PO.stand, hd: 10 }], [144.75, PO.sad, 1.1], [145.71, { ...PO.shrink, sp: 14, hd: 40 }, .9], [148.5, { ...PO.stand, hd: -6, aN: 4, aF: -4 }, 1.1], [157.4, { ...PO.stand, hd: 4 }, 1.2]]);
  const rim = mixC(mixC(C.gray, C.silver, .3), mixC(C.gold, C.lamp, .4), eio(pr(t, 148.4, 150.2)));
  const F = { kind: 'adult', P, x: MK3.x, y: fy, h: 420, dir: -1, rim, refl: fy, gain: 1 + .5 * win(t, 148.4, 150, .2, 1.2) }, G = drawFig(F), p = G.at('chest'), hd = G.at('head');
  const cr = [144.62 + .545, 144.62 + 1.09, 144.62 + 1.635].map(s => eio(pr(t, s, s + .22)));
  cr.forEach((u, i) => { const s = 145.165 + i * .545; if (t > s) ringPulse(c, t, s, hd[0], hd[1], 12, 110, C.red, .7, .55); });
  smileMask(c, G, F, { col: mixC(C.white, C.gray, .55), crack: cr, light: eo(pr(t, 147.9, 148.42)), shatter: pr(t, 148.435, 149.9) });
  burst(c, t, 148.435, hd[0], hd[1], { n: 60, seed: 621, col: C.gold, v0: 80, v1: 420, g: 160, life: 1.3 });
  chestDot(c, G, C.gold, eo(pr(t, 148.5, 149.0)), 6.5);
  ringPulse(c, t, 148.5, p[0], p[1], 8, 160, C.gold, 1.0, .65);
  if (t > 148.6) { PX.useM(c); const ga = eo(pr(t, 148.6, 149.6)) * (1 - eio(pr(t, 157.2, 158.6)) * .6);   // 留白：金色微尘从身边慢慢往上升
    for (let i = 0; i < 80; i++) { const life = 3 + 2 * rnd(i, 631), u = ((t - 148.6) / life + rnd(i, 632)) % 1, x = p[0] + (rnd(i, 633) - .5) * 400 + Math.sin(PX.t * .7 + i) * 18, y = fy - 20 - u * 520;
      PX.pt(x, y, mixC(C.gold, C.white, .3 * rnd(i, 634)), ga * 1.2 * Math.sin(Math.PI * u) * (.6 + .4 * Math.sin(PX.t * 5 + i)), .3); }
    PX.flush(c); }
  // 不是因为你不值得——：当年的大人出现在对面
  const pa = eo(pr(t, 157.3, 158.4));
  if (pa > 0) drawFig({ kind: 'adult', P: { ...PO.stand, hd: 16 }, x: MK3.px, y: fy, h: 440, dir: 1, rim: C.silver, a: pa, refl: fy, draw: pr(t, 157.3, 158.4) });
}
