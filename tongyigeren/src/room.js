// 房间：一面墙、一条地板，每样东西是一张带投影的彩纸。从左到右：窗和窗帘、椅子、墙上的画、小搁板（玩偶）、床头柜（台灯）、床
// 每样东西都能单独换：款式、颜色都是参数
'use strict';
const FLOOR = 770;                                   // 墙和地板的交界
const RX0 = -900, RX1 = W + 900;                     // 墙和地板画得比画面宽，镜头移动时不露底

// ---------- 每个年代的房间 ----------
// 十二样“原来的东西”：墙 窗帘 被子 地毯 画 台灯 椅子 玩偶 衣服（在人身上）床 + 船
const ERA = {
  // 你点开的时候
  v0: { wall: C('#7fb0b6'), curtain: C('#e2a63c'), quilt: C('#c8563e'), rug: C('#efe2c6'), art: 'light', lamp: 'bank', chair: 'wood', toy: 'bear', bed: 'single', sky: 'day' },
  // 三十秒以后（九样东西已经换完）
  v1: { wall: C('#e3b48c'), curtain: C('#4c8b69'), quilt: C('#35518c'), rug: C('#c66f4b'), art: 'peak', lamp: 'shroom', chair: 'stool', toy: 'robot', bed: 'single', sky: 'day' },
  // 十七岁：画换成乐队海报，被子、台灯换了，玩偶没了
  v17: { wall: C('#e3b48c'), curtain: C('#4c8b69'), quilt: C('#3d3b4c'), rug: C('#c66f4b'), art: 'band', lamp: 'arm', chair: 'stool', toy: 'none', bed: 'single', sky: 'dusk' },
  // 二十七岁：床换成双人床，地毯、窗帘换了
  v27: { wall: C('#e3b48c'), curtain: C('#f0e7d3'), quilt: C('#efe6d4'), rug: C('#3e5f8f'), art: 'abstract', lamp: 'globe', chair: 'stool', toy: 'plant', bed: 'double', sky: 'day' },
  // 三十七岁：墙刷了，椅子的位置放了小床
  v37: { wall: C('#a9bad8'), curtain: C('#f0e7d3'), quilt: C('#e1b55c'), rug: C('#3e5f8f'), art: 'kid', lamp: 'globe', chair: 'crib', toy: 'plant', bed: 'double', sky: 'day' },
  // 五十七岁：小床没了，换成扶手椅，墙刷过三遍
  v57: { wall: C('#d9cdb6'), curtain: C('#8d7094'), quilt: C('#7fa49c'), rug: C('#5b6688'), art: 'photo', lamp: 'cone', chair: 'armchair', toy: 'clock', bed: 'double', sky: 'day' },
  // 七十七岁
  v77: { wall: C('#d9cdb6'), curtain: C('#8d7094'), quilt: C('#7fa49c'), rug: C('#5b6688'), art: 'photo', lamp: 'cone', chair: 'armchair', toy: 'clock', bed: 'double', sky: 'grey' },
};
const era = (base, o) => Object.assign({}, base, o);
ERA.v17a = era(ERA.v17, { art: 'peak' });                                        // 十七岁，画还没换
ERA.v27a = era(ERA.v27, { bed: 'single', quilt: ERA.v17.quilt });                // 二十七岁，床还没换
ERA.v37a = era(ERA.v37, { chair: 'stool' });                                     // 三十七岁，小床还没来
ERA.v57a = era(ERA.v57, { wall: ERA.v37.wall, chair: 'crib' });                  // 五十七岁那一下之前
ERA.v57b = era(ERA.v57, { wall: C('#dba79d') });                                 // 墙刷第一遍
ERA.v57c = era(ERA.v57, { wall: C('#a8c3a4') });                                 // 墙刷第二遍
ERA.night = era(ERA.v1, { sky: 'night' });                                       // 记词的那个晚上

