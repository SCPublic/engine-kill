/**
 * Types for template loading used by the app (templatesLoader, templatesCache, hooks).
 * Defined here so the app runtime does not depend on the generator adapter or titanDataOverrides.
 */

import type { LegionTemplate } from '../models/LegionTemplate';
import type { ManipleTemplate } from '../models/ManipleTemplate';
import type { PrincepsTraitTemplate } from '../models/PrincepsTraitTemplate';
import type { UnitTemplate, WeaponTemplate } from '../models/UnitTemplate';
import type { UpgradeTemplate } from '../models/UpgradeTemplate';

export interface MissingChassisMaxData {
  id: string;
  name: string;
  missing: Array<'voidShieldsMax' | 'plasmaReactorMax' | 'maxHeat'>;
}

export interface AllTitansLoadResult {
  templates: UnitTemplate[];
  warnings: string[];
  missingMaxData: MissingChassisMaxData[];
  legendTitans: Array<{ id: string; name: string }>;
}

export interface ManiplesLoadResult {
  maniples: ManipleTemplate[];
  warnings: string[];
}

export interface LegionsLoadResult {
  legions: LegionTemplate[];
  warnings: string[];
}

export interface UpgradesLoadResult {
  upgrades: UpgradeTemplate[];
  warnings: string[];
}

export interface PrincepsTraitsLoadResult {
  traits: PrincepsTraitTemplate[];
  warnings: string[];
}

export interface WeaponsLoadResult {
  weapons: WeaponTemplate[];
  warnings: string[];
  specialRules: string[];
}
