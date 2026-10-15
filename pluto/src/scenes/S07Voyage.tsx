import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {Label} from '../components/Hud';
import {PixelPluto} from '../components/PixelPluto';
import {SceneFrame, SceneProps, cueAt, cueEnd} from '../components/SceneFrame';
import {appear, easeInOut, fmtInt, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const EARTH = {x: 230, y: 640};
const JUP = {x: 720, y: 430};
const PLU = {x: 1660, y: 470};
const LAUNCH = Date.UTC(2006, 0, 19);
const JFLY = Date.UTC(2007, 1, 28);
const ARRIVE = Date.UTC(2015, 6, 14);

const quad = (a: {x: number; y: number}, c: {x: number; y: number}, b: {x: number; y: number}, t: number) => ({
	x: (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * c.x + t * t * b.x,
	y: (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * c.y + t * t * b.y,
});
const C1 = {x: 380, y: 430};
const C2 = {x: 1180, y: 380};
const posAt = (u: number) => {
	// u: 0..1 of path; first leg = 0..0.32
	if (u < 0.32) return quad(EARTH, C1, JUP, u / 0.32);
	return quad(JUP, C2, PLU, (u - 0.32) / 0.68);
};

const fmtDate = (ms: number) => {
	const d = new Date(ms);
	return `${d.getUTCFullYear()}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${String(d.getUTCDate()).padStart(2, '0')}`;
};

export const S07Voyage: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const e3 = cueEnd(scene, 3);
	const hub = appear(f, 4, 30);
	const toMap = appear(f, c1 - 10, 40, easeInOut);
	const tf = appear(f, c1 + 10, Math.max(60, e3 - c1 - 10), easeInOut); // time fraction
	const ms = lerp(LAUNCH, ARRIVE, tf);
	// map time → path fraction (Jupiter flyby at 13.3 months)
	const jf = (JFLY - LAUNCH) / (ARRIVE - LAUNCH);
	const u = tf < jf ? (tf / jf) * 0.32 : 0.32 + ((tf - jf) / (1 - jf)) * 0.68;
	const craft = posAt(u);
	const trail: string[] = [];
	for (let i = 0; i <= 80; i++) {
		const q = posAt((u * i) / 80);
		trail.push(`${i === 0 ? 'M' : 'L'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
	}
	const full: string[] = [];
	for (let i = 0; i <= 120; i++) {
		const q = posAt(i / 120);
		full.push(`${i === 0 ? 'M' : 'L'} ${q.x.toFixed(1)} ${q.y.toFixed(1)}`);
	}
	const plutoSize = lerp(420, 46, toMap);
	const px = lerp(960, PLU.x, toMap);
	const py = lerp(470, PLU.y, toMap);
	const jupA = appear(f, c1 + 10 + jf * Math.max(60, e3 - c1 - 10), 20);
	const km = tf * 4_880_000_000;
	return (
		<SceneFrame {...props} stars={{opacity: 0.4, drift: 0.05}}>
			<AbsoluteFill>
				{/* Hubble-like blurry Pluto */}
				<div style={{position: 'absolute', left: px, top: py, transform: 'translate(-50%,-50%)', opacity: hub}}>
					<PixelPluto size={plutoSize} n={9} blur={lerp(10, 1, toMap)} />
				</div>
				<div style={{position: 'absolute', left: 0, right: 0, top: 730, textAlign: 'center', opacity: hub * (1 - toMap)}}>
					<div style={{fontFamily: SERIF, fontSize: 20, color: C.ice, letterSpacing: '0.3em'}}>哈勃空间望远镜眼中的冥王星</div>
					<div style={{fontFamily: SERIF, fontSize: 12, color: C.iceDim, letterSpacing: '0.4em', marginTop: 8}}>
						PLUTO AS SEEN BY THE HUBBLE SPACE TELESCOPE · SIMULATED
					</div>
				</div>
				{/* trajectory */}
				<svg width={1920} height={1080} style={{position: 'absolute', opacity: toMap}}>
					<path d={full.join(' ')} fill="none" stroke={C.iceFaint} strokeDasharray="3 7" />
					<path d={trail.join(' ')} fill="none" stroke={C.ice} strokeWidth={1.6} />
					<circle cx={EARTH.x} cy={EARTH.y} r={7} fill="#6fa8e8" />
					<circle cx={JUP.x} cy={JUP.y} r={13} fill="#c9a37d" opacity={0.9} />
					<circle cx={JUP.x} cy={JUP.y} r={30} fill="none" stroke={C.amberDim} opacity={jupA} />
					{tf > 0 ? (
						<g>
							<circle cx={craft.x} cy={craft.y} r={18} fill="rgba(227,236,245,0.15)" />
							<circle cx={craft.x} cy={craft.y} r={4} fill="#ffffff" />
						</g>
					) : null}
				</svg>
				<Label x={EARTH.x} y={EARTH.y + 46} zh="地球" en="EARTH · 2006.01.19" align="center" opacity={toMap} size={0.85} />
				<Label x={JUP.x} y={JUP.y - 60} zh="木星引力弹弓" en="JUPITER FLYBY · 2007.02.28" align="center" opacity={toMap * jupA} size={0.85} />
				<Label x={PLU.x} y={PLU.y + 60} zh="冥王星" en="PLUTO · 2015.07.14" align="center" color={C.amber} opacity={toMap} size={0.85} />
				{tf > 0.02 ? (
					<Label x={craft.x + 24} y={craft.y - 30} zh="新视野号" en="NEW HORIZONS" opacity={toMap * (1 - appear(f, e3 - 10, 20))} size={0.8} />
				) : null}
				{/* counters */}
				<div style={{position: 'absolute', left: 0, right: 0, top: 170, display: 'flex', justifyContent: 'center', gap: 120, opacity: toMap}}>
					<div style={{textAlign: 'center'}}>
						<div style={{fontFamily: MONO, fontSize: 50, color: C.ice}}>{fmtDate(ms)}</div>
						<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.4em', marginTop: 8}}>任务日期 · MISSION DATE</div>
					</div>
					<div style={{textAlign: 'center'}}>
						<div style={{fontFamily: MONO, fontSize: 50, color: C.amberHot}}>{fmtInt(km)}</div>
						<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.4em', marginTop: 8}}>飞行距离 KM · DISTANCE FLOWN</div>
					</div>
				</div>
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 790,
						textAlign: 'center',
						fontFamily: SERIF,
						fontSize: 14,
						color: C.iceDim,
						letterSpacing: '0.3em',
						opacity: interpolate(tf, [0.85, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
					}}
				>
					相对速度约 14 km/s · 无法减速，没有第二次机会
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
