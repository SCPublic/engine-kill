// Game rules and default values

/** BSData Adeptus Titanicus repo (upstream). */
export const BSDATA_ADEPTUS_TITANICUS_BASE_URL =
  'https://raw.githubusercontent.com/BSData/adeptus-titanicus/master/';

/** Titan-data repo (SCPublic/titan-data, branch master). */
export const TITAN_DATA_BASE_URL =
  'https://raw.githubusercontent.com/SCPublic/titan-data/master/';

/** Data repo display: GitHub repo slug and URL for UI. */
export const TITAN_DATA_REPO_SLUG = 'SCPublic/titan-data';
export const TITAN_DATA_GITHUB_URL = 'https://github.com/SCPublic/titan-data';

/** GitHub API URL for latest commit on default branch (master). */
export const TITAN_DATA_COMMITS_API_URL =
  'https://api.github.com/repos/SCPublic/titan-data/commits/master';

/** Engine-kill app repo (SCPublic/engine-kill, branch main). */
export const ENGINE_KILL_REPO_SLUG = 'SCPublic/engine-kill';
export const ENGINE_KILL_GITHUB_URL = 'https://github.com/SCPublic/engine-kill';
export const ENGINE_KILL_COMMITS_API_URL =
  'https://api.github.com/repos/SCPublic/engine-kill/commits/main';

/** Data source used by the app. Change this to switch between BSData and titan-data. */
export const DEFAULT_DATA_BASE_URL = TITAN_DATA_BASE_URL;

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


