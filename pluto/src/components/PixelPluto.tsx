import React, {useMemo} from 'react';
import {plutoSample} from './Pluto';

/** 低分辨率“像素化”的冥王星（模拟哈勃影像 / 数据回传） */
export const PixelPluto: React.FC<{size: number; n: number; blur?: number; style?: React.CSSProperties}> = ({size, n, blur = 0, style}) => {
	const cells = useMemo(() => {
		const out: {x: number; y: number; c: string}[] = [];
		const N = Math.max(2, Math.round(n));
		for (let j = 0; j < N; j++) {
			for (let i = 0; i < N; i++) {
				// average 3x3 samples in each cell
				let r = 0,
					g = 0,
					b = 0,
					k = 0,
					inside = 0;
				for (let sy = 0; sy < 3; sy++) {
					for (let sx = 0; sx < 3; sx++) {
						const x = ((i + (sx + 0.5) / 3) / N) * 2 - 1;
						const y = ((j + (sy + 0.5) / 3) / N) * 2 - 1;
						const s = plutoSample(x, y);
						k++;
						if (s) {
							r += s[0];
							g += s[1];
							b += s[2];
							inside++;
						}
					}
				}
				if (inside === 0) continue;
				const cov = inside / k;
				out.push({
					x: i,
					y: j,
					c: `rgba(${Math.round(r / inside)},${Math.round(g / inside)},${Math.round(b / inside)},${cov.toFixed(2)})`,
				});
			}
		}
		return {out, N};
	}, [n]);
	return (
		<svg
			width={size}
			height={size}
			viewBox={`0 0 ${cells.N} ${cells.N}`}
			shapeRendering="crispEdges"
			style={{filter: blur > 0 ? `blur(${blur}px)` : undefined, ...style}}
		>
			{cells.out.map((c, i) => (
				<rect key={i} x={c.x} y={c.y} width={1.02} height={1.02} fill={c.c} />
			))}
		</svg>
	);
};
