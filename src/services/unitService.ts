import { Unit, Weapon } from '../models/Unit';
import { UnitTemplate, WeaponTemplate } from '../models/UnitTemplate';
import { storageService } from './storageService';

export const unitService = {
  // Create a unit from a template
  createUnitFromTemplate(
    template: UnitTemplate,
    playerId: string,
    name?: string
  ): Unit {
    const unitId = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: unitId,
      name: name || template.name,
      unitType: template.unitType,
      templateId: template.id,
      playerId,
      sessionId: null,
      isLocal: true,
      voidShields: {
        front: 1, // Start with leftmost (front) selected by default
        left: 0,
        right: 0,
        rear: 0,
        max: template.defaultStats.voidShields.max,
      },
      voidShieldSaves: template.defaultStats.voidShieldSaves || [],
      heat: 0,
      maxHeat: template.defaultStats.maxHeat,
      plasmaReactor: {
        current: 1, // First dot always filled (same as void shields)
        max: template.defaultStats.plasmaReactorMax || 5,
      },
      damage: {
        head: {
          current: 1, // Default to 1 pip filled
          max: template.defaultStats.damage.head.max,
          armor: template.defaultStats.damage.head.armor,
          criticals: {
            yellow: null,
            orange: null,
            red: null,
          },
        },
        body: {
          current: 1, // Default to 1 pip filled
          max: template.defaultStats.damage.body.max,
          armor: template.defaultStats.damage.body.armor,
          criticals: {
            yellow: null,
            orange: null,
            red: null,
          },
        },
        legs: {
          current: 1, // Default to 1 pip filled
          max: template.defaultStats.damage.legs.max,
          armor: template.defaultStats.damage.legs.armor,
          criticals: {
            yellow: null,
            orange: null,
            red: null,
          },
        },
      },
      leftWeapon: null,
      rightWeapon: null,
      ...(template.defaultStats.hasCarapaceWeapon && { carapaceWeapon: null }),
      stats: { ...template.defaultStats.stats },
    };
  },

  // Validate and update unit values
  updateVoidShield(
    unit: Unit,
    facing: 'front' | 'left' | 'right' | 'rear',
    value: number
  ): Unit {
    const newValue = Math.max(0, Math.min(value, unit.voidShields.max));
    return {
      ...unit,
      voidShields: {
        ...unit.voidShields,
        [facing]: newValue,
      },
    };
  },

  updateDamage(
    unit: Unit,
    location: 'head' | 'body' | 'legs',
    value: number
  ): Unit {
    const max = unit.damage[location].max;
    const newValue = Math.max(1, Math.min(value, max)); // Minimum is 1, not 0
    return {
      ...unit,
      damage: {
        ...unit.damage,
        [location]: {
          ...unit.damage[location],
          current: newValue,
        },
      },
    };
  },

  updateHeat(unit: Unit, value: number): Unit {
    const newValue = Math.max(0, Math.min(value, unit.maxHeat));
    return {
      ...unit,
      heat: newValue,
    };
  },

  updateCriticalDamage(
    unit: Unit,
    location: 'head' | 'body' | 'legs',
    level: 'yellow' | 'orange' | 'red' | null
  ): Unit {
    // Clear all criticals first, then set the selected one
    const newCriticals = {
      yellow: null,
      orange: null,
      red: null,
    };
    
    if (level) {
      // Set the selected critical level (we'll use a placeholder effect for now)
      newCriticals[level] = {
        level,
        effect: '', // Effect can be filled in later
        applied: true,
      };
    }
    
    return {
      ...unit,
      damage: {
        ...unit.damage,
        [location]: {
          ...unit.damage[location],
          criticals: newCriticals,
        },
      },
    };
  },

  createWeaponFromTemplate(template: WeaponTemplate): Weapon {
    const cleanName = (name: string) =>
      name
        // remove "+=...=" tags
        .replace(/\s*\+=.*?=\s*/g, ' ')
        // remove standalone "=...=" tags
        .replace(/\s*=\s*[^=]+?\s*=\s*/g, ' ')
        // remove bracket tags like "[WH]", "[RVR]" etc
        .replace(/\s*\[[^[\]]+\]\s*/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    return {
      id: template.id,
      name: cleanName(template.name),
      points: template.points,
      shortRange: template.shortRange,
      longRange: template.longRange,
      accuracyShort: template.accuracyShort,
      accuracyLong: template.accuracyLong,
      dice: template.dice,
      strength: template.strength,
      traits: template.traits,
      specialRules: template.specialRules,
      repairRoll: template.repairRoll,
      disabledRollLines: template.disabledRollLines,
      status: 'ready',
    };
  },

  updateWeapon(
    unit: Unit,
    mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon',
    weapon: Weapon | null
  ): Unit {
    return {
      ...unit,
      [mount]: weapon,
    };
  },
};

