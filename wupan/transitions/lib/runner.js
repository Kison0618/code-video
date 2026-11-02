/* 山河转场 · 公共渲染器 lib/runner.js
 *
 * 给两张图和一个进度 p（0→1），用 WebGL1 渲染出转场的一帧。同一组 (图, p, seed, time) 永远得到同一帧，可逐帧 seek。
 *
 * 浏览器：
 *   <script src="lib/runner.js"></script>
 *   <script src="lib/transitions/01_moran.js"></script>        // 或 transitions/index.js + ShanheTransitions.load()
 *   const r = ShanheRunner.create(canvas);                     // canvas 尺寸 = 输出尺寸
 *   r.frame(imgA, imgB, 'moran', 0.37, { seed: 0.37, time: 0 });
 *
 * Node（任何 WebGL1 上下文，例如 headless-gl）：
 *   const R = require('./lib/runner'); const r = R.create(gl, { width, height });
 *   r.frame({ width, height, data: rgbaA }, { width, height, data: rgbaB }, require('./lib/transitions/01_moran'), p);
 *   const px = r.readPixels();   // RGBA，自上而下
 *
 * 图源：HTMLImageElement / HTMLCanvasElement / ImageBitmap / HTMLVideoElement / OffscreenCanvas，
 *       或 { width, height, data: Uint8Array|Uint8ClampedArray (RGBA，自上而下) }。
 *
 * 选项（全部可选）：
 *   seed      0..1，决定墨滴位置、笔画顺序、光的方向等。默认 0.37（原作测试钩子用的值）
 *   time      秒。部分转场用它做缓慢漂移/逐帧抖动。逐帧渲染时给帧时间或固定值。默认 0
 *   grain     胶片颗粒强度。原作 0.035。默认 0（端帧与输入完全一致，方便拼接）
 *   vignette  暗角 0..1。原作 1。默认 0
 *   fit       'cover'（默认，等比铺满裁切）| 'stretch'（拉伸）。需要留边时先把图画到同尺寸画布上再传入
 *   focus     [x, y]，0..1，原点左上。精选版（wp_*）用它定落点：墨染第一滴墨、撕纸裂口经过的点
 *   dir       [dx, dy]，屏幕方向（y 向下）。精选版用：风沙的风向、甩镜往左还是往右
 *   fromXf / toXf  直接给 [sx, sy, ox, oy]（texUV = uv*xy + zw，uv 原点左下），覆盖 fit。可做 Ken Burns
 *
 * 原作的公共部分（PRELUDE：uniform 声明、getFrom/getTo、luma、hash、值噪声、simplex、fbm、ease；MAIN：暗角+颗粒）原样保留。
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.ShanheRunner = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const PRELUDE = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uFrom;
uniform sampler2D uTo;
uniform vec4 uFromXf;
uniform vec4 uToXf;
uniform float uProgress;
uniform float uTime;
uniform vec2 uRes;
uniform float uAspect;
uniform float uSeed;
uniform float uGrain;
uniform float uVignette;
uniform vec2 uFocus;    // 精选版用：动作落点/对准点（uv，原点左下）；x<0 表示不指定
uniform vec2 uDir;      // 精选版用：运动方向（单位向量，y 向上）；(0,0) 表示用默认

vec4 getFrom(vec2 uv) { return texture2D(uFrom, clamp(uv * uFromXf.xy + uFromXf.zw, vec2(0.0005), vec2(0.9995))); }
vec4 getTo(vec2 uv)   { return texture2D(uTo,   clamp(uv * uToXf.xy   + uToXf.zw,   vec2(0.0005), vec2(0.9995))); }

float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash12(i), hash12(i + vec2(1.0, 0.0)), u.x),
             mix(hash12(i + vec2(0.0, 1.0)), hash12(i + vec2(1.0, 1.0)), u.x), u.y);
}
vec3 _perm(vec3 x) { return mod(((x * 34.0) + 1.0) * x, 289.0); }
float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod(i, 289.0);
  vec3 p = _perm(_perm(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m; m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}
// 5-octave value-noise fbm, returns ~0..1
float fbm(vec2 p) {
  float a = 0.5, s = 0.0;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { s += a * vnoise(p); p = r * p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return s / 0.96875;
}
// 3-octave cheaper variant, ~0..1
float fbm3(vec2 p) {
  float a = 0.5, s = 0.0;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 3; i++) { s += a * vnoise(p); p = r * p * 2.03 + vec2(17.1, 9.2); a *= 0.5; }
  return s / 0.875;
}
float ease(float t) { return t < 0.5 ? 4.0 * t * t * t : 1.0 - pow(-2.0 * t + 2.0, 3.0) / 2.0; }
`;

  const MAIN = `
void main() {
  vec4 c = transition(vUv);
  vec3 col = c.rgb;
  vec2 q = vUv - 0.5;
  col *= mix(1.0, 1.0 - dot(q * vec2(uAspect, 1.0), q * vec2(uAspect, 1.0)) * 0.42, uVignette);
  col += (hash12(gl_FragCoord.xy + fract(uTime * 7.13) * 917.0) - 0.5) * uGrain;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}
`;

  const VERT = 'attribute vec2 aPos; varying vec2 vUv; void main(){ vUv = aPos * 0.5 + 0.5; gl_Position = vec4(aPos, 0.0, 1.0); }';
  const UNIFORMS = ['uFrom', 'uTo', 'uFromXf', 'uToXf', 'uProgress', 'uTime', 'uRes', 'uAspect', 'uSeed', 'uGrain', 'uVignette', 'uFocus', 'uDir'];
  const PRELUDE_LINES = PRELUDE.split('\n').length - 1;

  // 等比铺满（cover）+ 可选缩放（>=1）与平移（-1..1，占剩余空间的比例）。uv 原点左下，纹理上传时已翻转。
  function coverXf(iw, ih, vw, vh, zoom, panX, panY) {
    zoom = zoom || 1; panX = panX || 0; panY = panY || 0;
    const A = vw / vh, I = iw / ih;
    let w = 1, h = 1;
    if (I > A) w = A / I; else h = I / A;
    w /= zoom; h /= zoom;
    const cx = 0.5 + Math.max(-1, Math.min(1, panX)) * (1 - w) * 0.5;
    const cy = 0.5 + Math.max(-1, Math.min(1, panY)) * (1 - h) * 0.5;
    return [w, h, cx - w / 2, cy - h / 2];
  }

  function registry() {
    const g = typeof self !== 'undefined' ? self : (typeof globalThis !== 'undefined' ? globalThis : {});
    return g.ShanheTransitions || {};
  }

  function srcSize(src) {
    if (!src) return [1, 1];
    const w = src.naturalWidth || src.videoWidth || src.width || 1;
    const h = src.naturalHeight || src.videoHeight || src.height || 1;
    return [w, h];
  }

  function create(target, opts) {
    opts = opts || {};
    let gl, canvas = null;
    if (target && typeof target.getContext === 'function') {
      canvas = target;
      gl = canvas.getContext('webgl', {
        antialias: false, alpha: false, premultipliedAlpha: false,
        preserveDrawingBuffer: opts.preserve !== false, powerPreference: 'high-performance',
      });
      if (!gl) throw new Error('WebGL unavailable');
    } else {
      gl = target;                    // 已有的 WebGL1 上下文（headless-gl 等）
    }
    const size = () => canvas ? [canvas.width, canvas.height] : [opts.width || gl.drawingBufferWidth, opts.height || gl.drawingBufferHeight];

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    function shader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        const log = (gl.getShaderInfoLog(s) || '').replace(/ERROR: 0:(\d+)/g, (m, n) => 'ERROR: body line ' + (+n - PRELUDE_LINES));
        gl.deleteShader(s);
        throw new Error(log);
      }
      return s;
    }
    const vs = shader(gl.VERTEX_SHADER, VERT);
    const progs = new Map();      // glsl string -> program

    function compile(defOrGlsl) {
      const body = typeof defOrGlsl === 'string' ? defOrGlsl : defOrGlsl.glsl;
      if (progs.has(body)) return progs.get(body);
      const fs = shader(gl.FRAGMENT_SHADER, PRELUDE + body + MAIN);
      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.bindAttribLocation(prog, 0, 'aPos');
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      const loc = {};
      UNIFORMS.forEach((u) => (loc[u] = gl.getUniformLocation(prog, u)));
      const p = { prog, loc };
      progs.set(body, p);
      return p;
    }

    function upload(t, src) {
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
      if (src && src.data && src.width && src.height) {
        const d = src.data instanceof Uint8Array ? src.data : new Uint8Array(src.data.buffer, src.data.byteOffset, src.data.byteLength);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, src.width, src.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, d);
      } else if (src) {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
      } else {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([10, 12, 14, 255]));
      }
      t._w = (src && (src.naturalWidth || src.videoWidth || src.width)) || 1;
      t._h = (src && (src.naturalHeight || src.videoHeight || src.height)) || 1;
      return t;
    }
    function texture(src) {
      const t = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, t);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return upload(t, src);
    }

    function resolve(tr) {
      if (typeof tr === 'string') {
        const d = registry()[tr];
        if (!d) throw new Error('unknown transition: ' + tr);
        return d;
      }
      return tr;
    }

    // 低层：已有纹理
    function render(u) {
      const def = resolve(u.transition);
      const p = compile(def);
      const [w, h] = size();
      const fit = u.fit || 'cover';
      const xf = (t, given) => given || (fit === 'stretch' ? [1, 1, 0, 0] : coverXf(t._w, t._h, w, h));
      gl.bindFramebuffer(gl.FRAMEBUFFER, u.framebuffer || null);
      gl.viewport(0, 0, w, h);
      gl.useProgram(p.prog);
      gl.enableVertexAttribArray(0);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, u.from);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, u.to);
      const L = p.loc;
      gl.uniform1i(L.uFrom, 0);
      gl.uniform1i(L.uTo, 1);
      gl.uniform4fv(L.uFromXf, xf(u.from, u.fromXf));
      gl.uniform4fv(L.uToXf, xf(u.to, u.toXf));
      gl.uniform1f(L.uProgress, Math.max(0, Math.min(1, +u.progress || 0)));
      gl.uniform1f(L.uTime, u.time || 0);
      gl.uniform2f(L.uRes, w, h);
      gl.uniform1f(L.uAspect, w / h);
      gl.uniform1f(L.uSeed, u.seed == null ? 0.37 : u.seed);
      gl.uniform1f(L.uGrain, u.grain || 0);
      gl.uniform1f(L.uVignette, u.vignette || 0);
      // focus：[x, y]，画面坐标 0..1，原点左上（和图片坐标一致）；dir：[dx, dy]，屏幕方向，y 向下
      const f = u.focus, d = u.dir, dl = d ? Math.hypot(d[0], d[1]) : 0;
      gl.uniform2f(L.uFocus, f ? f[0] : -1, f ? 1 - f[1] : -1);
      gl.uniform2f(L.uDir, dl ? d[0] / dl : 0, dl ? -d[1] / dl : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    // 高层：直接给图源。同一个图源对象只上传一次；视频/画布内容变了时传 { refresh: true }
    const cache = new Map();
    function texFor(src, refresh) {
      let t = cache.get(src);
      if (!t) { t = texture(src); cache.set(src, t); }
      else if (refresh) upload(t, src);
      return t;
    }
    function frame(fromSrc, toSrc, transition, progress, o) {
      o = o || {};
      render(Object.assign({}, o, {
        transition, progress,
        from: texFor(fromSrc, o.refresh), to: texFor(toSrc, o.refresh),
      }));
    }

    // RGBA，自上而下（可以直接给 ImageData / skia-canvas / ffmpeg rawvideo）
    function readPixels() {
      const [w, h] = size();
      const px = new Uint8Array(w * h * 4);
      gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const row = w * 4, tmp = new Uint8Array(row);
      for (let y = 0; y < (h >> 1); y++) {
        const a = y * row, b = (h - 1 - y) * row;
        tmp.set(px.subarray(a, a + row)); px.copyWithin(a, b, b + row); px.set(tmp, b);
      }
      return { width: w, height: h, data: px };
    }

    function release(src) {
      const t = cache.get(src);
      if (t) { gl.deleteTexture(t); cache.delete(src); }
    }

    function dispose() {
      for (const t of cache.values()) gl.deleteTexture(t);
      cache.clear();
      for (const p of progs.values()) gl.deleteProgram(p.prog);
      progs.clear();
    }

    return { gl, compile, texture, upload, render, frame, readPixels, release, dispose, size };
  }

  return { create, coverXf, PRELUDE, MAIN, VERT, registry, srcSize };
});
