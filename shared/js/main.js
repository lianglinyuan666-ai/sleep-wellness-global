/**
 * 共享 JS 工具库
 * 导航滚动、AI聊天、音频播放、滚动动画、评论审核
 */

/* ===== 导航滚动效果 ===== */
function initNavScroll() {
  const nav = document.querySelector('.site-nav');
  if (!nav) return;
  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 20);
  }, { passive: true });
}

/* ===== 汉堡菜单 ===== */
function initMobileMenu() {
  const burger = document.querySelector('.nav-burger');
  const menu = document.querySelector('.mobile-menu');
  if (!burger || !menu) return;
  burger.addEventListener('click', () => {
    menu.classList.toggle('open');
    const spans = burger.querySelectorAll('span');
    if (menu.classList.contains('open')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans.forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    }
  });
  // 点击菜单项关闭
  menu.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      menu.classList.remove('open');
      burger.querySelectorAll('span').forEach(s => { s.style.transform = ''; s.style.opacity = ''; });
    });
  });
}

/* ===== 滚动显示动画 ===== */
function initRevealAnimations() {
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => obs.observe(el));
}

/* ===== IMA 知识库本地索引 ===== */
let _imaIndex = null; // 缓存

async function loadIMAIndex() {
  if (_imaIndex) return _imaIndex;
  try {
    // 计算相对于当前页面的路径
    const base = window.location.pathname.includes('/cn/') || window.location.pathname.includes('/global/')
      ? '../shared/data/ima-index.json'
      : 'shared/data/ima-index.json';
    const resp = await fetch(base);
    if (!resp.ok) return null;
    _imaIndex = await resp.json();
    return _imaIndex;
  } catch {
    return null;
  }
}

// 从本地 IMA 索引中搜索与用户问题相关的内容
async function searchIMALocal(userQuestion) {
  const index = await loadIMAIndex();
  if (!index || !index.keywords) return '';

  // 将用户问题与索引关键词进行匹配
  const question = userQuestion.toLowerCase();
  const matches = [];
  const keywordMap = {
    '睡不着': ['失眠', '助眠', '睡前'],
    '失眠': ['失眠', '睡眠障碍', '睡眠改善'],
    '多梦': ['深度睡眠', '睡眠质量'],
    '褪黑素': ['褪黑素'],
    '冥想': ['冥想', '正念'],
    '睡眠': ['睡眠改善', '睡眠质量', '深度睡眠'],
    '助眠': ['助眠', '睡前', '安神'],
    '安神': ['安神', '助眠'],
    '节律': ['昼夜节律', '睡眠节律'],
    '节奏': ['昼夜节律'],
    '卫生': ['睡眠卫生'],
    '习惯': ['睡眠卫生', '睡眠改善'],
    '睡前': ['睡前', '安神'],
    '茶': ['安神', '助眠'],
    '食': ['安神'],
    '深度': ['深度睡眠'],
    'insomnia': ['失眠', '睡眠障碍'],
    'sleep': ['睡眠改善', '睡眠质量'],
    'meditation': ['冥想', '正念'],
    'melatonin': ['褪黑素'],
    'rhythm': ['昼夜节律'],
  };

  const usedKws = new Set();
  for (const [trigger, kws] of Object.entries(keywordMap)) {
    if (question.includes(trigger)) {
      kws.forEach(kw => usedKws.add(kw));
    }
  }

  // 默认兜底关键词
  if (usedKws.size === 0) usedKws.add('睡眠改善');

  for (const kw of usedKws) {
    const items = index.keywords[kw] || [];
    items.forEach(item => {
      if (item.title && item.snippet) {
        matches.push(`【${item.kb}】${item.title}\n${item.snippet}`);
      }
    });
  }

  if (matches.length === 0) return '';

  // 最多取 3 条，拼成上下文
  const selected = matches.slice(0, 3);
  return `\n\n以下是来自我的知识库的相关参考内容（请结合这些内容给出更准确的回答）：\n${selected.join('\n\n')}`;
}

