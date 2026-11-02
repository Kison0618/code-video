'use strict';
// v7 · 米尔格拉姆讲清楚（016–023）
//   016 旧报纸招募广告   017 两个房间剖面：你=老师 / 隔壁=学生，开关逐格亮 15→30→45
//   018 开关板慢移到 450，“危险：严重电击”“XXX”   019 剖面：300 伏捶墙（墙震）→ 没了声音（隔壁变暗）
//   020 满头大汗的被试 + 白大褂入画   021 “请继续”   022 26/40 滚动 + 开关停在 450   023 隔壁翻开：演员起身盖章 → 手是真的
const K = require('../core'), Q = require('../kit02'), X = require('../kit'), C = require('../card');
const TL = require('../timeline'), V = require('./v6_util'), M = require('./v6_milgram');
const { L, at } = TL, { prog, smooth, lerp, easeOut, easeInOut, clamp } = K;
const pop = V.pop;
function push(c, t, id, amt = 0.035, cx = 960, cy = 540) {
  const l = L(id), z = 1 + amt * smooth(prog(t, l.t0 - 0.2, l.t1 + 0.4));
  c.translate(cx, cy); c.scale(z, z); c.translate(-cx, -cy);
}

function s16(c, t) {
  c.save(); push(c, t, '016');
  V.sheet(c, 'J03', 960, 500, 1300, 860, { seed: 716 });
  V.paper(c, 960, 470, 760, 430, cc => {
    V.text(cc, '耶鲁大学', 0, -130, 66);
    V.text(cc, '招募志愿者', 0, -30, 84);
    V.text(cc, '记忆与学习研究', 0, 70, 52);
  }, { rot: -0.015, seed: 717, bg: '#f3ead6' });
  c.restore();
  Q.tag(c, 1500, 180, '1961', pop(t, at('016', '一九六一')), { size: 72, rot: 0.04, seed: 718, font: 'Num' });
  Q.tag(c, 960, 840, '惩罚能不能帮人学习？', pop(t, at('016', '惩罚')), { size: 64, hl: true, seed: 719 });
}

