import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {TimedScene} from '../lib/timeline';
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
		fadeIn?: number;
		fadeOut?: number;
	}
> = ({scene, showEnglish, children, stars = true, tint, hudRight, fadeIn = 14, fadeOut = 14}) => {
	const frame = useCurrentFrame();
	const d = scene.duration;
	const o = interpolate(frame, [0, fadeIn, d - fadeOut, d], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	return (
		<AbsoluteFill style={{background: '#000'}}>
			<AbsoluteFill style={{opacity: o}}>
				<Backdrop tint={tint} />
				{stars ? <Starfield seed={scene.id} {...(typeof stars === 'object' ? stars : {})} /> : null}
				{children}
				<Vignette />
				<Hud chapter={scene.def.chapter} right={hudRight} />
				<Subtitles cues={scene.cues} showEnglish={showEnglish} />
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

/** cue 开始帧（越界时取最后一个） */
export const cueAt = (scene: TimedScene, i: number) => scene.cues[Math.min(i, scene.cues.length - 1)].start;
export const cueEnd = (scene: TimedScene, i: number) => scene.cues[Math.min(i, scene.cues.length - 1)].end;
