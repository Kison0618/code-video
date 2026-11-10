// 把“房间 + 人 + 船 + 光”画成一个镜头。各个场景都用它，只是参数不同
'use strict';
// o = {S 房间状态, people [..每个人可带 layer:'behind'|'bed'|'front'], ships [{x,y,s,...,layer, top:1 = 不受灰化影响}], light, time, lampOn,
//      grey 0..1 把屋里的一切褪成灰的（除了 top 的船）, extra(ctx, layer)}
function paintRoom(ctx, o) {
  const ships = o.ships || [];
  drawRoom(ctx, o.S, (c, layer) => {
    for (const p of (o.people || [])) if ((p.layer || 'front') === layer) drawPerson(c, p);
    for (const sh of ships) if (!sh.top && (sh.layer || 'front') === layer) drawShip(c, sh.x, sh.y, sh.s || 1, sh);
    if (o.extra) o.extra(c, layer);
  }, o);
  if (o.grey > 0) { ctx.save(); shOff(ctx); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = `rgba(128,128,128,${sat(o.grey)})`; ctx.fillRect(RX0, -900, RX1 - RX0, 2900); ctx.restore(); }
  roomLight(ctx, o.light);
  for (const sh of ships) if (sh.top) drawShip(ctx, sh.x, sh.y, sh.s || 1, sh);
}
const shipAt = k => ({ x: SILL[0], y: SILL[1], s: .62, layer: 'sill' });      // 船不在手里时，放在窗台上
const DAY = { amb: 1, win: .8, lamp: .3 };
const NIGHT = { amb: .4, tint: [26, 36, 84], win: .5, winCol: [150, 180, 255], lamp: 1 };
const ROOMCAM = { z: 1, x: 960, y: 540 };
const PS = 1.3;                                      // 屋里的人统一的大小
