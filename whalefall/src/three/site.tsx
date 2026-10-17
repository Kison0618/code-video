// 鲸落现场：海底 + 尸体/骨架 + 各阶段的生物。各场景只调参数。
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Seabed, seabedHeight, makeGlowPoints} from './env';
import {whaleGeometry, whaleMaterial, skeletonGeometry, sampleSurface} from './whaleGeo';
import {Hagfish, SquatLobsters, ShellBed, BacterialMat, sharkGeometry, useSharkMaterial} from './creatures';
import {mulberry32} from '../lib/rand';

export const WL = 18; // 鲸长（米）
export const GROUND = seabedHeight(0, 0);

export type SiteState = {
	flesh?: number; // 1 = 完整的尸体，0 = 没有肉
	fleshShrink?: number; // 0..1 肉被吃掉的程度（体形变瘦）
	bones?: number; // 骨架可见
	hagfish?: number;
	shark?: number; // 睡鲨经过的进度 0..1，<0 不出现
	lobsters?: number;
	redFuzz?: number; // 骨头上的食骨蠕虫（远景只是一层红色绒毛）
	mats?: number; // 细菌毯覆盖
	matGlow?: number;
	shells?: number; // 贝类生长 0..1
	glow?: number; // 发光颗粒
	amphipods?: number;
};

/** 鲸落现场用到的几何与采样点：只算一次 */
export function useSiteData() {
	return useMemo(() => {
		const skel = skeletonGeometry(WL, 7);
		skel.translate(0, GROUND - 0.08, 0);
		const bodyGeo = whaleGeometry(WL, {dark: '#2a3238', light: '#6f767a'});
		const onBone = sampleSurface(skel, 6000, 3, 0.4);
		// 鲸体表面（盲鳗附着点）：按尸体的摆放变换过
		const bodyM = new THREE.Matrix4().compose(new THREE.Vector3(0, GROUND + 1.25, 0), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.55, 0, -0.02)), new THREE.Vector3(1, 1, 1));
		const bodyPts = sampleSurface(bodyGeo.clone().applyMatrix4(bodyM), 400, 5, 0.6);
		// 骨架周围的泥地（贝类、铠甲虾）
		const r = mulberry32(9);
		const n = 3000;
		const ground = new Float32Array(n * 3);
		const groundN = new Float32Array(n * 3);
		for (let i = 0; i < n; i++) {
			const x = (r() - 0.5) * WL * 1.15;
			const z = (r() - 0.5) * 8 * Math.pow(r(), 0.5) + 0.5 * Math.sin(x * 0.2);
			ground[i * 3] = x;
			ground[i * 3 + 1] = seabedHeight(x, z) + 0.02;
			ground[i * 3 + 2] = z;
			groundN[i * 3 + 1] = 1;
		}
		// 骨头 + 周围泥地 合在一起的贝类位置
		const shellSpots = new Float32Array(onBone.points.length + ground.length);
		shellSpots.set(onBone.points);
		shellSpots.set(ground, onBone.points.length);
		const shellN = new Float32Array(onBone.normals.length + groundN.length);
		shellN.set(onBone.normals);
		shellN.set(groundN, onBone.normals.length);
		// 发光颗粒：骨架上方的细菌/生物发光
		const gp = new Float32Array(1600 * 3);
		const gc = new Float32Array(1600 * 3);
		const palette = [new THREE.Color('#7dfff0'), new THREE.Color('#bfffe8'), new THREE.Color('#9fd8ff'), new THREE.Color('#ffe3a8')];
		for (let i = 0; i < 1600; i++) {
			const j = Math.floor(r() * (onBone.points.length / 3));
			gp[i * 3] = onBone.points[j * 3] + (r() - 0.5) * 0.8;
			gp[i * 3 + 1] = onBone.points[j * 3 + 1] + r() * r() * 2.0;
			gp[i * 3 + 2] = onBone.points[j * 3 + 2] + (r() - 0.5) * 0.8;
			const c = palette[Math.floor(r() * palette.length)];
			gc[i * 3] = c.r; gc[i * 3 + 1] = c.g; gc[i * 3 + 2] = c.b;
		}
		const glow = makeGlowPoints(gp, gc, 4);
		// 端足类：围着尸体的一群小亮点
		const amph = new Float32Array(2500 * 3);
		const ac = new Float32Array(2500 * 3);
		for (let i = 0; i < 2500; i++) {
			const j = Math.floor(r() * (bodyPts.points.length / 3));
			amph[i * 3] = bodyPts.points[j * 3] + (r() - 0.5) * 1.2;
			amph[i * 3 + 1] = bodyPts.points[j * 3 + 1] + (r() - 0.3) * 1.0;
			amph[i * 3 + 2] = bodyPts.points[j * 3 + 2] + (r() - 0.5) * 1.2;
			ac[i * 3] = 0.9; ac[i * 3 + 1] = 0.85; ac[i * 3 + 2] = 0.75;
		}
		const amphi = makeGlowPoints(amph, ac, 6);
		amphi.mat.uniforms.uSize.value = 0.025;
		return {skel, bodyGeo, onBone, bodyPts, ground, groundN, shellSpots, shellN, glow, amphi};
	}, []);
}

