// 打斗试做 duel2（SCENE=duel2）：第 8 轮，按用户对 duel1 的意见重做——动漫刀剑打斗，不是击剑；打起来中间不停
// 设计稿（为什么 duel1 像击剑、动漫刀剑的原则、节拍表、每招要点、镜头、声音需求、看片清单）：剧本/打斗试做_duel2.md
//
// 故事：对峙 → 两人同时拖刀冲刺、剑在半路撞成 X → 六拍连续攻防（劈 / 挡 / 反劈 / 闪 / 刺 / 格 / 横斩 / 蹲 / 上撩 / 压 / 重劈 / 架）
//       → 锁剑较劲（强者占上风）→ 被推开滑退 → 强者跳劈劈地 → 燕返し磕飞主角的剑 → 回转斩把主角打飞
//       → 主角滑着跪住、写 sword.len *= 3，强者冲过来跳起补刀 → 剑一帧变长，一记上撩把空中的强者打飞 → 自己也被剑带倒，两人都躺着
// 原则：上一招的收势就是下一招的预备（剑停在哪儿，下一招就从哪儿起）；攻守连续互换，没有回到架势的定格；
//       "停"换成仍在动的段落（锁剑颤动、滑退、滑行跪地）
// 出画：默认不按 24fps 取整（60fps 插值更顺）；STEP=24 环境变量可以改回一拍一
'use strict';
const K = require('./core');
const { W, H } = K;
const { Actor2, exchange, FightFX, drawWeapon, weaponLine } = require('./fight');
const { Director } = require('./director');
const { Code } = require('./code');

const F = 1 / 24, at = f => f * F;                  // 帧号 → 秒（24fps）
const HH = 300, HF = 330;                           // 主角、强者的身高
const D = new Director(), clock = D.clock, cam = D.cam;
const hero = new Actor2({ H: HH, x0: -560, dir: 1, clock, noise: 0 });
const foe = new Actor2({ H: HF, x0: 560, dir: -1, clock, noise: 0, color: [235, 235, 235] });
const fx = new FightFX(HH);
const SW = { hero: 0.55, foe: 0.6, big: 1.65 };     // 剑长（各自身高的倍数）；sword.len *= 3 之后主角 1.65
let tGrow = 1e9;
const GROW = [1.95, 1.5, 1.72, 1.61, 1.67, 1.65];   // 变长：1 帧到位，过冲衰减
const heroLen = ta => { const k = Math.floor((ta - tGrow) / F + 1e-6); return k < 0 ? SW.hero : GROW[Math.min(k, GROW.length - 1)]; };
hero.weapon = heroLen; foe.weapon = SW.foe;          // exchange 按剑的实际位置放火花，contact_check 也用它

// ① 对峙 f0–f13：两人都在微微下沉、剑尖在动，不是定格
hero.move(-at(4), 'ready_a'); foe.move(-at(4), 'hasso_a');

// ② f13 两人同时拖刀冲刺，f24 剑在半路撞成 X（两人的终点按"接触时胯相距 1.45H"一起算）
const t1 = at(13), G = 1.45 * HH;
const e = ((foe.hipNow(t1)[0] - hero.hipNow(t1)[0]) - G) / (HH + HF) - 1.15;
foe.move(t1, 'dash_cut_a', { extra: e });
exchange(D, [{ t: t1, a: hero, move: 'dash_cut_a', b: foe, react: () => {}, level: 'clash', opts: { extra: e } }], fx);

// ③ 六拍连续攻防：每一拍的守方动作收在哪儿，就是他下一拍出招的起点
exchange(D, [
  { t: at(26), a: foe, move: 'down_cut_a', b: hero, react: 'block_slant_a' },        // 袈裟斩 ↔ 竖剑挡
  { t: at(31), a: hero, move: 'riposte_a', b: foe, react: 'sway_back_a' },           // 剑绕过头顶反劈 ↔ 后仰闪
  { t: at(37), a: foe, move: 'thrust_a', b: hero, react: 'parry_up_a' },             // 后仰弹回来突刺 ↔ 往上格开
  { t: at(41), a: hero, move: 'h_cut_a', b: foe, react: 'duck_a' },                  // 格开的剑举在头上 → 横斩 ↔ 深蹲
  { t: at(46), a: foe, move: 'rise_cut_a', b: hero, react: 'block_low_a' },          // 蹲起上撩 ↔ 往下压
  { t: at(50), a: hero, move: 'overhead_a', b: foe, react: 'block_high_a' },         // 唐竹重劈 ↔ 高位架
], fx);

