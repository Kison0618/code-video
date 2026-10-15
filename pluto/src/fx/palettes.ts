import type {Rgb} from '../theme';
import type {SpherePt} from './sphere';

/** 月球：灰白高地 + 暗色月海（程序化） */
export const moonColor = (p: SpherePt) => {
	const lo = (p.lon * Math.PI) / 180;
	const la = (p.lat * Math.PI) / 180;
	const v = 0.5 + 0.28 * Math.sin(lo * 2 + la * 3) * Math.cos(la * 2 - lo) + 0.22 * Math.sin(lo * 5 - la * 4 + 1.3);
	const mare = v < 0.38;
	const c: Rgb = mare ? [120, 132, 150] : [214, 222, 236];
	return {c, a: mare ? 0.35 : 0.55 + 0.4 * p.j, s: mare ? 0.85 : 1};
};

/** 卡戎：灰色 + 红色极冠 */
export const charonColor = (p: SpherePt) => {
	if (p.lat > 62) return {c: [200, 96, 70] as Rgb, a: 0.75, s: 1.05};
	const lo = (p.lon * Math.PI) / 180;
	const v = 0.5 + 0.3 * Math.sin(lo * 3 + p.lat * 0.05) + 0.2 * (p.j - 0.5);
	return {c: (v < 0.4 ? [130, 136, 146] : [205, 210, 218]) as Rgb, a: 0.4 + 0.45 * v, s: 1};
};

/** 地球：蓝色海洋 + 白色云 */
export const earthColor = (p: SpherePt) => {
	const lo = (p.lon * Math.PI) / 180;
	const la = (p.lat * Math.PI) / 180;
	const land = Math.sin(lo * 2 + 0.7) * Math.cos(la * 3) + 0.4 * Math.sin(lo * 5 + la * 2) > 0.55;
	const cloud = p.j > 0.86;
	const c: Rgb = cloud ? [235, 245, 255] : land ? [150, 210, 170] : [110, 190, 255];
	return {c, a: cloud ? 0.95 : 0.75, s: 1, glow: 0.22};
};
