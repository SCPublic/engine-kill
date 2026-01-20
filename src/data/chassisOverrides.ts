export type ChassisOverride = {
  plasmaReactorMax?: number; // also used as maxHeat in our model
  voidShieldsMax?: number;
  voidShieldSaves?: string[];
};

/**
 * Local overrides for chassis “max track” values when BSData doesn’t provide them reliably.
 *
 * Source: values you provided from the physical/reference cards.
 * Note: `maxHeat` is derived from `plasmaReactorMax` in our model.
 */
export const chassisOverridesByTemplateId: Record<string, ChassisOverride> = {
  // Core
  warhound: {
    plasmaReactorMax: 5,
    voidShieldsMax: 4,
    voidShieldSaves: ['3+', '4+', '4+', 'X'],
  },
  reaver: {
    plasmaReactorMax: 6,
    voidShieldsMax: 5,
    voidShieldSaves: ['3+', '3+', '4+', '4+', 'X'],
  },
  warlord: {
    plasmaReactorMax: 7,
    voidShieldsMax: 6,
    voidShieldSaves: ['3+', '3+', '3+', '4+', '4+', 'X'],
  },
  warmaster: {
    plasmaReactorMax: 8,
    voidShieldsMax: 7,
    voidShieldSaves: ['3+', '3+', '3+', '3+', '4+', '4+', 'X'],
  },

  // Additional chassis
  warbringer: {
    plasmaReactorMax: 7,
    voidShieldsMax: 6,
    voidShieldSaves: ['3+', '3+', '4+', '4+', '4+', 'X'],
  },

  // Per your latest correction
  'dire-wolf': {
    plasmaReactorMax: 6,
    voidShieldsMax: 4,
    voidShieldSaves: ['3+', '4+', '4+', 'X'],
  },
};


