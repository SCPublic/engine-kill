# Testing — templates loader & single source

**Context:** See **[`AGENT_DATA_CONTEXT.md`](./AGENT_DATA_CONTEXT.md)** for repos, audit snapshot, and refactor status. **[`REFACTOR_PROGRESS.md`](./REFACTOR_PROGRESS.md)** is the retrospective for the completed single-JSON refactor.

This doc maps those items to **Jest** and **E2E** tests: accurate data loading, single source of truth, no runtime BattleScribe weapon loaders.

---

## Goals

- **Single source:** App loads only `templates.json` from titan-data at runtime; no override fetch, no adapter in the app path.
- **No runtime BS weapon loaders:** UnitEditScreen (and hooks) use only `template.availableWeapons` / `template.specialRules`; no `loadWarhoundWeaponsFromBattleScribe` or `loadQuestorisWeaponsFromBattleScribe` at runtime.

**Division of responsibility:** Validating that the payload has the right shape and required fields (e.g. titans have `availableWeapons`, `defaultStats.damage`) is **titan-data's job**. Engine-kill tests only its own behavior: that it loads from the right URL, fails fast on bad responses, and does not call BattleScribe weapon loaders at runtime. Engine-kill consumes whatever titan-data ships.

---

## Test categories

### 1. Loader contract (templatesLoader)

**Purpose:** Confirm the single loader fetches the right URL, rejects bad responses, and returns the expected payload shape.

| Test | What it guards |
|------|----------------|
| `loadTemplatesFromJson` builds URL as `{baseUrl}/templates.json` (with/without trailing slash) | Regression: wrong path or extra overrides URL |
| On `fetch` failure (e.g. 404), throws with message including status and URL | No silent fallback; errors bubble |
| On invalid JSON (missing `titans`), throws "Invalid templates.json: missing titans" | Bad data fails fast |
| On valid minimal payload `{ titans: [] }`, returns object with `titans`, `banners`, `maniples`, `legions`, `upgrades`, `princepsTraits`, `warnings` all arrays | Payload shape stays stable |
| Non-array keys in payload are coerced to `[]` (e.g. `banners: undefined` → `[]`) | Safe defaults without hiding missing data in titan-data |

**Implementation:** Mock `global.fetch` in tests; call `loadTemplatesFromJson(baseUrl)` and assert URL, throw message, and return shape.

---

### 2. Template data shape (accurate data)

**Purpose:** Ensure templates used by the app have required fields so that UnitEditScreen and unit creation don’t rely on silent fallbacks.

| Test | What it guards |
|------|----------------|
| Each titan in payload has `id`, `name`, `unitType`, `defaultStats`, `availableWeapons` (array) | Missing required fields surface as test failure, not runtime blank UI |
| Each banner in payload has `id`, `name`, `unitType`, `defaultStats`, `availableWeapons` (array) | Same for banners |
| `defaultStats` has required fields (e.g. titan: `voidShields.max`, `voidShieldSaves`, `maxHeat`, `plasmaReactorMax`, `damage`, `hasCarapaceWeapon`, `stats`) | Data in titan-data matches UnitTemplate / Unit expectations |
| Each entry in `availableWeapons` has `id`, `name`, `mountType`, and expected weapon fields | Weapon list is complete enough for weapon mount UI |

**Implementation:** Either (a) use a **fixture** `templates.json` (or a small in-test object) and run these assertions after `loadTemplatesFromJson` with mocked fetch, or (b) add a **snapshot** of the minimal required shape and assert payload keys/structure. Prefer (a) with an explicit fixture so “accurate data” is defined in one place.

---

### 3. Single source (no override fetch)

**Purpose:** Confirm the app does not fetch any override file or second source at runtime.

| Test | What it guards |
|------|----------------|
| When loading templates, `fetch` is called exactly once with a URL ending in `templates.json` | No second fetch for overrides or XML |
| Cache (e.g. `templatesCache.loadTitansOnce()`) ultimately uses the same single fetch (e.g. via `loadTemplatesFromJson`) | All template data flows from one loader |

**Implementation:** Mock `fetch`; trigger template load (e.g. via `templatesCache.loadTemplatesPayloadOnce()` or the loader directly); assert `fetch` call count and URL. If the cache is hard to trigger in isolation, at least test `loadTemplatesFromJson` with a mock and document that the cache delegates to it (covered by unit tests for the loader).

---

### 4. No runtime BattleScribe weapon loaders (step 3)

**Purpose:** Ensure UnitEditScreen and app hooks never call `loadWarhoundWeaponsFromBattleScribe` or `loadQuestorisWeaponsFromBattleScribe` at runtime.

| Test | What it guards |
|------|----------------|
| No file under `src/screens` or `src/hooks` imports or references `loadWarhoundWeaponsFromBattleScribe` or `loadQuestorisWeaponsFromBattleScribe` | Regression: someone re-wiring UnitEditScreen to BS weapon loaders |
| Optional: no file under `src` (except adapters and generator) references those functions | Stricter: only adapter/generator may reference them |

**Implementation:** Jest test that reads source files (e.g. `fs.readFileSync` or `require('fs')`) in `src/screens` and `src/hooks` (and optionally other `src` dirs) and asserts that file content does not contain those function names. Alternatively, use a static analysis (e.g. grep in a test) so that adding an import of the adapter’s weapon loader fails the test.

