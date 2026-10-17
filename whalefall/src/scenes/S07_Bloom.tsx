// 93.57 – 108.45：第二个落点。另一群细菌把毒气当食物——骨架亮成一座城：细菌毯、贻贝、蛤、螺、铠甲虾、发光颗粒
import React from 'react';
import {DeepSet} from '../three/DeepSet';
import {WhaleFallSite, GROUND} from '../three/site';
import {useT} from '../three/helpers';
import {prog, easeInOut, easeOut, lerp, DROP2, bar} from '../lib/time';
import type {Vec3} from '../three/Stage';

export const S07Bloom: React.FC = () => {
	const t = useT();
	const k = easeInOut(prog(t, DROP2, 101.5));
	const k2 = prog(t, 101.5, bar(51));
	// 从头骨近处的低角度 → 升起拉远看全貌 → 慢慢绕
	const ang = lerp(0.35, 1.1, k) + k2 * 0.35;
	const dist = lerp(10, 17, k);
	const cam: Vec3 = [6 + Math.cos(ang) * dist * 0.9 - 6 * k, GROUND + lerp(1.6, 7.5, k), Math.sin(ang) * dist];
	const look: Vec3 = [lerp(6.5, 0, k), GROUND + lerp(0.4, 0.2, k), 0];
	const light = easeOut(prog(t, DROP2, DROP2 + 1.8));
	return (
		<DeepSet t={t} cam={cam} look={look} fov={40} lamp={0.25 + 0.15 * (1 - light)} fill={0.4} ambient={0.06 + 0.12 * light} fog="#010608" fogDensity={0.04} bloom={1.0} bloomThreshold={0.42}>
			<pointLight position={[0, GROUND + 3, 0]} intensity={40 * light} distance={30} decay={1.4} color="#7dffe6" />
			<pointLight position={[-6, GROUND + 2, 1]} intensity={30 * light} distance={20} decay={1.4} color="#bfffe8" />
			<WhaleFallSite
				t={t}
				s={{
					bones: 1,
					mats: lerp(0.35, 1, light),
					matGlow: 0.85 * light,
					shells: easeOut(prog(t, 96.5, 103.5)),
					lobsters: 1,
					glow: 0.9 * light,
				}}
			/>
		</DeepSet>
	);
};