// 两个房间剖面：左 = 你（J02 + 开关），右 = 隔壁（J01 被绑），中间一道墙
function rooms(c, t, o = {}) {
  const shake = o.shake || 0, dark = o.dark || 0;
  V.paper(c, 520, 520, 860, 700, null, { seed: 721, bg: '#efe4cc' });
  V.paper(c, 1400 + shake, 520, 860, 700, null, { seed: 722, bg: '#e8dcc2' });
  V.put(c, 'J02', 520, 860, 560);
  c.save(); c.translate(shake, 0); V.put(c, 'J01', 1400, 860, 560);
  if (dark > 0) { c.fillStyle = `rgba(35,27,21,${0.55 * dark})`; c.fillRect(970, 170, 860, 700); }
  c.restore();
  // 墙
  c.save(); c.translate(shake * 0.6, 0); c.fillStyle = '#6d5a44'; c.fillRect(948, 150, 24, 740);
  c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(972, 150, 10, 740); c.restore();
  if (o.labels !== false) {
    Q.tag(c, 520, 220, '你：老师', o.lp == null ? 1 : o.lp, { size: 56, seed: 723 });
    Q.tag(c, 1400 + shake, 220, '隔壁：学生', o.lq == null ? 1 : o.lq, { size: 56, seed: 724 });
  }
}
function s17(c, t) {
  c.save(); push(c, t, '017', 0.03);
  rooms(c, t, { lp: pop(t, at('017', '你当老师')), lq: pop(t, at('017', '隔壁')) });
  c.restore();
  const ts = at('017', '十五伏') - 0.6, n = Math.floor(lerp(0, 3.999, prog(t, ts, ts + 1.6)));
  if (t > ts) {
    Q.tag(c, 960, 840, `每错一题 +15 伏　${[15, 30, 45][Math.min(2, n)]} 伏`, pop(t, ts), { size: 60, hl: true, seed: 725, font: 'Sans' });
  }
}
function s18(c, t) {
  const l = L('018');
  // 镜头从左往右慢移：开关板放大，画面平移到 450 那端
  const pan = easeInOut(prog(t, l.t0, at('018', '最后几档')));
  c.save(); c.translate(lerp(380, -380, pan), 0); c.translate(960, 420); c.scale(1.55, 1.55); c.translate(-960, -420);
  M.panel(c, 960, 420, lerp(0, 30, pan), t);
  c.restore();
  const tw = at('018', '危险');
  Q.tag(c, 1130, 760, '危险：严重电击', pop(t, tw), { size: 66, bg: Q.RUST, color: '#fbf3df', rot: -0.02, seed: 726 });
  Q.tag(c, 1600, 760, 'XXX', pop(t, at('018', '三个')), { size: 80, bg: '#2a211a', color: '#fbf3df', rot: 0.03, seed: 727, font: 'Num' });
  Q.tag(c, 560, 760, '450 伏', pop(t, at('018', '四百五十伏')), { size: 76, rot: -0.03, seed: 728, font: 'Num' });
}
function s19(c, t) {
  const tk = at('019', '捶墙'), ts = at('019', '没了声音');
  const knock = t > tk - 0.2 && t < ts - 0.3 ? Math.sin((t - tk) * 38) * 6 * Math.exp(-((t - tk) % 0.9) * 3) : 0;
  const dark = smooth(prog(t, ts - 0.1, ts + 0.8));
  c.save(); push(c, t, '019', 0.025);
  rooms(c, t, { shake: knock, dark });
  c.restore();
  Q.tag(c, 520, 840, '300 伏', pop(t, at('019', '三百伏')), { size: 76, bg: Q.RUST, color: '#fbf3df', seed: 729, font: 'Num' });
  Q.tag(c, 1400, 840, dark > 0.5 ? '……没了声音' : '咚！咚！', pop(t, tk), { size: 64, hl: dark < 0.5, seed: 730 });
}
function s20(c, t) {
  const l = L('020');
  c.save(); push(c, t, '020', 0.05, 760, 520);
  const jit = t < at('020', '想停下') + 1 ? Math.sin(t * 23) * 1.6 : 0;
  V.put(c, 'J02', 760 + jit, 980, 860);
  c.restore();
  const e = easeOut(prog(t, at('020', '穿白大褂') - 0.3, at('020', '穿白大褂') + 0.6));
  V.doctorBack(c, lerp(2300, 1560, e), 1000, 720);
  Q.tag(c, 520, 220, '想停下', pop(t, at('020', '想停下')), { size: 66, hl: true, seed: 731 });
}
function s21(c, t) {
  V.put(c, 'J02', 700, 980, 820);
  V.doctorBack(c, 1560, 1000, 720);
  C.bubble(c, { x: 1180, y: 330, text: '请继续。', size: 84, pop: pop(t, L('021').t0 - 0.1, 0.4), tail: [1400, 470] });
}
function s22(c, t) {
  c.save(); push(c, t, '022', 0.03);
  M.panel(c, 960, 330, 30, t);
  c.restore();
  const t40 = at('022', '四十个'), t26 = at('022', '二十六');
  const pv = pop(t, t40);
  if (pv > 0.01) {
    c.save(); c.globalAlpha = pv; c.font = '700 190px Num'; c.fillStyle = Q.INK; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText('/ 40', 980, 760); c.restore();
    X.roll(c, lerp(0, 26, easeOut(prog(t, t26 - 0.1, t26 + 0.7))), 940, 760, 190, { color: Q.RUST, digits: 2 });
  }
  X.stamp(c, 1530, 760, '按到底', prog(t, at('022', '最后一档'), at('022', '最后一档') + 0.5), { size: 70, rot: -0.1, seed: 732, color: Q.RUST });
}
function s23(c, t) {
  const tr = at('023', '可按下');
  const p = smooth(prog(t, tr - 0.3, tr + 0.3));
  if (p < 1) {
    c.save(); c.globalAlpha = 1 - p; push(c, t, '023', 0.03);
    // 隔壁那半张纸翻开：学生松绑站起来
    V.paper(c, 960, 520, 1100, 760, null, { seed: 733, bg: '#efe4cc' });
    V.put(c, 'J01', 960, 900, 640);
    X.stamp(c, 1320, 330, '演员', prog(t, at('023', '演员'), at('023', '演员') + 0.5), { size: 96, rot: 0.12, seed: 734, color: Q.RUST });
    Q.tag(c, 960, 840, '电击是假的', pop(t, at('023', '假的')), { size: 66, seed: 735 });
    c.restore();
  }
  if (p > 0) {
    c.save(); c.globalAlpha = p;
    // J02 的手按在开关上：局部放大
    c.translate(960, 560); c.scale(2.1, 2.1); c.translate(-960, -560);
    V.put(c, 'J02', 900, 1060, 820);
    c.restore();
    V.verdict(c, t, '023', '手是真的', at('023', '是真的'), 960, 840, 82);
  }
}

module.exports = {
  shots: [['016', s16, 'fanye'], ['017', s17], ['018', s18], ['019', s19], ['020', s20], ['021', s21], ['022', s22], ['023', s23]]
    .map(([id, draw, gl]) => (gl ? { a: L(id).t0 - 0.15, gl, draw, name: id } : { a: L(id).t0 - 0.15, tr: 'fade', draw, name: id })),
};
