// 43.0 – 55.3：第一阶段，盲鳗和睡鲨；延时摄影里肉一点点被吃光，露出骨架
import React from 'react';
import {DeepSet} from '../three/DeepSet';
import {WhaleFallSite, GROUND} from '../three/site';
import {useT} from '../three/helpers';
import {prog, easeInOut, lerp} from '../lib/time';
import type {Vec3} from '../three/Stage';

export const S04Scavengers: React.FC = () => {
	const t = useT();
	let cam: Vec3, look: Vec3, fov = 40;
	if (t < 48.6) {
		// 近景：盲鳗钻在肉里
		const k = easeInOut(prog(t, 43.0, 48.6));
		cam = [lerp(9.5, 7.5, k), GROUND + lerp(4.6, 3.8, k), lerp(9.5, 8.0, k)];
		look = [lerp(3.5, 1.5, k), GROUND + 1.3, 0];
		fov = 36;
	} else {
		// 拉远：延时摄影，肉被吃光
		const k = easeInOut(prog(t, 48.6, 55.3));
		cam = [lerp(-11, -13, k), GROUND + lerp(5.5, 6.8, k), lerp(11, 12.5, k)];
		look = [0, GROUND + 0.6, 0];
		fov = 44;
	}
	const eat = prog(t, 51.4, 54.4); // 51.4 – 54.4 延时：几个月到一年半
	return (
		<DeepSet t={t} cam={cam} look={look} fov={fov} lampTarget={[look[0], look[1] - 0.3, look[2]]}>
			<WhaleFallSite
				t={t}
				s={{
					flesh: 1 - prog(t, 53.2, 54.6),
					fleshShrink: eat,
					bones: prog(t, 52.6, 53.4),
					hagfish: 1 - prog(t, 53.4, 54.6),
					shark: prog(t, 43.6, 49.5) * (t < 49.5 ? 1 : 2),
					amphipods: 1 - prog(t, 53.5, 54.5),
					lobsters: prog(t, 53.6, 55),
				}}
			/>
		</DeepSet>
	);
};