// 从年代 a 换到年代 b。k 是一个数，或者 {wall:.., curtain:.., ...}（每样东西各自的进度）
// mode = 'fade'：颜色直接渐变、款式慢慢渗过去（偷偷换）；'flip'：每样东西翻面 / 弹出（明着换）
function blendEra(a, b, k, mode) {
  const kk = key => typeof k === 'number' ? k : (k[key] === undefined ? (k._ || 0) : k[key]), o = {};
  for (const key of Object.keys(a)) {
    const va = a[key], vb = b[key] === undefined ? va : b[key], q = kk(key), isCol = Array.isArray(va);
    const same = isCol ? (va[0] === vb[0] && va[1] === vb[1] && va[2] === vb[2]) : va === vb;
    if (same || q <= 0) o[key] = va; else if (q >= 1) o[key] = vb;
    else if (isCol && mode !== 'flip') o[key] = mixc(va, vb, q);
    else o[key] = { __x: 1, a: va, b: vb, k: q, mode: mode === 'flip' ? 'flip' : 'fade' };
  }
  return o;
}

// 每样东西“换”的方式和支点
const SWAP = {
  wall: { mode: 'wipe' }, curtain: { mode: 'roll', y: 126 }, quilt: { mode: 'flipY', y: 690 }, rug: { mode: 'flipY', y: 852 },
  art: { mode: 'flipX', x: 755 }, lamp: { mode: 'pop', x: 1110, y: 640 }, chair: { mode: 'pop', x: 620, y: 770 }, toy: { mode: 'pop', x: 1000, y: 404 },
  bed: { mode: 'pop', x: 1520, y: 770 }, sky: { mode: 'fade' },
};

// ---------- 画 ----------
// actors(ctx, layer)：layer = 'behind'（家具前、被子后）/ 'bed'（被子前）/ 'front'（最前面）
function drawRoom(ctx, S, actors, o) {
  o = o || {};
  const it = (key, fn) => swap(ctx, S[key], SWAP[key], fn);
  it('wall', drawWall);
  drawFloor(ctx, o.floor);
  it('rug', drawRug);
  it('sky', (c, sky) => drawWindow(c, sky, o.time || 0));
  if (actors) actors(ctx, 'sill');
  it('curtain', drawCurtain);
  it('art', drawArt);
  drawShelf(ctx);
  it('toy', drawToy);
  it('chair', drawChair);
  drawNightstand(ctx);
  it('lamp', (c, kind) => drawLamp(c, kind, o.lampOn === undefined ? 1 : o.lampOn));
  it('bed', drawBed);
  if (actors) actors(ctx, 'behind');
  swap(ctx, S.quilt, SWAP.quilt, (c, col) => drawQuilt(c, col, S.bed && S.bed.__x ? (S.bed.k < .5 ? S.bed.a : S.bed.b) : S.bed));
  if (actors) actors(ctx, 'bed');
  if (actors) actors(ctx, 'front');
}

function drawWall(c, col) {
  shOff(c); fs(c, col); c.fillRect(RX0, -900, RX1 - RX0, FLOOR + 900);
  let g = c.createLinearGradient(0, -100, 0, FLOOR); g.addColorStop(0, 'rgba(30,18,10,.24)'); g.addColorStop(.5, 'rgba(30,18,10,.04)'); g.addColorStop(1, 'rgba(255,240,220,.05)');
  c.fillStyle = g; c.fillRect(RX0, -900, RX1 - RX0, FLOOR + 900);
  fs(c, lite(col, .5)); c.fillRect(RX0, FLOOR - 30, RX1 - RX0, 30);                  // 踢脚线
  fs(c, dark(col, .3)); c.fillRect(RX0, FLOOR - 34, RX1 - RX0, 4);
}
function drawFloor(c, col) {
  col = col || C('#8a5d3d'); shOff(c);
  const g = c.createLinearGradient(0, FLOOR, 0, H + 60); g.addColorStop(0, css(dark(col, .18))); g.addColorStop(.12, css(col)); g.addColorStop(1, css(dark(col, .5)));
  c.fillStyle = g; c.fillRect(RX0, FLOOR, RX1 - RX0, H - FLOOR + 900);
  fs(c, [30, 18, 10], .16); for (const y of [808, 862, 934, 1030]) c.fillRect(RX0, y, RX1 - RX0, 3);
  for (let k = 0; k < 9; k++) { const y0 = [770, 808, 862, 934][k % 4], y1 = [808, 862, 934, 1030][k % 4]; c.fillRect(140 + k * 233 + (k % 4) * 57, y0, 3, y1 - y0); }
}
const RUG = { x: 900, y: 852, rx: 430, ry: 66 };
function drawRug(c, col) {
  const { x, y, rx, ry } = RUG;
  shOn(c, .6); fs(c, col); c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); shOff(c);
  c.strokeStyle = css(lite(col, .34)); c.lineWidth = 10; c.beginPath(); c.ellipse(x, y, rx - 34, ry - 12, 0, 0, 7); c.stroke();
  c.strokeStyle = css(dark(col, .2)); c.lineWidth = 5; c.beginPath(); c.ellipse(x, y, rx - 78, ry - 26, 0, 0, 7); c.stroke();
}

