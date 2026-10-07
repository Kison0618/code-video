// 第零幕 冷开场 + 第一幕 祖先（0–97 秒）
'use strict';
const K = require('../core');
const { W, H, C, clamp, lerp, prog, smooth, easeInOut, easeOut, easeIn, easeOutExpo, vis, glow, glowLine, line, partial, text, fmt, mulberry32, rgba, mix } = K;
const TL = require('../timeline');
const UI = require('../ui');

const YOU = [1620, 540];
const events = [];

// ———————————— 第零幕：线 ————————————
function threadY(x, t) {
  return 540 + 5 * Math.sin(x * 0.011 - t * 0.9) + 2.5 * Math.sin(x * 0.037 + t * 0.5);
}
function headX(t) {
  if (t < 23.5) return lerp(240, 1380, easeInOut(prog(t, 3, 21.5)));
  return lerp(1380, 2100, easeIn(prog(t, 23.5, 25.8)));
}
// 心跳时，一道亮光从"你"沿线向过去传播
function beatWave(x, hx, t) {
  let b = 0;
  for (const hb of TL.HEARTBEATS) {
    const d = t - hb;
    if (d < 0 || d > 3) continue;
    const pos = hx - d * 650;
    b += Math.exp(-Math.pow((x - pos) / 60, 2)) * Math.exp(-d * 0.9);
  }
  return b;
}
function drawOpenThread(ctx, t, alpha) {
  const hx = headX(t);
  const x0 = -30, step = 6;
  // 分段描线，越接近"你"越亮
  const seg = 48;
  for (let sx = x0; sx < hx; sx += seg) {
    const pts = [];
    for (let x = sx; x <= Math.min(sx + seg, hx); x += step) pts.push([x, threadY(x, t)]);
    if (pts.length < 2) pts.push([Math.min(sx + seg, hx), threadY(Math.min(sx + seg, hx), t)]);
    const mid = sx + seg / 2;
    const a = (0.16 + 0.84 * Math.exp(-(hx - mid) / 650)) + 0.9 * beatWave(mid, hx, t);
    glowLine(ctx, pts, C.gold, clamp(a) * alpha, 1.4);
  }
  return hx;
}
function drawHead(ctx, x, y, t, a, scale = 1) {
  if (a <= 0) return;
  const h = TL.heart(t);
  glow(ctx, x, y, 120 * scale * (1 + 0.35 * h), C.amber, 0.28 * a);
  glow(ctx, x, y, 40 * scale * (1 + 0.3 * h), C.gold, 0.9 * a);
  glow(ctx, x, y, 12 * scale, C.ivory, a);
  // 微小的火花向后飘散
  const r = mulberry32(3);
  for (let i = 0; i < 26; i++) {
    const ph = r(), sp = 0.35 + r() * 0.5, life = ((t * sp + ph) % 1);
    const px = x - life * (80 + r() * 140) * scale;
    const py = y + (r() - 0.5) * 26 * life * scale + Math.sin(t * 2 + i) * 3;
    glow(ctx, px, py, 3.5 * scale, C.gold, a * 0.7 * (1 - life));
  }
}

function drawOpening(ctx, t) {
  if (t > 36.5) return;
  const fadeAll = 1 - smooth(prog(t, 34.2, 36.2));
  // 片名期间与开场的镜头推近
  const z = 1 + 0.1 * easeInOut(prog(t, 14.5, 21.5)) - 0.1 * easeInOut(prog(t, 23.0, 25.0));
  const hxNow = headX(t);
  const fx = Math.min(hxNow, 1380), fy = 540;
  ctx.save();
  ctx.translate(fx, fy); ctx.scale(z, z); ctx.translate(-fx, -fy);
  const lineA = smooth(prog(t, 0.6, 3.2)) * fadeAll;
  const hx = drawOpenThread(ctx, t, lineA);
  const headA = smooth(prog(t, 0.4, 2.4)) * (1 - smooth(prog(t, 24.8, 25.8)));
  drawHead(ctx, hx, threadY(hx, t), t, headA);
  // "你"
  const ya = vis(t, 18.6, 24.6, 0.9, 0.8);
  if (ya > 0) {
    text(ctx, '你', hx, 470, { size: 44, weight: 300, alpha: ya, color: C.ivory });
    text(ctx, 'YOU', hx, 498, { size: 13, family: 'Mono', weight: 300, alpha: 0.5 * ya, spacing: 0.4 });
    line(ctx, [[hx, 510], [hx, 526]], C.gold, 0.5 * ya, 1);
  }
  ctx.restore();

  // HUD：未中断的年数
  const ha = vis(t, 3.4, 23.2, 1.0, 0.8);
  const yrs = 4e9 * easeOutExpo(prog(t, 3.6, 13.6));
  UI.hud(ctx, ha, { label: '未中断', en: 'UNBROKEN', value: (t > 13.4 ? '≈ ' : '') + fmt(yrs) + ' 年', valueEn: 'YEARS' });

  // 片名
  const ta = vis(t, 24.0, 34.6, 1.0, 1.6);
  if (ta > 0) {
    const title = '生命之美';
    [...title].forEach((ch, i) => {
      const a = ta * smooth(prog(t, 24.2 + i * 0.28, 25.6 + i * 0.28));
      const dx = (i - 1.5) * 150;
      text(ctx, ch, W / 2 + dx, 478, { size: 108, weight: 200, alpha: a, glowA: 0.12 * (1 - smooth(prog(t, 25, 28))) });
    });
    const sa = ta * smooth(prog(t, 26.2, 27.8));
    text(ctx, '一条从未断过的线', W / 2, 622, { size: 30, weight: 300, color: C.gold, alpha: sa, spacing: 0.5 });
    text(ctx, 'THE BEAUTY OF LIFE  ·  AN UNBROKEN THREAD', W / 2, 662, { size: 14, family: 'Mono', weight: 300, alpha: 0.5 * sa, spacing: 0.45 });
  }
}

