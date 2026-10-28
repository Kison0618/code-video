// 故事二 026–033 · 经济学人订阅实验（干净界面 + 数据图）
//   镜头：① 026 艾瑞里 + 老电脑（屏幕里亮起订阅页，推进屏幕）② 027–028c 订阅页三张价格卡
//         ③ 028c 末–031 实验记录板：100 个小人 → 16 / 0 / 84 → 抽走印刷版 → 换一批 → 68 / 32
//         ④ 032 天平：网络版 vs 套餐（摇摆）→ 印刷版 vs 套餐（倒向套餐）⑤ 033 金句
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut, mulberry32 } = K;
const TL = require('../timeline');
const P = require('../paper');
const CUT = require('../cutout');
const KIT = require('../kit');
const S2 = require('../kit_story2');
const { INK, RED, GREEN, NAVY } = S2;

const L = TL.L;
// 句内关键词时刻（找不到关键词时直接报错，避免静默落到句首）
function at(id, w, nth = 0) {
  if (!L(id).text.includes(w)) throw new Error(`s6_story2: 句 ${id} 里没有「${w}」`);
  return TL.at(id, w, nth);
}
const T = id => L(id).t0;
const CARD_END = TL.CARDS[1][1], T_END = T('034');
const pop = (t, a, d = 0.35) => easeOut(prog(t, a, a + d));

// ———————————————— ① 026：艾瑞里 + 老电脑 ————————————————
const ARI = CUT.get('eng_ariely');
const PC = CUT.get('ph_computer', { photo: true, th: 244, rim: 7 });
const AX = 500, AY = 900, AH = 760;
const PX = 1350, PY = 930, PH = 800;
// 屏幕玻璃在剪影框里的位置（量过：u 0.148–0.833，v 0.092–0.548）
const SCR = (() => { const a = CUT.pt(PC, PX, PY, PH, 0.152, 0.098), b = CUT.pt(PC, PX, PY, PH, 0.829, 0.542); return { x0: a[0], y0: a[1], x1: b[0], y1: b[1], w: b[0] - a[0], h: b[1] - a[1], cx: (a[0] + b[0]) / 2, cy: (a[1] + b[1]) / 2 }; })();
const A26 = { pc: at('026', '有一次'), web: at('026', '经济学人'), ad: at('026', '订阅广告') };

