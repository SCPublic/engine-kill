# Data audit — BattleScribe ↔ titan-data `templates.json`

**Status:** **Closed as an audit deliverable** — the pass that produced this document is complete. **Remediation** (placeholders, ion, banners, etc.) is **ongoing** work against the checklist below, not an open refactor phase.

**Prioritized open items:** **[`TODO.md`](./TODO.md)** §1 **Groomed (Knights)** first; full audit-backed table + § refs in **§2**.

**Agent quick path:** For a **short snapshot** of repos, audit status, and “what’s optional next,” use **[`AGENT_DATA_CONTEXT.md`](./AGENT_DATA_CONTEXT.md)**. **This file** is the **full** chunk-by-chunk audit.

**Purpose:** Compare BattleScribe (titan-data `.gst`, `.cat`) to root **`templates.json`**: gaps, mismatches, intentional JSON deltas, hunt-later items. The **audit pass** that recorded this doc is **complete** (see [`REFACTOR_PROGRESS.md`](./REFACTOR_PROGRESS.md)). **Remediating** those findings = normal edits to **`templates.json`** (and occasional engine-kill UI), tracked from this file—not an open “refactor step.”

**Audit vs fix:** The audit can end as a **checklist only**; you don’t have to remediate during the same pass. **Chunk B** mixed **recording** (gaps, wrong shapes) with **small fixes** where obvious (typos, stalker construct text, Tenebrax rules from publication). **Large** work—placeholder weapons, ion tables from BS, banner structure UI—can be a **dedicated data sprint** or incremental PRs against the checklist below.

**Banner `specialRules`:** Prefer **publication / command terminal** wording when BS omits a full string (e.g. Tenebrax **Construct Shields** line). Otherwise pull rule bodies from BS `categoryEntry` / unit-linked rules. Apply the same pattern to other banners as you audit them.

**Sources:** titan-data `Adeptus Titanicus 2018.gst`, `Battlegroup.cat`, `Household.cat`, `templates.json`.

**Conventions per chunk:** Scope → Gaps → Mismatches → JSON-as-truth (intentional) → Hunt later. Group by `templates.json` category. **`templates.json` overrides BS** where corrections were deliberate; still list deltas for approval.

---

## What sticks out (executive)

- **Runtime is simple:** the app loads **one file** — root `templates.json`. Everything below is optional proofreading vs BattleScribe XML.
- **Banner weapons:** **10** of **13** `banners[]` rows still use a single **`placeholder`** weapon; **3** Questoris-family rows have full `bs:` lists (see Chunk **B**). **Banner damage:** app still uses **three location tracks** like titans; tabletop banners are **structure points**—see **§B.5**. **Ion shield UI** is a **hardcoded placeholder** until BS ion profiles are mined into `templates.json` (**§B.9**).
- **Maniples:** 20 rows aligned with BS; **no** `allegiance` on maniples in `templates.json` — core formations are available to both loyalist and traitor battlegroups; legio-only constraints belong in rule text (e.g. Canis / Audax, Maniple of One / Atarus) until a dedicated field exists.
- **Legions:** 32 rows match BS `categoryEntry` name + id; BS has **duplicate ids** for several legions (see §L.3); **LegioCrusade** exists in BS but not as a `legions[]` row — **Chunk X:** that gap strands **`legioKeys: [\"LegioCrusade\"]`** on **21** upgrades + **1** Warmaster weapon (picker / gating; **§X.2**).
- **`princepsTraits` / `upgrades`:** `legioCategoryId` on legio traits is the Legio **selectionEntry** id (trait tables), not `legions[].categoryId` (**categoryEntry**). **`legions[].princepsLegioSelectionEntryId`** bridges the two; **HomeScreen** uses it for legion-specific traits (Chunk **P**).
- **Titans:** `warbringer` is **Warbringer Nemesis** (BS + command terminal): **325** pts + weapons; **7** void pips / **7** reactor pips; **head** 7 / **body** 9 / **legs** 9 structure; void saves `3+, 3+, 4+, 4+, 4+, 4+, X`; reactor pip colors 2× green → 2× yellow → 2× orange → red. **`bs:`** weapon stats: **58** unique rows match BS **`Weapon`** profiles (**§T.5**); **15** `bs:` entries stay placeholder/shell in JSON.
- **Warmaster / Iconoclast:** deferred; treat as same chassis with different weapon pools when you tighten Warmaster support.
- **Remaining audit slices (optional):** **T** legio-gated weapon visibility + slug arm parity; **X** deeper cross-catalog sweep.

---

## Chunk index

| Chunk | Scope (`templates.json`) | Status |
|-------|--------------------------|--------|
| **0 — Pilot** | Partial T, B, M, L, P (sample ids) | Done (2026-03-19) |
| **L** | `legions` (full) | Done |
| **M** | `maniples` (full) | Done |
| **T** | `titans` (full, incl. weapons) | Done: identity + **`bs:`** profile pass (**§T.5**); slug arm parity + legio visibility still optional |
| **B** | `banners` (full) | Done (2026-03-28); placeholder weapon fill-in = ongoing vs this doc |
| **U** | `upgrades` (full) | Done (2026-03-28): `.gst` rule-entry **name** inventory + **§U** fixes; points/rules spot-check + `.cat` scope optional |
| **P** | `princepsTraits` (full) | Pilot done (2026-03-28); full BS trait table diff still open |
| **X** | `warnings`, orphans, cross-references | Pilot done (2026-03-28); BS `bs:` inventory / uncatalogued entries still open |

