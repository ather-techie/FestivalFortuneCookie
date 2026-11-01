# Festival Fortune

A single-page web app where you "crack" a themed fortune cookie for different festivals and birthdays. Each cookie gives one fortune per day, selected by a weighted rarity system.

**Live sites:**
- **Vercel (primary):** https://festivalfortunecookie.vercel.app — includes social media OG image serving
- **GitHub Pages:** https://ather-techie.github.io/FestivalFortuneCookie/ — static app only (no serverless OG support)

## What it does

- **Festival picker** — Choose from seven festivals: Halloween, Christmas, Diwali, Eid, Lunar New Year, Valentine's Day, and Birthday. Each has its own SVG vessel (cookie shape), color palette, and rarity labels.
- **Hold-to-crack** — Press and hold the vessel for 2 seconds to trigger a shake animation and particle burst, then reveal the fortune.
- **One per day** — Each festival can only be cracked once per calendar day. If you've already cracked it today, the same fortune is shown again. No rerolls, no catch-up.
- **Rarity system** — Fortunes are weighted by tier: Common 60%, Uncommon 25%, Rare 12%, Legendary 3%. Each festival has its own tier names (e.g., Whisper/Omen/Curse/Haunting for Halloween).
- **Age-aware birthday** — Set your birth year in Settings (year only — no full date needed); birthday fortunes filter by age band (e.g., 20–29, 30–39, etc.).
- **Journal** — Every cracked fortune is saved to localStorage with date, festival, fortune ID, and rarity. Filter the journal by festival, or clear it entirely with the **Clear Journal** button in the Journal header (also available in Settings).
- **Dark / light mode** — Toggle the theme from the header; your preference is saved in localStorage.
- **Share menu** — Click **Share** to open a menu with options for native sharing, Twitter/X, Facebook, WhatsApp, Telegram, LinkedIn, copy link, or download the PNG card.
- **Social media cards** — Shared links include Open Graph and Twitter Card meta tags. Each fortune has a pre-rendered 600×800 PNG image that appears as a preview card on social platforms. A Vercel serverless function serves the correct OG tags to crawlers that can't read URL hash fragments.

## Social media sharing: how it works

When a fortune is shared on Twitter/X, Facebook, LinkedIn, or WhatsApp, the platform's crawler fetches the share URL and reads its Open Graph meta tags to build the preview card. Two constraints shaped the design:

1. **Crawlers can't execute JavaScript** and can't read URL hash fragments (`#f=...`), so the share link points to `/api/fortune?key=<festival>&id=<fortune-id>` — a Vercel serverless function that returns HTML with the correct OG tags for that specific fortune, then redirects browsers to the app.
2. **OG image URLs must be absolute** and publicly fetchable. All OG URLs use the production domain (`https://festivalfortunecookie.vercel.app`) — never deployment-internal URLs, which crawlers can't access.

Preview images are pre-rendered once per fortune (`npm run generate-og`) and served as static files from the CDN edge. If you add or edit fortunes, regenerate the images so the preview cards stay in sync.

To verify a card after sharing:
- **Twitter/X:** https://cards-dev.twitter.com/validator — also clears Twitter's preview cache
- **Facebook/Meta:** https://developers.facebook.com/tools/debug/ — click "Scrape Again" to refresh

## Tech stack

- Pure HTML/CSS/JS — no build step, no dependencies, no framework.
- `fetch()` loads JSON fortune files from `festivals/<name>/fortunes.json`.
- `localStorage` persists journal, streaks, and birth year.
- Canvas 2D for particle burst animation and share card rendering.
- Pre-rendered OG images in `og-images/` for social media previews.
- Vercel serverless function (`api/fortune.js`) for crawler-friendly OG meta tags.

## Project structure

```
.
├── index.html          # App shell + OG meta tags
├── styles.css          # Base styles + per-festival palette overrides
├── app.js              # Engine: crack logic, rarity roll, journal, streaks, OG updater
├── share.js            # Canvas share card renderer + social share menu
├── api/fortune.js      # Vercel serverless function for crawler OG tags
├── scripts/generate-og-images.js  # Pre-renders all OG images
├── og-images/          # 247 fortune PNGs + default.png
└── festivals/
    ├── halloween/fortunes.json      # 50 fortunes
    ├── christmas/fortunes.json      # 35 fortunes
    ├── diwali/fortunes.json         # 33 fortunes
    ├── eid/fortunes.json            # 33 fortunes
    ├── lunar-new-year/fortunes.json # 33 fortunes
    ├── valentine/fortunes.json      # 33 fortunes
    └── birthday/fortunes.json       # 30 fortunes, age-banded
```

