/* Guarded GTM installation. See docs/analytics-readiness.md before release.
   No direct GA loader, form events or noscript tracking fallback. */
(function () {
  'use strict';
  // Activation held until the published GTM, GA4 account and preview gates
  // have been checked. Enabling this requires a separately reviewed change.
  var RELEASED = false;
  var DEFAULT_ON = true;
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

  function pageData() {
    var referrer = '';
    try {
      var ref = new URL(document.referrer);
      if (ref.protocol === 'https:' || ref.protocol === 'http:') {
        // Keep reviewed internal paths and known acquisition origins only.
        // An arbitrary referrer hostname/path can itself contain personal data.
        var refPath = ref.pathname.replace(/\.html$/, '').replace(/^\/index$/, '/');
        if (ref.origin === 'https://ahofarms.com') referrer = ref.origin + (pages.indexOf(refPath) !== -1 ? refPath : '/');
        else if (['www.google.com', 'www.google.co.nz', 'www.google.com.au', 'www.bing.com',
          'www.linkedin.com', 'linkedin.com', 'www.facebook.com', 'l.facebook.com',
          'www.instagram.com', 'instagram.com', 'duckduckgo.com'].indexOf(ref.hostname) !== -1) {
          referrer = 'https://' + ref.hostname + '/';
        }
      }
    } catch (_) {}
    var data = {
      aho_analytics_allowed: true,
      aho_page_location: 'https://ahofarms.com' + path,
      aho_page_referrer: referrer,
      aho_page_title: 'Aho Farms ' + path,
      // Empty defaults also prevent stale campaign values on future events.
      aho_campaign_source: '', aho_campaign_medium: ''
    };
    // Campaign fields are values from a finite vocabulary, not arbitrary URL
    // strings. Unknown campaign names/IDs and click identifiers are not sent.
    var params = new URLSearchParams(location.search);
    var sources = ['google', 'bing', 'newsletter', 'linkedin', 'facebook', 'instagram', 'hubspot'];
    var media = ['organic', 'cpc', 'email', 'referral', 'social', 'paid_social'];
    var source = (params.get('utm_source') || '').toLowerCase();
    var medium = (params.get('utm_medium') || '').toLowerCase();
    if (sources.indexOf(source) !== -1) data.aho_campaign_source = source;
    if (media.indexOf(medium) !== -1) data.aho_campaign_medium = medium;
    return data;
  }

  function start() {
    if (!enabled || loaded || location.origin !== 'https://ahofarms.com') return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    // gtag is used only to queue Consent Mode before GTM, never to load GA4.
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('set', 'ads_data_redaction', true);
    window.dataLayer.push({
      'gtm.blocklist': ['html', 'customScripts', 'nonGoogleScripts', 'nonGooglePixels', 'nonGoogleIframes']
    });
    // These fields exist before the Google configuration tag initialises.
    window.dataLayer.push(pageData());
    window.dataLayer.push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
    window.dataLayer.push({ event: 'aho_public_page_view' });
    var script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.googletagmanager.com/gtm.js?id=GTM-WJN7H2PZ';
    document.head.appendChild(script);
  }

  function stop() {
    enabled = false;
    window['ga-disable-' + ID] = true;
    if (loaded) window.dataLayer.push({ aho_analytics_allowed: false });
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
      enabled ? 'Optional analytics are enabled. Query strings and fragments are not included in page addresses sent to analytics.' : 'Optional analytics are off.';
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
