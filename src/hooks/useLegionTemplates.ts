import { useCallback, useEffect, useMemo, useState } from 'react';
import { LegionTemplate } from '../models/LegionTemplate';
import { battleScribeCache } from '../services/battleScribeCache';

export function useLegionTemplates() {
  const initial = battleScribeCache.getLegionResultSnapshot();
  const [remoteLegionTemplates, setRemoteLegionTemplates] = useState<LegionTemplate[] | null>(
    () => initial.result?.legions ?? null
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
        // If we already have cached data and this isn't a forced reload, don't refetch on remount.
        if (reloadToken === 0 && battleScribeCache.getLegionResultSnapshot().status === 'loaded') {
          if (!cancelled) setIsLoading(false);
          return;
        }

        if (!cancelled) setIsLoading(true);
        const res =
          reloadToken === 0 ? await battleScribeCache.loadLegionsOnce() : await battleScribeCache.reloadLegions();
        if (cancelled) return;
        setRemoteLegionTemplates(res.legions);
        setWarnings(res.warnings);
      } catch (e) {
        if (cancelled) return;
        console.warn('[BattleScribe] Failed to load legion templates.', e);
        setRemoteLegionTemplates([]);
        setWarnings(['Failed to load BattleScribe legion templates.']);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const legionTemplates = useMemo(() => remoteLegionTemplates ?? [], [remoteLegionTemplates]);

  return {
    legionTemplates,
    warnings,
    isLoading,
    reload,
    source: 'battlescribe',
  } as const;
}

