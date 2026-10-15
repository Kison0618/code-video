import {SCENES, SceneDef} from '../script';
import {FPS} from '../theme';

export const PAD_IN = 0.6; // 场景开始到旁白开始（秒）
export const PAD_OUT = 0.9; // 旁白结束到场景结束（秒）
const EST_CHARS_PER_SEC = 4.3; // 无配音时的估算语速

export type Cue = {zh: string; en: string; start: number; end: number};

export type TimedScene = {
	id: string;
	from: number;
	duration: number;
	voStart: number;
	voDuration: number;
	voiceSrc: string | null;
	cues: Cue[];
	def: SceneDef;
};

export type Timeline = {
	scenes: TimedScene[];
	total: number;
	bgmSrc: string | null;
};

const weight = (s: string) => s.replace(/[\s，。、：；！？,.:;!?\-—【】]/g, '').length + 2;

export const estimateSeconds = (def: SceneDef) => {
	const chars = def.lines.reduce((a, l) => a + weight(l.zh), 0);
	return chars / EST_CHARS_PER_SEC;
};

export const buildTimeline = (
	voice: Record<string, {src: string; seconds: number} | null>,
	bgmSrc: string | null,
): Timeline => {
	let cursor = 0;
	const scenes: TimedScene[] = SCENES.map((def) => {
		const v = voice[def.id];
		const voSec = v ? v.seconds : estimateSeconds(def);
		const tail = def.tailSeconds ?? 0;
		const sec = Math.max(def.minSeconds ?? 0, PAD_IN + voSec + PAD_OUT + tail);
		const duration = Math.round(sec * FPS);
		const voStart = Math.round(PAD_IN * FPS);
		const voDuration = Math.round(voSec * FPS);
		const total = def.lines.reduce((a, l) => a + weight(l.zh), 0);
		let acc = 0;
		const cues: Cue[] = def.lines.map((l) => {
			const s = voStart + (acc / total) * voDuration;
			acc += weight(l.zh);
			const e = voStart + (acc / total) * voDuration;
			return {zh: l.zh, en: l.en, start: Math.round(s), end: Math.round(e)};
		});
		const scene: TimedScene = {
			id: def.id,
			from: cursor,
			duration,
			voStart,
			voDuration,
			voiceSrc: v ? v.src : null,
			cues,
			def,
		};
		cursor += duration;
		return scene;
	});
	return {scenes, total: cursor, bgmSrc};
};
