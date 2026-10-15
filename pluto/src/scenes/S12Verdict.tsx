import React, {useMemo} from 'react';
import {AbsoluteFill, interpolate, random, useCurrentFrame} from 'remotion';
import {SunGlow} from '../components/Bodies';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {appear, easeInOut, fmtInt, inOut, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

/* ---------- A：日期 ---------- */
const DateCard: React.FC<{f: number; o: number}> = ({f, o}) => {
	const full = '2006.08.24';
	const n = Math.floor(interpolate(f, [8, 8 + full.length * 3], [0, full.length], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}));
	const caret = Math.floor(f / 8) % 2 === 0 ? 1 : 0.15;
	const sub = appear(f, 40, 30);
	return (
		<AbsoluteFill style={{opacity: o, justifyContent: 'center', alignItems: 'center'}}>
			<div style={{textAlign: 'center', marginTop: -60}}>
				<div style={{fontFamily: MONO, fontSize: 132, color: C.ice, letterSpacing: '0.06em', lineHeight: 1}}>
					{full.slice(0, n)}
					<span style={{opacity: n < full.length ? 1 : caret, color: C.amber}}>_</span>
				</div>
				<div style={{marginTop: 34, opacity: sub, fontFamily: MONO, fontSize: 16, letterSpacing: '0.5em', color: C.iceDim}}>
					PRAGUE · IAU GENERAL ASSEMBLY XXVI
				</div>
				<div style={{marginTop: 16, opacity: sub, fontFamily: SERIF, fontSize: 22, letterSpacing: '0.4em', color: C.ice}}>
					布拉格 · 国际天文学联合会第 26 届大会
				</div>
			</div>
		</AbsoluteFill>
	);
};

/* ---------- B：三条标准 + 柯伊伯带 ---------- */
const CRITERIA = [
	{zh: '围绕太阳运行', en: 'ORBITS THE SUN'},
	{zh: '质量足够大，自身引力使其接近圆球', en: 'ROUND UNDER ITS OWN GRAVITY'},
	{zh: '清空了轨道附近的区域', en: 'HAS CLEARED ITS NEIGHBOURHOOD'},
];

const Mark: React.FC<{ok: boolean; t: number}> = ({ok, t}) => (
	<svg width={34} height={34} viewBox="0 0 34 34">
		<circle cx={17} cy={17} r={15} fill="none" stroke={ok ? C.iceFaint : 'rgba(224,112,93,0.5)'} />
		{ok ? (
			<path d="M 10 17.5 L 15 22.5 L 24.5 12" fill="none" stroke={C.ice} strokeWidth={2} strokeDasharray={24} strokeDashoffset={24 * (1 - t)} strokeLinecap="round" />
		) : (
			<g stroke={C.red} strokeWidth={2.2} strokeLinecap="round">
				<line x1={11} y1={11} x2={11 + 12 * Math.min(1, t * 2)} y2={11 + 12 * Math.min(1, t * 2)} />
				<line x1={23} y1={11} x2={23 - 12 * Math.max(0, t * 2 - 1)} y2={11 + 12 * Math.max(0, t * 2 - 1)} />
			</g>
		)}
	</svg>
);

const BX = 1330;
const BY = 470;
const BRX = 420; // belt nominal radius (x)
const TILT = 0.34; // y squash

