import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SunGlow} from '../components/Bodies';
import {Label} from '../components/Hud';
import {SceneFrame, SceneProps, cueAt, cueEnd} from '../components/SceneFrame';
import {appear, easeInOut, inOut} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const CX = 960;
const CY = 480;
const S = 8.6; // px per AU
const A = 39.48;
const E = 0.2488;
const P_PLUTO = 247.94;
const P_NEP = 164.8;
const PERI_YEAR = 1989.7;
const PHI = (-35 * Math.PI) / 180; // direction of perihelion on screen
const R_NEP = 30.07;

/** 开普勒方程：给定年份，求冥王星在屏幕上的位置 */
const plutoAt = (year: number) => {
	const M = (2 * Math.PI * (year - PERI_YEAR)) / P_PLUTO;
	let En = M;
	for (let i = 0; i < 8; i++) En = En - (En - E * Math.sin(En) - M) / (1 - E * Math.cos(En));
	const nu = 2 * Math.atan2(Math.sqrt(1 + E) * Math.sin(En / 2), Math.sqrt(1 - E) * Math.cos(En / 2));
	const r = A * (1 - E * Math.cos(En));
	const ang = PHI - nu; // counter-clockwise on screen
	return {x: CX + r * S * Math.cos(ang), y: CY + r * S * Math.sin(ang), r};
};
const neptuneAt = (year: number) => {
	const ang = PHI - Math.PI / 2 - (2 * Math.PI * (year - PERI_YEAR)) / P_NEP;
	return {x: CX + R_NEP * S * Math.cos(ang), y: CY + R_NEP * S * Math.sin(ang)};
};