const WIN = { x: 170, y: 180, w: 320, h: 350 };
function drawWindow(c, sky) {
  const { x, y, w, h } = WIN;
  shOn(c); fs(c, C('#f6efe1')); rr(c, x - 20, y - 20, w + 40, h + 40, 10); shOff(c);
  let top, bot, far, near;
  if (sky === 'night') { top = C('#101a3c'); bot = C('#2e4374'); far = C('#17283c'); near = C('#0e1a28'); }
  else if (sky === 'dusk') { top = C('#585d9e'); bot = C('#f5aa76'); far = C('#6a4f78'); near = C('#3f3458'); }
  else if (sky === 'grey') { top = C('#b3bdc8'); bot = C('#e4e6e3'); far = C('#93a39a'); near = C('#76897e'); }
  else { top = C('#8cc8ec'); bot = C('#e0f1f0'); far = C('#93c58c'); near = C('#5f9f6c'); }
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, css(top)); g.addColorStop(1, css(bot)); c.fillStyle = g; c.fillRect(x, y, w, h);
  if (sky === 'night') { fs(c, [255, 255, 255], .85); for (let k = 0; k < 9; k++) circ(c, x + 20 + hash(k * 3 + 1) * (w - 40), y + 16 + hash(k * 3 + 2) * h * .45, 2.2 + hash(k) * 2); fs(c, C('#fbf3d2')); circ(c, x + w * .7, y + 86, 34); fs(c, top); circ(c, x + w * .7 - 16, y + 76, 30); }
  else if (sky === 'dusk') { fs(c, C('#ffdca6')); circ(c, x + w * .3, y + h * .62, 36); }
  else if (sky === 'day') { fs(c, [255, 255, 255], .95); rr(c, x + 40, y + 70, 120, 34, 17); rr(c, x + 78, y + 50, 70, 40, 20); rr(c, x + 196, y + 128, 90, 26, 13); }
  shOn(c, .5); fs(c, far); c.beginPath(); c.moveTo(x - 20, y + h + 10); c.quadraticCurveTo(x + w * .28, y + h * .42, x + w * .7, y + h + 10); c.fill();
  fs(c, near); c.beginPath(); c.moveTo(x + w * .2, y + h + 10); c.quadraticCurveTo(x + w * .8, y + h * .5, x + w + 80, y + h + 10); c.fill(); shOff(c);
  const ig = c.createLinearGradient(0, y, 0, y + 46); ig.addColorStop(0, 'rgba(20,14,10,.22)'); ig.addColorStop(1, 'rgba(20,14,10,0)'); c.fillStyle = ig; c.fillRect(x, y, w, 46);
  c.restore();
  fs(c, C('#f6efe1')); c.fillRect(x + w / 2 - 7, y, 14, h); c.fillRect(x, y + h * .46 - 7, w, 14);
  shOn(c, .7); fs(c, C('#fbf6ea')); rr(c, x - 38, y + h + 16, w + 76, 22, 6); shOff(c);
}
const SILL = [WIN.x + WIN.w - 84, WIN.y + WIN.h + 16];          // 窗台上放船的位置
function drawCurtain(c, col) {
  const { x, y, w, h } = WIN, top = y - 50, bot = y + h + 96;
  c.strokeStyle = '#3a2a22'; c.lineWidth = 9; c.lineCap = 'round'; shOn(c, .5); c.beginPath(); c.moveTo(x - 84, top - 4); c.lineTo(x + w + 84, top - 4); c.stroke(); shOff(c);
  for (const [cx, cw] of [[x - 76, 108], [x + w - 32, 108]]) {
    shOn(c); fs(c, col); c.beginPath(); c.moveTo(cx, top); c.lineTo(cx + cw, top); c.lineTo(cx + cw, bot - 8);
    for (let k = 0; k < 4; k++) c.quadraticCurveTo(cx + cw - (k + .5) * cw / 4, bot + 12, cx + cw - (k + 1) * cw / 4, bot - 8);
    c.closePath(); c.fill(); shOff(c);
    for (let k = 0; k < 4; k++) { fs(c, k % 2 ? [255, 255, 255] : [20, 12, 8], k % 2 ? .13 : .13); c.fillRect(cx + 5 + k * 27, top + 6, 13, bot - top - 20); }
    fs(c, dark(col, .25)); for (let k = 0; k < 5; k++) circ(c, cx + 10 + k * 22, top - 4, 6);
  }
}

