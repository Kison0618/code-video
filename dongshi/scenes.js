// scenes.js — 老场景：门厅（开头）/ 父母与孩子（雨和伞）/ 手机 / 根（牌匾、盆景）/ 父母与孩子（退一步、雨倒流）/ 门厅（结尾）；v3 新场景在 scenes3.js
// 这里的时间都是“场景时间”（v1 的编排时间），成片时间由 timeline.js 的 N2O() 映射过来；光尘标题 / 片尾光尘直接用成片时间
'use strict';
const BOY_H = 250;
const HALL = V ? { fy: 770, d: { x0: 1240, x1: 1450, top: 320 }, b0: 720, b1: 950, pot: 1030, ah: 420, kx: 1190 }
               : { fy: 770, d: { x0: 1270, x1: 1500, top: 300 }, b0: 620, b1: 935, pot: 1010, ah: 440, kx: 1250 };
const COLD = mixC(C.ice, C.white, .45), WARM = mixC(C.gold, C.lamp, .35);

// ---------- 镜头：每一段只有一个慢推/平移 ----------
const CAMH = [[0, 960, 540, 1], [12.9, 960, 540, 1], [16.55, 900, 520, 1.12], [16.6, 990, 540, 1], [51.2, 990, 540, 1], [55.4, 990, 480, 1.12], [59.72, 990, 480, 1.12], [59.74, 990, 470, 1.0], [63.26, 990, 455, 1.04], [63.3, 990, 540, 1],
  [93.3, 990, 540, 1], [93.5, 960, 540, 1], [112.6, 960, 540, 1], [112.7, 990, 540, 1], [115.9, 990, 540, 1], [117.1, 700, 520, .9], [121.3, 700, 520, .9], [122.7, 990, 540, 1], [138.3, 990, 540, 1],   // 115.9 退一步：镜头拉远、往右让出位置
  [138.5, 960, 540, 1], [145, 960, 540, 1], [151.3, 930, 575, 1.08], [170, 930, 575, 1.08], ...CAM3H];
const CAMV = [[0, 1085, 560, 1.12], [12.9, 1085, 560, 1.12], [16.55, 905, 540, 1.32], [16.6, 990, 560, 1.18], [51.2, 990, 560, 1.18], [55.4, 990, 470, 1.32], [59.72, 990, 470, 1.32], [59.74, 990, 420, 1.0], [63.26, 990, 405, 1.05], [63.3, 960, 772, .94],
  [76.70, 960, 772, .94], [76.74, 960, 520, 1.35], [93.3, 960, 520, 1.35], [93.5, 960, 620, 1.2], [112.6, 960, 620, 1.2], [112.7, 990, 560, 1.18],
  [115.9, 990, 560, 1.18], [117.1, 990, 470, .96], [121.3, 990, 470, .96], [122.7, 990, 560, 1.18], [138.3, 990, 560, 1.18], [138.5, 1085, 560, 1.12], [145, 1085, 560, 1.12], [151.3, 1000, 600, 1.25],
  [170, 1000, 600, 1.25], ...CAM3V];

// 画面亮度（1 = 正常，0 = 全黑）：换场、大特效前 0.45 秒的黑、清单时压暗
function dimAt(t) {
  if (t >= S3 - 1) return dim3(t - S3);
  if (t < 16.6) return eo(pr(t, 0, .5)) * (1 - eio(pr(t, 15.3, 16.55)));
  if (t < 21.3) return 0;
  if (t < 59.74) return eo(pr(t, 21.3, 21.6)) * lerp(1, .55, eio(pr(t, 57.6, 59.2))) * (1 - eio(pr(t, 59.29, 59.72)));   // 重拍 2 前 0.45 秒黑
  if (t < 63.3) return eo(pr(t, 59.74, 59.9)) * (1 - eio(pr(t, 62.95, 63.26)));
  if (t < 63.6) return 0;
  if (t < 93.84) return 1 - eio(pr(t, 92.6, 93.4));
  if (t < 112.75) return 1 - eio(pr(t, 112.2, 112.75));
  if (t < 138.5) return eo(pr(t, 112.75, 113.3)) * lerp(1, .5, eio(pr(t, 125.8, 126.8))) * (1 - eio(pr(t, 138.0, 138.5)));
  if (t < 157.4) {
    let d = eo(pr(t, 138.5, 139.3));
    if (t >= 150.55) d *= t < 151.5 ? 1 - eio(pr(t, 150.55, 151.0)) : lerp(0, .22, eo(pr(t, 151.5, 152.2))) * (1 - eio(pr(t, 156.9, 157.4)));
    return d;
  }
  return 0;
}

function scenes(t) {
  const d = dimAt(t); if (d <= .001) return;
  if (t < 16.6) sceneHook(t);
  if (t >= 21.3 && t < 63.3) sceneParent(t);
  if (t >= 76.7 && t < 93.5) scenePhone(t);
  if (t >= 93.84 && t < 112.8) sceneRoots(t);
  if (t >= 112.75 && t < 138.5) sceneParent(t);
  if (t >= 138.5 && t < 157.4) sceneHall2(t);
  if (t >= S3) scenes3(t - S3);
}

// 胸口那颗小光点（孩子自己的“开心”）
function chestDot(c, G, col, a, r = 6) {
  if (a <= 0) return; const p = G.at('chest');
  glow(c, p[0], p[1], r * 7, col, .5 * a); dot(c, p[0], p[1], r, mixC(col, C.white, .5), a);
}
function soundArcs(c, t, x, y, t0, col, r1 = 150, a0 = .55, lw = 2) {   // 门外的声音：三道弧
  for (let i = 0; i < 3; i++) { const u = pr(t, t0 + i * .3, t0 + i * .3 + .9); if (u <= 0 || u >= 1) continue;
    c.strokeStyle = rgba(col, a0 * (1 - u)); c.lineWidth = lw; c.beginPath(); c.arc(x, y, lerp(24, r1, eo(u)), Math.PI - .5, Math.PI + .5); c.stroke(); }
}

