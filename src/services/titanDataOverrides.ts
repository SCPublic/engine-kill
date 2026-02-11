/**
 * Fetches Engine-Kill override JSON from titan-data (engine-kill/ folder).
 * Used to customize titan behaviour (chassis max/saves, damage tracks, weapon UI metadata)
 * without hardcoding in the app. Data must be loaded from titan-data (no local fallback).
 * We only cache successful loads so a failed fetch is retried on next load.
 */

export type ChassisOverrideJson = {
  plasmaReactorMax?: number;
  voidShieldsMax?: number;
  voidShieldSaves?: string[];
  /** Special rules text for this chassis (e.g. Squadron). BSData often omits these on chassis; titan-data can supply them. */
  specialRules?: string[];
};

/** Armor roll ranges in titan-data (direct/devastating/critical). Accepts legacy "hitTable" keys for backward compat. */
export type ArmorRollsJson = {
  direct?: string;
  devastating?: string;
  critical?: string;
  directHit?: string;
  devastatingHit?: string;
  criticalHit?: string;
};

/** Single critical effect level (1–3 standard; Warmaster head can use 4). */
export type CriticalEffectJson = { level: 1 | 2 | 3 | 4; effects: string[] };

export type DamageLocationJson = {
  max: number;
  /** Armor rolls (roll ranges per hit type). Key in JSON: armorRolls. Legacy: hitTable with directHit/devastatingHit/criticalHit. */
  armorRolls?: ArmorRollsJson;
  hitTable?: { directHit: string; devastatingHit: string; criticalHit: string };
  /** Modifiers for the last N positions (position 1 = first pip). E.g. [1, 2, 3] with max 5 → positions 1,2 null; 3,4,5 get 1,2,3. */
  modifiers?: number[];
  /** Omit to use default from critical-effects.json (head/body/legs shared by all titans). */
  criticalEffects?: CriticalEffectJson[];
};

/** Default critical effects for head/body/legs (all titans except overrides like Warmaster head). */
export type DefaultCriticalEffectsJson = {
  head: CriticalEffectJson[];
  body: CriticalEffectJson[];
  legs: CriticalEffectJson[];
};

export type DamageTracksJson = Record<
  string,
  { head: DamageLocationJson; body: DamageLocationJson; legs: DamageLocationJson }
>;

export type WeaponMetadataEntry = {
  repairRoll?: string;
  disabledRollLines?: string[];
};

export type WeaponMetadataJson = Record<string, WeaponMetadataEntry>;

/** Template id → chassis key for damage track and chassis overrides (e.g. "warbringer" → "nemesis", "bs:dfeb-83af-7b26-622a" → "warlord"). */
export type ChassisAliasesJson = Record<string, string>;

export type TitanDataOverrides = {
  chassisOverrides: Record<string, ChassisOverrideJson>;
  chassisAliases: ChassisAliasesJson;
  damageTracks: DamageTracksJson;
  weaponMetadata: WeaponMetadataJson;
  /** Shared critical effects (from critical-effects.json). Used when a chassis location omits criticalEffects. */
  defaultCriticalEffects: DefaultCriticalEffectsJson;
};

const ENGINE_KILL_PATH = 'engine-kill/';

let cached: TitanDataOverrides | null = null;
let cachedBaseUrl: string | null = null;
let cachePromise: Promise<TitanDataOverrides> | null = null;
let cachePromiseBaseUrl: string | null = null;

async function fetchJson<T>(url: string, logLabel?: string): Promise<T | null> {
  try {
    // Avoid custom headers so the request stays "simple" and doesn't trigger CORS preflight (raw.githubusercontent.com doesn't allow it).
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) {
      if (logLabel) {
        console.warn(`[titan-data] ${logLabel}: ${res.status} ${res.statusText}`, url);
      }
      return null;
    }
    const data = await res.json();
    return data as T;
  } catch (e) {
    if (logLabel) {
      console.warn(`[titan-data] ${logLabel} fetch failed:`, e instanceof Error ? e.message : e, url);
    }
    return null;
  }
}

/**
 * Load chassis, damage-tracks, and weapon-metadata from baseUrl (e.g. titan-data).
 * Only caches when damage-tracks loaded successfully so failed fetches are retried next time.
 */
export async function loadTitanDataOverrides(baseUrl: string): Promise<TitanDataOverrides> {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const prefix = `${base}${ENGINE_KILL_PATH}`;

  // Only deduplicate in-flight requests; do not cache result so titan-data changes are seen after refresh.
  if (cachePromise && cachePromiseBaseUrl === base) return cachePromise;

  cachePromiseBaseUrl = base;
  cachePromise = (async () => {
    console.log('[titan-data] Loading overrides from:', base);
    const bust = `?_=${Date.now()}`;
    const damageUrl = `${prefix}damage-tracks.json${bust}`;
    const critUrl = `${prefix}critical-effects.json${bust}`;
    const [chassis, aliases, damage, weapons, defaultCrit] = await Promise.all([
      fetchJson<Record<string, ChassisOverrideJson>>(`${prefix}chassis-overrides.json${bust}`, 'chassis-overrides'),
      fetchJson<ChassisAliasesJson>(`${prefix}chassis-aliases.json${bust}`),
      fetchJson<DamageTracksJson>(damageUrl, 'damage-tracks'),
      fetchJson<WeaponMetadataJson>(`${prefix}weapon-metadata.json${bust}`, 'weapon-metadata'),
      fetchJson<DefaultCriticalEffectsJson>(critUrl, 'critical-effects'),
    ]);

    const defaultCriticalEffects: DefaultCriticalEffectsJson = defaultCrit ?? {
      head: [],
      body: [],
      legs: [],
    };

    const result: TitanDataOverrides = {
      chassisOverrides: chassis ?? {},
      chassisAliases: aliases ?? {},
      damageTracks: damage ?? {},
      weaponMetadata: weapons ?? {},
      defaultCriticalEffects,
    };

    const damageFailed = damage == null || Object.keys(result.damageTracks).length === 0;
    const criticalEffectsFailed = defaultCrit == null;
    if (damageFailed) {
      console.warn(
        '[titan-data] damage-tracks.json failed to load or was empty. URL:',
        damageUrl,
        '- titan stats and armour rolls will be missing. Reload or check network.'
      );
    }
    if (criticalEffectsFailed) {
      console.warn(
        '[titan-data] critical-effects.json failed to load. URL:',
        critUrl,
        '- critical effect text will be empty. Reload or check network.'
      );
    }

    cachePromise = null;
    cachePromiseBaseUrl = null;
    return result;
  })();

  return cachePromise;
}

/**
 * Reset cache (e.g. when switching data source or for tests).
 */
export function clearTitanDataOverridesCache(): void {
  cached = null;
  cachedBaseUrl = null;
  cachePromise = null;
  cachePromiseBaseUrl = null;
}
