// 蚂蚁段 003 末 – 012 初：剪纸蚁巢剖面。圆形转场进入，012 像书页一样对折收回人头
'use strict';
const K = require('../core');
const { W, H, Canvas, clamp, lerp, smooth, prog, easeIn, easeOut, easeInOut } = K;
const TL = require('../timeline');
const { L, at } = TL;
const ANT = require('../ant');
const C = require('../card');
const FX = require('../fx');
const NW = require('../nest_world');
const KIT = require('../nest_kit');
const { cast, T } = require('../nest_cast');

const IN0 = L('003').t1 - 0.55, IN1 = L('003').t1 + 0.35;      // 圆形揭开
const F0 = L('012').t0 + 0.25, F1 = F0 + 0.7;                  // 蚁巢沉下淡出（规则卡交给 s1_head 飞进人脑）

// 镜头关键帧：[开始, 时长, cx, cy, s]
const CAM = [[IN0, 0, 1000, 720, 1.3], [IN1 - 0.2, 1.8, 1010, 650, 1.16], [T.push, 1.4, 1030, 700, 1.32], [L('010').t0 - 0.1, 1.4, 800, 470, 1.0], [T.s11, 2.2, 960, 760, 0.6]];
function camera(t) {
  let [_, __, cx, cy, s] = CAM[0];
  for (const [a, d, x, y, ss] of CAM.slice(1)) { const u = easeInOut(prog(t, a, a + d)); cx = lerp(cx, x, u); cy = lerp(cy, y, u); s = Math.exp(lerp(Math.log(s), Math.log(ss), u)); }
  return { cx, cy, s };
}
const toScr = (c, [x, y]) => [(x - c.cx) * c.s + W / 2, (y - c.cy) * c.s + H / 2];

// 右上角代码卡（屏幕坐标）
const RULE = 'IF 闻到死亡气味 → 抬出巢穴', RS = 46;
function ruleCard(ctx, t) {
  const a = smooth(prog(t, T.lift - 0.4, T.lift));
  if (a <= 0.01) return;
  ctx.save(); ctx.font = C.CODE(RS); const tw = ctx.measureText(RULE).width; ctx.restore();
  const w = tw + 130, h = 104, x = W - 40 - w, y = 30;
  const hl = smooth(prog(t, T.s8, T.s8 + 0.5));
  const pulse = 1 + 0.05 * Math.sin(prog(t, T.s8, T.s8 + 0.5) * Math.PI);
  C.card(ctx, x, y, w, h, { alpha: a, scale: (0.7 + 0.3 * easeOut(a)) * pulse, rot: 0.012, seed: 21, blur: 14, dy: 7,
    inner: c => {
      C.codeLine(c, RULE, 30, 70, { size: RS, n: [...RULE].length * prog(t, T.lift - 0.3, T.lift + 0.6), hl: [3, 6, hl] });
      C.tick(c, w - 52, 50, 46, prog(t, T.useful, T.useful + 0.35));
    } });
}

function world(ctx, t, c, noCard) {
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(c.s, c.s); ctx.translate(-c.cx, -c.cy);
  ctx.drawImage(NW.BMP, NW.X0, NW.Y0);
  const { ants, fx } = cast(t);
  const vx0 = c.cx - W / 2 / c.s - 300, vx1 = c.cx + W / 2 / c.s + 300, vy0 = c.cy - H / 2 / c.s - 300, vy1 = c.cy + H / 2 / c.s + 300;
  for (const w of fx.wisps) KIT.wisp(ctx, w[0], w[1], w[2], t, w[3], w[4], w[5]);
  for (const o of ants) if (o.x > vx0 && o.x < vx1 && o.y > vy0 && o.y < vy1) ANT.draw(ctx, t, o);
  if (fx.coil) KIT.coil(ctx, fx.coil[0], t, fx.coil[1]);
  if (fx.brush) KIT.brush(ctx, fx.brush[0], fx.brush[1], fx.brush[2]);
  const bob = Math.sin(t * 4) * 8;                     // 所有卡片一起上下浮：像流水线
  for (const [x, y, a] of fx.minis) KIT.mini(ctx, x, y + bob, a);
  ctx.restore();
  // 气泡（屏幕坐标，大小不随镜头变）
  for (const b of fx.bubbles) {
    const [a0, a1] = b.a; if (t < a0 - 0.05 || t > a1 + 0.3) continue;
    const pop = easeOut(prog(t, a0, a0 + 0.25)), out = 1 - smooth(prog(t, a1, a1 + 0.25));
    const [hx, hy] = toScr(c, b.at);
    const bx = clamp(hx + (b.who.dir < 0 ? 60 : -40), 420, W - 420), by = Math.max(330, hy - 150);
    C.bubble(ctx, { x: bx, y: by, text: b.text, tail: [hx, hy - 10], pop, alpha: out, shout: b.shout, size: 54, rot: b.shout ? Math.sin(t * 30) * 0.015 : 0 });
  }
  if (!noCard) ruleCard(ctx, t);
}

const OFF = new Canvas(W, H), FLAT = new Canvas(W, H);
module.exports = {
  t0: IN0, t1: F1,
  draw(ctx, t) {
    if (t < IN0 || t > F1) return;
    const c = camera(t);
    const fold = prog(t, F0, F1);
    if (t < IN1) {                                     // 从蚂蚁身上圆形揭开
      const r = lerp(10, 1250, easeIn(prog(t, IN0, IN1)));
      ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#f5ead3'; ctx.fillRect(0, 0, W, H);
      world(ctx, t, c); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.lineWidth = 10; ctx.strokeStyle = '#fbf5e6'; ctx.shadowColor = 'rgba(50,28,8,0.4)'; ctx.shadowBlur = 14; ctx.stroke(); ctx.restore();
      return;
    }
    if (fold <= 0) { world(ctx, t, c); return; }
    // 012：蚁巢画面往下沉、淡出，露出底下的人头；右上角规则卡交给 s1_head，由它飞进人脑
    const o = OFF.getContext('2d'); o.reset(); o.fillStyle = '#f5ead3'; o.fillRect(0, 0, W, H); world(o, t, c, true);
    FX.flatten(OFF, FLAT);
    const e = easeInOut(fold), fade = 1 - smooth(fold);
    if (fade <= 0.01) return;
    ctx.save();
    ctx.globalAlpha = fade;
    ctx.translate(W / 2, H / 2 + 120 * e); ctx.scale(1 - 0.08 * e, 1 - 0.08 * e);
    ctx.drawImage(FLAT, -W / 2, -H / 2);
    ctx.restore();
  },
};
