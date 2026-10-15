import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {FxCanvas} from '../fx/Canvas';
import {dot, glow, glowPath, rgba} from '../fx/glow';
import {charonColor} from '../fx/palettes';
import {proj} from '../fx/proj';
import {drawSphere, fibSphere, plutoColor} from '../fx/sphere';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {C, MONO, RGB, Rgb, SERIF} from '../theme';

const KM = 0.0459; // px / km（缩放 = 1 时）
const SEP = 19596;
const BARY = 2110; // 质心距冥王星中心
const MOONS: {zh: string; en: string; a: number; p: number; ph: number}[] = [
	{zh: '冥卫五', en: 'STYX', a: 42656, p: 20.2, ph: 1.2},
	{zh: '冥卫二', en: 'NIX', a: 48694, p: 24.9, ph: 3.1},
	{zh: '冥卫四', en: 'KERBEROS', a: 57783, p: 32.2, ph: 4.6},
	{zh: '冥卫三', en: 'HYDRA', a: 64738, p: 38.2, ph: 0.3},
];
const PL = fibSphere(3500, 'pluto-11');
const CH = fibSphere(1800, 'charon-11');
const CHB = fibSphere(5000, 'charon-big');

export const S11Charon: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const dur = scene.duration;
	const intro = appear(f, 0, 40, easeInOut);
	const zoom = appear(f, 70, 80, easeInOut);
	const sky = appear(f, c2 - 12, 40, easeInOut);
	const scale = lerp(0.24, 0.84, zoom);
	// 时间（天）：A 快、B 慢
	const days = useMemo(() => {
		let d = 0;
		for (let k = 0; k < f; k++) d += k < c1 ? 0.09 : 0.055;
		return d;
	}, [f, c1]);
	const th = (days / 6.387) * Math.PI * 2;
	const cam = {cx: 960, cy: 470, pitch: -24, yaw: 0, dist: 3000, scale};
	const P = (x: number, y: number) => proj(x * KM, y * KM, 0, cam);
	const pxy: [number, number] = [-Math.cos(th) * BARY, -Math.sin(th) * BARY];
	const cxy: [number, number] = [Math.cos(th) * (SEP - BARY), Math.sin(th) * (SEP - BARY)];
	const pS = P(pxy[0], pxy[1]);
	const cS = P(cxy[0], cxy[1]);
	const kP = 3000 / (3000 + pS[2]);
	const kC = 3000 / (3000 + cS[2]);
	const lock = appear(f, c1, 30);
	const spin = (-th * 180) / Math.PI;
	const trails = useMemo(() => new Array(260).fill(0).map((_, i) => ({r: 60 + Math.pow(random(`st-r${i}`), 0.8) * 1500, a: random(`st-a${i}`) * Math.PI * 2, b: random(`st-b${i}`), w: random(`st-w${i}`) > 0.8})), []);
	const moonLabels = MOONS.map((m) => {
		const a = (days / m.p) * Math.PI * 2 + m.ph;
		return {m, s: P(Math.cos(a) * m.a, Math.sin(a) * m.a)};
	});
	return (
		<SceneFrame {...props} stars={{opacity: lerp(0.45, 0.1, sky), drift: 0.04}} kicker="PLUTO–CHARON · BINARY" hudRight={'SEPARATION 19,596 KM\nPERIOD 6.387 D'}>
			<FxCanvas
				draw={(ctx, fr) => {
					const sysA = intro * (1 - sky);
					ctx.globalCompositeOperation = 'lighter';
					if (sysA > 0) {
						// 外围小卫星轨道
						MOONS.forEach((m, i) => {
							const pts: [number, number][] = [];
							for (let k = 0; k <= 120; k++) {
								const a = (k / 120) * Math.PI * 2;
								const s = P(Math.cos(a) * m.a, Math.sin(a) * m.a);
								pts.push([s[0], s[1]]);
							}
							glowPath(ctx, pts, RGB.ice, {width: 0.8, a: sysA * 0.35 * (1 - zoom * 0.7), bloom: 4});
							const s = moonLabels[i].s;
							glow(ctx, s[0], s[1], 16, RGB.blueHot, sysA * (1 - zoom));
							dot(ctx, s[0], s[1], 2, RGB.white, sysA * (1 - zoom));
						});
						// 冥王星与卡戎绕质心的轨道
						for (const [r, c] of [[BARY, RGB.gold], [SEP - BARY, RGB.blue]] as const) {
							const pts: [number, number][] = [];
							for (let k = 0; k <= 120; k++) {
								const a = (k / 120) * Math.PI * 2;
								const s = P(Math.cos(a) * r, Math.sin(a) * r);
								pts.push([s[0], s[1]]);
							}
							glowPath(ctx, pts, c as Rgb, {width: 1.2, a: sysA * 0.75, bloom: 10});
						}
						// 质心
						const b = P(0, 0);
						ctx.globalAlpha = sysA * zoom * 0.9;
						ctx.strokeStyle = rgba(RGB.goldHot, 1);
						ctx.lineWidth = 1;
						ctx.beginPath();
						ctx.moveTo(b[0] - 12, b[1]);
						ctx.lineTo(b[0] + 12, b[1]);
						ctx.moveTo(b[0], b[1] - 12);
						ctx.lineTo(b[0], b[1] + 12);
						ctx.stroke();
						// 潮汐锁定的光束
						if (lock > 0) {
							glowPath(ctx, [[pS[0], pS[1]], [cS[0], cS[1]]], RGB.gold, {width: 1.2, a: sysA * lock * 0.8, bloom: 14});
							for (let k = 0; k < 8; k++) {
								const t = ((fr * 0.02 + k / 8) % 1);
								glow(ctx, lerp(pS[0], cS[0], t), lerp(pS[1], cS[1], t), 14, RGB.goldHot, sysA * lock * Math.sin(t * Math.PI));
							}
						}
						// 前后遮挡：远的先画
						const drawP = () => {
							drawSphere(ctx, {cx: pS[0], cy: pS[1], R: 1188 * KM * scale * kP * 1.6, spin: spin + 90, tilt: 20, points: PL, color: plutoColor(0.2), size: lerp(0.5, 1.0, zoom), alpha: sysA, base: {c: [70, 44, 32], a: 0.7}, rim: {c: RGB.gold, a: 0.5}});
							glow(ctx, pS[0], pS[1], 130 * scale, RGB.gold, sysA * 0.35);
						};
						const drawC = () => {
							drawSphere(ctx, {cx: cS[0], cy: cS[1], R: 606 * KM * scale * kC * 1.6, spin: spin - 90, tilt: 20, points: CH, color: charonColor, size: lerp(0.5, 1.0, zoom), alpha: sysA, base: {c: [50, 54, 62], a: 0.7}, rim: {c: RGB.blueHot, a: 0.5}});
							glow(ctx, cS[0], cS[1], 80 * scale, RGB.blue, sysA * 0.35);
						};
						if (pS[2] > cS[2]) {
							drawP();
							drawC();
						} else {
							drawC();
							drawP();
						}
					}
					// ---------- C：站在冥王星上看天 ----------
					if (sky > 0) {
						const HZ = 760;
						const pole: [number, number] = [1260, 250];
						const span = Math.max(0, fr - c2) * 0.006; // 弧长（弧度）
						ctx.globalCompositeOperation = 'lighter';
						for (const t of trails) {
							const c: Rgb = t.w ? RGB.goldHot : RGB.blueHot;
							const a0 = t.a + span * 0.2;
							ctx.globalAlpha = sky * (0.15 + 0.5 * t.b);
							ctx.strokeStyle = rgba(c, 1);
							ctx.lineWidth = 0.6 + t.b * 1.2;
							ctx.beginPath();
							ctx.arc(pole[0], pole[1], t.r, a0, a0 + 0.02 + span);
							ctx.stroke();
							const hx = pole[0] + Math.cos(a0 + 0.02 + span) * t.r;
							const hy = pole[1] + Math.sin(a0 + 0.02 + span) * t.r;
							if (hy < HZ) glow(ctx, hx, hy, 4 + t.b * 6, c, sky * t.b * 0.6);
						}
						// 地面（遮住地平线以下的星轨）
						ctx.globalCompositeOperation = 'source-over';
						ctx.globalAlpha = sky;
						const g = ctx.createLinearGradient(0, HZ, 0, 1080);
						g.addColorStop(0, '#0d1220');
						g.addColorStop(1, '#030407');
						ctx.fillStyle = g;
						ctx.fillRect(0, HZ, 1920, 320);
						ctx.globalCompositeOperation = 'lighter';
						// 透视网格地面
						for (let k = -24; k <= 24; k++) {
							const x1 = 960 + k * 160;
							glowPath(ctx, [[960 + k * 8, HZ], [x1, 1080]], RGB.gold, {width: 0.6, a: sky * 0.25, bloom: 3});
						}
						for (let k = 1; k < 14; k++) {
							const y = HZ + Math.pow(k / 14, 2.2) * 320;
							glowPath(ctx, [[0, y], [1920, y]], RGB.gold, {width: 0.6, a: sky * 0.22, bloom: 3});
						}
						glowPath(ctx, [[0, HZ], [1920, HZ]], RGB.blueHot, {width: 1.2, a: sky * 0.7, bloom: 18});
						glow(ctx, 960, HZ, 700, RGB.blue, sky * 0.18);
						// 卡戎：一动不动地挂在天上
						const cx = 640;
						const cy = 380;
						glow(ctx, cx, cy, 380, RGB.blue, sky * 0.25);
						drawSphere(ctx, {cx, cy, R: 120, spin: 0, tilt: 15, points: CHB, color: charonColor, size: 1.1, alpha: sky, base: {c: [50, 54, 62], a: 0.75}, rim: {c: RGB.blueHot, a: 0.6}});
						// 锁定标记
						ctx.globalAlpha = sky * 0.7;
						ctx.strokeStyle = rgba(RGB.gold, 1);
						ctx.lineWidth = 1.2;
						const rr = 160 + Math.sin(fr / 10) * 4;
						for (let q = 0; q < 4; q++) {
							const a = (q * Math.PI) / 2 + Math.PI / 4;
							ctx.beginPath();
							ctx.arc(cx, cy, rr, a - 0.25, a + 0.25);
							ctx.stroke();
						}
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			<AbsoluteFill>
				{/* 卫星名 */}
				{moonLabels.map(({m, s}) => (
					<div key={m.en} style={{position: 'absolute', left: s[0] + 12, top: s[1] - 8, opacity: intro * (1 - zoom), whiteSpace: 'nowrap', fontFamily: MONO, fontSize: 12, letterSpacing: '0.2em', color: C.iceDim}}>
						<span style={{fontFamily: SERIF, fontWeight: 600, fontSize: 15, color: C.ice}}>{m.zh}</span> {m.en}
					</div>
				))}
				<div style={{position: 'absolute', left: 110, top: 360, opacity: inOut(f, 16, 112, 16), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 150, lineHeight: 1, color: C.goldHot, textShadow: '0 0 40px rgba(243,196,124,0.7)'}}>5</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.ice, letterSpacing: '0.25em', marginTop: 14}}>颗卫星</div>
					<div style={{fontFamily: MONO, fontSize: 13, color: C.iceDim, letterSpacing: '0.3em', marginTop: 10}}>CHARON · STYX · NIX · KERBEROS · HYDRA</div>
				</div>
				<div style={{position: 'absolute', left: 110, top: 360, opacity: inOut(f, 104, c1 + 6, 16), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 150, lineHeight: 1, color: C.blueHot, textShadow: '0 0 40px rgba(127,208,255,0.7)'}}>51%</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.ice, letterSpacing: '0.25em', marginTop: 14}}>卡戎直径 · 冥王星的一半多</div>
					<div style={{fontFamily: MONO, fontSize: 13, color: C.iceDim, letterSpacing: '0.3em', marginTop: 10}}>1,212 KM / 2,377 KM · 天体尺寸 ×1.6</div>
				</div>
				{/* 卡戎、冥王星标签 */}
				<div style={{position: 'absolute', left: cS[0], top: cS[1] + 60, transform: 'translateX(-50%)', opacity: zoom * (1 - sky) * intro, whiteSpace: 'nowrap', textAlign: 'center'}}>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 18, color: C.blueHot, letterSpacing: '0.2em'}}>卡戎</div>
				</div>
				<div style={{position: 'absolute', left: pS[0], top: pS[1] + 100, transform: 'translateX(-50%)', opacity: zoom * (1 - sky) * intro, whiteSpace: 'nowrap', textAlign: 'center'}}>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 18, color: C.goldHot, letterSpacing: '0.2em'}}>冥王星</div>
				</div>
				{/* B：潮汐锁定 */}
				<div style={{position: 'absolute', left: 110, top: 330, opacity: inOut(f, c1 + 10, c2 + 4, 20), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>MUTUAL TIDAL LOCK</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 52, color: C.ice, letterSpacing: '0.12em', marginTop: 14}}>彼此锁定</div>
					<div style={{fontFamily: MONO, fontSize: 64, color: C.goldHot, textShadow: '0 0 30px rgba(243,196,124,0.7)', marginTop: 18}}>
						{(days % 6.387).toFixed(2)}
						<span style={{fontSize: 22, color: C.iceDim}}> / 6.39 天</span>
					</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 18, color: C.iceDim, letterSpacing: '0.2em', marginTop: 10}}>自转 = 公转 · 两颗星都是</div>
				</div>
				{/* C */}
				<div style={{position: 'absolute', left: 640, top: 560, transform: 'translateX(-50%)', opacity: appear(f, c2 + 30, 30), textAlign: 'center', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 26, color: C.blueHot, letterSpacing: '0.3em', textShadow: '0 0 20px rgba(127,208,255,0.6)'}}>卡戎 · 永不落下</div>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.3em', marginTop: 8}}>≈ 7 × 地球上看到的满月</div>
				</div>
				<div style={{position: 'absolute', right: 110, top: 600, opacity: appear(f, c2 + 40, 30), textAlign: 'right', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.35em'}}>TIME-LAPSE · 延时</div>
					<div style={{fontFamily: MONO, fontSize: 44, color: C.ice, marginTop: 6}}>
						T + {(Math.max(0, f - c2) * 0.035).toFixed(2)} <span style={{fontSize: 18, color: C.iceDim}}>天</span>
					</div>
				</div>
			</AbsoluteFill>
		</SceneFrame>
	);
};
