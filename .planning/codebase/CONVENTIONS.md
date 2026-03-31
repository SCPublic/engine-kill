# Coding Conventions

**Analysis Date:** 2026-03-11

## Naming Patterns

**Files:**
- Components: PascalCase matching the exported component name (`VoidShieldDisplay.tsx`, `WeaponMount.tsx`)
- Screens: PascalCase with `Screen` suffix (`HomeScreen.tsx`, `UnitEditScreen.tsx`, `BattlegroupListScreen.tsx`)
- Hooks: camelCase with `use` prefix (`useBreakpoint.ts`, `useTitanTemplates.ts`)
- Services: camelCase singleton exported as const (`storageService`, `unitService`, `templatesCache`)
- Models: PascalCase matching the primary interface (`Unit.ts`, `UnitTemplate.ts`, `Battlegroup.ts`)
- Adapters: grouped by external source (`src/adapters/battlescribe/battlescribeAdapter.ts`)
- Data files: camelCase (`bannerTemplates.ts`)
- Utility files: camelCase (`constants.ts`, `titanScaleOrder.ts`, `alert.ts`)

**Functions:**
- React components: PascalCase (`function VoidShieldDisplay`, `function GameProvider`, `function AppNavigator`)
- Custom hooks: camelCase with `use` prefix (`useTitanTemplates`, `useBreakpoint`)
- Context action functions: camelCase verbs (`createBattlegroup`, `updateUnit`, `deleteManiple`)
- Service methods: camelCase verbs (`saveUnits`, `loadUnits`, `createUnitFromTemplate`)
- Helper/private functions: camelCase (`colorToRgb`, `hexToRgba`, `parseBooleanLike`, `weaponTemplateToWeapon`)

**Variables:**
- camelCase throughout (`playerId`, `activeBattlegroupId`, `titanTemplatesPlayable`)
- Boolean variables prefixed with `is` or `has` (`isLoading`, `isLocal`, `isDamaged`, `hasCarapaceWeapon`)
- IDs use descriptive `Id` suffix (`unitId`, `manipleId`, `battlegroupId`)
- Arrays use plural nouns (`units`, `battlegroups`, `maniples`, `titanUnitIds`)

**Types / Interfaces:**
- Interfaces: PascalCase (`Unit`, `Weapon`, `DamageLocation`, `GameState`, `GameContextType`)
- Type aliases: PascalCase (`BattlegroupAllegiance`, `GameAction`, `Breakpoint`, `ControlType`)
- String union literals: lowercase kebab (`'loyalist' | 'traitor'`, `'ready' | 'fired' | 'disabled' | 'destroyed'`)
- Generic cache entry types: PascalCase with descriptive suffix (`CacheEntry<T>`, `CacheStatus`)

**Constants:**
- Module-level primitive constants: SCREAMING_SNAKE_CASE (`WEB_MAX_WIDTH`, `TURN_ON_DURATION_MS`, `SINISTER_PSI_TEMPLATE_ID`)
- Exported constant objects: SCREAMING_SNAKE_CASE keys (`STORAGE_KEYS`, `CONTROL_TYPES`, `SHIELD_COLORS`)
- Theme tokens: camelCase exported objects (`spacing`, `colors`, `fontSize`, `layout`, `radius`)

**Reducer Actions:**
- Action type strings: SCREAMING_SNAKE_CASE (`'SET_LOADING'`, `'LOAD_UNITS'`, `'ADD_BATTLEGROUP'`)
- Action objects: discriminated union on `type` with `payload` property

## Code Style

**Formatting:**
- No Prettier or ESLint config is present in the project root
- Indentation: 2-space indentation used throughout
- Trailing commas: present on multi-line arrays and object literals
- Semicolons: used consistently
- Single quotes for string literals in TypeScript; JSX uses double quotes for attribute values

**Linting:**
- No ESLint config detected; TypeScript strict mode (`"strict": true` in `tsconfig.json`) is the primary guard
- The `tsconfig.json` extends `expo/tsconfig.base` with strict enabled

**TypeScript Usage:**
- Strict typing enforced; interfaces preferred over `type` aliases for object shapes
- Union types used for discriminated state (`'ready' | 'fired' | 'disabled' | 'destroyed'`)
- `as const` used for readonly token objects (`spacing`, `fontSize`, `CONTROL_TYPES`)
- `[key: string]: any` index signatures present on extensible models (`Unit.stats`, `Weapon`)
- `any` used in storage/parsing code for JSON deserialization; typed after validation
- Type imports use `import type` for type-only imports in adapter layer
- Optional chaining (`?.`) and nullish coalescing (`??`) used consistently