const Belt: React.FC<{f: number; o: number; crowd: number}> = ({f, o, crowd}) => {
	const pts = useMemo(
		() =>
			new Array(1100).fill(0).map((_, i) => {
				const u = random(`kb-r-${i}`);
				const g = (random(`kb-g-${i}`) + random(`kb-h-${i}`) + random(`kb-k-${i}`)) / 3; // ~gaussian
				return {
					r: 0.82 + (g - 0.5) * 0.7 + (u - 0.5) * 0.12,
					a: random(`kb-a-${i}`) * Math.PI * 2,
					s: 0.6 + random(`kb-s-${i}`) * 1.5,
					o: 0.25 + random(`kb-o-${i}`) * 0.6,
					z: (random(`kb-z-${i}`) - 0.5) * 0.18,
				};
			}),
		[],
	);
	const rot = f * 0.0011;
	const pa = 2.15 + rot * 1.05;
	const px = BX + BRX * 0.86 * Math.cos(pa);
	const py = BY + BRX * 0.86 * TILT * Math.sin(pa);
	const ring = appear(f, 10, 30);
	const pulse = 0.5 + 0.5 * Math.sin(f / 7);
	return (
		<AbsoluteFill style={{opacity: o}}>
			<SunGlow x={BX} y={BY} r={6} intensity={0.8} />
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{[0.39, 0.63].map((k, i) => (
					<ellipse key={i} cx={BX} cy={BY} rx={BRX * k} ry={BRX * k * TILT} fill="none" stroke={C.iceGhost} />
				))}
				<ellipse cx={BX} cy={BY} rx={BRX * 0.63} ry={BRX * 0.63 * TILT} fill="none" stroke={C.iceFaint} strokeDasharray="3 6" />
				{pts.map((p, i) => {
					const vis = i / pts.length < 0.25 + 0.75 * crowd ? 1 : 0;
					if (!vis) return null;
					const a = p.a + rot / Math.pow(p.r, 1.5);
					const x = BX + BRX * p.r * Math.cos(a);
					const y = BY + BRX * p.r * TILT * Math.sin(a) + p.z * BRX * 0.3;
					return <circle key={i} cx={x} cy={y} r={p.s} fill="#cfdcea" fillOpacity={p.o} />;
				})}
				<circle cx={px} cy={py} r={4.5} fill={C.amberHot} />
				<circle cx={px} cy={py} r={14 + 6 * pulse} fill="none" stroke={C.amber} strokeOpacity={0.8 * ring} />
				<line x1={px} y1={py - 22} x2={px} y2={py - 70} stroke={C.amberDim} strokeOpacity={ring} />
			</svg>
			<div style={{position: 'absolute', left: px, top: py - 80, transform: 'translate(-50%,-100%)', textAlign: 'center', opacity: ring, whiteSpace: 'nowrap'}}>
				<div style={{fontFamily: SERIF, fontSize: 20, color: C.amber, letterSpacing: '0.3em'}}>冥王星</div>
				<div style={{fontFamily: MONO, fontSize: 11, color: C.iceDim, letterSpacing: '0.3em', marginTop: 4}}>PLUTO</div>
			</div>
			<div style={{position: 'absolute', left: BX + BRX * 0.63 * 0.72, top: BY + BRX * 0.63 * TILT * 0.72 + 16, opacity: ring * 0.85, whiteSpace: 'nowrap'}}>
				<div style={{fontFamily: SERIF, fontSize: 13, color: C.iceDim, letterSpacing: '0.25em'}}>海王星轨道</div>
			</div>
			<div style={{position: 'absolute', left: BX, top: BY + BRX * 1.24 * TILT + 40, transform: 'translateX(-50%)', textAlign: 'center', opacity: appear(f, 20, 30) * crowd, whiteSpace: 'nowrap'}}>
				<div style={{fontFamily: SERIF, fontSize: 19, color: C.ice, letterSpacing: '0.35em'}}>柯伊伯带</div>
				<div style={{fontFamily: MONO, fontSize: 11, color: C.iceDim, letterSpacing: '0.35em', marginTop: 6}}>KUIPER BELT · 30–50 AU</div>
			</div>
		</AbsoluteFill>
	);
};

/* ---------- C：九大行星 ---------- */
const PLANETS: [string, string, number][] = [
	['水星', 'MERCURY', 9],
	['金星', 'VENUS', 15],
	['地球', 'EARTH', 16],
	['火星', 'MARS', 11],
	['木星', 'JUPITER', 46],
	['土星', 'SATURN', 39],
	['天王星', 'URANUS', 26],
	['海王星', 'NEPTUNE', 25],
	['冥王星', 'PLUTO', 6],
];
const ROW_Y = 560;
const px = (i: number) => 250 + i * 177.5;

