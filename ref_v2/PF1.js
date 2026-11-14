'use strict';
// 《INFP》前 1 分钟（竖屏 1080x1920）：KW=1080 KH=1920 JQ_DEMO=PF1
//   配音 11_INFP/voice/voice3.wav，时间都从 voice_timed3.json 读；主角 pf.js 的 16P 小姑娘（只留一只蝴蝶）
const X = require('./pfk');
const { infp } = require('./pf');
const MB = require('./mb');
const { C, K, L, P, LIME, LEAF, GOLD, IVORY, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, vis, mulberry32, hash } = K;

// PF_FULL=1：完整版（接 PF2a / PF2b），否则只到前 1 分钟
const FULL = !!process.env.PF_FULL;
const C6_END = +(ve('C106') + 0.9).toFixed(2);
const DUR = FULL ? +(ve('F02') + 7.6).toFixed(2) : C6_END;
const KEYS = [['医治者', GOLD], ['小蝴蝶', LIME], ['不平静', LIME], ['第一个察觉', GOLD], ['INFP', LIME], ['凯尔西', GOLD], ['《请理解我》', GOLD], ['裂痕', RED], ['完整', GOLD],
  ['1%', LIME], ['孤单', BLUE], ['理想化', GOLD], ['美好', GOLD], ['牺牲', GOLD], ['堂吉诃德', GOLD], ['好与坏', RED], ['看不出来', LIME], ['没必要', LIME], ['内耗始祖', GOLD], ['好几种结局', RED],
  ['直觉', LIME], ['比喻', LIME], ['诗意', GOLD], ['拖着', RED], ['神枪手', GOLD], ['百发百中', GOLD], ['求救', BLUE], ['分享一整天', LIME], ['温顺', LIME], ['底线', RED], ['固执到底', RED],
  ['丑小鸭', BLUE], ['天鹅', GOLD], ['适应力强', GOLD], ['耐心十足', GOLD], ['自学', GOLD], ['语言天赋', GOLD], ['电话打扰', RED], ['换了一个人', RED], ['写作、设计', LIME], ['最适合', GOLD],
  ['特别累', RED], ['忠诚', PINK], ['和和气气', LIME], ['憋着', BLUE], ['说不出口', BLUE], ['特别动人', PINK], ['特别黏', PINK], ['浪漫', PINK], ['脑海里', LIME], ['差得很远', BLUE],
  ['越不安', BLUE], ['痛苦', RED], ['城堡', GOLD], ['骑士', GOLD], ['小蝴蝶', LIME], ['走多远', GOLD]];
const subs = X.makeSubs(KEYS, DUR);
const FY = 1250;                                   // 主角脚底

// ---- 小工具 ----
function headphones(ctx, o, k, a) {                // 头戴耳机：绕头一道弧 + 两只耳罩
  if (a <= 0.003) return;
  const [hx, hy] = o.head; ctx.save(); ctx.globalAlpha *= a;
  ctx.strokeStyle = 'rgb(60,66,74)'; ctx.lineWidth = 12 * k; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(hx + 6 * k, hy + 40 * k, 92 * k, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
  for (const sx of [-1, 1]) { ctx.fillStyle = sx < 0 ? 'rgb(70,78,88)' : 'rgb(96,104,116)'; ctx.beginPath(); ctx.ellipse(hx + 6 * k + sx * 88 * k, hy + 52 * k, 22 * k, 34 * k, 0, 0, 6.283); ctx.fill(); }
  ctx.restore();
}
function ring(ctx, cx, cy, R, t, a, c = LIME, n = 90, seed = 1, tilt = 0.32) {   // 音符星环：一圈光点斜着转
  if (a <= 0.003) return;
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < n; i++) {
    const an = i / n * 6.283 + t * (0.5 + 0.2 * seed), rr = R * (0.92 + 0.16 * hash(i * 7 + seed)), x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr * tilt;
    const front = Math.sin(an) > 0 ? 1 : 0.45;
    glow(ctx, x, y, (2 + 4 * hash(i + seed * 13)) * 2.2, c, a * front * (0.5 + 0.5 * Math.sin(t * 3 + i)));
  }
  ctx.restore();
}
function note(ctx, x, y, s, c, a) {               // 一个小音符
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.rgba(c, 1); ctx.strokeStyle = K.rgba(c, 1); ctx.lineWidth = 3 * s;
  ctx.beginPath(); ctx.ellipse(x, y, 9 * s, 7 * s, -0.4, 0, 6.283); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + 8 * s, y - 2 * s); ctx.lineTo(x + 8 * s, y - 34 * s); ctx.quadraticCurveTo(x + 20 * s, y - 26 * s, x + 22 * s, y - 14 * s); ctx.stroke();
  ctx.restore();
}
function heart(ctx, x, y, r, c, a = 1) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = K.rgba(c, 1);
  ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.3, y + r * 0.1, x - r * 0.7, y - r * 0.9, x, y - r * 0.25); ctx.bezierCurveTo(x + r * 0.7, y - r * 0.9, x + r * 1.3, y + r * 0.1, x, y + r * 0.9); ctx.fill();
  ctx.restore();
}

