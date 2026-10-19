// 30 秒刀剑短片 blade1（SCENE=blade1）：第 10 轮。主角（黄）单手持剑，强者（白）单手持刀
// 设计稿（武术指导思路、节拍表、每招要点、镜头、声音需求、看片清单）：剧本/刀剑短片_blade1.md
//
// 结构：① 亮相（强者缠头裹脑横刀亮掌，主角剑花弓步指剑）② 第一回合：刀猛剑巧（劈 / 挂、撩 / 跳、扫 / 跳、反撩 / 截、
//       点腕 / 架、连环三刺 / 三格、缠头反砍 / 矮身穿过换边、回身劈 / 架）③ 转折：力劈华山硬接，剑被磕飞插地；
//       空手闪躲（铁板桥、后空翻、后滚翻）→ 倒踢剑柄、剑弹起来空中接住（慢镜头）④ 反击：腾空跃过扫堂刀回身劈、
//       仆步扫斩、绞剑、剑首撞、错身斩（慢镜头）⑤ 背对背定住 → 刀断成两截、强者跪倒；主角剑花收势；
//       飞上天的半截刀头掉下来插在主角脚边，主角吓一跳
'use strict';
const K = require('./core');
const { W, H } = K;
const { Actor2, exchange, FightFX, drawWeapon, weaponLine, segMid, FlyBlade } = require('./fight');
const { Director } = require('./director');

const F = 1 / 24, at = f => f * F;                  // 帧号 → 秒（24fps）
const HH = 300, HF = 330;
const D = new Director(), clock = D.clock, cam = D.cam;
const hero = new Actor2({ H: HH, x0: -560, dir: 1, clock, noise: 0 });
const foe = new Actor2({ H: HF, x0: 560, dir: -1, clock, noise: 0, color: [235, 235, 235] });
hero.blade = { kind: 'jian', color: '#ffe680', tassel: '#d8402f', zhi: true };
foe.blade = { kind: 'dao', color: '#f0f0f0' };
const fx = new FightFX(HH);
const SW = { hero: 0.6, foe: 0.6 };
let heroOff = [], tX = 1e9;                                   // 主角手里没剑的时间段（剑被磕飞 → 接住）
const heroLen = ta => heroOff.some(([a, b]) => ta >= a && ta < b) ? 0 : SW.hero;
hero.weapon = heroLen; foe.weapon = SW.foe;          // 刀断了以后照样按 0.6 画（断口由 foe.blade.broken 画），判断用 weaponLen（0.3）
const X = (beats) => exchange(D, beats, fx);

// ① 亮相 f0–f56
hero.move(-at(4), 'stand_jian_b'); foe.move(-at(4), 'stand_dao_b');
foe.move(at(4), 'wrap_b');
hero.move(at(24), 'flower_b');
const S1 = at(36);                                   // ① 后面加了对峙碎步 + 半秒静止（动手前的“静”），② ③ 整体往后挪 36 帧
hero.move(at(56), 'edge_h_b'); foe.move(at(58), 'edge_f_b');          // 对峙：两人各蹭两小步

// ② 第一回合 f56–f166：刀猛剑巧
X([
  { t: S1 + at(56), a: foe, move: 'charge_pi_b', b: hero, react: 'gua_b' },
  { t: S1 + at(68), a: hero, move: 'liao_b', b: foe, react: 'hop_back_b' },
  { t: S1 + at(77), a: foe, move: 'sweep_b', b: hero, react: 'jump_back_b' },
  { t: S1 + at(84), a: foe, move: 'back_liao_b', b: hero, react: 'jie_b' },
  { t: S1 + at(91), a: hero, move: 'dian_b', b: foe, react: 'pull_jia_b' },
  { t: S1 + at(96), a: hero, move: 'ci_hi_b', b: foe, react: 'ge_hi_b' },
  { t: S1 + at(101), a: hero, move: 'ci_mid_b', b: foe, react: 'ge_mid_b' },
  { t: S1 + at(106), a: hero, move: 'ci_lo_b', b: foe, react: 'ge_lo_b' },
  { t: S1 + at(111), a: foe, move: 'wrap_cut_b', b: hero, react: 'duck_through_b' },
]);
X([
  { t: S1 + at(124), a: hero, move: 'turn_pi_b', b: foe, react: 'jia_hi_b' },
  { t: S1 + at(130), a: foe, move: 'shove_b', b: hero, react: 'slide_back_b' },
]);
foe.move(S1 + at(141), 'ti_b'); hero.move(S1 + at(142), 'jie_tui_b');           // 弹踢 ↔ 退步截腿（腿不碰剑，不进 exchange）
X([
  { t: S1 + at(150), a: hero, move: 'mo_b', b: foe, react: 'yang_b' },
  { t: S1 + at(157), a: foe, move: 'gai_b', b: hero, react: 'beng_b' },
]);
foe.move(S1 + at(166), 'raise_b'); hero.move(S1 + at(167), 'guard_b');

