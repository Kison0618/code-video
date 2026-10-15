import {random} from 'remotion';
import {PLUTO_MAP, PLUTO_MAP_H, PLUTO_MAP_W} from '../assets/sphereMaps';
import type {Rgb} from '../theme';
import {glow, rgba} from './glow';

export type SpherePt = {x: number; y: number; z: number; lon: number; lat: number; j: number};

const fibCache = new Map<string, SpherePt[]>();
/** 斐波那契球面均匀点（加一点抖动，更“有机”） */
export const fibSphere = (n: number, seed = 'fib'): SpherePt[] => {
	const key = `${n}|${seed}`;
	const hit = fibCache.get(key);
	if (hit) return hit;
	const pts: SpherePt[] = [];
	const ga = Math.PI * (3 - Math.sqrt(5));
	for (let i = 0; i < n; i++) {
		const y = 1 - ((i + 0.5) / n) * 2;
		const r = Math.sqrt(1 - y * y);
		const th = ga * i + (random(`${seed}-${i}`) - 0.5) * 0.6;
		const x = Math.cos(th) * r;
		const z = Math.sin(th) * r;
		// 约定：z 轴为北极，lon 从 +x 起算
		const lat = (Math.asin(y) * 180) / Math.PI;
		const lon = ((Math.atan2(z, x) * 180) / Math.PI + 360) % 360;
		pts.push({x, y, z, lon, lat, j: random(`${seed}-j-${i}`)});
	}
	fibCache.set(key, pts);
	return pts;
};

let mapBytes: Uint8Array | null = null;
const getMap = () => {
	if (!mapBytes) {
		const bin = atob(PLUTO_MAP);
		mapBytes = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) mapBytes[i] = bin.charCodeAt(i);
	}
	return mapBytes;
};

/** 采样冥王星贴图：返回 [r,g,b,heart(0..1)] */
export const samplePluto = (lon: number, lat: number): [number, number, number, number] => {
	const m = getMap();
	const i = Math.min(PLUTO_MAP_W - 1, Math.max(0, Math.floor((((lon % 360) + 360) % 360) / 360 * PLUTO_MAP_W)));
	const j = Math.min(PLUTO_MAP_H - 1, Math.max(0, Math.floor(((90 - lat) / 180) * PLUTO_MAP_H)));
	const k = (j * PLUTO_MAP_W + i) * 4;
	return [m[k], m[k + 1], m[k + 2], m[k + 3] / 255];
};

export type SphereStyle = {
	cx: number;
	cy: number;
	R: number;
	/** 自转角（度），正值向东转 */
	spin: number;
	/** 北极朝向观察者的倾角（度） */
	tilt?: number;
	/** 屏幕内旋转（度） */
	roll?: number;
	points: SpherePt[];
	/** 每个点的颜色与亮度 */
	color: (p: SpherePt, i: number) => {c: Rgb; a: number; s?: number; glow?: number};
	/** 背面点亮度（全息感） */
	back?: number;
	size?: number;
	alpha?: number;
	/** 每个点的出现进度（用于粒子聚合等），返回 0..1 及偏移 */
	scatter?: (p: SpherePt, i: number) => {t: number; dx: number; dy: number};
	/** 圆点（珠子）而非方点 */
	round?: boolean;
	/** 球体底色（让点云更“实”） */
	base?: {c: Rgb; a: number};
	/** 边缘光 */
	rim?: {c: Rgb; a: number};
};

