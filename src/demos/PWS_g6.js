'use strict';
// PWG6：F01–F10 精力（书页 P3 之后）→ 书页 P4/P5 → 关注卡
//   A「深夜的书桌」F01–F05（她的房间，台灯是主光）
//     F01 保护好自己的精力：她手里捧着一只玻璃罩，里面一朵小火苗（她的精力）。窗缝的风一吹火苗就歪，她侧过身用两只手拢住，火苗稳下来
//     F02 蓝量不比别人差：桌边立起一只大蓝药瓶（梗：蓝量），旁边两只别人的瓶子，一道水位线横着扫过去 —— 三只一样满
//     F03 机器长时间工作：她头顶浮出一组齿轮在转，蓝色的药液顺着管子流进齿轮，瓶子开始往下掉
//     F04 没工作自己找工作（旁边自己蹦出一个新齿轮）/ 小工作变大工作（一个小齿轮越长越大）/ 工作过的重复工作（同一张纸在两个齿轮之间一圈圈地转）
//     F05 磨损过度：齿轮烧得发红、冒火星、崩掉几颗齿，药瓶见底，她趴了下去
//   B「雨夜的街」F06–F08（回到 PWG2 那条老街，路灯是主光）
//     F06 过于敏感、过度承接他人情绪：四个路人从她身边走过，每人身上一团不同颜色的情绪飘出来，全被吸进她胸口，她身上染上别人的颜色
//     F07 血包：她旁边一只输液架，挂着心形的血包，管子通向四个路人，红色一股股流出去，血包瘪下去，她垂下头
//     F08 过高的道德水准：镜头抬高 —— 一根灰色的横杆在她头顶（一般的标准），她给自己定的那根金色横杆高在画面最上面，她踮脚去够
//   C「山崖 · 黎明」F09–F10（回到 PWG2 的山崖，天亮了）
//     F09 学会拒绝、切分边界：几条伸向她的管子停在半空；她抬手，一圈柔光从脚下画开，立起一只薄薄的光罩，管子到了边上自己弯开
//     F10 别被同情心绑架：缠在她身上的粉色绸带一圈圈松开、落下，变成花瓣吹向日出；城市的灯一片片熄，天亮了
//   关注卡：保留原来的设计（金色光粒聚成「关注依恋研究室」）
const X = require('./pwk');
const { infp } = require('./pf');
const MB = require('./mb');
const S = require('./PWS_kit');
const RM = require('./PWS_room');
const SB = require('./PWS_g2b');
const CL = require('./PWS_cliff');
const { K, C: LC, GOLD, LIME, PINK, BLUE, RED, vs, ve, at } = X;
const { W, H, clamp, lerp, prog, smooth, easeOut, easeIn, easeInOut, rgba, mix, hash, mulberry32 } = K;
const glow = S.glow;

const T = { in: vs('F01') - 2.2, f01: vs('F01'), task: at('F01', '课题'), guard: at('F01', '保护'), f02: vs('F02'), mana: at('F02', '蓝量'), other: at('F02', '别人'), f03: vs('F03'), mach: at('F03', '机器'), f04: vs('F04'), g1: at('F04', '自己找'), g2: at('F04', '小工作'), g3: at('F04', '工作过'), f05: vs('F05'), wear: at('F05', '磨损'),
  f06: vs('F06'), sens: at('F06', '敏感'), take: at('F06', '承接'), f07: vs('F07'), blood: at('F07', '血包'), tired: at('F07', '劳累'), f08: vs('F08'), moral: at('F08', '道德'), f09: vs('F09'), no: at('F09', '拒绝'), edge: at('F09', '边界'), f10: vs('F10'), pity: at('F10', '同情心'), free: at('F10', '绑架'), end: ve('F10') + 0.6 };
