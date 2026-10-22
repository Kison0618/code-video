// 动作条：把场景的一段（真实时间 t0–t1）按 fps 抽帧拼成一张小图，不用渲染视频也能看出动作和节奏
//   SCENE=cur2 node src/tools/strip.js 1.0 3.5 out.png [fps=12] [cols=8] [--zoom 2]
//   --zoom：以主角为中心放大（看动作细节）；不写就是场景本来的镜头（看构图和节奏）
// 每格左上角写真实时间和"这一格和上一格差了多少"（主角关节最大位移 / H）：0.00 = 定格，>0.5 = 快动作
'use strict';
const K = require('../core');
const S = require('../frame');
const SC = require({ v4: '../scene_v4', loop: '../scene_loop', loop2: '../scene_loop2', fight: '../scene_fight_demo', garble: '../scene_garble', garble2: '../scene_garble2', cur1: '../scene_cur1', cur2: '../scene_cur2', cur3: '../scene_cur3', cur4: '../scene_cur4', cur5: '../scene_cur5', cursor: '../scene_cursor' }[process.env.SCENE]);
const args = process.argv.slice(2), flags = {};
for (let i = args.length - 1; i >= 0; i--) if (args[i].startsWith('--')) { flags[args[i].slice(2)] = args[i + 1]; args.splice(i, 2); }
const [t0, t1, out, fps = 12, cols = 8] = [Number(args[0]), Number(args[1]), args[2], Number(args[3] || 12), Number(args[4] || 8)];
const CWd = 360, CHt = 203, zoom = Number(flags.zoom || 0);
const ts = []; for (let t = t0; t <= t1 + 1e-6; t += 1 / fps) ts.push(+t.toFixed(4));
const rows = Math.ceil(ts.length / cols);
const sheet = new K.Canvas(CWd * cols, CHt * rows), sc = sheet.getContext('2d');
const cv = new K.Canvas(K.W, K.H), ctx = cv.getContext('2d');
let prev = null;
ts.forEach((t, i) => {
  ctx.reset(); S.renderFrame(ctx, t);
  const x = (i % cols) * CWd, y = Math.floor(i / cols) * CHt;
  let sx = 0, sy = 0, sw = K.W, sh = K.H;
  let d = '';
  if (SC && SC.hero && SC.clock) {
    const ta = SC.clock.anim(t), j = SC.hero.jointsAt(ta), H = SC.hero.H;
    if (prev) { let m = 0; for (const k of ['head', 'hip']) m = Math.max(m, Math.hypot(j[k][0] - prev[k][0], j[k][1] - prev[k][1])); for (const k of ['aF', 'aB', 'lF', 'lB']) m = Math.max(m, Math.hypot(j[k][2][0] - prev[k][2][0], j[k][2][1] - prev[k][2][1])); d = (m / H).toFixed(2); }
    prev = j;
    if (zoom && SC.cam) { const c = SC.cam.at(t), p = SC.cam.toScreen(c, j.hip[0], j.hip[1] - 0.2 * H); sw = K.W / zoom; sh = K.H / zoom; sx = Math.min(K.W - sw, Math.max(0, p[0] - sw / 2)); sy = Math.min(K.H - sh, Math.max(0, p[1] - sh / 2)); }
  }
  sc.drawImage(cv, sx, sy, sw, sh, x, y, CWd, CHt);
  sc.font = '16px Mono'; sc.fillStyle = '#ff0'; sc.fillText(`${t.toFixed(2)} ${d}`, x + 6, y + 18);
  sc.strokeStyle = '#333'; sc.strokeRect(x + 0.5, y + 0.5, CWd - 1, CHt - 1);
});
sheet.toFileSync(out);
console.log('wrote', out, ts.length, 'frames');
