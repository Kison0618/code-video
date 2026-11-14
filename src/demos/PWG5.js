'use strict';
// 《INFP》v3 第 5 组（Kiro）：D10–D16 工作里的她，E01–E09 作为伴侣
//   S1 白天的开放办公区（落地窗阳光）：同事们走来走去，她一眼就看见每个人身上那团情绪色（了解每个人的感受）；
//      她冲大家笑一下，那几团光都变暖（友好和睦）；桌上手机亮屏嗡嗡震，她把它扣过去、戴上耳机，桌面那块光收拢到她一个人身上（独自工作）
//   S2 夜里：窗外城市深处一点冷蓝的光在闪（求救）；她抱起自己那盏暖灯推门出去，送到那个缩着的人手里；
//      镜头回到她家餐桌：亲人坐在那儿，桌上的灯少了一盏，暗下去（亲人也得牺牲）
//   S3 一镜到底的客厅：他坐在沙发上，头顶一团阴云 → 她递来一只自己折的纸鹤，阴云散成暖光（逗他开心）；
//      她手里一封信，想递又背到身后（说不出口）；墙上的日历一页页翻，天数往上跳，头顶那团粉金色的婚礼梦一点点褪色（理想和现实）；
//      最好的那天：阳光、花、他在笑，她身后墙上的影子却越拉越长（担心幸福要还）
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const U = require('./pwu');
const { C, K, L, LIME, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, vis, mix, rgba, mulberry32 } = K;
const HIM = 'esfj-male';

// 手机：深色真机（圆角机身、侧边高光、亮屏时屏幕光）
function phone(ctx, x, y, s, rot, lit, t, faceDown = 0) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
  const buzz = lit > 0.5 && faceDown < 0.5 ? Math.sin(t * 70) * 3 : 0; ctx.translate(buzz, 0);
  const w = 110 * s, h = 220 * s * (1 - 0.94 * faceDown);
  U.shadow(ctx, 0, h / 2 + 4, w * 0.8, 0.5);
  ctx.fillStyle = 'rgb(28,30,36)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 16 * s); ctx.fill();
  if (faceDown < 0.5) {
    const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, rgba(mix([20, 22, 30], [120, 170, 240], lit))); g.addColorStop(1, rgba(mix([14, 16, 22], [60, 90, 180], lit)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-w / 2 + 6 * s, -h / 2 + 6 * s, w - 12 * s, h - 12 * s, 12 * s); ctx.fill();
    if (lit > 0.05) { // 来电：头像圆 + 绿色接听键
      ctx.fillStyle = `rgba(240,244,255,${0.8 * lit})`; ctx.beginPath(); ctx.arc(0, -h * 0.18, 22 * s, 0, 6.283); ctx.fill();
      ctx.fillStyle = `rgba(80,210,120,${lit})`; ctx.beginPath(); ctx.arc(0, h * 0.3, 16 * s, 0, 6.283); ctx.fill();
      glow(ctx, 0, 0, 220 * s, [140, 180, 255], 0.35 * lit);
    }
  } else { ctx.fillStyle = 'rgb(60,62,70)'; ctx.fillRect(-w / 2, -h / 2, w, 3); }
  ctx.restore();
}
// 纸鹤：低多边形折纸
function crane(ctx, x, y, s, a, t) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  const f = Math.sin(t * 4) * 0.15;
  glow(ctx, 0, 0, 90, [255, 220, 170], 0.35);
  const P = [[[-60, 10], [0, -10], [0, 20]], [[0, -10], [60, -40 - f * 60], [10, 10]], [[0, -10], [-50, -50 + f * 60], [-10, 5]], [[0, 20], [70, 0], [0, -10]], [[-60, 10], [-80, -20], [-50, 5]]];
  const Cc = ['rgb(250,236,214)', 'rgb(255,214,196)', 'rgb(236,206,190)', 'rgb(240,224,204)', 'rgb(226,196,176)'];
  P.forEach((pp, i) => { ctx.fillStyle = Cc[i]; ctx.beginPath(); pp.forEach((p, k) => k ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fill(); });
  ctx.restore();
}
// 信封
function letter(ctx, x, y, s, rot, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  glow(ctx, 0, 0, 120, [255, 200, 210], 0.3);
  ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
  ctx.fillStyle = 'rgb(250,238,226)'; ctx.fillRect(-70, -46, 140, 92); ctx.shadowColor = 'transparent';
  ctx.fillStyle = 'rgb(236,220,206)'; ctx.beginPath(); ctx.moveTo(-70, -46); ctx.lineTo(0, 12); ctx.lineTo(70, -46); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgb(226,110,130)'; ctx.beginPath(); ctx.arc(0, 8, 12, 0, 6.283); ctx.fill();
  ctx.restore();
}
// 婚礼梦：一团粉金色的光云，里面是穿婚纱的两个剪影 + 花拱门
function dream(ctx, x, y, r, a, t, fade = 0) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  const c = mix([255, 190, 200], [150, 150, 160], fade);
  glow(ctx, x, y, r * 2, c, 0.35 * (1 - fade * 0.6));
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, rgba(mix(c, [255, 255, 255], 0.5), 0.55)); g.addColorStop(1, rgba(c, 0.12));
  ctx.fillStyle = g; ctx.beginPath(); for (let i = 0; i <= 24; i++) { const an = i / 24 * 6.283, rr = r * (1 + 0.06 * Math.sin(an * 5 + t)); i ? ctx.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr * 0.8) : ctx.moveTo(x + rr, y); } ctx.closePath(); ctx.fill();
  // 花拱门（一圈花瓣光点）
  for (let i = 0; i < 18; i++) { const an = Math.PI + i / 17 * Math.PI; glow(ctx, x + Math.cos(an) * r * 0.55, y + 20 + Math.sin(an) * r * 0.5, 16, mix([255, 220, 230], [170, 170, 180], fade), 0.8); }
  // 两个人的剪影
  ctx.fillStyle = rgba(mix([255, 250, 250], [160, 160, 170], fade), 0.85);
  for (const [dx, wide] of [[-30, 1.5], [30, 1]]) { ctx.beginPath(); ctx.arc(x + dx, y - 20, 14, 0, 6.283); ctx.fill(); ctx.beginPath(); ctx.moveTo(x + dx - 12 * wide, y + 70); ctx.lineTo(x + dx - 10, y - 4); ctx.lineTo(x + dx + 10, y - 4); ctx.lineTo(x + dx + 12 * wide, y + 70); ctx.closePath(); ctx.fill(); }
  ctx.restore();
}

