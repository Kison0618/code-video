// 把“房间 + 人 + 船 + 光”画成一个镜头。各个场景都用它，只是参数不同
'use strict';
// o = {S 房间状态, people [..每个人可带 layer:'bed'|'front'|'behind'], ships [{x,y,s,...,layer}], light, time, lampOn, extra(ctx, layer), after(ctx)}
function paintRoom(ctx, o) {
  drawRoom(ctx, o.S, (c, layer) => {
    for (const p of (o.people || [])) if ((p.layer || 'front') === layer) drawPerson(c, p);
    for (const sh of (o.ships || (o.ship ? [o.ship] : []))) if ((sh.layer || 'front') === layer) drawShip(c, sh.x, sh.y, sh.s || 1, sh);
    if (o.extra) o.extra(c, layer);
  }, o);
  roomLight(ctx, o.light);
  if (o.after) o.after(ctx);
}
// 船不在手里时放哪：矮柜顶上 / 窗台上 / 书桌上
const SHIP_SPOT = { shelf: [884, 620, .66], desk: [404, 668, .66] };
const shipAt = k => ({ x: SHIP_SPOT[k][0], y: SHIP_SPOT[k][1], s: SHIP_SPOT[k][2], layer: 'behind' });
// 默认的房间光：白天 / 夜里
const DAY = { amb: .94, tint: [70, 60, 60], win: .8, lamp: .3, vig: .3 };
const NIGHT = { amb: .34, tint: [26, 36, 78], win: .45, winCol: [150, 180, 255], lamp: 1, vig: .5 };
// 房间的标准机位：整座小屋刚好撑满画面，底下留给字幕
const ROOMCAM = { z: 1.13, x: 900, y: 490 };
const PS = 1.2;                                     // 屋里的人统一放大一点
