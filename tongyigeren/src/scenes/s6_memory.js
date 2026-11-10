// 场景 6（“回到刚才那个晚上” → “被改的机会也最多”）
// 前半：九张词牌回来。有没有“睡觉”？——逐张查，没有。然后几片纸屑从别的牌上飘下来，自己拼出第十张“睡觉”
// 后半：那个晚上像一张照片被撕成碎片，再拼回去——每拼一次，就有几样东西不一样，越拼越快
'use strict';
const S6 = (() => {
  const t = TL.s, te = TL.e, W4 = S4.WORDS, GRID = S4.GRID;
  const GX = GRID.x + (GRID.w * 3 + GRID.gap * 2) / 2, GHOST = [GX, GRID.y + 3 * (GRID.h + GRID.gap) + 70], QX = 620;
  // 每回忆一次，被改掉的东西
  const POOL = {
    wall: ['#e3b48c', '#8f93c9', '#cdb86a', '#b08fc0', '#86b1a2'], curtain: ['#4c8b69', '#d9b23a', '#c8463a', '#3a6a9a', '#e6e0d2'], quilt: ['#35518c', '#c8563e', '#e6dccb', '#3a8a7a', '#8a5aa0'],
    rug: ['#c66f4b', '#3f8a5a', '#d9667a', '#efe2c6', '#3e5f8f'], art: ['peak', 'light', 'abstract', 'photo', 'band'], lamp: ['shroom', 'bank', 'globe', 'cone', 'arm'], chair: ['stool', 'wood', 'stool', 'wood', 'stool'], toy: ['robot', 'bear', 'plant', 'clock', 'bear'],
  };
  const KEYS = ['quilt', 'art', 'wall', 'toy', 'rug', 'curtain', 'lamp', 'chair'];
  function variant(n) {
    const S = Object.assign({}, ERA.night);
    for (let k = 0; k < Math.min(KEYS.length, n * 2); k++) { const key = KEYS[k], list = POOL[key], v = list[1 + Math.floor(hash(n * 17 + k * 5) * (list.length - 1))]; S[key] = v[0] === '#' ? C(v) : v; }
    return S;
  }
  // 重拼的时间表：[开始, 时长]
  function cycles() {
    const out = [], a = te('g11') - .3; out.push([a, te('g12') + .25 - a]);
    out.push([TL.at('g15', '重拼') - .55, 1.5]);
    let x = t('g16') + .15, d = .95; const end = te('g17') + .5;
    while (x + d * .7 < end) { out.push([x, d]); x += d; d = Math.max(.36, d * .8); }
    return out;
  }
  const NUM = [1, 2, 3, 5, 9, 16, 30, 57, 108, 212, 420, 836, 1650, 3200];
  // 碎片：5×3 的格子，里面的交点错开一点，撕出来不是整齐的方块
  const FR = (() => {
    const nx = 5, ny = 3, P = [], out = [];
    for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) P.push([i * W / nx + (i > 0 && i < nx ? (hash(i * 7 + j * 13) - .5) * 150 : 0), j * H / ny + (j > 0 && j < ny ? (hash(i * 11 + j * 5 + 3) - .5) * 110 : 0)]);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) { const q = [P[j * (nx + 1) + i], P[j * (nx + 1) + i + 1], P[(j + 1) * (nx + 1) + i + 1], P[(j + 1) * (nx + 1) + i]]; out.push({ q, c: [(q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4], h: hash(i * 31 + j * 17 + 5), h2: hash(i * 3 + j * 29 + 1) }); }
    return out;
  })();
  const nightOpts = (time, n) => S4.opts(time, { lampOn: 0, eyes: 0, moon: 1, S: variant(n) });

  function draw(ctx, time) {
    const CY = cycles();
    let ci = -1; CY.forEach((q, i) => { if (time >= q[0]) ci = i; });
    const cyc = ci >= 0 ? CY[ci] : null, u = cyc ? sat((time - cyc[0]) / cyc[1]) : 1, apart = cyc && u < 1 ? Math.pow(Math.sin(Math.PI * u), .7) : 0;
    if (apart > 0.001) {
      const A = Layer.get(1); camApply(A, ROOMCAM); paintRoom(A, nightOpts(time, ci)); const B = Layer.get(2); camApply(B, ROOMCAM); paintRoom(B, nightOpts(time, ci + 1));
      camReset(ctx); shOff(ctx); fs(ctx, C('#15111c')); ctx.fillRect(0, 0, W, H);
      const sorted = FR.slice().sort((a, b) => a.h - b.h);
      for (const f of sorted) {
        const m = apart * (.5 + f.h * .8), dx = (f.c[0] - W / 2) * .2 * m + (f.h2 - .5) * 90 * apart, dy = (f.c[1] - H / 2) * .24 * m + (f.h - .5) * 70 * apart, rot = (f.h2 - .5) * .34 * apart, useB = u > .32 + f.h * .36;
        ctx.save(); ctx.translate(f.c[0] + dx, f.c[1] + dy); ctx.rotate(rot); ctx.translate(-f.c[0], -f.c[1]);
        ctx.beginPath(); f.q.forEach((p, i) => ctx[i ? 'lineTo' : 'moveTo'](p[0], p[1])); ctx.closePath();
        shOn(ctx, 1 + apart * 2.5); fs(ctx, C('#f1e9d8')); ctx.fill(); shOff(ctx);
        ctx.save(); ctx.clip(); ctx.drawImage((useB ? B : A).canvas, 0, 0); ctx.restore();
        ctx.strokeStyle = css(C('#f1e9d8'), sat(apart * 3)); ctx.lineWidth = 7; ctx.lineJoin = 'round'; ctx.stroke();
        ctx.restore();
      }
    } else { camApply(ctx, ROOMCAM); paintRoom(ctx, nightOpts(time, ci + 1)); camReset(ctx); }

    // ---------- 前半：九张词牌 ----------
    const unfold = E.io(seg(time, t('g2') - .35, t('g2') + .25)), wa = 1 - seg(time, t('g11') - .25, t('g11') + .15);
    if (wa > 0) {
      const dimA = env(time, TL.at('g3', '睡觉') - .1, TL.at('g3', '睡觉') + .3, t('g5') - .4, t('g5')) * .34 + env(time, t('g8') - .1, t('g8') + .3, t('g10') - .4, t('g10')) * .3;
      veil(ctx, dimA, C('#0d0a14'));
      if (unfold < 1) drawMemCard(ctx, W - 64 - 250, 60, 1, (1 - unfold) * seg(time, t('g1') - .1, t('g1') + .3));
      if (unfold > 0) {
        const has = ['床', '枕头', '做梦', '打呼'], cx = GRID.x + 306, cy = GRID.y + 156;
        ctx.save(); ctx.translate(lerp(W - 64 - 125, cx, unfold), lerp(135, cy, unfold)); ctx.scale(.38 + unfold * .62, .38 + unfold * .62); ctx.translate(-cx, -cy);
        S4.drawWords(ctx, time, { a: wa * seg(unfold, .3, 1), all: 1, hl: k => { const j = has.indexOf(W4[k]); return j < 0 ? 0 : seg(time, TL.at('g5', has[j]) - .03, TL.at('g5', has[j]) + .12) * (1 - seg(time, t('g6') - .2, t('g6') + .1)); } });
        ctx.restore();
      }
      // “偏偏没有‘睡觉’”：取景框把九张牌挨个查一遍
      const sk = seg(time, t('g6') - .1, te('g6') + .1);
      if (sk > 0 && sk < 1) { const k = Math.min(8, Math.floor(sk * 9)), p = S4.slot(k); HUD.bracket(ctx, p[0] - GRID.w / 2 - 6, p[1] - GRID.h / 2 - 6, GRID.w + 12, GRID.h + 12, 1, { len: 26, lw: 6, a: wa, col: PAL.hot }); }
      HUD.label(ctx, GHOST[0], GHOST[1], '“睡觉”：0 张', { a: seg(time, te('g6') - .2, te('g6') + .1) * (1 - seg(time, t('g8') - .3, t('g8'))) * wa, align: 'center', px: 44, tone: 'hot' });
      // “是你的大脑自己放进去的”：纸屑从别的牌上飘下来，拼出第十张
      const fill = E.io(seg(time, TL.at('g10', '自己') - .2, te('g10') + .1));
      if (fill > 0) {
        ctx.save();
        for (let k = 0; k < 54; k++) { const from = S4.slot(k % 9), t0 = hash(k * 3) * .55, kk = sat((fill - t0) / .45); if (kk <= 0 || kk >= 1) continue; const e = E.io(kk), px = lerp(from[0] + (hash(k * 7) - .5) * 150, GHOST[0] + (hash(k * 5) - .5) * 200, e), py = lerp(from[1] + (hash(k * 11) - .5) * 60, GHOST[1] + (hash(k * 13) - .5) * 80, e); ctx.save(); ctx.globalAlpha = wa * Math.sin(Math.PI * kk); ctx.translate(px, py); ctx.rotate(kk * 5 + k); shOn(ctx, .5); ctx.fillStyle = css(PAL.paper); ctx.fillRect(-9, -6, 18, 12); ctx.restore(); }
        const ca = seg(fill, .45, 1);
        if (ca > 0) { ctx.globalAlpha = wa * ca; ctx.translate(GHOST[0], GHOST[1]); ctx.rotate(-.06); const sc = .8 + .2 * E.back(ca); ctx.scale(sc, sc); shOn(ctx, 1.4); ctx.fillStyle = css(PAL.gold); ctx.beginPath(); ctx.roundRect(-150, -66, 300, 132, 10); ctx.fill(); shOff(ctx); ctx.fillStyle = css(PAL.inkD); ctx.font = FONT.serif(96, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('睡觉', 0, 6); }
        ctx.restore();
      }
      // “有没有‘睡觉’？”：大字，留几秒让人想；然后“没有”
      const q0 = TL.at('g3', '睡觉') - .1, q1 = t('g4'), qa = seg(time, q0, q0 + .25) * (1 - seg(time, t('g5') - .3, t('g5'))) * wa;
      if (qa > 0) {
        const no = seg(time, q1 - .02, q1 + .12);
        HUD.big(ctx, [{ s: '“睡觉”', col: PAL.gold }, { s: '？' }], QX, 470, 170, { a: qa * (1 - no) });
        if (no < 1) for (let k = 0; k < 3; k++) { const on = seg(time, q0 + .5 + (q1 - q0 - .7) * k / 3, q0 + .7 + (q1 - q0 - .7) * k / 3); ctx.fillStyle = css(PAL.ink, qa * (.22 + .7 * on)); ctx.beginPath(); ctx.arc(QX - 56 + k * 56, 570, 12, 0, 7); ctx.fill(); }
        if (no > 0) { const sc = lerp(1.5, 1, E.out(no)); ctx.save(); ctx.translate(QX, 520); ctx.scale(sc, sc); HUD.big(ctx, [{ s: '没有', col: PAL.hot }], 0, 0, 270, { a: qa * no }); ctx.restore(); }
      }
      // “这是第二次骗你”
      HUD.label(ctx, QX, 440, '第二次', { a: env(time, t('g7'), t('g7') + .2, te('g7') + .5, t('g8')) * wa, align: 'center', px: 84, tone: 'hot', serif: 1 });
      // “这个实验，心理学家做了三十年”：1995 → 现在，三十格；“大多数人都说有”
      const ea = seg(time, t('g8'), t('g8') + .3) * (1 - seg(time, t('g10') - .3, t('g10'))) * wa;
      if (ea > 0) {
        const x0 = 150, y0 = 430, kk = seg(time, t('g8') + .1, te('g8') + .1);
        HUD.text(ctx, x0, y0 - 44, '1995', { a: ea, mono: 1, px: 38 }); HUD.text(ctx, x0 + 900, y0 - 44, '现在', { a: ea, px: 38, align: 'right' });
        ctx.save(); ctx.globalAlpha = ea; for (let k = 0; k < 30; k++) { ctx.fillStyle = k / 30 < kk ? css(PAL.gold) : css(PAL.ink, .22); ctx.beginPath(); ctx.roundRect(x0 + k * 30, y0, 22, 30, 5); ctx.fill(); } ctx.restore();
        HUD.cite(ctx, 'Roediger & McDermott, 1995', ea);
        const says = [[70, 100, 1], [230, 150, 1], [390, 95, 1], [550, 150, 1], [710, 100, 0], [860, 150, 1], [130, 220, 1], [310, 250, 1], [480, 230, 0], [650, 250, 1], [800, 240, 1]];
        says.forEach((q, k) => { const a = E.back(seg(time, t('g9') - .1 + k * .06, t('g9') + .15 + k * .06)); if (a > 0) HUD.label(ctx, x0 + q[0], y0 + q[1], q[2] ? '有' : '没有', { a: ea * sat(a) * (q[2] ? 1 : .6), align: 'center', px: q[2] ? 50 : 34, tone: q[2] ? 'gold' : 'dark', serif: 1, rot: (hash(k) - .5) * .12 }); });
      }
    }
    // ---------- 后半：重拼 ----------
    // “它不是把那个晚上取出来”：一圈金线想把整个晚上原样框走——打叉
    const fa = env(time, t('g11') + .1, t('g11') + .5, CY[0][0] - .05, CY[0][0] + .3);
    if (fa > 0) { const k = E.out(seg(time, t('g11') + .1, t('g11') + .8)), len = 2 * (W - 160 + 770); ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = css(PAL.gold); ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.setLineDash([len * k, len]); ctx.strokeRect(80, 70, W - 160, 770); ctx.restore(); HUD.label(ctx, 130, 130, '原样取出', { a: fa, px: 44 }); const x = E.out(seg(time, TL.at('g11', '取出来'), TL.at('g11', '取出来') + .3)); if (x > 0) { ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = css(PAL.hot); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(124, 130); ctx.lineTo(124 + 232 * x, 130); ctx.stroke(); ctx.restore(); } }
    // 回忆的次数
    const done = CY.filter(q => time >= q[0] + q[1] * .5).length, ca = seg(time, CY[0][0] + CY[0][1] * .5, CY[0][0] + CY[0][1] * .5 + .3);
    if (ca > 0) { const lt = CY[done - 1][0] + CY[done - 1][1] * .5, pop = pulse(time, lt, .06, .3); HUD.text(ctx, W - 70, 84, '回忆的次数', { a: ca, px: 36, align: 'right' }); HUD.text(ctx, W - 64, 190, String(NUM[Math.min(NUM.length - 1, done - 1)]), { a: ca, mono: 1, px: 130 + pop * 14, align: 'right', col: mixc(PAL.gold, [255, 255, 255], pop * .6) }); }
    veil(ctx, fadeIO(time, t('g1') - .1, t('h1') - .1, .35));
    return {};
  }
  SCENES.push({ name: 'memory', t0: t('g1') - .1, draw });
  return { variant };
})();
