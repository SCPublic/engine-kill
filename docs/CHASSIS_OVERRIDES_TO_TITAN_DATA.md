# Plan: Move Chassis Overrides into Titan-Data

**Goal:** Store the **overrides** (titan info missing from BSData/titan-data XML) in the titan-data repo so they live in one place and can be updated without an app release. The app will fetch them from titan-data and use them when the XML doesn’t provide reliable values.

---

## 1. What “overrides” are

The BattleScribe XML in titan-data (and BSData) often doesn’t have reliable or complete values for:

- **Plasma reactor max** – number of reactor pips (also used as max heat).
- **Void shields max** – number of void shield pips.
- **Void shield saves** – save value per facing, e.g. `["3+", "4+", "4+", "X"]` (order matches front, left, right, rear or similar).

Today we fill these gaps with **chassis overrides** in the app:

- **File:** `src/data/chassisOverrides.ts`
- **Shape:** `Record<templateId, { plasmaReactorMax?, voidShieldsMax?, voidShieldSaves? }>`
- **Template IDs:** `warhound`, `reaver`, `warlord`, `warmaster`, `warbringer`, `dire-wolf`

We want this same data to live in **titan-data** so:

1. Corrections and new chassis can be added in the repo.
2. The app stays generic and just fetches overrides from the same place it gets XML (titan-data).

---

## 2. Override data to move

| Field | Type | Meaning |
|-------|------|--------|
| `plasmaReactorMax` | number | Reactor track length; also used as max heat. |
| `voidShieldsMax` | number | Number of void shield pips. |
| `voidShieldSaves` | string[] | Save value per shield, e.g. `["3+", "4+", "4+", "X"]`. |

One object per chassis, keyed by **template ID** (same ids the app already uses: `warhound`, `reaver`, `warlord`, `warmaster`, `warbringer`, `dire-wolf`).

Optional for later: **plasma reactor colors** (per-pip UI colors) — can be added to the same structure if we ever want them in titan-data.

---

## 3. Where it lives in titan-data

- **Path:** A single JSON file in the repo root or a small subfolder, e.g.:
  - `chassis-overrides.json`, or
  - `engine-kill/chassis-overrides.json`
- **URL (example):**  
  `https://raw.githubusercontent.com/SCPublic/titan-data/master/chassis-overrides.json`

Using a subfolder like `engine-kill/` keeps app-specific files separate from the BattleScribe XML.

---

## 4. JSON schema (for titan-data)

```json
{
  "warhound": {
    "plasmaReactorMax": 5,
    "voidShieldsMax": 4,
    "voidShieldSaves": ["3+", "4+", "4+", "X"]
  },
  "reaver": {
    "plasmaReactorMax": 6,
    "voidShieldsMax": 5,
    "voidShieldSaves": ["3+", "3+", "4+", "4+", "X"]
  },
  "warlord": {
    "plasmaReactorMax": 7,
    "voidShieldsMax": 6,
    "voidShieldSaves": ["3+", "3+", "3+", "4+", "4+", "X"]
  },
  "warmaster": {
    "plasmaReactorMax": 8,
    "voidShieldsMax": 7,
    "voidShieldSaves": ["3+", "3+", "3+", "3+", "4+", "4+", "X"]
  },
  "warbringer": {
    "plasmaReactorMax": 7,
    "voidShieldsMax": 6,
    "voidShieldSaves": ["3+", "3+", "4+", "4+", "4+", "X"]
  },
  "dire-wolf": {
    "plasmaReactorMax": 6,
    "voidShieldsMax": 4,
    "voidShieldSaves": ["3+", "4+", "4+", "X"]
  }
}
```

- Keys = chassis template IDs (must match what the adapter infers: warhound, reaver, warlord, warmaster, warbringer, dire-wolf).
- All fields per chassis are optional; the app only overlays what’s present.

---

## 5. Implementation steps

### Step A: Add the file to titan-data

1. In repo **titan-data** (SCPublic/titan-data, branch `master`):
   - Create `chassis-overrides.json` (or `engine-kill/chassis-overrides.json`) with the content above.
2. Commit and push so the raw URL is available.

### Step B: App fetches overrides from titan-data

