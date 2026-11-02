/* 山河转场 · 音频引擎（原作 Web Audio 合成，原样抽出）+ 转场库增补
 * 由 tools/gen_audio.js 从 source/stripped.html 生成，不要手改。
 *
 * 实时（网页）：ShanheAudio.start() 后 ShanheAudio.scene(id) 切环境音，ShanheAudio.transition(id, 秒) 打转场音效
 * 离线（视频）：ShanheAudio.renderTransition(id, { dur, seed }) → AudioBuffer；ShanheAudio.toWav(buf) → WAV
 * Node 里没有 Web Audio：用 lib/audio/render_wav.js（借无头 Chrome）批量导出 WAV，再交给 Python 混音（lib/audio/shanhe_sfx.py）。
 */
/* 山河转场 · generative ambient soundscape
 * Pure Web Audio synthesis: no audio files, no libraries.
 *
 *   window.ShanheAudio = { start(), stop(), on, scene(id), transition(id, seconds) }
 *
 * Structure: an `Engine` builds the whole graph on any BaseAudioContext
 * (live AudioContext or OfflineAudioContext). Everything is scheduled on the
 * audio clock via `engine.pump(until)`: live mode pumps with a 1.5 s look-ahead
 * from a 200 ms timer; offline mode pumps the full render length up front.
 * Hidden test hook: ShanheAudio._renderOffline(sceneId, transitionId, seconds, opts).
 */
