#!/usr/bin/env node
// 第一集：多进程渲染画面 → 截取配音 → 合成成片
//   node build.js                        完整一集 out/第一集_v1.mp4（0 – 203.83s；同名已存在会停下，加 --version v2）
//   node build.js --part first           前 1 分钟 out/前1分钟_v2.mp4（0 – 014 开口前）
//   node build.js --from 0 --to 5        只渲染一段（带声音）验证管线，输出 .render-tmp/clip_0-5.mp4
//   --jobs 7                             并行进程数（默认 7）
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const K = require('./src/core');
const TL = require('./src/timeline');

const R = __dirname, OUT = path.join(R, 'out'), TEMP = path.join(R, '.render-tmp');
const FF = K.FFMPEG;
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const jobs = +(opt('jobs') || 7);
const part = opt('part') || 'full';
const ver = opt('version') || (part === 'first' ? 'v2' : 'v1');

function run(cmd, a) {
  const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: R });
  if (r.status !== 0) { console.error(`\n✗ 失败（退出码 ${r.status}${r.error ? '，' + r.error.message : ''}）：${cmd} ${a.join(' ')}`); process.exit(1); }
}
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TEMP, { recursive: true });

const clip = opt('from') != null || opt('to') != null;
const A = +(opt('from') || 0), B = +(opt('to') || (part === 'first' ? TL.FIRST : TL.DUR));
const FINAL = clip ? path.join(TEMP, `clip_${A}-${B}.mp4`) : path.join(OUT, part === 'first' ? `前1分钟_${ver}.mp4` : `第一集_${ver}.mp4`);
if (!clip && fs.existsSync(FINAL)) { console.error(`✗ ${FINAL} 已存在。加 --version v2`); process.exit(1); }

// 1) 声音：整段配音的 A–B 秒，结尾 0.3 秒淡出（本段不加 BGM、音效）
const WAV = path.join(TEMP, `voice_${A}-${B}.wav`);
run(FF, ['-y', '-loglevel', 'error', '-ss', String(A), '-t', String(B - A), '-i', TL.AUDIO, '-af', `afade=t=out:st=${(B - A - 0.3).toFixed(2)}:d=0.3`, '-ar', '48000', '-ac', '2', WAV]);
// 2) 画面
const VIDEO = path.join(TEMP, `video_${A}-${B}.mp4`);
console.log(`▶ 渲染画面 1920×1080 ${K.FPS}fps，${A}–${B}s，${jobs} 进程`);
run('node', [path.join('src', 'render_all.js'), VIDEO, String(A), String(B), String(jobs)]);
// 3) 合成 + 解码自检
run(FF, ['-y', '-loglevel', 'error', '-i', VIDEO, '-i', WAV, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', FINAL]);
run(FF, ['-v', 'error', '-nostdin', '-i', FINAL, '-f', 'null', '-']);
fs.rmSync(VIDEO); fs.rmSync(WAV);
if (!clip) fs.rmSync(TEMP, { recursive: true, force: true });
console.log(`✓ ${FINAL}  (${(fs.statSync(FINAL).size / 1048576).toFixed(1)} MB)`);
