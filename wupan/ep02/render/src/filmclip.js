// 电影片段（render/assets/film/*.mp4）：抽帧缓存成 jpg，按镜头内时间取帧，做成贴在纸面上的旧照片
//   F.has('film_airport')  文件在不在
//   F.draw(ctx, 'film_airport', lt, x, y, w, { rot, seed })   lt = 片段内秒数，(x,y) 是中心，w 是画面宽
// 抽帧：ffmpeg 一次性抽成 30fps、宽 1280、褪色偏暖（跟版画纸面一个调子），先写临时目录再改名，避免并行进程撞车
'use strict';
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { Image } = require('skia-canvas');
const K = require('./core');
const P = require('./paper');

const DIR = path.join(__dirname, '../assets/film'), CACHE = path.join(__dirname, '../.cache');
const has = n => fs.existsSync(path.join(DIR, n + '.mp4'));
const VF0 = 'fps=30,scale=1280:-2,eq=saturation=0.8:contrast=1.06:brightness=0.03,colorbalance=rs=0.05:gs=0.02:bs=-0.05';
// 台标/版权字：film_airport 左上角有 BINGE SOCIETY 台标、底部有版权行，裁成 1440×810（仍是 16:9）
const CROP = { film_airport: 'crop=1440:810:300:170,' };
const VF = n => (CROP[n] || '') + VF0;

const meta = new Map();
function frames(n) {
  if (meta.has(n)) return meta.get(n);
  const src = path.join(DIR, n + '.mp4'), out = path.join(CACHE, 'film2_' + n);
  if (!fs.existsSync(path.join(out, 'done')) || fs.statSync(src).mtimeMs > fs.statSync(path.join(out, 'done')).mtimeMs) {
    const tmp = out + '_tmp' + process.pid;
    fs.mkdirSync(tmp, { recursive: true });
    const r = spawnSync(K.FFMPEG, ['-y', '-loglevel', 'error', '-i', src, '-vf', VF(n), '-q:v', '3', path.join(tmp, '%05d.jpg')]);
    if (r.status !== 0) throw new Error('抽帧失败 ' + src + '\n' + r.stderr);
    fs.writeFileSync(path.join(tmp, 'done'), '');
    if (!fs.existsSync(path.join(out, 'done'))) { try { fs.renameSync(tmp, out); } catch (e) { /* 别的进程先改好了 */ } }
  }
  const dir = fs.existsSync(path.join(out, 'done')) ? out : fs.readdirSync(CACHE).map(d => path.join(CACHE, d)).find(d => d.startsWith(out + '_tmp') && fs.existsSync(path.join(d, 'done')));
  const list = fs.readdirSync(dir).filter(f => f.endsWith('.jpg')).sort();
  const m = { dir, list, last: null, lastK: -1 };
  meta.set(n, m); return m;
}
function frameAt(n, lt) {
  const m = frames(n), k = Math.max(0, Math.min(m.list.length - 1, Math.floor(lt * 30)));
  if (k !== m.lastK) { const im = new Image(); im.src = fs.readFileSync(path.join(m.dir, m.list[k])); m.last = im; m.lastK = k; }
  return m.last;
}
const dur = n => frames(n).list.length / 30;

// 旧照片：白边撕纸 + 投影，里面是电影画面；alpha 控制淡入
function draw(ctx, n, lt, x, y, w, o = {}) {
  const im = frameAt(n, Math.max(0, lt));
  const h = w * im.height / im.width, b = o.border == null ? 22 : o.border;
  ctx.save(); ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  ctx.translate(x, y); if (o.rot) ctx.rotate(o.rot);
  if (o.s) ctx.scale(o.s, o.s);
  P.piece(ctx, P.poly(P.jag([[-w / 2 - b, -h / 2 - b], [w / 2 + b, -h / 2 - b], [w / 2 + b, h / 2 + b], [-w / 2 - b, h / 2 + b]], 2, 16, o.seed || 7)), '#f4ecdc', { blur: 24, dy: 12 });
  ctx.drawImage(im, -w / 2, -h / 2, w, h);
  ctx.strokeStyle = 'rgba(35,27,21,0.55)'; ctx.lineWidth = 3; ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
  return h;
}

// 铺满画面（不加相框）：k = 额外放大，cx/cy = 放大中心（0..1）
function full(ctx, n, lt, o = {}) {
  const im = frameAt(n, Math.max(0, lt)), k = o.k || 1;
  const s = Math.max(K.W / im.width, K.H / im.height) * k, w = im.width * s, h = im.height * s;
  const cx = o.cx == null ? 0.5 : o.cx, cy = o.cy == null ? 0.5 : o.cy;
  ctx.save(); ctx.globalAlpha *= o.alpha == null ? 1 : o.alpha;
  ctx.drawImage(im, K.W * cx - w * cx, K.H * cy - h * cy, w, h);
  ctx.restore();
}

// 用到的片段登记表：scenes 在 require 时登记 {name, t0, t1}（成片时间），mix02.py 照这个把原声垫进去
const USES = [];
function use(name, t0, t1) { if (has(name)) USES.push({ name, file: path.join(DIR, name + '.mp4'), t0, t1 }); return has(name); }
module.exports = { has, draw, full, dur, use, USES };
