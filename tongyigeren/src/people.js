// 人物和小船。人物是正面的圆头纸偶：头、头发、躯干、两段手臂、两条腿，全部由参数决定
'use strict';

// 六个年纪的“他”，外加伴侣和最后接棒的孩子
const WHO = {
  7: { head: [70, 68], torso: [64, 74], leg: [28, 64], arm: [22, 72], skin: C('#f2c9a2'), hair: C('#a8552e'), style: 'curl', top: C('#e9b432'), pants: C('#5a4636') },
  17: { head: [62, 66], torso: [86, 104], leg: [30, 118], arm: [24, 104], skin: C('#f2c9a2'), hair: C('#8a4526'), style: 'fringe', top: C('#1f6a70'), pants: C('#2a2d38'), phones: C('#e0803a') },
  27: { head: [62, 66], torso: [92, 116], leg: [32, 134], arm: [26, 114], skin: C('#efc29a'), hair: C('#8a4526'), style: 'short', top: C('#e06a4a'), pants: C('#3a4a6a') },
  37: { head: [62, 66], torso: [98, 116], leg: [32, 134], arm: [26, 114], skin: C('#efc29a'), hair: C('#7a3f24'), style: 'short', beard: C('#7a3f24'), top: C('#4f8a5b'), pants: C('#4a3f36') },
  57: { head: [62, 66], torso: [104, 114], leg: [32, 130], arm: [26, 112], skin: C('#e8bb96'), hair: C('#b9b3aa'), style: 'bald', stache: C('#b9b3aa'), glasses: 1, top: C('#8a3f4a'), pants: C('#3a3a40') },
  77: { head: [62, 66], torso: [98, 108], leg: [32, 120], arm: [26, 108], skin: C('#e4b898'), hair: C('#f1eee8'), style: 'cap', beard: C('#f1eee8'), glasses: 1, top: C('#3f5f6e'), pants: C('#5a5048'), stoop: 1 },
  partner: { head: [60, 64], torso: [84, 110], leg: [30, 126], arm: [24, 108], skin: C('#f4d0ae'), hair: C('#26222a'), style: 'bob', top: C('#3a9a94'), pants: C('#d9cdb4') },
  partnerOld: { head: [60, 64], torso: [86, 108], leg: [30, 120], arm: [24, 106], skin: C('#ebc3a2'), hair: C('#a8a4a8'), style: 'bob', top: C('#5a7a9a'), pants: C('#6a6258') },
  next: { head: [70, 68], torso: [64, 74], leg: [28, 64], arm: [22, 72], skin: C('#f2c9a2'), hair: C('#3a2a22'), style: 'buns', top: C('#d8483c'), pants: C('#3a4a6a') },
};

