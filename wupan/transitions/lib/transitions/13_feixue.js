/* 13 飞雪 · Snow Squall（天气）
 * 朔风卷雪过山，白茫茫散尽又是新山。
 *
 * 原理：一团"风雪"沿风向（左上→右下）扫过：到达前沿和离开前沿之间是白茫茫的雪幕（沿风向拉长的 fbm，冷蓝白），雪幕里画面降成冷灰；换景前沿夹在中间、被雪幕挡住。三层视差雪花，每层是与风向对齐的网格，每格一片，按风速拉长、横向颤动。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：三道前沿（风暴到达、换景、风暴离开）分别在 p 的 0–0.5、0.25–0.75、0.5–1 匀速掠过；雪量 0–0.3 起、0.5–1 收。
 * 建议时长：3.2 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：冬季、高原、寒冷/艰难，遮挡式切换。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 13,
  "id": "feixue",
  "zh": "飞雪",
  "en": "Snow Squall",
  "family": "天气",
  "desc": "朔风卷雪过山，白茫茫散尽又是新山。",
  "duration": 3.2,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uAspect",
    "uSeed"
  ],
  "usesTime": false
}, {
  easing: "三道前沿（风暴到达、换景、风暴离开）分别在 p 的 0–0.5、0.25–0.75、0.5–1 匀速掠过；雪量 0–0.3 起、0.5–1 收。",
  glsl: `
// One parallax layer of wind-blown flakes, in a grid aligned with the wind.
float feixue_layer(vec2 a, vec2 W, float scale, float speed, float stretch, float rad,
                   float T, float dens, float sd) {
  vec2 Wp = vec2(-W.y, W.x);
  float along = dot(a, W);
  float across = dot(a, Wp);
  float cx = across * scale;
  float colId = floor(cx);
  float ch = hash12(vec2(colId + 0.5, sd));
  float sp = speed * (0.8 + 0.4 * ch);
  float cy = (along - sp * T) * scale * 0.5 + ch * 13.0;
  vec2 id = vec2(colId, floor(cy));
  vec2 f = vec2(fract(cx), fract(cy)) - 0.5;
  vec2 h = hash22(id + sd * 1.7);
  float h3 = hash12(id + 31.7 + sd);
  vec2 c = (h - 0.5) * vec2(0.4, 0.36);
  c.x += 0.09 * sin(T * (1.5 + h.x * 2.5) + h.y * 6.283);   // flutter across the wind
  vec2 d = f - c;
  d.y *= 2.0 / stretch;                                     // cell is 2 units long; motion stretch
  float r = rad * (0.6 + 0.6 * h.x);
  float m = 1.0 - smoothstep(0.0, r, length(d));
  m *= m;
  float pres = clamp((dens - h3) * 6.0, 0.0, 1.0);
  return m * pres * (0.55 + 0.45 * h.y);
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  float sd = floor(uSeed * 997.0);
  vec2 W = normalize(vec2(0.86, -0.5 - 0.15 * uSeed));   // wind: from upper left, down to the right
  vec2 Wp = vec2(-W.y, W.x);
  float T = p * 3.2 + uSeed * 11.0;
  vec2 a = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);

  // squall body: arrival front, swap front and trailing edge all ride the wind
  float s = dot(a, W);
  float n2 = fbm3(a * 2.2 - W * T * 0.25 + vec2(sd * 0.11, 1.3));
  float sn = s + (n2 - 0.5) * 0.6;
  float fA = mix(-1.9, 1.9, clamp(p / 0.5, 0.0, 1.0));
  float fM = mix(-1.9, 1.9, clamp((p - 0.25) / 0.5, 0.0, 1.0));
  float fB = mix(-1.9, 1.9, clamp((p - 0.5) / 0.5, 0.0, 1.0));
  float inA = smoothstep(0.0, 0.6, fA - sn);
  float outB = smoothstep(0.0, 0.6, fB - sn);
  float sq = inA * (1.0 - outB);
  float swap = smoothstep(-0.12, 0.12, fM - sn);

  vec3 from = getFrom(uv).rgb;
  vec3 to = getTo(uv).rgb;
  vec3 col = mix(from, to, swap);

  // whiteout: streaky drifting veils, cool blue-white, never flat
  vec2 ra = vec2(dot(a, W), dot(a, Wp));
  float n1 = fbm(vec2(ra.x * 1.1, ra.y * 3.4) - vec2(T * 0.55, 0.0) + vec2(sd * 0.07, 5.1));
  float veil = clamp(sq * (0.38 + 0.85 * n1) + 0.22 * sq * sq, 0.0, 0.965);
  float L = luma(col);
  vec3 cold = vec3(L) * vec3(0.9, 0.96, 1.06) * 0.85 + vec3(0.1, 0.11, 0.13);
  col = mix(col, cold, 0.55 * sq);                                  // flat, cold storm light
  vec3 hz = mix(vec3(0.6, 0.66, 0.77), vec3(0.94, 0.96, 1.0), smoothstep(0.32, 0.72, n1));
  hz += (n2 - 0.5) * vec3(0.05, 0.05, 0.06);
  col = mix(col, hz, veil);

  // snow: three parallax layers, density follows the squall and thins out after it
  float dg = smoothstep(0.0, 0.3, p) * (1.0 - smoothstep(0.5, 1.0, p));
  float dl = dg * (0.3 + 0.7 * inA);
  float f1 = feixue_layer(a, W, 34.0, 0.55, 1.5, 0.2, T, dl, sd + 1.0);
  float f2 = feixue_layer(a + vec2(0.37, 0.11), normalize(W + vec2(0.0, -0.08)), 16.0, 1.0, 2.2, 0.2, T, dl * 0.85, sd + 2.0);
  float f3 = feixue_layer(a + vec2(0.71, 0.53), normalize(W + vec2(0.0, -0.16)), 6.5, 1.9, 2.8, 0.17, T, dl * 0.6, sd + 3.0);
  vec3 flake = vec3(0.97, 0.98, 1.0);
  col = mix(col, flake, clamp(f1 * 0.7, 0.0, 1.0));
  col = mix(col, flake, clamp(f2 * 0.9, 0.0, 1.0));
  // near flakes read grey against the whiteout, bright against the land
  vec3 nearC = mix(flake, vec3(0.62, 0.67, 0.76), veil * 0.7);
  col = mix(col, nearC, clamp(f3 * 0.95, 0.0, 1.0));
  return vec4(col, 1.0);
}
`,
}));
