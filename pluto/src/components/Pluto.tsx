import React, {useId} from 'react';
import {Img} from 'remotion';
import {PLUTO_DISK, PLUTO_GRID, PLUTO_GRID_SIZE, PLUTO_HEART} from '../assets/plutoTexture';

/**
 * 冥王星（贴图由 scripts/make-pluto-texture.py 程序化生成，参考新视野号 2015 年的经典视角）
 * - 米色/橙褐色基底、北极偏亮
 * - 赤道左侧暗红褐色的“克苏鲁区”
 * - 右下方明亮的“心”（汤博区）：左瓣为光滑的斯普特尼克平原
 *
 * 坐标约定：viewBox -110..110，星球半径 100（即直径 = size × 200/220），四周留出大气光晕空间。
 */
type Props = {
	size: number;
	/** 0..1 心形额外发光 */
	heartGlow?: number;
	/** 兼容旧参数（贴图版本不再使用） */
	spin?: number;
	/** 0..1 大气蓝边 */
	atmosphere?: number;
	/** 0..1 整体变暗（逆光剪影） */
	silhouette?: number;
	style?: React.CSSProperties;
};

export const Pluto: React.FC<Props> = ({size, heartGlow = 0, atmosphere = 0.22, silhouette = 0, style}) => {
	const id = useId().replace(/:/g, '');
	const d = (size * 200) / 220;
	const off = (size - d) / 2;
	return (
		<div style={{position: 'relative', width: size, height: size, ...style}}>
			<svg width={size} height={size} viewBox="-110 -110 220 220" style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<defs>
					<radialGradient id={`rim-${id}`} cx="50%" cy="50%" r="50%">
						<stop offset="90%" stopColor="#8fc6ff" stopOpacity={0} />
						<stop offset="93.5%" stopColor="#8fc6ff" stopOpacity={0.4} />
						<stop offset="100%" stopColor="#8fc6ff" stopOpacity={0} />
					</radialGradient>
				</defs>
				<circle r={108} fill={`url(#rim-${id})`} opacity={atmosphere} />
			</svg>
			<Img src={PLUTO_DISK} style={{position: 'absolute', left: off, top: off, width: d, height: d}} />
			{heartGlow > 0 ? (
				<Img
					src={PLUTO_HEART}
					style={{
						position: 'absolute',
						left: off,
						top: off,
						width: d,
						height: d,
						opacity: heartGlow,
						mixBlendMode: 'screen',
						filter: `blur(${Math.max(2, d * 0.012)}px)`,
					}}
				/>
			) : null}
			{silhouette > 0 ? (
				<div style={{position: 'absolute', left: off - 0.5, top: off - 0.5, width: d + 1, height: d + 1, borderRadius: '50%', background: '#020305', opacity: silhouette}} />
			) : null}
		</div>
	);
};

let grid: Uint8Array | null = null;
const getGrid = () => {
	if (!grid) {
		const bin = atob(PLUTO_GRID);
		grid = new Uint8Array(bin.length);
		for (let i = 0; i < bin.length; i++) grid[i] = bin.charCodeAt(i);
	}
	return grid;
};

/** 用于“像素化/模糊”效果的采样（单位圆坐标 -1..1），与贴图一致 */
export const plutoSample = (x: number, y: number): [number, number, number] | null => {
	if (x * x + y * y > 1) return null;
	const g = getGrid();
	const N = PLUTO_GRID_SIZE;
	const i = Math.min(N - 1, Math.max(0, Math.floor(((x + 1) / 2) * N)));
	const j = Math.min(N - 1, Math.max(0, Math.floor(((y + 1) / 2) * N)));
	const k = (j * N + i) * 4;
	if (g[k + 3] < 8) return null;
	return [g[k], g[k + 1], g[k + 2]];
};
