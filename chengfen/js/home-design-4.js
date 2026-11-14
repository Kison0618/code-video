/* 首页（柔紫）。由 js/app.js 的 home() 调用：window.HomeDesign4({ st, S, V })
   释义依据 docs/02_VIA六大美德与24项优势_来源与释义.md；首页不使用报告里的趣味称号。 */
(() => {
  const CLASS = {
    w: { en: 'Wisdom', q: '如何理解世界', d: '获取、理解和运用知识。', c: '#6b73d2' },
    c: { en: 'Courage', q: '如何面对挑战', d: '面对困难、恐惧或阻力时，仍朝重要的目标行动。', c: '#d47f71' },
    h: { en: 'Humanity', q: '如何与人相处', d: '关注他人，并建立有温度的关系。', c: '#d480a8' },
    j: { en: 'Justice', q: '如何与群体同行', d: '群体中的公平、协作与共同责任。', c: '#4f9f95' },
    t: { en: 'Temperance', q: '如何把握分寸', d: '管理冲动、风险和过度反应。', c: '#c39345' },
    x: { en: 'Transcendence', q: '如何感受意义', d: '与美、意义、希望或更大的世界建立联系。', c: '#9c84cd' }
  };
  const INFO = {
    creativity: ['创造力', 'Creativity', '想出既新颖又有用的办法。比如，换一种方法解决反复出现的问题。'],
    curiosity: ['好奇心', 'Curiosity', '对新事物和新经验感兴趣，愿意主动探索、提问。'],
    judgment: ['判断力', 'Judgment', '从不同角度看证据，也愿意考虑与自己看法相反的意见。'],
    learning: ['热爱学习', 'Love of Learning', '喜欢获得新知识、深化理解或逐步掌握技能。'],
    perspective: ['洞察力', 'Perspective', '能综合经验和不同视角，把握全局，并给出有见地的建议。'],
    bravery: ['勇敢', 'Bravery', '即使害怕，也愿意为认为重要的事情采取行动；不是没有恐惧，也不是不顾风险。'],
    perseverance: ['毅力', 'Perseverance', '遇到障碍和挫折，仍愿意持续努力；也可以根据情况调整方法或目标。'],
    honesty: ['诚实', 'Honesty', '对自己和他人保持真实，如实呈现想法与行为，并承担责任。'],
    zest: ['活力', 'Zest', '带着热情和投入感参与生活；不等于必须始终外向或精力充沛。'],
    love: ['爱', 'Love', '珍视亲密、相互关怀的关系，愿意给予爱，也能接受爱。'],
    kindness: ['善良', 'Kindness', '关心他人的需要，并通过帮助、照顾或体贴表达出来；不要求牺牲自己的边界。'],
    social: ['社交智慧', 'Social Intelligence', '觉察自己和他人的感受、想法与动机，理解互动中的情境；不等于能准确读心。'],
    teamwork: ['团队合作', 'Teamwork', '作为团队一员承担责任、支持共同目标，并作出自己的贡献。'],
    fairness: ['公平', 'Fairness', '以公正原则对待每个人，尽量不让个人好恶或偏见左右判断。'],
    leadership: ['领导力', 'Leadership', '组织、鼓励和引导群体实现目标，同时关照成员之间的关系；不等于职位高低。'],
    forgiveness: ['宽恕', 'Forgiveness', '面对他人过失时，尝试减少怨怼，并在适当时给改变留空间；不等于必须原谅、和好或放弃自我保护。'],
    humility: ['谦逊', 'Humility', '认识自己的长处和局限，不一味寻求关注；不是否认能力或贬低自己。'],
    prudence: ['审慎', 'Prudence', '行动前考虑后果和未来，尽量避免不必要的风险。'],
    selfreg: ['自我调节', 'Self-Regulation', '管理情绪、冲动和行为，使行动更符合自己的目标；不是压抑所有感受。'],
    beauty: ['欣赏美与卓越', 'Appreciation of Beauty & Excellence', '留意并欣赏自然、艺术、日常事物的美，以及他人的技艺或卓越表现。'],
    gratitude: ['感恩', 'Gratitude', '注意到生活中的好事与他人的善意，并在合适的时候表达感谢。'],
    hope: ['希望', 'Hope', '对未来保持积极期待，并相信自己的行动可以帮助通向期望的方向；不保证事情一定成功。'],
    humor: ['幽默', 'Humor', '发现生活中有趣的一面，用轻松的方式为自己或他人带来欢笑。'],
    spirituality: ['灵性与信念', 'Spirituality', '围绕生命的意义、目的或超越个人的事物建立理解和联系；可以与宗教有关，也可以不是宗教信仰。']
  };
  const CONFUSE = {
    curiosity: '好奇心偏向探索新问题；热爱学习偏向持续获得和深化知识。', learning: '好奇心偏向探索新问题；热爱学习偏向持续获得和深化知识。',
    judgment: '判断力看证据，洞察力看全局，审慎考虑行动后果。', perspective: '判断力看证据，洞察力看全局，审慎考虑行动后果。', prudence: '判断力看证据，洞察力看全局，审慎考虑行动后果。',
    love: '爱重视亲密关系中的相互关怀；善良重在帮助；社交智慧重在理解人和情境。', kindness: '爱重视亲密关系中的相互关怀；善良重在帮助；社交智慧重在理解人和情境。', social: '爱重视亲密关系中的相互关怀；善良重在帮助；社交智慧重在理解人和情境。',
    hope: '希望更关注未来的期待与行动；活力更关注当下的热情和投入。', zest: '希望更关注未来的期待与行动；活力更关注当下的热情和投入。'
  };
  const VERSIONS = {
    '96r': { n: 96, name: '轻量版', min: 10, src: 'IPIP-VIA-R', note: '每项 4 题' },
    '213': { n: 213, name: '完整版', min: 20, src: 'IPIP-VIA', note: '每项 7–11 题' }
  };
  const ORDER = ['96r', '213'];   // 对象里数字键会排到前面，所以单独定顺序
  let pick = null;

  const progressOf = (st, mode) => {
    const p = st.quizzes?.[mode] || (mode === '213' && st.quiz?.mode === 213 ? st.quiz : null);
    if (!p) return null;
    const done = Object.keys(p.ans || {}).length;
    return done < p.order.length ? { done, total: p.order.length } : null;
  };

  function cta(st) {
    const v = VERSIONS[pick], prog = progressOf(st, pick);
    return prog
      ? `<button class="h4-cta" data-act="resume" data-resume-mode="${pick}"><span>继续测评<small>${v.name} · 已答 ${prog.done} / ${prog.total}</small></span><i>→</i></button>
         <button class="h4-restart" data-mode="${pick}">放弃进度，重新开始</button>`
      : `<button class="h4-cta" data-mode="${pick}"><span>开始测评<small>${v.n} 题 · 约 ${v.min} 分钟</small></span><i>→</i></button>`;
  }

  window.HomeDesign4 = ({ st, S, V }) => {
    if (!pick) pick = progressOf(st, '213') && !progressOf(st, '96r') ? '213' : '96r';
    const versions = ORDER.map(m => { const v = VERSIONS[m];
      const prog = progressOf(st, m);
      return `<button class="h4-ver${m === pick ? ' on' : ''}" data-h4-pick="${m}" role="radio" aria-checked="${m === pick}">
        <span class="h4-ver-top"><b>${v.n}</b><em>题</em></span>
        <strong>${v.name}${m === '96r' ? '<span class="h4-tag">推荐首次</span>' : ''}</strong><small>约 ${v.min} 分钟 · ${v.note}</small>
        ${prog ? `<span class="h4-prog">已答 ${prog.done}/${prog.total}</span>` : ''}</button>`;
    }).join('');
    const classes = Object.keys(V).map((k, i) => {
      const c = CLASS[k], list = S.filter(s => s.v === k);
      return `<article class="h4-class" style="--c:${c.c}">
        <header><span class="h4-no">0${i + 1}</span><div><h3>${V[k].zh}<small>${c.en}</small></h3><p>${c.q}</p></div><span class="h4-count">${list.length} 项</span></header>
        <div class="h4-chips">${list.map(s => `<button data-h4-info="${s.key}">${INFO[s.key][0]}</button>`).join('')}</div></article>`;
    }).join('');
    const sample = [['好奇心', 'w', 92], ['幽默', 'x', 87], ['善良', 'h', 83], ['热爱学习', 'w', 79], ['欣赏美与卓越', 'x', 76]];
    return `<section class="h4">
      <div class="h4-hero">
        <p class="h4-kicker"><span>✳</span>VIA 性格优势 · 24 项</p>
        <h1>每个人都有<br><em>属于自己的优势。</em></h1>
        <p class="h4-intro">回答一组关于日常习惯的题目，看看 24 项性格优势在你身上怎样排序：哪些最突出，哪些较少用到。</p>
        <ul class="h4-facts"><li><b>24</b>项优势</li><li><b>6</b>类美德</li><li><b>2</b>种题量</li></ul>
        <div class="h4-pick" role="radiogroup" aria-label="选择题量">${versions}</div>
        <div class="h4-go" id="h4-go">${cta(st)}</div>
        ${st.last ? '<button class="h4-last" data-act="last">查看上次的报告 →</button>' : ''}
        <p class="h4-note">题目来自 IPIP 公开量表 · 答案只在你的设备上计算</p>
      </div>

      <section class="h4-sec">
        <p class="h4-eyebrow">THE 24 STRENGTHS</p>
        <h2>24 项优势，分属 6 类</h2>
        <p class="h4-lede">每个人都具备全部 24 项，只是程度和顺序不同。点一项看它的含义。</p>
        <div class="h4-classes">${classes}</div>
      </section>

      <section class="h4-sec">
        <p class="h4-eyebrow">YOUR REPORT</p>
        <h2>测完你会得到</h2>
        <div class="h4-sample" aria-label="报告示例">
          <div class="h4-sample-head"><span>你的前五项优势</span><em>示例</em></div>
          ${sample.map(([n, v, p], i) => `<div class="h4-row" style="--c:${CLASS[v].c};--w:${p}%"><span>${i + 1}</span><b>${n}</b><i></i></div>`).join('')}
        </div>
        <ol class="h4-gets">
          <li><b>前五项优势</b>你最常用、最自然的那几项，各自的含义和日常表现。</li>
          <li><b>六类美德的表现</b>思考、行动、待人、群体、分寸、意义，哪几类更突出。</li>
          <li><b>24 项完整排序</b>可以搜索、筛选，也能生成分享图。</li>
        </ol>
        <p class="h4-caveat">排序只在你自己的 24 项之间比较。排在后面不代表缺少这项品质，分数也不是和别人比的百分位。</p>
      </section>

      <p class="h4-disclaimer">题目来自 IPIP-VIA-R（96 题）与 IPIP-VIA（213 题）公开量表，中文为本站翻译，尚未经信效度验证。24 项分类出自 Peterson 与 Seligman（2004）。本站不是 VIA Institute 的官方测评，结果仅供自我探索，不用于诊断。</p>
    </section>`;
  };

  function openInfo(key) {
    const s = window.STRENGTHS.find(x => x.key === key), c = CLASS[s.v], [zh, en, def] = INFO[key], sheet = document.getElementById('sheet');
    sheet.innerHTML = `<div class="box h4-info" style="--c:${c.c}"><button class="close" data-act="close" aria-label="关闭">×</button>
      <p class="h4-info-class">${window.VIRTUES[s.v].zh} · ${c.q}</p><h3>${zh}</h3><p class="h4-info-en">${en}</p>
      <p class="h4-info-def">${def}</p>
      ${CONFUSE[key] ? `<p class="h4-info-tip"><b>容易混淆</b>${CONFUSE[key]}</p>` : ''}
      <button class="h4-info-go" data-act="close">知道了</button></div>`;
    sheet.hidden = false; document.body.style.overflow = 'hidden';
  }

  document.addEventListener('click', e => {
    const p = e.target.closest('[data-h4-pick]');
    if (p) {
      pick = p.dataset.h4Pick;
      document.querySelectorAll('[data-h4-pick]').forEach(b => { const on = b === p; b.classList.toggle('on', on); b.setAttribute('aria-checked', on); });
      let st = {}; try { st = JSON.parse(localStorage.getItem('chengfen.v1')) || {}; } catch (_) {}
      document.getElementById('h4-go').innerHTML = cta(st);
      return;
    }
    const i = e.target.closest('[data-h4-info]');
    if (i) openInfo(i.dataset.h4Info);
  });
})();
