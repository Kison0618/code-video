# 山河转场 · 转场库（原作 20 式 + 新增 4 式）

这个库从《山河转场》单文件网页（`source/山河转场_原文件.html`，60 MB，作者不明）里拆出 20 式 WebGL 转场，整理成以后代码视频可以直接调用的形式。库里只有代码，没有原作的照片、视频和字体。

用法：给两张图和进度 p（0→1），渲染出一帧。同一组输入（图、p、seed、time）永远得到同一帧，可以逐帧 seek。

第二轮新增：4 式纸张版画转场（21 撕纸、22 描线、23 排线、24 翻页），抽出来的转场音效（`lib/audio/`），在《误判心理学》ep01 画面上的适配评级，一支 25 秒的试用片，以及 `学习笔记_节奏与手法.md`。现在一共 24 式。

## 30 秒上手

先 `npm install`。Chrome 不在默认位置时设 `SHANHE_CHROME` 指向 chrome.exe。

**skia-canvas 管线**（GL 桥，24 式都能用）：

```js
const { Canvas, ImageData } = require('skia-canvas');
const { createGLBridge } = require('./lib/node/gl-bridge');
const gb = await createGLBridge({ width: 1920, height: 1080 });
// 每一帧：a、b 是同尺寸的 skia-canvas 画面，p = (t - 转场开始) / 时长
const px = await gb.frame(a, b, 'paixian', p, { seed: 0.37 });
ctx.putImageData(gb.toImageData(px, ImageData), 0, 0);   // 之后照常画字幕、送 ffmpeg
await gb.close();                                         // 全部帧画完后
```

音效：`node lib/audio/render_wav.js out/sfx paixian:2.2` 导出 WAV，放在转场开始的时刻（WAV 开头留了 0.05 秒空白）。

**HyperFrames**（一张 canvas + 一条暂停的 GSAP 时间轴，lint 0 错误）：

```html
<canvas id="c" class="clip" width="1920" height="1080" data-start="0" data-duration="3"></canvas>
<script src="lib/runner.js"></script><script src="lib/transitions/23_paixian.js"></script>
<script>
  const r = ShanheRunner.create(document.getElementById('c'));
  const s = { p: 0 }, tl = gsap.timeline({ paused: true });
  tl.to(s, { p: 1, duration: 3, ease: 'none', onUpdate: () => r.frame(imgA, imgB, 'paixian', s.p, { seed: 0.37 }) });
  window.__timelines = { 'my-comp': tl };   // 键名和 data-composition-id 一致
</script>
```

`ease` 一定写 `'none'`：缓动在 shader 里。完整示例见 `examples/hyperframes/index.html`。

## 精选 8 式

配音视频优先调用这 8 式。其余 16 式继续保留；精选版以 `wp_` 为前缀单独注册，原 24 式不变。墨色统一 `#231b15`，纸色从画面边缘采样，关闭额外暗角和颗粒；印章用代码绘制篆意“误判”（右误、左判），红褐印泥 `#9e3b26`。

| 式（id） | 用途 | 推荐时长 |
|---|---|---|
| 排线 `paixian` | 固定开场，版画人物进入主题 | 2.2 秒 |
| 墨染 `moran` | 人物转概念，从主体左侧晕入 | 2.6 秒 |
| 飞白 `feibai` | 关键词转解释，枯笔横扫 | 2.2 秒 |
| 撕纸 `sizhi` | 推翻旧结论，裂口避开中央人物 | 1.8 秒 |
| 翻页 `fanye` | 下一章、清单推进 | 1.6 秒 |
| 风沙 `fengsha` | 旧判断沿指定风向消散 | 2.6 秒 |
| 甩镜 `shuaijing` | 场所跳转、快速对比 | 1.6 秒 |
| 印章 `yinzhang` | 固定收尾，为结论落款 | 3.0 秒 |

正片只指定 id（`elapsed` 是转场开始后的秒数；`a`、`b` 均为当前时刻渲染的镜头）：

```js
const px = await require('./lib/picks').framePick(gb, a, b, 'moran', elapsed);
```

预设唯一来源是 `lib/picks.json`，含用途、dur、seed、focus/dir 和 sfx。`getPick(id)` 可读完整预设；`framePick` 第七参数可覆盖 `focus`、`dir`。focus 为左上原点的归一化 `[x,y]`，墨染第一滴落在那里，撕纸裂口经过该点；dir 为屏幕方向 `[dx,dy]`，y 向下。默认墨染 `[0.3,0.45]`、撕纸 `[0.66,0.5]`，风沙向左上，甩镜向右。换构图时可改落点，避免遮住人物或关键词。

浏览器加载 `lib/runner.js`、`lib/transitions/picks.js`，再读取 `lib/picks.json`，以 `wp_` + id 调用 runner，并传入预设 seed、focus、dir 与 `p = elapsed / dur`。外部不再套缓动。

**音效**：用预设 `sfx.id`、`dur`、`sfx.seed` 交给 `lib/audio/render_wav.js`。WAV 裁去开头 `sfx.trimStart` 秒后，放在转场开始 + `sfx.offset` 秒处；offset 已对齐风沙和甩镜的重拍；精选翻页保留纸声起手，并将落页敲击移到 p=0.95。精选印章在 `0.35 × dur` 落印，不再受原音效 0.9 秒上限影响。`accentP` 标动作重拍进度，`peakBelowVoiceDb` 固定为 6；按本集旁白实测峰值设定音效峰值，混合尾音叠加时仅衰减防越界。示例混音见 `examples/picks_mix.py`（仅需 Python 标准库）。

**本轮试用**：本地 `examples/out/精选8式_试用.mp4`，1920×1080、30 fps、29.6 秒、带 8 式音效；ep01 场景逐帧渲染，双方持续慢推，排线开场、印章收尾。试用片没有旁白和 BGM，音效 PCM 总线峰值按 ep01 主旁白实测 −1.7 dBFS 下调 6 dB 至 −7.7 dBFS；最终 AAC 实测 −7.5 dBFS，低于主旁白 5.8 dB。正式集数须重新测量旁白。视频不上传 GitHub。

重现：先将 ep01 的 `render/src/`、`render/assets/`、`render/.cache/`、`voice/v3/lines_timed.json` 复制到独立临时目录，保证副本可解析 `skia-canvas`，再运行 `node examples/picks_ep01.js <ep01副本目录>`。仅出对照图加 `--sheet-only`。副本隔离 ep01 的图片缓存写入；不要直接传原工程目录。