Suggested order for new work: **L → M → T → B → U → P → X** (legion ids stable before upgrades/traits).

---

## Chunk 0 — Pilot (2026-03-19)

**Scope:** Titans `reaver` + `warhound`; banners `questoris-knight-banner`, `cerastus-knight-banner`, `acastus-knight-banner`; maniples `maniple:axiom-battleline-maniple`, `maniple:arcus-battleline-maniple`; legion `legio:legio-astorum-warp-runners`; first 12 `princepsTraits` rows (through `trait:bloodthirsty`); **`upgrades` not sliced** (no Astorum upgrade rows to diff).

### 0.1 Titans (`reaver`, `warhound`)

**`bs:…` weapon IDs:** Spot-check **`bs:aa7a-74f4-180e-3b5e`** (Gatling Blaster) exists in `.gst` as `selectionEntry` with matching name. Same pattern expected for other `bs:` ids on Reaver (not every row re-verified in this chunk).

**Slug IDs vs BattleScribe selection entries:**

| JSON `id` | BS anchor | Notes |
|-----------|-----------|--------|
| `turbo-laser-destructor` | `0b27-6d01-57d3-0e9d` — **Turbo Laser Destructor [RVR]** | Profile name in BS: “Turbo Laser Destructor”. Stats checked: Dice 2, S8, 18"/32", traits Carapace + Shieldbane (Draining), **20 pts** — align with JSON. JSON adds app-specific `disabledRollLines` / `repairRoll`. |
| `vulcan-mega-bolter` | `47c9-43b5-8afc-b64f` — **Vulcan Megabolter [RVR]** | Display spelling “Megabolter”; approve or normalize. Stats match baseline; BS may use **modifiers** (conditional long accuracy) — JSON may not encode. |

**Hunt later:** Weapons with BS **modifiers** on profiles.

**Naming / typos:**

| Item | `templates.json` | BattleScribe / publication |
|------|------------------|----------------------------|
| `warbringer` titan | **Warbringer Nemesis Titan** | BS `d2b6-f342-ccdb-b9cc`; former Warbreaker fan loadout removed. |

**Legio-specific Reaver weapons:** e.g. Chasmata Laser Blaster (`bs:01e4-e3f5-4396-d5c4`) + `legioKeys: ["LegioTempestus"]`; toxin variants + `LegioMordaxis`. Matches BS legion-gated entries / `LegioTempestus` (`15bd-0b4b-5cac-dc48`).

### 0.2 Banners (pilot trio)

| Banner id | `availableWeapons` | Gap |
|-----------|-------------------|-----|
| `questoris-knight-banner` | Full `bs:…` list | **OK** (no placeholder in sample). |
| `cerastus-knight-banner` | **`placeholder` only** | **Gap:** consolidate from `Household.cat` / `.gst`. |
| `acastus-knight-banner` | **`placeholder` only** | **Gap:** same. |

**Text:** “Auxilliary Knight Banner” → spelling **Auxiliary** (approval).

### 0.3 Maniples (pilot pair)

**Axiom** (`.gst` `3ca3-42a8-26bb-5676`): BS rule title **“Might of the Omnissiah”**; JSON `specialRule` has same body, no title — cosmetic.

**Arcus** (`.gst` `ff4b-fa85-f846-e378`): BS title **“Coordinate Relay”**; JSON omits title. Body: JSON **“Warbringer”** vs BS **“Warbringer-Nemesis Titan”**. `Battlegroup.cat` `entryLink` targetIds match `.gst`.

### 0.4 Legions — Legio Astorum only

| Field | JSON | BS |
|-------|------|-----|
| `categoryKey` | `LegioAstorum` | `categoryEntry` `06c2-f93e-7bf5-9fd5` |
| `categoryId` | `06c2-f93e-7bf5-9fd5` | **Match** |

**Rules:** Verbatim diff vs BS not run in chunk 0.

**Upgrades:** No `upgrades` rows with `LegioAstorum` in `legioKeys` — **chunk U** should use a legion with many upgrades (e.g. Mortis, Tempestus, Krytos).

### 0.5 Princeps traits — first 12 rows

Sampled `legioCategoryId` values resolve in `.gst`.

**Pattern:** `trait:adamantium-resolve` uses **`cbc6-216c-8a22-c1b4`** (BS **`selectionEntry`** “Legio Tempestus (Storm Lords)”), not **`15bd-0b4b-5cac-dc48`** (`categoryEntry` `LegioTempestus` on `legions[]`). Linked via `categoryLink` — same legion, **different id spaces**.

**`trait:beast-of-aeons`:** `legioCategoryId: null`, `traitGroup: "corrupted"` — OK.

### 0.6 JSON-as-truth (pilot)

- `disabledRollLines` / `repairRoll` — intentional app shape.
- Slug weapon ids — intentional.
- Omitting BS rule titles — presentation choice.

### 0.7 Hunt later (from pilot)

1. Slug-only weapons → which BS variant (RVR / WH / WM / …).
2. Ten banner rows still on **`placeholder`** weapons (Chunk **B**).
3. Conditional BS weapon **modifiers**.
4. Align **`legioCategoryId`** style across `legions`, `princepsTraits`, `upgrades`.
5. Full verbatim legion / maniple text.
6. **Household.cat** for Cerastus/Acastus weapons.

