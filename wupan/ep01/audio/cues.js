#!/usr/bin/env node
// 第一集 音效事件表 + BGM 压低区间 → audio/events.json
//   node audio/cues.js            （默认写 audio/events.json）
// 时间全部从 render/src/timeline.js 取（句 id + 句内关键词），不写死秒数。
// 前 1 分钟（001–012、No.1 卡）的画面动作公式抄自 s1_head.js / nest_cast.js / s3_card.js（只读，不 require 场景，避免加载画布）。
// 014 以后画面还在做，先按配音关键词挂；画面定稿后若某个动作偏了，只改这里的那一行。
'use strict';
const fs = require('fs');
const path = require('path');
const TL = require('../render/src/timeline');
const { L } = TL;

// at()：找不到关键词时 timeline.at 会静默回到句首，这里改成直接报错
function at(id, w, nth = 0) {
  const s = L(id).text; let i = -1;
  for (let k = 0; k <= nth; k++) { i = s.indexOf(w, i + 1); if (i < 0) throw new Error(`cues: ${id} 里找不到「${w}」(#${nth})`); }
  return TL.at(id, w, nth);
}
const ev = [];
// k：音效种类（见 sfx.py）；t：秒；g：增益；pan：-1 左 … 1 右；其余参数按种类
const E = (k, t, o = {}) => ev.push({ k, t: +t.toFixed(3), ...o });
const spread = (a, b, n) => Array.from({ length: n }, (_, i) => a + (b - a) * (n === 1 ? 0 : i / (n - 1)));

// ======================= 开场 001–003（s1_head.js 的 T）=======================
const S1 = {
  enter: [L('001').t0 + 0.05, at('001', '动物') + 0.05, at('001', '一样'), at('001', '人类') - 0.25],
  code: at('001', '底层代码'),
  b0: L('002').t0, fast: at('002', '飞快'), pick: at('002', '选择'),
  often: at('002', '它常常'), unaware: at('002', '不知不觉'),
  eg: at('003', '比如'),
};
S1.touch = S1.fast - 0.1;
// 001 “所有动物”：四张剪影依次滑入（蚂蚁→鸟→狗→人）
S1.enter.forEach((t, i) => E('slide', t - 0.04, { g: 0.32 + 0.04 * i, pan: [-0.6, -0.25, 0.2, 0.55][i] }));
// 001 “底层代码”：芯片通电短嗡 + 清亮 ping（ping 正好压在 BGM 17.08 秒那记鼓点上）
E('chiphum', S1.code - 0.32, { d: 0.42, g: 0.26, pan: -0.3 });
E('ping', S1.code, { f: 1568, g: 0.3, pan: -0.3 });
// 002 “飞快”：手碰壶瞬间缩回 → 快速 whoosh；秒表弹出“嗒”；绿勾 ping
E('swish', S1.touch - 0.03, { g: 0.4, pan: 0.2 });
E('watch', S1.touch + 0.22, { g: 0.45, pan: 0.7 });
E('ping', S1.pick + 0.08, { f: 2093, g: 0.25, pan: 0.85, soft: 1 });
// 002 “犯错”：尺子滑进来（画面在“它常常”起滑）；✓ 翻成 ✗ 一声低闷“嗡”（翻面中点）
E('ruler', S1.often - 0.05, { g: 0.4, pan: 0.3 });
E('wrong', S1.unaware - 0.15, { g: 0.5, pan: 0.5 });
// 003 “比如蚂蚁”：放大镜推进 whoosh（上扬，跟着推镜从 eg-0.15 到 003 末 +0.3）
E('zoom', S1.eg - 0.15, { d: L('003').t1 + 0.3 - (S1.eg - 0.15), g: 0.42 });

// ======================= 蚁巢 004–011（nest_cast.js 的 T）=======================
const NT = { s7: L('007').t0, s8: L('008').t0, s9: L('009').t0, toss: at('010', '扔出'), minis: at('011', '很多时候') };
// 004–006（延到 011）：极轻的泥土氛围，从圆形揭开（003 末）到 012 开口前收掉
const AMB0 = L('003').t1 - 0.2, AMB1 = L('012').t0 - 0.1;
E('soil', AMB0, { d: AMB1 - AMB0, g: 0.22 });
// 007 / 008 / 009 对话气泡弹出（软 pluck，气泡 pop 从 s-0.05 开始）
E('bubble', NT.s7 - 0.04, { f: 660, g: 0.35, pan: -0.2 });
E('bubble', NT.s8 - 0.04, { f: 554, g: 0.35, pan: 0.25 });
E('bubble', NT.s9 - 0.04, { f: 740, g: 0.35, pan: -0.2 });
E('boing', NT.s9 + 0.05, { g: 0.32, pan: -0.2 });                   // “啊？？？” 滑稽上滑音
// 010 “扔出”：抛出 whoosh + 0.8 秒后落地
E('toss', NT.toss - 0.05, { g: 0.42, pan: -0.3 });
E('land', NT.toss + 0.78, { g: 0.45, pan: -0.55 });
// 011 代码卡依次浮出（miniA(k)：k = 0, 1, 3, 5）
[0, 1, 3, 5].forEach((k, i) => E('tick', NT.minis + k * 0.18 + 0.05, { f: 2600 + i * 180, g: 0.26, pan: [-0.1, -0.6, 0.1, 0.6][i] }));

