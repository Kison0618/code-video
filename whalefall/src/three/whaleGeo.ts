// 程序化生成鲸的身体和骨架（单位：米）。不依赖任何外部模型。
// 约定：身体沿 x 轴，尾尖在 -L/2，吻端在 +L/2；s∈[0,1] 是从尾到头的位置。
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {mulberry32} from '../lib/rand';

const ss = (a: number, b: number, x: number) => {
	const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
	return t * t * (3 - 2 * t);
};

/** 须鲸的体形剖面：半宽、半高、中心线高度（相对 L） */
function profile(s: number) {
	const rise = Math.pow(ss(0.0, 0.6, s), 0.85);
	const fall = Math.sqrt(Math.max(0, 1 - Math.pow(Math.max(0, (s - 0.8) / 0.2), 2.4)));
	const R = 0.006 + 0.1 * rise * fall;
	const hw = R * (0.82 + 0.3 * ss(0.72, 1, s)); // 尾柄侧扁，头部宽
	const hh = R * (1.15 - 0.35 * rise - 0.3 * ss(0.8, 1, s) + 0.25 * (1 - ss(0, 0.25, s)));
	const cy = -0.012 * Math.sin(Math.PI * s) - 0.01 * ss(0.85, 1, s);
	return {hw, hh, cy};
}

function withColor(g: THREE.BufferGeometry, col: THREE.Color, sVal: number) {
	g = g.index ? g.toNonIndexed() : g;
	const n = g.attributes.position.count;
	const c = new Float32Array(n * 3);
	const sa = new Float32Array(n);
	for (let i = 0; i < n; i++) {
		c[i * 3] = col.r;
		c[i * 3 + 1] = col.g;
		c[i * 3 + 2] = col.b;
		sa[i] = sVal;
	}
	g.setAttribute('color', new THREE.BufferAttribute(c, 3));
	g.setAttribute('aS', new THREE.BufferAttribute(sa, 1));
	g.deleteAttribute('uv');
	return g;
}

