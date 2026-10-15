import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** 深空底色 + 暗角 + 细颗粒 */
export const Backdrop: React.FC<{tint?: string}> = ({tint = 'rgba(40,70,120,0.16)'}) => (
	<AbsoluteFill
		style={{
			background: `radial-gradient(ellipse 80% 70% at 50% 45%, ${tint} 0%, rgba(0,0,0,0) 70%), ${C.bg}`,
		}}
	/>
);

export const Vignette: React.FC = () => {
	const frame = useCurrentFrame();
	const seed = Math.floor(frame / 2);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill
				style={{
					background: 'radial-gradient(ellipse 75% 70% at 50% 50%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.7) 100%)',
				}}
			/>
			<svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.07, mixBlendMode: 'screen'}}>
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves={2} seed={Math.floor(random(seed) * 1000)} />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};
