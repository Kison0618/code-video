// 场景 3（“可那艘船” → “它还是原来那艘船吗？”）
// 镜头 A：桌上的船。桅杆断了换一根，帆破了换一面，船底裂了换一块木板——每一片都是单独的一张纸
// 镜头 B：两千年前的老问题。右边的船，木板一块一块换成新的；换下来的旧木板飞到左边，和旧桅杆、旧帆拼成另一艘
'use strict';
const S3 = (() => {
  const t = TL.s, te = TL.e;
  const A = { x: 760, y: 806, s: 4.7 }, BR = { x: 1390, y: 806, s: 3.5 }, BL = { x: 530, y: 806, s: 3.5 };
  const tB = () => t('d6') - .1, PATCH = 9;                    // 镜头 A → B 的时刻；船底裂的是第几块木板
  function backdrop(ctx) {
    shOff(ctx); fs(ctx, C('#21444c')); ctx.fillRect(0, 0, W, H);
    let g = ctx.createRadialGradient(W / 2, 470, 60, W / 2, 470, 1050); g.addColorStop(0, 'rgba(120,190,180,.34)'); g.addColorStop(1, 'rgba(16,30,36,.5)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    shOn(ctx, 1.6); g = ctx.createLinearGradient(0, 806, 0, H); g.addColorStop(0, '#9a6a44'); g.addColorStop(.1, '#7d5235'); g.addColorStop(1, '#4a2f20'); ctx.fillStyle = g; ctx.fillRect(-40, 806, W + 80, H); shOff(ctx);
    fs(ctx, [255, 230, 190], .16); ctx.fillRect(0, 806, W, 8);
  }
  // 在船自己的坐标里画（原点在船底正中）
  const frame = (ctx, F, fn) => { ctx.save(); ctx.translate(F.x, F.y); ctx.rotate(F.r || 0); ctx.scale(F.s, F.s); const z = ctx._z; ctx._z = (z || 1) * F.s; fn(ctx); ctx._z = z; ctx.restore(); };
  const sh = (ctx, k) => shOn(ctx, (k === undefined ? 1 : k) * 2.2 / (ctx._z || 1));
  const piece = (ctx, o, fn) => { ctx.save(); ctx.globalAlpha *= o.a === undefined ? 1 : sat(o.a); ctx.translate((o.px || 0) + (o.dx || 0), (o.py || 0) + (o.dy || 0)); ctx.rotate(o.r || 0); ctx.scale(o.sx === undefined ? 1 : o.sx, o.sy === undefined ? 1 : o.sy); ctx.translate(-(o.px || 0), -(o.py || 0)); fn(ctx); ctx.restore(); };
  const rim = (ctx, col) => { sh(ctx, .5); fs(ctx, lite(col, .2)); rr(ctx, -66, -35, 136, 8, 4); shOff(ctx); };
  const hullShadow = ctx => { fs(ctx, [20, 12, 8], .3); ctx.beginPath(); ctx.ellipse(2, 3, 66, 5, 0, 0, 7); ctx.fill(); };

  // ---------- 镜头 A ----------
  function shipA(ctx, time, F) {
    const TB = TL.at('d2', '断'), TM = TL.at('d2', '换了'), TT = TL.at('d3', '破'), TS = TL.at('d3', '换了'), TC = TL.at('d4', '裂'), TP = TL.at('d4', '补了');
    frame(ctx, F, c => {
      hullShadow(c);
      // 旧桅杆：断成两截，上半截歪倒掉下去，下半截被拔走
      const u = seg(time, TB, TB + 1.0), v = seg(time, TM - .35, TM);
      if (u < 1) piece(c, { px: 0, py: -86, r: E.in(u) * 1.5, dx: E.in(u) * 26, dy: u * u * 120, a: 1 - seg(u, .7, 1) }, k => { k.beginPath(); k.rect(-40, -170, 100, 84); k.clip(); sh(k, .6 + u * 2); shipMast(k, SHIP_OLD.mast); shipFlag(k); shOff(k); });
      if (v < 1) { c.save(); c.translate(-E.in(u) * 3, E.in(v) * 70); c.rotate(-seg(u, 0, .4) * .06); c.globalAlpha *= 1 - seg(v, .6, 1); c.beginPath(); c.rect(-20, -86, 40, 60); c.clip(); sh(c, .6); shipMast(c, SHIP_OLD.mast); shOff(c); c.restore(); }
      // 新桅杆：从上面落下来
      const w = seg(time, TM, TM + .5);
      if (w > 0) piece(c, { dy: -(1 - E.out(w)) * 150, a: w * 4 }, k => { sh(k, .6 + (1 - w) * 1.5); shipMast(k, SHIP_NEW.mast); shipFlag(k); shOff(k); });
      // 旧帆：破了，被揭下来
      const tear = seg(time, TT, TT + .15), pu = seg(time, TS - .1, TS + .6), sag = env(time, TB, TB + .2, TM, TM + .3) * 5;
      if (pu < 1) for (const [which, px, dir] of [['jib', -9, -1], ['main', 9, 1]]) piece(c, { px, py: -120, r: dir * E.in(pu) * .8, dx: dir * pu * 60, dy: sag + pu * pu * 120, a: 1 - seg(pu, .5, 1) }, k => { sh(k, .6 + pu * 2); shipSail(k, which, SHIP_OLD.sail, { tear: which === 'main' ? tear : 0 }); shOff(k); });
      // 新帆：从桅杆往外展开
      const nu = seg(time, TS + .15, TS + .75);
      if (nu > 0) for (const [which, px] of [['jib', -9], ['main', 9]]) piece(c, { px, py: -38, sx: Math.max(.02, E.back(nu)) }, k => { sh(k, .6); shipSail(k, which, SHIP_NEW.sail, { stripe: 1 }); shOff(k); });
      // 船身
      sh(c, .8); fs(c, SHIP_OLD.hull); hullPath(c); c.fill(); shOff(c);
      const po = seg(time, TP - .1, TP + .5), pn = seg(time, TP + .25, TP + .75);
      for (let i = 0; i < PLANKS.length; i++) if (i !== PATCH) shipPlank(c, i, SHIP_OLD.hull);
      const r = PLANKS[PATCH], cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2;
      fs(c, C('#2a1a12')); c.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]);                                   // 木板被抽走以后的空位
      if (pn > 0) piece(c, { px: cx, py: cy, sx: lerp(1.5, 1, E.out(pn)), sy: lerp(1.5, 1, E.out(pn)), dx: (1 - E.out(pn)) * 40, dy: -(1 - E.out(pn)) * 30, a: pn * 3 }, k => shipPlank(k, PATCH, mixc(HULL_NEW, [255, 240, 200], (1 - pn) * .5)));
      if (po < 1) piece(c, { px: cx, py: cy, sx: 1 + po * .6, sy: 1 + po * .6, dx: -E.out(po) * 64, dy: -E.out(po) * 30 + po * po * 30, r: -po * .8, a: 1 - seg(po, .6, 1) }, k => { shipPlank(k, PATCH, SHIP_OLD.hull); const ck = seg(time, TC, TC + .25); if (ck > 0) { k.strokeStyle = '#1c110b'; k.lineWidth = 1.5; k.lineJoin = 'miter'; k.beginPath(); const pts = [[-14, -10], [-8, -6], [-11, -4], [0, -1], [6, -5], [10, 0]]; pts.forEach((q, i) => { if (i / (pts.length - 1) <= ck + .01) k[i ? 'lineTo' : 'moveTo'](q[0], q[1]); }); k.stroke(); } });
      rim(c, SHIP_OLD.hull);
    });
  }
  function drawA(ctx, time) {
    backdrop(ctx);
    const push = seg(time, t('d1'), tB()), F = { x: A.x, y: A.y, s: A.s * (1 + push * .03) };
    shipA(ctx, time, F);
    // 右边三行：零件 · 出过什么事 · 换了
    const rows = [['桅杆', 'd2', '断过', '换了', '换了'], ['帆', 'd3', '破过', '换了', '换了'], ['船底', 'd4', '裂过', '补了', '新木头']];
    rows.forEach((r, k) => {
      const t0 = TL.at(r[1], r[0]), t1 = TL.at(r[1], r[3]), a = seg(time, t0 - .05, t0 + .25); if (a <= 0) return;
      const x = 1250, y = 330 + k * 150, done = seg(time, t1, t1 + .25);
      HUD.text(ctx, x, y, r[0], { a, serif: 1, w: 900, px: 84 });
      ctx.save(); ctx.font = FONT.serif(84, 900); const w = ctx.measureText(r[0]).width; ctx.restore();
      HUD.label(ctx, x + w + 34, y + 6, r[2], { a: a * (1 - done * .55), px: 40, tone: 'dark' });
      HUD.label(ctx, x + w + 34 + 136, y + 6, r[4], { a: done, px: 40, tone: 'hot' });
    });
    // “它也早就不是原来那一艘”：三处换过的地方各亮一下
    const fl = pulse(time, TL.at('d5', '不是原来'), .15, .9);
    if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (const [lx, ly, r] of [[0, -92, 150], [34, -76, 200], [-2, -5, 110]]) { const x = F.x + lx * F.s, y = F.y + ly * F.s, g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, css(PAL.gold, .5 * fl)); g.addColorStop(1, css(PAL.gold, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); } ctx.restore(); }
    veil(ctx, fadeIO(time, t('d1') - .03, tB(), .35));
    return {};
  }

  // ---------- 镜头 B ----------
  function drawB(ctx, time) {
    backdrop(ctx);
    const inA = seg(time, tB(), tB() + .35), T0 = TL.at('d7', '木板') - .2, T1 = te('d7') + .5, DUR = .95;
    const order = [0, 4, 8, 1, 5, 9, 2, 6, 10, 3, 7], tOut = i => T0 + (T1 - T0 - DUR) * order.indexOf(i) / 10;
    // 左边：旧桅杆、旧帆先摆好（它们是刚才换下来的），等着船身一块块拼过来
    const pin = E.out(seg(time, tB() + .3, tB() + 1.1));
    frame(ctx, BL, c => {
      hullShadow(c);
      c.save(); c.globalAlpha = pin; c.translate(0, -(1 - pin) * 60); sh(c, .6); shipMast(c, SHIP_OLD.mast); shipFlag(c); shipSail(c, 'jib', SHIP_OLD.sail); shipSail(c, 'main', SHIP_OLD.sail, { tear: 1 }); shOff(c); c.restore();
      c.save(); c.globalAlpha = pin * .5; c.strokeStyle = css(PAL.ink); c.lineWidth = .7; c.setLineDash([3, 3]); hullPath(c); c.stroke(); c.restore();
      let n = 0; for (let i = 0; i < PLANKS.length; i++) if (time >= tOut(i) + DUR) { shipPlank(c, i, SHIP_OLD.hull); n++; }
      if (n === PLANKS.length) rim(c, SHIP_OLD.hull);
    });
    // 右边：手里这艘
    frame(ctx, BR, c => {
      hullShadow(c);
      sh(c, .6); shipMast(c, SHIP_NEW.mast); shipFlag(c); shipSail(c, 'jib', SHIP_NEW.sail); shipSail(c, 'main', SHIP_NEW.sail, { stripe: 1 }); shOff(c);
      sh(c, .8); fs(c, C('#2a1a12')); hullPath(c); c.fill(); shOff(c);
      for (let i = 0; i < PLANKS.length; i++) {
        const k = seg(time, tOut(i) + .12, tOut(i) + .5), r = PLANKS[i];
        if (time < tOut(i)) shipPlank(c, i, i === PATCH ? HULL_NEW : SHIP_OLD.hull);
        else if (k > 0) piece(c, { px: (r[0] + r[2]) / 2, py: (r[1] + r[3]) / 2, sx: lerp(1.5, 1, E.out(k)), sy: lerp(1.5, 1, E.out(k)), dy: -(1 - E.out(k)) * 26, a: k * 3 }, q => shipPlank(q, i, mixc(HULL_NEW, [255, 240, 200], (1 - k) * .5)));
      }
      rim(c, time > T1 ? HULL_NEW : SHIP_OLD.hull);
    });
    // 飞在半路的旧木板
    for (let i = 0; i < PLANKS.length; i++) {
      const u = seg(time, tOut(i), tOut(i) + DUR); if (u <= 0 || u >= 1) continue;
      const e = E.io(u), r = PLANKS[i];
      frame(ctx, { x: lerp(BR.x, BL.x, e), y: BR.y - Math.sin(Math.PI * u) * (230 + (i % 3) * 60), s: BR.s * (1 + Math.sin(Math.PI * u) * .25) }, c => piece(c, { px: (r[0] + r[2]) / 2, py: (r[1] + r[3]) / 2, r: Math.sin(Math.PI * u) * (i % 2 ? .9 : -.9) }, q => { q.save(); q.translate(1.5, 2.5); q.globalAlpha *= .3; shipPlank(q, i, [20, 12, 8]); q.restore(); shipPlank(q, i, i === PATCH ? HULL_NEW : SHIP_OLD.hull); }));
    }
    // 标题
    const ta = seg(time, tB() + .4, tB() + .9) * (1 - seg(time, t('d8') - .35, t('d8') - .05));
    HUD.big(ctx, '忒修斯之船', W / 2, 190, 92, { a: ta });
    if (ta > 0) { ctx.fillStyle = css(PAL.gold, ta); ctx.fillRect(W / 2 - 50, 226, 100, 6); }
    HUD.text(ctx, W / 2, 284, '两千年前 · 希腊', { a: ta, align: 'center', px: 34 });
    HUD.label(ctx, BL.x, 880, '换下来的旧木板', { a: seg(time, T0 + .4, T0 + .8), align: 'center', px: 38 });
    HUD.label(ctx, BR.x, 880, '一块一块换过的', { a: seg(time, TL.at('d7', '全换掉'), TL.at('d7', '全换掉') + .4), align: 'center', px: 38 });
    // “它还是原来那艘船吗？”：取景框在两艘船之间来回跳
    const q0 = t('d8'), qa = seg(time, q0, q0 + .3);
    if (qa > 0) {
      const n = Math.floor((time - q0) / .66), bx = n % 2 ? BR.x : BL.x;
      HUD.bracket(ctx, bx - 280, 250, 560, 590, seg(time, q0 + n * .66, q0 + n * .66 + .25), { len: 56, lw: 8, a: qa });
      HUD.big(ctx, [{ s: '？', col: PAL.gold }], W / 2, 600, 220, { a: qa * E.out(seg(time, TL.at('d8', '原来'), TL.at('d8', '原来') + .3)) });
    }
    veil(ctx, fadeIO(time, tB(), t('e1') - .12, .35));
    return {};
  }
  SCENES.push({ name: 'shipA', t0: t('d1') - .03, draw: drawA });
  SCENES.push({ name: 'shipB', t0: tB(), draw: drawB });
  return {};
})();
