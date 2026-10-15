// 打印每个配音文件需要朗读的文本：node scripts/print-voiceover.mjs
import {readFileSync} from 'node:fs';
const src = readFileSync(new URL('../src/script.ts', import.meta.url), 'utf8');
const blocks = src.split(/\n\t\{\n\t\tid: '/).slice(1);
for (const b of blocks) {
	const id = b.slice(0, b.indexOf("'"));
	const zh = [...b.matchAll(/zh: '([^']+)'/g)].map((m) => m[1]).filter((t, i) => !(i === 0 && b.includes('chapter: {') && b.indexOf(`zh: '${t}'`) < b.indexOf('lines')));
	console.log(`public/voiceover/${id}.mp3\n${zh.join('')}\n`);
}
