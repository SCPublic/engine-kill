import { useCallback, useEffect, useMemo, useState } from 'react';
import { UpgradeTemplate } from '../models/UpgradeTemplate';
import { battleScribeCache } from '../services/battleScribeCache';

export function useUpgradeTemplates() {
  const initial = battleScribeCache.getUpgradeResultSnapshot();
  const [upgradeTemplates, setUpgradeTemplates] = useState<UpgradeTemplate[] | null>(
    () => initial.result?.upgrades ?? null
  );
  const [warnings, setWarnings] = useState<string[]>(() => initial.result?.warnings ?? []);
  const [isLoading, setIsLoading] = useState(() => initial.status === 'loading' || initial.status === 'idle');
  const [reloadToken, setReloadToken] = useState(0);

  const reload = useCallback(() => {
    setReloadToken((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (reloadToken === 0 && battleScribeCache.getUpgradeResultSnapshot().status === 'loaded') {
          if (!cancelled) setIsLoading(false);
          return;
        }
        if (!cancelled) setIsLoading(true);
        const res =
          reloadToken === 0 ? await battleScribeCache.loadUpgradesOnce() : await battleScribeCache.reloadUpgrades();
        if (cancelled) return;
        setUpgradeTemplates(res.upgrades);
        setWarnings(res.warnings);
      } catch (e) {
        if (cancelled) return;
        console.warn('[BattleScribe] Failed to load upgrade templates.', e);
        setUpgradeTemplates([]);
        setWarnings(['Failed to load BattleScribe upgrade templates.']);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const upgrades = useMemo(() => upgradeTemplates ?? [], [upgradeTemplates]);

  return {
    upgradeTemplates: upgrades,
    warnings,
    isLoading,
    reload,
    source: 'battlescribe',
  } as const;
}

