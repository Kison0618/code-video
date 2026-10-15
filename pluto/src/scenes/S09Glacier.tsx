import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {FxCanvas} from '../fx/Canvas';
import {dot, glow, glowPath, rgba} from '../fx/glow';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {C, MONO, RGB, Rgb, SERIF} from '../theme';

type P2 = [number, number];
// 斯普特尼克平原：约 1050 × 800 km 的椭圆（单位：km）
const AX = 525;
const AY = 400;
const NS = 240;

/** 带距离截断的 Voronoi（半平面裁剪） */
const cellsOf = (sites: P2[]) => {
	const out: P2[][] = [];
	for (let i = 0; i < sites.length; i++) {
		const s = sites[i];
		let poly: P2[] = [
			[s[0] - 160, s[1] - 160],
			[s[0] + 160, s[1] - 160],
			[s[0] + 160, s[1] + 160],
			[s[0] - 160, s[1] + 160],
		];
		for (let j = 0; j < sites.length && poly.length; j++) {
			if (j === i) continue;
			const o = sites[j];
			const nx = o[0] - s[0];
			const ny = o[1] - s[1];
			if (nx * nx + ny * ny > 300 * 300) continue;
			const mx = (s[0] + o[0]) / 2;
			const my = (s[1] + o[1]) / 2;
			const side = (p: P2) => (p[0] - mx) * nx + (p[1] - my) * ny;
			const np: P2[] = [];
			for (let k = 0; k < poly.length; k++) {
				const a = poly[k];
				const b = poly[(k + 1) % poly.length];
				const da = side(a);
				const db = side(b);
				if (da <= 0) np.push(a);
				if (da <= 0 !== db <= 0) {
					const t = da / (da - db);
					np.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
				}
			}
			poly = np;
		}
		out.push(poly);
	}
	return out;
};

type Cam = {x: number; y: number; h: number; p: number; F: number};
const view = (cam: Cam, x: number, y: number, z: number): [number, number, number] | null => {
	const p = (cam.p * Math.PI) / 180;
	const dx = x - cam.x;
	const dy = y - cam.y;
	const dz = z - cam.h;
	const Y = dy * Math.sin(p) + dz * Math.cos(p);
	const Z = dy * Math.cos(p) - dz * Math.sin(p);
	if (Z < 5) return null;
	return [960 + (dx * cam.F) / Z, 520 - (Y * cam.F) / Z, Z];
};
// 注：上式中 p=90 为正俯视（Z = -dz），p 越小越平视

const ridgeH = (x: number, y: number) => {
	const d = (y - AY) / 260; // 0..1 越过边缘
	const mask = Math.max(0, Math.sin(Math.min(1, Math.max(0, d)) * Math.PI));
	const n = 0.5 + 0.3 * Math.sin(x * 0.013 + 1.3) + 0.22 * Math.sin(x * 0.031 + y * 0.02) + 0.08 * Math.sin(x * 0.07 - y * 0.05);
	return mask * Math.max(0, n) * Math.max(0, n) * 6; // km
};

