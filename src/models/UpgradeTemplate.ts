export interface UpgradeTemplate {
  id: string;
  name: string;
  points: number;
  rules: string[];
  sourceGroup: 'universal' | 'loyalist' | 'traitor';
  // Optional filters from BattleScribe metadata
  legioKeys?: string[]; // e.g. ["LegioMortis"]
  excludedTitanTemplateIds?: string[]; // stable titan template ids (e.g. "reaver")
}

