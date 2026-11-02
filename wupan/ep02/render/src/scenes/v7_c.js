// 第二集 v5 · 米尔格拉姆 + 例子快速翻卡（016–022）
//   016 实验员白大褂背影 + 电压开关从左往右推到 450 V，26 / 40   017 “这段代码，今天还在到处跑”，代码卡四散
//   018 卡 1 瑞典假机长：驾驶舱窗口 + 13 年   019 卡 2 电视里的“神医”：苗医传人 → 换台 → 蒙医传人
//   020 卡 3 手机里的名医视频，扫描线扫过“AI 合成”   021–022 卡 4 电话听筒：假警察“我现在查你！”
// 真人（刘洪斌、张文宏）只用剪影，不画相貌
'use strict';
const K = require('../core');
const { W, H, clamp, lerp, smooth, prog, easeOut, easeIn, easeInOut } = K;
const TL = require('../timeline');
const P = require('../paper');
const X = require('../kit');
const Q = require('../kit02');
const B = require('../brain');
const C = require('../card');
const U = require('./v5_util');
const RULE = 'IF 权威说 → 照做';
const L = TL.L, at = TL.at;
const V = require("./v6_util");
const pop = V.pop;

// ———— 017：这段代码，今天还在到处跑 ————
const SPREAD = [[-640, -300], [620, -280], [-700, 230], [700, 260], [-120, 360], [180, -380]];
function s17(ctx,t) {
 const a=L('032').t0, tr=at('032','到处跑');
 // 代码卡向外散开，随后收回为一个主体，B8 的判词保持清静。
 const spread=K.vis(t,a,a+1.8,0.7,0.8);
 SPREAD.forEach(([dx,dy],k)=>{if(spread>0.01)B.ruleCard(ctx,960+dx*spread,450+dy*spread,RULE,40,{alpha:spread*0.4,seed:170+k});});
 B.ruleCard(ctx,960,450,RULE,74,{seed:171});
 V.verdict(ctx,t,'032','今天还在到处跑',at('032','今天'),960,760,78);
}
// ———— 018–022：翻卡 ————
const CX = 960, CY = 470, CW = 1460, CH = 800;
function cardNo(ctx, n) {
  ctx.save(); ctx.fillStyle = Q.INK; ctx.beginPath(); ctx.arc(70, 70, 40, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fbf3df'; ctx.font = '700 50px Num'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(n), 70, 73); ctx.restore();
}
// 卡 1：驾驶舱窗口（深色剪纸框 + 两块天空玻璃）
function cockpit(ctx,x,y,s) {
  V.sheet(ctx,'I07',x,y,840*s,560*s,{label:'驾驶舱'});
}
function f18(t) {
  return (ctx, w, h) => {
    cardNo(ctx, 1);
    cockpit(ctx, 520, 400, 0.95);
    Q.tag(ctx, 1110, 160, '瑞典', pop(t, at('033', '瑞典')), { size: 62, rot: -0.03, seed: 184 });
    Q.tag(ctx, 1110, 320, '伪造的资格', pop(t, at('033', '伪造')), { size: 60, rot: 0.02, seed: 185 });
    const p = pop(t, at('033', '十三年'));
    if (p > 0.01) { ctx.save(); ctx.globalAlpha = p; ctx.font = '700 190px Num'; ctx.fillStyle = Q.INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('13', 1060, 520); ctx.font = '900 80px Sans'; ctx.fillText('年', 1230, 545); ctx.restore(); }
    X.stamp(ctx, 1110, 680, '驾驶舱里被捕', prog(t, at('033', '被捕') - 0.15, at('033', '被捕') + 0.25), { size: 64, rot: -0.06, seed: 186, color: Q.RUST });
  };
}
// 卡 2：老电视（H06），屏幕里一个剪影 + 头衔字幕条；换台时闪雪花
const TV = { u0: 0.08, v0: 0.13, u1: 0.78, v1: 0.80 };     // H06 剪影框里屏幕的位置
function snow(ctx, x, y, w, h, seed) {
  const r = K.mulberry32(seed);
  for (let k = 0; k < 900; k++) { const v = r() * 255 | 0; ctx.fillStyle = `rgb(${v},${v},${v})`; ctx.fillRect(x + r() * w, y + r() * h, 3 + r() * 10, 2 + r() * 3); }
}
function f19(t) {
  return (ctx, w, h) => {
    cardNo(ctx, 2);
    const tx = 560, ty = 760, th = 620;
    Q.put(ctx, 'H06', tx, ty, th, { ar: 1.35 });
    const [ax, ay] = Q.ptOf('H06', tx, ty, th, TV.u0, TV.v0, { ar: 1.35 }), [bx, by] = Q.ptOf('H06', tx, ty, th, TV.u1, TV.v1, { ar: 1.35 });
    const sw = bx - ax, sh = by - ay;
    const tc = at('034', '换个台'), tm = at('034', '蒙医');
    ctx.save(); ctx.beginPath(); ctx.roundRect(ax + 10, ay + 10, sw - 20, sh - 20, 40); ctx.clip();
    ctx.fillStyle = '#d9d2c2'; ctx.fillRect(ax, ay, sw, sh);
    U.putPart(ctx, 'H02', ax + sw / 2, by + 10, sh * 0.85, U.UPPER, { sil: true, shadow: false });
    const label = t < tc + 0.3 ? '苗医传人' : '蒙医传人';
    const lp = t < tc + 0.3 ? pop(t, at('034', '苗医')) : pop(t, tm - 0.1);
    if (lp > 0.01) { ctx.globalAlpha = lp; ctx.fillStyle = t < tc + 0.3 ? '#2f4a63' : Q.RUST; ctx.fillRect(ax, by - 110, sw, 80); ctx.fillStyle = '#fbf3df'; ctx.font = '900 54px Sans'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(label, ax + sw / 2, by - 68); ctx.globalAlpha = 1; }
    const sn = K.vis(t, tc, tc + 0.5, 0.05, 0.15);
    if (sn > 0.01) { ctx.globalAlpha = sn; ctx.fillStyle = '#777'; ctx.fillRect(ax, ay, sw, sh); snow(ctx, ax, ay, sw, sh, (t * 30) | 0); ctx.globalAlpha = 1; }
    ctx.restore();
    Q.tag(ctx, 1180, 160, '电视神医', pop(t, at('034', '电视神医')), { size: 62, rot: -0.03, seed: 191 });
    X.nameTag(ctx, 1180, 310, '刘洪斌', pop(t, at('034', '刘洪斌')));
    Q.tag(ctx, 1180, 460, '换个台', pop(t, tc), { size: 58, rot: 0.03, seed: 192 });
    const tz = at('034', '中医医师资格');
    X.stamp(ctx, 1180, 640, '无医师资格', prog(t, tz - 0.1, tz + 0.3), { size: 70, rot: -0.08, seed: 193, color: Q.RUST });
  };
}
// 卡 3：手机竖屏视频：剪影 + 名字条 + 蛋白棒；扫描线扫过，留下“AI 合成”
function f20(t) {
  return (ctx, w, h) => {
    cardNo(ctx, 3);
    const ts = at('035', '视频是'), sc = prog(t, ts - 0.1, at('035', '合成') + 0.2);
    U.phone(ctx, 520, 400, 380, 620, (c, sw, sh) => {
      c.fillStyle = '#c9c1b2'; c.fillRect(0, 0, sw, sh);
      const g = c.createLinearGradient(0, 0, 0, sh); g.addColorStop(0, 'rgba(255,250,236,0.6)'); g.addColorStop(1, 'rgba(120,100,80,0.3)'); c.fillStyle = g; c.fillRect(0, 0, sw, sh);
      U.putPart(c, 'H02', sw / 2, sh + 10, sh * 0.75, U.UPPER, { sil: true, shadow: false });
      c.fillStyle = 'rgba(30,25,20,0.75)'; c.fillRect(0, sh - 120, sw, 70); c.fillStyle = '#fbf3df'; c.font = '700 40px Sans'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('张文宏', sw / 2, sh - 84);
      // 播放进度条
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(20, sh - 26, sw - 40, 6); c.fillStyle = '#f4c63d'; c.fillRect(20, sh - 26, (sw - 40) * prog(t, L('035').t0, L('035').t1), 6);
      if (sc > 0.01 && sc < 1) {
        const y = sh * sc; const gg = c.createLinearGradient(0, y - 60, 0, y + 6); gg.addColorStop(0, 'rgba(120,220,255,0)'); gg.addColorStop(1, 'rgba(120,220,255,0.75)');
        c.fillStyle = gg; c.fillRect(0, y - 60, sw, 66); c.fillStyle = 'rgba(200,245,255,0.95)'; c.fillRect(0, y, sw, 4);
      }
      if (sc > 0.01) { c.save(); c.beginPath(); c.rect(0, 0, sw, sh * sc); c.clip(); c.strokeStyle = 'rgba(80,180,220,0.25)'; c.lineWidth = 2; for (let yy = 0; yy < sh; yy += 10) { c.beginPath(); c.moveTo(0, yy); c.lineTo(sw, yy); c.stroke(); } c.restore(); }
    });
    Q.tag(ctx, 1130, 170, '“亲口”推荐？', pop(t, at('035', '亲口')), { size: 62, rot: -0.03, seed: 201 });
    Q.tag(ctx, 1130, 330, '蛋白棒', pop(t, at('035', '蛋白棒')), { size: 60, rot: 0.03, seed: 202 });
    X.stamp(ctx, 1130, 560, 'AI 合成', prog(t, at('035', '合成') - 0.1, at('035', '合成') + 0.3), { size: 110, rot: -0.08, seed: 203, color: Q.RUST, font: 'Sans' });
  };
}
// 卡 4：老电话听筒；假警察 vs 真警察；022 “我现在查你！”
function f21(t) {
  return (ctx, w, h) => {
    cardNo(ctx, 4);
    Q.put(ctx, 'G06', 400, 620, 440, { ar: 1.5 });
    Q.tag(ctx, 400, 140, '假警察', pop(t, at('036', '假警察')), { size: 66, bg: Q.INK, color: '#fbf3df', rot: -0.03, seed: 211 });
    Q.tag(ctx, 1120, 140, '真警察', pop(t, at('036', '真警察')), { size: 66, bg: '#2f4a63', color: '#fbf3df', rot: 0.03, seed: 212 });
    Q.tag(ctx, 1120, 290, '冲上门劝阻', pop(t, at('036', '冲上门')), { size: 56, rot: -0.02, seed: 213 });
    const t22 = L('037').t0, p = pop(t, t22 - 0.1, 0.3);
    if (p > 0.01) {
      const sh = 0;
      C.bubble(ctx, { x: 930 + sh, y: 560, text: '我现在查你！', size: 110, pop: p, shout: true, tail: [560, 520] });
    }
  };
}
const DECK = [['033', f18], ['034', f19], ['035', f20], ['036', f21]];
function deck(k) {
  return (ctx, t) => {
    const a = L(DECK[k][0]).t0 - 0.3;
    U.deckCard(ctx, CX, CY, CW, CH, prog(t, a, a + 0.8), k, DECK[k][1](t), { rot: k % 2 ? 0.006 : -0.006 });
  };
}

module.exports = {
  shots: [
    { a: L('032').t0 - 0.3, gl: 'shuaijing', draw: s17, name: '032' },
    ...DECK.map(([id], k) => ({ a: L(id).t0 - 0.3, tr: 'cut', draw: deck(k), name: id })),
  ],
};
U.stampAt('被捕', at('033', '被捕') - 0.15 + 0.4 / 1.4);
U.stampAt('无医师资格', at('034', '中医医师资格') - 0.1 + 0.4 / 1.4);
U.stampAt('AI 合成', at('035', '合成') - 0.1 + 0.4 / 1.4);
