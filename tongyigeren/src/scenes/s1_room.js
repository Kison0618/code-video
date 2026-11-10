// 场景 1（开场 → “你这个人，也是这样被换掉的”）
// 0–3 秒：夜里的海和一艘船 → 木板从船身往外翻，翻出来是阁楼里一个男孩在地毯上玩船
// 5–30 秒：男孩玩船。同时九样东西在很慢地换（这就是“第一次骗你”，必须全程留在画面里）
// 32–70 秒：揭穿。前后对比 → 顶上一排九张“前→后”卡片 → “一下子换”和“一点一点换”的对比
'use strict';
const S1 = (() => {
  const g = G6, BOY = { x: 884, y: 814 };
  const t = id => TL.s(id), te = id => TL.e(id);
  // 九样东西：名字、在画面里的位置（世界坐标）、开始慢慢换的时间段（占 a3→a14 这一段的比例）
  const ITEMS = [
    { key: 'wall', name: '墙', r: [1196, 330, 1376, 500], f: [0, .5] },
    { key: 'curtain', name: '窗帘', r: [500, 396, 588, 680], f: [.14, .56] },
    { key: 'quilt', name: '被子', r: [1100, 630, 1436, 746], f: [.3, .7] },
    { key: 'rug', name: '地毯', r: [524, 780, 1296, 844], f: [.04, .42] },
    { key: 'art', name: '画', r: [784, 220, 1016, 402], f: [.4, .76] },
    { key: 'lamp', name: '台灯', r: [970, 562, 1070, 668], f: [.5, .82] },
    { key: 'chair', name: '椅子', r: [564, 546, 688, 774], f: [.56, .86] },
    { key: 'toy', name: '小熊', r: [712, 476, 808, 624], f: [.62, .92] },
    { key: 'top', name: '衣服', r: [828, 694, 944, 800], f: [.7, 1] },
  ];
  const SW0 = () => t('a3') + .4, SW1 = () => te('a14') + .2;
  const swapK = (i, time) => { const a = SW0(), b = SW1(), it = ITEMS[i]; return E.io2(seg(time, a + (b - a) * it.f[0], a + (b - a) * it.f[1])); };
  const TOP0 = WHO[7].top, TOP1 = C('#7a5aa8');

  // ---------- 那片“海”：几层浪、雨、闪电，中间一艘船 ----------
  const SEA = { x: 960, y: 650, s: 3.3 };
  const tFlip = () => t('a2') - .12;                             // “第一次，已经开始了”：海翻成房间
  function seaShip(time, calm, sx) { const k = 1 - (calm || 0) * .6, x = sx || SEA.x, f = xx => k * (26 * Math.sin(xx * .006 - time * 1.9) + 12 * Math.sin(xx * .014 + time * 2.7)); return { y: SEA.y + f(x) * .8, tilt: Math.atan((f(x + 90) - f(x - 90)) / 180) * 1.1 }; }
  // calm = 0 暴风雨（开头）→ 1 天快亮、浪平了（结尾）
  function paintSea(ctx, time, calm, sx) {
    calm = calm || 0; sx = sx || SEA.x;
    const fl = (pulse(time, TL.at('a1', '骗') + .05, .05, .34) + pulse(time, TL.at('a1', '骗') + .32, .04, .22) * .6) * (1 - calm);
    let gr = ctx.createLinearGradient(0, 0, 0, 700); gr.addColorStop(0, css(mixc(mixc(C('#04060e'), C('#16254f'), calm), C('#3a4f86'), fl * .7))); gr.addColorStop(1, css(mixc(mixc(C('#0f1d3a'), C('#f0b287'), calm), C('#6f8fd0'), fl * .7)));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    const gx = calm ? sx : 1180; gr = ctx.createRadialGradient(gx, lerp(300, 560, calm), 20, gx, lerp(300, 560, calm), 620); gr.addColorStop(0, css(mixc([120, 150, 220], [255, 214, 150], calm), .34 + calm * .3)); gr.addColorStop(1, css(mixc([120, 150, 220], [255, 214, 150], calm), 0)); ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    for (let k = 0; k < 7; k++) { fs(ctx, [6, 9, 20], .5 * (1 - calm * .8)); const cx = hash(k * 3 + 1) * W + time * (8 + k * 3), cy = 60 + hash(k * 3 + 2) * 260; ctx.beginPath(); ctx.ellipse(cx % (W + 400) - 200, cy, 260 + hash(k) * 200, 60 + hash(k + 9) * 40, 0, 0, 7); ctx.fill(); }
    const sh = seaShip(time, calm, sx), cols = ['#0b2148', '#10306a', '#17408c', '#12336f', '#0b2350'], ak = 1 - calm * .55;
    for (let i = 0; i < 5; i++) {
      if (i === 2) drawShip(ctx, sx, sh.y + 16, SEA.s, Object.assign({ tilt: sh.tilt, planks: 1 }, calm ? SHIP_NEW : {}, calm ? { glow: calm * .5 } : {}));
      const base = 560 + i * 78, amp = (20 + i * 9) * ak, sp = (1.5 + i * .35) * (1 - calm * .4), f = x => amp * Math.sin(x * (.0052 + i * .0009) - time * sp + i * 1.7) + amp * .45 * Math.sin(x * (.013 + i * .002) + time * (sp + 1) + i);
      fs(ctx, mixc(mixc(C(cols[i]), C('#3a5f9a'), calm * .5), [150, 180, 255], fl * .25)); ctx.beginPath(); ctx.moveTo(0, H); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, base + f(x)); ctx.lineTo(W, H); ctx.closePath(); ctx.fill();
      fs(ctx, mixc([225, 238, 255], [255, 226, 180], calm), .8); for (let x = 0; x <= W; x += 12) { const y = f(x); if (y < -amp * .78) ctx.fillRect(x - 6, base + y - 5, 18, 10); }
      fs(ctx, [255, 255, 255], .07); ctx.beginPath(); ctx.moveTo(0, base + f(0) + 22); for (let x = 0; x <= W; x += 12) ctx.lineTo(x, base + f(x)); ctx.lineTo(W, base + f(W) + 22); ctx.closePath(); ctx.fill();
    }
    if (calm < 1) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'lighter';
      const gw = ctx.canvas.width, gh = ctx.canvas.height;
      for (let i = 0; i < 110; i++) { const sp = 1.6 + hash(i * 7 + 1) * 1.2, ph = (hash(i * 7 + 2) + time * sp) % 1, x = (hash(i * 7 + 3) * 1.3 - .1) * gw - ph * gh * .35, y = ph * (gh + 20) - 10; ctx.strokeStyle = css([150, 190, 255], .3 * (1 - calm) * (.4 + hash(i * 7 + 4) * .6)); ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 2.2, y + 6); ctx.stroke(); }
      ctx.restore();
    }
    const vg = ctx.createRadialGradient(W / 2, 560, 300, W / 2, 560, 1150); vg.addColorStop(0, 'rgba(2,3,8,0)'); vg.addColorStop(1, `rgba(2,3,8,${.8 - calm * .25})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }

  const REST = [BOY.x + 132, BOY.y];                             // 船平时停在他右手边的地毯上
  // ---------- 男孩和船 ----------
  function boy(time, version) {
    const bob = Math.sin(time * 1.7) * 2;
    const lift = env(time, t('a8') - .25, t('a8') + .35, te('a8') + .2, t('a9') + .35);          // “要当船长”：把船举高
    const hug = env(time, t('a10') - .1, t('a10') + .4, te('a11') + .1, t('a12'));               // “你先别笑他”：把船抱回怀里
    const cross = env(time, t('a13') - .15, t('a13') + .3, t('b1') - .4, t('b1') + .2);          // “就这脾气”：抱紧，身子一扭
    const hc = Math.max(hug, cross);
    let aR = [14, 4], aL = [12, 4];
    aR = [lerp(aR[0], 150, lift), lerp(aR[1], 14, lift)];
    aR = [lerp(aR[0], 40, hc), lerp(aR[1], -30, hc)]; aL = [lerp(aL[0], 24, hc), lerp(aL[1], -70, hc)];
    const top = version === 'then' ? TOP0 : version === 'now' ? TOP1 : mixc(TOP0, TOP1, swapK(8, time));
    const P = { who: 7, x: BOY.x, y: BOY.y, s: PS, floor: 1, layer: 'front', armR: aR, armL: aL, top, lean: 8 + hug * 8 - cross * 12, armsFront: 0 };
    const G = personGeo(P);
    const sail = env(time, t('a9') - .1, t('a9') + .5, te('a9'), te('a9') + .6);                 // “就喜欢海”：船在地毯上开出去一小段
    const rest = [REST[0] + sail * 90 * (.5 - .5 * Math.cos((time - t('a9')) * 2.4)), BOY.y];
    const held = lift, hx = G.handR[0] + 50, hy = G.handR[1] + 22;
    const ship = { x: lerp(rest[0], hx, held), y: lerp(rest[1], hy, held) + (held ? 0 : bob * .2), s: 1.1, tilt: lift * -.1 + sail * Math.sin(time * 5) * .05, layer: 'front' };
    return { P, ship };
  }
  // 镜头：开头是船的特写（和海里那艘在同一个位置、一样大），然后拉开
  const CLOSE = { z: 3.0, x: REST[0], y: REST[1] - (SEA.y - H / 2) / 3.0 };      // 3.0 × 船的 1.1 倍 = 海里那艘的 3.3 倍
  function cam(time) {
    const pull = E.io(seg(time, tFlip() + .75, t('a3') - .15));
    let c = camMix(CLOSE, ROOMCAM, pull);
    const drift = seg(time, t('a3'), te('a14')) - seg(time, t('b1'), t('b4') - .2);            // 很轻的推近，揭穿前回到原位
    c = camMix(c, { z: ROOMCAM.z * 1.03, x: ROOMCAM.x, y: ROOMCAM.y + 4 }, E.io2(sat(drift)) * pull);
    const push = E.io(seg(time, t('b13') - .1, te('b13') + .2));                                 // “你这个人”：推向男孩
    return camMix(c, { z: 2.1, x: BOY.x + 20, y: 690 }, push);
  }
  const TEEN = () => ({ who: 17, x: BOY.x, y: BOY.y, s: PS, floor: 1, layer: 'front', armR: [14, -40], armL: [14, -40], armsFront: 1 });

  // 画一遍房间。version: 'live'（按时间慢慢换）/ 'then'（你点开的时候）/ 'now'（换完以后）/ 'teen'（十七岁坐在同一个位置）
  function paint(ctx, time, version) {
    let S;
    if (version === 'then') S = ERA.v0; else if (version === 'now' || version === 'teen') S = ERA.v1;
    else { const k = {}; ITEMS.forEach((it, i) => k[it.key] = swapK(i, time)); S = blendEra(ERA.v0, ERA.v1, k); }
    const b = boy(time, version === 'teen' ? 'now' : version);
    const glow = env(time, t('a5') - .1, t('a5') + .5, te('a6'), te('a6') + .8);                 // “这艘小船”：船亮一下
    if (glow > 0 && version !== 'teen') b.ship.glow = glow * .9;
    const dimK = env(time, t('b1') - .2, t('b1') + .5, t('b3') - .1, t('b3') + .5);              // “现在说第一次骗你的事”：灯暗一点
    paintRoom(ctx, { S, people: version === 'teen' ? [TEEN()] : [b.P], ships: version === 'teen' ? [Object.assign({ layer: 'behind' }, shipAt('desk'))] : [b.ship], light: Object.assign({}, DAY, { amb: DAY.amb * (1 - dimK * .34) }), time });
  }

  // 前后对比时的分界线位置（0..1，线左边是“你点开的时候”）
  function divider(time) {
    const a = t('b4'), b = t('b5'), c0 = te('b5') + .5, c1 = t('b6') - .35;
    let d = E.io(seg(time, a, a + 1.0)) - E.io(seg(time, b, b + 1.0));
    if (c1 - c0 > 1.6) { const m = (c0 + c1) / 2; d += E.io(seg(time, c0, m - .1)) - E.io(seg(time, m + .1, c1)); }
    return sat(d);
  }
  const itemT = i => i < 8 ? TL.at('b6', ITEMS[i].name) : TL.at('b7', '衣服');
  const tileRect = (r, c) => { const a = g.cell(r[0], r[1], c), b = g.cell(r[2], r[3], c); return [a[0], a[1], b[0] + 1, b[1] + 1]; };
  // 每样东西被点到名时“闪回”一下原来的样子；“你发现了几样？”时九样一起闪回
  function blink(i, time) {
    const ti = itemT(i), all = t('b8'), out = t('b9') + .1;
    return Math.max(env(time, ti - .05, ti + .3, ti + .85, ti + 1.15), env(time, all - .1, all + .3, out, out + .4));
  }

  function draw(ctx, time) {
    const c = cam(time), tb4 = t('b4'), tb13 = t('b13');
    g.reset();
    if (time < tFlip() + .8) {
      // 海 → 房间：从船身往外，一块一块翻过去
      paintSea(g.begin('a'), time);
      if (time >= tFlip()) { paint(g.begin('b', c), time, 'live'); Flip.wave(g, seg(time, tFlip(), tFlip() + .75), { ox: SEA.x / g.p, oy: (SEA.y - 120) / g.p, width: 16, rnd: 7 }); }
      Post.blit(ctx, g.present({ flash: PAL.ink }), .5);
      return { band: .6 };
    }
    paint(g.begin('a', c), time, time < tb4 ? 'live' : 'now');
    let thumbs = null;
    if (time >= tb4 && time < tb13) {
      paint(g.begin('b', c), time, 'then');
      // 1) 分界线扫过去
      const d = divider(time);
      if (d > 0) { const { gw, gh, phase } = g, edge = d * (gw + 16) - 8; for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) phase[y * gw + x] = sat((edge - x + 4 * hash2(x, y)) / 7); }
      // 2) 九样东西：点到名的闪回原样
      ITEMS.forEach((it, i) => { const k = blink(i, time); if (k > 0) { const r = tileRect(it.r, c); Flip.wave(g, k, { rect: r, ox: (r[0] + r[2]) / 2, oy: (r[1] + r[3]) / 2, width: 5, rnd: 3, max: 1 }); } });
      // 3) “不是一下子换的”：整间屋子一下子翻回去；“是一点一点换的”：再一块一块换过来
      const tA = TL.at('b10', '一下子'), tS = t('b11'), tE = te('b12') - .15;
      if (time >= tA) {
        if (time < tS) Flip.wave(g, seg(time, tA, tA + .28), { dir: 'diag', ox: 0, oy: 0, width: 18, rnd: 4 });
        else { Flip.scatter(g, seg(time, tS, tE), { dur: .05, seed: 3 }); for (let i = 0; i < g.n; i++) g.phase[i] = 1 - g.phase[i]; }
      }
      // 卡片要用的小图：从两张画面里各裁一块
      if (time >= itemT(0) - .1 && time < t('b9') + 1) thumbs = ITEMS.map(it => { const r = tileRect(it.r, c), s = Math.max(r[2] - r[0], r[3] - r[1], 14), cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2; return [Math.round(cx - s / 2), Math.round(cy - s / 2), s]; });
    } else if (time >= tb13) {
      // “你这个人，也是这样被换掉的”：男孩身上的木板一块一块换成十七岁
      paint(g.begin('b', c), time, 'teen');
      const r = tileRect([BOY.x - 150, 500, BOY.x + 230, 836], c), tk = TL.at('b13', '也是');
      Flip.scatter(g, seg(time, tk, te('b13') + 1.2), { rect: r, dur: .12, seed: 9 });
    }
    Post.blit(ctx, g.present({}), .34);
    Post.dust(ctx, time, { a: seg(time, t('a3') - 1, t('a3')) });

    // ---------- 标签 ----------
    // 右上角的计时：从你点开到现在
    const cardsA = thumbs ? seg(time, itemT(0) - .1, itemT(0) + .2) * (1 - seg(time, t('b9') + .3, t('b9') + .9)) : 0;
    const tcA = seg(time, t('a3') + .3, t('a3') + 1) * (1 - seg(time, t('c1') - .3, t('c1'))) * (1 - cardsA);
    const mm = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
    if (tcA > 0) { ctx.save(); ctx.globalAlpha = tcA * .85; ctx.font = FONT.mono(32, 500); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.8)'; ctx.shadowBlur = 8; ctx.fillStyle = css(PAL.ink); ctx.fillText(mm(time), W - 64, 66); ctx.fillStyle = css(PAL.hot); ctx.fillRect(W - 64 - 124, 59, 12, 12); ctx.restore(); }
    if (time >= tb4 && time < tb13) {
      const d = divider(time), x = d * W;
      if (d > 0.004 && d < .996) { ctx.fillStyle = css(PAL.gold, .95); ctx.fillRect(x - 2, 0, 4, H); }
      const aL = sat(d * 6), aR = sat((1 - d) * 6) * sat(d * 30 + seg(time, t('b5'), t('b5') + .2));
      if (d > 0.004) {
        HUD.tag(ctx, Math.max(84, x - 30), 150, '你点开的时候', { a: aL, align: x < 420 ? 'left' : 'right', col: PAL.gold, px: 34 });
        HUD.tag(ctx, Math.max(84, x - 30), 206, mm(t('a3')), { a: aL, align: x < 420 ? 'left' : 'right', mono: 1, px: 28, box: false });
        if (d < .97) { HUD.tag(ctx, Math.min(W - 84, x + 30), 150, '现在', { a: aR, col: PAL.ink, px: 34 }); HUD.tag(ctx, Math.min(W - 84, x + 30), 206, mm(time), { a: aR, mono: 1, px: 28, box: false }); }
      }
      // 顶上一排卡片：每张 = 原来的样子 → 现在的样子
      if (thumbs && cardsA > 0) {
        const cw = 184, gap = 12, x0 = (W - (cw * 9 + gap * 8)) / 2, y0 = 34, th = 74;
        ctx.save(); ctx.imageSmoothingEnabled = false;
        ITEMS.forEach((it, i) => {
          const ti = itemT(i), k = E.back(seg(time, ti - .04, ti + .3)); if (k <= 0) return;
          const cx = x0 + i * (cw + gap), cy = y0 - (1 - sat(k)) * 30, cur = Math.max(env(time, ti, ti + .1, ti + .9, ti + 1.2), pulse(time, t('b8'), .12, .6));
          ctx.globalAlpha = cardsA * sat(k * 1.5);
          ctx.fillStyle = 'rgba(8,10,16,.9)'; ctx.fillRect(cx, cy, cw, 142);
          ctx.fillStyle = css(mixc(PAL.dim, PAL.gold, cur)); ctx.fillRect(cx, cy, cw, 5);
          const q = thumbs[i];
          ctx.drawImage(g.cb, q[0], q[1], q[2], q[2], cx + 10, cy + 16, th, th);
          ctx.drawImage(g.ca, q[0], q[1], q[2], q[2], cx + cw - 10 - th, cy + 16, th, th);
          ctx.fillStyle = css(PAL.ink); ctx.font = FONT.mono(26, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('→', cx + cw / 2, cy + 16 + th / 2);
          ctx.font = FONT.sans(30); ctx.fillStyle = css(mixc(PAL.ink, PAL.gold, cur)); ctx.fillText(it.name, cx + cw / 2, cy + 118);
          // 一条细线连到屋里那样东西
          const p0 = toScreen(c, (it.r[0] + it.r[2]) / 2, it.r[1]);
          if (cur > 0.02) { ctx.globalAlpha = cardsA * cur * .8; ctx.strokeStyle = css(PAL.gold); ctx.lineWidth = 2.5; ctx.setLineDash([8, 7]); ctx.beginPath(); ctx.moveTo(cx + cw / 2, cy + 142); ctx.lineTo(p0[0], Math.max(cy + 150, p0[1] - 6)); ctx.stroke(); ctx.setLineDash([]); const p1 = toScreen(c, it.r[2], it.r[3]), pa = toScreen(c, it.r[0], it.r[1]); HUD.bracket(ctx, pa[0], pa[1], p1[0] - pa[0], p1[1] - pa[1], cur, { len: 18, lw: 4, a: cardsA }); }
        });
        ctx.restore();
      }
      // “一下子” / “一点一点”
      const tA = TL.at('b10', '一下子'), tS = t('b11'), tE = te('b12') - .15;
      if (time >= tA - .1 && time < tS) HUD.tag(ctx, W / 2, 150, '一下子换：一眼就看出来了', { a: env(time, tA + .15, tA + .4, tS - .25, tS), align: 'center', col: PAL.hot, px: 36 });
      if (time >= tS) {
        const p = seg(time, tS, tE), a = env(time, tS, tS + .3, te('b12') + .5, tb13);
        HUD.tag(ctx, W / 2 - 250, 150, '一点一点换', { a, col: PAL.gold, px: 36 });
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = 'rgba(6,7,12,.78)'; ctx.fillRect(W / 2 - 20, 124, 330, 52); ctx.fillStyle = css(PAL.ink, .25); ctx.fillRect(W / 2, 146, 190, 8); ctx.fillStyle = css(PAL.gold); ctx.fillRect(W / 2, 146, 190 * p, 8);
        ctx.font = FONT.mono(30, 700); ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.fillText(Math.round(p * 100) + '%', W / 2 + 294, 152); ctx.restore();
      }
    }
    // “不是那片海”：左上角翻出开头那一幕，打叉
    const seaA = env(time, t('b2') - .1, t('b2') + .25, t('b3') - .15, t('b3') + .2);
    if (seaA > 0) drawSeaInset(ctx, time, seaA);
    // “是这个房间”：小屋的轮廓亮起来
    const frK = env(time, t('b3'), t('b3') + .6, t('b4') - .3, t('b4') + .2);
    if (frK > 0) {
      const pts = [[HOUSE.l, HOUSE.base], [HOUSE.l, HOUSE.eave], HOUSE.peak, [HOUSE.r, HOUSE.eave], [HOUSE.r, HOUSE.base], [HOUSE.l, HOUSE.base]].map(q => toScreen(c, q[0], q[1]));
      const len = pts.slice(1).reduce((s, q, i) => s + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0), k = E.out(seg(time, t('b3'), t('b3') + .6));
      ctx.save(); ctx.globalAlpha = frK; ctx.strokeStyle = css(PAL.gold); ctx.lineWidth = 6; ctx.lineJoin = 'round'; ctx.setLineDash([len * k, len]); ctx.beginPath(); pts.forEach((q, i) => ctx[i ? 'lineTo' : 'moveTo'](q[0], q[1])); ctx.stroke(); ctx.restore();
    }
    return { noCorner: cardsA > .5 };
  }

  // 小画面：开头那片“海”
  const mini = document.createElement('canvas'); mini.width = 92; mini.height = 52; const mx = mini.getContext('2d');
  function drawSeaInset(ctx, time, a) {
    const t0 = 1.2 + (time % 2) * .4, x = 84, y = 128, w = 460, h = 260;
    mx.setTransform(92 / W, 0, 0, 92 / W, 0, 0); mx.globalCompositeOperation = 'source-over'; paintSea(mx, t0);
    ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = 'rgba(4,5,9,.9)'; ctx.fillRect(x - 8, y - 8, w + 16, h + 16);
    ctx.drawImage(mini, x, y, w, h);
    ctx.fillStyle = 'rgba(4,5,9,.55)'; for (let i = 0; i <= 92; i++) ctx.fillRect(x + i * 5 - 1, y, 1, h); for (let j = 0; j <= 52; j++) ctx.fillRect(x, y + j * 5 - 1, w, 1);
    const k2 = E.out(seg(time, TL.at('b2', '不是'), TL.at('b2', '不是') + .3));
    ctx.strokeStyle = css(PAL.hot); ctx.lineWidth = 8; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x + 30, y + 30); ctx.lineTo(lerp(x + 30, x + w - 30, k2), lerp(y + 30, y + h - 30, k2)); ctx.stroke();
    ctx.restore();
    HUD.tag(ctx, x, y + h + 42, '那片海', { a, px: 32, col: PAL.ink });
  }

  SCENES.push({ name: 'room', t0: 0, draw });
  return { paint, paintSea, seaShip, SEA, cam, BOY, ITEMS, TEEN };
})();
