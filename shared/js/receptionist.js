/* =============================================================================
 * SleepWell Studio — Self-hosted AI Receptionist (zero-backend, zero-account)
 * -----------------------------------------------------------------------------
 * 特点：
 *   - 纯静态：不调用任何第三方服务，不需要账号、API Key 或后端（知识库随页面加载）
 *   - 知识库来自本站真实页面内容（仅索引与链接，不编造医学结论）
 *   - 关键词 + 权重匹配（中英文均可），命中即给答案与站内链接
 *   - 未命中 → 人工兜底（给出国际咨询邮箱）
 *   - 预留 LLM 升级：配置 endpoint 后即走生成式回答（见下方 CONFIG.llm）
 *
 * 用法：在页面 </body> 前引入 <script src="shared/js/receptionist.js" defer></script>
 * ============================================================================= */
(function () {
  'use strict';

  if (window.__SLEEPWELL_RECEPTIONIST__) return; // 幂等：重复注入不重复初始化
  window.__SLEEPWELL_RECEPTIONIST__ = true;

  var CONFIG = {
    // 人工兜底邮箱（取自 about.html 的 International Inquiries）
    contactEmail: 'lianglinyuan666@gmail.com',
    contactPage: 'about.html',
    brand: 'SleepWell Studio',
    greeting: "Hi! I'm the SleepWell assistant. Ask me about sleep science, sounds, diet, or our shop.",
    // 生成式升级（可选）：填 endpoint 后即调用；静态站点请勿把密钥写在这里
    llm: { endpoint: '', apiKey: '', model: '' },
    // 站内文章索引（中文查询时用，可选，加载失败自动忽略）
    articlesUrl: 'shared/data/ima-index.json'
  };
  if (window.SleepWellReceptionistConfig) {
    Object.keys(window.SleepWellReceptionistConfig).forEach(function (k) {
      CONFIG[k] = window.SleepWellReceptionistConfig[k];
    });
  }

  /* ---------------------------- 知识库（基于本站真实页面） ---------------------------- */
  var KB = [
    {
      q: 'what is sleepwell studio about who are you',
      a: "SleepWell Studio is a science-backed sleep wellness platform covering sleep education, sleep music, wellness nutrition and an AI sleep coach.",
      links: [['About us', 'about.html'], ['Home', 'index.html']],
      kw: ['about', 'who', 'what is', 'sleepwell', 'mian jing', 'company', 'brand', '介绍', '关于', '你们']
    },
    {
      q: 'sleep cycles stages rem deep sleep groggy',
      a: "Our article explains what sleep cycles are, the four sleep stages, how cycles change through the night, and why you sometimes wake up groggy.",
      links: [['Read: Sleep cycles', 'article.html'], ['Sleep science', 'science.html']],
      kw: ['cycle', 'cycles', 'stage', 'stages', 'rem', 'deep sleep', 'groggy', 'wake up', '睡眠周期', '深睡']
    },
    {
      q: 'cbti cognitive behavioral therapy insomnia',
      a: "We cover CBT-I (cognitive behavioural therapy for insomnia): what it is, how it works, and its core techniques.",
      links: [['Read: CBT-I', 'article.html'], ['Sleep science', 'science.html']],
      kw: ['cbt', 'cbt-i', 'cbti', 'insomnia', 'therapy', 'cognitive', '失眠', '认知行为']
    },
    {
      q: 'sleep sounds music white noise brainwave meditation',
      a: "The Sound Library includes natural soundscapes, brainwave frequencies, a noise spectrum and guided meditation — plus how sound shapes your sleep.",
      links: [['Open Sound Library', 'music.html'], ['Sleep videos', 'videos.html']],
      kw: ['sound', 'sounds', 'music', 'white noise', 'noise', 'brainwave', 'meditation', 'audio', 'rain', '助眠', '音乐', '白噪音']
    },
    {
      q: 'food diet nutrition recipes what to eat before bed',
      a: "The Wellness Diet page explains what nourishes sleep, shares 8 traditional sleep-nourishing recipes, and gives an ideal pre-sleep nutrition timeline.",
      links: [['Open Wellness Diet', 'food.html']],
      kw: ['food', 'diet', 'nutrition', 'recipe', 'recipes', 'eat', 'meal', 'supper', '食疗', '饮食', '食谱']
    },
    {
      q: 'shop products buy sleep essentials price',
      a: "Our Shop lists sleep essentials. Browse the collection for products that support a better night's rest.",
      links: [['Open Shop', 'shop.html']],
      kw: ['shop', 'buy', 'purchase', 'product', 'products', 'price', 'order', '商城', '购买', '价格']
    },
    {
      q: 'videos baby sleep lullabies relaxation',
      a: "The Videos page collects baby sleep sounds, lullabies, nature soundscapes, relaxation music, white-noise channels and guided sleep meditations.",
      links: [['Watch videos', 'videos.html'], ['Sound Library', 'music.html']],
      kw: ['video', 'videos', 'baby', 'lullaby', 'lullabies', 'relaxation', 'youtube', '视频']
    },
    {
      q: 'ai sleep coach assistant chatbot',
      a: "We offer an AI Sleep Coach that helps you understand your sleep and build better habits.",
      links: [['Open AI Sleep Coach', 'ai-assistant.html']],
      kw: ['ai', 'coach', 'assistant', 'chatbot', 'bot', '智能', '助手']
    },
    {
      q: 'medical disclaimer is this medical advice side effects',
      a: "Content on this site is for education only: it is not medical advice and not a substitute for professional care. Please consult a qualified clinician about any health concern.",
      links: [['Medical Disclaimer', 'disclaimer.html']],
      kw: ['medical', 'advice', 'doctor', 'disclaimer', 'safe', 'side effect', 'diagnosis', '免责', '医嘱']
    },
    {
      q: 'privacy data cookies do you collect my information',
      a: "Our Privacy Policy explains what information we collect, how we use it, data sharing, storage and cookies.",
      links: [['Privacy Policy', 'privacy.html']],
      kw: ['privacy', 'data', 'cookie', 'cookies', 'gdpr', 'collect', '隐私', '数据']
    },
    {
      q: 'contact email talk to a human support help',
      a: "Sure — email our international inbox and a real person will get back to you.",
      links: [['Contact page', 'about.html']],
      kw: ['contact', 'email', 'human', 'support', 'help', 'talk', 'agent', '联系', '人工', '客服']
    },
    {
      q: 'sleep science knowledge learn basics',
      a: "The Sleep Science page gathers essential sleep knowledge and further reading.",
      links: [['Sleep Science', 'science.html'], ['Latest articles', 'article.html']],
      kw: ['science', 'knowledge', 'learn', 'research', 'study', '科普', '知识']
    }
  ];

  var CHIPS = [
    ['Sleep sounds', 'sleep sounds'],
    ['Sleep cycles', 'sleep cycles'],
    ['CBT-I', 'cbt-i'],
    ['Diet tips', 'food for sleep'],
    ['Shop', 'shop'],
    ['Talk to a human', 'contact']
  ];

  /* ------------------------------ 匹配逻辑 ------------------------------ */
  function norm(s) {
    return String(s || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').replace(/\s+/g, ' ').trim();
  }
  function tokens(s) {
    var t = norm(s).split(' ').filter(Boolean);
    // 中文按 2-gram 补充
    if (/[\u4e00-\u9fa5]/.test(s)) {
      var zh = String(s).replace(/[^\u4e00-\u9fa5]/g, '');
      for (var i = 0; i < zh.length - 1; i++) t.push(zh.substr(i, 2));
    }
    return t;
  }
  function score(query, item) {
    var qt = tokens(query);
    var hay = norm(item.q + ' ' + item.kw.join(' '));
    var s = 0;
    for (var i = 0; i < qt.length; i++) {
      var tk = qt[i];
      if (tk.length < 2 && !/[\u4e00-\u9fa5]/.test(tk)) continue;
      if (hay.indexOf(tk) !== -1) s += tk.length > 3 ? 2 : 1;
    }
    // 短语级加权
    var qn = norm(query);
    for (var k = 0; k < item.kw.length; k++) {
      if (qn.indexOf(norm(item.kw[k])) !== -1) s += 3;
    }
    return s;
  }
  function bestMatch(query) {
    var best = null, bs = 0;
    for (var i = 0; i < KB.length; i++) {
      var sc = score(query, KB[i]);
      if (sc > bs) { bs = sc; best = KB[i]; }
    }
    return bs >= 2 ? { item: best, score: bs } : null;
  }

  var articles = null;
  function loadArticles(cb) {
    if (!CONFIG.articlesUrl) return cb && cb(null);
    try {
      fetch(CONFIG.articlesUrl).then(function (r) { return r.json(); }).then(function (d) {
        articles = d && d.keywords ? d.keywords : null; cb && cb(articles);
      }).catch(function () { cb && cb(null); });
    } catch (e) { cb && cb(null); }
  }
  function searchArticles(query) {
    if (!articles) return null;
    var hits = [];
    Object.keys(articles).forEach(function (k) {
      if (norm(query).indexOf(norm(k)) !== -1 || norm(k).indexOf(norm(query)) !== -1) {
        hits = hits.concat(articles[k].map(function (x) { return x.title; }));
      }
    });
    return hits.length ? Array.from(new Set(hits)).slice(0, 4) : null;
  }

  /* ------------------------------ 生成式升级（可选） ------------------------------ */
  function askLLM(query, cb) {
    if (!CONFIG.llm.endpoint) return cb(null);
    try {
      fetch(CONFIG.llm.endpoint, {
        method: 'POST',
        headers: Object.assign({ 'Content-Type': 'application/json' },
          CONFIG.llm.apiKey ? { Authorization: 'Bearer ' + CONFIG.llm.apiKey } : {}),
        body: JSON.stringify({ model: CONFIG.llm.model, messages: [{ role: 'user', content: query }] })
      }).then(function (r) { return r.json(); }).then(function (j) {
        var txt = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
        cb(txt || null);
      }).catch(function () { cb(null); });
    } catch (e) { cb(null); }
  }

  /* -------------------------------- 界面 -------------------------------- */
  var CSS = [
    '.swr-bubble{position:fixed;right:20px;bottom:20px;width:58px;height:58px;border-radius:50%;',
    'border:none;cursor:pointer;z-index:9998;display:flex;align-items:center;justify-content:center;',
    'font-size:24px;color:#fff;background:linear-gradient(135deg,#A0BA9A,#4A6741);',
    'box-shadow:0 10px 28px rgba(74,103,65,.35);transition:transform .2s}',
    '.swr-bubble:hover{transform:scale(1.06)}',
    '.swr-panel{position:fixed;right:20px;bottom:88px;width:min(370px,calc(100vw - 40px));',
    'max-height:min(560px,70vh);background:#fff;border-radius:16px;z-index:9999;display:none;',
    'flex-direction:column;overflow:hidden;box-shadow:0 18px 50px rgba(0,0,0,.18);',
    'font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;border:1px solid rgba(0,0,0,.06)}',
    '.swr-panel.open{display:flex}',
    '.swr-head{padding:14px 16px;color:#fff;background:linear-gradient(135deg,#4A6741,#A0BA9A)}',
    '.swr-title{font-weight:600;font-size:.95rem}.swr-sub{font-size:.75rem;opacity:.9;margin-top:2px}',
    '.swr-close{position:absolute;top:10px;right:12px;background:none;border:none;color:#fff;',
    'font-size:20px;cursor:pointer;line-height:1}',
    '.swr-body{flex:1;overflow-y:auto;padding:14px;font-size:.88rem;line-height:1.65;color:#2b2b2b}',
    '.swr-msg{margin-bottom:10px;padding:10px 12px;border-radius:12px;max-width:88%;word-wrap:break-word}',
    '.swr-bot{background:#F3F6F2;color:#243026;align-self:flex-start}',
    '.swr-me{background:#4A6741;color:#fff;margin-left:auto;text-align:right}',
    '.swr-links{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px}',
    '.swr-links a{font-size:.78rem;color:#4A6741;background:#EEF3EC;border:1px solid #D7E3D2;',
    'padding:4px 9px;border-radius:999px;text-decoration:none}',
    '.swr-links a:hover{background:#E2EBDE}',
    '.swr-chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 14px 10px}',
    '.swr-chip{font-size:.76rem;border:1px solid #D7E3D2;background:#fff;color:#3C5340;',
    'padding:5px 10px;border-radius:999px;cursor:pointer}',
    '.swr-chip:hover{background:#F3F6F2}',
    '.swr-form{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #eee;background:#FCFDFC}',
    '.swr-input{flex:1;border:1px solid #ddd;border-radius:10px;padding:9px 11px;font-size:.86rem;outline:none}',
    '.swr-input:focus{border-color:#A0BA9A}',
    '.swr-send{border:none;background:#4A6741;color:#fff;border-radius:10px;padding:0 14px;cursor:pointer;',
    'font-size:.84rem;font-weight:600}',
    '.swr-note{font-size:.7rem;color:#8a8a8a;padding:6px 14px 10px;text-align:center}',
    '@media (max-width:480px){.swr-panel{right:10px;left:10px;bottom:78px;width:auto}.swr-bubble{right:12px;bottom:14px}}'
  ].join('');

  function injectCSS() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function build() {
    injectCSS();
    var bubble = document.createElement('button');
    bubble.className = 'swr-bubble';
    bubble.setAttribute('aria-label', 'Open ' + CONFIG.brand + ' assistant');
    bubble.innerHTML = '💬';

    var panel = document.createElement('div');
    panel.className = 'swr-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', CONFIG.brand + ' assistant');
    panel.innerHTML =
      '<div class="swr-head" style="position:relative">' +
        '<button class="swr-close" aria-label="Close">×</button>' +
        '<div class="swr-title">' + esc(CONFIG.brand) + ' Assistant</div>' +
        '<div class="swr-sub">Answers from this site · no sign-in</div>' +
      '</div>' +
      '<div class="swr-body" id="swr-body"></div>' +
      '<div class="swr-chips" id="swr-chips"></div>' +
      '<form class="swr-form" id="swr-form">' +
        '<input class="swr-input" id="swr-input" placeholder="Ask about sleep…" autocomplete="off" aria-label="Your question">' +
        '<button class="swr-send" type="submit">Send</button>' +
      '</form>' +
      '<div class="swr-note">Not medical advice · <a href="disclaimer.html">Disclaimer</a></div>';

    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    var body = panel.querySelector('#swr-body');
    var chips = panel.querySelector('#swr-chips');
    var form = panel.querySelector('#swr-form');
    var input = panel.querySelector('#swr-input');

    function addMsg(text, who, links) {
      var d = document.createElement('div');
      d.className = 'swr-msg ' + (who === 'me' ? 'swr-me' : 'swr-bot');
      d.innerHTML = esc(text) + (links && links.length
        ? '<div class="swr-links">' + links.map(function (l) {
            return '<a href="' + esc(l[1]) + '">' + esc(l[0]) + ' ›</a>';
          }).join('') + '</div>'
        : '');
      body.appendChild(d);
      body.scrollTop = body.scrollHeight;
    }

    addMsg(CONFIG.greeting, 'bot');

    CHIPS.forEach(function (c) {
      var b = document.createElement('button');
      b.className = 'swr-chip';
      b.type = 'button';
      b.textContent = c[0];
      b.addEventListener('click', function () { input.value = c[1]; form.dispatchEvent(new Event('submit')); });
      chips.appendChild(b);
    });

    function answer(q) {
      addMsg(q, 'me');
      askLLM(q, function (gen) {
        if (gen) { addMsg(gen, 'bot'); return; }
        var m = bestMatch(q);
        if (m) {
          addMsg(m.item.a, 'bot', m.item.links);
        } else {
          var arts = searchArticles(q);
          if (arts) {
            addMsg('I found related reading in our library:', 'bot',
              arts.map(function (t) { return [t.replace(/\.md$/, ''), 'article.html']; }));
          } else {
            addMsg("I'm not sure about that one. Email " + CONFIG.contactEmail +
              " and a human will help, or browse the site below.", 'bot',
              [['Contact', CONFIG.contactPage], ['Sleep Science', 'science.html'],
               ['Sound Library', 'music.html'], ['Home', 'index.html']]);
          }
        }
      });
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var v = input.value.trim();
      if (!v) return;
      input.value = '';
      answer(v);
    });

    function toggle(open) {
      panel.classList.toggle('open', open);
      if (open) { setTimeout(function () { input.focus(); }, 60); }
    }
    bubble.addEventListener('click', function () { toggle(!panel.classList.contains('open')); });
    panel.querySelector('.swr-close').addEventListener('click', function () { toggle(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.classList.contains('open')) toggle(false);
    });

    loadArticles();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
