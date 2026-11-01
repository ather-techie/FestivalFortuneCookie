# Festival Fortune

A single-page web app where you "crack" a themed fortune cookie for different festivals and birthdays. Each cookie gives one fortune per day, selected by a weighted rarity system.

**Live site:** https://ather-techie.github.io/FestivalFortuneCookie/

## What it does

- **Festival picker** — Choose from six festivals: Halloween, Christmas, Diwali, Lunar New Year, Valentine's Day, and Birthday. Each has its own SVG vessel (cookie shape), color palette, and rarity labels.
- **Hold-to-crack** — Press and hold the vessel for 2 seconds to trigger a shake animation and particle burst, then reveal the fortune.
- **One per day** — Each festival can only be cracked once per calendar day. If you've already cracked it today, the same fortune is shown again. No rerolls, no catch-up.
- **Rarity system** — Fortunes are weighted by tier: Common 60%, Uncommon 25%, Rare 12%, Legendary 3%. Each festival has its own tier names (e.g., Whisper/Omen/Curse/Haunting for Halloween).
- **Age-aware birthday** — Set your birth year in Settings; birthday fortunes filter by age band (e.g., 20–29, 30–39, etc.).
- **Journal** — Every cracked fortune is saved to localStorage with date, festival, fortune ID, and rarity. Filter the journal by festival.
- **Share** — Generates a 600×800 PNG card via Canvas and copies a shareable URL that encodes the fortune in the URL hash.

## Tech stack

- Pure HTML/CSS/JS — no build step, no dependencies, no framework.
- `fetch()` loads JSON fortune files from `festivals/<name>/fortunes.json`.
- `localStorage` persists journal, streaks, and birth year.
- Canvas 2D for particle burst animation and share card rendering.

## Project structure

```
.
├── index.html          # App shell
├── styles.css          # Base styles + per-festival palette overrides
├── app.js              # Engine: crack logic, rarity roll, journal, streaks
├── share.js            # Canvas share card renderer + URL encoder
└── festivals/
    ├── halloween/fortunes.json      # 50 fortunes
    ├── christmas/fortunes.json      # 35 fortunes
    ├── diwali/fortunes.json         # 33 fortunes
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

No automated test suite exists. Manual verification checklist:

1. Open the home page — festival cards render with emoji, date range, and status badge.
2. Click an active festival (Halloween or Birthday are always available) — the crack stage appears with the correct vessel SVG and festival name.
3. Press and hold the vessel — the hold bar fills, then the vessel shakes, particles burst, and the reveal stage appears with a fortune card.
4. Check the card shows: festival badge, rarity badge with correct label, fortune text, and date.
5. Click **Share** — a PNG downloads and the URL is copied to clipboard (if the browser supports the Clipboard API).
6. Click **Journal** — the fortune appears in the journal list with correct festival and rarity.
7. Return to the same festival and try to crack again — the same fortune is shown (no reroll).
8. Open Settings, set a birth year, then crack a Birthday cookie — the fortune matches the age band (e.g., birth year 1990 → age ~36 → 30–39 band).
9. Click **Clear Journal** — journal empties and reloads to "No fortunes yet."

## Add a new festival

1. Create `festivals/<name>/fortunes.json` with the same schema as the existing files:
   - `name`, `vesselSvg`, `palette` (bg, text, accent, muted)
   - `rarityTiers` (common, uncommon, rare, legendary weights)
   - `rarityLabels` (labels per tier)
   - `fortunes` array with `id`, `rarity`, and `text` (plus optional `ageBand` for birthday)
2. Add an entry to the `FESTIVALS` array at the top of `app.js` with `key`, `name`, `emoji`, and date window (`startMonth`, `startDay`, `endMonth`, `endDay`).
3. No code changes needed elsewhere.

## Known limitations

- All state is client-side in `localStorage`. Clearing browser data wipes the journal.
- The `fetch()` for fortune JSONs requires a local server or hosting with proper CORS.
- No sound, no AR, no pair cracking, no email/push notifications, no backend — all of these are potential v2 features.

## Built with Mel

This project was designed and built entirely with [Mel](https://mel.app), an AI coding agent. Mel handled every step: writing the plan, generating the HTML, CSS, JavaScript engine, share card renderer, and all 211 fortune copy across six festivals — plus the GitHub repo, README, GitHub Pages deployment, and Vercel release.
