import React, {useEffect, useState} from 'react';
import {continueRender, delayRender, random} from 'remotion';
import {HEIGHT, Rgb, WIDTH} from '../theme';
import {FxCanvas} from './Canvas';
import {glow} from './glow';

type P = {x: number; y: number; sx: number; sy: number; d: number; j: number};

const cache = new Map<string, P[]>();

const sample = (text: string, font: string, cx: number, cy: number, gap: number, letterSpacing: number) => {
	const key = `${text}|${font}|${cx}|${cy}|${gap}|${letterSpacing}`;
	const hit = cache.get(key);
	if (hit) return hit;
	const c = document.createElement('canvas');
	c.width = WIDTH;
	c.height = HEIGHT;
	const g = c.getContext('2d')!;
	g.fillStyle = '#fff';
	g.font = font;
	g.textBaseline = 'middle';
	// 手动字距
	const chars = [...text];
	const widths = chars.map((ch) => g.measureText(ch).width);
	const total = widths.reduce((a, b) => a + b, 0) + letterSpacing * (chars.length - 1);
	let x = cx - total / 2;
	chars.forEach((ch, i) => {
		g.fillText(ch, x, cy);
		x += widths[i] + letterSpacing;
	});
	const img = g.getImageData(0, 0, WIDTH, HEIGHT).data;
	const pts: P[] = [];
	let n = 0;
	for (let y = 0; y < HEIGHT; y += gap) {
		for (let xx = 0; xx < WIDTH; xx += gap) {
			if (img[(y * WIDTH + xx) * 4 + 3] > 128) {
				const a = random(`tp-a-${n}`) * Math.PI * 2;
				const r = 300 + random(`tp-r-${n}`) * 900;
				pts.push({x: xx, y, sx: cx + Math.cos(a) * r, sy: cy + Math.sin(a) * r * 0.6, d: random(`tp-d-${n}`), j: random(`tp-j-${n}`)});
				n++;
			}
		}
	}
	cache.set(key, pts);
	return pts;
};

/** 由粒子聚合成的文字。t: 0=散开 → 1=成形；out: 0→1 粒子再次飘散 */
export const TextParticles: React.FC<{
	text: string;
	fontFamily: string;
	fontWeight?: number;
	fontSize: number;
	cx: number;
	cy: number;
	t: number;
	out?: number;
	gap?: number;
	letterSpacing?: number;
	color: Rgb;
	glowColor?: Rgb;
	frameNoise?: number;
}> = ({text, fontFamily, fontWeight = 400, fontSize, cx, cy, t, out = 0, gap = 4, letterSpacing = 0, color, glowColor, frameNoise = 1}) => {
	const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
	const [pts, setPts] = useState<P[] | null>(null);
	const [handle] = useState(() => delayRender('sample text'));
	useEffect(() => {
		let alive = true;
		const fam = fontFamily.split(',')[0].trim();
		document.fonts
			.load(`${fontWeight} ${fontSize}px ${fam}`, text)
			.catch(() => null)
			.then(() => {
				if (!alive) return;
				setPts(sample(text, font, cx, cy, gap, letterSpacing));
				continueRender(handle);
			});
		return () => {
			alive = false;
		};
	}, [text, font, cx, cy, gap, letterSpacing, fontFamily, fontWeight, fontSize, handle]);
	return (
		<FxCanvas
			draw={(ctx, f) => {
				if (!pts) return;
				ctx.globalCompositeOperation = 'lighter';
				ctx.fillStyle = `rgb(${color[0]},${color[1]},${color[2]})`;
				for (let i = 0; i < pts.length; i++) {
					const p = pts[i];
					// 每个粒子错开到达
					const local = Math.min(1, Math.max(0, (t - p.d * 0.45) / 0.55));
					const e = 1 - Math.pow(1 - local, 3);
					const lo = Math.min(1, Math.max(0, (out - p.j * 0.5) / 0.5));
					const eo = lo * lo;
					const wob = (1 - e) * 30 * frameNoise;
					let x = p.sx + (p.x - p.sx) * e + Math.sin(f * 0.05 + p.j * 20) * wob;
					let y = p.sy + (p.y - p.sy) * e + Math.cos(f * 0.04 + p.d * 20) * wob;
					x += (p.x - cx) * eo * 1.5 + Math.sin(p.j * 40) * 200 * eo;
					y += -eo * 260 * (0.3 + p.d) + Math.cos(p.d * 40) * 80 * eo;
					const a = (0.25 + 0.75 * e) * (1 - eo) * (0.7 + 0.3 * Math.sin(f * 0.2 + p.j * 30));
					if (a <= 0.01) continue;
					const r = 0.8 + (1 - e) * 1.2;
					ctx.globalAlpha = Math.min(1, a);
					ctx.fillRect(x - r, y - r, r * 2, r * 2);
					if (glowColor && p.j > 0.93) glow(ctx, x, y, 10, glowColor, a * 0.5);
				}
				ctx.globalAlpha = 1;
				ctx.globalCompositeOperation = 'source-over';
			}}
		/>
	);
};
