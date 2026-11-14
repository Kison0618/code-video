'use strict';
// 《INFP》v3 第 3 组（Kiro）：C101–C105 独处，C201–C214 人际
//   S1 夜里卧室：她一个人坐在窗边，头顶冒出一颗颗半透明的念头泡泡，一颗分成两颗、两颗分成四颗，越想越多（思考过度）
//   S2 热闹的聚会：暖色灯串、人群虚焦在聊天；镜头横着找过去，停在角落盆栽旁局促的她，朋友们说说笑笑走远了（一抓一个准）
//   S3 夜里旷野一扇发光的拱门（副本入口），门里是一大桌应酬；她身边只有两三个朋友（暖光小圈）；
//      想象天天应酬：门里的人涌出来把她围住，她越缩越小，身上的光一点点暗下去
//   S4 雨夜特写：窗外小雨、台灯昏暗，她手里的手机微信列表空空的，屏幕冷光照在脸上；墙上的钟飞快转，窗外从黑到泛白（内耗个把小时）
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const U = require('./pwu');
const { C, K, L, LIME, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, vis, mix, rgba, mulberry32, hash } = K;
const R0 = mulberry32(303);

// 念头泡泡：半透明球 + 亮边 + 高光，带一点颜色
function bubble(ctx, x, y, r, c, a) {
  if (a <= 0.003 || r < 1) return;
  ctx.save(); ctx.globalAlpha *= a;
  glow(ctx, x, y, r * 2.2, c, 0.18);
  let g = ctx.createRadialGradient(x, y, r * 0.2, x, y, r);
  g.addColorStop(0, rgba(c, 0.08)); g.addColorStop(0.8, rgba(c, 0.22)); g.addColorStop(1, rgba(mix(c, [255, 255, 255], 0.5), 0.55));
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  ctx.save(); ctx.translate(x - r * 0.38, y - r * 0.42); ctx.rotate(-0.7); ctx.scale(1, 0.5);
  g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 0.35); g.addColorStop(0, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 0.35, 0, 6.283); ctx.fill();
  ctx.restore(); ctx.restore();
}
// 念头树：每一层分裂一次（位置由种子决定）
const BUB = (() => { const out = []; const rec = (x, y, r, d, id) => { out.push({ x, y, r, d, id }); if (d >= 5) return; for (const s of [-1, 1]) { const an = -Math.PI / 2 + s * (0.5 + hash(id * 7 + s) * 0.5), dd = r * (1.6 + hash(id * 3) * 0.6); rec(x + Math.cos(an) * dd, y + Math.sin(an) * dd * 0.8, r * 0.72, d + 1, id * 2 + (s > 0 ? 1 : 0)); } }; rec(0, 0, 70, 0, 1); return out; })();
const BCOL = [[190, 220, 255], [210, 200, 255], [255, 210, 230], [200, 240, 220], [255, 230, 190]];
// 一串暖色灯泡（聚会的灯串）：有体积的小灯泡 + 光晕，挂在一根粗软的暗线上
function stringLights(ctx, x0, y0, x1, y1, sag, n, t, a) {
  ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = 'rgba(30,22,20,0.9)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + sag * 2, x1, y1); ctx.stroke();
  for (let i = 0; i < n; i++) { const s = (i + 0.5) / n, u = 1 - s, x = u * u * x0 + 2 * u * s * (x0 + x1) / 2 + s * s * x1, y = u * u * y0 + 2 * u * s * ((y0 + y1) / 2 + sag * 2) + s * s * y1;
    const c = i % 3 === 0 ? [255, 190, 120] : i % 3 === 1 ? [255, 220, 160] : [255, 160, 140], f = 0.8 + 0.2 * Math.sin(t * 2 + i * 1.3);
    glow(ctx, x, y + 14, 70, c, 0.45 * f); U.orb(ctx, x, y + 14, 9, c, f); }
  ctx.restore();
}
// 盆栽：大叶子（有体积）
function plant(ctx, x, y, s, a = 1) {
  ctx.save(); ctx.globalAlpha *= a;
  U.shadow(ctx, x, y, 90 * s, 0.5);
  const g = ctx.createLinearGradient(x - 60 * s, 0, x + 60 * s, 0); g.addColorStop(0, 'rgb(120,70,50)'); g.addColorStop(1, 'rgb(170,104,74)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - 60 * s, y - 120 * s); ctx.lineTo(x + 60 * s, y - 120 * s); ctx.lineTo(x + 45 * s, y); ctx.lineTo(x - 45 * s, y); ctx.closePath(); ctx.fill();
  for (let i = 0; i < 9; i++) { const an = -Math.PI / 2 + (i - 4) * 0.32, l = (170 + (i % 3) * 50) * s; ctx.save(); ctx.translate(x, y - 120 * s); ctx.rotate(an + Math.PI / 2); ctx.fillStyle = i % 2 ? 'rgb(46,96,64)' : 'rgb(62,124,80)'; ctx.beginPath(); ctx.ellipse(0, -l / 2, 26 * s, l / 2, 0, 0, 6.283); ctx.fill(); ctx.fillStyle = 'rgba(180,240,190,0.15)'; ctx.beginPath(); ctx.ellipse(-6 * s, -l / 2, 8 * s, l / 2.4, 0, 0, 6.283); ctx.fill(); ctx.restore(); }
  ctx.restore();
}
// 发光拱门
function portal(ctx, x, y, w, h, t, a, inner) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a;
  glow(ctx, x, y - h / 2, h * 0.9, [150, 190, 255], 0.35);
  ctx.save(); ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h + w / 2); ctx.arc(x, y - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y); ctx.closePath(); ctx.clip();
  inner(ctx);
  ctx.restore();
  // 门框：厚的发光石框
  ctx.lineWidth = 34; ctx.strokeStyle = 'rgba(70,90,140,1)'; ctx.beginPath(); ctx.moveTo(x - w / 2, y); ctx.lineTo(x - w / 2, y - h + w / 2); ctx.arc(x, y - h + w / 2, w / 2, Math.PI, 0); ctx.lineTo(x + w / 2, y); ctx.stroke();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 14; ctx.strokeStyle = `rgba(170,210,255,${0.55 + 0.15 * Math.sin(t * 2)})`; ctx.filter = 'blur(6px)'; ctx.stroke(); ctx.filter = 'none'; ctx.restore();
  // 门前地面的光
  U.pool(ctx, x, y + 10, w * 1.1, [150, 190, 255], 0.5, 0.18);
  ctx.restore();
}
// 手机特写（大）：深色模式微信列表，空的
function bigPhone(ctx, x, y, s, rot, t, a, lit) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  const w = 420, h = 860;
  ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
  ctx.fillStyle = 'rgb(24,26,32)'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 56); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = 'rgba(160,170,190,0.4)'; ctx.lineWidth = 4; ctx.stroke();
  const sw = w - 28, sh = h - 28;
  ctx.save(); ctx.beginPath(); ctx.roundRect(-sw / 2, -sh / 2, sw, sh, 44); ctx.clip();
  ctx.fillStyle = 'rgb(17,17,19)'; ctx.fillRect(-sw / 2, -sh / 2, sw, sh);
  // 状态栏
  K.text(ctx, '1:47', -sw / 2 + 50, -sh / 2 + 52, { size: 28, family: 'Latin', weight: 600, color: [235, 235, 240], align: 'left' });
  ctx.fillStyle = 'rgb(235,235,240)'; ctx.beginPath(); ctx.roundRect(sw / 2 - 74, -sh / 2 + 34, 40, 20, 5); ctx.fill();
  ctx.fillStyle = 'rgb(0,0,0)'; ctx.beginPath(); ctx.roundRect(-60, -sh / 2 + 22, 120, 34, 17); ctx.fill();
  // 标题栏
  K.text(ctx, '微信', 0, -sh / 2 + 130, { size: 34, weight: 500, color: [235, 235, 240] });
  ctx.fillStyle = 'rgb(30,30,33)'; ctx.beginPath(); ctx.roundRect(-sw / 2 + 24, -sh / 2 + 160, sw - 48, 54, 12); ctx.fill();
  K.text(ctx, '搜索', 0, -sh / 2 + 197, { size: 24, color: [120, 120, 126] });
  // 空空的列表：几行灰色的空位（像没加载出东西）
  for (let i = 0; i < 6; i++) { const ry = -sh / 2 + 260 + i * 98; ctx.fillStyle = 'rgba(255,255,255,0.035)'; ctx.beginPath(); ctx.roundRect(-sw / 2 + 28, ry, 64, 64, 10); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.03)'; ctx.beginPath(); ctx.roundRect(-sw / 2 + 110, ry + 10, 160, 18, 6); ctx.fill(); ctx.beginPath(); ctx.roundRect(-sw / 2 + 110, ry + 40, 220, 14, 6); ctx.fill(); }
  K.text(ctx, '暂无新消息', 0, 60, { size: 30, color: [110, 110, 118] });
  // 底栏
  ctx.fillStyle = 'rgb(24,24,27)'; ctx.fillRect(-sw / 2, sh / 2 - 110, sw, 110);
  ['微信', '通讯录', '发现', '我'].forEach((n, i) => { const bx = -sw / 2 + sw * (i + 0.5) / 4; ctx.fillStyle = i === 0 ? 'rgb(7,193,96)' : 'rgb(120,120,126)'; ctx.beginPath(); ctx.roundRect(bx - 18, sh / 2 - 92, 36, 32, 8); ctx.fill(); K.text(ctx, n, bx, sh / 2 - 36, { size: 20, color: i === 0 ? [7, 193, 96] : [120, 120, 126] }); });
  ctx.restore();
  ctx.restore();
  glow(ctx, x, y, 560 * s, [140, 170, 230], 0.22 * lit * a);
}
// 挂钟：有厚度的表壳，指针飞快转
function clock(ctx, x, y, r, ang, a) {
  ctx.save(); ctx.globalAlpha *= a;
  U.shadow(ctx, x + 10, y + r + 6, r, 0.0);
  ctx.fillStyle = 'rgb(60,50,46)'; ctx.beginPath(); ctx.arc(x, y, r + 14, 0, 6.283); ctx.fill();
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r); g.addColorStop(0, 'rgb(236,228,214)'); g.addColorStop(1, 'rgb(186,176,160)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill();
  for (let i = 0; i < 12; i++) { const an = i / 12 * 6.283; ctx.fillStyle = 'rgb(80,70,64)'; ctx.beginPath(); ctx.arc(x + Math.cos(an) * r * 0.82, y + Math.sin(an) * r * 0.82, i % 3 ? 4 : 7, 0, 6.283); ctx.fill(); }
  ctx.lineCap = 'round'; ctx.strokeStyle = 'rgb(50,42,38)';
  ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang / 12 - Math.PI / 2) * r * 0.5, y + Math.sin(ang / 12 - Math.PI / 2) * r * 0.5); ctx.stroke();
  ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(ang - Math.PI / 2) * r * 0.75, y + Math.sin(ang - Math.PI / 2) * r * 0.75); ctx.stroke();
  ctx.fillStyle = 'rgb(180,80,70)'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.283); ctx.fill();
  ctx.restore();
}

