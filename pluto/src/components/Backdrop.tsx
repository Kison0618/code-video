import React from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {C} from '../theme';

/** 深空底色 + 缓慢漂移的星云光斑 */
export const Backdrop: React.FC<{tint?: string; warm?: number}> = ({tint = 'rgba(40,80,150,0.22)', warm = 0.12}) => {
	const f = useCurrentFrame();
	const dx = Math.sin(f / 240) * 40;
	const dy = Math.cos(f / 300) * 30;
	return (
		<AbsoluteFill
			style={{
				background: [
					`radial-gradient(ellipse 55% 45% at ${30 + dx / 20}% ${35 + dy / 20}%, ${tint} 0%, rgba(0,0,0,0) 70%)`,
					`radial-gradient(ellipse 45% 40% at ${78 - dx / 25}% ${72 - dy / 25}%, rgba(243,170,90,${warm}) 0%, rgba(0,0,0,0) 70%)`,
					`radial-gradient(ellipse 90% 80% at 50% 50%, #0a1020 0%, ${C.bg} 70%)`,
				].join(','),
			}}
		/>
	);
};

export const Vignette: React.FC = () => {
	const frame = useCurrentFrame();
	const seed = Math.floor(frame / 2);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			<AbsoluteFill style={{background: 'radial-gradient(ellipse 72% 68% at 50% 50%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.75) 100%)'}} />
			<svg width="100%" height="100%" style={{position: 'absolute', opacity: 0.06, mixBlendMode: 'screen'}}>
				<filter id="grain">
					<feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves={2} seed={Math.floor(random(seed) * 1000)} />
					<feColorMatrix type="saturate" values="0" />
				</filter>
				<rect width="100%" height="100%" filter="url(#grain)" />
			</svg>
		</AbsoluteFill>
	);
};
