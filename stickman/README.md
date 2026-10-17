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
  audio/sfx.py          按时间表合成全部音效 + 追逐段的占位配乐
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

## 需要你核对的

1. **声音**：我听不到，音效是按频谱和波形设计的。请戴耳机听一遍，尤其是键盘声、爆炸声和追逐段的配乐（配乐只是占位的鼓 + 贝斯，后面可以换成你的 BGM）。
2. **动作手感**：姿势和时间是一帧帧调出来的，和原片的手绘动画相比还偏"机械"，哪里别扭直接指出来，我按秒数改。
