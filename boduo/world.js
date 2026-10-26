// world.js —《被剥夺超级反应》「墙上的影子」
// 整片只有一个世界：一面墙，一个人，手心里一团光。光把人的影子投在身后的墙上：
// 光离身体越近（攥得越紧），影子越大；松开手，光飘走，影子变回人本来的大小。影子就是“超级反应”。
'use strict';
const FY = 800;                                   // 墙脚 = 地面线（世界坐标）
const YOU = { x: V ? 860 : 760, h: 470 };
const WL = mk(W, H), wlx = WL.getContext('2d');   // 墙上的光（影子从这里面挖掉）
const SL = mk(W, H), slx = SL.getContext('2d');   // 剪影（影子、狗、手）先画在这里，再统一模糊、挖掉

// 标量关键帧：[[t, v], ...]，相邻两帧之间缓入缓出
function kv(K, t) {
  if (t <= K[0][0]) return K[0][1];
  for (let i = 0; i < K.length - 1; i++) { const a = K[i], b = K[i + 1]; if (t < b[0]) return lerp(a[1], b[1], eio(pr(t, a[0], b[0]))); }
  return K[K.length - 1][1];
}
// 心跳：每 0.8 秒一下（重 + 轻两拍），返回 0..1
function heart(t) { const p = ((t % .8) + .8) % .8; return Math.exp(-p * 14) + .55 * Math.exp(-Math.max(0, p - .2) * 16) * (p > .2 ? 1 : 0); }

// ---------- 姿势 ----------
const PB = {
  hold:    { sp: 3, hd: 18, aN: 26, eN: 78, aF: 20, eF: 82, lN: 4, kN: -3, lF: -4, kF: -3 },          // 捧着光，低头看它
  drop:    { sp: 10, hd: 34, aN: 34, eN: 30, aF: 28, eF: 34, lN: 4, kN: -3, lF: -4, kF: -3 },         // 光掉了，手还伸着
  catch:   { sp: -3, hd: -18, aN: 62, eN: 60, aF: 56, eF: 64, lN: 4, kN: -3, lF: -4, kF: -3 },        // 接住从上面掉下来的光
  shrug:   { sp: -2, hd: -4, aN: 22, eN: 96, aF: 18, eF: 100, lN: 4, kN: -3, lF: -4, kF: -3 },        // “这不就是小气吗”
  clutch:  { sp: 14, hd: 30, aN: 14, eN: 118, aF: 10, eF: 120, lN: 9, kN: -12, lF: -6, kF: -10 },     // 攥在胸口，弓着背
  pull:    { sp: -10, hd: 10, aN: 10, eN: 124, aF: 8, eF: 126, lN: -6, kN: -4, lF: 14, kF: -16 },     // 往回拽，身子后仰
  reach:   { sp: 16, hd: -2, aN: 74, eN: 16, aF: 66, eF: 22, lN: 20, kN: -8, lF: -14, kF: -10 },      // 伸手去够
  bid:     { sp: 2, hd: -14, aN: 164, eN: 8, aF: 22, eF: 96, lN: 6, kN: -4, lF: -6, kF: -4 },         // 举牌
  release: { sp: -6, hd: -30, aN: 128, eN: 18, aF: 118, eF: 22, lN: 4, kN: -3, lF: -4, kF: -3 },      // 松开手，往上送
  look:    { sp: -2, hd: -22, aN: 10, eN: 16, aF: -4, eF: 14, lN: 4, kN: -3, lF: -4, kF: -3 },        // 抬头看光飘走
};
function youPose(t) {
  return poseSeq(t, [[0, PB.hold], [2.05, PB.drop, .35], [4.3, PB.catch, .3], [5.0, PB.hold, .6], [13.8, PB.shrug, .5], [16.4, PB.hold, .6],
    [32.9, PB.pull, .35], [34.0, PB.clutch, .6], [36.8, PB.hold, .8], [40.0, PB.reach, .7], [45.9, PB.clutch, .4],
    [58.4, PB.hold, .6], [61.7, PB.bid, .25], [62.4, PB.hold, .3], [62.8, PB.bid, .25], [63.4, PB.hold, .3], [63.8, PB.bid, .25], [64.4, PB.hold, .25], [64.8, PB.bid, .2],
    [67.4, PB.hold, .8], [71.2, PB.clutch, .8], [81.0, { ...PB.clutch, sp: 20, hd: 40 }, 1.2], [88.0, PB.hold, 1.0],
    [98.4, { ...PB.hold, hd: 34 }, 1.0], [108.0, PB.release, .8], [110.2, PB.look, 1.2], [113.5, PO.stand, 1.2]]);
}
function youFig(t) { return { kind: 'adult', P: youPose(t), x: YOU.x, y: FY, h: YOU.h, dir: 1, rim: mixC(C.silver, C.lamp, .35), refl: FY, a: kv([[0, 0], [.5, 0], [1.4, 1], [24.2, 1], [25.0, .1], [31.6, .1], [32.4, 1]], t) }; }