// ===================== 1. 开头：门厅 0–16.6 =====================
// 0.3 父亲站在门口（从不道歉）→ 2.95 孩子高兴地跑过去，摔倒了（膝盖一点红）→ 4.3 父亲指着他：“叫你别跑！”，没人扶 → 5.6 自己爬起来
// → 5.95 开心被压小 → 8.8 孩子长成大人 → 9.7 别人一冷脸，先怪自己
// → 11.55 先道歉的总是你（两个光尘标签对照）→ 14.35 人人都夸你懂事：胸口的光点亮起来，15.4 碎成光尘 → 17.05 片名
const HK_M = t => eio(pr(t, 8.8, 9.9));          // 孩子 → 长成大人
const PO_TRIP = { sp: 34, hd: -14, aN: 62, eN: 12, aF: 48, eF: 14, lN: -22, kN: -58, lF: 30, kF: -34 };     // 绊了一下，往前扑
const PO_FALL = { sp: 62, hd: 14, aN: 4, eN: -2, aF: 14, eF: -4, lN: 35, kN: -145, lF: 25, kF: -135 };    // 摔在地上：双手撑地、跪着
const FALL_T = 3.98;                              // 落地那一下
function kneeMark(c, G, col, a, t0 = -9, t = 0) {  // 膝盖上的一点伤：小亮点 + 一圈光
  if (a <= .003) return; const k = G.at('knN');
  glow(c, k[0], k[1], 46, col, .42 * a); dot(c, k[0], k[1], 4.2, mixC(col, C.white, .45), Math.min(1, a * 1.2));
  if (t0 > 0) ringPulse(c, t, t0, k[0], k[1], 8, 110, col, .8, .65);
}
function boyHook(t) {
  const L = HALL, u = pr(t, 2.75, 3.9), m = HK_M(t), x = lerp(lerp(L.b0, L.b1, Math.pow(u, 1.25)), L.b1 - 50, m);
  let P = poseSeq(t, [[0, PO.stand], [1.45, PO.happy, .4], [3.72, PO_TRIP, .13], [3.85, PO_FALL, .14], [4.45, { ...PO_FALL, hd: 30 }, .5], [5.55, PO.shrink, .65], [6.25, PO.bow, .9], [8.8, { ...PO.stand, hd: 8 }, .9],
    [10.0, { ...PO.shrink, sp: 12, hd: 26, aN: 14, aF: 8 }, .35], [11.6, { ...PO.bow, sp: 15, hd: 44 }, 1.0], [14.4, { ...PO.stand, hd: 6, aN: 2, aF: -2 }, 1.0]]);
  const rw = eio(pr(t, 2.65, 2.95)) * (1 - eio(pr(t, 3.68, 3.8))), ph = (x - L.b0) / 95 * Math.PI;
  if (rw > 0) P = lerpPose(P, walkPose(ph, 1), rw);
  let rim = t < 4.3 ? C.gold : mixC(C.gold, C.red, eio(pr(t, 4.3, 4.6)));
  if (t >= 4.65) rim = mixC(C.red, C.gray, eio(pr(t, 4.65, 6.6)));
  if (t >= 9.75) rim = mixC(mixC(C.gray, C.ice, .75 * win(t, 9.75, 10.5, .2, .4)), C.red, .5 * eio(pr(t, 10.1, 10.45)) * (1 - eio(pr(t, 11.2, 12.2))));   // 冷脸：先被冷光照到，再转成怪自己
  if (t >= 14.5) rim = mixC(C.gray, mixC(C.gold, C.gray, .35), eio(pr(t, 14.5, 15.2)));
  return { kind: 'child', tpl: m < .5 ? 'child' : 'adult', bn: m > 0 ? bnMix(BN.child, BN.adult, m) : undefined, P, x, y: L.fy - 7 * rw * Math.abs(Math.sin(ph)),
    h: lerp(BOY_H, L.ah, m), dir: 1, rim, scatter: Math.sin(Math.PI * m) * .6, draw: t < 1.4 ? pr(t, .3, 1.4) : undefined };
}
let HOOK_DOT = null;
function hookDotScreen() {    // 光点在 15.4 秒的屏幕位置（标题的光尘从这里出发）
  if (HOOK_DOT) return HOOK_DOT;
  const keep = CAM, k = keyCam(V ? CAMV : CAMH, 15.4); CAM = { fx: k[1], fy: k[2], s: k[3] };
  const p = figGeom(boyHook(15.4)).at('chest'); HOOK_DOT = w2s(p[0], p[1]); CAM = keep; return HOOK_DOT;
}
function hookDotA(t) {
  let a = eo(pr(t, 1.4, 1.8));
  a *= lerp(1, .25, eio(pr(t, 4.5, 5.0)));     // 惩罚：一下暗了
  a = lerp(a, .95, eo(pr(t, 6.2, 6.6)));        // “开心”
  a *= lerp(1, .5, eio(pr(t, 6.7, 8.1)));       // 被压小
  a *= lerp(1, .6, eio(pr(t, 10.1, 10.5)));     // 别人一冷脸
  return lerp(a, 1, eo(pr(t, 14.7, 15.3)));     // “懂事”：亮起来，碎成光尘
}
// 光尘标签（学参考片：一团光尘聚成关键词；粒子在画面层，字本身在屏幕层——清晰、不发光）
const HLS = V ? 56 : 50;
const EXTRA_TEXT = ['我还能害你吗？', '不懂事', '我在学校被欺负了……', '大人说话', '小孩别插嘴'];
const HL = [
  { s: '从不道歉', x: (HALL.d.x0 + HALL.d.x1) / 2, y: HALL.d.top - 50, t0: 1.3, t1: 14.3, col: mixC(C.red, C.white, .2), lv: [[6.4, 7.2, .45], [11.9, 12.4, 1]], re: 11.9 },
  { s: '总是先道歉', x: HALL.b1 - 50, y: HALL.d.top - 50, t0: 12.0, t1: 14.3, col: C.ice },
  { s: '总是先道歉', x: HALL.b1 - 150, y: HALL.fy - BOY_H - 120, t0: 142.95, t1: 144.75, col: C.ice },   // 结尾：不是你的错，就不用道歉 → 散掉
];
const HLP = {};
function hlPts(s) {
  if (HLP[s]) return HLP[s];
  if (!document.fonts.check(`500 ${HLS}px 'Noto Sans SC'`, s)) return null;
  const w = Math.ceil(HLS * (s.length + 1) + 40), h = Math.ceil(HLS * 2), cv2 = mk(w, h), c2 = cv2.getContext('2d', { willReadFrequently: true });
  const tw = drawChars(c2, parse(s), w / 2, h / 2, { size: HLS, font: FS.sans, weight: 500, ls: 4, t0: 0 });
  const d = c2.getImageData(0, 0, w, h).data, all = []; let n = 0;
  for (let y = 0; y < h; y += 2) for (let x = 0; x < w; x += 2) if (d[(y * w + x) * 4 + 3] > 120) { n++; all.push([x - w / 2 + (rnd(n, 61) - .5) * 1.4, y - h / 2 + (rnd(n, 62) - .5) * 1.4]); }
  const m = Math.min(all.length, 700), o = []; for (let i = 0; i < m; i++) o.push(all[Math.floor((i + rnd(i, 60) * .9) * all.length / m) % all.length]);
  o.w = tw; return HLP[s] = o;
}
function hlLv(L, t) { let v = 1; for (const [a, b, w] of L.lv || []) v = lerp(v, w, eio(pr(t, a, b))); return v; }
function hlDust(t) {
  for (const L of HL) {
    if (t < L.t0 || t > L.t1 + .8) continue;
    const P = hlPts(L.s); if (!P) continue;
    const [ax, ay] = w2s(L.x, L.y), hot = mixC(L.col, C.white, .5), lv = hlLv(L, t);
    for (let i = 0; i < P.length; i++) {
      const q = P[i]; let x, y, k;
      const ts = L.t0 + .3 * rnd(i, 63), te = ts + .45 + .2 * rnd(i, 64);
      if (t < L.t1 - .4) {
        if (t > te + .5) {    // 已经成字：只在 re 那一刻再闪一下
          const r = L.re ? pr(t, L.re, L.re + .8) : 0; if (r <= 0 || r >= 1) continue;
          x = ax + q[0]; y = ay + q[1]; k = .4 * Math.sin(Math.PI * r) * (rnd(i, 67) < .5 ? 1 : .3);
        } else {              // 聚：从字上方一团横向的光尘，落到字形上
          const u = eio(pr(t, ts, te)), cx = (rnd(i, 65) - .5) * P.w * 1.3, cy = -HLS * .8 + (rnd(i, 66) - .5) * HLS * 1.2;
          x = ax + lerp(cx, q[0], u) + Math.sin(t * 4 + i) * 4 * (1 - u); y = ay + lerp(cy, q[1], u);
          k = eo(pr(t, L.t0, ts + .12)) * (.6 - .2 * u) * (1 - pr(t, te + .1, te + .5));
        }
      } else {                // 散：从字上往上飘
        const s0 = L.t1 - .4 + .25 * rnd(i, 68), u = pr(t, s0, s0 + .7); if (u <= 0 || u >= 1) continue;
        x = ax + q[0] + (rnd(i, 69) - .5) * 70 * eo(u); y = ay + q[1] - (20 + 80 * rnd(i, 70)) * eo(u);
        k = .5 * lv * (1 - u) * eo(pr(u, 0, .15));
      }
      if (k > .003) PX.spt(x, y, rnd(i, 71) < .2 ? hot : L.col, k, i % 6 ? 0 : .4);
    }
  }
}
function hookLabels(t) {   // 屏幕层：标签的字
  if (t < 1.3 || (t > 14.4 && t < 142.9) || t > 145.6) return; const d = dimAt(t);
  for (const L of HL) {
    const a = eo(pr(t, L.t0 + .45, L.t0 + .9)) * (1 - eio(pr(t, L.t1 - .4, L.t1))) * hlLv(L, t) * d; if (a <= .003) continue;
    const [x, y] = w2s(L.x, L.y);
    drawChars(ctx, parse(L.s), x, y, { size: HLS, font: FS.sans, weight: 500, ls: 4, t0: 0, a, color: () => L.col, shadow: true });
  }
}
function sceneHook(t) {
  const c = sx, L = HALL, fy = L.fy, D = { ...L.d, fy }, dm = (D.x0 + D.x1) / 2;
  lampPool(c, 900, 420, 950, 1);
  lampCone(c, 900, -60, fy + 40, 70, 640, eo(pr(t, .2, 1.0)) * lerp(1, .55, eio(pr(t, 4.4, 5.4))));
  floorLine(c, fy, 200, 1800, 1, pr(t, .1, 1.2));
  motes(t, 900, 440, 620, 330, 150, C.lamp, eo(pr(t, .3, 1.3)));
  const open = eio(pr(t, .8, 1.4)) * (1 - eio(pr(t, 6.6, 7.4)));
  const under = eo(pr(t, .5, .9)) * (1 - .6 * eio(pr(t, 7.2, 8.0))) + .7 * win(t, 9.6, 11.2, .2, .9);
  const adA = eo(pr(t, .95, 1.5)) * (1 - eio(pr(t, 6.3, 6.9)));
  const temper = .75 * win(t, 1.85, 2.6, .12, .45) + .85 * win(t, 4.3, 5.6, .15, .6);   // 脾气说来就来 / 惩罚：父亲身上一下变红
  let FG = null;
  door(c, D, { u: pr(t, .2, 1.0), open, light: t < .8 ? C.lamp : COLD, I: open, under,
    fig: adA > 0 ? () => { FG = drawFig({ kind: 'adult', P: poseSeq(t, [[0, PO.stand], [1.0, PO.cross, .5], [4.3, PO.point, .4], [5.6, PO.cross, .5]]), x: dm - 6 + 34 * eio(pr(t, 6.3, 6.9)), y: fy, h: L.ah, dir: -1,
      rim: mixC(mixC(C.ice, C.white, .55), C.red, Math.min(1, temper)), a: adA }); } : null });
  if (FG) { const hd = FG.at('head'); ringPulse(c, t, 1.9, hd[0], hd[1], 14, 120, C.red, .8, .55); const hn = FG.at('haN'); ringPulse(c, t, 4.4, hn[0], hn[1], 10, 140, C.red, .8, .7); }
  soundArcs(c, t, D.x0 - 18, fy - 250, 9.7, COLD, 380, .85, 3);   // 别人一冷脸：冷的声音，一直打到你身上
  // 孩子（8.8 秒以后长成大人）：摔倒时地上扬起一点灰，膝盖上留下一点红；11.7 秒那点红又亮了一下（那份委屈还在）
  const F = boyHook(t), G = drawFig({ ...F, refl: fy });
  burst(c, t, FALL_T, F.x + 40, fy - 4, { n: 22, seed: 5, col: C.lamp, v0: 30, v1: 170, a0: -Math.PI, spread: Math.PI, g: 260, life: .8 });
  const km = t < FALL_T ? 0 : lerp(1, .4, eio(pr(t, 5.0, 6.8))) * (1 - .5 * eio(pr(t, 8.8, 9.6))) + .55 * win(t, 11.7, 13.9, .5, .8);
  kneeMark(c, G, C.red, km * (1 - eio(pr(t, 14.6, 15.3))), FALL_T, t);
  const p = G.at('chest'), sq = eio(pr(t, 6.7, 8.1)), r = lerp(lerp(6, 3.5, sq), 6.5, eo(pr(t, 14.7, 15.3)));
  chestDot(c, G, C.gold, hookDotA(t), r);
  if (t > 6.7 && t < 8.4) ring(c, p[0], p[1], lerp(150, 9, sq), C.ice, .7 * pr(t, 6.7, 7.0) * (1 - pr(t, 7.9, 8.3)), 2);          // 开心被压小
  if (t > 10.15 && t < 10.9) ring(c, p[0], p[1], lerp(130, 8, eio(pr(t, 10.15, 10.75))), C.red, .6 * pr(t, 10.15, 10.3) * (1 - pr(t, 10.6, 10.85)), 2);  // 先怪自己
  ringPulse(c, t, 15.0, p[0], p[1], 8, 90, C.gold, .6, .5);
  hlDust(t);
}