export const S09Glacier: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const intro = appear(f, 0, 40, easeInOut);
	const dive = appear(f, c1 - 16, 90, easeInOut);
	const mount = appear(f, c3 - 6, 70, easeInOut);
	const churn = appear(f, c1 + 20, 40);
	const heat = appear(f, c1 + 50, 40) * (1 - appear(f, c3 + 30, 40));
	const crater = inOut(f, c2, c3 + 10, 20);
	const cam: Cam = {
		x: lerp(-170, -40, dive) + mount * 40,
		y: lerp(0, -560, dive) + Math.max(0, f - c1) * 0.3 + mount * 150,
		h: lerp(1500, 240, dive) - mount * 60,
		p: lerp(90, 30, dive) - mount * 8,
		F: 1100,
	};
	const base = useMemo(() => {
		const pts: {x: number; y: number; ph: number; sp: number; r: number; tone: number}[] = [];
		let n = 0;
		while (pts.length < NS && n < 5000) {
			const x = (random(`gx${n}`) * 2 - 1) * AX * 1.05;
			const y = (random(`gy${n}`) * 2 - 1) * AY * 1.05;
			n++;
			if ((x / AX) ** 2 + (y / AY) ** 2 > 1.08) continue;
			pts.push({x, y, ph: random(`gp${n}`) * 6.28, sp: 0.01 + random(`gs${n}`) * 0.012, r: 6 + random(`gr${n}`) * 10, tone: random(`gt${n}`)});
		}
		return pts;
	}, []);
	const sites: P2[] = base.map((b) => [b.x + Math.cos(b.ph + f * b.sp) * b.r * (0.3 + churn), b.y + Math.sin(b.ph + f * b.sp * 0.8) * b.r * (0.3 + churn)]);
	const cells = cellsOf(sites);
	const heatPts = useMemo(() => new Array(700).fill(0).map((_, i) => ({c: Math.floor(random(`hc${i}`) * NS), a: random(`ha${i}`) * 6.28, o: random(`ho${i}`), s: 0.5 + random(`hs${i}`)})), []);

	return (
		<SceneFrame {...props} stars={{opacity: 0.35, drift: 0.02}} tint="rgba(90,140,200,0.16)" kicker="SPUTNIK PLANITIA · N₂ ICE" hudRight={'20°N 180°E\n≈ 1,050 × 800 KM'}>
			<FxCanvas
				draw={(ctx, fr) => {
					const V = (x: number, y: number, z = 0) => view(cam, x, y, z);
					ctx.globalCompositeOperation = 'lighter';
					// 周围地形：透视网格
					const gA = intro * 0.5;
					for (let gx = -1400; gx <= 1400; gx += 70) {
						const pts: P2[] = [];
						for (let gy = -1200; gy <= 1600; gy += 50) {
							const q = V(gx, gy, 0);
							if (q) pts.push([q[0], q[1]]);
						}
						glowPath(ctx, pts, RGB.gold, {width: 0.6, a: gA * 0.25, bloom: 2});
					}
					for (let gy = -1200; gy <= 1600; gy += 70) {
						const pts: P2[] = [];
						for (let gx = -1400; gx <= 1400; gx += 50) {
							const q = V(gx, gy, 0);
							if (q) pts.push([q[0], q[1]]);
						}
						if (pts.length > 1) glowPath(ctx, pts, RGB.gold, {width: 0.6, a: gA * 0.25 * Math.min(1, 900 / Math.abs(gy - cam.y + 1)), bloom: 2});
					}
					// 冰川轮廓（裁剪区域）
					const rim: P2[] = [];
					for (let k = 0; k <= 160; k++) {
						const a = (k / 160) * Math.PI * 2;
						const wob = 1 + 0.05 * Math.sin(a * 5) + 0.03 * Math.sin(a * 11);
						const q = V(Math.cos(a) * AX * wob, Math.sin(a) * AY * wob, 0);
						if (q) rim.push([q[0], q[1]]);
					}
					ctx.save();
					ctx.beginPath();
					rim.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
					ctx.closePath();
					ctx.globalCompositeOperation = 'source-over';
					ctx.globalAlpha = 0.55 * intro;
					ctx.fillStyle = '#0b1626';
					ctx.fill();
					ctx.clip();
					ctx.globalCompositeOperation = 'lighter';
					// 多边形冰块
					const scanY = ((fr * 4) % 1400) - 700;
					cells.forEach((poly, i) => {
						if (poly.length < 3) return;
						const b = base[i];
						const sp: P2[] = [];
						for (const p of poly) {
							const q = V(p[0], p[1], 0);
							if (!q) return;
							sp.push([q[0], q[1]]);
						}
						const near = Math.max(0, 1 - Math.abs(sites[i][1] - scanY) / 90);
						ctx.globalAlpha = intro * (0.05 + b.tone * 0.07 + near * 0.12 + heat * 0.05 * (0.5 + 0.5 * Math.sin(fr * 0.05 + b.ph)));
						ctx.fillStyle = rgba(b.tone > 0.5 ? [200, 230, 255] : [150, 200, 255], 1);
						ctx.beginPath();
						sp.forEach((p, k) => (k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
						ctx.closePath();
						ctx.fill();
						glowPath(ctx, sp, near > 0.2 ? RGB.blueHot : RGB.blue, {width: 0.9, a: intro * (0.35 + near * 0.6 + churn * 0.15), bloom: 6, close: true});
						// 对流中心的热
						if (heat > 0) {
							const q = V(sites[i][0], sites[i][1], 0);
							if (q) glow(ctx, q[0], q[1], (1100 / q[2]) * 26, RGB.gold, heat * (0.25 + 0.2 * Math.sin(fr * 0.06 + b.ph)));
						}
					});
					// 上升的热粒子：中心上涌，边缘冷却下沉
					if (heat > 0) {
						for (const h of heatPts) {
							const s = sites[h.c];
							if (!s) continue;
							const u = (fr * 0.006 * h.s + h.o) % 1;
							const r = u * 38;
							const z = Math.sin(u * Math.PI) * 9;
							const q = V(s[0] + Math.cos(h.a) * r, s[1] + Math.sin(h.a) * r, z);
							if (!q) continue;
							const c: Rgb = [lerp(255, 127, u), lerp(214, 208, u), lerp(150, 255, u)];
							dot(ctx, q[0], q[1], Math.max(0.6, 400 / q[2]), c, heat * Math.sin(u * Math.PI) * 0.9);
						}
					}
					ctx.restore();
					ctx.globalCompositeOperation = 'lighter';
					glowPath(ctx, rim, RGB.gold, {width: 1.6, a: intro * (0.8 - dive * 0.4), bloom: 14, close: true});
					// A：尺寸标注（俯视）
					const dimA = intro * (1 - dive) * appear(fr, 20, 30);
					if (dimA > 0) {
						const a1 = V(-AX, AY + 70, 0), a2 = V(AX, AY + 70, 0), b1 = V(AX + 70, -AY, 0), b2 = V(AX + 70, AY, 0);
						if (a1 && a2 && b1 && b2) {
							glowPath(ctx, [[a1[0], a1[1]], [a2[0], a2[1]]], RGB.goldHot, {width: 1.2, a: dimA, bloom: 8});
							glowPath(ctx, [[b1[0], b1[1]], [b2[0], b2[1]]], RGB.goldHot, {width: 1.2, a: dimA, bloom: 8});
							for (const q of [a1, a2, b1, b2]) glow(ctx, q[0], q[1], 16, RGB.goldHot, dimA);
						}
					}
					// D：水冰山脉（发光线框高度场）
					if (mount > 0) {
						const rows: P2[][] = [];
						for (let gy = AY - 20; gy <= AY + 280; gy += 14) {
							const row: P2[] = [];
							for (let gx = -700; gx <= 700; gx += 14) {
								const h = ridgeH(gx, gy) * mount * 18;
								const q = V(gx, gy, h);
								if (q) row.push([q[0], q[1]]);
							}
							rows.push(row);
						}
						rows.forEach((row, k) => glowPath(ctx, row, k % 3 === 0 ? RGB.blueHot : RGB.ice, {width: 0.8, a: mount * 0.55, bloom: 5}));
						for (let gx = -700; gx <= 700; gx += 28) {
							const col: P2[] = [];
							for (let gy = AY - 20; gy <= AY + 280; gy += 14) {
								const q = V(gx, gy, ridgeH(gx, gy) * mount * 18);
								if (q) col.push([q[0], q[1]]);
							}
							glowPath(ctx, col, RGB.ice, {width: 0.6, a: mount * 0.3, bloom: 3});
						}
						// 峰顶光点
						for (const gx of [-380, -120, 160, 420]) {
							let best = 0, by = AY;
							for (let gy = AY; gy <= AY + 260; gy += 10) {
								const h = ridgeH(gx, gy);
								if (h > best) {
									best = h;
									by = gy;
								}
							}
							const q = V(gx, by, best * mount * 18);
							if (q) glow(ctx, q[0], q[1], 30, RGB.goldHot, mount * 0.8);
						}
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			{/* 文字区压暗，保证可读性 */}
			<AbsoluteFill style={{background: 'linear-gradient(90deg, rgba(3,5,10,0.8) 0%, rgba(3,5,10,0) 36%)', opacity: inOut(f, c1, c3 + 20, 30)}} />
			<AbsoluteFill style={{background: 'linear-gradient(270deg, rgba(3,5,10,0.8) 0%, rgba(3,5,10,0) 36%)', opacity: appear(f, c3 + 10, 30)}} />
			<AbsoluteFill>
				{/* A */}
				<div style={{position: 'absolute', left: 110, top: 380, opacity: intro * (1 - dive), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>NITROGEN ICE GLACIER</div>
					<div style={{fontFamily: MONO, fontSize: 72, color: C.goldHot, textShadow: '0 0 30px rgba(243,196,124,0.7)', marginTop: 12, lineHeight: 1}}>1,050 × 800</div>
					<div style={{fontFamily: MONO, fontSize: 20, color: C.ice, letterSpacing: '0.3em', marginTop: 10}}>KM</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 26, color: C.ice, letterSpacing: '0.25em', marginTop: 26}}>斯普特尼克平原</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: C.iceDim, letterSpacing: '0.25em', marginTop: 10}}>面积超过法国本土</div>
				</div>
				{/* B */}
				<div style={{position: 'absolute', left: 110, top: 300, opacity: inOut(f, c1 + 40, c2 + 4, 20), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>SOLID-STATE CONVECTION</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 54, color: C.ice, letterSpacing: '0.12em', marginTop: 14, textShadow: '0 0 30px rgba(127,208,255,0.5)'}}>冰在翻涌</div>
					<div style={{fontFamily: MONO, fontSize: 15, color: C.iceDim, letterSpacing: '0.2em', marginTop: 14, lineHeight: 1.9}}>
						每块多边形 ≈ 20–30 KM 宽
						<br />
						表面温度 ≈ −230 °C
					</div>
				</div>
				{/* C：0 个陨石坑 */}
				<div style={{position: 'absolute', left: 110, top: 280, opacity: crater, whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>IMPACT CRATERS · 陨石坑</div>
					<div style={{fontFamily: MONO, fontSize: 220, lineHeight: 1, color: C.goldHot, textShadow: '0 0 50px rgba(243,196,124,0.8)', marginTop: 6}}>0</div>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.iceDim, letterSpacing: '0.4em', marginTop: 20}}>SURFACE AGE · 地表年龄</div>
					<div style={{fontFamily: MONO, fontSize: 46, color: C.ice, marginTop: 8}}>
						&lt; 10,000,000 <span style={{fontSize: 20, color: C.iceDim}}>年</span>
					</div>
				</div>
				{/* D */}
				<div style={{position: 'absolute', right: 110, top: 560, opacity: appear(f, c3 + 30, 24), textAlign: 'right', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>WATER-ICE MOUNTAINS</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 54, color: C.ice, letterSpacing: '0.12em', marginTop: 14, textShadow: '0 0 30px rgba(212,241,255,0.5)'}}>水冰山脉</div>
					<div style={{fontFamily: MONO, fontSize: 15, color: C.iceDim, letterSpacing: '0.2em', marginTop: 14, lineHeight: 1.9}}>
						希拉里山 · 丹增山
						<br />
						最高 ≈ 6 KM · 高度夸张 ×20
					</div>
				</div>
			</AbsoluteFill>
			{/* —— 音效 —— */}
			<Sfx name="shimmer" at={10} vol={0.35} />
			<Sfx name="blip" at={40} vol={0.25} />
			<Sfx name="whoosh" at={c1 + 26} vol={0.5} />
			<Sfx name="drone" at={c1 + 10} vol={0.4} fadeIn={30} dur={Math.max(60, c3 + 40 - c1)} rate={0.85} />
			<Sfx name="swell" at={c1 + 70} vol={0.25} />
			<Sfx name="lock" at={c2 + 4} vol={0.4} />
			<Sfx name="impact_soft" at={c2 + 4} vol={0.4} />
			<Sfx name="blip_lo" at={c2 + 24} vol={0.3} />
			<Sfx name="whoosh2" at={c3 + 10} vol={0.35} />
			<Sfx name="impact" at={c3 + 34} vol={0.5} />
			<Sfx name="shimmer" at={c3 + 36} vol={0.35} />
		</SceneFrame>
	);
};