// ---------- 手心里的光 ----------
// 返回光的位置（世界坐标）、半径、亮度、颜色；hands = 双手中点
function orb(t, hands) {
  const gold = mixC(C.gold, C.white, .25), grayC = mixC(C.gray, C.silver, .3);
  let x = hands[0] + 18, y = hands[1] - 8, a = 1, r = 22, col = gold;
  // 第一团光（一百块）：2.1 从手里滑落，砸在地上，慢慢熄掉
  if (t < 4.3) {
    a = eo(pr(t, .6, 1.4));
    const f = pr(t, 2.1, 2.55); if (f > 0) { const hx = hands[0] + 30; x = lerp(x, hx + 70, f); y = lerp(y, FY - 14, f * f) - 16 * Math.sin(Math.PI * pr(t, 2.55, 2.85)); }
    const d = pr(t, 2.6, 3.9); col = mixC(gold, C.ice, d); a *= 1 - .85 * d; r = lerp(22, 14, d);
    if (t > 3.9) a *= 1 - pr(t, 3.9, 4.3);
    return { x, y, r, a, col };
  }
  // 第二团光：从上面掉进手里，亮一下，很快暗成一团普通的光
  if (t < 4.95) { const u = pr(t, 4.3, 4.95); return { x, y: lerp(-80, y, u * u), r: 20, a: eo(pr(t, 4.3, 4.5)), col: gold }; }
  r = 22 + 14 * Math.exp(-(t - 4.95) * 2.5) * (t < 6.5 ? 1 : 0); a = 1 + .6 * Math.exp(-(t - 4.95) * 2.2) - .35 * eio(pr(t, 6.0, 7.2));
  // 33 秒：被一只手往外拽了一下
  x += 70 * Math.sin(Math.PI * pr(t, 32.6, 33.9)) * (t < 33.9 ? 1 : 0);
  // 股票、关系：光变灰；问自己那几句，灰里还剩一点
  const g = kv([[70.8, 0], [73.6, .55], [77.6, .85], [97.8, .85], [101.0, .7], [108.0, .7], [109.6, 0]], t);
  col = mixC(gold, grayC, g); a *= 1 - .35 * g;
  a *= kv([[24.0, 1], [24.8, .12], [31.6, .12], [32.4, 1]], t);                  // 狗那一段：你和你的光都退到暗处
  a *= 1 - .85 * win(t, 101.4, 104.1, .6, .5);                                    // “如果它今天不在我手里”：光先消失一下
  // 108 松手：光往上飘，变回金色，110.6 散成星星
  const up = eio(pr(t, 108.3, 110.6)); if (up > 0) { x = lerp(x, x + 60, up); y = lerp(y, 120, up); r = lerp(r, 30, up); a *= 1 + .8 * up; }
  if (t > 110.6) a *= 1 - eo(pr(t, 110.6, 111.0));
  return { x, y, r, a, col };
}
function drawOrb(c, o, t) {
  const gh = win(t, 101.6, 104.0, .6, .5);   // 光不在的时候，手里留一圈虚线：它原来在这儿
  if (gh > 0) { c.save(); c.setLineDash([4, 7]); ring(c, o.x, o.y, 26, C.silver, .55 * gh, 1.5); c.restore(); }
  if (o.a <= .01) return;
  glow(c, o.x, o.y, o.r * 7, o.col, .22 * Math.min(1, o.a));
  glow(c, o.x, o.y, o.r * 2.6, o.col, .55 * Math.min(1, o.a));
  PX.useM(c); const hot = mixC(o.col, C.white, .6);
  for (let i = 0; i < 70; i++) {   // 光团里的光点：慢慢绕着转
    const an = rnd(i, 401) * 6.283 + t * (.6 + rnd(i, 402)), rr = o.r * Math.sqrt(rnd(i, 403)) * (.8 + .2 * Math.sin(t * 3 + i));
    PX.pt(o.x + Math.cos(an) * rr, o.y + Math.sin(an) * rr * .9, i % 4 ? o.col : hot, .9 * Math.min(1.4, o.a), .5);
  }
  PX.sdisc(PX.X(o.x, o.y), PX.Y(o.x, o.y), o.r * .55 * PX.sc, hot, .5 * Math.min(1.4, o.a), .6);
  PX.flush(c);
}

// ---------- 影子：人的胶囊骨架，以光为中心放大 k 倍，再整体平移 off ----------
// k：影子放大倍数（超级反应）；an：影子边缘的红（愤怒）
const SHK = [[0, 1.25], [2.1, 1.25], [2.6, 2.6], [3.9, 2.9], [4.3, 1.3], [5.0, 1.15], [19.3, 1.25], [19.55, 3.3], [21.0, 1.35],
  [32.6, 1.3], [34.2, 2.5], [35.6, 2.3], [36.6, 1.4], [40.0, 1.5], [45.8, 1.9], [48.6, 2.3], [52.4, 2.3], [57.8, 2.6],
  [58.6, 1.4], [61.7, 1.7], [62.8, 2.0], [63.8, 2.3], [65.0, 2.9], [67.0, 2.7], [68.4, 1.35], [71.0, 1.4], [74.0, 1.9], [77.6, 2.3], [81.0, 3.1], [87.2, 3.2],
  [88.0, 1.5], [91.2, 1.5], [93.2, 2.6], [94.6, 2.4], [96.2, 1.35], [101.3, 1.4], [102.3, 1.04], [103.7, 1.04], [104.5, 1.45], [108.0, 1.4], [110.8, 1.0], [120, 1.0]];
