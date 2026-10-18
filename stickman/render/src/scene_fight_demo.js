// 打斗演示（SCENE=fight）：测试招式库和编排器；改招式先在这里看效果，再放进正片
//   两个火柴人面对面，按"出招 → 对方反应 → 停顿"一拍一拍打；镜头全景框住两人，打中时推镜
'use strict';
const K = require('./core');
const { W, H } = K;
const { Actor2, exchange } = require('./fight');
const { Director } = require('./director');

const HH = 300;
const D = new Director(), clock = D.clock, cam = D.cam;
const hero = new Actor2({ H: HH, x0: -260, dir: 1, clock });
const foe = new Actor2({ H: HH, x0: 260, dir: -1, clock, color: [235, 235, 235] });
hero.move(0.2, 'guard'); foe.move(0.3, 'guard');
const beats = [];
let t = 1.0;
const beat = (a, move, b, react, dt, o = {}) => { beats.push({ t, a, move, b, react, ...o }); t += dt; };
beat(hero, 'step_in', null, null, 0.35);
beat(hero, 'jab', foe, 'hurt_high', 0.7);
beat(foe, 'cross', hero, 'block', 0.75);
beat(hero, 'front_kick', foe, 'dodge_back', 0.8);
beat(foe, 'step_in', null, null, 0.3);
beat(foe, 'lunge_punch', hero, 'knock_back', 1.1, { level: 'medium' });
beat(hero, 'step_in', null, null, 0.3);
beat(hero, 'step_in', null, null, 0.35);
beat(hero, 'jab', foe, 'hurt_high', 0.45);
beat(hero, 'cross', foe, 'hurt_high', 0.55);
beat(hero, 'uppercut', foe, 'launch_up', 1.4, { level: 'heavy' });
exchange(D, beats);
const TUP = beats[beats.length - 1].t;
foe.getUp(TUP + 1.3, { from: 'back' });
hero.move(TUP + 0.9, 'guard');
const ADUR = TUP + 3.4;
D.shot(0, 0.01, { on: [hero, foe], kind: 'full' });
D.track(0.5, ADUR, { on: [hero, foe], kind: 'full', fit: 0.6 }, 0.25);
D.finalize({ actors: [hero, foe], dur: ADUR, start: { x: 0, y: -330, z: 1 } });
const DUR = D.DUR;
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  foe.draw(ctx, ta); hero.draw(ctx, ta);
  D.imp.drawWorld(ctx, tr);
  ctx.restore();
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }
module.exports = { DUR, draw, post, cam, hero, clock, codes: [], beats };