/** 身体（放样）+ 鳍 + 尾叶 */
export function whaleGeometry(L = 18, opts: {grooves?: boolean; dark?: string; light?: string} = {}) {
	const rings = 110;
	const seg = 40;
	const pos: number[] = [];
	const col: number[] = [];
	const sAttr: number[] = [];
	const idx: number[] = [];
	const dark = new THREE.Color(opts.dark ?? '#1d2a33');
	const light = new THREE.Color(opts.light ?? '#8a98a2');
	const tmp = new THREE.Color();
	for (let i = 0; i <= rings; i++) {
		const s = i / rings;
		const {hw, hh, cy} = profile(s);
		const x = (s - 0.5) * L;
		for (let j = 0; j <= seg; j++) {
			const a = (j / seg) * Math.PI * 2;
			const ca = Math.cos(a);
			const sa = Math.sin(a);
			// 背部略尖、腹部略平
			const ridge = 1 + 0.08 * Math.max(0, sa) ** 4;
			const y = (cy + sa * hh * ridge * (sa < 0 ? 0.92 : 1)) * L;
			const z = ca * hw * L;
			pos.push(x, y, z);
			// 背深腹浅；腹褶（下颌到肚脐的沟纹）
			let k = THREE.MathUtils.smoothstep(-sa, -0.15, 0.55);
			if (opts.grooves !== false && s > 0.6 && s < 0.97 && sa < -0.3) {
				const g = Math.sin(a * 70);
				if (g > 0.55) k *= 0.62;
			}
			// 一点点斑驳
			const mott = 0.9 + 0.1 * Math.sin(s * 91 + a * 13) * Math.sin(s * 37 - a * 7);
			tmp.copy(dark).lerp(light, k).multiplyScalar(mott);
			col.push(tmp.r, tmp.g, tmp.b);
			sAttr.push(s);
		}
	}
	for (let i = 0; i < rings; i++) {
		for (let j = 0; j < seg; j++) {
			const a = i * (seg + 1) + j;
			const b = a + seg + 1;
			idx.push(a, b, a + 1, b, b + 1, a + 1);
		}
	}
	let body = new THREE.BufferGeometry();
	body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	body.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
	body.setAttribute('aS', new THREE.Float32BufferAttribute(sAttr, 1));
	body.setIndex(idx);
	body.computeVertexNormals();
	body = body.toNonIndexed();

	const finCol = dark.clone().lerp(light, 0.25);
	// 尾叶：水平的两片
	const fl = new THREE.Shape();
	const span = 0.13 * L;
	const chord = 0.06 * L;
	fl.moveTo(0, 0);
	fl.bezierCurveTo(-chord * 0.2, span * 0.35, -chord * 0.5, span * 0.8, -chord * 1.1, span);
	fl.bezierCurveTo(-chord * 0.7, span * 0.75, -chord * 0.55, span * 0.25, -chord * 0.6, 0);
	fl.bezierCurveTo(-chord * 0.55, -span * 0.25, -chord * 0.7, -span * 0.75, -chord * 1.1, -span);
	fl.bezierCurveTo(-chord * 0.5, -span * 0.8, -chord * 0.2, -span * 0.35, 0, 0);
	let flukes: THREE.BufferGeometry = new THREE.ExtrudeGeometry(fl, {depth: 0.006 * L, bevelEnabled: true, bevelThickness: 0.003 * L, bevelSize: 0.003 * L, bevelSegments: 2, curveSegments: 24});
	flukes.rotateX(Math.PI / 2);
	flukes.translate(-0.48 * L, 0.0, 0);
	flukes = withColor(flukes, finCol, 0.0);

	// 胸鳍
	const pf = new THREE.Shape();
	const pl = 0.16 * L;
	const pw = 0.03 * L;
	pf.moveTo(0, 0);
	pf.bezierCurveTo(pw * 0.6, pl * 0.25, pw * 0.5, pl * 0.75, pw * 0.1, pl);
	pf.bezierCurveTo(-pw * 0.3, pl * 0.7, -pw * 0.6, pl * 0.3, 0, 0);
	const fins: THREE.BufferGeometry[] = [];
	for (const side of [-1, 1]) {
		let g: THREE.BufferGeometry = new THREE.ExtrudeGeometry(pf, {depth: 0.004 * L, bevelEnabled: true, bevelThickness: 0.002 * L, bevelSize: 0.002 * L, bevelSegments: 1, curveSegments: 16});
		g.rotateX(Math.PI / 2);
		g.rotateZ(-0.55); // 向后
		g.rotateX(side * 0.75); // 向下张开
		if (side < 0) g.scale(1, 1, -1);
		const {hw, cy} = profile(0.7);
		g.translate(0.2 * L, (cy - 0.04) * L, side * hw * 0.85 * L);
		fins.push(withColor(g, finCol, 0.7));
	}
	// 背鳍
	const df = new THREE.Shape();
	df.moveTo(0, 0);
	df.quadraticCurveTo(-0.01 * L, 0.012 * L, -0.03 * L, 0.018 * L);
	df.quadraticCurveTo(-0.028 * L, 0.006 * L, -0.045 * L, 0);
	df.lineTo(0, 0);
	let dorsal: THREE.BufferGeometry = new THREE.ExtrudeGeometry(df, {depth: 0.003 * L, bevelEnabled: false});
	{
		const {hh, cy} = profile(0.3);
		dorsal.translate(-0.18 * L, (cy + hh * 1.02) * L, -0.0015 * L);
	}
	dorsal = withColor(dorsal, dark, 0.3);
	// 眼睛
	const eyes: THREE.BufferGeometry[] = [];
	for (const side of [-1, 1]) {
		const {hw, cy} = profile(0.86);
		const e = new THREE.SphereGeometry(0.004 * L, 10, 8);
		e.translate(0.36 * L, (cy - 0.01) * L, side * hw * 0.98 * L);
		eyes.push(withColor(e, new THREE.Color('#05080a'), 0.86));
	}
	const all = mergeGeometries([body, flukes, ...fins, dorsal, ...eyes].map((g) => {
		g = g.index ? g.toNonIndexed() : g;
		g.deleteAttribute('uv');
		if (!g.attributes.normal) g.computeVertexNormals();
		return g;
	}));
	all.computeBoundingSphere();
	return all;
}

