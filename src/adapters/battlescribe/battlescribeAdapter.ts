import { UnitTemplate, UnitStats } from '../../models/UnitTemplate';
import { titanTemplates as localTitanTemplates } from '../../data/titanTemplates';
import { childText, findAll, parseXml, XmlNode } from './xml';
import type { WeaponTemplate } from '../../models/UnitTemplate';
import { chassisOverridesByTemplateId } from '../../data/chassisOverrides';
import type { ManipleTemplate } from '../../models/ManipleTemplate';
import type { LegionTemplate } from '../../models/LegionTemplate';
import type { UpgradeTemplate } from '../../models/UpgradeTemplate';
import type { PrincepsTraitTemplate } from '../../models/PrincepsTraitTemplate';

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

export interface BattleScribeManiplesLoadResult {
  maniples: ManipleTemplate[];
  warnings: string[];
}

export interface BattleScribeLegionsLoadResult {
  legions: LegionTemplate[];
  warnings: string[];
}

export interface BattleScribeUpgradesLoadResult {
  upgrades: UpgradeTemplate[];
  warnings: string[];
}

export interface BattleScribePrincepsTraitsLoadResult {
  traits: PrincepsTraitTemplate[];
  warnings: string[];
}

const LOYALIST_LEGIOS_PUBLICATION_ID = '3401-191e-1333-8a1d';
const TRAITOR_LEGIOS_PUBLICATION_ID = 'bf8b-27d7-039e-5df9';