/* ===== 通义千问 AI 聊天 ===== */
// 合规提示词（隐藏系统提示）
const QWEN_SYSTEM_PROMPT = `你是一位专业的睡眠与养生健康顾问助手，名叫"眠师"。你的职责是提供睡眠改善建议、养生知识科普和健康生活方式指导。
你拥有丰富的睡眠知识库，包含来自「好睡眠」「正念认知睡眠」等专业知识库的内容。

重要合规规则（必须严格遵守）：
1. 严禁使用任何医疗宣传词汇，包括但不限于：治疗、治愈、根治、医治、疗效、消炎、杀菌、抗癌、抗病毒等
2. 不得对任何疾病作出诊断或治疗建议
3. 所有建议仅供参考，不构成医学意见
4. 遇到需要医疗帮助的情况，必须建议用户咨询专业医生
5. 专注于：睡眠改善、助眠方法、养生食养、生活习惯调节、放松技巧等健康生活方式内容
6. 语气温和、积极、治愈，像一位贴心的健康生活顾问
7. 中文回复，简洁不超过300字
8. 如有参考知识库内容，可以自然地提及"来自专业知识库的建议"`;

const QWEN_API_URL = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation';
// 通义千问 DashScope API Key
const QWEN_API_KEY = window.QWEN_API_KEY || 'sk-063375f955b4451ea6181fc1fa61de24';

