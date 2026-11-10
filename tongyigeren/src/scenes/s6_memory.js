// 场景 6（“回到刚才那个晚上” → “被改的机会也最多”）
// 前半：词卡回来，问“有没有‘睡觉’”——逐格查一遍，没有；然后一个个小方块从别的词上飞出来，在卡片下面自己拼出“睡觉”
// 后半：那个晚上的房间碎成一块块，再拼回来——每拼一次，就有东西不一样
'use strict';
const S6 = (() => {
  const g = G6, t = TL.s, te = TL.e, W4 = S4.WORDS;
  const CARD = S4.CARD, GHOST = [CARD.x + CARD.w / 2, CARD.y + CARD.h + 78], QX = 600;      // “睡觉”自己长出来的位置；大问号的位置
  // 每回忆一次，房间里就有几样东西被改掉。n = 第几次
  const POOL = {
    wall: ['#c9a089', '#5a5f9e', '#c9b266', '#8c6fae', '#6f9a8a'], curtain: ['#3d7f5c', '#d9b23a', '#c8463a', '#3a6a9a', '#e6e0d2'], quilt: ['#2f4b80', '#c8463a', '#e6dccb', '#3a8a7a', '#8a5aa0'],
    rug: ['#d6bd84', '#3f8a5a', '#d9667a', '#2b7f7c', '#35507a'], art: ['peak', 'band', 'abstract', 'photo', 'light'], lamp: ['shroom', 'cone', 'bank', 'globe', 'arm'], chair: ['stool', 'red', 'stool', 'red', 'stool'], toy: ['robot', 'bear', 'plant', 'amp', 'bear'],
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
    while (x + d * .7 < end) { out.push([x, d]); x += d; d = Math.max(.34, d * .8); }
    return out;
  }
  const NUM = [1, 2, 3, 5, 9, 16, 30, 57, 108, 212, 420, 836, 1650, 3200];

  function nightOpts(time, n) { const o = S4.opts(time, { lampOn: 0, eyes: 0, moon: 1 }); o.S = variant(n); return o; }
  function draw(ctx, time) {
    const c = S4.CAMN, CY = cycles();
    g.reset();
    // 现在是第几次重拼
    let ci = -1; CY.forEach((q, i) => { if (time >= q[0]) ci = i; });
    const cyc = ci >= 0 ? CY[ci] : null, u = cyc ? sat((time - cyc[0]) / cyc[1]) : 1, apart = cyc && u < 1 ? Math.pow(Math.sin(Math.PI * u), .7) : 0;
    const n0 = ci < 0 ? 0 : ci, n1 = ci + 1;
    if (apart > 0) {
      paintRoom(g.begin('a', c), nightOpts(time, n0)); paintRoom(g.begin('b', c), nightOpts(time, n1));
      const off = (bx, by, k) => { const dx = (bx + .5) * 40 - 160, dy = (by + .5) * 30 - 90, m = apart * (.5 + hash(k * 7 + ci * 31) * .9); return [dx * .34 * m + (hash(k * 3 + ci) - .5) * 26 * apart, dy * .4 * m + (hash(k * 5 + ci * 3) - .5) * 20 * apart]; };
      g.shatter('a', 40, 30, off); g.shatter('b', 40, 30, off);
      Flip.scatter(g, seg(u, .3, .7), { dur: .3, seed: ci + 2 });
    } else paintRoom(g.begin('a', c), nightOpts(time, n1));
    const inK = seg(time, t('g1') - .1, t('g1') + .55);
    if (inK < 1) g.fromBlack(inK, { ox: 160, oy: 90 });
    const outK = seg(time, t('h1') - .5, t('h1') - .08);
    if (outK > 0) g.toBlack(outK);
    Post.blit(ctx, g.present({}), .44);
    Post.dust(ctx, time, { a: .5, col: [170, 200, 255] });
    const oa = 1 - outK;

    // ---------- 前半：九个词 ----------
    const wa = seg(time, t('g2') - .3, t('g2') + .2) * (1 - seg(time, t('g11') - .2, t('g11') + .3)) * oa;
    if (wa > 0) {
      const has = ['床', '枕头', '做梦', '打呼'];
      S4.drawWords(ctx, time, { a: wa, all: 1, hl: k => { const j = has.indexOf(W4[k]); return j < 0 ? 0 : seg(time, TL.at('g5', has[j]) - .03, TL.at('g5', has[j]) + .12) * (1 - seg(time, t('g7') - .2, t('g7') + .2)); } });
      // “偏偏没有‘睡觉’”：取景框把九格挨个查一遍
      const s0 = t('g6') - .1, s1 = te('g6') + .1, sk = seg(time, s0, s1);
      if (sk > 0 && sk < 1) { const k = Math.min(8, Math.floor(sk * 9)), p = S4.slot(k); HUD.bracket(ctx, p[0] - 96, p[1] - 46, 192, 92, 1, { len: 20, lw: 4, a: wa, col: PAL.hot }); }
      const zeroA = seg(time, te('g6') - .2, te('g6') + .1) * (1 - seg(time, t('g8') - .3, t('g8'))) * wa;
      HUD.tag(ctx, GHOST[0], GHOST[1], '“睡觉”：0 个', { a: zeroA, align: 'center', px: 40, col: mixc(PAL.ink, PAL.hot, pulse(time, t('g7'), .12, .7)) });
      // “是你的大脑自己放进去的”：小方块从别的词上飞下来，拼成“睡觉”
      const fill = E.io(seg(time, TL.at('g10', '自己') - .2, te('g10') + .1));
      if (fill > 0) {
        ctx.save();
        for (let k = 0; k < 130; k++) { const from = S4.slot(k % 9), t0 = hash(k * 3) * .6, kk = sat((fill - t0) / .4); if (kk <= 0 || kk >= 1) continue; const e = E.io(kk), px = lerp(from[0] + (hash(k * 7) - .5) * 120, GHOST[0] + (hash(k * 5) - .5) * 210, e), py = lerp(from[1] + (hash(k * 11) - .5) * 60, GHOST[1] + (hash(k * 13) - .5) * 80, e) + Math.sin(kk * Math.PI) * 30 * (hash(k) - .5); ctx.globalAlpha = wa * Math.sin(kk * Math.PI); ctx.fillStyle = css(PAL.gold); ctx.fillRect(px, py, 9, 9); }
        ctx.globalAlpha = wa * seg(fill, .35, 1); ctx.translate(GHOST[0], GHOST[1]); ctx.rotate(-.05); ctx.font = FONT.serif(112, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.95)'; ctx.shadowBlur = 18; ctx.fillStyle = css(PAL.gold); ctx.fillText('睡觉', 0, 0); ctx.fillText('睡觉', 0, 0);
        ctx.restore();
      }
      // “有没有‘睡觉’？”：中间一个大问号，留几秒让人想
      const q0 = TL.at('g3', '睡觉') - .1, q1 = t('g4'), qa = seg(time, q0, q0 + .25) * (1 - seg(time, t('g5') - .3, t('g5'))) * wa;
      if (qa > 0) {
        const no = seg(time, q1 - .02, q1 + .12);
        HUD.big(ctx, [{ s: '“睡觉”', hl: 1 }, { s: '？' }], QX, 420, 150, { a: qa * (1 - no * .78), hl: PAL.gold });
        if (no < 1) for (let k = 0; k < 3; k++) { const on = seg(time, q0 + .5 + (q1 - q0 - .7) * k / 3, q0 + .7 + (q1 - q0 - .7) * k / 3); ctx.fillStyle = css(PAL.ink, qa * (.22 + .7 * on)); ctx.fillRect(QX - 62 + k * 50, 520, 24, 24); }
        if (no > 0) { const sc = lerp(1.5, 1, E.out(no)); ctx.save(); ctx.translate(QX, 460); ctx.scale(sc, sc); HUD.big(ctx, [{ s: '没有', col: PAL.hot }], 0, 0, 250, { a: qa * no }); ctx.restore(); }
      }
      // “这是第二次骗你”
      HUD.tag(ctx, QX, 380, '第二次', { a: env(time, t('g7'), t('g7') + .2, te('g7') + .5, t('g8')) * wa, align: 'center', px: 54, col: PAL.hot, serif: 1, w: 900, pad: 26 });
      // “这个实验，心理学家做了三十年”：1995 → 现在，三十格
      const ea = seg(time, t('g8'), t('g8') + .3) * (1 - seg(time, t('g10') - .3, t('g10'))) * wa;
      if (ea > 0) {
        const x0 = W / 2 - 480, y0 = 560, kk = seg(time, t('g8') + .1, te('g8') + .1);
        ctx.save(); ctx.globalAlpha = ea; ctx.font = FONT.mono(34, 700); ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 10;
        ctx.textAlign = 'right'; ctx.fillStyle = css(PAL.ink); ctx.fillText('1995', x0 - 24, y0 + 12); ctx.textAlign = 'left'; ctx.font = FONT.sans(34); ctx.fillText('现在', x0 + 960 + 24, y0 + 12);
        ctx.shadowBlur = 0; for (let k = 0; k < 30; k++) { ctx.fillStyle = k / 30 < kk ? css(PAL.gold) : css(PAL.ink, .2); ctx.fillRect(x0 + k * 32, y0, 24, 24); }
        ctx.restore();
        HUD.cite(ctx, 'Roediger & McDermott, 1995', ea);
        // “大多数人都说有”
        const says = [[-390, 110, 1], [-250, 170, 1], [-120, 100, 1], [10, 180, 1], [140, 110, 0], [270, 170, 1], [400, 105, 1], [-330, 230, 1], [-60, 250, 0], [210, 245, 1], [470, 215, 1], [-190, 300, 1], [80, 310, 1], [340, 300, 1]];
        says.forEach((q, k) => { const a = E.back(seg(time, t('g9') - .1 + k * .06, t('g9') + .15 + k * .06)); if (a > 0) HUD.tag(ctx, W / 2 + q[0], y0 + q[1], q[2] ? '有' : '没有', { a: ea * sat(a) * (q[2] ? 1 : .55), align: 'center', px: q[2] ? 40 : 30, col: q[2] ? PAL.gold : PAL.dim, serif: 1, w: 900 }); });
      }
    }
    // ---------- 后半：重拼 ----------
    const ra = seg(time, t('g11') + .1, t('g11') + .5) * oa;
    if (ra > 0) {
      // “它不是把那个晚上取出来”：整张画面被框住、想原样取出——打叉
      const fa = env(time, t('g11') + .1, t('g11') + .5, CY[0][0] - .05, CY[0][0] + .3) * oa;
      if (fa > 0) {
        HUD.bracket(ctx, 150, 130, W - 300, 760, fa, { len: 60, lw: 6, frame: .5 });
        HUD.tag(ctx, 180, 176, '原样取出', { a: fa, px: 38 });
        const x = E.out(seg(time, TL.at('g11', '取出来'), TL.at('g11', '取出来') + .3));
        if (x > 0) { ctx.save(); ctx.globalAlpha = fa; ctx.strokeStyle = css(PAL.hot); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(176, 176); ctx.lineTo(176 + 190 * x, 176); ctx.stroke(); ctx.restore(); }
      }
      // 第几次回忆 + 和那天差多少
      const done = CY.filter(q => time >= q[0] + q[1] * .5).length, ca = seg(time, CY[0][0] + CY[0][1] * .5, CY[0][0] + CY[0][1] * .5 + .3) * oa;
      if (ca > 0) {
        const lt = CY[done - 1][0] + CY[done - 1][1] * .5, pop = pulse(time, lt, .06, .3);
        HUD.counter(ctx, W - 64, 150, '回忆的次数', NUM[Math.min(NUM.length - 1, done - 1)], { a: ca, col: mixc(PAL.gold, [255, 255, 255], pop * .6), px: 96 });
        const diff = sat(Math.min(KEYS.length, done * 2) / KEYS.length), x0 = W - 64 - 300;
        ctx.save(); ctx.globalAlpha = ca; ctx.font = FONT.sans(28); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 10; ctx.fillStyle = css(PAL.ink, .86); ctx.fillText('被改掉的地方', W - 64, 304);
        ctx.shadowBlur = 0; ctx.fillStyle = css(PAL.ink, .2); ctx.fillRect(x0, 328, 300, 10); ctx.fillStyle = css(PAL.hot); ctx.fillRect(x0, 328, 300 * diff, 10); ctx.restore();
      }
    }
    return {};
  }
  SCENES.push({ name: 'memory', t0: t('g1') - .1, draw });
  return { variant, nightOpts };
})();