// ———————————— 第一幕：族谱 ————————————
const GMAX = 30;
const GX = g => YOU[0] - 1380 * (1 - Math.pow(0.88, g)) / (1 - Math.pow(0.88, GMAX));
const GH = g => 400 * (1 - Math.pow(0.58, g));
const GY = (g, i) => 540 + GH(g) * (((i + 0.5) / Math.pow(2, g)) * 2 - 1);
const GEN_T = g => (g === 1 ? 36.8 : g === 2 ? 38.6 : g === 3 ? 40.4 : g <= 7 ? 43.2 + (g - 4) * 0.6 : 45.2 + (g - 7) * 0.16);
const GE = 6; // 画出连线的最远一代
for (let g = 1; g <= GE; g++) events.push({ t: GEN_T(g), type: 'gen', g });
const GEN_LABEL = ['', '父母', '祖父母', '曾祖父母'];

// 金色路径：每一代随机选父或母
const PATH = [0];
{ const r = mulberry32(11); for (let g = 1; g <= GMAX; g++) { const pos = (PATH[g - 1] + 0.5) / Math.pow(2, g - 1); const up = pos < 0.5 ? r() < 0.72 : r() < 0.28; PATH.push(PATH[g - 1] * 2 + (up ? 1 : 0)); } }
const PATH_PTS = (() => {
  const pts = [YOU];
  for (let g = 1; g <= GMAX; g++) {
    const [x0, y0] = pts[pts.length - 1];
    const x1 = GX(g), y1 = GY(g, PATH[g]);
    for (let k = 1; k <= 8; k++) { const u = k / 8, e = smooth(u); pts.push([lerp(x0, x1, u), lerp(y0, y1, e)]); }
  }
  return pts;
})();
function bez(x0, y0, x1, y1, n = 14) {
  const pts = [];
  for (let k = 0; k <= n; k++) { const u = k / n; pts.push([lerp(x0, x1, u), lerp(y0, y1, smooth(u))]); }
  return pts;
}
// 远代祖先：一片渐密的星云（第 8–30 代）
const DUST = (() => {
  const r = mulberry32(5), out = [];
  for (let k = 0; k < 9000; k++) {
    const u = Math.pow(r(), 0.7);            // 越往左越密
    const gf = GE + 0.5 + u * (GMAX - GE - 0.5);
    const g = Math.floor(gf);
    const x = GX(gf) + (r() - 0.5) * 6;
    const gy = (r() + r() + r() - 1.5) / 1.5; // 近似高斯
    const y = 540 + GH(gf) * 1.05 * gy;
    out.push({ g: Math.max(GE + 1, g), x, y, a: 0.2 + r() * 0.6, s: r() < 0.08 ? 2.2 : 1.3 });
  }
  return out;
})();

