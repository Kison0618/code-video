// 108.45 – 125.46：换尺度。示意的海底地图：迁徙路线上每 12 公里一座鲸落，像一串灯；
// 深海生物踩着它们一站站搬家；20 世纪捕鲸，灯一盏盏熄灭。
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Stage, CameraRig, Vec3} from '../three/Stage';
import {makeGlowPoints} from '../three/env';
import {useT} from '../three/helpers';
import {mulberry32} from '../lib/rand';
import {prog, easeInOut, easeOut, lerp, bar} from '../lib/time';

const mapFrag = /* glsl */ `
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7)))*43758.5453); }
float n(vec2 p){ vec2 i=floor(p), f=fract(p); vec2 u=f*f*(3.0-2.0*f); return mix(mix(h(i),h(i+vec2(1,0)),u.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),u.x),u.y); }
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<5;i++){ s+=a*n(p); p*=2.03; a*=0.5; } return s; }
void main(){
	vec2 p = vUv * vec2(5.0, 3.0);
	float d = fbm(p * 1.3) + 0.35 * fbm(p * 4.0);
	float c = abs(fract(d * 9.0) - 0.5);
	float line = smoothstep(0.06, 0.0, c);
	vec3 base = mix(vec3(0.01,0.03,0.06), vec3(0.03,0.08,0.13), d);
	vec3 col = base + line * vec3(0.05, 0.16, 0.22) * 0.7;
	float edge = smoothstep(0.0, 0.12, vUv.x) * smoothstep(1.0, 0.88, vUv.x) * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
	gl_FragColor = vec4(col * edge, 1.0);
}`;

const SPACING = 2.4; // 1 单位 = 5 km，12 km = 2.4

