'use strict';
// 《INFP》v3 共用（由 pfk.js 复制）：读 voice_timed4.json（没有就读估算 voice_timed4_est.json）
const fs = require('fs');
const C = require('./lc');
const { K, L, P } = C;
const { W, H, clamp, lerp, prog, smooth, easeOut, glow, glowLine, vis, mulberry32 } = K;

const LIME = [222, 232, 110], LEAF = [120, 206, 160], GOLD = P.gold, IVORY = P.ivory, PINK = [255, 170, 190], BLUE = [150, 190, 240], RED = [240, 110, 100];
const VD = (process.env.INFP_DATA || 'F:/AI/lianai/11_INFP') + '/voice/'; // 云端仓库：INFP_DATA=./data
const VF = VD + 'voice_timed4' + (fs.existsSync(VD + 'voice_timed4.json') && !process.env.PW_EST ? '' : '_est') + '.json';
const VJ = JSON.parse(fs.readFileSync(VF, 'utf8'));
const VT = {}; for (const l of VJ.lines) VT[l.id] = l;
const vs = id => VT[id].start, ve = id => VT[id].end;
// 书页时段：[{name, a, b, after}]
const PAGES = []; for (const l of VJ.lines) { if (l.page_slot) PAGES.push({ name: l.page, a: l.page_slot[0], b: l.page_slot[1], after: l.id }); if (l.page2_slot) PAGES.push({ name: l.page2, a: l.page2_slot[0], b: l.page2_slot[1], after: l.id }); }
const isHan = c => c >= '\u4e00' && c <= '\u9fff';
const HT = {};
function hanTimes(id) {
  if (HT[id]) return HT[id];
  const l = VT[id], hz = [...l.text].filter(isHan), ts = hz.map(() => null);
  let p = 0;
  for (let i = 0; i < hz.length; i++) for (let q = p; q < Math.min(l.chars.length, p + 3); q++) if (l.chars[q][0] === hz[i]) { ts[i] = l.chars[q][1]; p = q + 1; break; }
  for (let i = 0; i < ts.length; i++) if (ts[i] == null) {
    let a = i - 1; while (a >= 0 && ts[a] == null) a--;
    let b = i + 1; while (b < ts.length && ts[b] == null) b++;
    ts[i] = lerp(a >= 0 ? ts[a] : l.start, b < ts.length ? ts[b] : l.end, (i - a) / (b - a));
  }
  return (HT[id] = { hz, ts });
}
// 某句里某个词开始念的时间
function at(id, sub, nth = 0) {
  const l = VT[id], txt = l.text; let k = -1;
  for (let n = 0; n <= nth; n++) k = txt.indexOf(sub, k + 1);
  if (k < 0) return l.start;
  const hi = [...txt.slice(0, k)].filter(isHan).length, { ts } = hanTimes(id);
  return hi < ts.length ? ts[hi] : l.end;
}

