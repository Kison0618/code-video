'use strict';
// 《INFP》v3 书页：不配音的《请理解我》原文段，做成「深夜台灯下摊开的一页书」
//   暖黑书房（不是纯黑）：胡桃木桌面 + 左上台灯光锥 + 光里浮尘；书页是有纤维和泛黄边的纸，靠书脊一侧有凹陷阴影，右侧露出书页厚度
//   过程：台灯亮起（闪一下）→ 书从暗处浮上来停稳 → 墨字一行行洇出来 → 荧光笔划过关键句 → 字多的段翻页接第二页
//   全部画在 over 层（不进泛光，字清楚）；cover(t) 给总装用：=1 时整屏被书页盖满
const fs = require('fs');
const K = require('../core');
const { W, H, clamp, lerp, prog, smooth, easeOut, easeInOut, mulberry32, glow, rgba } = K;
const X = require('./pwk');

const TXT = JSON.parse(fs.readFileSync((process.env.INFP_DATA || 'F:/AI/lianai/11_INFP') + '/voice/pages4.json', 'utf8'));
const KEY = { P1: '让自己和自己所爱的人恢复完整', P2: '他们心中的那种孤立感便愈发地强烈起来', P3: '这种快乐必定是以痛苦为代价的想法', P4: '一场正义对决邪恶的战役拉开了序幕', P5: '我就是“知道一切”' };

// ---- 版式 ----
const PW = 880, PH = 1400;               // 一页纸（本地坐标）
const MX = 84, TOP = 210, FS = 44, LH = 82, MAXL = 12, INK = [46, 36, 30];
const CX = 572, CY = 930, ROT = -0.013;  // 书页中心在屏幕上的位置、微微歪一点
const NOSTART = '，。、；：？！”’）》」—…';
const NOEND = '“‘（《「';

const mc = new K.Canvas(8, 8).getContext('2d'); mc.font = `400 ${FS}px Serif`;
const WC = {}; const cw = ch => (WC[ch] ??= mc.measureText(ch).width);

function layout(str) {
  const maxW = PW - 2 * MX, cs = [...str], lines = []; let cur = [], w = 2 * FS; // 首行缩进两字
  let indent = true;
  for (let i = 0; i < cs.length; i++) {
    const ch = cs[i], ww = cw(ch);
    if (w + ww > maxW + 0.5 && cur.length) {
      if (NOSTART.includes(ch)) { cur.push(ch); lines.push({ cs: cur, indent }); cur = []; w = 0; indent = false; continue; }
      let carry = [];
      while (cur.length > 1 && NOEND.includes(cur[cur.length - 1])) carry.unshift(cur.pop());
      lines.push({ cs: cur, indent }); indent = false; cur = carry; w = carry.reduce((s, c) => s + cw(c), 0);
    }
    cur.push(ch); w += ww;
  }
  if (cur.length) lines.push({ cs: cur, indent, last: true });
  // 每个字的位置；除末行外两端对齐
  let k = 0;
  for (const ln of lines) {
    const x0 = ln.indent ? 2 * FS : 0, nat = ln.cs.reduce((s, c) => s + cw(c), 0);
    const extra = ln.last ? 0 : Math.max(0, (maxW - x0 - nat) / Math.max(1, ln.cs.length - 1));
    let x = MX + x0; ln.pos = [];
    for (const c of ln.cs) { ln.pos.push([x, k++]); x += cw(c) + Math.min(extra, FS * 0.6); }
  }
  const sheets = [], ki = str.indexOf(KEY_CUR), k0 = ki < 0 ? -1 : [...str.slice(0, ki)].length, k1 = k0 < 0 ? -1 : k0 + [...KEY_CUR].length;
  const per = Math.ceil(lines.length / Math.ceil(lines.length / MAXL));   // 两张纸行数均分
  for (let i = 0; i < lines.length; i += per) sheets.push({ lines: lines.slice(i, i + per), k0, k1, nTotal: k, end: i + per >= lines.length });
  return { sheets };
}
let KEY_CUR = '';
const LAY = {}; for (const [nm, s] of Object.entries(TXT)) { KEY_CUR = KEY[nm] || '@@'; LAY[nm] = layout(s); }

