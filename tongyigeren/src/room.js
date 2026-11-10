// 房间：黑夜里一座亮着的阁楼小屋的剖面（尖屋顶）。窗和书桌在左，矮柜和画在中间，床在右
// 所有东西都是参数化的（颜色、款式可以单独换，也可以慢慢过渡）
'use strict';
const FLOOR = 770;                                   // 墙和地板的交界
const HOUSE = { l: 130, r: 1670, peak: [900, 62], eave: 404, base: 852 };   // 小屋的轮廓
const roofY = x => HOUSE.eave - (1 - Math.abs(x - HOUSE.peak[0]) / (HOUSE.peak[0] - HOUSE.l)) * (HOUSE.eave - HOUSE.peak[1]);

function rr(c, x, y, w, h, r) { c.beginPath(); c.roundRect(x, y, w, h, r); c.fill(); }
function poly(c, pts) { c.beginPath(); c.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]); c.closePath(); c.fill(); }
const fs = (c, col, a) => { c.fillStyle = css(col, a); };
function housePath(c, pad) { pad = pad || 0; c.beginPath(); c.moveTo(HOUSE.l - pad, HOUSE.base + pad); c.lineTo(HOUSE.l - pad, HOUSE.eave - pad * .4); c.lineTo(HOUSE.peak[0], HOUSE.peak[1] - pad * 1.2); c.lineTo(HOUSE.r + pad, HOUSE.eave - pad * .4); c.lineTo(HOUSE.r + pad, HOUSE.base + pad); c.closePath(); }

// ---------- 每个年代的房间 ----------
// 12 样“原来的东西”：墙 窗帘 被子 地毯 画 台灯 椅子 玩偶 床 书桌 矮柜 小船
const ERA = {
  // 你点开的时候
  v0: { wall: C('#7fa3ba'), curtain: C('#dba23a'), quilt: C('#b5473d'), rug: C('#2b7f7c'), art: 'light', lamp: 'bank', chair: 'red', toy: 'bear', bed: 'iron', desk: 'desk', shelf: 'low', sky: 'day', pillow: C('#efe7da') },
  // 三十秒以后（九样东西已经换完）
  v1: { wall: C('#c9a089'), curtain: C('#3d7f5c'), quilt: C('#2f4b80'), rug: C('#d6bd84'), art: 'peak', lamp: 'shroom', chair: 'stool', toy: 'robot', bed: 'iron', desk: 'desk', shelf: 'low', sky: 'day', pillow: C('#efe7da') },
  // 十七岁：画→乐队海报，被子、台灯换了，玩偶没了
  v17: { wall: C('#c9a089'), curtain: C('#3d7f5c'), quilt: C('#3c3946'), rug: C('#d6bd84'), art: 'band', lamp: 'arm', chair: 'stool', toy: 'amp', bed: 'iron', desk: 'desk', shelf: 'low', sky: 'dusk', pillow: C('#d9d6d0') },
  // 二十七岁：床换成双人床，地毯、窗帘换了
  v27: { wall: C('#c9a089'), curtain: C('#e9e2d2'), quilt: C('#e6dfd2'), rug: C('#b5563c'), rugStripe: C('#ecd9b4'), art: 'abstract', lamp: 'globe', chair: 'stool', toy: 'plant', bed: 'double', desk: 'desk', shelf: 'low', sky: 'day', pillow: C('#f4efe6') },
  // 三十七岁：墙刷了，椅子的位置放了小床
  v37: { wall: C('#8f9fc9'), curtain: C('#e9e2d2'), quilt: C('#d9b36a'), rug: C('#b5563c'), rugStripe: C('#ecd9b4'), art: 'kid', lamp: 'globe', chair: 'crib', toy: 'plant', bed: 'double', desk: 'desk', shelf: 'low', sky: 'day', pillow: C('#f4efe6') },
  // 五十七岁：小床没了，书桌换成扶手椅，墙刷过三遍
  v57: { wall: C('#b7b09c'), curtain: C('#8a6f8f'), quilt: C('#7f9a94'), rug: C('#4a5a7a'), art: 'photo', lamp: 'cone', chair: 'none', toy: 'plant', bed: 'double', desk: 'armchair', shelf: 'low', sky: 'day', pillow: C('#efe9df') },
  // 七十七岁：矮柜也换了，只剩那艘船
  v77: { wall: C('#b7b09c'), curtain: C('#8a6f8f'), quilt: C('#7f9a94'), rug: C('#4a5a7a'), art: 'photo', lamp: 'cone', chair: 'none', toy: 'clock', bed: 'double', desk: 'armchair', shelf: 'tall', sky: 'grey', pillow: C('#efe9df') },
};
const era = (base, o) => Object.assign({}, base, o);
ERA.v17a = era(ERA.v17, { art: 'peak' });                                        // 十七岁，画还没换
ERA.v27a = era(ERA.v27, { bed: 'iron', quilt: ERA.v17.quilt, pillow: ERA.v17.pillow });   // 二十七岁，床还没换
ERA.v37a = era(ERA.v37, { chair: 'stool' });                                     // 三十七岁，小床还没来
ERA.v57a = era(ERA.v57, { wall: ERA.v37.wall });                                 // 五十七岁，墙还没重刷
ERA.v57b = era(ERA.v57, { wall: C('#c98f7a') });                                 // 墙刷第一遍
ERA.v57c = era(ERA.v57, { wall: C('#7fa08a') });                                 // 墙刷第二遍
// 夜里（记词的那个晚上）= v1 的房间，天黑
ERA.night = era(ERA.v1, { sky: 'night' });

