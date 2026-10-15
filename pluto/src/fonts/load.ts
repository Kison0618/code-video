import {loadFont} from '@remotion/fonts';
import {MONO_400} from './mono';
import {SERIF_200} from './serif200';
import {SERIF_300} from './serif300';
import {SERIF_400} from './serif400';

// 内嵌的子集字体（思源宋体 / Noto Serif CJK SC + Liberation Mono），保证任何电脑渲染效果一致。
// loadFont 内部会 delayRender，字体就绪后才开始渲染。
const fonts: [string, string, string][] = [
	['Pluto Serif', SERIF_200, '200'],
	['Pluto Serif', SERIF_300, '300'],
	['Pluto Serif', SERIF_400, '400'],
	['Pluto Mono', MONO_400, '400'],
];

for (const [family, url, weight] of fonts) {
	loadFont({family, url, weight, format: 'woff'}).catch((e) => console.warn('[pluto] font load failed', family, weight, e));
}
