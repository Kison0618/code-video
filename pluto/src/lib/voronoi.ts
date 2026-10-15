export type Pt = [number, number];

/** 半平面裁剪法求 Voronoi 单元（点数不多时足够快） */
export const voronoi = (sites: Pt[], w: number, h: number): Pt[][] => {
	const box: Pt[] = [
		[-40, -40],
		[w + 40, -40],
		[w + 40, h + 40],
		[-40, h + 40],
	];
	return sites.map((s, i) => {
		let poly = box;
		for (let j = 0; j < sites.length && poly.length > 0; j++) {
			if (j === i) continue;
			const o = sites[j];
			const mx = (s[0] + o[0]) / 2;
			const my = (s[1] + o[1]) / 2;
			const nx = o[0] - s[0];
			const ny = o[1] - s[1];
			// keep points where (p - m)·n <= 0
			const inside = (p: Pt) => (p[0] - mx) * nx + (p[1] - my) * ny <= 0;
			const out: Pt[] = [];
			for (let k = 0; k < poly.length; k++) {
				const a = poly[k];
				const b = poly[(k + 1) % poly.length];
				const ia = inside(a);
				const ib = inside(b);
				if (ia) out.push(a);
				if (ia !== ib) {
					const da = (a[0] - mx) * nx + (a[1] - my) * ny;
					const db = (b[0] - mx) * nx + (b[1] - my) * ny;
					const t = da / (da - db);
					out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
				}
			}
			poly = out;
		}
		return poly;
	});
};

/** 把多边形向内收缩（制造单元之间的“沟壑”） */
export const shrink = (poly: Pt[], site: Pt, k: number): Pt[] => poly.map(([x, y]) => [site[0] + (x - site[0]) * k, site[1] + (y - site[1]) * k]);
