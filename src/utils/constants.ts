// Game rules and default values
export const STORAGE_KEYS = {
  UNITS: '@engine_kill:units',
  MANIPLES: '@engine_kill:maniples',
  PLAYER_ID: '@engine_kill:player_id',
  PLAYER_NAME: '@engine_kill:player_name',
};

export const CONTROL_TYPES = {
  PIPS: 'pips',
  BUTTONS: 'buttons',
  SLIDER: 'slider',
} as const;

export type ControlType = typeof CONTROL_TYPES[keyof typeof CONTROL_TYPES];


