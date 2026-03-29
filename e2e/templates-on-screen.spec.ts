import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * templates.json source for E2E (route = respond with file from disk, no network):
 * - TITAN_DATA_PATH set: path to titan-data repo (uses templates.json at repo root)
 *   or a path ending in templates.json. We read that file and fulfill the request with it.
 * - Otherwise: default to sibling repo ../titan-data (from engine-kill root). If that file
 *   exists, use it. If not, fall back to minimal fixture so tests still pass without titan-data.
 * To undo / use remote in CI: set E2E_USE_REMOTE_DATA=1 and do not stub (future).
 *
 * State reset: ?__e2e_reset=seed clears storage, seeds list state, redirects to /.
 */
const FIXTURE_PATH = path.join(__dirname, '../src/__fixtures__/templates-minimal.json');

/** Resolve path to templates.json: env TITAN_DATA_PATH or default sibling titan-data repo. */
function getTemplatesJsonPath(): string {
  const envPath = process.env.TITAN_DATA_PATH;
  if (envPath) {
    return envPath.endsWith('templates.json')
      ? path.resolve(envPath)
      : path.join(path.resolve(envPath), 'templates.json');
  }
  const engineKillRoot = path.join(__dirname, '..');
  const siblingTitanData = path.join(engineKillRoot, '..', 'titan-data');
  return path.join(siblingTitanData, 'templates.json');
}

test.describe('Titan data displayed on screen', () => {
  test.beforeEach(async ({ page }) => {
    const templatesPath = getTemplatesJsonPath();
    let body: string;
    if (!process.env.E2E_USE_REMOTE_DATA && fs.existsSync(templatesPath)) {
      body = fs.readFileSync(templatesPath, 'utf-8');
    } else {
      body = fs.readFileSync(FIXTURE_PATH, 'utf-8');
    }
    if (!process.env.E2E_USE_REMOTE_DATA) {
      await page.route(/templates\.json$/i, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body,
        })
      );
    }
    // Use app's E2E reset endpoint: clear storage, seed list state, redirect to /. One navigation, no manual localStorage.
    await page.goto('/?__e2e_reset=seed', { waitUntil: 'load' });
    await expect(page.getByText('Battlegroups')).toBeVisible({ timeout: 15000 });
  });

  test('app loads and shows battlegroup list', async ({ page }) => {
    expect(await page.getByText('Battlegroups').isVisible()).toBe(true);
  });

  test('after creating battlegroup and adding Reaver from template, template name appears on screen', async ({
    page,
  }) => {
    // Create first battlegroup (empty state); we're already on the landing page from beforeEach
    const createButton = page.getByRole('button', { name: /create battlegroup/i });
    await createButton.click();
    await expect(page.getByText('New battlegroup')).toBeVisible({ timeout: 5000 });
    // Target the modal's textbox directly; getByLabel can fail when RN Paper doesn't expose label as aria-label
    await page.getByRole('textbox').first().fill('E2E Test');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    // We should be on the battlegroup view (HomeScreen). Add a unit.
    await expect(page.getByText('No Units Yet')).toBeVisible({ timeout: 5000 });
    const addUnitButton = page.getByRole('button', { name: /add unit/i });
    await addUnitButton.click();

    // Add unit modal: pick Reaver Titan (from our stubbed templates). Clicking creates the unit.
    await expect(page.getByText('Reaver Titan').first()).toBeVisible({ timeout: 5000 });
    await page.getByText('Reaver Titan').first().click();

    // Unit appears in the list (default name from template is "Reaver Titan"); .first() = list card (modal may still show template)
    await expect(page.getByText('Reaver Titan').first()).toBeVisible({ timeout: 5000 });
  });

  test('opening a titan unit shows template-derived content (weapon or stats)', async ({ page }) => {
    // We're already on the landing page from beforeEach
    const createButton = page.getByRole('button', { name: /create battlegroup/i });
    await createButton.click();
    await expect(page.getByText('New battlegroup')).toBeVisible({ timeout: 5000 });
    await page.getByRole('textbox').first().fill('E2E Test');
    await page.getByRole('button', { name: 'Create', exact: true }).click();

    await expect(page.getByText('No Units Yet')).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /add unit/i }).click();
    await expect(page.getByText('Reaver Titan').first()).toBeVisible({ timeout: 5000 });
    await page.getByText('Reaver Titan').first().click(); // pick template in modal (only "Reaver Titan" at this point)
    await expect(page.getByText('Reaver Titan').first()).toBeVisible({ timeout: 5000 }); // unit card in list (modal may still show template; .first() = list card)

    // Open the unit (click the card with the unit name)
    await page.getByText('Reaver Titan').first().click();

    // Unit edit screen shows template-derived content. CORE STATS is collapsed by default; expand it to see speed.
    await page.getByText('CORE STATS').click();
    // Real titan-data Reaver has speed 6"/9"; minimal fixture has 7"/11". Weapon names (e.g. Laser Blaster) may appear on mounts or in picker.
    await expect(
      page.getByText(/Laser Blaster|Void Shield|void shield|6"\/9"|7"\/11"/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