const orbitPath = (y0: number, y1: number, steps = 220) => {
	let d = '';
	for (let i = 0; i <= steps; i++) {
		const p = plutoAt(y0 + ((y1 - y0) * i) / steps);
		d += `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
	}
	return d;
};

const FULL = orbitPath(PERI_YEAR, PERI_YEAR + P_PLUTO, 400);
// inside-Neptune arc: 1979 → 1999
const INSIDE = orbitPath(1979.1, 1999.1, 60);

export const S06Orbit: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const e3 = cueEnd(scene, 3);
	const draw = appear(f, 4, 60, easeInOut);

	// phase A: one quick lap; phase B: 1930 → 2026; phase D: resonance
	let year: number;
	if (f < c1) year = interpolate(f, [10, Math.max(11, c1 - 6)], [1930, 1930 + P_PLUTO], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	else if (f < c3) year = interpolate(f, [c1 + 6, c1 + 6 + Math.max(50, c2 - c1 - 20)], [1930, 2026], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	else year = interpolate(f, [c3 + 4, Math.max(c3 + 60, e3)], [2026, 2026 + 3 * P_NEP], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	const p = plutoAt(year);
	const n = neptuneAt(f < c3 ? 2026 : year);
	const phaseB = inOut(f, c1, c3, 16);
	const phaseC = inOut(f, c2, c3 + 10, 16);
	const phaseD = appear(f, c3, 20);
	const lapA = inOut(f, 6, c1, 14);
	const trail = f >= c1 && f < c3 ? orbitPath(1930, Math.max(1930.01, year), 120) : '';
	const nepLaps = Math.max(0, (year - 2026) / P_NEP);
	const pluLaps = Math.max(0, (year - 2026) / P_PLUTO);
	const p1930 = plutoAt(1930);
	return (
		<SceneFrame {...props} stars={{opacity: 0.3, drift: 0.03}}>
			<AbsoluteFill>
				<SunGlow x={CX} y={CY} r={9} intensity={draw} />
				<svg width={1920} height={1080} style={{position: 'absolute'}}>
					{/* inner planets (faint) */}
					{[5.2, 9.58, 19.2].map((au) => (
						<circle key={au} cx={CX} cy={CY} r={au * S} fill="none" stroke={C.iceGhost} strokeDasharray="2 6" opacity={draw} />
					))}
					{/* Neptune orbit */}
					<circle
						cx={CX}
						cy={CY}
						r={R_NEP * S}
						fill="none"
						stroke="rgba(143,198,255,0.45)"
						strokeWidth={1.2}
						strokeDasharray={`${2 * Math.PI * R_NEP * S * draw} 9999`}
					/>
					{/* Pluto orbit */}
					<path d={FULL} fill="none" stroke={C.amberDim} strokeWidth={1.3} pathLength={1} strokeDasharray={`${draw} 2`} />
					{/* 1930→now trail */}
					{trail ? <path d={trail} fill="none" stroke={C.amber} strokeWidth={3} opacity={phaseB} /> : null}
					{/* inside Neptune */}
					<path d={INSIDE} fill="none" stroke={C.amberHot} strokeWidth={6} opacity={phaseC} strokeLinecap="round" />
					{phaseB > 0 ? <circle cx={p1930.x} cy={p1930.y} r={4} fill="none" stroke={C.ice} opacity={phaseB} /> : null}
					{/* bodies */}
					<circle cx={n.x} cy={n.y} r={6} fill={C.haze} opacity={draw} />
					<circle cx={n.x} cy={n.y} r={14} fill="rgba(143,198,255,0.18)" opacity={draw} />
					<circle cx={p.x} cy={p.y} r={6} fill={C.amberHot} />
					<circle cx={p.x} cy={p.y} r={16} fill="rgba(255,217,176,0.2)" />
				</svg>
				<Label x={n.x + 22} y={n.y} zh="海王星" en="NEPTUNE" opacity={draw * (1 - phaseD * 0.3)} size={0.85} />
				<Label x={p.x + 24} y={p.y + 4} zh="冥王星" en="PLUTO" color={C.amber} opacity={draw} size={0.85} />
				{phaseB > 0 ? <Label x={p1930.x - 16} y={p1930.y} zh="1930" align="right" opacity={phaseB} size={0.8} /> : null}

				{/* left column readouts */}
				<div style={{position: 'absolute', left: 120, top: 300, width: 360}}>
					<div style={{opacity: lapA}}>
						<div style={{fontFamily: MONO, fontSize: 84, color: C.ice}}>248</div>
						<div style={{fontFamily: SERIF, fontSize: 18, color: C.iceDim, letterSpacing: '0.3em'}}>年 · 一个冥王星年</div>
						<div style={{fontFamily: SERIF, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 6}}>ONE PLUTONIAN YEAR</div>
					</div>
					<div style={{position: 'absolute', top: 0, opacity: phaseB * (1 - phaseC * 0.6)}}>
						<div style={{fontFamily: MONO, fontSize: 84, color: C.amberHot}}>{Math.floor(Math.min(year, 2026))}</div>
						<div style={{fontFamily: SERIF, fontSize: 18, color: C.iceDim, letterSpacing: '0.3em'}}>
							已走过 <span style={{fontFamily: MONO, color: C.ice}}>{((Math.max(0, Math.min(year, 2026) - 1930) / P_PLUTO) * 100).toFixed(1)}%</span>
						</div>
						<div style={{fontFamily: SERIF, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 6}}>
							下一次回到原点：2178 年
						</div>
					</div>
					<div style={{position: 'absolute', top: 0, opacity: phaseD}}>
						<div style={{fontFamily: MONO, fontSize: 84, color: C.ice}}>3 : 2</div>
						<div style={{fontFamily: SERIF, fontSize: 18, color: C.iceDim, letterSpacing: '0.3em'}}>轨道共振 · RESONANCE</div>
						<div style={{display: 'flex', gap: 30, marginTop: 26}}>
							<div>
								<div style={{fontFamily: MONO, fontSize: 40, color: C.haze}}>{nepLaps.toFixed(2)}</div>
								<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.2em'}}>海王星 · 圈</div>
							</div>
							<div>
								<div style={{fontFamily: MONO, fontSize: 40, color: C.amber}}>{pluLaps.toFixed(2)}</div>
								<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.2em'}}>冥王星 · 圈</div>
							</div>
						</div>
					</div>
				</div>
				{/* inside-Neptune callout + tilt inset */}
				<div style={{position: 'absolute', right: 120, top: 300, width: 330, opacity: phaseC, textAlign: 'right'}}>
					<div style={{fontFamily: MONO, fontSize: 40, color: C.amberHot}}>1979 — 1999</div>
					<div style={{fontFamily: SERIF, fontSize: 18, color: C.ice, letterSpacing: '0.2em', marginTop: 8}}>比海王星更靠近太阳</div>
					<div style={{fontFamily: SERIF, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 6}}>CLOSER THAN NEPTUNE</div>
					<svg width={330} height={140} style={{marginTop: 34}}>
						<line x1={20} x2={310} y1={90} y2={90} stroke={C.iceFaint} />
						<line x1={20} x2={310} y1={90 + 44} y2={90 - 44} stroke={C.amber} transform="rotate(0)" />
						<path d="M 230 90 A 60 60 0 0 0 226 72" fill="none" stroke={C.ice} />
						<text x={250} y={80} fill={C.ice} fontFamily="Pluto Mono, monospace" fontSize={16}>
							17°
						</text>
						<text x={20} y={112} fill={C.iceDim} fontFamily="Pluto Serif, serif" fontSize={13} letterSpacing={2}>
							黄道面
						</text>
						<text x={20} y={28} fill={C.amber} fontFamily="Pluto Serif, serif" fontSize={13} letterSpacing={2}>
							冥王星轨道面 · 倾斜 17°
						</text>
					</svg>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.2em', marginTop: 10}}>
						偏心率 0.25 · 近日 29.7 AU · 远日 49.3 AU
					</div>
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