// ③ 转折 f188–f290：力劈华山把剑磕飞 → 空手闪躲 → 踢剑、空中接剑
const [rPi] = X([{ t: S1 + at(188), a: foe, move: 'leap_pi_b', b: hero, react: 'tuo_b' }]);
const tKnock = rPi.tc;
fx.add(tKnock, rPi.point, 'heavy');                                    // 硬接：白闪
D.cue(tKnock, 'blade_heavy_clang', { note: '力劈华山砍在剑上：重金属撞击 + 低频' });
hero.move(tKnock, 'knock_kneel_b');
clock.slow(tKnock, at(10), 0.35);
D.cue(tKnock + at(3), 'recoil_slide', { v: 0.6, note: '单膝跪着往后滑' });
hero.move(tKnock + at(10), 'rise_b');
X([
  { t: tKnock + at(16), a: foe, move: 'sweep_hi_b', b: hero, react: 'tieban_b' },
  { t: tKnock + at(26), a: foe, move: 'chop_down_b', b: hero, react: 'backflip_b' },
]);
const tChop = tKnock + at(29);
fx.add(tChop, () => { const t = weaponLine(foe, tChop)[1]; return [t[0], -4]; }, 'clash');   // 刀劈在地上：火花
D.cue(tChop, 'sword_slam', { v: 0.8, note: '刀劈在地上：金属 + 碎石' });
D.cue(tKnock + at(36), 'thud', { v: 0.5, note: '后空翻落地' });
const [rRoll] = X([{ t: tKnock + at(33), a: foe, move: 'xie_pi_b', b: hero, react: 'turn_roll_b' }]);
const tRoll = rRoll.tc - at(3), tUp = tRoll + at(13);                 // 滚翻开始 / 蹲着起来
D.cue(tRoll + at(6), 'recoil_slide', { v: 0.4, note: '肩膀着地滚翻' });
hero.move(tUp, 'kick_up_b');
const tKick = tUp + at(4), tCatch = tUp + at(28), tLand = tUp + at(33);
heroOff = [[tKnock + 1e-3, tCatch]];                                  // 接触那一帧剑还在手里，下一帧飞出去
foe.move(tLand - at(23), 'chase_halt_b');
clock.slow(tCatch - at(5), at(9), 0.4);
D.cue(tKick, 'sword_kick', { v: 0.6, note: '脚背挑到剑格、剑从地里蹦出来：铛 + 拔出泥土' });
D.cue(tCatch, 'sword_catch', { v: 0.7, note: '空中握住剑柄：啪 + 剑鸣' });
D.cue(tLand, 'thud', { v: 0.6, note: '落地弓步' });
D.cue(tLand + at(1), 'recoil_slide', { v: 0.4, note: '强者急刹' });
// 被磕飞的剑：转两圈，剑尖朝下插在主角滚翻起来的地方前面（滚完正好在剑旁边）；被踢起来，从头顶飞过去，空中接住
const fly = new FlyBlade(hero.blade, SW.hero, HH);
const hand = (a, t) => weaponLine(a, t)[0];
const cang = (a, t) => { const [h, tp] = weaponLine(a, t); return Math.atan2(tp[1] - h[1], tp[0] - h[0]) * 180 / Math.PI; };
const STUCK = 75;                                                      // 插地的角度（画布坐标：剑尖朝右下）
const stickP = () => { const j = hero.jointsAt(tUp); return [j.hip[0] + 0.47 * HH, -(0.6 * Math.sin(STUCK * Math.PI / 180) - 0.1) * HH]; };
const tStick = tKnock + at(23);
fly.toss(tKnock + 1e-3, () => hand(hero, tKnock), () => ((cang(hero, tKnock) % 360) + 360) % 360, tStick - tKnock, stickP, STUCK, 2).stick(0.4, 8);
fly.toss(tKick, stickP, STUCK, tCatch - tKick, () => hand(hero, tCatch), () => cang(hero, tCatch), -1).hide(tCatch);
D.cue(tKnock + at(4), 'sword_spin', { v: 0.5, note: '剑在空中打转：连续呼呼声' });
D.cue(tStick, 'sword_stick', { v: 0.6, note: '剑插进地里：噗 + 嗡嗡余震' });
D.cue(tKick + at(2), 'sword_spin', { v: 0.5, note: '剑从头顶飞过去打转' });