// ---- 预渲染：纸、背面、桌面 ----
function paperTex(seed, back) {
  const cv = new K.Canvas(PW, PH), x = cv.getContext('2d'), R = mulberry32(seed);
  const base = back ? [226, 214, 190] : [238, 228, 206];
  x.fillStyle = rgba(base); x.fillRect(0, 0, PW, PH);
  const img = x.getImageData(0, 0, PW, PH), d = img.data;
  // 纸纤维：平滑的低频斑驳（双线性插值的网格噪声，不出方块）+ 高频颗粒
  const GN = 24, GR = []; for (let i = 0; i < (GN + 2) * (GN + 2); i++) GR.push(R() * 2 - 1);
  const vn = (u, v) => { const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j, su = fu * fu * (3 - 2 * fu), sv = fv * fv * (3 - 2 * fv), g = (a, b) => GR[(b % (GN + 1)) * (GN + 2) + (a % (GN + 1))];
    return lerp(lerp(g(i, j), g(i + 1, j), su), lerp(g(i, j + 1), g(i + 1, j + 1), su), sv); };
  for (let j = 0; j < PH; j++) for (let i = 0; i < PW; i++) {
    const k = (j * PW + i) * 4;
    const lo = vn(i / 90, j / 90) * 4 + vn(i / 23 + 7, j / 23 + 3) * 1.6;
    const hi = (R() - 0.5) * 9;
    // 泛黄边：离边越近越黄越暗
    const e = Math.min(i, PW - i, j, PH - j), yel = Math.exp(-e / 46) * 20 + Math.exp(-e / 160) * 6;
    d[k] = clamp((base[0] + lo + hi - yel * 0.5) / 255) * 255; d[k + 1] = clamp((base[1] + lo + hi - yel * 1.0) / 255) * 255; d[k + 2] = clamp((base[2] + lo + hi - yel * 1.9) / 255) * 255;
  }
  x.putImageData(img, 0, 0);
  // 几根长纤维 + 几处淡斑
  for (let i = 0; i < 70; i++) { x.strokeStyle = `rgba(150,120,80,${0.05 + R() * 0.06})`; x.lineWidth = 0.8 + R(); const a = R() * 6.28, l = 10 + R() * 30, px = R() * PW, py = R() * PH; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a) * l * 0.5 + 4, py + Math.sin(a) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
  for (let i = 0; i < 6; i++) { const px = R() * PW, py = R() * PH, r = 60 + R() * 140, g = x.createRadialGradient(px, py, 0, px, py, r); g.addColorStop(0, 'rgba(180,140,80,0.05)'); g.addColorStop(1, 'rgba(180,140,80,0)'); x.fillStyle = g; x.fillRect(px - r, py - r, 2 * r, 2 * r); }
  return cv;
}
const PAPER = paperTex(31, false), PAPER2 = paperTex(77, false), BACK = paperTex(53, true);
const DESK = (() => {
  const cv = new K.Canvas(W, H), x = cv.getContext('2d'), R = mulberry32(9);
  // 墙：暖黑
  let g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#1b130f'); g.addColorStop(1, '#120c09'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  // 胡桃木桌面纹理：横向流动的木纹（宽色带 + 年轮弧），整屏铺（书挡住大半）
  const img = x.getImageData(0, 0, W, H), d = img.data;
  for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
    const k = (j * W + i) * 4;
    const u = j * 0.045 + Math.sin(i * 0.004 + j * 0.002) * 2.2 + Math.sin(i * 0.013) * 0.4;
    const ring = Math.pow(Math.abs(Math.sin(u)), 7), fine = Math.sin(j * 0.6 + Math.sin(i * 0.02) * 3) * 0.5 + 0.5;
    const v = 0.55 + 0.25 * fine * 0.4 + ring * 0.35 + (R() - 0.5) * 0.06;
    d[k] = 58 * v; d[k + 1] = 36 * v; d[k + 2] = 24 * v; d[k + 3] = 255;
  }
  x.putImageData(img, 0, 0);
  // 台灯照到的桌面暖斑
  g = x.createRadialGradient(170, 120, 0, 170, 120, 1500); g.addColorStop(0, 'rgba(255,190,120,0.30)'); g.addColorStop(0.45, 'rgba(255,170,100,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalCompositeOperation = 'lighter'; x.fillStyle = g; x.fillRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
  g = x.createRadialGradient(W * 0.6, H * 0.55, H * 0.25, W * 0.6, H * 0.55, H * 0.85); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.65)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  return cv;
})();
const MOTES = (() => { const R = mulberry32(4), o = []; for (let i = 0; i < 46; i++) { const u = R(), v = R(); o.push({ u, v, r: 2 + R() * 5, a: 0.08 + R() * 0.22, ph: R() * 6.28, sp: 0.15 + R() * 0.35 }); } return o; })();

