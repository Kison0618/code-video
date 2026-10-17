// 确定性随机：同一个种子永远得到同样的结果，分块渲染才能接得上。
export function mulberry32(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function hash(n: number) {
	const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
	return s - Math.floor(s);
}

/** 平滑一维噪声 */
export function noise1(x: number, seed = 0) {
	const i = Math.floor(x);
	const f = x - i;
	const u = f * f * (3 - 2 * f);
	return hash(i + seed * 57.3) * (1 - u) + hash(i + 1 + seed * 57.3) * u;
}