## Run locally

You need a local server because the app uses `fetch()` to load the JSON files. Opening `index.html` directly in a browser won't work.

**Python:**
```bash
python -m http.server 8000
```
**Node:**
```bash
npx serve .
```
Then open http://localhost:8000

## Test

### Automated tests

Run the Node.js test suite:

```bash
npm test
```

This validates all festival JSON files (required fields, rarity weights, unique IDs) and checks that the app structure includes EID, theme toggle, share menu, journal clear button, OG meta tags, and the serverless OG function.

### Manual verification checklist

1. Open the home page — festival cards render with emoji, date range, and status badge.
2. Click an active festival (Halloween, Eid, or Birthday are always available) — the crack stage appears with the correct vessel SVG and festival name.
3. Press and hold the vessel — the hold bar fills, then the vessel shakes, particles burst, and the reveal stage appears with a fortune card.
4. Check the card shows: festival badge, rarity badge with correct label, fortune text, and date.
5. Click **Share** — a share menu opens with options for native share, Twitter/X, Facebook, WhatsApp, Telegram, LinkedIn, copy link, and download PNG.
6. Toggle the **🌙/☀️** theme button — the page switches between dark and light mode.
7. Click **Journal** — the fortune appears in the journal list with correct festival and rarity. Click **Clear Journal** at the top right — the list empties and shows "No fortunes yet."
8. Return to the same festival and try to crack again — the same fortune is shown (no reroll).
9. Open Settings, set a birth year (year only — no full date needed; age is derived from it), then crack a Birthday cookie — the fortune matches the age band (e.g., birth year 1990 → age ~36 → 30–39 band).
10. Click **Clear Journal** in Settings — same result: journal empties and reloads to "No fortunes yet."

## Add a new festival

1. Create `festivals/<name>/fortunes.json` with the same schema as the existing files:
   - `name`, `vesselSvg`, `palette` (bg, text, accent, muted)
   - `rarityTiers` (common, uncommon, rare, legendary weights)
   - `rarityLabels` (labels per tier)
   - `fortunes` array with `id`, `rarity`, and `text` (plus optional `ageBand` for birthday)
2. Add an entry to the `FESTIVALS` array at the top of `app.js` with `key`, `name`, `emoji`, and date window (`startMonth`, `startDay`, `endMonth`, `endDay`).
3. Regenerate OG images: `npm run generate-og`
4. No code changes needed elsewhere.

## Known limitations

- All state is client-side in `localStorage`. Clearing browser data wipes the journal.
- The `fetch()` for fortune JSONs requires a local server or hosting with proper CORS.
- No sound, no AR, no pair cracking, no email/push notifications, no backend — all of these are potential v2 features.

## Built with Mel

This project was designed and built entirely with [Mel](https://mel.app), an AI coding agent that works directly inside a terminal environment. It can inspect your project files, generate and modify code, write creative copy, and run commands — while keeping you in control.

## Why I built this with Mel

I built this with Mel to show how an AI agent can take a creative idea from concept to deployed product in one session:

1. **Research first** — Mel searched GitHub for existing fortune-cookie generators to confirm the festival-specific niche was open before writing any code.
2. **Plan before building** — Mel proposed a numbered plan covering architecture, data model, tone system, and features — and waited for approval before starting.
3. **Creative writing at scale** — Mel wrote 247 fortunes across seven festivals, each in a distinct voice, with rarity-scaled emotional depth. This is the kind of copy work that would take a human hours and Mel did in minutes.
4. **Engine + UI + data in one pass** — The JavaScript engine, CSS animations, HTML structure, and all seven festival JSON data files were built together so they actually fit.
5. **Ship and verify** — Mel created the GitHub repo, GitHub Pages deployment, and Vercel deployment, then confirmed the live URL returned HTTP 200.
6. **Iterate safely** — When I asked for new features (EID festival, dark/light mode, social sharing, OG preview cards), Mel added tests first, then the code, then ran `npm test` to confirm everything passed before committing.
7. **Debug from evidence** — When Twitter previews showed no image, Mel fetched the actual server response, spotted that `VERCEL_URL` was leaking the internal deployment URL into the OG tags, and fixed it in one pass.

The result is a complete, deployed, tested web app — not a prototype or a tutorial fork.
