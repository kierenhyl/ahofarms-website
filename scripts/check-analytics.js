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
  if (opts.released) code = code.replace('var RELEASED = false;', 'var RELEASED = true;');
  if (opts.defaultOn) code = code.replace('var DEFAULT_ON = false;', 'var DEFAULT_ON = true;');
  vm.runInNewContext(code, { window, document, navigator: opts.navigator || {}, location, localStorage });
  return { window, location, events, store, children, cookies, requests,
    queue: () => (window.dataLayer || []).map(args => Array.from(args)) };
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
  // The exact committed release gate must defeat even a saved opt-in.
  const off = visit({ choice: 'on', location: { pathname } });
  assert.equal(off.requests.length, 0, `${file} release gate`);
  assert.equal(off.queue().length, 0, `${file} release queue`);
  const active = visit({ released: true, choice: 'on', location: { pathname } });
  assert.equal(active.requests.length, included ? 1 : 0, `${file} runtime scope`);
}
for (const pathname of ['/portal', '/portal/consumer/home', '/patients', '/clinical', '/api/contact/send', '/unknown', '/about/extra', '/about/']) {
  assert.equal(visit({ released: true, defaultOn: true, location: { pathname } }).requests.length, 0, pathname);
}
for (const entry of [
  { choice: 'off' }, { storageFails: true }, { navigator: { globalPrivacyControl: true } },
  { navigator: { doNotTrack: '1' } }, { location: { search: '?email=private@example.test' } },
  { location: { hash: '#patient-detail' } }, { referrer: 'https://example.test/?health=private' },
  { location: { origin: 'http://localhost:8123' } },
]) {
  assert.equal(visit({ released: true, defaultOn: true, ...entry }).requests.length, 0, JSON.stringify(entry));
}
assert.equal(visit({ released: true }).requests.length, 0, 'No invented default consent');
const active = visit({ released: true, choice: 'on' });
assert.equal(active.requests[0].src, 'https://www.googletagmanager.com/gtag/js?id=G-3MS8DHXLX7');
assert.equal(active.requests[0].async, true);
const queue = active.queue();
assert.equal(queue[0][2].ad_storage, 'denied');
assert.equal(queue[0][2].ad_user_data, 'denied');
assert.equal(queue[0][2].ad_personalization, 'denied');
assert.equal(queue[2][2].send_page_view, false);
assert.equal(queue[2][2].allow_google_signals, false);
assert.equal(queue.filter(args => args[0] === 'event').length, 1);
assert.equal(queue[3][1], 'page_view');
assert.equal(queue[3][2].page_location, 'https://ahofarms.com/');
assert.equal(queue[3][2].page_referrer, '');
assert.equal(queue[3][2].page_title, 'Aho Farms /');
assert(!JSON.stringify(queue).includes('form'), 'No form listeners or payload');
active.events.storage({ key: KEY, newValue: 'off' });
assert.equal(active.window['ga-disable-G-3MS8DHXLX7'], true);
assert.equal(active.queue().at(-1)[2].analytics_storage, 'denied');
assert(active.location.reloaded);
assert(active.cookies.length > 0);
assert(active.cookies.every(value => !value.startsWith('session=')));
const privacy = visit({ location: { pathname: '/privacy' } });
assert(!privacy.children.some(child => child.textContent === 'Allow optional analytics'), 'No opt-in while unreleased');
privacy.children.find(child => child.textContent === 'Turn off optional analytics').click();
assert.equal(privacy.store.get(KEY), 'off');
assert(privacy.location.reloaded);
const policy = require('../vercel.json').headers.flatMap(rule => rule.headers).filter(h => h.key === 'Content-Security-Policy');
assert.equal(policy.length, 1, 'No expanded CSP in this staged release');
assert(!policy[0].value.includes('googletagmanager.com'));
console.log(`ANALYTICS CHECK PASS: ${PUBLIC_ANALYTICS_PAGES.size} public / ${pages.length - PUBLIC_ANALYTICS_PAGES.size} excluded pages; release gate, consent, privacy signals, storage, withdrawal, payload and CSP checked.`);