// ================= A：开头 =================
// A01-A02：她举着风车转圈出场；「医治者」聚成字，念到「小蝴蝶」时发边那只蝴蝶飞起来，字换成「小蝴蝶」
function sceneA(ctx, t, a) {
  X.back(ctx, t);
  ctx.save(); X.push(ctx, t, 0, ve('A02'), 0.05);
  const tb = at('A02', '小蝴蝶'), u = easeOut(prog(t, 0, 1.2));
  const x = lerp(W / 2 - 160, W / 2, u), lean = Math.sin(t * 2.6) * 0.05;
  const o = infp(ctx, x, FY, 1.3, { a, t, spin: t * 3.2 + u * 4, eyes: t > tb ? 'happy' : 'open', la: Math.sin(t * 2.6) * 0.25, ra: -0.15 + Math.sin(t * 2.6 + 1) * 0.12, lean, flies: t < tb ? 1 : 0 });
  // 风车吹出来的一缕光
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 18; k++) { const v = (t * 0.6 + k / 18) % 1; glow(ctx, o.wheel[0] + v * 300, o.wheel[1] - v * 220 + Math.sin(v * 9 + k) * 30, 6 * (1 - v) + 2, LIME, 0.5 * a * (1 - v)); }
  ctx.restore();
  // 飞起来的那只蝴蝶：从发边飞到片名旁边
  if (t >= tb) {
    const v = easeInOut(prog(t, tb, tb + 1.4)), bx = lerp(o.head[0] - 190, 780, v), by = lerp(o.head[1] - 40, 420, v) - Math.sin(v * Math.PI) * 120;
    butterfly(ctx, bx, by, 1.5, t, a);
  }
  ctx.restore();
  return { tb };
}
// 一只单独的小蝴蝶（和官网同色的折纸三角翅）
function butterfly(ctx, x, y, s, t, a, rot = -0.2) {
  if (a <= 0.003) return;
  const f = 0.35 + 0.65 * Math.abs(Math.cos(t * 10));
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha *= a;
  glow(ctx, 0, 0, 60, LEAF, 0.25);
  const wing = (sx, c1, c2) => {
    ctx.fillStyle = c1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx * 46 * f, -40); ctx.lineTo(sx * 14 * f, -4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = c2; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(sx * 34 * f, -6); ctx.lineTo(sx * 18 * f, 26); ctx.closePath(); ctx.fill();
  };
  wing(-1, 'rgb(63,143,111)', 'rgb(112,157,83)'); wing(1, 'rgb(82,174,136)', 'rgb(152,196,108)');
  ctx.restore();
}
function overA(ctx, t, a, st) {
  const tb = st.tb || 99;
  const a1 = a * (1 - smooth(prog(t, tb - 0.1, tb + 0.4)));
  if (a1 > 0.003) {
    L.rich(ctx, 'INFP', W / 2, 250, { size: 70, weight: 600, spacing: 0.3, color: LIME, alpha: a1 * smooth(prog(t, 0.3, 0.9)), glowKey: 0.5 });
    ctx.save(); ctx.globalAlpha *= a1; C.gather(ctx, '医治者', W / 2, 420, t, 0.25, 99, { size: 150, weight: 600, spacing: 0.18, keys: ['医治者'], keyColor: GOLD }); ctx.restore();
    L.shock(ctx, W / 2, 370, t, 1.1, { r0: 30, r1: 420, dur: 1.2, c: GOLD, a: a1 });
  }
  if (t > tb) {
    ctx.save(); ctx.globalAlpha *= a; C.gather(ctx, '小蝴蝶', W / 2, 420, t, tb + 0.2, 99, { size: 150, weight: 600, spacing: 0.18, keys: ['小蝴蝶'], keyColor: LIME }); ctx.restore();
    L.shock(ctx, W / 2, 370, t, tb + 1.0, { r0: 30, r1: 420, dur: 1.2, c: LIME, a });
  }
}

// A03：她安安静静戴着耳机站着；身边一圈音符星环越转越大（心里并不平静）
function sceneA3(ctx, t, a) {
  X.back(ctx, t);
  const t0 = vs('A03'), tq = at('A03', '心里'), g = smooth(prog(t, tq - 0.3, tq + 1.6));
  ctx.save(); X.push(ctx, t, t0, ve('A03') + 0.6, 0.06);
  const k = 1.43 * 1.3;
  const R0 = lerp(160, 420, g);
  ring(ctx, W / 2, 760, R0 * 1.25, -t * 0.8, a * g * 0.7, [190, 220, 255], 70, 2, 0.28);
  // 后半圈先画（在人后面）
  const o = infp(ctx, W / 2, FY, 1.3, { a, t, eyes: 'closed', spin: t * 0.3, ra: 0.25, la: 0.2, nod: 0.3, flies: 1, flap: 1 });
  headphones(ctx, o, k, a);
  ring(ctx, W / 2, 760, R0, t, a * (0.35 + 0.65 * g), LIME, 110, 1, 0.3);
  for (let i = 0; i < 6; i++) { const an = t * 0.9 + i * 1.05, x = W / 2 + Math.cos(an) * R0 * 1.05, y = 760 + Math.sin(an) * R0 * 0.32 - 60; note(ctx, x, y, 1.3, i % 2 ? GOLD : LIME, a * g * (Math.sin(an) > -0.2 ? 1 : 0.3)); }
  ctx.restore();
}
function overA3(ctx, t, a) { X.quote(ctx, '就像我戴着耳机，\n音乐便成了我的星环。', t, at('A03', '心里') + 0.6, ve('A03') + 1.6); }

