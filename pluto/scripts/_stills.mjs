import {bundle} from '@remotion/bundler';
import {renderStill, selectComposition} from '@remotion/renderer';
import path from 'node:path';
const frames = process.argv.slice(2).map(Number);
const root = path.resolve(import.meta.dirname, '..');
const serveUrl = await bundle({entryPoint: path.join(root, 'src/index.ts'), publicDir: path.join(root, 'public')});
const comp = await selectComposition({serveUrl, id: 'Pluto', inputProps: {}});
for (const fr of frames) {
	await renderStill({serveUrl, composition: comp, frame: fr, output: path.join(root, `out/f${fr}.jpg`), imageFormat: 'jpeg', scale: 0.5, inputProps: {}});
	console.log('ok', fr);
}