## Import Organization

**Order (observed pattern):**
1. React and React Native core (`import React`, `import { View, StyleSheet } from 'react-native'`)
2. Expo SDK packages (`import { StatusBar } from 'expo-status-bar'`)
3. Third-party libraries (`import { Card, Text } from 'react-native-paper'`)
4. Local context and hooks (`import { useGame } from '../context/GameContext'`)
5. Local models (`import { Unit } from '../models/Unit'`)
6. Local services (`import { storageService } from '../services/storageService'`)
7. Local utils and theme (`import { colors } from '../theme/tokens'`)

**Path Aliases:**
- No path aliases configured; relative paths used throughout (`'../models/Unit'`, `'../../utils/constants'`)

## Error Handling

**Patterns:**
- Services wrap all AsyncStorage calls in `try/catch` and log errors via `console.error`; load functions return empty arrays/null on failure rather than rethrowing
- Context `initialize()` function uses `try/catch/finally`; errors are logged and loading state is reset in `finally`
- Data-fetching hooks (e.g., `useTitanTemplates`) use an IIFE async function with cancellation tokens (`let cancelled = false`) inside `useEffect`; errors set state to null/empty and log warnings
- Context actions that can't find a unit return early (guard clauses with `if (!unit) return`)
- `ErrorBoundary` component (`src/components/ErrorBoundary.tsx`) wraps the app root to catch render errors and display a fallback UI
- Validation errors (e.g., empty name) throw `new Error(message)` from context functions like `createBattlegroup`

**Error Logging Convention:**
- `console.error` for unrecoverable failures and storage errors
- `console.warn` for data-source issues (BattleScribe parsing failures, missing fields)
- `console.log` for debug traces; a few remain in production code (`updatePlasmaReactor`, `HomeScreen`)
- Prefixed format for template-load warnings: `[Templates] message`; titan-data warnings: `[titan-data] message`

## Logging

**Framework:** Native `console` (no logging library)

**Patterns:**
- Errors: `console.error('Descriptive message:', error)` — includes the raw error object
- Warnings: `console.warn('[Module] Description', payload)` — module prefix in brackets
- Debug: `console.log(...)` — not gated by environment; some debug logs remain in production code

## Comments

**When to Comment:**
- Inline comments explain non-obvious business logic (`// First dot always filled`, `// Defensive check`)
- Migration steps are annotated with `// Migration:` prefix
- Intentional design choices are noted (`// Intentionally no "gloss" highlights`)
- Fallback values for older saved data are marked (`// Fallback for older saved units`)
- Disabled/deferred code uses `// Temporarily disabled:` inline

**JSDoc/TSDoc:**
- JSDoc used selectively on exported interfaces and significant functions (e.g., `/** BSData Adeptus Titanicus repo (upstream). */`)
- Not uniformly applied; most functions rely on TypeScript types rather than JSDoc

## Function Design

**Size:** Functions range from small pure helpers (3–10 lines) to large side-effect-heavy functions (the `initialize` function in GameContext is ~130 lines). No formal size limit enforced.

**Parameters:** Context action functions take primitive ids + value parameters (`updateDamage(unitId, location, value)`). Components use a single Props interface destructured at the top of the function.

**Return Values:**
- Async context actions return `Promise<void>` unless they need to return created data (`createBattlegroup` returns `Promise<Battlegroup>`, `duplicateTitan` returns the new id and maniple id)
- Pure service helpers return new instances of the mutated model (immutable update pattern)
- Hooks return a `const` object with named fields

## Module Design

**Exports:**
- Components: single `export default function ComponentName`
- Hooks: single `export function useHookName`
- Services: single `export const serviceName = { ... }` object (namespace pattern)
- Models: named exports for all interfaces/types; no default exports
- Context: named exports for `GameProvider` and `useGame`

**Barrel Files:** Not used; files are imported directly by path.

## Component Patterns

**Styles:**
- `StyleSheet.create` at the bottom of each component file, named `styles`
- Inline style overrides use array syntax: `style={[styles.base, condition && styles.variant]}`
- Platform-specific styles use `Platform.OS === 'web'` checks inline and `Platform.select`

**State in Components:**
- `useState` for local UI state (modal visibility, form fields, selected ids)
- `useMemo` used to derive filtered/sorted lists from context state
- `useRef` for animation values and loop references
- `useCallback` for stable reload functions returned from hooks

**Context Access:**
- `useGame()` custom hook is the single entry point to global state; throws if used outside `GameProvider`

---

*Convention analysis: 2026-03-11*
