# Public-page analytics release

PR #3 contains the activation change: `RELEASED = true`, default-on analytics,
accurate privacy wording and browser opt-out. **Publish the reviewed GTM import
before merging the website PR.** The JSON has not been imported or published
by this work. Account checks and real delivery below remain unverified; keep
the PR draft until they pass. Merging against the old container is unsafe.

This is the review candidate replacing
[PR #2](https://github.com/Longoreotekooro/ahofarms-website/pull/2), which remains
open and unchanged. Do not merge both. The four approved temporary noindex
pages from commit `dca41db` are preserved.

## Import file and expected changes

Use [GTM-WJN7H2PZ-public-analytics.json](gtm/GTM-WJN7H2PZ-public-analytics.json).
It is a full Version 2 WEB export for account `6337875715`, container
`242787201`, public ID `GTM-WJN7H2PZ`. Source: Kieren's supplied
`GTM-WJN7H2PZ_workspace7.json`, exported **20 October 2026 00:24:24 UTC**.
This is a workspace export (`containerVersionId: 0`), not a saved version 6
export. Its entities match the architecture inspected in published version 6
(live since 9 October), with the current form-event settings and fingerprints.
No second export is needed unless the workspace/container changes meanwhile.

| Entity | Change |
|---|---|
| Existing Google Tag (3) | Restricted Initialization trigger; `send_page_view=false`, Google signals and ad personalisation disabled; sanitised page/referrer/title/campaign fields supplied. Measurement ID remains `G-3MS8DHXLX7`. |
| Existing email tag (6) | Paused; original `clickEmail` event and trigger retained. |
| Existing form tag (8) | Paused; original `formSubmits`, success trigger and fixed form parameters retained for separate form work. |
| Existing Hubspot Tag (9) | Paused; loader retained without permitting HubSpot in CSP. |
| New GA4 Event - Public Page View (20) | One native `page_view` per `aho_public_page_view`, with sanitised page/referrer/title and recognised source/medium values. |
| New triggers (18, 19) | Public Analytics Initialization and Public Page View; both require allowed=true, hostname `ahofarms.com` and complete public-path match. |
| Six new DLVs (12–17) | Version 2 keys: `aho_analytics_allowed`, `aho_page_location`, `aho_page_referrer`, `aho_page_title`, `aho_campaign_source`, `aho_campaign_medium`. |

Expected import: **1 added tag, 4 modified tags (including 3 paused), 2 added
triggers, 6 added variables, 0 deleted entities**. Existing two triggers, three
variables, seven built-ins, names, IDs and unrelated settings are preserved.
No Custom HTML or custom template is added. This must not be a zero-change
import. Duplicate renamed Google tags would leave the old unrestricted tag
active, so use the conflict setting below.

Kieren: **Admin → Import Container → select this JSON → New workspace → Merge
→ Overwrite conflicting tags, triggers and variables**. This is Merge with
conflict overwrite, not the top-level Overwrite option. Continue → View
Detailed Changes; confirm the list above. Stop if it differs. Test, then
publish before the website merge. See [Google's import instructions](https://support.google.com/tagmanager/answer/6106997?hl=en).

## Required account and delivery checks before merge

1. Open the Aho GA4 web stream for **G-3MS8DHXLX7**: Admin → Data collection
   and modification → Data streams → matching web stream. Turn **Enhanced
   measurement off** for this page-view-only setup, including history page
   changes and form interactions. Confirm user-provided data collection is
   off, and the Google tag has only the intended GA4 destination, with no
   Ads/remarketing destination. These settings are outside container JSON.
   The authenticated GA4 app previously opened another property and did not
   expose a usable selector; Aho's settings have not been verified. Kieren
   can open the correct property in Chrome or supply its Admin link for a
   read-only check. No new access or permissions are requested.
2. In GTM, inspect the imported Google tag's Configuration settings: false
   values must be boolean-effective, not truthy strings. Confirm the new
   native event receives the same sanitised values and Google initialises
   first. JSON table structure is based on an existing native Google-tag
   export seed; validator success is not proof of import or runtime success.
   `send_page_view=false` suppresses load pageviews; it does **not** disable
   enhanced-measurement history pageviews. [Google's pageview guide](https://developers.google.com/analytics/devguides/collection/ga4/views).
3. The Vercel team owner must authorise the PR preview through its GitHub
   status link. Current preview is blocked by “Authorization required to
   deploy.” No bypass or permission change was attempted. Validate effective
   public and portal CSP headers. The production hostname guard intentionally
   prevents collection from previews; use an explicitly reviewed local
   production-origin test fixture or the authorised final production smoke
   check, not an invented preview-host exception.
4. After import, verify in Tag Assistant/GA4 DebugView with approved test
   traffic: one page_view per allowed page load, no duplicate automatic page
   view, no clickEmail/formSubmits/form_start/form_submit/HubSpot/Ads requests.
   Check direct, internal, search and recognised newsletter/email campaign
   visits; raw query strings, fragments and synthetic private values must
   not appear in Google requests. Check a portal route sends nothing. Check
   Privacy opt-out stops collection, clears accessible GA cookies and remains
   off after reload and in another open tab; GPC/DNT/storage-blocked visits
   send nothing. JavaScript-off visits have no noscript tracker. Do not submit
   live enquiry or portal forms to test.

## Website behaviour and limits

The local loader is present on 19 reviewed public pages; 27 other pages are
excluded, including portals, prescribers, pharmacies and the patient article.
It loads GTM only on `https://ahofarms.com`. Browser opt-out, blocked storage,
GPC and DNT prevent loading. It queues consent (analytics granted, all ad
purposes denied) and sanitised fields before GTM initialisation, then one
explicit page-view event. A client blocklist also blocks Custom HTML and
non-Google script/pixel/iframe types; the HubSpot pause remains required.

Only canonical allowlisted public paths and fixed titles are supplied.
Internal referrers retain reviewed paths; known search/social referrers retain
origin only. Unknown referrers become empty while visits still count. Campaign
source/medium use finite vocabularies, with no arbitrary campaign name/ID,
click ID, DOM, form or health values. Browser cookie/device/session and network
information still exists; analytics is not anonymous. Automatic GA collection
must be disabled/checked as above because a native Google script can otherwise
read the raw page independently of our six supplied fields.

Opt-out is local to the browser. Withdrawal sets GA's disable flag, allowed=false,
denies analytics consent, clears accessible `_ga`/`_gid`/`_gat` cookies and
reloads, including cross-tab withdrawal. There is no direct GA loader or
noscript iframe. HubSpot forms remain a separate workstream.

Default-on is the approved preference and applies globally. The site has no
trusted country mechanism; GPC/DNT are privacy signals, not geography. No
country is invented and no claim of worldwide legal compliance is made.
Any required regional exception needs a confirmed policy and supported country
signal before release to the affected market.

CSP permits GTM script loading and baseline Google Analytics collection on
only the public routes. No HubSpot, DoubleClick, Ads, unsafe-eval or noscript
frame exception was added. Overlapping global/public rules need effective
Vercel-header verification; local regex tests do not establish delivery.

## Validation performed

- `gtm_json.py validate ... --against <supplied source>`: full export valid,
  no errors or warnings.
- `node scripts/check-gtm.js <supplied source>`: exact preservation and
  intended additions/modifications, references, native parameter maps,
  trigger gates and public/HTML path contract.
- `node scripts/check-analytics.js`: both release states, 19/27 scope,
  sanitisation, normal referral/campaign visits, saved opt-out, Privacy-button
  withdrawal/re-enable, cross-tab withdrawal, GPC/DNT/storage and CSP scope.
- `node scripts/check-indexing.js`: four temporary noindex/follow pages,
  sitemap exclusions and preserved access/links; other page scope unchanged.

These tests use static validation and a stub DOM/queue; they do not execute
Google/HubSpot or prove GA receipt. Earlier local browser network capture used
a localhost GTM stub and proves only the site's event contract. No actual GTM
import, real-tag delivery, GA4 receipt or deployment is claimed.
