'use strict';
// 《INFP》v2 第 4 组：C201-C207（读情绪百发百中 / 内向但分享欲爆棚 / 软但有底线 / 丑小鸭其实是天鹅）
//   1 人群纵深广场：她在近景，一道金光穿过层层人群正中藏着心事的那颗心；随后那颗心发出求救波纹，穿过灰掉的人群，第一个到她
//   2 一整天：对陌生人只漏出一点光；转向好友，一条由星星音符云朵组成的光河连成拱桥，头顶太阳划过天空变成月亮
//   3 低机位：别人的要求像彩带一样从右边涌来，她跟着摇摆点头；地上亮起一条线（底线），升起光墙，彩带撞碎
//   4 夜湖：远岸一排一模一样的灰色人影，她独自站在湖心石上，倒影是一只灰扑扑的小鸭；一滴泪落水，倒影碎开重组成发光的天鹅
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { K, L, LIME, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, glow, glowLine, hash, mix } = K;

const col = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${clamp(a)})`;
function sky(ctx, a, stops, y0 = 0, y1 = H) {
  const g = ctx.createLinearGradient(0, y0, 0, y1);
  for (const [p, c] of stops) g.addColorStop(p, col(c, a));
  ctx.fillStyle = g; ctx.fillRect(0, Math.min(0, y0), W, Math.max(H, y1) - Math.min(0, y0));
}
function band(ctx, y, h, c, a) {
  if (a <= 0.003) return;
  const g = ctx.createLinearGradient(0, y - h, 0, y + h);
  g.addColorStop(0, col(c, 0)); g.addColorStop(0.5, col(c, a)); g.addColorStop(1, col(c, 0));
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = g; ctx.fillRect(0, y - h, W, 2 * h); ctx.restore();
}
// 体积光锥
function beam(ctx, x, y, ang, half, len, c, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  const g = ctx.createRadialGradient(x, y, 0, x, y, len);
  g.addColorStop(0, col(c, a)); g.addColorStop(0.45, col(c, a * 0.35)); g.addColorStop(1, col(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(ang - half) * len, y + Math.sin(ang - half) * len);
  ctx.lineTo(x + Math.cos(ang + half) * len, y + Math.sin(ang + half) * len);
  ctx.closePath(); ctx.fill(); ctx.restore();
}
function pool(ctx, x, y, r, c, a) { ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.18); glow(ctx, 0, 0, r, c, a); ctx.restore(); }
const STAR = Array.from({ length: 110 }, (_, i) => ({ x: hash(i * 3.1 + 1) * W, y: hash(i * 7.7 + 2), r: 0.8 + hash(i * 1.3 + 3) * 2.2, ph: hash(i * 5.5) * 6.28 }));
function stars(ctx, t, a, y0, y1, c = [220, 236, 230]) {
  if (a <= 0.003) return;
  for (const s of STAR) glow(ctx, s.x, lerp(y0, y1, s.y), s.r * 3, c, a * (0.3 + 0.25 * Math.sin(t * 1.3 + s.ph)));
}
function poly(ctx, pts, c, a) {
  ctx.fillStyle = col(c, a); ctx.beginPath();
  pts.forEach(([u, v], i) => i ? ctx.lineTo(u, v) : ctx.moveTo(u, v)); ctx.closePath(); ctx.fill();
}
const bz = (u, A, B, C) => [(1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * B[0] + u * u * C[0], (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * B[1] + u * u * C[1]];
// 近景草叶剪影（虚焦，跟着风弯）
function grassFront(ctx, t, a, bend, rim, seed) {
  ctx.save(); ctx.filter = 'blur(4px)';
  for (let i = 0; i < 22; i++) {
    const r = hash(seed + i * 1.7), x = i < 11 ? r * 300 - 40 : W - 300 + r * 340, h = 140 + hash(seed + i * 3.3) * 220, y = 1350 + hash(seed + i) * 40;
    const sw = (bend + Math.sin(t * 1.6 + i) * 0.12) * h;
    ctx.fillStyle = col([6, 14, 12], 0.92 * a);
    ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.quadraticCurveTo(x + sw * 0.3, y - h * 0.6, x + sw, y - h); ctx.quadraticCurveTo(x + sw * 0.3 + 6, y - h * 0.55, x + 11, y); ctx.closePath(); ctx.fill();
    if (rim > 0.01) glowLine(ctx, [[x + 9, y - 10], [x + sw * 0.3 + 4, y - h * 0.6], [x + sw, y - h]], LIME, a * rim * 0.35, 1.4, 0.6);
  }
  ctx.restore();
}
// 光河里的小物件：星星、音符、心、云
function glyph(ctx, kind, x, y, s, c, a, rot) {
  if (a <= 0.003) return;
  const P = [];
  if (kind === 0) { for (let k = 0; k < 10; k++) { const r = k % 2 ? 0.42 : 1, an = -Math.PI / 2 + k * Math.PI / 5 + rot; P.push([x + Math.cos(an) * r * s, y + Math.sin(an) * r * s]); } glowLine(ctx, P, c, a, 2, 0.7, true); }
  else if (kind === 1) { glow(ctx, x - s * 0.35, y + s * 0.55, s * 0.55, c, a); glowLine(ctx, [[x, y + s * 0.55], [x, y - s], [x + s * 0.6, y - s * 0.55]], c, a, 2.2, 0.7); }
  else if (kind === 2) { for (let k = 0; k <= 28; k++) { const u = k / 28 * Math.PI * 2; P.push([x + s * 0.06 * 16 * Math.pow(Math.sin(u), 3), y - s * 0.06 * (13 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u))]); } glowLine(ctx, P, c, a, 2, 0.7, true); }
  else { for (let k = 0; k <= 30; k++) { const u = k / 30, an = Math.PI + u * Math.PI, b = 1 + 0.22 * Math.abs(Math.sin(u * Math.PI * 3)); P.push([x + Math.cos(an) * s * 1.2 * b, y + Math.sin(an) * s * 0.75 * b]); } glowLine(ctx, P, c, a, 2, 0.7, true); }
}
function sparks(ctx, x, y, t, t0, n, c, a, sp = 320, seed = 0) {
  const d = t - t0; if (d < 0 || d > 0.9) return;
  for (let i = 0; i < n; i++) { const an = i / n * 6.283 + hash(seed + i) * 0.6, v = sp * (0.5 + hash(seed + i * 2.3)); glow(ctx, x + Math.cos(an) * v * d, y + Math.sin(an) * v * d + 260 * d * d, 7, c, a * (1 - d / 0.9)); }
}

// ---------- 镜头 1 的人群 ----------
const KINDS = MB.ALL.filter(k => !/^infp/.test(k));
const HZ1 = 700;
const proj = z => { const q = Math.pow(1 - z, 1.6); return { y: lerp(HZ1 + 20, 1345, q), s: 0.35 + 2.0 * q }; };
const CROWD = (() => {
  const r = K.mulberry32(4201), o = [];
  const rows = [[0.93, 7, 80, 1020], [0.8, 5, 110, 1010], [0.65, 4, 200, 1030], [0.48, 3, 520, 1000], [0.32, 2, 820, 1080], [0.13, 1, 1090, 1090]];
  for (const [z, n, x0, x1] of rows) for (let i = 0; i < n; i++) o.push({ z: z + (r() - 0.5) * 0.04, x: lerp(x0, x1, (i + 0.5) / n) + (r() - 0.5) * 50, k: KINDS[Math.floor(r() * KINDS.length)], flip: r() < 0.5, ph: r() * 6.28 });
  o.forEach((p, i) => p.id = i);
  return o;
})();
const near = (z, x) => CROWD.reduce((b, p) => (Math.abs(p.z - z) < 0.05 && (!b || Math.abs(p.x - x) < Math.abs(b.x - x))) ? p : b, null).id;
const TI = near(0.48, 730);
const SAD = [near(0.65, 330), near(0.32, 960), near(0.8, 640)];
const DRAWN = CROWD.slice().sort((p, q) => q.z - p.z);

// ---------- 镜头 4 的倒影画布 + 小鸭 / 天鹅（多边形，和 16P 角色同一种切面质感） ----------
const REF = new K.Canvas(W, 760), RC = REF.getContext('2d');
const DUCK = [
  [[[-110, -6], [-85, -52], [-10, -66], [70, -44], [96, -8], [40, 18], [-70, 16]], [112, 112, 104]],
  [[[-85, -52], [-10, -66], [-30, -22]], [136, 134, 124]],
  [[[-110, -6], [-30, -22], [40, 18], [-70, 16]], [94, 94, 88]],
  [[[-60, -36], [-6, -52], [40, -30], [-24, -16]], [90, 90, 84]],
  [[[50, -56], [56, -110], [92, -128], [124, -106], [118, -66], [86, -48]], [124, 122, 112]],
  [[[80, -124], [88, -148], [98, -126]], [124, 122, 112]],
  [[[120, -100], [156, -92], [121, -82]], [150, 118, 66]],
];
const SWAN = [
  [[[-175, -8], [-120, -62], [-40, -70], [70, -58], [150, -18], [115, 22], [-50, 26]], [232, 234, 230]],
  [[[-120, -62], [-40, -70], [-70, -20]], [250, 250, 246]],
  [[[70, -58], [150, -18], [60, -10]], [214, 218, 216]],
  [[[105, -50], [140, -130], [128, -215], [146, -232], [166, -212], [160, -130], [150, -30]], [246, 246, 242]],
  [[[140, -130], [160, -130], [150, -40]], [222, 224, 222]],
  [[[128, -215], [140, -248], [170, -256], [192, -240], [184, -222], [150, -214]], [252, 252, 250]],
  [[[188, -238], [228, -226], [186, -222]], [236, 140, 64]],
];
const WFOLD = [[-140, -50], [-70, -96], [40, -92], [85, -56], [-10, -36]];
const WOPEN = [[-110, -60], [-240, -250], [-120, -215], [-20, -310], [75, -60]];
function creature(c, kind, s, a, w = 0) {
  if (a <= 0.003) return;
  c.save(); c.scale(s, s);
  if (kind === 'duck') { for (const [p, cc] of DUCK) poly(c, p, cc, a); c.fillStyle = col([30, 30, 30], a); c.beginPath(); c.arc(100, -100, 4.5, 0, 6.283); c.fill(); }
  else {
    const wp = WFOLD.map((p, i) => [lerp(p[0], WOPEN[i][0], w), lerp(p[1], WOPEN[i][1], w)]);
    if (w > 0.02) poly(c, wp.map(([u, v]) => [u + 40, v - 12]), [200, 204, 204], a * w);
    for (const [p, cc] of SWAN) poly(c, p, cc, a);
    poly(c, [wp[0], wp[1], wp[2]], [228, 230, 228], a); poly(c, [wp[0], wp[2], wp[3]], [250, 250, 248], a); poly(c, [wp[0], wp[3], wp[4]], [238, 240, 236], a);
    c.fillStyle = col([30, 30, 30], a); c.beginPath(); c.arc(166, -238, 4, 0, 6.283); c.fill();
  }
  c.restore();
}

module.exports = function make() {
  const S = [];
  const add = (a, b, draw, over) => S.push({ a, b, draw, over });

  // ================= 镜头 1：C201-C202 人群纵深，金光正中那颗心；求救波纹第一个到她 =================
  add(vs('C201') - 0.2, vs('C203') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const A0 = vs('C201') - 0.2, B0 = vs('C203') + 0.1;
    const ts = at('C201', '神枪手'), tF = ts + 0.05, tB = at('C201', '百发百中'), th = vs('C202');
    sky(ctx, a, [[0, [5, 12, 20]], [0.3, [14, 32, 40]], [0.365, [42, 78, 76]], [0.4, [18, 36, 36]], [1, [4, 9, 10]]]);
    stars(ctx, t, a * 0.7, 40, HZ1 - 120);
    beam(ctx, 260, -120, Math.PI / 2 + 0.22, 0.13, 1500, [150, 210, 200], 0.08 * a);
    beam(ctx, 860, -120, Math.PI / 2 - 0.12, 0.1, 1400, [170, 220, 210], 0.06 * a);
    glow(ctx, 640, HZ1, 760, [70, 120, 110], 0.32 * a);
    const pan = lerp(36, -36, prog(t, A0, B0));
    const zin = smooth(prog(t, th - 0.2, ve('C202') + 0.3)), z0 = smooth(prog(t, A0, th));
    const sc = 1 + 0.04 * z0 + 0.1 * zin;
    ctx.save(); ctx.translate(600, 880); ctx.scale(sc, sc); ctx.translate(-600, -880);
    const gr = smooth(prog(t, th, th + 0.7));
    const rev = id => id === TI ? tF + 0.12 : tB + SAD.indexOf(id) * 0.22 + 0.1;
    const HEART = {};
    let fogged = false;
    for (const p of DRAWN) {
      if (!fogged && p.z < 0.56) { band(ctx, proj(0.56).y - 70, 130, [60, 100, 96], 0.12 * a); fogged = true; }
      const { y, s } = proj(p.z), x = p.x + pan * (1 - p.z) * 1.2, me = p.id === TI;
      pool(ctx, x, y, 110 * s, [150, 210, 180], a * 0.22 * (1 - p.z * 0.6) * (1 - gr * 0.6));
      const o2 = { a, flip: p.flip, bob: Math.abs(Math.sin(t * 2.2 + p.ph)) * 3 * s, dim: clamp(0.12 + 0.6 * p.z + (me ? 0 : gr * 0.25)), gray: me ? 0 : gr * 0.6 };
      let r;
      if (p.z < 0.2) { ctx.save(); ctx.filter = 'blur(5px)'; r = MB.person(ctx, p.k, x, y, s, o2); ctx.restore(); } else r = MB.person(ctx, p.k, x, y, s, o2);
      HEART[p.id] = { c: r.chest, s, y, x };
      const sad = me || SAD.includes(p.id), rv = sad ? smooth(prog(t, rev(p.id), rev(p.id) + 0.4)) : 0;
      const hc = sad ? mix(mix([255, 196, 150], [150, 170, 220], 0.35), [120, 160, 255], rv) : [255, 196, 150];
      const fl = sad && rv < 0.5 ? 0.75 + 0.25 * Math.sin(t * 11 + p.ph) : 1;
      const ha = a * (0.3 * (1 - 0.6 * p.z) + rv * 0.5) * fl * (me ? 1 : 1 - gr * 0.8);
      glow(ctx, r.chest[0], r.chest[1], (34 + rv * 40) * s, hc, ha);
      if (rv > 0.3) for (let k = 0; k < 3; k++) { const v = ((t - rev(p.id)) * 0.6 + k / 3) % 1; glow(ctx, r.chest[0] + (k - 1) * 8 * s, r.chest[1] + v * 60 * s, 4 * s, [150, 190, 255], ha * (1 - v)); }
    }
    const T = HEART[TI].c, hx = 250 + pan * 1.6;
    const spot = smooth(prog(t, tF, tF + 0.5));
    if (spot > 0) { beam(ctx, T[0] + 60, -200, Math.atan2(HEART[TI].y + 200, -60), 0.07, HEART[TI].y + 320, [170, 200, 255], a * 0.16 * spot); pool(ctx, HEART[TI].x, HEART[TI].y, 200, [170, 200, 255], a * 0.5 * spot); }
    // C202 求救波纹：从他心口一圈圈扩开，穿过灰掉的人群
    const dd = Math.hypot(T[0] - hx - 60, T[1] - 640), tr = th + 0.25 + dd / 360, hear = smooth(prog(t, tr, tr + 0.35));
    const listen = smooth(prog(t, th - 0.1, th + 0.3)) * (1 - hear);
    if (t > th) for (let k = 0; k < 6; k++) {
      const r = (t - th - 0.25 - k * 0.42) * 360; if (r <= 0 || r > 1100) continue;
      const ra = a * 0.6 * (1 - r / 1100);
      L.ellipse(ctx, T[0], T[1], r, r, BLUE, ra, 2.4);
      L.ellipse(ctx, T[0], HEART[TI].y, r, r * 0.16, BLUE, ra * 0.5, 1.6);
    }
    glow(ctx, hx + 60, 960, 560, LIME, 0.2 * hear * a);
    const o = infp(ctx, hx, 1330, 1.45, { a, t, spin: t * 0.5, flies: 1, eyes: hear > 0.5 ? 'wide' : listen > 0.5 ? 'closed' : 'open', look: [1.3, -0.4], tilt: listen * 0.6 - hear * 0.2, mouth: hear > 0.5 ? 'o' : 'smile' });
    if (hear > 0) { L.shock(ctx, o.head[0], o.head[1], t, tr, { r0: 40, r1: 320, dur: 0.9, c: LIME, a }); }
    // 聚焦：光圈往他心口收紧（预备）
    const fu = prog(t, ts - 0.9, tF);
    if (fu > 0 && fu < 1) for (let k = 0; k < 3; k++) {
      const r = lerp(300, 34, easeIn(fu)) + k * 40 * (1 - fu);
      L.ellipse(ctx, T[0], T[1], r, r, GOLD, a * 0.45 * smooth(fu) * (1 - k * 0.3), 1.8);
      for (let j = 0; j < 6; j++) { const an = j / 6 * 6.283 + t * 1.5 + k; glow(ctx, T[0] + Math.cos(an) * r, T[1] + Math.sin(an) * r, 7, GOLD, a * 0.6 * fu); }
    }
    // 命中：金光从她眼睛射出（命中-余波）
    const fire = (P, tS, grow, keep, seed) => {
      const g = easeOut(prog(t, tS, tS + grow)); if (g <= 0) return;
      const f = 1 - smooth(prog(t, tS + keep, tS + keep + 0.7)); if (f <= 0) return;
      const E = o.eyes;
      glowLine(ctx, [E, [lerp(E[0], P[0], g), lerp(E[1], P[1], g)]], GOLD, a * f, 2.6, 1.1);
      if (g >= 1) {
        const u = prog(t, tS + grow, tS + grow + 0.5);
        glow(ctx, P[0], P[1], 200 * (1 - u * 0.4), [255, 240, 200], a * 0.8 * (1 - u) * (1 - u));
        L.shock(ctx, P[0], P[1], t, tS + grow, { r0: 10, r1: 240, dur: 0.8, c: GOLD, a });
        sparks(ctx, P[0], P[1], t, tS + grow, 14, GOLD, a, 320, seed);
      }
    };
    fire(T, tF, 0.12, 0.9, 3);
    SAD.forEach((id, k) => fire(HEART[id].c, tB + k * 0.22, 0.08, 0.5, 20 + k * 9));
    ctx.restore();
  }, (ctx, t, a) => X.trait(ctx, '4', '读情绪，百发百中', ['百发百中'], t, vs('C201') - 0.2, ve('C202') + 0.3, GOLD));

  // ================= 镜头 2：C203 对外人一点光；对好友一条光河，从日出聊到月亮出来 =================
  add(vs('C203') - 0.2, vs('C204') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('C203'), tf = at('C203', '对信得过'), A0 = t0 - 0.2, B0 = vs('C204') + 0.1, HZ = 1060;
    const day = prog(t, tf, ve('C203') + 0.2), on = smooth(prog(t, tf - 0.15, tf + 0.35));
    const KEY = [[0, [30, 44, 70], [128, 98, 86]], [0.33, [24, 60, 78], [84, 126, 116]], [0.66, [46, 34, 68], [150, 86, 92]], [1, [6, 14, 26], [22, 42, 46]]];
    let k = 0; while (k < KEY.length - 2 && day > KEY[k + 1][0]) k++;
    const u = clamp((day - KEY[k][0]) / (KEY[k + 1][0] - KEY[k][0]));
    const top = mix([8, 18, 26], mix(KEY[k][1], KEY[k + 1][1], u), on), bot = mix([24, 40, 42], mix(KEY[k][2], KEY[k + 1][2], u), on);
    sky(ctx, a, [[0, top], [HZ / H, bot], [HZ / H + 0.005, mix(bot, [10, 22, 18], 0.7)], [1, [4, 8, 8]]]);
    stars(ctx, t, a * Math.max(1 - on, smooth(prog(day, 0.7, 1))), 60, HZ - 200);
    const pan = lerp(20, -20, prog(t, A0, B0));
    // 太阳划过天空，接着月亮升起（一整天）
    const sa = Math.PI * (1 + prog(day, 0, 0.72)), sx = 540 + Math.cos(sa) * 620, sy = HZ + Math.sin(sa) * 560, sunA = on * (1 - smooth(prog(day, 0.62, 0.76)));
    if (sunA > 0.003) { glow(ctx, sx, sy, 300, [255, 200, 130], a * sunA * 0.5); glow(ctx, sx, sy, 70, [255, 240, 200], a * sunA); }
    const ma = Math.PI * (1 + 0.38 * prog(day, 0.6, 1)), mx = 540 + Math.cos(ma) * 600, my = HZ + Math.sin(ma) * 560, moonA = smooth(prog(day, 0.62, 0.82));
    if (moonA > 0.003) { glow(ctx, mx, my, 200, [200, 220, 255], a * moonA * 0.4); ctx.fillStyle = col([240, 244, 230], a * moonA); ctx.beginPath(); ctx.arc(mx, my, 34, 0, 6.283); ctx.fill(); }
    // 两层远山（视差）
    for (const [lay, amp, cc, px] of [[0, 70, mix(bot, [10, 22, 24], 0.55), 0.3], [1, 44, mix(bot, [6, 14, 14], 0.8), 0.6]]) {
      ctx.fillStyle = col(cc, a); ctx.beginPath(); ctx.moveTo(0, HZ + 40);
      for (let x = -20; x <= W + 20; x += 30) ctx.lineTo(x + pan * px, HZ + lay * 30 - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + lay * 2) * Math.cos(x * 0.013 + lay)));
      ctx.lineTo(W, HZ + 60); ctx.closePath(); ctx.fill();
    }
    const gg = ctx.createLinearGradient(0, HZ + 30, 0, H); gg.addColorStop(0, col(mix(bot, [16, 34, 26], 0.6), a)); gg.addColorStop(1, col([4, 8, 8], a));
    ctx.fillStyle = gg; ctx.fillRect(0, HZ + 30, W, H - HZ);
    ctx.save(); const sc = 1 + 0.05 * smooth(prog(t, A0, B0)); ctx.translate(560, 1000); ctx.scale(sc, sc); ctx.translate(-560, -1000);
    // 影子随太阳转
    const shx = -Math.cos(sa) * 160 * sunA;
    for (const [fx, fy, w] of [[400 + pan, 1292, 110], [800 + pan * 0.8, 1272, 120]]) { ctx.fillStyle = col([0, 0, 0], a * 0.4); ctx.beginPath(); ctx.ellipse(fx + shx * 0.6, fy + 4, w * 0.6 + Math.abs(shx) * 0.6, 16, 0, 0, 6.283); ctx.fill(); }
    const bob = Math.abs(Math.sin(t * 7)) * 8 * on;
    pool(ctx, 600 + pan, 1280, 520, [255, 220, 170], a * 0.25 * on);
    const fr = MB.person(ctx, 'enfp-female', 800 + pan * 0.8, 1272, 2.55, { a, flip: true, bob, inner: on * 0.6, innerC: [255, 220, 160] });
    const o = infp(ctx, 400 + pan, 1292, 1.12, { a, t, wind: false, la: -0.6 * on, ra: -0.25 * on, look: on > 0.5 ? [1, -0.3] : [-1, 0], eyes: on > 0.5 ? 'happy' : 'open', mouth: on > 0.5 ? 'smile' : 'flat', flies: 1, nod: Math.sin(t * 6) * 0.15 * on });
    // 对外人：只漏出一点光就熄了
    const mu = prog(t, t0 + 0.3, t0 + 1.3);
    if (mu > 0 && mu < 1) glow(ctx, lerp(o.mouth[0], o.mouth[0] - 200, mu), o.mouth[1] + mu * 40, 10, LIME, a * (1 - mu) * 0.8);
    // 对好友：光河拱桥
    if (t > tf) {
      const P0 = [o.mouth[0] + 20, o.mouth[1]], P2 = [fr.head[0] - 20, fr.head[1] + 10], P1 = [(P0[0] + P2[0]) / 2, Math.min(P0[1], P2[1]) - 620];
      for (let i = 0; i < 160; i++) {
        const uu = (t - tf - i * 0.026) / 1.4; if (uu < 0 || uu > 1) continue;
        const p = bz(uu, P0, P1, P2), en = Math.sin(uu * Math.PI);
        p[0] += Math.cos(i * 1.7) * 50 * en; p[1] += Math.sin(uu * 9 + i) * 22 * en;
        const c = [LIME, GOLD, PINK, BLUE][i % 4], fa = a * Math.pow(en, 0.4);
        if (i % 5 === 0) glyph(ctx, (i / 5) % 4, p[0], p[1], 30 + hash(i) * 16, c, fa, t * 2 + i); else glow(ctx, p[0], p[1], 8 + hash(i) * 9, c, fa * 0.8);
      }
      const Q1 = [(P0[0] + P2[0]) / 2, Math.min(P0[1], P2[1]) - 250];
      for (let j = 0; j < 40; j++) { const uu = (t - tf - 0.5 - j * 0.07) / 1.3; if (uu < 0 || uu > 1) continue; const p = bz(uu, P2, Q1, P0); glow(ctx, p[0], p[1], 7, [255, 220, 170], a * Math.sin(uu * Math.PI) * 0.7); }
      glow(ctx, P2[0], P2[1], 90 + Math.sin(t * 9) * 20, [255, 230, 180], a * 0.35 * on);
    }
    ctx.restore();
    // 近景：外人的背影（虚焦大剪影），转向好友后滑出画面
    const out = easeIn(prog(t, tf - 0.25, tf + 0.5));
    if (out < 1) { ctx.save(); ctx.filter = 'blur(10px)'; MB.person(ctx, 'istj-male', 70 - out * 640, 1800, 5.2, { a: a * 0.95, dim: 0.72 }); ctx.restore(); }
    grassFront(ctx, t, a, -0.05, on * 0.6, 71);
  }, (ctx, t, a) => { X.trait(ctx, '5', '内向，但分享欲爆棚', ['分享欲爆棚'], t, vs('C203') - 0.2, ve('C203') + 0.3, LIME); X.quote(ctx, '其实我日常分享欲爆棚！', t, at('C203', '对信得过') + 0.4, ve('C203') + 0.6, { y: 330 }); });

  // ================= 镜头 3：C204-C205 彩带般的要求涌来，她跟着摇；底线亮起，升成光墙 =================
  add(vs('C204') - 0.2, vs('C206') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('C204'), A0 = t0 - 0.2, tb = at('C205', '底线'), tg = at('C205', '固执');
    const stand = smooth(prog(t, tb, tb + 0.4)), low = smooth(prog(t, tb - 0.1, tb + 0.6)), tension = smooth(prog(t, ve('C204'), tb));
    const HZ = lerp(1000, 1110, low);
    const top = mix([28, 30, 46], [6, 16, 22], stand), bot = mix([78, 66, 82], [30, 70, 60], stand);
    sky(ctx, a, [[0, top], [HZ / H, bot], [HZ / H + 0.004, mix(bot, [12, 20, 18], 0.75)], [1, [4, 8, 8]]]);
    stars(ctx, t, a * (0.3 + 0.5 * stand), 40, HZ - 300);
    glow(ctx, 540, HZ, 800, mix([150, 110, 120], [90, 160, 120], stand), 0.3 * a);
    const sc = 1 + 0.03 * smooth(prog(t, A0, tb)) + 0.08 * low;
    ctx.save(); ctx.translate(380, 1000); ctx.scale(sc, sc); ctx.translate(-380, -1000);
    const hx = 330;
    // 她身后的逆光（站直之后）
    if (stand > 0) for (let k = 0; k < 7; k++) beam(ctx, hx + 40, 700, -Math.PI / 2 + (k - 3) * 0.28 + Math.sin(t * 0.7 + k) * 0.03, 0.07, 1100, k % 2 ? IVORY : LIME, a * 0.07 * stand);
    pool(ctx, hx + 40, 1300, 420, LIME, a * (0.2 + 0.3 * stand));
    // 别人
    const step = smooth(prog(t, ve('C204'), tb)), rec = smooth(prog(t, tb + 0.1, tb + 0.6));
    MB.person(ctx, 'estj-female', 960, 1160, 1.8, { a, flip: true, dim: 0.25 + 0.2 * stand, lean: -0.05 * rec });
    MB.person(ctx, 'entj-male', lerp(1010, 820, step) + 150 * rec, 1270, 2.5, { a, flip: true, dim: 0.15 + 0.3 * tension, lean: 0.1 * rec });
    // 底线 + 光墙
    const B0 = [600, 1340], B1 = [690, HZ + 8];
    const wu = prog(t, tb, tb + 0.35), wh = 900 * (wu <= 0 ? 0 : easeOut(wu) + 0.12 * Math.sin(wu * Math.PI)) * (1 + 0.03 * Math.sin(t * 6) * smooth(prog(t, tg, tg + 0.3)));
    const wallTop = x => lerp(B0[1] - wh, B1[1] - wh * 0.45, (x - B0[0]) / (B1[0] - B0[0]));
    // 彩带：从右往左涌，绕着她走；光墙起来以后撞碎
    for (let i = 0; i < 7; i++) {
      const yb = 640 + i * 88, c = mix([[226, 180, 160], [200, 186, 220], [176, 200, 214], [226, 200, 150]][i % 4], [220, 80, 80], tension * 0.7);
      const pts = []; let hit = null;
      for (let x = 1140; x >= -40; x -= 18) {
        const dx = (x - hx) / 170;
        const y = yb + Math.sin(x * 0.007 + t * 2.0 + i * 1.3) * 34 + (yb < 900 ? -1 : 1) * 90 * Math.exp(-dx * dx);
        if (wh > 10 && x < 645 && y > wallTop(645)) { hit = [645, y]; break; }
        pts.push([x, y]);
      }
      glowLine(ctx, pts, c, a * 0.5, 2.2 + tension * 2.4, 0.8);
      pts.forEach(([x, y], j) => { if (j % 5 === 0) glow(ctx, x, y, 12, c, a * 0.5 * Math.max(0, Math.sin(x * 0.02 + t * 7))); });
      if (hit) for (let q = 0; q < 6; q++) { const ph = (t * 2.2 + q / 6 + i * 0.37) % 1, an = -0.3 + (hash(i * 13 + q) - 0.5) * 2.4; glow(ctx, hit[0] + Math.cos(an) * ph * 160, hit[1] + Math.sin(an) * ph * 160, 8, mix(c, [255, 240, 200], 0.5), a * (1 - ph)); }
    }
    const lu = easeOut(prog(t, tb - 0.45, tb));
    if (lu > 0) glowLine(ctx, [B0, [lerp(B0[0], B1[0], lu), lerp(B0[1], B1[1], lu)]], LIME, a, 3, 1.2);
    if (wh > 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, B0[1], 0, B0[1] - wh); g.addColorStop(0, col(LIME, 0.42 * a)); g.addColorStop(0.5, col(LIME, 0.14 * a)); g.addColorStop(1, col(LIME, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(B0[0], B0[1]); ctx.lineTo(B1[0], B1[1]); ctx.lineTo(B1[0], B1[1] - wh * 0.45); ctx.lineTo(B0[0], B0[1] - wh); ctx.closePath(); ctx.fill();
      ctx.restore();
      for (let k = 0; k < 9; k++) { const v = k / 8, x = lerp(B0[0], B1[0], v), yb2 = lerp(B0[1], B1[1], v), ht = wh * lerp(1, 0.45, v) * (0.6 + 0.4 * Math.sin(t * 3 + k * 1.7)); glowLine(ctx, [[x, yb2], [x, yb2 - ht]], [230, 250, 180], a * 0.35, 1.2, 0.6); }
      glowLine(ctx, [[B0[0], B0[1] - wh], [B1[0], B1[1] - wh * 0.45]], [240, 255, 200], a * 0.6, 1.6, 0.8);
      L.shock(ctx, 640, 1200, t, tb, { r0: 20, r1: 520, dur: 1, c: LIME, a, sy: 0.3 });
      L.shock(ctx, 640, 1200, t, tg, { r0: 20, r1: 400, dur: 0.9, c: IVORY, a: a * 0.7, sy: 0.3 });
    }
    // 她：之前跟着彩带摇、一直点头；底线一亮就站直，风车往地上一插
    const sway = (1 - stand) * (0.07 * Math.sin(t * 2.4) - 0.04);
    infp(ctx, hx, 1300, lerp(1.05, 1.3, stand), { a, t, lean: sway, nod: (1 - stand) * Math.abs(Math.sin(t * 3)) * 0.5, eyes: stand > 0.5 ? 'open' : 'happy', mouth: stand > 0.5 ? 'flat' : 'smile', ra: lerp(0.3, 0.9, stand), la: lerp(0.2, -0.5, stand), spin: (1 - stand) * t * 2, flies: 1 });
    if (stand > 0) L.shock(ctx, hx + 120, 1300, t, tb + 0.15, { r0: 20, r1: 360, dur: 0.8, c: LIME, a, sy: 0.25 });
    ctx.restore();
    grassFront(ctx, t, a, lerp(-0.35, 0.02, stand), stand, 33);
  }, (ctx, t, a) => { X.trait(ctx, '6', '软，但有底线', ['底线'], t, vs('C204') - 0.2, ve('C205') + 0.3, LIME); X.quote(ctx, '小蝴蝶的战斗力不是盖的！！', t, at('C205', '固执'), ve('C205') + 0.8, { y: 330 }); });

  // ================= 镜头 4：C206-C207 夜湖，倒影里的小鸭碎开重组成天鹅 =================
  add(vs('C206') - 0.2, vs('D01') - 0.9, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    const t0 = vs('C206'), A0 = t0 - 0.2, tw = at('C207', '没有错'), tsw = at('C207', '天鹅'), HZ = 560, WY = 1012;
    const cam = smooth(prog(t, A0, tw + 0.3)), tImp = tw + 0.45;
    const A = t > tImp ? Math.exp(-(t - tImp) * 1.8) * smooth(prog(t, tImp, tImp + 0.12)) : 0;
    const morph = smooth(prog(t, tImp + 0.15, tImp + 0.55)), sg = smooth(prog(t, tsw - 0.3, tsw + 0.6)), wo = smooth(prog(t, tsw - 0.1, tsw + 1.0));
    ctx.save(); ctx.translate(0, -160 * cam); const sc = 1 + 0.06 * cam; ctx.translate(500, 950); ctx.scale(sc, sc); ctx.translate(-500, -950);
    const sk = ctx.createLinearGradient(0, -300, 0, HZ); sk.addColorStop(0, col([4, 10, 22], a)); sk.addColorStop(1, col([26, 52, 62], a));
    ctx.fillStyle = sk; ctx.fillRect(-100, -400, W + 200, HZ + 400);
    stars(ctx, t, a * 0.8, -200, HZ - 80, [220, 230, 255]);
    const MX = 770, MY = 330;
    glow(ctx, MX, MY, 340, [180, 210, 255], a * (0.35 + 0.25 * sg)); ctx.fillStyle = col([244, 246, 232], a); ctx.beginPath(); ctx.arc(MX, MY, 60, 0, 6.283); ctx.fill();
    // 水
    const wg = ctx.createLinearGradient(0, HZ, 0, H + 200); wg.addColorStop(0, col([28, 56, 66], a)); wg.addColorStop(0.5, col([10, 24, 32], a)); wg.addColorStop(1, col([4, 10, 14], a));
    ctx.fillStyle = wg; ctx.fillRect(-100, HZ, W + 200, H);
    // 月光反射带
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let y = HZ + 6; y < 1560; y += 9) { const w = 24 + (y - HZ) * 0.3, f = 0.5 + 0.5 * Math.sin(t * 2.6 + y * 0.09 + hash(y) * 6); ctx.fillStyle = col([230, 236, 220], a * (0.12 + 0.1 * sg) * f); ctx.fillRect(MX - w / 2 + Math.sin(y * 0.05 + t) * 10 + (hash(y * 1.3) - 0.5) * w * 0.4, y, w * (0.4 + hash(y * 2.1) * 0.6), 3); }
    ctx.restore();
    // 远岸：一排一模一样的灰色人影，连同倒影
    const shore = c2 => { c2.fillStyle = col([10, 22, 26], a); c2.beginPath(); c2.moveTo(-100, HZ + 2); for (let x = -100; x <= W + 100; x += 26) c2.lineTo(x, HZ - 18 - 26 * Math.abs(Math.sin(x * 0.011)) - 14 * hash(Math.floor(x / 26))); c2.lineTo(W + 100, HZ + 2); c2.closePath(); c2.fill(); };
    const row = (al) => { for (let i = 0; i < 9; i++) if (i < 2 || i > 4) MB.person(ctx, 'isfj-female', 110 + i * 108, HZ + 2, 0.5, { a: al, gray: 1, dim: 0.45, shadow: 0 }); };
    shore(ctx); row(a);
    ctx.save(); ctx.translate(0, 2 * HZ + 4); ctx.scale(1, -0.8); ctx.globalAlpha = 0.25; shore(ctx); row(a); ctx.restore();
    band(ctx, HZ + 10, 50, [80, 120, 130], 0.18 * a);
    // 倒影：先画到离屏，再一条条按水波错开（落泪后碎开）
    RC.setTransform(1, 0, 0, 1, 0, 0); RC.clearRect(0, 0, W, 760); RC.save(); RC.translate(450, 30); RC.scale(1, -0.78);
    creature(RC, 'duck', 1.55, 1 - morph, 0); creature(RC, 'swan', 1.2, morph, wo * 0.55);
    RC.restore();
    if (sg > 0) glow(ctx, 480, WY + 220, 460, [255, 248, 225], a * 0.45 * sg);
    for (let r = 0; r < 760; r += 6) {
      const fade = 1 - r / 760;
      const dx = Math.sin(r * 0.07 + t * 2.5) * (3 + r * 0.02) + A * (Math.sin(r * 0.21 + t * 11) * 90 + (hash(r * 7 + Math.floor(t * 8)) - 0.5) * 70);
      ctx.globalAlpha = clamp(a * fade * (0.55 + 0.4 * morph) * (1 - A * 0.25));
      ctx.drawImage(REF, 0, r, W, 6, dx, WY + r, W, 6);
    }
    ctx.globalAlpha = 1;
    if (A > 0.02) for (let i = 0; i < 26; i++) glow(ctx, 430 + (hash(i * 3.7) - 0.5) * 520 * (1.2 - A), WY + 40 + hash(i * 1.9) * 280, 10, i % 3 ? IVORY : GOLD, a * A * 0.8);
    for (let k = 0; k < 4; k++) { const r = (t - tImp - k * 0.28) * 380; if (r > 0 && r < 900) L.ellipse(ctx, 430, WY + 4, r, r * 0.22, [200, 230, 240], a * 0.55 * (1 - r / 900), 2); }
    // 湖心石 + 她
    poly(ctx, [[290, 1012], [335, 976], [425, 964], [525, 972], [590, 1008], [520, 1030], [370, 1034]], [16, 26, 30], a);
    poly(ctx, [[335, 976], [425, 964], [525, 972], [470, 990], [380, 992]], [40, 60, 64], a);
    if (sg > 0) glow(ctx, 440, 760, 340, [255, 236, 190], a * 0.3 * sg);
    const o = infp(ctx, 430, 992, 0.8, { a, t, nod: lerp(1.1, 0.4, sg), look: [0.2, 1], eyes: sg > 0.5 ? 'happy' : 'sad', mouth: sg > 0.5 ? 'smile' : 'flat', wind: true, spin: t * 0.3, la: 0.25, ra: 0.2, flies: 1 });
    // 一滴泪落进水里
    const du = prog(t, tw - 0.05, tImp);
    if (du > 0 && du < 1) glow(ctx, o.eyes[0] - 4, lerp(o.eyes[1] + 10, WY + 2, easeIn(du)), 9, [200, 230, 255], a);
    if (t > tImp) glow(ctx, 430, WY + 4, 120 * (1 - A * 0.5), [200, 230, 255], a * A * 0.7);
    // 天鹅之后：羽毛从水面升起
    if (t > tsw - 0.1) for (let i = 0; i < 36; i++) {
      const fu = (t - tsw + 0.1 - i * 0.05) / 2.4; if (fu < 0 || fu > 1) continue;
      const fx = 430 + (hash(i * 4.1) - 0.5) * 340 + Math.sin(fu * 5 + i) * 40, fy = WY + 120 + hash(i * 2.7) * 120 - fu * 820, rot = t * 2 + i;
      ctx.save(); ctx.translate(fx, fy); ctx.rotate(rot); ctx.globalAlpha = clamp(a * Math.sin(fu * Math.PI));
      ctx.fillStyle = 'rgb(250,250,244)'; ctx.beginPath(); ctx.ellipse(0, 0, 14, 4, 0, 0, 6.283); ctx.fill(); ctx.restore();
      glow(ctx, fx, fy, 22, IVORY, a * 0.35 * Math.sin(fu * Math.PI));
    }
    ctx.restore();
  }, (ctx, t, a) => X.trait(ctx, '7', '丑小鸭，其实是天鹅', ['天鹅'], t, vs('C206') - 0.2, ve('C207') + 0.3, GOLD));

  return S;
};
