# Codebase Concerns

**Analysis Date:** 2026-03-11

## Tech Debt

**Triple-Layer Data Sanitization:**
- Issue: Boolean coercion and field normalization runs in three separate places for the same data: `storageService.loadUnits()` (lines 41–85), the `GameContext` migration block (lines 190–296), and the per-render `safeUnits` mapping (lines 772–798). This indicates the root cause (data being stored in incorrect types) was patched repeatedly rather than fixed at the source.
- Files: `src/services/storageService.ts`, `src/context/GameContext.tsx`
- Impact: Every render re-maps all units through sanitization; CPU overhead scales with unit count. Confusing to trace when a boolean ends up wrong.
- Fix approach: Enforce type correctness at write time (in `saveUnits`). Remove the per-render `safeUnits` mapping; keep sanitization only in `loadUnits`. Migrate stored data once and remove migration branches.

**Accumulating Migration Code in `initialize()`:**
- Issue: `GameContext.tsx` `initialize()` (lines 188–296) contains 9 separate migration branches for legacy data shapes: `plasmaReactor`, `voidShieldSaves`, void shield model change (`front/left/right/rear` → `selectedIndex`), stats field renaming, damage minimum enforcement, `carapaceWeapon` string-to-null, armor field removal, boolean-string criticals, and battlegroup scoping. These branches run on every app start against every unit.
- Files: `src/context/GameContext.tsx`
- Impact: Startup time scales with unit count and migration complexity. New developers must understand all migrations to safely change data shapes. Difficult to test in isolation.
- Fix approach: Introduce a storage schema version number. Run migrations once on version bump, save the migrated data and new version, skip on subsequent starts.

**`HomeScreen.tsx` and `UnitEditScreen.tsx` are Oversized:**
- Issue: `HomeScreen.tsx` is 1,966 lines and contains 10+ modal dialogs, 5+ complex list renders (maniples, titans, banners, reinforcements, manage-maniple), and all wargear/upgrade picker UI. `UnitEditScreen.tsx` is 964 lines including inline weapon backfill logic and a nested IIFE upgrade picker.
- Files: `src/screens/HomeScreen.tsx`, `src/screens/UnitEditScreen.tsx`
- Impact: Hard to navigate, hard to test, hard to extract features. A crash or regression in one modal requires understanding the full 1,966-line file.
- Fix approach: Extract modal dialogs and list items into dedicated components. Consider dedicated `ManipleManageModal`, `TitanConfigModal`, `AddUnitModal`, `UpgradePickerModal` components.

**Hardcoded BattleScribe Internal IDs:**
- Issue: Multiple BattleScribe `selectionEntry` and `selectionEntryGroup` IDs are hardcoded as string literals in the adapter rather than resolved by name lookup. These IDs will break silently if the upstream BSData repo changes them.
  - Wargear group IDs: `f360-b4bd-e6cd-d077`, `c354-c2bb-8d84-0770`, `3bce-46aa-99ca-8f60`
  - Princeps Seniores entry: `2dc5-e9bf-6f6e-39a5`
  - Princeps trait group: `aa6b-a665-b907-234e`
  - Sinister Psi Titan template: `bs:dfeb-83af-7b26-622a` (in HomeScreen)
- Files: `src/adapters/battlescribe/battlescribeAdapter.ts`, `src/screens/HomeScreen.tsx`
- Impact: Silent data loss — upgrades, traits, or titan variants stop appearing with no error, just empty lists.
- Fix approach: Resolve by name/category string where possible. Document why ID-based lookup is used where unavoidable.

**`TEMPLATE_ID_ALIASES` Alias Table is Maintained Manually:**
- Issue: `src/utils/constants.ts` `TEMPLATE_ID_ALIASES` maps legacy `bs:` IDs to canonical chassis IDs. New titan variants with BS IDs require a manual entry here or units saved with those IDs will show a "No template loaded" warning. Only 4 entries exist.
- Files: `src/utils/constants.ts`, `src/screens/UnitEditScreen.tsx`
- Impact: Users with titans saved under old BS IDs see a prominent orange warning banner ("Damage tracks and armour may be wrong") and get no critical effects or armor rolls.
- Fix approach: Auto-generate aliases during template load from BattleScribe data; persist to avoid the need for a static table.