function inferLegionAllegianceFromPublicationId(publicationId?: string | null): LegionTemplate['allegiance'] {
  const pid = (publicationId ?? '').trim();
  if (pid === LOYALIST_LEGIOS_PUBLICATION_ID) return 'loyalist';
  if (pid === TRAITOR_LEGIOS_PUBLICATION_ID) return 'traitor';
  return 'unknown';
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
      // remove bracketed suffix tags like "[WH]", "[RVR]" etc (often indicates chassis)
      .replace(/\s*\[[^[\]]+\]\s*/g, ' ')
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

  // BSData varies: some weapons provide a combined "Short/Long" range text, others provide
  // explicit "Short Range" / "Long Range" characteristics.
  const shortRangeExplicit = chars['Short Range'] ?? chars['Short range'];
  const longRangeExplicit = chars['Long Range'] ?? chars['Long range'];
  const rangeText =
    chars['Range'] ??
    chars['Rng'] ??
    chars['RNG'] ??
    chars['Short/Long'] ??
    chars['Short / Long'] ??
    '';
  const { shortRange, longRange } =
    shortRangeExplicit || longRangeExplicit
      ? {
          shortRange: shortRangeExplicit ? normalizeRangePart(shortRangeExplicit) : '-',
          longRange: longRangeExplicit ? normalizeRangePart(longRangeExplicit) : '-',
        }
      : parseShortLongFromRangeText(rangeText);

  const accShort =
    chars['Acc (Short)'] ??
    chars['Accuracy (Short)'] ??
    chars['Short Accuracy'] ??
    chars['Short Acc'] ??
    chars['Acc Short'] ??
    chars['ACC Short'] ??
    chars['Acc'] ??
    '-';
  const accLong =
    chars['Acc (Long)'] ??
    chars['Accuracy (Long)'] ??
    chars['Long Accuracy'] ??
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
      // BSData sometimes has leading spaces: name=" Points" / " Stratagem Points"
      const name = String(cost.attributes.name ?? '').trim().toLowerCase();
      // We want normal points only; ignore stratagem points.
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

function parseConstraints(node: XmlNode): { min?: number; max?: number } {
  // BattleScribe typically represents numeric constraints as:
  // <constraints>
  //   <constraint type="min" value="1.0" .../>
  //   <constraint type="max" value="3.0" .../>
  // </constraints>
  const out: { min?: number; max?: number } = {};
  const constraintsNodes = node.children.filter((c) => c.name === 'constraints');
  for (const constraints of constraintsNodes) {
    for (const c of constraints.children) {
      if (c.name !== 'constraint') continue;
      const type = (c.attributes.type || '').toLowerCase();
      const raw = c.attributes.value;
      const v = raw !== undefined ? Number(raw) : NaN;
      if (!Number.isFinite(v)) continue;
      if (type === 'min') out.min = out.min ?? v;
      if (type === 'max') out.max = out.max ?? v;
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
  const manoeuvre =
    chars['Manoeuvre'] ??
    chars['Manoeuver'] ??
    chars['Manuever'] ?? // BSData AT uses this spelling in some places
    chars['Manoeuvre/Turn'] ??
    chars['Man'];
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

function overlayWeaponUiMetadata(
  remoteWeapons: WeaponTemplate[],
  localWeapons: WeaponTemplate[] | undefined
): WeaponTemplate[] {
  if (!localWeapons || localWeapons.length === 0) return remoteWeapons;
  const localByKey = new Map<string, WeaponTemplate>();
  for (const lw of localWeapons) {
    const key = `${(lw.name || '').trim().toLowerCase()}|${lw.mountType}`;
    if (!localByKey.has(key)) localByKey.set(key, lw);
  }

  return remoteWeapons.map((rw) => {
    const key = `${(rw.name || '').trim().toLowerCase()}|${rw.mountType}`;
    const lw = localByKey.get(key);
    if (!lw) return rw;
    return {
      ...rw,
      ...(lw.disabledRollLines ? { disabledRollLines: lw.disabledRollLines } : {}),
      ...(lw.repairRoll ? { repairRoll: lw.repairRoll } : {}),
    };
  });
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
      const weaponById = new Map<string, WeaponTemplate>();

      const weaponScore = (w: WeaponTemplate) =>
        Number(!!w.points) + Number(w.dice !== 0) + Number(w.strength !== 0) + Number(w.traits.length > 0);
      for (const link of links) {
        const target = byId.get(link.targetId);
        if (!target) continue;
        const wt = selectionEntryToWeaponTemplate(target, link.mountType);
        if (!wt) continue;
        const existing = weaponById.get(wt.id);
        if (!existing || weaponScore(wt) > weaponScore(existing)) weaponById.set(wt.id, wt);
      }
      weaponById.forEach((w) => weapons.push(w));

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
      // BattleScribe is the source of truth for weapon lists + weapon stats.
      // We only overlay any local UI-only metadata (disabled roll overlay, repair roll) by name+mount.
      const overWeapons = c.weapons.length ? overlayWeaponUiMetadata(c.weapons, local.availableWeapons) : local.availableWeapons;
      const hasCarapaceWeapon = c.weapons.some((w) => w.mountType === 'carapace') || local.defaultStats.hasCarapaceWeapon;

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
          hasCarapaceWeapon,
          stats: applyStatsOverlay(local.defaultStats.stats, c.chars),
        },
        availableWeapons: overWeapons,
      });
    } else {
      // Warmaster Iconoclast: use Warmaster core chassis stats/damage tracks, but Iconoclast-specific weapons.
      const isIconoclast = (c.name || '').toLowerCase().includes('iconoclast');
      const warmasterLocal = localById.get('warmaster');
      const base =
        isIconoclast && warmasterLocal
          ? ({ ...warmasterLocal, id: c.id, name: c.name || warmasterLocal.name } as UnitTemplate)
          : defaultPlaceholderTitanTemplate(c.id, c.name);

      const iconoclastOverWeapons =
        isIconoclast && warmasterLocal && c.weapons.length
          ? overlayWeaponUiMetadata(c.weapons, warmasterLocal.availableWeapons)
          : c.weapons;

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
        availableWeapons: iconoclastOverWeapons,
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

function inferManipleTemplateIdFromName(name: string, bsId?: string): string {
  const n = name.toLowerCase();
  if (bsId) return `bsmaniple:${bsId}`;
  const slug = n.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug ? `bsmaniple:${slug}` : 'bsmaniple:unknown';
}

function isLikelyManipleSelectionEntry(se: XmlNode): boolean {
  const name = (se.attributes.name || '').toLowerCase();
  if (!name.includes('maniple')) return false;
  // Filter out some obvious non-formation noise.
  if (name.includes('stratagem')) return false;
  if (name.includes('wargear')) return false;
  return true;
}

function extractFirstRuleText(se: XmlNode): string | undefined {
  // Prefer explicit <rule><description>...</description></rule> text.
  const ruleNodes = findAll(se, (n) => n.name === 'rule');
  for (const r of ruleNodes) {
    const desc = childText(r, 'description') ?? r.text?.trim();
    if (desc) return desc.trim();
  }
  return undefined;
}

function inferLegionTemplateIdFromSelectionEntry(se: XmlNode): string {
  const bsId = se.attributes.id;
  if (bsId) return `bslegio:${bsId}`;
  const rawName = se.attributes.name?.trim() || '';
  const slug = rawName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  return slug ? `bslegio:${slug}` : 'bslegio:unknown';
}

function selectionEntryToLegionTemplate(se: XmlNode): LegionTemplate | null {
  const rawName = se.attributes.name?.trim();
  if (!rawName) return null;

  const type = (se.attributes.type || '').toLowerCase();
  if (type && type !== 'upgrade') return null;

  const name = sanitizeBattleScribeName(rawName);
  if (!name.toLowerCase().startsWith('legio ')) return null;

  const id = inferLegionTemplateIdFromSelectionEntry(se);

  // Collect ALL rule descriptions, prefixed by rule name when available.
  const ruleNodes = findAll(se, (n) => n.name === 'rule');
  const rules: string[] = [];
  for (const r of ruleNodes) {
    const desc = (childText(r, 'description') ?? r.text?.trim() ?? '').trim();
    if (!desc) continue;
    const rn = (r.attributes.name || '').trim();
    rules.push(rn ? `${rn}: ${desc}` : desc);
  }

  // Capture a useful legion category key/id (e.g. LegioMortis) for later filtering.
  let categoryKey: string | null = null;
  let categoryId: string | null = null;
  const categoryLinks = findAll(se, (n) => n.name === 'categoryLink');
  for (const c of categoryLinks) {
    const nm = (c.attributes.name || '').trim();
    const tid = (c.attributes.targetId || '').trim();
    if (!nm || !tid) continue;
    if (!nm.toLowerCase().startsWith('legio')) continue;
    if (nm === 'LegioSpecificWargear') continue;
    categoryKey = nm;
    categoryId = tid;
    break;
  }

  const allegiance = inferLegionAllegianceFromPublicationId(se.attributes.publicationId);

  return { id, name, rules, categoryKey, categoryId, allegiance };
}

function selectionEntryToUpgradeTemplate(
  se: XmlNode,
  sourceGroup: UpgradeTemplate['sourceGroup'],
  byId?: Map<string, XmlNode>
): UpgradeTemplate | null {
  const rawName = se.attributes.name?.trim();
  if (!rawName) return null;
  const name = sanitizeBattleScribeName(rawName);
  // Exclude legions/houses/etc from the general titan-upgrade list.
  const lname = name.toLowerCase();
  if (lname.startsWith('legio ')) return null;
  if (lname.startsWith('house ')) return null;
  if (lname.includes('maniple')) return null;
  if (lname.includes('titan')) {
    // allow "Princeps Seniores" later, but generally avoid chassis entries
    if (lname.includes('warlord') || lname.includes('warhound') || lname.includes('reaver') || lname.includes('warmaster')) {
      return null;
    }
  }

  const bsId = se.attributes.id;
  const id = bsId ? `bsupg:${bsId}` : `bsupg:${lname.replace(/[^a-z0-9]+/g, '-')}`;
  const points = parsePointsFromSelectionEntry(se) ?? 0;

  const ruleNodes = findAll(se, (n) => n.name === 'rule');
  const rules: string[] = [];
  for (const r of ruleNodes) {
    const desc = (childText(r, 'description') ?? r.text?.trim() ?? '').trim();
    if (!desc) continue;
    const rn = (r.attributes.name || '').trim();
    rules.push(rn ? `${rn}: ${desc}` : desc);
  }
  if (rules.length === 0) {
    // Some entries store text under <rules><rule><description>, but if not, keep name only.
    rules.push(name);
  }

  // Legion-specific tagging (category links like LegioMortis, LegioTempestus, etc.)
  const legioKeys = Array.from(
    new Set(
      findAll(se, (n) => n.name === 'categoryLink')
        .map((c) => String(c.attributes.name ?? '').trim())
        .filter((n) => n.toLowerCase().startsWith('legio') && n !== 'LegioSpecificWargear')
    )
  );

  // Titan filtering: detect "hidden=true when ancestor is instanceOf <chassis>" patterns.
  // We interpret these as "excluded chassis".
  const excludedTitanTemplateIds: string[] = [];
  if (byId) {
    const conditions = findAll(se, (n) => n.name === 'condition');
    for (const cond of conditions) {
      const type = String(cond.attributes.type ?? '').toLowerCase();
      const scope = String(cond.attributes.scope ?? '').toLowerCase();
      const field = String(cond.attributes.field ?? '').toLowerCase();
      const childId = String(cond.attributes.childId ?? '');
      if (!childId) continue;
      if (type !== 'instanceof') continue;
      if (scope !== 'ancestor') continue;
      if (field !== 'selections') continue;
      const target = byId.get(childId);
      if (!target || target.name !== 'selectionEntry') continue;
      const chars = getCharacteristicMap(target);
      if (!isLikelyTitanChassis(target, chars)) continue;
      excludedTitanTemplateIds.push(makeStableTitanTemplateId(target));
    }
  }

  return {
    id,
    name,
    points,
    rules,
    sourceGroup,
    ...(legioKeys.length ? { legioKeys } : {}),
    ...(excludedTitanTemplateIds.length ? { excludedTitanTemplateIds: Array.from(new Set(excludedTitanTemplateIds)) } : {}),
  };
}

function selectionEntryToManipleTemplate(se: XmlNode, byId: Map<string, XmlNode>): ManipleTemplate | null {
  const rawName = se.attributes.name?.trim();
  if (!rawName) return null;
  const name = sanitizeBattleScribeName(rawName);
  if (!name.toLowerCase().includes('maniple')) return null;
  if (!isLikelyManipleSelectionEntry({ ...se, attributes: { ...se.attributes, name } })) return null;

  const id = inferManipleTemplateIdFromName(name, se.attributes.id);

  const allowedTitanIds = new Set<string>();
  let minTitans = 0;
  let maxTitans = 0;

  // Primary path (matches BSData AT .gst):
  // Maniple composition is often expressed as direct <entryLinks><entryLink .../></entryLinks> on the maniple
  // selectionEntry, where each entryLink:
  // - targets a titan chassis selectionEntry (Warhound/Reaver/Warlord/etc)
  // - carries min/max constraints for that chassis inside the maniple.
  const directEntryLinksContainer = se.children.find((c) => c.name === 'entryLinks');
  const directEntryLinks = directEntryLinksContainer?.children.filter((c) => c.name === 'entryLink') ?? [];

  let foundDirectTitanSlots = 0;
  for (const link of directEntryLinks) {
    const targetId = link.attributes.targetId;
    if (!targetId) continue;
    const target = byId.get(targetId);
    if (!target || target.name !== 'selectionEntry') continue;

    const chars = getCharacteristicMap(target);
    if (!isLikelyTitanChassis(target, chars)) continue;

    foundDirectTitanSlots += 1;
    allowedTitanIds.add(makeStableTitanTemplateId(target));

    const { min, max } = parseConstraints(link);
    if (min !== undefined) minTitans += Math.max(0, Math.floor(min));
    if (max !== undefined) maxTitans += Math.max(0, Math.floor(max));
  }

  // Fallback heuristic: sum constraints from selectionEntryGroups that contain (directly or indirectly) titan chassis.
  // Note: some repos/versions may nest formation “slots” behind intermediate groups/links.

  const collectTitanChassisIdsFromNode = (node: XmlNode, visitedIds: Set<string>): string[] => {
    const out: string[] = [];
    const nodeId = node.attributes.id;
    if (nodeId) {
      if (visitedIds.has(nodeId)) return out;
      visitedIds.add(nodeId);
    }

    const chars = getCharacteristicMap(node);
    if (node.name === 'selectionEntry' && isLikelyTitanChassis(node, chars)) {
      out.push(makeStableTitanTemplateId(node));
      return out;
    }

    // Some structures embed selectionEntries directly (not via entryLink). Scan them too.
    const embeddedSelectionEntries = findAll(node, (n) => n.name === 'selectionEntry');
    for (const embedded of embeddedSelectionEntries) {
      const embeddedChars = getCharacteristicMap(embedded);
      if (isLikelyTitanChassis(embedded, embeddedChars)) out.push(makeStableTitanTemplateId(embedded));
    }

    const links = findAll(node, (n) => n.name === 'entryLink');
    for (const link of links) {
      const tid = link.attributes.targetId;
      if (!tid) continue;
      const target = byId.get(tid);
      if (!target) continue;
      collectTitanChassisIdsFromNode(target, visitedIds).forEach((x) => out.push(x));
    }

    return out;
  };

  const inferGroupMinMax = (group: XmlNode): { min: number; max: number } => {
    // Prefer constraints on the group itself; otherwise consider constraints on direct entryLinks.
    const fromGroup = parseConstraints(group);
    let min = fromGroup.min;
    let max = fromGroup.max;

    if (min === undefined && max === undefined) {
      const directLinks = group.children.filter((c) => c.name === 'entryLinks' || c.name === 'entryLink');
      // Some BSData puts constraints on entryLinks under <entryLinks>
      const linkNodes = findAll({ ...group, children: directLinks.flatMap((x) => (x.name === 'entryLink' ? [x] : x.children)) }, (n) => n.name === 'entryLink');
      for (const l of linkNodes) {
        const c = parseConstraints(l);
        if (min === undefined && c.min !== undefined) min = c.min;
        if (max === undefined && c.max !== undefined) max = c.max;
        if (min !== undefined && max !== undefined) break;
      }
    }

    const minI = min !== undefined ? Math.max(0, Math.floor(min)) : 0;
    // If max missing but min present, treat it as fixed-slot count.
    let maxI = max !== undefined ? Math.max(0, Math.floor(max)) : minI;
    // If we still have 0/0, but this is a titan slot group, assume at least one titan can be chosen.
    if (maxI === 0) maxI = 1;
    return { min: minI, max: maxI };
  };

  if (foundDirectTitanSlots === 0) {
    const groups = findAll(se, (n) => n.name === 'selectionEntryGroup');
    for (const g of groups) {
      const titanIds = collectTitanChassisIdsFromNode(g, new Set<string>());
      if (titanIds.length === 0) continue;

      titanIds.forEach((t) => allowedTitanIds.add(t));

      const mm = inferGroupMinMax(g);
      minTitans += mm.min;
      maxTitans += mm.max;
    }
  }

  // Reasonable fallback for known starter templates if constraints weren't discovered.
  const specialRule = extractFirstRuleText(se) ?? `${name}: (BattleScribe)`;

  return {
    id,
    name,
    allowedTitanTemplateIds: Array.from(allowedTitanIds),
    minTitans,
    maxTitans,
    specialRule,
  };
}

/**
 * Loads formation/maniple templates from BSData.
 *
 * This is best-effort: BattleScribe encodes full formation structure/rules in a way that’s
 * more complex than our current `ManipleTemplate` model, so we extract:
 * - name + stable id
 * - allowed titan chassis (best-effort via entryLinks)
 * - min/max titans (best-effort via selectionEntryGroup constraints)
 * - first rule description (if present)
 */
export async function loadManipleTemplatesFromBattleScribe(
  config: Partial<BattleScribeSourceConfig> = {}
): Promise<BattleScribeManiplesLoadResult> {
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

  const found: ManipleTemplate[] = [];

  for (const xml of xmlStrings) {
    const doc = parseXml(xml);
    const selectionEntries = findAll(doc, (n) => n.name === 'selectionEntry');
    const byId = new Map<string, XmlNode>();
    // Build an ID map that includes both selectionEntry and selectionEntryGroup nodes so entryLinks can be resolved.
    const idNodes = findAll(doc, (n) => typeof n.attributes.id === 'string' && n.attributes.id.length > 0);
    idNodes.forEach((n) => {
      const id = n.attributes.id;
      if (id) byId.set(id, n);
    });

    for (const se of selectionEntries) {
      const tpl = selectionEntryToManipleTemplate(se, byId);
      if (tpl) found.push(tpl);
    }
  }

  // Deduplicate by id and sort for stable UI.
  const byId = new Map<string, ManipleTemplate>();
  for (const m of found) {
    if (!byId.has(m.id)) byId.set(m.id, m);
    else {
      // Merge: keep richer allowed list and non-zero min/max if discovered.
      const existing = byId.get(m.id)!;
      const allowed = new Set([...(existing.allowedTitanTemplateIds || []), ...(m.allowedTitanTemplateIds || [])]);
      byId.set(m.id, {
        ...existing,
        name: existing.name || m.name,
        allowedTitanTemplateIds: Array.from(allowed),
        minTitans: existing.minTitans || m.minTitans,
        maxTitans: existing.maxTitans || m.maxTitans,
        specialRule: existing.specialRule || m.specialRule,
      });
    }
  }

  const maniples = Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
  if (maniples.length === 0) {
    warnings.push('No maniple/formation entries were recognized in fetched BattleScribe files. Falling back to local maniple templates only.');
  }

  return { maniples, warnings };
}

/**
 * Loads Legion templates (name + special rules) from BSData.
 * These show up as selectionEntry upgrades like "Legio Astorum (Warp Runners)".
 */
export async function loadLegionTemplatesFromBattleScribe(
  config: Partial<BattleScribeSourceConfig> = {}
): Promise<BattleScribeLegionsLoadResult> {
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

  const found: LegionTemplate[] = [];
  const seen = new Set<string>();

  for (const xml of xmlStrings) {
    const doc = parseXml(xml);
    const selectionEntries = findAll(doc, (n) => n.name === 'selectionEntry');
    for (const se of selectionEntries) {
      const legio = selectionEntryToLegionTemplate(se);
      if (!legio) continue;
      if (seen.has(legio.id)) continue;
      seen.add(legio.id);
      found.push(legio);
    }
  }

  found.sort((a, b) => a.name.localeCompare(b.name));
  if (found.length === 0) warnings.push('No legions were recognized in fetched BattleScribe files.');

  return { legions: found, warnings };
}

/**
 * Loads Titan wargear/upgrade templates from the curated BSData "Wargear" groups.
 * We currently expose:
 * - Universal Wargear
 * - Loyalist Wargear
 * - Traitor Wargear
 */
export async function loadUpgradeTemplatesFromBattleScribe(
  config: Partial<BattleScribeSourceConfig> = {}
): Promise<BattleScribeUpgradesLoadResult> {
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

  // Known group IDs in Adeptus Titanicus 2018.gst
  const groupIds: Array<{ id: string; sourceGroup: UpgradeTemplate['sourceGroup'] }> = [
    { id: 'f360-b4bd-e6cd-d077', sourceGroup: 'universal' },
    { id: 'c354-c2bb-8d84-0770', sourceGroup: 'loyalist' },
    { id: '3bce-46aa-99ca-8f60', sourceGroup: 'traitor' },
  ];

  const upgrades: UpgradeTemplate[] = [];
  const seen = new Set<string>();

  for (const xml of xmlStrings) {
    const doc = parseXml(xml);
    const selectionEntries = findAll(doc, (n) => n.name === 'selectionEntry');
    const byId = new Map<string, XmlNode>();
    selectionEntries.forEach((se) => {
      const id = se.attributes.id;
      if (id) byId.set(id, se);
    });

    // Always include Princeps Seniores rules if present (used by titan config).
    // selectionEntry id: 2dc5-e9bf-6f6e-39a5 in Adeptus Titanicus 2018.gst
    const princeps = byId.get('2dc5-e9bf-6f6e-39a5');
    if (princeps) {
      const tpl = selectionEntryToUpgradeTemplate(princeps, 'universal', byId);
      if (tpl && !seen.has(tpl.id)) {
        seen.add(tpl.id);
        upgrades.push(tpl);
      }
    }

    for (const g of groupIds) {
      const groupNode = findAll(doc, (n) => n.name === 'selectionEntryGroup' && n.attributes.id === g.id)[0];
      if (!groupNode) continue;
      const entryLinks = findAll(groupNode, (n) => n.name === 'entryLink');
      for (const link of entryLinks) {
        const tid = link.attributes.targetId;
        if (!tid) continue;
        const target = byId.get(tid);
        if (!target) continue;
        const tpl = selectionEntryToUpgradeTemplate(target, g.sourceGroup, byId);
        if (!tpl) continue;
        if (seen.has(tpl.id)) continue;
        seen.add(tpl.id);
        upgrades.push(tpl);
      }
    }
  }

  upgrades.sort((a, b) => a.name.localeCompare(b.name));
  if (upgrades.length === 0) warnings.push('No wargear upgrades were resolved from BattleScribe data.');
  return { upgrades, warnings };
}

export async function loadPrincepsTraitTemplatesFromBattleScribe(
  config: Partial<BattleScribeSourceConfig> = {}
): Promise<BattleScribePrincepsTraitsLoadResult> {
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

  const traits: PrincepsTraitTemplate[] = [];
  const seen = new Set<string>();

  for (const xml of xmlStrings) {
    const doc = parseXml(xml);
    const groups = findAll(doc, (n) => n.name === 'selectionEntryGroup' && n.attributes.id === 'aa6b-a665-b907-234e');
    if (!groups.length) continue;
    const root = groups[0]!;

    // Each child selectionEntryGroup is a Legio group containing selectionEntries (the trait list).
    const legioGroups = root.children.filter((c) => c.name === 'selectionEntryGroups').flatMap((c) => c.children);
    for (const lg of legioGroups) {
      if (lg.name !== 'selectionEntryGroup') continue;

      const allegiance = inferLegionAllegianceFromPublicationId(lg.attributes.publicationId);
      const groupName = (lg.attributes.name ?? '').trim();
      const traitGroup: PrincepsTraitTemplate['traitGroup'] =
        groupName === 'Standard'
          ? 'standard'
          : groupName === 'Corrupted Titan'
            ? 'corrupted'
            : groupName.toLowerCase().startsWith('legio ')
              ? 'legio'
              : 'unknown';

      // Attempt to extract the legion category id from the group's modifier conditions:
      // <condition scope="primary-category" ... childId="...LegioMortis categoryEntry id..." />
      let legioCategoryId: string | null = null;
      const conds = findAll(lg, (n) => n.name === 'condition');
      for (const cond of conds) {
        const scope = String(cond.attributes.scope ?? '').toLowerCase();
        const type = String(cond.attributes.type ?? '').toLowerCase();
        const childId = String(cond.attributes.childId ?? '');
        if (!childId) continue;
        if (scope === 'primary-category' && (type === 'atleast' || type === 'equalto')) {
          legioCategoryId = childId;
          break;
        }
      }
      // Standard / Corrupted groups are not legion-specific.
      if (traitGroup !== 'legio') {
        legioCategoryId = null;
      }

      const entriesContainers = lg.children.filter((c) => c.name === 'selectionEntries');
      for (const container of entriesContainers) {
        for (const se of container.children) {
          if (se.name !== 'selectionEntry') continue;
          const rawName = se.attributes.name?.trim();
          const bsId = se.attributes.id;
          if (!rawName || !bsId) continue;

          const name = sanitizeBattleScribeName(rawName).replace(/^\d+\s+/, '').trim();
          const id = `bstrait:${bsId}`;

          const ruleNodes = findAll(se, (n) => n.name === 'rule');
          const rules: string[] = [];
          for (const r of ruleNodes) {
            const desc = (childText(r, 'description') ?? r.text?.trim() ?? '').trim();
            if (!desc) continue;
            const rn = (r.attributes.name || '').trim();
            rules.push(rn ? `${rn}: ${desc}` : desc);
          }
          if (!rules.length) rules.push(name);

          if (seen.has(id)) continue;
          seen.add(id);
          traits.push({ id, name, rules, legioCategoryId, allegiance, traitGroup });
        }
      }
    }
  }

  traits.sort((a, b) => a.name.localeCompare(b.name));
  if (!traits.length) warnings.push('No Princeps trait templates were resolved from BattleScribe data.');

  return { traits, warnings };
}


