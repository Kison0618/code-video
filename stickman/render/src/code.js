// 编程集风格的悬浮代码：逐字打字、光标、Dark+ 配色、选中替换、运行闪烁、报错
// 用法：
//   const c = new Code({ x, y, size })
//   c.type(1.0, 'print("hi")').run(3.2).error(5, 0, 5, 'NameError').clearErr(6)
// 所有操作按时间预先展开成快照，渲染时按 t 取，确定性；每次按键自动登记音效。
'use strict';
const K = require('./core');
const { C, rgba, clamp, mulberry32 } = K;
const cues = require('./cues');

const KW = new Set(['for', 'in', 'while', 'if', 'else', 'elif', 'return', 'import', 'from', 'as', 'break', 'continue', 'pass', 'try', 'except', 'with', 'lambda', 'not', 'and', 'or', 'is']);
const DECL = new Set(['def', 'class', 'True', 'False', 'None']);

// 把一行切成 [文本, 颜色]
function tokenize(line) {
  const out = [];
  const re = /("[^"]*"?|'[^']*'?)|(\d+\.?\d*)|([A-Za-z_]\w*)|([()[\]{}])|(\s+)|(.)/g;
  let m;
  while ((m = re.exec(line))) {
    const [s, str, num, id, br, ws] = m;
    let col = C.op;
    if (str) col = C.str;
    else if (num) col = C.num;
    else if (id) {
      const next = line.slice(re.lastIndex).match(/^\s*\(/);
      if (KW.has(id)) col = C.kw;
      else if (DECL.has(id)) col = [86, 156, 214];
      else if (next) col = C.fn;
      else col = C.var;
    } else if (br) col = C.bracket;
    else if (ws) col = null;
    out.push([s, col]);
  }
  return out;
}

class Code {
  // o: { x, y, size, seed, cps, show:[t0,t1] }
  constructor(o = {}) {
    this.x = o.x ?? 0; this.y = o.y ?? 0; this.size = o.size ?? 64;
    this.cps = o.cps ?? 13;
    this.rand = mulberry32(o.seed ?? 7);
    this.snaps = [{ t: -1e9, text: '', cur: 0, sel: null, err: null, typing: false }];
    this.runs = [];
    this.vis = o.show || [-1e9, 1e9];
    this.sfx = o.sfx ?? true;
    this.moves = [];
    this.bright = o.bright ?? 1;
  }
  last() { return this.snaps[this.snaps.length - 1]; }
  push(t, ch) { this.snaps.push({ ...this.last(), ...ch, t }); }
  key(t, kind = 'key') { if (this.sfx) cues.add(t, kind, { v: 0.6 + this.rand() * 0.4 }); }
  // 逐字输入（若有选中则先替换选中内容）
  type(t, str, cps = this.cps) {
    let s = this.last(), text = s.text, cur = s.cur;
    if (s.sel) { text = text.slice(0, s.sel[0]) + text.slice(s.sel[1]); cur = s.sel[0]; }
    this.push(t, { text, cur, sel: null, err: null, typing: true });
    for (const ch of str) {
      t += (1 / cps) * (0.55 + this.rand() * 0.9) * (ch === ' ' ? 0.7 : 1);
      text = text.slice(0, cur) + ch + text.slice(cur); cur += ch.length;
      this.push(t, { text, cur, typing: true });
      this.key(t, ch === '\n' ? 'key_enter' : ch === ' ' ? 'key_space' : 'key');   // 声音 id 见 audio/音效需求.json
    }
    this.push(t + 0.35, { typing: false });
    this.tEnd = t;
    return this;
  }
  back(t, n = 1, cps = this.cps * 1.6) {
    let s = this.last(), text = s.text, cur = s.cur;
    for (let i = 0; i < n && cur > 0; i++) {
      t += 1 / cps;
      text = text.slice(0, cur - 1) + text.slice(cur); cur--;
      this.push(t, { text, cur, typing: true, err: null, sel: null });
      this.key(t, 'key_back');
    }
    this.push(t + 0.35, { typing: false });
    this.tEnd = t;
    return this;
  }
  set(t, text, cur = text.length) { this.push(t, { text, cur, sel: null, err: null }); return this; }
  cursor(t, cur) { this.push(t, { cur, sel: null }); return this; }
  // 选中一段（深灰块）；之后的 type 会替换它
  select(t, a, b) { this.push(t, { sel: [a, b], cur: b }); this.key(t, 'click'); return this; }
  // 运行：整块盖一层浅灰，dur 秒；sound 默认是原片的"运行"音，跑出错的代码用 'touch2'（只有回车的"啵"，紧接着报错）
  run(t, dur = 0.32, sound = 'run') { this.runs.push({ t, dur }); if (sound) cues.add(t, sound); this.push(t, { typing: false }); return this; }
  // 光标闪烁的"嘀嗒"：原片只在安静的段落里听得到（开头那几秒），所以只在给定时段登记
  blinkSound(t0, t1) {
    let prev = null;
    for (let t = t0; t <= t1; t += 1 / 240) {
      const s = this.snap(t), on = !s.typing && Math.floor((t - s.t) / 0.53) % 2 === 0;
      if (prev !== null && on !== prev) cues.add(t, 'blink', { on });
      prev = on;
    }
    return this;
  }
  error(t, a, b, label = 'NameError') { this.push(t, { err: { a, b, label } }); cues.add(t, 'error'); return this; }
  clearErr(t) { this.push(t, { err: null }); return this; }
  hide(t) { this.vis = [this.vis[0], t]; return this; }
  // 平移整块代码（世界坐标）
  moveTo(t0, t1, x, y, ease = 'inOut3') { this.moves.push({ t0, t1, x, y, ease }); return this; }

  snap(t) {
    const s = this.snaps;
    let lo = 0, hi = s.length - 1;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (s[m].t <= t) lo = m; else hi = m - 1; }
    return s[lo];
  }
  pos(t) {
    let x = this.x, y = this.y;
    for (const m of this.moves) {
      if (t <= m.t0) break;
      const u = K.E[m.ease](clamp((t - m.t0) / (m.t1 - m.t0)));
      x = K.lerp(x, m.x, u); y = K.lerp(y, m.y, u);
    }
    return [x, y];
  }
  // 字符偏移 → 行列
  rc(text, off) {
    const pre = text.slice(0, off).split('\n');
    return [pre.length - 1, pre[pre.length - 1].length];
  }
  layout(ctx) {
    if (!this.cw) { ctx.save(); ctx.font = `400 ${this.size}px Code`; this.cw = ctx.measureText('M').width; ctx.restore(); }
    return { cw: this.cw, lh: this.size * 1.32 };
  }
  // 屏幕上某个字符的位置（给特效和道具用）：返回 [x, 基线 y]
  charPos(ctx, t, off) {
    const s = this.snap(t), { cw, lh } = this.layout(ctx), [x0, y0] = this.pos(t);
    const [r, c] = this.rc(s.text, off);
    return [x0 + c * cw, y0 + r * lh];
  }
  draw(ctx, t, alpha = 1) {
    if (t < this.vis[0] || t > this.vis[1]) return;
    const s = this.snap(t);
    const { cw, lh } = this.layout(ctx), sz = this.size;
    const [x0, y0] = this.pos(t);
    const lines = s.text.split('\n');
    ctx.save();
    ctx.globalAlpha = alpha;
    // 报错底色
    const rect = (a, b, col) => {
      const [r0, c0] = this.rc(s.text, a), [r1, c1] = this.rc(s.text, b);
      ctx.fillStyle = rgba(col);
      for (let r = r0; r <= r1; r++) {
        const ca = r === r0 ? c0 : 0, cb = r === r1 ? c1 : lines[r].length;
        ctx.fillRect(x0 + ca * cw - 2, y0 + r * lh - sz * 0.86, (cb - ca) * cw + 4, sz * 1.12);
      }
    };
    if (s.err) rect(s.err.a, s.err.b, C.err);
    if (s.sel) rect(s.sel[0], s.sel[1], C.sel);
    ctx.font = `400 ${sz}px Code`;
    ctx.textBaseline = 'alphabetic';
    lines.forEach((ln, r) => {
      let cx = x0;
      for (const [tok, col] of tokenize(ln)) {
        if (col) { ctx.fillStyle = rgba(K.mix(C.bg, col, this.bright)); ctx.fillText(tok, cx, y0 + r * lh); }
        cx += tok.length * cw;
      }
    });
    // 光标：白色下划线，打字时常亮，空闲时 1 秒一闪
    const blinkOn = s.typing || Math.floor((t - s.t) / 0.53) % 2 === 0;   // 和 blinkSound 用同一个公式
    if (blinkOn && this.cursorOn !== false) {
      const [r, c] = this.rc(s.text, s.cur);
      ctx.fillStyle = rgba(C.white);
      ctx.fillRect(x0 + c * cw + cw * 0.08, y0 + r * lh + sz * 0.1, cw * 0.84, Math.max(3, sz * 0.075));
    }
    // 报错的小红字
    if (s.err) {
      const [r, c] = this.rc(s.text, s.err.a);
      ctx.font = `400 ${sz * 0.3}px Code`;
      ctx.fillStyle = rgba(C.errText);
      ctx.fillText(s.err.label, x0 + c * cw, y0 + r * lh + sz * 0.62);
    }
    // 运行：浅灰半透明盖住整块
    for (const rn of this.runs) {
      const age = t - rn.t;
      if (age < 0 || age > rn.dur + 0.12) continue;
      const a = age < rn.dur ? 0.62 : 0.62 * (1 - (age - rn.dur) / 0.12);
      const wmax = Math.max(...lines.map(l => l.length), 1);
      ctx.fillStyle = `rgba(200,200,200,${a})`;
      ctx.fillRect(x0 - sz * 0.15, y0 - sz * 0.95, wmax * cw + sz * 0.3, lines.length * lh + sz * 0.05);
    }
    ctx.restore();
  }
}

module.exports = { Code, tokenize };
