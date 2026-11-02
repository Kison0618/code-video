/* 09 金辉 · Golden Light（自然）
 * 日照金山，一缕金光漫过，亮处先现新景。
 *
 * 原理：光从顶部一个角（由 seed 决定左右）斜扫过画面。新画面按"亮度键"出现：先出现最亮的部分（雪顶、天空），暗部最后。在近似线性光下按曝光档位提亮、偏暖白平衡，再用 ACES 色调映射压回；加角落漏光、一条水平光芒（streak）、高光周围的红色光晕（halation），最后把高光推向金色、阴影推向赭色。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：光的前沿 smoothstep(0.02, 0.6, p) 扫过；新画面的亮度阈值在 0.26–0.9 之间从 1.25 降到 -0.3；整体光效包络 0–0.42 起、0.5–1 落。
 * 建议时长：2.8 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：日出、高光时刻、成就/揭晓，"日照金山"。
 * 素材：有明显高光的画面（雪山、天空）效果最好；暗场画面会变成整体提亮的暖光扫过
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 9,
  "id": "jinhui",
  "zh": "金辉",
  "en": "Golden Light",
  "family": "自然",
  "desc": "日照金山，一缕金光漫过，亮处先现新景。",
  "duration": 2.8,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uAspect",
    "uSeed"
  ],
  "usesTime": false
}, {
  easing: "光的前沿 smoothstep(0.02, 0.6, p) 扫过；新画面的亮度阈值在 0.26–0.9 之间从 1.25 降到 -0.3；整体光效包络 0–0.42 起、0.5–1 落。",
  glsl: `
vec3 jinhui_aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  vec2 asp = vec2(uAspect, 1.0);
  float side = step(0.5, fract(uSeed * 7.31 + 0.13));
  vec2 src = vec2(mix(-0.08, 1.08, side), 1.08);                // light enters from a top corner
  vec2 far = vec2(1.0 - side, 0.0);
  vec2 dir = normalize((far - src) * asp);
  float span = dot((far - src) * asp, dir);
  float s = dot((uv - src) * asp, dir) / span;                  // 0 at the source corner .. 1 at the far one
  float front = mix(-0.25, 1.3, smoothstep(0.02, 0.6, p));
  float swept = 1.0 - smoothstep(front - 0.3, front + 0.05, s); // ground the light has reached
  float edge = exp(-pow((s - front) / 0.16, 2.0));              // bright leading band
  float env = smoothstep(0.0, 0.42, p) * (1.0 - smoothstep(0.5, 1.0, p));

  vec3 fa = getFrom(uv).rgb, tb = getTo(uv).rgb;
  vec2 hr = vec2(0.016 / uAspect, 0.016);
  vec2 hq = vec2(hr.x, -hr.y);
  vec3 bf = (getFrom(uv + hr).rgb + getFrom(uv - hr).rgb + getFrom(uv + hq).rgb + getFrom(uv - hq).rgb) * 0.25;
  vec3 bt = (getTo(uv + hr).rgb + getTo(uv - hr).rgb + getTo(uv + hq).rgb + getTo(uv - hq).rgb) * 0.25;

  // the next scene emerges highlights-first (keyed on its softened luminance)
  float thr = mix(1.25, -0.3, smoothstep(0.26, 0.9, p));
  float key = mix(luma(tb), luma(bt), 0.6) * 0.82 + swept * 0.14;
  float m = smoothstep(thr - 0.1, thr + 0.1, key);
  vec3 base = mix(fa, tb, m);
  vec3 blur = mix(bf, bt, m);

  // expose in (approx.) linear light, warm white balance, then filmic tonemap
  float stops = env * (0.7 * swept + 0.8 * edge);
  vec3 lin = base * base;
  vec3 warm = mix(vec3(1.0), vec3(1.3, 0.92, 0.52), clamp(env * (0.4 + 0.6 * swept), 0.0, 1.0));
  vec3 x = lin * warm * exp2(stops);
  float dsrc = length((uv - src) * asp);
  float core = exp(-dsrc * 3.0);
  vec3 leakCol = mix(vec3(1.0, 0.34, 0.06), vec3(1.0, 0.8, 0.5), core);
  x += leakCol * env * (core * 0.8 + edge * 0.18 * swept + 0.01);
  vec2 sunP = vec2(mix(0.1, 0.9, side), 0.9);
  float dy = uv.y - sunP.y;
  float dx = (uv.x - sunP.x) * uAspect;
  float streak = exp(-pow(dy / 0.005, 2.0)) * exp(-abs(dx) * 1.8) + 0.3 * exp(-pow(dy / 0.035, 2.0)) * exp(-abs(dx) * 3.0)
               + 0.5 * exp(-length(vec2(dx, dy)) * 9.0);
  x += vec3(1.0, 0.7, 0.4) * streak * env * 0.75;
  float hal = max(luma(blur * blur) * exp2(stops) - 0.5, 0.0);     // halation around clipped highlights
  x += vec3(1.0, 0.3, 0.08) * hal * 0.45 * env;
  vec3 graded = sqrt(jinhui_aces(x * 0.72));
  float gl = luma(graded);
  vec3 gold = vec3(gl * 1.1, gl * 0.84, gl * gl * 0.55 + gl * 0.05);   // 日照金山: highlights run to gold, shadows to umber
  graded = mix(graded, gold, clamp(env * (0.1 + 0.32 * swept + 0.3 * edge), 0.0, 1.0));
  vec3 col = mix(base, graded, smoothstep(0.0, 0.6, env));
  return vec4(col, 1.0);
}
`,
}));
