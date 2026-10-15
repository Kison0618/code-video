import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {Cue} from '../lib/timeline';
import {C, SERIF} from '../theme';

/** 【关键词】 → 金色高亮 */
export const renderMarked = (s: string, color: string = C.gold) => {
	const parts = s.split(/(【[^】]+】)/g).filter(Boolean);
	return parts.map((p, i) =>
		p.startsWith('【') ? (
			<span key={i} style={{color, textShadow: `0 0 18px ${color}88, 0 0 2px rgba(0,0,0,0.9)`}}>
				{p.slice(1, -1)}
			</span>
		) : (
			<span key={i}>{p}</span>
		),
	);
};

export const stripMarks = (s: string) => s.replace(/[【】]/g, '');

export const Subtitles: React.FC<{cues: Cue[]; showEnglish?: boolean}> = ({cues, showEnglish = true}) => {
	const frame = useCurrentFrame();
	const i = cues.findIndex((c, idx) => frame >= c.start && (frame < c.end || idx === cues.length - 1));
	if (i < 0) return null;
	const cue = cues[i];
	const isLast = i === cues.length - 1;
	const holdEnd = isLast ? cue.end + 20 : cue.end;
	const o = interpolate(frame, [cue.start, cue.start + 8, holdEnd - 6, holdEnd], [0, 1, 1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const blur = interpolate(frame, [cue.start, cue.start + 10], [6, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const sp = interpolate(frame, [cue.start, cue.start + 16], [0.16, 0.08], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 70}}>
			<div style={{opacity: o, filter: `blur(${blur}px)`, textAlign: 'center', maxWidth: 1500}}>
				<div
					style={{
						fontFamily: SERIF,
						fontWeight: 600,
						fontSize: 40,
						letterSpacing: `${sp}em`,
						color: C.ice,
						textShadow: '0 0 20px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.9)',
						lineHeight: 1.35,
					}}
				>
					{renderMarked(cue.zh)}
				</div>
				{showEnglish ? (
					<div
						style={{
							marginTop: 10,
							fontFamily: SERIF,
							fontWeight: 300,
							fontStyle: 'italic',
							fontSize: 19,
							letterSpacing: '0.05em',
							color: C.iceDim,
							textShadow: '0 0 12px rgba(0,0,0,0.9)',
						}}
					>
						{cue.en}
					</div>
				) : null}
			</div>
		</AbsoluteFill>
	);
};
