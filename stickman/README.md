# 火柴人风格 · 第一阶段样片

照着《火柴人 VS 编程》（Alan Becker）做的 1:1 效果模仿，48 秒，一镜到底。目的是先把四件事做到位：
**火柴人动作、代码交互、爆炸特效、音效和画面同步**。角色和剧情的创新后面再聊。

拆解笔记见 [`拆解_火柴人系列.md`](拆解_火柴人系列.md)：配色、比例、镜头、动作、特效清单、声音规律都是从原片里量出来的。

## 出片

需要 Node.js 18+、ffmpeg、Python 3（会自动装 numpy / scipy）。

```bash
cd stickman
node build.js                      # 完整版 → render/out/Stickman_v1_1080p60.mp4 + 分享版
node build.js --from 23 --to 33    # 只出一段（带音效），看爆炸段最快
node build.js --fps 30             # 30 帧版本
node build.js --only audio         # 只重做音效
cd render && node src/preview.js shot.png 9.4 27.7 40   # 抽几帧拼成一张图
cd render && node src/tools/posesheet.js poses.png       # 姿势库总览
```

有 NVIDIA 显卡会自动用 NVENC 编码。4 核 CPU 渲染 48 秒（60 帧）约 4 分钟。

## 样片内容

| 秒 | 段落 | 用到的效果 |
|---|---|---|
| 0–8.6 | 黑底里光标在闪；电脑和火柴人先后从天上掉下来；爬起来、挠头、走过去捡电脑 | 下落 + 落地回弹、灰尘、轻微震屏、走路循环 |
| 8.6–12.6 | 敲 `hello` → **NameError**（暗红底 + 小红字）→ 往后一仰、垂头丧气 → 删掉 | 逐字打字 + 键盘音、运行闪烁、报错 |
| 12.6–18.8 | `print("hi")` → `hi` 作为实物掉到地上 → 松手丢电脑、一脚踢飞 | 文字刚体（弹跳、旋转）、踢击残影、运动线 |
| 18.8–23.6 | 连敲三行 print → 三个 `hi` 掉成一排 | 快速打字 |
| 23.6–33 | `print(*bomb)` → **爆炸** → 人被炸飞后空翻、仰面落地、晕乎乎坐起来 | 闪白、暖色辉光、双层冲击波、火花、BOOM/BAM/POW 群飞、集中线、强震屏、泛光、文字和电脑被掀飞 |
| 33–48 | 走到电脑前蹲着敲 `turtle` → 白色折线越画越粗追着人跑 → 起跳 → 落地欢呼 | turtle 折线、跑步循环、跟拍、起跳落地、追逐配乐 |

## 代码结构

```
stickman/
  build.js              一键构建
  拆解_火柴人系列.md    原片拆解
  audio/sfx.py          按时间表合成全部音效（每类按原片实测对齐）+ 追逐段的占位配乐；有素材时自动用素材
  audio/ref_spectra.json 原片每类声音的频谱包络和长度、亮度（测量数字）
  analysis/ref_events.py   参考音频逐事件测量
  analysis/ref_times.json  原片里每类声音的时间点（对照画面确认过）
  analysis/ref_spectra.py  生成 ref_spectra.json
  analysis/compare_sfx.py  合成音 vs 原片逐类对比
  analysis/pick_samples.py 从素材库按实测指纹自动挑声音
  analysis/sfx_profile.py  整集的声音结构（起音密度、静音段、配乐占比）
  render/src/
    core.js             画布、字体、配色（实测值）、缓动、随机数
    rig.js              火柴人骨骼：姿势 = 关节角；关键帧插值、走/跑循环、自动落地、残影
    poses.js            姿势库（站、敲键盘、托腮、挠头、蹲、趴、仰倒、踢、跳、出拳……）
    cam.js              2D 摄像机（推拉摇移、震屏）+ 地面渐变
    code.js             悬浮代码：打字、光标、Dark+ 配色、选中替换、运行、报错
    phys.js             确定性小物理（掉落、弹跳、被踢飞），落地自动登记音效
    vfx.js              特效：辉光、文字群爆、集中线、冲击波、火花、镜头光晕、闪电、光束、运动线、灰尘、整套爆炸
    props.js            道具：笔记本、实物文字
    cues.js             音效时间表（画面代码登记，Python 读取）
    scene.js            样片的全部编排
    frame.js / render.js / render_all.js / preview.js   合成、渲染、并行、预览
```