// 标题的光尘（成片时间）：光点在 15.4 秒碎成 3600 粒，在黑里漂成一团星云、慢慢移到片名的位置；
// 22 秒起聚拢，23.475 秒（全曲进入）落成“懂事”；场景时间 20.2 秒以后再散成尘往上飘，流进下一场的人物里
const TT = V ? { x: 540, y: 820, size: 220, ls: 36 } : { x: 960, y: 470, size: 230, ls: 48 };
let DUST = null;
function dustPts() {   // “懂事”的字形里取 3600 颗光尘：笔画边缘多、里面少，位置带一点抖动
  if (DUST) return DUST;
  const f = `900 ${TT.size}px 'Noto Serif SC'`; if (!document.fonts.check(f, '懂事')) return null;
  const cv2 = mk(W, H), c2 = cv2.getContext('2d', { willReadFrequently: true });
  drawChars(c2, parse('懂事'), TT.x, TT.y, { size: TT.size, font: FS.serif, weight: 900, ls: TT.ls, t0: 0 });
  const d = c2.getImageData(0, 0, W, H).data, A = (x, y) => x < 0 || y < 0 || x >= W || y >= H ? 0 : d[(y * W + x) * 4 + 3], E = [], I = [];
  let n = 0;
  for (let y = 0; y < H; y += 2) for (let x = 0; x < W; x += 2) { n++; if (A(x, y) <= 140) continue;
    const edge = A(x - 4, y) < 140 || A(x + 4, y) < 140 || A(x, y - 4) < 140 || A(x, y + 4) < 140;
    (edge ? E : I).push([x + (rnd(n, 31) - .5) * 1.6, y + (rnd(n, 32) - .5) * 1.6, edge ? 1 : 0]); }
  const pick = (L, m) => { const o = []; for (let i = 0; i < m && L.length; i++) o.push(L[Math.floor((i + rnd(i, 33) * .9) * L.length / m) % L.length]); return o; };
  const ne = Math.min(E.length, 2300), out = [...pick(E, ne), ...pick(I, 3600 - ne)];
  out.sort((a, b) => rnd(Math.round(a[0] * 7 + a[1] * 13), 34) - rnd(Math.round(b[0] * 7 + b[1] * 13), 34));
  DUST = out; return out;
}
// 第 i 颗光尘在 t 秒的屏幕位置（20.2 秒以后：从字上散开，往上飘）
function dustAt(i, t) {
  const P = DUST; const q = P[i % P.length], k = eo(pr(t, 20.2, 22.8));
  return [q[0] + Math.sin(i * 1.7 + t * 1.3) * 10 * k + (rnd(i, 27) - .5) * 220 * k, q[1] - (30 + 180 * rnd(i, 28)) * k + Math.cos(i + t * 1.1) * 8 * k];
}
const T_IN = BAR(10);   // 23.475：全曲进入
// 片名前：光尘在黑里拼出大人们常说的那些“懂事”的话，再一起流进“懂事”两个字（这两个字是这些话压出来的）
const PHR = V ? [['别哭了', 290, 420], ['听话', 800, 380], ['让着点', 250, 640], ['别添乱', 830, 610], ['懂点事', 540, 300], ['要体谅爸妈', 540, 1080], ['乖', 230, 900], ['大人的事你别管', 560, 1240]]
              : [['别哭了', 420, 290], ['听话', 1500, 270], ['让着点', 300, 540], ['别添乱', 1640, 560], ['懂点事', 760, 170], ['要体谅爸妈', 1180, 160], ['乖', 560, 760], ['大人的事你别管', 1320, 780]];
