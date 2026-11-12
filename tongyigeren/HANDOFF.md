# 交接：《同一个人》本地收尾

写给你电脑上的 Claude Code。先读这份，再读 `README.md`。

- 分支：`claude/tongyigeren-visuals`，工程在 `tongyigeren/` 目录。
- 云端已经做完的：画面（纸艺风格，8 个场景）、配音剪辑和处理、时间轴对齐。
- 云端做不了或没做的：都在第 1 节，按优先级排好了。

## 0. 现在的状态（2026-11-12）

| 项目 | 状态 |
|---|---|
| 画面 | 全部完成。全片 309.8 秒，逐秒抽帧无报错 |
| 配音 | 已剪辑、处理，交付文件是 `voice.wav`（4 分 52 秒，48 kHz、24 bit、单声道，−16.4 LUFS，峰值 −1.4 dB） |
| 时间轴 | 已按 `voice.wav` 对齐，`timing/timing.json`、`src/timing.js` 已提交 |
| 配音文件 | **不在仓库里**（仓库是公开的）。用户手上有：云端发过去的 `同一个人_配音_处理后.wav`，以及原始录音 `Track-23_20261112-215333.m4a` |
| 成片 | 没渲染 |

配音做过的处理，两步都已经写成脚本，可以完整重做：
1. `tools/voice_edit.py`：剪掉两处重读（各保留后一遍）、统一停顿。
2. `tools/voice_master.py`：去低频、轻降噪、轻压缩、放慢 4%、响度统一。

两个脚本都在云端验证过：对原始录音重跑一遍，输出和交付的 `voice.wav` 逐个采样完全一致。

## 1. 待办（按优先级）

### 1.1 用户先听一遍配音，核对四处（必须）

我没法真的听，下面这些是靠语音识别和音量曲线判断的。

**两个剪辑点**（时间是 `voice.wav` 里的），听接缝自不自然：
- 约 1:41，“它也早就不是原来那一艘”接“两千年前”。
- 约 3:07，“是拿几块碎片，现拼了一个”接“你记得的每一件往事”。

**识别出来和文案不一样的字**。同音的多半是识别错，但下面几处要用户确认是不是读错了：

| 时间（`voice.wav`） | 文案 | 识别成 | 判断 |
|---|---|---|---|
| 约 1:31 | 桅杆断过 | 围杆断过 | 可能是读音，要听 |
| 约 1:34 | 帆破过 | 翻破过 | 多半是识别错 |
| 约 1:36 | 补了块新木头 | 捕了块 | 多半是识别错 |
| 约 4:39 | 把话说死 | 把话说辞 | 可能是读音，要听 |
| 约 2:08 | 你的胃壁 | 你的未必 | 多半是识别错 |
| 约 3:05 | 现拼了一个 | 先拼了一个 | 可能是读音，要听 |

真读错了的话，只补录那一句，见第 2.3 节。

### 1.2 AI 降噪（可选）

云端下载 DeepFilterNet 被拦了，所以现在用的是 ffmpeg 自带的轻降噪（`afftdn`）。原始录音底噪只有约 −65 dB，本来就很干净，这一步可以不做。

用户如果觉得有底噪或电流声，再做：
1. 从 https://github.com/Rikorose/DeepFilterNet/releases 下载 Windows 版（`x86_64-pc-windows-msvc` 那个 exe），改名 `deep-filter.exe`。
2. 按第 2.1 节重跑，第二步加上 `--deepfilter 路径/deep-filter.exe`。
3. 声音发闷、发假：加 `--df-atten 12`，降噪轻一点。

**没验证过**：`deep-filter` 的命令行参数（`-o` 输出目录、`--atten-lim`）是按官方文档写的，我没有实际跑过。报错的话，先跑 `deep-filter.exe --help` 对一下参数名，再改 `tools/voice_master.py` 里那一行。

### 1.3 出成片（必须）

```bash
cd tongyigeren
npm i
node tools/render-all.cjs audio/voice.wav
```

- 输出：先出 9295 帧到 `.render/frames/`，再合成 `out/同一个人.mp4`。
- Windows 上设 `CHROME_PATH`，指向 Chrome，例如 `C:/Program Files/Google/Chrome/Application/chrome.exe`；ffmpeg 不在 PATH 里就设 `FFMPEG`。
- 进程数用 `RENDER_WORKERS`，默认 4。
- 中途断了直接重跑，已经出好的帧会跳过。
- **没验证过**：这个脚本在新版画面上没有完整跑过一遍，只验证过逐帧输出那一步。合成完检查三件事：
  - 时长是 309.8 秒；
  - 帧数对得上；
  - 编码参数里有 `b-pyramid=none`（老系列踩过的坑：没有它，播放器丢帧时会花屏）。

