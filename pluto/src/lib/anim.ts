import {Easing, interpolate} from 'remotion';

export const easeOut = Easing.bezier(0.22, 1, 0.36, 1);
export const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);

/** 0→1 from `start` over `len` frames, eased. */
export const appear = (frame: number, start: number, len = 20, ease = easeOut) =>
	interpolate(frame, [start, start + len], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing: ease,
	});

/** 1→0 from `start` over `len` frames. */
export const vanish = (frame: number, start: number, len = 20) => 1 - appear(frame, start, len, easeInOut);

/** Visible between in and out with fades. */
export const inOut = (frame: number, inAt: number, outAt: number, fade = 18) =>
	Math.min(appear(frame, inAt, fade), vanish(frame, outAt - fade, fade));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const fmtInt = (n: number) => Math.round(n).toLocaleString('en-US');

export const pad2 = (n: number) => String(Math.floor(n)).padStart(2, '0');
