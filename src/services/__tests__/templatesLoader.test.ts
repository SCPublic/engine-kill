/**
 * Tests for the single templates loader (REFACTOR_PROGRESS: single source, accurate data).
 * See docs/TESTING_REFACTOR_PROGRESS.md.
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadTemplatesFromJson } from '../templatesLoader';

const FIXTURE_PATH = path.join(__dirname, '../../__fixtures__/templates-minimal.json');

function readFixture(): unknown {
  const raw = fs.readFileSync(FIXTURE_PATH, 'utf-8');
  return JSON.parse(raw);
}

describe('loadTemplatesFromJson', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it('builds URL as {baseUrl}/engine-kill/generated/templates.json with trailing slash', async () => {
    let capturedUrl = '';
    global.fetch = async (input: RequestInfo | URL) => {
      capturedUrl = typeof input === 'string' ? input : input.toString();
      return { ok: true, json: async () => ({ titans: [] }) } as Response;
    };
    await loadTemplatesFromJson('https://example.com/');
    expect(capturedUrl).toBe('https://example.com/engine-kill/generated/templates.json');
  });

  it('builds URL without double slash when baseUrl has no trailing slash', async () => {
    let capturedUrl = '';
    global.fetch = async (input: RequestInfo | URL) => {
      capturedUrl = typeof input === 'string' ? input : input.toString();
      return { ok: true, json: async () => ({ titans: [] }) } as Response;
    };
    await loadTemplatesFromJson('https://example.com');
    expect(capturedUrl).toBe('https://example.com/engine-kill/generated/templates.json');
  });

  it('throws on fetch failure with status and URL in message', async () => {
    global.fetch = async () => ({ ok: false, status: 404, statusText: 'Not Found' } as Response);
    await expect(loadTemplatesFromJson('https://example.com')).rejects.toThrow(
      /Failed to load templates: 404.*engine-kill\/generated\/templates\.json/
    );
  });

  it('throws when payload is missing titans', async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({}) } as Response);
    await expect(loadTemplatesFromJson('https://example.com')).rejects.toThrow(
      'Invalid templates.json: missing titans'
    );
  });

  it('returns all payload keys as arrays (coerces missing to [])', async () => {
    global.fetch = async () => ({ ok: true, json: async () => ({ titans: [] }) } as Response);
    const result = await loadTemplatesFromJson('https://example.com');
    expect(result).toEqual({
      titans: [],
      banners: [],
      maniples: [],
      legions: [],
      upgrades: [],
      princepsTraits: [],
      warnings: [],
    });
  });

  it('loads fixture and returns payload with expected keys (engine-kill consumes whatever titan-data ships)', async () => {
    const fixture = readFixture();
    global.fetch = async () => ({ ok: true, json: async () => fixture } as Response);
    const result = await loadTemplatesFromJson('https://example.com');
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
});
