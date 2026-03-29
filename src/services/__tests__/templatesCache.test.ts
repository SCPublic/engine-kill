/**
 * Behavioral tests for templatesCache (single-fetch templates.json).
 * Guards loadTitansOnce, loadBannersOnce, payload shape, and single shared fetch.
 */

import * as fs from 'fs';
import * as path from 'path';
import { templatesCache } from '../templatesCache';

const FIXTURE_PATH = path.join(__dirname, '../../__fixtures__/templates-minimal.json');

function readFixture(): unknown {
  const raw = fs.readFileSync(FIXTURE_PATH, 'utf-8');
  return JSON.parse(raw);
}

describe('Template cache (load and shape)', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    templatesCache.resetAll();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('loadTitansOnce returns titans and warnings from fixture via single fetch', async () => {
    const fixture = readFixture();
    global.fetch = async () => ({ ok: true, json: async () => fixture } as Response);

    const result = await templatesCache.loadTitansOnce();

    expect(result).toHaveProperty('templates');
    expect(result).toHaveProperty('warnings');
    expect(result).toHaveProperty('missingMaxData');
    expect(result).toHaveProperty('legendTitans');
    expect(Array.isArray(result.templates)).toBe(true);
    expect(Array.isArray(result.warnings)).toBe(true);
    expect(result.templates.length).toBeGreaterThan(0);
    const reaver = result.templates.find((t) => t.id === 'reaver' || t.name === 'Reaver Titan');
    expect(reaver).toBeDefined();
    expect(reaver?.availableWeapons).toBeDefined();
    expect(Array.isArray(reaver?.availableWeapons)).toBe(true);
    expect(reaver?.defaultStats?.damage).toBeDefined();
  });

  it('loadBannersOnce returns banners and warnings from same payload', async () => {
    const fixture = readFixture();
    global.fetch = async () => ({ ok: true, json: async () => fixture } as Response);

    const result = await templatesCache.loadBannersOnce();

    expect(result).toHaveProperty('templates');
    expect(result).toHaveProperty('warnings');
    expect(Array.isArray(result.templates)).toBe(true);
    expect(result.templates.length).toBeGreaterThan(0);
    const questoris = result.templates.find(
      (b) => b.id === 'questoris' || b.name?.includes('Questoris')
    );
    expect(questoris).toBeDefined();
    expect(questoris?.availableWeapons).toBeDefined();
  });

  it('loadTemplatesPayloadOnce returns full payload shape', async () => {
    const fixture = readFixture();
    global.fetch = async () => ({ ok: true, json: async () => fixture } as Response);

    const result = await templatesCache.loadTemplatesPayloadOnce();

    expect(result).toHaveProperty('titans');
    expect(result).toHaveProperty('banners');
    expect(result).toHaveProperty('maniples');
    expect(result).toHaveProperty('legions');
    expect(result).toHaveProperty('upgrades');
    expect(result).toHaveProperty('princepsTraits');
    expect(result).toHaveProperty('warnings');
    expect(Array.isArray(result.titans)).toBe(true);
    expect(Array.isArray(result.banners)).toBe(true);
  });

  it('getTitanResultSnapshot reflects loaded state after loadTitansOnce', async () => {
    const fixture = readFixture();
    global.fetch = async () => ({ ok: true, json: async () => fixture } as Response);

    const before = templatesCache.getTitanResultSnapshot();
    expect(before.status === 'idle' || before.status === 'loading').toBe(true);

    await templatesCache.loadTitansOnce();

    const after = templatesCache.getTitanResultSnapshot();
    expect(after.status).toBe('loaded');
    expect(after.result).toBeDefined();
    expect(after.result?.templates.length).toBeGreaterThan(0);
  });

  it('single fetch serves all category loaders (titans and banners share payload)', async () => {
    let fetchCount = 0;
    const fixture = readFixture();
    global.fetch = async () => {
      fetchCount += 1;
      return { ok: true, json: async () => fixture } as Response;
    };

    await templatesCache.loadTitansOnce();
    await templatesCache.loadBannersOnce();

    expect(fetchCount).toBe(1);
  });
});