// ④ 反击 f290–：跃过扫堂刀回身劈 / 背刀挡、转身横斩 / 仆步、扫斩 / 跳、落地劈 / 绞剑 → 剑首撞
const t4 = tLand + at(10);
clock.slow(t4 + at(1), at(6), 0.4);                                   // 腾空跃过扫堂刀：慢镜头
X([
  { t: t4, a: foe, move: 'sweep_lo_b', b: hero, react: 'leap_over_b' },
  { t: t4 + at(7), a: hero, move: 'drop_pi_b', b: foe, react: 'back_block_b' },
  { t: t4 + at(14), a: foe, move: 'turn_slash_b', b: hero, react: 'pubu_duck_b' },
  { t: t4 + at(20), a: hero, move: 'pubu_sweep_b', b: foe, react: 'jump_up_b' },
  { t: t4 + at(25), a: foe, move: 'land_chop_b', b: hero, react: 'jiao_b' },
]);
const tJiao = t4 + at(28);
foe.move(tJiao, 'wrench_b');
D.cue(tJiao + at(2), 'sword_scrape', { v: 0.3, note: '绞剑，剑贴着刀身磨一圈' });
D.cue(tJiao + at(4), 'sword_scrape', { v: 0.3, note: '绞剑（第二下）' });
hero.move(tJiao + at(8), 'pommel_b');
const tPom = tJiao + at(11);
foe.move(tPom, 'stagger_b');
const pommelP = () => { const [h, tp] = weaponLine(hero, tPom), l = Math.hypot(tp[0] - h[0], tp[1] - h[1]) || 1; return [h[0] - (tp[0] - h[0]) / l * 0.08 * HH, h[1] - (tp[1] - h[1]) / l * 0.08 * HH]; };
fx.add(tPom, pommelP, 'hit');
D.cue(tPom, 'impact_medium', { v: 0.8, note: '剑首撞胸口（闷响）' });

// ④b 刀如猛虎三刀 / 剑走轻灵：跨步劈 / 云剑、拦腰扫 / 竖剑格、反撩 / 压剑 → 进步刺 / 拨、斜劈腿 / 提膝挂剑、落步劈 / 托刀架
const tR = tPom + at(18);                                              // 强者被撞退、两人重新摆好架子
X([
  { t: tR, a: foe, move: 'kua_pi_b', b: hero, react: 'yun_b' },
  { t: tR + at(7), a: foe, move: 'lan_b', b: hero, react: 'xia_ge_b' },
  { t: tR + at(13), a: foe, move: 'liao2_b', b: hero, react: 'ya_b' },
  { t: tR + at(18), a: hero, move: 'jin_ci_b', b: foe, react: 'ge_hi_b' },
  { t: tR + at(23), a: foe, move: 'pi_lo_b', b: hero, react: 'ti_xi_b' },
  { t: tR + at(32), a: hero, move: 'pi_luo_b', b: foe, react: 'jia2_b' },
]);
const tJia = tR + at(36);                                              // 落步劈砍在托刀架上
D.cue(tR + at(5), 'sword_scrape', { v: 0.3, note: '云剑，刀顺着剑身滑开' });
D.cue(tJia + at(3), 'recoil_slide', { v: 0.4, note: '顶着一推、各自跳开' });

// 分开、蓄势 → 错身斩（慢镜头）→ 背对背定住
hero.move(tJia + at(4), 'ready_x_b'); foe.move(tJia + at(6), 'ready_xf_b');
const tX0 = tJia + at(40);
hero.move(tX0, 'cross_b'); foe.move(tX0, 'cross_f_b');
tX = tX0 + at(7);
clock.slow(tX - at(3), at(8), 0.3);
const crossP = () => { const a = weaponLine(hero, tX), b = weaponLine(foe, tX); return segMid(a[0], a[1], b[0], b[1])[1]; };
fx.add(tX, crossP, 'heavy');
D.cue(tX, 'blade_break', { note: '错身斩，刀被斩断：清脆的金属断裂 + 长长的剑鸣' });
foe.blade.broken = { t: tX, at: 0.3 };
const head = new FlyBlade(foe.blade, SW.foe, HF, { from: 0.3 });
head.toss(tX, () => hand(foe, tX), () => cang(foe, tX), 1.3, () => [hand(foe, tX)[0] - 1.2 * HF, -9 * HF], 0, 4);
D.cue(tX + at(2), 'sword_spin', { v: 0.5, note: '刀头打着转飞上天' });

