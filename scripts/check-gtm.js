// Static import and website contract checks. Does not import or execute GTM.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PUBLIC_ANALYTICS_PAGES } = require('./analytics');
const root = path.join(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'docs/gtm/GTM-WJN7H2PZ-public-analytics.json')));
const cv = data.containerVersion;
assert.equal(data.exportFormatVersion, 2);
assert.equal(cv.container.publicId, 'GTM-WJN7H2PZ');
assert.equal(cv.accountId, '6337875715');
assert.equal(cv.containerId, '242787201');
assert.deepEqual(cv.container.usageContext, ['WEB']);
const params = entity => Object.fromEntries((entity.parameter || []).map(p => [p.key, p]));
const table = (entity, key) => Object.fromEntries(params(entity)[key].list.map(row => {
  assert.equal(row.type, 'MAP');
  const p = Object.fromEntries(row.map.map(item => [item.key, item.value]));
  return [p.parameter, p.parameterValue];
}));
const google = cv.tag.find(t => t.tagId === '3');
const page = cv.tag.find(t => t.tagId === '20');
assert.equal(google.type, 'googtag');
assert.deepEqual(google.firingTriggerId, ['18']);
assert.equal(google.paused, undefined);
const settings = table(google, 'configSettingsTable');
for (const key of ['send_page_view', 'allow_google_signals', 'allow_ad_personalization_signals']) assert.equal(settings[key], 'false');
const mapping = { page_location: 'aho_page_location', page_referrer: 'aho_page_referrer',
  page_title: 'aho_page_title', campaign_source: 'aho_campaign_source', campaign_medium: 'aho_campaign_medium' };
const events = table(page, 'eventSettingsTable');
for (const [key, dlv] of Object.entries(mapping)) {
  assert.equal(settings[key], `{{DLV - ${dlv}}}`);
  assert.equal(events[key], settings[key]);
}
assert.equal(params(page).eventName.value, 'page_view');
assert.equal(params(page).measurementIdOverride.value, '{{Google Analytics G-3MS8DHXLX7}}');
assert.equal(page.tagFiringOption, 'ONCE_PER_EVENT');
assert.equal(page.paused, false);
assert.deepEqual(page.firingTriggerId, ['19']);
assert.deepEqual(cv.tag.filter(t => !t.paused).map(t => t.tagId).sort(), ['20', '3']);
for (const id of ['6', '8', '9']) assert.equal(cv.tag.find(t => t.tagId === id).paused, true);
assert.equal(params(cv.tag.find(t => t.tagId === '6')).eventName.value, 'clickEmail');
assert.equal(params(cv.tag.find(t => t.tagId === '8')).eventName.value, 'formSubmits');
const dlvKeys = ['aho_analytics_allowed', ...Object.values(mapping)];
for (const key of dlvKeys) {
  const v = cv.variable.find(item => item.name === `DLV - ${key}`);
  assert.equal(v.type, 'v');
  assert.equal(params(v).name.value, key);
  assert.equal(params(v).dataLayerVersion.value, '2');
}
const init = cv.trigger.find(t => t.triggerId === '18');
const view = cv.trigger.find(t => t.triggerId === '19');
assert.equal(init.type, 'INIT');
assert.equal(view.type, 'CUSTOM_EVENT');
assert.deepEqual(init.filter, view.filter);
assert.equal(view.customEventFilter.length, 1);
const resolve = (value, values) => value.replace(/\{\{(.+?)\}\}/g, (_, name) => String(values[name]));
function matches(condition, values) {
  const p = params(condition), left = resolve(p.arg0.value, values), right = resolve(p.arg1.value, values);
  if (condition.type === 'EQUALS') return left === right;
  assert.equal(condition.type, 'MATCH_REGEX');
  return new RegExp(right).test(left);
}
const values = { 'Page Hostname': 'ahofarms.com', 'DLV - aho_analytics_allowed': true, _event: 'aho_public_page_view' };
for (const file of PUBLIC_ANALYTICS_PAGES) {
  for (const route of ['/' + file, '/' + file.replace(/\.html$/, '').replace(/^index$/, '')]) {
    const vars = { ...values, 'Page Path': route };
    assert(init.filter.every(c => matches(c, vars)), route);
    assert([...view.filter, ...view.customEventFilter].every(c => matches(c, vars)), route);
  }
}
for (const overrides of [{ 'Page Path': '/portal/consumers' }, { 'Page Path': '/about/extra' },
  { 'Page Hostname': 'preview.vercel.app' }, { 'DLV - aho_analytics_allowed': false }, { _event: 'aho_form_success' }]) {
  assert(![...view.filter, ...view.customEventFilter].every(c => matches(c, { ...values, 'Page Path': '/about', ...overrides })));
}
for (const [kind, idKey] of [['tag', 'tagId'], ['trigger', 'triggerId'], ['variable', 'variableId']]) {
  assert.equal(new Set(cv[kind].map(e => e[idKey])).size, cv[kind].length, kind + ' IDs');
}
if (process.argv[2]) {
  const old = JSON.parse(fs.readFileSync(process.argv[2])).containerVersion;
  assert.deepEqual(cv.container, old.container, 'container envelope preserved');
  assert.deepEqual(cv.builtInVariable, old.builtInVariable);
  for (const kind of ['trigger', 'variable']) for (const entity of old[kind]) {
    assert.deepEqual(cv[kind].find(e => e.name === entity.name), entity, entity.name + ' preserved');
  }
  for (const entity of old.tag) {
    const actual = { ...cv.tag.find(e => e.tagId === entity.tagId) }, expected = { ...entity };
    delete actual.fingerprint; delete expected.fingerprint;
    if (entity.tagId === '3') { expected.firingTriggerId = ['18']; expected.parameter = actual.parameter; }
    else expected.paused = true;
    assert.deepEqual(actual, expected, entity.name + ' scoped change only');
  }
  assert.equal(cv.tag.length - old.tag.length, 1);
  assert.equal(cv.trigger.length - old.trigger.length, 2);
  assert.equal(cv.variable.length - old.variable.length, 6);
}
console.log('GTM CHECK PASS: full import; 1 added/4 changed tags, 2 added triggers, 6 added DLVs; guarded page-view contract. No live GTM/GA executed.');
