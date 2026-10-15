/** 简单 3D 相机：先绕 Y 轴 yaw，再绕 X 轴 pitch，透视投影到屏幕 */
export type Cam = {cx: number; cy: number; pitch: number; yaw?: number; dist?: number; scale?: number};

export const proj = (x: number, y: number, z: number, cam: Cam): [number, number, number] => {
	const yaw = ((cam.yaw ?? 0) * Math.PI) / 180;
	const pitch = (cam.pitch * Math.PI) / 180;
	const x1 = x * Math.cos(yaw) - y * Math.sin(yaw);
	const y1 = x * Math.sin(yaw) + y * Math.cos(yaw);
	// 轨道平面 = xy，z 向上；pitch=90 为正俯视
	const yy = y1 * Math.sin(pitch) - z * Math.cos(pitch);
	const depth = y1 * Math.cos(pitch) + z * Math.sin(pitch);
	const dist = cam.dist ?? 2400;
	const k = dist / (dist + depth);
	const s = cam.scale ?? 1;
	return [cam.cx + x1 * k * s, cam.cy + yy * k * s, depth];
};
