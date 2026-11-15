'use strict';
// PWG3 第一幕「她的房间」：C101–C102（镜头从上一组那扇绿窗推进来）
//   C101 倾向于独处：她把窗帘拉上，房间里只剩台灯这一圈暖光；「有问题自己内耗」—— 胸前浮着一团越缠越紧的乱线（问题），线从她胸口往外抽光；
//        「自己疏导」—— 她捏住线头，乱线一圈圈松开，绕成一个整整齐齐的发光线球
//   C102 思考过度：念头变成一张张写着字的纸从她头顶冒出来（「他是不是生气了」「刚才那句话说错了吗」……），越冒越快，飘满整个房间，把灯光都挡暗了；
//        最后一张是「线下活动」邀请函，飞到镜头前铺满画面 → 下一幕
const X = require('./pwk');
const { infp } = require('./pf');
const S = require('./PWS_kit');
const RM = require('./PWS_room');
const { K, GOLD, LIME, PINK, BLUE, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('C101') - 0.9, c101: vs('C101'), prob: at('C101', '有问题'), fix: at('C101', '自己疏导'), c102: vs('C102'), think: at('C102', '常常'), over: at('C102', '思考过度'), end: ve('C102') + 0.25 };
const CAM = [[T.in, { x: 30, y: -60, z: 1.5, ax: 540, ay: 1000 }], [T.c101 + 0.6, { x: 0, y: 0, z: 1.06 }], [T.prob, { x: -10, y: 20, z: 1.3 }], [T.c102 - 0.2, { x: -10, y: 20, z: 1.36 }], [T.think + 0.6, { x: 0, y: 0, z: 1.1 }], [T.end, { x: 0, y: 0, z: 1.0 }]];
// 乱线团 → 线球
const NP = 150, R1 = mulberry32(31);
const TANG = (() => { const o = []; let a = 0, b = 0; for (let i = 0; i < NP; i++) { a += 0.9 + R1() * 1.6; b += (R1() - 0.5) * 2.4; const r = 50 + R1() * 80; o.push([Math.cos(a) * r * (0.6 + 0.4 * Math.sin(b)), Math.sin(a * 1.3 + b) * r * 0.8]); } return o; })();
const BALL = Array.from({ length: NP }, (_, i) => { const s = i / (NP - 1), a = s * Math.PI * 14, r = 64 * Math.sin(s * Math.PI * 0.5 + 0.2) + 6; return [Math.cos(a) * r, Math.sin(a) * r * (0.35 + 0.65 * Math.abs(Math.cos(s * 9)))]; });
function yarn(ctx, x, y, s, u, tight, t, a) {
  if (a <= 0.003) return;
  const col = mix([86, 60, 150], [255, 214, 140], u), k = 1 - 0.25 * tight;
  S.add(ctx, () => glow(ctx, x, y, 260 * s, mix([120, 70, 200], [255, 206, 130], u), (0.3 + 0.3 * u) * a));
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.rotate((1 - u) * Math.sin(t * 1.7) * 0.2 + u * t * 0.3); ctx.globalAlpha *= a; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath();
  for (let i = 0; i < NP; i++) { const e = easeInOut(clamp(u * 1.5 - (i / NP) * 0.5)), jx = (1 - e) * Math.sin(t * 5 + i) * 5 * tight, px = lerp(TANG[i][0] * k, BALL[i][0], e) + jx, py = lerp(TANG[i][1] * k, BALL[i][1], e); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
  ctx.strokeStyle = rgba(mix(col, [0, 0, 20], 0.5)); ctx.lineWidth = 13; ctx.stroke(); ctx.strokeStyle = rgba(col); ctx.lineWidth = 8; ctx.stroke(); ctx.strokeStyle = rgba(mix(col, [255, 255, 255], 0.5), 0.7); ctx.lineWidth = 2.6; ctx.stroke();
  ctx.restore();
}
// 念头纸
const NOTES = ['他是不是生气了？', '刚才那句话\n说错了吗', '如果当时……', '明天怎么办', '已读不回？', '我是不是很奇怪', '要不要解释一下', '算了，还是别说了', '她那个表情\n是什么意思', '万一呢'];
const PAPERS = Array.from({ length: 30 }, (_, i) => { const r = mulberry32(500 + i); const big = i % 7 === 3; return { to: [60 + r() * 960, 180 + r() * 1040], rot: (r() - 0.5) * 0.7, s: big ? 1.7 : 0.7 + r() * 0.5, big, txt: NOTES[i % NOTES.length], dl: Math.pow(i / 30, 0.62), ph: r() * 6.28 }; });
function note(ctx, x, y, s, rot, a, txt, blur) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a; if (blur) ctx.filter = `blur(${blur}px)`;
  ctx.shadowColor = 'rgba(0,0,20,0.5)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 12;
  const g = ctx.createLinearGradient(-130, -90, 130, 90); g.addColorStop(0, 'rgb(255,250,236)'); g.addColorStop(1, 'rgb(226,210,190)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-130, -86, 260, 172, 8); ctx.fill();
  ctx.shadowColor = 'transparent'; ctx.fillStyle = 'rgba(240,150,120,0.5)'; ctx.fillRect(-130, -86, 260, 14);
  const ls = txt.split('\n'); ls.forEach((l, i) => K.text(ctx, l, 0, 14 + (i - (ls.length - 1) / 2) * 46, { size: 34, weight: 500, color: [70, 56, 70], spacing: 0.02 }));
  ctx.restore();
}
function invite(ctx, x, y, s, rot, a) {
  if (a <= 0.003) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  ctx.shadowColor = 'rgba(0,0,20,0.5)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 14;
  const g = ctx.createLinearGradient(0, -120, 0, 120); g.addColorStop(0, 'rgb(255,226,170)'); g.addColorStop(1, 'rgb(250,170,120)'); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-170, -110, 340, 220, 14); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(160,70,50,0.6)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.roundRect(-154, -94, 308, 188, 8); ctx.stroke();
  K.text(ctx, '邀请函', 0, -24, { size: 62, weight: 500, color: [130, 50, 40], spacing: 0.2 }); K.text(ctx, '周六 · 线下活动', 0, 46, { size: 34, weight: 500, color: [150, 70, 50], spacing: 0.08 });
  ctx.restore();
}
function draw(ctx, t) {
  const C = S.camKF(t, CAM);
  const cur = easeInOut(prog(t, T.c101 - 0.2, T.c101 + 1.0));
  const flood = prog(t, T.think - 0.3, T.end - 0.3);
  RM.room(ctx, t, C, { lamp: 1 - 0.45 * smooth(prog(flood, 0.3, 1)), curtain: cur });
  ctx.save(); S.cam(ctx, C, 1);
  // 她
  const pu = prog(t, T.prob - 0.3, T.fix), fu = prog(t, T.fix - 0.1, T.c102 - 0.1), tight = smooth(pu) * (1 - smooth(fu));
  const [hx, hy] = RM.HER, pull = smooth(prog(t, T.c101 - 0.3, T.c101 + 0.9)) * (1 - smooth(prog(t, T.c101 + 0.9, T.prob)));
  const th = smooth(flood);
  const o = { t, wind: false, eyes: fu > 0.75 && th < 0.05 ? 'happy' : th > 0.3 ? 'wide' : tight > 0.4 ? 'sad' : 'open', mouth: tight > 0.4 || th > 0.3 ? 'flat' : 'smile', look: fu > 0.02 && fu < 0.5 ? [0, -1.8] : th > 0.1 ? [Math.sin(t * 3.1) * 1.4, -1 + Math.cos(t * 2.3) * 0.6] : [0.6, 0.8 * tight], tilt: 0.3 * tight - 0.3 * th,
    ra: -0.9 * pull - 1.1 * smooth(prog(fu, 0, 0.3)) * (1 - 0.5 * smooth(prog(fu, 0.45, 0.85))) * (1 - th) - 0.9 * th, la: -1.0 * smooth(prog(fu, 0, 0.3)) * (1 - smooth(prog(fu, 0.45, 0.85))) * (1 - th) - 1.0 * th, lean: 0.03 * Math.sin(t * 2.2) * th, dim: 0.4 * tight };
  S.add(ctx, () => S.rgrad(ctx, hx - 40, hy + 8, 260, [[0, [0, 0, 0], 0], [1, [0, 0, 0], 0]], 0.2));
  ctx.save(); ctx.globalAlpha = 0.4; S.rgrad(ctx, hx + 50, hy + 6, 210, [[0, [10, 8, 30], 0.9], [1, [10, 8, 30], 0]], 0.16); ctx.restore();
  const R = S.lit(ctx, c => infp(c, hx, hy, 1.0, o), { light: RM.LAMP, at: [hx, hy - 290], r: 340, warm: [255, 214, 150], cool: [24, 24, 70], k: 1.1 });
  // 2026-11-15 反馈 04 重做：不再用乱线团。
  //   内耗 = 她头顶自己攒出来的一朵乌云，只淋她一个人，脚边积起水洼，人暗下去；
  //   自己疏导 = 她举起一只喷壶把雨接住，转身浇在脚边的花盆里 —— 乌云越下越小、变白散掉，花盆里抽出枝叶、开出一朵花
  const ya = smooth(prog(pu, 0, 0.3)) * (1 - smooth(prog(t, T.think - 0.5, T.think + 0.2)));
  if (ya > 0.003) {
    const hold = smooth(prog(fu, 0, 0.3)), pour = easeInOut(prog(fu, 0.45, 0.85)), empty = smooth(prog(fu, 0.3, 1.0)), grow = prog(t, T.fix + 0.75, T.c102 + 0.75);
    const cx = R.top[0] + 6, cy = R.top[1] - 200 - 40 * empty, cs = (0.55 + 0.45 * smooth(prog(pu, 0, 0.7))) * (1 - 0.6 * empty), dark = 1 - empty;
    // 雨：只落在她身上（接住以后只落到喷壶里）
    const canX = lerp(R.top[0] + 10, hx + 210, pour), canY = lerp(R.top[1] - 70, hy - 330, pour), rainA = ya * (1 - smooth(prog(fu, 0.55, 0.95))) * smooth(prog(pu, 0.25, 0.6));
    if (rainA > 0.01) { const yb = lerp(hy + 6, canY - 10, hold * (1 - pour)); ctx.save(); ctx.translate(cx - 150 * cs, cy + 30); S.rain(ctx, t, { box: [0, 0, 300 * cs, Math.max(60, yb - cy - 30)], a: rainA, n: 42, c: [170, 200, 255], slant: -0.04, seed: 11 }); ctx.restore();
      if (hold < 0.5) for (let k = 0; k < 3; k++) { const ph = (t * 1.1 + k / 3) % 1; S.ring(ctx, hx + (k - 1) * 70, hy + 10, 14 + ph * 90, 7, [170, 200, 255], 0.5 * (1 - ph) * rainA * (1 - hold), 0.26); } }
    // 乌云：一团团有体积的云，底是平的；越下越小、越白
    ctx.save(); ctx.globalAlpha = ya; const c0 = mix([236, 240, 252], [60, 62, 110], dark), c1 = mix([190, 200, 230], [28, 28, 66], dark);
    for (const [dx, dy, r] of [[-120, 10, 80], [-50, -34, 104], [40, -50, 116], [124, -6, 86], [0, 14, 110], [-80, 30, 70], [80, 30, 74]]) S.rgrad(ctx, cx + dx * cs + Math.sin(t * 0.7 + dx) * 4, cy + dy * cs, r * cs, [[0, c0, 0.98], [0.62, c1, 0.92], [1, c1, 0]]);
    S.add(ctx, () => { const fl = Math.pow(Math.max(0, Math.sin(t * 1.9)), 10) * dark; glow(ctx, cx - 20, cy + 6, 150 * cs, [190, 200, 255], 0.5 * fl); });
    ctx.restore();
    // 花盆（在她右边的地板上）+ 长出来的花
    const px = hx + 250, py = hy + 10, ga = ya * smooth(prog(fu, 0.2, 0.5));
    if (ga > 0.01) { ctx.save(); ctx.globalAlpha = ga; S.poly(ctx, [[px - 56, py - 80], [px + 56, py - 80], [px + 42, py], [px - 42, py]]); const pg = ctx.createLinearGradient(px - 56, 0, px + 56, 0); pg.addColorStop(0, 'rgb(236,160,120)'); pg.addColorStop(1, 'rgb(150,84,76)'); ctx.fillStyle = pg; ctx.fill(); ctx.fillStyle = 'rgb(250,190,150)'; ctx.beginPath(); ctx.roundRect(px - 64, py - 94, 128, 20, 6); ctx.fill(); ctx.fillStyle = 'rgb(70,44,50)'; ctx.beginPath(); ctx.ellipse(px, py - 90, 54, 8, 0, 0, 6.2832); ctx.fill();
      if (grow > 0) { const g1 = easeOut(clamp(grow * 1.6)), top = [px + 10 * g1, py - 90 - 190 * g1]; ctx.strokeStyle = 'rgb(84,170,120)'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(px, py - 90); ctx.quadraticCurveTo(px - 16, py - 90 - 100 * g1, top[0], top[1]); ctx.stroke();
        for (const [sd, at2, dl] of [[-1, 0.4, 0.2], [1, 0.65, 0.35]]) { const lu = easeOut(prog(grow, dl, dl + 0.4)); if (lu <= 0) continue; const lx = px - 8 + sd * 4, ly = py - 90 - 190 * g1 * at2; ctx.fillStyle = 'rgb(110,196,130)'; ctx.save(); ctx.translate(lx, ly); ctx.rotate(sd * -0.5); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(sd * 40 * lu, -30 * lu, sd * 78 * lu, 0); ctx.quadraticCurveTo(sd * 40 * lu, 26 * lu, 0, 0); ctx.fill(); ctx.restore(); }
        const fu2 = prog(grow, 0.55, 1); if (fu2 > 0) { const e = easeOut(fu2) * (1 + 0.25 * Math.sin(Math.min(1, fu2) * Math.PI)); S.add(ctx, () => glow(ctx, top[0], top[1], 170 * e, [255, 190, 170], 0.5 * e)); ctx.save(); ctx.translate(top[0], top[1]); ctx.rotate(0.3); for (let k = 0; k < 6; k++) { ctx.rotate(6.2832 / 6); const g = ctx.createRadialGradient(0, 0, 0, 0, -30 * e, 48 * e); g.addColorStop(0, 'rgb(255,250,236)'); g.addColorStop(1, 'rgb(255,150,170)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(0, -30 * e, 20 * e, 32 * e, 0, 0, 6.2832); ctx.fill(); } ctx.fillStyle = 'rgb(255,220,120)'; ctx.beginPath(); ctx.arc(0, 0, 13 * e, 0, 6.2832); ctx.fill(); ctx.restore(); } }
      ctx.restore(); }
    // 喷壶：先举过头顶接雨，再倾过去浇花
    if (hold > 0.01) { const tilt = -0.15 + 0.85 * pour; ctx.save(); ctx.globalAlpha = ya * hold; ctx.translate(canX, canY); ctx.rotate(tilt);
      const g = ctx.createLinearGradient(-60, 0, 60, 0); g.addColorStop(0, 'rgb(150,220,210)'); g.addColorStop(0.5, 'rgb(96,180,176)'); g.addColorStop(1, 'rgb(50,116,130)');
      ctx.strokeStyle = 'rgb(70,150,150)'; ctx.lineWidth = 12; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(-58, -6, 40, 1.9, 4.5); ctx.stroke();                         // 提手
      S.poly(ctx, [[52, 10], [150, -46], [158, -30], [60, 40]]); ctx.fillStyle = 'rgb(80,160,160)'; ctx.fill(); ctx.beginPath(); ctx.ellipse(156, -40, 16, 22, 0.6, 0, 6.2832); ctx.fillStyle = 'rgb(130,206,200)'; ctx.fill();   // 壶嘴 + 莲蓬头
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(-60, -52, 120, 104, 16); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(-48, -44, 14, 86); ctx.fillStyle = 'rgb(40,90,110)'; ctx.beginPath(); ctx.ellipse(0, -52, 60, 10, 0, 0, 6.2832); ctx.fill();
      ctx.restore();
      if (pour > 0.6) { const A0 = [canX + 150 * Math.cos(tilt) + 40 * Math.sin(tilt), canY + 150 * Math.sin(tilt) - 40 * Math.cos(tilt)], wa = ya * smooth(prog(pour, 0.6, 1)) * (1 - smooth(prog(grow, 0.6, 1))); S.add(ctx, () => { for (let k = 0; k < 16; k++) { const ph = (t * 1.6 + k / 16) % 1, wx = lerp(A0[0], px + (k % 4 - 1.5) * 12, ph), wy = lerp(A0[1], py - 96, ph * ph); glow(ctx, wx, wy, 12, [170, 214, 255], 0.9 * wa); } }); } }
  }
  // 念头纸：一张张从头顶冒出来，飘满房间
  if (flood > 0) {
    const src = [R.top[0] + 10, R.top[1] + 10];
    for (const p of PAPERS) { if (p.big) continue; const u = prog(flood, p.dl * 0.8, p.dl * 0.8 + 0.2); if (u <= 0) continue; const e = easeOut(u), bob = Math.sin(t * 0.9 + p.ph) * 14;
      note(ctx, lerp(src[0], p.to[0], e), lerp(src[1], p.to[1], e) + bob - Math.sin(e * Math.PI) * 60, p.s * (0.25 + 0.75 * e), p.rot * e + Math.sin(t * 0.6 + p.ph) * 0.05, smooth(prog(u, 0, 0.2)), p.txt); }
  }
  ctx.restore();
  RM.front(ctx, t, C, 1);
  // 前景几张大的、虚的纸（离镜头近）
  if (flood > 0) for (const p of PAPERS) { if (!p.big) continue; const u = prog(flood, p.dl * 0.8, p.dl * 0.8 + 0.25); if (u <= 0) continue; const e = easeOut(u); note(ctx, lerp(540, p.to[0], e), lerp(700, p.to[1] > 700 ? 1740 : 120, e) + Math.sin(t * 0.7 + p.ph) * 20, p.s * (0.4 + 0.6 * e) * 1.3, p.rot, 0.9 * smooth(prog(u, 0, 0.3)), p.txt, 7); }
  // 邀请函飞到镜头前
  const iu = prog(t, T.end - 0.75, T.end + 0.15);
  if (iu > 0) { const e = easeIn(iu); invite(ctx, lerp(700, 540, e), lerp(620, 900, e), lerp(0.5, 9, e * e), lerp(-0.3, 0, e), smooth(prog(iu, 0, 0.2))); }
  return { C };
}
function over() {}
module.exports = { draw, over, T };
