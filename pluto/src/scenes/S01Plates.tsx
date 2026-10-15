import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {Label} from '../components/Hud';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {appear, inOut, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const PW = 620;
const PH = 400;
const PLANET_A = [0.63, 0.44];
const PLANET_B = [0.668, 0.433];

/** 1930 年汤博使用的照相底片是“负片”：浅灰底、黑色星点 */
const Plate: React.FC<{x: number; y: number; which: 'A' | 'B'; scale?: number; opacity?: number}> = ({
	x,
	y,
	which,
	scale = 1,
	opacity = 1,
}) => {
	const stars = useMemo(
		() =>
			new Array(260).fill(0).map((_, i) => ({
				x: random(`pl-x-${i}`),
				y: random(`pl-y-${i}`),
				r: 0.5 + Math.pow(random(`pl-r-${i}`), 4) * 3.2,
				a: 0.45 + random(`pl-a-${i}`) * 0.55,
			})),
		[],
	);
	const p = which === 'A' ? PLANET_A : PLANET_B;
	return (
		<g transform={`translate(${x} ${y}) scale(${scale})`} opacity={opacity}>
			<rect x={-PW / 2 - 14} y={-PH / 2 - 14} width={PW + 28} height={PH + 28} fill="none" stroke={C.iceFaint} />
			<rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} fill="url(#plateGrad)" />
			{stars.map((s, i) => (
				<circle key={i} cx={-PW / 2 + s.x * PW} cy={-PH / 2 + s.y * PH} r={s.r} fill={C.plateInk} opacity={s.a} />
			))}
			<circle cx={-PW / 2 + p[0] * PW} cy={-PH / 2 + p[1] * PH} r={1.6} fill={C.plateInk} />
			<rect x={-PW / 2} y={-PH / 2} width={PW} height={PH} fill="url(#plateVig)" />
		</g>
	);
};

export const S01Plates: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const merge = appear(f, c2 - 10, 40);
	const blinkOn = f > c2 + 26;
	const showB = blinkOn && Math.floor((f - c2) / 11) % 2 === 1;
	const leftX = lerp(620, 960, merge);
	const rightX = lerp(1300, 960, merge);
	const sc = lerp(0.82, 1.18, merge);
	const y = 470;
	const reticle = appear(f, c2 + 60, 26);
	const pp = showB ? PLANET_B : PLANET_A;
	const px = 960 + (-PW / 2 + pp[0] * PW) * sc;
	const py = y + (-PH / 2 + pp[1] * PH) * sc;
	const intro = appear(f, 4, 30);
	return (
		<SceneFrame {...props} stars={{opacity: 0.35, drift: 0.05}} hudRight="LOWELL OBSERVATORY · FLAGSTAFF">
			<AbsoluteFill>
				<svg width={1920} height={1080}>
					<defs>
						<linearGradient id="plateGrad" x1="0" y1="0" x2="1" y2="1">
							<stop offset="0%" stopColor="#d6d9db" />
							<stop offset="100%" stopColor="#b9bec2" />
						</linearGradient>
						<radialGradient id="plateVig" cx="50%" cy="50%" r="70%">
							<stop offset="60%" stopColor="#000" stopOpacity={0} />
							<stop offset="100%" stopColor="#000" stopOpacity={0.35} />
						</radialGradient>
					</defs>
					{merge < 1 ? (
						<>
							<Plate x={leftX} y={y} which="A" scale={sc} opacity={intro * (1 - merge * 0.999)} />
							<Plate x={rightX} y={y} which="B" scale={sc} opacity={intro * (1 - merge)} />
						</>
					) : null}
					{merge > 0 ? <Plate x={960} y={y} which={showB ? 'B' : 'A'} scale={sc} opacity={merge} /> : null}
					{/* reticle on the moving dot */}
					<g opacity={reticle} transform={`translate(${px} ${py})`}>
						<circle r={lerp(70, 26, reticle)} fill="none" stroke={C.amber} strokeWidth={1.6} />
						<line x1={-44} x2={-32} y1={0} y2={0} stroke={C.amber} strokeWidth={1.4} />
						<line x1={32} x2={44} y1={0} y2={0} stroke={C.amber} strokeWidth={1.4} />
						<line y1={-44} y2={-32} x1={0} x2={0} stroke={C.amber} strokeWidth={1.4} />
						<line y1={32} y2={44} x1={0} x2={0} stroke={C.amber} strokeWidth={1.4} />
					</g>
				</svg>
				{/* plate captions */}
				<Label x={leftX - (PW / 2) * sc} y={y - (PH / 2) * sc - 44} zh="底片 A" en="PLATE · 1930.01.23" opacity={appear(f, c1, 20) * (1 - merge)} />
				<Label x={rightX - (PW / 2) * sc} y={y - (PH / 2) * sc - 44} zh="底片 B" en="PLATE · 1930.01.29" opacity={appear(f, c1 + 10, 20) * (1 - merge)} />
				<div
					style={{
						position: 'absolute',
						left: 960 - (PW / 2) * sc,
						top: y - (PH / 2) * sc - 64,
						opacity: merge * (blinkOn ? 1 : 0),
						display: 'flex',
						gap: 16,
						alignItems: 'baseline',
					}}
				>
					<span style={{fontFamily: MONO, fontSize: 22, color: showB ? C.amber : C.ice, letterSpacing: '0.1em'}}>
						{showB ? 'B · 01.29' : 'A · 01.23'}
					</span>
					<span style={{fontFamily: SERIF, fontSize: 16, color: C.iceDim, letterSpacing: '0.24em'}}>闪烁比较仪 BLINK COMPARATOR</span>
				</div>
				<Label x={px + 54} y={py - 6} zh="移动的光点" en="IT MOVED" color={C.amber} opacity={reticle * inOut(f, c2 + 70, scene.duration + 30)} />
				{/* opening dateline */}
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 150,
						textAlign: 'center',
						opacity: inOut(f, 2, c1 + 10, 24) * 0.9,
						fontFamily: MONO,
						fontSize: 16,
						letterSpacing: '0.5em',
						color: C.iceDim,
					}}
				>
					FLAGSTAFF, ARIZONA · 35.20°N 111.66°W
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
