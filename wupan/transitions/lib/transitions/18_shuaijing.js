/* 18 甩镜 · Whip Pan（电影）
 * 镜头猛然横甩，山川拉成流光，落定已是他乡。
 *
 * 原理：把新旧两幅图想成同一张全景图上相距 0.95 屏宽的两段，镜头沿全景横甩。每像素在快门时间内做 22 次时间采样（时间积分的真实运动模糊，按行做低差异抖动形成细横纹），每次采样根据所在时刻决定取旧图还是新图；加卷帘快门（上行先读）和与速度成正比的手持抖动；越界镜像采样。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：机位走 tanh S 曲线（K=9），速度 ∝ sech²，p=0.5 最快；快门角在两端收到 0，所以 p=0/1 是精确原图。
 * 建议时长：2.0 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（由公式保证）。
 * 适用：快节奏、地点跳转、对比（A 地→B 地）、综艺/纪录片式硬切的替代。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 18,
  "id": "shuaijing",
  "zh": "甩镜",
  "en": "Whip Pan",
  "family": "电影",
  "desc": "镜头猛然横甩，山川拉成流光，落定已是他乡。",
  "duration": 2,
  "uniforms": [
    "uFrom",
    "uTo",
    "uProgress",
    "uSeed"
  ],
  "usesTime": false
}, {
  easing: "机位走 tanh S 曲线（K=9），速度 ∝ sech²，p=0.5 最快；快门角在两端收到 0，所以 p=0/1 是精确原图。",
  glsl: `
// One continuous camera move: the new scene sits D screen-widths to the right of the old one
// on the same "panorama". Position follows a tanh S-curve (velocity ~ sech^2, peaking at t=0.5).
float shuaijing_th(float x) { float e = exp(2.0 * clamp(x, -12.0, 12.0)); return (e - 1.0) / (e + 1.0); }
const float shuaijing_K = 9.0;
float shuaijing_S(float t) {
  t = clamp(t, 0.0, 1.0);
  return 0.5 + 0.5 * shuaijing_th(shuaijing_K * (t - 0.5)) / shuaijing_th(0.5 * shuaijing_K);
}
float shuaijing_V(float t) {      // normalised angular speed 0..1
  float h = shuaijing_th(shuaijing_K * (clamp(t, 0.0, 1.0) - 0.5));
  return 1.0 - h * h;
}
vec2 shuaijing_mir(vec2 u) { return 1.0 - abs(1.0 - mod(u, 2.0)); }

vec4 transition(vec2 uv) {
  float p = uProgress;
  const float D = 0.95;      // total camera travel, in screen widths
  const float RS = 0.05;     // rolling-shutter readout time (top row first), in progress units
  // shutter half-angle in progress units; folds to 0 at the ends so p=0/1 are exact
  float H = 0.05 * smoothstep(0.0, 0.18, p) * smoothstep(1.0, 0.82, p);
  // per-row low-discrepancy jitter: residual sampling noise turns into fine horizontal streaks
  float jit = fract(floor(gl_FragCoord.y) * 0.618034 + 0.35 * hash12(vec2(floor(gl_FragCoord.y), floor(gl_FragCoord.x / 61.0))));
  float ph = uSeed * 37.0;
  vec4 acc = vec4(0.0);
  float wsum = 0.0;
  for (int j = 0; j < 22; j++) {
    float fj = float(j);
    float fc = (fj + 0.5) / 22.0 - 0.5;           // tap centre within the shutter (-0.5..0.5)
    float f = (fj + jit) / 22.0 - 0.5;            // jittered tap
    float tc = p + 2.0 * H * fc;                  // uniform per tap -> decides old/new scene
    float t = p + 2.0 * H * f - RS * (uv.y - 0.5) * smoothstep(0.0, 0.3, p) * smoothstep(1.0, 0.7, p);
    float v = shuaijing_V(t);
    // handheld vertical shake, proportional to angular speed
    float sy = v * (0.0065 * sin(t * 31.0 + ph) + 0.0035 * sin(t * 57.0 + ph * 1.7));
    float x = uv.x + D * shuaijing_S(t);
    float w = 0.55 + 0.45 * cos(f * 6.2831853 * 0.5);
    vec4 c;
    if (tc < 0.5) c = getFrom(shuaijing_mir(vec2(x, uv.y + sy)));
    else          c = getTo(shuaijing_mir(vec2(x - D, uv.y + sy)));
    acc += c * w;
    wsum += w;
  }
  return acc / wsum;
}
`,
}));
