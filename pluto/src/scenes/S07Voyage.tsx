import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt, cueEnd} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {Starfield} from '../components/Starfield';
import {plutoSample} from '../components/Pluto';
import {FxCanvas} from '../fx/Canvas';
import {Flare} from '../fx/Flare';
import {dot, glow, glowPath, rgba} from '../fx/glow';
import {drawSphere, fibSphere, plutoColor} from '../fx/sphere';
import {appear, easeInOut, fmtInt, inOut, lerp} from '../lib/anim';
import {C, MONO, RGB, SERIF} from '../theme';

const LAUNCH = Date.UTC(2006, 0, 19);
const JFLY = Date.UTC(2007, 1, 28);
const ARRIVE = Date.UTC(2015, 6, 14);
const fmtDate = (ms: number) => {
	const d = new Date(ms);
	return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
};
const N = 14; // 哈勃像素
const PIX = (() => {
	const out: {i: number; j: number; c: [number, number, number]; a: number}[] = [];
	for (let j = 0; j < N; j++)
		for (let i = 0; i < N; i++) {
			let r = 0, g = 0, b = 0, k = 0;
			for (let sy = 0; sy < 4; sy++)
				for (let sx = 0; sx < 4; sx++) {
					const s = plutoSample(((i + (sx + 0.5) / 4) / N) * 2 - 1, ((j + (sy + 0.5) / 4) / N) * 2 - 1);
					if (s) {
						r += s[0]; g += s[1]; b += s[2]; k++;
					}
				}
			if (k) out.push({i, j, c: [r / k, g / k, b / k], a: k / 16});
		}
	return out;
})();
const PL = fibSphere(12000, 'pluto-7');

