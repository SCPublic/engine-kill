import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Unit, Weapon } from '../models/Unit';
import { Maniple } from '../models/Maniple';
import { Battlegroup } from '../models/Battlegroup';
import { storageService } from '../services/storageService';
import { unitService } from '../services/unitService';
import { UnitTemplate } from '../models/UnitTemplate';
import { ManipleTemplate } from '../models/ManipleTemplate';
import { useManipleTemplates } from '../hooks/useManipleTemplates';

interface GameState {
  battlegroups: Battlegroup[];
  activeBattlegroupId: string | null;
  units: Unit[];
  maniples: Maniple[];
  playerId: string | null;
  playerName: string | null;
  isLoading: boolean;
}

type GameAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PLAYER_ID'; payload: string }
  | { type: 'SET_PLAYER_NAME'; payload: string }
  | { type: 'LOAD_BATTLEGROUPS'; payload: Battlegroup[] }
  | { type: 'SET_ACTIVE_BATTLEGROUP_ID'; payload: string | null }
  | { type: 'ADD_BATTLEGROUP'; payload: Battlegroup }
  | { type: 'RENAME_BATTLEGROUP'; payload: { id: string; name: string } }
  | { type: 'DELETE_BATTLEGROUP'; payload: string }
  | { type: 'LOAD_UNITS'; payload: Unit[] }
  | { type: 'ADD_UNIT'; payload: Unit }
  | { type: 'UPDATE_UNIT'; payload: Unit }
  | { type: 'DELETE_UNIT'; payload: string }
  | { type: 'LOAD_MANIPLES'; payload: Maniple[] }
  | { type: 'ADD_MANIPLE'; payload: Maniple }
  | { type: 'UPDATE_MANIPLE'; payload: Maniple }
  | { type: 'DELETE_MANIPLE'; payload: string }
  | { type: 'INITIALIZE_PLAYER' };

const initialState: GameState = {
  battlegroups: [],
  activeBattlegroupId: null,
  units: [],
  maniples: [],
  playerId: null,
  playerName: null,
  isLoading: true, // Explicit boolean, not Boolean() wrapper
};

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
        case 'SET_LOADING':
          return { ...state, isLoading: !!action.payload }; // Convert to boolean using !!
    case 'LOAD_BATTLEGROUPS':
      return { ...state, battlegroups: action.payload };
    case 'SET_ACTIVE_BATTLEGROUP_ID':
      return { ...state, activeBattlegroupId: action.payload };
    case 'ADD_BATTLEGROUP':
      return { ...state, battlegroups: [...state.battlegroups, action.payload] };
    case 'RENAME_BATTLEGROUP':
      return {
        ...state,
        battlegroups: state.battlegroups.map((bg) =>
          bg.id === action.payload.id ? { ...bg, name: action.payload.name } : bg
        ),
      };
    case 'DELETE_BATTLEGROUP':
      return {
        ...state,
        battlegroups: state.battlegroups.filter((bg) => bg.id !== action.payload),
        activeBattlegroupId: state.activeBattlegroupId === action.payload ? null : state.activeBattlegroupId,
      };
    case 'SET_PLAYER_ID':
      return { ...state, playerId: action.payload };
    case 'SET_PLAYER_NAME':
      return { ...state, playerName: action.payload };
    case 'LOAD_UNITS':
      return { ...state, units: action.payload };
    case 'LOAD_MANIPLES':
      return { ...state, maniples: action.payload };
    case 'ADD_UNIT':
      return { ...state, units: [...state.units, action.payload] };
    case 'UPDATE_UNIT':
      return {
        ...state,
        units: state.units.map((u) =>
          u.id === action.payload.id ? action.payload : u
        ),
      };
    case 'DELETE_UNIT':
      return {
        ...state,
        units: state.units.filter((u) => u.id !== action.payload),
      };
    case 'ADD_MANIPLE':
      return { ...state, maniples: [...state.maniples, action.payload] };
    case 'UPDATE_MANIPLE':
      return {
        ...state,
        maniples: state.maniples.map((m) => (m.id === action.payload.id ? action.payload : m)),
      };
    case 'DELETE_MANIPLE':
      return {
        ...state,
        maniples: state.maniples.filter((m) => m.id !== action.payload),
      };
    case 'INITIALIZE_PLAYER':
      return state;
    default:
      return state;
  }
}

