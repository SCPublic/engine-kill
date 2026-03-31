import type { Unit } from '../models/Unit';
import type { UnitTemplate } from '../models/UnitTemplate';

/** Points for a titan unit (base + weapons + upgrades). */
export function getTitanTotalPoints(unit: Unit, titanTemplates: UnitTemplate[]): number {
  if (unit.unitType !== 'titan') return 0;
  const tpl = titanTemplates.find((t) => t.id === unit.templateId);
  const base = tpl?.basePoints ?? 0;
  const weapons =
    (unit.leftWeapon?.points ?? 0) + (unit.rightWeapon?.points ?? 0) + (unit.carapaceWeapon?.points ?? 0);
  const upgrades = (unit.upgrades ?? []).reduce((sum, u) => sum + (u.points ?? 0), 0);
  return base + weapons + upgrades;
}

/**
 * Points for a banner unit (base + knights + weapon ids + meltagun/stormspear optional rows + upgrades).
 * Keeps meltagun/stormspear lookups aligned with HomeScreen / legacy `bannerMeltagunCount` fields.
 */
export function getBannerTotalPoints(unit: Unit, bannerTemplates: UnitTemplate[]): number {
  if (unit.unitType !== 'banner') return 0;
  const template = bannerTemplates.find((t) => t.id === unit.templateId);
  if (!template) return 0;
  const minK = template.minKnights ?? 3;
  const maxK = template.maxKnights ?? 6;
  const basePts = template.bannerBasePoints ?? 120;
  const ptsPerKnight = template.bannerPointsPerKnight ?? 35;
  const K = Math.min(maxK, Math.max(minK, unit.bannerKnightCount ?? minK));
  const effectiveWeapons = template.availableWeapons ?? [];
  const weaponIds = unit.bannerWeaponIds ?? [];
  const weaponPts = weaponIds.reduce(
    (sum, id) => sum + (effectiveWeapons.find((w) => w.id === id)?.points ?? 0),
    0
  );
  const meltagun = Math.min(K, Math.max(0, unit.bannerMeltagunCount ?? 0));
  const stormspear = Math.min(K, Math.max(0, unit.bannerStormspearCount ?? 0));
  const meltagunPts = (effectiveWeapons.find((w) => w.id === 'meltaguns')?.points ?? 5) * meltagun;
  const stormspearPts =
    (effectiveWeapons.find((w) => w.id === 'stormspear-rocket-pod')?.points ?? 5) * stormspear;
  const upgrades = (unit.upgrades ?? []).reduce((sum, u) => sum + (u.points ?? 0), 0);
  return basePts + (K - minK) * ptsPerKnight + weaponPts + meltagunPts + stormspearPts + upgrades;
}

export function getUnitTotalPoints(
  unit: Unit,
  titanTemplates: UnitTemplate[],
  bannerTemplates: UnitTemplate[]
): number {
  if (unit.unitType === 'titan') return getTitanTotalPoints(unit, titanTemplates);
  if (unit.unitType === 'banner') return getBannerTotalPoints(unit, bannerTemplates);
  return 0;
}
