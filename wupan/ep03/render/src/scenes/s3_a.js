'use strict';
// 001–004 包子铺：两家铺子 → 长队里全是托 → 包子从地下车库绕回店里 → 判词。
const U = require('./u3');
const { K, Q, X, L, at, pop, push, fig, you, over, crowdAt, verdict } = U;
const { smooth, prog, lerp, clamp, easeInOut } = K;

// —— 001：两家铺子并排，左边长队（人朝左看向铺子），右边空；“你”站在中间，“大多数人”时走到队尾 ——
const SHOP_H = 500, GROUND = 905;
function s01(c, t) {
  push(c, t, L('001').t0, L('001').t1, 0.03, 960, 600, () => {
    Q.put(c, 'E09', 430, 760, SHOP_H, { ar: 1.1 });
    Q.put(c, 'E09', 1500, 760, SHOP_H, { ar: 1.1, flip: true });
    // 队伍：6 个人从铺子门口往右排；“排着长队”时队尾再走进来两个
    const join = at('001', '排着长队');
    for (let k = 0; k < 7; k++) {
      let x = 640 + k * 92;
      if (k >= 5) { const p = smooth(prog(t, join + (k - 5) * 0.35, join + (k - 5) * 0.35 + 0.9)); if (p <= 0) continue; x = lerp(x + 260, x, p); }
      fig(c, crowdAt(k), x, GROUND, 330, { flip: true });
    }
    Q.tag(c, 1500, 420, '空', pop(t, at('001', '空空荡荡')), { size: 56, bg: '#e6dccb', color: '#6b5d4f', seed: 712 });
    // “你”：先站在两家中间，“大多数人”时走向队尾
    const go = smooth(prog(t, at('001', '大多数人'), at('001', '排队的那家') + 0.4));
    const x = lerp(1240, 640 + 7 * 92, go);
    you(c, go > 0.02 && go < 0.98 ? 'E02' : 'E01', x, GROUND + 10, 350, { flip: go > 0.02 });
  });
}
// —— 002：推近队伍；“重庆”；手电光扫过；“全是雇来的托”时一个个摘帽、头顶出「托」 ——
function s02(c, t) {
  push(c, t, L('002').t0, L('002').t1, 0.035, 700, 600, () => {
    Q.put(c, 'E09', 330, 820, 700, { ar: 1.1 });
    const flip = at('002', '全是雇来的托');
    for (let k = 0; k < 5; k++) {
      const x = 700 + k * 230, on = t >= flip + k * 0.22;
      fig(c, on ? 'E08' : crowdAt(k), x, 960, 520, { flip: true });
      if (on) over(c, 'E08', x, 960, 520, '托', pop(t, flip + k * 0.22, 0.45), { size: 52, color: '#fbf3df', bg: Q.RUST, seed: 720 + k, flip: true });
    }
  });
  Q.tag(c, 1640, 190, '重庆', pop(t, at('002', '重庆')), { size: 60, seed: 713 });
  // 执法检查：一束光从右往左扫过队伍（只画光，不画人）
  const a = at('002', '执法人员'), p = prog(t, a, a + 1.6);
  if (p > 0 && p < 1) {
    const x = lerp(1900, 500, easeInOut(p));
    c.save(); c.globalCompositeOperation = 'overlay';
    const g = c.createRadialGradient(x, 640, 20, x, 640, 330); g.addColorStop(0, 'rgba(255,240,200,0.85)'); g.addColorStop(1, 'rgba(255,240,200,0)');
    c.fillStyle = g; c.fillRect(0, 0, 1920, 1080); c.restore();
  }
  Q.tag(c, 1640, 300, '执法人员一查', pop(t, a), { size: 50, seed: 714 });
}
// —— 003：车库剖面，包子沿虚线箭头下坡、绕一圈、回到店里 ——
// 路线按 E11 的剪影框比例给（u,v）；素材到位后按实图微调这几个点
const ROUTE = [[0.12, 0.16], [0.22, 0.30], [0.34, 0.58], [0.55, 0.72], [0.78, 0.66], [0.86, 0.44], [0.70, 0.30], [0.40, 0.22], [0.16, 0.14]];
const GW = 1640, GH = 860, GX = 960, GY = 470;
function routePts() {
  const pts = [];
  for (let i = 0; i < ROUTE.length - 1; i++) for (let k = 0; k < 12; k++) {
    const u = k / 12, [a, b] = [ROUTE[i], ROUTE[i + 1]];
    pts.push([GX - GW / 2 + (a[0] + (b[0] - a[0]) * u) * GW, GY - GH / 2 + (a[1] + (b[1] - a[1]) * u) * GH]);
  }
  const e = ROUTE[ROUTE.length - 1]; pts.push([GX - GW / 2 + e[0] * GW, GY - GH / 2 + e[1] * GH]);
  return pts;
}
const PATH = routePts();
function s03(c, t) {
  const a = L('003').t0, b = at('003', '送回店里') + 0.6, p = smooth(prog(t, a + 0.2, b));
  push(c, t, a, L('003').t1, 0.025, 960, 470, () => {
    Q.sheet(c, 'E11', GX, GY, GW, GH, { seed: 731, label: '地下车库剖面' });
    // 虚线箭头：随包子一起画出来
    const q = K.partial(PATH, p);
    if (q.length > 1) {
      c.save(); c.setLineDash([22, 16]); c.strokeStyle = Q.RUST; c.lineWidth = 9; c.lineCap = 'round';
      c.beginPath(); c.moveTo(q[0][0], q[0][1]); for (const [x, y] of q.slice(1)) c.lineTo(x, y); c.stroke(); c.restore();
      const [x, y] = q[q.length - 1];
      Q.put(c, 'E10', x, y + 60, 130, { ar: 1.3 });
    }
  });
  Q.tag(c, 1500, 820, '地下车库', pop(t, at('003', '地下车库')), { size: 56, seed: 732 });
  Q.tag(c, 520, 120, '又送回店里', pop(t, at('003', '送回店里')), { size: 58, hl: true, seed: 733 });
  X.stamp(c, 1560, 160, '接着卖', prog(t, at('003', '接着卖'), at('003', '接着卖') + 0.8), { size: 64, color: Q.RUST, seed: 734 });
}
// —— 004 判词：只留一条“托”的队伍，队尾是“你” ——
function s04(c, t) {
  for (let k = 0; k < 4; k++) {
    const x = 470 + k * 210;
    fig(c, 'E08', x, 760, 470, { flip: true });
    over(c, 'E08', x, 760, 470, '托', 1, { size: 46, color: '#fbf3df', bg: Q.RUST, seed: 740 + k, flip: true });
  }
  const b = prog(t, at('004', '真顾客'), at('004', '真顾客') + 0.5);
  you(c, 'E01', 1420, 770, 480, { bounce: b });
  verdict(c, t, '004', '一条假队伍', at('004', '一条假队伍'), 960, 870, 78);
}

module.exports = { shots: [['001', s01, 'cut'], ['002', s02, 'fade'], ['003', s03, 'slide'], ['004', s04, 'fade']].map(([id, draw, tr]) => ({ a: L(id).t0 - (id === '001' ? 1 : 0.15), tr, name: id, draw })) };
