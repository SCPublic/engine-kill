# Codebase Structure

**Analysis Date:** 2026-03-11

## Directory Layout

```
engine-kill/                    # Project root
├── index.ts                    # Expo entry point (registerRootComponent)
├── App.tsx                     # Root component, providers, navigation router
├── app.json                    # Expo app configuration
├── package.json                # Dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── metro.config.js             # Metro bundler config
├── webpack.config.js           # Web bundler config
├── src/
│   ├── adapters/
│   │   └── battlescribe/       # BattleScribe XML parsing layer
│   │       ├── battlescribeAdapter.ts  # Public API for all template loading
│   │       └── xml.ts                 # XML parsing utilities
│   ├── components/             # Reusable UI components
│   ├── context/
│   │   └── GameContext.tsx     # Central state (useReducer + persistence)
│   ├── data/
│   │   └── bannerTemplates.ts  # Static local banner/knight templates
│   ├── hooks/                  # React hooks for remote template data
│   ├── models/                 # TypeScript interfaces only (no logic)
│   ├── screens/                # Full-page screen components
│   ├── services/               # Pure logic and I/O services
│   ├── theme/
│   │   └── tokens.ts           # Design token constants (colors, spacing, etc.)
│   └── utils/                  # Shared utility functions and constants
├── assets/
│   └── images/                 # App icons, splash screens
├── docs/                       # Developer documentation
├── public/                     # Static web assets
├── android/                    # Android native project (Expo managed)
├── ios/                        # iOS native project (Expo managed)
├── .planning/
│   └── codebase/               # GSD planning documents
└── .github/
    └── workflows/              # CI/CD workflow definitions
```

## Directory Purposes

**`src/adapters/battlescribe/`:**
- Purpose: Translate raw BattleScribe XML game system files into typed app models
- Contains: XML parsing, template construction, override merging logic
- Key files: `battlescribeAdapter.ts` (exports `loadAllTitanTemplatesFromBattleScribe`, `loadManipleTemplatesFromBattleScribe`, `loadLegionTemplatesFromBattleScribe`, `loadUpgradeTemplatesFromBattleScribe`, `loadPrincepsTraitTemplatesFromBattleScribe`), `xml.ts`

**`src/components/`:**
- Purpose: Reusable single-responsibility UI widgets used across screens
- Contains: Game tracker components (shields, damage, weapons, heat, reactor) and structural utilities
- Key files: `VoidShieldDisplay.tsx`, `DamageTrack.tsx`, `CriticalDamageTracker.tsx`, `PlasmaReactorDisplay.tsx`, `WeaponMount.tsx`, `WeaponSelectionModal.tsx`, `StatsPanel.tsx`, `SpecialRulesDisplay.tsx`, `RangeAccTable.tsx`, `ColorDisplayRow.tsx`, `ScreenWrapper.tsx`, `ErrorBoundary.tsx`

**`src/context/`:**
- Purpose: Global React state management
- Contains: Single file — `GameContext.tsx` with `GameState`, `GameAction`, `gameReducer`, `GameProvider`, `useGame`
- Key files: `GameContext.tsx`

**`src/data/`:**
- Purpose: Static local data files that do not come from BattleScribe
- Contains: Hardcoded template arrays for banner/knight unit types
- Key files: `bannerTemplates.ts`

**`src/hooks/`:**
- Purpose: Custom hooks that wrap the `battleScribeCache` singleton and expose remote templates with React loading state
- Contains: One hook per template domain
- Key files: `useTitanTemplates.ts`, `useManipleTemplates.ts`, `useLegionTemplates.ts`, `useUpgradeTemplates.ts`, `usePrincepsTraitTemplates.ts`, `useBreakpoint.ts`

**`src/models/`:**
- Purpose: Pure TypeScript interface definitions; no runtime logic
- Contains: Interfaces for all persisted and runtime data shapes
- Key files: `Unit.ts`, `UnitTemplate.ts`, `Battlegroup.ts`, `Maniple.ts`, `ManipleTemplate.ts`, `LegionTemplate.ts`, `UpgradeTemplate.ts`, `PrincepsTraitTemplate.ts`, `Session.ts`

**`src/screens/`:**
- Purpose: Full-page components rendered by `AppNavigator`
- Contains: Top-level view logic; compose components, consume context and hooks
- Key files: `BattlegroupListScreen.tsx`, `HomeScreen.tsx`, `UnitEditScreen.tsx`, `UnitCreateScreen.tsx`

**`src/services/`:**
- Purpose: Logic and I/O with no direct React dependencies
- Contains: AsyncStorage persistence, unit factory/mutation helpers, remote data caching, external JSON fetching
- Key files: `storageService.ts`, `unitService.ts`, `battleScribeCache.ts`, `titanDataOverrides.ts`

**`src/theme/`:**
- Purpose: Design system constants used throughout all UI files
- Contains: Single `tokens.ts` exporting `colors`, `spacing`, `radius`, `fontSize`, `layout`
- Key files: `src/theme/tokens.ts`

**`src/utils/`:**
- Purpose: Shared utility functions and app-wide constants
- Contains: Storage key strings, URL constants, template ID aliases, alert helper, titan scale ordering
- Key files: `constants.ts` (STORAGE_KEYS, URL constants, TEMPLATE_ID_ALIASES), `alert.ts`, `titanScaleOrder.ts`

## Key File Locations