// A04：她和他（ENFJ）站着；他胸口的光暗了一下，她先看出来，回头看他；她手背后藏着一颗没说出口的心
function sceneA4(ctx, t, a) {
  X.back(ctx, t, { pool: [W / 2, 1255, 460] });
  const t0 = vs('A04'), td = at('A04', '对方'), tf = at('A04', '第一个');
  ctx.save(); X.push(ctx, t, t0, ve('A04') + 0.6, 0.05);
  const dimU = smooth(prog(t, td, td + 0.6)), turn = smooth(prog(t, td + 0.3, tf));
  const hx = 820, hy = FY;
  MB.person(ctx, 'enfj-male', hx, hy, 2.4, { a, flip: true, slump: dimU * 0.6, dim: dimU * 0.25 });
  // 他胸口那团光：先暖后暗
  const ch = [hx, hy - 330];
  glow(ctx, ch[0], ch[1], 70, lerp(1, 0, dimU) > 0.5 ? GOLD : [120, 140, 190], a * lerp(0.7, 0.3, dimU));
  const o = infp(ctx, 360, FY, 1.05, { a, t, look: [turn * 1.2, 0], eyes: t > tf ? 'wide' : 'open', tilt: turn * 0.6, la: -0.3, ra: 0.5, spin: t * 0.4, flies: 1 });
  // 藏在身后的心（她没说出口）
  const hb = 0.5 + 0.5 * Math.sin(t * 5);
  heart(ctx, o.lh[0] - 40, o.lh[1] + 10, 26 + 3 * hb, PINK, a * 0.85);
  glow(ctx, o.lh[0] - 40, o.lh[1] + 10, 60, PINK, a * 0.25);
  // 她看出来的一刻：一道细光从她眼睛连到他胸口
  const u = smooth(prog(t, tf - 0.1, tf + 0.5));
  if (u > 0) { const e = o.eyes; glowLine(ctx, [e, [lerp(e[0], ch[0], u), lerp(e[1], ch[1], u)]], GOLD, a * 0.8, 2.2, 0.8); L.shock(ctx, ch[0], ch[1], t, tf + 0.5, { r0: 10, r1: 140, dur: 0.9, c: GOLD, a }); }
  ctx.restore();
}

// A05：大字「INFP」从她的风车光里聚出来
function sceneA5(ctx, t, a) {
  X.back(ctx, t);
  ctx.save(); X.push(ctx, t, vs('A05'), 20.4, 0.04);
  infp(ctx, W / 2, FY, 1.0, { a, t, spin: t * 4, eyes: 'happy', ra: -0.25, la: 0.3, flies: 1 });
  ctx.restore();
}
function overA5(ctx, t, a) {
  const t0 = at('A05', 'INFP');
  ctx.save(); ctx.globalAlpha *= a; C.gather(ctx, 'INFP', W / 2, 520, t, t0 - 0.3, 99, { size: 190, weight: 600, spacing: 0.12, keys: ['INFP'], keyColor: LIME }); ctx.restore();
  L.shock(ctx, W / 2, 460, t, t0 + 0.6, { r0: 30, r1: 460, dur: 1.2, c: LIME, a });
}