// ④ 锁剑 f56–f70：两把剑卡住，一直在抖、在较劲，强者一点点压过来
const tLock = at(56);
hero.move(tLock, 'lock_hero_a'); foe.move(tLock, 'lock_foe_a');
for (const f of [58, 61, 64, 67]) D.cue(at(f), 'impact_light', { v: 0.22, note: '占位：锁剑，两把剑贴着磨（要新声音 sword_scrape）' });

// ⑤ 推开 → 滑退；跳劈劈地；燕返し磕飞主角的剑；回转斩把主角打飞
const sh = exchange(D, [{ t: at(70), a: foe, move: 'shove_a', b: hero, react: 'slide_back_a', level: 'clash' }], fx);
const lp = exchange(D, [{ t: at(76), a: foe, move: 'leap_cut_a', b: hero, react: 'hop_back_a' }], fx);
const tSlam = lp[0].tc;
fx.add(tSlam, () => weaponLine(foe, tSlam)[1], 'clash');                     // 剑劈到地上：火花 + 闷响
D.cue(tSlam, 'thud', { v: 0.8, note: '占位：剑劈到地上（要新声音 sword_slam：金属 + 碎石）' });
D.cue(at(72), 'recoil_slide', { v: 0.5, note: '被推开，两脚贴地滑退' });
exchange(D, [
  { t: at(88), a: foe, move: 'tsubame_a', b: hero, react: 'guard_break_a' },
  { t: at(93), a: foe, move: 'spin_cut_a', b: hero, react: 'knock_skid_a', level: 'heavy' },
], fx);
const tKO = D.fights[D.fights.length - 1].tc;
D.cue(tKO + at(6), 'thud', { v: 0.8, note: '主角落地' });
D.cue(tKO + at(6), 'recoil_slide', { v: 0.6, note: '单膝跪着滑行刹车' });

// ⑥ 翻盘不停：主角滑着跪住时代码就出来了；强者冲过来、跳起补刀；剑一帧变长，从身后兜上来撩中空中的强者
const LINE = 'sword.len *= 3', CPS = 24;
const tType = tKO + at(4);
const hx = hero.hipNow(tKO + at(12))[0];
const code = new Code({ x: hx - 0.35 * HH, y: -1.5 * HH, size: 34, seed: 11, show: [tType - 0.05, 1e9] });
code.type(tType, LINE, CPS);
const tRun = tType + LINE.length / CPS + at(1);
code.run(tRun);
tGrow = tRun + at(1);
code.fadeOut(tGrow + 0.6);
D.cue(tGrow, 'release', { note: '占位：剑一帧变长（要新声音 sword_grow：锵 + 低频嗡）' });
foe.move(tKO + at(5), 'dash_a');
foe.move(tKO + at(14), 'leap_air_a');
hero.move(tKO + at(13), 'lower_trail_a');
const fin = exchange(D, [{ t: tGrow, a: hero, move: 'big_rise_fall_a', b: foe, react: 'launched_air_a', level: 'heavy', glyph: '×3', opts: { extra: 0 } }], fx);   // 主角不迈步：强者自己冲进巨剑的范围
const tWin = fin[0].tc;
D.cue(tWin + at(12), 'thud', { note: '强者背着地' });
D.cue(tWin + at(13), 'recoil_slide', { v: 0.4, note: '强者背着地往后滑' });
D.cue(tGrow + at(13), 'thud', { v: 0.8, note: '主角被巨剑带倒，仰面倒地' });

