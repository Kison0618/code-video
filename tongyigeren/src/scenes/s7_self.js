// 场景 7（“东西换了。身体换了” → “没有一次说对”）
// A 清单：东西 / 身体 / 记忆，三样的图标从金色（原来的）一块块翻成别的颜色
// B “我”：三十七岁的他站在台上，身上别着“脾气”“喜好”“什么样的人”
// C 研究：一万九千块木板 = 一万九千人；再排成一张图：上面是“回头看变了多少”，下面是“往前看还会变多少”
// D 跑道：六个年纪的他各自站在自己的“终点线”上（最终版）——没有一条是真的终点
'use strict';
const S7 = (() => {
  const t = TL.s, te = TL.e;
  function stage(ctx, cx, tint) {
    fs(ctx, C('#07080d')); ctx.fillRect(0, 0, W, H);
    let gr = ctx.createRadialGradient(cx, 520, 60, cx, 520, 1000); gr.addColorStop(0, css(tint || [56, 66, 96], .46)); gr.addColorStop(.6, css(tint || [26, 30, 48], .16)); gr.addColorStop(1, 'rgba(7,8,13,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
  }

  // ---------- A 清单 ----------
  const ROWS = [['东西', '换了', 'h1', '东西'], ['身体', '换了', 'h1', '身体'], ['记忆', '改了', 'h2', '记忆']], RY = [270, 500, 730], IX = 560;
  function icons(ctx, gold) {
    const g1 = PAL.gold, g2 = PAL.goldDeep, g3 = mul(PAL.gold, .6), K = 1.25, m = ctx.getTransform();
    const zoom = cy => { ctx.setTransform(m); ctx.translate(IX, cy); ctx.scale(K, K); ctx.translate(-IX, -cy); };
    // 小屋
    let y = RY[0]; zoom(y); fs(ctx, gold ? g2 : C('#3b3340')); poly(ctx, [IX - 120, y - 10, IX, y - 96, IX + 120, y - 10]);
    fs(ctx, gold ? g1 : C('#c9a089')); ctx.fillRect(IX - 96, y - 10, 192, 96); fs(ctx, gold ? g3 : C('#86c0ea')); ctx.fillRect(IX - 70, y + 14, 60, 48); fs(ctx, gold ? g3 : C('#2f4b80')); ctx.fillRect(IX + 14, y + 38, 66, 48);
    // 人
    zoom(RY[1]); drawPerson(ctx, { who: 27, x: IX, y: RY[1] + 92, s: .56, noShadow: 1, mono: gold ? g1 : null });
    // 记忆卡片
    y = RY[2]; zoom(y); fs(ctx, gold ? g1 : C('#e9e2d0')); ctx.fillRect(IX - 100, y - 66, 200, 132); fs(ctx, gold ? g2 : C('#ffc45a')); ctx.fillRect(IX - 100, y - 66, 200, 14);
    for (let k = 0; k < 9; k++) { fs(ctx, gold ? g3 : (k === 4 || k === 7 ? PAL.hot : C('#4a4a55'))); ctx.fillRect(IX - 78 + (k % 3) * 56, y - 34 + Math.floor(k / 3) * 30, k % 2 ? 44 : 30, 14); }
    ctx.setTransform(m);
  }
  function drawList(ctx, time) {
    const g = G12; g.reset();
    stage(g.begin('a'), 700); icons(g.xa, true); stage(g.begin('b'), 700); icons(g.xb, false);
    ROWS.forEach((r, k) => { const t0 = TL.at(r[2], r[3]) + .1; Flip.scatter(g, seg(time, t0, t0 + .9), { rect: [Math.floor((IX - 150) / 12), Math.floor((RY[k] - 110) / 12), Math.ceil((IX + 150) / 12), Math.ceil((RY[k] + 110) / 12)], dur: .25, seed: k + 1 }); });
    const inK = seg(time, t('h1') - .1, t('h1') + .45); if (inK < 1) g.fromBlack(inK);
    const outK = seg(time, t('h3') - .5, t('h3') - .1); if (outK > 0) g.toBlack(outK);
    Post.blit(ctx, g.present({ flash: PAL.hot }), .42);
    const oa = seg(inK, .5, 1) * (1 - outK);
    ROWS.forEach((r, k) => {
      const t0 = TL.at(r[2], r[3]), a = seg(time, t0 - .1, t0 + .15) * oa, done = E.back(seg(time, t0 + .35, t0 + .7));
      HUD.big(ctx, r[0], 800, RY[k] + 40, 120, { a, left: 1 });
      if (done > 0) { ctx.save(); ctx.translate(1180, RY[k] + 6); ctx.scale(sat(done) * .2 + .8, sat(done) * .2 + .8); HUD.big(ctx, [{ s: r[1], col: PAL.hot }], 0, 30, 92, { a: a * sat(done * 2) }); ctx.restore(); }
      ctx.fillStyle = css(PAL.ink, .16 * a); ctx.fillRect(800, RY[k] + 78, 560, 3);
    });
    return {};
  }

  // ---------- B “我” ----------
  const ME = { who: 37, x: 640, y: 930, s: 2.1, armL: [9, 3], armR: [9, 3], noShadow: 1 };
  function drawMe(ctx, time) {
    const g = G12; g.reset();
    const c = g.begin('a'); stage(c, 640, [96, 76, 40]);
    fs(c, [0, 0, 0], .4); c.beginPath(); c.ellipse(ME.x, ME.y + 8, 150, 16, 0, 0, 7); c.fill();
    const gr = c.createLinearGradient(0, 930, 0, H); gr.addColorStop(0, '#2b2a30'); gr.addColorStop(1, '#0a0b12'); c.fillStyle = gr; c.fillRect(0, 930, W, H - 930);
    const point = E.io(seg(time, TL.at('h3', '我') - .3, TL.at('h3', '我') + .2));
    drawPerson(c, Object.assign({}, ME, { armR: [lerp(9, 34, point), lerp(3, -128, point)], armsFront: 1 }));
    const inK = seg(time, t('h3') - .1, t('h3') + .5); if (inK < 1) g.fromBlack(inK, { ox: ME.x / 12, oy: 40 });
    const outK = seg(time, t('h6') - .5, t('h6') - .1); if (outK > 0) g.toBlack(outK, { ox: ME.x / 12, oy: 45 });
    Post.blit(ctx, g.present({}), .42); Post.dust(ctx, time, { a: .6 });
    const oa = 1 - outK, G = personGeo(ME);
    HUD.big(ctx, [{ s: '“我”', hl: 1 }], 1240, 300, 220, { a: seg(time, TL.at('h3', '我') - .05, TL.at('h3', '我') + .2) * oa * (1 - seg(time, t('h4') - .3, t('h4'))), hl: PAL.gold });
    const tags = [['脾气', TL.at('h4', '脾气'), 1040, 330, G.cx + 60, G.sh + 60], ['喜好', TL.at('h4', '喜好'), 1040, 500, G.cx + 90, G.sh + 150], ['什么样的人', t('h5'), 1040, 670, G.cx + 60, G.hip + 40]];
    tags.forEach(q => {
      const a = seg(time, q[1] - .05, q[1] + .2) * oa; if (a <= 0) return;
      HUD.line(ctx, q[2] - 26, q[3], q[4], q[5], seg(time, q[1], q[1] + .4), { a: .5 * a, lw: 2.5, col: PAL.gold, dash: [8, 8] });
      ctx.save(); ctx.globalAlpha = a; ctx.font = FONT.serif(84, 900); ctx.textBaseline = 'middle'; const w = ctx.measureText(q[0]).width; ctx.fillStyle = 'rgba(8,9,14,.8)'; ctx.fillRect(q[2] - 14, q[3] - 62, w + 68, 124); ctx.fillStyle = css(PAL.gold); ctx.fillRect(q[2] - 14, q[3] - 62, 6, 124); ctx.fillStyle = css(PAL.ink); ctx.fillText(q[0], q[2] + 20, q[3] + 4); ctx.restore();
    });
    return {};
  }

  // ---------- C 研究 ----------
  const BX = 65, BY = 36, BW = 190, BH = 100, YB = 90;                              // 一万九千块木板的方阵；图的基线在第几行
  let ORDER = null;
  function order() { if (ORDER) return ORDER; const a = []; for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) a.push([Math.hypot(x - BW / 2, (y - BH / 2) * 1.4) + hash2(x, y) * 14, x, y]); a.sort((p, q) => p[0] - q[0]); ORDER = a; return a; }
  const SKIN = ['#f2c9a2', '#e8bb96', '#d9a27a', '#b9805a', '#f4d0ae', '#8a5a3c'];
  const hu = c => Math.round(47 - 20 * (c / 189) + 3 * Math.sin(c * .33) + 2 * hash(c * 7)), hd = c => Math.round(20 - 10 * (c / 189) + 2 * Math.sin(c * .5 + 1) + 2 * hash(c * 11));
  function paintDots(ctx, n) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); fs(ctx, PAL.bg); ctx.fillRect(0, 0, 320, 180);
    const o = order();
    for (let k = 0; k < n; k++) { const q = o[k], h = hash2(q[1] + 3, q[2] + 9); fs(ctx, mul(C(SKIN[Math.floor(h * SKIN.length)]), .62 + .38 * hash2(q[1], q[2] + 77))); ctx.fillRect(BX + q[1], BY + q[2], 1, 1); }
  }
  function paintChart(ctx, time) {
    ctx.setTransform(1, 0, 0, 1, 0, 0); fs(ctx, PAL.bg); ctx.fillRect(0, 0, 320, 180);
    const tu = TL.at('h8', '变了') - .3, td = TL.at('h10', '不会') - .3;
    for (let c = 0; c < BW; c++) {
      const ku = E.out(seg(time, tu + c / 189 * .6, tu + c / 189 * .6 + .5)), kd = E.out(seg(time, td + c / 189 * .6, td + c / 189 * .6 + .5));
      fs(ctx, [150, 146, 140]); ctx.fillRect(BX + c, YB, 1, 1);
      for (let k = 1; k <= Math.round(hu(c) * ku); k++) { fs(ctx, mul(mixc(PAL.goldDeep, PAL.gold, hash2(c, k)), .7 + .3 * hash2(c + 5, k))); ctx.fillRect(BX + c, YB - k, 1, 1); }
      for (let k = 1; k <= Math.round(hd(c) * kd); k++) { fs(ctx, mul(mixc(C('#4f7fc8'), C('#8fb6ee'), hash2(c, k + 99)), .7 + .3 * hash2(c + 7, k))); ctx.fillRect(BX + c, YB + k, 1, 1); }
    }
  }
  function drawStudy(ctx, time) {
    const g = G6; g.reset();
    const tC = t('h7') - .15, nK = E.io2(seg(time, t('h6') + .05, te('h6') + .5)), N = Math.round(19000 * nK);
    if (time < tC + .9) { paintDots(g.begin('a'), time < tC ? N : 19000); if (time >= tC) { paintChart(g.begin('b'), time); Flip.wave(g, seg(time, tC, tC + .85), { dir: 'y', oy: YB, width: 16, rnd: 8, far: 1 }); } }
    else paintChart(g.begin('a'), time);
    const inK = seg(time, t('h6') - .1, t('h6') + .3); if (inK < 1) g.fromBlack(inK);
    const outK = seg(time, t('h13') - .5, t('h13') - .1); if (outK > 0) g.toBlack(outK);
    Post.blit(ctx, g.present({}), .5);
    const oa = 1 - outK, x0 = BX * 6, x1 = (BX + BW) * 6, yb = YB * 6;
    // 人数
    const na = (1 - seg(time, tC - .1, tC + .3)) * oa;
    if (na > 0) { ctx.save(); ctx.globalAlpha = na; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 12; ctx.font = FONT.mono(108, 700); ctx.fillStyle = css(PAL.gold); const s = N.toLocaleString('en-US'), w = ctx.measureText('19,000').width; ctx.textAlign = 'right'; ctx.fillText(s, W / 2 + w / 2 - 40, 160); ctx.textAlign = 'left'; ctx.font = FONT.serif(64, 900); ctx.fillStyle = css(PAL.ink); ctx.fillText('人', W / 2 + w / 2 - 20, 156); ctx.restore(); }
    HUD.tag(ctx, x0, 870, '一块木板 = 一个人', { a: na * seg(time, t('h6') + .4, t('h6') + .8), px: 30, col: PAL.ink });
    // 图上的字
    const ca = seg(time, tC + .5, tC + .9) * oa;
    if (ca > 0) {
      ctx.save(); ctx.globalAlpha = ca; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 10;
      ctx.font = FONT.mono(34, 700); ctx.fillStyle = css(PAL.ink); ctx.textAlign = 'right'; ctx.fillText('18 岁', x0 - 22, yb + 4); ctx.textAlign = 'left'; ctx.fillText('68 岁', x1 + 22, yb + 4);
      ctx.font = FONT.sans(26); ctx.fillStyle = css(PAL.dim); ctx.textAlign = 'right'; ctx.fillText('示意图', x0 + 60, 838);
      ctx.restore();
      const au = seg(time, TL.at('h8', '过去'), TL.at('h8', '过去') + .3) * ca, ad = seg(time, TL.at('h10', '往后'), TL.at('h10', '往后') + .3) * ca;
      HUD.tag(ctx, 1000, 212, '回头看 · 过去十年', { a: au, px: 34, col: PAL.ink, box: false });
      HUD.big(ctx, [{ s: '变了好多', col: PAL.gold }], 1000, 316, 80, { a: au * seg(time, TL.at('h8', '变了'), TL.at('h8', '变了') + .2), left: 1 });
      HUD.tag(ctx, 1000, 700, '往前看 · 往后十年', { a: ad, px: 34, col: PAL.ink, box: false });
      HUD.big(ctx, [{ s: '不会怎么变', col: C('#8fb6ee') }], 1000, 806, 80, { a: ad * seg(time, TL.at('h10', '不会'), TL.at('h10', '不会') + .2), left: 1 });
      // “十八岁这么说 / 六十八岁，还这么说”
      const b18 = env(time, t('h11'), t('h11') + .25, t('h12') - .2, t('h12')), b68 = env(time, t('h12'), t('h12') + .25, t('h13') - .6, t('h13') - .3);
      HUD.bracket(ctx, x0 - 8, yb - 48 * 6 - 10, 72, 70 * 6 + 20, b18 * ca, { len: 26, lw: 5 });
      HUD.bracket(ctx, x1 - 64, yb - 30 * 6 - 10, 72, 42 * 6 + 20, b68 * ca, { len: 26, lw: 5 });
    }
    HUD.cite(ctx, 'Quoidbach, Gilbert & Wilson, Science, 2013', seg(time, t('h6') + .3, t('h6') + .8) * oa);
    return {};
  }

  // ---------- D 跑道（也给最后一场用） ----------
  const AGES = [7, 17, 27, 37, 57, 77], TX = [250, 524, 800, 1076, 1352, 1628], TY = 822, TS = 1.3;
  // o = {people: [...每个人的参数覆盖], ships: [...], finish: 0..1 每人脚下的“终点线”, light: [..每人头顶的光 0..1], time}
  function paintTrack(ctx, o) {
    fs(ctx, C('#07080d')); ctx.fillRect(-200, -200, W + 400, H + 400);
    let gr = ctx.createLinearGradient(0, 300, 0, TY); gr.addColorStop(0, 'rgba(20,26,48,0)'); gr.addColorStop(1, 'rgba(46,56,92,.6)'); ctx.fillStyle = gr; ctx.fillRect(-200, 300, W + 400, TY - 300);
    for (let k = 0; k < 46; k++) { const x = hash(k * 3 + 21) * 2200 - 140, y = hash(k * 3 + 22) * 560, tw = .5 + .5 * Math.sin((o.time || 0) * (1 + hash(k)) + k); fs(ctx, [200, 215, 255], .2 + .5 * tw * hash(k * 3 + 23)); ctx.fillRect(x, y, 7, 7); }
    // 跑道：三条道
    fs(ctx, C('#7a3f36')); ctx.fillRect(-200, TY - 34, W + 400, 96);
    fs(ctx, C('#8f4a3e')); ctx.fillRect(-200, TY - 34, W + 400, 12);
    fs(ctx, [245, 238, 225], .85); for (const y of [TY - 34, TY - 2, TY + 30, TY + 56]) ctx.fillRect(-200, y, W + 400, 6);
    fs(ctx, C('#1a1418')); ctx.fillRect(-200, TY + 62, W + 400, H);
    // 每个人脚下的终点线（黑白格）
    AGES.forEach((a, i) => { const f = o.finish ? o.finish[i] : 0; if (f <= 0) return; ctx.save(); ctx.globalAlpha = f; for (let r = 0; r < 7; r++) for (let c2 = 0; c2 < 3; c2++) { fs(ctx, (r + c2) % 2 ? [245, 240, 230] : [24, 22, 26]); ctx.fillRect(TX[i] + 62 + c2 * 12, TY - 28 + r * 12, 12, 12); } ctx.restore(); });
    for (const p of o.people) drawPerson(ctx, p);
    for (const s of (o.ships || [])) drawShip(ctx, s.x, s.y, s.s || 1, s);
    // 每个人头顶的一束光
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    (o.light || []).forEach((k, i) => { if (k <= 0) return; const x = o.people[i] ? o.people[i].x : TX[i], g2 = ctx.createRadialGradient(x, 560, 10, x, 560, 330); g2.addColorStop(0, css([255, 214, 150], .2 * k)); g2.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g2; ctx.fillRect(x - 340, 220, 680, 680); });
    ctx.restore();
  }
  const runner = (i, o) => Object.assign({ who: AGES[i], x: TX[i], y: TY, s: TS }, o);
  const TRACKCAM = { z: 1, x: W / 2, y: H / 2 };
  function drawLine(ctx, time) {
    const g = G6; g.reset();
    const t14 = TL.at('h14', '最终版'), t18 = t('h18');
    const who = [[0, TL.at('h16', '七岁')], [1, TL.at('h16', '十七岁')], [4, TL.at('h17', '五十七岁')]];
    const said = i => { const q = who.find(w => w[0] === i); return q ? env(time, q[1] - .05, q[1] + .25, q[1] + 1.0, q[1] + 1.4) : 0; };
    const focus = seg(time, t('h15'), t('h15') + .4) * (1 - seg(time, t18 - .2, t18 + .2));
    const people = AGES.map((a, i) => runner(i, { dim: focus * (1 - said(i)) * .5, armR: [lerp(8, 150, said(i)), lerp(0, 16, said(i))] }));
    const fin = AGES.map((a, i) => E.out(seg(time, t14 + i * .09, t14 + i * .09 + .3)) * (1 - seg(time, t18 + .75 + i * .05, t18 + 1.1 + i * .05)));
    const lit = AGES.map((a, i) => seg(time, t('h13') + i * .12, t('h13') + .5 + i * .12) * (1 - focus * (1 - said(i)) * .7));
    paintTrack(g.begin('a', TRACKCAM), { people, finish: fin, light: lit, time });
    const inK = seg(time, t('h13') - .1, t('h13') + .6); if (inK < 1) g.fromBlack(inK, { ox: 0, oy: 130, dir: 'x' });
    Post.blit(ctx, g.present({}), .4); Post.dust(ctx, time, { a: .5 });
    trackLabels(ctx, time, { final: fin, strike: seg(time, TL.at('h18', '没有') - .05, TL.at('h18', '没有') + .5), a: seg(inK, .6, 1) });
    // “我就是这样的人”：谁说的，谁头上冒出这句话
    who.forEach(q => { const a = said(q[0]); if (a <= 0) return; const G = personGeo(runner(q[0])); bubble(ctx, G.headC[0], G.top - 70, '我就是这样的人', a); });
    return {};
  }
  function bubble(ctx, x, y, text, a) {
    ctx.save(); ctx.globalAlpha = sat(a); ctx.font = FONT.serif(40, 700); const w = ctx.measureText(text).width + 44, bx = clamp(x - w / 2, 30, W - w - 30), yy = y - (1 - E.out(sat(a))) * 10;
    ctx.fillStyle = css(PAL.ink); ctx.beginPath(); ctx.roundRect(bx, yy - 36, w, 72, 12); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 12, yy + 34); ctx.lineTo(x + 12, yy + 34); ctx.lineTo(x, yy + 54); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#16120c'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + 22, yy + 2); ctx.restore();
  }
  // 跑道下面的字：年纪 + “最终版”
  function trackLabels(ctx, time, o) {
    const a0 = o.a === undefined ? 1 : o.a;
    AGES.forEach((age, i) => {
      const x = TX[i] + (o.dx ? o.dx[i] : 0), y = TY + 94, da = o.dimAge ? 1 - o.dimAge[i] * .6 : 1;
      ctx.save(); ctx.globalAlpha = a0 * da; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 8;
      ctx.font = FONT.mono(30, 700); ctx.fillStyle = css(PAL.gold); ctx.fillText(age + ' 岁', x, y);
      ctx.restore();
      const f = o.final ? o.final[i] : 0, st = o.strike || 0;
      if (f > 0.02 || (st > 0 && st < 1.01 && o.final)) {
        const fa = Math.max(f, st > 0 ? 1 - seg(st, .7, 1) * 0 : 0) * a0 * (o.final[i] > 0.02 ? 1 : 0); if (fa <= 0) return;
        ctx.save(); ctx.globalAlpha = fa; ctx.font = FONT.sans(30); const w = ctx.measureText('最终版').width + 24, tx = TX[i] + 80, ty = TY - 78;
        ctx.fillStyle = css(PAL.ink); ctx.fillRect(tx - 4, ty - 22, w, 44); ctx.fillStyle = '#16120c'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('最终版', tx + 8, ty + 2);
        ctx.fillStyle = css(PAL.ink); ctx.fillRect(tx - 4, ty + 22, 5, 34);
        if (st > 0) { ctx.strokeStyle = css(PAL.hot); ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(tx - 8, ty); ctx.lineTo(tx - 8 + (w + 8) * E.out(seg(st, i * .08, i * .08 + .4)), ty); ctx.stroke(); }
        ctx.restore();
      }
    });
  }
  SCENES.push({ name: 'list', t0: t('h1') - .1, draw: drawList });
  SCENES.push({ name: 'me', t0: t('h3') - .1, draw: drawMe });
  SCENES.push({ name: 'study', t0: t('h6') - .1, draw: drawStudy });
  SCENES.push({ name: 'line', t0: t('h13') - .1, draw: drawLine });
  return { paintTrack, runner, trackLabels, bubble, AGES, TX, TY, TS, TRACKCAM };
})();
