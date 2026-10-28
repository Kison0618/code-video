#!/usr/bin/env node
// 第一集混音：人声 + BGM + 音效 → 套到视频画面上（画面流 -c:v copy，不重新编码）
//   node audio/mix.js <输入视频> <输出视频> [--to 秒]
//     输入视频：无声或带配音都行，只取画面流
//     --to N  ：只出前 N 秒（试听用，结尾 0.5 秒声音淡出）
//   node audio/mix.js - <输出.wav> [--to 秒]   只出混音 wav（不要画面；测量电平用）
// 依赖：audio/events.json（cues.js）、audio/bgm_long.wav（bgm_prep.py）、audio/sfx.wav（sfx.py）
// 混音参数照搬 theory/build.js：人声总线 -16 LUFS；BGM 说话时 -13.5 dB、段落间 -9.5 dB；音效 -5 dB；总线 +2 dB → 限幅
'use strict';
const { spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AU = __dirname, EP = path.join(AU, '..');
const FF = 'F:/AI/For AI to use/codex2/AI-Coding-SuperVideos/.venv/Scripts/ffmpeg.exe';
const VOICE = path.join(EP, 'voice', 'v3', '第一集旁白_v3_A4B1C1D4.mp3');
const BGM = path.join(AU, 'bgm_long.wav'), SFX = path.join(AU, 'sfx.wav'), EVJ = path.join(AU, 'events.json');
const MUSIC_HI = -9.5, MUSIC_LO = -13.5, SFX_DB = -5, BUS_DB = 2, FADE_OUT = 2.5;

const args = process.argv.slice(2);
const ti = args.indexOf('--to');
const TO = ti >= 0 ? +args[ti + 1] : null;
const pos = args.filter((a, i) => !a.startsWith('--') && (ti < 0 || i !== ti + 1));
if (pos.length < 2) { console.error('用法：node audio/mix.js <输入视频|-> <输出视频|输出.wav> [--to 秒]'); process.exit(2); }
const [VIN, OUT] = pos.map(p => (p === '-' ? p : path.resolve(p)));
const wavOnly = /\.wav$/i.test(OUT);
for (const f of [VOICE, BGM, SFX, EVJ, ...(wavOnly ? [] : [VIN])]) if (!fs.existsSync(f)) { console.error('✗ 缺文件：' + f); process.exit(1); }

const D = JSON.parse(fs.readFileSync(EVJ, 'utf8'));
const DUR = D.marks.DUR, END = TO ? Math.min(TO, DUR) : DUR;

// BGM 包络：每个说话段 [s0, s1] 前 att 秒开始压、后 rel 秒放开；段与段取 max（=只在段落之间抬起）
const f2 = x => x.toFixed(3);
const duck = D.duck.map(b => `clip((t-${f2(b.s0 - b.att)})/${f2(b.att)},0,1)*clip((${f2(b.s1 + b.rel)}-t)/${f2(b.rel)},0,1)`).reduce((x, y) => `max(${x},${y})`);
const HI = Math.pow(10, MUSIC_HI / 20), LO = Math.pow(10, MUSIC_LO / 20);
// 片尾淡出（只作用于 BGM + 音效）：余弦曲线，前段保留得多一些，系列名出来时的抬起还听得到
const fade = `if(lt(t,${f2(DUR - FADE_OUT)}),1,cos(PI/2*min(1,(t-${f2(DUR - FADE_OUT)})/${FADE_OUT})))`;

const f = [];
f.push(`[0:a]asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,highpass=f=70,acompressor=threshold=-22dB:ratio=2.5:attack=8:release=160:makeup=2,loudnorm=I=-16:TP=-2:LRA=7,aresample=48000,apad=whole_dur=${DUR}[vo]`);
f.push(`[1:a]asetpts=PTS-STARTPTS,aresample=48000,volume='(${HI.toFixed(4)}-${(HI - LO).toFixed(4)}*(${duck}))*${fade}':eval=frame[bg]`);
f.push(`[2:a]asetpts=PTS-STARTPTS,aresample=48000,volume=${SFX_DB}dB,volume='${fade}':eval=frame[fx]`);
const tail = TO && END < DUR ? `,afade=t=out:st=${f2(END - 0.5)}:d=0.5` : '';
// MIX_SOLO=vo|bg|fx：只留一路（其余静音），测量各路电平用；总线处理不变
const SOLO = process.env.MIX_SOLO;
if (SOLO) for (const k of ['vo', 'bg', 'fx']) if (k !== SOLO) f.push(`[${k}]volume=0[${k}_m]`);
const tag = k => (SOLO && k !== SOLO ? `[${k}_m]` : `[${k}]`);
f.push(`${tag('bg')}${tag('fx')}${tag('vo')}amix=inputs=3:normalize=0:duration=longest,volume=${BUS_DB}dB,alimiter=limit=0.89:level=false,atrim=0:${f2(END)}${tail}[out]`);

const ins = ['-i', VOICE, '-i', BGM, '-i', SFX];
let a;
if (wavOnly) a = ['-y', '-v', 'error', ...ins, '-filter_complex', f.join(';'), '-map', '[out]', '-ar', '48000', '-c:a', 'pcm_s16le', OUT];
else a = ['-y', '-v', 'error', ...ins, '-i', VIN, '-filter_complex', f.join(';'), '-map', '3:v:0', '-map', '[out]', '-c:v', 'copy',
  '-c:a', 'aac', '-b:a', '320k', '-ar', '48000', '-t', f2(END), '-movflags', '+faststart', OUT];
console.log(`▶ 混音 0–${END.toFixed(2)}s → ${path.relative(process.cwd(), OUT)}`);
const r = spawnSync(FF, a, { stdio: 'inherit' });
if (r.status !== 0) { console.error('✗ ffmpeg 失败'); process.exit(1); }
if (!wavOnly) {
  const c = spawnSync(FF, ['-v', 'error', '-nostdin', '-i', OUT, '-f', 'null', '-'], { stdio: 'inherit' });
  if (c.status !== 0) { console.error('✗ 解码自检失败'); process.exit(1); }
}
console.log(`✓ ${OUT}  (${(fs.statSync(OUT).size / 1048576).toFixed(1)} MB)`);