const Row: React.FC<{f: number; o: number; t0: number; dim: number}> = ({f, o, t0, dim}) => {
	const strike = appear(f, t0 + 40, 24, easeInOut);
	const drop = appear(f, t0 + 62, 40, easeInOut);
	const relabel = appear(f, t0 + 84, 30);
	const pi = 8;
	return (
		<AbsoluteFill style={{opacity: o}}>
			<div style={{position: 'absolute', top: 300, left: 0, right: 0, textAlign: 'center', opacity: appear(f, t0, 30) * (1 - dim)}}>
				<div style={{fontFamily: SERIF, fontSize: 24, letterSpacing: '0.5em', color: C.ice}}>九大行星</div>
				<div style={{fontFamily: MONO, fontSize: 13, letterSpacing: '0.45em', color: C.iceDim, marginTop: 10}}>THE NINE PLANETS · 1930 — 2006</div>
			</div>
			<svg width={1920} height={1080} style={{position: 'absolute', opacity: 1 - dim * 0.55}}>
				<line x1={160} x2={1760} y1={ROW_Y} y2={ROW_Y} stroke={C.iceGhost} />
				{PLANETS.slice(0, 8).map(([, , r], i) => {
					const a = appear(f, t0 + i * 3, 20);
					return (
						<g key={i} opacity={a}>
							{i === 5 ? (
								<ellipse cx={px(i)} cy={ROW_Y} rx={r * 1.9} ry={r * 0.45} fill="none" stroke={C.iceDim} strokeWidth={2} transform={`rotate(-14 ${px(i)} ${ROW_Y})`} />
							) : null}
							<circle cx={px(i)} cy={ROW_Y} r={r} fill={i === 2 ? '#9ec3e6' : '#d7dfe8'} fillOpacity={i === 2 ? 0.9 : 0.78} />
						</g>
					);
				})}
				{/* Pluto: falls out of line */}
				<circle cx={px(pi)} cy={ROW_Y} r={14} fill="none" stroke={C.iceFaint} strokeDasharray="2 4" opacity={drop} />
				<circle cx={px(pi)} cy={lerp(ROW_Y, ROW_Y + 120, drop)} r={6} fill={C.amberHot} opacity={appear(f, t0 + 24, 20)} />
			</svg>
			{PLANETS.map(([zh, en], i) => {
				const isP = i === pi;
				const y = ROW_Y + 70 + (isP ? 120 * drop : 0);
				return (
					<div
						key={en}
						style={{
							position: 'absolute',
							left: px(i),
							top: y,
							transform: 'translateX(-50%)',
							textAlign: 'center',
							whiteSpace: 'nowrap',
							opacity: appear(f, t0 + i * 3 + 6, 20) * (isP ? 1 : 1 - dim * 0.55),
						}}
					>
						<div style={{fontFamily: SERIF, fontSize: 18, letterSpacing: '0.2em', color: isP ? C.amber : C.ice}}>{zh}</div>
						<div style={{position: 'relative', display: 'inline-block', marginTop: 6}}>
							<div style={{fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.25em', color: C.iceDim}}>{isP ? 'PLANET IX' : en}</div>
							{isP ? <div style={{position: 'absolute', left: -4, top: '50%', height: 1.5, width: `calc(${strike * 100}% + 8px)`, background: C.red}} /> : null}
						</div>
						{isP ? (
							<div style={{marginTop: 12, opacity: relabel, transform: `translateY(${(1 - relabel) * 8}px)`}}>
								<div style={{fontFamily: SERIF, fontSize: 20, letterSpacing: '0.3em', color: C.ice}}>矮行星</div>
								<div style={{fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.25em', color: C.amber, marginTop: 5}}>DWARF PLANET · 134340</div>
							</div>
						) : null}
					</div>
				);
			})}
		</AbsoluteFill>
	);
};

/* ---------- D：新视野号已在路上 ---------- */
const InFlight: React.FC<{f: number; t0: number}> = ({f, t0}) => {
	const o = appear(f, t0, 26);
	const days = interpolate(f, [t0 + 6, t0 + 60], [0, 217], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	return (
		<div style={{position: 'absolute', top: 230, left: 0, right: 0, textAlign: 'center', opacity: o}}>
			<div style={{fontFamily: SERIF, fontSize: 17, letterSpacing: '0.45em', color: C.iceDim}}>此时，新视野号已经飞行</div>
			<div style={{marginTop: 14, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 18}}>
				<span style={{fontFamily: MONO, fontSize: 96, color: C.amber, lineHeight: 1}}>{fmtInt(days)}</span>
				<span style={{fontFamily: SERIF, fontSize: 30, color: C.ice, letterSpacing: '0.2em'}}>天</span>
			</div>
			<div style={{marginTop: 16, fontFamily: MONO, fontSize: 13, letterSpacing: '0.4em', color: C.iceDim}}>2006.01.19 → 2006.08.24 · EN ROUTE</div>
		</div>
	);
};

export const S12Verdict: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const c4 = cueAt(scene, 4);
	const dateO = inOut(f, 0, c1 + 6, 16);
	const critO = inOut(f, c1 - 4, c3 + 8, 20);
	const beltO = inOut(f, c1 + 10, c3 + 8, 26);
	const crowd = appear(f, c2 - 6, 50, easeInOut);
	const rowO = appear(f, c3 - 2, 20);
	const dim = appear(f, c4 - 4, 24, easeInOut);
	return (
		<SceneFrame {...props} stars={{opacity: 0.35, drift: 0.03}} hudRight="IAU RESOLUTION 5A · 2006">
			<DateCard f={f} o={dateO} />
			<Belt f={f - c1} o={beltO} crowd={crowd} />
			<div style={{position: 'absolute', left: 120, top: 300, opacity: critO, width: 640}}>
				<div style={{fontFamily: SERIF, fontSize: 16, letterSpacing: '0.4em', color: C.iceDim, marginBottom: 6}}>行星的定义 · 三条标准</div>
				<div style={{fontFamily: MONO, fontSize: 11, letterSpacing: '0.35em', color: C.iceDim, opacity: 0.7, marginBottom: 30}}>
					DEFINITION OF A PLANET
				</div>
				{CRITERIA.map((c, i) => {
					const start = c1 + 10 + i * 16;
					const a = appear(f, start, 22);
					const ok = i < 2;
					const markT = ok ? appear(f, start + 10, 16) : appear(f, c2 + 6, 22, easeInOut);
					const fail = !ok ? appear(f, c2 + 6, 20) : 0;
					return (
						<div key={i} style={{display: 'flex', alignItems: 'center', gap: 22, marginBottom: 30, opacity: a, transform: `translateX(${(1 - a) * -14}px)`}}>
							<span style={{fontFamily: MONO, fontSize: 14, color: C.amber, width: 24}}>0{i + 1}</span>
							<div style={{flex: 1}}>
								<div style={{fontFamily: SERIF, fontSize: 24, letterSpacing: '0.12em', color: fail ? `rgba(224,112,93,${0.6 + 0.4 * fail})` : C.ice}}>{c.zh}</div>
								<div style={{fontFamily: MONO, fontSize: 11, letterSpacing: '0.28em', color: C.iceDim, marginTop: 6}}>{c.en}</div>
							</div>
							<Mark ok={ok} t={markT} />
						</div>
					);
				})}
			</div>
			{f >= c3 - 4 ? <Row f={f} o={rowO} t0={c3} dim={dim} /> : null}
			{f >= c4 - 4 ? <InFlight f={f} t0={c4} /> : null}
		</SceneFrame>
	);
};
