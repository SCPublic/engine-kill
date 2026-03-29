# Reusing Titan Command Terminal Styles on Other Screens

The **titan command terminal** is the Unit Edit experience: dark green-on-black panels, bright green text, and a single shared wrapper. These styles and components can be brought over to HomeScreen, BattlegroupListScreen, and UnitCreateScreen for a consistent “terminal” look.

## 1. Shared theme: terminal palette

Terminal colors are now in `src/theme/tokens.ts` under `terminal`:

| Token | Hex / value | Use |
|-------|-------------|-----|
| `terminal.panelBg` | `#0d120e` | Card/panel background (dark green-black) |
| `terminal.textPrimary` | `#9dffb2` | Headings, primary labels |
| `terminal.textPrimaryAlt` | `#9AFCAF` | Same as primary (alternate hex) |
| `terminal.textSecondary` | `#8be39d` | Secondary text, body |
| `terminal.inactiveFill` | `#1e3524` | Inactive pips/slots |
| `terminal.border` | `#00A323` | Section borders, underlines |
| `terminal.rowTint` | `rgba(0, 152, 33, 0.15)` | Highlighted row background |

**Bring-over:** Use `terminal.*` in any screen or component instead of hardcoded hex. Over time, components like `DamageTrack`, `VoidShieldDisplay`, `StatsPanel`, etc. can be refactored to use these tokens.

---

## 2. ScreenWrapper (black + texture)

**Where it’s used:** Only `UnitEditScreen`.

**What it does:** Full-screen black background plus optional texture overlay (`texture-overlay.png`).

**Bring-over:** Wrap other main screens in `ScreenWrapper` so they share the same base:

- **HomeScreen** – wrap the main content in `<ScreenWrapper>` (same as UnitEditScreen).
- **BattlegroupListScreen** – same.
- **UnitCreateScreen** – if shown as a full screen, wrap it too.

Result: same black + texture base everywhere; only the content styling (cards, text) differs until you apply terminal styles.

---

## 3. Header / section styling from UnitEditScreen

UnitEditScreen uses:

- **Header block:**  
  `borderBottomWidth: 2`, `borderBottomColor: '#00A323'`  
  → Use `terminal.border` for the line.
- **Title text:**  
  `color: '#9AFCAF'`, `fontSize: 32`, `fontWeight: 'bold'`, `fontFamily: 'RobotoMono_700Bold'`, `textTransform: 'uppercase'`  
  → Use `terminal.textPrimary` or `terminal.textPrimaryAlt` and the same font/size for “terminal” headings on other screens.
- **Subtitle / secondary:**  
  `color: '#9AFCAF'`, `fontSize: fontSize.md`  
  → Use `terminal.textSecondary` for less prominent text.

**Bring-over:** On HomeScreen and BattlegroupListScreen, add a top section (e.g. battlegroup name, screen title) with the same green title + green bottom border. Use `terminal.*` tokens.

---

## 4. Card / panel styling

UnitEditScreen’s “terminal” panels (and child components like DamageTrack, VoidShieldDisplay, StatsPanel) use:

- Background: `#0d120e` → `terminal.panelBg`
- Primary text: `#9dffb2` / `#9AFCAF` → `terminal.textPrimary` / `terminal.textPrimaryAlt`
- Secondary text: `#8be39d` → `terminal.textSecondary`

**Bring-over:** On HomeScreen, style maniple cards and unit cards with `terminal.panelBg` and `terminal.textPrimary` / `terminal.textSecondary` so list screens match the titan terminal. On BattlegroupListScreen, use the same for battlegroup cards.

---

## 5. Typography

- **Terminal titles:** `RobotoMono_700Bold`, uppercase, large size (e.g. 32), green color.
- **Terminal body:** Same font family optional; green/teal colors from `terminal.*`.

**Bring-over:** Use `fontFamily: 'RobotoMono_700Bold'` (and optionally `RobotoMono_400Regular`) for headings on other screens when you want the terminal look. App already loads these fonts.

---

## 6. Warning / accent colors

UnitEditScreen uses orange for chassis mismatch: `#ff9800`. HomeScreen uses red for delete/validation: `#ff4d4d`, and orange for data warnings: `#ff9800`. These can stay as-is for semantic meaning (warnings vs errors); no need to replace with green.

---

## Summary: minimal steps to “bring over” the green terminal look

1. **Theme:** Use the new `terminal` object from `src/theme/tokens.ts` everywhere you want terminal styling (and gradually replace hardcoded hex in components).
2. **Layout:** Wrap HomeScreen, BattlegroupListScreen, and (if full-screen) UnitCreateScreen with `ScreenWrapper` so they use the same black + texture background.
3. **Headers:** Add a green title + green bottom border (`terminal.border`) for the main heading on each screen, using `terminal.textPrimary` and `RobotoMono_700Bold`.
4. **Cards/panels:** Use `terminal.panelBg` and `terminal.textPrimary` / `terminal.textSecondary` for cards and lists so they match the titan command terminal panels.

Optional follow-up: refactor shared components (e.g. `DamageTrack`, `VoidShieldDisplay`, `StatsPanel`, `WeaponMount`, modals) to use `terminal.*` instead of hardcoded hex so one theme change updates the whole app.
