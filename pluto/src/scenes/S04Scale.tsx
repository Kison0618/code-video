import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Moon} from '../components/Bodies';
import {Label} from '../components/Hud';
import {Pluto} from '../components/Pluto';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {appear, easeInOut, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const COLS = 25;
const ROWS = 20; // 500 cells → 1 cell = 0.2%

export const S04Scale: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const a0 = appear(f, 6, 40);
	const b = appear(f, c1 - 6, 40, easeInOut);
	const c = appear(f, c2 - 8, 40, easeInOut);

	// sizes: Pluto 2377 km, Moon 3474 km
	const plutoSize = lerp(320, 240, b) * lerp(1, 0.62, c);
	const moonSize = 240 * (3474 / 2377) * lerp(1, 0.62, c);
	const plutoX = lerp(960, 740, b) - 360 * c;
	const moonX = lerp(1200, 1110, b) - 520 * c;
	const cy = lerp(480, 470, b) + 0 * c;
	const moonA = appear(f, c1 + 4, 30);
	const dims = appear(f, c1 + 24, 30) * (1 - c);
	const ratio = appear(f, c1 + 44, 30) * (1 - c);

	const gridA = appear(f, c2 + 6, 24);
	const cell = 22;
	const gap = 6;
	const gx = 1000;
	const gy = 240;
	const fillUpTo = Math.floor(appear(f, c2 + 10, 50) * COLS * ROWS);
	const hot = appear(f, c2 + 50, 20);

	return (
		<SceneFrame {...props} stars={{opacity: 0.4, drift: 0.05}}>
			<AbsoluteFill>
				<div style={{position: 'absolute', left: plutoX, top: cy, transform: 'translate(-50%,-50%)', opacity: a0}}>
					<Pluto size={plutoSize} spin={f * 0.02} />
				</div>
				<div style={{position: 'absolute', left: moonX, top: cy, transform: 'translate(-50%,-50%)', opacity: moonA}}>
					<Moon size={moonSize} />
				</div>
				<Label x={plutoX} y={cy - plutoSize / 2 - 46} zh="冥王星" en="PLUTO" align="center" opacity={a0} />
				<Label x={moonX} y={cy - moonSize / 2 - 46} zh="月球" en="THE MOON" align="center" opacity={moonA} />
				{/* dimension lines */}
				<svg width={1920} height={1080} style={{position: 'absolute', opacity: dims}}>
					{[
						[plutoX, plutoSize],
						[moonX, moonSize],
					].map(([x, s], i) => (
						<g key={i} stroke={C.iceFaint}>
							<line x1={x - s / 2} x2={x + s / 2} y1={cy + 170} y2={cy + 170} />
							<line x1={x - s / 2} x2={x - s / 2} y1={cy + 162} y2={cy + 178} />
							<line x1={x + s / 2} x2={x + s / 2} y1={cy + 162} y2={cy + 178} />
						</g>
					))}
				</svg>
				<Label x={plutoX} y={cy + 206} value="2,377 km" align="center" size={0.8} opacity={dims} />
				<Label x={moonX} y={cy + 206} value="3,474 km" align="center" size={0.8} opacity={dims} />
				<div
					style={{
						position: 'absolute',
						left: (plutoX + moonX) / 2,
						top: 196,
						transform: 'translateX(-50%)',
						textAlign: 'center',
						opacity: ratio,
					}}
				>
					<div style={{fontFamily: MONO, fontSize: 64, color: C.amber}}>68%</div>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.3em', marginTop: 4}}>
						冥王星直径 ÷ 月球直径
					</div>
				</div>

				{/* mass grid: Earth = 500 cells */}
				<svg width={1920} height={1080} style={{position: 'absolute', opacity: gridA}}>
					{new Array(COLS * ROWS).fill(0).map((_, i) => {
						const col = i % COLS;
						const row = Math.floor(i / COLS);
						const x = gx + col * (cell + gap);
						const y = gy + row * (cell + gap);
						const isPluto = i === COLS * ROWS - 1;
						const filled = i < fillUpTo;
						return (
							<rect
								key={i}
								x={x}
								y={y}
								width={cell}
								height={cell}
								fill={isPluto ? C.amber : filled ? 'rgba(143,198,255,0.20)' : 'none'}
								stroke={isPluto ? C.amberHot : 'rgba(227,236,245,0.16)'}
								opacity={isPluto ? hot : 1}
							/>
						);
					})}
					{hot > 0 ? (
						<circle
							cx={gx + (COLS - 1) * (cell + gap) + cell / 2}
							cy={gy + (ROWS - 1) * (cell + gap) + cell / 2}
							r={lerp(60, 22, hot)}
							fill="none"
							stroke={C.amber}
							opacity={hot}
						/>
					) : null}
				</svg>
				<Label x={gx} y={gy - 50} zh="地球的质量 = 500 格" en="EARTH'S MASS = 500 CELLS" opacity={gridA} />
				<Label
					x={gx + COLS * (cell + gap) - gap}
					y={gy + ROWS * (cell + gap) + 40}
					zh="冥王星 ≈ 1 格"
					en="PLUTO ≈ 1 CELL · 0.22%"
					align="right"
					color={C.amber}
					opacity={hot}
				/>
			</AbsoluteFill>
		</SceneFrame>
	);
};
