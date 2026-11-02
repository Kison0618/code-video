/* 15 漏窗 · Garden Window（园林器物）
 * 粉墙月洞，冰裂花格，移步之间换了人间。
 *
 * 原理：全程序化 SDF 园林墙：石灰墙（fbm 斑驳、底部返潮）、顶上一排黛瓦（筒瓦、圆瓦当、滴水）、灰砖倒角圆框（月洞）。窗格是八角形花心 + 冰裂纹（5 层随机二分空间，裂纹自然形成 T 形交叉）。窗洞里是新画面，带内阴影和窗棂 AO。墙先叠在旧画面上浮现，然后镜头推进穿过窗洞，新画面填满全屏，"移步换景"。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：粉墙 smoothstep(0, 0.3, p) 不均匀淡入（像石灰浆变干）；侧移 ease(p/0.52) 落定；0.4–1 用 ease 推镜穿过窗洞，放大到 24 倍（指数缩放）。
 * 建议时长：3.4 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uRes, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（由公式保证）。
 * 适用：江南、园林、建筑、"换个视角看"，中国风章节卡。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 15,
  "id": "louchuang",
  "zh": "漏窗",
  "en": "Garden Window",
  "family": "园林器物",
  "desc": "粉墙月洞，冰裂花格，移步之间换了人间。",
  "duration": 3.4,
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
  easing: "粉墙 smoothstep(0, 0.3, p) 不均匀淡入（像石灰浆变干）；侧移 ease(p/0.52) 落定；0.4–1 用 ease 推镜穿过窗洞，放大到 24 倍（指数缩放）。",
  glsl: `
vec2 louchuang_rot(vec2 v, float a) { float c = cos(a), s = sin(a); return vec2(c * v.x - s * v.y, s * v.x + c * v.y); }

// Ice-crack (冰裂纹) lattice: a random binary space partition. Every level splits the current shard with a
// straight line roughly across the previous one, so cracks end in T-junctions like real cracked ice.
float louchuang_ice(vec2 W, float seed) {
  vec2 c = vec2(0.0);
  float id = 1.0;
  float d = 1e3;
  float R = 0.3;
  float ang = seed * 6.2831;
  for (int i = 0; i < 5; i++) {
    vec2 h = hash22(vec2(id * 1.37 + seed * 17.0, float(i) * 7.1 + seed * 3.0));
    ang += 1.5708 + (h.x - 0.5) * 1.0;
    vec2 n = vec2(cos(ang), sin(ang));
    vec2 tt = vec2(-n.y, n.x);
    vec2 cc = c + tt * (h.y - 0.5) * R * 0.5;
    float sd = dot(W - cc, n);
    d = min(d, abs(sd));
    float sg = sd > 0.0 ? 1.0 : -1.0;
    id = id * 2.0 + (sg > 0.0 ? 1.0 : 0.0);
    vec2 h2 = hash22(vec2(id * 0.91 + seed * 5.0, float(i) + 3.3));
    c = cc + n * sg * R * (0.5 + 0.2 * h2.x) + tt * R * (h2.y - 0.5) * 0.5;
    R *= 0.62;
  }
  return d;
}

// Regular octagon, r = inradius (iq).
float louchuang_oct(vec2 p, float r) {
  vec3 k = vec3(-0.9238795325, 0.3826834323, 0.4142135623);
  p = abs(p);
  p -= 2.0 * min(dot(vec2(k.x, k.y), p), 0.0) * vec2(k.x, k.y);
  p -= 2.0 * min(dot(vec2(-k.x, k.y), p), 0.0) * vec2(-k.x, k.y);
  p -= vec2(clamp(p.x, -k.z * r, k.z * r), r);
  return length(p) * sign(p.y);
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  vec2 P = (uv - 0.5) * vec2(uAspect, 1.0);

  // timeline: wall fades in (0..0.32), a sideways step settles (0..0.5), camera pushes through (0.4..1)
  float a = smoothstep(0.0, 0.3, p);
  float stp = ease(clamp(p / 0.52, 0.0, 1.0));
  float pe = ease(clamp((p - 0.4) / 0.6, 0.0, 1.0));
  float Z = (0.965 + 0.035 * stp) * exp(log(24.0) * pe);
  vec2 sway = vec2(0.07, 0.0) * (1.0 - stp);
  vec2 W = (P - sway) / Z;
  float px = 1.0 / (uRes.y * Z);           // one screen pixel in wall units

  // the far scene behind the window: barely moves (parallax), settles to identity
  float ts = 1.0 + 0.05 * (1.0 - pe);
  vec2 tuv = 0.5 + ((uv - 0.5) - vec2(0.018, 0.0) * (1.0 - stp)) / ts;
  vec3 to = getTo(tuv).rgb;
  vec3 from = getFrom(uv).rgb;

  float Ri = 0.335, Ro = 0.378;
  float r = length(W);
  vec2 sd = vec2(uSeed * 37.0, uSeed * 91.0);

  // --- lime-plaster wall ---
  float mott = fbm3(W * 4.5 + sd);
  vec3 wall = vec3(0.925, 0.912, 0.872) * (0.95 + 0.07 * mott);
  float damp = smoothstep(0.05, -0.75, W.y) * (0.5 + 0.5 * fbm3(vec2(W.x * 2.5, W.y * 0.7) + sd.yx));
  wall = mix(wall, vec3(0.70, 0.71, 0.68), 0.3 * damp);
  wall *= 0.975 + 0.035 * vnoise(W * 170.0 + sd);
  wall *= 1.0 + 0.05 * dot(normalize(W + 1e-4), vec2(-0.6, 0.8)) * smoothstep(1.2, 0.3, r);
  // the raised frame casts a soft shadow down-right onto the wall
  float wsh = smoothstep(Ro + 0.035, Ro - 0.004, length(W - vec2(0.010, -0.014)));
  wall *= 1.0 - 0.22 * wsh;

  // --- 黛瓦 coping: roll tiles with round tile-ends along the top of the wall ---
  float yc = 0.405;
  float cl = fract(W.x / 0.074 + 0.5) - 0.5;
  float roll = sqrt(max(1.0 - 11.0 * cl * cl, 0.0));
  float pan = 0.55 + 0.25 * abs(cl) * 2.0;
  vec3 tile = vec3(0.25, 0.26, 0.27) * mix(pan, 0.75 + 0.4 * roll, step(abs(cl), 0.3)) * (0.9 + 0.15 * mott);
  tile *= 0.85 + 0.15 * smoothstep(yc, yc + 0.08, W.y);
  vec2 ec = vec2(cl * 0.074, W.y - yc - 0.004);
  float endD = length(ec) - 0.02;
  vec3 endC = vec3(0.30, 0.31, 0.32) * (0.75 + 0.35 * clamp(dot(normalize(ec + 1e-5), vec2(-0.6, 0.8)) * smoothstep(0.005, 0.017, length(ec)), -1.0, 1.0)) ;
  float endM = smoothstep(px, -px, endD);
  // 滴水 drip tiles: small pointed lips hanging between the round tile-ends
  float dripD = (yc + 0.006 - W.y) - (0.02 - abs(abs(cl) - 0.5) * 0.074 * 1.1);
  float dripM = smoothstep(px, -px, dripD) * step(0.3, abs(cl)) * step(W.y, yc + 0.006);
  endC = mix(endC, vec3(0.27, 0.28, 0.29) * (0.8 + 0.2 * (abs(cl) - 0.3) * 5.0), dripM * (1.0 - endM));
  endM = max(endM, dripM);
  float copM = smoothstep(yc + 0.004 - px, yc + 0.004 + px, W.y);
  wall *= 1.0 - 0.3 * smoothstep(yc - 0.07, yc, W.y) * (1.0 - copM);
  wall = mix(wall, mix(tile, endC, endM), max(copM, endM));

  // --- grey tile frame (bevelled ring) ---
  float t = clamp((r - Ri) / (Ro - Ri), 0.0, 1.0);
  vec2 nr = W / max(r, 1e-4);
  float lit = 0.80 + 0.32 * dot(-nr * cos(t * 3.14159), vec2(-0.6, 0.8));
  vec3 frame = vec3(0.50, 0.505, 0.50) * lit * (0.93 + 0.1 * mott);

  // --- lattice: octagonal medallion + ice-crack bars ---
  vec2 L = louchuang_rot(W, uSeed * 6.2831);
  float dOct = louchuang_oct(L, 0.088);
  float cd = louchuang_ice(L, uSeed);
  float bw = 0.0062;
  float dBar = cd - bw;
  dBar = max(dBar, -(dOct - 0.004));              // no cracks inside the medallion
  dBar = min(dBar, abs(dOct) - bw * 1.25);        // medallion rim bar
  dBar = min(dBar, Ri + 0.002 - r);               // bars die into the frame
  float barM = smoothstep(px, -px, dBar);
  float across = clamp(-dBar / (bw * 1.25), 0.0, 1.0);
  vec3 bar = vec3(0.265, 0.258, 0.25) * (0.78 + 0.34 * across);

  // --- the new scene through the openings: reveal shadow + bar AO ---
  float rimSh = smoothstep(Ri - 0.04, Ri + 0.004, length(W - vec2(0.02, -0.022)));
  float ao = exp(-max(Ri - r, 0.0) / 0.014);
  float barAo = exp(-max(dBar, 0.0) / 0.006);
  vec3 view = to * (1.0 - 0.38 * rimSh) * (1.0 - 0.18 * ao) * (1.0 - 0.22 * barAo);

  // --- compose ---
  float inner = smoothstep(Ri + px, Ri - px, r);
  float onFrame = smoothstep(Ro + px, Ro - px, r) * (1.0 - inner);
  vec3 scene = mix(wall, frame, onFrame);
  vec3 win = mix(view, bar, barM);
  scene = mix(scene, win, inner);

  // the lime wash arrives unevenly, like a fresh coat drying
  float vis = smoothstep(0.0, 1.0, clamp(a * 1.5 - 0.5 * mott, 0.0, 1.0)) * (1.0 - smoothstep(0.975, 1.0, p));
  // as the wall passes the lens, only the far scene remains; keep it consistent with the view inside
  vec3 base = mix(from, to, smoothstep(0.85, 1.0, p));
  return vec4(mix(base, scene, vis), 1.0);
}
`,
}));
