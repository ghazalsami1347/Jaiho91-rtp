# Jaiho91 · editable game list

The latest arcade UI and all 36 covers are included. This version works on a web host and when you extract the ZIP and double-click index.html.

## Add a game

1. Put its image in assets/games/.
2. Open games.json and append one object to the array, with a comma between entries:

```json
{
  "id": "my-new-game",
  "name": "My New Game",
  "category": "Adventure",
  "image": "assets/games/my-new-game.webp"
}
```

3. Save and upload the changed games.json and image. Refresh the hosted page.

**No HTML edits, game-count changes, roster file, or rebuild are needed for hosted catalog updates.** The page reads games.json on load. Cards, counts, category filters, search, saved-game selection and daily rankings use that list. Each day the site displays up to 10 games from the full catalog. Search and filters apply to that day’s lineup.

Only id and name are required. Keep each id unique and stable, using lowercase letters, numbers and hyphens. The category defaults to Adventure. Any new category automatically gets a filter. A missing image uses a category icon so the game remains available. Local PNG/JPEG/WebP files or HTTP(S) image URLs can be used; relative local files work best for offline previewing.

Optional fields:

- imageSmall and imageLarge: optimized variants; omit them to use one image everywhere.
- description: text shown in game details.
- aliases: alternate names to include in search.
- enabled: false: hide a game without deleting its entry.
- artworkCredit: text describing your cover source.

JSON requires double quotes and does not allow comments or trailing commas. game-entry.example.json contains a copyable entry. The original larger game inventory is kept separately in docs/full-catalog-backlog.json for reference; the page reads only games.json.

## Double-click preview

Extract the entire ZIP before opening index.html. A standalone classic script includes the 36-game snapshot, so local preview does not need a server or JSON fetch permission.

After editing games.json locally, click **Load games.json** in the Local preview panel and select the edited file. The page updates immediately for that preview, including new categories and counts. Your selected list stays in the current tab; reopening index.html uses the included snapshot.

To permanently refresh the snapshot after editing data or source code, run Refresh local preview.cmd on Windows with Node.js installed, or:

```sh
node scripts/prepare.mjs
```

Browsers restrict direct file-to-file JSON fetches. The local import button handles that restriction without disabling browser security. The panel is hidden on normal hosted sites, where games.json is read automatically.

## Update GitHub source

Copy the extracted contents into the repository root, including the .github workflow folder and dotfiles. Keep your repository's existing .git directory and custom CNAME file. Commit and push the changes. index.html is at the root.

Validate website runs checks after pushes and pull requests. The optional Publish website to GitHub Pages workflow runs only when you explicitly choose Run workflow. For that option, select GitHub Actions under repository Settings → Pages first.

GitHub documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages

The former private hosting URL and configuration are not included. Relative asset paths support repository subpaths and custom domains. The public-source version now allows search indexing. The intended canonical domain is configured in seo.config.json.

## Developer commands

Use Node.js 24 or a compatible version >=20. No dependencies or npm install are required.

```sh
node scripts/serve.mjs
node scripts/prepare.mjs
node --test tests/*.test.mjs
node scripts/check.mjs
node scripts/build.mjs
```

The local server opens at http://127.0.0.1:4173 and refreshes the classic script on startup. build/ contains only deployable files: the page, styles, standalone site.js, games.json, artwork and static metadata. The build command refreshes the offline snapshot automatically.

Source files: app.js (UI), game-data.js (catalog loading and validation), core.js (daily values/scheduler), icons.js, seed-ids.js, arcade.css. site.js is generated from these files; edit source files instead of the generated copy.

## Daily reset

The current placeholder ranking refreshes at 12:00 PM IST / Asia/Kolkata (06:30 UTC). Values stay fixed during each noon-to-noon cycle. The open page updates at the boundary and catches up after sleep. Device clocks must be set correctly; this static site does not use server-authoritative time.

Adding another game does not change existing games' daily values. Keep the original seed-ids.js baseline frozen and preserve IDs when renaming games. All percentages are illustrative, not actual/live RTP or predictions of winning.

## Verification

26 automated checks cover the noon boundary, wake recovery, stable values when adding games, JSON errors, custom categories, image fallbacks, pagination, the actual standalone script in file mode, local JSON importing and live hosted JSON loading. The hosted page was also checked in a browser. Browser automation does not allow file:// navigation, so direct-file visual verification was unavailable; the actual file-mode entry script is covered by automated runtime tests with network fetching and storage blocked.

## SEO and sharing

The page is configured for https://jaiho91rtp.com/ with Indian English (en-IN / en_IN), a descriptive page title, plain English copy and clear 12 PM IST updates. Repeated demo branding has been removed. One feed-status notice identifies the current generated placeholders until the live feed is connected.

Edit seo.config.json to change the public URL, site name, title, description or sharing image. Run node scripts/prepare.mjs, or publish using the included Pages workflow. Canonical tags, Open Graph and Twitter card tags, structured data, robots.txt, sitemap.xml and the non-JavaScript game list are generated together. No manual HTML edits are required.

The social image is assets/jaiho91-rtp-share.jpg: a 1200 × 630 JPEG. It is about 90 KB and is referenced with an absolute URL. Replace it with another 1200 × 630 JPEG if you want different artwork.

Hosted games.json edits still update the interactive game list on refresh. Run the prepare/build command or the Pages publishing workflow to refresh the crawlable HTML game list and structured data too.

The domain has not been connected or registered by this package. CNAME.example is a reference only. Configure jaiho91rtp.com through your hosting provider’s domain settings when you are ready, then submit https://jaiho91rtp.com/sitemap.xml in Google Search Console. Social previews require the page and image to be publicly reachable on that domain.

Structured data describes the website and game collection. No ratings, prices, real RTP data or official affiliation are invented. Metadata helps describe the page; it does not guarantee indexing, rankings or rich search results.

References: https://developers.google.com/search/docs/appearance/title-link ; https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls ; https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics ; https://ogp.me/

## Live RTP integration status

Public copy uses RTP rather than demo branding. The current daily values are still generated by the existing local ranking function. A visible status notice and the sharing metadata state that the live feed is not connected. No live data integration or data-authenticity claim was added in this copy change. Replace the value source, verify its timestamps and handle missing/stale data before removing that status notice. Internal seed/function identifiers are retained so this wording change does not alter daily values.
