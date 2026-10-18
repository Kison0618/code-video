# 无助

- `无助_demo_前1分钟.mp4`：v1 版 0–62 秒 demo，1080p 30fps，配 `reference-videos/BGM.m4a`，17.05 秒片名卡点。
- `demo.html`：全部画面和字幕。`window.render(t)` 画出第 t 秒的画面，字幕在文件里的 `SUBS` 数组中。
- `render.js`：逐帧截图。
- `文案.md`：完整文案和时间。
- `关键帧/`：风格关键帧；`关键帧/完整版/` 是后半段自查用的静帧。

## 在本地渲染（完整版 2:40）

在这个目录下运行：

```bash
npm i
npx playwright install chromium

# 1. 逐帧渲染，0–159.75 秒，30fps
#    最后两个数是“第几个进程 / 共几个进程”。比如开 4 个窗口，分别跑 :0:4、:1:4、:2:4、:3:4
node render.js frames 0:159.75:30:0:1

# 只看几个时刻的静帧
node render.js stills 17.3,59.5,85.5,94.2,146,157.5

# 2. 拼 BGM：原曲 0–129.70 秒，接上 99.95 秒到结尾，一共 159.75 秒
ffmpeg -i ../reference-videos/BGM.m4a -filter_complex "[0]atrim=0:129.70,asetpts=PTS-STARTPTS[a];[0]atrim=start=99.95,asetpts=PTS-STARTPTS[b];[a][b]concat=n=2:v=0:a=1[m]" -map "[m]" bgm_full.wav

# 3. 合成视频
ffmpeg -framerate 30 -i frames/f_%05d.jpg -i bgm_full.wav -map 0:v -map 1:a -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -af "afade=t=out:st=158.3:d=1.45" -shortest 无助_完整版.mp4
```

想用自己装的 Chrome，先设好环境变量 `CHROME_PATH`，指向浏览器程序的路径。

## 更新记录

- v2：
  - 重画了趴着的狗：下巴搭在前爪上，加了耳朵、后腿和闭着的眼睛。
  - 56.8 秒改成“区别只在于，它的经历告诉它——”，59 秒屏幕中央砸出大字“做什么，都没用”，逐字从模糊放大到清晰，带冷色光晕和轻微震动，背景压暗。
  - 时长改为 63.8 秒。
  - `无助_demo_前1分钟.mp4` 还是 v1，v2 请在本地渲染。
- 完整版：
  - 63.6–159.75 秒全部做完，接到 2:40。
  - 后半段只沿用那只狗的故事，不再加新实验。
  - 77 秒落到“总被说笨、总被说不会说话”。
  - 93.57 秒翻转：“我们弄反了”。
  - 后面给出做法：对店员说一句谢谢、挑一道会做的题打个勾、睡前写下一件“有用”的小事；右上角“有用”计数一次次往上加。
  - 结尾回到开头那个人，他投出了第 31 份。
