// 确定性的小物理：掉落、弹跳、被踢飞、旋转
// 每个物体在加载时用固定步长预先模拟好整条轨迹，渲染时按时间取样，多进程分块渲染也完全一致。
// 落地反弹会自动登记成音效（cues）。
'use strict';
const cues = require('./cues');

const G = 2600;          // 重力（世界像素 / 秒²）
const STEP = 1 / 240;

class Body {
  // o: { t0, x, y, vx, vy, rot, vrot, r(碰撞半径), bounce, friction, ground, hits:[{t, vx, vy, vrot}], sfx, until, defer }
  constructor(o) {
    Object.assign(this, { vx: 0, vy: 0, rot: 0, vrot: 0, r: 10, hw: 10, bounce: 0.35, friction: 0.75, ground: 0, hits: [], sfx: 'tick', until: o.t0 + 20, pile: null }, o);
    this.sim();
  }
  sim() {
    let { x, y, vx, vy, rot, vrot } = this;
    const hits = [...this.hits].sort((a, b) => a.t - b.t);
    let hi = 0, rest = false;
    this.events = [];
    if (this.pile) this.pile.remove(this);          // 重新模拟时先把自己从字堆里拿掉
    this.track = [];
    for (let t = this.t0; t <= this.until; t += STEP) {
      while (hi < hits.length && hits[hi].t <= t) {
        const h = hits[hi++];
        vx = h.vx ?? vx; vy = h.vy ?? vy; vrot = h.vrot ?? vrot;
        if (h.x !== undefined) x = h.x;
        if (h.y !== undefined) y = h.y;
        if (rest && this.pile) this.pile.leave(this, h.t);   // 已经堆在那里的被撞走：从这一刻起不再算字堆的高度
        rest = false;
      }
      this.track.push([x, y, rot]);
      if (rest) continue;
      vy += G * STEP;
      x += vx * STEP; y += vy * STEP; rot += vrot * STEP;
      const gy = (this.pile ? -this.pile.top(x, this.hw, t) : this.ground) - this.r;
      if (y > gy) {
        y = gy;
        // 落在字堆的斜坡上：往低的一边滑（堆成小山而不是一根根柱子）
        if (this.pile && !rest) {
          const L = this.pile.top(x - this.hw * 1.6, this.hw * 0.5, t), Rr = this.pile.top(x + this.hw * 1.6, this.hw * 0.5, t), here = -gy - this.r;
          if (here - Math.min(L, Rr) > this.r * 2.2) vx += (L < Rr ? -1 : 1) * 260 * STEP * 60;
        }
        if (vy > 140) {
          if (this.defer) this.events.push({ t, type: this.sfx, v: Math.min(1, vy / 1600) });   // 有停顿帧的场景：先记下，最后换算成真实时间再登记
          else cues.add(t, this.sfx, { v: Math.min(1, vy / 1600), x });
          vy = -vy * this.bounce; vx *= this.friction; vrot *= 0.6;
        } else {
          vy = 0; vx *= 0.9; vrot = 0;
          // 躺下来：角度往最近的正放角度靠，摆正且不再滑动才算静止
          const q = Math.round(rot / (2 * Math.PI)) * 2 * Math.PI;   // 文字、电脑都正着躺
          rot += (q - rot) * 0.06;
          if (Math.abs(vx) < 4 && Math.abs(q - rot) < 0.005) { vx = 0; rot = q; rest = true; if (this.pile) this.pile.add(x, this.hw, this.r * 2 * (this.stack ?? 0.9), t, this); }
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

// 字堆：很多小东西落地后一层层堆起来（高度图，按落地静止的时间累加，所以先落的垫在下面）
//   const pile = new Pile();  new Body({ ..., pile, hw: 半宽 })  → 落在已经堆起来的东西上面，静止后自己也变成堆的一部分
class Pile {
  constructor(cell = 6) { this.cell = cell; this.cols = new Map(); }
  add(x, hw, dh, t, owner) {
    for (let c = Math.floor((x - hw) / this.cell); c <= Math.floor((x + hw) / this.cell); c++) {
      if (!this.cols.has(c)) this.cols.set(c, []);
      this.cols.get(c).push({ t, dh, owner });
    }
  }
  remove(owner) { for (const [c, L] of this.cols) { const k = L.filter(e => e.owner !== owner); if (k.length !== L.length) this.cols.set(c, k); } }
  heightAt(c, t) { const L = this.cols.get(c); if (!L) return 0; let h = 0; for (const e of L) if (e.t <= t && !(e.t1 <= t)) h += e.dh; return h; }
  leave(owner, t) { for (const L of this.cols.values()) for (const e of L) if (e.owner === owner && e.t1 === undefined) e.t1 = t; }
  top(x, hw = 0, t = 1e9) {                       // x ± hw 范围里最高的地方（世界坐标里是 -top）
    let m = 0;
    for (let c = Math.floor((x - hw) / this.cell); c <= Math.floor((x + hw) / this.cell); c++) m = Math.max(m, this.heightAt(c, t));
    return m;
  }
}

// 把延后登记（defer: true）的落地音效按时钟换算成真实时间再登记
function flushSfx(bodies, clock) {
  for (const b of bodies) for (const e of b.events || []) cues.add(clock.real(e.t), e.type, { v: e.v });
}
module.exports = { Body, G, flushSfx, Pile };
