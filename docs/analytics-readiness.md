# Standard GA4 release and handoff

This revision supersedes the earlier manual-page-view JSON and the advice to
turn Enhanced Measurement off. Use the current
[GTM-WJN7H2PZ-public-analytics.json](gtm/GTM-WJN7H2PZ-public-analytics.json).

The site uses the standard Google tag's automatic page view. Enhanced
Measurement stays **on**. The only custom action is the existing `clickEmail`
event for the fixed public business email link. It measures click intent,
not a sent email or lead. No public phone links were found. Confirmed form
conversions remain deferred to the separate HubSpot workstream.

## Minimal handoff

1. Kieren imports this replacement into the intended GTM workspace: **Merge →
   Overwrite conflicting tags, triggers and variables**. Inspect detailed
   changes below, confirm the manual page-view tag is paused, then publish.
   A new workspace is simplest; if the earlier draft was imported but not
   published, either use its workspace and merge this replacement there, or
   leave that earlier workspace unpublished. Do not later publish an old
   workspace over this replacement.
2. In the matching GA4 stream (`G-3MS8DHXLX7`), leave Enhanced Measurement on.
   Under its settings, turn **Site Search only off**: there is no public site
   search, and this feature independently reads `q`, `s`, `search`, `query`
   and `keyword` values from the real URL. Sanitising page_location alone
   does not scrub search_term. If Enhanced Measurement was turned off for the
   earlier draft, turn it back on. No blanket disabling of form, scroll,
   outbound, download, video or history options is required by this revision.
3. The client reviews/merges PR #3. We verify live delivery after merge.
   No Vercel preview is required for the agreed handoff. We have not imported
   or published GTM, changed account settings, merged or deployed anything.