1. **Fetch URL:**  
   `DEFAULT_DATA_BASE_URL + 'chassis-overrides.json'`  
   (or `DEFAULT_DATA_BASE_URL + 'engine-kill/chassis-overrides.json'` if using subfolder).

2. **When:**  
   Load overrides when loading titan data (e.g. in the same flow as `loadAllTitanTemplatesFromBattleScribe`, or in a small dedicated loader that runs once and is cached).

3. **Merge logic (unchanged):**  
   For each chassis, use:  
   `effectiveValue = valueFromXml ?? valueFromOverrides ?? valueFromBundledFallback`  
   So: XML wins if present, then titan-data overrides, then current bundled `chassisOverrides.ts` as fallback.

### Step C: Wire adapter to use fetched overrides

1. Add a way to supply overrides to the adapter (e.g. load chassis-overrides.json once, then pass the parsed object into `loadAllTitanTemplatesFromBattleScribe` or into a shared “resolve chassis max/saves” helper).
2. In `loadAllTitanTemplatesFromBattleScribe`, replace the direct import of `chassisOverridesByTemplateId` with:
   - First try: use the fetched overrides from titan-data.
   - Fallback: use bundled `chassisOverridesByTemplateId` if fetch failed or file missing.

### Step D: Keep bundled overrides as fallback

- **Do not remove** `src/data/chassisOverrides.ts` initially. Keep it as fallback when:
  - Network fails,
  - titan-data doesn’t have the file yet,
  - Or we’re pointing at a data source that doesn’t have it (e.g. raw BSData URL without this file).
- Later, we can trim or remove the bundled file if we’re always using titan-data and the file is stable.

---

## 6. Summary

| What | Where today | Where after |
|------|-------------|-------------|
| Plasma reactor max, void shields max, void shield saves | `engine-kill/src/data/chassisOverrides.ts` (bundled) | **titan-data:** `chassis-overrides.json` (fetched); app still keeps bundled as fallback. |

Result: “Info about titans missing from BSD” (plasma reactor, void saves, etc.) lives in titan-data as a single JSON file; the app loads it from the same repo as the XML and overlays it when the XML doesn’t provide those values.

---

## 7. Other override-like data in the project

Audit of **all** data in the app that acts like an “override” (fills gaps from BSD/XML or isn’t in the catalog). Only **chassis overrides** are in the main plan above; the rest are optional to move later.

| Location | What it is | In BSD/XML? | Move to titan-data? |
|----------|------------|-------------|----------------------|
| **`src/data/chassisOverrides.ts`** | Plasma reactor max, void shields max, void shield saves per chassis | No (missing or unreliable) | **Yes** → `chassis-overrides.json` (this plan). |
| **`src/data/titanTemplates.ts`** – damage tracks | Per-chassis: armor, hitTable (direct/devastating/critical bands), criticalEffects (level 1–3 per head/body/legs). Used by DamageTrack and command terminal. | No (app-specific) | Optional → e.g. `damage-tracks.json` or per-chassis JSON. |
| **`src/data/titanTemplates.ts`** – weapon metadata | Per weapon: `repairRoll`, `disabledRollLines`. Merged onto BSData weapons via `overlayWeaponUiMetadata`; used by WeaponMount “Weapon Disabled” overlay. | No (app-specific) | Optional → e.g. `weapon-metadata.json` keyed by weapon id or name+mountType. |
| **`src/data/bannerTemplates.ts`** | Full banner/knight templates (void shields, damage, weapons). Household.cat has knight data; these may be legacy/minimal placeholders. | Partially (Household.cat) | Low priority; keep in app unless titan-data gets dedicated banner overrides. |
| **`UnitTemplate.plasmaReactorColors`** | Optional per-pip colors for reactor track. Not currently set in any override or titanTemplates. | No | Could add to `chassis-overrides.json` later (e.g. `plasmaReactorColors: string[]`) if we want per-chassis colors in titan-data. |

**Summary:** The only **explicit override** today is **chassis overrides** (plasma reactor, void saves). Everything else is either (a) bundled “local template” data that supplements BSD (damage tracks, weapon UI metadata) and could optionally move to titan-data as extra JSON files, or (b) banner templates / reactor colors, which can stay in app or be added to overrides later.
