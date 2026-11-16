'use strict';
// 《ESFJ》竖屏（KW=1080 KH=1920）公共工具：从 ek.js（ESTJ）复制，配音换成 ESFJ；ES 换成 ESFJ 主角 EF
const fs = require('fs');
const C = require('./lc');
const MB = require('./mb');
const ES = require('./esf');
const { K, L, P } = C;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, glow, glowLine, mix, vis, hash, rgba } = K;

const TEAL = [114, 203, 204], TEAL_D = [54, 148, 150], GOLD = P.gold, IVORY = P.ivory, RED = [236, 92, 80], YEL = [250, 210, 70], BLUE = [130, 180, 236], GREENC = [140, 220, 150];

// ---------- 配音时间 ----------
// v2：读新配音 voice2（INFJ 同款后期）；配音没出来前用 lines.json 按 5.6 字/秒估一个假时间轴，方便先写画面
// v6（连贯版）用 voice4；ESFJ_V=3 时回到旧片 voice3（EIX）
// v8 用 voice6；ESFJ_V=5 回到 v7，ESFJ_V=4 回到 v6（EBX），ESFJ_V=3 回到 v5（EIX）
// 云端仓库设 ESFJ_DATA=./data，读 data/voice/lines.json；本地不设时照旧读 F 盘
const VDIR = process.env.ESFJ_DATA ? process.env.ESFJ_DATA + '/voice' : 'F:/AI/lianai/08_ESFJ/' + ({ '3': 'voice3', '4': 'voice4', '5': 'voice5' }[process.env.ESFJ_V] || 'voice6');
const VPATH = VDIR + '/voice_timed.json';
const VJ = fs.existsSync(VPATH) ? JSON.parse(fs.readFileSync(VPATH, 'utf8')) : (() => {
  const LS = JSON.parse(fs.readFileSync(VDIR + '/lines.json', 'utf8')); let t = 0.6, prev = null; const lines = [];
  for (const o of LS) {
    if (prev) t += 0.3 + 1.7 * (prev.quotes || 0) + (prev.gag ? 0.6 : 0) + (prev.bigAfter ? 1.8 : 0) + (prev.pause || 0) + (o.chapter !== prev.chapter ? 1.0 : 0);
    const d = [...o.text].filter(c => c >= '\u4e00' && c <= '\u9fff').length / 5.3 + (o.text.match(/[A-Z]/g) || []).length * 0.17;
    const l = { id: o.id, text: o.text, chapter: o.chapter, start: t, end: t + d, chars: [] };
    if (o.quotes) l.quote_slot = [l.end + 0.2, l.end + 0.2 + 1.7 * o.quotes];
    lines.push(l); t += d; prev = o;
  }
  return { end: t + 1.8 + 4, lines, fake: true };
})();
const VT = {}; for (const l of VJ.lines) VT[l.id] = l;
const vs = id => VT[id].start, ve = id => VT[id].end;
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
function at(id, sub, nth = 0) {
  const l = VT[id], txt = l.text; let k = -1;
  for (let n = 0; n <= nth; n++) k = txt.indexOf(sub, k + 1);
  if (k < 0) return l.start;
  const hi = [...txt.slice(0, k)].filter(isHan).length, { ts } = hanTimes(id);
  return hi < ts.length ? ts[hi] : l.end;
}