// ======================= 012（s1_head.js 的 T：back / many / simp / often2 / boom）=======================
const S12 = { back: L('012').t0 + 0.25, many: at('012', '很多'), simp: at('012', '过度简化'), often2: at('012', '经常'), boom: at('012', '事故') };
E('fly', S12.back, { d: 0.9, g: 0.4 });                              // 蚁巢规则卡飞进人脑
E('pop', S12.many + 0.08, { f: 988, g: 0.36, pan: -0.15 });         // 两张新卡
E('pop', S12.simp + 0.08, { f: 1175, g: 0.36, pan: -0.15 });
E('tape', S12.often2 - 0.05, { g: 0.32, pan: 0 });                   // 黄黑警示带拉过头顶
E('alarm', S12.often2, { g: 0.26 });                                 // 警示灯两次脉冲（“经常”亮、“事故”再亮）
E('alarm', S12.boom, { g: 0.26 });

// ======================= 章节卡（s3_card.js：标题纸片 T0+0.25 起拍下）=======================
E('slide', TL.CARD_T0, { g: 0.32, pan: 0.5 });
E('thump', TL.CARD_T0 + 0.32, { g: 0.45 });
E('slide', TL.CARD2_T0, { g: 0.32, pan: 0.5 });                      // No.2 由 B 线照 s3_card 做
E('thump', TL.CARD2_T0 + 0.32, { g: 0.45 });

