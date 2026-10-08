// 开场钩子（0–17.09 秒，前奏）
//  左：一句句往上推的文字。右：三段画面接力——
//   ① 收藏夹：逆袭故事、学习方法、自律技巧……数字往上滚，"已收藏 713 条"，然后"已执行 0 条"
//   ② 手机：信息流越刷越快，屏幕使用时间、已划过的条数
//   ③ 时间尺度：从 300 万年一路缩放到 20 年，智能手机 + 推荐算法这 13 年才终于看得见
//  16.2 秒曲子有一段空白：画面冻住、压暗，等片名砸进来
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeInOut, easeOutExpo, glow, hash, mulberry32, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const BG = require('../bg');
const { B } = A;

const T0 = 0, T1 = A.DROP, TF = 16.12;   // TF：冻结

// ① 收藏夹
const LIST = [
  [B(2), '逆袭故事', 128], [B(5), '学习方法', 96], [B(8), '自律技巧', 347],
  [B(9.4), '底层原理 · 系统优化 · 流程拆分', 59], [B(10.4), '目标规划 · 精力管理 · 深度思考', 83],
];
const PX = 1060, PY = 300, PW = 720;
function listPanel(ctx, t) {
  const a = smooth(prog(t, 0.6, 1.2)) * (1 - smooth(prog(t, 8.0, 8.6)));
  if (a <= 0) return;
  ctx.strokeStyle = rgba(C.line, a); ctx.lineWidth = 1; ctx.strokeRect(PX, PY - 60, PW, 520);
  UI.note(ctx, '~/收藏夹/2020', PX + 24, PY - 20, { size: 22, alpha: 0.9 * a });
  UI.note(ctx, 'BOOKMARKS', PX + PW - 24, PY - 20, { size: 18, alpha: 0.6 * a, align: 'right' });
  let total = 0;
  LIST.forEach(([t0, name, n], i) => {
    if (t < t0) return;
    const k = smooth(prog(t, t0, t0 + 0.3)) * a, y = PY + 50 + i * 68;
    text(ctx, '▸', PX + 26, y, { family: 'Mono', size: 24, color: C.gold, alpha: k, align: 'left' });
    text(ctx, name, PX + 62, y, { family: 'Song', size: i < 3 ? 32 : 24, color: C.bone, alpha: k, align: 'left' });
    const v = UI.rolling(ctx, t, t0, 1.1, 0, n, PX + PW - 70, y, { size: 28, alpha: k, color: C.gold });
    text(ctx, '条', PX + PW - 30, y, { family: 'Song', size: 22, color: C.dim, alpha: k });
    total += v;
    ctx.fillStyle = rgba(C.line, 0.6 * k); ctx.fillRect(PX + 24, y + 22, PW - 48, 1);
  });
  // 合计
  const yT = PY + 410;
  text(ctx, '已收藏', PX + 26, yT, { family: 'Song', size: 28, color: C.dim, alpha: a * smooth(prog(t, B(2), B(2) + 0.3)), align: 'left' });
  if (t > B(2)) text(ctx, String(total), PX + 140, yT + 2, { family: 'Mono', size: 44, color: C.white, alpha: a, align: 'left' });
  // "全部已读" 的金章
  if (t > B(11)) {
    const k = easeOutExpo(prog(t, B(11), B(11) + 0.3)), s = lerp(1.6, 1, k);
    ctx.save(); ctx.translate(PX + PW - 150, yT - 12); ctx.rotate(-0.08); ctx.scale(s, s);
    ctx.strokeStyle = rgba(C.gold, 0.9 * a * clamp(k * 2)); ctx.lineWidth = 2.5; ctx.strokeRect(-110, -30, 220, 56);
    text(ctx, '✓ 全部已读', 0, 10, { family: 'Song', size: 30, weight: 700, color: C.gold, alpha: a * clamp(k * 2) });
    ctx.restore();
  }
  // "已执行 0 条"
  if (t > B(14)) {
    const k = smooth(prog(t, B(14), B(14) + 0.25)) * a;
    text(ctx, '已执行', PX + 26, yT + 64, { family: 'Song', size: 28, color: C.dim, alpha: k, align: 'left' });
    text(ctx, '0', PX + 140, yT + 68, { family: 'Mono', size: 44, color: C.red, alpha: k, align: 'left' });
    glow(ctx, PX + 152, yT + 52, 60, C.red, 0.3 * k);
  }
  // 飞进收藏夹的小卡片
  const r = mulberry32(3);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 46; i++) {
    const ts = 1.0 + r() * 6.0, sx = 900 + r() * 200, sy = r() * H, ty = PY + 50 + Math.floor(r() * 5) * 68;
    const u = (t - ts) / 0.9;
    if (u < 0 || u > 1) continue;
    const e = easeInOut(u), x = lerp(sx, PX + PW - 120, e), y = lerp(sy, ty, e) - Math.sin(u * Math.PI) * 80;
    ctx.fillStyle = rgba(C.gold, 0.5 * (1 - u) * a); ctx.fillRect(x - 9, y - 6, 18, 12);
  }
  ctx.restore();
}

