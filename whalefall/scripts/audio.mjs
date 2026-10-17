// 只渲染混音（BGM + 音效），用来检查拼接点和响度：node scripts/audio.mjs → out/mix.mp3
import {bundle} from '@remotion/bundler';
import {renderMedia, selectComposition} from '@remotion/renderer';
import path from 'node:path';

const browserExecutable = process.env.REMOTION_BROWSER || null;
const chromiumOptions = {gl: process.env.GL || 'swiftshader'};
const serveUrl = await bundle({entryPoint: path.resolve('src/index.ts')});
const composition = await selectComposition({serveUrl, id: 'WhaleFall', browserExecutable, chromiumOptions});
await renderMedia({composition, serveUrl, codec: 'mp3', outputLocation: path.resolve('out/mix.mp3'), browserExecutable, chromiumOptions});
console.log('out/mix.mp3');
