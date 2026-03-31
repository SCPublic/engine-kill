# Central TODO (priority order)

**How to use this file:** **`§1` is the groomed knight/banner track**—start here for banners. **`§2`** is the full **data audit** backlog (everything else + audit refs). **`§3`** is **ungroomed** (CONCERNS and similar—pull into §1/§2 when prioritized). Within each section, keep items **ordered by priority** (higher first); insert new work at the right position, not only at the bottom. **Completed work** lives in **[Done (archive)](#done-archive)** at the end. **Evidence** for audit rows: [`DATA_AUDIT.md`](./DATA_AUDIT.md).

**Convention — work must land here:** If something **still needs doing** (product, data, or tech), add or update a row in **§1**, **§2**, or **§3**—do not leave it only in another doc, chat, or inline code comment. Short **Done** notes may stay in [Done (archive)](#done-archive); **open** follow-ups get a numbered task.

---

## 1. Groomed (Knights)

**Data vs app:** Replacing banner **`placeholder`** entries with full **`WeaponTemplate`** rows in titan-data (import from BattleScribe / catalogs) does **not** depend on weapon-selection UX in Engine Kill. The app loads `banners[].availableWeapons` from **`templates.json`** as-is; imperfect pickers or fixed-loadout polish (**§1 row 3**) can trail behind—cards and stats still benefit once real ids and stats are present.

Ordered **knight / banner** backlog (data + app). Cross-check **`§2`** audit rows **2, 4** (app only), **5, 6** and [`DATA_PATTERNS.md`](./DATA_PATTERNS.md) §4.

| # | Task | Primary owner / repo |
|---|------|----------------------|
| 1 | **Ion shields (app):** Drive knight-banner ion matrix from **`defaultStats.ionShieldTable`** in `templates.json`; remove **`IonShieldSavesDisplay`** / **`ION_SHIELD_TABLE`** hardcoding. *(Titan-data: **10** banners have `ionShieldTable`; **4** stalker banners use `ionShieldSaves: []` and flat ion + construct rules in `specialRules`—see [Done (archive)](#done-archive).)* | engine-kill |
| 2 | **Structure points:** confirm **`structurePointsMax`** vs BS; design banner damage UI (single pool vs locations); migrate template + app from misleading three-track titan layout where appropriate. | both |
| 3 | **Fixed-loadout UX:** when `fixedBannerArmWeaponIds.length >= 2`, hide/disable **EDIT BANNER LOADOUT** and per-arm pickers; read-only messaging; keep `bannerWeaponIds` in sync (`unitService.bannerArmWeaponIdsForKnightCount`). | engine-kill |
| 4 | **Construct shields:** ensure `specialRules` / stats panel behavior stays correct while ion data moves to real tables (Stalkers use `ionShieldSaves: []`). | verify per §B.4 |
| 5 | **Banner points parity:** Use **`getBannerTotalPoints`** / **`src/utils/unitPoints.ts`** everywhere a banner subtotal is shown (`HomeScreen`, **`UnitEditScreen`** composition modal, etc.) so **wargear upgrades** and weapon math stay consistent. Align **`bannerMeltagunCount` / `bannerStormspearCount`** lookups with **`bs:`** weapon ids from **`templates.json`** (today code still uses legacy `meltaguns` / `stormspear-rocket-pod` strings that do not match Questoris **Stormspear** `bs:…`). | engine-kill |
| 6 | **Styrix / Magaera fixed arms (optional):** add **`fixedBannerArmWeaponIds`** on those templates *or* read-only loadout UX if builds should always be volkite+claw / lightning+claw only. | titan-data + engine-kill |

---

## 2. Data audit — open remediation (priority ordered)

These come from [`DATA_AUDIT.md`](./DATA_AUDIT.md) and are **not** done as of the last audit pass. **Knight/banner execution order:** use **[§1](#1-groomed-knights)** first; this table is the **full** audit backlog.

| # | Item | `DATA_AUDIT` refs |
|---|------|-------------------|
| 1 | **Legio Crusade:** add `legions[]` row for `LegioCrusade` (or explicitly remove `LegioCrusade` from JSON and accept missing content)—**21** `upgrades[]` + **1** Warmaster `bs:` weapon never appear in the legio-gated picker | §X.2, §L.2, executive |
| 2 | **Banner `availableWeapons`:** ~~**10** rows on **`placeholder`**~~ **Remaining gap:** reconcile lists to BS (optional §B.3 pass); **`id: placeholder` removed** from all `banners[]` (2026-03-29). | §B.1, §B.3, §0.2, executive |
| 3 | **Titan `bs:` placeholders:** **15** `bs:` rows remain shell/placeholder stats; fill from BS **`Weapon`** profiles where the UI needs real ranged stats | §T.5 table, executive |
| 4 | **Ion shields:** ~~**Data:** BS **Ion Shields** → **`ionShieldTable`** in `templates.json` (10 knight banners; stalkers **`ionShieldSaves: []`**)~~ **Done / verified (2026-03-29).** **Remaining:** Engine Kill — render from **`ionShieldTable`**, remove hardcoded **`ION_SHIELD_TABLE`**. | §B.8.1, §B.9, executive |
| 5 | **Banner damage model:** tabletop **structure points** vs app **head/body/legs** + **`armorRolls`** `—`—schema + product decision | §B.5, §B.8.2–3, executive |
| 6 | **BS weapon profile modifiers:** conditional accuracy / modifier chains not encoded in JSON (pilot + §T.4) | §0.1 hunt, §0.7.3, §T.4 |
| 7 | **Legio-gated weapon visibility:** validate vs BS `modifier` / `condition` chains | §T.4 |
| 8 | **Warhound / Reaver slug arms** (`turbo-laser-destructor`, `vulcan-mega-bolter`, `inferno-gun`, `plasma-blastgun`): optional parity pass vs same BS rows as carapace `bs:` siblings | §T.4, §0.7.1 |
| 9 | **Princeps traits:** full BS trait table / `rules[]` text diff | §P.4.1 |
| 10 | **Upgrades:** deeper **§U.6**-style points/rules after big edits; confirm **`.cat`** / non-`gst` copies; optional BS `selectionEntry` id on rows | §U.4, §369 |
| 11 | **Legion duplicate BS ids:** grep conditions / princeps links for **alternate** `categoryEntry` ids so tooling does not depend only on legacy ids | §L.3 |
| 12 | **Warmaster / Iconoclast:** deferred—treat as same chassis with different weapon pools when tightening support | executive §27 |
| 13 | **Chunk X follow-ups:** full `bs:` graph inventory; `warnings[]` if validator added; uncatalogued BS entries if scope expands | §X.4 |
| 14 | **Maniples:** **Janissary** — BS typo **“Batteline”** vs JSON **Battleline** (publication vs data cleanup) | §M.4 |
| 15 | **Pilot “hunt later”:** align **`legioCategoryId`** style across `legions` / `princepsTraits` / `upgrades`; full verbatim legion & maniple text vs BS | §0.7.4–5 |
| 16 | **Household.cat:** Cerastus / Acastus weapon consolidation (pilot §0.7.6) | §0.7.6 |
| 17 | **Intentional scope gap:** **~170+** BS rule-bearing upgrades not in `upgrades[]` (stratagems, knight options, etc.)—expand scope only if product requires | §U.5, §U.3 |

---

## 3. Ungroomed (other docs — not folded into §2)

Items from [`.planning/codebase/CONCERNS.md`](../.planning/codebase/CONCERNS.md), [`REFACTOR_PROGRESS.md`](./REFACTOR_PROGRESS.md), and elsewhere that are **not** the audit checklist itself. **Groom** into **[§1](#1-groomed-knights)** / **[§2](#2-data-audit--open-remediation-priority-ordered)** or detailed tickets when ready. *(CONCERNS is dated 2026-03-11—verify against the codebase before treating counts/lines as current.)*

**Tech debt**

- Triple-layer boolean / unit sanitization (`storageService`, `GameContext` migration, per-render `safeUnits`)—consolidate at load/write.
- Migration branches in `initialize()`—schema version + one-shot migrations.
- Oversized `HomeScreen.tsx` / `UnitEditScreen.tsx`—extract modals and lists.
- Hardcoded BattleScribe internal IDs in adapter / `HomeScreen`.
- Manual `TEMPLATE_ID_ALIASES` in `constants.ts`—derive or generate where possible.
- Replace deprecated `substr` with `slice`.
- Remove `[key: string]: any` from `Weapon` / `UnitStats` (or narrow to `extra`).

**Bugs**

- Horn / `Audio.Sound` not unloaded on navigate away from `UnitEditScreen`.
- Delete battlegroup leaves orphaned units/maniples in storage.
- `updateBattlegroup` / `renameBattlegroup` / `addUnitFromTemplate` may read stale state when saving.

**Security / robustness**

- GitHub API commit fetch: rate limits, silent `.catch`.
- Raw GitHub JSON: no integrity hash (documented risk).
- No max length on user-entered names.

**Performance**

- Per-render unit sanitization in `GameProvider`.
- `cache: 'no-store'` + cache buster on titan-data fetch—consider ETag / versioning.
- **BattleScribe XML adapter:** confirm whether it runs on the **main app** path or only tooling (app uses **`templates.json`** only at runtime per data rules); update docs or remove dead paths if obsolete.

**Fragile areas**

- BattleScribe adapter heuristics (if still in repo for tooling).
- `INITIALIZE_PLAYER` reducer no-op.
- Void shield index not enforced on `updateUnit` path.
- Fire-and-forget async in UI; storage errors swallowed.
- `ErrorBoundary` exposes stack traces to users.

**Scaling / product**

- AsyncStorage single blob for all units.
- Firebase installed but unused (bundle / vestigial models).
- `react-navigation` imported but disabled—custom navigation only.

**Missing features**

- Error boundary: no recovery / clear-data path.
- No data export or backup.

**Tests**

- CONCERNS claims zero coverage; repo now has Jest/E2E for templates—**re-audit** coverage gaps vs [`TESTING_TEMPLATES.md`](./TESTING_TEMPLATES.md).

**REFACTOR_PROGRESS (non-knight)**

- None beyond banner/knight items (covered in **§1**).

---

## Cross-links

| Doc | Role |
|-----|------|
| [`DATA_AUDIT.md`](./DATA_AUDIT.md) | Full audit evidence and methods |
| [`AGENT_DATA_CONTEXT.md`](./AGENT_DATA_CONTEXT.md) | Onboarding snapshot |
| [`REFACTOR_PROGRESS.md`](./REFACTOR_PROGRESS.md) | Closed refactor; banner UX pointer |
| [`.planning/codebase/CONCERNS.md`](../.planning/codebase/CONCERNS.md) | Codebase concerns (ungroomed source) |

---

## Done (archive)

Completed items only; kept for history. Newest batches first.

### 2026-03-29 — App

- **Battlegroup points:** `BattlegroupListScreen.getBattlegroupPoints` includes **banner** units (same formula as home list): **`src/utils/unitPoints.ts`** — `getTitanTotalPoints` / `getBannerTotalPoints` / `getUnitTotalPoints`. Banner total adds **`unit.upgrades`** (wargear) in addition to base, knights, and `bannerWeaponIds`; shared with `HomeScreen`.

### 2026-03-29 — Knights / data

- **titan-data · Banner ion saves:** `defaultStats.ionShieldTable` (`rows` × attack-strength **`saves`**) on **10** knight-style banners; **4** stalker banners use **`ionShieldSaves: []`** with ion/construct behavior in **`specialRules`** (no strength matrix in JSON).
- **§1 · Banner `placeholder` `availableWeapons`:** `cerastus-knight-banner`, `acastus-knight-banner`, `moirax-knight-banner`, `armiger-knights-banner`, `serperos-` / `errax-` / `scintillax-stalker-banner` — full `bs:` rows from **`Adeptus Titanicus 2018.gst`** `Weapon` profiles. *(Questoris trio, Asterius, Atrapos, Tenebrax were already non-placeholder.)* Optional: **§T.5**-style spot-check.
- **§1 · Styrix / Magaera banners:** `questoris-knight-styrix-banner` — Volkite Chieorovile + Hekaton Siege Claw; `questoris-knight-magaera-banner` — Lightning Cannon + Hekaton Siege Claw; **`hasCarapaceWeapon`:** `false`. Graviton gun / Phased Plasma-Fusil omitted (upgrade special attacks). *Open optional UX: **§1 row 6**.*
- **§2 · Questoris banners:** `questoris-knight-banner`, styrix, and magaera reconciled to BattleScribe (shared-list shortcut removed).

### Ungroomed (historical)

- **Performance:** ~~No shared XML parse cache~~ — audit-era note; *open follow-up: **§3** Performance (BattleScribe adapter at runtime).*

---
