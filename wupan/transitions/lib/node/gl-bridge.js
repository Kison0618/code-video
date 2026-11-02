/* skia-canvas 管线用的 WebGL 桥：Node 里没有 WebGL，就借一个无头 Chrome 当离屏 GPU。
 *
 *   const { createGLBridge } = require('./lib/node/gl-bridge');
 *   const gb = await createGLBridge({ width: 1920, height: 1080 });
 *   const px = await gb.frame(canvasA, canvasB, 'moran', p, { seed: 0.37, time: 0, fromKey: 'A', toKey: 'B' });
 *   ctx.putImageData(gb.toImageData(px, ImageData), 0, 0);    // 再在上面画字幕、HUD……
 *   await gb.close();
 *
 * from/to：skia-canvas 的 Canvas（取 toBufferSync('raw')），或 { width, height, data } RGBA 自上而下。
 * fromKey/toKey：给了 key 且之前上传过，就不再上传（静态图只传一次）；不给 key 则每帧都上传（动态画面）。
 * 返回 { width, height, data: Buffer }，RGBA 自上而下，可直接 putImageData 或喂给 ffmpeg -f rawvideo -pix_fmt rgba。
 *
 * 依赖：npm i playwright-core；本机 Chrome（默认 channel 'chrome'，或 opts.executablePath / 环境变量 SHANHE_CHROME）。
 * 没有独显时 Chrome 会退到 SwiftShader（CPU），结果相同、慢很多。
 */
'use strict';
const fs = require('fs');
const path = require('path');

const LIB = path.resolve(__dirname, '..');

function rgbaOf(src) {
  if (src && src.data && src.width && src.height) return { width: src.width, height: src.height, data: Buffer.from(src.data.buffer, src.data.byteOffset, src.data.byteLength) };
  if (src && typeof src.toBufferSync === 'function') {
    return { width: src.width, height: src.height, data: src.toBufferSync('raw', { colorType: 'rgba' }) };
  }
  throw new Error('gl-bridge: unsupported source (want skia-canvas Canvas or {width,height,data})');
}

async function createGLBridge(opts = {}) {
  const { chromium } = require('playwright-core');
  const width = opts.width || 1920, height = opts.height || 1080;
  const args = ['--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'];
  if (process.platform === 'win32') args.push('--use-angle=d3d11');
  const exe = opts.executablePath || process.env.SHANHE_CHROME;
  const browser = await require('./chrome').launchChrome('gl-bridge', { ...opts, args });
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.setContent('<!doctype html><canvas id="c"></canvas>');
  const files = [path.join(LIB, 'runner.js')].concat(
    fs.readdirSync(path.join(LIB, 'transitions')).filter((f) => /^\d\d_.+\.js$/.test(f)).sort().map((f) => path.join(LIB, 'transitions', f)))
    .concat(fs.existsSync(path.join(LIB, 'transitions', 'picks.js')) ? [path.join(LIB, 'transitions', 'picks.js')] : []);
  for (const f of files) await page.addScriptTag({ content: fs.readFileSync(f, 'utf8') });
  const info = await page.evaluate(([w, h]) => {
    const c = document.getElementById('c'); c.width = w; c.height = h;
    const R = ShanheRunner.create(c);
    const srcs = {};
    window.__up = async (key, w2, h2, b64) => {
      const buf = new Uint8Array(await (await fetch('data:application/octet-stream;base64,' + b64)).arrayBuffer());
      if (srcs[key]) R.release(srcs[key]);
      srcs[key] = { width: w2, height: h2, data: buf };
    };
    window.__frame = async (fk, tk, id, p, o) => {
      R.frame(srcs[fk], srcs[tk], id, p, o);
      const px = R.readPixels().data;
      return await new Promise((res) => { const fr = new FileReader(); fr.onload = () => res(fr.result.slice(fr.result.indexOf(',') + 1)); fr.readAsDataURL(new Blob([px])); });
    };
    const gl = R.gl, e = gl.getExtension('WEBGL_debug_renderer_info');
    return { ids: Object.keys(ShanheTransitions), renderer: e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) };
  }, [width, height]);

  const uploaded = new Set();
  let auto = 0;
  async function upload(src, key) {
    if (key && uploaded.has(key)) return key;
    const k = key || '__auto' + (auto++ % 2);
    const r = rgbaOf(src);
    await page.evaluate(([k2, w, h, b]) => window.__up(k2, w, h, b), [k, r.width, r.height, r.data.toString('base64')]);
    if (key) uploaded.add(key);
    return k;
  }
  async function frame(from, to, id, p, o = {}) {
    const fk = await upload(from, o.fromKey);
    const tk = await upload(to, o.toKey);
    const u = { seed: o.seed == null ? 0.37 : o.seed, time: o.time || 0, grain: o.grain || 0, vignette: o.vignette || 0, fit: o.fit, fromXf: o.fromXf, toXf: o.toXf, focus: o.focus, dir: o.dir };
    const b64 = await page.evaluate(([a, b, i, pp, uu]) => window.__frame(a, b, i, pp, uu), [fk, tk, id, p, u]);
    if (errors.length) throw new Error('gl-bridge page error: ' + errors.join('; '));
    return { width, height, data: Buffer.from(b64, 'base64') };
  }
  function toImageData(px, ImageDataCtor) {
    return new ImageDataCtor(new Uint8ClampedArray(px.data.buffer, px.data.byteOffset, px.data.length), px.width, px.height);
  }
  function forget(key) { uploaded.delete(key); }
  return { frame, toImageData, forget, close: () => browser.close(), renderer: info.renderer, ids: info.ids, width, height };
}

module.exports = { createGLBridge };
