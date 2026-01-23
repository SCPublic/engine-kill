export interface Weapon {
  id: string;
  name: string;
  points: number; // Cost in points
  // Range stats
  shortRange: number | string; // Can be number or "T" for template
  longRange: number | string; // Can be number or "-" for N/A
  // Accuracy modifiers (separate for short and long range)
  accuracyShort: number | string; // Accuracy modifier for short range
  accuracyLong: number | string; // Accuracy modifier for long range
  // Attack stats
  dice: number; // Number of dice
  strength: number; // Strength value
  // Traits and rules
  traits: string[]; // Weapon traits (e.g., "Blast{3\"}", "Rapid")
  specialRules: string[]; // Special rules (e.g., "9+: Weapon Disabled")
  // Status tracking
  status: 'ready' | 'fired' | 'disabled' | 'destroyed';
  // Optional: used for the disabled weapon card overlay
  repairRoll?: string; // e.g., "4+"
  disabledRollLines?: string[]; // usually 2 lines
  // Additional weapon-specific stats (extensible)
  [key: string]: any;
}

export interface ArmorValues {
  directHit: number;
  devastatingHit: number;
  crit: number;
}

export interface CriticalDamage {
  level: 'yellow' | 'orange' | 'red';
  effect: string; // Description of the critical effect
  applied: boolean;
}

export interface DamageLocation {
  current: number;
  max: number;
  // Armor values
  armor: ArmorValues;
  // Critical damage levels (yellow, orange, red) - each has different effects
  criticals: {
    yellow: CriticalDamage | null;
    orange: CriticalDamage | null;
    red: CriticalDamage | null;
  };
}

export interface UnitUpgrade {
  id: string; // BattleScribe selectionEntry id (prefixed for stability)
  name: string;
  points: number;
  rules?: string[];
}

export interface PrincepsTrait {
  id: string;
  name: string;
  rules: string[];
}

export interface Unit {
  id: string;
  name: string;
  unitType: 'titan' | 'banner'; // Titan or Banner/Knight
  templateId: string; // Reference to template (e.g., 'reaver', 'warlord', 'questoris')
  battlegroupId?: string | null; // which battlegroup this unit belongs to
  playerId: string;
  sessionId: string | null; // null if not in a session
  isLocal: boolean; // true if stored locally, false if synced
  
  // Void Shields
  voidShields: {
    front: number;
    left: number;
    right: number;
    rear: number;
    max: number;
  };
  
  // Heat
  heat: number;
  maxHeat: number;
  
  // Plasma Reactor heat tracking
  plasmaReactor: {
    current: number;
    max: number;
  };
  
  // Void Shield save values (e.g., "3+", "4+")
  voidShieldSaves: string[];
  
  // Damage Locations with Armor and Critical Levels
  damage: {
    head: DamageLocation;
    body: DamageLocation;
    legs: DamageLocation; // Single legs location (not left/right separate)
  };
  
  // Weapons - fixed positions for Titans
  leftWeapon: Weapon | null;
  rightWeapon: Weapon | null;
  carapaceWeapon?: Weapon | null; // Optional, not all Titans have this

  // Titan configuration
  isPrincepsSeniores?: boolean;
  princepsTrait?: PrincepsTrait | null;
  upgrades?: UnitUpgrade[];
  
  // Stats
  stats: {
    command: number; // Command value (e.g., 5+)
    ballisticSkill: number; // Ballistic Skill (e.g., 3+)
    speed: string; // Speed (e.g., "8\"/12\"")
    weaponSkill: number; // Weapon Skill (e.g., 4+)
    manoeuvre: string; // Manoeuvre (e.g., "3/5")
    servitorClades: number; // Servitor Clades (e.g., 2)
    // ... other game stats (extensible)
    [key: string]: any;
  };
}

