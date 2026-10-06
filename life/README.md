# 《生命之美：一条从未断过的线》

纯代码生成的视频：画面、配乐、音效全部由程序算出来。
文案、分镜和事实出处见 [文案与分镜.md](文案与分镜.md)。

## 你需要先装好

| 工具 | 版本 | 检查命令 |
|---|---|---|
| Node.js | 18 或更新 | `node -v` |
| Python | 3.9 或更新 | `python --version` |
| ffmpeg | 任意较新版本，需要能在命令行直接运行 | `ffmpeg -version` |

Windows 装 ffmpeg 最省事的方法：`winget install Gyan.FFmpeg`，装完重开一个终端。

## 一条命令出片

```bash
cd life
node build.js
```

脚本会自动：安装 npm 依赖和字体 → 安装 numpy、scipy → 预计算图灵斑纹 → 合成配乐与音效 → 多进程渲染画面 → 把响度标准化到 -14 LUFS → 合成成片和分享版。

成片在 `life/render/out/`：
- `生命之美_v1_1080p60.mp4`：完整画质
- `生命之美_v1_分享版.mp4`：体积小，方便发送

时间参考（4 核 CPU）：画面约 45 分钟，音频约 3 分钟。核数越多越快，可以用 `--jobs 8` 指定进程数。

## 常用命令

```bash
node build.js --from 160 --to 200    # 只渲染 160–200 秒，几分钟就能看到效果
node build.js --only audio           # 只重做音频并重新合成（画面不重渲）
node build.js --only video           # 只重渲画面
node build.js --only mux             # 音画都在，只重新合成
node build.js --version v2           # 新版本号；同名成片已存在时脚本会停下，不会覆盖旧版
cd render && node src/preview.js shot.png 23.5 57 151 322   # 把几个时间点拼成一张预览图
```

## 目录

```
life/
  build.js            一键构建
  文案与分镜.md        文案、分镜、参考片拆解、事实出处
  render/
    src/timeline.js   时间轴：字幕、引文、心跳、重击点（画面和音频共用）
    src/scenes/       六幕画面，每一帧只由时间 t 计算
    src/ui.js         字幕、HUD、引文卡、背景、颗粒
    rd_precompute.py  图灵斑纹（Gray–Scott 反应扩散）预计算
  audio/synth.py      配乐与音效合成
```

## 改片子时告诉我

说时间点和感觉最快，例如"第 200–214 秒的斑纹太亮"、"322 秒的重击不够"、"结尾 BGM 太刺耳"。
我改代码、推到仓库，你拉下来再跑一次 `node build.js --version v2` 就行。
