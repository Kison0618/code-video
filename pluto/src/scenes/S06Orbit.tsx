import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {FxCanvas} from '../fx/Canvas';
import {dot, glow, glowPath, rgba, trail} from '../fx/glow';
import {proj} from '../fx/proj';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {NEPTUNE_EL, PLUTO_EL, neptuneAt, neptuneLon, plutoAt, plutoAtNu} from '../lib/orbit';
import {C, MONO, RGB, SERIF} from '../theme';

const K = 9.4; // px / AU
const CX = 1040;
const CY = 520;
const NOW = 2026;

const ORBIT: [number, number, number][] = new Array(361).fill(0).map((_, i) => plutoAtNu((i / 360) * Math.PI * 2));

export const S06Orbit: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const dur = scene.duration;
	const intro = appear(f, 0, 50, easeInOut);
	// 年份时间线
	const lap = appear(f, 22, c1 - 30, easeInOut); // A：一整圈 248 年
	const since = appear(f, c1 + 6, 100, easeInOut); // B：1930 → 2026
	let year = 1930 + lap * PLUTO_EL.period;
	if (f >= c1) year = 1930 + since * (NOW - 1930);
	// C：侧视，展示倾角与近日段
	const side = appear(f, c2 + 4, 50, easeInOut) * (1 - appear(f, c3 - 30, 40, easeInOut));
	const inside = appear(f, c2 + 50, 40);
	// D：随海王星旋转的参考系
	const rot = appear(f, c3 - 10, 50, easeInOut);
	const resT = appear(f, c3 + 20, dur - (c3 + 20) - 60, easeInOut); // 0..1 → 495 年

	const pitch = lerp(lerp(58, 14, side), 90, rot);
	const yaw = -20 + f * 0.03 * (1 - rot) + lerp(0, 20, rot);
	const cam = {cx: CX, cy: CY, pitch, yaw, dist: 2600, scale: lerp(1, 0.8, rot)};
	const P = (p: [number, number, number]) => proj(p[0] * K, p[1] * K, p[2] * K, cam);

	const res0 = 1930;
	const resYears = 495.6 * resT;
	const nLaps = (resYears / NEPTUNE_EL.period);
	const pLaps = resYears / PLUTO_EL.period;

	return (
		<SceneFrame {...props} stars={{opacity: 0.45, drift: 0.04}} kicker="P = 247.9 YR · e = 0.25 · i = 17°" hudRight={'HELIOCENTRIC\nECLIPTIC J2000'}>
			<FxCanvas
				draw={(ctx, fr) => {
					ctx.globalCompositeOperation = 'lighter';
					const base = intro * (1 - rot * 0.0);
					// 黄道面极坐标网格
					const gridA = base * lerp(0.5, 0.25, rot);
					for (let r = 10; r <= 50; r += 10) {
						const pts: [number, number][] = [];
						for (let k = 0; k <= 120; k++) {
							const a = (k / 120) * Math.PI * 2;
							const s = P([r * Math.cos(a), r * Math.sin(a), 0]);
							pts.push([s[0], s[1]]);
						}
						glowPath(ctx, pts, RGB.blue, {width: 0.6, a: gridA * 0.35, bloom: 2});
					}
					for (let k = 0; k < 12; k++) {
						const a = (k / 12) * Math.PI * 2;
						const s0 = P([4 * Math.cos(a), 4 * Math.sin(a), 0]);
						const s1 = P([52 * Math.cos(a), 52 * Math.sin(a), 0]);
						glowPath(ctx, [[s0[0], s0[1]], [s1[0], s1[1]]], RGB.blue, {width: 0.5, a: gridA * 0.2, bloom: 2});
					}
					// 太阳
					const sun = P([0, 0, 0]);
					glow(ctx, sun[0], sun[1], 200, RGB.goldHot, 0.55 * base);
					glow(ctx, sun[0], sun[1], 36, RGB.white, base);

					if (rot < 1) {
						const ia = base * (1 - rot);
						// 海王星轨道
						const np: [number, number][] = [];
						for (let k = 0; k <= 180; k++) {
							const a = (k / 180) * Math.PI * 2;
							const s = P([NEPTUNE_EL.a * Math.cos(a), NEPTUNE_EL.a * Math.sin(a), 0]);
							np.push([s[0], s[1]]);
						}
						glowPath(ctx, np, RGB.blue, {width: 1.4, a: 0.8 * ia, bloom: 10});
						// 冥王星轨道（底）
						const op = ORBIT.map((p) => {
							const s = P(p);
							return [s[0], s[1]] as [number, number];
						});
						glowPath(ctx, op, RGB.gold, {width: 1.1, a: 0.45 * ia, bloom: 6});
						// 倾角：投影到黄道面的垂线
						if (side > 0) {
							for (let k = 0; k < 360; k += 6) {
								const p = ORBIT[k];
								const a = P(p);
								const b = P([p[0], p[1], 0]);
								ctx.globalAlpha = 0.35 * side * ia;
								ctx.strokeStyle = rgba(p[2] > 0 ? RGB.gold : RGB.blue, 1);
								ctx.lineWidth = 1;
								ctx.beginPath();
								ctx.moveTo(a[0], a[1]);
								ctx.lineTo(b[0], b[1]);
								ctx.stroke();
								dot(ctx, b[0], b[1], 1.2, RGB.ice, 0.4 * side * ia);
							}
						}
						// 已走过的弧（B 段）
						if (f >= c1) {
							const arc: [number, number][] = [];
							for (let y = 1930; y <= year; y += 0.5) {
								const s = P(plutoAt(y));
								arc.push([s[0], s[1]]);
							}
							glowPath(ctx, arc, RGB.goldHot, {width: 3, a: ia * (1 - 0.65 * inside), bloom: 18});
							const s0 = P(plutoAt(1930));
							glow(ctx, s0[0], s0[1], 30, RGB.gold, ia);
						}
						// 近日段：比海王星更近
						if (inside > 0) {
							const seg: [number, number][] = [];
							for (let y = 1979; y <= 1979 + 20 * inside; y += 0.25) {
								const s = P(plutoAt(y));
								seg.push([s[0], s[1]]);
							}
							glowPath(ctx, seg, RGB.red, {width: 4, a: ia, bloom: 30});
							if (seg.length) glow(ctx, seg[seg.length - 1][0], seg[seg.length - 1][1], 60, RGB.red, ia * (inside < 1 ? 1 : 0.5));
						}
						// 冥王星 + 彗尾
						const tr: [number, number][] = [];
						const span = f < c1 ? 40 : 18;
						for (let k = 0; k <= 30; k++) {
							const s = P(plutoAt(year - span + (k / 30) * span));
							tr.push([s[0], s[1]]);
						}
						trail(ctx, tr, RGB.gold, 6, 0.9 * ia);
						const pp = P(plutoAt(year));
						glow(ctx, pp[0], pp[1], 90, RGB.gold, ia);
						dot(ctx, pp[0], pp[1], 5, RGB.white, ia);
						const nn = P(neptuneAt(year));
						glow(ctx, nn[0], nn[1], 60, RGB.blue, ia);
						dot(ctx, nn[0], nn[1], 4, RGB.blueHot, ia);
					}

					// ---------- D：共振玫瑰线（随海王星旋转的坐标系） ----------
					if (rot > 0) {
						const ra = rot;
						const fix = -Math.PI / 2; // 海王星固定在屏幕上方
						const toRot = (y: number) => {
							const p = plutoAt(y);
							const l = neptuneLon(y);
							const c = Math.cos(fix - l);
							const s = Math.sin(fix - l);
							return [p[0] * c - p[1] * s, p[0] * s + p[1] * c, 0] as [number, number, number];
						};
						const pts: [number, number][] = [];
						for (let y = res0; y <= res0 + resYears; y += 0.6) {
							const s = P(toRot(y));
							pts.push([s[0], s[1]]);
						}
						// 历史轨迹（淡）+ 最近一段（亮）
						glowPath(ctx, pts, RGB.gold, {width: 1.2, a: 0.55 * ra, bloom: 10});
						const recent = pts.slice(Math.max(0, pts.length - 60));
						trail(ctx, recent, RGB.goldHot, 4, ra);
						if (pts.length) {
							const h = pts[pts.length - 1];
							glow(ctx, h[0], h[1], 80, RGB.gold, ra);
							dot(ctx, h[0], h[1], 5, RGB.white, ra);
						}
						// 海王星轨道与固定的海王星
						const np: [number, number][] = [];
						for (let k = 0; k <= 180; k++) {
							const a = (k / 180) * Math.PI * 2;
							const s = P([NEPTUNE_EL.a * Math.cos(a), NEPTUNE_EL.a * Math.sin(a), 0]);
							np.push([s[0], s[1]]);
						}
						glowPath(ctx, np, RGB.blue, {width: 1, a: 0.4 * ra, bloom: 6});
						const ns = P([0, -NEPTUNE_EL.a, 0]);
						const pulse = 0.5 + 0.5 * Math.sin(fr / 6);
						glow(ctx, ns[0], ns[1], 70 + pulse * 20, RGB.blue, ra);
						dot(ctx, ns[0], ns[1], 6, RGB.blueHot, ra);
						// 海王星的“禁区”
						ctx.globalAlpha = 0.5 * ra;
						ctx.strokeStyle = rgba(RGB.blue, 1);
						ctx.setLineDash([3, 6]);
						ctx.beginPath();
						ctx.arc(ns[0], ns[1], 17 * K * cam.scale!, 0, Math.PI * 2);
						ctx.stroke();
						ctx.setLineDash([]);
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			<AbsoluteFill>
				{/* A：248 年 */}
				<div style={{position: 'absolute', left: 110, top: 380, opacity: inOut(f, 20, c1 + 4, 16), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 150, lineHeight: 1, color: C.goldHot, textShadow: '0 0 40px rgba(243,196,124,0.7)'}}>{Math.round(248 * lap)}</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 26, color: C.ice, letterSpacing: '0.3em', marginTop: 16}}>年 · 一个冥王星年</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.35em', marginTop: 10}}>ONE PLUTONIAN YEAR</div>
				</div>
				{/* B：1930 → 今天 */}
				<div style={{position: 'absolute', left: 110, top: 380, opacity: inOut(f, c1, c2 + 30, 16), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>1930 → {NOW}</div>
					<div style={{fontFamily: MONO, fontSize: 150, lineHeight: 1, color: C.ice, textShadow: '0 0 30px rgba(212,241,255,0.4)', marginTop: 12}}>{Math.floor(year)}</div>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 18}}>
						<span style={{fontFamily: MONO, fontSize: 64, color: C.goldHot, textShadow: '0 0 30px rgba(243,196,124,0.7)'}}>{(((year - 1930) / PLUTO_EL.period) * 100).toFixed(1)}%</span>
						<span style={{fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: C.iceDim, letterSpacing: '0.2em'}}>一圈</span>
					</div>
					<div style={{width: 360, height: 3, background: 'rgba(227,236,245,0.12)', marginTop: 14}}>
						<div style={{width: `${((year - 1930) / PLUTO_EL.period) * 100}%`, height: 3, background: C.gold, boxShadow: '0 0 12px #f3c47c'}} />
					</div>
				</div>
				{/* C：1979–1999 */}
				<div style={{position: 'absolute', right: 110, top: 200, opacity: inside * (1 - rot), textAlign: 'right', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 92, lineHeight: 1, color: '#ffd0d6', textShadow: '0 0 30px rgba(255,84,104,0.8)'}}>1979—1999</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.ice, letterSpacing: '0.25em', marginTop: 16}}>比海王星更靠近太阳</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.35em', marginTop: 10}}>CLOSER TO THE SUN THAN NEPTUNE</div>
				</div>
				<div style={{position: 'absolute', right: 110, top: 730, opacity: side * (1 - rot), textAlign: 'right', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 64, color: C.goldHot, textShadow: '0 0 24px rgba(243,196,124,0.7)', lineHeight: 1}}>17°</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: C.iceDim, letterSpacing: '0.25em', marginTop: 10}}>轨道倾角 · 偏心率 0.25</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 8}}>29.7 AU — 49.3 AU</div>
				</div>
				{/* D：3 : 2 */}
				<div style={{position: 'absolute', left: 110, top: 360, opacity: appear(f, c3 + 10, 30), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 170, lineHeight: 1, color: C.ice, textShadow: '0 0 40px rgba(212,241,255,0.4)'}}>
						<span style={{color: C.blueHot, textShadow: '0 0 40px rgba(127,208,255,0.8)'}}>3</span>
						<span style={{color: C.iceDim, fontSize: 110, margin: '0 18px'}}>:</span>
						<span style={{color: C.goldHot, textShadow: '0 0 40px rgba(243,196,124,0.8)'}}>2</span>
					</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.ice, letterSpacing: '0.25em', marginTop: 20}}>轨道共振 · 永不相撞</div>
					<div style={{marginTop: 30, fontFamily: MONO, fontSize: 20, lineHeight: 2, letterSpacing: '0.1em'}}>
						<div style={{color: C.blueHot}}>
							NEPTUNE <span style={{fontSize: 34}}>{nLaps.toFixed(2)}</span> 圈
						</div>
						<div style={{color: C.goldHot}}>
							PLUTO&nbsp;&nbsp;&nbsp;<span style={{fontSize: 34}}>{pLaps.toFixed(2)}</span> 圈
						</div>
						<div style={{color: C.iceDim, fontSize: 13, letterSpacing: '0.3em'}}>{Math.round(resYears)} 年 · 随海王星旋转的视角</div>
					</div>
				</div>
				<div style={{position: 'absolute', left: CX + 26, top: CY - NEPTUNE_EL.a * K * 0.8 - 14, transform: 'translateY(-50%)', opacity: rot, fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: C.blueHot, letterSpacing: '0.25em', whiteSpace: 'nowrap'}}>
					海王星
				</div>
			</AbsoluteFill>
			{/* —— 音效 —— */}
			<Sfx name="whoosh_fast" at={12} vol={0.35} />
			<Sfx name="ticks" at={22} vol={0.22} dur={c1 - 52} />
			<Sfx name="chime" at={c1 - 30} vol={0.35} />
			<Sfx name="scan" at={c1 + 6} vol={0.25} dur={100} />
			<Sfx name="ticks" at={c1 + 6} vol={0.18} dur={100} />
			<Sfx name="blip" at={c1 + 104} vol={0.3} />
			<Sfx name="whoosh2" at={c2 + 26} vol={0.4} />
			<Sfx name="lock" at={c2 + 52} vol={0.4} />
			<Sfx name="impact_soft" at={c2 + 52} vol={0.35} />
			<Sfx name="whoosh" at={c3 + 14} vol={0.4} />
			<SfxSeq name="bead" vol={0.35} at={[1, 2, 3].map((k) => firstFrame((fr) => 495.6 * appear(fr, c3 + 20, dur - (c3 + 20) - 60, easeInOut), c3 + 20, dur, k * NEPTUNE_EL.period - 0.01))} rate={(i) => 1 + i * 0.12} />
			<SfxSeq name="chime" vol={0.3} at={[1, 2].map((k) => firstFrame((fr) => 495.6 * appear(fr, c3 + 20, dur - (c3 + 20) - 60, easeInOut), c3 + 20, dur, k * PLUTO_EL.period - 0.01))} />
			<Sfx name="shimmer" at={dur - 58} vol={0.35} />
		</SceneFrame>
	);
};
