import React from 'react';
import {useCurrentFrame} from 'remotion';
import {Counter, DepthGauge} from '../ui/Hud';
import {C, FONT} from '../ui/theme';
import {sec, window01, bar} from '../lib/time';
import {depthAt} from './S01_Descent';

/** 场景之上的 HTML 层：深度计、数字卡、图例 */
export const SceneOverlays: React.FC = () => {
	const t = sec(useCurrentFrame());
	const R = 150; // 右侧数字卡的边距
	return (
		<>
			<DepthGauge t={t} t0={5.2} t1={16.6} depth={depthAt(t)} />
			{/* 2 吨碳 → 2000 年 */}
			<Counter t={t} t0={38.6} t1={41.0} from={0} to={2} decimals={1} unit="吨碳" caption="一头 40 吨的鲸 · Smith & Baco 2003" x={R} y={250} align="right" color={C.amber} />
			<Counter t={t} t0={41.0} t1={bar(20) + 0.5} from={0} to={2000} unit="年" caption="身下 50 m² 海底的“口粮”" x={R} y={250} align="right" color={C.amber} />
			{/* 一天 40–60 公斤 */}
			<Counter t={t} t0={49.0} t1={51.3} from={0} to={60} unit="kg / 天" caption="40 – 60 kg · 盲鳗、睡鲨、端足类" x={R} y={250} align="right" />
			{/* 延时：第几天 */}
			<Counter t={t} t0={51.4} t1={54.9} from={1} to={540} dur={3.0} unit="天" caption="延时 · 几个月到一年半" x={R} y={250} align="right" />
			{/* 鲸骨里的油 */}
			<Counter t={t} t0={74.7} t1={76.4} from={0} to={6} unit="%" caption="骨中脂质 ≈ 体重的 4 – 6%" x={R} y={250} align="right" color={C.amber} />
			{/* 185 种 / 50–100 年 */}
			<Counter t={t} t0={104.5} t1={106.5} from={0} to={185} unit="种" caption="每副鲸骨平均 · Baco & Smith 2003" x={R} y={250} align="right" color={C.teal} />
			<Counter t={t} t0={106.7} t1={bar(51) - 0.1} from={0} to={100} unit="年" caption="嗜硫阶段 · 50 – 100 年" x={R} y={250} align="right" color={C.teal} />
			{/* 69 万 / 12 km / 290 万 */}
			<Counter t={t} t0={109.0} t1={112.3} from={0} to={690000} unit="具" caption="任何时刻躺在海底的大型鲸遗骸（估算）" x={R} y={230} align="right" color={C.teal} size={104} />
			<Counter t={t} t0={112.5} t1={115.2} from={0} to={12} unit="km" caption="迁徙路线上的平均间距 · 近的只有 5 km" x={R} y={230} align="right" color={C.teal} size={104} />
			<Counter t={t} t0={119.5} t1={bar(59) - 0.1} from={0} to={2900000} dur={3.4} unit="头" caption="1900 – 1999 工业捕鲸 · Rocha et al. 2014" x={R} y={230} align="right" color="#ff8f7a" size={104} />
			{/* 南海 1600 米 */}
			<Counter t={t} t0={125.8} t1={131.0} from={0} to={1600} unit="m" caption="南海 · 2020 · 中国科学院深海所" x={R} y={250} align="right" />
			{/* 显微镜下的图例 */}
			<MolLegend a={window01(t, 78.0, 88.5, 0.6, 0.8)} />
			{/* 12 km 比例尺 */}
			<ScaleBar a={window01(t, 112.5, 119.3, 0.5, 0.5)} />
		</>
	);
};

const MolLegend: React.FC<{a: number}> = ({a}) => {
	if (a <= 0) return null;
	const item = (c: string, zh: string, en: string) => (
		<div style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
			<div style={{width: 14, height: 14, borderRadius: 7, background: c, boxShadow: `0 0 10px ${c}`}} />
			<span style={{fontFamily: FONT.serif, fontWeight: 700, fontSize: 22, color: C.text}}>{zh}</span>
			<span style={{fontFamily: FONT.mono, fontSize: 16, color: C.sub}}>{en}</span>
		</div>
	);
	return (
		<div style={{position: 'absolute', right: 150, top: 250, opacity: a}}>
			{item('#9fd9c8', '细菌', 'SULFATE-REDUCING BACTERIA')}
			{item('#e0584a', '硫酸盐', 'SO₄²⁻')}
			{item('#f2d64b', '硫化氢', 'H₂S')}
		</div>
	);
};

const ScaleBar: React.FC<{a: number}> = ({a}) => {
	if (a <= 0) return null;
	return (
		<div style={{position: 'absolute', left: 150, bottom: 210, opacity: a, fontFamily: FONT.mono, fontSize: 16, color: C.sub}}>
			<div style={{width: 120, height: 2, background: C.teal, boxShadow: `0 0 8px ${C.teal}`}} />
			<div style={{marginTop: 8}}>≈ 12 km（示意）</div>
		</div>
	);
};
