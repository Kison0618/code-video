'use strict';
// 《ESFJ》v9 城市背景（2026-11-17 反馈第 7 条：背景像素块堆叠）
//   以前：一栋栋矩形楼 + 满墙同尺寸小方窗 —— 远看就是马赛克。
//   现在：
//     skyline  三层远景剪影（屋顶有退台、水箱、天线），层与层之间夹雾；窗只在近层零星亮几户，且整层按景深虚化 —— 像长焦镜头里的城市
//     facade   街对面的住宅楼立面：楼板、窗套、窗台、窗帘、空调、阳台栏杆、绿植、晾衣；暗窗里反着天光（斜向高光），不是色块
//     curtain  写字楼玻璃幕墙：竖向铝框 + 天空/夕照反射的大面渐变 + 一两条斜向反光（第 4 章用）
//   全部预渲成半分辨率位图，每帧只贴图。
const K = require('../core');
const S = require('./ESS_kit');
const { clamp, lerp, rgba, mix, mulberry32 } = K;
const glow = S.glow;

// 远景天际线。o: w,h（世界尺寸）, seed, sky[top,bot], fog, base（最近一层颜色）, lit（窗亮的比例）, warm（窗色）, ground（地平线 y，世界坐标）
function skyline(o = {}) {
  const { w = 1800, h = 1600, seed = 3, sky = [[10, 12, 30], [52, 40, 74]], fog = [96, 70, 100], base = [22, 20, 40], lit = 0.08, ground = h - 120, haze = [255, 170, 120], res = 0.5, layers = 3, blurK = 1 } = o;
  return S.bake(Math.ceil(w * res), Math.ceil(h * res), c => {
    c.scale(res, res); const r = mulberry32(seed);
    const g = c.createLinearGradient(0, 0, 0, ground); g.addColorStop(0, rgba(sky[0])); g.addColorStop(1, rgba(sky[1])); c.fillStyle = g; c.fillRect(0, 0, w, h);
    // 地平线上的城市暖光（被雾散开）
    S.rgrad(c, w / 2, ground, w * 0.8, [[0, haze, 0.35], [0.5, haze, 0.1], [1, haze, 0]], 0.35);
    for (let L = 0; L < layers; L++) {
      const k = (L + 1) / layers, col = mix(fog, base, k), top = ground - lerp(700, 1150, k) * (h / 1600);
      const lay = new K.Canvas(Math.ceil(w), Math.ceil(h)), x = lay.getContext('2d');
      let bx = -40 - r() * 80; const boxes = [];
      while (bx < w + 40) {
        const bw = lerp(110, 260, r()) * lerp(0.7, 1.2, k), bh = (ground - top) * lerp(0.35, 1, Math.pow(r(), 0.7)), y0 = ground - bh;
        const gg = x.createLinearGradient(0, y0, 0, ground); gg.addColorStop(0, rgba(mix(col, [255, 255, 255], 0.04))); gg.addColorStop(1, rgba(mix(col, fog, 0.25))); x.fillStyle = gg;
        x.beginPath(); x.moveTo(bx, ground); x.lineTo(bx, y0);
        const kind = r(); // 屋顶：平顶带退台 / 斜顶 / 尖塔
        if (kind < 0.45) { const sw = bw * lerp(0.4, 0.7, r()), sx = bx + (bw - sw) * r(); x.lineTo(sx, y0); x.lineTo(sx, y0 - 40 - r() * 60); x.lineTo(sx + sw, y0 - 40 - r() * 60); x.lineTo(sx + sw, y0); }
        else if (kind < 0.6) { x.lineTo(bx + bw / 2, y0 - bw * 0.3); }
        else if (kind < 0.7) { x.lineTo(bx + bw / 2 - 8, y0); x.lineTo(bx + bw / 2, y0 - 160 - r() * 120); x.lineTo(bx + bw / 2 + 8, y0); }
        x.lineTo(bx + bw, y0); x.lineTo(bx + bw, ground); x.closePath(); x.fill();
        // 侧面暗一点（立体感）
        x.fillStyle = rgba(mix(col, [0, 0, 0], 0.25), 0.6); x.fillRect(bx + bw * 0.72, y0, bw * 0.28, bh);
        if (kind >= 0.7 && r() < 0.6) { x.fillStyle = rgba(mix(col, [0, 0, 0], 0.2)); x.fillRect(bx + bw * 0.2, y0 - 34, 40, 34); x.fillRect(bx + bw * 0.2 + 6, y0 - 50, 28, 16); }
        boxes.push([bx, y0, bw, bh]); bx += bw + lerp(-30, 40, r());
      }
      // 窗：只在近两层，成片地亮（一户人家 = 相邻 2-3 扇），其余是暗的；整体会被虚化成柔光
      if (k > 0.4) for (const [x0, y0, bw, bh] of boxes) {
        const cols = Math.max(2, Math.floor(bw / 30)), rows = Math.floor(bh / 40);
        for (let j = 1; j < rows; j++) { if (r() > lit * 3.2) continue; const i0 = Math.floor(r() * cols), n = 1 + Math.floor(r() * 3), wc = r() < 0.82 ? mix([255, 200, 130], [255, 230, 180], r()) : [180, 210, 255];
          for (let i = i0; i < Math.min(cols, i0 + n); i++) { const wx = x0 + 12 + i * (bw - 24) / cols, wy = y0 + j * 40, a = lerp(0.45, 0.9, r()); x.fillStyle = rgba(wc, a); x.fillRect(wx, wy, (bw - 24) / cols - 12, 18); S.add(x, () => glow(x, wx + 8, wy + 9, 46, wc, 0.35 * a)); } }
      }
      // 层后面的雾 + 景深
      c.save(); c.filter = `blur(${(lerp(9, 4, k) * blurK).toFixed(1)}px)`; c.drawImage(lay, 0, 0, w, h); c.restore();
      const fg = c.createLinearGradient(0, ground - 520, 0, ground); fg.addColorStop(0, rgba(fog, 0)); fg.addColorStop(1, rgba(fog, 0.6 * (1 - k * 0.5))); c.fillStyle = fg; c.fillRect(0, ground - 520, w, 520);
    }
    c.fillStyle = rgba(mix(base, [0, 0, 0], 0.3)); c.fillRect(0, ground - 2, w, h - ground + 2);
  });
}

