// 打击感系统：一次 hit() 按力度档位，把停顿帧、震屏、推镜、闪光 / 反色冲击帧、星芒、冲击环、冲击波扭曲、火花、音效
// 全部排到同一帧上。另有：代码被打碎成字符（Shatter）、蓄力（charge）。
//
//   const imp = new Impacts({ clock, cam });
//   imp.hit(ta, [x, y], 'heavy');            // 必须在角色 simulate() 之前登记（停顿帧要先排进时钟）
//   imp.drawWorld(ctx, t)                    // 世界坐标里的星芒、冲击环、火花（在 cam.apply 之后调用）
//   imp.post(ctx, t, base)                   // 屏幕后期：冲击波扭曲、反色冲击帧、闪光（frame.js 的 post 钩子里调用）
//
// 档位设计：轻击干脆、重击有分量。停顿帧长度参考动画常用做法（轻 2 帧、中 3 帧、重 4–5 帧、巨大 6 帧，按 30 帧计）。
'use strict';
const K = require('./core');
const { W, H, C, clamp, lerp, E, rgba, mulberry32 } = K;
const { ImageData } = require('skia-canvas');
const V = require('./vfx');
const cues = require('./cues');
const { Body } = require('./phys');
const { tokenize } = require('./code');

const LEVEL = {
  //        停顿   震屏 px/秒       推镜   闪光  反色帧  星芒  冲击环 r  扭曲 px  火花  集中线  音效
  light:  { freeze: 0.07, shake: [14, 0.3], punch: 0.04, flash: 0.14, invert: 0, rays: 9, ring: 260, warp: 0, sparks: 16, lines: 0, sfx: ['impact_light'] },
  medium: { freeze: 0.10, shake: [22, 0.4], punch: 0.07, flash: 0.2, invert: 1, rays: 12, ring: 380, warp: 9, sparks: 28, lines: 0.25, sfx: ['impact_medium', 'impact_frame'] },
  heavy:  { freeze: 0.16, shake: [34, 0.55], punch: 0.12, flash: 0.28, invert: 2, rays: 14, ring: 620, warp: 16, sparks: 40, lines: 0.4, sfx: ['impact_heavy', 'impact_frame'] },
  huge:   { freeze: 0.20, shake: [52, 0.9], punch: 0.16, flash: 0.5, invert: 3, rays: 18, ring: 1000, warp: 26, sparks: 60, lines: 0.7, sfx: ['impact_frame'] },
  ground: { freeze: 0.08, shake: [30, 0.6], punch: 0.06, flash: 0, invert: 0, rays: 0, ring: 700, warp: 12, sparks: 0, lines: 0, sfx: ['laptop_slam', 'ground_shock'], squash: 0.18 },
};
const FR = 1 / 60;

