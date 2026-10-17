// 125.46 – 138.2：2020 年，“深海勇士”号在南海 1600 米深处第一次发现鲸落：一头 3 米长的齿鲸，几十只白色铠甲虾，几条鼬鳚
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {DeepSet} from '../three/DeepSet';
import {Seabed, seabedHeight, Lamp} from '../three/env';
import {whaleGeometry, whaleMaterial} from '../three/whaleGeo';
import {SquatLobsters, sharkGeometry} from '../three/creatures';
import {useT} from '../three/helpers';
import {mulberry32} from '../lib/rand';
import {prog, easeInOut, easeOut, lerp, bar} from '../lib/time';
import type {Vec3} from '../three/Stage';

/** 示意的载人深潜器：白色艇身、观察窗、推进器、机械手、两盏灯 */
function submersibleGeometry() {
	const parts: THREE.BufferGeometry[] = [];
	const hull = new THREE.CapsuleGeometry(1.4, 5.5, 8, 24);
	hull.rotateZ(Math.PI / 2);
	hull.scale(1, 1.1, 1);
	parts.push(hull);
	const fin = new THREE.BoxGeometry(1.6, 1.4, 0.12);
	fin.translate(-3.6, 1.1, 0);
	parts.push(fin);
	for (const z of [-1.5, 1.5]) {
		const th = new THREE.CylinderGeometry(0.35, 0.35, 0.8, 16);
		th.rotateZ(Math.PI / 2);
		th.translate(-3.2, -0.4, z);
		parts.push(th);
	}
	const skid = new THREE.BoxGeometry(5, 0.15, 0.15);
	parts.push(skid.clone().translate(0, -1.75, 1.0), skid.clone().translate(0, -1.75, -1.0));
	return mergeGeometries(parts.map((g) => {
		g = g.index ? g.toNonIndexed() : g;
		g.deleteAttribute('uv');
		return g;
	}));
}

export const S09Shenhai: React.FC = () => {
	const t = useT();
	const d = useMemo(() => {
		const sub = submersibleGeometry();
		const subMat = new THREE.MeshStandardMaterial({color: '#e9eef0', roughness: 0.35, metalness: 0.1});
		const port = new THREE.SphereGeometry(0.55, 20, 14);
		const portMat = new THREE.MeshStandardMaterial({color: '#0b1a24', roughness: 0.05, metalness: 0.6});
		const small = whaleGeometry(3.0, {grooves: false, dark: '#3d4247', light: '#7b8086'});
		const {material} = whaleMaterial();
		const fish = sharkGeometry(0.45);
		const fishMat = new THREE.MeshStandardMaterial({color: '#b9aea0', roughness: 0.5});
		// 齿鲸周围的泥地（铠甲虾聚过来的位置）
		const r = mulberry32(3);
		const spots = new Float32Array(400 * 3);
		for (let i = 0; i < 400; i++) {
			const a = r() * 6.28, rr = 0.6 + r() * 1.8;
			const x = Math.cos(a) * rr * 1.4, z = Math.sin(a) * rr * 0.8;
			spots.set([x, seabedHeight(x + 40, z) - seabedHeight(40, 0), z], i * 3);
		}
		return {sub, subMat, port, portMat, small, material, fish, fishMat, spots};
	}, []);

	const subK = easeOut(prog(t, bar(59), 131.5));
	const subPos: Vec3 = [lerp(-6, -3.4, subK), lerp(14, 3.2, subK), lerp(-1, -0.5, subK)];
	let cam: Vec3, look: Vec3;
	if (t < 128.4) {
		const k = prog(t, bar(59), 128.4);
		cam = [subPos[0] + 14, subPos[1] + lerp(-1.0, -2.0, k), subPos[2] + 12];
		look = [subPos[0] + 1, subPos[1] - 0.3, subPos[2]];
	} else {
		const k = easeInOut(prog(t, 128.4, bar(65)));
		cam = [lerp(4.0, 2.4, k), lerp(2.6, 1.6, k), lerp(5.0, 3.3, k)];
		look = [lerp(0.6, 0.2, k), 0.25, 0];
	}
	const subLampOn = prog(t, 126.4, 126.6);
	const lampA: Vec3 = [subPos[0] + 3.2, subPos[1] - 0.6, subPos[2] + 0.8];
	return (
		<DeepSet t={t} cam={cam} look={look} fov={40} lamp={t < 128.4 ? 0.25 : 0.28} fill={t < 128.4 ? 1.4 : 0.3} lampTarget={t < 128.4 ? [subPos[0], subPos[1], subPos[2]] : [0, 0.2, 0]}>
			<group position={[0, -seabedHeight(40, 0), 0]}>
				<Seabed center={[40, 0]} />
			</group>
			{/* 深潜器 */}
			<group position={subPos} rotation={[0, 0.25, lerp(-0.08, 0.04, subK)]} visible={t < 128.4}>
				<mesh geometry={d.sub} material={d.subMat} castShadow />
				<mesh geometry={d.port} material={d.portMat} position={[3.9, -0.2, 0]} />
			</group>
			{subLampOn > 0 ? <Lamp pos={lampA} target={[0, 0, 0]} intensity={0.7 * subLampOn} length={16} angle={0.35} /> : null}
			{/* 3 米长的齿鲸，刚落下不久 */}
			<group position={[0, 0.32, 0]} rotation={[0.9, 0.3, 0]}>
				<mesh geometry={d.small} material={d.material} castShadow receiveShadow />
			</group>
			<SquatLobsters t={t} spots={d.spots} count={44} scale={0.9} visible={easeOut(prog(t, 128.2, 134.2))} />
			{[0, 1, 2].map((i) => {
				const a = t * 0.25 + i * 2.1;
				return (
					<group key={i} position={[Math.cos(a) * 2.4, 0.35 + i * 0.12, Math.sin(a) * 1.6]} rotation={[0, -a - Math.PI / 2, 0]}>
						<mesh geometry={d.fish} material={d.fishMat} />
					</group>
				);
			})}
		</DeepSet>
	);
};