function miniPage(ctx, t) {
  const on = smooth(prog(t, A26.web - 0.15, A26.web + 0.25));
  const ba = ctx.globalAlpha;                    // 跟着电脑一起淡入：下面的透明度都乘在它上面，否则电脑没出来屏幕先浮出一块残影
  ctx.save();
  ctx.beginPath(); ctx.roundRect(SCR.x0, SCR.y0, SCR.w, SCR.h, 26); ctx.clip();
  ctx.fillStyle = '#9aa1a8'; ctx.fillRect(SCR.x0, SCR.y0, SCR.w, SCR.h);
  if (on > 0.01) {
    ctx.globalAlpha = ba * on * (0.85 + 0.15 * Math.abs(Math.sin(t * 40)) * (1 - on) + 0.15 * on);
    ctx.fillStyle = '#f4efe4'; ctx.fillRect(SCR.x0, SCR.y0, SCR.w, SCR.h);
    const hh = SCR.h * 0.2;
    ctx.fillStyle = NAVY; ctx.fillRect(SCR.x0, SCR.y0, SCR.w, hh);
    ctx.fillStyle = '#f7efdc'; ctx.font = '700 40px Serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('经济学人 · 订阅', SCR.cx, SCR.y0 + hh / 2 + 4);
    // 订阅广告：三张小卡（看不清内容），念到"订阅广告"时弹出
    for (let k = 0; k < 3; k++) {
      const p = pop(t, A26.ad - 0.1 + k * 0.12, 0.3);
      S2.optionCard(ctx, SCR.cx + (k - 1) * SCR.w * 0.3, SCR.y0 + hh + (SCR.h - hh) * 0.52, { blank: true, alpha: clamp(p * 2), scale: 0.235 * (0.7 + 0.3 * p) });
    }
  }
  // 玻璃反光
  ctx.globalAlpha = ba;
  const g = ctx.createLinearGradient(SCR.x0, SCR.y0, SCR.x1, SCR.y1); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.4, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.1)');
  ctx.fillStyle = g; ctx.fillRect(SCR.x0, SCR.y0, SCR.w, SCR.h);
  ctx.restore();
  // 红圈圈住订阅广告
  const cp = prog(t, A26.ad + 0.35, A26.ad + 0.9);
  if (cp > 0) require('../card').circle(ctx, SCR.cx, SCR.y0 + SCR.h * 0.6, SCR.w * 0.52, SCR.h * 0.36, cp, RED, 8);
}
function shot26(ctx, t) {
  // 念到"订阅广告"之后推进屏幕（027 开口前 0.6 秒开始）
  const zp = easeIn(prog(t, T('027') - 0.6, T('027') + 0.05));
  ctx.save();
  if (zp > 0) {
    const z = lerp(1, W / SCR.w * 1.08, zp);
    ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-lerp(W / 2, SCR.cx, Math.min(1, zp * 1.6)), -lerp(H / 2, SCR.cy, Math.min(1, zp * 1.6)));
  }
  const ea = easeOut(prog(t, T('026') - 0.1, T('026') + 0.5));
  CUT.place(ctx, ARI, AX - (1 - ea) * 140, AY, AH, { alpha: clamp(ea * 1.5) });
  KIT.nameTag(ctx, AX, AY - 30, '经济学家 艾瑞里', pop(t, T('026') + 0.25));
  const ep = easeOut(prog(t, A26.pc - 0.15, A26.pc + 0.4));
  ctx.save(); ctx.translate((1 - ep) * 160, 0); ctx.globalAlpha *= clamp(ep * 1.5);
  CUT.place(ctx, PC, PX, PY, PH);
  miniPage(ctx, t);
  ctx.restore();
  ctx.restore();
}

// ———————————————— ② 027–028c：订阅页 ————————————————
const A27 = { web: at('027', '网络版'), print: at('027', '印刷版'), both: at('027', '印刷版加'), again: at('027', '还是') };
const A28 = { same: at('028', '同样'), two: at('028', '两样'), who: at('028', '谁会') };
const A28b = { nobody: at('028b', '没人要'), side: at('028b', '旁边'), deal: at('028b', '特别划算') };
const A28c = { useless: at('028c', '没用'), how: at('028c', '到底') };
const BX = 150, BY = 130, BW = 1620, BH = 810, CY = BY + 166 + (BH - 166) / 2, PRICE_Y = CY - 270 + 400;

