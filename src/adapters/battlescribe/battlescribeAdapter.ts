import { UnitTemplate, UnitStats } from '../../models/UnitTemplate';
import { titanTemplates as localTitanTemplates } from '../../data/titanTemplates';
import { findAll, parseXml, XmlNode } from './xml';
import type { WeaponTemplate } from '../../models/UnitTemplate';
import { chassisOverridesByTemplateId } from '../../data/chassisOverrides';

export interface BattleScribeSourceConfig {
  /**
   * Base URL for BSData repo raw files (must include trailing slash).
   * Example: "https://raw.githubusercontent.com/BSData/adeptus-titanicus/master/"
   */
  baseUrl: string;
  /** Filenames at the baseUrl to fetch (e.g., "Battlegroup.cat"). */
  files: string[];
}

export interface BattleScribeLoadResult {
  templates: UnitTemplate[];
  warnings: string[];
}

export interface MissingChassisMaxData {
  id: string;
  name: string;
  missing: Array<'voidShieldsMax' | 'plasmaReactorMax' | 'maxHeat'>;
}

export interface BattleScribeAllTitansLoadResult {
  templates: UnitTemplate[];
  warnings: string[];
  missingMaxData: MissingChassisMaxData[];
  legendTitans: Array<{ id: string; name: string }>;
}

export interface BattleScribeWeaponsLoadResult {
  weapons: WeaponTemplate[];
  warnings: string[];
}

const DEFAULT_SOURCE: BattleScribeSourceConfig = {
  baseUrl: 'https://raw.githubusercontent.com/BSData/adeptus-titanicus/master/',
  files: ['Battlegroup.cat', 'Household.cat', 'Adeptus Titanicus 2018.gst'],
};

function inferTitanIdFromName(name: string): UnitTemplate['id'] | null {
  const n = name.toLowerCase();
  if (n.includes('warhound')) return 'warhound';
  if (n.includes('reaver')) return 'reaver';
  if (n.includes('warlord')) return 'warlord';
  if (n.includes('warmaster')) return 'warmaster';
  if (n.includes('warbringer')) return 'warbringer';
  if (n.includes('dire wolf')) return 'dire-wolf';
  return null;
}

function parsePlusNumber(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const m = text.match(/(\d+)/);
  if (!m) return undefined;
  const v = Number(m[1]);
  return Number.isFinite(v) ? v : undefined;
}

function parseNumberLoose(text: string | undefined): number | undefined {
  if (!text) return undefined;
  const t = text.trim();
  if (!t) return undefined;
  // Handles "8", "8.0", "8+", "8 pips", etc.
  const m = t.match(/-?\d+(\.\d+)?/);
  if (!m) return undefined;
  const v = Number(m[0]);
  return Number.isFinite(v) ? v : undefined;
}

function pickFirstDefined<T>(...values: Array<T | undefined | null>): T | undefined {
  for (const v of values) if (v !== undefined && v !== null) return v as T;
  return undefined;
}