// ---------- 字幕：竖屏放在画面下方约 72%，66px，每条 ≤13 字，长句折两行 ----------
const SUB_Y = 1440, SUB_SIZE = 66;
const SHOW = s => s.replace('百分之十', '10%').replace(/[「」]/g, '');
const MCTX = new K.Canvas(10, 10).getContext('2d');
const subW = s => K.measure(MCTX, s, { size: SUB_SIZE, weight: 600, spacing: 0.05 });
function buildSubs(KEYS) {
  const out = [], ids = VJ.lines.map(l => l.id);
  ids.forEach((id, li) => {
    const l = VT[id], { ts } = hanTimes(id);
    const parts = l.text.match(/[^，；：。！？、]+[，；：。！？、]?/g) || [l.text];
    const chunks = []; let cur = '';
    for (const p of parts) { if (cur && subW(SHOW(cur + p).replace(/[，；：。]$/, '')) > 960) { chunks.push(cur); cur = p; } else cur += p; }
    if (cur) chunks.push(cur);
    // 每块开始时间 = 块里第一个汉字的时间；块以英文字母开头（ESTJ、ISFJ…）时，字母先念，
    // 按上一块结尾字母数 : 这块开头字母数 把两个汉字之间的空档分开，否则字幕会晚 1–3 秒
    let hi = 0; const st = [];
    const lead = s => (s.match(/^[^\u4e00-\u9fff]*/)[0].match(/[A-Za-z]/g) || []).length;
    const tail = s => (s.match(/[^\u4e00-\u9fff]*$/)[0].match(/[A-Za-z]/g) || []).length;
    chunks.forEach((c, k) => {
      let t0 = hi < ts.length ? ts[hi] : l.start;
      if (k > 0 && hi > 0 && lead(c) > 0) {
        const prevLast = ts[Math.min(hi - 1, ts.length - 1)], a = tail(chunks[k - 1]), b = lead(c);
        t0 = prevLast + 0.15 + (t0 - prevLast - 0.15) * a / (a + b);
      }
      st.push(t0); hi += [...c].filter(isHan).length;
    });
    st[0] = l.start;
    const next = li + 1 < ids.length ? vs(ids[li + 1]) : VJ.end;
    chunks.forEach((c, k) => {
      const a = st[k] - 0.12, b = k + 1 < chunks.length ? st[k + 1] - 0.12 : Math.min(l.end + 0.45, next - 0.08);
      const zh = SHOW(c).replace(/[，；：、]$/, '');
      const ks = KEYS.filter(([w]) => zh.includes(w));
      out.push({ t0: a, t1: b, zh, keys: ks.map(q => q[0]), keyColor: ks.length ? ks[0][1] : GOLD });
    });
  });
  return out;
}
function drawSubs(ctx, T, SUBS) {
  for (const s of SUBS) {
    if (T < s.t0 - 0.05 || T > s.t1 + 0.05) continue;
    const a = Math.min(smooth((T - s.t0) / 0.14), smooth((s.t1 - T) / 0.14)), dy = (1 - easeOut((T - s.t0) / 0.35)) * 6;
    const g = ctx.createLinearGradient(0, SUB_Y - 200, 0, SUB_Y + 160);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, `rgba(0,0,0,${0.42 * a})`); g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g; ctx.fillRect(0, SUB_Y - 200, W, 360);
    L.rich(ctx, s.zh, W / 2, SUB_Y + dy, { size: SUB_SIZE, weight: 600, spacing: 0.05, color: [246, 242, 232], keys: s.keys, keyColor: s.keyColor, alpha: a, glowKey: 0.3 });
  }
}

// ---------- 镜头 ----------
function cam(z, fx, fy, sx = W / 2, sy = H / 2) { return { z, fx, fy, sx, sy, map: (x, y) => [sx + (x - fx) * z, sy + (y - fy) * z] }; }
function applyCam(ctx, c) { ctx.translate(c.sx, c.sy); ctx.scale(c.z, c.z); ctx.translate(-c.fx, -c.fy); }
// 镜头抖一下（吹哨/拍桌）
const shake = (t, t0, amp = 10) => { const u = t - t0; if (u < 0 || u > 0.5) return [0, 0]; const e = Math.exp(-u * 9) * amp; return [Math.sin(u * 90) * e, Math.cos(u * 70) * e * 0.6]; };

// ---------- 空间：透视办公室（地砖往远处退、天花板灯一排排、两侧墙） ----------
// vp = 消失点；floorY = 画面里地平线以下的近处地板起点
function office(ctx, t, o = {}) {
  const { vp = [W / 2, 900], a = 1, tint = [18, 30, 32], light = 1, rows = 14, wallC = [26, 38, 40], lamps = true } = o;
  ctx.save(); ctx.globalAlpha *= a;
  // 底色：上暗下略亮
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, rgba([8, 10, 12])); g.addColorStop(0.47, rgba(tint)); g.addColorStop(1, rgba([12, 16, 18]));
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // 远处的光（走廊尽头）
  glow(ctx, vp[0], vp[1], 520, [120, 200, 200], 0.18 * light);
  // 地砖：横线按透视排，竖线汇向消失点
  ctx.lineWidth = 1.5;
  for (let i = 1; i <= rows; i++) {
    const z = i / rows, y = vp[1] + (H - vp[1]) * z * z * 1.25;
    if (y > H) break;
    ctx.strokeStyle = rgba(TEAL, 0.05 + 0.12 * z); ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }
  for (let k = -9; k <= 9; k++) {
    ctx.strokeStyle = rgba(TEAL, 0.09); ctx.beginPath(); ctx.moveTo(vp[0] + k * 6, vp[1]); ctx.lineTo(vp[0] + k * 260, H + 200); ctx.stroke();
  }
  // 两侧墙面：一排排门框往远处退
  for (const side of [-1, 1]) {
    for (let i = 0; i < 7; i++) {
      const z0 = (i + 0.2) / 7, z1 = (i + 0.75) / 7;
      const X = z => vp[0] + side * (40 + z * z * 900), Ytop = z => vp[1] - 30 - z * z * 820, Ybot = z => vp[1] + 20 + z * z * 560;
      ctx.fillStyle = rgba(mix(wallC, [60, 90, 92], 0.25 * z1), 0.55 + 0.4 * z1);
      ctx.beginPath(); ctx.moveTo(X(z0), Ytop(z0)); ctx.lineTo(X(z1), Ytop(z1)); ctx.lineTo(X(z1), Ybot(z1)); ctx.lineTo(X(z0), Ybot(z0)); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba(TEAL, 0.10 + 0.15 * z1); ctx.lineWidth = 1.2; ctx.stroke();
    }
  }
  // 天花板灯：一排条灯往远处退，近处更亮更长
  if (lamps) for (let i = 1; i <= 9; i++) {
    const z = i / 9, y = vp[1] - 40 - z * z * 900, w = 30 + z * z * 360;
    ctx.fillStyle = rgba([235, 245, 240], (0.25 + 0.6 * z) * light);
    ctx.fillRect(vp[0] - w / 2, y, w, 3 + z * 10);
    glow(ctx, vp[0], y + 4, w * 0.7, [200, 240, 235], 0.10 * z * light);
  }
  ctx.restore();
}
// 地上的柔光斑（人物脚下的光）
function pool(ctx, x, y, rx, c = [190, 240, 235], a = 0.3) {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.18);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, rgba(c, a)); g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
}
// 顶光：从上往下的光锥
function cone(ctx, x, top, bot, w0, w1, c = [230, 250, 245], a = 0.12) {
  const g = ctx.createLinearGradient(0, top, 0, bot); g.addColorStop(0, rgba(c, a)); g.addColorStop(1, rgba(c, 0));
  ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w0, top); ctx.lineTo(x + w0, top); ctx.lineTo(x + w1, bot); ctx.lineTo(x - w1, bot); ctx.closePath(); ctx.fill();
}

