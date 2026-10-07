// 片头钩子（源时间 −4 → 0）：全片最华丽的六个画面快切，越切越快，最后整个画面被吸进一粒金色光点——
// 这粒光点就是冷开场里那条线的起点。
'use strict';
const K = require('./core');
const { W, H, C, Canvas, clamp, lerp, prog, smooth, easeIn, easeOut, glow } = K;
const UI = require('./ui');
const POST = require('./post');

const T0 = -4.0, IMPLODE = -1.25;
// [切入时刻(源时间), 取景的源时间, 推镜起止缩放]
const SHOTS = [
  [-4.00, 214.0, 1.10, 1.00],   // 图灵斑纹
  [-3.40, 196.6, 1.18, 1.04],   // 向日葵 55 条螺旋
  [-2.85, 249.0, 1.00, 1.12],   // 漩涡
  [-2.40, 106.0, 1.12, 1.02],   // DNA 双螺旋
  [-2.02, 296.0, 1.00, 1.10],   // 线粒体
  [-1.70, 322.4, 1.06, 1.00],   // 终幕绽放
];
const DOT = [240, 540];          // 冷开场光点的位置
const events = SHOTS.map(([t], i) => ({ t, type: 'teaser_cut', i })).concat([{ t: IMPLODE, type: 'teaser_implode' }]);

const SCENES = require('./scenes');
const shot = new Canvas(W, H), sctx = shot.getContext('2d');
function renderShot(ts, feather) {
  sctx.reset();
  UI.background(sctx, ts, { starA: 0.6, warm: 0.6 });
  for (const s of SCENES) if (ts >= s.start - 1 && ts <= s.end + 1) s.draw(sctx, ts);
  POST.bloom(sctx, ts, 0.3);
  // 内爆时把画面羽化成一团光，缩小时不露出矩形边
  if (feather > 0) {
    const g = sctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, W * 0.55);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(lerp(0.75, 0.25, feather), 'rgba(0,0,0,1)');
    g.addColorStop(1, `rgba(0,0,0,${1 - feather})`);
    sctx.globalCompositeOperation = 'destination-in'; sctx.fillStyle = g; sctx.fillRect(0, 0, W, H);
    sctx.globalCompositeOperation = 'source-over';
  }
}

function draw(ctx, t) {
  ctx.fillStyle = '#030407'; ctx.fillRect(0, 0, W, H);
  // 当前镜头
  let i = SHOTS.length - 1;
  while (i > 0 && t < SHOTS[i][0]) i--;
  const [ta, src, z0, z1] = SHOTS[i];
  const tb = i + 1 < SHOTS.length ? SHOTS[i + 1][0] : IMPLODE + 0.9;
  const u = clamp((t - ta) / (tb - ta));
  // 镜头内时间也在走，让画面是活的
  const imp = easeIn(prog(t, IMPLODE, -0.08));            // 内爆进度
  renderShot(src + (t - ta) * 1.2, smooth(prog(t, IMPLODE - 0.2, IMPLODE + 0.35)));
  const z = lerp(z0, z1, u) * lerp(1, 0.002, imp);
  // 内爆时画面向光点收拢
  const cx = lerp(W / 2, DOT[0], smooth(prog(t, IMPLODE - 0.1, IMPLODE + 0.5)));
  const cy = lerp(H / 2, DOT[1], smooth(prog(t, IMPLODE - 0.1, IMPLODE + 0.5)));
  ctx.save();
  ctx.globalAlpha = smooth(prog(t, ta, ta + 0.06)) * (1 - 0.35 * imp);
  ctx.translate(cx, cy); ctx.scale(z, z); ctx.rotate(imp * 0.9);
  ctx.drawImage(shot, -W / 2, -H / 2);
  ctx.restore();
  // 切点闪光
  const cut = Math.exp(-(t - ta) * 14);
  if (cut > 0.02 && i > 0) glow(ctx, W / 2, H / 2, W * 0.7, C.ivory, 0.35 * cut);
  // 内爆：四周的光被吸进去
  if (imp > 0) {
    for (let k = 0; k < 90; k++) {
      const ang = k * 2.39996, r0 = 300 + (k * 97) % 900;
      const r = r0 * (1 - easeIn(clamp(imp * 1.15 - (k % 7) * 0.02)));
      if (r <= 2) continue;
      glow(ctx, DOT[0] + r * Math.cos(ang), DOT[1] + r * Math.sin(ang) * 0.6, 5 + 6 * (1 - imp), C.gold, 0.7 * smooth(imp * 3));
    }
  }
  // 光点：内爆终点亮起，随后稳定成冷开场的光点
  const dotA = smooth(prog(t, IMPLODE + 0.6, -0.02));
  if (dotA > 0) {
    const flare = Math.exp(-Math.max(0, t + 0.08) * 6);
    glow(ctx, DOT[0], DOT[1], 26 + 260 * flare, C.gold, dotA * (0.7 + 0.8 * flare));
    glow(ctx, DOT[0], DOT[1], 10, C.ivory, dotA);
  }
  // 片名闪现：最后两刀之间，一句话立住主题
  const ta2 = vis2(t, -2.05, -1.30);
  if (ta2 > 0) {
    ctx.fillStyle = `rgba(3,4,7,${0.62 * ta2})`; ctx.fillRect(0, 0, W, H);
    glow(ctx, W / 2, H / 2, 520, C.amber, 0.18 * ta2);
    K.text(ctx, '近四十亿年，从未断过', W / 2, H / 2 + 22, { size: 72, weight: 300, alpha: ta2, spacing: 0.2 });
    K.text(ctx, 'NEARLY FOUR BILLION YEARS · NEVER BROKEN', W / 2, H / 2 + 84, { size: 15, family: 'Mono', weight: 300, alpha: 0.55 * ta2, color: C.gold, spacing: 0.45 });
  }
}
function vis2(t, a, b) { return smooth(prog(t, a, a + 0.12)) * (1 - smooth(prog(t, b - 0.15, b))); }

module.exports = { T0, events, draw };
