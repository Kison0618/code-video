// 55.3 – 76.57：第二阶段。骨头上的蠕虫 → 微距：食骨蠕虫的红色“花” → 剖面：根扎进骨头 → X 光：骨头里的油
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Stage, CameraRig, Vec3} from '../three/Stage';
import {DeepSet} from '../three/DeepSet';
import {WhaleFallSite, GROUND, useSiteData} from '../three/site';
import {OsedaxField} from '../three/creatures';
import {MarineSnow, Spot, makeGlowPoints} from '../three/env';
import {Fog, useT} from '../three/helpers';
import {mulberry32} from '../lib/rand';
import {prog, easeInOut, easeOut, lerp, bar, BREAK} from '../lib/time';

// ———— 微距：一段鲸骨上长满食骨蠕虫（单位：厘米） ————
function useBoneMacro() {
	return useMemo(() => {
		const g = new THREE.CylinderGeometry(4, 4.4, 40, 96, 60, true);
		g.rotateZ(Math.PI / 2);
		const p = g.attributes.position.array as Float32Array;
		const r = mulberry32(5);
		const pits = new Array(140).fill(0).map(() => [(r() - 0.5) * 40, r() * 6.28, 0.3 + r() * 0.8]);
		for (let i = 0; i < p.length; i += 3) {
			const x = p[i], y = p[i + 1], z = p[i + 2];
			const a = Math.atan2(z, y);
			let d = 0.12 * Math.sin(x * 1.7 + a * 5) * Math.sin(x * 0.6 - a * 3);
			for (const [px, pa, pr] of pits) {
				const dx = x - px, da = (a - pa) * 4;
				const q = dx * dx + da * da;
				if (q < pr * pr) d -= 0.25 * (1 - q / (pr * pr));
			}
			const len = Math.hypot(y, z);
			p[i + 1] = (y / len) * (len + d);
			p[i + 2] = (z / len) * (len + d);
		}
		g.computeVertexNormals();
		// 蠕虫长在骨头的上半圈：直接在圆柱上取点（法线朝外）
		const pts: number[] = [], nrm: number[] = [];
		const rr = mulberry32(8);
		for (let i = 0; i < 1400; i++) {
			const x = (rr() - 0.5) * 30;
			const a = (rr() - 0.5) * 1.9; // 离正上方 ±55°
			const R = 4.0 + (x + 20) * 0.01 - 0.05;
			pts.push(x, Math.cos(a) * R, Math.sin(a) * R);
			nrm.push(0, Math.cos(a), Math.sin(a));
		}
		return {g, spots: new Float32Array(pts), normals: new Float32Array(nrm)};
	}, []);
}

const Macro: React.FC<{t: number}> = ({t}) => {
	const bone = useBoneMacro();
	const mat = useMemo(() => new THREE.MeshStandardMaterial({color: '#a99d82', roughness: 0.95}), []);
	const k = easeInOut(prog(t, 58.3, 63.9));
	const cam: Vec3 = [lerp(-9, 3, k), lerp(9, 7, k), lerp(16, 12, k)];
	const look: Vec3 = [lerp(-3, 4, k), 4.5, 0];
	return (
		<Stage bloom={0.8} bloomThreshold={0.6} shadows bg="#020509">
			<CameraRig pos={cam} look={look} fov={34} />
			<Fog color="#020509" density={0.035} />
			<ambientLight intensity={0.08} color="#7fa6c0" />
			<Spot pos={[cam[0] + 2, cam[1] + 8, cam[2] + 2]} target={look} intensity={260} angle={0.6} shadow />
			<Spot pos={[cam[0] - 10, cam[1] + 2, cam[2] - 8]} target={look} intensity={120} angle={0.6} color="#9fc8ff" />
			<mesh geometry={bone.g} material={mat} receiveShadow castShadow />
			<OsedaxField t={t} spots={bone.spots} normals={bone.normals} count={300} scale={1.05} grow={easeOut(prog(t, 58.3, 60.5))} />
			<MarineSnow t={t} cam={cam} ambient={0.03} lamp={0.6} lampPos={[cam[0] + 2, cam[1] + 8, cam[2] + 2]} lampDir={[look[0] - cam[0], look[1] - cam[1] - 8, look[2] - cam[2]]} count={2500} box={40} size={0.09} fall={0.3} />
		</Stage>
	);
};

