# 冥王星 · 远方的心

一支约 4 分钟的冥王星科普短片（Remotion + React 代码生成）。深色宇宙底 + 冰白/琥珀双色、数据可视化叙事、底部中英双语字幕，13 个场景：

| # | 场景 | 画面 |
|---|---|---|
| s01 | 发现 | 1930 年的两张底片，闪烁比较仪里移动的光点 |
| s02 | 片头 | 冥王星 · 远方的心 |
| s03 | 命名 | 11 岁的维尼夏·伯尼；PL = Percival Lowell |
| s04 | 尺度 | 与月球对比（68%）；500 格 = 地球质量，冥王星只占 1 格 |
| s05 | 距离 | 59 亿公里计数、光走 5.5 小时、正午只有 1/1600 的阳光 |
| s06 | 轨道 | 248 年、1979–1999 比海王星更近、3:2 共振计数 |
| s07 | 远征 | 哈勃的模糊像素 → 新视野号 9.5 年航线 |
| s08 | 心 | 2015.07.14 飞掠，扫描线“回传”出清晰的心形 |
| s09 | 冰川 | 斯普特尼克平原的对流多边形、无撞击坑、水冰山脉 |
| s10 | 薄雾 | 回望时逆光的蓝色大气环 |
| s11 | 卡戎 | 互相潮汐锁定、质心在冥王星之外、天空中永不落下 |
| s12 | 除名 | 2006 布拉格 IAU：三条标准、柯伊伯带、九大行星 → 矮行星 |
| s13 | 尾声 | 汤博的骨灰与铭文、片尾卡 |

## 快速开始

需要 Node.js 18+。

```bash
cd pluto
npm install
npm run dev          # 打开 Remotion Studio 预览（浏览器 http://localhost:3000）
npm run render       # 渲染 1080p → out/pluto-1080p.mp4
npm run render:4k    # 渲染 4K（--scale=2，所有图形都是矢量/高分辨率贴图）
```

首次渲染时 Remotion 会自动下载一个无头 Chrome，稍等即可。

## 配音工作流（时间轴全自动）

1. `npm run voiceover:list` —— 打印每个场景要读的旁白文字和对应文件名。
2. 每个场景录/生成一个音频：`public/voiceover/s01.mp3` … `s13.mp3`（也支持 wav / m4a / aac / ogg）。
3. 重新打开 Studio 或直接渲染。

渲染前 `calculateMetadata` 会读取每段音频的真实时长：
- 场景长度 = 0.6 s 前置 + 旁白时长 + 0.9 s 收尾 + 场景自带的停留时间；
- 字幕按每句字数比例分配到旁白时长里；
- 所有动画都挂在字幕 cue 上，所以配音快慢变化时画面会自动跟着走；
- 缺配音的场景按 4.3 字/秒估算占位，可以先只放一部分。

## 背景音乐

把音乐放到 `public/bgm/bgm.mp3`（或 m4a 等）即可：自动循环、开头 2 秒淡入、结尾 4 秒淡出。
仓库里的 `reference-videos/BGM.m4a` 可以直接复制过去改名 `bgm.m4a` 试试。

Studio 右侧 Props 面板可以调：`bgmVolume`（默认 0.22）、`voiceVolume`、`showEnglish`（关掉英文副字幕）。

## 改内容

| 想改什么 | 改哪里 |
|---|---|
| 旁白 / 字幕文字、场景停留时间 | `src/script.ts` |
| 配色、字体 | `src/theme.ts` |
| 某个场景的画面 | `src/scenes/Sxx*.tsx` |
| 通用组件（星空、HUD、字幕、冥王星） | `src/components/` |
| 时间轴规则（前后留白、估算语速） | `src/lib/timeline.ts` |

改了文案出现新汉字时，运行 `python3 scripts/subset-fonts.py` 重新裁剪内嵌字体（需要 `pip install fonttools` 和本地的 Noto Serif CJK 字体）。不跑也没关系：缺的字会自动回退到系统宋体，只是字形略有差异。

## 技术说明

- **字体**：内嵌了思源宋体（Noto Serif CJK SC，200/300/400 三个字重）与 Liberation Mono 的子集，以 base64 形式放在 `src/fonts/`，任何电脑上渲染结果一致。
- **星球贴图**：冥王星、月球、卡戎都是 `scripts/make-pluto-texture.py` 程序化生成的（参考新视野号 2015 年的经典视角），以 base64 webp 放在 `src/assets/plutoTexture.ts`，不依赖外部图片。想调整心形、克苏鲁区的样子可以改脚本后重新生成。
- **数据**：数字取自 NASA / JHUAPL / SwRI / IAU 公开资料，做了科普级四舍五入（如平均日距 59 亿 km、正午光照约 1/1600）。轨道、卫星距离等示意图未按比例。
