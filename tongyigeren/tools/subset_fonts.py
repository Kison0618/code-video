#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""把完整字体裁成只含常用字的 woff2（assets/fonts/）。一般不用重跑；画面里加了生僻字、显示成别的字体时再跑。
用法：python tools/subset_fonts.py <放完整 ttf 的目录>
需要：pip install fonttools brotli
字体：Noto Serif SC 700 / 900、Noto Sans SC 500、JetBrains Mono 500 / 700（都是 SIL OFL 许可，可以随工程分发）。
"""
import sys, os, json, subprocess
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = sys.argv[1]
chars = set()
for hi in range(0xB0, 0xF8):                      # GB2312 一、二级汉字（6763 个）
    for lo in range(0xA1, 0xFF):
        try:
            chars.add(bytes([hi, lo]).decode('gb2312'))
        except UnicodeDecodeError:
            pass
for root, _, files in os.walk(ROOT):
    if 'node_modules' in root or '.git' in root:
        continue
    for f in files:
        if f.endswith(('.js', '.json', '.md', '.html')):
            chars.update(open(os.path.join(root, f), encoding='utf-8', errors='ignore').read())
chars.update(chr(c) for c in range(0x20, 0x7F))
chars.update('，。、？！“”‘’：；《》（）·…—～×÷→←↑↓■□●○◆▲△％‰°')
text = ''.join(sorted(c for c in chars if ord(c) >= 0x20))
tf = os.path.join(ROOT, 'assets', 'fonts', '_chars.txt')
open(tf, 'w', encoding='utf-8').write(text)
jobs = [('NotoSerifSC_700Bold.ttf', 'NotoSerifSC-700.woff2'), ('NotoSerifSC_900Black.ttf', 'NotoSerifSC-900.woff2'),
        ('NotoSansSC_500Medium.ttf', 'NotoSansSC-500.woff2'), ('JetBrainsMono_500Medium.ttf', 'JetBrainsMono-500.woff2'),
        ('JetBrainsMono_700Bold.ttf', 'JetBrainsMono-700.woff2')]
for a, b in jobs:
    found = None
    for root, _, files in os.walk(src):
        if a in files:
            found = os.path.join(root, a)
    if not found:
        print('缺', a); continue
    out = os.path.join(ROOT, 'assets', 'fonts', b)
    subprocess.run([sys.executable, '-m', 'fontTools.subset', found, '--text-file=' + tf, '--flavor=woff2',
                    '--output-file=' + out, '--layout-features=*', '--no-hinting'], check=True)
    print(b, os.path.getsize(out) // 1024, 'KB')
os.remove(tf)
