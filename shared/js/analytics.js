/**
 * 眠境·养生 — 统一统计分析
 * 
 * 支持：百度统计 + Google Analytics 4
 * 
 * 配置方法：
 *   1. 在页面 <head> 中定义全局变量（本文件之前）：
 *      <script>window.BAIDU_TONGJI_ID = 'your-baidu-id';</script>
 *      <script>window.GA4_MEASUREMENT_ID = 'G-XXXXXXXXXX';</script>
 *   2. 引入本文件：<script src="../shared/js/analytics.js"></script>
 */

(function () {
  'use strict';

  const BAIDU_ID = window.BAIDU_TONGJI_ID || '';
  const GA4_ID = window.GA4_MEASUREMENT_ID || '';

  // ==================== 百度统计 ====================
  if (BAIDU_ID) {
    var _hmt = _hmt || [];
    (function () {
      var hm = document.createElement('script');
      hm.src = 'https://hm.baidu.com/hm.js?' + BAIDU_ID;
      var s = document.getElementsByTagName('script')[0];
      s.parentNode.insertBefore(hm, s);
    })();
    console.log('[Analytics] 百度统计已加载:', BAIDU_ID);
  } else {
    console.log('[Analytics] 百度统计未配置（缺少 BAIDU_TONGJI_ID）');
  }

  // ==================== Google Analytics 4 ====================
  if (GA4_ID) {
    var gaScript = document.createElement('script');
    gaScript.async = true;
    gaScript.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID;
    document.head.appendChild(gaScript);

    window.dataLayer = window.dataLayer || [];
    function gtag() { dataLayer.push(arguments); }
    gtag('js', new Date());
    gtag('config', GA4_ID, {
      send_page_view: true,
      cookie_flags: 'SameSite=None;Secure',
    });
    console.log('[Analytics] Google Analytics 4 已加载:', GA4_ID);
  } else {
    console.log('[Analytics] GA4 未配置（缺少 GA4_MEASUREMENT_ID）');
  }

  // ==================== 页面浏览事件（用于SPA/单页跟踪） ====================
  window.trackPageView = function (pagePath) {
    if (BAIDU_ID && window._hmt) {
      _hmt.push(['_trackPageview', pagePath || window.location.pathname]);
    }
    if (GA4_ID && window.gtag) {
      gtag('event', 'page_view', { page_path: pagePath || window.location.pathname });
    }
  };

  // ==================== 自定义事件 ====================
  window.trackEvent = function (category, action, label, value) {
    // 百度统计事件
    if (BAIDU_ID && window._hmt) {
      _hmt.push(['_trackEvent', category, action, label, value]);
    }
    // GA4事件
    if (GA4_ID && window.gtag) {
      gtag('event', action, {
        event_category: category,
        event_label: label,
        value: value,
      });
    }
  };
})();
