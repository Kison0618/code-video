import React, {useLayoutEffect, useMemo} from 'react';
import {useThree} from '@react-three/fiber';
import {useCurrentFrame} from 'remotion';
import * as THREE from 'three';
import {sec} from '../lib/time';

/** 当前时间（秒，视频绝对时间） */
export const useT = () => sec(useCurrentFrame());

/** 指数雾：颜色、浓度每帧可变 */
export const Fog: React.FC<{color: string; density: number}> = ({color, density}) => {
	const scene = useThree((s) => s.scene);
	const fog = useMemo(() => new THREE.FogExp2(color, density), []);
	useLayoutEffect(() => {
		fog.color.set(color);
		fog.density = density;
		scene.fog = fog;
		(scene.background as THREE.Color | null)?.set?.(color);
	});
	return null;
};

/** 关键帧插值（分段平滑） */
export function keyframes(t: number, keys: [number, number][]) {
	if (t <= keys[0][0]) return keys[0][1];
	for (let i = 0; i < keys.length - 1; i++) {
		const [t0, v0] = keys[i];
		const [t1, v1] = keys[i + 1];
		if (t <= t1) {
			const x = (t - t0) / (t1 - t0);
			const e = x * x * (3 - 2 * x);
			return v0 + (v1 - v0) * e;
		}
	}
	return keys[keys.length - 1][1];
}

export function mixColor(a: string, b: string, x: number) {
	return '#' + new THREE.Color(a).lerp(new THREE.Color(b), Math.min(1, Math.max(0, x))).getHexString();
}

let _dot: THREE.Texture | null = null;
/** 柔和的圆点贴图（给 PointsMaterial 用，避免方块点） */
export function softDot() {
	if (_dot) return _dot;
	const c = document.createElement('canvas');
	c.width = c.height = 64;
	const g = c.getContext('2d')!;
	const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
	grd.addColorStop(0, 'rgba(255,255,255,1)');
	grd.addColorStop(0.35, 'rgba(255,255,255,0.55)');
	grd.addColorStop(1, 'rgba(255,255,255,0)');
	g.fillStyle = grd;
	g.fillRect(0, 0, 64, 64);
	_dot = new THREE.CanvasTexture(c);
	return _dot;
}