function shotPage(ctx, t) {
  S2.browser(ctx, BX, BY, BW, BH, '经济学人 · 订阅');
  const k = easeInOut(prog(t, T('028') + 0.05, T('028') + 0.85));
  const shake = (a, d = 0.9) => { const u = prog(t, a, a + d); return u > 0 && u < 1 ? Math.sin(u * 40) * 0.035 * (1 - u) : 0; };
  const pw = pop(t, A27.web - 0.1), pp = pop(t, A27.print - 0.1), pb = pop(t, A27.both - 0.1);
  // 网络版：028 起退到左边变淡
  S2.optionCard(ctx, lerp(480, 230, k), CY, { name: '网络版', price: '$59', icon: 'web', alpha: clamp(pw * 2) * (1 - k), scale: (0.85 + 0.15 * pw) * (1 - 0.15 * k) });
  const hl = prog(t, A28.same, A28.same + 0.45);
  const glow = smooth(prog(t, A28b.deal - 0.15, A28b.deal + 0.35)) * (0.8 + 0.2 * Math.sin(t * 5));
  const xP = lerp(960, 640, k), xB = lerp(1440, 1280, k);
  S2.optionCard(ctx, xP, CY, { name: '印刷版', price: '$125', icon: 'print', alpha: clamp(pp * 2), scale: 0.85 + 0.15 * pp, hl, rot: shake(A28.who) });
  S2.optionCard(ctx, xB, CY, { name: '印刷版 + 网络版', price: '$125', icon: 'both', alpha: clamp(pb * 2), scale: 0.85 + 0.15 * pb, hl, glow, bump: prog(t, A27.again + 0.1, A27.again + 0.7) });
  // 028：同样的钱（=）、两样、问号
  if (k > 0.5) KIT.mark(ctx, 960, PRICE_Y + 6, 120, '=', smooth(prog(t, A28.same + 0.2, A28.same + 0.5)), INK);
  KIT.label(ctx, xB + 170, CY - 250, '两样', { pop: pop(t, A28.two - 0.05), alpha: 1 - smooth(prog(t, A28b.deal - 0.3, A28b.deal)), size: 52, color: RED, rot: 0.08, seed: 21 });
  KIT.mark(ctx, 960, CY - 90, 230, '?', smooth(prog(t, A28.who - 0.05, A28.who + 0.3)) * (1 - smooth(prog(t, A28b.nobody - 0.3, A28b.nobody))), RED);
  // 028b：没人要 → 箭头指向套餐 → 特别划算
  KIT.stamp(ctx, xP, CY - 135, '没人要', prog(t, A28b.nobody - 0.1, A28b.nobody + 0.35), { size: 92, rot: -0.16, seed: 23 });
  KIT.arrow(ctx, [xP + 160, CY - 60], [xB - 170, CY - 60], prog(t, A28b.side - 0.1, A28b.side + 0.5), RED, 12, -0.25);
  KIT.label(ctx, xB, CY - 300, '特别划算', { pop: pop(t, A28b.deal), size: 60, color: RED, bg: '#fff3c4', seed: 25 });
  // 028c：便签「没用？」
  S2.sticky(ctx, xP - 170, CY - 250, '没用？', prog(t, A28c.useless - 0.1, A28c.useless + 0.3), { size: 120, font: 80, rot: -0.12 });
}

// ———————————————— ③ 028c 末–031：实验记录板 + 100 个小人 ————————————————
const A29 = { hundred: at('029', '一百'), three: at('029', '三个') };
const A30 = { web: at('030', '网络版'), print: at('030', '印刷版'), both: at('030', '套餐') };
const A31 = { remove: at('031', '拿掉'), swap: at('031', '换另一批'), web: at('031', '网络版'), both: at('031', '套餐') };
const GS = 40, GR = 41, GY0 = 250, GH = 35;                   // 方阵：10×10，人高 32
const BASE = 852, BS = 40, BR = 50, BHh = 42;                  // 柱子：每行 10 人，人高 42
const COLX = [470, 960, 1450], COLN = ['网络版', '印刷版', '套餐'];
const gridPos = i => ({ x: 960 - 4.5 * GS + (i % 10) * GS, y: GY0 + Math.floor(i / 10) * GR, h: GH });
const slotPos = (col, k) => ({ x: COLX[col] - 4.5 * BS + (k % 10) * BS, y: BASE - Math.floor(k / 10) * BR, h: BHh });
const seg = (a, from, to, speed) => ({ a, b: a + Math.max(0.5, Math.hypot(to.x - from.x, to.y - from.y) / speed), from, to });

