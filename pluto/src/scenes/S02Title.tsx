import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueEnd} from '../components/SceneFrame';
import {appear, lerp} from '../lib/anim';
import {C, MONO, SERIF} from '../theme';

export const S02Title: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const t0 = cueEnd(scene, 0) + 4;
	const dot = appear(f, 0, 30);
	const line = appear(f, t0, 50);
	const title = appear(f, t0 + 10, 45);
	const sub = appear(f, t0 + 38, 40);
	const en = appear(f, t0 + 56, 40);
	const pulse = 0.75 + 0.25 * Math.sin(f / 9);
	const dotY = lerp(540, 600, line);
	return (
		<SceneFrame {...props} stars={{opacity: 0.6, drift: 0.04}} tint="rgba(60,90,140,0.12)">
			<AbsoluteFill>
				{/* the point of light */}
				<div
					style={{
						position: 'absolute',
						left: 960,
						top: dotY,
						width: 0,
						height: 0,
					}}
				>
					<div
						style={{
							position: 'absolute',
							width: 180,
							height: 180,
							left: -90,
							top: -90,
							borderRadius: '50%',
							background: `radial-gradient(circle, rgba(255,226,190,${0.5 * dot * pulse}) 0%, rgba(255,210,170,0.0) 60%)`,
						}}
					/>
					<div
						style={{
							position: 'absolute',
							width: 6,
							height: 6,
							left: -3,
							top: -3,
							borderRadius: '50%',
							background: C.amberHot,
							boxShadow: `0 0 12px 3px rgba(255,217,176,${0.8 * dot})`,
							opacity: dot,
						}}
					/>
				</div>
				{/* horizon line */}
				<div
					style={{
						position: 'absolute',
						top: 600,
						left: 960 - 520 * line,
						width: 1040 * line,
						height: 1,
						background: `linear-gradient(90deg, rgba(233,185,143,0) 0%, rgba(233,185,143,0.8) 50%, rgba(233,185,143,0) 100%)`,
					}}
				/>
				<div style={{position: 'absolute', top: 360, left: 0, right: 0, textAlign: 'center'}}>
					<div
						style={{
							fontFamily: MONO,
							fontSize: 14,
							letterSpacing: '0.8em',
							color: C.iceDim,
							opacity: en,
							marginBottom: 28,
						}}
					>
						134340 · PLUTO
					</div>
					<div
						style={{
							fontFamily: SERIF,
							fontWeight: 200,
							fontSize: 150,
							letterSpacing: `${interpolate(title, [0, 1], [0.7, 0.42])}em`,
							paddingLeft: '0.42em',
							color: C.ice,
							opacity: title,
							filter: `blur(${(1 - title) * 14}px)`,
							textShadow: '0 0 40px rgba(180,210,255,0.25)',
							lineHeight: 1,
						}}
					>
						冥王星
					</div>
				</div>
				<div style={{position: 'absolute', top: 640, left: 0, right: 0, textAlign: 'center'}}>
					<div
						style={{
							fontFamily: SERIF,
							fontSize: 34,
							letterSpacing: '0.6em',
							paddingLeft: '0.6em',
							color: C.amber,
							opacity: sub,
							filter: `blur(${(1 - sub) * 6}px)`,
						}}
					>
						远方的心
					</div>
					<div
						style={{
							marginTop: 20,
							fontFamily: SERIF,
							fontSize: 14,
							letterSpacing: '0.7em',
							paddingLeft: '0.7em',
							color: C.iceDim,
							opacity: en,
						}}
					>
						A HEART AT THE EDGE OF THE SUN'S REACH
					</div>
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
