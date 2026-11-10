// 场景 4（“先帮我记住一个晚上”）：夜里的阁楼，九个词一个一个出现，每个词房间里对应动一下
// 这九个词后面要考（“那一串词里有没有‘睡觉’？”），所以排成一张 3×3 的词卡，位置固定
'use strict';
const S4 = (() => {
  const g = G6, t = TL.s, te = TL.e;
  const WORDS = ['床', '枕头', '被子', '哈欠', '犯困', '熄灯', '晚安', '做梦', '打呼'];
  const CAMN = { z: 1.22, x: 950, y: 505 };
  // 词卡：右上角一块深色的板，三行三列
  const PX = 72, CARD = { x: 1130, y: 96, w: 690, h: 372 }, COLW = 220, ROWH = 106;
  const slot = k => [CARD.x + CARD.w / 2 + (k % 3 - 1) * COLW, CARD.y + 86 + Math.floor(k / 3) * ROWH];
  const wt = k => TL.at('e2', WORDS[k]);
  const HEADPOS = [1512, 584];
  // 睡着的男孩：头在枕头上，身子在被子里
  function sleeper(c, o) {
    const x = HEADPOS[0], y = HEADPOS[1], skin = mul(WHO[7].skin, .92), hair = WHO[7].hair;
    c.save(); c.translate(x, y + 30); c.rotate(.14); c.translate(-x, -(y + 30));
    fs(c, hair); for (const [dx, dy, r] of [[-26, 8, 16], [-10, -2, 17], [8, -3, 17], [25, 6, 16], [-34, 22, 12], [34, 22, 12]]) { c.beginPath(); c.arc(x + dx, y + dy + 10, r, 0, 7); c.fill(); }
    fs(c, skin); c.beginPath(); c.ellipse(x, y + 36, 34, 32, 0, 0, 7); c.fill();
    fs(c, C('#221a16'));
    const eye = o.eyes;                                        // 1 睁着 → 0 闭上
    if (eye > .1) { c.fillRect(x - 18, y + 38 - 4 * eye, 8, 8 * eye); c.fillRect(x + 10, y + 38 - 4 * eye, 8, 8 * eye); } else { c.fillRect(x - 20, y + 39, 12, 4); c.fillRect(x + 8, y + 39, 12, 4); }
    if (o.yawn > 0) { c.beginPath(); c.ellipse(x, y + 54, 7 * o.yawn, 9 * o.yawn, 0, 0, 7); c.fill(); }
    c.restore();
  }
  function opts(time, o) {
    o = o || {};
    const lampOn = o.lampOn !== undefined ? o.lampOn : 1 - E.io2(seg(time, wt(5), wt(5) + .25));
    const eyes = o.eyes !== undefined ? o.eyes : 1 - .55 * seg(time, wt(4), wt(4) + .5) - .45 * seg(time, wt(6), wt(6) + .4);
    const yawn = o.eyes !== undefined ? 0 : env(time, wt(3), wt(3) + .25, wt(3) + .7, wt(3) + 1.0);
    const moon = o.moon !== undefined ? o.moon : seg(time, wt(6), wt(6) + .5);
    const breathe = Math.sin(time * 1.6) * 3;
    const ret = {
      S: ERA.night, lampOn, time,
      light: { amb: lerp(.42, .28, 1 - lampOn), tint: [26, 38, 84], win: .5 + moon * .6, winCol: [150, 185, 255], lamp: lampOn * 1.1, vig: .4, spots: [[400, 540, 420, .1 + moon * .16, [120, 160, 255]]] },
      extra(c, layer) {
        if (layer === 'behind') sleeper(c, { eyes, yawn });
        if (layer === 'bed') { fs(c, ret.S.quilt); rr(c, 1150, 610 - breathe, 290, 40, 20); fs(c, [0, 0, 0], .1); rr(c, 1150, 632 - breathe, 290, 14, 7); }   // 被子鼓起来的一条
        if (o.extra) o.extra(c, layer);
      },
      ships: [shipAt('shelf')],
    };
    return ret;
  }
  function drawWords(ctx, time, o) {                           // o = {a, hl: fn(k) → 0..1 高亮, all: 九个词全部显示, dimAll: 整体压暗}
    o = o || {}; const a = o.a === undefined ? 1 : o.a; if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = a;
    ctx.fillStyle = 'rgba(7,9,16,.84)'; ctx.fillRect(CARD.x, CARD.y, CARD.w, CARD.h); ctx.fillStyle = css(PAL.gold); ctx.fillRect(CARD.x, CARD.y, CARD.w, 6);
    ctx.strokeStyle = css(PAL.ink, .14); ctx.lineWidth = 2; for (let k = 1; k < 3; k++) { ctx.beginPath(); ctx.moveTo(CARD.x + CARD.w / 2 + (k - 1.5) * COLW, CARD.y + 40); ctx.lineTo(CARD.x + CARD.w / 2 + (k - 1.5) * COLW, CARD.y + CARD.h - 34); ctx.stroke(); }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = FONT.serif(PX, 900);
    WORDS.forEach((w, k) => {
      const on = o.all ? 1 : seg(time, wt(k) - .04, wt(k) + .16); if (on <= 0) return;
      const cur = o.all ? 0 : (k === 8 ? 1 - seg(time, wt(8) + 1.2, wt(8) + 1.6) : time < wt(k + 1) ? 1 : 0);
      const hl = o.hl ? o.hl(k) : cur, p = slot(k), pop = o.all ? 0 : (1 - E.out(seg(time, wt(k), wt(k) + .3))) * 16;
      ctx.globalAlpha = a * on * (o.dimAll ? 1 - o.dimAll * .7 : 1); ctx.fillStyle = css(mixc(PAL.ink, o.hlCol || PAL.gold, hl)); ctx.fillText(w, p[0], p[1] + pop);
    });
    ctx.restore();
  }
  // 前三个词在房间里对应的位置（世界坐标的框）
  const SPOT = [[1086, 500, 1654, 782], [1440, 600, 1610, 660], [1098, 628, 1440, 748]];
  function draw(ctx, time) {
    const c = camMix(ROOMCAM, CAMN, E.io2(seg(time, t('e1'), te('e3'))));
    g.reset();
    const o = opts(time, {
      extra(cx, layer) {
        if (layer !== 'front') return;
        // 做梦：头顶冒出一朵云，里面是那艘船
        const dk = E.out(seg(time, wt(7), wt(7) + .5));
        if (dk > 0) {
          cx.save(); cx.globalAlpha = dk; fs(cx, [225, 232, 250]);
          cx.beginPath(); cx.arc(1476, 566, 9, 0, 7); cx.arc(1446, 532, 14, 0, 7); cx.fill();
          const bx = 1350, by = 440 - (1 - dk) * 20; cx.beginPath(); cx.ellipse(bx, by, 96, 62, 0, 0, 7); cx.ellipse(bx - 60, by + 14, 52, 40, 0, 0, 7); cx.ellipse(bx + 62, by + 12, 50, 38, 0, 0, 7); cx.fill();
          drawShip(cx, bx, by + 44, .62, {}); cx.restore();
        }
      },
    });
    paintRoom(g.begin('a', c), o);
    const inK = seg(time, t('e1') - .1, t('e1') + .5);
    if (inK < 1) g.fromBlack(inK, { ox: 160, oy: 90 });
    const outK = seg(time, t('f1') - .5, t('f1') - .08);
    if (outK > 0) g.toBlack(outK);
    Post.blit(ctx, g.present({}), .44);
    Post.dust(ctx, time, { a: .5, col: [170, 200, 255] });
    const oa = 1 - outK;
    // 前三个词：把床 / 枕头 / 被子框出来
    for (let k = 0; k < 3; k++) { const a = env(time, wt(k), wt(k) + .25, wt(k) + .8, wt(k) + 1.1) * oa; if (a > 0) { const p0 = toScreen(c, SPOT[k][0], SPOT[k][1]), p1 = toScreen(c, SPOT[k][2], SPOT[k][3]); HUD.bracket(ctx, p0[0], p0[1], p1[0] - p0[0], p1[1] - p0[1], a, { len: 24, lw: 4 }); } }
    // 打呼：Z z z
    const zt = wt(8);
    for (let k = 0; k < 3; k++) { const z0 = zt + k * .32, zk = seg(time, z0, z0 + 1.5); if (zk > 0 && zk < 1) { const p = toScreen(c, 1560 + k * 20 + zk * 30, 580 - zk * 110 - k * 14); ctx.save(); ctx.globalAlpha = Math.sin(Math.PI * zk) * oa; ctx.font = FONT.mono(40 + k * 14, 700); ctx.fillStyle = css(PAL.ink); ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 8; ctx.fillText(k === 0 ? 'z' : 'Z', p[0], p[1]); ctx.restore(); } }
    // 词卡；“记住了？先放着”：收成右上角一张小卡片
    const fold = E.io(seg(time, TL.at('e3', '先放着') - .1, TL.at('e3', '先放着') + .6));
    drawWords(ctx, time, { a: seg(time, wt(0) - .5, wt(0) - .15) * (1 - fold) * oa });
    if (fold > 0) { const s = lerp(2.6, 1, fold), x = lerp(CARD.x + 20, W - 64 - 250, fold), y = lerp(CARD.y, 110, fold); drawMemCard(ctx, x, y, s, sat(fold * 2) * oa); }
    return {};
  }
  SCENES.push({ name: 'night', t0: t('e1') - .1, draw });
  return { opts, drawWords, slot, WORDS, CAMN, wt, PX, CARD };
})();
