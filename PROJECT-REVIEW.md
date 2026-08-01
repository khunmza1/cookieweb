# Project Review & Fix Plan — Cookie Run Web

Date: 2026-08-01
Scope: full review of the app, with a deep-dive on why screenshot inventory parsing doesn't work.

> **Update (same day, later pass):** Sections 1 and 3 (#1 video analyzer) below describe the
> *original broken state*. Both have since been rebuilt with real Claude vision — see
> **[IMPLEMENTATION-NOTES.md](IMPLEMENTATION-NOTES.md)** for what changed, how to enable it
> (`ANTHROPIC_API_KEY`), and a new third feature (alternate-treasure substitution
> recommendations) that was added in the same pass. The rest of this document (sections 2–5)
> is still an accurate description of what's outstanding.

---

## 1. Why "scan inventory from screenshot" is not working

There are **three independent reasons**, any one of which breaks the feature. All three are present.

### Reason 1 — The feature is disabled in the UI (nothing ever runs)

In `app/profile/page.tsx` (~line 292), the upload widget is hard-disabled and not wired up:

```tsx
<label className="... cursor-not-allowed ... opacity-60">
  <span>📸 AI Scanner (Coming Soon)</span>
  <input type="file" accept="image/*" disabled={true} className="hidden" />
</label>
```

- `disabled={true}` — the file picker can never open.
- There is **no `onChange` handler** on the input, so even if enabled, the existing
  `handleFileUpload` function (line 136) would never be called. It is dead code today.

### Reason 2 — The server API route never analyzes the image

`app/api/inventory/scan-screenshot/route.ts` (Mode 2) accepts the uploaded base64 image but
**never looks at its pixels**:

```ts
const scannedTiles = processTreasureScreenshot(1280, 720, catalog.treasures);
```

`processTreasureScreenshot` in `lib/scannerEngine.ts:339` is an explicit stub:

```ts
/** Server-side stub (kept for API route compatibility). */
export function processTreasureScreenshot(...) {
  return fallbackScan(catalogTreasures);   // 16 empty tiles, treasureId = null
}
```

So any call to the API in scan mode returns 16 "Unknown" tiles with 0 detections, regardless
of the image. The image analysis code (`analyzeImageOnCanvas`) is browser-only (uses
`document.createElement('canvas')`, `window.Image`) and cannot run in the route.

### Reason 3 — Even if wired up, the matching algorithm is too brittle to work

`lib/scannerEngine.ts` does canvas template matching (24×24 grayscale NCC + 8-bin color
histograms) against all 372 catalog treasure PNGs. Problems:

1. **Hardcoded grid geometry.** `GRID_PERCENTAGES` is a fixed 4×4 grid "measured from the
   user's real screenshot" (the comment says so). Any other phone resolution, aspect ratio,
   UI language, scroll position, or dialog layout misaligns every crop → garbage matches.
2. **No rejection threshold.** Every one of the 16 cells is always assigned the
   best-scoring treasure, even if the cell is empty background or a button. The confidence
   floor is 35%, but `treasureId` is still set — so users get 16 confidently-wrong guesses.
3. **Weak discrimination.** 24×24 grayscale thumbnails cannot distinguish 372 small icons
   that share palettes and shapes; in-game icons also have frames, sparkle borders and
   "+N" badges that the transparent catalog PNGs lack.
4. **Level detection is a stub.** `detectLevel` samples yellow pixels in the bottom-right
   corner and can only return `0` or `9`.
5. **`isEvolved` is not detected** — it's inferred from the catalog grade (S/S+), which is
   wrong semantically.

The UI badge already admits the real intent: *"🔜 Coming Soon — Requires AI API Key"* — an
AI-vision implementation was planned but never built; the template matcher was a stopgap.

---

## 2. Fix plan for screenshot parsing (recommended)

### Approach: real AI vision via the Claude API (server-side)

Replace the canvas template matcher with a vision call in the API route. This handles any
device resolution, any number of visible tiles, partial grids, and reads "+N" badges as text.

**Step 1 — Env & SDK**
- `npm install @anthropic-ai/sdk`
- Add `ANTHROPIC_API_KEY` to `.env.local` (never commit it).

**Step 2 — Rewrite Mode 2 of `app/api/inventory/scan-screenshot/route.ts`**
- Validate the upload: require `data:image/(png|jpeg|webp);base64,`, cap size (~5 MB).
- Build a compact catalog index for the prompt: `id | name` for all non-hidden treasures
  (372 lines ≈ small token cost).
- Call Claude with the image + catalog list using **structured output** so no parsing is needed:

```ts
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY

const response = await anthropic.messages.parse({
  model: 'claude-opus-5',
  max_tokens: 16000,
  messages: [{
    role: 'user',
    content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
      { type: 'text', text:
        `This is a Cookie Run treasure inventory screenshot. Identify every treasure tile ` +
        `visible. Match each to the closest entry in this catalog (id | name):\n${catalogList}\n` +
        `For each tile report the catalog id (or null if unrecognizable), the enhancement ` +
        `level shown as "+N" (0–9, 0 if no badge), and your confidence 0–100.` },
    ],
  }],
  output_config: {
    format: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          tiles: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                treasureId: { type: ['string', 'null'] },
                level: { type: 'integer' },
                confidence: { type: 'integer' },
              },
              required: ['treasureId', 'level', 'confidence'],
              additionalProperties: false,
            },
          },
        },
        required: ['tiles'],
        additionalProperties: false,
      },
    },
  },
});
const parsed = response.parsed_output; // { tiles: [...] }
```

- Map the result onto `ScannedTileResult[]` (validate each `treasureId` exists in the
  catalog; clamp `level` to 0–9), and return it with the screenshot URL as today.
- Keep a graceful error when the API key is missing: return 503 with a message like
  "AI scanning not configured", so the UI can fall back to manual selection.

**Step 3 — Re-enable and wire the UI** (`app/profile/page.tsx`)
- Remove `disabled={true}`, add `onChange={handleFileUpload}`, restore the enabled styling
  and remove the "Coming Soon" copy.
- Change `handleFileUpload` to POST the base64 image to `/api/inventory/scan-screenshot`
  instead of calling `analyzeImageOnCanvas` client-side.
- Support multiple screenshots (the API shape already accepts `images[]` — loop and merge).

**Step 4 — Adapt the verification modal** (`components/ScanVerificationModal.tsx`)
- The modal assumes exactly 16 tiles with fixed overlay boxes. With AI detection the tile
  count is variable, so either (a) drop the geometric overlay and show only the tile list
  next to the screenshot, or (b) have the model also return approximate bounding boxes
  (x/y/w/h as % of image) and keep the overlay. Option (b) is a nice-to-have; start with (a).
- Keep the existing confirm flow (Mode 1 of the route) — it already works and the
  human-verification UX is good.

**Step 5 — Cleanup**
- Delete the template-matching code in `lib/scannerEngine.ts` (keep the
  `ScannedTileResult` type and the fallback), or keep it behind a "no API key" fallback.

**Cost estimate:** one screenshot ≈ 1,500–4,800 image tokens + ~4K catalog-list tokens on
`claude-opus-5` ($5/M input) → well under a cent per scan. If cost matters later, the
catalog list is a stable prompt suffix candidate for prompt caching.

**Fallback option (no API key):** keep manual tile assignment via the existing
`ItemPickerModal` — user uploads screenshot, sees it side-by-side, and picks treasures
manually. This already ~works via the verification modal; just don't pre-fill wrong guesses.

---

## 3. Other things that are currently not working / fake

| # | Area | Problem | Suggested fix |
|---|------|---------|---------------|
| 1 | **Video/meta "AI analyzer"** (`app/api/admin/combos/analyze-video/route.ts`) | Not AI at all: it keyword-matches the *URL string*, and an uploaded frame image is never analyzed (`targetText = "screenshot_multimodal_vision_frame"` matches nothing) → it returns a hardcoded cheesecake meta labeled "98% confidence". Misleading to admins. | Reuse the same Claude vision pattern as the screenshot scanner, or remove/label the feature honestly. |
| 2 | **Uncommitted code** | The entire app (`app/api`, `app/profile`, `components/`, `lib/`, `data/`, …) is **untracked** in git; only the create-next-app template is committed. One bad `git clean` loses everything. | Commit the work. Add `data/*.backup.*.json`, `.DS_Store`, `tsconfig.tsbuildinfo` to `.gitignore` first. |
| 3 | **Catalog placeholder data** | `hpStats`/`skillStats` contain "HP placeholder level N" strings for many items (UI hides them, but the data is incomplete). | Finish the scraper pass or strip placeholder arrays from the JSON. |
| 4 | **Session security** | The session is a plain `cr_session_user=<userId>` cookie. Anyone can set `cr_session_user=admin-user` in dev tools and pass `checkAdminPermission()` → full admin (edit catalog, boost combos). | Sign the session (e.g. HMAC token or `iron-session`/JWT), or at minimum a random opaque session id mapped server-side. |
| 5 | **Password hashing** | SHA-256 with a static salt (`lib/store.ts:91`) — fast-hash + shared salt is crackable. Seeded creds `admin/admin123`, `runner/runner123`. | Use `bcrypt`/`scrypt`/`argon2` with per-user salt; remove or randomize seeded admin password. |
| 6 | **Unauthenticated writes** | `scan-screenshot` confirm mode falls back to `default-user` when no session → anonymous visitors can overwrite the default profile. No validation that confirmed `treasureId`s exist or `level` is 0–9. | Require a session for writes; validate tiles server-side against the catalog. |
| 7 | **JSON-file persistence** | `lib/store.ts` reads/writes `data/*.json` with module-level caches. Fine for local dev; breaks on Vercel/serverless (read-only FS, multiple instances = lost writes). | OK for now; document it, or move to SQLite/Postgres (e.g. Prisma + SQLite) before deploying. |
| 8 | **Repo hygiene** | 7 timestamped catalog backup files in `data/`, Python scraper scripts + test scripts mixed into the Next app, `.DS_Store` files. | Move scrapers to `tools/`, gitignore backups and OS junk. |

Smaller polish items:
- `alert()` used for errors on the profile page — replace with inline error/toast UI.
- Treasure level selects on the profile page offer 1–9 but the scanner produces 0–9;
  harmonize the range ("+0" is a valid in-game state).
- `catalog.treasures.length` (372) renders on a tab labeled with grade filters `C/B/A/S/L`
  while data contains `S+` grades — the `Grade` filter list may not cover all data.

## 4. What's in good shape

- TypeScript compiles cleanly (`tsc --noEmit` passes) on Next 16.2.12 / React 19; the
  `await cookies()` usage matches the new Next API.
- The recommendation engine (`getRecommendationsForProfile`) is real, sensible logic.
- The verification-modal UX (scan → human verify → confirm import) is a good design worth
  keeping — only the detection behind it needs to be real.
- Catalog assets are local (`public/images/...`, 350+ images), so no CORS issues for any
  client-side rendering.

## 5. Suggested order of work

1. **Commit everything + .gitignore fixes** (10 min, protects all other work).
2. **Screenshot scanner fix** (Section 2) — the headline feature.
3. **Session signing + password hashing** (Section 3 #4–6) — before any public deployment.
4. Rework or honestly label the video analyzer (#1).
5. Data cleanup: placeholders, backups, scraper relocation.
