"""真实照片 → 白底铜版画胸像（035 芒格）。

python tools/engrave.py [--src assets/_dl/munger_commons.jpg] [--out assets/eng_munger.png]
                        [--crop-out out/_p_crop.png] [--mask-out out/_p_mask.png]

步骤：裁胸像 → 按亮度抠出人（黑背景）→ 放大 2 倍、对比度拉伸 → 斜向线网（线宽随暗度）
      + 暗部交叉线 + 最暗处第三层 + DoG 轮廓线（眼镜、五官、领带）+ 剪影外轮廓 → 墨色 #2a2118 白底
"""
import argparse
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

INK = np.array([42, 33, 24], np.float32)
P = dict(
    crop=(150, 320, 1090, 1025),   # x0, y0, x1, y1（原图像素）：头顶留空，下沿在盘子和纸以上
    th=20,                          # 抠图亮度阈值（0–255，先做 1.5px 高斯）。背景约 0–12，西装暗边约 25–40
    scale=2,
    lo=1.5, hi=99.0,                # 对比度拉伸的百分位（只在人身上统计）
    gamma=1.45,                     # 暗度曲线（>1：中间调变浅，脸和白发多留白）
    period=7.0,                     # 主线网周期（放大后的像素）
    ang1=38, ang2=-52, ang3=82,     # 三层线的角度（度）
    t2=0.50, t3=0.78,               # 第二层、第三层开始出现的暗度
    warp=2.2,                       # 线随明暗弯曲的幅度（周期的倍数），让排线顺着形体走
    dog=(0.7, 2.2, 0.026, 0.075),   # DoG 轮廓：sigma1, sigma2, 起点, 满墨
)


def luminance(a):
    return a[..., 0] * 0.299 + a[..., 1] * 0.587 + a[..., 2] * 0.114


def make_mask(lum, th):
    m = ndi.gaussian_filter(lum, 1.5) > th
    m = ndi.binary_opening(m, iterations=2)
    m = ndi.binary_closing(m, iterations=4)
    lab, n = ndi.label(m)
    if n > 1:
        sizes = ndi.sum(m, lab, range(1, n + 1))
        m = lab == (1 + int(np.argmax(sizes)))
    m = ndi.binary_fill_holes(m)
    # 边缘平滑：模糊后再取阈值，去掉 JPEG 噪点留下的毛刺
    m = ndi.gaussian_filter(m.astype(np.float32), 2.0) > 0.5
    return m


def screen(h, w, ang, period, width, warp_field):
    """平行线：width（0..period）是每点该有的线宽，返回 0..1 的墨量（带 1px 抗锯齿）。"""
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    a = np.deg2rad(ang)
    s = xx * np.cos(a) + yy * np.sin(a) + warp_field * period
    d = np.abs(np.mod(s, period) - period / 2)          # 到最近一条线中心的距离
    # 宽度不到 1px 的线按比例变淡：亮部不留一根根细线
    return np.clip(width / 2 - d + 0.5, 0, 1) * np.clip(width, 0, 1)


def engrave(rgb, mask, p):
    h, w = mask.shape
    lum = luminance(rgb)
    lo, hi = np.percentile(lum[mask], [p['lo'], p['hi']])
    L = np.clip((lum - lo) / (hi - lo), 0, 1)
    # 轻微局部对比：把大块明暗的差异压一点，细节（眼镜、皱纹）拉出来
    base = ndi.gaussian_filter(L, 30)
    L = np.clip(base + (L - base) * 1.3, 0, 1)
    D = (1 - L) ** p['gamma']                            # 暗度 0..1
    Ds = ndi.gaussian_filter(D, 1.2)
    warp = ndi.gaussian_filter(L, 10) * p['warp']
    per = p['period']
    ink = screen(h, w, p['ang1'], per, np.clip(Ds * 1.05, 0, 1) * per * 0.92, warp)
    d2 = np.clip((Ds - p['t2']) / (1 - p['t2']), 0, 1)
    ink = np.maximum(ink, screen(h, w, p['ang2'], per, d2 * per * 0.75, warp * 0.6))
    d3 = np.clip((Ds - p['t3']) / (1 - p['t3']), 0, 1)
    ink = np.maximum(ink, screen(h, w, p['ang3'], per * 0.9, d3 * per * 0.6, warp * 0.3))
    # DoG 轮廓线：暗细线（眼镜框、眼睛、嘴、领带、衣领）
    s1, s2, a0, a1 = p['dog']
    dog = ndi.gaussian_filter(L, s1 * p['scale']) - ndi.gaussian_filter(L, s2 * p['scale'])
    edge = np.clip((-dog - a0) / (a1 - a0), 0, 1)
    ink = np.maximum(ink, edge)
    # 剪影外轮廓：闭合，cutout.js 才能把里面的高光（白发、额头）当成人的一部分
    er = ndi.binary_erosion(mask, iterations=3)
    rim = mask & ~er
    ink = np.maximum(ink, ndi.gaussian_filter(rim.astype(np.float32), 0.7) * 1.6)
    ink = np.clip(ink, 0, 1) * mask
    out = 255 * (1 - ink[..., None]) + INK * ink[..., None]
    return np.clip(out, 0, 255).astype(np.uint8)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--src', default='assets/_dl/munger_commons.jpg')
    ap.add_argument('--out', default='assets/eng_munger.png')
    ap.add_argument('--crop-out')
    ap.add_argument('--mask-out')
    ap.add_argument('--th', type=float, default=P['th'])
    a = ap.parse_args()
    p = dict(P, th=a.th)
    im = Image.open(a.src).convert('RGB').crop(p['crop'])
    if a.crop_out:
        im.save(a.crop_out)
    big = im.resize((im.width * p['scale'], im.height * p['scale']), Image.LANCZOS)
    rgb = np.asarray(big, np.float32)
    mask = make_mask(luminance(np.asarray(im, np.float32)), p['th'])
    mask = np.asarray(Image.fromarray(mask.astype(np.uint8) * 255).resize(big.size, Image.BILINEAR)) > 127
    if a.mask_out:
        Image.fromarray(mask.astype(np.uint8) * 255).save(a.mask_out)
    Image.fromarray(engrave(rgb, mask, p)).save(a.out)
    print('wrote', a.out, big.size, 'mask %.1f%%' % (mask.mean() * 100))


if __name__ == '__main__':
    main()
