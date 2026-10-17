// BGM 时间网格：reference-videos/BGM.m4a，112.9 BPM，一小节 2.126 秒（见 study/比特心语拆解）。
// 全片的段落、片名、翻转都挂在这几个时刻上。

export const FPS = 30;
export const DURATION = 160; // 秒
export const BEAT = 60 / 112.9;
export const BAR = BEAT * 4;
const PHASE = 0.04;

/** 第 n 小节开始的时刻（视频时间，秒） */
export const bar = (n: number) => PHASE + n * BAR;

export const FILTER1 = bar(5); // 10.67 高频被滤掉，憋着
export const DROP1 = bar(8); // 17.05 第一次落点：片名
export const BREAK = bar(36); // 76.57 能量降下来
export const FILTER2 = bar(41); // 87.20 再次滤掉
export const DROP2 = bar(44); // 93.57 第二次落点：翻转
export const LOOP_AT = bar(61); // 129.70 视频在这里接回 BGM 的第 47 小节，把最后一段再放一遍
export const LOOP_FROM = bar(47); // 99.95（BGM 文件里的时间）

export const sec = (frame: number) => frame / FPS;
export const fr = (s: number) => Math.round(s * FPS);

export const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
/** t 在 [a,b] 里的进度 0..1 */
export const prog = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const smooth = (x: number) => x * x * (3 - 2 * x);
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);
export const easeInOut = (x: number) => {
	x = clamp(x);
	return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
/** 淡入淡出窗口：a→a+fi 渐入，b-fo→b 渐出 */
export const window01 = (t: number, a: number, b: number, fi = 0.5, fo = 0.5) =>
	Math.min(prog(t, a, a + fi), 1 - prog(t, b - fo, b));