// 把两个年代按“每样东西各自的进度”混在一起。k 可以是一个数，也可以是 {wall:.., curtain:.., ...}
function blendEra(a, b, k) {
  const kk = key => typeof k === 'number' ? k : (k[key] === undefined ? (k._ || 0) : k[key]), o = {};
  for (const key of Object.keys(a)) {
    const va = a[key], vb = b[key] === undefined ? va : b[key], q = kk(key);
    if (Array.isArray(va) && typeof va[0] === 'number') o[key] = q <= 0 ? va : q >= 1 ? vb : mixc(va, vb, q);
    else o[key] = va === vb || q <= 0 ? va : q >= 1 ? vb : { __x: 1, a: va, b: vb, k: q };
  }
  if (b.rugStripe && !a.rugStripe) o.rugStripe = kk('rug') >= 0.5 ? b.rugStripe : undefined, o.rugStripeK = sat(kk('rug') * 2 - 1);
  return o;
}

// ---------- 画 ----------
// actors(ctx, layer)：layer = 'behind'（家具后面）/ 'bed'（坐在床上，被子前面）/ 'front'（最前面）
function drawRoom(ctx, S, actors, o) {
  o = o || {};
  const g = ctx.grid, it = (v, fn) => { if (v && v.__x) g.xfade(ctx, v.k, c => fn(c, v.a), c => fn(c, v.b)); else fn(ctx, v); };
  const wall = S.wall;
  // 屋外：夜空（很暗），几颗星
  if (!o.noSky) {
    fs(ctx, C('#07080d')); ctx.fillRect(-400, -300, W + 800, H + 600);
    for (let k = 0; k < 40; k++) { const x = hash(k * 3 + 11) * 2100 - 100, y = hash(k * 3 + 12) * 520 - 40, tw = .5 + .5 * Math.sin((o.time || 0) * (1 + hash(k)) + k); fs(ctx, [200, 215, 255], .25 + .5 * tw * hash(k * 3 + 13)); ctx.fillRect(x, y, 7, 7); }
  }
  // 屋顶的厚度（比屋里暗）
  fs(ctx, C('#2a2430')); housePath(ctx, 26); ctx.fill();
  fs(ctx, C('#3b3340')); poly(ctx, [HOUSE.l - 60, HOUSE.eave + 14, HOUSE.peak[0], HOUSE.peak[1] - 44, HOUSE.r + 60, HOUSE.eave + 14, HOUSE.r + 60, HOUSE.eave + 44, HOUSE.peak[0], HOUSE.peak[1] - 8, HOUSE.l - 60, HOUSE.eave + 44]);
  fs(ctx, C('#3b3340')); ctx.fillRect(1360, 96, 70, 150); fs(ctx, C('#4a4150')); ctx.fillRect(1350, 86, 90, 20);      // 烟囱
  ctx.save(); housePath(ctx); ctx.clip();
  // 墙
  fs(ctx, wall); ctx.fillRect(0, 0, W, FLOOR);
  let gr = ctx.createLinearGradient(0, 60, 0, FLOOR); gr.addColorStop(0, 'rgba(0,0,0,.34)'); gr.addColorStop(.45, 'rgba(0,0,0,.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, FLOOR);
  gr = ctx.createLinearGradient(HOUSE.l, 0, HOUSE.r, 0); gr.addColorStop(0, 'rgba(0,0,0,.26)'); gr.addColorStop(.2, 'rgba(0,0,0,0)'); gr.addColorStop(.8, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,.26)');
  ctx.fillStyle = gr; ctx.fillRect(0, 0, W, FLOOR);
  // 屋顶下面的木梁
  ctx.strokeStyle = css(mixc(wall, [40, 28, 20], .62)); ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(HOUSE.l, HOUSE.eave + 10); ctx.lineTo(HOUSE.peak[0], HOUSE.peak[1] + 12); ctx.lineTo(HOUSE.r, HOUSE.eave + 10); ctx.stroke();
  ctx.lineWidth = 12; ctx.beginPath(); ctx.moveTo(520, roofY(520) + 8); ctx.lineTo(1280, roofY(1280) + 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(900, HOUSE.peak[1]); ctx.lineTo(900, roofY(520) + 8); ctx.stroke();
  // 墙裙（下半截颜色深一点）+ 踢脚线
  fs(ctx, mixc(wall, [30, 22, 18], .2)); ctx.fillRect(0, 610, W, FLOOR - 610);
  fs(ctx, mixc(wall, [250, 244, 232], .5)); ctx.fillRect(0, 602, W, 10);
  fs(ctx, mixc(wall, [30, 22, 18], .5)); ctx.fillRect(0, FLOOR - 16, W, 16);
  // 地板
  const fl = o.floor || C('#7a5a40');
  fs(ctx, fl); ctx.fillRect(0, FLOOR, W, HOUSE.base - FLOOR);
  for (let r = 0, y = FLOOR; y < HOUSE.base; r++) { const h = 18 + r * 8; fs(ctx, r % 2 ? [255, 220, 180] : [0, 0, 0], r % 2 ? .06 : .08); ctx.fillRect(0, y, W, h); fs(ctx, [20, 12, 6], .3); for (let k = 0; k < 7; k++) ctx.fillRect(HOUSE.l + ((k * 331 + r * 197) % 1540), y, 5, h); y += h; }
  // 地毯
  it(S.rug, (c, col) => drawRug(c, col, S.rugStripe, S.rugStripeK));
  // 窗
  it(S.sky, (c, sky) => drawWindow(c, sky, o.time || 0));
  it(S.curtain, (c, col) => drawCurtain(c, col));
  it(S.art, (c, kind) => drawArt(c, kind));
  it(S.shelf, (c, kind) => drawShelf(c, kind));
  it(S.toy, (c, kind) => drawToy(c, kind));
  it(S.desk, (c, kind) => kind === 'desk' ? drawDesk(c) : drawArmchair(c));
  it(S.chair, (c, kind) => drawChair(c, kind));
  drawNightstand(ctx);
  it(S.lamp, (c, kind) => drawLamp(c, kind, o.lampOn === undefined ? 1 : o.lampOn));
  it(S.bed, (c, kind) => drawBed(c, kind, S.pillow));
  if (actors) actors(ctx, 'behind');
  it(S.bed, (c, kind) => drawQuilt(c, kind, S.quilt));
  if (actors) actors(ctx, 'bed');
  if (actors) actors(ctx, 'front');
  ctx.restore();
  // 地板的侧面（小屋的底座）
  fs(ctx, C('#2a2430')); ctx.fillRect(HOUSE.l - 26, HOUSE.base, HOUSE.r - HOUSE.l + 52, 22);
}

const RUG = { x0: 560, x1: 1260, y0: 786, y1: 838 };
function drawRug(c, col, stripe, sk) {
  const { x0, x1, y0, y1 } = RUG, sh = 34;
  fs(c, [0, 0, 0], .22); poly(c, [x0 - 6, y0 + 5, x1 + 6, y0 + 5, x1 + sh + 8, y1 + 6, x0 - sh - 8, y1 + 6]);
  fs(c, col); poly(c, [x0, y0, x1, y0, x1 + sh, y1, x0 - sh, y1]);
  fs(c, mixc(col, [255, 255, 255], .35)); poly(c, [x0 + 14, y0 + 8, x1 - 14, y0 + 8, x1 + sh - 22, y1 - 8, x0 - sh + 22, y1 - 8]);
  fs(c, col); poly(c, [x0 + 22, y0 + 14, x1 - 22, y0 + 14, x1 + sh - 34, y1 - 14, x0 - sh + 34, y1 - 14]);
  if (stripe) { c.save(); c.globalAlpha *= (sk === undefined ? 1 : sk); fs(c, stripe); for (let k = 0; k < 9; k++) { const xa = x0 + 60 + k * 76; poly(c, [xa, y0, xa + 30, y0, xa + 30 + (xa - 910) * .05, y1, xa + (xa - 910) * .05, y1]); } c.restore(); }
}

const WIN = { x: 250, y: 440, w: 270, h: 190 };
function drawWindow(c, sky, time) {
  const { x, y, w, h } = WIN;
  fs(c, [70, 50, 38]); c.fillRect(x - 14, y - 14, w + 28, h + 28);
  let top, bot, far, near;
  if (sky === 'night') { top = C('#0e1a3a'); bot = C('#2a3d68'); far = C('#101c2a'); near = C('#0a141c'); }
  else if (sky === 'dusk') { top = C('#5a5f9a'); bot = C('#f2a878'); far = C('#5a4a66'); near = C('#3a3248'); }
  else if (sky === 'grey') { top = C('#aab6c2'); bot = C('#dfe3e3'); far = C('#8d9aa4'); near = C('#70808c'); }
  else { top = C('#86c0ea'); bot = C('#e8f3f0'); far = C('#7fb0a0'); near = C('#4f8a6a'); }
  const gr = c.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, css(top)); gr.addColorStop(1, css(bot));
  c.fillStyle = gr; c.fillRect(x, y, w, h);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (sky === 'night') { fs(c, [255, 255, 255], .8); for (let k = 0; k < 9; k++) c.fillRect(x + hash(k * 3 + 1) * w, y + hash(k * 3 + 2) * h * .5, 6, 6); fs(c, [255, 246, 214]); c.beginPath(); c.arc(x + w * .28, y + 62, 30, 0, 7); c.fill(); }
  else if (sky === 'dusk') { fs(c, [255, 220, 160]); c.beginPath(); c.arc(x + w * .7, y + h * .62, 30, 0, 7); c.fill(); }
  else if (sky === 'day') { fs(c, [255, 255, 255], .9); rr(c, x + 130, y + 36, 100, 26, 13); rr(c, x + 160, y + 22, 60, 26, 13); }
  // 窗外：远处的屋顶
  fs(c, far); poly(c, [x - 10, y + h, x - 10, y + h * .66, x + 70, y + h * .46, x + 150, y + h * .66, x + 150, y + h]); c.fillRect(x + 96, y + h * .4, 22, 60);
  fs(c, near); poly(c, [x + 120, y + h, x + 120, y + h * .74, x + 210, y + h * .56, x + 300, y + h * .74, x + 300, y + h]);
  c.restore();
  fs(c, [70, 50, 38]); c.fillRect(x + w / 2 - 6, y, 12, h);
  fs(c, [96, 70, 52]); c.fillRect(x - 28, y + h + 12, w + 56, 16);
}
function drawCurtain(c, col) {
  const { x, y, w, h } = WIN, top = y - 36, bot = y + h + 44;
  fs(c, [40, 30, 26]); c.fillRect(x - 70, top - 8, w + 140, 9);
  for (const [cx, cw, dir] of [[x - 62, 78, 1], [x + w - 16, 78, -1]]) {
    fs(c, col); poly(c, [cx, top, cx + cw, top, cx + cw - dir * 0, bot, cx, bot]);
    for (let k = 0; k < 3; k++) { fs(c, k % 2 ? [255, 255, 255] : [0, 0, 0], k % 2 ? .12 : .18); c.fillRect(cx + 8 + k * 24, top, 12, bot - top); }
    fs(c, mixc(col, [255, 255, 255], .5)); c.fillRect(cx, top + (bot - top) * .56, cw, 9);        // 束带
  }
}

const ART = { x: 800, y: 236, w: 200, h: 150 };
function drawArt(c, kind) {
  const { x, y, w, h } = ART;
  if (kind === 'none') return;
  fs(c, [0, 0, 0], .22); c.fillRect(x - 8, y - 4, w + 24, h + 22);
  const frame = kind === 'band' ? C('#1b1b20') : kind === 'abstract' || kind === 'kid' ? C('#efe9dc') : kind === 'photo' ? C('#2a2a2e') : C('#e9dcc0');
  fs(c, frame); c.fillRect(x - 12, y - 12, w + 24, h + 24);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (kind === 'light') {                                   // 灯塔
    fs(c, C('#f1d9a8')); c.fillRect(x, y, w, h);
    fs(c, C('#f6eccf')); c.beginPath(); c.arc(x + w * .28, y + h * .3, 24, 0, 7); c.fill();
    fs(c, C('#2f6f8a')); c.fillRect(x, y + h * .72, w, h * .28);
    fs(c, C('#f4f1ea')); poly(c, [x + w * .52, y + h * .24, x + w * .66, y + h * .24, x + w * .7, y + h * .78, x + w * .48, y + h * .78]);
    fs(c, C('#c8463a')); c.fillRect(x + w * .5, y + h * .36, w * .19, 14); c.fillRect(x + w * .49, y + h * .58, w * .21, 14);
    fs(c, C('#3a2f2a')); c.fillRect(x + w * .5, y + h * .14, w * .18, 16);
  } else if (kind === 'peak') {                             // 雪山和月亮
    fs(c, C('#3a3f6a')); c.fillRect(x, y, w, h);
    fs(c, C('#f1e9c8')); c.beginPath(); c.arc(x + w * .76, y + h * .26, 18, 0, 7); c.fill();
    fs(c, C('#8a8fb8')); poly(c, [x - 10, y + h, x + w * .34, y + h * .3, x + w * .7, y + h]);
    fs(c, C('#6a70a0')); poly(c, [x + w * .36, y + h, x + w * .68, y + h * .46, x + w + 10, y + h]);
    fs(c, C('#f4f4f8')); poly(c, [x + w * .34, y + h * .3, x + w * .44, y + h * .5, x + w * .34, y + h * .46, x + w * .25, y + h * .5]);
  } else if (kind === 'band') {                             // 乐队海报
    fs(c, C('#16161c')); c.fillRect(x, y, w, h);
    fs(c, C('#e9d34a')); for (let k = 0; k < 5; k++) c.fillRect(x + 20 + k * 34, y + h * .7 - [40, 78, 56, 92, 48][k], 22, [40, 78, 56, 92, 48][k]);
    fs(c, C('#e23b6b')); c.fillRect(x + 14, y + h * .78, w - 28, 12);
  } else if (kind === 'abstract') {
    fs(c, C('#f4efe4')); c.fillRect(x, y, w, h);
    fs(c, C('#2f6f6a')); c.fillRect(x + 26, y + 22, 64, 106); fs(c, C('#e0603f')); c.beginPath(); c.arc(x + 132, y + 62, 38, 0, 7); c.fill(); fs(c, C('#e9b34a')); c.fillRect(x + 104, y + 104, 70, 20);
  } else if (kind === 'kid') {                              // 孩子画的一家三口
    fs(c, C('#fbf8f1')); c.fillRect(x, y, w, h);
    const cols = ['#3d7bd0', '#e2553f', '#3aa56a'];
    for (let k = 0; k < 3; k++) { fs(c, C(cols[k])); const px = x + 52 + k * 48, s = k === 2 ? .66 : 1; c.beginPath(); c.arc(px, y + h * .46 + (1 - s) * 30, 13 * s, 0, 7); c.fill(); poly(c, [px, y + h * .52 + (1 - s) * 30, px - 18 * s, y + h * .84, px + 18 * s, y + h * .84]); }
    fs(c, C('#f2b632')); c.beginPath(); c.arc(x + 30, y + 28, 16, 0, 7); c.fill();
  } else if (kind === 'photo') {                            // 黑白合影
    fs(c, C('#d8d4cc')); c.fillRect(x, y, w, h);
    fs(c, C('#55524e')); for (let k = 0; k < 3; k++) { const hh = [84, 96, 60][k]; rr(c, x + 40 + k * 46, y + h - hh, 34, hh, 12); c.beginPath(); c.arc(x + 57 + k * 46, y + h - hh - 12, 15, 0, 7); c.fill(); }
  }
  c.restore();
}

const SHELF = { x: 700, y: 620, w: 250, h: 150 };
function drawShelf(c, kind) {
  let { x, y, w, h } = SHELF; const tall = kind === 'tall';
  if (tall) { y -= 150; h += 150; }
  const body = tall ? C('#4f3a2e') : C('#d9cdb4'), inner = tall ? C('#2e211a') : C('#a89c86');
  fs(c, [0, 0, 0], .25); c.fillRect(x + 8, y + 8, w + 8, h - 8);
  fs(c, body); c.fillRect(x, y, w, h);
  const rows = tall ? 4 : 2, rh = (h - 12) / rows, bc = ['#c8463a', '#2c6c9c', '#dba62b', '#4f8a5b', '#e7dfd0', '#8a5aa0', '#e0803a', '#3a3f6a'];
  for (let r = 0; r < rows; r++) {
    const ry = y + 10 + r * rh; fs(c, inner); c.fillRect(x + 10, ry, w - 20, rh - 10);
    let bx = x + 14; const full = tall ? w - 26 : (r === 0 ? 140 : w - 26);
    for (let k = 0; bx < x + 14 + full - 14; k++) { const bw = 14 + Math.floor(hash(k * 13 + r * 7 + (tall ? 99 : 0)) * 3) * 5, bh = (rh - 10) * (.62 + .34 * hash(k * 5 + r * 3 + (tall ? 7 : 0))); fs(c, C(bc[Math.floor(hash(k * 11 + r * 17 + (tall ? 5 : 0)) * bc.length)])); c.fillRect(bx, ry + rh - 10 - bh, bw - 2, bh); bx += bw; }
    if (!tall && r === 0) { fs(c, C('#3d7bd0')); c.fillRect(x + 168, ry + rh - 46, 36, 36); fs(c, C('#e9b432')); c.beginPath(); c.arc(x + 222, ry + rh - 26, 16, 0, 7); c.fill(); }
  }
}
// 矮柜上放的东西：小熊 / 机器人 / 小音箱 / 盆栽 / 座钟
const TOY = { x: 760, y: 620 };
function drawToy(c, kind) {
  const { x, y } = TOY;
  if (kind === 'none' || kind === 'clock') { if (kind === 'clock') { fs(c, C('#c9a15a')); rr(c, 778, 400, 76, 70, 12); fs(c, C('#f4efe2')); c.beginPath(); c.arc(816, 434, 24, 0, 7); c.fill(); fs(c, C('#2a2320')); c.fillRect(813, 418, 6, 18); c.fillRect(813, 430, 16, 6); } return; }
  if (kind === 'amp') { fs(c, C('#26262d')); rr(c, x - 44, y - 78, 88, 78, 8); fs(c, C('#8a8f9a')); c.beginPath(); c.arc(x, y - 34, 24, 0, 7); c.fill(); fs(c, C('#26262d')); c.beginPath(); c.arc(x, y - 34, 10, 0, 7); c.fill(); fs(c, C('#e9b432')); c.fillRect(x - 32, y - 70, 12, 6); return; }
  if (kind === 'plant') { fs(c, C('#c9794e')); poly(c, [x - 26, y - 40, x + 26, y - 40, x + 20, y, x - 20, y]); fs(c, C('#3f8a5a')); for (const [dx, dy, r] of [[0, -78, 26], [-24, -60, 20], [24, -62, 20], [-8, -104, 18], [14, -100, 16]]) { c.beginPath(); c.arc(x + dx, y + dy, r, 0, 7); c.fill(); } return; }
  if (kind === 'robot') {
    fs(c, C('#8fa0aa')); c.fillRect(x - 6, y - 124, 12, 20); fs(c, C('#e2553f')); c.beginPath(); c.arc(x, y - 128, 9, 0, 7); c.fill();
    fs(c, C('#c2ccd2')); rr(c, x - 34, y - 108, 68, 52, 8); fs(c, C('#2a3a4a')); c.fillRect(x - 24, y - 94, 48, 20); fs(c, C('#7fe0d0')); c.fillRect(x - 18, y - 90, 12, 12); c.fillRect(x + 6, y - 90, 12, 12);
    fs(c, C('#9fb0ba')); rr(c, x - 28, y - 54, 56, 44, 6); fs(c, C('#e9b432')); c.fillRect(x - 12, y - 42, 24, 12);
    fs(c, C('#8fa0aa')); c.fillRect(x - 42, y - 50, 12, 34); c.fillRect(x + 30, y - 50, 12, 34); c.fillRect(x - 22, y - 12, 16, 12); c.fillRect(x + 6, y - 12, 16, 12);
    return;
  }
  const col = C('#9a6a44'), dk = mul(col, .78);                                                  // 小熊
  fs(c, dk); rr(c, x - 36, y - 26, 24, 28, 10); rr(c, x + 12, y - 26, 24, 28, 10);
  fs(c, col); rr(c, x - 28, y - 68, 56, 66, 24);
  fs(c, dk); rr(c, x - 40, y - 60, 18, 36, 9); rr(c, x + 22, y - 60, 18, 36, 9);
  c.beginPath(); c.arc(x - 26, y - 112, 14, 0, 7); c.arc(x + 26, y - 112, 14, 0, 7); c.fill();
  fs(c, col); c.beginPath(); c.arc(x, y - 90, 32, 0, 7); c.fill();
  fs(c, C('#e3c9a4')); c.beginPath(); c.ellipse(x, y - 82, 15, 12, 0, 0, 7); c.fill();
  fs(c, [30, 22, 18]); c.fillRect(x - 16, y - 100, 7, 7); c.fillRect(x + 9, y - 100, 7, 7); c.fillRect(x - 4, y - 87, 8, 6);
}

const DESK = { x: 226, y: 668, w: 330 };
function drawDesk(c) {
  const { x, y, w } = DESK, wood = C('#b08a5e');
  fs(c, mul(wood, .6)); c.fillRect(x + 12, y + 18, 14, FLOOR - y - 18); c.fillRect(x + w - 26, y + 18, 14, FLOOR - y - 18);
  fs(c, mul(wood, .78)); c.fillRect(x + 6, y + 16, w - 12, 30);
  fs(c, wood); c.fillRect(x, y, w, 18); fs(c, [255, 255, 255], .14); c.fillRect(x, y, w, 6);
  fs(c, C('#3d7bd0')); c.fillRect(x + 30, y - 14, 70, 7); fs(c, C('#efe7da')); c.fillRect(x + 34, y - 7, 62, 7);
  fs(c, C('#e9b432')); c.fillRect(x + 250, y - 40, 28, 40); fs(c, C('#c8463a')); c.fillRect(x + 256, y - 62, 5, 24); fs(c, C('#3aa56a')); c.fillRect(x + 266, y - 56, 5, 18);   // 笔筒
}
function drawArmchair(c) {
  const x = 250, y = 566, col = C('#a8563a');
  fs(c, [0, 0, 0], .25); c.beginPath(); c.ellipse(x + 125, FLOOR + 6, 150, 12, 0, 0, 7); c.fill();
  fs(c, mul(col, .7)); rr(c, x + 20, y, 210, 184, 40);
  fs(c, col); rr(c, x + 34, y + 14, 182, 144, 30);
  fs(c, mul(col, 1.14)); rr(c, x + 28, y + 116, 194, 56, 16);
  fs(c, mul(col, .86)); rr(c, x, y + 80, 54, 120, 22); rr(c, x + 196, y + 80, 54, 120, 22);
  fs(c, C('#3a2a1e')); c.fillRect(x + 14, FLOOR - 12, 16, 12); c.fillRect(x + 220, FLOOR - 12, 16, 12);
}
const CHAIR = { x: 574, seat: 690 };
function drawChair(c, kind) {
  if (kind === 'none') return;
  if (kind === 'crib') {                                   // 小床（放在椅子原来的位置）
    const x = 560, y = 580, w = 240, h = 190, col = C('#f1ede4');
    fs(c, [0, 0, 0], .22); c.beginPath(); c.ellipse(x + w / 2, FLOOR + 6, w / 2 + 14, 10, 0, 0, 7); c.fill();
    fs(c, C('#dfe9f3')); c.fillRect(x + 10, y + 90, w - 20, 56); fs(c, C('#f6c8c0')); rr(c, x + 30, y + 74, 78, 32, 14);
    fs(c, col); c.fillRect(x, y, 16, h); c.fillRect(x + w - 16, y, 16, h); c.fillRect(x, y, w, 14); c.fillRect(x, y + 142, w, 16);
    for (let k = 1; k < 10; k++) c.fillRect(x + k * (w / 10) - 4, y + 14, 8, 130);
    return;
  }
  const { x, seat } = CHAIR;
  if (kind === 'red') {                                    // 红色靠背椅
    const col = C('#c8463a'), dk = mul(col, .7);
    fs(c, dk); c.fillRect(x + 6, seat + 12, 12, FLOOR - seat - 12); c.fillRect(x + 84, seat + 12, 12, FLOOR - seat - 12);
    fs(c, col); c.fillRect(x, seat, 102, 16); c.fillRect(x + 84, seat - 128, 14, 128); c.beginPath(); c.roundRect(x + 60, seat - 136, 44, 56, 12); c.fill();
  } else {                                                 // 圆凳
    const col = C('#2f3138');
    fs(c, mul(col, 1.5)); c.fillRect(x + 22, seat + 6, 10, FLOOR - seat - 6); c.fillRect(x + 70, seat + 6, 10, FLOOR - seat - 6); c.fillRect(x + 24, seat + 44, 54, 8);
    fs(c, C('#e0803a')); rr(c, x + 8, seat - 14, 86, 24, 12);
  }
}

const NS = { x: 978, y: 664, w: 84 };
function drawNightstand(c) {
  const { x, y, w } = NS, wood = C('#6f5340');
  fs(c, mul(wood, .7)); c.fillRect(x, y, w, FLOOR - y);
  fs(c, wood); c.fillRect(x - 6, y, w + 12, 12);
  fs(c, mul(wood, .9)); c.fillRect(x + 8, y + 24, w - 16, 32); c.fillRect(x + 8, y + 64, w - 16, 32);
  fs(c, C('#e9d9b8')); c.fillRect(x + w / 2 - 8, y + 36, 16, 7); c.fillRect(x + w / 2 - 8, y + 76, 16, 7);
}
const LAMP = { x: 1020, y: 664 };
function drawLamp(c, kind, on) {
  const { x, y } = LAMP;
  if (kind === 'bank') {                                   // 绿罩子的老式台灯
    fs(c, C('#c9a15a')); c.fillRect(x - 4, y - 62, 8, 62); c.fillRect(x - 22, y - 8, 44, 8);
    fs(c, mixc(C('#1f4a3a'), C('#5fd0a0'), on)); c.beginPath(); c.roundRect(x - 44, y - 92, 88, 34, [17, 17, 4, 4]); c.fill();
  } else if (kind === 'shroom') {                          // 蘑菇灯
    fs(c, C('#f1ede4')); rr(c, x - 12, y - 46, 24, 46, 8);
    fs(c, mixc(C('#8a5a3a'), C('#ffb46a'), on)); c.beginPath(); c.arc(x, y - 46, 40, Math.PI, 0); c.fill();
  } else if (kind === 'arm') {                             // 黑色摇臂灯
    fs(c, C('#2a2a30')); c.fillRect(x - 18, y - 8, 36, 8); c.save(); c.translate(x, y - 8); c.rotate(.35); c.fillRect(-4, -70, 8, 70); c.translate(0, -70); c.rotate(-1.1); c.fillRect(-4, -50, 8, 50); c.restore();
    fs(c, mixc(C('#2a2a30'), C('#ffe9b0'), on * .9)); poly(c, [x - 14, y - 112, x - 58, y - 104, x - 50, y - 80, x - 20, y - 92]);
  } else if (kind === 'globe') {                           // 白色球灯
    fs(c, C('#c9a15a')); c.fillRect(x - 4, y - 40, 8, 40); c.fillRect(x - 16, y - 8, 32, 8);
    fs(c, mixc(C('#8d8a85'), C('#fff6df'), on)); c.beginPath(); c.arc(x, y - 66, 30, 0, 7); c.fill();
  } else {                                                 // 米色锥形罩
    fs(c, C('#5a4a3e')); c.fillRect(x - 4, y - 50, 8, 50); c.fillRect(x - 16, y - 8, 32, 8);
    fs(c, mixc(C('#7a6a52'), C('#f6e0b0'), on)); poly(c, [x - 18, y - 104, x + 18, y - 104, x + 36, y - 50, x - 36, y - 50]);
  }
}

// 床在右边，床头靠右墙。铁架单人床 / 木头双人床
const BED = { top: 648 };
function bedGeo(kind) { return kind === 'double' ? { x0: 1070, x1: 1650, head: 470, col: C('#5a4030') } : { x0: 1100, x1: 1640, head: 520, col: C('#d9d4c8') }; }
function drawBed(c, kind, pillow) {
  const b = bedGeo(kind), top = BED.top;
  fs(c, [0, 0, 0], .28); c.beginPath(); c.ellipse((b.x0 + b.x1) / 2, FLOOR + 6, (b.x1 - b.x0) / 2 + 24, 12, 0, 0, 7); c.fill();
  if (kind === 'double') {
    fs(c, b.col); rr(c, b.x1 - 30, b.head, 30, FLOOR - b.head - 6, [10, 10, 0, 0]); fs(c, mul(b.col, 1.3)); rr(c, b.x1 - 26, b.head + 8, 22, 170, 6);
    fs(c, mul(b.col, .85)); c.fillRect(b.x0 + 10, top + 60, b.x1 - b.x0 - 30, 30); c.fillRect(b.x0 + 16, top + 86, 16, FLOOR - top - 86);
  } else {                                                 // 铁架床：竖栏杆的床头和床尾
    fs(c, b.col); for (let k = 0; k < 4; k++) c.fillRect(b.x1 - 12 - k * 0, b.head, 10, FLOOR - b.head - 4);
    c.fillRect(b.x1 - 12, b.head, 10, FLOOR - b.head - 4); c.beginPath(); c.arc(b.x1 - 7, b.head, 11, 0, 7); c.fill();
    c.fillRect(b.x0, top - 40, 10, FLOOR - top + 36); c.beginPath(); c.arc(b.x0 + 5, top - 40, 11, 0, 7); c.fill();
    c.fillRect(b.x0, top + 62, b.x1 - b.x0, 10);
  }
  fs(c, C('#e9e2d4')); rr(c, b.x0 + 12, top, b.x1 - b.x0 - 36, 64, 12);
  fs(c, [0, 0, 0], .12); c.fillRect(b.x0 + 12, top + 50, b.x1 - b.x0 - 36, 14);
  fs(c, pillow); rr(c, b.x1 - 190, top - 36, 150, 44, 18); if (kind === 'double') rr(c, b.x1 - 208, top - 60, 150, 44, 18);
}
function drawQuilt(c, kind, col) {
  const b = bedGeo(kind), top = BED.top - 12, xa = b.x0 + 4, xb = b.x1 - 210, bot = top + 104;
  fs(c, col); c.beginPath(); c.roundRect(xa, top, xb - xa, bot - top, [14, 14, 6, 6]); c.fill();
  fs(c, [0, 0, 0], .16); c.fillRect(xa, top + 30, xb - xa, bot - top - 30);
  fs(c, [255, 255, 255], .12); c.beginPath(); c.roundRect(xa, top, xb - xa, 12, [14, 14, 0, 0]); c.fill();
  fs(c, mixc(col, [255, 255, 255], .3)); for (let k = 0; k < 5; k++) for (let j = 0; j < 2; j++) c.fillRect(xa + 30 + k * ((xb - xa - 40) / 5) + j * 30, top + 44 + j * 28, 14, 14);   // 被面上的小方格
}

// ---------- 光 ----------
// L = {amb 环境亮度 0..1, tint 环境色, win 窗户光, lamp 台灯, spots [[x,y,r,强度,颜色]..], vig}
function roomLight(ctx, L) {
  L = L || {}; const amb = L.amb === undefined ? 1 : L.amb, tint = L.tint || [18, 24, 48];
  ctx.save();
  const m = ctx.getTransform(), gw = ctx.canvas.width, gh = ctx.canvas.height;
  ctx.setTransform(m); housePath(ctx, 30); ctx.clip();
  if (amb < 1) { ctx.globalCompositeOperation = 'multiply'; fs(ctx, mixc([255, 255, 255], tint, 1 - amb)); ctx.fillRect(-400, -300, W + 800, H + 600); }
  ctx.globalCompositeOperation = 'lighter';
  if (L.win) {                                           // 窗户照进来的一道光，落在地板上
    const { x, y, w, h } = WIN, a = L.win, col = L.winCol || [255, 236, 200];
    const gr = ctx.createLinearGradient(x, y, x + 520, FLOOR + 80); gr.addColorStop(0, css(col, a * .2)); gr.addColorStop(1, css(col, 0));
    ctx.fillStyle = gr; poly(ctx, [x, y, x + w, y, x + w + 560, HOUSE.base, x + 300, HOUSE.base]);
    fs(ctx, col, a * .26); poly(ctx, [x + 330, 790, x + 560, 790, x + 610, 832, x + 360, 832]); poly(ctx, [x + 590, 790, x + 800, 790, x + 860, 832, x + 640, 832]);
  }
  if (L.lamp) {
    const { x, y } = LAMP, r = 400, gr = ctx.createRadialGradient(x, y - 60, 10, x, y - 60, r), col = L.lampCol || [255, 190, 110];
    gr.addColorStop(0, css(col, .34 * L.lamp)); gr.addColorStop(.3, css(col, .13 * L.lamp)); gr.addColorStop(1, css(col, 0));
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - 60 - r, r * 2, r * 2);
  }
  for (const s of (L.spots || [])) {
    const [x, y, r, a, col] = s, gr = ctx.createRadialGradient(x, y, 0, x, y, r), cc = col || [255, 200, 110];
    gr.addColorStop(0, css(cc, a)); gr.addColorStop(.5, css(cc, a * .3)); gr.addColorStop(1, css(cc, 0));
    ctx.fillStyle = gr; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.globalCompositeOperation = 'source-over';
  if (L.vig) { ctx.setTransform(1, 0, 0, 1, 0, 0); const gr = ctx.createRadialGradient(gw / 2, gh * .48, gh * .3, gw / 2, gh * .5, gw * .62); gr.addColorStop(0, 'rgba(4,5,10,0)'); gr.addColorStop(1, `rgba(4,5,10,${L.vig})`); ctx.fillStyle = gr; ctx.fillRect(0, 0, gw, gh); }
  ctx.restore();
}
