# Implementation Notes — AI Vision Features + Alternate-Treasure Recommendations

Companion to [PROJECT-REVIEW.md](PROJECT-REVIEW.md). Covers what was built in this pass, why,
and how to turn it on.

## Setup required to test the AI features

Both the screenshot scanner and the video-frame analyzer need a Claude API key. Without it,
they fail gracefully (clear error message, no crash) but obviously can't identify anything.

```bash
npm install   # picks up the new @anthropic-ai/sdk dependency
```

Create `.env.local` in the project root:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Then `npm run dev` as usual. Everything else (browsing combos, toggling inventory,
recommendations, admin catalog editing) works with no key.

---

## 1. Inventory screenshot scanner — now AI vision, not canvas matching

The old client-side canvas template matcher (`lib/scannerEngine.ts`) is gone. The new flow:

1. `app/profile/page.tsx` — upload widget re-enabled, accepts **multiple** screenshots at once.
2. Each image is base64-encoded client-side and POSTed to `app/api/inventory/scan-screenshot/route.ts`.
3. The route calls `analyzeInventoryScreenshots()` in `lib/ai.ts`, which sends all screenshots
   in **one** Claude vision request (`claude-opus-5`, structured JSON output) along with the
   full treasure catalog (`id | name` list), asking it to identify every tile's treasure id and
   its "+N" enhancement badge.
4. `lib/scannerEngine.ts` (`mergeScreenshotDetections`) applies the dedup rules you asked for:
   - Same treasure id **and** same level detected more than once (e.g. overlapping screenshots)
     → collapsed into **one** tile.
   - Same treasure id at **two different levels** → kept as **two separate tiles**, each
     flagged with a `conflict` badge in the review UI, so you can see and resolve it rather
     than have one silently overwrite the other.
   - Anything the AI couldn't confidently match to a catalog id → shown as an "Unidentified"
     tile you can assign manually, instead of silently dropping that detected slot.
5. `components/ScanVerificationModal.tsx` was redesigned for this: no more fixed 4×4 grid
   overlay (that assumed one screenshot at a fixed resolution) — now a scrollable list of
   however many tiles were found, with a thumbnail filmstrip of all uploaded screenshots,
   per-tile confidence/conflict badges, remove buttons, and an "add treasure manually" picker.
6. On **Confirm & Import**, since a treasure profile can only hold *one* level per id
   (`ownedTreasures: Record<treasureId, OwnedItem>`), any still-conflicting tiles are resolved
   by keeping the **higher level** — this happens in `scan-screenshot/route.ts`'s confirm
   handler, not by silently picking "whichever came last."

**Why AI vision instead of classical image matching:** the old approach hardcoded a screenshot
grid and did 24×24-pixel template matching against 372 near-identical catalog icons — it
couldn't handle a different phone resolution, and had no real way to tell "empty background"
from "a genuine match." Claude vision reads the "+N" badge as text and doesn't care about
screen resolution, grid position, or icon frame/sparkle-border artwork differences.

## 2. Admin video/frame combo analyzer — now real AI vision, not string matching

The old `analyze-video/route.ts` matched keywords against the **video URL string** — it never
looked at any actual image, and returned a hardcoded "Cheesecake meta" with a fake "98%
confidence" regardless of input. That's been replaced:

- Claude can't watch a video (no video input to the Messages API), so **a video URL alone is
  now honestly rejected** with a message asking for a frame screenshot instead of faking a result.
- When a frame image is uploaded, `analyzeGameplayFrame()` in `lib/ai.ts` sends it to Claude
  vision with the full cookie/pet/treasure catalog and asks it to identify what's shown.
- The admin combo-creator UI (`app/admin/page.tsx`) now has an "Upload Video Frame" button
  instead of two fake demo preset buttons that used to trigger canned results.
- The response's `confidenceScore` is the model's actual confidence, not a hardcoded number.
  If it can't confidently identify the cookie/pet, it says so and leaves those fields for you
  to fill in manually rather than guessing.

## 3. Alternate-treasure recommendations ("you don't own X, but you own Y — similar effect")

New feature per your request. When a combo needs a treasure you don't own, the recommendation
now checks whether you own something with a **similar effect** and suggests it as a substitute
— e.g. missing a 10%-coin-bonus treasure but owning an 8%-coin-bonus one.

**No AI required for this to work out of the box** — `lib/effectTags.ts` derives a coarse
effect category (`coin_bonus`, `jelly_bonus`, `speed_boost`, `speed_penalty`, `shield_defense`,
`magnet`, `revive`, `obstacle_clear`, `duration_extend`, `xp_bonus`, `energy_hp`, plus a
deliberately-weak `score_bonus`) from each treasure's free-text wiki description via keyword
rules. `findTreasureAlternates()` matches missing ↔ owned treasures on a shared *specific*
tag — a shared generic "gives points" (`score_bonus`) is **not** enough on its own, since a
huge fraction of all treasures mention points somewhere; requiring a more specific shared tag
(same jelly-bonus family, same coin-bonus family, etc.) is what keeps suggestions meaningful
instead of "everything is similar to everything."

This is surfaced on both the Home page recommendation cards and the Combo browser cards, next
to each missing item.

**Optional accuracy upgrade:** `npm run tag:treasures` (needs `ANTHROPIC_API_KEY`) runs a
one-time Claude classification pass over all 372 treasures and writes a proper `effectTags[]`
onto each one in `data/classic-catalog.json` — this is used instead of the keyword guesser
whenever present, and understands nuance regex can't (e.g. distinguishing *why* a treasure
affects score, not just that it mentions the word). Not required — the app works well without
running it.

### Data-quality bugs found and fixed along the way

Testing this surfaced two pre-existing data problems that were silently breaking treasure
matching everywhere (not just the new feature) — both fixed:

1. **Every one of the 5 built-in demo combos, and the seed users' starting treasures,
   referenced placeholder treasure ids that don't exist in the scraped catalog**
   (e.g. `angel-feather`, `cheesecake-piece`, `ginseng-root-500` — the real ids are
   `angel-cookie-s-holy-feather`, `cheesecake-cookie-s-piece-of-cake`,
   `500-year-old-ginseng-root`, etc.). This meant those combos always showed 0% treasure match
   for *everyone*, regardless of inventory — remapped in `data/combos.json`, `data/users.json`,
   and the seed data in `lib/store.ts`.
2. **`enhancementStats.plus9Effect` is literally the placeholder string `"HP placeholder level
   9"` for all 372 treasures** (never actually scraped). The effect tagger originally read this
   field too, which meant almost the entire catalog got spuriously tagged `energy_hp` just
   because "HP" appears in the placeholder text. Fixed by dropping that field from the tagger
   input entirely — only the real scraped `effect` text is used now.

## Other small UX fixes in this pass

- Profile page's grade filter was missing `S+` (present everywhere else) — added.
- Replaced remaining `alert()` calls in the scan/import flow with inline status banners
  (color-coded red/green), consistent with the rest of the page.
- `ScanVerificationModal` no longer re-syncs its editable state via a `useEffect` + `setState`
  (a React anti-pattern flagged by the linter) — the parent now remounts it via a `key` when a
  fresh scan result should replace the current one.

## What wasn't touched in this pass

Everything else flagged in `PROJECT-REVIEW.md` sections 2–5 (git history/commit hygiene,
session cookie security, password hashing, unauthenticated writes, JSON-file persistence on
serverless) is unchanged — still worth doing before any real deployment, just out of scope for
"make the AI features actually work."
