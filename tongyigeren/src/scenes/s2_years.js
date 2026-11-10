// 场景 2（十七岁 → 七十七岁）：同一间阁楼，每到一个年纪，一道木板翻面的波扫过去
// 每样“原来的东西”上钉着一颗金钉；被换掉，金钉就灭。最后只剩船上那一颗
'use strict';
const S2 = (() => {
  const g = G6, t = TL.s, te = TL.e, BOY = S1.BOY, SEAT = BED.top - 12;
  const sitP = (who, x, o) => Object.assign({ who, x, y: SEAT, s: PS, sit: 1, layer: 'bed', armR: [16, -52], armL: [16, -52], armsFront: 1 }, o);
  const DUSK = { amb: .8, tint: [90, 60, 70], win: .6, winCol: [255, 190, 140], lamp: .6, vig: .34 }, GREY = { amb: .84, tint: [60, 66, 80], win: .6, winCol: [220, 228, 240], lamp: .4, vig: .34 };
  const man37 = () => ({ who: 37, x: 912, y: 826, s: PS, armL: [62, 40], armR: [10, 4] });
  const ship37 = () => { const G = personGeo(man37()); return { x: G.handL[0] - 30, y: G.handL[1] + 4, s: .8, layer: 'front' }; };
  const CHAIRSEAT = [375, 686];
  const old = () => sitP(77, CHAIRSEAT[0], { y: CHAIRSEAT[1], layer: 'front', armR: [26, -70], armL: [26, -70] });
  const shipOld = o => Object.assign({ x: CHAIRSEAT[0] + 4, y: CHAIRSEAT[1] + 50, s: .9, layer: 'front' }, o);
  const p57 = () => [sitP('partnerOld', 1290), sitP(57, CHAIRSEAT[0], { y: CHAIRSEAT[1], layer: 'front' })];
  const STAGE = [
    () => ({ S: ERA.v1, people: [S1.TEEN()], ships: [shipAt('desk')], light: DAY }),
    () => ({ S: ERA.v17a, people: [S1.TEEN()], ships: [shipAt('desk')], light: DUSK }),
    () => ({ S: ERA.v17, people: [S1.TEEN()], ships: [shipAt('desk')], light: DUSK }),
    () => ({ S: ERA.v27a, people: [sitP(27, 1250)], ships: [shipAt('desk')], light: DAY }),
    () => ({ S: ERA.v27, people: [sitP(27, 1250)], ships: [shipAt('desk')], light: DAY }),
    () => ({ S: ERA.v27, people: [sitP(27, 1250), sitP('partner', 1384)], ships: [shipAt('desk')], light: DAY }),
    () => ({ S: ERA.v37a, people: [sitP('partner', 1320), man37()], ships: [ship37()], light: DAY }),
    () => ({ S: ERA.v37, people: [sitP('partner', 1320), man37()], ships: [ship37()], light: DAY }),
    () => ({ S: ERA.v57a, people: p57(), ships: [shipAt('shelf')], light: DAY }),
    () => ({ S: ERA.v57b, people: p57(), ships: [shipAt('shelf')], light: DAY }),
    () => ({ S: ERA.v57c, people: p57(), ships: [shipAt('shelf')], light: DAY }),
    () => ({ S: ERA.v57, people: p57(), ships: [shipAt('shelf')], light: DAY }),
    () => ({ S: ERA.v77, people: [old()], ships: [shipOld()], light: GREY }),
  ];
  const R_ART = S1.ITEMS[4].r, R_BED = [1056, 440, 1664, 782], R_PART = [1384 - 80, 400, 1384 + 80, 730], R_CRIB = [550, 568, 814, 782];
  // 十二颗金钉：钉在哪、在第几步被换掉（-1 = 一直在）
  const PINS = [['wall', 1290, 290, 5], ['curtain', 544, 400, 2], ['quilt', 1270, 632, 0], ['rug', 700, 792, 2], ['art', 900, 216, 1], ['lamp', 1020, 560, 0], ['chair', 626, 548, 6], ['toy', 760, 480, 0], ['bed', 1626, 516, 3], ['desk', 250, 660, 7], ['shelf', 936, 616, 11], ['ship', 0, 0, -1]];
  // 每一步什么时候翻、怎么翻
  function steps() {
    const w3 = TL.at('c8', '墙刷过'), d3 = Math.max(.34, (te('c8') + .5 - w3) / 3);
    return [
      { t: t('c1'), d: 1.1, wave: { dir: 'x', ox: 0 }, age: 17 },
      { t: TL.at('c2', '换成'), d: .55, rect: R_ART },
      { t: t('c3'), d: 1.0, wave: { dir: 'diag', ox: 0, oy: 0 }, age: 27 },
      { t: t('c4'), d: .6, rect: R_BED },
      { t: TL.at('c4', '多了'), d: .5, rect: R_PART },
      { t: t('c5'), d: 1.0, wave: { dir: 'x', ox: 320 }, age: 37 },
      { t: TL.at('c6', '多了'), d: .6, rect: R_CRIB },
      { t: t('c7'), d: 1.0, wave: { dir: 'diag', ox: 0, oy: 0 }, age: 57 },
      { t: w3, d: d3 * .9, wave: { dir: 'x', ox: 0 } },
      { t: w3 + d3, d: d3 * .9, wave: { dir: 'y', oy: 0 } },
      { t: w3 + d3 * 2, d: d3 * .9, wave: { dir: 'x', ox: 320 } },
      { t: t('c9'), d: 1.1, wave: { dir: 'radial', ox: 150, oy: 30 }, age: 77 },
    ];
  }
  const FINAL = { z: 2.2, x: CHAIRSEAT[0] + 60, y: 640 };
  function cam(time) {
    const c = camMix(S1.cam(t('c1')), ROOMCAM, E.io(seg(time, t('c1') - .05, t('c1') + 1.1)));
    return camMix(c, FINAL, E.io(seg(time, t('c10') - .2, te('c11') + .3)));        // “只剩那艘船”：推向老人手里的船
  }
  // 最后一步（七十七岁）之后：全屋暗下来，只有船亮着
  function finalOpts(time) {
    const k = E.io2(seg(time, t('c10'), TL.at('c11', '那艘船') + .2)), o = STAGE[12]();
    o.light = Object.assign({}, GREY, { amb: lerp(GREY.amb, .3, k), win: lerp(.6, .2, k), lamp: lerp(.4, .1, k), spots: [[CHAIRSEAT[0] + 4, CHAIRSEAT[1] - 10, 230, .3 * k, [255, 190, 100]]] });
    o.ships = [shipOld({ glow: k * .55 })];
    return o;
  }
  function draw(ctx, time) {
    const ST = steps(), c = cam(time);
    let i = -1; for (let k = 0; k < ST.length; k++) if (ST[k].t <= time) i = k;
    g.reset();
    const st = ST[Math.max(0, i)], p = i < 0 ? 0 : seg(time, st.t, st.t + st.d);
    const optB = i < 0 ? STAGE[0]() : (i === 11 ? finalOpts(time) : STAGE[i + 1]());
    if (p >= 1 || i < 0) paintRoom(g.begin('a', c), Object.assign(optB, { time }));
    else {
      paintRoom(g.begin('a', c), Object.assign(STAGE[i](), { time })); paintRoom(g.begin('b', c), Object.assign(optB, { time }));
      if (st.rect) { const a = g.cell(st.rect[0], st.rect[1], c), b = g.cell(st.rect[2], st.rect[3], c), r = [a[0], a[1], b[0] + 1, b[1] + 1]; Flip.wave(g, p, { rect: r, ox: (r[0] + r[2]) / 2, oy: (r[1] + r[3]) / 2, width: 6, rnd: 4 }); }
      else Flip.wave(g, p, Object.assign({ width: 22, rnd: 9, oy: g.gh / 2 }, st.wave));
    }
    const shipNow = optB.ships[0];
    const outK = seg(time, t('d1') - .42, t('d1') - .02);
    if (outK > 0) { const sp = g.cell(shipNow.x, shipNow.y - 60, c); g.toBlack(outK, { ox: sp[0], oy: sp[1] }); }
    Post.blit(ctx, g.present({}), .36);
    Post.dust(ctx, time, {});
    const oa = 1 - outK;

    // ---------- 标签 ----------
    // 年纪：左上角的大数字，换年纪时滚一下
    const ages = ST.filter(s => s.age);
    let ai = -1; ages.forEach((s, k) => { if (s.t <= time) ai = k; });
    if (ai >= 0) {
      const a0 = ages[ai], roll = E.out(seg(time, a0.t, a0.t + .45));
      ctx.save(); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(0,0,0,.85)'; ctx.shadowBlur = 14;
      ctx.beginPath(); ctx.rect(40, 100, 420, 150); ctx.clip();
      const dr = (n, dy, a) => { ctx.globalAlpha = a * oa; ctx.font = FONT.mono(124, 700); ctx.fillStyle = css(PAL.gold); ctx.fillText(String(n), 60, 226 + dy); const w = ctx.measureText(String(n)).width; ctx.font = FONT.serif(52, 700); ctx.fillStyle = css(PAL.ink); ctx.fillText('岁', 60 + w + 14, 222 + dy); };
      if (ai > 0 && roll < 1) dr(ages[ai - 1].age, -roll * 130, 1 - roll);
      dr(a0.age, (1 - roll) * 130, ai === 0 ? roll : 1);
      ctx.restore();
    }
    // 金钉
    const pinIn = t('c1') + .9;
    PINS.forEach((q, k) => {
      const dead = q[3] >= 0 ? ST[q[3]].t + .2 : 1e9, a = seg(time, pinIn + k * .05, pinIn + k * .05 + .3) * (1 - seg(time, dead + .25, dead + .7)) * oa; if (a <= 0) return;
      let wx = q[1], wy = q[2]; if (q[0] === 'ship') { wx = shipNow.x; wy = shipNow.y - 150 * (shipNow.s || 1); }
      const p0 = toScreen(c, wx, wy), hit = seg(time, dead, dead + .25), last = q[0] === 'ship' ? pulse(time, TL.at('c11', '那艘船'), .12, .8) : 0;
      const col = mixc(PAL.gold, PAL.hot, hit), r = 11 + last * 8, y = p0[1] + hit * 26 + Math.sin(time * 2 + k) * 2;
      ctx.save(); ctx.globalAlpha = a; ctx.translate(p0[0], y); ctx.rotate(Math.PI / 4 + hit * 1.2);
      ctx.fillStyle = 'rgba(6,7,12,.8)'; ctx.fillRect(-r - 4, -r - 4, r * 2 + 8, r * 2 + 8); ctx.fillStyle = css(col); ctx.fillRect(-r, -r, r * 2, r * 2); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(-r, -r, r * 2, 5);
      ctx.restore();
    });
    HUD.tag(ctx, 64, 300, '◆ 原来的东西', { a: seg(time, pinIn, pinIn + .4) * oa * (1 - seg(time, t('c10'), t('c10') + .3)), px: 30, col: PAL.gold });
    // “只剩那艘船”
    const la = seg(time, TL.at('c11', '那艘船'), TL.at('c11', '那艘船') + .3) * oa;
    if (la > 0) { const a = toScreen(c, shipNow.x - 70, shipNow.y - 140), b = toScreen(c, shipNow.x + 76, shipNow.y + 8); HUD.bracket(ctx, a[0], a[1], b[0] - a[0], b[1] - a[1], la, { len: 30, lw: 5 }); }
    // “小床早就没了”：原来放小床的地方，虚线框一下
    const cr = env(time, TL.at('c8', '小床') - .05, TL.at('c8', '小床') + .3, TL.at('c8', '墙刷过') - .2, TL.at('c8', '墙刷过') + .2);
    if (cr > 0) { const a = toScreen(c, R_CRIB[0] + 10, R_CRIB[1] + 10), b = toScreen(c, R_CRIB[2] - 10, R_CRIB[3] - 14); ctx.save(); ctx.globalAlpha = cr; ctx.strokeStyle = css(PAL.ink); ctx.lineWidth = 3; ctx.setLineDash([14, 10]); ctx.strokeRect(a[0], a[1], b[0] - a[0], b[1] - a[1]); ctx.restore(); HUD.tag(ctx, a[0], a[1] - 34, '小床', { a: cr, px: 30 }); }
    // “墙刷过三遍”：第几遍
    const w3 = TL.at('c8', '墙刷过'), d3 = ST[9].t - ST[8].t;
    for (let k = 0; k < 3; k++) HUD.tag(ctx, W / 2, 150, `第 ${k + 1} 遍`, { a: env(time, w3 + d3 * k, w3 + d3 * k + .12, w3 + d3 * (k + 1) - .1, w3 + d3 * (k + 1) + (k === 2 ? .5 : 0)), align: 'center', px: 36, col: PAL.gold });
    return {};
  }
  SCENES.push({ name: 'years', t0: t('c1'), draw });
  return { STAGE, finalOpts, cam, old, shipOld };
})();
