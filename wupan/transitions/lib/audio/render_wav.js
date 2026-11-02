#!/usr/bin/env node
/* 离线导出转场音效 WAV（借无头 Chrome 的 OfflineAudioContext；Node 本身没有 Web Audio）
 *   node lib/audio/render_wav.js <输出目录> <id>[:时长[:种子]] ...
 *   例：node lib/audio/render_wav.js out/sfx moran:3 yinzhang:3:2 sizhi:1.6
 * 每个参数输出 <输出目录>/<id>_<时长>_s<种子>.wav（48 kHz 立体声 16-bit），音效从 0.05 秒开始，后面留 2.5 秒混响尾巴。
 * 也可以 require：const { renderWavs } = require('./lib/audio/render_wav'); await renderWavs(dir, [{ id, dur, seed }])
 */
'use strict';
const fs = require('fs');
const path = require('path');

function wavName(j) { return `${j.id}_${(+j.dur).toFixed(2)}_s${j.seed == null ? 1 : j.seed}.wav`; }

async function renderWavs(dir, jobs, opts = {}) {
  const { chromium } = require('playwright-core');
  fs.mkdirSync(dir, { recursive: true });
  const exe = opts.executablePath || process.env.SHANHE_CHROME;
  const br = await require('../node/chrome').launchChrome('audio', { ...opts, args: ['--autoplay-policy=no-user-gesture-required'] });
  const pg = await br.newPage();
  const errs = [];
  pg.on('pageerror', (e) => errs.push(String(e)));
  await pg.setContent('<!doctype html><title>sfx</title>');
  await pg.addScriptTag({ content: fs.readFileSync(path.join(__dirname, 'shanhe-audio.js'), 'utf8') });
  const out = [];
  for (const j of jobs) {
    const b64 = await pg.evaluate(async ([id, dur, seed, tail]) => {
      const b = await ShanheAudio.renderTransition(id, { dur, seed, tail });
      const u8 = new Uint8Array(ShanheAudio.toWav(b));
      let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000));
      return btoa(s);
    }, [j.id, +j.dur, j.seed == null ? 1 : +j.seed, j.tail == null ? 2.5 : +j.tail]);
    const f = path.join(dir, wavName(j));
    fs.writeFileSync(f, Buffer.from(b64, 'base64'));
    out.push(f);
  }
  await br.close();
  if (errs.length) throw new Error('audio page error: ' + errs.join('; '));
  return out;
}

module.exports = { renderWavs, wavName };

if (require.main === module) {
  const [dir, ...specs] = process.argv.slice(2);
  if (!dir || !specs.length) { console.error('用法：node lib/audio/render_wav.js <输出目录> <id>[:时长[:种子]] ...'); process.exit(1); }
  const jobs = specs.map((s) => { const [id, dur, seed] = s.split(':'); return { id, dur: dur ? +dur : 2.4, seed: seed ? +seed : 1 }; });
  renderWavs(dir, jobs).then((fs_) => fs_.forEach((f) => console.log(f))).catch((e) => { console.error(e); process.exit(1); });
}
