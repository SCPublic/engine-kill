/**
 * Confirms that data from titan-data (engine-kill JSON + BattleScribe XML) is correctly
 * transformed into display-ready template values. Uses fixtures and mocked fetch.
 */
import * as fs from 'fs';
import * as path from 'path';
import { loadAllTitanTemplatesFromBattleScribe } from '../src/adapters/battlescribe/battlescribeAdapter';
import { clearTitanDataOverridesCache } from '../src/services/titanDataOverrides';

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const ENGINE_KILL_DIR = path.join(FIXTURES_DIR, 'engine-kill');
const BASE_URL = 'https://fixture.test/';

function readFixture(relativePath: string): string {
  return fs.readFileSync(path.join(FIXTURES_DIR, relativePath), 'utf-8');
}

function readEngineKill(name: string): string {
  return fs.readFileSync(path.join(ENGINE_KILL_DIR, name), 'utf-8');
}

beforeEach(() => {
  clearTitanDataOverridesCache();
  jest.restoreAllMocks();
});

describe('titan-data display pipeline', () => {
  it('applies engine-kill chassis overrides and damage tracks to templates', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      if (url.includes('Battlegroup.cat')) return Promise.resolve({ ok: true, text: () => Promise.resolve(readFixture('Battlegroup.cat')) } as Response);
      if (url.includes('Household.cat')) return Promise.resolve({ ok: true, text: () => Promise.resolve(readFixture('Household.cat')) } as Response);
      if (url.includes('2018.gst')) return Promise.resolve({ ok: true, text: () => Promise.resolve(readFixture('Adeptus Titanicus 2018.gst')) } as Response);
      if (url.includes('engine-kill/chassis-overrides.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(readEngineKill('chassis-overrides.json'))) } as Response);
      if (url.includes('engine-kill/damage-tracks.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(readEngineKill('damage-tracks.json'))) } as Response);
      if (url.includes('engine-kill/weapon-metadata.json')) return Promise.resolve({ ok: true, json: () => Promise.resolve(JSON.parse(readEngineKill('weapon-metadata.json'))) } as Response);
      return Promise.reject(new Error(`Unexpected fetch: ${url}`));
    });

    const result = await loadAllTitanTemplatesFromBattleScribe({
      baseUrl: BASE_URL,
      files: ['Battlegroup.cat', 'Household.cat', 'Adeptus Titanicus 2018.gst'],
    });

    expect(fetchSpy).toHaveBeenCalled();
    expect(result.templates.length).toBeGreaterThanOrEqual(1);

    const reaver = result.templates.find((t) => t.id === 'reaver');
    expect(reaver).toBeDefined();
    expect(reaver!.name).toBe('Reaver Titan');

    // Chassis values from engine-kill/chassis-overrides.json (not XML)
    expect(reaver!.defaultStats.voidShields.max).toBe(5);
    expect(reaver!.defaultStats.plasmaReactorMax).toBe(6);
    expect(reaver!.defaultStats.maxHeat).toBe(6);
    expect(reaver!.defaultStats.voidShieldSaves).toEqual(['3+', '3+', '4+', '4+', 'X']);

    // Damage tracks from engine-kill/damage-tracks.json
    expect(reaver!.defaultStats.damage.head.max).toBe(5);
    expect(reaver!.defaultStats.damage.head.armor.directHit).toBe(3);
    expect(reaver!.defaultStats.damage.head.hitTable.criticalHit).toBe('16+');
    expect(reaver!.defaultStats.damage.body.max).toBe(6);
    expect(reaver!.defaultStats.damage.legs.armor.crit).toBe(5);
    expect(reaver!.defaultStats.criticalEffects).toBeDefined();
    expect(reaver!.defaultStats.criticalEffects!.body[0].effects).toContain('Reactor Leak (1)');
    expect(reaver!.defaultStats.criticalEffects!.legs[2].effects).toContain('Immobilised');
  });
});
