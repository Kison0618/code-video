// 基础：画布尺寸、数学、缓动、颜色、可重复的随机数、时间轴取值
// 整个工程没有“状态”：window.render(t) 只由时间 t 决定画面，所以可以任意跳帧、多进程分段渲染。
'use strict';
const W = 1920, H = 1080, FPS = 30;

const clamp = (x, a, b) => x < a ? a : x > b ? b : x;
const sat = x => x < 0 ? 0 : x > 1 ? 1 : x;
const lerp = (a, b, k) => a + (b - a) * k;
const seg = (t, a, b) => b <= a ? (t >= b ? 1 : 0) : sat((t - a) / (b - a));       // t 在 a→b 之间走到哪了（0..1）
const E = {
  out: x => 1 - Math.pow(1 - sat(x), 3),
  in: x => Math.pow(sat(x), 3),
  io: x => { x = sat(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; },
  out2: x => 1 - (1 - sat(x)) * (1 - sat(x)),
  io2: x => { x = sat(x); return x * x * (3 - 2 * x); },
  back: x => { x = sat(x); const c = 1.5; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};
// 出现→停留→消失 的包络：a 开始进，b 进完，c 开始退，d 退完
const env = (t, a, b, c, d) => Math.min(seg(t, a, b), 1 - seg(t, c, d));
const pulse = (t, t0, up, down) => t < t0 ? 0 : t < t0 + up ? (t - t0) / up : Math.max(0, 1 - (t - t0 - up) / down);

// 可重复随机
function hash(n) { n = (n ^ 61) ^ (n >>> 16); n = n + (n << 3); n = n ^ (n >>> 4); n = Math.imul(n, 0x27d4eb2d); n = n ^ (n >>> 15); return (n >>> 0) / 4294967296; }
const hash2 = (x, y) => hash((x * 73856093) ^ (y * 19349663));
const hash3 = (x, y, z) => hash((x * 73856093) ^ (y * 19349663) ^ (z * 83492791));
function vnoise(x, y) {                                   // 平滑噪声 0..1
  const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
  return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
}

// 颜色
function C(hex) { const n = parseInt(hex.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const mixc = (a, b, k) => [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k];
const mul = (a, k) => [a[0] * k, a[1] * k, a[2] * k];
const css = (c, a) => a === undefined || a >= 1 ? `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})` : `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;

// 全片共用的几种颜色
const PAL = {
  bg: C('#07080d'),
  ink: C('#f3ead8'),          // 字
  dim: C('#8d8a85'),
  gold: C('#ffc45a'),         // 关键色：没被换掉的东西、被传下去的东西
  goldDeep: C('#e89a2a'),
  hot: C('#ff6a4d'),          // 提醒：被换掉 / 被骗
  cool: C('#7fb6ff'),
};
const FONT = {
  serif: (px, w) => `${w || 700} ${px}px "Noto Serif SC","Source Han Serif SC","Songti SC","SimSun",serif`,
  sans: px => `500 ${px}px "Noto Sans SC","Source Han Sans SC","PingFang SC","Microsoft YaHei",sans-serif`,
  mono: (px, w) => `${w || 500} ${px}px "JetBrains Mono","Consolas",monospace`,
};

// ---------- 时间轴：只从 timing.js 取，不写死秒数 ----------
const TL = (() => {
  const T = window.TIMING, L = window.LINES, strip = s => s.replace(/[\s，。、？！“”‘’：；,.?!:;"'{}《》（）()·…—\-]/g, '');
  const plain = {}; L.forEach(l => plain[l.id] = strip(l.text));
  const g = id => { const x = T.lines[id]; if (!x) throw new Error('没有这句：' + id); return x; };
  return {
    total: T.total, audio: T.audio, lines: L,
    s: id => g(id).s, e: id => g(id).e,
    // 这句话里某个词开始 / 结束的时间
    at(id, word, nth) { const i = idxOf(plain[id], word, nth); return i < 0 ? g(id).s : g(id).c[i]; },
    end(id, word, nth) { const p = plain[id], i = idxOf(p, word, nth); if (i < 0) return g(id).e; const j = i + word.length; return j < p.length ? g(id).c[j] : g(id).e; },
    idx(t) { let r = -1; for (let i = 0; i < L.length; i++) if (T.lines[L[i].id].s <= t) r = i; return r; },
  };
  function idxOf(p, w, nth) { let i = -1; for (let k = 0; k <= (nth || 0); k++) i = p.indexOf(w, i + 1); return i; }
})();
const s_ = TL.s, e_ = TL.e;
