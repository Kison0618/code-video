/* 03 卷轴 · Handscroll（水墨）
 * 手卷自右向左徐徐展开，纸色微黄，旧景渐隐。
 *
 * 原理：一根圆柱卷轴从右往左滚。卷轴上的像素用 asin 把屏幕 x 反算到圆柱表面的弧长，取出"还卷在轴上"的那段新画面；圆柱按法线做漫反射 + 一条高光，边缘压暗。刚展开的纸面带泛黄和纤维，随后褪回原色；上下有绫绢装裱边和金色隔水线；卷轴前方旧画面上有柔和投影。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：e = mix(p, ease(p), 0.4)：线性为主，略带缓入缓出；轴半径随展开变细。
 * 建议时长：3.2 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：历史、古籍、时间线、"翻开下一卷"式的章节切换。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 3,
  "id": "juanzhou",
  "zh": "卷轴",
  "en": "Handscroll",
  "family": "水墨",
  "desc": "手卷自右向左徐徐展开，纸色微黄，旧景渐隐。",
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
  easing: "e = mix(p, ease(p), 0.4)：线性为主，略带缓入缓出；轴半径随展开变细。",
  glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);   // exact end frames
  if (p >= 1.0) return getTo(uv);
  float e = mix(p, ease(p), 0.4);
  float X = uv.x * uAspect;
  float R = 0.1 * (0.7 + 0.3 * (1.0 - e));        // the roll thins as it unrolls
  float xr = mix(uAspect + R + 0.1, -R - 0.12, e); // roller axis position
  float dx = X - xr;

  // mounting bands (装裱), shrinking away near the end
  float bandH = 0.042 * (1.0 - smoothstep(0.62, 0.92, p));

  vec2 suv = uv;
  float onRoll = 0.0;
  float nx = 0.0;
  if (abs(dx) <= R) {
    // top half of the cylinder: angle around the axis, paper arc length from contact
    onRoll = 1.0;
    nx = dx / R;
    float phi = 3.14159265 + asin(nx);
    float Xc = xr - R * phi;                  // content still wound on the roll
    Xc = abs(Xc);                             // mirror past the left edge
    float nz = sqrt(1.0 - nx * nx);
    suv = vec2(Xc / uAspect, 0.5 + (uv.y - 0.5) * (1.0 - 0.035 * nz));
  }

  vec3 a = getFrom(uv).rgb;
  vec3 col;
  if (dx > -R) {
    vec3 b = getTo(suv).rgb;
    vec2 Q = vec2(suv.x * uAspect, suv.y);

    // freshly unrolled paper: warm aged tint + fibres, fading as the roll moves on
    float fresh = exp(-max(dx, 0.0) / 0.5) * (1.0 - smoothstep(0.7, 1.0, p));
    fresh = max(fresh, onRoll * (1.0 - smoothstep(0.85, 1.0, p)));
    float mott = fbm3(Q * 5.0 + uSeed * 11.0);
    vec2 q1 = mat2(0.8, -0.6, 0.6, 0.8) * Q;
    vec2 q2 = mat2(0.28, 0.96, -0.96, 0.28) * Q;
    float fib = max(vnoise(q1 * vec2(160.0, 13.0)), vnoise(q2 * vec2(13.0, 160.0) + 7.0));
    vec3 aged = mix(b, vec3(luma(b)), 0.25) * vec3(1.02, 0.95, 0.82);
    aged *= 0.9 + 0.12 * mott;
    aged = mix(aged, aged * 1.06 + vec3(0.03, 0.025, 0.01), smoothstep(0.6, 0.95, fib) * 0.6);
    col = mix(b, aged, fresh);

    // silk mounting bands at top and bottom
    float yb = min(suv.y, 1.0 - suv.y);
    if (yb < bandH) {
      float dam = smoothstep(0.55, 0.9, vnoise(Q * vec2(90.0, 90.0)));     // faint damask flecks
      vec3 silk = vec3(0.6, 0.66, 0.62) * (0.95 + 0.06 * dam) * (0.94 + 0.1 * mott);
      silk = mix(silk, vec3(0.73, 0.62, 0.42), smoothstep(bandH - 0.004, bandH - 0.001, yb)); // 隔水 gold line
      col = silk;
    }
    // contact occlusion on the flat paper next to the roller
    col *= 1.0 - (1.0 - onRoll) * 0.35 * exp(-max(dx - R, 0.0) / 0.018) * (1.0 - smoothstep(0.9, 1.0, p));

    if (onRoll > 0.5) {
      // cylinder shading: cosine falloff + a specular line
      float nz = sqrt(max(1.0 - nx * nx, 0.0));
      vec3 n = vec3(nx, 0.0, nz);
      vec3 Ld = normalize(vec3(-0.55, 0.25, 0.8));
      float diff = max(dot(n, Ld), 0.0);
      float spec = pow(max(dot(n, normalize(Ld + vec3(0.0, 0.0, 1.0))), 0.0), 24.0);
      col = col * (0.22 + 0.88 * diff) + vec3(1.0, 0.96, 0.88) * spec * 0.14;
      col *= 0.55 + 0.45 * smoothstep(0.0, 0.25, nz);   // silhouette darkening
    }
  } else {
    // old scene ahead of the roller, under its soft shadow
    float dist = (xr - R) - X;
    float sh = (0.5 * exp(-dist / 0.035) + 0.22 * exp(-dist / 0.16)) * smoothstep(0.0, 0.06, p);
    col = a * (1.0 - sh);
  }
  return vec4(col, 1.0);
}
`,
}));
