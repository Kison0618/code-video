import React, {useMemo} from 'react';
import {random} from 'remotion';
import {FxCanvas} from '../fx/Canvas';
import {glow} from '../fx/glow';
import {HEIGHT, RGB, Rgb, WIDTH} from '../theme';

type Props = {
	seed?: string;
	count?: number;
	/** 平移漂移速度（px/帧，最近一层） */
	drift?: number;
	opacity?: number;
	/** 3D 穿越模式：累计前进距离（0..∞），设置后星星从中心向外飞 */
	travel?: number;
	/** 穿越模式下的拖尾长度（与速度成正比） */
	streak?: number;
	center?: [number, number];
	/** 兼容旧参数 */
	spin?: number;
	pivot?: [number, number];
};

const WARM: Rgb = [255, 226, 190];
const COOL: Rgb = [210, 228, 255];

export const Starfield: React.FC<Props> = ({seed = 'stars', count = 700, drift = 0.1, opacity = 1, travel, streak = 0, center = [WIDTH / 2, HEIGHT / 2]}) => {
	const stars = useMemo(
		() =>
			new Array(count).fill(0).map((_, i) => {
				const d = random(`${seed}-d-${i}`);
				return {
					x: random(`${seed}-x-${i}`),
					y: random(`${seed}-y-${i}`),
					z: random(`${seed}-z-${i}`),
					depth: d,
					mag: Math.pow(random(`${seed}-m-${i}`), 6),
					tw: 0.04 + random(`${seed}-t-${i}`) * 0.1,
					ph: random(`${seed}-p-${i}`) * Math.PI * 2,
					warm: random(`${seed}-w-${i}`) > 0.82,
				};
			}),
		[seed, count],
	);
	return (
		<FxCanvas
			draw={(ctx, f) => {
				ctx.globalCompositeOperation = 'lighter';
				for (const s of stars) {
					const c = s.warm ? WARM : COOL;
					const tw = 0.6 + 0.4 * Math.sin(f * s.tw + s.ph);
					if (travel !== undefined) {
						const FAR = 1;
						const z = (((s.z - travel * 0.01) % FAR) + FAR) % FAR + 0.02;
						const fx = (s.x - 0.5) * 2.4;
						const fy = (s.y - 0.5) * 2.4;
						const px = center[0] + (fx / z) * 300;
						const py = center[1] + (fy / z) * 300;
						if (px < -50 || px > WIDTH + 50 || py < -50 || py > HEIGHT + 50) continue;
						const near = Math.min(1, 0.08 / z);
						const a = opacity * (0.25 + 0.75 * near) * tw;
						if (streak > 0) {
							const z2 = z + streak * 0.01;
							const qx = center[0] + (fx / z2) * 300;
							const qy = center[1] + (fy / z2) * 300;
							ctx.globalAlpha = Math.min(1, a);
							ctx.strokeStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
							ctx.lineWidth = 0.6 + near * 1.6;
							ctx.beginPath();
							ctx.moveTo(qx, qy);
							ctx.lineTo(px, py);
							ctx.stroke();
						}
						const r = 0.5 + near * 1.4;
						ctx.globalAlpha = Math.min(1, a);
						ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
						ctx.fillRect(px - r, py - r, r * 2, r * 2);
						continue;
					}
					const span = WIDTH + 200;
					const x = ((((s.x * span - f * drift * (0.2 + s.depth)) % span) + span) % span) - 100;
					const y = s.y * HEIGHT;
					const r = 0.45 + s.depth * s.depth * 1.1 + s.mag * 1.4;
					const a = opacity * (0.15 + 0.55 * s.depth + s.mag * 0.4) * tw;
					ctx.globalAlpha = Math.min(1, a);
					ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
					ctx.fillRect(x - r * 0.5, y - r * 0.5, r, r);
					if (s.mag > 0.25) glow(ctx, x, y, 6 + s.mag * 16, s.warm ? RGB.goldHot : RGB.blueHot, a * 0.5);
				}
				ctx.globalAlpha = 1;
				ctx.globalCompositeOperation = 'source-over';
			}}
		/>
	);
};