**Entry Points:**
- `index.ts`: Expo root registration
- `App.tsx`: Root component, provider setup, top-level navigation

**Configuration:**
- `app.json`: Expo app name, slug, icons, splash screen
- `tsconfig.json`: TypeScript compiler settings
- `metro.config.js`: Metro bundler (React Native packager) settings
- `webpack.config.js`: Web build settings
- `package.json`: Scripts and dependency versions

**Core Logic:**
- `src/context/GameContext.tsx`: All game state, actions, and persistence coordination
- `src/services/unitService.ts`: Unit creation and mutation helpers (pure functions)
- `src/services/storageService.ts`: AsyncStorage persistence interface
- `src/services/battleScribeCache.ts`: Singleton cache for all remote template data
- `src/adapters/battlescribe/battlescribeAdapter.ts`: BattleScribe XML to `UnitTemplate` translation

**Models:**
- `src/models/Unit.ts`: Runtime unit state
- `src/models/UnitTemplate.ts`: Static chassis definition
- `src/models/Battlegroup.ts`: Roster container

**Theme:**
- `src/theme/tokens.ts`: All design tokens (import `colors`, `spacing`, `radius`, `fontSize`, `layout`)

**Static Data:**
- `src/data/bannerTemplates.ts`: Local banner/knight unit templates
- `src/utils/constants.ts`: Storage keys, GitHub URLs, template ID aliases

## Naming Conventions

**Files:**
- Screens: `PascalCase` with `Screen` suffix — e.g., `HomeScreen.tsx`, `UnitEditScreen.tsx`
- Components: `PascalCase` — e.g., `VoidShieldDisplay.tsx`, `WeaponMount.tsx`
- Hooks: `camelCase` with `use` prefix — e.g., `useTitanTemplates.ts`, `useBreakpoint.ts`
- Services: `camelCase` with `Service` or `Cache` suffix — e.g., `storageService.ts`, `battleScribeCache.ts`
- Models: `PascalCase` matching the interface name — e.g., `Unit.ts`, `UnitTemplate.ts`
- Utils: `camelCase` — e.g., `constants.ts`, `titanScaleOrder.ts`

**Directories:**
- `camelCase` — `adapters`, `components`, `context`, `data`, `hooks`, `models`, `screens`, `services`, `theme`, `utils`

**Identifiers:**
- IDs use `snake_case` prefixed strings at runtime: `unit_${Date.now()}_${random}`, `maniple_${Date.now()}_${random}`, `battlegroup_${Date.now()}_${random}`
- BattleScribe-sourced IDs are prefixed with `bs:` — e.g., `bs:3ad7-cd10-8d6e-8c2e`
- AsyncStorage keys use `@engine_kill:` namespace — e.g., `@engine_kill:units`

## Where to Add New Code

**New game tracker component (e.g., a new pip display):**
- Implementation: `src/components/NewTrackerDisplay.tsx`
- Usage: Import into `src/screens/UnitEditScreen.tsx` or `src/screens/HomeScreen.tsx`
- Follow existing component pattern: receive `unit` or specific props; call `useGame()` for mutations or accept callbacks

**New context action (e.g., update a new field on Unit):**
1. Add field to `Unit` interface in `src/models/Unit.ts`
2. Add action type to `GameAction` union in `src/context/GameContext.tsx`
3. Add reducer case in `gameReducer`
4. Add context function and expose it in `GameContextType`
5. Add `storageService` usage (usually just re-save all units via `storageService.saveUnits`)
6. Add migration logic in `GameProvider` `useEffect` if old saves lack the field

**New screen:**
- Implementation: `src/screens/NewFeatureScreen.tsx`
- Navigation: Add rendering logic to `AppNavigator` in `App.tsx` (state-based; add a state variable like `activeFeatureId`)

**New hook for remote data:**
- Implementation: `src/hooks/useNewThing.ts`
- Follow pattern of `useTitanTemplates.ts`: wrap `battleScribeCache`, manage `isLoading`, expose `reloadToken`

**New adapter loader (new BattleScribe data type):**
1. Add loader function to `src/adapters/battlescribe/battlescribeAdapter.ts`
2. Add a `CacheEntry` and methods to `src/services/battleScribeCache.ts`
3. Create hook in `src/hooks/useNewThingTemplates.ts`

**New persistent data type:**
1. Define interface in `src/models/NewThing.ts`
2. Add storage key to `STORAGE_KEYS` in `src/utils/constants.ts`
3. Add save/load methods to `src/services/storageService.ts`
4. Add state field, action types, reducer cases, and context functions to `src/context/GameContext.tsx`

**Shared utility:**
- Location: `src/utils/` — add a new file with a descriptive `camelCase` name

## Special Directories

**`android/` and `ios/`:**
- Purpose: Native platform project files managed by Expo
- Generated: Partially (Expo prebuild)
- Committed: Yes — these are checked in for CI/CD purposes

**`.expo/`:**
- Purpose: Expo CLI cache and web build artifacts
- Generated: Yes
- Committed: Partially (`.expo/web/cache` is gitignored; top-level `.expo/` may have tracked metadata)

**`.planning/`:**
- Purpose: GSD planning documents for AI-assisted development
- Generated: Yes (by GSD tooling)
- Committed: Yes

**`public/`:**
- Purpose: Static assets served directly for the web build
- Generated: No
- Committed: Yes

**`docs/`:**
- Purpose: Developer documentation
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-03-11*
