/* 16 折扇 · Folding Fan（园林器物）
 * 素扇一展，骨骨生风，扇面里尽是新山河。
 *
 * 原理：极坐标扇形：以扇轴为原点算角度和半径，展开角 g 从 0 扫到 2H（约 156°），15 折；每折按奇偶给正反两面不同明暗，折痕压暗，正在展开的那一折更暗。扇面纸上就是新画面（加纸纤维、外缘压边）；下方有竹扇骨、两侧大边、扇钉，旧画面上有扇子的柔和投影。展开后扇面放大，直到新画面占满全屏。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：出现 smoothstep(0, 0.06, p)；展开 ease((p-0.03)/0.57)；0.4–1 扇面放大 0.84→5.6 倍（指数）填满全屏；扇骨与褶痕在 0.62–1 淡去。
 * 建议时长：3.2 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uRes, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（由公式保证）。
 * 适用：江南、戏曲、文人雅集、"展开讲讲"。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 16,
  "id": "zheshan",
  "zh": "折扇",
  "en": "Folding Fan",
  "family": "园林器物",
  "desc": "素扇一展，骨骨生风，扇面里尽是新山河。",
  "duration": 3.2,
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
  easing: "出现 smoothstep(0, 0.06, p)；展开 ease((p-0.03)/0.57)；0.4–1 扇面放大 0.84→5.6 倍（指数）填满全屏；扇骨与褶痕在 0.62–1 淡去。",
  glsl: `
// fan geometry in local coords (pivot at origin, paper outer radius 1). returns angle from left guard.
float zheshan_ang(vec2 L, float H, float rot) {
  return atan(L.x, L.y) + H + rot;
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  vec2 P = (uv - 0.5) * vec2(uAspect, 1.0);
  vec3 from = getFrom(uv).rgb;
  vec3 to = getTo(uv).rgb;

  const float H = 1.36;          // half span (~78 deg)
  const float N = 15.0;          // panels
  const float rIn = 0.40;        // paper starts here (inner sticks below)
  float span = 2.0 * H;
  float dA = span / N;

  float appear = smoothstep(0.0, 0.06, p);
  float s = ease(clamp((p - 0.03) / 0.57, 0.0, 1.0));            // opening sweep
  float e = clamp((p - 0.40) / 0.60, 0.0, 1.0);
  e = e * e * (3.0 - 2.0 * e);
  float S0 = 0.84, S1 = 5.6;
  float S = S0 * exp(log(S1 / S0) * e);
  vec2 cLoc = vec2(0.0, 0.70);
  vec2 c0 = vec2(0.0, -0.46) + cLoc * S0;
  vec2 cS = mix(c0, vec2(0.0, 0.04), e);
  vec2 T = cS - cLoc * S;
  float rot = (0.5 - H) * (1.0 - s);                                // closed fan points up-left; both guards spread
  float F = 1.0 - smoothstep(0.62, 1.0, p);                         // fold / rib visibility
  float g = s * span;                                               // leading guard angle
  float px = 1.0 / (uRes.y * S);

  vec2 L = (P - T) / S;
  float r = length(L);
  float a = zheshan_ang(L, H, rot);

  // --- drop shadow on the old scene (soft fan silhouette, offset down-right) ---
  vec2 Ls = (P - vec2(0.014, -0.02) - T) / S;
  float rs = length(Ls);
  float aS = zheshan_ang(Ls, H, rot);
  float soft = 0.03;
  float shM = smoothstep(1.0 + soft, 1.0 - soft, rs)
            * smoothstep(-0.04 - soft, 0.0, rs * sin(aS))
            * smoothstep(-0.05 - soft, 0.0, rs * sin(g + 0.04 - aS))
            * step(0.0, cos(clamp(aS, -1.6, span + 1.6) - g * 0.5));
  vec3 col = from * (1.0 - 0.42 * shM * appear * smoothstep(0.98, 0.8, p));

  // --- paper leaf: the new scene, pleated ---
  float k = floor(a / dA);
  float x = a / dA - k;
  float kc = floor(g / dA);
  float open = clamp((g - kc * dA) / dA, 0.0, 1.0);
  float inSpan = step(0.0, a) * step(a, g);
  float paperM = inSpan * smoothstep(rIn - px, rIn + px, r) * smoothstep(1.0 + px, 1.0 - px, r);
  float sg = mod(k, 2.0) < 0.5 ? 1.0 : -1.0;
  float facet = 1.0 + 0.11 * sg + 0.10 * sg * (x - 0.5);
  float crease = 1.0 - 0.16 * exp(-min(x, 1.0 - x) * dA * r / 0.012);
  if (k >= kc) facet *= mix(0.62, 1.0, open);                        // the pleat still unfolding
  float fib = fbm3(L * vec2(9.0, 40.0) + uSeed * 13.0);
  vec3 paper = to * mix(vec3(1.0), vec3(1.03, 1.0, 0.94) * (0.97 + 0.06 * fib), 0.8);
  paper *= facet * crease;
  float edge = smoothstep(0.975, 0.995, r);                          // bound outer edge
  paper *= 1.0 - 0.35 * edge;
  paper = mix(to, paper, F);

  // thin dark ribs on the paper (one per fold)
  float dr = min(x, 1.0 - x) * dA * r;
  float ribW = 0.0016 / S + 0.6 * px;
  float ribM = smoothstep(ribW + px, ribW - px, dr) * paperM * F;
  vec3 wood = vec3(0.17, 0.11, 0.075);
  paper = mix(paper, wood * 0.9, ribM * 0.85);

  col = mix(col, paper, paperM * appear);

  // --- inner sticks (bamboo), visible below the paper ---
  float stickW = 0.010 + 0.010 * (1.0 - r / rIn);
  float stickD = dr - stickW;
  float stickM = inSpan * smoothstep(px, -px, stickD) * smoothstep(rIn + px, rIn - px, r);
  vec3 stick = wood * (0.9 + 0.6 * clamp(1.0 - dr / stickW, 0.0, 1.0)) * (1.0 + 0.3 * sg * 0.3);
  col = mix(col, stick, stickM * appear);

  // --- guard sticks: fixed left guard and the leading bundle of still-folded sticks ---
  float dl = r * sin(a);                     // perpendicular dist from left guard line (paper side > 0)
  float dg = r * sin(g - a);                 // from leading guard line
  float bundle = 0.022 + 0.03 * (1.0 - s);
  float gl = smoothstep(px, -px, abs(dl + 0.013) - 0.013) * step(0.0, cos(a));
  float gg = smoothstep(px, -px, abs(dg + bundle * 0.5) - bundle * 0.5) * step(0.0, cos(g - a));
  float tipM = smoothstep(1.02 + px, 1.02 - px, r);
  float gM = max(gl, gg) * tipM * F;
  float gx = gl > gg ? clamp(-dl / 0.026, 0.0, 1.0) : clamp(-dg / bundle, 0.0, 1.0);
  vec3 guard = wood * (0.85 + 0.55 * smoothstep(0.7, 0.2, abs(gx - 0.4)));
  col = mix(col, guard, gM * appear);

  // --- pivot rivet ---
  float rv = length(L) / 0.03;
  float rivM = smoothstep(1.0 + px * 33.0, 1.0 - px * 33.0, rv) * F;
  vec3 rivet = vec3(0.78, 0.70, 0.55) * (0.6 + 0.6 * smoothstep(0.9, 0.0, length(L / 0.03 - vec2(-0.3, 0.35))));
  col = mix(col, rivet, rivM * appear);

  return vec4(col, 1.0);
}
`,
}));
