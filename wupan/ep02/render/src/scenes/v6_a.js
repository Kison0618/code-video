// 第二集 v5 · 开头 + 故事一 + 机制（001–009）
//   001 电影机场铺满 → 002 定格退成照片 + 铜版画人脑裂缝 → 003 章节卡 No.3 → 004 档案卡/场记板 → G02 机长制服
//   005 电影银行 + 支票 PAID → 世界地图航线 → 006 电影医生 → 两张工牌 → 007 一堆证物 + 大问号
//   008 原始部落（H07）→ 人脑 + 代码卡 IF 权威说 → 照做 → 009 “说话的是谁”标黄、“说的对不对”划掉
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const B = require('../brain');
const C = require('../card');
const CUT = require('../cutout');
const F = require('../filmclip');
const U = require('./v5_util');
const L = TL.L, at = TL.at;
const V = require("./v6_util");
const pop = V.pop;

// ———— 001：电影机场镜头铺满，整句匀速慢推；墨笔批注圈出“机长”（v7：去掉黄色纸签） ————
const T2 = L('002').t0;
const FK = (t) => 1 + 0.06 * Math.min(1, t / (T2 + 2.4));          // 1.00 → 1.06 匀速
const PILOT = [[0, 0.79, 0.30], [1, 0.71, 0.28], [2, 0.67, 0.28], [3, 0.68, 0.26], [3.6, 0.70, 0.25], [5, 0.70, 0.24]];
function pilotAt(lt) {                                              // 片中机长上半身中心（源画面归一化坐标）
  for (let k = 1; k < PILOT.length; k++) if (lt <= PILOT[k][0]) { const [a, u0, v0] = PILOT[k - 1], [b, u1, v1] = PILOT[k], e = (lt - a) / (b - a); return [lerp(u0, u1, e), lerp(v0, v1, e)]; }
  return PILOT[PILOT.length - 1].slice(1);
}
function s01(ctx, t) {
  const lt = Math.min(t, 4.95), k = FK(t), cx = 0.62, cy = 0.35;
  // 电影原片偏暗发灰：稍微提亮
  ctx.save(); ctx.filter = 'brightness(1.12) contrast(1.04)';
  if (F.has('film_airport')) F.full(ctx, 'film_airport', lt, { k, cx, cy });
  else Q.sheet(ctx, 'G04', W/2,H/2,W,H);
  ctx.restore();
  // 聚光：机长周围保持原亮度，其余压暗，让观众一眼看到“这个人”；批注纸签贴在他旁边
  const [u, v] = pilotAt(lt), px = W * (cx + (u - cx) * k), py = H * (cy + (v - cy) * k);
  const a0 = at('001', '这个人') - 0.2, sp = smooth(prog(t, a0, a0 + 0.7)), fade = 1 - smooth(prog(t, 3.9, 4.4));
  if (sp * fade > 0.01) {
    ctx.save(); ctx.globalAlpha *= sp * fade;
    const g = ctx.createRadialGradient(px, py, 170, px, py, 640);
    g.addColorStop(0, 'rgba(18,12,6,0)'); g.addColorStop(1, 'rgba(18,12,6,0.45)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  if (fade > 0.01) {
    ctx.save(); ctx.globalAlpha *= fade;
    const tx = px - 520, ty = py - 120;
    const note = (s, x, y, size, a) => { const p = pop(t, a, 0.5); if (p <= 0.01) return;
      ctx.save(); ctx.globalAlpha *= p; ctx.font = `${size}px Kai`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      const w = ctx.measureText(s).width + 56; ctx.translate(x, y + (1 - p) * 16); ctx.rotate(-0.03);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-w / 2 + 6, -size * 0.62 + 8, w, size * 1.24);
      ctx.fillStyle = '#f4ead2'; ctx.fillRect(-w / 2, -size * 0.62, w, size * 1.24); ctx.fillStyle = '#231b15'; ctx.fillText(s, 0, 2); ctx.restore(); };
    const pl = pop(t, at('001', '十六岁') - 0.1, 0.5);
    if (pl > 0.01) { ctx.save(); ctx.globalAlpha *= pl; ctx.strokeStyle = '#f4ead2'; ctx.lineWidth = 4; ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.moveTo(tx + 140, ty + 10); ctx.lineTo(px - 110, py - 40); ctx.stroke(); ctx.restore(); }
    note('16 岁', tx, ty, 100, at('001', '十六岁'));
    note('没开过一天飞机', tx - 10, ty + 130, 64, at('001', '没开过'));
    ctx.restore();
  }
}
// ———— 002：定格，往后退成一张照片；右边铜版画人脑，脑中裂缝亮黄 ————
const CRACK = [[0.34, 0.05], [0.40, 0.13], [0.37, 0.19], [0.46, 0.25], [0.43, 0.31], [0.52, 0.38]];
function crack(ctx, map, p, glow) {
  if (p <= 0.01) return;
  const pts = K.partial(CRACK.map(([u, v]) => map(u, v)), easeOut(p));
  if (pts.length < 2) return;
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  const path = () => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) ctx.lineTo(q[0], q[1]); };
  if (glow > 0.01) { ctx.shadowColor = `rgba(255,200,40,${0.95 * glow})`; ctx.shadowBlur = 40; path(); ctx.strokeStyle = `rgba(244,198,61,${glow})`; ctx.lineWidth = 26; ctx.stroke(); ctx.shadowColor = 'transparent'; }
  path(); ctx.strokeStyle = '#2a1d12'; ctx.lineWidth = 9; ctx.stroke();
  path(); ctx.strokeStyle = `rgba(255,236,150,${glow})`; ctx.lineWidth = 4; ctx.stroke();
  ctx.restore();
}
function s02(ctx,t) {
  // v7：去掉“电影缩小成照片再淡出”的跳变，改由 GL 墨染转场从 001 进来，这里只画人脑
  const z = 1 + 0.03 * smooth(prog(t, T2, L('002').t1 + 0.4));
  ctx.save(); ctx.translate(960, 600); ctx.scale(z, z); ctx.translate(-960, -600);
  const map=B.head(ctx,{x:960,y:910,h:720,glass:0});
  const tc=at('002','漏洞'); crack(ctx,map,prog(t,tc-0.5,tc+0.4),smooth(prog(t,tc,tc+0.6)));
  ctx.restore();
  V.verdict(ctx,t,'002','大脑里的漏洞',tc,960,850,78);
}
// ———— 003：章节卡 No.3 权威误导；芒格版画；“一身制服”“一个头衔” → “跳过核实” ————
const MUNGER = CUT.has('eng_munger') ? CUT.get('eng_munger') : null;
const NO = P.poly(P.jag([[0, 0], [250, 0], [250, 130], [0, 130]], 3, 14, 63));
const TITLE = P.poly(P.jag([[0, 0], [880, 0], [880, 200], [0, 200]], 3, 16, 64));
function s03(ctx,t) {
  if (MUNGER) CUT.place(ctx,MUNGER,960,830,610,{});
  V.verdict(ctx,t,'003','No.3  权威误导',at('003','权威误导'),960,840,94);
}
// ———— 004：档案卡 + 场记板（猫鼠游戏 2002）→ 档案卡退到左边，G02 机长制服从右下升起 ————
function archive(ctx, t, typedAt) {
  ctx.save(); ctx.translate(820, 500); ctx.rotate(-0.025);
  P.piece(ctx, P.poly(P.jag([[-560, -330], [560, -330], [560, 330], [-560, 330]], 2, 18, 13)), Q.KRAFT, { blur: 24, dy: 12 });
  ctx.fillStyle = '#cfb27c'; ctx.fillRect(-560, -330, 1120, 70);
  ctx.strokeStyle = 'rgba(90,60,30,0.35)'; ctx.lineWidth = 3; for (let k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(-40, -140 + k * 70); ctx.lineTo(500, -140 + k * 70); ctx.stroke(); }
  ctx.save(); ctx.translate(-300, 30); ctx.rotate(0.03);
  P.piece(ctx, P.poly([[-200, -250], [200, -250], [200, 250], [-200, 250]]), '#f4ecdc', { blur: 14, dy: 6 });
  ctx.save(); ctx.beginPath(); ctx.rect(-180, -230, 360, 460); ctx.clip(); Q.put(ctx, 'G03', 0, 236, 470, { shadow: false, ar: 0.83, label: '阿巴格内尔' }); ctx.restore();
  ctx.restore();
  Q.clip(ctx, -330, -310, 1.1, -0.1);
  Q.typed(ctx, 'FRANK W. ABAGNALE', -40, -170, 56, typedAt == null ? 99 : Q.typeN(t, typedAt, 14));
  ctx.restore();
}
function s04(ctx, t) {
  const tg = at('004', '他弄到') - 0.2, sh = easeInOut(prog(t, tg, tg + 0.7));
  ctx.save(); ctx.translate(-330 * sh, 40 * sh); ctx.translate(820, 500); ctx.scale(1 - 0.22 * sh, 1 - 0.22 * sh); ctx.translate(-820, -500);
  archive(ctx, t, at('004', '阿巴格内尔') - 0.2);
  ctx.restore();
  const q = easeOut(prog(t, at('004', '电影') - 0.1, at('004', '电影') + 0.6)), out = easeIn(prog(t, tg, tg + 0.5));
  if (q > 0.01) Q.clapper(ctx, lerp(2200, 1470, q) + out * 900, 690, 520, prog(t, at('004', '猫鼠'), at('004', '猫鼠') + 0.35), ['猫鼠游戏', '2002'], { rot: 0.1 });
  const e = easeOut(prog(t, tg + 0.2, tg + 1.1));
  if (e > 0.01) Q.put(ctx, 'G02', 1430, lerp(1500, 1010, e), 820, { ar: 0.66, rot: 0.02 });
  Q.tag(ctx, 1450, 170, '泛美机长制服', pop(t, at('004', '泛美')), { size: 66, hl: true, rot: 0.03, seed: 41 });
}
// 005：机场片段接着放，再切地图；不再使用银行或支票。
const T5=L('005').t0-0.2, T5B=at('005','驾驶舱')-0.2;
F.use('film_airport',T5,T5B+0.3);
function s05a(ctx,t) {
  if(F.has('film_airport')) F.draw(ctx,'film_airport',Math.min(F.dur('film_airport')-0.1,2+t-T5),960,470,1500);
  else Q.sheet(ctx,'G04',960,470,1500,820);
}
// ———— 005 下：世界地图，航线一段段画过去；“驾驶舱”“免费” ————
const ROUTE = [[0.255, 0.39], [0.47, 0.33], [0.55, 0.47], [0.77, 0.36], [0.30, 0.62], [0.60, 0.70]];
function s05b(ctx, t) {
  const MW = 1500, MH = 830, cx = W / 2 - 40, cy = 470;
  Q.sheet(ctx, 'G08', cx, cy, MW, MH, { seed: 91, label: '旧世界地图' });
  const pts = ROUTE.map(([u, v]) => [cx - MW / 2 + u * MW, cy - MH / 2 + v * MH]);
  const t0 = at('005', '满世界') - 0.3, t1 = L('005').t1 + 0.3, seg = (t1 - t0) / (pts.length - 1);
  ctx.save(); ctx.setLineDash([18, 14]); ctx.strokeStyle = Q.RUST; ctx.lineWidth = 6; ctx.lineCap = 'round';
  for (let k = 0; k < pts.length - 1; k++) {
    const p = prog(t, t0 + k * seg, t0 + (k + 0.8) * seg); if (p <= 0) break;
    const [a, b] = [pts[k], pts[k + 1]], m = [(a[0] + b[0]) / 2, Math.min(a[1], b[1]) - 90];
    const q = K.partial(X.bez(a, m, b, 30), p); ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (const [x, y] of q.slice(1)) ctx.lineTo(x, y); ctx.stroke();
  }
  ctx.restore();
  for (let k = 0; k < pts.length; k++) { const p = pop(t, t0 + (k - 0.2) * seg, 0.25); if (p > 0.01) { ctx.save(); ctx.globalAlpha = p; ctx.fillStyle = Q.RUST; ctx.beginPath(); ctx.arc(pts[k][0], pts[k][1], 12, 0, Math.PI * 2); ctx.fill(); ctx.restore(); } }
  Q.put(ctx, 'G02', 1640, 900, 420, { ar: 0.66, rot: 0.04, alpha: pop(t, at('005', '驾驶舱') - 0.3) });
  Q.tag(ctx, 1640, 420, '驾驶舱', pop(t, at('005', '驾驶舱')), { size: 64, hl: true, rot: -0.03, seed: 54 });
  Q.tag(ctx, 300, 200, '免费', pop(t, at('005', '免费')), { size: 70, hl: true, rot: -0.05, seed: 55 });
}
// ———— 006：电影医生镜头 → 两张工牌（儿科主管、州助理检察长） ————
const T6 = L('006').t0 - 0.2, T6E = at('006', '换一身') - 0.2;
F.use('film_doctor', T6, T6E + 0.5);
const face = (c, x, y, h) => Q.put(c, 'G03', x, y, h, { shadow: false, ar: 0.83 });
const PROPS = [
 (c,x,y)=>U.putPart(c,'G09',x,y+26,74,[0,0,0.40,1],{shadow:false}),
 (c,x,y)=>U.putPart(c,'G09',x,y+26,60,[0.40,0.25,0.73,1],{shadow:false}),
];
const BADGES = [['儿科主管', '#7b2a24'], ['州助理检察长', '#2f4a63']];
function badges(ctx, t, ts, pos) {
  BADGES.forEach(([title, band], k) => {
    const e = easeOut(prog(t, ts[k], ts[k] + 0.55)); if (e <= 0) return;
    const [x, y, r] = pos[k];
    Q.badge(ctx, lerp(W + 300, x, e), y, title, face, PROPS[k], { rot: lerp(0.5, r, e), band, seed: 40 + k });
  });
}
function s06(ctx, t) {
  const tb = [T6E + 0.15, at('006', '州助理检察长') - 0.3];
  badges(ctx, t, tb, [[700, 520, -0.06], [1220, 540, 0.05]]);
  if (F.has('film_doctor') && t < T6E + 0.6) {
    const e = easeOut(prog(t, T6, T6 + 0.5)), out = easeInOut(prog(t, T6E - 0.1, T6E + 0.5));
    F.draw(ctx, 'film_doctor', t - T6, lerp(W / 2 - 80, -900, out), lerp(H + 500, 470, e), 1260, { rot: -0.015, seed: 61 });
    Q.tag(ctx, lerp(1600, -300, out), 170, '白大褂', pop(t, at('006', '白大褂')), { size: 62, rot: -0.03, seed: 62 });
    Q.tag(ctx, lerp(1580, -300, out), 330, '儿科主管', pop(t, at('006', '儿科主管')), { size: 70, hl: true, rot: 0.02, seed: 63 });
  }
  Q.tag(ctx, 1600, 200, '西装', pop(t, at('006', '西装')), { size: 60, rot: 0.04, seed: 64 });
}
// ———— 007：工牌、支票、制服堆在一起，一个大红褐色问号盖下去 ————
function s07(ctx,t) {
  // 制服、两张工牌、电影定格组成一件证物拼贴；问号落下后画面收住。
  Q.put(ctx,'G02',960,825,590,{rot:-0.04});
  if(F.has('film_airport')) F.draw(ctx,'film_airport',2,590,430,530,{rot:-0.09});
  Q.badge(ctx,620,560,'儿科主管',face,PROPS[0],{rot:-0.07,seed:40});
  Q.badge(ctx,1330,500,'州助理检察长',face,PROPS[1],{rot:0.06,seed:41});
  X.mark(ctx,960,440,440,'?',pop(t,at('007','回头'),0.8)*0.94,Q.RUST);
  V.verdict(ctx,t,'007','他到底是谁',at('007','他到底'),960,850,82);
}
U.stampAt('?', at('007', '回头') - 0.1 + 0.45 / 1.3, 'minor');

module.exports={shots:[
 {a:0,tr:'cut',draw:s01,name:'001',photoSubs:()=>true},
 {a:T2-0.3,gl:'moran',draw:s02,name:'002'},
 {a:L('003').t0-0.2,tr:'fade',draw:s03,name:'003'},
 {a:L('004').t0-0.2,tr:'slide',draw:s04,name:'004'},
 {a:T5,tr:'fade',draw:s05a,name:'005a'},
 {a:T5B,tr:'fade',draw:s05b,name:'005b'},
 {a:T6,tr:'slide',draw:s06,name:'006'},
 {a:L('007').t0-0.15,tr:'fade',draw:s07,name:'007'}
],archive,face,PROPS,BADGES};
