import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {TimedScene} from '../lib/timeline';
import {Bokeh} from '../fx/Bokeh';
import {Backdrop, Vignette} from './Backdrop';
import {Hud} from './Hud';
import {Starfield} from './Starfield';
import {Subtitles} from './Subtitles';

export type SceneProps = {scene: TimedScene; showEnglish: boolean};

/** 每个场景的通用外壳：底色、星空、HUD、字幕、首尾淡入淡出 */
export const SceneFrame: React.FC<
	SceneProps & {
		children: React.ReactNode;
		stars?: boolean | React.ComponentProps<typeof Starfield>;
		tint?: string;
		hudRight?: string;
		kicker?: string;
		hudOut?: number;
		warm?: number;
		fadeIn?: number;
		fadeOut?: number;
	}
> = ({scene, showEnglish, children, stars = true, tint, hudRight, kicker, hudOut, warm, fadeIn = 14, fadeOut = 14}) => {
	const frame = useCurrentFrame();
	const d = scene.duration;
	const o = interpolate(frame, [0, fadeIn, d - fadeOut, d], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const inK = interpolate(frame, [0, fadeIn + 16], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const outK = interpolate(frame, [d - fadeOut - 6, d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const ease = (t: number) => t * t * (3 - 2 * t);
	const camScale = 1 + 0.05 * ease(inK) + 0.012 * (frame / d) + 0.03 * ease(outK);
	const camBlur = 7 * ease(inK) * ease(inK) + 6 * ease(outK);
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{opacity: o}}>
				<Backdrop tint={tint} warm={warm} />
				{/* 镜头运动：进场推近 + 失焦，全程缓慢推进，离场轻微放大失焦 */}
				<AbsoluteFill style={{transform: `scale(${camScale})`, filter: camBlur > 0.15 ? `blur(${camBlur.toFixed(2)}px)` : undefined}}>
					{stars ? <Starfield seed={scene.id} {...(typeof stars === 'object' ? stars : {})} /> : null}
					{children}
				</AbsoluteFill>
				<Bokeh seed={scene.id} />
				<Vignette />
				<AbsoluteFill style={{background: 'linear-gradient(0deg, rgba(2,3,6,0.6) 0%, rgba(2,3,6,0.25) 12%, rgba(2,3,6,0) 22%)', pointerEvents: 'none'}} />
				<Hud chapter={scene.def.chapter} right={hudRight} kicker={kicker} outAt={hudOut} />
				<Subtitles cues={scene.cues} showEnglish={showEnglish} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** cue 开始帧（越界时取最后一个） */
export const cueAt = (scene: TimedScene, i: number) => scene.cues[Math.min(i, scene.cues.length - 1)].start;
export const cueEnd = (scene: TimedScene, i: number) => scene.cues[Math.min(i, scene.cues.length - 1)].end;
