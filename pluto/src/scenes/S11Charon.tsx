import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {Charon} from '../components/Bodies';
import {Label} from '../components/Hud';
import {Pluto} from '../components/Pluto';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {appear, easeInOut, inOut} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const BX = 1010;
const BY = 470;
const P_R = 90; // Pluto radius px
const BARY = 150; // barycentre offset from Pluto centre (outside Pluto!)
const CH_D = 360; // Charon distance from barycentre (not to scale)
const MOONS: [string, string, string, string][] = [
	['卡戎', 'Charon', '1978', '1,212 km'],
	['尼克斯', 'Nix', '2005', '~50 km'],
	['许德拉', 'Hydra', '2005', '~51 km'],
	['科伯罗斯', 'Kerberos', '2011', '~19 km'],
	['斯堤克斯', 'Styx', '2012', '~16 km'],
];

const SkyView: React.FC<{f: number; o: number}> = ({f, o}) => {
	const stars = useMemo(
		() =>
			new Array(260).fill(0).map((_, i) => ({
				r: 80 + random(`sk-r-${i}`) * 1500,
				a: random(`sk-a-${i}`) * Math.PI * 2,
				s: 0.5 + random(`sk-s-${i}`) * 1.4,
				o: 0.3 + random(`sk-o-${i}`) * 0.7,
			})),
		[],
	);
	const pole = {x: 420, y: 140};
	const rot = f * 0.0016;
	return (
		<AbsoluteFill style={{opacity: o}}>
			<svg width={1920} height={1080} style={{position: 'absolute'}}>
				{stars.map((s, i) => {
					const a = s.a + rot;
					const tail = 0.05;
					const x1 = pole.x + s.r * Math.cos(a - tail);
					const y1 = pole.y + s.r * Math.sin(a - tail);
					const x2 = pole.x + s.r * Math.cos(a);
					const y2 = pole.y + s.r * Math.sin(a);
					return (
						<path
							key={i}
							d={`M ${x1} ${y1} A ${s.r} ${s.r} 0 0 1 ${x2} ${y2}`}
							stroke="#dfeaff"
							strokeOpacity={s.o * 0.5}
							strokeWidth={s.s}
							fill="none"
						/>
					);
				})}
				{/* icy horizon */}
				<path d="M 0 800 L 160 770 L 300 790 L 470 740 L 610 780 L 820 760 L 990 790 L 1180 750 L 1360 775 L 1550 745 L 1730 772 L 1920 760 L 1920 1080 L 0 1080 Z" fill="#06080c" />
				<path d="M 0 800 L 160 770 L 300 790 L 470 740 L 610 780 L 820 760 L 990 790 L 1180 750 L 1360 775 L 1550 745 L 1730 772 L 1920 760" fill="none" stroke="rgba(227,236,245,0.35)" />
			</svg>
			<div style={{position: 'absolute', left: 1240, top: 330, transform: 'translate(-50%,-50%)'}}>
				<Charon size={230} />
			</div>
			<Label x={1240} y={500} zh="卡戎 · 永不落下" en="CHARON · NEVER SETS" align="center" color={C.ice} />
			<div style={{position: 'absolute', left: 1240, top: 560, transform: 'translateX(-50%)', textAlign: 'center', whiteSpace: 'nowrap'}}>
				<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.2em'}}>视直径约为地球上满月的 7 倍</div>
			</div>
		</AbsoluteFill>
	);
};

