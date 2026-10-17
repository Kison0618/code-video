// 深海环境：海雪、探照灯光锥、海底、海面与光柱、发光颗粒。
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mulberry32} from '../lib/rand';
import type {Vec3} from './Stage';

// —— 值噪声（海底起伏用） ——
function hash2(x: number, y: number) {
	const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
	return s - Math.floor(s);
}
function vnoise(x: number, y: number) {
	const xi = Math.floor(x), yi = Math.floor(y);
	const xf = x - xi, yf = y - yi;
	const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
	const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
	return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
export function fbm(x: number, y: number, oct = 5) {
	let s = 0, amp = 0.5, f = 1;
	for (let i = 0; i < oct; i++) {
		s += amp * vnoise(x * f, y * f);
		f *= 2.03;
		amp *= 0.5;
	}
	return s;
}
export const seabedHeight = (x: number, z: number) =>
	(fbm(x * 0.06, z * 0.06) - 0.5) * 1.6 + (fbm(x * 0.6 + 7, z * 0.6) - 0.5) * 0.18 + Math.sin(x * 2.1 + z * 0.7 + fbm(x * 0.2, z * 0.2) * 6) * 0.025;

// ———————————————— 海雪 ————————————————
const snowVert = /* glsl */ `
uniform float uTime, uBox, uFall, uSize, uLamp, uAmb;
uniform vec3 uCam, uLampPos, uLampDir;
attribute float aRand;
varying float vA;
varying float vLit;
void main(){
	vec3 p = position;
	p.y -= uTime * uFall * (0.5 + aRand);
	p.x += sin(uTime * 0.23 + aRand * 40.0) * 0.35;
	p.z += cos(uTime * 0.19 + aRand * 23.0) * 0.35;
	p = mod(p - uCam + uBox * 0.5, uBox) - uBox * 0.5 + uCam;
	vec4 mv = modelViewMatrix * vec4(p, 1.0);
	gl_Position = projectionMatrix * mv;
	vec3 d = p - uLampPos;
	float dist = length(d);
	float cone = smoothstep(0.86, 0.985, dot(d / dist, uLampDir));
	float lit = uLamp * cone * 9.0 / (1.0 + 0.03 * dist * dist);
	float camD = -mv.z;
	vA = (uAmb + lit) * smoothstep(0.25, 1.4, camD) * (1.0 - smoothstep(uBox * 0.35, uBox * 0.5, camD));
	vLit = lit;
	gl_PointSize = uSize * (0.35 + aRand * aRand * 1.4) * 600.0 / camD;
}`;
const snowFrag = /* glsl */ `
uniform vec3 uColor;
varying float vA;
varying float vLit;
void main(){
	float r = length(gl_PointCoord - 0.5);
	float a = smoothstep(0.5, 0.0, r);
	gl_FragColor = vec4(uColor * (0.7 + vLit * 0.6), a * vA);
}`;

export const MarineSnow: React.FC<{
	t: number;
	cam: Vec3;
	count?: number;
	box?: number;
	fall?: number;
	size?: number;
	lamp?: number;
	ambient?: number;
	lampPos?: Vec3;
	lampDir?: Vec3;
	color?: string;
	seed?: number;
}> = ({t, cam, count = 6000, box = 30, fall = 0.12, size = 0.035, lamp = 0, ambient = 0.25, lampPos = [0, 0, 0], lampDir = [0, 0, -1], color = '#cfe6f2', seed = 3}) => {
	const {geo, mat} = useMemo(() => {
		const r = mulberry32(seed);
		const p = new Float32Array(count * 3);
		const a = new Float32Array(count);
		for (let i = 0; i < count; i++) {
			p[i * 3] = (r() - 0.5) * box;
			p[i * 3 + 1] = (r() - 0.5) * box;
			p[i * 3 + 2] = (r() - 0.5) * box;
			a[i] = r();
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(p, 3));
		g.setAttribute('aRand', new THREE.BufferAttribute(a, 1));
		g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e6);
		const m = new THREE.ShaderMaterial({
			vertexShader: snowVert,
			fragmentShader: snowFrag,
			transparent: true,
			depthWrite: false,
			blending: THREE.AdditiveBlending,
			uniforms: {
				uTime: {value: 0}, uBox: {value: box}, uFall: {value: fall}, uSize: {value: size}, uLamp: {value: 0}, uAmb: {value: ambient},
				uCam: {value: new THREE.Vector3()}, uLampPos: {value: new THREE.Vector3()}, uLampDir: {value: new THREE.Vector3(0, 0, -1)}, uColor: {value: new THREE.Color(color)},
			},
		});
		return {geo: g, mat: m};
	}, [count, box, seed, color, fall, size]);
	const u = mat.uniforms;
	u.uTime.value = t;
	u.uLamp.value = lamp;
	u.uAmb.value = ambient;
	u.uCam.value.set(...cam);
	u.uLampPos.value.set(...lampPos);
	u.uLampDir.value.set(...lampDir).normalize();
	return <points geometry={geo} material={mat} frustumCulled={false} />;
};