function drawPedigree(ctx, t) {
  if (t < 34.5 || t > 66) return;
  const fade = smooth(prog(t, 34.6, 36.2)) * (1 - smooth(prog(t, 60.8, 63.0)));
  const dimOthers = 1 - 0.68 * smooth(prog(t, 50.8, 53.0));
  // 边
  ctx.save();
  ctx.lineCap = 'round';
  for (let g = 1; g <= GE; g++) {
    const tg = GEN_T(g);
    if (t < tg) break;
    const f = easeOut(prog(t, tg, tg + (g <= 3 ? 0.9 : 0.5)));
    const ea = (0.6 * Math.pow(0.85, g) + 0.1) * fade * dimOthers;
    const n = Math.pow(2, g);
    ctx.strokeStyle = rgba(g <= 3 ? C.ivory : C.cyan, ea);
    ctx.lineWidth = g <= 3 ? 1.2 : 0.8;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const cx = g === 1 ? YOU[0] : GX(g - 1), cy = g === 1 ? YOU[1] : GY(g - 1, i >> 1);
      const pts = partial(bez(cx, cy, GX(g), GY(g, i), 10), f);
      if (pts.length < 2) continue;
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
    }
    ctx.stroke();
    // 节点
    if (f > 0.95) {
      for (let i = 0; i < n; i++) {
        const na = fade * dimOthers * (g <= 3 ? 0.9 : 0.5) * smooth(prog(t, tg + 0.4, tg + 0.9));
        glow(ctx, GX(g), GY(g, i), g <= 3 ? 16 : 7, g <= 3 ? C.gold : C.cyan, na);
      }
    }
    if (g <= 3) {
      const la = fade * dimOthers * smooth(prog(t, tg + 0.3, tg + 1.0));
      text(ctx, GEN_LABEL[g], GX(g), 540 - GH(g) - 34, { size: 20, weight: 300, alpha: 0.7 * la, spacing: 0.2 });
      text(ctx, `×${n}`, GX(g), 540 + GH(g) + 46, { size: 13, family: 'Mono', alpha: 0.45 * la, spacing: 0.2 });
    }
  }
  ctx.restore();
  // 尘埃
  const da = fade * dimOthers;
  if (t > GEN_T(GE + 1) && da > 0) {
    ctx.save();
    for (const d of DUST) {
      const a = smooth(prog(t, GEN_T(d.g), GEN_T(d.g) + 0.6)) * d.a * da * 0.5;
      if (a <= 0.01) continue;
      ctx.fillStyle = rgba(C.cyan, Math.min(1, a * 1.9));
      ctx.fillRect(d.x, d.y, d.s, d.s);
    }
    ctx.restore();
  }
  // 金色路径
  const pf = easeInOut(prog(t, 50.8, 54.4));
  if (pf > 0) {
    const pulse = Math.exp(-Math.max(0, t - 57.0) * 1.6) * (t >= 57 ? 1 : 0);
    // 61 秒后路径拉直成时间轴
    const st = easeInOut(prog(t, 61.0, 63.6));
    const pts = partial(PATH_PTS, pf).map(([x, y]) => [x, lerp(y, 540, st)]);
    glowLine(ctx, pts, C.gold, 0.95 * (1 + 0.8 * pulse), 1.8 + 1.5 * pulse);
    if (pulse > 0.02) for (let g = 1; g <= GE; g++) glow(ctx, GX(g), lerp(GY(g, PATH[g]), 540, st), 34 * pulse + 6, C.gold, 0.9 * pulse);
  }
  // 你
  drawHead(ctx, YOU[0], YOU[1], t, smooth(prog(t, 34.6, 36.0)) * (1 - smooth(prog(t, 92, 94))), 0.75);
  const ya = vis(t, 35.0, 49.0, 1.0, 1.0);
  text(ctx, '你', YOU[0] + 50, YOU[1] + 10, { size: 30, alpha: 0.85 * ya, align: 'left' });

  // HUD
  let gNow = 0;
  for (let g = 1; g <= GMAX; g++) if (t >= GEN_T(g)) gNow = g;
  const ha = vis(t, 36.6, 56.5, 0.8, 1.0);
  if (gNow > 0) UI.hud(ctx, ha, { label: '族谱上的位置', en: 'PLACES ON YOUR FAMILY TREE', value: `第 ${gNow} 代 · ${fmt(Math.pow(2, gNow))} 个`, valueEn: `GENERATION ${gNow}` });
}

// ———————————— 第一幕：深时间轴 ————————————
// 里程碑等距排列（不画精确刻度，避免对数轴把远古挤成一团）
const MARKS = [
  [1250, '智人', '300,000 YEARS', 64.6],
  [930, '直立行走', '~6,000,000 YEARS', 66.4],
  [600, '登上陆地', '370,000,000 YEARS', 68.1],
  [270, '第一个细胞', '~4,000,000,000 YEARS', 69.9],
];
MARKS.forEach(m => events.push({ t: m[3], type: 'mark' }));
const ORIGIN_X = 270;

