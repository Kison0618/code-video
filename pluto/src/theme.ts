export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;

export const C = {
	bg: '#03050a',
	bg2: '#070b14',
	ice: '#e3ecf5',
	iceDim: 'rgba(227,236,245,0.62)',
	iceFaint: 'rgba(227,236,245,0.22)',
	iceGhost: 'rgba(227,236,245,0.08)',
	amber: '#f3c47c',
	amberHot: '#ffe4b0',
	amberDim: 'rgba(243,196,124,0.45)',
	gold: '#f3c47c',
	goldHot: '#ffe4b0',
	blue: '#7fd0ff',
	blueHot: '#d4f1ff',
	heart: '#f7f0e6',
	haze: '#8fc6ff',
	red: '#ff5468',
	plate: '#c9cdd0',
	plateInk: '#15181d',
};

export const SERIF = '"Pluto Serif", "Noto Serif SC", "Noto Serif CJK SC", "Source Han Serif SC", "Songti SC", "STSong", serif';
export const MONO = '"Pluto Mono", "JetBrains Mono", "SF Mono", Menlo, Consolas, monospace';

/** RGB 元组，供 canvas 发光精灵使用 */
export const RGB = {
	gold: [243, 196, 124] as const,
	goldHot: [255, 228, 176] as const,
	ice: [227, 236, 245] as const,
	blue: [127, 208, 255] as const,
	blueHot: [212, 241, 255] as const,
	red: [255, 84, 104] as const,
	white: [255, 255, 255] as const,
};
export type Rgb = readonly [number, number, number];
