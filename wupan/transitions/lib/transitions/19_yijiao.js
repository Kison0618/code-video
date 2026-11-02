/* 19 移焦 · Rack Focus（电影）
 * 焦点轻移，近山化作光斑，远景缓缓清晰。
 *
 * 原理：散景近似：21 次黄金角螺旋采样的圆形光圈卷积；按到画面中心的位置裁一个偏心圆做"猫眼"散景，亮部权重放大（高光变成光斑），边缘稍亮。交叉时不是整体淡化，而是按每个采样点的固定键值逐个从旧图换到新图，像焦点真的移走了。最后加散焦高光的辉光和机械暗角。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：旧画面 0–0.44 失焦，新画面 0.56–1 合焦，0.36–0.64 两者都虚时交叉；放大率随焦点"呼吸"约 2%。
 * 建议时长：3.0 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（由公式保证）。
 * 适用：访谈、叙事、安静的切换，"注意力转移"。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 19,
  "id": "yijiao",
  "zh": "移焦",
  "en": "Rack Focus",
  "family": "电影",
  "desc": "焦点轻移，近山化作光斑，远景缓缓清晰。",
  "duration": 3,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uTime",
    "uAspect"
  ],
  "usesTime": true
}, {
  easing: "旧画面 0–0.44 失焦，新画面 0.56–1 合焦，0.36–0.64 两者都虚时交叉；放大率随焦点\"呼吸\"约 2%。",
  glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  const float R = 0.022;                          // max circle of confusion radius (fraction of height)
  float m = smoothstep(0.36, 0.64, p);            // crossfade while both are soft
  float eF = smoothstep(0.0, 0.44, p);
  float eT = smoothstep(1.0, 0.56, p);
  float rF = R * eF * eF * (2.0 - eF);
  float rT = R * eT * eT * (2.0 - eT);
  // focus breathing: magnification creeps up ~2% as focus racks, relaxes as it lands
  float sF = 1.0 - 0.021 * smoothstep(0.0, 0.62, p);
  float sT = 1.0 - 0.021 * smoothstep(1.0, 0.38, p);
  vec2 uF = (uv - 0.5) * sF + 0.5;
  vec2 uT = (uv - 0.5) * sT + 0.5;
  vec2 P = (uv - 0.5) * vec2(uAspect, 1.0);
  vec2 ce = P * 0.62;                             // cat-eye: aperture clipped by a circle shifted radially
  vec2 sc = vec2(1.0 / uAspect, 1.0);
  // per-pixel rotation + radial jitter, re-rolled every frame: the eye integrates it like film grain
  vec2 fc = gl_FragCoord.xy + floor(fract(uTime * 5.37) * 64.0) * vec2(5.0, 3.0);
  float rot = 6.2831853 * fract(52.9829189 * fract(dot(fc, vec2(0.06711056, 0.00583715))));
  float rj = hash12(fc * 0.731 + 11.0);
  vec3 aF = vec3(0.0); float wF = 0.0;
  vec3 aT = vec3(0.0); float wT = 0.0;
  for (int i = 0; i < 21; i++) {
    float fi = float(i) + 0.5;
    float r = sqrt((float(i) + rj) / 21.0);
    float a = fi * 2.39996323 + rot;
    vec2 o = r * vec2(cos(a), sin(a));
    float k = max(smoothstep(1.1, 0.9, length(o - ce)), 0.04) * (0.78 + 0.44 * r * r); // cat-eye clip, brighter rim
    // which scene this tap represents: a well-spread subset hands over as m rises
    float key = fract(fi * 0.7548777 + 0.137);
    float s = smoothstep(key - 0.05, key + 0.05, m * 1.1 - 0.05);
    if (s < 0.999) {
      vec3 c = getFrom(uF + o * rF * sc).rgb;
      float l = luma(c);
      float w = k * (1.0 + 5.0 * pow(smoothstep(0.6, 1.0, l), 2.0)) * (1.0 - s);
      aF += c * w; wF += w;
    }
    if (s > 0.001) {
      vec3 c = getTo(uT + o * rT * sc).rgb;
      float l = luma(c);
      float w = k * (1.0 + 5.0 * pow(smoothstep(0.6, 1.0, l), 2.0)) * s;
      aT += c * w; wT += w;
    }
  }
  vec3 cF = aF / max(wF, 1e-5);
  vec3 cT = aT / max(wT, 1e-5);
  vec3 col = mix(cF, cT, m);
  // bloom lift of defocused highlights + mechanical vignetting, both tied to defocus amount
  float d = max(rF * (1.0 - m), rT * m) / R;
  col += d * 0.06 * smoothstep(0.6, 1.0, luma(col)) * col;
  col *= 1.0 - d * 0.16 * dot(P, P);
  return vec4(col, 1.0);
}
`,
}));
