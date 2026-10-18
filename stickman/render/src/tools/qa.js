// 自动体检：不用渲染，直接按场景数据逐帧（30 帧/秒）检查常见毛病，报出哪一秒有什么问题
//   SCENE=loop node src/tools/qa.js
// 检查项：
//   1. 主角出画（头不在画面里）超过 0.3 秒 —— 场景可以导出 offscreen: [[t0, t1], ...] 标记故意出画的时段
//   2. 身体瞬移：任何关节一帧内移动超过 0.6 个身高
//   3. 身体角度突跳：每秒超过 2000°
//   4. 代码被画面切掉：场景导出 codes: [Code...]，代码块有一部分在画面外
//   5. 主角太小：连续 3 秒以上身高不到画面的 8%（远景太久）
//   6. 音效 id 在 audio/音效需求.json 里找不到
//   7. 每次"运行"时屏幕上的代码不是合法的 Python（运行后 0.6 秒内报错的算故意写错，跳过）
//   8. 节奏空档：连续 5 秒以上没有新事件（出字、报错、运行、打击、键帽……；脚步、打字、环境声不算）
// 另外打印景别分布（主角高度占画面的比例），对照原片实测（拆解 2.1 / 2.2）
'use strict';
const fs = require('fs'), path = require('path');
const K = require('../core');
const { W, H } = K;
const S = require({ v4: '../scene_v4', loop: '../scene_loop', loop2: '../scene_loop2' }[process.env.SCENE] || '../scene_loop');
const cues = require('../cues');
const hero = S.hero, cam = S.cam, clock = S.clock;
const issues = [];
const push = (t0, t1, what) => issues.push({ t0, t1, what });
const runs = (pred, minDur, what) => {
  let s = null;
  for (let t = 0; t <= S.DUR + 1e-6; t += 1 / 30) {
    const bad = pred(t);
    if (bad && s === null) s = t;
    if ((!bad || t + 1 / 30 > S.DUR) && s !== null) { if (t - s >= minDur) push(s, t, typeof what === 'function' ? what(s) : what); s = null; }
  }
};
const off = S.offscreen || [];
const inOff = t => off.some(([a, b]) => t >= a && t <= b);
const scr = (c, p) => cam.toScreen(c, p[0], p[1]);
// 1 出画
runs(t => { if (inOff(t) || t < (S.heroFrom ?? 0)) return false; const c = cam.at(t), j = hero.jointsAt(clock.anim(t)), [x, y] = scr(c, j.head); return x < 0 || x > W || y < 0 || y > H; }, 0.3, '主角出画');
// 2/3 瞬移、角度突跳
let prev = null;
for (let t = 0; t <= S.DUR; t += 1 / 30) {
  const ta = clock.anim(t), j = hero.jointsAt(ta), s = hero.stateAt(ta);
  if (prev && ta > prev.ta && t > (S.heroFrom ?? 0) + 0.05) {
    const pts = ['head', 'hip'].map(k => [j[k], prev.j[k]]).concat(['aF', 'aB', 'lF', 'lB'].map(k => [j[k][2], prev.j[k][2]]));
    const dmax = Math.max(...pts.map(([a, b]) => Math.hypot(a[0] - b[0], a[1] - b[1]))) / hero.H;
    if (dmax > 0.6) push(t, t, `身体瞬移（一帧 ${dmax.toFixed(2)} 个身高）`);
    const dd = s.lean - prev.s.lean, dl = Math.abs(dd - 360 * Math.round(dd / 360)) / (ta - prev.ta);   // 差整圈的角度看起来一样，不算
    if (dl > 2000) push(t, t, `身体角度突跳（${dl.toFixed(0)}°/秒）`);
  }
  prev = { ta, j, s };
}
// 4 代码被切
for (const code of S.codes || []) {
  runs(t => {
    const ta = clock.anim(t);
    if (code.visible ? !code.visible(ta) : ta < code.vis[0] || ta > code.vis[1]) return false;
    const sn = code.snap(ta); if (!sn.text) return false;
    const lines = sn.text.split('\n'), cw = code.size * 0.55, lh = code.size * 1.32, [x0, y0] = code.pos(ta), c = cam.at(t);
    const a = scr(c, [x0, y0 - code.size]), b = scr(c, [x0 + Math.max(...lines.map(l => l.length)) * cw, y0 + (lines.length - 1) * lh + code.size * 0.3]);
    const visible = b[0] > 0 && a[0] < W && b[1] > 0 && a[1] < H;                       // 完全在画面外不算（镜头故意不拍它）
    return visible && (a[0] < -2 || a[1] < -2 || b[0] > W + 2 || b[1] > H + 2);
  }, 0.25, s => `代码被画面切掉（"${code.snap(clock.anim(s)).text.split('\n')[0].slice(0, 24)}…"）`);
}
// 5 主角太小
runs(t => { if (inOff(t)) return false; const c = cam.at(t); return hero.H * c.z / H < 0.08; }, 3, '主角太小（远景太久）');
// 6 音效 id
const req = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../audio/音效需求.json'), 'utf8'));
const ids = new Set(req.sounds.map(s => s.id));
const ALIAS = { blink: 1, enter: 1, laptop: 1, kick: 1, click: 1, pop: 1, grab: 1, hit: 1, music: 1 };
const miss = [...new Set(cues.list.map(c => c.type).filter(id => !ids.has(id) && !ALIAS[id]))];
if (miss.length) push(0, 0, `音效 id 不在需求表里：${miss.join('、')}`);
// 7 运行时的代码语法
{
  const list = [];
  for (const code of S.codes || []) for (const r of code.runs) {
    const tx = code.snap(r.t).text; if (!tx) continue;
    const errAfter = code.snaps.some(sn => sn.err && sn.t >= r.t && sn.t <= r.t + 0.6);
    if (!errAfter) list.push({ t: r.t, src: tx });
  }
  const py = 'import ast,json,sys\nfor x in json.load(sys.stdin):\n  try: ast.parse(x["src"])\n  except SyntaxError as e: print(x["t"], e.msg)';
  const out = require('child_process').execFileSync('python3', ['-c', py], { input: JSON.stringify(list) }).toString().trim();
  for (const line of out ? out.split('\n') : []) { const [t, ...m] = line.split(' '); push(clock.real(+t), clock.real(+t), `运行的代码有语法错误（${m.join(' ')}）`); }
}
// 8 节奏空档
{
  const AMB = new Set(['step', 'key', 'key_space', 'key_enter', 'key_back', 'blink', 'rustle', 'tick', 'word_rain', 'music', 'snake_slither', 'scratch', 'tap']);
  const ev = cues.list.filter(c => !AMB.has(c.type)).map(c => c.t).sort((a, b) => a - b);
  let prev = S.heroFrom ?? 0;
  for (const t of ev.concat([S.DUR])) { if (t - prev > 5) push(prev, t, `节奏空档 ${(t - prev).toFixed(1)} 秒没有新事件`); prev = Math.max(prev, t); }
}
// 景别分布
const SIZES = [['大远景 <12%', 0.12], ['远景 12–25%', 0.25], ['全景 25–45%', 0.45], ['中近景 >45%', 9]];
const hist = SIZES.map(() => 0); let nT = 0;
for (let t = S.heroFrom ?? 0; t <= S.DUR; t += 0.1) { if (inOff(t)) continue; const f = hero.H * cam.at(t).z / H; hist[SIZES.findIndex(([, m]) => f < m)]++; nT++; }
issues.sort((a, b) => a.t0 - b.t0);
console.log(`体检 ${process.env.SCENE || 'loop'}：${S.DUR} 秒，${issues.length} 个问题`);
console.log('  景别分布：' + SIZES.map(([n], i) => `${n} ${(100 * hist[i] / nT).toFixed(0)}%`).join('，') + '（编程集：20% / 33% / 25% / 22%；数学集基准是全景 ~40%）');
for (const i of issues) console.log(`  ${i.t0.toFixed(2)}${i.t1 > i.t0 ? '–' + i.t1.toFixed(2) : ''}s  ${i.what}`);
