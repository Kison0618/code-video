// 场景 7（“东西换了。身体换了” → “没有一次说对”）
// A 三张卡片：东西 / 身体 / 记忆，一张张翻面
// B “我”：三十七岁的他，身上挂着“脾气”“喜好”“什么样的人”三张纸签
// C 研究：一万九千个小圆点 = 一万九千人；再变成一张图：上面是“回头看变了多少”，下面是“往前看还会变多少”
// D 跑道：六个年纪的他各自站在自己的“终点线”上（最终版）——没有一条是真的终点
'use strict';
const S7 = (() => {
  const t = TL.s, te = TL.e;
  function stage(ctx, col, glow) {
    shOff(ctx); fs(ctx, col); ctx.fillRect(0, 0, W, H);
    const g = ctx.createRadialGradient(W / 2, 470, 60, W / 2, 470, 1100); g.addColorStop(0, css(glow || [255, 200, 170], .22)); g.addColorStop(1, 'rgba(14,8,10,.5)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }
  const PLUM = C('#402c3c');

  // ---------- A 三张卡片 ----------
  const ROWS = [['东西', '换了', 'h1', '东西'], ['身体', '换了', 'h1', '身体'], ['记忆', '改了', 'h2', '记忆']], RY = [250, 500, 750], IX = 560;
  function card(ctx, k, after) {
    const y = RY[k]; shOn(ctx, 1.2); fs(ctx, after ? C('#efe6d2') : PAL.gold); rr(ctx, IX - 130, y - 100, 260, 200, 14); shOff(ctx);
    ctx.save(); ctx.beginPath(); ctx.roundRect(IX - 118, y - 88, 236, 176, 8); ctx.clip();
    if (k === 0) {                                          // 一间小屋：墙、窗、床
      const S = after ? ERA.v57 : ERA.v0; fs(ctx, S.wall); ctx.fillRect(IX - 118, y - 88, 236, 130); fs(ctx, C('#8a5d3d')); ctx.fillRect(IX - 118, y + 42, 236, 60);
      fs(ctx, C('#f6efe1')); rr(ctx, IX - 96, y - 66, 70, 74, 4); fs(ctx, C('#8cc8ec')); ctx.fillRect(IX - 90, y - 60, 58, 62); fs(ctx, S.curtain); ctx.fillRect(IX - 102, y - 72, 18, 90); ctx.fillRect(IX - 38, y - 72, 18, 90);
      fs(ctx, C('#f1ebde')); rr(ctx, IX + 6, y + 6, 104, 34, 8); fs(ctx, S.quilt); rr(ctx, IX + 2, y + 2, 72, 42, 8); fs(ctx, bedGeo(S.bed).col); rr(ctx, IX + 102, y - 34, 12, 86, 5);
    } else if (k === 1) { fs(ctx, after ? C('#b9c2d6') : C('#bfe0d8')); ctx.fillRect(IX - 118, y - 88, 236, 176); drawPerson(ctx, { who: after ? 77 : 7, x: IX, y: y + (after ? 150 : 96), s: after ? .78 : .9, flat: 1 }); }
    else {                                                   // 记忆卡片：改过的地方变红、多出一行
      fs(ctx, C('#fbf6ea')); ctx.fillRect(IX - 118, y - 88, 236, 176); fs(ctx, PAL.goldDeep); ctx.fillRect(IX - 118, y - 88, 236, 18);
      for (let i = 0; i < 9; i++) { const ch = after && (i === 1 || i === 4 || i === 8); fs(ctx, ch ? PAL.hot : PAL.inkD, ch ? 1 : .7); rr(ctx, IX - 92 + (i % 3) * 66, y - 46 + Math.floor(i / 3) * 34, i % 2 ? 50 : 34, 16, 5); }
      if (after) { fs(ctx, PAL.hot); rr(ctx, IX - 92, y + 58, 84, 16, 5); }
    }
    ctx.restore();
  }
  function drawList(ctx, time) {
    stage(ctx, PLUM);
    ROWS.forEach((r, k) => {
      const t0 = TL.at(r[2], r[3]), a = E.back(seg(time, t('h1') - .1 + k * .08, t('h1') + .3 + k * .08)), fk = seg(time, t0 + .1, t0 + .7), done = E.back(seg(time, t0 + .4, t0 + .75));
      if (a <= 0) return;
      ctx.save(); ctx.globalAlpha = sat(a * 2); ctx.translate(0, (1 - sat(a)) * 30);
      swap(ctx, fk <= 0 ? 0 : fk >= 1 ? 1 : { __x: 1, a: 0, b: 1, k: fk, mode: 'flip' }, { mode: 'flipX', x: IX }, (c, v) => card(c, k, v));
      ctx.restore();
      HUD.big(ctx, r[0], 800, RY[k] + 48, 140, { a: sat(a * 2) * seg(time, t0 - .1, t0 + .15) + sat(a) * .0, left: 1 });
      if (done > 0) HUD.label(ctx, 1160, RY[k] + 4, r[1], { a: sat(done * 2), px: 84, tone: 'hot', serif: 1, rot: -.05 });
    });
    veil(ctx, fadeIO(time, t('h1') - .1, t('h3') - .1, .35));
    return {};
  }

  // ---------- B “我” ----------
  const ME = { who: 37, x: 600, y: 936, s: 2.1, armL: [9, 3], armR: [9, 3] };
  function drawMe(ctx, time) {
    stage(ctx, PLUM);
    shOn(ctx, 1.6); fs(ctx, C('#2d1f2b')); ctx.fillRect(-40, 936, W + 80, 300); shOff(ctx);
    const point = E.io(seg(time, TL.at('h3', '我') - .3, TL.at('h3', '我') + .2));
    const P = Object.assign({}, ME, { armR: [lerp(9, 34, point), lerp(3, -128, point)], armsFront: 1 }), G = personGeo(ME);
    fs(ctx, [10, 6, 10], .35); ctx.beginPath(); ctx.ellipse(ME.x, ME.y + 6, 160, 14, 0, 0, 7); ctx.fill();
    drawPerson(ctx, P);
    const a3 = seg(time, TL.at('h3', '我') - .05, TL.at('h3', '我') + .2) * (1 - seg(time, t('h4') - .3, t('h4')));
    HUD.big(ctx, [{ s: '“我”', col: PAL.gold }], 1260, 520, 300, { a: a3 });
    const tags = [['脾气', TL.at('h4', '脾气'), 1000, 330, G.cx + 70, G.sh + 70, -.04], ['喜好', TL.at('h4', '喜好'), 1060, 540, G.cx + 96, G.sh + 160, .03], ['什么样的人', t('h5'), 1000, 750, G.cx + 60, G.hip + 60, -.02]];
    tags.forEach(q => { const a = seg(time, q[1] - .05, q[1] + .22); if (a <= 0) return; HUD.line(ctx, q[2] - 10, q[3], q[4], q[5], seg(time, q[1], q[1] + .4), { a: .8 * a, lw: 4, col: PAL.paper, dash: [2, 14] }); HUD.label(ctx, q[2], q[3], q[0], { a, px: 92, serif: 1, rot: q[6] }); });
    veil(ctx, fadeIO(time, t('h3') - .1, t('h6') - .1, .35));
    return {};
  }

  // ---------- C 研究 ----------
  const NAVY = C('#1f2a44'), X0 = 330, X1 = 1590, YB = 560, NP = 19000;
  let PTS = null;
  function pts() {                                           // 一万九千个点，随机撒在一个椭圆里；先出现的在中间
    if (PTS) return PTS; const a = [];
    for (let i = 0; i < NP; i++) { const r = Math.sqrt((i + .5) / NP), th = i * 2.399963 + hash(i) * .5; a.push([W / 2 + Math.cos(th) * r * 700 + (hash(i * 3 + 1) - .5) * 14, 520 + Math.sin(th) * r * 300 + (hash(i * 3 + 2) - .5) * 14, Math.floor(hash(i * 7 + 5) * 5)]); }
    PTS = a; return a;
  }
  const DOTC = ['#f4cda8', '#e7b48a', '#c98e62', '#f6dcc4', '#9b6a48'];
  const hu = x => { const k = (x - X0) / (X1 - X0); return 290 - 130 * k + 14 * Math.sin(k * 21) + 8 * Math.sin(k * 47 + 1); }, hd = x => { const k = (x - X0) / (X1 - X0); return 130 - 66 * k + 9 * Math.sin(k * 26 + 2) + 5 * Math.sin(k * 53); };
  function area(ctx, fn, dir, k, col) { shOn(ctx, 1); fs(ctx, col); ctx.beginPath(); ctx.moveTo(X0, YB); for (let x = X0; x <= X1; x += 14) ctx.lineTo(x, YB - dir * fn(x) * E.out(seg(k, (x - X0) / (X1 - X0) * .5, (x - X0) / (X1 - X0) * .5 + .5))); ctx.lineTo(X1, YB); ctx.closePath(); ctx.fill(); shOff(ctx); }
  function drawStudy(ctx, time) {
    stage(ctx, NAVY, [150, 170, 255]);
    const tC = t('h7') - .15, nK = E.io2(seg(time, t('h6') + .05, te('h6') + .5)), N = Math.round(NP * nK), gone = seg(time, tC, tC + .7);
    if (gone < 1) {                                          // 人群：聚到中间那条线上，变成图的基线
      const P = pts(), e = E.io(gone);
      for (let c = 0; c < 5; c++) { fs(ctx, C(DOTC[c]), 1 - gone * .6); ctx.beginPath(); for (let i = c; i < N; i++) { const p = P[i]; if (p[2] !== c) continue; const x = lerp(p[0], X0 + (p[0] - 260) / 1400 * (X1 - X0), e), y = lerp(p[1], YB, e); ctx.moveTo(x + 3, y); ctx.arc(x, y, 3 * (1 - e * .4), 0, 7); } ctx.fill(); }
      const na = 1 - seg(time, tC - .1, tC + .3);
      if (na > 0) { ctx.save(); ctx.globalAlpha = na; ctx.textBaseline = 'alphabetic'; ctx.shadowColor = 'rgba(8,10,20,.8)'; ctx.shadowBlur = 16; ctx.font = FONT.mono(120, 700); const w = ctx.measureText('19,000').width; ctx.textAlign = 'right'; ctx.fillStyle = css(PAL.gold); ctx.fillText(N.toLocaleString('en-US'), W / 2 + w / 2 - 50, 160); ctx.textAlign = 'left'; ctx.font = FONT.serif(72, 900); ctx.fillStyle = css(PAL.ink); ctx.fillText('人', W / 2 + w / 2 - 26, 154); ctx.restore(); }
      HUD.text(ctx, W / 2, 900, '一个点 = 一个人', { a: na * seg(time, t('h6') + .4, t('h6') + .8), align: 'center', px: 32 });
    }
    const ca = seg(time, tC + .4, tC + .8);
    if (ca > 0) {
      const ku = seg(time, TL.at('h8', '变了') - .4, TL.at('h8', '变了') + .5), kd = seg(time, TL.at('h10', '不会') - .4, TL.at('h10', '不会') + .5);
      if (kd > 0) area(ctx, hd, -1, kd, C('#6f9bdc'));
      if (ku > 0) area(ctx, hu, 1, ku, PAL.gold);
      ctx.save(); ctx.globalAlpha = ca; shOn(ctx, .6); fs(ctx, PAL.paper); rr(ctx, X0 - 8, YB - 5, X1 - X0 + 16, 10, 5); ctx.restore();
      HUD.text(ctx, X0 - 28, YB, '18 岁', { a: ca, mono: 1, px: 38, align: 'right' }); HUD.text(ctx, X1 + 28, YB, '68 岁', { a: ca, mono: 1, px: 38 });
      const au = seg(time, TL.at('h8', '过去'), TL.at('h8', '过去') + .3), ad = seg(time, TL.at('h10', '往后'), TL.at('h10', '往后') + .3);
      HUD.text(ctx, 1010, 150, '回头看 · 过去十年', { a: au, px: 36 });
      HUD.big(ctx, [{ s: '变了好多', col: PAL.gold }], 1010, 246, 92, { a: au * seg(time, TL.at('h8', '变了'), TL.at('h8', '变了') + .2), left: 1 });
      HUD.text(ctx, 1010, 742, '往前看 · 往后十年', { a: ad, px: 36 });
      HUD.big(ctx, [{ s: '不会怎么变', col: C('#8fb6ee') }], 1010, 850, 92, { a: ad * seg(time, TL.at('h10', '不会'), TL.at('h10', '不会') + .2), left: 1 });
      HUD.text(ctx, X0, 880, '示意图', { a: ca * .7, px: 28, col: PAL.dim });
      const b18 = env(time, t('h11'), t('h11') + .25, t('h12') - .2, t('h12')), b68 = env(time, t('h12'), t('h12') + .25, t('h13') - .6, t('h13') - .3);
      HUD.bracket(ctx, X0 - 16, YB - 310, 110, 460, b18, { len: 34, lw: 7, col: PAL.ink }); HUD.bracket(ctx, X1 - 94, YB - 190, 110, 280, b68, { len: 34, lw: 7, col: PAL.ink });
    }
    HUD.cite(ctx, 'Quoidbach, Gilbert & Wilson, Science, 2013', seg(time, t('h6') + .3, t('h6') + .8));
    veil(ctx, fadeIO(time, t('h6') - .1, t('h13') - .1, .35));
    return {};
  }

  // ---------- D 跑道（最后一场也用） ----------
  const AGES = [7, 17, 27, 37, 57, 77], TX = [250, 524, 800, 1076, 1352, 1628], TY = 822, TS = 1.3;
  // o = {people, ships, finish: [..每人脚下“终点线”的进度], light: [..每人头顶的光], time}
  function paintTrack(ctx, o) {
    shOff(ctx); let g = ctx.createLinearGradient(0, 0, 0, TY); g.addColorStop(0, '#141b36'); g.addColorStop(1, '#3a4a7c'); ctx.fillStyle = g; ctx.fillRect(-600, -600, W + 1200, TY + 600);
    fs(ctx, [255, 255, 255], .7); for (let k = 0; k < 30; k++) { const tw = .5 + .5 * Math.sin((o.time || 0) * (1 + hash(k)) + k); ctx.globalAlpha = .25 + .55 * tw * hash(k * 3 + 23); circ(ctx, hash(k * 3 + 21) * 2200 - 140, hash(k * 3 + 22) * 470, 2 + hash(k) * 2.4); } ctx.globalAlpha = 1;
    // 每个人头顶的一束光（画在人后面）
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; (o.light || []).forEach((k, i) => { if (k <= 0) return; const x = o.people[i] ? o.people[i].x : TX[i], g2 = ctx.createRadialGradient(x, 560, 10, x, 560, 340); g2.addColorStop(0, css([255, 214, 150], .26 * k)); g2.addColorStop(1, 'rgba(255,214,150,0)'); ctx.fillStyle = g2; ctx.fillRect(x - 350, 210, 700, 700); }); ctx.restore();
    // 跑道
    shOn(ctx, 1.6); fs(ctx, C('#b4553f')); ctx.fillRect(-600, TY - 36, W + 1200, 104); shOff(ctx);
    fs(ctx, C('#f4ead6'), .9); for (const y of [TY - 36, TY - 4, TY + 28, TY + 60]) ctx.fillRect(-600, y, W + 1200, 7);
    shOn(ctx, 1); fs(ctx, C('#241a22')); ctx.fillRect(-600, TY + 67, W + 1200, 600); shOff(ctx);
    AGES.forEach((a, i) => { const f = o.finish ? o.finish[i] : 0; if (f <= 0) return; ctx.save(); ctx.globalAlpha = f; for (let r = 0; r < 7; r++) for (let c2 = 0; c2 < 3; c2++) { fs(ctx, (r + c2) % 2 ? [245, 240, 230] : [30, 26, 30]); ctx.fillRect(TX[i] + 70 + c2 * 13, TY - 30 + r * 13, 13, 13); } ctx.restore(); });
    for (const p of o.people) drawPerson(ctx, p);
    for (const s of (o.ships || [])) drawShip(ctx, s.x, s.y, s.s || 1, s);
  }
  const runner = (i, o) => Object.assign({ who: AGES[i], x: TX[i], y: TY, s: TS }, o);
  function bubble(ctx, x, y, text, a) {
    if (a <= 0.01) return; ctx.save(); ctx.globalAlpha = sat(a); ctx.font = FONT.serif(42, 700); const w = ctx.measureText(text).width + 48, bx = clamp(x - w / 2, 30, W - w - 30), yy = y - (1 - E.out(sat(a))) * 10;
    shOn(ctx, 1); ctx.fillStyle = css(PAL.paper); ctx.beginPath(); ctx.roundRect(bx, yy - 40, w, 80, 14); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - 13, yy + 38); ctx.lineTo(x + 13, yy + 38); ctx.lineTo(x, yy + 60); ctx.closePath(); ctx.fill(); shOff(ctx);
    ctx.fillStyle = css(PAL.inkD); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + 24, yy + 2); ctx.restore();
  }
  // 跑道下面的年纪；o.final = 每人“最终版”小旗的进度；o.strike = 划掉的进度
  function trackLabels(ctx, time, o) {
    const a0 = o.a === undefined ? 1 : o.a;
    AGES.forEach((age, i) => {
      const x = TX[i] + (o.dx ? o.dx[i] : 0);
      HUD.text(ctx, x, TY + 100, age + ' 岁', { a: a0 * (o.dimAge ? 1 - o.dimAge[i] * .6 : 1), mono: 1, px: 32, align: 'center', col: PAL.gold });
      const f = o.final ? o.final[i] : 0; if (f <= 0.02) return;
      const tx = TX[i] + 88, ty = TY - 84, st = o.strike || 0;
      ctx.save(); ctx.globalAlpha = f * a0; ctx.font = FONT.sans(32); const w = ctx.measureText('最终版').width + 28;
      fs(ctx, PAL.paper); ctx.fillRect(tx - 4, ty + 20, 6, 40); shOn(ctx, .7); ctx.beginPath(); ctx.roundRect(tx - 4, ty - 24, w, 48, 6); ctx.fill(); shOff(ctx);
      ctx.fillStyle = css(PAL.inkD); ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('最终版', tx + 10, ty + 2);
      if (st > 0) { ctx.strokeStyle = css(PAL.hot); ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx - 2, ty); ctx.lineTo(tx - 2 + (w - 4) * E.out(seg(st, i * .08, i * .08 + .4)), ty); ctx.stroke(); }
      ctx.restore();
    });
  }
  function drawLine(ctx, time) {
    const t14 = TL.at('h14', '最终版'), t18 = t('h18');
    const who = [[0, TL.at('h16', '七岁')], [1, TL.at('h16', '十七岁')], [4, TL.at('h17', '五十七岁')]];
    const said = i => { const q = who.find(w => w[0] === i); return q ? env(time, q[1] - .05, q[1] + .25, q[1] + 1.0, q[1] + 1.4) : 0; };
    const focus = seg(time, t('h15'), t('h15') + .4) * (1 - seg(time, t18 - .2, t18 + .2));
    const people = AGES.map((a, i) => runner(i, { dim: focus * (1 - said(i)) * .45, armR: [lerp(8, 150, said(i)), lerp(0, 16, said(i))] }));
    const fin = AGES.map((a, i) => E.out(seg(time, t14 + i * .09, t14 + i * .09 + .3)) * (1 - seg(time, t18 + .75 + i * .05, t18 + 1.1 + i * .05)));
    const lit = AGES.map((a, i) => seg(time, t('h13') + i * .12, t('h13') + .5 + i * .12) * (1 - focus * (1 - said(i)) * .7));
    paintTrack(ctx, { people, finish: fin, light: lit, time });
    trackLabels(ctx, time, { final: fin, strike: seg(time, TL.at('h18', '没有') - .05, TL.at('h18', '没有') + .5) });
    who.forEach(q => { const G = personGeo(runner(q[0])); bubble(ctx, G.headC[0], G.top - 74, '我就是这样的人', said(q[0])); });
    veil(ctx, 1 - seg(time, t('h13') - .1, t('h13') + .3));
    return {};
  }
  SCENES.push({ name: 'list', t0: t('h1') - .1, draw: drawList });
  SCENES.push({ name: 'me', t0: t('h3') - .1, draw: drawMe });
  SCENES.push({ name: 'study', t0: t('h6') - .1, draw: drawStudy });
  SCENES.push({ name: 'line', t0: t('h13') - .1, draw: drawLine });
  return { paintTrack, runner, trackLabels, bubble, AGES, TX, TY, TS };
})();
