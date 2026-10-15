import React from 'react';
import {random, useCurrentFrame} from 'remotion';

/** RGB 分离 + 切片抖动的故障效果；amount 0..1 */
export const Glitch: React.FC<{amount: number; children: React.ReactNode; style?: React.CSSProperties}> = ({amount, children, style}) => {
	const f = useCurrentFrame();
	if (amount <= 0.001) return <div style={style}>{children}</div>;
	const k = Math.floor(f / 2);
	const off = (random(`g-${k}`) - 0.5) * 16 * amount;
	const slices = [0, 1, 2].map((i) => ({
		top: random(`gs-${k}-${i}`) * 90,
		h: 4 + random(`gh-${k}-${i}`) * 18,
		dx: (random(`gd-${k}-${i}`) - 0.5) * 60 * amount,
	}));
	return (
		<div style={{position: 'relative', ...style}}>
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${off}px)`, mixBlendMode: 'screen', filter: 'drop-shadow(0 0 0 red)', opacity: 0.8 * amount, color: '#ff3355'}}>
				{children}
			</div>
			<div style={{position: 'absolute', inset: 0, transform: `translateX(${-off}px)`, mixBlendMode: 'screen', opacity: 0.8 * amount, color: '#33e0ff'}}>{children}</div>
			<div style={{position: 'relative'}}>{children}</div>
			{slices.map((s, i) => (
				<div
					key={i}
					style={{
						position: 'absolute',
						inset: 0,
						clipPath: `inset(${s.top}% 0 ${Math.max(0, 100 - s.top - s.h)}% 0)`,
						transform: `translateX(${s.dx}px)`,
						opacity: amount,
					}}
				>
					{children}
				</div>
			))}
		</div>
	);
};
