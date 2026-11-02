/* 05 空蒙 · Misty Depth（水墨）
 * 山色空蒙，雾自远处漫来，近景最后显现。
 *
 * 原理：用旧画面的亮度和画面高度拼一张"伪深度图"（上方、亮处 = 远），再加 fbm 扰动；阈值从远扫到近，越过阈值的像素换成新画面。阈值附近是一条雾带：前端陡、尾巴长，带内对两幅图都做六点小模糊，雾色取两图平均色调。效果是雾从远处漫来、近景最后显现。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：阈值 T = mix(-0.28, 1.43, e)，e = mix(p, ease(p), 0.2)；雾浓度在 p<0.14 淡入、p>0.82 淡出。
 * 建议时长：3.0 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：抒情、慢节奏、安静的过渡；原作在"减少动态效果"模式下用它代替其他转场。
 * 素材：最好是上方为天空/远景的画面；纯 UI 截图上会退化成自上而下的雾化擦除
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 5,
  "id": "kongmeng",
  "zh": "空蒙",
  "en": "Misty Depth",
  "family": "水墨",
  "desc": "山色空蒙，雾自远处漫来，近景最后显现。",
  "duration": 3,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uTime",
    "uAspect",
    "uSeed"
  ],
  "usesTime": true
}, {
  easing: "阈值 T = mix(-0.28, 1.43, e)，e = mix(p, ease(p), 0.2)；雾浓度在 p<0.14 淡入、p>0.82 淡出。",
  glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);   // exact end frames
  if (p >= 1.0) return getTo(uv);
  vec2 P = vec2(uv.x * uAspect, uv.y);
  vec3 a = getFrom(uv).rgb;
  vec3 b = getTo(uv).rgb;

  // small rotated-hexagon average of each image (soft, not a ghosted cross)
  float rot = uSeed * 6.2832;
  vec3 ab = vec3(0.0), bb = vec3(0.0);
  for (int i = 0; i < 5; i++) {
    float an = rot + float(i) * 1.2566;
    vec2 o = vec2(cos(an) / uAspect, sin(an)) * 0.010;
    ab += getFrom(uv + o).rgb;
    bb += getTo(uv + o).rgb;
  }
  ab = (ab + a) / 6.0;
  bb = (bb + b) / 6.0;

  float t = uTime;
  float n = fbm(P * 1.8 + vec2(t * 0.03, t * 0.008) + uSeed * 23.0);
  // pseudo-depth from the OLD scene only: 0 = far (bright, high), 1 = near (dark, low)
  float d = 1.0 - (0.2 * luma(ab) + 0.8 * uv.y) + (n - 0.5) * 0.45;

  float e = mix(p, ease(p), 0.2);
  float T = mix(-0.28, 1.43, e);                           // full range of d (-0.23..1.23) plus the edge
  float m = smoothstep(d - 0.1, d + 0.1, T - 0.06);       // the new scene settles out of the mist's tail

  // mist band at the threshold: a soft wall ahead, long tail behind
  float x = d - T;
  float band = x > 0.0 ? exp(-x * x / 0.015) : exp(-x * x / 0.06);
  float wisp = fbm3(vec2(P.x * 1.3 - t * 0.05, P.y * 5.5) + uSeed * 13.0 + n);
  float env = smoothstep(0.0, 0.14, p) * (1.0 - smoothstep(0.82, 1.0, p));
  float dens = clamp(band * (0.55 + 0.9 * wisp * wisp), 0.0, 1.0) * env;

  vec3 sharp = mix(a, b, m);
  vec3 soft = mix(ab, bb, m);
  vec3 img = mix(sharp, soft, clamp(dens * 1.5, 0.0, 1.0));
  // mist takes a light tint from both scenes so it isn't a cold veil over warm photos
  vec3 avg = 0.5 * (ab + bb);
  vec3 mistC = mix(vec3(0.86, 0.89, 0.92), avg * 0.35 + 0.62, 0.45);
  vec3 col = mix(img, mistC, dens * 0.95);
  col += vec3(0.95, 0.96, 1.0) * dens * dens * 0.05;   // luminous core
  return vec4(col, 1.0);
}
`,
}));
