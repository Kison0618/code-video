// 鲸落上的生物：盲鳗、睡鲨、铠甲虾、贻贝和蛤、螺、细菌毯、食骨蠕虫。全部程序化 + 实例化。
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {mulberry32} from '../lib/rand';

/** 给材质加“沿身体摆动”的顶点动画：身体沿 x 轴，向 axis 方向摆 */
function wiggle(m: THREE.Material, opts: {axis: 'y' | 'z'; amp: number; k: number; speed: number; tailOnly?: boolean}) {
	const u = {uTime: {value: 0}};
	m.onBeforeCompile = (sh) => {
		sh.uniforms.uTime = u.uTime;
		sh.vertexShader = sh.vertexShader
			.replace('#include <common>', '#include <common>\nuniform float uTime;\n#ifdef USE_INSTANCING\nattribute float aPhase;\n#endif')
			.replace(
				'#include <begin_vertex>',
				`#include <begin_vertex>
				float ph = 0.0;
				#ifdef USE_INSTANCING
				ph = aPhase;
				#endif
				float w = ${opts.tailOnly ? 'smoothstep(0.3, -0.6, position.x)' : '1.0'};
				transformed.${opts.axis} += ${opts.amp.toFixed(4)} * w * sin(position.x * ${opts.k.toFixed(3)} - uTime * ${opts.speed.toFixed(3)} + ph);`
			);
	};
	return u;
}

// ———————————————— 盲鳗 ————————————————
function hagfishGeometry() {
	const L = 0.6;
	const g = new THREE.TubeGeometry(new THREE.LineCurve3(new THREE.Vector3(-L / 2, 0, 0), new THREE.Vector3(L / 2, 0, 0)), 32, 0.028, 8, false);
	const p = g.attributes.position.array as Float32Array;
	for (let i = 0; i < p.length; i += 3) {
		const u = (p[i] + L / 2) / L; // 0 尾 → 1 头
		const r = Math.pow(Math.sin(Math.PI * Math.min(1, u * 0.85 + 0.12)), 0.5) * (0.55 + 0.45 * u);
		p[i + 1] *= r;
		p[i + 2] *= r * (u < 0.35 ? 0.55 + u : 1); // 尾部侧扁
	}
	g.computeVertexNormals();
	return g;
}

/** 盲鳗：粉灰色、黏滑的长条，一半钻在肉里，一半贴着尸体表面扭动 */
export const Hagfish: React.FC<{t: number; anchors: Float32Array; normals: Float32Array; count?: number; visible?: number; scale?: number}> = ({t, anchors, normals, count = 80, visible = 1, scale = 1}) => {
	const {mesh, u, data} = useMemo(() => {
		const g = hagfishGeometry();
		const m = new THREE.MeshStandardMaterial({color: '#8f6f6c', roughness: 0.28, metalness: 0.05});
		const u = wiggle(m, {axis: 'z', amp: 0.045, k: 13, speed: 8});
		const im = new THREE.InstancedMesh(g, m, count);
		const r = mulberry32(31);
		const ph = new Float32Array(count);
		const data = new Array(count).fill(0).map((_, i) => {
			ph[i] = r() * 6.28;
			return {ai: Math.floor(r() * (anchors.length / 3)), ph: ph[i], sp: 0.5 + r(), ang: r() * 6.28, dig: r() < 0.6, sz: 0.8 + r() * 0.5};
		});
		g.setAttribute('aPhase', new THREE.InstancedBufferAttribute(ph, 1));
		im.castShadow = true;
		return {mesh: im, u, data};
	}, [anchors, count]);
	u.uTime.value = t;
	const o = new THREE.Object3D();
	const n = new THREE.Vector3(), tan = new THREE.Vector3(), dir = new THREE.Vector3(), ref = new THREE.Vector3(0, 1, 0);
	data.forEach((d, i) => {
		n.set(normals[d.ai * 3], normals[d.ai * 3 + 1], normals[d.ai * 3 + 2]).normalize();
		// 表面切线方向（绕法线转一个角度）
		tan.crossVectors(n, Math.abs(n.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : ref).normalize().applyAxisAngle(n, d.ang + (d.dig ? 0 : 0.25 * Math.sin(t * 0.3 * d.sp)));
		const wob = Math.sin(t * d.sp * 1.3 + d.ph);
		if (d.dig) {
			// 头斜着扎进去，一下一下往里钻
			dir.copy(tan).multiplyScalar(0.55).addScaledVector(n, -0.85).normalize();
			o.position.set(anchors[d.ai * 3], anchors[d.ai * 3 + 1], anchors[d.ai * 3 + 2]).addScaledVector(n, 0.04 * scale).addScaledVector(dir, (-0.1 + 0.04 * wob) * scale);
		} else {
			dir.copy(tan);
			const slide = 0.25 * Math.sin(t * 0.5 * d.sp + d.ph);
			o.position.set(anchors[d.ai * 3], anchors[d.ai * 3 + 1], anchors[d.ai * 3 + 2]).addScaledVector(n, 0.035 * scale).addScaledVector(tan, slide);
		}
		o.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), dir);
		const s = (i / count < visible ? 1 : 0) * scale * d.sz;
		o.scale.set(s, s, s);
		o.updateMatrix();
		mesh.setMatrixAt(i, o.matrix);
	});
	mesh.instanceMatrix.needsUpdate = true;
	return <primitive object={mesh} />;
};

