// 76.57 – 93.57：第三阶段（音乐降下来）。显微镜下：细菌吸进硫酸盐，吐出硫化氢。87.2 以后一切暗下去。
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Stage, CameraRig, Vec3} from '../three/Stage';
import {Fog, useT} from '../three/helpers';
import {mulberry32} from '../lib/rand';
import {prog, easeInOut, lerp, BREAK, FILTER2, DROP2} from '../lib/time';

const NB = 240; // 细菌
const NM = 140; // 分子

export const S06Sulfide: React.FC = () => {
	const t = useT();
	const d = useMemo(() => {
		const r = mulberry32(8);
		// 细菌：铺在骨面（y≈0 的起伏面）上的杆菌
		const bGeo = new THREE.CapsuleGeometry(0.06, 0.28, 4, 10);
		bGeo.rotateZ(Math.PI / 2);
		const bMat = new THREE.MeshStandardMaterial({color: '#9fd9c8', emissive: new THREE.Color('#1b5a4c'), emissiveIntensity: 0.8, roughness: 0.35, transparent: true, opacity: 0.9});
		const bact = new THREE.InstancedMesh(bGeo, bMat, NB);
		const bInfo = new Array(NB).fill(0).map(() => {
			const x = (r() - 0.5) * 9, z = (r() - 0.5) * 5;
			return {x, z, y: 0.07 + Math.sin(x * 1.3) * 0.08 + Math.cos(z * 1.7) * 0.06, a: r() * 6.28, ph: r() * 6.28};
		});
		const o = new THREE.Object3D();
		bInfo.forEach((b, i) => {
			o.position.set(b.x, b.y, b.z);
			o.rotation.set(0, b.a, (r() - 0.5) * 0.3);
			o.updateMatrix();
			bact.setMatrixAt(i, o.matrix);
		});
		// 骨面
		const floor = new THREE.PlaneGeometry(14, 9, 120, 80);
		floor.rotateX(-Math.PI / 2);
		const fp = floor.attributes.position.array as Float32Array;
		for (let i = 0; i < fp.length; i += 3) fp[i + 1] = Math.sin(fp[i] * 1.3) * 0.08 + Math.cos(fp[i + 2] * 1.7) * 0.06 - 0.02;
		floor.computeVertexNormals();
		const floorMat = new THREE.MeshStandardMaterial({color: '#3c3a33', roughness: 1});
		// 分子：S（黄）+ O×4（红）= 硫酸盐；S（黄）+ H×2（白）= 硫化氢
		const sph = new THREE.SphereGeometry(1, 16, 12);
		const S = new THREE.InstancedMesh(sph, new THREE.MeshStandardMaterial({color: '#f2d64b', emissive: new THREE.Color('#6a5200'), emissiveIntensity: 0.6, roughness: 0.3}), NM);
		const O = new THREE.InstancedMesh(sph, new THREE.MeshStandardMaterial({color: '#e0584a', roughness: 0.35}), NM * 4);
		const H = new THREE.InstancedMesh(sph, new THREE.MeshStandardMaterial({color: '#f0f4f6', roughness: 0.3}), NM * 2);
		const mInfo = new Array(NM).fill(0).map(() => ({
			tb: BREAK + 0.6 + r() * 9.5,
			sx: (r() - 0.5) * 12, sy: 3 + r() * 2.5, sz: (r() - 0.5) * 6,
			b: Math.floor(r() * NB),
			ax: r() * 6.28, ay: r() * 6.28,
		}));
		return {bact, bInfo, floor, floorMat, S, O, H, mInfo};
	}, []);

	// 87.2 以后整体变暗：音乐闷住，“没有阳光，满是毒气”
	const dim = 0.88 * easeInOut(prog(t, FILTER2, 92.6));
	const o = new THREE.Object3D();
	const tet = [new THREE.Vector3(1, 1, 1), new THREE.Vector3(-1, -1, 1), new THREE.Vector3(-1, 1, -1), new THREE.Vector3(1, -1, -1)].map((v) => v.normalize());
	d.mInfo.forEach((m, i) => {
		const b = d.bInfo[m.b];
		const k = (t - m.tb) / 2.6; // 0..1：硫酸盐漂向细菌
		const q = (t - m.tb - 2.6) / 3.2; // 0..1：硫化氢离开
		let showS = 0, pos = new THREE.Vector3();
		let mode: 'so4' | 'h2s' | 'none' = 'none';
		if (k >= 0 && k < 1) {
			const e = easeInOut(k);
			pos.set(lerp(m.sx, b.x, e), lerp(m.sy, b.y + 0.12, e), lerp(m.sz, b.z, e));
			mode = 'so4';
			showS = Math.min(1, k * 5);
		} else if (q >= 0 && q < 1) {
			pos.set(b.x + Math.sin(q * 3 + m.ax) * 0.4 * q, b.y + 0.15 + q * 3.2, b.z + Math.cos(q * 2 + m.ay) * 0.4 * q);
			mode = 'h2s';
			showS = 1 - Math.max(0, (q - 0.8) / 0.2);
		}
		const sS = mode === 'none' ? 0 : 0.07 * showS;
		o.position.copy(pos);
		o.rotation.set(m.ax + t * 0.8, m.ay + t * 0.6, 0);
		o.scale.setScalar(sS);
		o.updateMatrix();
		d.S.setMatrixAt(i, o.matrix);
		const rot = new THREE.Euler(m.ax + t * 0.8, m.ay + t * 0.6, 0);
		for (let j = 0; j < 4; j++) {
			const off = tet[j].clone().applyEuler(rot).multiplyScalar(0.11);
			o.position.copy(pos).add(off);
			o.scale.setScalar(mode === 'so4' ? 0.055 * showS : 0);
			o.updateMatrix();
			d.O.setMatrixAt(i * 4 + j, o.matrix);
		}
		for (let j = 0; j < 2; j++) {
			const off = tet[j].clone().applyEuler(rot).multiplyScalar(0.09);
			o.position.copy(pos).add(off);
			o.scale.setScalar(mode === 'h2s' ? 0.04 * showS : 0);
			o.updateMatrix();
			d.H.setMatrixAt(i * 2 + j, o.matrix);
		}
	});
	d.S.instanceMatrix.needsUpdate = true;
	d.O.instanceMatrix.needsUpdate = true;
	d.H.instanceMatrix.needsUpdate = true;
	// 细菌轻轻颤动
	const ob = new THREE.Object3D();
	d.bInfo.forEach((b, i) => {
		ob.position.set(b.x, b.y, b.z);
		ob.rotation.set(0, b.a + 0.05 * Math.sin(t * 1.5 + b.ph), 0.04 * Math.sin(t * 2 + b.ph));
		ob.updateMatrix();
		d.bact.setMatrixAt(i, ob.matrix);
	});
	d.bact.instanceMatrix.needsUpdate = true;

	const k = easeInOut(prog(t, BREAK, DROP2));
	const cam: Vec3 = [lerp(-2.5, 1.5, k), lerp(2.6, 1.6, k), lerp(5.5, 4.0, k)];
	const look: Vec3 = [lerp(-0.5, 0.5, k), lerp(0.9, 0.5, k), 0];
	return (
		<Stage bloom={0.8} bloomThreshold={0.5} bg="#010405" dim={dim}>
			<CameraRig pos={cam} look={look} fov={40} />
			<Fog color="#010405" density={0.12} />
			<ambientLight intensity={0.25} color="#6f9fa0" />
			<pointLight position={[2, 5, 3]} intensity={60} color="#d0f0ff" decay={1.5} />
			<pointLight position={[-4, 2, -2]} intensity={25} color="#a8ffd6" decay={1.5} />
			<mesh geometry={d.floor} material={d.floorMat} />
			<primitive object={d.bact} />
			<primitive object={d.S} />
			<primitive object={d.O} />
			<primitive object={d.H} />
		</Stage>
	);
};
