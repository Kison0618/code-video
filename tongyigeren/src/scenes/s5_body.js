// 场景 5（“现在，把那艘船换成你” → “记忆，总是原装的吧？”）
// 一个纸人。胃壁、皮肤、血、骨头依次换新：每换一片，旧的那片就飘到右边，在同样的位置落好——身上换了多少，旁边就拼出多少
// “早够再拼一个你”时右边正好拼完。然后镜头推进脑袋：一小簇金色的神经细胞不换，记忆卡片飞进去
'use strict';
const S5 = (() => {
  const t = TL.s, te = TL.e;
  const ME = { who: 27, x: 400, y: 936, s: 2.1, armL: [9, 3], armR: [9, 3], top: C('#7fa2ae'), flat: 1 }, DX = 500, G0 = personGeo(ME);
  const HEAD = { x: G0.headC[0], y: G0.headC[1] }, BRAIN = { x: G0.headC[0], y: G0.top + G0.headH * .26, w: 104, h: 64 };
  const COL = { stomach: C('#f39a9a'), blood: C('#e2463c'), bone: C('#fbf6ea') };
  const tZoom = () => t('f8') - .1, SW = 600, SHh = 1000, OX = ME.x - SW / 2, OY = ME.y - (SHh - 50);

  function backdrop(ctx) {
    shOff(ctx); fs(ctx, C('#272c52')); ctx.fillRect(-2000, -2000, 6000, 5000);
    const g = ctx.createRadialGradient(W / 2, 480, 60, W / 2, 480, 1100); g.addColorStop(0, 'rgba(130,140,220,.3)'); g.addColorStop(1, 'rgba(14,16,36,.5)'); ctx.fillStyle = g; ctx.fillRect(-2000, -2000, 6000, 5000);
    shOn(ctx, 1.6); fs(ctx, C('#1c2040')); ctx.fillRect(-2000, 936, 6000, 2000); shOff(ctx); fs(ctx, [190, 200, 255], .12); ctx.fillRect(-2000, 936, 6000, 6);
  }
  // 身体里的零件（纸片）
  function organ(ctx, which) {
    const G = G0, s = G.s, cx = G.cx + G.lean, d = G.d; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const line = (col, pts, w) => { ctx.strokeStyle = css(col); ctx.lineWidth = w; ctx.beginPath(); pts.forEach((q, i) => ctx[i ? 'lineTo' : 'moveTo'](q[0], q[1])); ctx.stroke(); };
    const legX = side => cx + side * d.torso[0] * s * .23;
    if (which === 'bone') {
      line(COL.bone, [[cx, G.sh + 16], [cx, G.hip - 6]], 14);
      for (let k = 0; k < 4; k++) line(COL.bone, [[cx - 62 + k * 5, G.sh + 50 + k * 30], [cx + 62 - k * 5, G.sh + 50 + k * 30]], 11);
      line(COL.bone, [[cx - 54, G.hip + 2], [cx + 54, G.hip + 2]], 15);
      for (const sd of [-1, 1]) { line(COL.bone, [[legX(sd), G.hip + 22], [legX(sd), ME.y - 40]], 14); const a = sd < 0 ? G.aL : G.aR; line(COL.bone, [[a[0], a[1] + 10], [a[2], a[3]], [a[4], a[5] - 16]], 12); }
    } else if (which === 'blood') {
      const hx = cx - 26, hy = G.sh + 78;
      line(COL.blood, [[hx, hy], [cx + 28, hy + 30], [cx + 28, G.hip - 12], [legX(1) + 20, G.hip + 20], [legX(1) + 20, ME.y - 46]], 9);
      line(COL.blood, [[hx, hy + 14], [cx - 30, G.hip - 12], [legX(-1) - 20, G.hip + 20], [legX(-1) - 20, ME.y - 46]], 9);
      for (const sd of [-1, 1]) { const a = sd < 0 ? G.aL : G.aR; line(COL.blood, [[cx + sd * 30, G.sh + 34], [a[0] + sd * 9, a[1] + 6], [a[2] + sd * 11, a[3]], [a[4] + sd * 9, a[5] - 24]], 8); }
      fs(ctx, COL.blood); ctx.beginPath(); ctx.moveTo(hx, hy + 30); ctx.bezierCurveTo(hx - 50, hy - 6, hx - 22, hy - 44, hx, hy - 18); ctx.bezierCurveTo(hx + 22, hy - 44, hx + 50, hy - 6, hx, hy + 30); ctx.fill();
    } else if (which === 'stomach') { fs(ctx, COL.stomach); ctx.beginPath(); ctx.ellipse(cx + 20, G.sh + G.torsoH * .7, 54, 40, -.35, 0, 7); ctx.fill(); fs(ctx, lite(COL.stomach, .3)); ctx.beginPath(); ctx.ellipse(cx + 8, G.sh + G.torsoH * .66, 22, 13, -.35, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  // 把整个人和三样零件各存成一张小图，旧的那些“片”就是从这些图上横着裁下来的
  let SPR = null;
  function sprites() {
    if (SPR) return SPR;
    const mk = fn => { const c = document.createElement('canvas'); c.width = SW; c.height = SHh; const x = c.getContext('2d'); x._z = 1; x.translate(-OX, -OY); fn(x); return c; };
    SPR = { body: mk(c => drawPerson(c, ME)), stomach: mk(c => organ(c, 'stomach')), blood: mk(c => organ(c, 'blood')), bone: mk(c => organ(c, 'bone')) };
    const yTop = G0.top - OY - 16, yBot = ME.y - OY + 8, band = (n, i) => [yTop + (yBot - yTop) * i / n, yTop + (yBot - yTop) * (i + 1) / n];
    const P = [], T2 = TL.at('f2', '几天') - .1, T3 = t('f3'), T4 = t('f4'), T5 = t('f5'), sy = G0.sh + G0.torsoH * .7 - OY;
    for (let k = 0; k < 3; k++) P.push({ spr: 'stomach', y0: sy - 60, y1: sy + 60, ts: T2 + k * .42, z: 3 });                                    // 胃壁换得最勤
    for (let i = 0; i < 8; i++) { const b = band(8, i); P.push({ spr: 'body', y0: b[0], y1: b[1], ts: T3 + .05 + i * .09, z: 0 }); }               // 皮肤（连人带衣）
    for (let i = 0; i < 4; i++) { const b = band(4, i); P.push({ spr: 'blood', y0: b[0], y1: b[1], ts: T4 + .05 + i * .1, z: 2 }); }
    for (let i = 0; i < 5; i++) { const b = band(5, i); P.push({ spr: 'bone', y0: b[0], y1: b[1], ts: T5 + .05 + i * .1, z: 1 }); }
    P.forEach((p, i) => { p.r = hash(i * 7 + 3); p.dur = 1.25 + p.r * .25; });
    SPR.pieces = P; return SPR;
  }
  function drawPiece(ctx, S, p, dx, dy, rot, lift) {
    const h = p.y1 - p.y0, cx = ME.x + dx, cy = OY + (p.y0 + p.y1) / 2 + dy;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); if (lift > 0) shOn(ctx, lift); ctx.drawImage(S[p.spr], 0, p.y0, SW, h, -SW / 2, -h / 2, SW, h); ctx.restore();
  }
  function draw(ctx, time) {
    const S = sprites(), tIn = t('f1') - .08, tSwap = TL.at('f1', '换成') - .05;
    const zoom = E.io(seg(time, tZoom(), tZoom() + 1.6)), zoom2 = E.io(seg(time, t('f12') - .2, te('f13') + .6));
    const view = camMix(camMix(CAM0, { z: 2.9, x: HEAD.x + 190, y: HEAD.y + 60 }, zoom), { z: 4.0, x: HEAD.x + 130, y: HEAD.y + 10 }, zoom2);
    camApply(ctx, view); backdrop(ctx);
    fs(ctx, [10, 10, 24], .4); ctx.beginPath(); ctx.ellipse(ME.x, ME.y + 6, 160, 14, 0, 0, 7); ctx.fill();
    // 船 → 你：船翻个面，是一个人
    const sw = seg(time, tSwap, tSwap + .7);
    swap(ctx, sw <= 0 ? 'ship' : sw >= 1 ? 'me' : { __x: 1, a: 'ship', b: 'me', k: sw, mode: 'flip' }, { mode: 'flipX', x: ME.x }, (c, v) => {
      if (v === 'ship') { drawShip(c, ME.x, ME.y, 4.2, SHIP_NEW); return; }
      c.save(); shOn(c, 1); c.drawImage(S.body, OX, OY); shOff(c); c.restore();
      if (view.z > 1.02) drawPerson(c, ME);                                                     // 推近以后改画矢量的，保证清晰
    });
    if (sw >= 1) {
      // 身上的零件：说到哪样，哪样贴上去
      const show = [['bone', t('f5') - .25], ['blood', t('f4') - .25], ['stomach', t('f2') - .15]];
      for (const [k, t0] of show) { const a = E.back(seg(time, t0, t0 + .4)); if (a <= 0) continue; ctx.save(); ctx.globalAlpha = sat(a * 2); if (view.z > 1.02) organ(ctx, k); else ctx.drawImage(S[k], OX, OY); ctx.restore(); }
      // 每换一片：原地闪一下，旧的那片飘到右边落好
      const landed = [], flying = [];
      for (const p of S.pieces) {
        if (time < p.ts) continue;
        const fl = Math.max(0, 1 - (time - p.ts) / .45);
        if (fl > 0) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fl * .7; ctx.drawImage(S[p.spr], 0, p.y0, SW, p.y1 - p.y0, OX, OY + p.y0, SW, p.y1 - p.y0); ctx.restore(); }
        (time >= p.ts + p.dur ? landed : flying).push(p);
      }
      ctx.save(); ctx.filter = 'saturate(.6) brightness(.88)';
      landed.sort((a, b) => a.z - b.z); for (const p of landed) drawPiece(ctx, S, p, DX, 0, 0, p.z === 0 ? .8 : 0);
      ctx.restore();
      for (const p of flying) { const u = (time - p.ts) / p.dur, e = E.io(u); drawPiece(ctx, S, p, DX * e, -Math.sin(Math.PI * u) * (60 + p.r * 70), Math.sin(Math.PI * u) * (p.r - .5) * .12, 1 + Math.sin(Math.PI * u) * 2); }
    }
    // 脑袋里：一小簇金色的神经细胞
    const bk = E.back(seg(time, t('f9') - .3, t('f9') + .2));
    const NEU = [[-34, -6], [-16, -18], [4, -20], [26, -12], [38, 4], [-26, 12], [-6, 2], [14, 6], [0, 18], [24, 20], [-40, 22]].map(q => [BRAIN.x + q[0], BRAIN.y + q[1]]);
    if (bk > 0) {
      ctx.save(); ctx.translate(BRAIN.x, BRAIN.y); ctx.scale(sat(bk) * .2 + .8 * Math.min(1.1, bk), sat(bk) * .2 + .8 * Math.min(1.1, bk)); ctx.translate(-BRAIN.x, -BRAIN.y); ctx.globalAlpha = sat(bk * 2);
      shOn(ctx, .5); fs(ctx, C('#3a3566')); ctx.beginPath(); ctx.ellipse(BRAIN.x, BRAIN.y, BRAIN.w / 2, BRAIN.h / 2, 0, 0, 7); ctx.fill(); shOff(ctx);
      ctx.strokeStyle = css(PAL.gold, .6); ctx.lineWidth = 1.4; ctx.lineCap = 'round';
      NEU.forEach((a, i) => { for (const j of [(i * 5 + 3) % NEU.length, (i * 7 + 1) % NEU.length]) { const kk = seg(time, t('f9') + i * .05, t('f9') + .5 + i * .05), b = NEU[j]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(lerp(a[0], b[0], kk), lerp(a[1], b[1], kk)); ctx.stroke(); } });
      NEU.forEach((a, i) => { fs(ctx, mixc(PAL.gold, [255, 255, 255], .3 + .3 * Math.sin(time * 3 + i * 1.7))); circ(ctx, a[0], a[1], 4 + (i % 3)); });
      ctx.restore();
    }
    camReset(ctx);
    const vs = (x, y) => toScreen(view, x, y);

    // ---------- 标签：四样零件多久换一次（条越长，换得越慢） ----------
    const rows = [['胃壁', '几天', 'f2', 44], ['皮肤', '一个月', 'f3', 110], ['血', '四个月', 'f4', 190], ['骨头', '十年', 'f5', 360]];
    const la = 1 - seg(time, tZoom() - .1, tZoom() + .5);
    rows.forEach((r, k) => {
      const t0 = t(r[2]) - .05, a = seg(time, t0, t0 + .25) * la; if (a <= 0) return;
      const x = 1250, y = 330 + k * 130, t1 = TL.at(r[2], r[1]), kk = E.out(seg(time, t1, t1 + .5));
      HUD.text(ctx, x, y, r[0], { a, serif: 1, w: 900, px: 72 });
      ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = css(PAL.ink, .2); ctx.beginPath(); ctx.roundRect(x + 190, y + 26, 360, 10, 5); ctx.fill(); ctx.fillStyle = css(PAL.gold); ctx.beginPath(); ctx.roundRect(x + 190, y + 26, Math.max(10, r[3] * kk), 10, 5); ctx.fill(); ctx.restore();
      HUD.text(ctx, x + 190, y - 12, r[1], { a: a * seg(time, t1 - .05, t1 + .15), serif: 1, w: 900, px: 50, col: PAL.gold });
    });
    HUD.label(ctx, ME.x + DX, 176, '换下来的旧零件', { a: env(time, t('f6'), t('f6') + .3, tZoom() - .2, tZoom() + .3), align: 'center', px: 40 });
    if (zoom > 0) {
      const bp = vs(BRAIN.x + BRAIN.w / 2, BRAIN.y), lx = 1120;
      const a9 = seg(time, t('f9'), t('f9') + .3) * (1 - seg(time, t('f11') - .35, t('f11') - .05));
      if (a9 > 0) {
        HUD.line(ctx, lx - 24, 300, bp[0] + 10, bp[1], seg(time, t('f9') + .1, t('f9') + .5), { a: .7 * a9, lw: 3, col: PAL.gold, dash: [3, 12] });
        HUD.text(ctx, lx, 300, '神经细胞', { a: a9, serif: 1, w: 900, px: 84 });
        const k10 = E.out(seg(time, TL.at('f10', '一辈子') - .1, TL.at('f10', '一辈子') + .6));
        ctx.save(); ctx.globalAlpha = a9; ctx.fillStyle = css(PAL.ink, .2); ctx.beginPath(); ctx.roundRect(lx, 372, 620, 10, 5); ctx.fill(); ctx.fillStyle = css(PAL.gold); ctx.beginPath(); ctx.roundRect(lx, 372, Math.max(10, 620 * k10), 10, 5); ctx.fill(); ctx.restore();
        HUD.text(ctx, lx, 436, '一辈子', { a: a9 * seg(k10, .1, .5), serif: 1, w: 900, px: 60, col: PAL.gold });
      }
      // “那‘你’，总该住在那儿吧？”
      const a11 = env(time, TL.at('f11', '你'), TL.at('f11', '你') + .3, t('f12') - .3, t('f12'));
      if (a11 > 0) { const b0 = vs(BRAIN.x - BRAIN.w / 2 - 8, BRAIN.y - BRAIN.h / 2 - 8), b1 = vs(BRAIN.x + BRAIN.w / 2 + 8, BRAIN.y + BRAIN.h / 2 + 8); HUD.bracket(ctx, b0[0], b0[1], b1[0] - b0[0], b1[1] - b0[1], a11, { len: 46, lw: 8 }); HUD.big(ctx, [{ s: '“你”', col: PAL.gold }, { s: '？' }], lx + 240, 360, 150, { a: a11 }); }
    }
    // 记忆卡片：一直在右上角；“那里存着你的记忆”时飞进脑袋
    const fly = E.io(seg(time, t('f12'), t('f12') + .9)), bc = vs(BRAIN.x, BRAIN.y);
    const cs = lerp(1, .8, fly), cx = lerp(W - 64 - 250, bc[0] - 125 * .8, fly), cy = lerp(60, bc[1] - 75 * .8, fly) - Math.sin(Math.PI * fly) * 60;
    drawMemCard(ctx, cx, cy, cs, seg(time, tIn - .1, tIn + .3));
    const a13 = seg(time, TL.at('f13', '原装') - .05, TL.at('f13', '原装') + .25);
    if (a13 > 0) HUD.big(ctx, [{ s: '原装', col: PAL.gold }, { s: '？' }], 1340, 400, 150, { a: a13 });
    veil(ctx, fadeIO(time, tIn, t('g1') - .1, .35));
    return {};
  }
  SCENES.push({ name: 'body', t0: t('f1') - .08, draw });
  return { HEAD };
})();
