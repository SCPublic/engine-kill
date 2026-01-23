// Game rules and default values
export const STORAGE_KEYS = {
  UNITS: '@engine_kill:units',
  MANIPLES: '@engine_kill:maniples',
  // Backward-compatible keys (we renamed "rosters" to "battlegroups" in the UI/state).
  // Keep the underlying storage key strings the same so existing installs retain data.
  ROSTERS: '@engine_kill:rosters',
  ACTIVE_ROSTER_ID: '@engine_kill:active_roster_id',
  BATTLEGROUPS: '@engine_kill:rosters',
  ACTIVE_BATTLEGROUP_ID: '@engine_kill:active_roster_id',
  PLAYER_ID: '@engine_kill:player_id',
  PLAYER_NAME: '@engine_kill:player_name',
};

export const CONTROL_TYPES = {
  PIPS: 'pips',
  BUTTONS: 'buttons',
  SLIDER: 'slider',
} as const;

export type ControlType = typeof CONTROL_TYPES[keyof typeof CONTROL_TYPES];


