import {parseMedia} from '@remotion/media-parser';
import {getStaticFiles, staticFile} from 'remotion';
import {SCENES} from '../script';

const EXTS = ['mp3', 'wav', 'm4a', 'aac', 'ogg'];

const exists = async (url: string) => {
	try {
		const res = await fetch(url, {method: 'HEAD'});
		return res.ok;
	} catch {
		return false;
	}
};

const duration = async (src: string): Promise<number | null> => {
	try {
		const r = await parseMedia({
			src,
			fields: {durationInSeconds: true},
			acknowledgeRemotionLicense: true,
		});
		return r.durationInSeconds ?? null;
	} catch (e) {
		console.warn('[pluto] cannot read duration of', src, e);
		return null;
	}
};

const findFile = async (base: string) => {
	// 优先使用 Remotion 提供的 public/ 文件清单（不会产生 404 日志）
	try {
		const files = getStaticFiles();
		if (files.length > 0) {
			for (const ext of EXTS) {
				const hit = files.find((f) => f.name.replace(/\\/g, '/').toLowerCase() === `${base}.${ext}`);
				if (hit) return hit.src;
			}
			return null;
		}
	} catch {
		// ignore, fall back to HEAD probing
	}
	for (const ext of EXTS) {
		const src = staticFile(`${base}.${ext}`);
		if (await exists(src)) return src;
	}
	return null;
};

/** 查找 public/voiceover/<id>.* 与 public/bgm/bgm.*，读取时长 */
export const probeMedia = async () => {
	const voice: Record<string, {src: string; seconds: number} | null> = {};
	await Promise.all(
		SCENES.map(async (s) => {
			const src = await findFile(`voiceover/${s.id}`);
			const sec = src ? await duration(src) : null;
			voice[s.id] = src && sec ? {src, seconds: sec} : null;
		}),
	);
	const bgmSrc = await findFile('bgm/bgm');
	return {voice, bgmSrc};
};