// ———— 剖面：根扎进骨头，细菌在根里，油被溶出来 ————
type Root = {pts: THREE.Vector3[]; t0: number};
function growRoots(seed: number) {
	const r = mulberry32(seed);
	const roots: Root[] = [];
	const branch = (p: THREE.Vector3, dir: THREE.Vector3, len: number, depth: number, t0: number) => {
		const pts = [p.clone()];
		const q = p.clone();
		const d = dir.clone();
		const n = 10;
		for (let i = 0; i < n; i++) {
			d.x += (r() - 0.5) * 0.5;
			d.y -= 0.08;
			d.normalize();
			q.addScaledVector(d, len / n);
			pts.push(q.clone());
			if (depth < 3 && i > 3 && r() < 0.22) branch(q, new THREE.Vector3(d.x + (r() - 0.5) * 1.6, d.y, 0).normalize(), len * 0.6, depth + 1, t0 + (i / n) * 0.35);
		}
		roots.push({pts, t0});
	};
	for (let k = 0; k < 5; k++) branch(new THREE.Vector3(-1.2 + k * 0.6, 0, 0.06), new THREE.Vector3((k - 2) * 0.25, -1, 0).normalize(), 3.4, 0, k * 0.04);
	return roots;
}

const poreFrag = /* glsl */ `
varying vec2 vUv; uniform float uEtch;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float cell(vec2 p){ vec2 i=floor(p), f=fract(p); float m=1.0; for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){ vec2 g=vec2(x,y); vec2 o=vec2(h(i+g),h(i+g+7.3)); m=min(m,length(g+o-f)); } return m; }
void main(){
	vec2 p = vUv * vec2(12.0, 5.0);
	float c = cell(p * 1.6);
	float cort = smoothstep(0.86, 0.9, vUv.y) + smoothstep(0.1, 0.06, vUv.y);
	// 松质骨：细细的骨小梁围出一个个孔，孔里是油
	float c2 = cell(p * 3.1 + 4.0);
	float strut = smoothstep(0.16, 0.05, abs(c - 0.5) * 0.9 + 0.02) + smoothstep(0.1, 0.03, abs(c2 - 0.45) * 0.8);
	float pore = (1.0 - clamp(strut, 0.0, 1.0)) * (1.0 - cort);
	vec3 bone = vec3(0.84, 0.78, 0.66);
	vec3 oil = vec3(0.42, 0.27, 0.1) + 0.25 * vec3(1.0, 0.7, 0.3) * smoothstep(0.3, 0.0, c);
	vec3 col = mix(bone, oil, pore * 0.9);
	// 根附近被溶开的地方变暗
	float etch = uEtch * smoothstep(0.35, 0.0, length((vUv - vec2(0.5, 0.95)) * vec2(2.4, 1.0)));
	col *= 1.0 - 0.55 * etch;
	gl_FragColor = vec4(col * 0.9, 1.0);
}`;

