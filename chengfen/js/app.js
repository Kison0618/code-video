/* 查成分 —— 纯前端：出题、计分、出报告、画分享图。不发任何请求，不收集任何信息。 */
(() => {
  'use strict';
  const S = window.STRENGTHS, V = window.VIRTUES, T = window.TENSIONS, SOFT = window.SOFT;
  const IDX = Object.fromEntries(S.map((s, i) => [s.key, i]));
  const ITEM = Object.fromEntries([...window.ITEMS, ...window.ITEMS_VIA_R].map(i => [i[0], i]));
  const app = document.getElementById('app'), toastEl = document.getElementById('toast'), sheet = document.getElementById('sheet');
  const KEY = 'chengfen.v1';
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
  function buildOrder(seed, mode) {
    const ids = (mode === "96r" ? window.ITEMS_VIA_R : window.ITEMS).map(i => i[0]);
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
    const m = /^([0-9a-z]{48})-(48|96r|96|213)$/.exec(str || ''); if (!m) return null;
    const q = []; for (let i = 0; i < 48; i += 2) { const v = parseInt(m[1].slice(i, i + 2), 36); if (!(v >= 0 && v <= 1295)) return null; q.push(v); }
    return { q, mode: m[2] === '96r' ? '96r' : +m[2] };
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
    const version = mode === '96r' ? 'IPIP-VIA-R 96 题' : mode === 213 ? 'IPIP-VIA 213 题' : `历史自选 ${mode} 题`;
    return { q, mode, version, code, rank, top, low, lowName, hits: hits.slice(0, 3), serial, h };
  }

  /* ---------- 首页 ---------- */
  function home() {
    const st = store.get();
    const progress = mode => st.quizzes?.[mode] || (mode === 213 && st.quiz?.mode === 213 ? st.quiz : null);
    const option = (mode, title, detail) => {
      const prog = progress(mode), answered = prog ? Object.keys(prog.ans || {}).length : 0;
      const unfinished = prog && answered < prog.order.length;
      return `<div class="version-option"><div><strong>${title}</strong><small>${detail}</small></div>
        ${unfinished ? `<button class="button primary" data-act="resume" data-resume-mode="${mode}">继续测评 · ${answered}/${prog.order.length}</button><button class="text-button" data-mode="${mode}">重新开始</button>` : `<button class="button primary" data-mode="${mode}">选择这个版本 →</button>`}</div>`;
    };
    document.getElementById('header-status').textContent = '首页';
    document.body.dataset.homeVariant = '4';
    app.innerHTML = window.HomeDesign4({option, st, S, V});
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
  let Q = null;
  const PAGE_SIZE = 10;
  function start(mode) {
    if (mode !== 213 && mode !== '96r') return;
    Q = { mode, seed: Date.now() % 2147483647, ans: {}, i: 0 };
    Q.order = buildOrder(Q.seed, mode);
    save();
    quiz();
  }
  function save() { const st = store.get(); st.quizzes = st.quizzes || {}; st.quizzes[Q.mode] = Q; if (st.quiz?.mode === Q.mode) delete st.quiz; store.set(st); }
  function answeredCount() { return Q.order.filter(id => Q.ans[id] >= 1 && Q.ans[id] <= 5).length; }
  function quiz() {
    delete document.body.dataset.homeVariant;
    const page = Math.min(Math.floor(Q.i / PAGE_SIZE), Math.ceil(Q.order.length / PAGE_SIZE) - 1);
    const pages = Math.ceil(Q.order.length / PAGE_SIZE);
    const first = page * PAGE_SIZE;
    const ids = Q.order.slice(first, first + PAGE_SIZE);
    const count = answeredCount();
    document.getElementById('header-status').textContent = `测评 (${count}/${Q.order.length})`;
    app.innerHTML = `<section class="quiz page-width">
      <div class="quiz-progress"><div class="progress-top"><div><b>第 ${page + 1} / ${pages} 页</b><span id="quiz-count">已完成 ${count} / ${Q.order.length} 题 (${Math.round(count / Q.order.length * 100)}%)</span></div><button data-act="quit">保存并退出</button></div>
        <div class="progress-track"><i id="quiz-progress-fill" style="width:${count / Q.order.length * 100}%"></i></div>
      </div>
      <nav class="page-nav" aria-label="答题分页">${Array.from({length: pages}, (_, i) => {
        const pageIds = Q.order.slice(i * PAGE_SIZE, (i + 1) * PAGE_SIZE);
        const done = pageIds.filter(id => Q.ans[id]).length;
        return `<button data-act="page" data-page="${i}" class="${i === page ? 'active' : ''} ${done === pageIds.length ? 'complete' : ''}" aria-label="第 ${i + 1} 页，已完成 ${done} / ${pageIds.length} 题" ${i === page ? 'aria-current="page"' : ''}>${i + 1}</button>`;
      }).join('')}</nav>
      <div class="question-list">${ids.map((id, i) => {
        const item = ITEM[id], selected = Q.ans[id];
        return `<article class="question-card" data-question="${id}">
          <div class="question-top"><span>#${String(first + i + 1).padStart(3, '0')}</span><span class="answered-mark" ${selected ? '' : 'hidden'}>✓ 已作答</span></div>
          <div class="question-body"><div class="question-copy"><p>${esc(item[3])}</p><details><summary>英文原题</summary><span>${esc(item[4])}</span></details></div>
          <div class="answer-group" role="radiogroup" aria-label="第 ${first + i + 1} 题符合程度">${OPTS.map((opt, index) => `<button type="button" role="radio" aria-checked="${selected === index + 1}" aria-label="${opt[0]}" title="${opt[0]}" data-answer="${index + 1}" data-question-id="${id}" class="answer-option answer-${index + 1} ${selected === index + 1 ? 'selected' : ''}"><span>${selected === index + 1 ? '✓' : ''}</span></button>`).join('')}
          <div class="answer-labels"><span>非常不符合</span><span>非常符合</span></div></div></div>
        </article>`;
      }).join('')}</div>
      <div class="quiz-actions"><button class="button secondary" data-act="page" data-page="${page - 1}" ${page === 0 ? 'disabled' : ''}>← 上一页</button><span>第 ${page + 1} / ${pages} 页</span>
      ${page < pages - 1 ? `<button class="button primary" id="quiz-next" data-act="page" data-page="${page + 1}" ${ids.every(id => Q.ans[id]) ? '' : 'disabled'}>下一页 →</button>` : `<button class="button primary" id="quiz-submit" data-act="submit" ${count === Q.order.length ? '' : 'disabled'}>提交并查看结果 →</button>`}</div>
      <p class="quiz-hint">每页完成所有题目后可以继续，进度会自动保存。电脑可用数字键 1–5 依次作答。</p>
    </section>`;
    window.scrollTo(0, 0);
  }
  function answer(id, value) {
    if (!Q || !Q.order.includes(id) || value < 1 || value > 5) return;
    Q.ans[id] = value;
    save();
    const card = app.querySelector(`[data-question="${id}"]`);
    if (!card) return;
    card.querySelector('.answered-mark').hidden = false;
    card.querySelectorAll('[data-answer]').forEach(button => {
      const selected = Number(button.dataset.answer) === value;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-checked', String(selected));
      button.firstElementChild.textContent = selected ? '✓' : '';
    });
    const count = answeredCount(), total = Q.order.length;
    document.getElementById('header-status').textContent = `测评 (${count}/${total})`;
    document.getElementById('quiz-count').textContent = `已完成 ${count} / ${total} 题 (${Math.round(count / total * 100)}%)`;
    document.getElementById('quiz-progress-fill').style.width = `${count / total * 100}%`;
    const page = Math.floor(Q.i / PAGE_SIZE), pageIds = Q.order.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
    const done = pageIds.filter(questionId => Q.ans[questionId]).length;
    const pageButton = app.querySelector(`[data-page="${page}"].active`);
    if (pageButton) {
      pageButton.classList.toggle('complete', done === pageIds.length);
      pageButton.setAttribute('aria-label', `第 ${page + 1} 页，已完成 ${done} / ${pageIds.length} 题`);
    }
    const next = document.getElementById('quiz-next');
    if (next) next.disabled = done !== pageIds.length;
    const submit = document.getElementById('quiz-submit');
    if (submit) submit.disabled = count !== total;
  }

  function finish() {
    const q = score(Q.order, Q.ans), R = analyse(q, Q.mode);
    const st = store.get(); st.last = R.code; if (st.quizzes) delete st.quizzes[Q.mode]; if (st.quiz?.mode === Q.mode) delete st.quiz; store.set(st); Q = null;
    printing(R);
  }
  function printing(R) {
    const lines = [`${R.version}作答已记录`, '反向题换算 · 24 个分量表计分', '按题均分排序', `最高：${R.top[0].s.full}`, `最低：${R.low[0].s.full}`, '生成结果…'];
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
  function report(R, fresh) {
    delete document.body.dataset.homeVariant;
    document.getElementById('header-status').textContent = '分析报告';
    window.ChengfenReport.render({ app, R, S, V, SOFT, mine: store.get().last === R.code });
    toastEl.classList.remove('show');
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
    const R = app._R;
    const W = 1080, H = 1350;
    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const font = (size, weight = 500) => `${weight} ${size}px "Microsoft YaHei", "PingFang SC", sans-serif`;
    ctx.fillStyle = '#f8f5f3';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e6f0ef';
    ctx.beginPath();
    ctx.roundRect(55, 55, 970, 270, 30);
    ctx.fill();
    ctx.fillStyle = '#3da1a5';
    ctx.font = font(25, 700);
    ctx.fillText('✦  查成分 · 性格优势报告', 90, 112);
    ctx.fillStyle = '#281b32';
    ctx.font = font(64, 800);
    ctx.fillText('你的五大核心优势', 90, 200);
    ctx.fillStyle = '#817789';
    ctx.font = font(26);
    ctx.fillText(`${R.version} · 24 项优势 · 6 大类别`, 90, 260);
    let y = 380;
    R.top.forEach((item, index) => {
      ctx.fillStyle = '#fffdfa';
      ctx.strokeStyle = '#e9e1dd';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(55, y, 970, 140, 22);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#3da1a5';
      ctx.font = font(30, 700);
      ctx.fillText(String(index + 1).padStart(2, '0'), 85, y + 61);
      ctx.fillStyle = '#281b32';
      ctx.font = font(37, 800);
      ctx.fillText(item.s.full, 155, y + 61);
      ctx.fillStyle = '#817789';
      ctx.font = font(23);
      ctx.fillText(V[item.s.v].zh + ' · ' + item.s.def, 155, y + 105, 700);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#3da1a5';
      ctx.font = font(38, 800);
      ctx.fillText(item.pct + '分', 985, y + 78);
      ctx.textAlign = 'left';
      y += 153;
    });
    ctx.fillStyle = '#817789';
    ctx.font = font(22);
    ctx.fillText('分数为题均分的站内换算，用于自身各项之间的比较。', 64, 1210);
    ctx.fillText('基于 IPIP 公开题库 · 非官方测评 · 仅供自我探索', 64, 1250);
    const url = canvas.toDataURL('image/png');
    openSheet(`<button class="close" data-act="close" aria-label="关闭">×</button><h3>分享图</h3><p class="fine">手机上长按图片保存；电脑上点下面的按钮。</p>
      <img class="poster" src="${url}" alt="查成分前五大优势分享图">
      <a class="btn pri" style="display:block;text-align:center;text-decoration:none" download="查成分-优势报告.png" href="${url}">保存图片</a>`);
  }

  /* ---------- 事件与路由 ---------- */
  function route() {
    const m = /^#r=(.+)$/.exec(location.hash), d = m && decode(m[1]);
    if (d) report(analyse(d.q, d.mode), false); else home();
  }
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-mode],[data-act],[data-dex],[data-answer]');
    if (!t) { if (e.target === sheet) closeSheet(); return; }
    if (t.dataset.mode) return start(t.dataset.mode === '96r' ? '96r' : Number(t.dataset.mode));
    if (t.dataset.dex) return dex(t.dataset.dex);
    if (t.dataset.answer) return answer(Number(t.dataset.questionId), Number(t.dataset.answer));
    const act = t.dataset.act;
    if (act === 'close') closeSheet();
    else if (act === 'resume') { const mode = t.dataset.resumeMode === '96r' ? '96r' : 213, st = store.get(); const saved = st.quizzes?.[mode] || (mode === 213 && st.quiz?.mode === 213 ? st.quiz : null); if (saved?.mode === mode) { Q = saved; quiz(); } }
    else if (act === 'last') { location.hash = 'r=' + store.get().last; }
    else if (act === 'quit') { save(); Q = null; history.replaceState(null, '', location.pathname + location.search); home(); toast('进度已保存'); }
    else if (act === 'page' && Q) { const page = Number(t.dataset.page); if (page >= 0 && page < Math.ceil(Q.order.length / PAGE_SIZE)) { Q.i = page * PAGE_SIZE; save(); quiz(); } }
    else if (act === 'submit' && Q && answeredCount() === Q.order.length) finish();
    else if (act === 'home' || act === 'again') { if (Q) { save(); Q = null; } history.replaceState(null, '', location.pathname + location.search); home(); }
    else if (act === 'poster') poster();
    else if (act === 'copy') {
      const R = app._R, text = `我的性格成分是「${R.lowName.s.mod}${R.top[0].s.noun}」，你也查查：${location.href}`;
      (navigator.clipboard ? navigator.clipboard.writeText(text) : Promise.reject()).then(() => toast('链接已复制'), () => { prompt('复制这段：', text); });
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !sheet.hidden) closeSheet();
    if (!Q || !sheet.hidden || e.key < '1' || e.key > '5' || /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    const currentPage = Q.order.slice(Math.floor(Q.i / PAGE_SIZE) * PAGE_SIZE, (Math.floor(Q.i / PAGE_SIZE) + 1) * PAGE_SIZE);
    const id = currentPage.find(questionId => !Q.ans[questionId]);
    if (id !== undefined) answer(id, Number(e.key));
  });
  const themeButton = document.getElementById('theme-toggle');
  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeButton.textContent = theme === 'dark' ? '☀' : '☾';
    themeButton.setAttribute('aria-label', theme === 'dark' ? '切换浅色模式' : '切换深色模式');
  }
  let initialTheme = 'light';
  try { initialTheme = localStorage.getItem('chengfen.theme') || 'light'; } catch (e) {}
  applyTheme(initialTheme);
  themeButton.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    applyTheme(theme);
    try { localStorage.setItem('chengfen.theme', theme); } catch (e) {}
  });
  window.addEventListener('hashchange', () => { if (!Q) route(); });
  route();
})();
