import type {Rgb} from '../theme';

const cache = new Map<string, HTMLCanvasElement>();

/** 预渲染的径向发光精灵（加法混合下叠出 bloom 效果） */
export const glowSprite = (c: Rgb, hard = 0.15) => {
	const key = `${c.join(',')}|${hard}`;
	let s = cache.get(key);
	if (s) return s;
	s = document.createElement('canvas');
	s.width = s.height = 128;
	const g = s.getContext('2d')!;
	const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
	const [r, gg, b] = c;
	grd.addColorStop(0, `rgba(${r},${gg},${b},1)`);
	grd.addColorStop(hard, `rgba(${r},${gg},${b},0.55)`);
	grd.addColorStop(0.42, `rgba(${r},${gg},${b},0.12)`);
	grd.addColorStop(1, `rgba(${r},${gg},${b},0)`);
	g.fillStyle = grd;
	g.fillRect(0, 0, 128, 128);
	cache.set(key, s);
	return s;
};

/** 发光点：r 为光晕半径 */
export const glow = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: Rgb, a = 1, hard = 0.15) => {
	if (a <= 0.003 || r <= 0) return;
	ctx.globalAlpha = Math.min(1, a);
	ctx.drawImage(glowSprite(c, hard), x - r, y - r, r * 2, r * 2);
};

/** 实心小点 */
export const dot = (ctx: CanvasRenderingContext2D, x: number, y: number, r: number, c: Rgb, a = 1) => {
	if (a <= 0.003) return;
	ctx.globalAlpha = Math.min(1, a);
	ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
	if (r < 1.1) {
		ctx.fillRect(x - r, y - r, r * 2, r * 2);
	} else {
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}
};

export const rgba = (c: Rgb, a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

/** 发光折线：先画宽而淡的光晕，再画细亮的芯 */
export const glowPath = (
	ctx: CanvasRenderingContext2D,
	pts: [number, number][],
	c: Rgb,
	{width = 1.6, a = 1, bloom = 10, close = false}: {width?: number; a?: number; bloom?: number; close?: boolean} = {},
) => {
	if (pts.length < 2 || a <= 0) return;
	const path = () => {
		ctx.beginPath();
		ctx.moveTo(pts[0][0], pts[0][1]);
		for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
		if (close) ctx.closePath();
	};
	ctx.lineCap = 'round';
	ctx.lineJoin = 'round';
	ctx.globalAlpha = 1;
	for (const [w, al] of [
		[bloom * 1.6, 0.05],
		[bloom * 0.7, 0.12],
		[width * 2.2, 0.35],
	] as const) {
		path();
		ctx.strokeStyle = rgba(c, al * a);
		ctx.lineWidth = w;
		ctx.stroke();
	}
	path();
	ctx.strokeStyle = rgba([Math.min(255, c[0] + 40), Math.min(255, c[1] + 40), Math.min(255, c[2] + 40)], Math.min(1, a));
	ctx.lineWidth = width;
	ctx.stroke();
};

/** 渐隐拖尾（pts 从尾到头） */
export const trail = (ctx: CanvasRenderingContext2D, pts: [number, number][], c: Rgb, width = 2.4, a = 1) => {
	const n = pts.length;
	ctx.lineCap = 'round';
	for (let i = 1; i < n; i++) {
		const t = i / (n - 1);
		ctx.globalAlpha = 1;
		ctx.strokeStyle = rgba(c, a * t * t);
		ctx.lineWidth = width * (0.3 + 0.7 * t);
		ctx.beginPath();
		ctx.moveTo(pts[i - 1][0], pts[i - 1][1]);
		ctx.lineTo(pts[i][0], pts[i][1]);
		ctx.stroke();
	}
};
