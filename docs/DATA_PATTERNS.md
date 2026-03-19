# Data patterns and conventions

This document defines how titan and game data are sourced and maintained for Engine Kill. Follow these patterns when adding or changing data.

## 1. Titan data lives in titan-data

**All titan reference data must live in the [titan-data](https://github.com/SCPublic/titan-data) repo.** Engine Kill must not hardcode titan stats, damage tracks, weapon metadata, or chassis data in app code or in engine-kill-specific JSON checked into this repo.

- **Do:** Add or edit data in titan-data. The app loads a single artifact at runtime: `engine-kill/generated/templates.json` (see §2).
- **Do not:** Add new titan/chassis/weapon/damage data into engine-kill source (e.g. `src/data/`, new JSON in this repo) except for test fixtures.

User/session data (battlegroups, units, player info) stays device-local and is not part of titan-data.

## 2. Single JSON at runtime (templates.json)

**At runtime the app fetches only one file from titan-data:** `engine-kill/generated/templates.json`. That file contains titans, banners, maniples, legions, upgrades, and princeps traits. No override files or XML are fetched; no merge step runs in the app.

- **Source of truth:** titan-data’s `engine-kill/generated/templates.json`. All template data (e.g. Reaver void shields, reactor, damage tracks, weapons) lives in that file.
- **When changing game data:** Edit `templates.json` in titan-data (or use a titan-data–owned build that produces it). Engine-kill does not produce this file in the long term; see [docs/REFACTOR_PROGRESS.md](REFACTOR_PROGRESS.md) for the refactor that removes the generator and override files.

## 3. Fix data issues in titan-data first

When the app hits a data problem—wrong entry name, missing rules, catalog structure that doesn't match what the app expects—**consider making changes in titan-data** before adding workarounds in engine-kill.

- **Do:** Fix the catalog in titan-data (e.g. rename a selection entry to match what the app expects, add rules to the correct entry, fix BattleScribe XML) so the source of truth is correct.
- **Do not:** Rely only on engine-kill workarounds or extra matching logic when the underlying issue is in the data. Prefer fixing titan-data and surfacing clear errors when data is wrong, rather than papering over mismatches in code.

## 4. Summary

| Question | Answer |
|----------|--------|
| Where does titan data live? | titan-data repo only; not hardcoded in engine-kill. |
| What does the app load at runtime? | One file: `engine-kill/generated/templates.json` from titan-data. No overrides, no XML at runtime. |
| When do we add or change template data? | Edit `templates.json` in titan-data (or a titan-data build that outputs it). |
| When the app and data don't match? | Consider fixing titan-data first; prefer source-of-truth fixes over workarounds in engine-kill. |

These conventions keep a single source of truth in titan-data (`templates.json`) and avoid duplicate or override logic in the app.