/** 鲸的材质：顶点色 + 游动时身体的上下摆动（尾部摆幅最大） */
export function whaleMaterial() {
	const m = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 0.55, metalness: 0.0});
	const uniforms = {uTime: {value: 0}, uAmp: {value: 0}, uFreq: {value: 0.35}, uL: {value: 18}};
	m.onBeforeCompile = (sh) => {
		Object.assign(sh.uniforms, uniforms);
		sh.vertexShader = sh.vertexShader
			.replace('#include <common>', '#include <common>\nattribute float aS;\nuniform float uTime, uAmp, uFreq, uL;')
			.replace(
				'#include <begin_vertex>',
				`#include <begin_vertex>
				float w = pow(1.0 - aS, 2.2) + 0.08 * aS;
				transformed.y += uAmp * uL * w * sin(6.2831 * (aS * 0.85 - uTime * uFreq));`
			);
	};
	(m as THREE.MeshStandardMaterial & {userData: {u: typeof uniforms}}).userData.u = uniforms;
	return {material: m, uniforms};
}

/** 骨架：头骨、下颌、脊椎、肋骨、鳍骨。躺在海底的样子（肋骨向两侧摊开）。返回几何体和表面采样点 */
export function skeletonGeometry(L = 18, seed = 7) {
	const rand = mulberry32(seed);
	const parts: THREE.BufferGeometry[] = [];
	const add = (g: THREE.BufferGeometry) => {
		g = g.index ? g.toNonIndexed() : g;
		g.deleteAttribute('uv');
		parts.push(g);
	};
	const vr = (s: number) => (0.005 + 0.018 * Math.pow(ss(0.0, 0.55, s), 0.8)) * L; // 椎体半径
	const baseY = 0.0;
	// 脊柱：略弯，躺在海底
	const spineX = (s: number) => (s - 0.5) * L;
	const spineZ = (s: number) => 0.03 * L * Math.sin(s * 3.2) ;
	const n = 46;
	for (let i = 0; i < n; i++) {
		const s = 0.04 + (i / (n - 1)) * 0.73;
		const r = vr(s);
		const len = (0.73 / n) * L * 0.72;
		const c = new THREE.CylinderGeometry(r, r * 0.92, len, 14, 1);
		c.rotateZ(Math.PI / 2);
		c.translate(spineX(s), baseY + r, spineZ(s));
		add(c);
		// 神经棘（向上）
		const sp = new THREE.BoxGeometry(len * 0.35, r * (1.2 + 0.6 * Math.sin(s * 3)), r * 0.35);
		sp.translate(spineX(s) - len * 0.1, baseY + r * 2.1, spineZ(s));
		add(sp);
		// 横突（向两侧）
		if (s > 0.15 && s < 0.6) {
			const tp = new THREE.BoxGeometry(len * 0.4, r * 0.22, r * 3.4);
			tp.translate(spineX(s), baseY + r * 0.9, spineZ(s));
			add(tp);
		}
	}
	// 肋骨：13 对，摊开在泥上
	for (let i = 0; i < 13; i++) {
		const s = 0.56 + i * 0.016;
		const x = spineX(s);
		const r = vr(s);
		const reach = (0.07 + 0.05 * Math.sin((i / 12) * Math.PI)) * L;
		for (const side of [-1, 1]) {
			const jit = (rand() - 0.5) * 0.02 * L;
			const pts = [
				new THREE.Vector3(x, baseY + r * 1.6, spineZ(s) + side * r),
				new THREE.Vector3(x - 0.01 * L, baseY + r * 2.2, spineZ(s) + side * (r + reach * 0.35)),
				new THREE.Vector3(x - 0.02 * L + jit, baseY + r * 1.2, spineZ(s) + side * (r + reach * 0.75)),
				new THREE.Vector3(x - 0.03 * L + jit, baseY + 0.004 * L, spineZ(s) + side * (r + reach)),
			];
			const tube = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 20, 0.0042 * L, 7, false);
			add(tube);
		}
	}
	// 头骨：扁平的楔形
	{
		const rings = 30;
		const seg = 20;
		const pos: number[] = [];
		const idx: number[] = [];
		for (let i = 0; i <= rings; i++) {
			const u = i / rings;
			const s = 0.775 + u * 0.225;
			const w = (0.075 * (1 - Math.pow(u, 1.6)) + 0.012) * L;
			const h = (0.03 * (1 - u * 0.75) + 0.004) * L;
			for (let j = 0; j <= seg; j++) {
				const a = (j / seg) * Math.PI * 2;
				pos.push(spineX(s), baseY + h + Math.sin(a) * h * (Math.sin(a) > 0 ? 0.9 : 0.5), Math.cos(a) * w + spineZ(0.775));
			}
		}
		for (let i = 0; i < rings; i++)
			for (let j = 0; j < seg; j++) {
				const a = i * (seg + 1) + j;
				const b = a + seg + 1;
				idx.push(a, b, a + 1, b, b + 1, a + 1);
			}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
		g.setIndex(idx);
		g.computeVertexNormals();
		add(g);
	}
	// 下颌骨：两根弯弓
	for (const side of [-1, 1]) {
		const z0 = spineZ(0.775);
		const pts = [
			new THREE.Vector3(spineX(0.79), baseY + 0.006 * L, z0 + side * 0.07 * L),
			new THREE.Vector3(spineX(0.86), baseY + 0.006 * L, z0 + side * 0.11 * L),
			new THREE.Vector3(spineX(0.94), baseY + 0.006 * L, z0 + side * 0.085 * L),
			new THREE.Vector3(spineX(1.005), baseY + 0.006 * L, z0 + side * 0.022 * L),
		];
		add(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.0065 * L, 8, false));
	}
	// 鳍骨：每侧一串小骨
	for (const side of [-1, 1]) {
		const x0 = spineX(0.69);
		const z0 = spineZ(0.69) + side * 0.12 * L;
		for (let k = 0; k < 6; k++) {
			const len = (0.028 - k * 0.003) * L;
			const c = new THREE.CylinderGeometry(0.004 * L, 0.0035 * L, len, 8);
			c.rotateZ(Math.PI / 2);
			c.rotateY(side * 0.5);
			c.translate(x0 - k * 0.02 * L, baseY + 0.004 * L, z0 + side * k * 0.012 * L);
			add(c);
		}
	}
	const geo = mergeGeometries(parts);
	geo.computeBoundingSphere();
	return geo;
}