### 0.8 Suggested next slice

Legion with **many upgrades**; optional household-specific banner; stratagems if present in JSON.

---

## Chunk L — `legions` (full)

**Method:** Parsed all `<categoryEntry … name="Legio…">` in `Adeptus Titanicus 2018.gst`. For each `templates.json` `legions[]` row, verified `categoryId` exists and `name` attribute equals `categoryKey`. No `Battlegroup.cat`-only legion list (force structure uses `.gst` categories).

### L.1 Coverage

| Metric | Value |
|--------|--------|
| `legions[]` count | **32** |
| Rows with valid BS `categoryEntry` + `name === categoryKey` | **32** |
| `Legio*` `categoryEntry` in `.gst` (including non-legion keys) | **42** |

### L.2 Gaps (BS category not represented as a `legions[]` template)

| BS `categoryEntry` | id | Notes |
|--------------------|-----|--------|
| **LegioCrusade** | `9329-8448-1502-f1d1` | Used in BS for crusade/narrative tagging. JSON references **`LegioCrusade`** in `upgrades` / `legioKeys` but has **no** `legions[]` object. Likely **intentional** (not a standard battlegroup legion). Confirm in app/docs. |
| **LegioSpecificWargear** | `91bd-c88a-f6bb-bb3d` | Equipment category, not a legion trait block — **no** JSON legion expected. |
| **Legio Specific Stratagem** | `eb21-0dae-9a3d-863a` | Stratagem bucket — **no** JSON legion expected. |

### L.3 BattleScribe duplicate IDs (same `name`, two `categoryEntry` ids)

`.gst` defines **two** ids for several legions. JSON uses **one** id each (second column). Tooling that only knows the **alternate** id may fail to match JSON until aliased.

| `categoryKey` | JSON `categoryId` (canonical in templates) | Alternate BS id (unused by JSON) |
|---------------|---------------------------------------------|----------------------------------|
| LegioAstraman | `f13e-f477-7652-0e1c` | `324b-8404-7509-9b36` |
| LegioIgnatum | `83db-4337-737c-1db8` | `5f7b-2051-3935-7637` |
| LegioVenator | `a768-815b-17bf-6136` | `43b6-60b3-8111-290c` |
| LegioLaniaskara | `b4cb-2809-41b4-6d83` | `4a24-73e7-556c-1bfd` |
| LegioKulisaetai | `f986-f640-3cb3-478a` | `6740-1e8a-8e25-88fd` |
| LegioTritonis | `753b-9e36-a10c-7961` | `ccee-936e-87d6-bf29` |
| LegioDamicium | `f778-49fb-1bfd-4838` | `ae2e-5751-1800-545a` |

**Hunt later (chunks P / U):** Grep BS conditions and princeps links for **alternate** ids so nothing references only the legacy id.

### L.4 Rule text

- **Not** diffed verbatim against every BS `selectionEntry` / `rule` description in this chunk (high volume).
- **Creeping Madness** (`legio:legio-interfector-murder-lords`): copy-edited in **`templates.json`** (grammar only; BS XML had the same raw errors). Not re-synced to BS word-for-word.

### L.5 Allegiance

JSON `allegiance` (`loyalist` / `traitor`) **not** checked against BS in this pass.

### L.6 Mismatches summary

- **None** for `categoryId` ↔ `categoryKey` ↔ BS `categoryEntry` name alignment (all 32 rows OK).
- **LegioCrusade:** presence in BS, absence in `legions[]` — see §L.2.

---

## Chunk M — `maniples` (full)

**Method:** Map each `templates.json` maniple `name` to a `Battlegroup.cat` `entryLink` whose `targetId` is a maniple `selectionEntry` in `Adeptus Titanicus 2018.gst`. For each id, take a slice after the opening `selectionEntry` tag and extract the **first** `<rules>…</rules>` block (full `.gst` trees are too nested for naive tag balancing; `</selectionEntry>` can appear inside rule text). Concatenate all `<description>` bodies, normalize whitespace, compare to JSON `specialRule`.

### M.1 Coverage

| Metric | Value |
|--------|--------|
| `maniples[]` count | **20** |
| `Battlegroup.cat` links to those `.gst` entries | **20** (1:1) |

### M.2 Rule text vs BS (pre-fix)

**19 / 20** normalized matches. **Dominus Battleforce Maniple** JSON had only the first BS rule (**Auspex Bafflers**); BS also defines **Noble Sacrifice** in the same entry — **gap fixed** in `templates.json` (both rules with labels).

### M.3 JSON-as-truth (deliberate)

- **`maniple:maniple-of-one`:** first sentence referenced **Legio Astraman** (matches BS XML) but contradicts **Legio Atarus** elsewhere in the same rule. JSON updated to **Atarus** for internal consistency (BS copy error).
- **Cosmetic:** JSON omits BS rule **titles** (e.g. Arcus “Coordinate Relay”) — same as Chunk 0.
- **`allegiance` removed from all maniples:** BattleScribe `publicationId` had been mirrored as `traitor` / `loyalist`, but **AT list construction** does not lock most maniples to one side; legio-specific limits stay in `specialRule` (and a future optional `legioKeys`-style field if the app enforces them).

### M.4 Hunt later

- **Janissary Battleline Maniple:** `Battlegroup.cat` uses **“Batteline”** in one place; JSON says **Battleline** — publication spelling vs typo; no change applied to BS files here.

---

## Chunk T — `titans` (full)