// ---- 时间：首尾相接（间隔 <1.5 秒）的几段合成一个书页时段，中间翻页 ----
const SPAN = [];
for (const p of X.PAGES) {
  if (!LAY[p.name]) continue;
  const prev = SPAN[SPAN.length - 1];
  if (prev && p.a - prev.b < 1.5) { prev.b = p.b; prev.lay = { sheets: [...prev.lay.sheets, ...LAY[p.name].sheets] }; prev.names.push(p.name); }
  else SPAN.push({ ...p, names: [p.name], lay: LAY[p.name] });
}
const cov = (p, t) => K.vis(t, p.a - 0.5, p.b + 0.5, 0.8, 0.7);
function cover(t) { let m = 0; for (const p of SPAN) m = Math.max(m, cov(p, t)); return m; }

// 每张纸的墨迹起点和翻页时间：时段平均分给各张纸
function plan(p) {
  const n = p.lay.sheets.length, T = p.b - p.a + 0.4, out = [];
  for (let i = 0; i < n; i++) {
    const s0 = p.a - 0.1 + (T * i) / n;
    out.push({ ink0: i ? -1e9 : s0, hl0: i ? s0 + 0.9 : null, turn: i < n - 1 ? p.a - 0.1 + (T * (i + 1)) / n - 0.6 : null });
  }
  return { sheets: out, TURN: 1.2 };
}
const CPS = 150;                                           // 墨字洇出速度（字/秒）