export const S08Map: React.FC = () => {
	const t = useT();
	const d = useMemo(() => {
		const r = mulberry32(19);
		const plane = new THREE.PlaneGeometry(200, 120);
		plane.rotateX(-Math.PI / 2);
		const planeMat = new THREE.ShaderMaterial({vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0);} `, fragmentShader: mapFrag});
		// 三条迁徙路线：从左下（觅食海域）到右上（繁殖海域）
		const routes = [
			[[-80, -40], [-40, -20], [0, -5], [40, 10], [80, 30]],
			[[-85, -10], [-45, 0], [-5, 12], [35, 25], [75, 45]],
			[[-70, -50], [-30, -38], [10, -25], [50, -5], [85, 10]],
		].map((pts) => new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, 0.05, z))));
		const routeGeos = routes.map((c) => new THREE.TubeGeometry(c, 300, 0.12, 6, false));
		const routeMat = new THREE.MeshBasicMaterial({color: '#6fd8ff', transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false});
		// 鲸落点：沿路线每 12 km 一个（有抖动），再加一些零散的
		const dots: {p: THREE.Vector3; route: number; u: number; off: number}[] = [];
		routes.forEach((c, ri) => {
			const len = c.getLength();
			for (let s = 0; s < len; s += SPACING * (0.7 + r() * 0.6)) {
				const u = s / len;
				const p = c.getPointAt(u);
				p.x += (r() - 0.5) * 2.5;
				p.z += (r() - 0.5) * 2.5;
				dots.push({p, route: ri, u, off: r()});
			}
		});
		for (let i = 0; i < 70; i++) dots.push({p: new THREE.Vector3((r() - 0.5) * 170, 0.05, (r() - 0.5) * 100), route: -1, u: r(), off: r()});
		const pos = new Float32Array(dots.length * 3);
		const col = new Float32Array(dots.length * 3);
		dots.forEach((dt, i) => {
			pos.set([dt.p.x, 0.3, dt.p.z], i * 3);
			col.set([0.55, 1.0, 0.92], i * 3);
		});
		const glow = makeGlowPoints(pos, col, 3);
		glow.mat.uniforms.uSize.value = 1.4;
		// 每个点的熄灭顺序
		const kill = dots.map(() => r());
		// 热泉（橙色）
		const vents = [new THREE.Vector3(-78, 0.3, -46), new THREE.Vector3(82, 0.3, 42)];
		const vp = new Float32Array(vents.length * 3);
		const vc = new Float32Array(vents.length * 3);
		vents.forEach((v, i) => {
			vp.set([v.x, v.y, v.z], i * 3);
			vc.set([1, 0.55, 0.2], i * 3);
		});
		const ventGlow = makeGlowPoints(vp, vc, 4);
		ventGlow.mat.uniforms.uSize.value = 3.0;
		// “踩着它们一站站搬家”：沿第一条路线，从一个点跳到下一个点的弧线
		const chain = dots.filter((x) => x.route === 0).sort((a, b) => a.u - b.u).map((x) => x.p);
		const hops: THREE.BufferGeometry[] = [];
		for (let i = 0; i < chain.length - 1; i++) {
			const a = chain[i], b = chain[i + 1];
			const mid = a.clone().add(b).multiplyScalar(0.5);
			mid.y = 2.2;
			const c = new THREE.QuadraticBezierCurve3(a.clone().setY(0.3), mid, b.clone().setY(0.3));
			hops.push(new THREE.TubeGeometry(c, 16, 0.07, 5, false));
		}
		const hopMat = new THREE.MeshBasicMaterial({color: '#ffd29a', transparent: true, opacity: 0.85, blending: THREE.AdditiveBlending, depthWrite: false});
		return {plane, planeMat, routes, routeGeos, routeMat, dots, glow, kill, ventGlow, hops, hopMat};
	}, []);

	// 路线和点依次亮起
	const routeGrow = easeOut(prog(t, 108.6, 111.0));
	d.routeGeos.forEach((g) => g.setDrawRange(0, Math.floor((g.index!.count * routeGrow) / 6) * 6));
	// 捕鲸：119.4 起，点一盏盏熄灭（约九成）
	const whaling = prog(t, 119.6, 124.2);
	d.routeMat.opacity = 0.35 * (1 - 0.7 * whaling);
	const n = d.dots.length;
	const sizes = d.glow.geo.attributes.aColor.array as Float32Array;
	d.dots.forEach((dt, i) => {
		const on = prog(t, 109.0 + dt.u * 2.2 + (dt.route < 0 ? 0.6 : 0), 109.4 + dt.u * 2.2 + (dt.route < 0 ? 0.6 : 0));
		const off = d.kill[i] < 0.9 ? prog(whaling, d.kill[i] * 0.9, d.kill[i] * 0.9 + 0.08) : 0;
		const v = on * (1 - off);
		sizes[i * 3] = 0.55 * v;
		sizes[i * 3 + 1] = 1.0 * v;
		sizes[i * 3 + 2] = 0.92 * v;
	});
	d.glow.geo.attributes.aColor.needsUpdate = true;
	d.glow.mat.uniforms.uTime.value = t;
	d.ventGlow.mat.uniforms.uTime.value = t;
	d.ventGlow.mat.uniforms.uI.value = prog(t, 115.0, 115.8) * (1 - 0.6 * whaling);
	const hop = prog(t, 115.4, 119.2) * d.hops.length;
	void n;

	const k = easeInOut(prog(t, bar(51), bar(59)));
	const cam: Vec3 = [lerp(-30, 10, k), lerp(95, 80, k), lerp(85, 70, k)];
	const look: Vec3 = [lerp(-8, 6, k), 0, lerp(0, 4, k)];
	return (
		<Stage bloom={1.2} bloomThreshold={0.25} bg="#010306">
			<CameraRig pos={cam} look={look} fov={42} />
			<mesh geometry={d.plane} material={d.planeMat} />
			{d.routeGeos.map((g, i) => (
				<mesh key={i} geometry={g} material={d.routeMat} />
			))}
			<points geometry={d.glow.geo} material={d.glow.mat} />
			<points geometry={d.ventGlow.geo} material={d.ventGlow.mat} />
			{d.hops.map((g, i) => {
				const p = Math.min(1, Math.max(0, hop - i));
				if (p <= 0 || whaling > 0.5) return null;
				g.setDrawRange(0, Math.floor((g.index!.count * p) / 6) * 6);
				return <mesh key={i} geometry={g} material={d.hopMat} />;
			})}
		</Stage>
	);
};