// ———————————— 第一幕：生命之树 ————————————
const TREE = (() => {
  const r = mulberry32(2024);
  const X0 = ORIGIN_X, X1 = YOU[0], dx = 5;
  const lines = [];
  const gold = { pts: [], dead: false, gold: true, born: X0 };
  let alive = [gold];
  lines.push(gold);
  for (let x = X0; x <= X1; x += dx) {
    const next = [];
    for (const L of alive) {
      if (L.gold) { L.pts.push([x, 540]); next.push(L); continue; }
      // 随机游走 + 边界与"金线"的排斥
      const last = L.pts[L.pts.length - 1];
      let y = last[1];
      L.vy = L.vy * 0.985 + (r() - 0.5) * 0.28;
      for (const M of alive) { if (M === L) continue; const my = M.pts[M.pts.length - 1][1]; const d = y - my; if (Math.abs(d) < 14) L.vy += Math.sign(d || (r() - 0.5)) * 0.05 * (14 - Math.abs(d)) / 14; }
      if (y < 150) L.vy += 0.3; if (y > 930) L.vy -= 0.3;
      if (Math.abs(y - 540) < 26) L.vy += Math.sign(y - 540 || 1) * 0.35;
      L.vy = Math.max(-3.2, Math.min(3.2, L.vy));
      y += L.vy;
      L.pts.push([x, y]);
      const pDie = 0.003 + 0.00012 * alive.length + (x > X1 - 260 ? 0.006 : 0);
      if (x > X0 + 30 && r() < pDie) { L.dead = true; L.deadX = x; continue; }
      next.push(L);
    }
    // 分叉
    const born = [];
    for (const L of next) {
      const pSplit = alive.length < 120 ? 0.045 : 0.004;
      if (r() < pSplit * (L.gold ? 0.8 : 1)) {
        const last = L.pts[L.pts.length - 1];
        const dir = r() < 0.5 ? -1 : 1;
        const nl = { pts: [[last[0], last[1]]], vy: dir * (0.8 + r() * 1.6), dead: false, born: x, tOut: 0 };
        born.push(nl); lines.push(nl);
      }
    }
    alive = next.concat(born);
  }
  const r2 = mulberry32(77);
  for (const L of lines) L.tOut = 80.6 + r2() * 5.0;
  return { lines, X0, X1 };
})();
{
  // 少量"熄灭"音效
  const r = mulberry32(9);
  TREE.lines.filter(l => l.dead).forEach(l => { if (r() < 0.12) events.push({ t: l.tOut, type: 'out' }); });
}