function drawSheet(ctx, p, si, t, tex) {
  const so = p.lay.sheets[si], sh = so.lines, pl = plan(p).sheets[si];
  ctx.drawImage(tex, 0, 0);
  // 书页弧度：靠书脊一侧凹下去（暗），中间略鼓（亮），外缘轻微卷起（暗）
  let g = ctx.createLinearGradient(0, 0, PW, 0);
  g.addColorStop(0, 'rgba(70,45,20,0.42)'); g.addColorStop(0.05, 'rgba(70,45,20,0.18)'); g.addColorStop(0.13, 'rgba(70,45,20,0.02)');
  g.addColorStop(0.2, 'rgba(255,250,235,0.0)'); g.addColorStop(0.93, 'rgba(70,45,20,0.0)'); g.addColorStop(1, 'rgba(70,45,20,0.16)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH);
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  g = ctx.createLinearGradient(0, 0, PW, 0); g.addColorStop(0.1, 'rgba(255,240,210,0)'); g.addColorStop(0.17, 'rgba(255,240,210,0.07)'); g.addColorStop(0.3, 'rgba(255,240,210,0)');
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH); ctx.restore();
  // 书眉、页码
  K.text(ctx, '第五章　理想主义者', PW / 2, 118, { size: 26, weight: 400, color: [120, 100, 84], alpha: 0.85, spacing: 0.25 });
  ctx.fillStyle = 'rgba(120,100,84,0.35)'; ctx.fillRect(MX, 142, PW - 2 * MX, 1.2);
  K.text(ctx, String(312 + SPAN.indexOf(p) * 2 + si), PW / 2, PH - 74, { size: 30, family: 'Latin', color: [120, 100, 84], alpha: 0.9 });
  // 正文：墨字洇开（新字先略大略淡，然后收紧变实）
  const kStart = sh[0].pos[0][1];
  ctx.save(); ctx.font = `400 ${FS}px Serif`; ctx.textBaseline = 'alphabetic';
  sh.forEach((ln, li) => {
    const y = TOP + 70 + li * LH;
    ln.cs.forEach((c, ci) => {
      const [x, k] = ln.pos[ci], e = (t - pl.ink0 - (k - kStart) / CPS) / 0.35;
      if (e <= 0) return;
      const u = clamp(e), wet = 1 - u;
      ctx.fillStyle = `rgba(${INK[0]},${INK[1]},${INK[2]},${0.92 * smooth(u)})`;
      if (wet > 0.02) { ctx.save(); ctx.translate(x + FS / 2, y - FS * 0.35); ctx.scale(1 + wet * 0.08, 1 + wet * 0.08); ctx.fillText(c, -FS / 2, FS * 0.35); ctx.restore(); }
      else ctx.fillText(c, x, y);
    });
  });
  ctx.restore();
  // 荧光笔：墨字洇完之后，从左到右划过关键句（multiply，像真的荧光笔压在字上）
  if (so.k0 >= 0) {
    const kEnd = sh[sh.length - 1].pos[sh[sh.length - 1].pos.length - 1][1];
    if (so.k0 >= kStart && so.k0 <= kEnd) {
      const h0 = pl.hl0 != null ? pl.hl0 : pl.ink0 + (kEnd - kStart) / CPS + 0.7, segs = [];
      sh.forEach((ln, li) => { const ps = ln.pos.filter(([, k]) => k >= so.k0 && k < so.k1); if (ps.length) segs.push([ps[0][0] - 6, ps[ps.length - 1][0] + cw(ln.cs[ln.pos.indexOf(ps[ps.length - 1])]) + 6, TOP + 70 + li * LH, ps.length]); });
      const tot = segs.reduce((s, q) => s + q[3], 0); let acc = 0;
      ctx.save(); ctx.globalCompositeOperation = 'multiply';
      for (const [x0, x1, y, n] of segs) {
        const pr = clamp(((t - h0) * 20 - acc) / n); acc += n;
        if (pr <= 0) continue;
        const xe = lerp(x0, x1, easeOut(pr));
        for (let q = 0; q < 3; q++) {
          ctx.fillStyle = `rgba(255,${206 + q * 8},${110 + q * 20},${0.34 - q * 0.06})`;
          ctx.beginPath();
          const j = (q - 1) * 3, top = y - FS * 0.86 + j, bot = y + FS * 0.2 - j;
          ctx.moveTo(x0, top + 2); ctx.quadraticCurveTo((x0 + xe) / 2, top - 3 + q, xe, top + 1);
          ctx.lineTo(xe + 4, (top + bot) / 2); ctx.lineTo(xe, bot);
          ctx.quadraticCurveTo((x0 + xe) / 2, bot + 3 - q, x0, bot - 1); ctx.lineTo(x0 - 4, (top + bot) / 2); ctx.closePath(); ctx.fill();
        }
      }
      ctx.restore();
    }
  }
  // 最后一张：出处
  if (so.end) {
    const lastK = so.nTotal - 1, e = clamp((t - pl.ink0 - (lastK - kStart) / CPS - 0.3) / 0.5);
    K.text(ctx, '——《请理解我》', PW - MX, TOP + 70 + (sh.length + 0.9) * LH, { size: 34, color: [110, 86, 70], alpha: e, align: 'right' });
  }
}