/** 在几何体表面按面积随机取点（朝上的面优先），用来长细菌毯、贝类、蠕虫 */
export function sampleSurface(geo: THREE.BufferGeometry, count: number, seed = 1, upBias = 0.3) {
	const rand = mulberry32(seed);
	const p = geo.attributes.position.array as Float32Array;
	const nrm = geo.attributes.normal.array as Float32Array;
	const tri = p.length / 9;
	const areas = new Float32Array(tri);
	let total = 0;
	const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
	for (let i = 0; i < tri; i++) {
		a.fromArray(p, i * 9);
		b.fromArray(p, i * 9 + 3);
		c.fromArray(p, i * 9 + 6);
		const ar = b.clone().sub(a).cross(c.clone().sub(a)).length() * 0.5;
		const ny = (nrm[i * 9 + 1] + nrm[i * 9 + 4] + nrm[i * 9 + 7]) / 3;
		const w = ar * Math.max(0.02, upBias + ny);
		total += w;
		areas[i] = total;
	}
	const out = new Float32Array(count * 3);
	const outN = new Float32Array(count * 3);
	for (let k = 0; k < count; k++) {
		const r = rand() * total;
		let lo = 0, hi = tri - 1;
		while (lo < hi) {
			const mid = (lo + hi) >> 1;
			if (areas[mid] < r) lo = mid + 1;
			else hi = mid;
		}
		let u = rand(), v = rand();
		if (u + v > 1) {
			u = 1 - u;
			v = 1 - v;
		}
		for (let d = 0; d < 3; d++) {
			out[k * 3 + d] = p[lo * 9 + d] + u * (p[lo * 9 + 3 + d] - p[lo * 9 + d]) + v * (p[lo * 9 + 6 + d] - p[lo * 9 + d]);
			outN[k * 3 + d] = nrm[lo * 9 + d];
		}
	}
	return {points: out, normals: outN};
}