const PHS = V ? 64 : 58;
let PHP = null;
function phrasePts() {   // 每颗光尘分到一句话里的一个位置（屏幕坐标）
  if (PHP) return PHP;
  const f = `500 ${PHS}px 'Noto Sans SC'`; if (!document.fonts.check(f, PHR.map(p => p[0]).join(''))) return null;
  const L = PHR.map(([s, x, y]) => { const w = Math.ceil(PHS * (s.length + 1) + 40), h = Math.ceil(PHS * 2), cv2 = mk(w, h), c2 = cv2.getContext('2d', { willReadFrequently: true });
    drawChars(c2, parse(s), w / 2, h / 2, { size: PHS, font: FS.sans, weight: 500, ls: 6, t0: 0 });
    const d = c2.getImageData(0, 0, w, h).data, o = []; let n = 0;
    for (let yy = 0; yy < h; yy += 2) for (let xx = 0; xx < w; xx += 2) if (d[(yy * w + xx) * 4 + 3] > 110) { n++; o.push([x + xx - w / 2 + (rnd(n, 71) - .5) * 1.5, y + yy - h / 2 + (rnd(n, 72) - .5) * 1.5]); }
    return o; });
  const tot = L.reduce((a, o) => a + o.length, 0), out = [];
  for (let i = 0; i < 3600; i++) {   // 按字数比例分配，长句分到的光尘多
    let r = (i + .5) / 3600 * tot, j = 0; while (j < L.length - 1 && r >= L[j].length) { r -= L[j].length; j++; }
    const o = L[j]; out.push(o[Math.floor(rnd(i, 73) * o.length)]);
  }
  return PHP = out;
}
function nebAt(i, t, S0) {   // 漂浮阶段第 i 颗光尘的位置：先炸开、停住，再整团移到片名周围（一团松散的星云），一直在慢慢飘
  const q = DUST[i], an = -Math.PI * (.08 + .84 * rnd(i, 23)), d = (V ? 160 : 180) + (V ? 380 : 420) * Math.pow(rnd(i, 24), .7);
  const bx = S0[0] + Math.cos(an) * d * (V ? .9 : 1.3), by = S0[1] + Math.sin(an) * d * .75;
  const gx = q[0] + (rnd(i, 25) - .5) * (V ? 660 : 900), gy = q[1] + (rnd(i, 26) - .5) * (V ? 480 : 340);
  const e = 1 - Math.exp(-3.2 * Math.max(0, t - 15.4)), m = eio(pr(t, 16.6, 21.9)), f = .6 + .8 * rnd(i, 36), ph = rnd(i, 37) * 6.283;
  let x = lerp(S0[0] + (bx - S0[0]) * e, gx, m) + Math.sin(t * .5 * f + ph) * 34, y = lerp(S0[1] + (by - S0[1]) * e, gy, m) + Math.cos(t * .4 * f + ph) * 24 - 9 * Math.max(0, t - 15.4) * (1 - m);
  const Q = PHP && PHP[i];
  if (Q) { const s0 = 16.9 + 1.4 * rnd(i, 74), w = eio(pr(t, s0, s0 + 1.1)) * (1 - eio(pr(t, 23.3, 23.5))), dr = Math.max(0, t - 18) * 6;
    x = lerp(x, Q[0] + Math.sin(t * .9 + i) * .8, w); y = lerp(y, Q[1] - dr * .45, w); }
  return [x, y];
}
function titleDust(t, T) {
  if (t < 15.4 || T > 22.7) return;
  const P = dustPts(); if (!P) return; phrasePts(); const S0 = hookDotScreen(), c = sx;
  const hot = mixC(C.gold, C.white, .6), gc = mixC(C.gold, C.lamp, .4);
  for (let i = 0; i < P.length; i++) {
    const q = P[i]; let x, y, k, ox, oy;
    if (t < T_IN) {        // 炸开 → 漂浮 → 聚拢（每颗各自的弧线，落定时间散在 23.25–23.475）
      const t0 = 15.4 + .25 * rnd(i, 21); if (t < t0) continue;
      const te = T_IN - .22 * rnd(i, 22), ts = te - 1.0 - .45 * rnd(i, 38), sw = (rnd(i, 39) - .5) * (V ? 260 : 380);
      const at = tt => { const N = nebAt(i, tt, S0), u = eio(pr(tt, ts, te)), w = Math.sin(Math.PI * u) * sw; return [lerp(N[0], q[0], u) + w, lerp(N[1], q[1], u) - Math.abs(w) * .35, u]; };
      const A = at(t), u = A[2]; x = A[0]; y = A[1];
      const tw = Math.pow(.5 + .5 * Math.sin(t * (1.3 + 2.2 * rnd(i, 35)) + i), 6), base = (.5 + .75 * tw) * (q[2] ? 1.1 : .85);
      const wp = PHP ? eio(pr(t, 17.4, 18.6)) * (1 - eio(pr(t, 22.4, 23.2))) : 0;   // 拼成那些话的时候
      k = eo(pr(t, t0, t0 + .12)) * (u > 0 ? lerp(base, .3 + .4 * u, u) * (1 + 1.2 * Math.sin(Math.PI * u)) : base * (1 + .9 * wp) + .7 * Math.exp(-(t - 15.4) * 2.4));
      if (t < 16.3 || (u > 0 && u < 1)) { const B = at(t - .03); ox = B[0]; oy = B[1]; }
    } else if (T < 20.2) {   // 落定：23.475 那一下最亮，之后只剩零星的闪
      x = q[0]; y = q[1]; const tw = Math.pow(.5 + .5 * Math.sin(T * (2 + 3 * rnd(i, 35)) + i), 12);
      k = .5 * Math.exp(-(T - 17.05) * 3) + (q[2] ? .1 : .03) + .55 * tw * q[2];
      if (i % 3 === 0 && T < 18.4) {   // 冲击波：三分之一的光尘从笔画上被震出去，带一小段光迹
        const u = pr(T, 17.05, 18.4), an = Math.atan2(q[1] - TT.y, q[0] - TT.x) + (rnd(i, 78) - .5) * .5, dd = (90 + 620 * Math.pow(rnd(i, 79), 1.6)) * eo(u);
        const sx_ = q[0] + Math.cos(an) * dd, sy_ = q[1] + Math.sin(an) * dd * .7, kk = .9 * (1 - u) * (1 - u);
        PX.sline(q[0] + Math.cos(an) * dd * .82, q[1] + Math.sin(an) * dd * .7 * .82, sx_, sy_, mixC(C.gold, C.white, .5), 0, kk * .6);
        PX.spt(sx_, sy_, mixC(C.gold, C.white, .5), kk, .6);
      }
    } else {   // 散：往上飘，场景时间 22.6 秒以前流进下一场的人物里
      [x, y] = dustAt(i, T); [ox, oy] = dustAt(i, T - .04);
      k = (.12 + .3 * pr(T, 20.2, 20.6) * (1 - pr(T, 20.6, 21.6))) * (1 - eio(pr(T, 21.5, 22.6))) * (.7 + .3 * Math.sin(T * 9 + i));
    }
    if (k <= .003) continue;
    if (ox !== undefined && i % 4 === 0) PX.sline(ox, oy, x, y, gc, 0, k * .4);
    PX.spt(x, y, rnd(i, 30) < .2 ? hot : gc, k, (t < T_IN ? i % 3 : i % 5) ? 0 : .5);
  }
  if (t < 16.0) { PX.useM(c); c.save(); c.setTransform(1, 0, 0, 1, 0, 0); glow(c, S0[0], S0[1], 70, C.gold, .7 * (1 - pr(t, 15.4, 16.0))); c.restore(); }
  PX.flush(c);
}
// 片尾（成片时间）：金色微尘从画面下方升起，聚回同一个“懂事”的字形
function endDust(t) {
  if (t < 203.75) return; const P = dustPts(); if (!P) return;
  const hot = mixC(C.gold, C.white, .6), gc = mixC(C.gold, C.lamp, .4), fo = 1 - eio(pr(t, 207.95, 208.5));
  for (let i = 0; i < P.length; i++) {
    const q = P[i], ts = 203.75 + .55 * rnd(i, 81), te = ts + .85 + .3 * rnd(i, 82); if (t < ts) continue;
    const x0 = W * rnd(i, 83), y0 = H * (.6 + .45 * rnd(i, 84)), mx = (x0 + q[0]) / 2 + (rnd(i, 85) - .5) * 360, my = (y0 + q[1]) / 2 + (rnd(i, 86) - .5) * 240;
    const B = u => { const v = 1 - u; return [v * v * x0 + 2 * v * u * mx + u * u * q[0], v * v * y0 + 2 * v * u * my + u * u * q[1]]; };
    let x, y, k, ox, oy;
    if (t < te) { const u = eio(pr(t, ts, te)); [x, y] = B(u); [ox, oy] = B(eio(pr(t - .03, ts, te))); k = (.15 + .35 * u) * eo(pr(t, ts, ts + .25)) * (1 + .8 * Math.sin(Math.PI * u)); }
    else { x = q[0]; y = q[1]; const tw = Math.pow(.5 + .5 * Math.sin(t * (2 + 3 * rnd(i, 35)) + i), 12); k = .3 * Math.exp(-(t - te) * 3) + (q[2] ? .08 : .025) + .4 * tw * q[2]; }
    k *= fo; if (k <= .003) continue;
    if (ox !== undefined && i % 4 === 0) PX.sline(ox, oy, x, y, gc, 0, k * .4);
    PX.spt(x, y, rnd(i, 30) < .2 ? hot : gc, k, i % 5 ? 0 : .5);
  }
  PX.flush(sx);
}

