/* 02 飞白 · Dry Brush（水墨）
 * 枯笔横扫，飞白丝丝，笔过处新景显现。
 *
 * 原理：每道笔是一条带角度的条带（沿笔方向 u、垂直方向 v 的局部坐标），宽度随行笔变细并用噪声抖动"压力"；各向异性噪声（沿笔 0.9、垂直 60/190 倍频）做出鬃毛丝；越往笔尾、越靠笔肚两侧，干笔阈值越高，噪声低于阈值的地方留白，形成飞白。笔头一段墨色最浓，后面透出新画面。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：4 道笔，每道错开 0.13 起笔，笔头位置走 smoothstep（按下慢、扫过快、提笔慢），每道用时 0.46；p>0.8 飞白缝隙收拢。
 * 建议时长：2.8 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：标题出现、书法/文字主题、横向并列的段落切换。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 2,
  "id": "feibai",
  "zh": "飞白",
  "en": "Dry Brush",
  "family": "水墨",
  "desc": "枯笔横扫，飞白丝丝，笔过处新景显现。",
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
  easing: "4 道笔，每道错开 0.13 起笔，笔头位置走 smoothstep（按下慢、扫过快、提笔慢），每道用时 0.46；p>0.8 飞白缝隙收拢。",
  glsl: `
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);   // exact end frames
  if (p >= 1.0) return getTo(uv);
  vec2 P = vec2((uv.x - 0.5) * uAspect, uv.y - 0.5);
  float L = uAspect * 0.5 + 0.5;            // half length of a stroke path (off-screen margins)
  float endF = smoothstep(0.8, 1.0, p);     // final soak: gaps close, strokes bleed wider
  float reveal = 0.0;
  float ink = 0.0;
  float shift = floor(uSeed * 4.0);

  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    float row = mod(fi * 3.0 + shift, 4.0);            // seeded permutation of rows
    vec2 h = hash22(vec2(fi * 5.13 + 0.7, uSeed * 71.0));
    float yc = (row + 0.5) / 4.0 - 0.5 + (h.x - 0.5) * 0.05;
    float ang = (h.y - 0.5) * 0.12 + (mod(fi, 2.0) - 0.5) * 0.14;
    vec2 dir = vec2(cos(ang), sin(ang));
    vec2 d = P - vec2(0.0, yc);
    float u = dot(d, dir);                     // along the stroke
    float v = dot(d, vec2(-dir.y, dir.x));     // across the stroke
    float a = clamp((u + L) / (2.0 * L), 0.0, 1.0);  // 0 = 起笔 (loaded), 1 = 收笔 (dry)

    // brush head: pressed slowly, sweeps fast, lifts
    float tt = clamp((p - fi * 0.13) / 0.46, 0.0, 1.0);
    float headA = tt * tt * (3.0 - 2.0 * tt);
    float behind = (headA - a) * 2.0 * L;      // distance behind the head

    // width: heavy loaded start, thinning tail, wobbling pressure, final bleed
    float hw = (0.16 + 0.05 * h.x) * (1.25 - 0.5 * a);
    hw *= 0.76 + 0.48 * vnoise(vec2(u * 1.7, fi * 9.1 + uSeed * 20.0));
    hw += endF * 0.3;
    float vv = v / hw;

    // bristle texture: long streaks along the stroke + fine hairs
    float br = vnoise(vec2(u * 0.9 + fi * 13.0, v * 60.0)) * 0.55
             + vnoise(vec2(u * 2.7 - fi * 7.0, v * 190.0)) * 0.45;

    // body across the stroke: bristle-broken edges
    float body = smoothstep(0.0, 0.05, 1.0 - abs(vv) + (br - 0.5) * 0.25);
    // blunt brush tip, centre slightly leading
    float front = behind - 0.8 * hw * vv * vv + (br - 0.5) * 0.06;
    float inU = smoothstep(0.0, 0.012, front);

    // 飞白: the brush runs dry toward the tail and at its flanks; gaps close as ink soaks in
    float dry = smoothstep(0.3, 0.9, a) * 0.55 + pow(abs(vv), 3.0) * 0.5 + 0.08;
    dry *= 1.0 - 0.8 * smoothstep(0.25, 1.5, behind);
    dry *= 1.0 - endF;
    float dm = smoothstep(dry - 0.035, dry + 0.035, br);

    float cov = inU * body * dm;

    // ink tone: black wet head clearing to the photo behind, ink clinging to flanks and gap borders
    float k = smoothstep(0.3, 0.06, behind - 0.8 * hw * vv * vv + (br - 0.5) * 0.4) * (1.0 - 0.3 * a);
    k = max(k, smoothstep(0.65, 1.0, abs(vv) + (br - 0.5) * 0.3) * (0.3 + 0.5 * exp(-max(behind, 0.0) / 0.9)));
    k = max(k, (1.0 - smoothstep(dry + 0.035, dry + 0.09, br)) * 0.6 * smoothstep(0.08, 0.3, dry));
    k *= 1.0 - endF;

    ink = mix(ink, k, cov);
    reveal = max(reveal, cov);
  }
  reveal = max(reveal, smoothstep(0.96, 1.0, p));

  vec3 a = getFrom(uv).rgb;
  vec3 b = getTo(uv).rgb;
  vec3 inked = mix(b, b * 0.08 + vec3(0.03, 0.03, 0.035), clamp(ink, 0.0, 1.0));
  return vec4(mix(a, inked, reveal), 1.0);
}
`,
}));