**Deprecated `String.prototype.substr()` Usage:**
- Issue: `substr()` is deprecated in modern JavaScript but still used in 3 places for ID generation.
- Files: `src/context/GameContext.tsx` (lines 176, 676), `src/services/unitService.ts` (line 31)
- Impact: Will produce deprecation warnings in future JS engines; low priority but indicates inconsistency (`slice` is used in 2 other places in the same file).
- Fix approach: Replace all `substr` calls with `slice`.

**`[key: string]: any` Index Signatures on Core Models:**
- Issue: Both `Weapon` and `UnitStats` interfaces use `[key: string]: any` index signatures, disabling TypeScript's type safety for any unknown fields.
- Files: `src/models/Unit.ts` (lines 23, 111), `src/models/UnitTemplate.ts` (line 23)
- Impact: Typos in property names on `Weapon` and `UnitStats` are not caught at compile time. The index signature also prevents strict property checking in spreads.
- Fix approach: Remove index signatures; use a separate `extra?: Record<string, unknown>` field if extensibility is genuinely required.

## Known Bugs

**Horn Sound: Audio Object is Not Unloaded on Navigation Away:**
- Symptoms: If the user navigates away from `UnitEditScreen` while a horn sound is playing, the `Audio.Sound` object is left in memory. The `setOnPlaybackStatusUpdate` callback will attempt to call `sound.unloadAsync()` on a component that may have unmounted.
- Files: `src/screens/UnitEditScreen.tsx` (lines 232–242)
- Trigger: Press horn, immediately navigate back.
- Workaround: None; the error is silently caught by the `catch (e)` block on the next play attempt.

**Deleting Battlegroup Does Not Delete Its Units or Maniples:**
- Symptoms: `deleteBattlegroupById` in `GameContext` deletes the battlegroup record and clears `activeBattlegroupId`, but does not delete or reassign units/maniples that have `battlegroupId` pointing to the deleted group. These orphaned entities accumulate in storage.
- Files: `src/context/GameContext.tsx` (lines 443–451)
- Trigger: Create a battlegroup, add titans, delete the battlegroup.
- Workaround: Orphaned units do not appear in UI (filtered by `battlegroupId`) but occupy storage indefinitely.

**`updateBattlegroup` Reads Stale State for `saveBattlegroups`:**
- Symptoms: `updateBattlegroup` dispatches `UPDATE_BATTLEGROUP` then immediately reads `state.battlegroups` to build the list to save. In React, `dispatch` is asynchronous in render; `state` still reflects the old value. The saved data is therefore one update behind what was dispatched.
- Files: `src/context/GameContext.tsx` (lines 409–440)
- Trigger: Rapid sequential calls to `updateBattlegroup` on the same battlegroup.
- Workaround: Same issue exists in `renameBattlegroup` (line 401–407) and `addUnitFromTemplate` (line 461). Single-call scenarios are usually fine since the stale read produces a diff of only 1 step.

## Security Considerations

**GitHub API Calls Without Authentication:**
- Risk: `BattlegroupListScreen` fetches `api.github.com/repos/SCPublic/titan-data/commits/master` and `api.github.com/repos/SCPublic/engine-kill/commits/main` without an auth token. The unauthenticated GitHub API rate limit is 60 requests/hour per IP. On cellular or shared networks, multiple users or app restarts can exhaust this quota, causing these endpoints to return 403.
- Files: `src/screens/BattlegroupListScreen.tsx` (lines 29–55)
- Current mitigation: Errors are silently swallowed (`.catch(() => {})`). The commit SHA is display-only.
- Recommendations: Either remove this feature or cache the SHA in AsyncStorage with a TTL to avoid hitting the API on every mount.

**Raw GitHub Content Fetched Without Integrity Check:**
- Risk: All game data (chassis overrides, damage tracks, weapon metadata, BattleScribe XML) is fetched from `raw.githubusercontent.com` over HTTPS. Content is parsed and used directly with no checksum verification. A compromised CDN or DNS spoofing could serve malicious XML that is then parsed.
- Files: `src/services/titanDataOverrides.ts`, `src/adapters/battlescribe/battlescribeAdapter.ts`
- Current mitigation: HTTPS provides transport-level protection.
- Recommendations: Ship known-good data as a bundled fallback. For sensitive deployments, validate a content hash against a pinned value.

