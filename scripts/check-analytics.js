// No packages, external requests or form submissions. The browser runtime is
// exercised with a deliberately small DOM and Google tag queue, not a live tag.
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { listPages } = require('./propagate-nav-pages');
const { PUBLIC_ANALYTICS_PAGES, stampAnalytics } = require('./analytics');
const root = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'assets/aho-analytics.js'), 'utf8');
const KEY = 'aho-analytics-choice-v1';

function visit(opts = {}) {
  const events = {}, cookies = [], requests = [], children = [];
  const store = new Map(opts.choice ? [[KEY, opts.choice]] : []);
  const location = Object.assign({ pathname: '/', search: '', hash: '',
    origin: 'https://ahofarms.com', hostname: 'ahofarms.com', reload() { this.reloaded = true; } }, opts.location);
  function element() { return { addEventListener(name, handler) { this[name] = handler; },
    setAttribute() {}, appendChild(child) { children.push(child); } }; }
  const window = { addEventListener(name, handler) { events[name] = handler; } };
  const document = { referrer: opts.referrer || '',
    head: { appendChild(script) { requests.push(script); } },
    createElement: element,
    getElementById: () => location.pathname === '/privacy' ? element() : null };
  Object.defineProperty(document, 'cookie', { get: () => '_ga=old; _ga_TEST=old; session=keep', set: value => cookies.push(value) });
  const localStorage = {
    getItem: key => { if (opts.storageFails) throw Error('blocked'); return store.get(key) || null; },
    setItem: (key, value) => { if (opts.storageFails) throw Error('blocked'); store.set(key, value); },
    removeItem: key => store.delete(key),
  };
  let code = source;
  if (typeof opts.released === 'boolean') {
    code = code.replace(/var RELEASED = (?:false|true);/, `var RELEASED = ${opts.released};`);
  }
  if (opts.defaultOn === false) code = code.replace('var DEFAULT_ON = true;', 'var DEFAULT_ON = false;');
  vm.runInNewContext(code, { window, document, navigator: opts.navigator || {}, location, localStorage, URL, URLSearchParams });
  return { window, location, events, store, children, cookies, requests,
    queue: () => (window.dataLayer || []).map(args => args[0] ? Array.from(args) : args) };
}

