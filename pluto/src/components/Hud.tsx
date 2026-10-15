import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {appear} from '../lib/anim';
import type {Chapter} from '../script';
import {C, MONO, SERIF} from '../theme';

export const Hud: React.FC<{chapter: Chapter; right?: string}> = ({chapter, right}) => {
	const frame = useCurrentFrame();
	const a = appear(frame, 6, 24);
	const line = appear(frame, 10, 30);
	return (
		<AbsoluteFill style={{pointerEvents: 'none'}}>
			{chapter ? (
				<div style={{position: 'absolute', left: 72, top: 58, opacity: a, display: 'flex', alignItems: 'center', gap: 18}}>
					<span style={{fontFamily: MONO, fontSize: 15, color: C.amber, letterSpacing: '0.2em'}}>{chapter.no}</span>
					<span style={{width: 44 * line, height: 1, background: C.iceFaint}} />
					<span style={{fontFamily: SERIF, fontSize: 20, color: C.ice, letterSpacing: '0.3em'}}>{chapter.zh}</span>
					<span style={{fontFamily: SERIF, fontSize: 13, color: C.iceDim, letterSpacing: '0.32em'}}>{chapter.en}</span>
				</div>
			) : null}
			<div
				style={{
					position: 'absolute',
					right: 72,
					top: 60,
					opacity: a * 0.9,
					fontFamily: MONO,
					fontSize: 13,
					letterSpacing: '0.22em',
					color: C.iceDim,
					textAlign: 'right',
				}}
			>
				{right ?? 'PLUTO · 134340'}
			</div>
		</AbsoluteFill>
	);
};

/** 小标签：细线 + 中英文 */
export const Label: React.FC<{
	x: number;
	y: number;
	zh?: string;
	en?: string;
	value?: string;
	align?: 'left' | 'right' | 'center';
	color?: string;
	opacity?: number;
	size?: number;
}> = ({x, y, zh, en, value, align = 'left', color = C.ice, opacity = 1, size = 1}) => {
	const tx = align === 'left' ? '0' : align === 'right' ? '-100%' : '-50%';
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				transform: `translate(${tx}, -50%)`,
				opacity,
				textAlign: align,
				whiteSpace: 'nowrap',
			}}
		>
			{value ? (
				<div style={{fontFamily: MONO, fontSize: 30 * size, color, letterSpacing: '0.04em', lineHeight: 1.1}}>{value}</div>
			) : null}
			{zh ? (
				<div style={{fontFamily: SERIF, fontSize: 19 * size, color, letterSpacing: '0.18em', marginTop: value ? 6 : 0}}>{zh}</div>
			) : null}
			{en ? (
				<div style={{fontFamily: SERIF, fontSize: 12 * size, color: C.iceDim, letterSpacing: '0.3em', marginTop: 4}}>{en}</div>
			) : null}
		</div>
	);
};