export const S11Charon: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const sys = inOut(f, 0, c2 + 10, 24);
	const sky = appear(f, c2 - 4, 36, easeInOut);
	const legend = appear(f, 20, 30);
	const lock = appear(f, c1, 30);
	const th = f * 0.0075 + 0.4;
	const px = BX - BARY * Math.cos(th);
	const py = BY - BARY * Math.sin(th);
	const cx = BX + CH_D * Math.cos(th);
	const cy = BY + CH_D * Math.sin(th);
	const deg = (th * 180) / Math.PI;
	return (
		<SceneFrame {...props} stars={{opacity: 0.45 * (1 - sky), drift: 0.03}}>
			<AbsoluteFill style={{opacity: sys}}>
				<svg width={1920} height={1080} style={{position: 'absolute'}}>
					{[1.75, 2.0, 2.4, 2.7].map((k, i) => (
						<circle key={i} cx={BX} cy={BY} r={CH_D * k * 0.62} fill="none" stroke={C.iceGhost} strokeDasharray="2 8" />
					))}
					<circle cx={BX} cy={BY} r={CH_D} fill="none" stroke={C.iceFaint} strokeDasharray="3 6" />
					<circle cx={BX} cy={BY} r={BARY} fill="none" stroke={C.amberDim} strokeDasharray="3 6" />
					{/* tidal lock tether: facing points */}
					<line x1={px} y1={py} x2={cx} y2={cy} stroke={C.amber} strokeOpacity={0.55 * lock} strokeDasharray="1 7" />
					{/* barycentre */}
					<g stroke={C.ice} strokeWidth={1.2}>
						<line x1={BX - 9} x2={BX + 9} y1={BY} y2={BY} />
						<line x1={BX} x2={BX} y1={BY - 9} y2={BY + 9} />
					</g>
				</svg>
				<div style={{position: 'absolute', left: px, top: py, transform: `translate(-50%,-50%) rotate(${deg + 90}deg)`}}>
					<Pluto size={(P_R * 2 * 220) / 200} atmosphere={0.15} />
				</div>
				<div style={{position: 'absolute', left: cx, top: cy, transform: `translate(-50%,-50%) rotate(${deg - 90}deg)`}}>
					<Charon size={92} />
				</div>
				<Label x={BX + 14} y={BY + 26} zh="质心 · 在冥王星之外" en="BARYCENTRE" size={0.75} opacity={appear(f, 30, 30)} />
				<Label x={cx + 60} y={cy} zh="卡戎" en="CHARON" size={0.85} />
				<div
					style={{
						position: 'absolute',
						left: 0,
						right: 0,
						top: 860,
						textAlign: 'center',
						fontFamily: SERIF,
						fontSize: 12,
						color: C.iceDim,
						letterSpacing: '0.4em',
						opacity: 0,
					}}
				/>
				{/* moons legend */}
				<div style={{position: 'absolute', left: 110, top: 320, opacity: legend}}>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.3em', marginBottom: 18}}>
						五颗卫星 · 发现年份
					</div>
					{MOONS.map(([zh, en, yr, d], i) => (
						<div
							key={en}
							style={{
								display: 'flex',
								alignItems: 'baseline',
								gap: 16,
								marginTop: 12,
								opacity: appear(f, 26 + i * 6, 20),
							}}
						>
							<span style={{fontFamily: MONO, fontSize: 16, color: i === 0 ? C.amber : C.iceDim, width: 50}}>{yr}</span>
							<span style={{fontFamily: SERIF, fontSize: i === 0 ? 24 : 18, color: i === 0 ? C.ice : C.iceDim, letterSpacing: '0.16em', width: 110}}>
								{zh}
							</span>
							<span style={{fontFamily: MONO, fontSize: 13, color: C.iceDim}}>{d}</span>
						</div>
					))}
					<div style={{fontFamily: SERIF, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 30, opacity: 0.8}}>
						示意图 · 距离未按比例
					</div>
				</div>
				<div style={{position: 'absolute', right: 110, top: 320, textAlign: 'right', opacity: lock}}>
					<div style={{fontFamily: MONO, fontSize: 44, color: C.ice}}>6.39 天</div>
					<div style={{fontFamily: SERIF, fontSize: 15, color: C.iceDim, letterSpacing: '0.24em', marginTop: 8}}>自转 = 卡戎公转</div>
					<div style={{fontFamily: SERIF, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 6}}>MUTUAL TIDAL LOCK</div>
				</div>
			</AbsoluteFill>
			<SkyView f={f} o={sky} />
		</SceneFrame>
	);
};
