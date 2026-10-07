// 全片时间轴：字幕、引文、HUD、心跳、音效提示点。画面和音频共用这一份。
'use strict';

const DURATION = 353;
const WARP = [[0, 0], [3, 2.2], [23.5, 18.6], [34, 26.0], [97, 73.25]];

function mapTime(time, inputColumn) {
  const outputColumn = 1 - inputColumn;
  for (let index = 1; index < WARP.length; index++) {
    const start = WARP[index - 1], end = WARP[index];
    if (time <= end[inputColumn]) {
      const progress = (time - start[inputColumn]) / (end[inputColumn] - start[inputColumn]);
      return start[outputColumn] + progress * (end[outputColumn] - start[outputColumn]);
    }
  }
  const last = WARP[WARP.length - 1];
  return time + last[outputColumn] - last[inputColumn];
}

const toSrc = outputTime => mapTime(outputTime, 1);
const toOut = sourceTime => mapTime(sourceTime, 0);
const OUT_DURATION = toOut(DURATION);

// [开始, 结束, 中文, 英文]
const SUBS = [
  [3.0, 8.0, '这条线，从未断过。', 'This thread has never broken.'],
  [8.6, 14.0, '近四十亿年，一次也没有。', 'Nearly four billion years. Not once.'],
  [15.0, 18.3, '它最新的一端——', 'Its newest end —'],
  [18.6, 22.5, '是你。', 'is you.'],

  [36.0, 42.5, '你有两位父母，四位祖父母，八位曾祖父母……', 'Two parents. Four grandparents. Eight great-grandparents…'],
  [43.0, 49.5, '往上三十代，族谱上有十亿多个位置。', 'Thirty generations up, the family tree has over a billion places.'],
  [50.5, 56.5, '这里面的每一位，都活到了留下后代的那一天。', 'Every one of them lived long enough to leave a child.'],
  [57.0, 61.0, '没有一位例外。', 'Not a single exception.'],
  [64.0, 71.5, '再往前，是学会直立的猿，爬上岸的鱼，海里的第一个细胞。', 'Further back: an ape that stood up, a fish that crawled ashore, a first cell in the sea.'],
  [72.0, 76.0, '每一位，都没有失手。', 'Not one of them failed.'],
  [79.5, 86.5, '地球上出现过的物种，超过百分之九十九已经消失。', 'More than 99% of all species that ever lived are gone.'],
  [87.0, 93.5, '而你所在的这一条，一次也没有断。', 'Yours never broke. Not once.'],

  [97.5, 103.0, '沿着这条线传下来的，是一段文字。', 'What travels down this thread is a text.'],
  [103.5, 109.5, '只用四个字母写成：A、T、C、G。', 'Written in four letters: A, T, C, G.'],
  [110.0, 117.5, '每个细胞里，约三十亿对字母。拉直了，有两米长。', 'About three billion pairs in every cell — two meters, stretched out.'],
  [118.0, 124.0, '细胞每分裂一次，它就被完整地抄写一遍。', 'Each time a cell divides, the whole text is copied.'],
  [124.5, 130.0, '抄错的概率，大约十亿分之一。', 'The chance of a typo: about one in a billion.'],
  [131.0, 135.0, '但它从不完美。', 'But it is never perfect.'],
  [135.5, 142.5, '你出生时，就带着几十个父母都没有的新字母。', 'You were born with dozens of letters neither parent had.'],
  [143.5, 150.5, '如果抄写从不出错，生命会永远停在第一页。', 'If the copying never erred, life would still be on page one.'],
  [151.0, 157.0, '是这些错误，写出了眼睛、翅膀、花朵——', 'These errors wrote eyes, wings, flowers —'],
  [157.5, 162.0, '也写出了你。', 'and you.'],

  [165.0, 171.0, '一朵向日葵，要怎样摆下上千粒种子？', 'How does a sunflower place a thousand seeds?'],
  [171.5, 178.0, '每长出一粒，就转过同一个角度：137.5°。', 'Each new seed turns by the same angle: 137.5°.'],
  [178.5, 185.0, '差半度，种子之间就会裂开空隙。', 'Half a degree off, and gaps tear open.'],
  [185.5, 191.5, '而黄金角，让每一粒都不挡住别人。', 'The golden angle lets no seed block another.'],
  [192.0, 197.5, '数一数螺旋：34 条，55 条。', 'Count the spirals: 34, and 55.'],
  [200.0, 207.0, '1952 年，图灵设想：两种化学物质，一边反应，一边扩散。', '1952. Turing imagined two chemicals, reacting as they spread.'],
  [207.5, 214.0, '它们彼此追逐，长出了斑点，也长出了条纹。', 'Chasing each other, they grow spots — and stripes.'],
  [214.5, 221.5, '没有设计图。只有简单的规则，和足够长的时间。', 'No blueprint. Only simple rules, and enough time.'],

  [226.0, 232.0, '而构成你的物质，一刻也没有停下。', 'And the matter you are made of never stands still.'],
  [232.5, 239.0, '每一秒，你的身体更换大约四百万个细胞。', 'Every second, your body replaces about four million cells.'],
  [239.5, 244.0, '一天，三千多亿个。', 'Over three hundred billion a day.'],
  [244.5, 251.0, '物质从你身上流过，像水流过漩涡。', 'Matter flows through you, like water through a whirlpool.'],
  [251.5, 257.5, '水一直在换，漩涡还在。', 'The water keeps changing. The whirlpool remains.'],

  [270.0, 277.0, '大约二十亿年前，一个细胞吞下了另一个细胞——', 'About two billion years ago, one cell swallowed another —'],
  [277.5, 281.0, '却没有消化它。', 'and did not digest it.'],
  [281.5, 286.5, '它们从此住在一起，再也没有分开。', 'They have lived together ever since.'],
  [287.0, 294.0, '它的后代，就是你几乎每个细胞里的线粒体。', 'Its descendants are the mitochondria in nearly every cell of yours.'],
  [294.5, 301.0, '此刻，它们正为你的每一次心跳供能。', 'Right now, they are powering every beat of your heart.'],

  [316.0, 321.5, '生命之美，不在于它完美。', 'The beauty of life is not that it is perfect.'],
  [322.0, 329.0, '而在于，它不完美，却从没有停下。', 'It is that it is imperfect — and has never stopped.'],
  [330.0, 337.0, '近四十亿年的线，此刻，正穿过你。', 'Four billion years of thread, running through you right now.'],
  [338.0, 343.5, '下一段，还没有写。', 'The next part is unwritten.'],
];

