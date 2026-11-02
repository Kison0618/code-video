/* 07 涟漪 · Ripple（自然）
 * 一滴落水，层层涟漪推开另一片山水。
 *
 * 原理：两组径向阻尼波（cos 波乘指数包络），用中心差分求 dh/dr 得到水面斜率，沿径向偏移采样坐标做折射，红/绿/蓝三通道偏移量不同（轻微色散）。新画面在波前后面一段距离（LEAD）按圆形展开，圆周加角向正弦抖动；只在领头波峰上加碎高光；落水瞬间有一个小水花亮点。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：第一滴：R = 1.8·pow(q,1.55) 慢起；第二滴在 p=0.27 落下，R2 = 1.6·pow(q2,1.1)。振幅随 (1-p)^1.3 衰减。
 * 建议时长：2.6 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：水景、回忆、"涟漪效应"类比喻，从一点扩散的切换。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 7,
  "id": "lianyi",
  "zh": "涟漪",
  "en": "Ripple",
  "family": "自然",
  "desc": "一滴落水，层层涟漪推开另一片山水。",
  "duration": 2.6,
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
  easing: "第一滴：R = 1.8·pow(q,1.55) 慢起；第二滴在 p=0.27 落下，R2 = 1.6·pow(q2,1.1)。振幅随 (1-p)^1.3 衰减。",
  glsl: `
// damped wave train trailing the leading front; x = distance behind the front
float lianyi_wave(float x, float k, float amp) {
  float env = exp(-max(x, 0.0) * 1.25) * smoothstep(-0.025, 0.01, x);
  return amp * env * cos(x * k);
}
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  vec2 asp = vec2(uAspect, 1.0);
  vec2 c = vec2(0.5) + (hash22(vec2(uSeed * 53.1, 7.3)) - 0.5) * vec2(0.42, 0.34);
  vec2 c2 = vec2(0.5) + (hash22(vec2(uSeed * 29.7, 1.9)) - 0.5) * vec2(0.6, 0.4);   // a second, later drop
  c2 = mix(c2, vec2(1.0) - c, 0.45);                    // ... well away from the first
  vec2 dv = (uv - c) * asp, dv2 = (uv - c2) * asp;
  float r = length(dv), r2 = length(dv2);
  vec2 dir = dv / max(r, 1e-4), dir2 = dv2 / max(r2, 1e-4);
  float e = 0.003;

  // drop 1: the leading wave runs ahead over the old scene; the new one opens LEAD behind it
  float LEAD = 0.13;
  float q = clamp((p - 0.02) / 0.98, 0.0, 1.0);
  float R = 1.8 * pow(q, 1.55);                          // slow start, coverage completes near p=0.9
  float k = mix(72.0, 40.0, q);                          // rings spread out as they travel
  float amp = smoothstep(0.0, 0.12, p) * pow(1.0 - p, 1.3) * 0.45 / (1.0 + 1.0 * R)
            * mix(0.3, 1.0, smoothstep(0.1, 0.55, R));   // a young ring is low
  float x = R - r;
  float slope = (lianyi_wave(x - e, k, amp) - lianyi_wave(x + e, k, amp)) / (2.0 * e) * smoothstep(0.0, 0.12, r);  // dh/dr

  // drop 2 lands at p=0.27; its rings cross the first
  float q2 = clamp((p - 0.27) / 0.73, 0.0, 1.0);
  float R2 = 1.6 * pow(q2, 1.1);
  float amp2 = smoothstep(0.27, 0.37, p) * pow(1.0 - p, 1.3) * 0.32 / (1.0 + R2) * mix(0.3, 1.0, smoothstep(0.1, 0.5, R2));
  float x2 = R2 - r2;
  float k2 = mix(66.0, 44.0, q2);
  float slope2 = (lianyi_wave(x2 - e, k2, amp2) - lianyi_wave(x2 + e, k2, amp2)) / (2.0 * e) * smoothstep(0.0, 0.1, r2);

  // refraction along both radial normals, with a slight spectral split on steep slopes
  vec2 g = dir * slope + dir2 * slope2;
  vec2 o = -g * 0.0035 / asp;
  vec3 cf = vec3(getFrom(uv + o * 1.25).r, getFrom(uv + o).g, getFrom(uv + o * 0.75).b);
  vec3 ct = vec3(getTo(uv + o * 1.25).r, getTo(uv + o).g, getTo(uv + o * 0.75).b);
  float wob = 0.012 * sin(atan(dv.y, dv.x) * 7.0 + uSeed * 20.0) + 0.008 * sin(atan(dv.y, dv.x) * 3.0 - uSeed * 9.0);
  float m1 = smoothstep(0.0, 0.12, x - LEAD + wob);
  float m2 = smoothstep(0.0, 0.12, x2 - LEAD + 0.6 * wob);
  vec3 col = mix(cf, ct, max(m1, m2));

  // soft surface shading; glints only on the leading crests
  vec3 n = normalize(vec3(-g * 0.013, 1.0));
  vec3 L = normalize(vec3(-0.45, 0.55, 0.7));
  col *= 1.0 + (dot(n, L) - L.z) * 0.25;
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float lead = max(exp(-max(x, 0.0) * 6.0) * step(-0.03, x), exp(-max(x2, 0.0) * 6.0) * step(-0.03, x2));
  float spec = pow(max(dot(n, H), 0.0), 60.0) * smoothstep(0.0, 0.03, max(amp, amp2)) * lead;
  spec *= 0.6 + 0.8 * vnoise(vec2(atan(dir.y, dir.x) * 9.0, r * 30.0 + uTime));   // broken glints along the crest
  col += vec3(1.0, 0.97, 0.9) * spec * 0.35;
  // the splash of impact
  col += vec3(0.95, 0.97, 1.0) * smoothstep(0.0, 0.03, p) * (1.0 - smoothstep(0.03, 0.1, p)) * exp(-r * r * 300.0) * 0.18;
  return vec4(col, 1.0);
}
`,
}));
