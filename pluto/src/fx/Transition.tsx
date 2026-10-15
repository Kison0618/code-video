import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';

/** 场景切换：金色光闪 + 横向变形光条 + 扫过的漏光（中点为切换帧） */
export const TransitionFlash: React.FC<{len: number; warm?: boolean}> = ({len, warm = true}) => {
	const f = useCurrentFrame();
	const mid = len / 2;
	const k = Math.max(0, 1 - Math.abs(f - mid) / mid);
	const e = k * k * (3 - 2 * k);
	const sweep = interpolate(f, [0, len], [-30, 130]);
	const col = warm ? '255,214,160' : '170,215,255';
	return (
		<AbsoluteFill style={{pointerEvents: 'none', mixBlendMode: 'screen'}}>
			<AbsoluteFill style={{background: `radial-gradient(ellipse 60% 45% at 50% 50%, rgba(${col},${0.32 * e}) 0%, rgba(${col},0) 70%)`}} />
			<AbsoluteFill style={{background: `linear-gradient(100deg, rgba(${col},0) ${sweep - 22}%, rgba(${col},${0.22 * e}) ${sweep}%, rgba(${col},0) ${sweep + 22}%)`}} />
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: '50%',
					width: 2400 * (0.3 + 0.7 * e),
					height: 6,
					transform: 'translate(-50%,-50%)',
					borderRadius: '50%',
					background: `radial-gradient(ellipse at center, rgba(255,255,255,${0.9 * e}) 0%, rgba(${col},${0.5 * e}) 30%, rgba(${col},0) 70%)`,
					boxShadow: `0 0 ${40 * e}px rgba(${col},${0.6 * e})`,
				}}
			/>
			{[-1, 1].map((s) => (
				<div
					key={s}
					style={{
						position: 'absolute',
						left: 0,
						top: `calc(50% + ${s * (40 + (1 - e) * 200)}px)`,
						width: '100%',
						height: 1,
						background: `linear-gradient(90deg, rgba(${col},0), rgba(${col},${0.35 * e}), rgba(${col},0))`,
					}}
				/>
			))}
		</AbsoluteFill>
	);
};
