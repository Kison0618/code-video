/* 24 翻页 · Page Turn（纸张版画）
 * 画面像一页纸从右下角掀起，卷过圆弧翻到左上方，露出下一页。
 *
 * 原理：经典的圆柱翻页：卷曲线垂直于翻页方向，页面在卷曲线处绕一个半径 R 的圆柱翻过去。屏幕上每一点按到卷曲线的距离分三区：卷曲线以外是还平放的旧页（可能被翻过来的背面盖住）；圆柱区用 asin 反算出这一点对应纸上的哪一段弧长，有正面（旧画面）和背面（纸色）两层；卷曲线以内是新页，带圆柱投下的影子。背面是米黄纸色，透出一点点旧画面的亮度（纸背透印）。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：卷曲线位置 mix(-0.02, 对角 + R, mix(p, ease(p), 0.5))：起手慢、中段快、落下慢；卷曲半径 0.12 屏高。
 * 建议时长：1.6 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用："下一页 / 下一章"、故事里翻过去、清单逐条切换；纸张拼贴风格天然合适。
 * 素材：通用
 * 源：转场库新增（照原作写法：PRELUDE + transition(uv)，辅助函数加式名前缀），定义在 tools/new_transitions.js。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 24,
  "id": "fanye",
  "zh": "翻页",
  "en": "Page Turn",
  "family": "纸张版画",
  "desc": "画面像一页纸从右下角掀起，卷过圆弧翻到左上方，露出下一页。",
  "duration": 1.6,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uAspect",
    "uSeed"
  ],
  "usesTime": false
}, {
  easing: "卷曲线位置 mix(-0.02, 对角 + R, mix(p, ease(p), 0.5))：起手慢、中段快、落下慢；卷曲半径 0.12 屏高。",
  glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  const float PI = 3.14159265;
  vec2 P = vec2(uv.x * uAspect, uv.y);
  vec2 P0 = vec2(uAspect, 0.0);                              // the corner that lifts first
  vec2 dir = normalize(vec2(-1.0, 0.45 + 0.2 * (uSeed - 0.5)));
  float R = 0.12;
  float smax = dot(vec2(0.0, 1.0) - P0, dir);
  float pos = mix(-0.02, smax + R + 0.03, mix(p, ease(p), 0.5));
  float s = dot(P - P0, dir);
  vec3 to = getTo(uv).rgb;
  vec3 paper = vec3(0.94, 0.915, 0.85);
  vec3 col;

  // which page point lands here, for a given arc length a past the fold (s_o = pos - a)
  // back layer first (it lies on top), then the front side of the curl, then the flat old page / new page
  bool done = false;
  // 1) flat back side lying over the old page: a = s - pos + PI R
  if (s > pos) {
    float so = pos - (s - pos + PI * R);
    vec2 Po = P + dir * (so - s);
    vec2 uo = vec2(Po.x / uAspect, Po.y);
    if (so >= 0.0 && uo.x >= 0.0 && uo.x <= 1.0 && uo.y >= 0.0 && uo.y <= 1.0) {
      float L = luma(getFrom(uo).rgb);
      vec3 back = mix(paper, vec3(L) * paper, 0.14) * (0.96 + 0.04 * vnoise(Po * 50.0));
      back *= 0.9 + 0.1 * smoothstep(0.0, 0.25, s - pos);       // a little darker near the fold
      col = back; done = true;
    } else {
      vec3 a = getFrom(uv).rgb;
      col = a * (1.0 - 0.28 * exp(-(s - pos) / 0.035));          // the curl shades the page in front of it
      // shadow cast by the flipped flap's edge
      float edgeS = 2.0 * pos - PI * R;                          // far edge of the flap along s (for s_o = 0)
      col *= 1.0 - 0.22 * smoothstep(0.05, 0.0, s - edgeS) * step(edgeS, s) * step(pos, edgeS);
      done = true;
    }
  }
  // 2) on the cylinder: upper (back) layer, else lower (front) layer
  if (!done && s > pos - R) {
    float th1 = asin(clamp((pos - s) / R, 0.0, 1.0));
    float th2 = PI - th1;
    float so2 = pos - th2 * R;
    vec2 Po2 = P + dir * (so2 - s);
    vec2 u2 = vec2(Po2.x / uAspect, Po2.y);
    if (so2 >= 0.0 && u2.x >= 0.0 && u2.x <= 1.0 && u2.y >= 0.0 && u2.y <= 1.0) {
      float L = luma(getFrom(u2).rgb);
      vec3 back = mix(paper, vec3(L) * paper, 0.14);
      col = back * (0.72 + 0.3 * sin(th2));                      // lit from above
      done = true;
    } else {
      float so1 = pos - th1 * R;
      vec2 Po1 = P + dir * (so1 - s);
      vec2 u1 = vec2(Po1.x / uAspect, Po1.y);
      if (so1 >= 0.0 && u1.x >= 0.0 && u1.x <= 1.0 && u1.y >= 0.0 && u1.y <= 1.0) {
        col = getFrom(u1).rgb * (1.0 - 0.45 * sin(th1) * sin(th1));   // the front bends away from the light
        done = true;
      }
    }
  }
  // 3) uncovered: the next page, shadowed by the curl
  if (!done) {
    float dd = max(pos - R - s, 0.0);
    col = to * (1.0 - 0.42 * exp(-dd / 0.07) * smoothstep(0.0, 0.08, p));
  }
  col = mix(col, to, smoothstep(0.96, 1.0, p));
  return vec4(col, 1.0);
}
`,
}));
