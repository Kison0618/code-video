# 任务 C：把 7 个真实音效叠加进《生命之美》配乐（接着任务 B 的会话做）

上次你的整片验证渲染被我停掉了（机器内存压力；原因是 post.js 的泛光小画布没有 reset，我已修复；render_all 分块已改回 4 秒）。时间映射你做得对，已保留。v2 已用合成音效出片：`render/out/生命之美_v2_1080p60.mp4`。

## 素材（已下载，Mixkit 免费授权，可商用免署名）
`audio/samples/`：heartbeat_slow.wav（45 秒慢心跳）、impact_deep.wav（3 秒深沉重击）、swoosh_windy.wav（3 秒风感转场）、chime_crystal.wav（2 秒水晶铃）、water_flow.wav（51 秒水流环境）、bubble_liquid.wav（1 秒气泡）、drone_wind.wav（54 秒低沉风声嗡鸣）。全部 44.1kHz 立体声。

## 做法：叠加，不替换
合成音效保留，真实素材作为质感层叠上去。在 `audio/synth.py` 里：
1. 读 WAV（scipy.io.wavfile），转 float、重采样到 48k（scipy.signal.resample_poly 147/160），保留立体声。
2. **心跳**：用包络/起音检测从 heartbeat_slow 里切出最干净的一拍“扑-通”（两个起音一组），做短淡入淡出；每个 HEARTBEATS 时刻放一份，与合成心跳对齐（起音对齐到拍点），增益让它和合成心跳大致相当，合成的低频保留。
3. **重击**：每个 HITS 时刻叠 impact_deep，增益 ∝ 强度 s；起音对齐重击时刻。
4. **蓄力**：每个 RISERS 区间结尾前叠 swoosh_windy（倒放或正放，看起音位置，目标是能量在区间终点达到峰值），时长按映射后区间裁切/淡入。
5. **铃音**：给关键的 bell 事件（'mark'、'letter'、'bloom'、'emblem'、'untwist'）叠 chime_crystal，按事件对应音高用重采样移调（±半音数 = 目标 MIDI − 素材基频估计），低增益，作为“晶莹的泛音层”。先用 FFT 估计素材基频。
6. **水流**：water_flow 低通后铺在流动段（源时间 222.5–270，注意 place 会做映射），淡入淡出 4 秒，循环拼接时交叉淡化。
7. **气泡**：内共生段（源时间 268–300）在若干时刻稀疏随机放 bubble_liquid（移调 −3~−8 半音，低增益）。
8. **底层**：drone_wind 低音量铺全片（循环交叉淡化），片头 3 秒后进、片尾跟随淡出；图灵与细胞段可稍高。
9. 所有真实素材走进 fx 或 music 总线前过适量混响（已有 verb），整体不要盖过音乐。

## 验收（必须实际跑）
- `PYTHON=F:/AAA/python.exe node build.js --only audio --version v3`（只重做音频并合成 v3；画面复用 v2 的 video.mp4，不要重渲画面）。
- 报告：ebur128 整体响度（应 ≈ −14 LUFS）、真峰值（≤ −1.5）。
- 生成两张频谱图 PNG（matplotlib，F:/AAA/python.exe 有）：`render/out/v3_spectrogram_full.png`（全片）与 `render/out/v3_vs_v2_0-30s.png`（v2 与 v3 前 30 秒上下对比），以及每 10 秒的分频段 RMS 表（<60/60-250/250-2k/2k-6k/>6k）对比 v2 vs v3。
- 抽查对齐：成片前 3 个心跳和 toOut(23.5)、toOut(322) 两个重击，素材起音与合成起音偏差（毫秒）。

## 边界
- 只改 `audio/synth.py`（必要时 build.js 的音频部分）。不改画面文件。不要 git commit。
- 结果写 `tasks/C_结果.md`。
