// 第二个光标的设计板（设计稿 v5 第 7 节第 1 步）：node src/tools/cursor_board.js out.png
'use strict';
const K = require('../core');
const { Actor2 } = require('../acting');
const PR = require('../props');

const CW = 960, CH = 540, COLS = 3, ROWS = 4, SC = 0.62, GY = 440, HH = 300;
const cv = new K.Canvas(CW * COLS, CH * ROWS), ctx = cv.getContext('2d');
ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
const hero = new Actor2({ H: HH, x0: 0, dir: -1, noise: 0 }); hero.simulate(0.6, { sfx: false });
const scared = new Actor2({ H: HH, x0: 0, dir: -1, noise: 0 }); scared.lean(0, -24).head(0, -20).hand('F', 0, 'local', [0.14, -0.18]).hand('B', 0, 'local', [0.1, -0.14]).foot('B', 0, [0.12 * HH, 0], 0); scared.simulate(0.6, { sfx: false });
function cell(c, r, title, fn, scale = SC) {
  ctx.save(); ctx.beginPath(); ctx.rect(c * CW, r * CH, CW, CH); ctx.clip();
  ctx.translate(c * CW + CW / 2, r * CH + GY); ctx.scale(scale, scale);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2 / scale; ctx.beginPath(); ctx.moveTo(-CW / scale, 0); ctx.lineTo(CW / scale, 0); ctx.stroke();
  fn(); ctx.restore();
  ctx.save(); ctx.font = '28px SC'; ctx.fillStyle = '#ffd84a'; ctx.fillText(title, c * CW + 18, r * CH + 40);
  ctx.strokeStyle = '#333'; ctx.strokeRect(c * CW + 0.5, r * CH + 0.5, CW - 1, CH - 1); ctx.restore();
}
const heroAt = (x, a = hero) => { ctx.save(); ctx.translate(x, 0); a.draw(ctx, 0.5); ctx.restore(); };
// 光标：下划线（w 宽），或实心方块；在地上时脚下有一个小影子
function cursor(x, y, w, o = {}) {
  ctx.save();
  if (o.glow) { const g = ctx.createRadialGradient(x, y, 0, x, y, w * 1.2); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x - w * 1.3, y - w * 1.3, w * 2.6, w * 2.6); }
  ctx.fillStyle = `rgba(245,245,245,${o.a ?? 1})`;
  if (o.block) ctx.fillRect(x - w / 2, y - w * 1.25, w, w * 1.25);
  else { ctx.translate(x, y); ctx.rotate(o.tilt || 0); ctx.fillRect(-w / 2, -Math.max(6, w * 0.13), w, Math.max(6, w * 0.13)); }
  ctx.restore();
  if (o.ground) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.ellipse(x, 2, w * 0.55, 6, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
}
const codeLine = (x, y, s, size = 46, hl) => {
  ctx.save(); ctx.font = `400 ${size}px Code`; const cw = size * 0.5;
  if (hl) { ctx.fillStyle = 'rgb(38,79,120)'; ctx.fillRect(x + hl[0] * cw - 2, y - size * 0.85, (hl[1] - hl[0]) * cw + 4, size * 1.1); }
  ctx.fillStyle = 'rgb(220,220,220)'; ctx.fillText(s, x, y); ctx.restore(); return cw;
};
const snake = (x, n, o = {}) => { for (let k = 0; k < n; k++) { const sx = x - k * 62; if (o.hl === k) { ctx.fillStyle = 'rgb(38,79,120)'; ctx.fillRect(sx - 32, -62, 64, 46); } PR.word(ctx, o.part && o.part[k] !== undefined ? o.part[k] : 'hi', sx, -38, 0, 46); } };
// 闪烁时间线：一排小格子，亮 = 白
const blinkBar = (x, y, pattern, label) => { ctx.save(); ctx.font = '26px SC'; ctx.fillStyle = '#aaa'; ctx.fillText(label, x, y - 14); for (let i = 0; i < pattern.length; i++) { ctx.fillStyle = pattern[i] === '1' ? '#f5f5f5' : '#222'; ctx.fillRect(x + i * 22, y, 18, 18); } ctx.restore(); };

