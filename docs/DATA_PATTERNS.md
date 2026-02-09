# Data patterns and conventions

This document defines how titan and game data are sourced and maintained for Engine Kill. Follow these patterns when adding or changing data.

## 1. Titan data lives in titan-data

**All titan reference data must live in the [titan-data](https://github.com/SCPublic/titan-data) repo.** Engine Kill must not hardcode titan stats, damage tracks, weapon metadata, or chassis overrides in app code or in engine-kill-specific JSON checked into this repo.

- **Do:** Add or edit data in titan-data (e.g. `engine-kill/*.json`, BattleScribe XML). The app loads this at runtime.
- **Do not:** Add new titan/chassis/weapon/damage data into engine-kill source (e.g. `src/data/`, new JSON in this repo) except for test fixtures.

User/session data (battlegroups, units, player info) stays device-local and is not part of titan-data.

## 2. Prefer BattleScribe XML over new JSON

**Use the canonical BattleScribe files in titan-data first.** Only introduce or extend engine-kill JSON when the game system or catalogs cannot express what we need.

- **Primary source:** `Adeptus Titanicus 2018.gst` (game system), plus catalogs such as `Battlegroup.cat` and `Household.cat` in titan-data.
- **Use these** for chassis, weapons, points, and roster structure. The app already consumes them via the BattleScribe adapter.
- **Before adding a new `.json` file** in titan-data (e.g. under `engine-kill/`), check whether the same information can be represented or derived from the existing `.gst` / `.cat` files. If it can, extend or fix the BattleScribe data instead of adding JSON.
- **Engine-kill JSON** (e.g. `engine-kill/damage-tracks.json`, `engine-kill/chassis-overrides.json`, `engine-kill/weapon-metadata.json`) is for app-specific overrides and metadata that BattleScribe does not model (e.g. damage track layout, UI hints). Add or change these only when necessary.

## 3. Summary

| Question | Answer |
|----------|--------|
| Where does titan data live? | titan-data repo only; not hardcoded in engine-kill. |
| What do we use first? | Adeptus Titanicus 2018 (`.gst` / `.cat`) in titan-data. |
| When do we add or change engine-kill JSON? | Only when the game system and catalogs cannot provide or represent the data. |

These conventions keep a single source of truth in titan-data and avoid duplicating or overriding BattleScribe data unnecessarily.
