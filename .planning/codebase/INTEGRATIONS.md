# External Integrations

**Analysis Date:** 2026-03-11

## APIs & External Services

**Game Data (Primary):**
- SCPublic/titan-data GitHub repo — **single runtime file** `templates.json` at repo root
  - SDK/Client: Native `fetch` in `src/services/templatesLoader.ts` → `src/services/templatesCache.ts`
  - Auth: None (public GitHub raw content)
  - URL: `{baseUrl}templates.json` where base URL is titan-data root (e.g. `https://raw.githubusercontent.com/SCPublic/titan-data/master/`)
  - In-memory cache with deduplicated loading via `templatesCache`

**BattleScribe adapter (not used at runtime):**
- `src/adapters/battlescribe/` — legacy XML tooling only; app does not fetch BattleScribe or per-file overrides at runtime.

**GitHub REST API:**
- Used to check latest commit SHA for update detection (UI display)
  - `https://api.github.com/repos/SCPublic/titan-data/commits/master` (constant `TITAN_DATA_COMMITS_API_URL`)
  - `https://api.github.com/repos/SCPublic/engine-kill/commits/main` (constant `ENGINE_KILL_COMMITS_API_URL`)
  - Auth: None (unauthenticated, subject to rate limiting)

## Data Storage

**Databases:**
- None. No remote database in use.

**Local Storage:**
- AsyncStorage (via `@react-native-async-storage/async-storage` 2.2.0)
  - Client: `src/services/storageService.ts`
  - Used for: units, maniples, battlegroups, active battlegroup ID, player ID, player name, warhorn settings
  - All keys prefixed with `@engine_kill:` (see `STORAGE_KEYS` in `src/utils/constants.ts`)
  - Data stored as JSON strings; deserialized with defensive boolean/type sanitization on load

**File Storage:**
- Asset files bundled with app (audio `.ogg`, icons, images in `assets/`)
- No runtime file system reads/writes beyond AsyncStorage

**Caching:**
- In-memory module-level cache for template JSON via `src/services/templatesCache.ts`
- In-memory in-flight deduplication for titan-data override fetches via `src/services/titanDataOverrides.ts`
- No persistent disk cache for remote data

## Authentication & Identity

**Auth Provider:**
- None. No authentication system implemented.

**Player Identity:**
- Local player ID generated on first launch: `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
- Stored in AsyncStorage under `@engine_kill:player_id`
- Player name stored under `@engine_kill:player_name`
- Both managed in `src/context/GameContext.tsx`

## Monitoring & Observability

**Error Tracking:**
- None. No third-party error tracking service integrated.

**Logs:**
- `console.error` for storage failures in `src/services/storageService.ts`
- `console.warn` for template data loading issues in `src/services/templatesCache.ts`, `src/hooks/useTitanTemplates.ts`, and `src/services/titanDataOverrides.ts`
- `console.log` for plasma reactor updates in `src/context/GameContext.tsx`

## CI/CD & Deployment

**Hosting:**
- Web: Deployed to GitHub Pages at `/engine-kill/` base path (inferred from `app.json` `experiments.baseUrl` and `web.publicPath`)

**CI Pipeline:**
- Not detected (no `.github/workflows/`, no CI config files found)

## Webhooks & Callbacks

**Incoming:**
- None

**Outgoing:**
- None

## Firebase (Planned - Not Implemented)

**Status:** Firebase SDK 12.7.0 is listed as a dependency in `package.json` but has zero imports anywhere in `src/`. No Firebase initialization, Firestore, Auth, or Realtime Database code exists.

**Intended use:** Real-time multiplayer sync (per CLAUDE.md project overview). The `isLocal` field on `Unit` and `Maniple` models and the `sessionId` field on `Unit` are placeholders for future Firebase integration.

**Files relevant to future Firebase work:**
- `src/models/Unit.ts` - `isLocal: boolean`, `sessionId: string | null`
- `src/models/Maniple.ts` - `isLocal: boolean`
- `src/models/Session.ts` - Exists but not yet used

---

*Integration audit: 2026-03-11*