interface GameContextType {
  state: GameState;
  createBattlegroup: (name: string) => Promise<Battlegroup>;
  renameBattlegroup: (battlegroupId: string, name: string) => Promise<void>;
  deleteBattlegroupById: (battlegroupId: string) => Promise<void>;
  setActiveBattlegroupId: (battlegroupId: string | null) => Promise<void>;
  addUnitFromTemplate: (template: UnitTemplate, name?: string) => Promise<void>;
  addTitanFromTemplateToManiple: (manipleId: string, template: UnitTemplate, name?: string) => Promise<void>;
  duplicateTitan: (unitId: string, nameOverride?: string) => Promise<{ unitId: string; attachedManipleId: string | null }>;
  updateUnit: (unit: Unit) => Promise<void>;
  deleteUnit: (unitId: string) => Promise<void>;
  updateVoidShield: (unitId: string, facing: 'front' | 'left' | 'right' | 'rear', value: number) => Promise<void>;
  updateVoidShieldCount: (unitId: string, activeCount: number) => Promise<void>;
  updateVoidShieldByIndex: (unitId: string, selectedIndex: number) => Promise<void>;
  updateDamage: (unitId: string, location: 'head' | 'body' | 'legs', value: number) => Promise<void>;
  updateCriticalDamage: (unitId: string, location: 'head' | 'body' | 'legs', level: 'yellow' | 'orange' | 'red' | null) => Promise<void>;
  updateWeapon: (unitId: string, mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon', weapon: Weapon | null) => Promise<void>;
  updateHeat: (unitId: string, value: number) => Promise<void>;
  updatePlasmaReactor: (unitId: string, value: number) => Promise<void>;
  setPlayerName: (name: string) => Promise<void>;

  // Maniples (WIP)
  // We'll keep the API small for now; more rules/validation comes later.
  addManipleFromTemplate: (template: ManipleTemplate, name?: string, legionId?: string | null) => Promise<void>;
  addManiple: (maniple: Maniple) => Promise<void>;
  updateManiple: (maniple: Maniple) => Promise<void>;
  deleteManiple: (manipleId: string) => Promise<void>;
  addTitanToManiple: (manipleId: string, unitId: string) => Promise<void>;
  removeTitanFromManiple: (manipleId: string, unitId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  console.log('GameProvider: Component function called');
  const [state, dispatch] = useReducer(gameReducer, initialState);
  console.log('GameProvider: useReducer initialized, state.isLoading:', typeof state.isLoading, state.isLoading);
  const { manipleTemplates } = useManipleTemplates();

  // Initialize: Load player ID and units
  useEffect(() => {
    async function initialize() {
      try {
        console.log('GameProvider: Starting initialization');
        // Clear all storage for fresh start
        // await storageService.clearAll(); // Disabled for production
        console.log('GameProvider: Storage cleared');
        dispatch({ type: 'SET_LOADING', payload: true });
        
        // Load or create player ID
        let playerId = await storageService.loadPlayerId();
        if (!playerId) {
          playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await storageService.savePlayerId(playerId);
        }
        dispatch({ type: 'SET_PLAYER_ID', payload: playerId });

        // Load player name
        const playerName = await storageService.loadPlayerName();
        if (playerName) {
          dispatch({ type: 'SET_PLAYER_NAME', payload: playerName });
        }

        // Load units and migrate old units to have new fields
        const units = await storageService.loadUnits();
        // Ensure all units have proper types (defensive check)
        const validatedUnits = units.map(unit => ({
          ...unit,
          // Ensure boolean-like fields are actually booleans
          isLocal: !!(unit.isLocal !== false), // Default to true if undefined/null
        }));
        const migratedUnits = validatedUnits.map(unit => {
          let needsUpdate = false;
          
          // Add plasmaReactor if missing
          if (!unit.plasmaReactor) {
            unit.plasmaReactor = {
              current: 0, // Default to 0 (empty)
              max: 5, // Default to 5, will be overridden by template if needed
            };
            needsUpdate = true;
          }
          // Add voidShieldSaves if missing
          if (!unit.voidShieldSaves || unit.voidShieldSaves.length === 0) {
            unit.voidShieldSaves = ['3+', '4+', '4+', 'X'];
            needsUpdate = true;
          }
          // Reset void shields - if they're at max (old units), set to default (leftmost selected)
          // Check if any facing is at max - if so, reset to default (front=1, others=0)
          if (unit.voidShields.front === unit.voidShields.max || 
              unit.voidShields.left === unit.voidShields.max ||
              unit.voidShields.right === unit.voidShields.max) {
            unit.voidShields = {
              ...unit.voidShields,
              front: 1, // Default to leftmost selected
              left: 0,
              right: 0,
              rear: 0,
            };
            needsUpdate = true;
          }
          // If no shields are active, default to leftmost
          if (unit.voidShields.front === 0 && unit.voidShields.left === 0 && 
              unit.voidShields.right === 0 && unit.voidShields.rear === 0) {
            unit.voidShields = {
              ...unit.voidShields,
              front: 1, // Default to leftmost selected
            };
            needsUpdate = true;
          }
          // Ensure stats have all required fields
          if (!unit.stats.command) {
            unit.stats = {
              ...unit.stats,
              command: unit.stats.command || 3,
              ballisticSkill: unit.stats.ballisticSkill || unit.stats.ballistic || 3,
              speed: unit.stats.speed || '6"/10"',
              weaponSkill: unit.stats.weaponSkill || unit.stats.weapon || 3,
              manoeuvre: unit.stats.manoeuvre || '2/4',
              servitorClades: unit.stats.servitorClades || 2,
            };
            needsUpdate = true;
          }
          // Migrate damage to minimum of 1
          if (unit.damage.head.current === 0) {
            unit.damage.head.current = 1;
            needsUpdate = true;
          }
          if (unit.damage.body.current === 0) {
            unit.damage.body.current = 1;
            needsUpdate = true;
          }
          if (unit.damage.legs.current === 0) {
            unit.damage.legs.current = 1;
            needsUpdate = true;
          }
          // Ensure carapaceWeapon is properly typed (not a string)
          if (unit.carapaceWeapon !== undefined && unit.carapaceWeapon !== null && typeof unit.carapaceWeapon === 'string') {
            unit.carapaceWeapon = null;
            needsUpdate = true;
          }
          // Ensure critical damage applied fields are booleans, not strings
          ['head', 'body', 'legs'].forEach(location => {
            const loc = location as 'head' | 'body' | 'legs';
            ['yellow', 'orange', 'red'].forEach(level => {
              const critLevel = level as 'yellow' | 'orange' | 'red';
              const critical = unit.damage[loc].criticals[critLevel];
              if (critical) {
                if (typeof critical.applied === 'string') {
                  unit.damage[loc].criticals[critLevel] = {
                    ...critical,
                    applied: critical.applied === 'true',
                  };
                  needsUpdate = true;
                } else if (typeof critical.applied !== 'boolean') {
                  unit.damage[loc].criticals[critLevel] = {
                    ...critical,
                    applied: !!(critical.applied),
                  };
                  needsUpdate = true;
                }
              }
            });
          });
          return unit;
        });
        
        // Load battlegroups + active battlegroup (minimal “name only” battlegroups for now).
        let battlegroups = await storageService.loadBattlegroups();
        let activeBattlegroupId = await storageService.loadActiveBattlegroupId();

        // Migration: if no battlegroups exist, create a default one so existing installs can proceed.
        if (battlegroups.length === 0) {
          const defaultBattlegroup: Battlegroup = {
            id: `battlegroup_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
            name: 'Battlegroup 1',
            createdAt: Date.now(),
          };
          battlegroups = [defaultBattlegroup];
          activeBattlegroupId = defaultBattlegroup.id;
          await storageService.saveBattlegroups(battlegroups);
          await storageService.saveActiveBattlegroupId(activeBattlegroupId);
        }

        // If the stored active battlegroup is missing, fall back to first battlegroup.
        if (activeBattlegroupId && !battlegroups.some((bg) => bg.id === activeBattlegroupId)) {
          activeBattlegroupId = battlegroups[0]?.id ?? null;
          await storageService.saveActiveBattlegroupId(activeBattlegroupId);
        }

        dispatch({ type: 'LOAD_BATTLEGROUPS', payload: battlegroups });
        dispatch({ type: 'SET_ACTIVE_BATTLEGROUP_ID', payload: activeBattlegroupId });

        // Load maniples
        const maniples = await storageService.loadManiples();

        // Migration: scope existing data to a battlegroup.
        // If units/maniples predate battlegroups, attach them to the active battlegroup.
        const targetBattlegroupId = activeBattlegroupId ?? battlegroups[0]?.id ?? null;
        const migratedUnitsWithBattlegroup = migratedUnits.map((u) =>
          u.battlegroupId === undefined || u.battlegroupId === null
            ? { ...u, battlegroupId: targetBattlegroupId }
            : u
        );
        const migratedManiplesWithBattlegroup = maniples.map((m) =>
          m.battlegroupId === undefined || m.battlegroupId === null
            ? { ...m, battlegroupId: targetBattlegroupId }
            : m
        );

        // Persist migrations if needed.
        if (migratedUnitsWithBattlegroup.some((u, i) => u !== migratedUnits[i])) {
          await storageService.saveUnits(migratedUnitsWithBattlegroup);
        }
        if (migratedManiplesWithBattlegroup.some((m, i) => m !== maniples[i])) {
          await storageService.saveManiples(migratedManiplesWithBattlegroup);
        }

        console.log('GameProvider: About to dispatch LOAD_UNITS with', migratedUnitsWithBattlegroup.length, 'units');
        dispatch({ type: 'LOAD_UNITS', payload: migratedUnitsWithBattlegroup });
        dispatch({ type: 'LOAD_MANIPLES', payload: migratedManiplesWithBattlegroup });

        console.log('GameProvider: Initialization complete');
      } catch (error) {
        console.error('Error initializing game:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
      } finally {
        console.log('GameProvider: Setting loading to false');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    // Wrap in try-catch to catch any synchronous errors
    try {
      initialize();
    } catch (error) {
      console.error('Synchronous error in initialize:', error);
    }
  }, []);

  const setActiveBattlegroupId = async (battlegroupId: string | null) => {
    dispatch({ type: 'SET_ACTIVE_BATTLEGROUP_ID', payload: battlegroupId });
    await storageService.saveActiveBattlegroupId(battlegroupId);
  };

  const createBattlegroup = async (name: string): Promise<Battlegroup> => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Battlegroup name is required');
    const battlegroup: Battlegroup = {
      id: `battlegroup_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      name: trimmed,
      createdAt: Date.now(),
    };
    const next = [...state.battlegroups, battlegroup];
    dispatch({ type: 'ADD_BATTLEGROUP', payload: battlegroup });
    await storageService.saveBattlegroups(next);
    // Auto-select newly created battlegroup.
    await setActiveBattlegroupId(battlegroup.id);
    return battlegroup;
  };

  const renameBattlegroup = async (battlegroupId: string, name: string): Promise<void> => {
    const trimmed = name.trim();
    if (!trimmed) return;
    dispatch({ type: 'RENAME_BATTLEGROUP', payload: { id: battlegroupId, name: trimmed } });
    const next = state.battlegroups.map((bg) => (bg.id === battlegroupId ? { ...bg, name: trimmed } : bg));
    await storageService.saveBattlegroups(next);
  };

  const deleteBattlegroupById = async (battlegroupId: string): Promise<void> => {
    dispatch({ type: 'DELETE_BATTLEGROUP', payload: battlegroupId });
    const next = state.battlegroups.filter((bg) => bg.id !== battlegroupId);
    await storageService.saveBattlegroups(next);
    // If we deleted the active battlegroup, clear selection (user returns to battlegroup list).
    if (state.activeBattlegroupId === battlegroupId) {
      await setActiveBattlegroupId(null);
    }
  };

  const addUnitFromTemplate = async (template: UnitTemplate, name?: string) => {
    if (!state.playerId) return;
    
    const unit = {
      ...unitService.createUnitFromTemplate(template, state.playerId, name),
      battlegroupId: state.activeBattlegroupId ?? null,
    };
    dispatch({ type: 'ADD_UNIT', payload: unit });
    await storageService.saveUnits([...state.units, unit]);
  };

  const duplicateTitan = async (
    unitId: string,
    nameOverride?: string
  ): Promise<{ unitId: string; attachedManipleId: string | null }> => {
    if (!state.playerId) return { unitId: '', attachedManipleId: null };

    const original = state.units.find((u) => u.id === unitId);
    if (!original || original.unitType !== 'titan') return { unitId: '', attachedManipleId: null };

    const nextName = (nameOverride?.trim() || original.name).trim();

    // Deep clone the unit so nested objects/weapons/damage aren’t shared.
    const cloned: Unit = JSON.parse(JSON.stringify(original)) as Unit;
    const newId = `unit_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    const newUnit: Unit = {
      ...cloned,
      id: newId,
      name: nextName,
      playerId: state.playerId,
      sessionId: null,
      isLocal: true,
    };

    dispatch({ type: 'ADD_UNIT', payload: newUnit });
    await storageService.saveUnits([...state.units, newUnit]);

    // Preserve maniple membership (if any): one-maniple-per-titan.
    const originalManiple = state.maniples.find((m) => m.titanUnitIds.includes(original.id));
    if (!originalManiple) return { unitId: newId, attachedManipleId: null };

    const manipleTemplate = manipleTemplates.find((t) => t.id === originalManiple.templateId);
    if (
      manipleTemplate &&
      manipleTemplate.allowedTitanTemplateIds.length > 0 &&
      !manipleTemplate.allowedTitanTemplateIds.includes(original.templateId)
    ) {
      return { unitId: newId, attachedManipleId: null };
    }
    if (manipleTemplate && manipleTemplate.maxTitans > 0 && originalManiple.titanUnitIds.length >= manipleTemplate.maxTitans) {
      return { unitId: newId, attachedManipleId: null };
    }

    const updatedManiple: Maniple = {
      ...originalManiple,
      titanUnitIds: [...originalManiple.titanUnitIds, newId],
    };
    dispatch({ type: 'UPDATE_MANIPLE', payload: updatedManiple });
    await storageService.saveManiples(state.maniples.map((m) => (m.id === updatedManiple.id ? updatedManiple : m)));

    return { unitId: newId, attachedManipleId: updatedManiple.id };
  };

  const addTitanFromTemplateToManiple = async (manipleId: string, template: UnitTemplate, name?: string) => {
    if (!state.playerId) return;
    if (template.unitType !== 'titan') return;

    const maniple = state.maniples.find((m) => m.id === manipleId);
    if (!maniple) return;
    const manipleTemplate = manipleTemplates.find((t) => t.id === maniple.templateId);

    // Enforce maniple constraints before creating the unit
    if (manipleTemplate) {
      // Enforce allowed chassis for this maniple.
      if (!manipleTemplate.allowedTitanTemplateIds.includes(template.id)) return;
      // If BattleScribe parsing didn’t yield a max (0), treat as “unknown” and don’t cap.
      if (manipleTemplate.maxTitans > 0 && maniple.titanUnitIds.length >= manipleTemplate.maxTitans) return;
    }

    const unit = {
      ...unitService.createUnitFromTemplate(template, state.playerId, name),
      battlegroupId: maniple.battlegroupId ?? state.activeBattlegroupId ?? null,
    };
    dispatch({ type: 'ADD_UNIT', payload: unit });
    await storageService.saveUnits([...state.units, unit]);

    // Attach the new titan to the maniple
    if (maniple.titanUnitIds.includes(unit.id)) return;
    const updatedManiple: Maniple = { ...maniple, titanUnitIds: [...maniple.titanUnitIds, unit.id] };
    dispatch({ type: 'UPDATE_MANIPLE', payload: updatedManiple });
    const updatedManiples = state.maniples.map((m) => (m.id === updatedManiple.id ? updatedManiple : m));
    await storageService.saveManiples(updatedManiples);
  };

  const updateUnit = async (unit: Unit) => {
    // Update state first for immediate UI feedback
    dispatch({ type: 'UPDATE_UNIT', payload: unit });
    // Then save to storage
    const updatedUnits = state.units.map((u) => (u.id === unit.id ? unit : u));
    await storageService.saveUnits(updatedUnits);
  };

  const deleteUnit = async (unitId: string) => {
    dispatch({ type: 'DELETE_UNIT', payload: unitId });
    const updatedUnits = state.units.filter((u) => u.id !== unitId);
    await storageService.saveUnits(updatedUnits);

    // Also remove unit from any maniples it belongs to (by id)
    const updatedManiples = state.maniples
      .map((m) => ({ ...m, titanUnitIds: m.titanUnitIds.filter((id) => id !== unitId) }))
      .filter((m, idx) => m.titanUnitIds.length !== state.maniples[idx].titanUnitIds.length);

    if (updatedManiples.length > 0) {
      // Apply only changed maniples into state
      const merged = state.maniples.map((m) => {
        const changed = updatedManiples.find((x) => x.id === m.id);
        return changed ?? m;
      });
      dispatch({ type: 'LOAD_MANIPLES', payload: merged });
      await storageService.saveManiples(merged);
    }
  };

  const updateVoidShield = async (
    unitId: string,
    facing: 'front' | 'left' | 'right' | 'rear',
    value: number
  ) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) return;
    
    const updatedUnit = unitService.updateVoidShield(unit, facing, value);
    await updateUnit(updatedUnit);
  };

  const updateVoidShieldCount = async (unitId: string, activeCount: number) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) {
      console.error('Unit not found for void shield update:', unitId);
      return;
    }
    
    // All 4 pips can be active (including the X/red one)
    const newCount = Math.min(activeCount, 4);
    console.log('updateVoidShieldCount called:', { unitId, activeCount, newCount, currentShields: unit.voidShields });
    
    // Set facings based on desired count (each facing is 0 or 1, not max)
    const front = newCount >= 1 ? 1 : 0;
    const left = newCount >= 2 ? 1 : 0;
    const right = newCount >= 3 ? 1 : 0;
    const rear = newCount >= 4 ? 1 : 0; // 4th pip (X) can also be active
    
    console.log('Setting void shields:', { front, left, right, rear, newCount });
    
    // Update all facings in sequence
    const updatedUnit = {
      ...unit,
      voidShields: {
        ...unit.voidShields,
        front,
        left,
        right,
        rear,
      },
    };
    
    // Update state immediately
    dispatch({ type: 'UPDATE_UNIT', payload: updatedUnit });
    
    // Then save
    const allUpdatedUnits = state.units.map((u) => (u.id === unitId ? updatedUnit : u));
    await storageService.saveUnits(allUpdatedUnits);
  };

  const updateVoidShieldByIndex = async (unitId: string, selectedIndex: number) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) {
      console.error('Unit not found for void shield update:', unitId);
      return;
    }
    
    // Only one pip can be selected at a time
    // Map index to facing: 0=front, 1=left, 2=right, 3=rear
    const updatedUnit = {
      ...unit,
      voidShields: {
        ...unit.voidShields,
        front: selectedIndex === 0 ? 1 : 0,
        left: selectedIndex === 1 ? 1 : 0,
        right: selectedIndex === 2 ? 1 : 0,
        rear: selectedIndex === 3 ? 1 : 0,
      },
    };
    
    console.log('Setting void shield by index:', { selectedIndex, shields: updatedUnit.voidShields });
    
    // Update state immediately
    dispatch({ type: 'UPDATE_UNIT', payload: updatedUnit });
    
    // Then save
    const allUpdatedUnits = state.units.map((u) => (u.id === unitId ? updatedUnit : u));
    await storageService.saveUnits(allUpdatedUnits);
  };

  const updateDamage = async (
    unitId: string,
    location: 'head' | 'body' | 'legs',
    value: number
  ) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) return;
    
    const updatedUnit = unitService.updateDamage(unit, location, value);
    await updateUnit(updatedUnit);
  };

  const updateHeat = async (unitId: string, value: number) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) return;
    
    const updatedUnit = unitService.updateHeat(unit, value);
    await updateUnit(updatedUnit);
  };

  const updateCriticalDamage = async (
    unitId: string,
    location: 'head' | 'body' | 'legs',
    level: 'yellow' | 'orange' | 'red' | null
  ) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) return;
    
    const updatedUnit = unitService.updateCriticalDamage(unit, location, level);
    await updateUnit(updatedUnit);
  };

  const updateWeapon = async (
    unitId: string,
    mount: 'leftWeapon' | 'rightWeapon' | 'carapaceWeapon',
    weapon: Weapon | null
  ) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) return;
    
    const updatedUnit = unitService.updateWeapon(unit, mount, weapon);
    await updateUnit(updatedUnit);
  };

  const updatePlasmaReactor = async (unitId: string, value: number) => {
    const unit = state.units.find((u) => u.id === unitId);
    if (!unit) {
      console.error('Unit not found:', unitId);
      return;
    }
    
    // Create plasmaReactor if it doesn't exist
    if (!unit.plasmaReactor) {
      unit.plasmaReactor = {
        current: 0,
        max: 5, // Default, will be updated from template if available
      };
    }
    
    const max = unit.plasmaReactor.max;
    const newValue = Math.max(0, Math.min(value, max));
    console.log('Updating plasma reactor:', newValue, '/', max);
    const updatedUnit = {
      ...unit,
      plasmaReactor: {
        ...unit.plasmaReactor,
        current: newValue,
      },
    };
    await updateUnit(updatedUnit);
  };

  const setPlayerName = async (name: string) => {
    dispatch({ type: 'SET_PLAYER_NAME', payload: name });
    await storageService.savePlayerName(name);
  };

  const addManipleFromTemplate = async (template: ManipleTemplate, name?: string, legionId?: string | null) => {
    if (!state.playerId) return;
    const maniple: Maniple = {
      id: `maniple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name?.trim() || template.name,
      templateId: template.id,
      battlegroupId: state.activeBattlegroupId ?? null,
      legionId: legionId ?? null,
      playerId: state.playerId,
      isLocal: true,
      titanUnitIds: [],
      createdAt: Date.now(),
    };
    await addManiple(maniple);
  };

  const addManiple = async (maniple: Maniple) => {
    dispatch({ type: 'ADD_MANIPLE', payload: maniple });
    await storageService.saveManiples([...state.maniples, maniple]);
  };

  const updateManiple = async (maniple: Maniple) => {
    dispatch({ type: 'UPDATE_MANIPLE', payload: maniple });
    const updated = state.maniples.map((m) => (m.id === maniple.id ? maniple : m));
    await storageService.saveManiples(updated);
  };

  const deleteManiple = async (manipleId: string) => {
    const maniple = state.maniples.find((m) => m.id === manipleId);
    const titanIdsToDelete = new Set<string>(maniple?.titanUnitIds ?? []);

    // Remove the maniple itself.
    dispatch({ type: 'DELETE_MANIPLE', payload: manipleId });
    let updatedManiples = state.maniples.filter((m) => m.id !== manipleId);

    // Also delete all titans that were in this maniple.
    if (titanIdsToDelete.size > 0) {
      const updatedUnits = state.units.filter((u) => !titanIdsToDelete.has(u.id));
      dispatch({ type: 'LOAD_UNITS', payload: updatedUnits });
      await storageService.saveUnits(updatedUnits);

      // Defensive cleanup: ensure no remaining maniple references deleted titan ids.
      updatedManiples = updatedManiples.map((m) => ({
        ...m,
        titanUnitIds: (m.titanUnitIds ?? []).filter((id) => !titanIdsToDelete.has(id)),
      }));
      dispatch({ type: 'LOAD_MANIPLES', payload: updatedManiples });
    }

    await storageService.saveManiples(updatedManiples);
  };

  const addTitanToManiple = async (manipleId: string, unitId: string) => {
    const maniple = state.maniples.find((m) => m.id === manipleId);
    const unit = state.units.find((u) => u.id === unitId);
    if (!maniple || !unit) return;
    if (unit.unitType !== 'titan') return;

    const template = manipleTemplates.find((t) => t.id === maniple.templateId);
    if (template && !template.allowedTitanTemplateIds.includes(unit.templateId)) return;
    // If BattleScribe parsing didn’t yield a max (0), treat as “unknown” and don’t cap.
    if (template && template.maxTitans > 0 && maniple.titanUnitIds.length >= template.maxTitans) return;

    // Enforce one-maniple-per-titan: remove from any other maniple first.
    const updatedManiples = state.maniples.map((m) => {
      if (m.id === manipleId) {
        if (m.titanUnitIds.includes(unitId)) return m;
        return { ...m, titanUnitIds: [...m.titanUnitIds, unitId] };
      }
      if (m.titanUnitIds.includes(unitId)) {
        return { ...m, titanUnitIds: m.titanUnitIds.filter((id) => id !== unitId) };
      }
      return m;
    });

    dispatch({ type: 'LOAD_MANIPLES', payload: updatedManiples });
    await storageService.saveManiples(updatedManiples);
  };

  const removeTitanFromManiple = async (manipleId: string, unitId: string) => {
    const maniple = state.maniples.find((m) => m.id === manipleId);
    if (!maniple) return;
    if (!maniple.titanUnitIds.includes(unitId)) return;
    const updatedManiple = { ...maniple, titanUnitIds: maniple.titanUnitIds.filter((id) => id !== unitId) };
    await updateManiple(updatedManiple);
  };

    // Ensure state.isLoading is always a boolean and sanitize all units
    const safeUnits = state.units.map(unit => {
      const sanitized = { ...unit };
      // Ensure isLocal is boolean
      sanitized.isLocal = !!(sanitized.isLocal !== false);
      // Ensure critical damage applied fields are booleans
      ['head', 'body', 'legs'].forEach(location => {
        const loc = location as 'head' | 'body' | 'legs';
        ['yellow', 'orange', 'red'].forEach(level => {
          const critLevel = level as 'yellow' | 'orange' | 'red';
          const critical = sanitized.damage[loc].criticals[critLevel];
          if (critical && typeof critical.applied !== 'boolean') {
            sanitized.damage[loc].criticals[critLevel] = {
              ...critical,
              applied: !!(critical.applied),
            };
          }
        });
      });
      // Ensure carapaceWeapon is not a string
      if (sanitized.carapaceWeapon !== undefined && sanitized.carapaceWeapon !== null && typeof sanitized.carapaceWeapon === 'string') {
        sanitized.carapaceWeapon = null;
      }
      // Ensure carapaceWeapon exists as a nullable field (some older saved units may omit it).
      if (sanitized.unitType === 'titan' && sanitized.carapaceWeapon === undefined) {
        sanitized.carapaceWeapon = null;
      }
      return sanitized;
    });
    
    const safeState = {
      ...state,
      isLoading: !!state.isLoading, // Use !! instead of Boolean()
      units: safeUnits,
    };
    console.log('GameProvider: About to return Provider, safeState.isLoading:', typeof safeState.isLoading, safeState.isLoading);

  return (
    <GameContext.Provider
      value={{
        state: safeState,
        createBattlegroup,
        renameBattlegroup,
        deleteBattlegroupById,
        setActiveBattlegroupId,
        addUnitFromTemplate,
        addTitanFromTemplateToManiple,
          duplicateTitan,
        updateUnit,
        deleteUnit,
        updateVoidShield,
        updateVoidShieldCount,
        updateVoidShieldByIndex,
        updateDamage,
        updateCriticalDamage,
        updateWeapon,
        updateHeat,
        updatePlasmaReactor,
        setPlayerName,
        addManipleFromTemplate,
        addManiple,
        updateManiple,
        deleteManiple,
        addTitanToManiple,
        removeTitanFromManiple,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