export const S07Voyage: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const e3 = cueEnd(scene, 3);
	const dur = scene.duration;
	// A：模糊的哈勃像
	const hub = inOut(f, 6, c1 + 10, 20);
	const yearsBlind = appear(f, 20, c1 - 40, easeInOut);
	// B：发射
	const launch = inOut(f, c1 - 4, c2 + 20, 18);
	const rise = appear(f, c1 + 10, 70, easeInOut);
	// C/D：穿越 → 减速 → 冥王星
	const tf = appear(f, c2 - 6, c3 + 20 - (c2 - 6), easeInOut);
	const ms = lerp(LAUNCH, ARRIVE, tf);
	const arrive = appear(f, c3 - 10, Math.max(60, e3 - c3), easeInOut);
	const speedAt = (fr: number) => {
		const up = appear(fr, c2 - 10, 40);
		const down = appear(fr, c3 - 6, 70, easeInOut);
		return 3.4 * up * (1 - down) + 0.06;
	};
	const {travel, speed} = useMemo(() => {
		let t = 0;
		for (let k = 0; k < f; k++) t += speedAt(k);
		return {travel: t, speed: speedAt(f)};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [f, c2, c3]);
	const warpOn = appear(f, c2 - 16, 20);
	const sparks = useMemo(() => new Array(120).fill(0).map((_, i) => ({a: random(`sp-a${i}`), v: random(`sp-v${i}`), l: random(`sp-l${i}`)})), []);
	const R = lerp(6, 230, Math.pow(arrive, 1.6));
	const MILES = [
		{t: 0, d: '2006.01', zh: '发射', en: 'LAUNCH'},
		{t: (JFLY - LAUNCH) / (ARRIVE - LAUNCH), d: '2007.02', zh: '飞掠木星', en: 'JUPITER'},
		{t: 1, d: '2015.07', zh: '抵达冥王星', en: 'PLUTO'},
	];
	return (
		<SceneFrame {...props} stars={false} kicker="NEW HORIZONS · 2006—2015" hudRight={'ATLAS V 551\nSPEED ≈ 16 KM/S'}>
			<Starfield seed="s07a" count={600} opacity={(1 - warpOn) * 0.6 + 0.0} drift={0.05} />
			<Starfield seed="s07w" count={1500} travel={travel} streak={speed * 2.2} opacity={warpOn} />
			<FxCanvas
				draw={(ctx, fr) => {
					ctx.globalCompositeOperation = 'lighter';
					// ---------- A：哈勃像素 ----------
					if (hub > 0) {
						const S = 470;
						const x0 = 960 - S / 2;
						const y0 = 500 - S / 2;
						const cs = S / N;
						const scan = (fr * 6) % (S + 200) - 100;
						for (const p of PIX) {
							const x = x0 + p.i * cs;
							const y = y0 + p.j * cs;
							const flick = 0.8 + 0.2 * Math.sin(fr * 0.3 + p.i * 3 + p.j * 7);
							const near = Math.max(0, 1 - Math.abs(y + cs / 2 - y0 - scan) / 60);
							const a = hub * p.a * flick * (0.65 + near * 0.6) * appear(fr, 6 + (p.i + p.j) * 1.4, 14);
							ctx.globalAlpha = Math.min(1, a);
							ctx.fillStyle = rgba([Math.min(255, p.c[0] * 1.2), Math.min(255, p.c[1] * 1.1), p.c[2]], 1);
							ctx.fillRect(x + 2, y + 2, cs - 4, cs - 4);
							glow(ctx, x + cs / 2, y + cs / 2, cs * 1.2, [p.c[0], p.c[1], p.c[2]], a * 0.18);
						}
						// 扫描线
						glowPath(ctx, [[x0 - 40, y0 + scan], [x0 + S + 40, y0 + scan]], RGB.blue, {width: 1, a: 0.5 * hub, bloom: 10});
						// 准星
						ctx.globalAlpha = 0.5 * hub;
						ctx.strokeStyle = rgba(RGB.ice, 1);
						ctx.lineWidth = 1;
						for (const r of [290, 330]) {
							ctx.beginPath();
							ctx.arc(960, 500, r, 0, Math.PI * 2);
							ctx.setLineDash(r === 290 ? [2, 10] : [40, 30]);
							ctx.lineDashOffset = fr * (r === 290 ? 0.5 : -0.8);
							ctx.stroke();
						}
						ctx.setLineDash([]);
					}
					// ---------- B：发射 ----------
					if (launch > 0) {
						const ex = 1600;
						const ey = 1180;
						const pts: [number, number][] = [];
						for (let k = 0; k <= 60; k++) {
							const t = (k / 60) * rise;
							pts.push([ex - Math.sin(t * 1.6) * 300 * t, ey - t * 980]);
						}
						glowPath(ctx, pts, RGB.goldHot, {width: 3, a: launch, bloom: 30});
						const h = pts[pts.length - 1];
						glow(ctx, h[0], h[1], 160, RGB.goldHot, launch);
						glow(ctx, h[0], h[1], 30, RGB.white, launch);
						for (const s of sparks) {
							const age = ((fr * 0.04 + s.l) % 1);
							const ang = Math.PI / 2 + (s.a - 0.5) * 0.9;
							const d = age * 220 * (0.5 + s.v);
							dot(ctx, h[0] + Math.cos(ang) * d * 0.6, h[1] + Math.sin(ang) * d, 1.4, RGB.goldHot, launch * (1 - age) * rise);
						}
						// 地平线弧
						ctx.globalAlpha = 1;
						const g = ctx.createRadialGradient(1500, 2400, 1300, 1500, 2400, 1460);
						g.addColorStop(0, rgba(RGB.blue, 0));
						g.addColorStop(0.93, rgba(RGB.blue, 0.25 * launch * (1 - rise * 0.7)));
						g.addColorStop(1, rgba(RGB.blue, 0));
						ctx.fillStyle = g;
						ctx.fillRect(0, 700, 1920, 380);
					}
					// ---------- D：冥王星逼近 ----------
					if (arrive > 0) {
						drawSphere(ctx, {cx: 960, cy: 480, R, spin: 120 + fr * 0.1, tilt: 25, points: PL, color: plutoColor(0.3), size: lerp(0.6, 1.25, arrive), alpha: arrive, base: {c: [80, 50, 36], a: 0.6}, rim: {c: RGB.gold, a: 0.35}});
						glow(ctx, 960, 480, R * 2.2, RGB.gold, 0.12 * arrive);
					} else if (warpOn > 0) {
						// 远方的冥王星：一颗暖色的光点
						glow(ctx, 960, 480, 30 + tf * 30, RGB.gold, warpOn * (0.5 + tf * 0.5));
						dot(ctx, 960, 480, 2.5, RGB.goldHot, warpOn);
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			<AbsoluteFill>
				{/* A：85 年 */}
				<div style={{position: 'absolute', left: 110, top: 400, opacity: hub, whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>1930 → 2015</div>
					<div style={{fontFamily: MONO, fontSize: 150, lineHeight: 1, color: C.goldHot, textShadow: '0 0 40px rgba(243,196,124,0.6)', marginTop: 10}}>{Math.round(85 * yearsBlind)}</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.ice, letterSpacing: '0.3em', marginTop: 14}}>年 · 只是一团模糊的像素</div>
				</div>
				<div style={{position: 'absolute', right: 110, top: 560, opacity: hub * appear(f, 40, 20), textAlign: 'right', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: C.ice, letterSpacing: '0.2em'}}>哈勃空间望远镜</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 8}}>HUBBLE · BEST VIEW BEFORE 2015</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.gold, letterSpacing: '0.3em', marginTop: 8}}>{N} × {N} PX</div>
				</div>
				{/* B：发射日期 */}
				<div style={{position: 'absolute', left: 110, top: 400, opacity: launch, whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>LAUNCH · CAPE CANAVERAL</div>
					<div style={{fontFamily: MONO, fontSize: 110, lineHeight: 1, color: C.ice, textShadow: '0 0 30px rgba(212,241,255,0.4)', marginTop: 14}}>
						{'2006.01.19'.slice(0, Math.max(0, Math.floor((f - c1) / 2.5)))}
						<span style={{opacity: f % 20 < 10 ? 1 : 0, color: C.gold}}>▌</span>
					</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.ice, letterSpacing: '0.3em', marginTop: 18}}>新视野号 · 出发</div>
				</div>
				{/* C：日期与里程 */}
				{(() => {
					const a = inOut(f, c2 - 8, dur - 20, 16);
					if (a <= 0) return null;
					return (
						<>
							<div style={{position: 'absolute', left: 110, top: 300, opacity: a * (1 - arrive * 0.4), whiteSpace: 'nowrap'}}>
								<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.4em'}}>MISSION DATE · 日期</div>
								<div style={{fontFamily: MONO, fontSize: 64, color: C.ice, textShadow: '0 0 24px rgba(212,241,255,0.4)', marginTop: 8}}>{fmtDate(ms)}</div>
								<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.4em', marginTop: 30}}>DISTANCE FLOWN · 飞行距离</div>
								<div style={{fontFamily: MONO, fontSize: 64, color: C.goldHot, textShadow: '0 0 24px rgba(243,196,124,0.6)', marginTop: 8}}>
									{fmtInt(tf * 4_880_000_000)}
									<span style={{fontSize: 24, marginLeft: 12}}>KM</span>
								</div>
								<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.4em', marginTop: 30}}>ELAPSED · 航行时间</div>
								<div style={{fontFamily: MONO, fontSize: 40, color: C.ice, marginTop: 8}}>
									{((ms - LAUNCH) / (365.25 * 864e5)).toFixed(2)} <span style={{fontSize: 18, color: C.iceDim}}>年</span>
								</div>
							</div>
							{/* 里程碑进度条 */}
							<div style={{position: 'absolute', left: 480, top: 820, width: 960, height: 2, background: 'rgba(227,236,245,0.14)', opacity: a}}>
								<div style={{width: `${tf * 100}%`, height: 2, background: `linear-gradient(90deg, rgba(243,196,124,0.3), ${C.goldHot})`, boxShadow: '0 0 14px #f3c47c'}} />
								<div style={{position: 'absolute', left: `${tf * 100}%`, top: -5, width: 12, height: 12, marginLeft: -6, borderRadius: 6, background: '#fff', boxShadow: '0 0 20px #ffe4b0, 0 0 40px #f3c47c'}} />
								{MILES.map((m) => {
									const done = tf >= m.t - 0.001;
									return (
										<div key={m.d} style={{position: 'absolute', left: `${m.t * 100}%`, top: -46, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap', opacity: done ? 1 : 0.4}}>
											<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: done ? C.goldHot : C.ice, letterSpacing: '0.15em'}}>{m.zh}</div>
											<div style={{fontFamily: MONO, fontSize: 11, color: C.iceDim, letterSpacing: '0.2em', marginTop: 4}}>{m.d}</div>
										</div>
									);
								})}
							</div>
						</>
					);
				})()}
				{/* D：擦肩而过 */}
				<div style={{position: 'absolute', right: 110, top: 330, opacity: appear(f, c3 + 20, 24), textAlign: 'right', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.4em'}}>CLOSEST APPROACH · 最近距离</div>
					<div style={{fontFamily: MONO, fontSize: 72, color: C.goldHot, textShadow: '0 0 30px rgba(243,196,124,0.7)', marginTop: 8}}>12,500<span style={{fontSize: 26, marginLeft: 10}}>KM</span></div>
					<div style={{fontFamily: MONO, fontSize: 16, color: C.ice, letterSpacing: '0.2em', marginTop: 10}}>2015.07.14 · 11:49 UTC</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: C.iceDim, letterSpacing: '0.25em', marginTop: 16}}>不减速 · 不入轨 · 只有一次</div>
				</div>
			</AbsoluteFill>
			{launch > 0 ? <Flare x={1600 - Math.sin(rise * 1.6) * 300 * rise} y={1180 - rise * 980} size={30} intensity={launch * rise} streak={1.4} /> : null}
			{/* —— 音效 —— */}
			<Sfx name="scan" at={6} vol={0.3} dur={60} />
			<Sfx name="data" at={10} vol={0.15} dur={50} />
			<Sfx name="ticks" at={20} vol={0.2} dur={Math.max(10, c1 - 60)} />
			<Sfx name="riser" at={c1 + 10} vol={0.5} />
			<Sfx name="boom" at={c1 + 10} vol={0.75} />
			<Sfx name="sparkle" at={c1 + 14} vol={0.3} />
			<Sfx name="typing" at={c1 + 30} vol={0.3} dur={30} />
			<Sfx name="warp" at={c2 - 16} vol={0.55} fadeIn={10} dur={c3 + 20 - (c2 - 16)} />
			<Sfx name="ticks" at={c2} vol={0.15} dur={c3 - c2} />
			<Sfx name="swell" at={c3 + 20} vol={0.45} />
			<Sfx name="impact_soft" at={c3 + 20} vol={0.45} />
			<Sfx name="lock" at={c3 + 50} vol={0.4} />
		</SceneFrame>
	);
};
