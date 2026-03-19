/**
 * Generates a single app-ready templates.json for titan-data.
 * Run from engine-kill: npx tsx scripts/generate-templates.ts
 * Optional env: TITAN_DATA_BASE_URL (default: SCPublic/titan-data master raw),
 *               TITAN_DATA_OUTPUT (path to write templates.json).
 * If TITAN_DATA_OUTPUT is unset, writes to ../titan-data/engine-kill/generated/templates.json
 * when that path exists, else to ./generated/templates.json.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  loadAllTitanTemplatesFromBattleScribe,
  loadBannerTemplatesFromBattleScribe,
  loadManipleTemplatesFromBattleScribe,
  loadLegionTemplatesFromBattleScribe,
  loadUpgradeTemplatesFromBattleScribe,
  loadPrincepsTraitTemplatesFromBattleScribe,
} from '../src/adapters/battlescribe/battlescribeAdapter';

const DEFAULT_BASE_URL = 'https://raw.githubusercontent.com/SCPublic/titan-data/master/';

function getOutputPath(): string {
  const env = process.env.TITAN_DATA_OUTPUT;
  if (env) return path.resolve(env);
  const cwd = process.cwd();
  const candidate = path.join(cwd, '..', 'titan-data', 'engine-kill', 'generated', 'templates.json');
  if (fs.existsSync(path.dirname(candidate))) return candidate;
  return path.join(cwd, 'generated', 'templates.json');
}

async function main() {
  const baseUrl = process.env.TITAN_DATA_BASE_URL ?? DEFAULT_BASE_URL;
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const config = {
    baseUrl: normalizedBase,
    files: ['Battlegroup.cat', 'Household.cat', 'Adeptus Titanicus 2018.gst'],
  };

  console.log('Fetching titan templates from', normalizedBase);
  const titanResult = await loadAllTitanTemplatesFromBattleScribe(config);
  console.log('Titans:', titanResult.templates.length);

  console.log('Fetching maniples, legions, upgrades, princeps traits...');
  const [manipleResult, legionResult, upgradeResult, princepsResult] = await Promise.all([
    loadManipleTemplatesFromBattleScribe(config),
    loadLegionTemplatesFromBattleScribe(config),
    loadUpgradeTemplatesFromBattleScribe(config),
    loadPrincepsTraitTemplatesFromBattleScribe(config),
  ]);

  console.log('Fetching banner templates from BattleScribe (with overrides)...');
  const bannerResult = await loadBannerTemplatesFromBattleScribe(config);
  console.log('Banners:', bannerResult.templates.length);

  const warnings = [
    ...titanResult.warnings,
    ...bannerResult.warnings,
    ...manipleResult.warnings,
    ...legionResult.warnings,
    ...upgradeResult.warnings,
    ...princepsResult.warnings,
  ];

  const payload = {
    titans: titanResult.templates,
    banners: bannerResult.templates,
    maniples: manipleResult.maniples,
    legions: legionResult.legions,
    upgrades: upgradeResult.upgrades,
    princepsTraits: princepsResult.traits,
    warnings,
  };

  const outputPath = getOutputPath();
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  fs.writeFileSync(outputPath, JSON.stringify(payload, null, 2), 'utf-8');
  console.log('Wrote', outputPath);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
