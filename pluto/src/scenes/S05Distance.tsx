import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SunGlow} from '../components/Bodies';
import {SceneFrame, SceneProps, cueAt, cueEnd} from '../components/SceneFrame';
import {appear, easeInOut, fmtInt, lerp, pad2} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const PLANETS: [string, string, number][] = [
	['水星', 'MERCURY', 0.39],
	['金星', 'VENUS', 0.72],
	['地球', 'EARTH', 1],
	['火星', 'MARS', 1.52],
	['木星', 'JUPITER', 5.2],
	['土星', 'SATURN', 9.58],
	['天王星', 'URANUS', 19.2],
	['海王星', 'NEPTUNE', 30.05],
	['冥王星', 'PLUTO', 39.48],
];
const X0 = 150;
const X1 = 1760;
const AU_PX = (X1 - X0) / 39.48;
const LIGHT_MIN_PER_AU = 8.317; // minutes

const fmtLight = (min: number) => {
	const h = Math.floor(min / 60);
	const m = Math.floor(min % 60);
	const s = Math.floor((min * 60) % 60);
	return `${pad2(h)}:${pad2(m)}:${pad2(s)}`;
};

export const S05Distance: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const e1 = cueEnd(scene, 1);
	const c2 = cueAt(scene, 2);
	const draw = appear(f, 4, 50, easeInOut);
	const num = appear(f, 14, Math.max(30, c1 - 20), easeInOut);
	const toPanels = appear(f, c2 - 6, 36, easeInOut);
	const lineY = lerp(560, 330, toPanels);
	// light pulse travels during cue 1
	const lp = appear(f, c1, Math.max(40, e1 - c1 + 10), easeInOut);
	const lightAU = lp * 39.48;
	const lx = X0 + lightAU * AU_PX;
	const numberShown = num * 5_906_000_000;
	const panel = appear(f, c2 + 4, 30);
	return (
		<SceneFrame {...props} stars={{opacity: 0.35, drift: 0.04}}>
			<AbsoluteFill>
				<SunGlow x={X0 - 40} y={lineY} r={30} intensity={draw} />
				<svg width={1920} height={1080} style={{position: 'absolute'}}>
					<line x1={X0} y1={lineY} x2={X0 + (X1 - X0) * draw} y2={lineY} stroke={C.iceFaint} strokeWidth={1} />
					{PLANETS.map(([zh, en, au], i) => {
						const x = X0 + au * AU_PX;
						const a = appear(f, 8 + i * 4, 20);
						const isP = en === 'PLUTO';
						return (
							<g key={en} opacity={a}>
								<circle cx={x} cy={lineY} r={isP ? 6 : 3} fill={isP ? C.amber : C.ice} />
								{au > 4 || en === 'EARTH' ? (
									<line x1={x} x2={x} y1={lineY - 14} y2={lineY - 30} stroke={isP ? C.amber : C.iceFaint} />
								) : null}
							</g>
						);
					})}
					{/* light pulse */}
					{lp > 0 && lp < 1.001 ? (
						<g>
							<line x1={X0} x2={lx} y1={lineY} y2={lineY} stroke="url(#beam)" strokeWidth={2} />
							<circle cx={lx} cy={lineY} r={5} fill="#fff6e6" />
							<circle cx={lx} cy={lineY} r={16} fill="rgba(255,226,180,0.25)" />
						</g>
					) : null}
					<defs>
						<linearGradient id="beam" x1="0" x2="1">
							<stop offset="0%" stopColor="#ffe2b4" stopOpacity={0.05} />
							<stop offset="100%" stopColor="#ffe2b4" stopOpacity={0.85} />
						</linearGradient>
					</defs>
				</svg>
				{/* planet names (only the ones with room) */}
				{PLANETS.filter(([, en, au]) => au > 4 || en === 'EARTH').map(([zh, en, au], i) => (
					<div
						key={en}
						style={{
							position: 'absolute',
							left: X0 + au * AU_PX,
							top: lineY - 62,
							transform: 'translateX(-50%)',
							textAlign: 'center',
							opacity: appear(f, 20 + i * 5, 20),
							whiteSpace: 'nowrap',
						}}
					>
						<div style={{fontFamily: SERIF, fontSize: 16, letterSpacing: '0.2em', color: en === 'PLUTO' ? C.amber : C.ice}}>{zh}</div>
						<div style={{fontFamily: MONO, fontSize: 11, letterSpacing: '0.1em', color: C.iceDim, marginTop: 3}}>{au} AU</div>
					</div>
				))}
				{/* light-time checkpoints */}
				{(
					[
						['EARTH', 1, '8 分 19 秒'],
						['NEPTUNE', 30.05, '4 小时 10 分'],
						['PLUTO', 39.48, '5 小时 28 分'],
					] as [string, number, string][]
				).map(([en, au, t]) => {
					const reached = appear(f, c1 + (au / 39.48) * Math.max(40, e1 - c1 + 10), 14);
					return (
						<div
							key={en}
							style={{
								position: 'absolute',
								left: X0 + au * AU_PX,
								top: lineY + 34,
								transform: 'translateX(-50%)',
								fontFamily: SERIF,
								fontSize: 15,
								letterSpacing: '0.12em',
								color: en === 'PLUTO' ? C.amberHot : C.iceDim,
								opacity: reached * (1 - toPanels * 0.4),
								whiteSpace: 'nowrap',
							}}
						>
							{t}
						</div>
					);
				})}
				{/* big counters */}
				<div style={{position: 'absolute', left: 0, right: 0, top: lerp(250, 150, toPanels), textAlign: 'center', opacity: appear(f, 10, 24) * (1 - toPanels)}}>
					<div style={{fontFamily: MONO, fontSize: 76, color: C.ice, letterSpacing: '0.02em'}}>{fmtInt(numberShown)}</div>
					<div style={{fontFamily: SERIF, fontSize: 16, color: C.iceDim, letterSpacing: '0.4em', marginTop: 10}}>
						公里 · 平均日距 · KM FROM THE SUN
					</div>
				</div>
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 690,
						textAlign: 'center',
						opacity: appear(f, c1, 20) * (1 - toPanels),
					}}
				>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.4em'}}>光行时间 · LIGHT TIME</div>
					<div style={{fontFamily: MONO, fontSize: 46, color: C.amberHot, marginTop: 8}}>{fmtLight(lightAU * LIGHT_MIN_PER_AU)}</div>
				</div>

				{/* noon comparison panels */}
				{[
					{x: 330, zh: '地球 · 正午', en: 'EARTH · NOON', v: '1', sky: 'linear-gradient(180deg, #8fb6dc 0%, #c9dcec 70%, #e8eef2 100%)', sun: 1},
					{x: 1010, zh: '冥王星 · 正午', en: 'PLUTO · NOON', v: '≈ 1 / 1600', sky: 'linear-gradient(180deg, #0b1424 0%, #1f3150 62%, #4d4a5c 92%, #7a5f58 100%)', sun: 0.25},
				].map((p, i) => (
					<div key={i} style={{position: 'absolute', left: p.x, top: 440, width: 580, opacity: appear(f, c2 + 4 + i * 14, 30)}}>
						<div style={{position: 'relative', height: 300, background: p.sky, overflow: 'hidden', borderRadius: 4}}>
							<div
								style={{
									position: 'absolute',
									left: 400,
									top: 70,
									width: 60 * p.sun + 4,
									height: 60 * p.sun + 4,
									borderRadius: '50%',
									background: '#fffaf0',
									boxShadow: `0 0 ${80 * p.sun + 10}px ${30 * p.sun + 4}px rgba(255,248,230,${0.5 + p.sun * 0.4})`,
								}}
							/>
							<div style={{position: 'absolute', left: 0, right: 0, bottom: 0, height: 60, background: i === 0 ? '#9aa7ae' : '#1b1a22'}} />
						</div>
						<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 16}}>
							<div>
								<div style={{fontFamily: SERIF, fontSize: 20, color: C.ice, letterSpacing: '0.24em'}}>{p.zh}</div>
								<div style={{fontFamily: SERIF, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 4}}>{p.en}</div>
							</div>
							<div style={{fontFamily: MONO, fontSize: 26, color: i === 1 ? C.amber : C.ice}}>{p.v}</div>
						</div>
					</div>
				))}
				<div style={{position: 'absolute', left: 0, right: 0, top: 860, textAlign: 'center', opacity: panel * 0}} />
			</AbsoluteFill>
		</SceneFrame>
	);
};
