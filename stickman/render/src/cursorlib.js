// 《火柴人 VS 光标》共用的东西（剧本 stickman/剧本/火柴人VS光标_剧本.md "效果设计"一节）
//   Cur        第二个光标：趴 _ / 站 | / 方块 █ / 点；跳格走路；闪烁节奏；盯住；加载圈蓄力；头顶打字；被打
//   drawGround 地面 = 一行很淡的字，可以被删出缺口、再撤销回来
//   WordSnake  每一节都可以是不同的字、可以被选中（蓝 / 黄）、可以被一个字一个字删掉的小蛇
//   flyKey     飞着的键帽（键帽对决），撞到终点碎成两半
//   flashback  回忆镜头：把别的场景画进离屏画布，再加灰度 / 暖色、暗角、黑边、颗粒
//   typing 相关：和以前的场景一样（电脑托在手里，单手打）
'use strict';
const K = require('./core');
const { W, H, clamp, lerp, E, rgba } = K;
const PR = require('./props');
const cues = require('./cues');
const { hash } = require('./garble');

const BLUE = [38, 79, 160], YELLOW = [190, 160, 40], WHITE = [245, 245, 245];

class Cur {
  // o: { x, y, form, size, blink, H, show: [t0, t1] }
  constructor(o = {}) {
    this.H = o.H || 300;
    this.pos = [{ t: -1e9, x: o.x ?? 0, y: o.y ?? 0, mode: 'hop' }];
    this.forms = [{ t: -1e9, form: o.form || 'under', size: o.size ?? 0.15 * this.H, dur: 0 }];
    this.blinks = [{ t: -1e9, mode: o.blink || 'irregular' }];
    this.spins = []; this.says = []; this.hits = []; this.fades = [];
    this.show = o.show || [-1e9, 1e9];
    this.sfx = o.sfx ?? true;
  }
  sort(L) { L.sort((a, b) => a.t - b.t); return this; }
  hop(t, x, y, o = {}) { const p = this.posAt(t); this.pos.push({ t, x, y: y ?? p.y, mode: 'hop' }); this.sort(this.pos); if (this.sfx && o.sfx !== false) cues.add(t, 'cursor_hop', { v: o.v ?? 0.6 }); return t; }
  glide(t, dur, x, y, o = {}) { this.pos.push({ t, x, y: y ?? this.posAt(t).y, mode: 'glide', dur, ease: o.ease || 'inOut', arc: o.arc || 0 }); this.sort(this.pos); return t + dur; }
  // 一格一格跳过去：每格 step，间隔 dt（可以是函数：第 k 格的间隔，近处变慢）
  hops(t, x1, o = {}) {
    const p = this.posAt(t), step = o.step ?? 0.4 * this.H, n = Math.max(1, Math.ceil(Math.abs(x1 - p.x) / step));
    let tk = t;
    for (let k = 1; k <= n; k++) { tk += typeof o.dt === 'function' ? o.dt(k, n) : (o.dt ?? 0.12); this.hop(tk, lerp(p.x, x1, k / n), o.y, { v: o.v }); }
    return tk;
  }
  form(t, form, size, dur = 0.1) { const f = this.formAt(t); this.forms.push({ t, form, size: size ?? f.size, dur, from: f.size, fromForm: f.form }); this.sort(this.forms); if (this.sfx && form === 'ibeam' && f.form !== 'ibeam') cues.add(t, 'cursor_stand', { v: 0.6 }); return t + dur; }
  grow(t, size, dur = 0.15) { return this.form(t, this.formAt(t).form, size, dur); }
  blink(t, mode) { this.blinks.push({ t, mode }); this.sort(this.blinks); if (this.sfx && mode === 'solid') cues.add(t, 'cursor_stare', { v: 0.7 }); return t; }
  spin(t0, t1) { this.spins.push({ t0, t1 }); if (this.sfx) cues.add(t0, 'cursor_load', { dur: t1 - t0 }); return t1; }
  say(t, text, o = {}) { this.says.push({ t, text, dur: o.dur ?? 1.2, cps: o.cps ?? 14, size: o.size ?? 0.11 * this.H }); if (this.sfx) for (let i = 0; i < text.length; i++) cues.add(t + i / (o.cps ?? 14), 'key', { v: 0.35 }); return t + text.length / (o.cps ?? 14); }
  hit(t, dir = 1) { this.hits.push({ t, dir }); return t; }
  fade(t0, t1, a0, a1) { this.fades.push({ t0, t1, a0, a1 }); return this; }
  posAt(t) {
    let x = this.pos[0].x, y = this.pos[0].y;
    for (const k of this.pos) {
      if (k.t > t) break;
      if (k.mode === 'hop') { x = k.x; y = k.y; continue; }
      const u = clamp((t - k.t) / k.dur), e = E[k.ease](u);
      const nx = lerp(x, k.x, e), ny = lerp(y, k.y, e) - k.arc * Math.sin(Math.PI * u);
      if (u >= 1) { x = k.x; y = k.y; } else { x = nx; y = ny; break; }
    }
    return { x, y };
  }
  formAt(t) {
    let f = this.forms[0];
    for (const k of this.forms) if (k.t <= t) f = k;
    const u = f.dur > 0 ? E.out(clamp((t - f.t) / f.dur)) : 1;
    return { form: f.form, size: f.from !== undefined ? lerp(f.from, f.size, u) : f.size, since: t - f.t, changed: f.fromForm !== f.form };
  }
  modeAt(t) { let m = this.blinks[0].mode; for (const b of this.blinks) if (b.t <= t) m = b.mode; return m; }
  on(t) {
    const m = this.modeAt(t);
    if (m === 'solid') return true;
    if (m === 'off') return false;
    if (m === 'slow') return ((t % 1) + 1) % 1 < 0.6;
    if (m === 'fast') return Math.floor(t * 12) % 2 === 0;
    if (m === 'sync') return Math.floor(t / 0.53) % 2 === 0;
    return hash(31, Math.floor(t * 6)) < 0.62;                                // irregular
  }
  alphaAt(t) { let a = 1; for (const f of this.fades) if (t >= f.t0) a = lerp(f.a0, f.a1, clamp((t - f.t0) / Math.max(1e-3, f.t1 - f.t0))); return a; }
  // 顶部中心（头顶打字、加载圈、镜头用）
  topAt(t) { const p = this.posAt(t), f = this.formAt(t), h = f.form === 'ibeam' ? f.size : f.form === 'block' ? f.size * 1.25 : Math.max(8, f.size * 0.13); return [p.x, p.y - h]; }
  draw(ctx, t) {
    if (t < this.show[0] || t > this.show[1]) return;
    const a = this.alphaAt(t); if (a <= 0.003) return;
    const p = this.posAt(t), f = this.formAt(t), mode = this.modeAt(t);
    let tilt = 0, dim = 1;
    for (const h of this.hits) { const d = t - h.t; if (d >= 0 && d < 0.35) { const k = Math.exp(-d * 9); tilt += h.dir * 0.35 * k * Math.cos(d * 30); dim = Math.min(dim, 0.35 + 0.65 * clamp(d / 0.2)); } }
    const lit = this.on(t);
    ctx.save(); ctx.globalAlpha *= a;
    if (p.y > -8 && f.form !== 'dot') { ctx.fillStyle = 'rgba(255,255,255,0.10)'; ctx.beginPath(); ctx.ellipse(p.x, 3, Math.max(14, f.size * (f.form === 'ibeam' ? 0.25 : 0.55)), 6, 0, 0, Math.PI * 2); ctx.fill(); }
    if (mode === 'solid') {                                                 // 盯住：一圈淡光
      const c = this.topAt(t), r = f.size * 0.9, g = ctx.createRadialGradient(p.x, (p.y + c[1]) / 2, 0, p.x, (p.y + c[1]) / 2, r);
      g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(p.x - r, (p.y + c[1]) / 2 - r, 2 * r, 2 * r);
    }
    if (lit) {
      ctx.translate(p.x, p.y); ctx.rotate(tilt);
      let pop = 0;
      if (f.form === 'ibeam' && f.changed && f.since < 0.18) pop = -0.18 * f.size * Math.sin(Math.PI * f.since / 0.18);   // 站起来：往上一弹
      ctx.fillStyle = rgba(WHITE.map(v => v * dim));
      const s = f.size;
      if (f.form === 'under') ctx.fillRect(-s / 2, -Math.max(7, s * 0.13), s, Math.max(7, s * 0.13));
      else if (f.form === 'ibeam') { const w = Math.max(7, s * 0.07); ctx.fillRect(-w / 2, -s + pop, w, s); ctx.fillRect(-s * 0.17, -s + pop, s * 0.34, w); ctx.fillRect(-s * 0.17, -w + pop, s * 0.34, w); }
      else if (f.form === 'block') ctx.fillRect(-s / 2, -s * 1.25, s, s * 1.25);
      else ctx.fillRect(-4, -8, 8, 8);
    }
    ctx.restore();
    ctx.save(); ctx.globalAlpha *= a;
    for (const sp of this.spins) {                                          // 加载圈
      if (t < sp.t0 || t > sp.t1 + 0.1) continue;
      const c = this.topAt(t), r = Math.max(22, f.size * 0.16), u = clamp((t - sp.t0) / (sp.t1 - sp.t0)), cy = c[1] - r * 1.8;
      ctx.lineWidth = r * 0.25; ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.arc(p.x, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = t > sp.t1 ? '#fff' : 'rgb(235,235,235)'; ctx.beginPath(); ctx.arc(p.x, cy, r, -Math.PI / 2, -Math.PI / 2 + u * Math.PI * 2); ctx.stroke();
      if (t > sp.t1) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.arc(p.x, cy, r * 1.3, 0, Math.PI * 2); ctx.fill(); }
    }
    for (const s of this.says) {                                            // 头顶打字
      const d = t - s.t; if (d < 0 || d > s.dur + s.text.length / s.cps + 0.3) continue;
      const n = Math.min(s.text.length, Math.floor(d * s.cps) + 1), al = 1 - clamp((d - s.text.length / s.cps - s.dur) / 0.3), c = this.topAt(t);
      PR.word(ctx, s.text.slice(0, n), p.x, c[1] - s.size * 1.1 - (this.spins.some(q => t >= q.t0 && t <= q.t1) ? s.size * 2 : 0), 0, s.size, al);
    }
    ctx.restore();
  }
}

