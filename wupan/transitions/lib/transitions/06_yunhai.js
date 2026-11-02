/* 06 云海 · Sea of Clouds（自然）
 * 云涛自谷底翻涌而上，吞没群峰又缓缓沉落。
 *
 * 原理：三张云层"高度场"（不同尺度和倍频的 fbm），每层顶面随包络升起；按"在云顶以下的深度"算透光，并用低频噪声的梯度做上亮下暗的体积感，薄处透光、边缘有银边。云层颜色取当前画面上方几个采样点的天空色。镜头同时上推，旧画面下沉、新画面从上方落定。这是"遮挡式"转场：全屏遮挡物掩护换景。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：三角包络 tri = 1-|2p-1|，云层高度 pow(tri,1.3)：p=0.5 云最满，旧/新画面在 0.46–0.54 之间被云挡着时交换。远层领先、近层最后。
 * 建议时长：3.6 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：高山、大场景、篇章级的大转换，或需要"留白喘口气"的地方。
 * 素材：通用；有天空的画面云色更自然（云色从画面顶部取样）
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 6,
  "id": "yunhai",
  "zh": "云海",
  "en": "Sea of Clouds",
  "family": "自然",
  "desc": "云涛自谷底翻涌而上，吞没群峰又缓缓沉落。",
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
  easing: "三角包络 tri = 1-|2p-1|，云层高度 pow(tri,1.3)：p=0.5 云最满，旧/新画面在 0.46–0.54 之间被云挡着时交换。远层领先、近层最后。",
  glsl: `
// rotated value-noise fbm; 'low' returns its two lowest octaves (used for lighting)
float yunhai_fbm(vec2 p, float extra, out float low) {
  mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
  float s = vnoise(p) * 0.5;
  p = m * p * 2.03 + vec2(17.1, 9.2);
  s += vnoise(p) * 0.25;
  low = s / 0.75;
  float a = 0.125, w = 0.75;
  for (int i = 0; i < 3; i++) {
    if (float(i) >= extra) break;
    p = m * p * 2.03 + vec2(17.1, 9.2);
    s += a * vnoise(p); w += a; a *= 0.5;
  }
  return s / w;
}
float yunhai_low(vec2 p) {
  mat2 m = mat2(0.8, 0.6, -0.6, 0.8);
  return (vnoise(p) * 0.5 + vnoise(m * p * 2.03 + vec2(17.1, 9.2)) * 0.25) / 0.75;
}
// One cloud sheet: a height-field of billows whose surface sits at 'top', lit from above.
// Light: sunlight attenuates with depth below the sheet's top, and each billow is brighter where its
// density falls off toward the sun (top) than where it rises (shadowed underside).
// Deep inside a sheet the billows stay visible (sunlit faces / blue-grey hollows) and thin spots open
// into gaps through which the sheets behind - and finally the glowing haze - show.
// 'vs' scrolls the billows downward as the camera climbs (parallax per sheet); 'gap' = how readily it thins.
vec4 yunhai_sheet(vec2 uv, float top, float sc, float sy, float drift, float vs, float sd, float k, float extra,
                  float lightTerm, float gap, vec3 sun, vec3 amb, vec3 inner) {
  vec2 q = vec2(uv.x * uAspect * sc + drift, (uv.y + vs) * sc * sy) + vec2(sd * 37.0, sd * 11.0);
  float low;
  float n = yunhai_fbm(q, extra, low);
  float f = (top - uv.y) * k + (n - 0.5) * 1.25;          // depth below the cloud surface
  float depth = max(f, 0.0);
  float lump = 0.0;
  if (lightTerm > 0.5) lump = clamp((low - yunhai_low(q + vec2(0.0, 0.3))) * 6.5, -1.0, 1.0);
  float T = exp(-depth * 1.5);
  float sunAmt = clamp(T * (0.78 + 0.45 * lump) + (n - low) * 0.8, 0.0, 1.0);
  vec3 c = mix(amb * (0.82 + 0.25 * n), sun, sunAmt);
  // interior: billow relief that does not fade with depth
  float inside = smoothstep(0.7, 1.8, depth);
  float face = smoothstep(0.08, 0.92, 0.48 + 0.55 * lump + 2.4 * (n - low) + 0.7 * (n - gap));
  vec3 ci = mix(amb * 0.8, sun * 1.03, face);
  ci = mix(ci, inner, 0.12);
  float thin = 1.0 - smoothstep(gap - 0.06, gap + 0.07, n);         // thin margins / gaps inside the mass
  ci += sun * thin * (0.12 + 0.12 * max(lump, 0.0));                 // light glowing through them
  c = mix(c, ci, inside);
  float rim = (1.0 - smoothstep(0.0, 0.2, f)) * smoothstep(-0.05, 0.08, f);
  c += sun * rim * 0.18 * (0.5 + 0.5 * max(lump, 0.0));                 // silver lining on thin edges
  float dens = smoothstep(0.0, 0.32, f) * (1.0 - inside * thin * 0.9);
  return vec4(c, dens);
}
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  float tri = 1.0 - abs(2.0 * p - 1.0);
  float hb = pow(min(tri * 1.06, 1.0), 1.3);     // far bank leads
  float hm = pow(min(tri * 1.03, 1.0), 1.3);
  float hf = pow(tri, 1.3);                      // near bank swallows the frame around p = 0.5

  // camera rising: old scene slides down and pushes in a touch; new scene settles from above
  float rise = ease(clamp(p * 2.0, 0.0, 1.0));
  float fall = 1.0 - ease(clamp(p * 2.0 - 1.0, 0.0, 1.0));
  vec2 fuv = (uv - 0.5) * (1.0 - 0.045 * rise) + 0.5 + vec2(0.0, 0.05 * rise);
  vec2 tuv = (uv - 0.5) * (1.0 - 0.045 * fall) + 0.5 - vec2(0.0, 0.05 * fall);

  // the clouds take their ambient tint from the sky of whichever scene is behind them
  vec3 skyF = (getFrom(vec2(0.25, 0.9)).rgb + getFrom(vec2(0.75, 0.9)).rgb + getFrom(vec2(0.5, 0.62)).rgb) / 3.0;
  vec3 skyT = (getTo(vec2(0.25, 0.9)).rgb + getTo(vec2(0.75, 0.9)).rgb + getTo(vec2(0.5, 0.62)).rgb) / 3.0;
  float sw = smoothstep(0.46, 0.54, p);
  vec3 sky = mix(skyF, skyT, sw);
  vec3 sun = mix(vec3(1.0, 0.975, 0.94), vec3(1.0, 0.95, 0.88) * (0.85 + 0.3 * luma(sky)), 0.35);
  vec3 amb = mix(vec3(0.66, 0.71, 0.8), sky, 0.25);
  vec3 inner = mix(vec3(0.86, 0.88, 0.9), sky, 0.12);
  vec3 haze = mix(amb, sun, 0.55);

  vec3 bg = mix(getFrom(fuv).rgb, getTo(tuv).rgb, sw);
  float topB = mix(-0.33, 1.4, hb);
  float deep = smoothstep(-0.05, 0.25, topB - uv.y);
  vec3 glow = mix(haze, sun * 1.05, 0.5);                            // sun-filled mist behind the far billows
  bg = mix(bg, mix(haze, glow, deep), clamp(0.4 * hb + 0.7 * deep, 0.0, 1.0));  // fully replaced while covered

  float t = uTime;
  // far / mid / near banks (octaves: 3 / 3 / 5, billow lighting on mid and near: 15 value-noise lookups total)
  // billows stream down past the climbing camera: near sheets faster and larger (parallax)
  vec4 cb = yunhai_sheet(uv, topB, 3.4, 2.6, t * 0.012 + p * 0.25, p * 0.35, uSeed, 3.2, 1.0, 0.0, 0.4, sun, amb, inner);
  vec4 cm = yunhai_sheet(uv, mix(-0.37, 1.5, hm), 2.4, 2.0, t * 0.02 + p * 0.45, p * 0.6, uSeed + 0.31, 2.6, 1.0, 1.0, 0.46, sun, amb, inner);
  vec4 cf = yunhai_sheet(uv, mix(-0.4, 1.62, hf), 1.5, 1.5, t * 0.03 + p * 0.7, p * 0.95, uSeed + 0.67, 2.3, 3.0, 1.0, 0.47, sun, amb, inner);

  vec3 col = bg;
  col = mix(col, mix(cb.rgb, haze, 0.4), cb.a);
  col = mix(col, mix(cm.rgb, haze, 0.15), cm.a);
  col = mix(col, cf.rgb, cf.a);
  return vec4(col, 1.0);
}
`,
}));
