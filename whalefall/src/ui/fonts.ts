import {continueRender, delayRender} from 'remotion';
import {LINES, LABELS, NOTES, TITLE, BIG, END} from '../script';

// 中文字体按字符分片加载。渲染前把全片用到的字都预先加载完，避免首帧回退成别的字体。
const allText = [
	...LINES.map((l) => l.text),
	...LABELS.map((l) => l.zh + l.en),
	...NOTES.map((n) => n.text),
	TITLE.zh, TITLE.en, TITLE.q,
	...BIG.map((b) => b.zh + b.en),
	END.zh, END.dedication, END.refs,
	'0123456789,.%米年公斤吨种万 mkg°C',
	// 场景之上的数字卡、图例、比例尺（scenes/overlays.tsx）
	'吨碳一头40吨的鲸身下50m²海底的“口粮”kg/天盲鳗睡鲨端足类延时几个月到一年半骨中脂质≈体重每副鲸骨平均嗜硫阶段具任何时刻躺在大型遗骸（估算）迁徙路线上的间距近只有工业捕南海中国科学院深海所细菌硫酸盐硫化氢示意',
].join('').replace(/[【】]/g, '');

let started = false;
export function preloadFonts() {
	if (started || typeof document === 'undefined') return;
	started = true;
	const handle = delayRender('fonts');
	const specs = [
		`500 40px "Noto Serif SC"`,
		`700 40px "Noto Serif SC"`,
		`900 40px "Noto Serif SC"`,
		`400 20px "JetBrains Mono"`,
		`500 40px "Barlow Condensed"`,
	];
	Promise.all(specs.map((s) => document.fonts.load(s, allText)))
		.then(() => document.fonts.ready)
		.then(() => continueRender(handle))
		.catch(() => continueRender(handle));
}