async function callQwenAPI(messages) {
  // 获取最后一条用户消息，搜索 IMA 知识库
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  let imaContext = '';
  if (lastUserMsg) {
    imaContext = await searchIMALocal(lastUserMsg.content);
  }

  // 构建增强版系统提示（加入 IMA 知识库上下文）
  const systemWithContext = QWEN_SYSTEM_PROMPT + imaContext;

  try {
    const resp = await fetch(QWEN_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${QWEN_API_KEY}`
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            { role: 'system', content: systemWithContext },
            ...messages
          ]
        },
        parameters: { max_tokens: 500, temperature: 0.7 }
      })
    });
    if (!resp.ok) throw new Error('API error');
    const data = await resp.json();
    return data.output?.text || '抱歉，我暂时无法回答，请稍后再试。';
  } catch (e) {
    return '网络连接问题，请检查后重试。';
  }
}

// ===== AI对话记录存储 =====
const CHAT_STORAGE_KEY = 'mianjing_chat_history';
const CHAT_MAX_RECORDS = 200;

function saveChatHistory(history) {
  try {
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(history.slice(-CHAT_MAX_RECORDS)));
  } catch (e) { /* quota exceeded, silently ignore */ }
}

function loadChatHistory() {
  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) { return []; }
}

function clearChatHistory() {
  localStorage.removeItem(CHAT_STORAGE_KEY);
}

function initAIChat() {
  const fab = document.querySelector('.ai-chat-fab');
  if (!fab) return;

  const btn = fab.querySelector('.ai-chat-btn');
  const window_ = fab.querySelector('.ai-chat-window');
  const input = fab.querySelector('.chat-input-area input');
  const sendBtn = fab.querySelector('.chat-send-btn');
  const messages = fab.querySelector('.chat-messages');

  let chatHistory = loadChatHistory();
  let isOpen = false;

  // 预设欢迎语
  const welcomeMsg = '你好 🌿 我是眠师，你的专属睡眠养生顾问。有关睡眠改善、养生食养或放松技巧的问题，随时告诉我！';

  // 渲染已保存的对话记录
  function restoreHistory() {
    messages.innerHTML = '';
    if (chatHistory.length === 0) {
      addBubble(welcomeMsg, 'bot');
    } else {
      chatHistory.forEach(item => {
        addBubble(item.content, item.role === 'assistant' ? 'bot' : 'user');
      });
    }
  }

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    window_.classList.toggle('open', isOpen);
    if (isOpen && messages.children.length === 0) {
      restoreHistory();
    }
  });

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    addBubble(text, 'user');
    chatHistory.push({ role: 'user', content: text, time: Date.now() });
    saveChatHistory(chatHistory);

    // 打字效果占位
    const typingEl = addBubble('...', 'bot');

    const reply = await callQwenAPI(chatHistory);
    typingEl.textContent = reply;
    chatHistory.push({ role: 'assistant', content: reply, time: Date.now() });
    saveChatHistory(chatHistory);
    messages.scrollTop = messages.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });

  function addBubble(text, role) {
    const div = document.createElement('div');
    div.className = `chat-bubble ${role}`;
    div.textContent = text;
    messages.appendChild(div);
    messages.scrollTop = messages.scrollHeight;
    return div;
  }

  // 暴露清除方法到全局
  window.clearAIChatHistory = function() {
    clearChatHistory();
    chatHistory = [];
    messages.innerHTML = '';
    addBubble(welcomeMsg, 'bot');
    return '对话记录已清除';
  };
}

/* ===== 简易音频播放器 ===== */
function initAudioPlayers() {
  document.querySelectorAll('.audio-card').forEach(card => {
    const playBtn = card.querySelector('.play-btn');
    const progressFill = card.querySelector('.progress-fill');
    if (!playBtn) return;

    let playing = false;
    let interval = null;
    let progress = 0;

    // 演示模式（无真实音频文件时模拟播放）
    const audioSrc = card.dataset.audio;
    let audioEl = null;

    if (audioSrc) {
      audioEl = new Audio(audioSrc);
      audioEl.addEventListener('timeupdate', () => {
        if (progressFill && audioEl.duration) {
          progressFill.style.width = (audioEl.currentTime / audioEl.duration * 100) + '%';
        }
      });
      audioEl.addEventListener('ended', () => {
        playing = false;
        updatePlayIcon();
        if (progressFill) progressFill.style.width = '0%';
      });
    }

    playBtn.addEventListener('click', () => {
      playing = !playing;
      if (audioEl) {
        playing ? audioEl.play() : audioEl.pause();
      } else {
        // 演示进度
        if (playing) {
          interval = setInterval(() => {
            progress += 0.5;
            if (progress >= 100) { progress = 0; playing = false; updatePlayIcon(); clearInterval(interval); }
            if (progressFill) progressFill.style.width = progress + '%';
          }, 200);
        } else {
          clearInterval(interval);
        }
      }
      updatePlayIcon();
    });

    function updatePlayIcon() {
      const icon = playBtn.querySelector('svg');
      if (!icon) return;
      icon.innerHTML = playing
        ? '<rect x="4" y="3" width="4" height="10"/><rect x="10" y="3" width="4" height="10"/>'
        : '<polygon points="5,3 19,8 5,13"/>';
    }
  });
}

/* ===== 评论审核（前端过滤） ===== */
const BANNED_MEDICAL_WORDS = [
  '治疗', '治愈', '根治', '医治', '疗效', '消炎', '杀菌', '抗癌',
  '抗病毒', '处方', '药方', '诊断', '手术', '临床', '医学证明',
  '治好', '痊愈', '医用', 'treat', 'cure', 'diagnose', 'prescription'
];

function filterComment(text) {
  const lower = text.toLowerCase();
  for (const word of BANNED_MEDICAL_WORDS) {
    if (lower.includes(word.toLowerCase())) return false;
  }
  return true;
}

function initCommentForm() {
  const form = document.querySelector('.comment-form');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const textarea = form.querySelector('textarea');
    const nameInput = form.querySelector('input[name="name"]');
    if (!textarea || !nameInput) return;

    const text = textarea.value.trim();
    const name = nameInput.value.trim() || '匿名读者';

    if (!text) return;
    if (!filterComment(text)) {
      showFormMsg(form, '评论内容包含不合规词汇，请修改后重新提交。', 'error');
      return;
    }

    // 模拟提交（实际需对接后端）
    showFormMsg(form, '✓ 评论已提交，审核通过后将显示在页面。感谢您的分享！', 'success');
    textarea.value = '';
    nameInput.value = '';
  });
}

function showFormMsg(form, msg, type) {
  let el = form.querySelector('.form-message');
  if (!el) { el = document.createElement('p'); el.className = 'form-message'; form.appendChild(el); }
  el.textContent = msg;
  el.style.color = type === 'error' ? '#C84B3C' : '#4A6741';
  el.style.fontSize = '0.85rem';
  el.style.marginTop = '0.75rem';
}

/* ===== 数据统计 (GA4 + 百度统计占位) ===== */
function initAnalytics() {
  // Google Analytics 4 (填入 Measurement ID)
  const GA4_ID = window.GA4_ID || 'G-XXXXXXXXXX';
  if (GA4_ID !== 'G-XXXXXXXXXX') {
    const s = document.createElement('script');
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA4_ID}`;
    s.async = true;
    document.head.appendChild(s);
    window.dataLayer = window.dataLayer || [];
    function gtag() { window.dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA4_ID);
    window.gtag = gtag;
  }

  // 百度统计 (填入 sitecode)
  const BAIDU_CODE = window.BAIDU_CODE || '';
  if (BAIDU_CODE) {
    window._hmt = window._hmt || [];
    const bs = document.createElement('script');
    bs.src = `https://hm.baidu.com/hm.js?${BAIDU_CODE}`;
    bs.async = true;
    document.head.appendChild(bs);
  }
}

/* ===== 初始化所有功能 ===== */
document.addEventListener('DOMContentLoaded', () => {
  initNavScroll();
  initMobileMenu();
  initRevealAnimations();
  initAIChat();
  initAudioPlayers();
  initCommentForm();
  initAnalytics();
  initPersistentDisclaimer();
});

/* ===== 国内站持久化免责声明条 ===== */
function initPersistentDisclaimer() {
  // 仅在CN页面显示（通过lang属性或路径判断）
  const htmlLang = document.documentElement.lang;
  const pathHasCn = window.location.pathname.includes('/cn/');
  if (!pathHasCn && htmlLang !== 'zh-CN') return;

  const banner = document.createElement('div');
  banner.id = 'persistent-disclaimer';
  banner.style.cssText = `
    position:fixed;bottom:0;left:0;right:0;z-index:999;
    background:rgba(26,37,32,0.95);color:rgba(249,245,239,0.85);
    padding:0.6rem 1rem;font-size:0.72rem;text-align:center;
    backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
    border-top:1px solid rgba(255,255,255,0.08);
    display:flex;align-items:center;justify-content:center;gap:0.5rem;
    flex-wrap:wrap;
  `;
  banner.innerHTML = `
    <span>⚠️ 本站内容仅供参考，不构成医学建议。如有健康问题请咨询专业医生。</span>
    <a href="disclaimer.html" style="color:var(--clr-gold);font-weight:600;white-space:nowrap;">完整免责声明</a>
    <span style="cursor:pointer;font-size:1.2rem;line-height:1;opacity:0.6;padding:0 0.3rem;" onclick="document.getElementById('persistent-disclaimer').style.display='none';sessionStorage.setItem('disclaimer-dismissed','1');" title="关闭">&times;</span>
  `;

  // 检查是否已关闭
  if (sessionStorage.getItem('disclaimer-dismissed') === '1') return;

  document.body.appendChild(banner);

  // 调整AI悬浮按钮位置，避免被遮挡
  const fab = document.querySelector('.ai-chat-fab');
  if (fab) fab.style.bottom = '50px';

  // 给body加底部内边距
  document.body.style.paddingBottom = '44px';
}
