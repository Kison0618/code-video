// 竖屏 1080×1920：同一条 0–208.5 秒时间线、同一条音轨，镜头和版式重排（demo.html?ar=9x16）。帧图片放在 .render-tmp/frames-9x16
process.env.AR = '9x16';
require('./render-local.cjs');
