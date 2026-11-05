# Validation · 5 November 2026

## Automated

12 core tests pass. Exact noon IST reset, timezone invariance, month/year/leap boundaries, fixed in-cycle values, descending order and tie breaks, 366 days of min/max ranges, unrelated-ID additions, actual timer scheduler, wake recovery, aliases and combined search/filter/saved selection are verified.

Asset checks pass for 36 public catalog entries and 108 distinct self-hosted WebP derivatives. Each derivative is smaller than 180 KB. Brand, local file references, metadata and JavaScript syntax checks pass. All 36 original generated covers were inspected in a labeled contact sheet.

## Browser

- 36 games render, in descending demo-RTP order.
- Leading today uses a large gold-framed number one and two artwork-led runners-up. Desktop has a staggered three-card layout; phone has one full-width leader over two runners-up.
- Body width matches document scroll width at 320px (305/305 with scrollbar), 390px (375/375), 768px (753/753) and 1440px (1425/1425). A decorative glow overflow found on narrow phones was fixed.
- Search for Kraken returns all three numbered variants. Mythology returns seven games.
- A saved Kraken game survives reload. The test save was removed afterward, preserving pre-existing saved selections.
- Game details show matching rank and percentage, explicit demo labeling, AI-recreated artwork disclosure and save control. Close works.
- Nonsense search produces the empty state; Reset filters restores the collection.
- Sticky search/filter controls and two-column phone game cards checked.
- No browser errors or warnings observed.
- The brand is optimized for header/footer and favicon use. Three spotlight images load eagerly; catalog covers are lazy and responsive.

## Limits

The device clock was not altered. Exact rollover is verified against the actual UI scheduler with an injected clock. Static pages depend on correctly set device time and cannot run timers while the operating system suspends them; recovery occurs on return. No physical-device or screen-reader session was performed. No Lighthouse score or measured network-performance claim is made.

## Arcade framing revision checks

- New unified arcade stylesheet replaces both prior stylesheets; all local references and JavaScript syntax checks pass.
- 36 game covers render inside cut-corner beveled frames, with gold framing for the daily top three and theme accent lines.
- Desktop podium order is second / first / third, with the first-place card raised and larger. Phone order remains first over the two runners-up.
- Recessed percentage displays, large tap targets, sticky framed search/filter controls and a matching framed dialog are present.
- Body/document widths match at 320px, 390px, 768px and 1440px. No horizontal body overflow.
- Kraken search returns three games; Mythology filter returns seven; details open and Escape closes them.
- No browser warnings or errors observed. New desktop and phone screenshots saved.
- The daily clock and value functions were not modified in this design revision; their prior test results remain applicable.

## Editable list and direct-file fix

The browser entry now uses a generated classic site.js rather than ES modules. Hosted pages read games.json with a fresh request on load. file:// pages use an embedded snapshot and offer a local JSON picker. All displayed counts and category filters derive from the editable list; the old 36-game catalog gate was removed.

22 automated tests pass. Runtime tests execute the actual standalone script with file:// location, blocked fetch and blocked localStorage; all 36 cards render. Importing an updated local JSON file registers game 37, its category, counts, search and pagination. Hosted runtime tests prefer live JSON over the embedded snapshot.

A hosted browser test added a 37th game and a new Sports category only by changing games.json, without rebuilding site.js. All three counts changed to 37, Sports appeared as a filter, and searching found the added game. The temporary entry was removed afterward; the delivered list contains the original 36 games. The automation browser blocks file:// URLs, so direct-file visual inspection was not available.

## India copy, SEO and social metadata

The title is Jaiho91 RTP Today | Demo List Updated at 12 PM IST. The H1 names Jaiho91 RTP, copy uses plain Indian English, dates use en-IN and the interface states the 12 PM IST reset. The demo status remains explicit. Internal transcription-review wording was removed from public game details.

Static metadata is generated from seo.config.json for the intended future domain https://jaiho91rtp.com/. It includes one canonical URL, index/follow robots settings, en_IN Open Graph tags, a 1200×630 JPEG sharing image, Twitter large-card tags, WebSite/CollectionPage/ItemList JSON-LD and a root-page sitemap. The former noindex and disallow-all directives were removed from this public source copy.

The complete active game list is in raw HTML as well as the JavaScript interface. JSON-LD lists the same game names and stable in-page anchors. No fixed daily RTP figures or fake review/rating claims are embedded. Static SEO content and the local-file snapshot regenerate from games.json through prepare/build.

26 automated checks pass, including metadata, game-list/schema consistency, safe escaping, one-page sitemap and the existing local-file/catalog tests. The sharing JPEG was inspected and verified at 1200×630, approximately 90 KB. Domain DNS, registration, Search Console verification and live-domain social scraping remain outside this source-package change.

## RTP wording revision

Public page copy, game cards, details, FAQs, SEO metadata, structured data and the social image now use RTP wording without demo branding. A single page-level notice states that the live feed is not connected and the current percentages are generated placeholders. Sharing metadata and the social card also identify the pending live feed, since shared links are viewed independently of the page notice.

The existing value generator, game IDs and daily reset logic are unchanged. 26 tests pass, including a check that the generated public HTML contains no demo wording. No real feed was connected in this copy revision.
