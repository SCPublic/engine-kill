# Agent context — Engine Kill data & audit (start here)

**Use this file** when onboarding a new coding agent to **data**, **titan-data**, and the **BattleScribe ↔ templates.json audit**. It points to deeper docs and states what is done vs optional follow-up.

**Closed milestones:** Single-source **`templates.json`** refactor ([`REFACTOR_PROGRESS.md`](./REFACTOR_PROGRESS.md)) and the **audit recording pass** ([`DATA_AUDIT.md`](./DATA_AUDIT.md) status line) — **done**. **Ongoing:** **[`docs/TODO.md`](./TODO.md)** — **§1** groomed knights/banners first, **§2** full audit remediation, **§3** ungroomed (CONCERNS +).

---

## Repositories

| Repo | Role |
|------|------|
| **engine-kill** (this repo) | React Native / Expo PWA. Loads template data at runtime only from **`templates.json`**. |
| **titan-data** (sibling / separate clone) | **Source of truth** for titans, banners, maniples, legions, upgrades, princeps traits. Ships root **`templates.json`**. BattleScribe **`.gst` / `.cat`** files live here for reference when editing data. |

---

## Non-negotiables (do not violate)

1. **One runtime file:** `{baseUrl}templates.json` only. No XML, no merge/override fetch in app code.
2. **Edit reference data in titan-data**, not new large JSON in engine-kill. See **[`docs/DATA_PATTERNS.md`](./DATA_PATTERNS.md)** and **`.cursor/rules/data-patterns.mdc`**.
3. **No silent fallbacks** for bad template data (engineering standards)—surface errors.

---

## Audit status (recorded in DATA_AUDIT.md)

**Canonical detailed audit:** **[`docs/DATA_AUDIT.md`](./DATA_AUDIT.md)** — chunks 0, L, M, T (inc. **§T.5** `bs:` weapon profile pass), B, U (inc. **§U.6** points/rules check), P (pilot), X (pilot); executive summary and per-chunk findings live there.

**Short snapshot:**

| Area | State |
|------|--------|
| **`bs:` weapon IDs** | All **73** unique ids resolve in `.gst`/`.cats`; **58** stats-bearing rows **match** BS weapon profiles. **15** are intentional placeholders/shells in JSON. |
| **Upgrades** | Names + **§U.6** points/rules vs BS; **Meltaguns** fixed to match BS. |
| **Princeps traits** | **`legions[].princepsLegioSelectionEntryId`** links trait tables to legion templates; app uses it. |
| **Cross-refs (X)** | No id collisions; **LegioCrusade** has **no** `legions[]` row → **21** upgrades + warmaster **`bs:`** row **do not appear** in legion-gated UI (see **DATA_AUDIT §X.2**). |
| **Banners** | Many **placeholder** weapons; structure points / ion UI gaps documented in **DATA_AUDIT** Chunk **B**. |

**Optional later (not blockers):** Legio Crusade legion row if you need those upgrades in-app; banner weapon fill-in; full princeps text diff; legio weapon visibility vs BS modifiers; slug-only Warhound arms parity.

---

## Single-source refactor (complete)

**[`docs/REFACTOR_PROGRESS.md`](./REFACTOR_PROGRESS.md)** — retrospective: runtime **`templates.json`**-only load and titan-data as source of truth are **done**. Further **`templates.json`** edits (placeholders, ion, banners, etc.) are **ongoing data work** guided by **[`docs/DATA_AUDIT.md`](./DATA_AUDIT.md)**; app-only items (e.g. banner UX) stay in that doc’s follow-up section and **[`../.planning/codebase/CONCERNS.md`](../.planning/codebase/CONCERNS.md)** where relevant.

---

## titan-data pointers

- **Canonical artifact:** **`templates.json`** at repo root.  
- **Doc:** **[`ENGINE_KILL_TEMPLATES.md`](https://github.com/SCPublic/titan-data/blob/master/ENGINE_KILL_TEMPLATES.md)** (in titan-data repo).

---

## Local dev — `templates.json`

- **Web:** If GitHub raw hits CORS/404, serve titan-data locally and set `EXPO_PUBLIC_DATA_BASE_URL` (trailing slash ok). Example:
  ```bash
  npx serve /path/to/titan-data -p 3333
  EXPO_PUBLIC_DATA_BASE_URL=http://localhost:3333/ npm run web
  ```
- **`warnings`:** Optional string array in JSON; HomeScreen can show when non-empty. Loader treats missing keys as `[]`.

---

## Testing (templates loader / single source)

**[`docs/TESTING_TEMPLATES.md`](./TESTING_TEMPLATES.md)** — Jest contract (`templatesLoader`, `templatesCache`), no runtime BS weapon loaders, E2E notes.

Quick: `npm test`, `npm run test:e2e` (see that doc for ports/fixtures).

---

## App architecture (code)

| Doc | Purpose |
|-----|---------|
| **[`../CLAUDE.md`](../CLAUDE.md)** | Commands, GameContext, high-level architecture. |
| **[`.planning/codebase/`](../.planning/codebase/)** | STRUCTURE, ARCHITECTURE, etc. |

---

## Other `docs/` references

| File | Purpose |
|------|---------|
| [`TODO.md`](./TODO.md) | **§1** groomed knights · **§2** audit table · **§3** ungroomed. |
| [`DATA_PATTERNS.md`](./DATA_PATTERNS.md) | Where data lives; single JSON; fix data in titan-data first. **§4** = fixed-loadout knight banners (`fixedBannerArmWeaponIds`; Atrapos is the reference row). |
| [`DATA_AUDIT.md`](./DATA_AUDIT.md) | Full BattleScribe ↔ JSON audit. |
| [`TERMINAL_STYLES_REUSE.md`](./TERMINAL_STYLES_REUSE.md) | Reusing command-terminal styling on other screens. |

---

## Historical docs (removed)

The following were **completed or superseded** and removed to avoid stale context: **`PHASE2_SINGLE_LOADER.md`** (merged here + REFACTOR), **`BATTLESCRIBE_RENAME_SCAN.md`** (rename done), **`TITAN_DATA_GENERATED_SHAPE.md`** (concept doc; use **`DATA_PATTERNS.md`** + models + **`templates.json`**), **`TESTING_REFACTOR_PROGRESS.md`** (renamed/superseded by **`TESTING_TEMPLATES.md`**).