// ———————————————— 鱼形放样（睡鲨、齿鲸） ————————————————
export function sharkGeometry(L = 3.5) {
	const rings = 60, seg = 24;
	const pos: number[] = [], idx: number[] = [];
	for (let i = 0; i <= rings; i++) {
		const s = i / rings;
		const R = 0.085 * Math.pow(Math.sin(Math.PI * Math.min(1, s * 0.92 + 0.04)), 0.7) * (1 - 0.5 * Math.pow(s, 6));
		const x = (s - 0.5) * L;
		for (let j = 0; j <= seg; j++) {
			const a = (j / seg) * Math.PI * 2;
			pos.push(x, Math.sin(a) * R * L * 0.95, Math.cos(a) * R * L * 1.05);
		}
	}
	for (let i = 0; i < rings; i++)
		for (let j = 0; j < seg; j++) {
			const a = i * (seg + 1) + j, b = a + seg + 1;
			idx.push(a, b, a + 1, b, b + 1, a + 1);
		}
	const body = new THREE.BufferGeometry();
	body.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
	body.setIndex(idx);
	body.computeVertexNormals();
	const fin = (pts: [number, number][], at: [number, number, number], rot: [number, number, number], depth = 0.01) => {
		const sh = new THREE.Shape();
		sh.moveTo(pts[0][0], pts[0][1]);
		pts.slice(1).forEach((p) => sh.lineTo(p[0], p[1]));
		const g = new THREE.ExtrudeGeometry(sh, {depth: depth * L, bevelEnabled: false});
		g.rotateX(rot[0]);
		g.rotateY(rot[1]);
		g.rotateZ(rot[2]);
		g.translate(...at);
		return g.toNonIndexed();
	};
	const parts = [
		body.toNonIndexed(),
		// 尾鳍（上叶长）
		fin([[0, 0], [-0.16 * L, 0.14 * L], [-0.12 * L, 0.02 * L], [-0.1 * L, -0.07 * L]], [-0.47 * L, 0, -0.005 * L], [0, 0, 0]),
		// 两个小背鳍
		fin([[0, 0], [-0.04 * L, 0.05 * L], [-0.07 * L, 0]], [0.05 * L, 0.06 * L, -0.005 * L], [0, 0, 0]),
		fin([[0, 0], [-0.04 * L, 0.045 * L], [-0.07 * L, 0]], [-0.16 * L, 0.045 * L, -0.005 * L], [0, 0, 0]),
		// 胸鳍
		fin([[0, 0], [-0.03 * L, -0.09 * L], [-0.08 * L, -0.02 * L]], [0.22 * L, -0.06 * L, 0.06 * L], [0.7, 0, 0]),
		fin([[0, 0], [-0.03 * L, -0.09 * L], [-0.08 * L, -0.02 * L]], [0.22 * L, -0.06 * L, -0.07 * L], [-0.7, 0, 0]),
	].map((g) => {
		g.deleteAttribute('uv');
		if (!g.attributes.normal) g.computeVertexNormals();
		return g;
	});
	return mergeGeometries(parts);
}

export function useSharkMaterial() {
	return useMemo(() => {
		const m = new THREE.MeshStandardMaterial({color: '#3d4245', roughness: 0.6});
		const u = wiggle(m, {axis: 'z', amp: 0.12, k: 1.6, speed: 2.4, tailOnly: true});
		return {m, u};
	}, []);
}

