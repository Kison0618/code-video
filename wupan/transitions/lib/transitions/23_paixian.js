/* 23 排线 · Engraving Sweep（纸张版画）
 * 一道铜版雕刻带斜着扫过，所到之处画面先变成排线版画，再在后面显出新画面的颜色。
 *
 * 原理：排线 = 平行线条纹，线宽随画面亮度变化：暗处线粗、亮处线细，就是铜版画用线的疏密表现明暗；比 0.45 更暗的地方再叠一层交叉排线。线条坐标加低频值噪声，模仿手刻的轻微抖动；线距按输出高度换算成约 5 像素，并按像素宽度做抗锯齿。扫描带沿斜向推进，前沿有一道深色刻刀线。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：扫描带前沿 mix(-0.05, 1.62, mix(p, ease(p), 0.5)) 匀中带缓；带宽 0.55，带内前半是旧画面的排线、后半是新画面的排线，交界用噪声撕开；带尾 0.14 宽渐回彩色。
 * 建议时长：2.2 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uRes, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：铜版画/版画风格的系列转场，"换个角度看"、引用文献或历史人物前；和我们的画风最贴。
 * 素材：通用；线距按像素算，换分辨率不用改参数
 * 源：转场库新增（照原作写法：PRELUDE + transition(uv)，辅助函数加式名前缀），定义在 tools/new_transitions.js。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 23,
  "id": "paixian",
  "zh": "排线",
  "en": "Engraving Sweep",
  "family": "纸张版画",
  "desc": "一道铜版雕刻带斜着扫过，所到之处画面先变成排线版画，再在后面显出新画面的颜色。",
  "duration": 2.2,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uRes",
    "uAspect",
    "uSeed"
  ],
  "usesTime": false
}, {
  easing: "扫描带前沿 mix(-0.05, 1.62, mix(p, ease(p), 0.5)) 匀中带缓；带宽 0.55，带内前半是旧画面的排线、后半是新画面的排线，交界用噪声撕开；带尾 0.14 宽渐回彩色。",
  glsl: `
// engraving rendition of colour c at P: ink coverage 0..1
float paixian_ink(vec2 P, vec3 c, float sd) {
  float L = luma(c);
  float per = 5.0 / uRes.y;                                  // ~5 px between lines
  float aa = 1.2 / 5.0;
  vec2 d1 = normalize(vec2(1.0, 0.32));
  float w1 = vnoise(P * 3.0 + sd) * 0.6 + vnoise(P * 11.0 - sd) * 0.25;
  float u1 = dot(P, vec2(-d1.y, d1.x)) / per + w1;
  float l1 = abs(fract(u1) - 0.5) * 2.0;                     // 0 on a line centre .. 1 between lines
  float t1 = clamp((0.95 - L) * 1.05, 0.0, 0.95);            // darker -> thicker line
  float ink = smoothstep(t1 + aa, t1 - aa, l1) * step(0.02, t1);
  vec2 d2 = normalize(vec2(-0.45, 1.0));
  float u2 = dot(P, vec2(-d2.y, d2.x)) / per + w1 * 0.7 + 0.37;
  float l2 = abs(fract(u2) - 0.5) * 2.0;
  float t2 = clamp((0.45 - L) * 1.6, 0.0, 0.8);
  ink = max(ink, smoothstep(t2 + aa, t2 - aa, l2) * step(0.02, t2));
  return ink;
}
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  vec2 P = vec2(uv.x * uAspect, uv.y);
  float sd = uSeed * 23.0;
  vec2 dir = normalize(vec2(1.0, -0.38));                    // sweep from the upper left to the lower right
  vec2 org = vec2(0.0, 1.0);
  float span = dot(vec2(uAspect, 0.0) - org, dir);
  float s = dot(P - org, dir) / span;
  const float BW = 0.55;
  float front = mix(-0.05, 1.0 + BW + 0.07, mix(p, ease(p), 0.5));
  float x = front - s;                                       // > 0 behind the front
  float nz = (vnoise(P * 6.0 + sd) - 0.5) * 0.08 + (vnoise(P * 25.0 - sd) - 0.5) * 0.02;
  float eng = smoothstep(-0.01, 0.02, x + nz) * (1.0 - smoothstep(BW - 0.14, BW, x + nz));
  float useTo = smoothstep(-0.02, 0.02, x - BW * 0.45 + nz * 2.0);
  vec3 a = getFrom(uv).rgb, b = getTo(uv).rgb;
  vec3 src = mix(a, b, useTo);
  vec3 paper = vec3(0.94, 0.91, 0.84) * (0.97 + 0.04 * vnoise(P * 40.0 + sd));
  vec3 inkC = vec3(0.12, 0.09, 0.07);
  float ink = mix(paixian_ink(P, a, sd), paixian_ink(P, b, sd), useTo);
  vec3 etch = mix(paper, inkC, ink);
  vec3 col = mix(src, etch, eng);
  // the burin's leading stroke
  float lead = exp(-pow((x + nz) / 0.006, 2.0)) * smoothstep(0.0, 0.08, p) * (1.0 - smoothstep(0.85, 1.0, p));
  col = mix(col, inkC, lead * 0.7);
  return vec4(col, 1.0);
}
`,
}));