// ---------- 道具 ----------
// 金属哨子：r=大小，blow=0..1 吹气（哨口喷出气流）
function whistle(ctx, x, y, r, rot, a = 1, blow = 0) {
  if (a <= 0.003) return;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#f4f6f8'); g.addColorStop(0.45, '#9aa4ac'); g.addColorStop(1, '#4b545b');
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-r * 0.2, -r); ctx.lineTo(r * 2.1, -r * 0.95); ctx.lineTo(r * 2.1, -r * 0.2); ctx.lineTo(r * 0.6, -r * 0.1); ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.4, r * 0.35, r * 0.18, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2a2f33'; ctx.beginPath(); ctx.arc(0, 0, r * 0.32, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
// 卡片（黄牌/红牌）：带厚度和高光
function card(ctx, x, y, w, rot, c, a = 1) {
  if (a <= 0.003) return;
  const h = w * 1.4;
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x, y); ctx.rotate(rot);
  ctx.fillStyle = rgba(mix(c, [0, 0, 0], 0.45)); ctx.fillRect(-w / 2 + 5, -h / 2 + 6, w, h);
  const g = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2); g.addColorStop(0, rgba(mix(c, [255, 255, 255], 0.3))); g.addColorStop(1, rgba(c));
  ctx.fillStyle = g; ctx.fillRect(-w / 2, -h / 2, w, h);
  ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(0, -h / 2); ctx.lineTo(-w / 2, 0); ctx.closePath(); ctx.fill();
  ctx.restore();
  glow(ctx, x, y, w * 1.6, c, 0.25 * a);
}
// 挂钟：表盘有刻度、厚边、玻璃反光；mins=从 12 点起的分钟数
function clock(ctx, x, y, R, mins, a = 1, o = {}) {
  if (a <= 0.003) return;
  const { rim = [70, 78, 84], face = [236, 232, 222], hot = 0 } = o;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(x + R * 0.06, y + R * 0.08, R * 1.08, 0, Math.PI * 2); ctx.fill();
  const rg = ctx.createLinearGradient(x - R, y - R, x + R, y + R); rg.addColorStop(0, rgba(mix(rim, [255, 255, 255], 0.35))); rg.addColorStop(1, rgba(mix(rim, [0, 0, 0], 0.4)));
  ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(x, y, R * 1.08, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = rgba(mix(face, RED, hot * 0.25)); ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill();
  for (let i = 0; i < 60; i++) {
    const an = i / 60 * Math.PI * 2, big = i % 5 === 0, r0 = R * (big ? 0.8 : 0.88);
    ctx.strokeStyle = rgba([40, 44, 48], big ? 0.9 : 0.5); ctx.lineWidth = big ? R * 0.035 : R * 0.012;
    ctx.beginPath(); ctx.moveTo(x + Math.sin(an) * r0, y - Math.cos(an) * r0); ctx.lineTo(x + Math.sin(an) * R * 0.94, y - Math.cos(an) * R * 0.94); ctx.stroke();
  }
  const hand = (an, len, w, c) => { ctx.strokeStyle = c; ctx.lineWidth = w; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - Math.sin(an) * len * 0.15, y + Math.cos(an) * len * 0.15); ctx.lineTo(x + Math.sin(an) * len, y - Math.cos(an) * len); ctx.stroke(); };
  hand(mins / 720 * Math.PI * 2, R * 0.5, R * 0.06, '#2b2f33');
  hand(mins / 60 * Math.PI * 2, R * 0.78, R * 0.04, '#2b2f33');
  hand(mins % 1 * Math.PI * 2, R * 0.85, R * 0.015, rgba(RED));
  ctx.fillStyle = '#2b2f33'; ctx.beginPath(); ctx.arc(x, y, R * 0.06, 0, Math.PI * 2); ctx.fill();
  const gl = ctx.createLinearGradient(x - R, y - R, x + R * 0.2, y); gl.addColorStop(0, 'rgba(255,255,255,0.28)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, R, Math.PI * 0.9, Math.PI * 1.75); ctx.closePath(); ctx.fill();
  ctx.restore();
}
// 门：带门框、门牌（门牌字是门上的物件）
function door(ctx, x, y, w, h, a = 1, o = {}) {
  if (a <= 0.003) return;
  const { plate = '', open = 0, glowIn = 0 } = o;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgb(20,26,28)'; ctx.fillRect(x - w / 2 - 26, y - h - 26, w + 52, h + 26);
  if (glowIn > 0) { const g = ctx.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, rgba([255, 236, 190], 0.9 * glowIn)); g.addColorStop(1, rgba([255, 200, 130], 0.6 * glowIn)); ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h, w, h); }
  const dw = w * (1 - open * 0.82);
  const g = ctx.createLinearGradient(x - w / 2, 0, x - w / 2 + dw, 0); g.addColorStop(0, 'rgb(92,66,48)'); g.addColorStop(1, 'rgb(58,40,30)');
  ctx.fillStyle = g; ctx.fillRect(x - w / 2, y - h, dw, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 4;
  for (const [u0, v0, u1, v1] of [[0.12, 0.08, 0.88, 0.44], [0.12, 0.52, 0.88, 0.92]]) ctx.strokeRect(x - w / 2 + dw * u0, y - h + h * v0, dw * (u1 - u0), h * (v1 - v0));
  ctx.fillStyle = '#d8b56a'; ctx.beginPath(); ctx.arc(x - w / 2 + dw * 0.86, y - h * 0.48, w * 0.035, 0, Math.PI * 2); ctx.fill();
  if (plate && open < 0.5) {
    const pw = w * 0.6, ph = w * 0.2, px = x - w / 2 + dw / 2, py = y - h * 0.7;
    const pg = ctx.createLinearGradient(0, py - ph / 2, 0, py + ph / 2); pg.addColorStop(0, '#f1d58f'); pg.addColorStop(1, '#a98236');
    ctx.fillStyle = pg; ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
    L.rich(ctx, plate, px, py + ph * 0.24, { size: ph * 0.62, weight: 700, spacing: 0.2, color: [60, 40, 18], glowKey: 0 });
  }
  ctx.restore();
}
// 对话气泡（只放角色说的话）
function bubble(ctx, str, x, y, a, o = {}) {
  if (a <= 0.003) return;
  const { size = 50, tail = [-60, 80], c = [250, 248, 242], ink = [40, 40, 44], w: wFix } = o;
  const w = (wFix || K.measure(ctx, str, { size, weight: 600, spacing: 0.04 })) + size * 1.2, h = size * 1.9;
  ctx.save(); ctx.globalAlpha *= a;
  ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.roundRect(x - w / 2 + 6, y - h / 2 + 8, w, h, h / 2); ctx.fill();
  ctx.fillStyle = rgba(c); ctx.beginPath(); ctx.roundRect(x - w / 2, y - h / 2, w, h, h / 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x + tail[0] * 0.3 - 18, y + h / 2 - 4); ctx.lineTo(x + tail[0], y + tail[1]); ctx.lineTo(x + tail[0] * 0.3 + 18, y + h / 2 - 4); ctx.closePath(); ctx.fill();
  ctx.restore();
  L.rich(ctx, str, x, y + size * 0.36, { size, weight: 600, spacing: 0.04, color: ink, alpha: a, glowKey: 0 });
}
// 小人（其他人格）：MB.person 包装，y=脚底
const folk = (ctx, key, x, y, s, o) => MB.person(ctx, key, x, y, s, o);

module.exports = { C, K, L, P, MB, ES, VJ, VT, vs, ve, at, hanTimes, buildSubs, drawSubs, cam, applyCam, shake, office, pool, cone, whistle, card, clock, door, bubble, folk,
  TEAL, TEAL_D, GOLD, IVORY, RED, YEL, BLUE, GREENC, SUB_Y };
