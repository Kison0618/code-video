import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {TITLE, BIG, END} from '../script';
import {C, FONT, GLOW} from './theme';
import {sec, prog, clamp, easeOut, window01} from '../lib/time';

/** 片名：17.05 秒白闪一下，发光大字从强光里出来，下面一圈圈涟漪，问句逐字打出 */
export const TitleCard: React.FC = () => {
	const t = sec(useCurrentFrame());
	if (t < TITLE.t - 0.2 || t > TITLE.end + 0.1) return null;
	const k = t - TITLE.t;
	const flash = k < 0 ? 0 : Math.exp(-k * 7) * (k < 0.07 ? 1 : 0.85);
	const appear = easeOut(prog(k, 0, 0.6));
	const glow = 1 + 3 * Math.exp(-k * 2.2);
	const ab = 10 * Math.exp(-k * 4); // 色散，只在片名用一次
	const out = clamp((TITLE.end - t) / 0.6);
	const qChars = [...TITLE.q];
	return (
		<AbsoluteFill style={{opacity: out}}>
			<AbsoluteFill style={{background: 'rgba(0,4,10,0.35)', opacity: appear}} />
			<svg width={1920} height={1080} style={{position: 'absolute', opacity: 0.55 * appear}}>
				{[0, 1, 2, 3].map((i) => {
					const r = ((k * 140 + i * 90) % 380) + 20;
					return <ellipse key={i} cx={960} cy={650} rx={r * 1.6} ry={r * 0.32} fill="none" stroke="rgba(170,230,255,0.5)" strokeWidth={1.2} opacity={1 - r / 400} />;
				})}
			</svg>
			<div
				style={{
					position: 'absolute', left: 0, right: 0, top: 330, textAlign: 'center',
					fontFamily: FONT.serif, fontWeight: 900, fontSize: 250, letterSpacing: 40, color: '#fff',
					opacity: appear,
					filter: `blur(${(1 - appear) * 16}px)`,
					transform: `scale(${1.06 - 0.06 * appear})`,
					textShadow: `${ab}px 0 0 rgba(255,60,60,${0.5 * Math.min(1, ab)}), ${-ab}px 0 0 rgba(60,200,255,${0.5 * Math.min(1, ab)}), 0 0 ${30 * glow}px rgba(170,225,255,0.8), 0 0 ${90 * glow}px rgba(110,190,255,0.5)`,
				}}
			>
				{TITLE.zh}
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 672, textAlign: 'center', fontFamily: FONT.mono, fontSize: 22, letterSpacing: 6, color: C.sub, opacity: appear}}>
				{TITLE.en}
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 732, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 700, fontSize: 46, color: C.text, textShadow: GLOW}}>
				{qChars.map((ch, i) => {
					const p = easeOut(clamp((k - 0.95 - i / 10) / 0.28));
					return <span key={i} style={{display: 'inline-block', opacity: p, filter: `blur(${(1 - p) * 8}px)`, color: i >= 9 && i <= 12 ? C.amber : undefined}}>{ch}</span>;
				})}
			</div>
			<AbsoluteFill style={{background: '#fff', opacity: flash}} />
		</AbsoluteFill>
	);
};

/** 砸出来的大字 */
export const BigText: React.FC = () => {
	const t = sec(useCurrentFrame());
	return (
		<>
			{BIG.map((b, i) => {
				if (t < b.t || t > b.end) return null;
				const k = t - b.t;
				const p = easeOut(prog(k, 0, 0.45));
				const out = clamp((b.end - t) / 0.5);
				const chars = [...b.zh];
				return (
					<AbsoluteFill key={i} style={{opacity: out, alignItems: 'center', justifyContent: 'center'}}>
						<div style={{fontFamily: FONT.serif, fontWeight: 900, fontSize: chars.length > 4 ? 150 : 190, letterSpacing: 18, color: b.color}}>
							{chars.map((ch, j) => {
								const q = easeOut(prog(k, j * 0.07, j * 0.07 + 0.4));
								return (
									<span key={j} style={{display: 'inline-block', opacity: q, transform: `scale(${1.25 - 0.25 * q})`, filter: `blur(${(1 - q) * 14}px)`, textShadow: `0 0 ${40 + 60 * Math.exp(-k * 2)}px ${b.color}aa, 0 0 4px #000`}}>
										{ch}
									</span>
								);
							})}
						</div>
						{b.en ? <div style={{marginTop: 26, fontFamily: FONT.mono, fontSize: 22, letterSpacing: 6, color: C.sub, opacity: p}}>{b.en}</div> : null}
					</AbsoluteFill>
				);
			})}
		</>
	);
};

/** 片尾卡 */
export const EndCard: React.FC = () => {
	const t = sec(useCurrentFrame());
	if (t < END.t) return null;
	const k = t - END.t;
	const a = easeOut(prog(k, 0, 1.2));
	const d = [...END.dedication];
	const fadeAll = clamp((160 - t) / 1.2);
	return (
		<AbsoluteFill style={{opacity: fadeAll}}>
			<div style={{position: 'absolute', left: 0, right: 0, top: 300, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 900, fontSize: 150, letterSpacing: 30, color: '#fff', opacity: a, filter: `blur(${(1 - a) * 10}px)`, textShadow: '0 0 40px rgba(170,225,255,0.6)'}}>
				{END.zh}
			</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 500, textAlign: 'center', fontFamily: FONT.mono, fontSize: 20, letterSpacing: 6, color: C.sub, opacity: a}}>W H A L E   F A L L</div>
			<div style={{position: 'absolute', left: 0, right: 0, top: 580, textAlign: 'center', fontFamily: FONT.serif, fontWeight: 700, fontSize: 42, color: C.text, textShadow: GLOW}}>
				{d.map((ch, i) => {
					const p = easeOut(clamp((k - 1.0 - i / 10) / 0.3));
					return <span key={i} style={{display: 'inline-block', opacity: p, filter: `blur(${(1 - p) * 8}px)`, whiteSpace: 'pre'}}>{ch}</span>;
				})}
			</div>
			<div style={{position: 'absolute', left: 200, right: 200, bottom: 90, textAlign: 'center', fontFamily: FONT.mono, fontSize: 15, letterSpacing: 1, color: 'rgba(200,220,235,0.5)', opacity: window01(t, END.t + 2.2, 170, 1, 1)}}>
				{END.refs}
			</div>
		</AbsoluteFill>
	);
};