// 地面：一行很淡的字。holes: [{ x0, x1, t0, dur, back, bdur }]——t0 起从右往左一个字一个字删掉，back 起从左往右长回来
const GROUND_TXT = 'for i in range(6): print("#####")   while n < 3: print("hi")   n = n + 1   ';
function charAlive(x, holes, t) {
  for (const h of holes) {
    if (x < h.x0 || x > h.x1 || t < h.t0) continue;
    const u = (h.x1 - x) / Math.max(1, h.x1 - h.x0);                        // 右边先删
    const gone = t >= h.t0 + u * h.dur;
    if (!gone) continue;
    if (h.back !== undefined && t >= h.back + (1 - u) * (h.bdur ?? 0.6)) continue;   // 撤销：左边先回来
    return false;
  }
  return true;
}
function drawGround(ctx, x0, x1, t, o = {}) {
  const holes = o.holes || [], a = o.alpha ?? 0.2, step = 15, sel = o.sel;
  const xs = Math.floor(x0 / step) * step;
  ctx.save(); ctx.font = '400 30px Code'; ctx.textAlign = 'center';
  for (let x = xs, i = Math.floor(x0 / step); x < x1; x += step, i++) {
    if (!charAlive(x, holes, t)) continue;
    if (sel && sel(x, t)) { ctx.fillStyle = rgba(sel(x, t)); ctx.fillRect(x - step / 2, -2, step + 0.5, 34); }
    ctx.fillStyle = `rgba(200,200,200,${a})`; ctx.fillText(GROUND_TXT[((i % GROUND_TXT.length) + GROUND_TXT.length) % GROUND_TXT.length], x, 26);
    ctx.fillStyle = 'rgba(255,255,255,0.13)'; ctx.fillRect(x - step / 2, 0, step + 0.5, 2);
  }
  ctx.restore();
}
const groundAt = (x, holes, t) => charAlive(Math.round(x / 15) * 15, holes, t);