// 第 1 行：两个光标、普通、长大
cell(0, 0, '两个光标：形状一样，闪的节奏不一样', () => {
  const cw = codeLine(-560, -330, 'while n < 5:', 46); cursor(-560 + 12.5 * cw, -330 + 8, cw * 0.9);
  codeLine(-560, -250, '    print("hi")', 46); cursor(-560 + 7.5 * cw, -250 + 8, cw * 0.9, { tilt: 0.12 });
  blinkBar(-560, -170, '111110000011111000001111100000', '他的：0.5 秒亮 / 0.5 秒灭');
  blinkBar(-560, -80, '110001111100100011110011000001', '它的：不规则');
  heroAt(400);
});
cell(1, 0, '普通光标：跳到地上，一个字那么宽', () => { cursor(-120, -4, 0.15 * HH, { ground: true }); snake(-260, 3); heroAt(260); });
cell(2, 0, '长大：吃了字之后变成横梁（0.5H → 1.5H）', () => { cursor(-200, -4, 1.0 * HH, { ground: true }); heroAt(330); });
// 第 2 行：分身、方块、方块覆盖代码
cell(0, 1, '分身：Ctrl+V 粘贴出一排自己', () => { for (let k = 0; k < 7; k++) cursor(-560 + k * 110, -4 - (k % 2) * 30, 0.3 * HH, { ground: true }); PR.keyCombo(ctx, 1, { at: [-250, -300], size: 60, keys: [{ label: 'Ctrl', t: 0 }, { label: 'V', t: 0.2 }], t1: 5 }); heroAt(380); });
cell(1, 1, 'Boss：按 Insert，变成实心方块 █（3H）', () => { cursor(-120, 0, 2.4 * HH, { block: true }); heroAt(360); }, 0.36);
cell(2, 1, '覆盖：走过的字都变成 █', () => { const cw = codeLine(-520, -260, 'def combo(n):', 46); ctx.fillStyle = '#f5f5f5'; for (let i = 0; i < 6; i++) ctx.fillRect(-520 + i * cw + 2, -260 - 40, cw - 4, 48); cursor(-520 + 6.5 * cw, -260 + 8, cw, { block: true }); heroAt(330); });
// 第 3、4 行：表演词汇
cell(0, 2, '盯住：停止闪烁、常亮 10 帧（四周全静）', () => { cursor(-150, -4, 0.3 * HH, { ground: true, glow: true }); heroAt(300); });
cell(1, 2, '瞄准：先高亮（4–6 帧）……', () => { cursor(-30, -4, 0.3 * HH, { ground: true }); snake(-200, 3, { hl: 2 }); heroAt(330); });
cell(2, 2, '……再退格：一个字一个字消失，它长大一点', () => { cursor(-160, -4, 0.38 * HH, { ground: true }); snake(-200, 3, { part: { 2: 'h' } }); heroAt(330); });
cell(0, 3, '说话：自己打字，小字挂在头顶', () => { cursor(-150, -4, 0.3 * HH, { ground: true }); PR.word(ctx, 'no', -150, -70, 0, 34); heroAt(300); });
cell(1, 3, '得意：打一串 hahaha 掉在他身上', () => { cursor(-260, -4, 0.3 * HH, { ground: true }); ['ha', 'ha', 'ha'].forEach((w, i) => PR.word(ctx, w, 120 + i * 40, -40 - i * 70, 0.3 * i, 34)); ctx.save(); ctx.translate(140, 0); ctx.rotate(0); ctx.restore(); heroAt(160); });
cell(2, 3, '害怕：乱闪、往后退、缩回一个字那么小', () => { cursor(-260, -4, 0.12 * HH, { ground: true, a: 0.55, tilt: -0.2 }); PR.word(ctx, '?', -260, -60, 0, 30); heroAt(160); });
cv.toFileSync(process.argv[2] || 'cursor_board.png');
console.log('wrote', process.argv[2]);