**Method:** Inventory `templates.json` `titans[]`; compare display names and **Engine** profile to BS `selectionEntry type="model"` (earlier pass). **§T.5 (2026-03-28):** automated **`bs:`** weapon-profile diff vs **`Adeptus Titanicus 2018.gst`**, **`Household.cat`**, **`Battlegroup.cat`** (combined scan for `id="…"` anchors).

### T.1 Coverage

| JSON `id` | `name` | `availableWeapons` count | Notes |
|-----------|--------|--------------------------|--------|
| `dire-wolf` | Dire Wolf Titan | 4 | |
| `reaver` | Reaver Titan | 16 | includes legio-gated rows |
| `warbringer` | **Warbringer Nemesis Titan** | 10 | BS `d2b6-f342-ccdb-b9cc`; arms + WBG carapace + Ardex |
| `warhound` | Warhound Titan | 14 | |
| `warlord` | Warlord Titan | 14 | |
| `warmaster` | Warmaster Iconoclast Heavy Battle Titan | 15 | BS also defines plain **Warmaster Titan** |

### T.2 Warbringer Nemesis (remediated vs BattleScribe)

- **Name + base points:** Warbringer Nemesis Titan, **325** pts (BS `costs`).
- **Engine profile:** speed **5"/7"**, command **4+**, BS **3+**, WS **5+**, manoeuvre **2/3**, servitor clades **4** (BS Engine block).
- **`availableWeapons`:** `entryLink` arm weapons shared with Reaver (Gatling / Laser / Melta / Volcano + legio gated Chasmata + Mordaxis toxin arms); carapace **Bellicosa** `02fe-12bb-3cc6-2dcf` and **Mori Quake** `304a-a91b-5b0f-116e` from WBG-specific BS rows; **Ardex** `ebc6-2029-ceb3-f43b` with rule text **D3** S5 hits (BS `rule`/`description`).
- **`defaultStats` void / reactor / damage bands / `modifiers` / `criticalEffects`:** aligned to the **Warbringer Nemesis command terminal** (Scale 9).

**Warbreaker Titan** (`fb67-1918-d9b1-b946`) — fan / non-canon entry in BS — is **not** represented in `templates.json`.

### T.3 Naming / typos

- **Warmaster:** JSON tracks **Iconoclast**; base Warmaster is separate BS row when needed.

### T.4 Hunt later

- Legio-gated weapon **visibility** vs BS `modifier` / `condition` chains (not validated in §T.5).
- **`Warhound` / `Reaver` slug arms** (no `bs:` on **`turbo-laser-destructor`**, **`vulcan-mega-bolter`**, **`inferno-gun`**, **`plasma-blastgun`**): stats are duplicated in JSON; optional future pass to assert parity against the same BS rows as carapace `bs:` siblings.

### T.5 `bs:` weapon profile pass (2026-03-28)

**Scope:** **`titans[]` + `banners[]`**: **73** unique **`bs:…`** weapon/equipment ids in **`availableWeapons`** (and defaults, if any).

**Anchor resolution:** Every id appears in **`Adeptus Titanicus 2018.gst`**, **`Household.cat`**, or **`Battlegroup.cat`** (string search for `id="uuid"`).

**Stats parity (Dice / Strength / ranges / accuracies / Points / Trait list):** For each id, take the owning **`selectionEntry`**: use **`Weapon`** **`profile`** blocks that appear **before** the first nested **`selectionEntry`** / **`selectionEntryGroups`** (BS lists child models/weapons inline; avoids grabbing a child’s profile). Compare to JSON rows with **non-placeholder** stats (any of: **`dice > 0`**, **`strength > 0`**, numeric range, or non-empty **`traits`**).

| Result | Value |
|--------|------:|
| **Stats-bearing `bs:`** rows (unique) | **58** |
| Rows where JSON stats match BS (method above) | **58** (**0** mismatches) |
| **Placeholder `bs:`** in JSON (`dice`/`strength` 0, **`shortRange`** **`"-"`**, no traits) | **15** |

**Placeholder buckets (informative; no change in this pass):**

| Kind | Count | Examples |
|------|------:|----------|
| **No `Weapon` profile on the anchored entry** (force/model shell) | **4** | **Titan Legion** `6202-…`, **High Scion** `afaf-…` (`Household.cat`), **Questoris Knight Lord Scion / Scion Martial** `9570-…` / `2f87-…` (`type="model"` units in `.gst`) |
| **Equipment / special rows** where JSON keeps **`"-"`** stats for UX | **11** | **Ardex Defensor Cannon** (rule-based **D3** attack, not a single weapon table), **Corrupt Titan** toggle, **Meltagun**, knight **Phased Plasma-Fusil** / **Ionic Flare Shield** / **Graviton Gun** / **The Battle Standard**, **Questoris Knight Lord & Scion (Styrix / Magaera)** |

Filling placeholder rows from BS **`Weapon`** profiles is **templates.json remediation** if the UI needs ranged stats for those picks.

---

## Chunk B — `banners` (full)

**Method:** Inventory `templates.json` `banners[]`; map each `name` to `Battlegroup.cat` `entryLink` → `.gst` `selectionEntry` by **display name** (and `targetId` where listed). Spot-check **Engine** + **Location Table** profiles for Stalker variants against `defaultStats`. No full weapon-profile extraction for placeholder rows in this pass.

### B.1 Coverage

