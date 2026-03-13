# Architecture

**Analysis Date:** 2026-03-11

## Pattern Overview

**Overall:** Context-driven single-page React Native app with a layered service architecture.

**Key Characteristics:**
- Single global state store via React Context + useReducer (no Redux, no Zustand)
- All mutations go through context action functions that dispatch to reducer AND persist to AsyncStorage
- Navigation is state-based (no react-navigation router) — `activeUnitId` and `activeBattlegroupId` drive which screen renders
- Remote game data (titan templates, maniples, legions, upgrades) is fetched from external GitHub-hosted JSON/XML at runtime via a singleton cache layer
- No backend; all persistence is local AsyncStorage. Firebase SDK included but not yet wired up

## Layers

**Entry Point:**
- Purpose: Register root component and bootstrap the app
- Location: `index.ts`
- Contains: Expo root registration only
- Depends on: `App.tsx`
- Used by: Expo runtime

**App Shell (`App.tsx`):**
- Purpose: Configure providers, load fonts, handle top-level navigation routing
- Location: `App.tsx`
- Contains: `GameProvider`, `PaperProvider`, `GestureHandlerRootView`, `ErrorBoundary`, `AppNavigator`
- Depends on: `src/context/GameContext.tsx`, `src/theme/tokens.ts`, all three screens
- Used by: Expo runtime via `index.ts`

**State Layer:**
- Purpose: Centralized game state, all mutations, and async persistence coordination
- Location: `src/context/GameContext.tsx`
- Contains: `GameState`, `GameAction` union type, `gameReducer`, `GameProvider`, `useGame` hook
- Depends on: `storageService`, `unitService`, models (`Unit`, `Battlegroup`, `Maniple`), `useManipleTemplates`
- Used by: Every screen and most components via `useGame()`

**Service Layer:**
- Purpose: Pure logic and I/O, no React dependencies
- Location: `src/services/`
- Key files:
  - `unitService.ts` — unit creation from templates, damage/heat/weapon update helpers (pure, returns new Unit)
  - `storageService.ts` — AsyncStorage read/write with boolean sanitization and defensive parsing
  - `battleScribeCache.ts` — singleton module-level cache for all remote template loads (titans, maniples, legions, upgrades, princeps traits)
  - `titanDataOverrides.ts` — fetches chassis overrides, damage tracks, weapon metadata, and critical effects from the titan-data GitHub repo
- Depends on: models, AsyncStorage, fetch API
- Used by: `GameContext` (storageService, unitService), hooks (battleScribeCache via adapter)

**Adapter Layer:**
- Purpose: Parse external BattleScribe XML + apply titan-data JSON overrides into typed `UnitTemplate` / `ManipleTemplate` objects
- Location: `src/adapters/battlescribe/`
- Key files:
  - `battlescribeAdapter.ts` — entry point for all template loading functions
  - `xml.ts` — XML parsing helpers
- Depends on: `titanDataOverrides.ts`, `UnitTemplate`, `ManipleTemplate`, `constants.ts`
- Used by: `battleScribeCache.ts`

**Hook Layer:**
- Purpose: React hooks that wrap `battleScribeCache` to deliver remote templates to components with loading state
- Location: `src/hooks/`
- Key files:
  - `useTitanTemplates.ts` — titans with filtering (legend, playable, excluded variants)
  - `useManipleTemplates.ts` — maniple formation templates
  - `useLegionTemplates.ts` — legion identity templates
  - `useUpgradeTemplates.ts` — wargear upgrade templates
  - `usePrincepsTraitTemplates.ts` — princeps trait options
  - `useBreakpoint.ts` — responsive layout helper (`sm`/`md`/`lg`)
- Depends on: `battleScribeCache`, model types
- Used by: Screens (`HomeScreen`, `UnitEditScreen`, `BattlegroupListScreen`)

**Screen Layer:**
- Purpose: Full-page views; compose components and call context actions
- Location: `src/screens/`
- Key files:
  - `BattlegroupListScreen.tsx` — default landing; list/create/edit/delete battlegroups; fetches GitHub commit SHAs for version display
  - `HomeScreen.tsx` — unit/maniple list for active battlegroup; create titans into maniples or as reinforcements
  - `UnitEditScreen.tsx` — full unit tracker UI (shields, damage, weapons, heat, reactor, upgrades, warhorn audio)
  - `UnitCreateScreen.tsx` — unit creation flow (minimal, may be integrated into HomeScreen modals)