const Cutaway: React.FC<{t: number}> = ({t}) => {
	const data = useMemo(() => {
		const roots = growRoots(4);
		const geos = roots.map((rt) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rt.pts), 40, 0.045, 6, false));
		const rootMat = new THREE.MeshStandardMaterial({color: '#7fbf6a', emissive: new THREE.Color('#2f8f3a'), emissiveIntensity: 0.9, roughness: 0.4});
		const face = new THREE.PlaneGeometry(12, 5);
		const faceMat = new THREE.ShaderMaterial({vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);} `, fragmentShader: poreFrag, uniforms: {uEtch: {value: 0}}});
		const top = new THREE.BoxGeometry(12, 0.4, 3);
		const topMat = new THREE.MeshStandardMaterial({color: '#cfc2a2', roughness: 0.9});
		// 根里的细菌（绿色亮点）和骨头里的油滴（琥珀色）
		const r = mulberry32(12);
		const bp: number[] = [], bc: number[] = [];
		roots.forEach((rt) => {
			const c = new THREE.CatmullRomCurve3(rt.pts);
			for (let i = 0; i < 26; i++) {
				const p = c.getPointAt(r());
				bp.push(p.x + (r() - 0.5) * 0.06, p.y + (r() - 0.5) * 0.06, 0.12);
				bc.push(0.5, 1, 0.6);
			}
		});
		const bact = makeGlowPoints(new Float32Array(bp), new Float32Array(bc), 3);
		bact.mat.uniforms.uSize.value = 0.035;
		const op: number[] = [], oc: number[] = [];
		for (let i = 0; i < 300; i++) {
			op.push((r() - 0.5) * 11, -0.3 - r() * 4.2, 0.08);
			oc.push(1, 0.72, 0.3);
		}
		const oil = makeGlowPoints(new Float32Array(op), new Float32Array(oc), 5);
		oil.mat.uniforms.uSize.value = 0.05;
		return {roots, geos, rootMat, face, faceMat, top, topMat, bact, oil};
	}, []);
	const grow = prog(t, 63.9, 68.5);
	data.faceMat.uniforms.uEtch.value = grow;
	data.bact.mat.uniforms.uTime.value = t;
	data.bact.mat.uniforms.uI.value = prog(t, 66.4, 67.4);
	data.oil.mat.uniforms.uTime.value = t;
	data.oil.mat.uniforms.uI.value = 0.6 * (1 - 0.6 * prog(t, 66.6, 70));
	const k = easeInOut(prog(t, 63.9, 72.4));
	const cam: Vec3 = [lerp(-1.5, 1.0, k), lerp(0.2, -0.6, k), lerp(9.5, 8.0, k)];
	const look: Vec3 = [0, lerp(-0.8, -1.4, k), 0];
	return (
		<Stage bloom={0.9} bloomThreshold={0.45} bg="#030608">
			<CameraRig pos={cam} look={look} fov={40} />
			<ambientLight intensity={0.5} color="#c8d8e0" />
			<directionalLight position={[3, 6, 8]} intensity={1.8} />
			{/* 骨头的剖面（前面）和上表面 */}
			<mesh geometry={data.face} material={data.faceMat} position={[0, -2.5, 0]} />
			<mesh geometry={data.top} material={data.topMat} position={[0, 0.2, -1.5]} />
			{data.geos.map((g, i) => {
				const rt = data.roots[i];
				const p = Math.min(1, Math.max(0, (grow - rt.t0) / (1 - rt.t0)));
				const idx = g.index!.count;
				g.setDrawRange(0, Math.floor((idx * p) / 6) * 6);
				return <mesh key={i} geometry={g} material={data.rootMat} />;
			})}
			<points geometry={data.bact.geo} material={data.bact.mat} />
			<points geometry={data.oil.geo} material={data.oil.mat} />
			{/* 剖面上方露出的那一只蠕虫 */}
			<group position={[0, 0.35, 0.2]} scale={1.1}>
				<OsedaxField t={t} spots={new Float32Array([0, 0, 0])} normals={new Float32Array([0, 1, 0])} count={3} scale={1} />
			</group>
		</Stage>
	);
};

// ———— X 光：整副骨架里的油 ————
const xrayVert = /* glsl */ `varying vec3 vN; varying vec3 vV; varying vec3 vP; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.0); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); vP = position; gl_Position = projectionMatrix*mv; }`;
const xrayFrag = /* glsl */ `uniform float uI, uTime; varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){ float f = 1.0 - abs(dot(vN, vV)); float rim = pow(f, 1.6); float pulse = 0.85 + 0.15*sin(uTime*2.0 + vP.x*0.8);
vec3 c = mix(vec3(1.0,0.62,0.18), vec3(1.0,0.9,0.6), rim); gl_FragColor = vec4(c, (0.12 + rim*0.85) * uI * pulse); }`;

const Xray: React.FC<{t: number}> = ({t}) => {
	const d = useSiteData();
	const mat = useMemo(() => new THREE.ShaderMaterial({vertexShader: xrayVert, fragmentShader: xrayFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: {uI: {value: 0}, uTime: {value: 0}}}), []);
	mat.uniforms.uI.value = prog(t, 72.7, 73.5) * (1 - prog(t, BREAK - 0.3, BREAK));
	mat.uniforms.uTime.value = t;
	const k = easeInOut(prog(t, 72.4, BREAK));
	const ang = lerp(0.9, 1.6, k);
	const cam: Vec3 = [Math.cos(ang) * 16, GROUND + lerp(9, 6, k), Math.sin(ang) * 16];
	return (
		<Stage bloom={1.2} bloomThreshold={0.2} bg="#020306">
			<CameraRig pos={cam} look={[0, GROUND + 0.4, 0]} fov={42} />
			<mesh geometry={d.skel} material={mat} />
		</Stage>
	);
};

export const S05Osedax: React.FC = () => {
	const t = useT();
	if (t < 58.3) {
		const k = easeInOut(prog(t, bar(26), 58.3));
		const cam: Vec3 = [lerp(9.5, 7.0, k), GROUND + lerp(4.2, 3.4, k), lerp(9.0, 7.5, k)];
		const look: Vec3 = [lerp(3, 1.5, k), GROUND + 0.3, 0];
		return (
			<DeepSet t={t} cam={cam} look={look} fov={36} lamp={0.6}>
				<WhaleFallSite t={t} s={{bones: 1, redFuzz: lerp(0.3, 0.9, k), lobsters: 1, mats: 0.15}} />
			</DeepSet>
		);
	}
	if (t < 63.9) return <Macro t={t} />;
	if (t < 72.4) return <Cutaway t={t} />;
	return <Xray t={t} />;
};