const ART = { x: 640, y: 150, w: 230, h: 178 };
function drawArt(c, kind) {
  const { x, y, w, h } = ART; if (kind === 'none') return;
  const poster = kind === 'band', frame = poster ? C('#1f1e24') : kind === 'photo' ? C('#3a2c24') : kind === 'kid' ? C('#f2c84b') : C('#f6efe1');
  shOn(c); fs(c, frame); rr(c, x - 16, y - 16, w + 32, h + 32, poster ? 2 : 6); shOff(c);
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  if (kind === 'light') {                                   // 灯塔
    fs(c, C('#f3dcae')); c.fillRect(x, y, w, h);
    fs(c, C('#fff3cf')); circ(c, x + 62, y + 54, 26);
    fs(c, C('#2f7390')); c.fillRect(x, y + h * .72, w, h * .3); fs(c, C('#3f8aa8')); c.fillRect(x, y + h * .72, w, 8);
    fs(c, C('#8a6a4a')); c.beginPath(); c.moveTo(x + 96, y + h * .76); c.quadraticCurveTo(x + 160, y + h * .56, x + 222, y + h * .76); c.fill();
    fs(c, C('#f7f3ea')); poly(c, [x + 138, y + 44, x + 168, y + 44, x + 176, y + h * .7, x + 130, y + h * .7]);
    fs(c, C('#c8473b')); c.fillRect(x + 135, y + 66, 36, 15); c.fillRect(x + 132, y + 98, 42, 15);
    fs(c, C('#3a2f2a')); rr(c, x + 134, y + 24, 38, 22, 4); fs(c, C('#ffe9a0')); c.fillRect(x + 144, y + 30, 18, 12);
  } else if (kind === 'peak') {                             // 雪山和月亮
    fs(c, C('#3b406e')); c.fillRect(x, y, w, h);
    fs(c, C('#f3ebc8')); circ(c, x + 176, y + 46, 20);
    fs(c, C('#8b90ba')); poly(c, [x - 10, y + h, x + 84, y + 50, x + 170, y + h]);
    fs(c, C('#6c72a4')); poly(c, [x + 80, y + h, x + 160, y + 82, x + w + 10, y + h]);
    fs(c, C('#f5f5fa')); poly(c, [x + 84, y + 50, x + 108, y + 90, x + 90, y + 82, x + 76, y + 94, x + 62, y + 84]);
  } else if (kind === 'band') {                             // 乐队海报
    fs(c, C('#18171d')); c.fillRect(x, y, w, h);
    fs(c, C('#e9d24a')); for (let k = 0; k < 5; k++) { const hh = [44, 84, 60, 100, 52][k]; rr(c, x + 30 + k * 36, y + h * .72 - hh, 24, hh, 4); }
    fs(c, C('#e23c6c')); rr(c, x + 22, y + h * .8, w - 44, 12, 6);
  } else if (kind === 'abstract') {
    fs(c, C('#f5f0e4')); c.fillRect(x, y, w, h);
    fs(c, C('#2f706b')); rr(c, x + 34, y + 26, 70, 126, 6); fs(c, C('#e1613f')); circ(c, x + 156, y + 72, 42); fs(c, C('#eab44b')); rr(c, x + 120, y + 126, 80, 22, 11);
  } else if (kind === 'kid') {                              // 孩子画的一家三口
    fs(c, C('#fbf8f1')); c.fillRect(x, y, w, h);
    const cols = ['#3d7bd0', '#e2553f', '#3aa56a'];
    for (let k = 0; k < 3; k++) { fs(c, C(cols[k])); const px = x + 66 + k * 52, s = k === 2 ? .64 : 1, by = y + h * .86; circ(c, px, by - 82 * s, 15 * s); poly(c, [px, by - 70 * s, px - 22 * s, by, px + 22 * s, by]); }
    fs(c, C('#f2b632')); circ(c, x + 34, y + 34, 18);
  } else if (kind === 'photo') {                            // 旧合影
    fs(c, C('#e3d9c6')); c.fillRect(x, y, w, h);
    fs(c, C('#6a5a4c')); for (let k = 0; k < 3; k++) { const hh = [92, 104, 64][k], px = x + 66 + k * 50; rr(c, px - 20, y + h - hh, 40, hh, 14); circ(c, px, y + h - hh - 14, 17); }
  }
  c.restore();
}
// 墙上的小搁板和上面的玩偶
const SHELF = { x: 920, y: 404, w: 160 };
function drawShelf(c) { shOn(c, .7); fs(c, C('#f6efe1')); rr(c, SHELF.x, SHELF.y, SHELF.w, 16, 4); shOff(c); fs(c, C('#d9cfbb')); poly(c, [SHELF.x + 20, SHELF.y + 16, SHELF.x + 44, SHELF.y + 16, SHELF.x + 20, SHELF.y + 44]); poly(c, [SHELF.x + SHELF.w - 20, SHELF.y + 16, SHELF.x + SHELF.w - 44, SHELF.y + 16, SHELF.x + SHELF.w - 20, SHELF.y + 44]); }
function drawToy(c, kind) {
  const x = SHELF.x + SHELF.w / 2, y = SHELF.y;
  if (kind === 'none') return;
  if (kind === 'plant') { shOn(c, .7); fs(c, C('#cf7b50')); poly(c, [x - 30, y - 46, x + 30, y - 46, x + 22, y, x - 22, y]); fs(c, C('#3f8c5c')); for (const [dx, dy, r] of [[0, -92, 30], [-28, -70, 23], [28, -72, 23], [-10, -122, 20], [16, -118, 18]]) circ(c, x + dx, y + dy, r); shOff(c); return; }
  if (kind === 'clock') { shOn(c, .7); fs(c, C('#c9a25a')); rr(c, x - 46, y - 96, 92, 96, 16); shOff(c); fs(c, C('#f6f1e4')); circ(c, x, y - 52, 30); c.strokeStyle = '#2a2320'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x, y - 52); c.lineTo(x, y - 72); c.moveTo(x, y - 52); c.lineTo(x + 14, y - 46); c.stroke(); return; }
  if (kind === 'robot') {
    shOn(c, .7); fs(c, C('#9fb1bc')); rr(c, x - 5, y - 134, 10, 24, 4); fs(c, C('#e2553f')); circ(c, x, y - 138, 10);
    fs(c, C('#c6d0d6')); rr(c, x - 38, y - 114, 76, 56, 12); fs(c, C('#a5b6c0')); rr(c, x - 30, y - 56, 60, 44, 8); rr(c, x - 48, y - 52, 14, 34, 7); rr(c, x + 34, y - 52, 14, 34, 7); rr(c, x - 24, y - 14, 18, 14, 4); rr(c, x + 6, y - 14, 18, 14, 4); shOff(c);
    fs(c, C('#2a3a4a')); rr(c, x - 28, y - 100, 56, 24, 8); fs(c, C('#7fe3d2')); circ(c, x - 13, y - 88, 7); circ(c, x + 13, y - 88, 7); fs(c, C('#e9b432')); rr(c, x - 13, y - 44, 26, 13, 4);
    return;
  }
  const col = C('#a8733f'), dk = dark(col, .2);                                                  // 小熊
  shOn(c, .7); fs(c, dk); circ(c, x - 28, y - 118, 15); circ(c, x + 28, y - 118, 15); rr(c, x - 44, y - 62, 20, 40, 10); rr(c, x + 24, y - 62, 20, 40, 10); rr(c, x - 38, y - 28, 28, 28, 12); rr(c, x + 10, y - 28, 28, 28, 12);
  fs(c, col); rr(c, x - 30, y - 72, 60, 68, 26); circ(c, x, y - 96, 35); shOff(c);
  fs(c, C('#ecd3ab')); c.beginPath(); c.ellipse(x, y - 87, 17, 13, 0, 0, 7); c.fill(); circ(c, x, y - 40, 15);
  fs(c, C('#2a1e18')); circ(c, x - 14, y - 104, 4.5); circ(c, x + 14, y - 104, 4.5); c.beginPath(); c.ellipse(x, y - 92, 6, 4.5, 0, 0, 7); c.fill();
}

