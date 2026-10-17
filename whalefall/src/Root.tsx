import React from 'react';
import {Composition} from 'remotion';
import {WhaleFall} from './Video';
import {FPS, DURATION} from './lib/time';

export const Root: React.FC = () => (
	<Composition
		id="WhaleFall"
		component={WhaleFall}
		durationInFrames={Math.round(DURATION * FPS)}
		fps={FPS}
		width={1920}
		height={1080}
		defaultProps={{sfxVolume: 1, bgmVolume: 0.82}}
	/>
);