// ———————————————— 探照灯光锥（体积光的假象） ————————————————
const coneVert = /* glsl */ `
varying float vL; varying vec3 vN; varying vec3 vV;
void main(){
	vL = uv.y;
	vec4 mv = modelViewMatrix * vec4(position, 1.0);
	vN = normalize(normalMatrix * normal);
	vV = normalize(-mv.xyz);
	gl_Position = projectionMatrix * mv;
}`;
const coneFrag = /* glsl */ `
uniform float uI; uniform vec3 uColor;
varying float vL; varying vec3 vN; varying vec3 vV;
void main(){
	float edge = pow(abs(dot(vN, vV)), 2.2);
	float along = pow(vL, 1.6);
	gl_FragColor = vec4(uColor, uI * edge * along * 0.22);
}`;

/** 从 pos 指向 target 的一束光：SpotLight + 半透明光锥 */
export const Lamp: React.FC<{pos: Vec3; target: Vec3; intensity?: number; length?: number; angle?: number; cone?: number; color?: string; shadow?: boolean}> = ({
	pos, target, intensity = 1, length = 18, angle = 0.42, cone = 1, color = '#e9f4ff', shadow = false,
}) => {
	const {geo, mat, tgt} = useMemo(() => {
		const g = new THREE.CylinderGeometry(0.06, Math.tan(angle) * length, length, 48, 1, true);
		g.translate(0, -length / 2, 0);
		g.rotateX(Math.PI / 2); // 远端在 -z：lookAt 之后指向目标
		const m = new THREE.ShaderMaterial({
			vertexShader: coneVert, fragmentShader: coneFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
			uniforms: {uI: {value: 1}, uColor: {value: new THREE.Color(color)}},
		});
		return {geo: g, mat: m, tgt: new THREE.Object3D()};
	}, [length, angle, color]);
	mat.uniforms.uI.value = intensity * cone;
	tgt.position.set(...target);
	const m4 = useMemo(() => new THREE.Matrix4(), []);
	const q = useMemo(() => new THREE.Quaternion(), []);
	m4.lookAt(new THREE.Vector3(...pos), new THREE.Vector3(...target), new THREE.Vector3(0, 1, 0));
	q.setFromRotationMatrix(m4);
	return (
		<>
			<primitive object={tgt} />
			<spotLight
				position={pos}
				target={tgt}
				angle={angle}
				penumbra={0.85}
				intensity={intensity * 320}
				distance={length * 3}
				decay={1.6}
				color={color}
				castShadow={shadow}
				shadow-mapSize-width={2048}
				shadow-mapSize-height={2048}
				shadow-bias={-0.0005}
			/>
			<mesh geometry={geo} material={mat} position={pos} quaternion={q} renderOrder={5} />
		</>
	);
};