const SHA = [[0, 0], [29.6, 0], [30.0, .8], [31.6, .5], [32.4, 0], [33.4, 0], [34.2, .7], [36.0, .3], [36.6, 0], [46.0, 0], [48.6, .6], [52.0, .4], [57.8, .55], [58.6, 0],
  [62.0, .2], [65.0, 1], [67.0, .6], [68.4, 0], [77.8, .2], [81.0, .7], [87.2, .55], [88.0, 0], [91.6, 0], [93.2, .8], [94.6, .6], [96.2, 0]];
function shadowXform(t, o) {
  // 光在手里：以光为中心放大；结尾光飘走以后，影子贴在人身后，和人一样大（由房间的暖光投下来）
  const end = eio(pr(t, 108.4, 111.0));
  const cx = lerp(o.x, YOU.x + 40, end), cy = lerp(o.y, FY - YOU.h * .5, end), k = kv(SHK, t), ox = lerp(0, 46, end), oy = lerp(0, -10, end);
  return p => [cx + (p[0] - cx) * k + ox, cy + (p[1] - cy) * k + oy];
}
function figSilhouette(c, F, X, extra) {   // 把人的胶囊按 X 变换后填进 c
  const G = figGeom(F); c.beginPath();
  for (const q of G.L) { const a = X(G.tr(q[0])), e = X(G.tr(q[1])), s = Math.hypot(X([1, 0])[0] - X([0, 0])[0], X([1, 0])[1] - X([0, 0])[1]); tcap(c, a[0], a[1], e[0], e[1], q[2] * F.h * s, q[3] * F.h * s); }
  if (extra) extra(c, G, X);
  c.fill();
}

