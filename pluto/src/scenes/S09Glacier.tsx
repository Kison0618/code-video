import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {appear, easeInOut, lerp} from '../lib/anim';
import {Pt, shrink, voronoi} from '../lib/voronoi';
import {C, MONO, SERIF} from '../theme';

const W = 2400;
const H = 1500;

export const S09Glacier: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const base = useMemo(
		() =>
			new Array(90).fill(0).map((_, i) => ({
				x: random(`g-x-${i}`) * W,
				y: random(`g-y-${i}`) * H,
				r: 10 + random(`g-r-${i}`) * 26,
				ph: random(`g-p-${i}`) * Math.PI * 2,
				sp: 0.006 + random(`g-s-${i}`) * 0.01,
				tone: random(`g-t-${i}`),
			})),
		[],
	);
	const churn = appear(f, c1, 40);
	const sites: Pt[] = base.map((b) => [
		b.x + Math.cos(b.ph + f * b.sp) * b.r * (0.25 + churn),
		b.y + Math.sin(b.ph + f * b.sp * 0.8) * b.r * (0.25 + churn),
	]);
	const cells = voronoi(sites, W, H);
	const show = appear(f, 0, 50, easeInOut);
	const tilt = lerp(62, 56, appear(f, 0, scene.duration));
	const glowLines = appear(f, c1 + 10, 40);
	const crater = appear(f, c2, 24);
	const mount = appear(f, c3 - 4, 60, easeInOut);
	const ridge = useMemo(() => {
		const pts: string[] = [];
		for (let i = 0; i <= 80; i++) {
			const x = (i / 80) * 1920;
			const y = 300 - (Math.pow(random(`m-${i}`), 1.6) * 110 + (i % 7 === 0 ? 60 : 0) + Math.sin(i * 0.9) * 18);
			pts.push(`${x.toFixed(0)},${y.toFixed(0)}`);
		}
		return pts.join(' ');
	}, []);
	return (
		<SceneFrame {...props} stars={{opacity: 0.25, drift: 0.02}} tint="rgba(90,130,180,0.12)" hudRight="SPUTNIK PLANITIA · 20°N 180°E">
			<AbsoluteFill style={{perspective: 1100, perspectiveOrigin: '50% 10%'}}>
				{/* the ice plain in perspective */}
				<div
					style={{
						position: 'absolute',
						left: (1920 - W) / 2,
						top: 140,
						width: W,
						height: H,
						transform: `rotateX(${tilt}deg)`,
						transformOrigin: '50% 0%',
						opacity: show,
						maskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.3) 100%)',
						WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 70%, rgba(0,0,0,0.3) 100%)',
					}}
				>
					<svg width={W} height={H}>
						<defs>
							<radialGradient id="ice" cx="50%" cy="40%" r="70%">
								<stop offset="0%" stopColor="#e9f1f8" stopOpacity={0.2} />
								<stop offset="100%" stopColor="#9fb9d4" stopOpacity={0.06} />
							</radialGradient>
						</defs>
						<rect width={W} height={H} fill="url(#ice)" />
						{cells.map((poly, i) => {
							if (poly.length < 3) return null;
							const inner = shrink(poly, sites[i], 0.93);
							const d = inner.map((p, k) => `${k === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ') + 'Z';
							const t = base[i].tone;
							return (
								<g key={i}>
									<path d={d} fill={`rgba(${200 + t * 40},${215 + t * 30},${232 + t * 20},${0.06 + t * 0.07})`} />
									<path d={d} fill="none" stroke={`rgba(200,225,250,${0.18 + glowLines * 0.35})`} strokeWidth={2} />
								</g>
							);
						})}
					</svg>
				</div>
				{/* far mountains on the horizon */}
				<svg width={1920} height={1080} style={{position: 'absolute', top: 0, opacity: mount}}>
					<defs>
						<linearGradient id="mt" x1="0" x2="0" y1="0" y2="1">
							<stop offset="0%" stopColor="#3b4656" />
							<stop offset="100%" stopColor="#0b0f16" />
						</linearGradient>
					</defs>
					<g transform={`translate(0 ${lerp(70, 0, mount)})`}>
						<polygon points={`0,360 ${ridge} 1920,360`} fill="url(#mt)" />
						<polyline points={ridge} fill="none" stroke="rgba(227,236,245,0.55)" strokeWidth={1.2} />
					</g>
				</svg>
				{/* readouts */}
				<div style={{position: 'absolute', left: 110, top: 400, opacity: appear(f, 14, 30)}}>
					<div style={{fontFamily: SERIF, fontSize: 40, color: C.ice, letterSpacing: '0.2em'}}>斯普特尼克平原</div>
					<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.4em', marginTop: 10}}>SPUTNIK PLANITIA</div>
					<div style={{display: 'flex', gap: 46, marginTop: 34}}>
						<div>
							<div style={{fontFamily: MONO, fontSize: 30, color: C.ice}}>N₂</div>
							<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.2em', marginTop: 6}}>氮冰</div>
						</div>
						<div>
							<div style={{fontFamily: MONO, fontSize: 30, color: C.ice}}>1,000 × 800</div>
							<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.2em', marginTop: 6}}>公里 · 大于法国本土</div>
						</div>
					</div>
				</div>
				<div style={{position: 'absolute', right: 110, top: 400, textAlign: 'right', opacity: glowLines * (1 - crater)}}>
					<div style={{fontFamily: SERIF, fontSize: 22, color: C.ice, letterSpacing: '0.24em'}}>冰下对流 · CONVECTION</div>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.2em', marginTop: 10}}>每个多边形宽约 20–40 公里</div>
				</div>
				<div style={{position: 'absolute', right: 110, top: 380, textAlign: 'right', opacity: crater * (1 - mount)}}>
					<div style={{fontFamily: MONO, fontSize: 96, color: C.amberHot, lineHeight: 1}}>0</div>
					<div style={{fontFamily: SERIF, fontSize: 18, color: C.ice, letterSpacing: '0.3em', marginTop: 12}}>陨石坑 · CRATERS</div>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.2em', marginTop: 10}}>表面年龄 &lt; 10,000,000 年</div>
				</div>
				<div style={{position: 'absolute', right: 110, top: 400, textAlign: 'right', opacity: mount}}>
					<div style={{fontFamily: SERIF, fontSize: 22, color: C.ice, letterSpacing: '0.24em'}}>水冰山脉 · WATER-ICE MOUNTAINS</div>
					<div style={{fontFamily: MONO, fontSize: 30, color: C.amber, marginTop: 14}}>−230 °C</div>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.2em', marginTop: 8}}>这样的低温下，水冰坚硬如岩石</div>
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