// ================= B：医治者 =================
// B01：一本书翻开，书页上亮着「医治者」
function sceneB1(ctx, t, a) {
  X.back(ctx, t, { floor: 0.6, pool: [W / 2, 1150, 420] });
  const t0 = vs('B01'), u = easeOut(prog(t, t0, t0 + 1.4));
  ctx.save(); X.push(ctx, t, t0, ve('B01') + 0.5, 0.06, W / 2, 900);
  const cx = W / 2, cy = 920, bw = 380, bh = 500, op = u * 0.9;
  glow(ctx, cx, cy, 520, GOLD, 0.18 * a * u);
  for (const sx of [-1, 1]) {
    const sk = sx < 0 ? 1 : op;
    ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createLinearGradient(cx, 0, cx + sx * bw, 0); g.addColorStop(0, 'rgb(206,188,152)'); g.addColorStop(1, 'rgb(236,224,196)');
    ctx.fillStyle = g; ctx.beginPath();
    ctx.moveTo(cx, cy - bh / 2); ctx.lineTo(cx + sx * bw * sk, cy - bh / 2 - 20 * sk); ctx.lineTo(cx + sx * bw * sk, cy + bh / 2 - 20 * sk); ctx.lineTo(cx, cy + bh / 2); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(120,100,80,0.35)'; ctx.lineWidth = 2;
    for (let i = 0; i < 9; i++) { const yy = cy - 160 + i * 38; if (sx < 0 || i > 3) { ctx.beginPath(); ctx.moveTo(cx + sx * 40 * sk, yy); ctx.lineTo(cx + sx * (bw - 50) * sk, yy - 14 * sk); ctx.stroke(); } }
    ctx.restore();
  }
  ctx.restore();
  return { u };
}
function overB1(ctx, t, a, st) {
  const u = st.u || 0;
  L.rich(ctx, '《请理解我》', W / 2, 560, { size: 64, weight: 500, spacing: 0.06, color: IVORY, keys: ['《请理解我》'], keyColor: GOLD, alpha: a * smooth(prog(t, vs('B01') + 0.3, vs('B01') + 1)), glowKey: 0.5 });
  const ha = a * smooth(prog(t, vs('B01') + 0.9, vs('B01') + 1.6));
  if (ha > 0.003) { glow(ctx, W / 2 + 190, 880, 160, GOLD, 0.35 * ha); K.text(ctx, '医治者', W / 2 + 190, 905, { size: 80, weight: 700, color: [120, 74, 30], alpha: ha * u, align: 'center', spacing: 0.08 }); }
}

// B02：两个朋友中间裂开一道缝，她蹲下来用一根光线把缝一针针缝上，缝合处变成金线
function sceneB2(ctx, t, a) {
  X.back(ctx, t, { pool: [W / 2, 1255, 480] });
  const t0 = vs('B02'), tc = at('B02', '裂痕'), tm = at('B02', '修补'), tw = at('B02', '完整');
  ctx.save(); X.push(ctx, t, t0, ve('B02') + 0.5, 0.05);
  const crackU = smooth(prog(t, t0 + 0.2, tc + 0.3)), sew = smooth(prog(t, tm, tw)), heal = smooth(prog(t, tw - 0.2, tw + 0.8));
  const lx = 230, rx = 850;
  MB.person(ctx, 'enfp-female', lx, FY, 2.2, { a, slump: (1 - heal) * 0.5 * crackU, lean: -0.05 * crackU * (1 - heal) });
  MB.person(ctx, 'isfj-female', rx, FY, 2.2, { a, flip: true, slump: (1 - heal) * 0.5 * crackU, lean: 0.05 * crackU * (1 - heal) });
  // 地上的裂缝：从两人之间往前裂到镜头这边
  const pts = []; for (let i = 0; i <= 14; i++) { const v = i / 14; pts.push([W / 2 + Math.sin(i * 2.3) * 26 * (1 - v * 0.3), lerp(FY - 30, FY + 320, v)]); }
  const shown = pts.slice(0, Math.max(2, Math.ceil(crackU * pts.length)));
  ctx.save(); ctx.strokeStyle = 'rgba(8,10,12,0.95)'; ctx.lineWidth = 16; ctx.lineJoin = 'round'; ctx.beginPath(); shown.forEach(([x, y], i) => i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)); ctx.stroke(); ctx.restore();
  glowLine(ctx, shown, RED, a * 0.6 * (1 - heal), 2.4, 0.8);
  // 缝线：一针一针，缝过的地方变金
  const n = Math.floor(sew * 13);
  for (let i = 0; i < n; i++) { const [x, y] = pts[i + 1]; glowLine(ctx, [[x - 26, y - 10], [x + 26, y + 10]], GOLD, a * 0.95, 2.6, 0.8); }
  if (heal > 0) glowLine(ctx, pts, GOLD, a * heal, 3, 1);
  // 她蹲在缝旁边（缩小、身体往前倾），手跟着针脚往下走
  const cur = pts[Math.min(13, n + 1)];
  const o = infp(ctx, W / 2 - 150, FY + 90, 0.78, { a, t, lean: 0.12, nod: 0.8, ra: 0.9, la: 0.4, wind: false, eyes: heal > 0.5 ? 'happy' : 'open', flies: 1 });
  if (sew > 0 && sew < 1) glowLine(ctx, [o.rh, cur], LIME, a * 0.9, 1.8, 0.6);
  ctx.restore();
}

