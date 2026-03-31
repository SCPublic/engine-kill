# Data patterns and conventions

**Status:** **Authoritative conventions** (update when rules change). The single-JSON runtime architecture is **complete**; this doc is not a refactor backlog.

This document defines how titan and game data are sourced and maintained for Engine Kill. Follow these patterns when adding or changing data.

## 1. Titan data lives in titan-data

**All titan reference data must live in the [titan-data](https://github.com/SCPublic/titan-data) repo.** Engine Kill must not hardcode titan stats, damage tracks, weapon metadata, or chassis data in app code or in engine-kill-specific JSON checked into this repo.

- **Do:** Add or edit data in titan-data. The app loads a single artifact at runtime: **`templates.json`** at the titan-data repo root (see §2).
- **Do not:** Add new titan/chassis/weapon/damage data into engine-kill source (e.g. `src/data/`, new JSON in this repo) except for test fixtures.

User/session data (battlegroups, units, player info) stays device-local and is not part of titan-data.

## 2. Single JSON at runtime (templates.json)

**At runtime the app fetches only one file from titan-data:** **`templates.json`** (repository root). That file contains titans, banners, maniples, legions, upgrades, and princeps traits. No other JSON or XML is merged at runtime.

- **Source of truth:** titan-data’s root **`templates.json`**. All template data lives in that file—edit it directly and commit.
- **Path on GitHub raw:** `{baseUrl}templates.json` where `baseUrl` is the titan-data root (e.g. `https://raw.githubusercontent.com/SCPublic/titan-data/master/`).

## 3. Fix data issues in titan-data first

When the app hits a data problem—wrong entry name, missing rules, catalog structure that doesn't match what the app expects—**consider making changes in titan-data** before adding workarounds in engine-kill.

- **Do:** Fix the catalog in titan-data (e.g. rename a selection entry to match what the app expects, add rules to the correct entry, fix BattleScribe XML) so the source of truth is correct.
- **Do not:** Rely only on engine-kill workarounds or extra matching logic when the underlying issue is in the data. Prefer fixing titan-data and surfacing clear errors when data is wrong, rather than papering over mismatches in code.

## 4. Fixed-loadout knight banners

Some knight banners have **no per-model arm weapon choice** in BattleScribe (every model carries the **same fixed** loadout — typically **two** arms; some banners use **three** fixed systems, e.g. Asterius). **Cerastus Knight Atrapos** is the reference **two-arm** row in `templates.json`.

**In `templates.json` for that banner:**

1. Set **`availableWeapons`** to exactly those arms/systems as full `WeaponTemplate` rows (use `id`s like `bs:…` matching the `.gst` `selectionEntry` ids for the weapons).
2. Set **`fixedBannerArmWeaponIds`** to a **two- or three-element** array (loadout order per BattleScribe / the model; first id = first slot for each knight).
3. Set **`minKnights`**, **`maxKnights`**, **`bannerBasePoints`**, and **`bannerPointsPerKnight`** from the catalogue (minimum squad cost at `minKnights`, marginal knight cost in `bannerPointsPerKnight`).

The app repeats the fixed list for each knight in **`bannerWeaponIds`** and shows weapon cards from the first knight’s list. The same pattern applies to **any** future banner with fixed arms: add those weapons to `availableWeapons`, set `fixedBannerArmWeaponIds`, and correct knight/points fields—no new engine-kill feature work per chassis.

**UX note:** Per-arm editing in Banner composition for fixed banners is still a follow-up; see [`docs/REFACTOR_PROGRESS.md`](./REFACTOR_PROGRESS.md) § *App & UX follow-ups (banners)*.

**Import / data entry:** Full weapon rows in **`availableWeapons`** can be added in titan-data **without** waiting for banner picker UX. Runtime only reads **`templates.json`**; selection UI gaps do not block importing or listing those weapons.

## 5. Summary

| Question | Answer |
|----------|--------|
| Where does titan data live? | titan-data repo only; not hardcoded in engine-kill. |
| What does the app load at runtime? | One file: **`templates.json`** at the titan-data repo root. No overrides, no XML at runtime. |
| When do we add or change template data? | Edit **`templates.json`** in titan-data and commit. |
| When the app and data don't match? | Consider fixing titan-data first; prefer source-of-truth fixes over workarounds in engine-kill. |

These conventions keep a single source of truth in titan-data (`templates.json`) and avoid duplicate or override logic in the app.
