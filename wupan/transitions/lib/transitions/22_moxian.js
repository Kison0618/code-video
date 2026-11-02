/* 22 描线 · Ink Line Growth（纸张版画）
 * 笔尖从一角出发，在纸上先勾出新画面的轮廓，再一笔一笔铺上颜色。
 *
 * 原理：对新画面的亮度做 Sobel 边缘检测，得到它的轮廓线，用墨色画出来。勾线前沿是"到起笔点的距离 × fbm 扰动"，所以线条像从一个点沿着纸面生长出去；前沿刚到的地方墨更浓（湿笔尖）。前沿后面旧画面褪成米黄纸色，只剩淡淡的残影。上色前沿追上来时，新画面的颜色从线稿里铺出来，前沿带一圈水彩干边。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：第一道前沿（勾线）用 ease(p/0.62) 从起笔点扩出去；第二道前沿（上色）在 0.36–0.95 之间 smoothstep 追上来；0.75–1 线条淡出。
 * 建议时长：2.6 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uRes, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用："把它画出来"、讲解开始、从概念到具体画面；线稿/版画风格的画面效果最好。
 * 素材：新画面要有清楚的轮廓（版画、插画、图表、文字都很好）；大面积平涂或照片的轮廓线会比较碎
 * 源：转场库新增（照原作写法：PRELUDE + transition(uv)，辅助函数加式名前缀），定义在 tools/new_transitions.js。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 22,
  "id": "moxian",
  "zh": "描线",
  "en": "Ink Line Growth",
  "family": "纸张版画",
  "desc": "笔尖从一角出发，在纸上先勾出新画面的轮廓，再一笔一笔铺上颜色。",
  "duration": 2.6,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uRes",
    "uAspect",
    "uSeed"
  ],
  "usesTime": false
}, {
  easing: "第一道前沿（勾线）用 ease(p/0.62) 从起笔点扩出去；第二道前沿（上色）在 0.36–0.95 之间 smoothstep 追上来；0.75–1 线条淡出。",
  glsl: `
float moxian_edge(vec2 uv) {
  vec2 e = vec2(1.5 / uRes.x, 1.5 / uRes.y);
  float tl = luma(getTo(uv + vec2(-e.x, e.y)).rgb), t = luma(getTo(uv + vec2(0.0, e.y)).rgb), tr = luma(getTo(uv + e).rgb);
  float l = luma(getTo(uv - vec2(e.x, 0.0)).rgb), r = luma(getTo(uv + vec2(e.x, 0.0)).rgb);
  float bl = luma(getTo(uv - e).rgb), b = luma(getTo(uv - vec2(0.0, e.y)).rgb), br = luma(getTo(uv + vec2(e.x, -e.y)).rgb);
  float gx = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
  float gy = (tl + 2.0 * t + tr) - (bl + 2.0 * b + br);
  return smoothstep(0.12, 0.5, length(vec2(gx, gy)));
}
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  vec2 P = vec2(uv.x * uAspect, uv.y);
  vec2 S = vec2((0.08 + 0.2 * fract(uSeed * 3.7)) * uAspect, 0.78 + 0.15 * fract(uSeed * 5.3));   // pen starts near the upper left
  float span = length(vec2(uAspect, 1.0)) * 0.95;
  float n = fbm(P * 3.0 + uSeed * 17.0);
  float r = length(P - S) / span * (0.75 + 0.5 * n);
  float F1 = mix(-0.08, 1.25, ease(clamp(p / 0.62, 0.0, 1.0)));
  float F2 = mix(-0.2, 1.3, smoothstep(0.36, 0.95, p));
  vec3 a = getFrom(uv).rgb, b = getTo(uv).rgb;
  vec3 paper = vec3(0.93, 0.9, 0.82);
  vec3 inkC = vec3(0.09, 0.075, 0.06);

  float drawn = smoothstep(0.0, 0.03, F1 - r);
  float ghost = smoothstep(0.0, 0.12, F1 - r);
  vec3 col = mix(a, mix(paper, a, 0.15) * (0.97 + 0.05 * n), ghost * 0.9);   // old scene fades into paper behind the pen
  float fill = smoothstep(0.0, 0.1, F2 - r + (vnoise(P * 9.0 + uSeed) - 0.5) * 0.05);
  float bloomEdge = exp(-pow((F2 - r) / 0.02, 2.0)) * smoothstep(0.36, 0.5, p) * (1.0 - smoothstep(0.85, 1.0, p));
  vec3 wash = b * (1.0 - 0.18 * bloomEdge);                                  // watercolour dry edge
  col = mix(col, wash, fill);

  float ed = moxian_edge(uv);
  float wet = 1.0 + 0.6 * exp(-max(F1 - r, 0.0) / 0.025);                    // fresh ink at the pen tip
  float lineFade = 1.0 - smoothstep(0.75, 1.0, p);
  float lineA = ed * drawn * clamp(wet * (1.0 - 0.45 * fill), 0.0, 1.0) * lineFade;
  col = mix(col, inkC, lineA * 0.9);
  // the pen tip itself: a small dark bead riding the front
  float tip = exp(-pow((F1 - r) / 0.006, 2.0)) * ed * step(p, 0.65);
  col = mix(col, inkC, clamp(tip, 0.0, 1.0));
  return vec4(col, 1.0);
}
`,
}));
