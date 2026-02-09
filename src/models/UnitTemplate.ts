import { Weapon } from './Unit';

/** Armor roll ranges per hit type (e.g. "11-13", "14-15", "16+") from titan-data. */
export interface ArmorRolls {
  direct: string;
  devastating: string;
  critical: string;
}

/** Level 4 used for Warmaster head (4 crit tracks; first two share same effect as level 1). UI still shows 3 pips but can display 4 effect rows. */
export interface CriticalEffect {
  level: 1 | 2 | 3 | 4;
  effects: string[];
}

export interface UnitStats {
  command: number; // e.g., 5 for "5+"
  ballisticSkill: number; // e.g., 3 for "3+"
  speed: string; // e.g., "8\"/12\""
  weaponSkill: number; // e.g., 4 for "4+"
  manoeuvre: string; // e.g., "3/5"
  servitorClades: number; // e.g., 2
  [key: string]: any;
}

export interface WeaponTemplate {
  id: string;
  name: string;
  points: number; // Cost in points
  shortRange: number | string; // Can be number or "T" for template
  longRange: number | string; // Can be number or "-" for N/A
  accuracyShort: number | string; // Accuracy modifier for short range (can be "-", "+1", "-1", etc.)
  accuracyLong: number | string; // Accuracy modifier for long range
  dice: number; // Number of dice
  strength: number; // Strength value
  traits: string[]; // Weapon traits (e.g., "Blast{3\"}", "Rapid", "Maximal Fire")
  specialRules: string[]; // Special rules (e.g., "9+: Weapon Disabled")
  // Optional: used for the disabled weapon card overlay
  repairRoll?: string; // e.g., "4+"
  disabledRollLines?: string[]; // usually 2 lines, e.g. ["9-12: Detonation {Body, S7}", "13+: Detonation {Body, S9}"]
  mountType: 'arm' | 'carapace'; // Which mount this weapon can go on
}

export interface UnitTemplate {
  id: string; // e.g., 'reaver', 'warlord', 'questoris'
  name: string;
  unitType: 'titan' | 'banner';
  // Optional metadata for displaying summary info (kept optional for incremental data entry)
  scale?: number; // e.g., 6, 8, 10
  scaleName?: string; // e.g., "GRANDIS", "MAGNIFICUS"
  basePoints?: number; // points cost excluding weapons
  specialRules?: string[]; // Special rules for the titan (e.g., "SQUADRON: Warhound Titans can be formed into Squadrons of 2-3 Titans.")
  defaultStats: {
    voidShields: { max: number }; // e.g., Reaver = 4
    voidShieldSaves: string[]; // Save values for each shield (e.g., ["3+", "4+", "4+", "4+", "4+"])
    maxHeat: number;
    plasmaReactorMax: number; // Usually 5 for most Titans
    plasmaReactorColors?: string[]; // Optional per-pip color overrides (length should match plasmaReactorMax)
    damage: {
      head: { max: number; armorRolls: ArmorRolls; modifiers?: (number | null)[] };
      body: { max: number; armorRolls: ArmorRolls; modifiers?: (number | null)[] };
      legs: { max: number; armorRolls: ArmorRolls; modifiers?: (number | null)[] };
    };
    criticalEffects?: {
      head: CriticalEffect[];
      body: CriticalEffect[];
      legs: CriticalEffect[];
    };
    hasCarapaceWeapon: boolean; // Whether this Titan has a carapace weapon slot
    stats: UnitStats;
  };
  availableWeapons: WeaponTemplate[];
  /** If set, unit is created with this weapon in the left arm (from GST min=1 single-option group). */
  defaultLeftWeaponId?: string;
  /** If set, unit is created with this weapon in the right arm (from GST min=1 single-option group). */
  defaultRightWeaponId?: string;
}

