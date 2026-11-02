/* 17 印章 · Seal Stamp（园林器物）
 * 朱印一落，方寸之间，钤出万里山河。
 *
 * 原理：SDF 朱文印：圆角方框 + 篆意"山"字（U 形底 + 中竖）。印泥的不完美用三层噪声（fbm 浓淡、细值噪声、simplex 纸纹空洞）改写距离场和密度，落印后边缘还会洇开一点。印框内新画面浸开，然后整个印放大，框内的新画面变成全屏。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：0–0.35 印章下落（失焦、半透明、投影偏移收拢）；p=0.35 落印：镜头震动（指数衰减）+ 轻微挤压；0.35–0.51 框内新画面从中心浸开；0.56–1 印框放大到 7.5 倍；印文 0.58–0.82、边框 0.66–0.93 先后淡出。
 * 建议时长：3.0 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uRes, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（由公式保证）。
 * 适用：结尾落款、定论/强调、"盖棺定论"、品牌收尾。
 * 素材：通用（印文"山"是 SDF 画的；换字需要改 yinzhang_seal）
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 17,
  "id": "yinzhang",
  "zh": "印章",
  "en": "Seal Stamp",
  "family": "园林器物",
  "desc": "朱印一落，方寸之间，钤出万里山河。",
  "duration": 3,
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
  easing: "0–0.35 印章下落（失焦、半透明、投影偏移收拢）；p=0.35 落印：镜头震动（指数衰减）+ 轻微挤压；0.35–0.51 框内新画面从中心浸开；0.56–1 印框放大到 7.5 倍；印文 0.58–0.82、边框 0.66–0.93 先后淡出。",
  glsl: `
float yinzhang_box(vec2 p, vec2 b, float rr) {
  vec2 q = abs(p) - b + rr;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rr;
}

// 朱文 seal: border + a seal-script 山 (U-shaped base rising into two side strokes, a tall centre stroke).
float yinzhang_seal(vec2 Q, float bw) {
  float outer = yinzhang_box(Q, vec2(1.0), 0.05);
  float inner = yinzhang_box(Q, vec2(1.0 - bw), 0.02);
  float border = max(outer, -inner);
  float sw = 0.072;
  float u = abs(yinzhang_box(Q - vec2(0.0, -0.08), vec2(0.54, 0.50), 0.30)) - sw;
  u = max(u, Q.y - 0.20);
  float c = yinzhang_box(Q - vec2(0.0, 0.02), vec2(sw, 0.60), 0.02);
  float glyph = min(u, c);
  return min(border, glyph);
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  vec2 P = (uv - 0.5) * vec2(uAspect, 1.0);
  const float ti = 0.35;          // impact
  const float h = 0.30;           // seal half-size (screen heights) at rest

  // camera shake at impact
  float k = max(p - ti, 0.0);
  float shk = step(ti, p) * exp(-k * 28.0) * (1.0 - smoothstep(0.5, 0.6, p));
  vec2 shake = vec2(sin(k * 210.0), sin(k * 170.0)) * (uSeed > 0.5 ? 1.0 : -1.0) * 0.006 * shk;
  vec2 Ps = P - shake;
  vec2 uvs = uv - shake / vec2(uAspect, 1.0);
  vec3 from = getFrom(uvs).rgb;
  vec3 to = getTo(uvs).rgb;

  // scale: approach (descending, scale-down), squash at impact, then fast outward growth
  float pa = clamp(p / ti, 0.0, 1.0);
  float Sa = mix(1.45, 1.0, pa * pa);
  float squash = 1.0 - 0.025 * shk;
  float pg = clamp((p - 0.56) / 0.44, 0.0, 1.0);
  float G = exp(log(7.5) * pg * pg);
  float Sc = Sa * squash * G;
  vec2 Q = Ps / (h * Sc);
  float px = 1.0 / (uRes.y * h * Sc);

  // stamped-ink imperfection
  vec2 sd = vec2(uSeed * 41.0, uSeed * 17.0);
  float n1 = fbm3(Q * 3.2 + sd);
  float n2 = vnoise(Q * 34.0 + sd);
  float n3 = snoise(mat2(0.8, 0.6, -0.6, 0.8) * Q * 26.0 - sd) * 0.5 + 0.5;
  float spread = 0.022 * smoothstep(ti, ti + 0.14, p);
  float bw = 0.15 / pow(G, 0.9);
  float d = yinzhang_seal(Q, bw);
  d += (n1 - 0.5) * 0.08 + (n2 - 0.5) * 0.022 - spread;

  bool hit = p >= ti;
  // before impact: the seal hovers, out of focus, faint; after: crisp
  float blur = hit ? 0.0 : 0.045 * (1.0 - pa);
  float inkM = smoothstep(px * 1.5 + blur, -px * 1.5 - blur, d);
  float dens = clamp(0.62 + 0.55 * n1 + 0.18 * (n2 - 0.5), 0.0, 1.0);
  dens *= smoothstep(0.12, 0.3, n3) * 0.4 + 0.6;                   // paper-grain voids
  float voids = smoothstep(0.17, 0.09, n3 * (0.45 + 0.9 * n1));
  float inkA = inkM * dens * (1.0 - 0.85 * voids);
  float ghost = 0.6 * smoothstep(0.03, ti, p) * (0.4 + 0.6 * pa);
  float glyphFade = 1.0 - smoothstep(0.58, 0.82, p);
  float borderFade = 1.0 - smoothstep(0.66, 0.93, p);
  // whether this pixel belongs to the border band (for separate fading)
  float inBand = step(1.0 - bw - 0.06, max(abs(Q.x), abs(Q.y)));
  float fade = mix(glyphFade, borderFade, inBand);
  inkA *= (hit ? 1.0 : ghost) * fade;

  // --- inside the frame: the new scene soaks in from the centre after impact ---
  float boxD = max(abs(Q.x), abs(Q.y));
  float soak = clamp((p - ti) / 0.16, 0.0, 1.0);
  float rev = smoothstep(0.0, 0.45, soak * 1.7 - boxD * 0.9 - (n1 - 0.5) * 0.4 + 0.05);
  rev *= smoothstep(1.0 - bw * 0.5 + px, 1.0 - bw * 0.5 - px, boxD);
  rev = hit ? rev : 0.0;
  vec3 col = mix(from, to, rev);

  // --- shadow of the seal stone while it descends; a pressure halo at impact ---
  float shA = (0.22 + 0.22 * pa) * smoothstep(0.0, 0.2, p) * (hit ? exp(-k * 45.0) : 1.0);
  vec2 so = vec2(0.15, -0.19) * (1.0 - pa) + vec2(0.014, -0.02);
  float shSoft = 0.1 + 0.55 * (1.0 - pa);
  float sq = yinzhang_box((Ps - so) / (h * Sa), vec2(1.0 - shSoft * 0.5), 0.2);
  float shM = smoothstep(shSoft, -shSoft, sq);
  // the hovering seal occludes its own shadow: only the part peeking out down-right is seen
  float foot = smoothstep(1.0 + px * 2.0 + blur, 1.0 - px * 2.0 - blur, max(abs(Q.x), abs(Q.y)));
  col *= 1.0 - shA * shM * (1.0 - foot);
  col *= 1.0 - 0.18 * shk * smoothstep(1.35, 1.0, boxD) * step(1.0, boxD);

  // --- cinnabar ink (sits on top, slightly multiplied with what is under it) ---
  vec3 cinnabar = vec3(0.80, 0.19, 0.11);
  vec3 ink = cinnabar * (0.78 + 0.25 * luma(col)) * (0.92 + 0.12 * n2);
  col = mix(col, ink, clamp(inkA, 0.0, 1.0));

  return vec4(col, 1.0);
}
`,
}));
