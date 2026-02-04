import {
  TITAN_DATA_BASE_URL,
  TITAN_DATA_REPO_SLUG,
  TITAN_DATA_GITHUB_URL,
  ENGINE_KILL_REPO_SLUG,
  ENGINE_KILL_GITHUB_URL,
  DEFAULT_DATA_BASE_URL,
  STORAGE_KEYS,
} from '../src/utils/constants';

describe('constants', () => {
  describe('data repo', () => {
    it('uses titan-data as default data source', () => {
      expect(DEFAULT_DATA_BASE_URL).toBe(TITAN_DATA_BASE_URL);
      expect(DEFAULT_DATA_BASE_URL).toContain('titan-data');
      expect(DEFAULT_DATA_BASE_URL).toMatch(/\/$/);
    });

    it('exposes titan-data repo slug and GitHub URL', () => {
      expect(TITAN_DATA_REPO_SLUG).toBe('SCPublic/titan-data');
      expect(TITAN_DATA_GITHUB_URL).toBe('https://github.com/SCPublic/titan-data');
    });

    it('exposes engine-kill repo slug and GitHub URL', () => {
      expect(ENGINE_KILL_REPO_SLUG).toBe('SCPublic/engine-kill');
      expect(ENGINE_KILL_GITHUB_URL).toBe('https://github.com/SCPublic/engine-kill');
    });
  });

  describe('STORAGE_KEYS', () => {
    it('defines expected keys', () => {
      expect(STORAGE_KEYS.UNITS).toBe('@engine_kill:units');
      expect(STORAGE_KEYS.MANIPLES).toBe('@engine_kill:maniples');
      expect(STORAGE_KEYS.BATTLEGROUPS).toBe('@engine_kill:rosters');
      expect(STORAGE_KEYS.ACTIVE_BATTLEGROUP_ID).toBe('@engine_kill:active_roster_id');
    });
  });
});
