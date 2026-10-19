# Guarded GTM installation: activation held

Default-on basic analytics and a privacy-page update are already approved.
`DEFAULT_ON = true` records that preference. `RELEASED = false` is a technical
hold because published GTM version 6 still has unrestricted Google/HubSpot
initialisation and unsanitised automatic measurement. It is not a renewed
request to choose default-on versus opt-in.

This PR replaces [PR #2](https://github.com/Longoreotekooro/ahofarms-website/pull/2)
as the review candidate and includes its intended container ID and public
scope. Both branch from main; do not merge both. PR #2 remains open and
unchanged. The earlier direct-GA4 implementation in PR #3 is superseded.

## Current account evidence, read-only on 19 October 2026

GTM `GTM-WJN7H2PZ`, account `6337875715`, container `242787201`: version **6**
is Live, published **9 October 2026**. Workspace 7 showed zero pending changes.
Published Google Tag uses `G-3MS8DHXLX7`; Google and HubSpot initialise on all
pages. The email event is `clickEmail`. Form event `formSubmits` uses only
fixed form IDs/names on `aho_form_success`; it is not wired by this PR.

GA4 is authenticated, but opens a different property. Its property selector
is absent and the app reports errors; Aho's property could not be positively
selected. Aho's GA4 settings remain **unverified**, not denied or presumed
correct. Kieren can open Aho in Chrome or provide its GA4 Admin/property link.
No GA4/GTM account settings, consent settings or permissions were changed.

## Exact proposed GTM changes, NOT imported or published

The smallest page-view-only release requires these changes to a copy of the
current published container. Preserve the existing tags and legacy event names.
Do not use this document as evidence that the changes have been applied.

| Entity | Proposed change |
|---|---|
| `Hubspot Tag` (tag 9, Custom HTML) | Pause. Remove all-page HubSpot collection from this release. Do not add HubSpot CSP origins. |
| `GA4 Event - Click To Email` (tag 6) | Pause for the page-view-only release. Keep `clickEmail` for later intentional review. |
| `GA4 Event - Form Submit` (tag 8) | Pause. Keep `formSubmits`, existing trigger and fixed form parameters for the separate form workstream. |
| `Google Tag` (tag 3) | Replace unrestricted Initialization - All Pages with an Initialization trigger restricted to the public path scope below, hostname `ahofarms.com`, and `aho_analytics_allowed` equals `true`. Set `send_page_view=false`, `allow_google_signals=false`, `allow_ad_personalization_signals=false`. Override `page_location`, `page_title`, `page_referrer`, `campaign_source`, `campaign_medium` from the matching DLVs below. |
| New `GA4 Event - Public Page View` | Native GA4 Event template, measurement ID `G-3MS8DHXLX7`, event `page_view`, once per event. Set `page_location`, `page_title`, `page_referrer` from the matching DLVs. Trigger only on `aho_public_page_view`, with the same allowed/hostname/public-path restrictions. |
| Six new DLVs (Version 2) | `aho_analytics_allowed`, `aho_page_location`, `aho_page_title`, `aho_page_referrer`, `aho_campaign_source`, `aho_campaign_medium`. Use these exact keys; no DOM/form variables. |

Public Page Path condition (anchor the complete value):

```text
^/((?:(?:index|about|contact|cultivation|disclaimer|export-partners|news|origins|privacy|products|quality|social-impact|team|terms|tohu|whats-new)|news/(?:innovation-extraction|kaitiakitanga-land-wellness|sustainable-sun-grown))(?:\.html)?|)$
```

The loader queues Consent Mode before GTM: analytics granted only after its
release/preference/privacy-signal gates; all advertising purposes denied.
It queues the six sanitised fields before `gtm.js`, then exactly one
`aho_public_page_view` event. The Google configuration initialises with those
fields before the explicit page-view event is processed. A client-side GTM
blocklist also blocks Custom HTML/non-Google script/pixel/iframe types as
added protection, not as a substitute for pausing the HubSpot tag.

This is a native-template configuration specification, not an import file.
The source export does not contain a Google configuration-settings-table
example, so no opaque JSON parameter schema has been invented. Prepare/export
that native configuration in an authorised test workspace before importing
or publishing anything. None has been created by this work.

## What the website code does

- Installs one local bootstrap on 19 explicit public pages; 27 others remain
  excluded, including portals, prescribers, pharmacies and the patient article.
- When released, default-on applies unless this browser opted out, storage is
  blocked, GPC or DNT is set. Production host is pinned. Ordinary internal,
  search, campaign and fragment-bearing visits remain eligible.
- Sends canonical allowlisted page paths and fixed titles, never URL query or
  fragment data. Internal referrers retain only reviewed paths. Known search/
  social referrers retain origin only. Unknown referrer hosts become empty,
  while their visits are still counted. Known campaign source/medium values
  are retained through a finite vocabulary; arbitrary campaigns, IDs, click
  identifiers and personal/form/health data are not forwarded.
- Stores opt-out locally, sets the GA disable flag and allowed=false, clears
  first-party GA cookies at `/`, denies analytics consent and reloads. Other
  tabs respond to withdrawal. No noscript iframe/pixel can bypass the choice.
- Does not load `gtag/js` or configure/send direct GA4 events. There is no
  HubSpot form embed, email-click handler or form-success emitter in this PR.

## CSP

The additional policy applies only to the same 19 clean/HTML public routes.
Global/portal policy and middleware are unchanged. Added script origin:
`https://www.googletagmanager.com`. Added connection origins:
`https://www.googletagmanager.com`, `https://www.google-analytics.com`,
`https://region1.google-analytics.com`, `https://www.google.com`.
The existing HTTPS image directive already permits GA images. There is no
HubSpot, DoubleClick, Ads, unsafe-eval, Preview-only or noscript frame exception.
These are proposed baseline GA-only origins based on [Google's CSP guide](https://developers.google.com/tag-platform/security/guides/csp).
Effective Vercel headers and real Google delivery still require an authorised
preview; static matcher checks are not proof of actual delivery.

## Exact next steps

1. **Kieren:** open Aho's GA4 property or provide its Admin URL. Then the agent
   can verify the stream matches the measurement ID, enhanced measurement
   (especially forms, outbound clicks, search/history), user-provided data,
   linked destinations, signals/advertising and retention read-only. Disable
   automatic/extra collection through a separately authorised account change
   if found; do not silently accept it.
2. **Aho/privacy adviser:** only determine whether any intended visitor markets
   require prior consent or another exception to default-on. The preference
   itself is settled. Do not assume an overseas legal rule applies solely
   because a visitor might exist there. If a regional exception is required,
   implement a trusted server-country policy and fail closed for unknown
   country. Vercel documents `x-vercel-ip-country`, but this site does not yet
   expose it to the client and local tests do not prove production geo.
3. **Authorised GTM operator:** review/test the exact changes above in a copy,
   then separately approve publication. The agent must not import or publish
   them under this task. Without that publication, enabling this loader would
   use the current v6 configuration and is not safe to treat as page-view-only.
4. **Longo/Vercel team owner:** authorise the PR preview through the exact
   GitHub Vercel status link. No protection bypass or permission change by the
   agent. A production-only host guard still needs an explicit test fixture or
   reviewed preview-host configuration to exercise the release path.
5. **Engineering:** after those checks, run controlled real-tag network tests
   with approved test data/property, verify one sanitised event and no HubSpot/
   advertising/form events, effective CSP, exclusions, withdrawal and JS-off.
   Update privacy activation wording and release the gate in the same review.

For applicable consent rules, the [ICO guidance](https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guide-to-pecr/cookies-and-similar-technologies/)
requires a positive choice for non-essential cookies and warns that a privacy
notice alone is insufficient; that page itself notes a guidance revision is
under consultation. It does not establish applicability to Aho. No legal
compliance certification or blanket worldwide opt-in requirement is asserted.

## Local validation

`node scripts/check-analytics.js` checks release/default-on gates, 19/27 scope,
ordinary referrals/UTMs/fragments, sanitised payloads, no direct GA calls,
withdrawal and scoped GA-only CSP. Nav/launch/audit and isolated full rebuild
checks also apply. Local network fixtures replace GTM with a localhost capture
stub, enforce same-origin-only CSP and send no Google/HubSpot traffic. They
prove the site's event contract, not the actual published container or GA4
account's behaviour. No live forms or leads are created.