const TB = T.f06 - 0.55, TC = T.f09 - 0.6;
// ================= A：深夜的书桌 =================
const CAMA = [[T.in, { x: 0, y: 0, z: 1.0, ax: 540, ay: 1000 }], [T.task, { x: -20, y: 20, z: 1.34 }], [T.f02 - 0.2, { x: -20, y: 20, z: 1.4 }], [T.f02 + 0.8, { x: 60, y: -10, z: 1.06 }], [T.f03 - 0.1, { x: 60, y: -10, z: 1.08 }], [T.f03 + 0.9, { x: 30, y: -150, z: 1.0 }], [T.f05, { x: 30, y: -160, z: 1.04 }], [TB + 0.5, { x: 30, y: -120, z: 1.12 }]];
function gear(ctx, x, y, r, n, rot, hot = 0, a = 1, broke = 0) {
  if (a <= 0.003 || r < 2) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha *= a;
  if (hot > 0.02) S.add(ctx, () => glow(ctx, 0, 0, r * 2.2, [255, 90, 40], 0.5 * hot));
  const c0 = mix([214, 220, 236], [255, 150, 90], hot), c1 = mix([110, 118, 146], [200, 60, 40], hot), g = ctx.createLinearGradient(-r, -r, r, r); g.addColorStop(0, rgba(c0)); g.addColorStop(1, rgba(c1));
  ctx.fillStyle = g; ctx.beginPath();
  for (let k = 0; k < n; k++) { const a0 = k / n * 6.2832, d = 6.2832 / n, gone = broke > 0 && hash(k * 3.7 + r) < broke; const ro = gone ? r * 0.82 : r * 1.16; ctx.lineTo(Math.cos(a0) * r * 0.86, Math.sin(a0) * r * 0.86); ctx.lineTo(Math.cos(a0 + d * 0.18) * ro, Math.sin(a0 + d * 0.18) * ro); ctx.lineTo(Math.cos(a0 + d * 0.5) * ro, Math.sin(a0 + d * 0.5) * ro); ctx.lineTo(Math.cos(a0 + d * 0.68) * r * 0.86, Math.sin(a0 + d * 0.68) * r * 0.86); }
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = rgba(mix(c1, [0, 0, 20], 0.3)); ctx.beginPath(); ctx.arc(0, 0, r * 0.56, 0, 6.2832); ctx.fill(); ctx.fillStyle = rgba(c0); for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(Math.cos(k * 1.2566) * r * 0.34, Math.sin(k * 1.2566) * r * 0.34, r * 0.1, 0, 6.2832); ctx.fill(); } ctx.beginPath(); ctx.arc(0, 0, r * 0.14, 0, 6.2832); ctx.fill();
  ctx.restore();
}
function flask(ctx, x, y, s, lv, a, label, t) {     // 蓝药瓶：圆肚 + 细颈 + 木塞；lv 水位
  if (a <= 0.003) return; ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.globalAlpha *= a;
  S.add(ctx, () => glow(ctx, 0, -150, 330, [70, 150, 255], 0.3 + 0.2 * lv));
  const body = () => { ctx.beginPath(); ctx.moveTo(-34, -330); ctx.lineTo(34, -330); ctx.lineTo(34, -250); ctx.bezierCurveTo(150, -210, 150, 0, 0, 0); ctx.bezierCurveTo(-150, 0, -150, -210, -34, -250); ctx.closePath(); };
  body(); ctx.fillStyle = 'rgba(200,226,255,0.16)'; ctx.fill();
  ctx.save(); body(); ctx.clip(); const wy = -246 * clamp(lv); const g = ctx.createLinearGradient(0, wy, 0, 0); g.addColorStop(0, 'rgba(130,200,255,0.95)'); g.addColorStop(1, 'rgba(40,90,230,0.96)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-160, 10); ctx.lineTo(-160, wy); for (let k = 0; k <= 10; k++) ctx.lineTo(-160 + k * 32, wy + Math.sin(k * 1.3 + t * 3) * 5); ctx.lineTo(160, 10); ctx.fill();
  for (let k = 0; k < 6; k++) { const ph = (t * 0.5 + hash(k * 3.1)) % 1; ctx.fillStyle = `rgba(255,255,255,${0.5 * (1 - ph)})`; ctx.beginPath(); ctx.arc((hash(k * 7.7) - 0.5) * 150, wy * ph - 8, 5 + hash(k) * 7, 0, 6.2832); ctx.fill(); } ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.beginPath(); ctx.ellipse(-70, -150, 14, 60, 0.3, 0, 6.2832); ctx.fill(); ctx.strokeStyle = 'rgba(226,240,255,0.7)'; ctx.lineWidth = 6; body(); ctx.stroke();
  ctx.fillStyle = 'rgb(170,120,80)'; ctx.beginPath(); ctx.roundRect(-30, -362, 60, 40, 8); ctx.fill();
  if (label) { ctx.fillStyle = 'rgb(250,240,214)'; ctx.beginPath(); ctx.roundRect(-70, -150, 140, 66, 10); ctx.fill(); K.text(ctx, label, 0, -102, { size: 46, weight: 500, color: [40, 70, 160] }); }
  ctx.restore();
}
const GEARS = [[460, 470, 150, 14, 1], [700, 400, 100, 10, -1.5], [300, 330, 84, 9, -1.8], [620, 600, 70, 8, 2.1]];
function actA(ctx, t) {
  const C = S.camKF(t, CAMA);
  const hot = smooth(prog(t, T.f05 - 0.2, T.wear + 0.3)), speed = 1 + 1.6 * smooth(prog(t, T.f04, T.f05)) + 1.5 * hot, drainLv = 1 - 0.9 * clamp(prog(t, T.mach + 0.3, T.wear + 0.4));
  RM.room(ctx, t, C, { lamp: 0.9 - 0.25 * hot, curtain: 0, moon: 1 });
  ctx.save(); S.cam(ctx, C, 1);
  const hx = 470, hy = RM.HER[1];
  // 窗缝里的风（F01）
  const wind = K.vis(t, T.f01 - 0.4, T.guard + 0.2, 0.5, 0.6), guard = smooth(prog(t, T.guard - 0.4, T.guard + 0.4));
  if (wind > 0.01) for (let k = 0; k < 3; k++) { const pts = Array.from({ length: 22 }, (_, q) => { const s = q / 21; return [lerp(760, hx + 160, s) + Math.sin(s * 7 + t * 4 + k) * 12, lerp(560 + k * 70, hy - 280 + k * 20, s) + Math.sin(s * 5 + t * 3) * 16]; }); S.ribbon(ctx, pts, s => 4 + 12 * Math.sin(s * Math.PI), [190, 210, 255], 0.3 * wind, ((t * 0.9 + k * 0.3) % 1) * 1.3); }
  const tired = smooth(prog(t, T.wear - 0.2, T.wear + 0.6));
  const o = { t, wind: false, eyes: tired > 0.4 ? 'closed' : guard > 0.5 && t < T.f02 ? 'happy' : 'open', mouth: tired > 0.4 ? 'flat' : 'smile', la: -0.7 * (1 - tired), ra: -0.5 * (1 - tired), tilt: 0.25 * guard * (t < T.f02 ? 1 : 0) + 0.8 * tired - 0.3 * smooth(prog(t, T.f03, T.f03 + 0.8)) * (1 - tired), lean: 0.05 * tired - 0.04 * wind * (1 - guard), dim: 0.4 * tired, look: t > T.f03 && tired < 0.3 ? [0, -1.8] : [0.8, 0.6] };
  ctx.save(); ctx.globalAlpha = 0.4; S.rgrad(ctx, hx + 50, hy + 6, 210, [[0, [10, 8, 30], 0.9], [1, [10, 8, 30], 0]], 0.16); ctx.restore();
  const R = S.lit(ctx, c => infp(c, hx, hy, 1.0, o), { light: RM.LAMP, at: [hx, hy - 290], r: 340, warm: [255, 214, 150], cool: [20, 20, 64], k: 1.1 });
  // 玻璃罩里的小火苗（精力）
  const jx = (R.lh[0] + R.rh[0]) / 2 + 26, jy = Math.min(R.lh[1], R.rh[1]) - 6, fl = (0.6 + 0.4 * guard) * (1 - 0.75 * tired) * (0.5 + 0.5 * drainLv), bend = Math.sin(t * 9) * 0.5 * wind * (1 - guard) - 0.5 * wind * (1 - guard);
  S.add(ctx, () => { glow(ctx, jx, jy - 50, 260 * fl, [255, 190, 110], 0.5 * fl + 0.1); });
  ctx.fillStyle = 'rgb(120,84,70)'; ctx.beginPath(); ctx.roundRect(jx - 44, jy - 4, 88, 18, 6); ctx.fill();
  ctx.save(); ctx.translate(jx, jy - 4); ctx.rotate(bend * 0.4); for (let i = 0; i < 3; i++) { const w = (26 - i * 7) * (0.6 + 0.6 * fl), h = (96 - i * 24) * (0.5 + 0.7 * fl) * (1 + 0.07 * Math.sin(t * 7 + i)), sw = bend * 30, col = [[255, 120, 60], [255, 196, 90], [255, 246, 206]][i]; ctx.fillStyle = rgba(col, 0.95); ctx.beginPath(); ctx.moveTo(-w, 0); ctx.bezierCurveTo(-w, -h * 0.5, -w * 0.2 + sw, -h * 0.7, sw * 1.4, -h); ctx.bezierCurveTo(w * 0.3 + sw, -h * 0.6, w, -h * 0.4, w, 0); ctx.closePath(); ctx.fill(); } ctx.restore();
  ctx.beginPath(); ctx.moveTo(jx - 48, jy - 2); ctx.bezierCurveTo(jx - 60, jy - 150, jx + 60, jy - 150, jx + 48, jy - 2); const jg = ctx.createLinearGradient(jx - 50, 0, jx + 50, 0); jg.addColorStop(0, 'rgba(255,255,255,0.3)'); jg.addColorStop(0.3, 'rgba(255,255,255,0.04)'); jg.addColorStop(1, 'rgba(255,255,255,0.22)'); ctx.fillStyle = jg; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 3; ctx.stroke();
  // 蓝药瓶 ×3：水位线一样高
  const fa = smooth(prog(t, T.f02 - 0.2, T.mana)), oa = smooth(prog(t, T.other - 0.5, T.other + 0.1)) * (1 - smooth(prog(t, T.f03, T.f03 + 0.8)));
  flask(ctx, 700, 1120, 0.62, 1, oa * 0.8, null, t + 1); flask(ctx, 1010, 1130, 0.62, 1, oa * 0.8, null, t + 2);
  flask(ctx, 860, 1160, 1.0, drainLv, fa, '蓝量', t);
  if (oa > 0.01) { const lu = easeInOut(prog(t, T.other - 0.3, T.other + 0.6)); S.add(ctx, () => { ctx.fillStyle = `rgba(190,230,255,${0.7 * oa})`; ctx.fillRect(600, 1160 - 246 - 3, 520 * lu, 6); glow(ctx, 600 + 520 * lu, 1160 - 246, 40, [200, 236, 255], oa); }); }
  // 齿轮组（脑子里的机器）
  const ga = smooth(prog(t, T.f03 - 0.1, T.mach + 0.2)); if (ga > 0.01) {
    const rot = (t - T.f03) * 1.1 * speed;
    S.add(ctx, () => S.rgrad(ctx, 480, 460, 560, [[0, [60, 70, 130], 0.3 * ga], [1, [60, 70, 130], 0]], 0.8));
    for (let k = 0; k < 3; k++) { ctx.fillStyle = `rgba(226,232,255,${0.5 * ga})`; ctx.beginPath(); ctx.arc(lerp(R.top[0] + 20, 440, (k + 1) / 4), lerp(R.top[1] - 10, 640, (k + 1) / 4), 9 + k * 6, 0, 6.2832); ctx.fill(); }
    // 药液顺着管子流进机器
    const pipe = Array.from({ length: 24 }, (_, q) => { const s = q / 23; return [lerp(860, 600, s) + Math.sin(s * Math.PI) * 120, lerp(1160 - 362, 520, s)]; }); S.ribbon(ctx, pipe, s => 7 + 10 * Math.exp(-Math.pow((s - (t * 0.8 % 1)) * 5, 2)), [80, 150, 255], 0.6 * ga * (drainLv > 0.12 ? 1 : 0.2), 1);
    const g1 = easeOut(prog(t, T.g1 - 0.1, T.g1 + 0.4)), g2 = easeInOut(prog(t, T.g2 - 0.1, T.g2 + 0.9)), g3 = smooth(prog(t, T.g3 - 0.2, T.g3 + 0.3));
    const sh = hot ? Math.sin(t * 60) * 4 * hot : 0;
    GEARS.forEach(([x, y, r, n, sp], i) => { const rr = i === 2 ? r * (1 + 1.0 * g2) : r; gear(ctx, x + sh * (i % 2 ? 1 : -1), y, rr, i === 2 ? n + Math.round(6 * g2) : n, rot * sp * (i === 2 ? 1 / (1 + g2) : 1), hot, ga, hot * 0.3); });
    gear(ctx, 820, 600, 62 * (g1 + 0.3 * Math.sin(Math.min(1, g1) * Math.PI)), 8, -rot * 2.4, hot, g1, hot * 0.3);
    // 重复工作：同一张纸在两个齿轮之间转圈
    if (g3 > 0.01) { const a = t * 3.4 * (0.6 + 0.4 * speed), px = 580 + Math.cos(a) * 190, py = 500 + Math.sin(a) * 60; ctx.save(); ctx.translate(px, py); ctx.rotate(Math.sin(a) * 0.5); ctx.globalAlpha = g3; ctx.fillStyle = 'rgb(255,250,236)'; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 10; ctx.fillRect(-34, -44, 68, 88); ctx.shadowColor = 'transparent'; for (let q = 0; q < 4; q++) { ctx.fillStyle = 'rgba(110,120,160,0.5)'; ctx.fillRect(-24, -30 + q * 17, 48 - q * 6, 6); } ctx.restore(); }
    if (hot > 0.05) S.add(ctx, () => { for (let k = 0; k < 14; k++) { const ph = (t * 1.6 + hash(k * 2.9)) % 1, [gx, gy] = GEARS[k % 4], an = hash(k * 5.1 + Math.floor(t * 1.6 + hash(k * 2.9))) * 6.28; glow(ctx, gx + Math.cos(an) * ph * 190, gy + Math.sin(an) * ph * 190 + ph * ph * 120, 22 * (1 - ph) + 5, [255, 190, 90], hot * (1 - ph)); } });
    if (hot > 0.3) for (let k = 0; k < 5; k++) { const ph = (t * 0.4 + k / 5) % 1; S.rgrad(ctx, 500 + Math.sin(k * 2) * 160 + ph * 40, 300 - ph * 260, 90 + ph * 110, [[0, [70, 70, 90], 0.34 * hot * (1 - ph)], [1, [70, 70, 90], 0]]); }
  }
  ctx.restore();
  RM.front(ctx, t, C, 1);
  return { C };
}
// ================= B：雨夜的街 =================
const BX = 1300, GYS = SB.GY;
const CAMB = [[TB, { x: BX - 540, y: 0, z: 1.0, ax: W / 2, ay: GYS }], [T.take, { x: BX - 540, y: 0, z: 1.08 }], [T.f07, { x: BX - 540, y: 0, z: 1.12 }], [T.tired, { x: BX - 540 + 20, y: 0, z: 1.2 }], [T.f08, { x: BX - 540 + 20, y: 0, z: 1.2 }], [T.moral + 0.3, { x: BX - 540, y: -330, z: 0.82 }], [TC + 0.4, { x: BX - 540, y: -340, z: 0.8 }]];
const WALKERS = [['estj-male', -480, 30, 1.9, [255, 100, 80]], ['isfp-female', -290, -14, 1.6, [110, 150, 255]], ['entj-female', 330, -10, 1.65, [190, 120, 255]], ['esfj-male', 520, 34, 1.95, [255, 190, 90]]];
function actB(ctx, t) {
  const C = S.camKF(t, CAMB);
  SB.world(ctx, t, C);
  ctx.save(); S.cam(ctx, C, 1);
  SB.lamp(ctx, BX - 190, t);
  const take = prog(t, T.sens - 0.3, T.f07 - 0.2), bl = smooth(prog(t, T.blood - 0.4, T.blood + 0.2)), lvl = 1 - 0.85 * clamp(prog(t, T.blood + 0.2, T.f08)), tired = smooth(prog(t, T.tired - 0.6, T.tired + 0.3)), moral = smooth(prog(t, T.moral - 0.3, T.moral + 0.5));
  const L0 = [BX - 190, GYS - 760], WP = [];
  WALKERS.filter(w => w[2] < 0).forEach((w, i) => { const [key, dx, dy, s, col] = w, wx = BX + dx + Math.sin(t * 0.3 + dx) * 14; const P = S.lit(ctx, c => MB.person(c, key, wx, GYS + dy, s, { flip: dx > 0, bob: Math.abs(Math.sin(t * 2.2 + dx)) * 4, warm: 0.6 * (1 - lvl) }), { light: L0, at: [wx, GYS - 250], r: 320, warm: [255, 222, 170], cool: [20, 20, 64], k: 0.9 }); WP.push([P, col, w]); });
  // 输液架 + 心形血包
  const sx = BX + 150, top = GYS - 720;
  if (bl > 0.01) { ctx.save(); ctx.globalAlpha = bl; const g = ctx.createLinearGradient(sx - 6, 0, sx + 6, 0); g.addColorStop(0, 'rgb(90,96,120)'); g.addColorStop(0.5, 'rgb(214,220,240)'); g.addColorStop(1, 'rgb(70,76,100)'); ctx.fillStyle = g; ctx.fillRect(sx - 6, top, 12, 720); ctx.fillRect(sx - 60, top, 120, 10); ctx.beginPath(); ctx.ellipse(sx, GYS, 70, 12, 0, 0, 6.2832); ctx.fill(); ctx.restore(); }
  // 她
  const hx = BX, taint = smooth(take) * (1 - 0.3 * bl), tip = moral * (1 - smooth(prog(t, TC, TC + 0.4)));
  const o = { t, wind: false, eyes: tired > 0.4 ? 'closed' : take > 0.2 && bl < 0.5 ? 'sad' : 'open', mouth: 'flat', tilt: 0.7 * tired * (1 - tip) - 0.5 * tip, lean: 0.03 * Math.sin(t * 3) * taint + 0.04 * tired, dim: 0.5 * tired * (1 - 0.5 * tip), la: -1.3 * tip, ra: -1.5 * tip, look: tip > 0.3 ? [0, -2] : [0, 0.5] };
  const hop = tip * (8 + Math.abs(Math.sin(t * 5)) * 16);
  const R = S.lit(ctx, c => infp(c, hx, GYS - hop, 1.0, o), { light: L0, at: [hx, GYS - 290], r: 340, warm: [255, 222, 170], cool: [20, 20, 64], k: 0.95, tint: taint > 0.05 ? [[130, 110, 190], 0.28 * taint] : null });
  WALKERS.filter(w => w[2] >= 0).forEach(w => { const [key, dx, dy, s, col] = w, wx = BX + dx + Math.sin(t * 0.3 + dx) * 14; const P = S.lit(ctx, c => MB.person(c, key, wx, GYS + dy, s, { flip: dx > 0, bob: Math.abs(Math.sin(t * 2.2 + dx)) * 4, warm: 0.6 * (1 - lvl) }), { light: L0, at: [wx, GYS - 250], r: 320, warm: [255, 222, 170], cool: [20, 20, 64], k: 0.9 }); WP.push([P, col, w]); });
  // F06：别人的情绪一团团飘出来，全被吸进她胸口
  if (take > 0 && bl < 1) WP.forEach(([P, col], i) => { const a0 = 1 - bl; S.add(ctx, () => { for (let k = 0; k < 7; k++) { const u = k / 6, ph = (t * 0.6 + hash(k * 3.1 + i)) % 1; S.rgrad(ctx, P.chest[0] + Math.sin(t * 1.7 + k * 1.3 + i) * 14, P.chest[1] - (u * 90 + ph * 50), 56 - u * 26, [[0, mix(col, [255, 255, 255], 0.25), 0.4 * a0 * smooth(take * 3) * (1 - ph * 0.7)], [1, col, 0]], 1.25); } });
    for (let k = 0; k < 3; k++) { const ph = (t * 0.55 + k / 3 + i * 0.17) % 1, u = prog(take, 0.15 + i * 0.1, 0.4 + i * 0.1); if (u <= 0) continue; const px = lerp(P.chest[0], R.chest[0], ph), py = lerp(P.chest[1] - 40, R.chest[1], ph) - Math.sin(ph * Math.PI) * 90; S.add(ctx, () => glow(ctx, px, py, 60 * (1 - 0.4 * ph), col, 0.8 * u * a0 * Math.sin(ph * Math.PI))); } });
  // F07：血包 + 管子
  if (bl > 0.01) { const bx = sx + 6, by = top + 120; ctx.save(); ctx.globalAlpha = bl; S.add(ctx, () => glow(ctx, bx, by, 240, [255, 80, 90], 0.4 * lvl + 0.1));
    ctx.strokeStyle = 'rgba(226,230,250,0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sx, top + 6); ctx.lineTo(bx, by - 90); ctx.stroke();
    const heart = sc => { ctx.beginPath(); ctx.moveTo(0, 86 * sc); ctx.bezierCurveTo(-130 * sc, 0, -108 * sc, -112 * sc, -46 * sc, -102 * sc); ctx.bezierCurveTo(-20 * sc, -98 * sc, 0, -76 * sc, 0, -60 * sc); ctx.bezierCurveTo(0, -76 * sc, 20 * sc, -98 * sc, 46 * sc, -102 * sc); ctx.bezierCurveTo(108 * sc, -112 * sc, 130 * sc, 0, 0, 86 * sc); };
    ctx.translate(bx, by); const sq = 0.82 + 0.18 * lvl; ctx.scale(sq, 1); heart(1); ctx.fillStyle = 'rgba(255,236,236,0.3)'; ctx.fill(); ctx.save(); heart(1); ctx.clip(); const wy = 86 - 190 * lvl; const g = ctx.createLinearGradient(0, wy, 0, 90); g.addColorStop(0, 'rgb(255,110,120)'); g.addColorStop(1, 'rgb(190,30,60)'); ctx.fillStyle = g; ctx.fillRect(-140, wy + Math.sin(t * 3) * 3, 280, 200); ctx.restore(); ctx.strokeStyle = 'rgba(255,240,240,0.8)'; ctx.lineWidth = 6; heart(1); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-56, -50, 12, 26, 0.5, 0, 6.2832); ctx.fill(); ctx.restore();
    const B0 = [bx, by + 86];
    const tube = (A, Bp, sag, f) => { const pts = Array.from({ length: 26 }, (_, q) => { const s = q / 25; return [lerp(A[0], Bp[0], s), lerp(A[1], Bp[1], s) + Math.sin(s * Math.PI) * sag]; }); ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); pts.slice(0, Math.max(2, Math.floor(26 * f))).forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = `rgba(250,236,240,${0.5 * bl})`; ctx.lineWidth = 12; ctx.stroke(); ctx.strokeStyle = `rgba(214,50,70,${0.9 * bl})`; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
      if (f >= 1) S.add(ctx, () => { for (let k = 0; k < 2; k++) { const ph = (t * 0.7 + k / 2) % 1, p = pts[Math.floor(ph * 25)]; glow(ctx, p[0], p[1], 34, [255, 110, 120], 0.9 * bl); } }); };
    tube(R.chest, [bx - 20, by + 40], 60, 1);
    WP.forEach(([P], i) => tube(B0, [P.chest[0], P.chest[1]], 150 + (i % 2) * 70, easeOut(prog(t, T.blood + 0.1 + i * 0.25, T.blood + 0.7 + i * 0.25)))); }
  // F08：两根横杆
  if (moral > 0.01) { const bar = (y, col, w, lab, al) => { ctx.save(); ctx.globalAlpha = al; S.add(ctx, () => glow(ctx, BX, y, w * 0.7, col, 0.4)); const g = ctx.createLinearGradient(0, y - 20, 0, y + 20); g.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.5))); g.addColorStop(1, rgba(mix(col, [0, 0, 0], 0.4))); ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(BX - w / 2, y - 20, w, 40, 20); ctx.fill(); K.text(ctx, lab, BX, y - 50, { size: 72, weight: 500, color: mix(col, [255, 255, 255], 0.4), spacing: 0.08 }); ctx.restore(); };
    bar(GYS - 760, [150, 160, 190], 520, '一般的标准', moral * 0.9); bar(lerp(GYS - 760, GYS - 1420, easeOut(prog(t, T.moral - 0.2, T.moral + 0.8))), [255, 206, 110], 760, '她给自己定的标准', moral); }
  ctx.restore();
  S.rain(ctx, t, { a: 0.8, n: 100 });
  return { C };
}
// ================= C：山崖 · 黎明 =================
const CAMC = [[TC, { x: -40, y: -20, z: 1.3 }], [T.no, { x: -30, y: -10, z: 1.16 }], [T.f10, { x: 0, y: -10, z: 1.06 }], [T.free + 0.4, { x: 10, y: -30, z: 0.96 }], [T.end + 1, { x: 10, y: -40, z: 0.92 }]];
function actC(ctx, t) {
  const C = S.camKF(t, CAMC), dawn = smooth(prog(t, TC, T.end)), hx = 430, hy = CL.cliffTop(430) + 6;
  CL.world(ctx, t, C, { city: 1 - 0.75 * dawn, wave: 0, moonA: 1 - dawn });
  // 天亮：从地平线漫上来的暖色 + 升起来的太阳
  ctx.save(); S.cam(ctx, C, 0.3); ctx.globalCompositeOperation = 'screen'; S.vgrad(ctx, [[0, [60, 80, 170], 0.2 * dawn], [0.5, [255, 150, 130], 0.4 * dawn], [0.72, [255, 206, 150], 0.5 * dawn], [1, [255, 206, 150], 0]], 0, 1340, -400, W + 400); ctx.restore();
  ctx.save(); S.cam(ctx, C, 0.3); const sy = lerp(1100, 930, easeOut(dawn)); S.add(ctx, () => { glow(ctx, 900, sy, 1000, [255, 170, 110], 0.3 * dawn); glow(ctx, 900, sy, 240, [255, 220, 160], 0.5 * dawn); glow(ctx, 900, sy, 90, [255, 250, 230], dawn); }); ctx.restore();
  ctx.save(); S.cam(ctx, C, 1);
  const stop = smooth(prog(t, T.no - 0.3, T.no + 0.3)), ringU = easeInOut(prog(t, T.no, T.edge + 0.3)), dome = smooth(prog(t, T.edge - 0.2, T.edge + 0.6)), free = prog(t, T.pity, T.free + 0.9);
  // 伸过来的管子：到边界就弯开
  for (let i = 0; i < 4; i++) { const from = [[-200, 700], [-200, 1050], [1300, 620], [1300, 980]][i], reach = easeOut(prog(t, TC + 0.1 + i * 0.15, T.no)) * (1 - 0.45 * dome), tx = lerp(from[0], hx + (i < 2 ? -40 : 60), reach * 0.86), ty = lerp(from[1], hy - 300, reach * 0.86) + (i % 2 ? 1 : -1) * 120 * dome;
    const pts = Array.from({ length: 22 }, (_, q) => { const s = q / 21; return [lerp(from[0], tx, s), lerp(from[1], ty, s) + Math.sin(s * Math.PI) * 80 + Math.sin(s * 8 + t * 2 + i) * 10]; }); ctx.save(); ctx.lineCap = 'round'; ctx.beginPath(); pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.strokeStyle = 'rgba(250,236,240,0.5)'; ctx.lineWidth = 13; ctx.stroke(); ctx.strokeStyle = 'rgba(214,60,80,0.9)'; ctx.lineWidth = 6; ctx.stroke(); ctx.restore(); S.add(ctx, () => glow(ctx, tx, ty, 40, [255, 120, 130], 0.7)); }
  // 她
  const o = { t, spin: t * (1.5 + 5 * smooth(free)), eyes: free > 0.5 ? 'happy' : 'open', mouth: 'smile', la: -0.9 * stop * (1 - smooth(free)) - 0.9 * smooth(prog(free, 0.5, 1)), ra: -0.6 * smooth(prog(free, 0.5, 1)), tilt: -0.2 * smooth(free), look: [1, -0.6] };
  S.add(ctx, () => S.rgrad(ctx, hx, hy + 4, 240, [[0, [255, 214, 160], 0.12 + 0.12 * dome], [1, [255, 214, 160], 0]], 0.16));
  const R = S.lit(ctx, c => infp(c, hx, hy, 0.95, o), { light: [900, 800], at: [hx, hy - 270], r: 330, warm: mix([226, 232, 255], [255, 214, 160], dawn), cool: [30, 30, 80], k: 0.9 });
  // 边界：脚下画开的光圈 + 薄薄的光罩
  if (ringU > 0.01) { const pts = Array.from({ length: 49 }, (_, k) => { const a = -1.57 + (k / 48) * 6.2832; return [hx + Math.cos(a) * 300, hy + 8 + Math.sin(a) * 52]; }); S.neon(ctx, pts, ringU, [255, 226, 160], 0.95, 7, false, 0.4);
    if (dome > 0.01) S.add(ctx, () => { S.rgrad(ctx, hx, hy - 270, 420, [[0, [255, 236, 190], 0], [0.82, [255, 236, 190], 0.03 * dome], [0.96, [255, 244, 210], 0.22 * dome], [1, [255, 244, 210], 0]], 0.92); }); }
  // 同情心的绸带：缠在身上 → 松开落下
  const wrap = smooth(prog(t, T.f10 - 0.4, T.pity)) * (1 - smooth(prog(free, 0.2, 0.9)));
  if (wrap > 0.01) for (let k = 0; k < 3; k++) { const y0 = hy - 120 - k * 110 + smooth(prog(free, 0.1, 0.9)) * (160 + k * 60), rx = (110 + k * 8) * (1 + 1.2 * smooth(prog(free, 0.1, 0.9))), pts = Array.from({ length: 30 }, (_, q) => { const a = q / 29 * 6.2832 * 1.05 + t * 0.6 + k; return [hx + 10 + Math.cos(a) * rx, y0 + Math.sin(a) * 26 + q * 1.2]; }); S.ribbon(ctx, pts, () => 14, [255, 90, 140], 0.55 * wrap, 1); }
  ctx.restore();
  S.petals(ctx, t, { n: 40, seed: 21, dir: [1, -0.25], speed: 320, a: smooth(prog(free, 0.25, 0.8)), c: [255, 150, 186], c2: [255, 232, 226], size: 22, box: [-100, 200, W + 100, 1400] });
  CL.front(ctx, t, C, 1 - 0.3 * dawn);
  return { C };
}
function overAll(ctx, t, a) {
  if (t >= TC) { const b = K.vis(t, T.edge - 0.1, T.f10 - 0.2, 0.4, 0.4) * a; if (b > 0.003) S.title(ctx, '边界', 430, 560 + (1 - easeOut(prog(t, T.edge - 0.1, T.edge + 0.5))) * 20, { size: 130, c: GOLD, a: b, spacing: 0.24, glowA: 0.8 }); }
}
// ================= 关注卡（保留原设计） =================
function card(G) {
  const p5 = G.PAGES.find(p => p.name === 'P5') || G.PAGES.find(p => p.name === 'P4'), A9 = p5.b + 0.2, B9 = G.END + 1, R0 = mulberry32(606);
  const M9 = Array.from({ length: 120 }, () => ({ a: R0() * 6.283, r: 300 + R0() * 700, s: 2 + R0() * 6, sp: 0.2 + R0() * 0.5, ph: R0() }));
  return { A9, draw(ctx, t) {
    const a = smooth(prog(t, A9, A9 + 0.5)); ctx.save(); ctx.globalAlpha *= a;
    const g = ctx.createRadialGradient(W / 2, 900, 0, W / 2, 900, 1300); g.addColorStop(0, 'rgb(40,30,22)'); g.addColorStop(0.5, 'rgb(16,12,12)'); g.addColorStop(1, 'rgb(6,6,8)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const u = easeOut(prog(t, A9, A9 + 2.5));
    S.add(ctx, () => { glow(ctx, W / 2, 920, 900, [255, 190, 120], 0.25 * u); glow(ctx, W / 2, 920, 300, [255, 220, 170], 0.25 * u);
      for (const m of M9) { const rr = m.r * (1 - 0.55 * u) + Math.sin(t * m.sp + m.ph * 6) * 30, an = m.a + t * 0.05; glow(ctx, W / 2 + Math.cos(an) * rr, 920 + Math.sin(an) * rr * 0.75, m.s * 3, GOLD, 0.35 * (0.5 + 0.5 * Math.sin(t * m.sp * 2 + m.ph * 6))); }
      ctx.save(); ctx.translate(W / 2, 1140); ctx.scale(1, 0.12); glow(ctx, 0, 0, 760, [255, 200, 140], 0.35 * u); ctx.restore(); });
    infp(ctx, W / 2, 1520, 0.62, { t, a: smooth(prog(t, A9 + 0.4, A9 + 1.6)) * 0.9, flies: 1, wind: true, spin: t * 2, eyes: 'happy' });
    ctx.restore();
  }, over(ctx, t, a) {
    const t0 = A9 + 0.5; ctx.save(); ctx.globalAlpha *= a;
    LC.gather(ctx, '关注依恋研究室', W / 2, 880, t, t0, B9 + 30, { size: 96, weight: 600, spacing: 0.12, keys: ['关注依恋研究室'], keyColor: GOLD, from: [W / 2, 920] });
    LC.gather(ctx, '了解更多心理知识', W / 2, 1010, t, t0 + 0.9, B9 + 30, { size: 54, weight: 500, spacing: 0.12, keys: ['了解更多心理知识'], keyColor: [242, 226, 190] });
    ctx.restore();
  } };
}
module.exports = { actA, actB, actC, overAll, card, T, TB, TC };
