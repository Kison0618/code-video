#!/usr/bin/env node
// 火柴人样片一键构建：装依赖 → 音效时间表 → 合成音效 → 响度标准化 → 多进程渲染画面 → 合成成片
// 用法：
//   node build.js                        完整构建（成片在 render/out/）
//   node build.js --from 23 --to 33      只出一段（带音效），几分钟就能看效果
//   node build.js --only audio           只重做音效
//   node build.js --jobs 8               并行进程数（默认 = CPU 线程数，最多 12）
//   node build.js --fps 30               帧率（默认 60）
//   node build.js --version v2           成片版本号（默认 v1；同名成片已存在会停下，不覆盖）
'use strict';
const { spawnSync, execFileSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = __dirname, R = path.join(ROOT, 'render'), OUT = path.join(R, 'out');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const jobs = +(opt('jobs') || Math.min(12, os.cpus().length));
const ver = opt('version') || 'v1';
const only = opt('only');
if (opt('fps')) process.env.FPS = opt('fps');
const win = process.platform === 'win32';

function run(cmd, a, o = {}) {
  const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: o.cwd || R, shell: win && cmd.startsWith('npm'), env: process.env });
  if (r.status !== 0) { console.error(`\n✗ 失败：${cmd} ${a.join(' ')}`); process.exit(1); }
}
const has = (c, a) => { try { return spawnSync(c, a, { stdio: 'ignore' }).status === 0; } catch { return false; } };
const pyOk = p => has(p, ['-c', 'import sys; assert sys.version_info >= (3, 9)']);
const PY = [process.env.PYTHON, 'python', 'python3'].find(p => p && pyOk(p));

if (!has('ffmpeg', ['-version'])) { console.error('✗ 没找到 ffmpeg，请先安装并加入 PATH（Windows：winget install Gyan.FFmpeg）'); process.exit(1); }
if (!PY) { console.error('✗ 没找到 Python 3（可以用环境变量 PYTHON 指定解释器）'); process.exit(1); }
if (!has(PY, ['-c', 'import numpy, scipy'])) { console.log(`（${PY} 缺少 numpy/scipy，正在安装）`); run(PY, ['-m', 'pip', 'install', 'numpy', 'scipy']); }
if (!fs.existsSync(path.join(R, 'node_modules', 'skia-canvas'))) run(win ? 'npm.cmd' : 'npm', ['install', '--no-audit', '--no-fund']);
fs.mkdirSync(OUT, { recursive: true });

// 有 NVIDIA 显卡就用显卡编码
if (spawnSync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=black:s=256x256:d=0.1', '-c:v', 'h264_nvenc', '-f', 'null', '-'], { stdio: 'ignore' }).status === 0) process.env.VIDEO_ENC = 'nvenc';
console.log(`编码：${process.env.VIDEO_ENC ? 'NVIDIA 显卡（h264_nvenc）' : 'CPU（x264）'}    并行进程：${jobs}    帧率：${process.env.FPS || 60}`);

// —— 1. 音效：画面代码登记的时间表 → Python 合成 → 两遍 loudnorm 到 -14 LUFS ——
const CUES = path.join(OUT, 'cues.json'), RAW = path.join(OUT, 'sfx_raw.wav'), AUDIO = path.join(OUT, 'sfx.wav');
if (only !== 'video') {
  console.log('\n▶ 合成音效');
  fs.writeFileSync(CUES, execFileSync('node', [path.join('src', 'cues.js')], { cwd: R }));
  run(PY, [path.join(ROOT, 'audio', 'sfx.py'), CUES, RAW]);
  const m = spawnSync('ffmpeg', ['-hide_banner', '-i', RAW, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], { encoding: 'utf8' });
  const js = JSON.parse(m.stderr.slice(m.stderr.lastIndexOf('{'), m.stderr.lastIndexOf('}') + 1));
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', RAW, '-af',
    `loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=${js.input_i}:measured_TP=${js.input_tp}:measured_LRA=${js.input_lra}:measured_thresh=${js.input_thresh}:offset=${js.target_offset}:linear=true`,
    '-ar', '48000', AUDIO]);
  if (only === 'audio') { console.log(`✓ ${AUDIO}`); process.exit(0); }
}

function mux(video, out, from = 0, dur = null) {
  run('ffmpeg', ['-y', '-loglevel', 'error', '-i', video, '-ss', String(from), ...(dur ? ['-t', String(dur)] : []), '-i', AUDIO,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', out]);
}

// —— 只出一段 ——
if (opt('from') || opt('to')) {
  const { DUR } = require('./render/src/frame');
  const a = +(opt('from') || 0), b = +(opt('to') || DUR);
  const raw = path.join(OUT, `clip_${a}-${b}_noaudio.mp4`), clip = path.join(OUT, `clip_${a}-${b}.mp4`);
  console.log(`\n▶ 渲染 ${a}–${b} 秒`);
  run('node', [path.join('src', 'render_all.js'), raw, String(a), String(b), String(jobs)]);
  mux(raw, clip, a, b - a);
  fs.rmSync(raw);
  console.log(`\n✓ 片段：${clip}`);
  process.exit(0);
}

// —— 2. 完整版 ——
const FINAL = path.join(OUT, `Stickman_${ver}_1080p${process.env.FPS || 60}.mp4`), SHARE = path.join(OUT, `Stickman_${ver}_分享版.mp4`);
if (fs.existsSync(FINAL)) { console.error(`✗ ${FINAL} 已存在。为了不覆盖旧版本，请加 --version v2`); process.exit(1); }
const VIDEO = path.join(OUT, 'video.mp4');
console.log('\n▶ 渲染画面（1920×1080）');
run('node', [path.join('src', 'render_all.js'), VIDEO, '0', '', String(jobs)]);
console.log('▶ 合成音效');
mux(VIDEO, FINAL);
console.log('▶ 生成分享版（体积小，方便发送）');
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', FINAL, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', SHARE]);
for (const f of [FINAL, SHARE]) console.log(`✓ ${f}  (${(fs.statSync(f).size / 1048576).toFixed(0)} MB)`);
