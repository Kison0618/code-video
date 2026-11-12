/* 查成分 —— 纯前端：出题、计分、出报告、画分享图。不发任何请求，不收集任何信息。 */
(() => {
  'use strict';
  const S = window.STRENGTHS, V = window.VIRTUES, T = window.TENSIONS, SOFT = window.SOFT;
  const IDX = Object.fromEntries(S.map((s, i) => [s.key, i]));
  const ITEM = Object.fromEntries(window.ITEMS.map(i => [i[0], i]));
  const app = document.getElementById('app'), toastEl = document.getElementById('toast'), sheet = document.getElementById('sheet');
  const KEY = 'chengfen.v1';
  const MODES = {
    48: { name: '简版', min: 4 },   // 旧链接兼容，入口已不提供
    96: { name: '简版', min: 8 },
    213: { name: '完整版', min: 18 }
  };
  // IPIP 标准五级：Very Inaccurate … Very Accurate
  const OPTS = [['非常不符合', 30], ['不太符合', 22], ['中间', 15], ['比较符合', 22], ['非常符合', 30]];

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const store = {
    get() { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { return {}; } },
    set(o) { try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  };
  function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  let toastT;
  function toast(msg, ms = 2400) { toastEl.textContent = msg; toastEl.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove('show'), ms); }
  function img(key, cls = '') { return `<img class="${cls}" src="img/${key}.webp" alt="" loading="lazy" onerror="this.remove()">`; }

  /* ---------- 出题 ---------- */
  function buildOrder(mode, seed) {
    let ids = [];
    if (mode === 213) ids = window.ITEMS.map(i => i[0]);
    else S.forEach(s => ids.push(...s.short.slice(0, mode / 24)));
    const r = rng(seed);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    // 同一种成分的题尽量不挨着
    for (let i = 1; i < ids.length; i++) {
      if (ITEM[ids[i]][1] !== ITEM[ids[i - 1]][1]) continue;
      for (let j = i + 1; j < ids.length; j++) {
        if (ITEM[ids[j]][1] !== ITEM[ids[i - 1]][1] && (j + 1 >= ids.length || ITEM[ids[j + 1]][1] !== ITEM[ids[i]][1])) { [ids[i], ids[j]] = [ids[j], ids[i]]; break; }
      }
    }
    return ids;
  }

  /* ---------- 计分 ----------
     每题 1–5，反向题 6−x；分量表取题均分，换算成 0–1295 的“含量”（两位 36 进制，方便放进链接）。 */
  function score(order, ans) {
    const sum = S.map(() => 0), n = S.map(() => 0);
    order.forEach(id => { const a = ans[id]; if (!a) return; const it = ITEM[id], k = IDX[it[1]]; sum[k] += it[2] === 1 ? a : 6 - a; n[k]++; });
    return S.map((_, k) => n[k] ? Math.round((sum[k] / n[k] - 1) / 4 * 1295) : 648);
  }
  const encode = (q, mode) => q.map(v => v.toString(36).padStart(2, '0')).join('') + '-' + mode;
  function decode(str) {
    const m = /^([0-9a-z]{48})-(48|96|213)$/.exec(str || ''); if (!m) return null;
    const q = []; for (let i = 0; i < 48; i += 2) { const v = parseInt(m[1].slice(i, i + 2), 36); if (!(v >= 0 && v <= 1295)) return null; q.push(v); }
    return { q, mode: +m[2] };
  }
  function analyse(q, mode) {
    const code = encode(q, mode), h = hash(code), r = rng(h);
    const tie = S.map(() => r());            // 同分时的顺序由结果本身决定，固定且不偏向谁
    const rank = S.map((s, i) => ({ s, i, q: q[i], pct: Math.round(q[i] / 1295 * 100) })).sort((a, b) => b.q - a.q || tie[a.i] - tie[b.i]);
    const top = rank.slice(0, 5), low = rank.slice(-5).reverse();
    // 称号里的修饰语取最低的一项；灵性在中文语境里几乎人人垫底，跳过它，不然人人都是“不信邪的”
    const lowName = low.find(x => x.s.key !== 'spirituality') || low[0];
    const hits = [];
    top.forEach((a, ai) => low.forEach((b, bi) => { const t = T[a.s.key + '|' + b.s.key]; if (t) hits.push({ a, b, t, w: ai + bi }); }));
    hits.sort((x, y) => x.w - y.w);
    const serial = 'CF' + String(h % 1e8).padStart(8, '0');
    return { q, mode, code, rank, top, low, lowName, hits: hits.slice(0, 3), serial, h };
  }

  /* ---------- 首页 ---------- */
  function home() {
    const st = store.get(), prog = st.quiz;
    app.innerHTML = `
    <section class="home">
      <header class="hd"><b>查成分</b><span>性格优势测试</span></header>
      <h1>你是什么做的？</h1>
      <p class="lede">一份 213 题的性格优势测试。测出 24 项性格优势在你身上的排序：哪些最多，哪些最少。</p>
      <div class="spec">
        <p class="cap"><span>6 类 · 24 项</span><span>点一项看说明</span></p>
        ${Object.keys(V).map(k => `<div class="vrow" style="--c:${V[k].color}"><span class="vn">${V[k].zh}</span><div>${S.filter(s => s.v === k).map(s => `<button data-dex="${s.key}">${s.zh}</button>`).join('')}</div></div>`).join('')}
      </div>
      <div class="dock">
        ${prog && prog.i < prog.order.length ? `<button class="cta" data-act="resume"><span>接着测<small>上次到第 ${prog.i} / ${prog.order.length} 题</small></span><span class="go">→</span></button>
          <button class="alt" data-mode="213">重新开始</button>`
        : `<button class="cta" data-mode="213"><span>开始测试<small>213 题 · 约 18 分钟</small></span><span class="go">→</span></button>
          <button class="alt" data-mode="96">时间不够？先做 96 题简版（约 8 分钟）</button>`}
        ${st.last ? `<button class="alt" data-act="last">查看我上次的结果</button>` : ''}
      </div>
      <p class="src">题目为 IPIP-VIA 公开量表（International Personality Item Pool）的全部 213 题，中文为本站翻译；24 项分类出自 Peterson 与 Seligman（2004）。非 VIA Institute 官方测评，仅供娱乐。答案只在你的设备上计算。</p>
    </section>`;
    window.scrollTo(0, 0);
  }

  function dex(key) {
    const s = S[IDX[key]], v = V[s.v];
    openSheet(`<button class="close" data-act="close" aria-label="关闭">×</button>
      <p class="mono" style="color:${v.color}">${v.zh}</p><h3>${esc(s.full)}</h3>
      <p class="sdef">${s.def}</p>
      <div class="duo"><div><span class="mono">含量最高时</span><b>${s.noun}</b>${s.hiOne}</div><div><span class="mono">几乎不含时</span><b>${s.mod}…</b>${s.loOne}</div></div>`);
  }
  function openSheet(html) { sheet.innerHTML = `<div class="box">${html}</div>`; sheet.hidden = false; document.body.style.overflow = 'hidden'; }
  function closeSheet() { sheet.hidden = true; sheet.innerHTML = ''; document.body.style.overflow = ''; }

  /* ---------- 答题 ---------- */
  let Q = null, lock = false, lastT = 0, fast = 0, same = 0, nag = {};
  function start(mode) {
    Q = { mode, seed: Date.now() % 2147483647, ans: {}, i: 0 };
    Q.order = buildOrder(mode, Q.seed); save(); nag = {}; quiz();
  }
  function save() { const st = store.get(); st.quiz = Q; store.set(st); }
  function quiz() {
    app.innerHTML = `<section class="quiz">
      <div class="qtop"><span class="cnt num"><span id="qi"></span><small> / ${Q.order.length}</small></span><button data-act="quit">保存并退出</button></div>
      <div class="bar"><i id="qbar"></i></div>
      <div class="qcard" id="qcard"><div class="tag mono"><span>这句话在多大程度上符合你</span><button data-act="en" class="mono" id="enbtn">英文原题</button></div>
        <p class="qtext" id="qtext"></p><p class="qen" id="qen" hidden></p></div>
      <div class="opts" role="radiogroup" aria-label="符合程度">${OPTS.map((o, k) => `<button class="opt" role="radio" data-a="${k + 1}" aria-label="${o[0]}" style="--d:${o[1]}px"><i></i></button>`).join('')}</div>
      <div class="ends"><span>非常不符合</span><span id="picked"></span><span>非常符合</span></div>
      <div class="qfoot"><button data-act="prev" id="prev">← 上一题</button><span>电脑上可按数字键 1–5</span></div>
    </section>`;
    paint(); window.scrollTo(0, 0);
  }
  function paint() {
    const id = Q.order[Q.i], it = ITEM[id], card = document.getElementById('qcard');
    document.getElementById('qi').textContent = String(Q.i + 1).padStart(String(Q.order.length).length, '0');
    document.getElementById('qbar').style.width = (Q.i / Q.order.length * 100) + '%';
    document.getElementById('qtext').textContent = it[3];
    document.getElementById('qen').textContent = it[4];
    document.getElementById('picked').textContent = Q.ans[id] ? OPTS[Q.ans[id] - 1][0] : '';
    document.getElementById('prev').disabled = Q.i === 0;
    app.querySelectorAll('.opt').forEach(b => { const on = +b.dataset.a === Q.ans[id]; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
    card.classList.remove('swap'); void card.offsetWidth; card.classList.add('swap');
    lastT = performance.now(); lock = false;
  }
  function answer(a) {
    if (lock || !Q) return; lock = true;
    const id = Q.order[Q.i], prev = Q.ans[Q.order[Q.i - 1]];
    Q.ans[id] = a;
    app.querySelectorAll('.opt').forEach(b => b.classList.toggle('on', +b.dataset.a === a));
    document.getElementById('picked').textContent = OPTS[a - 1][0];
    fast = performance.now() - lastT < 750 ? fast + 1 : 0; same = prev === a ? same + 1 : 0;
    const n = Q.order.length, done = Q.i + 1;
    if (same >= 11 && !nag.same) { nag.same = 1; toast('连续多题选了同一项，按实际情况选就好。'); }
    else if (done === Math.round(n / 2)) toast('已完成一半');
    else if (done === n - 20 && n > 60) toast('还剩 20 题');
    setTimeout(() => {
      if (done >= n) { Q.i = n; save(); finish(); return; }
      Q.i = done; save(); paint();
    }, 190);
  }
  function finish() {
    const q = score(Q.order, Q.ans), R = analyse(q, Q.mode);
    const st = store.get(); st.last = R.code; delete st.quiz; store.set(st); Q = null;
    printing(R);
  }
  function printing(R) {
    const lines = [`${R.mode} 题作答已记录`, '反向题换算 · 24 个分量表计分', '按题均分排序', `最高：${R.top[0].s.full}`, `最低：${R.low[0].s.full}`, '生成结果…'];
    app.innerHTML = `<section class="printing"><p class="mono">${R.serial}</p><h2>正在计分</h2><div class="log" id="log"></div><p class="fine">点任意位置跳过</p></section>`;
    const log = document.getElementById('log'); let k = 0, done = false;
    const go = () => { if (done) return; done = true; clearInterval(t); history.replaceState(null, '', '#r=' + R.code); report(R, true); };
    const t = setInterval(() => {
      if (k >= lines.length) { go(); return; }
      log.querySelectorAll('.cur').forEach(e => e.classList.remove('cur'));
      const p = document.createElement('p'); p.className = 'cur'; p.textContent = lines[k++]; log.appendChild(p);
    }, 430);
    app.firstElementChild.addEventListener('click', go);
  }

  /* ---------- 报告 ---------- */
  function caughtList(R) {
    const [a, b, c] = R.top, l1 = R.lowName, l2 = R.low.find(x => x !== l1);
    return [[a, a.s.hi[0]], [a, a.s.hi[1]], [l1, l1.s.lo[0]], [b, b.s.hi[0]], [a, a.s.hi[2]], [l1, l1.s.lo[1]], [c, c.s.hi[0]], [l2, l2.s.lo[0]]];
  }
  function report(R, fresh) {
    const top = R.top[0], lo = R.lowName, v = V[top.s.v];
    const mine = store.get().last === R.code;
    const d = new Date(), date = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    const partner = S[lo.i];
    const bars = (() => { const r = rng(R.h); let h = ''; for (let i = 0; i < 46; i++) h += `<i style="width:${1 + Math.floor(r() * 4)}px;margin-right:${1 + Math.floor(r() * 4)}px"></i>`; return h; })();
    const mid = R.rank.slice(5, 19);
    app.innerHTML = `
    ${mine ? '' : `<div class="theirs"><span>这是别人的成分表。</span><button data-act="home">我也查一个 →</button></div>`}
    <article class="label report" ${fresh ? '' : 'style="animation:none"'}>
      <div class="strip mono"><span>查成分 · 测试结果</span><span>${MODES[R.mode].name} ${R.mode} 题 · ${date}</span></div>
      <div class="rhero" style="--c:${v.color}">
        <div class="rimg"><div class="ph">${esc(top.s.zh[0])}</div>${img(top.s.key)}
          <span class="chip"><i></i>最高：${top.s.full} ${top.pct}%</span></div>
        <div class="rname"><span class="k mono">你的结果</span>
          <h1><span class="m">${lo.s.mod}</span><span class="n ${top.s.noun.length > 4 ? 'long' : ''}">${top.s.noun}</span></h1></div>
        <p class="verdict"><b>${top.s.hiOne}</b><br><span>${lo.s.loOne}</span></p>
      </div>
      <hr class="rule">
      <div class="pad">
        <div class="sec-h"><h2>被看穿的小事</h2><span>中了就点一下</span></div>
        <ul class="caught">${caughtList(R).map(([x, t]) => `<li><span class="box">✓</span><span>${t}<small>${x.q >= 648 ? '因为' : '因为缺'}「${x.s.zh}」${x.pct}%</small></span></li>`).join('')}</ul>
        <div class="hit"><span id="hitmsg">点一点，看看说中几条。</span><span class="num"><span id="hitn">0</span>/8</span></div>
      </div>

      <hr class="rule fat">
      <div class="pad">
        <div class="sec-h"><h2>最高的五项</h2><span>标志性优势</span></div>
        <ol class="top">${R.top.map((x, i) => `<li style="--c:${V[x.s.v].color}"><span class="rk num">${i + 1}</span><h3>${x.s.zh}<small>${V[x.s.v].zh} · ${x.s.full}</small></h3><span class="pct num">${x.pct}<small>%</small></span>
          <p>${x.s.hiOne}</p><p class="def">${x.s.def}</p><div class="meter"><i style="--w:${x.pct}%"></i></div></li>`).join('')}</ol>
      </div>
      <hr class="rule">
      <div class="pad">
        <div class="sec-h"><h2>最低的五项</h2><span>从最低的排起</span></div>
        <ol class="top low">${R.low.map((x, i) => `<li><span class="rk num">${24 - i}</span><h3>${x.s.zh}<small>${V[x.s.v].zh} · ${x.s.full}</small></h3><span class="pct num">${x.pct}<small>%</small></span>
          <p>${x.s.loOne}</p><div class="meter"><i style="--w:${x.pct}%"></i></div></li>`).join('')}</ol>
        <p class="fine" style="margin-top:10px">排序只在你自己的 24 项之间比较，靠后不代表比别人差。灵性一项在不信教的人里普遍靠后。</p>
      </div>

      <hr class="rule fat">
      <div class="pad">
        <div class="sec-h"><h2>强弱组合</h2><span>最高的 × 最低的</span></div>
        ${R.hits.length ? R.hits.map(h => `<div class="hidden-card"><span class="mono">你的组合</span><h3>${h.t[0]}</h3><p>${h.t[1]}</p><div class="x"><span class="up">${h.a.s.zh} ${h.a.pct}% ↑</span><span>${h.b.s.zh} ${h.b.pct}% ↓</span></div></div>`).join('')
          : `<div class="hidden-card"><span class="mono">你的组合</span><h3>${lo.s.mod}${top.s.noun}</h3><p>${top.s.hi[0]}${lo.s.lo[0]}这两件事发生在同一个人身上，就是你。</p><div class="x"><span class="up">${top.s.zh} ${top.pct}% ↑</span><span>${lo.s.zh} ${lo.pct}% ↓</span></div></div>`}
      </div>

      <hr class="rule">
      <div class="pad">
        <div class="sec-h"><h2>六个方面</h2><span>六大类各自的高低</span></div>
        ${window.ASPECTS.map(a => {
          const g = R.rank.filter(x => x.s.v === a.v), up = g[0], dn = g[g.length - 1], avg = Math.round(g.reduce((s, x) => s + x.pct, 0) / g.length);
          return `<div class="aspect" style="--c:${V[a.v].color}"><div class="seal">${V[a.v].tag}</div><div>
            <h3><span>${a.q} · ${V[a.v].zh}</span><span class="num">${avg}%</span></h3>
            <div class="meter"><i style="--w:${avg}%"></i></div>
            <p><b>${up.s.zh} ${up.pct}%</b>　${up.pct >= 50 ? up.s.hiOne : '这一类里最高的也不算多。'}</p>
            <p class="dn"><b>${dn.s.zh} ${dn.pct}%</b>　${dn.pct < 62 ? dn.s.loOne : '这一类里最少的也不算少。'}</p></div></div>`;
        }).join('')}
      </div>

      <hr class="rule fat">
      <div class="pad back">
        <div class="sec-h"><h2>写给你</h2><span>推测，不一定对</span></div>
        <blockquote><cite>关于你的「${top.s.zh}」</cite>${SOFT[top.s.key].hi}</blockquote>
        <blockquote><cite>关于你缺的「${lo.s.zh}」</cite>${SOFT[lo.s.key].lo}</blockquote>
      </div>

      <hr class="rule fat">
      <div class="pad table">
        <div class="sec-h"><h2>24 项完整结果</h2><span>${MODES[R.mode].name} · ${R.mode} 题</span></div>
        ${Object.keys(V).map(k => `<div class="grp" style="--c:${V[k].color}"><span><i></i>${V[k].zh}</span></div>` + R.rank.filter(x => x.s.v === k).map(x => {
          const pos = R.rank.indexOf(x); return `<div class="row" style="--c:${V[k].color}"><b>${x.s.zh}${pos < 5 ? '<sup>TOP</sup>' : ''}</b><div class="meter"><i style="--w:${x.pct}%"></i></div><span class="num">${x.pct}%</span></div>`;
        }).join('')).join('')}
      </div>

      <hr class="rule">
      <div class="pad fine"><p>非官方娱乐测试，基于公共领域的 IPIP-VIA 题库，不是 VIA Institute 的官方测评，不能用于诊断。百分比是你自己各项题均分的换算，只能自己跟自己比。</p></div>
    </article>
    <div class="acts">
      <button class="btn pri" data-act="poster">生成分享图</button>
      <div class="btn two"><button class="btn" data-act="copy">复制报告链接</button><button class="btn" data-act="${mine ? 'again' : 'home'}">${mine ? '再测一次' : '我也查一个'}</button></div>
    </div>`;
    app._R = R; toastEl.classList.remove('show');
    window.scrollTo(0, 0);
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
    app.querySelectorAll('.meter').forEach(m => io.observe(m));
  }
  function tick(li) {
    li.classList.toggle('on');
    const n = app.querySelectorAll('.caught li.on').length;
    document.getElementById('hitn').textContent = n;
    document.getElementById('hitmsg').textContent = ['点一点，看看说中几条。', '中了一条，可能是巧合。', '两条了。', '三条，开始有点东西了。', '过半了，你是不是有点慌。', '五条。成分表不会骗人。', '六条。建议别给认识的人看。', '七条，就差一条。', '全中。你被查得明明白白。'][n];
  }

  /* ---------- 分享图 ---------- */
  function wrap(ctx, text, x, y, maxW, lh, maxLines = 9) {
    let line = '', n = 0;
    for (const ch of text) {
      if (ctx.measureText(line + ch).width > maxW && line) {
        if ('，。、：；！？”）…'.includes(ch)) { line += ch; continue; }
        ctx.fillText(line, x, y); y += lh; line = ch; if (++n >= maxLines) return y;
      } else line += ch;
    }
    if (line) { ctx.fillText(line, x, y); y += lh; }
    return y;
  }
  async function poster() {
    const R = app._R, top = R.top[0], lo = R.lowName, col = V[top.s.v].color;
    const W = 1080, H = 1920, c = document.createElement('canvas'); c.width = W; c.height = H;
    const x = c.getContext('2d'), INK = '#F6F2EA', PAPER = '#14121C', M = 64;
    const D = s => `900 ${s}px "CF Serif","Songti SC","Noto Serif SC",serif`, N = s => `${s}px "CF Latin",Georgia,serif`, B = (s, w = 500) => `${w} ${s}px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`;
    try { await Promise.all([document.fonts.load(D(60), '查成分' + top.s.noun + lo.s.mod), document.fonts.load(N(60), '0123456789%')]); } catch (e) {}
    x.fillStyle = '#08070D'; x.fillRect(0, 0, W, H);
    x.fillStyle = PAPER; x.strokeStyle = 'rgba(255,255,255,.18)'; x.lineWidth = 3;
    x.beginPath(); x.roundRect(28, 28, W - 56, H - 56, 34); x.fill(); x.stroke();
    x.save(); x.beginPath(); x.roundRect(31, 31, W - 62, H - 62, 31); x.clip();
    x.fillStyle = 'rgba(255,255,255,.06)'; x.fillRect(28, 28, W - 56, 70);
    x.fillStyle = '#9A96A8'; x.font = B(24, 700); x.textBaseline = 'middle';
    x.fillText('查成分 · 性格优势测试', M, 64); x.textAlign = 'right'; x.fillText('NO. ' + R.serial, W - M, 64); x.textAlign = 'left';
    // 图
    const IH = 530; x.fillStyle = col; x.fillRect(28, 98, W - 56, IH);
    const pic = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `img/${top.s.key}.webp`; });
    x.save(); x.beginPath(); x.rect(28, 98, W - 56, IH); x.clip();
    if (pic) { const s = Math.max((W - 56) / pic.width, IH / pic.height), w = pic.width * s, h = pic.height * s; x.drawImage(pic, 28 + (W - 56 - w) / 2, 98 + (IH - h) * .3, w, h); }
    else { x.fillStyle = 'rgba(255,255,255,.92)'; x.font = D(480); x.textAlign = 'center'; x.fillText(top.s.zh[0], W / 2, 98 + IH / 2 + 20); x.textAlign = 'left'; }
    x.restore();
        x.restore();
    // 称号
    let y = 98 + IH + 66; x.textBaseline = 'alphabetic';
    x.fillStyle = '#9A96A8'; x.font = D(52); x.fillText(lo.s.mod, M, y + 30);
    let fs = 150; x.font = D(fs); while (x.measureText(top.s.noun).width > W - 2 * M && fs > 80) { fs -= 6; x.font = D(fs); }
    y += 30 + fs * .98; x.fillStyle = INK; x.fillText(top.s.noun, M - 4, y);
    y += 62; x.font = B(34, 700); y = wrap(x, top.s.hiOne, M, y, W - 2 * M, 50, 2);
    x.font = B(32); x.fillStyle = '#C9C5D4'; y = wrap(x, '' + lo.s.loOne, M, y + 4, W - 2 * M, 48, 3);
    // 成分条
    y += 18; x.fillStyle = INK; x.fillRect(M, y, W - 2 * M, 12); y += 60;
    x.font = B(26, 700); x.fillStyle = '#9A96A8'; x.fillText('最高的五项', M, y); y += 20;
    R.top.forEach(t => {
      y += 50; x.fillStyle = INK; x.font = B(34, 800); x.fillText(t.s.zh, M, y);
      const bx = M + 130, bw = W - 2 * M - 130 - 120;
      x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.roundRect(bx, y - 26, bw, 24, 12); x.fill();
      x.fillStyle = V[t.s.v].color; x.beginPath(); x.roundRect(bx, y - 26, Math.max(24, bw * t.pct / 100), 24, 12); x.fill();
      x.fillStyle = INK; x.font = N(44); x.textAlign = 'right'; x.fillText(t.pct + '%', W - M, y + 2); x.textAlign = 'left';
    });
    y += 62; x.font = B(28, 500); x.fillStyle = '#9A96A8';
    x.fillText('最低：' + R.low.slice(0, 4).map(t => t.s.zh).join('、'), M, y);
    if (R.hits[0]) { y += 48; x.fillStyle = INK; x.font = B(28, 700); x.fillText('组合：' + R.hits[0].t[0], M, y); }
    // 背面小字
    if (H - 190 - y > 150) {
      y += 34; const qh = H - 196 - y; x.fillStyle = 'rgba(255,255,255,.1)'; x.beginPath(); x.roundRect(M, y, W - 2 * M, qh, 20); x.fill();
      x.fillStyle = '#9A96A8'; x.font = B(22); x.fillText('写给你', M + 28, y + 46);
      x.fillStyle = INK; x.font = '500 33px "Songti SC","Noto Serif SC","Source Han Serif SC",STSong,SimSun,serif';
      wrap(x, SOFT[top.s.key].hi, M + 28, y + 98, W - 2 * M - 56, 50, Math.max(1, Math.floor((qh - 70) / 50)));
    }
    // 底
    const fy = H - 150; x.fillStyle = INK; x.fillRect(M, fy - 28, W - 2 * M, 3);
    const r = rng(R.h); let bx = M; while (bx < M + 300) { const w = 2 + Math.floor(r() * 7); x.fillRect(bx, fy, w, 62); bx += w + 2 + Math.floor(r() * 7); }
    x.font = D(56); x.textAlign = 'right'; x.fillText('查成分', W - M, fy + 44);
    x.font = B(22); x.fillStyle = '#9A96A8'; x.fillText('24 项性格优势 · 213 题 · 非官方', W - M, fy + 80); x.textAlign = 'left';
    const url = c.toDataURL('image/png');
    openSheet(`<button class="close" data-act="close" aria-label="关闭">×</button><h3>分享图</h3><p class="fine">手机上长按图片保存；电脑上点下面的按钮。</p>
      <img class="poster" src="${url}" alt="${esc(lo.s.mod + top.s.noun)} 的成分报告">
      <a class="btn pri" style="display:block;text-align:center;text-decoration:none" download="查成分-${esc(lo.s.mod + top.s.noun)}.png" href="${url}">保存图片</a>`);
  }

  /* ---------- 事件与路由 ---------- */
  function route() {
    const m = /^#r=(.+)$/.exec(location.hash), d = m && decode(m[1]);
    if (d) report(analyse(d.q, d.mode), false); else home();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-mode],[data-act],[data-dex],[data-a],.caught li');
    if (!t) { if (e.target === sheet) closeSheet(); return; }
    if (t.dataset.mode) return start(+t.dataset.mode);
    if (t.dataset.dex) return dex(t.dataset.dex);
    if (t.dataset.a) return answer(+t.dataset.a);
    if (t.matches('.caught li')) return tick(t);
    const act = t.dataset.act;
    if (act === 'close') closeSheet();
    else if (act === 'resume') { Q = store.get().quiz; nag = {}; quiz(); }
    else if (act === 'last') { location.hash = 'r=' + store.get().last; }
    else if (act === 'quit') { save(); Q = null; history.replaceState(null, '', location.pathname); home(); toast('进度已保存'); }
    else if (act === 'prev') { if (Q.i > 0) { Q.i--; save(); paint(); } }
    else if (act === 'en') { const en = document.getElementById('qen'); en.hidden = !en.hidden; }
    else if (act === 'home' || act === 'again') { history.replaceState(null, '', location.pathname); home(); }
    else if (act === 'poster') poster();
    else if (act === 'copy') {
      const R = app._R, text = `我的性格成分是「${R.lowName.s.mod}${R.top[0].s.noun}」，你也查查：${location.href}`;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('链接已复制'), () => { prompt('复制这段：', text); });
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !sheet.hidden) return closeSheet();
    if (!Q || !sheet.hidden) return;
    if (e.key >= '1' && e.key <= '5') answer(+e.key);
    else if (e.key === 'ArrowLeft' && Q.i > 0) { Q.i--; save(); paint(); }
  });
  window.addEventListener('hashchange', () => { if (!Q) route(); });
  route();
})();
