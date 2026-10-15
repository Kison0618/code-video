import React from 'react';
import {AbsoluteFill, Audio, Sequence, interpolate, useVideoConfig} from 'remotion';
import type {SceneProps} from './components/SceneFrame';
import type {Timeline} from './lib/timeline';
import {S01Plates} from './scenes/S01Plates';
import {S02Title} from './scenes/S02Title';
import {S03Name} from './scenes/S03Name';
import {S04Scale} from './scenes/S04Scale';
import {S05Distance} from './scenes/S05Distance';
import {S06Orbit} from './scenes/S06Orbit';
import {S07Voyage} from './scenes/S07Voyage';
import {S08Heart} from './scenes/S08Heart';
import {S09Glacier} from './scenes/S09Glacier';
import {S10Haze} from './scenes/S10Haze';
import {S11Charon} from './scenes/S11Charon';
import {S12Verdict} from './scenes/S12Verdict';
import {S13Epilogue} from './scenes/S13Epilogue';

export const SCENE_COMPONENTS: Record<string, React.FC<SceneProps>> = {
	s01: S01Plates,
	s02: S02Title,
	s03: S03Name,
	s04: S04Scale,
	s05: S05Distance,
	s06: S06Orbit,
	s07: S07Voyage,
	s08: S08Heart,
	s09: S09Glacier,
	s10: S10Haze,
	s11: S11Charon,
	s12: S12Verdict,
	s13: S13Epilogue,
};

export type VideoProps = {
	timeline: Timeline;
	/** 是否显示英文副字幕 */
	showEnglish: boolean;
	/** 背景音乐音量（0–1） */
	bgmVolume: number;
	/** 旁白音量（0–1） */
	voiceVolume: number;
};

export const PlutoVideo: React.FC<VideoProps> = ({timeline, showEnglish, bgmVolume, voiceVolume}) => {
	const {durationInFrames, fps} = useVideoConfig();
	return (
		<AbsoluteFill style={{background: '#000'}}>
			{timeline.scenes.map((scene) => {
				const Comp = SCENE_COMPONENTS[scene.id];
				if (!Comp) return null;
				return (
					<Sequence key={scene.id} from={scene.from} durationInFrames={scene.duration} name={`${scene.id} · ${scene.def.chapter?.zh ?? ''}`}>
						<Comp scene={scene} showEnglish={showEnglish} />
						{scene.voiceSrc ? (
							<Sequence from={scene.voStart} name="voiceover" layout="none">
								<Audio src={scene.voiceSrc} volume={voiceVolume} />
							</Sequence>
						) : null}
					</Sequence>
				);
			})}
			{timeline.bgmSrc ? (
				<Audio
					src={timeline.bgmSrc}
					loop
					volume={(f) =>
						bgmVolume *
						interpolate(f, [0, fps * 2, durationInFrames - fps * 4, durationInFrames - 1], [0, 1, 1, 0], {
							extrapolateLeft: 'clamp',
							extrapolateRight: 'clamp',
						})
					}
				/>
			) : null}
		</AbsoluteFill>
	);
};
