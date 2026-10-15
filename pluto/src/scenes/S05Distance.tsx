import React, {useMemo} from 'react';
import {AbsoluteFill, random, useCurrentFrame} from 'remotion';
import {SceneFrame, SceneProps, cueAt, cueEnd} from '../components/SceneFrame';
import {FxCanvas} from '../fx/Canvas';
import {Flare} from '../fx/Flare';
import {dot, glow, glowPath, rgba, trail} from '../fx/glow';
import {appear, easeInOut, fmtInt, inOut, lerp, pad2} from '../lib/anim';
import {C, MONO, RGB, Rgb, SERIF} from '../theme';

const SX = 170;
const PX = 1750;
const LY = 640;
/** 平均日距（AU）与光行时（小时） */
const PLANETS: {zh: string; en: string; au: number; c: Rgb; lt: string}[] = [
	{zh: '地球', en: 'EARTH', au: 1, c: RGB.blue, lt: '8 分 20 秒'},
	{zh: '木星', en: 'JUPITER', au: 5.2, c: [240, 200, 160], lt: '43 分'},
	{zh: '土星', en: 'SATURN', au: 9.54, c: [240, 220, 170], lt: '1.3 小时'},
	{zh: '天王星', en: 'URANUS', au: 19.2, c: [160, 230, 240], lt: '2.7 小时'},
	{zh: '海王星', en: 'NEPTUNE', au: 30.1, c: RGB.blue, lt: '4.2 小时'},
	{zh: '冥王星', en: 'PLUTO', au: 39.5, c: RGB.gold, lt: '5.5 小时'},
];
const ax = (au: number) => SX + (au / 39.5) * (PX - SX);