// 一批人：webPick(i) = 是否选网络版；sched = { enter, web, both, exit }
function batch(seed, color, webPick, sched) {
  const r = mulberry32(seed), ppl = [];
  for (let i = 0; i < 100; i++) {
    const g = gridPos(i), c = i % 10, row = Math.floor(i / 10);
    const enter = seg(sched.enter + (9 - c) * sched.colGap + row * 0.025 + r() * 0.05, { x: -70, y: g.y, h: GH }, g, sched.speed);
    ppl.push({ i, g, enter, web: webPick(i), segs: [enter], color, ph: r() * 6 });
  }
  const web = ppl.filter(p => p.web), both = ppl.filter(p => !p.web);
  const order = (a, b) => a.g.y - b.g.y || a.g.x - b.g.x;
  web.sort(order); both.sort(order);
  const go = (list, col, t0, gap) => list.forEach((p, k) => {
    const to = slotPos(col, k); p.slot = to; p.col = col;
    p.segs.push(seg(Math.max(t0 + k * gap, p.enter.b + 0.05), p.g, to, 620));
  });
  go(web, 0, sched.web, sched.webGap); go(both, 2, sched.both, sched.bothGap);
  if (sched.exit) ppl.forEach((p, k) => {
    const out = { x: p.slot.x + (p.col === 0 ? -260 : 260), y: p.slot.y, h: BHh };
    const q = seg(sched.exit + r() * 0.35, p.slot, out, 300); q.fade = true; p.segs.push(q);
    p.gone = true;
  });
  return ppl;
}
// 第一批：网络版 16 人（方阵最左两列的前 8 行），其余 84 人选套餐，印刷版 0 人
const B1 = batch(301, '#5a4a3c', i => i % 10 < 2 && Math.floor(i / 10) < 8,
  { enter: A29.hundred - 0.2, colGap: 0.11, speed: 640, web: A30.web, webGap: 0.05, both: A30.both - 0.35, bothGap: 0.011, exit: A31.swap });
// 第二批（印刷版已抽走）：网络版 68 人从左边、套餐 32 人从右边，沿地面直接走进各自的格子，两边同时开始填
const B2 = (() => {
  const r = mulberry32(302), ppl = [];
  const fill = (col, n, t0, t1, fromX) => {
    for (let k = 0; k < n; k++) {
      const to = slotPos(col, k), a = lerp(t0, t1, k / (n - 1)) + r() * 0.03;
      const q = { a, b: a + 0.55, from: { x: fromX, y: to.y, h: BHh }, to };
      ppl.push({ segs: [q], col, color: '#2f5d7c', ph: r() * 6 });
    }
  };
  fill(0, 68, A31.web - 0.35, A31.web + 1.25, -60);
  fill(2, 32, A31.web - 0.15, A31.both + 0.75, W + 60);
  return ppl;
})();
const arrived = (col, t) => B2.filter(p => p.col === col && t >= p.segs[0].b).length;

function drawPerson(ctx, p, t) {
  const s = p.segs; if (t < s[0].a) return;
  let x, y, h, walk = null, fade = 1;
  let k = s.findIndex(q => t < q.b);
  if (k < 0) { if (p.gone) return; const e = s[s.length - 1].to; x = e.x; y = e.y; h = e.h; }
  else if (t < s[k].a) { const e = s[k - 1].to; x = e.x; y = e.y; h = e.h; }
  else {
    const q = s[k], u = easeInOut(prog(t, q.a, q.b));
    x = lerp(q.from.x, q.to.x, u); y = lerp(q.from.y, q.to.y, u) - (q.fade ? 0 : Math.sin(u * Math.PI) * 18); h = lerp(q.from.h, q.to.h, u);
    if (q.fade) fade = 1 - smooth(prog(t, q.a, q.b));
    walk = (t - q.a) * 13 + p.ph;
  }
  const a = (x < 0 || x > W ? 0 : 1) * fade;
  KIT.person(ctx, x, y, h, p.color, walk, { alpha: a });
}