// 小蛇：snake = Snake（只用它的轨迹）；words(k, t) → 这一节此刻的字（'' 表示没有）；hl(k, t) → 底色 [r,g,b] 或 null；n(t) → 节数
class WordSnake {
  constructor(o) { Object.assign(this, { words: () => 'hi', hl: () => null, n: () => 3, size: 46, alpha: () => 1 }, o); }
  segs(t) { return this.snake.segs(t).slice(0, this.n(t)); }
  draw(ctx, t) {
    const g = this.segs(t), a = this.alpha(t);
    if (a <= 0.003) return;
    for (let k = g.length - 1; k >= 0; k--) {
      const q = g[k], w = this.words(k, t); if (!w) continue;
      let r = q.rot; if (Math.cos(r) < 0) r += Math.PI;
      const c = this.hl(k, t);
      if (c) { ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(r); ctx.fillStyle = rgba(c, 0.9 * a); const ww = Math.max(2, w.length) * this.size * 0.52 + 10; ctx.fillRect(-ww / 2, -this.size * 0.55, ww, this.size * 1.1); ctx.restore(); }
      PR.word(ctx, w, q.x, q.y, r, this.size, a);
    }
  }
}
// 一个字一个字删掉（右边先删）：str 在 t0 起每 per 秒少一个字
const eat = (str, t0, t, per = 0.05) => t < t0 ? str : str.slice(0, Math.max(0, str.length - Math.floor((t - t0) / per) - 1));

