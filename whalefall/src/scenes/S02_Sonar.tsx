// 22.4 – 28.0：1987 年，阿尔文号的侧扫声呐扫到一副骨架（琥珀色单色声呐图）
import React, {useLayoutEffect, useMemo, useRef} from 'react';
import {useCurrentFrame} from 'remotion';
import {sec, prog, easeOut} from '../lib/time';
import {skeletonGeometry, sampleSurface} from '../three/whaleGeo';
import {mulberry32} from '../lib/rand';
import {FONT} from '../ui/theme';

const W = 1920, H = 1080;

export const S02Sonar: React.FC = () => {
	const t = sec(useCurrentFrame());
	const ref = useRef<HTMLCanvasElement>(null);
	const pts = useMemo(() => {
		const g = skeletonGeometry(18, 7);
		return sampleSurface(g, 9000, 4, 1).points; // 俯视投影
	}, []);
	const noise = useMemo(() => {
		const r = mulberry32(99);
		return new Float32Array(26000).map(() => r());
	}, []);
	useLayoutEffect(() => {
		const c = ref.current!;
		const g = c.getContext('2d')!;
		g.fillStyle = '#050302';
		g.fillRect(0, 0, W, H);
		// 声呐图：从左往右一行行扫出来（侧扫声呐的“瀑布图”）
		const sweep = easeOut(prog(t, 22.5, 26.4));
		const sx = 160 + sweep * (W - 320);
		const cx = W / 2, cy = H / 2 + 20, scale = 52;
		// 海底回波噪声
		for (let i = 0; i < noise.length; i += 2) {
			const x = 160 + noise[i] * (W - 320);
			if (x > sx) continue;
			const y = 150 + noise[i + 1] * (H - 330);
			const v = noise[(i * 7) % noise.length];
			g.fillStyle = `rgba(255, ${150 + v * 60}, 60, ${0.05 + v * 0.18})`;
			g.fillRect(x, y, 2 + v * 3, 1.5);
		}
		// 骨架的强回波
		for (let i = 0; i < pts.length; i += 3) {
			const x = cx + pts[i] * scale;
			const y = cy + pts[i + 2] * scale;
			if (x > sx) continue;
			const k = (pts[i + 1] + 0.2) * 2;
			g.fillStyle = `rgba(255, ${190 + 50 * Math.min(1, k)}, 120, ${0.35 + 0.4 * Math.min(1, k)})`;
			g.fillRect(x, y, 2.2, 2.2);
			// 声影：骨头后面是一道暗影（声呐图的特征）
			g.fillStyle = 'rgba(0,0,0,0.25)';
			g.fillRect(x + 3, y + 3, 6, 2);
		}
		// 扫描线
		if (sweep < 1) {
			const grd = g.createLinearGradient(sx - 120, 0, sx, 0);
			grd.addColorStop(0, 'rgba(255,170,80,0)');
			grd.addColorStop(1, 'rgba(255,190,110,0.35)');
			g.fillStyle = grd;
			g.fillRect(sx - 120, 150, 120, H - 330);
			g.fillStyle = 'rgba(255,220,160,0.9)';
			g.fillRect(sx, 150, 2, H - 330);
		}
		// 量程刻度
		g.strokeStyle = 'rgba(255,190,120,0.35)';
		g.lineWidth = 1;
		g.strokeRect(160, 150, W - 320, H - 330);
		g.font = `16px ${FONT.mono}`;
		g.fillStyle = 'rgba(255,200,140,0.7)';
		for (let k = 0; k <= 10; k++) {
			const x = 160 + (k / 10) * (W - 320);
			g.fillRect(x, H - 182, 1, 8);
			g.fillText(`${k * 3} m`, x + 4, H - 160);
		}
		// 识别框
		const box = prog(t, 26.0, 26.6);
		if (box > 0) {
			g.strokeStyle = `rgba(255, 230, 170, ${box})`;
			g.lineWidth = 2;
			const bw = 18 * scale + 60, bh = 7 * scale;
			g.strokeRect(cx - bw / 2, cy - bh / 2, bw, bh);
			g.fillStyle = `rgba(255, 230, 170, ${box})`;
			g.font = `20px ${FONT.mono}`;
			g.fillText('TARGET · ~20 m', cx - bw / 2, cy - bh / 2 - 12);
		}
	});
	return (
		<div style={{position: 'absolute', inset: 0, background: '#050302'}}>
			<canvas ref={ref} width={W} height={H} style={{position: 'absolute', inset: 0}} />
			<div style={{position: 'absolute', right: 160, top: 112, fontFamily: FONT.mono, fontSize: 16, color: 'rgba(255,200,140,0.75)', letterSpacing: 1.5}}>SIDE-SCAN SONAR · 1987.11</div>
		</div>
	);
};
