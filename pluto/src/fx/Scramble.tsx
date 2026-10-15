import React from 'react';
import {random, useCurrentFrame} from 'remotion';

const GLYPHS = '0123456789ABCDEF#%&@$*+=<>/\\|';

/** 解码式文字：未解出的字符显示为快速跳动的乱码。t: 0..1 */
export const Scramble: React.FC<{text: string; t: number; seed?: string; style?: React.CSSProperties; hot?: string}> = ({text, t, seed = 'scr', style, hot}) => {
	const f = useCurrentFrame();
	const chars = [...text];
	return (
		<span style={style}>
			{chars.map((ch, i) => {
				const at = (i / Math.max(1, chars.length)) * 0.7;
				const local = (t - at) / 0.3;
				if (local >= 1 || ch === ' ') return <span key={i}>{ch}</span>;
				if (local <= -0.4) return <span key={i} style={{opacity: 0}}>{ch}</span>;
				const g = GLYPHS[Math.floor(random(`${seed}-${i}-${Math.floor(f / 2)}`) * GLYPHS.length)];
				return (
					<span key={i} style={{color: hot, opacity: 0.85}}>
						{/[\u4e00-\u9fa5]/.test(ch) ? ch : g}
					</span>
				);
			})}
		</span>
	);
};