- Depends on: `useGame`, template hooks, components, models, theme tokens
- Used by: `AppNavigator` in `App.tsx`

**Component Layer:**
- Purpose: Focused, reusable UI widgets; receive props and call context actions or callbacks
- Location: `src/components/`
- Key files:
  - `VoidShieldDisplay.tsx` — pip-row shield tracker
  - `DamageTrack.tsx` — pip-row damage tracker per location
  - `CriticalDamageTracker.tsx` — critical hit level selector (yellow/orange/red)
  - `PlasmaReactorDisplay.tsx` — pip-row reactor heat tracker
  - `WeaponMount.tsx` — single weapon slot display with status
  - `WeaponSelectionModal.tsx` — weapon picker modal
  - `StatsPanel.tsx` — titan stat block display
  - `SpecialRulesDisplay.tsx` — special rules text display
  - `RangeAccTable.tsx` — range/accuracy table display
  - `ColorDisplayRow.tsx` — color-coded pip row utility
  - `ScreenWrapper.tsx` — scroll/safe area wrapper
  - `ErrorBoundary.tsx` — React class error boundary (wraps entire app)
- Depends on: theme tokens, models, `useGame` (for mutations in some components)
- Used by: `UnitEditScreen`, `HomeScreen`

**Data Layer:**
- Purpose: Static local data for unit types not sourced from BattleScribe
- Location: `src/data/`
- Key file: `bannerTemplates.ts` — hardcoded `UnitTemplate[]` for banner/knight units
- Depends on: `UnitTemplate` model
- Used by: `UnitEditScreen`, `HomeScreen`

**Model Layer:**
- Purpose: TypeScript interfaces defining data shapes; no logic
- Location: `src/models/`
- Key files:
  - `Unit.ts` — `Unit`, `Weapon`, `DamageLocation`, `CriticalDamage`, `UnitUpgrade`, `PrincepsTrait`
  - `UnitTemplate.ts` — `UnitTemplate`, `WeaponTemplate`, `UnitStats`, `ArmorRolls`, `CriticalEffect`
  - `Battlegroup.ts` — `Battlegroup`, `BattlegroupAllegiance`
  - `Maniple.ts` — `Maniple`
  - `ManipleTemplate.ts` — `ManipleTemplate`, `ManipleAllegiance`
  - `LegionTemplate.ts`, `UpgradeTemplate.ts`, `PrincepsTraitTemplate.ts` — auxiliary template types
  - `Session.ts` — placeholder for future Firebase multiplayer session

**Theme Layer:**
- Purpose: Design tokens shared across all UI
- Location: `src/theme/tokens.ts`
- Contains: `colors`, `spacing`, `radius`, `fontSize`, `layout` constants
- Used by: all screens and components

## Data Flow

**App Initialization:**

1. Expo calls `registerRootComponent(App)` via `index.ts`
2. `App.tsx` loads fonts; renders `GameProvider` once fonts are ready
3. `GameProvider` `useEffect` runs: loads playerId, playerName, units, battlegroups, maniples from AsyncStorage
4. Data migrations run inline: void shield format, damage minimums, battlegroup allegiance, battlegroupId scoping
5. Context dispatches `LOAD_*` actions; `isLoading` set to `false`
6. `AppNavigator` renders the appropriate screen based on `state.activeBattlegroupId` and local `activeUnitId`

**Template Loading:**

1. Hooks (e.g., `useTitanTemplates`) call `battleScribeCache.loadTitansOnce()` on mount
2. Cache checks module-level `CacheEntry` — if idle, starts fetch via `battlescribeAdapter`
3. Adapter fetches BattleScribe `.gst` XML from `titan-data` GitHub repo, parses XML, then calls `loadTitanDataOverrides` to fetch chassis/damage/weapon override JSON
4. Adapter merges overrides into `UnitTemplate[]` and returns
5. Cache stores result; subsequent hook mounts return immediately from cache (no re-fetch on remount)
6. Hook exposes filtered views: `titanTemplates`, `titanTemplatesNonLegend`, `titanTemplatesPlayable`

