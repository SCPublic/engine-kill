/**
 * One-off script: load all titan templates from BattleScribe (network), collect every
 * weapon key (name|mountType), then ensure titan-data/engine-kill/weapon-metadata.json
 * has an entry for each with at least repairRoll: "4+" (and default disabledRollLines
 * if missing). Run from engine-kill: npx tsx scripts/sync-weapon-metadata.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { loadAllTitanTemplatesFromBattleScribe } from '../src/adapters/battlescribe/battlescribeAdapter';

const DEFAULT_DISABLED_ROLL_LINES = [
  '9-12: Detonation {Body, S7}',
  '13+: Detonation {Body, S9}',
];

async function main() {
  console.log('Loading titan templates from BattleScribe (network)...');
  const result = await loadAllTitanTemplatesFromBattleScribe();
  const keys = new Set<string>();
  for (const t of result.templates) {
    for (const w of t.availableWeapons) {
      const key = `${(w.name || '').trim().toLowerCase()}|${w.mountType}`;
      keys.add(key);
    }
  }
  console.log('Weapon keys from catalog:', keys.size);

  const cwd = process.cwd();
  const candidates = [
    path.join(cwd, '..', 'titan-data', 'engine-kill', 'weapon-metadata.json'),
    path.join(cwd, 'titan-data', 'engine-kill', 'weapon-metadata.json'),
  ];
  let metadataPath: string | null = null;
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      metadataPath = p;
      break;
    }
  }
  if (!metadataPath) {
    console.error('Could not find titan-data/engine-kill/weapon-metadata.json. Tried:', candidates);
    process.exit(1);
  }
  console.log('Using:', metadataPath);

  const existing: Record<string, { repairRoll?: string; disabledRollLines?: string[] }> = JSON.parse(
    fs.readFileSync(metadataPath, 'utf-8')
  );

  let added = 0;
  let updated = 0;
  for (const k of keys) {
    const ent = existing[k];
    if (!ent) {
      existing[k] = { repairRoll: '4+', disabledRollLines: DEFAULT_DISABLED_ROLL_LINES };
      added++;
    } else if (!ent.repairRoll) {
      existing[k] = { ...ent, repairRoll: '4+', disabledRollLines: ent.disabledRollLines ?? DEFAULT_DISABLED_ROLL_LINES };
      updated++;
    }
  }

  fs.writeFileSync(metadataPath, JSON.stringify(existing, null, 2), 'utf-8');
  console.log('Done. Added', added, 'entries, set repairRoll 4+ on', updated, 'existing. Total entries:', Object.keys(existing).length);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
