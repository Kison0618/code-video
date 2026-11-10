#!/bin/bash
# 自查用：抽几帧，缩小一半拼成一张联系表。用法：tools/sheet.sh <输出.jpg> <时刻,时刻,...> [列数]
set -e
out="$1"; times="$2"; cols="${3:-2}"
dir="$(cd "$(dirname "$0")/.." && pwd)"; tmp="$(mktemp -d)"
SCALE=0.5 node "$dir/tools/frames.js" "$tmp" "$times"
n=$(ls "$tmp" | wc -l); rows=$(( (n + cols - 1) / cols ))
i=0; for f in $(ls "$tmp" | sort); do t=$(echo "$f" | sed 's/still_0*\([0-9.]*\)\.jpg/\1/'); ffmpeg -v error -y -i "$tmp/$f" -vf "drawtext=text='${t}s':x=8:y=8:fontsize=22:fontcolor=yellow:box=1:boxcolor=black@0.7" -q:v 2 "$tmp/n_$(printf %03d $i).jpg"; i=$((i+1)); done
ffmpeg -v error -y -framerate 1 -i "$tmp/n_%03d.jpg" -vf "tile=${cols}x${rows}" -frames:v 1 -q:v 3 "$out"
rm -rf "$tmp"
