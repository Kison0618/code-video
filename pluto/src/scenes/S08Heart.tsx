import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {PixelPluto} from '../components/PixelPluto';
import {Pluto} from '../components/Pluto';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {appear, easeInOut, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const SIZE = 640;
const CX = 860;
const CY = 470;

export const S08Heart: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const arrive = appear(f, 0, 50, easeInOut);
	// resolution steps while approaching
	const steps = [6, 9, 14, 22, 34];
	const si = Math.min(steps.length - 1, Math.floor(interpolate(f, [10, Math.max(40, c1 - 10)], [0, steps.length - 0.01], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})));
	const n = steps[si];
	// downlink scan reveal
	const scan = appear(f, c1, 80, easeInOut);
	const scanY = -SIZE / 2 + scan * SIZE;
	const glow = appear(f, c1 + 80, 40) * (0.65 + 0.35 * Math.sin((f - c1) / 14));
	const label = appear(f, c1 + 96, 30);
	const size = lerp(380, SIZE, arrive);
	const hud = appear(f, 6, 24);
	return (
		<SceneFrame {...props} stars={{opacity: 0.5, drift: 0.06}} hudRight="NEW HORIZONS · LORRI">
			<AbsoluteFill>
				<div style={{position: 'absolute', left: CX, top: CY, transform: 'translate(-50%,-50%)', width: size, height: size}}>
					{/* pixel layer (below the scan line) */}
					<div style={{position: 'absolute', inset: 0, clipPath: `inset(${((scanY + SIZE / 2) / SIZE) * 100}% 0 0 0)`}}>
						<PixelPluto size={size} n={n} blur={0.6} />
					</div>
					{/* sharp layer (above the scan line) */}
					<div style={{position: 'absolute', inset: 0, clipPath: `inset(0 0 ${100 - ((scanY + SIZE / 2) / SIZE) * 100}% 0)`}}>
						<Pluto size={size} heartGlow={glow * 0.55} spin={(f - c1) * 0.02} atmosphere={0.25} />
					</div>
					{scan > 0 && scan < 1 ? (
						<div
							style={{
								position: 'absolute',
								left: -40,
								right: -40,
								top: ((scanY + SIZE / 2) / SIZE) * size,
								height: 2,
								background: 'linear-gradient(90deg, rgba(143,198,255,0), rgba(200,230,255,0.95), rgba(143,198,255,0))',
								boxShadow: '0 0 18px 4px rgba(143,198,255,0.35)',
							}}
						/>
					) : null}
				</div>
				{/* telemetry */}
				<div style={{position: 'absolute', left: 1360, top: 300, opacity: hud, width: 440}}>
					<div style={{fontFamily: MONO, fontSize: 13, letterSpacing: '0.3em', color: C.iceDim}}>CLOSEST APPROACH</div>
					<div style={{fontFamily: MONO, fontSize: 40, color: C.ice, marginTop: 10}}>2015.07.14</div>
					<div style={{fontFamily: MONO, fontSize: 22, color: C.iceDim, marginTop: 6}}>11:49 UTC</div>
					<div style={{height: 1, background: C.iceFaint, margin: '26px 0'}} />
					<div style={{fontFamily: MONO, fontSize: 32, color: C.ice}}>12,500 km</div>
					<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.3em', marginTop: 6}}>距冥王星表面</div>
					<div style={{fontFamily: MONO, fontSize: 18, color: C.iceDim, marginTop: 22, opacity: scan > 0 ? 1 : 0.4}}>
						DOWNLINK {scan >= 1 ? 'COMPLETE' : `${Math.floor(scan * 100)}%`}
					</div>
				</div>
				{/* heart callout */}
				<svg width={1920} height={1080} style={{position: 'absolute', opacity: label}}>
					<line x1={CX + 110} y1={CY + 95} x2={CX + 330} y2={CY + 250} stroke={C.amber} strokeWidth={1.2} />
					<line x1={CX + 330} y1={CY + 250} x2={CX + 500} y2={CY + 250} stroke={C.amber} strokeWidth={1.2} />
					<circle cx={CX + 110} cy={CY + 95} r={4} fill={C.amberHot} />
				</svg>
				<div style={{position: 'absolute', left: CX + 512, top: CY + 250, transform: 'translateY(-50%)', opacity: label}}>
					<div style={{fontFamily: SERIF, fontSize: 26, color: C.amberHot, letterSpacing: '0.24em'}}>汤博区</div>
					<div style={{fontFamily: SERIF, fontSize: 13, color: C.iceDim, letterSpacing: '0.34em', marginTop: 6}}>TOMBAUGH REGIO · 宽约 1,600 km</div>
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
