import React from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import type {Cue} from '../lib/timeline';
import {C, SERIF} from '../theme';

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
	const y = interpolate(frame, [cue.start, cue.start + 12], [6, 0], {extrapolateRight: 'clamp'});
	return (
		<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 74}}>
			<div style={{opacity: o, transform: `translateY(${y}px)`, textAlign: 'center', maxWidth: 1400}}>
				<div
					style={{
						fontFamily: SERIF,
						fontWeight: 400,
						fontSize: 38,
						letterSpacing: '0.08em',
						color: C.ice,
						textShadow: '0 0 18px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.9)',
						lineHeight: 1.35,
					}}
				>
					{cue.zh}
				</div>
				{showEnglish ? (
					<div
						style={{
							marginTop: 10,
							fontFamily: SERIF,
							fontWeight: 300,
							fontSize: 19,
							letterSpacing: '0.06em',
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
