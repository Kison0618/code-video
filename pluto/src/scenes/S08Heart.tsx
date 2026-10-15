import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {FxCanvas} from '../fx/Canvas';
import {Flare} from '../fx/Flare';
import {dot, glow, glowPath, rgba, trail} from '../fx/glow';
import {drawSphere, fibSphere, samplePluto} from '../fx/sphere';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {C, MONO, RGB, Rgb, SERIF} from '../theme';

const CX = 1180;
const CY = 510;
const R = 330;
const TILT = 12;
const PL = fibSphere(16000, 'pluto-8');

export const S08Heart: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const dur = scene.duration;
	const intro = appear(f, 0, 40, easeInOut);
	const pass = appear(f, 40, 70, easeInOut); // 飞掠
	const reveal = appear(f, c1 - 20, 110, easeInOut); // 数据自上而下回传
	const heart = appear(f, c1 + 60, 50);
	const beat = heart * (0.5 + 0.5 * Math.pow(Math.max(0, Math.sin((f - c1) / 9)), 6));
	const label = appear(f, c1 + 110, 30);
	const spin = 183 + lerp(-40, 0, appear(f, 0, c1 + 80, easeInOut));
	const bits = useMemo(() => new Array(18).fill(0).map((_, i) => ({x: random(`bx${i}`), v: 0.5 + random(`bv${i}`), s: random(`bs${i}`)})), []);
	const revealLat = lerp(95, -95, reveal);
	const hy = CY - 0.14 * R;
	return (
		<SceneFrame {...props} stars={{opacity: 0.45, drift: 0.05}} kicker="2015.07.14 · FLYBY" hudRight={'NEW HORIZONS · LORRI / MVIC\nDOWNLINK ≈ 1–4 KBPS'} warm={0.2}>
			<FxCanvas
				draw={(ctx, fr) => {
					// ---------- 点云冥王星 ----------
					const col = (p: (typeof PL)[number]) => {
						const [r, g, b, h] = samplePluto(p.lon, p.lat);
						const lum = (r + g + b) / 765;
						const got = p.lat > revealLat + (p.j - 0.5) * 6;
						if (!got) {
							// 尚未回传：低分辨率的蓝色网格点
							const ml = ((p.lon % 15) + 15) % 15;
							const pl = ((p.lat % 15) + 15) % 15;
							const q = ml < 1.1 || ml > 13.9 || pl < 1.1 || pl > 13.9;
							return {c: RGB.blue as Rgb, a: q ? 0.6 : 0.06 + lum * 0.12, s: q ? 1.1 : 0.8};
						}
						if (h > 0.35) {
							const k = heart;
							return {c: [255, 236, 205] as Rgb, a: 0.7 + 0.3 * k + beat * 0.3, s: 1.1 + 0.35 * k + beat * 0.3, glow: 0.05 + 0.25 * k + beat * 0.4};
						}
						const warm: Rgb = lum < 0.32 ? [196, 88, 58] : [Math.min(255, r * 1.1), g, Math.min(255, b * 0.85)];
						return {c: warm, a: 0.2 + lum * 0.95, s: 0.85 + lum * 0.4};
					};
					drawSphere(ctx, {cx: CX, cy: CY, R, spin, tilt: TILT, points: PL, color: col, size: 1.15, alpha: intro, base: {c: [70, 44, 32], a: 0.55}, rim: {c: RGB.gold, a: 0.3}});
					ctx.globalCompositeOperation = 'lighter';
					// 回传扫描线（屏幕空间近似）
					if (reveal > 0 && reveal < 1) {
						const y = CY - R * Math.sin((revealLat * Math.PI) / 180) * Math.cos((TILT * Math.PI) / 180);
						const hw = Math.sqrt(Math.max(0, R * R - (y - CY) * (y - CY)));
						glowPath(ctx, [[CX - hw - 60, y], [CX + hw + 60, y]], RGB.blueHot, {width: 1.4, a: 0.9, bloom: 16});
						glow(ctx, CX + hw, y, 40, RGB.blueHot, 0.8);
						glow(ctx, CX - hw, y, 40, RGB.blueHot, 0.8);
					}
					// 心跳涟漪
					if (heart > 0) {
						glow(ctx, CX - 10, hy, 260, [255, 226, 190], 0.18 * heart + beat * 0.25);
						for (let k = 0; k < 3; k++) {
							const ph = (((fr - c1) / 60 + k / 3) % 1 + 1) % 1;
							ctx.globalAlpha = heart * (1 - ph) * 0.5;
							ctx.strokeStyle = rgba(RGB.goldHot, 1);
							ctx.lineWidth = 1.5;
							ctx.beginPath();
							ctx.ellipse(CX - 10, hy, 120 + ph * 300, (120 + ph * 300) * 0.9, 0, 0, Math.PI * 2);
							ctx.stroke();
						}
					}
					// 飞掠：探测器划过
					if (pass > 0 && pass < 1) {
						const p0: [number, number] = [CX - 900, CY + 380];
						const p1: [number, number] = [CX + 700, CY - 420];
						const tr: [number, number][] = [];
						for (let k = 0; k <= 30; k++) {
							const t = Math.max(0, pass - 0.25 + (k / 30) * 0.25);
							tr.push([lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t)]);
						}
						trail(ctx, tr, RGB.goldHot, 3, 1);
						const h = tr[tr.length - 1];
						glow(ctx, h[0], h[1], 70, RGB.goldHot, 1);
						dot(ctx, h[0], h[1], 3, RGB.white, 1);
					}
					// 数据流：0/1 比特雨（从右上方地球方向下行）
					const bitA = inOut(fr, c1 - 30, dur - 10, 30) * (1 - heart * 0.6);
					if (bitA > 0) {
						ctx.font = `14px "Pluto Mono", monospace`;
						ctx.textAlign = 'center';
						for (let i = 0; i < bits.length; i++) {
							const b = bits[i];
							const x = 1580 + b.x * 260;
							for (let k = 0; k < 14; k++) {
								const y = ((fr * 6 * b.v + k * 22 + b.s * 900) % 1100) - 40;
								const ch = random(`b-${i}-${k}-${Math.floor(fr / 4)}`) > 0.5 ? '1' : '0';
								const head = k === 13;
								ctx.globalAlpha = bitA * (head ? 0.9 : (k / 14) * 0.35);
								ctx.fillStyle = head ? '#d4f1ff' : '#7fd0ff';
								ctx.fillText(ch, x, y);
							}
						}
						ctx.textAlign = 'left';
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			<AbsoluteFill>
				{/* 大日期 */}
				<div style={{position: 'absolute', left: 110, top: 330, opacity: inOut(f, 10, c1 + 30, 20), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>CLOSEST APPROACH</div>
					<div style={{fontFamily: MONO, fontSize: 120, lineHeight: 1.05, color: C.ice, textShadow: '0 0 30px rgba(212,241,255,0.4)', marginTop: 12}}>
						2015
						<br />
						<span style={{color: C.goldHot, textShadow: '0 0 40px rgba(243,196,124,0.7)'}}>07.14</span>
					</div>
					<div style={{fontFamily: MONO, fontSize: 18, color: C.iceDim, letterSpacing: '0.3em', marginTop: 16}}>11:49:57 UTC · 13.8 KM/S</div>
				</div>
				{/* 回传遥测 */}
				<div style={{position: 'absolute', left: 110, top: 760, opacity: inOut(f, c1 - 20, c1 + 120, 20), whiteSpace: 'nowrap', fontFamily: MONO, fontSize: 13, color: C.blueHot, letterSpacing: '0.25em', lineHeight: 2}}>
					DOWNLINK ▸ {Math.min(100, Math.round(reveal * 100))}%<br />
					<span style={{color: C.iceDim}}>信号单程 4.5 小时 · 全部数据传回用了 16 个月</span>
				</div>
				{/* 汤博区 */}
				<div style={{position: 'absolute', left: 110, top: 400, opacity: label, whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>TOMBAUGH REGIO</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 86, color: '#fff3e2', letterSpacing: '0.12em', marginTop: 14, textShadow: '0 0 40px rgba(255,220,180,0.7)'}}>汤博区</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: C.ice, letterSpacing: '0.25em', marginTop: 12}}>以发现者克莱德·汤博命名</div>
					<div style={{fontFamily: MONO, fontSize: 13, color: C.iceDim, letterSpacing: '0.3em', marginTop: 12}}>≈ 1,600 KM ACROSS</div>
				</div>
				{label > 0 ? (
					<svg width={1920} height={1080} style={{position: 'absolute', opacity: label}}>
						<path d={`M 560 470 L ${lerp(560, 860, label)} 470 L ${lerp(560, CX - 140, label)} ${lerp(470, hy, label)}`} fill="none" stroke={C.gold} strokeWidth={1.2} strokeOpacity={0.7} />
						<circle cx={CX - 140} cy={hy} r={5} fill={C.goldHot} opacity={label} />
					</svg>
				) : null}
			</AbsoluteFill>
			{heart > 0 ? <Flare x={CX - 10} y={hy} size={30} intensity={beat * 0.9} streak={1.2} rays={false} /> : null}
			{/* —— 音效 —— */}
			<Sfx name="blip_lo" at={4} vol={0.3} />
			<Sfx name="whoosh" at={76} vol={0.5} />
			<Sfx name="impact_soft" at={78} vol={0.3} />
			<Sfx name="scan" at={c1 - 20} vol={0.35} dur={110} />
			<Sfx name="data" at={c1 - 20} vol={0.25} dur={110} />
			<Sfx name="shimmer" at={c1 + 62} vol={0.45} />
			<Sfx name="impact" at={c1 + 62} vol={0.45} />
			<SfxSeq name="heartbeat" vol={0.6} at={Array.from({length: 12}, (_, k) => Math.round(c1 + 9 * (Math.PI / 2 + 2 * Math.PI * (k + 1))) - 2).filter((a) => a < dur - 30)} />
			<Sfx name="blip" at={c1 + 112} vol={0.3} />
		</SceneFrame>
	);
};
