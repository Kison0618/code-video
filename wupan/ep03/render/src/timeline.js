// 时间线：读第三集全片配音的时间轴，画面和字幕全部按句 id 取时间：TL.L('017').t0 / TL.at('017','空了一块')
//   默认 ep03/voice/lines_timed.json（真配音）；还没出来时用 voice/lines_timed_est.json（估算）
//   也可以用环境变量 LINES_TIMED=相对 voice/ 的路径 强制指定
// 逐字时间：align = exact 的句子用对齐出的汉字时刻；align = even（或缺字）的句子按标点和字数在整句里均分
'use strict';
const fs = require('fs');
const path = require('path');

const EP = path.join(__dirname, '..', '..');
const pick = () => {
  if (process.env.LINES_TIMED) return path.join(EP, 'voice', process.env.LINES_TIMED);
  const real = path.join(EP, 'voice', 'lines_timed.json');
  return fs.existsSync(real) ? real : path.join(EP, 'voice', 'lines_timed_est.json');
};
const FILE = pick();
const SRC = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const AUDIO = SRC.audio ? path.join(EP, SRC.audio) : null;
const EST = !AUDIO;

const ALL = SRC.lines.map(l => ({ id: l.id, role: l.role, text: l.text, t0: l.start, t1: l.end, chars: l.chars || null, align: l.align || (l.chars ? 'exact' : 'even') }));
const BY = Object.fromEntries(ALL.map(l => [l.id, l]));
const L = id => { if (!BY[id]) throw new Error('[TL] 没有句子 ' + id); return BY[id]; };
const LINES = ALL;
const LAST = ALL[ALL.length - 1];
const TAIL = 1.6;                                  // 033 说完后「误判」印章停留
const DUR = +(LAST.t1 + TAIL).toFixed(2);
const isHan = c => c >= '\u4e00' && c <= '\u9fff';

// 均分权重：汉字 1；英文字母 0.45；逗号顿号冒号 1.2（停顿）；句号问号叹号分号 2；引号书名号 0
function weight(c) {
  if (isHan(c)) return 1;
  if (/[A-Za-z0-9]/.test(c)) return 0.45;
  if (/[，、：,:]/.test(c)) return 1.2;
  if (/[。？！；?!;]/.test(c)) return 2;
  return 0;
}
// 每个字符（含标点）开始的时刻：按权重在 [t0, t1] 里均分。句末标点的停顿不算进句长
function evenTimes(l) {
  const cs = [...l.text];
  let end = cs.length; while (end > 0 && !isHan(cs[end - 1]) && !/[A-Za-z0-9]/.test(cs[end - 1])) end--;
  const ws = cs.map((c, i) => (i < end ? weight(c) : 0)), tot = ws.reduce((a, b) => a + b, 0) || 1;
  const out = []; let acc = 0;
  for (let i = 0; i < cs.length; i++) { out.push(l.t0 + (l.t1 - l.t0) * acc / tot); acc += ws[i]; }
  out.push(l.t1);
  return out;
}
// 每个字符开始的时刻（长度 = 字符数 + 1，最后一个 = 句末）
function charTimesAll(l) {
  if (l._ca) return l._ca;
  const cs = [...l.text], ev = evenTimes(l);
  let ts = ev;
  if (l.align === 'exact' && l.chars) {
    const n = cs.filter(isHan).length;
    if (l.chars.length === n && l.chars.every(v => v != null)) {
      // 汉字用对齐时刻；非汉字（标点、字母）夹在前后汉字之间按均分比例插值
      const han = []; cs.forEach((c, i) => { if (isHan(c)) han.push(i); });
      ts = cs.map((c, i) => null); han.forEach((i, k) => { ts[i] = l.chars[k]; });
      ts.push(l.t1);
      for (let i = 0; i < cs.length; i++) if (ts[i] == null) {
        let a = i - 1; while (a >= 0 && ts[a] == null) a--;
        let b = i + 1; while (b < ts.length && ts[b] == null) b++;
        const ta = a >= 0 ? ts[a] : l.t0, tb = ts[b];
        const ea = a >= 0 ? ev[a] : l.t0, eb = ev[b];
        ts[i] = eb > ea ? ta + (tb - ta) * (ev[i] - ea) / (eb - ea) : ta;
      }
    }
  }
  l._ca = ts; return ts;
}
// 兼容旧接口：只取汉字的时刻
function charTimes(l) { const cs = [...l.text], a = charTimesAll(l); return cs.map((c, i) => [c, a[i]]).filter(([c]) => isHan(c)).map(([, t]) => t); }
// 某句里某个词开始的时刻（nth = 第几次出现）
function at(id, word, nth = 0) {
  const l = L(id), cs = [...l.text], s = cs.join('');
  let i = -1;
  for (let k = 0; k <= nth; k++) { i = s.indexOf(word, i + 1); if (i < 0) break; }
  if (i < 0) { console.warn(`[TL] ${id} 里找不到「${word}」`); return l.t0; }
  const ci = [...s.slice(0, i)].length;
  return charTimesAll(l)[ci];
}
// 某句里某个词结束的时刻
function end(id, word, nth = 0) {
  const l = L(id), s = l.text;
  let i = -1; for (let k = 0; k <= nth; k++) { i = s.indexOf(word, i + 1); if (i < 0) break; }
  if (i < 0) return l.t1;
  return charTimesAll(l)[[...s.slice(0, i)].length + [...word].length];
}
const span = (a, b, pre = 0.3, post = 0.3) => [L(a).t0 - pre, L(b).t1 + post];

