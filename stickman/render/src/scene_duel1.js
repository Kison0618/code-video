// 打斗试做 duel1（SCENE=duel1）：第 7 轮，按 动作设计.md 的七个问题自己设计的一段打斗，约 14 秒
// 设计稿（节拍表、每招的七个问题、镜头、声音、看片要看什么）：剧本/打斗试做_duel1.md
//
// 故事：强者几乎不动就化解了主角所有进攻，把他打飞；主角爬起来写了一行 sword.len *= 3，剑一帧变成三倍长，
//       一记弓步刺把强者打飞；得意地举剑庆祝，剑太重，自己往后倒——两个人都躺在地上。
// 出画：整段按 24fps 一拍一取样（人、镜头、特效、代码一起取整到 1/24 秒）。建议直接 FPS=24 渲，帧数只有 60fps 的 40%
'use strict';
const K = require('./core');
const { W, H } = K;
const { Actor2, exchange, FightFX, drawWeapon, weaponLine } = require('./fight');
const { Director } = require('./director');
const { Code } = require('./code');

const F = 1 / 24, at = f => f * F;                  // 帧号 → 秒（24fps，原片的帧率）
const HH = 300, HF = 330;                           // 主角、对手的身高（对手大一点）
const D = new Director(), clock = D.clock, cam = D.cam;
const hero = new Actor2({ H: HH, x0: -240, dir: 1, clock, noise: 0 });     // noise 0：原片定格一动不动
const foe = new Actor2({ H: HF, x0: 230, dir: -1, clock, noise: 0, color: [235, 235, 235] });
const fx = new FightFX(HH);
const SW = { hero: 0.4, foe: 0.5 };                 // 剑长（各自身高的倍数）；sword.len *= 3 之后主角是 1.2
const parry = name => (b, tc) => b.move(tc - F, name);                     // 强者只动手腕格挡，接触前 1 帧起手（来路不同，格挡的斜度不同）

// ① 对峙 f0–f24：两人都不动
hero.move(0, 'duel_guard_d'); foe.move(0, 'idle_guard_d');                // 主角用按黄色比例算的架势（fence_guard 是橙色比例，后脚够不着，胯会被压低）

// ② 第一串：主角四拍全被化解，间隔越来越短（接触 f28 / f37 / f44 / f50）；强者一点 → 主角后仰（反应第 1 级）
exchange(D, [
  { t: at(25), a: hero, move: 'lunge_d', b: foe, react: 'step_back_d', tip: SW.hero },           // 差一点：对手退半步
  { t: at(34), a: hero, move: 'cut_d', b: foe, react: parry('flick_parry_d'), level: 'clash', tip: SW.hero },
  { t: at(41), a: hero, move: 'rise_cut_d', b: foe, react: parry('flick_high_d'), level: 'clash', tip: SW.hero },
  { t: at(47), a: hero, move: 'cut_d', b: foe, react: parry('flick_parry_d'), level: 'clash', tip: SW.hero },
  { t: at(52), a: foe, move: 'tap_d', b: hero, react: 'flinch_d', tip: SW.foe },
], fx);

// ③ 停 18f。④ 第二串：主角气急一记双手重劈 → 劈空砸地；趁他弯着腰，强者一点 → 踉跄（反应第 2 级）
const s2 = exchange(D, [
  { t: at(72), a: hero, move: 'flail_d', b: foe, react: 'step_back_d', tip: SW.hero },
  { t: at(81), a: foe, move: 'tap_low_d', b: hero, react: 'bonk_back_d', tip: SW.foe },        // 点脑门
], fx);
fx.add(s2[0].tc, [s2[0].point[0] + 0.28 * HH, -4], 'clash');                 // 剑砸到地上：小火花 + 闷响
D.cue(s2[0].tc, 'thud', { v: 0.7 });
hero.move(at(96), 'duel_guard_d');

// ⑤ 停 14f → 主角再刺，被挡；强者第一次迈步，一记上挑把主角打飞（反应第 3 级；重击：白闪 1 帧，不停帧不震屏）
exchange(D, [{ t: at(110), a: hero, move: 'lunge_d', b: foe, react: parry('flick_low_d'), level: 'clash', tip: SW.hero, opts: { reach: 1.74 } }], fx);   // 碰剑要碰在身前：比闪开那一刺站远 0.3H
const s3 = exchange(D, [{ t: at(119), a: foe, move: 'upswing_d', b: hero, react: 'launched', level: 'heavy', tip: SW.foe }], fx);
const tFly = s3[0].tc, tLand = tFly + at(11);
D.cue(tLand, 'thud');

