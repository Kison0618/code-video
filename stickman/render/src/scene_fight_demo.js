// 打斗演示（SCENE=fight）：测试招式库和编排器；改招式先在这里看效果，再放进正片
// 按原片实测的"回合模板"排（研究/打斗拆解_数学.md G 节）：
//   对峙 16–24f → 快拍 ×3–6（每拍 5–9f）→ 停 7–10f → 快拍 ×2–3 → 对手反击 1 拍 → 打飞 / 倒地 → 起身 → 对峙
// 打中不停帧、不震屏：1 帧放射光 + 火花 + 结果字形淡出；镜头一个回合内固定，只有被打飞（位移大）时快速拉远
'use strict';
const K = require('./core');
const { W, H } = K;
const { Actor2, exchange, FightFX, drawWeapon } = require('./fight');
const { Director } = require('./director');

const HH = 300, F = 1 / 24;
const D = new Director(), clock = D.clock, cam = D.cam;
const hero = new Actor2({ H: HH, x0: -220, dir: 1, clock });
const foe = new Actor2({ H: HH, x0: 220, dir: -1, clock, color: [235, 235, 235] });
const fx = new FightFX(HH);
hero.move(0.2, 'guard_weapon'); foe.move(0.3, 'guard_weapon');
const beats = [];
let t = 1.0;
const beat = (a, move, b, react, frames, o = {}) => { beats.push({ t, a, move, b, react, ...o }); t += frames * F; };
const clash = (a, b) => (bb, tc) => bb.move(tc - 3 * F, 'parry');           // 兵器相碰：对方同时出一拍招架
// 回合一：主角先手，三下快拍都被挡 / 闪开（"差一点"比打中多）
beat(hero, 'thrust', foe, 'lean_dodge', 9);
beat(foe, 'slash', hero, 'duck', 8);
beat(hero, 'parry', foe, clash(), 7, { level: 'clash' });
beat(foe, 'parry', hero, clash(), 6, { level: 'clash' });
beat(hero, 'parry', foe, clash(), 9, { level: 'clash' });
t += 9 * F;                                                                   // 停 9f：对峙
// 第二串：主角连中两下（结果字形）
beat(hero, 'upswing', foe, 'stagger', 11, { glyph: '0' });
beat(hero, 'thrust', foe, 'stagger', 10, { glyph: '0' });
beat(hero, 'slash', foe, 'hurt_fold', 16, { glyph: '0' });
t += 18 * F;                                                                  // 停 18f：对手重整
// 对手一击定局：主角被打飞
beat(foe, 'thrust', hero, 'launched', 6, { level: 'heavy' });
const res = exchange(D, beats, fx);
const tFly = res[res.length - 1].tc;
const U = hero.getUp(tFly + 11 * F + 0.5, { from: 'back', speed: 1.6 });
hero.move(U.t, 'guard_weapon');
foe.move(tFly + 0.5, 'guard_weapon');
const ADUR = U.t + 1.4;
// 镜头：回合内固定全景框住两人；打飞时 8f 内快速拉远，之后推回
D.shot(0, 0.01, { on: [hero, foe], kind: 'full', fit: 0.55 });
D.shot(tFly, 8 * F, { on: [hero, foe, [hero.hipT.at(tFly)[0] - 2.4 * HH, -20]], kind: 'wide', fit: 0.7 }, 'out3');
D.shot(U.t - 0.3, 0.6, { on: [hero, foe], kind: 'full', fit: 0.55 });
D.finalize({ actors: [hero, foe], dur: ADUR, start: { x: 0, y: -330, z: 1 } });
const DUR = D.DUR;
function draw(ctx, tr) {
  const ta = clock.anim(tr), c = cam.at(tr);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  foe.draw(ctx, ta); drawWeapon(ctx, foe, ta, { len: 0.5, label: '-' });
  hero.draw(ctx, ta); drawWeapon(ctx, hero, ta, { len: 0.5, label: '+', color: '#ffe680' });
  fx.draw(ctx, ta);
  ctx.restore();
  const fl = fx.flashAt(ta);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }
module.exports = { DUR, draw, post, cam, hero, clock, codes: [], beats };
