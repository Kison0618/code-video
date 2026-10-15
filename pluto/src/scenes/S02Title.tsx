import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueEnd} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {Flare} from '../fx/Flare';
import {TextParticles} from '../fx/TextParticles';
import {appear, easeInOut, lerp} from '../lib/anim';
import {C, MONO, RGB, SERIF} from '../theme';

export const S02Title: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const t0 = cueEnd(scene, 0) - 6;
	const flareIn = appear(f, 0, 30);
	const burst = appear(f, t0 - 4, 14) * (1 - appear(f, t0 + 10, 40));
	const form = appear(f, t0, 70, easeInOut);
	const solid = appear(f, t0 + 55, 40);
	const sub = appear(f, t0 + 75, 40);
	const en = appear(f, t0 + 95, 40);
	const sweep = interpolate(f, [t0 + 60, t0 + 130], [-0.2, 1.2], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: easeInOut});
	const dotY = lerp(540, 690, appear(f, t0, 60, easeInOut));
	return (
		<SceneFrame {...props} stars={{opacity: 0.7, drift: 0.04}} tint="rgba(60,100,170,0.2)" warm={0.16}>
			{/* 那个光点 */}
			<Flare x={960} y={dotY} size={lerp(14, 22, burst)} intensity={flareIn * (1 - form * 0.55) + burst} streak={1.4} />
			<TextParticles
				text="冥王星"
				fontFamily={SERIF}
				fontWeight={600}
				fontSize={190}
				cx={960}
				cy={470}
				letterSpacing={80}
				gap={3}
				t={form}
				color={RGB.goldHot}
				glowColor={RGB.gold}
			/>
			<AbsoluteFill>
				<div style={{position: 'absolute', top: 470, left: 0, right: 0, transform: 'translateY(-50%)', textAlign: 'center'}}>
					<div
						style={{
							fontFamily: SERIF,
							fontWeight: 600,
							fontSize: 190,
							letterSpacing: 80,
							paddingLeft: 80,
							lineHeight: 1,
							color: '#fff6e6',
							opacity: solid * 0.92,
							textShadow: '0 0 40px rgba(255,210,150,0.55), 0 0 120px rgba(243,196,124,0.35)',
						}}
					>
						冥王星
					</div>
				</div>
				{/* 横向光条扫过 */}
				<div
					style={{
						position: 'absolute',
						top: 690,
						left: 960 - 700 * form,
						width: 1400 * form,
						height: 1.5,
						background: 'linear-gradient(90deg, rgba(243,196,124,0) 0%, rgba(255,228,176,0.95) 50%, rgba(243,196,124,0) 100%)',
						boxShadow: '0 0 18px 2px rgba(243,196,124,0.45)',
					}}
				/>
				<div style={{position: 'absolute', top: 728, left: 0, right: 0, textAlign: 'center'}}>
					<div
						style={{
							fontFamily: SERIF,
							fontWeight: 400,
							fontSize: 40,
							letterSpacing: `${interpolate(sub, [0, 1], [1.2, 0.8])}em`,
							paddingLeft: '0.8em',
							color: C.gold,
							opacity: sub,
							filter: `blur(${(1 - sub) * 8}px)`,
							textShadow: '0 0 24px rgba(243,196,124,0.6)',
						}}
					>
						远方的心
					</div>
					<div style={{marginTop: 22, fontFamily: MONO, fontSize: 14, letterSpacing: '0.7em', paddingLeft: '0.7em', color: C.iceDim, opacity: en}}>
						134340 PLUTO · A HEART AT THE EDGE OF THE SUN&apos;S REACH
					</div>
				</div>
			</AbsoluteFill>
			{/* —— 音效 —— */}
			<Sfx name="swell" at={t0} vol={0.5} />
			<Sfx name="riser" at={t0} vol={0.45} />
			<Sfx name="boom" at={t0} vol={0.85} />
			<Sfx name="shimmer" at={t0 + 4} vol={0.45} />
			<Sfx name="sparkle" at={t0 + 62} vol={0.35} />
			<Sfx name="blip_lo" at={t0 + 76} vol={0.3} />
		</SceneFrame>
	);
};
