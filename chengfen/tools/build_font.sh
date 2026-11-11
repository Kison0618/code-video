#!/bin/sh
# 标题字体子集化：站酷庆科黄油体（OFL）只保留站内用到的字。改了文案后重跑。
# 需要：pip install fonttools brotli；完整字体 zcool-full.ttf（由 @fontsource/zcool-qingke-huangyou 各分片合并而来）
# 用法：sh tools/build_font.sh /path/to/zcool-full.ttf
cd "$(dirname "$0")/.."
cat index.html js/app.js js/data.js > /tmp/cf_chars.txt
pyftsubset "$1" --text-file=/tmp/cf_chars.txt --flavor=woff2 --output-file=fonts/display.woff2 --layout-features='*' --no-hinting