class Impacts {
  constructor({ clock, cam }) { this.clock = clock; this.cam = cam; this.hits = []; }
  hit(ta, pos, level = 'medium', o = {}) {
    const L = { ...LEVEL[level], ...o };
    this.clock.freeze(ta, L.freeze);
    const tr = this.clock.real(ta);                 // 接触那一刻的真实时间
    this.cam.shake(tr, L.shake[0], L.shake[1] + L.freeze);
    if (L.punch) this.cam.punch(tr, L.punch, 0.5 + L.freeze);
    for (const s of L.sfx) cues.add(tr, s);
    this.hits.push({ ta, tr, pos, L, seed: this.hits.length * 7 + 3 });
    return tr;
  }
  // 世界坐标里的效果（真实时间驱动：停顿帧期间照样在动，这是"打中了"的感觉来源）
  drawWorld(ctx, t) {
    for (const h of this.hits) {
      const a = t - h.tr, L = h.L, [x, y] = h.pos, sq = L.squash || 0.78;
      if (a < 0 || a > 1.5) continue;
      if (L.rays && a < 0.32) {                    // 星芒：一圈往外弹的白线
        ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineCap = 'round';
        const r = mulberry32(h.seed);
        for (let n = 0; n < L.rays; n++) {
          const ang = n / L.rays * Math.PI * 2 + r() * 0.4, k = 0.7 + r() * 0.6;
          const r0 = 14 + L.ring * 0.42 * k * E.out3(a / 0.22), r1 = r0 + L.ring * 0.22 * k * (1 - a / 0.32);
          ctx.lineWidth = (4 + L.ring / 90) * (1 - a / 0.32);
          ctx.beginPath(); ctx.moveTo(x + Math.cos(ang) * r0, y + Math.sin(ang) * r0 * sq); ctx.lineTo(x + Math.cos(ang) * r1, y + Math.sin(ang) * r1 * sq); ctx.stroke();
        }
        ctx.restore();
      }
      V.shockRing(ctx, x, y, a, { r1: L.ring, dur: 0.45, w: 10 + L.ring / 40, squash: sq, a: 0.85 });
      if (L.ring > 500) V.shockRing(ctx, x, y, a - 0.06, { r1: L.ring * 1.4, dur: 0.6, w: 6, squash: sq, a: 0.4 });
      if (L.sparks) V.sparks(ctx, x, y, a, { n: L.sparks, speed: 700 + L.ring * 1.4, life: 0.45, seed: h.seed, w: 3, up: L.squash ? 1.2 : 0, gravity: 2600 });
      if (L.squash) V.dust(ctx, x, 0, a, { n: 14, spread: L.ring * 0.6, size: 70, a: 0.55, seed: h.seed });
      if (L.glow) V.glow(ctx, x, y, L.ring * 0.7 * (1 - a / 1.5), C.warm, 0.8 * Math.exp(-a * 3));
    }
  }
  // 屏幕后期：冲击波扭曲 → 集中线 → 反色冲击帧 → 闪光
  post(ctx, t, base) {
    const c = this.cam.at(t);
    const warps = [];
    for (const h of this.hits) {
      const a = t - h.tr, L = h.L;
      if (a < 0 || a > 0.6) continue;
      const [sx, sy] = this.cam.toScreen(c, h.pos[0], h.pos[1]);
      if (L.warp && a < 0.45) warps.push({ x: sx, y: sy, r: L.ring * c.z * E.outExpo(a / 0.45), w: 40 + L.ring * c.z * 0.06, amp: L.warp * c.z * (1 - a / 0.45), sq: L.squash || 0.78 });
    }
    if (warps.length) warp(ctx, base, warps);
    for (const h of this.hits) {
      const a = t - h.tr, L = h.L;
      if (a < 0 || a > 0.6) continue;
      const [sx, sy] = this.cam.toScreen(c, h.pos[0], h.pos[1]);
      if (L.lines && a < L.lines) V.speedLines(ctx, sx, sy, t, { a: 0.8 * (1 - a / L.lines), n: 70 + L.ring / 8, r0: 120 + L.ring * 0.2 * c.z, seed: h.seed });
      if (L.invert && a < L.invert * FR + 1e-6) {          // 反色冲击帧：画面黑白颠倒 1–3 帧
        ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore();
      } else if (L.flash && a < L.invert * FR + 0.05) V.flash(ctx, L.flash * (1 - (a - L.invert * FR) / 0.05));
    }
  }
}

// 冲击波扭曲：环带里的像素沿半径方向推开一点（像空气被挤压的折射）
function warp(ctx, base, list) {
  const buf = base.toBufferSync('raw'), src = new Uint8ClampedArray(buf.buffer, buf.byteOffset, buf.byteLength);
  const out = new Uint8ClampedArray(src);
  for (const w of list) {
    if (w.amp < 0.5 || w.r < 5) continue;
    const R0 = Math.max(0, w.r - w.w), R1 = w.r + w.w;
    const x0 = Math.max(0, Math.floor(w.x - R1)), x1 = Math.min(W - 1, Math.ceil(w.x + R1));
    const y0 = Math.max(0, Math.floor(w.y - R1 * w.sq)), y1 = Math.min(H - 1, Math.ceil(w.y + R1 * w.sq));
    for (let y = y0; y <= y1; y++) {
      const dy = (y - w.y) / w.sq;
      for (let x = x0; x <= x1; x++) {
        const dx = x - w.x, d = Math.hypot(dx, dy);
        if (d < R0 || d > R1 || d < 1) continue;
        const k = Math.sin(Math.PI * (d - R0) / (R1 - R0));      // 环带中间推得最多
        const s = (d - w.amp * k) / d;
        const sxp = Math.round(w.x + dx * s), syp = Math.round(w.y + dy * s * w.sq);
        if (sxp < 0 || sxp >= W || syp < 0 || syp >= H) continue;
        const o = (y * W + x) * 4, i = (syp * W + sxp) * 4;
        out[o] = src[i]; out[o + 1] = src[i + 1]; out[o + 2] = src[i + 2];
      }
    }
  }
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.putImageData(new ImageData(out, W, H), 0, 0);
  ctx.restore();
}

