import React from 'react';
import {useCurrentFrame} from 'remotion';

/** 镜头光斑：核心 + 光晕 + 横向变形光条 + 星芒 */
export const Flare: React.FC<{
	x: number;
	y: number;
	size?: number;
	color?: string; // r,g,b
	intensity?: number;
	streak?: number;
	rays?: boolean;
	pulse?: boolean;
}> = ({x, y, size = 60, color = '255,214,160', intensity = 1, streak = 1, rays = true, pulse = true}) => {
	const f = useCurrentFrame();
	const k = intensity * (pulse ? 0.9 + 0.1 * Math.sin(f / 7) : 1);
	if (k <= 0.002) return null;
	const s = size;
	return (
		<div style={{position: 'absolute', left: x, top: y, width: 0, height: 0, mixBlendMode: 'screen', pointerEvents: 'none'}}>
			<div
				style={{
					position: 'absolute',
					width: s * 10,
					height: s * 10,
					left: -s * 5,
					top: -s * 5,
					borderRadius: '50%',
					background: `radial-gradient(circle, rgba(${color},${0.32 * k}) 0%, rgba(${color},${0.08 * k}) 25%, rgba(${color},0) 60%)`,
				}}
			/>
			{streak > 0 ? (
				<div
					style={{
						position: 'absolute',
						width: s * 18 * streak,
						height: s * 0.5,
						left: -s * 9 * streak,
						top: -s * 0.25,
						borderRadius: '50%',
						background: `radial-gradient(ellipse at center, rgba(${color},${0.75 * k}) 0%, rgba(${color},${0.12 * k}) 40%, rgba(${color},0) 70%)`,
					}}
				/>
			) : null}
			{rays
				? [0, 60, 120].map((a) => (
						<div
							key={a}
							style={{
								position: 'absolute',
								width: s * 4,
								height: 1.5,
								left: -s * 2,
								top: -0.75,
								transform: `rotate(${a + f * 0.15}deg)`,
								background: `linear-gradient(90deg, rgba(${color},0) 0%, rgba(255,255,255,${0.55 * k}) 50%, rgba(${color},0) 100%)`,
							}}
						/>
					))
				: null}
			<div
				style={{
					position: 'absolute',
					width: s * 1.6,
					height: s * 1.6,
					left: -s * 0.8,
					top: -s * 0.8,
					borderRadius: '50%',
					background: `radial-gradient(circle, rgba(255,255,255,${k}) 0%, rgba(255,255,255,${0.9 * k}) 18%, rgba(${color},${0.5 * k}) 35%, rgba(${color},0) 70%)`,
				}}
			/>
		</div>
	);
};
