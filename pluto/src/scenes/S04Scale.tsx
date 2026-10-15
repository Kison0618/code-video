import React from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {FxCanvas} from '../fx/Canvas';
import {Flare} from '../fx/Flare';
import {dot, glow, glowPath, rgba, trail} from '../fx/glow';
import {earthColor, moonColor} from '../fx/palettes';
import {drawSphere, fibSphere, plutoColor} from '../fx/sphere';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {C, MONO, RGB, Rgb, SERIF} from "../theme";

/** 历年对冥王星质量的估计（地球 = 1），来源：Wikipedia「Pluto」质量估计表 */
const EST: {y: number; m: number; who: string}[] = [
	{y: 1915, m: 7, who: 'LOWELL · 行星 X'},
	{y: 1931, m: 1, who: 'NICHOLSON & MAYALL'},
	{y: 1948, m: 0.1, who: 'KUIPER'},
	{y: 1976, m: 0.01, who: 'CRUIKSHANK ET AL.'},
	{y: 1978, m: 0.0015, who: 'CHRISTY · 发现卡戎'},
	{y: 2006, m: 0.00218, who: 'BUIE ET AL.'},
];
const GX0 = 300;
const GX1 = 1620;
const GY0 = 330;
const GY1 = 800;
const gx = (y: number) => GX0 + ((y - 1910) / 100) * (GX1 - GX0);
const gy = (m: number) => GY0 + ((1 - Math.log10(m)) / 4) * (GY1 - GY0);

const PL = fibSphere(9000, 'pluto');
const MO = fibSphere(11000, 'moon');
const EA = fibSphere(459, 'earth-beads');
const PL_SMALL = fibSphere(1600, 'pluto-s');