// 姿势里的手臂角度：0 = 垂着，90 = 平举，180 = 举过头；第二个数是小臂相对大臂再转多少（负数 = 往身体里收）
// P = {who, x, y(脚底；坐着时是坐面；坐地上时是地面), s 缩放, sit 坐在床/椅子上, floor 盘腿坐地上, armL:[a,b], armR:[a,b],
//      top 衣服颜色(可覆盖), dim 0..1 变暗, mono 颜色(整个人只用一种颜色：“还不认识的人”), lean, sleep}
function personGeo(P) {
  const d = WHO[P.who], s = P.s || 1, sit = !!P.sit, fl = !!P.floor;
  const legH = (fl ? 22 : sit ? d.leg[1] * .6 : d.leg[1]) * s, torsoH = d.torso[1] * s, headH = d.head[1] * s;
  const hip = P.y - (sit ? 0 : legH), sh = hip - torsoH + 6 * s, lean = (P.lean || 0) * s + (d.stoop ? 6 * s : 0);
  const shX = d.torso[0] * s / 2 - 4 * s, cx = P.x;
  const arm = (side, a) => {
    a = a || [8, 0]; const L = d.arm[1] * s / 2, a1 = a[0] * Math.PI / 180, a2 = (a[0] + a[1]) * Math.PI / 180;
    const x0 = cx + lean + side * shX, y0 = sh + 8 * s, x1 = x0 + side * Math.sin(a1) * L, y1 = y0 + Math.cos(a1) * L, x2 = x1 + side * Math.sin(a2) * L, y2 = y1 + Math.cos(a2) * L;
    return [x0, y0, x1, y1, x2, y2];
  };
  const aL = arm(-1, P.armL), aR = arm(1, P.armR);
  return { d, s, sit, fl, legH, torsoH, headH, hip, sh, lean, cx, aL, aR, handL: [aL[4], aL[5]], handR: [aR[4], aR[5]], headC: [cx + lean * 1.3, sh - headH / 2 - 2 * s], top: sh - headH - 2 * s, feet: P.y + (sit ? legH : 0) };
}
function drawPerson(ctx, P) {
  const G = personGeo(P), { d, s, cx, hip, sh, lean, legH, headH } = G;
  const dim = P.dim || 0, mono = P.mono, col = c => { let r = mono || c; if (dim) r = mixc(r, [14, 16, 24], dim); return r; };
  const skin = col(d.skin), top = col(P.top || d.top), pants = col(d.pants), hair = col(d.hair);
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (P.alpha !== undefined) ctx.globalAlpha *= P.alpha;
  if (!P.sit && !P.noShadow) { fs(ctx, [0, 0, 0], .28); ctx.beginPath(); ctx.ellipse(cx, P.y + 3 * s, d.torso[0] * s * (G.fl ? 1 : .7), 8 * s, 0, 0, 7); ctx.fill(); }
  // 腿
  const lw = d.leg[0] * s, gap = d.torso[0] * s * .22;
  if (G.fl) {                                              // 盘腿坐地上
    fs(ctx, pants); rr(ctx, cx - d.torso[0] * s * .82, P.y - 26 * s, d.torso[0] * s * 1.64, 26 * s, 13 * s);
    fs(ctx, col(C('#2a2320'))); rr(ctx, cx - d.torso[0] * s * .9, P.y - 16 * s, 26 * s, 14 * s, 7 * s); rr(ctx, cx + d.torso[0] * s * .9 - 26 * s, P.y - 16 * s, 26 * s, 14 * s, 7 * s);
  } else for (const side of [-1, 1]) {
    const x = cx + side * gap;
    fs(ctx, side < 0 ? mul(pants, .86) : pants); rr(ctx, x - lw / 2, hip - 4 * s, lw, legH + 4 * s, 6 * s);
    fs(ctx, col(C('#2a2320'))); rr(ctx, x - lw / 2 - 2 * s, P.y + (P.sit ? legH : 0) - 12 * s, lw + 6 * s, 12 * s, 5 * s);
  }
  if (P.sit) { fs(ctx, mul(pants, 1.15)); rr(ctx, cx - d.torso[0] * s / 2 + 2 * s, hip - 8 * s, d.torso[0] * s - 4 * s, 22 * s, 8 * s); }
  const arm = (a, shade) => { ctx.strokeStyle = css(mul(top, shade)); ctx.lineWidth = d.arm[0] * s; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[2], a[3]); ctx.lineTo(a[4], a[5]); ctx.stroke(); fs(ctx, skin); ctx.beginPath(); ctx.arc(a[4], a[5], d.arm[0] * s * .55, 0, 7); ctx.fill(); };
  if (!P.armsFront) { arm(G.aL, .82); arm(G.aR, .82); }
  // 躯干
  const tw = d.torso[0] * s;
  fs(ctx, top); ctx.beginPath(); ctx.roundRect(cx + lean - tw / 2, sh, tw, hip - sh + 6 * s, [22 * s, 22 * s, 8 * s, 8 * s]); ctx.fill();
  fs(ctx, [0, 0, 0], .12); ctx.fillRect(cx + lean - tw / 2, hip - 10 * s, tw, 10 * s);
  if (!mono) {
    if (P.who == 77) { fs(ctx, col(C('#d9cdb4'))); ctx.fillRect(cx + lean - 5 * s, sh + 4 * s, 10 * s, hip - sh - 6 * s); }                         // 开衫的门襟
    if (P.who == 57) { fs(ctx, col(C('#efe9dd'))); poly(ctx, [cx + lean - 12 * s, sh, cx + lean + 12 * s, sh, cx + lean, sh + 30 * s]); }             // 毛背心里的衬衣领
    if (P.who == 27) { fs(ctx, col(C('#efe9dd'))); rr(ctx, cx + lean - 14 * s, sh, 28 * s, 16 * s, 8 * s); }
    if (P.who == 17) { fs(ctx, mul(top, .74)); rr(ctx, cx + lean - 26 * s, sh + 52 * s, 52 * s, 30 * s, 8 * s); }                                    // 卫衣口袋
    if (P.who == 37) { fs(ctx, mul(top, .74)); for (let k = 0; k < 3; k++) ctx.fillRect(cx + lean - tw / 2, sh + (26 + k * 30) * s, tw, 7 * s); }      // 格子衬衫
  }
  if (P.armsFront) { arm(G.aL, .9); arm(G.aR, .9); }
  // 脖子、头（圆的）
  const hw = d.head[0] * s, hx = G.headC[0], hy = G.top, hcy = hy + headH / 2;
  fs(ctx, mul(skin, .86)); ctx.fillRect(hx - 9 * s, sh - 8 * s, 18 * s, 12 * s);
  const st = d.style;
  if (!mono && st === 'bob') { fs(ctx, hair); rr(ctx, hx - hw / 2 - 5 * s, hy + 4 * s, hw + 10 * s, headH * .98, 22 * s); }
  if (!mono && st === 'buns') { fs(ctx, hair); ctx.beginPath(); ctx.arc(hx - hw * .46, hy + 6 * s, 15 * s, 0, 7); ctx.arc(hx + hw * .46, hy + 6 * s, 15 * s, 0, 7); ctx.fill(); }
  fs(ctx, skin); ctx.beginPath(); ctx.ellipse(hx, hcy, hw / 2, headH / 2, 0, 0, 7); ctx.fill();
  if (!mono) {
    if (d.beard) { fs(ctx, col(d.beard)); ctx.beginPath(); ctx.ellipse(hx, hcy, hw / 2, headH / 2, 0, .12, Math.PI - .12); ctx.fill(); fs(ctx, skin); rr(ctx, hx - 10 * s, hy + headH * .66, 20 * s, 7 * s, 3 * s); }
    if (d.stache) { fs(ctx, col(d.stache)); rr(ctx, hx - 15 * s, hy + headH * .66, 30 * s, 9 * s, 4 * s); }
    fs(ctx, hair);
    const capArc = (k) => { ctx.beginPath(); ctx.ellipse(hx, hcy, hw / 2 + 2 * s, headH / 2 + 2 * s, 0, Math.PI + k, -k); ctx.closePath(); ctx.fill(); };
    if (st === 'curl') { capArc(-.1); for (const [dx, dy, r] of [[-26, -4, 15], [-10, -14, 16], [8, -15, 16], [25, -6, 15], [-34, 10, 11], [34, 10, 11]]) { ctx.beginPath(); ctx.arc(hx + dx * s, hy + (dy + 12) * s, r * s, 0, 7); ctx.fill(); } }
    else if (st === 'fringe') { capArc(-.2); poly(ctx, [hx - hw / 2 - 2 * s, hy + headH * .3, hx + hw * .16, hy + headH * .26, hx - hw * .2, hy + headH * .5, hx - hw / 2 - 2 * s, hy + headH * .56]); }
    else if (st === 'short') capArc(.12);
    else if (st === 'bob') { capArc(-.05); }
    else if (st === 'buns') capArc(.05);
    else if (st === 'bald') { rr(ctx, hx - hw / 2 - 3 * s, hy + headH * .34, 10 * s, headH * .3, 5 * s); rr(ctx, hx + hw / 2 - 7 * s, hy + headH * .34, 10 * s, headH * .3, 5 * s); }
    else if (st === 'cap') { fs(ctx, col(C('#4a5a6a'))); capArc(.2); rr(ctx, hx - hw / 2 - 12 * s, hy + headH * .28, hw * .7, 9 * s, 4 * s); }
    if (d.phones) { fs(ctx, col(d.phones)); rr(ctx, hx - hw / 2 - 9 * s, hy + headH * .36, 13 * s, 26 * s, 6 * s); rr(ctx, hx + hw / 2 - 4 * s, hy + headH * .36, 13 * s, 26 * s, 6 * s); ctx.strokeStyle = css(col(d.phones)); ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.ellipse(hx, hcy, hw / 2 + 5 * s, headH / 2 + 6 * s, 0, Math.PI + .25, -.25); ctx.stroke(); }
    // 眼睛
    fs(ctx, col(C('#221a16'))); const ey = hy + headH * .54, ex = hw * .2, es = 8 * s;
    if (P.sleep) { ctx.fillRect(hx - ex - es * .7, ey, es * 1.4, es * .45); ctx.fillRect(hx + ex - es * .7, ey, es * 1.4, es * .45); }
    else { ctx.fillRect(hx - ex - es / 2, ey - es / 2, es, es); ctx.fillRect(hx + ex - es / 2, ey - es / 2, es, es); }
    if (d.glasses) { ctx.strokeStyle = css(col(C('#2a2624'))); ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.arc(hx - ex, ey, 11 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(hx + ex, ey, 11 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx - ex + 11 * s, ey); ctx.lineTo(hx + ex - 11 * s, ey); ctx.stroke(); }
  }
  ctx.restore();
  return G;
}