export const S05Distance: React.FC<SceneProps> = (props) => {
	const {scene} = props;
	const f = useCurrentFrame();
	const c1 = cueAt(scene, 1);
	const c2 = cueAt(scene, 2);
	const e1 = cueEnd(scene, 1);
	const lineA = inOut(f, 6, c2 + 12, 18);
	const lineDraw = appear(f, 8, 50, easeInOut);
	const count = appear(f, 14, 70, easeInOut);
	// 光子：从 c1 到 e1 走完全程
	const ph = Math.min(1, Math.max(0, (f - c1 - 6) / Math.max(30, e1 - c1 - 6)));
	const phE = ph; // 匀速（光速）
	const hours = phE * 5.48;
	const noon = appear(f, c2 - 2, 30, easeInOut);
	const dusk = appear(f, c2 + 140, 50, easeInOut);
	const dust = useMemo(() => new Array(140).fill(0).map((_, i) => ({x: random(`d5x${i}`), y: random(`d5y${i}`), v: random(`d5v${i}`)})), []);

	const photonX = lerp(SX, PX, phE);
	return (
		<SceneFrame {...props} stars={{opacity: lerp(0.6, 0.15, noon), drift: 0.08}} kicker="5.9 × 10⁹ KM" hudRight={'MEAN DISTANCE\n39.5 AU\nLIGHT TIME 5 H 28 MIN'}>
			{/* ---------- C：两个正午 ---------- */}
			{noon > 0 ? (
				<AbsoluteFill style={{opacity: noon}}>
					<div style={{position: 'absolute', left: 0, top: 0, width: 960, height: 1080, background: 'linear-gradient(180deg, rgba(90,150,220,0.55) 0%, rgba(170,200,230,0.45) 52%, rgba(255,226,180,0.55) 66%, rgba(30,24,20,0.9) 66.2%, rgba(5,6,10,1) 100%)'}} />
					<div
						style={{
							position: 'absolute',
							left: 960,
							top: 0,
							width: 960,
							height: 1080,
							background: 'linear-gradient(180deg, rgba(6,10,28,1) 0%, rgba(22,30,70,0.95) 40%, rgba(90,70,110,0.75) 58%, rgba(220,130,90,0.55) 66%, rgba(16,12,14,0.95) 66.2%, rgba(4,5,8,1) 100%)',
						}}
					/>
				</AbsoluteFill>
			) : null}
			<FxCanvas
				draw={(ctx, fr) => {
					ctx.globalCompositeOperation = 'lighter';
					if (lineA > 0) {
						// 太阳系主轴
						const xe = lerp(SX, PX, lineDraw);
						glowPath(ctx, [[SX, LY], [xe, LY]], RGB.ice, {width: 1, a: 0.35 * lineA, bloom: 6});
						for (let au = 5; au <= 40; au += 5) {
							const x = ax(au);
							if (x > xe) break;
							ctx.globalAlpha = 0.3 * lineA;
							ctx.fillStyle = rgba(RGB.ice, 1);
							ctx.fillRect(x, LY + 14, 1, 10);
						}
						// 尘埃
						for (const d of dust) {
							const x = SX + d.x * (PX - SX);
							const y = LY + (d.y - 0.5) * 70 * (1 - Math.abs(d.y - 0.5));
							if (x > xe) continue;
							dot(ctx, x, y, 0.8, RGB.ice, 0.25 * lineA * d.v);
						}
						// 行星
						PLANETS.forEach((p, i) => {
							const x = ax(p.au);
							const a = appear(fr, 14 + i * 7, 20) * lineA;
							const passed = phE >= (x - SX) / (PX - SX) && phE > 0;
							const pulse = passed ? Math.max(0, 1 - (fr - (c1 + 6 + ((x - SX) / (PX - SX)) * (e1 - c1 - 6))) / 25) : 0;
							const big = i === 5 ? 1.6 : 1;
							glow(ctx, x, LY, (26 + pulse * 70) * big, p.c, a * (0.6 + pulse));
							dot(ctx, x, LY, 3.5 * big, i === 5 ? RGB.goldHot : RGB.white, a);
							if (pulse > 0) {
								ctx.globalAlpha = pulse * a;
								ctx.strokeStyle = rgba(p.c, 1);
								ctx.lineWidth = 1.5;
								ctx.beginPath();
								ctx.arc(x, LY, 10 + (1 - pulse) * 60, 0, Math.PI * 2);
								ctx.stroke();
							}
						});
						// 太阳
						glow(ctx, SX, LY, 160, RGB.goldHot, 0.9 * lineA);
						glow(ctx, SX, LY, 40, RGB.white, lineA);
						// 光子
						if (ph > 0 && ph < 1) {
							const tr: [number, number][] = [];
							for (let k = 0; k <= 30; k++) tr.push([Math.max(SX, photonX - 260 + k * (260 / 30)), LY]);
							trail(ctx, tr, RGB.goldHot, 4, 1);
							glow(ctx, photonX, LY, 80, RGB.goldHot, 1);
							glow(ctx, photonX, LY, 18, RGB.white, 1);
						}
					}
					// 黄昏的冥王星天空：微弱的星
					if (noon > 0) {
						for (let i = 0; i < 90; i++) {
							const x = 960 + random(`ns${i}`) * 960;
							const y = random(`ny${i}`) * 520;
							dot(ctx, x, y, 0.9 + random(`nr${i}`), RGB.ice, noon * (0.3 + 0.5 * random(`nb${i}`)) * (0.6 + 0.4 * Math.sin(fr / 9 + i)));
						}
						// 地平线发光
						glowPath(ctx, [[0, 713], [1920, 713]], RGB.goldHot, {width: 1.2, a: 0.6 * noon, bloom: 14});
						// 照度条
						const barA = appear(fr, c2 + 40, 40, easeInOut);
						glowPath(ctx, [[140, 820], [140 + 680 * barA, 820]], RGB.goldHot, {width: 6, a: noon, bloom: 22});
						const rx = 1100 + Math.max(2, (680 / 1600) * barA);
						glowPath(ctx, [[1100, 820], [rx, 820]], RGB.gold, {width: 6, a: noon, bloom: 22});
						glow(ctx, 1100, 820, 30, RGB.gold, noon * barA);
						// 中线
						glowPath(ctx, [[960, 160], [960, 860]], RGB.ice, {width: 1, a: 0.3 * noon, bloom: 6});
					}
					ctx.globalAlpha = 1;
					ctx.globalCompositeOperation = 'source-over';
				}}
			/>
			{noon > 0 ? (
				<>
					<Flare x={480} y={330} size={90} intensity={noon * 1.3} streak={1.6} />
					<Flare x={480} y={330} size={30} color="255,255,255" intensity={noon} streak={0} rays={false} />
					<Flare x={1440} y={430} size={9} color="255,236,210" intensity={noon * 0.9} streak={2.2} />
				</>
			) : null}
			<AbsoluteFill>
				{/* A：距离计数 */}
				<div style={{position: 'absolute', left: 960, top: 360, transform: 'translate(-50%,-50%)', opacity: lineA * (1 - appear(f, c1 - 4, 20)), textAlign: 'center', whiteSpace: 'nowrap'}}>
					<div style={{fontFamily: MONO, fontSize: 112, color: C.goldHot, textShadow: '0 0 40px rgba(243,196,124,0.6)', lineHeight: 1, letterSpacing: '0.02em'}}>
						{fmtInt(Math.round(5906380000 * count / 10000) * 10000)}
						<span style={{fontSize: 40, marginLeft: 18, color: C.gold}}>KM</span>
					</div>
					<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 24, color: C.ice, letterSpacing: '0.3em', marginTop: 22}}>到太阳的平均距离 · 地日距离的 39.5 倍</div>
				</div>
				{/* B：光行时钟 */}
				{(() => {
					const a = inOut(f, c1 - 2, c2 + 6, 16);
					if (a <= 0) return null;
					const h = Math.floor(hours);
					const m = Math.floor((hours - h) * 60);
					const s = Math.floor(((hours - h) * 60 - m) * 60);
					return (
						<div style={{position: 'absolute', left: 960, top: 360, transform: 'translate(-50%,-50%)', opacity: a, textAlign: 'center', whiteSpace: 'nowrap'}}>
							<div style={{fontFamily: MONO, fontSize: 14, color: C.gold, letterSpacing: '0.5em', marginBottom: 18}}>LIGHT TRAVEL TIME · 光行时</div>
							<div style={{fontFamily: MONO, fontSize: 132, color: C.ice, textShadow: '0 0 40px rgba(212,241,255,0.45)', lineHeight: 1}}>
								{pad2(h)}
								<span style={{color: C.gold, opacity: f % 30 < 15 ? 1 : 0.35}}>:</span>
								{pad2(m)}
								<span style={{color: C.gold, opacity: f % 30 < 15 ? 1 : 0.35}}>:</span>
								<span style={{color: C.iceDim}}>{pad2(s)}</span>
							</div>
						</div>
					);
				})()}
				{/* 行星标签 */}
				{PLANETS.map((p, i) => {
					const x = ax(p.au);
					const a = appear(f, 20 + i * 7, 20) * lineA;
					const passT = (x - SX) / (PX - SX);
					const lt = appear(f, c1 + 6 + passT * (e1 - c1 - 6), 12) * lineA;
					const crowd = i < 3;
					return (
						<React.Fragment key={p.en}>
							<div style={{position: 'absolute', left: x, top: LY - (crowd ? 46 + i * 40 : 46), transform: 'translate(-50%,-100%)', opacity: a, textAlign: 'center', whiteSpace: 'nowrap'}}>
								<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: i === 5 ? 26 : 18, color: i === 5 ? C.goldHot : C.ice, letterSpacing: '0.16em', textShadow: i === 5 ? '0 0 16px rgba(243,196,124,0.7)' : 'none'}}>{p.zh}</div>
								<div style={{fontFamily: MONO, fontSize: 10, color: C.iceDim, letterSpacing: '0.24em', marginTop: 4}}>{p.en} · {p.au} AU</div>
							</div>
							{crowd ? <div style={{position: 'absolute', left: x, top: LY - 40 - i * 40, width: 1, height: 30 + i * 40, background: 'rgba(227,236,245,0.18)', opacity: a}} /> : null}
							<div style={{position: 'absolute', left: x, top: LY + 44 + (crowd ? i * 30 : 0), transform: 'translateX(-50%)', opacity: lt * (1 - noon), fontFamily: MONO, fontSize: i === 5 ? 22 : 14, color: i === 5 ? C.goldHot : C.gold, whiteSpace: 'nowrap', textShadow: '0 0 12px rgba(243,196,124,0.6)'}}>
								{p.lt}
							</div>
						</React.Fragment>
					);
				})}
				<div style={{position: 'absolute', left: SX - 16, top: LY + 40, transform: 'translateX(-100%)', opacity: lineA * appear(f, 10, 20), fontFamily: SERIF, fontWeight: 600, fontSize: 18, color: C.goldHot, letterSpacing: '0.2em'}}>太阳</div>

				{/* C：两个正午 */}
				{noon > 0 ? (
					<>
						<div style={{position: 'absolute', left: 140, top: 760, opacity: noon, whiteSpace: 'nowrap'}}>
							<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 26, color: '#fff7ea', letterSpacing: '0.25em'}}>地球 · 正午</div>
						</div>
						<div style={{position: 'absolute', left: 820, top: 850, transform: 'translateX(-100%)', opacity: appear(f, c2 + 60, 20), fontFamily: MONO, fontSize: 30, color: C.goldHot, whiteSpace: 'nowrap', textShadow: '0 0 16px rgba(243,196,124,0.6)'}}>
							≈ 100,000 LUX
						</div>
						<div style={{position: 'absolute', left: 1100, top: 760, opacity: noon, whiteSpace: 'nowrap'}}>
							<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 26, color: C.ice, letterSpacing: '0.25em'}}>冥王星 · 正午</div>
						</div>
						<div style={{position: 'absolute', left: 1130, top: 850, opacity: appear(f, c2 + 70, 20), fontFamily: MONO, fontSize: 30, color: C.gold, whiteSpace: 'nowrap', textShadow: '0 0 16px rgba(243,196,124,0.6)'}}>
							≈ 60 LUX
						</div>
						<div style={{position: 'absolute', left: 960, top: 560, transform: 'translate(-50%,-50%)', opacity: appear(f, c2 + 90, 30), textAlign: 'center', whiteSpace: 'nowrap'}}>
							<div
								style={{
									fontFamily: MONO,
									fontSize: 120,
									lineHeight: 1,
									color: '#fff',
									padding: '18px 34px',
									background: 'rgba(5,8,16,0.55)',
									border: '1px solid rgba(243,196,124,0.4)',
									backdropFilter: 'blur(6px)',
									textShadow: '0 0 30px rgba(243,196,124,0.8)',
								}}
							>
								1<span style={{color: C.gold}}>/</span>1600
							</div>
						</div>
						<div style={{position: 'absolute', left: 1440, top: 480, transform: 'translateX(-50%)', opacity: dusk, textAlign: 'center', whiteSpace: 'nowrap'}}>
							<div style={{fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: '#ffd9b8', letterSpacing: '0.25em'}}>≈ 地球上日落后的黄昏</div>
							<div style={{fontFamily: MONO, fontSize: 11, color: C.iceDim, letterSpacing: '0.3em', marginTop: 8}}>“PLUTO TIME”</div>
						</div>
					</>
				) : null}
			</AbsoluteFill>
		</SceneFrame>
	);
};