渲染每 60 帧在 `tmp/picks/chunks/` 保存一个完整片段；同一工程、同一参数下重跑会校验并复用完整片段。改变 shader、预设或 ep01 输入后，先将旧 `tmp/picks/` 移到回收站再运行，避免复用旧画面。恢复已有前缀可传 `--resume-frame <帧数> --prefix <已验证的前缀mp4>`。

GL 桥依赖 Chrome/Chromium，设置 `SHANHE_CHROME` 为可执行文件路径。Node 渲染与音效各用固定独立配置目录 `tmp/chrome/`，Windows 预写防空密码探测状态；同名配置目录不要并行使用，确需并行时通过 `profileDir` 指向独立目录。回归命令 `node tools/test_picks.js` 验证原 24 式不变、精选端点/确定性和 focus/dir；本地有 `source/stripped.html` 时同时核验原作 20 式像素一致性。

![精选 8 式：p=.25/.5/.75、推荐时长与用途](shots/_精选8式.png)

## 目录

| 路径 | 内容 |
|---|---|
| `lib/picks.json`、`lib/picks.js` | 精选预设与按 id 调用入口 |
| `lib/transitions/picks.js` | 8 式暖纸墨色 shader，与原版并存 |
| `examples/picks_ep01.js`、`examples/picks_mix.py` | 精选 8 式动态试用片与按旁白参考电平混音 |
| `lib/runner.js` | 公共渲染器（WebGL1）：`ShanheRunner.create(canvas 或 gl)`，然后 `.frame(from, to, 转场, p, opts)`。PRELUDE（uniform 声明、`getFrom/getTo`、hash、值噪声、simplex、fbm、ease）和 MAIN（暗角、颗粒）都照搬原作 |
| `lib/transitions/NN_id.js` | 每式一个文件，UMD 格式。头注释写原理、缓动、建议时长、uniform、是否用 uTime、适用内容、素材依赖；导出 `{ id, zh, en, family, desc, duration, easing, uniforms, usesTime, glsl }` |
| `lib/transitions/index.js` | 清单。浏览器里 `ShanheTransitions.load('lib/transitions/')`；Node 里 `require('./lib/transitions')` 返回 `{ id: def }` |
| `lib/catalog.json` | 24 式的全部元数据（含文件路径和截图路径） |
| `lib/placeholders.js` | 两张程序绘制的占位图（甲：暖色黄昏；乙：冷色晴空），浏览器和 skia-canvas 通用 |
| `lib/node/gl-bridge.js` | skia-canvas 管线用：借无头 Chrome 当离屏 GPU，像素回到 Node |
| `lib/node/canvas2d.js` | 卷轴、甩镜、墨染三式的纯 2D canvas 改写，不需要 WebGL |
| `lib/audio/shanhe-audio.js` | 原作的 Web Audio 音频引擎（环境音、古琴、每式转场音效），原样抽出，加了 4 式新音效和确定性离线渲染 `renderTransition(id, { dur, seed })` |
| `lib/audio/render_wav.js` | Node 里批量导出转场音效 WAV（借无头 Chrome） |
| `lib/audio/shanhe_sfx.py` | 接 Python 混音管线：`shanhe(id, d)` 返回 numpy 波形；或者直接带着 ep01 的 `audio/sfx.py` 跑（不改 ep01） |
| `docs/hyperframes_shader-transitions.md` | 为什么接不进 `@hyperframes/shader-transitions`、用什么替代 |
| `学习笔记_节奏与手法.md` | 原作的时长、运镜、选图、字幕、声音怎么配，10 条照做的规则 |
| `examples/trial_ep01.js`、`examples/trial_mix.py` | 试用片：ep01 画面 + 6 式 + 音效 → `examples/out/误判画风_转场试用.mp4` |
| `demo.html` | 演示页：下拉切换 24 式、进度滑块、播放、seed，URL 参数定格 |
| `examples/skia_render.js` | skia-canvas 管线最小验证（截图对比 + 一段 mp4） |
| `examples/hyperframes/index.html` | HyperFrames 合成示例（已 lint、已渲染） |
| `examples/out/` | 验证视频：`skia_demo.mp4`、`hyperframes_demo.mp4`（只有占位图）；`误判画风_转场试用.mp4`（ep01 画面） |
| `shots/` | 取证截图，见下文 |
| `source/stripped.html` | 剥掉 base64 媒体后的原文件源码（257 KB），用来读代码 |
| `tools/` | 生成和验证脚本：`strip.py`（剥媒体）、`gen_lib.js`（从 stripped.html 生成 lib/，人工整理的元数据在这里）、`new_transitions.js`（21–24 式的 GLSL 和元数据）、`gen_audio.js`（生成 lib/audio/shanhe-audio.js）、`shoot_original.py`（原文件取证）、`montage.py`（拼图）、`test_demo.py`（demo 与一致性测试）、`test_new.js`（新式端点和确定性）、`ep01_grab.js`（从 ep01 管线取不带字幕的画面）、`style_test.js` + `style_sheet.py` + `style_verdicts.json`（画风适配图） |

安装：`npm install`（skia-canvas 3.0.8、playwright-core）。GL 桥要用本机 Chrome；Chrome 不在默认位置时，设环境变量 `SHANHE_CHROME` 指向 chrome.exe。

## 原文件是怎么写的

读的是 `source/stripped.html`。这个文件把原文件第 3440–3451 行的 11 段视频、11 张照片和 8 份字体都换成了 `__STRIPPED_<字节数>_BYTES__` 占位。