// 柱顶的数字：v 可以是小数（滚动），数字在已站满的那一行头顶上方
function count(ctx, col, v, a, o = {}) {
  if (a <= 0.01) return;
  const rows = v > 0.5 ? Math.ceil(v / 10 - 1e-6) : 0;
  const top = rows ? BASE - BHh - (rows - 1) * BR : BASE;
  const y = top - 62, cx = COLX[col];
  ctx.save(); ctx.globalAlpha *= a;
  const s = 1 + Math.sin(clamp(o.pop == null ? 1 : o.pop) * Math.PI) * 0.18;
  ctx.translate(cx, y); ctx.scale(s, s);
  KIT.roll(ctx, Math.round(Math.max(0, v)), 22, 0, 100, { digits: 2, color: o.color || INK });   // 整数逐个跳，不露半截字形
  ctx.font = '700 54px Sans'; ctx.fillStyle = o.color || INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText('人', 30, 4);
  ctx.restore();
  return { x: cx, y };
}
function colLabel(ctx, col, t, a, dy = 0, rot = 0) {
  if (a <= 0.01) return;
  ctx.save(); ctx.translate(0, dy); ctx.globalAlpha *= clamp(a * 1.4);
  ctx.strokeStyle = 'rgba(60,45,30,0.7)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(COLX[col] - 215 * a, BASE + 8); ctx.lineTo(COLX[col] + 215 * a, BASE + 8); ctx.stroke();
  KIT.label(ctx, COLX[col], BASE + 58, COLN[col], { pop: a, size: 48, bg: '#efe6d2', rot: -0.01 + rot, seed: 31 + col });
  ctx.restore();
}

function shotBoard(ctx, t) {
  const a0 = SHOTS[2].a;
  S2.board(ctx);
  // 标题「实验」手写
  const n = 2 * prog(t, a0 + 0.25, a0 + 0.95);
  KIT.write(ctx, '实验', 200, 300, 104, n, { color: '#a8371f', weight: 700, seed: 41, sloppy: 0.6 });
  const ul = prog(t, a0 + 0.95, a0 + 1.25);
  if (ul > 0) { ctx.save(); ctx.strokeStyle = '#a8371f'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(196, 326); ctx.lineTo(196 + 220 * easeOut(ul), 322); ctx.stroke(); ctx.restore(); }
  // 029：100 个学生
  KIT.label(ctx, 1380, 300, '100 个学生', { pop: pop(t, A29.hundred + 0.1), size: 56, alpha: 1 - smooth(prog(t, A30.web - 0.4, A30.web)), seed: 43 });
  // 三个选项（柱子底座 + 名称）；印刷版在 031 被抽走
  const rm = easeIn(prog(t, A31.remove - 0.05, A31.remove + 0.65));
  for (let c = 0; c < 3; c++) {
    const a = pop(t, A29.three - 0.1 + c * 0.15, 0.4);
    if (c === 1) { if (rm < 1) colLabel(ctx, 1, t, a * (1 - rm * 0.3), -rm * 1000, rm * 0.5); }
    else colLabel(ctx, c, t, a);
  }
  // 031：上一批的位置留成虚线框（16 / 84），新数字从旧数字滚过去
  const ghost = smooth(prog(t, A31.swap, A31.swap + 0.5));
  if (ghost > 0.01) {
    for (const [c, v] of [[0, 16], [2, 84]]) {
      const rows = Math.ceil(v / 10), top = BASE - BHh - (rows - 1) * BR - 14;
      S2.dashedRect(ctx, COLX[c] - 212, top, 424, BASE + 12 - top, 'rgba(90,74,60,0.6)', ghost);
      ctx.save(); ctx.globalAlpha *= ghost * 0.75; ctx.font = '700 40px Num'; ctx.fillStyle = '#8a7a6a'; ctx.textAlign = c === 0 ? 'right' : 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(String(v), c === 0 ? COLX[c] - 226 : COLX[c] + 226, top + 16); ctx.restore();
    }
  }
  // 小人
  for (const p of B1) drawPerson(ctx, p, t);
  for (const p of B2) drawPerson(ctx, p, t);
  // 数字：030 弹出 16 / 0 / 84；031 滚到 68 / 32
  const sw = t >= A31.swap + 0.2;
  if (!sw) {                                     // 旧一批离场后旧数字就收掉，只留虚线框旁的灰色 16 / 84
    count(ctx, 0, 16 * easeOut(prog(t, A30.web + 0.1, A30.web + 1.1)), pop(t, A30.web + 0.05, 0.3), { pop: prog(t, A30.web, A30.web + 0.5) });
    count(ctx, 2, 84 * easeOut(prog(t, A30.both - 0.05, A30.both + 1.1)), pop(t, A30.both - 0.1, 0.3), { pop: prog(t, A30.both, A30.both + 0.5) });
  } else {
    const nw = arrived(0, t), nb = arrived(2, t), fw = nw >= 68, fb = nb >= 32;
    const pw = nw ? count(ctx, 0, nw, 1, { color: GREEN, pop: fw ? prog(t, A31.web + 1.8, A31.web + 2.3) : 0 }) : null;
    const pb = nb ? count(ctx, 2, nb, 1, { color: RED, pop: fb ? prog(t, A31.both + 1.3, A31.both + 1.8) : 0 }) : null;
    if (fw) S2.tri(ctx, pw.x + 160, pw.y, 26, true, GREEN, prog(t, A31.web + 1.3, A31.web + 1.6));     // 站满后再对比旧值出 ▲ / ▼
    if (fb) S2.tri(ctx, pb.x + 160, pb.y, 26, false, RED, prog(t, A31.both + 0.8, A31.both + 1.1));
  }
  // 印刷版 0 人：抽走时一起飞走
  if (rm < 1) {
    ctx.save(); ctx.translate(COLX[1], -rm * 1000); ctx.rotate(rm * 0.5); ctx.translate(-COLX[1], 0);
    count(ctx, 1, 0, pop(t, A30.print, 0.3), { pop: prog(t, A30.print, A30.print + 0.5), color: '#8a7a6a' });
    ctx.restore();
  }
}