(function (global) {
  'use strict';

  /* ------------------------------------------------------------ helpers */
  var TAU = Math.PI * 2;
  var MASTER = Math.pow(10, -6 / 20); // nominal master level (pre-dynamics)
  var TRIM_DB = (typeof window !== 'undefined' && window.__shanheTrim != null) ? window.__shanheTrim : -2;
  function rnd(a, b) { return a + Math.random() * (b - a); }
  function rint(a, b) { return Math.floor(rnd(a, b + 1)); }
  function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
  function dbl(d) { return Math.pow(10, d / 20); }
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
  function chance(p) { return Math.random() < p; }
  function warn(what, err) { try { console.warn('[ShanheAudio] ' + what, err); } catch (e) {} }

  // 五声音阶 modes (semitones above the mode's own tonic)
  var MODES = {
    gong:  [0, 2, 4, 7, 9],   // 宫
    shang: [0, 2, 5, 7, 10],  // 商
    jue:   [0, 3, 5, 8, 10],  // 角
    zhi:   [0, 2, 5, 7, 9],   // 徵
    yu:    [0, 3, 5, 7, 10]   // 羽
  };

  /* ------------------------------------------------------------ scenes
   * tonic: MIDI note of the mode's tonic; reg: guqin register; harm: 泛音 prob;
   * gap: silence between phrases (s); qin: dB trim of the musical layer.
   * layers: [noiseColor, filters[[type,f,Q]], dB(rms), {det, amp, wet}]
   *   det = [ctrl, rate, cents]  -> slow filter drift via biquad.detune
   *   amp = [ctrl, rate, depth]  -> gusts / surges via gain modulation
   * ev: sparse one-shot events [kind, minGap, maxGap, dB, extra]
   */
  var SCENES = {
    tianshan: {
      tonic: 62, mode: 'shang', reg: [57, 86], harm: 0.45, gap: [5, 10], qin: -1, wet: 0.35,
      drone: { db: -44, oct: -2 },
      layers: [
        ['white', [['bandpass', 1700, 1.1]], -33, { det: ['slow', 0.6, 700], amp: ['gust', 0.5, 0.8] }],
        ['white', [['bandpass', 2900, 14]], -40, { det: ['slow', 0.9, 450], amp: ['gust', 0.7, 0.9], wet: 0.5 }],
        ['pink', [['lowpass', 380]], -35, { amp: ['gust', 0.4, 0.6] }]
      ],
      ev: [['bell', 6, 14, -33, { reg: [86, 98] }]]
    },
    everest: {
      tonic: 60, mode: 'shang', reg: [55, 84], harm: 0.5, gap: [6, 12], qin: -2, wet: 0.35,
      drone: { db: -42, oct: -2 },
      layers: [
        ['white', [['bandpass', 1300, 0.9]], -31, { det: ['slow', 0.7, 800], amp: ['gust', 0.6, 0.85] }],
        ['white', [['bandpass', 2400, 16]], -40, { det: ['slow', 1.1, 500], amp: ['gust', 0.8, 0.95], wet: 0.5 }],
        ['brown', [['lowpass', 300]], -33, { amp: ['gust', 0.5, 0.7] }]
      ],
      ev: [['bell', 10, 22, -36, { reg: [84, 96] }]]
    },
    hukou: {
      tonic: 55, mode: 'zhi', reg: [50, 79], harm: 0.25, gap: [4, 9], qin: 0, wet: 0.25,
      drone: { db: -40, oct: -2 },
      layers: [
        ['brown', [['lowpass', 420]], -26, { amp: ['gust', 0.35, 0.45] }],
        ['pink', [['bandpass', 900, 0.6]], -30, { det: ['slow', 0.5, 300], amp: ['gust', 0.45, 0.5] }],
        ['white', [['highpass', 3500], ['lowpass', 8000]], -42, { amp: ['gust', 0.45, 0.6] }]
      ],
      ev: []
    },
    lushan: {
      tonic: 57, mode: 'yu', reg: [52, 81], harm: 0.35, gap: [4, 9], qin: -1, wet: 0.35,
      drone: { db: -44, oct: -2 },
      layers: [
        ['pink', [['lowpass', 900]], -29, { amp: ['gust', 0.4, 0.35] }],
        ['white', [['bandpass', 2600, 0.7]], -38, { det: ['slow', 0.5, 300], amp: ['slow', 0.5, 0.4] }]
      ],
      ev: [['bird', 7, 18, -40, { far: 1 }]]
    },
    taishan: {
      tonic: 60, mode: 'gong', reg: [48, 79], harm: 0.3, gap: [3, 8], qin: 0, wet: 0.3,
      drone: { db: -34, oct: -2 },
      layers: [
        ['pink', [['bandpass', 1200, 0.4]], -38, { det: ['slow', 0.4, 400], amp: ['slow', 0.3, 0.5] }],
        ['brown', [['lowpass', 260]], -38, { amp: ['slow', 0.3, 0.4] }]
      ],
      ev: [['bird', 2.5, 8, -36, {}]]
    },
    huangshan: {
      tonic: 57, mode: 'yu', reg: [50, 81], harm: 0.35, gap: [4, 9], qin: 0, wet: 0.4,
      drone: { db: -42, oct: -2 },
      layers: [
        ['pink', [['bandpass', 1100, 0.7]], -30, { det: ['slow', 0.6, 600], amp: ['gust', 0.5, 0.75] }],
        ['white', [['highpass', 4200]], -41, { amp: ['gust', 0.55, 0.8] }],
        ['pink', [['lowpass', 300]], -38, { amp: ['slow', 0.3, 0.4] }]
      ],
      ev: [['bird', 10, 22, -42, { far: 1 }]]
    },
    zhangjiajie: {
      tonic: 59, mode: 'yu', reg: [52, 83], harm: 0.4, gap: [4, 10], qin: 0, wet: 0.45,
      drone: { db: -40, oct: -2 },
      layers: [
        ['pink', [['bandpass', 800, 0.6]], -29, { det: ['slow', 0.5, 500], amp: ['gust', 0.4, 0.6] }],
        ['white', [['highpass', 3800]], -41, { amp: ['gust', 0.5, 0.7] }]
      ],
      ev: [['bird', 8, 20, -42, { far: 1 }]]
    },
    sanxia: {
      tonic: 52, mode: 'yu', reg: [45, 76], harm: 0.25, gap: [4, 9], qin: 0, wet: 0.45, echo: [0.58, 0.42],
      drone: { db: -40, oct: -1 },
      layers: [
        ['pink', [['lowpass', 1300]], -30, { amp: ['slow', 0.4, 0.3] }],
        ['pink', [['bandpass', 650, 3]], -35, { det: ['fast', 0.8, 900] }],
        ['pink', [['bandpass', 1400, 4]], -40, { det: ['fast', 1.1, 800] }]
      ],
      ev: [['pluck', 7, 16, -24, { reg: [36, 50] }]]
    },
    xihu: {
      tonic: 62, mode: 'yu', reg: [55, 81], harm: 0.3, gap: [4, 9], qin: -1, wet: 0.35,
      layers: [
        ['rain', [['highpass', 500]], -33, { amp: ['slow', 0.5, 0.3] }],
        ['white', [['bandpass', 5000, 0.5]], -44, { amp: ['slow', 0.5, 0.3] }],
        ['brown', [['lowpass', 350]], -40, {}]
      ],
      ev: [['lap', 1.6, 4, -34, {}], ['drop', 0.6, 2.5, -38, {}]]
    },
    lijiang: {
      tonic: 55, mode: 'zhi', reg: [50, 79], harm: 0.3, gap: [4, 9], qin: 0, wet: 0.3,
      drone: { db: -42, oct: -2 },
      layers: [
        ['pink', [['lowpass', 900]], -33, { amp: ['slow', 0.35, 0.3] }],
        ['pink', [['bandpass', 520, 2.5]], -38, { det: ['fast', 0.6, 800] }]
      ],
      ev: [['lap', 2.5, 5, -36, {}], ['bird', 8, 18, -42, { far: 1 }]]
    },
    jiuzhaigou: {
      tonic: 55, mode: 'gong', reg: [50, 81], harm: 0.35, gap: [3, 8], qin: 0, wet: 0.35,
      layers: [
        ['pink', [['lowpass', 1100]], -33, { amp: ['slow', 0.4, 0.3] }],
        ['pink', [['bandpass', 900, 3]], -38, { det: ['fast', 1.0, 900] }]
      ],
      ev: [['bird', 4, 10, -38, {}], ['drop', 2, 6, -40, {}]]
    },
    yuanyang: {
      tonic: 50, mode: 'zhi', reg: [50, 79], harm: 0.3, gap: [3, 8], qin: 0, wet: 0.3,
      drone: { db: -42, oct: -1 },
      layers: [
        ['pink', [['bandpass', 1000, 2.5]], -38, { det: ['fast', 0.7, 900] }],
        ['pink', [['bandpass', 1500, 0.5]], -40, { amp: ['slow', 0.3, 0.5] }]
      ],
      ev: [['bird', 3, 9, -38, {}], ['drop', 1.5, 5, -40, {}]]
    },
    dunhuang: {
      tonic: 52, mode: 'jue', reg: [45, 76], harm: 0.25, gap: [5, 11], qin: 0, wet: 0.35,
      drone: { db: -32, oct: -1 },
      layers: [
        ['pink', [['bandpass', 600, 0.6]], -31, { det: ['slow', 0.5, 500], amp: ['gust', 0.45, 0.85] }],
        ['white', [['highpass', 2500]], -40, { amp: ['gust', 0.45, 0.9] }],
        ['crackle', [['highpass', 3000]], -42, { amp: ['gust', 0.5, 0.9] }]
      ],
      ev: [['camel', 14, 30, -38, {}]]
    },
    _default: {
      tonic: 60, mode: 'gong', reg: [50, 79], harm: 0.3, gap: [4, 9], qin: 0, wet: 0.35,
      drone: { db: -38, oct: -2 },
      layers: [
        ['pink', [['bandpass', 900, 0.5]], -36, { det: ['slow', 0.4, 400], amp: ['slow', 0.3, 0.5] }]
      ],
      ev: []
    }
  };
  function presetFor(id) { return SCENES[id] || SCENES._default; }

  /* ------------------------------------------------------------ envelopes */
  // smooth rise to a peak at p (0..1) then fall to 0; values 0..1
  function envPeak(p, n) {
    n = n || 96; var c = new Float32Array(n);
    for (var i = 0; i < n; i++) {
      var x = i / (n - 1), v;
      if (x < p) { v = Math.sin(0.5 * Math.PI * x / p); v *= v; }
      else { v = Math.cos(0.5 * Math.PI * (x - p) / (1 - p)); v *= v; }
      c[i] = v;
    }
    c[n - 1] = 0; return c;
  }
  // fast attack, exponential-ish decay
  function envHit(k, n) {
    n = n || 96; var c = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / (n - 1); c[i] = Math.min(1, x * 40) * Math.exp(-k * x) * (1 - x); }
    return c;
  }
  // irregular flutter (paper / sand)
  function envFlutter(p, n) {
    n = n || 128; var c = envPeak(p, n), w = 0.6;
    for (var i = 1; i < n - 1; i++) { w += (Math.random() - 0.5) * 0.5; w = clamp(w, 0.25, 1); c[i] *= w; }
    return c;
  }
  function scaleCurve(c, g) { var o = new Float32Array(c.length); for (var i = 0; i < c.length; i++) o[i] = c[i] * g; return o; }

  /* ------------------------------------------------------------ engine */
  function Engine(ctx, opts) {
    opts = opts || {};
    this.ctx = ctx; this.sr = ctx.sampleRate;
    this.streams = []; this.beds = []; this.bed = null; this.timeline = [];
    this._buf = {}; this._rms = {};
    this.created = 0; // node counter (diagnostics)
    var c = ctx;

    // master: buses -> master gain -> HPF -> glue comp -> limiter -> trim -> out
    this.master = c.createGain(); this.master.gain.value = 0;
    var hp = c.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 30; hp.Q.value = -3;
    var comp = c.createDynamicsCompressor();
    comp.threshold.value = -22; comp.knee.value = 12; comp.ratio.value = 2; comp.attack.value = 0.02; comp.release.value = 0.35;
    var lim = c.createDynamicsCompressor();
    lim.threshold.value = -6; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.12;
    this.trim = c.createGain(); this.trim.gain.value = dbl(TRIM_DB);
    if (opts.raw) { this.master.connect(hp); hp.connect(c.destination); } // test: measure pre-dynamics level
    else { this.master.connect(hp); hp.connect(comp); comp.connect(lim); lim.connect(this.trim); this.trim.connect(c.destination); }
    this.comp = comp; this.lim = lim;

    this.bedBus = this.gain(1, this.master);
    this.fxBus = this.gain(1, this.master);
    this.musicBus = this.gain(1, this.master);

    // long generated reverb
    this.revIn = c.createGain();
    var conv = c.createConvolver(); conv.normalize = false; conv.buffer = this.makeIR(5.0, 4.2);
    var revLP = c.createBiquadFilter(); revLP.type = 'lowpass'; revLP.frequency.value = 6000; revLP.Q.value = -3;
    var revOut = this.gain(0.6, this.master);
    this.revIn.connect(conv); conv.connect(revLP); revLP.connect(revOut);

    // guqin voice: woody body + soft top, dry + long reverb send
    this.qinIn = c.createGain();
    var body = c.createBiquadFilter(); body.type = 'peaking'; body.frequency.value = 210; body.Q.value = 0.9; body.gain.value = 3;
    var top = c.createBiquadFilter(); top.type = 'lowpass'; top.frequency.value = 5200; top.Q.value = -3;
    this.qinOut = c.createGain(); this.qinOut.gain.value = 1;
    this.qinIn.connect(body); body.connect(top); top.connect(this.qinOut); this.qinOut.connect(this.musicBus);
    var qsend = this.gain(0.7, this.revIn); this.qinOut.connect(qsend);
    this.mus = { left: 0, idx: -1 };
  }
  var E = Engine.prototype;

  E.gain = function (v, dest) { var g = this.ctx.createGain(); g.gain.value = v; if (dest) g.connect(dest); this.created++; return g; };
  E.panner = function (p) {
    var c = this.ctx; this.created++;
    if (c.createStereoPanner) { var n = c.createStereoPanner(); n.pan.value = clamp(p || 0, -1, 1); return n; }
    return c.createGain();
  };
  E.filter = function (type, f, q) {
    var b = this.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; this.created++;
    b.Q.value = q != null ? q : (type === 'lowpass' || type === 'highpass' ? -3 : 0.707);
    return b;
  };
  // disconnect a list of nodes once `src` ends (keeps memory flat)
  function cleanup(src, nodes) {
    src.onended = function () { for (var i = 0; i < nodes.length; i++) { try { nodes[i].disconnect(); } catch (e) {} } src.onended = null; };
  }
  function hold(param, t) {
    if (param.cancelAndHoldAtTime) { try { param.cancelAndHoldAtTime(t); return; } catch (e) {} }
    var v = param.value; param.cancelScheduledValues(t); param.setValueAtTime(v, t);
  }

  /* ---------------- buffers (generated once per context, reused) */
  E.noise = function (kind) {
    if (this._buf[kind]) return this._buf[kind];
    var sr = this.sr, c = this.ctx, b, ch, i;
    if (kind === 'rain' || kind === 'crackle') return (this._buf[kind] = this.texture(kind));
    var N = Math.floor(sr * 6), F = Math.floor(sr * 0.25);
    b = c.createBuffer(2, N, sr);
    var leak = Math.exp(-TAU * 40 / sr);
    for (ch = 0; ch < 2; ch++) {
      var x = new Float32Array(N + F), b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, y = 0, s = 0;
      for (i = 0; i < N + F; i++) {
        var w = Math.random() * 2 - 1;
        if (kind === 'pink') {
          b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
          b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
          x[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362; b6 = w * 0.115926;
        } else if (kind === 'brown') { y = leak * y + (1 - leak) * w; x[i] = y; }
        else x[i] = w;
      }
      var mean = 0; for (i = 0; i < x.length; i++) mean += x[i]; mean /= x.length;
      for (i = 0; i < x.length; i++) { x[i] -= mean; s += x[i] * x[i]; }
      var k = 0.3 / Math.sqrt(s / x.length), d = b.getChannelData(ch);
      for (i = 0; i < N; i++) {
        var v = x[i];
        if (i < F) { var a = 0.5 * Math.PI * i / F; v = x[i] * Math.sin(a) + x[N + i] * Math.cos(a); } // seamless loop
        d[i] = v * k;
      }
    }
    this._rms[kind] = 0.3;
    return (this._buf[kind] = b);
  };

  // rain = many tiny rising "plinks"; crackle = bursty grains (paper, sand)
  E.texture = function (kind) {
    var sr = this.sr, N = Math.floor(sr * (kind === 'rain' ? 6 : 4)), b = this.ctx.createBuffer(2, N, sr), s = 0;
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), j, k;
      if (kind === 'rain') {
        var drops = Math.floor(N / sr * 90);
        for (j = 0; j < drops; j++) {
          var pos = Math.floor(Math.random() * N), f = Math.exp(rnd(Math.log(1400), Math.log(5500)));
          var dec = rnd(0.003, 0.014) * sr, len = Math.floor(dec * 5), amp = Math.pow(Math.random(), 3) * 0.6 + 0.02, ph = 0;
          for (k = 0; k < len; k++) { ph += TAU * f * (1 + 0.7 * k / len) / sr; d[(pos + k) % N] += amp * Math.exp(-k / dec) * Math.sin(ph); }
        }
      } else {
        var rate = 0, t = 0;
        for (j = 0; j < N; j += 64) {
          if (j % 4096 === 0) rate = Math.pow(Math.random(), 2) * 1200 + 40;
          var n = Math.random() < rate * 64 / sr ? 1 : 0;
          if (n) {
            var p = j + Math.floor(Math.random() * 64), L = Math.floor(rnd(0.0002, 0.0025) * sr), a = Math.pow(Math.random(), 2.5);
            for (k = 0; k < L; k++) d[(p + k) % N] += a * (Math.random() * 2 - 1) * Math.exp(-4 * k / L);
          }
        }
      }
      for (j = 0; j < N; j++) s += d[j] * d[j];
    }
    this._rms[kind] = Math.sqrt(s / (2 * N)) || 0.1;
    return b;
  };

  // smooth random control signals at 8 kHz, looped (seamless)
  E.ctrl = function (kind) {
    var key = 'c_' + kind; if (this._buf[key]) return this._buf[key];
    var CSR = 8000, spec = { slow: [32, 1.2, 4, 0], gust: [40, 1.5, 5, 2.2], fast: [4, 0.03, 0.12, 0] }[kind];
    var len = spec[0], N = len * CSR, b, d;
    try { b = this.ctx.createBuffer(1, N, CSR); }
    catch (e) { CSR = 22050; len = Math.max(4, len / 2); N = len * CSR; b = this.ctx.createBuffer(1, N, CSR); } // old WebKit: sampleRate >= 22050
    d = b.getChannelData(0);
    var pts = [[0, Math.random()]], t = 0;
    while (true) { t += rnd(spec[1], spec[2]); if (t >= len - spec[1] * 0.5) break; pts.push([t, Math.random()]); }
    pts.push([len, pts[0][1]]);
    var seg = 0;
    for (var i = 0; i < N; i++) {
      var tt = i / CSR; while (pts[seg + 1][0] < tt) seg++;
      var a = pts[seg], z = pts[seg + 1], x = (tt - a[0]) / (z[0] - a[0]);
      var u = a[1] + (z[1] - a[1]) * (0.5 - 0.5 * Math.cos(Math.PI * x));
      d[i] = spec[3] ? 2 * Math.pow(u, spec[3]) - 1 : 2 * u - 1;
    }
    return (this._buf[key] = b);
  };

  // synthesized hall: decaying stereo noise that darkens over time
  E.makeIR = function (sec, t60) {
    var sr = this.sr, N = Math.floor(sec * sr), pre = Math.floor(0.022 * sr), b = this.ctx.createBuffer(2, N, sr);
    for (var ch = 0; ch < 2; ch++) {
      var d = b.getChannelData(ch), lp = 0, a = 0, e = 0, i;
      for (i = pre; i < N; i++) {
        var t = (i - pre) / sr;
        if ((i & 63) === 0) { var fc = 9000 * Math.pow(1100 / 9000, Math.min(1, t / (sec * 0.75))); a = 1 - Math.exp(-TAU * fc / sr); }
        lp += a * ((Math.random() * 2 - 1) - lp);
        d[i] = lp * Math.pow(10, -3 * t / t60) * Math.min(1, t / 0.015) * (i > N - sr * 0.3 ? (N - i) / (sr * 0.3) : 1);
      }
      for (var r = 0; r < 7; r++) { var p = pre + Math.floor(rnd(0.004, 0.06) * sr); d[p] += rnd(-0.6, 0.6) * 0.15; }
      for (i = 0; i < N; i++) e += d[i] * d[i];
      var k = 1 / Math.sqrt(e); for (i = 0; i < N; i++) d[i] *= k;
    }
    return b;
  };

  // expected RMS of a noise buffer through a filter chain (for level calibration)
  E.calib = function (kind, filters) {
    var n = 160, fmin = 20, fmax = this.sr * 0.49, r = Math.pow(fmax / fmin, 1 / (n - 1));
    var fr = new Float32Array(n), mag = new Float32Array(n), ph = new Float32Array(n), h2 = new Float32Array(n), i;
    for (i = 0; i < n; i++) { fr[i] = fmin * Math.pow(r, i); h2[i] = 1; }
    for (var j = 0; j < filters.length; j++) { filters[j].getFrequencyResponse(fr, mag, ph); for (i = 0; i < n; i++) h2[i] *= mag[i] * mag[i]; }
    var P = 0, Pr = 0;
    for (i = 0; i < n; i++) {
      var f = fr[i], S = kind === 'pink' ? 1 / f : kind === 'brown' ? 1 / (f * f + 1600) : 1, df = f * (r - 1);
      P += S * h2[i] * df; Pr += S * df;
    }
    this.noise(kind);
    return (this._rms[kind] || 0.3) * Math.sqrt(P / Pr) + 1e-9;
  };

  // looped control source -> depth gain -> params
  E.mod = function (owner, params, kind, rate, depth, t0) {
    var c = this.ctx, s = c.createBufferSource(), b = this.ctrl(kind);
    s.buffer = b; s.loop = true; s.playbackRate.value = rate * rnd(0.85, 1.15);
    var g = this.gain(depth); s.connect(g);
    for (var i = 0; i < params.length; i++) g.connect(params[i]);
    s.start(t0, Math.random() * b.duration);
    owner.srcs.push(s); owner.nodes.push(s, g); this.created++;
  };

  /* ---------------- scene beds */
  E.makeBed = function (id, P, t0) {
    var c = this.ctx, self = this;
    var bed = { id: id, P: P, nodes: [], srcs: [], end: Infinity, t0: t0 };
    bed.mix = this.gain(1); bed.wet = this.gain(1);
    bed.fadeDry = this.gain(0, this.bedBus); bed.fadeWet = this.gain(0, this.revIn);
    bed.mix.connect(bed.fadeDry); bed.wet.connect(bed.fadeWet);
    var mixSend = this.gain(P.wet || 0.3, bed.wet); bed.mix.connect(mixSend);
    bed.nodes.push(bed.mix, bed.wet, bed.fadeDry, bed.fadeWet, mixSend);

    if (P.echo) { // distant gorge echo
      var din = this.gain(1), dl = c.createDelay(2), fb = this.gain(P.echo[1]), lp = this.filter('lowpass', 1700), pn = this.panner(0.35);
      dl.delayTime.value = P.echo[0]; this.created++;
      din.connect(dl); dl.connect(lp); lp.connect(fb); fb.connect(dl); lp.connect(pn); pn.connect(bed.mix); pn.connect(bed.wet);
      bed.echo = din; bed.nodes.push(din, dl, fb, lp, pn);
    }

    P.layers.forEach(function (L) { self.noiseLayer(bed, L, t0); });
    if (P.drone) this.drone(bed, P, t0);

    (P.ev || []).forEach(function (ev) {
      self.streams.push({
        owner: bed, next: t0 + rnd(0.5, ev[2] * 0.6), end: Infinity,
        fire: function (t) { self.event(bed, ev, t); return rnd(ev[1], ev[2]); }
      });
    });
    return bed;
  };

  E.noiseLayer = function (bed, L, t0) {
    var c = this.ctx, src = c.createBufferSource(), opt = L[3] || {}, fl = [], node = src;
    src.buffer = this.noise(L[0]); src.loop = true; src.playbackRate.value = rnd(0.94, 1.06);
    var spec = L[1];
    if (spec[0][0] === 'lowpass') spec = [['highpass', L[0] === 'brown' ? 40 : 60]].concat(spec); // keep sub rumble out
    spec.forEach(function (F) { var b = this.filter(F[0], F[1], F[2]); node.connect(b); node = b; fl.push(b); }, this);
    var lin = dbl(L[2]) / this.calib(L[0], fl), amp = this.gain(lin, bed.mix);
    node.connect(amp);
    if (opt.wet) { var s = this.gain(opt.wet, bed.wet); amp.connect(s); bed.nodes.push(s); }
    if (opt.det) this.mod(bed, fl.map(function (b) { return b.detune; }), opt.det[0], opt.det[1], opt.det[2], t0);
    if (opt.amp) this.mod(bed, [amp.gain], opt.amp[0], opt.amp[1], lin * opt.amp[2], t0);
    src.start(t0, Math.random() * 5);
    bed.srcs.push(src); bed.nodes.push(src); bed.nodes.push.apply(bed.nodes, fl); bed.nodes.push(amp); this.created++;
  };

  // two detuned sines + pitched filtered noise on the scene's tonic
  E.drone = function (bed, P, t0) {
    var c = this.ctx, f = mtof(P.tonic + 12 * (P.drone.oct || -1)), lvl = dbl(P.drone.db);
    var dg = this.gain(lvl * 1.0, bed.mix); // two sines of 0.5 each -> rms ~ lvl
    [1, 1.0045].forEach(function (m) {
      var o = c.createOscillator(); o.frequency.value = f * m; var g = this.gain(0.5, dg); o.connect(g);
      o.start(t0); bed.srcs.push(o); bed.nodes.push(o, g); this.created++;
    }, this);
    var o2 = c.createOscillator(); o2.frequency.value = f * 2.003; var g2 = this.gain(0.18, dg); o2.connect(g2);
    o2.start(t0); bed.srcs.push(o2); bed.nodes.push(o2, g2, dg); this.created++;
    this.mod(bed, [dg.gain], 'slow', 0.5, lvl * 0.35, t0);
    this.noiseLayer(bed, ['pink', [['bandpass', f * 2, 9]], P.drone.db - 9, { amp: ['slow', 0.4, 0.5] }], t0);
  };

  E.fadeBed = function (bed, t, dur, up) {
    var n = 32, curve = new Float32Array(n);
    for (var i = 0; i < n; i++) { var x = i / (n - 1); curve[i] = up ? Math.sin(0.5 * Math.PI * x) : bed.level * Math.cos(0.5 * Math.PI * x); }
    [bed.fadeDry.gain, bed.fadeWet.gain].forEach(function (g) {
      if (up) { g.setValueAtTime(0, t); try { g.setValueCurveAtTime(curve, t + 0.002, dur); } catch (e) { g.linearRampToValueAtTime(1, t + dur); } }
      else { hold(g, t); try { g.setValueCurveAtTime(curve, t + 0.002, dur); } catch (e) { g.linearRampToValueAtTime(0, t + dur); } }
    });
    bed.level = up ? 1 : 0;
  };

  E.setScene = function (id, t, fade) {
    var P = presetFor(id), old = this.bed;
    if (old && old.id === id) return;
    this.timeline.push({ t: t, P: P }); if (this.timeline.length > 6) this.timeline.shift();
    var bed = this.makeBed(id, P, t);
    this.fadeBed(bed, t, Math.max(0.05, fade), true);
    if (old) this.retire(old, t, fade);
    this.bed = bed; this.beds.push(bed);
  };
  E.retire = function (bed, t, fade) {
    if (bed.end !== Infinity) return;
    this.fadeBed(bed, t, Math.max(0.05, fade), false);
    bed.end = t + fade + 0.1;
    for (var i = 0; i < bed.srcs.length; i++) { try { bed.srcs[i].stop(bed.end); } catch (e) {} }
    for (var j = 0; j < this.streams.length; j++) if (this.streams[j].owner === bed) this.streams[j].end = bed.end - 0.5;
  };
  E.dispose = function (bed) {
    for (var i = 0; i < bed.nodes.length; i++) { try { bed.nodes[i].disconnect(); } catch (e) {} }
    bed.nodes.length = 0; bed.srcs.length = 0;
  };
  E.presetAt = function (t) {
    var P = this.timeline.length ? this.timeline[0].P : SCENES._default;
    for (var i = 0; i < this.timeline.length; i++) if (this.timeline[i].t <= t) P = this.timeline[i].P;
    return P;
  };

  /* ---------------- scheduler */
  E.pump = function (until, now) {
    var i, s, guard;
    for (i = 0; i < this.streams.length; i++) {
      s = this.streams[i]; guard = 0;
      if (now != null && s.next < now) s.next = now + 0.05;
      while (s.next < until && s.next < s.end && guard++ < 32) {
        var dt = 1;
        try { dt = s.fire(s.next); } catch (err) { warn('event', err); }
        s.next += Math.max(0.03, dt || 1);
      }
    }
    this.streams = this.streams.filter(function (x) { return x.next < x.end; });
    if (now != null) {
      for (i = this.beds.length - 1; i >= 0; i--) {
        if (this.beds[i].end < now - 0.2) { this.dispose(this.beds[i]); this.beds.splice(i, 1); }
      }
    }
  };

  /* ---------------- guqin (Karplus–Strong with fractional delay & pitch curves) */
  E.qinBuffer = function (freq, o) {
    var sr = Math.min(this.sr, 32000), dur = o.dur, N = Math.ceil(dur * sr), out = new Float32Array(N);
    var M = 4096, mask = M - 1, dl = new Float32Array(M), n;
    var s = o.damp, rho = Math.pow(0.001, 1 / (freq * o.t60));
    var P0 = sr / freq, L = Math.max(4, Math.round(P0)), exc = new Float32Array(L), lp = 0, mean = 0;
    for (n = 0; n < L; n++) { lp += o.bright * ((Math.random() * 2 - 1) - lp); exc[n] = lp; }
    var pp = Math.max(1, Math.round(L * o.pos)); // pluck position comb
    for (n = L - 1; n >= pp; n--) exc[n] -= exc[n - pp];
    for (n = 0; n < L; n++) { exc[n] *= Math.sin(Math.PI * (n + 0.5) / L); mean += exc[n]; }
    mean /= L; for (n = 0; n < L; n++) exc[n] -= mean;
    var curve = o.curve, P = P0 - s, prevC = 0, slideAmt = 0, nz = 0, g = rho;
    // loop gain compensated for the averaging + interpolation loss at the fundamental,
    // so T60 holds across the register (capped below 1 to keep DC stable)
    function comp(Pc, fc) {
      var cw = 1 - Math.cos(TAU * fc / sr), q = Pc - Math.floor(Pc);
      var h2 = (1 - 2 * s * (1 - s) * cw) * (1 - 2 * q * (1 - q) * cw);
      return Math.min(rho / Math.sqrt(h2), 0.99995);
    }
    g = comp(P, freq);
    for (n = 0; n < N; n++) {
      if ((n & 31) === 0 && curve) {
        var cc = curve(n / sr), fc = freq * Math.pow(2, cc / 1200); slideAmt = Math.min(1, Math.abs(cc - prevC) * 0.08); prevC = cc;
        P = sr / fc - s; g = comp(P, fc);
      }
      var r = n - P, i0 = Math.floor(r), fr = r - i0;
      var a = dl[i0 & mask], b = dl[(i0 + 1) & mask], c0 = dl[(i0 - 1) & mask];
      var y = g * ((1 - s) * (a + (b - a) * fr) + s * (c0 + (a - c0) * fr));
      if (n < L) y += exc[n];
      dl[n & mask] = y; out[n] = y;
      if (slideAmt > 0.01) { nz += 0.15 * ((Math.random() * 2 - 1) - nz); out[n] += nz * slideAmt * 0.05; } // silk-string finger slide
    }
    return this.finishBuffer(out, sr, 0.6);
  };
  // 泛音 harmonic: clear, bell-like near-sine with weak upper partials
  E.harmBuffer = function (freq, o) {
    var sr = Math.min(this.sr, 32000), N = Math.ceil(o.dur * sr), out = new Float32Array(N);
    var parts = [[1, 1, 1], [2.002, 0.16, 0.55], [3.005, 0.05, 0.35]];
    for (var p = 0; p < parts.length; p++) {
      var f = freq * parts[p][0], amp = parts[p][1], k = 6.9 / (o.t60 * parts[p][2]), w = TAU * f / sr;
      if (f > sr * 0.45) continue;
      for (var n = 0; n < N; n++) { var t = n / sr; out[n] += amp * Math.exp(-k * t) * Math.sin(w * n) * Math.min(1, t / 0.004); }
    }
    for (var m = 0; m < Math.min(N, 200); m++) out[m] += (Math.random() * 2 - 1) * 0.08 * Math.exp(-m / 30);
    return this.finishBuffer(out, sr, 0.5);
  };
  E.finishBuffer = function (out, sr, fadeS) {
    var N = out.length, F = Math.floor(fadeS * sr), pk = 0, n;
    for (n = 0; n < F; n++) out[N - 1 - n] *= n / F;
    for (n = 0; n < N; n++) if (Math.abs(out[n]) > pk) pk = Math.abs(out[n]);
    var k = 0.9 / (pk || 1); for (n = 0; n < N; n++) out[n] *= k;
    var b = this.ctx.createBuffer(1, N, sr); b.getChannelData(0).set(out); return b;
  };

  // pitch ornaments: 绰 (from below) / 注 (from above) / 吟 (vibrato) / 上下 (walking slide)
  function ornament(kind, interval) {
    if (kind === 'chuo' || kind === 'zhu') {
      var d = rnd(90, 200) * (kind === 'chuo' ? -1 : 1), g = rnd(0.12, 0.28);
      return function (t) { return t < g ? d * Math.pow(1 - t / g, 2) : 0; };
    }
    if (kind === 'yin') {
      var A = rnd(8, 18), rt = rnd(3.5, 5.5), t0 = rnd(0.2, 0.5);
      return function (t) { return t < t0 ? 0 : A * Math.exp(-(t - t0) / 1.8) * Math.sin(TAU * rt * (t - t0)) * Math.min(1, (t - t0) * 3); };
    }
    if (kind === 'walk') {
      var ts = rnd(0.7, 1.5), gd = rnd(0.25, 0.5), back = chance(0.4), tb = ts + gd + rnd(0.6, 1.2), iv = interval * 100;
      return function (t) {
        var v = 0;
        if (t > ts) { var x = Math.min(1, (t - ts) / gd); v = iv * x * x * (3 - 2 * x); }
        if (back && t > tb) { var y = Math.min(1, (t - tb) / gd); v = iv * (1 - y * y * (3 - 2 * y)); }
        return v;
      };
    }
    return null;
  }

  // play one qin note at time t (midi may be fractional-free); dest defaults to qin chain
  E.qinNote = function (t, midi, o) {
    o = o || {};
    var c = this.ctx, f = mtof(midi), buf;
    if (o.harm) buf = this.harmBuffer(f, { dur: 4.5, t60: rnd(3, 4.5) });
    else {
      var t60 = clamp(9.5 - (midi - 40) * 0.13, 3.5, 9.5);
      buf = this.qinBuffer(f, {
        dur: Math.min(7.5, t60 * 0.85), t60: t60, damp: clamp(0.18 + (60 - midi) * 0.006, 0.1, 0.4),
        bright: rnd(0.35, 0.6), pos: rnd(0.1, 0.18), curve: ornament(o.orn, o.iv || 2)
      });
    }
    var src = c.createBufferSource(); src.buffer = buf;
    var g = this.gain(o.gain), pn = this.panner(o.pan || 0);
    src.connect(g); g.connect(pn); pn.connect(o.dest || this.qinIn);
    if (o.dest2) pn.connect(o.dest2);
    src.start(t); cleanup(src, [src, g, pn]); this.created++;
  };

  E.scaleNotes = function (P, lo, hi) {
    var m = MODES[P.mode] || MODES.gong, out = [];
    for (var n = lo; n <= hi; n++) { var pc = ((n - P.tonic) % 12 + 12) % 12; if (m.indexOf(pc) >= 0) out.push(n); }
    return out;
  };

  E.startMusic = function (t0) {
    var self = this;
    this.streams.push({ owner: null, next: t0 + rnd(2, 4), end: Infinity, fire: function (t) { return self.musicNote(t); } });
  };
  // one note of a sparse phrase; returns time until the next note
  E.musicNote = function (t) {
    var P = this.presetAt(t), S = this.scaleNotes(P, P.reg[0], P.reg[1]), st = this.mus;
    if (!S.length) return 5;
    if (st.left <= 0) {
      st.left = pick([1, 1, 2, 2, 2, 3, 3, 4]); st.len = st.left;
      if (st.idx < 0 || st.P !== P || chance(0.25)) st.idx = Math.floor(S.length * rnd(0.3, 0.65));
      st.P = P;
    }
    var idx = clamp(st.idx + pick([-2, -1, -1, -1, 0, 1, 1, 2, -3, 3]), 0, S.length - 1);
    if (st.left === 1 && chance(0.5)) { // cadence toward the mode's tonic
      for (var k = idx; k >= 0; k--) if (((S[k] - P.tonic) % 12 + 12) % 12 === 0) { idx = k; break; }
    }
    st.idx = idx; st.left--;
    var midi = S[idx], vel = rnd(0.55, 1), base = dbl(-12 + (P.qin || 0)) * vel, pan = rnd(-0.25, 0.25);
    if (chance(P.harm)) {
      this.qinNote(t, midi < 69 ? midi + 12 : midi, { harm: true, gain: base * 0.5, pan: pan });
    } else {
      var r = Math.random(), orn = r < 0.18 ? 'chuo' : r < 0.26 ? 'zhu' : r < 0.5 ? 'yin' : r < 0.64 ? 'walk' : null;
      var iv = idx + 1 < S.length ? S[idx + 1] - midi : -2;
      this.qinNote(t, midi, { gain: base, pan: pan, orn: orn, iv: iv });
      if (chance(0.12)) { // 撮: octave below sounded together
        var lo = midi - 12; if (lo >= 36) this.qinNote(t + 0.015, lo, { gain: base * 0.6, pan: -pan });
      }
    }
    return st.left > 0 ? rnd(0.8, 2.4) : rnd(P.gap[0], P.gap[1]);
  };

  /* ---------------- one-shot primitives */
  // filtered noise shot with frequency path, envelope curve, pan sweep
  E.shot = function (o) {
    var c = this.ctx, t = o.t, d = Math.max(0.05, o.d), src = c.createBufferSource(), node = src, nodes = [src], fl = [];
    src.buffer = this.noise(o.n || 'pink'); src.loop = true; src.playbackRate.value = o.rate || 1;
    (o.filt || []).forEach(function (F) {
      var path = F[1], b = this.filter(F[0], Array.isArray(path) ? path[0] : path, F[2]);
      if (Array.isArray(path) && path.length > 1) {
        b.frequency.setValueAtTime(path[0], t);
        for (var i = 1; i < path.length; i++) b.frequency.exponentialRampToValueAtTime(path[i], t + d * i / (path.length - 1));
      }
      node.connect(b); node = b; fl.push(b); nodes.push(b);
    }, this);
    if (o.fast) this.modOneShot(fl, nodes, o.fast, t, d);
    var lin = dbl(o.db) / this.calib(o.n || 'pink', fl), g = this.gain(0), pn = this.panner(o.pan ? o.pan[0] : 0);
    g.gain.setValueAtTime(0, t); g.gain.setValueCurveAtTime(scaleCurve(o.env || envPeak(0.5), lin), t, d);
    if (o.pan && pn.pan) { pn.pan.setValueAtTime(o.pan[0], t); pn.pan.linearRampToValueAtTime(o.pan[1], t + d); }
    node.connect(g); g.connect(pn); pn.connect(this.fxBus); nodes.push(g, pn);
    if (o.wet) { var w = this.gain(o.wet, this.revIn); pn.connect(w); nodes.push(w); }
    src.start(t, Math.random() * 3); src.stop(t + d + 0.02); cleanup(src, nodes); this.created++;
  };
  E.modOneShot = function (fl, nodes, depth, t, d) {
    var s = this.ctx.createBufferSource(); s.buffer = this.ctrl('fast'); s.loop = true; s.playbackRate.value = rnd(0.8, 1.2);
    var g = this.gain(depth); s.connect(g); fl.forEach(function (b) { g.connect(b.detune); });
    s.start(t, Math.random() * 3); s.stop(t + d + 0.02); nodes.push(g); cleanup(s, [s, g]); this.created++;
  };
  // sine (or other) tone with glide + exponential decay
  E.tone = function (o) {
    var c = this.ctx, t = o.t, osc = c.createOscillator(), g = this.gain(0), pn = this.panner(o.pan || 0), nodes = [osc, g, pn];
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, t);
    if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + (o.glide || 0.05));
    var a = o.a || 0.003, pk = dbl(o.db), end;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + a);
    if (o.hold) g.gain.setValueAtTime(pk, t + a + o.hold);
    g.gain.setTargetAtTime(0, t + a + (o.hold || 0), o.decay / 4.6);
    end = t + a + (o.hold || 0) + o.decay * 1.4;
    osc.connect(g); g.connect(pn); pn.connect(o.dest || this.fxBus);
    if (o.wet) { var w = this.gain(o.wet, this.revIn); pn.connect(w); nodes.push(w); }
    osc.start(t); osc.stop(end); cleanup(osc, nodes); this.created++;
  };
  E.bell = function (t, f, dbv, o) {
    o = o || {};
    var parts = o.parts || [[1, 1, 1], [2.756, 0.38, 0.45], [5.404, 0.14, 0.22]], pan = o.pan != null ? o.pan : rnd(-0.6, 0.6);
    for (var i = 0; i < parts.length; i++) {
      var pf = f * parts[i][0]; if (pf > this.sr * 0.45) continue;
      this.tone({ t: t, f: pf, a: 0.002, decay: (o.decay || 3.5) * parts[i][2], db: dbv + 20 * Math.log10(parts[i][1]), pan: pan, wet: o.wet != null ? o.wet : 0.8, dest: o.dest });
    }
  };
  E.playBuf = function (buf, t, dbv, pan, wet, dest, rate) {
    var src = this.ctx.createBufferSource(); src.buffer = buf; if (rate) src.playbackRate.value = rate;
    var g = this.gain(dbl(dbv)), pn = this.panner(pan || 0), nodes = [src, g, pn];
    src.connect(g); g.connect(pn); pn.connect(dest || this.fxBus);
    if (wet) { var w = this.gain(wet, this.revIn); pn.connect(w); nodes.push(w); }
    src.start(t); cleanup(src, nodes); this.created++;
  };
  // modal wood knock (rendered, tiny)
  E.knockBuf = function (f, dec) {
    var sr = this.sr, N = Math.floor(sr * Math.min(0.6, dec * 6 + 0.02)), out = new Float32Array(N);
    var modes = [[1, 1, 1], [2.57, 0.45, 0.55], [4.21, 0.22, 0.35], [6.3, 0.1, 0.22]];
    for (var m = 0; m < modes.length; m++) {
      var w = TAU * f * modes[m][0] * rnd(0.98, 1.02) / sr, k = 1 / (dec * modes[m][2] * sr), a = modes[m][1];
      if (f * modes[m][0] > sr * 0.45) continue;
      for (var n = 0; n < N; n++) out[n] += a * Math.exp(-k * n) * Math.sin(w * n);
    }
    var lp = 0; for (var j = 0; j < Math.min(N, Math.floor(sr * 0.004)); j++) { lp += 0.5 * ((Math.random() * 2 - 1) - lp); out[j] += lp * 0.5 * (1 - j / (sr * 0.004)); }
    return this.finishBuffer(out, sr, Math.min(0.05, N / sr * 0.3));
  };
  E.knock = function (t, f, dbv, pan, dec, wet) { this.playBuf(this.knockBuf(f, dec || 0.06), t, dbv, pan, wet != null ? wet : 0.35); };
  // creak: irregular stick-slip pulses into wooden resonances
  E.creakBuf = function (dur) {
    var sr = this.sr, N = Math.floor(sr * dur), out = new Float32Array(N), res = [[380, 0.012], [870, 0.009], [1520, 0.006], [2300, 0.004]];
    var t = 0.02, i;
    while (t < dur - 0.05) {
      var x = t / dur, rate = 28 + 40 * Math.sin(Math.PI * x) + rnd(-6, 6), amp = Math.pow(Math.sin(Math.PI * x), 0.7) * rnd(0.5, 1);
      var p0 = Math.floor(t * sr);
      for (var r = 0; r < res.length; r++) {
        var w = TAU * res[r][0] / sr, k = 1 / (res[r][1] * sr), L = Math.min(N - p0, Math.floor(res[r][1] * sr * 5));
        for (i = 0; i < L; i++) out[p0 + i] += amp * (1 / (r + 1)) * Math.exp(-k * i) * Math.sin(w * i);
      }
      t += 1 / rate;
    }
    return this.finishBuffer(out, sr, 0.05);
  };
  // water drop: rising bubble "plink"
  E.drop = function (t, f, dbv, pan, dest, wet) {
    this.tone({ t: t, f: f, f1: f * rnd(1.6, 2.3), glide: rnd(0.025, 0.05), a: 0.001, decay: rnd(0.06, 0.12), db: dbv, pan: pan, dest: dest, wet: wet != null ? wet : 0.3 });
  };

  /* ---------------- bed events */
  E.event = function (bed, ev, t) {
    var kind = ev[0], dbv = ev[3], x = ev[4] || {}, P = bed.P, S;
    if (kind === 'bell') {
      S = this.scaleNotes(P, x.reg[0], x.reg[1]);
      this.bell(t, mtof(pick(S)), dbv + rnd(-4, 0), { decay: rnd(2.5, 4.5), wet: 1, dest: bed.mix });
    } else if (kind === 'camel') { // 驼铃: a few low bell strikes, walking pace
      var f = mtof(P.tonic + 24 + pick([0, 7])) * rnd(0.99, 1.01), n = rint(2, 4), pan = rnd(-0.6, 0.6);
      for (var i = 0; i < n; i++) this.bell(t + i * rnd(0.5, 0.7), f, dbv - i * 2 + rnd(-2, 0), { parts: [[1, 1, 1], [2.32, 0.5, 0.5], [4.1, 0.25, 0.25]], decay: 1.6, pan: pan, wet: 0.9, dest: bed.mix });
    } else if (kind === 'bird') this.bird(bed, t, dbv, x);
    else if (kind === 'lap') {
      var d = rnd(1.1, 2.2), c0 = rnd(220, 320);
      this.shotTo(bed, { t: t, d: d, n: 'pink', filt: [['bandpass', [c0, c0 * rnd(1.8, 2.6), c0 * 0.9], 1.4]], env: envPeak(rnd(0.3, 0.45)), db: dbv + rnd(-3, 1), pan: [rnd(-0.5, 0.5), rnd(-0.5, 0.5)] });
      if (chance(0.5)) this.drop(t + d * rnd(0.3, 0.7), rnd(500, 900), dbv - 6, rnd(-0.5, 0.5), bed.mix, 0.2);
    } else if (kind === 'drop') {
      this.drop(t, Math.exp(rnd(Math.log(700), Math.log(2600))), dbv + rnd(-6, 0), rnd(-0.8, 0.8), bed.mix, 0.4);
    } else if (kind === 'pluck') { // distant low qin plucks into the gorge echo
      S = this.scaleNotes(P, x.reg[0], x.reg[1]);
      this.qinNote(t, pick(S), { gain: dbl(dbv + rnd(-4, 0)), pan: rnd(-0.4, 0.4), dest: bed.echo || bed.mix, dest2: bed.mix, orn: chance(0.3) ? 'yin' : null });
    }
  };
  // shot routed into a bed (so it fades with the bed)
  E.shotTo = function (bed, o) { var fx = this.fxBus; this.fxBus = bed.mix; try { this.shot(o); } finally { this.fxBus = fx; } };

  E.bird = function (bed, t, dbv, x) {
    var c = this.ctx, o = c.createOscillator(), g = this.gain(0), pn = this.panner(rnd(-0.75, 0.75)), nodes = [o, g, pn];
    var amp = dbl(dbv + rnd(-4, 0)), base = rnd(2300, 4300), tt = t, kind = rint(0, 2), i, n, dur;
    o.frequency.setValueAtTime(base, t); g.gain.setValueAtTime(0, t);
    if (kind === 0) { // descending chirps
      n = rint(2, 5);
      for (i = 0; i < n; i++) {
        dur = rnd(0.05, 0.09);
        o.frequency.setValueAtTime(base * rnd(1.15, 1.3), tt); o.frequency.exponentialRampToValueAtTime(base * rnd(0.7, 0.85), tt + dur);
        g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(amp, tt + 0.008); g.gain.linearRampToValueAtTime(0, tt + dur);
        tt += dur + rnd(0.06, 0.14);
      }
    } else if (kind === 1) { // two-note whistle
      for (i = 0; i < 2; i++) {
        dur = rnd(0.16, 0.28); var f0 = base * (i ? rnd(0.8, 1.25) : 0.85);
        o.frequency.setValueAtTime(f0 * 0.9, tt); o.frequency.exponentialRampToValueAtTime(f0 * 1.08, tt + dur * 0.4); o.frequency.setTargetAtTime(f0, tt + dur * 0.4, dur * 0.2);
        g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(amp * 0.8, tt + 0.03); g.gain.setValueAtTime(amp * 0.8, tt + dur - 0.04); g.gain.linearRampToValueAtTime(0, tt + dur);
        tt += dur + rnd(0.08, 0.18);
      }
    } else { // trill
      n = rint(8, 16); dur = rnd(0.022, 0.035);
      for (i = 0; i < n; i++) {
        o.frequency.setValueAtTime(base * (i % 2 ? 1.12 : 0.95), tt);
        g.gain.setValueAtTime(0, tt); g.gain.linearRampToValueAtTime(amp * (0.6 + 0.4 * Math.sin(Math.PI * i / n)), tt + 0.006); g.gain.linearRampToValueAtTime(0, tt + dur);
        tt += dur + 0.008;
      }
    }
    o.connect(g);
    if (x.far) { var lp = this.filter('lowpass', 3000); g.connect(lp); lp.connect(pn); nodes.push(lp); } else g.connect(pn);
    pn.connect(bed.mix); var w = this.gain(x.far ? 0.9 : 0.4, bed.wet); pn.connect(w); nodes.push(w);
    o.start(t); o.stop(tt + 0.05); cleanup(o, nodes); this.created++;
  };

  /* ---------------- transitions */
  E.swish = function (t, d, o) {
    this.shot({ t: t, d: d, n: o.n || 'pink', filt: [['bandpass', o.f, o.q || 1]], env: o.env || envPeak(o.peak || 0.4), db: o.db, pan: o.pan, wet: o.wet != null ? o.wet : 0.35 });
    if (o.grain) this.shot({ t: t, d: d, n: 'crackle', filt: [['highpass', 2500], ['bandpass', o.f[1] * 1.5, 0.8]], env: envFlutter(o.peak || 0.4), db: o.grain, pan: o.pan, wet: 0.2 });
  };
  E.rustle = function (t, d, o) {
    this.shot({ t: t, d: d, n: 'crackle', filt: [['highpass', o.hp || 2000], ['bandpass', [3200, 4500, 3000], 0.7]], env: envFlutter(o.peak || 0.45), db: o.db, pan: o.pan || [rnd(-0.3, 0), rnd(0, 0.3)], wet: 0.25 });
  };
  E.chime = function (t, midiLo, midiHi, dbv, o) {
    var S = this.scaleNotes(this.presetAt(t), midiLo, midiHi);
    this.bell(t, mtof(pick(S)), dbv, o);
  };

  var FX = {
    wp_fanye: function (e, t, d) {             // 翻页：纸面带风的一声 whoosh + 落下的一拍
      e.swish(t + d * 0.05, d * 0.7, { f: [500, 2200, 900], q: 0.8, peak: 0.55, db: -27, pan: [0.5, -0.5], grain: -38 });
      e.rustle(t, d * 0.4, { db: -40, hp: 2800 });
      e.shot({ t: t + d * 0.95, d: 0.18, n: 'brown', filt: [['lowpass', 500]], env: envHit(10), db: -26, wet: 0.2 });
      e.knock(t + d * 0.95, 210, -32, 0, 0.04, 0.15);
    },
    wp_yinzhang: function (e, t, d) {
      var th = t + 0.35 * d;
      e.swish(t, th - t + 0.05, { f: [300, 700, 500], q: 0.7, peak: 0.8, db: -38 });
      var lp = e.filter('lowpass', 700), out = e.gain(1, e.fxBus), w = e.gain(0.3, e.revIn); lp.connect(out); lp.connect(w);
      e.tone({ t: th, f: 110, f1: 46, glide: 0.18, a: 0.004, decay: 0.45, db: -16, dest: lp });
      e.shot({ t: th, d: 0.25, n: 'brown', filt: [['lowpass', 380]], env: envHit(9), db: -20 });
      e.rustle(th - 0.02, 0.22, { db: -40, hp: 2500 });
      var tidy = e.ctx.createConstantSource ? e.ctx.createConstantSource() : null; // disconnect the shared filter afterwards
      if (tidy) { tidy.start(th); tidy.stop(th + 1.5); cleanup(tidy, [tidy, lp, out, w]); }
    },

    /* ===== 增补（转场库）：纸张 / 版画四式的音效，不属于原作 ===== */
    sizhi: function (e, t, d) {             // 撕纸：起手一扯 + 纤维断裂的颗粒 + 纸片落下
      e.shot({ t: t, d: d * 0.55, n: 'crackle', filt: [['highpass', 1800], ['bandpass', [2400, 5200, 3000], 0.7]], env: envFlutter(0.25), db: -27, pan: [-0.5, 0.5], wet: 0.15 });
      e.shot({ t: t, d: d * 0.5, n: 'white', filt: [['bandpass', [1400, 3800, 1800], 1.2]], env: envPeak(0.2), db: -31, pan: [-0.4, 0.4], wet: 0.15 });
      e.rustle(t + d * 0.45, d * 0.45, { db: -38, hp: 2500, pan: [0.2, -0.1] });
      e.knock(t + d * 0.86, 260, -33, 0.1, 0.05, 0.2);
    },
    moxian: function (e, t, d) {            // 墨线描边：笔尖在纸上走的沙沙，几笔一顿
      var n = 5;
      for (var i = 0; i < n; i++) {
        var tt = t + d * 0.7 * i / n;
        e.shot({ t: tt, d: d * 0.16, n: 'crackle', filt: [['highpass', 3000], ['bandpass', [3800, 5200, 4200], 0.9]], env: envPeak(0.3), db: -33 - i, pan: [-0.3 + 0.15 * i, -0.2 + 0.15 * i], wet: 0.1 });
      }
      e.swish(t, d * 0.8, { f: [900, 1700, 1200], q: 0.9, peak: 0.45, db: -36, pan: [-0.3, 0.3], wet: 0.2 });
    },
    paixian: function (e, t, d) {           // 铜版排线：雕刀快速刮过，一排一下的颗粒节奏
      var n = 9;
      for (var i = 0; i < n; i++) {
        var tt = t + d * 0.75 * i / n;
        e.shot({ t: tt, d: 0.07, n: 'white', filt: [['highpass', 2500], ['bandpass', 5200 + 300 * (i % 3), 2.5]], env: envHit(7), db: -29 + (i % 2) * -3, pan: [-0.6 + 1.2 * i / n, -0.6 + 1.2 * i / n], wet: 0.1 });
      }
      e.shot({ t: t, d: d * 0.85, n: 'pink', filt: [['bandpass', [700, 1300, 900], 0.8]], env: envPeak(0.5), db: -33, pan: [-0.5, 0.5], wet: 0.25 });
    },
    fanye: function (e, t, d) {             // 翻页：纸面带风的一声 whoosh + 落下的一拍
      e.swish(t + d * 0.05, d * 0.7, { f: [500, 2200, 900], q: 0.8, peak: 0.55, db: -27, pan: [0.5, -0.5], grain: -38 });
      e.rustle(t, d * 0.4, { db: -40, hp: 2800 });
      e.shot({ t: t + d * 0.72, d: 0.18, n: 'brown', filt: [['lowpass', 500]], env: envHit(10), db: -26, wet: 0.2 });
      e.knock(t + d * 0.72, 210, -32, 0, 0.04, 0.15);
    },
    /* ===== 增补结束 ===== */
    // 水墨 ink family: brush swish / paper rustle / soft wooden knock
    moran: function (e, t, d) {
      e.knock(t, 240, -27, -0.2, 0.07);
      e.swish(t + d * 0.08, d * 0.85, { f: [700, 1600, 1000], q: 1.1, peak: 0.4, db: -27, pan: [-0.35, 0.3] });
      e.rustle(t + d * 0.25, d * 0.65, { db: -40 });
    },
    feibai: function (e, t, d) {
      e.swish(t, d * 0.6, { f: [1400, 3200, 2000], q: 0.9, peak: 0.3, db: -27, pan: [0.4, -0.4], grain: -37 });
      e.rustle(t + d * 0.1, d * 0.5, { db: -38, hp: 3000 });
      e.knock(t + d * 0.7, 300, -29, 0.2, 0.05);
    },
    juanzhou: function (e, t, d) {
      e.knock(t, 190, -24, -0.5, 0.08); e.knock(t + 0.11, 230, -30, -0.45, 0.06);
      e.rustle(t + 0.05, d * 0.9, { db: -34, hp: 1600, pan: [-0.6, 0.6], peak: 0.5 });
      e.swish(t + 0.1, d * 0.85, { f: [500, 900, 700], q: 0.7, peak: 0.5, db: -30, pan: [-0.6, 0.6] });
      e.knock(t + d * 0.92, 200, -27, 0.55, 0.08);
    },
    cengluan: function (e, t, d) {
      [[0, 600, -0.5], [0.22, 1000, 0], [0.44, 1500, 0.5]].forEach(function (L) {
        e.swish(t + d * L[0], d * 0.55, { f: [L[1] * 0.7, L[1] * 1.4, L[1]], q: 1, peak: 0.4, db: -30, pan: [L[2] - 0.2, L[2] + 0.2] });
      });
      e.rustle(t + d * 0.3, d * 0.5, { db: -38 });
      e.knock(t + d * 0.85, 170, -28, 0, 0.09);
    },
    kongmeng: function (e, t, d) {
      e.swish(t, d, { f: [500, 1000, 650], q: 0.6, peak: 0.5, db: -31, pan: [-0.5, 0.5], wet: 0.9 });
      e.rustle(t + d * 0.3, d * 0.5, { db: -41 });
      e.knock(t + d * 0.6, 280, -34, 0.3, 0.06, 1.0);
    },
    // nature family
    yunhai: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'pink', filt: [['bandpass', [300, 1800, 700], 0.6]], env: envPeak(0.55), db: -27, pan: [-0.4, 0.4], wet: 0.7 });
      e.shot({ t: t + d * 0.1, d: d * 0.8, n: 'white', filt: [['highpass', 5000]], env: envPeak(0.5), db: -40, pan: [0.4, -0.4], wet: 0.5 });
    },
    lianyi: function (e, t, d) {
      e.drop(t + 0.05, rnd(1100, 1400), -17, 0, null, 0.6);
      e.chime(t + 0.09, 79, 91, -26, { parts: [[1, 1, 1], [2.0, 0.2, 0.5], [3.01, 0.06, 0.3]], decay: 3, pan: 0, wet: 1.2 });
      e.drop(t + 0.05 + d * 0.38, rnd(1500, 1900), -29, rnd(-0.4, 0.4), null, 0.8);
      e.shot({ t: t + 0.1, d: d * 0.9, n: 'pink', filt: [['bandpass', [400, 300], 2]], env: envPeak(0.2), db: -35, wet: 0.5 });
    },
    liushui: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'pink', filt: [['bandpass', [500, 900, 600], 1.5]], fast: 1000, env: envPeak(0.45), db: -27, pan: [-0.5, 0.5], wet: 0.3 });
      e.shot({ t: t, d: d, n: 'brown', filt: [['lowpass', [300, 900, 400]]], env: envPeak(0.5), db: -29, pan: [-0.3, 0.3], wet: 0.2 });
    },
    jinhui: function (e, t, d) {
      var S = e.scaleNotes(e.presetAt(t), 76, 93), n = Math.min(6, S.length);
      for (var i = 0; i < n; i++) {
        var m = S[Math.floor(Math.random() * S.length)], tt = t + d * 0.6 * i / n;
        e.tone({ t: tt, f: mtof(m), a: Math.max(0.05, d * 0.25), decay: rnd(2, 3.2), db: -30 - rnd(0, 4), pan: rnd(-0.6, 0.6), wet: 1 });
      }
      e.shot({ t: t, d: d, n: 'white', filt: [['bandpass', [5000, 8000, 6000], 1.2]], env: envPeak(0.5), db: -36, wet: 0.8 });
    },
    yufeng: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'white', filt: [['bandpass', [450, 1800, 500], 1.4]], env: envPeak(0.5), db: -30, pan: [-0.9, 0.9], wet: 0.3 });
      // doppler whistle: pitch falls as it passes
      e.shot({ t: t, d: d, n: 'white', filt: [['bandpass', [1500, 1440, 1180, 1100], 14]], env: envPeak(0.5), db: -36, pan: [-0.9, 0.9], wet: 0.3 });
    },
    fengsha: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'white', filt: [['highpass', 1200], ['bandpass', [800, 2500, 1200], 0.8]], env: envPeak(0.35), db: -31, pan: [0.6, -0.6], wet: 0.25 });
      e.shot({ t: t + d * 0.05, d: d * 0.9, n: 'crackle', filt: [['highpass', 3500]], env: envFlutter(0.4), db: -41, pan: [0.5, -0.5], wet: 0.2 });
    },
    yeyu: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'rain', filt: [['highpass', 600]], env: envPeak(0.25), db: -30, wet: 0.3 });
      e.shot({ t: t, d: d, n: 'white', filt: [['bandpass', 6000, 0.6]], env: envPeak(0.3), db: -36, wet: 0.3 });
      for (var i = 0; i < 5; i++) e.drop(t + rnd(0.05, d * 0.7), rnd(900, 2600), -32 + rnd(-5, 0), rnd(-0.7, 0.7), null, 0.3);
    },
    feixue: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'white', filt: [['bandpass', [700, 1500, 1100], 7]], env: envPeak(0.45), db: -28, pan: [-0.6, 0.5], wet: 0.4 });
      e.shot({ t: t, d: d, n: 'white', filt: [['highpass', 5000]], env: envPeak(0.4), db: -38, pan: [0.5, -0.5], wet: 0.4 });
    },
    xinghe: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'brown', filt: [['lowpass', [150, 280, 150]]], env: envPeak(0.5), db: -26, wet: 0.4 });
      var f = mtof(e.presetAt(t).tonic - 24);
      e.tone({ t: t, f: f, a: d * 0.45, decay: d * 0.6, db: -31, wet: 0.5 });
      var n = rint(3, 5);
      for (var i = 0; i < n; i++) e.chime(t + rnd(0.15, d * 0.9), 86, 100, -36 - rnd(0, 5), { decay: rnd(2, 3.5), wet: 1.2 });
    },
    louchuang: function (e, t, d) {
      e.playBuf(e.creakBuf(clamp(d * 0.45, 0.4, 1.4)), t + d * 0.1, -27, rnd(-0.4, 0.4), 0.3);
      e.shot({ t: t, d: d, n: 'pink', filt: [['lowpass', [800, 1600, 900]]], env: envPeak(0.5), db: -30, pan: [-0.3, 0.3], wet: 0.4 });
    },
    zheshan: function (e, t, d) {
      var n = rint(11, 15), span = Math.min(d * 0.55, 1.4);
      for (var i = 0; i < n; i++) {
        var x = i / (n - 1), tt = t + 0.04 + span * Math.pow(x, 0.85) + rnd(-0.006, 0.006);
        e.knock(tt, 1700 + 900 * x + rnd(-80, 80), -26 + rnd(-3, 1), -0.45 + 0.9 * x, 0.012, 0.2);
      }
      e.swish(t, Math.max(0.3, span * 1.3), { f: [900, 2200, 1400], q: 0.8, peak: 0.6, db: -30, pan: [-0.4, 0.4] });
    },
    yinzhang: function (e, t, d) {
      var th = t + Math.min(0.35 * d, 0.9);
      e.swish(t, th - t + 0.05, { f: [300, 700, 500], q: 0.7, peak: 0.8, db: -38 });
      var lp = e.filter('lowpass', 700), out = e.gain(1, e.fxBus), w = e.gain(0.3, e.revIn); lp.connect(out); lp.connect(w);
      e.tone({ t: th, f: 110, f1: 46, glide: 0.18, a: 0.004, decay: 0.45, db: -16, dest: lp });
      e.shot({ t: th, d: 0.25, n: 'brown', filt: [['lowpass', 380]], env: envHit(9), db: -20 });
      e.rustle(th - 0.02, 0.22, { db: -40, hp: 2500 });
      var tidy = e.ctx.createConstantSource ? e.ctx.createConstantSource() : null; // disconnect the shared filter afterwards
      if (tidy) { tidy.start(th); tidy.stop(th + 1.5); cleanup(tidy, [tidy, lp, out, w]); }
    },
    shuaijing: function (e, t, d) {
      var dd = clamp(d * 0.6, 0.35, 1.2);
      e.shot({ t: t + 0.03, d: dd, n: 'pink', filt: [['bandpass', [400, 3500, 1500], 0.8]], env: envPeak(0.55), db: -25, pan: [-0.8, 0.8], wet: 0.25 });
    },
    yijiao: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'pink', filt: [['bandpass', [800, 1000, 850], 1.3]], env: envPeak(0.45), db: -31, wet: 0.35 });
      e.shot({ t: t, d: d, n: 'pink', filt: [['bandpass', [2200, 2600, 2300], 2]], env: envPeak(0.45), db: -38, wet: 0.35 });
    },
    yunying: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'pink', filt: [['lowpass', [400, 1100, 500]]], env: envPeak(0.5), db: -29, pan: [0.3, -0.3], wet: 0.5 });
    },
    _generic: function (e, t, d) {
      e.shot({ t: t, d: d, n: 'pink', filt: [['bandpass', [500, 1200, 700], 0.7]], env: envPeak(0.5), db: -29, pan: [-0.3, 0.3], wet: 0.5 });
    }
  };
  FX.wp_paixian = FX.paixian;
  FX.wp_moran = FX.moran;
  FX.wp_feibai = FX.feibai;
  FX.wp_sizhi = FX.sizhi;
  FX.wp_fengsha = FX.fengsha;
  FX.wp_shuaijing = FX.shuaijing;
  E.transition = function (id, t, dur) {
    var d = clamp(+dur || 1.5, 0.3, 10), fn = FX[id] || FX._generic;
    try { fn(this, t, d); } catch (err) { warn('transition ' + id, err); }
  };

  E.fadeMaster = function (v, dur) {
    var g = this.master.gain, t = this.ctx.currentTime;
    hold(g, t); g.linearRampToValueAtTime(v * MASTER, t + dur);
  };

  /* ------------------------------------------------------------ live wrapper */
  var ctx = null, eng = null, isOn = false, cur = null, timer = null, suspT = null, hiddenSusp = false;
  var LOOK = 1.5;
  function tick() { if (eng && ctx.state === 'running') eng.pump(ctx.currentTime + LOOK, ctx.currentTime); }
  function ensureTimer() { if (!timer) timer = setInterval(tick, 200); }
  // generate remaining noise/control buffers in idle slices so later scene changes never hitch
  function prewarm() {
    var todo = ['pink', 'white', 'brown', 'rain', 'crackle', 'c:slow', 'c:gust', 'c:fast'];
    (function next() {
      if (!eng || !todo.length) return;
      var k = todo.shift();
      try { if (k.indexOf('c:') === 0) eng.ctrl(k.slice(2)); else eng.noise(k); } catch (e) {}
      setTimeout(next, 250);
    })();
  }
  function killTimer() { if (timer) { clearInterval(timer); timer = null; } }

  var API = {
    start: function () {
      isOn = true;
      try {
        if (!ctx) {
          var AC = global.AudioContext || global.webkitAudioContext;
          if (!AC) return Promise.resolve();
          ctx = new AC({ latencyHint: 'balanced' });
          eng = new Engine(ctx);
          eng.startMusic(ctx.currentTime);
          setTimeout(prewarm, 1500);
        }
        if (!eng.bed || eng.bed.id !== (cur || '_default')) eng.setScene(cur || '_default', ctx.currentTime + 0.02, eng.bed ? 1.0 : 0.05);
      } catch (err) { warn('start', err); return Promise.resolve(); }
      clearTimeout(suspT);
      if (typeof document !== 'undefined' && document.hidden) return Promise.resolve(); // resumes on visibility
      return ctx.resume().catch(function () {}).then(function () {
        if (!isOn) return;
        eng.fadeMaster(1, 2.5); ensureTimer(); tick();
      });
    },
    stop: function () {
      isOn = false;
      if (!ctx) return;
      eng.fadeMaster(0, 1.2);
      clearTimeout(suspT);
      suspT = setTimeout(function () { if (!isOn) { killTimer(); ctx.suspend().catch(function () {}); } }, 1300);
    },
    get on() { return isOn; },
    scene: function (id) {
      cur = String(id || '_default');
      if (eng && isOn && ctx.state === 'running') { try { eng.setScene(cur, ctx.currentTime + 0.03, 3); } catch (e) { warn('scene', e); } }
    },
    transition: function (id, duration) {
      if (!eng || !isOn || ctx.state !== 'running') return;
      try { eng.transition(String(id), ctx.currentTime + 0.02, duration); tick(); } catch (e) { warn('transition', e); }
    },

    /* hidden test hooks */
    _renderOffline: function (sceneId, transitionId, seconds, opts) {
      opts = opts || {}; seconds = seconds || 20;
      var sr = opts.sampleRate || 48000, OAC = global.OfflineAudioContext || global.webkitOfflineAudioContext;
      var oc = new OAC(2, Math.ceil(sr * seconds), sr), e = new Engine(oc, { raw: !!opts.raw });
      e.master.gain.value = opts.probe != null ? 1 : MASTER;
      if (opts.probe != null) { // test: steady sine at a known level through the master chain
        var po = oc.createOscillator(), pg = oc.createGain(); po.frequency.value = 440; pg.gain.value = dbl(opts.probe) * Math.SQRT2;
        po.connect(pg); pg.connect(e.master); po.start(0); return oc.startRendering();
      }
      e.startMusic(0);
      e.setScene(sceneId, 0, 0.3);
      if (opts.solo === 'music') { e.bedBus.gain.value = 0; e.fxBus.gain.value = 0; }
      if (opts.solo === 'fx') { e.bedBus.gain.value = 0; e.qinOut.gain.value = 0; }
      if (opts.solo === 'bed') { e.qinOut.gain.value = 0; e.fxBus.gain.value = 0; }
      if (transitionId) e.transition(transitionId, opts.transAt != null ? opts.transAt : 8, opts.transDur || 2.4);
      if (opts.nextScene) e.setScene(opts.nextScene, opts.nextAt || 12, 3);
      e.pump(seconds);
      API._lastOffline = { created: e.created, bedNodes: e.beds.map(function (b) { return b.nodes.length; }) };
      return oc.startRendering();
    },
    _Engine: Engine,
    _scenes: Object.keys(SCENES),
    _transitions: Object.keys(FX),
    _debug: function () {
      return { state: ctx && ctx.state, beds: eng ? eng.beds.length : 0, streams: eng ? eng.streams.length : 0,
        bedNodes: eng ? eng.beds.map(function (b) { return b.nodes.length; }) : [], created: eng ? eng.created : 0 };
    }
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', function () {
      if (!ctx || !isOn) return;
      if (document.hidden) {
        eng.fadeMaster(0, 0.25); hiddenSusp = true; clearTimeout(suspT);
        suspT = setTimeout(function () { if (document.hidden) ctx.suspend().catch(function () {}); }, 320);
      } else {
        clearTimeout(suspT);
        ctx.resume().catch(function () {}).then(function () {
          if (!isOn) return;
          var want = cur || '_default';
          if (!eng.bed || eng.bed.id !== want) eng.setScene(want, ctx.currentTime + 0.02, 1.0);
          if (hiddenSusp || eng.master.gain.value < MASTER * 0.99) eng.fadeMaster(1, 1.2);
          hiddenSusp = false; ensureTimer(); tick();
        });
      }
    });
  }

  global.ShanheAudio = API;
})(typeof window !== 'undefined' ? window : this);

