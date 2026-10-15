import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {FxCanvas} from '../fx/Canvas';
import {Flare} from '../fx/Flare';
import {TextParticles} from '../fx/TextParticles';
import {dot, glow, glowPath, trail} from '../fx/glow';
import {proj} from '../fx/proj';
import {drawSphere, fibSphere, plutoColor} from '../fx/sphere';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {PLUTO_EL, plutoAt, plutoAtNu} from '../lib/orbit';
import {C, MONO, RGB, SERIF} from '../theme';

/* 真实的铭文（刻在新视野号上装骨灰的小容器上） */
const INSCRIPTION_1 =
	"Interned herein are remains of American Clyde W. Tombaugh, discoverer of Pluto and the solar system's \u201Cthird zone.\u201D";
const INSCRIPTION_2 =
	"Adelle and Muron's boy, Patricia's husband, Annette and Alden's father, astronomer, teacher, punster, and friend.";
const INSCRIPTION_ZH_1 = '此处安放着美国人克莱德·W·汤博的遗骸——冥王星与太阳系“第三区域”的发现者。';
const INSCRIPTION_ZH_2 = '阿黛尔和穆伦的儿子，帕特里夏的丈夫，安妮特和奥尔登的父亲；天文学家、老师、爱讲双关语的人，也是朋友。';