// ---------- 芒格家的狗（墙上的影子）：几何拼出来，吃饭 ↔ 龇牙两种姿势插值 ----------
// 单位：肩高 = 1，脚 = 0，朝右；q 姿势 {hd 头的角度（度，0 = 水平朝前，正 = 往下）, jaw 张嘴, ear 耳朵后贴, cr 伏低, tl 尾巴角度}
function dogShape(c, x, y, s, q) {
  const P = (u, v) => [x + u * s, y + v * s], cap = (a, b, r0, r1) => { const A = P(...a), B = P(...b); tcap(c, A[0], A[1], B[0], B[1], r0 * s, r1 * s); };
  const cr = q.cr, by = -.62 + cr * .1;
  c.beginPath();
  c.ellipse(...P(0, by), .5 * s, .2 * s, 0, 0, Math.PI * 2);                      // 身子
  c.moveTo(...P(.56, by)); c.arc(...P(.36, by + .01), .21 * s, 0, Math.PI * 2);   // 胸
  c.moveTo(...P(-.2, by)); c.arc(...P(-.36, by), .18 * s, 0, Math.PI * 2);        // 胯
  cap([.36, by + .05], [.4 - cr * .06, 0], .07, .05); cap([.24, by + .05], [.2, 0], .06, .045);                     // 前腿
  cap([-.36, by + .05], [-.46, -.26 + cr * .06], .085, .055); cap([-.46, -.26 + cr * .06], [-.38, 0], .05, .045);     // 后腿
  cap([-.26, by + .05], [-.32, -.28 + cr * .06], .07, .05); cap([-.32, -.28 + cr * .06], [-.26, 0], .045, .04);
  cap([.38, 0], [.47, 0], .04, .035); cap([-.38, 0], [-.3, 0], .04, .035);        // 爪子
  const ta = q.tl * DEG; cap([-.5, by - .06], [-.5 - Math.cos(ta) * .36, by - .06 - Math.sin(ta) * .36], .05, .025);   // 尾巴
  // 脖子和头
  const nb = [.46, by - .12], ha = q.hd * DEG, hc = [nb[0] + Math.cos(ha) * .3, nb[1] + Math.sin(ha) * .3];
  cap(nb, hc, .14, .12);
  c.moveTo(...P(hc[0] + .15, hc[1])); c.arc(...P(...hc), .15 * s, 0, Math.PI * 2);
  const fa = ha - 8 * DEG, sn = [hc[0] + Math.cos(fa) * .27, hc[1] + Math.sin(fa) * .27];                          // 上颚
  cap(hc, sn, .09, .055);
  const ja = fa + q.jaw * DEG, jw = [hc[0] + .03 + Math.cos(ja) * .24, hc[1] + .06 + Math.sin(ja) * .24];          // 下颚
  cap([hc[0] + .03, hc[1] + .06], jw, .055, .035);
  const ea = ha - (100 - q.ear * 70) * DEG, eb = [hc[0] - Math.cos(ha) * .06, hc[1] - .1], et = [eb[0] + Math.cos(ea) * .2, eb[1] + Math.sin(ea) * .2];   // 耳朵：竖着 → 往后贴
  c.moveTo(...P(eb[0] - .06, eb[1] + .02)); c.lineTo(...P(...et)); c.lineTo(...P(eb[0] + .07, eb[1] + .03)); c.closePath();
  c.fill();
}
const DOG = { x: V ? 980 : 1150, s: 220 };
const DOG_EAT = { hd: 62, jaw: 4, ear: 0, cr: 0, tl: 40 }, DOG_SNAP = { hd: -6, jaw: 34, ear: 1, cr: .5, tl: -10 };
function dogQ(t) { const u = eio(pr(t, 29.75, 29.95)); const o = {}; for (const k in DOG_EAT) o[k] = lerp(DOG_EAT[k], DOG_SNAP[k], u); o.tl += (1 - u) * 18 * Math.sin(t * 9); return o; }
function bowl(c, x, y, s) { c.beginPath(); c.moveTo(x - .2 * s, y - .13 * s); c.lineTo(x + .2 * s, y - .13 * s); c.lineTo(x + .15 * s, y); c.lineTo(x - .15 * s, y); c.closePath(); c.fill(); }
// 伸过来的手（剪影）：从 (x0, y0) 伸到 (x1, y1)
function handShape(c, x0, y0, x1, y1, s, open = 1) {
  const an = Math.atan2(y1 - y0, x1 - x0), ux = Math.cos(an), uy = Math.sin(an), nx = -uy, ny = ux;
  c.beginPath(); tcap(c, x0, y0, x1 - ux * 40 * s, y1 - uy * 40 * s, 30 * s, 24 * s);
  c.moveTo(x1, y1); c.arc(x1 - ux * 20 * s, y1 - uy * 20 * s, 30 * s, 0, Math.PI * 2);
  for (let i = 0; i < 4; i++) { const o = (i - 1.5) * 15 * s, sp = (i - 1.5) * .12 * open, fx = Math.cos(an + sp), fy = Math.sin(an + sp), b0 = [x1 + nx * o, y1 + ny * o], L = (44 - Math.abs(i - 1.5) * 6) * s;
    tcap(c, b0[0], b0[1], b0[0] + fx * L, b0[1] + fy * L, 8 * s, 6.5 * s); }
  const th = [x1 - ux * 34 * s - nx * 28 * s, y1 - uy * 34 * s - ny * 28 * s]; tcap(c, th[0], th[1], th[0] + (ux - nx * .6) * 34 * s, th[1] + (uy - ny * .6) * 34 * s, 9 * s, 7 * s);
  c.fill();
}
// 拍卖会上的别人（剪影）：头、肩膀，一只手举着牌子；u = 举起来多少
function bidderShape(c, x, s, u, lean = 0) {
  const sy = FY - 150 * s, hx = x + lean * 20 * s;
  c.beginPath(); c.ellipse(x, sy + 70 * s, 92 * s, 80 * s, 0, Math.PI, 0); c.rect(x - 92 * s, sy + 70 * s, 184 * s, 200 * s);   // 肩膀
  c.moveTo(hx + 50 * s, sy - 30 * s); c.arc(hx, sy - 30 * s, 50 * s, 0, Math.PI * 2);                                          // 头
  const ax = x + 70 * s, ay = sy + 40 * s, ex = ax + 40 * s, ey = lerp(ay + 60 * s, ay - 150 * s, u), px = ex + 10 * s, py = lerp(ay + 40 * s, ay - 300 * s, u);
  tcap(c, ax, ay, ex, ey, 22 * s, 18 * s); tcap(c, ex, ey, px, py, 18 * s, 14 * s);                                            // 胳膊
  if (u > .05) { tcap(c, px, py, px, py - 60 * s * u, 6 * s, 6 * s); c.moveTo(px + 40 * s, py - 90 * s * u); c.arc(px, py - 90 * s * u, 40 * s * u, 0, Math.PI * 2); }   // 牌子
  c.fill();
}