// 椅子的位置：木椅子 / 圆凳 / 小床 / 扶手椅
const CHAIR = { x: 620, seat: 648 };
function drawChair(c, kind) {
  const x = CHAIR.x, seat = CHAIR.seat; if (kind === 'none') return;
  if (kind === 'crib') {
    const x0 = x - 130, w = 260, y = 560, col = C('#f7f2e8');
    shOn(c); fs(c, col); rr(c, x0, y, 18, FLOOR - y, 6); rr(c, x0 + w - 18, y, 18, FLOOR - y, 6); rr(c, x0, y, w, 16, 8); shOff(c);
    fs(c, C('#dfeaf4')); rr(c, x0 + 14, y + 96, w - 28, 60, 8); fs(c, C('#f6c5bd')); rr(c, x0 + 34, y + 76, 84, 36, 16);
    fs(c, col); for (let k = 1; k < 10; k++) rr(c, x0 + k * (w / 10) - 4, y + 12, 8, 140, 4); rr(c, x0, y + 146, w, 18, 6);
    return;
  }
  if (kind === 'armchair') {
    const col = C('#b45f3e'), x0 = x - 130, y = 556;
    shOn(c); fs(c, dark(col, .16)); rr(c, x0 + 22, y, 216, 190, 46); shOff(c);
    fs(c, col); rr(c, x0 + 38, y + 16, 184, 150, 34); shOn(c, .5); fs(c, lite(col, .1)); rr(c, x0 + 30, y + 118, 200, 60, 20);
    fs(c, dark(col, .08)); rr(c, x0, y + 82, 58, 126, 26); rr(c, x0 + 202, y + 82, 58, 126, 26); shOff(c);
    fs(c, C('#3a2a1e')); rr(c, x0 + 16, FLOOR - 12, 18, 12, 3); rr(c, x0 + 226, FLOOR - 12, 18, 12, 3);
    return;
  }
  if (kind === 'stool') {
    const leg = C('#e9dfcb');
    c.strokeStyle = css(leg); c.lineWidth = 11; c.lineCap = 'round'; shOn(c, .6); c.beginPath(); c.moveTo(x - 34, seat + 14); c.lineTo(x - 50, FLOOR - 6); c.moveTo(x + 34, seat + 14); c.lineTo(x + 50, FLOOR - 6); c.moveTo(x - 42, seat + 70); c.lineTo(x + 42, seat + 70); c.stroke();
    fs(c, C('#2f7f7a')); rr(c, x - 60, seat - 12, 120, 30, 15); shOff(c); fs(c, [255, 255, 255], .16); rr(c, x - 52, seat - 8, 104, 8, 4);
    return;
  }
  const col = C('#b9824e'), dk = dark(col, .22);                                                 // 木椅子
  shOn(c, .7); fs(c, dk); rr(c, x - 52, seat - 150, 14, 150, 6); rr(c, x + 38, seat - 150, 14, 150, 6); rr(c, x - 50, seat + 14, 13, FLOOR - seat - 14, 5); rr(c, x + 37, seat + 14, 13, FLOOR - seat - 14, 5);
  fs(c, col); rr(c, x - 52, seat - 154, 104, 30, 10); rr(c, x - 52, seat - 104, 104, 20, 8); rr(c, x - 52, seat - 60, 104, 16, 8); rr(c, x - 62, seat, 124, 20, 8); shOff(c);
}
const NS = { x: 1060, y: 640, w: 100 };
function drawNightstand(c) {
  const { x, y, w } = NS, wood = C('#7a5a43');
  shOn(c); fs(c, wood); rr(c, x, y + 8, w, FLOOR - y - 8, 6); fs(c, lite(wood, .14)); rr(c, x - 8, y, w + 16, 16, 6); shOff(c);
  fs(c, dark(wood, .2)); rr(c, x + 12, y + 30, w - 24, 38, 6); rr(c, x + 12, y + 78, w - 24, 38, 6);
  fs(c, C('#ecdcb9')); circ(c, x + w / 2, y + 49, 6); circ(c, x + w / 2, y + 97, 6);
}
const LAMP = { x: 1110, y: 640 };
function drawLamp(c, kind, on) {
  const { x, y } = LAMP;
  if (kind === 'bank') {                                   // 绿罩子的老台灯
    shOn(c, .7); fs(c, C('#c9a25a')); rr(c, x - 4, y - 70, 8, 70, 4); rr(c, x - 26, y - 10, 52, 10, 5);
    fs(c, mixc(C('#1f4d3c'), C('#58cfa0'), on)); c.beginPath(); c.roundRect(x - 52, y - 104, 104, 40, [20, 20, 6, 6]); c.fill(); shOff(c);
  } else if (kind === 'shroom') {                          // 蘑菇灯
    shOn(c, .7); fs(c, C('#f7f2e8')); rr(c, x - 14, y - 52, 28, 52, 10);
    fs(c, mixc(C('#8a583a'), C('#ffae5e'), on)); c.beginPath(); c.arc(x, y - 50, 48, Math.PI, 0); c.closePath(); c.fill(); shOff(c);
    fs(c, [255, 255, 255], .5 * on); circ(c, x - 20, y - 74, 7); circ(c, x + 12, y - 82, 5);
  } else if (kind === 'arm') {                             // 黑色摇臂灯
    c.strokeStyle = '#2a2a30'; c.lineWidth = 8; c.lineCap = 'round'; shOn(c, .7); c.beginPath(); c.moveTo(x, y - 8); c.lineTo(x + 26, y - 74); c.lineTo(x - 22, y - 116); c.stroke();
    fs(c, C('#2a2a30')); rr(c, x - 22, y - 10, 44, 10, 5); fs(c, mixc(C('#2a2a30'), C('#ffe7ae'), on * .9)); poly(c, [x - 16, y - 134, x - 64, y - 122, x - 54, y - 92, x - 20, y - 104]); shOff(c);
  } else if (kind === 'globe') {                           // 白色球灯
    shOn(c, .7); fs(c, C('#c9a25a')); rr(c, x - 4, y - 44, 8, 44, 4); rr(c, x - 20, y - 10, 40, 10, 5); fs(c, mixc(C('#8f8c86'), C('#fff5dc'), on)); circ(c, x, y - 76, 36); shOff(c);
  } else {                                                 // 米色锥形罩
    shOn(c, .7); fs(c, C('#5a4a3e')); rr(c, x - 4, y - 56, 8, 56, 4); rr(c, x - 20, y - 10, 40, 10, 5); fs(c, mixc(C('#7c6c54'), C('#f7e2b2'), on)); poly(c, [x - 22, y - 116, x + 22, y - 116, x + 42, y - 54, x - 42, y - 54]); shOff(c);
  }
}