Google documents [Merge/conflict overwrite and detailed changes](https://support.google.com/tagmanager/answer/6106997?hl=en).
This PR remains the replacement review candidate for [PR #2](https://github.com/Longoreotekooro/ahofarms-website/pull/2),
which remains open and unchanged. Do not merge both.

## What changed in the container

Full Version 2 WEB export, account `6337875715`, container `242787201`, public
ID `GTM-WJN7H2PZ`. Baseline: Kieren's supplied workspace 7 export from
20 October 2026 00:24:24 UTC (`containerVersionId: 0`, a workspace export).
Its architecture matches the previously inspected live version 6. All source
entities and container details are retained.

| Entity | Current configuration |
|---|---|
| Google Tag (3) | Native tag, existing G-3MS8DHXLX7 constant. `send_page_view=true`; restricted Initialization trigger 18. Sanitised page/referrer/title plus six normal campaign fields. Google signals and ad personalisation remain false. |
| GA4 Event - Click To Email (6) | Active, original event name `clickEmail`; parameters only fixed `contact_method=email` and sanitised page/referrer/title. No clicked URL, link text, email input or form values in this custom payload. |
| Email Click trigger (5) | Native Just Links. Exact `mailto:admin@ahofarms.com`, production hostname, public path and allowed=true. Arbitrary addresses, mailto query strings and private routes cannot trigger this custom event. |
| GA4 Event - Form Submit (8) | Paused; legacy success event, fixed parameters and trigger retained for later form work. |
| Hubspot Tag (9) | Paused; no HubSpot loader/CSP expansion. |
| GA4 Event - Public Page View (20) | **Paused**, same ID/name as the earlier generated file. Included deliberately so Merge overwrites an already-imported active manual tag. It must stay paused alongside automatic pageviews. |
| Triggers 18/19 | Restricted Initialization remains active. Earlier manual custom-event trigger 19 is retained but unused; no site code emits `aho_public_page_view`. |
| DLVs 12–17, 21–24 | Allowed flag, canonical page/referrer/title and six campaign fields. Existing source variables/built-ins are preserved. |

Expected detailed changes, ignoring export fingerprints:

| Import baseline | Tags | Triggers | Variables | Deletions |
|---|---|---|---|---|
| Kieren's original workspace 7 | 1 added **paused** compatibility tag; 4 modified (Google/email active, form/HubSpot paused) | 2 added; Email Click modified | 10 added | 0 |
| Earlier generated manual-PV file | 3 modified: Google automatic PV on, email on, manual PV paused | Email Click modified | 4 added campaign DLVs | 0 |

The compatibility tag is intentionally present even in an original-baseline
import. Omitting it from a Merge would not delete an earlier imported copy.
Do not use Rename conflicts or accept a second active manual page-view tag.
Pause any manually renamed copy of `GA4 Event - Public Page View` before
publishing if one was created outside these instructions. Check there is one
active Google tag, one active email event, no active manual page-view tag and
no active HubSpot/custom form tag. A zero-change import is not expected unless
this exact replacement is already imported.

## Standard measurement and safe URL handling

Google's [page-view guide](https://developers.google.com/analytics/devguides/collection/ga4/views)
supports automatic initial pageviews with page_location/page_title overrides.
The [configuration reference](https://developers.google.com/analytics/devguides/collection/ga4/reference/config)
also supports page_referrer and individual campaign fields. We retain those
native configuration fields; there is no manual page-view event competing
with the default event and no direct gtag/js installation.

The loader remains default-on, production-host pinned and limited to 19
public pages; 27 pages, including portals and patient-access pages, are
excluded. This static site uses full-page navigation, with no observed
pushState/replaceState path router transitioning public pages into portals.
Persistent opt-out, GPC/DNT, blocked-storage handling, cookie clearing,
consent withdrawal and cross-tab reload are preserved. There is no noscript
tracker. All advertising consent purposes remain denied.

Page addresses have reviewed canonical paths without query strings or
fragments. Internal referrers retain reviewed paths; external referrers retain
origin only, including legitimate partner domains. Standard UTM source,
medium, campaign name, ID, content and term are mapped into native campaign
fields, rather than discarding campaigns outside a fixed vocabulary. Values
are bounded and obvious email/phone/control-character values rejected. This
is not a semantic PII detector: campaign labels themselves must never contain
personal or health information. Other query values are not supplied as page
or campaign fields. Default browser/device/session information is not anonymous.

[Enhanced Measurement](https://support.google.com/analytics/answer/9216061?hl=en)
form interactions collect metadata (form ID/name/destination and submit-button
text), **not typed form values**. The previous blanket-off advice was too broad.
The three public forms use static IDs/buttons. They previously had no explicit
action, allowing destination metadata to inherit the current URL. They now
have clean same-page action paths (`/contact`, `/export-partners`, `/news`);
their existing AJAX handlers and enquiry delivery are unchanged. No test form
was submitted and no form-success conversion was added. Automatic form_submit
must not be treated as confirmation of successful enquiry delivery.

Reviewed public outbound links/downloads are static, not constructed from
form inputs; their standard EM metadata is not globally scrubbed by the page
configuration. Site Search is the specific recommended exception above.
Google's optional [email/named-query redaction](https://support.google.com/analytics/answer/13544947?hl=en)
is additional protection, not a complete payload sanitiser or proof that
arbitrary free text is safe. Account destinations/user-provided-data settings
have not been positively verified; JSON does not change them. No additional
advertising collection is authorised.

## Verification and limits

Full validator against supplied source: valid, zero errors/warnings.
`check-gtm` checks the native maps, automatic-PV setting, explicitly paused
manual tag, email-only payload, emulated trigger conditions and preservation
against both original and earlier generated baselines. `check-analytics`
checks queue ordering, no manual PV emission, public/HTML scope, normal
referral/campaign labels, URL sanitisation, form action metadata, opt-out and
privacy signals. Indexing/nav/launch checks and isolated complete regeneration
also apply. The four approved temporary noindex pages and sitemap18 are kept.

Local tests do not execute the imported Google templates or prove GA receipt.
After merge, check one automatic pageview per load, a single clickEmail on
business-email clicks with the expected parameters, normal campaign reporting,
no manual-PV duplicate or HubSpot/custom form conversion, portal exclusion,
opt-out and effective CSP. Also test history changes with synthetic query
values and inspect enhanced form metadata to confirm page configuration is
respected; these are runtime checks, not assumed results. Use synthetic URL
values and click fixtures, not
real personal data or live form submissions. Standard EM events are expected;
Site Search should not emit. Account settings remain separately unverified.

Default-on applies globally. No trusted country mechanism exists and no
country is inferred. No worldwide legal-compliance claim is made. Vercel's
preview status still requires owner authorisation, but it is not a prerequisite
for the agreed merge-then-test sequence; no bypass is requested.
