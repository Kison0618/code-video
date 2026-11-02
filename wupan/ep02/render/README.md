# v6 画面预览（2026-10-31）

本轮交付 `out/_v6_a.png`、`out/_v6_m.png`、`out/_v6_b.png`、`out/_v6_c.png`、`out/_v6_d.png` 和 `out/_v6_拼图.jpg`（40 句各一帧，默认句内 97%；018 取 68% 避开句末撕纸转场）。**尚未渲染 v6 全片，等 Claude 看过拼图后再渲染。**

`src/scenes/index.js` 已切至 `v6_a / v6_m / v6_b / v6_c / v6_d`；v5 场景文件与 `v5_util.js` 原样保留。字幕 64px，最小标签 30px。B8 句按全局要求收成一个主体或一组证物/档案夹加一张关键词纸签；轻落章时刻已经登记在 `STAMPS`。

时间轴优先 `../voice/v6/lines_timed.json`，没有正式配音时用 `lines_timed_est.json`。`node make_est.js` 读取 v6 文案，C 4.9 字/秒、B8 5.3 字/秒，句间 0.3 秒、换人 0.35 秒。假警察独立标记，暂按 4.9 字/秒估算。真实配音已于本轮到位，最终拼图已按正式时间轴重出（含片尾停留共 278.30 秒）。结尾字幕保留 2.6 秒。

I01–I08 已接入；补充铜版画道具 `assets/gen/V6_watch.png`、`V6_press.png`、`V6_doctor.png` 使用内置 image_gen 生成，提示词见同名 `.source.txt`。007 无支票，005 无银行，结尾无监狱反转。附加组件在 `v6_util.js`，米尔格拉姆开关板沿用 v5 实现在 `v6_milgram.js`。

```powershell
node make_est.js
node src/contact_v6.js out/_v6_m.png 0.97 m   # a / m / b / c / d
node src/contact_v6.js out/_v6_拼图.jpg
node src/preview.js out/x.png 9.0 56.5
```

后续确认后，`build.js` 的全片输出为 `out/第二集_v6.mp4`，共用按当前时间轴取时的 `mix_v5.py`，不会覆盖 v5 成片。GL 预览使用固定 Chrome 配置目录及防空密码探测设置。

---

# 误判心理学 第二集 · 权威误导倾向 · 全片 v5

成片：`out/第二集_v5.mp4`。1920×1080，30 帧，x264 CRF 16（`b-pyramid=none:keyint=60`）+ AAC 320k。
文案 `../文案_v5.md`，分镜 `../分镜_v5.md`，配音 `../voice/full/`（`全片旁白.mp3` + `lines_timed.json`）。
自查：`out/_v5_拼图.jpg`（每句一帧，句内 70% 处），`out/_字幕核对.md`（成片音频识别 vs 字幕起止）。

## 重建
```bash
cd ep02/render
node make_est.js                          # 配音没出来时：按 字数÷5.6 + 句间 0.3 秒 估一份 voice/full/lines_timed_est.json
node src/contact_v5.js out/_v5_拼图.jpg    # 每句一帧拼图
node src/preview.js out/x.png 9.0 56.5    # 任意时刻拼图（右下角带时间码，只在预览里有）
node build.js --from 54 --to 60           # 短片段 → .render-tmp/clip_54-60.mp4
node build.js                             # 全片 → out/第二集_v5.mp4（估算时间轴会拒绝，加 --est 强制）
python check_subs.py out/第二集_v5.mp4     # 字幕核对；--fix 把超标块写进 voice/full/caps_fix.json，再重渲
```
Python 用 `AI-Coding-SuperVideos/.venv`（sherpa-onnx Paraformer、librosa、soundfile）。

## 时间轴（src/timeline.js）
- 优先读 `voice/full/lines_timed.json`，没有就读 `lines_timed_est.json`。画面只用 `TL.L(id)`、`TL.at(id,'词')`、`TL.end(id,'词')` 取时间。
- `align: exact` 的句子用对齐出的逐字时刻；`even` 的句子按标点和字数在整句里均分（汉字 1、逗号顿号冒号 1.2、句末 2、字母 0.45）。
- 字幕：按标点切成 ≤16 字一行，每行起止 = 第一个字 / 最后一个字之后的时刻。`caps_fix.json`（比 lines_timed.json 新时才生效）按识别结果覆盖个别行。

## 场景（src/scenes/）
| 文件 | 句 | 装置 |
|---|---|---|
| `v5_a.js` | 001–009 | 电影机场铺满（裁台标）→ 定格退成照片 + 铜版画人脑裂缝“漏洞” → 章节卡 No.3 权威误导（芒格版画）→ 档案卡 + 场记板 → G02 制服 → 电影银行 + 支票 PAID → 世界地图航线 → 电影医生 → 两张工牌 → 证物堆 + 大问号 → H07 原始部落 → 人脑 + 代码卡 `IF 权威说 → 照做`，“说话的是谁”标黄、“说的对不对”划掉 |
| `v5_b.js` | 010–015 | 撕纸转场 → 时间卡“北京 · 海淀” + H01 菜园 → H02 讲台“医生”胸牌 301 → H03 把脉 → “真专家”章 + H04 瓶子摞高 → 拟真微信群 → 价签 + “普通食品”章 → 团伙成员卡撕开露出 H05 挖掘机 → 空白执业证盖“301 医院” |
| `v5_c.js` | 016–022 | 米尔格拉姆：白大褂背影 + 30 档电压开关推到 450 V + 26/40 → 代码卡四散 → 四张翻卡（驾驶舱 13 年 / H06 电视换台 苗医→蒙医 / 手机视频扫描线“AI 合成” / 电话“我现在查你！”） |
| `v5_d.js` | 023–031 | 翻页回档案卡 → 翻面监狱档案（16–20 岁格子盖“在押”）+ 泛美剪报 → G10 讲台 + 电影海报 + 问号 → “你” → 三张便签 → 印章“误判” |
| `v5_util.js` | | 划线、剪图局部/剪影、手机、微信消息、翻卡、便签、印章音效登记（STAMPS） |
| `index.js` | | 合成镜头表；GL 转场：010 撕纸，017 / 023 / 027 翻页 |

旧的 `a1.js`、`a2.js`、`b.js`（前 1 分钟样片）留着没删，不再被引用。

## 声音（mix_v5.py）
配音 + 转场音效（峰值低于人声 6 dB）+ 印章声（“误判”-4、“301 医院”-8、其余 -12 dB，能量峰对齐落章帧）+ 电影原声（RMS 低于人声 18 dB）。时间全部从场景代码里读。010 前的停顿只放撕纸声。没有 BGM。

## 已知取舍
- 014 分镜写的是“讲台上的人影撕开”，但出处只说“团伙里的一个人”以前开挖掘机，不是讲师本人。所以撕开的是讲师旁边的团伙成员卡，讲师保持原样。
- 024 监狱档案只按年龄（16–20 岁）画格子，盖章的格子不对应具体年份，只表示“大部分时间”。
- 019、020 的真人只用剪影。
