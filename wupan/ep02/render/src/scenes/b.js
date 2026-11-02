// 故事二 013–018：衣架上的机长制服 →（撕纸）普鲁士军装 → 旧报纸版面上的福格特 → 市政厅 + 十个士兵 →
// 市长伸手要证件 → 横移到身后一排刺刀，空白证件框落下框住士兵（笑点）→ 市长被押走、钱箱、车票、小火车
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const L = TL.L, at = TL.at;
const pop = X.pop;

// 本段专用报头：保留正文底纹，不绘制原花体字。
function newspaper(ctx, alpha = 1) {
  ctx.save(); ctx.beginPath(); ctx.rect(0, 240, W, H - 240); ctx.clip();
  Q.newspaper(ctx, alpha); ctx.restore();
  ctx.save(); ctx.globalAlpha *= alpha;
  ctx.fillStyle = '#e8dbb9'; ctx.fillRect(0, 0, W, 240);
  ctx.fillStyle = Q.INK; ctx.fillRect(120, 70, W - 240, 8); ctx.fillRect(120, 220, W - 240, 3);
  ctx.font = '700 88px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText('1906', W / 2, 150); ctx.restore();
}

// 衣架（代码画）：挂钩在 (x,y)
function hanger(ctx, x, y) {
  ctx.save(); ctx.strokeStyle = '#5b4632'; ctx.lineWidth = 9; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.lineTo(x, y + 10); ctx.arc(x + 18, y + 10, 18, Math.PI, Math.PI * 1.9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 230, y + 130); ctx.lineTo(x, y + 40); ctx.lineTo(x + 230, y + 130); ctx.stroke();
  ctx.restore();
  ctx.save(); ctx.strokeStyle = 'rgba(90,70,50,0.6)'; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(0, y - 10); ctx.lineTo(W, y - 10); ctx.stroke(); ctx.restore();
}
// 013a：衣架上挂着机长制服
function s13a(ctx, t) {
  hanger(ctx, W / 2, 140);
  Q.put(ctx, 'G02', W / 2, 950, 760, { anchor: [0.5, 1], ar: 0.8, label: '机长制服' });
  Q.tag(ctx, 1500, 420, '嘴 + 制服', pop(t, at('013', '嘴加')), { size: 64, rot: 0.03 });
}
// 013b：同一个衣架，换成普鲁士上尉军装 + 尖顶盔；“只靠制服”标黄
function s13b(ctx, t) {
  hanger(ctx, W / 2, 140);
  Q.put(ctx, 'G11', W / 2, 980, 830, { ar: 0.62 });
  Q.tag(ctx, 1480, 560, '只靠制服', pop(t, at('013', '只靠')), { size: 72, hl: true, rot: -0.03 });
}
// 014：旧报纸版面做底。福格特肖像；依次：1906、牢墙刻痕“30 年”、鞋楦、军装挂“旧货”价签
function s14(ctx, t) {
  newspaper(ctx);
  const a = L('014').t0;
  Q.plate(ctx, 560, 560, 620, 780, (c, w, h) => { c.fillStyle = '#efe4c8'; c.fillRect(-w / 2, -h / 2, w, h); Q.put(c, 'G12', 0, h / 2 + 4, h * 0.98, { shadow: false, ar: 0.66 }); });
  Q.tag(ctx, 560, 230, '1906', pop(t, at('014', '一九')), { size: 80, font: 'Num', bg: Q.INK, color: '#fbf3df', rot: -0.03 });
  const ta = at('014', '三十多年');
  if (t > ta - 0.2) { const p = pop(t, ta - 0.2); ctx.save(); ctx.globalAlpha = clamp(p * 1.5); Q.tally(ctx, 1290, 330, (t - ta + 0.2) * 22, 0.9); ctx.restore(); Q.tag(ctx, 1570, 230, '30 年', pop(t, ta + 0.5), { size: 62, rot: 0.04 }); }
  const ts = at('014', '老鞋匠'); if (t > ts - 0.2) X.popScale(ctx, 1170, 690, pop(t, ts - 0.1), () => Q.put(ctx, 'G13', 1170, 800, 230, { ar: 1.5 }));
  const tj = at('014', '旧货商');
  if (t > tj - 0.2) { const p = pop(t, tj - 0.1); X.popScale(ctx, 1620, 640, p, () => Q.put(ctx, 'G11', 1620, 900, 520, { ar: 0.62 })); X.priceTag(ctx, 1730, 560, '旧货', { alpha: clamp((t - tj - 0.3) * 3), t, size: 54, s: 0.95 }); }
}
// 015：远景市政厅版画；上尉在前，士兵依次入画，头顶小数字 1→10；“十个士兵”“市政厅”标黄
function s15(ctx, t) {
  newspaper(ctx, 0.7);
  Q.put(ctx, 'G14', 1450, 560, 300, { ar: 1.5 });
  const a = L('015').t0 + 0.15, b = (L('015').t0 + L('015').t1) / 2;
  const march = easeInOut(prog(t, a, b));
  const SH = 310, sw = Q.wOf('G15', SH, 1.5), y0 = 1000;
  const x0 = lerp(-sw - 400, 240, march);
  const step = Math.sin((t - a) * 13) * 4 * (march < 1 ? 1 : 0);
  Q.put(ctx, 'G15', x0 + sw / 2, y0 + step, SH, { ar: 1.5 });
  Q.put(ctx, 'G12', x0 + sw + 180, y0 - step, 360, { ar: 0.66 });
  ctx.save(); ctx.fillStyle = Q.INK; ctx.font = '700 38px Num'; ctx.textAlign = 'center';
  for (let k = 0; k < 10; k++) ctx.fillText(String(k + 1), x0 + sw * (k + 0.55) / 10, y0 - SH - 20);
  ctx.restore();
  Q.tag(ctx, 640, 230, '皇帝的命令', pop(t, at('015', '皇帝')), { size: 56, rot: -0.03 });
  Q.tag(ctx, 640, 360, '十个士兵', pop(t, at('015', '十个')), { size: 66, hl: true, rot: 0.02 });
  Q.tag(ctx, 1450, 610, '市政厅', pop(t, at('015', '市政厅')), { size: 66, hl: true, rot: -0.02 });
}
// 016–017：一张宽景，镜头从市长横移到身后一排刺刀
//   左 → 右：士兵队列 ｜ 上尉侧影 ｜ 市长坐在桌后伸手。016 看右边，017 横移到左边
const PAN = W * 0.95;
function s16(ctx, t) {
  newspaper(ctx, 0.55);
  const p0 = L('017').t0 - 0.35, pan = easeInOut(prog(t, p0, p0 + 1.1));
  ctx.save(); ctx.translate(pan * PAN, 0);
  Q.put(ctx, 'G16', 1180, 1000, 720, { ar: 1.5 });
  Q.put(ctx, 'G12', 300, 1060, 760, { sil: true, flip: true, ar: 0.66 });
  Q.tag(ctx, 900, 330, '证件', pop(t, at('016', '证件')), { size: 66, rot: -0.03 });
  // 身后的一排刺刀（画外左边）
  const SH = 560, sw = Q.wOf('G15', SH, 1.5);
  Q.put(ctx, 'G15', -PAN + W / 2, 1010, SH, { ar: 1.5 });
  // 017：空白证件框落下，正好框住这排士兵；最后“盖章”
  const fa = at('017', '先拿'), q = easeIn(prog(t, fa, fa + 0.45));
  if (t > fa) Q.idFrame(ctx, -PAN + W / 2, lerp(-500, 650, q) + (q >= 1 ? Math.sin(clamp((t - fa - 0.45) * 6) * Math.PI) * -10 : 0), Math.min(sw + 40, 1500), 640, 1, { rot: 0.01 });
  const sa = L('017').t1 - 0.05;
  if (t > sa) X.stamp(ctx, -PAN + W / 2 + 560, 260, '证件', prog(t, sa, sa + 0.3), { size: 96, rot: -0.15, color: Q.RUST });
  ctx.restore();
}
// 018：市长被两名士兵押出画面（剪影）；钱箱、车票；远处小火车拖着烟横穿纸面
function s18(ctx, t) {
  newspaper(ctx, 0.55);
  const a = L('018').t0, e = easeIn(prog(t, a, a + 1.6));
  const gx = lerp(980, -700, e);
  Q.put(ctx, 'G15', gx - 330, 1000, 420, { sil: true, ar: 1.5, clip: c => { c.beginPath(); const cc = Q.cut('G15'); const bw = cc ? cc.box[2] - cc.box[0] : 1000; c.rect(cc ? cc.box[0] : 0, -1e4, bw * 0.21, 2e4); c.clip(); } });
  Q.put(ctx, 'G16', gx, 1000, 520, { sil: true, ar: 1.5, clip: c => { const cc = Q.cut('G16'); if (!cc) return; c.beginPath(); c.rect(-1e4, -1e4, 2e4, cc.box[1] + (cc.box[3] - cc.box[1]) * 0.66 + 1e4); c.clip(); } });
  const tm = at('018', '金库');
  X.popScale(ctx, 740, 760, pop(t, tm - 0.45), () => Q.put(ctx, 'G17', 0, 210, 460, { ar: 1.3 }));
  Q.tag(ctx, 740, 490, '几千马克', pop(t, at('018', '几千')), { size: 62, rot: -0.03 });
  Q.ticket(ctx, 1260, 800, pop(t, tm - 0.35), 0.14);
  // 车头朝左；从整车在画外右侧到整车离开左侧，句内完成穿行。
  const tr = prog(t, a + 0.55, L('018').t1 - 0.1);
  const th = 210, tw = Q.wOf('G18', th, 2);
  if (tr > 0 && tr < 1) Q.put(ctx, 'G18', lerp(W + tw / 2 + 30, -tw / 2 - 30, tr), 450, th, { ar: 2, flip: true });
}

module.exports = [
  { a: L('013').t0 - 0.25, tr: 'fade', draw: s13a, name: '013a' },
  { a: at('013', '有个') - 0.5, gl: 'sizhi', draw: s13b, name: '013b' },
  { a: L('014').t0 - 0.15, tr: 'slide', draw: s14, name: '014' },
  { a: L('015').t0 - 0.15, tr: 'slide', draw: s15, name: '015' },
  { a: L('016').t0 - 0.2, tr: 'slide', draw: s16, name: '016' },
  { a: L('018').t0 - 0.1, tr: 'fade', draw: s18, name: '018' },
];