// B03：一百个小人排成方阵，只有一个是她
const TYPES = ['istj-male', 'isfj-female', 'estj-male', 'esfj-female', 'istp-male', 'isfp-male', 'estp-male', 'esfp-female', 'intj-male', 'intp-female', 'entj-female', 'entp-male', 'enfj-male', 'enfp-female', 'infj-female'];
function sceneB3(ctx, t, a) {
  X.back(ctx, t, { floor: 0.4, pool: null });
  const t0 = vs('B03'), tp = at('B03', '百分之一'), few = smooth(prog(t, tp - 0.2, tp + 0.6));
  ctx.save(); X.push(ctx, t, t0, ve('B03') + 0.6, 0.06, W / 2, 900);
  for (let r = 0; r < 10; r++) for (let c = 0; c < 10; c++) {
    const i = r * 10 + c, x = 150 + c * 87, y = 560 + r * 84, on = smooth(prog(t, t0 - 0.2 + i * 0.012, t0 + i * 0.012 + 0.3));
    if (i === 46) { infp(ctx, x, y + 34, 0.12 * on, { a, t, flies: 0, spin: t * 3 }); glow(ctx, x, y, 70, LIME, a * on * (0.3 + 0.5 * few)); L.shock(ctx, x, y, t, tp + 0.1, { r0: 10, r1: 200, dur: 1.1, c: LIME, a }); }
    else MB.person(ctx, TYPES[i % TYPES.length], x, y + 34, 0.32 * on, { a: a * lerp(0.9, 0.28, few), gray: few * 0.8 });
  }
  ctx.restore();
}
function overB3(ctx, t, a) {
  const tp = at('B03', '百分之一'), pa = a * smooth(prog(t, tp - 0.05, tp + 0.3)), pop = easeOut(prog(t, tp, tp + 0.4));
  if (pa <= 0.003) return;
  ctx.save(); ctx.translate(W / 2, 400); ctx.scale(0.7 + 0.3 * pop, 0.7 + 0.3 * pop);
  ctx.shadowColor = `rgba(${LIME.join(',')},${0.5 * pa})`; ctx.shadowBlur = 60;
  K.text(ctx, '1%', 0, 40, { size: 200, weight: 700, color: LIME, alpha: pa, align: 'center', spacing: 0.02 });
  ctx.restore();
}

// B04：人群散开，只剩她一个人站在很大的地上，远处天边亮着一座很高的光（心里很大的理想）
function sceneB4(ctx, t, a) {
  const t0 = vs('B04'), tl = at('B04', '理想'), tg = at('B04', '孤单');
  const mood = smooth(prog(t, tg - 0.6, tg + 0.8));
  X.back(ctx, t, { mood, pool: [W / 2, 1255, 220] });
  ctx.save(); X.push(ctx, t, t0, ve('B04') + 0.8, -0.05, W / 2, 900);
  // 远处的理想：天边一座高高的光塔
  const ia = a * smooth(prog(t, tl - 0.4, tl + 0.8));
  glow(ctx, W / 2 + 200, 640, 300, GOLD, 0.28 * ia);
  for (let i = 0; i < 7; i++) { const w = 70 - i * 8, y = 1030 - i * 62; ctx.save(); ctx.globalAlpha *= ia * 0.85; ctx.fillStyle = K.rgba(K.mix(GOLD, [255, 255, 240], i / 7), 0.6); ctx.fillRect(W / 2 + 200 - w / 2, y - 60, w, 58); ctx.restore(); }
  glow(ctx, W / 2 + 200, 560, 50, [255, 250, 220], ia);
  // 散开的人群
  const sc = smooth(prog(t, t0, t0 + 1.4));
  for (let i = 0; i < 18; i++) { const an = i / 18 * 6.283, d = 160 + sc * 900, x = W / 2 + Math.cos(an) * d, y = FY + Math.sin(an) * d * 0.15; MB.person(ctx, TYPES[i % TYPES.length], x, y, 0.9, { a: a * (1 - sc) * 0.8 }); }
  infp(ctx, W / 2 - 120, FY, 0.85, { a, t, look: [1, -1], tilt: -0.3, eyes: mood > 0.5 ? 'sad' : 'open', ra: 0.4, la: 0.3, spin: t * 0.2, flies: 1, dim: mood * 0.25 });
  ctx.restore();
}

