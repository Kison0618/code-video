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

时间参考：
- 有 NVIDIA 显卡（脚本自动检测，用 NVENC 编码）：20 线程 CPU + RTX 4070 整片约 6 分钟（画面约 3 分钟，音频约 3 分钟）
- 只有 CPU（4 核）：画面约 45 分钟。可以用 `--jobs 8` 指定进程数，`--cpu-encode` 强制用 x264

系统自带的 Python 装不了 numpy（例如报 externally-managed-environment）时，用环境变量指定一个装好的解释器：
`PYTHON=F:/AAA/python.exe node build.js`（PowerShell：`$env:PYTHON='F:\AAA\python.exe'; node build.js`）

## 常用命令

```bash
node build.js --from 160 --to 200    # 只渲染成片时间 160–200 秒
node build.js --only audio           # 只重做音频并重新合成（画面不重渲）
node build.js --only video           # 只重渲画面
node build.js --only mux             # 音画都在，只重新合成
node build.js --version v2           # 新版本号；同名成片已存在时脚本会停下，不会覆盖旧版
cd render && node src/preview.js shot.png 23.5 57 151 322   # 把几个时间点拼成一张预览图
```

## 时间映射（前 90 秒提速）

源时间 `t` 保持原分镜、字幕和场景常数不变，成片时间 `T` 按以下节点分段线性映射：

| 源时间 t（秒） | 成片时间 T（秒） |
|---|---|
| 0 | 0 |
| 3 | 2.2 |
| 23.5 | 18.6 |
| 34 | 26.0 |
| 97 | 73.25 |

97 秒之后保持原速，`T = t − 23.75`。源片 353 秒，成片 **329.25 秒**（60fps，共 19755 帧）。映射唯一来源是 `render/src/timeline.js` 的 `WARP`；画面用 `toSrc(T)`，音频读取同一份 JSON。

- `build.js --from/--to` 和 `render_all.js` 的起止参数均为**成片时间**；默认结束为 329.25 秒。
- `preview.js` 的参数仍为**源时间**，便于对照原分镜；图中同时标注源时间和成片时间，颗粒帧号按成片时间计算。
- 琶音按成片时间维持原 0.5/0.25 秒间隔，心跳与画面事件随映射提速，和弦及蓄力区间同步缩短。
- 渲染入口每帧重置主画布；并行分块为 1 秒，限制后期画布历史累积的内存占用，预览使用相同的重置方式。
- 检查所有字幕映射后的显示时长：`node render/src/timeline.js --check-subs`；小于 2.8 秒的句子会标记，不自动修改文案。
- 完整构建：`PYTHON=F:/AAA/python.exe node build.js --version v2-warp`；PowerShell 用 `$env:PYTHON='F:/AAA/python.exe'; node build.js --version v2-warp`。

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

## 真实音效素材（v3 起）

`audio/synth.py` 会把 7 个 Mixkit 免费音效作为质感层叠加到合成音色上（[Mixkit 免费授权](https://mixkit.co/license/modal/sfxFree/)，可商用、免署名，但不允许原样再分发，所以不放进仓库）。构建前下载到 `audio/samples/`：

| 文件名 | 下载地址 |
|---|---|
| heartbeat_slow.wav | https://assets.mixkit.co/active_storage/sfx/494/494.wav |
| impact_deep.wav | https://assets.mixkit.co/active_storage/sfx/498/498.wav |
| swoosh_windy.wav | https://assets.mixkit.co/active_storage/sfx/1474/1474.wav |
| chime_crystal.wav | https://assets.mixkit.co/active_storage/sfx/3108/3108.wav |
| water_flow.wav | https://assets.mixkit.co/active_storage/sfx/3126/3126.wav |
| bubble_liquid.wav | https://assets.mixkit.co/active_storage/sfx/3000/3000.wav |
| drone_wind.wav | https://assets.mixkit.co/active_storage/sfx/1177/1177.wav |

## 节奏：时间映射

前 97 秒（冷开场 + 第一幕）按 `render/src/timeline.js` 的 `WARP` 压缩成 73 秒，之后速率不变，成片 5 分 29 秒。
各场景和分镜里的时间仍是**源时间**；`preview.js` 的参数也是源时间，`build.js --from/--to` 是成片时间。
