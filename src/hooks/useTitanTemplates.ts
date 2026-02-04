import { useCallback, useEffect, useMemo, useState } from 'react';
import { MissingChassisMaxData } from '../adapters/battlescribe/battlescribeAdapter';
import { UnitTemplate } from '../models/UnitTemplate';
import { battleScribeCache } from '../services/battleScribeCache';

export function useTitanTemplates() {
  const initial = battleScribeCache.getTitanResultSnapshot();
  const [remoteTitanTemplates, setRemoteTitanTemplates] = useState<UnitTemplate[] | null>(
    () => initial.result?.templates ?? null
  );
  const [missingMaxData, setMissingMaxData] = useState<MissingChassisMaxData[]>(
    () => initial.result?.missingMaxData ?? []
  );
  const [warnings, setWarnings] = useState<string[]>(() => initial.result?.warnings ?? []);
  const [legendTitans, setLegendTitans] = useState<Array<{ id: string; name: string }>>(
    () => initial.result?.legendTitans ?? []
  );
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
        if (reloadToken === 0 && battleScribeCache.getTitanResultSnapshot().status === 'loaded') {
          if (!cancelled) setIsLoading(false);
          return;
        }

        if (!cancelled) setIsLoading(true);
        const res =
          reloadToken === 0 ? await battleScribeCache.loadTitansOnce() : await battleScribeCache.reloadTitans();
        if (cancelled) return;
        setRemoteTitanTemplates(res.templates);
        setMissingMaxData(res.missingMaxData);
        setWarnings(res.warnings);
        setLegendTitans(res.legendTitans);

        // Helpful log for “what are we missing” without needing UI yet.
        const excludedMissingMaxLogSubstrings = ['warbreaker', 'great crusade', 'crusade'];
        const loggableMissing = res.missingMaxData.filter((m) => {
          const n = (m.name || '').toLowerCase();
          return !excludedMissingMaxLogSubstrings.some((s) => n.includes(s));
        });

        if (loggableMissing.length) {
          console.warn(
            `[BattleScribe] Titans missing chassis max data: ${loggableMissing
              .map((m) => `${m.name} (${m.missing.join(', ')})`)
              .join(' | ')}`
          );
        }

        if (res.legendTitans.length) {
          console.warn(
            `[BattleScribe] Titans of Legend detected: ${res.legendTitans
              .map((t) => t.name)
              .join(' | ')}`
          );
        }
      } catch (e) {
        if (cancelled) return;
        console.warn('[BattleScribe] Failed to load titan templates from data source.', e);
        setRemoteTitanTemplates(null);
        setMissingMaxData([]);
        setWarnings(['Failed to load titan templates from data source.']);
        setLegendTitans([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const titanTemplates = useMemo(
    () => remoteTitanTemplates ?? [],
    [remoteTitanTemplates]
  );

  const legendTitanIds = useMemo(() => new Set(legendTitans.map((t) => t.id)), [legendTitans]);

  const titanTemplatesNonLegend = useMemo(() => {
    if (legendTitanIds.size === 0) return titanTemplates;
    return titanTemplates.filter((t) => !legendTitanIds.has(t.id));
  }, [legendTitanIds, titanTemplates]);

  // Additional “exclude from game for now” filters (still keep in `titanTemplates` so
  // existing saved units can be opened safely).
  const excludedTitanNameSubstrings = useMemo(
    () => ['warbreaker', 'great crusade', 'crusade'],
    []
  );

  const titanTemplatesPlayable = useMemo(() => {
    const excludes = excludedTitanNameSubstrings;
    return titanTemplatesNonLegend.filter((t) => {
      const n = (t.name || '').toLowerCase();
      return !excludes.some((s) => n.includes(s));
    });
  }, [excludedTitanNameSubstrings, titanTemplatesNonLegend]);

  return {
    titanTemplates,
    titanTemplatesNonLegend,
    titanTemplatesPlayable,
    missingMaxData,
    warnings,
    legendTitans,
    isLoading,
    reload,
    source: remoteTitanTemplates ? 'battlescribe' : 'none',
  } as const;
}


