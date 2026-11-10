// 场景 5（“现在，把那艘船换成你” → “记忆，总是原装的吧？”）
// 粗木板（12px）拼成的人。胃壁 / 皮肤 / 血 / 骨头 依次换新：每块旧木板弹出来，沿一道弧线流到右边
// 它们在右边按原来的位置落好——身上换了多少，旁边就拼出多少。“早够再拼一个你”时，右边正好拼完
// “也有不肯换的”：镜头推进脑袋，一小簇金色的木板（神经细胞）始终不换；记忆卡片飞进去
'use strict';
const S5 = (() => {
  const g = G12, p = g.p, t = TL.s, te = TL.e;
  const ME = { who: 27, x: 564, y: 924, s: 2.1, armL: [9, 3], armR: [9, 3], noShadow: 1 };
  const DX = 71 * p;                                          // 第二个人站在右边多远
  const SKIN = WHO[27].skin;
  const COL = { stomach: C('#f28d8d'), blood: C('#e4433a'), bone: C('#efe8d6'), brain: C('#2c2748') };
  const G0 = personGeo(ME);
  const HEAD = { x: G0.headC[0], y: G0.top + G0.headH * .36 };
  const tZoom = () => t('f8') - .1;

  function backdrop(ctx) {
    fs(ctx, C('#07080d')); ctx.fillRect(0, 0, W, H);
    let gr = ctx.createRadialGradient(900, 520, 60, 900, 520, 1000); gr.addColorStop(0, 'rgba(56,66,96,.46)'); gr.addColorStop(.6, 'rgba(26,30,48,.2)'); gr.addColorStop(1, 'rgba(7,8,13,0)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    gr = ctx.createLinearGradient(0, 924, 0, H); gr.addColorStop(0, '#2b3044'); gr.addColorStop(.2, '#1a1d2b'); gr.addColorStop(1, '#0a0b12');
    ctx.fillStyle = gr; ctx.fillRect(0, 924, W, H - 924);
    fs(ctx, [200, 215, 255], .12); ctx.fillRect(0, 924, W, 12);
  }
  // 身体里面的样子（只画零件，透明底）
  function organs(ctx, which) {
    const G = G0, s = G.s, cx = G.cx + G.lean, d = G.d, lw = 13;
    ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    const line = (col, pts, w) => { ctx.strokeStyle = css(col); ctx.lineWidth = w || lw; ctx.beginPath(); pts.forEach((q, i) => ctx[i ? 'lineTo' : 'moveTo'](q[0], q[1])); ctx.stroke(); };
    const legX = side => cx + side * d.torso[0] * s * .22;
    if (which === 'bone') {
      line(COL.bone, [[cx, G.sh + 6], [cx, G.hip + 4]]);
      for (let k = 0; k < 4; k++) line(COL.bone, [[cx - 62 + k * 5, G.sh + 44 + k * 30], [cx + 62 - k * 5, G.sh + 44 + k * 30]], 11);
      line(COL.bone, [[cx - 56, G.hip + 2], [cx + 56, G.hip + 2]], 14);
      for (const sd of [-1, 1]) { line(COL.bone, [[legX(sd), G.hip + 10], [legX(sd), ME.y - 30]]); const a = sd < 0 ? G.aL : G.aR; line(COL.bone, [[a[0], a[1] + 6], [a[2], a[3]], [a[4], a[5] - 6]]); }
    } else if (which === 'blood') {
      const hx = cx - 24, hy = G.sh + 70;
      fs(ctx, COL.blood); ctx.fillRect(hx - 24, hy - 24, 48, 48);
      line(COL.blood, [[hx, hy], [cx + 24, hy + 30], [cx + 24, G.hip - 10], [legX(1) + 18, G.hip + 20], [legX(1) + 18, ME.y - 40]], 11);
      line(COL.blood, [[hx, hy + 20], [cx - 26, G.hip - 10], [legX(-1) - 18, G.hip + 20], [legX(-1) - 18, ME.y - 40]], 11);
      line(COL.blood, [[hx, hy - 20], [cx + 14, G.sh + 16]], 11);
      for (const sd of [-1, 1]) { const a = sd < 0 ? G.aL : G.aR; line(COL.blood, [[cx + sd * 30, G.sh + 30], [a[0] + sd * 8, a[1] + 4], [a[2] + sd * 10, a[3]], [a[4] + sd * 8, a[5] - 20]], 10); }
    } else if (which === 'stomach') {
      fs(ctx, COL.stomach); ctx.beginPath(); ctx.ellipse(cx + 18, G.sh + G.torsoH * .68, 52, 40, -.3, 0, 7); ctx.fill();
    } else if (which === 'brain') {
      fs(ctx, COL.brain); rr(ctx, HEAD.x - 46, G.top + 8, 92, G.headH * .54, 18);
    }
  }
  // 画面：ver = 'out'（平常的样子）/ 'in'（看得见里面）
  function paint(ctx, ver) {
    backdrop(ctx);
    fs(ctx, [0, 0, 0], .4); ctx.beginPath(); ctx.ellipse(ME.x, ME.y + 8, 150, 16, 0, 0, 7); ctx.fill();
    drawPerson(ctx, ME);
    if (ver === 'in') { for (const k of ['stomach', 'bone', 'blood', 'brain']) organs(ctx, k); for (const n of neurons()) { fs(ctx, PAL.gold); ctx.fillRect(n[0] * p, n[1] * p, p, p); } }
  }
  function paintShip(ctx) { backdrop(ctx); fs(ctx, [0, 0, 0], .4); ctx.beginPath(); ctx.ellipse(ME.x, ME.y + 8, 240, 16, 0, 0, 7); ctx.fill(); drawShip(ctx, 564, 924, 4, Object.assign({}, SHIP_NEW, { planks: 1 })); }
  // 脑袋里那一小簇“不肯换的”：固定的十几块
  let NEU = null;
  function neurons() {
    if (NEU) return NEU; NEU = [];
    const cx = Math.floor(HEAD.x / p), cy = Math.floor((G0.top + 18) / p);
    for (const [dx, dy] of [[-3, 0], [-1, 0], [2, 0], [-2, 1], [0, 1], [3, 1], [-3, 2], [-1, 2], [1, 2], [2, 3], [-2, 3], [0, 3]]) NEU.push([cx + dx, cy + dy]);
    return NEU;
  }
  // 每块木板属于哪个零件、什么时候被换下来、掉到哪、最后拼到第二个人的哪里
  let CELLS = null;
  function build() {
    const x = g.tx[0], mask = fn => { x.setTransform(1, 0, 0, 1, 0, 0); x.globalAlpha = 1; x.clearRect(0, 0, g.gw, g.gh); x.setTransform(1 / p, 0, 0, 1 / p, 0, 0); fn(x); return x.getImageData(0, 0, g.gw, g.gh).data; };
    const body = mask(c => drawPerson(c, ME)), ms = mask(c => organs(c, 'stomach')), mb = mask(c => organs(c, 'blood')), mo = mask(c => organs(c, 'bone')), mbr = mask(c => organs(c, 'brain'));
    const neu = new Set(neurons().map(n => n[1] * g.gw + n[0]));
    const T2 = TL.at('f2', '几天') - .1, T3 = t('f3') - .05, T4 = t('f4') - .05, T5 = t('f5') - .05, TE = te('f5') + .6;
    const out = [], yTop = G0.top, yBot = ME.y, hx = G0.cx - 24, hy = G0.sh + 70;
    for (let iy = 0; iy < g.gh; iy++) for (let ix = 0; ix < g.gw; ix++) {
      const i = iy * g.gw + ix, o = i * 4; if (body[o + 3] < 120) continue;
      const wx = (ix + .5) * p, wy = (iy + .5) * p, r = hash2(ix, iy), r2 = hash2(ix + 31, iy + 7), r3 = hash2(ix + 3, iy + 59);
      const isSkin = Math.abs(body[o] - SKIN[0]) + Math.abs(body[o + 1] - SKIN[1]) + Math.abs(body[o + 2] - SKIN[2]) < 60;
      let part = 'rest', ts, tr;                              // ts = 被换下来的时刻，tr = 露出里面的时刻
      const v = (wy - yTop) / (yBot - yTop);
      if (neu.has(i)) part = 'neuron';
      else if (ms[o + 3] > 120) { part = 'stomach'; tr = T2 - .25 + r * .15; ts = T2 + r * .25; }
      else if (mb[o + 3] > 120) { part = 'blood'; const d = Math.hypot(wx - hx, wy - hy) / 620; tr = T4 - .1 + d * .5; ts = T4 + .15 + d * .7 + r * .05; }
      else if (mo[o + 3] > 120) { part = 'bone'; tr = T5 - .1 + (1 - v) * .5; ts = T5 + .2 + (1 - v) * .7 + r * .05; }
      else if (isSkin) { part = 'skin'; ts = T3 + .1 + v * .8 + r * .08; }
      else ts = T2 + .4 + r * (TE - T2 - .6);
      if (mbr[o + 3] > 120 && part !== 'neuron') { tr = t('f9') - .45 + r * .3; }                 // 脑袋打开：露出里面
      if (part === 'neuron') { out.push({ ix, iy, i, part }); continue; }
      out.push({ ix, iy, i, part, ts, tr, r, r2, r3, v });
    }
    // 最后一批（还没换过的）在“早够再拼一个你”这句里补齐
    const T6 = t('f6'), T7 = te('f7') - .9;
    for (const c of out) if (c.ts !== undefined && c.ts > T6 - .2) c.ts = T6 - .2 + c.r * Math.max(.2, T7 - T6);
    return out;
  }
  function draw(ctx, time) {
    if (!CELLS) CELLS = build();
    g.reset();
    const tIn = t('f1'), tSwap = TL.at('f1', '换成') - .05, zoom = E.io(seg(time, tZoom(), tZoom() + 1.6)), zoom2 = E.io(seg(time, t('f12') - .2, te('f13') + .6));
    const view = camMix(camMix(CAM0, { z: 2.9, x: HEAD.x, y: HEAD.y + 46 }, zoom), { z: 4.2, x: HEAD.x, y: HEAD.y + 14 }, zoom2);
    let loose = null;
    if (time < tSwap + .9) {
      // 船 → 你：从船身往外翻
      paintShip(g.begin('a')); paint(g.begin('b'), 'out');
      Flip.wave(g, seg(time, tSwap, tSwap + .85), { ox: 564 / p, oy: 640 / p, width: 10, rnd: 6 });
      if (time < tIn + .5) g.fromBlack(seg(time, tIn - .05, tIn + .5), { ox: 564 / p, oy: 50 });
    } else {
      paint(g.begin('a'), 'out'); paint(g.begin('b'), 'in');
      const sa = g.sample('a'); loose = [];
      for (const c of CELLS) {
        if (c.part === 'neuron') { if (time >= t('f9') - .2) { g.phase[c.i] = seg(time, t('f9') - .2 + hash(c.i) * .5, t('f9') + .1 + hash(c.i) * .5); g.gain[c.i] = .25 + .25 * Math.sin(time * 3 + c.i); } continue; }
        if (c.tr !== undefined && time >= c.tr) g.phase[c.i] = seg(time, c.tr, c.tr + .3);
        // 被换下来的那一刻：闪一下
        if (time >= c.ts) g.gain[c.i] = Math.max(g.gain[c.i], Math.max(0, 1 - (time - c.ts) / .4) * .8);
        // 胃壁换得最勤：一直在一圈圈地闪；骨头最慢
        if (c.part === 'stomach' && time > c.ts) g.gain[c.i] = Math.max(g.gain[c.i], .5 * Math.max(0, Math.sin((time - c.ts) * 9 - c.r * 6)));
        if (c.part === 'skin' && time > c.ts && zoom > 0) g.gain[c.i] = Math.max(g.gain[c.i], .22 * Math.max(0, Math.sin(time * 5 - c.r * 20)));
        if (time < c.ts) continue;
        const o = c.i * 4, col = mul([sa[o], sa[o + 1], sa[o + 2]], .82), x0 = c.ix * p, y0 = c.iy * p;
        // 旧木板：弹出来 → 沿弧线流到右边 → 在第二个人身上同样的位置落好
        const k = seg(time, c.ts, c.ts + 1.5 + c.r * .5), e = E.io(k), done = k >= 1;
        const x = lerp(x0, x0 + DX, e) + Math.sin(k * Math.PI) * 40 * (c.r2 - .5), y = y0 - Math.sin(k * Math.PI) * (150 + c.r3 * 190) * (1 - c.v * .5), rot = done ? 0 : (1 - e) * 7 * (c.r - .5) + k * 3;
        loose.push({ x, y, rot, col, done });
      }
    }
    const outK = seg(time, t('g1') - .55, t('g1') - .1);
    if (outK > 0) g.toBlack(outK, { ox: HEAD.x / p, oy: HEAD.y / p });
    const img = g.present({});
    if (loose && outK <= 0) {
      const x = g.ox, s = p - g.gap;
      for (const q of loose) {
        if (q.done) { x.fillStyle = css(mul(q.col, .5)); x.fillRect(q.x, q.y, p, p); x.fillStyle = css(q.col); x.fillRect(q.x, q.y, s, s); }
        else if (q.rot) { x.save(); x.translate(q.x + s / 2, q.y + s / 2); x.rotate(q.rot); x.fillStyle = css(q.col); x.fillRect(-s / 2, -s / 2, s, s); x.restore(); }
        else { x.fillStyle = css(q.col); x.fillRect(q.x, q.y, s, s); }
      }
    }
    ctx.imageSmoothingEnabled = view.z < 1.02;
    Post.blit(ctx, img, .4, view);
    ctx.imageSmoothingEnabled = true;
    Post.dust(ctx, time, { a: .6, col: [190, 205, 255] });
    const oa = 1 - outK, vs = (x, y) => toScreen(view, x, y);

    // ---------- 标签：四样零件多久换一次（条越长，换得越慢） ----------
    const rows = [['胃壁', '几天', 'f2', 56, [G0.cx + 40, G0.sh + G0.torsoH * .68]], ['皮肤', '一个月', 'f3', 130, [G0.headC[0] + 50, G0.top + G0.headH * .7]], ['血', '四个月', 'f4', 196, [G0.cx - 4, G0.sh + 72]], ['骨头', '十年', 'f5', 330, [G0.cx + 10, G0.hip - 40]]];
    const la = (1 - seg(time, tZoom() - .1, tZoom() + .5)) * oa;
    rows.forEach((r, k) => {
      const t0 = t(r[2]) - .05, a = seg(time, t0, t0 + .25) * la; if (a <= 0) return;
      const x = 790, y = 330 + k * 118, t1 = TL.at(r[2], r[1]), kk = E.out(seg(time, t1, t1 + .5));
      ctx.save(); ctx.globalAlpha = a; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 12;
      ctx.font = FONT.serif(58, 700); ctx.fillStyle = css(PAL.ink); ctx.fillText(r[0], x, y);
      ctx.shadowBlur = 0; ctx.fillStyle = css(PAL.ink, .18); ctx.fillRect(x + 150, y + 24, 280, 6); ctx.fillStyle = css(PAL.gold); ctx.fillRect(x + 150, y + 24, r[3] * .85 * kk, 6);
      ctx.shadowBlur = 12; ctx.globalAlpha = a * seg(time, t1 - .05, t1 + .15); ctx.font = FONT.serif(46, 900); ctx.fillStyle = css(PAL.gold); ctx.fillText(r[1], x + 150, y - 10);
      ctx.restore();
      HUD.line(ctx, x - 22, y, r[4][0], r[4][1], seg(time, t0 + .1, t0 + .5), { a: .45 * a, lw: 2, dash: [8, 8] });
    });
    // 第二个人
    HUD.tag(ctx, ME.x + DX, 150, '换下来的旧零件', { a: env(time, t('f6'), t('f6') + .3, tZoom() - .2, tZoom() + .3) * oa, align: 'center', px: 34 });
    // 脑袋里
    if (zoom > 0) {
      const na = seg(time, t('f9'), t('f9') + .5) * oa, ns = neurons().map(n => vs((n[0] + .5) * p - 1, (n[1] + .5) * p - 1));
      if (na > 0) {                                           // 神经细胞之间的连线
        ctx.save(); ctx.globalAlpha = na * .7; ctx.strokeStyle = css(PAL.gold); ctx.lineWidth = 2.5;
        ns.forEach((a, i) => { const b = ns[(i * 5 + 3) % ns.length], c2 = ns[(i * 7 + 1) % ns.length], kk = seg(time, t('f9') + i * .06, t('f9') + .5 + i * .06); for (const q of [b, c2]) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], q[0], kk), lerp(a[1], q[1], kk)); ctx.stroke(); } });
        ctx.restore();
      }
      const lp = vs(HEAD.x + 60, G0.top + 30), lx = Math.min(W - 620, lp[0] + 150);
      const a9 = seg(time, t('f9'), t('f9') + .3) * (1 - seg(time, t('f11') - .35, t('f11') - .05)) * oa;
      if (a9 > 0) {
        HUD.line(ctx, lx - 20, 300, lp[0], lp[1], seg(time, t('f9') + .1, t('f9') + .5), { a: .5 * a9, lw: 2, dash: [8, 8] });
        ctx.save(); ctx.globalAlpha = a9; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 12;
        ctx.font = FONT.serif(58, 700); ctx.fillStyle = css(PAL.ink); ctx.fillText('神经细胞', lx, 300);
        const k10 = E.out(seg(time, TL.at('f10', '一辈子'), TL.at('f10', '一辈子') + .6));
        ctx.shadowBlur = 0; ctx.fillStyle = css(PAL.ink, .18); ctx.fillRect(lx, 366, 520, 6); ctx.fillStyle = css(PAL.gold); ctx.fillRect(lx, 366, 520 * k10, 6);
        ctx.shadowBlur = 12; ctx.globalAlpha = a9 * seg(k10, 0, .3); ctx.font = FONT.serif(46, 900); ctx.fillStyle = css(PAL.gold); ctx.fillText('一辈子', lx + 260, 300);
        ctx.restore();
      }
      // “那‘你’，总该住在那儿吧？”
      const a11 = env(time, TL.at('f11', '你'), TL.at('f11', '你') + .3, t('f12') - .3, t('f12')) * oa;
      if (a11 > 0) { const b0 = vs(HEAD.x - 50, G0.top + 6), b1 = vs(HEAD.x + 50, G0.top + 6 + G0.headH * .56); HUD.bracket(ctx, b0[0], b0[1], b1[0] - b0[0], b1[1] - b0[1], a11, { len: 40, lw: 6 }); HUD.big(ctx, '“你”？', lx + 160, 330, 96, { a: a11, hl: PAL.gold }); }
    }
    // 记忆卡片：一直钉在右上角；“那里存着你的记忆”时飞进脑袋
    const fly = E.io(seg(time, t('f12'), t('f12') + .9)), bc = vs(HEAD.x, G0.top + 44);
    const cs = lerp(1, .78, fly), cx = lerp(W - 64 - 250, bc[0] - 125 * .78, fly), cy = lerp(110, bc[1] - 75 * .78, fly);
    drawMemCard(ctx, cx, cy, cs, oa * seg(time, tIn - .2, tIn + .2));
    const a13 = seg(time, TL.at('f13', '原装'), TL.at('f13', '原装') + .25) * oa;
    if (a13 > 0) HUD.big(ctx, '原装？', bc[0] + 330, bc[1] + 10, 92, { a: a13, hl: PAL.gold });
    return {};
  }
  SCENES.push({ name: 'body', t0: t('f1') - .08, draw });
  return { HEAD, paint, ME };
})();
