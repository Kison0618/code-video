# 鲸落 · WHALE FALL

比特新语式的代码视频：2:40，1080p，30 fps，纯代码生成。
- **技术**：Remotion（React）+ Three.js。所有 3D 都是程序化生成的，不用任何外部模型或素材，包括：
  - 鲸、骨架
  - 盲鳗、睡鲨、食骨蠕虫、贝类、铠甲虾
  - 海雪、探照灯、海面
- **音效**：用 numpy 合成。
- **BGM**：`reference-videos/BGM.m4a`（比特新语那首）。

文案、分镜、出处见 [`文案与分镜.md`](文案与分镜.md)。

## 出片（Windows + NVIDIA）

需要 Node.js 18 以上。

```bash
cd whalefall
npm install
npm run render          # → out/鲸落_1080p.mp4
```

- **GPU**：`remotion.config.ts` 默认用 `--gl=angle`，Windows 上走 D3D11 / 显卡。
- **首次渲染**：Remotion 会下载一个无头 Chrome。下不动的话，可以指定本机已装的 Chrome：
  ```bash
  set REMOTION_BROWSER=C:\Program Files\Google\Chrome\Application\chrome.exe
  npm run render
  ```
- **并发**：3D 场景比较重。可以先 `npx remotion render WhaleFall out/鲸落_1080p.mp4 --concurrency=4` 试一下，显存够再往上加。
- **只渲染一段**：`npx remotion render WhaleFall out/part.mp4 --frames=0-660`（0–22 秒，帧号 = 秒 × 30）。
- **4K**：`npm run render:4k`（`--scale=2`）。

## 预览和改动

```bash
npm run dev                      # Remotion Studio，浏览器里逐帧拖着看
node scripts/stills.mjs 2 17 61  # 抽几帧拼成 out/stills/sheet.jpg（没有显卡的机器加 GL=swiftshader）
python3 scripts/make-sfx.py      # 重新合成音效（需要 numpy 和 ffmpeg）
```

| 想改什么 | 改哪里 |
|---|---|
| 字幕文字和时间、章节标签、片名、大字、片尾 | `src/script.ts` |
| 数字卡、图例 | `src/scenes/overlays.tsx` |
| 每个场景的画面和镜头 | `src/scenes/S01…S10*.tsx`（场景表在 `src/scenes/index.ts`） |
| 鲸和骨架的形状 | `src/three/whaleGeo.ts` |
| 生物 | `src/three/creatures.tsx`、`src/three/benthos.tsx` |
| 鲸落现场各阶段的状态 | `src/three/site.tsx` |
| 海雪、灯、海底、海面 | `src/three/env.tsx` |
| 音效位置和音量 | `src/sfx.tsx` |
| BGM 时间网格（落点、段落） | `src/lib/time.ts` |
| BGM 和音效的总音量 | Studio 右侧 Props：`bgmVolume`、`sfxVolume` |

所有动画都只由当前帧决定，没有跨帧状态，所以可以多进程分块渲染。