**写新镜头的方式**（全部是"时间 → 画面"，没有跨帧状态，多进程渲染不会接错）：

```js
const hero = new Actor({ H: 300, color: C.yellow, head: 'fill' });   // head: 'ring' = 数学集的空心头
hero.key(1.0, PO.stand, { x: 0 })
    .key(1.4, PO.kickWind)
    .key(1.6, PO.kick, { ease: 'in3' });          // 关键帧：姿势 + 位置 + 缓动
hero.cycle(2.0, 4.0, 'run', 0, 1200);             // 循环动作：2–4 秒从 x=0 跑到 1200
const code = new Code({ x: -400, y: -640, size: 66 });
code.type(5, 'print("hi")').run(6.2).error(7, 0, 5, 'NameError');   // 每个按键自动配音
V.explosion(ctx, x, y, t - 8, { words: ['BOOM'] });                  // 特效都是 (ctx, 位置, 年龄) 的纯函数
```

## 音效

音效全部按《火柴人 VS 编程》原片实测合成，详见 [`拆解_火柴人系列.md`](拆解_火柴人系列.md) 第 5 节。

**用你本地的素材包（推荐，键盘、脚步、落地这类真实录音会更自然）**

1. 下载免费、可商用的音效包，放进任意一个文件夹。推荐（以各官网说明的授权为准）：
   - Kenney 的 *Interface Sounds*、*UI Audio*、*Impact Sounds*（CC0，kenney.nl）
   - Sonniss 每年的 *GameAudioGDC* 免费合集（量很大，爆炸、呼呼声、拟音都有）
   - freesound.org 上勾选 CC0 搜：mechanical keyboard single key、footstep soft、plastic drop、cloth rustle
2. 先出报告试听：`python analysis/pick_samples.py <素材文件夹>`，结果写在 `audio/samples/挑选报告.md`，每类候选按"像原片的程度"排好序。
3. 满意就加 `--apply`：每类前 6 名复制进 `audio/samples/<类型>/`，`node build.js` 会自动用它们代替合成音，音量仍按原片实测值。
   够不上门槛的类型继续用合成音。运行、打印结果、报错、光标这些原片设计出来的界面音不需要素材，合成版已经按实测对齐。

`audio/samples/` 不进 git（素材授权各不相同，只留在你本地）。

**核对音效的工具**

```bash
python analysis/compare_sfx.py <火柴人VS编程.mp4> 对比图.png   # 逐类对比原片和合成音（谱形、包络、主频走向）
python analysis/ref_events.py <音频.wav> 0 100 events.json      # 把任意参考音频切成事件并测量
python analysis/ref_spectra.py <火柴人VS编程.mp4>              # 重新生成 audio/ref_spectra.json
node build.js --only audio                                      # 只重做音效（约 10 秒）
```

## 动作系统 v2（`render/src/rig2.js`）

v1 把所有关节按同一条缓动插值，结果全身一起动、一起停，手脚也碰不到东西。v2 换成"意图 + 物理感"：

- **意图**：只写胯在哪、身体前倾多少、头朝哪、手要碰哪个点、脚踩哪
- **弹簧动力学**：每个通道用二阶弹簧追目标（频率 / 阻尼 / 起始响应），躯干快、手慢半拍、头最软，跟随、过冲、回稳自动出现。节奏按原片实测：大姿势变化 2–4 帧完成
- **两段 IK**：手真的贴在电脑上，脚钉在地上
- **够得着约束**：脚够不到时胯自动下沉弯膝，不会被拖着滑
- **"活"的停顿**：呼吸、重心漂移
- **拖影带**：沿手脚的轨迹画
- **停顿帧**：用时间重映射实现，打中瞬间动画冻结，闪光和震屏照常走
- **按键同步**：敲键盘时每个按键的手、电脑微震、音效对齐到同一帧

验证片：`SCENE=motion node build.js --from 0 --to 12.5`（`render/src/scene_motion.js`，12.5 秒，捡电脑 / 敲键盘 / 踢）。

动作体检：`node render/src/tools/motion_check.js`，同一套量法比较 v1 和 v2 的脚滑、死停帧和速度突变。

可复用的角色类在 `render/src/actor2.js`（`Actor2` + 停顿帧时钟 `Clock`），新场景都用它写；用法见文件顶部。

## 打击感系统（`render/src/impact.js`）