// 字幕：长句按标点切成一行一块（每行 ≤ 16 字），每块的起止 = 它第一个字 / 最后一个字之后的时刻
const MAX = 16;
const PUN = /[，。：、？！；“”"《》\s]/g;
const len = s => [...s.replace(PUN, '')].length;
function chunks(s) {
  const parts = s.match(/[^。？！；]+[。？！；]*/g) || [s];
  const out = [];
  for (const p of parts) {
    if (len(p) <= MAX) { out.push(p); continue; }
    const sub = p.match(/[^，、：]+[，、：]?/g);
    let cur = '';
    for (const q of sub) {
      if (cur && len(cur + q) > MAX) { out.push(cur); cur = q; } else cur += q;
    }
    if (cur) out.push(cur);
  }
  // 太短的块（≤3 字）并到前一块或后一块
  const merged = []; let carry = '';
  for (let k = 0; k < out.length; k++) {
    const c = carry + out[k]; carry = '';
    if (len(c) <= 3 && k < out.length - 1 && len(c + out[k + 1]) <= MAX + 2) { carry = c; continue; }
    if (merged.length && len(c) <= 3 && len(merged[merged.length - 1] + c) <= MAX + 3) merged[merged.length - 1] += c;
    else merged.push(c);
  }
  if (carry) merged.push(carry);
  return merged;
}
// 显示用：去掉块尾的逗号顿号冒号分号句号，保留问号叹号；去掉成对不全的引号
function clean(c) {
  let s = c.replace(/[，、：；。]+$/, '');
  const q = (s.match(/[“”]/g) || []).length;
  if (q % 2) s = s.replace(/[“”]/g, '');
  return s;
}
const CAPS = [];
for (const l of LINES) {
  const cs = chunks(l.text), ta = charTimesAll(l);
  let ci = 0;
  cs.forEach((c, i) => {
    const n = [...c].length;
    // 起点 = 第一个“发音字符”的时刻；终点 = 最后一个发音字符之后（下一字符的起点）
    let a = ci; while (a < ci + n - 1 && weight([...l.text][a]) === 0) a++;
    let b = ci + n; while (b > a + 1 && !(isHan([...l.text][b - 1]) || /[A-Za-z0-9]/.test([...l.text][b - 1]))) b--;
    const t0 = i === 0 ? l.t0 : ta[a];
    const t1 = i === cs.length - 1 ? l.t1 : Math.min(ta[b] + 0.12, ta[ci + n]);
    CAPS.push({ id: l.id, k: i, s: clean(c), t0, t1 });
    ci += n;
  });
}
// 识别核对后的修正（check_subs.py --fix 写的）：覆盖个别块的起止
const FIXF = path.join(path.dirname(FILE), 'caps_fix.json');
if (!EST && fs.existsSync(FIXF) && fs.statSync(FIXF).mtimeMs > fs.statSync(FILE).mtimeMs) {
  const fx = JSON.parse(fs.readFileSync(FIXF, 'utf8'));
  for (const c of CAPS) { const f = fx[`${c.id}#${c.k}`]; if (f && f.s === c.s) { c.t0 = f.t0; c.t1 = f.t1; c.fixed = true; } }
}
// 字幕留到下一块开始（最多多留 0.6 秒）；最后一句留到片尾
CAPS.forEach((c, i) => { const nx = CAPS[i + 1]; c.out = nx ? Math.min(nx.t0, c.t1 + 0.6) : DUR; });

module.exports = { DUR, LINES, L, CAPS, AUDIO, EST, FILE, at, end, span, charTimes, charTimesAll, inCard: () => false, CARDS: [] };
if (require.main === module) {
  console.log('file', FILE, 'DUR', DUR, 'audio', AUDIO);
  for (const c of CAPS) console.log(c.id, c.t0.toFixed(2), c.t1.toFixed(2), c.out.toFixed(2), c.s);
}
