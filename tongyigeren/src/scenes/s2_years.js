// 场景 2（十七岁 → 七十七岁）：同一间屋子。每到一个年纪，屋里的东西一样接一样翻面，人接着往下长
// 最后一句“只剩那艘船”：屋里的一切褪成灰色，只有船还有颜色
'use strict';
const S2 = (() => {
  const t = TL.s, te = TL.e, BOY = S1.BOY, SEAT = BED.top - 14, AC = [620, 686];                       // 坐床沿的高度；扶手椅的坐面
  const DUSK = { amb: .86, tint: [96, 62, 84], win: .6, winCol: [255, 186, 140], lamp: .7 }, GREY = { amb: .92, tint: [74, 80, 96], win: .5, winCol: [222, 230, 242], lamp: .4 };
  const sitBed = (who, x, o) => Object.assign({ who, x, y: SEAT, s: PS, sit: 1, layer: 'bed', armR: [14, -46], armL: [14, -46], armsFront: 1 }, o);
  const stand = who => ({ who, x: 812, y: 842, s: PS, armL: [64, 36], armR: [10, 4] });
  const inChair = (who, o) => Object.assign({ who, x: AC[0], y: AC[1], s: PS, sit: 1, armR: [14, -46], armL: [14, -46], armsFront: 1 }, o);
  const held37 = () => { const G = personGeo(stand(37)); return { x: G.handL[0] - 34, y: G.handL[1] + 10, s: .86, layer: 'front' }; };
  const lap = { x: AC[0] + 2, y: AC[1] + 52, s: .92, layer: 'front' }, onRug = { x: S1.REST[0], y: S1.REST[1], s: S1.SHIP_S, layer: 'front' };
  const teen = { who: 17, x: BOY.x, y: BOY.y, s: PS, floor: 1, armR: [46, 26], armL: [16, 6], lean: 6 };
  const teen2 = Object.assign({}, teen, { armR: [14, 4], lean: 0 });
  // 每一步之后屋里的样子
  const STAGE = [
    { S: ERA.v1, me: teen, ship: onRug, light: DAY },
    { S: ERA.v17a, me: teen2, ship: shipAt(), light: DUSK },
    { S: ERA.v17, me: teen2, ship: shipAt(), light: DUSK },
    { S: ERA.v27a, me: sitBed(27, 1330), ship: shipAt(), light: DAY },
    { S: ERA.v27, me: sitBed(27, 1330), ship: shipAt(), light: DAY },
    { S: ERA.v27, me: sitBed(27, 1330), partner: sitBed('partner', 1466), ship: shipAt(), light: DAY },
    { S: ERA.v37a, me: stand(37), partner: sitBed('partner', 1400), ship: held37(), light: DAY },
    { S: ERA.v37, me: stand(37), partner: sitBed('partner', 1400), ship: held37(), light: DAY },
    { S: ERA.v57a, me: Object.assign(stand(57), { armL: [10, 4] }), partner: sitBed('partnerOld', 1400), ship: shipAt(), light: DAY },
    { S: era(ERA.v57, { wall: ERA.v37.wall }), me: inChair(57), partner: sitBed('partnerOld', 1400), ship: shipAt(), light: DAY },
    { S: ERA.v57b, me: inChair(57), partner: sitBed('partnerOld', 1400), ship: shipAt(), light: DAY },
    { S: ERA.v57c, me: inChair(57), partner: sitBed('partnerOld', 1400), ship: shipAt(), light: DAY },
    { S: ERA.v57, me: inChair(57), partner: sitBed('partnerOld', 1400), ship: shipAt(), light: DAY },
    { S: ERA.v77, me: inChair(77, { armR: [26, -72], armL: [26, -72] }), partner: sitBed('partnerOld', 1400), ship: lap, light: GREY },
  ];
  // 每一步什么时候开始、用多久
  function steps() {
    const w3 = TL.at('c8', '墙刷过'), d3 = Math.max(.34, (te('c8') + .5 - w3) / 3);
    return [
      { t: t('c1'), d: 1.1, age: 17 }, { t: TL.at('c2', '换成') - .1, d: .6 },
      { t: t('c3'), d: 1.1, age: 27 }, { t: t('c4'), d: .7 }, { t: TL.at('c4', '多了'), d: .6 },
      { t: t('c5'), d: 1.1, age: 37 }, { t: TL.at('c6', '多了'), d: .7 },
      { t: t('c7'), d: 1.1, age: 57 }, { t: TL.at('c8', '小床') - .1, d: .8 },
      { t: w3, d: d3 * .9 }, { t: w3 + d3, d: d3 * .9 }, { t: w3 + d3 * 2, d: d3 * .9 },
      { t: t('c9'), d: 1.2, age: 77 },
    ];
  }
  const ORDER = ['sky', 'curtain', 'chair', 'art', 'rug', 'toy', 'lamp', 'quilt', 'bed', 'wall'];
  const lerpA = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k)];
  // 一个人从上一步到这一步：原地不动就接着长；换了位置或姿势就这边淡出、那边淡入
  function person(a, b, p, out) {
    if (!a && !b) return;
    if (!a) { const k = E.back(seg(p, .35, 1)); if (k > 0) out.push(Object.assign({}, b, { s: b.s * Math.max(.02, k), alpha: sat(k * 2) })); return; }
    if (!b) { const k = 1 - E.in(seg(p, 0, .5)); if (k > 0) out.push(Object.assign({}, a, { s: a.s * Math.max(.02, k), alpha: sat(k * 2) })); return; }
    const mix = { a: a.who, b: b.who, k: E.io2(p) }, same = a.x === b.x && a.y === b.y && !!a.sit === !!b.sit && !!a.floor === !!b.floor;
    const base = Object.assign({}, p < .5 ? a : b, { mix, who: undefined });
    if (same) { out.push(Object.assign(base, { armL: lerpA(a.armL, b.armL, E.io(p)), armR: lerpA(a.armR, b.armR, E.io(p)) })); return; }
    const q = seg(p, .25, .75);
    if (q < 1) out.push(Object.assign({}, a, { mix, who: undefined, alpha: 1 - q }));
    if (q > 0) out.push(Object.assign({}, b, { mix, who: undefined, alpha: q }));
  }
  function build(i, p, time) {
    const A = STAGE[i], B = STAGE[Math.min(STAGE.length - 1, i + 1)];
    if (p <= 0) return { S: A.S, people: [A.partner, A.me].filter(Boolean), ship: A.ship, light: A.light };
    const km = {}; ORDER.forEach((key, k) => { km[key] = seg(p, k * .05, k * .05 + .55); });
    const people = []; person(A.partner, B.partner, p, people); person(A.me, B.me, p, people);
    const e = E.io(p), ship = Object.assign({}, p < .5 ? A.ship : B.ship, { x: lerp(A.ship.x, B.ship.x, e), y: lerp(A.ship.y, B.ship.y, e) - Math.sin(Math.PI * p) * (Math.abs(A.ship.x - B.ship.x) > 40 ? 150 : 0), s: lerp(A.ship.s, B.ship.s, e), tilt: Math.sin(Math.PI * p) * -.2 * Math.sign(B.ship.x - A.ship.x || 0) });
    if (A.ship.layer !== B.ship.layer) ship.layer = 'front';
    const L = {}; for (const key of ['amb', 'win', 'lamp']) L[key] = lerp(A.light[key], B.light[key], p); L.tint = B.light.tint || A.light.tint; L.winCol = p < .5 ? A.light.winCol : B.light.winCol;
    return { S: blendEra(A.S, B.S, km, 'flip'), people, ship, light: L };
  }
  const FINAL = { z: 2.3, x: AC[0] + 150, y: 640 };
  function cam(time) {
    const c = camMix(S1.cam(t('c1')), ROOMCAM, E.io(seg(time, t('c1') - .05, t('c1') + 1.1)));
    return camMix(c, FINAL, E.io(seg(time, t('c10') - .2, te('c11') + .5)));
  }
  function draw(ctx, time) {
    const ST = steps(), c = cam(time);
    let i = -1; for (let k = 0; k < ST.length; k++) if (ST[k].t <= time) i = k;
    const o = i < 0 ? build(0, 0, time) : build(i, seg(time, ST[i].t, ST[i].t + ST[i].d), time);
    const only = E.io2(seg(time, t('c10'), TL.at('c11', '那艘船') + .3));                                   // “原来的东西，只剩那艘船”
    const ship = Object.assign({}, o.ship, only > 0 ? { top: 1, glow: only * .8 } : {});
    camApply(ctx, c);
    paintRoom(ctx, { S: o.S, people: o.people, ships: [ship], light: Object.assign({}, o.light, { amb: o.light.amb * (1 - only * .42) }), grey: only * .92, time });
    camReset(ctx);
    const outK = seg(time, t('d1') - .4, t('d1') - .03);
    // ---------- 标签 ----------
    // 年纪：右上角的大数字，换年纪时滚一下
    const ages = ST.filter(s => s.age); let ai = -1; ages.forEach((s, k) => { if (s.t <= time) ai = k; });
    if (ai >= 0) {
      const a0 = ages[ai], roll = E.out(seg(time, a0.t, a0.t + .5)), fa = 1 - seg(time, t('c10') - .1, t('c10') + .4);
      ctx.save(); ctx.beginPath(); ctx.rect(1300, 60, 620, 210); ctx.clip(); ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(20,12,8,.5)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 5;
      const dr = (n, dy, a) => { ctx.globalAlpha = a * fa; ctx.textAlign = 'right'; ctx.font = FONT.serif(64, 900); ctx.fillStyle = css(PAL.ink); ctx.fillText('岁', 1830, 226 + dy); ctx.font = FONT.mono(170, 700); ctx.fillStyle = css(PAL.ink); ctx.fillText(String(n), 1750, 232 + dy); };
      if (ai > 0 && roll < 1) dr(ages[ai - 1].age, -roll * 190, 1 - roll);
      dr(a0.age, (1 - roll) * 190, ai === 0 ? roll : 1);
      ctx.restore();
    }
    // “墙刷过三遍”：第几遍
    const w3 = ST[9].t, d3 = ST[10].t - ST[9].t;
    for (let k = 0; k < 3; k++) HUD.label(ctx, W / 2, 96, `墙 · 第 ${k + 1} 遍`, { a: env(time, w3 + d3 * k, w3 + d3 * k + .12, w3 + d3 * (k + 1) - .1, w3 + d3 * (k + 1) + (k === 2 ? .5 : 0)), align: 'center', px: 40 });
    veil(ctx, outK);
    return {};
  }
  SCENES.push({ name: 'years', t0: t('c1'), draw });
  return { STAGE, cam, AC };
})();
