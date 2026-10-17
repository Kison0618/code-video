// 0 – 22.4 秒：海面上死去的鲸 → 沉过阳光、暮光、黑暗 → 落在 2000 米海底 → 探照灯亮起（片名在这里）
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Stage, CameraRig, Vec3} from '../three/Stage';
import {MarineSnow, Lamp, Spot, Seabed, SeaSurface, GodRays, WaterSky, seabedHeight} from '../three/env';
import {whaleGeometry, whaleMaterial} from '../three/whaleGeo';
import {Fog, keyframes, mixColor, useT, softDot} from '../three/helpers';
import {mulberry32} from '../lib/rand';
import {prog, easeOut, lerp, easeInOut} from '../lib/time';

const FLOOR = -2000;
const LAND = 15.1;
export const depthAt = (t: number) =>
	keyframes(t, [
		[5.4, 0],
		[6.6, 45],
		[7.9, 200],
		[10.9, 1000],
		[13.4, 1990],
		[LAND, 1998.6],
	]);

/** 落地时扬起的泥沙 */
const SiltPlume: React.FC<{t: number; at: Vec3}> = ({t, at}) => {
	const N = 1800;
	const {geo, mat, seeds} = useMemo(() => {
		const r = mulberry32(21);
		const s = new Float32Array(N * 4);
		for (let i = 0; i < N; i++) {
			s[i * 4] = r() * Math.PI * 2;
			s[i * 4 + 1] = r();
			s[i * 4 + 2] = r();
			s[i * 4 + 3] = (r() - 0.5) * 18; // 沿鲸体长分布
		}
		const g = new THREE.BufferGeometry();
		g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3));
		g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e5);
		const m = new THREE.PointsMaterial({color: '#a89a82', size: 0.9, map: softDot(), transparent: true, opacity: 0.2, depthWrite: false, sizeAttenuation: true});
		return {geo: g, mat: m, seeds: s};
	}, []);
	const k = Math.max(0, t - LAND);
	const p = geo.attributes.position.array as Float32Array;
	for (let i = 0; i < N; i++) {
		const a = seeds[i * 4], sp = seeds[i * 4 + 1], up = seeds[i * 4 + 2], x = seeds[i * 4 + 3];
		const rr = (1 - Math.exp(-k * (0.6 + sp))) * (2 + sp * 6);
		p[i * 3] = at[0] + x + Math.cos(a) * rr * 0.4;
		p[i * 3 + 1] = at[1] - 1.2 + (1 - Math.exp(-k * 0.8)) * up * 2.2;
		p[i * 3 + 2] = at[2] + Math.sin(a) * rr;
	}
	geo.attributes.position.needsUpdate = true;
	mat.opacity = 0.1 * Math.min(1, k * 3) * Math.exp(-k * 0.15);
	if (t < LAND) return null;
	return <points geometry={geo} material={mat} frustumCulled={false} />;
};

