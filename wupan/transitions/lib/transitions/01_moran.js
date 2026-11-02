/* 01 墨染 · Ink Bleed（水墨）
 * 墨滴落宣，晕痕层层化开，新景由墨色染出。
 *
 * 原理：多个种子点的 SDF 圆并集，用 5 层 fbm 做乘性扭曲成不规则墨团；前沿用 fbm3 细噪声撕毛边。墨团内部先把新画面压成"墨灰"（亮度压到纸白与墨黑之间），离前沿越远越回到原色；前沿有一圈深色水渍（咖啡环）；前沿外有沿径向拉长的噪声"毛细触须"和宣纸纤维晕染。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：三滴墨依次落下（起点 p=0 / 0.11 / 0.22），半径 ∝ pow(g,1.15) 先慢后快；p>0.8 进入"浸透"，墨痕整体外扩保证 p=1 全覆盖。
 * 建议时长：3.0 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：开场（从纸色进入第一幅画）、章节切换、人文/历史/书画类内容。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 1,
  "id": "moran",
  "zh": "墨染",
  "en": "Ink Bleed",
  "family": "水墨",
  "desc": "墨滴落宣，晕痕层层化开，新景由墨色染出。",
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
  easing: "三滴墨依次落下（起点 p=0 / 0.11 / 0.22），半径 ∝ pow(g,1.15) 先慢后快；p>0.8 进入\"浸透\"，墨痕整体外扩保证 p=1 全覆盖。",
  glsl: `
// Ink-wash rendering of a photo. Luminance is compressed into a fixed mid-grey
// band (0.22..0.78 of paper white) so the wash reads as ink on xuan paper
// whether the photo is a bright sky or a dark gorge.
vec3 moran_wash(vec3 c, float extra) {
  float g = smoothstep(0.03, 0.97, luma(c));
  float t = mix(0.2, 0.7, pow(g, 1.3)) * (1.0 - extra);
  vec3 ink = vec3(0.055, 0.06, 0.07);
  vec3 paper = vec3(0.93, 0.905, 0.85);
  return mix(ink, paper, t);
}

// Xuan paper fibres: two crossing families of short stretched streaks, 0..1.
float moran_fiber(vec2 P) {
  vec2 q1 = mat2(0.8, -0.6, 0.6, 0.8) * P;
  vec2 q2 = mat2(0.28, 0.96, -0.96, 0.28) * P;
  float f = max(vnoise(q1 * vec2(260.0, 40.0)), vnoise(q2 * vec2(40.0, 260.0) + 7.0));
  return smoothstep(0.55, 0.95, f);
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);   // exact end frames
  if (p >= 1.0) return getTo(uv);
  vec2 P = vec2(uv.x * uAspect, uv.y);
  float dt = uTime * 0.012;
  float env = smoothstep(0.0, 0.06, p);
  float endF = smoothstep(0.8, 1.0, p);

  // Low-frequency stain shape (the only 5-octave fbm).
  float n = fbm(P * 2.1 + uSeed * 31.0 + vec2(dt, -dt));

  // Signed distance to the union of growing drops (negative = inside the stain).
  // Also remember the nearest drop: its centre orients the capillary tendrils.
  float s = 1e3;
  vec2 cBest = vec2(0.0);
  float rBest = -1.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 7.31 + 1.7, uSeed * 113.0 + fi * 3.1));
    vec2 c = vec2((0.16 + 0.68 * h.x) * uAspect, 0.2 + 0.6 * h.y);
    float t0 = fi * 0.11;
    float g = clamp((p - t0) / (1.0 - t0), 0.0, 1.0);
    float R = 1.3 * pow(g, 1.15) * (0.8 + 0.4 * h.y) - 0.015;
    // multiplicative warp: lobes grow with the stain (d >= 0 always)
    float d = length(P - c) * (0.7 + 0.6 * n);
    if (d - R < s) { s = d - R; cBest = c; rBest = R; }
  }
  s -= 1.25 * endF * endF;          // final soak guarantees full coverage at p = 1
  float live = smoothstep(0.0, 0.03, rBest) * env * (1.0 - endF);   // drop has landed

  // Ragged front: fine fbm wobble.
  float fine = fbm3(P * 14.0 + uSeed * 17.0 - dt * 2.0);
  float sf = s + (fine - 0.5) * 0.05 * env;

  // Capillary tendrils: radially elongated fingers (noise sampled on the direction
  // from the drop centre, drifting slowly with radius) that reach 1-3% of screen height.
  vec2 dv = P - cBest;
  float r = length(dv);
  vec2 dir = dv / max(r, 1e-4);
  float K = 16.0 + 70.0 * r;
  float fing = vnoise(dir * K + vec2(r * 3.0, -r * 2.0) + uSeed * 19.0) * 0.7
             + vnoise(dir * K * 2.3 + vec2(-r * 5.0, r * 4.0) + 3.7) * 0.3;
  float reach = 0.032 * pow(smoothstep(0.3, 0.8, fing), 1.3) * live;
  float ahead0 = max(sf, 0.0);
  float tend = smoothstep(reach, reach * 0.35, ahead0) * step(0.0005, reach);
  // finger core is darker at its root, feathering out at the tip
  tend *= 1.0 - 0.6 * clamp(ahead0 / max(reach, 1e-4), 0.0, 1.0);

  float inside = smoothstep(0.005, -0.005, sf);
  float depth = max(-sf, 0.0);      // distance behind the front
  float ahead = ahead0;             // distance ahead of the front

  vec3 a = getFrom(uv).rgb;
  vec3 b = getTo(uv).rgb;

  // Inside: mid-grey ink wash first (denser near the wet front), colour blooms in behind.
  float bloom = smoothstep(0.1, 0.5, depth + (n - 0.5) * 0.2);
  bloom = max(bloom, endF);
  vec3 wash = moran_wash(b, 0.55 * exp(-depth / 0.2));
  vec3 inCol = mix(wash, b, bloom);

  // Wet rim: pigment piles up at the edge (coffee ring) with an irregular width.
  float grain = vnoise(P * 180.0 + uSeed * 50.0);
  float rw = 0.006 + 0.022 * fine * fine * 2.0;
  float rim = exp(-depth / rw) * (0.8 + 0.2 * grain) + exp(-depth / 0.045) * 0.35;
  rim = clamp(rim * (0.9 + 0.3 * fine), 0.0, 1.0) * (1.0 - endF);
  vec3 inkC = vec3(0.04, 0.045, 0.055);
  inCol = mix(inCol, inkC + inCol * 0.08, rim * 0.95);

  // Ahead of the front: tendrils, fibre feathering and a faint wet halo (水痕).
  float fib = moran_fiber(P + n * 0.05);
  float wick = max(tend * 0.9, exp(-ahead / 0.006) * 0.85)
             + exp(-ahead / 0.015) * fib * 0.35
             + exp(-ahead / 0.06) * 0.12;
  wick = clamp(wick, 0.0, 1.0) * env * (1.0 - endF);
  vec3 outCol = mix(a, inkC + a * 0.12, wick * 0.92);

  vec3 col = mix(outCol, inCol, inside);
  col = mix(col, b, smoothstep(0.97, 1.0, p));
  return vec4(col, 1.0);
}
`,
}));