function drawBook(ctx, p, t) {
  const pl = plan(p), sheets = pl.sheets;
  // 当前是第几张、翻页进度
  let si = 0, tp = -1;
  for (let i = 0; i < sheets.length; i++) if (sheets[i].turn != null && t >= sheets[i].turn) { const u = (t - sheets[i].turn) / pl.TURN; if (u >= 1) si = i + 1; else { si = i; tp = u; } }
  // 书的投影 + 书页厚度（右侧、底部露出一叠纸边）
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.75)'; ctx.shadowBlur = 70; ctx.shadowOffsetX = 18; ctx.shadowOffsetY = 34;
  ctx.fillStyle = '#d9c9a8'; ctx.fillRect(-700, -6, PW + 700 + 18, PH + 22);
  ctx.restore();
  for (let i = 7; i >= 1; i--) { const c = 214 - i * 9; ctx.fillStyle = `rgb(${c},${c - 12},${c - 32})`; ctx.fillRect(PW - 4 + i * 2.4, i * 1.3, 4, PH + i * 1.1); ctx.fillRect(-700, PH - 2 + i * 2.2, PW + 700 + i * 2.4, 3); }
  // 左页（只露出一窄条，字淡、在书脊阴影里）
  ctx.save(); ctx.beginPath(); ctx.rect(-700, 0, 700, PH); ctx.clip();
  ctx.translate(-PW, 0); ctx.drawImage(PAPER2, 0, 0);
  const left = LAY.P1.sheets[0].lines;
  ctx.font = `400 ${FS}px Serif`; ctx.fillStyle = 'rgba(46,36,30,0.55)';
  left.forEach((ln, li) => ln.cs.forEach((c, ci) => ctx.fillText(c, ln.pos[ci][0], TOP + 70 + li * LH)));
  let g = ctx.createLinearGradient(PW - 160, 0, PW, 0); g.addColorStop(0, 'rgba(60,38,18,0)'); g.addColorStop(1, 'rgba(60,38,18,0.6)'); ctx.fillStyle = g; ctx.fillRect(PW - 160, 0, 160, PH);
  ctx.restore();
  // 右页：翻页中 = 下面那张先画，上面那张裁到折线左边，再画翻过来的背面
  if (tp < 0) { drawSheet(ctx, p, si, t, si % 2 ? PAPER2 : PAPER); }
  else {
    const u = easeInOut(tp), fx = lerp(PW + 40, -20, u), lean = Math.sin(Math.PI * u) * 120; // 折线 x，顶部比底部领先
    drawSheet(ctx, p, si + 1, t, (si + 1) % 2 ? PAPER2 : PAPER);
    // 折线（上端 fx-lean，下端 fx+lean*0.3）
    const xt = fx - lean, xb = fx + lean * 0.3;
    ctx.save(); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(xt, 0); ctx.lineTo(xb, PH); ctx.lineTo(0, PH); ctx.closePath(); ctx.clip();
    drawSheet(ctx, p, si, t, si % 2 ? PAPER2 : PAPER); ctx.restore();
    // 翻起来的背面：把折线右边那块镜像到左边
    const wt = PW - xt, wb = PW - xb;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(xt, 0); ctx.quadraticCurveTo(xt - wt * 0.55, -18 * Math.sin(Math.PI * u), Math.max(0, xt - wt), 0 + 10);
    ctx.lineTo(Math.max(0, xb - wb), PH - 6); ctx.quadraticCurveTo(xb - wb * 0.5, PH + 10, xb, PH); ctx.closePath();
    ctx.shadowColor = 'rgba(40,25,10,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetX = -14;
    ctx.fillStyle = '#e2d6be'; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.clip(); ctx.drawImage(BACK, xt - wt, 0, wt + 10, PH);
    g = ctx.createLinearGradient(xt, 0, xt - wt, 0); g.addColorStop(0, 'rgba(90,60,30,0.28)'); g.addColorStop(0.3, 'rgba(255,245,225,0.10)'); g.addColorStop(1, 'rgba(90,60,30,0.12)');
    ctx.fillStyle = g; ctx.fillRect(0, -30, PW, PH + 60);
    ctx.restore();
    // 折线右侧落在下一页上的阴影
    ctx.save(); ctx.beginPath(); ctx.moveTo(xt, 0); ctx.lineTo(PW + 60, 0); ctx.lineTo(PW + 60, PH); ctx.lineTo(xb, PH); ctx.closePath(); ctx.clip();
    g = ctx.createLinearGradient(fx, 0, fx + 160, 0); g.addColorStop(0, `rgba(50,30,10,${0.35 * Math.sin(Math.PI * u)})`); g.addColorStop(1, 'rgba(50,30,10,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, PW + 60, PH); ctx.restore();
  }
}