- **影像加载**：11 个场景（黄山、漓江 … 珠穆朗玛）。每个场景有一张照片（`SHANHE_DATA.scenes[i].file`，内嵌 JPEG data URI）和一段视频。视频的 base64 放在 `<script type="application/octet-stream" id="clip-*">` 里，用 `fetch('data:video/mp4;base64,…')` 转成 blob URL 交给 `<video>`，再逐帧 `texImage2D` 成纹理。视频来不及加载时用照片代替。纹理用 LRU 缓存（桌面 5 张，手机 3 张），超过 GPU 上限的图先缩小。每个场景都有 Ken Burns（推、拉、左移、右移，围绕 `focus` 点），实现方法是每帧改 `uFromXf/uToXf`（`texUV = uv * xf.xy + xf.zw`），转场 shader 不需要知道这件事。
- **进度驱动**：页面自己维护一个时钟，每步最多走 100 ms，所以切到后台再回来不会快进。状态机有 hold 和 trans 两态；trans 里 `p = (t − t0) / dur` 是线性的，`dur = 建议时长 / 速度滑块`。**缓动都写在 shader 里**，JS 只给线性 p。p 过 0.5 时字幕换成下一个场景。
- **shader 组织**：`ShanheCore.PRELUDE + 转场正文 + MAIN` 拼成一个 fragment shader，顶点 shader 只画一个全屏三角形。每式只需要写一个 `vec4 transition(vec2 uv)`，用 `getFrom/getTo` 取两幅画面，自己的辅助函数加式名前缀（如 `moran_wash`）避免重名。20 式按 5 个家族分在 5 个 `<script>` 里，都 push 进 `window.SHANHE_TRANSITIONS`，最后按固定顺序排序。启动时全部预编译，哪一式在当前 GPU 上编译失败就删掉它。MAIN 统一加暗角（1.0）和胶片颗粒（0.035）。每式开头都有 `if (p <= 0) return getFrom(uv); if (p >= 1) return getTo(uv);`，或用公式保证端点帧和原图完全一致。
- **挑选转场**：三种模式。「策展」用 `SHANHE_DATA.curated` 里 `"黄山>漓江": ["cengluan", "feibai"]` 这样的表，第一轮用第一个，第二轮用第二个；「随机」是洗牌袋，全部轮完才重复；「固定」只用选中的一式。键盘 1–0、- 可以指定。开场从纸色进入第一幅画用的是墨染。系统开了“减少动态效果”时只用云影或空蒙。每次切换的 seed 是 `Math.random()`，所以原作每次播放都不完全一样。
- **其他**：Web Audio 实时合成的环境音（转场时有对应的音效钩子，第二轮已抽进 `lib/audio/`，见“转场音效”）；测试钩子 `?still=i&tr=id&p=0.5`，用 seed 0.37、time 6 渲染场景 i→i+1 的一帧。

## 24 式总表

原 20 式取证截图只保留本地、不上传 GitHub。每张是 p = 0 / 0.25 / 0.5 / 0.75 / 1 五帧，用原文件自己的渲染器和原作照片拍的（见“取证”一节）。建议时长取原作默认值。

