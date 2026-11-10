// 人物和小船，都是带投影的纸偶。人物的身材、肤色、衣服全是数字，所以两个年纪之间可以连续“长”过去
'use strict';

// 六个年纪的“他”，外加伴侣和接棒的孩子。head/torso/leg/arm = [宽, 长]
const WHO = {
  7: { head: [72, 70], torso: [66, 76], leg: [28, 64], arm: [22, 72], skin: C('#f4cda8'), hair: C('#b05a2e'), style: 'curl', top: C('#f3eddf'), pants: C('#4d5f8a') },
  17: { head: [64, 68], torso: [86, 104], leg: [30, 118], arm: [24, 104], skin: C('#f4cda8'), hair: C('#974c27'), style: 'fringe', top: C('#27696f'), pants: C('#2c2f3b'), deco: 'pocket' },
  27: { head: [64, 68], torso: [94, 116], leg: [32, 134], arm: [26, 114], skin: C('#f1c69f'), hair: C('#8a4526'), style: 'short', top: C('#e36d4b'), pants: C('#3c4c6e'), deco: 'collar' },
  37: { head: [64, 68], torso: [100, 116], leg: [32, 134], arm: [26, 114], skin: C('#f1c69f'), hair: C('#7b4025'), style: 'short', beard: C('#7b4025'), top: C('#4f8c5c'), pants: C('#4b4037'), deco: 'stripe' },
  57: { head: [64, 68], torso: [106, 114], leg: [32, 130], arm: [26, 112], skin: C('#ebbf9b'), hair: C('#bdb7ae'), style: 'bald', beard: C('#bdb7ae'), glasses: 1, top: C('#8b414c'), pants: C('#3b3b42'), deco: 'collar' },
  77: { head: [64, 68], torso: [100, 108], leg: [32, 120], arm: [26, 108], skin: C('#e7bc9c'), hair: C('#f3f0ea'), style: 'bald', beard: C('#f3f0ea'), glasses: 1, top: C('#40616f'), pants: C('#5b5149'), deco: 'cardigan', stoop: 8 },
  partner: { head: [62, 66], torso: [84, 110], leg: [30, 126], arm: [24, 108], skin: C('#f6d3b2'), hair: C('#2a242c'), style: 'bob', top: C('#3b9b95'), pants: C('#dbcfb6') },
  partnerOld: { head: [62, 66], torso: [86, 108], leg: [30, 120], arm: [24, 106], skin: C('#edc6a6'), hair: C('#aba7ab'), style: 'bob', top: C('#5b7b9b'), pants: C('#6b6359') },
  next: { head: [72, 70], torso: [66, 76], leg: [28, 64], arm: [22, 72], skin: C('#f4cda8'), hair: C('#3a2a22'), style: 'buns', top: C('#d94a3d'), pants: C('#3c4c6e') },
};
// P.who = 某个年纪；或者 P.mix = {a, b, k}：从 a 长到 b 的中间样子
function whoSpec(P) {
  if (P.mix && P.mix.k > 0 && P.mix.a !== P.mix.b) {
    const a = WHO[P.mix.a], b = WHO[P.mix.b], k = sat(P.mix.k), L = (x, y) => [lerp(x[0], y[0], k), lerp(x[1], y[1], k)];
    return { head: L(a.head, b.head), torso: L(a.torso, b.torso), leg: L(a.leg, b.leg), arm: L(a.arm, b.arm), skin: mixc(a.skin, b.skin, k), top: mixc(a.top, b.top, k), pants: mixc(a.pants, b.pants, k), stoop: lerp(a.stoop || 0, b.stoop || 0, k), A: a, B: b, k };
  }
  const d = WHO[P.mix ? P.mix.a : P.who]; return Object.assign({}, d, { stoop: d.stoop || 0, A: d, B: d, k: 0 });
}

