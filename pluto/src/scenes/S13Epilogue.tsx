import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SunGlow} from '../components/Bodies';
import {Pluto} from '../components/Pluto';
import {SceneFrame, SceneProps, cueAt, cueEnd} from '../components/SceneFrame';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

/* 真实的铭文（刻在新视野号上装骨灰的小容器上） */
const INSCRIPTION_1 =
	"Interned herein are remains of American Clyde W. Tombaugh, discoverer of Pluto and the solar system's \u201Cthird zone.\u201D";
const INSCRIPTION_2 =
	"Adelle and Muron's boy, Patricia's husband, Annette and Alden's father, astronomer, teacher, punster, and friend.";
const INSCRIPTION_ZH_1 = '此处安放着美国人克莱德·W·汤博的遗骸——冥王星与太阳系“第三区域”的发现者。';
const INSCRIPTION_ZH_2 = '阿黛尔和穆伦的儿子，帕特里夏的丈夫，安妮特和奥尔登的父亲；天文学家、老师、爱讲双关语的人，也是朋友。';

/* 冥王星的偏心轨道（示意） */
const OX = 960;
const OY = 450;
const ORX = 860;
const ORY = 250;
const SUN_X = OX - ORX * 0.25; // 焦点（e≈0.25）
const orbitPt = (a: number) => ({x: OX + ORX * Math.cos(a), y: OY + ORY * Math.sin(a)});