// ======================= 故事一 014–024 =======================
E('phone', L('014').t0 + 0.05, { g: 0.24, pan: -0.45 });             // 老式电话铃两声
E('bubble', L('015').t0 + 0.02, { f: 698, g: 0.32, pan: 0.3 });
E('dull', at('016', '卖不掉'), { g: 0.36 });
E('tray', at('017', '挪到'), { d: 0.75, g: 0.34, pan: -0.2 });
E('bubble', at('017', '店员'), { f: 784, g: 0.3, pan: 0.35 });
E('flutter', at('018', '字条'), { d: 0.9, g: 0.3, pan: 0.2 });
// 019 铅笔逐笔写字：每个字一小段划写（按句内字位估时）
{
  // 和 timeline.at 同一套估时：句内去掉标点后按字数线性分
  const l = L('019'), chars = [...l.text].filter(c => !/[，。：、？！；“”"\s]/.test(c));
  const step = (l.t1 - l.t0) / chars.length, ts = chars.map((_, i) => i * step);
  E('pencil', L('019').t0, { ts: ts.map(x => +x.toFixed(3)), step: +step.toFixed(3), g: 0.3, pan: 0.15 });
}
E('redpen', at('020', '亏本'), { g: 0.36, pan: 0.2 });
// 021 “全卖光了”：首饰一件件消失 5 个 tick → SOLD OUT 章
{
  const a = at('021', '全卖光了'), b = at('021', '店员');
  spread(a, a + 0.7 * (b - a), 5).forEach((t, i) => E('tick', t, { f: 2200 + i * 160, g: 0.24, pan: -0.5 + i * 0.25 }));
  E('stamp', a + 0.84 * (b - a), { g: 0.38 });
  E('shimmer', at('021', '看成了'), { d: 0.9, g: 0.26 });          // ½ → 2 变形
}
E('clack', at('022', '两倍'), { g: 0.38, pan: 0.15 });
E('clack', at('022', '两倍') + 0.16, { g: 0.34, pan: 0.15 });
E('coin', at('023', '一分钱一分货'), { g: 0.34, pan: -0.25 });
spread(at('023', '验证') - 0.05, at('023', '验证') + 0.45, 3).forEach((t, i) => E('tick', t, { f: 1900 + i * 200, g: 0.22, pan: i * 0.2 }));
E('shrink', at('023', '简化成了'), { d: 0.6, g: 0.36 });
spread(at('024', '越觉得'), L('024').t1 - 0.1, 5).forEach((t, i) => E('star', t, { f: [72, 74, 76, 79, 81][i], g: 0.22 + 0.02 * i, pan: -0.4 + i * 0.2 }));

// ======================= 故事二 026–033 =======================
E('click', at('026', '订阅广告'), { g: 0.4, pan: 0.2 });
E('pop', at('027', '五十九'), { f: 880, g: 0.34, pan: -0.45 });
E('pop', at('027', '一百二十五', 0), { f: 988, g: 0.34, pan: 0 });
E('pop', at('027', '一百二十五', 1), { f: 1175, g: 0.36, pan: 0.45 });
E('wobble', at('028', '谁会'), { g: 0.38 });
E('stamp', at('028b', '没人要'), { g: 0.34 });
E('swish', at('028b', '特别划算') - 0.12, { g: 0.32, pan: 0.3 });
E('shimmer', at('028b', '特别划算') + 0.1, { d: 0.9, g: 0.24, pan: 0.4 });
E('sticky', at('028c', '试试'), { g: 0.36 });
E('patter', at('029', '一百个'), { d: 1.8, g: 0.22 });
E('pop', at('030', '十六'), { f: 988, g: 0.34, pan: -0.45 });
E('pop', at('030', '零'), { f: 330, g: 0.4, pan: 0 });              // 0 人：低音
E('pop', at('030', '八十四'), { f: 1319, g: 0.36, pan: 0.45 });
E('swish', at('031', '拿掉') - 0.05, { g: 0.36 });
{ const a = at('031', '网络版') + 0.2, b = at('031', '套餐') + 1.3; E('roll', a, { d: b - a, g: 0.2 }); }   // 跟 s6 第二批小人到位的时间（数字随人数整数跳）
E('creak', at('032', '不好比') - 0.1, { d: 1.1, g: 0.45 });
E('clunk', at('032', '一比就知道'), { g: 0.34 });
E('impact', L('033').t0 + 0.05, { g: 0.34 });

// ======================= 收尾 034–036 =======================
E('ping', at('034', '很有用'), { f: 1319, g: 0.26, soft: 1 });
E('error', at('034', '出错'), { g: 0.4 });
E('drop', at('034', '犯大错'), { g: 0.36, pan: 0.2 });
E('tension', at('034', '操纵'), { d: 1.2, g: 0.3 });
{ const a = at('035', '足足'), b = at('035', '种'); E('count', a, { d: b - a, n: 25, g: 0.22 }); E('deal', b + 0.1, { d: 0.8, g: 0.28 }); }
[0, 1, 2, 3].forEach(i => E('snap', at('036', '不被') + 0.05 + i * 0.15, { g: 0.26, pan: -0.45 + i * 0.3 }));   // 和 s7 的 T.snap 同一公式
const FLIP = at('036', '所以') - 0.2, SERIES = at('036', '快来学习吧');
E('shimmer', FLIP, { d: 1.0, g: 0.26 });
E('bell', SERIES, { f: 784, g: 0.3 });

ev.sort((a, b) => a.t - b.t);

// ======================= BGM 压低区间 =======================
// 句间停顿 ≥ 1.0 秒算段落边界（两张章节卡、019→020、033→034），其余停顿不抬，免得音乐一抽一抽
const BREAK = 1.0, ATT = 0.6, REL = 0.8;
const blocks = [];
for (const l of TL.LINES) {
  const b = blocks[blocks.length - 1];
  if (b && l.t0 - b[1] < BREAK) b[1] = l.t1; else blocks.push([l.t0, l.t1]);
}
// 段落之间间隙只有 1 秒左右：先放 0.8 秒包络，放不下就按间隙比例缩，保证中间能抬满
const duck = blocks.map(([s0, s1], i) => {
  const gPrev = i ? s0 - blocks[i - 1][1] : 9, gNext = i < blocks.length - 1 ? blocks[i + 1][0] - s1 : 0.6;
  return { s0: +s0.toFixed(3), s1: +s1.toFixed(3), att: +Math.min(ATT, 0.42 * gPrev).toFixed(3), rel: +Math.min(REL, 0.48 * gNext).toFixed(3) };
});
// 片尾：036 说完到片尾只有 0.37 秒，来不及抬；改为系列名出现（“快来学习吧”）时就开始 0.8 秒抬起，和最后 2.5 秒淡出叠在一起
Object.assign(duck[duck.length - 1], { s1: +SERIES.toFixed(3), rel: REL });

const marks = {
  DUR: TL.DUR, CARD_T0: TL.CARD_T0, CARD2_T0: TL.CARD2_T0,
  drop: S1.code,                       // BGM 17.08 秒鼓点对齐到这里
  series: SERIES,
  lines: Object.fromEntries(TL.LINES.map(l => [l.id, [l.t0, l.t1]])),
};
const out = process.argv[2] || path.join(__dirname, 'events.json');
fs.writeFileSync(out, JSON.stringify({ marks, duck, ev }, null, 1));
console.log(`✓ ${path.relative(process.cwd(), out)}  ${ev.length} 个音效，${duck.length} 段压低，drop=${S1.code.toFixed(3)}s`);