/* ===== 增补（转场库）：确定性离线渲染 =====
 * ShanheAudio.renderTransition(id, { dur, seed, pre, tail, sampleRate }) → Promise<AudioBuffer>
 *   id    转场 id（原作 20 式 + sizhi/moxian/paixian/fanye；未知 id 用通用 whoosh）
 *   dur   转场时长（秒），和画面一致
 *   pre   音效开始前的留白（秒，默认 0.05）；tail 结尾留给混响尾巴（默认 2.5）
 *   seed  固定种子（默认 1）。原作用 Math.random，这里在建图期间临时换成种子随机数，所以同参数同波形
 * 经过原作的总线（高通 30 Hz → 压缩 → 限制 → -2 dB），环境音和古琴都不出声。
 * ShanheAudio.toWav(buffer) → ArrayBuffer（16-bit PCM WAV）
 */
(function (A) {
  if (!A) return;
  function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  A.renderTransition = function (id, o) {
    o = o || {};
    var sr = o.sampleRate || 48000, dur = o.dur || 2.4, pre = o.pre != null ? o.pre : 0.05, tail = o.tail != null ? o.tail : 2.5;
    var OAC = (typeof OfflineAudioContext !== 'undefined') ? OfflineAudioContext : webkitOfflineAudioContext;
    var oc = new OAC(2, Math.ceil(sr * (pre + dur + tail)), sr);
    var R = Math.random; Math.random = mulberry32((o.seed == null ? 1 : o.seed) * 2654435761 >>> 0);
    try {
      var e = new A._Engine(oc);
      e.master.gain.value = Math.pow(10, -6 / 20);
      e.bedBus.gain.value = 0; e.musicBus.gain.value = 0;
      e.transition(String(id), pre, dur);
    } finally { Math.random = R; }
    return oc.startRendering();
  };
  A.toWav = function (b) {
    var n = b.length, ch = b.numberOfChannels, buf = new ArrayBuffer(44 + n * ch * 2), v = new DataView(buf), p = 0;
    function s(x) { for (var i = 0; i < x.length; i++) v.setUint8(p++, x.charCodeAt(i)); }
    s('RIFF'); v.setUint32(p, 36 + n * ch * 2, true); p += 4; s('WAVEfmt '); v.setUint32(p, 16, true); p += 4;
    v.setUint16(p, 1, true); p += 2; v.setUint16(p, ch, true); p += 2; v.setUint32(p, b.sampleRate, true); p += 4;
    v.setUint32(p, b.sampleRate * ch * 2, true); p += 4; v.setUint16(p, ch * 2, true); p += 2; v.setUint16(p, 16, true); p += 2;
    s('data'); v.setUint32(p, n * ch * 2, true); p += 4;
    var d = []; for (var c = 0; c < ch; c++) d.push(b.getChannelData(c));
    for (var i = 0; i < n; i++) for (c = 0; c < ch; c++) { var x = Math.max(-1, Math.min(1, d[c][i])); v.setInt16(p, x < 0 ? x * 32768 : x * 32767, true); p += 2; }
    return buf;
  };
})(typeof window !== 'undefined' ? window.ShanheAudio : this.ShanheAudio);