// ⑤ 结尾：强者看刀、跪倒；主角收势；刀头掉下来插在主角脚边，吓一跳
const t5 = tX0 + at(36);
foe.move(t5, 'look_b');
hero.move(t5 + at(8), 'shou_b');
foe.move(t5 + at(40), 'kneel_b');
D.cue(t5 + at(46), 'thud', { v: 0.7, note: '强者单膝跪地' });
const tFall = t5 + at(58), tHit = tFall + at(14);
const HEADA = 82;
const landP = () => { const j = hero.jointsAt(tHit), x = Math.max(j.lF[2][0], j.lB[2][0]) * 0 + (j.dir > 0 ? Math.max(j.lF[2][0], j.lB[2][0]) : Math.min(j.lF[2][0], j.lB[2][0])) + j.dir * 0.12 * HH; return [x - 0.6 * Math.cos(HEADA * Math.PI / 180) * HF, -(0.6 * Math.sin(HEADA * Math.PI / 180) - 0.07) * HF]; };
head.toss(tFall, () => [landP()[0] + 0.3 * HF, -7 * HF], HEADA - 720, tHit - tFall, landP, HEADA, 0).stick(0.4, 9);
D.cue(tFall, 'whistle_fall', { v: 0.4, note: '刀头从天上掉下来：越来越近的下落哨音' });
D.cue(tHit, 'sword_stick', { v: 0.8, note: '刀头插在主角脚边' });
hero.move(tHit, 'startle_b');
D.cue(tHit + at(1), 'touch', { v: 0.6, note: '主角吓一跳' });
// 收尾：主角转过身来行立剑抱拳礼，强者抬头、点头回礼
hero.move(tHit + at(20), 'bow_b');
foe.move(tHit + at(30), 'nod_b');
const ADUR = tHit + at(92);

const tips = ta => [weaponLine(hero, ta)[1], weaponLine(foe, ta)[1]];
const flyTip = ta => fly.tip(ta);
const both = { on: [hero, foe, tips], kind: 'full', fit: 0.62 };
D.follow(0, at(22), both);
D.follow(at(22), at(50), { on: hero, kind: 'medium' });                // 主角剑花亮相：中景
D.follow(at(50), tKnock, both);
D.follow(tKnock, tUp, { on: [hero, foe, tips, flyTip], kind: 'full', fit: 0.62 });
D.follow(tUp, tLand + at(4), { on: [hero, flyTip, foe], kind: 'full', fit: 0.7 });
D.follow(tLand + at(4), tX0, both);
D.follow(tX0, t5 + at(30), { on: [hero, foe, tips], kind: 'full', fit: 0.5 });
D.follow(t5 + at(30), ADUR, { on: [hero, foe], kind: 'full', fit: 0.6 });
D.finalize({ actors: [hero, foe], dur: ADUR, start: { x: 0, y: -330, z: 0.9 } });
const DUR = D.DUR;

const STEP = +process.env.STEP || 0;
const OPT = { step: STEP || undefined, smear: false, turn: 0.4 };
function drawActor(ctx, a, ta, o) {
  if (a.weaponBehind(ta)) { drawWeapon(ctx, a, ta, o); a.draw(ctx, ta, OPT); }
  else { a.draw(ctx, ta, OPT); drawWeapon(ctx, a, ta, o); }
}
function draw(ctx, tr) {
  const tq = STEP ? Math.floor(tr * STEP + 1e-6) / STEP : tr;
  const ta = clock.anim(tq), c = cam.at(tq);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.save(); cam.apply(ctx, c);
  drawActor(ctx, foe, ta, { arc: true });
  fly.draw(ctx, ta); head.draw(ctx, ta);
  drawActor(ctx, hero, ta, { arc: true });
  fx.draw(ctx, ta);
  ctx.restore();
  const fl = fx.flashAt(ta);
  if (fl > 0) { ctx.fillStyle = `rgba(255,255,255,${fl})`; ctx.fillRect(0, 0, W, H); }
  const fade = Math.min(1, Math.max(0, (tr - (DUR - 0.6)) / 0.6));
  if (fade > 0) { ctx.fillStyle = `rgba(0,0,0,${fade})`; ctx.fillRect(0, 0, W, H); }
}
function post(ctx, tr, base) { D.imp.post(ctx, tr, base); }
const foeLen = ta => ta >= tX ? 0.3 : SW.foe;
const weaponLen = (a, ta) => a === hero ? heroLen(ta) : a === foe ? foeLen(ta) : 0;   // 给 tools/contact_check.js
module.exports = { DUR, draw, post, cam, hero, foe, clock, codes: [], fights: D.fights, weaponLen, actors: [hero, foe], locks: [], T: { tKnock, tChop, tRoll, tUp, tKick, tCatch, tLand, t4, tJiao, tPom, tR, tJia, tX0, tX, t5, tFall, tHit }, fly, head };