| 编号 | 中文名 | 视觉效果 | 实现原理（关键技巧） | 适合的内容切换 | 时长 | 截图 |
|---|---|---|---|---|---|---|
| 01 | 墨染 Ink Bleed | 三滴墨先后落下晕开，墨团里先是灰色水墨，再透出新画面的颜色，边缘有深色水渍和毛细触须 | 3 个种子圆的 SDF 并集，用 fbm 做乘性扭曲；前沿内侧是“咖啡环”水渍，外侧是沿径向拉长的噪声触须和宣纸纤维晕染；墨团内把新画面压成墨灰，越往里越回到原色 | 开场、章节切换、人文/书画内容 | 3.0 s | `shots/01_墨染.png` |
| 02 | 飞白 Dry Brush | 四道枯笔依次横扫，笔尾和笔肚两侧出现干笔留白的丝缕 | 每道笔是带角度的条带，用局部坐标 (u, v) 描述；各向异性噪声做鬃毛；越到笔尾干笔阈值越高，噪声低于阈值的地方留白 | 标题出现、书法/文字主题 | 2.8 s | `shots/02_飞白.png` |
| 03 | 卷轴 Handscroll | 一根手卷从右往左滚过，卷轴上能看到还没展开的画面，刚展开的纸微微泛黄，上下有绫边 | 圆柱映射：屏幕 x 用 `asin` 反算成卷轴上的弧长去取样；法线漫反射加一条高光；轴前有投影，装裱边带金线 | 历史、古籍、时间线、“翻开下一卷” | 3.2 s | `shots/03_卷轴.png` |
| 04 | 层峦 Layered Ridges | 五层水墨山从下往上升起，远山淡、近山浓，新画面从山脚的雾里露出 | 1D 值噪声加 ridged simplex 生成山脊剪影；远层滞后形成视差；山体从脊线往下按指数褪进雾里，近层加点苔和皴笔 | 山水、地理、旅行 | 3.4 s | `shots/04_层峦.png` |
| 05 | 空蒙 Misty Depth | 雾从远处漫过来，远景先换，近景最后显现 | 用旧画面的亮度和高度拼一张伪深度图，阈值从远扫到近；阈值处有一条雾带，带内对两幅图做小模糊，雾色取两图的平均色 | 抒情、慢节奏、安静的过渡 | 3.0 s | `shots/05_空蒙.png` |
| 06 | 云海 Sea of Clouds | 云涛从谷底翻上来，吞没整个画面，再沉下去露出新景，镜头同时上升 | 三张 fbm 云层高度场，按“在云顶以下的深度”算透光，用低频噪声的梯度做上亮下暗的体积感；云色取画面顶部的天空色；遮挡式换景 | 高山、大场景、篇章级转换 | 3.6 s | `shots/06_云海.png` |
| 07 | 涟漪 Ripple | 两滴水先后落下，一圈圈波纹推开另一片画面，波峰上有碎光 | 径向阻尼波，用中心差分求斜率，再做折射位移，RGB 三通道偏移不同（轻微色散）；新画面在波前后面一段距离按圆展开 | 水景、回忆、“涟漪效应” | 2.6 s | `shots/07_涟漪.png` |
| 08 | 流水 River Current | 一股碧水从左上冲向右下，把新画面带进来，前沿有泡沫和焦散 | 沿水流拉长的 fbm 撕开前沿；水带里按流场做 4 次抖动采样的方向模糊（位移贴图）；碧色染色、两层噪声相乘的焦散、泡沫线 | 河流、时间流逝、流程推进 | 2.8 s | `shots/08_流水.png` |
| 09 | 金辉 Golden Light | 一缕金光从顶角扫过，新画面最亮的部分先出现，带漏光和光晕 | 按亮度键控：新画面的高光先过阈值；在近似线性光下提升曝光、偏暖，再用 ACES 压回；加角落漏光、水平光芒、高光周围的红色光晕，最后整体推向金色 | 日出、揭晓、高光时刻 | 2.8 s | `shots/09_金辉.png` |
| 10 | 御风 Ride the Wind | 镜头向前冲进雾里，两侧峭壁迎面掠过，冲出来已是新画面 | 径向缩放模糊（8 次采样），先加速后减速；飞行中加桶形畸变；两片峭壁是伪 3D（按列求墙面深度），带大气透视 | 快节奏推进、开场冲入主题 | 2.4 s | `shots/10_御风.png` |
| 11 | 风沙 Wind & Sand | 旧画面沿风向一粒粒剥落成沙，飞走后露出新画面，后面跟着一层细尘 | 把画面放进和风向对齐的网格（约 300 列），每格按阈值起飞；每个像素沿风向往上游回看 26 个格子，找出此刻飞过自己的沙粒；沙粒颜色取它起飞处的旧画面色 | 沙漠、消逝、“化为尘土” | 3.0 s | `shots/11_风沙.png` |
| 12 | 夜雨 Rain on Glass | 玻璃起雾，布满水珠，大水珠里先映出新画面，最后一片水幕往下滑，擦出新画面 | 三种尺度的水珠，每颗做鱼眼折射（倒像）；12 次黄金角采样模糊做雾玻璃；流淌的水滴带粘滑抖动；最后一片带挂珠的水幕往下擦 | 夜晚、雨天、情绪、回忆 | 3.4 s | `shots/12_夜雨.png` |
| 13 | 飞雪 Snow Squall | 一阵风雪从左上卷过，画面变成白茫茫一片，雪散后已是新画面 | 三道沿风向推进的前沿（到达、换景、离开），中间是拉长的 fbm 雪幕；三层视差雪花，每层是和风向对齐的网格；遮挡式换景 | 冬季、高原、艰难处境 | 3.2 s | `shots/13_飞雪.png` |
| 14 | 星河 Night Passage | 旧画面沉入夜色，天上出现星空和银河，天亮时已是新画面 | 用调色模拟一夜（蓝调时刻、入夜、东边先亮）；黑暗中按高度换景；星空只画在“天空”上（亮、偏上、平滑，用相邻像素差判断）；网格星点加 fbm 银河，整体缓慢旋转 | 时间跨度（“一夜之后”）、昼夜 | 3.6 s | `shots/14_星河.png` |
| 15 | 漏窗 Garden Window | 一面粉墙浮现，墙上有月洞窗和冰裂纹窗格，窗里是新画面，镜头推进穿过窗洞 | 全程序化 SDF：石灰墙、黛瓦、灰砖圆框、八角花心；冰裂纹是 5 层随机二分空间（自然形成 T 形交叉）；指数缩放 24 倍穿窗 | 江南、园林、建筑、“换个视角看” | 3.4 s | `shots/15_漏窗.png` |
| 16 | 折扇 Folding Fan | 一把折扇展开，扇面上是新画面，展开后放大到铺满全屏 | 极坐标扇形 15 折，奇偶面明暗不同，折痕压暗；竹骨、大边、扇钉；扇子在旧画面上投下柔和阴影；指数放大 | 江南、戏曲、文人雅集、“展开讲” | 3.2 s | `shots/16_折扇.png` |
| 17 | 印章 Seal Stamp | 一方朱文印失焦落下，落印时画面一震，印框里浸出新画面，然后整方印放大成全屏 | SDF 朱文印：方框加篆意“山”字；三层噪声做出印泥不匀、纸纹空洞和洇开；落印时镜头震动按指数衰减 | 结尾落款、定论、强调 | 3.0 s | `shots/17_印章.png` |
| 18 | 甩镜 Whip Pan | 镜头猛地横甩，画面拉成流光，停下时已是新画面 | 两幅图当作同一张全景上的两段；机位走 tanh S 曲线；每像素在快门时间内做 22 次时间采样（真实的运动模糊积分）；加卷帘快门和手持抖动 | 快节奏、地点跳转、A/B 对比 | 2.0 s | `shots/18_甩镜.png` |
| 19 | 移焦 Rack Focus | 焦点移开，旧画面化成光斑，新画面慢慢清晰 | 21 次黄金角螺旋采样做散景，带猫眼裁切和高光加权；交叉时按采样点逐个从旧图换到新图；对焦时画面有约 2% 的“呼吸”缩放 | 访谈、叙事、注意力转移 | 3.0 s | `shots/19_移焦.png` |
| 20 | 云影 Cloud Shadows | 一片云影随风扫过山谷，阴影经过的地方一块块换成新画面 | 云投影随风刚性平移；每像素沿风向往回看 7 步，用 log-sum-exp 软最大值，保证揭示单调、边缘圆润；阴影偏冷偏暗，天空区域不压暗 | 风景、轻柔的段落过渡 | 3.6 s | `shots/20_云影.png` |
| 21 | 撕纸 Torn Paper（新增） | 画面从上往下撕开一道锯齿口，两半带着白色纸芯向两侧飞走 | 斜线加三层值噪声做锯齿撕口；两半各有平移加旋转的刚体变换，像素按逆变换回到纸片自己的坐标取样；撕口内侧有宽窄不一的纸芯和纤维，纸片投影 | 推翻结论、强转折 | 1.8 s | `shots/21_撕纸.png` |
| 22 | 描线 Ink Line Growth（新增） | 笔尖从一角出发先勾出新画面的轮廓，旧画面褪成纸色，再一笔笔铺上颜色 | 对新画面做 Sobel 边缘检测得到线稿；勾线前沿 = 到起笔点的距离 × fbm；第二道前沿铺色，带水彩干边；前沿处墨更浓 | 讲解开始、从概念到画面 | 2.6 s | `shots/22_描线.png` |
| 23 | 排线 Engraving Sweep（新增） | 一道铜版雕刻带斜着扫过，所到之处画面变成排线版画，后面露出新画面 | 平行线条纹的线宽随亮度变化（暗处线粗），暗部叠交叉排线；线距按约 5 像素换算并抗锯齿；带内前半旧图、后半新图 | 铜版画风格的通用转场 | 2.2 s | `shots/23_排线.png` |
| 24 | 翻页 Page Turn（新增） | 画面像一页纸从右下角掀起，卷过圆弧翻到左上方 | 圆柱翻页：按到卷曲线的距离分三区，圆柱区用 asin 反算弧长，分正面（旧画面）和背面（纸色加一点透印）两层；新页上有卷曲投影 | 下一页、下一章、清单逐条 | 1.6 s | `shots/24_翻页.png` |

