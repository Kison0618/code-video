#!/usr/bin/env python3
"""
把视频里用到的字符从完整字体中裁剪出来，生成 src/fonts/*.ts（base64 内嵌的 woff）。
修改文案后如果出现新字，重新运行本脚本即可（缺字时也会自动回退到系统宋体/衬线体）。

用法：
  pip install fonttools
  python3 scripts/subset-fonts.py [--cjk-dir 目录] [--mono 文件]

默认字体路径为 Linux 下 Noto Serif CJK（google-noto-cjk）与 Liberation Mono。
其他系统可从 https://github.com/notofonts/noto-cjk/releases 下载 NotoSerifCJK-*.ttc。
"""
import argparse, base64, glob, io, os, re
from fontTools import subset
from fontTools.ttLib import TTCollection, TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ap = argparse.ArgumentParser()
ap.add_argument('--cjk-dir', default='/usr/share/fonts/google-noto-cjk')
ap.add_argument('--mono', default='/usr/share/fonts/liberation-mono/LiberationMono-Regular.ttf')
args = ap.parse_args()

text = ''
for p in glob.glob(os.path.join(ROOT, 'src', '**', '*.ts*'), recursive=True):
    if os.sep + 'fonts' + os.sep in p:
        continue
    text += open(p, encoding='utf-8').read()
chars = set(text) | set(chr(c) for c in range(0x20, 0x7f)) | set('—–·…“”‘’→←↑↓×✓✗₂°′″±≈～·，。、：；！？（）《》「」')
chars = {c for c in chars if ord(c) >= 0x20}
print(f'{len(chars)} unique chars')

def sub(font: TTFont, out_name: str, var: str):
    opts = subset.Options()
    opts.flavor = 'woff'
    opts.layout_features = ['*']
    opts.name_IDs = ['*']
    opts.notdef_outline = True
    s = subset.Subsetter(opts)
    s.populate(text=''.join(sorted(chars)))
    s.subset(font)
    buf = io.BytesIO()
    font.flavor = 'woff'
    font.save(buf)
    b64 = base64.b64encode(buf.getvalue()).decode()
    path = os.path.join(ROOT, 'src', 'fonts', out_name)
    with open(path, 'w') as f:
        f.write('// 自动生成：scripts/subset-fonts.py —— 请勿手动编辑\n')
        f.write(f"export const {var} = 'data:font/woff;base64,{b64}';\n")
    print(f'{out_name}: {len(buf.getvalue()) / 1024:.0f} KB woff')

for weight, fname in [(200, 'ExtraLight'), (300, 'Light'), (400, 'Regular'), (600, 'SemiBold')]:
    ttc = TTCollection(os.path.join(args.cjk_dir, f'NotoSerifCJK-{fname}.ttc'))
    font = next(f for f in ttc.fonts if ' SC' in (f['name'].getDebugName(1) + ' '))
    sub(font, f'serif{weight}.ts', f'SERIF_{weight}')

sub(TTFont(args.mono), 'mono.ts', 'MONO_400')
