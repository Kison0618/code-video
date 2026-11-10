// 场景 4（“先帮我记住一个晚上”）：夜里的屋子。九个词是九张小纸牌，一张一张贴到墙上，每贴一张屋里对应动一下
// 这九个词后面要考（“那一串词里有没有‘睡觉’？”），所以排成固定的 3×3，字要大
'use strict';
const S4 = (() => {
  const t = TL.s, te = TL.e;
  const WORDS = ['床', '枕头', '被子', '哈欠', '犯困', '熄灯', '晚安', '做梦', '打呼'];
  const GRID = { x: 1200, y: 70, w: 196, h: 92, gap: 18 };                       // 九张牌贴在床上方的墙上
  const slot = k => [GRID.x + (k % 3) * (GRID.w + GRID.gap) + GRID.w / 2, GRID.y + Math.floor(k / 3) * (GRID.h + GRID.gap) + GRID.h / 2];
  const wt = k => TL.at('e2', WORDS[k]);
  const HEAD = [1716, 578];
  // 睡在床上的男孩：头枕着枕头，身子在被子里
  function sleeper(c, o) {
    const x = HEAD[0], y = HEAD[1], d = WHO[7], skin = d.skin, hair = d.hair;
    c.save(); c.translate(x, y + 30); c.rotate(.12); c.translate(-x, -(y + 30));
    shOn(c, .5); fs(c, hair); for (const [dx, dy, r] of [[-30, 14, 15], [-27, 2, 16], [-10, -8, 18], [10, -9, 18], [28, 2, 16], [30, 14, 15]]) circ(c, x + dx, y + dy + 14, r);
    fs(c, skin); c.beginPath(); c.ellipse(x, y + 40, 38, 36, 0, 0, 7); c.fill(); shOff(c);
    fs(c, C('#f08a72'), .28); circ(c, x - 24, y + 54, 8); circ(c, x + 24, y + 54, 8);
    c.strokeStyle = '#2a1e18'; c.lineWidth = 3.4; c.lineCap = 'round'; fs(c, C('#2a1e18'));
    const eye = o.eyes;                                        // 1 睁着 → 0 闭上
    for (const sd of [-1, 1]) { if (eye > .15) { c.beginPath(); c.ellipse(x + sd * 16, y + 42, 5, 5 * eye, 0, 0, 7); c.fill(); } else { c.beginPath(); c.arc(x + sd * 16, y + 40, 6, .15 * Math.PI, .85 * Math.PI); c.stroke(); } }
    if (o.yawn > 0.05) { c.beginPath(); c.ellipse(x, y + 60, 8 * o.yawn, 11 * o.yawn, 0, 0, 7); c.fill(); } else { c.beginPath(); c.arc(x, y + 54, 6, .2 * Math.PI, .8 * Math.PI); c.stroke(); }
    c.restore();
  }
  // 这个晚上的房间。o 可以覆盖：S 房间、lampOn、eyes、moon、extra
  function opts(time, o) {
    o = o || {};
    const lampOn = o.lampOn !== undefined ? o.lampOn : 1 - E.io2(seg(time, wt(5), wt(5) + .25));
    const eyes = o.eyes !== undefined ? o.eyes : 1 - .55 * seg(time, wt(4), wt(4) + .5) - .45 * seg(time, wt(6), wt(6) + .4);
    const yawn = o.eyes !== undefined ? 0 : env(time, wt(3), wt(3) + .25, wt(3) + .7, wt(3) + 1.0);
    const moon = o.moon !== undefined ? o.moon : seg(time, wt(6), wt(6) + .5);
    const breathe = Math.sin(time * 1.6) * 3, S = o.S || ERA.night;
    return {
      S, lampOn, time, ships: [shipAt()],
      light: { amb: lerp(.34, .5, lampOn), tint: [30, 42, 96], win: .5 + moon * .5, winCol: [150, 185, 255], lamp: lampOn * 1.15 },
      extra(c, layer) {
        if (layer === 'behind') sleeper(c, { eyes, yawn });
        if (layer === 'bed') { const col = S.quilt.__x ? S.quilt.b : S.quilt; shOn(c, .6); fs(c, col); rr(c, 1300, 598 - breathe, 330, 60, 30); shOff(c); fs(c, lite(col, .2)); for (let k = 0; k < 5; k++) circ(c, 1340 + k * 62, 616 - breathe, 6); }   // 被子里鼓起来的身子
        if (o.extra) o.extra(c, layer);
      },
    };
  }
  // 九张词牌。o = {a, all 全部显示, hl: k => 0..1 高亮, dim}
  function drawWords(ctx, time, o) {
    o = o || {}; const a = o.a === undefined ? 1 : o.a; if (a <= 0.01) return;
    WORDS.forEach((w, k) => {
      const on = o.all ? 1 : E.back(seg(time, wt(k) - .06, wt(k) + .28)); if (on <= 0) return;
      const cur = o.all ? 0 : (k === 8 ? 1 - seg(time, wt(8) + 1.2, wt(8) + 1.6) : time < wt(k + 1) ? 1 : 0), hl = o.hl ? o.hl(k) : cur, p = slot(k);
      ctx.save(); ctx.globalAlpha = a * sat(on * 2); ctx.translate(p[0], p[1] + (1 - sat(on)) * -30); ctx.rotate((hash(k * 5 + 1) - .5) * .05); ctx.scale(.9 + .1 * on, .9 + .1 * on);
      shOn(ctx, .8 + hl * .6); ctx.fillStyle = css(mixc(PAL.paper, PAL.gold, hl)); ctx.beginPath(); ctx.roundRect(-GRID.w / 2, -GRID.h / 2, GRID.w, GRID.h, 8); ctx.fill(); shOff(ctx);
      ctx.fillStyle = css(PAL.inkD); ctx.font = FONT.serif(62, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(w, 0, 4);
      ctx.restore();
    });
  }
  const SPOT = [[1196, 492, 1862, 782], [1622, 590, 1808, 660], [1200, 616, 1630, 746]];        // 床 / 枕头 / 被子
  function draw(ctx, time) {
    const o = opts(time, {
      extra(c, layer) {
        if (layer !== 'front') return;
        const dk = E.out(seg(time, wt(7), wt(7) + .5));        // 做梦：头边冒出一朵云，里面是那艘船
        if (dk > 0) { c.save(); c.globalAlpha = dk; const bx = 1500, by = 486 - (1 - dk) * 20; shOn(c, 1); fs(c, C('#eef1fb')); circ(c, 1660, 566, 9); circ(c, 1626, 540, 14); c.beginPath(); c.ellipse(bx, by, 104, 62, 0, 0, 7); c.ellipse(bx - 66, by + 16, 54, 40, 0, 0, 7); c.ellipse(bx + 66, by + 14, 52, 38, 0, 0, 7); c.fill(); shOff(c); drawShip(c, bx, by + 44, .66, { flat: 1 }); c.restore(); }
      },
    });
    camApply(ctx, ROOMCAM); paintRoom(ctx, o); camReset(ctx);
    // 前三个词：把床 / 枕头 / 被子框一下
    for (let k = 0; k < 3; k++) { const a = env(time, wt(k), wt(k) + .25, wt(k) + .8, wt(k) + 1.1); if (a > 0) HUD.bracket(ctx, SPOT[k][0], SPOT[k][1], SPOT[k][2] - SPOT[k][0], SPOT[k][3] - SPOT[k][1], a, { len: 30, lw: 6 }); }
    // 晚安
    HUD.label(ctx, 1560, 520, '晚安', { a: env(time, wt(6), wt(6) + .2, wt(7) - .25, wt(7)), px: 40, rot: -.05 });
    // 打呼：Z z z
    for (let k = 0; k < 3; k++) { const z0 = wt(8) + k * .32, zk = seg(time, z0, z0 + 1.5); if (zk > 0 && zk < 1) HUD.text(ctx, 1790 + k * 22 + zk * 30, 560 - zk * 120 - k * 14, k === 0 ? 'z' : 'Z', { a: Math.sin(Math.PI * zk), mono: 1, px: 44 + k * 16 }); }
    // 九张牌；“记住了？先放着”：收成右上角一张小卡片
    const fold = E.io(seg(time, TL.at('e3', '先放着') - .1, TL.at('e3', '先放着') + .6));
    if (fold < 1) { ctx.save(); const cx = GRID.x + 306, cy = GRID.y + 156; ctx.translate(lerp(cx, W - 64 - 125, fold), lerp(cy, 135, fold)); ctx.scale(1 - fold * .62, 1 - fold * .62); ctx.translate(-cx, -cy); drawWords(ctx, time, { a: 1 - seg(fold, .5, 1) }); ctx.restore(); }
    if (fold > 0) drawMemCard(ctx, W - 64 - 250, 60, 1, seg(fold, .4, 1));
    veil(ctx, fadeIO(time, t('e1') - .12, t('f1') - .08, .35));
    return {};
  }
  SCENES.push({ name: 'night', t0: t('e1') - .12, draw });
  return { opts, drawWords, slot, WORDS, wt, GRID, HEAD };
})();
