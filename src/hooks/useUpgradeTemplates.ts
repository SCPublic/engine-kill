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
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac455864-a4a0-4c3f-b63e-cc80f7299a14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUpgradeTemplates.ts',message:'loaded',data:{count:res.upgrades.length,warningsCount:res.warnings.length},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
      } catch (e) {
        if (cancelled) return;
        console.warn('[BattleScribe] Failed to load upgrade templates.', e);
        setUpgradeTemplates([]);
        setWarnings(['Failed to load BattleScribe upgrade templates.']);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/ac455864-a4a0-4c3f-b63e-cc80f7299a14',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'useUpgradeTemplates.ts',message:'load error',data:{error:String(e)},timestamp:Date.now()})}).catch(()=>{});
        // #endregion
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