**No Input Sanitization on User-Provided Names:**
- Risk: User-entered text (battlegroup names, titan names) is stored and rendered directly. No length limits are enforced at the model or storage layer. Extremely long names could cause layout overflow or performance issues in list rendering.
- Files: `src/context/GameContext.tsx` (`createBattlegroup`, `renameBattlegroup`), `src/screens/HomeScreen.tsx`
- Current mitigation: `trim()` is applied but no length cap.
- Recommendations: Add a max character limit (e.g., 64 chars) at the context action level.

## Performance Bottlenecks

**Per-Render Unit Sanitization in `GameContext`:**
- Problem: Every render of `GameProvider` re-maps all units through the `safeUnits` function (lines 772–798 in `GameContext.tsx`), iterating over every unit and every `head/body/legs × yellow/orange/red` combination (9 checks per unit).
- Files: `src/context/GameContext.tsx`
- Cause: Defensive sanitization placed in the render body rather than at load time.
- Improvement path: Move sanitization to `loadUnits()` and `storageService`; remove the per-render mapping.

**No Lazy Loading for BattleScribe XML:**
- Problem: On first load, the adapter fetches and parses 3 XML files in sequence (`Battlegroup.cat`, `Household.cat`, `Adeptus Titanicus 2018.gst`) for each of 5 data types (titans, maniples, legions, upgrades, princeps traits). Parsing the same XML multiple times is redundant.
- Files: `src/adapters/battlescribe/battlescribeAdapter.ts`, `src/services/templatesCache.ts`
- Cause: Each `load*FromBattleScribe` function fetches all source files independently; no shared XML parse cache.
- Improvement path: Fetch and parse XML once; pass the parsed `XmlNode` trees to all extraction functions.

**`cache: 'no-store'` on Every titan-data Fetch:**
- Problem: `titanDataOverrides.ts` uses `{ cache: 'no-store' }` on every `fetchJson` call, bypassing the browser/RN HTTP cache. Combined with the `?_=${Date.now()}` cache buster, this forces a full network round-trip on every data load.
- Files: `src/services/titanDataOverrides.ts` (line 81, 111)
- Cause: Designed to prevent stale data, but applied globally even when data hasn't changed.
- Improvement path: Use a versioned URL or ETag-based conditional fetch instead.

## Fragile Areas

**BattleScribe XML Adapter Heuristics:**
- Files: `src/adapters/battlescribe/battlescribeAdapter.ts`
- Why fragile: The adapter uses name-based substring matching (`includes('knight')`, `includes('servitor')`) and characteristic key guessing (14+ fallback key names for a single stat) to identify titans and parse stats. BSData naming conventions are not standardized; upstream changes to field names silently produce zero-value stats or incorrect chassis detection.
- Safe modification: Any change to `isLikelyTitanChassis`, `extractChassisMaxValues`, or `applyStatsOverlay` requires manual verification against all current BSData titan chassis. Add integration-style tests that snapshot expected template output.
- Test coverage: None.

**`INITIALIZE_PLAYER` Reducer Action Does Nothing:**
- Files: `src/context/GameContext.tsx` (line 122–123)
- Why fragile: The `INITIALIZE_PLAYER` case returns `state` unchanged, which means dispatching it has no effect. Any code that dispatches it expecting a state change will silently do nothing.
- Safe modification: Either remove the action type or implement it. Grep for dispatch calls using this type before removing.

**Void Shield Model Has Implicit Constraints Not Enforced at Type Level:**
- Files: `src/models/Unit.ts`, `src/context/GameContext.tsx`
- Why fragile: `voidShields.selectedIndex` must be `>= 0` and `< voidShieldSaves.length`. This is enforced only in `updateVoidShieldByIndex` (clamping) and partially in migrations, but is not enforced in `updateUnit` (which accepts arbitrary `Unit` values). A caller using `updateUnit` with an out-of-range index bypasses the guard.
- Safe modification: Always go through `updateVoidShieldByIndex` for shield state changes. Do not call `updateUnit` with manually constructed `voidShields` values.

