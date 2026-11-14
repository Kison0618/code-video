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
  const o = { t, wind: false, eyes: fu > 0.75 && th < 0.05 ? 'closed' : th > 0.3 ? 'wide' : tight > 0.4 ? 'sad' : 'open', mouth: tight > 0.4 || th > 0.3 ? 'flat' : 'smile', look: th > 0.1 ? [Math.sin(t * 3.1) * 1.4, -1 + Math.cos(t * 2.3) * 0.6] : [0.6, 0.8 * tight], tilt: 0.3 * tight - 0.3 * th,
    ra: -0.9 * pull - 0.3 * Math.max(tight, smooth(fu)) * (1 - th) - 0.9 * th, la: -0.4 * Math.max(tight, smooth(fu)) * (1 - th) - 1.0 * th, lean: 0.03 * Math.sin(t * 2.2) * th, dim: 0.25 * tight };
  S.add(ctx, () => S.rgrad(ctx, hx - 40, hy + 8, 260, [[0, [0, 0, 0], 0], [1, [0, 0, 0], 0]], 0.2));
  ctx.save(); ctx.globalAlpha = 0.4; S.rgrad(ctx, hx + 50, hy + 6, 210, [[0, [10, 8, 30], 0.9], [1, [10, 8, 30], 0]], 0.16); ctx.restore();
  const R = S.lit(ctx, c => infp(c, hx, hy, 1.0, o), { light: RM.LAMP, at: [hx, hy - 290], r: 340, warm: [255, 214, 150], cool: [24, 24, 70], k: 1.1 });
  // 乱线团（问题）：从胸口抽光 → 松开成线球
  const ya = smooth(prog(pu, 0, 0.25)) * (1 - smooth(prog(t, T.c102 + 0.6, T.c102 + 1.3)));
  if (ya > 0.003) {
    const yx = R.chest[0] + 150, yy = R.chest[1] - 40 + Math.sin(t * 1.3) * 6;
    if (tight > 0.05) for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1, pts = Array.from({ length: 12 }, (_, q) => { const s = q / 11; return [lerp(R.chest[0], yx, s), lerp(R.chest[1], yy, s) + Math.sin(s * Math.PI) * (20 - k * 20)]; }); S.ribbon(ctx, pts, s => 5 + 12 * Math.exp(-Math.pow((s - ph) * 5, 2)), [255, 200, 150], 0.5 * tight, 1); }
    yarn(ctx, yx, yy, 1.25, smooth(fu), tight, t, ya);
    if (fu > 0.1 && fu < 1) S.add(ctx, () => glow(ctx, yx, yy, 260 * smooth(fu), [255, 220, 150], 0.14 * Math.sin(Math.PI * fu)));
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
