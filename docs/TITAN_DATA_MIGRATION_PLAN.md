# Titan-Data Migration Plan

This document catalogs all data the app stores or uses locally and outlines a plan for moving appropriate parts into the **titan-data** repo (SCPublic/titan-data).

---

## 1. Data inventory

### 1.1 Persisted in AsyncStorage (user/session data)

| Storage key | Shape | Purpose |
|-------------|--------|---------|
| `@engine_kill:units` | `Unit[]` | All titan and banner units: id, name, templateId, battlegroupId, void shields, heat, plasma reactor, damage (head/body/legs with armor + criticals), weapons (left/right/carapace + status), upgrades, princeps trait, stats. |
| `@engine_kill:maniples` | `Maniple[]` | Formations: id, name, templateId, battlegroupId, legionId, titanUnitIds[], createdAt. |
| `@engine_kill:rosters` | `Battlegroup[]` | Roster containers: id, name, createdAt. (Also keyed as BATTLEGROUPS.) |
| `@engine_kill:active_roster_id` | `string \| null` | Currently selected battlegroup ID. |
| `@engine_kill:player_id` | `string` | Player identifier. |
| `@engine_kill:player_name` | `string` | Player display name. |

**Summary:** User-created battlegroups, maniples, and units (with full game state: shields, heat, damage, weapon status) plus UI state (active battlegroup, player info). This is **device-local session/roster data** and should **not** live in titan-data as-is (titan-data is reference/catalog, not per-user rosters).

---

### 1.2 Loaded from remote (titan-data / BSData), cached in memory

| Data | Source | Format | Purpose |
|------|--------|--------|---------|
| Titan templates | titan-data: `Battlegroup.cat`, `Household.cat`, `Adeptus Titanicus 2018.gst` | BattleScribe XML | Chassis stats, points, weapon lists; merged with local overrides. |
| Maniple templates | Same .gst | BattleScribe XML | Formation definitions (name, allowed titans, min/max, rules). |
| Legion templates | Same .gst | BattleScribe XML | Legio names and special rules. |
| Upgrade templates | Same .gst | BattleScribe XML | Wargear/upgrades (universal, loyalist, traitor). |
| Princeps trait templates | Same .gst | BattleScribe XML | Princeps traits by allegiance/legion. |

**Summary:** All of this is **reference/catalog data**. titan-data already holds it as BattleScribe XML. The app fetches it at runtime and caches it in memory (no AsyncStorage).

---

### 1.3 Bundled in app (local reference data)

| Location | Content | Purpose |
|----------|---------|---------|
| `src/data/titanTemplates.ts` | Minimal `UnitTemplate[]`: damage tracks (armor, hit tables, critical effects), `availableWeapons` with stable IDs and `disabledRollLines` / `repairRoll`. | Fallback + app-specific damage/command terminal UX; merged with remote titan data. |
| `src/data/chassisOverrides.ts` | `plasmaReactorMax`, `voidShieldsMax`, `voidShieldSaves` per chassis id. | Override when XML doesn’t provide reliable values. |
| `src/data/bannerTemplates.ts` | Banner/knight unit templates. | Banner unit types (if used). |

**Summary:** These are **reference overrides and app-specific metadata** (damage tables, repair/disabled lines). Good candidates to move into titan-data in a structured form so the app can fetch them instead of bundling.

---

## 2. What titan-data is today

- **Repo:** SCPublic/titan-data (branch `master`).
- **Contents:** BattleScribe catalog/roster XML:
  - `Battlegroup.cat`
  - `Household.cat`
  - `Adeptus Titanicus 2018.gst`
- **Role:** Single source for titan/maniple/legion/upgrade/princeps **templates** that the app fetches via `DEFAULT_DATA_BASE_URL`.

User rosters (units, maniples, battlegroups in AsyncStorage) are **not** in titan-data and should stay device-local unless we add an explicit “export to repo” or “share list” feature.

---

## 3. What to move into titan-data (and how)

### 3.1 Keep in titan-data (already there)

- BattleScribe XML for templates (titans, maniples, legions, upgrades, princeps traits). No change needed for “moving” — already the primary source.

### 3.2 Move from app bundle → titan-data (recommended)

