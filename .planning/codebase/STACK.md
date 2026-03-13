# Technology Stack

**Analysis Date:** 2026-03-11

## Languages

**Primary:**
- TypeScript 5.9.3 - All source code in `src/`, `App.tsx`, `index.ts`

**Secondary:**
- JavaScript - Config files (`metro.config.js`, `webpack.config.js`)

## Runtime

**Environment:**
- Node.js 25.6.1 (development)
- React Native runtime (iOS, Android)
- Web browser (via react-native-web + Metro bundler)

**Package Manager:**
- npm 11.10.0
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Expo SDK 54.0.31 - Cross-platform build toolchain and runtime (`expo start`, native APIs)
- React Native 0.81.5 - Mobile UI framework (iOS and Android)
- react-native-web 0.21.2 - Web target rendering for React Native components

**UI:**
- react-native-paper 5.14.5 - Material Design 3 component library; dark theme applied in `App.tsx` via `MD3DarkTheme`
- expo-linear-gradient 15.0.8 - Gradient visuals used in game UI components
- react-native-reanimated 4.1.6 - Animation library (required by draggable list)
- react-native-gesture-handler 2.28.0 - Gesture recognition; `GestureHandlerRootView` wraps app root in `App.tsx`
- react-native-draggable-flatlist 4.0.3 - Drag-to-reorder lists for titan/maniple ordering
- react-native-safe-area-context 5.6.2 - Safe area insets for notch/status bar handling

**Fonts:**
- @expo-google-fonts/roboto-mono 0.4.1 - Roboto Mono 400 and 700 loaded via `useFonts` in `App.tsx`

**Audio:**
- expo-av 16.0.8 - Audio playback for warhorn sound effect

**Build/Dev:**
- Metro - React Native bundler (default for web in `app.json`)
- Webpack - Alternative web bundler (`webpack.config.js` present, delegates to `@expo/webpack-config`)
- @expo/metro-runtime 6.1.2 - Metro runtime for web

**Testing:**
- No test framework detected (no jest.config, vitest.config, or test files found)

## Key Dependencies

**Critical:**
- `@react-native-async-storage/async-storage` 2.2.0 - All local persistence; sole storage mechanism for units, maniples, battlegroups, player data, and warhorn settings. Used exclusively in `src/services/storageService.ts`
- `firebase` 12.7.0 - SDK installed but **not yet integrated**; no Firebase imports anywhere in `src/`; planned for future multiplayer sync

**UI Infrastructure:**
- `react-native-vector-icons` 10.3.0 - Icon set (Material Design icons) used throughout UI components
- `simple-swizzle` 0.2.4 - Utility for color manipulation (dependency of react-native-paper)

## Configuration

**Environment:**
- No `.env` files present; no runtime environment variables used
- All external URLs are hardcoded constants in `src/utils/constants.ts`
- GitHub raw content URLs are the only external endpoints: `https://raw.githubusercontent.com/BSData/adeptus-titanicus/master/` and `https://raw.githubusercontent.com/SCPublic/titan-data/master/`
- Default data source is `TITAN_DATA_BASE_URL` (controlled by `DEFAULT_DATA_BASE_URL` in `src/utils/constants.ts`)

**Build:**
- `app.json` - Expo app configuration (bundle identifiers, icons, web public path `/engine-kill/`)
- `tsconfig.json` - Extends `expo/tsconfig.base` with `"strict": true`
- `metro.config.js` - Extends Expo Metro defaults; adds `.ogg` to asset extensions for audio
- `webpack.config.js` - Thin wrapper around `@expo/webpack-config`

**AsyncStorage Keys** (defined in `src/utils/constants.ts`):
- `@engine_kill:units`
- `@engine_kill:rosters` (also used as `BATTLEGROUPS` key for backward compat)
- `@engine_kill:active_roster_id` (also used as `ACTIVE_BATTLEGROUP_ID`)
- `@engine_kill:player_id`
- `@engine_kill:player_name`
- `@engine_kill:warhorn_settings`

## Platform Requirements

**Development:**
- Node.js (v25.6.1 in use; Expo SDK 54 requires Node 18+)
- npm 11+
- Xcode required for iOS simulator (`npm run ios`)
- Android Studio required for Android emulator (`npm run android`)
- Web: `npm run web` runs in browser via Metro

**Production:**
- iOS: Bundle identifier `com.anonymous.enginekill`
- Android: Package `com.anonymous.enginekill`
- Web: Deployed to base path `/engine-kill/` (set in `app.json` `experiments.baseUrl`)
- Output mode: `single` (SPA) for web

---

*Stack analysis: 2026-03-11*
