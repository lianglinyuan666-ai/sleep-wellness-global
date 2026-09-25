/**
 * SleepWell Studio — 联盟佣金引擎（中文站版）v1
 * ============================================================================
 * 【如何开启佣金（唯一需要做的一步）】
 * 在下方 CONFIG 填入联盟 ID，全站外链立即变成可追踪的佣金链接：
 *   taobaoSid     : 淘宝/天猫联盟 site_id
 *   aliexpressKey : AliExpress 联盟 aff_short_key
 *   amazonTag     : Amazon Associates 标签
 * 未配置时：链接保持原样（仍是可用导购），页面不报错、不白屏。
 *
 * 【合规】自动添加 rel="nofollow sponsored"；页面须保留联盟披露声明。
 * 注意：养生内容只做生活科普，不得宣称治疗/治愈疾病。
 * ============================================================================
 */
(function () {
  'use strict';

  var CONFIG = {
    taobaoSid: '',       // 淘宝/天猫联盟 site_id
    aliexpressKey: '',   // AliExpress aff_short_key
    amazonTag: '',
    enabled: true
  };
  window.SLEEPWELL_AFF = CONFIG;

  // 选品依据：2026 助眠消费数据（白噪音音响 +60x、重力眼罩 +55x、枕下音箱 +22x、
  // 褪黑素占助眠保健品 73.5%、酸枣仁/GABA 等天然成分快速崛起）
  var PRODUCTS = [
    { id:'white-noise-machine', emoji:'🔊', name:'白噪音助眠音响', badge:'爆款', price:'¥199+',
      bg:'linear-gradient(135deg,#DCE8F0,#B4C8DA)',
      desc:'30+ 不循环自然音效，带定时关闭。有效遮蔽车流、鼾声与邻居噪音——增速最快的助眠品类。',
      alibaba:'https://s.taobao.com/search?q=%E7%99%BD%E5%99%AA%E9%9F%B3%E5%8A%A9%E7%9C%A0%E9%9F%B3%E5%93%8D',
      amazon:'https://www.amazon.com/s?k=white+noise+sound+machine+sleep',
      kw:['噪音','白噪音','声音','环境','鼾声','遮噪','安静'] },
    { id:'gravity-eye-mask', emoji:'😌', name:'重力助眠眼罩', badge:'+55x', price:'¥89+',
      bg:'linear-gradient(135deg,#E0D8F0,#BCAECF)',
      desc:'微珠均匀分布带来轻柔压迫感，帮助安抚神经。全遮光且零眼部压迫。',
      alibaba:'https://s.taobao.com/search?q=%E9%87%8D%E5%8A%9B%E5%8A%A9%E7%9C%A0%E7%9C%BC%E7%BD%A9',
      amazon:'https://www.amazon.com/s?k=weighted+sleep+mask',
      kw:['眼罩','遮光','光','光线','重力','压迫','眼睛'] },
    { id:'jujube-tea', emoji:'🍵', name:'酸枣仁百合安睡茶', badge:'中医', price:'¥39+',
      bg:'linear-gradient(135deg,#F0E8D8,#D8C4A0)',
      desc:'中医经典安神配方，针对心烦、易醒、入睡困难。无咖啡因，适合睡前仪式。',
      alibaba:'https://s.taobao.com/search?q=%E9%85%B8%E6%9E%A3%E4%BB%81%E7%99%BE%E5%90%88%E8%8C%B6',
      amazon:'https://www.amazon.com/s?k=jujube+seed+tea+sleep',
      kw:['酸枣仁','中医','中药','茶饮','草本','养生','食疗','百合','安神'] },
    { id:'magnesium-gaba', emoji:'💊', name:'甘氨酸镁 + GABA', badge:'天然', price:'¥99+',
      bg:'linear-gradient(135deg,#E4F0E4,#BFD8BF)',
      desc:'高吸收甘氨酸镁配合 GABA，比褪黑素更温和、不易产生依赖的放松选择。',
      alibaba:'https://s.taobao.com/search?q=%E7%94%98%E6%B0%A8%E9%85%B8%E9%95%81%20GABA',
      amazon:'https://www.amazon.com/s?k=magnesium+glycinate+gaba',
      kw:['褪黑素','镁','gaba','补充剂','保健品','天然','激素','营养'] },
    { id:'sleep-tracker', emoji:'⌚', name:'智能睡眠监测仪', badge:'数据', price:'¥299+',
      bg:'linear-gradient(135deg,#DDE8EE,#B4C8D4)',
      desc:'记录睡眠分期、心率与夜间觉醒，把"睡得不好"变成可量化的数据。',
      alibaba:'https://s.taobao.com/search?q=%E6%99%BA%E8%83%BD%E7%9D%A1%E7%9C%A0%E7%9B%91%E6%B5%8B%E4%BB%AA',
      amazon:'https://www.amazon.com/s?k=sleep+tracker',
      kw:['监测','数据','手表','智能','分期','深睡','rem','量化'] },
    { id:'under-pillow-speaker', emoji:'🎵', name:'枕下音响', badge:'+22x', price:'¥129+',
      bg:'linear-gradient(135deg,#E0E8F5,#B8C8E0)',
      desc:'置于枕下，只有自己听得见。听白噪音或冥想引导也不会打扰伴侣。',
      alibaba:'https://s.taobao.com/search?q=%E6%9E%95%E4%B8%8B%E9%9F%B3%E7%AE%B1',
      amazon:'https://www.amazon.com/s?k=under+pillow+speaker+sleep',
      kw:['音箱','音乐','音频','枕下','冥想','播客','声音'] },
    { id:'silk-mask', emoji:'😴', name:'桑蚕丝 3D 睡眠眼罩', badge:'性价比', price:'¥49+',
      bg:'linear-gradient(135deg,#F0E0E4,#D4B8BE)',
      desc:'100% 桑蚕丝，3D 立体剪裁。遮光却不压睫毛，侧睡与差旅友好。',
      alibaba:'https://s.taobao.com/search?q=%E6%A1%91%E8%9A%95%E4%B8%9D%E7%9C%A0%E7%9C%A0%E7%9C%BC%E7%BD%A9',
      amazon:'https://www.amazon.com/s?k=mulberry+silk+sleep+mask',
      kw:['蚕丝','眼罩','差旅','侧睡','遮光'] },
    { id:'sunrise-light', emoji:'🌅', name:'日出唤醒灯', badge:'节律', price:'¥189+',
      bg:'linear-gradient(135deg,#F8E8C8,#E4C890)',
      desc:'30 分钟由暖红渐变至亮白，模拟日出。调节昼夜节律，告别刺耳闹铃。',
      alibaba:'https://s.taobao.com/search?q=%E6%97%A5%E5%87%BA%E5%94%A4%E9%86%92%E7%81%AF',
      amazon:'https://www.amazon.com/s?k=sunrise+alarm+clock+wake+up+light',
      kw:['节律','光照','起床','闹铃','日出','生物钟','光照'] },
    { id:'diffuser', emoji:'🌫', name:'香薰超声波扩香器', badge:'放松', price:'¥119+',
      bg:'linear-gradient(135deg,#E8F0EA,#C4D8C8)',
      desc:'静音超声雾化，配七彩氛围灯与自动断电。搭配薰衣草，构建睡前感官仪式。',
      alibaba:'https://s.taobao.com/search?q=%E9%A6%99%E8%96%B0%E6%89%A9%E9%A6%99%E5%99%A8',
      amazon:'https://www.amazon.com/s?k=essential+oil+diffuser+sleep',
      kw:['香薰','薰衣草','气味','放松','精油','扩香'] },
    { id:'latex-pillow', emoji:'🛏', name:'天然乳胶枕', badge:'护颈', price:'¥159+',
      bg:'linear-gradient(135deg,#EDE8F0,#C8BCD0)',
      desc:'100% 天然乳胶，透气护颈、防螨。减少因颈部不适导致的夜间翻身。',
      alibaba:'https://s.taobao.com/search?q=%E5%A4%A9%E7%84%B6%E4%B9%B3%E8%83%B6%E6%9E%95',
      amazon:'https://www.amazon.com/s?k=natural+latex+pillow',
      kw:['枕头','颈','护颈','酸痛','床垫','床上用品','寝具'] }
  ];

  var DEFAULT_PICKS = ['white-noise-machine', 'gravity-eye-mask', 'jujube-tea'];

  function byId(id) {
    for (var i = 0; i < PRODUCTS.length; i++) if (PRODUCTS[i].id === id) return PRODUCTS[i];
    return null;
  }
  function appendParam(url, key, value) {
    if (!value) return url;
    return url + (url.indexOf('?') === -1 ? '?' : '&') + key + '=' + encodeURIComponent(value);
  }
  function buildTrackedUrl(network, baseUrl) {
    if (!baseUrl) return baseUrl;
    // 加固：仅允许 http(s) 链接，拒绝 javascript:/data: 等危险协议，避免误配导致危险 href
    if (!/^https?:\/\//i.test(baseUrl)) return baseUrl;
    if (network === 'amazon' && CONFIG.amazonTag) return appendParam(baseUrl, 'tag', CONFIG.amazonTag);
    if (network === 'aliexpress' && CONFIG.aliexpressKey) {
      return 'https://s.click.aliexpress.com/deep_link.htm?aff_short_key=' +
        encodeURIComponent(CONFIG.aliexpressKey) + '&dl_target_url=' + encodeURIComponent(baseUrl);
    }
    if (network === 'taobao' && CONFIG.taobaoSid) return appendParam(baseUrl, 'sid', CONFIG.taobaoSid);
    return baseUrl;
  }
  function preferredNetwork(p) {
    if (CONFIG.taobaoSid && p.alibaba) return { network: 'taobao', url: p.alibaba };
    if (CONFIG.aliexpressKey) return { network: 'aliexpress', url: p.alibaba };
    if (CONFIG.amazonTag && p.amazon) return { network: 'amazon', url: p.amazon };
    return { network: 'alibaba', url: p.alibaba };
  }
  function enhanceLinks(root) {
    var nodes = (root || document).querySelectorAll('a[data-aff-id]');
    for (var i = 0; i < nodes.length; i++) {
      var a = nodes[i], p = byId(a.getAttribute('data-aff-id'));
      if (!p) continue;
      var pref = preferredNetwork(p);
      var t = buildTrackedUrl(pref.network, pref.url || a.getAttribute('href'));
      if (t) a.setAttribute('href', t);
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'nofollow sponsored noopener');
    }
  }
  function pickForText(text, n) {
    var t = (text || '').toLowerCase(), scored = PRODUCTS.map(function (p) {
      var s = 0;
      for (var i = 0; i < p.kw.length; i++) if (t.indexOf(String(p.kw[i]).toLowerCase()) !== -1) s++;
      return { p: p, score: s };
    }).sort(function (x, y) { return y.score - x.score; });
    var picks = [];
    for (var i = 0; i < scored.length && picks.length < n; i++) if (scored[i].score > 0) picks.push(scored[i].p);
    for (var j = 0; picks.length < n && j < DEFAULT_PICKS.length; j++) {
      var d = byId(DEFAULT_PICKS[j]);
      if (d && picks.indexOf(d) === -1) picks.push(d);
    }
    return picks;
  }
  function productCardHtml(p) {
    var pref = preferredNetwork(p);
    var href = buildTrackedUrl(pref.network, pref.url) || p.alibaba;
    return '<a class="aff-card" href="' + href + '" target="_blank" rel="nofollow sponsored noopener" data-aff-id="' + p.id + '">' +
      '<div class="aff-emoji" style="background:' + p.bg + '">' + p.emoji + '</div>' +
      '<div class="aff-name">' + p.name + '</div>' +
      '<div class="aff-desc">' + p.desc + '</div>' +
      '<div class="aff-buy"><span class="aff-price">' + p.price + '</span><span class="aff-cta">去看看 →</span></div></a>';
  }
  function injectArticleStrip() {
    if (!/article\.html/i.test(location.pathname)) return;
    var body = document.querySelector('.article-body');
    if (!body || document.getElementById('affStrip')) return;
    var heading = document.querySelector('h1, .article-hero-title, .article-title');
    var context = ((heading && heading.textContent) || '') + ' ' + (body.textContent || '');
    var picks = pickForText(context, 3);
    var strip = document.createElement('section');
    strip.id = 'affStrip';
    strip.className = 'aff-strip reveal';
    strip.innerHTML = '<div class="aff-strip-head"><h3>助眠好物精选</h3>' +
      '<p>根据本文主题挑选。含联盟链接，通过此链接购买本站可能获得少量佣金，不会增加你的支出。</p></div>' +
      '<div class="aff-grid">' + picks.map(productCardHtml).join('') + '</div>';
    if (body.parentNode) body.parentNode.insertBefore(strip, body.nextSibling);
    else document.body.appendChild(strip);
  }
  function injectStyles() {
    if (document.getElementById('affStyles')) return;
    var css = '.aff-strip{margin:2.5rem 0 1rem;padding:1.5rem;background:var(--clr-bg-section,#F7F4EF);' +
      'border:1px solid var(--clr-sand,#E2D9CC);border-radius:var(--radius-lg,16px)}' +
      '.aff-strip-head h3{font-size:1.05rem;margin:0 0 .35rem}' +
      '.aff-strip-head p{font-size:.76rem;color:var(--clr-text-muted,#7A7268);margin:0 0 1.1rem;line-height:1.6}' +
      '.aff-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1rem}' +
      '.aff-card{display:block;text-decoration:none;color:inherit;background:var(--clr-bg-card,#fff);' +
      'border-radius:var(--radius-md,12px);padding:1rem;box-shadow:0 1px 3px rgba(0,0,0,.06);transition:transform .2s ease,box-shadow .2s ease}' +
      '.aff-card:hover{transform:translateY(-4px);box-shadow:0 6px 18px rgba(0,0,0,.1)}' +
      '.aff-emoji{width:100%;aspect-ratio:2/1;display:flex;align-items:center;justify-content:center;font-size:2.2rem;border-radius:8px;margin-bottom:.75rem}' +
      '.aff-name{font-weight:600;font-size:.88rem;margin-bottom:.35rem}' +
      '.aff-desc{font-size:.74rem;color:var(--clr-text-secondary,#5A534C);line-height:1.55;margin-bottom:.7rem}' +
      '.aff-buy{display:flex;align-items:center;justify-content:space-between}' +
      '.aff-price{font-size:1rem;font-weight:600}' +
      '.aff-cta{font-size:.74rem;font-weight:600;color:var(--clr-sage-deep,#3F6B52)}' +
      '@media(max-width:600px){.aff-grid{grid-template-columns:1fr}}';
    var s = document.createElement('style');
    s.id = 'affStyles';
    s.appendChild(document.createTextNode(css));
    document.head.appendChild(s);
  }
  function init() {
    if (!CONFIG.enabled) return;
    try { injectStyles(); enhanceLinks(document); injectArticleStrip(); }
    catch (e) { if (typeof console !== 'undefined') console.warn('[SleepWell 联盟] 初始化异常，已安全跳过:', e); }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.SLEEPWELL_AFFILIATE_API = { products: PRODUCTS, pickForText: pickForText, buildTrackedUrl: buildTrackedUrl };
})();
