# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Engine Kill is a React Native/Expo mobile app for iOS, Android, and web that helps players manage titan-scale tabletop battles. Players track units (void shields, heat, damage, weapons) with local persistence via AsyncStorage. Real-time multiplayer sync via Firebase is planned but not yet implemented.

## Commands

```bash
# Install dependencies
npm install

# Start Expo development server
npm start

# Platform-specific commands
npm run ios      # Run on iOS simulator (requires Xcode on Mac)
npm run android  # Run on Android emulator
npm run web      # Run in web browser
```

From the Expo dev server: press `w` for web, `i` for iOS simulator, `a` for Android emulator.

## Architecture

### State Management
- **GameContext** (`src/context/GameContext.tsx`): Central state management using React Context + useReducer
- State includes: units array, playerId, playerName, isLoading
- All unit mutations go through context actions that update state immediately then persist to AsyncStorage
- The context handles data migration for legacy units on load

### Data Flow
1. Titan templates are loaded from titan-data (BattleScribe XML + engine-kill JSON overrides); banners use `src/data/bannerTemplates.ts`
2. `unitService` creates Unit instances from templates with default values
3. `storageService` handles AsyncStorage persistence with boolean sanitization
4. Context provides update functions that dispatch actions and save to storage

### Key Models
- **Unit** (`src/models/Unit.ts`): Full unit state including void shields, damage locations (head/body/legs with armor and criticals), weapons, heat, plasma reactor
- **UnitTemplate** (`src/models/UnitTemplate.ts`): Base definition for titan/banner types with default stats and available weapons
- **Weapon**: Status tracking (ready/fired/disabled/destroyed), range/accuracy stats, traits

### UI Structure
- **App.tsx**: Simple navigation using state (activeUnitId) to switch between HomeScreen and UnitEditScreen
- **Screens**: HomeScreen (unit list + create), UnitEditScreen (full unit editing), UnitCreateScreen
- **Components**: Specialized trackers for void shields, damage, plasma reactor, weapons, etc.

### Void Shield System
Uses a unique "selection" model where only one shield pip is active at a time (not cumulative). The facings (front/left/right/rear) are stored as 0 or 1, and updateVoidShieldByIndex sets exactly one facing to 1.

## Tech Stack
- Expo SDK 54 with React Native 0.81
- React Native Paper for UI components
- TypeScript with strict typing
- AsyncStorage for local persistence
- Firebase SDK included (not yet integrated)
