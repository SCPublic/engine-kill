/**
 * Single-fetch template cache. Loads titan-data root templates.json once
 * and exposes titans, banners, maniples, legions, upgrades, and princeps traits
 * via the same snapshot/load API that hooks and screens already use.
 * No override/merge at runtime; templates come only from templates.json.
 */

import type {
  AllTitansLoadResult,
  LegionsLoadResult,
  ManiplesLoadResult,
  PrincepsTraitsLoadResult,
  UpgradesLoadResult,
} from '../types/templateLoading';
import { DEFAULT_DATA_BASE_URL } from '../utils/constants';
import { loadTemplatesFromJson, type TemplatesPayload } from './templatesLoader';

type CacheStatus = 'idle' | 'loading' | 'loaded' | 'error';

type CacheEntry<T> = {
  status: CacheStatus;
  result?: T;
  error?: unknown;
  promise?: Promise<T>;
};

/** Banner slice shape for useBannerTemplates (templates + warnings, no missingMaxData/legendTitans). */
export interface BannerLoadResult {
  templates: import('../models/UnitTemplate').UnitTemplate[];
  warnings: string[];
}

const payloadCache: CacheEntry<TemplatesPayload> = { status: 'idle' };

async function loadOnce<T>(cache: CacheEntry<T>, loader: () => Promise<T>): Promise<T> {
  if (cache.status === 'loaded' && cache.result) return cache.result;
  if (cache.status === 'loading' && cache.promise) return await cache.promise;
  if (cache.status === 'error' && cache.error) throw cache.error;

  cache.status = 'loading';
  cache.promise = loader()
    .then((res) => {
      cache.status = 'loaded';
      cache.result = res;
      cache.error = undefined;
      cache.promise = undefined;
      return res;
    })
    .catch((e) => {
      cache.status = 'error';
      cache.result = undefined;
      cache.error = e;
      cache.promise = undefined;
      throw e;
    });

  return await cache.promise;
}

function getPayloadSnapshot() {
  return {
    status: payloadCache.status,
    result: payloadCache.result,
    error: payloadCache.error,
  } as const;
}

function resetPayload() {
  payloadCache.status = 'idle';
  payloadCache.result = undefined;
  payloadCache.error = undefined;
  payloadCache.promise = undefined;
}

async function loadPayloadOnce(): Promise<TemplatesPayload> {
  return loadOnce(payloadCache, () => loadTemplatesFromJson(DEFAULT_DATA_BASE_URL));
}

/** Map payload to the titan result shape (templates.json has no missingMaxData/legendTitans). */
function toTitanResult(p: TemplatesPayload): AllTitansLoadResult {
  return {
    templates: p.titans,
    warnings: p.warnings,
    missingMaxData: [],
    legendTitans: [],
  };
}

/** Map payload to banner result shape. */
function toBannerResult(p: TemplatesPayload): BannerLoadResult {
  return { templates: p.banners, warnings: p.warnings };
}

export const templatesCache = {
  // Single payload load (used by all category loaders)
  async loadTemplatesPayloadOnce(): Promise<TemplatesPayload> {
    return loadPayloadOnce();
  },

  // Titans
  getTitanResultSnapshot() {
    const snap = getPayloadSnapshot();
    return {
      status: snap.status,
      result: snap.result ? toTitanResult(snap.result) : undefined,
      error: snap.error,
    } as const;
  },
  async loadTitansOnce(): Promise<AllTitansLoadResult> {
    const p = await loadPayloadOnce();
    return toTitanResult(p);
  },
  async reloadTitans() {
    resetPayload();
    return await this.loadTitansOnce();
  },

  // Banners (from same payload)
  getBannerResultSnapshot() {
    const snap = getPayloadSnapshot();
    return {
      status: snap.status,
      result: snap.result ? toBannerResult(snap.result) : undefined,
      error: snap.error,
    } as const;
  },
  async loadBannersOnce(): Promise<BannerLoadResult> {
    const p = await loadPayloadOnce();
    return toBannerResult(p);
  },
  async reloadBanners() {
    resetPayload();
    return await this.loadBannersOnce();
  },

  // Maniples
  getManipleResultSnapshot() {
    const snap = getPayloadSnapshot();
    return {
      status: snap.status,
      result: snap.result
        ? ({ maniples: snap.result.maniples, warnings: snap.result.warnings } as ManiplesLoadResult)
        : undefined,
      error: snap.error,
    } as const;
  },
  async loadManiplesOnce(): Promise<ManiplesLoadResult> {
    const p = await loadPayloadOnce();
    return { maniples: p.maniples, warnings: p.warnings };
  },
  async reloadManiples() {
    resetPayload();
    return await this.loadManiplesOnce();
  },

  // Legions
  getLegionResultSnapshot() {
    const snap = getPayloadSnapshot();
    return {
      status: snap.status,
      result: snap.result
        ? ({ legions: snap.result.legions, warnings: snap.result.warnings } as LegionsLoadResult)
        : undefined,
      error: snap.error,
    } as const;
  },
  async loadLegionsOnce(): Promise<LegionsLoadResult> {
    const p = await loadPayloadOnce();
    return { legions: p.legions, warnings: p.warnings };
  },
  async reloadLegions() {
    resetPayload();
    return await this.loadLegionsOnce();
  },

  // Upgrades
  getUpgradeResultSnapshot() {
    const snap = getPayloadSnapshot();
    return {
      status: snap.status,
      result: snap.result
        ? ({ upgrades: snap.result.upgrades, warnings: snap.result.warnings } as UpgradesLoadResult)
        : undefined,
      error: snap.error,
    } as const;
  },
  async loadUpgradesOnce(): Promise<UpgradesLoadResult> {
    const p = await loadPayloadOnce();
    return { upgrades: p.upgrades, warnings: p.warnings };
  },
  async reloadUpgrades() {
    resetPayload();
    return await this.loadUpgradesOnce();
  },

  // Princeps Traits
  getPrincepsTraitResultSnapshot() {
    const snap = getPayloadSnapshot();
    return {
      status: snap.status,
      result: snap.result
        ? ({
            traits: snap.result.princepsTraits,
            warnings: snap.result.warnings,
          } as PrincepsTraitsLoadResult)
        : undefined,
      error: snap.error,
    } as const;
  },
  async loadPrincepsTraitsOnce(): Promise<PrincepsTraitsLoadResult> {
    const p = await loadPayloadOnce();
    return { traits: p.princepsTraits, warnings: p.warnings };
  },
  async reloadPrincepsTraits() {
    resetPayload();
    return await this.loadPrincepsTraitsOnce();
  },

  /** Reset all caches (single payload). Reload triggers one fetch for all categories. */
  resetAll() {
    resetPayload();
  },
} as const;
