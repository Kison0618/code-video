// 定律 08 · 习得性无助（1967，塞利格曼 & 迈尔）  85.10–93.60 秒（安静的过渡）
//  穿梭箱：一个光点一次次想跳过中间的隔板，一次次被弹回来，每次跳得更低；
//  后来隔板撤走了、出口亮了——它也不动了。92.6 秒曲子空白："醒过来的时候，我还在原地。"
'use strict';
const K = require('../core');
const { W, H, C, rgba, mix, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, hash, noise1, text } = K;
const A = require('../audio');
const UI = require('../ui');
const T = require('../textfx');
const CARD = require('../card');
const { B } = A;

const T0 = B(160), T1 = B(176);
const BX0 = 520, BX1 = 1400, BY0 = 380, BY1 = 760, MID = (BX0 + BX1) / 2;
const JUMPS = [T0 + 0.5, T0 + 1.3, T0 + 2.0, T0 + 2.6, T0 + 3.1];
const JH = [300, 250, 190, 130, 70];                 // 每次跳得更低
const TOPEN = T0 + 4.0;                              // 隔板撤走
const HOME = BX0 + 200;

function dotPos(t) {
  for (let i = JUMPS.length - 1; i >= 0; i--) {
    const u = (t - JUMPS[i]) / 0.55;
    if (u >= 0 && u <= 1) {
      // 往隔板跳，碰到就弹回来
      const reach = u < 0.6 ? u / 0.6 : 1 - (u - 0.6) / 0.4;
      const x = lerp(HOME, MID - 16, easeOut(reach)), y = BY1 - 12 - Math.sin(clamp(reach) * Math.PI * 0.5) * JH[i] * (u < 0.6 ? 1 : (1 - (u - 0.6) / 0.4));
      return [x, y, u > 0.55 && u < 0.75 ? 1 : 0];
    }
  }
  const tremble = t > TOPEN ? 1.5 * noise1(t * 9, 4) : 0;
  return [HOME + tremble, BY1 - 12, 0];
}

function draw(ctx, t) {
  CARD.header(ctx, t, { t0: T0, t1: T1, year: 1967, prev: 2007, who: 'M. 塞利格曼 & S. 迈尔 · 宾夕法尼亚大学', no: '08', law: '习得性无助', en: 'Learned Helplessness', paper: 'Failure to Escape Traumatic Shock', paperCn: '《无法逃离的电击》' });
  const a = smooth(prog(t, T0 + 0.2, T0 + 0.6)) * (1 - smooth(prog(t, B(174.5), B(175.5))));
  // 箱子
  ctx.strokeStyle = rgba(C.gray, 0.7 * a); ctx.lineWidth = 2; ctx.strokeRect(BX0, BY0, BX1 - BX0, BY1 - BY0);
  // 地板电网（左半）
  const zap = dotPos(t)[2];
  ctx.save(); ctx.beginPath();
  for (let x = BX0 + 10; x < MID - 10; x += 26) { ctx.moveTo(x, BY1 - 2); ctx.lineTo(x + 13, BY1 - 9); ctx.lineTo(x + 26, BY1 - 2); }
  ctx.strokeStyle = rgba(zap ? C.amber : C.line, (zap ? 1 : 0.8) * a); ctx.lineWidth = 1.5; ctx.stroke(); ctx.restore();
  // 隔板：撤走
  const bh = 340 * (1 - easeInOut(prog(t, TOPEN, TOPEN + 0.6)));
  if (bh > 1) { ctx.fillStyle = rgba(C.gray, 0.85 * a); ctx.fillRect(MID - 6, BY1 - bh, 12, bh); }
  if (t > TOPEN) UI.note(ctx, '隔板已撤走', MID, BY1 + 40, { size: 22, color: C.gold, alpha: a * smooth(prog(t, TOPEN + 0.4, TOPEN + 0.8)), align: 'center' });
  // 出口
  const ex = smooth(prog(t, TOPEN + 0.3, TOPEN + 0.9));
  ctx.fillStyle = rgba(C.gold, 0.18 * ex * a); ctx.fillRect(BX1 - 120, BY0 + 2, 118, BY1 - BY0 - 4);
  glow(ctx, BX1 - 60, (BY0 + BY1) / 2, 220, C.gold, 0.25 * ex * a);
  text(ctx, '出口', BX1 - 60, (BY0 + BY1) / 2 + 12, { family: 'Song', size: 34, weight: 700, color: C.gold, alpha: ex * a });
  // 光点
  const [x, y] = dotPos(t);
  if (zap) { glow(ctx, x, y, 90, C.amber, 0.6 * a); text(ctx, '✕', x, y - 40, { family: 'Mono', size: 34, color: C.red, alpha: a }); }
  glow(ctx, x, y, 40, C.bone, 0.6 * a);
  ctx.fillStyle = rgba(C.white, a); ctx.beginPath(); ctx.arc(x, y, 8, 0, 6.2832); ctx.fill();
  // 计数
  const tries = JUMPS.filter(j => t > j + 0.3).length;
  UI.note(ctx, '尝试', 200, 420, { size: 22, alpha: a });
  text(ctx, String(tries), 200, 490, { family: 'Mono', size: 60, color: C.white, alpha: a, align: 'left' });
  UI.note(ctx, '失败', 200, 570, { size: 22, alpha: a });
  text(ctx, String(tries), 200, 640, { family: 'Mono', size: 60, color: C.red, alpha: a, align: 'left' });
  const st = t > TOPEN + 1.0;
  UI.note(ctx, '状态', 1500, 420, { size: 22, alpha: a });
  text(ctx, st ? '不再尝试' : '尝试中', 1500, 480, { family: 'Song', size: 40, weight: 700, color: st ? C.red : C.bone, alpha: a, align: 'left' });
  if (st) UI.note(ctx, '可以逃，但不逃了', 1500, 530, { size: 22, color: C.red, alpha: a * smooth(prog(t, TOPEN + 1.0, TOPEN + 1.4)) });

  T.seq(ctx, t, [
    { t: B(160.8), s: '我试过改变，屡战屡败。', hl: { '屡战屡败': C.red }, en: 'I tried to change. I failed, again and again.' },
    { t: B(165), s: '后来，就算门开着——', en: 'Later, even with the door wide open —' },
    { t: B(168), s: '我也不想动了。', fx: 'slam', size: 72, en: "I didn't want to move." },
    { t: B(171), s: '道理都懂，就是不愿意往前走。', hl: { '不愿意': C.red }, out: 92.45 },
    { t: 92.6, s: '醒过来的时候，我还在原地。', fx: 'decode', size: 64, cps: 16, color: C.white, hl: { '原地': C.gold }, out: T1 - 0.05, en: 'When I woke up, I was still where I started.' },
  ], { y: CARD.CAP_Y, size: 60 });
}
function bg() { return { amt: 0.6 }; }
module.exports = { draw, bg, t0: T0, t1: T1 };
