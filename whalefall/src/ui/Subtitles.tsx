import React from 'react';
import {useCurrentFrame} from 'remotion';
import {LINES, Line} from '../script';
import {C, FONT, GLOW} from './theme';
import {sec, clamp, easeOut} from '../lib/time';

const CPS = 11; // 每秒出几个字
const CHAR_IN = 0.28; // 单个字从模糊到清晰的时长
const FADE_OUT = 0.35;

/** 拆出普通字和【关键词】 */
function parse(text: string) {
	const out: {ch: string; key: boolean}[] = [];
	let key = false;
	for (const ch of text) {
		if (ch === '【') key = true;
		else if (ch === '】') key = false;
		else out.push({ch, key});
	}
	return out;
}

function lineEnd(i: number): number {
	const l = LINES[i];
	if (l.end !== undefined) return l.end;
	const next = LINES[i + 1];
	return next ? next.t - 0.12 : l.t + 3;
}

export const SubtitleLine: React.FC<{line: Line; end: number; t: number}> = ({line, end, t}) => {
	const chars = parse(line.text);
	const out = clamp((end - t) / FADE_OUT);
	const top = line.pos === 'top';
	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				right: 0,
				[top ? 'top' : 'bottom']: top ? 96 : 92,
				textAlign: 'center',
				fontFamily: FONT.serif,
				fontWeight: 700,
				fontSize: 54,
				letterSpacing: 2,
				color: C.text,
				textShadow: GLOW,
				opacity: out,
				filter: out < 1 ? `blur(${(1 - out) * 4}px)` : undefined,
			}}
		>
			{chars.map((c, k) => {
				const p = easeOut(clamp((t - line.t - k / CPS) / CHAR_IN));
				return (
					<span
						key={k}
						style={{
							display: 'inline-block',
							opacity: p,
							filter: `blur(${(1 - p) * 8}px)`,
							transform: `translateY(${(1 - p) * 8}px)`,
							color: c.key ? C.amber : undefined,
							textShadow: c.key ? `0 0 22px rgba(255, 190, 120, 0.55), ${GLOW}` : undefined,
							whiteSpace: 'pre',
						}}
					>
						{c.ch}
					</span>
				);
			})}
		</div>
	);
};

export const Subtitles: React.FC = () => {
	const t = sec(useCurrentFrame());
	return (
		<>
			{LINES.map((l, i) => {
				const end = lineEnd(i);
				if (t < l.t || t > end) return null;
				return <SubtitleLine key={i} line={l} end={end} t={t} />;
			})}
		</>
	);
};
