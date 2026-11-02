#!/usr/bin/env node
// ep02 全片 v6：混音 → 多进程渲染画面 → 合成 → 全片解码自检
//   node build.js                 out/第二集_v7.mp4（0 – TL.DUR，必须是真配音时间轴；估算时间轴要加 --est）
//   node build.js --from 0 --to 5 只渲染一段验证，输出 .render-tmp/clip_0-5.mp4
//   --jobs 7                      并行进程数（默认 7）
// 中间文件留在 .render-tmp
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const K = require('./src/core');
const TL = require('./src/timeline');

const R = __dirname, OUT = path.join(R, 'out'), TEMP = path.join(R, '.render-tmp');
const FF = K.FFMPEG;
const PY = 'F:/AI/For AI to use/codex2/AI-Coding-SuperVideos/.venv/Scripts/python.exe';
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const jobs = +(opt('jobs') || 7);

function run(cmd, a) {
  const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: R });
  if (r.status !== 0) { console.error(`\n✗ 失败（退出码 ${r.status}${r.error ? '，' + r.error.message : ''}）：${cmd} ${a.join(' ')}`); process.exit(1); }
}
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(TEMP, { recursive: true });

const clip = opt('from') != null || opt('to') != null;
if (!clip && TL.EST && !args.includes('--est')) { console.error('✗ 现在用的是估算时间轴（没有真配音），不出成片。加 --est 强制。'); process.exit(1); }
const A = +(opt('from') || 0), B = +(opt('to') || TL.DUR);
const FINAL = clip ? path.join(TEMP, `clip_${A}-${B}.mp4`) : path.join(OUT, '第二集_v7.mp4');
console.log('时间轴', TL.FILE, '片长', TL.DUR);

const MIX = path.join(TEMP, 'mix_v7.wav');
run(PY, ['mix_v7.py', MIX]);
const VIDEO = path.join(TEMP, `video_${A}-${B}.mp4`);
console.log(`▶ 渲染画面 1920×1080 ${K.FPS}fps，${A}–${B}s，${jobs} 进程`);
run('node', [path.join('src', 'render_all.js'), VIDEO, String(A), String(B), String(jobs)]);
run(FF, ['-y', '-loglevel', 'error', '-i', VIDEO, '-ss', String(A), '-t', String(B - A), '-i', MIX, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', FINAL]);
run(FF, ['-v', 'error', '-nostdin', '-i', FINAL, '-f', 'null', '-']);
console.log(`✓ ${FINAL}  (${(fs.statSync(FINAL).size / 1048576).toFixed(1)} MB)`);
