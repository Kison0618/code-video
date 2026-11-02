/* 08 流水 · River Current（自然）
 * 碧水自左奔涌而过，冲出另一方山河。
 *
 * 原理：一条从左上斜向右下推进的前沿，用沿水流方向拉长的 fbm 撕成不规则边；前沿附近是一段"水带"，水带内按细 fbm 的流场做 4 次抖动采样的方向模糊，新画面被水流带进来、旧画面被往前拖；左边界镜像采样避免拉丝。水带染碧色，叠加两层噪声相乘的焦散纹，前沿一线碎泡沫。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：前沿 F = mix(-0.2, 1.42, mix(p, ease(p), 0.25))；水带强度在 p<0.12 淡入、p>0.8 淡出。
 * 建议时长：2.8 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：河流、时间流逝、数据流/流程推进，左→右。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 8,
  "id": "liushui",
  "zh": "流水",
  "en": "River Current",
  "family": "自然",
  "desc": "碧水自左奔涌而过，冲出另一方山河。",
  "duration": 2.8,
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
  easing: "前沿 F = mix(-0.2, 1.42, mix(p, ease(p), 0.25))；水带强度在 p<0.12 淡入、p>0.8 淡出。",
  glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  vec2 sd = vec2(uSeed * 41.0, uSeed * 13.0);
  float F = mix(-0.2, 1.42, mix(p, ease(p), 0.25));      // starts at the upper-left corner     // mean position of the current's front
  float env = smoothstep(0.0, 0.12, p) * (1.0 - smoothstep(0.8, 1.0, p));

  // streamwise-stretched turbulence advected with the water
  float n = fbm(vec2((uv.x - F * 0.55) * uAspect * 1.3, uv.y * 4.0) + sd);
  // a diagonal "downhill" front: water spills across the land from the upper left
  float d = F - (uv.x * 0.85 + (1.0 - uv.y) * 0.25) + (n - 0.5) * 0.5;   // > 0 behind the front
  float m = smoothstep(-0.02, 0.02, d) * smoothstep(0.0, 0.12, p);   // the corner fills in, never pops
  float band = exp(-pow(max(-d, 0.0) / 0.06, 2.0)) * exp(-max(d, 0.0) * 12.0) * env;

  // flow field: mostly downstream, with shear from a second, finer turbulence
  float g = fbm3(vec2((uv.x - F * 0.9) * uAspect * 2.2, uv.y * 8.0) + sd.yx);
  float speed = band * (0.008 + 0.018 * g);
  vec2 vel = vec2(speed, (g - 0.5) * speed * 0.5 - speed * 0.25);
  vec2 carryT = vec2(0.018 * band, (g - 0.5) * 0.008 * band);  // new scene carried in by the current
  vec2 carryF = vec2(0.008 * band, 0.0);                      // old scene dragged ahead of it

  float j = hash12(gl_FragCoord.xy);
  vec3 cf = vec3(0.0), ct = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    vec2 o = vel * ((float(i) + j) / 4.0);
    vec2 sf = uv - carryF - o, st = uv - carryT - o;
    cf += getFrom(vec2(abs(sf.x), sf.y)).rgb;              // mirror at the left edge instead of clamping
    ct += getTo(vec2(abs(st.x), st.y)).rgb;
  }
  vec3 col = mix(cf, ct, m) / 4.0;

  // jade water tint, caustic streaks on the jade band only, a broken line of foam at the leading edge
  col = mix(col, col * vec3(0.8, 0.96, 0.91) + vec3(0.0, 0.02, 0.025), clamp(band * 0.55, 0.0, 1.0));
  vec2 cq = vec2((uv.x - F * 0.7) * uAspect * 2.6, uv.y * 20.0) + sd;
  float c1 = 1.0 - abs(vnoise(cq) * 2.0 - 1.0);
  float c2 = 1.0 - abs(vnoise(cq * vec2(1.7, 1.3) + vec2(5.2, uTime * 0.6)) * 2.0 - 1.0);
  float caus = pow(c1 * c2, 7.0);
  col += vec3(0.8, 1.0, 0.95) * caus * band * smoothstep(0.2, 0.6, band) * 0.2;
  float foam = exp(-pow(d / 0.012, 2.0)) * env * smoothstep(0.35, 0.8, vnoise(cq * vec2(0.6, 0.5) + 9.0));
  col += vec3(0.9, 1.0, 0.97) * foam * 0.2;
  return vec4(col, 1.0);
}
`,
}));
