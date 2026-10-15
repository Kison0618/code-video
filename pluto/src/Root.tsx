import React from 'react';
import {Composition} from 'remotion';
import {buildTimeline} from './lib/timeline';
import {probeMedia} from './lib/media';
import {FPS, HEIGHT, WIDTH} from './theme';
import {PlutoVideo, VideoProps} from './Video';
import {SCENES} from './script';
import './fonts/load';

// 无配音时的估算时间轴（Studio 打开时先用它，calculateMetadata 会按实际配音重算）
const estimated = buildTimeline({}, null);

const defaultProps: VideoProps = {
	timeline: estimated,
	showEnglish: true,
	bgmVolume: 0.22,
	voiceVolume: 1,
	sfxVolume: 0.7,
};

export const RemotionRoot: React.FC = () => (
	<>
		<Composition
			id="Pluto"
			component={PlutoVideo}
			fps={FPS}
			width={WIDTH}
			height={HEIGHT}
			durationInFrames={estimated.total}
			defaultProps={defaultProps}
			calculateMetadata={async ({props}) => {
				const {voice, bgmSrc} = await probeMedia();
				const timeline = buildTimeline(voice, bgmSrc);
				const found = Object.values(voice).filter(Boolean).length;
				console.log(`[pluto] voiceover ${found}/${SCENES.length} found, bgm: ${bgmSrc ? 'yes' : 'no'}, ${(timeline.total / FPS).toFixed(1)}s`);
				return {durationInFrames: timeline.total, props: {...props, timeline}};
			}}
		/>
	</>
);
