import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../theme';

type Props = {
	seed?: string;
	count?: number;
	/** px per frame for the nearest layer */
	drift?: number;
	opacity?: number;
	/** rotate the field around a pivot (deg per frame) */
	spin?: number;
	pivot?: [number, number];
};

export const Starfield: React.FC<Props> = ({
	seed = 'stars',
	count = 320,
	drift = 0.12,
	opacity = 1,
	spin = 0,
	pivot = [WIDTH / 2, HEIGHT / 2],
}) => {
	const frame = useCurrentFrame();
	const stars = useMemo(
		() =>
			new Array(count).fill(0).map((_, i) => {
				const depth = random(`${seed}-d-${i}`);
				return {
					x: random(`${seed}-x-${i}`) * (WIDTH + 400) - 200,
					y: random(`${seed}-y-${i}`) * (HEIGHT + 400) - 200,
					r: 0.4 + Math.pow(depth, 3) * 1.6,
					a: 0.18 + depth * 0.7,
					depth,
					tw: 0.03 + random(`${seed}-t-${i}`) * 0.08,
					ph: random(`${seed}-p-${i}`) * Math.PI * 2,
					warm: random(`${seed}-w-${i}`) > 0.86,
				};
			}),
		[seed, count],
	);
	return (
		<AbsoluteFill style={{opacity}}>
			<svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
				<g transform={`rotate(${frame * spin} ${pivot[0]} ${pivot[1]})`}>
					{stars.map((s, i) => {
						const span = WIDTH + 400;
						const x = ((((s.x - frame * drift * (0.25 + s.depth)) % span) + span) % span) - 200;
						const tw = 0.65 + 0.35 * Math.sin(frame * s.tw + s.ph);
						return (
							<circle
								key={i}
								cx={x}
								cy={s.y}
								r={s.r}
								fill={s.warm ? '#ffe2c4' : '#dfeaff'}
								opacity={s.a * tw}
							/>
						);
					})}
				</g>
			</svg>
		</AbsoluteFill>
	);
};