// ---------- 小船 ----------
// 原点在船底正中。s=1 时船身宽约 116。o = {tilt 倾斜, mast 桅杆颜色, sail 帆颜色, stripe 帆上的色条, patch 船底那块新木头 0..1, glow, planks 画不画木板缝, tear 帆上的破口}
const SHIP_OLD = { mast: C('#6b4a33'), sail: C('#e4dccb'), stripe: 0, patch: 0, hull: C('#7a5233') };
const SHIP_NEW = { mast: C('#d9bd8d'), sail: C('#fbf8f0'), stripe: 1, patch: 1, hull: C('#7a5233') };
function drawShip(ctx, x, y, s, o) {
  o = o || {}; const mast = o.mast || SHIP_OLD.mast, sail = o.sail || SHIP_OLD.sail, hull = o.hull || SHIP_OLD.hull, dim = o.dim || 0;
  const col = c => dim ? mixc(c, [14, 16, 24], dim) : c;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.tilt || 0); ctx.scale(s, s);
  if (o.glow) { ctx.globalCompositeOperation = 'lighter'; const gr = ctx.createRadialGradient(0, -50, 4, 0, -50, 150); gr.addColorStop(0, css(PAL.gold, .5 * o.glow)); gr.addColorStop(1, css(PAL.gold, 0)); ctx.fillStyle = gr; ctx.fillRect(-150, -200, 300, 300); ctx.globalCompositeOperation = 'source-over'; }
  if (!o.noHull) {                                          // 船身：圆肚子的小木船
    fs(ctx, col(hull)); ctx.beginPath(); ctx.moveTo(-58, -28); ctx.lineTo(62, -28); ctx.quadraticCurveTo(54, 0, 28, 0); ctx.lineTo(-34, 0); ctx.quadraticCurveTo(-54, -4, -58, -28); ctx.closePath(); ctx.fill();
    fs(ctx, col(mul(hull, 1.3))); ctx.fillRect(-58, -28, 120, 5);
    if (o.planks) { fs(ctx, col(mul(hull, .7))); ctx.fillRect(-54, -19, 112, 1.6); ctx.fillRect(-48, -10, 98, 1.6); for (let k = 0; k < 7; k++) ctx.fillRect(-44 + k * 15 + (k % 2) * 5, -23 + (k % 3) * 8 - 4, 1.6, 8); }
    if (o.patch) { fs(ctx, col(mixc(hull, C('#e7c693'), o.patch))); ctx.fillRect(-18, -20, 30, 9); }
    fs(ctx, col(C('#2f6f8a'))); ctx.fillRect(-58, -6, 0, 0);
  }
  if (!o.noMast) { fs(ctx, col(mast)); ctx.fillRect(-3, -140, 6, 114); fs(ctx, col(C('#e9b432'))); poly(ctx, [3, -140, 24, -133, 3, -126]); }
  if (!o.noSail) {                                          // 一面大三角帆 + 一面小前帆
    fs(ctx, col(sail)); poly(ctx, [8, -128, 8, -38, 60, -38]);
    poly(ctx, [-8, -112, -8, -38, -44, -38]);
    fs(ctx, [0, 0, 0], .1); poly(ctx, [8, -128, 8, -38, 18, -38]);
    if (o.stripe) { fs(ctx, col(C('#2f6f8a')), o.stripe); poly(ctx, [8, -70, 8, -56, 49.6, -56, 41.5, -70]); }
    if (o.tear) { fs(ctx, col(C('#2a2320')), o.tear); poly(ctx, [16, -92, 30, -76, 18, -64, 26, -80]); }
  }
  ctx.restore();
}
