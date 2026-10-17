import React from 'react';
import {useCurrentFrame} from 'remotion';
import {LABELS, NOTES} from '../script';
import {C, FONT} from './theme';
import {sec, window01, prog, easeOut, lerp} from '../lib/time';

/** 左上角章节标签：中文 + 等宽小字 */
export const ChapterLabels: React.FC = () => {
	const t = sec(useCurrentFrame());
	return (
		<>
			{LABELS.map((l, i) => {
				const a = window01(t, l.t0, l.t1, 0.6, 0.5);
				if (a <= 0) return null;
				const slide = easeOut(prog(t, l.t0, l.t0 + 0.8));
				return (
					<div key={i} style={{position: 'absolute', left: 96, top: 84, opacity: a, transform: `translateX(${(1 - slide) * -14}px)`}}>
						<div style={{display: 'flex', alignItems: 'center', gap: 14}}>
							<div style={{width: 3, height: 34, background: C.amber, boxShadow: `0 0 10px ${C.amber}`}} />
							<div style={{fontFamily: FONT.serif, fontWeight: 700, fontSize: 34, color: C.text, letterSpacing: 2, textShadow: '0 0 12px rgba(0,0,0,.8)'}}>
								{l.zh}
							</div>
						</div>
						<div style={{marginLeft: 17, marginTop: 8, fontFamily: FONT.mono, fontSize: 17, color: C.sub, letterSpacing: 1.5}}>{l.en}</div>
					</div>
				);
			})}
		</>
	);
};

/** 右上角诚实标注 */
export const Notes: React.FC = () => {
	const t = sec(useCurrentFrame());
	return (
		<>
			{NOTES.map((n, i) => {
				const a = window01(t, n.t0, n.t1, 0.6, 0.5);
				if (a <= 0) return null;
				return (
					<div key={i} style={{position: 'absolute', right: 96, top: 92, opacity: a * 0.7, fontFamily: FONT.mono, fontSize: 16, color: C.sub, letterSpacing: 1.5}}>
						{n.text}
					</div>
				);
			})}
		</>
	);
};

/** 数字滚动卡：大号窄体数字 + 单位 + 说明 */
export const Counter: React.FC<{
	t: number;
	t0: number;
	t1: number;
	from: number;
	to: number;
	dur?: number;
	unit?: string;
	caption?: string;
	x: number;
	y: number;
	align?: 'left' | 'right';
	color?: string;
	size?: number;
	decimals?: number;
}> = ({t, t0, t1, from, to, dur = 1.6, unit = '', caption, x, y, align = 'left', color = C.text, size = 120, decimals = 0}) => {
	const a = window01(t, t0, t1, 0.4, 0.5);
	if (a <= 0) return null;
	const v = lerp(from, to, easeOut(prog(t, t0, t0 + dur)));
	const s = v.toLocaleString('en-US', {minimumFractionDigits: decimals, maximumFractionDigits: decimals});
	return (
		<div style={{position: 'absolute', [align]: x, top: y, opacity: a, textAlign: align}}>
			<div style={{fontFamily: FONT.num, fontWeight: 500, fontSize: size, lineHeight: 1, color, textShadow: `0 0 24px ${color}66, 0 0 2px #000`, letterSpacing: 1}}>
				{s}
				<span style={{fontSize: size * 0.32, marginLeft: 10, fontFamily: FONT.serif, fontWeight: 700}}>{unit}</span>
			</div>
			{caption ? <div style={{marginTop: 10, fontFamily: FONT.mono, fontSize: 18, color: C.sub, letterSpacing: 1.5}}>{caption}</div> : null}
		</div>
	);
};

/** 右侧深度计：沉降段用 */
export const DepthGauge: React.FC<{t: number; t0: number; t1: number; depth: number}> = ({t, t0, t1, depth}) => {
	const a = window01(t, t0, t1, 0.8, 0.6);
	if (a <= 0) return null;
	const H = 560;
	const max = 2200;
	const y = (d: number) => (d / max) * H;
	const marks = [0, 200, 500, 1000, 1500, 2000];
	return (
		<div style={{position: 'absolute', right: 130, top: 230, height: H, width: 10, opacity: a, fontFamily: FONT.mono, color: C.sub, fontSize: 15, whiteSpace: 'nowrap'}}>
			<div style={{position: 'absolute', right: 0, top: 0, width: 1, height: H, background: 'rgba(200,230,255,0.25)'}} />
			{marks.map((m) => (
				<div key={m} style={{position: 'absolute', right: 0, top: y(m), display: 'flex', alignItems: 'center', gap: 8, transform: 'translateY(-50%)', opacity: 0.8}}>
					<span>{m} m</span>
					<div style={{width: 10, height: 1, background: 'rgba(200,230,255,0.4)'}} />
				</div>
			))}
			<div style={{position: 'absolute', right: -6, top: y(depth), transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 10, whiteSpace: 'nowrap'}}>
				<span style={{fontFamily: FONT.num, fontSize: 48, color: C.text, textShadow: `0 0 16px ${C.cyan}`, marginRight: 70}}>{Math.round(depth).toLocaleString('en-US')} m</span>
				<div style={{width: 12, height: 12, borderRadius: 6, background: C.cyan, boxShadow: `0 0 12px ${C.cyan}`}} />
			</div>
		</div>
	);
};
