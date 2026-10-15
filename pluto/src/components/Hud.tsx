import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {appear} from '../lib/anim';
import type {Chapter} from '../script';
import {C, MONO, SERIF} from '../theme';

/** 左上角的大章节标题（参考：大标题 + 英文副标 + 金色编号） */
export const Hud: React.FC<{chapter: Chapter; right?: string; kicker?: string; outAt?: number}> = ({chapter, right, kicker, outAt}) => {
	const f = useCurrentFrame();
	const a = appear(f, 4, 26);
	const line = appear(f, 10, 40);
	const fade = outAt !== undefined ? 1 - appear(f, outAt, 20) : 1;
	const title = chapter?.zh ?? '';
	return (
		<AbsoluteFill style={{pointerEvents: 'none', opacity: fade}}>
			{chapter ? (
				<div style={{position: 'absolute', left: 96, top: 72}}>
					<div style={{display: 'flex', alignItems: 'center', gap: 14, opacity: a}}>
						<span style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.25em'}}>{chapter.no}</span>
						<span style={{width: 60 * line, height: 1, background: `linear-gradient(90deg, ${C.gold}, rgba(243,196,124,0))`}} />
						{kicker ? <span style={{fontFamily: MONO, fontSize: 14, color: C.iceDim, letterSpacing: '0.25em'}}>{kicker}</span> : null}
					</div>
					<div style={{display: 'flex', marginTop: 14}}>
						{[...title].map((ch, i) => {
							const t = appear(f, 6 + i * 4, 22);
							return (
								<span
									key={i}
									style={{
										fontFamily: SERIF,
										fontWeight: 600,
										fontSize: 58,
										letterSpacing: '0.14em',
										color: C.ice,
										opacity: t,
										filter: `blur(${(1 - t) * 8}px)`,
										transform: `translateY(${(1 - t) * 10}px)`,
										textShadow: '0 0 30px rgba(180,210,255,0.25)',
										lineHeight: 1.1,
									}}
								>
									{ch}
								</span>
							);
						})}
					</div>
					<div
						style={{
							marginTop: 10,
							fontFamily: MONO,
							fontSize: 13,
							letterSpacing: `${interpolate(a, [0, 1], [0.7, 0.42])}em`,
							color: C.iceDim,
							opacity: a * 0.85,
						}}
					>
						{chapter.en}
					</div>
				</div>
			) : null}
			{right ? (
				<div
					style={{
						position: 'absolute',
						right: 96,
						top: 80,
						opacity: a * 0.8,
						fontFamily: MONO,
						fontSize: 13,
						letterSpacing: '0.26em',
						color: C.iceDim,
						textAlign: 'right',
						whiteSpace: 'pre-line',
						lineHeight: 1.9,
					}}
				>
					{right}
				</div>
			) : null}
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
	if (opacity <= 0.001) return null;
	return (
		<div style={{position: 'absolute', left: x, top: y, transform: `translate(${tx}, -50%)`, opacity, textAlign: align, whiteSpace: 'nowrap'}}>
			{value ? (
				<div style={{fontFamily: MONO, fontSize: 30 * size, color, letterSpacing: '0.04em', lineHeight: 1.1, textShadow: `0 0 18px ${color}66`}}>{value}</div>
			) : null}
			{zh ? (
				<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 20 * size, color, letterSpacing: '0.16em', marginTop: value ? 6 : 0, textShadow: `0 0 14px ${color}44`}}>
					{zh}
				</div>
			) : null}
			{en ? <div style={{fontFamily: MONO, fontSize: 11 * size, color: C.iceDim, letterSpacing: '0.28em', marginTop: 5}}>{en}</div> : null}
		</div>
	);
};