// ===================== 2 / 5. 父母与孩子：情绪雨、伞（场景时间 21.3–59.4，112.75–123.4 同一个世界） =====================
const PWL = { fy: 780, ax: 800, k0: 1180, k1: 1040, ah: 460, kh: 230 };
const CRACK = (() => { const o = []; for (let i = 0; i <= 12; i++) o.push([lerp(905, 1062, i / 12), 786 + (i % 2 ? 9 : 1) + rnd(i, 40) * 5]); return withLen(o); })();
function innerChild(G, a, t) {   // 父母心里那个没长大的孩子：一团余烬色的光尘
  if (a <= 0) return; const hip = G.at('hip'), ch = G.at('chest'), mx = lerp(hip[0], ch[0], .45), my = lerp(hip[1], ch[1], .45);
  const F = { kind: 'child', P: PO.shrink, x: mx + 2, y: my + 70, h: 140, dir: 1, rim: C.ember, nobody: true, a, gain: 1.3, bloom: .25 };
  const g = drawFig(F), p = g.at('chest'); glow(sx, p[0], p[1], 46, C.ember, .22 * a);
  return g;
}
function cloudAt(t) {
  let x = 800, y = 150, s = [.8, .7];
  const m1 = eio(pr(t, 34.16, 35.3)); x = lerp(x, 1180, m1); y = lerp(y, 200, m1);
  const m2 = eio(pr(t, 43.6, 44.8)); x = lerp(x, 930, m2); y = lerp(y, 150, m2); s = [lerp(s[0], 1.5, m2), lerp(s[1], .5, m2)];
  const m3 = eio(pr(t, 120.0, 121.2)); x = lerp(x, 800, m3); y = lerp(y, 150, m3); s = [lerp(s[0], .7, m3), lerp(s[1], .6, m3)];
  const g = lerp(.6, 1, eo(pr(t, 32.1, 32.9))); return { x, y, s: [s[0] * g, s[1] * g], a: eo(pr(t, 32.1, 32.8)) };
}
const SWAP = t => t < 59.74 || t > 70 ? 0 : eio(pr(t, 59.74, 60.75));   // 重拍 2（成片 56.175）：孩子长高、大人缩小
function kidParent(t) {
  const L = PWL;
  let x = lerp(L.k0, L.k1, eio(pr(t, 44.0, 45.5)));
  x = lerp(x, L.k0, eio(pr(t, 122.1, 123.4)));
  let P = poseSeq(t, [[0, PO.stand], [35.0, PO.sad, .6], [39.95, PO.bow, .3], [45.3, PO.hold, .7], [121.4, PO.stand, .6], [123.5, { ...PO.stand, hd: -8, sp: -1 }, .6]]);
  const w1 = eio(pr(t, 44.0, 44.25)) * (1 - eio(pr(t, 45.25, 45.5))), w2 = eio(pr(t, 122.1, 122.35)) * (1 - eio(pr(t, 123.15, 123.4)));
  if (w1 > 0) P = lerpPose(P, walkPose((L.k0 - x) / 70 * Math.PI, 0), w1);
  if (w2 > 0) P = lerpPose(P, walkPose((x - L.k1) / 70 * Math.PI, 0), w2);
  let rim = mixC(C.gold, C.ice, eio(pr(t, 34.6, 35.8)));
  rim = mixC(rim, mixC(C.ice, C.gold, .45), eio(pr(t, 113.4, 115.6)));
  rim = mixC(rim, C.gold, eio(pr(t, 122, 123)));
  const sw = SWAP(t);
  return { kind: 'child', tpl: sw < .5 ? 'child' : 'adult', bn: sw > 0 ? bnMix(BN.child, BN.adult, sw) : undefined, P, x, y: L.fy, h: lerp(L.kh, 480, sw), rim: mixC(rim, mixC(C.ice, C.white, .5), .6 * sw), scatter: Math.sin(Math.PI * sw) * .7, gain: 1 + .5 * sw, refl: L.fy, draw: t < 23.1 ? pr(t, 21.95, 23.1) : undefined, src: t < 23.1 && DUST ? (id, s0) => PX.inv(...dustAt(id, 21.95 + s0 * 1.15)) : undefined };
}
function sceneParent(t) {
  const c = sx, L = PWL, fy = L.fy;
  lampPool(c, 960, 430, 920, 1);
  lampCone(c, 960, -80, fy + 40, 80, 720, .8);
  floorLine(c, fy, 260, 1720, 1, pr(t, 21.3, 22.4));
  motes(t, 960, 430, 700, 330, 130, C.lamp, .85);
  // 地上的裂缝：吵完架 → 一道白线把它“封上”（要你马上原谅）
  const ca = eo(pr(t, 36.6, 36.7)) * (1 - pr(t, 48, 51));
  if (ca > 0) {
    const cu = eo(pr(t, 36.6, 37.05)), ci = lerp(1, .35, eio(pr(t, 37.7, 38.4)));
    c.save(); c.shadowColor = rgba(C.red, 1); c.shadowBlur = 12; strokePartial(c, CRACK, cu, rgba(C.red, ci * ca), 2.6); c.restore();
    const su = eio(pr(t, 37.6, 37.85)); if (su > 0) { seg(c, 900, 790, lerp(900, 1068, su), 790, C.white, .85 * ca * lerp(1, .55, pr(t, 38.2, 39)), 4); }
  }
  // 父母
  const aP = poseSeq(t, [[0, PO.stand], [35.3, PO.cross, .3], [36.45, PO.stand, .5], [44.0, PO.sad, .8], [121.0, PO.holdA, .7]]);
  const tmp = .7 * win(t, 35.28, 36.58, .08, .25);   // 你一提意见：大人一下变红（防御）
  const sw = SWAP(t);
  const GA = drawFig({ kind: 'adult', tpl: sw < .5 ? 'adult' : 'child', bn: sw > 0 ? bnMix(BN.adult, BN.child, sw) : undefined, P: sw > 0 ? lerpPose(aP, { ...PO.shrink, hd: 30 }, sw) : aP, x: L.ax, y: fy, h: lerp(L.ah, 215, sw), dir: 1, rim: mixC(mixC(C.silver, C.red, tmp), C.ember, .45 * sw), scatter: Math.sin(Math.PI * sw) * .7, refl: fy, draw: t < 22.9 ? pr(t, 21.5, 22.9) : undefined, src: t < 22.9 && DUST ? (id, s0) => PX.inv(...dustAt(id, 21.5 + s0 * 1.4)) : undefined });
  let ia = eo(pr(t, 22.2, 23.0)) * (.82 + .18 * Math.sin(t * 7.3) * Math.sin(t * 3.1));
  ia *= 1 + .7 * (1 - pr(t, 25.7, 26.5)) * (t > 25.7 ? 1 : 0); ia *= lerp(1, .35, eio(pr(t, 32.1, 33.2)));
  const GI = innerChild(GA, clamp(ia), t);
  if (GI) { const p = GI.at('chest'); ringPulse(c, t, 25.7, p[0], p[1], 20, 150, C.ember, 1.0, .6); }
  // 孩子（转身 = 两个朝向交叉淡化）
  const K = kidParent(t), flip = eio(pr(t, 121.9, 122.2));
  let GK;
  if (flip < 1) GK = drawFig({ ...K, dir: -1, a: 1 - flip });
  if (flip > 0) GK = drawFig({ ...K, dir: 1, a: flip });
  // 你一提意见：“都怪我，行了吧！”——红色气泡从大人头上弹出来
  if (t > 35.28 && t < 36.6) {
    const hd = GA.at('head'), u = pr(t, 35.28, 35.48), k = 1 + .18 * Math.sin(Math.PI * u) * (u < 1 ? 1 : 0), ba = eo(u) * (1 - eio(pr(t, 36.38, 36.58)));
    c.save(); c.translate(hd[0] - 40, hd[1] - 96); c.scale(k, k); pill(c, '我还能害你吗？', 0, 0, C.red, ba, 30); c.restore();
    ringPulse(c, t, 35.3, hd[0], hd[1], 14, 130, C.red, .8, .6);
  }
  // 伞：孩子举着，替大人挡雨；后来交还给大人
  const ua = eo(pr(t, 45.3, 45.6)), uo = eio(pr(t, 45.6, 46.3)), hand = eio(pr(t, 121.0, 121.8));
  let dome = null;
  if (ua > 0) {
    const kh = GK.at('haN'), ah = GA.at('haN'), hx = lerp(kh[0], ah[0], hand), hy = lerp(kh[1], ah[1], hand) - 40 * Math.sin(Math.PI * hand);
    dome = umbrella(c, hx, hy, lerp(820, 835, hand), lerp(lerp(200, 236, hand), 400, sw), lerp(190, 160, sw), uo, mixC(C.silver, C.ice, .4 * sw), ua);
  }
  if (t > 59.7 && t < 61.5) { const kc = GK.at('chest'), ac = GA.at('chest');
    burst(c, t, 59.74, kc[0], kc[1], { n: 90, seed: 41, col: mixC(C.ice, C.white, .4), v0: 120, v1: 620, g: 60, life: 1.4 });
    burst(c, t, 59.74, ac[0], ac[1], { n: 50, seed: 43, col: C.ember, v0: 60, v1: 320, g: 120, life: 1.2 });
    ringPulse(c, t, 59.74, kc[0], kc[1], 10, 320, C.ice, 1.1, .8); }
  // 你有委屈，甚至被霸凌：孩子想说的话，冒出来就被雨打灭（场景 46.8–50.6）
  if (t > 46.8 && t < 50.8 && GK) {
    const hk = GK.at('head'), u = eo(pr(t, 46.8, 47.2)), f = eio(pr(t, 49.3, 50.6));
    c.save(); c.translate(hk[0] + 210, hk[1] + 10 + 30 * f); c.scale(1 - .45 * f, 1 - .45 * f); pill(c, '我在学校被欺负了……', 0, 0, mixC(C.ice, C.gray, f), u * (1 - f), 26); c.restore();
  }
  // 云和雨（雨在 119.6 秒倒流回云里；云缩回大人头顶）
  const CL = cloudAt(t);
  if (CL.a > 0) {
    const [x0, x1, yb] = cloudSpan(CL.x, CL.y, CL.s);
    if (t > 34.16 && t < 121.0) rain(c, t, { x0, x1, y0: yb - 10, y1: fy, n: Math.round(.2 * (x1 - x0)), sp: 950, a: eo(pr(t, 34.16, 34.7)) * .8, block: dome && uo > .6 ? [dome] : [], rev: [119.6, 1.0] });
    if (t > 121.3) rain(c, t, { x0, x1, y0: yb - 10, y1: fy, n: Math.round(.16 * (x1 - x0)), sp: 900, a: eo(pr(t, 121.3, 121.8)) * .7, block: dome ? [dome] : [] });
    cloud(c, CL.x, CL.y, CL.s, CL.a, t);
    ringPulse(c, t, 121.53, CL.x, CL.y, 20, 220, C.ice, 1.0, .6);
  }
  // 标签：“你的错”掉在孩子头上；“不孝”掉下来、烧掉
  const hd = GK.at('head'), top = hd[1] - BN.child.hr * L.kh - 22;
  if (t > 39.45 && t < 122.4) {
    const u = pr(t, 39.45, 39.95), y = u < 1 ? lerp(top - 420, top, u * u) : top + 4 * Math.sin(Math.min(1, (t - 39.95) * 4) * Math.PI) * (1 - pr(t, 39.95, 40.4));
    const g = eio(pr(t, 121.7, 122.0)), fa = 1 - pr(t, 121.95, 122.3);
    pill(c, '不懂事', hd[0] + 26, y, mixC(C.red, C.gold, g), fa * (1 - win(t, 59.5, 63.3, .3, .1)), 30);
    burst(c, t, 121.95, hd[0] + 26, y, { n: 40, seed: 13, col: C.gold, v0: 40, v1: 240, a0: -Math.PI, spread: Math.PI, g: -60, life: 1.2 });
  }
  if (t > 113.5 && t < 115.3) {
    const u = pr(t, 113.5, 114.0), y = lerp(top - 460, top - 44, u * u), bu = pr(t, 114.0, 114.4);
    pill(c, '不孝', hd[0] + 26, y, mixC(C.red, C.ember, bu), 1 - bu, 30);
    burst(c, t, 114.0, hd[0] + 26, y, { n: 54, seed: 17, col: C.ember, v0: 30, v1: 260, a0: -Math.PI, spread: Math.PI, g: -120, life: 1.2 });
  }
  // 孩子胸口：生气是正常的（余烬金的脉动）→ 稳定的金色小光点
  if (t > 113.3) {
    const pu = win(t, 113.3, 115.6, .5, .8), p = GK.at('chest');
    glow(c, p[0], p[1], 60 + 14 * Math.sin(t * 5), mixC(C.ember, C.gold, .5), .45 * pu * (.75 + .25 * Math.sin(t * 5)));
    chestDot(c, GK, C.gold, .3 * (t < 122 ? pu : 0) + eo(pr(t, 122.2, 123.0)), 6);
  }
}