// ② 手机信息流
const FEED = ['沙雕视频 · 第 1284 条', '漂亮姐姐 · 跳舞', '马老师 · 闪电五连鞭', '成华大道 · 二仙桥', '月入十万的一天',
  '逆袭清北 · 学霸的一天', '猫 · 第 37 条', '极光 · 海岛 · 温泉', '3 分钟看完一部电影', '这个技巧没人告诉你', '他 25 岁财务自由', '再看最后一条'];
const FX0 = 1420, FY0 = 560, FW = 400, FH = 780;
const TA = 8.2;
function scrollAt(t) {
  let s = 0;
  const n = Math.max(0, Math.round((t - TA) * 120));
  for (let i = 0; i < n; i++) { const u = TA + i / 120; s += (220 + 3400 * Math.pow(smooth(prog(u, 8.8, 11.4)), 1.5)) / 120; }
  return s;
}
function phone(ctx, t) {
  const ain = easeOutExpo(prog(t, TA, TA + 0.6)), aout = smooth(prog(t, 11.1, 11.7));
  const a = ain * (1 - aout);
  if (a <= 0) return;
  const dy = (1 - ain) * 300 + aout * -60, sc = 1 - 0.15 * aout;
  ctx.save();
  ctx.translate(FX0, FY0 + dy); ctx.scale(sc, sc);
  glow(ctx, 0, 0, 760, C.cyan, 0.16 * a);
  // 机身
  ctx.fillStyle = rgba([14, 16, 22], a); ctx.beginPath(); ctx.roundRect(-FW / 2 - 14, -FH / 2 - 14, FW + 28, FH + 28, 54); ctx.fill();
  ctx.strokeStyle = rgba(C.gray, 0.6 * a); ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.beginPath(); ctx.roundRect(-FW / 2, -FH / 2, FW, FH, 42); ctx.clip();
  ctx.fillStyle = rgba([10, 14, 22], a); ctx.fillRect(-FW / 2, -FH / 2, FW, FH);
  const s = scrollAt(t), CH = 270, v = (scrollAt(t + 1 / 60) - s) * 60;
  const blur = clamp((v - 600) / 2500);
  const first = Math.floor(s / CH);
  for (let k = first - 1; k < first + 5; k++) {
    const y = -FH / 2 + 70 + k * CH - s;
    for (let g = blur > 0.05 ? 3 : 0; g >= 0; g--) {
      const yy = y - g * blur * 40, ga = g ? 0.22 * blur : 1;
      const h1 = hash(k * 3.1), h2 = hash(k * 7.7);
      const c1 = [[60, 120, 200], [200, 90, 140], [230, 160, 70], [80, 180, 160], [150, 100, 220]][Math.floor(h1 * 5)];
      const gr = ctx.createLinearGradient(-FW / 2, yy, FW / 2, yy + 180);
      gr.addColorStop(0, rgba(c1, 0.75 * a * ga)); gr.addColorStop(1, rgba(mix(c1, [10, 10, 20], 0.7), 0.75 * a * ga));
      ctx.fillStyle = gr; ctx.beginPath(); ctx.roundRect(-FW / 2 + 16, yy, FW - 32, 180, 14); ctx.fill();
      // 播放键
      ctx.fillStyle = rgba(C.white, 0.5 * a * ga); ctx.beginPath(); ctx.moveTo(-12, yy + 72); ctx.lineTo(18, yy + 90); ctx.lineTo(-12, yy + 108); ctx.fill();
      text(ctx, FEED[((k % FEED.length) + FEED.length) % FEED.length], -FW / 2 + 22, yy + 222, { family: 'Song', size: 24, color: C.bone, alpha: a * ga, align: 'left' });
      text(ctx, '♥ ' + (1 + h2 * 90).toFixed(1) + 'w', FW / 2 - 22, yy + 222, { family: 'Mono', size: 18, color: C.dim, alpha: a * ga, align: 'right' });
    }
  }
  // 状态栏
  ctx.fillStyle = rgba([10, 14, 22], 0.9 * a); ctx.fillRect(-FW / 2, -FH / 2, FW, 56);
  text(ctx, '02:47', -FW / 2 + 40, -FH / 2 + 38, { family: 'Mono', size: 20, color: C.bone, alpha: a, align: 'left' });
  text(ctx, '推荐', 0, -FH / 2 + 40, { family: 'Song', size: 24, weight: 700, color: C.white, alpha: a });
  ctx.restore();
  ctx.restore();
  // 计数器
  const ka = a;
  const secs = Math.floor(4 * 3600 + 37 * 60 + 12 + Math.max(0, s / 9));
  const hh = String(Math.floor(secs / 3600)).padStart(2, '0'), mm = String(Math.floor(secs / 60) % 60).padStart(2, '0'), ss = String(secs % 60).padStart(2, '0');
  UI.note(ctx, '屏幕使用时间', 1680, 380, { size: 20, alpha: ka });
  text(ctx, `${hh}:${mm}:${ss}`, 1680, 424, { family: 'Mono', size: 34, color: C.cyan, alpha: ka, align: 'left' });
  UI.note(ctx, '已划过', 1680, 500, { size: 20, alpha: ka });
  text(ctx, (1284 + Math.floor(s / CH)).toLocaleString('en-US') + ' 条', 1680, 544, { family: 'Mono', size: 34, color: C.cyan, alpha: ka, align: 'left' });
}

