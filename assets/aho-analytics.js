/* Basic public-page analytics. See docs/analytics-readiness.md before release.
   No GTM container, automatic form events or noscript tracking fallback. */
(function () {
  'use strict';
  // Deliberately off until the GA4 account, consent policy and preview gates
  // have been checked. Enabling this requires a separately reviewed change.
  var RELEASED = false;
  var DEFAULT_ON = false;
  var ID = 'G-3MS8DHXLX7';
  var KEY = 'aho-analytics-choice-v1';
  var pages = ['/', '/about', '/contact', '/cultivation', '/disclaimer',
    '/export-partners', '/news', '/origins', '/privacy', '/products',
    '/quality', '/social-impact', '/team', '/terms', '/tohu', '/whats-new',
    '/news/innovation-extraction', '/news/kaitiakitanga-land-wellness',
    '/news/sustainable-sun-grown'];
  var path = location.pathname.replace(/\.html$/, '').replace(/^\/index$/, '/');
  if (pages.indexOf(path) === -1) return;
  var choice = null;
  var storageWorks = true;
  try {
    choice = localStorage.getItem(KEY);
    localStorage.setItem(KEY + '-check', '1');
    localStorage.removeItem(KEY + '-check');
  } catch (_) { storageWorks = false; }
  var privacySignal = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1';
  var enabled = RELEASED && storageWorks && !privacySignal && choice !== 'off' && (choice === 'on' || DEFAULT_ON);
  // Do not expose URL parameters, fragments or unreviewed referrers to the tag.
  // This also keeps campaign and form data out of automatic URL collection.
  var cleanVisit = !location.search && !location.hash && !document.referrer;
  var loaded = false;
  window['ga-disable-' + ID] = !enabled;

  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach(function (item) {
      var name = item.trim().split('=')[0];
      if (!/^(_ga(?:_|$)|_gid$|_gat(?:_|$))/.test(name)) return;
      var suffix = '=; Max-Age=0; Path=/; SameSite=Lax';
      document.cookie = name + suffix;
      var parts = location.hostname.split('.');
      while (parts.length > 1) {
        document.cookie = name + suffix + '; Domain=' + parts.join('.');
        parts.shift();
      }
    });
  }

  function start() {
    if (!enabled || !cleanVisit || loaded || location.origin !== 'https://ahofarms.com') return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    window.gtag('config', ID, {
      send_page_view: false, allow_google_signals: false,
      allow_ad_personalization_signals: false, ignore_referrer: true,
      page_location: 'https://ahofarms.com' + path,
      page_referrer: '', page_title: 'Aho Farms ' + path
    });
    window.gtag('event', 'page_view', {
      send_to: ID, page_location: 'https://ahofarms.com' + path,
      page_referrer: '', page_title: 'Aho Farms ' + path
    });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + ID;
    document.head.appendChild(script);
  }

  function stop() {
    enabled = false;
    window['ga-disable-' + ID] = true;
    if (loaded && window.gtag) window.gtag('consent', 'update', { analytics_storage: 'denied' });
    clearAnalyticsCookies();
  }

  function save(value) {
    try { localStorage.setItem(KEY, value); }
    catch (_) { stop(); status.textContent = 'Analytics remain off. Your browser could not save this preference.'; return; }
    choice = value;
    if (value === 'off') stop();
    // Reload removes an already loaded third-party script after withdrawal.
    location.reload();
  }

  var settings = document.getElementById('analytics-settings');
  var status;
  if (settings) {
    status = document.createElement('p');
    status.setAttribute('role', 'status');
    status.textContent = !RELEASED ? 'Optional analytics are currently off on this website.' :
      enabled ? 'Optional analytics are enabled. Visits with a query string, fragment or referrer are excluded.' : 'Optional analytics are off.';
    if (choice === 'off') status.textContent += ' Your opt-out is saved in this browser.';
    if (privacySignal) status.textContent += ' Your browser privacy signal is respected.';
    settings.appendChild(status);
    var off = document.createElement('button');
    off.type = 'button'; off.textContent = 'Turn off optional analytics';
    off.addEventListener('click', function () { save('off'); });
    settings.appendChild(off);
    if (RELEASED && storageWorks && !privacySignal) {
      var on = document.createElement('button');
      on.type = 'button'; on.textContent = 'Allow optional analytics';
      on.addEventListener('click', function () { save('on'); });
      settings.appendChild(on);
    }
  }
  // Withdrawal in another tab stops this tab too.
  window.addEventListener('storage', function (event) {
    if (event.key === KEY && event.newValue !== 'on') { stop(); location.reload(); }
  });
  if (!enabled) clearAnalyticsCookies();
  start();
})();
