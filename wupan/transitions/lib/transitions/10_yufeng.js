/* 10 御风 · Ride the Wind（自然）
 * 乘风穿峡，冲入云隙，另一重山迎面而来。
 *
 * 原理：以画面中心附近为消失点做径向缩放模糊（8 次抖动采样），飞行中加桶形畸变、四周压暗；p≈0.5 是一团由画面本身着色的雾。0.28–0.72 之间有两片深色峭壁（伪 3D：按列求墙面深度 z = X/|x|，顶部用 fbm 起伏）从两侧迎面掠过，带大气透视。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：前半段放大 zf = 1 + 1.3a³（加速），后半段 zt = 1 + 0.75(1-b)³（减速落定）；fly = (16p²(1-p)²)^1.6 两端速度为零；p=0.42–0.58 交叉。
 * 建议时长：2.4 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：快节奏推进、"进入下一章"、开场冲入主题。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 10,
  "id": "yufeng",
  "zh": "御风",
  "en": "Ride the Wind",
  "family": "自然",
  "desc": "乘风穿峡，冲入云隙，另一重山迎面而来。",
  "duration": 2.4,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uAspect",
    "uSeed"
  ],
  "usesTime": false
}, {
  easing: "前半段放大 zf = 1 + 1.3a³（加速），后半段 zt = 1 + 0.75(1-b)³（减速落定）；fly = (16p²(1-p)²)^1.6 两端速度为零；p=0.42–0.58 交叉。",
  glsl: `
// one pair of cliff spurs (left/right) between depths Z..Z+DZ ahead of the camera; returns coverage, z = depth hit
float yufeng_cliff(vec2 da, float Z, float X, float H, float sd, out float z) {
  float ax = abs(da.x);
  float side = step(0.0, da.x);
  z = X / max(ax, 1e-3);                                  // depth of the wall plane seen at this column
  float inSeg = smoothstep(Z - 0.02, Z + 0.04, z) * (1.0 - smoothstep(Z + 1.4, Z + 2.2, z)) * step(0.02, Z + 2.2);
  float top = (H + 0.22 * (fbm3(vec2(z * 3.1 + side * 7.0, sd)) - 0.5)) / max(z, 0.05);
  float aa = 0.01 + 0.004 / max(z, 0.05);
  return inSeg * (1.0 - smoothstep(top - aa, top + aa, da.y));
}
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  vec2 asp = vec2(uAspect, 1.0);
  vec2 c = vec2(0.5) + (hash22(vec2(uSeed * 61.3, 2.9)) - 0.5) * vec2(0.18, 0.14);
  vec2 d = uv - c;
  vec2 da = d * asp;
  float rr = dot(da, da) / (0.25 * (uAspect * uAspect + 1.0));   // 0 centre .. ~1 corners
  float a = clamp(p / 0.5, 0.0, 1.0);
  float b = clamp((p - 0.5) / 0.5, 0.0, 1.0);
  float zf = 1.0 + 0.02 * smoothstep(0.0, 0.15, p) + 1.3 * a * a * a;   // a small push from rest, then acceleration
  float sf = 0.10 * a * a * a;                    // ... with growing streaks
  float zt = 1.0 + 0.75 * pow(1.0 - b, 3.0);     // new scene decelerates out of the zoom
  float st = 0.09 * pow(1.0 - b, 3.0);
  float fly = pow(16.0 * p * p * (1.0 - p) * (1.0 - p), 1.6);   // zero velocity at both ends, eased harder
  float bar = 0.22 * fly;
  vec2 db = d * (1.0 + bar * min(rr, 1.0)) / (1.0 + bar);   // barrel distortion mid-flight (edges pinned)

  float j = hash12(gl_FragCoord.xy + 17.0);
  vec3 cf = vec3(0.0), ct = vec3(0.0);
  float ws = 0.0;
  for (int i = 0; i < 8; i++) {
    float t = (float(i) + j) / 8.0;
    float w = 1.0 - 0.6 * t;
    if (p < 0.6) cf += getFrom(c + db / (zf * (1.0 + sf * t))).rgb * w;
    if (p > 0.4) ct += getTo(c + db / (zt * (1.0 + st * t))).rgb * w;
    ws += w;
  }
  vec3 col = mix(cf, ct, smoothstep(0.42, 0.58, p)) / ws;

  // the misty gap, tinted by the scenes themselves
  float r = length(da);
  vec2 dirv = da / max(r, 1e-3);
  float tun = mix(0.5, fbm3(dirv * (2.0 + 0.35 / max(r, 0.15) - p * 7.0) + vec2(uSeed * 17.0, 3.0)), smoothstep(0.03, 0.3, r));
  float gap = exp(-pow((p - 0.5) / 0.095, 2.0));
  vec3 mistCol = mix(vec3(0.86, 0.9, 0.94), col, 0.35);
  col *= 1.0 - 0.28 * fly * rr;                  // gorge walls darken at the periphery
  col = mix(col, mistCol, clamp(smoothstep(0.5, 0.85, tun) * fly * 0.3 * smoothstep(0.05, 0.4, r), 0.0, 1.0));
  col = mix(col, mix(col, mistCol, 0.65) * (0.88 + 0.24 * tun), clamp(gap * (0.4 + 0.55 * tun), 0.0, 0.88));

  // 乘风穿峡: two dark cliff spurs loom out of the mist and rush past on either side
  float s = clamp((p - 0.28) / 0.44, 0.0, 1.0);
  float Z = mix(2.2, -2.3, s * s * (3.0 - 2.0 * s) * 0.5 + s * 0.5);
  float zc;
  float cov = yufeng_cliff(da, Z, 0.34, 0.42, uSeed * 31.0, zc);
  float fog = clamp(1.0 - exp(-zc * 0.75), 0.0, 1.0);                        // aerial perspective
  float stri = vnoise(vec2(da.y * zc * 6.0 + zc * 2.0, zc * 9.0 + uSeed * 5.0));
  vec3 rock = mix(vec3(0.05, 0.055, 0.06) + col * 0.12, mistCol * 0.95, fog) * (0.85 + 0.3 * stri);
  float wenv = smoothstep(0.28, 0.4, p) * (1.0 - smoothstep(0.66, 0.74, p));
  col = mix(col, rock, cov * wenv);
  col += vec3(1.0, 0.96, 0.88) * gap * exp(-r * 3.0) * 0.16;
  return vec4(col, 1.0);
}
`,
}));
