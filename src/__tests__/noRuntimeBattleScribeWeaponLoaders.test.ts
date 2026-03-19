/**
 * Regression test: UnitEditScreen and hooks must not use BattleScribe weapon loaders at runtime.
 * REFACTOR_PROGRESS step 3 — template.availableWeapons / template.specialRules only.
 * See docs/TESTING_REFACTOR_PROGRESS.md.
 */

import * as fs from 'fs';
import * as path from 'path';

const FORBIDDEN = [
  'loadWarhoundWeaponsFromBattleScribe',
  'loadQuestorisWeaponsFromBattleScribe',
] as const;

const APP_DIRS = ['src/screens', 'src/hooks'] as const;

function getAllTsFiles(dir: string): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...getAllTsFiles(full));
    } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
      results.push(full);
    }
  }
  return results;
}

describe('No runtime BattleScribe weapon loaders in app code', () => {
  const projectRoot = path.resolve(__dirname, '../..');

  for (const dir of APP_DIRS) {
    const dirPath = path.join(projectRoot, dir);
    const files = getAllTsFiles(dirPath);
    for (const file of files) {
      const relative = path.relative(projectRoot, file);
      for (const name of FORBIDDEN) {
        it(`${relative} does not reference ${name}`, () => {
          const content = fs.readFileSync(file, 'utf-8');
          expect(content).not.toContain(name);
        });
      }
    }
  }
});

/**
 * REFACTOR_PROGRESS step 4 — adapter and titanDataOverrides must not be in app runtime.
 * App code (everything under src/ except src/adapters/) must not import the BattleScribe
 * adapter or titanDataOverrides; those exist only for scripts (e.g. generate-templates.ts).
 */
describe('No adapter or titanDataOverrides in app runtime (step 4)', () => {
  const projectRoot = path.resolve(__dirname, '../..');
  const srcDir = path.join(projectRoot, 'src');

  const forbiddenImportPatterns = [
    /adapters\/battlescribe\/battlescribeAdapter/,
    /['"].*titanDataOverrides['"]/,
    /from\s+['"].*titanDataOverrides/,
  ] as const;

  function getAppTsFiles(dir: string): string[] {
    const results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === 'adapters') continue;
        results.push(...getAppTsFiles(full));
      } else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) {
        results.push(full);
      }
    }
    return results;
  }

  const appFiles = getAppTsFiles(srcDir).filter(
    (f) => !f.endsWith('titanDataOverrides.ts')
  );
  for (const file of appFiles) {
    const relative = path.relative(projectRoot, file);
    it(`${relative} does not import adapter or titanDataOverrides`, () => {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of forbiddenImportPatterns) {
        expect(content).not.toMatch(pattern);
      }
    });
  }
});