// —— 代码被打碎：一行代码的每个字符变成一个小刚体，从打击点往外飞、落地弹跳（落地自动配 char_bounce 音效）——
class Shatter {
  // code: Code 实例；line: 被打碎的那一行文字；ta: 打中时刻（动画时间）；hit: 打击点；clock 用来把物理音效换算成真实时间
  constructor({ code, line, row = 0, ta, hit, power = 1, seed = 1, until }) {
    const r = mulberry32(seed), sz = code.size, cw = sz * 0.5, [x0, y0] = code.pos(ta);
    this.size = sz; this.items = [];
    let col = 0;
    for (const [tok, color] of tokenize(line)) {
      for (const ch of tok) {
        if (ch !== ' ') {
          const cx = x0 + (col + 0.5) * cw, cy = y0 + row * sz * 1.32 - sz * 0.32;
          const dx = cx - hit[0], dy = cy - hit[1], d = Math.hypot(dx, dy) + 30;
          const sp = power * (900 + 900 * r()) * Math.min(1, 160 / d + 0.35);
          const b = new Body({ t0: ta, x: cx, y: cy, vx: dx / d * sp + (r() - 0.3) * 300, vy: Math.min(-200, dy / d * sp) - 500 * r() - 300,
            vrot: (r() - 0.5) * 30, r: sz * 0.28, bounce: 0.45, friction: 0.6, sfx: 'char_bounce', until: until || ta + 8, defer: true });
          this.items.push({ ch, color: color || C.white, b });
        }
        col++;
      }
    }
  }
  get bodies() { return this.items.map(i => i.b); }
  draw(ctx, ta) {
    ctx.save(); ctx.font = `400 ${this.size}px Code`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (const it of this.items) {
      if (ta < it.b.t0) continue;
      const [x, y, rot] = it.b.at(ta);
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = rgba(it.color); ctx.fillText(it.ch, 0, 0); ctx.restore();
    }
    ctx.restore();
  }
}

// —— 蓄力：能量球在 (x, y) 聚集，u = 0→1 蓄力进度；吸入的线越来越密，球越来越亮 ——
function charge(ctx, x, y, u, t, o = {}) {
  if (u <= 0) return;
  const { col = C.gold, size = 70, seed = 4 } = o;
  const r = mulberry32(seed * 1000 + Math.floor(t * 30));
  const n = Math.floor(10 + 50 * u);
  ctx.save(); ctx.strokeStyle = rgba(K.mix(col, C.white, 0.5), 0.8); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {             // 往里吸的速度线
    const a = r() * Math.PI * 2, d0 = size * (2.2 + r() * 3.5) * (1.2 - u * 0.4), len = size * (0.5 + r()) * (0.4 + u);
    ctx.lineWidth = 1.5 + r() * 2.5 * u;
    ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * d0, y + Math.sin(a) * d0); ctx.lineTo(x + Math.cos(a) * (d0 - len), y + Math.sin(a) * (d0 - len)); ctx.stroke();
  }
  ctx.restore();
  const pulse = 1 + 0.08 * Math.sin(t * (20 + 40 * u));
  V.glow(ctx, x, y, size * (1.2 + 2.5 * u) * pulse, col, 0.35 + 0.5 * u, 0.2);
  V.glow(ctx, x, y, size * (0.25 + 0.55 * u) * pulse, [255, 250, 230], 0.9, 0.35);
}

module.exports = { Impacts, Shatter, charge, LEVEL };
