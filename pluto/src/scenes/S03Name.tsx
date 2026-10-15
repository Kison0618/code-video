import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt, cueEnd} from '../components/SceneFrame';
import {appear, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

const LETTERS = ['P', 'L', 'U', 'T', 'O'];

export const S03Name: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c0 = cueAt(scene, 0);
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const end2 = cueEnd(scene, 2);
	const card = appear(f, c0, 30);
	const cold = appear(f, c1, 40);
	const pl = appear(f, c2 + 10, 30);
	const lowell = appear(f, c2 + 30, 34);
	const merge = appear(f, end2 - 6, 40);
	const sym = appear(f, end2 + 20, 30);
	const cx = 1180;
	const gap = 150;
	return (
		<SceneFrame {...props} stars={{opacity: 0.45, drift: 0.05}}>
			<AbsoluteFill>
				{/* Venetia Burney card */}
				<div
					style={{
						position: 'absolute',
						left: 150,
						top: 330,
						width: 360,
						padding: '28px 30px',
						borderLeft: `1px solid ${C.amberDim}`,
						opacity: card * lerp(1, 0.35, pl),
						transform: `translateX(${(1 - card) * -20}px)`,
					}}
				>
					<div style={{fontFamily: MONO, fontSize: 13, letterSpacing: '0.3em', color: C.amber}}>1930.03.14 · OXFORD</div>
					<div style={{fontFamily: SERIF, fontSize: 30, color: C.ice, letterSpacing: '0.12em', marginTop: 18}}>维尼夏·伯尼</div>
					<div style={{fontFamily: SERIF, fontSize: 14, color: C.iceDim, letterSpacing: '0.3em', marginTop: 8}}>VENETIA BURNEY</div>
					<div style={{display: 'flex', alignItems: 'baseline', gap: 12, marginTop: 26}}>
						<span style={{fontFamily: MONO, fontSize: 54, color: C.ice}}>11</span>
						<span style={{fontFamily: SERIF, fontSize: 18, color: C.iceDim, letterSpacing: '0.2em'}}>岁 · 小学生</span>
					</div>
					<div style={{fontFamily: SERIF, fontSize: 16, color: C.iceDim, letterSpacing: '0.12em', marginTop: 22, lineHeight: 1.7}}>
						早餐时听祖父读报，
						<br />
						提议用罗马神话中的冥界之神命名。
					</div>
				</div>

				{/* PLUTO letters */}
				{LETTERS.map((l, i) => {
					const a = appear(f, c0 + 16 + i * 7, 30);
					const isPL = i < 2;
					const hot = isPL ? pl : 0;
					const dim = isPL ? 1 : lerp(1, 0.14, pl);
					let x = cx + (i - 2) * gap;
					if (i === 1) x = lerp(x, cx - 2 * gap + 18, merge);
					if (i === 0) x = lerp(x, cx - 2 * gap, 0);
					const color = hot > 0 ? C.amberHot : cold > 0 ? 'rgb(206,222,240)' : C.ice;
					return (
						<div
							key={l}
							style={{
								position: 'absolute',
								left: x,
								top: 470,
								transform: 'translate(-50%, -50%)',
								fontFamily: SERIF,
								fontWeight: 200,
								fontSize: 190,
								color,
								opacity: a * dim * (i > 1 ? 1 - merge * 0.9 : 1),
								filter: `blur(${(1 - a) * 10}px)`,
								textShadow: hot > 0 ? `0 0 ${30 * hot}px rgba(255,200,150,${0.7 * hot})` : `0 0 ${24 * cold}px rgba(150,190,255,${0.3 * cold})`,
								lineHeight: 1,
							}}
						>
							{l}
						</div>
					);
				})}
				{/* underworld caption */}
				<div
					style={{
						position: 'absolute',
						left: cx,
						top: 620,
						transform: 'translateX(-50%)',
						textAlign: 'center',
						opacity: cold * (1 - pl),
					}}
				>
					<div style={{fontFamily: SERIF, fontSize: 22, color: C.ice, letterSpacing: '0.4em'}}>普路托 · 冥界之神</div>
					<div style={{fontFamily: SERIF, fontSize: 13, color: C.iceDim, letterSpacing: '0.4em', marginTop: 10}}>
						ROMAN GOD OF THE UNDERWORLD
					</div>
				</div>
				{/* Percival Lowell */}
				<div
					style={{
						position: 'absolute',
						left: cx,
						top: 620,
						transform: 'translateX(-50%)',
						textAlign: 'center',
						opacity: lowell * (1 - sym),
						whiteSpace: 'nowrap',
					}}
				>
					<div style={{fontFamily: SERIF, fontSize: 40, letterSpacing: '0.28em', color: C.iceDim}}>
						<span style={{color: C.amberHot}}>P</span>ERCIVAL <span style={{color: C.amberHot}}>L</span>OWELL
					</div>
					<div style={{fontFamily: SERIF, fontSize: 17, color: C.iceDim, letterSpacing: '0.3em', marginTop: 14}}>
						珀西瓦尔·洛厄尔 · 洛厄尔天文台创始人 · 1855–1916
					</div>
				</div>
				<div
					style={{
						position: 'absolute',
						left: cx,
						top: 640,
						transform: 'translateX(-50%)',
						textAlign: 'center',
						opacity: sym,
						whiteSpace: 'nowrap',
					}}
				>
					<div style={{fontFamily: SERIF, fontSize: 20, color: C.ice, letterSpacing: '0.3em'}}>P 与 L 叠在一起，就是冥王星的天文符号</div>
					<div style={{fontFamily: SERIF, fontSize: 13, color: C.iceDim, letterSpacing: '0.4em', marginTop: 10}}>
						THE PL MONOGRAM · PLUTO'S ASTRONOMICAL SYMBOL
					</div>
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
