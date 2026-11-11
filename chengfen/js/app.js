/* 查成分 —— 纯前端：出题、计分、出报告、画分享图。不发任何请求，不收集任何信息。 */
(() => {
  'use strict';
  const S = window.STRENGTHS, V = window.VIRTUES, T = window.TENSIONS, SOFT = window.SOFT;
  const IDX = Object.fromEntries(S.map((s, i) => [s.key, i]));
  const ITEM = Object.fromEntries(window.ITEMS.map(i => [i[0], i]));
  const app = document.getElementById('app'), toastEl = document.getElementById('toast'), sheet = document.getElementById('sheet');
  const KEY = 'chengfen.v1';
  const MODES = {
    48: { name: '试吃装', min: 4, note: '每种成分 2 题。粗检，尝个味道。' },
    96: { name: '标准装', min: 8, note: '每种成分 4 题。够准，也不累。' },
    213: { name: '量贩装', min: 18, note: 'IPIP-VIA 全部 213 题。最准，适合较真的人。' }
  };
  const OPTS = [['完全不像', 14, 'transparent'], ['不太像', 19, 'transparent'], ['说不准', 12, 'var(--mute)'], ['有点像', 19, 'currentColor'], ['太像了', 26, 'currentColor']];

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
    const r = rng(Date.now());
    const names = Array.from({ length: 14 }, () => { const a = S[Math.floor(r() * 24)]; let b; do { b = S[Math.floor(r() * 24)]; } while (b === a); return `<span>${b.mod}<i>${a.noun}</i></span>`; }).join('·');
    app.innerHTML = `
    <section class="label">
      <div class="strip inv mono"><span>性格成分鉴定所</span><span>非官方 · 仅供娱乐</span></div>
      <div class="hero">
        <div class="stamp disp"><div>24 种<br>成分<small>INGREDIENTS</small></div></div>
        <h1>查成分</h1>
        <p class="q">你到底是<em>什么做的</em>？</p>
        <p class="sub">答几十道题，给你出一张成分表：主要成分是什么，几乎不含什么，以及这两样放在一起，为什么会拧巴。</p>
      </div>
      <div class="ticker" aria-hidden="true"><div>${names}·${names}·</div></div>
      <div class="pad">
        ${prog && prog.i < prog.order.length ? `<button class="resume" data-act="resume"><span>上次测到一半（${prog.i}/${prog.order.length}），接着测</span><span>→</span></button>` : ''}
        ${st.last ? `<button class="resume" style="border-color:var(--ink);color:var(--ink)" data-act="last"><span>看我上次的报告</span><span>→</span></button>` : ''}
        <div class="sec-h"><h2>选个规格</h2><span>题越多越准</span></div>
        <div class="packs">
          ${[96, 48, 213].map(m => `<button class="pack ${m === 96 ? 'rec' : ''}" data-mode="${m}">
            <span class="n num">${m}<small>题</small></span>
            <span><b>${MODES[m].name}${m === 96 ? '<span class="tagrec">推荐</span>' : ''}</b><p>约 ${MODES[m].min} 分钟 · ${MODES[m].note}</p></span>
            <span class="go">→</span></button>`).join('')}
        </div>
      </div>
      <hr class="rule fat">
      <div class="pad">
        <div class="sec-h"><h2>检测须知</h2></div>
        <ol class="facts">
          <li><span class="num">01</span><div><b>凭第一反应选</b><span>选“你实际是什么样”，别选“你希望自己是什么样”。成分表不看志向。</span></div></li>
          <li><span class="num">02</span><div><b>没有高低好坏</b><span>24 种成分人人都有，测的是你自己身上谁多谁少，不跟别人比。</span></div></li>
          <li><span class="num">03</span><div><b>看的是搭配</b><span>最多的和最少的放在一起看，才知道一个人为什么拧巴。称号有 552 种。</span></div></li>
          <li><span class="num">04</span><div><b>全程在你手机里算</b><span>不用注册，不上传答案。关掉页面，进度还在。</span></div></li>
        </ol>
      </div>
      <hr class="rule fat">
      <div class="pad">
        <div class="sec-h"><h2>24 种成分</h2><span>点开看看</span></div>
        <div class="dex">${S.map(s => `<button data-dex="${s.key}" style="--c:${V[s.v].color}"><div class="ph" style="position:relative">${esc(s.zh[0])}<div style="position:absolute;inset:0">${img(s.key)}</div></div><b>${s.zh}</b></button>`).join('')}</div>
        <div class="vkey">${Object.values(V).map(v => `<span><i style="background:${v.color}"></i>${v.zh}</span>`).join('')}</div>
      </div>
      <hr class="rule">
      <div class="pad fine">
        <p>题目来自 IPIP-VIA 量表（International Personality Item Pool，公共领域），共 213 题、24 个分量表，中文为本站自译。24 项分类源自 Peterson 与 Seligman（2004）的性格优势研究。</p>
        <p>这是一个非官方的娱乐测试，不是 VIA Institute 的官方测评，没有常模，不能用于诊断、招聘或任何正经场合。称号和文案是玩笑，别太往心里去；要是哪句说中了，也不用谢。</p>
      </div>
    </section>`;
    window.scrollTo(0, 0);
  }

  function dex(key) {
    const s = S[IDX[key]], v = V[s.v];
    openSheet(`<button class="close" data-act="close" aria-label="关闭">×</button>
      <p class="mono" style="color:${v.color}">${v.zh} · ${esc(s.full)}</p><h3>${s.zh}</h3>
      <div class="simg" style="--c:${v.color}">${img(s.key)}</div>
      <p>${s.def}</p>
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
      <div class="qtop"><span class="cnt num"><span id="qi"></span><small> / ${Q.order.length}</small></span><button data-act="quit">存档退出</button></div>
      <div class="bar"><i id="qbar"></i></div>
      <div class="qcard" id="qcard"><div class="tag mono"><span>${MODES[Q.mode].name} · 这句话像不像你</span><button data-act="en" class="mono" id="enbtn">原文</button></div>
        <p class="qtext" id="qtext"></p><p class="qen" id="qen" hidden></p></div>
      <div class="opts" role="radiogroup" aria-label="这句话像不像你">${OPTS.map((o, k) => `<button class="opt" role="radio" data-a="${k + 1}" style="--d:${o[1]}px;--f:${o[2]}"><span class="dotbox"><i></i></span><span>${o[0]}</span></button>`).join('')}</div>
      <div class="qfoot"><button data-act="prev" id="prev">← 上一题</button><span>电脑上可按数字键 1–5</span></div>
    </section>`;
    paint(); window.scrollTo(0, 0);
  }
  function paint() {
    const id = Q.order[Q.i], it = ITEM[id], card = document.getElementById('qcard');
    document.getElementById('qi').textContent = String(Q.i + 1).padStart(String(Q.order.length).length, '0');
    document.getElementById('qbar').style.width = (Q.i / Q.order.length * 100) + '%';
    document.getElementById('qtext').textContent = it[3];
    document.getElementById('qen').textContent = 'I… ' + it[4];
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
    fast = performance.now() - lastT < 750 ? fast + 1 : 0; same = prev === a ? same + 1 : 0;
    const n = Q.order.length, done = Q.i + 1;
    if (fast >= 8 && !nag.fast) { nag.fast = 1; toast('选这么快。是太了解自己，还是在敷衍我？'); }
    else if (same >= 9 && !nag.same) { nag.same = 1; toast('连着十题选一样的，成分表要串味了。'); }
    else if (done === Math.round(n / 4)) toast('已检 1/4 · 样本很配合');
    else if (done === Math.round(n / 2)) toast('过半了 · 目前检出少量嘴硬');
    else if (done === Math.round(n * 3 / 4)) toast('还剩 1/4 · 别在这时候开始乱选');
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
    const lines = ['样本已接收，共 ' + (R.mode) + ' 项读数', '称重 · 去皮 · 去掉客套话', `检出大量「${R.top[0].s.zh}」`, `检出「${R.top[1].s.zh}」「${R.top[2].s.zh}」`, `「${R.lowName.s.zh}」含量低于检出限`, '正在给你起名字…'];
    app.innerHTML = `<section class="printing"><p class="mono">${R.serial}</p><h2>正在出具<br>成分报告</h2><div class="log" id="log"></div><p class="fine">点任意位置跳过</p></section>`;
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
      <div class="strip inv mono"><span>性格成分鉴定报告</span><span>NO. ${R.serial}</span></div>
      <div class="rhero" style="--c:${v.color}">
        <div class="rimg"><div class="ph">${esc(top.s.zh[0])}</div>${img(top.s.key)}
          <span class="chip"><i></i>主要成分：${top.s.zh} ${top.pct}%</span></div>
        <div class="stamp rstamp disp" ${fresh ? '' : 'style="animation:none"'}><div>已检出<small>${date}</small></div></div>
        <div class="rname"><span class="k mono">鉴定结果 · 你是</span>
          <h1><span class="m">${lo.s.mod}</span><span class="n ${top.s.noun.length > 4 ? 'long' : ''}">${top.s.noun}</span></h1></div>
        <p class="verdict"><b>${top.s.hiOne}</b><br>但配料表最后一行写着：${lo.s.loOne}</p>
      </div>
      <hr class="rule fat">
      <div class="pad ingr">
        <span class="t">配料：</span>${R.top.map((x, i) => `<u style="--c:${V[x.s.v].color}">${i === 0 ? `<b>${x.s.zh}</b>` : x.s.zh}</u>`).join('、')}、${mid.slice(0, 6).map(x => x.s.zh).join('、')}……<span class="t">（按含量从高到低）</span>
        <span class="trace"><span class="t">几乎不含：</span>${R.low.map(x => x.s.zh).join('、')}。</span>
      </div>

      <hr class="rule">
      <div class="pad">
        <div class="sec-h"><h2>被看穿的小事</h2><span>中了就点一下</span></div>
        <ul class="caught">${caughtList(R).map(([x, t]) => `<li><span class="box">✓</span><span>${t}<small>${x.q >= 648 ? '因为' : '因为缺'}「${x.s.zh}」${x.pct}%</small></span></li>`).join('')}</ul>
        <div class="hit"><span id="hitmsg">点一点，看看说中几条。</span><span class="num"><span id="hitn">0</span>/8</span></div>
      </div>

      <hr class="rule fat">
      <div class="pad">
        <div class="sec-h"><h2>主要成分</h2><span>你身上最多的五样</span></div>
        <ol class="top">${R.top.map((x, i) => `<li style="--c:${V[x.s.v].color}"><span class="rk num">${i + 1}</span><h3>${x.s.zh}<small>${V[x.s.v].zh} · ${x.s.full}</small></h3><span class="pct num">${x.pct}<small>%</small></span>
          <p>${x.s.hiOne}</p><p class="def">${x.s.def}</p><div class="meter"><i style="--w:${x.pct}%"></i></div></li>`).join('')}</ol>
      </div>
      <hr class="rule">
      <div class="pad">
        <div class="sec-h"><h2>几乎不含</h2><span>垫底的五样，从最少的排起</span></div>
        <ol class="top low">${R.low.map((x, i) => `<li><span class="rk num">${24 - i}</span><h3>${x.s.zh}<small>${V[x.s.v].zh} · ${x.s.full}</small></h3><span class="pct num">${x.pct}<small>%</small></span>
          <p>${x.s.loOne}</p><div class="meter"><i style="--w:${x.pct}%"></i></div></li>`).join('')}</ol>
        <p class="fine" style="margin-top:10px">“几乎不含”是你自己 24 项里排在后面的，不代表比别人差。灵性一项在不信教的人里普遍靠后。</p>
      </div>

      <hr class="rule fat">
      <div class="pad">
        <div class="sec-h"><h2>${R.hits.length ? '隐藏款' : '拧巴之处'}</h2><span>最多的 × 最少的</span></div>
        ${R.hits.length ? R.hits.map(h => `<div class="hidden-card"><span class="mono">特定搭配 · 已解锁</span><h3>${h.t[0]}</h3><p>${h.t[1]}</p><div class="x"><span class="up">${h.a.s.zh} ${h.a.pct}% ↑</span><span>${h.b.s.zh} ${h.b.pct}% ↓</span></div></div>`).join('')
          : `<div class="hidden-card"><span class="mono">你的搭配</span><h3>${lo.s.mod}${top.s.noun}</h3><p>${top.s.hi[0]}${lo.s.lo[0]}这两件事发生在同一个人身上，就是你。</p><div class="x"><span class="up">${top.s.zh} ${top.pct}% ↑</span><span>${lo.s.zh} ${lo.pct}% ↓</span></div></div>`}
      </div>

      <hr class="rule">
      <div class="pad">
        <div class="sec-h"><h2>六个方面</h2><span>每一类里谁撑着、谁拖着</span></div>
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
        <div class="sec-h"><h2>标签背面的小字</h2><span>以下是猜的</span></div>
        <blockquote><cite>关于你的「${top.s.zh}」</cite>${SOFT[top.s.key].hi}</blockquote>
        <blockquote><cite>关于你缺的「${lo.s.zh}」</cite>${SOFT[lo.s.key].lo}</blockquote>
      </div>

      <hr class="rule fat">
      <div class="pad table">
        <div class="sec-h"><h2>完整成分表</h2><span>每 1 位本人 · ${MODES[R.mode].name} ${R.mode} 题</span></div>
        ${Object.keys(V).map(k => `<div class="grp" style="--c:${V[k].color}"><span><i></i>${V[k].zh}</span></div>` + R.rank.filter(x => x.s.v === k).map(x => {
          const pos = R.rank.indexOf(x); return `<div class="row" style="--c:${V[k].color}"><b>${x.s.zh}${pos < 5 ? '<sup>TOP</sup>' : ''}</b><div class="meter"><i style="--w:${x.pct}%"></i></div><span class="num">${x.pct}%</span></div>`;
        }).join('')).join('')}
      </div>

      <hr class="rule">
      <div class="pad">
        <ul class="small-print">
          <li><b>净含量</b><span>1 人</span></li>
          <li><b>贮存条件</b><span>${top.s.store}</span></li>
          <li><b>警示</b><span>${lo.s.warn}${R.low[1] && R.low[1] !== lo ? R.low[1].s.warn : ''}</span></li>
          <li><b>搭配建议</b><span>与「${partner.noun}」同食，可补充${lo.s.zh}。也可能打起来。</span></li>
          <li><b>保质期</b><span>性格会变。建议半年后复检。</span></li>
        </ul>
        <div class="barcode" aria-hidden="true">${bars}</div>
        <div class="serial mono"><span>${R.serial}</span><span>${date} 检</span></div>
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
    const x = c.getContext('2d'), INK = '#151412', PAPER = '#FAF6EC', M = 64;
    const D = s => `${s}px "CF Display","PingFang SC","Microsoft YaHei",sans-serif`, N = s => `800 ${s}px "CF Num","CF Display",sans-serif`, B = (s, w = 500) => `${w} ${s}px -apple-system,"PingFang SC","Noto Sans SC","Microsoft YaHei",sans-serif`;
    try { await Promise.all([document.fonts.load(D(60), '查成分' + top.s.noun + lo.s.mod), document.fonts.load(N(60), '0123456789%')]); } catch (e) {}
    x.fillStyle = '#EFE9DC'; x.fillRect(0, 0, W, H);
    x.fillStyle = PAPER; x.strokeStyle = INK; x.lineWidth = 6;
    x.beginPath(); x.roundRect(28, 28, W - 56, H - 56, 34); x.fill(); x.stroke();
    x.save(); x.beginPath(); x.roundRect(31, 31, W - 62, H - 62, 31); x.clip();
    x.fillStyle = INK; x.fillRect(28, 28, W - 56, 70);
    x.fillStyle = PAPER; x.font = B(24, 700); x.textBaseline = 'middle';
    x.fillText('性 格 成 分 鉴 定 报 告', M, 64); x.textAlign = 'right'; x.fillText('NO. ' + R.serial, W - M, 64); x.textAlign = 'left';
    // 图
    const IH = 530; x.fillStyle = col; x.fillRect(28, 98, W - 56, IH);
    const pic = await new Promise(res => { const im = new Image(); im.onload = () => res(im); im.onerror = () => res(null); im.src = `img/${top.s.key}.webp`; });
    x.save(); x.beginPath(); x.rect(28, 98, W - 56, IH); x.clip();
    if (pic) { const s = Math.max((W - 56) / pic.width, IH / pic.height), w = pic.width * s, h = pic.height * s; x.drawImage(pic, 28 + (W - 56 - w) / 2, 98 + (IH - h) * .3, w, h); }
    else { x.fillStyle = 'rgba(255,255,255,.92)'; x.font = D(480); x.textAlign = 'center'; x.fillText(top.s.zh[0], W / 2, 98 + IH / 2 + 20); x.textAlign = 'left'; }
    x.restore();
    x.fillStyle = INK; x.fillRect(28, 98 + IH, W - 56, 6);
    x.restore();
    // 称号
    let y = 98 + IH + 66; x.textBaseline = 'alphabetic';
    x.fillStyle = '#6F695C'; x.font = D(58); x.fillText(lo.s.mod, M, y + 30);
    let fs = 168; x.font = D(fs); while (x.measureText(top.s.noun).width > W - 2 * M && fs > 80) { fs -= 6; x.font = D(fs); }
    y += 30 + fs * .98; x.fillStyle = INK; x.fillText(top.s.noun, M - 4, y);
    y += 62; x.font = B(34, 700); y = wrap(x, top.s.hiOne, M, y, W - 2 * M, 50, 2);
    x.font = B(32); x.fillStyle = '#3b3833'; y = wrap(x, '但配料表最后一行写着：' + lo.s.loOne, M, y + 4, W - 2 * M, 48, 3);
    // 成分条
    y += 18; x.fillStyle = INK; x.fillRect(M, y, W - 2 * M, 12); y += 60;
    x.font = B(26, 700); x.fillStyle = '#6F695C'; x.fillText('主要成分', M, y); y += 20;
    R.top.forEach(t => {
      y += 50; x.fillStyle = INK; x.font = B(34, 800); x.fillText(t.s.zh, M, y);
      const bx = M + 130, bw = W - 2 * M - 130 - 120;
      x.fillStyle = '#E2DACA'; x.beginPath(); x.roundRect(bx, y - 26, bw, 24, 12); x.fill();
      x.fillStyle = V[t.s.v].color; x.beginPath(); x.roundRect(bx, y - 26, Math.max(24, bw * t.pct / 100), 24, 12); x.fill();
      x.fillStyle = INK; x.font = N(44); x.textAlign = 'right'; x.fillText(t.pct + '%', W - M, y + 2); x.textAlign = 'left';
    });
    y += 62; x.font = B(28, 500); x.fillStyle = '#6F695C';
    x.fillText('几乎不含：' + R.low.slice(0, 4).map(t => t.s.zh).join('、'), M, y);
    if (R.hits[0]) { y += 48; x.fillStyle = INK; x.font = B(28, 700); x.fillText('隐藏款：' + R.hits[0].t[0], M, y); }
    // 背面小字
    if (H - 190 - y > 150) {
      y += 34; const qh = H - 196 - y; x.fillStyle = '#E2DACA'; x.beginPath(); x.roundRect(M, y, W - 2 * M, qh, 20); x.fill();
      x.fillStyle = '#6F695C'; x.font = B(22); x.fillText('标签背面的小字', M + 28, y + 46);
      x.fillStyle = INK; x.font = '500 33px "Songti SC","Noto Serif SC","Source Han Serif SC",STSong,SimSun,serif';
      wrap(x, SOFT[top.s.key].hi, M + 28, y + 98, W - 2 * M - 56, 50, Math.max(1, Math.floor((qh - 70) / 50)));
    }
    // 底
    const fy = H - 150; x.fillStyle = INK; x.fillRect(M, fy - 28, W - 2 * M, 3);
    const r = rng(R.h); let bx = M; while (bx < M + 300) { const w = 2 + Math.floor(r() * 7); x.fillRect(bx, fy, w, 62); bx += w + 2 + Math.floor(r() * 7); }
    x.font = D(64); x.textAlign = 'right'; x.fillText('查成分', W - M, fy + 44);
    x.font = B(22); x.fillStyle = '#6F695C'; x.fillText('24 种性格成分 · 非官方娱乐测试', W - M, fy + 80); x.textAlign = 'left';
    // 章
    x.save(); x.translate(W - 170, 98 + IH - 10); x.rotate(.24); x.strokeStyle = '#E0401F'; x.fillStyle = 'rgba(250,246,236,.92)';
    x.lineWidth = 8; x.beginPath(); x.arc(0, 0, 104, 0, 7); x.fill(); x.stroke(); x.lineWidth = 3; x.beginPath(); x.arc(0, 0, 90, 0, 7); x.stroke();
    x.fillStyle = '#E0401F'; x.font = D(56); x.textAlign = 'center'; x.fillText('已检出', 0, 18); x.restore();

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
    else if (act === 'quit') { save(); Q = null; history.replaceState(null, '', location.pathname); home(); toast('进度存好了，回来接着测。'); }
    else if (act === 'prev') { if (Q.i > 0) { Q.i--; save(); paint(); } }
    else if (act === 'en') { const en = document.getElementById('qen'); en.hidden = !en.hidden; }
    else if (act === 'home' || act === 'again') { history.replaceState(null, '', location.pathname); home(); }
    else if (act === 'poster') poster();
    else if (act === 'copy') {
      const R = app._R, text = `我的性格成分是「${R.lowName.s.mod}${R.top[0].s.noun}」，你也查查：${location.href}`;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('链接复制好了，发给想看的人。'), () => { prompt('复制这段：', text); });
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