export const S01Descent: React.FC = () => {
	const t = useT();
	const {geo, mat} = useMemo(() => {
		const g = whaleGeometry(18);
		const {material, uniforms} = whaleMaterial();
		uniforms.uL.value = 18;
		return {geo: g, mat: material};
	}, []);

	const D = depthAt(t);
	const restY = FLOOR + seabedHeight(0, 0) + 1.25;
	// 鲸的位置：海面漂着 → 下沉 → 落地
	const whaleY = t < LAND ? lerp(-1.2, restY, Math.min(1, D / 1998.6)) : restY;
	const roll = lerp(0.15, 0.55, easeOut(prog(t, 4, 15))); // 慢慢侧过去
	const pitch = Math.sin(t * 0.4) * 0.03 + (t < LAND ? -0.06 * prog(t, 5.4, 9) : -0.02);
	const whalePos: Vec3 = [0, whaleY, 0];

	// 光线随深度衰减：200 米剩 1%，1000 米全黑
	const sun = Math.exp(-D / 45);
	const blue = Math.exp(-D / 260);
	const fogCol = D < 1 ? '#0e5568' : mixColor(mixColor('#0e5568', '#061a33', Math.min(1, D / 200)), '#010309', Math.min(1, D / 1000));
	const fogDen = lerp(0.018, 0.045, Math.min(1, D / 800));

	// 相机
	let cam: Vec3;
	let look: Vec3;
	let fov = 48;
	if (t < 5.4) {
		// 从正下方往上看：鲸是亮海面上的一道剪影
		const k = t / 5.4;
		cam = [lerp(7, 5, k), lerp(-19, -17, k), lerp(11, 9.5, k)];
		look = [lerp(-1, 0.5, k), -1.4, 0];
		fov = 52;
	} else if (t < LAND) {
		const k = prog(t, 5.4, LAND);
		const ang = 0.75 + k * 0.9;
		cam = [Math.cos(ang) * 17, whaleY + lerp(-8, 3, easeInOut(k)), Math.sin(ang) * 17];
		look = [0, whaleY - lerp(2, 0.5, k), 0];
	} else {
		// 深潜器视角
		const k = easeOut(prog(t, LAND, 22.4));
		cam = [lerp(-19, -14.5, k), FLOOR + lerp(5.0, 3.6, k), lerp(17, 12.5, k)];
		look = [lerp(2, 0.5, k), restY - 0.6, 0];
		fov = 42;
	}
	const lampOn = t < LAND + 0.5 ? 0 : Math.min(1, (t - LAND - 0.5) / 0.12) * (t < LAND + 0.75 ? 0.6 + 0.4 * Math.sin(t * 90) : 1); // 灯亮起时闪两下
	const lampPos: Vec3 = [cam[0] + 0.6, cam[1] + 0.8, cam[2] - 0.3];
	const lampTarget: Vec3 = [1.5, restY + 0.4, 0];
	const lampDir: Vec3 = [lampTarget[0] - lampPos[0], lampTarget[1] - lampPos[1], lampTarget[2] - lampPos[2]];

	return (
		<Stage bloom={1.1} bloomThreshold={0.3} shadows>
			<CameraRig pos={cam} look={look} fov={fov} />
			<Fog color={fogCol} density={fogDen} />
			<ambientLight intensity={0.25 + 1.6 * blue} color="#6fb6d6" />
			<directionalLight position={[20, 200, -30]} intensity={6 * sun} color="#e8f6ff" />
			<hemisphereLight args={['#7fd0ff', '#02060b', 1.2 * blue]} />
			{D < 260 ? <SeaSurface t={t} cam={cam} y={0} intensity={0.62 * Math.max(0, 1 - D / 220)} /> : null}
			{D < 300 ? <GodRays t={t} cam={cam} center={[0, 0, 0]} topY={0} intensity={2.4 * Math.max(0, 1 - D / 260)} len={140} spread={70} /> : null}
			<WaterSky cam={cam} top={D < 1 ? '#3fa7c4' : mixColor(mixColor('#3fa7c4', '#0a2a4a', Math.min(1, D / 200)), '#010309', Math.min(1, D / 900))} mid={fogCol} bot={mixColor('#05223a', '#010205', Math.min(1, D / 400))} />
			<group position={whalePos} rotation={[roll, 0.25, pitch]}>
				<mesh geometry={geo} material={mat} castShadow receiveShadow />
			</group>
			<MarineSnow t={t} cam={cam} ambient={lerp(0.5, 0.06, Math.min(1, D / 900))} lamp={lampOn} lampPos={lampPos} lampDir={lampDir} count={7000} box={34} />
			{t > 12 ? <Seabed y={FLOOR} center={[0, 0]} /> : null}
			{t >= LAND ? <SiltPlume t={t} at={[0, restY, 0]} /> : null}
			{lampOn > 0 ? <Lamp pos={lampPos} target={lampTarget} intensity={lampOn} length={30} angle={0.42} shadow /> : null}
			{lampOn > 0 ? <Spot pos={[cam[0] - 3, cam[1] + 2.5, cam[2] + 1]} target={[0, restY, 0]} intensity={lampOn * 140} /> : null}
			{lampOn > 0 ? <ambientLight intensity={0.05} color="#9fc4d8" /> : null}
		</Stage>
	);
};
