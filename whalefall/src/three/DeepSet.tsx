import React from 'react';
import {Stage, CameraRig, Vec3} from './Stage';
import {MarineSnow, Lamp, Spot} from './env';
import {Fog} from './helpers';

/** 深海布景：近乎全黑的水、深潜器的两盏灯（从相机附近打出）、海雪 */
export const DeepSet: React.FC<{
	t: number;
	cam: Vec3;
	look: Vec3;
	fov?: number;
	lampTarget?: Vec3;
	lamp?: number;
	fill?: number;
	fog?: string;
	fogDensity?: number;
	snow?: number;
	ambient?: number;
	bloom?: number;
	bloomThreshold?: number;
	exposure?: number;
	children: React.ReactNode;
}> = ({t, cam, look, fov = 42, lampTarget, lamp = 1, fill = 1, fog = '#01040a', fogDensity = 0.045, snow = 1, ambient = 0.04, bloom = 0.9, bloomThreshold = 0.55, exposure = 1, children}) => {
	const tgt = lampTarget ?? look;
	const lampPos: Vec3 = [cam[0] + 0.7, cam[1] + 0.9, cam[2] - 0.2];
	const dir: Vec3 = [tgt[0] - lampPos[0], tgt[1] - lampPos[1], tgt[2] - lampPos[2]];
	return (
		<Stage bloom={bloom} bloomThreshold={bloomThreshold} exposure={exposure} shadows bg={fog}>
			<CameraRig pos={cam} look={look} fov={fov} />
			<Fog color={fog} density={fogDensity} />
			<ambientLight intensity={ambient} color="#7fa6c0" />
			{lamp > 0 ? <Lamp pos={lampPos} target={tgt} intensity={lamp} length={34} angle={0.45} cone={0} shadow /> : null}
			{fill > 0 ? <Spot pos={[cam[0] - 3.5, cam[1] + 2.2, cam[2] + 0.5]} target={tgt} intensity={90 * fill} angle={0.55} /> : null}
			{snow > 0 ? <MarineSnow t={t} cam={cam} ambient={0.05 * snow} lamp={lamp * snow} lampPos={lampPos} lampDir={dir} count={6000} box={30} /> : null}
			{children}
		</Stage>
	);
};
