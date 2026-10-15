import React, {useLayoutEffect, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {HEIGHT, WIDTH} from '../theme';

export type DrawFn = (ctx: CanvasRenderingContext2D, frame: number, w: number, h: number) => void;

/** 每帧重绘的 canvas（自动适配 4K 渲染的 devicePixelRatio） */
export const FxCanvas: React.FC<{draw: DrawFn; width?: number; height?: number; style?: React.CSSProperties}> = ({
	draw,
	width = WIDTH,
	height = HEIGHT,
	style,
}) => {
	const ref = useRef<HTMLCanvasElement>(null);
	const frame = useCurrentFrame();
	const dpr = typeof window !== 'undefined' ? Math.min(2, window.devicePixelRatio || 1) : 1;
	useLayoutEffect(() => {
		const c = ref.current;
		if (!c) return;
		const ctx = c.getContext('2d');
		if (!ctx) return;
		ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		ctx.globalCompositeOperation = 'source-over';
		ctx.globalAlpha = 1;
		ctx.clearRect(0, 0, width, height);
		draw(ctx, frame, width, height);
	});
	return (
		<canvas
			ref={ref}
			width={Math.round(width * dpr)}
			height={Math.round(height * dpr)}
			style={{position: 'absolute', left: 0, top: 0, width, height, ...style}}
		/>
	);
};
