import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt} from '../components/SceneFrame';
import {Sfx, SfxSeq, firstFrame} from '../fx/Sfx';
import {FxCanvas} from '../fx/Canvas';
import {Flare} from '../fx/Flare';
import {Glitch} from '../fx/Glitch';
import {Scramble} from '../fx/Scramble';
import {dot, glow, glowPath, rgba, trail} from '../fx/glow';
import {proj} from '../fx/proj';
import {appear, easeInOut, inOut, lerp} from '../lib/anim';
import {plutoAt} from '../lib/orbit';
import {C, MONO, RGB, Rgb, SERIF} from '../theme';

const CRITERIA = [
	{zh: '围绕太阳运行', en: 'ORBITS THE SUN', ok: true},
	{zh: '自身引力使其接近圆球', en: 'NEARLY ROUND', ok: true},
	{zh: '清空轨道附近的区域', en: 'CLEARED ITS NEIGHBOURHOOD', ok: false},
];
const PLANETS: {zh: string; r: number; c: Rgb}[] = [
	{zh: '水星', r: 9, c: [200, 190, 180]},
	{zh: '金星', r: 14, c: [255, 220, 170]},
	{zh: '地球', r: 15, c: [127, 208, 255]},
	{zh: '火星', r: 11, c: [255, 140, 100]},
	{zh: '木星', r: 40, c: [240, 200, 160]},
	{zh: '土星', r: 34, c: [240, 220, 170]},
	{zh: '天王星', r: 24, c: [160, 230, 240]},
	{zh: '海王星', r: 23, c: [110, 160, 255]},
	{zh: '冥王星', r: 6, c: [243, 196, 124]},
];
const NAMED = [
	{zh: '阋神星', en: 'ERIS', a: 67.8, ang: 2.1, z: 0.35},
	{zh: '鸟神星', en: 'MAKEMAKE', a: 45.4, ang: 4.0, z: 0.2},
	{zh: '妊神星', en: 'HAUMEA', a: 43.1, ang: 5.3, z: -0.25},
];