// ---------- 墙上的光：一团（或几团）暖光照在墙上，剪影从里面挖掉；愤怒时剪影边上有一圈红 ----------
function wallLight(t, o, F) {
  camT(wlx); wlx.globalCompositeOperation = 'source-over'; wlx.save(); wlx.setTransform(1, 0, 0, 1, 0, 0); wlx.clearRect(0, 0, W, H); wlx.restore();
  const hb = heart(t) * kv([[0, 0], [45.8, 0], [48.6, .5], [57.8, 1], [58.6, 0], [77.8, 0], [81.0, 1], [87.2, 1], [88.0, 0], [91.6, 0], [93.2, .6], [94.6, 0]], t);
  // 主光：手里那团光照亮的墙
  const I = clamp(o.a, 0, 1.6) * kv([[0, 0], [1.0, 0], [1.6, 1], [24.0, 1], [24.8, .35], [31.8, .35], [32.6, 1], [81.0, 1], [82.0, .75], [87.2, .75], [88.0, 1], [120, 1]], t) * (1 - .22 * hb);
  const lc = mixC(C.lamp, o.col, .5), R = kv([[0, 820], [24, 820], [32, 820], [58.4, 900], [61.6, 1250], [67.4, 1250], [68.4, 900], [81, 1200], [88, 950], [120, 950]], t);
  const g = wlx.createRadialGradient(o.x, o.y - 120, 0, o.x, o.y - 120, R);
  g.addColorStop(0, rgba(lc, .4 * I)); g.addColorStop(.35, rgba(lc, .2 * I)); g.addColorStop(1, rgba(lc, 0)); wlx.fillStyle = g; wlx.fillRect(o.x - R, o.y - 120 - R, R * 2, R * 2);
  // 结尾：光飘走以后，房间亮起一片暖光，你身后落下一个和你一样大的影子
  const amb = eio(pr(t, 108.8, 111.2));
  if (amb > 0) { const cx = YOU.x + 60, cy = FY - 300, r = 900, g3 = wlx.createRadialGradient(cx, cy, 0, cx, cy, r); g3.addColorStop(0, rgba(C.lamp, .36 * amb)); g3.addColorStop(.5, rgba(C.lamp, .16 * amb)); g3.addColorStop(1, rgba(C.lamp, 0)); wlx.fillStyle = g3; wlx.fillRect(cx - r, cy - r, r * 2, r * 2); }
  // 狗那一段：墙上另有一圈光（像放映的光斑）
  const dl = win(t, 23.6, 32.6, .8, .9);
  if (dl > 0) { const cx = DOG.x + 40, cy = FY - 230, r = 560, g2 = wlx.createRadialGradient(cx, cy, 0, cx, cy, r); g2.addColorStop(0, rgba(C.lamp, .32 * dl)); g2.addColorStop(.55, rgba(C.lamp, .14 * dl)); g2.addColorStop(1, rgba(C.lamp, 0)); wlx.fillStyle = g2; wlx.fillRect(cx - r, cy - r, r * 2, r * 2); }
  // 剪影
  slx.save(); slx.setTransform(1, 0, 0, 1, 0, 0); slx.clearRect(0, 0, W, H); slx.restore(); camT(slx); slx.fillStyle = '#fff';
  const X = shadowXform(t, o);
  if (F.a > .3) figSilhouette(slx, { ...F, a: 1 }, X, (c, G, Xf) => { const pd = paddleOn(t); if (pd > 0) { const h = G.at('haN'), A = Xf(h), B = Xf([h[0] + 6, h[1] - 70 * pd]), s = Math.hypot(Xf([1, 0])[0] - Xf([0, 0])[0], 0); tcap(c, A[0], A[1], B[0], B[1], 6 * s, 6 * s); c.moveTo(B[0] + 34 * s, B[1]); c.arc(B[0], B[1] - 20 * s, 34 * s * pd, 0, Math.PI * 2); } });
  if (dl > 0) {
    const q = dogQ(t), sc = DOG.s * (1 + .3 * eo(pr(t, 29.75, 30.2))) * (1 - .12 * eio(pr(t, 31.0, 32.0)));
    dogShape(slx, DOG.x, FY, sc, q); bowl(slx, DOG.x + (.86 - .3 * eio(pr(t, 29.75, 30.1))) * DOG.s, FY, DOG.s);
    const hu = eio(pr(t, 27.0, 29.5)) * (1 - eio(pr(t, 29.85, 30.5)));     // 那只手伸过来，被咬，缩回去
    if (hu > .01) handShape(slx, DOG.x + 1100, FY - 420, lerp(DOG.x + 760, DOG.x + 300, hu), lerp(FY - 330, FY - 80, hu), 1.15);
  }
  const hu2 = eio(pr(t, 32.5, 33.5)) * (1 - eio(pr(t, 33.9, 35.0)));      // 同一只手，伸过来拿你的光
  if (hu2 > .01) handShape(slx, YOU.x + 1150, FY - 640, lerp(YOU.x + 700, X([o.x + 40, 0])[0] + 30, hu2), lerp(FY - 560, X([0, o.y])[1] - 10, hu2), 1.2 * kv(SHK, t) * .6);
  // 拍卖会：左右两边别人的牌子
  const crowd = win(t, 58.0, 68.4, .8, 1.0);
  if (crowd > .01) [[61.6, YOU.x - 420, .95, -1], [62.6, YOU.x + 1020, 1.05, 1], [63.6, YOU.x - 640, 1.15, -1], [64.4, YOU.x + 780, 1.3, 1], [99, YOU.x + 560, .9, 0], [99, YOU.x - 230, .85, 0]].forEach(([t0, x, s, ln]) => {
    const u = eo(pr(t, t0, t0 + .3)) * (1 - eio(pr(t, 67.0, 67.8))); bidderShape(slx, x, s * lerp(.6, 1, crowd), u, ln);
  });
  // 合成：先画红边（剪影的模糊外扩），再把剪影从墙光里挖掉
  const an = kv(SHA, t) * (1 - .3 * hb);
  if (an > .01) { wlx.save(); wlx.setTransform(1, 0, 0, 1, 0, 0); wlx.globalCompositeOperation = 'lighter'; wlx.filter = 'blur(22px)'; wlx.globalAlpha = an;
    wlx.drawImage(tint(SL, C.red), 0, 0); wlx.filter = 'blur(6px)'; wlx.globalAlpha = an * .6; wlx.drawImage(tint(SL, [255, 120, 90]), 0, 0); wlx.restore(); }
  const bl = 3 + 3 * kv(SHK, t);
  wlx.save(); wlx.setTransform(1, 0, 0, 1, 0, 0); wlx.globalCompositeOperation = 'destination-out'; wlx.filter = `blur(${bl}px)`; wlx.globalAlpha = .93; wlx.drawImage(SL, 0, 0); wlx.restore();
  // 地面以下不是墙
  wlx.save(); camT(wlx); wlx.globalCompositeOperation = 'destination-out'; const fg = wlx.createLinearGradient(0, FY - 4, 0, FY + 30); fg.addColorStop(0, 'rgba(0,0,0,0)'); fg.addColorStop(1, 'rgba(0,0,0,1)'); wlx.fillStyle = fg; wlx.fillRect(-2000, FY - 4, 6000, 4000); wlx.restore();
  sx.save(); sx.setTransform(1, 0, 0, 1, 0, 0); sx.globalCompositeOperation = 'lighter'; sx.drawImage(WL, 0, 0); sx.restore();
}
const TINT = mk(W, H), tix = TINT.getContext('2d');
function tint(src, col) { tix.globalCompositeOperation = 'copy'; tix.drawImage(src, 0, 0); tix.globalCompositeOperation = 'source-in'; tix.fillStyle = rgba(col); tix.fillRect(0, 0, W, H); tix.globalCompositeOperation = 'source-over'; return TINT; }
function paddleOn(t) { return win(t, 61.5, 67.4, .2, .6); }
function drawPaddle(c, G, t) {
  const pd = paddleOn(t); if (pd <= .01) return; const h = G.at('haN'), top = [h[0] + 6, h[1] - 70 * pd];
  c.save(); c.shadowColor = rgba(C.silver, .8); c.shadowBlur = 8; seg(c, h[0], h[1], top[0], top[1], C.silver, .9 * pd, 3); ring(c, top[0], top[1] - 20, 30 * pd, mixC(C.silver, C.white, .4), .95 * pd, 2.5); c.restore();
}

