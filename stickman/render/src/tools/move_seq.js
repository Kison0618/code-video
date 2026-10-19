// 把一串招式按原片帧率（默认 24fps）渲成图片序列：镜头固定不跟人（位移看得出来），不画拖影，不加待机晃动。
// 用来和原片同帧对比：python3 analysis/ref_compare.py（左右两行：原片 / 我们）。
//   node src/tools/move_seq.js 输出目录 起始秒 帧数 招式@秒 [招式@秒 ...] [--fps 24] [--H 256] [--turn 0.4]
//   例：node src/tools/move_seq.js out/seq_lunge 1.0 10 fence_guard@0.3 lunge_step@1.0
// 招式 = analysis/fight_moves.json 里的名字。输出 目录/0000.png… 和 目录/meta.json（每帧胯的位置，单位 H，相对第 0 帧）
'use strict';
const fs = require('fs'), path = require('path');
const { Canvas } = require('skia-canvas');
const { Actor2, MOVES } = require('../fight');
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf(k); if (i < 0) return d; const v = args[i + 1]; args.splice(i, 2); return v; };
const fps = +opt('--fps', 24), HH = +opt('--H', 256), turn = +opt('--turn', 0.4);   // --turn：转身那一张横向压扁的比例（1 = 不压扁）
const [out, t0s, ns, ...specs] = args, t0 = +t0s, N = +ns;
if (!out || !specs.length) { console.error('用法：node src/tools/move_seq.js 输出目录 起始秒 帧数 招式@秒 ...'); process.exit(1); }
const W = 960, Hc = 540;
const a = new Actor2({ H: HH, x0: 0, noise: 0 });
let tEnd = t0 + N / fps;
for (const sp of specs) {
  const [name, ts] = sp.split('@');
  if (!MOVES[name]) { console.error('没有这个招式：' + name); process.exit(1); }
  tEnd = Math.max(tEnd, a.move(+ts, name).t);
}
a.simulate(tEnd + 0.5, { sfx: false });
fs.mkdirSync(out, { recursive: true });
const c = new Canvas(W, Hc), ctx = c.getContext('2d');
const hip0 = a.stateAt(t0).hip, frames = [];
for (let i = 0; i < N; i++) {
  const t = t0 + i / fps, s = a.stateAt(t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, Hc);
  ctx.translate(W * 0.3 - hip0[0], Hc * 0.85);
  a.draw(ctx, t, { smear: false, step: fps, turn });
  fs.writeFileSync(path.join(out, String(i).padStart(4, '0') + '.png'), c.toBufferSync('png'));
  frames.push({ i, t: +t.toFixed(4), hip: [(s.hip[0] - hip0[0]) / HH, (s.hip[1] - hip0[1]) / HH].map(v => +v.toFixed(3)), lean: +s.lean.toFixed(1) });
}
fs.writeFileSync(path.join(out, 'meta.json'), JSON.stringify({ H: HH, fps, ground: Hc * 0.85, frames }, null, 1));
console.log(out, N, '帧；胯 [前, 下]（H）：', frames.map(f => `f${f.i}[${f.hip.join(',')}] ${f.lean}°`).join('  '));