// 住宅楼立面。cols×rows 户；返回 { img, win(i,j) → 世界坐标中心, W, H }
function facade(o = {}) {
  const { cols = 3, rows = 6, uw = 300, uh = 260, seed = 31, wall = [58, 52, 84], lit = 0.35, res = 0.6, skip = [] } = o;
  const FW = cols * uw + 60, FH = rows * uh + 40, r = mulberry32(seed), units = [];
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) units.push({ i, j, on: r() < lit && !skip.some(s => s[0] === i && s[1] === j), warm: r() < 0.82, bal: r() < 0.45, ac: r() < 0.5, plant: r() < 0.55, cloth: r() < 0.25, cur: r() });
  const img = S.bake(Math.ceil(FW * res), Math.ceil(FH * res), c => {
    c.scale(res, res);
    const g = c.createLinearGradient(0, 0, FW, 0); g.addColorStop(0, rgba(mix(wall, [255, 255, 255], 0.06))); g.addColorStop(0.75, rgba(wall)); g.addColorStop(1, rgba(mix(wall, [0, 0, 0], 0.35))); c.fillStyle = g; c.fillRect(0, 0, FW, FH);
    // 墙面：竖向雨痕（很淡）
    for (let k = 0; k < 40; k++) { const x = r() * FW; c.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`; c.fillRect(x, r() * FH * 0.3, 2 + r() * 6, FH); }
    for (const u of units) unit(c, 30 + u.i * uw, 20 + u.j * uh, uw, uh, u, r);
    // 楼板（每层一道，带下沿阴影）
    for (let j = 0; j <= rows; j++) { const y = 20 + j * uh - 14; c.fillStyle = rgba(mix(wall, [255, 255, 255], 0.12)); c.fillRect(0, y, FW, 12); const sg = c.createLinearGradient(0, y + 12, 0, y + 40); sg.addColorStop(0, 'rgba(0,0,0,0.35)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = sg; c.fillRect(0, y + 12, FW, 28); }
  });
  const win = (i, j) => [30 + i * uw + uw / 2, 20 + j * uh + uh * 0.45];
  return { img, win, W: FW, H: FH, units, uw, uh };
}
// 一户：窗（窗套 + 暗窗反天光 / 亮窗里的窗帘和灯）+ 窗台 + 可能有阳台栏杆、空调、绿植、晾衣
function unit(c, x, y, uw, uh, u, r) {
  const ww = uw * 0.56, wh = uh * 0.62, wx = x + (uw - ww) / 2 - (u.ac ? 24 : 0), wy = y + uh * 0.12;
  c.fillStyle = 'rgba(16,14,30,0.9)'; c.fillRect(wx - 12, wy - 12, ww + 24, wh + 24); // 窗套
  if (u.on) {
    const wc = u.warm ? [255, 206, 140] : [190, 214, 255], g = c.createLinearGradient(0, wy, 0, wy + wh); g.addColorStop(0, rgba(mix(wc, [255, 255, 255], 0.15))); g.addColorStop(1, rgba(mix(wc, [150, 80, 50], 0.35))); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    // 屋里：天花板吊灯的光斑 + 窗帘（半拉）+ 远处家具剪影
    S.rgrad(c, wx + ww * 0.5, wy + 10, ww * 0.6, [[0, [255, 250, 230], 0.5], [1, [255, 250, 230], 0]], 0.6);
    c.fillStyle = rgba(mix(wc, [80, 40, 40], 0.6), 0.5); c.fillRect(wx + ww * 0.1, wy + wh * 0.62, ww * 0.5, wh * 0.38);
    const cw = ww * lerp(0.18, 0.4, u.cur), cc = u.warm ? [196, 92, 76] : [110, 130, 190]; c.fillStyle = rgba(cc, 0.85);
    c.beginPath(); c.moveTo(wx, wy); c.lineTo(wx + cw, wy); c.quadraticCurveTo(wx + cw * 0.7, wy + wh * 0.6, wx + cw * 1.1, wy + wh); c.lineTo(wx, wy + wh); c.fill();
    c.beginPath(); c.moveTo(wx + ww, wy); c.lineTo(wx + ww - cw * 0.6, wy); c.quadraticCurveTo(wx + ww - cw * 0.4, wy + wh * 0.5, wx + ww - cw * 0.7, wy + wh); c.lineTo(wx + ww, wy + wh); c.fill();
    S.add(c, () => glow(c, wx + ww / 2, wy + wh / 2, ww * 1.1, wc, 0.22));
  } else {
    const g = c.createLinearGradient(wx, wy, wx + ww, wy + wh); g.addColorStop(0, 'rgb(46,52,92)'); g.addColorStop(1, 'rgb(20,22,46)'); c.fillStyle = g; c.fillRect(wx, wy, ww, wh);
    c.save(); c.beginPath(); c.rect(wx, wy, ww, wh); c.clip(); c.fillStyle = 'rgba(170,190,255,0.12)'; c.beginPath(); c.moveTo(wx + ww * 0.2, wy); c.lineTo(wx + ww * 0.45, wy); c.lineTo(wx + ww * 0.05, wy + wh); c.lineTo(wx - ww * 0.2, wy + wh); c.fill(); c.restore();
  }
  c.fillStyle = 'rgba(16,14,30,0.9)'; c.fillRect(wx + ww / 2 - 4, wy, 8, wh); c.fillRect(wx, wy + wh * 0.3, ww, 6); // 窗框
  c.fillStyle = 'rgb(120,112,140)'; c.fillRect(wx - 20, wy + wh + 10, ww + 40, 12); // 窗台
  if (u.plant) { c.fillStyle = 'rgb(120,70,60)'; c.fillRect(wx + 8, wy + wh - 16, 34, 26); c.fillStyle = u.on ? 'rgb(80,140,90)' : 'rgb(40,70,60)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.ellipse(wx + 25 + (k - 1.5) * 10, wy + wh - 26 - (k % 2) * 10, 12, 7, k * 0.8, 0, 6.2832); c.fill(); } }
  if (u.ac) { const ax = wx + ww + 30, ay = wy + wh - 70; c.fillStyle = 'rgb(150,150,170)'; c.fillRect(ax, ay, 80, 64); c.fillStyle = 'rgb(90,90,110)'; c.beginPath(); c.arc(ax + 40, ay + 32, 22, 0, 6.2832); c.fill(); c.strokeStyle = 'rgb(70,70,90)'; c.lineWidth = 3; c.beginPath(); c.moveTo(ax + 40, ay + 64); c.lineTo(ax + 40, ay + 120); c.stroke(); }
  if (u.bal) { const by = wy + wh * 0.55; c.fillStyle = 'rgba(30,28,48,0.75)'; c.fillRect(wx - 30, by, ww + 60, wh * 0.45 + 12); c.fillStyle = 'rgb(130,126,150)'; c.fillRect(wx - 34, by - 8, ww + 68, 10); c.fillStyle = 'rgba(130,126,150,0.6)'; for (let k = 0; k < 9; k++) c.fillRect(wx - 30 + k * (ww + 60) / 8, by, 4, wh * 0.45 + 12);
    if (u.cloth) { const cols = [[230, 120, 110], [240, 220, 160], [140, 190, 220]]; for (let k = 0; k < 3; k++) { c.fillStyle = rgba(cols[k]); c.fillRect(wx + 10 + k * ww * 0.3, wy + wh * 0.1, ww * 0.18, wh * 0.32); } c.fillStyle = 'rgb(160,156,170)'; c.fillRect(wx - 10, wy + wh * 0.08, ww + 20, 4); } }
}

// 玻璃幕墙：竖向窄格 + 大面反射渐变 + 斜向反光带；o.sky 反射的天色
function curtain(o = {}) {
  const { w = 600, h = 2400, sky = [[150, 200, 240], [250, 214, 190]], frame = [70, 86, 110], mull = 90, res = 0.5, seed = 7 } = o;
  return S.bake(Math.ceil(w * res), Math.ceil(h * res), c => {
    c.scale(res, res); const r = mulberry32(seed);
    const g = c.createLinearGradient(0, 0, w * 0.4, h); g.addColorStop(0, rgba(sky[0])); g.addColorStop(1, rgba(sky[1])); c.fillStyle = g; c.fillRect(0, 0, w, h);
    // 反射的云和对面楼（大块、虚）
    c.save(); c.filter = 'blur(18px)'; for (let k = 0; k < 6; k++) { c.fillStyle = `rgba(255,255,255,${0.12 + r() * 0.12})`; c.beginPath(); c.ellipse(r() * w, r() * h * 0.6, 120 + r() * 160, 40 + r() * 40, 0, 0, 6.2832); c.fill(); } c.fillStyle = 'rgba(60,80,120,0.25)'; c.fillRect(w * 0.55, h * 0.45, w * 0.5, h); c.restore();
    // 斜向反光带
    c.save(); c.globalCompositeOperation = 'lighter'; for (const [x0, ww, a] of [[w * 0.15, 120, 0.18], [w * 0.5, 50, 0.12]]) { const sg = c.createLinearGradient(x0, 0, x0 + ww, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, `rgba(255,255,255,${a})`); sg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sg; c.beginPath(); c.moveTo(x0, 0); c.lineTo(x0 + ww, 0); c.lineTo(x0 + ww - h * 0.25, h); c.lineTo(x0 - h * 0.25, h); c.fill(); } c.restore();
    // 竖框（主）+ 每 3 层一道横向楼板带
    for (let x = 0; x <= w; x += mull) { c.fillStyle = rgba(frame); c.fillRect(x - 3, 0, 6, h); c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(x + 3, 0, 2, h); }
    for (let y = 120; y < h; y += 330) { c.fillStyle = rgba(mix(frame, [0, 0, 0], 0.2), 0.85); c.fillRect(0, y, w, 22); c.fillStyle = 'rgba(255,255,255,0.15)'; c.fillRect(0, y, w, 3); }
    const sh = c.createLinearGradient(0, 0, w, 0); sh.addColorStop(0, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,30,0.3)'); c.fillStyle = sh; c.fillRect(0, 0, w, h);
  });
}
module.exports = { skyline, facade, curtain };