// 手臂角度：0 = 垂着，90 = 平举，180 = 举过头；第二个数是小臂相对大臂再转多少（负数 = 往身体里收）
// P = {who|mix, x, y(脚底；坐着时是坐面；坐地上时是地面), s 缩放, sit 坐在床/椅子上, floor 盘腿坐地上, armL, armR, armsFront 手臂画在身体前面,
//      top 衣服颜色(可覆盖), dim 0..1 变暗, mono 整个人只用一种颜色（“还不认识的人”）, lean, sleep, flat 不要投影}
function personGeo(P) {
  const d = whoSpec(P), s = P.s || 1, sit = !!P.sit, fl = !!P.floor;
  const legH = (fl ? 24 : sit ? d.leg[1] * .6 : d.leg[1]) * s, torsoH = d.torso[1] * s, headH = d.head[1] * s;
  const hip = P.y - (sit ? 0 : legH), sh = hip - torsoH + 6 * s, lean = (P.lean || 0) * s + d.stoop * s;
  const shX = d.torso[0] * s / 2 - 5 * s, cx = P.x;
  const arm = (side, a) => {
    a = a || [8, 0]; const L = d.arm[1] * s / 2, a1 = a[0] * Math.PI / 180, a2 = (a[0] + a[1]) * Math.PI / 180;
    const x0 = cx + lean + side * shX, y0 = sh + 12 * s, x1 = x0 + side * Math.sin(a1) * L, y1 = y0 + Math.cos(a1) * L, x2 = x1 + side * Math.sin(a2) * L, y2 = y1 + Math.cos(a2) * L;
    return [x0, y0, x1, y1, x2, y2];
  };
  const aL = arm(-1, P.armL), aR = arm(1, P.armR);
  return { d, s, sit, fl, legH, torsoH, headH, hip, sh, lean, cx, aL, aR, handL: [aL[4], aL[5]], handR: [aR[4], aR[5]], headC: [cx + lean * 1.3, sh - headH / 2 + 2 * s], top: sh - headH + 2 * s, feet: P.y + (sit ? legH : 0) };
}
function drawPerson(ctx, P) {
  const G = personGeo(P), { d, s, cx, hip, sh, lean, legH, headH } = G;
  const dim = P.dim || 0, mono = P.mono, col = c => { let r = mono || c; if (dim) r = mixc(r, [22, 18, 22], dim); return r; };
  const skin = col(d.skin), top = col(P.top || d.top), pants = col(d.pants), shoe = col(C('#2c2420'));
  const SH = k => { if (P.flat) shOff(ctx); else shOn(ctx, k); };
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (P.alpha !== undefined) ctx.globalAlpha *= P.alpha;
  // 腿
  const lw = d.leg[0] * s, gap = d.torso[0] * s * .23, tw = d.torso[0] * s;
  SH(.7);
  if (G.fl) {                                              // 盘腿坐地上
    fs(ctx, pants); rr(ctx, cx - tw * .86, P.y - 28 * s, tw * 1.72, 28 * s, 14 * s);
    fs(ctx, shoe); rr(ctx, cx - tw * .96, P.y - 18 * s, 30 * s, 16 * s, 8 * s); rr(ctx, cx + tw * .96 - 30 * s, P.y - 18 * s, 30 * s, 16 * s, 8 * s);
  } else for (const side of [-1, 1]) {
    const x = cx + side * gap;
    fs(ctx, side < 0 ? dark(pants, .1) : pants); rr(ctx, x - lw / 2, hip - 6 * s, lw, legH + 6 * s, 8 * s);
    fs(ctx, shoe); rr(ctx, x - lw / 2 - 3 * s, P.y + (P.sit ? legH : 0) - 13 * s, lw + 8 * s, 13 * s, 6 * s);
  }
  shOff(ctx);
  if (P.sit) { fs(ctx, lite(pants, .08)); rr(ctx, cx - tw / 2 + 2 * s, hip - 10 * s, tw - 4 * s, 24 * s, 10 * s); }
  const arm = (a, shade) => { SH(.6); ctx.strokeStyle = css(shade ? dark(top, shade) : top); ctx.lineWidth = d.arm[0] * s; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.lineTo(a[4], a[5]); ctx.stroke(); fs(ctx, skin); circ(ctx, a[4], a[5], d.arm[0] * s * .56); shOff(ctx); };
  if (!P.armsFront) { arm(G.aL, .12); arm(G.aR, .12); }
  // 躯干
  SH(.8); fs(ctx, top); ctx.beginPath(); ctx.roundRect(cx + lean - tw / 2, sh, tw, hip - sh + 8 * s, [26 * s, 26 * s, 10 * s, 10 * s]); ctx.fill(); shOff(ctx);
  if (!mono) decoBody(ctx, d, G, top, col, tw);
  if (P.armsFront) { arm(G.aL, 0); arm(G.aR, 0); }
  // 脖子、头
  const hw = d.head[0] * s, hx = G.headC[0], hy = G.top, hcy = hy + headH / 2;
  fs(ctx, dark(skin, .12)); rr(ctx, hx - 10 * s, sh - 8 * s, 20 * s, 14 * s, 5 * s);
  if (!mono) headBack(ctx, d, col, hx, hy, hw, headH, s);
  SH(.6); fs(ctx, skin); ctx.beginPath(); ctx.ellipse(hx, hcy, hw / 2, headH / 2, 0, 0, 7); ctx.fill(); shOff(ctx);
  if (!mono) {
    headFront(ctx, d, col, hx, hy, hw, headH, s);
    // 脸
    const ey = hy + headH * .56, ex = hw * .21;
    fs(ctx, col(C('#f08a72')), .28); circ(ctx, hx - ex - 7 * s, ey + 11 * s, 7 * s); circ(ctx, hx + ex + 7 * s, ey + 11 * s, 7 * s);
    fs(ctx, col(C('#2a1e18'))); ctx.strokeStyle = css(col(C('#2a1e18'))); ctx.lineWidth = 3 * s;
    if (P.sleep) { for (const sd of [-1, 1]) { ctx.beginPath(); ctx.arc(hx + sd * ex, ey - 2 * s, 5 * s, .15 * Math.PI, .85 * Math.PI); ctx.stroke(); } }
    else { circ(ctx, hx - ex, ey, 4.4 * s); circ(ctx, hx + ex, ey, 4.4 * s); }
    if (!d.B.beard || d.k < .5) { ctx.globalAlpha *= 1; ctx.beginPath(); ctx.arc(hx, ey + 9 * s, 6 * s, .2 * Math.PI, .8 * Math.PI); ctx.stroke(); }
  }
  ctx.restore();
  return G;
}
// 衣服上的小细节（按年纪淡入淡出）
function decoBody(ctx, d, G, top, col, tw) {
  const one = (w, a) => {
    if (!w.deco || a <= 0.01) return; const s = G.s, x = G.cx + G.lean, y = G.sh; ctx.save(); ctx.globalAlpha *= a;
    if (w.deco === 'pocket') { fs(ctx, dark(top, .18)); rr(ctx, x - 28 * s, y + 54 * s, 56 * s, 30 * s, 10 * s); }
    else if (w.deco === 'collar') { fs(ctx, col(C('#f4eee2'))); poly(ctx, [x - 16 * s, y, x + 16 * s, y, x, y + 26 * s]); }
    else if (w.deco === 'stripe') { fs(ctx, dark(top, .16)); for (let k = 0; k < 3; k++) ctx.fillRect(x - tw / 2 + 2, y + (30 + k * 28) * s, tw - 4, 7 * s); }
    else if (w.deco === 'cardigan') { fs(ctx, col(C('#e9dfcb'))); rr(ctx, x - 7 * s, y + 4 * s, 14 * s, G.hip - y - 4 * s, 4 * s); fs(ctx, dark(top, .3)); for (let k = 0; k < 3; k++) circ(ctx, x, y + (30 + k * 26) * s, 3.4 * s); }
    ctx.restore();
  };
  if (d.A === d.B) one(d.A, 1); else { one(d.A, 1 - d.k); one(d.B, d.k); }
}
// 头后面的头发（波波头、丸子）和头前面的头发、胡子、眼镜。两个年纪之间按 k 淡入淡出
function headBack(ctx, d, col, hx, hy, hw, hh, s) {
  const one = (w, a) => {
    if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a; fs(ctx, col(w.hair)); shOn(ctx, .5);
    if (w.style === 'bob') rr(ctx, hx - hw / 2 - 6 * s, hy + 2 * s, hw + 12 * s, hh * 1.02, 26 * s);
    if (w.style === 'buns') { circ(ctx, hx - hw * .46, hy + 6 * s, 16 * s); circ(ctx, hx + hw * .46, hy + 6 * s, 16 * s); }
    if (w.style === 'curl') for (const [dx, dy, r] of [[-30, 14, 14], [30, 14, 14]]) circ(ctx, hx + dx * s, hy + dy * s, r * s);
    ctx.restore();
  };
  if (d.A === d.B) one(d.A, 1); else { one(d.A, 1 - d.k); one(d.B, d.k); }
}
function headFront(ctx, d, col, hx, hy, hw, hh, s) {
  const hcy = hy + hh / 2;
  const cap = k => { ctx.beginPath(); ctx.ellipse(hx, hcy, hw / 2 + 2.5 * s, hh / 2 + 2.5 * s, 0, Math.PI + k, -k); ctx.closePath(); ctx.fill(); };
  const one = (w, a) => {
    if (a <= 0.01) return; ctx.save(); ctx.globalAlpha *= a;
    if (w.beard) { fs(ctx, col(w.beard)); ctx.beginPath(); ctx.ellipse(hx, hcy, hw / 2 + 1, hh / 2 + 1, 0, .16, Math.PI - .16); ctx.closePath(); ctx.fill(); fs(ctx, col(d.skin)); rr(ctx, hx - 11 * s, hy + hh * .68, 22 * s, 9 * s, 4.5 * s); }
    fs(ctx, col(w.hair)); const st = w.style;
    if (st === 'curl') { cap(-.02); for (const [dx, dy, r] of [[-27, 6, 15], [-11, -5, 16], [8, -6, 16], [26, 5, 15]]) circ(ctx, hx + dx * s, hy + (dy + 10) * s, r * s); }
    else if (st === 'fringe') { cap(-.12); ctx.beginPath(); ctx.moveTo(hx - hw / 2 - 2 * s, hy + hh * .26); ctx.quadraticCurveTo(hx - 4 * s, hy + hh * .5, hx + hw * .3, hy + hh * .2); ctx.lineTo(hx - hw / 2, hy + hh * .12); ctx.closePath(); ctx.fill(); }
    else if (st === 'short') cap(.1);
    else if (st === 'bob') { cap(-.06); }
    else if (st === 'buns') cap(.04);
    else if (st === 'bald') { rr(ctx, hx - hw / 2 - 4 * s, hy + hh * .3, 12 * s, hh * .32, 6 * s); rr(ctx, hx + hw / 2 - 8 * s, hy + hh * .3, 12 * s, hh * .32, 6 * s); }
    if (w.glasses) { const ey = hy + hh * .56, ex = hw * .21; ctx.strokeStyle = css(col(C('#2a2624'))); ctx.lineWidth = 3.4 * s; ctx.beginPath(); ctx.arc(hx - ex, ey, 11 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(hx + ex, ey, 11 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx - ex + 11 * s, ey); ctx.lineTo(hx + ex - 11 * s, ey); ctx.stroke(); }
    ctx.restore();
  };
  if (d.A === d.B) one(d.A, 1); else { one(d.A, 1 - d.k); one(d.B, d.k); }
}

// ---------- 小船 ----------
// 原点在船底正中，s = 1 时船身宽约 124。船身由 11 块木板拼成，桅杆、主帆、前帆、小旗各是一片
const SHIP_OLD = { mast: C('#7a563a'), sail: C('#ece3d0'), stripe: 0, hull: C('#8b5e3b') };
const SHIP_NEW = { mast: C('#dcbf90'), sail: C('#fdfaf2'), stripe: 1, hull: C('#8b5e3b') };
const HULL_NEW = C('#c58a52');
function hullPath(c) { c.beginPath(); c.moveTo(-62, -30); c.lineTo(66, -30); c.quadraticCurveTo(60, 0, 30, 0); c.lineTo(-34, 0); c.quadraticCurveTo(-58, -4, -62, -30); c.closePath(); }
const PLANKS = [[-62, -30, -30, -20], [-30, -30, 4, -20], [4, -30, 36, -20], [36, -30, 66, -20], [-62, -20, -42, -10], [-42, -20, -8, -10], [-8, -20, 24, -10], [24, -20, 66, -10], [-62, -10, -18, 0], [-18, -10, 14, 0], [14, -10, 66, 0]];
function shipPlank(c, i, col) { const r = PLANKS[i]; c.save(); hullPath(c); c.clip(); fs(c, mixc(col, [20, 12, 8], (i * 37 % 5) * .025)); c.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]); fs(c, [30, 18, 10], .3); c.fillRect(r[0], r[3] - 1.2, r[2] - r[0], 1.2); c.fillRect(r[2] - 1.2, r[1], 1.2, r[3] - r[1]); c.restore(); }
function shipMast(c, col) { fs(c, col); rr(c, -3.5, -146, 7, 118, 3); }
function shipFlag(c) { fs(c, C('#e8563c')); poly(c, [3, -146, 28, -138, 3, -130]); }
function shipSail(c, which, col, o) {                       // which: 'main' 主帆（右）/ 'jib' 前帆（左）
  o = o || {}; fs(c, col);
  if (which === 'main') { c.beginPath(); c.moveTo(9, -130); c.quadraticCurveTo(52, -84, 66, -38); c.lineTo(9, -38); c.closePath(); c.fill(); fs(c, [30, 18, 10], .08); c.fillRect(9, -130, 9, 92); if (o.stripe) { c.save(); c.beginPath(); c.moveTo(9, -130); c.quadraticCurveTo(52, -84, 66, -38); c.lineTo(9, -38); c.closePath(); c.clip(); fs(c, C('#2f7390'), o.stripe); c.fillRect(0, -74, 80, 15); c.restore(); } if (o.tear) { fs(c, C('#2a2320'), o.tear); poly(c, [18, -98, 34, -80, 22, -66, 30, -84]); } }
  else { c.beginPath(); c.moveTo(-9, -114); c.quadraticCurveTo(-34, -76, -48, -38); c.lineTo(-9, -38); c.closePath(); c.fill(); }
}
// o = {tilt, mast, sail, hull, stripe, planks:[每块木板的颜色], glow, tear, noHull, noMast, noSail, dim, flat}
function drawShip(ctx, x, y, s, o) {
  o = o || {}; const mast = o.mast || SHIP_OLD.mast, sail = o.sail || SHIP_OLD.sail, hull = o.hull || SHIP_OLD.hull, dim = o.dim || 0, col = c => dim ? mixc(c, [22, 18, 22], dim) : c;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt || 0); ctx.scale(s, s); const z0 = ctx._z; ctx._z = (z0 || 1) * s;
  if (o.glow) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(0, -60, 4, 0, -60, 190); g.addColorStop(0, css(PAL.gold, .5 * o.glow)); g.addColorStop(1, css(PAL.gold, 0)); ctx.fillStyle = g; ctx.fillRect(-190, -250, 380, 380); ctx.restore(); }
  const SH = k => { if (o.flat) shOff(ctx); else shOn(ctx, k / Math.max(1, s * .6)); };
  if (!o.noMast) { SH(.6); shipMast(ctx, col(mast)); shipFlag(ctx); shOff(ctx); }
  if (!o.noSail) { SH(.6); shipSail(ctx, 'jib', col(sail)); shipSail(ctx, 'main', col(sail), { stripe: o.stripe, tear: o.tear }); shOff(ctx); }
  if (!o.noHull) {
    SH(.8); fs(ctx, col(hull)); hullPath(ctx); ctx.fill(); shOff(ctx);
    for (let i = 0; i < PLANKS.length; i++) shipPlank(ctx, i, col(o.planks ? o.planks[i] : hull));
    fs(ctx, col(lite(hull, .2))); rr(ctx, -66, -35, 136, 8, 4);
  }
  ctx._z = z0; ctx.restore();
}
