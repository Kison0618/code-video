// 光标设计板 v2（v6 创意稿）：node src/tools/cursor_board2.js out.png
'use strict';
const K = require('../core');
const { Actor2 } = require('../acting');
const PR = require('../props');

const CW = 960, CH = 540, COLS = 3, ROWS = 4, SC = 0.62, GY = 440, HH = 300;
const cv = new K.Canvas(CW * COLS, CH * ROWS), ctx = cv.getContext('2d');
ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cv.width, cv.height);
const mk = f => { const a = new Actor2({ H: HH, x0: 0, dir: -1, noise: 0 }); f && f(a); a.simulate(0.6, { sfx: false }); return a; };
const hero = mk(), heroFall = mk(a => a.lean(0, -40).hip(0, [0, -0.3 * HH]).hand('F', 0, 'local', [0.2, -0.25]).hand('B', 0, 'local', [-0.1, -0.3]));
const heroDangle = mk(a => a.hand('F', 0, 'local', [0.05, -0.38]).hand('B', 0, 'local', [-0.05, 0.3]).footFree('F', 0, [0.1, 0.42]).footFree('B', 0, [-0.12, 0.4]));
const BLUE = 'rgba(38,79,160,0.85)';
function cell(c, r, title, fn, scale = SC, bg) {
  ctx.save(); ctx.beginPath(); ctx.rect(c * CW, r * CH, CW, CH); ctx.clip();
  if (bg) { ctx.fillStyle = bg; ctx.fillRect(c * CW, r * CH, CW, CH); }
  ctx.translate(c * CW + CW / 2, r * CH + GY); ctx.scale(scale, scale);
  fn(); ctx.restore();
  ctx.save(); ctx.font = '28px SC'; ctx.fillStyle = bg === '#fff' ? '#b8860b' : '#ffd84a'; ctx.fillText(title, c * CW + 18, r * CH + 40);
  ctx.strokeStyle = '#333'; ctx.strokeRect(c * CW + 0.5, r * CH + 0.5, CW - 1, CH - 1); ctx.restore();
}
const at = (x, a = hero, y = 0) => { ctx.save(); ctx.translate(x, y); a.draw(ctx, 0.5); ctx.restore(); };
// 地面 = 一行很淡的字（换行能把它劈开）
const ground = (x0, x1, y = 0, a = 0.22) => { ctx.save(); ctx.font = '400 30px Code'; ctx.fillStyle = `rgba(200,200,200,${a})`; const s = 'for i in range(6): print("#####") while n < 3: '; for (let x = x0, i = 0; x < x1; x += 15, i++) ctx.fillText(s[i % s.length], x, y + 26); ctx.fillStyle = `rgba(255,255,255,0.15)`; ctx.fillRect(x0, y, x1 - x0, 2); ctx.restore(); };
const under = (x, y, w) => { ctx.fillStyle = '#f5f5f5'; ctx.fillRect(x - w / 2, y - Math.max(7, w * 0.13), w, Math.max(7, w * 0.13)); };
const ibeam = (x, y, h, a = 1) => { ctx.save(); ctx.fillStyle = `rgba(245,245,245,${a})`; const w = Math.max(8, h * 0.07); ctx.fillRect(x - w / 2, y - h, w, h); ctx.fillRect(x - h * 0.17, y - h, h * 0.34, w); ctx.fillRect(x - h * 0.17, y - w, h * 0.34, w); ctx.restore(); };
const spinner = (x, y, r, frac) => { ctx.save(); ctx.lineWidth = r * 0.22; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = '#f5f5f5'; ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2); ctx.stroke(); ctx.restore(); };
const arrow = (x, y, s) => { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = '#f5f5f5'; ctx.strokeStyle = '#000'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 70); ctx.lineTo(17, 54); ctx.lineTo(30, 82); ctx.lineTo(40, 77); ctx.lineTo(27, 50); ctx.lineTo(50, 50); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); };
const snake = (x, words, o = {}) => words.forEach((w, k) => { const sx = x - k * (w.length > 2 ? 92 : 66); if (o.hl && o.hl.includes(k)) { ctx.fillStyle = o.hlc || BLUE; ctx.fillRect(sx - 34, -64, 68, 48); } PR.word(ctx, w, sx, -38, 0, 46); });
const keys = (x, y, ks, t = 1) => PR.keyCombo(ctx, t, { at: [x, y], size: 64, keys: ks.map((label, i) => ({ label, t: i * 0.2 })), t1: 9 });

