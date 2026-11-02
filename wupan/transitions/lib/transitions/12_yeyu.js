/* 12 夜雨 · Rain on Glass（天气）
 * 夜雨敲窗，水珠里先映出了远方的山。
 *
 * 原理：玻璃上三种尺度的静止水珠（每格最多一颗，尺寸三次方分布：小的多、大的少），水珠内做鱼眼透镜折射（倒像）；只有大水珠里映出新画面，每颗按自己的随机时刻翻转。水珠之间是起雾的玻璃：12 次黄金角采样模糊旧画面、降饱和、偏夜蓝。几条水滴带着清晰的水痕往下淌（粘滑抖动），最后一整片水幕带着下沿一排挂珠往下滑，擦出新画面。
 * 缓动：输入 uProgress 是线性 p∈[0,1]；缓动写在 shader 里：起雾 smoothstep(0, 0.34, p)；水珠密度 smoothstep(0, 0.3, p)；流淌的水滴在 p=0.16–0.5 随机起步；最后的水幕 smoothstep(0.45, 0.97, p) 从上往下擦过。
 * 建议时长：3.4 秒（原作默认值，原作速度滑块 0.4×–1.8× 可调）
 * uniform：uFrom, uTo, uProgress, uRes, uAspect, uSeed（另有 uFromXf/uToXf 由 getFrom/getTo 使用；全部声明见 runner.js 的 PRELUDE）
 * 噪声：全部是 shader 内的 hash/值噪声/simplex/fbm，不需要噪声纹理。
 * 不用 uTime：画面只由 p 和 seed 决定。
 * 端点：p=0 输出 from、p=1 输出 to（shader 开头直接返回）。
 * 适用：夜晚、雨天、情绪/回忆、"隔着窗看"的叙事。
 * 素材：通用
 * 源：《山河转场》单文件网页（作者不明），GLSL 原样抽取，仅改为独立文件。
 */