/** 只有光、没有光锥的聚光灯（补光用） */
export const Spot: React.FC<{pos: Vec3; target: Vec3; intensity?: number; angle?: number; color?: string; distance?: number; shadow?: boolean}> = ({pos, target, intensity = 300, angle = 0.5, color = '#cfe3f0', distance = 60, shadow = false}) => {
	const tgt = useMemo(() => new THREE.Object3D(), []);
	tgt.position.set(...target);
	return (
		<>
			<primitive object={tgt} />
			<spotLight position={pos} target={tgt} angle={angle} penumbra={0.8} intensity={intensity} decay={1.6} distance={distance} color={color} castShadow={shadow} shadow-mapSize-width={1024} shadow-mapSize-height={1024} />
		</>
	);
};

// ———————————————— 海底 ————————————————
export const Seabed: React.FC<{size?: number; seg?: number; color?: string; y?: number; center?: [number, number]; rocks?: number}> = ({size = 160, seg = 220, color = '#55514a', y = 0, center = [0, 0], rocks = 160}) => {
	const {geo, mat, rockGeo, rockMat, rockMats} = useMemo(() => {
		const g = new THREE.PlaneGeometry(size, size, seg, seg);
		g.rotateX(-Math.PI / 2);
		const p = g.attributes.position.array as Float32Array;
		const col = new Float32Array(p.length);
		const base = new THREE.Color(color);
		const c = new THREE.Color();
		for (let i = 0; i < p.length; i += 3) {
			const x = p[i] + center[0], z = p[i + 2] + center[1];
			p[i + 1] = seabedHeight(x, z);
			const v = fbm(x * 0.35 + 3, z * 0.35 - 2, 3);
			c.copy(base).multiplyScalar(0.75 + 0.5 * v);
			col[i] = c.r; col[i + 1] = c.g; col[i + 2] = c.b;
		}
		g.setAttribute('color', new THREE.BufferAttribute(col, 3));
		g.computeVertexNormals();
		const m = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 1, metalness: 0});
		const rg = new THREE.DodecahedronGeometry(1, 1);
		const rm = new THREE.MeshStandardMaterial({color: '#4c4944', roughness: 1});
		const r = mulberry32(11);
		const mats: THREE.Matrix4[] = [];
		for (let i = 0; i < rocks; i++) {
			const x = (r() - 0.5) * size * 0.8, z = (r() - 0.5) * size * 0.8;
			const s = 0.05 + Math.pow(r(), 3) * 0.6;
			const mm = new THREE.Matrix4().compose(
				new THREE.Vector3(x, seabedHeight(x + center[0], z + center[1]) - s * 0.3, z),
				new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)),
				new THREE.Vector3(s * (0.8 + r()), s * 0.6, s * (0.8 + r()))
			);
			mats.push(mm);
		}
		return {geo: g, mat: m, rockGeo: rg, rockMat: rm, rockMats: mats};
	}, [size, seg, color, center[0], center[1], rocks]);
	const inst = useMemo(() => {
		const im = new THREE.InstancedMesh(rockGeo, rockMat, rockMats.length);
		rockMats.forEach((m, i) => im.setMatrixAt(i, m));
		im.receiveShadow = true;
		im.castShadow = true;
		return im;
	}, [rockGeo, rockMat, rockMats]);
	return (
		<group position={[0, y, 0]}>
			<mesh geometry={geo} material={mat} receiveShadow />
			<primitive object={inst} />
		</group>
	);
};

