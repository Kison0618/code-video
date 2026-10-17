// 确定性的小物理：掉落、弹跳、被踢飞、旋转
// 每个物体在加载时用固定步长预先模拟好整条轨迹，渲染时按时间取样，多进程分块渲染也完全一致。
// 落地反弹会自动登记成音效（cues）。
'use strict';
const cues = require('./cues');

const G = 2600;          // 重力（世界像素 / 秒²）
const STEP = 1 / 240;

class Body {
  // o: { t0, x, y, vx, vy, rot, vrot, r(碰撞半径), bounce, friction, ground, hits:[{t, vx, vy, vrot}], sfx, until }
  constructor(o) {
    Object.assign(this, { vx: 0, vy: 0, rot: 0, vrot: 0, r: 10, bounce: 0.35, friction: 0.75, ground: 0, hits: [], sfx: 'tick', until: o.t0 + 20 }, o);
    this.sim();
  }
  sim() {
    let { x, y, vx, vy, rot, vrot } = this;
    const hits = [...this.hits].sort((a, b) => a.t - b.t);
    let hi = 0, rest = false;
    this.track = [];
    for (let t = this.t0; t <= this.until; t += STEP) {
      while (hi < hits.length && hits[hi].t <= t) {
        const h = hits[hi++];
        vx = h.vx ?? vx; vy = h.vy ?? vy; vrot = h.vrot ?? vrot;
        if (h.x !== undefined) x = h.x;
        if (h.y !== undefined) y = h.y;
        rest = false;
      }
      this.track.push([x, y, rot]);
      if (rest) continue;
      vy += G * STEP;
      x += vx * STEP; y += vy * STEP; rot += vrot * STEP;
      const gy = this.ground - this.r;
      if (y > gy) {
        y = gy;
        if (vy > 140) {
          cues.add(t, this.sfx, { v: Math.min(1, vy / 1600), x });
          vy = -vy * this.bounce; vx *= this.friction; vrot *= 0.6;
        } else {
          vy = 0; vx *= 0.9; vrot = 0;
          // 躺下来：角度往最近的正放角度靠，摆正且不再滑动才算静止
          const q = Math.round(rot / (2 * Math.PI)) * 2 * Math.PI;   // 文字、电脑都正着躺
          rot += (q - rot) * 0.06;
          if (Math.abs(vx) < 4 && Math.abs(q - rot) < 0.005) { vx = 0; rot = q; rest = true; }
        }
      }
    }
  }
  at(t) {
    if (t <= this.t0) return this.track[0];
    const i = Math.min(this.track.length - 1, Math.floor((t - this.t0) / STEP));
    return this.track[i];
  }
}

module.exports = { Body, G };
