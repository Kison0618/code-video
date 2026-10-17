// 2D 虚拟摄像机：推拉摇移、跟随、震屏；外加原片那条"地面渐变"
// 世界坐标：x 向右，y 向下，地面在 y = 0（地面以上是负数）
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E, noise1 } = K;

class Camera {
  constructor() { this.keys = []; this.shakes = []; }
  // o: { x, y, z, ease }   z = 缩放（1 = 一个世界像素对应一个屏幕像素）
  key(t, o) {
    const p = this.keys[this.keys.length - 1] || { x: 0, y: -300, z: 1 };
    this.keys.push({ t, x: o.x ?? p.x, y: o.y ?? p.y, z: o.z ?? p.z, ease: o.ease || 'inOut3' });
    this.keys.sort((a, b) => a.t - b.t);
    return this;
  }
  // 震屏：amp 像素（屏幕空间），dur 秒，指数衰减
  shake(t, amp = 20, dur = 0.35) { this.shakes.push({ t, amp, dur }); return this; }
  at(t) {
    const ks = this.keys;
    let i = 0;
    while (i < ks.length - 1 && ks[i + 1].t <= t) i++;
    const a = ks[i], b = ks[Math.min(i + 1, ks.length - 1)];
    const u = b === a ? 0 : (E[b.ease] || E.inOut3)(clamp((t - a.t) / (b.t - a.t)));
    // 缩放按对数插值，推拉速度均匀
    const z = Math.exp(lerp(Math.log(a.z), Math.log(b.z), u));
    let sx = 0, sy = 0, rot = 0;
    for (const s of this.shakes) {
      const age = t - s.t;
      if (age < 0 || age > s.dur) continue;
      const d = Math.pow(1 - age / s.dur, 2) * s.amp;
      sx += noise1(age * 38, s.t * 7) * d; sy += noise1(age * 38, s.t * 7 + 3) * d;
      rot += noise1(age * 20, s.t * 7 + 9) * d * 0.0006;
    }
    return { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), z, sx, sy, rot };
  }
  apply(ctx, c) {
    ctx.translate(W / 2 + c.sx, H / 2 + c.sy);
    ctx.rotate(c.rot);
    ctx.scale(c.z, c.z);
    ctx.translate(-c.x, -c.y);
  }
  toScreen(c, x, y) { return [W / 2 + (x - c.x) * c.z + c.sx, H / 2 + (y - c.y) * c.z + c.sy]; }
}

// 地面渐变：从地平线往下由黑渐变到灰（原片实测底部约 16～30）
function floor(ctx, c, strength = 1, top = 26) {
  if (strength <= 0.003) return;
  const gy = H / 2 + (0 - c.y) * c.z + c.sy;
  if (gy > H) return;
  const len = Math.max(260, 900 * Math.sqrt(c.z));
  const y0 = Math.max(gy, -10), g = ctx.createLinearGradient(0, gy, 0, gy + len);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  const v = top * strength | 0;
  g.addColorStop(1, `rgb(${v},${v},${v})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, y0, W, H - y0);
}

module.exports = { Camera, floor };
