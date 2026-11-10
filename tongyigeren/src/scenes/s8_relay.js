// 场景 8（“那你到底是什么？” → 片尾）：还是那条跑道
// 哪一个才是真正的他？——取景框挨个跳，都不是。然后船从七岁手里一个一个往下传，传到“今天”
// 前面两位（还没到的年纪）是深色的剪影：“接棒的那个人，你还不认识”
// 结尾：跑两步，把船递过去，剪影亮起来；镜头推向那艘船，纸浪从下面升起来，回到开头那片海——天快亮了。片名
'use strict';
const S8 = (() => {
  const t = TL.s, te = TL.e, { AGES, TX, TY, TS, runner } = S7;
  const DARK = C('#27325a'), NOW = 3, PD = .7;                          // 剪影的颜色；“今天”是第几个人；一次交接多久
  const passes = () => [TL.at('i6', '交给'), TL.at('i7', '交给'), TL.at('i8', '一直'), TL.at('j8', '递')];
  const tSea = () => te('j8') + 2.2, ENDX = 1430, SHS = .9;            // 结尾：海里的船停在哪；跑道上那艘船的大小
  function state(time) {
    const P = passes(), run = E.io2(seg(time, t('j7') - .1, te('j7') + .25)), xs = TX.slice(); xs[3] = TX[3] + (TX[4] - 196 - TX[3]) * run;
    const giveK = i => i < 4 ? env(time, P[i] - .35, P[i], P[i] + PD, P[i] + PD + .3) : 0, recvK = i => i > 0 && i <= 4 ? env(time, P[i - 1] - .3, P[i - 1], P[i - 1] + PD, P[i - 1] + PD + .35) : 0;
    let holder = 0; P.forEach((p, k) => { if (time >= p + PD) holder = k + 1; });
    const has = t('i5') - .1;
    const people = AGES.map((a, i) => {
      const gk = giveK(i), rk = recvK(i), holding = time >= has && holder === i ? 1 : 0;
      return runner(i, { x: xs[i], y: TY - (i === 3 && run > 0 && run < 1 ? Math.abs(Math.sin(run * Math.PI * 5)) * 10 : 0), armR: [lerp(holding ? 30 : 8, 86, gk), lerp(holding ? -96 : 0, 4, gk)], armL: [lerp(8, 86, rk), lerp(0, 4, rk)], armsFront: holding || gk > 0 });
    });
    const geo = people.map(personGeo), hold = i => [geo[i].handR[0] + 14, geo[i].handR[1] + 26];
    let ship = null;
    if (time >= has) {
      let pos = hold(holder), k = -1; P.forEach((p, i) => { if (time >= p && time < p + PD + .35) k = i; });
      if (k >= 0) {
        const u = seg(time, P[k], P[k] + PD), a = [geo[k].handR[0] + 20, geo[k].handR[1] + 24], b = [geo[k + 1].handL[0] - 16, geo[k + 1].handL[1] + 24];
        if (u < 1) { const e = E.io(u); pos = [lerp(a[0], b[0], e), lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * 34]; }
        else { const e = E.io(seg(time, P[k] + PD, P[k] + PD + .35)), h = hold(k + 1); pos = [lerp(b[0], h[0], e), lerp(b[1], h[1], e)]; }
      }
      ship = Object.assign({ x: pos[0], y: pos[1], s: SHS, glow: .5 + .3 * seg(time, t('j7'), te('j7')) }, SHIP_NEW);
    }
    return { people, geo, ship, holder, xs, P };
  }
  function draw(ctx, time) {
    const S = state(time), P = S.P;
    const hopN = Math.floor((time - t('i3')) / .36), hop = time >= t('i3') && time < t('i4') ? hopN % 6 : -1;
    const none = seg(time, t('i4'), t('i4') + .3) * (1 - seg(time, t('i5') - .2, t('i5') + .2));               // “都不是”：全暗一下
    const past = seg(time, TL.at('j3', '交棒') - .1, TL.at('j3', '交棒') + .5);                                   // “他已经交棒了”：前面几位退到暗处
    const spot27 = env(time, t('j1'), t('j1') + .3, t('j3') - .1, TL.at('j3', '交棒') + .2);
    const tUn = TL.at('i8', '一个') - .2, unk = [0, 0, 0, 0, seg(time, tUn, tUn + .8) * (1 - seg(time, P[3] + .1, P[3] + 1.1)), seg(time, tUn + .15, tUn + .95)];   // 后两位变成“还不认识的人”
    const sweep = i => pulse(time, t('i2') + i * .16, .15, .5);
    const people = S.people.map((p, i) => { let dim = none * .5 + (i < NOW ? past * .5 * (1 - (i === 2 ? spot27 : 0)) : 0); if (i < NOW && time >= t('i5') && time < t('j1') && i > S.holder) dim = Math.max(dim, .3); return Object.assign({}, p, { dim: sat(dim) }); });
    const light = AGES.map((a, i) => { let l = .5 + sweep(i) * .6 + (hop === i ? .7 : 0); l *= 1 - none * .9; if (time >= t('i5')) l = i === S.holder ? 1 : (i < S.holder ? .35 * (1 - past) : 0); if (i === 2) l = Math.max(l, spot27); return l; });
    // 结尾：镜头推向船，纸浪升起来
    const rise = seg(time, tSea(), tSea() + 1.5), fin = S.ship || { x: TX[4], y: TY - 200 };
    const end = { z: S1.SEA.s / SHS, x: fin.x - (ENDX - W / 2) / (S1.SEA.s / SHS), y: fin.y - (S1.SEA.y + 14 - H / 2) / (S1.SEA.s / SHS) }, cam = camMix(CAM0, end, E.io(seg(rise, 0, .8)));
    if (rise < 1) {
      camApply(ctx, cam);
      S7.paintTrack(ctx, { people: people.filter((p, i) => unk[i] < .999), ships: [], light: light.filter((l, i) => unk[i] < .999), time });
      // 还不认识的人：深色剪影
      S.people.forEach((p, i) => { if (unk[i] > 0.01) drawPerson(ctx, Object.assign({}, p, { mono: DARK, alpha: unk[i], flat: unk[i] < .999 })); });
      if (unk[4] > 0.01) drawPerson(ctx, people[NOW]);                       // 今天的他伸手递船时，手臂要在剪影前面
      // 金线：船走过的路
      if (S.ship) {
        const pts = []; for (let i = 0; i < S.holder; i++) pts.push([S.geo[i].handR[0] + 14, S.geo[i].handR[1] - 4]); pts.push([S.ship.x, S.ship.y - 30 * SHS]);
        ctx.save(); ctx.globalAlpha = (.6 + .35 * pulse(time, t('i10'), .15, 1.2)) * (1 - rise * 2 > 0 ? 1 - rise * 2 : 0); ctx.strokeStyle = css(PAL.gold); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.setLineDash([1, 15]);
        ctx.beginPath(); pts.forEach((q, i) => { if (!i) ctx.moveTo(q[0], q[1]); else { const p0 = pts[i - 1]; ctx.quadraticCurveTo((p0[0] + q[0]) / 2, Math.min(p0[1], q[1]) - 70, q[0], q[1]); } }); ctx.stroke(); ctx.restore();
        drawShip(ctx, S.ship.x, S.ship.y, S.ship.s, S.ship);
      }
      camReset(ctx);
    }
    if (rise > 0) {
      S1.paintSea(ctx, time, { calm: 1, sx: ENDX, drop: 1 - rise, ship: rise >= 1, still: 1 - seg(time, tSea() + 1.5, tSea() + 3) });
      if (rise < 1 && S.ship) { camApply(ctx, cam); drawShip(ctx, S.ship.x, S.ship.y, S.ship.s, Object.assign({}, S.ship, { glow: .6 })); camReset(ctx); }
    }
    const la = 1 - seg(rise, 0, .25);
    if (la > 0) {
      S7.trackLabels(ctx, time, { a: la, dx: S.xs.map((x, i) => x - TX[i]) });
      // “哪一个，才是真正的他？”
      if (hop >= 0) { const G = S.geo[hop]; HUD.bracket(ctx, G.cx - 100, G.top - 26, 200, TY - G.top + 44, seg(time, t('i3') + hopN * .36, t('i3') + hopN * .36 + .16), { len: 38, lw: 7 }); }
      HUD.label(ctx, S.xs[3], S.geo[3].top - 62, '今天', { a: seg(time, TL.at('i8', '今天'), TL.at('i8', '今天') + .3) * (1 - seg(time, t('j4') - .2, t('j4'))) * la, align: 'center', px: 44, tone: 'gold', serif: 1 });
      HUD.label(ctx, TX[2], S.geo[2].top - 62, '十年前', { a: env(time, TL.at('j1', '十年前'), TL.at('j1', '十年前') + .25, TL.at('j3', '交棒') + .3, TL.at('j3', '交棒') + .8) * la, align: 'center', px: 44, serif: 1 });
      HUD.label(ctx, TX[4], S.geo[4].top - 62, '十年后', { a: env(time, TL.at('j4', '十年后'), TL.at('j4', '十年后') + .25, P[3] - .5, P[3] - .2) * la, align: 'center', px: 44, serif: 1 });
      // “把话说死”：今天的他又想说那句话——划掉
      const sayA = env(time, TL.at('j4', '把话') - .5, TL.at('j4', '把话') - .2, te('j4') + .5, t('j5'));
      if (sayA > 0) { const G = S.geo[3], by = G.top - 76; S7.bubble(ctx, G.headC[0], by, '我就是这样的人', sayA * la); const st = E.out(seg(time, TL.at('j4', '说死') - .05, TL.at('j4', '说死') + .35)); if (st > 0) { ctx.save(); ctx.globalAlpha = sayA * la; ctx.strokeStyle = css(PAL.hot); ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(G.headC[0] - 160, by); ctx.lineTo(G.headC[0] - 160 + 320 * st, by); ctx.stroke(); ctx.restore(); } }
      // “接棒的那个人，你还不认识”
      HUD.big(ctx, [{ s: '？', col: PAL.gold }], TX[4], S.geo[4].sh + 150, 150, { a: env(time, TL.at('j5', '还不认识') - .1, TL.at('j5', '还不认识') + .2, t('j6') + .2, t('j6') + .6) * la });
      // 两句大字
      const b9 = env(time, t('i9') - .05, t('i9') + .2, t('i10') - .25, t('i10') - .05), b10 = env(time, t('i10') - .05, t('i10') + .2, t('j1') - .9, t('j1') - .4);
      if (b9 > 0) HUD.big(ctx, [{ s: '你' }, { s: '不是一个人', col: mixc(PAL.ink, PAL.hot, seg(time, TL.at('i9', '不是'), TL.at('i9', '不是') + .15)) }], W / 2, 270 - (1 - E.out(sat(b9))) * 12, 160, { a: b9 * la });
      if (b10 > 0) HUD.big(ctx, [{ s: '你是一场' }, { s: '接力', col: mixc(PAL.ink, PAL.gold, seg(time, TL.at('i10', '接力'), TL.at('i10', '接力') + .15)) }], W / 2, 270 - (1 - E.out(sat(b10))) * 12, 160, { a: b10 * la });
    }
    // 片名
    const fade = seg(time, TL.total - 1.2, TL.total - .1);
    if (rise >= 1) { const t0 = tSea() + 1.9; '同一个人'.split('').forEach((ch, i) => { const k = E.out(seg(time, t0 + i * .22, t0 + i * .22 + .7)); HUD.big(ctx, ch, 590 + (i - 1.5) * 240, 400 + (1 - k) * 24, 210, { a: k }); }); const lw = 130 * E.out(seg(time, t0 + 1.2, t0 + 1.9)); if (lw > 1) { ctx.fillStyle = css(PAL.gold); ctx.fillRect(590 - lw / 2, 474, lw, 7); } }
    veil(ctx, Math.max(1 - seg(time, t('i1') - .05, t('i1') + .1) * 1, fade));
    return { band: 1 - rise * .5 };
  }
  SCENES.push({ name: 'relay', t0: t('i1') - .05, draw });
  return {};
})();