| Metric | Value |
|--------|--------|
| `banners[]` count | **13** |
| Rows with a one-line **`placeholder`** `availableWeapons` | **10** |
| Rows with full **`bs:`** weapon lists (Questoris pattern) | **3** (`questoris-knight-banner`, `questoris-knight-styrix-banner`, `questoris-knight-magaera-banner`) |

### B.2 BS anchors (`Battlegroup.cat` → `Adeptus Titanicus 2018.gst`)

| JSON `id` | BS unit `selectionEntry` | BS `id` (reference) |
|-----------|-------------------------|---------------------|
| `questoris-knight-banner` | Questoris Knight Banner | `812b-786b-9435-cd20` |
| `cerastus-knight-banner` | Cerastus Knight Banner | `3900-cfb6-52f2-c83c` |
| `acastus-knight-banner` | Acastus Knight Banner | `3b77-15d2-9ca8-5cf7` |
| `questoris-knight-styrix-banner` | Questoris Knight Styrix Banner | `dec1-8a16-1df5-e112` |
| `questoris-knight-magaera-banner` | Questoris Knight Magaera Banner | `1a0a-5e72-9752-c32d` |
| `moirax-knight-banner` | Moirax Knight Banner | `8be9-756b-a3a6-8622` |
| `armiger-knights-banner` | Armiger Knights Banner | `11c3-a34f-1748-cf07` |
| `acastus-knight-asterius-banner` | Acastus Knight Asterius Banner | `3997-93d3-81f3-8802` |
| `cerastus-knight-atrapos-banner` | Cerastus Knight Atrapos Banner | `9167-7d32-6d19-739d` |
| `serperos-stalker-banner` | Serperos Stalker Banner | `5fe1-6d10-b045-c3f0` |
| `errax-stalker-banner` | Errax Stalker Banner | `31b1-e699-268e-99cd` |
| `tenebrax-stalker-banner` | Tenebrax Stalker Banner | `5aed-482a-3dd7-8e40` |
| `scintillax-stalker-banner` | Scintillax Stalker Banner | `706a-06cc-ab47-61a4` |

All thirteen names resolve to a **unit** `selectionEntry` in `.gst`. Additional BS-only banner links (e.g. other crusade entries) are out of scope unless added to JSON later.

### B.3 Gaps — `availableWeapons`

| JSON `id` | Gap |
|-----------|-----|
| `cerastus-knight-banner` | Single `placeholder`; arm/loadout options live under `.gst` / `Household.cat`. |
| `acastus-knight-banner` | Same. |
| `moirax-knight-banner` | Same. |
| `armiger-knights-banner` | Same. |
| `acastus-knight-asterius-banner` | Same. |
| `cerastus-knight-atrapos-banner` | Same. |
| `serperos-stalker-banner` | Same (BS: Lascutters default on Serperos Stalker, Stalker Meltagun alt, etc.). |
| `errax-stalker-banner` | Same (BS: Stalker Lascutter / Stalker Meltagun). |
| `tenebrax-stalker-banner` | Same (BS: Exo-Planar Cannon + Storm Laser Flenser per model). |
| `scintillax-stalker-banner` | Same (BS: Lascutter / Exo-Planar Cannon / Storm Laser options). |

**Questoris trio (clarification):** Same as **§B.3** weapons gap—shared list is a **coverage / unsupported weapons** shortcut until each banner is reconciled to BS (optional future pass).

### B.4 Stalkers — Construct Shields in `specialRules`

**`specialRules` text:** Construct shield rule bodies match **BattleScribe** `.gst` `<description>` verbatim (including publication wording *“Ion Shield”* where GW uses it). **Do not** prepend editorial notes in JSON.

**Implementation note (not in JSON):** Those rules are **construct** mechanics. They are **not** bound to Engine Kill’s **`ionShieldSaves`** field or the household **ION SHIELDS** UI table—Stalkers use **`ionShieldSaves`: `[]`**.

| JSON `id` | Construct | `specialRules` |
|-----------|-----------|----------------|
| `serperos-stalker-banner` | Yes | BS **Serperos Construct Shields** rule text (**3+**). |
| `errax-stalker-banner`, `scintillax-stalker-banner` | Yes | BS **Errax Scintillax Construct Shields** rule text (**4+**). |
| `tenebrax-stalker-banner` | **No** (no Construct category link in BS) | **Construct Shields** / **Networked Anima** / **Agile** strings aligned to **publication** (Tenebrax-specific *Stalkers* wording where the book uses it). |

**Prior mistake:** Tenebrax briefly carried the **4+ construct** paragraph in error; corrected. Originally Stalker rows had **`specialRules`: []** before construct/Tenebrax fixes.

**Engine Kill UI:** **StatsPanel** shows construct text from `specialRules`. **ION SHIELDS** panel is gated off **`ionShieldSaves`** (empty for Stalkers).

### B.5 Banners — structure points vs app `damage` shape

**Tabletop (AT Knight banners):** Damage is tracked as **Structure points** (a single pool / terminal scale, e.g. 3 or 4 for the banner—not Titan-style **head / body / legs** location tracks with per-location armour bands).

**`templates.json` + app today:** Banner entries still expose **`damage.head` / `body` / `legs`** and three **DamageTrack** rows, with **`armorRolls`** mostly **`—`**. That layout is a **legacy / inaccurate** stand-in for titans applied to knights; fixing it means a **product + schema** pass (structure pool UI, optional BS **Location Table** only if it matches how you track knights).

