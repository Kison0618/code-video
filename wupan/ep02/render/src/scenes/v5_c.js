// 第二集 v5 · 米尔格拉姆 + 例子快速翻卡（016–022）
//   016 实验员白大褂背影 + 电压开关从左往右推到 450 V，26 / 40   017 “这段代码，今天还在到处跑”，代码卡四散
//   018 卡 1 瑞典假机长：驾驶舱窗口 + 13 年   019 卡 2 电视里的“神医”：苗医传人 → 换台 → 蒙医传人
//   020 卡 3 手机里的名医视频，扫描线扫过“AI 合成”   021–022 卡 4 电话听筒：假警察“我现在查你！”
// 真人（刘洪斌、张文宏）只用剪影，不画相貌
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const B = require('../brain');
const C = require('../card');
const U = require('./v5_util');
const RULE = 'IF 权威说 → 照做';
const L = TL.L, at = TL.at;
const pop = X.pop;

// ———— 016：米尔格拉姆 ————
const VOLTS = 30;                                          // 15 V 一档，共 30 个开关
function panel(ctx, x, y, n, t) {
  const w = 1120, h = 330;
  ctx.save(); ctx.translate(x, y);
  P.piece(ctx, P.poly([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]), '#4b3b2c', { blur: 22, dy: 12 });
  ctx.fillStyle = '#5b4836'; ctx.fillRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32);
  ctx.fillStyle = '#e9dcc0'; ctx.fillRect(-w / 2 + 40, -h / 2 + 34, w - 80, 70);
  const sw = (w - 120) / VOLTS;
  for (let k = 0; k < VOLTS; k++) {
    const cx = -w / 2 + 60 + sw * (k + 0.5), on = clamp(n - k), hot = k >= VOLTS - 3;
    // 刻度
    ctx.fillStyle = '#3a2d22'; ctx.fillRect(cx - 1.5, -h / 2 + 80, 3, k % 5 === 4 ? 22 : 12);
    if (k % 5 === 4 || k === 0) { ctx.font = '700 30px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String((k + 1) * 15), cx, -h / 2 + 72); }
    // 开关
    ctx.fillStyle = '#2a211a'; ctx.fillRect(cx - sw * 0.32, -10, sw * 0.64, 90);
    ctx.fillStyle = on > 0.5 ? (hot ? '#c8321f' : '#f4c63d') : '#cfc6b4';
    ctx.fillRect(cx - sw * 0.26, on > 0.5 ? 34 : -4, sw * 0.52, 40);
    if (on > 0.5) { ctx.save(); ctx.shadowColor = hot ? 'rgba(220,60,30,0.9)' : 'rgba(255,200,60,0.8)'; ctx.shadowBlur = 16; ctx.beginPath(); ctx.arc(cx, 112, 7, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
    else { ctx.fillStyle = '#3a2d22'; ctx.beginPath(); ctx.arc(cx, 112, 6, 0, Math.PI * 2); ctx.fill(); }
  }
  ctx.restore();
}
function s16(ctx, t) {
  const a = L('016').t0;
  Q.tag(ctx, 470, 150, '米尔格拉姆实验', pop(t, a), { size: 58, rot: -0.03, seed: 161 });
  // 实验员：白大褂背影（H02 剪影翻转，浅灰白）
  const e = easeOut(prog(t, a - 0.1, a + 0.6));
  U.putPart(ctx, 'H02', lerp(-300, 300, e), 1110, 560, [0.28, 0.0, 1.0, 0.5], { sil: true, flip: true, alpha: 0.95 });
  const tq = at('016', '请继续');
  C.bubble(ctx, { x: 560, y: 420, text: '请继续', size: 62, pop: pop(t, tq - 0.1, 0.4), tail: [400, 580] });
  // 电压：从“二十六个把电击”开始往右推，到“四百五十伏”推满
  const t0 = at('016', '把电击') - 0.2, t1 = at('016', '四百五十伏') + 0.4;
  const n = lerp(0, VOLTS, easeInOut(prog(t, t0, t1)));
  panel(ctx, 1270, 420, n, t);
  const tv = at('016', '四百五十伏');
  Q.tag(ctx, 1640, 160, '450 V', pop(t, tv), { size: 84, bg: Q.RUST, color: '#fbf3df', rot: 0.04, seed: 162, font: 'Num' });
  // 26 / 40
  const t40 = at('016', '四十个'), t26 = at('016', '二十六');
  const pv = pop(t, t40);
  if (pv > 0.01) {
    ctx.save(); ctx.globalAlpha = pv; ctx.font = '700 150px Num'; ctx.fillStyle = Q.INK; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('/ 40', 1290, 760); ctx.restore();
    X.roll(ctx, lerp(0, 26, easeOut(prog(t, t26 - 0.1, t26 + 0.6))), 1260, 760, 150, { color: Q.RUST, digits: 2 });
  }
}
// ———— 017：这段代码，今天还在到处跑 ————
const SPREAD = [[-640, -300], [620, -280], [-700, 230], [700, 260], [-120, 360], [180, -380]];
function s17(ctx, t) {
  const a = L('017').t0, tr = at('017', '到处跑');
  const sp = easeOut(prog(t, tr - 0.2, tr + 0.8));
  SPREAD.forEach(([dx, dy], k) => {
    const p = clamp(sp * 1.2 - k * 0.06); if (p <= 0.01) return;
    B.ruleCard(ctx, 960 + dx * easeOut(p), 470 + dy * easeOut(p), RULE, 42, { alpha: clamp(p * 2), rot: (k % 2 ? 0.08 : -0.07), seed: 170 + k });
  });
  X.popScale(ctx, 960, 470, pop(t, a - 0.1, 0.4), () => B.ruleCard(ctx, 0, 0, RULE, 66, { seed: 171 }));
  Q.tag(ctx, 960, 690, '今天还在到处跑', pop(t, at('017', '今天')), { size: 72, hl: true, rot: -0.02, seed: 172 });
}
// ———— 018–022：翻卡 ————
const CX = 960, CY = 470, CW = 1460, CH = 800;
function cardNo(ctx, n) {
  ctx.save(); ctx.fillStyle = Q.INK; ctx.beginPath(); ctx.arc(70, 70, 40, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fbf3df'; ctx.font = '700 50px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 70, 73); ctx.restore();
}
// 卡 1：驾驶舱窗口（深色剪纸框 + 两块天空玻璃）
function cockpit(ctx, x, y, s) {
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
  const frame = P.poly(P.jag([[-420, -230], [420, -230], [470, 210], [-470, 210]], 2, 16, 181));
  P.piece(ctx, frame, '#2e2722', { blur: 18, dy: 10 });
  const win = (pts, seed) => {
    const p = P.poly(P.jag(pts, 1.5, 14, seed));
    ctx.save(); ctx.clip(p);
    const g = ctx.createLinearGradient(0, -200, 0, 120); g.addColorStop(0, '#9fb7c4'); g.addColorStop(1, '#e6dcc4'); ctx.fillStyle = g; ctx.fillRect(-500, -260, 1000, 500);
    ctx.fillStyle = 'rgba(255,252,244,0.85)';
    [[-260, -60, 90], [-150, -40, 60], [160, -110, 80], [260, -90, 60], [40, 20, 50]].forEach(([cx, cy, r]) => { ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.8, r * 0.55, 0, 0, Math.PI * 2); ctx.fill(); });
    ctx.restore();
    ctx.strokeStyle = '#6d625a'; ctx.lineWidth = 5; ctx.stroke(p);
  };
  win([[-380, -190], [-25, -190], [-25, 120], [-410, 120]], 182);
  win([[25, -190], [380, -190], [410, 120], [25, 120]], 183);
  ctx.fillStyle = '#3c332c'; ctx.fillRect(-470, 150, 940, 70);
  ctx.fillStyle = '#c9b48c'; for (let k = 0; k < 9; k++) { ctx.beginPath(); ctx.arc(-360 + k * 90, 185, 16, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();
}
function f18(t) {
  return (ctx, w, h) => {
    cardNo(ctx, 1);
    cockpit(ctx, 520, 400, 0.95);
    Q.tag(ctx, 1110, 160, '瑞典', pop(t, at('018', '瑞典')), { size: 62, rot: -0.03, seed: 184 });
    Q.tag(ctx, 1110, 320, '伪造的资格', pop(t, at('018', '伪造')), { size: 60, rot: 0.02, seed: 185 });
    const p = pop(t, at('018', '十三年'));
    if (p > 0.01) { ctx.save(); ctx.globalAlpha = p; ctx.font = '700 190px Num'; ctx.fillStyle = Q.INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('13', 1060, 520); ctx.font = '900 80px Sans'; ctx.fillText('年', 1230, 545); ctx.restore(); }
    X.stamp(ctx, 1110, 680, '驾驶舱里被捕', prog(t, at('018', '被捕') - 0.15, at('018', '被捕') + 0.25), { size: 64, rot: -0.06, seed: 186, color: Q.RUST });
  };
}
// 卡 2：老电视（H06），屏幕里一个剪影 + 头衔字幕条；换台时闪雪花
const TV = { u0: 0.08, v0: 0.13, u1: 0.78, v1: 0.80 };     // H06 剪影框里屏幕的位置
function snow(ctx, x, y, w, h, seed) {
  const r = K.mulberry32(seed);
  for (let k = 0; k < 900; k++) { const v = r() * 255 | 0; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x + r() * w, y + r() * h, 3 + r() * 10, 2 + r() * 3); }
}
function f19(t) {
  return (ctx, w, h) => {
    cardNo(ctx, 2);
    const tx = 560, ty = 760, th = 620;
    Q.put(ctx, 'H06', tx, ty, th, { ar: 1.35 });
    const [ax, ay] = Q.ptOf('H06', tx, ty, th, TV.u0, TV.v0, { ar: 1.35 }), [bx, by] = Q.ptOf('H06', tx, ty, th, TV.u1, TV.v1, { ar: 1.35 });
    const sw = bx - ax, sh = by - ay;
    const tc = at('019', '换个台'), tm = at('019', '蒙医');
    ctx.save(); ctx.beginPath(); ctx.roundRect(ax + 10, ay + 10, sw - 20, sh - 20, 40); ctx.clip();
    ctx.fillStyle = '#d9d2c2'; ctx.fillRect(ax, ay, sw, sh);
    U.putPart(ctx, 'H02', ax + sw / 2, by + 10, sh * 0.85, U.UPPER, { sil: true, shadow: false });
    const label = t < tc + 0.3 ? '苗医传人' : '蒙医传人';
    const lp = t < tc + 0.3 ? pop(t, at('019', '苗医')) : pop(t, tm - 0.1);
    if (lp > 0.01) { ctx.globalAlpha = lp; ctx.fillStyle = t < tc + 0.3 ? '#2f4a63' : Q.RUST; ctx.fillRect(ax, by - 110, sw, 80); ctx.fillStyle = '#fbf3df'; ctx.font = '900 54px Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, ax + sw / 2, by - 68); ctx.globalAlpha = 1; }
    const sn = K.vis(t, tc, tc + 0.5, 0.05, 0.15);
    if (sn > 0.01) { ctx.globalAlpha = sn; ctx.fillStyle = '#777'; ctx.fillRect(ax, ay, sw, sh); snow(ctx, ax, ay, sw, sh, (t * 30) | 0); ctx.globalAlpha = 1; }
    ctx.restore();
    Q.tag(ctx, 1180, 160, '电视神医', pop(t, at('019', '电视神医')), { size: 62, rot: -0.03, seed: 191 });
    X.nameTag(ctx, 1180, 310, '刘洪斌', pop(t, at('019', '刘洪斌')));
    Q.tag(ctx, 1180, 460, '换个台', pop(t, tc), { size: 58, rot: 0.03, seed: 192 });
    const tz = at('019', '中医医师资格');
    X.stamp(ctx, 1180, 640, '无医师资格', prog(t, tz - 0.1, tz + 0.3), { size: 70, rot: -0.08, seed: 193, color: Q.RUST });
  };
}
// 卡 3：手机竖屏视频：剪影 + 名字条 + 蛋白棒；扫描线扫过，留下“AI 合成”
function f20(t) {
  return (ctx, w, h) => {
    cardNo(ctx, 3);
    const ts = at('020', '视频是'), sc = prog(t, ts - 0.1, at('020', '合成') + 0.2);
    U.phone(ctx, 520, 400, 380, 620, (c, sw, sh) => {
      c.fillStyle = '#c9c1b2'; c.fillRect(0, 0, sw, sh);
      const g = c.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, 'rgba(255,250,236,0.6)'); g.addColorStop(1, 'rgba(120,100,80,0.3)'); c.fillStyle = g; c.fillRect(0, 0, sw, sh);
      U.putPart(c, 'H02', sw / 2, sh + 10, sh * 0.75, U.UPPER, { sil: true, shadow: false });
      c.fillStyle = 'rgba(30,25,20,0.75)'; c.fillRect(0, sh - 120, sw, 70); c.fillStyle = '#fbf3df'; c.font = '700 40px Sans'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('张文宏', sw / 2, sh - 84);
      // 播放进度条
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(20, sh - 26, sw - 40, 6); c.fillStyle = '#f4c63d'; c.fillRect(20, sh - 26, (sw - 40) * prog(t, L('020').t0, L('020').t1), 6);
      if (sc > 0.01 && sc < 1) {
        const y = sh * sc; const gg = c.createLinearGradient(0, y - 60, 0, y + 6); gg.addColorStop(0, 'rgba(120,220,255,0)'); gg.addColorStop(1, 'rgba(120,220,255,0.75)');
        c.fillStyle = gg; c.fillRect(0, y - 60, sw, 66); c.fillStyle = 'rgba(200,245,255,0.95)'; c.fillRect(0, y, sw, 4);
      }
      if (sc > 0.01) { c.save(); c.beginPath(); c.rect(0, 0, sw, sh * sc); c.clip(); c.strokeStyle = 'rgba(80,180,220,0.25)'; c.lineWidth = 2; for (let yy = 0; yy < sh; yy += 10) { c.beginPath(); c.moveTo(0, yy); c.lineTo(sw, yy); c.stroke(); } c.restore(); }
    });
    Q.tag(ctx, 1130, 170, '“亲口”推荐？', pop(t, at('020', '亲口')), { size: 62, rot: -0.03, seed: 201 });
    Q.tag(ctx, 1130, 330, '蛋白棒', pop(t, at('020', '蛋白棒')), { size: 60, rot: 0.03, seed: 202 });
    X.stamp(ctx, 1130, 560, 'AI 合成', prog(t, at('020', '合成') - 0.1, at('020', '合成') + 0.3), { size: 110, rot: -0.08, seed: 203, color: Q.RUST, font: 'Sans' });
  };
}
// 卡 4：老电话听筒；假警察 vs 真警察；022 “我现在查你！”
function f21(t) {
  return (ctx, w, h) => {
    cardNo(ctx, 4);
    Q.put(ctx, 'G06', 400, 620, 440, { ar: 1.5 });
    Q.tag(ctx, 400, 140, '假警察', pop(t, at('021', '假警察')), { size: 66, bg: Q.INK, color: '#fbf3df', rot: -0.03, seed: 211 });
    Q.tag(ctx, 1120, 140, '真警察', pop(t, at('021', '真警察')), { size: 66, bg: '#2f4a63', color: '#fbf3df', rot: 0.03, seed: 212 });
    Q.tag(ctx, 1120, 290, '冲上门劝阻', pop(t, at('021', '冲上门')), { size: 56, rot: -0.02, seed: 213 });
    const t22 = L('022').t0, p = pop(t, t22 - 0.1, 0.3);
    if (p > 0.01) {
      const sh = Math.sin(t * 60) * 4 * (1 - prog(t, t22, t22 + 0.6));
      C.bubble(ctx, { x: 930 + sh, y: 560, text: '我现在查你！', size: 110, pop: p, shout: true, tail: [560, 520] });
    }
  };
}
const DECK = [['018', f18], ['019', f19], ['020', f20], ['021', f21]];
function deck(k) {
  return (ctx, t) => {
    const a = L(DECK[k][0]).t0 - 0.3;
    U.deckCard(ctx, CX, CY, CW, CH, prog(t, a, a + 0.4), k, DECK[k][1](t), { rot: k % 2 ? 0.006 : -0.006 });
  };
}

module.exports = {
  shots: [
    { a: L('016').t0 - 0.25, tr: 'slide', draw: s16, name: '016' },
    { a: L('017').t0 - 0.3, gl: 'fanye', draw: s17, name: '017' },
    ...DECK.map(([id], k) => ({ a: L(id).t0 - 0.3, tr: 'cut', draw: deck(k), name: id })),
  ],
};
U.stampAt('被捕', at('018', '被捕') - 0.15 + 0.4 / 1.4);
U.stampAt('无医师资格', at('019', '中医医师资格') - 0.1 + 0.4 / 1.4);
U.stampAt('AI 合成', at('020', '合成') - 0.1 + 0.4 / 1.4);
