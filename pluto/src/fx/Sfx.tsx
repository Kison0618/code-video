import React, {createContext, useContext} from 'react';
import {Audio, Sequence, interpolate, staticFile} from 'remotion';

/** public/sfx/ 下的音效（由 scripts/make-sfx.py 合成） */
export type SfxName =
	| 'whoosh' | 'whoosh2' | 'whoosh_fast'
	| 'impact' | 'impact_soft' | 'boom'
	| 'riser' | 'swell' | 'shimmer' | 'sparkle'
	| 'blip' | 'blip_lo' | 'lock' | 'bead'
	| 'typing' | 'ticks' | 'data' | 'scan'
	| 'glitch' | 'deny' | 'heartbeat' | 'chime'
	| 'drone' | 'ping' | 'warp' | 'shutter';

/** 音效“重拍”在文件里的位置（帧）：at 指的是重拍时刻，会自动提前开始播放 */
const HIT: Partial<Record<SfxName, number>> = {
	riser: 78,
	swell: 66,
	whoosh: 18,
	whoosh2: 18,
	whoosh_fast: 10,
};

/** 全片音效总音量（Studio 的 sfxVolume 属性） */
export const SfxVolume = createContext(0.7);
/** 当前场景长度：场景内的音效在场景结束前 12 帧淡出，避免硬切 */
export const SceneLen = createContext<number>(Infinity);

type Props = {
	name: SfxName;
	/** 重拍发生的帧（相对当前场景） */
	at: number;
	/** 单个音效音量，默认 1 */
	vol?: number;
	/** 只播放多少帧（循环类音效如 typing / ticks / data 用来截断），末尾自动淡出 */
	dur?: number;
	/** 淡入帧数 */
	fadeIn?: number;
	/** 变速（同时变调），做一点变化 */
	rate?: number;
};

export const Sfx: React.FC<Props> = ({name, at, vol = 1, dur, fadeIn = 0, rate = 1}) => {
	const master = useContext(SfxVolume);
	const sceneLen = useContext(SceneLen);
	const start = Math.round(at - (HIT[name] ?? 0) / rate);
	const trim = start < 0 ? -start : 0;
	const from = Math.max(0, start);
	const len = dur !== undefined ? Math.max(1, Math.round(dur) + 8) : undefined;
	if (master <= 0 || vol <= 0) return null;
	return (
		<Sequence from={from} durationInFrames={len} layout="none" name={`sfx · ${name}`}>
			<Audio
				src={staticFile(`sfx/${name}.mp3`)}
				trimBefore={trim ? Math.round(trim * rate) : undefined}
				playbackRate={rate}
				volume={(f) => {
					let g = master * vol;
					if (fadeIn > 0) g *= interpolate(f, [0, fadeIn], [0, 1], {extrapolateRight: 'clamp'});
					if (len !== undefined) g *= interpolate(f, [len - 10, len - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
					if (Number.isFinite(sceneLen))
						g *= interpolate(from + f, [sceneLen - 14, sceneLen - 1], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
					return g;
				}}
			/>
		</Sequence>
	);
};

/** 找到 fn(fr) 首次 ≥ thr 的帧（用于把音效卡在缓动动画的某个数值上） */
export const firstFrame = (fn: (fr: number) => number, from: number, to: number, thr: number) => {
	for (let fr = Math.floor(from); fr <= to; fr++) if (fn(fr) >= thr) return fr;
	return -1;
};

/** 一串等间隔的音效（打点、计数、珠子落定等） */
export const SfxSeq: React.FC<{name: SfxName; at: number[]; vol?: number; rate?: (i: number) => number}> = ({name, at, vol = 1, rate}) => (
	<>
		{at.filter((a) => a >= 0).map((a, i) => (
			<Sfx key={`${name}-${i}-${a}`} name={name} at={a} vol={vol} rate={rate ? rate(i) : 1} />
		))}
	</>
);