// ———————————————— ④ 032：天平 ————————————————
const A32 = { hard: at('032', '不好比'), swap: at('032', '可套餐'), same: at('032', '一个价'), cmp: at('032', '一比'), win: at('032', '套餐赚了') };
function chip(ctx, x, y, name, price, o = {}) {
  const w = 290, h = 190;
  ctx.save(); ctx.translate(x, y - h / 2); ctx.scale(o.sx == null ? 1 : o.sx, 1);
  ctx.shadowColor = 'rgba(40,28,14,0.3)'; ctx.shadowBlur = 16; ctx.shadowOffsetY = 6;
  ctx.fillStyle = '#fffdf8'; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 18); ctx.fill(); ctx.shadowColor = 'transparent';
  ctx.strokeStyle = o.glow ? '#d9a02a' : '#d8cdb8'; ctx.lineWidth = o.glow ? 6 : 3; ctx.stroke();
  ctx.fillStyle = NAVY; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, 16, [18, 18, 0, 0]); ctx.fill();
  ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  let sz = 46; ctx.font = `700 ${sz}px Sans`; while (ctx.measureText(name).width > w - 30) { sz -= 2; ctx.font = `700 ${sz}px Sans`; }
  ctx.fillText(name, 0, -30);
  if (o.hl > 0.01) { ctx.fillStyle = 'rgba(255,214,64,0.8)'; ctx.fillRect(-90, 22, 180 * easeOut(o.hl), 70); }
  ctx.fillStyle = INK; ctx.font = '700 84px Num'; ctx.fillText(price, 0, 58);
  ctx.restore();
}
function shotBalance(ctx, t) {
  const t0 = T('032');
  const wob = 0.13 * Math.sin((t - t0) * 3.4) * (1 - 0.4 * smooth(prog(t, A32.swap, A32.cmp)));
  const tilt = lerp(wob, 0.24, easeOut(prog(t, A32.cmp - 0.05, A32.cmp + 0.9)));
  const f = prog(t, A32.swap - 0.1, A32.swap + 0.4), sx = Math.max(0.02, Math.abs(Math.cos(f * Math.PI)));
  const hl = prog(t, A32.same, A32.same + 0.4), win = t > A32.win - 0.1;
  KIT.balance(ctx, 960, 935, 1.05, tilt,
    (c, x, y) => chip(c, x, y, f < 0.5 ? '网络版' : '印刷版', f < 0.5 ? '$59' : '$125', { sx, hl: f >= 0.5 ? hl : 0 }),
    (c, x, y) => chip(c, x, y, '印刷版 + 网络版', '$125', { hl, glow: win }));
  KIT.mark(ctx, 960, 360, 170, '?', smooth(prog(t, t0 - 0.05, t0 + 0.3)) * (1 - smooth(prog(t, A32.swap - 0.2, A32.swap + 0.1))), RED);
  const out = 1 - smooth(prog(t, A32.swap - 0.2, A32.swap + 0.1));
  KIT.label(ctx, 960, 205, '不好比', { pop: pop(t, A32.hard - 0.05), alpha: out, size: 64, seed: 51 });
  KIT.label(ctx, 960, 205, '一个价', { pop: pop(t, A32.same - 0.05), size: 64, seed: 52 });
  KIT.stamp(ctx, 1420, 360, '套餐赚了', prog(t, A32.win - 0.1, A32.win + 0.35), { size: 80, color: GREEN, rot: 0.1, seed: 53 });
}

