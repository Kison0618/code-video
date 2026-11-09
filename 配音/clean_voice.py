"""配音一键处理：降噪 → 去低频 → 轻压缩 → 响度统一到 -16 LUFS（真峰值 -1.5 dB）。

用法（Windows 示例）：
    python clean_voice.py 录音.m4a
    python clean_voice.py 录音.m4a --strength 0.5     # 降噪轻一点（声音发闷、发假时用）
需要：ffmpeg（命令行能直接运行），deep-filter（DeepFilterNet 官方发布页下载的 exe，放在本脚本同一个文件夹，或在 PATH 里）。
输出：同目录下的 录音_干净.wav（48 kHz 单声道），并打印处理前后的响度和底噪。
"""
import argparse, json, os, re, shutil, subprocess, sys, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))


def find_deep_filter():
    for name in ('deep-filter.exe', 'deep-filter'):
        p = os.path.join(HERE, name)
        if os.path.isfile(p):
            return p
    for name in ('deep-filter', 'deep-filter.exe'):
        p = shutil.which(name)
        if p:
            return p
    sys.exit('找不到 deep-filter：请从 https://github.com/Rikorose/DeepFilterNet/releases 下载对应系统的版本，改名为 deep-filter.exe 放到本脚本旁边。')


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        sys.exit(f'命令失败：{" ".join(cmd)}\n{r.stderr[-2000:]}')
    return r


def measure(path):
    """返回 (整体响度 LUFS, 真峰值 dBTP, 最安静 0.5 秒的电平 dBFS ≈ 底噪)。"""
    r = run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128=peak=true,astats=metadata=1:reset=25,ametadata=print:key=lavfi.astats.Overall.RMS_level', '-f', 'null', '-'])
    txt = r.stderr
    lufs = float(re.findall(r'I:\s+(-?[\d.]+) LUFS', txt)[-1])
    peak = float(re.findall(r'Peak:\s+(-?[\d.inf]+) dBFS', txt)[-1])
    rms = [float(x) for x in re.findall(r'RMS_level=(-?[\d.]+)', txt) if x not in ('-inf',)]
    floor = min(rms) if rms else float('nan')
    return lufs, peak, floor


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src')
    ap.add_argument('--strength', type=float, default=1.0, help='降噪强度 0–1，默认 1（全开）')
    ap.add_argument('--lufs', type=float, default=-16.0, help='目标响度，默认 -16')
    a = ap.parse_args()
    src = os.path.abspath(a.src)
    base = os.path.splitext(src)[0]
    out = base + '_干净.wav'
    df = find_deep_filter()
    with tempfile.TemporaryDirectory() as tmp:
        raw = os.path.join(tmp, 'raw.wav')
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-ac', '1', '-ar', '48000', '-c:a', 'pcm_s16le', raw])   # 任何格式 → 48k 单声道 wav
        dn_dir = os.path.join(tmp, 'dn'); os.makedirs(dn_dir)
        # 降噪强度：用 --atten-lim-db 限制最多压掉多少分贝（全开 = 不限）
        cmd = [df, '-o', dn_dir, raw] if a.strength >= .999 else [df, '--atten-lim-db', str(round(6 + 34 * a.strength)), '-o', dn_dir, raw]
        run(cmd)
        dn = os.path.join(dn_dir, 'raw.wav')
        chain = 'highpass=f=70,acompressor=threshold=-24dB:ratio=2.5:attack=10:release=160:makeup=3'
        # 两遍 loudnorm：第一遍测量，第二遍按测量值精确拉到目标响度
        r = run(['ffmpeg', '-hide_banner', '-i', dn, '-af', f'{chain},loudnorm=I={a.lufs}:TP=-1.5:LRA=9:print_format=json', '-f', 'null', '-'])
        m = json.loads(r.stderr[r.stderr.rindex('{'):r.stderr.rindex('}') + 1])
        ln = (f"loudnorm=I={a.lufs}:TP=-1.5:LRA=9:measured_I={m['input_i']}:measured_TP={m['input_tp']}:"
              f"measured_LRA={m['input_lra']}:measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
        run(['ffmpeg', '-y', '-loglevel', 'error', '-i', dn, '-af', f'{chain},{ln}', '-ar', '48000', '-ac', '1', out])
        before, after = measure(raw), measure(out)
    print(f'处理前：响度 {before[0]:.1f} LUFS，峰值 {before[1]:.1f} dB，底噪约 {before[2]:.0f} dBFS')
    print(f'处理后：响度 {after[0]:.1f} LUFS，峰值 {after[1]:.1f} dB，底噪约 {after[2]:.0f} dBFS')
    print(f'输出：{out}')


if __name__ == '__main__':
    main()