| Current location | Proposed in titan-data | Format | Benefit |
|------------------|------------------------|--------|--------|
| `chassisOverrides.ts` | New file, e.g. `chassis-overrides.json` or a small JSON/TS file in a `/engine-kill` or `/overrides` folder | JSON: `{ [templateId]: { plasmaReactorMax, voidShieldsMax, voidShieldSaves } }` | Single source for void/reactor overrides; app fetches once, no code change for new chassis. |
| Damage tracks & critical effects in `titanTemplates.ts` | New file(s), e.g. `damage-tracks.json` or per-chassis files | JSON: armor, hit table bands, critical level effects per location (head/body/legs). | Same as above; easier to fix/expand without app releases. |
| Weapon metadata (`disabledRollLines`, `repairRoll`) in `titanTemplates.ts` | Same as damage or a `weapon-metadata.json` keyed by weapon id | JSON | Central place for “command terminal” / disabled weapon UX. |

**Implementation idea:** Add a small “engine-kill” config in titan-data (e.g. `engine-kill/chassis-overrides.json`, `engine-kill/damage-tracks.json`). App keeps a minimal fallback in code, but prefers fetched overrides if present.

### 3.3 Do not move into titan-data

- **AsyncStorage payloads:** Units, maniples, battlegroups, activeBattlegroupId, playerId, playerName. These are user/session data; titan-data is for shared reference only.
- **Optional later:** “Export battlegroup to JSON” and “Import from URL/file” could produce files that users might commit to their own fork of titan-data (e.g. example lists), but that’s a separate feature and not “moving local storage into titan-data.”

---

## 4. Phased plan

### Phase 1: Document and agree (current)

- [x] Catalog all local storage keys and shapes (this doc).
- [x] Catalog remote/cache and bundled reference data.
- [ ] Decide which overrides (chassis, damage, weapon metadata) to move first.

### Phase 2: Add engine-kill overrides to titan-data

- [ ] Add directory or files to titan-data, e.g. `engine-kill/`:
  - `chassis-overrides.json` (from `chassisOverrides.ts`).
- [ ] Optionally: `damage-tracks.json` and/or `weapon-metadata.json` (from `titanTemplates.ts`).
- [ ] Document schema and file names in titan-data README or a small `engine-kill/README.md`.

### Phase 3: App consumes overrides from titan-data

- [ ] Add fetcher for `engine-kill/chassis-overrides.json` (and any other new files) from `DEFAULT_DATA_BASE_URL`.
- [ ] Merge fetched overrides with existing logic; keep bundled defaults as fallback when fetch fails or file missing.
- [ ] Remove or trim duplicated data from `chassisOverrides.ts` / `titanTemplates.ts` so titan-data is source of truth where possible.

### Phase 4: Optional — export/import for user data

- [ ] **Export:** “Export battlegroup” → JSON (units, maniples, battlegroup) for backup or sharing.
- [ ] **Import:** “Import from URL” or “Import from file” to load a battlegroup JSON into the app (and optionally into AsyncStorage).
- [ ] No requirement to store these in titan-data; users could commit example lists to a fork if they want.

---

## 5. File layout sketch (titan-data)

```text
titan-data/
├── Battlegroup.cat
├── Household.cat
├── Adeptus Titanicus 2018.gst
├── README.md
└── engine-kill/                    # optional, for app-specific overrides
    ├── README.md                   # schema + purpose
    ├── chassis-overrides.json      # from chassisOverrides.ts
    ├── damage-tracks.json          # (optional) from titanTemplates damage/criticalEffects
    └── weapon-metadata.json        # (optional) disabledRollLines, repairRoll by weapon id
```

---

## 6. Summary

| Data | Where it lives now | Move to titan-data? |
|------|--------------------|----------------------|
| Units, maniples, battlegroups, active ID, player | AsyncStorage | No (user data). |
| Titan/maniple/legion/upgrade/princeps templates | titan-data XML (fetched) | Already there. |
| Chassis overrides (void/reactor max, saves) | `chassisOverrides.ts` (bundled) | Yes → e.g. `engine-kill/chassis-overrides.json`. |
| Damage tracks & weapon metadata | `titanTemplates.ts` (bundled) | Optional → e.g. `engine-kill/damage-tracks.json`, `weapon-metadata.json`. |

Next concrete step: add `engine-kill/chassis-overrides.json` to titan-data and implement the fetcher + merge in the app (Phase 2 + 3).