function drawDeepTime(ctx, t) {
  if (t < 60.5 || t > 97.5) return;
  const zoomIn = easeIn(prog(t, 93.6, 97.2));
  const z = 1 + zoomIn * 9;
  const fx = 960;
  ctx.save();
  ctx.translate(fx, 540); ctx.scale(z, z); ctx.translate(-fx, -540);
  const axA = smooth(prog(t, 62.6, 64.4)) * (1 - smooth(prog(t, 92.5, 94.0)));
  // 时间方向
  if (axA > 0) {
    line(ctx, [[ORIGIN_X, 790], [YOU[0], 790]], C.cyan, 0.22 * axA, 1);
    line(ctx, [[ORIGIN_X, 790], [ORIGIN_X + 12, 784]], C.cyan, 0.35 * axA, 1);
    line(ctx, [[ORIGIN_X, 790], [ORIGIN_X + 12, 796]], C.cyan, 0.35 * axA, 1);
    text(ctx, '过去', ORIGIN_X, 826, { size: 16, weight: 300, alpha: 0.5 * axA, spacing: 0.3 });
    text(ctx, '现在', YOU[0], 826, { size: 16, weight: 300, alpha: 0.6 * axA, color: C.gold, spacing: 0.3 });
  }
  // 生命之树
  const treeA = smooth(prog(t, 76.2, 77.6));
  if (treeA > 0) {
    const front = lerp(TREE.X0, TREE.X1 + 10, easeInOut(prog(t, 76.4, 80.4)));
    ctx.save();
    ctx.lineJoin = 'round';
    for (const L of TREE.lines) {
      if (L.gold) continue;
      // 各点 x 以 5px 递增，直接切片，比逐点 filter 快得多
      const vis_ = front >= L.pts[L.pts.length - 1][0] ? L.pts : L.pts.slice(0, Math.max(0, Math.floor((front - L.pts[0][0]) / 5) + 1));
      if (vis_.length < 2) continue;
      const dead = L.dead;
      // 熄灭：闪一下玫红，然后变暗
      let a = 0.55, col = C.cyan;
      if (dead) {
        const o = prog(t, L.tOut, L.tOut + 0.6);
        a = lerp(0.55, 0.09, smooth(o));
        if (t > 86.5) a = 0.09 * (1 - 0.4 * smooth(prog(t, 87, 89)));
      } else {
        a = 0.55 + 0.2 * smooth(prog(t, 86.0, 88.0));
      }
      a *= treeA * (1 - smooth(prog(t, 92.6, 94.4)));
      line(ctx, vis_, col, a * 0.8, 0.7);
      if (dead && front >= L.deadX) {
        const tip = vis_[vis_.length - 1];
        const fl = t >= L.tOut ? Math.exp(-(t - L.tOut) * 3) : 0;
        if (fl > 0.02) glow(ctx, tip[0], tip[1], 14, C.rose, 0.9 * fl * treeA);
        // 熄灭的枝头飘起几粒余烬，慢慢变灰
        const age = t - L.tOut;
        if (age > 0 && age < 3.2) {
          const ea = treeA * (1 - smooth(prog(t, 92.6, 94.4)));
          for (let k = 0; k < 4; k++) {
            const sd = (L.born * 7.31 + k * 13.7) % 1, sd2 = (L.born * 3.17 + k * 5.3) % 1;
            const lf = 1.8 + 1.4 * sd;
            if (age > lf) continue;
            const u = age / lf;
            const ex = tip[0] + (sd2 - 0.5) * 30 * u + 10 * u, ey = tip[1] - (18 + 40 * sd) * u;
            glow(ctx, ex, ey, 4 + 3 * sd, mix(C.rose, [120, 120, 130], u), 0.7 * (1 - u) * ea);
          }
        }
        ctx.fillStyle = rgba(t >= L.tOut ? C.rose : C.cyan, (t >= L.tOut ? 0.35 : 0.6) * treeA * (1 - smooth(prog(t, 92.6, 94.4))));
        ctx.beginPath(); ctx.arc(tip[0], tip[1], 1.8, 0, 6.283); ctx.fill();
      }
    }
    ctx.restore();
  }
  // 金线（深时间里的你这一条）
  const glA = 1 - smooth(prog(t, 96.4, 97.4));
  const boost = 1 + 0.9 * smooth(prog(t, 86.8, 88.4)) * (1 - smooth(prog(t, 92, 94)));
  const ext = easeInOut(prog(t, 61.2, 64.0));
  const left = lerp(GX(GMAX), ORIGIN_X, ext);
  const pts = [];
  for (let x = left; x <= YOU[0]; x += 8) pts.push([x, 540]);
  pts.push([YOU[0], 540]);
  if (t > 63.4) glowLine(ctx, pts, C.gold, glA, 1.8 * boost, 1 + 0.4 * (boost - 1));
  // 里程碑
  for (let i = 0; i < MARKS.length; i++) {
    const [x, zh, en, tm] = MARKS[i];
    const ma = smooth(prog(t, tm, tm + 0.8)) * (1 - smooth(prog(t, 76.0, 78.0)));
    if (ma <= 0) continue;
    const ripple = Math.exp(-Math.pow((t - (72.3 + (3 - i) * 0.0 + i * 0.35)) / 0.35, 2));
    const pop = Math.exp(-Math.max(0, t - tm) * 2.5);
    glow(ctx, x, 540, 22 + 30 * pop + 26 * ripple, C.gold, ma * (0.8 + 0.6 * ripple));
    line(ctx, [[x, 522], [x, 504]], C.gold, 0.5 * ma, 1);
    text(ctx, zh, x, 486, { size: 24, weight: 300, alpha: 0.9 * ma, spacing: 0.1 });
    text(ctx, en, x, 584, { size: 12, family: 'Mono', weight: 300, alpha: 0.5 * ma, spacing: 0.25 });
  }
  ctx.restore();
  // HUD
  UI.hud(ctx, vis(t, 79.8, 92.6, 1.0, 1.0), { label: '已经消失的物种', en: 'SPECIES THAT EVER LIVED', value: '> 99%', valueEn: 'EXTINCT', valueColor: C.rose });
  UI.hud(ctx, vis(t, 64.2, 76.5, 1.0, 1.0), { label: '沿着这条线往回走', en: 'BACK ALONG THE THREAD', value: '约 40 亿年', valueEn: '~4,000,000,000 YEARS' });
}

function draw(ctx, t) {
  drawOpening(ctx, t);
  drawPedigree(ctx, t);
  drawDeepTime(ctx, t);
}

module.exports = { start: 0, end: 97.5, draw, events, TREE, drawHead };