// ———————————————— 铠甲虾（白色的小蟹） ————————————————
function squatLobsterGeometry() {
	const parts: THREE.BufferGeometry[] = [];
	const body = new THREE.SphereGeometry(0.04, 10, 8);
	body.scale(1.5, 0.6, 1);
	parts.push(body);
	const tail = new THREE.SphereGeometry(0.03, 8, 6);
	tail.scale(1.4, 0.45, 0.9);
	tail.translate(-0.06, -0.005, 0);
	parts.push(tail);
	for (const side of [-1, 1]) {
		// 两条长长的螯
		const arm = new THREE.CylinderGeometry(0.006, 0.008, 0.16, 6);
		arm.rotateZ(Math.PI / 2);
		arm.rotateY(side * 0.35);
		arm.translate(0.12, 0.005, side * 0.035);
		parts.push(arm);
		for (let k = 0; k < 3; k++) {
			const leg = new THREE.CylinderGeometry(0.003, 0.004, 0.08, 4);
			leg.rotateX(side * 1.0);
			leg.translate(0.02 - k * 0.025, -0.02, side * 0.05);
			parts.push(leg);
		}
	}
	return mergeGeometries(parts.map((g) => {
		g = g.toNonIndexed();
		g.deleteAttribute('uv');
		return g;
	}));
}

export const SquatLobsters: React.FC<{t: number; spots: Float32Array; count?: number; scale?: number; visible?: number; seed?: number}> = ({t, spots, count = 60, scale = 1, visible = 1, seed = 41}) => {
	const {mesh, data} = useMemo(() => {
		const g = squatLobsterGeometry();
		const m = new THREE.MeshStandardMaterial({color: '#9c9488', roughness: 0.85});
		const im = new THREE.InstancedMesh(g, m, count);
		im.castShadow = true;
		const r = mulberry32(seed);
		const data = new Array(count).fill(0).map(() => ({i: Math.floor(r() * (spots.length / 3)), rot: r() * 6.28, ph: r() * 6.28, walk: r() < 0.4}));
		return {mesh: im, data};
	}, [spots, count, seed]);
	const o = new THREE.Object3D();
	data.forEach((d, i) => {
		const w = d.walk ? 0.15 * Math.sin(t * 0.3 + d.ph) : 0;
		o.position.set(spots[d.i * 3] + w * Math.cos(d.rot), spots[d.i * 3 + 1] + 0.02 * scale, spots[d.i * 3 + 2] + w * Math.sin(d.rot));
		o.rotation.set(0, d.rot + 0.1 * Math.sin(t * 1.3 + d.ph), 0);
		const s = (i / count < visible ? 1 : 0) * scale;
		o.scale.set(s, s, s);
		o.updateMatrix();
		mesh.setMatrixAt(i, o.matrix);
	});
	mesh.instanceMatrix.needsUpdate = true;
	return <primitive object={mesh} />;
};

