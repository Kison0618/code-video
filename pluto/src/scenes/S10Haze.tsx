import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {FxCanvas} from '../fx/Canvas';
import {Flare} from '../fx/Flare';
import {dot, glow, glowPath, rgba, trail} from '../fx/glow';
import {drawSphere, fibSphere, plutoColor} from '../fx/sphere';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {C, MONO, RGB, SERIF} from '../theme';

const PL = fibSphere(12000, 'pluto-10');
const CX = 960;
const CY = 540;

export const S10Haze: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const leave = appear(f, 0, c1, easeInOut);
	const turn = appear(f, c1 - 40, 60, easeInOut); // 转身：受光面 → 逆光剪影
	const haze = appear(f, c1 - 10, 70, easeInOut);
	const sunUp = appear(f, c1 + 10, 90, easeInOut);
	const panel = appear(f, c2 + 10, 30);
	const R = lerp(360, 270, leave);
	const cx = lerp(1180, CX, turn);
	const sunAng = (-38 * Math.PI) / 180;
	const sunD = lerp(R * 0.6, R * 1.06, sunUp);
	const sx = cx + Math.cos(sunAng) * sunD;
	const sy = CY + Math.sin(sunAng) * sunD;
	const dust = useMemo(() => new Array(220).fill(0).map((_, i) => ({x: random(`hz-x${i}`), y: random(`hz-y${i}`), v: random(`hz-v${i}`)})), []);
	return (
		<SceneFrame {...props} stars={{opacity: 0.5, drift: 0.04}} tint="rgba(60,120,220,0.22)" kicker="LOOKING BACK · MVIC" hudRight={'N₂ · CH₄ · CO\nHAZE LAYERS > 20'} warm={0.06}>
			<FxCanvas
				draw={(ctx, fr) => {
					// 受光的冥王星（逐渐变成剪影）
					drawSphere(ctx, {cx, cy: CY, R, spin: 160 - fr * 0.15, tilt: 18, points: PL, color: plutoColor(0.1), size: 1.15, alpha: 1 - turn * 0.96, base: {c: [70, 44, 32], a: 0.5 * (1 - turn)}, rim: {c: RGB.gold, a: 0.3 * (1 - turn)}});
					if (haze > 0) {
						ctx.globalCompositeOperation = 'lighter';
						glow(ctx, cx, CY, R * 2.1, RGB.blue, 0.3 * haze);
						glow(ctx, sx, sy, R * 1.6, RGB.blueHot, 0.25 * haze * sunUp);
					}
					// 剪影
					if (turn > 0) {
						ctx.globalCompositeOperation = 'source-over';
						ctx.globalAlpha = turn;
						ctx.fillStyle = '#020306';
						ctx.beginPath();
						ctx.arc(cx, CY, R, 0, Math.PI * 2);
						ctx.fill();
					}
					ctx.globalCompositeOperation = 'lighter';
					// 大气层：分层的蓝色雾霾环（朝太阳一侧更亮：前向散射）
					if (haze > 0) {
						const layers = 22;
						for (let k = 0; k < layers; k++) {
							const rr = R + 3 + k * 4.2 + Math.sin(k * 1.7) * 1.5;
							const base = Math.exp(-k / 5.5) * (k % 3 === 0 ? 1 : 0.55);
							const seg = 96;
							for (let s = 0; s < seg; s++) {
								const a0 = (s / seg) * Math.PI * 2;
								const a1 = ((s + 1.05) / seg) * Math.PI * 2;
								const fwd = 0.14 + 0.86 * Math.pow(0.5 + 0.5 * Math.cos(a0 - sunAng), 3) * (0.6 + 0.6 * sunUp);
								const wav = 0.85 + 0.15 * Math.sin(a0 * 6 + k + fr * 0.02);
								const a = haze * base * fwd * wav * Math.min(1, appear(fr, c1 - 10 + k * 2, 30) * 1.3);
								if (a < 0.01) continue;
								ctx.globalAlpha = Math.min(1, a * 1.3);
								ctx.strokeStyle = k < 2 ? 'rgb(212,241,255)' : 'rgb(110,190,255)';
								ctx.lineWidth = k < 2 ? 2.2 : 1.6;
								ctx.beginPath();
								ctx.arc(cx, CY, rr, a0, a1);
								ctx.stroke();
							}
						}
						// 朝阳一侧的亮弧
						const arc: [number, number][] = [];
						for (let k = -40; k <= 40; k++) {
							const a = sunAng + (k / 40) * 1.5;
							arc.push([cx + Math.cos(a) * (R + 4), CY + Math.sin(a) * (R + 4)]);
						}
						glowPath(ctx, arc, RGB.blueHot, {width: 1.6, a: haze * (0.4 + 0.6 * sunUp), bloom: 26});
						// 宽而淡的外辉
						for (const [w, al] of [[36, 0.08], [16, 0.16]] as const) {
							ctx.globalAlpha = al * haze;
							ctx.strokeStyle = 'rgb(127,208,255)';
							ctx.lineWidth = w;
							ctx.beginPath();
							ctx.arc(cx, CY, R + 24, 0, Math.PI * 2);
							ctx.stroke();
						}
					}
					// 飘浮的微尘
					for (const d of dust) {
						const x = ((d.x * 2200 + fr * (0.3 + d.v)) % 2200) - 140;
						const y = d.y * 1080;
						dot(ctx, x, y, 0.8 + d.v, RGB.blueHot, 0.15 + 0.25 * d.v * haze);
					}
					// 离开的轨迹（A）
					const tA = (1 - turn) * appear(fr, 10, 30);
					if (tA > 0) {
						const pts: [number, number][] = [];
						for (let k = 0; k <= 40; k++) {
							const t = (k / 40) * (0.3 + leave * 0.7);
							pts.push([lerp(cx - R - 60, 140, t), lerp(CY + R * 0.4, 880, t * t)]);
						}
						trail(ctx, pts.reverse(), RGB.goldHot, 3, tA);
						const h = pts[0];
						glow(ctx, h[0], h[1], 50, RGB.goldHot, tA);
						dot(ctx, h[0], h[1], 3, RGB.white, tA);
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			{/* 太阳从边缘后面露出 */}
			<Flare x={sx} y={sy} size={lerp(18, 40, sunUp)} intensity={sunUp * 1.3} streak={1.8} />
			<AbsoluteFill>
				<div style={{position: 'absolute', left: 110, top: 360, opacity: inOut(f, 20, c1 + 10, 20), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>DEPARTURE · 离开</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 64, color: C.ice, letterSpacing: '0.14em', marginTop: 14}}>回头一望</div>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.iceDim, letterSpacing: '0.3em', marginTop: 14}}>NEW HORIZONS · LOOKING BACK</div>
				</div>
				<div style={{position: 'absolute', left: 110, top: 330, opacity: panel, whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.blue, letterSpacing: '0.4em'}}>ATMOSPHERE · 大气</div>
					<div style={{fontFamily: MONO, fontSize: 88, color: C.blueHot, textShadow: '0 0 30px rgba(127,208,255,0.8)', marginTop: 10, lineHeight: 1}}>
						N<sub style={{fontSize: 44}}>2</sub>
					</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: C.ice, letterSpacing: '0.2em', marginTop: 12}}>主要是氮气 · 少量甲烷</div>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.iceDim, letterSpacing: '0.3em', marginTop: 34}}>SURFACE PRESSURE · 气压</div>
					<div style={{fontFamily: MONO, fontSize: 54, color: C.ice, marginTop: 8}}>
						≈ 1 / 100,000
					</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 18, color: C.iceDim, letterSpacing: '0.2em', marginTop: 8}}>地球大气压的十万分之一</div>
				</div>
				<div style={{position: 'absolute', right: 110, top: 700, opacity: panel, textAlign: 'right', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 54, color: C.blueHot, textShadow: '0 0 24px rgba(127,208,255,0.7)'}}>20+</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 18, color: C.iceDim, letterSpacing: '0.2em', marginTop: 6}}>层雾霾 · 延伸到 200 公里高空</div>
				</div>
			</AbsoluteFill>
			{/* —— 音效 —— */}
			<Sfx name="drone" at={0} vol={0.45} fadeIn={30} rate={0.75} />
			<Sfx name="whoosh2" at={c1 - 10} vol={0.4} />
			<Sfx name="swell" at={c1 + 45} vol={0.4} />
			<Sfx name="impact_soft" at={c1 + 45} vol={0.45} />
			<Sfx name="shimmer" at={c1 + 48} vol={0.5} />
			<SfxSeq name="blip" vol={0.25} at={[c2 + 10, c2 + 22, c2 + 34]} rate={(i) => 1 + i * 0.12} />
		</SceneFrame>
	);
};
