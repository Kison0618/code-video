// 场景 1（开场 → “你这个人，也是这样被换掉的”）
// 0–3 秒：纸做的海和一艘船。几层纸浪像布景一样落下去，后面是一个男孩坐在地毯上玩船
// 5–30 秒：男孩玩船。同时九样东西在很慢地换（这就是“第一次骗你”，必须全程留在画面里）
// 32–70 秒：揭穿。前后对比 → 九样东西逐个翻回原样再翻回来 → “一下子换”和“一点一点换”的对比 → 男孩长成十七岁
'use strict';
const S1 = (() => {
  const BOY = { x: 836, y: 852 }, REST = [1000, 856], SHIP_S = 1.15;
  const t = id => TL.s(id), te = id => TL.e(id);
  // 九样东西：名字、编号牌放哪（世界坐标）、慢慢换的时间段（占 a3→a14 这一段的比例）
  const ITEMS = [
    { key: 'wall', name: '墙', p: [1330, 250], f: [0, .5] },
    { key: 'curtain', name: '窗帘', p: [118, 300], f: [.14, .56] },
    { key: 'quilt', name: '被子', p: [1400, 600], f: [.3, .7] },
    { key: 'rug', name: '地毯', p: [520, 880], f: [.04, .42] },
    { key: 'art', name: '画', p: [755, 112], f: [.4, .76] },
    { key: 'lamp', name: '台灯', p: [1196, 520], f: [.5, .82] },
    { key: 'chair', name: '椅子', p: [528, 560], f: [.56, .86] },
    { key: 'toy', name: '小熊', p: [1096, 300], f: [.62, .92] },
    { key: 'top', name: '衣服', p: [748, 700], f: [.7, 1] },
  ];
  const SW0 = () => t('a3') + .4, SW1 = () => te('a14') + .2;
  const swapK = (i, time) => { const a = SW0(), b = SW1(), it = ITEMS[i]; return E.io2(seg(time, a + (b - a) * it.f[0], a + (b - a) * it.f[1])); };
  const TOP0 = WHO[7].top, TOP1 = C('#2f7f7a');

  // ---------- 那片“海”：纸剪的浪，一层压一层 ----------
  const SEA = { x: 960, y: 640, s: 3.6 };
  const tDrop = () => t('a2') - .1;                               // “第一次，已经开始了”：布景落下
  const waveF = (i, time, k) => x => k * ((22 + i * 8) * Math.sin(x * (.005 + i * .0008) - time * (1.5 + i * .3) + i * 1.7) + (9 + i * 3) * Math.sin(x * (.012 + i * .002) + time * (2.4 + i * .3) + i));
  function seaShip(time, calm, sx, still) { const f = waveF(2, time, (1 - (calm || 0) * .6) * (1 - (still || 0))), x = sx || SEA.x; return { y: SEA.y + f(x) * .7, tilt: Math.atan((f(x + 100) - f(x - 100)) / 200) * 1.2 * (1 - (calm || 0) * .5) }; }
  // calm：0 暴风雨（开头）→ 1 天快亮（结尾）。drop：0..1 布景落下去的进度。ship：false = 不画船
  function paintSea(ctx, time, o) {
    o = o || {}; const calm = o.calm || 0, drop = o.drop || 0, sx = o.sx || SEA.x;
    const fl = (pulse(time, TL.at('a1', '骗') + .05, .05, .34) + pulse(time, TL.at('a1', '骗') + .34, .04, .22) * .6) * (1 - calm);
    ctx.save(); shOff(ctx);
    // 天：往上升走
    ctx.save(); ctx.translate(0, -E.io2(seg(drop, 0, .8)) * 1180); shOn(ctx, 1.4); fs(ctx, C('#101a36')); ctx.fillRect(-40, -40, W + 80, H + 80); shOff(ctx);
    let g = ctx.createLinearGradient(0, 0, 0, 760); g.addColorStop(0, css(mixc(mixc(C('#101a36'), C('#27376a'), calm), C('#7f98d8'), fl * .6))); g.addColorStop(1, css(mixc(mixc(C('#2a3d6e'), C('#f3b58c'), calm), C('#a9bde8'), fl * .6)));
    ctx.fillStyle = g; ctx.fillRect(-40, -40, W + 80, H + 80);
    if (calm > 0) { g = ctx.createRadialGradient(sx, 600, 20, sx, 600, 700); g.addColorStop(0, css([255, 222, 160], .7 * calm)); g.addColorStop(1, 'rgba(255,222,160,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    else { fs(ctx, C('#f6efd6'), .9); circ(ctx, 1500, 210, 64); fs(ctx, mixc(C('#16224a'), C('#8aa2de'), fl * .6)); circ(ctx, 1474, 192, 58); }
    for (let k = 0; k < 5; k++) { shOn(ctx, .8); fs(ctx, mixc(mixc(C('#1b2850'), C('#e9c1b0'), calm), C('#c0cdf0'), fl * .5), calm ? .3 : 1); const cx = ((hash(k * 3 + 1) * 2300 + time * (10 + k * 4)) % 2500) - 280, cy = 110 + hash(k * 3 + 2) * 230, w = 300 + hash(k) * 240; rr(ctx, cx, cy, w, 64, 32); rr(ctx, cx + w * .2, cy - 34, w * .5, 70, 35); shOff(ctx); }
    ctx.restore();
    // 浪：五层，往下落（后面的先落）
    const sh = seaShip(time, calm, sx, o.still), cols = ['#1d3f78', '#215091', '#2a63ab', '#1f4c8c', '#183a70'];
    for (let i = 0; i < 5; i++) {
      if (i === 2 && o.ship !== false) drawShip(ctx, sx, sh.y + 14, SEA.s, Object.assign({ tilt: sh.tilt }, calm ? SHIP_NEW : SHIP_OLD, calm ? { glow: .6 * calm } : {}));
      const dy = E.in(seg(drop, i * .09, .62 + i * .09)) * 760, base = 590 + i * 80, f = waveF(i, time, 1 - calm * .55);
      ctx.save(); ctx.translate(0, dy); shOn(ctx, 1.2); fs(ctx, mixc(mixc(C(cols[i]), C('#4a76b4'), calm * .5), [190, 208, 255], fl * .25));
      ctx.beginPath(); ctx.moveTo(-60, H + 200); for (let x = -60; x <= W + 60; x += 14) ctx.lineTo(x, base + f(x)); ctx.lineTo(W + 60, H + 200); ctx.closePath(); ctx.fill(); shOff(ctx);
      ctx.strokeStyle = css(mixc([236, 244, 255], [255, 232, 196], calm), .55); ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); let on = false;
      for (let x = -60; x <= W + 60; x += 14) { const y = f(x), crest = y < -(18 + i * 6) * (1 - calm * .55) * .55; if (crest) { if (!on) ctx.moveTo(x, base + y + 12); else ctx.lineTo(x, base + y + 12); on = true; } else on = false; }
      ctx.stroke(); ctx.restore();
    }
    // 雨
    if (calm < 1 && drop < 1) { ctx.strokeStyle = css([200, 220, 255], .34 * (1 - calm) * (1 - drop)); ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); for (let i = 0; i < 70; i++) { const sp = 1.5 + hash(i * 7 + 1) * 1.1, ph = (hash(i * 7 + 2) + time * sp) % 1, x = (hash(i * 7 + 3) * 1.3 - .1) * W - ph * 300, y = ph * (H + 80) - 40; ctx.moveTo(x, y); ctx.lineTo(x - 12, y + 34); } ctx.stroke(); }
    ctx.restore();
  }

  // ---------- 男孩和船 ----------
  function boy(time, version) {
    const lift = env(time, t('a8') - .25, t('a8') + .35, te('a8') + .2, t('a9') + .35);          // “要当船长”：把船举高
    const hug = env(time, t('a10') - .1, t('a10') + .4, te('a11') + .1, t('a12'));               // “你先别笑他”：把船抱回怀里
    const cross = env(time, t('a13') - .15, t('a13') + .3, t('b1') - .4, t('b1') + .2);          // “就这脾气”：抱紧，身子一扭
    const hc = Math.max(hug, cross);
    let aR = [46, 26], aL = [16, 6];
    aR = [lerp(aR[0], 152, lift), lerp(aR[1], 14, lift)];
    aR = [lerp(aR[0], 58, hc), lerp(aR[1], -18, hc)]; aL = [lerp(aL[0], -8, hc), lerp(aL[1], -64, hc)];
    const top = version === 'then' ? TOP0 : version === 'now' ? TOP1 : mixc(TOP0, TOP1, swapK(8, time));
    const grow = seg(time, TL.at('b13', '也是') - .1, te('b13') + 1.3);                           // “你这个人，也是这样被换掉的”：长成十七岁
    const P = { mix: { a: 7, b: 17, k: E.io2(grow) }, x: BOY.x, y: BOY.y, s: PS, floor: 1, layer: 'front', armR: aR, armL: aL, top: grow > 0 ? mixc(top, WHO[17].top, E.io2(grow)) : top, lean: 6 + hug * 12 + cross * 4, armsFront: hc > .5 };
    const G = personGeo(P);
    const sail = env(time, t('a9') - .1, t('a9') + .5, te('a9'), te('a9') + .6);                 // “就喜欢海”：船在地毯上开出去一小段
    const rest = [REST[0] + sail * 110 * (.5 - .5 * Math.cos((time - t('a9')) * 2.4)), REST[1]];
    const hx = lerp(G.handR[0] + 40, P.x + 104, hc), hy = lerp(G.handR[1] + 24, BOY.y - 4 - cross * 10, hc), held = Math.max(lift, hc);
    const ship = { x: lerp(rest[0], hx, held), y: lerp(rest[1], hy, held), s: SHIP_S, tilt: lift * -.1 + sail * Math.sin(time * 5) * .05, layer: 'front', behind: hc > .5 };
    return { P, ship };
  }
  // 镜头：开头是船的特写（和海里那艘在同一个位置、一样大），然后拉开
  const CLOSE = { z: SEA.s / SHIP_S, x: REST[0], y: REST[1] - (SEA.y + 14 - H / 2) / (SEA.s / SHIP_S) };
  function cam(time) {
    const pull = E.io(seg(time, tDrop() + .9, t('a3') - .1));
    let c = camMix(CLOSE, ROOMCAM, pull);
    const drift = seg(time, t('a3'), te('a14')) - seg(time, t('b1'), t('b4') - .2);            // 很轻的推近，揭穿前回到原位
    c = camMix(c, { z: 1.04, x: 950, y: 560 }, E.io2(sat(drift)) * pull);
    const push = E.io(seg(time, t('b13') - .2, te('b13') + .4));                                 // “你这个人”：推向男孩
    return camMix(c, { z: 1.7, x: BOY.x + 60, y: 720 }, push);
  }

  // 画一遍房间。version: 'live'（按时间慢慢换）/ 'then'（你点开的时候）/ 'now'（换完以后）；flip = {key: 0..1} 把某样东西翻回原样
  function paint(ctx, time, version, flip) {
    let S;
    if (version === 'then') S = ERA.v0; else if (version === 'now') S = flip ? blendEra(ERA.v1, ERA.v0, flip, 'flip') : ERA.v1;
    else { const k = {}; ITEMS.forEach((it, i) => k[it.key] = swapK(i, time)); S = blendEra(ERA.v0, ERA.v1, k, 'fade'); }
    const b = boy(time, version);
    if (flip && flip.top) b.P.top = mixc(TOP1, TOP0, E.io2(flip.top));
    const glow = env(time, t('a5') - .1, t('a5') + .5, te('a6'), te('a6') + .8);                 // “这艘小船”：船亮一下
    if (glow > 0) b.ship.glow = glow;
    const dimK = env(time, t('b1') - .2, t('b1') + .5, t('b3') - .1, t('b3') + .5);              // “现在说第一次骗你的事”：灯暗一点
    paintRoom(ctx, { S, people: [b.P], ships: [b.ship], light: Object.assign({}, DAY, { amb: 1 - dimK * .3 }), time });
  }

  const itemT = i => i < 8 ? TL.at('b6', ITEMS[i].name) : TL.at('b7', '衣服');
  // 每样东西被点到名时翻回原样、停一下、再翻回来；“你发现了几样？”时九样一起翻回去
  function blink(i, time) {
    const ti = itemT(i), all = t('b8'), out = t('b9') + .1;
    return Math.max(env(time, ti - .05, ti + .32, ti + .86, ti + 1.2), env(time, all - .1 + i * .03, all + .3 + i * .03, out + i * .03, out + .4 + i * .03));
  }
  // 前后对比时分界线的位置（0..1，线左边是“你点开的时候”）
  function divider(time) { const a = t('b4'), b = t('b5'); return sat(E.io(seg(time, a, a + 1.0)) - E.io(seg(time, b + .15, b + 1.15))); }

  function draw(ctx, time) {
    const c = cam(time), tb4 = t('b4'), tb13 = t('b13'), drop = seg(time, tDrop(), tDrop() + 1.0);
    camApply(ctx, c);
    if (time < tDrop()) { camReset(ctx); paintSea(ctx, time, { still: E.io2(seg(time, tDrop() - .6, tDrop())) }); return { band: .5 }; }
    if (time < tb4 || time >= tb13) paint(ctx, time, time < tb4 ? 'live' : 'now');
    else {
      // “不是一下子换的”：一下子全翻回去；“是一点一点换的”：再慢慢渗回来
      const tA = TL.at('b10', '一下子'), tS = t('b11'), tE = te('b12') - .15;
      if (time >= tS && time < tE + .05) { const k = seg(time, tS, tE), km = {}; ITEMS.forEach(it => km[it.key] = k); const S = blendEra(ERA.v0, ERA.v1, km, 'fade'), b = boy(time, 'then'); b.P.top = mixc(TOP0, TOP1, k); paintRoom(ctx, { S, people: [b.P], ships: [b.ship], light: DAY, time }); }
      else {
        const flip = {}; ITEMS.forEach((it, i) => { flip[it.key] = Math.max(blink(i, time), time >= tA && time < tS ? seg(time, tA, tA + .3) : 0); });
        paint(ctx, time, 'now', flip);
        const d = divider(time);
        if (d > 0.002) { ctx.save(); camReset(ctx); ctx.beginPath(); ctx.rect(0, 0, d * W, H); ctx.clip(); camApply(ctx, c); paint(ctx, time, 'then'); ctx.restore(); }
      }
    }
    camReset(ctx);
    if (drop < 1) { paintSea(ctx, time, { drop, ship: false, still: 1 }); camApply(ctx, c); const b = boy(time, 'live'); drawShip(ctx, b.ship.x, b.ship.y, b.ship.s, b.ship); camReset(ctx); }

    // ---------- 标签 ----------
    if (time >= tb4 && time < tb13) {
      const d = divider(time), x = d * W;
      if (d > 0.004 && d < .996) { ctx.save(); shOn(ctx, 1.4); ctx.fillStyle = css(PAL.paper); ctx.fillRect(x - 5, -20, 10, H + 40); ctx.restore(); }
      if (d > 0.004) {
        const al = x < 460 ? 'left' : 'right', lx = Math.max(70, x - 34);
        HUD.label(ctx, lx, 96, '你点开的时候', { a: sat(d * 6), align: al, tone: 'gold', px: 40 });
        if (d < .97) HUD.label(ctx, Math.min(W - 70, x + 34), 96, '现在', { a: sat((1 - d) * 6) * sat(d * 30), px: 40 });
      }
      // “九样”
      const n0 = TL.at('b5', '九样'), nA = seg(time, n0, n0 + .25) * (1 - seg(time, itemT(0) - .5, itemT(0) - .2));
      if (nA > 0) { ctx.save(); ctx.translate(1440, 330); const sc = .8 + .2 * E.back(sat(nA)); ctx.scale(sc, sc); HUD.big(ctx, [{ s: '9', col: PAL.gold }, { s: ' 样' }], 0, 60, 260, { a: nA }); ctx.restore(); }
      // 编号牌 + 名字
      const out = t('b9') + .3;
      ITEMS.forEach((it, i) => {
        const ti = itemT(i), a = seg(time, ti - .05, ti + .2) * (1 - seg(time, out + i * .04, out + .3 + i * .04)); if (a <= 0) return;
        const p = toScreen(c, it.p[0], it.p[1]), cur = env(time, ti - .05, ti + .15, ti + .95, ti + 1.2);
        HUD.badge(ctx, p[0], p[1], i + 1, a, { r: 26 + cur * 6 + pulse(time, t('b8') + i * .03, .12, .5) * 8 });
        HUD.label(ctx, p[0] + 44, p[1], it.name, { a: cur, px: 38 });
      });
      // “一下子” / “一点一点”
      const tA = TL.at('b10', '一下子'), tS = t('b11'), tE = te('b12') - .15;
      HUD.label(ctx, W / 2, 96, '一下子换：一眼就看出来了', { a: env(time, tA + .2, tA + .45, tS - .25, tS), align: 'center', tone: 'hot', px: 40 });
      if (time >= tS) {
        const p = seg(time, tS, tE), a = env(time, tS, tS + .3, te('b12') + .5, tb13);
        HUD.label(ctx, W / 2, 96, '一点一点换', { a, align: 'center', tone: 'gold', px: 40 });
        ctx.save(); ctx.globalAlpha = a; shOn(ctx, .6); ctx.fillStyle = css(PAL.paper, .5); ctx.beginPath(); ctx.roundRect(W / 2 - 260, 150, 520, 12, 6); ctx.fill(); shOff(ctx); ctx.fillStyle = css(PAL.gold); ctx.beginPath(); ctx.roundRect(W / 2 - 260, 150, Math.max(12, 520 * p), 12, 6); ctx.fill(); ctx.restore();
      }
    }
    // “不是那片海”：一张海的小照片滑进来，打叉，再滑走
    const seaA = env(time, t('b2') - .15, t('b2') + .25, t('b3') - .1, t('b3') + .3);
    if (seaA > 0) {
      const L = Layer.get(1); paintSea(L, 1.2 + (time % 3) * .3, {});
      ctx.save(); ctx.globalAlpha = sat(seaA * 2); ctx.translate(360 - (1 - E.out(seaA)) * 80, 330); ctx.rotate(-.05);
      shOn(ctx, 1.4); ctx.fillStyle = css(PAL.paper); ctx.beginPath(); ctx.roundRect(-262, -156, 524, 312, 8); ctx.fill(); shOff(ctx);
      ctx.drawImage(L.canvas, -246, -140, 492, 277);
      const k2 = E.out(seg(time, TL.at('b2', '不是'), TL.at('b2', '不是') + .3)), k3 = E.out(seg(time, TL.at('b2', '不是') + .15, TL.at('b2', '不是') + .45));
      ctx.strokeStyle = css(PAL.hot); ctx.lineWidth = 16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(-150, -90); ctx.lineTo(lerp(-150, 150, k2), lerp(-90, 90, k2)); if (k3 > 0) { ctx.moveTo(150, -90); ctx.lineTo(lerp(150, -150, k3), lerp(-90, 90, k3)); } ctx.stroke();
      ctx.restore();
    }
    // “是这个房间”：整个画面被一圈金线框起来
    const frK = env(time, t('b3'), t('b3') + .6, t('b4') - .3, t('b4') + .2);
    if (frK > 0) { const k = E.out(seg(time, t('b3'), t('b3') + .7)), len = 2 * (W - 100 + 790); ctx.save(); ctx.globalAlpha = frK; ctx.strokeStyle = css(PAL.gold); ctx.lineWidth = 8; ctx.lineJoin = 'round'; ctx.setLineDash([len * k, len]); ctx.strokeRect(50, 50, W - 100, 790); ctx.restore(); }
    return {};
  }

  SCENES.push({ name: 'room', t0: 0, draw });
  return { paint, paintSea, seaShip, SEA, cam, BOY, REST, ITEMS, boy, SHIP_S };
})();
