#!/usr/bin/env bash
# 安装渲染依赖和字体（字体来自 npm 上的 Google Fonts 打包，不提交进 git）
set -euo pipefail
cd "$(dirname "$0")/render"
npm install --no-audit --no-fund
npm install --no-audit --no-fund --no-save \
  @expo-google-fonts/noto-serif-sc @expo-google-fonts/cormorant-garamond @expo-google-fonts/jetbrains-mono
mkdir -p fonts
F=node_modules/@expo-google-fonts
cp $F/noto-serif-sc/200ExtraLight/NotoSerifSC_200ExtraLight.ttf \
   $F/noto-serif-sc/300Light/NotoSerifSC_300Light.ttf \
   $F/noto-serif-sc/400Regular/NotoSerifSC_400Regular.ttf \
   $F/noto-serif-sc/500Medium/NotoSerifSC_500Medium.ttf \
   $F/cormorant-garamond/400Regular_Italic/CormorantGaramond_400Regular_Italic.ttf \
   $F/cormorant-garamond/500Medium_Italic/CormorantGaramond_500Medium_Italic.ttf \
   $F/cormorant-garamond/400Regular/CormorantGaramond_400Regular.ttf \
   $F/cormorant-garamond/300Light/CormorantGaramond_300Light.ttf \
   $F/jetbrains-mono/300Light/JetBrainsMono_300Light.ttf \
   $F/jetbrains-mono/400Regular/JetBrainsMono_400Regular.ttf fonts/
pip install -q numpy scipy
echo "setup done"