// ---------- 墙上的字和图（像投在墙上的光） ----------
const TXT = [];   // 墙上的字：先记下来，泛光和调色之后再画（字不发光）
function wallText(s, x, y, o) { TXT.push(() => drawChars(ctx, parse(s), x, y, { font: FS.serif, weight: 900, per: 0, fade: .01, rise: 0, t0: 0, ...o })); }
function wallLabel(...args) { TXT.push(() => label(ctx, ...args)); }
function flushWallText() { camT(ctx); for (const f of TXT) f(); TXT.length = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); }
function label(c, en, zh, x, y, a, col = C.gold, size = 20) {   // “英文小字 · 中文” 副标（英文 ≥ 20px，中文 ≥ 24px）
  if (a <= 0) return; size = Math.max(20, size); const zs = Math.max(24, size * 1.15); c.font = `500 ${size}px ${FS.mono}`; const s1 = en + '  ·  '; let w1 = 0; for (const ch of s1) w1 += c.measureText(ch).width + size * .18; c.font = `500 ${zs}px ${FS.sans}`; const w2 = c.measureText(zh).width;
  let cx = x - (w1 + w2) / 2; c.textBaseline = 'middle'; c.fillStyle = rgba(col, .85 * a); c.font = `500 ${size}px ${FS.mono}`;
  for (const ch of s1) { c.fillText(ch, cx, y); cx += c.measureText(ch).width + size * .18; } c.font = `500 ${zs}px ${FS.sans}`; c.fillText(zh, cx, y);
}
const WG = V ? { x: 960, y: 60 } : { x: 1330, y: 280 };     // 墙上主信息的位置
function wallGraphics(t) {
  const c = sx; camT(c);
  // 开头：−100 / +100
  const m1 = win(t, 1.8, 4.1, .3, .4), p1 = win(t, 4.8, 7.2, .2, .6);
  if (m1 > 0) wallText('−100', WG.x, WG.y + (V ? 200 : 40), { size: 120, a: m1 * .9, grad: GRAD_I });
  if (p1 > 0) wallText('+100', WG.x, WG.y + (V ? 200 : 40) - 30 * pr(t, 4.8, 7.2), { size: 120, a: p1 * (1 - .5 * pr(t, 5.6, 7.2)), grad: GRAD_G });
  // 同样一百块：左 +100 小，右 −100 越涨越大
  const both = win(t, 7.6, 11.4, .4, .5);
  if (both > 0) {
    const gx = V ? 960 : WG.x, dx = V ? 230 : 260, sw = lerp(1, 2, eio(pr(t, 10.2, 11.0)));
    const ny = WG.y + (V ? 230 : 60);
    wallText('+100', gx - dx, ny, { size: 96, a: both * .85, grad: GRAD_G });
    wallText('−100', gx + dx, ny, { size: 96 * sw, a: both, grad: () => [[255, 190, 170], [255, 110, 90], [190, 50, 40]] });
  }
  // 砍一刀：进度条
  const kb = win(t, 37.0, 51.6, .6, .8);
  if (kb > 0) {
    const bx = WG.x, by = WG.y + 20, bw = V ? 660 : 820, x0 = bx - bw / 2;
    const fill = t < 39.6 ? .86 : t < 41.4 ? lerp(.86, .999, eo(pr(t, 39.6, 41.4))) : .999;
    const lose = eio(pr(t, 45.9, 46.6));
    rrect(c, x0, by - 13, bw, 26, 13); c.fillStyle = rgba(C.body, .8 * kb); c.fill(); c.strokeStyle = rgba(C.gold, .55 * kb); c.lineWidth = 2; c.stroke();
    const gcol = mixC(C.gold, C.red, lose), gw = bw * fill;
    const gg = c.createLinearGradient(x0, 0, x0 + gw, 0); gg.addColorStop(0, rgba(mixC(gcol, C.body, .3), .9 * kb)); gg.addColorStop(1, rgba(mixC(gcol, C.white, .3), kb * (1 - .5 * lose)));
    rrect(c, x0 + 3, by - 10, Math.max(20, gw - 6), 20, 10); c.fillStyle = gg; c.fill();
    if (t > 41.4) { const gp = .5 + .5 * Math.sin(t * 9); ring(c, x0 + bw - 8, by, 16 + 6 * gp, mixC(C.ice, C.red, lose), kb * (.5 + .5 * gp), 2); }   // 最后那一小格，一直在闪
    let pct = t < 39.6 ? '86.0' : t < 41.4 ? (86 + 13.9 * eo(pr(t, 39.6, 41.4))).toFixed(1) : '99.9';
    const hits = [43.0, 43.4, 43.75, 44.05, 44.3, 44.55, 44.75, 44.95, 45.1, 45.25];
    let nh = 0; for (const h of hits) if (t > h + .25) nh++;
    if (t > 42.8 && t < 46.0) pct = ['99.90', '99.95', '99.97', '99.98', '99.985', '99.99', '99.992', '99.994', '99.995', '99.996', '99.997'][nh];
    wallText(pct + '%', bx, by - 92, { size: 92, a: kb, grad: lose > 0 ? () => [[255, 200, 180], [255, 110, 90], [180, 50, 40]] : GRAD_G });
    wallLabel('ALMOST', '只差一点', bx, by + 56, kb * (1 - lose), C.gold, 22);
    // 二十个人：二十颗光从两边飞进来，打在进度条的末端
    PX.useM(c);
    for (let i = 0; i < 20; i++) {
      const t0 = 42.8 + i * .13, u = pr(t, t0, t0 + .5); if (u <= 0 || u >= 1) continue;
      const side = i % 2 ? 1 : -1, sx0 = bx + side * (V ? 620 : 900), sy0 = by + 260 - 380 * rnd(i, 501), ex = x0 + bw - 10, ey = by;
      const P = v => [lerp(sx0, ex, eio(v)), lerp(sy0, ey, eio(v)) - 120 * Math.sin(Math.PI * v)], a = P(u), b = P(Math.max(0, u - .08));
      PX.line(b[0], b[1], a[0], a[1], C.gold, 0, 1.4); PX.sdisc(PX.X(...a), PX.Y(...a), 3.2, mixC(C.gold, C.white, .5), 1.1, .8);
    }
    PX.flush(c);
    for (let i = 0; i < 20; i++) ringPulse(c, t, 43.3 + i * .13, x0 + bw - 8, by, 6, 60, C.gold, .4, .5);
  }
  // 拍卖：价格
  const au = win(t, 58.6, 68.0, .5, .8);
  if (au > 0) {
    const steps = [[58.6, 100], [61.9, 150], [62.9, 220], [63.9, 300], [65.0, 400]]; let v = 100, tk = 58.6; for (const [t0, p] of steps) if (t >= t0) { v = p; tk = t0; }
    const pop = 1 + .25 * Math.exp(-(t - tk) * 6) * (tk > 59 ? 1 : 0), hot = clamp((v - 100) / 300), sz = (V ? 120 : 130) * pop * (1 + .35 * hot);
    wallText('¥' + v, WG.x, WG.y + (V ? -90 : 10), { size: sz, a: au, grad: () => [mixC([255, 238, 196], [255, 200, 180], hot), mixC([247, 204, 118], [255, 100, 80], hot), mixC([196, 132, 52], [180, 40, 30], hot)] });
    wallLabel('OPEN-OUTCRY AUCTION', '公开叫价', WG.x, WG.y + (V ? 10 : 110), au * .9, mixC(C.gold, C.red, hot), 19);
  }
  // 股票：一路往下的线
  const st = win(t, 71.0, 74.6, .4, .6);
  if (st > 0) {
    const w = V ? 680 : 760, x0 = WG.x - w / 2, y0 = WG.y - 60, u = eo(pr(t, 71.2, 73.6)), N = 60, pts = [];
    for (let i = 0; i <= N * u; i++) { const f = i / N; pts.push([x0 + w * f, y0 + 220 * (f * .9 + .1 * Math.sin(f * 17) * f) + 18 * Math.sin(f * 40) * f]); }
    if (pts.length > 1) { polyPath(c, pts); c.strokeStyle = rgba(C.red, .85 * st); c.lineWidth = 3; c.lineJoin = 'round'; c.stroke(); const e = pts[pts.length - 1]; dot(c, e[0], e[1], 6, mixC(C.red, C.white, .4), st); }
    const pct = Math.round(-50 * u); wallText((pct === 0 ? '−0' : '−' + Math.abs(pct)) + '%', WG.x + (V ? 0 : 120), y0 - 70, { size: 100, a: st, grad: () => [[255, 200, 180], [255, 110, 90], [180, 50, 40]] });
  }
  // 一千万 和 一百块
  const tm = win(t, 87.8, 98.2, .6, .6);
  if (tm > 0) {
    const sh = eio(pr(t, 91.6, 93.4)) * (1 - eio(pr(t, 94.8, 96.0)));   // 近处的一百块，把一千万压下去
    const bx = WG.x - (V ? 0 : 60), by = WG.y + 10;
    wallText('10,000,000', bx, by, { size: (V ? 104 : 120) * lerp(1, .42, sh), a: tm * lerp(1, .35, sh), grad: GRAD_G });
    wallLabel('BROKERAGE ACCOUNT', '账户', bx, by + 82 * lerp(1, .5, sh), tm * (1 - sh), C.gold, 19);
    const ma = tm * eo(pr(t, 91.2, 91.6));
    if (ma > 0) wallText('−100', bx + (V ? 170 : 330) * (1 - sh * .9), by + lerp(110, 30, sh), { size: lerp(44, V ? 230 : 280, sh), a: ma, grad: () => [[255, 200, 180], [255, 110, 90], [180, 50, 40]] });
  }
}