**BattleScribe:** Knight units include **Ion Shields** profiles (e.g. *Models in Banner* × *Attack Strength* → save) and often a **Location Table** profile on the same unit—useful when mining data, but **not** the same as “three independent location armour rows” in the current app.

**`structurePointsMax`:** Present on banner templates; align with terminals / BS when auditing.

### B.6 Engine stats spot-check (JSON vs BS Engine profile)

Spot-checked: **Serperos / Errax / Tenebrax / Scintillax** — Speed, Command, BS, WS, and Scale-consistent fields align with the first **Engine** profile on each `.gst` unit. **Manoeuvre** is empty in BS for some rows; JSON uses `"2/4"`, `"-"`, or `"ignores"` as already modeled.

### B.7 Typos / copy fixes applied in `templates.json` (this pass)

- **Auxiliary:** rule titles **`Auxilliary`** → **`Auxiliary`** (two strings).
- **Moirax / Armiger:** speed **`11'`** → **`11"`** (inch quote).
- **Atrapos:** **Macro-Extinction Protocols** — `Scale 7 of higher` → **`Scale 7 or higher`**; tighten **Hit rolls of  a** → **`of a`**.
- **Asterius:** double space before **Acastus Knight Asterius** in reinforcement sentence removed.

### B.8 Hunt later

1. **Mine `.gst`:** Ion **Shields** profiles (per banner type, per *Models in Banner* rows) → structured JSON, then **replace** the app’s hardcoded placeholder table and/or drive **`ionShieldSaves`** from data.
2. **Structure points:** Confirm **Structure Points** / composition in BS vs **`structurePointsMax`** (and eventual banner damage UI).
3. Rebuild **banner damage UX** around **structure pool** (deprecate misleading three-track + `armorRolls` for knights unless you intentionally mirror terminals another way).
4. Placeholder **banner weapons** + **Questoris** list split (**§B.3**) when weapons are supported.

### B.9 App — Ion shield table (placeholder)

`IonShieldSavesDisplay` uses a **hardcoded** household-style grid (`ION_SHIELD_TABLE`). It is a **placeholder**, not BS-sourced data. The screen shows it only when **`defaultStats.ionShieldSaves.length > 0`**. **Planned:** extract ion saves from BattleScribe, add an explicit schema in `templates.json`, render from that instead of constants.

---


## Chunk U — `upgrades` (full)

**Method:** Inventory `templates.json` `upgrades[]`; summarize `sourceGroup` / `legioKeys`; spot fixes (e.g. Legio Metalica). **Full `.gst` name pass (2026-03-28):** every JSON row matched to a **`selectionEntry type="upgrade"`** with at least one **`<rule>`** (see **§U.5**). Points/rules line-by-line and non-`gst` catalogs remain **hunt later**.

### U.1 Coverage (`templates.json`)

| Metric | Value |
|--------|--------|
| `upgrades[]` count | **73** |
| `sourceGroup` **`universal`** | **61** |
| **`loyalist`** | **6** |
| **`traitor`** | **6** |
| Rows with **`legioKeys`** | **54** (after fix below) |
| Rows with **`legioCategoryId`** | **0** — app uses `legioKeys` + `UpgradeTemplate` only |

Upgrade picker (**HomeScreen**): legio-gated list uses **`legioKeys.includes(legionKey)`**; rows with empty `legioKeys` and `sourceGroup === 'universal'` surface as **universal** picks. Rows with non-empty **`legioKeys`** but no matching **`legions[].categoryKey`** (notably **`LegioCrusade`**) never appear — see **Chunk X §X.2**.

### U.2 Mismatch fixed (Legio Metalica)

| JSON `id` | Issue | Fix |
|-----------|--------|-----|
| `upgrade:auditory-barrage` | Rule text **=Metalica=** / Legio Metalica; **`legioKeys`** missing | Added **`legioKeys`: `["LegioMetalica"]`** (BS `selectionEntry` `f32d-4b22-e51e-d86f`, links to category `LegioMetalica` `2afb-401e-9ec9-28b2`). |
| `upgrade:bastion-armor` | Same | Added **`legioKeys`: `["LegioMetalica"]`** (BS `31ff-82f8-241d-7b29`). |

Without this, both appeared under **universal** upgrades for every legion in the UI.

### U.3 JSON-as-truth (intentional)

- **`id`:** slug `upgrade:…` — not BS `selectionEntry` ids (no change expected).
- **Household / Knight `selectionEntry type="upgrade"`** in `.gst` (e.g. House Devine): **not** represented in `upgrades[]` — app scope is Titan legio wargear / shared stratagem-style upgrades only unless you expand scope in Chunk P / X.

### U.4 Hunt later

1. **Further points/rules:** Re-run **§U.6** after large data edits; spot-check **`Adeptus Titanicus 2018.gst`** lines for typographic quirks only if something looks off in play.
2. **`.cat` / shared groups:** Confirm no duplicate or divergent **`selectionEntry`** copies outside **`Adeptus Titanicus 2018.gst`** for rows that matter to the app.
3. Optional: store BS **`selectionEntry` id** on upgrade rows for tooling (not required for current app).

### U.5 Full `.gst` upgrade **name** inventory (2026-03-28)

**Parse:** All **`selectionEntry type="upgrade"`** in **`Adeptus Titanicus 2018.gst`** that include at least one **`<rule`**, excluding **Void Shield**, names beginning with **House**, and legion **force** rows (**`Legio … (…)`** on the `selectionEntry` name). Includes **hidden** entries (most **`=Legio=`** wargear is `hidden="true"` in BS).

