/**
 * Fetches Engine-Kill override JSON from titan-data (engine-kill/ folder).
 * Used to customize titan behaviour (chassis max/saves, damage tracks, weapon UI metadata)
 * without hardcoding in the app. Falls back to empty/bundled when fetch fails.
 */

export type ChassisOverrideJson = {
  plasmaReactorMax?: number;
  voidShieldsMax?: number;
  voidShieldSaves?: string[];
};

export type DamageLocationJson = {
  max: number;
  armor: { directHit: number; devastatingHit: number; crit: number };
  hitTable: { directHit: string; devastatingHit: string; criticalHit: string };
  modifiers?: (number | null)[];
  criticalEffects: Array<{ level: 1 | 2 | 3; effects: string[] }>;
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

export type TitanDataOverrides = {
  chassisOverrides: Record<string, ChassisOverrideJson>;
  damageTracks: DamageTracksJson;
  weaponMetadata: WeaponMetadataJson;
};

const ENGINE_KILL_PATH = 'engine-kill/';

let cached: TitanDataOverrides | null = null;
let cachePromise: Promise<TitanDataOverrides> | null = null;

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    return data as T;
  } catch {
    return null;
  }
}

/**
 * Load chassis, damage-tracks, and weapon-metadata from baseUrl (e.g. titan-data).
 * Cached per baseUrl; returns empty overrides on fetch failure.
 */
export async function loadTitanDataOverrides(baseUrl: string): Promise<TitanDataOverrides> {
  if (cached) return cached;
  if (cachePromise) return cachePromise;

  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const prefix = `${base}${ENGINE_KILL_PATH}`;

  cachePromise = (async () => {
    const [chassis, damage, weapons] = await Promise.all([
      fetchJson<Record<string, ChassisOverrideJson>>(`${prefix}chassis-overrides.json`),
      fetchJson<DamageTracksJson>(`${prefix}damage-tracks.json`),
      fetchJson<WeaponMetadataJson>(`${prefix}weapon-metadata.json`),
    ]);

    const result: TitanDataOverrides = {
      chassisOverrides: chassis ?? {},
      damageTracks: damage ?? {},
      weaponMetadata: weapons ?? {},
    };
    cached = result;
    return result;
  })();

  return cachePromise;
}

/**
 * Reset cache (e.g. when switching data source or for tests).
 */
export function clearTitanDataOverridesCache(): void {
  cached = null;
  cachePromise = null;
}