function draw(ctx, t) {
  for (const p of SPAN) {
    const a = cov(p, t); if (a <= 0.003) continue;
    const t0 = p.a - 0.5;
    // 台灯：亮起时闪一下
    const on = smooth(prog(t, t0, t0 + 0.5)) * (1 - 0.35 * Math.exp(-((t - t0 - 0.28) ** 2) / 0.002)) * (1 - 0.25 * smooth(prog(t, p.b, p.b + 0.5)));
    ctx.save(); ctx.globalAlpha = a;
    ctx.drawImage(DESK, 0, 0);
    // 书：从暗处浮上来停稳；离场时轻轻往前推
    const rise = easeOut(prog(t, t0, t0 + 1.7)), out = smooth(prog(t, p.b - 0.2, p.b + 0.5));
    const s = lerp(1.05, 1, rise) * (1 + 0.035 * out);
    ctx.save(); ctx.translate(CX, CY + (1 - rise) * 26); ctx.rotate(ROT * (1 + (1 - rise) * 0.6)); ctx.scale(s, s); ctx.translate(-PW / 2, -PH / 2);
    drawBook(ctx, p, t);
    ctx.restore();
    // 台灯光：整体压暗远端（multiply）+ 左上暖光 + 光锥里的浮尘
    ctx.save(); ctx.globalCompositeOperation = 'multiply';
    let g = ctx.createRadialGradient(140, 60, 80, 140, 60, 2100);
    const d = lerp(0.35, 1, on);
    g.addColorStop(0, `rgb(${255 * d | 0},${246 * d | 0},${226 * d | 0})`); g.addColorStop(0.55, `rgb(${210 * d | 0},${186 * d | 0},${160 * d | 0})`); g.addColorStop(1, `rgb(${120 * d | 0},${96 * d | 0},${80 * d | 0})`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.save(); ctx.translate(120, 40); ctx.rotate(0.9); ctx.scale(1, 0.42);
    g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1900); g.addColorStop(0, `rgba(255,200,130,${0.2 * on})`); g.addColorStop(0.5, `rgba(255,200,130,${0.06 * on})`); g.addColorStop(1, 'rgba(255,200,130,0)');
    ctx.fillStyle = g; ctx.fillRect(-1900, -1900, 3800, 3800); ctx.restore();
    for (const m of MOTES) {
      const u = (m.u + t * m.sp * 0.03) % 1, v = m.v, x = lerp(60, W, u) * (0.4 + 0.6 * v) + 30 * Math.sin(t * 0.3 + m.ph), y = lerp(40, H * 0.85, u) * (0.5 + 0.5 * (1 - v)) + 20 * Math.cos(t * 0.25 + m.ph);
      glow(ctx, x, y, m.r * 3, [255, 214, 160], m.a * on * (0.6 + 0.4 * Math.sin(t * 1.3 + m.ph)));
    }
    ctx.restore();
    // 暂停提示：书完全摊开后，书顶上方轻轻亮两下
    const ha = smooth(prog(t, p.a + 0.6, p.a + 1.1)) * (1 - smooth(prog(t, p.b - 0.6, p.b))), pulse = 0.75 + 0.25 * Math.cos((t - p.a) * 4.2);
    if (ha > 0.01) {
      const y = 150; ctx.save(); ctx.globalAlpha = a * ha;
      ctx.fillStyle = 'rgba(20,14,10,0.55)'; ctx.beginPath(); ctx.roundRect(W / 2 - 150, y - 42, 300, 64, 32); ctx.fill();
      ctx.fillStyle = `rgba(255,222,170,${0.95 * pulse})`; ctx.fillRect(W / 2 - 112, y - 22, 8, 26); ctx.fillRect(W / 2 - 98, y - 22, 8, 26);
      ctx.restore();
      K.text(ctx, '可暂停阅读', W / 2 + 18, y + 2, { size: 32, weight: 500, color: [255, 228, 186], alpha: a * ha * pulse, spacing: 0.12 });
    }
    ctx.restore();
  }
}
module.exports = { draw, cover, SPAN, LAY };
