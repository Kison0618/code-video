/* 04 层峦 · Layered Ridges（水墨）
 * 远山淡，近山浓，层峦升起，新景出于云雾。
 *
 * 原理：5 层程序化山脊剪影（三层 1D 值噪声 + 一层 ridged simplex 做尖峰），远山浅花青、近山焦墨，远层滞后、横移更少，形成视差；山体内部从脊线向山脚按指数褪进雾里，近层脊线加点苔、皴笔。整组山从下往上升起，新画面从山脚的雾里露出来。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：基线 B = mix(-0.72, 1.36, e)，e = mix(p, ease(p), 0.2)，近乎匀速上升。
 * 建议时长：3.4 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：山水/地理/旅行内容，"翻过一座山"式的段落过渡，自下而上。
 * 素材：通用（山脊是程序生成的，不依赖原图）
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 4,
  "id": "cengluan",
  "zh": "层峦",
  "en": "Layered Ridges",
  "family": "水墨",
  "desc": "远山淡，近山浓，层峦升起，新景出于云雾。",
  "duration": 3.4,
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
  easing: "基线 B = mix(-0.72, 1.36, e)，e = mix(p, ease(p), 0.2)，近乎匀速上升。",
  glsl: `
// Ridgeline profile, ~0..1. Returns (full silhouette, coarse body line).
// The coarse line drops the fine octave so that body shading follows the
// mountain's mass rather than every small notch (no vertical streaks).
vec2 cengluan_ridge(float x, float k) {
  float o1 = vnoise(vec2(x, k * 17.3 + uSeed * 40.0));
  float o2 = vnoise(vec2(x * 2.07 + 5.1, k * 11.1));
  float o3 = vnoise(vec2(x * 4.3 + 9.7, k * 7.7));
  float r = 1.0 - abs(snoise(vec2(x * 0.37 + 3.1 + uSeed * 9.0, k * 5.7)));
  float peak = 0.32 * r * r * r;
  float fF = (0.57 * o1 + 0.29 * o2 + 0.14 * o3);
  float fC = (0.57 * o1 + 0.29 * o2 + 0.07) ;
  return vec2(1.088 * fF * fF + peak, 1.088 * fC * fC + peak);
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);   // exact end frames
  if (p >= 1.0) return getTo(uv);
  float X = uv.x * uAspect;
  float y = uv.y;
  vec3 a = getFrom(uv).rgb;
  vec3 b = getTo(uv).rgb;
  float e = mix(p, ease(p), 0.2);
  float B = mix(-0.72, 1.36, e);          // base line: the new scene lies below it

  // drifting mist colour (pale blue-grey, never flat)
  float mn = fbm(vec2(X * 1.3 + uTime * 0.025, y * 3.0) + uSeed * 7.0);
  vec3 mist = mix(vec3(0.85, 0.88, 0.9), vec3(0.96, 0.965, 0.97), mn);

  // the new scene emerges from the mist below the base line
  float edgeN = vnoise(vec2(X * 7.0 - uTime * 0.05, y * 4.0 + uSeed * 9.0));
  float rv = smoothstep(B + 0.06, B - 0.14, y + (mn - 0.5) * 0.4 + (edgeN - 0.5) * 0.12);
  float haze = exp(-max(B - y, 0.0) / 0.12) * (1.0 - smoothstep(0.8, 1.0, p));
  vec3 emerged = mix(b, mist, haze * 0.6);
  if (rv >= 1.0) return vec4(emerged, 1.0);        // fully revealed: skip the ridges

  vec3 col = a;
  float env = smoothstep(0.0, 0.05, p) * (1.0 - smoothstep(0.9, 1.0, p));
  for (int k = 0; k < 5; k++) {
    float fk = float(k);
    float depth = fk / 4.0;                         // 0 far .. 1 near
    float freq = mix(5.0, 1.6, depth);
    float amp = mix(0.06, 0.3, pow(depth, 1.2));
    // far layers lag behind (slower) and drift less sideways: parallax
    float off = 0.08 + (1.0 - depth) * 0.5 * (1.0 - 0.35 * e);
    // pixel above this layer's highest possible peak: nothing to draw (far layer still casts haze)
    if (k > 0 && y > B + off + amp * 1.42 + 0.02) continue;
    float xs = X + depth * 0.35 * e + fk * 1.7;
    vec2 rr = cengluan_ridge(xs * freq, fk);
    float ry = B + off + amp * rr.x;                 // silhouette
    float ryC = B + off + amp * rr.y;                // smooth body line for shading
    if (k >= 2) {
      // 点苔: small tree bumps along the nearer ridgelines (silhouette only)
      float tre = vnoise(vec2(xs * 80.0, fk * 7.0));
      ry += tre * tre * 0.012 * depth;
    }
    float below = ry - y;
    float belowC = max(ryC - y, 0.0);

    // haze hovering above the farthest ridge softens the old scene
    if (k == 0) col = mix(col, mist, 0.45 * env * exp(-max(-below, 0.0) / 0.08));

    // body: darkest just under the ridge, washing out into mist toward its foot (山脚云雾);
    // the wash depth breathes with low-frequency 2D noise, like uneven water in the brush
    vec3 inkC = mix(vec3(0.58, 0.66, 0.73), vec3(0.05, 0.06, 0.07), pow(depth, 0.8));   // 花青 far → 焦墨 near
    float wash2 = vnoise(vec2(xs * 2.2, y * 2.6 + fk * 4.3 + uSeed * 3.0));
    float fade = mix(0.035, 0.18, depth * depth) * (0.55 + 0.5 * mn) * (0.55 + 0.9 * wash2);
    float inkAmt = exp(-belowC / fade);
    // a crisp dark ridge line, then a few short diagonal texture strokes (皴) near it only
    inkAmt = max(inkAmt, 0.85 * exp(-max(below, 0.0) / 0.006));
    vec2 q = vec2(xs + y * 0.8, y - xs * 0.3);
    float strokes = smoothstep(0.66, 0.88, vnoise(q * vec2(60.0, 24.0) + fk * 13.0));
    inkAmt += strokes * 0.22 * exp(-max(below, 0.0) / 0.022) * depth;
    vec3 layer = mix(mist, inkC, clamp(inkAmt, 0.0, 1.0));
    float soft = mix(0.007, 0.0025, depth);                        // far edges melt into air
    col = mix(col, layer, smoothstep(-soft, soft, below));
  }
  col = mix(col, emerged, rv);
  return vec4(col, 1.0);
}
`,
}));
