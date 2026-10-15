import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt, cueEnd} from '../components/SceneFrame';
import {FxCanvas} from '../fx/Canvas';
import {glow} from '../fx/glow';
import {Flare} from '../fx/Flare';
import {appear, easeInOut, lerp} from '../lib/anim';
import {C, MONO, RGB, SERIF} from '../theme';

const LETTERS = ['P', 'L', 'U', 'T', 'O'];
const CX = 1190;
const CY = 470;

export const S03Name: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c0 = cueAt(scene, 0);
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const end2 = cueEnd(scene, 2);
	const card = appear(f, c0 + 4, 30);
	const cold = appear(f, c1, 50);
	const pl = appear(f, c2 + 10, 30);
	const lowell = appear(f, c2 + 30, 34);
	const merge = appear(f, end2 - 10, 46, easeInOut);
	const ring = appear(f, 0, 60, easeInOut);
	const gap = 165;
	const frost = useMemo(
		() => new Array(260).fill(0).map((_, i) => ({x: random(`fr-x-${i}`), y: random(`fr-y-${i}`), s: random(`fr-s-${i}`), v: 0.2 + random(`fr-v-${i}`) * 0.8})),
		[],
	);
	return (
		<SceneFrame {...props} stars={{opacity: 0.4, drift: 0.05}} tint={`rgba(${lerp(40, 70, cold)},${lerp(80, 120, cold)},${lerp(150, 200, cold)},0.24)`}>
			{/* 冥界之环：缓慢旋转的拉丁铭文 */}
			<svg width={1920} height={1080} style={{position: 'absolute', opacity: ring * (0.55 - pl * 0.25)}}>
				<defs>
					<path id="ringPath" d={`M ${CX - 360} ${CY} a 360 360 0 1 1 720 0 a 360 360 0 1 1 -720 0`} />
				</defs>
				<g transform={`rotate(${f * 0.08} ${CX} ${CY})`}>
					<text fontFamily={SERIF} fontSize={22} letterSpacing={9} fill={C.ice} fillOpacity={0.35}>
						<textPath href="#ringPath">PLVTO · DEVS INFERORVM · REX VMBRARVM · PLVTO · DEVS INFERORVM · REX VMBRARVM · </textPath>
					</text>
				</g>
				<g transform={`rotate(${-f * 0.12} ${CX} ${CY})`}>
					<circle cx={CX} cy={CY} r={322} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeDasharray="1 9" strokeWidth={6} />
					<circle cx={CX} cy={CY} r={300} fill="none" stroke={C.ice} strokeOpacity={0.12} />
				</g>
				<circle cx={CX} cy={CY} r={400} fill="none" stroke={C.ice} strokeOpacity={0.1} />
			</svg>
			{/* 寒冷：飘落的冰晶 */}
			<FxCanvas
				draw={(ctx, fr) => {
					if (cold <= 0) return;
					ctx.globalCompositeOperation = 'lighter';
					for (const p of frost) {
						const x = p.x * 1920 + Math.sin(fr * 0.01 + p.s * 10) * 30;
						const y = ((p.y * 1200 + fr * p.v * 0.8) % 1200) - 60;
						glow(ctx, x, y, 4 + p.s * 10, RGB.blueHot, cold * (1 - pl * 0.6) * 0.5 * p.v);
					}
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			<AbsoluteFill>
				{/* Venetia Burney 卡片 */}
				<div
					style={{
						position: 'absolute',
						left: 110,
						top: 330,
						width: 380,
						padding: '30px 34px',
						border: '1px solid rgba(243,196,124,0.28)',
						background: 'linear-gradient(135deg, rgba(243,196,124,0.10), rgba(20,26,40,0.35))',
						boxShadow: '0 0 60px rgba(243,196,124,0.08)',
						opacity: card * lerp(1, 0.4, pl),
						transform: `translateX(${(1 - card) * -24}px)`,
					}}
				>
					<div style={{fontFamily: MONO, fontSize: 13, letterSpacing: '0.3em', color: C.gold}}>1930.03.14 · OXFORD</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 34, color: C.ice, letterSpacing: '0.12em', marginTop: 18}}>维尼夏·伯尼</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 8}}>VENETIA BURNEY</div>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 14, marginTop: 22}}>
						<span style={{fontFamily: MONO, fontSize: 84, color: C.goldHot, textShadow: '0 0 30px rgba(243,196,124,0.6)', lineHeight: 1}}>11</span>
						<span style={{fontFamily: SERIF, fontSize: 20, color: C.iceDim, letterSpacing: '0.2em'}}>岁</span>
					</div>
					<div style={{fontFamily: SERIF, fontSize: 17, color: C.iceDim, letterSpacing: '0.1em', marginTop: 20, lineHeight: 1.8}}>
						早餐时听祖父读报，
						<br />
						提议用罗马冥界之神命名。
					</div>
				</div>
				{/* PLUTO 字母 */}
				{LETTERS.map((l, i) => {
					const a = appear(f, c0 + 16 + i * 6, 30);
					const isPL = i < 2;
					const hot = isPL ? pl : 0;
					const dim = isPL ? 1 : lerp(1, 0.1, pl);
					let x = CX + (i - 2) * gap;
					if (i === 0) x = lerp(x, CX - 40, merge);
					if (i === 1) x = lerp(x, CX - 4, merge);
					const color = hot > 0 ? '#fff0d6' : cold > 0 ? '#dcecff' : C.ice;
					const glowC = hot > 0 ? `0 0 ${40 * hot}px rgba(255,200,130,${0.9 * hot}), 0 0 ${120 * hot}px rgba(243,170,90,${0.5 * hot})` : `0 0 ${30 + 30 * cold}px rgba(150,200,255,${0.25 + 0.3 * cold})`;
					return (
						<div
							key={l}
							style={{
								position: 'absolute',
								left: x,
								top: CY,
								transform: `translate(-50%, -50%) scale(${lerp(1, 1.25, merge * (isPL ? 1 : 0))})`,
								fontFamily: SERIF,
								fontWeight: 400,
								fontSize: 210,
								color,
								opacity: a * dim * (i > 1 ? 1 - merge : 1),
								filter: `blur(${(1 - a) * 14}px)`,
								textShadow: glowC,
								lineHeight: 1,
							}}
						>
							{l}
						</div>
					);
				})}
				{pl > 0 ? (
					<>
						<Flare x={CX - 2 * gap * (1 - merge) - 40 * merge} y={CY - 80} size={16} intensity={pl * 0.8 * (1 - merge * 0.5)} streak={1.2} />
						<Flare x={lerp(CX - gap, CX - 4, merge)} y={CY + 80} size={12} intensity={pl * 0.6 * (1 - merge * 0.5)} streak={0.8} rays={false} />
					</>
				) : null}
				{/* 冥界之神 */}
				<div style={{position: 'absolute', left: CX, top: 640, transform: 'translateX(-50%)', textAlign: 'center', opacity: cold * (1 - pl), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: C.blueHot, letterSpacing: '0.5em', textShadow: '0 0 20px rgba(127,208,255,0.5)'}}>普路托 · 冥界之神</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.45em', marginTop: 12}}>ROMAN GOD OF THE UNDERWORLD</div>
				</div>
				{/* Percival Lowell */}
				<div style={{position: 'absolute', left: CX, top: 640, transform: 'translateX(-50%)', textAlign: 'center', opacity: lowell, whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: SERIF, fontSize: 44, letterSpacing: '0.3em', color: C.iceDim}}>
						<span style={{color: C.goldHot, textShadow: '0 0 24px rgba(243,196,124,0.8)'}}>P</span>ERCIVAL{' '}
						<span style={{color: C.goldHot, textShadow: '0 0 24px rgba(243,196,124,0.8)'}}>L</span>OWELL
					</div>
					<div style={{fontFamily: SERIF, fontSize: 18, color: C.iceDim, letterSpacing: '0.3em', marginTop: 14}}>珀西瓦尔·洛厄尔 · 洛厄尔天文台创始人</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.gold, letterSpacing: '0.4em', marginTop: 10, opacity: merge}}>♇ · THE PL MONOGRAM</div>
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
