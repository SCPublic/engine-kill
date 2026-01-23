import { UnitTemplate } from '../models/UnitTemplate';

// Local Titan templates are now intentionally minimal.
// We treat BSData (BattleScribe) as the source of truth for catalog-style values
// (points, weapon stats, void/heat/reactor maxima when available).
//
// We keep local data primarily for:
// - damage tracks / hit tables / critical effects (app-specific UX)
// - stable weapon IDs + disabled overlay metadata (repair/disabled roll lines)
export const titanTemplates: UnitTemplate[] = [
  {
    id: 'reaver',
    name: 'Reaver Titan',
    unitType: 'titan',
    defaultStats: {
      voidShields: { max: 4 },
      voidShieldSaves: ['3+', '4+', '4+', 'X'],
      maxHeat: 10,
      plasmaReactorMax: 5,
      damage: {
        head: {
          max: 5,
          armor: { directHit: 3, devastatingHit: 4, crit: 5 },
          hitTable: { directHit: '11-13', devastatingHit: '14-15', criticalHit: '16+' },
          modifiers: [null, null, null, null, null], // Placeholder - will be customized per titan
        },
        body: {
          max: 6,
          armor: { directHit: 4, devastatingHit: 5, crit: 6 },
          hitTable: { directHit: '10-11', devastatingHit: '12-13', criticalHit: '14+' },
          modifiers: [null, null, null, null, null, null], // Placeholder - will be customized per titan
        },
        legs: {
          max: 6,
          armor: { directHit: 3, devastatingHit: 4, crit: 5 },
          hitTable: { directHit: '10-12', devastatingHit: '13-14', criticalHit: '15+' },
          modifiers: [null, null, null, null, null, null], // Placeholder - will be customized per titan
        },
      },
      hasCarapaceWeapon: true,
      stats: {
        command: 3,
        ballisticSkill: 3,
        speed: '6"/10"',
        weaponSkill: 3,
        manoeuvre: '2/4',
        servitorClades: 2,
      },
      criticalEffects: {
        head: [
          { level: 1, effects: ['MIU Feedback'] },
          { level: 2, effects: ['MIU Feedback', 'Moderati Wounded'] },
          { level: 3, effects: ['Moderati Wounded', 'Princeps Wounded'] },
        ],
        body: [
          { level: 1, effects: ['Reactor Leak (1)'] },
          { level: 2, effects: ['Reactor Leak (1)', 'VSG Burnout'] },
          { level: 3, effects: ['Reactor Leak (2)', 'VSG Burnout'] },
        ],
        legs: [
          { level: 1, effects: ['Stabilisers Damaged'] },
          { level: 2, effects: ['Stabilisers Damaged', 'Locomotors Seized'] },
          { level: 3, effects: ['Immobilised'] },
        ],
      },
    },
    availableWeapons: [
      {
        id: 'gatling-blaster',
        name: 'Gatling Blaster',
        // NOTE: weapon stats are sourced from BSData when available.
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
      {
        id: 'laser-blaster',
        name: 'Laser Blaster',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
    ],
  },
  {
    id: 'warlord',
    name: 'Warlord Titan',
    unitType: 'titan',
    defaultStats: {
      voidShields: { max: 8 },
      voidShieldSaves: ['3+', '4+', '4+', '4+', '4+', '4+', '4+', 'X'],
      maxHeat: 12,
      plasmaReactorMax: 9,
      damage: {
        head: {
          max: 5,
          armor: { directHit: 4, devastatingHit: 5, crit: 6 },
          hitTable: { directHit: '11-13', devastatingHit: '14-15', criticalHit: '16+' },
          modifiers: [null, null, null, null, null], // Placeholder - will be customized per titan
        },
        body: {
          max: 6,
          armor: { directHit: 5, devastatingHit: 6, crit: 7 },
          hitTable: { directHit: '10-11', devastatingHit: '12-13', criticalHit: '14+' },
          modifiers: [null, null, null, null, null, null], // Placeholder - will be customized per titan
        },
        legs: {
          max: 6,
          armor: { directHit: 4, devastatingHit: 5, crit: 6 },
          hitTable: { directHit: '10-12', devastatingHit: '13-14', criticalHit: '15+' },
          modifiers: [null, null, null, null, null, null], // Placeholder - will be customized per titan
        },
      },
      hasCarapaceWeapon: true,
      stats: {
        command: 3,
        ballisticSkill: 3,
        speed: '4"/6"',
        weaponSkill: 5,
        manoeuvre: '1/2',
        servitorClades: 4,
      },
      criticalEffects: {
        head: [
          { level: 1, effects: ['MIU Feedback'] },
          { level: 2, effects: ['MIU Feedback', 'Moderati Wounded'] },
          { level: 3, effects: ['Moderati Wounded', 'Princeps Wounded'] },
        ],
        body: [
          { level: 1, effects: ['Reactor Leak (1)'] },
          { level: 2, effects: ['Reactor Leak (1)', 'VSG Burnout'] },
          { level: 3, effects: ['Reactor Leak (2)', 'VSG Burnout'] },
        ],
        legs: [
          { level: 1, effects: ['Stabilisers Damaged'] },
          { level: 2, effects: ['Stabilisers Damaged', 'Locomotors Seized'] },
          { level: 3, effects: ['Immobilised'] },
        ],
      },
    },
    availableWeapons: [
      {
        id: 'volcano-cannon',
        name: 'Volcano Cannon',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
      {
        id: 'plasma-annihilator',
        name: 'Plasma Annihilator',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
      {
        id: 'apocalypse-missile-launcher',
        name: 'Apocalypse Missile Launcher',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'carapace',
      },
    ],
  },
  // Starter template: Warmaster is currently a clone of Warlord until we fill in real data.
  {
    id: 'warmaster',
    name: 'Warmaster Titan',
    unitType: 'titan',
    defaultStats: {
      voidShields: { max: 7 },
      voidShieldSaves: ['3+', '3+', '3+', '3+', '4+', '4+', 'X'],
      maxHeat: 12,
      plasmaReactorMax: 8,
      // 8 pips: green green green yellow yellow orange orange red
      plasmaReactorColors: [
        '#4caf50',
        '#4caf50',
        '#4caf50',
        '#ffeb3b',
        '#ffeb3b',
        '#ff9800',
        '#ff9800',
        '#f44336',
      ],
      damage: {
        head: {
          max: 8,
          armor: { directHit: 4, devastatingHit: 5, crit: 6 },
          hitTable: { directHit: '11-13', devastatingHit: '14-15', criticalHit: '16+' },
          modifiers: [null, null, null, null, null, null, null, null],
        },
        body: {
          max: 9,
          armor: { directHit: 5, devastatingHit: 6, crit: 7 },
          hitTable: { directHit: '10-11', devastatingHit: '12-13', criticalHit: '14+' },
          modifiers: [null, null, null, null, null, null, null, null, null],
        },
        legs: {
          max: 9,
          armor: { directHit: 4, devastatingHit: 5, crit: 6 },
          hitTable: { directHit: '10-12', devastatingHit: '13-14', criticalHit: '15+' },
          modifiers: [null, null, null, null, null, null, null, null, null],
        },
      },
      hasCarapaceWeapon: true,
      stats: {
        command: 3,
        ballisticSkill: 3,
        speed: '4"/6"',
        weaponSkill: 5,
        manoeuvre: '1/3',
        servitorClades: 6,
      },
      criticalEffects: {
        head: [
          { level: 1, effects: ['MIU Feedback'] },
          { level: 2, effects: ['MIU Feedback', 'Moderati Wounded'] },
          { level: 3, effects: ['Moderati Wounded', 'Princeps Wounded'] },
        ],
        body: [
          { level: 1, effects: ['Reactor Leak (1)'] },
          { level: 2, effects: ['Reactor Leak (1)', 'VSG Burnout'] },
          { level: 3, effects: ['Reactor Leak (2)', 'VSG Burnout'] },
        ],
        legs: [
          { level: 1, effects: ['Stabilisers Damaged'] },
          { level: 2, effects: ['Stabilisers Damaged', 'Locomotors Seized'] },
          { level: 3, effects: ['Immobilised'] },
        ],
      },
    },
    availableWeapons: [
      {
        id: 'volcano-cannon',
        name: 'Volcano Cannon',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
      {
        id: 'plasma-annihilator',
        name: 'Plasma Annihilator',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
      {
        id: 'apocalypse-missile-launcher',
        name: 'Apocalypse Missile Launcher',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'carapace',
      },
    ],
  },
  {
    id: 'warhound',
    name: 'Warhound Titan',
    unitType: 'titan',
    specialRules: [
      'SQUADRON: Warhound Titans can be formed into Squadrons of 2-3 Titans.',
    ],
    defaultStats: {
      voidShields: { max: 2 },
      voidShieldSaves: ['3+', '4+', '4+', 'X'],
      maxHeat: 6,
      plasmaReactorMax: 5,
      damage: {
        head: {
          max: 5,
          armor: { directHit: 2, devastatingHit: 3, crit: 4 },
          hitTable: { directHit: '11-13', devastatingHit: '14-15', criticalHit: '16+' },
          modifiers: [null, null, 1, 2, 3], // Last 3 pips have +1, +2, +3
        },
        body: {
          max: 6,
          armor: { directHit: 3, devastatingHit: 4, crit: 5 },
          hitTable: { directHit: '10-11', devastatingHit: '12-13', criticalHit: '14+' },
          modifiers: [null, null, 1, 1, 2, 3], // Last 4 pips have +1, +1, +2, +3
        },
        legs: {
          max: 6,
          armor: { directHit: 2, devastatingHit: 3, crit: 4 },
          hitTable: { directHit: '10-12', devastatingHit: '13-14', criticalHit: '15+' },
          modifiers: [null, null, 1, 1, 2, 3], // Last 4 pips have +1, +1, +2, +3
        },
      },
      hasCarapaceWeapon: false,
      stats: {
        command: 5,
        ballisticSkill: 3,
        speed: '8"/12"',
        weaponSkill: 4,
        manoeuvre: '3/5',
        servitorClades: 2,
      },
      criticalEffects: {
        head: [
          { level: 1, effects: ['MIU Feedback'] },
          { level: 2, effects: ['MIU Feedback', 'Moderati Wounded'] },
          { level: 3, effects: ['Moderati Wounded', 'Princeps Wounded'] },
        ],
        body: [
          { level: 1, effects: ['Reactor Leak (1)'] },
          { level: 2, effects: ['Reactor Leak (1)', 'VSG Burnout'] },
          { level: 3, effects: ['Reactor Leak (2)', 'VSG Burnout'] },
        ],
        legs: [
          { level: 1, effects: ['Stabilisers Damaged'] },
          { level: 2, effects: ['Stabilisers Damaged', 'Locomotors Seized'] },
          { level: 3, effects: ['Immobilised'] },
        ],
      },
    },
    availableWeapons: [
      {
        id: 'plasma-blastgun',
        name: 'Plasma Blastgun',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
      {
        id: 'vulcan-mega-bolter',
        name: 'Vulcan Mega-Bolter',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
      {
        id: 'turbo-laser-destructor',
        name: 'Turbo Laser Destructor',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
      {
        id: 'inferno-gun',
        name: 'Inferno Gun',
        points: 0,
        shortRange: '-',
        longRange: '-',
        accuracyShort: '-',
        accuracyLong: '-',
        dice: 0,
        strength: 0,
        traits: [],
        specialRules: [],
        disabledRollLines: [
          '9-12: Detonation {Body, S7}',
          '13+: Detonation {Body, S9}',
        ],
        mountType: 'arm',
      },
    ],
  },
];

