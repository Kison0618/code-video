/* 精选 8 式（误判心理学画风版），由 tools/picks_shaders.js 从原 shader 打补丁生成，不要手改。
 * id 是 wp_<原 id>。和原版的差别：墨色 #231b15、纸色取画面、暖色阴影；墨染/撕纸支持 focus，风沙/甩镜支持 dir；印章印文"误判"、印泥 #9e3b26。
 * 正片里一般不直接用这些 id，而是用 lib/picks.json 的预设（时长、seed、focus/dir、音效都配好了）。
 */
(function (root, defs) {
  if (typeof module === 'object' && module.exports) { const m = {}; defs.forEach((d) => (m[d.id] = d)); module.exports = m; return; }
  const T = root.ShanheTransitions = root.ShanheTransitions || {};
  defs.forEach((d) => (T[d.id] = d));
})(typeof self !== 'undefined' ? self : this, [
  Object.assign({"id":"wp_paixian","base":"paixian","zh":"排线（精选）","en":"Engraving Sweep","family":"精选","desc":"一道铜版雕刻带斜着扫过，所到之处画面先变成排线版画，再在后面显出新画面的颜色。","duration":2.2,"easing":"扫描带前沿 mix(-0.05, 1.62, mix(p, ease(p), 0.5)) 匀中带缓；带宽 0.55，带内前半是旧画面的排线、后半是新画面的排线，交界用噪声撕开；带尾 0.14 宽渐回彩色。","uniforms":["uFrom","uTo","uProgress","uRes","uAspect","uSeed"],"usesTime":false}, { glsl: `
// ---- 精选版公共：墨色、纸色、暖色阴影 ----
const vec3 WP_INK = vec3(0.137, 0.106, 0.082);            // #231b15
vec3 wp_paper() {                                          // 纸色取画面本身：边缘 12 点，按亮度^4 加权
  vec3 s = vec3(0.0); float w = 0.0; vec3 c; float k;
  for (int i = 0; i < 6; i++) {
    float a = float(i) / 5.0;
    vec2 e1 = vec2(mix(0.06, 0.94, a), 0.06), e2 = vec2(mix(0.06, 0.94, a), 0.94);
    c = getFrom(e1).rgb; k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
    c = getTo(e2).rgb;   k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
  }
  s /= w;
  return mix(vec3(0.925, 0.89, 0.80), s, smoothstep(0.45, 0.7, luma(s)));   // 画面太暗时退回默认米黄
}
vec3 wp_shade(vec3 c, float k) { return c * clamp(1.0 - k * vec3(0.78, 0.92, 1.08), 0.0, 1.0); }   // 暖色阴影

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
  vec3 paper = wp_paper() * (0.97 + 0.04 * vnoise(P * 40.0 + sd));
  vec3 inkC = WP_INK;
  float ink = mix(paixian_ink(P, a, sd), paixian_ink(P, b, sd), useTo);
  vec3 etch = mix(paper, inkC, ink);
  vec3 col = mix(src, etch, eng);
  // the burin's leading stroke
  float lead = exp(-pow((x + nz) / 0.006, 2.0)) * smoothstep(0.0, 0.08, p) * (1.0 - smoothstep(0.85, 1.0, p));
  col = mix(col, inkC, lead * 0.7);
  return vec4(col, 1.0);
}
` }),
  Object.assign({"id":"wp_moran","base":"moran","zh":"墨染（精选）","en":"Ink Bleed","family":"精选","desc":"墨滴落宣，晕痕层层化开，新景由墨色染出。","duration":3,"easing":"三滴墨依次落下（起点 p=0 / 0.11 / 0.22），半径 ∝ pow(g,1.15) 先慢后快；p>0.8 进入\"浸透\"，墨痕整体外扩保证 p=1 全覆盖。","uniforms":["uFrom","uTo","uProgress","uTime","uAspect","uSeed","uFocus"],"usesTime":true}, { glsl: `
// ---- 精选版公共：墨色、纸色、暖色阴影 ----
const vec3 WP_INK = vec3(0.137, 0.106, 0.082);            // #231b15
vec3 wp_paper() {                                          // 纸色取画面本身：边缘 12 点，按亮度^4 加权
  vec3 s = vec3(0.0); float w = 0.0; vec3 c; float k;
  for (int i = 0; i < 6; i++) {
    float a = float(i) / 5.0;
    vec2 e1 = vec2(mix(0.06, 0.94, a), 0.06), e2 = vec2(mix(0.06, 0.94, a), 0.94);
    c = getFrom(e1).rgb; k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
    c = getTo(e2).rgb;   k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
  }
  s /= w;
  return mix(vec3(0.925, 0.89, 0.80), s, smoothstep(0.45, 0.7, luma(s)));   // 画面太暗时退回默认米黄
}
vec3 wp_shade(vec3 c, float k) { return c * clamp(1.0 - k * vec3(0.78, 0.92, 1.08), 0.0, 1.0); }   // 暖色阴影
vec3 wp_P;

// Ink-wash rendering of a photo. Luminance is compressed into a fixed mid-grey
// band (0.22..0.78 of paper white) so the wash reads as ink on xuan paper
// whether the photo is a bright sky or a dark gorge.
vec3 moran_wash(vec3 c, float extra) {
  float g = smoothstep(0.03, 0.97, luma(c));
  float t = mix(0.2, 0.7, pow(g, 1.3)) * (1.0 - extra);
  vec3 ink = WP_INK;
  vec3 paper = wp_P;
  return mix(ink, paper, t);
}

// Xuan paper fibres: two crossing families of short stretched streaks, 0..1.
float moran_fiber(vec2 P) {
  vec2 q1 = mat2(0.8, -0.6, 0.6, 0.8) * P;
  vec2 q2 = mat2(0.28, 0.96, -0.96, 0.28) * P;
  float f = max(vnoise(q1 * vec2(260.0, 40.0)), vnoise(q2 * vec2(40.0, 260.0) + 7.0));
  return smoothstep(0.55, 0.95, f);
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);   // exact end frames
  if (p >= 1.0) return getTo(uv);
  wp_P = wp_paper();
  vec2 P = vec2(uv.x * uAspect, uv.y);
  float dt = uTime * 0.012;
  float env = smoothstep(0.0, 0.06, p);
  float endF = smoothstep(0.8, 1.0, p);

  // Low-frequency stain shape (the only 5-octave fbm).
  float n = fbm(P * 2.1 + uSeed * 31.0 + vec2(dt, -dt));

  // Signed distance to the union of growing drops (negative = inside the stain).
  // Also remember the nearest drop: its centre orients the capillary tendrils.
  float s = 1e3;
  vec2 cBest = vec2(0.0);
  float rBest = -1.0;
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 7.31 + 1.7, uSeed * 113.0 + fi * 3.1));
    vec2 c = vec2((0.16 + 0.68 * h.x) * uAspect, 0.2 + 0.6 * h.y);
    if (uFocus.x >= 0.0) {
      c = vec2(uFocus.x * uAspect, uFocus.y) + (i == 0 ? vec2(0.0) : (h - 0.5) * vec2(0.9, 0.6));
      c = clamp(c, vec2(0.1 * uAspect, 0.12), vec2(0.9 * uAspect, 0.88));
    }
    float t0 = fi * 0.11;
    float g = clamp((p - t0) / (1.0 - t0), 0.0, 1.0);
    float R = 1.3 * pow(g, 1.15) * (0.8 + 0.4 * h.y) - 0.015;
    // multiplicative warp: lobes grow with the stain (d >= 0 always)
    float d = length(P - c) * (0.7 + 0.6 * n);
    if (d - R < s) { s = d - R; cBest = c; rBest = R; }
  }
  s -= 1.25 * endF * endF;          // final soak guarantees full coverage at p = 1
  float live = smoothstep(0.0, 0.03, rBest) * env * (1.0 - endF);   // drop has landed

  // Ragged front: fine fbm wobble.
  float fine = fbm3(P * 14.0 + uSeed * 17.0 - dt * 2.0);
  float sf = s + (fine - 0.5) * 0.05 * env;

  // Capillary tendrils: radially elongated fingers (noise sampled on the direction
  // from the drop centre, drifting slowly with radius) that reach 1-3% of screen height.
  vec2 dv = P - cBest;
  float r = length(dv);
  vec2 dir = dv / max(r, 1e-4);
  float K = 16.0 + 70.0 * r;
  float fing = vnoise(dir * K + vec2(r * 3.0, -r * 2.0) + uSeed * 19.0) * 0.7
             + vnoise(dir * K * 2.3 + vec2(-r * 5.0, r * 4.0) + 3.7) * 0.3;
  float reach = 0.032 * pow(smoothstep(0.3, 0.8, fing), 1.3) * live;
  float ahead0 = max(sf, 0.0);
  float tend = smoothstep(reach, reach * 0.35, ahead0) * step(0.0005, reach);
  // finger core is darker at its root, feathering out at the tip
  tend *= 1.0 - 0.6 * clamp(ahead0 / max(reach, 1e-4), 0.0, 1.0);

  float inside = smoothstep(0.005, -0.005, sf);
  float depth = max(-sf, 0.0);      // distance behind the front
  float ahead = ahead0;             // distance ahead of the front

  vec3 a = getFrom(uv).rgb;
  vec3 b = getTo(uv).rgb;

  // Inside: mid-grey ink wash first (denser near the wet front), colour blooms in behind.
  float bloom = smoothstep(0.1, 0.5, depth + (n - 0.5) * 0.2);
  bloom = max(bloom, endF);
  vec3 wash = moran_wash(b, 0.55 * exp(-depth / 0.2));
  vec3 inCol = mix(wash, b, bloom);

  // Wet rim: pigment piles up at the edge (coffee ring) with an irregular width.
  float grain = vnoise(P * 180.0 + uSeed * 50.0);
  float rw = 0.006 + 0.022 * fine * fine * 2.0;
  float rim = exp(-depth / rw) * (0.8 + 0.2 * grain) + exp(-depth / 0.045) * 0.35;
  rim = clamp(rim * (0.9 + 0.3 * fine), 0.0, 1.0) * (1.0 - endF);
  vec3 inkC = WP_INK * 0.85;
  inCol = mix(inCol, inkC + inCol * 0.08, rim * 0.95);

  // Ahead of the front: tendrils, fibre feathering and a faint wet halo (水痕).
  float fib = moran_fiber(P + n * 0.05);
  float wick = max(tend * 0.9, exp(-ahead / 0.006) * 0.85)
             + exp(-ahead / 0.015) * fib * 0.35
             + exp(-ahead / 0.06) * 0.12;
  wick = clamp(wick, 0.0, 1.0) * env * (1.0 - endF);
  vec3 outCol = mix(a, inkC + a * 0.12, wick * 0.92);

  vec3 col = mix(outCol, inCol, inside);
  col = mix(col, b, smoothstep(0.97, 1.0, p));
  return vec4(col, 1.0);
}
` }),
  Object.assign({"id":"wp_feibai","base":"feibai","zh":"飞白（精选）","en":"Dry Brush","family":"精选","desc":"枯笔横扫，飞白丝丝，笔过处新景显现。","duration":2.8,"easing":"4 道笔，每道错开 0.13 起笔，笔头位置走 smoothstep（按下慢、扫过快、提笔慢），每道用时 0.46；p>0.8 飞白缝隙收拢。","uniforms":["uFrom","uTo","uProgress","uAspect","uSeed"],"usesTime":false}, { glsl: `
// ---- 精选版公共：墨色、纸色、暖色阴影 ----
const vec3 WP_INK = vec3(0.137, 0.106, 0.082);            // #231b15
vec3 wp_paper() {                                          // 纸色取画面本身：边缘 12 点，按亮度^4 加权
  vec3 s = vec3(0.0); float w = 0.0; vec3 c; float k;
  for (int i = 0; i < 6; i++) {
    float a = float(i) / 5.0;
    vec2 e1 = vec2(mix(0.06, 0.94, a), 0.06), e2 = vec2(mix(0.06, 0.94, a), 0.94);
    c = getFrom(e1).rgb; k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
    c = getTo(e2).rgb;   k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
  }
  s /= w;
  return mix(vec3(0.925, 0.89, 0.80), s, smoothstep(0.45, 0.7, luma(s)));   // 画面太暗时退回默认米黄
}
vec3 wp_shade(vec3 c, float k) { return c * clamp(1.0 - k * vec3(0.78, 0.92, 1.08), 0.0, 1.0); }   // 暖色阴影

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
  vec3 inked = mix(b, b * 0.08 + WP_INK * 0.85, clamp(ink, 0.0, 1.0));
  return vec4(mix(a, inked, reveal), 1.0);
}
` }),
  Object.assign({"id":"wp_sizhi","base":"sizhi","zh":"撕纸（精选）","en":"Torn Paper","family":"精选","desc":"一声撕开，旧画面裂成两半向两侧飞走，露出底下的新画面。","duration":1.8,"easing":"0–0.27 裂口自上而下撕开（smoothstep），裂缝里先透出新画面；0.28–1 两半各自平移加旋转飞出，位移 ∝ pow(q,1.35)（先慢后快）；0.93–1 收尾。","uniforms":["uFrom","uTo","uProgress","uAspect","uSeed","uFocus"],"usesTime":false}, { glsl: `
// ---- 精选版公共：墨色、纸色、暖色阴影 ----
const vec3 WP_INK = vec3(0.137, 0.106, 0.082);            // #231b15
vec3 wp_paper() {                                          // 纸色取画面本身：边缘 12 点，按亮度^4 加权
  vec3 s = vec3(0.0); float w = 0.0; vec3 c; float k;
  for (int i = 0; i < 6; i++) {
    float a = float(i) / 5.0;
    vec2 e1 = vec2(mix(0.06, 0.94, a), 0.06), e2 = vec2(mix(0.06, 0.94, a), 0.94);
    c = getFrom(e1).rgb; k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
    c = getTo(e2).rgb;   k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
  }
  s /= w;
  return mix(vec3(0.925, 0.89, 0.80), s, smoothstep(0.45, 0.7, luma(s)));   // 画面太暗时退回默认米黄
}
vec3 wp_shade(vec3 c, float k) { return c * clamp(1.0 - k * vec3(0.78, 0.92, 1.08), 0.0, 1.0); }   // 暖色阴影

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
  if (uFocus.x >= 0.0) c = uFocus.x * uAspect - (uFocus.y - 0.5) * k;   // 裂口经过 focus
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
  col = wp_shade(col, 0.32 * max(shR, shL) * smoothstep(0.0, 0.2, p));

  vec3 paper = mix(wp_paper(), vec3(1.0, 0.985, 0.95), 0.55);
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
      pc = wp_shade(pc, 0.08 * m);                             // the lifted paper catches less light
      col = mix(col, pc, cov);
    }
  }
  col = mix(col, getTo(uv).rgb, smoothstep(0.93, 1.0, p));
  return vec4(col, 1.0);
}
` }),
  Object.assign({"id":"wp_fanye","base":"fanye","zh":"翻页（精选）","en":"Page Turn","family":"精选","desc":"画面像一页纸从右下角掀起，卷过圆弧翻到左上方，露出下一页。","duration":1.6,"easing":"卷曲线位置 mix(-0.02, 对角 + R, mix(p, ease(p), 0.5))：起手慢、中段快、落下慢；卷曲半径 0.12 屏高。","uniforms":["uFrom","uTo","uProgress","uAspect","uSeed"],"usesTime":false}, { glsl: `
// ---- 精选版公共：墨色、纸色、暖色阴影 ----
const vec3 WP_INK = vec3(0.137, 0.106, 0.082);            // #231b15
vec3 wp_paper() {                                          // 纸色取画面本身：边缘 12 点，按亮度^4 加权
  vec3 s = vec3(0.0); float w = 0.0; vec3 c; float k;
  for (int i = 0; i < 6; i++) {
    float a = float(i) / 5.0;
    vec2 e1 = vec2(mix(0.06, 0.94, a), 0.06), e2 = vec2(mix(0.06, 0.94, a), 0.94);
    c = getFrom(e1).rgb; k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
    c = getTo(e2).rgb;   k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
  }
  s /= w;
  return mix(vec3(0.925, 0.89, 0.80), s, smoothstep(0.45, 0.7, luma(s)));   // 画面太暗时退回默认米黄
}
vec3 wp_shade(vec3 c, float k) { return c * clamp(1.0 - k * vec3(0.78, 0.92, 1.08), 0.0, 1.0); }   // 暖色阴影

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
  vec3 paper = wp_paper();
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
      col = wp_shade(a, 0.28 * exp(-(s - pos) / 0.035));          // the curl shades the page in front of it
      // shadow cast by the flipped flap's edge
      float edgeS = 2.0 * pos - PI * R;                          // far edge of the flap along s (for s_o = 0)
      col = wp_shade(col, 0.22 * smoothstep(0.05, 0.0, s - edgeS) * step(edgeS, s) * step(pos, edgeS));
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
        col = wp_shade(getFrom(u1).rgb, 0.45 * sin(th1) * sin(th1));   // the front bends away from the light
        done = true;
      }
    }
  }
  // 3) uncovered: the next page, shadowed by the curl
  if (!done) {
    float dd = max(pos - R - s, 0.0);
    col = wp_shade(to, 0.42 * exp(-dd / 0.07) * smoothstep(0.0, 0.08, p));
  }
  col = mix(col, to, smoothstep(0.96, 1.0, p));
  return vec4(col, 1.0);
}
` }),
  Object.assign({"id":"wp_fengsha","base":"fengsha","zh":"风沙（精选）","en":"Wind & Sand","family":"精选","desc":"长风起处，旧景化作细沙随风散去。","duration":3,"easing":"侵蚀阈值沿风向线性推进（P = mix(-0.15, 1.24, p)），阵风噪声让局部提前；每粒沙寿命 0.22，飞行距离 ∝ a²（加速飘走）。","uniforms":["uFrom","uTo","uProgress","uTime","uAspect","uSeed","uDir"],"usesTime":true}, { glsl: `
// ---- 精选版公共：墨色、纸色、暖色阴影 ----
const vec3 WP_INK = vec3(0.137, 0.106, 0.082);            // #231b15
vec3 wp_paper() {                                          // 纸色取画面本身：边缘 12 点，按亮度^4 加权
  vec3 s = vec3(0.0); float w = 0.0; vec3 c; float k;
  for (int i = 0; i < 6; i++) {
    float a = float(i) / 5.0;
    vec2 e1 = vec2(mix(0.06, 0.94, a), 0.06), e2 = vec2(mix(0.06, 0.94, a), 0.94);
    c = getFrom(e1).rgb; k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
    c = getTo(e2).rgb;   k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
  }
  s /= w;
  return mix(vec3(0.925, 0.89, 0.80), s, smoothstep(0.45, 0.7, luma(s)));   // 画面太暗时退回默认米黄
}
vec3 wp_shade(vec3 c, float k) { return c * clamp(1.0 - k * vec3(0.78, 0.92, 1.08), 0.0, 1.0); }   // 暖色阴影

// Grains live on a wind-aligned grid (~300 columns), so a grain only ever travels along its own row
// and each pixel can find the grains passing over it by looking back upwind along that row.
vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  const float PRE = 0.05;
  const float LIFE = 0.22;
  vec2 W = vec2(0.9781, 0.2079);
  if (dot(uDir, uDir) > 0.0) W = normalize(uDir);
  vec2 Wp = vec2(-W.y, W.x);
  vec2 A = vec2(uv.x * uAspect, uv.y);
  float cs = uAspect / 300.0;
  float q0 = min(min(0.0, uAspect * W.x), min(W.y, uAspect * W.x + W.y));
  float q1 = max(max(0.0, uAspect * W.x), max(W.y, uAspect * W.x + W.y));
  vec2 Q = vec2(dot(A, W) - q0, dot(A, Wp)) / cs;     // grain-grid coordinates (cell units)
  float span = (q1 - q0) / cs;
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
  vec2 gc = vec2(bestX + 0.5, row + 0.5) * cs + vec2(q0, 0.0);
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
` }),
  Object.assign({"id":"wp_shuaijing","base":"shuaijing","zh":"甩镜（精选）","en":"Whip Pan","family":"精选","desc":"镜头猛然横甩，山川拉成流光，落定已是他乡。","duration":2,"easing":"机位走 tanh S 曲线（K=9），速度 ∝ sech²，p=0.5 最快；快门角在两端收到 0，所以 p=0/1 是精确原图。","uniforms":["uFrom","uTo","uProgress","uSeed","uDir"],"usesTime":false}, { glsl: `
// ---- 精选版公共：墨色、纸色、暖色阴影 ----
const vec3 WP_INK = vec3(0.137, 0.106, 0.082);            // #231b15
vec3 wp_paper() {                                          // 纸色取画面本身：边缘 12 点，按亮度^4 加权
  vec3 s = vec3(0.0); float w = 0.0; vec3 c; float k;
  for (int i = 0; i < 6; i++) {
    float a = float(i) / 5.0;
    vec2 e1 = vec2(mix(0.06, 0.94, a), 0.06), e2 = vec2(mix(0.06, 0.94, a), 0.94);
    c = getFrom(e1).rgb; k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
    c = getTo(e2).rgb;   k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
  }
  s /= w;
  return mix(vec3(0.925, 0.89, 0.80), s, smoothstep(0.45, 0.7, luma(s)));   // 画面太暗时退回默认米黄
}
vec3 wp_shade(vec3 c, float k) { return c * clamp(1.0 - k * vec3(0.78, 0.92, 1.08), 0.0, 1.0); }   // 暖色阴影

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
  float sgn = uDir.x < 0.0 ? -1.0 : 1.0;   // dir.x < 0：镜头往左甩
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
    float x = uv.x + sgn * D * shuaijing_S(t);
    float w = 0.55 + 0.45 * cos(f * 6.2831853 * 0.5);
    vec4 c;
    if (tc < 0.5) c = getFrom(shuaijing_mir(vec2(x, uv.y + sy)));
    else          c = getTo(shuaijing_mir(vec2(x - sgn * D, uv.y + sy)));
    acc += c * w;
    wsum += w;
  }
  return acc / wsum;
}
` }),
  Object.assign({"id":"wp_yinzhang","base":"yinzhang","zh":"印章（精选）","en":"Seal Stamp","family":"精选","desc":"朱印一落，方寸之间，钤出万里山河。","duration":3,"easing":"0–0.35 印章下落（失焦、半透明、投影偏移收拢）；p=0.35 落印：镜头震动（指数衰减）+ 轻微挤压；0.35–0.51 框内新画面从中心浸开；0.56–1 印框放大到 7.5 倍；印文 0.58–0.82、边框 0.66–0.93 先后淡出。","uniforms":["uFrom","uTo","uProgress","uRes","uAspect","uSeed"],"usesTime":false}, { glsl: `
// ---- 精选版公共：墨色、纸色、暖色阴影 ----
const vec3 WP_INK = vec3(0.137, 0.106, 0.082);            // #231b15
vec3 wp_paper() {                                          // 纸色取画面本身：边缘 12 点，按亮度^4 加权
  vec3 s = vec3(0.0); float w = 0.0; vec3 c; float k;
  for (int i = 0; i < 6; i++) {
    float a = float(i) / 5.0;
    vec2 e1 = vec2(mix(0.06, 0.94, a), 0.06), e2 = vec2(mix(0.06, 0.94, a), 0.94);
    c = getFrom(e1).rgb; k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
    c = getTo(e2).rgb;   k = pow(luma(c), 4.0) + 1e-4; s += c * k; w += k;
  }
  s /= w;
  return mix(vec3(0.925, 0.89, 0.80), s, smoothstep(0.45, 0.7, luma(s)));   // 画面太暗时退回默认米黄
}
vec3 wp_shade(vec3 c, float k) { return c * clamp(1.0 - k * vec3(0.78, 0.92, 1.08), 0.0, 1.0); }   // 暖色阴影
float wp_seg(vec2 p, vec2 a, vec2 b) { vec2 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h); }
// 朱文"误判"：右字"误"、左字"判"（从右往左读）
float wp_glyph(vec2 Q) {
  float d = 1e3;
  d = min(d, wp_seg(Q, vec2(0.1126, 0.6440), vec2(0.2314, 0.6440)));
  d = min(d, wp_seg(Q, vec2(0.0466, 0.4620), vec2(0.2974, 0.4620)));
  d = min(d, wp_seg(Q, vec2(0.0796, 0.2800), vec2(0.2644, 0.2800)));
  d = min(d, wp_seg(Q, vec2(0.0796, 0.0980), vec2(0.2644, 0.0980)));
  d = min(d, wp_seg(Q, vec2(0.0730, -0.1120), vec2(0.2710, -0.1120)));
  d = min(d, wp_seg(Q, vec2(0.0730, -0.1120), vec2(0.0730, -0.6300)));
  d = min(d, wp_seg(Q, vec2(0.2710, -0.1120), vec2(0.2710, -0.6300)));
  d = min(d, wp_seg(Q, vec2(0.0730, -0.6300), vec2(0.2710, -0.6300)));
  d = min(d, wp_seg(Q, vec2(0.4294, 0.6440), vec2(0.6538, 0.6440)));
  d = min(d, wp_seg(Q, vec2(0.4294, 0.6440), vec2(0.4294, 0.3360)));
  d = min(d, wp_seg(Q, vec2(0.6538, 0.6440), vec2(0.6538, 0.3360)));
  d = min(d, wp_seg(Q, vec2(0.4294, 0.3360), vec2(0.6538, 0.3360)));
  d = min(d, wp_seg(Q, vec2(0.3700, 0.1400), vec2(0.7000, 0.1400)));
  d = min(d, wp_seg(Q, vec2(0.5416, 0.3360), vec2(0.5416, -0.1540)));
  d = min(d, wp_seg(Q, vec2(0.5416, -0.1540), vec2(0.4030, -0.6440)));
  d = min(d, wp_seg(Q, vec2(0.5416, -0.1540), vec2(0.6868, -0.6440)));
  d = min(d, wp_seg(Q, vec2(-0.6340, 0.6440), vec2(-0.5746, 0.4480)));
  d = min(d, wp_seg(Q, vec2(-0.3766, 0.6440), vec2(-0.4360, 0.4480)));
  d = min(d, wp_seg(Q, vec2(-0.6736, 0.2940), vec2(-0.3304, 0.2940)));
  d = min(d, wp_seg(Q, vec2(-0.6934, 0.0140), vec2(-0.2974, 0.0140)));
  d = min(d, wp_seg(Q, vec2(-0.5020, 0.6440), vec2(-0.5020, -0.6720)));
  d = min(d, wp_seg(Q, vec2(-0.2050, 0.4620), vec2(-0.2050, -0.2520)));
  d = min(d, wp_seg(Q, vec2(-0.0796, 0.6580), vec2(-0.0796, -0.5880)));
  d = min(d, wp_seg(Q, vec2(-0.0796, -0.5880), vec2(-0.1456, -0.6720)));
  return d;
}

float yinzhang_box(vec2 p, vec2 b, float rr) {
  vec2 q = abs(p) - b + rr;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - rr;
}

// 朱文 seal: border + a seal-script 山 (U-shaped base rising into two side strokes, a tall centre stroke).
float yinzhang_seal(vec2 Q, float bw) {
  float outer = yinzhang_box(Q, vec2(1.0), 0.05);
  float inner = yinzhang_box(Q, vec2(1.0 - bw), 0.02);
  float border = max(outer, -inner);
  float glyph = wp_glyph(Q) - 0.025;
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
  float edgeWeight = smoothstep(0.78, 0.86, max(abs(Q.x), abs(Q.y)));
  d += ((n1 - 0.5) * 0.08 + (n2 - 0.5) * 0.022 - spread) * mix(0.12, 1.0, edgeWeight);

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
  col = wp_shade(col, shA * shM * (1.0 - foot));
  col = wp_shade(col, 0.18 * shk * smoothstep(1.35, 1.0, boxD) * step(1.0, boxD));

  // --- cinnabar ink (sits on top, slightly multiplied with what is under it) ---
  vec3 cinnabar = vec3(0.62, 0.231, 0.149);   // #9e3b26 红褐
  vec3 ink = cinnabar * (0.78 + 0.25 * luma(col)) * (0.92 + 0.12 * n2);
  col = mix(col, ink, clamp(inkA, 0.0, 1.0));

  return vec4(col, 1.0);
}
` })
]);
