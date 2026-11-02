/* 21 撕纸 · Torn Paper（纸张版画）
 * 一声撕开，旧画面裂成两半向两侧飞走，露出底下的新画面。
 *
 * 原理：撕口是一条斜线加三层值噪声（6、40、160 倍频）做出的锯齿边。两半各有一个刚体变换（平移 + 绕撕口中点旋转），每个像素用逆变换回到纸片自己的坐标去取旧画面，所以纸片上的图跟着纸一起动。撕口内侧有一条宽窄不一的白色纸芯（纤维噪声 + 毛边），纸片在新画面上投下柔和的影子。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：0–0.27 裂口自上而下撕开（smoothstep），裂缝里先透出新画面；0.28–1 两半各自平移加旋转飞出，位移 ∝ pow(q,1.35)（先慢后快）；0.93–1 收尾。
 * 建议时长：1.8 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：推翻结论、"撕掉旧观念"、段落之间的强转折；纸张拼贴风格最贴。
 * 素材：通用
 * 源：转场库新增（照原作写法：PRELUDE + transition(uv)，辅助函数加式名前缀），定义在 tools/new_transitions.js。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 21,
  "id": "sizhi",
  "zh": "撕纸",
  "en": "Torn Paper",
  "family": "纸张版画",
  "desc": "一声撕开，旧画面裂成两半向两侧飞走，露出底下的新画面。",
  "duration": 1.8,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uAspect",
    "uSeed"
  ],
  "usesTime": false
}, {
  easing: "0–0.27 裂口自上而下撕开（smoothstep），裂缝里先透出新画面；0.28–1 两半各自平移加旋转飞出，位移 ∝ pow(q,1.35)（先慢后快）；0.93–1 收尾。",
  glsl: `
// x of the tear line at height y (aspect units): a slanted line + three octaves of jagged noise
float sizhi_tearX(float y, float c, float k, float sd) {
  return c + (y - 0.5) * k
    + 0.034 * (vnoise(vec2(y * 6.0, sd)) - 0.5) * 2.0
    + 0.012 * (vnoise(vec2(y * 40.0, sd + 3.1)) - 0.5) * 2.0
    + 0.004 * (vnoise(vec2(y * 160.0, sd + 7.7)) - 0.5) * 2.0;
}
vec2 sizhi_rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

// coverage of one torn half (side +1 right, -1 left) at screen point P; returns local uv and distance to the tear
float sizhi_piece(vec2 P, float side, float m, float gap, float torn, float c, float k, float sd,
                  out vec2 luv, out float dEdge, out float rimW) {
  vec2 piv = vec2(c, 0.5);
  vec2 off = side > 0.0 ? vec2(0.7 * uAspect, -0.08) * m : vec2(-0.7 * uAspect, -0.12) * m;
  float ang = side > 0.0 ? -0.35 * m : 0.25 * m;
  vec2 L = sizhi_rot(P - off - piv, -ang) + piv;      // back into the paper's own coordinates
  luv = vec2(L.x / uAspect, L.y);
  float d = side * (L.x - sizhi_tearX(L.y, c, k, sd));
  float isTorn = step(1.0 - torn, L.y);                // the tear runs from the top edge down
  float hair = 0.004 * smoothstep(0.55, 0.95, vnoise(vec2(L.y * 300.0, sd + side * 5.0)));
  d -= gap * isTorn;
  dEdge = d;
  rimW = (side > 0.0 ? 0.016 : 0.007) * (0.5 + vnoise(vec2(L.y * 22.0, sd + side)));
  float inX = isTorn > 0.5 ? smoothstep(-hair - 0.0015, -hair + 0.0015, d) : 1.0;
  float inB = step(0.0, luv.x) * step(luv.x, 1.0) * step(0.0, luv.y) * step(luv.y, 1.0);
  return inX * inB;
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  vec2 P = vec2(uv.x * uAspect, uv.y);
  float sd = uSeed * 31.0;
  float c = (0.5 + (uSeed - 0.5) * 0.24) * uAspect;    // where the tear crosses mid-height
  float k = 0.16 + 0.12 * (fract(uSeed * 7.3) - 0.5);  // its slant
  float torn = smoothstep(0.02, 0.27, p) * 1.15;
  float q = clamp((p - 0.28) / 0.72, 0.0, 1.0);
  float m = pow(q, 1.35);
  float gap = 0.004 * smoothstep(0.05, 0.3, p) + 0.01 * m;

  vec3 col = getTo(uv).rgb;
  // soft shadow of both halves on the new scene
  vec2 so = vec2(0.012, -0.018) * (0.4 + 2.0 * m);
  vec2 l0; float d0, w0;
  float shR = sizhi_piece(P - so, 1.0, m, gap, torn, c, k, sd, l0, d0, w0);
  float shL = sizhi_piece(P - so, -1.0, m, gap, torn, c, k, sd, l0, d0, w0);
  col *= 1.0 - 0.32 * max(shR, shL) * smoothstep(0.0, 0.2, p);

  vec3 paper = vec3(0.965, 0.95, 0.915);
  for (int i = 0; i < 2; i++) {
    float side = i == 0 ? -1.0 : 1.0;
    vec2 luv; float dE, rw;
    float cov = sizhi_piece(P, side, m, gap, torn, c, k, sd, luv, dE, rw);
    if (cov > 0.0) {
      vec3 a = getFrom(luv).rgb;
      float isTorn = step(1.0 - torn, luv.y);
      // white paper core along the torn edge, with fibres
      float fib = vnoise(vec2(dE * 900.0, luv.y * 70.0 + side * 9.0));
      float rim = (1.0 - smoothstep(rw * 0.6, rw, dE + (fib - 0.5) * 0.004)) * isTorn;
      vec3 core = paper * (0.93 + 0.07 * fib);
      vec3 pc = mix(a, core, rim);
      pc *= 1.0 - 0.08 * m;                             // the lifted paper catches less light
      col = mix(col, pc, cov);
    }
  }
  col = mix(col, getTo(uv).rgb, smoothstep(0.93, 1.0, p));
  return vec4(col, 1.0);
}
`,
}));
