import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile, useCurrentFrame, interpolate} from 'remotion';
import {preloadFonts} from './ui/fonts';
import {Subtitles} from './ui/Subtitles';
import {ChapterLabels, Notes} from './ui/Hud';
import {TitleCard, BigText, EndCard} from './ui/Cards';
import {SceneOverlays} from './scenes/overlays';
import {SCENES} from './scenes';
import {Sfx} from './sfx';
import {sec, fr, LOOP_AT, LOOP_FROM, DURATION, FPS, clamp} from './lib/time';

preloadFonts();

const BGM_VOL = 0.82;

export const WhaleFall: React.FC<{sfxVolume?: number; bgmVolume?: number}> = ({sfxVolume = 1, bgmVolume = BGM_VOL}) => {
	const frame = useCurrentFrame();
	const t = sec(frame);
	const scene = SCENES.find((s) => t >= s.t0 && t < s.t1);
	// 每个场景开头从黑里淡入、结尾淡出（只有很短的几帧，大部分是硬切）
	const fade = scene ? Math.min(clamp((t - scene.t0) / (scene.fadeIn ?? 0.35)), clamp((scene.t1 - t) / (scene.fadeOut ?? 0.2))) : 0;
	const loopLen = DURATION - LOOP_AT;
	return (
		<AbsoluteFill style={{background: '#02060b'}}>
			{scene ? (
				<AbsoluteFill style={{opacity: fade}}>
					<scene.C />
				</AbsoluteFill>
			) : null}
			<SceneOverlays />
			<ChapterLabels />
			<Notes />
			<Subtitles />
			<BigText />
			<TitleCard />
			<EndCard />

			{/* BGM：0 → 129.70 秒，然后接回 BGM 的 99.95 秒，把最后一段再放一遍，结尾 3 秒淡出 */}
			<Audio src={staticFile('audio/bgm.m4a')} trimAfter={fr(LOOP_AT)} volume={bgmVolume} />
			<Sequence from={fr(LOOP_AT)} durationInFrames={fr(loopLen)}>
				<Audio
					src={staticFile('audio/bgm.m4a')}
					trimBefore={fr(LOOP_FROM)}
					volume={(f) => bgmVolume * interpolate(f, [fr(loopLen) - 3.2 * FPS, fr(loopLen)], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})}
				/>
			</Sequence>
			<Sfx volume={sfxVolume} />
		</AbsoluteFill>
	);
};
