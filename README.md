# Cookie Run Setup Finder (MVP)

MVP web app for:

- Community setup submission (cookie / pet / treasure, rewards, duration)
- User inventory selection
- Personalized setup recommendations based on inventory match and rewards

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Product direction (marketplace-style)

Planned structure (Amazon/Shopee-inspired):

- **Home**: feed with new combos, suggested combos from owned inventory, and game/news events
- **Combo**: browse all combos and filter by Cookie (and later by Pet/Treasure)
- **Inventory**: add/remove/edit owned Cookies, Pets, and Treasures
- **Settings**: account and app preferences

## Current architecture

- `app/page.tsx`: Home page feed
- `app/combo/page.tsx`: Combo browser + cookie filter
- `app/profile/page.tsx`: Inventory + setup submission profile
- `app/setting/page.tsx`: Settings + scrape status/instructions
- `app/api/setups/route.ts`: list + create setup endpoints
- `app/api/inventory/route.ts`: read + update inventory
- `app/api/recommendations/route.ts`: recommendation scoring endpoint
- `app/api/wiki/classic/route.ts`: serves scraped wiki JSON
- `lib/store.ts`: in-memory data store and recommendation logic

## Wiki scraping bootstrap (Cookie Run Classic / LINE / Kakao references)

This repo includes a local scraper to parse your saved Cookie Run Wiki HTML snapshots and generate JSON for DB import.

- Input defaults:
  - `List of Cookies_Classic - Cookie Run Wiki.html`
  - `GingerBright_Classic - Cookie Run Wiki.html`
- Output:
  - `data/wiki/classic-cookies.index.json`
  - `data/wiki/cookies/<CookieSlug>.json`

Run:

```bash
npm run scrape:classic
```

If UI shows no scraped data, run the command above first, then refresh the app.

Optional custom files:

```bash
npm run scrape:classic -- "List of Cookies_Classic - Cookie Run Wiki.html" "GingerBright_Classic - Cookie Run Wiki.html"
```

## API overview

- `GET /api/setups` -> all setups
- `POST /api/setups` -> create setup
- `GET /api/inventory` -> inventory + catalog
- `PUT /api/inventory` -> update inventory
- `POST /api/recommendations` -> ranked recommendations

## Note

Data persistence is currently in-memory (resets on server restart).  
Next step is swapping `lib/store.ts` to PostgreSQL/Supabase.
"# cookieweb" 