// ================= C1：理想主义 / 堂吉诃德 / 心里的仗 / 内耗 =================
// C101-C102：她捧着一点光，把自己身上的光分给一路上的人（为相信的东西牺牲）
function sceneC1(ctx, t, a) {
  X.back(ctx, t, { pool: [W / 2, 1255, 420] });
  const t0 = vs('C101'), ts = at('C102', '牺牲'), tw = at('C101', '美好');
  ctx.save(); X.push(ctx, t, t0, ve('C102') + 0.6, 0.05);
  // 她心里的那个世界：头顶一片小小的花园、太阳、小房子（世界本该美好）
  const wa = a * smooth(prog(t, tw - 0.5, tw + 0.6));
  if (wa > 0.003) {
    const cx = W / 2, cy = 520;
    glow(ctx, cx, cy, 300, [200, 240, 160], 0.25 * wa);
    ctx.save(); ctx.globalAlpha *= wa; ctx.beginPath(); ctx.ellipse(cx, cy + 90, 260, 46, 0, 0, 6.283); ctx.fillStyle = 'rgba(120,190,120,0.7)'; ctx.fill(); ctx.restore();
    glow(ctx, cx + 120, cy - 70, 60, [255, 236, 170], wa);
    for (let i = 0; i < 9; i++) { const fx = cx - 200 + i * 50, fy = cy + 80 - 10 * Math.sin(i), h = 30 + 20 * hash(i); glowLine(ctx, [[fx, fy], [fx, fy - h]], [130, 210, 140], wa * 0.8, 2, 0.5); glow(ctx, fx, fy - h, 9, i % 2 ? PINK : GOLD, wa); }
    ctx.save(); ctx.globalAlpha *= wa; ctx.fillStyle = 'rgb(250,236,210)'; ctx.fillRect(cx - 60, cy + 10, 80, 64); ctx.fillStyle = 'rgb(220,120,110)'; ctx.beginPath(); ctx.moveTo(cx - 72, cy + 12); ctx.lineTo(cx - 20, cy - 34); ctx.lineTo(cx + 32, cy + 12); ctx.fill(); ctx.fillStyle = 'rgb(255,214,140)'; ctx.fillRect(cx - 40, cy + 30, 22, 22); ctx.restore();
  }
  // 牺牲：她胸口的光一颗颗分给身边三个灰暗的人，她自己暗一点，他们亮起来
  const gv = prog(t, ts - 0.6, ts + 2.2);
  const who = [['isfj-female', 150, FY + 40], ['istp-male', 900, FY + 30], ['esfp-female', 820, FY - 120]];
  who.forEach(([k, x, y], i) => { const lit = smooth(prog(gv, i * 0.25, i * 0.25 + 0.35)); MB.person(ctx, k, x, y, 1.5, { a, gray: 1 - lit, dim: 0.3 * (1 - lit), flip: x > W / 2 }); if (lit > 0) glow(ctx, x, y - 200, 90, GOLD, a * 0.35 * lit); });
  const give = smooth(prog(gv, 0, 1));
  const o = infp(ctx, W / 2 - 40, FY, 1.05, { a, t, eyes: give > 0.1 ? 'happy' : 'open', la: -0.4 * give, ra: -0.3 * give, spin: t * 0.8, dim: give * 0.3, look: [0, -1 + give] });
  glow(ctx, o.chest[0], o.chest[1], 80, GOLD, a * lerp(0.7, 0.25, give));
  who.forEach(([, x, y], i) => { const v = prog(gv, i * 0.25, i * 0.25 + 0.35); if (v > 0 && v < 1) { const px = lerp(o.chest[0], x, easeInOut(v)), py = lerp(o.chest[1], y - 200, easeInOut(v)) - Math.sin(v * Math.PI) * 120; glow(ctx, px, py, 26, GOLD, a); } });
  ctx.restore();
}
function overC1(ctx, t, a) { X.trait(ctx, '1', '理想主义', ['理想主义'], t, vs('C101') - 0.2, ve('C103') + 0.3, GOLD); }

// C103：童话里的王子公主 / 冲向风车的堂吉诃德：她把小风车举成长矛，冲向一座比她高十倍的大风车
function sceneC3(ctx, t, a) {
  X.back(ctx, t, { pool: [W / 2, 1255, 520] });
  const t0 = vs('C103'), tq = at('C103', '冲向'), run = easeIn(prog(t, tq - 0.2, ve('C103') + 0.6));
  ctx.save(); X.push(ctx, t, t0, ve('C103') + 0.6, 0.07, 800, 900);
  // 大风车：剪影 + 背光
  const mx = 820, my = 700;
  glow(ctx, mx, my, 480, [255, 210, 150], 0.25 * a);
  ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = 'rgb(20,26,30)';
  ctx.beginPath(); ctx.moveTo(mx - 70, my); ctx.lineTo(mx + 70, my); ctx.lineTo(mx + 120, FY); ctx.lineTo(mx - 120, FY); ctx.closePath(); ctx.fill();
  ctx.translate(mx, my - 10); ctx.rotate(t * 0.6);
  for (let i = 0; i < 4; i++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-18, -500, 36, 480); ctx.strokeStyle = 'rgba(255,220,170,0.25)'; ctx.lineWidth = 2; ctx.strokeRect(-60, -480, 42, 400); }
  ctx.restore();
  // 童话的小王冠先亮一下（王子公主）
  const ta = at('C103', '王子');
  const x = lerp(240, 560, run);
  const o = infp(ctx, x, FY, 0.95, { a, t, lean: 0.18 * smooth(prog(t, tq - 0.3, tq + 0.2)), ra: -1.25 * smooth(prog(t, tq - 0.4, tq)), la: 0.6, spin: t * (2 + run * 10), eyes: 'wide', mouth: 'o', flies: 1 });
  const cr = a * vis(t, ta - 0.1, tq + 0.2, 0.25, 0.3);
  if (cr > 0.003) { const [hx, hy] = o.top; ctx.save(); ctx.globalAlpha *= cr; ctx.fillStyle = 'rgb(246,214,140)'; ctx.beginPath(); ctx.moveTo(hx - 50, hy + 10); ctx.lineTo(hx - 56, hy - 34); ctx.lineTo(hx - 24, hy - 8); ctx.lineTo(hx, hy - 46); ctx.lineTo(hx + 24, hy - 8); ctx.lineTo(hx + 56, hy - 34); ctx.lineTo(hx + 50, hy + 10); ctx.closePath(); ctx.fill(); ctx.restore(); glow(ctx, hx, hy - 20, 90, GOLD, 0.4 * cr); }
  // 冲过去扬起的光尘
  for (let k = 0; k < 14; k++) { const v = (t * 1.6 + k / 14) % 1; glow(ctx, x - 60 - v * 260, FY - 10 - v * 40 * hash(k), 10 * (1 - v), LIME, a * run * (1 - v)); }
  ctx.restore();
}