// ---------- 字幕：竖屏，离底部约 1/4（y≈1450），每条 ≤13 字 ----------
const SHOW = s => s.replace('百分之一', '1%');
function makeSubs(KEYS, tEnd = 1e9) {
  const out = [], ids = VJ.lines.filter(l => l.start < tEnd).map(l => l.id);
  ids.forEach((id, li) => {
    const l = VT[id], { ts } = hanTimes(id);
    const parts = l.text.match(/[^，；：。！？]+[，；：。！？]?/g) || [l.text];
    const chunks = []; let cur = '';
    const wid = s => [...SHOW(s)].reduce((n, c) => n + (/[A-Za-z0-9%]/.test(c) ? 0.6 : 1), 0);
    for (const p of parts) { if (cur && wid(cur + p) > 12.5) { chunks.push(cur); cur = p; } else cur += p; }
    if (cur) chunks.push(cur);
    // 单个小句本身太长（>14）就从中间对半切
    for (let i = 0; i < chunks.length; i++) if (wid(chunks[i]) > 14) { const cs = [...chunks[i]], m0 = Math.ceil(cs.length / 2); let m = m0; while (m > 1 && /[A-Za-z]/.test(cs[m - 1]) && /[A-Za-z]/.test(cs[m])) m--;
      { let best = -1; cs.forEach((c, j) => { if (c === '、' && j > 2 && j < cs.length - 3 && (best < 0 || Math.abs(j + 1 - m0) < Math.abs(best - m0))) best = j + 1; }); if (best > 0) m = best; }
      chunks.splice(i, 1, cs.slice(0, m).join(''), cs.slice(m).join('')); }
    let hi = 0; const st = [];
    for (const c of chunks) { st.push(hi < ts.length ? ts[hi] : l.start); hi += [...c].filter(isHan).length; }
    st[0] = l.start;
    const next = li + 1 < ids.length ? vs(ids[li + 1]) : l.end + 1;
    chunks.forEach((c, k) => {
      const a = st[k] - 0.08, b = k + 1 < chunks.length ? st[k + 1] - 0.1 : Math.min(l.end + 0.4, next - 0.1);
      const zh = SHOW(c).replace(/[，；：。]$/, '');
      const ks = KEYS.filter(([w]) => zh.includes(w));
      out.push({ t0: a, t1: b, zh, keys: ks.map(q => q[0]), keyColor: ks.length ? ks[0][1] : GOLD });
    });
  });
  return function subs(ctx, t) {
    for (const s of out) {
      if (t < s.t0 - 0.05 || t > s.t1 + 0.05) continue;
      const a = Math.min(smooth((t - s.t0) / 0.16), smooth((s.t1 - t) / 0.16)), dy = (1 - easeOut((t - s.t0) / 0.4)) * 6;
      ctx.save();
      const g = ctx.createLinearGradient(0, 1330, 0, 1560);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(0,0,0,${0.42 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 1330, W, 230);
      ctx.restore();
      L.rich(ctx, s.zh, W / 2, 1470 + dy, { size: 66, weight: 500, spacing: 0.05, color: [244, 240, 230], keys: s.keys, keyColor: s.keyColor, alpha: a, glowKey: 0.35 });
    }
  };
}
// 网友原话：画面上方，不念
function quote(ctx, str, t, t0, t1, o = {}) {
  const { y = 330, size = 54, keys = [], keyColor = LIME } = o;
  const a = vis(t, t0, t1, 0.35, 0.4); if (a <= 0.003) return;
  const lines = str.split('\n');
  lines.forEach((ln, i) => L.rich(ctx, (i === 0 ? '「' : '') + ln + (i === lines.length - 1 ? '」' : ''), W / 2, y + i * size * 1.4 + (1 - easeOut(prog(t, t0, t0 + 0.5))) * 10,
    { size, weight: 500, spacing: 0.05, color: IVORY, keys, keyColor, alpha: a, glowKey: 0.45 }));
}
// 段落标题（左上）
function trait(ctx, n, str, keys, t, t0, t1, c = LIME) {
  const a = vis(t, t0, t1, 0.4, 0.4); if (a <= 0.003) return;
  L.ellipse(ctx, 92, 196, 28, 28, c, 0.8 * a, 1.6);
  L.num(ctx, n, 92, 211, { size: 38, color: c, alpha: a, align: 'center', glowA: 0.4 });
  L.rich(ctx, str, 138, 212, { size: 48, weight: 500, spacing: 0.05, align: 'left', keys, keyColor: c, alpha: a, glowKey: 0.5 });
}

// ---------- 场景背景：草地黄昏，透视地面 + 远处星光 + 近处虚焦光斑 ----------
const VPY = 1040;
const R = mulberry32(911);
const FAR = Array.from({ length: 60 }, () => ({ x: R() * W, y: 120 + R() * 860, r: 1.5 + R() * 4, a: 0.1 + R() * 0.3, ph: R() * 6.28, sp: 0.3 + R() * 0.8 }));
const GRASS = Array.from({ length: 140 }, () => ({ x: R() * W, z: R(), h: 0.5 + R(), ph: R() * 6.28 }));
const NEAR = Array.from({ length: 10 }, () => { let x, y; do { x = R() * W; y = R() * H; } while (Math.abs(x - W / 2) < 330 && y > 400 && y < 1600); return { x, y, r: 50 + R() * 90, a: 0.04 + R() * 0.05, ph: R() * 6.28, c: R() < 0.5 ? [220, 240, 150] : [150, 230, 200] }; });
function back(ctx, t, o = {}) {
  const { floor = 1, pool = [W / 2, 1255, 360], lift = 1, mood = 0 } = o;   // mood：0 暖绿 1 冷蓝（孤单）
  C.bg(ctx, t, { tint: [lerp(14, 10, mood), lerp(34, 22, mood), lerp(30, 44, mood)], cy: H * 0.45 });
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  glow(ctx, W / 2, VPY - 60, 760, mood > 0.5 ? [60, 80, 140] : [70, 110, 80], 0.28 * lift);
  for (const f of FAR) glow(ctx, f.x + 8 * Math.sin(t * 0.1 + f.ph), f.y, f.r * 2.4, mood > 0.5 ? [190, 210, 255] : [230, 245, 190], f.a * lift * (0.6 + 0.4 * Math.sin(t * f.sp + f.ph)));
  ctx.restore();
  if (floor > 0.01) {
    const g = ctx.createLinearGradient(0, VPY - 30, 0, H);
    g.addColorStop(0, `rgba(60,96,70,${0.0 * floor})`); g.addColorStop(0.05, `rgba(50,86,62,${0.5 * floor})`); g.addColorStop(0.4, `rgba(22,40,30,${0.45 * floor})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, VPY - 30, W, H - VPY + 30);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const hg = ctx.createLinearGradient(0, 0, W, 0); hg.addColorStop(0, 'rgba(200,240,170,0)'); hg.addColorStop(0.5, `rgba(200,240,170,${0.2 * floor})`); hg.addColorStop(1, 'rgba(200,240,170,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, VPY - 1, W, 2);
    // 草叶：越近越大，风吹着摆
    for (const gr of GRASS) {
      const y = VPY + 8 + Math.pow(gr.z, 1.8) * 560, sc = 0.3 + gr.z * 1.6, sw = Math.sin(t * 1.4 + gr.ph + gr.x * 0.004) * 6 * sc;
      ctx.strokeStyle = `rgba(150,214,140,${(0.05 + 0.12 * gr.z) * floor})`; ctx.lineWidth = 1.4 * sc;
      ctx.beginPath(); ctx.moveTo(gr.x, y); ctx.quadraticCurveTo(gr.x + sw * 0.4, y - 10 * sc * gr.h, gr.x + sw, y - 22 * sc * gr.h); ctx.stroke();
    }
    if (pool) { ctx.save(); ctx.translate(pool[0], pool[1]); ctx.scale(1, 0.15); glow(ctx, 0, 0, pool[2], [190, 236, 150], 0.4 * floor); ctx.restore(); }
    ctx.restore();
  }
}
function front(ctx, t, a = 1) {
  ctx.save(); ctx.globalCompositeOperation = 'lighter';
  for (const n of NEAR) glow(ctx, n.x + 30 * Math.sin(t * 0.12 + n.ph), n.y + 20 * Math.cos(t * 0.1 + n.ph), n.r, n.c, n.a * a);
  ctx.restore();
}
// 每一镜的缓推
function push(ctx, t, a0, b0, k = 0.05, fx = W / 2, fy = 1000) { const s = 1 + k * smooth(prog(t, a0, b0)); ctx.translate(fx, fy); ctx.scale(s, s); ctx.translate(-fx, -fy); }

module.exports = { C, K, L, P, LIME, LEAF, GOLD, IVORY, PINK, BLUE, RED, VJ, VT, vs, ve, at, makeSubs, quote, trait, back, front, push, VPY, SHOW, PAGES, END: VJ.end };
