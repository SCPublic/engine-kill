export interface UpgradeTemplate {
  id: string;
  name: string;
  points: number;
  rules: string[];
  sourceGroup: 'universal' | 'loyalist' | 'traitor';
  // Optional filters from BattleScribe metadata
  legioKeys?: string[]; // e.g. ["LegioMortis"]
  excludedTitanTemplateIds?: string[]; // stable titan template ids (e.g. "reaver")
  /** If true, only show in upgrade picker for banners (e.g. Meltaguns). */
  bannerOnly?: boolean;
  /** If true, do not show in upgrade picker for titans; they use a toggle instead (e.g. Princeps Seniores). */
  titanToggleOnly?: boolean;
}

