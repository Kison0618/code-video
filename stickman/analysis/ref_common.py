"""原片逐帧学习工具的公共部分：读视频（按原生帧率、不复制首帧）、按角色颜色抠人、字体。

坑：ffmpeg 用 -ss 跳转后默认按恒定帧率输出，会把第一帧复制一份（第 0、1 帧一样，看起来像"停了一帧"）。
所以这里一律加 -map 0:v -fps_mode passthrough，一帧就是原片的一帧。
编程集文件是 30fps，但动画本身是 24fps（每 5 帧有 1 帧和上一帧一样），数帧时要换算成 24fps。
"""
import json, subprocess, shutil
import numpy as np
from PIL import ImageFont

# 角色颜色（实测）：数学 / 几何 / 物理的橙色空心头主角，编程集的黄色实心头主角，我们渲染的黄色角色
COLORS = {'orange': (255, 110, 0), 'yellow': (252, 196, 1)}
# 头外径 / 站立身高（实测，见 研究/动作逐帧_四集.md 第 0 节）
HEAD_RATIO = {'orange': 0.32, 'yellow': 0.22}


def probe(src):
    """返回 (宽, 高, 帧率)"""
    out = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                          'stream=width,height,r_frame_rate', '-of', 'json', src], capture_output=True, text=True).stdout
    s = json.loads(out)['streams'][0]
    n, d = s['r_frame_rate'].split('/')
    return int(s['width']), int(s['height']), float(n) / float(d)


def read_frames(src, t0, t1):
    """t0–t1 秒之间的每一帧（原生帧率），返回 (帧数组 N×H×W×3, 帧率)"""
    W, H, fps = probe(src)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t0), '-t', str(t1 - t0), '-i', src, '-map', '0:v',
                          '-fps_mode', 'passthrough', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3), fps


def read_frame(src, t):
    W, H, _ = probe(src)
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(t), '-i', src, '-map', '0:v', '-frames:v', '1',
                          '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], capture_output=True).stdout
    return np.frombuffer(raw, np.uint8).reshape(H, W, 3)


def mask(f, color='orange'):
    """按角色颜色抠出火柴人（布尔图）"""
    c = COLORS[color]; x = f.astype(np.int16)
    return (np.abs(x[..., 0] - c[0]) < 60) & (np.abs(x[..., 1] - c[1]) < 60) & (x[..., 2] < 90)


def font(size, cjk=False):
    """找一个能用的字体：中文用 Noto Sans SC / 思源黑体，英文数字用等宽字体；都找不到就用 PIL 自带的"""
    cands = (['/usr/share/fonts/google-noto-cjk/NotoSansSC-Regular.otf', '/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc',
              '/usr/share/fonts/noto-cjk/NotoSansCJK-Regular.ttc', '/System/Library/Fonts/PingFang.ttc', 'C:/Windows/Fonts/msyh.ttc']
             if cjk else ['/usr/share/fonts/liberation-mono/LiberationMono-Regular.ttf',
                          '/usr/share/fonts/truetype/liberation/LiberationMono-Regular.ttf', '/System/Library/Fonts/Menlo.ttc',
                          'C:/Windows/Fonts/consola.ttf'])
    if shutil.which('fc-match'):
        q = 'sans:lang=zh-cn' if cjk else 'monospace'
        p = subprocess.run(['fc-match', '-f', '%{file}', q], capture_output=True, text=True).stdout.strip()
        if p: cands.append(p)
    for p in cands:
        try: return ImageFont.truetype(p, size)
        except OSError: pass
    return ImageFont.load_default()
