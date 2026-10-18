# 无助 · 前 1 分钟 demo

- `无助_demo_前1分钟.mp4`：0–62 秒 demo，1080p 30fps，配 `reference-videos/BGM.m4a`，17.05 秒片名卡点。
- `demo.html`：全部画面和字幕。`window.render(t)` 画出第 t 秒的画面，字幕在文件里的 `SUBS` 数组中。
- `render.js`：逐帧截图。
- `关键帧/`：4 张风格关键帧和它们的源码 `frames.html`。

## 在本地渲染

在这个目录下运行：

```bash
npm i
npx playwright install chromium

# 逐帧渲染，0–62.3 秒，30fps；最后两个数是“第几个进程 / 共几个进程”，可以开多个窗口并行
node render.js frames 0:62.3:30:0:1

# 只看几个时刻的静帧
node render.js stills 5.8,17.3,30,59

# 合成视频并配 BGM
ffmpeg -framerate 30 -i frames/f_%05d.jpg -ss 0 -t 62.3 -i ../reference-videos/BGM.m4a -map 0:v -map 1:a -c:v libx264 -crf 18 -pix_fmt yuv420p -c:a aac -b:a 192k -af "afade=t=out:st=60.6:d=1.7" -shortest 无助_demo.mp4
```

想用自己装的 Chrome，先设好环境变量 `CHROME_PATH`，指向浏览器程序的路径。
