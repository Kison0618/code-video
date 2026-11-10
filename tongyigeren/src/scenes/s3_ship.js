// 场景 3（“可那艘船” → “它还是原来那艘船吗？”）
// 镜头 A：船的特写，用粗木板（12px）。桅杆、帆、船底那一块，旧木板一块块飞走，新木板一块块飞来
// 镜头 B：两千年前的老问题。右边是手里这艘；剩下的旧木板一块一块飞到左边，拼出“另一艘”
'use strict';
const S3 = (() => {
  const g = G12, p = g.p, t = TL.s, te = TL.e;
  const A = { x: 960, y: 768, s: 5 };                       // 镜头 A 里船的位置（都落在木板格子上）
  const BR = { x: 1392, y: 768, s: 4 }, BL = { x: 528, y: 768, s: 4 };   // 镜头 B：右边 / 左边的船
  const HULL_NEW = C('#a8743f');
  const tB = () => t('d6') - .1;                             // 镜头 A → B

  function backdrop(ctx, cx) {
    fs(ctx, C('#07080d')); ctx.fillRect(0, 0, W, H);
    let gr = ctx.createRadialGradient(cx, 520, 40, cx, 520, 900); gr.addColorStop(0, 'rgba(96,66,40,.5)'); gr.addColorStop(.6, 'rgba(40,30,26,.2)'); gr.addColorStop(1, 'rgba(7,8,13,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    // 桌面
    gr = ctx.createLinearGradient(0, 768, 0, H); gr.addColorStop(0, '#5a3f2a'); gr.addColorStop(.12, '#3c2a1e'); gr.addColorStop(1, '#120d0b');
    ctx.fillStyle = gr; ctx.fillRect(0, 768, W, H - 768);
    fs(ctx, [255, 220, 170], .16); ctx.fillRect(0, 768, W, 12);
    gr = ctx.createLinearGradient(0, 0, W, 0); gr.addColorStop(0, 'rgba(7,8,13,.85)'); gr.addColorStop(.25, 'rgba(7,8,13,0)'); gr.addColorStop(.75, 'rgba(7,8,13,0)'); gr.addColorStop(1, 'rgba(7,8,13,.85)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }
  function shadow(ctx, o) { fs(ctx, [0, 0, 0], .4); ctx.beginPath(); ctx.ellipse(o.x, o.y + 10, 62 * o.s, 12, 0, 0, 7); ctx.fill(); }

  // ---------- 镜头 A ----------
  function paintA(ctx, time, ver) {
    backdrop(ctx, A.x); shadow(ctx, A);
    const tear = ver === 'old' ? seg(time, TL.at('d3', '破'), TL.at('d3', '破') + .15) : 0;
    drawShip(ctx, A.x, A.y, A.s, Object.assign({}, ver === 'old' ? SHIP_OLD : SHIP_NEW, { planks: 1, tear }));
    if (ver === 'old') {                                     // 船底的裂缝
      const k = seg(time, TL.at('d4', '裂'), TL.at('d4', '裂') + .25);
      if (k > 0) { ctx.strokeStyle = '#120c08'; ctx.lineWidth = 7; ctx.lineJoin = 'miter'; ctx.beginPath(); const pts = [[-16, -21], [-8, -15], [-12, -12], [2, -8], [10, -13]]; pts.forEach((q, i) => { if (i / (pts.length - 1) <= k + .01) ctx[i ? 'lineTo' : 'moveTo'](A.x + q[0] * A.s, A.y + q[1] * A.s); }); ctx.stroke(); }
    }
  }
  // 船占了哪些木板、每块属于哪个零件、什么时候被拿走 / 换上
  let cellsA = null;
  function buildA() {
    const x = g.tx[0]; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, g.gw, g.gh); x.setTransform(1 / p, 0, 0, 1 / p, 0, 0);
    drawShip(x, A.x, A.y, A.s, SHIP_OLD);
    const m = x.getImageData(0, 0, g.gw, g.gh).data, out = [];
    const TB = TL.at('d2', '断'), TM = TL.at('d2', '换了'), TT = TL.at('d3', '破'), TS = TL.at('d3', '换了'), TP = TL.at('d4', '补了');
    for (let iy = 0; iy < g.gh; iy++) for (let ix = 0; ix < g.gw; ix++) {
      if (m[(iy * g.gw + ix) * 4 + 3] < 110) continue;
      const lx = ((ix + .5) * p - A.x) / A.s, ly = ((iy + .5) * p - A.y) / A.s, r = hash2(ix, iy), r2 = hash2(ix + 91, iy + 17);
      let part = null, tOut, tIn;
      if (ly < -24 && (Math.abs(lx) <= 4.2 || (lx > 3 && lx < 23 && ly < -124))) {             // 桅杆（连同小旗）
        part = 'mast'; const h = sat((-ly - 24) / 114);
        tOut = h > .45 ? TB + (1 - h) * .25 + r * .08 : TM - .28 + r * .12; tIn = TM + .04 + h * .42 + r * .05;
      } else if (ly < -37.5) {                                                                // 帆
        part = 'sail'; const d = Math.hypot(lx - 20, ly + 72) / 110;
        tOut = TT + .1 + sat(d) * .5 + r * .08; tIn = TS + .02 + sat((-37 - ly) / 92) * .2 + sat((lx + 52) / 104) * .3 + r * .06;
      } else if (lx > -18.5 && lx < 12.5 && ly > -19.5 && ly < -10.5) {                         // 船底那一块
        part = 'patch'; tOut = TP - .12 + r * .1; tIn = TP + .22 + r * .14;
      }
      if (part) out.push({ ix, iy, i: iy * g.gw + ix, part, tOut, tIn, r, r2 });
    }
    return out;
  }
  function drawA(ctx, time) {
    if (!cellsA) cellsA = buildA();
    g.reset();
    const inK = seg(time, t('d1'), t('d1') + .55);
    paintA(g.begin('a'), time, 'old'); paintA(g.begin('b'), time, 'new');
    const sa = g.sample('a'), sb = g.sample('b'), fly = [];
    const flash = pulse(time, TL.at('d5', '不是原来'), .12, .7);
    for (const c of cellsA) {
      const x = c.ix * p, y = c.iy * p;
      if (time >= c.tIn) { g.phase[c.i] = 1; g.gain[c.i] = Math.max(0, 1 - (time - c.tIn) / .35) * .7 + flash * .5; }
      else if (time >= c.tOut) g.hide[c.i] = 1;
      // 旧木板：飞出左边
      if (time >= c.tOut && time < c.tOut + 1.5) { const o = c.i * 4; fly.push({ x, y, tx: -160 - c.r2 * 420, ty: y + (c.r - .5) * 360 + 80, t0: c.tOut, dur: 1.0 + c.r * .5, arc: 90 + c.r2 * 190, spin: .6 + c.r, c: [sa[o], sa[o + 1], sa[o + 2]], s: p - g.gap, fade: 1, ease: E.in }); }
      // 新木板：从右边飞来，落进空位
      const t0 = c.tIn - .55;
      if (time >= t0 && time < c.tIn) { const o = c.i * 4; fly.push({ x: x + (c.r - .5) * 420, y: -60 - c.r2 * 260, tx: x, ty: y, t0, dur: .55, arc: 0, spin: .5, c: [sb[o], sb[o + 1], sb[o + 2]], s: p - g.gap, lit: .5, ease: E.out }); }
    }
    if (inK < 1) g.fromBlack(inK, { ox: A.x / p, oy: 40 });
    const outK = seg(time, tB() - .4, tB());
    if (outK > 0) g.toBlack(outK);
    const img = g.present({});
    drawLoose(g.ox, fly, time);
    Post.blit(ctx, img, .42, { z: lerp(1, 1.035, seg(time, t('d1'), tB())), x: 960, y: 520 });
    Post.dust(ctx, time, { a: .7 });
    // 标签：三个零件
    const rows = [['桅杆', 'd2', '断', '换了', '换了', [A.x + 20, A.y - 430]], ['帆', 'd3', '破', '换了', '换了', [A.x + 190, A.y - 260]], ['船底', 'd4', '裂', '补了', '新木头', [A.x + 70, A.y - 76]]];
    const oa = 1 - outK;
    rows.forEach((r, k) => {
      const t0 = TL.at(r[1], r[0]), t1 = TL.at(r[1], r[3]), a = seg(time, t0 - .05, t0 + .25) * oa, y = 380 + k * 120, x = 1380;
      if (a <= 0) return;
      const done = seg(time, t1, t1 + .2);
      ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 12;
      ctx.font = FONT.serif(58, 700); ctx.fillStyle = css(PAL.ink); ctx.fillText(r[0], x, y); const w = ctx.measureText(r[0]).width;
      ctx.font = FONT.sans(36); ctx.fillStyle = css(mixc(PAL.dim, PAL.dim, 1), 1 - done * .5); const st = r[2] + '过'; ctx.fillText(st, x + w + 28, y + 4); const w2 = ctx.measureText(st).width;
      if (done > 0) { ctx.globalAlpha = a * done; ctx.fillStyle = css(PAL.hot); ctx.fillRect(x + w + 24, y + 2, (w2 + 8) * done, 4); ctx.font = FONT.serif(46, 900); ctx.fillText(r[4], x + w + w2 + 56, y + 2); }
      ctx.restore();
      HUD.line(ctx, x - 24, y, r[5][0], (r[5][1] - 520) * 1.02 + 540, seg(time, t0 + .1, t0 + .5), { a: .5 * a, lw: 2, dash: [8, 8] });
    });
    counter(ctx, time, oa);
    return {};
  }
  // 船上那颗金钉（最后一样“原来的东西”）：说到“早就不是原来那一艘”，它也灭了
  function counter(ctx, time, a) {
    const t0 = TL.at('d5', '不是原来'), hit = seg(time, t0, t0 + .3), aa = a * seg(time, t('d1') + .3, t('d1') + .8) * (1 - seg(time, t0 + .5, t0 + 1.1));
    if (aa <= 0) return;
    const x = A.x + 190, y = 250 + hit * 60 + Math.sin(time * 2) * 3, r = 16;
    ctx.save(); ctx.globalAlpha = aa; ctx.translate(x, y); ctx.rotate(Math.PI / 4 + hit * 1.4);
    ctx.fillStyle = 'rgba(6,7,12,.8)'; ctx.fillRect(-r - 5, -r - 5, r * 2 + 10, r * 2 + 10); ctx.fillStyle = css(mixc(PAL.gold, PAL.hot, hit)); ctx.fillRect(-r, -r, r * 2, r * 2); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-r, -r, r * 2, 6);
    ctx.restore();
    HUD.tag(ctx, x + 44, 250, '原来的东西', { a: aa * (1 - hit), px: 30, col: PAL.gold });
  }

  // ---------- 镜头 B ----------
  let cellsB = null;
  function buildB() {
    const x = g.tx[0]; x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, g.gw, g.gh); x.setTransform(1 / p, 0, 0, 1 / p, 0, 0);
    drawShip(x, BR.x, BR.y, BR.s, { noMast: 1, noSail: 1 });
    const m = x.getImageData(0, 0, g.gw, g.gh).data, out = [];
    for (let iy = 0; iy < g.gh; iy++) for (let ix = 0; ix < g.gw; ix++) if (m[(iy * g.gw + ix) * 4 + 3] >= 110) out.push({ ix, iy, i: iy * g.gw + ix, r: hash2(ix, iy), r2: hash2(ix + 5, iy + 77) });
    // “一块一块”：从船头到船尾，带一点随机
    out.sort((a, b) => (a.ix + a.r * 9) - (b.ix + b.r * 9));
    const T0 = TL.at('d7', '木板') - .1, T1 = te('d7') + .5;
    out.forEach((c, k) => { c.tOut = T0 + (T1 - T0) * k / out.length; });
    return out;
  }
  function paintB(ctx, time, ver) {
    backdrop(ctx, 960); shadow(ctx, BR); shadow(ctx, BL);
    // 左边：换下来的旧桅杆、旧帆已经摆在那儿了，船身等着一块块拼过来
    drawShip(ctx, BL.x, BL.y, BL.s, Object.assign({}, SHIP_OLD, { noHull: 1, tear: 1 }));
    drawShip(ctx, BR.x, BR.y, BR.s, Object.assign({}, SHIP_NEW, { planks: 1, hull: ver === 'new' ? HULL_NEW : SHIP_OLD.hull, patch: ver === 'new' ? 0 : 1 }));
  }
  function drawB(ctx, time) {
    if (!cellsB) cellsB = buildB();
    g.reset();
    const inK = seg(time, tB(), tB() + .6);
    paintB(g.begin('a'), time, 'old'); paintB(g.begin('b'), time, 'new');
    const sa = g.sample('a'), fly = [], dx = (BL.x - BR.x);
    for (const c of cellsB) {
      if (time < c.tOut) continue;
      g.phase[c.i] = seg(time, c.tOut, c.tOut + .3);
      const o = c.i * 4, col = [sa[o], sa[o + 1], sa[o + 2]];
      fly.push({ x: c.ix * p, y: c.iy * p, tx: c.ix * p + dx, ty: c.iy * p, t0: c.tOut, dur: .9 + c.r2 * .35, arc: 150 + c.r * 170, spin: 1, c: col, s: p - g.gap, lit: .35, cell: p });
    }
    if (inK < 1) g.fromBlack(inK);
    const tE = t('e1') - .1, outK = seg(time, tE - .45, tE);
    if (outK > 0) g.toBlack(outK);
    const img = g.present({});
    if (outK <= 0) drawLoose(g.ox, fly, time);
    Post.blit(ctx, img, .42);
    Post.dust(ctx, time, { a: .7 });
    // 标签
    const oa = 1 - seg(outK, 0, .5), a0 = seg(time, tB() + .5, tB() + 1) * oa;
    ctx.save(); ctx.globalAlpha = a0 * (1 - seg(time, t('d8') - .3, t('d8'))); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 12;
    ctx.font = FONT.serif(64, 900); ctx.fillStyle = css(PAL.ink); ctx.fillText('忒修斯之船', W / 2, 190);
    ctx.fillStyle = css(PAL.gold); ctx.fillRect(W / 2 - 40, 240, 80, 4);
    ctx.font = FONT.sans(30); ctx.fillStyle = css(PAL.ink, .8); ctx.fillText('两千年前 · 希腊', W / 2, 280);
    ctx.restore();
    const done = seg(time, te('d7'), te('d7') + .6);
    HUD.tag(ctx, BL.x, 860, '换下来的旧木板', { a: seg(time, TL.at('d7', '木板'), TL.at('d7', '木板') + .4) * oa, align: 'center', px: 34 });
    HUD.tag(ctx, BR.x, 860, '一块一块换过的', { a: seg(time, TL.at('d7', '全换掉'), TL.at('d7', '全换掉') + .4) * oa, align: 'center', px: 34 });
    // “它还是原来那艘船吗？”：取景框在两艘船之间来回跳
    const q0 = t('d8'), qa = seg(time, q0, q0 + .3) * oa;
    if (qa > 0) {
      const sw = Math.floor((time - q0) / .62) % 2, bx = sw ? BR.x : BL.x;
      HUD.bracket(ctx, bx - 270, 190, 540, 640, seg(time, q0 + Math.floor((time - q0) / .62) * .62, q0 + Math.floor((time - q0) / .62) * .62 + .25), { len: 46, lw: 6, a: qa });
      HUD.big(ctx, '？', W / 2, 560, 190, { a: qa * E.out(seg(time, TL.at('d8', '原来'), TL.at('d8', '原来') + .3)), hl: PAL.gold });
    }
    return {};
  }
  SCENES.push({ name: 'shipA', t0: t('d1'), draw: drawA });
  SCENES.push({ name: 'shipB', t0: tB(), draw: drawB });
  return {};
})();