### 1.4 连续播放看一遍节奏（必须）

我只看过静帧，没看过连续播放。浏览器打开 `index.html?play`，配音放在 `audio/voice.wav`。

重点看：
- 0–4 秒，海翻成房间；
- 1:31–1:41，船的零件被换；
- 2:59–3:27，记忆被撕碎、重拼，越拼越快；
- 4:35 之后，交船、片尾。

动作太快或太慢的话，改对应的场景文件（`src/scenes/s*.js`）。时间全用 `TL.at('句子id','词')` 取，不要写死秒数。

### 1.5 配乐和混音（没做，要先问用户）

用户之前没回答过“最后在什么软件里合成”：
- **在剪映里合成**：直接用剪映的配乐和自动闪避，这边不用做。
- **不在剪映**：给 `tools/voice_master.py` 加一个 `--bgm` 参数，配乐放在比人声低 15–20 dB，人声出来时再自动压低（ffmpeg 的 `sidechaincompress`）。全片响度控制在 −14 到 −16 LUFS，峰值不超过 −1 dB。

### 1.6 其他没做的

- **竖屏版**：没做，画面是按 16:9 设计的。
- **封面**：没做。
- **合并到 main**：用户还没说要不要合。
- **另一个分支 `claude/prios-translation`**：里面是一份带姓名的个人测评中文 PDF，和这个视频无关。仓库是公开的，已经提醒过用户，用户还没回复要不要删。

## 2. 常用操作

### 2.1 从原始录音重做配音

```bash
cd tongyigeren
python tools/voice_edit.py 路径/Track-23_20261112-215333.m4a audio/edit.wav
python tools/voice_master.py audio/edit.wav audio/voice.wav
python tools/align.py audio/voice.wav --name voice.wav
```

- 第一步会跑一遍语音识别（`large-v3-turbo`，纯 CPU 约几分钟）。
- 第三步再识别一遍并对齐，自动改写 `timing/timing.json` 和 `src/timing.js`。结束时列出“对不上的句子”，没列就说明 115 句全对上了。
- 依赖：`pip install faster-whisper pypinyin numpy`，加上 ffmpeg。
- 已知问题：faster-whisper 1.2.1 和新版 PyAV 不兼容，直接传文件路径会报错。两个脚本都是先用 ffmpeg 解码成数组再交给识别，已经绕开了。

### 2.2 只调停顿或语速

- 停顿：改 `tools/voice_edit.py` 开头的 `LONG`、`SAME_CH`、`NEW_CH`、`IN_LINE`，然后按 2.1 重跑三步。
  - 现在的值：句子中间最长 0.38 秒；同一段的句子之间 0.6 秒；换段 1.25 秒；“有没有睡觉？”后面 2.6 秒。
- 语速：`voice_master.py --tempo 0.93`（放慢 7%）。超过 0.9 声音会开始发假。

### 2.3 补录某一句

1. 用同样的环境和距离录这一句。
2. 用 Audacity 替换原始录音里对应的那一句，替换后的文件另存。
3. 按 2.1 从头跑。

**注意**：`voice_edit.py` 里 `CUTS`（两处重读）和 `ROOM_TONE`（底噪片段）用的是原始录音里的秒数。补录以后时长会变，这两处要重新找：
- 先用 `python tools/align.py 新录音.m4a --name x` 拿识别结果（会在 `timing/asr_last.json` 留一份，带每个字的时间）；
- 用完记得把 `timing/` 和 `src/timing.js` 还原：`git checkout -- timing src/timing.js`。

### 2.4 换了一条全新的录音

- 重读的位置不一样，`CUTS` 要重新找：识别结果里同一段话出现两遍的地方就是重读，保留后一遍。
- `ROOM_TONE` 选一段 1.5 秒左右、完全没人说话的地方。

## 3. 容易踩的坑

- **配音不要提交进仓库**：仓库是公开的，`audio/`、`out/`、`.render/` 已经在 `.gitignore` 里。
- **时间不要写死**：画面里所有时间都从 `timing/timing.json` 来，改文案或配音以后跑一遍 `align.py` 就行。
- **`timing/lines.json` 的句子 id 不要改**，场景代码按 id 取时间。改字可以，改完重跑 `align.py`。
- **字体**：已经裁好放在 `assets/fonts/`。画面里加了生僻字、显示成别的字体时，用 `tools/subset_fonts.py` 重新裁。
- **云端的 stop hook 误报**：仓库是浅克隆，只跟踪 `main`，推送后检查脚本有时会报“没推送”。用 `git ls-remote origin <分支>` 核对一下就行。本地完整克隆不会有这个问题。
