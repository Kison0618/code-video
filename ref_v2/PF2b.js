'use strict';
// 《INFP》后半：E01-E08 恋爱里，F01-F02 结尾，关注卡
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { C, K, L, LIME, LEAF, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, vis, hash } = K;
const FY = 1250;
const HIM = 'enfj-male';

module.exports = function make(P1, END) {
  const { heart, bubbleT } = P1;
  const S = [];
  const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const love = (ctx, t, a, o = {}) => MB.person(ctx, HIM, o.x || 800, o.y || FY, o.s || 2.2, { a, flip: true, ...o });

  // E01-E02：两人之间一根稳稳亮着的线（忠诚）；她心里冒出一朵小乌云，她把它咽回去，自己暗一点
  add(vs('E01') - 1.2, vs('E03') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { pool: [W / 2, 1255, 520] });
    const t0 = vs('E01'), tc = at('E02', '有不满'), tk = at('E02', '憋着');
    ctx.save(); X.push(ctx, t, t0, ve('E02') + 0.4, 0.05);
    const pb = love(ctx, t, a);
    const o = infp(ctx, 320, FY, 1.05, { a, t, look: [1, 0], eyes: t > tc && t < tk + 0.6 ? 'sad' : 'happy', spin: t * 0.6, flies: 1, dim: smooth(prog(t, tk, tk + 0.6)) * 0.2 });
    const p = [[o.chest[0] + 40, o.chest[1]], [pb.chest[0], pb.chest[1]]];
    glowLine(ctx, [p[0], [(p[0][0] + p[1][0]) / 2, p[0][1] + 40 + Math.sin(t * 2) * 6], p[1]], PINK, a * 0.85, 2.4, 0.8);
    for (let k = 0; k < 4; k++) { const v = (t * 0.4 + k / 4) % 1; glow(ctx, lerp(p[0][0], p[1][0], v), lerp(p[0][1], p[1][1], v) + Math.sin(v * Math.PI) * 40, 10, PINK, a * 0.8); }
    // 乌云：冒出来，又被她咽回胸口
    const up = smooth(prog(t, tc - 0.2, tc + 0.6)), down = smooth(prog(t, tk - 0.3, tk + 0.6));
    if (up > 0 && down < 1) {
      const cx = lerp(o.head[0] + 60, o.chest[0], down), cy = lerp(o.head[1] - 120, o.chest[1], down), s = lerp(1, 0.2, down) * up;
      ctx.save(); ctx.globalAlpha *= a * (1 - down * 0.6); ctx.fillStyle = 'rgb(70,76,90)';
      for (const [dx, dy, r] of [[-40, 0, 40], [0, -20, 52], [44, 0, 40], [0, 14, 44]]) { ctx.beginPath(); ctx.arc(cx + dx * s, cy + dy * s, r * s, 0, 6.283); ctx.fill(); }
      ctx.restore();
    }
    ctx.restore();
  }, (ctx, t, a) => { const ca = a * vis(t, vs('E01') - 1.2, vs('E01') + 0.8, 0.3, 0.4); if (ca > 0.003) { ctx.save(); ctx.globalAlpha *= ca; C.gather(ctx, '恋爱里', W / 2, 460, t, vs('E01') - 1.1, 99, { size: 120, weight: 600, spacing: 0.16, keys: ['恋爱里'], keyColor: PINK }); ctx.restore(); } });

  // E03：她张嘴半天说不出话；回家写了三页信，偷偷塞到他门缝下，他读着读着亮起来
  add(vs('E03') - 0.2, vs('E04') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { pool: [W / 2, 1255, 520] });
    const t0 = vs('E03'), tw = at('E03', '写下来');
    ctx.save(); X.push(ctx, t, t0, ve('E03') + 0.4, 0.05);
    const write = smooth(prog(t, tw - 0.2, tw + 0.4)), fly = easeInOut(prog(t, tw + 0.8, ve('E03') - 0.2));
    const pb = love(ctx, t, a, { inner: fly, innerC: PINK });
    const o = infp(ctx, 320, FY, 1.05, { a, t, wind: false, mouth: write < 0.5 ? 'o' : 'smile', eyes: write < 0.5 ? 'wide' : 'happy', ra: lerp(0.3, -0.6, write), look: [1, 0], flies: 1 });
    if (write < 0.5) for (let k = 0; k < 3; k++) glow(ctx, o.mouth[0] + 40 + k * 26, o.mouth[1] - 6, 5, IVORY, a * (0.3 + 0.3 * Math.sin(t * 6 + k)) * (1 - write * 2));
    for (let i = 0; i < 3; i++) {
      const v = clamp(fly * 1.2 - i * 0.1), sx = o.rh[0] + 20, sy = o.rh[1] - 40;
      const x = lerp(sx + i * 14, pb.chest[0] - 30, easeInOut(v)), y = lerp(sy - i * 10, pb.chest[1], easeInOut(v)) - Math.sin(v * Math.PI) * 160;
      ctx.save(); ctx.globalAlpha *= a * write * (1 - smooth(prog(v, 0.92, 1))); ctx.translate(x, y); ctx.rotate(-0.2 + i * 0.12 + v * 0.6);
      ctx.fillStyle = 'rgb(246,240,226)'; ctx.fillRect(-40, -52, 80, 104); ctx.strokeStyle = 'rgba(90,80,80,0.55)'; ctx.lineWidth = 2;
      for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-28, -36 + k * 14); ctx.lineTo(28 - 12 * hash(k + i), -36 + k * 14); ctx.stroke(); }
      ctx.restore();
    }
    if (fly > 0.9) { glow(ctx, pb.chest[0], pb.chest[1], 120, PINK, a * 0.5); heart(ctx, pb.chest[0], pb.chest[1] - 160, 26, PINK, a * smooth(prog(t, ve('E03') - 0.4, ve('E03') + 0.2))); }
    ctx.restore();
  });

  // E04：她挂在他胳膊上不撒手，头顶的小心心一颗颗冒
  add(vs('E04') - 0.2, vs('E05') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { pool: [W / 2, 1255, 460] });
    const t0 = vs('E04');
    ctx.save(); X.push(ctx, t, t0, ve('E04') + 0.6, 0.08, W / 2, 900);
    love(ctx, t, a, { x: 640, s: 2.3 });
    infp(ctx, 470, FY, 1.05, { a, t, wind: false, lean: 0.12, eyes: 'happy', ra: -1.0, la: 0.2, look: [1, -1], flies: 1 });
    for (let k = 0; k < 6; k++) { const v = ((t - t0) * 0.7 + k / 6) % 1; heart(ctx, 520 + Math.sin(k * 2 + t) * 60, 680 - v * 260, 18 + 8 * hash(k), PINK, a * (1 - v)); }
    ctx.restore();
  }, (ctx, t, a) => X.quote(ctx, '我恨不得一天 25 个小时\n都粘着他', t, vs('E04') + 0.2, ve('E04') + 0.9, { y: 300, keys: ['25 个小时'], keyColor: PINK }));

  // E05-E06：她头顶的想象泡泡里，他是一个闪闪发光的王子；现实里他打着哈欠、穿着拖鞋；泡泡啪地破了
  add(vs('E05') - 0.2, vs('E07') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { pool: [W / 2, 1255, 520] });
    const t0 = vs('E05'), tr = vs('E06'), pop = at('E06', '差得很远');
    ctx.save(); X.push(ctx, t, t0, ve('E06') + 0.4, 0.05);
    const pb = love(ctx, t, a, { slump: smooth(prog(t, tr, tr + 0.6)) * 0.6 });
    const o = infp(ctx, 320, FY, 1.05, { a, t, look: [0.4, -1], eyes: t < pop ? 'happy' : 'wide', mouth: t < pop ? 'smile' : 'o', spin: t * 0.5, flies: 1 });
    const ba = a * smooth(prog(t, t0 + 0.2, t0 + 0.8)) * (1 - smooth(prog(t, pop, pop + 0.25)));
    if (ba > 0.003) {
      const cx = 430, cy = 560, R = 230;
      glow(ctx, cx, cy, R * 1.3, [255, 230, 180], ba * 0.3);
      ctx.save(); ctx.globalAlpha *= ba; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.stroke(); ctx.fillStyle = 'rgba(60,70,90,0.35)'; ctx.fill(); ctx.restore();
      for (const [dx, dy, r] of [[-120, 290, 22], [-160, 360, 14]]) { ctx.save(); ctx.globalAlpha *= ba; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, 6.283); ctx.stroke(); ctx.restore(); }
      ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, R - 4, 0, 6.283); ctx.clip();
      glow(ctx, cx, cy + 40, 160, GOLD, ba * 0.6);
      MB.person(ctx, HIM, cx, cy + 190, 1.7, { a: ba, flip: true });
      ctx.restore();
      // 王冠 + 星光
      ctx.save(); ctx.globalAlpha *= ba; ctx.fillStyle = 'rgb(246,214,140)'; const hx = cx, hy = cy - 160; ctx.beginPath(); ctx.moveTo(hx - 44, hy + 8); ctx.lineTo(hx - 50, hy - 30); ctx.lineTo(hx - 20, hy - 6); ctx.lineTo(hx, hy - 40); ctx.lineTo(hx + 20, hy - 6); ctx.lineTo(hx + 50, hy - 30); ctx.lineTo(hx + 44, hy + 8); ctx.closePath(); ctx.fill(); ctx.restore();
      for (let k = 0; k < 8; k++) glow(ctx, cx + Math.cos(k + t) * R * 0.8, cy + Math.sin(k * 1.3 + t) * R * 0.7, 8, GOLD, ba * (0.5 + 0.5 * Math.sin(t * 5 + k)));
    }
    // 破掉的碎片
    if (t > pop) for (let k = 0; k < 18; k++) { const v = prog(t, pop, pop + 0.8), an = k / 18 * 6.283; glow(ctx, 430 + Math.cos(an) * 230 * (1 + v * 0.6), 560 + Math.sin(an) * 230 * (1 + v * 0.6), 6, IVORY, a * (1 - v)); }
    // 现实：他打哈欠（头上一缕白气）
    if (t > tr) for (let k = 0; k < 4; k++) { const v = clamp((t - tr) * 0.6 - k * 0.12) % 1; glow(ctx, pb.head[0] - 30 - v * 60, pb.head[1] - 20 - v * 60, 14 + v * 20, [210, 214, 220], a * 0.4 * Math.sin(v * Math.PI)); }
    ctx.restore();
  });

  // E07：阳光正好，两人坐在一起；她却抬头看天，一朵乌云正在远处慢慢长出来，手里的风车越转越慢
  add(vs('E07') - 0.2, vs('E08') + 0.1, (ctx, t, a) => {
    const t0 = vs('E07'), tu = at('E07', '不安'), tp = at('E07', '痛苦');
    const cloud = smooth(prog(t, tu - 0.4, ve('E07')));
    X.back(ctx, t, { pool: [W / 2, 1255, 560], mood: cloud * 0.6 });
    ctx.save(); X.push(ctx, t, t0, ve('E07') + 0.4, 0.05);
    glow(ctx, 280, 420, 260, [255, 226, 150], a * 0.55 * (1 - cloud * 0.4));
    glow(ctx, 280, 420, 60, [255, 250, 220], a * (1 - cloud * 0.3));
    // 乌云
    if (cloud > 0) { ctx.save(); ctx.globalAlpha *= a * cloud; ctx.fillStyle = 'rgb(54,60,74)'; for (const [dx, dy, r] of [[-110, 0, 70], [-30, -40, 96], [70, -10, 80], [150, 20, 60], [20, 30, 80]]) { ctx.beginPath(); ctx.arc(760 + dx, 470 + dy, r * (0.5 + 0.5 * cloud), 0, 6.283); ctx.fill(); } ctx.restore(); }
    love(ctx, t, a, { x: 760, s: 2.1 });
    const spin = t * lerp(4, 0.2, smooth(prog(t, tu, tp + 1)));
    infp(ctx, 380, FY, 1.05, { a, t, look: [0.6, -1.4], tilt: 0.4, eyes: t > tu ? 'sad' : 'happy', spin, ra: -0.2, la: 0.3, flies: 1 });
    // 天平：一边「现在的幸福」，一边「以后的痛苦」，后者慢慢沉下去
    const tilt = smooth(prog(t, tp - 0.3, tp + 0.8)) * 0.35;
    if (t > tp - 0.5) {
      const ba = a * smooth(prog(t, tp - 0.5, tp));
      const cx = W / 2, cy = 760, Lb = 300;
      ctx.save(); ctx.globalAlpha *= ba; ctx.translate(cx, cy); ctx.rotate(-tilt);
      ctx.strokeStyle = 'rgba(230,220,200,0.8)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-Lb, 0); ctx.lineTo(Lb, 0); ctx.stroke(); ctx.restore();
      const lp = [cx - Lb * Math.cos(tilt), cy + Lb * Math.sin(tilt)], rp = [cx + Lb * Math.cos(tilt), cy - Lb * Math.sin(tilt)];
      glow(ctx, rp[0], rp[1] + 30, 40, GOLD, ba * 0.8); K.text(ctx, '现在的幸福', rp[0], rp[1] + 100, { size: 40, weight: 500, color: GOLD, alpha: ba, align: 'center' });
      glow(ctx, lp[0], lp[1] + 30, 54, [90, 96, 120], ba); K.text(ctx, '以后的痛苦', lp[0], lp[1] + 110, { size: 40, weight: 500, color: [170, 180, 210], alpha: ba, align: 'center' });
    }
    ctx.restore();
  });

  // E08：城堡门口，她举着风车站岗，像一个小骑士；窗户一扇扇亮起来
  add(vs('E08') - 0.2, vs('F01') + 0.1, (ctx, t, a) => {
    X.back(ctx, t, { pool: [W / 2, 1255, 520] });
    const t0 = vs('E08'), tk = at('E08', '骑士');
    ctx.save(); X.push(ctx, t, t0, ve('E08') + 0.6, 0.05, W / 2, 900);
    const cx = W / 2 + 120, base = FY - 20;
    glow(ctx, cx, base - 300, 420, [255, 210, 150], a * 0.25);
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(40,50,58)';
    ctx.fillRect(cx - 260, base - 380, 520, 380);
    for (const sx of [-1, 1]) { ctx.fillRect(cx + sx * 260 - 70, base - 520, 140, 520); for (let k = 0; k < 3; k++) ctx.fillRect(cx + sx * 260 - 70 + k * 50, base - 560, 36, 40); }
    for (let k = 0; k < 6; k++) ctx.fillRect(cx - 250 + k * 90, base - 420, 50, 40);
    ctx.fillStyle = 'rgb(24,28,32)'; ctx.beginPath(); ctx.moveTo(cx - 70, base); ctx.lineTo(cx - 70, base - 150); ctx.arc(cx, base - 150, 70, Math.PI, 0); ctx.lineTo(cx + 70, base); ctx.fill();
    ctx.restore();
    const wins = [[cx - 160, base - 260], [cx + 160, base - 260], [cx - 260, base - 420], [cx + 260, base - 420], [cx, base - 300]];
    wins.forEach(([x, y], i) => { const on = smooth(prog(t, t0 + 0.4 + i * 0.5, t0 + 0.9 + i * 0.5)); ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.rgba(K.mix([30, 36, 40], [255, 214, 140], on), 1); ctx.fillRect(x - 22, y - 34, 44, 68); ctx.restore(); glow(ctx, x, y, 70, [255, 210, 140], a * on * 0.45); });
    const stand = smooth(prog(t, tk - 0.4, tk + 0.2));
    infp(ctx, 240, FY, 1.05, { a, t, ra: lerp(0, -1.1, stand), la: 0.4, spin: t * 1.5, eyes: 'open', mouth: 'flat', flies: 1 });
    ctx.restore();
  });

  // F01-F02：她举着风车往远处走，路过一盏盏灯，每过一盏那盏就亮；镜头慢慢拉远
  add(vs('F01') - 0.3, END - 6.4, (ctx, t, a) => {
    X.back(ctx, t, { pool: null });
    const t0 = vs('F01'), te = ve('F02'), u = prog(t, t0, te + 1.2);
    ctx.save();
    const s = lerp(1.08, 0.86, smooth(u)); ctx.translate(W / 2, 1050); ctx.scale(s, s); ctx.translate(-W / 2, -1050);
    // 一条往远处去的路，路边一排灯
    const P = (v) => [W / 2 + Math.sin(v * 3.2) * 180 * (1 - v), lerp(FY + 120, 1050, Math.pow(v, 0.7))];
    for (let i = 0; i <= 40; i++) { const [x, y] = P(i / 40); glow(ctx, x, y, 22 * (1 - i / 50), [180, 220, 160], a * 0.12); }
    const walk = smooth(prog(t, t0 + 0.2, te + 0.8)) * 0.75;
    for (let i = 0; i < 9; i++) {
      const v = 0.08 + i * 0.1, [x, y] = P(v), sc = 1 - v * 0.8, side = i % 2 ? 1 : -1, lx = x + side * 120 * sc, ly = y;
      const on = smooth(prog(walk, v - 0.05, v + 0.02));
      glowLine(ctx, [[lx, ly], [lx, ly - 200 * sc]], [120, 130, 120], a * 0.6, 2 * sc, 0.4);
      glow(ctx, lx, ly - 200 * sc, 90 * sc, [255, 220, 150], a * on * 0.6);
      glow(ctx, lx, ly - 200 * sc, 14 * sc, [255, 246, 220], a * (0.25 + 0.75 * on));
      if (on > 0) { ctx.save(); ctx.translate(lx, ly + 4); ctx.scale(1, 0.2); glow(ctx, 0, 0, 120 * sc, [255, 210, 140], a * on * 0.35); ctx.restore(); }
    }
    const [hx, hy] = P(walk), hs = 1 - walk * 0.8;
    infp(ctx, hx, hy, 0.95 * hs, { a, t, spin: t * 3, ra: -0.3, la: Math.sin(t * 5) * 0.3, lean: 0.05, flies: 1 });
    ctx.restore();
  });

  // 关注卡
  add(END - 6.6, END + 1, (ctx, t, a) => { X.back(ctx, t, { pool: null, floor: 0.5 }); }, (ctx, t, a) => {
    const t0 = END - 6.4;
    ctx.save(); ctx.globalAlpha *= a;
    ctx.restore();
    const fa = a * smooth(prog(t, t0, t0 + 1.0));
    glow(ctx, W / 2, 830, 420, GOLD, 0.22 * fa);
    for (let k = 0; k < 40; k++) { const v = clamp((t - t0) * 0.7 - hash(k) * 0.4), an = k * 2.4; glow(ctx, W / 2 + Math.cos(an) * (500 * (1 - v) + 300 * hash(k + 9)), 830 + Math.sin(an) * (300 * (1 - v) + 80), 6, GOLD, a * (0.3 + 0.5 * Math.sin(t * 3 + k) ** 2)); }
    L.rich(ctx, '关注依恋研究室', W / 2, 860 + (1 - easeOut(prog(t, t0, t0 + 1))) * 20, { size: 96, weight: 600, spacing: 0.12, color: IVORY, keys: ['依恋研究室'], keyColor: GOLD, alpha: fa, glowKey: 0.6 });
    L.rich(ctx, '了解更多心理知识', W / 2, 1000, { size: 54, weight: 500, spacing: 0.1, color: IVORY, alpha: a * smooth(prog(t, t0 + 1.4, t0 + 2.2)), glowKey: 0.4 });
  });
  return S;
};