// ⑥ 躺着定 16f → 爬起来 → 低头看自己的短剑 → 抬头，代码一个字一个字出现 → 停 6f 让观众看清 → 运行 → 剑一帧变长
const U = hero.getUp(tLand + at(16), { from: 'back', speed: 1.6 });
hero.move(U.t, 'duel_guard_d');
const tLook = U.t + at(10);
hero.move(tLook, 'look_sword_d');
const tType = tLook + at(12), LINE = 'sword.len *= 3', CPS = 17;
const hx = hero.hipNow(tType)[0];
const code = new Code({ x: hx - 0.45 * HH, y: -1.45 * HH, size: 34, seed: 11, show: [tType - 0.05, 1e9] });
hero.head(tType - at(2), -24, 0.12, 'out');                                  // 抬头看代码
code.type(tType, LINE, CPS);
const tRun = tType + LINE.length / CPS + at(6);
code.run(tRun);
const tGrow = tRun + at(2);
hero.head(tGrow - at(2), 22, 0.06, 'out');                                    // 低头看剑
hero.move(tGrow, 'heft_d');                                                   // 重量把人往前拽一下
foe.move(tGrow + at(6), 'recoil_d');                                          // 强者第一次有反应（愣 6 帧才反应过来）：头一缩、剑举起来、重心放低
code.fadeOut(tGrow + 0.9);
D.cue(tGrow, 'release');

// ⑦ 端稳长剑往前逼（离得远就先迈步），一记弓步刺把强者打飞（重击 + 结果字形 ×3）
let t = tGrow + at(12);
hero.move(t, 'duel_guard_d'); t += at(12);
const FIN_REACH = 2.21;                                                       // 原来出手距离 1.0；剑长多了 0.8H
for (let n = 0; n < 4 && (foe.hipNow(t)[0] - hero.hipNow(t)[0]) / HH - FIN_REACH > 0.7; n++) { hero.move(t, 'fence_advance_d'); t += at(6); }
const s4 = exchange(D, [{ t: t + at(4), a: hero, move: 'lunge_fin_d', b: foe, react: 'launched', level: 'heavy', glyph: '×3', tip: 1.2, opts: { reach: FIN_REACH } }], fx);
const tWin = s4[0].tc;
D.cue(tWin + at(11), 'thud');

// ⑧ 弓步刺的姿势定 14f → 举剑庆祝（定 7f）→ 剑太重往后倒 → 两个人都躺着，定 27f（1.1 秒，笑点）
const tV = tWin + at(18);
hero.move(tV, 'victory_raise_d');
const tT = tV + at(12);
hero.move(tT, 'topple_back_d');
D.cue(tT + at(12), 'thud');
const ADUR = tT + at(16) + at(27) + 0.6;                                      // 最后 0.6 秒是淡出

// 镜头：回合内固定全景；被打飞时 8–10f 快速拉远；出新武器时推近；结尾慢慢拉开，两个人都躺着
const heroLen = ta => { const GROW = [1.42, 1.1, 1.28, 1.17, 1.22, 1.2]; const k = Math.floor((ta - tGrow) / F + 1e-6); return k < 0 ? SW.hero : GROW[Math.min(k, GROW.length - 1)]; };   // 1 帧到位，过冲衰减
const heroTip = ta => weaponLine(hero, ta, heroLen(ta))[1];
D.shot(0, 0.01, { on: [hero, foe], kind: 'full', fit: 0.55 });
D.shot(tFly, at(8), { on: [hero, foe, [hero.hipNow(tLand)[0] - 0.5 * HH, -20]], kind: 'wide', fit: 0.7 }, 'out3');
D.shot(tLook - 0.2, 0.5, { on: [hero, [hx - 0.5 * HH, -1.62 * HH], [hx + 0.4 * HH, -1.4 * HH]], fit: 0.62 });
D.shot(tGrow + at(1), at(4), { on: [hero, foe, heroTip], kind: 'full', fit: 0.6 });         // 剑变长的下一帧就拉开（4 帧），让观众看到强者的反应
D.shot(tWin, at(10), { on: [hero, foe, heroTip, [foe.hipNow(tWin + at(12))[0] + 0.4 * HF, -20]], kind: 'wide', fit: 0.72 }, 'out3');
D.shot(tV + at(2), 0.6, { on: [hero, [hero.hipNow(tV)[0], -1.8 * HH]], fit: 0.6 });
D.shot(tT + at(14), 0.9, { on: [hero, foe, heroTip], kind: 'wide', fit: 0.75 });
D.finalize({ actors: [hero, foe], dur: ADUR, start: { x: 0, y: -330, z: 1 } });
const DUR = D.DUR;

const OPT = { step: 24, smear: false, turn: 0.4 };
function draw(ctx, tr) {
  const tq = Math.floor(tr * 24 + 1e-6) / 24;                                 // 一拍一
  const ta = clock.anim(tq), c = cam.at(tq);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  code.draw(ctx, ta);
  foe.draw(ctx, ta, OPT); drawWeapon(ctx, foe, ta, { len: SW.foe });
  const grow = ta >= tGrow && ta < tGrow + F;                                  // 变长那一帧：白、粗
  hero.draw(ctx, ta, OPT); drawWeapon(ctx, hero, ta, { len: heroLen(ta), color: grow ? '#ffffff' : '#ffe680', width: grow ? 0.06 * HH : undefined });
  fx.draw(ctx, ta);
  ctx.restore();
  const fl = fx.flashAt(ta);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }
const weaponLen = (a, ta) => a === hero ? heroLen(ta) : a === foe ? SW.foe : 0;   // 给 tools/contact_check.js
module.exports = { DUR, draw, post, cam, hero, foe, clock, codes: [code], fights: D.fights, weaponLen, T: { tFly, tLand, tLook, tType, tRun, tGrow, tWin, tV, tT } };
