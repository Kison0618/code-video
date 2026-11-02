'use strict';
// 028–033 怎么用：判词 → 家长群接龙 → 老同事一句话 → 把自己放进对的人群 → 人群里停下的“你” → 判词 + 「误判」印章。
const U = require('./u3');
const { K, Q, X, L, at, pop, push, fig, you, over, crowdAt, verdict } = U;
const { smooth, prog, lerp, clamp, easeOut } = K;
const P = require('../paper');
const V5 = require('./v5_util');
const TL = require('../timeline');

// —— 028 判词：一块路牌在“反过来”时转向，“你”站在路牌下；纸签「用在好事上」——
function s28(c, t) {
  const turn = smooth(prog(t, L('028').t0 + 0.1, L('028').t0 + 0.9));
  push(c, t, L('028').t0, L('028').t1, 0.03, 960, 560, () => {
    const sx = Math.cos(turn * Math.PI);   // 1 → -1：朝右的牌子转成朝左
    c.save(); c.translate(1120, 0); c.scale(Math.abs(sx) < 0.04 ? 0.04 * Math.sign(sx || 1) : sx, 1); c.translate(-1120, 0);
    Q.put(c, 'E34', 1120, 960, 820, { ar: 0.55, label: '路牌' }); c.restore();
    you(c, turn > 0.5 ? 'E01' : 'E02', 700, 980, 520);
  });
  verdict(c, t, '028', '用在好事上', at('028', '用在好事上') - 0.3, 760, 170, 82);
}
// —— 029：家长群接龙 ——
function s29(c, t) {
  Q.tag(c, 210, 140, '第一', pop(t, L('029').t0), { size: 64, bg: Q.INK, color: '#fbf3df', seed: 1101 });
  Q.tag(c, 1640, 400, '很快就交了', pop(t, at('029', '很快就交了')), { size: 50, seed: 1103 });
  // 接龙名单本身就是“很多人已经在做了”：手机居中，左右两张纸签
  const many = at('029', '很多人已经在做了');
  Q.tag(c, 400, 470, '很多人已经在做了', pop(t, many), { size: 54, hl: true, seed: 1102, rot: -0.02 });
  const g = at('029', '家长群') - 0.3;
  V5.phone(c, 1000, 520, 600, 800, (cc, w, h) => {
    cc.fillStyle = '#ededed'; cc.fillRect(0, 0, w, h);
    cc.fillStyle = '#f7f7f7'; cc.fillRect(0, 0, w, 84); cc.fillStyle = '#1e1e1e'; cc.font = '700 36px Sans'; cc.textAlign = 'center'; cc.textBaseline = 'middle'; cc.fillText('三年级二班 家长群', w / 2, 44);
    V5.msg(cc, 20, 100, w - 20, '已有 32 位家长提交', pop(t, at('029', '已有三十二位') - 0.2, 0.5), { size: 40, bg: '#fff3c4' });
    // 接龙：越来越长
    const a = at('029', '还没交'), n = Math.floor(clamp((t - a) / (at('029', '很快就交了') + 0.9 - a)) * 9);
    const p0 = 1;
    if (p0 > 0.01) {
      cc.save(); cc.globalAlpha *= p0;
      const ly = 110 + 120 * smooth(prog(t, at('029', '已有三十二位') - 0.2, at('029', '已有三十二位') + 0.3)); cc.translate(0, ly - 110);
      cc.fillStyle = '#ffffff'; cc.beginPath(); cc.roundRect(110, 110, w - 140, 560, 12); cc.fill();
      cc.fillStyle = Q.INK; cc.font = '700 34px Sans'; cc.textAlign = 'left'; cc.fillText('#接龙  已提交', 136, 152);
      const shown = 3 + n;
      for (let k = Math.max(0, shown - 9); k < shown; k++) {
        const y = 205 + (k - Math.max(0, shown - 9)) * 52;
        cc.fillStyle = '#333'; cc.font = '500 32px Sans'; cc.fillText(`${30 + k}. 已交`, 136, y);
      }
      cc.restore();
    }
  }, { alpha: pop(t, L('029').t0 - 0.1, 0.5) });
  if (t > at('029', '还没交')) X.roll(c, Math.min(41, 32 + (t - at('029', '还没交')) * 3.5), 1640, 560, 120, { digits: 2, suffix: ' 位', color: Q.RUST });
}
// —— 030：老两口 + 保健品；“你”讲十遍道理（灰气泡一摞）；老同事一句“我也上过当” ——
function bubble(c, x, y, s, p, o = {}) {
  if (p <= 0.01) return;
  c.save(); c.globalAlpha *= clamp(p * 2) * (o.alpha == null ? 1 : o.alpha); c.translate(x, y + (1 - easeOut(p)) * 30);
  c.font = `700 ${o.size || 48}px Sans`; const w = c.measureText(s).width + 60, h = (o.size || 48) + 44;
  c.shadowColor = 'rgba(50,30,10,0.35)'; c.shadowBlur = 16; c.shadowOffsetY = 8;
  c.fillStyle = o.bg || '#fbf7ee'; c.beginPath(); c.roundRect(-w / 2, -h / 2, w, h, 26); c.fill();
  c.beginPath(); c.moveTo((o.tail || -1) * w * 0.25, h / 2 - 2); c.lineTo((o.tail || -1) * w * 0.25 + (o.tail || -1) * 28, h / 2 + 30); c.lineTo((o.tail || -1) * w * 0.25 - (o.tail || -1) * 8, h / 2 - 2); c.fill();
  c.shadowColor = 'transparent'; c.fillStyle = o.color || Q.INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(s, 0, 3);
  c.restore();
}
function s30(c, t) {
  Q.tag(c, 210, 140, '第二', pop(t, L('030').t0), { size: 64, bg: Q.INK, color: '#fbf3df', seed: 1111 });
  Q.tag(c, 960, 130, '跟着相似的人走', pop(t, at('030', '相似的人')), { size: 52, seed: 1112 });
  push(c, t, L('030').t0, L('030').t1, 0.025, 1000, 600, () => {
    Q.put(c, 'E26', 1000, 930, 560, { ar: 1.2, label: '老夫妻坐沙发' });
    Q.put(c, 'H04', 1000, 990, 200, { ar: 1.2 });
    Q.tag(c, 1000, 760, '保健品', pop(t, at('030', '保健品')), { size: 40, seed: 1113 });
    you(c, 'E01', 300, 960, 500);
    // 十遍道理：灰色气泡一摞，越叠越多
    const a = at('030', '讲十遍道理');
    for (let k = 0; k < 6; k++) bubble(c, 420 + k * 10, 360 - k * 26, '讲道理', pop(t, a + k * 0.12, 0.3), { size: 40, bg: '#e2dccf', color: '#7a6e60', alpha: 0.9 });
    Q.tag(c, 450, 200, '十遍', pop(t, a + 0.6), { size: 50, seed: 1114 });
    const o = at('030', '老同事'), q = smooth(prog(t, o - 0.3, o + 0.6));
    if (q > 0) { Q.put(c, 'E27', lerp(2100, 1640, q), 960, 520, { ar: 0.8, label: '老同事' }); }
    bubble(c, 1560, 330, '我也上过当', pop(t, at('030', '我也上过当') - 0.1, 0.5), { size: 60, bg: Q.YEL, tail: 1 });
  });
}
// —— 031：健身房 → 读书会，“你”走进人群 ——
function s31(c, t) {
  const r = at('031', '想读书'), sw = smooth(prog(t, r - 0.3, r + 0.5));
  c.save(); c.translate(-sw * 1920, 0);
  push(c, t, L('031').t0, r, 0.03, 960, 560, () => Q.sheet(c, 'E29', 960, 560, 1600, 760, { seed: 1123, label: '健身房 · 跑步机一排人' }));
  Q.tag(c, 1560, 260, '健身房', pop(t, at('031', '健身房')), { size: 56, seed: 1124 });
  c.restore();
  c.save(); c.translate((1 - sw) * 1920, 0);
  Q.sheet(c, 'E30', 960, 560, 1600, 760, { seed: 1125, label: '读书会 · 一桌人读书' });
  Q.tag(c, 1560, 260, '爱读书的朋友', pop(t, at('031', '爱读书的朋友')), { size: 52, seed: 1126 });
  c.restore();
  // “你”：先从左边走进健身房，再走进读书会
  const a1 = at('031', '想健身'), w1 = smooth(prog(t, a1 - 0.2, a1 + 1.4));
  const w2 = smooth(prog(t, r + 0.3, r + 1.8));
  const x = sw < 0.5 ? lerp(-120, 520, w1) : lerp(-120, 420, w2);
  you(c, (sw < 0.5 ? w1 : w2) < 1 ? 'E02' : 'E01', x, 1000, 420);
  Q.tag(c, 210, 140, '第三', pop(t, L('031').t0), { size: 64, bg: Q.INK, color: '#fbf3df', seed: 1121 });
  Q.tag(c, 960, 130, '放进做这件事的人群里', pop(t, at('031', '人群里')), { size: 52, hl: true, seed: 1122 });
}
// —— 032：人流图慢慢往左平移（人群往右挤），“先停两秒”时人流变灰，“你”站住、头顶问号 ——
function s32(c, t) {
  const a = L('032').t0, stop = at('032', '先停两秒'), crowd = at('032', '往一个方向挤');
  const gray = smooth(prog(t, stop, stop + 0.6));
  const u = 0.66 - 0.25 * smooth(prog(t, a, L('032').t1)) - 0.05 * smooth(prog(t, crowd, crowd + 2));   // 画面往右移 = 人流往右挤
  Q.sheet(c, 'E31', 960, 500, 1760, 880, { seed: 1131, zoom: 1.6, focus: [u, 0.5], dim: lerp(0, 0.35, gray), label: '人流往右挤' });
  you(c, 'E04', 960, 1000, 600);
  over(c, 'E04', 960, 1000, 600, '？', pop(t, stop), { dy: 130, size: 80, hl: true, seed: 1132 });
  Q.tag(c, 960, 110, '忽略别人的榜样', pop(t, at('032', '忽略别人的榜样')), { size: 60, hl: true, seed: 1133 });
  Q.tag(c, 430, 420, '真的知道？', pop(t, at('032', '真的知道')), { size: 58, seed: 1134, rot: -0.03 });
  Q.tag(c, 1490, 420, '只是看见别人这么做？', pop(t, at('032', '只是看见别人')), { size: 52, seed: 1135, rot: 0.03 });
}
// —— 033 判词：“你”在人流里的近景；关键词纸签；最后「误判」印章落下，印框放大成片尾 ——
function endCard(c) {
  c.fillStyle = P.BG; c.fillRect(0, 0, 1920, 1080);
  X.stamp(c, 960, 520, '误判', 1, { size: 220, color: Q.RUST, seed: 1143, rot: -0.06 });
}
function s33(c, t) {
  push(c, t, L('033').t0, TL.DUR, 0.04, 960, 470, () => Q.sheet(c, 'E35', 960, 480, 1760, 900, { seed: 1140, label: '人群里的你（近景）' }));
  Q.tag(c, 520, 170, '跟对人群', pop(t, at('033', '跟对了人群') - 0.2, 0.6), { size: 76, hl: true, seed: 1141, rot: -0.02 });
  Q.tag(c, 1400, 170, '跟错人群', pop(t, at('033', '跟错了') - 0.2, 0.6), { size: 76, color: '#fbf3df', bg: Q.RUST, seed: 1142, rot: 0.02 });
  // 印章转场：落印（0.35 秒）→ 印框从印章大小放大到全屏，框里是片尾
  const s = at('033', '往坑里走') + 0.5, land = prog(t, s, s + 0.35), grow = smooth(prog(t, s + 0.55, s + 1.25));
  const sx = 960, sy = 520;
  if (grow > 0) {
    const w = lerp(470, 2400, grow), h = lerp(330, 1700, grow);
    c.save(); c.beginPath(); c.roundRect(sx - w / 2, sy - h / 2, w, h, lerp(30, 0, grow)); c.clip(); endCard(c); c.restore();
  }
  if (grow < 1) {
    const shake = land > 0.3 && land < 1 ? Math.sin(land * 40) * 6 * (1 - land) : 0;
    c.save(); c.translate(0, shake); c.globalAlpha *= 1 - grow;
    X.stamp(c, sx, sy, '误判', land, { size: 220, color: Q.RUST, seed: 1143, rot: -0.06 }); c.restore();
  }
}
module.exports = { shots: [['028', s28, 'feibai'], ['029', s29, 'slide'], ['030', s30, 'slide'], ['031', s31, 'slide'], ['032', s32, 'fade'], ['033', s33, 'fade']].map(([id, draw, tr]) => (tr === 'feibai' ? { a: L(id).t0 - 0.15, gl: tr, name: id, draw } : { a: L(id).t0 - 0.15, tr, name: id, draw })) };
