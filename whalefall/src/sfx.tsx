import React from 'react';
import {Audio, Sequence, staticFile} from 'remotion';
import {fr, bar, DROP1, DROP2, BREAK, FILTER2} from './lib/time';

// 音效表：少而准。只放在三种地方——画面里会响的东西、大字砸下、落点之前。
// 文件由 scripts/make-sfx.py 程序合成，在 public/sfx/ 下。
export type Cue = {t: number; name: string; vol?: number; dur?: number};
export const CUES: Cue[] = [
	// 冷开场：浅海的水声 → 下沉的压力声 → 落地 → 探照灯亮 → 上扬进片名
	{t: 0, name: 'underwater', vol: 0.8, dur: 8},
	{t: 5.2, name: 'sink', vol: 0.75, dur: 12},
	{t: 10.9, name: 'ping_lo', vol: 0.35, dur: 4},
	{t: 15.1, name: 'thud', vol: 0.9, dur: 6.5},
	{t: 15.6, name: 'lamp_on', vol: 0.6, dur: 2.8},
	{t: DROP1 - 1.6, name: 'riser', vol: 0.7, dur: 1.6},
	{t: DROP1, name: 'impact', vol: 0.9, dur: 8},
	// 1987 声呐
	{t: 22.5, name: 'ping', vol: 0.55, dur: 4},
	{t: 22.6, name: 'sweep', vol: 0.5, dur: 5.5},
	{t: 26.0, name: 'ping', vol: 0.4, dur: 4},
	// 一头鲸落进荒漠；50 m² 的框亮起
	{t: 40.1, name: 'thud_soft', vol: 0.75, dur: 5.5},
	{t: 41.0, name: 'chime', vol: 0.45, dur: 6},
	// 延时：几个月到一年半
	{t: 51.4, name: 'ticks', vol: 0.6, dur: 3.2},
	// 食骨蠕虫：红色的“花”长出来；根溶骨头；大字
	{t: 58.3, name: 'grow', vol: 0.55, dur: 3.5},
	{t: 64.0, name: 'fizz', vol: 0.5, dur: 6},
	{t: bar(33), name: 'impact_soft', vol: 0.8, dur: 7.5},
	{t: 72.7, name: 'chime', vol: 0.3, dur: 6},
	// 嗜硫段（音乐降下来）：细长的高音 + 冒泡；憋着的那段：心跳一样的低音；上扬进第二个落点
	{t: BREAK + 0.2, name: 'thin_tone', vol: 0.5, dur: 11},
	{t: FILTER2 + 0.1, name: 'pulses', vol: 0.75, dur: 6.3},
	{t: DROP2 - 1.6, name: 'riser2', vol: 0.75, dur: 1.6},
	{t: DROP2, name: 'bloom', vol: 0.9, dur: 8},
	{t: 104.4, name: 'chime', vol: 0.3, dur: 6},
	// 地图：点一盏盏亮起；捕鲸：一声低沉的钟
	{t: 109.0, name: 'dots', vol: 0.55, dur: 6},
	{t: 119.5, name: 'toll', vol: 0.7, dur: 11},
	// 南海：深潜器的嗡声和 ping
	{t: bar(59), name: 'motor', vol: 0.5, dur: 8},
	{t: 126.4, name: 'lamp_on', vol: 0.45, dur: 2.8},
	{t: 128.4, name: 'ping', vol: 0.35, dur: 4},
	// 升回海面：大字；母子鲸的叫声；海面的水声；片尾
	{t: bar(68), name: 'impact', vol: 0.75, dur: 8},
	{t: 147.6, name: 'surface_amb', vol: 0.7, dur: 13},
	{t: 148.6, name: 'whale_call', vol: 0.85, dur: 8.5},
	{t: 152.4, name: 'whale_call2', vol: 0.6, dur: 7.5},
	{t: bar(72), name: 'impact_soft', vol: 0.55, dur: 7},
];

export const Sfx: React.FC<{volume: number}> = ({volume}) => (
	<>
		{CUES.map((c, i) => (
			<Sequence key={i} from={Math.max(0, fr(c.t))} durationInFrames={fr(c.dur ?? 8)}>
				<Audio src={staticFile(`sfx/${c.name}.mp3`)} volume={(c.vol ?? 1) * volume} />
			</Sequence>
		))}
	</>
);
