import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { Unit, Weapon } from '../models/Unit';
import { Maniple } from '../models/Maniple';
import { storageService } from '../services/storageService';
import { unitService } from '../services/unitService';
import { UnitTemplate, WeaponTemplate } from '../models/UnitTemplate';
import { ManipleTemplate } from '../models/ManipleTemplate';
import { manipleTemplates } from '../data/manipleTemplates';

interface GameState {
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
  addUnitFromTemplate: (template: UnitTemplate, name?: string) => Promise<void>;
  addTitanFromTemplateToManiple: (manipleId: string, template: UnitTemplate, name?: string) => Promise<void>;
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
  addManipleFromTemplate: (template: ManipleTemplate, name?: string) => Promise<void>;
  addManiple: (maniple: Maniple) => Promise<void>;
  updateManiple: (maniple: Maniple) => Promise<void>;
  deleteManiple: (manipleId: string) => Promise<void>;
  addTitanToManiple: (manipleId: string, unitId: string) => Promise<void>;
  removeTitanFromManiple: (manipleId: string, unitId: string) => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export function GameProvider({ children }: { children: ReactNode }) {
  console.log('GameProvider: Component function called');
  try {
    const [state, dispatch] = useReducer(gameReducer, initialState);
    console.log('GameProvider: useReducer initialized, state.isLoading:', typeof state.isLoading, state.isLoading);

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
        
        // Save migrated units back
        if (migratedUnits.length > 0 && migratedUnits.some((u, i) => u !== units[i])) {
          await storageService.saveUnits(migratedUnits);
        }
        
        console.log('GameProvider: About to dispatch LOAD_UNITS with', migratedUnits.length, 'units');
        dispatch({ type: 'LOAD_UNITS', payload: migratedUnits });

        // Load maniples
        const maniples = await storageService.loadManiples();
        dispatch({ type: 'LOAD_MANIPLES', payload: maniples });

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

  const addUnitFromTemplate = async (template: UnitTemplate, name?: string) => {
    if (!state.playerId) return;
    
    const unit = unitService.createUnitFromTemplate(template, state.playerId, name);
    dispatch({ type: 'ADD_UNIT', payload: unit });
    await storageService.saveUnits([...state.units, unit]);
  };

  const addTitanFromTemplateToManiple = async (manipleId: string, template: UnitTemplate, name?: string) => {
    if (!state.playerId) return;
    if (template.unitType !== 'titan') return;

    const maniple = state.maniples.find((m) => m.id === manipleId);
    if (!maniple) return;
    const manipleTemplate = manipleTemplates.find((t) => t.id === maniple.templateId);

    // Enforce maniple constraints before creating the unit
    if (manipleTemplate) {
      if (!manipleTemplate.allowedTitanTemplateIds.includes(template.id)) return;
      if (maniple.titanUnitIds.length >= manipleTemplate.maxTitans) return;
    }

    const unit = unitService.createUnitFromTemplate(template, state.playerId, name);
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

  const addManipleFromTemplate = async (template: ManipleTemplate, name?: string) => {
    if (!state.playerId) return;
    const maniple: Maniple = {
      id: `maniple_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name?.trim() || template.name,
      templateId: template.id,
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
    dispatch({ type: 'DELETE_MANIPLE', payload: manipleId });
    const updated = state.maniples.filter((m) => m.id !== manipleId);
    await storageService.saveManiples(updated);
  };

  const addTitanToManiple = async (manipleId: string, unitId: string) => {
    const maniple = state.maniples.find((m) => m.id === manipleId);
    const unit = state.units.find((u) => u.id === unitId);
    if (!maniple || !unit) return;
    if (unit.unitType !== 'titan') return;

    const template = manipleTemplates.find((t) => t.id === maniple.templateId);
    if (template && !template.allowedTitanTemplateIds.includes(unit.templateId)) return;
    if (template && maniple.titanUnitIds.length >= template.maxTitans) return;

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
          addUnitFromTemplate,
          addTitanFromTemplateToManiple,
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
  } catch (error) {
    console.error('Error in GameProvider render:', error);
    // Return a minimal provider to prevent crash
    return (
      <GameContext.Provider
        value={{
          state: { ...initialState, isLoading: false },
          addUnitFromTemplate: async () => {},
          addTitanFromTemplateToManiple: async () => {},
          updateUnit: async () => {},
          deleteUnit: async () => {},
          updateVoidShield: async () => {},
          updateVoidShieldCount: async () => {},
          updateVoidShieldByIndex: async () => {},
          updateDamage: async () => {},
          updateCriticalDamage: async () => {},
          updateWeapon: async () => {},
          updateHeat: async () => {},
          updatePlasmaReactor: async () => {},
          setPlayerName: async () => {},
          addManipleFromTemplate: async () => {},
          addManiple: async () => {},
          updateManiple: async () => {},
          deleteManiple: async () => {},
          addTitanToManiple: async () => {},
          removeTitanFromManiple: async () => {},
        }}
      >
        {children}
      </GameContext.Provider>
    );
  }
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}

