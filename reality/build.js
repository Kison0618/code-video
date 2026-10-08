#!/usr/bin/env node
// 欢迎来到现实世界（认知提醒视频）一键构建：装依赖 → 多进程渲染画面 → 合成原曲 → 出完整版和分享版
// 用法：
//   node build.js                       完整构建（成片在 render/out/）
//   node build.js --from 46 --to 60    只渲染一段（带音乐），几分钟就能看效果
//   node build.js --jobs 8              并行进程数（默认 = CPU 线程数，最多 12）
//   node build.js --version v2          成片版本号（默认 v2；同名成片已存在会停下，不覆盖）
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ROOT = __dirname, R = path.join(ROOT, 'render'), OUT = path.join(R, 'out');
const AUDIO = path.join(ROOT, 'assets', 'teeth.m4a');
const args = process.argv.slice(2);
const opt = k => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : undefined; };
const jobs = +(opt('jobs') || Math.min(12, os.cpus().length));
const ver = opt('version') || 'v1';
const win = process.platform === 'win32';

function run(cmd, a, env) {
  const r = spawnSync(cmd, a, { stdio: 'inherit', cwd: R, shell: win && cmd === 'npm', env: { ...process.env, ...env } });
  if (r.status !== 0) { console.error(`\n✗ 失败：${cmd} ${a.join(' ')}`); process.exit(1); }
}
const has = (c, a) => { try { return spawnSync(c, a, { stdio: 'ignore' }).status === 0; } catch { return false; } };
if (!has('ffmpeg', ['-version'])) { console.error('✗ 没找到 ffmpeg，请先安装并加入 PATH（Windows：winget install Gyan.FFmpeg）'); process.exit(1); }
if (!fs.existsSync(path.join(R, 'node_modules', 'skia-canvas'))) run('npm', ['install', '--no-audit', '--no-fund']);
fs.mkdirSync(OUT, { recursive: true });

// 有 NVIDIA 显卡就用显卡编码
const nv = spawnSync('ffmpeg', ['-hide_banner', '-f', 'lavfi', '-i', 'color=c=black:s=256x256:d=0.1', '-c:v', 'h264_nvenc', '-f', 'null', '-'], { stdio: 'ignore' }).status === 0;
const env = nv ? { TEETH_ENC: 'nvenc' } : {};
console.log(`编码：${nv ? 'NVIDIA 显卡（h264_nvenc）' : 'CPU（x264）'}    并行进程：${jobs}`);

function mux(video, out, from = 0, dur = null) {
  // 原曲压得很满（峰值超过 0 dBFS），降 1.5 dB 防止转码后削波
  const a = ['-y', '-loglevel', 'error', '-i', video, '-ss', String(from), ...(dur ? ['-t', String(dur)] : []), '-i', AUDIO,
    '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-af', 'volume=-1.5dB', '-c:a', 'aac', '-b:a', '320k', '-movflags', '+faststart', '-shortest', out];
  run('ffmpeg', a);
}

if (opt('from') || opt('to')) {
  const a = +(opt('from') || 0), b = +(opt('to') || 204.9);
  const raw = path.join(OUT, `clip_${a}-${b}_noaudio.mp4`), clip = path.join(OUT, `clip_${a}-${b}.mp4`);
  run('node', [path.join('src', 'render_all.js'), raw, String(a), String(b), String(jobs)], env);
  mux(raw, clip, a, b - a);
  fs.rmSync(raw);
  console.log(`\n✓ 片段：${clip}`);
  process.exit(0);
}

const FINAL = path.join(OUT, `Reality_${ver}_1080p60.mp4`), SHARE = path.join(OUT, `Reality_${ver}_分享版.mp4`);
if (fs.existsSync(FINAL)) { console.error(`✗ ${FINAL} 已存在。为了不覆盖旧版本，请加 --version v3`); process.exit(1); }
const VIDEO = path.join(OUT, 'video.mp4');
console.log('\n▶ 渲染画面（1920×1080，60 帧）');
run('node', [path.join('src', 'render_all.js'), VIDEO, '0', '', String(jobs)], env);
console.log('▶ 合成原曲');
mux(VIDEO, FINAL);
console.log('▶ 生成分享版（体积小，方便发送）');
run('ffmpeg', ['-y', '-loglevel', 'error', '-i', FINAL, '-c:v', 'libx264', '-preset', 'slow', '-crf', '22', '-pix_fmt', 'yuv420p', '-c:a', 'copy', '-movflags', '+faststart', SHARE]);
for (const f of [FINAL, SHARE]) console.log(`✓ ${f}  (${(fs.statSync(f).size / 1048576).toFixed(0)} MB)`);