一次 `imp.hit(时间, 位置, 力度)` 同时安排：停顿帧、震屏、推镜冲击、闪白 / 反色冲击帧、星芒、冲击环、冲击波扭曲（像素级）、火花、速度线、音效。力度分 `light / medium / heavy / huge / ground` 五档，每一项都能单独覆盖。另有 `Shatter`（一行代码被打碎，字符变成物理物体四散、落地弹跳）和 `charge`（蓄力能量球）。

样片：`SCENE=impact node build.js --from 0 --to 18.31`（`render/src/scene_impact.js`，约 18 秒：轻踢 → 重拳打碎代码 → 电脑砸地 → 蓄力爆炸），成片在 `previews/打击特效样片_v1_1080p60.mp4`。

写场景的规矩：所有 `imp.hit` 要在 `actor.simulate()` 和任何 `clock.real()` 换算之前登记（停顿帧会推后之后的所有真实时间）；带 `defer: true` 的物理物体最后用 `flushSfx` 登记落地声。

## AI 耳朵（声音类别辅助判断）

`audio/ai_ear.py` 用 PANNs Cnn14（AudioSet 527 类）回答两件事："模型认为这段声音是哪一类、有多确定"，以及"合成音和原片在模型眼里是不是同一类"。**它不是听感质量评分**，好不好听仍以人耳为准。第一次冒烟测试的结果和局限见 `audio/ai_ear_reports/2026-10-17_冒烟测试/说明.md`。

**安装**（虚拟环境和模型都放在仓库外，不入库）：

```bash
python3 -m venv ~/.venvs/ai-ear
~/.venvs/ai-ear/bin/pip install --index-url https://download.pytorch.org/whl/cpu "torch==2.14.1+cpu"   # 官方 CPU 版，不带 CUDA
~/.venvs/ai-ear/bin/pip install -r audio/ai_ear_requirements.txt
mkdir -p ~/panns_data
# AudioSet 官方类别表（必须先放好；panns_inference 在 import 时发现缺这个文件会自己用 wget 下载）
curl -o ~/panns_data/class_labels_indices.csv https://storage.googleapis.com/us_audioset/youtube_corpus/v1/csv/class_labels_indices.csv
# 权重：Zenodo 10.5281/zenodo.3987831，CC-BY-4.0，327,428,481 字节，MD5 541141fa2ee191a88f24a3219fff024e
curl -o "$HOME/panns_data/Cnn14_mAP=0.431.pth" "https://zenodo.org/api/records/3987831/files/Cnn14_mAP=0.431.pth/content"
```

Windows 上把 `~/.venvs/ai-ear/bin/` 换成 `%USERPROFILE%\.venvs\ai-ear\Scripts\`，模型同样放在 `%USERPROFILE%\panns_data\`。脚本每次运行前都会校验权重的 MD5 和类别表的 SHA-256，并只用 `weights_only=True` 安全加载；文件不对或缺失就停下，不会自动下载。

**用法**：

```bash
cd audio
~/.venvs/ai-ear/bin/python ai_ear.py --spec 片段表.json --out 报告               # 按片段分析，原片 / 合成成对比较
~/.venvs/ai-ear/bin/python ai_ear.py 音轨.wav --windows 2.0 0.5 --out 报告       # 整段按 2 秒窗口打时间戳
```

片段表的格式写在 `ai_ear.py` 顶部。报告里的标记：

- "≈先验，无信息"：输出和同样长度的静音几乎一样，不能用
- "弱"：最高置信度低于 0.2，只能当线索

短于 2 秒的片段默认平铺成 2 秒再分析（原因见脚本顶部的说明），可以用 `--short pad` 改成补静音。

模型署名：Kong et al., "PANNs: Large-Scale Pretrained Audio Neural Networks for Audio Pattern Recognition", IEEE/ACM TASLP 2020；预训练权重 CC-BY-4.0。

## 需要你核对的

1. **声音**：我听不到，音效是按测量对齐的。请戴耳机听一遍，重点听键盘、运行的"嘟"、打印结果的"叮—咚"、报错和爆炸。哪个不对告诉我秒数和感觉（比如"太脆""太闷""太响"），我对着测量数据改。追逐段的配乐只是占位，把你的 BGM 放成 `assets/bgm.mp3` 就会自动替换。
2. **动作手感**：姿势和时间是一帧帧调出来的，和原片的手绘动画相比还偏"机械"，哪里别扭直接指出来，我按秒数改。