export const WhaleFallSite: React.FC<{t: number; s: SiteState; seabed?: boolean}> = ({t, s, seabed = true}) => {
	const d = useSiteData();
	const bodyMat = useMemo(() => {
		const {material} = whaleMaterial();
		material.transparent = true;
		return material;
	}, []);
	const boneMat = useMemo(() => new THREE.MeshStandardMaterial({color: '#d6c9ae', roughness: 0.82, metalness: 0}), []);
	const sharkGeo = useMemo(() => sharkGeometry(3.6), []);
	const shark = useSharkMaterial();
	shark.u.uTime.value = t;

	const flesh = s.flesh ?? 0;
	const shrink = s.fleshShrink ?? 0;
	bodyMat.opacity = Math.min(1, flesh);
	bodyMat.depthWrite = flesh > 0.95;
	d.glow.mat.uniforms.uTime.value = t;
	d.glow.mat.uniforms.uI.value = s.glow ?? 0;
	d.amphi.mat.uniforms.uTime.value = t * 6;
	d.amphi.mat.uniforms.uI.value = s.amphipods ?? 0;

	// 睡鲨：从画面一侧慢慢游过
	const sp = s.shark ?? -1;
	const sharkPos: [number, number, number] = [THREE.MathUtils.lerp(-16, 14, sp), GROUND + 2.6 + Math.sin(sp * 3) * 0.4, 5.5 - sp * 3];

	return (
		<group>
			{seabed ? <Seabed /> : null}
			{flesh > 0.01 ? (
				<group position={[0, GROUND + 1.25 - shrink * 0.35, 0]} rotation={[0.55, 0, -0.02]} scale={[1, 1 - shrink * 0.45, 1 - shrink * 0.4]}>
					<mesh geometry={d.bodyGeo} material={bodyMat} castShadow receiveShadow />
				</group>
			) : null}
			{(s.bones ?? 0) > 0.01 ? <mesh geometry={d.skel} material={boneMat} castShadow receiveShadow /> : null}
			{(s.hagfish ?? 0) > 0 ? <Hagfish t={t} anchors={d.bodyPts.points} normals={d.bodyPts.normals} visible={s.hagfish} /> : null}
			{sp >= 0 && sp <= 1 ? (
				<group position={sharkPos} rotation={[0, -0.12, 0]}>
					<mesh geometry={sharkGeo} material={shark.m} castShadow />
				</group>
			) : null}
			{(s.mats ?? 0) > 0 ? <BacterialMat spots={d.onBone.points} normals={d.onBone.normals} cover={s.mats} glow={s.matGlow ?? 0} /> : null}
			{(s.redFuzz ?? 0) > 0 ? <BacterialMat spots={d.onBone.points} normals={d.onBone.normals} count={3500} size={0.05} color="#d8483c" cover={s.redFuzz} glow={0} seed={77} /> : null}
			{(s.shells ?? 0) > 0 ? <ShellBed spots={d.shellSpots} normals={d.shellN} grow={s.shells} count={900} /> : null}
			{(s.lobsters ?? 0) > 0 ? <SquatLobsters t={t} spots={d.ground} visible={s.lobsters} count={70} scale={1.0} /> : null}
			{(s.glow ?? 0) > 0 ? <points geometry={d.glow.geo} material={d.glow.mat} /> : null}
			{(s.amphipods ?? 0) > 0 ? <points geometry={d.amphi.geo} material={d.amphi.mat} /> : null}
		</group>
	);
};
