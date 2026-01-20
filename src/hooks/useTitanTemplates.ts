import { useEffect, useMemo, useState } from 'react';
import { titanTemplates as localTitanTemplates } from '../data/titanTemplates';
import {
  loadAllTitanTemplatesFromBattleScribe,
  MissingChassisMaxData,
} from '../adapters/battlescribe/battlescribeAdapter';
import { UnitTemplate } from '../models/UnitTemplate';

export function useTitanTemplates() {
  const [remoteTitanTemplates, setRemoteTitanTemplates] = useState<UnitTemplate[] | null>(null);
  const [missingMaxData, setMissingMaxData] = useState<MissingChassisMaxData[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [legendTitans, setLegendTitans] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await loadAllTitanTemplatesFromBattleScribe();
        if (cancelled) return;
        setRemoteTitanTemplates(res.templates);
        setMissingMaxData(res.missingMaxData);
        setWarnings(res.warnings);
        setLegendTitans(res.legendTitans);

        // Helpful log for “what are we missing” without needing UI yet.
        if (res.missingMaxData.length) {
          console.warn(
            `[BattleScribe] Titans missing chassis max data: ${res.missingMaxData
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
        console.warn('[BattleScribe] Failed to load all titan templates; using local templates.', e);
        setRemoteTitanTemplates(null);
        setMissingMaxData([]);
        setWarnings(['Failed to load BattleScribe titan templates; using local templates.']);
        setLegendTitans([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const titanTemplates = useMemo(
    () => remoteTitanTemplates ?? localTitanTemplates,
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
    () => ['warbreaker', 'crusade'],
    []
  );

  const titanTemplatesPlayable = useMemo(() => {
    const excludes = excludedTitanNameSubstrings;
    return titanTemplatesNonLegend.filter((t) => {
      const n = (t.name || '').toLowerCase();
      return !excludes.some((s) => n.includes(s));
    });
  }, [excludedTitanNameSubstrings, titanTemplatesNonLegend]);

  const iconoclastTitans = useMemo(() => {
    return titanTemplates.filter((t) => (t.name || '').toLowerCase().includes('iconoclast'));
  }, [titanTemplates]);

  useEffect(() => {
    if (iconoclastTitans.length) {
      console.warn(
        `[BattleScribe] Iconoclast chassis detected: ${iconoclastTitans.map((t) => t.name).join(' | ')}`
      );
    } else if (remoteTitanTemplates) {
      console.warn('[BattleScribe] No Iconoclast chassis detected in loaded titan templates.');
    }
  }, [iconoclastTitans, remoteTitanTemplates]);

  return {
    titanTemplates,
    titanTemplatesNonLegend,
    titanTemplatesPlayable,
    missingMaxData,
    warnings,
    legendTitans,
    source: remoteTitanTemplates ? 'battlescribe' : 'local',
  } as const;
}


