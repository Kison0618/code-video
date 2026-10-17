import React, {useLayoutEffect} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {EffectComposer, Bloom, Vignette, Noise} from '@react-three/postprocessing';
import {BlendFunction} from 'postprocessing';
import * as THREE from 'three';

export type Vec3 = [number, number, number];

/** 每帧由时间算出的相机：位置、注视点、视角 */
export const CameraRig: React.FC<{pos: Vec3; look: Vec3; fov?: number; roll?: number}> = ({pos, look, fov = 40, roll = 0}) => {
	const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
	useLayoutEffect(() => {
		camera.position.set(...pos);
		camera.up.set(Math.sin(roll), Math.cos(roll), 0);
		camera.lookAt(...look);
		if (camera.fov !== fov) {
			camera.fov = fov;
			camera.updateProjectionMatrix();
		}
	});
	return null;
};

/** 统一的画布：深海色调、ACES、泛光、暗角、胶片颗粒 */
export const Stage: React.FC<{
	children: React.ReactNode;
	bg?: string;
	bloom?: number;
	bloomThreshold?: number;
	vignette?: number;
	exposure?: number;
	shadows?: boolean;
	/** 0..1：整体压暗（用黑色叠层实现，可以逐帧变化） */
	dim?: number;
}> = ({children, bg = '#02060b', bloom = 0.9, bloomThreshold = 0.35, vignette = 0.55, exposure = 1.0, shadows = false, dim = 0}) => {
	return (
		<>
		<ThreeCanvas
			width={1920}
			height={1080}
			style={{position: 'absolute', inset: 0, background: bg}}
			shadows={shadows}
			camera={{fov: 40, near: 0.05, far: 4000, position: [0, 0, 10]}}
			gl={{antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: exposure, outputColorSpace: THREE.SRGBColorSpace, preserveDrawingBuffer: true}}
		>
			<color attach="background" args={[bg]} />
			{children}
			<EffectComposer multisampling={4}>
				<Bloom intensity={bloom} luminanceThreshold={bloomThreshold} luminanceSmoothing={0.35} mipmapBlur radius={0.75} />
				<Vignette offset={0.25} darkness={vignette} />
				<Noise premultiply blendFunction={BlendFunction.SCREEN} opacity={0.18} />
			</EffectComposer>
		</ThreeCanvas>
		{dim > 0 ? <div style={{position: 'absolute', inset: 0, background: '#000', opacity: Math.min(1, dim)}} /> : null}
		</>
	);
};