// C104-C105：她表面笑着站在人群边上；胸口里，一团金光和一团暗红在打架；路过的人都没发现
function sceneC4(ctx, t, a) {
  X.back(ctx, t, { pool: [W / 2, 1255, 380] });
  const t0 = vs('C104'), tn = vs('C105');
  ctx.save(); X.push(ctx, t, t0, ve('C105') + 0.6, 0.1, W / 2, 820);
  // 路过的人
  for (let i = 0; i < 4; i++) { const v = ((t - t0) * 0.09 + i * 0.27) % 1, x = lerp(-120, W + 120, v), y = FY - 70 + (i % 2) * 25; MB.person(ctx, TYPES[(i * 4 + 2) % TYPES.length], x, y, 0.95, { a: a * 0.55, flip: i % 2 === 1, dim: 0.3 }); }
  const o = infp(ctx, W / 2, FY, 1.3, { a, t, eyes: 'happy', mouth: 'smile', spin: t * 0.4, la: 0.2, ra: 0.3, flies: 1 });
  // 胸口里的仗
  const [cx, cy] = o.chest, fight = smooth(prog(t, t0 + 0.3, t0 + 1.2)), hide = smooth(prog(t, tn, tn + 1.2));
  const r = 120 * fight * (1 - 0.5 * hide);
  if (r > 2) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 46; i++) {
      const side = i % 2, an = t * (side ? 2.4 : -2.1) + i * 0.7, rr = r * (0.3 + 0.7 * hash(i * 3)), x = cx + Math.cos(an) * rr, y = cy + Math.sin(an) * rr * 0.8;
      glow(ctx, x, y, 14 + 10 * hash(i), side ? GOLD : RED, a * 0.5 * fight * (1 - hide * 0.6));
    }
    // 两团光碰撞处的火花
    for (let k = 0; k < 6; k++) { const an = t * 7 + k, s = Math.abs(Math.sin(t * 9 + k)); glow(ctx, cx + Math.cos(an) * 20, cy + Math.sin(an) * 20, 8 + 14 * s, [255, 250, 230], a * fight * s * (1 - hide)); }
    ctx.restore();
  }
  ctx.restore();
}
function overC4(ctx, t, a) { X.trait(ctx, '2', '心里有一场仗', ['一场仗'], t, vs('C104') - 0.2, ve('C106') + 0.6, RED); }