// ———————————————— ⑤ 033：金句 ————————————————
const A33 = { l2: at('033', '是在选', 1), best: at('033', '最好比') };
function shotQuote(ctx, t) {
  const t0 = T('033');
  const p1 = easeOut(prog(t, t0, t0 + 0.45)), p2 = easeOut(prog(t, A33.l2 - 0.1, A33.l2 + 0.35));
  const line = (parts, y, size, p) => {
    if (p <= 0.01) return [];
    ctx.save(); ctx.globalAlpha *= clamp(p * 1.6); ctx.font = `900 ${size}px Serif`; ctx.textBaseline = 'alphabetic';
    const ws = parts.map(([s]) => ctx.measureText(s).width), tot = ws.reduce((a, b) => a + b, 0);
    let x = W / 2 - tot / 2; const boxes = [];
    ctx.translate(0, (1 - p) * 40);
    parts.forEach(([s, col], i) => { ctx.fillStyle = col; ctx.fillText(s, x, y); boxes.push([x, x + ws[i]]); x += ws[i]; });
    ctx.restore(); return boxes;
  };
  line([['不是选', INK], ['最好的', '#6b5a48'], ['，', INK]], 440, 128, p1);
  const b = line([['是选', INK], ['最好比的', RED]], 680, 168, p2);
  const u = prog(t, A33.best + 0.15, A33.best + 0.65);
  if (b.length && u > 0) {
    const [x0, x1] = b[1], pts = [];
    for (let k = 0; k <= 30; k++) { const s = k / 30; pts.push([lerp(x0 - 10, x1 + 14, s), 722 + Math.sin(s * 7) * 4 - s * 6]); }
    const q = K.partial(pts, easeOut(u));
    if (q.length > 1) { ctx.save(); ctx.strokeStyle = RED; ctx.lineWidth = 14; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const pt of q.slice(1)) ctx.lineTo(pt[0], pt[1]); ctx.stroke(); ctx.restore(); }
  }
  // 034 开口前淡回纸面，交给收尾
  const fo = smooth(prog(t, T_END - 0.45, T_END - 0.05));
  if (fo > 0) { ctx.fillStyle = P.BG; ctx.globalAlpha = fo; ctx.fillRect(0, 0, W, H); ctx.globalAlpha = 1; }
}

const SHOTS = [
  { a: CARD_END - 0.05, draw: shot26 },
  { a: T('027') - 0.08, draw: shotPage, tr: 'fade', d: 0.3 },
  { a: A28c.how - 0.15, draw: shotBoard, tr: 'slide' },
  { a: T('032') - 0.2, draw: shotBalance, tr: 'slide' },
  { a: T('033') - 0.15, draw: shotQuote, tr: 'up' },
];

module.exports = {
  t0: TL.CARD2_T0, t1: T_END,
  draw(ctx, t) {
    if (t < SHOTS[0].a || t >= T_END) return;
    KIT.shots(ctx, t, SHOTS);
  },
};
