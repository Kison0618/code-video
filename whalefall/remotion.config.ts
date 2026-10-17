import {Config} from '@remotion/cli/config';

// 3D 场景需要 GPU：Windows 上 angle 走 D3D11，走显卡渲染。
// 本机没有显卡时，用命令行参数 --gl=swiftshader 覆盖。
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(95);
Config.setCodec('h264');
Config.setCrf(16);
Config.setPixelFormat('yuv420p');
// 每帧都要等 3D 场景画完，单帧可能较慢
Config.setDelayRenderTimeoutInMilliseconds(120000);
if (process.env.REMOTION_BROWSER) {
	Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
}