// 床在右边，床头靠右。单人木床 / 深色双人床
const BED = { top: 640 };
function bedGeo(kind) { return kind === 'double' ? { x0: 1184, x1: 1850, head: 430, col: C('#5b3d2c'), pillows: 2 } : { x0: 1214, x1: 1840, head: 500, col: C('#dba466'), pillows: 1 }; }
function drawBed(c, kind) {
  const b = bedGeo(kind), top = BED.top;
  shOn(c); fs(c, b.col); rr(c, b.x1 - 34, b.head, 34, FLOOR - b.head, [16, 16, 4, 4]); shOff(c);
  if (kind === 'double') { fs(c, lite(b.col, .16)); rr(c, b.x1 - 28, b.head + 10, 22, 190, 8); } else { fs(c, dark(b.col, .14)); circ(c, b.x1 - 17, b.head + 26, 8); }
  shOn(c, .7); fs(c, dark(b.col, .12)); rr(c, b.x0 + 8, top + 58, b.x1 - b.x0 - 30, 34, 8); rr(c, b.x0 + 14, top + 86, 18, FLOOR - top - 86, 5);
  fs(c, C('#f1ebde')); rr(c, b.x0, top, b.x1 - b.x0 - 30, 66, 16); shOff(c);
  shOn(c, .5); fs(c, C('#fbf7ee')); rr(c, b.x1 - 208, top - 40, 166, 50, 22); if (b.pillows > 1) rr(c, b.x1 - 226, top - 70, 166, 50, 22); shOff(c);
}
function drawQuilt(c, col, kind) {
  const b = bedGeo(kind), top = BED.top - 14, xa = b.x0 - 8, xb = b.x1 - 226, bot = top + 112;
  shOn(c, .7); fs(c, col); c.beginPath(); c.roundRect(xa, top, xb - xa, bot - top, [18, 18, 10, 10]); c.fill(); shOff(c);
  fs(c, lite(col, .28)); c.beginPath(); c.roundRect(xb - 46, top, 46, bot - top, [0, 18, 10, 0]); c.fill();                      // 翻过来的被头
  fs(c, dark(col, .16)); c.fillRect(xa, top + 34, xb - xa - 46, 5);
  fs(c, lite(col, .2)); for (let k = 0; k < 6; k++) for (let j = 0; j < 2; j++) circ(c, xa + 44 + k * ((xb - xa - 110) / 5) + j * 22, top + 62 + j * 26, 6);
}

