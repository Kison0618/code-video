'use strict';
// 《INFP》1 分钟以后 第一部分：C107-D06（直觉、比喻、拖延、读情绪、分享欲、底线、丑小鸭、优点和工作）
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { C, K, L, LIME, LEAF, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, vis, hash } = K;
const FY = 1250;

module.exports = function make(P1) {
  const { heart, bubbleT, TYPES } = P1;
  const S = [];
  const add = (a, b, draw, over) => S.push({ a, b, draw, over });

  // C107：两条路：左边一块写着「逻辑」的路牌，路是一格格的灰网格；右边一条发光的小路，她跟着光走
  add(vs('C107') - 0.2, vs('C108') + 0.1, (ctx, t, a) => {
    X.back(ctx, t);
    const t0 = vs('C107'), go = smooth(prog(t, at('C107', '直觉'), ve('C107') + 0.3));
    ctx.save(); X.push(ctx, t, t0, ve('C107') + 0.4, 0.05);
    // 左：网格路（逻辑）
    for (let i = 0; i < 7; i++) { const y = 1080 + i * 30, w = 40 + i * 30; glowLine(ctx, [[260 - w, y], [260 + w * 0.3, y]], [150, 160, 170], a * 0.35, 1.2, 0.3); }
    for (let k = -3; k <= 3; k++) glowLine(ctx, [[250 + k * 8, 1070], [250 + k * 60, 1270]], [150, 160, 170], a * 0.3, 1.2, 0.3);
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(80,86,96)'; ctx.fillRect(196, 860, 12, 220); ctx.fillStyle = 'rgb(110,118,130)'; ctx.beginPath(); ctx.moveTo(110, 860); ctx.lineTo(290, 860); ctx.lineTo(320, 900); ctx.lineTo(290, 940); ctx.lineTo(110, 940); ctx.closePath(); ctx.fill(); ctx.restore();
    K.text(ctx, '逻辑', 205, 916, { size: 46, weight: 600, color: [220, 226, 232], alpha: a, align: 'center' });
    // 右：一串光点铺成的路，往远处弯
    const path = []; for (let i = 0; i <= 30; i++) { const v = i / 30; path.push([lerp(560, 860, v) + Math.sin(v * 5) * 60, lerp(FY + 40, 1050, Math.pow(v, 0.8))]); }
    path.forEach(([x, y], i) => glow(ctx, x, y, 10 * (1 - i / 40) + 3, LIME, a * (0.4 + 0.5 * Math.sin(t * 4 - i * 0.5) ** 2)));
    const p = path[Math.floor(go * 12)];
    infp(ctx, lerp(540, p[0], go), lerp(FY, p[1] + 10, go), lerp(1.1, 0.8, go), { a, t, look: [1, 0], eyes: 'happy', spin: t * 2, la: 0.3, ra: -0.2, flies: 1 });
    ctx.restore();
  }, (ctx, t, a) => X.trait(ctx, '3', '跟着感觉走', ['感觉'], t, vs('C107') - 0.2, ve('C109') + 0.3, LIME));

  // C108：她翻开本子写东西，写下的字一行行飘起来，变成月亮、星星和一片海
  add(vs('C108') - 0.2, vs('C109') + 0.1, (ctx, t, a) => {
    X.back(ctx, t);
    const t0 = vs('C108');
    ctx.save(); X.push(ctx, t, t0, ve('C108') + 0.4, 0.06);
    const o = infp(ctx, W / 2 - 60, FY, 1.25, { a, t, wind: false, ra: 0.35, la: -0.5, nod: 0.6, eyes: 'happy', flies: 1 });
    const bx = o.lh[0] + 90, by = o.lh[1] - 30;
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(bx, by); ctx.rotate(-0.15); ctx.fillStyle = 'rgb(236,226,200)'; ctx.fillRect(-90, -60, 180, 120); ctx.strokeStyle = 'rgba(120,100,80,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -60); ctx.lineTo(0, 60); ctx.stroke(); ctx.restore();
    const words = ['月光', '晚风', '海', '星星', '远方'];
    words.forEach((w, i) => {
      const ti = t0 + 0.3 + i * 0.6, u = prog(t, ti, ti + 2.6); if (u <= 0) return;
      const x = bx + 160 + Math.sin(i * 2.1) * 200 * u, y = by - 60 - u * 560;
      const wa = a * Math.min(1, u * 4) * (1 - smooth(prog(u, 0.55, 0.8)));
      L.rich(ctx, w, x, y, { size: 48, weight: 500, color: IVORY, alpha: wa, glowKey: 0.4 });
      const ia = a * smooth(prog(u, 0.55, 0.85));
      if (i === 0) { glow(ctx, x, y, 70, [255, 246, 210], ia * 0.7); ctx.save(); ctx.globalAlpha *= ia; ctx.fillStyle = 'rgb(255,246,220)'; ctx.beginPath(); ctx.arc(x, y, 34, 0, 6.283); ctx.fill(); ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(x + 14, y - 8, 30, 0, 6.283); ctx.fill(); ctx.restore(); }
      else if (i === 2) { for (let k = 0; k < 3; k++) glowLine(ctx, Array.from({ length: 20 }, (_, j) => [x - 120 + j * 12, y + k * 18 + Math.sin(j * 0.8 + t * 3 + k) * 8]), [140, 200, 255], ia * 0.8, 2, 0.6); }
      else for (let k = 0; k < 6; k++) glow(ctx, x + Math.cos(k) * 50, y + Math.sin(k * 1.7) * 30, 10, i === 3 ? GOLD : LIME, ia * (0.5 + 0.5 * Math.sin(t * 5 + k)));
    });
    ctx.restore();
  });

  // C109：截止前：她趴在本子上睡着，倒计时一路往下掉；最后一小时猛地弹起来狂写
  add(vs('C109') - 0.2, vs('C201') + 0.1, (ctx, t, a) => {
    X.back(ctx, t);
    const t0 = vs('C109'), tw = at('C109', '感觉不来'), cnt = prog(t, t0, ve('C109')), wake = t > ve('C109') - 1.2;
    ctx.save(); X.push(ctx, t, t0, ve('C109') + 0.4, 0.05);
    const hrs = Math.max(1, Math.round(lerp(72, 1, Math.pow(cnt, 0.7))));
    const pulse = wake ? 0.5 + 0.5 * Math.sin(t * 18) : 0;
    glow(ctx, W / 2, 520, 220, wake ? RED : [160, 180, 200], a * (0.2 + 0.3 * pulse));
    K.text(ctx, '离截止还有', W / 2, 430, { size: 46, weight: 500, color: IVORY, alpha: a * 0.8, align: 'center' });
    K.text(ctx, hrs + ' 小时', W / 2, 590, { size: 130, weight: 700, color: wake ? RED : IVORY, alpha: a, align: 'center' });
    infp(ctx, W / 2, FY, 1.15, { a, t, wind: false, eyes: wake ? 'wide' : 'closed', mouth: wake ? 'o' : 'flat', nod: wake ? 0 : 1.6, lean: wake ? 0.06 * Math.sin(t * 30) : 0.1, ra: wake ? 0.7 + 0.3 * Math.sin(t * 30) : 0.9, la: 0.6, flies: 1 });
    if (!wake) for (let k = 0; k < 3; k++) { const v = (t * 0.5 + k / 3) % 1; K.text(ctx, 'z', W / 2 + 120 + v * 80, 700 - v * 160, { size: 40 + v * 30, weight: 600, color: [200, 210, 220], alpha: a * (1 - v), align: 'center' }); }
    else for (let k = 0; k < 10; k++) { const v = (t * 3 + k / 10) % 1; glow(ctx, W / 2 + 160 + v * 200, 980 - v * 300 + Math.sin(k) * 60, 8, GOLD, a * (1 - v)); }
    ctx.restore();
  }, (ctx, t, a) => { X.quote(ctx, '很喜欢卡最后一刻。', t, at('C109', '感觉不来'), ve('C109') + 0.8, { y: 300 }); });

  // C201-C202：人群里一个人笑着，只有她看出他心口的光在发暗；一道光从她眼睛直直射中他心口，正中靶心
  add(vs('C201') - 0.2, vs('C203') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { pool: [W / 2, 1255, 480] });
    const t0 = vs('C201'), ts = at('C201', '神枪手'), th = vs('C202');
    ctx.save(); X.push(ctx, t, t0, ve('C202') + 0.4, 0.05);
    const crowd = [['estp-male', 640, FY - 80, 1.2], ['esfj-female', 960, FY - 60, 1.2], ['isfj-male', 780, FY + 40, 1.6]];
    crowd.forEach(([k, x, y, s], i) => MB.person(ctx, k, x, y, s, { a, flip: true, bob: Math.sin(t * 3 + i) * 3 }));
    const tx = 780, ty = FY + 40 - 220;
    const dark = smooth(prog(t, t0 + 0.6, ts));
    glow(ctx, tx, ty, 60, [120, 140, 190], a * 0.6 * dark);
    // 靶心
    const hit = smooth(prog(t, ts, ts + 0.3));
    for (let r = 0; r < 3; r++) L.ellipse(ctx, tx, ty, 30 + r * 26, 30 + r * 26, r ? IVORY : RED, a * dark * 0.6, 2);
    const o = infp(ctx, 250, FY, 1.05, { a, t, look: [1.2, -0.2], eyes: 'wide', spin: t * 0.5, flies: 1 });
    if (hit > 0) { glowLine(ctx, [o.eyes, [lerp(o.eyes[0], tx, hit), lerp(o.eyes[1], ty, hit)]], GOLD, a, 2.6, 1); L.shock(ctx, tx, ty, t, ts + 0.3, { r0: 10, r1: 160, dur: 0.8, c: GOLD, a }); }
    // C202：求救的声音：他心口发出一圈圈细小的声波，只有她转头
    if (t > th) for (let k = 0; k < 3; k++) { const v = ((t - th) * 0.8 + k / 3) % 1; L.ellipse(ctx, tx, ty, 40 + v * 260, 40 + v * 260, BLUE, a * (1 - v) * 0.5, 2); }
    ctx.restore();
  }, (ctx, t, a) => X.trait(ctx, '4', '读情绪，百发百中', ['百发百中'], t, vs('C201') - 0.2, ve('C202') + 0.3, GOLD));

  // C203：对外人只回一个「嗯」，转头给好朋友连发三十条
  add(vs('C203') - 0.2, vs('C204') + 0.1, (ctx, t, a) => {
    X.back(ctx, t);
    const t0 = vs('C203'), tf = at('C203', '对信得过');
    ctx.save(); X.push(ctx, t, t0, ve('C203') + 0.4, 0.05);
    MB.person(ctx, 'estj-male', 180, FY - 30, 1.3, { a: a * (1 - smooth(prog(t, tf, tf + 0.5)) * 0.6) });
    MB.person(ctx, 'enfp-female', 940, FY + 20, 1.4, { a, flip: true, bob: Math.sin(t * 5) * 4 * smooth(prog(t, tf, tf + 0.5)) });
    const o = infp(ctx, 400, FY, 1.15, { a, t, wind: false, ra: -0.5, look: [t > tf ? 1 : -1, 0], eyes: t > tf ? 'happy' : 'open', mouth: t > tf ? 'smile' : 'flat', flies: 1 });
    if (t < tf) bubbleT(ctx, '嗯。', 300, 820, a * smooth(prog(t, t0 + 0.2, t0 + 0.6)), IVORY);
    else {
      const n = Math.min(30, Math.floor((t - tf) * 12) + 1);
      for (let i = Math.max(0, n - 6); i < n; i++) { const age = (t - tf) * 12 - i; bubbleT(ctx, ['你看今天的云', '我跟你说', '刚刚路上', '超好笑', '还有还有', '这首歌好好听'][i % 6], 790 + (i % 2) * 30, 940 - age * 52, a * clamp(1.4 - age * 0.22), IVORY); }
      K.text(ctx, '第 ' + n + ' 条', 800, 560, { size: 50, weight: 600, color: LIME, alpha: a, align: 'center' });
    }
    ctx.restore();
  }, (ctx, t, a) => { X.trait(ctx, '5', '内向，但分享欲爆棚', ['分享欲爆棚'], t, vs('C203') - 0.2, ve('C203') + 0.3, LIME); X.quote(ctx, '其实我日常分享欲爆棚！', t, at('C203', '对信得过') + 0.4, ve('C203') + 0.6, { y: 320 }); });

  // C204-C205：别人一件件把事推给她，她一直点头；直到有人一脚踩上写着「原则」的叶子，她站直，把风车往地上一插
  add(vs('C204') - 0.2, vs('C206') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { pool: [W / 2, 1255, 460] });
    const t0 = vs('C204'), tb = at('C205', '底线'), stand = smooth(prog(t, tb, tb + 0.4));
    ctx.save(); X.push(ctx, t, t0, ve('C205') + 0.4, 0.05);
    const reqs = ['这个你帮我做吧', '你随便吧', '听我的就好'];
    reqs.forEach((r, i) => { const ti = t0 + i * 0.7, u = easeOut(prog(t, ti, ti + 0.4)); bubbleT(ctx, r, 760, 560 + i * 110, a * u * (1 - stand), IVORY); });
    MB.person(ctx, 'estj-female', 850, FY - 20, 1.6, { a, flip: true, lean: -0.05 * stand });
    // 叶子
    const lx = 640, ly = FY + 30, step = smooth(prog(t, tb - 0.5, tb));
    ctx.save(); ctx.globalAlpha *= a; ctx.translate(lx, ly); ctx.scale(1, 0.4); ctx.fillStyle = 'rgb(120,190,110)'; ctx.beginPath(); ctx.ellipse(0, 0, 110, 50, 0, 0, 6.283); ctx.fill(); ctx.restore();
    K.text(ctx, '原则', lx, ly + 14, { size: 40, weight: 700, color: [30, 60, 30], alpha: a, align: 'center' });
    if (step > 0) { ctx.save(); ctx.globalAlpha *= a * step * (1 - stand); ctx.fillStyle = 'rgb(40,40,46)'; ctx.beginPath(); ctx.ellipse(lx + 20, ly - 20 - (1 - step) * 80, 70, 26, 0.1, 0, 6.283); ctx.fill(); ctx.restore(); }
    const nodS = t < tb ? Math.abs(Math.sin(t * 4)) * 0.6 : 0;
    infp(ctx, 360, FY, lerp(1.0, 1.2, stand), { a, t, nod: nodS, eyes: stand > 0.5 ? 'open' : 'happy', mouth: stand > 0.5 ? 'flat' : 'smile', ra: lerp(0.3, 0.9, stand), la: lerp(0.2, -0.6, stand), spin: 0, flies: 1 });
    if (stand > 0) { L.shock(ctx, 360, FY - 300, t, tb + 0.2, { r0: 20, r1: 420, dur: 1, c: LIME, a }); glow(ctx, 360, FY - 300, 300, LIME, a * 0.18 * stand); }
    ctx.restore();
  }, (ctx, t, a) => { X.trait(ctx, '6', '软，但有底线', ['底线'], t, vs('C204') - 0.2, ve('C205') + 0.3, LIME); X.quote(ctx, '小蝴蝶的战斗力不是盖的！！', t, at('C205', '固执') , ve('C205') + 0.8, { y: 320 }); });

  // C206-C207：水边，她低头看倒影：倒影里是一只灰扑扑的小鸭；后来倒影慢慢变成一只发光的天鹅
  add(vs('C206') - 0.2, vs('D01') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0.5, pool: null });
    const t0 = vs('C206'), tsw = at('C207', '天鹅'), sw = smooth(prog(t, tsw - 1.2, tsw + 0.4));
    ctx.save(); X.push(ctx, t, t0, ve('C207') + 0.6, 0.05, W / 2, 1100);
    // 水面
    const wy = 1180;
    const g = ctx.createLinearGradient(0, wy, 0, 1520); g.addColorStop(0, `rgba(40,80,90,${0.7 * a})`); g.addColorStop(1, 'rgba(10,20,30,0)');
    ctx.fillStyle = g; ctx.fillRect(0, wy, W, 340);
    for (let k = 0; k < 8; k++) glowLine(ctx, [[100 + k * 20, wy + 20 + k * 30], [980 - k * 20, wy + 20 + k * 30 + Math.sin(t + k) * 4]], [150, 210, 230], a * 0.12, 1, 0.4);
    infp(ctx, W / 2 - 40, wy - 10, 1.05, { a, t, nod: 1.2, look: [0, 1], eyes: sw > 0.5 ? 'happy' : 'sad', wind: false, la: 0.3, ra: 0.3, flies: 1 });
    // 倒影里的东西（压扁，随水波晃）
    const rx = W / 2, ry = wy + 170;
    ctx.save(); ctx.translate(rx + Math.sin(t * 2) * 6, ry); ctx.scale(1, 0.75);
    duck(ctx, 0, 0, 1, a * (1 - sw) * 0.85);
    swan(ctx, 0, 0, 1, a * sw, t);
    ctx.restore();
    ctx.restore();
  }, (ctx, t, a) => X.trait(ctx, '7', '丑小鸭，其实是天鹅', ['天鹅'], t, vs('C206') - 0.2, ve('C207') + 0.3, GOLD));
  function duck(ctx, x, y, s, a) {
    if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(120,124,120)';
    ctx.beginPath(); ctx.ellipse(0, 0, 90, 50, 0, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.arc(70, -60, 36, 0, 6.283); ctx.fill();
    ctx.fillStyle = 'rgb(160,130,80)'; ctx.beginPath(); ctx.moveTo(100, -62); ctx.lineTo(136, -54); ctx.lineTo(100, -46); ctx.fill(); ctx.restore();
  }
  function swan(ctx, x, y, s, a, t) {
    if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    glow(ctx, 0, -40, 260, [255, 246, 220], 0.4 * a);
    ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(250,248,240)';
    ctx.beginPath(); ctx.moveTo(-150, 0); ctx.quadraticCurveTo(-60, 70, 90, 30); ctx.quadraticCurveTo(140, 10, 120, -20); ctx.quadraticCurveTo(40, -10, -150, 0); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-120, -10); ctx.quadraticCurveTo(-60, -140 - Math.sin(t * 2) * 6, 40, -40); ctx.quadraticCurveTo(-40, -30, -120, -10); ctx.fill();
    ctx.lineWidth = 14; ctx.strokeStyle = 'rgb(250,248,240)'; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(100, 10); ctx.quadraticCurveTo(150, -80, 110, -150); ctx.stroke();
    ctx.beginPath(); ctx.arc(104, -156, 16, 0, 6.283); ctx.fill(); ctx.fillStyle = 'rgb(240,150,70)'; ctx.beginPath(); ctx.moveTo(90, -160); ctx.lineTo(62, -150); ctx.lineTo(92, -148); ctx.fill();
    ctx.restore();
  }

  // D01-D02：章节「优点和工作」；她坐在一摞越堆越高的书上读，旁边的字一圈圈围着她转（自学、语言天赋）
  add(vs('D01') - 1.2, vs('D03') + 0.1, (ctx, t, a) => {
    X.back(ctx, t);
    const t0 = vs('D01'), u = prog(t, t0, ve('D02'));
    ctx.save(); X.push(ctx, t, t0, ve('D02') + 0.4, 0.05);
    const n = Math.floor(lerp(2, 11, u));
    for (let i = 0; i < n; i++) { const c = [[200, 120, 100], [110, 160, 200], [210, 190, 110], [130, 190, 140]][i % 4]; ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.rgba(c, 1); ctx.fillRect(W / 2 - 130 + (hash(i) - 0.5) * 30, FY - (i + 1) * 34, 260, 30); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(W / 2 - 120 + (hash(i) - 0.5) * 30, FY - (i + 1) * 34 + 6, 240, 4); ctx.restore(); }
    infp(ctx, W / 2, FY - n * 34, 0.85, { a, t, wind: false, nod: 0.7, la: -0.6, ra: 0.6, eyes: 'happy', flies: 1 });
    const words = ['想象', '共情', '比喻', '耐心', '新想法', '语言'];
    words.forEach((w, i) => { const an = t * 0.6 + i / words.length * 6.283, x = W / 2 + Math.cos(an) * 360, y = 760 + Math.sin(an) * 120; L.rich(ctx, w, x, y, { size: 44, weight: 500, color: Math.sin(an) > 0 ? GOLD : IVORY, alpha: a * smooth(prog(t, t0 + i * 0.3, t0 + i * 0.3 + 0.5)) * (Math.sin(an) > -0.3 ? 1 : 0.4), glowKey: 0.4 }); });
    ctx.restore();
  }, (ctx, t, a) => { const ca = a * vis(t, vs('D01') - 1.2, vs('D01') + 0.6, 0.3, 0.4); if (ca > 0.003) { ctx.save(); ctx.globalAlpha *= ca; C.gather(ctx, '优点和工作', W / 2, 460, t, vs('D01') - 1.1, 99, { size: 110, weight: 600, spacing: 0.14, keys: ['优点和工作'], keyColor: GOLD }); ctx.restore(); } });

  // D03-D04：台灯下一个人安安静静画画，她亮着；电话一响、文件一摞摞堆过来，她一点点暗下去
  add(vs('D03') - 0.2, vs('D05') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { pool: [W / 2, 1255, 360] });
    const t0 = vs('D03'), tr = at('D03', '电话'), tp = vs('D04');
    ctx.save(); X.push(ctx, t, t0, ve('D04') + 0.4, 0.05);
    const ring = t > tr && t < tp + 0.3, pile = smooth(prog(t, tp, ve('D04')));
    const dim = Math.max(ring ? 0.4 : 0, pile * 0.75);
    // 桌子和台灯
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(70,52,40)'; ctx.fillRect(560, 1010, 420, 26); ctx.fillRect(590, 1036, 20, 220); ctx.fillRect(930, 1036, 20, 220); ctx.restore();
    glow(ctx, 880, 860, 260, [255, 220, 150], a * 0.35 * (1 - dim));
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgb(120,120,110)'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(900, 1010); ctx.lineTo(900, 880); ctx.lineTo(850, 840); ctx.stroke(); ctx.fillStyle = 'rgb(240,210,140)'; ctx.beginPath(); ctx.moveTo(800, 840); ctx.lineTo(880, 800); ctx.lineTo(880, 880); ctx.fill(); ctx.restore();
    // 电话
    const sh = ring ? Math.sin(t * 40) * 6 : 0;
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(200,70,60)'; ctx.fillRect(620 + sh, 960, 90, 50); ctx.restore();
    if (ring) for (let k = 0; k < 3; k++) { const v = ((t - tr) * 1.4 + k / 3) % 1; L.ellipse(ctx, 665, 980, 40 + v * 160, 30 + v * 110, RED, a * (1 - v) * 0.6, 2.4); }
    // 文件堆
    const np = Math.floor(pile * 14);
    for (let i = 0; i < np; i++) { ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(220,222,226)'; ctx.fillRect(740 + (hash(i) - 0.5) * 20, 1006 - i * 12, 150, 10); ctx.restore(); }
    infp(ctx, 380, FY, 1.15, { a, t, wind: false, dim, eyes: dim > 0.5 ? 'sad' : 'happy', mouth: dim > 0.3 ? 'flat' : 'smile', nod: dim * 1.2, ra: -0.4, la: 0.3, flies: dim > 0.6 ? 0 : 1 });
    ctx.restore();
  });

  // D05：五张发光的职业卡围着她，念到哪一张亮哪一张
  const JOBS = [['写作', '写作'], ['设计', '设计'], ['心理咨询', '心理咨询'], ['教育', '教育'], ['社会工作', '社会工作']];
  add(vs('D05') - 0.2, vs('D06') + 0.1, (ctx, t, a) => {
    X.back(ctx, t);
    const t0 = vs('D05');
    ctx.save(); X.push(ctx, t, t0, ve('D05') + 0.4, 0.04);
    infp(ctx, W / 2, FY, 1.05, { a, t, eyes: 'happy', spin: t * 2, ra: -0.3, la: 0.3, flies: 1 });
    JOBS.forEach(([w], i) => {
      const ti = at('D05', w), on = smooth(prog(t, ti - 0.1, ti + 0.3)), an = -Math.PI / 2 + (i - 2) * 0.62, x = W / 2 + Math.cos(an) * 400, y = 980 + Math.sin(an) * 420;
      if (on <= 0) return;
      glow(ctx, x, y, 130, LIME, a * on * 0.25);
      const w2 = K.measure(ctx, w, { size: 50, weight: 600, spacing: 0.06 }) + 60;
      ctx.save(); ctx.globalAlpha *= a * on; ctx.fillStyle = 'rgba(30,46,40,0.9)'; ctx.beginPath(); ctx.roundRect(x - w2 / 2, y - 44, w2, 88, 20); ctx.fill(); ctx.strokeStyle = K.rgba(LIME, 0.8); ctx.lineWidth = 2.5; ctx.stroke(); ctx.restore();
      K.text(ctx, w, x, y + 18, { size: 50, weight: 600, color: IVORY, alpha: a * on, align: 'center', spacing: 0.06 });
      L.shock(ctx, x, y, t, ti + 0.1, { r0: 10, r1: 160, dur: 0.7, c: LIME, a });
    });
    ctx.restore();
  });

  // D06：陌生电话、投诉、推销一层层压过来，她的电量一格格往下掉
  add(vs('D06') - 0.2, vs('E01') - 0.6, (ctx, t, a) => {
    X.back(ctx, t, { mood: 0.4 });
    const t0 = vs('D06');
    ctx.save(); X.push(ctx, t, t0, ve('D06') + 0.4, 0.05);
    const items = [['陌生电话', at('D06', '陌生')], ['投诉', at('D06', '投诉')], ['推销', at('D06', '推销')]];
    let drain = 0;
    items.forEach(([w, ti], i) => { const u = easeOut(prog(t, ti - 0.1, ti + 0.4)); drain += u; bubbleT(ctx, w, [230, 850, 540][i], [620, 700, 520][i] + (1 - u) * -60, a * u, RED); });
    const lv = 1 - drain / 3 * 0.85;
    infp(ctx, W / 2, FY, 1.15, { a, t, wind: false, dim: (1 - lv) * 0.9, eyes: lv < 0.5 ? 'sad' : 'open', mouth: 'flat', nod: (1 - lv) * 1.4, ra: 0.6, la: 0.5, flies: lv > 0.4 ? 1 : 0 });
    // 电量
    const bx = W / 2, by = 860;
    ctx.save(); ctx.globalAlpha *= a; ctx.strokeStyle = 'rgba(230,236,226,0.85)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(bx - 75, by - 33, 150, 66, 10); ctx.stroke(); ctx.fillStyle = 'rgba(230,236,226,0.85)'; ctx.fillRect(bx + 77, by - 12, 9, 24);
    const k = Math.ceil(lv * 5 - 1e-6); for (let i = 0; i < k; i++) { ctx.fillStyle = lv < 0.3 ? `rgba(240,100,90,${0.55 + 0.45 * Math.abs(Math.sin(t * 6))})` : 'rgba(150,228,150,0.95)'; ctx.fillRect(bx - 67 + i * 27, by - 25, 21, 50); }
    ctx.restore();
    ctx.restore();
  }, (ctx, t, a) => X.quote(ctx, '今天的工作 do 了嘛\n微 do', t, at('D06', '特别累') - 0.2, ve('D06') + 1.0, { y: 300 }));

  return S;
};