新增 4 式的写法和原作一致：只写 `vec4 transition(vec2 uv)`，用 PRELUDE 里的噪声和 `getFrom/getTo`，端点帧精确等于原图，不用 uTime。它们在 `demo.html` 下拉框里（第 21–24 项），GL 桥和 HyperFrames 里直接按 id 调用。实测（`tools/test_new.js`）：4 式 p=0、p=1 与输入最大差 0，同 p 渲染两次逐字节相同。在 ep01 画面上的效果见 `shots/_新增四式_ep01.png`。没有为这 4 式写纯 2D 版本，skia-canvas 里请用 GL 桥。

另外的截图：
- `shots/_总览.png`：20 式 × p = 0.25 / 0.5 / 0.75，原作影像。
- `shots/_demo占位图总览.png`：同样的总览，用 demo 的占位图，由 `lib/` 渲染。
- `shots/skia_gl_三式.png`、`shots/skia_2d_对照.png`：skia-canvas 管线验证。
- `shots/hyperframes_渲染抽帧.png`：HyperFrames 渲染结果的抽帧。

### uniform、噪声、缓动

每式都只用这几个 uniform：`uFrom`、`uTo`（两幅画面）、`uFromXf`、`uToXf`（裁切和 Ken Burns 变换）、`uProgress`、`uTime`、`uRes`、`uAspect`、`uSeed`，外加 MAIN 用的 `uGrain` 和 `uVignette`。每式具体用到哪些写在文件头和 `catalog.json` 的 `uniforms` 字段里。**不需要噪声纹理**，所有噪声都在 shader 里算（hash、值噪声、simplex、fbm）。

缓动曲线：`uProgress` 输入线性 p，各式在 shader 里自己做缓动和分段（比如印章 0–0.35 下落、0.35 落印、0.56 之后放大）。每个文件头的“缓动”一行写了具体曲线。

`uTime` 的作用：11 式用它做缓慢的漂移（云、雾、水）或逐帧重新抖动采样（移焦）。逐帧渲染时，把 time 设成帧时间（或转场开始后的秒数）就是确定的；设成固定值则画面完全只由 p 决定。原作的 seed 是随机的，这里默认 0.37。想要每次切换都不一样，就给每个切换点固定一个 seed。

## 用法

### 浏览器 / WebGL 页面

```html
<script src="lib/runner.js"></script>
<script src="lib/transitions/01_moran.js"></script>   <!-- 用哪式就引哪式；全部引入用 index.js + ShanheTransitions.load() -->
<script>
  const r = ShanheRunner.create(canvas);              // canvas 的 width/height 就是输出尺寸
  r.frame(imgA, imgB, 'moran', p, { seed: 0.37, time: t, grain: 0.035, vignette: 1 });
</script>
```

`frame` 的图源可以是 `<img>`、`<canvas>`、`<video>`、ImageBitmap，或 `{ width, height, data }`（RGBA，自上而下）。默认等比铺满裁切（cover）；`fit: 'stretch'` 改为拉伸；`fromXf/toXf` 可以直接给变换（做 Ken Burns）。同一个图源对象只上传一次；画布或视频的内容变了，就传 `refresh: true`。`r.readPixels()` 返回自上而下的 RGBA。

grain 和 vignette 默认是 0，这样 p=0 和 p=1 的输出与输入完全一致，转场前后的段落可以无缝拼接。想要原作的质感，就传 `grain: 0.035, vignette: 1`，并且转场前后的停留段也用同样的设置渲染。

### demo.html

直接双击打开（file:// 可用，不需要服务器）。

- 下拉框选 24 式，滑块拖进度，“播放”按建议时长播放，方向键切换上/下一式，空格播放/暂停。
- URL 参数：`demo.html?t=<名字>&p=0.37`。名字可以写 id（`moran`）、中文名（`墨染`）或编号（`1`）。给了 `p` 就进入定格模式：只显示画布，渲染完设置 `window.SHANHE_READY = true`。
- 其他参数：`seed`（默认 0.37）、`time`（默认 0）、`w`/`h`（默认 1920×1080）、`grain`、`vignette`、`ui=1`（定格模式下仍显示控件）。
- 逐帧渲染：页面加载后调用 `window.shanheFrame(p, id)` 再截图，不必每帧重新加载页面。`tools/test_demo.py` 就是这样一次截完 100 帧的。

### skia-canvas 管线

skia-canvas 只有 2D，没有 WebGL。我试了三种办法：

**方案 A：GL 桥（推荐，24 式都能用，像素和原版完全一致）。** `lib/node/gl-bridge.js` 在后台开一个无头 Chrome，加载 `runner.js` 和全部转场；Node 把 skia-canvas 画好的两幅场景传进去，拿回 RGBA，再 `putImageData` 回 skia-canvas，接着在上面画字幕和 HUD，最后照常送 ffmpeg。

```js
const { Canvas, ImageData } = require('skia-canvas');
const { createGLBridge } = require('./lib/node/gl-bridge');
const gb = await createGLBridge({ width: 1920, height: 1080 });
// 在每一帧里：
const px = await gb.frame(sceneA, sceneB, 'moran', p, { seed: 0.37, time: t, fromKey: 'A', toKey: 'B' });
ctx.putImageData(gb.toImageData(px, ImageData), 0, 0);
// …接着画字幕；结束时 await gb.close();
```

静态场景传 `fromKey/toKey`，只上传一次；场景本身在动，就不传 key，每帧上传。实测（RTX 4070，经 ANGLE D3D11）：960×540 约 38 ms/帧；1920×1080 约 150–320 ms/帧（墨染 146、甩镜 169、夜雨 190、云海 319）。时间大头花在 Node 和 Chrome 之间传 8 MB 的 base64 像素，不在 GPU 上。wupan 那样按 4 秒分块多进程渲染时，每个进程开一个桥就行。没有独显的机器上 Chrome 会退到 SwiftShader（CPU），结果一样，只是更慢。

**方案 B：改写成 2D canvas（不需要 GPU）。** `lib/node/canvas2d.js` 改写了 3 式，和 GL 原版的对比见 `shots/skia_2d_对照.png`：

