# 欢迎来到现实世界 · 认知提醒视频

BGM：《Teeth》。文案取自 `copywriting/你永远都只能成为少部分人心中的高级.md`。1920×1080、60 帧、3 分 25 秒。
分镜和设计说明见 [`文案与分镜.md`](文案与分镜.md)。

```bash
cd reality
node build.js                       # 完整构建，成片在 render/out/Reality_v1_1080p60.mp4（另有分享版）
node build.js --from 100 --to 125   # 只渲染一段（带音乐）；这一段是"谁都不恨你"的高潮
cd render && node src/preview.js shot.png 5 26 70 120 190   # 抽几帧拼成预览图
```

需要 Node.js 18+ 和 ffmpeg。有 NVIDIA 显卡时自动用显卡编码。单核每帧约 0.1–1 秒，8 个进程大约 15 分钟。

## 代码结构

- `render/src/universe.js`：3D"人的宇宙"（8000 个点、星团与纤维、星云、景深、人与人之间的连线）
- `render/src/textfx.js`：文字特效（解码、砸入、故障、粒子聚字、划线）
- `render/src/shots/`：8 个镜头，按时间顺序 s1–s8
- `render/src/frame.js`：按时间选镜头、交叉淡化、泛光、暗角
- `analysis/teeth.json`：节拍网格与每一拍的鼓点强度（139 BPM）

## 版权

BGM 是你提供的音乐，文案来自你提供的文本。个人分享可以，公开发布或商用前请确认授权。