const typed = (s: string, f: number, start: number, cps: number) => {
	const n = Math.floor(interpolate(f, [start, start + (s.length / cps) * 30], [0, s.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	return s.slice(0, n);
};

const Orbit: React.FC<{f: number; o: number; nums: number}> = ({f, o, nums}) => {
	const a = 0.35 + f * 0.0009;
	const p = orbitPt(a);
	const trail = 0.9;
	const trailPath = (() => {
		const pts: string[] = [];
		for (let i = 0; i <= 40; i++) {
			const q = orbitPt(a - trail * (1 - i / 40));
			pts.push(`${i === 0 ? 'M' : 'L'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
		}
		return pts.join(' ');
	})();
	return (
		<AbsoluteFill style={{opacity: o}}>
			<SunGlow x={SUN_X} y={OY} r={5} intensity={0.75} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				<defs>
					<linearGradient id="ep-trail" gradientUnits="userSpaceOnUse" x1={orbitPt(a - trail).x} y1={orbitPt(a - trail).y} x2={p.x} y2={p.y}>
						<stop offset="0" stopColor={C.amber} stopOpacity={0} />
						<stop offset="1" stopColor={C.amber} stopOpacity={0.8} />
					</linearGradient>
				</defs>
				<ellipse cx={OX} cy={OY} rx={ORX} ry={ORY} fill="none" stroke={C.iceFaint} strokeDasharray="2 7" />
				<ellipse cx={SUN_X} cy={OY} rx={ORX * 0.62} ry={ORX * 0.62 * 0.29} fill="none" stroke={C.iceGhost} />
				<path d={trailPath} fill="none" stroke="url(#ep-trail)" strokeWidth={1.6} />
			</svg>
			<div style={{position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-50%)'}}>
				<Pluto size={54} atmosphere={0.3} />
			</div>
			<div style={{position: 'absolute', left: 120, top: 640, opacity: nums, display: 'flex', gap: 90}}>
				<div>
					<div style={{fontFamily: MONO, fontSize: 40, color: C.ice, letterSpacing: '0.04em'}}>5,900,000,000 km</div>
					<div style={{fontFamily: SERIF, fontSize: 16, color: C.iceDim, letterSpacing: '0.3em', marginTop: 8}}>距太阳 · 平均</div>
				</div>
				<div style={{opacity: appear(nums, 0.4, 0.6)}}>
					<div style={{fontFamily: MONO, fontSize: 40, color: C.amber, letterSpacing: '0.04em'}}>
						248 <span style={{fontFamily: SERIF, fontSize: 26}}>年</span>
					</div>
					<div style={{fontFamily: SERIF, fontSize: 16, color: C.iceDim, letterSpacing: '0.3em', marginTop: 8}}>绕太阳一圈</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

const Capsule: React.FC<{f: number; o: number; t0: number; t1: number}> = ({f, o, t0, t1}) => {
	const frame = appear(f, t0, 30, easeInOut);
	const t2 = t0 + 14 + (INSCRIPTION_1.length / 60) * 30 + 8;
	const typedEnd = t2 + (INSCRIPTION_2.length / 75) * 30;
	const zh = appear(f, Math.min(t1 - 6, typedEnd - 10), 36);
	const name = appear(f, t1 + 20, 40);
	const w = 1180;
	return (
		<AbsoluteFill style={{opacity: o}}>
			<div
				style={{
					position: 'absolute',
					left: 960 - w / 2,
					top: 200,
					width: w,
					padding: '48px 64px 44px',
					boxSizing: 'border-box',
					border: `1px solid rgba(233,185,143,${0.35 * frame})`,
					background: `rgba(10,12,18,${0.55 * frame})`,
				}}
			>
				{[
					[0, 0],
					[1, 0],
					[0, 1],
					[1, 1],
				].map(([x, y], i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: x ? undefined : -1,
							right: x ? -1 : undefined,
							top: y ? undefined : -1,
							bottom: y ? -1 : undefined,
							width: 18,
							height: 18,
							borderLeft: x ? undefined : `2px solid ${C.amber}`,
							borderRight: x ? `2px solid ${C.amber}` : undefined,
							borderTop: y ? undefined : `2px solid ${C.amber}`,
							borderBottom: y ? `2px solid ${C.amber}` : undefined,
							opacity: frame,
						}}
					/>
				))}
				<div style={{fontFamily: MONO, fontSize: 12, letterSpacing: '0.4em', color: C.amber, opacity: frame, marginBottom: 26}}>
					INSCRIPTION · NEW HORIZONS · LAUNCHED 2006.01.19
				</div>
				<div style={{fontFamily: MONO, fontSize: 22, lineHeight: 1.65, color: C.ice, minHeight: 74}}>
					{typed(INSCRIPTION_1, f, t0 + 14, 60)}
				</div>
				<div style={{fontFamily: MONO, fontSize: 17, lineHeight: 1.65, color: C.iceDim, marginTop: 14, minHeight: 56}}>
					{typed(INSCRIPTION_2, f, t2, 75)}
				</div>
				<div style={{height: 1, background: C.iceFaint, margin: '26px 0 22px', opacity: zh}} />
				<div style={{opacity: zh, fontFamily: SERIF, fontSize: 19, lineHeight: 1.8, color: C.ice, letterSpacing: '0.06em'}}>
					{INSCRIPTION_ZH_1}
					<div style={{color: C.iceDim, fontSize: 16}}>{INSCRIPTION_ZH_2}</div>
				</div>
			</div>
			<div style={{position: 'absolute', left: 960 + w / 2, top: 172, transform: 'translateX(-100%)', opacity: name, whiteSpace: 'nowrap'}}>
				<span style={{fontFamily: MONO, fontSize: 14, letterSpacing: '0.35em', color: C.amber}}>CLYDE W. TOMBAUGH · 1906 — 1997</span>
			</div>
		</AbsoluteFill>
	);
};

const EndCard: React.FC<{f: number; t0: number}> = ({f, t0}) => {
	const g = appear(f, t0, 60, easeInOut);
	const title = appear(f, t0 + 40, 50);
	const sub = appear(f, t0 + 80, 40);
	const credit = appear(f, t0 + 110, 40);
	const s = lerp(0.9, 1, g);
	return (
		<AbsoluteFill style={{opacity: g}}>
			<div style={{position: 'absolute', left: 960, top: 330, transform: `translate(-50%,-50%) scale(${s})`}}>
				<Pluto size={300} heartGlow={0.5 + 0.2 * Math.sin(f / 20)} atmosphere={0.35} spin={f * 0.04} />
			</div>
			<div style={{position: 'absolute', top: 540, left: 0, right: 0, textAlign: 'center'}}>
				<div
					style={{
						fontFamily: SERIF,
						fontWeight: 200,
						fontSize: 104,
						letterSpacing: '0.42em',
						paddingLeft: '0.42em',
						color: C.ice,
						opacity: title,
						filter: `blur(${(1 - title) * 10}px)`,
						lineHeight: 1,
					}}
				>
					冥王星
				</div>
				<div style={{marginTop: 26, fontFamily: SERIF, fontSize: 28, letterSpacing: '0.6em', paddingLeft: '0.6em', color: C.amber, opacity: sub}}>
					远方的心
				</div>
				<div style={{marginTop: 44, fontFamily: MONO, fontSize: 12, letterSpacing: '0.35em', color: C.iceDim, opacity: credit}}>
					DATA &amp; IMAGERY REFERENCE · NASA / JHUAPL / SwRI · IAU
				</div>
			</div>
		</AbsoluteFill>
	);
};

export const S13Epilogue: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const endVo = cueEnd(scene, 3);
	const tEnd = endVo + 50;
	const orbitO = Math.min(appear(f, 0, 30), 1 - 0.85 * appear(f, c2 - 6, 30, easeInOut)) * (1 - appear(f, tEnd - 20, 30));
	const nums = inOut(f, c1 + 4, c2 + 4, 20);
	const capO = inOut(f, c2 - 4, tEnd + 10, 30);
	return (
		<SceneFrame {...props} stars={{opacity: 0.5, drift: 0.025}} fadeOut={24} hudRight="NEW HORIZONS · STILL FLYING">
			<Orbit f={f} o={orbitO} nums={nums} />
			<Capsule f={f} o={capO} t0={c2} t1={c3} />
			<EndCard f={f} t0={tEnd} />
		</SceneFrame>
	);
};
