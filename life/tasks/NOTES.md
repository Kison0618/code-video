# v2 优化（2026-10-07）
用户要求：前 90 秒提速；全片视觉更华丽；音效优化（可用网上素材）；多用 Codex，同一件事 resume 原会话。
- Codex A 音效调研（只调研不下载）：session 01a11448-5662-7901-af7f-e2960de6c740 → tasks/A_codex_final.txt
- Codex B 时间映射提速：session 01a11448-575e-72d0-9655-0ea13cb0627e → tasks/B_结果.md
- Claude：视觉（frame.js / ui.js / scenes/*），B 不碰这些文件
- 下载素材前必须用户确认（文件名/来源/大小）
- 进度（10-07）：v2 = 提速 + 泛光/余烬/内共生细胞质；v3 = v2 画面 + 真实音效叠加（Claude 自己写，C 会话太慢已停）
- 性能坑：skia-canvas 累积绘制指令，主画布与 post.js 小画布每帧必须 reset；glowSprite 颜色要量化缓存
