import { UnitTemplate } from '../models/UnitTemplate';

// Basic Banner/Knight templates - these can be expanded with full game data
export const bannerTemplates: UnitTemplate[] = [
  {
    id: 'questoris',
    name: 'Questoris Knight',
    unitType: 'banner',
    defaultStats: {
      voidShields: { max: 1 },
      maxHeat: 4,
      damage: {
        head: { max: 3, armor: { directHit: 2, devastatingHit: 3, crit: 4 } },
        body: { max: 6, armor: { directHit: 3, devastatingHit: 4, crit: 5 } },
        legs: { max: 4, armor: { directHit: 2, devastatingHit: 3, crit: 4 } },
      },
      hasCarapaceWeapon: false,
      stats: {
        movement: 10,
        command: 5,
        ballistic: 5,
        weapon: 5,
      },
    },
    availableWeapons: [
      {
        id: 'reaper-chainsword',
        name: 'Reaper Chainsword',
        shortRange: 0,
        longRange: 0,
        accuracyModifier: 0,
        specialRules: ['Melee'],
      },
      {
        id: 'thermal-cannon',
        name: 'Thermal Cannon',
        shortRange: 12,
        longRange: 24,
        accuracyModifier: 0,
        specialRules: ['Overheat'],
      },
    ],
  },
  {
    id: 'cerastus',
    name: 'Cerastus Knight',
    unitType: 'banner',
    defaultStats: {
      voidShields: { max: 1 },
      maxHeat: 5,
      damage: {
        head: { max: 4, armor: { directHit: 2, devastatingHit: 3, crit: 4 } },
        body: { max: 8, armor: { directHit: 3, devastatingHit: 4, crit: 5 } },
        legs: { max: 5, armor: { directHit: 2, devastatingHit: 3, crit: 4 } },
      },
      hasCarapaceWeapon: false,
      stats: {
        movement: 12,
        command: 4,
        ballistic: 4,
        weapon: 4,
      },
    },
    availableWeapons: [
      {
        id: 'lance',
        name: 'Lance',
        shortRange: 0,
        longRange: 0,
        accuracyModifier: 0,
        specialRules: ['Melee', 'Lance'],
      },
      {
        id: 'autocannon',
        name: 'Autocannon',
        shortRange: 15,
        longRange: 30,
        accuracyModifier: 0,
        specialRules: ['Rapid Fire'],
      },
    ],
  },
];