// ———————————————— 海面（从水下往上看） ————————————————
const surfVert = /* glsl */ `
varying vec3 vW;
void main(){ vec4 w = modelMatrix * vec4(position,1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const surfFrag = /* glsl */ `
uniform float uTime, uI; uniform vec3 uSun, uCam;
varying vec3 vW;
float wave(vec2 p){
	float s = 0.0;
	for (int i = 0; i < 5; i++) {
		float a = float(i) * 1.7;
		vec2 d = vec2(cos(a), sin(a));
		s += sin(dot(p, d) * (2.0 + float(i) * 0.9) + uTime * (0.6 + 0.2 * float(i)));
	}
	return s / 5.0;
}
void main(){
	vec2 p = vW.xz * 0.6;
	float h = wave(p) + 0.5 * wave(p * 2.3 + 3.0);
	float caust = pow(1.0 - abs(sin(h * 4.0)), 8.0);
	vec3 d = normalize(vW - uCam);
	float win = smoothstep(0.55, 0.95, -dot(d, vec3(0.0,-1.0,0.0)) * 1.0); // 斯涅尔窗
	float sun = pow(max(dot(d, normalize(uSun)), 0.0), 60.0);
	vec3 col = mix(vec3(0.02,0.18,0.26), vec3(0.55,0.85,0.95), win) + caust*0.35*win + sun*vec3(2.5,2.3,1.9);
	gl_FragColor = vec4(col * uI, 1.0);
}`;

export const SeaSurface: React.FC<{t: number; cam: Vec3; y?: number; intensity?: number; sun?: Vec3}> = ({t, cam, y = 0, intensity = 1, sun = [0.25, 1, -0.4]}) => {
	const {geo, mat} = useMemo(() => {
		const g = new THREE.PlaneGeometry(1200, 1200, 1, 1);
		g.rotateX(Math.PI / 2); // 法线朝下
		const m = new THREE.ShaderMaterial({
			vertexShader: surfVert, fragmentShader: surfFrag, side: THREE.DoubleSide, depthWrite: false,
			uniforms: {uTime: {value: 0}, uI: {value: 1}, uSun: {value: new THREE.Vector3()}, uCam: {value: new THREE.Vector3()}},
		});
		return {geo: g, mat: m};
	}, []);
	mat.uniforms.uTime.value = t;
	mat.uniforms.uI.value = intensity;
	mat.uniforms.uSun.value.set(...sun);
	mat.uniforms.uCam.value.set(...cam);
	return <mesh geometry={geo} material={mat} position={[cam[0], y, cam[2]]} />;
};

// ———————————————— 光柱 ————————————————
const rayVert = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `;
const rayFrag = /* glsl */ `
uniform float uTime, uI, uSeed; varying vec2 vUv;
void main(){
	float x = vUv.x - 0.5;
	float core = exp(-x * x * 22.0);
	float flick = 0.6 + 0.4 * sin(uTime * 0.6 + uSeed * 9.0);
	float a = core * pow(vUv.y, 1.7) * smoothstep(1.0, 0.94, vUv.y) * flick;
	gl_FragColor = vec4(vec3(0.62,0.9,1.0), a * uI * 0.16);
}`;

/** 从海面斜射下来的光柱：每一根都转向相机，边缘柔和 */
export const GodRays: React.FC<{t: number; cam: Vec3; center: Vec3; topY?: number; count?: number; len?: number; intensity?: number; spread?: number}> = ({t, cam, center, topY = 0, count = 22, len = 90, intensity = 1, spread = 40}) => {
	const rays = useMemo(() => {
		const r = mulberry32(5);
		return new Array(count).fill(0).map(() => {
			const w = 3 + r() * 9;
			const g = new THREE.PlaneGeometry(w, len);
			g.translate(0, -len / 2, 0);
			const m = new THREE.ShaderMaterial({
				vertexShader: rayVert, fragmentShader: rayFrag, transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
				uniforms: {uTime: {value: 0}, uI: {value: 1}, uSeed: {value: r() * 10}},
			});
			return {g, m, x: (r() - 0.5) * spread, z: (r() - 0.5) * spread, sway: r() * 6};
		});
	}, [count, len, spread]);
	return (
		<group position={[center[0], topY, center[2]]}>
			{rays.map((ray, i) => {
				ray.m.uniforms.uTime.value = t;
				ray.m.uniforms.uI.value = intensity;
				const x = ray.x + Math.sin(t * 0.12 + ray.sway) * 1.5;
				const ry = Math.atan2(cam[0] - (center[0] + x), cam[2] - (center[2] + ray.z));
				return (
					<group key={i} position={[x, 0, ray.z]} rotation={[0, ry, 0]}>
						<mesh geometry={ray.g} material={ray.m} rotation={[0, 0, 0.18]} />
					</group>
				);
			})}
		</group>
	);
};