export const S12Verdict: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const c3 = cueAt(scene, 3);
	const c4 = cueAt(scene, 4);
	const dur = scene.duration;
	const dateA = inOut(f, 4, c1 + 8, 18);
	const decode = appear(f, 10, 50);
	const votes = appear(f, 30, 80, easeInOut);
	const cardsA = inOut(f, c1 - 4, c2 + 10, 20);
	const belt = inOut(f, c2 - 10, c3 + 10, 24);
	const beltZoom = appear(f, c2 + 60, 90, easeInOut);
	const row = inOut(f, c3 - 6, c4 + 10, 20);
	const demote = appear(f, c3 + 40, 40, easeInOut);
	const glitchK = Math.max(0, 1 - Math.abs(f - (c3 + 46)) / 16);
	const tl = appear(f, c4 - 4, 24);
	const tlRun = appear(f, c4 + 10, 80, easeInOut);

	const kb = useMemo(
		() =>
			new Array(5200).fill(0).map((_, i) => {
				const res = random(`kb-res-${i}`) < 0.3;
				const a = res ? 39.4 + (random(`kb-a-${i}`) - 0.5) * 1.5 : 42 + random(`kb-a2-${i}`) * 6 + (random(`kb-sc-${i}`) < 0.15 ? random(`kb-x-${i}`) * 25 : 0);
				return {a, ang: random(`kb-g-${i}`) * Math.PI * 2, z: (random(`kb-z-${i}`) - 0.5) * (res ? 0.5 : 0.3) * a, b: random(`kb-b-${i}`), sp: 1 / Math.pow(a, 1.5)};
			}),
		[],
	);
	const ballots = useMemo(() => new Array(424).fill(0).map((_, i) => ({d: random(`bl-${i}`)})), []);

	return (
		<SceneFrame {...props} stars={{opacity: 0.4, drift: 0.04}} kicker="IAU RESOLUTION 5A · 2006" hudRight={'PRAGUE\nXXVI GENERAL ASSEMBLY'}>
			<FxCanvas
				draw={(ctx, fr) => {
					ctx.globalCompositeOperation = 'lighter';
					// ---------- A：选票点阵 ----------
					if (dateA > 0) {
						const cols = 53;
						ballots.forEach((b, i) => {
							const x = 960 - (cols * 22) / 2 + (i % cols) * 22 + 11;
							const y = 640 + Math.floor(i / cols) * 22;
							const on = votes > b.d * 0.9 + (i / ballots.length) * 0.1;
							dot(ctx, x, y, on ? 2.6 : 1.4, on ? RGB.goldHot : RGB.ice, dateA * (on ? 0.95 : 0.2));
							if (on) glow(ctx, x, y, 14, RGB.gold, dateA * 0.35);
						});
					}
					// ---------- C：柯伊伯带 ----------
					if (belt > 0) {
						const cam = {cx: lerp(960, 760, beltZoom), cy: lerp(520, 470, beltZoom), pitch: -lerp(22, 30, beltZoom), yaw: 0, dist: 2600, scale: lerp(1, 2.3, beltZoom)};
						const K = 9;
						const t = fr * 0.25;
						// 太阳与内行星轨道
						const sun = proj(0, 0, 0, cam);
						glow(ctx, sun[0], sun[1], 120, RGB.goldHot, belt * 0.7 * (1 - beltZoom * 0.6));
						for (const r of [5.2, 9.5, 19.2, 30.1]) {
							const pts: [number, number][] = [];
							for (let k = 0; k <= 100; k++) {
								const a = (k / 100) * Math.PI * 2;
								const s = proj(Math.cos(a) * r * K, Math.sin(a) * r * K, 0, cam);
								pts.push([s[0], s[1]]);
							}
							glowPath(ctx, pts, RGB.blue, {width: 0.7, a: belt * 0.4, bloom: 4});
						}
						for (const p of kb) {
							const a = p.ang + t * p.sp * 0.6;
							const s = proj(Math.cos(a) * p.a * K, Math.sin(a) * p.a * K, p.z * K, cam);
							if (s[0] < -20 || s[0] > 1940 || s[1] < -20 || s[1] > 1100) continue;
							const near = Math.min(1.4, 2600 / (2600 + s[2]));
							ctx.globalAlpha = belt * (0.25 + 0.6 * p.b) * near;
							ctx.fillStyle = p.b > 0.92 ? 'rgb(255,228,176)' : 'rgb(190,215,255)';
							const r = (0.6 + p.b * 1.1) * near * lerp(1, 1.4, beltZoom);
							ctx.fillRect(s[0] - r, s[1] - r, r * 2, r * 2);
						}
						// 冥王星
						const pp = plutoAt(2006.6);
						const ps = proj(pp[0] * K, pp[1] * K, pp[2] * K, cam);
						glow(ctx, ps[0], ps[1], 70, RGB.gold, belt);
						dot(ctx, ps[0], ps[1], 4.5, RGB.white, belt);
						ctx.globalAlpha = belt * 0.9;
						ctx.strokeStyle = rgba(RGB.goldHot, 1);
						ctx.lineWidth = 1.2;
						const rr = 26 + Math.sin(fr / 8) * 3;
						for (let q = 0; q < 4; q++) {
							const a = (q * Math.PI) / 2 + fr * 0.02;
							ctx.beginPath();
							ctx.arc(ps[0], ps[1], rr, a, a + 0.9);
							ctx.stroke();
						}
						(ctx as any).__pluto = ps;
						// 邻居
						NAMED.forEach((n) => {
							const s = proj(Math.cos(n.ang) * n.a * K, Math.sin(n.ang) * n.a * K, n.z * n.a * K, cam);
							glow(ctx, s[0], s[1], 30, RGB.blueHot, belt * beltZoom);
							dot(ctx, s[0], s[1], 3, RGB.white, belt * beltZoom);
						});
					}
					// ---------- D：九大行星 ----------
					if (row > 0) {
						PLANETS.forEach((p, i) => {
							const x = 260 + i * 175;
							const isP = i === 8;
							const y = 520 + (isP ? demote * 150 : 0);
							const a = row * appear(fr, c3 - 6 + i * 4, 16) * (isP ? 1 - demote * 0.3 : 1);
							glow(ctx, x, y, p.r * 4.5, p.c, a * 0.5);
							ctx.globalAlpha = a;
							const g = ctx.createRadialGradient(x - p.r * 0.35, y - p.r * 0.35, p.r * 0.1, x, y, p.r);
							g.addColorStop(0, rgba([Math.min(255, p.c[0] + 40), Math.min(255, p.c[1] + 40), Math.min(255, p.c[2] + 40)], 1));
							g.addColorStop(1, rgba([p.c[0] * 0.35, p.c[1] * 0.35, p.c[2] * 0.35], 1));
							ctx.globalCompositeOperation = 'source-over';
							ctx.fillStyle = g;
							ctx.beginPath();
							ctx.arc(x, y, p.r, 0, Math.PI * 2);
							ctx.fill();
							ctx.globalCompositeOperation = 'lighter';
							if (i === 5) {
								ctx.globalAlpha = a * 0.7;
								ctx.strokeStyle = rgba(p.c, 1);
								ctx.lineWidth = 2;
								ctx.beginPath();
								ctx.ellipse(x, y, p.r * 1.8, p.r * 0.45, -0.3, 0, Math.PI * 2);
								ctx.stroke();
							}
						});
						// 连接线
						glowPath(ctx, [[260, 520], [260 + 7 * 175, 520]], RGB.ice, {width: 0.8, a: row * 0.3, bloom: 4});
						glowPath(ctx, [[260 + 7 * 175, 520], [260 + 8 * 175, 520 + demote * 150]], demote > 0.5 ? RGB.red : RGB.ice, {width: 0.8, a: row * 0.4, bloom: 6});
					}
					// ---------- E：217 天 ----------
					if (tl > 0) {
						const x0 = 360;
						const x1 = 1560;
						const y = 560;
						glowPath(ctx, [[x0, y], [x1, y]], RGB.ice, {width: 1, a: tl * 0.35, bloom: 4});
						const hx = lerp(x0, x1, tlRun);
						glowPath(ctx, [[x0, y], [hx, y]], RGB.gold, {width: 2.4, a: tl, bloom: 16});
						for (let d = 0; d <= 217; d += 7) {
							const x = lerp(x0, x1, d / 217);
							dot(ctx, x, y + 22, 1, RGB.ice, tl * (x <= hx ? 0.7 : 0.25));
						}
						const pts: [number, number][] = [];
						for (let k = 0; k <= 20; k++) pts.push([Math.max(x0, hx - 200 + k * 10), y - 80 - Math.sin(((hx - 200 + k * 10 - x0) / (x1 - x0)) * Math.PI) * 40]);
						trail(ctx, pts, RGB.goldHot, 3, tl * (tlRun < 1 ? 1 : 0.5));
						glow(ctx, pts[20][0], pts[20][1], 50, RGB.goldHot, tl);
						glow(ctx, x0, y, 26, RGB.blueHot, tl);
						glow(ctx, x1, y, 40 * appear(fr, c4 + 86, 14), RGB.red, tl);
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			<AbsoluteFill>
				{/* A：日期解码 */}
				<div style={{position: 'absolute', left: 960, top: 380, transform: 'translate(-50%,-50%)', opacity: dateA, textAlign: 'center', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 160, lineHeight: 1, color: C.ice, textShadow: '0 0 40px rgba(212,241,255,0.45)'}}>
						<Scramble text="2006.08.24" t={decode} seed="dt" hot={C.gold} />
					</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 28, color: C.ice, letterSpacing: '0.4em', marginTop: 20, opacity: appear(f, 40, 20)}}>布拉格 · 国际天文学联合会</div>
				</div>
				<div style={{position: 'absolute', left: 960, top: 600, transform: 'translateX(-50%)', opacity: dateA * appear(f, 34, 20), fontFamily: MONO, fontSize: 13, color: C.iceDim, letterSpacing: '0.4em', whiteSpace: 'nowrap'}}>
					≈ {Math.round(424 * votes)} 名天文学家参与了最后的表决
				</div>
				{/* B：三条标准 */}
				{CRITERIA.map((c, i) => {
					const a = appear(f, c1 + 6 + i * 22, 24) * cardsA;
					const mark = appear(f, c1 + 40 + i * 30, 20);
					const sweep = ((f - c1 - i * 22) * 18) % 1200;
					return (
						<div
							key={c.en}
							style={{
								position: 'absolute',
								left: 300,
								top: 290 + i * 150,
								width: 1320,
								height: 118,
								opacity: a,
								transform: `translateX(${(1 - a) * -60}px)`,
								border: `1px solid ${c.ok ? 'rgba(227,236,245,0.18)' : 'rgba(255,84,104,0.45)'}`,
								background: c.ok ? 'linear-gradient(90deg, rgba(127,208,255,0.08), rgba(10,14,24,0.3))' : 'linear-gradient(90deg, rgba(255,84,104,0.14), rgba(10,14,24,0.3))',
								backdropFilter: 'blur(4px)',
								overflow: 'hidden',
								display: 'flex',
								alignItems: 'center',
								padding: '0 40px',
								boxSizing: 'border-box',
								boxShadow: c.ok ? 'none' : `0 0 ${40 * mark}px rgba(255,84,104,0.35)`,
							}}
						>
							<div style={{position: 'absolute', left: sweep - 200, top: 0, width: 200, height: '100%', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.08), rgba(255,255,255,0))'}} />
							<span style={{fontFamily: MONO, fontSize: 40, color: c.ok ? C.gold : C.red, width: 90}}>0{i + 1}</span>
							<div style={{flex: 1}}>
								<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 38, color: C.ice, letterSpacing: '0.12em'}}>{c.zh}</div>
								<div style={{fontFamily: MONO, fontSize: 13, color: C.iceDim, letterSpacing: '0.35em', marginTop: 8}}>{c.en}</div>
							</div>
							<div style={{fontFamily: MONO, fontSize: 13, color: C.iceDim, letterSpacing: '0.3em', marginRight: 26}}>PLUTO</div>
							<Glitch amount={c.ok ? 0 : Math.max(0, 1 - Math.abs(f - (c1 + 100)) / 10)}>
								<div
									style={{
										fontFamily: MONO,
										fontSize: 64,
										width: 70,
										textAlign: 'center',
										color: c.ok ? C.blueHot : C.red,
										opacity: mark,
										transform: `scale(${lerp(1.8, 1, mark)})`,
										textShadow: c.ok ? '0 0 20px rgba(127,208,255,0.8)' : '0 0 30px rgba(255,84,104,0.9)',
									}}
								>
									{c.ok ? '✓' : '×'}
								</div>
							</Glitch>
						</div>
					);
				})}
				{/* C：柯伊伯带 */}
				<div style={{position: 'absolute', right: 110, top: 300, opacity: belt * appear(f, c2 + 20, 20), textAlign: 'right', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>KUIPER BELT · 30–55 AU</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 56, color: C.ice, letterSpacing: '0.12em', marginTop: 14}}>柯伊伯带</div>
					<div style={{fontFamily: MONO, fontSize: 15, color: C.iceDim, letterSpacing: '0.2em', marginTop: 14, lineHeight: 1.9}}>
						直径 &gt; 100 KM 的冰质天体
						<br />
						估计超过 <span style={{color: C.goldHot, fontSize: 26}}>100,000</span> 颗
					</div>
				</div>
				{/* D：从第九大行星到矮行星 */}
				{PLANETS.map((p, i) => {
					const isP = i === 8;
					const a = row * appear(f, c3 - 6 + i * 4, 16);
					return (
						<div key={p.zh} style={{position: 'absolute', left: 260 + i * 175, top: 520 + (isP ? demote * 150 : 0) + 60, transform: 'translateX(-50%)', opacity: a, textAlign: 'center', whiteSpace: 'nowrap'}}>
							<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 18, color: isP ? C.goldHot : C.ice, letterSpacing: '0.15em'}}>{p.zh}</div>
							<div style={{fontFamily: MONO, fontSize: 11, color: C.iceDim, letterSpacing: '0.2em', marginTop: 4, textDecoration: isP && demote > 0.5 ? 'line-through' : 'none'}}>{isP ? 'PLANET IX' : `PLANET ${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'][i]}`}</div>
						</div>
					);
				})}
				<div style={{position: 'absolute', left: 260 + 8 * 175, top: 340, transform: 'translateX(-50%)', opacity: row * demote, textAlign: 'center', whiteSpace: 'nowrap'}}>
					<Glitch amount={glitchK}>
						<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 40, color: C.goldHot, letterSpacing: '0.12em', textShadow: '0 0 20px rgba(243,196,124,0.7)'}}>矮行星</div>
					</Glitch>
					<div style={{fontFamily: MONO, fontSize: 16, color: C.ice, letterSpacing: '0.2em', marginTop: 8}}>
						<Scramble text="(134340) PLUTO" t={appear(f, c3 + 50, 40)} seed="mpc" hot={C.gold} />
					</div>
				</div>
				<div style={{position: 'absolute', left: 260, top: 300, opacity: row * appear(f, c3 + 10, 20), whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.4em'}}>8 PLANETS + DWARF PLANETS</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 48, color: C.ice, letterSpacing: '0.12em', marginTop: 10}}>
						九 <span style={{color: C.iceDim, fontSize: 36}}>→</span> <span style={{color: C.goldHot}}>八</span>
					</div>
				</div>
				{/* E：七个月 */}
				{tl > 0 ? (
					<>
						<div style={{position: 'absolute', left: 960, top: 360, transform: 'translate(-50%,-50%)', opacity: tl, textAlign: 'center', whiteSpace: 'nowrap'}}>
							<div style={{fontFamily: MONO, fontSize: 180, lineHeight: 1, color: C.goldHot, textShadow: '0 0 50px rgba(243,196,124,0.7)'}}>{Math.round(217 * tlRun)}</div>
							<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 26, color: C.ice, letterSpacing: '0.3em', marginTop: 14}}>天 · 新视野号已经在路上</div>
						</div>
						<div style={{position: 'absolute', left: 360, top: 600, transform: 'translateX(-50%)', opacity: tl, textAlign: 'center', whiteSpace: 'nowrap'}}>
							<div style={{fontFamily: MONO, fontSize: 18, color: C.blueHot}}>2006.01.19</div>
							<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: C.iceDim, letterSpacing: '0.2em', marginTop: 6}}>出发 · 去拜访一颗行星</div>
						</div>
						<div style={{position: 'absolute', left: 1560, top: 600, transform: 'translateX(-50%)', opacity: tl * appear(f, c4 + 86, 14), textAlign: 'center', whiteSpace: 'nowrap'}}>
							<div style={{fontFamily: MONO, fontSize: 18, color: '#ffb3bd'}}>2006.08.24</div>
							<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 16, color: C.iceDim, letterSpacing: '0.2em', marginTop: 6}}>目的地被“降级”</div>
						</div>
					</>
				) : null}
			</AbsoluteFill>
			{row > 0 && demote > 0 ? <Flare x={260 + 8 * 175} y={520 + demote * 150} size={14} color="255,120,130" intensity={glitchK * 1.2} streak={2} /> : null}
			{/* —— 音效 —— */}
			<Sfx name="data" at={10} vol={0.3} dur={50} />
			<Sfx name="glitch" at={12} vol={0.2} />
			<Sfx name="lock" at={60} vol={0.35} />
			<Sfx name="ticks" at={30} vol={0.22} dur={80} />
			<SfxSeq name="blip_lo" vol={0.3} at={[0, 1, 2].map((i) => c1 + 8 + i * 22)} rate={(i) => 1 + i * 0.1} />
			<SfxSeq name="chime" vol={0.35} at={[c1 + 42, c1 + 72]} />
			<Sfx name="deny" at={c1 + 102} vol={0.5} />
			<Sfx name="glitch" at={c1 + 102} vol={0.4} />
			<Sfx name="whoosh" at={c2 + 2} vol={0.45} />
			<Sfx name="lock" at={c2 + 30} vol={0.35} />
			<Sfx name="swell" at={c2 + 150} vol={0.3} />
			<SfxSeq name="bead" vol={0.25} at={Array.from({length: 9}, (_, i) => c3 + i * 3)} rate={(i) => 0.8 + i * 0.06} />
			<Sfx name="glitch" at={c3 + 40} vol={0.55} />
			<Sfx name="deny" at={c3 + 46} vol={0.4} />
			<Sfx name="impact" at={c3 + 46} vol={0.55} />
			<Sfx name="blip" at={c4} vol={0.3} />
			<Sfx name="ticks" at={c4 + 10} vol={0.22} dur={80} />
			<Sfx name="lock" at={c4 + 90} vol={0.35} />
		</SceneFrame>
	);
};