**Fire-and-Forget Async Calls in UI Handlers:**
- Files: `src/screens/HomeScreen.tsx`, `src/screens/UnitEditScreen.tsx`
- Why fragile: Roughly 15 UI event handlers call async context functions with `void` (discarding the Promise). Storage errors (AsyncStorage write failures) are swallowed and the UI shows success state. Example: `void updateUnit(...)`, `void updateManiple(...)`.
- Safe modification: Wrap critical write calls in try/catch and surface errors to the user. At minimum, log failures.
- Test coverage: None.

**`ErrorBoundary` Shows Full Stack Trace to End Users:**
- Files: `src/components/ErrorBoundary.tsx` (lines 31–38)
- Why fragile: When a React render error occurs, the boundary renders `error.stack` directly in the UI — exposing internal file paths and implementation details to end users. This is also not recoverable (no retry button).
- Safe modification: Show a generic message with a "reload" or "clear data" option. Log the stack internally.

## Scaling Limits

**AsyncStorage Stores All Units as a Single JSON Blob:**
- Current capacity: All units are serialized to a single AsyncStorage key (`@engine_kill:units`). AsyncStorage performance degrades with value size; React Native's AsyncStorage has a practical limit of ~2MB per key on some platforms.
- Limit: With many detailed units (weapons, criticals, upgrades), serialized size grows proportionally. A large battlegroup collection with 50+ units could approach limits.
- Scaling path: Shard unit storage by battlegroup ID, or migrate to a structured local database (SQLite via expo-sqlite).

**Firebase SDK Is Installed but Entirely Unused:**
- Current capacity: `firebase: "^12.7.0"` is in `package.json` and `Session.ts` and `Unit.sessionId` are defined for future multiplayer, but zero Firebase code exists in `src/`.
- Impact: The SDK adds to bundle size for web and native builds. The `Session` model, `Unit.sessionId`, and `Unit.isLocal` fields are vestigial.
- Scaling path: Either implement Firebase integration or remove the dependency to reduce bundle size. The `Session.ts` model should be removed or marked as stub.

## Dependencies at Risk

**`react-navigation` Imported but Disabled:**
- Risk: Three screens have `@react-navigation/native` imports commented out with "Temporarily disabled" notes (HomeScreen, UnitEditScreen, UnitCreateScreen). The package appears in `package.json` under Expo's transitive dependencies. Navigation is implemented via `useState`/prop drilling instead.
- Impact: The app cannot deep-link, use back-button navigation on Android, or support device back gestures correctly because no navigation stack exists. "Temporarily" has persisted across multiple commits.
- Migration plan: Either commit to the custom prop-drilling navigation (remove commented code) or fully adopt React Navigation and remove the workaround state-based switching in `App.tsx`.

## Missing Critical Features

**No Error Recovery in `ErrorBoundary`:**
- Problem: The `ErrorBoundary` component (rendered around `GameProvider`) catches render errors but offers no path to recovery. There is no "clear data and restart" button, no retry, and no automatic reporting.
- Blocks: Users who encounter a corrupted unit that causes a render crash have no recourse except manually clearing app data.

**Banner Unit Points Not Tracked:**
- Problem: `getBattlegroupPoints` in `BattlegroupListScreen` explicitly comments "Titans only for now; banners can be added later." Banner units accumulate upgrades with point costs but these are omitted from the battlegroup total.
- Files: `src/screens/BattlegroupListScreen.tsx` (lines 82–91)
- Blocks: Accurate army points calculation for mixed titan/banner battlegroups.

**No Data Export or Backup:**
- Problem: User data is stored only in AsyncStorage with no export mechanism. Clearing app data, reinstalling, or switching devices loses all battlegroups, units, and maniples.
- Blocks: User confidence in long-term data retention; onboarding to new devices.

## Test Coverage Gaps

**Zero Test Files Exist:**
- What's not tested: Every component, hook, service, adapter, and context function has no automated test coverage whatsoever.
- Files: Entire `src/` directory
- Risk: Breaking changes to migration logic, BattleScribe parsing, storage serialization, or state updates are undetectable until manual testing. The BattleScribe adapter in particular (1,730 lines of heuristic XML parsing) is especially risky to modify without tests.
- Priority: High — especially for `src/services/storageService.ts`, `src/context/GameContext.tsx` (migration block), and `src/adapters/battlescribe/battlescribeAdapter.ts`.

---

*Concerns audit: 2026-03-11*