---

### 5. No adapter or titanDataOverrides in app runtime (step 4)

**Purpose:** Ensure no app code imports the BattleScribe adapter or `titanDataOverrides`. Those modules are not part of the app bundle.

---

### 6. Step 6: template cache behavior (rename regression)

**Purpose:** Ensure the template cache **core functionality** still works: the cache loads from the loader, returns the shape the app needs, and a single fetch serves all category loaders. These are behavioral tests, not string scans.

| Test | What it guards |
|------|----------------|
| Cache `loadTitansOnce()` returns `{ templates, warnings, missingMaxData, legendTitans }` with fixture data | Rename didn't break cache or its wiring to the loader |
| Cache `loadBannersOnce()` returns `{ templates, warnings }` from same payload | Banners path still works |
| Cache `loadTemplatesPayloadOnce()` returns full payload (titans, banners, maniples, etc.) | Full payload API intact |
| `getTitanResultSnapshot()` shows `loaded` and result after load | Snapshot API still used by hooks |
| Single fetch when calling both `loadTitansOnce()` and `loadBannersOnce()` | Shared payload / single-fetch behavior preserved |

**Implementation:** `src/services/__tests__/templatesCache.test.ts`. Mock `global.fetch` to return `templates-minimal.json`; reset cache in `beforeEach`; call the cache's load methods and assert on returned shape and fixture content (e.g. Reaver titan with `availableWeapons`, `defaultStats.damage`).

**E2E:** `e2e/templates-on-screen.spec.ts` covers app load + create Reaver + unit screen. Run `npm run test:e2e` after loader/cache changes.

---

### 7. Fixture-based “accurate data” example

**Purpose:** One canonical fixture that represents the minimal valid `templates.json` shape; tests assert that the loader accepts it and that key templates have expected structure.

| Test | What it guards |
|------|----------------|
| Fixture contains at least one titan (e.g. Reaver) with `availableWeapons.length >= 1`, `specialRules` array, `defaultStats.damage` (head/body/legs) | titan-data can ship this shape and the app will work |
| Fixture contains at least one banner (e.g. Questoris) with `availableWeapons`, `defaultStats.structurePointsMax` (or equivalent), `unitType: 'banner'` | Same for banners |
| After loading fixture via mocked fetch, `loadTemplatesFromJson` return value passes the same “required fields” checks as in category 2 | End-to-end shape validation for the single file |

**Implementation:** Add `src/__fixtures__/templates-minimal.json` (or a .ts object) with one titan and one banner. Mock `fetch` to return it; run loader and run the same shape assertions. Protects against the loader or the fixture format changing in a way that would break the app.

---

## Suggested test layout

```
src/
  services/
    __tests__/
      templatesLoader.test.ts   # Categories 1, 2 (loader contract + shape with fixture)
      templatesCache.test.ts    # Step 6: cache behavior (load + shape)
  __tests__/
    noRuntimeTemplateWeaponLoaders.test.ts   # Category 4
  __fixtures__/
    templates-minimal.json      # Minimal valid payload for category 2 + 5
```

The cache single-fetch behavior is covered by `templatesCache.test.ts` (step 6).

---

## E2E — `e2e/templates-on-screen.spec.ts`

**Covered:** Stub `templates.json`, battlegroups home, create battlegroup, add Reaver from template, open unit, assert template-derived labels/weapons/stats. Uses sibling `titan-data` JSON when present, else `templates-minimal.json`.

**Optional later:** Banner create flow; reload-templates button; expand specs as needed.

**Why E2E matters:** Jest tests loader/cache in isolation; E2E tests the real UI path.

---

## Running tests

### Unit tests (Jest)

- Run: `npm test` (or `npx jest`).

### E2E tests (Playwright)

Playwright loads the app in a browser, **intercepts** the request for `templates.json`, and responds with a local fixture so tests are deterministic.

- Install browsers: `npx playwright install chromium`
- Run: `npm run test:e2e`. Uses **`npm run web:test`** and port **8199** by default.
- If Expo uses another port: `PLAYWRIGHT_BASE_URL=http://localhost:8100 npm run test:e2e`.

---

## Summary table (REFACTOR_PROGRESS ↔ tests)

| REFACTOR_PROGRESS item | Test category | Example test |
|------------------------|---------------|--------------|
| #1 App loads only templates.json | 1, 2 | URL and single fetch |
| #2 Phase 2 single loader in place | 1, 2 | Loader contract; cache uses loader |
| #3 UnitEditScreen uses template only | 4 | No BS weapon loaders in screens/hooks |
| #4 No adapter/titanDataOverrides in app runtime | 5 | No app file (except adapters/ and titanDataOverrides.ts) imports adapter or titanDataOverrides |
| #5b E2E | E2E | `e2e/templates-on-screen.spec.ts` |
| #6 Rename BattleScribe → templates | 6 | Template cache behavioral tests |
| No override fetch | 2 | fetch called once, correct path |
| No silent fallback | 1 | Invalid/missing data throws |

Payload shape / “accurate data” (required fields on titans and banners) is **titan-data’s job**; engine-kill does not test that.

These tests lock in the contract and prevent regressions for the single-file templates pipeline.