const typed = (s: string, f: number, start: number, cps: number) => {
	const n = Math.floor(interpolate(f, [start, start + (s.length / cps) * 30], [0, s.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	return s.slice(0, n);
};

const PL = fibSphere(14000, 'pluto-13');
const PLS = fibSphere(1500, 'pluto-13s');
const ORBIT: [number, number, number][] = new Array(241).fill(0).map((_, i) => plutoAtNu((i / 240) * Math.PI * 2));

export const S13Epilogue: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const dur = scene.duration;
	const end = appear(f, c3 + 110, 40, easeInOut);
	// A：冥王星不在乎
	const big = inOut(f, 0, c1 + 20, 24);
	const labelT = appear(f, 0, 34);
	const labelOut = appear(f, 56, 50);
	// B：轨道
	const orb = inOut(f, c1 - 10, c2 + 14, 24);
	const year = 2026 + Math.max(0, f - c1) * 0.35;
	// C：铭文
	const card = inOut(f, c2 - 6, c3 + 12, 20);
	// D：去了那里
	const voyage = inOut(f, c3 - 10, c3 + 120, 20);
	const vt = appear(f, c3, 110, easeInOut);
	const ash = useMemo(() => new Array(160).fill(0).map((_, i) => ({x: random(`as-x${i}`), y: random(`as-y${i}`), v: random(`as-v${i}`), s: random(`as-s${i}`)})), []);
	return (
		<SceneFrame {...props} stars={{opacity: 0.55, drift: 0.03}} kicker="CLYDE W. TOMBAUGH · 1906—1997" hudOut={c3 + 100} fadeOut={30}>
			<FxCanvas
				draw={(ctx, fr) => {
					// ---------- A ----------
					if (big > 0) {
						drawSphere(ctx, {cx: 960, cy: 520, R: 300, spin: 183 + Math.sin(fr / 90) * 10 - 20 + fr * 0.08, tilt: 14, points: PL, color: plutoColor(0.25 + 0.2 * Math.sin(fr / 18)), size: 1.15, alpha: big, base: {c: [70, 44, 32], a: 0.55}, rim: {c: RGB.gold, a: 0.35}});
						ctx.globalCompositeOperation = 'lighter';
						glow(ctx, 960, 520, 640, RGB.gold, 0.1 * big);
					}
					ctx.globalCompositeOperation = 'lighter';
					// ---------- B：沿 248 年的路慢慢走 ----------
					if (orb > 0) {
						const cam = {cx: 960, cy: 500, pitch: -30, yaw: -30 + fr * 0.02, dist: 2600, scale: 1};
						const K = 8.6;
						const op = ORBIT.map((p) => {
							const s = proj(p[0] * K, p[1] * K, p[2] * K, cam);
							return [s[0], s[1]] as [number, number];
						});
						glowPath(ctx, op, RGB.gold, {width: 1.2, a: orb * 0.6, bloom: 12});
						for (let r = 10; r <= 50; r += 10) {
							const pts: [number, number][] = [];
							for (let k = 0; k <= 90; k++) {
								const a = (k / 90) * Math.PI * 2;
								const s = proj(Math.cos(a) * r * K, Math.sin(a) * r * K, 0, cam);
								pts.push([s[0], s[1]]);
							}
							glowPath(ctx, pts, RGB.blue, {width: 0.5, a: orb * 0.18, bloom: 2});
						}
						const sun = proj(0, 0, 0, cam);
						glow(ctx, sun[0], sun[1], 140, RGB.goldHot, orb * 0.7);
						glow(ctx, sun[0], sun[1], 24, RGB.white, orb);
						const tr: [number, number][] = [];
						for (let k = 0; k <= 30; k++) {
							const p = plutoAt(year - 14 + (k / 30) * 14);
							const s = proj(p[0] * K, p[1] * K, p[2] * K, cam);
							tr.push([s[0], s[1]]);
						}
						trail(ctx, tr, RGB.goldHot, 5, orb);
						const ps = tr[30];
						drawSphere(ctx, {cx: ps[0], cy: ps[1], R: 26, spin: fr * 0.8, tilt: 20, points: PLS, color: plutoColor(0.4), size: 0.9, alpha: orb, rim: {c: RGB.gold, a: 0.6}});
						ctx.globalCompositeOperation = 'lighter';
						glow(ctx, ps[0], ps[1], 110, RGB.gold, orb * 0.6);
						// 太阳 → 冥王星的距离线
						ctx.globalAlpha = orb * 0.5;
						ctx.strokeStyle = 'rgba(243,196,124,1)';
						ctx.setLineDash([2, 8]);
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.moveTo(sun[0], sun[1]);
						ctx.lineTo(ps[0], ps[1]);
						ctx.stroke();
						ctx.setLineDash([]);
					}
					// ---------- C：骨灰的微光 ----------
					if (card > 0) {
						for (const a of ash) {
							const x = 960 + (a.x - 0.5) * 1500 + Math.sin(fr * 0.01 + a.s * 9) * 40;
							const y = 1100 - ((fr * (0.3 + a.v * 0.7) + a.y * 1200) % 1200);
							glow(ctx, x, y, 6 + a.s * 12, RGB.goldHot, card * 0.4 * a.v);
						}
					}
					// ---------- D：新视野号带着他远行 ----------
					if (voyage > 0) {
						const p0: [number, number] = [160, 860];
						const p1: [number, number] = [1760, 260];
						const pts: [number, number][] = [];
						for (let k = 0; k <= 60; k++) {
							const t = (k / 60) * vt;
							pts.push([lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t) - Math.sin(t * Math.PI) * 160]);
						}
						glowPath(ctx, pts, RGB.gold, {width: 1.6, a: voyage * 0.7, bloom: 14});
						const h = pts[60];
						glow(ctx, h[0], h[1], 120, RGB.goldHot, voyage);
						dot(ctx, h[0], h[1], 4, RGB.white, voyage);
						// 途经的冥王星
						const px = lerp(p0[0], p1[0], 0.62);
						const py = lerp(p0[1], p1[1], 0.62) - Math.sin(0.62 * Math.PI) * 160 + 34;
						drawSphere(ctx, {cx: px, cy: py, R: 22, spin: 183, tilt: 15, points: PLS, color: plutoColor(0.6), size: 0.9, alpha: voyage * appear(fr, c3 + 10, 20), rim: {c: RGB.gold, a: 0.6}});
						ctx.globalCompositeOperation = 'lighter';
						glow(ctx, px, py, 80, RGB.gold, voyage * 0.5 * (vt > 0.6 ? 1.6 : 1));
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			{/* A：“行星”还是“矮行星”——标签化成粒子飘散 */}
			<TextParticles text="行星？矮行星？" fontFamily={SERIF} fontWeight={600} fontSize={64} cx={960} cy={150} t={labelT} out={labelOut} gap={3} letterSpacing={18} color={[227, 236, 245]} glowColor={RGB.gold} />
			<AbsoluteFill>
				{/* B：数字 */}
				<div style={{position: 'absolute', left: 110, top: 380, opacity: orb * appear(f, c1 + 10, 20), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>STILL WALKING · 仍在走</div>
					<div style={{fontFamily: MONO, fontSize: 64, color: C.goldHot, textShadow: '0 0 30px rgba(243,196,124,0.7)', marginTop: 12}}>5,906,000,000<span style={{fontSize: 22}}> KM</span></div>
					<div style={{fontFamily: MONO, fontSize: 64, color: C.ice, marginTop: 6}}>
						{PLUTO_EL.period.toFixed(0)}<span style={{fontSize: 22, color: C.iceDim}}> 年 / 圈</span>
					</div>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.iceDim, letterSpacing: '0.3em', marginTop: 14}}>YEAR {Math.floor(year)} · 下次回到发现时的位置：2178</div>
				</div>
				{/* C：铭文卡 */}
				<div
					style={{
						position: 'absolute',
						left: 960,
						top: 470,
						transform: `translate(-50%,-50%) scale(${lerp(0.96, 1, card)})`,
						width: 1140,
						padding: '46px 60px',
						opacity: card,
						border: '1px solid rgba(243,196,124,0.4)',
						background: 'linear-gradient(135deg, rgba(243,196,124,0.13), rgba(12,14,22,0.55) 60%)',
						backdropFilter: 'blur(8px)',
						boxShadow: '0 0 80px rgba(243,196,124,0.12), inset 0 0 40px rgba(243,196,124,0.06)',
						boxSizing: 'border-box',
					}}
				>
					<div style={{position: 'absolute', left: ((f * 7) % 1600) - 300, top: 0, width: 260, height: '100%', background: 'linear-gradient(90deg, rgba(255,240,210,0), rgba(255,240,210,0.07), rgba(255,240,210,0))'}} />
					<div style={{fontFamily: MONO, fontSize: 12, color: C.gold, letterSpacing: '0.4em'}}>INSCRIPTION · NEW HORIZONS · LAUNCHED 2006.01.19</div>
					<div style={{fontFamily: MONO, fontSize: 21, color: '#fff3e2', lineHeight: 1.65, marginTop: 22, minHeight: 140}}>
						{typed(INSCRIPTION_1, f, c2 + 10, 60)} {typed(INSCRIPTION_2, f, c2 + 10 + (INSCRIPTION_1.length / 60) * 30 + 6, 75)}
						<span style={{opacity: f % 16 < 8 ? 1 : 0, color: C.gold}}>▌</span>
					</div>
					<div style={{height: 1, background: 'linear-gradient(90deg, rgba(243,196,124,0.5), rgba(243,196,124,0))', margin: '22px 0'}} />
					<div style={{fontFamily: SERIF, fontSize: 19, color: C.iceDim, lineHeight: 1.9, letterSpacing: '0.06em', opacity: appear(f, c2 + 60, 30)}}>
						{INSCRIPTION_ZH_1}
						<br />
						{INSCRIPTION_ZH_2}
					</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.goldHot, letterSpacing: '0.3em', marginTop: 22, textAlign: 'right', opacity: appear(f, c2 + 90, 30)}}>
						克莱德·汤博 · 1906—1997
					</div>
				</div>
				{/* D */}
				<div style={{position: 'absolute', left: 110, top: 330, opacity: voyage * appear(f, c3 + 40, 20), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>TOMBAUGH → PLUTO</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 30, color: C.ice, letterSpacing: '0.2em', marginTop: 12}}>1930 年发现 · 2015 年抵达</div>
				</div>
				{/* 片尾 */}
				{end > 0 ? (
					<div style={{position: 'absolute', left: 960, top: 600, transform: 'translateX(-50%)', opacity: end * appear(f, c3 + 170, 30), textAlign: 'center', whiteSpace: 'nowrap'}}>
						<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 30, color: C.goldHot, letterSpacing: '0.8em', textShadow: '0 0 20px rgba(243,196,124,0.6)'}}>远方的心</div>
						<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.5em', marginTop: 16}}>THE HEART OF THE FAR AWAY</div>
						<div style={{width: 360 * appear(f, c3 + 190, 40), height: 1, margin: '40px auto 0', background: 'linear-gradient(90deg, rgba(243,196,124,0), rgba(243,196,124,0.8), rgba(243,196,124,0))'}} />
						<div style={{fontFamily: MONO, fontSize: 11, color: C.iceDim, letterSpacing: '0.4em', marginTop: 28, opacity: appear(f, c3 + 210, 30)}}>DATA &amp; IMAGERY REFERENCE · NASA / JHUAPL / SwRI · IAU</div>
					</div>
				) : null}
			</AbsoluteFill>
			{end > 0 ? (
				<>
					<TextParticles text="冥王星" fontFamily={SERIF} fontWeight={600} fontSize={170} cx={960} cy={430} t={appear(f, c3 + 110, 70)} out={appear(f, dur - 50, 40)} gap={3} letterSpacing={70} color={[255, 228, 176]} glowColor={RGB.gold} />
					<div style={{position: 'absolute', left: 0, top: 430, width: 1920, display: 'flex', justifyContent: 'center', gap: 70, transform: 'translateY(-50%)', fontFamily: SERIF, fontWeight: 600, fontSize: 170, lineHeight: 1, color: '#fff1d8', opacity: appear(f, c3 + 160, 40) * (1 - appear(f, dur - 56, 20)), textShadow: '0 0 30px rgba(243,196,124,0.8), 0 0 90px rgba(243,170,90,0.45)'}}>
						<span>冥</span>
						<span>王</span>
						<span>星</span>
					</div>
					<Flare x={960} y={430} size={40} intensity={end * 0.5 * (1 - appear(f, dur - 40, 30))} streak={2.2} rays={false} />
				</>
			) : null}
		</SceneFrame>
	);
};