| 式 | 怎么改 | 和原版的差别 | 1080p 耗时 |
|---|---|---|---|
| 卷轴 | 卷轴区域逐列 1px `drawImage`，用 `asin` 反算取样列；明暗、投影、泛黄都用整列的矩形和渐变叠出来 | 少了纸纤维和绫纹，其余几乎一致 | 约 99 ms |
| 甩镜 | 同样的 tanh 机位曲线；快门积分改成整幅叠印 16 次（running average）；镜像边用三段条带 | 少了卷帘快门的行偏移和按行抖动纹，观感接近 | 约 40 ms |
| 墨染（简化） | 墨团是角向多频正弦扰动的多边形（三滴墨的位置、时刻、半径曲线和原版同式）；灰度滤镜做墨灰，模糊遮罩让颜色往里回；水渍边用“填充 − 内缩填充”做 | 没有 fbm 毛边、毛细触须、纤维；墨色更淡 | 约 34 ms |

其他各式能否改 2D：
- **容易改**：移焦（`filter: blur()` 交叉淡化，散景光斑另画）、云影（低分辨率噪声遮罩放大）、折扇（扇形 clip 路径加放大）、印章（路径加 clip 加放大）、层峦（山脊 Path2D 加渐变）。
- **工作量大，但可以改**：漏窗（墙、瓦、窗格都要用路径重画）、飞白（需要纹理笔刷遮罩）、飞雪和风沙（粒子系统，要另外写粒子运动）。
- **不建议改**：涟漪、流水、云海、空蒙、金辉、星河、御风、夜雨。这几式要么逐像素位移取样，要么逐像素调色，用 2D 只能 `getImageData` 逐像素循环，1080p 会慢到几秒一帧，等于在 CPU 上重写 shader。这几式请用方案 A。

**方案 C：headless-gl（`npm i gl`）。** 在本机装不上：`gl` 在 Node 24 下没有预编译包，现编需要 Visual Studio 构建工具，本机没有（报错 `gyp ERR! find VS … Could not find any Visual Studio installation to use`）。装上 VS Build Tools 或换有预编译包的 Node LTS 后，理论上可以直接 `ShanheRunner.create(require('gl')(w, h), { width: w, height: h })`，因为 runner 接受现成的 WebGL1 上下文。**这条路没有实测**。

一键验证：`node examples/skia_render.js`。它会出两张截图，并生成 `examples/out/skia_demo.mp4`（960×540、30 fps、135 帧：GL 桥墨染 + 停留 + 2D 卷轴，每帧都在 skia-canvas 里叠了字）。ffmpeg 用 PATH 上的，或者用环境变量 `FFMPEG` 指定。

### HyperFrames

示例在 `examples/hyperframes/index.html`。用法：把它和 `lib/` 一起放进 HyperFrames 项目根目录。做法是一张 WebGL canvas，加一条暂停的 GSAP 时间轴：时间轴上只有一个线性 tween 把位置映射成 t，`onUpdate` 里按 t 算出当前处于哪个转场、p 是多少，再调 `runner.frame`。HyperFrames seek 到哪里，就画哪一帧。

```js
const state = { t: 0 };
const tl = gsap.timeline({ paused: true });
tl.to(state, { t: DUR, duration: DUR, ease: 'none', onUpdate: () => draw(state.t) });
window.__timelines['shanhe-demo'] = tl;      // 键名和 data-composition-id 一致
```

实测（hyperframes 0.8.22）：`npx hyperframes@0.8.22 lint` 0 错误 0 警告；`render -q draft --browser-gpu` 14.8 秒出 8 秒 1920×1080 视频，240 帧，抽帧见 `shots/hyperframes_渲染抽帧.png`，成片是 `examples/out/hyperframes_demo.mp4`。

几个注意点：
- 我先试了官方文档里的 `window.__hyperframes.registerFrameSource`（加 `data-no-timeline`）。lint 能过，但在 0.8.22 的渲染里，脚本执行时 `window.__hyperframes` 还不存在，240 帧全是 t=0 的画面。所以示例改用 GSAP 时间轴。新版本的 HyperFrames 可能支持 frame source，换版本后要重新验证。
- 不要用 `requestAnimationFrame` 或 `performance.now()`，lint 会报错。
- 场景是图片或 canvas 时直接用。场景是 HTML/DOM 时，要先把它变成纹理（HyperFrames 的 HTML-in-canvas，或者先截成图片），runner 只吃图片和 canvas。
- HyperFrames 自带一个 `@hyperframes/shader-transitions` 包（domain-warp、whip-pan 等 14 种），它从 DOM 场景抓图，接口和这个库不一样。能不能把山河各式注册进那个包，结论见下文“HyperFrames 的 shader-transitions 包”。

## 哪些依赖原素材，哪些通用

这 20 式 shader **都不依赖原作的照片或视频**。它们只读 `uFrom/uTo` 两张纹理，山脊、窗格、扇子、印章、云、雪、星都是程序生成的。原作里和素材相关的部分（11 个场景的照片和视频、Ken Burns 的焦点、策展表、字幕诗句、环境音）都在应用层，没有收进库。用占位图渲染全部 20 式的结果见 `shots/_demo占位图总览.png`。

不过有几式的观感依赖画面内容：

| 式 | 依赖什么 | 画面不满足时会怎样 |
|---|---|---|
| 星河 | 画面上方有平滑的亮天空（星空只画在“亮、偏上、平滑”的区域） | 星空不出现，只剩入夜和天亮的调色 |
| 金辉 | 画面里有明显的高光（雪顶、天空），新画面按亮度先后出现 | 暗场画面会变成一片暖光扫过 |
| 空蒙 | 用旧画面的亮度和高度估深度，假设上方是远景 | 纯 UI、代码截图上会退化成从上往下的雾化擦除 |
| 云海 | 云的颜色取画面顶部的天空色 | 顶部是深色 UI 时，云会偏灰偏暗 |
| 云影 | 明亮或偏蓝的上方区域当成天空，不压暗 | 影响很小 |

其余 15 式和画面内容无关，代码截图、图表、文字卡都能用。

## 我们的画风：误判心理学 ep01