// ———————————————— 水体背景：上亮下暗的渐变球 ————————————————
const skyVert = /* glsl */ `varying vec3 vD; void main(){ vD = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);} `;
const skyFrag = /* glsl */ `
uniform vec3 uTop, uMid, uBot; varying vec3 vD;
void main(){
	float y = vD.y;
	vec3 c = y > 0.0 ? mix(uMid, uTop, pow(y, 0.8)) : mix(uMid, uBot, pow(-y, 0.6));
	gl_FragColor = vec4(c, 1.0);
}`;
export const WaterSky: React.FC<{cam: Vec3; top: string; mid: string; bot: string}> = ({cam, top, mid, bot}) => {
	const {geo, mat} = useMemo(() => {
		const g = new THREE.SphereGeometry(1500, 32, 16);
		const m = new THREE.ShaderMaterial({
			vertexShader: skyVert, fragmentShader: skyFrag, side: THREE.BackSide, depthWrite: false,
			uniforms: {uTop: {value: new THREE.Color()}, uMid: {value: new THREE.Color()}, uBot: {value: new THREE.Color()}},
		});
		return {geo: g, mat: m};
	}, []);
	mat.uniforms.uTop.value.set(top);
	mat.uniforms.uMid.value.set(mid);
	mat.uniforms.uBot.value.set(bot);
	return <mesh geometry={geo} material={mat} position={cam} renderOrder={-10} />;
};

// ———————————————— 发光颗粒（细菌、生物发光） ————————————————
const glowVert = /* glsl */ `
uniform float uTime, uSize, uI;
attribute float aRand; attribute vec3 aColor;
varying vec3 vC; varying float vA;
void main(){
	vec3 p = position + vec3(sin(uTime*0.5+aRand*30.0), cos(uTime*0.4+aRand*17.0), sin(uTime*0.3+aRand*11.0)) * 0.02;
	vec4 mv = modelViewMatrix * vec4(p,1.0);
	gl_Position = projectionMatrix * mv;
	float tw = 0.65 + 0.35 * sin(uTime * (1.0 + aRand * 2.0) + aRand * 50.0);
	vC = aColor; vA = uI * tw;
	gl_PointSize = uSize * (0.5 + aRand) * 600.0 / -mv.z;
}`;
const glowFrag = /* glsl */ `
varying vec3 vC; varying float vA;
void main(){ float r = length(gl_PointCoord-0.5); float a = smoothstep(0.5,0.0,r); a = a*a; gl_FragColor = vec4(vC * 2.0, a * vA); }`;

export function makeGlowPoints(points: Float32Array, colors: Float32Array, seed = 2) {
	const r = mulberry32(seed);
	const n = points.length / 3;
	const a = new Float32Array(n);
	for (let i = 0; i < n; i++) a[i] = r();
	const g = new THREE.BufferGeometry();
	g.setAttribute('position', new THREE.BufferAttribute(points, 3));
	g.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
	g.setAttribute('aRand', new THREE.BufferAttribute(a, 1));
	g.computeBoundingSphere();
	const m = new THREE.ShaderMaterial({
		vertexShader: glowVert, fragmentShader: glowFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
		uniforms: {uTime: {value: 0}, uSize: {value: 0.05}, uI: {value: 1}},
	});
	return {geo: g, mat: m};
}
