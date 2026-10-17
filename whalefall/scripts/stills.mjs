// 抽帧自查：node scripts/stills.mjs 2 9 12.5 16 19   （参数是秒）
// 输出 out/stills/t<秒>.jpg，再拼成一张 out/stills/sheet.jpg
import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import {execSync} from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const times = process.argv.slice(2).map(Number);
const gl = process.env.GL || 'swiftshader';
const browserExecutable = process.env.REMOTION_BROWSER || null;
const outDir = path.resolve('out/stills');
fs.mkdirSync(outDir, {recursive: true});
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const comp = await selectComposition({serveUrl, id: 'WhaleFall', browserExecutable, chromiumOptions: {gl}});
const files = [];
for (const t of times) {
	const f = path.join(outDir, `t${t}.jpg`);
	await renderStill({composition: comp, serveUrl, frame: Math.round(t * comp.fps), output: f, imageFormat: 'jpeg', jpegQuality: 90, browserExecutable, chromiumOptions: {gl}});
	files.push(f);
	console.log('ok', t);
}
if (files.length > 1) {
	const cols = Math.min(3, files.length);
	const inputs = files.map((f) => `-i "${f}"`).join(' ');
	const n = files.length;
	const rows = Math.ceil(n / cols);
	const pads = files.map((_, i) => `[${i}:v]scale=640:-1,drawtext=text='${times[i]}s':x=8:y=8:fontsize=26:fontcolor=yellow:box=1:boxcolor=black@0.6[v${i}]`).join(';');
	const layout = files.map((_, i) => `${(i % cols) * 640}_${Math.floor(i / cols) * 360}`).join('|');
	execSync(`ffmpeg -nostdin -v error -y ${inputs} -filter_complex "${pads};${files.map((_, i) => `[v${i}]`).join('')}xstack=inputs=${n}:layout=${layout}:fill=black" -frames:v 1 "${path.join(outDir, 'sheet.jpg')}"`);
	console.log('sheet', rows, 'x', cols);
}
