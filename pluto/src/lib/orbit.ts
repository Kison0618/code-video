/** 冥王星与海王星的简化日心轨道（单位 AU，黄道面 = xy） */
const D = Math.PI / 180;
export const PLUTO_EL = {a: 39.48, e: 0.2488, i: 17.16, node: 110.3, peri: 113.8, tp: 1989.7, period: 247.94};
export const NEPTUNE_EL = {a: 30.07, period: 164.8, lon1989: 280};

export const solveKepler = (M: number, e: number) => {
	let E = M;
	for (let k = 0; k < 8; k++) E = E - (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
	return E;
};

/** 由真近点角求位置 */
export const plutoAtNu = (nu: number): [number, number, number] => {
	const {a, e, i, node, peri} = PLUTO_EL;
	const r = (a * (1 - e * e)) / (1 + e * Math.cos(nu));
	const u = nu + peri * D;
	const X = r * Math.cos(u);
	const Y0 = r * Math.sin(u);
	const Y = Y0 * Math.cos(i * D);
	const Z = Y0 * Math.sin(i * D);
	const O = node * D;
	return [X * Math.cos(O) - Y * Math.sin(O), X * Math.sin(O) + Y * Math.cos(O), Z];
};

export const plutoAt = (year: number): [number, number, number] => {
	const {e, tp, period} = PLUTO_EL;
	const M = (((year - tp) / period) % 1) * 2 * Math.PI;
	const E = solveKepler(M, e);
	const nu = 2 * Math.atan2(Math.sqrt(1 + e) * Math.sin(E / 2), Math.sqrt(1 - e) * Math.cos(E / 2));
	return plutoAtNu(nu);
};

export const neptuneLon = (year: number) => (NEPTUNE_EL.lon1989 + (360 * (year - 1989)) / NEPTUNE_EL.period) * D;

export const neptuneAt = (year: number): [number, number, number] => {
	const l = neptuneLon(year);
	return [NEPTUNE_EL.a * Math.cos(l), NEPTUNE_EL.a * Math.sin(l), 0];
};
