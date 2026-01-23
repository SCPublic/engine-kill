import AsyncStorage from '@react-native-async-storage/async-storage';
import { Unit, UnitUpgrade, PrincepsTrait } from '../models/Unit';
import { Maniple } from '../models/Maniple';
import { Battlegroup } from '../models/Battlegroup';
import { STORAGE_KEYS } from '../utils/constants';

function parseBooleanLike(value: unknown, defaultValue: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value === 'true';
  if (value === undefined || value === null) return defaultValue;
  return !!value;
}

function parseIsLocal(value: unknown): boolean {
  // Default to true unless explicitly false.
  if (value === false) return false;
  if (value === 'false') return false;
  if (value === 'true') return true;
  return true;
}

export const storageService = {
  // Units
  async saveUnits(units: Unit[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(units);
      await AsyncStorage.setItem(STORAGE_KEYS.UNITS, jsonValue);
    } catch (error) {
      console.error('Error saving units:', error);
      throw error;
    }
  },

  async loadUnits(): Promise<Unit[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.UNITS);
      if (!jsonValue) return [];
      
      const units = JSON.parse(jsonValue);
      // Ensure all boolean fields are actually booleans (defensive parsing)
      const sanitizeCritical = (crit: any) => {
        if (!crit) return null;
        return {
          ...crit,
          applied: parseBooleanLike(crit.applied, false),
        };
      };

      const sanitizeLocation = (loc: any) => {
        if (!loc) return loc;
        return {
          ...loc,
          criticals: {
            yellow: sanitizeCritical(loc.criticals?.yellow),
            orange: sanitizeCritical(loc.criticals?.orange),
            red: sanitizeCritical(loc.criticals?.red),
          },
        };
      };

      return units.map((unit: any) => ({
        ...unit,
        isLocal: parseIsLocal(unit.isLocal),
        battlegroupId: unit.battlegroupId !== undefined && unit.battlegroupId !== null ? String(unit.battlegroupId) : null,
        isPrincepsSeniores: parseBooleanLike(unit.isPrincepsSeniores, false),
        princepsTrait: unit.princepsTrait
          ? ({
              id: String(unit.princepsTrait.id ?? ''),
              name: String(unit.princepsTrait.name ?? '').trim(),
              rules: Array.isArray(unit.princepsTrait.rules) ? unit.princepsTrait.rules.map(String) : [],
            } as PrincepsTrait)
          : null,
        upgrades: (Array.isArray(unit.upgrades) ? unit.upgrades : []).map((u: any): UnitUpgrade => ({
          id: String(u.id ?? ''),
          name: String(u.name ?? '').trim(),
          points: Number(u.points ?? 0) || 0,
          rules: Array.isArray(u.rules) ? u.rules.map(String) : undefined,
        })).filter((u: UnitUpgrade) => !!u.id && !!u.name),
        damage: {
          ...unit.damage,
          head: sanitizeLocation(unit.damage?.head),
          body: sanitizeLocation(unit.damage?.body),
          legs: sanitizeLocation(unit.damage?.legs),
        },
      }));
    } catch (error) {
      console.error('Error loading units:', error);
      return [];
    }
  },

  // Maniples
  async saveManiples(maniples: Maniple[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(maniples);
      await AsyncStorage.setItem(STORAGE_KEYS.MANIPLES, jsonValue);
    } catch (error) {
      console.error('Error saving maniples:', error);
      throw error;
    }
  },

  async loadManiples(): Promise<Maniple[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.MANIPLES);
      if (!jsonValue) return [];
      const maniples = JSON.parse(jsonValue);

      // Defensive parsing / defaults
      return (Array.isArray(maniples) ? maniples : []).map((m: any) => ({
        ...m,
        isLocal: parseIsLocal(m.isLocal),
        battlegroupId: m.battlegroupId !== undefined && m.battlegroupId !== null ? String(m.battlegroupId) : null,
        legionId: m.legionId !== undefined && m.legionId !== null ? String(m.legionId) : null,
        titanUnitIds: Array.isArray(m.titanUnitIds) ? m.titanUnitIds : [],
        createdAt: typeof m.createdAt === 'number' ? m.createdAt : Date.now(),
      }));
    } catch (error) {
      console.error('Error loading maniples:', error);
      return [];
    }
  },

  // Battlegroups (previously called "rosters")
  async saveBattlegroups(battlegroups: Battlegroup[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(battlegroups);
      await AsyncStorage.setItem(STORAGE_KEYS.BATTLEGROUPS, jsonValue);
    } catch (error) {
      console.error('Error saving battlegroups:', error);
      throw error;
    }
  },

  async loadBattlegroups(): Promise<Battlegroup[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.BATTLEGROUPS);
      if (!jsonValue) return [];
      const battlegroups = JSON.parse(jsonValue);
      return (Array.isArray(battlegroups) ? battlegroups : [])
        .map((bg: any) => ({
          id: String(bg.id ?? ''),
          name: String(bg.name ?? '').trim(),
          createdAt: typeof bg.createdAt === 'number' ? bg.createdAt : Date.now(),
        }))
        .filter((bg: Battlegroup) => !!bg.id && !!bg.name);
    } catch (error) {
      console.error('Error loading battlegroups:', error);
      return [];
    }
  },

  async saveActiveBattlegroupId(battlegroupId: string | null): Promise<void> {
    try {
      if (!battlegroupId) {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_BATTLEGROUP_ID);
        return;
      }
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_BATTLEGROUP_ID, battlegroupId);
    } catch (error) {
      console.error('Error saving active battlegroup id:', error);
    }
  },

  async loadActiveBattlegroupId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_BATTLEGROUP_ID);
    } catch (error) {
      console.error('Error loading active battlegroup id:', error);
      return null;
    }
  },

  // Player ID
  async savePlayerId(playerId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_ID, playerId);
    } catch (error) {
      console.error('Error saving player ID:', error);
    }
  },

  async loadPlayerId(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_ID);
    } catch (error) {
      console.error('Error loading player ID:', error);
      return null;
    }
  },

  // Player Name
  async savePlayerName(name: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.PLAYER_NAME, name);
    } catch (error) {
      console.error('Error saving player name:', error);
    }
  },

  async loadPlayerName(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.PLAYER_NAME);
    } catch (error) {
      console.error('Error loading player name:', error);
      return null;
    }
  },

  // Clear all storage (for debugging)
  async clearAll(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.UNITS,
        STORAGE_KEYS.MANIPLES,
        STORAGE_KEYS.BATTLEGROUPS,
        STORAGE_KEYS.ACTIVE_BATTLEGROUP_ID,
        STORAGE_KEYS.PLAYER_ID,
        STORAGE_KEYS.PLAYER_NAME,
      ]);
      console.log('All storage cleared');
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  },
};