用 ep01 的真实画面（米黄纸底、铜版画人物、拼贴卡片）测了全部 20 式。画面来自 ep01 渲染管线的拷贝：`tools/ep01_grab.js` 在进程里把字幕和左上角栏目名关掉，渲染出纯场景帧（ep01 的文件只读，没有改）。取了 6 对相邻镜头：蚂蚁→蚁巢、人头→No.1 卡、No.1 卡→西奥迪尼、便签→二分之一、游客→No.2 卡、实验图→人头。

结果见 `shots/_我们的画风_适配.png`（每式 4 格：同一对镜头 p=0.3/0.5/0.7，加另一对 p=0.5；左侧标评级和理由）：

- **好看，可以直接用**：墨染、飞白、卷轴、风沙、印章、甩镜、移焦。共同点是不改变纸色，或者本身就是纸、墨、印这类材质。
- **可用，挑场合**：空蒙（冷灰雾在暖纸上略脏）、涟漪、折扇（题材偏中国）、云影、金辉（纸本来就黄，金光不明显）。
- **出戏，不建议**：层峦、云海、流水、御风、夜雨、飞雪、星河、漏窗。它们要么把整片纸面盖成写实的云、雪、夜色，要么把暖纸染冷，要么是中国山水和园林题材，压住了西方版画人物。

在此基础上新做了 4 式（撕纸、描线、排线、翻页，见总表 21–24），专门对着纸张拼贴和铜版画风格写。

## 转场音效

原作的音频引擎全部是 Web Audio 实时合成：每个场景一层环境音（滤波噪声加漂移、阵风），古琴旋律（Karplus-Strong 拨弦，五声调式），每式转场一个音效配方（whoosh、纸沙沙、木头敲击、钟、水滴的组合，重拍对准画面的重拍）。详细拆解见 `学习笔记_节奏与手法.md` 第 5 节。

- `lib/audio/shanhe-audio.js`：引擎原样抽出（由 `tools/gen_audio.js` 生成），加了撕纸、描线、排线、翻页 4 式的配方。
- **离线渲染：** `ShanheAudio.renderTransition(id, { dur, seed })` 返回 AudioBuffer。渲染期间把 `Math.random` 换成固定种子的随机数，随机结构由 seed 固定。本轮跨浏览器会话复测，16 位 PCM 最大差为 1 个量化单位，峰值相同；不承诺不同会话 WAV 逐字节一致。只走音效总线，环境音和古琴不出声。
- **Node 导出：** `node lib/audio/render_wav.js <目录> moran:3 yinzhang:3:2 …`（id:时长:种子）。48 kHz 立体声 16-bit，音效从 0.05 秒开始，后面留 2.5 秒混响尾巴。
- **接 Python 混音：** `lib/audio/shanhe_sfx.py` 里的 `shanhe(id, d, seed)` 返回 `(2, N)` 的 numpy 数组（第一次调用时渲染并缓存到 `lib/audio/.cache/`）。要接 ep01：
  ```
  python lib/audio/shanhe_sfx.py <ep01>/audio/sfx.py <events.json> <输出.wav>
  ```
  events.json 的 `ev` 里加 `{"t": 55.2, "k": "shanhe", "id": "yinzhang", "d": 3.0, "g": 1.0}`。脚本在内存里给 sfx.py 的 `fx()` 加一个 `shanhe` 分支、把输出路径换掉，然后照原样执行，所以 ep01 原有的音色、混响、限幅都不变，sfx.py 文件本身不动。实测：用 ep01 的 events.json 加两个山河事件（55.2 秒印章、120.5 秒撕纸），92 个事件全部合成；和 ep01 原来的 sfx.wav 相比，只有这两处有差别，其余时间差值为 −240 dB（位相同）；ep01 的 sfx.wav 哈希不变。

## 试用片

`examples/out/误判画风_转场试用.mp4`：1920×1080，30 fps，25.2 秒，756 帧，AAC 48 kHz 立体声。用 ep01 的 7 个镜头串起 6 式：

| 时刻 | 镜头 | 转场 | 时长 |
|---|---|---|---|
| 1.6 s | 人头（IF 代码卡）→ No.1「一分钱一分货」 | 排线 | 2.2 s |
| 5.2 s | No.1 → 西奥迪尼打电话 | 翻页 | 1.6 s |
| 8.4 s | 西奥迪尼 → 便签 | 墨染 | 2.6 s |
| 12.4 s | 便签 → 二分之一 | 飞白 | 2.2 s |
| 16.2 s | 二分之一 → No.2「最好比的」 | 撕纸 | 1.8 s |
| 19.4 s | No.2 → 人头（认知倾向） | 印章 | 3.0 s |

- 每个镜头停 1.4–2.4 秒，入场就开始 2–6% 的慢推，转场期间两侧都继续推（照原作的 Ken Burns 写法）。
- 左下角的纸签写当前用的式名，是在 skia-canvas 里画的，证明转场帧回到了 2D 管线。片头 0.3 秒从纸色淡入，片尾 0.6 秒淡回纸色。
- 声音只有 6 式转场音效（`render_wav.js` 渲染，`examples/trial_mix.py` 叠加，0.8 秒、10% 湿的房间混响，峰值归一到 −3 dBFS），真峰值 −4.1 dBFS。没有配音和 BGM。
- 重做：`node examples/trial_ep01.js <帧目录>`（帧目录用 `tools/ep01_grab.js` 生成，时刻是 53 56.2 62 90 100 124.6 185）。加 `--fast` 出 960×540 预览。全分辨率本机约 9 分钟，主要耗在 GL 桥传像素。

## HyperFrames 的 shader-transitions 包

结论：**接不进去，用本库自己的 runner 替代。** 详细见 `docs/hyperframes_shader-transitions.md`。要点：`@hyperframes/shader-transitions@0.8.210` 的 shader 表是模块内部私有的 14 个条目，没有注册接口（查不到名字直接抛错）；它的 uniform 约定（`u_from/u_to/u_progress`，完整 `main()`）和山河不同，也没有 seed、time、Ken Burns 变换；而且它在 GSAP 里做缓动，山河的缓动写在 shader 里，接进去会缓动两次。替代做法就是上面"30 秒上手"里的 canvas + GSAP 时间轴，已经在 hyperframes 0.8.22 上 lint 和渲染验证过。

## 最帅的 5 式

