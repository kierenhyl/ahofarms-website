# Analytics draft: not ready to enable or merge as a tracking launch

This PR stages basic GA4 page views for the existing `G-3MS8DHXLX7` property,
with **RELEASED = false** and **DEFAULT_ON = false**. Neither browser choice
nor a URL parameter can override the release gate. There are no external
analytics requests in the committed configuration. Privacy wording describes
that state. Do not enable tracking without updating that wording too.

## Evidence checked 19 October 2026

- Client main: `bc0d64fffc58acfa30c8f086744877f72f1b4283`.
- [PR #2](https://github.com/Longoreotekooro/ahofarms-website/pull/2) remains
  open. It installs `GTM-WJN7H2PZ` directly and adds an unconditional noscript
  iframe. This is an alternative draft based on main, not a dependent PR.
  Do not merge both implementations: the other loader would bypass this gate.
- Authenticated GTM read-only inspection: **version 6 is Live**, published
  **9 October 2026**, titled “Update GA4 Event - Form Submit tag and Website
  Form Submits trigger”. This supersedes the uncertain publication status of
  the saved 8 October export. Workspace 7 showed zero pending changes.
- Live version 6 lists Google Tag and Hubspot Tag on **Initialization - All
  Pages**, plus GA4 email and form events. Workspace HubSpot HTML loads
  `//js-ap1.hs-scripts.com/443276122.js`. The container is not GA-only.
- Live form trigger filters the fixed `contact_form|partner_form` IDs and
  `Contact enquiry|Partnership enquiry` names on `aho_form_success`. This PR
  deliberately adds no form-success or email-click events.
- The repository enquiry service sends email; embedded HubSpot forms are
  absent. Production delivery, storage, processor contracts and retention
  settings have not been verified. This PR does not certify those systems.

## Code boundary

The runtime and generator explicitly allow only 19 public pages. Portals,
prescriber/pharmacy pages, patient-access article, unknown pages and APIs are
excluded. Only canonical production origin `https://ahofarms.com` may send.
Even in an enabled test configuration, visits with any query, hash or referrer
are excluded. Page title and location use fixed public paths; no arbitrary
titles, query strings, referrers, click targets, form values or user IDs are
queued. Advertising consent is denied and Google signals/personalisation
are disabled in the proposed configuration. GA4 will still receive a network
IP address and device information if activated; this is not anonymous data.

Opt-out persists locally, sets Google's disable flag, clears first-party GA
cookies at `/`, and reloads to remove a loaded tag. Other tabs respond to
withdrawal. Storage failure, GPC and Do Not Track all fail closed. With
JavaScript disabled there is no loader, pixel or iframe fallback.

The CSP is deliberately unchanged: it currently blocks remote Google scripts
and collection. No HubSpot, Ads, DoubleClick, Preview or unsafe-eval exception
has been added. The release gate is not the only unresolved launch dependency.

## Decisions and checks before activation

1. **Consent policy:** the requested preference is default-on. Confirm that
   policy for the actual visitor markets, or approve a supported regional
   consent implementation. No country can be established by this static site
   today. Unknown geography must not silently become default-on. Browser
   language/timezone is not country evidence. No legal compliance conclusion
   has been made here.
2. **GA4 account read-only check:** confirm the web stream ID, enhanced
   measurement (especially forms, outbound links and site search), linked
   destinations, Google signals/ads settings, data retention, access and
   processing arrangements. Disable automatic collection that could send
   personal or form data before enabling this client. The site's current
   GTM container must stay absent; HubSpot forms are a separate workstream.
3. **CSP and approved preview:** a separate reviewed change must add only
   demonstrated GA-only script/collection origins on these public routes.
   Google documents the GA-only CSP requirements [here](https://developers.google.com/tag-platform/security/guides/csp).
   Do not add advertising endpoints to make warnings disappear. The site
   owner must authorise Vercel preview access; do not bypass protection or
   change permissions. No deployment has been requested by this work.
4. **Runtime:** with approved account configuration and preview, verify one
   sanitised page view, no automatic extra/form/health events, no advertising
   or HubSpot requests, effective response headers, excluded routes, opt-out,
   returning visitors, cross-tab withdrawal, blocked storage and JS-off.
   Do not submit real forms or create CRM contacts.
5. **Privacy:** agree the resulting tracking wording alongside activation.
   Aho must confirm the wider provider, overseas transfer, retention and
   portal statements; repository code cannot prove those operational claims.

## Local validation

Run `node scripts/check-analytics.js`, `node scripts/check-nav.js`,
`node scripts/check-launch.js`, and `node scripts/audit-site.js`.
Regenerate only analytics stamps with `node scripts/propagate-analytics.js`.
Shared chrome regeneration also preserves analytics scope. All runtime tests
use local stubs, never Google or HubSpot and never live forms.

The loader follows Google's [manual page-view guidance](https://developers.google.com/analytics/devguides/collection/ga4/views),
including `send_page_view: false` before the explicit event. Account-driven
enhanced measurement remains a separate gate, not a guarantee this option
can enforce.