// 第 1 行：姿态
cell(0, 0, '趴着 _：平时、偷偷摸摸（慢闪）', () => { ground(-900, 900); under(-120, -4, 0.15 * HH); snake(-260, ['hi', 'hi', 'hi']); at(300); });
cell(1, 0, '站起来 |：认真了（I 形光标像个小人）', () => { ground(-900, 900); ibeam(-120, 0, 0.75 * HH); at(300); });
cell(2, 0, '蓄力：加载圈转满了才出大招', () => { ground(-900, 900); ibeam(-160, 0, 0.75 * HH); spinner(-160, -0.95 * HH, 50, 0.72); at(300); });
// 第 2 行：选中阶梯
cell(0, 1, '双击：选中一整节（嗒嗒）→ 删掉', () => { ground(-900, 900); ibeam(-30, 0, 0.6 * HH); snake(-200, ['hi', 'hi', 'hi'], { hl: [1] }); at(320); });
cell(1, 1, 'Ctrl+F 搜 hi：所有的 hi 一起亮', () => { ground(-900, 900); ibeam(-420, 0, 0.6 * HH); snake(-40, ['hi', 'hi', 'hi'], { hl: [0, 1, 2], hlc: 'rgba(200,170,40,0.8)' }); ctx.fillStyle = 'rgba(200,170,40,0.8)'; ctx.fillRect(470, -330, 68, 48); PR.word(ctx, 'hi', 504, -305, 0, 46); keys(-420, -330, ['Ctrl', 'F']); at(300); });
cell(2, 1, 'Ctrl+H：hi → bye，小蛇自己走了', () => { ground(-900, 900); snake(-60, ['bye', 'bye', 'bye']); keys(-200, -300, ['Ctrl', 'H']); ibeam(-560, 0, 0.6 * HH); at(330); });
// 第 3 行：手、地面、全选
cell(0, 2, '鼠标箭头 = 它的手：把他像文件一样拖走', () => { ground(-900, 900); ibeam(-420, 0, 0.6 * HH); arrow(90, -1.25 * HH, 1.4); at(80, heroDangle, -0.3 * HH); });
cell(1, 2, '回车：脚下那一行字断开，他掉到下一行', () => { ground(-900, -60); ground(60, 900); ground(-60, 60, 160, 0.22); ibeam(-90, 0, 0.6 * HH); keys(-90, -300, ['Enter']); at(20, heroFall, 120); });
cell(2, 2, 'Ctrl+A：整个世界都被选中（全片最可怕的 2 秒）', () => { ground(-1400, 1400); ibeam(-200, 0, 1.6 * HH); snake(320, ['hi', 'hi', 'hi']); at(420); keys(-200, -620, ['Ctrl', 'A']); }, 0.4, BLUE);
// 第 4 行：删除、撤销、和解
cell(0, 3, 'Delete：一切消失，只剩他和电脑', () => { at(0); PR.laptop(ctx, 50, -0.44 * HH, 75, 0, 1, -1); keys(-300, -300, ['Delete']); }, SC, '#fff');
cell(1, 3, 'Ctrl+Z：世界一点点倒着回来（他的大招）', () => { ground(-500, 500); ctx.save(); ctx.globalAlpha = 0.35; ground(-900, -500); ground(500, 900); ctx.restore(); snake(-140, ['hi', 'hi']); PR.word(ctx, 'hi', -270, -38, 0, 46, 0.4); keys(-60, -330, ['Ctrl', 'Z']); at(250); });
cell(2, 3, '和解：他打半行，它补完；两个光标一起闪', () => { ground(-900, 900); ctx.save(); ctx.font = '400 54px Code'; ctx.fillStyle = '#ddd'; ctx.fillText('print(', -520, -330); ctx.fillStyle = '#e6c07b'; ctx.fillText('"hi"', -520 + 6 * 27, -330); ctx.fillStyle = '#ddd'; ctx.fillText(')', -520 + 10 * 27, -330); ctx.restore(); under(-520 + 11.5 * 27, -322, 24); under(-520 + 6.5 * 27, -260, 24); snake(-60, ['hi', 'hi', 'hi', 'hi']); at(260); });
cv.toFileSync(process.argv[2] || 'cursor_board2.png');
console.log('wrote', process.argv[2]);