1. **墨染**：好在材质。它不是简单的圆形溶解，而是把宣纸上墨的行为拆开做了：墨团先把新画面压成墨灰，然后颜色才从里面“开”出来；前沿有一圈墨堆起来的深色水渍；前沿外有沿径向长出来的毛细触须和宣纸纤维。三滴墨错开 0.11 落下，节奏有先后。原作把它当开场，从纸色进入第一幅画，和中国风内容最贴。
2. **卷轴**：好在运动方向和形式感。画面真的卷在一根有体积的轴上（`asin` 做圆柱映射，带漫反射、高光、投影），向右展开时你能在轴上看到还没展开的那段新画面；刚展开的纸先泛黄再褪色，上下带绫边和金线，“打开一幅手卷”的动作一眼就能看懂。
3. **漏窗**：好在叙事。它不只换画面，还换了视角：先在旧画面上浮出一面粉墙（石灰斑驳、黛瓦、灰砖圆框、冰裂纹窗格全是 SDF 画的），窗里已经是新景，然后镜头推进穿过窗洞，就是园林里的“移步换景”。三段时间（墙浮现、侧移落定、推镜）衔接得很顺。
4. **印章**：好在节奏。前 0.35 印章失焦悬着下落，投影慢慢收拢；落印那一帧有一次指数衰减的震动和轻微挤压；随后印框里的新画面从中心浸开，最后整方印放大成全屏。“悬、落、浸、开”四拍很清楚，很适合当结尾或者下结论的那一下。
5. **甩镜**：好在运动的真实感。它没有用简单的方向模糊，而是在快门时间内对机位做 22 次时间积分：机位走 tanh 曲线，中间最快，两端快门角收到 0（端帧是精确原图）；还加了卷帘快门和随速度变化的手持抖动。2 秒一式，是 20 式里最快的，适合在慢的水墨式之间换口气。

候补：层峦（五层山的视差和花青到焦墨的色阶很漂亮）、折扇（展开过程扇面明暗变化细）、风沙（沙粒是逐粒算的，不是贴的粒子图）。

## 取证与验证

- **原文件逐式截图**（`tools/shoot_original.py`）：用 Playwright 驱动本机 Chrome 打开原文件（只读）。页面是真 GPU（`ANGLE (NVIDIA GeForce RTX 4070 Laptop GPU, D3D11)`，WebGL 1.0）。在页面里直接调原文件自己的 `ShanheCore` 渲染器和 `SHANHE_TRANSITIONS`，每式用策展表里第一次出现的那对场景照片，按 seed 0.37、time 6、颗粒 0.035、暗角 1 渲染 5 帧，共 100 帧，**20 式全部截到，没有失败的**。截图用的是场景照片，不是视频帧（视频帧需要等解码，照片可以精确复现），画面按 cover 铺满，没有加 Ken Burns。我还用原文件自带的测试钩子 `?still=0&tr=cengluan&p=0.5` 和 `?still=8&tr=juanzhou&p=0.5` 截了整页（带字幕和视频帧），确认两种方式渲染的转场一致；这两张整页截图是中间文件，没有保留。
- **库与原版逐像素一致**（`tools/test_demo.py`）：把原文件的 `ShanheCore` 和原转场脚本注入 demo 页，用同样的输入，与 `lib/runner.js + lib/transitions` 对比 20 式 × 8 个 p（0、0.13、0.25、0.5、0.61、0.75、0.88、1），**最大像素差 0**。
- **确定性**：同一个 p 渲染，中间插一帧别的 p，再渲染同一个 p，20 式两次结果逐字节相同。GL 桥的端点帧：p=0 等于输入甲、p=1 等于输入乙，最大差 0（墨染、折扇、云海）。
- **demo.html**：`?t=moran&p=0.37`、`?t=折扇&p=0.37`、`?t=17&p=0.5` 三种写法都定格到正确的式和进度；下拉框有 24 项（第二轮重测），切换、滑块都正常；没有页面错误。
- **视频**：`skia_demo.mp4`（135 帧）和 `hyperframes_demo.mp4`（240 帧）都用 `ffmpeg -v error -f null` 完整解码过，没有错误。

## 没做到 / 待确认

- headless-gl 没装成（缺 Visual Studio 构建工具），所以 skia-canvas 管线用的是“无头 Chrome 当 GPU”的桥。如果以后要纯 Node 方案，需要先装 VS Build Tools。
- GL 桥 1080p 每帧 150–320 ms，主要耗在传像素。长片可以多进程分块，或者干脆整段转场在 Chrome 里渲染成 PNG 序列再合成。
- 2D 改写的墨染是简化版，没有毛边和触须，墨色比原版淡。
- HyperFrames 的 `registerFrameSource` 在 0.8.22 上没有驱动到帧，示例改用了 GSAP。`@hyperframes/shader-transitions` 没有注册接口，接不进去（见上文和 `docs/`）。
- 新增 4 式没有纯 2D 版本，只能走 GL 桥。描线依赖新画面有清楚的轮廓，大面积平涂的照片上线稿会比较碎。
- 第二轮旧试用片的镜头是 ep01 的静止帧，加了慢推（本轮精选试用已改为真实动态镜头）。ep01 画面本身的动画（蚂蚁走动、卡片飞入）在转场里没有动，因为每个镜头只取了一帧；正片里要逐帧把两个场景都渲染出来再交给转场（`gb.frame` 不传 key，每帧上传）。
- 原版 `yinzhang` 保留“山”字；精选版 `wp_yinzhang` 已换成代码绘制的“误判”。
- 试用片只有转场音效，没有配音和 BGM。音效在正片里的电平需要跟 ep01 的 `mix.js` 一起调（ep01 的音效总线是 −5 dB）。
- `shots/` 里的原文件截图含原作照片（来自 Wikimedia Commons，原作的“图片来源”里写了各自的许可）。它们只用于取证，`lib/`、`demo.html`、`examples/` 里都没有原作素材。
- 原作的环境音和古琴已经随音频引擎一起抽进 `lib/audio/shanhe-audio.js`，但离线渲染只开放了转场音效；环境音是中国山水题材，我们的系列用不上，没有做离线导出。

GitHub 仅含代码、文档、占位图/ep01 截图；不含 `source/`、原作照片截图、mp4/wav、依赖和任务日志。`gen_lib.js`、`gen_audio.js`、`strip.py`、`shoot_original.py` 是本地取证/再生成工具，需要自行提供原文件；直接调用已生成的 `lib/` 无需原文件。

DONE