// 飞着的键帽：from → to，飞行时稍微转，到了碎成两半往下掉
function flyKey(ctx, t, k) {
  if (t < k.t0 || t > k.t1 + 0.5) return;
  const u = clamp((t - k.t0) / (k.t1 - k.t0)), x = lerp(k.from[0], k.to[0], E.out(u)), y = lerp(k.from[1], k.to[1], E.out(u)) - (k.arc ?? 60) * Math.sin(Math.PI * u);
  const size = k.size ?? 64;
  if (t <= k.t1) { PR.keyCombo(ctx, Math.min(t, k.t0 + 0.2), { at: [x, y], size, keys: [{ label: k.label, t: k.t0 }], t1: k.t1 + 9 }); return; }
  const d = t - k.t1;
  for (const s of [-1, 1]) {
    ctx.save(); ctx.translate(x + s * (20 + d * 300), y + d * d * 2600 - d * 300); ctx.rotate(s * d * 8); ctx.globalAlpha = 1 - d / 0.5;
    ctx.fillStyle = '#e8e8e8'; ctx.fillRect(s < 0 ? -size * 0.5 : 0, -size * 0.5, size * 0.5, size); ctx.restore();
  }
}

// 回忆：draw(ctx2) 把要回忆的画面画进离屏画布；mode 'cold'（灰度）| 'warm'（暖色、柔）；k 0~1 是进入程度
let FB = null;
function flashback(ctx, drawSrc, mode, t, k = 1) {
  if (!FB) FB = new K.Canvas(W, H);
  const fc = FB.getContext('2d'); fc.save(); fc.setTransform(1, 0, 0, 1, 0, 0); fc.fillStyle = '#000'; fc.fillRect(0, 0, W, H); drawSrc(fc); fc.restore();
  ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = k;
  ctx.filter = mode === 'warm' ? 'sepia(0.75) saturate(1.2) brightness(1.05) blur(1px)' : 'grayscale(1) contrast(1.15)';
  ctx.drawImage(FB, 0, 0); ctx.filter = 'none';
  const g = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.75)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  const bar = H * 0.1; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, bar); ctx.fillRect(0, H - bar, W, bar);
  ctx.fillStyle = mode === 'warm' ? 'rgba(255,230,200,0.06)' : 'rgba(255,255,255,0.07)';
  const fr = Math.floor(t * 24); for (let i = 0; i < 260; i++) { ctx.fillRect(hash(fr, i) * W, hash(fr + 7, i) * H, 2, 2); }
  ctx.restore();
}
function whiteFlash(ctx, t, t0, frames = 2) { const d = t - t0; if (d < 0 || d > frames / 24) return; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H); ctx.restore(); }

// 打字（电脑托在手里，单手打）——和以前的场景一样
const LW = 150, GRIP_UNDER = [-0.18 * LW, 0.07 * LW], KEYPT = [-0.12 * LW, -0.03 * LW];
function keyRig() {
  const rig = { KEYS: [] };
  rig.tapAt = t => { let d = 0, k = -1; for (let i = 0; i < rig.KEYS.length; i++) { const a = t - rig.KEYS[i]; if (a >= -0.03 && a <= 0.12) { k = i; d += a < 0 ? 0 : a < 0.025 ? a / 0.025 : Math.max(0, 1 - (a - 0.025) / 0.07); } } return { d, k }; };
  rig.keyPoint = t => { const tp = rig.tapAt(t); return [KEYPT[0] + [0, 9, -7, 4][Math.max(0, tp.k) % 4], KEYPT[1] + tp.d * 7]; };
  rig.typing = (a, t) => a.hand('B', t, 'obj', GRIP_UNDER).hand('F', t + 0.05, 'obj', rig.keyPoint);
  rig.oneHand = (a, t) => a.obj(t, 'held', { fwd: 0.24, up: 0.05 }).hand('B', t, 'obj', GRIP_UNDER).hand('F', t + 0.05, 'obj', rig.keyPoint);
  rig.keyTimes = c => { const out = []; for (let i = 1; i < c.snaps.length; i++) if (c.snaps[i].text !== c.snaps[i - 1].text && Math.abs(c.snaps[i].text.length - c.snaps[i - 1].text.length) <= 4) out.push(c.snaps[i].t); return out; };
  return rig;
}

module.exports = { Cur, drawGround, groundAt, charAlive, WordSnake, eat, flyKey, flashback, whiteFlash, keyRig, BLUE, YELLOW, WHITE, LW, GRIP_UNDER, KEYPT };
