import {
  loadAllTitanTemplatesFromBattleScribe,
  loadLegionTemplatesFromBattleScribe,
  loadManipleTemplatesFromBattleScribe,
  loadUpgradeTemplatesFromBattleScribe,
  loadPrincepsTraitTemplatesFromBattleScribe,
  type BattleScribeAllTitansLoadResult,
  type BattleScribeLegionsLoadResult,
  type BattleScribeManiplesLoadResult,
  type BattleScribeUpgradesLoadResult,
  type BattleScribePrincepsTraitsLoadResult,
} from '../adapters/battlescribe/battlescribeAdapter';

type CacheStatus = 'idle' | 'loading' | 'loaded' | 'error';

type CacheEntry<T> = {
  status: CacheStatus;
  result?: T;
  error?: unknown;
  promise?: Promise<T>;
};

const titanCache: CacheEntry<BattleScribeAllTitansLoadResult> = { status: 'idle' };
const manipleCache: CacheEntry<BattleScribeManiplesLoadResult> = { status: 'idle' };
const legionCache: CacheEntry<BattleScribeLegionsLoadResult> = { status: 'idle' };
const upgradeCache: CacheEntry<BattleScribeUpgradesLoadResult> = { status: 'idle' };
const princepsTraitCache: CacheEntry<BattleScribePrincepsTraitsLoadResult> = { status: 'idle' };

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

function reset<T>(cache: CacheEntry<T>) {
  cache.status = 'idle';
  cache.result = undefined;
  cache.error = undefined;
  cache.promise = undefined;
}

export const battleScribeCache = {
  // Titans
  getTitanResultSnapshot() {
    return { status: titanCache.status, result: titanCache.result, error: titanCache.error } as const;
  },
  async loadTitansOnce() {
    return await loadOnce(titanCache, () => loadAllTitanTemplatesFromBattleScribe());
  },
  async reloadTitans() {
    reset(titanCache);
    return await this.loadTitansOnce();
  },

  // Maniples
  getManipleResultSnapshot() {
    return { status: manipleCache.status, result: manipleCache.result, error: manipleCache.error } as const;
  },
  async loadManiplesOnce() {
    return await loadOnce(manipleCache, () => loadManipleTemplatesFromBattleScribe());
  },
  async reloadManiples() {
    reset(manipleCache);
    return await this.loadManiplesOnce();
  },

  // Legions
  getLegionResultSnapshot() {
    return { status: legionCache.status, result: legionCache.result, error: legionCache.error } as const;
  },
  async loadLegionsOnce() {
    return await loadOnce(legionCache, () => loadLegionTemplatesFromBattleScribe());
  },
  async reloadLegions() {
    reset(legionCache);
    return await this.loadLegionsOnce();
  },

  // Upgrades
  getUpgradeResultSnapshot() {
    return { status: upgradeCache.status, result: upgradeCache.result, error: upgradeCache.error } as const;
  },
  async loadUpgradesOnce() {
    return await loadOnce(upgradeCache, () => loadUpgradeTemplatesFromBattleScribe());
  },
  async reloadUpgrades() {
    reset(upgradeCache);
    return await this.loadUpgradesOnce();
  },

  // Princeps Traits
  getPrincepsTraitResultSnapshot() {
    return { status: princepsTraitCache.status, result: princepsTraitCache.result, error: princepsTraitCache.error } as const;
  },
  async loadPrincepsTraitsOnce() {
    return await loadOnce(princepsTraitCache, () => loadPrincepsTraitTemplatesFromBattleScribe());
  },
  async reloadPrincepsTraits() {
    reset(princepsTraitCache);
    return await this.loadPrincepsTraitsOnce();
  },
} as const;