/** 画一个点云球（加法混合） */
export const drawSphere = (ctx: CanvasRenderingContext2D, st: SphereStyle) => {
	const {cx, cy, R, spin, tilt = 25, roll = 0, points, color, back = 0.06, size = 1.6, alpha = 1, scatter, round = false, base, rim} = st;
	if (alpha <= 0) return;
	if (base && base.a > 0) {
		const g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.1, cx, cy, R);
		g.addColorStop(0, rgba(base.c, base.a * alpha));
		g.addColorStop(0.8, rgba(base.c, base.a * alpha * 0.55));
		g.addColorStop(1, rgba(base.c, 0));
		ctx.globalCompositeOperation = 'source-over';
		ctx.globalAlpha = 1;
		ctx.fillStyle = g;
		ctx.beginPath();
		ctx.arc(cx, cy, R, 0, Math.PI * 2);
		ctx.fill();
	}
	const sp = (spin * Math.PI) / 180;
	const tl = (tilt * Math.PI) / 180;
	const rl = (roll * Math.PI) / 180;
	const cs = Math.cos(sp), ss = Math.sin(sp), ct = Math.cos(tl), stt = Math.sin(tl), cr = Math.cos(rl), sr = Math.sin(rl);
	ctx.globalCompositeOperation = 'lighter';
	for (let i = 0; i < points.length; i++) {
		const p = points[i];
		// 球面坐标（z=北极）→ 自转 → 倾斜 → 屏幕
		const lonr = (p.lon * Math.PI) / 180;
		const latr = (p.lat * Math.PI) / 180;
		let x = Math.cos(latr) * Math.cos(lonr);
		let y = Math.cos(latr) * Math.sin(lonr);
		const z = Math.sin(latr);
		// spin about polar axis
		const x1 = x * cs + y * ss;
		const y1 = -x * ss + y * cs;
		// view: looking from -y1 direction... define depth = x1 (toward viewer), screen-x = y1, screen-y = -z
		let sx = y1;
		let sy = -(z * ct - x1 * stt);
		const depth = x1 * ct + z * stt;
		x = sx * cr - sy * sr;
		y = sx * sr + sy * cr;
		sx = x;
		sy = y;
		const front = depth > 0;
		const col = color(p, i);
		let a = col.a * alpha * (front ? 0.35 + 0.65 * depth : back);
		if (a <= 0.004) continue;
		let px = cx + sx * R;
		let py = cy + sy * R;
		if (scatter) {
			const s = scatter(p, i);
			if (s.t <= 0) continue;
			px += s.dx * (1 - s.t);
			py += s.dy * (1 - s.t);
			a *= Math.min(1, s.t * 1.4);
		}
		const r = (col.s ?? 1) * size * (front ? 0.6 + 0.5 * depth : 0.5);
		ctx.globalAlpha = Math.min(1, a);
		ctx.fillStyle = rgba(col.c, 1);
		if (round) {
			ctx.beginPath();
			ctx.arc(px, py, r, 0, Math.PI * 2);
			ctx.fill();
		} else ctx.fillRect(px - r, py - r, r * 2, r * 2);
		if (col.glow && front) glow(ctx, px, py, r * 7, col.c, a * col.glow);
	}
	if (rim && rim.a > 0) {
		for (const [w, a] of [[R * 0.08, 0.1], [R * 0.025, 0.3], [1.2, 0.8]] as const) {
			ctx.globalAlpha = rim.a * a * alpha;
			ctx.strokeStyle = rgba(rim.c, 1);
			ctx.lineWidth = w;
			ctx.beginPath();
			ctx.arc(cx, cy, R, 0, Math.PI * 2);
			ctx.stroke();
		}
	}
	ctx.globalAlpha = 1;
	ctx.globalCompositeOperation = 'source-over';
};

/** 冥王星的标准配色：反照率映射到暖色，心形发金光 */
export const plutoColor = (heartBoost = 0, heartReveal = 1) => (p: SpherePt) => {
	const [r, g, b, h] = samplePluto(p.lon, p.lat);
	const lum = (r + g + b) / 765; // 0..1
	const hh = h * heartReveal;
	if (hh > 0.35) {
		return {c: [255, 236, 200] as Rgb, a: 0.75 + 0.25 * hh + heartBoost * 0.3, s: 1.15 + heartBoost * 0.4, glow: 0.12 + heartBoost * 0.5};
	}
	const warm: Rgb = lum < 0.32 ? [200, 92, 60] : [Math.min(255, r * 1.1), Math.min(255, g * 1.0), Math.min(255, b * 0.85)];
	return {c: warm, a: 0.18 + lum * 0.95, s: 0.85 + lum * 0.4};
};