module.exports = function make(G) {
  const S = []; const add = (a, b, draw, over) => S.push({ a, b, draw, over });
  const c1 = vs('C101'), c2 = vs('C102'), c3 = vs('C103'), c4 = vs('C104'), c5 = vs('C105');
  // ===== S1：卧室，念头越冒越多 =====
  add(G.a, c3 + 0.3, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const z = 1 + 0.08 * smooth(prog(t, c1, c3)); ctx.translate(W / 2, 1100); ctx.scale(z, z); ctx.translate(-W / 2, -1100);
    U.vgrad(ctx, [[0, [18, 22, 40]], [1, [30, 32, 52]]], -200, 1120);
    U.windowFrame(ctx, 560, 220, 440, 640, c => { U.vgrad(c, [[0, [26, 40, 80]], [1, [50, 60, 100]]], 220, 860, 560, 1000); glow(c, 860, 360, 240, [190, 210, 255], 0.55); glow(c, 860, 360, 50, [240, 246, 255], 0.9); for (let i = 0; i < 14; i++) glow(c, 580 + (i * 71) % 420, 240 + (i * 53) % 400, 4, [220, 230, 255], 0.35); }, { frame: [26, 26, 34] });
    U.beam(ctx, 780, 420, 440, 380, 1500, 900, [170, 190, 255], 0.13);
    U.floor(ctx, 1120, [44, 38, 48], [16, 14, 18], { seam: 0.15 });
    // 床（左边）：厚床垫 + 被子
    ctx.fillStyle = 'rgb(70,64,90)'; ctx.beginPath(); ctx.roundRect(-120, 1060, 640, 200, 30); ctx.fill();
    ctx.fillStyle = 'rgb(110,104,140)'; ctx.beginPath(); ctx.roundRect(-120, 1030, 640, 110, 40); ctx.fill();
    ctx.fillStyle = 'rgb(220,214,230)'; ctx.beginPath(); ctx.ellipse(40, 1020, 110, 50, -0.1, 0, 6.283); ctx.fill();
    U.shadow(ctx, 200, 1270, 400, 0.5);
    const o = infp(ctx, 400, 1330, 1.1, { t, a: 1, flies: 1, wind: false, nod: 0.25, look: [0.3, -0.6], dim: 0.2, la: 0.4, ra: 0.3 });
    // 念头：随时间一层层分出来
    const depth = lerp(0, 5.99, easeInOut(prog(t, c1 + 0.6, ve('C102'))));
    const hx = 600, hy = o.top ? o.top[1] - 60 : 700;
    for (const b of BUB) {
      const show = clamp(depth - b.d); if (show <= 0) continue;
      const p = b.d === 0 ? 0 : 1, fl = Math.sin(t * 1.2 + b.id) * 10;
      bubble(ctx, hx + b.x * 1.5 + fl, hy + b.y * 1.25 + Math.cos(t + b.id) * 8, b.r * 1.45 * easeOut(show), BCOL[b.d % 5], 0.9 * easeOut(show));
    }
    ctx.restore();
    return {};
  }, (ctx, t, a) => {
    const n = Math.min(63, Math.round(Math.pow(2, lerp(0, 6, easeInOut(prog(t, c1 + 0.6, ve('C102')))))));
    const v = vis(t, c2, c3 + 0.3, 0.4, 0.4);
    if (v > 0.01) K.text(ctx, n + ' 个念头', W - 90, 300, { size: 54, weight: 500, color: [210, 220, 255], alpha: a * v, align: 'right' });
  });

  // ===== S2：聚会，镜头找到角落里的她 =====
  const CROWD = [['esfp-female', 260, 1260, 2.3], ['estp-male', 520, 1240, 2.2], ['enfp-male', 820, 1250, 2.3], ['esfj-female', 1100, 1240, 2.2], ['entp-female', 1380, 1260, 2.3], ['enfj-male', 1650, 1250, 2.2]];
  const FR = [['enfp-female', 2050, 1270], ['esfj-male', 2230, 1280]];
  add(c3 - 0.3, vs('C201') - 0.2, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const pan = 1280 * easeInOut(prog(t, c3 + 0.2, c4 + 1.0));
    U.vgrad(ctx, [[0, [60, 34, 34]], [1, [88, 52, 44]]], -200, 1100);
    ctx.save(); ctx.translate(-pan * 0.5, 0);
    for (let k = 0; k < 4; k++) stringLights(ctx, -200 + k * 700, 200 + (k % 2) * 40, 500 + k * 700, 240 - (k % 2) * 40, 90, 10, t, 1);
    ctx.restore();
    U.floor(ctx, 1100, [100, 64, 48], [36, 22, 18], { seam: 0.14, vx: W / 2 - pan * 0.2 });
    ctx.save(); ctx.translate(-pan, 0);
    // 人群：虚焦，在聊天
    U.blurLayer(ctx, 6, c => { CROWD.forEach(([k, x, y, s], i) => MB.person(c, k, x, y, s, { a: 1, flip: i % 2 === 1, dim: 0.1, bob: Math.abs(Math.sin(t * 3 + i)) * 10 })); });
    // 角落：盆栽 + 她
    plant(ctx, 2300, 1300, 1.3);
    const leave = easeInOut(prog(t, c5 - 0.2, c5 + 2.2));
    FR.forEach(([k, x, y], i) => MB.person(ctx, k, x - leave * 900 - i * 80, y, 2.3, { a: 1 - leave * 0.6, flip: true, bob: Math.abs(Math.sin(t * 4 + i)) * 10 }));
    const fid = Math.sin(t * 5) * 0.12;
    infp(ctx, 2100, 1330, 1.05, { t, a: 1, flies: 1, wind: false, la: 0.3 + fid, ra: 0.3 - fid, look: [-1, 0.2], nod: 0.3, dim: 0.1 + 0.25 * leave, mouth: 'flat' });
    U.pool(ctx, 2100, 1340, 260, [255, 180, 120], 0.25);
    ctx.restore();
    // 前景：近处虚焦的灯泡光斑
    U.bokeh(ctx, 120, 1680, 120, [255, 190, 120], 0.35); U.bokeh(ctx, 980, 1720, 160, [255, 170, 120], 0.3);
    ctx.restore();
  });

  // ===== S3：副本门 =====
  const c201 = vs('C201'), c202 = vs('C202'), c204 = vs('C204'), c206 = vs('C206'), c208 = vs('C208');
  const BANQ = Array.from({ length: 16 }, (_, i) => ['estj-male', 'esfj-female', 'entj-male', 'estp-female', 'esfp-male', 'enfj-female', 'entp-male', 'istj-female'][i % 8]);
  add(c201 - 0.3, c208 + 0.3, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const flood = easeInOut(prog(t, c206 + 0.3, ve('C207')));
    const z = 1 + 0.12 * smooth(prog(t, c201, c204)) - 0.06 * flood; ctx.translate(W / 2, 1200); ctx.scale(z, z); ctx.translate(-W / 2, -1200);
    U.vgrad(ctx, [[0, [10, 14, 30]], [0.7, [28, 32, 60]], [1, [40, 44, 70]]], -200, 1150);
    for (let i = 0; i < 50; i++) glow(ctx, (i * 197) % W, 60 + (i * 89) % 900, 4, [220, 230, 255], 0.3 * (0.5 + 0.5 * Math.sin(t + i)));
    U.vgrad(ctx, [[0, [22, 26, 40]], [1, [8, 8, 14]]], 1150, H + 100);
    // 门：门里是一大桌应酬（暖灯、举杯的人群剪影）
    portal(ctx, 540, 1150, 420, 760, t, 1, c => {
      U.vgrad(c, [[0, [120, 70, 50]], [1, [200, 130, 80]]], 390, 1150, 300, 800);
      glow(c, 540, 600, 300, [255, 210, 150], 0.5);
      c.fillStyle = 'rgb(110,60,40)'; c.beginPath(); c.ellipse(540, 1080, 260, 50, 0, 0, 6.283); c.fill();
      for (let i = 0; i < 9; i++) MB.person(c, BANQ[i], 370 + i * 42, 1050 + (i % 2) * 20, 1.0, { a: 0.9, flip: i % 2 === 0, dim: 0.45, bob: Math.abs(Math.sin(t * 3 + i)) * 6 });
    });
    // 门里涌出来的人：越来越多，把她围住
    const n = Math.floor(flood * BANQ.length);
    for (let i = 0; i < n; i++) { const u = clamp(flood * BANQ.length - i), an = i * 2.4, rr = lerp(80, 260 + (i % 3) * 60, u); MB.person(ctx, BANQ[i], 540 + Math.cos(an) * rr * 1.4, 1500 + Math.sin(an) * rr * 0.25 + (i % 2) * 20, 2.0 + (i % 3) * 0.2, { a: smooth(u), flip: Math.cos(an) > 0, dim: 0.3, bob: Math.abs(Math.sin(t * 4 + i)) * 8 }); }
    // 她和两三个朋友（暖光小圈）
    const fr = smooth(prog(t, at('C202', '两三个') - 0.3, at('C202', '两三个') + 0.6)) * (1 - flood);
    if (fr > 0.01) { U.pool(ctx, 540, 1520, 420, [255, 190, 120], 0.45 * fr); MB.person(ctx, 'isfj-female', 330, 1520, 2.0, { a: fr, dim: 0.1 }); MB.person(ctx, 'infj-female', 760, 1520, 2.0, { a: fr, flip: true, dim: 0.1 }); }
    const sh = lerp(1.15, 0.6, flood);
    const lightK = 1 - 0.85 * smooth(prog(t, c206 + 1.0, ve('C207')));
    glow(ctx, 540, 1350, 320 * sh, [255, 220, 160], 0.4 * lightK);
    infp(ctx, 540, 1540, sh, { t, a: 1, flies: 1, wind: false, dim: 0.6 * (1 - lightK), nod: 0.6 * flood, la: 0.5 * flood, ra: 0.5 * flood, eyes: flood > 0.6 ? 'sad' : 'open', mouth: flood > 0.4 ? 'flat' : 'smile' });
    ctx.restore();
  });

  // ===== S4：雨夜，空空的微信 =====
  const c209 = vs('C209'), c210 = vs('C210'), c211 = vs('C211'), c212 = vs('C212'), c213 = vs('C213'), c214 = vs('C214');
  add(c208 - 0.3, G.b + 0.4, (ctx, t, a) => {
    X.back(ctx, t, { floor: 0, pool: null });
    ctx.save(); ctx.globalAlpha *= a;
    const dawn = smooth(prog(t, c214 + 0.4, c214 + 2.6));
    const close = smooth(prog(t, c212 - 0.3, c212 + 1.0));
    const z = 1 + 0.25 * close; ctx.translate(W / 2, 900); ctx.scale(z, z); ctx.translate(-W / 2, -900);
    U.vgrad(ctx, [[0, mix([16, 18, 30], [60, 66, 90], dawn)], [1, mix([26, 26, 38], [70, 70, 90], dawn)]], -200, H + 200);
    U.windowFrame(ctx, 120, 160, 840, 760, c => {
      U.vgrad(c, [[0, mix([18, 26, 48], [120, 140, 180], dawn)], [1, mix([30, 36, 60], [170, 170, 190], dawn)]], 160, 920, 120, 960);
      for (let i = 0; i < 12; i++) { const bx = 120 + i * 72, bh = 140 + (i * 61) % 220; c.fillStyle = rgba(mix([14, 18, 30], [90, 100, 130], dawn)); c.fillRect(bx, 920 - bh, 64, bh); for (let k = 0; k < 3; k++) glow(c, bx + 20 + (k % 2) * 24, 920 - bh + 30 + k * 46, 10, [255, 200, 140], 0.2 * (1 - dawn)); }
      U.rain(c, t, [120, 160, 960, 920], smooth(prog(t, c211, c211 + 0.8)));
      // 玻璃上的水珠
      for (let i = 0; i < 26; i++) { const dx = 140 + hash(i) * 800, dy = 180 + ((hash(i * 3) + t * 0.03 * hash(i * 5)) % 1) * 720; U.orb(c, dx, dy, 4 + hash(i * 7) * 6, [180, 200, 240], 0.35 * smooth(prog(t, c211, c211 + 1))); }
    }, { frame: [20, 20, 28] });
    // 台灯：昏暗
    const lamp = 0.5 * (1 - dawn);
    ctx.fillStyle = 'rgb(40,34,30)'; ctx.beginPath(); ctx.moveTo(860, 1060); ctx.lineTo(1000, 1060); ctx.lineTo(1040, 1160); ctx.lineTo(820, 1160); ctx.closePath(); ctx.fill();
    glow(ctx, 930, 1180, 380, [255, 170, 100], lamp);
    U.vgrad(ctx, [[0, [50, 38, 32]], [1, [26, 20, 18]]], 1260, H + 200);
    // 墙上的钟（内耗个把小时：指针飞转）
    const spin = easeIn(prog(t, c214, c214 + 2.4)) * 6.283 * 14;
    clock(ctx, 920, 330, 80, 1.4 + spin, smooth(prog(t, c213, c214)));
    // 她：坐在桌前，低头看手机
    const o = infp(ctx, 380, 1520, 1.15, { t, a: 1, flies: 1, wind: false, nod: 0.6, look: [0.6, 1], dim: 0.35, ra: -0.9, la: -0.4, eyes: t > c213 ? 'sad' : 'open', mouth: 'flat' });
    ctx.restore();
    // 手机（屏幕光照在她脸上），近景，不跟着推
    const pin = smooth(prog(t, c212 - 0.4, c212 + 0.6));
    if (pin > 0.01) {
      bigPhone(ctx, lerp(820, 690, pin), lerp(1500, 980, easeOut(pin)), 0.82, 0.1, t, pin, 1 - dawn * 0.5);
    }
    // 孤独溢出屏幕：冷光从手机边缘一圈一圈往外漫
    const ov = smooth(prog(t, c213 - 0.2, c213 + 1.2)) * (1 - smooth(prog(t, c214 + 1, c214 + 2.5)));
    if (ov > 0.01) for (let k = 0; k < 3; k++) { const u = ((t - c213) * 0.35 + k / 3) % 1; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = ov * (1 - u) * 0.5; const r = 300 + u * 700, g = ctx.createRadialGradient(690, 980, r * 0.7, 700, 860, r); g.addColorStop(0, 'rgba(120,150,220,0)'); g.addColorStop(0.8, 'rgba(120,150,220,0.25)'); g.addColorStop(1, 'rgba(120,150,220,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
  });
  return S;
};
