// 场景 8（“那你到底是什么？” → 片尾）：还是那条跑道
// 哪一个才是真正的他？——取景框挨个跳，都不是。然后船从七岁手里一个一个往下传，传到“今天”
// 前面两位（还没到的年纪）是没亮的剪影：“接棒的那个人，你还不认识”
// 结尾：跑好这一棒，递过去，剪影亮起来；画面从船身翻成一片天快亮的海，片名
'use strict';
const S8 = (() => {
  const g = G6, t = TL.s, te = TL.e, { AGES, TX, TY, TS, runner } = S7;
  const DARK = [34, 42, 72], NOW = 3;                                   // “今天”是第几个人
  const PD = .7;                                                         // 一次交接多久
  const passes = () => [TL.at('i6', '交给'), TL.at('i7', '交给'), TL.at('i8', '一直'), TL.at('j8', '递')];
  const tSea = () => te('j8') + 2.3, ENDX = 1430;                    // 结尾那片海里，船停在右边，左边留给片名
  function state(time) {
    const P = passes(), run = E.io2(seg(time, t('j7') - .1, te('j7') + .25)), x3 = TX[3] + (TX[4] - 196 - TX[3]) * run;
    const xs = TX.slice(); xs[3] = x3;
    const giveK = i => i < 4 ? env(time, P[i] - .35, P[i], P[i] + PD, P[i] + PD + .3) : 0, recvK = i => i > 0 && i <= 4 ? env(time, P[i - 1] - .3, P[i - 1], P[i - 1] + PD, P[i - 1] + PD + .35) : 0;
    let holder = 0; P.forEach((p, k) => { if (time >= p + PD) holder = k + 1; });
    const has = t('i5') - .1;
    const people = AGES.map((a, i) => {
      const gk = giveK(i), rk = recvK(i), holding = time >= has && holder === i ? 1 : 0;
      const armR = [lerp(holding ? 30 : 8, 86, gk), lerp(holding ? -96 : 0, 4, gk)], armL = [lerp(8, 86, rk), lerp(0, 4, rk)];
      return runner(i, { x: xs[i], y: TY - (i === 3 ? Math.abs(Math.sin(run * Math.PI * 5)) * 10 * (run > 0 && run < 1 ? 1 : 0) : 0), armR, armL, armsFront: holding || gk > 0 });
    });
    const geo = people.map(personGeo), hold = i => [geo[i].handR[0] + 14, geo[i].handR[1] + 26];
    // 船在哪
    let ship = null;
    if (time >= has) {
      let pos = hold(holder), k = -1; P.forEach((p, i) => { if (time >= p && time < p + PD + .35) k = i; });
      if (k >= 0) {
        const u = seg(time, P[k], P[k] + PD), a = [geo[k].handR[0] + 20, geo[k].handR[1] + 24], b = [geo[k + 1].handL[0] - 16, geo[k + 1].handL[1] + 24];
        if (u < 1) { const e = E.io(u); pos = [lerp(a[0], b[0], e), lerp(a[1], b[1], e) - Math.sin(Math.PI * u) * 34]; }
        else { const e = E.io(seg(time, P[k] + PD, P[k] + PD + .35)), h = hold(k + 1); pos = [lerp(b[0], h[0], e), lerp(b[1], h[1], e)]; }
      }
      ship = Object.assign({ x: pos[0], y: pos[1], s: .86, glow: .5 + .3 * seg(time, t('j7'), te('j7')) }, SHIP_NEW);
    }
    return { people, geo, ship, holder, xs, hold, P };
  }
  function draw(ctx, time) {
    const S = state(time), P = S.P;
    g.reset();
    const hop = time >= t('i3') && time < t('i4') ? Math.floor((time - t('i3')) / .36) % 6 : -1;
    const none = seg(time, t('i4'), t('i4') + .3) * (1 - seg(time, t('i5') - .2, t('i5') + .2));               // “都不是”：全暗一下
    const past = seg(time, TL.at('j3', '交棒') - .1, TL.at('j3', '交棒') + .5);                                   // “他已经交棒了”：前面几位退到暗处
    const spot27 = env(time, t('j1'), t('j1') + .3, t('j3') - .1, TL.at('j3', '交棒') + .2);
    const tUn = TL.at('i8', '一个') - .2, unlit = seg(time, tUn, tUn + .8), tRev = P[3] + .1, rev = seg(time, tRev, tRev + 1.0);
    const sweep = i => pulse(time, t('i2') + i * .16, .15, .5);
    const mk = (ver) => S.people.map((p, i) => {
      const q = Object.assign({}, p);
      let dim = none * .55 + (i < NOW ? past * .5 * (1 - (i === 2 ? spot27 : 0)) : 0);
      if (i < NOW && time >= t('i5') && time < t('j1')) dim = Math.max(dim, i > S.holder ? .3 : 0);
      if (i === 4 && ver === 'unlit') q.mono = DARK; else if (i === 5 && (ver === 'unlit' || ver === 'half')) q.mono = DARK;
      q.dim = sat(dim); return q;
    });
    const light = AGES.map((a, i) => { let l = .5 + sweep(i) * .6 + (hop === i ? .7 : 0); l *= 1 - none * .9; if (time >= t('i5')) l = i === S.holder ? 1 : (i < S.holder ? .35 * (1 - past) : 0); if (i === 2) l = Math.max(l, spot27); if (i === 4 && rev > 0) l = Math.max(l, rev); return l; });
    const rectOf = i => [Math.floor((S.xs[i] - 130) / 6), 50, Math.ceil((S.xs[i] + 130) / 6), 140];
    const base = { ships: S.ship ? [S.ship] : [], light, time };
    if (time < tUn) S7.paintTrack(g.begin('a', S7.TRACKCAM), Object.assign({ people: mk('lit') }, base));
    else if (unlit < 1) { S7.paintTrack(g.begin('a', S7.TRACKCAM), Object.assign({ people: mk('lit') }, base)); S7.paintTrack(g.begin('b', S7.TRACKCAM), Object.assign({ people: mk('unlit') }, base)); Flip.scatter(g, unlit, { rect: rectOf(4), dur: .3, seed: 4 }); const ph = new Float32Array(g.phase); Flip.scatter(g, unlit, { rect: rectOf(5), dur: .3, seed: 5 }); for (let i = 0; i < g.n; i++) g.phase[i] = Math.max(g.phase[i], ph[i]); }
    else if (time < tRev) S7.paintTrack(g.begin('a', S7.TRACKCAM), Object.assign({ people: mk('unlit') }, base));
    else { S7.paintTrack(g.begin('a', S7.TRACKCAM), Object.assign({ people: mk('unlit') }, base)); S7.paintTrack(g.begin('b', S7.TRACKCAM), Object.assign({ people: mk('half') }, base)); const hp = g.cell(S.geo[4].handL[0], S.geo[4].handL[1]); Flip.wave(g, rev, { rect: rectOf(4), ox: hp[0], oy: hp[1], width: 8, rnd: 6 }); }
    // 结尾：从船身翻成海
    const seaK = seg(time, tSea(), tSea() + 1.3), inSea = seaK >= 1;
    if (seaK > 0) {
      g.bake();
      S1.paintSea(g.begin('b'), time, 1, ENDX);
      const sp = S.ship ? g.cell(S.ship.x, S.ship.y - 50) : [160, 90];
      Flip.wave(g, seaK, { ox: sp[0], oy: sp[1], width: 18, rnd: 8 });
    }
    const fade = seg(time, TL.total - 1.2, TL.total - .1);
    Post.blit(ctx, g.present({}), .42); Post.dust(ctx, time, { a: .5 });
    const la = 1 - seg(seaK, 0, .4);
    if (la > 0) {
      // 金线：船走过的路
      if (S.ship) {
        const pts = []; for (let i = 0; i <= S.holder; i++) pts.push(i === S.holder ? [S.ship.x, S.ship.y - 30] : [S.geo[i].handR[0] + 14, S.geo[i].handR[1] - 4]);
        const k = P.findIndex(p => time >= p && time < p + PD + .35); if (k >= 0 && k === S.holder) pts.push([S.ship.x, S.ship.y - 30]);
        ctx.save(); ctx.globalAlpha = la * (.55 + .35 * pulse(time, t('i10'), .15, 1.2)); ctx.strokeStyle = css(PAL.gold); ctx.lineWidth = 5; ctx.lineCap = 'round'; ctx.setLineDash([2, 12]);
        ctx.beginPath(); pts.forEach((q, i) => { if (!i) ctx.moveTo(q[0], q[1]); else { const p0 = pts[i - 1]; ctx.quadraticCurveTo((p0[0] + q[0]) / 2, Math.min(p0[1], q[1]) - 70, q[0], q[1]); } }); ctx.stroke(); ctx.restore();
      }
      S7.trackLabels(ctx, time, { a: la, dx: S.xs.map((x, i) => x - TX[i]) });
      // “哪一个，才是真正的他？”
      if (hop >= 0) { const G = S.geo[hop]; HUD.bracket(ctx, G.cx - 96, G.top - 24, 192, TY - G.top + 40, seg(time, t('i3') + Math.floor((time - t('i3')) / .36) * .36, t('i3') + Math.floor((time - t('i3')) / .36) * .36 + .16), { len: 34, lw: 6 }); }
      // “今天”
      const today = seg(time, TL.at('i8', '今天'), TL.at('i8', '今天') + .3) * la;
      HUD.tag(ctx, S.xs[3], S.geo[3].top - 60, '今天', { a: today * (1 - seg(time, t('j4') - .2, t('j4'))), align: 'center', px: 40, col: PAL.gold, serif: 1, w: 900 });
      HUD.tag(ctx, TX[2], S.geo[2].top - 60, '十年前', { a: env(time, TL.at('j1', '十年前'), TL.at('j1', '十年前') + .25, TL.at('j3', '交棒') + .3, TL.at('j3', '交棒') + .8) * la, align: 'center', px: 40, col: PAL.ink, serif: 1, w: 900 });
      HUD.tag(ctx, TX[4], S.geo[4].top - 150, '十年后', { a: env(time, TL.at('j4', '十年后'), TL.at('j4', '十年后') + .25, t('j6') - .2, t('j6')) * la, align: 'center', px: 40, col: PAL.ink, serif: 1, w: 900 });
      // “把话说死”：今天的他又想说那句话——划掉
      const sayA = env(time, TL.at('j4', '把话') - .5, TL.at('j4', '把话') - .2, te('j4') + .5, t('j5'));
      if (sayA > 0) { const G = S.geo[3], by = G.top - 70; S7.bubble(ctx, G.headC[0], by, '我就是这样的人', sayA * la); const st = E.out(seg(time, TL.at('j4', '说死') - .05, TL.at('j4', '说死') + .35)); if (st > 0) { ctx.save(); ctx.globalAlpha = sayA * la; ctx.strokeStyle = css(PAL.hot); ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(G.headC[0] - 150, by); ctx.lineTo(G.headC[0] - 150 + 300 * st, by); ctx.stroke(); ctx.restore(); } }
      // “接棒的那个人，你还不认识”
      const qa = env(time, TL.at('j5', '还不认识') - .1, TL.at('j5', '还不认识') + .2, t('j6') + .2, t('j6') + .6) * la;
      if (qa > 0) HUD.big(ctx, [{ s: '？', col: PAL.gold }], TX[4], S.geo[4].sh + 150, 150, { a: qa });
      // 两句大字
      const b9 = env(time, t('i9') - .05, t('i9') + .2, t('i10') - .25, t('i10') - .05), b10 = env(time, t('i10') - .05, t('i10') + .2, t('j1') - .9, t('j1') - .4);
      if (b9 > 0) HUD.big(ctx, [{ s: '你' }, { s: '不是一个人', col: mixc(PAL.ink, PAL.hot, seg(time, TL.at('i9', '不是'), TL.at('i9', '不是') + .15)) }], W / 2, 250 - (1 - E.out(sat(b9))) * 12, 150, { a: b9 * la });
      if (b10 > 0) HUD.big(ctx, [{ s: '你是一场' }, { s: '接力', col: mixc(PAL.ink, PAL.gold, seg(time, TL.at('i10', '接力'), TL.at('i10', '接力') + .15)) }], W / 2, 250 - (1 - E.out(sat(b10))) * 12, 150, { a: b10 * la });
    }
    // 片名
    if (seaK > .6) {
      const t0 = tSea() + 1.6;
      ctx.save(); ctx.font = FONT.serif(210, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.7)'; ctx.shadowBlur = 30;
      '同一个人'.split('').forEach((ch, i) => { const k = E.out(seg(time, t0 + i * .22, t0 + i * .22 + .7)); ctx.globalAlpha = k * (1 - fade); ctx.fillStyle = css(PAL.ink); ctx.fillText(ch, 620 + (i - 1.5) * 250, 330 + (1 - k) * 24); });
      ctx.shadowBlur = 0; ctx.globalAlpha = E.out(seg(time, t0 + 1.2, t0 + 1.9)) * (1 - fade); ctx.fillStyle = css(PAL.gold); const lw = 120 * E.out(seg(time, t0 + 1.2, t0 + 1.9)); ctx.fillRect(620 - lw / 2, 480, lw, 6);
      ctx.restore();
    }
    if (fade > 0) { ctx.fillStyle = `rgba(4,5,9,${fade})`; ctx.fillRect(0, 0, W, H); }
    return { noCorner: seaK > 0, band: 1 - seaK * .6 };
  }
  SCENES.push({ name: 'relay', t0: t('i1') - .05, draw });
  return {};
})();
