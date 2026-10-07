#!/usr/bin/env node
// 《生命之美》一键构建：安装依赖 → 预计算 → 合成音频 → 渲染画面 → 响度标准化 → 合成成片
// 用法：
//   node build.js                  完整构建
//   node build.js --only audio     只重做音频（改了配乐后用）
//   node build.js --only video     只重渲画面
//   node build.js --only mux       只重新合成（音画都已存在时）
//   node build.js --from 160 --to 200   只渲染一段画面（用来快速看效果，输出 out/clip_160-200.mp4）
//   node build.js --jobs 6          指定并行进程数（默认 = CPU 核数，最多 8）
//   node build.js --version v2      成片文件名里的版本号（默认 v1，不会覆盖旧版本）
'use strict';
const { spawnSync, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { OUT_DURATION } = require('./render/src/timeline');

const ROOT = __dirname;
const R = path.join(ROOT, 'render');
const OUT = path.join(R, 'out');
const CACHE = path.join(R, 'cache');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const only = opt('only');
const jobs = +(opt('jobs') || Math.min(8, os.cpus().length));   // NVENC 消费级显卡最多同时 8 路
const ver = opt('version') || 'v1';

function run(cmd, a, o = {}) {
  console.log(`\n$ ${cmd} ${a.join(' ')}`);
  const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: o.cwd || R, shell: o.shell || false });
  if (r.status !== 0) { console.error(`\n✗ 失败：${cmd}`); process.exit(1); }
}
function has(cmd, a = ['--version']) {
  try { return spawnSync(cmd, a, { stdio: 'ignore', shell: process.platform === 'win32' }).status === 0; } catch { return false; }
}
const pyOk = p => { try { return spawnSync(p, ['-c', 'import sys; assert sys.version_info >= (3, 9)'], { stdio: 'ignore' }).status === 0; } catch { return false; } };
// 可用环境变量 PYTHON 指定解释器（例如已装好 numpy 的 conda）
const PY = [process.env.PYTHON, 'python3', 'python'].find(p => p && pyOk(p)) || null;

// —— 0. 检查环境 ——
if (!has('ffmpeg', ['-version'])) { console.error('✗ 没找到 ffmpeg，请先安装并加入 PATH'); process.exit(1); }
if (!PY) { console.error('✗ 没找到 Python 3'); process.exit(1); }
if (spawnSync(PY, ['-c', 'import numpy, scipy'], { stdio: 'ignore' }).status !== 0) {
  console.log(`（${PY} 缺少 numpy/scipy，尝试安装；若失败可设置环境变量 PYTHON 指向已装好的解释器）`);
  run(PY, ['-m', 'pip', 'install', 'numpy', 'scipy']);
}
if (!fs.existsSync(path.join(R, 'node_modules', 'skia-canvas'))) run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund'], { shell: process.platform === 'win32' });
fs.mkdirSync(OUT, { recursive: true });
// 有 NVIDIA 显卡时用 NVENC 编码，CPU 只负责画帧（--cpu-encode 强制用 x264）
if (!args.includes('--cpu-encode') && spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=s=256x256:d=0.1', '-c:v', 'h264_nvenc', '-f', 'null', '-'], { stdio: 'ignore' }).status === 0) {
  process.env.LIFE_ENC = 'nvenc';
  console.log('▶ 检测到 NVIDIA 显卡：画面用 NVENC 编码');
}
fs.mkdirSync(CACHE, { recursive: true });

// —— 1. 时间轴（画面和音频共用）——
const tlJson = execFileSync('node', [path.join(R, 'src', 'timeline.js')], { cwd: R });
fs.writeFileSync(path.join(CACHE, 'timeline.json'), tlJson);

// —— 2. 图灵斑纹预计算（约 2–5 分钟，只做一次）——
if (!fs.existsSync(path.join(CACHE, 'rd.bin')) && only !== 'audio' && only !== 'mux') {
  console.log('\n▶ 预计算图灵斑纹（只需一次）');
  run(PY, ['rd_precompute.py']);
}

const VIDEO = path.join(OUT, 'video.mp4');
const AUDIO_RAW = path.join(OUT, 'audio_raw.wav');
const AUDIO = path.join(OUT, 'audio.wav');

// —— 只渲染一段 ——
if (opt('from') || opt('to')) {
  const a = opt('from') || '0', b = opt('to') || String(OUT_DURATION);
  const clip = path.join(OUT, `clip_${a}-${b}.mp4`);
  run('node', [path.join(R, 'src', 'render_all.js'), clip, a, b, String(jobs)]);
  console.log(`\n✓ 片段：${clip}`);
  process.exit(0);
}

// —— 3. 音频 ——
if (!only || only === 'audio') {
  console.log('\n▶ 合成配乐与音效（约 3 分钟）');
  run(PY, [path.join(ROOT, 'audio', 'synth.py'), path.join(CACHE, 'timeline.json'), AUDIO_RAW]);
  // 两遍 loudnorm：整体 -14 LUFS，峰值 ≤ -1.5 dBTP（留出 AAC 编码余量）
  console.log('\n▶ 响度标准化到 -14 LUFS');
  const m = spawnSync('ffmpeg', ['-hide_banner', '-i', AUDIO_RAW, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const js = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf('{'), m.stderr.lastIndexOf('}') + 1));
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', AUDIO_RAW, '-af',
    `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`,
    '-ar', '48000', AUDIO]);
}

// —— 4. 画面 ——
if (!only || only === 'video') {
  console.log(`\n▶ 渲染画面：1920×1080 60 帧，${jobs} 个进程并行（4 核约 45 分钟）`);
  run('node', [path.join(R, 'src', 'render_all.js'), VIDEO, '0', String(OUT_DURATION), String(jobs)]);
}

// —— 5. 合成成片 + 分享版 ——
if (!only || only === 'mux' || only === 'audio' || only === 'video') {
  if (!fs.existsSync(VIDEO) || !fs.existsSync(AUDIO)) { console.log('\n（音频或画面还没生成，跳过合成）'); process.exit(0); }
  const FINAL = path.join(OUT, `生命之美_${ver}_1080p60.mp4`);
  const SHARE = path.join(OUT, `生命之美_${ver}_分享版.mp4`);
  if (fs.existsSync(FINAL)) { console.error(`\n✗ ${FINAL} 已存在。为了不覆盖旧版本，请加 --version v2`); process.exit(1); }
  console.log('\n▶ 合成成片');
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', VIDEO, '-i', AUDIO, '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', FINAL]);
  console.log('\n▶ 生成分享版（体积小，方便发送）');
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', FINAL, '-c:v', 'libx264', '-preset', 'slow', '-crf', '24', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', SHARE]);
  for (const f of [FINAL, SHARE]) console.log(`✓ ${f}  (${(fs.statSync(f).size / 1048576).toFixed(0)} MB)`);
}
