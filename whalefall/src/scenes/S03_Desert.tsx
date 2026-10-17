// 28.0 – 43.0：1987 年那副骨架 → 荒漠一样的海底、海雪 → 一头鲸落下来，2 吨碳 = 这片海底 2000 年的口粮
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {DeepSet} from '../three/DeepSet';
import {WhaleFallSite, GROUND, WL} from '../three/site';
import {Seabed, seabedHeight} from '../three/env';
import {Benthos} from '../three/benthos';
import {whaleGeometry, whaleMaterial} from '../three/whaleGeo';
import {useT} from '../three/helpers';
import {prog, easeOut, easeInOut, lerp} from '../lib/time';
import type {Vec3} from '../three/Stage';

/** 50 平方米的发光框 */
const Plot: React.FC<{a: number}> = ({a}) => {
	const geo = useMemo(() => {
		// 10 m × 5 m，沿着海底起伏贴地
		const w = 10, h = 5;
		const corners = [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2]];
		const pts: THREE.Vector3[] = [];
		for (let c = 0; c < 4; c++) {
			for (let i = 0; i < 40; i++) {
				const u = i / 40;
				const x = corners[c][0] + (corners[c + 1][0] - corners[c][0]) * u;
				const z = corners[c][1] + (corners[c + 1][1] - corners[c][1]) * u;
				pts.push(new THREE.Vector3(x, seabedHeight(x, z) + 0.08, z));
			}
		}
		return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 400, 0.035, 6, true);
	}, []);
	const mat = useMemo(() => new THREE.MeshBasicMaterial({color: '#ffcf8a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false}), []);
	mat.opacity = a;
	return <mesh geometry={geo} material={mat} />;
};

export const S03Desert: React.FC = () => {
	const t = useT();
	const {geo, mat} = useMemo(() => {
		const {material} = whaleMaterial();
		return {geo: whaleGeometry(WL, {dark: '#2a3238', light: '#6f767a'}), mat: material};
	}, []);

	if (t < 30.8) {
		// 1987：深潜器灯光下的骨架，白色细菌毯和贝
		const k = prog(t, 28.0, 30.8);
		const cam: Vec3 = [lerp(-9, -7, k), GROUND + lerp(4.2, 3.4, k), lerp(9, 7, k)];
		const look: Vec3 = [lerp(-2, 0, k), GROUND + 0.2, 0];
		return (
			<DeepSet t={t} cam={cam} look={look} fov={40} lamp={0.55} fill={0.6}>
				<WhaleFallSite t={t} s={{bones: 1, mats: 0.75, shells: 0.75, lobsters: 0.4}} />
			</DeepSet>
		);
	}
	// 荒漠：空旷的海底，海雪在灯里飘落；38.4 一头鲸从上方落进画面
	const k = prog(t, 30.8, 43.0);
	const cam: Vec3 = [lerp(-15, -12, easeInOut(k)), GROUND + lerp(3.2, 6.5, easeInOut(prog(t, 37.5, 42.5))), lerp(15, 13, k)];
	const look: Vec3 = [0, GROUND + lerp(0.2, 0.8, prog(t, 37.5, 42.5)), 0];
	const fallK = easeOut(prog(t, 38.3, 40.2));
	const whaleY = lerp(GROUND + 22, GROUND + 1.25, fallK);
	const plot = prog(t, 41.0, 41.8) * (1 - prog(t, 42.6, 43.0));
	return (
		<DeepSet t={t} cam={cam} look={look} fov={44} snow={1.3}>
			<Seabed />
			<Benthos t={t} />
			{t > 38.2 ? (
				<group position={[0, whaleY, 0]} rotation={[lerp(0.2, 0.55, fallK), 0, -0.02]}>
					<mesh geometry={geo} material={mat} castShadow receiveShadow />
				</group>
			) : null}
			<Plot a={plot} />
		</DeepSet>
	);
};