// ---------- 光 ----------
// L = {amb 环境亮度 0..1, tint 环境色, win 窗户光, lamp 台灯, spots [[x,y,r,强度,颜色]..]}
function roomLight(ctx, L) {
  L = L || {}; const amb = L.amb === undefined ? 1 : L.amb, tint = L.tint || [28, 34, 70];
  ctx.save(); shOff(ctx);
  if (amb < 1) { ctx.globalCompositeOperation = 'multiply'; fs(ctx, mixc([255, 255, 255], tint, 1 - amb)); ctx.fillRect(RX0, -900, RX1 - RX0, 2900); }
  ctx.globalCompositeOperation = 'lighter';
  if (L.win) {                                           // 窗户照进来的光
    const { x, y, w, h } = WIN, a = L.win, col = L.winCol || [255, 232, 190];
    const g = ctx.createLinearGradient(x, y, x + 760, 980); g.addColorStop(0, css(col, a * .1)); g.addColorStop(.6, css(col, a * .05)); g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g; ctx.filter = 'blur(14px)'; poly(ctx, [x, y, x + w, y, x + w + 820, 1000, x + 330, 1000]); ctx.filter = 'none';
  }
  if (L.lamp) {
    const { x, y } = LAMP, r = 430, g = ctx.createRadialGradient(x, y - 70, 10, x, y - 70, r), col = L.lampCol || [255, 186, 104];
    g.addColorStop(0, css(col, .36 * L.lamp)); g.addColorStop(.3, css(col, .13 * L.lamp)); g.addColorStop(1, css(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - 70 - r, r * 2, r * 2);
  }
  for (const s of (L.spots || [])) {
    const [x, y, r, a, col] = s, g = ctx.createRadialGradient(x, y, 0, x, y, r), cc = col || [255, 200, 110];
    g.addColorStop(0, css(cc, a)); g.addColorStop(.5, css(cc, a * .3)); g.addColorStop(1, css(cc, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  ctx.restore();
}
