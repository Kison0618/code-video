import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {Pluto} from '../components/Pluto';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {appear, easeInOut, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const CX = 960;
const CY = 480;
const R = 270;

export const S10Haze: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const turn = appear(f, 6, Math.max(40, c1 - 6), easeInOut); // lit → night side
	const ring = appear(f, c1 - 4, 60, easeInOut);
	const labels = appear(f, c2 + 4, 30);
	const breathe = 0.85 + 0.15 * Math.sin(f / 22);
	const size = (R * 2 * 220) / 200;
	const sunX = CX - R * 0.62;
	const sunY = CY - R * 0.79;
	return (
		<SceneFrame {...props} stars={{opacity: 0.55, drift: 0.03}} tint="rgba(40,80,140,0.1)" hudRight="NEW HORIZONS · DEPARTURE">
			<AbsoluteFill>
				{/* haze layers */}
				<svg width={1920} height={1080} style={{position: 'absolute'}}>
					<defs>
						<filter id="hz" x="-30%" y="-30%" width="160%" height="160%">
							<feGaussianBlur stdDeviation={3} />
						</filter>
						<filter id="hz2" x="-30%" y="-30%" width="160%" height="160%">
							<feGaussianBlur stdDeviation={16} />
						</filter>
						<radialGradient id="sunSide" cx={sunX} cy={sunY} r={R * 2.2} gradientUnits="userSpaceOnUse">
							<stop offset="0%" stopColor="#bfe0ff" stopOpacity={1} />
							<stop offset="55%" stopColor="#8fc6ff" stopOpacity={0.55} />
							<stop offset="100%" stopColor="#6fa8e8" stopOpacity={0.12} />
						</radialGradient>
					</defs>
					<g opacity={ring * breathe}>
						<circle cx={CX} cy={CY} r={R + 14} fill="none" stroke="url(#sunSide)" strokeWidth={26} filter="url(#hz2)" opacity={0.6} />
						{new Array(20).fill(0).map((_, i) => (
							<circle
								key={i}
								cx={CX}
								cy={CY}
								r={R + 1 + i * 1.6}
								fill="none"
								stroke="url(#sunSide)"
								strokeWidth={0.9}
								opacity={(1 - i / 20) * (i % 3 === 0 ? 0.9 : 0.45)}
								filter={i < 4 ? 'url(#hz)' : undefined}
							/>
						))}
					</g>
				</svg>
				<div style={{position: 'absolute', left: CX, top: CY, transform: `translate(-50%,-50%) rotate(${lerp(0, 20, turn)}deg)`}}>
					<Pluto size={size} silhouette={lerp(0, 0.97, turn)} atmosphere={0} spin={-f * 0.03} />
				</div>
				{/* the faraway Sun peeking from behind the limb */}
				<div style={{position: 'absolute', left: sunX, top: sunY, width: 0, height: 0, opacity: ring}}>
					<div
						style={{
							position: 'absolute',
							left: -60,
							top: -60,
							width: 120,
							height: 120,
							borderRadius: '50%',
							background: 'radial-gradient(circle, rgba(255,250,240,0.95) 0%, rgba(200,230,255,0.35) 18%, rgba(143,198,255,0) 60%)',
						}}
					/>
					<div style={{position: 'absolute', left: -160, top: -0.5, width: 320, height: 1, background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.7), rgba(255,255,255,0))'}} />
				</div>
				{/* labels */}
				<svg width={1920} height={1080} style={{position: 'absolute', opacity: labels}}>
					<line x1={CX + R * 0.74} y1={CY - R * 0.74} x2={CX + 330} y2={CY - 250} stroke={C.haze} strokeOpacity={0.7} />
					<line x1={CX + 330} y1={CY - 250} x2={CX + 470} y2={CY - 250} stroke={C.haze} strokeOpacity={0.7} />
				</svg>
				<div style={{position: 'absolute', left: CX + 486, top: CY - 250, transform: 'translateY(-50%)', opacity: labels}}>
					<div style={{fontFamily: SERIF, fontSize: 24, color: C.haze, letterSpacing: '0.24em'}}>雾霾层 · 20 多层</div>
					<div style={{fontFamily: SERIF, fontSize: 12, color: C.iceDim, letterSpacing: '0.34em', marginTop: 6}}>LAYERED HAZE</div>
				</div>
				<div style={{position: 'absolute', left: 130, top: 640, opacity: labels}}>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.3em'}}>主要成分 · MAINLY</div>
					<div style={{fontFamily: MONO, fontSize: 40, color: C.ice, marginTop: 8}}>N₂</div>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.3em', marginTop: 28}}>表面气压 · SURFACE PRESSURE</div>
					<div style={{fontFamily: MONO, fontSize: 40, color: C.ice, marginTop: 8}}>
						≈ 1 / 100,000 <span style={{fontFamily: SERIF, fontSize: 18, color: C.iceDim}}>地球</span>
					</div>
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
