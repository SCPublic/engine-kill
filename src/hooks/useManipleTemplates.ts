import { useCallback, useEffect, useMemo, useState } from 'react';
import { ManipleTemplate } from '../models/ManipleTemplate';
import { battleScribeCache } from '../services/battleScribeCache';

export function useManipleTemplates() {
  const initial = battleScribeCache.getManipleResultSnapshot();
  const [remoteManipleTemplates, setRemoteManipleTemplates] = useState<ManipleTemplate[] | null>(
    () => initial.result?.maniples ?? null
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
        if (reloadToken === 0 && battleScribeCache.getManipleResultSnapshot().status === 'loaded') {
          if (!cancelled) setIsLoading(false);
          return;
        }

        if (!cancelled) setIsLoading(true);
        const res =
          reloadToken === 0 ? await battleScribeCache.loadManiplesOnce() : await battleScribeCache.reloadManiples();
        if (cancelled) return;
        setRemoteManipleTemplates(res.maniples);
        setWarnings(res.warnings);
      } catch (e) {
        if (cancelled) return;
        console.warn('[BattleScribe] Failed to load maniple templates.', e);
        setRemoteManipleTemplates([]);
        setWarnings(['Failed to load BattleScribe maniple templates.']);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const manipleTemplates = useMemo(() => remoteManipleTemplates ?? [], [remoteManipleTemplates]);

  return {
    manipleTemplates,
    warnings,
    isLoading,
    reload,
    source: 'battlescribe',
  } as const;
}

