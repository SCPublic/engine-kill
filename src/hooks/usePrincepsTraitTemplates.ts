import { useCallback, useEffect, useMemo, useState } from 'react';
import { PrincepsTraitTemplate } from '../models/PrincepsTraitTemplate';
import { battleScribeCache } from '../services/battleScribeCache';

export function usePrincepsTraitTemplates() {
  const initial = battleScribeCache.getPrincepsTraitResultSnapshot();
  const [traitTemplates, setTraitTemplates] = useState<PrincepsTraitTemplate[] | null>(
    () => initial.result?.traits ?? null
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
        if (reloadToken === 0 && battleScribeCache.getPrincepsTraitResultSnapshot().status === 'loaded') {
          if (!cancelled) setIsLoading(false);
          return;
        }
        if (!cancelled) setIsLoading(true);
        const res =
          reloadToken === 0
            ? await battleScribeCache.loadPrincepsTraitsOnce()
            : await battleScribeCache.reloadPrincepsTraits();
        if (cancelled) return;
        setTraitTemplates(res.traits);
        setWarnings(res.warnings);
      } catch (e) {
        if (cancelled) return;
        console.warn('[BattleScribe] Failed to load princeps traits.', e);
        setTraitTemplates([]);
        setWarnings(['Failed to load BattleScribe princeps traits.']);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const princepsTraitTemplates = useMemo(() => traitTemplates ?? [], [traitTemplates]);

  return {
    princepsTraitTemplates,
    warnings,
    isLoading,
    reload,
    source: 'battlescribe',
  } as const;
}

