/**
 * Single loader for app-ready templates from titan-data.
 * Fetches templates.json from the titan-data repo root
 * and returns typed titans, banners, maniples, legions, upgrades, princepsTraits, and warnings.
 * No override/merge at runtime; all template data comes from this file.
 */

import type { LegionTemplate } from '../models/LegionTemplate';
import type { ManipleTemplate } from '../models/ManipleTemplate';
import type { PrincepsTraitTemplate } from '../models/PrincepsTraitTemplate';
import type { UnitTemplate } from '../models/UnitTemplate';
import type { UpgradeTemplate } from '../models/UpgradeTemplate';

export interface TemplatesPayload {
  titans: UnitTemplate[];
  banners: UnitTemplate[];
  maniples: ManipleTemplate[];
  legions: LegionTemplate[];
  upgrades: UpgradeTemplate[];
  princepsTraits: PrincepsTraitTemplate[];
  warnings: string[];
}

/**
 * Fetches and parses templates.json from titan-data.
 * @param baseUrl - Root URL for titan-data (e.g. DEFAULT_DATA_BASE_URL), with or without trailing slash
 * @returns Payload in the shapes the app uses (titans, banners, maniples, legions, upgrades, princepsTraits, warnings)
 */
export async function loadTemplatesFromJson(baseUrl: string): Promise<TemplatesPayload> {
  const base = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const url = `${base}templates.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to load templates: ${res.status} ${res.statusText} (${url})`);
  }
  const raw = (await res.json()) as unknown;
  if (!raw || typeof raw !== 'object' || !('titans' in raw)) {
    throw new Error('Invalid templates.json: missing titans');
  }
  const o = raw as Record<string, unknown>;
  return {
    titans: Array.isArray(o.titans) ? (o.titans as UnitTemplate[]) : [],
    banners: Array.isArray(o.banners) ? (o.banners as UnitTemplate[]) : [],
    maniples: Array.isArray(o.maniples) ? (o.maniples as ManipleTemplate[]) : [],
    legions: Array.isArray(o.legions) ? (o.legions as LegionTemplate[]) : [],
    upgrades: Array.isArray(o.upgrades) ? (o.upgrades as UpgradeTemplate[]) : [],
    princepsTraits: Array.isArray(o.princepsTraits) ? (o.princepsTraits as PrincepsTraitTemplate[]) : [],
    warnings: Array.isArray(o.warnings) ? (o.warnings as string[]) : [],
  };
}
