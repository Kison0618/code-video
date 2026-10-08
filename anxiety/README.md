# 生于焦虑，死于自律 · 心理学定律视频

BGM：`reference-videos/BGM.m4a`（"概率史"参考视频的原声）。文案取自 `copywriting/2020，生于焦虑，死于自律.md`，改写成"11 条心理学定律"。1920×1080、60 帧、2 分 10 秒。
分镜、每句文案的时间和数据来源见 [`文案与分镜.md`](文案与分镜.md)。

```bash
cd anxiety
node build.js                       # 完整构建，成片在 render/out/Anxiety_v1_1080p60.mp4（另有分享版）
node build.js --from 0 --to 48      # 只渲染一段（带音乐）：开场 + 片名 + 定律 01–03
cd render && node src/preview.js shot.png 5 20 40 60 100   # 抽几帧拼成预览图
```

需要 Node.js 18+ 和 ffmpeg。有 NVIDIA 显卡时自动用显卡编码。单核每帧约 0.1–0.4 秒，4 个进程渲染 48 秒大约 4 分钟。

## 代码结构

- `render/src/shots/`：14 个镜头。开场 `hook`、片名 `title`、定律 `l01`–`l11`、结尾 `end`
- `render/src/card.js`：定律卡的公共部件（里程表式滚动的年份、研究者、定律名、论文名、红色印章）
- `render/src/textfx.js`：文字特效（升起、砸入、解码、故障、打字、粒子聚字、堆叠、按时间排队的字幕）
- `render/src/bg.js`：深蓝黑的底和飘动的尘埃
- `render/src/frame.js`：按时间选镜头、交叉淡化（片名和第 9 条硬切）、泛光、暗角
- `analysis/bgm.json`：逐拍时刻（约 112 BPM）和能量包络

## 版权

BGM 和文案来自你提供的素材。个人分享可以，公开发布或商用前请确认授权。