// C106：她拿着手机，消息「在吗？」一直没发出去；头顶一个接一个冒出「对方可能的回复」，越长越多
const REPLIES = ['他会不会嫌我烦', '已读不回怎么办', '他回「哦」是什么意思', '要不明天再发', '他是不是在忙', '会不会太突然了', '算了，还是不发了'];
function sceneC6(ctx, t, a) {
  X.back(ctx, t, { pool: [W / 2, 1255, 380] });
  const t0 = vs('C106'), tb = at('C106', '一句话'), te = at('C106', '演完');
  ctx.save(); X.push(ctx, t, t0, DUR, 0.05);
  const o = infp(ctx, W / 2 - 120, FY, 1.25, { a, t, ra: -0.55, la: 0.2, wind: false, look: [0.6, -0.4], eyes: t > te ? 'wide' : 'open', mouth: t > te ? 'o' : 'flat', nod: 0.4, flies: 1 });
  // 手机
  const [px, py] = [o.rh[0] + 10, o.rh[1] - 40];
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(px, py); ctx.rotate(-0.12);
  ctx.fillStyle = 'rgb(30,34,40)'; ctx.beginPath(); ctx.roundRect(-46, -84, 92, 168, 14); ctx.fill();
  ctx.fillStyle = 'rgb(210,230,220)'; ctx.beginPath(); ctx.roundRect(-38, -72, 76, 144, 8); ctx.fill();
  ctx.fillStyle = 'rgb(120,200,150)'; ctx.beginPath(); ctx.roundRect(-30, 26, 54, 22, 8); ctx.fill();
  ctx.restore();
  glow(ctx, px, py, 120, [180, 240, 210], 0.2 * a);
  // 念头：从头顶一个接一个冒出来，越堆越多，前面的往上推
  const n = REPLIES.length, step = (te - tb + 0.6) / n;
  for (let i = 0; i < n; i++) {
    const ti = tb + i * step, u = easeOut(prog(t, ti, ti + 0.45)); if (u <= 0) continue;
    const age = Math.max(0, (t - ti) / step), side = i % 2 ? 1 : -1;
    const x = W / 2 + side * (190 + 50 * hash(i)), y = Math.max(450, o.head[1] - 110 - age * 70 - u * 20);
    bubbleT(ctx, REPLIES[i], x, y, a * u * clamp(1.3 - age * 0.3), i === n - 1 ? RED : IVORY);
    glowLine(ctx, [[o.head[0] + 20, o.head[1] - 60], [x, y + 30]], [200, 220, 210], a * u * 0.15, 1, 0.5);
  }
  ctx.restore();
}
function bubbleT(ctx, s, x, y, a, c) {
  if (a <= 0.003) return;
  const w = K.measure(ctx, s, { size: 40, weight: 500, spacing: 0.04 }) + 56, h = 72;
  ctx.save(); ctx.globalAlpha *= a;
  const g = ctx.createLinearGradient(0, y - h / 2, 0, y + h / 2); g.addColorStop(0, 'rgba(44,54,52,0.92)'); g.addColorStop(1, 'rgba(22,28,30,0.92)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = K.rgba(c === RED ? RED : LIME, 0.5); ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  L.rich(ctx, s, x, y + 14, { size: 40, weight: 500, spacing: 0.04, color: c, alpha: a, glowKey: 0.3 });
}
function overC6(ctx, t, a) { X.quote(ctx, '我会预先在脑内推演\n他的回复可能', t, at('C106', '演完') + 0.2, DUR + 1, { y: 300 }); }

// ================= 合成 =================
const SCENES = [
  { a: 0, b: vs('A03') + 0.1, draw: sceneA, over: overA },
  { a: vs('A03') - 0.2, b: vs('A04') + 0.1, draw: sceneA3, over: overA3 },
  { a: vs('A04') - 0.2, b: vs('A05') + 0.1, draw: sceneA4 },
  { a: vs('A05') - 0.2, b: vs('B01') + 0.1, draw: sceneA5, over: overA5 },
  { a: vs('B01') - 0.3, b: vs('B02') + 0.1, draw: sceneB1, over: overB1 },
  { a: vs('B02') - 0.2, b: vs('B03') + 0.1, draw: sceneB2 },
  { a: vs('B03') - 0.2, b: vs('B04') + 0.2, draw: sceneB3, over: overB3 },
  { a: vs('B04') - 0.1, b: vs('C101') + 0.1, draw: sceneB4 },
  { a: vs('C101') - 0.3, b: vs('C103') + 0.1, draw: sceneC1, over: overC1 },
  { a: vs('C103') - 0.2, b: vs('C104') + 0.1, draw: sceneC3, over: overC1 },
  { a: vs('C104') - 0.2, b: vs('C106') + 0.1, draw: sceneC4, over: overC4 },
  { a: vs('C106') - 0.2, b: FULL ? vs('C107') + 0.1 : DUR + 1, draw: sceneC6, over: (c, t, a) => { overC4(c, t, a); overC6(c, t, a); } },
];
if (FULL) {
  const P1 = { butterfly, headphones, ring, note, heart, bubbleT, TYPES };
  SCENES.push(...require('./PF2a')(P1), ...require('./PF2b')(P1, DUR));
}
// 背景只画一次：各镜调用 X.back 时只记下自己的参数，按当前最显眼的那一镜画
const realBack = X.back, LAST = {}; let curScene = -1;
X.back = (ctx, t, o = {}) => { LAST[curScene] = o; };
const STATE = {};
function draw(ctx, t) {
  let best = 0, ba = -1;
  SCENES.forEach((s, i) => { const a = vis(t, s.a, s.b, i ? 0.3 : 0, 0.3); if (a > ba) { ba = a; best = i; } });
  if (LAST[best] === undefined) { curScene = best; const c = new K.Canvas(8, 8).getContext('2d'); try { SCENES[best].draw(c, t, 0.001); } catch (e) {} }
  realBack(ctx, t, LAST[best] || {});
  SCENES.forEach((s, i) => {
    const a = vis(t, s.a, s.b, i ? 0.3 : 0, 0.3);
    if (a <= 0.003) { STATE[i] = null; return; }
    curScene = i; ctx.save(); STATE[i] = { a, st: s.draw(ctx, t, a) || {} }; ctx.restore();
  });
}
function over(ctx, t) {
  SCENES.forEach((s, i) => { if (STATE[i] && s.over) s.over(ctx, t, STATE[i].a, STATE[i].st); });
  X.front(ctx, t);
  subs(ctx, t);
}
module.exports = { DUR, draw, over, SCENES, SUBS: [], bloom: 0.2, vig: 0.62, parts: { butterfly, headphones, ring, note, heart, bubbleT, TYPES } };