// ---------- 两个人：一段早该结束的感情 ----------
function partner(t) {
  const a = win(t, 74.3, 78.2, .5, 1.0); if (a <= 0) return;
  const turn = eio(pr(t, 75.2, 75.5)), walk = eio(pr(t, 75.8, 78.2)), x = YOU.x + 330 + 520 * walk, ph = (x - YOU.x - 330) / 60 * Math.PI, ww = eio(pr(t, 75.8, 76.0)) * (1 - eio(pr(t, 78.0, 78.2)));
  let P = { ...PO.stand, hd: 14 }; if (ww > 0) P = lerpPose(P, walkPose(ph, 0), ww);
  drawFig({ kind: 'adult', P, x, y: FY, h: YOU.h * .96, dir: turn > .5 ? 1 : -1, rim: mixC(C.silver, C.gray, .3), a: a * (1 - .4 * walk), refl: FY });
}

// ---------- 毛笔字关键词卡（描边发光 + 红印章），屏幕坐标 ----------
function callig(s, x, y, o) {
  const { size, t, t0, a = 1, col = C.ice, vert = false, seal } = o; if (t < t0 || a <= 0) return;
  const c = ctx, chars = [...s], step = size * 1.02; c.save(); c.font = `400 ${size}px 'Ma Shan Zheng', ${FS.serif}`; c.textBaseline = 'middle'; c.textAlign = 'center';
  const n = chars.length, W0 = vert ? size : step * n, H0 = vert ? step * n : size;
  chars.forEach((ch, i) => {
    const cx = vert ? x : x - W0 / 2 + step * (i + .5), cy = vert ? y - H0 / 2 + step * (i + .5) : y, u = pr(t, t0 + i * .16, t0 + i * .16 + .42); if (u <= 0) return;
    c.save(); c.beginPath(); c.rect(cx - size, cy - size * .62, size * 2, size * 1.24 * eo(u)); c.clip();   // 一笔一笔往下“写”出来
    c.shadowColor = 'rgba(0,0,0,.85)'; c.shadowBlur = size * .12; c.shadowOffsetY = 2; c.fillStyle = rgba(mixC(col, C.body, .55), .55 * a); c.fillText(ch, cx, cy);
    c.shadowBlur = 0; c.shadowOffsetY = 0; c.lineWidth = Math.max(1.8, size * .024); c.strokeStyle = rgba(mixC(col, C.white, .25), a); c.strokeText(ch, cx, cy);
    c.restore();
  });
  if (seal) {   // 印章：最后一个字写完以后盖上去
    const st = t0 + n * .16 + .35, u = pr(t, st, st + .18); if (u > 0) {
      const ss = size * .46, sxp = vert ? x + size * .62 : x + W0 / 2 + ss * .7, syp = vert ? y + H0 / 2 - ss * .4 : y + size * .28, k = lerp(1.6, 1, eo(u));
      c.save(); c.translate(sxp, syp); c.scale(k, k); c.globalAlpha = a * eo(u);
      rrect(c, -ss / 2, -ss / 2, ss, ss, ss * .12); c.fillStyle = 'rgb(196,38,34)'; c.fill();
      c.fillStyle = 'rgb(255,236,226)'; c.font = `900 ${ss * .4}px ${FS.serif}`; const sc = [...seal]; if (sc.length === 2) { c.fillText(sc[0], 0, -ss * .2); c.fillText(sc[1], 0, ss * .22); } else c.fillText(seal, 0, 0);
      c.restore();
    }
  }
  c.restore();
}