// ———————————————— 贻贝、蛤、螺、帽贝 ————————————————
/** 贝类床：在给定位置铺满贝壳 */
export const ShellBed: React.FC<{spots: Float32Array; normals: Float32Array; count?: number; scale?: number; grow?: number; seed?: number}> = ({spots, normals, count = 600, scale = 1, grow = 1, seed = 51}) => {
	const meshes = useMemo(() => {
		const r = mulberry32(seed);
		const mussel = new THREE.SphereGeometry(0.06, 12, 8);
		mussel.scale(1.6, 0.55, 0.8);
		const clam = new THREE.SphereGeometry(0.07, 12, 8);
		clam.scale(1.1, 0.45, 1.0);
		const snail = new THREE.ConeGeometry(0.035, 0.08, 10, 3);
		snail.rotateX(-Math.PI / 2.4);
		const kinds = [
			{g: mussel, m: new THREE.MeshStandardMaterial({color: '#1f2a33', roughness: 0.3, metalness: 0.25}), share: 0.5},
			{g: clam, m: new THREE.MeshStandardMaterial({color: '#cfc4ae', roughness: 0.5}), share: 0.3},
			{g: snail, m: new THREE.MeshStandardMaterial({color: '#8a6b52', roughness: 0.5}), share: 0.2},
		];
		const o = new THREE.Object3D();
		const up = new THREE.Vector3(0, 1, 0);
		return kinds.map((k, ki) => {
			const n = Math.floor(count * k.share);
			const im = new THREE.InstancedMesh(k.g, k.m, n);
			im.castShadow = true;
			im.receiveShadow = true;
			const base: THREE.Matrix4[] = [];
			for (let i = 0; i < n; i++) {
				const j = Math.floor(r() * (spots.length / 3));
				const nrm = new THREE.Vector3(normals[j * 3], normals[j * 3 + 1], normals[j * 3 + 2]).normalize();
				o.position.set(spots[j * 3], spots[j * 3 + 1], spots[j * 3 + 2]).addScaledVector(nrm, 0.01);
				o.quaternion.setFromUnitVectors(up, nrm);
				o.rotateY(r() * 6.28);
				o.rotateX((r() - 0.5) * 0.8);
				const s = scale * (0.6 + r() * 0.8);
				o.scale.set(s, s, s);
				o.updateMatrix();
				base.push(o.matrix.clone());
			}
			return {im, base, order: new Float32Array(n).map(() => r()), ki};
		});
	}, [spots, normals, count, scale, seed]);
	const sc = new THREE.Matrix4();
	meshes.forEach(({im, base, order}) => {
		base.forEach((m, i) => {
			const g = Math.min(1, Math.max(0, (grow - order[i] * 0.85) / 0.15));
			sc.makeScale(g, g, g);
			im.setMatrixAt(i, m.clone().multiply(sc));
		});
		im.instanceMatrix.needsUpdate = true;
	});
	return (
		<>
			{meshes.map(({im}, i) => (
				<primitive key={i} object={im} />
			))}
		</>
	);
};

// ———————————————— 细菌毯：贴在骨头上的白色发光斑块 ————————————————
export const BacterialMat: React.FC<{spots: Float32Array; normals: Float32Array; count?: number; size?: number; glow?: number; cover?: number; color?: string; seed?: number}> = ({spots, normals, count = 2500, size = 0.12, glow = 0, cover = 1, color = '#bdb8aa', seed = 61}) => {
	const {im, mat, order} = useMemo(() => {
		const r = mulberry32(seed);
		const g = new THREE.CircleGeometry(1, 10);
		const m = new THREE.MeshStandardMaterial({color, roughness: 0.95, emissive: new THREE.Color('#bfffe9'), emissiveIntensity: 0, transparent: true, opacity: 0.8, side: THREE.DoubleSide, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2});
		const im = new THREE.InstancedMesh(g, m, count);
		const o = new THREE.Object3D();
		const z = new THREE.Vector3(0, 0, 1);
		const order = new Float32Array(count);
		for (let i = 0; i < count; i++) {
			const j = Math.floor(r() * (spots.length / 3));
			const nrm = new THREE.Vector3(normals[j * 3], normals[j * 3 + 1], normals[j * 3 + 2]).normalize();
			o.position.set(spots[j * 3], spots[j * 3 + 1], spots[j * 3 + 2]).addScaledVector(nrm, 0.012);
			o.quaternion.setFromUnitVectors(z, nrm);
			const s = size * (0.4 + r() * r() * 1.6);
			o.scale.set(s, s * (0.5 + r() * 0.8), 1);
			o.updateMatrix();
			im.setMatrixAt(i, o.matrix);
			order[i] = r();
		}
		return {im, mat: m, order};
	}, [spots, normals, count, size, color, seed]);
	mat.emissiveIntensity = glow;
	im.count = Math.floor(count * Math.min(1, Math.max(0, cover)));
	void order;
	return <primitive object={im} />;
};

