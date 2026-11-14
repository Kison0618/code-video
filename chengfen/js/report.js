/* 结果报告。题目、计分与分享链接由主应用负责。 */
(() => {
  'use strict';

  const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));

  function render({ app, R, S, V, SOFT, mine }) {
    const groups = Object.keys(V).map(key => {
      const items = R.rank.filter(item => item.s.v === key);
      const average = Math.round(items.reduce((total, item) => total + item.q / 1295 * 100, 0) / items.length);
      return { key, virtue: V[key], items, average };
    });
    const [a, b, c] = R.top;
    const low = R.lowName;
    const otherLow = R.low.find(item => item !== low);
    const caught = [[a, a.s.hi[0]], [a, a.s.hi[1]], [low, low.s.lo[0]], [b, b.s.hi[0]], [a, a.s.hi[2]], [low, low.s.lo[1]], [c, c.s.hi[0]], [otherLow, otherLow.s.lo[0]]];
    const names = {
      w: 'WISDOM', c: 'COURAGE', h: 'HUMANITY', j: 'JUSTICE', t: 'TEMPERANCE', x: 'TRANSCENDENCE'
    };
    const score = item => `${item.pct}<span>%</span>`;
    const topCards = R.top.map((item, index) => `
      <button class="rv-top-card" type="button" data-dex="${escapeHTML(item.s.key)}" style="--rv-accent:${escapeHTML(V[item.s.v].color)}">
        <span class="rv-card-number">0${index + 1}<span class="rv-top-tag">TOP ${index + 1}</span></span>
        <span class="rv-card-mark">${escapeHTML(V[item.s.v].tag)}</span>
        <span class="rv-card-name">${escapeHTML(item.s.full)}</span>
        <span class="rv-card-group">${escapeHTML(V[item.s.v].zh)}</span><span class="rv-card-desc">${escapeHTML(item.s.def)}</span>
        <span class="rv-card-score">${score(item)}</span>
        <span class="rv-card-meter"><i style="width:${item.pct}%"></i></span>
      </button>`).join('');
    const distribution = groups.map(group => `
      <div class="rv-distribution-item" style="--rv-accent:${escapeHTML(group.virtue.color)}">
        <div class="rv-distribution-label"><span><i></i>${escapeHTML(group.virtue.zh)}</span><strong>${group.average}<small>%</small></strong></div>
        <div class="rv-track"><span style="width:${group.average}%"></span></div>
      </div>`).join('');
    const matrix = groups.map(group => `
      <div class="rv-domain" style="--rv-accent:${escapeHTML(group.virtue.color)}">
        <div class="rv-domain-heading"><span class="rv-domain-symbol">${escapeHTML(group.virtue.tag)}</span><div><strong>${escapeHTML(group.virtue.zh)}</strong><small>${names[group.key] || ''}</small></div><span class="rv-domain-average">${group.average}%</span></div>
        <div class="rv-domain-items">${group.items.map(item => `
          <button type="button" data-dex="${escapeHTML(item.s.key)}"><span>${escapeHTML(item.s.full)}</span><b>${item.pct}%</b></button>`).join('')}
        </div>
      </div>`).join('');
    const rows = R.rank.map((item, index) => `
      <button type="button" class="rv-rank-row" data-dex="${escapeHTML(item.s.key)}" data-group="${escapeHTML(item.s.v)}" data-search="${escapeHTML((item.s.full + ' ' + item.s.zh + ' ' + item.s.def + ' ' + V[item.s.v].zh).toLowerCase())}" style="--rv-accent:${escapeHTML(V[item.s.v].color)}">
        <span class="rv-rank-position">${String(index + 1).padStart(2, '0')}</span>
        <span class="rv-rank-name"><strong>${escapeHTML(item.s.full)}</strong><small>${escapeHTML(item.s.def)}</small></span>
        <span class="rv-rank-category"><i></i>${escapeHTML(V[item.s.v].zh)}</span>
        <span class="rv-rank-meter"><i style="width:${item.pct}%"></i></span>
        <span class="rv-rank-score">${item.pct}<small>%</small></span>
        <span class="rv-rank-arrow" aria-hidden="true">↗</span>
      </button>`).join('');

    app.innerHTML = `
      <div class="rv-report">
        ${mine ? '' : `<div class="rv-shared">这是一份分享的测评报告。<button type="button" data-act="home">我也测一测 →</button></div>`}
        <section class="rv-hero">
          <div class="rv-hero-main">
            <div class="rv-eyebrow"><span></span> Character Strengths Report</div>
            <h1>你的性格优势分析结果</h1>
            <p>基于 ${R.version} 作答生成的 24 项性格优势报告</p>
          </div>
          <div class="rv-toolbar" aria-label="报告操作">
            <button type="button" class="rv-action rv-action-primary" data-rv-action="ai">✦ <span>询问 AI</span></button>
            <button type="button" class="rv-action" data-rv-action="print">▤ <span>打印 / 导出 PDF</span></button>
            <button type="button" class="rv-action" data-act="poster">▧ <span>生成分享图</span></button>
            <button type="button" class="rv-action" data-act="copy">↗ <span>复制报告链接</span></button>
            <button type="button" class="rv-action" data-act="${mine ? 'again' : 'home'}">↻ <span>${mine ? '重新测试' : '我也测一测'}</span></button>
          </div>
        </section>

        <section class="rv-section">
          <div class="rv-section-head"><div><span class="rv-kicker">YOUR TOP 5</span><h2>你的前五大核心优势</h2><p>这是你测评中最突出的五项性格优势，点击卡片了解每项的含义。</p></div></div>
          <div class="rv-top-grid">${topCards}</div>
        </section>

        <section class="rv-section">
          <div class="rv-section-head"><div><span class="rv-kicker">SIX VIRTUES</span><h2>六大类别概览</h2><p>从六个方面，看看你的优势组合。</p></div></div>
          <div class="rv-overview"><div class="rv-overview-intro"><span class="rv-overview-icon">✳</span><div><h3>你的优势轮廓</h3><p>每个类别包含多项优势，数值为该类别各项得分的平均值。</p></div></div><div class="rv-distribution">${distribution}</div><p class="rv-note">得分为题目均分在本站换算后的 0–100 分，仅用于了解自身各项之间的情况，不代表人群百分位或占比。</p></div>
        </section>

        <section class="rv-section">
          <div class="rv-section-head"><div><span class="rv-kicker">YOUR STRENGTHS</span><h2>探索你的 24 项优势</h2><p>按六大类别展开，点击任意优势查看详细说明。</p></div></div>
          <div class="rv-domain-grid">${matrix}</div>
        </section>

        <section class="rv-section rv-ranking-section">
          <div class="rv-section-head"><div><span class="rv-kicker">FULL RANKING</span><h2>完整优势排序</h2><p>每一项都是你的一部分，排序呈现的是它们在你身上的相对位置。</p></div></div>
          <div class="rv-ranking">
            <div class="rv-ranking-controls"><div class="rv-filter-list" aria-label="按类别筛选"><button type="button" class="rv-filter is-active" data-rv-filter="all" aria-pressed="true">全部</button>${groups.map(group => `<button type="button" class="rv-filter" data-rv-filter="${escapeHTML(group.key)}" aria-pressed="false">${escapeHTML(group.virtue.zh)}</button>`).join('')}</div><label class="rv-search"><span aria-hidden="true">⌕</span><input type="search" placeholder="搜索优势" aria-label="搜索优势"></label></div>
            <div class="rv-list-heading"><span>排名</span><span>优势</span><span>类别</span><span>得分</span></div>
            <div class="rv-rank-list">${rows}</div>
            <div class="rv-empty" hidden>没有找到符合条件的优势。</div>
            <div class="rv-list-foot"><span data-rv-count>显示 24 项优势</span><span>点击查看优势说明 ↗</span></div>
          </div>
        </section>

        <details class="rv-fun">
          <summary>趣味解读与成分组合</summary>
          <div class="rv-fun-content">
            <p class="rv-kicker">你的趣味称号</p>
            <h2>${escapeHTML(low.s.mod + a.s.noun)}</h2>
            <p>${escapeHTML(a.s.hiOne)} ${escapeHTML(low.s.loOne)}</p>
            <h3>被看穿的小事</h3><p>有共鸣就点一下，看看说中几条。</p>
            <div class="rv-caught">${caught.map(([item, text]) => `<button type="button" data-rv-caught aria-pressed="false"><span>✓</span> ${escapeHTML(text)} <small>${escapeHTML(item.s.zh)} ${item.pct}%</small></button>`).join('')}</div>
            <p data-rv-caught-count>已选 0 / 8</p>
            <h3>最低的五项</h3><p>${R.low.map(item => `${escapeHTML(item.s.full)} ${item.pct}%`).join(' · ')}</p>
            <h3>强弱组合</h3>
            ${R.hits.length ? R.hits.map(hit => `<p><strong>${escapeHTML(hit.t[0])}</strong>　${escapeHTML(hit.t[1])}</p>`).join('') : `<p><strong>${escapeHTML(low.s.mod + a.s.noun)}</strong>　${escapeHTML(a.s.hi[0] + low.s.lo[0])}</p>`}
            <h3>写给你</h3><p>${escapeHTML(SOFT[a.s.key].hi)}</p><p>${escapeHTML(SOFT[low.s.key].lo)}</p>
            <p class="rv-note">这些文字是趣味解读，与你的真实体验可能不同。</p>
          </div>
        </details>

        <div class="rv-bottom"><div><strong>你的优势，值得被看见。</strong><p>带着这份了解，继续探索属于自己的可能。</p></div><button type="button" data-rv-action="ai">✦ 结合结果询问 AI <span>↗</span></button></div>
        <p class="rv-disclaimer">查成分 · 基于 IPIP 公开题库，非官方测评。结果仅供自我探索，不用于诊断。</p>

        <div class="rv-modal" hidden>
          <div class="rv-dialog" role="dialog" aria-modal="true" aria-labelledby="rv-dialog-title">
            <div class="rv-dialog-heading"><div><span class="rv-kicker">EXPLORE WITH AI</span><h2 id="rv-dialog-title">让 AI 帮你读懂优势</h2></div><button type="button" class="rv-close" data-rv-action="close" aria-label="关闭">×</button></div>
            <p class="rv-dialog-description">选择一个你想探索的方向，生成包含你实际结果的问题。复制后可粘贴到你使用的 AI 工具中。</p>
            <div class="rv-scenarios" role="group" aria-label="选择咨询场景">
              <button type="button" class="rv-scenario is-active" data-rv-scenario="工作与职业" aria-pressed="true">工作与职业</button>
              <button type="button" class="rv-scenario" data-rv-scenario="团队协作" aria-pressed="false">团队协作</button>
              <button type="button" class="rv-scenario" data-rv-scenario="学习与成长" aria-pressed="false">学习与成长</button>
              <button type="button" class="rv-scenario" data-rv-scenario="人际关系" aria-pressed="false">人际关系</button>
              <button type="button" class="rv-scenario" data-rv-scenario="日常生活" aria-pressed="false">日常生活</button>
            </div>
            <label class="rv-field"><span>补充你想问的问题 <small>选填</small></span><textarea class="rv-custom-question" rows="2" placeholder="例如：我怎样在新工作中更好地发挥自己的优势？"></textarea></label>
            <label class="rv-field"><span>生成的内容</span><textarea class="rv-prompt" rows="9" readonly></textarea></label>
            <div class="rv-dialog-footer"><span class="rv-copy-status" role="status"></span><button type="button" class="rv-action rv-action-primary" data-rv-action="copy-prompt">复制内容</button></div>
          </div>
        </div>
      </div>`;

    app._R = R;
    const root = app.querySelector('.rv-report');
    const modal = root.querySelector('.rv-modal');
    const search = root.querySelector('.rv-search input');
    const filterButtons = [...root.querySelectorAll('[data-rv-filter]')];
    const rankRows = [...root.querySelectorAll('.rv-rank-row')];
    const prompt = root.querySelector('.rv-prompt');
    const customQuestion = root.querySelector('.rv-custom-question');
    const scenarioButtons = [...root.querySelectorAll('[data-rv-scenario]')];
    let filter = 'all';
    let scenario = '工作与职业';
    let previousFocus = null;

    function updateFilter() {
      const term = search.value.trim().toLowerCase();
      let count = 0;
      rankRows.forEach(row => {
        const show = (filter === 'all' || row.dataset.group === filter) && row.dataset.search.includes(term);
        row.hidden = !show;
        if (show) count++;
      });
      root.querySelector('[data-rv-count]').textContent = `显示 ${count} 项优势`;
      root.querySelector('.rv-empty').hidden = count !== 0;
    }

    function updatePrompt() {
      const result = R.rank.map((item, index) => `${index + 1}. ${item.s.full}（${V[item.s.v].zh}）${item.pct}分`).join('\n');
      const question = customQuestion.value.trim();
      prompt.value = `我完成了查成分性格优势测试（${R.version}）。请结合我的结果，帮我从「${scenario}」的角度分析优势，给出具体、可操作的建议。${question ? `\n\n我还想问：${question}` : ''}\n\n我的24项优势排序：\n${result}\n\n这些分数是题目均分的站内换算，不是人群百分位或占比。请结合具体情境分析，避免把测试结果当作诊断。`;
    }

    function closeModal() {
      modal.hidden = true;
      if (previousFocus && previousFocus.isConnected) previousFocus.focus();
    }

    root.addEventListener('click', async event => {
      const caughtButton = event.target.closest('[data-rv-caught]');
      if (caughtButton) {
        const selected = caughtButton.getAttribute('aria-pressed') !== 'true';
        caughtButton.setAttribute('aria-pressed', String(selected));
        root.querySelector('[data-rv-caught-count]').textContent = '已选 ' + root.querySelectorAll('[data-rv-caught][aria-pressed="true"]').length + ' / 8';
        return;
      }
      const filterButton = event.target.closest('[data-rv-filter]');
      if (filterButton) {
        filter = filterButton.dataset.rvFilter;
        filterButtons.forEach(button => {
          const active = button === filterButton;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        updateFilter();
        return;
      }
      const scenarioButton = event.target.closest('[data-rv-scenario]');
      if (scenarioButton) {
        scenario = scenarioButton.dataset.rvScenario;
        scenarioButtons.forEach(button => {
          const active = button === scenarioButton;
          button.classList.toggle('is-active', active);
          button.setAttribute('aria-pressed', String(active));
        });
        updatePrompt();
        return;
      }
      if (event.target === modal) { closeModal(); return; }
      const action = event.target.closest('[data-rv-action]')?.dataset.rvAction;
      if (action === 'ai') {
        previousFocus = document.activeElement;
        modal.hidden = false;
        updatePrompt();
        modal.querySelector('.rv-close').focus();
      } else if (action === 'close') {
        closeModal();
      } else if (action === 'print') {
        window.print();
      } else if (action === 'copy-prompt') {
        const status = root.querySelector('.rv-copy-status');
        try {
          await navigator.clipboard.writeText(prompt.value);
          status.textContent = '已复制，可以粘贴到 AI 工具中。';
        } catch (_) {
          prompt.focus();
          prompt.select();
          status.textContent = '请手动复制已选中的内容。';
        }
      }
    });
    root.addEventListener('input', event => {
      if (event.target === search) updateFilter();
      if (event.target === customQuestion) updatePrompt();
    });
    root.addEventListener('keydown', event => {
      if (event.key === 'Escape' && !modal.hidden) closeModal();
    });
    window.scrollTo(0, 0);
  }

  window.ChengfenReport = { render };
})();