export const S04Scale: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	// A：质量估计曲线
	const graphA = inOut(f, 4, c1 + 6, 16);
	const draw = appear(f, 14, c1 - 30, easeInOut);
	// B：冥王星 vs 月球
	const bIn = appear(f, c1 - 4, 34);
	const bOut = appear(f, c2 - 10, 24, easeInOut);
	const overlay = appear(f, c1 + 66, 50, easeInOut);
	const pct = appear(f, c1 + 90, 30);
	// C：地球 = 459 颗珠子
	const cIn = appear(f, c2 + 2, 36);
	const fly = appear(f, c2 + 50, 50, easeInOut);
	const hit = appear(f, c2 + 98, 16);

	const RP = 170;
	const RM = RP * (3474 / 2377);
	const px = lerp(560, 1260, overlay);
	const pyB = 540;

	// 曲线的点
	const pts: [number, number][] = EST.map((e) => [gx(e.y), gy(e.m)]);
	const segs = pts.length - 1;
	const headT = draw * segs;
	const visible: [number, number][] = [];
	for (let i = 0; i <= segs; i++) {
		if (i <= headT) visible.push(pts[i]);
		else {
			const k = headT - (i - 1);
			if (k > 0) visible.push([lerp(pts[i - 1][0], pts[i][0], k), lerp(pts[i - 1][1], pts[i][1], k)]);
			break;
		}
	}
	const head = visible[visible.length - 1];

	// 飞出的那颗珠子
	const ex = 1240;
	const ey = 540;
	const bx0 = ex - 120;
	const by0 = ey - 90;
	const tx = 470;
	const ty = 600;
	const bez = (t: number): [number, number] => {
		const cx = (bx0 + tx) / 2;
		const cy = Math.min(by0, ty) - 260;
		const u = 1 - t;
		return [u * u * bx0 + 2 * u * t * cx + t * t * tx, u * u * by0 + 2 * u * t * cy + t * t * ty];
	};

	return (
		<SceneFrame {...props} stars={{opacity: 0.5, drift: 0.06}} kicker="SIZE · MASS" hudRight={'PLUTO\nØ 2,377 KM\nM 1.303 × 10²² KG'}>
			<FxCanvas
				draw={(ctx, fr) => {
					// ---------- A：质量估计曲线 ----------
					if (graphA > 0) {
						ctx.globalCompositeOperation = 'source-over';
						for (let k = 1; k >= -3; k--) {
							const y = gy(Math.pow(10, k));
							ctx.globalAlpha = graphA * (k === 0 ? 0.5 : 0.18);
							ctx.strokeStyle = k === 0 ? rgba(RGB.blue, 1) : rgba(RGB.ice, 1);
							ctx.setLineDash(k === 0 ? [] : [2, 8]);
							ctx.lineWidth = 1;
							ctx.beginPath();
							ctx.moveTo(GX0 - 20, y);
							ctx.lineTo(GX0 - 20 + (GX1 - GX0 + 40) * appear(fr, 6 + (1 - k) * 4, 40), y);
							ctx.stroke();
						}
						ctx.setLineDash([]);
						for (let yr = 1910; yr <= 2010; yr += 10) {
							const x = gx(yr);
							ctx.globalAlpha = graphA * 0.25;
							ctx.fillStyle = rgba(RGB.ice, 1);
							ctx.fillRect(x, GY1 + 20, 1, 8);
						}
						ctx.globalCompositeOperation = 'lighter';
						// 曲线下方的光幕
						if (visible.length > 1) {
							const grd = ctx.createLinearGradient(0, GY0, 0, GY1 + 20);
							grd.addColorStop(0, rgba(RGB.gold, 0.16 * graphA));
							grd.addColorStop(1, rgba(RGB.gold, 0));
							ctx.globalAlpha = 1;
							ctx.fillStyle = grd;
							ctx.beginPath();
							ctx.moveTo(visible[0][0], GY1 + 20);
							for (const p of visible) ctx.lineTo(p[0], p[1]);
							ctx.lineTo(head[0], GY1 + 20);
							ctx.closePath();
							ctx.fill();
							glowPath(ctx, visible, RGB.gold, {width: 2.4, a: graphA, bloom: 16});
						}
						pts.forEach((p, i) => {
							if (i > headT + 0.001) return;
							glow(ctx, p[0], p[1], 34, RGB.gold, graphA * 0.8);
							dot(ctx, p[0], p[1], 4, RGB.goldHot, graphA);
						});
						if (draw < 1) {
							glow(ctx, head[0], head[1], 90, RGB.goldHot, graphA * 0.9);
							glow(ctx, head[0], head[1], 20, RGB.white, graphA);
						}
					}
					// ---------- B：冥王星 vs 月球 ----------
					const bA = bIn * (1 - bOut);
					if (bA > 0) {
						const moonA = bA * lerp(1, 0.55, overlay);
						drawSphere(ctx, {cx: 1260, cy: pyB, R: RM, spin: fr * 0.25, tilt: 8, points: MO, color: moonColor, size: 1.15, alpha: moonA, back: 0.03, base: {c: [60, 70, 90], a: 0.5}, rim: {c: RGB.blueHot, a: 0.35},
							scatter: (p) => ({t: Math.min(1, Math.max(0, (bIn * 1.6 - p.j * 0.6))), dx: (p.j - 0.5) * 600, dy: (p.x - 0.2) * 300})});
						drawSphere(ctx, {cx: px, cy: pyB, R: RP, spin: 150 + fr * 0.4, tilt: 20, points: PL, color: plutoColor(0.2), size: 1.15, alpha: bA, base: {c: [80, 50, 36], a: 0.6}, rim: {c: RGB.gold, a: 0.4}});
						// 直径标尺
						const ruler = (x: number, R: number, c: Rgb, a: number, y: number) => {
							glowPath(ctx, [[x - R, y], [x + R, y]], c, {width: 1.4, a, bloom: 8});
							for (const s of [-1, 1]) glowPath(ctx, [[x + s * R, y - 12], [x + s * R, y + 12]], c, {width: 1.4, a, bloom: 6});
						};
						const rA = appear(fr, c1 + 20, 30) * bA;
						ruler(1260, RM, RGB.blue, rA, pyB + RM + 36);
						ruler(px, RP, RGB.gold, rA, lerp(pyB + RP + 36, pyB + RM + 36, overlay) + 0 * overlay);
						if (overlay > 0) {
							// 冥王星外轮廓在月球内发光
							ctx.globalAlpha = 1;
							ctx.strokeStyle = rgba(RGB.goldHot, 0.7 * overlay * bA);
							ctx.lineWidth = 1.5;
							ctx.beginPath();
							ctx.arc(px, pyB, RP + 3, 0, Math.PI * 2);
							ctx.stroke();
							ctx.strokeStyle = rgba(RGB.blueHot, 0.6 * overlay * bA);
							ctx.setLineDash([3, 7]);
							ctx.beginPath();
							ctx.arc(1260, pyB, RM + 3, 0, Math.PI * 2);
							ctx.stroke();
							ctx.setLineDash([]);
						}
					}
					// ---------- C：地球 459 颗珠子 ----------
					if (cIn > 0) {
						drawSphere(ctx, {cx: ex, cy: ey, R: 290, spin: 200 + fr * 0.3, tilt: 18, points: EA, color: earthColor, size: 4.2, round: true, alpha: cIn * (1 - 0.2 * hit), back: 0.12,
							scatter: (p) => ({t: Math.min(1, Math.max(0, cIn * 1.8 - p.j * 0.8)), dx: (p.j - 0.5) * 500, dy: (p.j * 7 % 1 - 0.5) * 500})});
						// 大气辉光
						glow(ctx, ex, ey, 520, RGB.blue, 0.12 * cIn);
						// 冥王星（小）
						const pa = appear(fr, c2 + 20, 30);
						drawSphere(ctx, {cx: tx, cy: ty, R: 54, spin: fr * 0.6, tilt: 20, points: PL_SMALL, color: plutoColor(0.4), size: 1.1, alpha: pa, base: {c: [80, 50, 36], a: 0.6}, rim: {c: RGB.gold, a: 0.5}});
						glow(ctx, tx, ty, 160 * (1 + hit * 0.6), RGB.gold, (0.2 + hit * 0.4 * (1 - appear(fr, c2 + 114, 40))) * pa);
						// 飞行的金珠
						if (fly > 0 && fly < 1) {
							const tr: [number, number][] = [];
							for (let k = 0; k <= 24; k++) tr.push(bez(Math.max(0, fly - 0.3 + (k / 24) * 0.3)));
							ctx.globalCompositeOperation = 'lighter';
							trail(ctx, tr, RGB.gold, 5, 0.9);
							const [hx, hy] = bez(fly);
							glow(ctx, hx, hy, 70, RGB.goldHot, 1);
							dot(ctx, hx, hy, 6, RGB.white, 1);
						} else if (fly === 0 && cIn > 0.6) {
							glow(ctx, bx0, by0, 40 + Math.sin(fr / 4) * 6, RGB.gold, appear(fr, c2 + 30, 16));
							dot(ctx, bx0, by0, 5.5, RGB.goldHot, appear(fr, c2 + 30, 16));
						}
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			<AbsoluteFill>
				{/* A：坐标与标注 */}
				<div style={{position: 'absolute', left: GX0 - 20, top: GY1 + 62, opacity: graphA * 0.8, fontFamily: MONO, fontSize: 13, letterSpacing: '0.28em', color: C.iceDim}}>
					人们对冥王星质量的估计 · ESTIMATED MASS (EARTH = 1)
				</div>
				{[1920, 1950, 1980, 2010].map((yr) => (
					<div key={yr} style={{position: 'absolute', left: gx(yr), top: GY1 + 34, transform: 'translate(-50%,-50%)', opacity: graphA * 0.5, fontFamily: MONO, fontSize: 13, color: C.iceDim}}>
						{yr}
					</div>
				))}
				{[1, 0, -1, -2, -3].map((k) => (
					<div key={k} style={{position: 'absolute', left: GX0 - 36, top: gy(Math.pow(10, k)), transform: 'translate(-100%,-50%)', opacity: graphA * (k === 0 ? 0.95 : 0.55), fontFamily: MONO, fontSize: 14, color: k === 0 ? C.blue : C.iceDim}}>
						{k === 0 ? '地球 1' : k > 0 ? '10' : String(Math.pow(10, k))}
					</div>
				))}
				{EST.map((e, i) => {
					const a = appear(f, 14 + (i / segs) * (c1 - 30 - 14) + 2, 14) * graphA;
					const last = i === EST.length - 1;
					const below = i === 4;
					return (
						<div
							key={e.y}
							style={{
								position: 'absolute',
								left: gx(e.y) + (i === 0 ? 0 : last ? 10 : 0),
								top: gy(e.m) + (below ? 30 : -30),
								transform: `translate(${last ? '0' : i === 4 ? '-90%' : '-30%'}, ${below ? '0' : '-100%'})`,
								opacity: a,
								whiteSpace: 'nowrap',
							}}
						>
							<div style={{fontFamily: MONO, fontSize: 26, color: C.goldHot, textShadow: '0 0 18px rgba(243,196,124,0.7)'}}>{e.y}</div>
							<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.2em', marginTop: 4}}>
								{e.m >= 1 ? `${e.m}` : e.m} M⊕ · {e.who}
							</div>
						</div>
					);
				})}
				<div style={{position: 'absolute', right: 300, top: GY0 - 10, opacity: appear(f, c1 - 40, 20) * graphA, textAlign: 'right'}}>
					<div style={{fontFamily: MONO, fontSize: 64, color: C.goldHot, textShadow: '0 0 30px rgba(243,196,124,0.7)', lineHeight: 1}}>÷ 3000</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: C.ice, letterSpacing: '0.2em', marginTop: 10}}>六十年里，它越“称”越轻</div>
				</div>

				{/* B：直径数值 */}
				{(() => {
					const bA = bIn * (1 - bOut);
					const rA = appear(f, c1 + 26, 24) * bA;
					return (
						<>
							<div style={{position: 'absolute', left: 1260, top: pyB + RM + 70, transform: 'translateX(-50%)', opacity: rA * (1 - overlay), whiteSpace: 'nowrap', textAlign: 'center'}}>
								<span style={{fontFamily: MONO, fontSize: 30, color: C.blueHot, textShadow: '0 0 18px rgba(127,208,255,0.7)'}}>3,474 KM</span>
								<span style={{fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: C.iceDim, letterSpacing: '0.2em', marginLeft: 16}}>月球</span>
							</div>
							<div style={{position: 'absolute', left: 560, top: pyB + RP + 70, transform: 'translateX(-50%)', opacity: rA * (1 - overlay), whiteSpace: 'nowrap', textAlign: 'center'}}>
								<span style={{fontFamily: MONO, fontSize: 30, color: C.goldHot, textShadow: '0 0 18px rgba(243,196,124,0.7)'}}>2,377 KM</span>
								<span style={{fontFamily: SERIF, fontWeight: 600, fontSize: 20, color: C.iceDim, letterSpacing: '0.2em', marginLeft: 16}}>冥王星</span>
							</div>
							<div style={{position: 'absolute', left: 560, top: 470, transform: 'translate(-50%,-50%)', opacity: pct * bA, textAlign: 'center', whiteSpace: 'nowrap'}}>
								<div style={{fontFamily: MONO, fontSize: 170, lineHeight: 1, color: C.goldHot, textShadow: '0 0 40px rgba(243,196,124,0.75), 0 0 120px rgba(243,170,90,0.4)'}}>
									{Math.round(68 * pct)}
									<span style={{fontSize: 80}}>%</span>
								</div>
								<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.ice, letterSpacing: '0.3em', marginTop: 18}}>月球直径的 68%</div>
								<div style={{fontFamily: MONO, fontSize: 12, color: C.iceDim, letterSpacing: '0.35em', marginTop: 10}}>2,377 / 3,474 KM</div>
							</div>
						</>
					);
				})()}

				{/* C：质量 */}
				<div style={{position: 'absolute', left: tx, top: 300, transform: 'translateX(-50%)', opacity: appear(f, c2 + 104, 24), textAlign: 'center', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 120, lineHeight: 1, color: C.goldHot, textShadow: '0 0 40px rgba(243,196,124,0.75)'}}>0.2%</div>
					<div style={{fontFamily: MONO, fontSize: 22, color: C.ice, letterSpacing: '0.3em', marginTop: 12}}>≈ 1 / 459</div>
				</div>
				<div style={{position: 'absolute', left: tx, top: ty + 90, transform: 'translateX(-50%)', opacity: appear(f, c2 + 24, 24), textAlign: 'center', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: C.gold, letterSpacing: '0.25em'}}>冥王星</div>
				</div>
				<div style={{position: 'absolute', left: ex, top: ey + 340, transform: 'translateX(-50%)', opacity: cIn * 0.9, textAlign: 'center', whiteSpace: 'nowrap'}}>
					<span style={{fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: C.blueHot, letterSpacing: '0.25em'}}>地球</span>
					<span style={{fontFamily: MONO, fontSize: 13, color: C.iceDim, letterSpacing: '0.3em', marginLeft: 16}}>= 459 颗珠子</span>
				</div>
			</AbsoluteFill>
			{hit > 0 ? <Flare x={tx} y={ty} size={22} intensity={hit * (1 - appear(f, c2 + 116, 40)) * 1.2} streak={1.4} /> : null}
			{/* —— 音效 —— */}
			<Sfx name="scan" at={14} vol={0.3} dur={c1 - 44} />
			<Sfx name="data" at={14} vol={0.18} dur={c1 - 44} />
			<Sfx name="impact_soft" at={c1 - 38} vol={0.45} />
			<Sfx name="blip" at={c1 - 36} vol={0.3} />
			<Sfx name="whoosh_fast" at={c1 + 4} vol={0.4} />
			<Sfx name="lock" at={c1 + 22} vol={0.35} />
			<Sfx name="whoosh" at={c1 + 90} vol={0.35} />
			<Sfx name="impact_soft" at={c1 + 92} vol={0.4} />
			<Sfx name="ticks" at={c1 + 90} vol={0.22} dur={30} />
			<Sfx name="sparkle" at={c2 + 6} vol={0.3} />
			<Sfx name="bead" at={c2 + 30} vol={0.45} />
			<Sfx name="whoosh_fast" at={c2 + 88} vol={0.45} />
			<Sfx name="impact" at={c2 + 98} vol={0.6} />
			<Sfx name="shimmer" at={c2 + 99} vol={0.45} />
			<Sfx name="blip_lo" at={c2 + 106} vol={0.3} />
		</SceneFrame>
	);
};
