import { useCallback, useEffect, useMemo, useState } from 'react';
import { UnitTemplate } from '../models/UnitTemplate';
import { battleScribeCache } from '../services/battleScribeCache';

export function useBannerTemplates() {
  const initial = battleScribeCache.getBannerResultSnapshot();
  const [bannerTemplates, setBannerTemplates] = useState<UnitTemplate[] | null>(
    () => initial.result?.templates ?? null
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
        if (reloadToken === 0 && battleScribeCache.getBannerResultSnapshot().status === 'loaded') {
          if (!cancelled) setIsLoading(false);
          return;
        }
        if (!cancelled) setIsLoading(true);
        const res =
          reloadToken === 0 ? await battleScribeCache.loadBannersOnce() : await battleScribeCache.reloadBanners();
        if (cancelled) return;
        setBannerTemplates(res.templates);
        setWarnings(res.warnings);
      } catch (e) {
        if (cancelled) return;
        const message = e instanceof Error ? e.message : String(e);
        console.warn('[Templates] Failed to load banner templates.', e);
        setBannerTemplates(null);
        setWarnings([message || 'Failed to load banner templates from data source.']);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const templates = useMemo(() => bannerTemplates ?? [], [bannerTemplates]);

  return {
    bannerTemplates: templates,
    warnings,
    isLoading,
    reload,
    source: bannerTemplates ? 'templates' : 'none',
  } as const;
}