// ———————————————— 食骨蠕虫（微距尺度：1 单位 = 1 厘米） ————————————————
function osedaxGeometry(seed: number) {
	const r = mulberry32(seed);
	const red: THREE.BufferGeometry[] = [];
	const white: THREE.BufferGeometry[] = [];
	// 躯干：短、半透明的白色胶质管
	const trunk = new THREE.CylinderGeometry(0.06, 0.09, 0.55, 12, 4);
	trunk.translate(0, 0.27, 0);
	white.push(trunk);
	const palps = 4;
	for (let k = 0; k < palps; k++) {
		const a = (k / palps) * Math.PI * 2 + (r() - 0.5) * 0.6;
		const len = 1.1 + r() * 0.5;
		const lean = 0.5 + r() * 0.35;
		const pts: THREE.Vector3[] = [];
		for (let i = 0; i <= 10; i++) {
			const u = i / 10;
			// 先向上，再向外弯下去，像一根软软的羽毛
			const out = Math.sin(u * Math.PI * 0.55) * lean * len;
			const up = Math.sin(u * Math.PI * 0.75) * len * 0.75;
			pts.push(new THREE.Vector3(Math.cos(a) * out, 0.5 + up, Math.sin(a) * out));
		}
		const curve = new THREE.CatmullRomCurve3(pts);
		red.push(new THREE.TubeGeometry(curve, 30, 0.032, 6, false));
		// 羽枝：密、短、柔
		for (let i = 2; i < 36; i++) {
			const u = i / 38;
			const p = curve.getPointAt(u);
			const tg = curve.getTangentAt(u);
			const side0 = new THREE.Vector3().crossVectors(tg, new THREE.Vector3(Math.cos(a), 0, Math.sin(a))).normalize();
			for (const sgn of [-1, 1]) {
				const dir = side0.clone().multiplyScalar(sgn).addScaledVector(tg, 0.6).normalize();
				const len2 = 0.13 * (1 - u * 0.6);
				const pin = new THREE.CylinderGeometry(0.004, 0.009, len2, 4);
				pin.translate(0, len2 / 2, 0);
				pin.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir));
				pin.translate(p.x, p.y, p.z);
				red.push(pin);
			}
		}
	}
	const prep = (gs: THREE.BufferGeometry[]) => mergeGeometries(gs.map((g) => {
		g = g.index ? g.toNonIndexed() : g;
		g.deleteAttribute('uv');
		return g;
	}));
	return {red: prep(red), white: prep(white)};
}

/** 一片食骨蠕虫：长在 spots 上，羽毛随水流轻摆 */
export const OsedaxField: React.FC<{t: number; spots: Float32Array; normals: Float32Array; count?: number; scale?: number; grow?: number}> = ({t, spots, normals, count = 160, scale = 1, grow = 1}) => {
	const {meshes, data} = useMemo(() => {
		const variants = [1, 2, 3].map((s) => osedaxGeometry(s * 13));
		const m = new THREE.MeshPhysicalMaterial({color: '#d93a33', roughness: 0.5, sheen: 1, sheenColor: new THREE.Color('#ffb0a0'), emissive: new THREE.Color('#4a0805'), emissiveIntensity: 0.5});
		const mw = new THREE.MeshPhysicalMaterial({color: '#e8e2d8', roughness: 0.3, transmission: 0.4, thickness: 0.2, transparent: true, opacity: 0.85});
		const per = Math.ceil(count / 3);
		const meshes = variants.flatMap((g) => [new THREE.InstancedMesh(g.red, m, per), new THREE.InstancedMesh(g.white, mw, per)]);
		const r = mulberry32(71);
		const data = new Array(per * 3).fill(0).map(() => {
			const j = Math.floor(r() * (spots.length / 3));
			return {j, ph: r() * 6.28, s: 0.6 + r() * 0.7, o: r()};
		});
		return {meshes, data};
	}, [spots, count]);
	const o = new THREE.Object3D();
	const up = new THREE.Vector3(0, 1, 0);
	meshes.forEach((im, mi) => {
		const v = Math.floor(mi / 2);
		const per = im.count;
		for (let i = 0; i < per; i++) {
			const d = data[v * per + i];
			const nrm = new THREE.Vector3(normals[d.j * 3], normals[d.j * 3 + 1], normals[d.j * 3 + 2]).normalize();
			o.position.set(spots[d.j * 3], spots[d.j * 3 + 1], spots[d.j * 3 + 2]);
			o.quaternion.setFromUnitVectors(up, nrm);
			o.rotateX(0.18 * Math.sin(t * 0.9 + d.ph));
			o.rotateZ(0.14 * Math.sin(t * 0.7 + d.ph * 1.7));
			const g = Math.min(1, Math.max(0, (grow - d.o * 0.8) / 0.2));
			const s = scale * d.s * g;
			o.scale.set(s, s, s);
			o.updateMatrix();
			im.setMatrixAt(i, o.matrix);
		}
		im.instanceMatrix.needsUpdate = true;
	});
	return (
		<>
			{meshes.map((im, i) => (
				<primitive key={i} object={im} />
			))}
		</>
	);
};