function normalizeRangePart(part: string): number | string {
  const t = part.trim();
  if (!t) return '-';
  if (t === '-' || t.toLowerCase() === 'n/a') return '-';
  if (t.toLowerCase() === 't' || t.toLowerCase() === 'template') return 'T';
  // Strip quotes and non-numeric except minus
  const cleaned = t.replace(/"/g, '').trim();
  const m = cleaned.match(/-?\d+/);
  if (!m) return cleaned;
  const n = Number(m[0]);
  return Number.isFinite(n) ? n : cleaned;
}

function parseShortLongFromRangeText(rangeText: string | undefined): {
  shortRange: number | string;
  longRange: number | string;
} {
  if (!rangeText) return { shortRange: '-', longRange: '-' };
  const parts = rangeText.split('/').map((p) => p.trim());
  if (parts.length >= 2) {
    return { shortRange: normalizeRangePart(parts[0]!), longRange: normalizeRangePart(parts[1]!) };
  }
  // Single range; treat as long and leave short as '-'
  return { shortRange: '-', longRange: normalizeRangePart(parts[0]!) };
}

function splitTraits(text: string | undefined): string[] {
  if (!text) return [];
  // Traits often come comma-separated; preserve braces like Blast{3"}.
  return text
    .split(/,|•/g)
    .map((t) => t.trim())
    .filter(Boolean);
}

function sanitizeBattleScribeName(name: string): string {
  // BSData sometimes embeds internal tags in names (e.g. "+=audaxis=") to mark legion-specific items.
  // We don't model legions yet, so we strip these from display names.
  return (
    name
      // remove "+=...=" tags
      .replace(/\s*\+=.*?=\s*/g, ' ')
      // remove standalone "=...=" tags if present
      .replace(/\s*=\s*[^=]+?\s*=\s*/g, ' ')
      // collapse whitespace
      .replace(/\s+/g, ' ')
      .trim()
  );
}

function makeStableTitanTemplateId(se: XmlNode): string {
  const name = se.attributes.name?.trim() || '';
  const inferred = inferTitanIdFromName(name);
  if (inferred) return inferred;
  const bsId = se.attributes.id;
  if (bsId) return `bs:${bsId}`;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug ? `bsname:${slug}` : `bs:unknown`;
}

function isLikelyTitanChassis(se: XmlNode, chars: Record<string, string>): boolean {
  // Heuristic: titans generally have at least some of these stats.
  const name = (se.attributes.name || '').toLowerCase();
  const type = (se.attributes.type || '').toLowerCase();
  if (type && type !== 'unit' && type !== 'model') return false;
  // Keep titans only for now (exclude common non-titan chassis/unit types).
  if (name.includes('knight')) return false;
  if (name.includes('banner')) return false;
  if (name.includes('stratagem')) return false;
  if (name.includes('upgrade')) return false;
  if (name.includes('wargear')) return false;
  // Common non-chassis entries that can still be typed as "unit" in BSData
  if (name.includes('infantry')) return false;
  if (name.includes('portion')) return false;
  if (name.includes('titanic decapitation')) return false;
  if (name.includes('titan hunter')) return false;
  if (name.includes('titan guard')) return false;

  // Require at least one very titan-like characteristic to avoid pulling in banners by mistake.
  // NOTE: servitor clades alone isn't enough (some non-titans can have it).
  const hasTitanLikeMax =
    'Void Shields' in chars ||
    'Void Shield' in chars ||
    'Void Shield Generators' in chars ||
    'Plasma Reactor' in chars ||
    'Reactor Track' in chars ||
    'Reactor Pips' in chars ||
    'Reactor Max' in chars;

  if (!name.includes('titan') && !name.includes('warhound') && !name.includes('reaver') && !name.includes('warlord') && !name.includes('warmaster')) {
    // allow non-"Titan" names but require strong stat presence
    const hasCore =
      'Command' in chars ||
      'Ballistic Skill' in chars ||
      'Weapon Skill' in chars ||
      'Void Shields' in chars ||
      'Plasma Reactor' in chars;
    return hasCore && hasTitanLikeMax;
  }
  return true;
}

function getCategoryLikeNames(se: XmlNode): string[] {
  const names: string[] = [];
  const nodes = findAll(se, (n) => n.name === 'categoryLink' || n.name === 'category');
  for (const n of nodes) {
    const nm = n.attributes.name?.trim();
    if (nm) names.push(nm);
  }
  return names;
}

function isTitanOfLegend(se: XmlNode): boolean {
  const name = (se.attributes.name || '').toLowerCase();
  if (name.includes('titan of legend') || name.includes('titans of legend')) return true;
  const categories = getCategoryLikeNames(se).map((c) => c.toLowerCase());
  return categories.some((c) => c.includes('titan of legend') || c.includes('titans of legend'));
}

function defaultPlaceholderDamage(max: number) {
  return {
    max,
    armor: { directHit: 0, devastatingHit: 0, crit: 0 },
    hitTable: { directHit: '—', devastatingHit: '—', criticalHit: '—' },
    modifiers: Array(max).fill(null) as (number | null)[],
  };
}

function defaultPlaceholderTitanTemplate(id: string, name: string): UnitTemplate {
  return {
    id,
    name,
    unitType: 'titan',
    defaultStats: {
      voidShields: { max: 0 },
      voidShieldSaves: [],
      maxHeat: 0,
      plasmaReactorMax: 5,
      damage: {
        head: defaultPlaceholderDamage(5),
        body: defaultPlaceholderDamage(6),
        legs: defaultPlaceholderDamage(6),
      },
      hasCarapaceWeapon: false,
      stats: {
        command: 0,
        ballisticSkill: 0,
        speed: '',
        weaponSkill: 0,
        manoeuvre: '',
        servitorClades: 0,
      },
    },
    availableWeapons: [],
  };
}

function inferMountTypeFromContextNames(contextNames: string[]): 'arm' | 'carapace' {
  const ctx = contextNames.join(' ').toLowerCase();
  if (ctx.includes('carapace')) return 'carapace';
  return 'arm';
}

function isWeaponishContext(contextNames: string[]): boolean {
  const ctx = contextNames.join(' ').toLowerCase();
  return (
    ctx.includes('weapon') ||
    ctx.includes('arm') ||
    ctx.includes('carapace') ||
    ctx.includes('left') ||
    ctx.includes('right')
  );
}

function collectEntryLinks(root: XmlNode): Array<{ targetId: string; mountType: 'arm' | 'carapace' }> {
  const out: Array<{ targetId: string; mountType: 'arm' | 'carapace' }> = [];

  const walk = (node: XmlNode, contextNames: string[]) => {
    const nextContext =
      node.name === 'selectionEntryGroup' || node.name === 'selectionEntry'
        ? [...contextNames, node.attributes.name || '']
        : contextNames;

    if (node.name === 'entryLink') {
      const targetId = node.attributes.targetId;
      if (targetId && isWeaponishContext(nextContext)) {
        out.push({
          targetId,
          mountType: inferMountTypeFromContextNames(nextContext),
        });
      }
    }

    node.children.forEach((c) => walk(c, nextContext));
  };

  walk(root, [root.attributes.name || '']);
  return out;
}

function selectionEntryToWeaponTemplate(
  se: XmlNode,
  mountType: 'arm' | 'carapace'
): WeaponTemplate | null {
  const rawName = se.attributes.name?.trim();
  if (!rawName) return null;
  const displayName = sanitizeBattleScribeName(rawName);
  const bsId = se.attributes.id;

  // Stable IDs for our known Warhound weapons; otherwise BSData-derived
  const knownLocalId = weaponIdForWarhoundName(rawName);
  const id = knownLocalId ?? (bsId ? `bs:${bsId}` : `bs:${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);

  const points = parsePointsFromSelectionEntry(se) ?? 0;
  const chars = getWeaponProfileCharacteristics(se);

  const rangeText =
    chars['Range'] ??
    chars['Rng'] ??
    chars['RNG'] ??
    chars['Short/Long'] ??
    chars['Short / Long'] ??
    '';
  const { shortRange, longRange } = parseShortLongFromRangeText(rangeText);

  const accShort =
    chars['Acc (Short)'] ??
    chars['Accuracy (Short)'] ??
    chars['Short Acc'] ??
    chars['Acc Short'] ??
    chars['ACC Short'] ??
    chars['Acc'] ??
    '-';
  const accLong =
    chars['Acc (Long)'] ??
    chars['Accuracy (Long)'] ??
    chars['Long Acc'] ??
    chars['Acc Long'] ??
    chars['ACC Long'] ??
    chars['Acc'] ??
    '-';

  const dice = parsePlusNumber(chars['Dice'] ?? chars['D'] ?? chars['Shots']) ?? 0;
  const strength = parsePlusNumber(chars['Strength'] ?? chars['Str'] ?? chars['S']) ?? 0;

  const traits = splitTraits(chars['Traits'] ?? chars['Trait'] ?? chars['Special Rules'] ?? chars['Special']);
  const specialRules: string[] = [];

  return {
    id,
    name: displayName,
    points,
    shortRange,
    longRange,
    accuracyShort: accShort,
    accuracyLong: accLong,
    dice,
    strength,
    traits,
    specialRules,
    mountType,
  };
}

function weaponIdForWarhoundName(name: string): string | null {
  const n = name.toLowerCase();
  if (n.includes('plasma blastgun')) return 'plasma-blastgun';
  if (n.includes('vulcan') && n.includes('mega') && n.includes('bolter')) return 'vulcan-mega-bolter';
  if (n.includes('turbo') && n.includes('laser') && n.includes('destructor')) return 'turbo-laser-destructor';
  if (n.includes('inferno')) return 'inferno-gun';
  return null;
}

function parsePointsFromSelectionEntry(selectionEntry: XmlNode): number | undefined {
  // BattleScribe typically uses: <costs><cost name="pts" value="385.0" .../></costs>
  const costsNodes = selectionEntry.children.filter((c) => c.name === 'costs');
  for (const costs of costsNodes) {
    for (const cost of costs.children) {
      if (cost.name !== 'cost') continue;
      const name = (cost.attributes.name || '').toLowerCase();
      if (name && name !== 'pts' && name !== 'points') continue;
      const raw = cost.attributes.value;
      const num = raw !== undefined ? Number(raw) : NaN;
      if (Number.isFinite(num)) return num;
    }
  }
  return undefined;
}

function getCharacteristicMap(selectionEntry: XmlNode): Record<string, string> {
  // Find characteristics for any profile under this selectionEntry.
  // We keep a flat map by characteristic name; later profiles can overwrite earlier ones.
  const out: Record<string, string> = {};

  const profileNodes = findAll(selectionEntry, (n) => n.name === 'profile');
  for (const profile of profileNodes) {
    const characteristics = profile.children.find((c) => c.name === 'characteristics');
    if (!characteristics) continue;
    for (const characteristic of characteristics.children) {
      if (characteristic.name !== 'characteristic') continue;
      const cname = characteristic.attributes.name?.trim();
      const cval = characteristic.text?.trim();
      if (cname && cval) out[cname] = cval;
    }
  }

  return out;
}

function extractChassisMaxValues(chars: Record<string, string>): {
  voidShieldsMax?: number;
  plasmaReactorMax?: number;
  maxHeat?: number;
} {
  // BSData naming varies; we try a handful of common keys.
  const voidShieldsMax = pickFirstDefined(
    parseNumberLoose(chars['Void Shields']),
    parseNumberLoose(chars['Void Shield']),
    parseNumberLoose(chars['Shields']),
    parseNumberLoose(chars['VSG']),
    parseNumberLoose(chars['Void Shield Generators'])
  );

  const plasmaReactorMax = pickFirstDefined(
    parseNumberLoose(chars['Plasma Reactor']),
    parseNumberLoose(chars['Reactor']),
    parseNumberLoose(chars['Reactor Track']),
    parseNumberLoose(chars['Reactor Pips']),
    parseNumberLoose(chars['Reactor Max'])
  );

  let maxHeat = pickFirstDefined(
    parseNumberLoose(chars['Max Heat']),
    parseNumberLoose(chars['Heat']),
    parseNumberLoose(chars['Reactor Heat'])
  );

  // In our app model, max heat is the number of plasma reactor pips unless explicitly provided.
  if (maxHeat === undefined && plasmaReactorMax !== undefined) {
    maxHeat = plasmaReactorMax;
  }

  return { voidShieldsMax, plasmaReactorMax, maxHeat };
}

function getWeaponProfileCharacteristics(selectionEntry: XmlNode): Record<string, string> {
  // Prefer profiles whose typeName includes 'weapon'
  const out: Record<string, string> = {};
  const profileNodes = findAll(selectionEntry, (n) => n.name === 'profile');
  const weaponProfiles = profileNodes.filter((p) =>
    (p.attributes.typeName || p.attributes.type || '').toLowerCase().includes('weapon')
  );
  const profilesToUse = weaponProfiles.length ? weaponProfiles : profileNodes;

  for (const profile of profilesToUse) {
    const characteristics = profile.children.find((c) => c.name === 'characteristics');
    if (!characteristics) continue;
    for (const characteristic of characteristics.children) {
      if (characteristic.name !== 'characteristic') continue;
      const cname = characteristic.attributes.name?.trim();
      const cval = characteristic.text?.trim();
      if (cname && cval) out[cname] = cval;
    }
    // If we found a weapon-typed profile, stop after first to avoid mixing multiple profiles.
    if (weaponProfiles.length) break;
  }

  return out;
}

function applyStatsOverlay(base: UnitStats, chars: Record<string, string>): UnitStats {
  // Note: characteristic naming varies slightly across repos/versions.
  const command = parsePlusNumber(chars['Command'] ?? chars['Cmd'] ?? chars['C']);
  const bs = parsePlusNumber(chars['Ballistic Skill'] ?? chars['BS']);
  const ws = parsePlusNumber(chars['Weapon Skill'] ?? chars['WS']);
  const speed = chars['Speed'] ?? chars['Move'] ?? chars['Movement'] ?? chars['M'];
  const manoeuvre = chars['Manoeuvre'] ?? chars['Manoeuver'] ?? chars['Manoeuvre/Turn'] ?? chars['Man'];
  const servitorClades =
    parsePlusNumber(chars['Servitor Clades'] ?? chars['Servitor Clade'] ?? chars['SC']);

  return {
    ...base,
    ...(command !== undefined ? { command } : {}),
    ...(bs !== undefined ? { ballisticSkill: bs } : {}),
    ...(ws !== undefined ? { weaponSkill: ws } : {}),
    ...(speed !== undefined ? { speed } : {}),
    ...(manoeuvre !== undefined ? { manoeuvre } : {}),
    ...(servitorClades !== undefined ? { servitorClades } : {}),
  };
}

type TitanOverlay = {
  name?: string;
  basePoints?: number;
  characteristics: Record<string, string>;
  voidShieldsMax?: number;
  plasmaReactorMax?: number;
  maxHeat?: number;
};

function mergeIntoLocalTemplates(overlays: Map<UnitTemplate['id'], TitanOverlay>): UnitTemplate[] {
  return localTitanTemplates.map((tpl) => {
    const overlay = overlays.get(tpl.id);
    if (!overlay) return tpl;

    return {
      ...tpl,
      ...(overlay.name ? { name: overlay.name } : {}),
      ...(overlay.basePoints !== undefined ? { basePoints: overlay.basePoints } : {}),
      defaultStats: {
        ...tpl.defaultStats,
        voidShields: {
          max:
            overlay.voidShieldsMax !== undefined
              ? overlay.voidShieldsMax
              : tpl.defaultStats.voidShields.max,
        },
        ...(overlay.plasmaReactorMax !== undefined
          ? { plasmaReactorMax: overlay.plasmaReactorMax }
          : {}),
        ...(overlay.maxHeat !== undefined ? { maxHeat: overlay.maxHeat } : {}),
        stats: applyStatsOverlay(tpl.defaultStats.stats, overlay.characteristics),
      },
    };
  });
}

/**
 * Fetches BattleScribe `.cat/.gst` files from BSData and overlays any parsable values onto
 * our existing `titanTemplates` (keeps damage tracks/weapons stable for now).
 */
export async function loadTitanTemplatesFromBattleScribe(
  config: Partial<BattleScribeSourceConfig> = {}
): Promise<BattleScribeLoadResult> {
  const source: BattleScribeSourceConfig = { ...DEFAULT_SOURCE, ...config };
  const warnings: string[] = [];

  const xmlStrings: string[] = [];
  for (const file of source.files) {
    const url = encodeURI(`${source.baseUrl}${file}`);
    const res = await fetch(url);
    if (!res.ok) {
      warnings.push(`Failed to fetch BattleScribe file: ${file} (${res.status})`);
      continue;
    }
    xmlStrings.push(await res.text());
  }

  const overlays = new Map<UnitTemplate['id'], TitanOverlay>();

  for (const xml of xmlStrings) {
    const doc = parseXml(xml);
    const selectionEntries = findAll(doc, (n) => n.name === 'selectionEntry');

    for (const se of selectionEntries) {
      const name = se.attributes.name?.trim();
      if (!name) continue;

      const titanId = inferTitanIdFromName(name);
      if (!titanId) continue;

      const chars = getCharacteristicMap(se);
      const points = parsePointsFromSelectionEntry(se);
      const maxValues = extractChassisMaxValues(chars);

      const existing = overlays.get(titanId);
      const mergedChars = existing ? { ...existing.characteristics, ...chars } : chars;
      overlays.set(titanId, {
        name,
        ...(points !== undefined ? { basePoints: points } : {}),
        characteristics: mergedChars,
        ...(maxValues.voidShieldsMax !== undefined ? { voidShieldsMax: maxValues.voidShieldsMax } : {}),
        ...(maxValues.plasmaReactorMax !== undefined ? { plasmaReactorMax: maxValues.plasmaReactorMax } : {}),
        ...(maxValues.maxHeat !== undefined ? { maxHeat: maxValues.maxHeat } : {}),
      });
    }
  }

  const templates = mergeIntoLocalTemplates(overlays);

  // If we didn’t find any entries, surface a useful warning.
  if (overlays.size === 0) {
    warnings.push(
      'No titan selection entries were recognized in fetched BattleScribe files (expected names containing: warhound/reaver/warlord/warmaster).'
    );
  }

  return { templates, warnings };
}

/**
 * Loads all Titan chassis we can identify from BSData and maps them into `UnitTemplate`.
 * - For known core templates (warhound/reaver/warlord/warmaster) we keep our local damage/crit tracks and overlay BSData values.
 * - For unknown titans, we create a placeholder template (enough for the app to function) and fill what we can from BSData.
 *
 * Also returns a report of which chassis are missing void/reactor/maxHeat values in BSData.
 */
export async function loadAllTitanTemplatesFromBattleScribe(
  config: Partial<BattleScribeSourceConfig> = {}
): Promise<BattleScribeAllTitansLoadResult> {
  const source: BattleScribeSourceConfig = { ...DEFAULT_SOURCE, ...config };
  const warnings: string[] = [];

  const xmlStrings: string[] = [];
  for (const file of source.files) {
    const url = encodeURI(`${source.baseUrl}${file}`);
    const res = await fetch(url);
    if (!res.ok) {
      warnings.push(`Failed to fetch BattleScribe file: ${file} (${res.status})`);
      continue;
    }
    xmlStrings.push(await res.text());
  }

  const chassisById = new Map<string, { id: string; name: string; points?: number; chars: Record<string, string>; max: ReturnType<typeof extractChassisMaxValues>; weapons: WeaponTemplate[] }>();

  for (const xml of xmlStrings) {
    const doc = parseXml(xml);
    const selectionEntries = findAll(doc, (n) => n.name === 'selectionEntry');
    const byId = new Map<string, XmlNode>();
    selectionEntries.forEach((se) => {
      const id = se.attributes.id;
      if (id) byId.set(id, se);
    });

    for (const se of selectionEntries) {
      const rawName = se.attributes.name?.trim();
      if (!rawName) continue;
      const displayName = sanitizeBattleScribeName(rawName);

      const chars = getCharacteristicMap(se);
      if (!isLikelyTitanChassis(se, chars)) continue;

      const id = makeStableTitanTemplateId(se);
      const points = parsePointsFromSelectionEntry(se);
      const max = extractChassisMaxValues(chars);

      // Resolve weapon links
      const links = collectEntryLinks(se);
      const weapons: WeaponTemplate[] = [];
      for (const link of links) {
        const target = byId.get(link.targetId);
        if (!target) continue;
        const wt = selectionEntryToWeaponTemplate(target, link.mountType);
        if (wt) weapons.push(wt);
      }

      const existing = chassisById.get(id);
      if (!existing) {
        chassisById.set(id, { id, name: displayName, points, chars, max, weapons });
      } else {
        // Merge: keep best-known values
        chassisById.set(id, {
          id,
          name: existing.name || displayName,
          points: existing.points ?? points,
          chars: { ...existing.chars, ...chars },
          max: {
            voidShieldsMax: existing.max.voidShieldsMax ?? max.voidShieldsMax,
            plasmaReactorMax: existing.max.plasmaReactorMax ?? max.plasmaReactorMax,
            maxHeat: existing.max.maxHeat ?? max.maxHeat,
          },
          weapons: existing.weapons.length ? existing.weapons : weapons,
        });
      }
    }
  }

  // Build final templates: merge known local ones first (stable IDs), then append the rest.
  const localById = new Map(localTitanTemplates.map((t) => [t.id, t] as const));

  const templates: UnitTemplate[] = [];
  const missingMaxData: MissingChassisMaxData[] = [];
  const legendTitans: Array<{ id: string; name: string }> = [];

  const sorted = Array.from(chassisById.values()).sort((a, b) => a.name.localeCompare(b.name));
  for (const c of sorted) {
    const local = localById.get(c.id);

    const override = chassisOverridesByTemplateId[c.id];
    const effectiveVoidShieldsMax = c.max.voidShieldsMax ?? override?.voidShieldsMax;
    const effectivePlasmaReactorMax = c.max.plasmaReactorMax ?? override?.plasmaReactorMax;
    const effectiveMaxHeat = c.max.maxHeat ?? (effectivePlasmaReactorMax !== undefined ? effectivePlasmaReactorMax : undefined);
    const effectiveVoidShieldSaves = override?.voidShieldSaves;

    const missing: MissingChassisMaxData['missing'] = [];
    if (effectiveVoidShieldsMax === undefined) missing.push('voidShieldsMax');
    if (effectivePlasmaReactorMax === undefined) missing.push('plasmaReactorMax');
    // maxHeat is derived from plasmaReactorMax in our model, so only mark missing if both are missing.
    if (effectiveMaxHeat === undefined && effectivePlasmaReactorMax === undefined) missing.push('maxHeat');
    if (missing.length) missingMaxData.push({ id: c.id, name: c.name, missing });

    if (local) {
      // Overlay BSData onto local canonical template
      const overWeapons = c.weapons.length
        ? (() => {
            const base = local.availableWeapons || [];
            const byWeaponId = new Map(c.weapons.map((w) => [w.id, w] as const));
            const merged = base.map((w) => (byWeaponId.has(w.id) ? { ...w, ...byWeaponId.get(w.id)! } : w));
            const baseIds = new Set(base.map((w) => w.id));
            c.weapons.forEach((w) => {
              if (!baseIds.has(w.id)) merged.push(w);
            });
            return merged;
          })()
        : local.availableWeapons;

      templates.push({
        ...local,
        name: c.name || local.name,
        ...(c.points !== undefined ? { basePoints: c.points } : {}),
        defaultStats: {
          ...local.defaultStats,
          ...(effectiveVoidShieldsMax !== undefined ? { voidShields: { max: effectiveVoidShieldsMax } } : {}),
          ...(effectivePlasmaReactorMax !== undefined ? { plasmaReactorMax: effectivePlasmaReactorMax } : {}),
          ...(effectiveMaxHeat !== undefined ? { maxHeat: effectiveMaxHeat } : {}),
          ...(effectiveVoidShieldSaves ? { voidShieldSaves: effectiveVoidShieldSaves } : {}),
          stats: applyStatsOverlay(local.defaultStats.stats, c.chars),
        },
        availableWeapons: overWeapons,
      });
    } else {
      const base = defaultPlaceholderTitanTemplate(c.id, c.name);
      templates.push({
        ...base,
        ...(c.points !== undefined ? { basePoints: c.points } : {}),
        defaultStats: {
          ...base.defaultStats,
          voidShields: { max: effectiveVoidShieldsMax ?? base.defaultStats.voidShields.max },
          plasmaReactorMax: effectivePlasmaReactorMax ?? base.defaultStats.plasmaReactorMax,
          maxHeat: effectiveMaxHeat ?? base.defaultStats.maxHeat,
          ...(effectiveVoidShieldSaves ? { voidShieldSaves: effectiveVoidShieldSaves } : {}),
          stats: applyStatsOverlay(base.defaultStats.stats, c.chars),
        },
        availableWeapons: c.weapons,
      });
    }
  }

  // Ensure local core titans exist even if BSData fetch fails to include them for some reason.
  if (templates.length === 0) {
    warnings.push('No titan chassis were recognized in fetched BattleScribe files. Falling back to local titan templates only.');
    return { templates: localTitanTemplates, warnings, missingMaxData: [], legendTitans: [] };
  }

  // Deduplicate by id while preserving order
  const seen = new Set<string>();
  const deduped = templates.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });

  // Second pass: compute Titans of Legend using the final template list + best-effort heuristics.
  // We do this by re-scanning BSData in the same fetch pass (above) would be ideal, but we keep it
  // light-weight: name/category-based only.
  //
  // Note: `chassisById` only contains entries we classified as titan chassis; good enough for now.
  // We'll refine with explicit categories/conditions once we add legion/book concepts.
  const legendSet = new Set<string>();
  for (const xml of xmlStrings) {
    const doc = parseXml(xml);
    const selectionEntries = findAll(doc, (n) => n.name === 'selectionEntry');
    for (const se of selectionEntries) {
      const chars = getCharacteristicMap(se);
      if (!isLikelyTitanChassis(se, chars)) continue;
      if (!isTitanOfLegend(se)) continue;
      const id = makeStableTitanTemplateId(se);
      const nm = sanitizeBattleScribeName(se.attributes.name?.trim() || id);
      if (legendSet.has(id)) continue;
      legendSet.add(id);
      legendTitans.push({ id, name: nm });
    }
  }

  return { templates: deduped, warnings, missingMaxData, legendTitans };
}

/**
 * Minimal “small slice” integration: pull Warhound weapon card data (points/range/acc/dice/str/traits)
 * from BSData and map into our `WeaponTemplate` shape.
 *
 * If parsing fails or data is missing, returns an empty `weapons` list with warnings,
 * so callers can fall back to local templates.
 */
export async function loadWarhoundWeaponsFromBattleScribe(
  config: Partial<BattleScribeSourceConfig> = {}
): Promise<BattleScribeWeaponsLoadResult> {
  const source: BattleScribeSourceConfig = { ...DEFAULT_SOURCE, ...config };
  const warnings: string[] = [];

  const xmlStrings: string[] = [];
  for (const file of source.files) {
    const url = encodeURI(`${source.baseUrl}${file}`);
    const res = await fetch(url);
    if (!res.ok) {
      warnings.push(`Failed to fetch BattleScribe file: ${file} (${res.status})`);
      continue;
    }
    xmlStrings.push(await res.text());
  }

  type LinkedWeaponRef = { targetId: string; linkName?: string; mountType: 'arm' | 'carapace' };

  const foundById = new Map<string, WeaponTemplate>();

  const inferMountTypeFromContext = (contextNames: string[]): 'arm' | 'carapace' => {
    const ctx = contextNames.join(' ').toLowerCase();
    if (ctx.includes('carapace')) return 'carapace';
    return 'arm';
  };

  const collectWarhoundWeaponLinks = (warhoundEntry: XmlNode): LinkedWeaponRef[] => {
    const out: LinkedWeaponRef[] = [];

    const walk = (node: XmlNode, contextNames: string[]) => {
      const nextContext =
        node.name === 'selectionEntryGroup' || node.name === 'selectionEntry'
          ? [...contextNames, node.attributes.name || '']
          : contextNames;

      if (node.name === 'entryLink') {
        const targetId = node.attributes.targetId;
        if (targetId) {
          out.push({
            targetId,
            linkName: node.attributes.name,
            mountType: inferMountTypeFromContext(nextContext),
          });
        }
      }

      node.children.forEach((c) => walk(c, nextContext));
    };

    walk(warhoundEntry, [warhoundEntry.attributes.name || '']);
    return out;
  };

  const upsertWeaponFromSelectionEntry = (se: XmlNode, mountType: 'arm' | 'carapace') => {
    const rawName = se.attributes.name?.trim();
    if (!rawName) return;
    const displayName = sanitizeBattleScribeName(rawName);
    const bsId = se.attributes.id;

    // Stable IDs:
    // - If this matches one of our known local Warhound weapons, use the local id (keeps persistence/backfill stable).
    // - Otherwise, use a stable BSData-derived id.
    const knownLocalId = weaponIdForWarhoundName(rawName);
    const id = knownLocalId ?? (bsId ? `bs:${bsId}` : `bs:${rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`);

    const points = parsePointsFromSelectionEntry(se) ?? 0;
    const chars = getWeaponProfileCharacteristics(se);

    // Range
    const rangeText =
      chars['Range'] ??
      chars['Rng'] ??
      chars['RNG'] ??
      chars['Short/Long'] ??
      chars['Short / Long'] ??
      '';
    const { shortRange, longRange } = parseShortLongFromRangeText(rangeText);

    // Accuracy (varies; keep strings for +1/-1/-)
    const accShort =
      chars['Acc (Short)'] ??
      chars['Accuracy (Short)'] ??
      chars['Short Acc'] ??
      chars['Acc Short'] ??
      chars['ACC Short'] ??
      chars['Acc'] ??
      '-';
    const accLong =
      chars['Acc (Long)'] ??
      chars['Accuracy (Long)'] ??
      chars['Long Acc'] ??
      chars['Acc Long'] ??
      chars['ACC Long'] ??
      chars['Acc'] ??
      '-';

    const dice = parsePlusNumber(chars['Dice'] ?? chars['D'] ?? chars['Shots']) ?? 0;
    const strength = parsePlusNumber(chars['Strength'] ?? chars['Str'] ?? chars['S']) ?? 0;

    const traits = splitTraits(chars['Traits'] ?? chars['Trait'] ?? chars['Special Rules'] ?? chars['Special']);
    const specialRules: string[] = [];

    // If we already captured this weapon from another file, keep the first one unless this one is "better" (more info).
    const existing = foundById.get(id);
    const score = (w: WeaponTemplate) =>
      Number(!!w.points) + Number(w.dice !== 0) + Number(w.strength !== 0) + Number(w.traits.length > 0);

    const next: WeaponTemplate = {
      id,
      name: displayName,
      points,
      shortRange,
      longRange,
      accuracyShort: accShort,
      accuracyLong: accLong,
      dice,
      strength,
      traits,
      specialRules,
      mountType,
    };

    if (!existing || score(next) > score(existing)) foundById.set(id, next);
  };

  for (const xml of xmlStrings) {
    const doc = parseXml(xml);
    const selectionEntries = findAll(doc, (n) => n.name === 'selectionEntry');

    // Build lookup map for resolving entryLink.targetId -> selectionEntry
    const byId = new Map<string, XmlNode>();
    selectionEntries.forEach((se) => {
      const id = se.attributes.id;
      if (id) byId.set(id, se);
    });

    // Find Warhound unit entries in this document.
    const warhoundEntries = selectionEntries.filter((se) => {
      const name = (se.attributes.name || '').toLowerCase();
      const type = (se.attributes.type || '').toLowerCase();
      return name.includes('warhound') && (type === 'unit' || type === 'model' || type === '');
    });

    for (const warhound of warhoundEntries) {
      const links = collectWarhoundWeaponLinks(warhound);

      for (const link of links) {
        const target = byId.get(link.targetId);
        if (!target) continue;
        upsertWeaponFromSelectionEntry(target, link.mountType);
      }
    }
  }

  const weapons = Array.from(foundById.values());
  if (weapons.length === 0) {
    warnings.push(
      'No Warhound-linked weapon entries were resolved from BSData (falling back to local weapons).'
    );
  }

  return { weapons, warnings };
}