// ③ 时间尺度
const ZA = B(22.6), ZB = B(27.6);
function fmtSpan(S) { return S >= 1e4 ? (S / 1e4).toFixed(S >= 1e5 ? 0 : 1) + ' 万年' : Math.round(S) + ' 年'; }
function timeline(ctx, t) {
  const a = smooth(prog(t, 11.3, 11.9));
  if (a <= 0) return;
  const X0 = 1020, X1 = 1800, Y = 640;
  const u = easeInOut(prog(t, ZA, ZB));
  const S = Math.exp(lerp(Math.log(3e6), Math.log(16), u));
  const xOf = yr => X1 - (2020 - yr) / S * (X1 - X0);
  // 两个版本标签
  const ta = smooth(prog(t, 11.5, 12.0)) * a;
  text(ctx, '大脑', X0, 420, { family: 'Song', size: 34, weight: 700, color: C.gold, alpha: ta, align: 'left' });
  UI.note(ctx, '上次大版本更新：几百万年前', X0, 460, { size: 20, color: C.gold, alpha: 0.85 * ta });
  text(ctx, '推荐算法', X1, 420, { family: 'Song', size: 34, weight: 700, color: C.cyan, alpha: ta, align: 'right' });
  UI.note(ctx, '上次更新：今天', X1, 460, { size: 20, color: C.cyan, alpha: 0.85 * ta, align: 'right' });
  // 轴
  ctx.strokeStyle = rgba(C.dim, 0.8 * a); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(X0, Y); ctx.lineTo(X1, Y); ctx.stroke();
  const raw = S / 5, p10 = Math.pow(10, Math.floor(Math.log10(raw))), step = [1, 2, 5, 10].map(m => m * p10).find(v => v >= raw);
  for (let yr = 2020; yr >= 2020 - S - 1e-6; yr -= step) {
    const x = xOf(yr);
    ctx.fillStyle = rgba(C.dim, 0.7 * a); ctx.fillRect(x, Y, 1, 12);
    const ago = 2020 - yr;
    const lab = ago === 0 ? '2020' : ago >= 1e4 ? (ago / 1e4) + '万年前' : step >= 1 && ago < 200 ? String(Math.round(yr)) : ago + '年前';
    if (x > X0 - 2) UI.note(ctx, lab, x, Y + 40, { size: 18, alpha: 0.75 * a, align: 'center' });
  }
  // 智能手机 + 推荐算法：2007–2020
  const x7 = Math.max(X0, xOf(2007));
  ctx.fillStyle = rgba(C.cyan, 0.85 * a); ctx.fillRect(x7, Y - 26, Math.max(2, X1 - x7), 26);
  glow(ctx, X1, Y - 13, 40 + (X1 - x7) * 0.5, C.cyan, 0.25 * a);
  const w = X1 - x7, lk = smooth(prog(w, 40, 140)) * a;
  text(ctx, '智能手机 + 推荐算法', (x7 + X1) / 2, Y - 44, { family: 'Song', size: 28, color: C.cyan, alpha: lk });
  [[2007, 'iPhone'], [2012, '今日头条'], [2016, '抖音']].forEach(([yr, nm]) => {
    const x = xOf(yr); if (x < X0) return;
    ctx.fillStyle = rgba(C.white, 0.8 * lk); ctx.fillRect(x - 1, Y - 34, 2, 42);
    UI.note(ctx, nm, x, Y + 74, { size: 18, color: C.cyan, alpha: lk, align: 'center' });
  });
  // 窗口读数
  UI.note(ctx, 'TIME SCALE · 时间窗口', X0, 530, { size: 18, alpha: 0.8 * a });
  text(ctx, fmtSpan(S), X0 + 300, 532, { family: 'Mono', size: 26, color: C.bone, alpha: a, align: 'left' });
  // 比例
  const rk = smooth(prog(t, ZB - 0.1, ZB + 0.4)) * a;
  text(ctx, '13 年 ÷ 几百万年 ≈ 0.0004%', (X0 + X1) / 2, 800, { family: 'Mono', size: 28, color: C.white, alpha: rk });
}