(function (root, def) {
  if (typeof module === 'object' && module.exports) module.exports = def;
  else (root.ShanheTransitions = root.ShanheTransitions || {})[def.id] = def;
})(typeof self !== 'undefined' ? self : this, Object.assign({
  "no": 12,
  "id": "yeyu",
  "zh": "夜雨",
  "en": "Rain on Glass",
  "family": "天气",
  "desc": "夜雨敲窗，水珠里先映出了远方的山。",
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
  easing: "起雾 smoothstep(0, 0.34, p)；水珠密度 smoothstep(0, 0.3, p)；流淌的水滴在 p=0.16–0.5 随机起步；最后的水幕 smoothstep(0.45, 0.97, p) 从上往下擦过。",
  glsl: `
// One layer of static beads on the glass (at most one bead per grid cell).
// Returns coverage; q = position inside the bead (unit disc), off = refraction offset (uv), id = per-bead hash.
float yeyu_beads(vec2 uv, float scale, float dens, float rmin, float rmax, float lensK, float sd,
                 out vec2 q, out vec2 off, out float id, out float sz) {
  vec2 st = vec2(uv.x * uAspect, uv.y) * scale;
  vec2 cid = floor(st);
  vec2 f = fract(st) - 0.5;
  vec2 h = hash22(cid + sd);
  id = hash12(cid * 1.731 + sd * 3.17 + 11.3);
  float on = clamp((dens - id) / 0.1, 0.0, 1.0);
  sz = h.x * h.x * h.x;
  float r0 = mix(rmin, rmax, sz);                    // log-ish size distribution: many small, few large
  vec2 c = (hash22(cid * 1.37 + sd + 4.7) - 0.5) * (1.0 - 2.0 * r0 - 0.02);   // free placement inside the cell
  float r = r0 * sqrt(on);
  float rs = max(r, 1e-3);
  q = (f - c) / rs;
  q.y *= 1.0 + 0.12 * step(0.0, q.y);                // gravity: a touch flatter on top
  float d = length(q);
  float aa = 1.6 * scale / (uRes.y * rs);
  float m = (1.0 - smoothstep(1.0 - aa, 1.0, d)) * step(0.002, r);
  vec2 nq = q * (1.0 + 0.4 * d * d);                // fisheye compression toward the rim
  off = -nq * (rs / scale) * lensK;                 // lensK > 1: inverted image
  off.x /= uAspect;
  return m;
}

// A few running drops (not every column has one); each leaves a narrow clear trail.
float yeyu_runners(vec2 uv, float p, float sd, out vec2 q, out vec2 off, out float clr, out float rim) {
  float CW = 0.16;
  float X = uv.x * uAspect / CW;
  float fx = floor(X);
  float mask = 0.0;
  q = vec2(0.0); off = vec2(0.0); clr = 0.0; rim = 0.0;
  for (int k = -1; k <= 1; k++) {
    float col = fx + float(k);
    float h1 = hash12(vec2(col * 1.13 + 7.0, sd * 97.0 + 3.0));
    float h2 = hash12(vec2(col * 2.71 + 1.0, sd * 41.0 + 9.0));
    float h3 = hash12(vec2(col * 0.57 + 5.0, sd * 23.0 + 1.0));
    float p0 = mix(0.16, 0.5, h1);
    float spd = mix(3.6, 5.6, h2);
    float t = max(p - p0, 0.0);
    float ph = h3 * 6.283;
    float tj = t + 0.011 * (sin(t * 42.0 + ph) - sin(ph));   // stick-slip, still monotonic
    float headY = 1.1 - spd * tj;
    float alive = step(0.0001, t) * step(h3, 0.45);
    float wob = 0.05 * sin(uv.y * 6.0 + h3 * 40.0) + 0.025 * sin(uv.y * 17.0 + h1 * 30.0)
              + 0.075 * (vnoise(vec2(col * 4.3 + sd, uv.y * 5.0)) - 0.5);   // lateral meander
    float dx = (X - (col + 0.5 + wob)) * CW;
    float dy = uv.y - headY;
    float R = mix(0.016, 0.026, h2);
    // head
    vec2 hq = vec2(dx, dy) / R;
    hq.y *= hq.y > 0.0 ? 0.62 : 1.05;
    float hd = length(hq);
    float aa = 1.6 / (uRes.y * R);
    float hm = (1.0 - smoothstep(1.0 - aa, 1.0, hd)) * alive;
    vec2 hoff = -hq * (1.0 + 0.4 * hd * hd) * R * 2.3;
    // trail: about the drop's width, slowly spreading
    float hw = R * (0.6 + 0.35 * smoothstep(0.0, 0.4, dy)) * (0.5 + 0.9 * vnoise(vec2(col * 3.1 + sd, uv.y * 18.0)));   // stick-slip width
    float ad = abs(dx);
    float behind = smoothstep(0.0, 0.012, dy) * alive;
    float tr = (1.0 - smoothstep(hw * 0.7, hw, ad)) * behind;
    clr = max(clr, tr);
    rim = max(rim, smoothstep(hw * 0.45, hw * 0.85, ad) * (1.0 - smoothstep(hw * 0.85, hw * 1.08, ad)) * behind);
    // small beads left in the trail just behind the head
    float by = uv.y * 52.0 + h3 * 10.0;
    float bid = floor(by);
    float bh = hash12(vec2(bid + 0.5, col + sd * 7.0));
    vec2 bq = vec2(dx - (bh - 0.5) * R * 0.6, (fract(by) - 0.5) / 52.0);
    float br = R * mix(0.22, 0.42, bh) * step(0.45, bh)
             * smoothstep(R * 1.4, R * 3.0, dy) * (1.0 - smoothstep(0.15, 0.5, dy));
    float brs = max(br, 1e-4);
    vec2 bqq = bq / brs;
    float bd = length(bqq);
    float bm = (1.0 - smoothstep(1.0 - 1.6 / (uRes.y * brs), 1.0, bd)) * step(1e-4, br) * alive;
    vec2 boff = -bqq * brs * 1.6;
    float m = max(hm, bm);
    vec2 cq = hm > bm ? hq : bqq;
    vec2 co = hm > bm ? hoff : boff;
    q = mix(q, cq, m);
    off = mix(off, co, m);
    mask = max(mask, m);
  }
  off.x /= uAspect;
  return mask;
}

vec4 transition(vec2 uv) {
  float p = uProgress;
  if (p <= 0.0) return getFrom(uv);
  if (p >= 1.0) return getTo(uv);
  float sd = floor(uSeed * 997.0);
  vec2 a = vec2(uv.x * uAspect, uv.y);

  float fogN = fbm3(a * 2.6 + vec2(sd * 0.13, 3.7));
  float mist = smoothstep(0.0, 0.34, p);

  // the final wipe: a sheet of water slides down the pane, its lower edge a row of hanging drops
  float sp = smoothstep(0.45, 0.97, p);
  float fy = mix(1.12, -0.18, sp);
  float SW = 0.085;
  float lx = a.x / SW + sd + 4.0 * vnoise(vec2(a.x * 1.5 + sd, 1.0)) + 1.5 * vnoise(vec2(a.x * 4.7, sd));   // uneven lobe widths
  float lid = floor(lx);
  float lu = fract(lx) - 0.5;
  float lh = hash12(vec2(lid, sd + 17.0));
  float lobe = (1.0 - 4.0 * lu * lu) * (0.01 + 0.13 * lh * lh * lh) * (0.3 + 1.2 * vnoise(vec2(a.x * 9.0, sd)));
  float fyx = fy + 0.12 * (vnoise(vec2(a.x * 1.7 + sd, 3.0)) - 0.5) - lobe;
  float sdy = uv.y - fyx;
  float WB = 0.011 + 0.006 * lh;                     // a thin refractive edge, not an outline
  float sheetC = smoothstep(0.0, 0.003, sdy);
  float bandAA = 1.6 / (uRes.y * WB);
  float sheetM = smoothstep(0.0, 0.003, sdy) * (1.0 - smoothstep(1.0 - bandAA * 0.5, 1.0, sdy / WB));
  float sqy = sdy / WB * 2.0 - 1.0;
  vec2 sQ = vec2(lu * 0.5, sqy) * 0.45;              // shallow: no dark rim
  vec2 sOff = vec2(0.0, -sqy * WB * 1.6);

  vec2 rq, roff; float rclr, rrim;
  float rm = yeyu_runners(uv, p, sd, rq, roff, rclr, rrim);
  float C = max(max(rclr, sheetC), smoothstep(0.93, 0.99, p));

  // static beads: three sizes, appearing as the rain thickens
  float dens = smoothstep(0.0, 0.3, p);
  vec2 Q = vec2(0.0), OFF = vec2(0.0);
  float M = 0.0, ID = 0.0;
  // only the largest beads carry the new scene; small ones refract the old one, inverted
  vec2 q; vec2 off; float id; float sz; float m;
  float BIG = 0.0;
  m = yeyu_beads(uv, 30.0, dens * 0.45, 0.1, 0.26, 1.3, sd + 1.0, q, off, id, sz) * (1.0 - C);
  Q = mix(Q, q, m); OFF = mix(OFF, off, m); ID = mix(ID, id, m); BIG = mix(BIG, 0.0, m); M = max(M, m);
  m = yeyu_beads(uv + vec2(0.31, 0.17), 13.0, dens * 0.5, 0.12, 0.3, 1.8, sd + 2.0, q, off, id, sz) * (1.0 - C);
  Q = mix(Q, q, m); OFF = mix(OFF, off, m); ID = mix(ID, id, m); BIG = mix(BIG, smoothstep(0.7, 0.9, sz), m); M = max(M, m);
  m = yeyu_beads(uv + vec2(0.13, 0.41), 5.5, dens * 0.3, 0.14, 0.3, 2.3, sd + 3.0, q, off, id, sz) * (1.0 - C);
  Q = mix(Q, q, m); OFF = mix(OFF, off, m); ID = mix(ID, id * 0.6, m); BIG = mix(BIG, smoothstep(0.3, 0.6, sz), m); M = max(M, m);
  rm *= 1.0 - sheetC * (1.0 - sheetM);
  Q = mix(Q, rq, rm); OFF = mix(OFF, roff, rm); ID = mix(ID, 0.0, rm); BIG = mix(BIG, 1.0, rm); M = max(M, rm);
  float smk = sheetM * (1.0 - smoothstep(0.93, 0.99, p));
  Q = mix(Q, sQ, smk); OFF = mix(OFF, sOff, smk); ID = mix(ID, 0.0, smk); BIG = mix(BIG, 1.0, smk); M = max(M, smk);

  // inside the drops: each bead turns from the old scene to the new one on its own
  vec2 suv = uv + OFF;
  float tm = clamp(((p - 0.1) / 0.34 - ID * 0.8) / 0.22, 0.0, 1.0) * BIG;
  vec3 dc = mix(getFrom(suv).rgb, getTo(suv).rgb, tm);
  float dd = length(Q);
  dc *= 1.0 - 0.42 * smoothstep(0.5, 1.0, dd);                               // refractive dark rim
  dc += vec3(0.07, 0.08, 0.09) * smoothstep(0.6, 0.95, dd) * smoothstep(0.1, -0.8, Q.y); // caustic
  dc += vec3(0.5, 0.53, 0.58) * smoothstep(0.2, 0.0, length(Q - vec2(-0.32, 0.45)));  // glint
  dc = dc * 1.03 + 0.008;

  // misted glass between drops: soft blur of the old scene, dimmed and cooled
  vec2 fc = gl_FragCoord.xy;
  float ign = fract(52.9829 * fract(dot(fc, vec2(0.06711, 0.00584))));
  float ang = ign * 6.2832;
  float rad = mist * (0.007 + 0.014 * fogN);
  vec3 acc = vec3(0.0);
  for (int i = 0; i < 12; i++) {
    float fi = float(i);
    float an = ang + fi * 2.39996;
    float rr = rad * sqrt((fi + 0.5) / 12.0);
    acc += getFrom(uv + vec2(cos(an) / uAspect, sin(an)) * rr).rgb;
  }
  acc /= 12.0;
  float L = luma(acc);
  vec3 misted = mix(acc, vec3(L) * vec3(0.84, 0.92, 1.06), 0.4);
  misted = misted * (0.6 + 0.08 * fogN) + vec3(0.04, 0.05, 0.068) * (0.6 + 0.8 * fogN);
  misted *= vec3(0.86, 0.92, 1.0);                                           // 夜: a blue-night grade on the glass
  vec3 bgF = mix(acc, misted, mist);

  vec3 to = getTo(uv).rgb;
  vec3 bg = mix(bgF, to, C);
  bg += vec3(0.05, 0.055, 0.06) * rrim * (1.0 - sheetC);                    // wet edge of a trail
  return vec4(mix(bg, dc, M), 1.0);
}
`,
}));