// ===================== 3. 手机：在等的那句话（场景时间 84.9–93.5） =====================
const PH = V ? { x: 960, y: 500, w: 300, h: 600 } : { x: 990, y: 500, w: 300, h: 600 };
function scenePhone(t) {
  const c = sx, P = PH, g = eo(pr(t, 76.75, 77.25)), sh = 1 - .85 * eio(pr(t, 90.8, 93.0)), sc = g * sh, a = 1 - eio(pr(t, 92.2, 93.3));
  if (sc <= .01 || a <= 0) return;
  c.save(); c.translate(CAM.fx, CAM.fy); c.scale(sc, sc); c.translate(-CAM.fx, -CAM.fy);
  const x0 = P.x - P.w / 2, y0 = P.y - P.h / 2;
  glow(c, P.x, P.y, 520, C.ice, .16 * win(t, 80, 86, .8, 2.4) * a);   // 挂掉电话后，一圈很久才散的冷光
  phoneFrame(c, P.x, P.y, P.w, P.h, a, pr(t, 76.8, 77.4));
  c.save(); rrect(c, x0 + 12, y0 + 12, P.w - 24, P.h - 24, 36); c.clip();
  // 黑下来的屏幕里，映出一个小孩
  const ra = .32 * eo(pr(t, 82.6, 83.6)) * a;
  if (ra > 0) drawFig({ kind: 'child', P: PO.bow, x: P.x, y: P.y + P.h / 2 + 10, h: 340, dir: 1, rim: C.ice, nobody: true, a: ra * 1.6 });
  // 在等的那句话：对方“正在输入”，然后停了
  const ba2 = eo(pr(t, 85.4, 85.9)) * (1 - eio(pr(t, 89.0, 90.2))) * a;
  if (ba2 > 0) {
    const bx = x0 + 40, by = y0 + 150; rrect(c, bx, by, 150, 58, 26); c.fillStyle = rgba(C.body, .95 * ba2); c.fill(); c.strokeStyle = rgba(C.ice, .6 * ba2); c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 3; i++) { const live = t < 88.6 ? .35 + .65 * Math.max(0, Math.sin(PX.t * 6 - i * .8)) : .3; dot(c, bx + 45 + i * 30, by + 29, 6, C.ice, live * ba2); }
    c.font = `500 24px ${FS.sans}`; c.fillStyle = rgba(C.gray, .9 * ba2); c.fillText('妈妈', bx + 4, by - 22);
  }
  c.restore(); c.restore();
}