const pages = listPages();
for (const file of pages) {
  const html = fs.readFileSync(path.join(root, file), 'utf8');
  const included = PUBLIC_ANALYTICS_PAGES.has(file);
  assert.equal((html.match(/src="[^"\n]*aho-analytics\.js\?v=/g) || []).length, included ? 1 : 0, file);
  assert.equal((html.match(/>Analytics settings<\/a>/g) || []).length, included ? 1 : 0, `${file} settings access`);
  assert.equal(stampAnalytics(html, file), html, `${file} idempotence`);
  assert(!/googletagmanager\.com\/(gtm\.js|ns\.html)|<script[^>]+src=["'][^"']*(?:gtag\/js|hs-scripts|hubspot)/i.test(html), `${file} unconditional tracker`);
  const pathname = '/' + file.replace(/\.html$/, '').replace(/^index$/, '');
  // Exercise both release states independently of the committed setting.
  const off = visit({ released: false, choice: 'on', location: { pathname } });
  assert.equal(off.requests.length, 0, `${file} release gate`);
  assert.equal(off.queue().length, 0, `${file} release queue`);
  const active = visit({ released: true, choice: 'on', location: { pathname } });
  assert.equal(active.requests.length, included ? 1 : 0, `${file} runtime scope`);
  assert.equal(visit({ released: true, location: { pathname: '/' + file } }).requests.length,
    included ? 1 : 0, `${file} HTML runtime scope`);
}
for (const pathname of ['/portal', '/portal/consumer/home', '/patients', '/clinical', '/api/contact/send', '/unknown', '/about/extra', '/about/']) {
  assert.equal(visit({ released: true, defaultOn: true, location: { pathname } }).requests.length, 0, pathname);
}
for (const entry of [
  { choice: 'off' }, { storageFails: true }, { navigator: { globalPrivacyControl: true } },
  { navigator: { doNotTrack: '1' } }, { location: { origin: 'http://localhost:8123' } },
]) {
  assert.equal(visit({ released: true, ...entry }).requests.length, 0, JSON.stringify(entry));
}
assert.equal(visit({ released: true }).requests.length, 1, 'Default-on is the settled preference');
assert.equal(visit({ released: true, defaultOn: false }).requests.length, 0, 'Optional regional opt-in can fail closed');
const scenarios = [
  { name: 'direct', referrer: '' },
  { name: 'internal', referrer: 'https://ahofarms.com/?email=private@example.test#private' },
  { name: 'Google', referrer: 'https://www.google.com/search?q=private-health-detail' },
  { name: 'UTM', location: { search: '?utm_source=newsletter&utm_medium=email&utm_campaign=private@example.test' } },
  { name: 'fragment', location: { hash: '#private-health-detail' } },
  { name: 'unknown-referral', referrer: 'https://private.example.test/patient/secret?email=private@example.test' },
];
for (const scenario of scenarios) {
  const result = visit({ released: true, location: { pathname: '/about', ...scenario.location }, referrer: scenario.referrer });
  assert.equal(result.requests.length, 1, scenario.name + ': no discarded visit');
  assert.equal(result.requests[0].src, 'https://www.googletagmanager.com/gtm.js?id=GTM-WJN7H2PZ');
  assert.equal(result.requests[0].async, true);
  const queue = result.queue();
  assert.equal(queue[0][0], 'consent');
  assert.equal(queue[0][2].ad_storage, 'denied');
  assert.equal(queue[0][2].ad_user_data, 'denied');
  assert.equal(queue[0][2].ad_personalization, 'denied');
  assert(queue.find(item => item['gtm.blocklist'])['gtm.blocklist'].includes('html'));
  const data = queue.find(item => item.aho_page_location);
  assert.equal(data.aho_page_location, 'https://ahofarms.com/about');
  assert.equal(data.aho_page_title, 'Aho Farms /about');
  assert.equal(queue.filter(item => item.event === 'aho_public_page_view').length, 1);
  assert(queue.indexOf(data) < queue.findIndex(item => item.event === 'gtm.js'), 'Sanitised fields precede tag initialisation');
  assert(!queue.some(item => item[0] === 'config' || item[0] === 'event'), 'No direct GA4 configuration or event calls');
  assert(!JSON.stringify(queue).includes('private'), 'No raw personal URL or campaign data');
  if (scenario.name === 'Google') assert.equal(data.aho_page_referrer, 'https://www.google.com/');
  if (scenario.name === 'internal') assert.equal(data.aho_page_referrer, 'https://ahofarms.com/');
  if (scenario.name === 'UTM') { assert.equal(data.aho_campaign_source, 'newsletter'); assert.equal(data.aho_campaign_medium, 'email'); }
}
const active = visit({ released: true });
active.events.storage({ key: KEY, newValue: 'off' });
assert.equal(active.window['ga-disable-G-3MS8DHXLX7'], true);
assert.equal(active.queue().at(-1)[2].analytics_storage, 'denied');
assert(active.queue().some(item => item.aho_analytics_allowed === false));
assert(active.location.reloaded);
assert(active.cookies.length > 0);
assert(active.cookies.every(value => !value.startsWith('session=')));
const privacy = visit({ released: false, location: { pathname: '/privacy' } });
assert(!privacy.children.some(child => child.textContent === 'Allow optional analytics'), 'No opt-in while unreleased');
privacy.children.find(child => child.textContent === 'Turn off optional analytics').click();
assert.equal(privacy.store.get(KEY), 'off');
assert(privacy.location.reloaded);
const enabledPrivacy = visit({ released: true, location: { pathname: '/privacy' } });
assert.equal(enabledPrivacy.requests.length, 1);
enabledPrivacy.children.find(child => child.textContent === 'Turn off optional analytics').click();
assert.equal(enabledPrivacy.store.get(KEY), 'off');
assert.equal(enabledPrivacy.window['ga-disable-G-3MS8DHXLX7'], true);
assert.equal(enabledPrivacy.queue().at(-1)[2].analytics_storage, 'denied');
assert(enabledPrivacy.location.reloaded);
const optedOutPrivacy = visit({ released: true, choice: 'off', location: { pathname: '/privacy' } });
assert.equal(optedOutPrivacy.requests.length, 0);
assert.equal(optedOutPrivacy.queue().length, 0);
optedOutPrivacy.children.find(child => child.textContent === 'Allow optional analytics').click();
assert.equal(optedOutPrivacy.store.get(KEY), 'on');
assert(optedOutPrivacy.location.reloaded);
const config = require('../vercel.json');
const cspRules = config.headers.filter(rule => rule.headers.some(h => h.key === 'Content-Security-Policy'));
assert.equal(cspRules.length, 2);
const policy = rule => rule.headers.find(h => h.key === 'Content-Security-Policy').value;
assert(!policy(cspRules[0]).includes('googletagmanager.com'), 'Portal CSP stays unchanged');
const csp = policy(cspRules[1]);
for (const host of ['https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://region1.google-analytics.com', 'https://www.google.com']) assert(csp.includes(host));
assert(!/hs-scripts|hubspot|doubleclick|googlesyndication|unsafe-eval/.test(csp));
const route = new RegExp('^' + cspRules[1].source + '$');
assert(route.test('/'));
for (const file of pages) {
  assert.equal(route.test('/' + file), PUBLIC_ANALYTICS_PAGES.has(file), file + ' CSP');
  assert.equal(route.test('/' + file.replace(/\.html$/, '')), PUBLIC_ANALYTICS_PAGES.has(file), file + ' clean CSP');
}
for (const url of ['/portal', '/portal/consumer/home', '/patients', '/api/contact/send', '/about/extra']) assert(!route.test(url));
console.log(`ANALYTICS CHECK PASS: ${PUBLIC_ANALYTICS_PAGES.size} public / ${pages.length - PUBLIC_ANALYTICS_PAGES.size} excluded; GTM gate, default-on, normal referrals/UTMs, sanitisation, withdrawal and GA-only CSP checked.`);
