import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {Label} from '../components/Hud';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {FxCanvas} from '../fx/Canvas';
import {dot, glow, rgba} from '../fx/glow';
import {appear, easeInOut, lerp} from '../lib/anim';
import {C, MONO, RGB} from '../theme';

const PX = 960;
const PY = 500;
const PW = 1240;
const PH = 640;
const A: [number, number] = [0.64, 0.42];
const B: [number, number] = [0.668, 0.409];

export const S01Plates: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const stars = useMemo(
		() =>
			new Array(1700).fill(0).map((_, i) => {
				const m = Math.pow(random(`pl-m-${i}`), 5);
				// 银河带：更多星星集中在一条斜带上
				const band = random(`pl-b-${i}`) < 0.55;
				const u = random(`pl-x-${i}`);
				const v = band ? 0.5 + (random(`pl-y-${i}`) - 0.5) * 0.45 + (u - 0.5) * 0.5 : random(`pl-y-${i}`);
				return {u, v, m, ph: random(`pl-p-${i}`) * 6.28, jit: random(`pl-j-${i}`)};
			}),
		[],
	);
	const develop = appear(f, 6, 70, easeInOut); // 底片“显影”扫描
	const frameIn = appear(f, 0, 40, easeInOut);
	const blinkOn = f > c1 + 10;
	const showB = blinkOn && Math.floor((f - c1) / 10) % 2 === 1;
	const focus = appear(f, c2 + 4, 40, easeInOut);
	const zoom = lerp(1, 1.85, appear(f, c2 + 10, 90, easeInOut));
	const pp = showB ? B : A;
	const tx = (PX - PW / 2 + pp[0] * PW - PX) * (zoom - 1);
	const ty = (PY - PH / 2 + pp[1] * PH - PY) * (zoom - 1);
	return (
		<SceneFrame {...props} stars={{opacity: 0.25, drift: 0.03}} kicker="1930.02 · FLAGSTAFF" hudRight={'LOWELL OBSERVATORY\n13-INCH ASTROGRAPH'}>
			<AbsoluteFill style={{transform: `translate(${-tx}px, ${-ty}px) scale(${zoom})`, transformOrigin: `${PX}px ${PY}px`}}>
				<FxCanvas
					draw={(ctx) => {
						const x0 = PX - PW / 2;
						const y0 = PY - PH / 2;
						// 底片底色
						ctx.fillStyle = rgba([12, 16, 26], 0.85 * frameIn);
						ctx.fillRect(x0, y0, PW, PH);
						const scanY = y0 + PH * develop;
						ctx.globalCompositeOperation = 'lighter';
						for (const s of stars) {
							const x = x0 + s.u * PW;
							const y = y0 + s.v * PH;
							if (y > scanY || s.v < 0 || s.v > 1) continue;
							// 闪烁比较：A/B 两张底片星点有极轻微的抖动差异
							const jx = showB ? (s.jit - 0.5) * 0.6 : 0;
							const a = (0.25 + 0.75 * Math.min(1, s.m * 4 + 0.2)) * (1 - focus * 0.75);
							dot(ctx, x + jx, y, 0.6 + s.m * 2.4, RGB.ice, a);
							if (s.m > 0.3) glow(ctx, x + jx, y, 8 + s.m * 18, RGB.blueHot, a * 0.35);
						}
						// 扫描显影光带
						if (develop > 0 && develop < 1) {
							const g = ctx.createLinearGradient(0, scanY - 60, 0, scanY);
							g.addColorStop(0, rgba(RGB.gold, 0));
							g.addColorStop(1, rgba(RGB.gold, 0.35));
							ctx.globalAlpha = 1;
							ctx.fillStyle = g;
							ctx.fillRect(x0, scanY - 60, PW, 60);
							ctx.fillStyle = rgba(RGB.goldHot, 0.9);
							ctx.fillRect(x0, scanY, PW, 1.5);
						}
						// 移动的那颗星
						const mx = x0 + pp[0] * PW;
						const my = y0 + pp[1] * PH;
						if (my < scanY) {
							const hot = appear(f, c2, 20);
							dot(ctx, mx, my, 1.8 + hot * 1.2, hot > 0 ? RGB.goldHot : RGB.ice, 1);
							glow(ctx, mx, my, 20 + hot * 60, RGB.gold, 0.4 + hot * 0.8);
							// 两次位置之间的轨迹
							if (focus > 0) {
								const ax = x0 + A[0] * PW, ay = y0 + A[1] * PH, bx = x0 + B[0] * PW, by = y0 + B[1] * PH;
								ctx.globalAlpha = focus;
								ctx.strokeStyle = rgba(RGB.gold, 0.8);
								ctx.setLineDash([3, 4]);
								ctx.lineWidth = 1;
								ctx.beginPath();
								ctx.moveTo(ax, ay);
								ctx.lineTo(bx, by);
								ctx.stroke();
								ctx.setLineDash([]);
								dot(ctx, ax, ay, 1.5, RGB.gold, focus * 0.7);
								dot(ctx, bx, by, 1.5, RGB.gold, focus * 0.7);
							}
						}
						ctx.globalCompositeOperation = 'source-over';
						// 边框 + 角标 + 刻度
						ctx.globalAlpha = frameIn;
						ctx.strokeStyle = rgba(RGB.ice, 0.25);
						ctx.lineWidth = 1;
						ctx.strokeRect(x0, y0, PW, PH);
						ctx.strokeStyle = rgba(RGB.gold, 0.9);
						ctx.lineWidth = 2;
						const L = 26;
						for (const [cx, cy, sx, sy] of [
							[x0, y0, 1, 1],
							[x0 + PW, y0, -1, 1],
							[x0, y0 + PH, 1, -1],
							[x0 + PW, y0 + PH, -1, -1],
						]) {
							ctx.beginPath();
							ctx.moveTo(cx + sx * L, cy);
							ctx.lineTo(cx, cy);
							ctx.lineTo(cx, cy + sy * L);
							ctx.stroke();
						}
						ctx.strokeStyle = rgba(RGB.ice, 0.3);
						ctx.lineWidth = 1;
						for (let i = 1; i < 40; i++) {
							const x = x0 + (PW * i) / 40;
							const l = i % 5 === 0 ? 10 : 5;
							ctx.beginPath();
							ctx.moveTo(x, y0 + PH);
							ctx.lineTo(x, y0 + PH + l);
							ctx.stroke();
						}
						ctx.globalAlpha = 1;
					}}
				/>
				{/* 准星 */}
				<Reticle x={PX - PW / 2 + pp[0] * PW} y={PY - PH / 2 + pp[1] * PH} t={focus} f={f} zoom={zoom} />
			</AbsoluteFill>
			{/* 底片标签 & 闪烁指示 */}
			<div style={{position: 'absolute', left: PX - PW / 2, top: PY - PH / 2 - 36, opacity: frameIn * (1 - focus), display: 'flex', gap: 28, alignItems: 'center'}}>
				{(['A', 'B'] as const).map((k) => {
					const on = (k === 'B') === showB;
					return (
						<div key={k} style={{display: 'flex', alignItems: 'center', gap: 10, opacity: blinkOn || k === 'A' ? 1 : 0.35}}>
							<span style={{width: 9, height: 9, borderRadius: 9, background: on ? C.gold : 'transparent', border: `1px solid ${C.gold}`, boxShadow: on ? `0 0 12px ${C.gold}` : 'none'}} />
							<span style={{fontFamily: MONO, fontSize: 13, letterSpacing: '0.22em', color: on ? C.ice : C.iceDim}}>
								PLATE {k} · 1930.01.{k === 'A' ? '23' : '29'}
							</span>
						</div>
					);
				})}
				<span style={{fontFamily: MONO, fontSize: 13, letterSpacing: '0.3em', color: C.gold, opacity: blinkOn ? 0.9 : 0}}>◉ BLINK COMPARATOR</span>
			</div>
			<Label x={1180} y={300} zh="移动的光点" en="6 DAYS · 3.5 mm ON THE PLATE" color={C.gold} opacity={appear(f, c2 + 40, 30)} />
			{/* —— 音效 —— */}
			<Sfx name="drone" at={0} vol={0.4} fadeIn={20} dur={c2 + 120} />
			<Sfx name="scan" at={6} vol={0.35} dur={72} />
			<SfxSeq name="shutter" vol={0.45} at={Array.from({length: Math.max(0, Math.floor((c2 + 40 - (c1 + 10)) / 10))}, (_, i) => c1 + 10 + i * 10)} />
			<Sfx name="lock" at={c2 + 2} vol={0.45} />
			<Sfx name="whoosh_fast" at={c2 + 40} vol={0.35} />
			<Sfx name="blip" at={c2 + 42} vol={0.3} />
		</SceneFrame>
	);
};

const Reticle: React.FC<{x: number; y: number; t: number; f: number; zoom: number}> = ({x, y, t, f, zoom}) => {
	if (t <= 0) return null;
	const r = lerp(120, 34, t) / zoom;
	const sw = 1.4 / zoom;
	return (
		<svg width={1920} height={1080} style={{position: 'absolute', left: 0, top: 0, overflow: 'visible', opacity: t}}>
			<g transform={`translate(${x} ${y}) rotate(${f * 1.2})`}>
				<circle r={r} fill="none" stroke={C.gold} strokeWidth={sw} strokeDasharray={`${8 / zoom} ${6 / zoom}`} />
				<circle r={r * 1.5} fill="none" stroke={C.gold} strokeOpacity={0.35} strokeWidth={sw} />
			</g>
			<g stroke={C.gold} strokeWidth={sw} strokeOpacity={0.7}>
				<line x1={x - 400} x2={x - r * 1.7} y1={y} y2={y} />
				<line x1={x + r * 1.7} x2={x + 400} y1={y} y2={y} />
				<line y1={y - 300} y2={y - r * 1.7} x1={x} x2={x} />
				<line y1={y + r * 1.7} y2={y + 300} x1={x} x2={x} />
			</g>
		</svg>
	);
};