// ===================== 4. 根：他们也曾是那个孩子 → 盆景（场景时间 93.84–112.8；96.3–100.9 跳过） =====================
const RT = { fy: 760, bx: 960, pl: V ? [700, 196, 1220, 362] : [1500, 200, 1720, 700] };   // 牌匾：横屏在右边竖着挂，竖屏在头顶横着挂
const BON = { x: RT.bx, y: RT.fy - 42 }, BSC = 1.35;   // 盆景整体放大 1.35 倍（以盆底为中心）
const RT_M = t => eio(pr(t, 94.0, 95.3));               // 93.84：大人 → 缩成那个孩子
const RT_BOY = t => { const m = RT_M(t); return { kind: 'child', tpl: 'adult', bn: bnMix(BN.adult, BN.child, m), P: poseSeq(t, [[0, PO.stand], [95.35, PO.bow, .85]]), x: RT.bx, y: RT.fy,
  h: lerp(440, BOY_H, m), dir: 1, rim: mixC(C.silver, C.ice, .35 * m), scatter: Math.sin(Math.PI * m) * .6, refl: RT.fy }; };
const SNIP = [102.25, 102.795, 103.34];   // 成片 68.71 / 69.255 / 69.80，三刀落在拍上
function bonsaiS(t) {
  return { g: lerp(.55, 1, eio(pr(t, 102.1, 103.9))), tw: eio(pr(t, 104.0, 105.8)), cut: SNIP.map(s => lerp(1, .58, eo(pr(t, s, s + .12)))), wire: pr(t, 102.6, 104.0) };
}
const bonsaiTrace = (key, s) => traceShape(key, [BON.x - 260, BON.y - 340, BON.x + 260, BON.y + 50], c => bonsai(c, BON.x, BON.y, { ...s, col: [255, 255, 255] }), .7);
const bonScale = c => { c.translate(BON.x, BON.y + 42); c.scale(BSC, BSC); c.translate(-BON.x, -(BON.y + 42)); };
function sceneRoots(t) {
  const c = sx, fa = (1 - eio(pr(t, 110.4, 111.0))) * lerp(1, .45, eio(pr(t, 106.6, 107.4)));
  lampCone(c, 960, -500, RT.fy + 40, 70, 620, .8 * fa);
  floorLine(c, RT.fy, 560, 1360, fa, eo(pr(t, 93.84, 94.6)));
  lampPool(c, 960, 420, 800, fa);
  motes(t, 960, 380, 620, 420, 120, C.lamp, .8 * fa);
  // 牌匾：孩子只该被看见，不该被听见（父母那一代的规矩）
  const [px0, py0, px1, py1] = RT.pl, pu = pr(t, 96.9, 97.6), pcx = (px0 + px1) / 2, pfa = fa * (1 - eio(pr(t, 100.6, 101.2)));
  if (pu > 0 && pfa > 0) {
    c.globalAlpha = pfa; c.fillStyle = rgba(C.body, .9 * eo(pu)); c.fillRect(px0, py0, px1 - px0, py1 - py0);
    strokePartial(c, withLen([[px0, py0], [px1, py0], [px1, py1], [px0, py1], [px0, py0]]), eio(pu), rgba(C.silver, .55), 2);
    if (pu >= 1) { c.strokeStyle = rgba(C.silver, .2); c.lineWidth = 1; c.strokeRect(px0 + 10, py0 + 10, px1 - px0 - 20, py1 - py0 - 20); }
    const cols = V ? [['大人说话，', pcx, py0 + 50, 1], ['小孩别插嘴', pcx, py0 + 118, 1]] : [['大人说话', pcx + 35, py0 + 50, 0], ['小孩别插嘴', pcx - 35, py0 + 50, 0]]; let k = 0;
    c.font = `900 50px ${FS.serif}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    cols.forEach(([s, x, y, row]) => { const n = [...s].length; [...s].forEach((ch, j) => { const ta = 97.7 + k++ * .09, v = eo(pr(t, ta, ta + .3)); if (v <= 0) return;
      c.fillStyle = rgba(C.lamp, v); if (row) c.fillText(ch, x + (j - (n - 1) / 2) * 56, y + 6 * (1 - v)); else c.fillText(ch, x, y + j * 60 + 6 * (1 - v)); }); });
    c.textAlign = 'left'; c.globalAlpha = 1;
  }
  // 大人 → 那个孩子；孩子 → 光点 → 一棵被修剪、捆扎的树
  const ba = eo(pr(t, 93.84, 93.9)) * (1 - pr(t, 101.2, 101.45)) * fa;
  if (ba > 0) drawFig({ ...RT_BOY(t), a: ba, gain: 1 + 1.5 * (1 - pr(t, 93.84, 94.4)) });
  const ga = win(t, 93.9, 96.6, .3, 1.0) * fa;   // 一代一代往回倒：缩小的过程留下几道残影，排在他身后
  if (ga > 0) for (let k = 1; k <= 3; k++) { const m0 = RT_M(t) * (1 - k / 4), B = RT_BOY(94.0 + m0 * 1.3);
    drawFig({ ...B, x: RT.bx - k * (V ? 150 : 175), P: PO.stand, a: ga * (.42 - k * .1), sparse: true, nobody: true, rim: mixC(C.silver, C.ice, .5), scatter: 0, refl: undefined }); }
  if (t > 101.2 && t < 102.6) {   // 光点按高度一一对应：头顶的光落到树梢，脚下的光落进花盆
    const A = figScreenPts({ ...RT_BOY(101.2), scatter: 0 }); c.save(); bonScale(c); const B = bonsaiScreenPts(BON.x, BON.y, { g: .55, tw: 0, cut: [1, 1, 1], wire: 0 }); c.restore();
    const n = A.length, col = mixC(C.silver, C.ice, .5), hot = mixC(col, C.white, .6);
    for (let i = 0; i < n; i++) {
      const p = A[i], q = B[Math.floor(i * B.length / n)], s0 = 101.2 + .35 * (i / n) + .15 * rnd(i, 61), d = .55 + .3 * rnd(i, 62);
      const at = tt => { const u = eio(pr(tt, s0, s0 + d)); return [lerp(p[0], q[0], u) + Math.sin(u * Math.PI) * (rnd(i, 63) - .5) * 160, lerp(p[1], q[1], u) - Math.sin(u * Math.PI) * 90 * rnd(i, 64), u]; };
      const P1 = at(t), P0 = at(t - .02), u = P1[2], k = p[2] * (.35 + .5 * Math.sin(Math.PI * u)) * (1 - pr(t, 102.15, 102.55)) * fa;
      if (k <= .003) continue;
      if (u > 0 && u < 1 && i % 3 === 0) PX.sline(P0[0], P0[1], P1[0], P1[1], col, 0, k * .4);
      PX.spt(P1[0], P1[1], rnd(i, 65) < .15 ? hot : col, k);
    }
    PX.flush(c);
  }
  const ta = eo(pr(t, 101.95, 102.35)) * fa;
  if (ta > 0) {
    const s = bonsaiS(t);
    c.save(); bonScale(c);
    const ga = win(t, 104.4, 105.9, .6, .5) * fa;   // 它本来的样子：一圈慢慢走动的冰蓝虚线
    if (ga > 0) { const p = bonsaiTrace('bonNat', { g: 1, tw: 0, cut: [1, 1, 1], wire: 0 }); PX.useM(c);
      for (let i = 0; i < p.length; i++) { const m = .5 + .5 * Math.sin(i * .25 - t * 6); PX.pt(p[i][0], p[i][1], C.ice, 1.3 * ga * m * m, .5); } PX.flush(c); }
    bonsaiP(c, BON.x, BON.y, { ...s, a: ta, col: C.silver }, t);
    const ache = win(PX.t, 172.5, 177.1, .5, .5) * fa;   // 他们只顾自己，像一直疼着的人：树干里一道红光，跟着心跳一下一下地疼
    if (ache > 0) { const G = bonsaiGeom(BON.x, BON.y, s), hb = Math.pow(Math.max(0, Math.sin((PX.t - 172.5) * Math.PI * 1.6)), 4), A = .35 + .65 * hb;
      c.save(); c.shadowColor = rgba(C.red, 1); c.shadowBlur = 16; polyPath(c, G.T); c.strokeStyle = rgba(C.red, .85 * ache * A); c.lineWidth = 3; c.stroke(); c.restore();
      G.br.forEach(b => glow(c, b.e[0], b.e[1], 46, C.red, .4 * ache * A)); glow(c, G.T[8][0], G.T[8][1], 90, C.red, .22 * ache * A); }
    SNIP.forEach((s0, i) => { const S0 = { ...s, cut: s.cut.map((v, j) => j === i ? 1 : v) }, G = bonsaiGeom(BON.x, BON.y, S0), b = G.br[i];
      snipFX(c, t, s0, b.q[0] + b.dir[0] * b.L * .58, b.q[1] + b.dir[1] * b.L * .58, b.dir, b.L * .42); });
    c.restore();
  }
  // 但伤害，是真的：开头摔倒在地上的那个孩子再出现一次，膝盖那点红一下一下地疼
  const pa = eo(pr(t, 110.87, 111.1)) * (1 - eio(pr(t, 112.3, 112.75)));
  if (pa > 0) {
    const pulse = .65 + .35 * Math.sin((t - 110.87) * 6);
    floorLine(c, RT.fy, CAM.fx - 400, CAM.fx + 400, pa * .8, 1);
    const G = drawFig({ kind: 'child', P: { ...PO_FALL, hd: 30 }, x: CAM.fx - 60, y: RT.fy, h: BOY_H * 1.3, dir: 1, rim: mixC(C.gray, C.silver, .3), a: pa, refl: RT.fy });
    kneeMark(c, G, C.red, pulse * pa, 110.9, t);
  }
}

// ===================== 6. 门厅（结尾）：长大的你，回来抱抱摔倒的自己（场景时间 140.2–157.4） =====================
// 140.2 回到开头那一幕：小时候的你还跪在地上（膝盖上那点红）；父亲的门关着 → 140.4 长大的你（金色轮廓）从左边走来
// → 142.0 蹲下、张开手臂 → 142.6 膝盖那点红变成金色 → 143.0 他站起来，扑进你怀里；光尘聚成“总是先道歉”，再散掉 → 145.3 举起双手
function sceneHall2(t) {
  const c = sx, L = HALL, fy = L.fy, D = { ...L.d, fy };
  lampPool(c, 900, 420, 950, 1);
  lampCone(c, 900, -60, fy + 40, 70, 640, lerp(.55, 1, eo(pr(t, 140.7, 142))));
  floorLine(c, fy, 200, 1800, 1, 1);
  motes(t, 900, 440, 620, 330, 150, C.lamp, 1);
  door(c, D, { u: 1, open: 0, light: COLD, I: 0, under: .3 });   // 父亲的门：关着，这一次不等他
  const kx = L.b1 + 8, ax1 = kx - 220, ax0 = ax1 - 380, wu = eio(pr(t, 140.4, 142.0)), wx = lerp(ax0, ax1, wu), ww = eio(pr(t, 140.4, 140.65)) * (1 - eio(pr(t, 141.75, 142.0)));
  const OPEN = { ...PO.kneel, hd: -2, aN: 62, eN: 34, aF: 52, eF: 40 }, HUG = { ...PO.kneel, hd: 10, aN: 74, eN: 62, aF: 66, eF: 64 }, WATCH = { ...PO.kneel, hd: -8, aN: 40, eN: 30, aF: 24, eF: 30 };
  let AP = poseSeq(t, [[0, PO.stand], [141.8, PO.reach, .35], [142.1, OPEN, .5], [143.85, HUG, .4], [145.1, WATCH, .6]]);
  if (ww > 0) AP = lerpPose(AP, walkPose((wx - ax0) / 70 * Math.PI, 0), ww);
  const AF = drawFig({ kind: 'adult', P: AP, x: wx, y: fy, h: L.ah, dir: 1, rim: mixC(C.gold, C.white, .2), a: eo(pr(t, 140.35, 140.9)), refl: fy });
  if (t > 140.4 && t < 141.4) ringPulse(c, t, 140.45, AF.at('chest')[0], AF.at('chest')[1], 10, 150, C.gold, 1.0, .5);
  // 小时候的你：跪在地上 → 站起来、扑进怀里 → 举起双手
  const hx = ax1 + 122, bx = lerp(kx, hx, eio(pr(t, 143.35, 143.95))) + 58 * eio(pr(t, 145.0, 145.4));   // 站起来 → 跑进怀里 → 退半步欢呼
  let BP = poseSeq(t, [[0, { ...PO_FALL, hd: 30 }], [141.6, { ...PO_FALL, hd: -4 }, .5], [142.95, { ...PO.stand, hd: 4, aN: 20, eN: 30, aF: 10, eF: 30 }, .4], [143.85, { ...PO.stand, sp: 14, hd: 16, aN: 72, eN: 46, aF: 62, eF: 50 }, .3], [145.0, { ...PO.stand, hd: 0 }, .25], [145.3, PO.cheer, .6]]);
  const bw = eio(pr(t, 143.35, 143.5)) * (1 - eio(pr(t, 143.8, 143.95)));
  if (bw > 0) BP = lerpPose(BP, walkPose((kx - bx) / 60 * Math.PI, .6), bw);
  const brim = mixC(mixC(C.gray, C.gold, .3 * eo(pr(t, 142.6, 143.6))), C.gold, eio(pr(t, 145.3, 146.0)));
  const GB = drawFig({ kind: 'child', P: BP, x: bx, y: fy - 10 * Math.sin(Math.PI * pr(t, 145.3, 145.75)), h: BOY_H, dir: -1, rim: brim, refl: fy, gain: 1 + .4 * eio(pr(t, 145.3, 146)) });
  const gk = eio(pr(t, 142.6, 143.2)), kp = GB.at('knN');   // 膝盖那点红，变成金色，再慢慢化开
  kneeMark(c, GB, mixC(C.red, C.gold, gk), lerp(.55, 1, gk) * (1 - eio(pr(t, 143.6, 144.6))), 142.65, t);
  burst(c, t, 142.65, kp[0], kp[1], { n: 26, seed: 23, col: C.gold, v0: 30, v1: 190, a0: -Math.PI, spread: Math.PI, g: -40, life: 1.1 });
  hlDust(t);
  const cp = GB.at('chest');
  burst(c, t, 145.6, cp[0], cp[1], { n: 60, seed: 31, col: C.gold, v0: 80, v1: 480, g: 120, life: 1.4 });
  chestDot(c, GB, C.gold, eo(pr(t, 145.6, 146.0)), 6.5);
  if (t > 145.6) { PX.useM(c); const ga = eo(pr(t, 145.6, 146.4));   // 金色的微尘，从他身边慢慢往上升
    for (let i = 0; i < 90; i++) { const life = 3 + 2 * rnd(i, 71), u = ((t - 145.6) / life + rnd(i, 72)) % 1, x = cp[0] + (rnd(i, 73) - .5) * 420 + Math.sin(t * .7 + i) * 18, y = fy - 20 - u * 520;
      PX.pt(x, y, mixC(C.gold, C.white, .3 * rnd(i, 74)), ga * 1.3 * Math.sin(Math.PI * u) * (.6 + .4 * Math.sin(t * 5 + i)), .3); }
    PX.flush(c); }
}
