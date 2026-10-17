// 138.2 – 160：首尾呼应。从发着光的鲸骨之城一路升回海面；海面上，一对母子鲸正游过——和开头那一幕同一个角度。
import React, {useMemo} from 'react';
import * as THREE from 'three';
import {Stage, CameraRig, Vec3} from '../three/Stage';
import {MarineSnow, SeaSurface, GodRays, WaterSky, makeGlowPoints} from '../three/env';
import {WhaleFallSite, GROUND} from '../three/site';
import {whaleGeometry, whaleMaterial} from '../three/whaleGeo';
import {Fog, keyframes, mixColor, useT} from '../three/helpers';
import {prog, easeInOut, lerp, bar} from '../lib/time';

const FLOOR = -2000;

export const S10Rise: React.FC = () => {
	const t = useT();
	const d = useMemo(() => {
		const geo = whaleGeometry(16);
		const mom = whaleMaterial();
		mom.uniforms.uL.value = 16;
		mom.uniforms.uAmp.value = 0.018;
		const calf = whaleMaterial();
		calf.uniforms.uL.value = 16;
		calf.uniforms.uAmp.value = 0.024;
		calf.uniforms.uFreq.value = 0.5;
		// 远处的城：一个发光点
		const beacon = makeGlowPoints(new Float32Array([0, FLOOR + 1.5, 0]), new Float32Array([0.5, 1, 0.9]), 1);
		beacon.mat.uniforms.uSize.value = 14;
		return {geo, mom, calf, beacon};
	}, []);
	d.mom.uniforms.uTime.value = t;
	d.calf.uniforms.uTime.value = t;
	d.beacon.mat.uniforms.uTime.value = t;

	// 深度：从海底升回海面
	const D = keyframes(t, [
		[bar(65), 1992],
		[143.0, 1750],
		[146.5, 700],
		[149.5, 90],
		[152.5, 26],
		[160, 22],
	]);
	const camY = -D;
	const sun = Math.exp(-D / 45);
	const blue = Math.exp(-D / 260);
	const fogCol = mixColor(mixColor('#0e5568', '#061a33', Math.min(1, D / 200)), '#010309', Math.min(1, D / 1000));
	// 朝向：先往下看着城，再慢慢抬头看海面
	const tilt = easeInOut(prog(t, 142.0, 150.5)); // 0 = 往下看，1 = 往上看
	const cam: Vec3 = [lerp(4, 6, tilt), camY, lerp(6, 9.5, tilt)];
	const lookDown: Vec3 = [0, camY - 20, 0];
	const lookUp: Vec3 = [-1, camY + 20, -2];
	const look: Vec3 = [lerp(lookDown[0], lookUp[0], tilt), lerp(lookDown[1], lookUp[1], tilt), lerp(lookDown[2], lookUp[2], tilt)];
	// 母子鲸：在海面下方游过
	const swim = (t - 146) * 1.1;
	const nearCity = D > 1900;
	d.beacon.mat.uniforms.uI.value = Math.min(1, Math.max(0, (D - 1900) / 60)) < 1 && D > 400 ? 1 : 0.6;
	const endDim = 0.45 * prog(t, bar(72), bar(72) + 1.5);
	return (
		<Stage bloom={1.0} bloomThreshold={0.35} shadows dim={endDim}>
			<CameraRig pos={cam} look={look} fov={52} />
			<Fog color={fogCol} density={lerp(0.018, 0.045, Math.min(1, D / 800))} />
			<WaterSky cam={cam} top={mixColor(mixColor('#3fa7c4', '#0a2a4a', Math.min(1, D / 200)), '#010309', Math.min(1, D / 900))} mid={fogCol} bot={mixColor('#05223a', '#010205', Math.min(1, D / 400))} />
			<ambientLight intensity={0.25 + 1.6 * blue} color="#6fb6d6" />
			<directionalLight position={[20, 200, -30]} intensity={6 * sun} color="#e8f6ff" />
			<hemisphereLight args={['#7fd0ff', '#02060b', 1.2 * blue]} />
			{D < 260 ? <SeaSurface t={t} cam={cam} y={0} intensity={0.62 * Math.max(0, 1 - D / 220)} /> : null}
			{D < 300 ? <GodRays t={t} cam={cam} center={[0, 0, 0]} topY={0} intensity={2.4 * Math.max(0, 1 - D / 260)} len={140} spread={70} /> : null}
			{nearCity ? (
				<group position={[0, FLOOR - GROUND, 0]}>
					<pointLight position={[0, GROUND + 3, 0]} intensity={60} distance={30} decay={1.4} color="#7dffe6" />
					<WhaleFallSite t={t} s={{bones: 1, mats: 1, matGlow: 1.4, shells: 1, lobsters: 1, glow: 0.9}} />
				</group>
			) : null}
			{D > 300 ? <points geometry={d.beacon.geo} material={d.beacon.mat} /> : null}
			{D < 400 ? (
				<>
					<group position={[-14 + swim, -9, -4]} rotation={[0, 0.15, 0.05]}>
						<mesh geometry={d.geo} material={d.mom.material} castShadow />
					</group>
					<group position={[-17 + swim * 1.02, -6.2, 0.5]} rotation={[0, 0.1, 0.08]} scale={0.42}>
						<mesh geometry={d.geo} material={d.calf.material} />
					</group>
				</>
			) : null}
			<MarineSnow t={t} cam={cam} ambient={lerp(0.5, 0.06, Math.min(1, D / 900))} count={7000} box={34} />
		</Stage>
	);
};
