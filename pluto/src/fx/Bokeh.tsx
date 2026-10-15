import React, {useMemo} from 'react';
import {random} from 'remotion';
import {FxCanvas} from './Canvas';
import {glow} from './glow';
import {RGB} from '../theme';

/** 前景的失焦光斑（缓慢漂移，增加纵深） */
export const Bokeh: React.FC<{seed: string; opacity?: number}> = ({seed, opacity = 1}) => {
	const pts = useMemo(
		() =>
			new Array(16).fill(0).map((_, i) => ({
				x: random(`${seed}-bx${i}`),
				y: random(`${seed}-by${i}`),
				r: 40 + random(`${seed}-br${i}`) * 120,
				v: (random(`${seed}-bv${i}`) - 0.5) * 0.5,
				w: random(`${seed}-bw${i}`) > 0.55,
				a: 0.03 + random(`${seed}-ba${i}`) * 0.06,
			})),
		[seed],
	);
	return (
		<FxCanvas
			draw={(ctx, f) => {
				ctx.globalCompositeOperation = 'lighter';
				for (const p of pts) {
					const x = ((p.x * 2200 + f * p.v * 2 + 2200) % 2200) - 140;
					const y = p.y * 1080 + Math.sin(f / 80 + p.x * 10) * 30;
					glow(ctx, x, y, p.r, p.w ? RGB.goldHot : RGB.blueHot, p.a * 0.6 * opacity * (0.7 + 0.3 * Math.sin(f / 40 + p.y * 9)));
				}
				ctx.globalAlpha = 1;
				ctx.globalCompositeOperation = 'source-over';
			}}
		/>
	);
};