**Normalize** for comparison: strip leading **`=Foo=\s*`** prefixes from the entry **`name`**; also index the first **`<rule name="…">`** (decode XML entities, e.g. **`&apos;`** → **`'`**); case-insensitive match to **`upgrades[].name`**.

| Result | Value |
|--------|------:|
| **`upgrades[]` rows** | **73** |
| Rows with strict normalized key match | **72** |
| Rows with documented BS pair but label delta | **1** — JSON **`Meltaguns`** ↔ BS **`Meltagun`** (`5fef-e84f-c8eb-791b`, banner; pluralized display name in JSON). |
| **Total accounted for** | **73** |

**BS rule-bearing upgrades not represented in JSON:** on the order of **~170+** names remain in `.gst` under this filter — stratagems, knight weapons / options, corrupted-Titan upgrades, narrative traits, replacement slots, etc. That gap matches intentional **§U.3** scope (titan legio wargear + shared battlegroup-style picks in **`upgrades[]`**, not full BS catalog).

### U.6 Points / rules spot-check vs `.gst` (2026-03-28)

**Method:** For each **`upgrades[]`** row, resolve a BattleScribe **`selectionEntry type="upgrade"`** with **`<rule>`** using the same name keys as **§U.5**. When several BS rows share the normalized name (e.g. **Tracking Gyroscopes**), pick the entry whose **`=LegioTag=`** prefix matches **`legioKeys`** (strip leading **`Legio`** to match **`=Tempestus=`**, **`=Crusade=`**, etc.), else match **`points`**, else match **`+N points`** in the JSON rule string.

**Scope:** All **73** rows; **`LegioMortis`**, **`LegioKrytos`**, **`LegioTempestus`** subsamples; zero-point rows checked for accidental mismatch vs a single BS Points cost (variable-cost rows like **Earthbreaker Missiles** correctly stay **0** in JSON while rule text gives Warlord/Reaver prices).

| Outcome | Detail |
|--------|--------|
| **Points + rule body vs BS** | **72 / 73** already aligned after disambiguation; **1** fix applied (**§U.6.1**). |
| **Intentional JSON shape** | **`points`: 0** on rows whose BS cost is variable or non-single (**Dark Blessing**, **Earthbreaker Missiles**, **Princeps Seniores**, **Singular Purpose**) — not errors. |

#### U.6.1 Fix — **Meltaguns** (`upgrade:meltaguns`)

| Field | Before | After (BS `5fef-e84f-c8eb-791b`) |
|--------|--------|----------------------------------|
| **`points`** | **5** (wrong) | **15** |
| **`rules[]`** | Banner replacement summary (not BS rule text) | BS **Meltagun** activation rule; spacing **`3\". That`** |

Display name stays **Meltaguns** (plural) for continuity with existing saves / id slug.

---

## Chunk P — `princepsTraits` (full)

**Method (pilot):** Inventory `templates.json` `princepsTraits[]`; relate **`legioCategoryId`** to **`legions[]`**; fix app linkage so legion-specific traits appear when the maniple uses a **`legio:…`** template row.

### P.1 Coverage (`templates.json`)

| Metric | Value |
|--------|--------|
| `princepsTraits[]` count | **108** |
| **`traitGroup` `legio`** | **96** |
| **`standard`** | **6** |
| **`corrupted`** | **6** |

Legio rows: **`legioCategoryId`** is the BattleScribe **`selectionEntry`** id for that Legio’s force upgrade (personal trait tables key off it), **not** `legions[].categoryId`.

### P.2 App fix (`princepsLegioSelectionEntryId`)

**Issue:** **HomeScreen** only set the trait-table id when **`legion.id`** started with **`bslegio:`**. **`templates.json`** legions use **`legio:…`** ids, so **`legioSelectionEntryId`** stayed **null** and **legion-specific** traits never listed.

**Fix:** Each **`legions[]`** row now includes **`princepsLegioSelectionEntryId`**, derived once from **`.gst`** (non-primary **`categoryLink`** to the legion **`categoryEntry`**, excluding the shared force root link). **HomeScreen** uses **`princepsLegioSelectionEntryId`**, then falls back to **`bslegio:`** slice for any legacy path.

### P.3 Duplicate display names (same string, different `id`)

BS exposes multiple **selectionEntry** rows with the same trait name for different legions:

| `name` | Rows |
|--------|------|
| **Cruel** | 2 |
| **Crusade Veteran** | 2 |
| **Tactical Genius** | 2 |

JSON keeps **distinct `id`s**; UI shows **name** only — players may need **`rules`** preview to distinguish. No data change in this pass.

### P.4 Hunt later

1. **Full diff:** Personal trait **`selectionEntry`** paths / table text vs every JSON **`rules[]`** line.
2. **Corrupted / standard:** Confirm picker ordering and any battlegroup filters vs tabletop.

---

## Chunk X — Cross-cut (`warnings`, references, duplicates)

**Method (pilot):** Automated pass over root **`templates.json`**: id namespace, maniple → titan ids, banner default weapons vs `availableWeapons`, **`legioKeys`** vs **`legions[].categoryKey`**, **`princepsTraits`** `legio` **`legioCategoryId`** vs **`legions[].princepsLegioSelectionEntryId`**. Document **`warnings[]`** and duplicate display names.