// 引文卡：[开始, 结束, 中文行[], 英文, 出处]
const QUOTES = [
  [258.0, 266.0, ['子在川上曰：', '“逝者如斯夫，不舍昼夜。”'], '“It passes on like this, never ceasing, day or night.”', '—— 《论语 · 子罕》'],
  [304.0, 315.0, ['从如此简单的开端，', '无穷无尽、最美丽、最奇妙的形态，', '已经并且正在演化出来。'],
    '“from so simple a beginning endless forms most beautiful and most wonderful have been, and are being, evolved.”',
    '—— 达尔文 《物种起源》 1859'],
];

// 心跳：约 62 次/分钟；每拍 = 两声（"扑-通"）
const BPM = 62;
const HEART_WINDOWS = [[0.4, 34], [157.5, 163], [294.5, 301.5], [329.5, 352]];
const HEARTBEATS = [];
for (const [a, b] of HEART_WINDOWS) for (let t = a; t < b; t += 60 / BPM) HEARTBEATS.push(+t.toFixed(4));
function heart(t) {
  // 返回 0..1 的脉冲强度
  let v = 0;
  for (const b of HEARTBEATS) {
    const d = t - b;
    if (d < -0.05 || d > 0.9) continue;
    v = Math.max(v, Math.exp(-Math.pow((d - 0.02) / 0.07, 2)), 0.6 * Math.exp(-Math.pow((d - 0.3) / 0.07, 2)));
  }
  return v;
}

// 重击（低频冲击 + 画面微闪）
const HITS = [
  [23.5, 1.0], [57.0, 0.8], [87.0, 0.7], [151.0, 0.9], [178.6, 0.5], [192.0, 0.45],
  [200.0, 0.6], [270.0, 0.5], [277.5, 0.6], [322.0, 1.0], [344.0, 0.9],
];
// 蓄力（riser）：[开始, 结束]
const RISERS = [[19.5, 23.5], [54.0, 57.0], [147.5, 151.0], [196.5, 200.0], [317.5, 322.0], [340.5, 344.0]];

module.exports = { DURATION, WARP, toSrc, toOut, OUT_DURATION, SUBS, QUOTES, HEARTBEATS, HEART_WINDOWS, BPM, heart, HITS, RISERS };

if (require.main === module) {
  // 导出给 Python 音频合成
  if (process.argv.includes('--check-subs')) {
    const durations = SUBS.map(([start, end, text]) => ({
      source: `${start}–${end}`, output: `${toOut(start).toFixed(3)}–${toOut(end).toFixed(3)}`,
      seconds: +(toOut(end) - toOut(start)).toFixed(3),
      short: toOut(end) - toOut(start) < 2.8, text,
    }));
    console.table(durations);
    console.log(`字幕共 ${durations.length} 句；小于 2.8 秒：${durations.filter(subtitle => subtitle.short).length} 句。`);
  } else {
    const ex = require('./events');
    process.stdout.write(JSON.stringify({ DURATION, WARP, OUT_DURATION, SUBS, HEARTBEATS, HITS, RISERS, EVENTS: ex.events() }, null, 1));
  }
}
