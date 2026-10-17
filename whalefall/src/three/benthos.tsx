// 深海平原上零星的居民：海参（海猪）、蛇尾。用来说明“这里几乎什么都没有”，所以要很稀疏。
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {mergeGeometries} from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {seabedHeight} from './env';
import {mulberry32} from '../lib/rand';

function seaPigGeometry() {
	const parts: THREE.BufferGeometry[] = [];
	const body = new THREE.CapsuleGeometry(0.06, 0.16, 6, 12);
	body.rotateZ(Math.PI / 2);
	body.scale(1, 0.75, 0.9);
	parts.push(body);
	for (let i = 0; i < 5; i++) {
		for (const side of [-1, 1]) {
			const leg = new THREE.ConeGeometry(0.012, 0.06, 5);
			leg.rotateX(Math.PI);
			leg.translate(-0.1 + i * 0.05, -0.06, side * 0.045);
			parts.push(leg);
		}
	}
	for (let i = 0; i < 3; i++) {
		const papilla = new THREE.ConeGeometry(0.01, 0.07, 5);
		papilla.rotateZ(-0.5);
		papilla.translate(0.08 - i * 0.03, 0.06, (i - 1) * 0.02);
		parts.push(papilla);
	}
	return mergeGeometries(parts.map((g) => g.toNonIndexed()));
}

function brittleStarGeometry(seed: number) {
	const r = mulberry32(seed);
	const parts: THREE.BufferGeometry[] = [new THREE.CylinderGeometry(0.035, 0.04, 0.015, 10).toNonIndexed()];
	for (let k = 0; k < 5; k++) {
		const a = (k / 5) * Math.PI * 2;
		const pts: THREE.Vector3[] = [];
		const curl = (r() - 0.5) * 2;
		for (let i = 0; i <= 10; i++) {
			const u = i / 10;
			const ang = a + curl * u * u;
			pts.push(new THREE.Vector3(Math.cos(ang) * (0.03 + u * 0.22), 0.005 + Math.sin(u * 3) * 0.01, Math.sin(ang) * (0.03 + u * 0.22)));
		}
		parts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.006, 4, false).toNonIndexed());
	}
	return mergeGeometries(parts.map((g) => {
		g.deleteAttribute('uv');
		return g;
	}));
}

export const Benthos: React.FC<{t: number; area?: number; pigs?: number; stars?: number; seed?: number}> = ({t, area = 40, pigs = 14, stars = 40, seed = 17}) => {
	const {pigMesh, starMesh, pigData} = useMemo(() => {
		const r = mulberry32(seed);
		const pg = seaPigGeometry();
		const pm = new THREE.MeshPhysicalMaterial({color: '#e9b7b0', roughness: 0.35, transmission: 0.35, thickness: 0.1, transparent: true, opacity: 0.92});
		const pigMesh = new THREE.InstancedMesh(pg, pm, pigs);
		const pigData = new Array(pigs).fill(0).map(() => ({x: (r() - 0.5) * area, z: (r() - 0.5) * area, a: r() * 6.28, s: 0.8 + r() * 0.6}));
		const sg = brittleStarGeometry(seed + 1);
		const sm = new THREE.MeshStandardMaterial({color: '#cdbfa7', roughness: 0.8});
		const starMesh = new THREE.InstancedMesh(sg, sm, stars);
		const o = new THREE.Object3D();
		for (let i = 0; i < stars; i++) {
			const x = (r() - 0.5) * area, z = (r() - 0.5) * area;
			o.position.set(x, seabedHeight(x, z) + 0.01, z);
			o.rotation.set(0, r() * 6.28, 0);
			const s = 0.7 + r() * 0.8;
			o.scale.set(s, s, s);
			o.updateMatrix();
			starMesh.setMatrixAt(i, o.matrix);
		}
		pigMesh.castShadow = true;
		return {pigMesh, starMesh, pigData};
	}, [area, pigs, stars, seed]);
	const o = new THREE.Object3D();
	pigData.forEach((d, i) => {
		// 海猪在泥上慢慢走
		const x = d.x + Math.cos(d.a) * t * 0.03;
		const z = d.z + Math.sin(d.a) * t * 0.03;
		o.position.set(x, seabedHeight(x, z) + 0.1 * d.s, z);
		o.rotation.set(0, -d.a, 0);
		o.scale.set(d.s, d.s, d.s);
		o.updateMatrix();
		pigMesh.setMatrixAt(i, o.matrix);
	});
	pigMesh.instanceMatrix.needsUpdate = true;
	return (
		<>
			<primitive object={pigMesh} />
			<primitive object={starMesh} />
		</>
	);
};