### X.1 Structural checks (current JSON)

| Check | Result |
|-------|--------|
| **Id collisions** across `titans` / `banners` / `maniples` / `legions` / `upgrades` / `princepsTraits` | **None** (each `id` appears in at most one category). |
| **`maniples[].allowedTitanTemplateIds`** ⊆ **`titans[].id`** | **OK** (all references resolve). |
| **`banners[].defaultLeftWeaponId` / `defaultRightWeaponId`** ∈ same row’s **`availableWeapons[].id`** | **OK**. |
| **`titans[]` / `banners[]`** default arm ids | **OK**. |
| **`princepsTraits`** (`traitGroup === 'legio'`) **`legioCategoryId`** ∈ **`legions[].princepsLegioSelectionEntryId`** | **OK** (96/96 linked). |
| **`warnings[]`** | **`[]`** — reserved; nothing emitted by this pipeline today. |

### X.2 Dangling `legioKeys` — **LegioCrusade**

**`legions[]`** has **no** row with **`categoryKey`** **`LegioCrusade`** (see Chunk **L** — BS has the category; JSON omitted the legion row as out-of-scope or intentional).

 Rows in **`upgrades[]`** with **`legioKeys`** containing **`LegioCrusade`**: **21** (Crusade-specific wargear from the expansion). **Engine Kill** upgrade picker (**`HomeScreen`**) puts **`sourceGroup === 'universal'`** rows in “Universal” only when **`(legioKeys ?? []).length === 0`**, and puts legio-gated rows under “Legion” only when the maniple’s legion **`categoryKey`** matches. **Effect:** these **21** upgrades **never appear** in the picker (not universal, and no legion matches).

| Area | Count | Notes |
|------|------:|--------|
| **`upgrades[]`** with **`LegioCrusade`** | **21** | e.g. `upgrade:crusade-banners`, `upgrade:macro-magazines`, Legio-specific **Tracking Gyroscopes** (`upgrade:tracking-gyroscopes-cd3517bf`). |
| **`titans[].availableWeapons[]`** with **`legioKeys`** **`LegioCrusade`** | **1** | **`warmaster`** — weapon id **`bs:6202-19dc-f26f-9b64`** (Legio Crusade –only in BS). |

**Remediate:** Add a **`legions[]`** row for **Legio Crusade** (name, rules, `categoryKey` **`LegioCrusade`**, `categoryId` from BS, **`princepsLegioSelectionEntryId`** from `.gst`), *or* explicitly drop **`LegioCrusade`** from JSON and accept missing content—**not** an app-side silent fallback.

### X.3 Duplicate display names (cross-category recap)

| Array | Example | Count |
|-------|---------|------:|
| **`upgrades`** | **Tracking Gyroscopes** (universal +25 pts vs Legio Crusade +10 pts; distinct `id`s) | **2** |
| **`princepsTraits`** | **Cruel**, **Crusade Veteran**, **Tactical Genius** | **2** each |

Same as Chunk **P** for traits; upgrades need **`rules`** / points to tell apart in UI if both ever visible.

### X.4 Hunt later

1. **Full `bs:` graph:** Every **`bs:…`** weapon id on titans/banners vs `.gst` / `.cat` `selectionEntry` (or explicit deprecation list).
2. **`warnings[]`:** If the repo adds a validator, record human-readable issues here for app/tooling.
3. **Uncatalogued BS:** Force-structure entries not mapped to `templates.json` categories (household-only, etc.) — low priority unless scope expands.

---

## Data changes

**titan-data `templates.json`** — record of substantive edits tied to this audit:

- **Legio Interfector — Creeping Madness:** prose fixes (activated / its / allow / roll a D3 / been resolved / spacing / Orders’ / Emergency Repairs orders).
- **Dominus Battleforce Maniple:** `specialRule` extended with **Noble Sacrifice** (full BS text), labeled alongside **Auspex Bafflers**.
- **Maniple of One:** opening line — **Legio Astraman** → **Legio Atarus** (consistent with `=Atarus=` elsewhere in the rule).
- **All maniples:** dropped **`allegiance`** (was misleading vs tabletop list rules).
- **Warbringer Nemesis (`id: warbringer`):** BS + command terminal **void / reactor(7) / armor bands / location modifiers**; fan **Warbreaker** removed.
- **Chunk B (banners):** Copy/typo fixes — **Auxiliary** spelling, **11"** speed for Moirax/Armiger, **Atrapos** macro rule wording, Asterius double space; see §B.7.
- **Stalker banners:** **`ionShieldSaves`** `[]`; **Construct Shields** rule text **verbatim BS** (Serperos **3+**, Errax/Scintillax **4+**, *remained* as in BS); **Tenebrax** no Construct Shields + Agile + Networked Anima; **`armorRolls`** back to **`—`** pending banner structure model (**§B.5**).
- **Chunk U (upgrades pilot):** **`legioKeys`** added for **Legio Metalica** on **Auditory Barrage** and **Bastion Armor** (**§U.2**).
- **Chunk P (princeps pilot):** **`princepsLegioSelectionEntryId`** on all **32** **`legions[]`** rows (BS mapping); engine-kill **HomeScreen** trait picker uses it (**§P.2**).
- **Chunk U (points/rules spot-check):** **`upgrade:meltaguns`** — **`points`** **15** and **`rules[]`** aligned to BS **Meltagun** (**§U.6.1**).