function draw(ctx, t) {
  const tf = Math.min(t, TF);               // 冻结后画面停住
  listPanel(ctx, tf);
  phone(ctx, tf);
  timeline(ctx, tf);
  const ON = { clear: null };
  T.stack(ctx, t, [
    { t: 0.32, s: '2020 年。', fx: 'decode', size: 92, color: C.gold, cps: 10 },
    { t: B(2), s: '我听了很多逆袭故事，' },
    { t: B(5), s: '看了很多学习方法，' },
    { t: B(8), s: '收藏了一堆自律技巧。' },
    { t: B(11), s: '道理，我全都懂。', fx: 'slam', size: 78, hl: { '全都懂': C.gold }, en: 'I knew every principle.' },
  ], { x: 130, y: 640, clear: B(14) - 0.3 });
  T.stack(ctx, t, [
    { t: B(14), s: '但是，多少次午夜梦回——', color: C.gray },
    { t: B(17), s: '我还是掏出了手机。', fx: 'slam', size: 78, hl: { '手机': C.cyan }, en: 'And still, I reached for my phone.' },
  ], { x: 130, y: 640, clear: B(21) - 0.3 });
  T.stack(ctx, t, [
    { t: B(21), s: '不是你不够自律。', fx: 'slam', size: 78, en: "It's not that you lack discipline." },
    { t: B(23), s: '是你的大脑，' },
    { t: B(25), s: '还停在几百万年前。', hl: { '几百万年前': C.gold } },
    { t: B(28), s: '这是一场降维打击。', fx: 'glitch', size: 80, color: C.white, settle: 0.6, en: 'A fight you were never built to win.' },
  ], { x: 130, y: 660, clear: T1 + 0.3 });
  // 冻结：压暗
  if (t > TF) { ctx.fillStyle = `rgba(0,0,0,${0.45 * smooth(prog(t, TF, TF + 0.3))})`; ctx.fillRect(0, 0, W, H); }
}
function bg(t) { return { cold: smooth(prog(t, 8.2, 9)) * (1 - smooth(prog(t, 11.2, 12))) }; }
module.exports = { draw, bg, t0: T0, t1: T1 };
