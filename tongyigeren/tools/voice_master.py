#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
配音后期：（可选）AI 降噪 → 去低频 → 轻降噪 → 轻压缩 → 放慢 → 响度统一到 -16 LUFS、峰值 -1.5 dB。

用法（在 tongyigeren/ 目录下）：
    python tools/voice_master.py <剪好的.wav> audio/voice.wav
    python tools/voice_master.py <剪好的.wav> audio/voice.wav --deepfilter 路径/deep-filter.exe   # 先过一遍 DeepFilterNet
    python tools/voice_master.py <剪好的.wav> audio/voice.wav --tempo 1.0                          # 不改语速
不带 --deepfilter 时，结果和 2026-11-12 交付的 voice.wav 一样。
"""
import sys, os, json, argparse, subprocess, tempfile, shutil
FF = os.environ.get('FFMPEG', 'ffmpeg')


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--deepfilter', help='deep-filter 可执行文件的路径'); ap.add_argument('--df-atten', type=float, default=None, help='DeepFilterNet 最多压低多少 dB（声音发假时设 12 左右）')
    ap.add_argument('--tempo', type=float, default=.96, help='语速：0.96 = 放慢 4%%'); ap.add_argument('--lufs', type=float, default=-16)
    a = ap.parse_args()
    src, tmpdir = a.src, tempfile.mkdtemp()
    try:
        if a.deepfilter:
            w48 = os.path.join(tmpdir, 'in.wav'); subprocess.run([FF, '-v', 'error', '-y', '-i', src, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', w48], check=True)
            cmd = [a.deepfilter, '-o', tmpdir] + (['--atten-lim', str(a.df_atten)] if a.df_atten else []) + [w48]
            subprocess.run(cmd, check=True)
            outs = [f for f in os.listdir(tmpdir) if f.endswith('.wav') and f != 'in.wav']
            src = os.path.join(tmpdir, outs[0]) if outs else w48
            if not outs: print('DeepFilterNet 没有输出文件，跳过这一步', file=sys.stderr)
        nr = '' if a.deepfilter else 'afftdn=nr=8:nf=-60:tn=1,'
        pre = f'highpass=f=70,{nr}acompressor=threshold=-20dB:ratio=2.5:attack=8:release=120' + (f',atempo={a.tempo}' if a.tempo != 1 else '')
        ln = f'loudnorm=I={a.lufs}:TP=-1.5:LRA=7'
        r = subprocess.run([FF, '-hide_banner', '-i', src, '-af', f'{pre},{ln}:print_format=json', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='ignore')
        j = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
        m = f":measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}:measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true"
        os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
        subprocess.run([FF, '-v', 'error', '-y', '-i', src, '-af', f'{pre},{ln}{m},aresample=48000', '-ar', '48000', '-c:a', 'pcm_s24le', a.out], check=True)
        r = subprocess.run([FF, '-hide_banner', '-i', a.out, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True, encoding='utf-8', errors='ignore')
        tail = [l.strip() for l in r.stderr.splitlines()[-12:] if l.strip().startswith(('I:', 'Peak:'))]
        print('完成：', a.out, '　', '　'.join(tail))
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)


if __name__ == '__main__':
    main()
