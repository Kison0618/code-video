// 乱码造型设计板（设计稿 v4 第 7 节第 1 步）：node src/tools/garble_board.js out.png
//   第 1 行：团的三种造型 A / B / C（旁边站着主角比大小）
//   第 2 行：人形、巨人、伪装和痕迹
//   第 3、4 行：固定的表演词汇（用 A 造型）：待机、预备-缩、预备-弹、盯住、打嗝、被打
'use strict';
const K = require('../core');
const { Actor2 } = require('../acting');
const GB = require('../garble');

const CW = 960, CH = 540, COLS = 3, ROWS = 4, SC = 0.62, GY = 440;
const cv = new K.Canvas(CW * COLS, CH * ROWS), ctx = cv.getContext('2d');
ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
const HH = 300, T = 1.3;
const hero = new Actor2({ H: HH, x0: 0, dir: -1, noise: 0 }); hero.simulate(0.6, { sfx: false });
const foe = new Actor2({ H: 0.95 * HH, x0: 0, dir: 1, noise: 0 });
foe.hand('F', 0, 'free', [0.3, 0.02]).hand('B', 0, 'free', [-0.22, 0.12]).foot('F', 0, [0.17 * HH, 0], 0).foot('B', 0, [-0.15 * HH, 0], 0).hip(0, [0, -0.4 * HH]).lean(0, 10);
foe.simulate(0.8, { sfx: false });
function cell(c, r, title, fn, scale = SC) {
  ctx.save(); ctx.beginPath(); ctx.rect(c * CW, r * CH, CW, CH); ctx.clip();
  ctx.translate(c * CW + CW / 2, r * CH + GY); ctx.scale(scale, scale);
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2 / scale; ctx.beginPath(); ctx.moveTo(-CW / scale, 0); ctx.lineTo(CW / scale, 0); ctx.stroke();
  fn(); ctx.restore();
  ctx.save(); ctx.font = '28px SC'; ctx.fillStyle = '#ffd84a'; ctx.fillText(title, c * CW + 18, r * CH + 40);
  ctx.strokeStyle = '#333'; ctx.strokeRect(c * CW + 0.5, r * CH + 0.5, CW - 1, CH - 1); ctx.restore();
}
const heroAt = x => { ctx.save(); ctx.translate(x, 0); hero.draw(ctx, 0.5); ctx.restore(); };
const R = 0.5 * HH;
// 第 1 行：三种造型
cell(0, 0, 'A 鳞片土堆：外圈顺着轮廓排，核心 �', () => { GB.drawMound(ctx, -170, 0, R, { style: 'A', t: T }); GB.drawTrace(ctx, -720, -330, -12, 26, T); heroAt(260); });
cell(1, 0, 'B 绕核心的环：像原子', () => { GB.drawMound(ctx, -170, 0, R, { style: 'B', t: T }); GB.drawTrace(ctx, -720, -330, -12, 26, T); heroAt(260); });
cell(2, 0, 'C 搅乱的几行字：往下坠的水滴', () => { GB.drawMound(ctx, -170, 0, R, { style: 'C', t: T }); GB.drawTrace(ctx, -720, -330, -12, 26, T); heroAt(260); });
// 第 2 行：人形、巨人、伪装
cell(0, 1, '人形：骨头是乱码，头是 �（0.95H）', () => { ctx.save(); ctx.translate(-150, 0); GB.drawGlyphFigure(ctx, foe.jointsAt(0.7), 40, 4, T); ctx.restore(); heroAt(230); });
cell(1, 1, '巨人：A 造型放大到 3H，主角在脚边', () => { GB.drawMound(ctx, -120, 0, 1.5 * HH, { style: 'A', t: T, size: 52 }); heroAt(330); }, 0.38);
cell(2, 1, '伪装：地上一行"正常的字"，只有一个字在抖', () => {
  const line = 'print("hi")'; ctx.save(); ctx.font = '400 46px Code'; ctx.fillStyle = 'rgb(214,214,214)';
  for (let i = 0; i < line.length; i++) { const ch = i === 7 ? GB.gly(77, T) : line[i]; GB.drawGlyph(ctx, ch, -420 + i * 26, -22 + (i === 7 ? -3 : 0), 0, 46, 1, i === 7 ? 1 : 0); }
  ctx.restore(); GB.drawTrace(ctx, -720, -440, -12, 26, T); heroAt(260);
});
// 第 3、4 行：表演词汇
const exp = (c, r, title, o) => cell(c, r, title, () => { GB.drawMound(ctx, -60, 0, R, { style: 'A', t: T, ...o }); heroAt(330); });
exp(0, 2, '待机：整齐、慢慢转', {});
exp(1, 2, '预备 ①：缩到 0.7 倍（8 帧）', { sx: 0.78, sy: 0.62 });
exp(2, 2, '预备 ②：1 帧弹到 1.2 倍 + 边缘抖', { sx: 1.15, sy: 1.25, mess: 0.25 });
exp(0, 3, '盯住：每个字指向他、身体倾向他、静止 10 帧', { aimAt: [390, -0.75 * HH], lean: 0.35 });
exp(1, 3, '打嗝：鼓一下，核心闪出被吃的字', { sx: 1.1, sy: 1.1, core: 'hi' });
exp(2, 3, '被打：被打那一侧飞散，1 秒后重组', { hit: -0.2, mess: 0.35 });
cv.toFileSync(process.argv[2] || 'garble_board.png');
console.log('wrote', process.argv[2]);
