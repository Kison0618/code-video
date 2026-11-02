/* 20 云影 · Cloud Shadows（电影）
 * 风过山谷，云影漫游，阴晴之间换了人间。
 *
 * 原理：一整块云的投影随风刚性平移（fbm 云团 + 低频大块云体）。换景发生在"浓云刚刚经过"的地方：每像素沿风向往回看 7 步，用 log-sum-exp 软最大值取已经飘过自己的最浓云，保证揭示单调、边缘圆润，一块一块翻过去。阴影里画面偏冷、偏暗、降饱和，云缝里的阳光略暖；明亮或偏蓝的上方区域（天空）不压暗。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：云带前沿 front = p·2 − 0.5 匀速沿风向（左上→右下）推进，两端各留半屏余量在画外；阴影包络 0–0.1 起、0.9–1 落。
 * 建议时长：3.6 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（由公式保证）。
 * 适用：风景、延时摄影感、轻柔的段落过渡，"阴晴之间"。
 * 素材：通用；天空豁免规则对纯 UI 截图影响很小
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 20,
  "id": "yunying",
  "zh": "云影",
  "en": "Cloud Shadows",
  "family": "电影",
  "desc": "风过山谷，云影漫游，阴晴之间换了人间。",
  "duration": 3.6,
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
  easing: "云带前沿 front = p·2 − 0.5 匀速沿风向（左上→右下）推进，两端各留半屏余量在画外；阴影包络 0–0.1 起、0.9–1 落。",
  glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  vec2 dir = normalize(vec2(1.0, -0.5));          // wind: upper-left to lower-right
  vec2 P = (uv - 0.5) * vec2(uAspect, 1.0);
  float hx = 0.5 * (uAspect * abs(dir.x) + abs(dir.y));
  float a = dot(P, dir) / hx * 0.5 + 0.5;         // 0..1 along the wind across the frame
  const float A = 0.4;                            // how far dense cloud masses run ahead of the front
  const float MG = 0.5;                           // margin: the bank starts and ends off-screen
  const float DS = 0.062;                         // look-back step (a-units); 7 steps = 0.434 > A
  float front = p * (1.0 + 2.0 * MG) - MG;
  // the cloud field rides rigidly with the wind (a shadow is the cloud's footprint)
  vec2 q = P - dir * (front * 2.0 * hx) + vec2(uSeed * 41.0, uSeed * 17.0);
  q += vec2(0.011, 0.007) * uTime;                // slow internal drift
  float mass = smoothstep(0.2, 0.8, vnoise(q * 1.3 + 3.7));  // the bank's large cloud masses (smooth)
  float dens = (fbm(q * 1.7) - 0.5) * 2.2 + 0.5 + (mass - 0.5) * 0.45 + (vnoise(q * 5.1 + 7.1) - 0.5) * 0.22;
  // swap: a pixel turns over once a dense mass has passed over it. Look back along the wind at the
  // cloud that already drifted over this spot and keep the max -> monotonic, patch-by-patch reveal.
  float sig = front - a + A * (mass - 0.5);
  // soft max (log-sum-exp) keeps the reveal edge round instead of creased
  // (taken relative to sig; each term's excess over sig is <= A - DS < 0.35, so exp stays < 2.2e4)
  float acc = 1.0;
  for (int k = 1; k < 8; k++) {
    float fk = float(k) * DS;
    float mk = smoothstep(0.2, 0.8, vnoise((q + dir * (fk * 2.0 * hx)) * 1.3 + 3.7));
    acc += exp(clamp(A * (mk - mass) - fk, -0.35, 0.35) / 0.035);
  }
  float best = sig + 0.035 * log(acc) - 0.035 * 0.7;  // offset so a lone sample sits ~unbiased
  float sw = smoothstep(-0.05, 0.05, best);
  // the bank: scattered patches at its fringes, closing cover where the masses sit right now
  float core = exp(-sig * sig / 0.02);
  float fringe = exp(-sig * sig / 0.14);
  float tEnv = smoothstep(0.0, 0.1, p) * smoothstep(1.0, 0.9, p);
  float th = 0.66 - 0.45 * core - 0.08 * fringe;
  float sh = smoothstep(th - 0.17, th + 0.17, dens) * smoothstep(0.02, 0.25, fringe) * tEnv;
  sh *= 0.7 + 0.3 * smoothstep(0.3, 0.9, dens);    // thicker cloud, deeper shadow
  vec3 c = mix(getFrom(uv).rgb, getTo(uv).rgb, sw);
  float l = luma(c);
  // open sky is not darkened by the clouds' footprint: ease the shade on bright upper areas
  // (deep blue sky is not bright, so also treat blue-dominant upper areas as sky)
  float sky = max(smoothstep(0.62, 0.92, l), smoothstep(0.03, 0.14, c.b - max(c.r, c.g * 0.92)));
  float s = sh * (1.0 - 0.9 * sky * smoothstep(0.4, 0.75, uv.y));
  vec3 shade = mix(c, vec3(l), 0.15) * vec3(0.76, 0.82, 0.95) * 0.66;  // darker, cooler, flatter
  vec3 sun = c * vec3(1.05, 1.02, 0.96);                              // warm sunlit gaps
  vec3 col = mix(c, sun, (1.0 - s) * fringe * tEnv);
  col = mix(col, shade, s);
  return vec4(col, 1.0);
}
`,
}));
