/* 11 风沙 · Wind & Sand（自然）
 * 长风起处，旧景化作细沙随风散去。
 *
 * 原理：把画面放进与风向对齐的网格（约 300 列）。每格有一个随位置推进的"起飞阈值"，超过就从旧画面上剥落；每个像素沿风向往上游回看 12 + 14 个格子，找出此刻正飞过自己的沙粒（近粒短跳、远粒飘得远），沙粒颜色取它起飞位置的旧画面色并偏沙黄。剥落前先"晒干"成沙色；侵蚀带下风处有一层流动的细尘。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：侵蚀阈值沿风向线性推进（P = mix(-0.15, 1.24, p)），阵风噪声让局部提前；每粒沙寿命 0.22，飞行距离 ∝ a²（加速飘走）。
 * 建议时长：3.0 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uTime, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 注意：用到 uTime（缓慢漂移或逐帧抖动）。逐帧渲染时把 time 设成帧时间或固定值，结果就是确定的。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：沙漠、消逝、历史湮没、"化为尘土"，解体式切换。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 11,
  "id": "fengsha",
  "zh": "风沙",
  "en": "Wind & Sand",
  "family": "自然",
  "desc": "长风起处，旧景化作细沙随风散去。",
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
  easing: "侵蚀阈值沿风向线性推进（P = mix(-0.15, 1.24, p)），阵风噪声让局部提前；每粒沙寿命 0.22，飞行距离 ∝ a²（加速飘走）。",
  glsl: `
// Grains live on a wind-aligned grid (~300 columns), so a grain only ever travels along its own row
// and each pixel can find the grains passing over it by looking back upwind along that row.
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  const float PRE = 0.05;
  const float LIFE = 0.22;
  vec2 W = vec2(0.9781, 0.2079);                 // wind: right and a little up
  vec2 Wp = vec2(-W.y, W.x);
  vec2 A = vec2(uv.x * uAspect, uv.y);
  float cs = uAspect / 300.0;
  vec2 Q = vec2(dot(A, W), dot(A, Wp)) / cs;     // grain-grid coordinates (cell units)
  float span = (uAspect * W.x + W.y) / cs;
  vec2 sd = vec2(uSeed * 113.0, uSeed * 71.0);
  float gust = fbm3(A * vec2(1.3, 2.4) + sd * 0.1 - vec2(uTime * 0.04, 0.0));
  float gT = 0.28 * (1.0 - clamp((gust - 0.2) / 0.6, 0.0, 1.0));   // gusts strip the image early
  float P = mix(-PRE - 0.1, 1.0 + LIFE + 0.02, p);   // starts below every (jittered) threshold

  // the standing image crumbles along a warped grid, so its edge is ragged rather than square
  vec2 wq = Q + (vec2(vnoise(Q * 0.55 + sd), vnoise(Q * 0.55 + sd + 7.3)) - 0.5) * 1.4;
  vec2 hc = floor(wq);
  float thr0 = 0.62 * max(hc.x + 0.5, 0.0) / span + gT + 0.06 * hash12(hc + sd);
  float lo = clamp((P - thr0) / PRE + 1.0, 0.0, 1.0);   // 0 solid .. 1 lifting off
  float intact = 1.0 - step(thr0, P);

  float row = floor(Q.y);
  float ix = floor(Q.x);
  float rk = floor(hash12(vec2(row, 37.0) + sd) * 4.0);
  float best = 0.0, bestA = 0.0, bestX = 0.0, bestS = 0.0;
  // near grains: three in four of each row, short hop
  for (int m = 0; m < 12; m++) {
    float ci = ix - float(m);
    if (mod(ci + rk, 4.0) > 0.5) {
      vec2 h = hash22(vec2(ci, row) + sd);
      float a = (P - (0.62 * max(ci + 0.5, 0.0) / span + gT + 0.06 * h.x - 0.08 * fract(h.y * 5.31))) / LIFE;
      if (a > 0.0 && a < 1.0) {
        float sp = 0.6 + 0.8 * fract(h.x * 13.7);
        float gy = row + 0.5 + (h.y - 0.5) * 0.4 * smoothstep(0.0, 0.3, a);
        float gx = ci + 0.5 + sp * (7.0 * a * a + 0.6 * a);
        float len = sp * (14.0 * a + 0.6) * 0.09;
        float dx = Q.x - gx;
        float tt = clamp(dx, -len, 0.0);
        float dd = length(vec2(dx - tt, Q.y - gy));
        float r = (0.28 + 0.18 * fract(h.y * 7.13)) * (1.0 - 0.4 * a);
        float cov = (1.0 - smoothstep(r * 0.45, r, dd)) * (1.0 - a * a) * (1.0 + 0.7 * tt / max(len, 1e-3));
        if (cov > best) { best = cov; bestA = a; bestX = ci; bestS = h.y; }
      }
    }
  }
  // far grains: one in four per row is fine enough to be carried far downwind
  float base = ix - mod(ix + rk, 4.0);
  for (int m = 0; m < 14; m++) {
    float ci = base - 4.0 * float(m);
    vec2 h = hash22(vec2(ci, row) + sd);
    float a = (P - (0.62 * max(ci + 0.5, 0.0) / span + gT + 0.06 * h.x - 0.08 * fract(h.y * 5.31))) / LIFE;
    if (a > 0.0 && a < 1.0) {
      float sp = 0.45 + 0.7 * fract(h.x * 13.7);
      float gy = row + 0.5 + (h.y - 0.5) * 0.4 * smoothstep(0.0, 0.3, a);
      float gx = ci + 0.5 + sp * (44.0 * a * a + a);
      float len = sp * (60.0 * a + 1.0) * 0.06;
      float dx = Q.x - gx;
      float tt = clamp(dx, -len, 0.0);
      float dd = length(vec2(dx - tt, Q.y - gy));
      float r = (0.24 + 0.14 * fract(h.y * 7.13)) * (1.0 - 0.4 * a);
      float cov = (1.0 - smoothstep(r * 0.4, r, dd)) * (1.0 - a * a) * (0.3 + 0.45 * fract(h.y * 3.71))
                * (1.0 + 0.8 * tt / max(len, 1e-3));
      if (cov > best) { best = cov; bestA = a; bestX = ci; bestS = h.y; }
    }
  }

  vec3 sandLit = vec3(1.0, 0.84, 0.6);
  vec2 gc = vec2(bestX + 0.5, row + 0.5) * cs;
  vec2 gA = gc.x * W + gc.y * Wp;
  vec3 grain = getFrom(vec2(gA.x / uAspect, gA.y)).rgb;
  grain = mix(grain, sandLit * (0.72 + 0.4 * luma(grain)), 0.55 + 0.4 * bestA);
  grain *= 1.0 + 0.35 * step(0.82, fract(bestS * 17.3));          // a few grains catch the sun

  // fine dust veil drifting downwind of the eroding zone
  float xn = Q.x / span;
  float ag = P - (0.62 * max(xn - 0.12, 0.0) + gT + 0.03);
  float act = smoothstep(0.0, 0.06, ag) * (1.0 - smoothstep(0.06, 0.28, ag));
  float s1 = vnoise(vec2(Q.x * 0.02 - P * 30.0, Q.y * 0.16) + sd);
  float s2 = vnoise(vec2(Q.x * 0.008 - P * 12.0, Q.y * 0.05) + sd.yx);
  float dust = act * smoothstep(0.15, 0.85, s1 * 0.6 + s2 * 0.4) * 0.45;

  vec3 fromC = getFrom(uv).rgb;
  fromC = mix(fromC, sandLit * (0.35 + 0.7 * luma(fromC)), lo * 0.55);   // drying to sand just before it lifts
  vec3 col = mix(getTo(uv).rgb, fromC, intact);
  col = mix(col, grain, clamp(best, 0.0, 1.0));
  col = mix(col, vec3(0.86, 0.7, 0.5) * (0.6 + 0.5 * luma(col)), dust);
  return vec4(col, 1.0);
}
`,
}));