**Unit Mutation:**

1. User interacts with a component (e.g., taps a shield pip)
2. Component calls a context function (e.g., `updateVoidShieldByIndex`)
3. Context function finds unit in `state.units`, computes updated unit (often via `unitService` helper)
4. `dispatch({ type: 'UPDATE_UNIT', payload: updatedUnit })` → reducer returns new state with unit replaced
5. `storageService.saveUnits(allUpdatedUnits)` persists full units array to AsyncStorage
6. React re-renders affected components

**State Management:**
- All state in a single `GameState` object in `GameContext`
- Reducer handles all action types purely (no side effects in reducer)
- Side effects (persistence, ID generation) are in context functions, not the reducer
- No local component state for game data — components read from `state.units`, `state.battlegroups`, etc.

## Key Abstractions

**Unit:**
- Purpose: Complete runtime state of a titan or banner unit during a game session
- Examples: `src/models/Unit.ts`
- Pattern: Plain object (no class); created by `unitService.createUnitFromTemplate`, mutated immutably by context functions

**UnitTemplate:**
- Purpose: Static definition of a titan/banner chassis including default stats and available weapons
- Examples: `src/models/UnitTemplate.ts`
- Pattern: Loaded from remote BattleScribe XML at runtime; local static fallback in `src/data/bannerTemplates.ts`

**Battlegroup:**
- Purpose: Named roster container for units and maniples with allegiance (loyalist/traitor)
- Examples: `src/models/Battlegroup.ts`
- Pattern: Plain object; `reinforcementOrder` field stores ordered unit IDs for display

**Maniple:**
- Purpose: Tactical formation grouping titan units; references `ManipleTemplate` for rules constraints
- Examples: `src/models/Maniple.ts`
- Pattern: Contains `titanUnitIds: string[]`; one titan may belong to only one maniple (enforced in context)

**BattleScribeCache:**
- Purpose: Singleton in-memory cache preventing duplicate network fetches across component remounts
- Examples: `src/services/battleScribeCache.ts`
- Pattern: Module-level `CacheEntry<T>` objects with `status` ('idle'|'loading'|'loaded'|'error') and deduplication via shared Promise

## Entry Points

**Expo Root:**
- Location: `index.ts`
- Triggers: Expo runtime on app launch
- Responsibilities: Calls `registerRootComponent(App)`

**App Component:**
- Location: `App.tsx`
- Triggers: `index.ts` registration
- Responsibilities: Loads fonts; mounts providers (`GestureHandlerRootView`, `ErrorBoundary`, `PaperProvider`, `GameProvider`); renders `AppNavigator`

**AppNavigator (inside App.tsx):**
- Location: `App.tsx` (inner component)
- Triggers: State changes to `state.activeBattlegroupId` and local `activeUnitId`
- Responsibilities: Chooses which screen to render; passes `onBack`/`onOpenUnit` callbacks

## Error Handling

**Strategy:** Defensive at every layer; errors are caught and logged, never crash the app silently.

**Patterns:**
- `ErrorBoundary` class component wraps the entire app in `App.tsx`; renders a plain error message on uncaught render errors
- All `storageService` methods have `try/catch` blocks returning empty arrays or `null` on failure
- `GameProvider` initialization wrapped in `try/finally` to ensure `isLoading` is always set to `false`
- `battleScribeCache` sets `status: 'error'` on failed loads; hooks display empty state rather than crashing
- Boolean sanitization (`parseBooleanLike`, `parseIsLocal`) applied on every AsyncStorage load to guard against data corruption

## Cross-Cutting Concerns

**Logging:** `console.error` for storage errors, `console.warn` for template loading issues, `console.log` for debug state (plasma reactor). No structured logging library.

**Validation:** Input validation is inline in context functions (e.g., `if (!trimmed) return`, `Math.max/min` clamping). No dedicated validation library.

**Authentication:** None. Player identity is a locally generated UUID stored in AsyncStorage (`@engine_kill:player_id`). Firebase multiplayer is planned but not implemented.

**Data Migration:** Inline in `GameProvider` initialization — migrations run on every load against the full units/battlegroups/maniples arrays and re-save if any changes occurred.

---

*Architecture analysis: 2026-03-11*