// ⑦ 两人都躺着 27 帧（笑点）→ 淡出
const tRest = Math.max(tWin + at(18), tGrow + at(17));
const ADUR = tRest + at(27) + 0.6;

// 镜头：平滑跟拍两个人和两把剑尖；锁剑推近；剑变长那一刻拉开；之后跟着两人，结尾收两人（都不用 wide，wide 太远人太小）
const tips = ta => [weaponLine(hero, ta)[1], weaponLine(foe, ta)[1]];
const both = { on: [hero, foe, tips], kind: 'full', fit: 0.62 };
D.follow(0, at(53), both);
D.follow(at(57), at(69), { on: [hero, foe, tips], kind: 'medium', fit: 0.8 }, 0.15);
D.follow(at(73), tKO + at(2), { ...both, fit: 0.6 });
D.follow(tKO + at(5), tGrow - at(1), { ...both, fit: 0.66 }, 0.15);
const bigTip = ta => weaponLine(hero, ta, heroLen(ta))[1];
D.shot(tGrow + at(1), at(3), { on: [hero, foe, bigTip], kind: 'full', fit: 0.8 }, 'out3');            // 巨剑举到最高：拉开，整把剑和空中的强者都在画里
D.follow(tGrow + at(6), tWin + at(16), { on: [hero, foe], kind: 'full', fit: 0.72 }, 0.2);            // 强者飞出去、主角被剑带倒：跟着两个人（不追剑尖，景别不至于太远）
D.shot(tRest - at(4), 0.9, { on: [hero, foe, bigTip], kind: 'full', fit: 0.86 });                     // 两人都躺着：收两个人 + 整把巨剑
D.finalize({ actors: [hero, foe], dur: ADUR, start: { x: 0, y: -330, z: 0.9 } });
const DUR = D.DUR;
// 声音备注（给 audio/时间表/duel2.md）：exchange 自动登记的声音在这一场里是什么
for (const c of require('./cues').list) if (!c.note) {
  if (c.type === 'impact_light') c.note = '占位：剑碰剑（要新声音 sword_clang：金属"叮"，短、亮）';
  else if (c.type === 'impact_heavy') c.note = '重击打中（白闪 1 帧）';
  else if (c.type === 'whoosh_short') c.note = '挥剑破风（剑比拳头长，可以比出拳的"呼"低、长一点）';
}

const STEP = +process.env.STEP || 0;
const OPT = { step: STEP || undefined, smear: false, turn: 0.4 };
function draw(ctx, tr) {
  const tq = STEP ? Math.floor(tr * STEP + 1e-6) / STEP : tr;
  const ta = clock.anim(tq), c = cam.at(tq);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  code.draw(ctx, ta);
  foe.draw(ctx, ta, OPT); drawWeapon(ctx, foe, ta, { arc: ta < tWin, trail: ta < tWin });   // 强者被打飞之后剑只是跟着身体翻，不画拖影
  const grow = ta >= tGrow - 1e-6 && ta < tGrow + F - 1e-6;                                  // 变长那一帧：白、粗；月牙从下一帧起画（不然变长前后的剑之间会扫出一大片灰）
  hero.draw(ctx, ta, OPT); drawWeapon(ctx, hero, ta, { arc: true, arcFrom: ta >= tGrow - 1e-6 ? tGrow + F - 1e-6 : undefined, color: grow ? '#ffffff' : '#ffe680', width: grow ? 0.06 * HH : undefined });
  fx.draw(ctx, ta);
  ctx.restore();
  const fl = fx.flashAt(ta);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
  const fade = Math.min(1, Math.max(0, (tr - (DUR - 0.6)) / 0.6));
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }
const weaponLen = (a, ta) => a === hero ? heroLen(ta) : a === foe ? SW.foe : 0;   // 给 tools/contact_check.js
module.exports = { DUR, draw, post, cam, hero, foe, clock, codes: [code], fights: D.fights, weaponLen, actors: [hero, foe], locks: [[tLock + at(1), tLock + at(14)]], T: { tLock, tSlam, tKO, tType, tRun, tGrow, tWin, tRest } };
