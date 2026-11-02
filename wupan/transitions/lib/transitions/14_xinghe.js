/* 14 星河 · Night Passage（天气）
 * 暮色沉入星河，天亮时已是另一重山。
 *
 * 原理：调色模拟一夜：旧画面先转蓝调时刻白平衡、再压暗（天空保留更多亮度、黑位抬起）；黑暗中按高度（加 fbm）换成新画面，新画面再由东向西"天亮"、带一点暖色。星空只画在"天空"上：天空 = 亮 × 偏上 × 平滑（用相邻像素亮度差排除雪和岩石纹理）。星空包括两层网格星点（闪烁）和一条 fbm 银河（带暗尘带），整体绕极点缓慢旋转。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：前段 ease(p/0.46) 入夜；换景在 0.37–0.64 的黑暗里从谷底往天上升；0.5 之后黎明从右（东）往左扫；星空可见区间约 0.18–0.76。
 * 建议时长：3.6 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uRes, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：时间跨度（"一夜之后"/"第二天"）、昼夜、宏大叙事。
 * 素材：依赖画面上方有平滑亮天空，否则星空不出现，只剩"入夜—天亮"调色
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 14,
  "id": "xinghe",
  "zh": "星河",
  "en": "Night Passage",
  "family": "天气",
  "desc": "暮色沉入星河，天亮时已是另一重山。",
  "duration": 3.6,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uTime",
    "uRes",
    "uAspect",
    "uSeed"
  ],
  "usesTime": true
}, {
  easing: "前段 ease(p/0.46) 入夜；换景在 0.37–0.64 的黑暗里从谷底往天上升；0.5 之后黎明从右（东）往左扫；星空可见区间约 0.18–0.76。",
  glsl: `
// wb: shift to blue-hour white balance; ex: night exposure; warm: dawn warmth.
vec3 xinghe_grade(vec3 c, float wb, float ex, float warm) {
  float L = luma(c);
  vec3 g = mix(c, vec3(L), 0.45 * wb) * mix(vec3(1.0), vec3(0.62, 0.78, 1.12), wb);
  float keep = mix(0.15, 0.44, smoothstep(0.2, 0.85, L));   // sky keeps more light than the land
  g *= mix(1.0, keep, ex);
  g += vec3(0.010, 0.017, 0.036) * ex;                       // lifted, filmic blacks
  g *= mix(vec3(1.0), vec3(1.2, 0.95, 0.74), warm);
  return g;
}

float xinghe_stars(vec2 a, float cell, float prob, float sd, float tw) {
  vec2 st = a / cell;
  vec2 id = floor(st);
  vec2 f = fract(st);
  float h3 = hash12(id * 1.37 + sd + 4.1);
  if (h3 > prob) return 0.0;
  vec2 h = hash22(id + sd);
  vec2 c = 0.2 + 0.6 * h;
  float b = pow(hash12(id + 9.3 + sd), 5.0);
  float rp = max((0.55 + 1.4 * b) / 1080.0, 0.6 / uRes.y);
  vec2 d = (f - c) * cell;
  float core = exp(-dot(d, d) / (rp * rp));
  float twk = 0.7 + 0.3 * sin(tw * (1.7 + 4.0 * h.x) + h.y * 40.0);
  return core * (0.3 + 1.7 * b) * twk;
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  float sd = floor(uSeed * 997.0);

  // old scene sinks through blue hour into night
  float n = ease(clamp(p / 0.46, 0.0, 1.0));
  vec3 fromC = getFrom(uv).rgb;
  vec3 gF = xinghe_grade(fromC, smoothstep(0.0, 0.6, n), smoothstep(0.18, 1.0, n), 0.0);

  // new scene rises a little out of the dark
  float rise = ease(clamp((p - 0.38) / 0.62, 0.0, 1.0));
  vec2 tuv = 0.5 + (uv - 0.5) * (1.0 - 0.03 * (1.0 - rise)) + vec2(0.0, 0.014 * (1.0 - rise));
  vec3 toC = getTo(tuv).rgb;
  // dawn arrives from the right (east) and sweeps west
  float dT = clamp((p - 0.5) / 0.47, 0.0, 1.0);
  float dl = smoothstep(0.0, 1.0, clamp(dT * 1.75 - (1.0 - uv.x) * 0.75 + (uv.y - 0.5) * 0.12, 0.0, 1.0));
  float warm = smoothstep(0.0, 0.35, dl) * (1.0 - smoothstep(0.5, 1.0, dl)) * 0.7;
  vec3 gT = xinghe_grade(toC, 1.0 - smoothstep(0.0, 0.5, dl), 1.0 - smoothstep(0.08, 1.0, dl), warm);

  // the swap happens in the dark, rising from the valleys up into the sky
  float k = clamp((p - 0.37) / 0.27, 0.0, 1.0);
  float sw = smoothstep(0.0, 1.0, clamp(k * 1.55 - uv.y * 0.55 + (fbm3(uv * vec2(uAspect, 1.0) * 3.0 + sd * 0.1) - 0.5) * 0.3 * k * (1.0 - k) * 4.0, 0.0, 1.0));
  vec3 col = mix(gF, gT, sw);
  float Lo = mix(luma(fromC), luma(toC), sw);
  // sky = bright, high and smooth (snow and rock are textured; stars stay off the land)
  vec2 e = vec2(0.006 / uAspect, 0.006);
  float txF = abs(luma(getFrom(uv + vec2(e.x, 0.0)).rgb) - luma(fromC)) + abs(luma(getFrom(uv + vec2(0.0, e.y)).rgb) - luma(fromC));
  float txT = abs(luma(getTo(tuv + vec2(e.x, 0.0)).rgb) - luma(toC)) + abs(luma(getTo(tuv + vec2(0.0, e.y)).rgb) - luma(toC));
  float smooth = 1.0 - smoothstep(0.02, 0.09, mix(txF, txT, sw));
  float sky = clamp(smoothstep(0.38, 0.8, Lo) * smoothstep(0.3, 0.75, uv.y) * smooth * 1.25, 0.0, 1.0);

  // dawn glow low in the eastern sky
  float east = exp(-(1.0 - uv.x) * 2.4) * (0.55 + 0.45 * smoothstep(0.2, 0.7, uv.y));
  col += vec3(1.0, 0.52, 0.26) * warm * east * (0.08 + 0.2 * sky);

  // the sky turns over: stars and the Milky Way
  float sv = smoothstep(0.18, 0.4, p) * (1.0 - smoothstep(0.54, 0.76, p)) * (1.0 - dl);
  if (sv > 0.001) {
    vec2 a = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
    float rot = (p - 0.5) * 0.1;
    vec2 pole = vec2(-1.1, 1.3);
    vec2 ar = a - pole;
    ar = vec2(cos(rot) * ar.x - sin(rot) * ar.y, sin(rot) * ar.x + cos(rot) * ar.y) + pole;
    float th = 1.0 + (uSeed - 0.5) * 0.7;
    vec2 bd = vec2(cos(th), sin(th));
    float bc = dot(ar - vec2(0.12, 0.18), vec2(-bd.y, bd.x));
    float bl = dot(ar, bd);
    float nb = fbm(vec2(bl * 2.4, bc * 6.0) + vec2(sd * 0.09, 2.0));
    float wid = 0.13 + 0.06 * nb;
    float band = exp(-bc * bc / (wid * wid));
    float lane = fbm3(vec2(bl * 3.2, bc * 10.0) + vec2(7.0, sd * 0.05));
    float dust = (1.0 - smoothstep(0.0, 0.045, abs(bc + (lane - 0.5) * 0.09 + 0.012))) * smoothstep(0.35, 0.6, lane);
    float coreG = exp(-(bl - 0.15) * (bl - 0.15) / 0.18);
    float glow = band * (0.3 + 1.1 * nb * nb) * (1.0 - 0.7 * dust) * (0.7 + 0.6 * coreG);
    vec3 mw = mix(vec3(0.45, 0.55, 0.85), vec3(1.0, 0.86, 0.68), clamp(band * nb * coreG * 1.4, 0.0, 1.0)) * glow * 0.34;

    float tw = uTime * 1.3;
    float st1 = xinghe_stars(ar, 0.0065, 0.22 + 0.6 * band * (0.4 + nb), sd, tw);
    float st2 = xinghe_stars(ar + 3.7, 0.035, 0.32, sd + 5.0, tw);
    vec3 starC = mix(vec3(0.78, 0.86, 1.0), vec3(1.0, 0.9, 0.76), hash12(floor(ar / 0.035) + sd));
    vec3 nightSky = mw + starC * (st1 * 0.65 + st2 * 1.3) * (1.0 - 0.6 * dust * band);
    col += nightSky * sv * sky * (1.0 - 0.5 * clamp(luma(col) * 2.0, 0.0, 1.0)) * 1.6;
  }
  return vec4(col, 1.0);
}
`,
}));