module.exports = function make(G) {
  const S = []; const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const P3 = G.PAGES.find(p => p.name === 'P3');
  const d10 = vs('D10'), d11 = vs('D11'), d12 = vs('D12'), d13 = vs('D13'), d14 = vs('D14'), d15 = vs('D15'), d16 = vs('D16');
  // ===== S1：白天开放办公区 =====
  const COL = [['esfj-female', 140, 1150, 1.9, [255, 150, 120]], ['entj-male', 930, 1130, 1.95, [150, 180, 255]], ['isfp-female', 640, 1000, 1.25, [200, 230, 140]], ['estp-female', 300, 990, 1.2, [255, 200, 120]]];
  add(G.a, d14 + 0.3, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const solo = smooth(prog(t, at('D13', '善于') - 0.3, at('D13', '善于') + 1.2));
    const z = 1 + 0.12 * solo; ctx.translate(560, 1250); ctx.scale(z, z); ctx.translate(-560, -1250);
    // 落地窗 + 阳光
    U.vgrad(ctx, [[0, [120, 128, 136]], [1, [150, 144, 134]]], -200, 1000);
    U.windowFrame(ctx, -60, 80, 1200, 820, c => { U.vgrad(c, [[0, [110, 150, 190]], [1, [190, 196, 196]]], 80, 900, -60, 1140); c.fillStyle = 'rgba(150,170,190,0.55)'; for (let i = 0; i < 9; i++) { const bh = 160 + (i * 73) % 260; c.fillRect(-40 + i * 140, 900 - bh, 110, bh); } glow(c, 900, 200, 500, [255, 250, 230], 0.3); }, { frame: [70, 72, 78] });
    U.beam(ctx, 900, 200, 400, 500, 1400, 900, [255, 240, 200], 0.12 * (1 - 0.6 * solo));
    U.floor(ctx, 1000, [120, 104, 88], [60, 50, 42], { seam: 0.12, cross: 5 });
    // 同事：远处走来走去，各带一团情绪色
    const read = smooth(prog(t, d11 - 0.2, d11 + 1)), warm = smooth(prog(t, d12 + 0.5, d12 + 2)), leave = solo;
    COL.forEach(([k, x, y, s, c], i) => {
      const dx = Math.sin(t * 0.25 + i * 1.7) * 70, aa = 1 - leave * 0.85;
      const o = MB.person(ctx, k, x + dx, y, s, { a: aa, flip: Math.cos(t * 0.25 + i * 1.7) < 0, dim: 0.05, bob: Math.abs(Math.sin(t * 3 + i)) * 6 });
      const ch = o && o.chest ? o.chest : [x + dx, y - 200 * s];
      const cc = mix(c, [255, 200, 150], warm);
      U.fog(ctx, ch[0], ch[1], 90 * s, t + i, read * aa * 0.7, cc, i);
      glow(ctx, ch[0], ch[1], 120 * s, cc, read * aa * (0.12 + 0.1 * warm));
    });
    // 她的桌子（近景）
    ctx.fillStyle = 'rgb(214,196,170)'; ctx.beginPath(); ctx.moveTo(140, 1250); ctx.lineTo(1000, 1250); ctx.lineTo(1080, 1340); ctx.lineTo(60, 1340); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgb(160,140,118)'; ctx.fillRect(60, 1340, 1020, 26);
    U.pool(ctx, 560, 1290, 520, [255, 230, 180], 0.35 + 0.35 * solo, 0.15);
    const smile = smooth(prog(t, d12, d12 + 0.6)) * (1 - smooth(prog(t, d13, d13 + 0.6)));
    const hp = smooth(prog(t, at('D13', '善于') - 0.2, at('D13', '善于') + 0.6));
    const o = infp(ctx, 420, 1330, 1.05, { t, a: 1, flies: 1, wind: false, eyes: smile > 0.5 ? 'happy' : 'open', ra: lerp(-0.4, 0, hp) - smile * 1.4, look: [0.4, 0] });
    // 耳机（戴上）
    if (hp > 0.01) { ctx.save(); ctx.globalAlpha *= hp; ctx.strokeStyle = 'rgb(70,76,88)'; ctx.lineWidth = 16; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(o.head[0], o.head[1] + 50, 120, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); for (const sx of [-1, 1]) { ctx.fillStyle = 'rgb(84,92,104)'; ctx.beginPath(); ctx.ellipse(o.head[0] + sx * 112, o.head[1] + 70, 28, 42, 0, 0, 6.283); ctx.fill(); } ctx.restore(); }
    // 手机：响 → 被扣过去
    const ring = smooth(prog(t, d13 - 0.1, d13 + 0.3)), down = easeInOut(prog(t, at('D13', '干扰') + 0.2, at('D13', '干扰') + 0.8));
    phone(ctx, 800, 1290, 0.9, -0.15, ring * (1 - down), t, down);
    if (ring > 0.01 && down < 0.5) for (let k = 0; k < 2; k++) L.shock(ctx, 800, 1290, t, d13 + 0.2 + k * 0.6, { r0: 40, r1: 170, dur: 0.6, c: [150, 190, 255], a: 0.5, sy: 0.4 });
    ctx.restore();
  });

  // ===== S2：夜里，远处的求救 + 家里少了一盏灯 =====
  add(d14 - 0.3, vs('E01') - 0.2, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const home = smooth(prog(t, d16 - 0.3, d16 + 0.9));
    if (home < 0.999) {
      ctx.save(); ctx.globalAlpha *= 1 - home;
      U.vgrad(ctx, [[0, [8, 12, 26]], [1, [20, 26, 44]]], -200, 1100);
      // 城市远景：一片暖窗光的楼影
      for (let i = 0; i < 14; i++) { const bx = -40 + i * 82, bh = 240 + (i * 97) % 380; ctx.fillStyle = `rgb(${18 + i % 3 * 3},${22 + i % 3 * 3},${36 + i % 3 * 4})`; ctx.fillRect(bx, 1080 - bh, 74, bh); for (let k = 0; k < 6; k++) glow(ctx, bx + 18 + (k % 2) * 36, 1080 - bh + 40 + k * 50, 12, [255, 200, 130], 0.18 + 0.12 * ((i * 7 + k) % 3)); }
      U.vgrad(ctx, [[0, [24, 26, 32]], [1, [8, 8, 10]]], 1080, H + 100);
      // 远处巷口缩着的人 + 冷蓝求救光
      const helpX = 800, helpY = 1330;
      MB.person(ctx, 'isfj-male', helpX, helpY, 2.4, { a: 1, slump: 1, dim: 0.5 });
      const call = smooth(prog(t, d14, d14 + 0.6));
      for (let k = 0; k < 3; k++) L.shock(ctx, helpX, helpY - 220, t, d14 + 0.3 + k * 1.2, { r0: 20, r1: 220, dur: 1.1, c: [140, 180, 255], a: 0.6 * call });
      glow(ctx, helpX, helpY - 220, 120, [140, 180, 255], 0.5 * call * (0.7 + 0.3 * Math.sin(t * 5)));
      // 她：抱着暖灯从左边跑过去，把灯递给他
      const run = easeInOut(prog(t, d15 - 0.2, d15 + 2.2));
      const sx = lerp(200, helpX - 200, run);
      const o = infp(ctx, sx, 1500, 1.1, { t, a: 1, flies: 1, wind: false, ra: -1.2, look: [1, -0.2], lean: 0.06 * Math.sin(run * Math.PI) });
      const give = smooth(prog(t, d15 + 2.0, d15 + 3.2));
      const lx = lerp(o.rh ? o.rh[0] + 20 : sx + 80, helpX - 30, give), ly = lerp(o.rh ? o.rh[1] - 30 : 1200, helpY - 160, give);
      U.orb(ctx, lx, ly, 34, [255, 200, 130], 1); glow(ctx, lx, ly, 360, [255, 180, 110], 0.3);
      U.pool(ctx, lx, 1490, 300, [255, 180, 110], 0.35);
      ctx.restore();
    }
    if (home > 0.001) {
      ctx.save(); ctx.globalAlpha *= home;
      // 家里的餐桌：两盏灯的位置只剩一盏，亲人坐在半暗里等
      U.vgrad(ctx, [[0, [40, 30, 28]], [1, [56, 42, 36]]], -200, 1060);
      U.floor(ctx, 1060, [60, 44, 36], [24, 18, 16], { seam: 0.15 });
      MB.person(ctx, 'isfj-female', 300, 1180, 2.7, { a: 1, dim: 0.35 });
      MB.person(ctx, 'istj-male', 780, 1180, 2.7, { a: 1, flip: true, dim: 0.35 });
      ctx.fillStyle = 'rgb(70,46,32)'; ctx.fillRect(500, 1260, 80, 220);
      ctx.fillStyle = 'rgb(96,66,46)'; ctx.beginPath(); ctx.ellipse(540, 1240, 460, 100, 0, 0, 6.283); ctx.fill();
      ctx.fillStyle = 'rgba(255,200,140,0.12)'; ctx.beginPath(); ctx.ellipse(540, 1230, 420, 80, 0, 0, 6.283); ctx.fill();
      const gone = smooth(prog(t, at('D16', '牺牲') - 0.5, at('D16', '牺牲') + 0.5));
      U.orb(ctx, 420, 1190, 30, [255, 200, 130], 1); glow(ctx, 420, 1190, 380, [255, 180, 110], 0.3);
      U.orb(ctx, 660, 1190, 30, [255, 200, 130], 1 - gone); glow(ctx, 660, 1190, 380, [255, 180, 110], 0.3 * (1 - gone));
      if (gone > 0.01) U.fog(ctx, 660, 1120 - gone * 80, 60, t, gone * (1 - gone) * 2, [150, 140, 140]);
      ctx.restore();
    }
    ctx.restore();
  });

  // ===== S3：客厅，一镜到底（E01–E09） =====
  const e1 = vs('E01'), e2 = vs('E02'), e3 = vs('E03'), e4 = vs('E04'), e5 = vs('E05'), e6 = vs('E06'), e7 = vs('E07'), e8 = vs('E08'), e9 = vs('E09');
  add(e1 - 0.3, P3.a + 0.4, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const best = smooth(prog(t, e8 - 0.5, e8 + 1));
    const z = 1 + 0.05 * smooth(prog(t, e1, e5)) - 0.08 * smooth(prog(t, e5 - 0.4, e5 + 1)) + 0.1 * smooth(prog(t, e8, e9 + 2));
    ctx.translate(W / 2, 1150); ctx.scale(z, z); ctx.translate(-W / 2, -1150);
    // 墙 + 窗 + 落地灯，最好的那天换成白天阳光
    U.vgrad(ctx, [[0, mix([56, 40, 40], [210, 196, 176], best)], [1, mix([74, 54, 48], [226, 210, 186], best)]], -200, 1080);
    U.windowFrame(ctx, 600, 160, 380, 520, c => { U.vgrad(c, [[0, mix([30, 40, 70], [170, 210, 240], best)], [1, mix([60, 50, 70], [250, 240, 220], best)]], 160, 680, 600, 980); glow(c, 860, 260, 200, mix([200, 210, 255], [255, 250, 220], best), 0.6); }, { frame: [60, 44, 38] });
    U.beam(ctx, 790, 400, 380, 420, 1300, 800, mix([200, 210, 255], [255, 236, 190], best), 0.1 + 0.18 * best);
    glow(ctx, 80, 640, 520, [255, 170, 100], 0.35 * (1 - best));
    // 日历（墙上）：天数往上跳
    const cal = smooth(prog(t, e6 - 0.4, e6 + 0.4)) * (1 - smooth(prog(t, e8 - 0.5, e8 + 0.3)));
    const day = Math.max(1, Math.round(lerp(1, 1000, easeIn(prog(t, e6, e7 + 2.2)))));
    if (cal > 0.01) {
      ctx.save(); ctx.globalAlpha *= cal; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
      ctx.fillStyle = 'rgb(246,240,230)'; ctx.fillRect(100, 300, 270, 280); ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgb(214,90,90)'; ctx.fillRect(100, 300, 270, 64);
      // 翻走的那一页
      const fl = (t * 3) % 1; ctx.save(); ctx.translate(235, 364); ctx.scale(1, 1 - fl); ctx.fillStyle = `rgba(246,240,230,${1 - fl})`; ctx.fillRect(-135, 0, 270, 216); ctx.restore();
      ctx.restore();
    }
    U.floor(ctx, 1080, mix([70, 50, 40], [190, 170, 146], best), mix([26, 18, 14], [110, 92, 76], best), { seam: 0.14 });
    // 沙发
    ctx.fillStyle = 'rgb(110,70,74)'; ctx.beginPath(); ctx.roundRect(520, 1000, 520, 200, 40); ctx.fill();
    ctx.fillStyle = 'rgb(132,86,90)'; ctx.beginPath(); ctx.roundRect(540, 1110, 480, 120, 30); ctx.fill();
    U.shadow(ctx, 780, 1240, 360, 0.5);
    // 他
    const happy = smooth(prog(t, at('E04', '逗') - 0.2, at('E04', '逗') + 1));
    const hO = MB.person(ctx, HIM, 830, 1240, 2.0, { a: 1, flip: true, dim: 0.2 * (1 - happy) });
    const hh = hO && hO.head ? hO.head : [800, 820];
    // 他头顶的阴云 → 散成暖光
    const cloud = smooth(prog(t, e4 - 0.3, e4 + 0.5)) * (1 - smooth(prog(t, e5 - 0.3, e5 + 0.6)));
    U.fog(ctx, hh[0], hh[1] - 130, 120, t, cloud * (1 - happy), [90, 100, 140]);
    if (happy > 0.01) for (let k = 0; k < 14; k++) { const an = k / 14 * 6.283 + t * 0.4, rr = 40 + happy * 140; glow(ctx, hh[0] + Math.cos(an) * rr, hh[1] - 130 + Math.sin(an) * rr * 0.6, 18, [255, 210, 150], cloud * happy * 0.8); }
    // 她
    const hide = smooth(prog(t, at('E03', '无法') - 0.2, at('E03', '无法') + 0.6)) * (1 - smooth(prog(t, e4 - 0.4, e4)));
    const offer = smooth(prog(t, e3 - 0.2, e3 + 0.6)) * (1 - hide);
    const give = smooth(prog(t, at('E04', '逗') - 0.6, at('E04', '逗'))) * (1 - smooth(prog(t, e5, e5 + 0.5)));
    if (best > 0.01) {   // 她身后墙上的影子越拉越长（画在她后面）
      const grow = easeIn(prog(t, e8 + 0.5, e9 + 3.5));
      ctx.save(); ctx.globalAlpha *= best * (0.18 + 0.32 * grow);
      ctx.translate(270, 1300); ctx.transform(1, 0, 0.25 + 0.2 * grow, 1, 0, 0); ctx.scale(1 + 0.15 * grow, 1 + 0.7 * grow); ctx.translate(-270, -1300);
      ctx.filter = `brightness(0) blur(${(4 + 6 * grow).toFixed(1)}px)`;
      infp(ctx, 270, 1300, 1.05, { t, a: 1, flies: 0, wind: false });
      ctx.filter = 'none'; ctx.restore();
    }
    const sx = 360, o = infp(ctx, sx, 1300, 1.05, { t, a: 1, flies: 1, wind: false, ra: -0.9 * offer - 1.2 * give + 0.6 * hide, la: hide * 0.5, eyes: best > 0.5 ? 'happy' : (hide > 0.5 ? 'sad' : 'open'), look: best > 0.5 ? [-1, 0] : [1, 0], tilt: hide * 0.4 });
    if (offer > 0.01 || hide > 0.01) { const rh = o.rh || [sx + 120, 1050]; letter(ctx, hide > 0.5 ? sx - 150 : rh[0] + 30, hide > 0.5 ? 1090 : rh[1] - 20, 0.9, hide > 0.5 ? -0.5 : 0.1, Math.max(offer, hide * 0.6)); }
    if (give > 0.01) { const rh = o.rh || [sx + 120, 1050]; crane(ctx, lerp(rh[0] + 40, hh[0] - 60, give), lerp(rh[1] - 30, hh[1] + 40, give), 1.1, give, t); }
    // 婚礼梦：E05 浮起，E06-E07 随天数褪色
    const dr = smooth(prog(t, e5 - 0.2, e5 + 0.8)) * (1 - smooth(prog(t, e8 - 0.6, e8)));
    dream(ctx, 560, 560, 230, dr, t, smooth(prog(t, e6, e7 + 2)));
    // 最好的那天：花瓶、阳光；她身后墙上的影子越拉越长
    if (best > 0.01) {
      ctx.save(); ctx.globalAlpha *= best;
      ctx.fillStyle = 'rgb(200,220,230)'; ctx.beginPath(); ctx.moveTo(960, 1000); ctx.quadraticCurveTo(990, 940, 970, 900); ctx.lineTo(1010, 900); ctx.quadraticCurveTo(990, 940, 1020, 1000); ctx.closePath(); ctx.fill();
      for (let k = 0; k < 7; k++) U.orb(ctx, 990 + Math.cos(k * 0.9) * 50, 850 - Math.sin(k * 1.3) * 40, 16, [255, 170, 190], 1);
      ctx.restore();
    }
    ctx.restore();
    return { day, cal };
  }, (ctx, t, a, st) => {
    if (st && st.cal > 0.01) K.text(ctx, '第 ' + st.day + ' 天', 235, 500, { size: 46, weight: 500, color: [60, 50, 46], alpha: a * st.cal });
  });
  return S;
};
