import React from 'react';
import {Img} from 'remotion';
import {CHARON_DISK, MOON_DISK} from '../assets/plutoTexture';

/** 月球（程序化贴图，见 scripts/make-pluto-texture.py） */
export const Moon: React.FC<{size: number; style?: React.CSSProperties}> = ({size, style}) => (
	<Img src={MOON_DISK} style={{width: size, height: size, display: 'block', ...style}} />
);

/** 卡戎：灰色 + 北极暗红色“魔多斑” */
export const Charon: React.FC<{size: number; rotate?: number; style?: React.CSSProperties}> = ({size, rotate = 0, style}) => (
	<Img src={CHARON_DISK} style={{width: size, height: size, display: 'block', transform: rotate ? `rotate(${rotate}deg)` : undefined, ...style}} />
);

/** 太阳：发光点 */
export const SunGlow: React.FC<{x: number; y: number; r?: number; intensity?: number}> = ({x, y, r = 40, intensity = 1}) => (
	<div style={{position: 'absolute', left: x, top: y, width: 0, height: 0}}>
		<div
			style={{
				position: 'absolute',
				width: r * 8,
				height: r * 8,
				left: -r * 4,
				top: -r * 4,
				borderRadius: '50%',
				background: `radial-gradient(circle, rgba(255,226,180,${0.55 * intensity}) 0%, rgba(255,190,120,${0.12 * intensity}) 30%, rgba(255,180,100,0) 62%)`,
			}}
		/>
		<div
			style={{
				position: 'absolute',
				width: r * 2,
				height: r * 2,
				left: -r,
				top: -r,
				borderRadius: '50%',
				background: '#fff6e8',
				boxShadow: `0 0 ${r}px ${r / 2}px rgba(255,220,170,${0.8 * intensity})`,
				opacity: intensity,
			}}
		/>
	</div>
);
