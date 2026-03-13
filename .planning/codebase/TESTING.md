# Testing Patterns

**Analysis Date:** 2026-03-11

## Test Framework

**Runner:**
- Jest is listed as the test script in `package.json` (`"test": "jest"`)
- No `jest.config.*` file is present in the project root
- No `vitest.config.*` file is present

**Assertion Library:**
- Not configured (no Jest or testing-library packages in `devDependencies`)

**Run Commands:**
```bash
npm test    # Runs jest (no config file found; would use default Jest discovery)
```

**Configuration Status:**
- Jest is referenced in `package.json` scripts but has no configuration file and no test-related packages in `devDependencies` (no `@types/jest`, no `jest-expo`, no `@testing-library/react-native`)
- No test files exist anywhere in the codebase

## Test File Organization

**Location:**
- No test files detected in the project

**Naming:**
- No `.test.ts`, `.test.tsx`, `.spec.ts`, or `.spec.tsx` files exist

**Structure:**
- Not established

## Test Structure

**Suite Organization:**
- No tests exist to establish a pattern

**Patterns:**
- None established

## Mocking

**Framework:** Not configured

**Patterns:**
- No mocking setup exists

## Fixtures and Factories

**Test Data:**
- No fixtures or factory helpers exist

**Location:**
- No `__fixtures__`, `__mocks__`, or `test/` directories exist

## Coverage

**Requirements:** None enforced (no coverage configuration)

**View Coverage:**
```bash
# Not configured
```

## Test Types

**Unit Tests:**
- Not implemented

**Integration Tests:**
- Not implemented

**E2E Tests:**
- Not implemented

## What Should Be Tested (Gap Analysis)

The following areas have no test coverage and are high-value targets for future testing:

**`src/services/unitService.ts`:**
- `createUnitFromTemplate` — pure function; ideal unit test candidate
- `updateDamage` — pure function with clamping logic
- `updateHeat` — pure function with min/max clamping
- `updateCriticalDamage` — pure function; clears other levels before setting

**`src/services/storageService.ts`:**
- `parseBooleanLike` — private helper; value in testing all input variations
- `parseIsLocal` — private helper; string/boolean/undefined cases
- `loadUnits` — integration: JSON deserialization + sanitization pipeline
- `loadBattlegroups` — integration: defensive parsing + filtering

**`src/context/GameContext.tsx` reducer (`gameReducer`):**
- Pure reducer function; all action cases can be tested without side effects
- Migration logic inside `initialize()` is complex and untested

**`src/adapters/battlescribe/battlescribeAdapter.ts`:**
- XML parsing; high complexity, no coverage

**`src/adapters/battlescribe/xml.ts`:**
- `parseXml`, `findAll`, `childText` — pure functions; straightforward to test

## Recommended Setup

To establish testing, the following packages would be needed:

```bash
npm install --save-dev jest-expo @testing-library/react-native @testing-library/jest-native @types/jest
```

Minimal `jest.config.js`:
```js
module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)',
  ],
};
```

Recommended test pattern (co-locate with source):
```
src/
  services/
    unitService.ts
    unitService.test.ts   ← co-located test
```

---

*Testing analysis: 2026-03-11*
